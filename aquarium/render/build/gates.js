/* Bể Kính · render/build/gates.js · Cổng thành của sáu đảo qua 12 thời (72 cổng)
 * Cổng thành đứng ở chính giữa mép trước của đảo, nơi đường lớn từ làng ra biển (outer: 'coast', góc 0, slot 'gate'), mặt
 * trước quay ra biển. Bốn lính gác cổng của làng đứng ở đây (logic/jobs.js gatekeeper, places().gate).
 * Mỗi thời một dáng cổng (ARCH), mỗi đảo một biến thể (ISLE: dáng tháp, kiểu mái, màu, vật trang trí trên đỉnh):
 *   1 đá dựng có đá gác ngang · 2 cổng gỗ có chòi · 3 cổng thành đá hai tháp tròn · 4 cổng gạch có đồng hồ · 5 cổng vòm sắt
 *   6 cổng bê tông mái thép · 7 cột ra-đa trắng · 8 khung quét an ninh · 9 vòm cây sống · 10 vòm mặt trời · 11 cổng không gian
 *   12 cổng ánh sáng lơ lửng
 * Lối giữa cổng rộng 3,6 cho đường đi qua. BK.Gates3D.addTo(E, cấp, đảo) thêm cổng chính và hai cổng phụ đầu cầu vào bố cục một thời. Cần: kit3d, common. */
