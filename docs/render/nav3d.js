/* Bể Kính · render/nav3d.js · Lối đi của người trên một đảo
 * Mọi chuyện "đi đường" của người (render/village3d.js chỉ hỏi ở đây, không tự tính):
 *   routeTo(from, to)  các điểm phải đi qua: theo mạng đường của đảo (render/build/roads.js isleNet), đường ngắn nhất, trên vỉa
 *                      hè, giữ bên đang đi, chỉ sang đường ở chỗ có vạch (roads.js crossIdx)
 *   follow(f, goal)    đích của khung hình này cho một người đang đi theo lối (tự tìm lại khi đích đổi)
 *   offCarriage(v)     chỗ đứng rơi vào lòng đường thì lùi ra vỉa hè
 *   keepInside(pos)    không ai ra quá vòng tường thành
 *   strollGoal(f)      đi dạo dọc phố; hallGoal(f): đi dạo vòng quanh nhà chính
 *   reset()            chỗ trên đảo đổi (sang thời): dựng lại mạng lối đi
 *   clearPt(v, farm)   chỗ đứng rơi vào trong chân một công trình thì ra ngoài mép (places().solids, render/buildings3d.js)
 *   detour(from, to)   đường thẳng tới đích vướng công trình: điểm kế tiếp trên đường đi vòng (lưới ô, A*; null: không vướng)
 *   pushOut(pos, max)  người lỡ ở trong chân công trình (công trình vừa khởi công chỗ người đứng): bước dần ra ngoài
 * o: { THREE, L (đảo), level() (thời đang vẽ), places() (chỗ của công trình, render/buildings3d.js places) }.
 * Cần: three.js, render/build/roads.js, render/build/plains/town.js (ROAD_W, WALKS). */
