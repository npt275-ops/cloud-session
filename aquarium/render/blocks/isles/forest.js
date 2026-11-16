/* Bể Kính · render/blocks/isles/forest.js · Thông Xanh (Rừng): vỏ khối công trình
 * Làng gỗ giữa rừng thông: tường gỗ cây nằm ngang, mái lá dốc đứng (bậc 1), ván dọc mái hai dốc (bậc 2), nhà khung gỗ trát
 * vôi mái nhọn (bậc 3), vòm lá có vành sáng xanh lá (bậc 4). Sàn gỗ viền rêu. Lính đội mũ cắm lông.
 * Biểu tượng cạnh nhà chính: cây cổ thụ (bậc 4: cây sáng). Đồ trang trí: thông, nấm. Cần: blocks.js, props.js. */
(function (root) {
  const BK = root.BK,
    Pr = BK.Blocks.props;
  // cây cổ thụ: thân to, ba tầng tán tròn; bậc 4 thân sẫm, tán có đốm sáng
  function bigTree(k, P, t, x, y, z) {
    const B = BK.BuildKit,
      leaf = t === 3 ? P.wall2 : '#3f6a34';
    k.add(B.post(0.45, 3.2, 7, 0.3), t === 3 ? P.trim : '#5a3c22', x, y, z);
    [[0, 3.6, 1.6], [0.6, 3.0, 1.1], [-0.6, 3.2, 1.2], [0, 4.6, 1.1]].forEach(([dx, dy, r]) => k.add(B.ball(r, 1), leaf, x + dx, y + dy, z));
    if (t === 3) for (let i = 0; i < 6; i++) k.add(B.ball(0.14, 0), P.glow, x + Math.cos(i) * 1.3, y + 3.4 + (i % 3) * 0.5, z + Math.sin(i) * 1.3, { glow: true });
  }
  BK.Blocks.isle('forest', {
    name: 'Thông Xanh',
    sky: '#b6d8c8',
    ground: '#5f9a4a',
    tiers: [
      { wall: '#8a6a44', wall2: '#6f8a4a', roof: '#5d7a3a', trim: '#5a3c22', stone: '#7a7462', dark: '#2c2216', accent: '#d9a23a', glow: '#ffd27a', metal: '#6a5a44' },
      { wall: '#9a7650', wall2: '#6e5236', roof: '#3f5e34', trim: '#4d331e', stone: '#857f6c', dark: '#2a2016', accent: '#d9a23a', glow: '#ffd27a', metal: '#6a6a5a' },
      { wall: '#ece2cc', wall2: '#a07a4e', roof: '#38503a', trim: '#3c2a1a', stone: '#7d7a70', dark: '#221a12', accent: '#2f8a4a', glow: '#ffe2a0', metal: '#6f7a70', light: '#e6dcc4', upper: '#ece2cc' },
      { wall: '#26352c', wall2: '#1c2822', roof: '#14201a', trim: '#2f4436', stone: '#3e5246', dark: '#0c140f', accent: '#3affc8', glow: '#9dff6a', metal: '#6f8a7a' },
      { wall: '#dcf2d4', wall2: '#7ac87a', roof: '#4fb06a', trim: '#6a4a2a', stone: '#8a7a5a', dark: '#1a3a2a', accent: '#ffd27a', glow: '#b6ff9a', metal: '#c8e8b0' }, // bậc 5 huyền ảo
    ],
    S: {
      myth: 'tree', // (biểu tượng đỉnh bậc 5: render/blocks/mythic.js)
      spire: 'tree', // (dáng tháp bậc 4: render/blocks/spire.js)
      base: 'deck',
      roof: ['leaf', 'gable', 'steep', 'leafdome'],
      wall: ['log', 'plank', 'timber', 'native'],
      guard: [
        { coat: '#5f7a3a', legs: '#3d2e1c', hat: '#7a5a30', form: 'feather' },
        { coat: '#3f6a3a', legs: '#3a2c1c', hat: '#4a3a26', form: 'feather' },
        { coat: '#2f5a3a', legs: '#26301e', hat: '#2f5a3a', form: 'cap' },
        { coat: '#1c2a22', legs: '#121a14', hat: '#22342a', form: 'visor' },
      ],
    },
    deco(k, P, t, H, spots, kind) {
      const y = H.PLINTH,
        s = kind === 'house' ? 0.45 : 0.8;
      spots.forEach(([x, z], i) => {
        if (kind === 'hall' && i === 0) return bigTree(k, P, t, x, y, z);
        Pr.pine(k, x, y, z, s, false, t === 3 ? P.wall2 : null);
        Pr.mushroom(k, x + 0.6 * s, y, z + 0.5 * s, s);
      });
    },
  });
})(typeof self !== 'undefined' ? self : globalThis);
