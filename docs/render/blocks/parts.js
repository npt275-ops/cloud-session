/* Bể Kính · render/blocks/parts.js · Mảnh dùng chung cho các khối công trình (H trong render/blocks/shapes/*.js)
 * Mảnh nào hai loại khối trở lên cùng dùng thì để ở đây, mảnh riêng của một loại thì để trong tệp hình dáng của loại đó.
 *   PLINTH, plinth      bệ đá chuẩn dưới mọi khối (nhìn là biết công trình quan trọng, bấm được)
 *   flag                cột cờ và lá cờ
 *   door, win           cửa ra vào; ô cửa sổ có khung, bậu (bậc tương lai: ô kính phát sáng)
 *   crenels             hàng răng tường (lỗ châu mai)
 *   lightBox            ô sáng, dải đèn: bậc tương lai thì phát sáng thật
 *   rail                lan can: thanh trên và các song đứng dọc trục x
 *   guard               lính gác đứng (cao ~1,25, quay mặt về +z): quần áo, mũ, vũ khí theo bậc
 *   torus               vòng tròn nằm ngang (vành sáng, bánh xe) dựng bằng three.js
 *   barrel, crate       thùng gỗ, hòm (đồ đạc sân lính, kho, cổng)
 *   banner, torch       cờ treo dọc áp tường, đuốc
 * Cần: three.js, render/build/kit3d.js, render/blocks/blocks.js. */
