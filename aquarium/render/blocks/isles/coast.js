/* Bể Kính · render/blocks/isles/coast.js · Cửa Sóng (Biển): vỏ khối công trình
 * Làng biển: vách ván gỗ trôi, mái lá dừa có diềm (bậc 1), tường trát trắng viền xanh biển, mái ngói xanh bốn dốc (bậc 2), nhà
 * trắng mái bằng (bậc 3), mái có hai cánh buồm viền sáng ngọc (bậc 4). Bệ cát có lối ván. Lính khăn buộc trán.
 * Biểu tượng cạnh nhà chính: giàn phơi lưới (bậc 1), hải đăng (bậc 2, 3: sọc đỏ trắng), tháp tín hiệu sáng (bậc 4).
 * Đồ trang trí: dừa, thuyền úp. Cần: blocks.js, props.js. */
(function (root) {
  const BK = root.BK,
    Pr = BK.Blocks.props;
  function lighthouse(k, P, t, x, y, z) {
    const B = BK.BuildKit,
      H = BK.Blocks.H;
    if (t === 0) {
      for (const e of [-1, 1]) k.add(B.post(0.06, 1.6, 5), P.trim, x + e * 0.8, y, z);
      k.add(B.box(1.7, 0.06, 0.06, 0.01), P.trim, x, y + 1.55, z);
      k.add(B.box(1.5, 1.1, 0.03, 0.01), '#8a7a5a', x, y + 0.4, z); // lưới
      for (let i = 0; i < 3; i++) k.add(B.box(0.12, 0.35, 0.05, 0.01), '#9ab0b8', x - 0.5 + i * 0.5, y + 1.15, z + 0.04); // cá phơi
      return;
    }
    const h = t === 3 ? 5.2 : 4.2;
    k.add(B.lathe([[0.75, 0], [0.5, h], [0.01, h]], 10), t === 3 ? P.wall : '#f4f2ec', x, y, z);
    if (t < 3) for (const u of [0.25, 0.6]) k.add(B.lathe([[0.75 - 0.25 * u - 0.01, h * u], [0.74 - 0.25 * (u + 0.15), h * (u + 0.15)]], 10), '#c8402f', x, y + 0.01, z);
    else for (const u of [0.3, 0.6, 0.9]) H.torus(k, P.glow, 0.76 - 0.25 * u, 0.04, x, y + h * u, z, { glow: true });
    k.add(B.post(0.42, 0.5, 8), P.glow, x, y + h, z, { glow: true });
    k.add(B.cone(0.55, 0.5, 8), t === 3 ? P.accent : '#c8402f', x, y + h + 0.5, z);
  }
  BK.Blocks.isle('coast', {
    name: 'Cửa Sóng',
    sky: '#a8d8ec',
    ground: '#e6d3a3',
    tiers: [
      { wall: '#b89a72', wall2: '#9a7c56', roof: '#c9b27a', trim: '#6a4e34', stone: '#d8c8a0', dark: '#33281c', accent: '#2a8ac8', glow: '#ffd27a', metal: '#6a6a6a' },
      { wall: '#e8e2d6', wall2: '#cfc6b4', roof: '#2f7a8a', trim: '#2a5a7a', stone: '#cfc2a2', dark: '#22303a', accent: '#2a8ac8', glow: '#ffd27a', metal: '#7a8a90', upper: '#e8e2d6' },
      { wall: '#f4f2ec', wall2: '#d8e4ea', roof: '#3a7ab8', trim: '#2a5a8a', stone: '#d8ccb0', dark: '#1c2a38', accent: '#e85a3a', glow: '#ffe2a0', metal: '#8aa0b0', light: '#ffffff' },
      { wall: '#24384a', wall2: '#1a2a3a', roof: '#122030', trim: '#2a4a64', stone: '#3a5468', dark: '#0a121a', accent: '#4a9aff', glow: '#3affd8', metal: '#7a9ab0' },
      { wall: '#e8fbff', wall2: '#9ae6f0', roof: '#3ac8d8', trim: '#2a7aa0', stone: '#f0e6c8', dark: '#0a2a4a', accent: '#ff9ab8', glow: '#8affea', metal: '#d8f8ff' }, // bậc 5 huyền ảo
    ],
    S: {
      myth: 'wave', // (biểu tượng đỉnh bậc 5: render/blocks/mythic.js)
      spire: 'sail', // (dáng tháp bậc 4: render/blocks/spire.js)
      base: 'sand',
      roof: ['thatch', 'hip', 'flat', 'sail'],
      wall: ['plank', 'plaster', 'plaster', 'native'],
      guard: [
        { coat: '#c9a26a', legs: '#3a4a5a', hat: '#c83a3a', form: 'band' },
        { coat: '#2a5a8a', legs: '#2a3440', hat: '#e8e2d6', form: 'band' },
        { coat: '#f0f0f0', legs: '#2a3a5a', hat: '#ffffff', form: 'cap' },
        { coat: '#1c2c3a', legs: '#101a24', hat: '#24384a', form: 'visor' },
      ],
    },
    deco(k, P, t, H, spots, kind) {
      const y = H.PLINTH,
        s = kind === 'house' ? 0.45 : 0.8;
      spots.forEach(([x, z], i) => {
        if (kind === 'hall' && i === 0) return lighthouse(k, P, t, x, y, z);
        Pr.palm(k, x, y, z, s);
        if (kind !== 'house') Pr.boat(k, x + 0.9 * s, y, z + 0.4 * s, s, i % 2 ? '#2a8ac8' : '#a8452c');
      });
    },
  });
})(typeof self !== 'undefined' ? self : globalThis);