(function (root) {
  const BK = root.BK,
    K = BK.BuildKit,
    { B, Bc } = BK.Plains3D;
  const THREE = () => window.THREE;
  const torus = (r, t, a) => new (THREE().TorusGeometry)(r, t, 6, 24, a);
  // biến thể theo đảo: màu (a tường, b mái, c nhấn, d sẫm, g sáng), dáng tháp, kiểu mái, vật trên đỉnh
  const ISLE = {
    plains: { a: '#b5654a', b: '#a8523a', c: '#e6c04a', d: '#3e2c20', g: '#ffd27a', shape: 'round', roof: 'cone', top: 'flag' },
    forest: { a: '#8a6a44', b: '#3f6a4a', c: '#c94f3a', d: '#2a2a20', g: '#c8ff9a', shape: 'square', roof: 'pagoda', top: 'leaf' },
    mountain: { a: '#9a9488', b: '#5a6478', c: '#b8582e', d: '#33302c', g: '#bfe3ff', shape: 'hex', roof: 'crenel', top: 'bell' },
    tundra: { a: '#e8eef4', b: '#7fa8d8', c: '#5fc8e8', d: '#3a4048', g: '#c8fff0', shape: 'round', roof: 'dome', top: 'crystal' },
    coast: { a: '#f2f2ee', b: '#3f7fb8', c: '#5fd8e0', d: '#2a3440', g: '#bff0ff', shape: 'round', roof: 'sail', top: 'lantern' },
    desert: { a: '#e8c09a', b: '#c87a5a', c: '#5fb8c8', d: '#4a3426', g: '#ffd0a0', shape: 'square', roof: 'onion', top: 'sun' },
  };
  const seg = { round: 10, square: 4, hex: 6 };
  // một tháp hai bên cổng theo biến thể đảo
  function tower(k, V, x, h, w, col) {
    const n = seg[V.shape];
    k.add(K.post(w, h, n, w * 0.92), col || V.a, x, 0, 0, { rot: [0, V.shape === 'square' ? Math.PI / 4 : 0, 0] });
    if (V.roof === 'cone') k.add(K.cone(w * 1.25, w * 1.8, n), V.b, x, h, 0);
    else if (V.roof === 'pagoda') {
      for (let i = 0; i < 2; i++)
        k.add(K.roof(w * 2.6 - i * 0.6, 0.5, w * 2.6 - i * 0.6, 0.08, w * 1.2, w * 1.2, 0.5), V.b, x, h + i * 0.9, 0);
    } else if (V.roof === 'crenel') {
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        k.add(B(0.5, 0.6, 0.5, 0.05), col || V.a, x + Math.cos(a) * w * 0.85, h, Math.sin(a) * w * 0.85);
      }
    } else if (V.roof === 'dome') k.add(K.ball(w * 1.05, 1), V.b, x, h, 0, { sc: [1, 0.8, 1] });
    else if (V.roof === 'sail') k.add(Bc(0.08, w * 2.4, w * 1.6, 0.02), V.b, x, h + w * 1.2, 0, { rot: [0, 0, 0.12] });
    else if (V.roof === 'onion')
      k.add(
        K.lathe(
          [
            [w * 0.9, 0],
            [w * 1.2, w * 0.6],
            [w * 0.6, w * 1.4],
            [0.001, w * 2.1],
          ],
          n + 2,
        ),
        V.b,
        x,
        h,
        0,
      );
  }
  // vật trên đỉnh cổng theo biến thể đảo (y: độ cao)
  function top(k, V, y) {
    if (V.top === 'flag') {
      const f = k.sub('flag', [0, y, 0]);
      f.add(K.post(0.05, 2.6, 4), V.d, 0, 0, 0);
      f.add(Bc(1.6, 0.9, 0.04, 0.01), V.c, 0.8, 2.1, 0);
      return ['sway', ['flag', 'y', 0.5, 1.3]];
    }
    if (V.top === 'leaf') {
      k.add(K.ball(1.1, 1), '#5a9646', 0, y + 0.8, 0, { sc: [1.4, 0.8, 1] });
      return null;
    }
    if (V.top === 'bell') {
      const b = k.sub('bell', [0, y + 1.4, 0]);
      b.add(
        K.lathe(
          [
            [0.001, 0],
            [0.35, -0.1],
            [0.55, -0.9],
            [0.001, -0.9],
          ],
          8,
        ),
        '#d4a63a',
        0,
        0,
        0,
      );
      k.add(Bc(1.6, 0.15, 0.15, 0.02), V.d, 0, y + 1.45, 0);
      return ['sway', ['bell', 'x', 0.35, 1.5]];
    }
    if (V.top === 'crystal') {
      k.add(new (THREE().OctahedronGeometry)(0.7, 0), V.g, 0, y + 1, 0, { glow: true, sc: [0.7, 1.5, 0.7] });
      return null;
    }
    if (V.top === 'lantern') {
      k.add(B(0.6, 0.8, 0.6, 0.05), V.d, 0, y, 0);
      k.add(B(0.4, 0.5, 0.4, 0.02), V.g, 0, y + 0.15, 0, { glow: true });
      return null;
    }
    if (V.top === 'sun') {
      const s = k.sub('sun', [0, y + 1.2, 0]);
      s.add(K.post(0.9, 0.12, 12, 0.9).rotateX(Math.PI / 2), V.c, 0, 0, 0);
      for (let i = 0; i < 8; i++)
        s.add(Bc(0.14, 0.7, 0.06, 0.02), V.c, Math.cos(i * 0.785) * 1.2, Math.sin(i * 0.785) * 1.2, 0, {
          rot: [0, 0, i * 0.785 - Math.PI / 2],
        });
      return ['spin', ['sun', 'z', 0.3]];
    }
    return null;
  }
  const HALF = 1.8; // nửa bề rộng lối đi
  const ARCH = [
    null,
    // 1 đá dựng: hai khối đá cao, đá gác ngang, đuốc hai bên
    (k, V) => {
      for (const sx of [-1, 1]) {
        k.add(B(1.4, 4.4, 1.2, 0.2), V.a, sx * (HALF + 0.7), 0, 0, { rot: [0, 0, sx * -0.04] });
        k.add(K.post(0.08, 1.4, 4), V.d, sx * (HALF + 2), 0, 1);
        k.add(K.cone(0.25, 0.6, 5), '#ff9a2e', sx * (HALF + 2), 1.4, 1, { glow: true });
      }
      k.add(B(HALF * 2 + 3.4, 0.9, 1.3, 0.2), V.a, 0, 4.4, 0);
      return 5.3;
    },
    // 2 cổng gỗ: hai chòi canh trên cột, cánh cổng gỗ, hàng cọc nhọn
    (k, V) => {
      for (const sx of [-1, 1]) {
        const x = sx * (HALF + 1.2);
        for (const dx of [-0.8, 0.8]) for (const dz of [-0.8, 0.8]) k.add(K.post(0.12, 5, 5), V.d, x + dx, 0, dz);
        k.add(B(2.4, 0.2, 2.4, 0.04), V.a, x, 5, 0);
        k.add(K.roof(2.8, 1.4, 2.8, 0.08, 0.2, 0.2), V.b, x, 5.8, 0);
        for (let i = 0; i < 4; i++) k.add(K.cone(0.16, 3.2, 5), V.a, x + sx * (1.6 + i * 0.4), 0, 0);
      }
      k.add(Bc(HALF * 2 + 1, 0.3, 0.3, 0.05), V.d, 0, 4.2, 0);
      for (const sx of [-1, 1]) k.add(B(HALF - 0.1, 3.4, 0.2, 0.04), V.a, (sx * HALF) / 2, 0, -0.4, { rot: [0, sx * 0.9, 0] });
      return 6.2;
    },
    // 3 cổng thành đá: hai tháp, tường có răng cưa, cổng vòm, cửa sắt
    (k, V) => {
      for (const sx of [-1, 1]) tower(k, V, sx * (HALF + 1.8), 7, 1.6);
      k.add(B(HALF * 2 + 2, 5.4, 2.4, 0.1), V.a, 0, 0, 0);
      for (let i = 0; i < 5; i++) k.add(B(0.6, 0.7, 2.4, 0.05), V.a, -HALF + (i * HALF) / 2, 5.4, 0);
      k.add(B(HALF * 2 - 0.4, 3.4, 2.5, 0.05), V.d, 0, 0, 0);
      k.add(torus(HALF - 0.2, 0.25, Math.PI), V.c, 0, 3.4, 1.26);
      for (let i = 0; i < 3; i++) k.add(Bc(0.6, 0.9, 0.06, 0.02), '#ffd27a', -1.2 + i * 1.2, 4.5, 1.24, { lit: true });
      return 6.1;
    },
    // 4 cổng gạch có đồng hồ: vòm lớn, trán tường tam giác, đồng hồ giữa, hai nhà gác hai bên
    (k, V) => {
      for (const sx of [-1, 1]) {
        k.add(B(2.6, 4.6, 3, 0.1), V.a, sx * (HALF + 1.5), 0, 0);
        tower(k, V, sx * (HALF + 1.5), 4.6, 0.9, V.a);
      }
      k.add(B(HALF * 2 + 0.4, 1.8, 3, 0.1), V.a, 0, 4.4, 0);
      k.add(K.roof(HALF * 2 + 1, 1.6, 3.2, 0.1, 0.3, 3), V.b, 0, 6.2, 0);
      k.add(new (THREE().CylinderGeometry)(0.8, 0.8, 0.1, 14).rotateX(Math.PI / 2), '#f2f2ee', 0, 5.3, 1.56, { ao: false });
      k.add(Bc(0.08, 0.6, 0.04, 0.01), V.d, 0, 5.5, 1.62);
      k.add(torus(HALF, 0.2, Math.PI), V.c, 0, 2.6, 1.52);
      return 7.8;
    },
    // 5 cổng vòm sắt: hai trụ gạch, vòm giàn thép, chữ tên đảo, đèn khí
    (k, V) => {
      for (const sx of [-1, 1]) {
        k.add(B(1.2, 5, 1.2, 0.08), V.a, sx * (HALF + 0.8), 0, 0);
        k.add(B(1.4, 0.4, 1.4, 0.05), V.c, sx * (HALF + 0.8), 5, 0);
        k.add(K.post(0.05, 2.4, 4), V.d, sx * (HALF + 2.2), 0, 0.8);
        k.add(B(0.3, 0.4, 0.3, 0.02), V.g, sx * (HALF + 2.2), 2.5, 0.8, { glow: true });
      }
      for (let i = 0; i < 9; i++) {
        const a = Math.PI * (i / 8);
        k.add(Bc(0.12, 1, 0.12, 0.02), '#3a3a3e', Math.cos(a) * (HALF + 0.8), 5 + Math.sin(a) * 2.4, 0, { rot: [0, 0, a] });
      }
      k.add(Bc(HALF * 2 + 2, 0.7, 0.1, 0.02), V.b, 0, 5.6, 0.1);
      return 7.6;
    },
    // 6 cổng bê tông: hai khối đứng, mái thép đua dài, chòi bảo vệ, thanh chắn
    (k, V) => {
      for (const sx of [-1, 1]) k.add(B(1.6, 6, 2.4, 0.1), V.a, sx * (HALF + 1), 0, 0);
      k.add(B(HALF * 2 + 6, 0.5, 4, 0.08), V.b, 0, 6, 0.4);
      k.add(B(1.8, 2.4, 1.8, 0.08), V.a, HALF + 3.4, 0, 1.4);
      k.add(Bc(1.2, 0.6, 0.04, 0.01), V.g, HALF + 3.4, 1.6, 2.32, { lit: true });
      const bar = k.sub('bar', [HALF - 0.2, 1.1, 1.6]);
      bar.add(Bc(HALF * 2 - 0.4, 0.12, 0.12, 0.02), V.c, -(HALF - 0.2), 0, 0);
      return 6.6;
    },
    // 7 cột ra-đa: hai cột trắng cao, vòm ra-đa quay, dải đèn nối hai cột
    (k, V) => {
      for (const sx of [-1, 1]) {
        k.add(K.post(0.9, 9, seg[V.shape], 0.6), V.a, sx * (HALF + 1), 0, 0);
        k.add(K.ball(1.1, 1), '#e2e0da', sx * (HALF + 1), 9.4, 0);
      }
      const r = k.sub('radar', [0, 7.6, 0]);
      r.add(Bc(HALF * 2 + 2, 0.3, 0.6, 0.05), V.c, 0, 0, 0);
      k.add(Bc(HALF * 2, 0.15, 0.15, 0.02), V.g, 0, 5, 0.5, { glow: true });
      return 10.6;
    },
    // 8 khung quét an ninh: khung chữ nhật sẫm, vòng quét sáng chạy lên xuống, khối rô-bốt gác
    (k, V) => {
      for (const sx of [-1, 1]) {
        k.add(B(1, 6, 2, 0.15), V.d, sx * (HALF + 0.5), 0, 0);
        k.add(B(1, 1.6, 1, 0.2), '#e2e0da', sx * (HALF + 2.2), 0, 1.2);
        k.add(K.ball(0.18), V.g, sx * (HALF + 2.2), 1.8, 1.4, { glow: true });
      }
      k.add(B(HALF * 2 + 2, 1, 2, 0.15), V.d, 0, 6, 0);
      const s = k.sub('scan', [0, 2, 0]);
      s.add(Bc(HALF * 2, 0.12, 1.8, 0.02), V.g, 0, 0, 0, { glow: true });
      return { h: 7, anim: ['slide', ['scan', 'y', 0.9, 1.8]] };
    },
    // 9 vòm cây sống: hai thân cây xoắn uốn vào nhau, hoa sáng, dây leo
    (k, V) => {
      for (const sx of [-1, 1])
        for (let i = 0; i < 6; i++) {
          const t = i / 5,
            x = sx * (HALF + 1 - t * (HALF + 0.6)),
            y = t * 6;
          k.add(K.ball(0.7 - t * 0.2, 0), '#7a5a48', x, y, Math.sin(i) * 0.3);
        }
      k.add(K.ball(2.4, 1), '#5a9646', 0, 7, 0, { sc: [1.6, 0.8, 1.2] });
      for (let i = 0; i < 6; i++)
        k.add(K.ball(0.3), V.g, Math.cos(i * 1.1) * 2.6, 6.4 + (i % 2) * 0.8, Math.sin(i * 1.1) * 1.2, { glow: true });
      return { h: 8.4, anim: ['pulse', true] };
    },
    // 10 vòm mặt trời: vòm vàng nửa tròn, đĩa mặt trời giữa, tấm hứng nắng hai bên
    (k, V) => {
      k.add(torus(HALF + 1.2, 0.5, Math.PI), V.c, 0, 0, 0);
      k.add(K.post(1.2, 0.2, 14, 1.2).rotateX(Math.PI / 2), V.g, 0, HALF + 2.6, 0, { glow: true });
      for (const sx of [-1, 1])
        for (let i = 0; i < 3; i++)
          k.add(Bc(1.4, 0.06, 0.9, 0.02), '#e8b84a', sx * (HALF + 2.8 + i * 1.4), 1.2 + i * 0.6, 0, { rot: [0.5, 0, 0] });
      return { h: HALF + 3.6, anim: ['pulse', true] };
    },
    // 11 cổng không gian: vòng cổng đứng trên bệ, mặt cổng xoáy, đá lơ lửng
    (k, V) => {
      k.add(B(HALF * 2 + 4, 0.6, 2.4, 0.1), V.d, 0, 0, 0);
      k.add(torus(HALF + 0.8, 0.45), V.a, 0, HALF + 1.4, 0);
      const s = k.sub('swirl', [0, HALF + 1.4, 0]);
      s.add(torus(HALF + 0.3, 0.12), V.g, 0, 0, 0, { glow: true });
      s.add(torus(HALF - 0.4, 0.08), V.c, 0, 0, 0, { glow: true });
      for (const sx of [-1, 1]) {
        const r = k.sub('rock' + (sx > 0 ? 'R' : 'L'), [sx * (HALF + 3), 3.4, 0]);
        r.add(K.ball(0.7, 0), V.a, 0, 0, 0);
      }
      return {
        h: HALF * 2 + 3,
        anim: ['spin', ['swirl', 'z', 0.9]],
        anim2: [
          'bob',
          [
            ['rockL', 0.5, 0.4],
            ['rockR', 0.5, 0.45],
          ],
        ],
      };
    },
    // 12 cổng ánh sáng: hai cột sáng mảnh, vòm sáng nối trên cao, khối pha lê bay giữa
    (k, V) => {
      for (const sx of [-1, 1])
        for (let i = 0; i < 3; i++) k.add(K.post(0.07, 6 + i * 1.4, 4, 0.02), V.g, sx * (HALF + 0.6 + i * 0.6), 0, 0, { glow: true });
      k.add(torus(HALF + 1.2, 0.12, Math.PI), V.c, 0, 6.6, 0, { glow: true });
      const c = k.sub('gem', [0, 9.6, 0]);
      c.add(new (THREE().OctahedronGeometry)(0.8, 0), V.c, 0, 0, 0, { glow: true, sc: [0.7, 1.5, 0.7] });
      return { h: 9, anim: ['bob', [['gem', 0.5, 0.4]]], anim2: ['spin', ['gem', 'y', 0.8]] };
    },
  ];
  // phần kiến trúc riêng của từng đảo trên mọi cổng (h: độ cao cổng; fut: thời tương lai thì phát sáng)
  const W2 = HALF + 4.6; // khoảng cách hai bên cho phần riêng của đảo
  const EXTRA = {
    plains(k, V, h, fut) {
      for (const sx of [-1, 1]) {
        k.add(Bc(1, 2.4, 0.05, 0.01), V.c, sx * (HALF + 0.9), h * 0.55, 1.4, { glow: fut });
        k.add(K.cone(0.3, 0.5, 3), V.c, sx * (HALF + 0.9), h * 0.55 - 1.45, 1.4, { rot: [Math.PI, 0, 0] });
      }
      k.add(K.post(0.7, 0.12, 10, 0.7).rotateX(Math.PI / 2), V.g, 0, h - 0.6, 1.45, { glow: fut });
    },
    forest(k, V, h, fut) {
      k.add(K.roof(HALF * 2 + 8, 1.4, 4.4, 0.12, HALF * 2 + 2, 0.4, 0.8), V.b, 0, h + 0.2, 0);
      for (const sx of [-1, 1]) {
        k.add(K.post(0.45, 4.4, 7), '#7a5a3a', sx * W2, 0, 1.2);
        for (let i = 0; i < 3; i++)
          k.add(B(1.1, 0.9, 1.1, 0.12), [V.c, V.g, V.b][i], sx * W2, 0.8 + i * 1.2, 1.2, { glow: fut && i === 1 });
      }
    },
    mountain(k, V, h, fut) {
      for (const sx of [-1, 1])
        for (let i = 0; i < 3; i++) k.add(B(1.6, h * (1 - i * 0.28), 2.6 - i * 0.4, 0.15), V.a, sx * (HALF + 3.4 + i * 1.5), 0, 0);
      k.add(K.ball(3.2, 0), V.b, 0, 0, -2.4, { sc: [2.4, 0.5, 1] });
      if (fut) k.add(Bc(HALF * 2 + 8, 0.12, 0.12, 0.02), V.g, 0, h * 0.4, 1.4, { glow: true });
    },
    tundra(k, V, h, fut) {
      for (let i = 0; i < 7; i++)
        k.add(new (THREE().OctahedronGeometry)(0.45, 0), fut ? V.g : V.c, -3 + i, h + 0.6 + (i % 2) * 0.4, 0, {
          sc: [0.6, 1.8, 0.6],
          glow: fut,
        });
      for (const sx of [-1, 1])
        k.add(new (THREE().OctahedronGeometry)(1, 0).scale(0.9, h * 0.6, 0.9).translate(0, h * 0.6, 0), V.a, sx * W2, 0, 0.6);
    },
    coast(k, V, h, fut) {
      for (const sx of [-1, 1]) {
        for (let i = 0; i < 4; i++)
          k.add(K.post(0.75 - i * 0.07, h * 0.3, 10, 0.7 - i * 0.07), i % 2 ? V.b : V.a, sx * W2, i * h * 0.3, 0.4);
        k.add(K.post(0.5, 0.8, 8), V.g, sx * W2, h * 1.2, 0.4, { glow: true });
        k.add(K.cone(0.6, 0.7, 8), V.b, sx * W2, h * 1.2 + 0.8, 0.4);
      }
      k.add(torus(HALF + 2.4, 0.12, Math.PI), V.c, 0, h * 0.45, 1.5, { glow: fut });
    },
    desert(k, V, h, fut) {
      for (const sx of [-1, 1]) {
        k.add(K.post(0.55, h * 1.4, 8, 0.45), V.a, sx * W2, 0, 0);
        k.add(K.post(0.75, 0.3, 8), V.c, sx * W2, h * 0.9, 0);
        k.add(
          K.lathe(
            [
              [0.5, 0],
              [0.8, 0.5],
              [0.4, 1.1],
              [0.001, 1.7],
            ],
            10,
          ),
          fut ? V.g : V.b,
          sx * W2,
          h * 1.4,
          0,
          { glow: fut },
        );
      }
      for (const sx of [-1, 1]) k.add(Bc(0.3, h * 0.55, 0.3, 0.04), V.c, sx * (HALF + 0.2), h * 0.42, 1.45, { rot: [0, 0, sx * 0.22] });
    },
  };
  // ghép: dáng cổng của thời + biến thể của đảo, kèm vật trên đỉnh và phần chuyển động
  function gate(k, o) {
    const V = ISLE[o.isle] || ISLE.plains,
      r = ARCH[o.lv](k, V),
      h = typeof r === 'number' ? r : r.h,
      A = {};
    const add = (x) => {
      if (!x) return;
      const [t, v] = x;
      if (t === 'pulse') A.pulse = true;
      else (A[t] || (A[t] = [])).push(...(Array.isArray(v[0]) ? v : [v]));
    };
    if (typeof r === 'object') {
      add(r.anim);
      add(r.anim2);
    }
    if (EXTRA[o.isle]) EXTRA[o.isle](k, V, h, o.lv >= 9);
    if (o.lv <= 7) add(top(k, V, h)); // thời sau đã có phần sáng riêng trên đỉnh
    return A;
  }
  const ERA_NAME = [
    null,
    'Cổng đá dựng',
    'Cổng gỗ có chòi',
    'Cổng thành đá',
    'Cổng gạch đồng hồ',
    'Cổng vòm sắt',
    'Cổng bê tông',
    'Cổng cột ra-đa',
    'Cổng quét an ninh',
    'Vòm cây sống',
    'Vòm mặt trời',
    'Cổng không gian',
    'Cổng ánh sáng',
  ];
  const ISLE_NAME = {
    plains: 'Lúa Vàng',
    forest: 'Thông Xanh',
    mountain: 'Đá Mây',
    tundra: 'Tuyết Trắng',
    coast: 'Cửa Sóng',
    desert: 'Cát Hồng',
  };
  // thêm cổng thành vào bố cục một thời, dựng ngay sau nhà chính
  function addTo(E, lv, isle) {
    const at = Math.max(1, E.pieces.findIndex((x) => x.kind === 'hall') + 1);
    E.pieces.splice(at, 0, { kind: 'gate', x: 0, z: 0, outer: 'coast', a: 0, slot: 'gate', solo: true, clear: 4, isle, lv, gate: true });
    E.BUILD.gate = gate;
    E.NAME.gate = ERA_NAME[lv] + ' ' + ISLE_NAME[isle];
    // hai cổng phụ ở hai chỗ hở tường nơi bắc cầu sang hai đảo bên cạnh (L.wallGaps[1], [2]; design/ke-hoach-buoc-12.md mục 2):
    // cùng kiến trúc cổng chính của đảo và thời đó, nhỏ hơn (fit). Thêm vào cuối danh sách để khớp thứ tự công trình với logic
    // (logic/construction.js: công trình ngoài danh sách của logic coi như đã dựng xong)
    for (const [slot, gap] of [
      ['gateL', 1],
      ['gateR', 2],
    ])
      E.pieces.push({
        kind: 'gateSide',
        x: 0,
        z: 0,
        outer: 'coast',
        gap,
        slot,
        solo: true,
        clear: 3,
        isle,
        lv,
        gate: true,
        side: true,
        fit: 7.5,
      });
    E.BUILD.gateSide = gate;
    E.NAME.gateSide = 'Cổng phụ ' + ISLE_NAME[isle];
  }
  BK.Gates3D = { ISLE, ARCH, gate, addTo, ERA_NAME };
  for (let lv = 1; lv <= 12; lv++) if (BK.Plains3D.ERA[lv]) addTo(BK.Plains3D.ERA[lv], lv, 'plains');
})(typeof self !== 'undefined' ? self : globalThis);
