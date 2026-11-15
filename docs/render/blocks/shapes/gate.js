/* Bể Kính · render/blocks/shapes/gate.js · Hình khối Cổng thành (render/blocks/blocks.js)
 * Người chơi chốt: cổng có hai trụ gác, trên trụ có lính đứng gác (chòi chỉ báo tin, vũ khí không mạnh); một khối duy nhất.
 * Hai đầu nối khít đoạn tường bao (render/blocks/shapes/wall.js): cùng độ cao WALL_H theo bậc, cùng bề dày WALL_D.
 *   bậc 0 gỗ tre    hai chòi gỗ bốn chân có sàn và lan can, mái rơm trên bốn cột, thang; cánh cổng hàng cọc; hai lính cầm giáo
 *                   mỗi chòi
 *   bậc 1 đá        hai trụ đá vuông có răng tường, lính cầm giáo đứng giữa các răng, vòm đá, cổng gỗ có đinh sắt, đuốc
 *   bậc 2 gạch thép hai trụ gạch có chòi canh mở bốn phía mái nhọn, lính cầm súng trong chòi, cổng sắt song chắn, đèn pha
 *   bậc 3 tương lai hai trụ sẫm có vành sáng, sàn tròn trên đỉnh có lính sáng, màn chắn năng lượng giữa cổng (viền neon)
 * Gốc khối: giữa cổng, mặt ngoài quay về +z. */
