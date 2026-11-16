/* Bể Kính · render/blocks/shapes/granary.js · Hình khối Kho lương (render/blocks/blocks.js)
 * Dáng nhận diện: hai thân tròn phình (vựa) mái vòm đứng cạnh nhau, bao tải và thùng xếp bên ngoài.
 *   bậc 0 gỗ tre   vựa đan tre trên cột kê, mái rơm chóp     bậc 1 đá       vựa đá, mái ngói chóp
 *   bậc 2 gạch thép hai xi lô thép có đai, thang          bậc 3 tương lai xi lô trắng, vành sáng, mái vòm kính
 *   bậc 4 huyền ảo  cột giữa có biểu tượng đảo, ba quả cầu lương thực sáng trong lồng vàng bay vòng quanh (render/blocks/mythic.js) */
(function (root) {
  const BK = root.BK;
  BK.Blocks.shape('granary', (k, P, t, H) => {
    const K = BK.BuildKit,
      y0 = H.PLINTH;
    H.plinth(k, P, 5.6, 5.6);
    if (t === 4) {
      // kho huyền ảo: cột giữa có biểu tượng đảo, ba quả cầu lương thực sáng trong lồng vành vàng bay vòng quanh, vòng chữ cổ
      k.add(K.post(0.35, 3.0, 8, 0.25), P.wall, 0, y0, -0.3);
      H.crown(k, P, 0, y0 + 3.05, -0.3, 0.8);
      H.runes(k, P, 0, y0, -0.3, 2.3);
      const o = k.sub('spin0', [0, y0 + 1.7, -0.3]);
      for (let i = 0; i < 3; i++) {
        const a = (i / 3) * Math.PI * 2;
        o.add(K.ball(0.55, 1), P.glow, Math.cos(a) * 1.6, 0, Math.sin(a) * 1.6, { glow: true });
        for (const r of [0, Math.PI / 2]) H.torus(o, P.metal, 0.62, 0.03, Math.cos(a) * 1.6, 0, Math.sin(a) * 1.6, { rot: [0, r, 0] });
      }
      for (const [x, z] of [[0.9, 1.9], [1.4, 2.05], [1.15, 1.75]]) k.add(K.ball(0.3, 1), '#f0e0b0', x, y0 + 0.28, z, { sc: [1, 0.75, 1] });
      return;
    }
    const silo = (x, z, r, h) => {
      const lift = t === 0 ? 0.5 : 0;
      if (t === 0) for (let i = 0; i < 4; i++) k.add(K.post(0.08, lift, 5), P.trim, x + Math.cos(i * 1.57 + 0.78) * r * 0.7, y0, z + Math.sin(i * 1.57 + 0.78) * r * 0.7);
      const yb = y0 + lift,
        body = t >= 2 ? [[r, 0], [r, h]] : [[r * 0.85, 0], [r, h * 0.35], [r * 0.98, h * 0.8], [r * 0.9, h]];
      k.add(K.lathe(body.concat([[0.01, h]]), 10), t >= 2 ? P.metal : P.wall, x, yb, z);
      if (t === 2) for (const y of [0.3, 0.6, 0.9]) k.add(K.lathe([[r + 0.05, h * y], [r + 0.05, h * y + 0.08]], 10), P.trim, x, yb, z);
      if (t === 3) k.add(K.lathe([[r + 0.04, h * 0.5], [r + 0.04, h * 0.58]], 10), P.glow, x, yb, z, { glow: true });
      const yr = yb + h;
      const cap = (kk) =>
        t <= 1
          ? kk.add(K.cone(r + 0.3, 1.1, 10), P.roof, x, yr, z)
          : kk.add(K.lathe([[r + 0.05, 0], [r * 0.8, r * 0.45], [0.01, r * 0.62]], 10), t === 3 ? P.glow : P.roof, x, yr, z, t === 3 ? { glow: true } : null);
      H.roofRound(k, P, t, { r: r + 0.05, h: 1.1, x, y: yr, z, native: cap });
      H.door(k, P, x, yb, z + r - 0.05, 0.5, 0.8);
      if (t === 2) for (let i = 0; i < 7; i++) k.add(K.box(0.36, 0.04, 0.04, 0.01), P.dark, x + r + 0.05, yb + 0.3 + i * 0.42, z, { rot: [0, Math.PI / 2, 0] });
    };
    silo(-1.15, -0.7, 1.15, 2.6 + 0.3 * t);
    silo(1.3, -0.9, 0.95, 2.1 + 0.3 * t);
    // bao tải, thùng
    for (const [x, z] of [[0.9, 1.6], [1.4, 1.75], [1.15, 1.45]]) k.add(K.ball(0.3, 1), '#d9c79a', x, y0 + 0.28, z, { sc: [1, 0.75, 1] });
    for (const [x, z] of [[-1.6, 1.5], [-1.0, 1.7]]) k.add(K.post(0.26, 0.55, 8), P.trim, x, y0, z);
  });
})(typeof self !== 'undefined' ? self : globalThis);
