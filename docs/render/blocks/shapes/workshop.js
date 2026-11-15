/* Bể Kính · render/blocks/shapes/workshop.js · Hình khối Xưởng xe (render/blocks/blocks.js)
 * Dáng nhận diện: thân cao, cửa rất rộng ở mặt trước (xe ra vào), mái cao, bánh xe lớn dựng bên hông, một cỗ xe phá cổng
 * (khúc gỗ trên hai bánh) đỗ trước cửa.
 *   bậc 0 gỗ tre   vách gỗ, mái rơm cao     bậc 1 đá       tường đá, mái ngói
 *   bậc 2 gạch thép mái răng cưa nhà máy, ống khói cao   bậc 3 tương lai mái vòm, cửa sáng, vành bánh xe sáng */
(function (root) {
  const BK = root.BK;
  BK.Blocks.shape('workshop', (k, P, t, H) => {
    const K = BK.BuildKit,
      T = root.THREE,
      y0 = H.PLINTH;
    H.plinth(k, P, 5.6, 5.6);
    const w = 4.2,
      d = 3.6,
      h = 2.6 + 0.2 * t,
      zb = -0.7,
      zf = zb + d / 2;
    k.add(K.box(w, h, d, 0.07, true), P.wall, 0, y0, zb);
    const yr = y0 + h;
    if (t <= 1) k.add(K.roof(w + 0.7, t === 0 ? 1.7 : 1.3, d + 0.6, 0.1, w + 0.4, 0.4, t === 1 ? 0.3 : 0), P.roof, 0, yr, zb);
    else if (t === 2) {
      for (let i = 0; i < 3; i++) k.add(K.roof(w + 0.3, 0.9, 1.2, 0.05, w + 0.3, 0.12), P.roof, 0, yr, zb - 1.2 + i * 1.2);
      k.add(K.post(0.26, 2.4, 7, 0.2), P.wall2, 1.5, yr, zb - 1.2);
      k.add(K.post(0.3, 0.2, 7), P.dark, 1.5, yr + 2.4, zb - 1.2);
    } else {
      k.add(K.roof(w + 0.4, 1.1, d + 0.3, 0.3, w * 0.55, d + 0.1), P.roof, 0, yr, zb);
      H.lightBox(k, P, t, w + 0.42, 0.1, d + 0.32, 0, yr - 0.12, zb);
    }
    // cửa rất rộng
    k.add(K.box(2.9, 2.15, 0.12, 0.03, true), P.trim, 0, y0, zf + 0.02);
    k.add(K.box(2.6, 2.0, 0.12, 0.02, true), P.dark, 0, y0, zf + 0.07);
    if (t === 3) H.lightBox(k, P, t, 2.6, 0.1, 0.1, 0, y0 + 2.05, zf + 0.14);
    // bánh xe lớn dựng bên hông trái
    const wheel = (x, y, z, r, rot) => {
      k.add(new T.TorusGeometry(r, r * 0.14, 5, 12), t === 3 ? P.glow : P.trim, x, y, z, { rot, glow: t === 3 });
      k.add(K.box(r * 1.9, r * 0.12, r * 0.12, 0.01), P.wall2, x, y, z, { rot });
      k.add(K.box(r * 0.12, r * 1.9, r * 0.12, 0.01), P.wall2, x, y, z, { rot });
      k.add(K.post(r * 0.2, r * 0.3, 6), P.metal, x, y, z, { rot: [rot[0] + Math.PI / 2, rot[1], rot[2]] });
    };
    wheel(-2.42, y0 + 0.85, zb + 0.4, 0.8, [0, Math.PI / 2 - 0.16, 0]);
    wheel(-2.5, y0 + 0.55, zb + 1.5, 0.5, [0, Math.PI / 2 - 0.2, 0]);
    // cỗ xe phá cổng trước cửa (bên phải): khúc gỗ đầu bịt sắt trên hai bánh
    const xc = 1.6,
      zc = zf + 1.2;
    k.add(K.post(0.2, 1.9, 7, 0.2), P.wall2, xc, y0 + 0.55, zc - 0.95, { rot: [Math.PI / 2, 0, 0] });
    k.add(K.cone(0.24, 0.4, 7), P.metal, xc, y0 + 0.55, zc + 0.95, { rot: [Math.PI / 2, 0, 0] });
    for (const s of [-1, 1]) wheel(xc + s * 0.4, y0 + 0.36, zc, 0.36, [0, Math.PI / 2, 0]);
    k.add(K.box(0.9, 0.1, 1.2, 0.02), P.trim, xc, y0 + 0.36, zc);
  });
})(typeof self !== 'undefined' ? self : globalThis);
