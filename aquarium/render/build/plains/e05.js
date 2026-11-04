/* Bể Kính · render/build/plains/e05.js · Cấp 5, Công nghiệp (Lúa Vàng)
 * Máy hơi nước và đường ray: Toà Thị Chính (nhà chính, hàng cột trắng, trán tường, đồng hồ, cờ), dãy nhà gạch đỏ có
 * ống khói, xưởng xay lúa mái răng cưa và ống khói cao, ga tàu với đường ray và đầu máy hơi nước, đèn khí,
 * ruộng có máy cày hơi nước. */
(function (root) {
  const BK = root.BK, P = BK.Plains3D, K = BK.BuildKit, { C, pick, B, Bc, ring, homes, archHome, COMMON } = P;
  const PAL = { a: '#b5654a', b: '#4f555c', c: '#e6d6b8', d: '#3e2c20', g: '#ffd27a', w: '#ffd89a' }; // màu của nhà nhỏ, toà dáng lạ mượn từ bộ kiểu chung
  const T = () => window.THREE;
  const win = (k, x, y, z, w, h) => { k.add(Bc(w, h, 0.08, 0.02), '#34404c', x, y, z, { ao: false }); k.add(Bc(w * 0.9, h * 0.9, 0.04, 0.01), '#ffd88a', x, y, z + 0.06, { lit: true }); k.add(Bc(w + 0.12, 0.08, 0.12, 0.02), C.white, x, y - h / 2 - 0.04, z + 0.02, { ao: false }); };

  function hall(k) {
    k.add(B(12, 0.8, 7.5, 0.1), C.stone[2], 0, 0, 0);
    for (let i = 0; i < 4; i++) k.add(B(4.5 - i * 0.3, 0.2, 0.5, 0.04), C.stone[0], 0, i * 0.2, 4.0 - i * 0.3);
    k.add(B(10.4, 5.2, 5.6, 0.1), C.brick[0], 0, 0.8, -0.6);
    for (let f = 0; f < 2; f++) for (let i = -3; i <= 3; i++) if (i) win(k, i * 1.4, 2.4 + f * 2.2, 2.22, 0.7, 1.3);
    for (let i = 0; i < 6; i++) k.add(K.post(0.26, 4.6, 8), C.white, -3.5 + i * 1.4, 0.8, 3.0);
    k.add(B(8.6, 0.5, 1.8, 0.06), C.white, 0, 5.4, 2.6);
    k.add(K.roof(9.0, 1.4, 1.9, 0.1, 0.2, 1.9), C.white, 0, 5.9, 2.6);
    k.add(K.roof(10.8, 1.2, 6.0, 0.15, 9.8, 1.0), '#5a6068', 0, 6.0, -0.6);
    k.add(new (T().CylinderGeometry)(0.7, 0.7, 0.1, 14).rotateX(Math.PI / 2), C.white, 0, 6.5, 3.6, { ao: false }); k.add(Bc(0.07, 0.5, 0.05, 0.01), C.dark, 0, 6.65, 3.66, { ao: false });
    k.add(K.post(0.05, 3.5, 4), '#4a4a50', 0, 7.2, -0.6); k.add(Bc(1.2, 0.7, 0.03, 0.01), '#d8b04a', 0.62, 10.2, -0.6, { ao: false });
  }
  // dãy ba nhà gạch đỏ liền nhau, mỗi nhà một ống khói
  function row(k, o) {
    for (let i = -1; i <= 1; i++) {
      const x = i * 2.4, wall = pick(C.brick, o.v * 0.3 + i * 0.2);
      k.add(B(2.4, 4.4, 3.4, 0.05), wall, x, 0, 0);
      k.add(B(0.8, 1.8, 0.1, 0.02), '#3e2c20', x - 0.5, 0, 1.72); win(k, x + 0.55, 1.4, 1.72, 0.6, 0.9); win(k, x - 0.4, 3.3, 1.72, 0.6, 0.9); win(k, x + 0.55, 3.3, 1.72, 0.6, 0.9);
      k.add(B(0.5, 1.3, 0.5, 0.03), C.brick[1], x + 0.7, 5.0, -0.8);
    }
    k.add(K.roof(7.5, 1.4, 3.8, 0.1, 7.3, 0.3), '#4f555c', 0, 4.4, 0);
    return o.v % 2 ? { smoke: [[0.7, 6.4, -0.8, 0.6]] } : null;
  }
  // xưởng xay lúa: mái răng cưa, cửa kính, ống khói gạch cao
  function factory(k) {
    k.add(B(10, 3.6, 6, 0.08), C.brick[1], 0, 0, 0);
    for (let i = 0; i < 4; i++) { const x = -3.75 + i * 2.5; k.add(K.roof(2.5, 1.6, 6.0, 0.05, 2.5, 0.05).rotateY(0), '#5a6068', x, 3.6, 0, { rot: [0, 0, 0], sc: [1, 1, 1] }); k.add(Bc(0.08, 1.4, 5.6, 0.02), C.glass, x + 1.2, 4.35, 0, { ao: false }); }
    k.add(B(2.6, 2.6, 0.12, 0.03), '#3a3a3e', 0, 0, 3.02);
    for (const x of [-3.3, 3.3]) win(k, x, 1.8, 3.02, 1.6, 1.4);
    k.add(K.post(0.6, 11, 8, 0.45), C.brick[0], 4.2, 0, -2); k.add(Bc(1.1, 0.3, 1.1, 0.05), '#5a5a5e', 4.2, 11, -2);
    return { smoke: [[4.2, 11.3, -2, 1.5]] }; // khói nhà máy
  }
  // ga tàu: sân ga, mái che, đường ray, đầu máy hơi nước
  function station(k) {
    k.add(B(12, 0.5, 3, 0.06), C.stone[1], 0, 0, -1.2);
    for (let i = 0; i < 4; i++) k.add(K.post(0.1, 2.8, 6), '#4a4a50', -4.5 + i * 3, 0.5, -1.6);
    k.add(K.roof(11, 0.6, 2.6, 0.08, 10.6, 1.6), '#4f6a5a', 0, 3.3, -1.4);
    for (let i = 0; i < 26; i++) k.add(B(0.25, 0.08, 2.0, 0.02), '#6b4a30', -12.5 + i, 0, 1.6, { ao: false });
    for (const z of [0.95, 2.25]) k.add(B(26, 0.1, 0.1, 0.02), '#7a7e84', 0, 0.08, z, { ao: false });
    const L = k.sub('train', [-4, 0.2, 1.6]);
    L.add(new (T().CylinderGeometry)(0.75, 0.75, 3.6, 10).rotateZ(Math.PI / 2), '#2e3238', 0.4, 1.2, 0);
    L.add(B(1.6, 2.3, 1.7, 0.06), '#7a2a24', -1.9, 0.3, 0); L.add(K.roof(1.9, 0.3, 1.9, 0.05, 1.8, 1.8), '#2e3238', -1.9, 2.6, 0);
    L.add(K.post(0.22, 1.1, 8, 0.3), '#2e3238', 1.6, 1.8, 0);
    for (const x of [-1.9, -0.6, 0.7, 1.8]) for (const z of [-0.65, 0.65]) L.add(new (T().CylinderGeometry)(0.38, 0.38, 0.12, 10).rotateX(Math.PI / 2), '#8a3a2a', x, 0.38, z);
    L.add(B(3.6, 0.3, 1.5, 0.04), '#3a3e44', 0.3, 0.3, 0);
    return { slide: [['train', 'x', 0.8, 7]] };
  }
  function lamp(k) { k.add(K.post(0.06, 3.2, 6), '#2f3438', 0, 0, 0); k.add(Bc(0.9, 0.06, 0.06, 0.02), '#2f3438', 0.3, 3.1, 0); k.add(B(0.32, 0.42, 0.32, 0.04), '#2f3438', 0.7, 2.6, 0); k.add(B(0.22, 0.28, 0.22, 0.02), '#ffd88a', 0.7, 2.66, 0, { glow: true }); }
  // máy cày hơi nước trên ruộng
  function tractor(k) {
    k.add(new (T().CylinderGeometry)(0.45, 0.45, 1.6, 10).rotateZ(Math.PI / 2), '#2e5a3a', 0.2, 1.0, 0); k.add(K.post(0.12, 0.8, 6), '#2e3238', 0.8, 1.4, 0);
    for (const sx of [-1, 1]) { k.add(new (T().CylinderGeometry)(0.62, 0.62, 0.25, 12).rotateX(Math.PI / 2), '#8a3a2a', -0.6, 0.62, sx * 0.75); k.add(new (T().CylinderGeometry)(0.35, 0.35, 0.2, 10).rotateX(Math.PI / 2), '#8a3a2a', 0.9, 0.35, sx * 0.6); }
    k.add(B(0.8, 0.9, 1.1, 0.05), '#6b4a30', -0.8, 0.9, 0);
  }

  const F = [0, 5];
  P.ERA[5] = {
    yard: { x: 0, z: 2, r: 19, color: '#aaa294' },
    pieces: [
      { kind: 'hall', x: 0, z: -8, clear: 8 },
      { kind: 'road', x: 0, z: 7.5, d: 16, w: 3.4, color: '#8e887c', clear: 0 },
      ...homes('row', null, { small: 'cottage' }),
      { kind: 'factory', x: -14, z: 8, face: [0, 8], clear: 6.5 },
      { kind: 'station', x: 6, z: 20, face: 'front', clear: 7 },
      { kind: 'lamp', x: -2.4, z: 4, clear: 0.5 }, { kind: 'lamp', x: 2.4, z: 4, face: [-10, 4], clear: 0.5 }, { kind: 'lamp', x: -2.4, z: 11, clear: 0.5 }, { kind: 'lamp', x: 2.4, z: 11, face: [-10, 11], clear: 0.5 },
      { kind: 'well', x: 4.2, z: 2.2, clear: 1.6 }, { kind: 'banyan', x: 12, z: -14, clear: 4 },
      // (đã bỏ ruộng lúa: sau thời trung đại Lúa Vàng không còn ruộng)
    ],
    BUILD: { cottage: archHome('timber', PAL), hall, row, factory, station, lamp, tractor, well: COMMON.well, banyan: COMMON.banyan, field: COMMON.field, road: COMMON.road },
    NAME: { cottage: 'Nhà khung gỗ', hall: 'Toà Thị Chính', row: 'Dãy nhà gạch', factory: 'Xưởng xay lúa', station: 'Ga tàu', lamp: 'Đèn khí', tractor: 'Máy cày hơi nước', well: 'Giếng', banyan: 'Cây đa', field: 'Ruộng lúa', road: 'Đường lát đá' },
  };
})(typeof self !== 'undefined' ? self : globalThis);
