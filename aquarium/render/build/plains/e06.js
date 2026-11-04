/* Bể Kính · render/build/plains/e06.js · Cấp 6, Hiện đại (Lúa Vàng)
 * Điện, máy tính, tuabin gió: Trung Tâm Hành Chính (nhà chính, bê tông và kính, cột cờ), khu chung cư nhiều tầng,
 * trường học, siêu thị, tuabin gió (cánh quay), cột điện, đường nhựa có vạch, xe hơi, nhà kính trồng lúa. */
(function (root) {
  const BK = root.BK, P = BK.Plains3D, K = BK.BuildKit, { C, pick, B, Bc, ring, homes, COMMON } = P;
  const band = (k, w, d, y, z0) => { k.add(Bc(w + 0.02, 0.7, d + 0.02, 0.02), C.glass, 0, y, z0 || 0, { ao: false }); };

  function hall(k) {
    k.add(B(13, 0.6, 8, 0.08), C.concrete[1], 0, 0, 0);
    for (let i = 0; i < 3; i++) k.add(B(6 - i * 0.4, 0.2, 0.6, 0.03), C.concrete[2], 0, i * 0.2, 4.3 - i * 0.3);
    k.add(B(11, 6, 6, 0.1), C.concrete[0], 0, 0.6, -0.5);
    for (let f = 0; f < 3; f++) band(k, 11, 6, 1.9 + f * 1.9, -0.5);
    k.add(B(5, 3, 0.2, 0.04), C.glass, 0, 0.6, 2.55, { ao: false }); k.add(B(5.6, 0.3, 1.8, 0.05), C.concrete[2], 0, 3.6, 2.7);
    k.add(B(11.4, 0.4, 6.4, 0.06), C.concrete[2], 0, 6.6, -0.5);
    k.add(K.post(0.06, 7, 5), '#c8ccd0', 5.6, 0.6, 3.5); k.add(Bc(1.6, 1.0, 0.03, 0.01), '#c8302a', 6.45, 7.0, 3.5, { ao: false }); k.add(K.ball(0.14), '#e8c24a', 6.4, 7.0, 3.52, { ao: false });
  }
  // chung cư: nhiều tầng, dải cửa kính, ban công, máy lạnh, mái phẳng có bồn nước
  function flats(k, o) {
    const n = 4 + (o.v % 3), w = 4.6, d = 3.6, wall = pick(C.concrete, o.v * 0.4), acc = pick(['#d98a5a', '#5a9ab8', '#8ab85a', '#c8b05a'], o.v * 0.3);
    k.add(B(w, n * 1.6, d, 0.08), wall, 0, 0, 0);
    for (let f = 0; f < n; f++) { k.add(Bc(w + 0.02, 0.62, 0.1, 0.02), C.glass, 0, 0.9 + f * 1.6, d / 2, { ao: false }); if (f) k.add(B(w * 0.6, 0.1, 0.5, 0.02), acc, 0, f * 1.6, d / 2 + 0.25); k.add(B(0.45, 0.35, 0.3, 0.03), C.white, w / 2 - 0.4, 1.4 + f * 1.6, d / 2 + 0.15); }
    k.add(B(1.6, 2.0, 0.1, 0.03), C.glass, -1.0, 0, d / 2 + 0.01, { ao: false });
    k.add(K.post(0.4, 0.9, 8), '#b8bcc0', 1.2, n * 1.6, -0.6);
  }
  function school(k) {
    k.add(B(10, 3.4, 4.5, 0.08), '#e8d6a8', 0, 0, 0);
    for (let i = -3; i <= 3; i++) k.add(Bc(0.9, 0.9, 0.08, 0.02), C.glass, i * 1.35, 2.0, 2.26, { ao: false });
    k.add(B(1.4, 2.0, 0.1, 0.03), '#4a6a8a', 0, 0, 2.27); k.add(B(10.4, 0.3, 4.9, 0.05), '#c8503a', 0, 3.4, 0);
    k.add(B(8, 0.04, 6, 0.02), '#7a9a5a', 0, 0, 6, { ao: false }); for (const x of [-3.2, 3.2]) { k.add(K.post(0.05, 2.4, 4), C.white, x, 0, 6); k.add(Bc(0.08, 1.0, 1.6, 0.02), C.white, x, 2.4, 6, { ao: false }); }
  }
  function shop(k) {
    k.add(B(7, 3.2, 5, 0.08), C.concrete[2], 0, 0, 0); k.add(B(6.6, 2.0, 0.1, 0.03), C.glass, 0, 0, 2.51, { ao: false });
    k.add(Bc(7.2, 0.7, 0.2, 0.04), '#e05a3a', 0, 2.7, 2.6); k.add(Bc(3.6, 0.4, 0.06, 0.01), C.white, 0, 2.7, 2.72, { ao: false });
    for (let i = 0; i < 3; i++) car(k, -2.5 + i * 2.5, 5.2, i);
  }
  function car(k, x, z, v) { const c = ['#c8302a', '#2f5a9a', '#e8e8e0', '#3a3a3e'][v % 4]; k.add(B(2.0, 0.6, 1.0, 0.12), c, x, 0.25, z); k.add(B(1.1, 0.5, 0.9, 0.12), c, x - 0.15, 0.85, z); k.add(Bc(1.12, 0.36, 0.92, 0.02), '#5a7a90', x - 0.15, 1.08, z, { ao: false }); for (const dx of [-0.65, 0.65]) for (const dz of [-0.5, 0.5]) k.add(new (window.THREE.CylinderGeometry)(0.25, 0.25, 0.14, 8).rotateX(Math.PI / 2), '#1e1e22', x + dx, 0.25, z + dz); }
  // tuabin gió: trụ trắng, cánh quay
  function turbine(k) {
    k.add(K.post(0.32, 14, 8, 0.18), C.white, 0, 0, 0); k.add(B(0.7, 0.6, 1.4, 0.15), C.white, 0, 13.8, 0);
    const r = k.sub('rotor', [0, 14.1, 0.8]);
    r.add(K.ball(0.3), C.white, 0, 0, 0);
    for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI * 2; r.add(Bc(0.32, 5.6, 0.08, 0.04), C.white, Math.sin(a) * 2.8, Math.cos(a) * 2.8, 0, { rot: [0, 0, -a], ao: false }); }
    return { spin: [['rotor', 'z', 1.1]] };
  }
  function pole(k) { k.add(K.post(0.1, 6, 6), '#8a7a6a', 0, 0, 0); k.add(Bc(2.4, 0.12, 0.12, 0.02), '#6a5a4a', 0, 5.7, 0); for (const x of [-1, 1]) k.add(Bc(0.04, 0.04, 9, 0.01), '#2a2a2a', x * 1.0, 5.5, 4.5, { rot: [0.05, 0, 0], ao: false }); }
  function greenhouse(k) {
    k.add(B(8, 0.3, 4, 0.05), C.concrete[1], 0, 0, 0);
    k.add(new (window.THREE.CylinderGeometry)(2, 2, 7.6, 10, 1, false, 0, Math.PI).rotateZ(Math.PI / 2).rotateY(Math.PI / 2).rotateX(0), '#cfe6dc', 0, 0.3, 0, { rot: [0, Math.PI / 2, 0], ao: false });
    for (let j = 0; j < 5; j++) k.add(B(7, 0.5, 0.36, 0.1), pick(C.rice, j * 0.3), 0, 0.3, -1.4 + j * 0.7);
  }
  // đường nhựa có vạch trắng
  function asphalt(k, o) { const d = o.d || 30, w = o.w || 5; k.add(B(w, 0.05, d, 0.02), '#4a4c50', 0, 0, 0, { ao: false }); for (let i = 0; i < Math.floor(d / 3); i++) k.add(B(0.18, 0.06, 1.4, 0.01), '#e8e8e0', 0, 0.01, -d / 2 + 1.5 + i * 3, { ao: false }); }

  const F = [0, 6];
  P.ERA[6] = {
    yard: { x: 0, z: 2, r: 21, color: '#a4a49c' },
    pieces: [
      { kind: 'hall', x: 0, z: -9, clear: 9 },
      { kind: 'asphalt', x: 0, z: 9, d: 22, clear: 0 }, { kind: 'asphalt', x: 0, z: 4, d: 34, face: [30, 4], clear: 0 },
      ...homes('flats'),
      { kind: 'school', x: -11, z: 11, face: [0, 9], clear: 7 }, { kind: 'shop', x: 11, z: 11, face: [0, 9], clear: 6.5 },
      { kind: 'turbine', x: -20, z: 20, clear: 3 }, { kind: 'turbine', x: 22, z: 19, clear: 3 },
      { kind: 'pole', x: -3.6, z: 15, clear: 0.6 }, { kind: 'pole', x: 3.6, z: 15, clear: 0.6 },
      { kind: 'greenhouse', x: -17, z: -6, face: [0, 6], clear: 5.5 }, { kind: 'banyan', x: 14, z: -15, clear: 4 },
    ],
    BUILD: { hall, flats, school, shop, turbine, pole, greenhouse, asphalt, banyan: COMMON.banyan },
    NAME: { hall: 'Trung Tâm Hành Chính', flats: 'Chung cư', school: 'Trường học', shop: 'Siêu thị', turbine: 'Tuabin gió', pole: 'Cột điện', greenhouse: 'Nhà kính trồng lúa', asphalt: 'Đường nhựa', banyan: 'Cây đa' },
  };
})(typeof self !== 'undefined' ? self : globalThis);
