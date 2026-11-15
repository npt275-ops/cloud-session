/* Bể Kính · render/blocks/shapes/barracks.js · Hình khối Nhà lính (render/blocks/blocks.js)
 * Dáng nhận diện: thân dài mái bằng có hàng răng tường, khiên treo mặt trước, giá vũ khí bên hông, sân tập phía trước (hình
 * nộm tập đánh gần, bia tập bắn xa), cờ đỏ ở góc mái.
 *   bậc 0 gỗ tre   vách gỗ, mép mái là hàng cọc     bậc 1 đá       tường đá, răng tường
 *   bậc 2 gạch thép tường gạch viền thép, tháp canh nhỏ   bậc 3 tương lai thân trắng, dải sáng, bia và hình nộm phát sáng */
(function (root) {
  const BK = root.BK;
  BK.Blocks.shape('barracks', (k, P, t, H) => {
    const K = BK.BuildKit,
      y0 = H.PLINTH;
    H.plinth(k, P, 5.6, 5.6);
    const w = 4.4,
      d = 2.6,
      h = 1.9 + 0.2 * t,
      zb = -1.2, // thân lùi về sau, sân tập phía trước
      zf = zb + d / 2;
    k.add(K.box(w, h, d, 0.07, true), P.wall, 0, y0, zb);
    k.add(K.box(w + 0.3, 0.18, d + 0.3, 0.04, true), t === 2 ? P.metal : P.wall2, 0, y0 + h, zb);
    const yr = y0 + h + 0.18;
    // mép mái: cọc gỗ (bậc 0) hay răng tường
    if (t === 0) for (let i = 0; i < 9; i++) k.add(K.post(0.09, 0.45, 5, 0.02), P.trim, -2.1 + i * 0.525, yr, zf + 0.05);
    else {
      H.crenels(k, P.wall2, -2.05, 2.05, yr, zf + 0.02, 6, 0.42, 0.34, 0.3);
      for (const s of [-1, 1]) for (const z of [-0.8, 0, 0.8]) k.add(K.box(0.3, 0.34, 0.42, 0.03, true), P.wall2, s * 2.2, yr, zb + z);
    }
    if (t === 2) {
      // tháp canh nhỏ ở góc sau
      k.add(K.box(1.1, 1.5, 1.1, 0.05, true), P.wall2, 1.5, yr, zb - 0.6);
      k.add(K.roof(1.4, 0.6, 1.4, 0.04, 0.2, 0.2), P.roof, 1.5, yr + 1.5, zb - 0.6);
    }
    if (t === 3) H.lightBox(k, P, t, w + 0.04, 0.12, d + 0.04, 0, y0 + h * 0.55, zb);
    H.flag(k, P, -1.9, yr, zb - 0.9, 1.6, 0.9);
    // cửa và ba tấm khiên treo mặt trước
    H.door(k, P, 0, y0, zf, 0.9, 1.35);
    for (const x of [-1.5, 1.5]) {
      k.add(K.post(0.34, 0.08, 8), P.accent, x, y0 + 1.25, zf + 0.06, { rot: [Math.PI / 2, 0, 0] });
      k.add(K.post(0.1, 0.1, 6), P.metal, x, y0 + 1.25, zf + 0.1, { rot: [Math.PI / 2, 0, 0] });
    }
    // giá vũ khí bên hông phải: hai cọc, một xà, bốn ngọn giáo dựng nghiêng
    const xr = 2.55;
    for (const z of [-1.9, -0.5]) k.add(K.post(0.07, 1.25, 5), P.trim, xr, y0, z);
    k.add(K.box(0.08, 0.08, 1.6, 0.02), P.trim, xr, y0 + 1.1, -1.2);
    for (let i = 0; i < 4; i++) {
      const z = -1.75 + i * 0.37;
      k.add(K.post(0.03, 1.7, 4), P.wall2, xr + 0.12, y0, z, { rot: [0, 0, -0.12] });
      k.add(K.cone(0.07, 0.24, 4), P.metal, xr + 0.32, y0 + 1.68, z, { rot: [0, 0, -0.12] });
    }
    // sân tập: hai hình nộm (đánh gần) và một tấm bia (bắn xa)
    for (const x of [-1.7, -0.6]) {
      k.add(K.post(0.08, 1.2, 5), P.trim, x, y0, 1.5);
      k.add(K.box(0.9, 0.08, 0.08, 0.02), P.trim, x, y0 + 0.85, 1.5);
      k.add(K.ball(0.2), t === 3 ? P.glow : '#d8c59a', x, y0 + 1.35, 1.5, t === 3 ? { glow: true } : null);
    }
    k.add(K.post(0.06, 0.7, 5), P.trim, 1.5, y0, 1.6);
    k.add(K.post(0.5, 0.08, 10), '#f1ead8', 1.5, y0 + 1.0, 1.6, { rot: [Math.PI / 2, 0, 0] });
    k.add(K.post(0.3, 0.09, 10), P.accent, 1.5, y0 + 1.0, 1.62, { rot: [Math.PI / 2, 0, 0] });
    k.add(K.post(0.11, 0.1, 8), t === 3 ? P.glow : '#f1ead8', 1.5, y0 + 1.0, 1.64, { rot: [Math.PI / 2, 0, 0], glow: t === 3 });
  });
})(typeof self !== 'undefined' ? self : globalThis);
