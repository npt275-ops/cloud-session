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
    return { homeSpot, outerSpot, landFor, onRoad, segDist };
  }
  return { create };
});