(function (root) {
  const BK = root.BK || (root.BK = {});
  function create(o) {
    const { THREE, L } = o;
    const NET = BK.Roads3D && L.rOf && L.inw ? BK.Roads3D.isleNet(L, L.ter) : null;
    /* ---------- Lối đi: không đi xuyên tường, xuyên nhà ----------
     * Mạng lối đi của đảo: các điểm của vòng đường và đường toả (render/build/roads.js), nối chỗ giao nhau, thêm một nút giữa
     * sân trước nhà chính nối với đầu trong các đường toả. Đi xa (hơn NAV_NEAR) thì: từ chỗ đang đứng ra điểm đường gần nhất,
     * theo đường ngắn nhất trên mạng (Dijkstra), rồi từ điểm đường gần đích vào tận nơi; đi trên vỉa hè bên phải. Thêm vào đó,
     * không ai ra quá vòng tường (mép đảo trừ WALL_IN): tường thành chỉ có thể đi qua ở chỗ hở, mà chẳng ai cần ra ngoài. */
    const NAV_NEAR = 9,
      WALL_IN = 5.8; // tường cách mép 2,6–3,5, dày tới 1,7 về mỗi phía (hàng bụi tròn thời 9): chừa thêm 0,6
    // khoảng lệch từ tim đường ra giữa vỉa hè (từ thời 3 có vỉa hè; trước đó đi sát mép lối đất)
    const sideOff = () => {
      const T = BK.Plains3D && BK.Plains3D.TOWN,
        lv = o.level(),
        w = T ? T.ROAD_W[lv] || 2.4 : 2.4,
        hasWalk = T && T.WALKS[lv];
      return w / 2 + (hasWalk ? BK.Roads3D.WALK / 2 : 0.3);
    };
    let NAV = null;
    function buildNav() {
      const pts = [],
        adj = [],
        add = (x, z) => {
          pts.push([x, z]);
          adj.push([]);
          return pts.length - 1;
        };
      const link = (a, b) => {
        if (a === b) return;
        const d = Math.hypot(pts[a][0] - pts[b][0], pts[a][1] - pts[b][1]);
        adj[a].push([b, d]);
        adj[b].push([a, d]);
      };
      const loop = NET.loop.map(([x, z]) => add(x, z));
      loop.forEach((id, i) => link(id, loop[(i + 1) % loop.length]));
      const near = (id, list) => {
        let b = -1,
          bd = 1e18;
        for (const j of list) {
          const d = (pts[j][0] - pts[id][0]) ** 2 + (pts[j][1] - pts[id][1]) ** 2;
          if (d < bd) {
            bd = d;
            b = j;
          }
        }
        return [b, Math.sqrt(bd)];
      };
      const spokes = NET.spokes.map((sp) => {
        const ids = sp.map(([x, z]) => add(x, z));
        for (let i = 0; i + 1 < ids.length; i++) link(ids[i], ids[i + 1]);
        return ids;
      });
      for (const ids of spokes)
        for (const id of ids) {
          const [j, d] = near(id, loop);
          if (d < 3.2) link(id, j);
        } // chỗ đường toả cắt vòng đường
      // chỗ hai đường toả (hay cung đường vòng ngoài, render/build/roads.js ARCS) gặp nhau
      spokes.forEach((ids, a) =>
        spokes.forEach((jds, b) => {
          if (b <= a) return;
          for (const id of ids) {
            const [j, d] = near(id, jds);
            if (d < 2.2) link(id, j);
          }
        }),
      );
      const PL = o.places(),
        c0 = PL && PL.podium ? PL.podium : { x: 0, z: 0 },
        center = add(c0.x, c0.z);
      for (const ids of spokes) if (Math.hypot(pts[ids[0]][0] - c0.x, pts[ids[0]][1] - c0.z) < 22) link(center, ids[0]); // sân giữa nối đầu trong các đường toả
      // hướng chuẩn của từng điểm (vòng: theo chiều tăng chỉ số; đường toả: hướng ra ngoài) để biết người đang ở vỉa hè bên nào
      const tan = pts.map(() => null),
        n = loop.length;
      loop.forEach((id, i) => {
        const a = pts[loop[(i + 1) % n]],
          b = pts[loop[(i - 1 + n) % n]];
        tan[id] = [a[0] - b[0], a[1] - b[1]];
      });
      for (const ids of spokes)
        ids.forEach((id, i) => {
          const a = pts[ids[Math.min(ids.length - 1, i + 1)]],
            b = pts[ids[Math.max(0, i - 1)]];
          tan[id] = [a[0] - b[0], a[1] - b[1]];
        });
      const cross = new Set(BK.Roads3D.crossIdx({ loop: NET.loop, spokes: NET.spokes }).map((j) => loop[j])); // chỗ có vạch qua đường
      return { pts, adj, tan, cross, loopSegs: loop.map((id, i) => [...pts[id], ...pts[loop[(i + 1) % n]]]) };
    }
    function nearestNode(x, z) {
      let b = 0,
        bd = 1e18;
      NAV.pts.forEach(([px, pz], i) => {
        const d = (px - x) ** 2 + (pz - z) ** 2;
        if (d < bd) {
          bd = d;
          b = i;
        }
      });
      return b;
    }
    function pathNodes(a, b) {
      const n = NAV.pts.length,
        dist = new Float64Array(n).fill(1e18),
        prev = new Int32Array(n).fill(-1),
        done = new Uint8Array(n);
      dist[a] = 0;
      for (let it = 0; it < n; it++) {
        let u = -1,
          ud = 1e18;
        for (let i = 0; i < n; i++)
          if (!done[i] && dist[i] < ud) {
            ud = dist[i];
            u = i;
          }
        if (u < 0 || u === b) break;
        done[u] = 1;
        for (const [v, w] of NAV.adj[u])
          if (dist[u] + w < dist[v]) {
            dist[v] = dist[u] + w;
            prev[v] = u;
          }
      }
      const out = [];
      for (let v = b; v >= 0; v = prev[v]) out.push(v);
      return out.reverse();
    }
    // các điểm phải đi qua từ from tới to (Vector3, toạ độ đảo)
    function routeTo(from, to) {
      if (!NET) return [to];
      if (!NAV) NAV = buildNav();
      // gần mà không phải băng qua vòng đường (chỗ xe chạy) thì đi thẳng
      if (Math.hypot(to.x - from.x, to.z - from.z) < NAV_NEAR && !NAV.loopSegs.some((S) => cuts(from.x, from.z, to.x, to.z, S)))
        return [to];
      const a = nearestNode(from.x, from.z),
        b = nearestNode(to.x, to.z);
      if (a === b) return [to];
      const ids = pathNodes(a, b),
        out = [],
        off = sideOff();
      // đi trên vỉa hè, giữ đúng bên đang đi; chỉ sang đường ở chỗ có vạch (chỗ có vạch cuối cùng trên đường đi, sang cho đúng bên
      // của nơi cần tới); không có vạch nào thì sang ở điểm cuối
      let last = -1;
      ids.forEach((id, k) => {
        if (NAV.cross.has(id)) last = k;
      });
      let cx = from.x,
        cz = from.z;
      const sideAt = (id, x, z) => {
        const t = NAV.tan[id],
          [px, pz] = NAV.pts[id],
          l = Math.hypot(t[0], t[1]) || 1,
          nx = t[1] / l,
          nz = -t[0] / l;
        return [Math.sign((x - px) * nx + (z - pz) * nz) || 1, nx, nz];
      };
      ids.forEach((id, k) => {
        const [px, pz] = NAV.pts[id];
        if (!NAV.tan[id]) {
          out.push(new THREE.Vector3(px, 0, pz));
          cx = px;
          cz = pz;
          return;
        } // giữa sân
        let [sd, nx, nz] = sideAt(id, cx, cz);
        out.push(new THREE.Vector3(px + nx * sd * off, 0, pz + nz * sd * off));
        if (k === last || (last < 0 && k === ids.length - 1)) {
          const [want] = sideAt(id, to.x, to.z);
          if (want !== sd) {
            sd = want;
            out.push(new THREE.Vector3(px + nx * sd * off, 0, pz + nz * sd * off));
          }
        } // sang đường ở vạch
        cx = out[out.length - 1].x;
        cz = out[out.length - 1].z;
      });
      out.push(to.clone());
      return out;
    }
    // đoạn (x0, z0)-(x1, z1) có cắt đoạn S không
    function cuts(x0, z0, x1, z1, [a0, b0, a1, b1]) {
      const d = (x1 - x0) * (b1 - b0) - (z1 - z0) * (a1 - a0);
      if (Math.abs(d) < 1e-9) return false;
      const u = ((a0 - x0) * (b1 - b0) - (b0 - z0) * (a1 - a0)) / d,
        v = ((a0 - x0) * (z1 - z0) - (b0 - z0) * (x1 - x0)) / d;
      return u > 0 && u < 1 && v > 0 && v < 1;
    }
    // chỗ đứng (trước cửa, trước chỗ làm) rơi vào lòng đường thì lùi ra vỉa hè phía bên đó: không ai đứng giữa đường xe chạy
    function offCarriage(v) {
      if (!L.roadSegs) return v;
      const R = BK.Roads3D,
        T = BK.Plains3D && BK.Plains3D.TOWN,
        half = (T ? T.ROAD_W[o.level()] || 2.4 : 2.4) / 2,
        need = sideOff();
      for (let it = 0; it < 3; it++) {
        let best = null,
          bd = 1e9;
        for (const S of L.roadSegs) {
          const d = R.segDist(v.x, v.z, S);
          if (d < bd) {
            bd = d;
            best = S;
          }
        }
        if (bd >= half + 0.2) break;
        const [x0, z0, x1, z1] = best,
          dx = x1 - x0,
          dz = z1 - z0,
          t = Math.max(0, Math.min(1, ((v.x - x0) * dx + (v.z - z0) * dz) / (dx * dx + dz * dz || 1))),
          fx = x0 + dx * t,
          fz = z0 + dz * t;
        let nx = v.x - fx,
          nz = v.z - fz,
          nl = Math.hypot(nx, nz);
        if (nl < 1e-3) {
          nx = -fx;
          nz = -fz;
          nl = Math.hypot(nx, nz) || 1;
        } // đúng tim đường: lùi về phía trong đảo
        v.set(fx + (nx / nl) * need, 0, fz + (nz / nl) * need);
      }
      return v;
    }
    // (mép tính như chỗ đặt tường: chỗ hẹp nhất quanh hướng đó, render/build/plains/town.js edgeWall; mép đảo lượn gấp thì
    // tường lùi vào theo chỗ hẹp, người cũng phải lùi theo)
    function keepInside(pos) {
      const a = Math.atan2(pos.z, pos.x),
        R = Math.min(L.rOf(a), L.rOf(a - 0.06), L.rOf(a + 0.06)) - WALL_IN,
        r = Math.hypot(pos.x, pos.z);
      if (r > R) pos.multiplyScalar(R / r);
    }
    /* ---------- Đi dạo dọc phố ----------
     * Người đi đường (chỗ 'stroll') đi theo mạng đường của đảo (render/build/roads.js isleNet): dọc vòng đường một quãng, có khi
     * rẽ ra một đường toả tới gần cổng rồi quay lại; đi trên vỉa hè bên phải, không đi giữa đường xe chạy. */
    function newRoute(f) {
      const loop = NET.loop,
        n = loop.length;
      let bi = 0,
        bd = 1e18;
      for (let i = 0; i < n; i++) {
        const d = (loop[i][0] - f.pos.x) ** 2 + (loop[i][1] - f.pos.z) ** 2;
        if (d < bd) {
          bd = d;
          bi = i;
        }
      }
      const dir = Math.random() < 0.5 ? 1 : -1,
        len = 6 + Math.floor(Math.random() * 16),
        pts = [];
      for (let k = 0; k <= len; k++) pts.push(loop[(((bi + dir * k) % n) + n) % n]);
      if (NET.spokes.length && Math.random() < 0.35) {
        // rẽ ra một đường toả gần chỗ dừng, đi gần tới cổng rồi quay lại
        const end = pts[pts.length - 1];
        let bs = null,
          bsd = 1e18;
        for (const sp of NET.spokes) {
          const d = (sp[0][0] - end[0]) ** 2 + (sp[0][1] - end[1]) ** 2;
          if (d < bsd) {
            bsd = d;
            bs = sp;
          }
        }
        if (bs && bsd < 120) {
          const out = bs.slice(0, Math.max(2, bs.length - 3));
          pts.push(...out, ...out.slice().reverse());
        }
      }
      f.route = pts;
      f.ri = 0;
    }
    function strollGoal(f) {
      if (!NET) return null;
      if (!f.route || f.ri >= f.route.length) newRoute(f);
      const a = f.route[f.ri],
        b = f.route[Math.min(f.route.length - 1, f.ri + 1)];
      let dx = b[0] - a[0],
        dz = b[1] - a[1];
      const l = Math.hypot(dx, dz) || 1;
      dx /= l;
      dz /= l;
      const side = sideOff() + ((f.p.id % 3) - 1) * 0.12,
        p = new THREE.Vector3(a[0] + dz * side, 0, a[1] - dx * side); // vỉa hè bên phải theo hướng đi
      const d2 = (p.x - f.pos.x) ** 2 + (p.z - f.pos.z) ** 2;
      if (d2 < 0.6) {
        f.ri++;
      }
      return { p, face: null, road: d2 < 16 }; // còn xa vòng đi dạo (mới ra khỏi nhà): đi theo lối đi tới đó trước
    }
    // vòng đi dạo quanh nhà chính: một vòng cách tường nhà chính khoảng 2,5, chiều đi theo từng người
    function hallGoal(f) {
      const PL = o.places();
      if (!PL || !PL.hallC) return null;
      const R = PL.hallR + 2.5,
        n = 16,
        dir = f.p.id % 2 ? 1 : -1;
      if (f.hk == null || f.hkR !== R) {
        const a0 = Math.atan2(f.pos.z - PL.hallC.z, f.pos.x - PL.hallC.x);
        f.hk = Math.round((a0 / (Math.PI * 2)) * n);
        f.hkR = R;
      }
      const a = ((f.hk % n) / n) * Math.PI * 2,
        p = new THREE.Vector3(PL.hallC.x + Math.cos(a) * R, 0, PL.hallC.z + Math.sin(a) * R);
      const d2 = (p.x - f.pos.x) ** 2 + (p.z - f.pos.z) ** 2;
      if (d2 < 0.8) f.hk += dir;
      return { p, face: null, road: d2 < 16 };
    }
    // đích của khung hình này: đích đổi thì tìm đường lại, đi lần lượt qua từng điểm; chặng cuối bám theo đích (người mình đang
    // nói chuyện có thể nhích đi)
    function follow(f, goal) {
      if (!f.nav || f.nav.dest.distanceToSquared(goal.p) > 2.25) f.nav = { dest: goal.p.clone(), pts: routeTo(f.pos, goal.p), i: 0 };
      const N = f.nav;
      while (N.i < N.pts.length - 1 && (N.pts[N.i].x - f.pos.x) ** 2 + (N.pts[N.i].z - f.pos.z) ** 2 < 0.8) N.i++;
      if (N.i === N.pts.length - 1) {
        N.pts[N.i] = goal.p;
        return goal;
      }
      return { p: N.pts[N.i], face: null };
    }
    /* ---------- Không đi xuyên nhà (design/ke-hoach-buoc-14.md mục 7) ----------
     * Mỗi công trình đang đứng là một khung chữ nhật theo trục của nó (places().solids). Đích nằm trong khung thì dời ra mép gần
     * nhất (không đẩy sang nhà bên cạnh); đường thẳng tới đích vướng khung thì đi vòng theo lưới ô (detour); ai lỡ ở trong khung
     * thì bước dần ra (không nhảy chỗ). Lề quanh khung: nhà 0,35; cột đèn, gốc cây dọc phố (B.m) lề nhỏ. */
    const PUSH = 0.35,
      mOf = (B) => (B.m != null ? B.m : PUSH);
    // farm: người làm ruộng (vào được chỗ mềm: ruộng, nhà kính)
    // (BK.NAV_SOLIDS = false: tắt, để so khi đo)
    const solids = (farm) => {
      const PL = o.places(),
        all = (PL && PL.solids && BK.NAV_SOLIDS !== false && PL.solids) || [];
      return farm ? all.filter((B) => !B.soft) : all;
    };
    const toL = (B, x, z) => {
      const dx = x - B.x,
        dz = z - B.z;
      return [dx * B.c - dz * B.s, dx * B.s + dz * B.c];
    };
    const toW = (B, lx, lz, y) => new THREE.Vector3(B.x + lx * B.c + lz * B.s, y || 0, B.z - lx * B.s + lz * B.c);
    // khung nào chứa điểm (nới ra m): độ sâu vào trong và hướng ra ngắn nhất (theo trục khung)
    function inside(B, x, z, m) {
      const [lx, lz] = toL(B, x, z);
      if (lx <= B.x0 - m || lx >= B.x1 + m || lz <= B.z0 - m || lz >= B.z1 + m) return null;
      const o4 = [
        [lx - (B.x0 - m), -1, 0],
        [B.x1 + m - lx, 1, 0],
        [lz - (B.z0 - m), 0, -1],
        [B.z1 + m - lz, 0, 1],
      ].sort((a, b) => a[0] - b[0])[0];
      return { lx, lz, d: o4[0], ux: o4[1], uz: o4[2] };
    }
    // chỗ ra gần nhất từ (x, z) tới ngoài mọi khung (hai nhà đứng sát nhau: không đẩy từ nhà này vào nhà kia); null nếu không ở trong khung nào
    function exitOf(x, z, farm) {
      const all = solids(farm),
        inn = all.filter((B) => inside(B, x, z, mOf(B)));
      if (!inn.length) return null;
      let best = null,
        bd = 1e9,
        any = null,
        ad = 1e9;
      for (const B of inn) {
        const [lx, lz] = toL(B, x, z);
        const M = mOf(B) + 0.02;
        for (const [tx, tz] of [
          [B.x0 - M, lz],
          [B.x1 + M, lz],
          [lx, B.z0 - M],
          [lx, B.z1 + M],
        ]) {
          const w = toW(B, tx, tz),
            d = Math.hypot(w.x - x, w.z - z);
          if (d < ad) {
            ad = d;
            any = w;
          }
          if (d < bd && !all.some((C) => inside(C, w.x, w.z, mOf(C) - 0.01))) {
            bd = d;
            best = w;
          }
        }
      }
      return best || any;
    }
    function clearPt(v, farm) {
      let p = v;
      for (let pass = 0; pass < 4; pass++) {
        const e = exitOf(p.x, p.z, farm);
        if (!e) break;
        p = new THREE.Vector3(e.x, v.y, e.z);
      }
      return p;
    }
    // (vừa bước lấn vào mép khung, còn nông hơn SNAP: ra hẳn ngay, bước lấn nhỏ nên không thấy giật; trước đây chỉ lùi dần
    // nên người đi chéo cắt được qua góc nhà. Ở sâu trong khung, do công trình vừa mọc lên chỗ đang đứng: bước ra nhanh gấp ba)
    const SNAP = 0.9;
    function pushOut(pos, max, farm) {
      const e = exitOf(pos.x, pos.z, farm);
      if (!e) return;
      const dx = e.x - pos.x,
        dz = e.z - pos.z,
        d = Math.hypot(dx, dz) || 1,
        k = d <= SNAP ? 1 : Math.min(1, (max * 3) / d);
      pos.x += dx * k;
      pos.z += dz * k;
    }
    /* Đi vòng bằng lưới ô (0,5 đơn vị): ô bị chiếm là ô nằm trong lề của một khung. Đường thẳng tới đích vướng ô bị chiếm thì tìm
     * đường ngắn nhất trên lưới (A*, tám hướng), rồi kéo thẳng (bỏ các điểm giữa nhìn thấy nhau được), đi lần lượt từng điểm.
     * Hai nhà đứng sát nhau mà khe hẹp quá thì coi như liền một khối: người đi vòng ra ngoài, không chen vào khe rồi kẹt. Lưới dựng
     * lại khi danh sách khung đổi (công trình mới dựng, sang thời). */
    const CELL = 0.5,
      HALF_G = 76,
      NG = Math.ceil((2 * HALF_G) / CELL),
      grids = [null, null];
    const cellOf = (v) => Math.floor((v + HALF_G) / CELL),
      centerOf = (i) => (i + 0.5) * CELL - HALF_G;
    function gridOf(farm) {
      const list = solids(farm);
      let h = list.length;
      for (const B of list) h += B.x * 3.1 + B.z * 7.3 + (B.x1 - B.x0) * 1.7 + (B.z1 - B.z0) * 0.9 + B.c;
      const key = list.length + ':' + h.toFixed(3),
        G = grids[farm ? 1 : 0];
      if (G && G.key === key) return G;
      const g = new Uint8Array(NG * NG);
      for (const B of list) {
        const m = mOf(B) + 0.1,
          cs = [
            [B.x0 - m, B.z0 - m],
            [B.x1 + m, B.z0 - m],
            [B.x1 + m, B.z1 + m],
            [B.x0 - m, B.z1 + m],
          ].map(([lx, lz]) => toW(B, lx, lz));
        const i0 = Math.max(0, cellOf(Math.min(...cs.map((q) => q.x)))),
          i1 = Math.min(NG - 1, cellOf(Math.max(...cs.map((q) => q.x)))),
          j0 = Math.max(0, cellOf(Math.min(...cs.map((q) => q.z)))),
          j1 = Math.min(NG - 1, cellOf(Math.max(...cs.map((q) => q.z))));
        for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) if (inside(B, centerOf(i), centerOf(j), m)) g[j * NG + i] = 1;
      }
      return (grids[farm ? 1 : 0] = { key, g });
    }
    const blockedAt = (G, x, z) => {
      const i = cellOf(x),
        j = cellOf(z);
      return i >= 0 && j >= 0 && i < NG && j < NG && G.g[j * NG + i] === 1;
    };
    // đi thẳng từ a tới b không vướng ô bị chiếm (bỏ qua đoạn đầu khi a đang đứng sát mép, trong lề)
    function clearLine(G, a, b) {
      const d = Math.hypot(b.x - a.x, b.z - a.z),
        n = Math.ceil(d / 0.25),
        s0 = blockedAt(G, a.x, a.z);
      for (let k = 1; k <= n; k++) {
        const u = k / n;
        if (s0 && u * d < 0.6) continue;
        if (blockedAt(G, a.x + (b.x - a.x) * u, a.z + (b.z - a.z) * u)) return false;
      }
      return true;
    }
    function aStar(G, from, to) {
      const si = cellOf(from.x),
        sj = cellOf(from.z);
      let gi = cellOf(to.x),
        gj = cellOf(to.z);
      if (G.g[gj * NG + gi]) {
        let best = null,
          bd = 1e9;
        for (let r = 1; r < 8 && !best; r++)
          for (let dj = -r; dj <= r; dj++)
            for (let di = -r; di <= r; di++) {
              const i = gi + di,
                j = gj + dj;
              if (i < 0 || j < 0 || i >= NG || j >= NG || G.g[j * NG + i]) continue;
              const d = di * di + dj * dj;
              if (d < bd) {
                bd = d;
                best = [i, j];
              }
            }
        if (!best) return null;
        [gi, gj] = best;
      }
      const N = NG * NG,
        cost = new Float32Array(N).fill(1e9),
        prev = new Int32Array(N).fill(-1),
        heap = [],
        start = sj * NG + si,
        goal = gj * NG + gi;
      const push = (k, f) => {
        heap.push([f, k]);
        let c = heap.length - 1;
        while (c) {
          const p2 = (c - 1) >> 1;
          if (heap[p2][0] <= heap[c][0]) break;
          [heap[p2], heap[c]] = [heap[c], heap[p2]];
          c = p2;
        }
      };
      const pop = () => {
        const top = heap[0],
          last = heap.pop();
        if (heap.length) {
          heap[0] = last;
          let c = 0;
          for (;;) {
            const l = 2 * c + 1,
              r = l + 1;
            let m = c;
            if (l < heap.length && heap[l][0] < heap[m][0]) m = l;
            if (r < heap.length && heap[r][0] < heap[m][0]) m = r;
            if (m === c) break;
            [heap[m], heap[c]] = [heap[c], heap[m]];
            c = m;
          }
        }
        return top;
      };
      const hOf = (k) => Math.hypot((k % NG) - gi, Math.floor(k / NG) - gj);
      cost[start] = 0;
      push(start, hOf(start));
      let it = 0;
      while (heap.length && it++ < 60000) {
        const [, k] = pop();
        if (k === goal) break;
        const i = k % NG,
          j = Math.floor(k / NG);
        for (let dj = -1; dj <= 1; dj++)
          for (let di = -1; di <= 1; di++) {
            if (!di && !dj) continue;
            const ni = i + di,
              nj = j + dj;
            if (ni < 0 || nj < 0 || ni >= NG || nj >= NG) continue;
            const nk = nj * NG + ni;
            if (G.g[nk] && nk !== goal) continue;
            if (di && dj && (G.g[j * NG + ni] || G.g[nj * NG + i])) continue; // (không lách chéo qua góc hai ô bị chiếm)
            const c = cost[k] + (di && dj ? 1.414 : 1);
            if (c < cost[nk]) {
              cost[nk] = c;
              prev[nk] = k;
              push(nk, c + hOf(nk));
            }
          }
      }
      if (prev[goal] < 0 && goal !== start) return null;
      const cells = [];
      for (let k = goal; k >= 0 && k !== start; k = prev[k])
        cells.push(new THREE.Vector3(centerOf(k % NG), 0, centerOf(Math.floor(k / NG))));
      cells.reverse();
      cells.push(to.clone());
      // kéo thẳng: từ chỗ đang đứng, đi thẳng tới điểm xa nhất còn nhìn thấy được
      const out = [];
      let cur = from,
        i = 0;
      while (i < cells.length && out.length < 40) {
        let j = cells.length - 1;
        while (j > i && !clearLine(G, cur, cells[j])) j--;
        out.push(cells[j]);
        cur = cells[j];
        i = j + 1;
      }
      return out;
    }
    // mem (người đang đi): giữ đường đã tìm tới khi tới nơi hay đích đổi; null: đi thẳng được
    function detour(from, to, farm, mem) {
      const G = gridOf(farm);
      if (mem && mem.path && mem.pathTo.distanceToSquared(to) < 1 && mem.pathKey === G.key) {
        while (mem.pi < mem.path.length - 1 && Math.hypot(mem.path[mem.pi].x - from.x, mem.path[mem.pi].z - from.z) < 0.45) mem.pi++;
        if (clearLine(G, from, to)) {
          mem.path = null;
          return null;
        }
        return mem.path[mem.pi];
      }
      if (mem) mem.path = null;
      if (clearLine(G, from, to)) return null;
      const path = aStar(G, from, to);
      if (!path || !path.length) return null;
      if (mem) {
        mem.path = path;
        mem.pi = 0;
        mem.pathTo = to.clone();
        mem.pathKey = G.key;
      }
      return path[0];
    }
    const reset = () => {
      NAV = null;
    };
    return { routeTo, follow, offCarriage, keepInside, strollGoal, hallGoal, reset, clearPt, detour, pushOut, net: NET };
  }
  BK.Nav3D = { create };
})(typeof self !== 'undefined' ? self : globalThis);
