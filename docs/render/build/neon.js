/* Bể Kính · render/build/neon.js · Thành phố neon (từ thời 10)
 * Từ thời 10 mặt trời đã mất: không còn đèn đường, cả thành phố tự phát sáng. Tệp này giữ:
 *   PAL      màu neon của từng đảo: a (màu chính, viền chân công trình, mép đường), b (màu phụ, viền chân toà cao, vòm
 *            sáng), sun (màu mặt trời nhân tạo của đảo, render/neon3d.js dùng)
 *   of(key)  bảng màu neon của một đảo (key là kiểu đất: plains, forest, mountain, tundra, coast, desert)
 *   outline(k, key, lv)  viền neon mảnh sát chân cho một công trình (dịu, không chói), theo khung bao của các
 *            mảnh đã vẽ trong Kit (render/buildings3d.js gọi trước khi dựng hình, công trình thời 10 tới 12)
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
  // khung bao các mảnh của Kit (không tính Kit con đang chuyển động)
  function boxOf(k) {
    const T = THREE(), bb = new T.Box3(), b = new T.Box3();
    for (const P of [...k.parts, ...k.glow, ...k.lit]) { if (!P.geo.boundingBox) P.geo.computeBoundingBox(); b.copy(P.geo.boundingBox).applyMatrix4(P.m); bb.union(b); }
    return bb;
  }
  // vòng chữ nhật bằng bốn thanh sáng quanh khung (x0..x1, z0..z1) ở độ cao y
  function rect(k, x0, x1, z0, z1, y, t, col) {
    const Bc = BK.Plains3D.Bc, w = x1 - x0, d = z1 - z0, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
    k.add(Bc(w + t, t, t, 0.01), col, cx, y, z0, { glow: true }); k.add(Bc(w + t, t, t, 0.01), col, cx, y, z1, { glow: true });
    k.add(Bc(t, t, d, 0.01), col, x0, y, cz, { glow: true }); k.add(Bc(t, t, d, 0.01), col, x1, y, cz, { glow: true });
  }
  function outline(k, key, lv) {
    if (!on(lv)) return;
    const bb = boxOf(k); if (bb.isEmpty()) return;
    const c = of(key), m = 0.35, h = bb.max.y - Math.max(0, bb.min.y);
    if (bb.max.x - bb.min.x < 0.6 || h < 0.4) return; // vật nhỏ (cột, ghế): không viền
    rect(k, bb.min.x - m, bb.max.x + m, bb.min.z - m, bb.max.z + m, 0.1, 0.12, h > 6 ? c.b : c.a); // vòng sáng mảnh sát chân (toà cao màu phụ)
  }
  // lớp neon trên đường: mép đường sáng hai bên, vòm sáng bắc ngang vòng đường (mỗi thời dày hơn)
  function street(k, N, lv, key, w) {
    if (!on(lv)) return;
    const R3 = BK.Roads3D, Bc = BK.Plains3D.Bc, c = of(key), T = THREE();
    for (const [x0, z0, x1, z1] of R3.segs(N)) {
      const dx = x1 - x0, dz = z1 - z0, L = Math.hypot(dx, dz), a = Math.atan2(dx, dz), nx = dz / (L || 1), nz = -dx / (L || 1);
      for (const s of [-1, 1]) k.add(Bc(0.16, 0.06, L + 0.2, 0.01), s > 0 ? c.a : c.b, (x0 + x1) / 2 + nx * s * (w / 2 - 0.1), 0.12, (z0 + z1) / 2 + nz * s * (w / 2 - 0.1), { rot: [0, a, 0], glow: true });
    }
    const step = { 10: 20, 11: 15, 12: 11 }[lv] || 18, R = w / 2 + 1.2;
    R3.along(N.loop, step, true).forEach((q, i) => {
      const arc = new T.TorusGeometry(R, 0.13, 6, 20, Math.PI); // vòm nửa vòng đứng ngang đường
      k.add(arc, i % 2 ? c.a : c.b, q.x, 0, q.z, { rot: [0, q.a, 0], glow: true });
      for (const s of [-1, 1]) k.add(K.post(0.2, 0.35, 6), '#2a2440', q.x + q.n[0] * s * R, 0, q.z + q.n[1] * s * R);
    });
  }
  BK.Neon3D = { LV, PAL, of, on, outline, street };
})(typeof self !== 'undefined' ? self : globalThis);
