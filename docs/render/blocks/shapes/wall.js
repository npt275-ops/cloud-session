/* Bể Kính · render/blocks/shapes/wall.js · Hình khối Tường bao, một đoạn (render/blocks/blocks.js)
 * Dáng nhận diện: đoạn thẳng dài 4, dày, có lỗ châu mai; hai đầu phẳng để các đoạn nối khít nhau thành vòng thành kín. Cao,
 * dày theo bậc: blocks.js WALL_H, WALL_D (cổng thành dùng cùng số để nối khít).
 *   bậc 0 gỗ tre   hàng cọc gỗ vót nhọn, thanh giằng ngang (người chơi chốt: một số thời tường không đạt chuẩn: thấp, thưa)
 *   bậc 1 đá       đá xếp, răng tường      bậc 2 gạch thép gạch dày viền thép, răng tường
 *   bậc 3 tương lai hai trụ trắng giữa là tấm chắn năng lượng phát sáng
 *   bậc 4 huyền ảo  bệ đá có chữ cổ, tấm pha lê bay lơ lửng giữa hai trụ sáng (render/blocks/mythic.js) */
(function (root) {
  const BK = root.BK;
  BK.Blocks.shape('wall', (k, P, t, H) => {
    const K = BK.BuildKit,
      y0 = H.PLINTH,
      L = 4,
      h = BK.Blocks.WALL_H[t],
      d = BK.Blocks.WALL_D;
    H.plinth(k, P, L, d + 0.3);
    if (t === 4) {
      // tường huyền ảo: bệ đá thấp có chữ cổ sáng, tấm pha lê bay lơ lửng phía trên, hai trụ sáng giữ tấm
      k.add(K.box(L, 0.4, d, 0.04, true), P.stone, 0, y0, 0);
      for (const x of [-1.2, 0, 1.2]) H.lightBox(k, P, 4, 0.5, 0.08, 0.04, x, y0 + 0.2, d / 2 + 0.02);
      for (const x of [-L / 2 + 0.3, L / 2 - 0.3]) H.beam(k, P, x, y0 + 0.4, 0, 0.12, h - 0.4);
      const f = k.sub('float0', [0, y0 + 0.75, 0]);
      f.add(K.box(L - 0.7, h - 0.9, 0.5, 0.06, true), P.wall2, 0, 0, 0);
      for (const y of [0.05, h - 1.0]) f.add(K.box(L - 0.66, 0.06, 0.54, 0.01, true), P.glow, 0, y, 0, { glow: true });
      for (const x of [-0.9, 0, 0.9]) f.add(K.box(0.08, h - 1.4, 0.02, 0.01, true), P.accent, x, 0.25, 0.27, { glow: true });
      return;
    }
    if (t === 0) {
      for (let i = 0; i < 11; i++) {
        const hh = h + ((i * 37) % 5) * 0.08;
        k.add(K.post(0.17, hh - 0.35, 6, 0.17), P.trim, -L / 2 + 0.18 + i * 0.364, y0, 0);
        k.add(K.cone(0.17, 0.35, 6), P.trim, -L / 2 + 0.18 + i * 0.364, y0 + hh - 0.35, 0);
      }
      for (const y of [0.6, h - 0.8]) k.add(K.box(L, 0.12, 0.12, 0.02), P.wall2, 0, y0 + y, 0.2);
      return;
    }
    if (t === 3) {
      for (const s of [-1, 1]) k.add(K.box(0.5, h + 0.3, d, 0.06, true), P.wall, s * (L / 2 - 0.25), y0, 0);
      k.add(K.box(L - 1, h - 0.4, 0.12, 0.01, true), P.glow, 0, y0 + 0.2, 0, { glow: true });
      k.add(K.box(L, 0.22, d, 0.04, true), P.wall2, 0, y0, 0);
      return;
    }
    H.wall(k, P, t, { w: L, h, d, x: 0, y: y0, z: 0 });
    if (t === 2) for (const y of [0.05, h - 0.12]) k.add(K.box(L, 0.12, d + 0.06, 0.02, true), P.metal, 0, y0 + y, 0);
    for (const z of [-d / 2 + 0.17, d / 2 - 0.17]) H.crenels(k, P.wall2, -L / 2 + 0.3, L / 2 - 0.3, y0 + h, z, 5, 0.46, 0.4, 0.34);
  });
})(typeof self !== 'undefined' ? self : globalThis);
