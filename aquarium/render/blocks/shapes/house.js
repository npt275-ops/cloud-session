/* Bể Kính · render/blocks/shapes/house.js · Hình khối Nhà dân (render/blocks/blocks.js)
 * Người chơi chốt: nhà dân lớn dần theo thời: nhà nhỏ một tầng, rồi hai tầng, rồi ba tầng; bậc tương lai là nhà neon.
 * Chung mọi bậc: bệ 3,6 × 3,6, cửa ở mặt trước (+z), có chỗ sinh hoạt bên ngoài (chum nước, ghế, ban công, vườn mái).
 *   bậc 0 gỗ tre    nhà sàn một tầng vách tre, mái rơm, thang gỗ, rơm và chum nước, hàng rào tre
 *   bậc 1 đá        hai tầng: tầng dưới đá, tầng trên khung gỗ chìa ra, mái ngói cong nhẹ, ống khói đá, hộp hoa, ghế
 *   bậc 2 gạch thép ba tầng gạch: gờ tầng, ban công lan can sắt tầng 2 và 3, mái hiên cửa, mái bằng có tường chắn, bồn nước
 *   bậc 3 tương lai ba tầng lệch nhau chìa ra (nhà neon), dải kính sáng, vườn trên mái, ăng-ten (viền neon: blocks.js)
 *   bậc 4 huyền ảo  nhà kén tròn trên tảng đá bay, bậc đá bay, trụ sáng, biểu tượng đảo trên nóc (render/blocks/mythic.js) */
