/* Bể Kính · render/build/plains/e03.js · Cấp 3, Trung đại (Lúa Vàng)
 * Biết rèn sắt và dựng cối xay gió: đình làng (nhà chính, nền đá, hàng cột sơn, hai tầng mái ngói cong), nhà ba gian
 * mái rơm có hiên, kho thóc nhà sàn, giếng, cổng làng, cây đa, lò rèn, cối xay gió (cánh quay), ruộng, đống rơm.
 * Kiểu dáng theo bản mẫu đã chốt (design/cong-trinh-lang-lua.html). */
(function (root) {
  const BK = root.BK, P = BK.Plains3D, K = BK.BuildKit, { C, pick, B, Bc, ring, homes, COMMON } = P;
  const rc = (w, h, d, r, tw, td, lift) => K.roof(w, h, d, r, tw, td, lift).translate(0, -h / 2, 0); // mái, gốc ở giữa
  const torus = (R, t, a, b, arc) => new (window.THREE.TorusGeometry)(R, t, a, b, arc);

  // nhà ba gian mái rơm, có hiên cột gỗ
  function house(k, o) {
    const wall = o.v % 2 ? '#e4cfa6' : C.lime;
    k.add(Bc(5.3, 0.28, 3.8, 0.1), C.stone[0], 0, 0.14, 0.15);
    k.add(Bc(4.6, 1.95, 3.0, 0.12), wall, 0, 0.28 + 0.975, -0.05);
    k.add(Bc(1.15, 1.95, 0.1, 0.04), '#8a5a32', 0, 1.255, 1.46);
    k.add(Bc(0.92, 1.78, 0.12, 0.05), '#6b4426', 0, 1.17, 1.48);
    for (const sx of [-1, 1]) { k.add(Bc(0.78, 0.6, 0.1, 0.04), '#5a3a24', sx * 1.55, 1.45, 1.46); k.add(Bc(0.7, 0.52, 0.06, 0.02), '#ffc86a', sx * 1.55, 1.45, 1.53, { lit: true }); for (let i = -1; i <= 1; i++) k.add(Bc(0.07, 0.56, 0.12, 0.02), '#d2b07a', sx * 1.55 + i * 0.2, 1.45, 1.5, { ao: false }); }
    for (const px of [-2.2, -0.75, 0.75, 2.2]) k.add(K.post(0.1, 2.0), C.wood, px, 0.28, 1.85);
    k.add(Bc(4.9, 0.16, 0.18, 0.05), C.wood, 0, 2.28, 1.85);
    k.add(rc(6.2, 1.75, 4.7, 0.42, 3.6, 0.55), pick(C.thatch, o.v * 0.3), 0, 3.16, 0.1);
    k.add(Bc(3.8, 0.24, 0.5, 0.1), C.thatchD, 0, 4.04, 0.1);
  }
  // đình làng: nền đá có bậc, hàng cột sơn đỏ, hai tầng mái ngói cong vút, nóc có mặt trời và hai đầu đao
  function hall(k) {
    const lac = '#9a3a2a';
    k.add(Bc(10.4, 0.6, 7.2, 0.12), C.stone[0], 0, 0.3, 0);
    for (let i = 0; i < 3; i++) k.add(Bc(3.2 - i * 0.2, 0.2, 0.5, 0.05), C.stone[2], 0, 0.1 + i * 0.2, 3.85 - i * 0.25);
    k.add(Bc(7.6, 2.5, 4.4, 0.1), '#ead8b2', 0, 1.85, -0.4);
    for (const dx of [-2.4, 0, 2.4]) k.add(Bc(1.5, 2.1, 0.12, 0.04), '#7a4a2a', dx, 1.65, 1.84);
    for (let ix = 0; ix < 6; ix++) for (const cz of [2.9, -3.0]) { const cx = -4.5 + ix * 1.8; k.add(K.post(0.17, 2.7, 7), lac, cx, 0.6, cz); k.add(Bc(0.46, 0.14, 0.46, 0.04), C.stone[1], cx, 0.67, cz, { ao: false }); }
    for (const cz of [2.9, -3.0]) k.add(Bc(10.0, 0.22, 0.26, 0.06), lac, 0, 3.32, cz);
    k.add(rc(11.8, 1.25, 8.6, 0.32, 9.6, 6.6, 0.6), C.tile, 0, 4.02, 0);
    k.add(Bc(8.6, 0.7, 5.6, 0.1), '#ead8b2', 0, 4.4, 0);
    k.add(rc(9.2, 1.8, 6.0, 0.32, 4.8, 0.7, 0.55), C.tile, 0, 5.65, 0);
    k.add(Bc(5.2, 0.32, 0.42, 0.12), C.tileD, 0, 6.55, 0);
    for (const sx of [-1, 1]) k.add(torus(0.32, 0.09, 5, 10, Math.PI * 1.3), C.gold, sx * 2.75, 6.9, 0, { rot: [0, 0, sx > 0 ? 0 : Math.PI * 0.7] });
    k.add(torus(0.36, 0.07, 5, 14), C.gold, 0, 7.1, 0); k.add(K.ball(0.2, 1), C.gold, 0, 7.1, 0);
  }
  // kho thóc nhà sàn, có thang
  function granary(k) {
    for (const [px, pz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) k.add(K.post(0.11, 1.25), C.wood, px * 1.05, 0, pz * 1.05);
    k.add(Bc(2.7, 0.16, 2.7, 0.05), C.woodL, 0, 1.33, 0);
    k.add(Bc(2.2, 1.45, 2.2, 0.1), '#b88a58', 0, 2.13, 0);
    k.add(rc(3.3, 1.5, 3.3, 0.38, 0.5, 0.5), C.thatch[0], 0, 3.58, 0);
    for (const sx of [-0.28, 0.28]) k.add(Bc(0.07, 1.6, 0.07, 0.02), C.woodL, sx, 0.72, 1.75, { rot: [-0.45, 0, 0] });
  }

  // lò rèn: mái che trên bốn cột, đe sắt, lò than đỏ, ống khói gạch
  function forge(k) {
    for (const [x, z] of [[-1.6, -1.2], [1.6, -1.2], [-1.6, 1.2], [1.6, 1.2]]) k.add(K.post(0.1, 2.1), C.wood, x, 0, z);
    k.add(K.roof(4.4, 1.0, 3.4, 0.2, 3.4, 0.3), C.tile, 0, 2.1, 0);
    k.add(B(1.3, 0.8, 1.0, 0.1), C.brick[0], -0.7, 0, -0.6); k.add(B(0.9, 0.12, 0.6, 0.03), '#ff7a2a', -0.7, 0.8, -0.6, { glow: true });
    k.add(K.post(0.26, 3.6, 6, 0.22), C.brick[1], -1.0, 0, -0.9);
    k.add(B(0.6, 0.55, 0.36, 0.06), '#5a5a5e', 0.7, 0, 0.3); k.add(B(0.8, 0.16, 0.32, 0.04), '#4a4a50', 0.7, 0.55, 0.3);
    return { smoke: [[-1.0, 3.7, -0.9, 0.9]] }; // khói lò rèn
  }
  // cối xay gió: thân tháp gỗ, mũ xoay, bốn cánh quay
  function windmill(k) {
    k.add(K.lathe([[1.5, 0], [1.4, 0.5], [1.05, 4.6], [1.15, 4.7]], 8), '#d9c49a', 0, 0, 0);
    k.add(B(0.7, 1.3, 0.2, 0.04), '#6b4426', 0, 0, 1.38);
    k.add(K.roof(2.6, 1.3, 2.6, 0.2, 0.3, 0.3), C.thatch[1], 0, 4.7, 0);
    const bl = k.sub('blades', [0, 4.6, 1.45]);
    bl.add(K.ball(0.22), C.wood, 0, 0, 0);
    for (let i = 0; i < 4; i++) { const a = (i * Math.PI) / 2; bl.add(Bc(0.12, 2.6, 0.06, 0.02), C.wood, Math.sin(a) * 1.3, Math.cos(a) * 1.3, 0, { rot: [0, 0, -a], ao: false }); bl.add(Bc(0.6, 2.0, 0.03, 0.01), '#efe6d2', Math.sin(a) * 1.5 + Math.cos(a) * 0.34, Math.cos(a) * 1.5 - Math.sin(a) * 0.34, 0.03, { rot: [0, 0, -a], ao: false }); }
    return { spin: [['blades', 'z', 0.9]] };
  }

  const F = [0, 5];
  P.ERA[3] = {
    yard: { x: 0, z: 1.5, r: 15, color: '#c9b184' },
    pieces: [
      { kind: 'hall', x: 0, z: -6.5, clear: 7.5 },
      ...homes('house'),
      { kind: 'granary', x: 11.5, z: -12.5, face: F, clear: 2.8 },
      { kind: 'well', x: 3.6, z: 4.5, clear: 1.6 },
      { kind: 'banyan', x: -10.5, z: -12.5, clear: 4 },
      // (cổng làng cũ đã bỏ: cổng thành của đảo nay ở giữa mép trước, render/build/gates.js)
      { kind: 'forge', x: 14.5, z: 3, face: F, clear: 3 },
      { kind: 'windmill', x: 17, z: 13, face: 'front', clear: 3 },
      { kind: 'field', x: -15, z: 12, w: 8, d: 6, clear: 5.5 }, { kind: 'field', x: 6, z: 19, w: 8, d: 4.5, clear: 5 },
      { kind: 'hay', x: -9.5, z: 16, s: 1, clear: 1.3 }, { kind: 'hay', x: 11.5, z: 18.5, s: 0.85, clear: 1.1 },
    ],
    BUILD: { hall, house, granary, forge, windmill, well: COMMON.well, banyan: COMMON.banyan, field: COMMON.field, hay: COMMON.hay },
    NAME: { hall: 'Đình làng', house: 'Nhà ba gian', granary: 'Kho thóc', forge: 'Lò rèn', windmill: 'Cối xay gió', well: 'Giếng làng', banyan: 'Cây đa', field: 'Ruộng lúa', hay: 'Đống rơm' },
  };
})(typeof self !== 'undefined' ? self : globalThis);
