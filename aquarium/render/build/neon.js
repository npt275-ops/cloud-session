/* Bể Kính · render/build/neon.js · Thành phố neon (từ thời 10)
 * Từ thời 10 mặt trời đã mất: không còn đèn đường, cả thành phố tự phát sáng. Tệp này giữ:
 *   PAL      màu neon của từng đảo: a (màu chính, viền chân công trình, mép đường), b (màu phụ, viền chân toà cao, vòm
 *            sáng), sun (màu mặt trời nhân tạo của đảo, render/neon3d.js dùng)
 *   of(key)  bảng màu neon của một đảo (key là kiểu đất: plains, forest, mountain, tundra, coast, desert)
 *   edges(geo, key, lv)  đường viền neon chạy dọc các cạnh thật của công trình (không có khung vuông lơ lửng), từ thời 10
 *   street(k, N, lv, key, w)  lớp neon trên đường của làng: hai mép đường sáng, vòm sáng bắc ngang đường cho xe bay xuyên qua
 *            (render/build/plains/town.js, thời 10 tới 12)
 * Cần: render/build/kit3d.js, render/build/plains/common.js (Bc), render/build/roads.js. */
(function (root) {
  const BK = root.BK, K = BK.BuildKit;
  const THREE = () => window.THREE;
  const LV = 10; // thời bắt đầu thành phố neon
  const PAL = {
    plains: { a: '#ffd27a', b: '#ff4fd8', sun: '#ffd27a' },
    forest: { a: '#9dff6a', b: '#3affc8', sun: '#c8ffb0' },
    mountain: { a: '#ff8a4a', b: '#ff3a7a', sun: '#ffb08a' },
    tundra: { a: '#7ae8ff', b: '#b48aff', sun: '#b8f0ff' },
    coast: { a: '#3affd8', b: '#4a9aff', sun: '#7ff0e0' },
    desert: { a: '#ff6ac8', b: '#ffb84a', sun: '#ff9ad0' },
  };
  const of = (key) => PAL[key] || PAL.plains;
  const on = (lv) => lv >= LV;
  // đường viền neon chạy dọc chính các cạnh của công trình (cạnh gãy giữa hai mặt lệch nhau hơn ANGLE độ): lấy từ khối chính
  // đã dựng, tô màu theo độ cao (chân màu chính a, lên cao ngả dần sang màu phụ b). Trả về BufferGeometry dạng đoạn thẳng
  // (render/buildings3d.js vẽ bằng LineSegments với vật liệu neon chung của kit3d), null nếu không phải thời neon.
  const ANGLE = 32;
  function edges(geo, key, lv) {
    if (!on(lv) || !geo) return null;
    const T = THREE(), e = new T.EdgesGeometry(geo, ANGLE), P = e.attributes.position; if (!P.count) { e.dispose(); return null; }
    if (!geo.boundingBox) geo.computeBoundingBox();
    const y0 = Math.max(0, geo.boundingBox.min.y), h = Math.max(1, geo.boundingBox.max.y - y0), c = of(key), A = new T.Color(c.a), B = new T.Color(c.b), x = new T.Color();
    const col = new Float32Array(P.count * 3);
    for (let i = 0; i < P.count; i++) { x.copy(A).lerp(B, Math.min(1, Math.max(0, (P.getY(i) - y0) / h))); col[i * 3] = x.r; col[i * 3 + 1] = x.g; col[i * 3 + 2] = x.b; }
    e.setAttribute('color', new T.BufferAttribute(col, 3));
    return e;
  }
  // lớp neon trên đường: mép đường sáng hai bên, vòm sáng bắc ngang vòng đường (mỗi thời dày hơn)
  function street(k, N, lv, key, w) {
    if (!on(lv)) return;
    const R3 = BK.Roads3D, Bc = BK.Plains3D.Bc, c = of(key), T = THREE();
    for (const [x0, z0, x1, z1] of R3.segs(N)) {
      const dx = x1 - x0, dz = z1 - z0, L = Math.hypot(dx, dz), a = Math.atan2(dx, dz), nx = dz / (L || 1), nz = -dx / (L || 1);
      for (const s of [-1, 1]) k.add(Bc(0.16, 0.06, L + 0.2, 0.01), s > 0 ? c.a : c.b, (x0 + x1) / 2 + nx * s * (w / 2 - 0.1), R3.Y + 0.07, (z0 + z1) / 2 + nz * s * (w / 2 - 0.1), { rot: [0, a, 0], glow: true });
    }
    const step = { 10: 20, 11: 15, 12: 11 }[lv] || 18, R = w / 2 + 1.2;
    R3.along(N.loop, step, true).forEach((q, i) => {
      const arc = new T.TorusGeometry(R, 0.13, 6, 20, Math.PI); // vòm nửa vòng đứng ngang đường
      k.add(arc, i % 2 ? c.a : c.b, q.x, 0, q.z, { rot: [0, q.a, 0], glow: true });
      for (const s of [-1, 1]) { k.add(K.post(0.2, 0.35, 6), '#2a2440', q.x + q.n[0] * s * R, 0, q.z + q.n[1] * s * R); if (k.mark) k.mark(q.x + q.n[0] * s * R, q.z + q.n[1] * s * R, 0.4); }
    });
  }
  BK.Neon3D = { LV, PAL, of, on, edges, street };
})(typeof self !== 'undefined' ? self : globalThis);