(function (root) {
  const BK = root.BK;
  const K = () => BK.BuildKit;
  const TIER = [
    // nhà sàn tre
    (k, P, H) => {
      const B = K(),
        y0 = H.PLINTH,
        fl = y0 + 0.45;
      for (const x of [-1.0, 1.0]) for (const z of [-0.8, 0.8]) k.add(B.post(0.08, 0.45, 5), P.trim, x, y0, z);
      k.add(B.box(2.5, 0.1, 2.1, 0.02, true), P.trim, 0, fl - 0.1, 0);
      if (H.wall(k, P, 0, { w: 2.2, h: 1.3, d: 1.8, x: 0, y: fl, z: -0.1 }) === 'native')
        for (const x of [-1.05, -0.35, 0.35, 1.05]) k.add(B.box(0.06, 1.3, 0.06, 0.01), P.wall2, x, fl, 0.82); // nẹp tre
      H.roof(k, P, 0, { w: 3.0, h: 1.3, d: 2.6, tw: 2.4, td: 0.2, lift: 0.35, x: 0, y: fl + 1.3, z: -0.1 });
      H.door(k, P, -0.45, fl, 0.8, 0.55, 0.95, 0);
      H.rail(k, P.trim, 0.0, 1.2, fl, 1.0, 0.4, 5); // lan can sàn trước
      H.win(k, P, 0, 0.5, fl + 0.7, 0.8, 0.45, 0.35);
      for (let i = 0; i < 4; i++) k.add(B.box(0.5, 0.05, 0.08, 0.01), P.trim, -0.45, y0 + 0.08 + i * 0.12, 1.1 + i * 0.03); // thang
      k.add(B.cone(0.45, 0.7, 7), '#d8bf78', 1.25, y0, 1.25); // đống rơm
      k.add(B.lathe([[0.18, 0], [0.25, 0.18], [0.2, 0.38], [0.14, 0.42]], 8), '#9a5a36', -1.3, y0, 1.3); // chum nước
      for (let i = 0; i < 9; i++) k.add(B.post(0.04, 0.45, 4), P.wall2, -1.7 + i * 0.425, y0, -1.7); // rào tre sau nhà
    },
    // nhà hai tầng đá và gỗ
    (k, P, H) => {
      const B = K(),
        y0 = H.PLINTH,
        f2 = y0 + 1.3;
      H.wall(k, P, 1, { w: 2.6, h: 1.3, d: 2.2, x: 0, y: y0, z: -0.2 });
      k.add(B.box(2.9, 0.12, 2.5, 0.02, true), P.trim, 0, f2, -0.2); // dầm chìa
      if (H.wall(k, P, 1, { w: 2.8, h: 1.15, d: 2.4, x: 0, y: f2 + 0.12, z: -0.2, color: P.upper || '#e6d9bc' }) === 'native')
        for (const x of [-1.35, -0.45, 0.45, 1.35]) k.add(B.box(0.08, 1.15, 0.06, 0.01), P.trim, x, f2 + 0.12, 1.02); // khung gỗ
      H.roof(k, P, 1, { w: 3.4, h: 1.0, d: 3.0, tw: 3.0, td: 0.25, lift: 0.3, x: 0, y: f2 + 1.27, z: -0.2 });
      k.add(B.box(0.45, 1.3, 0.45, 0.04, true), P.stone, 0.85, f2 + 1.0, -0.8); // ống khói
      k.add(B.box(0.55, 0.1, 0.55, 0.02, true), P.dark, 0.85, f2 + 2.3, -0.8);
      H.door(k, P, -0.55, y0 + 0.1, 0.9, 0.6, 1.0, 1);
      H.porch(k, P, 1, -0.55, y0 + 0.1, 0.9, 1.3, 0.65, 1.05); // hiên trước cửa
      H.win(k, P, 1, 0.55, y0 + 0.75, 0.9, 0.5, 0.45);
      for (const x of [-0.75, 0.75]) {
        H.win(k, P, 1, x, f2 + 0.6, 1.0, 0.5, 0.45);
        k.add(B.box(0.6, 0.14, 0.18, 0.02), '#7a4a2a', x, f2 + 0.42, 1.12); // hộp hoa
        k.add(B.ball(0.08, 0), P.accent, x - 0.15, f2 + 0.6, 1.12);
        k.add(B.ball(0.08, 0), '#e7c34a', x + 0.15, f2 + 0.6, 1.12);
      }
      k.add(B.box(0.9, 0.08, 0.3, 0.01, true), P.trim, 0.6, y0 + 0.35, 1.35); // ghế
      for (const x of [0.25, 0.95]) k.add(B.box(0.06, 0.35, 0.25, 0.01, true), P.trim, x, y0, 1.35);
    },
    // nhà phố ba tầng gạch
    (k, P, H) => {
      const B = K(),
        y0 = H.PLINTH,
        hf = 1.15,
        zf = 0.85;
      H.wall(k, P, 2, { w: 2.6, h: hf * 3, d: 2.4, x: 0, y: y0, z: -0.35 });
      for (let f = 1; f <= 3; f++) k.add(B.box(2.7, 0.1, 2.5, 0.02, true), '#e8e0d0', 0, y0 + hf * f - 0.05, -0.35); // gờ tầng
      const flat = H.form(P, 'roof', 2) === 'native'; // (hình gốc: mái bằng có tường chắn, đồ trên mái)
      if (flat) k.add(B.box(2.7, 0.35, 2.5, 0.03, true), P.wall2, 0, y0 + hf * 3, -0.35); // tường chắn mái
      else H.roof(k, P, 2, { w: 3.0, h: 1.1, d: 2.8, tw: 3.0, td: 0.25, x: 0, y: y0 + hf * 3, z: -0.35 });
      // tầng trệt: cửa, mái hiên, cửa sổ
      H.door(k, P, -0.6, y0, zf, 0.6, 0.95);
      k.add(B.box(1.0, 0.06, 0.45, 0.01), P.roof, -0.6, y0 + 1.0, zf + 0.22, { rot: [0.2, 0, 0] });
      H.win(k, P, 2, 0.6, y0 + 0.5, zf, 0.6, 0.5);
      // tầng 2 và 3: hai cửa sổ, ban công lan can sắt
      for (let f = 1; f <= 2; f++) {
        const yf = y0 + hf * f;
        for (const x of [-0.6, 0.6]) H.win(k, P, 2, x, yf + 0.35, zf, 0.5, 0.55);
        k.add(B.box(2.2, 0.08, 0.45, 0.01, true), '#e8e0d0', 0, yf, zf + 0.22);
        H.rail(k, P.metal, -1.08, 1.08, yf + 0.08, zf + 0.42, 0.38, 9);
      }
      // trên mái: chòi cầu thang, bồn nước, ống khói
      if (!flat) return;
      k.add(B.box(0.9, 0.7, 0.8, 0.04, true), P.wall2, -0.6, y0 + hf * 3, -0.9);
      k.add(B.post(0.32, 0.6, 10), P.metal, 0.7, y0 + hf * 3 + 0.35, -0.9, { rot: [0, 0, Math.PI / 2] });
      for (const x of [0.45, 0.95]) k.add(B.box(0.08, 0.35, 0.08, 0.01, true), P.metal, x, y0 + hf * 3, -0.9);
      k.add(B.box(0.3, 0.6, 0.3, 0.03, true), P.stone, 1.0, y0 + hf * 3, 0.3);
    },
    // nhà neon ba tầng lệch
    (k, P, H) => {
      const B = K(),
        y0 = H.PLINTH,
        hf = 1.2;
      const floors = [
        [0, -0.2, 2.6, 2.4],
        [0.35, 0.1, 2.5, 2.3],
        [-0.3, -0.25, 2.3, 2.1],
      ]; // [lệch x, lệch z, rộng, sâu]: mỗi tầng chìa ra một phía
      floors.forEach(([dx, dz, w, d], f) => {
        const yf = y0 + hf * f;
        k.add(B.box(w, hf - 0.08, d, 0.05, true), f === 1 ? P.wall2 : P.wall, dx, yf, dz);
        k.add(B.box(w + 0.06, 0.08, d + 0.06, 0.01, true), P.roof, dx, yf + hf - 0.08, dz);
        H.lightBox(k, P, 3, w - 0.5, 0.36, 0.06, dx, yf + 0.45, dz + d / 2 + 0.02); // dải kính sáng mặt trước
        H.lightBox(k, P, 3, 0.06, 0.36, d - 0.6, dx + w / 2 + 0.02, yf + 0.45, dz);
      });
      H.door(k, P, -0.7, y0, 1.0, 0.55, 0.95, 3);
      // vườn trên mái, ăng-ten, đèn tím ở góc
      const yr = y0 + hf * 3;
      if (H.form(P, 'roof', 3) === 'native') {
        k.add(B.box(1.6, 0.18, 1.4, 0.02, true), '#3c6a3a', -0.3, yr, -0.25);
        for (const [x, z] of [[-0.8, -0.6], [0.1, 0.1], [-0.5, 0.2]]) k.add(B.ball(0.24, 0), '#5aa04a', x, yr + 0.35, z);
      } else H.roof(k, P, 3, { w: 2.3, h: 0.9, d: 2.1, tw: 2.3, td: 0.3, x: -0.3, y: yr, z: -0.25 });
      k.add(B.post(0.04, 1.2, 4), P.metal, 0.75, yr, -0.9);
      k.add(B.ball(0.1, 0), P.accent, 0.75, yr + 1.25, -0.9, { glow: true });
      k.add(B.box(0.08, hf * 3, 0.08, 0.01, true), P.accent, 1.3, y0, 0.98, { glow: true });
    },
    // nhà kén lơ lửng: vòng chữ cổ, trụ sáng, ba bậc đá bay, kén tròn trên tảng đá bay, biểu tượng đảo nhỏ trên nóc
    (k, P, H) => {
      const B = K(),
        y0 = H.PLINTH,
        ry = y0 + 1.7;
      H.runes(k, P, 0, y0, 0, 1.55);
      H.beam(k, P, 0, y0, 0, 0.25, ry - 1.1 - y0 + 0.1);
      const st = k.sub('float1', [0, 0, 0]);
      for (let i = 0; i < 3; i++) st.add(B.box(0.6, 0.1, 0.4, 0.02, true), P.stone, 0.9 - i * 0.35, y0 + 0.35 + i * 0.45, 1.5 - i * 0.2);
      const f = k.sub('float0', [0, ry, 0]);
      H.floatRock(f, P, 0, 0, 0, 1.55, 1.1);
      f.add(B.lathe([[1.0, 0], [1.15, 0.5], [1.05, 1.2], [0.7, 1.65], [0.01, 1.8]], 12), P.wall, 0, 0.1, 0);
      H.torus(f, P.glow, 1.16, 0.04, 0, 0.75, 0, { glow: true });
      for (const x of [0.62, -0.62]) H.win(f, P, 4, x, 1.2, 0.86, 0.26, 0.3);
      H.door(f, P, 0, 0.1, 1.02, 0.45, 0.8, 4);
      H.crown(f, P, 0, 1.85, 0, 0.6);
      H.orbit(k, P, 'spin0', 0, ry + 1.2, 0, 1.8, 4);
    },
  ];
  BK.Blocks.shape('house', (k, P, t, H) => {
    H.plinth(k, P, 3.6, 3.6);
    TIER[t](k, P, H);
  });
})(typeof self !== 'undefined' ? self : globalThis);
