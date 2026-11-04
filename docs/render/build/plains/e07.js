/* Bể Kính · render/build/plains/e07.js · Cấp 7, Tên lửa (Lúa Vàng)
 * Tên lửa, vệ tinh, điện hạt nhân: Tháp Điều Hành (nhà chính, trụ tròn cao có đài quan sát), bệ phóng có giàn và
 * tên lửa, chảo vệ tinh (quay chậm), nhà máy điện hạt nhân (hai tháp làm mát, lò tròn), tháp chung cư cao,
 * đường nhựa, nhà kính lúa. */
(function (root) {
  const BK = root.BK, P = BK.Plains3D, K = BK.BuildKit, { C, pick, B, Bc, ring, homes, archHome, COMMON } = P;
  const PAL = { a: '#eef0f2', b: '#3f7fb8', c: '#7fb2cc', d: '#2a3440', g: '#ff5a4f', w: '#fff0c8' }; // màu của nhà nhỏ, toà dáng lạ mượn từ bộ kiểu chung
  const T = () => window.THREE;

  function hall(k) {
    k.add(K.lathe([[6, 0], [6, 0.6], [4.6, 0.8], [4.6, 3.2], [3.2, 3.4]], 12), C.concrete[1], 0, 0, 0);
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; k.add(Bc(1.6, 1.6, 0.1, 0.02), C.glass, Math.sin(a) * 4.62, 2.0, Math.cos(a) * 4.62, { rot: [0, a, 0], ao: false }); }
    k.add(K.post(1.6, 13, 10, 1.3), C.white, 0, 3.4, 0);
    k.add(K.lathe([[1.4, 0], [3.4, 0.6], [3.6, 1.8], [3.0, 2.4], [1.2, 2.6]], 12), C.concrete[2], 0, 16, 0);
    k.add(K.lathe([[3.45, 0.7], [3.5, 1.7]], 12), '#5aa8d8', 0, 16, 0, { ao: false });
    k.add(K.post(0.08, 4, 4), C.steel, 0, 18.6, 0); k.add(K.ball(0.2), '#ff5a4f', 0, 22.6, 0, { glow: true });
    k.add(B(2.4, 2.6, 0.2, 0.04), C.glass, 0, 0.8, 4.6, { ao: false });
  }
  // bệ phóng: nền bê tông, giàn thép, tên lửa trắng có sọc và bốn cánh
  function pad(k) {
    k.add(B(9, 0.8, 9, 0.1), C.concrete[1], 0, 0, 0); k.add(B(3, 0.4, 3, 0.06), '#5a5e64', 0, 0.8, 0);
    for (const [x, z] of [[-2.6, -1.4], [-2.6, 1.4], [-4.4, -1.4], [-4.4, 1.4]]) k.add(K.post(0.14, 16, 4), '#c8503a', x, 0.8, z);
    for (let i = 0; i < 6; i++) k.add(B(2.2, 0.16, 3.0, 0.03), '#c8503a', -3.5, 2 + i * 2.6, 0);
    for (let i = 0; i < 3; i++) k.add(B(1.6, 0.14, 0.14, 0.03), '#c8503a', -1.9, 5 + i * 4, 0);
    k.add(K.post(0.9, 12, 10, 0.9), C.white, 0, 1.2, 0); k.add(K.cone(0.9, 3, 10), C.white, 0, 13.2, 0);
    for (const y of [4, 10]) k.add(K.post(0.92, 0.6, 10, 0.92), '#2a2e34', 0, y, 0);
    for (let i = 0; i < 4; i++) { const a = (i * Math.PI) / 2; k.add(Bc(0.12, 2.2, 1.4, 0.03), '#c8302a', Math.sin(a) * 1.1, 2.2, Math.cos(a) * 1.1, { rot: [0, a, 0] }); }
  }
  // chảo vệ tinh trên chân đế, quay chậm
  function dish(k) {
    k.add(B(2.4, 0.4, 2.4, 0.05), C.concrete[1], 0, 0, 0); k.add(K.post(0.3, 3.2, 8), C.steel, 0, 0.4, 0);
    const d = k.sub('dish', [0, 3.8, 0]);
    d.add(K.lathe([[0.001, 0], [1.2, 0.25], [2.4, 0.9], [2.5, 1.0]], 12), C.white, 0, 0, 0, { rot: [-0.7, 0, 0] });
    d.add(K.post(0.05, 1.6, 4), C.steel, 0, 0.3, 0.4, { rot: [-0.7, 0, 0] });
    return { spin: [['dish', 'y', 0.15]] };
  }
  // nhà máy điện hạt nhân: hai tháp làm mát hình eo, lò tròn mái vòm
  function nuclear(k) {
    for (const x of [-4.5, 4.5]) k.add(K.lathe([[3.6, 0], [3.0, 3], [2.3, 7], [2.5, 9], [2.8, 10]], 12), '#e2e0da', x, 0, -1);
    k.add(K.lathe([[2.4, 0], [2.4, 3], [2.0, 4.3], [1.0, 5.2], [0.001, 5.4]], 12), C.white, 0, 0, 3);
    k.add(B(5, 2.2, 3, 0.06), C.concrete[1], 0, 0, 6);
  }
  function tower(k, o) {
    const n = 7 + (o.v % 4), wall = pick(['#e8eaee', '#d8dee6', '#eef0f2'], o.v * 0.3);
    k.add(B(4, n * 1.6, 4, 0.12), wall, 0, 0, 0);
    for (let f = 0; f < n; f++) for (const s of [0, 1, 2, 3]) { const a = (s * Math.PI) / 2; if ((f + s + o.v) % 3) k.add(Bc(3.4, 0.48, 0.04, 0.01), '#fff0c8', Math.sin(a) * 2.06, 0.9 + f * 1.6, Math.cos(a) * 2.06, { rot: [0, a, 0], lit: true }); k.add(Bc(4.02, 0.6, 0.08, 0.02), C.glass, Math.sin(a) * 2.0, 0.9 + f * 1.6, Math.cos(a) * 2.0, { rot: [0, a, 0], ao: false }); }
    k.add(K.post(0.08, 2, 4), C.steel, 1.2, n * 1.6, 1.2); k.add(K.ball(0.12), '#ff5a4f', 1.2, n * 1.6 + 2, 1.2, { glow: true });
  }
  function asphalt(k, o) { const d = o.d || 30, w = o.w || 5; k.add(B(w, 0.05, d, 0.02), '#44464a', 0, 0, 0, { ao: false }); for (let i = 0; i < Math.floor(d / 3); i++) k.add(B(0.18, 0.06, 1.4, 0.01), '#e8e8e0', 0, 0.01, -d / 2 + 1.5 + i * 3, { ao: false }); }

  const F = [0, 6];
  P.ERA[7] = {
    yard: { x: 0, z: 2, r: 22, color: '#9c9e9e' },
    pieces: [
      { kind: 'hall', x: 0, z: -8, clear: 8 },
      { kind: 'asphalt', x: 0, z: 10, d: 22, clear: 0 }, { kind: 'asphalt', x: 0, z: 4, d: 36, face: [30, 4], clear: 0 },
      ...homes('tower', null, { small: 'capsule', odd: 'twin' }),
      { kind: 'pad', x: 20, z: 14, clear: 7 },
      { kind: 'dish', x: -11, z: 12, clear: 3 }, { kind: 'dish', x: -15, z: 16, clear: 3 },
      { kind: 'nuclear', x: -20, z: -12, face: [0, 6], clear: 8 },
    ],
    BUILD: { capsule: archHome('capsule', PAL), twin: archHome('twin', PAL), hall, pad, dish, nuclear, tower, asphalt },
    NAME: { capsule: 'Nhà con nhộng', twin: 'Tháp đôi cầu nối', hall: 'Tháp Điều Hành', pad: 'Bệ phóng tên lửa', dish: 'Chảo vệ tinh', nuclear: 'Nhà máy điện hạt nhân', tower: 'Tháp chung cư', asphalt: 'Đường nhựa' },
  };
})(typeof self !== 'undefined' ? self : globalThis);
