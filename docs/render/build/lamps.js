/* Bể Kính · render/build/lamps.js · Đèn đường qua các thời (thời 1 tới 9, cả sáu đảo)
 * Mỗi thời một kiểu đèn, đứng bên lề vòng đường và các đường toả ra của đảo, so le hai bên:
 *   1 đuốc cắm · 2 đuốc tre có giỏ lửa · 3 đèn đá · 4 đèn dầu cột sắt · 5 đèn khí hai tay · 6 đèn điện cần cong
 *   7 đèn cao áp hai cần · 8 cột đèn LED thông minh (dải sáng dọc, vòng sáng trên đỉnh) · 9 đèn sinh học (cuống cong, bầu sáng)
 * Từ thời 10 không còn đèn đường: cả thành phố tự sáng (render/build/neon.js).
 * Đèn bật về tối, tắt về sáng: phần sáng (lửa, bóng đèn, vũng sáng dưới chân) vẽ bằng mảnh { lit: true } (render/build/kit3d.js
 * litMat, render/buildings3d.js animate tăng dần độ sáng khi trời tối, ban ngày trong suốt); ban ngày chỉ thấy cột, lồng đèn,
 * kính đèn (mảnh thường).
 * Mỗi đảo một màu ánh đèn (LIGHT) và màu cột (POLE). line(k, N, lv, key, st) đặt đèn của thời lv dọc mạng đường N
 * (st.w: bề rộng mặt đường, st.color: màu mặt đường để tô vũng sáng). Cần: kit3d.js, plains/common.js (B, Bc), roads.js. */
