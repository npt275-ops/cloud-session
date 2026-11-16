/* Bể Kính · render/blocks/isles/mountain.js · Đá Mây (Núi): vỏ khối công trình
 * Làng đá trên núi: tường đá xếp lớp mọi bậc xưa, mái đá bằng (bậc 1), mái ngói cong góc kiểu chùa (bậc 2), hai tầng mái cong
 * (bậc 3), khối bậc thang viền sáng cam (bậc 4). Bệ đá tảng. Lính mũ lông, mũ sắt.
 * Biểu tượng cạnh nhà chính: tháp đá (bậc 1 ụ đá xếp, bậc 2 tháp đá, bậc 3 tháp chóp vàng, bậc 4 tảng đá lơ lửng có vành
 * sáng). Đồ trang trí: đá tảng, dây cờ phướn. Cần: blocks.js, props.js. */
(function (root) {
  const BK = root.BK,
    Pr = BK.Blocks.props;
  function stupa(k, P, t, x, y, z) {
    const B = BK.BuildKit;
    if (t === 0) {
      for (let i = 0; i < 5; i++) k.add(B.ball(0.6 - i * 0.1, 0), P.wall2, x, y + 0.3 + i * 0.5, z, { sc: [1.2, 0.7, 1.1] });
      return;
    }
    if (t === 3) {
      k.add(B.ball(1.1, 0), P.stone, x, y + 3.2, z, { sc: [1.2, 0.8, 1] });
      H3(k, P, x, y, z);
      return;
    }
    k.add(B.box(1.8, 0.5, 1.8, 0.05, true), P.stone, x, y, z);
    k.add(B.lathe([[0.85, 0], [0.9, 0.5], [0.6, 1.1], [0.01, 1.2]], 10), P.wall, x, y + 0.5, z);
    k.add(B.box(0.5, 0.3, 0.5, 0.03, true), P.wall2, x, y + 1.7, z);
    for (let i = 0; i < 5; i++) k.add(B.post(0.24 - i * 0.04, 0.16, 8), t === 2 ? P.accent : P.trim, x, y + 2.0 + i * 0.2, z);
    k.add(B.cone(0.08, 0.6, 6), t === 2 ? P.accent : P.metal, x, y + 3.0, z);
  }
  // tảng đá lơ lửng: vành sáng quanh, tia sáng xuống đất
  function H3(k, P, x, y, z) {
    const H = BK.Blocks.H;
    H.torus(k, P.glow, 1.5, 0.05, x, y + 3.2, z, { glow: true });
    k.add(BK.BuildKit.box(0.1, 2.4, 0.1, 0.01, true), P.accent, x, y, z, { glow: true });
  }
  BK.Blocks.isle('mountain', {
    name: 'Đá Mây',
    sky: '#c4ccd8',
    ground: '#8a9a6a',
    tiers: [
      { wall: '#9a948a', wall2: '#7d776d', roof: '#6a5a4a', trim: '#5a4636', stone: '#8a857c', dark: '#2e2822', accent: '#c23a3a', glow: '#ffd27a', metal: '#6e665c' },
      { wall: '#b8b2a6', wall2: '#8f8a80', roof: '#3f4e5c', trim: '#6b2e2a', stone: '#8a857c', dark: '#2a2420', accent: '#d4a530', glow: '#ffd27a', metal: '#6e665c' },
      { wall: '#c9c2b4', wall2: '#9c9486', roof: '#2f3d4a', trim: '#7a2f2a', stone: '#8f8a80', dark: '#24201c', accent: '#d4a530', glow: '#ffe2a0', metal: '#8a8f96', light: '#dcd6ca', upper: '#c9c2b4' },
      { wall: '#3a3236', wall2: '#2c2629', roof: '#1e1a1c', trim: '#4a3e44', stone: '#564c50', dark: '#120e10', accent: '#ff3a7a', glow: '#ff8a4a', metal: '#8a7a80' },
    ],
    S: {
      spire: 'stack', // (dáng tháp bậc 4: render/blocks/spire.js)
      base: 'rock',
      roof: ['flat', 'curved', 'tiered', 'stepped'],
      wall: ['stone', 'stone', 'stone', 'native'],
      guard: [
        { coat: '#7a5a3a', legs: '#4a3a2a', hat: '#5a4430', form: 'hood' },
        { coat: '#8a2a2a', legs: '#3a3030', hat: '#3a3a3a', form: 'helm' },
        { coat: '#5a4a6a', legs: '#2e2a36', hat: '#5a4a6a', form: 'cap' },
        { coat: '#2a2226', legs: '#161214', hat: '#3a3034', form: 'visor' },
      ],
    },
    deco(k, P, t, H, spots, kind) {
      const y = H.PLINTH,
        s = kind === 'house' ? 0.45 : 0.8;
      spots.forEach(([x, z], i) => {
        if (kind === 'hall' && i === 0) return stupa(k, P, t, x, y, z);
        Pr.rock(k, x, y, z, s, P.wall2);
        if (kind !== 'house') Pr.prayer(k, x, y, z + 0.6, 1.6 * s, s);
      });
    },
  });
})(typeof self !== 'undefined' ? self : globalThis);
