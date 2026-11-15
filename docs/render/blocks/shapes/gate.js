/* Bể Kính · render/blocks/shapes/gate.js · Hình khối Cổng thành (render/blocks/blocks.js)
 * Người chơi chốt: cổng rộng, nhiều chi tiết, có hai trụ gác và lính đứng gác trên trụ (chòi chỉ báo tin, vũ khí không mạnh).
 * Khối 14 × 5 (bệ 13,6 × 4,6), một khối duy nhất. Từ giữa ra: vòm cổng có cánh cổng, lầu cổng trên vòm, tường nối có lối đi
 * trên đỉnh, hai trụ gác lớn, đoạn tường đầu khối nối khít tường bao (render/blocks/shapes/wall.js: cùng WALL_H, cùng WALL_D).
 * Trước cổng (+z, phía ngoài thành): vật cản, đèn đuốc, lính gác đứng đất.
 *   bậc 0 gỗ tre    hai chòi gỗ hai tầng sàn, thang; tường cọc; lầu cổng gỗ mái rơm; cánh cổng đôi cọc; chông chắn trước cổng
 *   bậc 1 đá        hai trụ đá có gờ đỡ và răng tường bốn phía, khe bắn, cờ treo; lầu cổng đá; cổng gỗ đinh sắt và song chắn
 *                   kéo lên một nửa; chậu lửa
 *   bậc 2 gạch thép hai trụ gạch có chòi canh mái nhọn, đèn pha; lầu cổng có mái và cửa sổ; cổng song sắt; chốt gác, thanh
 *                   chắn, bao cát, cột đèn
 *   bậc 3 tương lai hai trụ neon có vành sáng, sàn tròn và súng tháp; vòng biểu tượng sáng trên cổng; màn chắn năng lượng;
 *                   cọc chắn sáng (viền neon: blocks.js)
 * Gốc khối: giữa cổng, mặt ngoài quay về +z. */
