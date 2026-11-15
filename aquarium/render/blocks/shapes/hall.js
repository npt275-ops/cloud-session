/* Bể Kính · render/blocks/shapes/hall.js · Hình khối Nhà chính (render/blocks/blocks.js)
 * Dáng nhận diện: cao nhất làng, bệ lớn, thân rộng, một tháp giữa vươn lên, lá cờ lớn trên đỉnh, bậc thềm và cửa chính ở mặt trước.
 *   bậc 0 gỗ tre   nhà sàn lớn mái rơm, tháp là chòi gỗ mái nhọn
 *   bậc 1 đá       nền đá, mái ngói cong góc, tháp đá mái chùa
 *   bậc 2 gạch thép hai tầng gạch có hai chái, tháp đồng hồ mái nhọn
 *   bậc 3 tương lai thân trắng mái phẳng, tháp kính có các vành sáng và cột thu sóng */
(function (root) {
  const BK = root.BK;
  BK.Blocks.shape('hall', (k, P, t, H) => {
    const K = BK.BuildKit,
      y0 = H.PLINTH;
    H.plinth(k, P, 7.6, 7.6);
    const w = 5.4,
      d = 4.6,
      h = 2.4 + 0.35 * t,
      lift = t === 0 ? 0.7 : t === 1 ? 0.8 : 0; // (nhà sàn; nền đá)
    // chân: cột sàn hay nền đá
    if (t === 0) for (const x of [-2.3, 0, 2.3]) for (const z of [-1.9, 1.9]) k.add(K.post(0.16, lift, 6), P.trim, x, y0, z);
    if (t === 1) k.add(K.box(w + 0.5, lift, d + 0.5, 0.08, true), P.stone, 0, y0, 0);
    const yb = y0 + lift;
    k.add(K.box(w, h, d, 0.08, true), P.wall, 0, yb, 0);
    if (t >= 2) for (const s of [-1, 1]) k.add(K.box(1.5, h * 0.72, 3.4, 0.08, true), P.wall2, s * 3.35, yb, 0); // hai chái
    // mái thân
    const yr = yb + h;
    if (t === 0) k.add(K.roof(6.3, 1.9, 5.5, 0.1, 5.2, 0.5), P.roof, 0, yr, 0);
    else if (t === 1) k.add(K.roof(6.5, 1.3, 5.7, 0.1, 3.2, 1.8, 0.55), P.roof, 0, yr, 0);
    else if (t === 2) {
      k.add(K.roof(5.8, 1.1, 5.0, 0.08, 4.6, 0.5), P.roof, 0, yr, 0);
      for (const s of [-1, 1]) k.add(K.roof(1.8, 0.7, 3.7, 0.06, 0.4, 3.2), P.roof, s * 3.35, yb + h * 0.72, 0);
    } else {
      k.add(K.box(w + 0.5, 0.22, d + 0.5, 0.05, true), P.roof, 0, yr, 0);
      H.lightBox(k, P, t, w + 0.52, 0.08, d + 0.52, 0, yr - 0.2, 0);
    }
    // tháp giữa
    const tw = 1.8,
      th = 5.2 + 0.9 * t;
    k.add(K.box(tw, th, tw, 0.07, true), t === 3 ? P.wall2 : P.wall2, 0, y0, -0.3);
    const yt = y0 + th;
    if (t === 0) k.add(K.cone(1.55, 1.5, 4), P.roof, 0, yt, -0.3, { rot: [0, Math.PI / 4, 0] });
    else if (t === 1) {
      k.add(K.roof(2.9, 0.7, 2.9, 0.06, 1.6, 1.6, 0.4), P.roof, 0, yt - 1.4, -0.3);
      k.add(K.roof(2.5, 1.1, 2.5, 0.06, 0.3, 0.3, 0.35), P.roof, 0, yt, -0.3);
    } else if (t === 2) {
      k.add(K.post(0.55, 0.08, 12), '#f3ead2', 0, yt - 1.1, 0.62, { rot: [Math.PI / 2, 0, 0] }); // mặt đồng hồ
      k.add(K.box(0.05, 0.4, 0.04, 0.01), P.dark, 0, yt - 0.92, 0.72);
      k.add(K.roof(2.1, 1.7, 2.1, 0.06, 0.2, 0.2), P.roof, 0, yt, -0.3);
    } else {
      for (const yy of [0.35, 0.6, 0.85]) H.lightBox(k, P, t, tw + 0.14, 0.12, tw + 0.14, 0, y0 + th * yy, -0.3);
      k.add(K.box(2.2, 0.2, 2.2, 0.05, true), P.roof, 0, yt, -0.3);
      k.add(K.post(0.06, 1.4, 5), P.metal, 0.6, yt + 0.2, -0.3);
    }
    const top = yt + (t === 0 ? 1.5 : t === 1 ? 1.1 : t === 2 ? 1.7 : 0.2);
    H.flag(k, P, 0, top, -0.3, 1.5, 1.1);
    // bậc thềm, cửa chính, cửa sổ
    const zf = d / 2;
    for (let i = 0; i < 3; i++) k.add(K.box(2.2 - i * 0.2, 0.18 + (lift * (2 - i)) / 3, 0.5, 0.03, true), P.stone, 0, y0, zf + 1.1 - i * 0.42);
    H.door(k, P, 0, yb, zf, 1.2, 1.7);
    for (const s of [-1, 1]) H.lightBox(k, P, t, 0.7, 0.75, 0.08, s * 1.75, yb + 1.45, zf + 0.03);
    if (t >= 2) for (const s of [-1, 0, 1]) H.lightBox(k, P, t, 0.6, 0.6, 0.08, s * 1.6, yb + h - 0.75, zf + 0.03);
  });
})(typeof self !== 'undefined' ? self : globalThis);
