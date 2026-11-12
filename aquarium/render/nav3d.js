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
 *   detour(from, to)   đường thẳng tới đích cắt qua một công trình: góc nhà để đi vòng qua (null: không vướng)
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
    const NAV_NEAR = 9, WALL_IN = 5.2;
    // khoảng lệch từ tim đường ra giữa vỉa hè (từ thời 3 có vỉa hè; trước đó đi sát mép lối đất)
    const sideOff = () => { const T = BK.Plains3D && BK.Plains3D.TOWN, lv = o.level(), w = T ? T.ROAD_W[lv] || 2.4 : 2.4, hasWalk = T && T.WALKS[lv]; return w / 2 + (hasWalk ? BK.Roads3D.WALK / 2 : 0.3); };
    let NAV = null;
    function buildNav() {
      const pts = [], adj = [], add = (x, z) => { pts.push([x, z]); adj.push([]); return pts.length - 1; };
      const link = (a, b) => { if (a === b) return; const d = Math.hypot(pts[a][0] - pts[b][0], pts[a][1] - pts[b][1]); adj[a].push([b, d]); adj[b].push([a, d]); };
      const loop = NET.loop.map(([x, z]) => add(x, z)); loop.forEach((id, i) => link(id, loop[(i + 1) % loop.length]));
      const near = (id, list) => { let b = -1, bd = 1e18; for (const j of list) { const d = (pts[j][0] - pts[id][0]) ** 2 + (pts[j][1] - pts[id][1]) ** 2; if (d < bd) { bd = d; b = j; } } return [b, Math.sqrt(bd)]; };
      const spokes = NET.spokes.map((sp) => { const ids = sp.map(([x, z]) => add(x, z)); for (let i = 0; i + 1 < ids.length; i++) link(ids[i], ids[i + 1]); return ids; });
      for (const ids of spokes) for (const id of ids) { const [j, d] = near(id, loop); if (d < 3.2) link(id, j); } // chỗ đường toả cắt vòng đường
      const PL = o.places(), c0 = PL && PL.podium ? PL.podium : { x: 0, z: 0 }, center = add(c0.x, c0.z);
      for (const ids of spokes) if (Math.hypot(pts[ids[0]][0] - c0.x, pts[ids[0]][1] - c0.z) < 22) link(center, ids[0]); // sân giữa nối đầu trong các đường toả
      // hướng chuẩn của từng điểm (vòng: theo chiều tăng chỉ số; đường toả: hướng ra ngoài) để biết người đang ở vỉa hè bên nào
      const tan = pts.map(() => null), n = loop.length;
      loop.forEach((id, i) => { const a = pts[loop[(i + 1) % n]], b = pts[loop[(i - 1 + n) % n]]; tan[id] = [a[0] - b[0], a[1] - b[1]]; });
      for (const ids of spokes) ids.forEach((id, i) => { const a = pts[ids[Math.min(ids.length - 1, i + 1)]], b = pts[ids[Math.max(0, i - 1)]]; tan[id] = [a[0] - b[0], a[1] - b[1]]; });
      const cross = new Set(BK.Roads3D.crossIdx({ loop: NET.loop, spokes: NET.spokes }).map((j) => loop[j])); // chỗ có vạch qua đường
      return { pts, adj, tan, cross, loopSegs: loop.map((id, i) => [...pts[id], ...pts[loop[(i + 1) % n]]]) };
    }
    function nearestNode(x, z) { let b = 0, bd = 1e18; NAV.pts.forEach(([px, pz], i) => { const d = (px - x) ** 2 + (pz - z) ** 2; if (d < bd) { bd = d; b = i; } }); return b; }
    function pathNodes(a, b) {
      const n = NAV.pts.length, dist = new Float64Array(n).fill(1e18), prev = new Int32Array(n).fill(-1), done = new Uint8Array(n); dist[a] = 0;
      for (let it = 0; it < n; it++) { let u = -1, ud = 1e18; for (let i = 0; i < n; i++) if (!done[i] && dist[i] < ud) { ud = dist[i]; u = i; } if (u < 0 || u === b) break; done[u] = 1; for (const [v, w] of NAV.adj[u]) if (dist[u] + w < dist[v]) { dist[v] = dist[u] + w; prev[v] = u; } }
      const out = []; for (let v = b; v >= 0; v = prev[v]) out.push(v); return out.reverse();
    }
    // các điểm phải đi qua từ from tới to (Vector3, toạ độ đảo)
    function routeTo(from, to) {
      if (!NET) return [to];
      if (!NAV) NAV = buildNav();
      // gần mà không phải băng qua vòng đường (chỗ xe chạy) thì đi thẳng
      if (Math.hypot(to.x - from.x, to.z - from.z) < NAV_NEAR && !NAV.loopSegs.some((S) => cuts(from.x, from.z, to.x, to.z, S))) return [to];
      const a = nearestNode(from.x, from.z), b = nearestNode(to.x, to.z); if (a === b) return [to];
      const ids = pathNodes(a, b), out = [], off = sideOff();
      // đi trên vỉa hè, giữ đúng bên đang đi; chỉ sang đường ở chỗ có vạch (chỗ có vạch cuối cùng trên đường đi, sang cho đúng bên
      // của nơi cần tới); không có vạch nào thì sang ở điểm cuối
      let last = -1; ids.forEach((id, k) => { if (NAV.cross.has(id)) last = k; });
      let cx = from.x, cz = from.z;
      const sideAt = (id, x, z) => { const t = NAV.tan[id], [px, pz] = NAV.pts[id], l = Math.hypot(t[0], t[1]) || 1, nx = t[1] / l, nz = -t[0] / l; return [Math.sign((x - px) * nx + (z - pz) * nz) || 1, nx, nz]; };
      ids.forEach((id, k) => {
        const [px, pz] = NAV.pts[id];
        if (!NAV.tan[id]) { out.push(new THREE.Vector3(px, 0, pz)); cx = px; cz = pz; return; } // giữa sân
        let [sd, nx, nz] = sideAt(id, cx, cz);
        out.push(new THREE.Vector3(px + nx * sd * off, 0, pz + nz * sd * off));
        if (k === last || (last < 0 && k === ids.length - 1)) { const [want] = sideAt(id, to.x, to.z); if (want !== sd) { sd = want; out.push(new THREE.Vector3(px + nx * sd * off, 0, pz + nz * sd * off)); } } // sang đường ở vạch
        cx = out[out.length - 1].x; cz = out[out.length - 1].z;
      });
      out.push(to.clone()); return out;
    }
    // đoạn (x0, z0)-(x1, z1) có cắt đoạn S không
    function cuts(x0, z0, x1, z1, [a0, b0, a1, b1]) { const d = (x1 - x0) * (b1 - b0) - (z1 - z0) * (a1 - a0); if (Math.abs(d) < 1e-9) return false;
        const u = ((a0 - x0) * (b1 - b0) - (b0 - z0) * (a1 - a0)) / d, v = ((a0 - x0) * (z1 - z0) - (b0 - z0) * (x1 - x0)) / d;
        return u > 0 && u < 1 && v > 0 && v < 1; }
    // chỗ đứng (trước cửa, trước chỗ làm) rơi vào lòng đường thì lùi ra vỉa hè phía bên đó: không ai đứng giữa đường xe chạy
    function offCarriage(v) {
      if (!L.roadSegs) return v;
      const R = BK.Roads3D, T = BK.Plains3D && BK.Plains3D.TOWN, half = (T ? T.ROAD_W[o.level()] || 2.4 : 2.4) / 2, need = sideOff();
      for (let it = 0; it < 3; it++) {
        let best = null, bd = 1e9; for (const S of L.roadSegs) { const d = R.segDist(v.x, v.z, S); if (d < bd) { bd = d; best = S; } }
        if (bd >= half + 0.2) break;
        const [x0, z0, x1, z1] = best, dx = x1 - x0, dz = z1 - z0, t = Math.max(0, Math.min(1, ((v.x - x0) * dx + (v.z - z0) * dz) / (dx * dx + dz * dz || 1))), fx = x0 + dx * t, fz = z0 + dz * t;
        let nx = v.x - fx, nz = v.z - fz, nl = Math.hypot(nx, nz); if (nl < 1e-3) { nx = -fx; nz = -fz; nl = Math.hypot(nx, nz) || 1; } // đúng tim đường: lùi về phía trong đảo
        v.set(fx + (nx / nl) * need, 0, fz + (nz / nl) * need);
      }
      return v;
    }
    function keepInside(pos) { const a = Math.atan2(pos.z, pos.x), R = L.rOf(a) - WALL_IN, r = Math.hypot(pos.x, pos.z); if (r > R) pos.multiplyScalar(R / r); }
    /* ---------- Đi dạo dọc phố ----------
     * Người đi đường (chỗ 'stroll') đi theo mạng đường của đảo (render/build/roads.js isleNet): dọc vòng đường một quãng, có khi
     * rẽ ra một đường toả tới gần cổng rồi quay lại; đi trên vỉa hè bên phải, không đi giữa đường xe chạy. */
    function newRoute(f) {
      const loop = NET.loop, n = loop.length; let bi = 0, bd = 1e18;
      for (let i = 0; i < n; i++) { const d = (loop[i][0] - f.pos.x) ** 2 + (loop[i][1] - f.pos.z) ** 2; if (d < bd) { bd = d; bi = i; } }
      const dir = Math.random() < 0.5 ? 1 : -1, len = 6 + Math.floor(Math.random() * 16), pts = [];
      for (let k = 0; k <= len; k++) pts.push(loop[(((bi + dir * k) % n) + n) % n]);
      if (NET.spokes.length && Math.random() < 0.35) { // rẽ ra một đường toả gần chỗ dừng, đi gần tới cổng rồi quay lại
        const end = pts[pts.length - 1]; let bs = null, bsd = 1e18;
        for (const sp of NET.spokes) { const d = (sp[0][0] - end[0]) ** 2 + (sp[0][1] - end[1]) ** 2; if (d < bsd) { bsd = d; bs = sp; } }
        if (bs && bsd < 120) { const out = bs.slice(0, Math.max(2, bs.length - 3)); pts.push(...out, ...out.slice().reverse()); }
      }
      f.route = pts; f.ri = 0;
    }
    function strollGoal(f) {
      if (!NET) return null;
      if (!f.route || f.ri >= f.route.length) newRoute(f);
      const a = f.route[f.ri], b = f.route[Math.min(f.route.length - 1, f.ri + 1)];
      let dx = b[0] - a[0], dz = b[1] - a[1]; const l = Math.hypot(dx, dz) || 1; dx /= l; dz /= l;
      const side = sideOff() + ((f.p.id % 3) - 1) * 0.12, p = new THREE.Vector3(a[0] + dz * side, 0, a[1] - dx * side); // vỉa hè bên phải theo hướng đi
      const d2 = (p.x - f.pos.x) ** 2 + (p.z - f.pos.z) ** 2; if (d2 < 0.6) { f.ri++; }
      return { p, face: null, road: d2 < 16 }; // còn xa vòng đi dạo (mới ra khỏi nhà): đi theo lối đi tới đó trước
    }
    // vòng đi dạo quanh nhà chính: một vòng cách tường nhà chính khoảng 2,5, chiều đi theo từng người
    function hallGoal(f) {
      const PL = o.places(); if (!PL || !PL.hallC) return null;
      const R = PL.hallR + 2.5, n = 16, dir = f.p.id % 2 ? 1 : -1;
      if (f.hk == null || f.hkR !== R) { const a0 = Math.atan2(f.pos.z - PL.hallC.z, f.pos.x - PL.hallC.x); f.hk = Math.round((a0 / (Math.PI * 2)) * n); f.hkR = R; }
      const a = ((f.hk % n) / n) * Math.PI * 2, p = new THREE.Vector3(PL.hallC.x + Math.cos(a) * R, 0, PL.hallC.z + Math.sin(a) * R);
      const d2 = (p.x - f.pos.x) ** 2 + (p.z - f.pos.z) ** 2; if (d2 < 0.8) f.hk += dir;
      return { p, face: null, road: d2 < 16 };
    }
    // đích của khung hình này: đích đổi thì tìm đường lại, đi lần lượt qua từng điểm; chặng cuối bám theo đích (người mình đang
    // nói chuyện có thể nhích đi)
    function follow(f, goal) {
      if (!f.nav || f.nav.dest.distanceToSquared(goal.p) > 2.25) f.nav = { dest: goal.p.clone(), pts: routeTo(f.pos, goal.p), i: 0 };
      const N = f.nav; while (N.i < N.pts.length - 1 && (N.pts[N.i].x - f.pos.x) ** 2 + (N.pts[N.i].z - f.pos.z) ** 2 < 0.8) N.i++;
      if (N.i === N.pts.length - 1) { N.pts[N.i] = goal.p; return goal; }
      return { p: N.pts[N.i], face: null };
    }
    /* ---------- Không đi xuyên nhà (design/ke-hoach-buoc-14.md mục 7) ----------
     * Mỗi công trình đang đứng là một khung chữ nhật theo trục của nó (places().solids). Đích nằm trong khung thì dời ra mép gần
     * nhất; đường thẳng tới đích cắt qua khung thì đi tới góc khung (góc nào tổng đường ngắn nhất mà nhìn thấy được) rồi đi tiếp;
     * ai lỡ ở trong khung thì bước dần ra (không nhảy chỗ). PUSH < SEG < CORNER để đi dọc mép khung không bị coi là cắt qua. */
    const PUSH = 0.35, SEG = 0.5, CORNER = 0.85;
    // farm: người làm ruộng (vào được chỗ mềm: ruộng, nhà kính)
    const solids = (farm) => { const PL = o.places(), all = (PL && PL.solids) || []; return farm ? all.filter((B) => !B.soft) : all; };
    const toL = (B, x, z) => { const dx = x - B.x, dz = z - B.z; return [dx * B.c - dz * B.s, dx * B.s + dz * B.c]; };
    const toW = (B, lx, lz, y) => new THREE.Vector3(B.x + lx * B.c + lz * B.s, y || 0, B.z - lx * B.s + lz * B.c);
    // khung nào chứa điểm (nới ra m): độ sâu vào trong và hướng ra ngắn nhất (theo trục khung)
    function inside(B, x, z, m) { const [lx, lz] = toL(B, x, z); if (lx <= B.x0 - m || lx >= B.x1 + m || lz <= B.z0 - m || lz >= B.z1 + m) return null;
      const o4 = [[lx - (B.x0 - m), -1, 0], [B.x1 + m - lx, 1, 0], [lz - (B.z0 - m), 0, -1], [B.z1 + m - lz, 0, 1]].sort((a, b) => a[0] - b[0])[0]; return { lx, lz, d: o4[0], ux: o4[1], uz: o4[2] }; }
    // chỗ ra gần nhất từ (x, z) tới ngoài mọi khung (hai nhà đứng sát nhau: không đẩy từ nhà này vào nhà kia); null nếu không ở trong khung nào
    function exitOf(x, z, farm) {
      const all = solids(farm), inn = all.filter((B) => inside(B, x, z, PUSH)); if (!inn.length) return null;
      let best = null, bd = 1e9, any = null, ad = 1e9;
      for (const B of inn) { const [lx, lz] = toL(B, x, z);
        for (const [tx, tz] of [[B.x0 - PUSH - 0.02, lz], [B.x1 + PUSH + 0.02, lz], [lx, B.z0 - PUSH - 0.02], [lx, B.z1 + PUSH + 0.02]]) {
          const w = toW(B, tx, tz), d = Math.hypot(w.x - x, w.z - z); if (d < ad) { ad = d; any = w; }
          if (d < bd && !all.some((C) => inside(C, w.x, w.z, PUSH - 0.01))) { bd = d; best = w; } } }
      return best || any;
    }
    function clearPt(v, farm) {
      let p = v;
      for (let pass = 0; pass < 4; pass++) { const e = exitOf(p.x, p.z, farm); if (!e) break; p = new THREE.Vector3(e.x, v.y, e.z); }
      return p;
    }
    function pushOut(pos, max, farm) { const e = exitOf(pos.x, pos.z, farm); if (!e) return; const dx = e.x - pos.x, dz = e.z - pos.z, d = Math.hypot(dx, dz) || 1, k = Math.min(1, max / d); pos.x += dx * k; pos.z += dz * k; }
    // đoạn thẳng a→b (toạ độ khung) có cắt khung nới m không (Liang–Barsky)
    function cuts(B, a, b, m) { let t0 = 0, t1 = 1; const dx = b[0] - a[0], dz = b[1] - a[1];
      for (const [p, q] of [[-dx, a[0] - (B.x0 - m)], [dx, B.x1 + m - a[0]], [-dz, a[1] - (B.z0 - m)], [dz, B.z1 + m - a[1]]]) { if (Math.abs(p) < 1e-9) { if (q < 0) return false; continue; } const r = q / p; if (p < 0) { if (r > t1) return false; if (r > t0) t0 = r; } else { if (r < t0) return false; if (r < t1) t1 = r; } }
      return t1 - t0 > 1e-4; }
    function detour(from, to, farm) {
      let best = null, bt = 1e9;
      for (const B of solids(farm)) { const a = toL(B, from.x, from.z), b = toL(B, to.x, to.z); if (!cuts(B, a, b, SEG) || inside(B, from.x, from.z, PUSH)) continue; const t = Math.hypot(B.x - from.x, B.z - from.z); if (t < bt) { bt = t; best = [B, a, b]; } }
      if (!best) return null;
      const [B, a, b] = best; let pick = null, pd = 1e9;
      for (const [cx, cz] of [[B.x0 - CORNER, B.z0 - CORNER], [B.x1 + CORNER, B.z0 - CORNER], [B.x1 + CORNER, B.z1 + CORNER], [B.x0 - CORNER, B.z1 + CORNER]]) {
        const d0 = Math.hypot(cx - a[0], cz - a[1]); if (d0 < 0.3 || cuts(B, a, [cx, cz], SEG)) continue; // (góc đang đứng, góc phải đi xuyên khung mới tới: bỏ)
        const w = toW(B, cx, cz), blocked = solids(farm).some((C) => C !== B && inside(C, w.x, w.z, PUSH)); // (góc nằm trong nhà bên cạnh: chỉ đi khi không còn góc nào khác)
        const d = d0 + Math.hypot(b[0] - cx, b[1] - cz) + (cuts(B, [cx, cz], b, SEG) ? 2 * CORNER : 0) + (blocked ? 50 : 0); if (d < pd) { pd = d; pick = [cx, cz]; } }
      return pick ? toW(B, pick[0], pick[1], to.y) : null;
    }
    const reset = () => { NAV = null; };
    return { routeTo, follow, offCarriage, keepInside, strollGoal, hallGoal, reset, clearPt, detour, pushOut, net: NET };
  }
  BK.Nav3D = { create };
})(typeof self !== 'undefined' ? self : globalThis);