(function (root) {
  const BK = root.BK;
  const K = () => BK.BuildKit;
  const XS = 4.9, // tâm hai trụ
    TW = 2.4, // bề ngang trụ
    GW = 3.0, // bề ngang vòm cổng
    END = 6.8; // mép khối (nối tường bao)
  // tường: hai đoạn hai bên vòm (giữa hai trụ) và hai đoạn đầu khối (ngoài trụ), xà trên vòm. Trả độ cao vòm.
  function walls(k, P, t, wallH) {
    const B = K(),
      y0 = BK.Blocks.H.PLINTH,
      D = BK.Blocks.WALL_D,
      gh = Math.min(wallH - 0.5, 2.6),
      inner = XS - TW / 2 - GW / 2, // đoạn giữa vòm và trụ
      outer = END - XS - TW / 2; // đoạn ngoài trụ
    for (const s of [-1, 1]) {
      k.add(B.box(inner, wallH, D, 0.05, true), P.wall, s * (GW / 2 + inner / 2), y0, 0);
      k.add(B.box(outer, wallH, D, 0.05, true), P.wall, s * (END - outer / 2), y0, 0);
    }
    k.add(B.box(GW, wallH - gh, D, 0.05, true), P.wall, 0, y0 + gh, 0);
    k.add(B.box(GW + 0.4, 0.24, D + 0.14, 0.04, true), t >= 2 ? P.metal : P.trim, 0, y0 + gh - 0.12, 0);
    return gh;
  }
  // răng tường hai mặt trên đỉnh tường (từ x0 tới x1, cả hai bên vòm), lính đứng trên lối đi
  function walkway(k, P, t, wallH, color) {
    const H = BK.Blocks.H,
      y = H.PLINTH + wallH,
      D = BK.Blocks.WALL_D;
    for (const s of [-1, 1]) {
      const a = s * (GW / 2 + 0.2),
        b = s * (XS - TW / 2 - 0.2);
      for (const z of [D / 2 - 0.12, -D / 2 + 0.12]) H.crenels(k, color, Math.min(a, b), Math.max(a, b), y, z, 3, 0.36, 0.34, 0.24);
      H.guard(k, P, t, s * (GW / 2 + 0.95), y, 0);
    }
  }
  // lầu cổng trên vòm: thân, cửa sổ, mái theo bậc
  function gatehouse(k, P, t, wallH, roofFn) {
    const B = K(),
      H = BK.Blocks.H,
      y = H.PLINTH + wallH,
      D = BK.Blocks.WALL_D;
    k.add(B.box(GW + 0.6, 1.3, D + 0.3, 0.05, true), t === 0 ? P.wall2 : P.wall, 0, y, 0);
    for (const x of [-0.8, 0, 0.8]) H.win(k, P, t, x, y + 0.65, (D + 0.3) / 2, 0.36, 0.42);
    roofFn(y + 1.3);
  }
  // hai đoạn tường đầu khối có răng tường (nối tường bao cùng kiểu)
  function endCrenels(k, color, wallH) {
    const H = BK.Blocks.H,
      D = BK.Blocks.WALL_D;
    for (const s of [-1, 1]) H.crenels(k, color, s * (XS + TW / 2 + 0.2), s * (END - 0.2), H.PLINTH + wallH, 0, 2, 0.4, 0.34, D);
  }
  const TIER = [
    // chòi gỗ
    (k, P, H, wallH) => {
      const B = K(),
        y0 = H.PLINTH,
        f1 = y0 + wallH + 0.4,
        f2 = f1 + 1.6; // hai tầng sàn
      for (const s of [-1, 1]) {
        const x = s * XS;
        for (const dx of [-1.0, 1.0]) for (const dz of [-1.0, 1.0]) k.add(B.post(0.13, f2 - y0 + 1.4, 6), P.trim, x + dx, y0, dz);
        for (const dz of [-1.0, 1.0]) k.add(B.box(2.2, 0.08, 0.08, 0.01), P.trim, x, y0 + 1.2, dz, { rot: [0, 0, 0.6] });
        for (const f of [f1, f2]) {
          k.add(B.box(2.5, 0.14, 2.5, 0.02, true), P.trim, x, f - 0.14, 0);
          for (const dz of [-1.2, 1.2]) H.rail(k, P.wall2, x - 1.2, x + 1.2, f, dz, 0.5, 7);
        }
        k.add(B.cone(1.9, 1.3, 4), P.roof, x, f2 + 1.4, 0, { rot: [0, Math.PI / 4, 0] });
        for (let i = 0; i < 9; i++) k.add(B.box(0.5, 0.05, 0.08, 0.01), P.trim, x - s * 1.45, y0 + 0.2 + i * 0.4, 1.1); // thang
        for (const dx of [-0.5, 0.5]) H.guard(k, P, 0, x + dx, f1, 0.2);
        H.guard(k, P, 0, x, f2, 0.1);
        H.flag(k, P, x + 1.0, f2 + 1.4, -1.0, 1.6, 1.0);
        H.torch(k, P, 0, x - s * 1.4, y0, 2.0);
      }
      const gh = walls(k, P, 0, wallH);
      // vạch cọc trên mặt tường, chóp cọc trên đỉnh tường
      for (let x = -END + 0.2; x <= END - 0.2; x += 0.34) {
        if (Math.abs(Math.abs(x) - XS) < TW / 2 + 0.1 || Math.abs(x) < GW / 2) continue;
        k.add(B.box(0.04, wallH, 0.04, 0.01), P.trim, x, y0, BK.Blocks.WALL_D / 2 + 0.02);
        k.add(B.cone(0.12, 0.3, 5), P.wall, x, y0 + wallH, 0);
      }
      gatehouse(k, P, 0, wallH, (y) => k.add(B.roof(GW + 1.2, 1.0, 2.0, 0.06, GW, 0.2, 0.3), P.roof, 0, y, 0));
      H.guard(k, P, 0, 0, y0 + wallH, 0.95);
      // cánh cổng đôi bằng cọc, chông chắn trước cổng
      for (let i = 0; i < 9; i++) k.add(B.post(0.15, gh, 5, 0.05), P.trim, -1.36 + i * 0.34, y0, 0.3);
      for (const x of [-1.36, 1.36]) k.add(B.box(0.08, 0.1, 0.1, 0.01), P.dark, x * 0.5, y0 + gh * 0.5, 0.48);
      for (const x of [-3.2, -2.0, 2.0, 3.2]) {
        for (const r of [0.7, -0.7]) k.add(B.post(0.05, 1.3, 4), P.trim, x, y0, 1.8, { rot: [r, 0, 0] });
        k.add(B.box(0.9, 0.08, 0.08, 0.01), P.trim, x, y0 + 0.3, 1.8);
      }
    },
    // trụ đá
    (k, P, H, wallH) => {
      const B = K(),
        y0 = H.PLINTH,
        th = wallH + 2.6;
      for (const s of [-1, 1]) {
        const x = s * XS;
        k.add(B.box(TW + 0.3, 0.5, TW + 0.3, 0.06, true), P.stone, x, y0, 0); // chân trụ
        k.add(B.box(TW, th, TW, 0.07, true), P.wall2, x, y0, 0);
        k.add(B.box(TW + 0.4, 0.3, TW + 0.4, 0.04, true), P.stone, x, y0 + th - 0.3, 0); // gờ đỡ
        for (const d of [-1, 1]) {
          H.crenels(k, P.wall2, x - 1.0, x + 1.0, y0 + th, d * 1.05, 4, 0.36, 0.42, 0.3);
          H.crenels(k, P.wall2, x + d * 1.05, x + d * 1.05, y0 + th, -0.5, 1, 0.3, 0.42, 0.36);
          H.crenels(k, P.wall2, x + d * 1.05, x + d * 1.05, y0 + th, 0.5, 1, 0.3, 0.42, 0.36);
        }
        for (const y of [1.2, th - 1.4]) H.win(k, P, 1, x, y0 + y, TW / 2, 0.2, 0.6); // khe bắn
        H.banner(k, P, x, y0 + th - 1.9, TW / 2, 0.8, 1.6);
        for (const dx of [-0.5, 0.5]) H.guard(k, P, 1, x + dx, y0 + th, 0.2);
        H.flag(k, P, x, y0 + th, -0.8, 1.8, 1.1);
      }
      const gh = walls(k, P, 1, wallH);
      endCrenels(k, P.wall2, wallH);
      walkway(k, P, 1, wallH, P.wall2);
      gatehouse(k, P, 1, wallH, (y) => {
        k.add(B.box(GW + 0.9, 0.16, BK.Blocks.WALL_D + 0.6, 0.03, true), P.stone, 0, y, 0);
        for (const z of [0.7, -0.7]) H.crenels(k, P.wall2, -1.9, 1.9, y + 0.16, z, 6, 0.36, 0.36, 0.26);
      });
      // vòm đá viền, cổng gỗ đinh sắt, song chắn kéo lên một nửa, chậu lửa hai bên
      k.add(B.box(GW + 0.5, 0.35, 0.2, 0.03, true), P.stone, 0, y0 + gh, BK.Blocks.WALL_D / 2 + 0.05);
      k.add(B.box(GW - 0.1, gh - 0.05, 0.16, 0.02, true), P.trim, 0, y0, 0.25);
      for (const x of [-1.0, 0, 1.0]) for (const y of [0.5, 1.2, 1.9]) k.add(B.ball(0.05, 0), P.metal, x, y0 + y, 0.36);
      for (let i = 0; i < 7; i++) k.add(B.box(0.07, gh * 0.45, 0.07, 0.01), P.metal, -1.3 + i * 0.43, y0 + gh * 0.55, 0.5);
      k.add(B.box(GW - 0.1, 0.07, 0.07, 0.01), P.metal, 0, y0 + gh * 0.58, 0.5);
      for (const s of [-1, 1]) {
        k.add(B.post(0.08, 0.8, 6), P.metal, s * 2.4, y0, 1.6);
        k.add(B.lathe([[0.1, 0], [0.3, 0.2], [0.32, 0.28]], 8), P.metal, s * 2.4, y0 + 0.8, 1.6);
        k.add(B.cone(0.24, 0.45, 6), '#ff9a3a', s * 2.4, y0 + 0.95, 1.6, { glow: true });
        H.guard(k, P, 1, s * 1.9, y0, 1.1);
      }
    },
    // trụ gạch có chòi canh
    (k, P, H, wallH) => {
      const B = K(),
        y0 = H.PLINTH,
        th = wallH + 2.0;
      for (const s of [-1, 1]) {
        const x = s * XS;
        k.add(B.box(TW, th, TW, 0.07, true), P.wall, x, y0, 0);
        for (const u of [0.3, 0.65]) k.add(B.box(TW + 0.06, 0.12, TW + 0.06, 0.02, true), '#e8e0d0', x, y0 + th * u, 0);
        k.add(B.box(TW + 0.5, 0.18, TW + 0.5, 0.03, true), P.metal, x, y0 + th, 0);
        for (const dx of [-1.15, 1.15]) for (const dz of [-1.15, 1.15]) k.add(B.post(0.07, 1.6, 5), P.metal, x + dx, y0 + th + 0.18, dz);
        for (const dz of [-1.15, 1.15]) H.rail(k, P.metal, x - 1.15, x + 1.15, y0 + th + 0.18, dz, 0.5, 6);
        k.add(B.roof(3.1, 1.5, 3.1, 0.05, 0.15, 0.15), P.roof, x, y0 + th + 1.78, 0);
        for (const dx of [-0.45, 0.45]) H.guard(k, P, 2, x + dx, y0 + th + 0.18, 0.2);
        k.add(B.box(0.35, 0.3, 0.5, 0.02, true), P.metal, x + s * 0.9, y0 + th + 1.0, 0.9); // đèn pha
        k.add(B.box(0.28, 0.24, 0.04, 0.01), '#fff4c8', x + s * 0.9, y0 + th + 1.03, 1.16, { glow: true });
        for (const u of [0.15, 0.48]) H.win(k, P, 2, x, y0 + th * u + 0.2, TW / 2, 0.5, 0.6);
        H.flag(k, P, x, y0 + th + 3.2, 0, 1.0, 1.0);
      }
      const gh = walls(k, P, 2, wallH);
      endCrenels(k, P.wall2, wallH);
      walkway(k, P, 2, wallH, P.wall2);
      gatehouse(k, P, 2, wallH, (y) => k.add(B.roof(GW + 1.0, 0.8, BK.Blocks.WALL_D + 0.7, 0.05, GW, 0.3), P.roof, 0, y, 0));
      // cổng song sắt, chốt gác, thanh chắn, bao cát, cột đèn
      for (let i = 0; i < 9; i++) k.add(B.box(0.08, gh - 0.05, 0.08, 0.01, true), P.metal, -1.36 + i * 0.34, y0, 0.3);
      for (const y of [0.6, 1.5]) k.add(B.box(GW - 0.1, 0.08, 0.08, 0.01, true), P.metal, 0, y0 + y, 0.3);
      const bx = 2.6;
      k.add(B.box(0.9, 1.4, 0.9, 0.03, true), '#e8e0d0', bx, y0, 1.6);
      k.add(B.box(1.1, 0.12, 1.1, 0.02, true), P.roof, bx, y0 + 1.4, 1.6);
      H.win(k, P, 2, bx, y0 + 0.75, 2.05, 0.5, 0.4);
      k.add(B.box(2.6, 0.08, 0.08, 0.01), P.accent, bx - 1.75, y0 + 0.9, 1.9);
      for (let i = 0; i < 4; i++) k.add(B.box(0.55, 0.24, 0.32, 0.07, true), '#b9a77a', -2.0 - i * 0.5, y0, 1.7);
      for (let i = 0; i < 3; i++) k.add(B.box(0.55, 0.24, 0.32, 0.07, true), '#b9a77a', -2.25 - i * 0.5, y0 + 0.24, 1.7);
      for (const s of [-1, 1]) {
        k.add(B.post(0.05, 1.9, 6), P.metal, s * 4.2, y0, 1.9);
        k.add(B.ball(0.15, 1), '#ffe9a8', s * 4.2, y0 + 2.0, 1.9, { glow: true });
      }
      H.guard(k, P, 2, 1.6, y0, 1.4);
    },
    // trụ neon
    (k, P, H, wallH) => {
      const B = K(),
        y0 = H.PLINTH,
        th = wallH + 2.8;
      const rAt = (u) => (u <= 0.7 ? 1.25 - (0.07 * u) / 0.7 : 1.18 - (0.3 * (u - 0.7)) / 0.3); // bán kính thân theo độ cao
      for (const s of [-1, 1]) {
        const x = s * XS;
        k.add(B.lathe([[1.25, 0], [1.18, th * 0.7], [0.88, th], [0.01, th]], 8), P.wall, x, y0, 0, { rot: [0, Math.PI / 8, 0] });
        for (const u of [0.25, 0.5, 0.75]) H.torus(k, u === 0.5 ? P.accent : P.glow, rAt(u) + 0.03, 0.05, x, y0 + th * u, 0, { glow: true });
        k.add(B.lathe([[0.4, -0.25], [1.5, 0], [1.5, 0.14], [0.01, 0.14]], 12), P.roof, x, y0 + th, 0);
        H.torus(k, P.glow, 1.45, 0.04, x, y0 + th + 0.65, 0, { glow: true });
        for (const dx of [-0.5, 0.5]) H.guard(k, P, 3, x + dx, y0 + th + 0.14, 0.3);
        // súng tháp phía sau sàn
        k.add(B.box(0.6, 0.4, 0.6, 0.03, true), P.wall2, x, y0 + th + 0.14, -0.7);
        k.add(B.post(0.07, 0.9, 6), P.metal, x, y0 + th + 0.4, -0.4, { rot: [Math.PI / 2 - 0.3, 0, 0] });
        H.flag(k, P, x - s * 0.9, y0 + th + 0.14, -0.9, 1.9, 0.9);
      }
      const gh = walls(k, P, 3, wallH);
      walkway(k, P, 3, wallH, P.wall2);
      H.lightBox(k, P, 3, END * 2 - 0.2, 0.08, 0.06, 0, y0 + wallH - 0.3, BK.Blocks.WALL_D / 2 + 0.02);
      // màn chắn năng lượng, vòng biểu tượng trên cổng
      k.add(B.box(GW - 0.1, gh - 0.1, 0.06, 0.01, true), P.glow, 0, y0, 0, { glow: true });
      for (const y of [0.5, 1.1, 1.7, 2.3]) k.add(B.box(GW - 0.1, 0.05, 0.08, 0.01, true), P.accent, 0, y0 + y, 0.04, { glow: true });
      const ring = new root.THREE.TorusGeometry(0.9, 0.07, 4, 28);
      k.add(ring, P.accent, 0, y0 + wallH + 1.2, 0, { glow: true });
      k.add(B.box(0.7, 0.7, 0.05, 0.01), P.glow, 0, y0 + wallH + 1.2, 0, { glow: true, rot: [0, 0, Math.PI / 4] });
      // cọc chắn sáng trước cổng, lính đứng đất
      for (const x of [-3.0, -2.2, 2.2, 3.0]) {
        k.add(B.post(0.15, 0.7, 8), P.wall2, x, y0, 1.7);
        H.torus(k, P.glow, 0.16, 0.03, x, y0 + 0.55, 1.7, { glow: true });
      }
      for (const s of [-1, 1]) H.guard(k, P, 3, s * 1.8, y0, 1.2);
    },
  ];
  BK.Blocks.shape('gate', (k, P, t, H) => {
    H.plinth(k, P, 13.6, 4.6);
    TIER[t](k, P, H, BK.Blocks.WALL_H[t]);
  });
})(typeof self !== 'undefined' ? self : globalThis);
