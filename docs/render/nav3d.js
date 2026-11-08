/* Bể Kính · render/nav3d.js · Lối đi của người trên một đảo
 * Mọi chuyện "đi đường" của người (render/village3d.js chỉ hỏi ở đây, không tự tính):
 *   routeTo(from, to)  các điểm phải đi qua: theo mạng đường của đảo (render/build/roads.js isleNet), đường ngắn nhất, trên vỉa
 *                      hè, giữ bên đang đi, chỉ sang đường ở chỗ có vạch (roads.js crossIdx)
 *   follow(f, goal)    đích của khung hình này cho một người đang đi theo lối (tự tìm lại khi đích đổi)
 *   offCarriage(v)     chỗ đứng rơi vào lòng đường thì lùi ra vỉa hè
 *   keepInside(pos)    không ai ra quá vòng tường thành
 *   strollGoal(f)      đi dạo dọc phố; hallGoal(f): đi dạo vòng quanh nhà chính
 *   reset()            chỗ trên đảo đổi (sang thời): dựng lại mạng lối đi
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
    const reset = () => { NAV = null; };
    return { routeTo, follow, offCarriage, keepInside, strollGoal, hallGoal, reset, net: NET };
  }
  BK.Nav3D = { create };
})(typeof self !== 'undefined' ? self : globalThis);
