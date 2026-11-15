/* Bể Kính · render/blocks/shapes/gate.js · Hình khối Cổng thành (render/blocks/blocks.js)
 * Dáng nhận diện: vòm cổng ở giữa, hai chòi gác cao hai bên (người chơi chốt: chòi gác chỉ báo tin, vũ khí không mạnh), một
 * khối duy nhất. Hai đầu nối khít với đoạn tường bao (render/blocks/shapes/wall.js) cùng độ cao, cùng bề dày.
 *   bậc 0 gỗ tre   khung cổng gỗ, hai chòi tre mái rơm, cánh cổng là hàng cọc   bậc 1 đá       vòm đá, chòi đá có răng tường
 *   bậc 2 gạch thép vòm gạch viền thép, cổng sắt song chắn, chòi mái nhọn       bậc 3 tương lai khung trắng, màn chắn sáng giữa cổng */
(function (root) {
  const BK = root.BK;
  BK.Blocks.shape('gate', (k, P, t, H) => {
    const K = BK.BuildKit,
      y0 = H.PLINTH,
      wallH = BK.Blocks.WALL_H[t],
      thick = BK.Blocks.WALL_D;
    H.plinth(k, P, 9.6, 3.6);
    // hai chòi gác
    const tw = 1.9,
      th = wallH + 2.4,
      xs = 3.6;
    for (const s of [-1, 1]) {
      const x = s * xs;
      if (t === 0) {
        for (const dx of [-0.75, 0.75]) for (const dz of [-0.75, 0.75]) k.add(K.post(0.12, th, 6), P.trim, x + dx, y0, dz);
        k.add(K.box(tw + 0.2, 0.15, tw + 0.2, 0.03, true), P.trim, x, y0 + th - 1.1, 0);
        for (const dz of [-0.95, 0.95]) k.add(K.box(tw + 0.2, 0.55, 0.08, 0.02, true), P.wall, x, y0 + th - 0.95, dz);
        k.add(K.cone(1.55, 1.3, 4), P.roof, x, y0 + th, 0, { rot: [0, Math.PI / 4, 0] });
      } else {
        k.add(K.box(tw, th, tw, 0.07, true), t === 3 ? P.wall : P.wall2, x, y0, 0);
        if (t === 1) H.crenels(k, P.wall2, x - 0.7, x + 0.7, y0 + th, 0.75, 3, 0.36, 0.38, 0.3);
        if (t === 1) H.crenels(k, P.wall2, x - 0.7, x + 0.7, y0 + th, -0.75, 3, 0.36, 0.38, 0.3);
        if (t === 2) k.add(K.roof(2.3, 1.5, 2.3, 0.06, 0.2, 0.2), P.roof, x, y0 + th, 0);
        if (t === 3) {
          k.add(K.box(2.2, 0.18, 2.2, 0.04, true), P.roof, x, y0 + th, 0);
          H.lightBox(k, P, t, tw + 0.1, 0.12, tw + 0.1, x, y0 + th - 0.6, 0);
        }
        H.lightBox(k, P, t, 0.4, 0.55, 0.08, x, y0 + th - 1.2, tw / 2 + 0.02); // ô quan sát
      }
    }
    // tường nối hai chòi, chừa vòm cổng ở giữa
    const span = xs * 2 - tw,
      gw = 2.6,
      gh = Math.min(wallH - 0.5, 2.4),
      side = (span - gw) / 2;
    for (const s of [-1, 1]) k.add(K.box(side, wallH, thick, 0.05, true), P.wall, s * (gw / 2 + side / 2), y0, 0);
    k.add(K.box(gw, wallH - gh, thick, 0.05, true), P.wall, 0, y0 + gh, 0); // xà trên vòm
    k.add(K.box(gw + 0.3, 0.22, thick + 0.12, 0.04, true), t >= 2 ? P.metal : P.trim, 0, y0 + gh - 0.1, 0);
    if (t >= 1 && t <= 2) H.crenels(k, P.wall2, -1.6, 1.6, y0 + wallH, 0, 5, 0.42, 0.34, thick);
    // cánh cổng
    if (t === 0) for (let i = 0; i < 8; i++) k.add(K.post(0.13, gh, 5, 0.04), P.trim, -1.12 + i * 0.32, y0, 0);
    else if (t === 1) k.add(K.box(gw - 0.1, gh - 0.05, 0.16, 0.02, true), P.trim, 0, y0, 0);
    else if (t === 2) for (let i = 0; i < 7; i++) k.add(K.box(0.08, gh - 0.05, 0.08, 0.01, true), P.metal, -1.1 + i * 0.37, y0, 0);
    else k.add(K.box(gw - 0.1, gh - 0.1, 0.06, 0.01, true), P.glow, 0, y0, 0, { glow: true });
    H.flag(k, P, -xs, y0 + th + (t === 0 ? 1.2 : t === 2 ? 1.4 : 0.3), 0, 1.3, 0.9);
    H.flag(k, P, xs, y0 + th + (t === 0 ? 1.2 : t === 2 ? 1.4 : 0.3), 0, 1.3, 0.9);
  });
})(typeof self !== 'undefined' ? self : globalThis);