(function (root) {
  const BK = root.BK;
  const K = () => BK.BuildKit;
  const PLINTH = 0.22; // (đơn vị) bệ cao chừng này; mọi khối dựng từ mặt bệ
  // quần áo lính gác theo bậc: áo, quần, mũ, da
  const GUARD = [
    { coat: '#8a6a3a', legs: '#4d3a22', hat: '#d8bf78', skin: '#e0b48a' },
    { coat: '#8c2a22', legs: '#3b3530', hat: '#8e9196', skin: '#e0b48a' },
    { coat: '#4a6040', legs: '#2f3a2c', hat: '#4a6040', skin: '#e0b48a' },
    { coat: '#232a36', legs: '#161b24', hat: '#2e3646', skin: '#d9b28c' },
  ];
  const H = {
    PLINTH,
    plinth(k, P, w, d) {
      k.add(K().box(w, PLINTH, d, 0.07, true), P.stone, 0, 0, 0);
    },
    // cờ: cột và lá cờ (size: bề ngang lá cờ)
    flag(k, P, x, y, z, h, size) {
      k.add(K().post(0.05, h, 5), P.dark, x, y, z);
      k.add(K().box(size, size * 0.62, 0.05, 0.01), P.accent, x + size / 2 + 0.04, y + h - size * 0.36, z);
    },
    // cửa: tấm sẫm áp mặt trước (z: mặt tường trước); bậc tương lai: viền sáng
    door(k, P, x, y, z, w, h, t) {
      k.add(K().box(w + 0.16, h + 0.08, 0.1, 0.02, true), t === 3 ? P.glow : P.trim, x, y, z + 0.02, t === 3 ? { glow: true } : null);
      k.add(K().box(w, h, 0.1, 0.02, true), P.dark, x, y, z + 0.06);
    },
    // ô cửa sổ áp mặt trước: khung, kính sáng, bậu dưới (bậc tương lai: kính phát sáng, không khung)
    win(k, P, t, x, y, z, w, h) {
      if (t === 3) return H.lightBox(k, P, t, w, h, 0.08, x, y, z + 0.03);
      k.add(K().box(w + 0.12, h + 0.12, 0.06, 0.01), P.trim, x, y - 0.06, z + 0.02);
      k.add(K().box(w, h, 0.06, 0.01), '#ffe9a8', x, y, z + 0.05);
      k.add(K().box(0.04, h, 0.04, 0.01), P.trim, x, y, z + 0.09);
      k.add(K().box(w + 0.24, 0.07, 0.16, 0.01), P.trim, x, y - 0.1, z + 0.08);
    },
    // răng tường (lỗ châu mai) dọc trục x: n răng từ x0 tới x1 ở độ cao y
    crenels(k, color, x0, x1, y, z, n, w, h, d) {
      for (let i = 0; i < n; i++) k.add(K().box(w, h, d, 0.03, true), color, x0 + ((x1 - x0) * i) / Math.max(1, n - 1), y, z);
    },
    // ô sáng (cửa sổ, dải đèn): màu sáng, bậc tương lai thì phát sáng thật
    lightBox(k, P, t, w, h, d, x, y, z) {
      k.add(K().box(w, h, d, 0.01), t === 3 ? P.glow : '#ffe9a8', x, y, z, t === 3 ? { glow: true } : null);
    },
    // lan can dọc trục x từ x0 tới x1 ở độ cao y (h: cao lan can, n: số song)
    rail(k, color, x0, x1, y, z, h, n) {
      k.add(K().box(Math.abs(x1 - x0) + 0.08, 0.06, 0.08, 0.01), color, (x0 + x1) / 2, y + h, z);
      for (let i = 0; i < n; i++) k.add(K().box(0.05, h, 0.05, 0.01), color, x0 + ((x1 - x0) * i) / Math.max(1, n - 1), y, z);
    },
    // vòng tròn nằm ngang bán kính r, dày tube, ở (x, y, z)
    torus(k, color, r, tube, x, y, z, o) {
      const g = new root.THREE.TorusGeometry(r, tube, 4, 28);
      k.add(g, color, x, y, z, Object.assign({ rot: [Math.PI / 2, 0, 0] }, o || {}));
    },
    // thùng gỗ đai sắt (bậc tương lai: thùng kim loại có vành sáng)
    barrel(k, P, t, x, y, z) {
      k.add(K().lathe([[0.2, 0], [0.25, 0.25], [0.2, 0.5]], 8), t === 3 ? P.metal : '#8a5a32', x, y, z);
      for (const yy of [0.1, 0.4]) H.torus(k, t === 3 ? P.glow : P.dark, 0.23, 0.02, x, y + yy, z, t === 3 ? { glow: true } : null);
    },
    // hòm gỗ cạnh s, hai nẹp chéo mặt trước
    crate(k, P, t, x, y, z, s) {
      k.add(K().box(s, s, s, 0.02, true), t === 3 ? P.wall2 : '#a77b48', x, y, z);
      k.add(K().box(s + 0.02, 0.06, s + 0.02, 0.01, true), t === 3 ? P.glow : P.trim, x, y + s * 0.45, z, t === 3 ? { glow: true } : null);
    },
    // cờ treo dọc áp mặt tường trước (z: mặt tường): thanh treo, tấm vải, viền dưới
    banner(k, P, x, y, z, w, h) {
      k.add(K().box(w + 0.2, 0.06, 0.06, 0.01), P.dark, x, y, z + 0.06);
      k.add(K().box(w, h, 0.04, 0.01), P.accent, x, y - h, z + 0.05);
      k.add(K().box(w * 0.5, w * 0.5, 0.03, 0.01), '#e8c75a', x, y - h * 0.45, z + 0.08, { rot: [0, 0, Math.PI / 4] });
    },
    // đuốc (bậc tương lai: đèn cột sáng)
    torch(k, P, t, x, y, z) {
      k.add(K().post(0.05, 0.5, 5), t === 3 ? P.metal : P.trim, x, y, z);
      if (t === 3) k.add(K().box(0.12, 0.3, 0.12, 0.01), P.glow, x, y + 0.5, z, { glow: true });
      else k.add(K().cone(0.11, 0.3, 6), '#ff9a3a', x, y + 0.5, z, { glow: true });
    },
    // lính gác đứng ở (x, y, z), mặt về +z. Vũ khí theo bậc: giáo tre, giáo sắt, súng trường, gậy sáng
    guard(k, P, t, x, y, z) {
      const B = K(),
        c = GUARD[t];
      for (const s of [-1, 1]) k.add(B.box(0.13, 0.5, 0.16, 0.01, true), c.legs, x + s * 0.09, y, z);
      k.add(B.box(0.42, 0.5, 0.26, 0.04, true), c.coat, x, y + 0.48, z);
      k.add(B.box(0.44, 0.07, 0.28, 0.01, true), t === 3 ? P.glow : P.dark, x, y + 0.5, z, t === 3 ? { glow: true } : null); // thắt lưng
      for (const s of [-1, 1]) k.add(B.box(0.1, 0.44, 0.12, 0.01, true), c.coat, x + s * 0.27, y + 0.53, z);
      k.add(B.ball(0.16, 1), c.skin, x, y + 1.12, z);
      if (t === 0) k.add(B.cone(0.3, 0.16, 8), c.hat, x, y + 1.2, z); // nón lá
      else if (t === 1) k.add(B.lathe([[0.18, 0], [0.19, 0.1], [0.12, 0.22], [0.01, 0.3]], 8), c.hat, x, y + 1.12, z); // mũ sắt
      else if (t === 2) {
        k.add(B.post(0.17, 0.14, 8), c.hat, x, y + 1.18, z); // mũ lính
        k.add(B.box(0.3, 0.03, 0.16, 0.01), c.hat, x, y + 1.18, z + 0.14);
      } else {
        k.add(B.post(0.18, 0.2, 8), c.hat, x, y + 1.08, z);
        k.add(B.box(0.3, 0.07, 0.04, 0.01), P.glow, x, y + 1.14, z + 0.16, { glow: true }); // kính che mắt sáng
      }
      // vũ khí cầm tay phải
      const xr = x + 0.32;
      if (t <= 1) {
        k.add(B.post(0.025, 1.75, 4), t === 0 ? '#c7a564' : P.trim, xr, y + 0.1, z + 0.05);
        k.add(B.cone(0.05, 0.22, 4), t === 0 ? '#c7a564' : P.metal, xr, y + 1.85, z + 0.05);
        if (t === 1) k.add(B.box(0.06, 0.14, 0.06, 0.01), P.accent, xr, y + 1.7, z + 0.05); // tua đỏ
      } else if (t === 2) k.add(B.box(0.06, 0.08, 0.8, 0.01), '#2b2b2b', xr - 0.1, y + 0.75, z + 0.2, { rot: [-0.9, 0, 0] }); // súng
      else k.add(B.post(0.03, 1.4, 5), P.glow, xr, y + 0.2, z + 0.05, { glow: true });
    },
  };
  BK.Blocks.H = H;
})(typeof self !== 'undefined' ? self : globalThis);
