/* Bể Kính · render/blocks/shapes/house.js · Hình khối Nhà dân (render/blocks/blocks.js)
 * Dáng nhận diện: thấp, nhỏ, mái dốc hai phía, có ống khói, cửa nhỏ và một ô cửa sổ.
 *   bậc 0 gỗ tre   vách gỗ, mái rơm      bậc 1 đá       tường đá, mái ngói cong nhẹ, ống khói đá
 *   bậc 2 gạch thép hai tầng gạch, mái đá đen, mái hiên   bậc 3 tương lai nhà kén tròn trắng, dải cửa sáng */
(function (root) {
  const BK = root.BK;
  BK.Blocks.shape('house', (k, P, t, H) => {
    const K = BK.BuildKit,
      y0 = H.PLINTH;
    H.plinth(k, P, 3.6, 3.6);
    if (t === 3) {
      // nhà kén: thân tròn bo, vành sáng, cửa
      k.add(K.lathe([[1.25, 0], [1.45, 0.5], [1.4, 1.3], [0.95, 1.9], [0.02, 2.1]], 10), P.wall, 0, y0, 0);
      k.add(K.lathe([[1.47, 0.95], [1.46, 1.2]], 10), P.glow, 0, y0, 0, { glow: true });
      H.door(k, P, 0, y0, 1.38, 0.6, 1.0);
      k.add(K.post(0.05, 0.9, 5), P.metal, -0.6, y0 + 1.9, -0.4);
      return;
    }
    const w = 2.6,
      d = 2.2,
      h = t === 2 ? 2.5 : 1.55 + 0.1 * t;
    k.add(K.box(w, h, d, 0.07, true), P.wall, 0, y0, 0);
    const yr = y0 + h;
    k.add(K.roof(w + 0.6, t === 0 ? 1.3 : 1.05, d + 0.6, 0.08, w + 0.3, 0.3, t === 1 ? 0.25 : 0), P.roof, 0, yr, 0);
    // ống khói
    k.add(K.box(0.42, 1.2, 0.42, 0.04, true), t === 0 ? P.trim : P.stone, 0.75, yr + 0.1, -0.45);
    k.add(K.box(0.5, 0.12, 0.5, 0.03, true), P.dark, 0.75, yr + 1.3, -0.45);
    // cửa, cửa sổ
    H.door(k, P, -0.5, y0, d / 2, 0.6, 1.1);
    H.lightBox(k, P, t, 0.55, 0.5, 0.08, 0.6, y0 + 0.95, d / 2 + 0.03);
    if (t === 2) {
      for (const x of [-0.6, 0.6]) H.lightBox(k, P, t, 0.5, 0.5, 0.08, x, y0 + 1.95, d / 2 + 0.03);
      k.add(K.box(1.0, 0.08, 0.5, 0.02), P.roof, -0.5, y0 + 1.3, d / 2 + 0.25, { rot: [0.25, 0, 0] }); // mái hiên
    }
  });
})(typeof self !== 'undefined' ? self : globalThis);
