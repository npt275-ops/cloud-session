/* Bể Kính · render/blocks/shapes/barracks.js · Hình khối Nhà lính (render/blocks/blocks.js)
 * Người chơi chốt: nhà lính rộng hơn và có sân tập. Khối 8 × 7: nhà ở phía sau, sân tập rào kín phía trước (+z) có lính tập.
 * Chung mọi bậc: sân đất nện, hình nộm tập đánh gần, bia tập bắn xa, giá vũ khí, cờ đỏ, lính đứng tập trên sân.
 *   bậc 0 gỗ tre    nhà dài vách gỗ mái rơm, sân rào cọc nhọn, hai hình nộm rơm, một bia, bếp lửa trại
 *   bậc 1 đá        doanh trại đá có răng tường, tường đá thấp quanh sân, chòi canh ở góc, hai bia, hai giá giáo
 *   bậc 2 gạch thép doanh trại hai tầng mái tôn, sân duyệt binh kẻ vạch, rào chắn vượt chướng ngại, cột cờ giữa, lính xếp hàng
 *   bậc 3 tương lai nhà chứa mái vòm sẫm có dải sáng, bãi đáp tròn có vành sáng, bia ảnh nổi phát sáng (viền neon: blocks.js) */
(function (root) {
  const BK = root.BK;
  const K = () => BK.BuildKit;
  const ZB = -2.0, // tâm nhà (phía sau)
    YARD = [-3.5, 3.5, -0.5, 3.1]; // sân tập: x0, x1, z0, z1
  // hình nộm rơm (đánh gần): cọc, tay ngang, đầu
  function dummy(k, P, t, x, y, z) {
    const B = K();
    k.add(B.post(0.07, 1.15, 5), P.trim, x, y, z);
    k.add(B.box(0.35, 0.5, 0.25, 0.04, true), t === 3 ? P.wall2 : '#d8c59a', x, y + 0.55, z);
    k.add(B.box(0.8, 0.07, 0.07, 0.01), P.trim, x, y + 0.9, z);
    k.add(B.ball(0.17, 0), t === 3 ? P.glow : '#d8c59a', x, y + 1.25, z, t === 3 ? { glow: true } : null);
  }
  // bia tròn (bắn xa) trên giá, mặt về +z
  function target(k, P, t, x, y, z) {
    const B = K(),
      R = [Math.PI / 2, 0, 0];
    if (t < 3) for (const s of [-1, 1]) k.add(B.post(0.04, 0.95, 4), P.trim, x + s * 0.3, y, z - 0.1, { rot: [-0.2, 0, 0] });
    const g = t === 3 ? { glow: true } : {};
    k.add(B.post(0.45, 0.06, 12), t === 3 ? P.glow : '#f1ead8', x, y + 1.0, z, Object.assign({ rot: R }, g));
    k.add(B.post(0.28, 0.07, 12), P.accent, x, y + 1.0, z + 0.01, Object.assign({ rot: R }, g));
    k.add(B.post(0.1, 0.08, 8), t === 3 ? P.glow : '#f1ead8', x, y + 1.0, z + 0.02, Object.assign({ rot: R }, g));
  }
  // giá vũ khí: hai cọc, xà ngang, n ngọn giáo dựng nghiêng (dọc trục x)
  function rack(k, P, x, y, z, n) {
    const B = K();
    for (const s of [-1, 1]) k.add(B.post(0.05, 1.1, 5), P.trim, x + s * 0.55, y, z);
    k.add(B.box(1.2, 0.07, 0.07, 0.01), P.trim, x, y + 1.0, z);
    for (let i = 0; i < n; i++) {
      const xx = x - 0.45 + (0.9 * i) / Math.max(1, n - 1);
      k.add(B.post(0.025, 1.6, 4), P.wall2, xx, y, z - 0.1, { rot: [0.12, 0, 0] });
      k.add(B.cone(0.06, 0.22, 4), P.metal, xx, y + 1.58, z + 0.09, { rot: [0.12, 0, 0] });
    }
  }
  // rào quanh sân: ba cạnh (trái, phải, trước), chừa lối vào giữa mặt trước
  function fence(k, color, y, h, step, piece) {
    const [x0, x1, , z1] = YARD;
    for (let x = x0; x <= x1 + 1e-6; x += step) if (Math.abs(x) > 0.8) piece(k, color, x, y, z1, h);
    for (let z = YARD[2]; z < z1; z += step) for (const x of [x0, x1]) piece(k, color, x, y, z, h);
  }
  const stake = (k, c, x, y, z, h) => {
    k.add(K().post(0.07, h, 5), c, x, y, z);
    k.add(K().cone(0.07, 0.18, 5), c, x, y + h, z);
  };
  const block = (k, c, x, y, z, h) => k.add(K().box(0.5, h, 0.5, 0.03, true), c, x, y, z);
  const TIER = [
    // trại gỗ
    (k, P, H) => {
      const B = K(),
        y0 = H.PLINTH;
      k.add(B.box(6.0, 1.6, 2.4, 0.06, true), P.wall, 0, y0, ZB);
      k.add(B.roof(6.8, 1.3, 3.2, 0.08, 6.2, 0.25, 0.4), P.roof, 0, y0 + 1.6, ZB);
      H.door(k, P, 0, y0, ZB + 1.2, 0.9, 1.2);
      for (const x of [-2.0, -1.0, 1.0, 2.0]) H.win(k, P, 0, x, y0 + 0.75, ZB + 1.2, 0.45, 0.4);
      fence(k, P.trim, y0, 0.9, 0.5, stake);
      for (const x of [-2.4, -1.5]) dummy(k, P, 0, x, y0, 0.7);
      target(k, P, 0, 2.4, y0, 0.4);
      rack(k, P, 2.4, y0, 2.4, 4);
      k.add(B.lathe([[0.4, 0], [0.45, 0.12], [0.3, 0.16]], 8), P.stone, -0.3, y0, 2.2); // bếp lửa trại
      k.add(B.cone(0.22, 0.45, 6), '#ff9a3a', -0.3, y0 + 0.1, 2.2, { glow: true });
      H.guard(k, P, 0, -1.95, y0, 1.6);
      H.guard(k, P, 0, 1.2, y0, 1.6);
      H.flag(k, P, -3.2, y0, ZB - 0.6, 3.6, 1.0);
    },
    // doanh trại đá
    (k, P, H) => {
      const B = K(),
        y0 = H.PLINTH,
        h = 2.0;
      k.add(B.box(6.2, h, 2.4, 0.06, true), P.wall, 0, y0, ZB);
      k.add(B.box(6.4, 0.16, 2.6, 0.03, true), P.wall2, 0, y0 + h, ZB);
      H.crenels(k, P.wall2, -3.0, 3.0, y0 + h + 0.16, ZB + 1.15, 9, 0.38, 0.32, 0.3);
      H.door(k, P, 0, y0, ZB + 1.2, 1.0, 1.4);
      for (const x of [-2.2, -1.2, 1.2, 2.2]) H.win(k, P, 1, x, y0 + 1.0, ZB + 1.2, 0.35, 0.55);
      for (const s of [-1, 1]) {
        k.add(B.post(0.34, 0.08, 10), P.accent, s * 0.9, y0 + 1.5, ZB + 1.26, { rot: [Math.PI / 2, 0, 0] }); // khiên treo
        k.add(B.post(0.1, 0.1, 6), P.metal, s * 0.9, y0 + 1.5, ZB + 1.3, { rot: [Math.PI / 2, 0, 0] });
      }
      // chòi canh góc sau trái
      k.add(B.box(1.3, 3.6, 1.3, 0.05, true), P.wall2, -3.0, y0, ZB - 0.4);
      H.crenels(k, P.wall2, -3.5, -2.5, y0 + 3.6, ZB + 0.15, 3, 0.3, 0.3, 0.25);
      H.guard(k, P, 1, -3.0, y0 + 3.6, ZB - 0.4);
      fence(k, P.stone, y0, 0.7, 0.55, block);
      for (const x of [-2.4, -1.5]) dummy(k, P, 1, x, y0, 0.7);
      for (const x of [1.6, 2.6]) target(k, P, 1, x, y0, 0.3);
      rack(k, P, 2.3, y0, 2.4, 4);
      rack(k, P, -2.3, y0, 2.4, 4);
      for (const x of [-0.6, 0.6]) H.guard(k, P, 1, x, y0, 1.5);
      H.flag(k, P, 3.0, y0 + h + 0.16, ZB - 0.6, 1.8, 1.0);
    },
    // doanh trại gạch
    (k, P, H) => {
      const B = K(),
        y0 = H.PLINTH,
        hf = 1.3;
      k.add(B.box(6.6, hf * 2, 2.4, 0.06, true), P.wall, 0, y0, ZB);
      k.add(B.box(6.7, 0.1, 2.5, 0.02, true), '#e8e0d0', 0, y0 + hf, ZB);
      k.add(B.roof(7.0, 0.9, 2.9, 0.05, 6.6, 0.3), P.roof, 0, y0 + hf * 2, ZB);
      for (const x of [-2.6, -1.8, -1.0, 1.0, 1.8, 2.6]) for (const f of [0, 1]) H.win(k, P, 2, x, y0 + 0.5 + f * hf, ZB + 1.2, 0.4, 0.55);
      H.door(k, P, 0, y0, ZB + 1.2, 1.1, 1.1);
      k.add(B.box(1.6, 0.08, 0.6, 0.01), P.roof, 0, y0 + 1.15, ZB + 1.5, { rot: [0.15, 0, 0] });
      // sân duyệt binh: vạch trắng, rào chắn vượt, cột cờ giữa, lính xếp hàng
      fence(k, P.metal, y0, 0.8, 0.5, (kk, c, x, y, z, h) => kk.add(K().box(0.06, h, 0.06, 0.01, true), c, x, y, z));
      for (const z of [0.4, 2.6]) k.add(B.box(6.6, 0.02, 0.08, 0.01, true), '#f2efe6', 0, y0, z);
      for (const x of [-3.2, 3.2]) k.add(B.box(0.08, 0.02, 2.2, 0.01, true), '#f2efe6', x, y0, 1.5);
      for (const x of [1.4, 2.2, 3.0]) {
        for (const s of [-1, 1]) k.add(B.box(0.06, 0.5, 0.06, 0.01, true), P.trim, x + s * 0.3, y0, 2.2);
        k.add(B.box(0.7, 0.08, 0.08, 0.01), P.accent, x, y0 + 0.45, 2.2);
      }
      k.add(B.post(0.06, 3.6, 6), P.metal, 0, y0, 0.8);
      k.add(B.box(1.2, 0.75, 0.04, 0.01), P.accent, 0.64, y0 + 3.0, 0.8);
      for (let i = 0; i < 4; i++) H.guard(k, P, 2, -2.6 + i * 0.6, y0, 1.6);
      target(k, P, 2, -2.9, y0, 0.2);
    },
    // nhà chứa neon
    (k, P, H) => {
      const B = K(),
        y0 = H.PLINTH;
      // mái vòm: nửa ống nằm dọc trục x
      k.add(B.box(6.6, 0.6, 2.6, 0.05, true), P.wall2, 0, y0, ZB);
      k.add(new root.THREE.CylinderGeometry(1.4, 1.4, 6.6, 12, 1, false, 0, Math.PI), P.wall, 0, y0 + 0.6, ZB, { rot: [0, 0, Math.PI / 2] });
      const arc = new root.THREE.TorusGeometry(1.43, 0.05, 4, 16, Math.PI); // dải sáng uốn theo mái vòm
      for (const x of [-2.2, 0, 2.2]) k.add(arc, P.glow, x, y0 + 0.6, ZB, { glow: true, rot: [0, Math.PI / 2, 0] });
      H.lightBox(k, P, 3, 2.2, 1.2, 0.06, 0, y0 + 0.6, ZB + 1.32); // cửa nhà chứa sáng
      H.lightBox(k, P, 3, 6.6, 0.08, 0.06, 0, y0 + 0.5, ZB + 1.32);
      // bãi đáp tròn có vành sáng, bia ảnh nổi, hình nộm sáng
      k.add(B.post(1.3, 0.06, 16), P.stone, 0, y0, 1.4);
      H.torus(k, P.glow, 1.2, 0.05, 0, y0 + 0.07, 1.4, { glow: true });
      k.add(B.box(1.1, 0.02, 0.12, 0.01), P.accent, 0, y0 + 0.07, 1.4, { glow: true });
      k.add(B.box(0.12, 0.02, 1.1, 0.01), P.accent, 0, y0 + 0.07, 1.4, { glow: true });
      fence(k, P.glow, y0, 0.6, 0.7, (kk, c, x, y, z, h) => kk.add(K().box(0.08, h, 0.08, 0.01, true), c, x, y, z, { glow: true }));
      for (const x of [2.2, 3.0]) target(k, P, 3, x, y0, 0.3);
      dummy(k, P, 3, -2.6, y0, 0.7);
      for (const x of [-1.8, 1.8]) H.guard(k, P, 3, x, y0, 1.8);
      H.flag(k, P, -3.2, y0 + 0.6, ZB - 0.9, 2.6, 1.0);
    },
  ];
  BK.Blocks.shape('barracks', (k, P, t, H) => {
    H.plinth(k, P, 7.6, 6.6);
    TIER[t](k, P, H);
  });
})(typeof self !== 'undefined' ? self : globalThis);
