/* Bể Kính · render/blocks/isles/desert.js · Cát Hồng (Sa mạc): vỏ khối công trình
 * Làng cát hồng: tường đất bo tròn có đầu xà nhô mọi bậc xưa, mái lều vải đỉnh màu ngọc (bậc 1), mái vòm đất (bậc 2), mái bằng
 * có tường chắn (bậc 3), vòm củ hành viền sáng hồng (bậc 4). Bệ gạch nung kẻ ô. Lính quấn khăn.
 * Biểu tượng cạnh nhà chính: giếng có mái che (bậc 1), cột đá tháp nhọn (bậc 2), tháp gọi cầu nguyện có ban công (bậc 3), kim
 * tự tháp ảnh nổi viền sáng (bậc 4). Đồ trang trí: chà là, xương rồng, chum. Cần: blocks.js, props.js. */
(function (root) {
  const BK = root.BK,
    Pr = BK.Blocks.props;
  function landmark(k, P, t, x, y, z) {
    const B = BK.BuildKit,
      H = BK.Blocks.H;
    if (t === 0) {
      k.add(B.lathe([[0.6, 0], [0.6, 0.6], [0.45, 0.6], [0.45, 0.1]], 10), P.wall2, x, y, z);
      for (const e of [-1, 1]) k.add(B.post(0.05, 1.4, 4), P.trim, x + e * 0.5, y + 0.6, z);
      k.add(B.box(1.5, 0.08, 1.2, 0.01, true), P.roof, x, y + 2.0, z, { rot: [0.1, 0, 0] });
      return;
    }
    if (t === 1) {
      k.add(B.box(1.0, 0.3, 1.0, 0.03, true), P.stone, x, y, z);
      k.add(B.roof(0.6, 3.6, 0.6, 0.02, 0.32, 0.32), P.wall2, x, y + 0.3, z);
      k.add(B.cone(0.24, 0.45, 4), '#d4a530', x, y + 3.9, z, { rot: [0, Math.PI / 4, 0] });
      return;
    }
    if (t === 2) {
      k.add(B.post(0.5, 4.6, 10, 0.4), P.light || P.wall, x, y, z);
      k.add(B.post(0.62, 0.15, 10), P.trim, x, y + 3.6, z);
      k.add(B.post(0.32, 0.8, 10), P.wall, x, y + 4.6, z);
      k.add(B.lathe([[0.36, 0], [0.4, 0.2], [0.2, 0.5], [0.01, 0.7]], 10), P.roof, x, y + 5.4, z);
      return;
    }
    // kim tự tháp ảnh nổi: khung sáng bốn cạnh, đỉnh sáng
    k.add(B.roof(2.2, 2.4, 2.2, 0.03, 0.05, 0.05), P.wall2, x, y, z);
    H.lightBox(k, P, 3, 2.3, 0.06, 2.3, x, y + 0.05, z);
    k.add(B.ball(0.2, 0), P.accent, x, y + 2.6, z, { glow: true });
  }
  BK.Blocks.isle('desert', {
    name: 'Cát Hồng',
    sky: '#f2d8c8',
    ground: '#e4c09a',
    tiers: [
      { wall: '#e0b8a0', wall2: '#c99a80', roof: '#d86a5a', trim: '#7a4a32', stone: '#e2c4a8', dark: '#3a2418', accent: '#2a8a8a', glow: '#ffd27a', metal: '#8a6a50' },
      { wall: '#dba88c', wall2: '#c08a70', roof: '#d9a080', trim: '#6a3e28', stone: '#d8b89c', dark: '#38221a', accent: '#2a8a8a', glow: '#ffd27a', metal: '#8a6a50', upper: '#e4b498' },
      { wall: '#e8c0a8', wall2: '#c99a84', roof: '#2a8a8a', trim: '#7a4a32', stone: '#dcbca0', dark: '#2e1c14', accent: '#d4a530', glow: '#ffe2a0', metal: '#a08a70', light: '#f4e4d4' },
      { wall: '#3e2a3a', wall2: '#2e202c', roof: '#1e141c', trim: '#4e3448', stone: '#5a4250', dark: '#140c12', accent: '#ffb84a', glow: '#ff6ac8', metal: '#a08090' },
      { wall: '#fff0e0', wall2: '#ffc8a8', roof: '#ff8a6a', trim: '#c86a4a', stone: '#f0d0b0', dark: '#4a1a3a', accent: '#ffd84a', glow: '#ffb0f0', metal: '#ffe0c0' }, // bậc 5 huyền ảo
    ],
    // cờ hồng, ký hiệu cát hồng (mặt trời trên hai đụn cát)
    flag: {
      color: '#e87aa8',
      mark: '#7a1f45',
      emblem(m) {
        m.circ(0.1, 0.12, 0.08, '#fff1c8');
        m.half(-0.1, -0.22, 0.2);
        m.half(0.16, -0.22, 0.14);
      },
    },
    S: {
      myth: 'sun', // (biểu tượng đỉnh bậc 5: render/blocks/mythic.js)
      spire: 'pyramid', // (dáng tháp bậc 4: render/blocks/spire.js)
      base: 'tile',
      roof: ['tent', 'dome', 'flat', 'onion'],
      wall: ['adobe', 'adobe', 'adobe', 'native'],
      guard: [
        { coat: '#e8d8c0', legs: '#8a6a50', hat: '#f0e6d4', form: 'turban' },
        { coat: '#b84a3a', legs: '#5a3a2a', hat: '#f0e6d4', form: 'turban' },
        { coat: '#c8a878', legs: '#6a5a40', hat: '#c8a878', form: 'cap' },
        { coat: '#2e202c', legs: '#1a1218', hat: '#3e2a3a', form: 'visor' },
      ],
    },
    deco(k, P, t, H, spots, kind) {
      const y = H.PLINTH,
        s = kind === 'house' ? 0.45 : 0.8;
      spots.forEach(([x, z], i) => {
        if (kind === 'hall' && i === 0) return landmark(k, P, t, x, y, z);
        if (i % 2) Pr.cactus(k, x, y, z, s);
        else Pr.palm(k, x, y, z, s);
        Pr.pot(k, x + 0.6 * s, y, z + 0.5 * s, s);
      });
    },
  });
})(typeof self !== 'undefined' ? self : globalThis);
