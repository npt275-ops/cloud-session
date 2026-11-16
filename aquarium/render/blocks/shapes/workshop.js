/* Bể Kính · render/blocks/shapes/workshop.js · Hình khối Xưởng xe (render/blocks/blocks.js)
 * Dáng nhận diện: thân cao, cửa rất rộng ở mặt trước (xe ra vào), mái cao, bánh xe lớn dựng bên hông, một cỗ xe phá cổng
 * (khúc gỗ trên hai bánh) đỗ trước cửa.
 *   bậc 0 gỗ tre   vách gỗ, mái rơm cao     bậc 1 đá       tường đá, mái ngói
 *   bậc 2 gạch thép mái răng cưa nhà máy, ống khói cao   bậc 3 tương lai mái vòm, cửa sáng, vành bánh xe sáng
 *   bậc 4 huyền ảo  xưởng vòm kính có sườn sáng, cổng không gian, hai bánh răng bay quay, xe bay (render/blocks/mythic.js) */
(function (root) {
  const BK = root.BK;
  // xưởng huyền ảo: xưởng vòm kính có sườn sáng, cổng không gian trước cửa (vòng sáng đứng, lòng cổng sáng), hai bánh răng bay
  // quay, cỗ xe bay lơ lửng, biểu tượng đảo trên nóc
  function mythic(k, P, H, y0) {
    const K = BK.BuildKit,
      T = root.THREE;
    H.wall(k, P, 4, { w: 4.2, h: 2.4, d: 3.6, x: 0, y: y0, z: -0.7 });
    k.add(K.box(4.3, 0.14, 3.7, 0.02, true), P.wall2, 0, y0 + 2.4, -0.7);
    k.add(K.lathe([[1.75, 0], [1.6, 0.6], [1.2, 1.2], [0.6, 1.6], [0.01, 1.7]], 12), P.wall2, 0, y0 + 2.54, -0.7);
    const rib = new T.TorusGeometry(1.7, 0.04, 4, 16, Math.PI);
    for (let i = 0; i < 3; i++) k.add(rib, P.glow, 0, y0 + 2.54, -0.7, { glow: true, rot: [0, (i * Math.PI) / 3, 0] });
    H.crown(k, P, 0, y0 + 4.25, -0.7, 0.7);
    H.door(k, P, 0, y0, 1.1, 2.2, 1.9, 4);
    // cổng không gian: vòng sáng đứng, lòng cổng
    k.add(new T.TorusGeometry(1.0, 0.1, 6, 28), P.accent, 1.6, y0 + 1.25, 2.1, { glow: true, rot: [0, 0.5, 0] });
    k.add(K.post(0.9, 0.04, 20), P.glow, 1.6, y0 + 1.25, 2.1, { glow: true, rot: [Math.PI / 2, 0, -0.5] });
    // hai bánh răng bay quay
    const gear = (name, x, y, z, r) => {
      const g = k.sub(name, [x, y, z]);
      g.add(new T.TorusGeometry(r, r * 0.16, 5, 20), P.metal, 0, 0, 0);
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2;
        g.add(K.box(r * 0.22, r * 0.22, r * 0.22, 0.01), P.metal, Math.cos(a) * r * 1.12, Math.sin(a) * r * 1.12, 0, { rot: [0, 0, a] });
      }
      g.add(K.ball(r * 0.25, 0), P.glow, 0, 0, 0, { glow: true });
    };
    gear('spin0', -2.5, y0 + 2.3, -0.2, 0.6);
    gear('spin1', -2.5, y0 + 1.1, 0.9, 0.4);
    // cỗ xe bay lơ lửng
    const c = k.sub('float0', [-1.3, y0 + 0.7, 2.1]);
    c.add(K.ball(0.6, 1), P.wall, 0, 0, 0, { sc: [1.5, 0.45, 0.9] });
    c.add(K.box(0.6, 0.18, 0.45, 0.03), '#9fe8ff', 0.25, 0.22, 0);
    H.torus(c, P.glow, 0.7, 0.04, 0, -0.18, 0, { glow: true });
  }
  BK.Blocks.shape('workshop', (k, P, t, H) => {
    const K = BK.BuildKit,
      T = root.THREE,
      y0 = H.PLINTH;
    H.plinth(k, P, 5.6, 5.6);
    if (t === 4) return mythic(k, P, H, y0);
    const w = 4.2,
      d = 3.6,
      h = 2.6 + 0.2 * t,
      zb = -0.7,
      zf = zb + d / 2;
    H.wall(k, P, t, { w, h, d, x: 0, y: y0, z: zb });
    const yr = y0 + h;
    if (t <= 1) H.roof(k, P, t, { w: w + 0.7, h: t === 0 ? 1.7 : 1.3, d: d + 0.6, tw: w + 0.4, td: 0.4, lift: t === 1 ? 0.3 : 0, x: 0, y: yr, z: zb });
    else if (H.form(P, 'roof', t) !== 'native') H.roof(k, P, t, { w: w + 0.4, h: 1.2, d: d + 0.4, x: 0, y: yr, z: zb });
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