(function (root) {
  const BK = root.BK, K = BK.BuildKit, { B, Bc } = BK.Plains3D;
  const THREE = () => window.THREE;
  const LIGHT = { plains: '#ffd27a', forest: '#f0ffb8', mountain: '#ffc890', tundra: '#e0f6ff', coast: '#d0fff2', desert: '#ffc8dc' };
  const BIO = { plains: '#ffe08a', forest: '#c8f07a', mountain: '#ffb08a', tundra: '#9af0ff', coast: '#7affd8', desert: '#ff9ad0' };
  const POLE = { plains: '#3a3a3e', forest: '#3e4a32', mountain: '#4a3e38', tundra: '#4a5a66', coast: '#2f4a52', desert: '#6a4a40' };
  const FIRE = '#ff9a3a', FLAME = '#ffe08a', GLASS = '#e8e2c8';
  // phần sáng: kính (ban ngày) và lớp sáng phủ ngoài (ban đêm) cùng dáng
  function bulb(k, geo, glass, light, x, y, z, o) { k.add(geo, glass, x, y, z, o); k.add(geo.clone().scale(1.06, 1.06, 1.06), light, x, y, z, Object.assign({ lit: true }, o)); }
  // kiểu đèn của từng thời: (k, x, z, hướng ra đường [dx, dz], góc đường, màu)
  const STYLE = [null,
    // 1 · đuốc cắm: cọc gỗ, đầu đuốc quấn, ngọn lửa
    (k, x, z, d, a, c) => { k.add(K.post(0.07, 1.6, 5), '#6b4a2a', x, 0, z, { rot: [0.08, a, 0, 'YXZ'] }); k.add(K.ball(0.17, 0), '#3a2a20', x, 1.62, z); k.add(K.cone(0.2, 0.55, 6), FIRE, x, 1.62, z, { lit: true }); k.add(K.cone(0.1, 0.32, 5), FLAME, x, 1.68, z, { lit: true }); },
    // 2 · đuốc tre: cây tre cao, giỏ lửa đan, ngọn lửa to
    (k, x, z, d, a, c) => { k.add(K.post(0.06, 2.2, 6), '#a0904e', x, 0, z); for (const h of [0.7, 1.4]) k.add(K.post(0.075, 0.06, 6), '#7a6a38', x, h, z); k.add(K.cone(0.28, 0.4, 7).rotateX(Math.PI), '#6b4a2a', x, 2.6, z); k.add(K.ball(0.26, 0), FIRE, x, 2.66, z, { sc: [1, 1.5, 1], lit: true }); k.add(K.ball(0.13, 0), FLAME, x, 2.72, z, { sc: [1, 1.5, 1], lit: true }); },
    // 3 · đèn đá: bệ, thân, hộp lửa bốn trụ, mái chóp
    (k, x, z, d, a, c) => { const S = '#8a8478'; k.add(B(0.62, 0.28, 0.62), S, x, 0, z, { rot: [0, a, 0] }); k.add(K.post(0.13, 0.8, 6), S, x, 0.28, z); k.add(B(0.56, 0.1, 0.56), S, x, 1.08, z, { rot: [0, a, 0] }); for (const [u, v] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) k.add(B(0.07, 0.42, 0.07, 0.01), S, x + u * 0.21, 1.18, z + v * 0.21); bulb(k, Bc(0.3, 0.32, 0.3, 0.02), '#d8c898', FIRE, x, 1.39, z); k.add(K.cone(0.5, 0.36, 4), '#6e6a60', x, 1.6, z, { rot: [0, Math.PI / 4 + a, 0] }); },
    // 4 · đèn dầu: cột sắt, lồng đèn có kính, nắp chóp
    (k, x, z, d, a, c) => { k.add(K.post(0.13, 0.4, 6), c.pole, x, 0, z); k.add(K.post(0.065, 2.8, 6), c.pole, x, 0, z); k.add(B(0.4, 0.06, 0.4, 0.02), c.pole, x, 2.78, z); for (const [u, v] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) k.add(B(0.04, 0.42, 0.04, 0.01), c.pole, x + u * 0.17, 2.84, z + v * 0.17); bulb(k, Bc(0.28, 0.36, 0.28, 0.02), GLASS, c.light, x, 3.04, z); k.add(K.cone(0.3, 0.3, 4), c.pole, x, 3.26, z, { rot: [0, Math.PI / 4, 0] }); },
    // 5 · đèn khí: chân đế đúc, thân cao, xà ngang hai tay, hai lồng đèn treo
    (k, x, z, d, a, c) => { k.add(K.post(0.2, 0.5, 8), c.pole, x, 0, z); k.add(K.post(0.07, 3.3, 8), c.pole, x, 0.5, z); k.add(K.ball(0.12, 0), c.pole, x, 3.8, z); const nx = d[1], nz = -d[0]; k.add(Bc(0.07, 0.07, 1.3, 0.02), c.pole, x, 3.55, z, { rot: [0, a, 0] }); for (const s of [-0.55, 0.55]) { const X = x + nx * s, Z = z + nz * s; k.add(K.post(0.02, 0.2, 4), c.pole, X, 3.35, Z); bulb(k, Bc(0.26, 0.34, 0.26, 0.02), GLASS, c.light, X, 3.16, Z); k.add(K.cone(0.24, 0.18, 6), c.pole, X, 3.33, Z); } },
    // 6 · đèn điện: cột thép, cần cong vươn ra đường, chao đèn dẹt
    (k, x, z, d, a, c) => { const M = '#7a7e86', X = x + d[0] * 1.3, Z = z + d[1] * 1.3, ra = Math.atan2(d[0], d[1]); k.add(K.post(0.1, 4.7, 8), M, x, 0, z); k.add(Bc(0.08, 0.08, 1.5, 0.02), M, x + d[0] * 0.7, 4.78, z + d[1] * 0.7, { rot: [-0.12, ra, 0] }); k.add(Bc(0.32, 0.12, 0.7, 0.04), '#5a5e66', X, 4.62, Z, { rot: [0, ra, 0] }); bulb(k, Bc(0.24, 0.05, 0.56, 0.01), '#eef0e8', c.light, X, 4.53, Z, { rot: [0, ra, 0] }); },
    // 7 · đèn cao áp: cột cao, thanh ngang, hai chao đèn hai đầu (một trên đường, một trên vỉa)
    (k, x, z, d, a, c) => { const M = '#8a8e96', ra = Math.atan2(d[0], d[1]); k.add(K.post(0.14, 6.2, 8, 0.09), M, x, 0, z); k.add(Bc(0.1, 0.1, 3.0, 0.02), M, x, 6.2, z, { rot: [0, ra, 0] }); for (const s of [-1.4, 1.4]) { const X = x + d[0] * s, Z = z + d[1] * s; k.add(Bc(0.5, 0.14, 0.5, 0.04), '#5a5e66', X, 6.1, Z); bulb(k, Bc(0.4, 0.05, 0.4, 0.01), '#f2f4ee', c.light, X, 6.0, Z); } },
    // 8 · cột LED thông minh: cột trắng mảnh, dải sáng dọc thân, vòng sáng trên đỉnh, mắt cảm biến
    (k, x, z, d, a, c) => { k.add(K.post(0.09, 4.4, 10), '#e8eaf0', x, 0, z); bulb(k, Bc(0.05, 3.2, 0.05, 0.01), '#c8d0e0', c.light, x + d[0] * 0.09, 2.2, z + d[1] * 0.09); bulb(k, new (THREE().TorusGeometry)(0.4, 0.05, 6, 20).rotateX(Math.PI / 2), '#d8dce8', c.light, x, 4.45, z); k.add(K.ball(0.12, 1), '#3a3a48', x, 4.5, z); k.add(Bc(0.3, 0.4, 0.04, 0.01), '#3a3a48', x - d[0] * 0.1, 1.6, z - d[1] * 0.1, { rot: [0, a, 0] }); },
    // 9 · đèn sinh học: cuống cong như cây non, bầu sáng rủ xuống, hai bầu nhỏ
    (k, x, z, d, a, c) => { const G = '#4a7a3a', ra = Math.atan2(d[0], d[1]); k.add(K.post(0.1, 2.2, 6, 0.07), G, x, 0, z); k.add(K.post(0.07, 1.2, 6, 0.05), G, x, 2.1, z, { rot: [0.5, ra, 0, 'YXZ'] }); const X = x + d[0] * 0.62, Z = z + d[1] * 0.62; bulb(k, K.ball(0.32, 1), '#d8f0c0', c.bio, X, 3.0, Z, { sc: [1, 1.25, 1] }); for (const s of [-1, 1]) bulb(k, K.ball(0.14, 0), '#d8f0c0', c.bio, x + d[1] * s * 0.3, 1.5 + s * 0.2, z - d[0] * s * 0.3); k.add(K.cone(0.36, 0.5, 6).rotateX(Math.PI), G, X, 3.55, Z); },
  ];
  const STEP = [0, 14, 13, 12, 10, 10, 9, 9, 8, 8];
  const POOL = [0, 1.0, 1.1, 1.2, 1.4, 1.5, 1.7, 1.9, 1.8, 1.6]; // bán kính vũng sáng dưới chân đèn
  const NAME = [null, 'Đuốc cắm', 'Đuốc tre', 'Đèn đá', 'Đèn dầu', 'Đèn khí', 'Đèn điện', 'Đèn cao áp', 'Cột đèn LED', 'Đèn sinh học'];
  const darkHex = (a, f) => { const x = new (THREE().Color)(a).multiplyScalar(f); return '#' + x.getHexString(); }; // màu mặt đường lúc tối
  const mixHex = (a, b, t) => { const T = THREE(), x = new T.Color(a).lerp(new T.Color(b), t); return '#' + x.getHexString(); };
  function line(k, N, lv, key, st) {
    const S = STYLE[lv]; if (!S) return 0;
    const c = { light: LIGHT[key] || LIGHT.plains, bio: BIO[key] || BIO.plains, pole: POLE[key] || POLE.plains };
    const w = (st && st.w) || 2.4, side = w / 2 + 0.5, road = darkHex((st && st.color) || '#a8a092', 0.42), glow = lv <= 3 ? FIRE : c.light, pool = [mixHex(road, glow, 0.16), mixHex(road, glow, 0.3)];
    let n = 0;
    const put = (q, s) => {
      const x = q.x + q.n[0] * side * s, z = q.z + q.n[1] * side * s, d = [-q.n[0] * s, -q.n[1] * s]; // d: hướng từ đèn ra giữa đường
      S(k, x, z, d, q.a, c);
      // vũng sáng trên mặt đường: vòng ngoài mờ, lõi trong sáng hơn một chút
      const px = x + d[0] * (side - 0.6), pz = z + d[1] * (side - 0.6);
      k.add(K.disc(POOL[lv], 16), pool[0], px, 0.14, pz, { lit: true, ao: false }); k.add(K.disc(POOL[lv] * 0.5, 12), pool[1], px, 0.15, pz, { lit: true, ao: false });
      n++;
    };
    R3().along(N.loop, STEP[lv], true).forEach((q, i) => put(q, i % 2 ? 1 : -1));
    for (const sp of N.spokes) { const pts = R3().along(sp, STEP[lv], false), last = pts.length - 1; pts.forEach((q, i) => { if (i === 0 || i >= last) return; put(q, i % 2 ? 1 : -1); }); }
    return n;
  }
  const R3 = () => BK.Roads3D;
  BK.Lamps3D = { STYLE, NAME, LIGHT, BIO, POLE, line };
})(typeof self !== 'undefined' ? self : globalThis);
