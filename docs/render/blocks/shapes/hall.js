/* Bể Kính · render/blocks/shapes/hall.js · Hình khối Nhà chính (render/blocks/blocks.js)
 * Người chơi chốt: nhà chính lột xác hẳn qua bốn bậc (khác kiến trúc, không chỉ đổi màu); bậc 4 là toà neon.
 * Chung mọi bậc: cao nhất làng, bệ 7,6 × 7,6, cửa chính và bậc thềm ở giữa mặt trước (+z), cờ lớn ở điểm cao nhất.
 *   bậc 0 gỗ tre    đình làng: nhà sàn gỗ, mái rơm lớn cong hai đầu, hiên cột phía trước, trống đình, hai cột tô-tem
 *   bậc 1 đá        cung đá: hai tầng nền đá, điện chính mái ngói hai tầng cong góc, hàng cột đỏ, hai đèn đá, hai cột cờ
 *   bậc 2 gạch thép dinh thự: hai tầng gạch, hiên cột trắng có trán tường, hai cánh nhà, tháp đồng hồ mái vòm đồng xanh
 *   bậc 3 tương lai tháp neon: bệ tròn, thân tháp thon sẫm có sọc sáng, ba đĩa sàn có vành sáng, đỉnh ăng-ten sáng
 *                   (viền neon dọc mọi cạnh: blocks.js) */
