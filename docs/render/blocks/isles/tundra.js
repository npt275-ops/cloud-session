/* Bể Kính · render/blocks/isles/tundra.js · Tuyết Trắng (Băng nguyên): vỏ khối công trình
 * Làng băng: tường khối tuyết và vòm băng (bậc 1), nhà gỗ cây mái dốc đứng phủ tuyết (bậc 2), nhà ván sơn đỏ mái dốc đứng (bậc 3),
 * vòm kính có sườn sáng xanh băng (bậc 4). Mọi mái phủ tuyết, bệ tuyết. Lính mũ lông trùm đầu.
 * Biểu tượng cạnh nhà chính: cột tô-tem (bậc 1, 2), đá khắc chữ cổ (bậc 3), cột cực quang có vành sáng (bậc 4).
 * Đồ trang trí: thông phủ tuyết, đống tuyết, đống củi. Cần: blocks.js, props.js. */
(function (root) {
  const BK = root.BK,
    Pr = BK.Blocks.props;
  function totem(k, P, t, x, y, z) {
    const B = BK.BuildKit,
      H = BK.Blocks.H;
    if (t === 3) {
      k.add(B.post(0.18, 5.0, 6, 0.06), P.metal, x, y, z);
      for (let i = 0; i < 4; i++) H.torus(k, i % 2 ? P.accent : P.glow, 0.7 - i * 0.12, 0.05, x, y + 1.6 + i * 0.9, z, { glow: true });
      return;
    }
    if (t === 2) {
      k.add(B.box(1.0, 2.2, 0.5, 0.12, true), '#8f9aa4', x, y, z);
      for (let i = 0; i < 4; i++) k.add(B.box(0.6, 0.06, 0.04, 0.01), P.accent, x, y + 0.5 + i * 0.4, z + 0.27);
      return;
    }
    const C = [P.accent, '#c8402f', '#e8c040', P.wall2];
    for (let i = 0; i < 4; i++) k.add(B.box(0.7, 0.75, 0.7, 0.05, true), C[i], x, y + i * 0.75, z);
    k.add(B.box(1.8, 0.14, 0.3, 0.02, true), C[0], x, y + 2.4, z + 0.2); // cánh
    k.add(B.cone(0.4, 0.4, 4), P.trim, x, y + 3.0, z, { rot: [0, Math.PI / 4, 0] });
  }
  BK.Blocks.isle('tundra', {
    name: 'Tuyết Trắng',
    sky: '#d4e2ec',
    ground: '#e8eef2',
    tiers: [
      { wall: '#e8eef2', wall2: '#c9d6de', roof: '#eef3f6', trim: '#6a5a4a', stone: '#b8c4cc', dark: '#2a3036', accent: '#3a7ac8', glow: '#ffd27a', metal: '#7a8088' },
      { wall: '#8a6a4c', wall2: '#6a5038', roof: '#5a4a3e', trim: '#4a3a2c', stone: '#9aa6ae', dark: '#2a221c', accent: '#3a7ac8', glow: '#ffd27a', metal: '#7a8088' },
      { wall: '#c84a3a', wall2: '#9a3a2e', roof: '#3a4048', trim: '#f0f0ea', stone: '#9aa6ae', dark: '#22262a', accent: '#3a7ac8', glow: '#ffe2a0', metal: '#9aa4ae', light: '#f0f2f2', upper: '#c84a3a' },
      { wall: '#2c3648', wall2: '#222a3a', roof: '#182030', trim: '#3a4660', stone: '#4a5670', dark: '#0c1018', accent: '#b48aff', glow: '#7ae8ff', metal: '#8a96b0' },
      { wall: '#eaf8ff', wall2: '#bfe8ff', roof: '#8ad8ff', trim: '#5a8ab8', stone: '#d8eef8', dark: '#1a2a4a', accent: '#c89aff', glow: '#a8f4ff', metal: '#e0f4ff' }, // bậc 5 huyền ảo
    ],
    S: {
      myth: 'crystal', // (biểu tượng đỉnh bậc 5: render/blocks/mythic.js)
      spire: 'crystal', // (dáng tháp bậc 4: render/blocks/spire.js)
      base: 'snow',
      snow: true,
      roof: ['dome', 'steep', 'steep', 'glassdome'],
      wall: ['ice', 'log', 'plank', 'native'],
      guard: [
        { coat: '#7a6a5a', legs: '#4a3e34', hat: '#e8e0d0', form: 'hood' },
        { coat: '#5a6a7a', legs: '#3a3e44', hat: '#d8d0c0', form: 'hood' },
        { coat: '#2a4a6a', legs: '#1e2a36', hat: '#2a4a6a', form: 'cap' },
        { coat: '#222a3a', legs: '#141a24', hat: '#2e3646', form: 'visor' },
      ],
    },
    deco(k, P, t, H, spots, kind) {
      const y = H.PLINTH,
        s = kind === 'house' ? 0.45 : 0.75;
      spots.forEach(([x, z], i) => {
        if (kind === 'hall' && i === 0) return totem(k, P, t, x, y, z);
        if (i % 2) Pr.logs(k, x, y, z, s);
        else Pr.pine(k, x, y, z, s, true, t === 3 ? P.wall2 : '#2f5a44');
        Pr.snowpile(k, x + 0.6 * s, y, z + 0.6 * s, s);
      });
    },
  });
})(typeof self !== 'undefined' ? self : globalThis);
