/* Bể Kính · render/build/place3d.js
 * Tìm chỗ đặt công trình trên địa hình thật của một đảo (tránh núi, hồ, sông, mép đảo và các công trình khác):
 *   homeSpot   công trình trong làng: giữ đúng chỗ đã định nếu trống, không thì dịch dần ra xung quanh; tránh núi, hồ, mép đảo,
 *              công trình khác và mặt đường (L.roadSegs: các đoạn đường của đảo, đặt bởi render/buildings3d.js)
 *   outerSpot  công trình ngoài làng: coast (mép đảo, mặt trước quay ra biển), sea (ngoài khơi), forest (vòng ngoài làng),
 *              kỳ quan (wonder: tìm rộng hơn vì to). Tìm một lần cho mỗi slot (địa hình không đổi) và nhớ trong L.outerSpots
 *   landFor    cho hàm dựng của một công trình biết đất quanh nó, theo toạ độ của chính công trình: edge(góc) bán kính
 *              mép đảo theo một hướng, free(x, z, r) chỗ đó có trống không (dùng cho tường thành sát mép đảo)
 * Toạ độ là toạ độ của đảo (L.g), Vector2 (x, z). Cần: three.js. */
(function (root, factory) {
  const BK = root.BK || (root.BK = {});
  BK.Place3D = factory();
})(typeof self !== 'undefined' ? self : globalThis, function () {
  'use strict';
  function create(THREE) {
    // khoảng cách từ một điểm tới đoạn thẳng
    const segDist = (x, z, [x0, z0, x1, z1]) => { const dx = x1 - x0, dz = z1 - z0, L2 = dx * dx + dz * dz || 1, t = Math.max(0, Math.min(1, ((x - x0) * dx + (z - z0) * dz) / L2)); return Math.hypot(x - x0 - dx * t, z - z0 - dz * t); };
    const onRoad = (L, x, z, r) => !!L.roadSegs && L.roadSegs.some((S) => segDist(x, z, S) < r + (L.roadW || 1.5));
    function homeSpot(L, p, r, fixed, self) {
      const ok = (q) => L.inside(q.x, q.y, r + 2) && !L.blockedWild(q.x, q.y, r) && !onRoad(L, q.x, q.y, r * 0.85) && !fixed.some((F) => F.P !== self && (F.x - q.x) ** 2 + (F.y - q.y) ** 2 < (F.r + r) ** 2);
      if (ok(p)) return p;
      for (const [ks, da] of [[1.12, 0], [0.9, 0], [1, 0.1], [1, -0.1], [1.22, 0.06], [1.22, -0.06], [0.82, 0.1], [1.34, 0], [1, 0.2], [1, -0.2], [1.45, 0.1], [0.75, -0.15], [1.08, 0.16], [1.08, -0.16], [0.92, 0.22], [0.92, -0.22], [1.3, 0.2], [1.3, -0.2]]) {
        const a = Math.atan2(p.y, p.x) + da, R = p.length() * ks, q = new THREE.Vector2(Math.cos(a) * R, Math.sin(a) * R); if (ok(q)) return q;
      }
      return p;
    }
    function outerSpot(L, P, at) {
      const cache = L.outerSpots || (L.outerSpots = {}), key = P.slot + ':' + P.outer;
      if (key in cache) return cache[key];
      const d0 = at(Math.sin(P.a || 0), Math.cos(P.a || 0)), th0 = Math.atan2(d0.y, d0.x), r = Math.max(2.5, P.clear || 3);
      const taken = Object.values(cache).filter(Boolean);
      const free = (q, rr, gap) => !taken.some((o) => o.p.distanceTo(q) < o.r + rr + gap);
      const W = !!P.wonder;
      let found = null;
      for (let k = 0; k < (W ? 110 : 60) && !found; k++) {
        const th = th0 + (k % 2 ? 1 : -1) * Math.ceil(k / 2) * 0.06, u = new THREE.Vector2(Math.cos(th), Math.sin(th)), edge = L.rOf(th);
        const tries = P.outer === 'coast' ? [edge - 3] : P.outer === 'sea' ? [edge + 7, edge + 10] : W ? [37, 41, 34, 45, 49] : [38, 34, 42, 46];
        for (const R of tries) {
          const q = u.clone().multiplyScalar(R);
          if (P.outer === 'sea') { if (!L.inside(q.x, q.y, -4) && free(q, r, 3)) { found = { p: q, dir: new THREE.Vector2(-u.y, u.x), r }; break; } continue; }
          if (P.outer === 'coast') { if (L.inside(q.x, q.y, 1.2) && !L.blockedWild(q.x, q.y, r) && (P.slot === 'gate' || !onRoad(L, q.x, q.y, r * 0.6)) && free(q, r, 3)) { found = { p: q, dir: u.clone(), r }; break; } continue; }
          if (W) { if (L.inside(q.x, q.y, r + 1) && !L.blockedWild(q.x, q.y, r * 0.8) && !onRoad(L, q.x, q.y, r * 0.85) && free(q, r, 1)) { found = { p: q, dir: u.clone().negate(), r }; break; } continue; }
          if (L.inside(q.x, q.y, r + 4) && !L.blockedWild(q.x, q.y, r + 0.5) && !onRoad(L, q.x, q.y, r * 0.7) && free(q, r, 3)) { found = { p: q, dir: u.clone().negate(), r }; break; }
        }
      }
      cache[key] = found; return found;
    }
    // đất quanh một công trình, theo toạ độ của chính công trình (pos: Vector2 trên đảo, rotY: góc xoay của công trình)
    function landFor(L, pos, rotY) {
      const c = Math.cos(rotY), s = Math.sin(rotY);
      const toIsle = (x, z) => [pos.x + x * c + z * s, pos.y - x * s + z * c];
      return {
        edge(a) { const [X, Z] = toIsle(Math.sin(a), Math.cos(a)), th = Math.atan2(Z - pos.y, X - pos.x); return L.rOf(th) - Math.hypot(pos.x, pos.y); },
        free(x, z, r) { const [X, Z] = toIsle(x, z); return L.inside(X, Z, r || 0) && !L.blockedWild(X, Z, r || 0); },
      };
    }
    /* ---------- Công trình không chắn đường (đo theo cỡ thật, sau khi dựng hình) ----------
     * Lấy lưới 5×5 điểm trên khung bao phần sát đất của công trình (theo hướng quay và cỡ của nó); điểm nào gần tim đường hơn
     * L.roadW (nửa mặt đường rộng nhất cộng vỉa hè) là lấn đường. Lấn thì dời: nhà chính chỉ tiến lên phía sân; công trình khác
     * đẩy thẳng ra khỏi đoạn đường gần nhất (hai phía, trượt dọc đường), không được thì tìm chỗ trống gần nhất trên cả đảo; chỗ
     * mới phải còn trên đảo, không đè núi, hồ, không đè công trình khác. Không có chỗ cho đủ cỡ thì thu nhỏ vừa đủ (ít nhất 70%). */
    // khung bao phần sát đất (đỉnh thấp hơn LOW_Y, theo cỡ thật fitS): phần lơ lửng trên cao (vòng quay, cầu trên không, mái vươn)
    // không chắn lối đi; LOW_Y cao hơn đầu người một chút để phần nhấp nhô, đung đưa xuống thấp cũng được tính
    const LOW_Y = 4.5, _w = new THREE.Vector3();
    function lowBox(m, s) {
      const top = LOW_Y / (s || 1), bb = new THREE.Box3();
      m.traverse((o) => { if (!o.isMesh || !o.geometry.attributes.position) return; const P = o.geometry.attributes.position; for (let i = 0; i < P.count; i++) { _w.fromBufferAttribute(P, i).applyMatrix4(o.matrixWorld); if (_w.y < top) bb.expandByPoint(_w); } });
      return bb.isEmpty() ? new THREE.Box3().setFromObject(m) : bb;
    }
    function footprint(m, rotY, s) {
      const bb = lowBox(m, s), pts = [], c = Math.cos(rotY), sn = Math.sin(rotY);
      for (const ax of ['x', 'z']) if (bb.max[ax] - bb.min[ax] < 0.8) { const mid = (bb.max[ax] + bb.min[ax]) / 2; bb.min[ax] = mid - 0.4; bb.max[ax] = mid + 0.4; } // vật mảnh (cột, mảnh lơ lửng): coi như rộng ít nhất 0,8
      for (let a = 0; a <= 4; a++) for (let b = 0; b <= 4; b++) { const x = (bb.min.x + ((bb.max.x - bb.min.x) * a) / 4) * s, z = (bb.min.z + ((bb.max.z - bb.min.z) * b) / 4) * s; pts.push([x * c + z * sn, -x * sn + z * c]); }
      return { pts, r: Math.max(bb.max.x, -bb.min.x, bb.max.z, -bb.min.z) * s };
    }
    const scaled = (fp, k) => ({ pts: fp.pts.map(([x, z]) => [x * k, z * k]), r: fp.r * k });
    const blocks = (L, fp, x, z) => fp.pts.some(([dx, dz]) => L.roadSegs.some((S) => segDist(x + dx, z + dz, S) < L.roadW));
    // chỗ mới cho một công trình lấn đường (P: { x, z, rotY, hall, self }, fixed: các công trình đã có chỗ); null nếu không có
    function relocate(L, P, fp, fixed) {
      const rr = fp.r;
      const good = (x, z) => !blocks(L, fp, x, z) && L.inside(x, z, rr * 0.5) && !L.blockedWild(x, z, rr * 0.6) && !(fixed || []).some((F) => F.P !== P.self && (F.x - x) ** 2 + (F.y - z) ** 2 < (F.r * 0.75 + rr * 0.75) ** 2);
      if (P.hall) { const fx = Math.sin(P.rotY), fz = Math.cos(P.rotY); for (let d = 1; d <= 6; d++) { const x = P.x + fx * d, z = P.z + fz * d; if (!blocks(L, fp, x, z)) return [x, z]; } return null; }
      let best = null, bd = 1e9; for (const S of L.roadSegs) { const d = segDist(P.x, P.z, S); if (d < bd) { bd = d; best = S; } }
      const [x0, z0, x1, z1] = best, dx = x1 - x0, dz = z1 - z0, ll = Math.hypot(dx, dz) || 1, t = Math.max(0, Math.min(1, ((P.x - x0) * dx + (P.z - z0) * dz) / (ll * ll)));
      const fx = x0 + dx * t, fz = z0 + dz * t, tx = dx / ll, tz = dz / ll; let nx = P.x - fx, nz = P.z - fz, nl = Math.hypot(nx, nz); if (nl < 1e-3) { nx = -tz; nz = tx; nl = 1; } nx /= nl; nz /= nl;
      for (const sl of [0, 3, -3, 6, -6, 9, -9, 12, -12]) for (const side of [1, -1]) for (const out of [0.4, 0.7, 1.0, 1.3]) {
        const x = fx + tx * sl + nx * side * (L.roadW + rr * out), z = fz + tz * sl + nz * side * (L.roadW + rr * out);
        if (good(x, z)) return [x, z];
      }
      const cand = []; for (let r = 8; r < 60; r += 2.5) for (let k = 0; k < 64; k++) { const a = (k / 64) * Math.PI * 2, x = Math.cos(a) * r, z = Math.sin(a) * r; cand.push([(x - P.x) ** 2 + (z - P.z) ** 2, x, z]); }
      cand.sort((a, b) => a[0] - b[0]);
      for (const [, x, z] of cand) if (good(x, z)) return [x, z];
      return null;
    }
    // công trình đã dựng hình m (P: { x, z, rotY, fitS, hall, self }): không lấn đường thì trả null; lấn thì trả chỗ và cỡ mới
    // { x, z, fitS } (ghi luôn vào fixed), không có chỗ nào thì { stuck: true }
    function clearRoad(L, P, m, fixed) {
      m.updateMatrixWorld(true);
      const fp = footprint(m, P.rotY, P.fitS);
      if (fp.r <= 0.3 || !blocks(L, fp, P.x, P.z)) return null;
      let q = relocate(L, P, fp, fixed), k = 1;
      for (const k2 of [0.94, 0.88, 0.82, 0.76, 0.7]) { if (q) break; const f2 = scaled(fp, k2); q = blocks(L, f2, P.x, P.z) ? relocate(L, P, f2, fixed) : [P.x, P.z]; if (q) k = k2; }
      if (!q) return { stuck: true };
      const F = (fixed || []).find((x) => x.P === P.self); if (F) { F.x = q[0]; F.y = q[1]; F.r = Math.max(F.r, fp.r * k); } else if (fixed) fixed.push({ x: q[0], y: q[1], r: fp.r * k, P: P.self });
      return { x: q[0], z: q[1], fitS: P.fitS * k };
    }
    return { homeSpot, outerSpot, landFor, onRoad, segDist, footprint, blocks, clearRoad };
  }
  return { create };
});