(function (root) {
  const BK = root.BK;
  const K = () => BK.BuildKit;
  const XS = 3.6, // tâm hai trụ
    TW = 1.9; // bề ngang trụ
  // tường nối hai trụ, chừa vòm cổng ở giữa; trả độ cao vòm
  function span(k, P, t, wallH) {
    const B = K(),
      y0 = BK.Blocks.H.PLINTH,
      thick = BK.Blocks.WALL_D,
      sp = XS * 2 - TW,
      gw = 2.6,
      gh = Math.min(wallH - 0.5, 2.4),
      side = (sp - gw) / 2;
    for (const s of [-1, 1]) k.add(B.box(side, wallH, thick, 0.05, true), P.wall, s * (gw / 2 + side / 2), y0, 0);
    k.add(B.box(gw, wallH - gh, thick, 0.05, true), P.wall, 0, y0 + gh, 0);
    k.add(B.box(gw + 0.3, 0.22, thick + 0.12, 0.04, true), t >= 2 ? P.metal : P.trim, 0, y0 + gh - 0.1, 0);
    return gh;
  }
  const TIER = [
    // chòi gỗ
    (k, P, H, wallH) => {
      const B = K(),
        y0 = H.PLINTH,
        fl = y0 + wallH + 0.6; // sàn chòi
      for (const s of [-1, 1]) {
        const x = s * XS;
        for (const dx of [-0.8, 0.8]) for (const dz of [-0.8, 0.8]) k.add(B.post(0.12, fl - y0 + 1.5, 6), P.trim, x + dx, y0, dz);
        for (const dz of [-0.4, 0.4]) k.add(B.box(1.7, 0.08, 0.08, 0.01), P.trim, x, y0 + 1.0, dz * 2, { rot: [0, 0, 0.5] }); // giằng chéo
        k.add(B.box(2.1, 0.14, 2.1, 0.02, true), P.trim, x, fl - 0.14, 0);
        for (const dz of [-1.0, 1.0]) H.rail(k, P.wall2, x - 1.0, x + 1.0, fl, dz, 0.5, 6);
        k.add(B.cone(1.6, 1.2, 4), P.roof, x, fl + 1.5, 0, { rot: [0, Math.PI / 4, 0] });
        for (let i = 0; i < 7; i++) k.add(B.box(0.5, 0.05, 0.08, 0.01), P.trim, x - s * 1.2, y0 + 0.2 + i * 0.4, 0.9); // thang
        for (const dx of [-0.4, 0.4]) H.guard(k, P, 0, x + dx, fl, 0.15);
        H.flag(k, P, x + 0.8, fl + 1.5, -0.8, 1.6, 0.9);
      }
      const gh = span(k, P, 0, wallH);
      for (let i = 0; i < 8; i++) k.add(B.post(0.13, gh, 5, 0.04), P.trim, -1.12 + i * 0.32, y0, 0.2);
      for (let i = 0; i < 8; i++) k.add(B.cone(0.13, 0.25, 5), P.trim, -1.12 + i * 0.32, y0 + gh, 0.2);
    },
    // trụ đá
    (k, P, H, wallH) => {
      const B = K(),
        y0 = H.PLINTH,
        th = wallH + 2.0;
      for (const s of [-1, 1]) {
        const x = s * XS;
        k.add(B.box(TW, th, TW, 0.07, true), P.wall2, x, y0, 0);
        k.add(B.box(TW + 0.25, 0.2, TW + 0.25, 0.03, true), P.stone, x, y0 + th, 0);
        for (const dz of [-0.95, 0.95]) H.crenels(k, P.wall2, x - 0.9, x + 0.9, y0 + th + 0.2, dz, 4, 0.34, 0.42, 0.3);
        H.win(k, P, 1, x, y0 + th - 1.4, TW / 2, 0.22, 0.6); // khe bắn
        H.guard(k, P, 1, x - 0.35, y0 + th + 0.2, 0.1);
        H.guard(k, P, 1, x + 0.4, y0 + th + 0.2, -0.3);
        // đuốc hai bên vòm
        k.add(B.post(0.05, 0.4, 5), P.trim, s * 1.55, y0 + 1.8, 0.62);
        k.add(B.cone(0.1, 0.28, 6), '#ff9a3a', s * 1.55, y0 + 2.2, 0.62, { glow: true });
        H.flag(k, P, x, y0 + th + 0.2, -0.7, 1.6, 1.0);
      }
      const gh = span(k, P, 1, wallH);
      H.crenels(k, P.wall2, -1.6, 1.6, y0 + wallH, 0, 5, 0.42, 0.34, BK.Blocks.WALL_D);
      k.add(B.box(2.5, gh - 0.05, 0.16, 0.02, true), P.trim, 0, y0, 0.3);
      for (const x of [-0.8, 0, 0.8]) for (const y of [0.5, 1.2, 1.9]) k.add(B.ball(0.05, 0), P.metal, x, y0 + y, 0.4); // đinh sắt
    },
    // trụ gạch có chòi canh
    (k, P, H, wallH) => {
      const B = K(),
        y0 = H.PLINTH,
        th = wallH + 1.6;
      for (const s of [-1, 1]) {
        const x = s * XS;
        k.add(B.box(TW, th, TW, 0.07, true), P.wall, x, y0, 0);
        for (const y of [0.9, 2.0]) k.add(B.box(TW + 0.06, 0.12, TW + 0.06, 0.02, true), '#e8e0d0', x, y0 + th * (y / 3), 0);
        k.add(B.box(TW + 0.4, 0.15, TW + 0.4, 0.03, true), P.metal, x, y0 + th, 0);
        for (const dx of [-0.95, 0.95]) for (const dz of [-0.95, 0.95]) k.add(B.post(0.06, 1.5, 5), P.metal, x + dx, y0 + th + 0.15, dz);
        H.rail(k, P.metal, x - 0.95, x + 0.95, y0 + th + 0.15, 0.95, 0.45, 5);
        k.add(B.roof(2.6, 1.3, 2.6, 0.05, 0.15, 0.15), P.roof, x, y0 + th + 1.65, 0);
        H.guard(k, P, 2, x, y0 + th + 0.15, 0.2);
        k.add(B.box(0.3, 0.25, 0.4, 0.02, true), P.metal, x + s * 0.7, y0 + th + 0.95, 0.6); // đèn pha
        k.add(B.box(0.24, 0.2, 0.04, 0.01), '#fff4c8', x + s * 0.7, y0 + th + 0.97, 0.82, { glow: true });
        H.win(k, P, 2, x, y0 + th * 0.45, TW / 2, 0.4, 0.6);
        H.flag(k, P, x, y0 + th + 2.9, 0, 1.0, 0.9);
      }
      const gh = span(k, P, 2, wallH);
      H.crenels(k, P.wall2, -1.6, 1.6, y0 + wallH, 0, 5, 0.42, 0.34, BK.Blocks.WALL_D);
      for (let i = 0; i < 8; i++) k.add(B.box(0.08, gh - 0.05, 0.08, 0.01, true), P.metal, -1.12 + i * 0.32, y0, 0.3);
      for (const y of [0.6, 1.4]) k.add(B.box(2.5, 0.08, 0.08, 0.01, true), P.metal, 0, y0 + y, 0.3);
    },
    // trụ neon
    (k, P, H, wallH) => {
      const B = K(),
        y0 = H.PLINTH,
        th = wallH + 2.4;
      for (const s of [-1, 1]) {
        const x = s * XS;
        k.add(B.lathe([[1.0, 0], [0.95, th * 0.7], [0.7, th], [0.01, th]], 8), P.wall, x, y0, 0, { rot: [0, Math.PI / 8, 0] });
        // vành sáng ôm sát thân (bán kính thân ở độ cao đó theo dáng lathe trên)
        const rAt = (u) => (u <= 0.7 ? 1.0 - (0.05 * u) / 0.7 : 0.95 - (0.25 * (u - 0.7)) / 0.3);
        for (const u of [0.3, 0.55, 0.8]) H.torus(k, u === 0.55 ? P.accent : P.glow, rAt(u) + 0.03, 0.05, x, y0 + th * u, 0, { glow: true });
        // sàn tròn trên đỉnh, lan can sáng, lính sáng
        k.add(B.lathe([[0.3, -0.2], [1.25, 0], [1.25, 0.12], [0.01, 0.12]], 12), P.roof, x, y0 + th, 0);
        H.torus(k, P.glow, 1.2, 0.04, x, y0 + th + 0.6, 0, { glow: true });
        for (const dx of [-0.4, 0.4]) H.guard(k, P, 3, x + dx, y0 + th + 0.12, 0);
        H.flag(k, P, x, y0 + th + 0.12, -0.9, 1.8, 0.9);
      }
      const gh = span(k, P, 3, wallH);
      H.lightBox(k, P, 3, 6.0, 0.08, 0.06, 0, y0 + wallH - 0.3, BK.Blocks.WALL_D / 2 + 0.02);
      k.add(B.box(2.5, gh - 0.1, 0.06, 0.01, true), P.glow, 0, y0, 0, { glow: true });
      for (const y of [0.5, 1.1, 1.7]) k.add(B.box(2.5, 0.05, 0.08, 0.01, true), P.accent, 0, y0 + y, 0.04, { glow: true });
    },
  ];
  BK.Blocks.shape('gate', (k, P, t, H) => {
    H.plinth(k, P, 9.6, 3.6);
    TIER[t](k, P, H, BK.Blocks.WALL_H[t]);
  });
})(typeof self !== 'undefined' ? self : globalThis);