(function (root) {
  const BK = root.BK;
  const K = () => BK.BuildKit;
  const LIGHT = (P) => P.light || '#efe8da'; // đá trắng, vữa trắng (cột, gờ, trán tường)
  // bậc thềm: n bậc từ mặt đất lên độ cao top, chạy ra phía +z từ z0
  function steps(k, color, w, top, z0, n) {
    for (let i = 0; i < n; i++) k.add(K().box(w, (top * (n - i)) / n, 0.42, 0.03, true), color, 0, BK.Blocks.H.PLINTH, z0 + 0.42 * i + 0.21);
  }
  const TIER = [
    // đình làng
    (k, P, H) => {
      const B = K(),
        y0 = H.PLINTH,
        fl = y0 + 0.75; // sàn nhà sàn
      for (const x of [-2.6, -1.3, 0, 1.3, 2.6]) for (const z of [-1.9, 0, 1.9]) k.add(B.post(0.16, 0.75, 6), P.trim, x, y0, z);
      k.add(B.box(6.2, 0.16, 4.6, 0.04, true), P.trim, 0, fl - 0.16, 0);
      H.wall(k, P, 0, { w: 5.2, h: 1.9, d: 2.8, x: 0, y: fl, z: -0.55 });
      for (const x of [-2.6, -1.3, 1.3, 2.6]) k.add(B.post(0.12, 1.9, 6), P.wall2, x, fl, 2.05); // hiên cột
      H.rail(k, P.trim, -2.6, -0.6, fl, 2.05, 0.45, 6);
      H.rail(k, P.trim, 0.6, 2.6, fl, 2.05, 0.45, 6);
      // mái rơm lớn, hai đầu cong vút; đường nóc và hai sừng đầu nóc
      if (H.roof(k, P, 0, { w: 7.4, h: 2.4, d: 5.6, tw: 6.2, td: 0.3, lift: 1.1, x: 0, y: fl + 1.9, z: 0 }) === 'native') {
        k.add(B.box(6.4, 0.22, 0.3, 0.04, true), P.trim, 0, fl + 4.28, 0);
        for (const s of [-1, 1]) k.add(B.cone(0.14, 0.9, 5), P.trim, s * 3.25, fl + 4.3, 0, { rot: [0, 0, -s * 0.6] });
      }
      H.door(k, P, 0, fl, 0.86, 1.2, 1.5);
      for (const s of [-1, 1]) H.win(k, P, 0, s * 1.6, fl + 0.85, 0.83, 0.6, 0.5);
      steps(k, P.trim, 1.4, 0.75, 2.3, 4);
      // trống đình trên hiên, hai cột tô-tem có đầu thú, cờ trên cây tre cao
      k.add(B.post(0.32, 0.5, 10), '#a8452c', 1.9, fl + 0.4, 1.55, { rot: [Math.PI / 2, 0, 0] });
      for (const s of [-1, 1]) {
        k.add(B.post(0.2, 2.6, 6), P.wall2, s * 3.4, y0, 3.2);
        k.add(B.box(0.5, 0.45, 0.45, 0.04, true), P.accent, s * 3.4, y0 + 2.6, 3.2);
        k.add(B.cone(0.12, 0.35, 4), P.trim, s * 3.4, y0 + 3.05, 3.2);
      }
      H.flag(k, P, -3.2, y0, -2.6, 6.4, 1.3);
    },
    // cung đá
    (k, P, H) => {
      const B = K(),
        y0 = H.PLINTH,
        f1 = y0 + 0.45,
        f2 = f1 + 0.45; // hai tầng nền
      k.add(B.box(7.2, 0.45, 6.6, 0.06, true), P.stone, 0, y0, -0.3);
      k.add(B.box(6.2, 0.45, 5.4, 0.06, true), P.wall2, 0, f1, -0.6);
      H.rail(k, P.wall2, -3.5, -0.9, f1, 2.9, 0.3, 7);
      H.rail(k, P.wall2, 0.9, 3.5, f1, 2.9, 0.3, 7);
      steps(k, P.stone, 1.6, 0.9, 2.3, 5);
      // điện chính: tường đá, hàng cột đỏ trước hiên
      H.wall(k, P, 1, { w: 5.0, h: 2.2, d: 3.2, x: 0, y: f2, z: -0.9 });
      for (const x of [-2.4, -1.4, -0.5, 0.5, 1.4, 2.4]) k.add(B.post(0.13, 2.2, 8), '#9c3a2a', x, f2, 1.0);
      // mái ngói hai tầng cong góc, khối giữa hai tầng mái
      H.roof(k, P, 1, { w: 6.6, h: 1.0, d: 4.9, tw: 4.6, td: 2.7, lift: 0.6, x: 0, y: f2 + 2.2, z: -0.5 });
      H.wall(k, P, 1, { w: 3.6, h: 0.9, d: 2.2, x: 0, y: f2 + 3.1, z: -0.6 });
      for (const s of [-1, 0, 1]) H.win(k, P, 1, s * 1.0, f2 + 3.4, 0.5, 0.45, 0.35);
      if (H.roof(k, P, 1, { w: 4.8, h: 1.2, d: 3.4, tw: 1.4, td: 0.3, lift: 0.55, x: 0, y: f2 + 4.0, z: -0.6 }) === 'native') {
        k.add(B.box(1.8, 0.16, 0.24, 0.03, true), P.trim, 0, f2 + 5.2, -0.6);
        for (const s of [-1, 1]) k.add(B.ball(0.2, 0), '#d8b24a', s * 0.95, f2 + 5.4, -0.6); // hai đầu rồng (giản lược)
      }
      H.door(k, P, 0, f2, 0.72, 1.3, 1.7);
      for (const s of [-1, 1]) H.win(k, P, 1, s * 1.7, f2 + 1.0, 0.72, 0.6, 0.6);
      // hai đèn đá ở chân thềm, hai cột cờ hai bên
      for (const s of [-1, 1]) {
        k.add(B.post(0.12, 0.8, 6), P.stone, s * 1.4, y0, 3.3);
        k.add(B.box(0.36, 0.34, 0.36, 0.03, true), '#ffe2a0', s * 1.4, y0 + 0.8, 3.3);
        k.add(B.cone(0.32, 0.3, 4), P.roof, s * 1.4, y0 + 1.14, 3.3, { rot: [0, Math.PI / 4, 0] });
        H.flag(k, P, s * 3.3, f1, 2.4, 4.6, 1.0);
      }
    },
    // dinh thự gạch
    (k, P, H) => {
      const B = K(),
        y0 = H.PLINTH,
        fb = y0 + 0.3,
        hf = 1.55; // một tầng
      k.add(B.box(7.0, 0.3, 5.4, 0.05, true), P.stone, 0, y0, -0.4);
      steps(k, P.stone, 2.2, 0.3, 2.3, 2);
      // thân hai tầng, hai cánh thấp hai bên
      H.wall(k, P, 2, { w: 4.4, h: hf * 2, d: 3.6, x: 0, y: fb, z: -0.6 });
      k.add(B.box(4.6, 0.14, 3.8, 0.03, true), LIGHT(P), 0, fb + hf, -0.6); // gờ tầng
      for (const s of [-1, 1]) {
        H.wall(k, P, 2, { w: 1.3, h: hf * 1.5, d: 3.0, x: s * 2.85, y: fb, z: -0.6, color: P.wall2 });
        H.roof(k, P, 2, { w: 1.6, h: 0.7, d: 3.3, tw: 1.3, td: 0.4, x: s * 2.85, y: fb + hf * 1.5, z: -0.6 });
        for (const fy of [0, 1]) H.win(k, P, 2, s * 2.85, fb + 0.55 + fy * 1.1, 0.9, 0.45, 0.6);
      }
      // mép mái có lan can, mái thấp ở giữa
      if (H.form(P, 'roof', 2) === 'native') {
        k.add(B.box(4.6, 0.16, 3.8, 0.03, true), P.roof, 0, fb + hf * 2, -0.6);
        H.rail(k, LIGHT(P), -2.2, 2.2, fb + hf * 2 + 0.16, 1.25, 0.32, 12);
      } else H.roof(k, P, 2, { w: 4.8, h: 1.3, d: 4.0, tw: 4.8, td: 0.3, x: 0, y: fb + hf * 2, z: -0.6 });
      // hai hàng cửa sổ, hiên cột trắng có trán tường tam giác
      for (const x of [-1.6, -0.8, 0.8, 1.6]) for (const fy of [0, 1]) H.win(k, P, 2, x, fb + 0.75 + fy * hf, 1.2, 0.42, 0.75);
      for (const x of [-0.95, -0.35, 0.35, 0.95]) k.add(B.post(0.12, hf * 2 - 0.1, 10), LIGHT(P), x, fb, 1.75);
      k.add(B.box(2.5, 0.2, 0.8, 0.03, true), LIGHT(P), 0, fb + hf * 2 - 0.1, 1.5);
      k.add(B.roof(2.6, 0.75, 0.9, 0.03, 0.12, 0.9), LIGHT(P), 0, fb + hf * 2 + 0.1, 1.5);
      H.door(k, P, 0, fb, 1.2, 0.9, 1.4);
      // tháp đồng hồ mái vòm đồng xanh
      const yt = fb + hf * 2 + 0.16;
      H.wall(k, P, 2, { w: 1.6, h: 2.0, d: 1.6, x: 0, y: yt, z: -0.8 });
      k.add(B.post(0.5, 0.08, 14), '#f3ead2', 0, yt + 1.3, 0.02, { rot: [Math.PI / 2, 0, 0] });
      k.add(B.box(0.05, 0.38, 0.04, 0.01), P.dark, 0, yt + 1.42, 0.08);
      k.add(B.box(0.3, 0.05, 0.04, 0.01), P.dark, 0.12, yt + 1.3, 0.08);
      k.add(B.box(1.8, 0.16, 1.8, 0.03, true), LIGHT(P), 0, yt + 2.0, -0.8);
      const cupola = (kk) => kk.add(B.lathe([[0.85, 0], [0.8, 0.45], [0.55, 0.85], [0.2, 1.05], [0.02, 1.1]], 12), '#6f9a8a', 0, yt + 2.16, -0.8);
      H.roofRound(k, P, 2, { r: 0.85, h: 1.2, x: 0, y: yt + 2.16, z: -0.8, native: cupola });
      H.flag(k, P, 0, yt + 3.2, -0.8, 1.3, 1.0);
      // hai cột đèn trước thềm
      for (const s of [-1, 1]) {
        k.add(B.post(0.06, 1.5, 6), P.metal, s * 1.6, y0, 3.2);
        k.add(B.ball(0.16, 1), '#ffe9a8', s * 1.6, y0 + 1.6, 3.2, { glow: true });
      }
    },
    // tháp neon
    (k, P, H) => {
      const B = K(),
        y0 = H.PLINTH;
      k.add(B.lathe([[3.6, 0], [3.6, 0.3], [3.0, 0.55], [2.4, 0.6], [0.01, 0.6]], 12), P.wall2, 0, y0, 0);
      H.torus(k, P.glow, 3.3, 0.06, 0, y0 + 0.42, 0, { glow: true });
      H.door(k, P, 0, y0 + 0.6, 1.55, 0.9, 1.5, 3);
      // đảo có dáng tháp riêng (render/blocks/spire.js): thân tháp theo đảo thay cho thân thon và ba đĩa sàn
      if (H.hasSpire(P)) H.spire(k, P, 0, y0 + 0.6, 0, 9.6, 1.7);
      else tower(k, P, H, B, y0);
      // đỉnh: ăng-ten, quả cầu sáng, vành ảnh nổi
      k.add(B.post(0.07, 2.2, 5), P.metal, 0, y0 + 10.2, 0);
      k.add(B.ball(0.28, 1), P.accent, 0, y0 + 12.5, 0, { glow: true });
      H.torus(k, P.glow, 0.9, 0.04, 0, y0 + 11.2, 0, { glow: true });
      H.flag(k, P, 0.9, y0 + 9.0, 0, 1.6, 0.9);
    },
  ];
  // tháp gốc bậc 4 (Lúa Vàng): thân thon, sọc sáng dọc bốn mặt, ba đĩa sàn có vành sáng (nhỏ dần lên cao)
  function tower(k, P, H, B, y0) {
    k.add(B.lathe([[1.7, 0], [1.6, 3], [1.2, 7], [0.8, 9.6], [0.01, 9.8]], 8), P.wall, 0, y0 + 0.6, 0, { rot: [0, Math.PI / 8, 0] });
    for (let i = 0; i < 4; i++) {
      const a = (i * Math.PI) / 2,
        r = 1.42;
      k.add(B.box(0.1, 6.6, 0.1, 0.01), i % 2 ? P.accent : P.glow, Math.sin(a) * r, y0 + 0.9, Math.cos(a) * r, { glow: true, rot: [0, a, 0] });
    }
    [[3.3, 2.9], [5.6, 2.4], [7.7, 1.8]].forEach(([y, r], i) => {
      k.add(B.lathe([[0.6, -0.25], [r, -0.05], [r, 0.12], [r * 0.9, 0.22], [0.01, 0.24]], 12), P.roof, 0, y0 + y, 0);
      H.torus(k, i === 1 ? P.accent : P.glow, r + 0.04, 0.07, 0, y0 + y + 0.03, 0, { glow: true });
      for (let j = 0; j < 6; j++) {
        const a = (j / 6) * Math.PI * 2 + i;
        H.lightBox(k, P, 3, 0.3, 0.14, 0.3, Math.sin(a) * (r - 0.45), y0 + y + 0.22, Math.cos(a) * (r - 0.45));
      }
    });
  }
  BK.Blocks.shape('hall', (k, P, t, H) => {
    H.plinth(k, P, 7.6, 7.6);
    TIER[t](k, P, H);
  });
})(typeof self !== 'undefined' ? self : globalThis);
