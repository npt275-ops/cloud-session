/* Bể Kính · render/build/plains/e09.js · Cấp 9, Vật Chất Sống (Lúa Vàng) · thời vượt người
 * Vật chất sống, nhà tự mọc: Lõi San Hô (nhà chính, cây san hô khổng lồ nhiều nhánh, đầu nhánh phát sáng), nhà búp mọc
 * từ đất (vách sống, cửa tròn, dây leo), đèn nấm phát sáng, ruộng lúa mọc trên lá sen khổng lồ. */
(function (root) {
  const BK = root.BK, P = BK.Plains3D, K = BK.BuildKit, { C, pick, B, Bc, ring, COMMON } = P;
  const PINK = '#f29ab8', TEAL = '#5fd8c0', LIME = '#c8f07a';
  function hall(k) {
    k.add(K.lathe([[6, 0], [4.5, 0.8], [2.6, 2.2], [1.8, 6], [2.2, 9]], 9), '#e8a0a8', 0, 0, 0);
    const br = [[-0.6, 0.4, 7, 4.5], [0.7, -0.3, 6.5, 4], [0.2, 0.8, 8, 5], [-0.9, -0.6, 5.5, 3.5], [0.9, 0.5, 8.5, 3.8]];
    br.forEach(([rx, rz, y, h], i) => { k.add(K.post(0.9, h, 7, 0.4), ['#f0b0b8', '#e8909e', '#f6c0c4'][i % 3], 0, y, 0, { rot: [rx * 0.6, 0, rz * 0.6] }); const tx = Math.sin(rz * 0.6) * -h * 0.95, tz = Math.sin(rx * 0.6) * h * 0.95; k.add(K.ball(1.0, 1), i % 2 ? TEAL : LIME, tx, y + h * 0.85, tz, { glow: true }); });
    k.add(B(1.6, 2.2, 1.2, 0.5), '#5a2a3a', 0, 0, 4.3, { ao: false });
  }
  function bud(k, o) {
    const c = pick(['#f6c8d0', '#c8ecd8', '#f2e6b8', '#d8d0f2'], o.v * 0.3), s = 0.9 + (o.v % 3) * 0.15;
    k.add(K.lathe([[2.0 * s, 0], [2.4 * s, 1.2 * s], [2.2 * s, 2.8 * s], [1.4 * s, 4.0 * s], [0.4 * s, 4.8 * s], [0.001, 5.2 * s]], 9), c, 0, 0, 0);
    k.add(K.post(0.55, 0.12, 10, 0.55).rotateX(Math.PI / 2), '#4a3a4a', 0, 1.0, 2.35 * s, { ao: false });
    k.add(K.ball(0.45, 0), '#4a3a4a', 0, 0.9, 2.3 * s, { sc: [1, 1.6, 0.3], ao: false });
    for (const sx of [-1, 1]) k.add(K.ball(0.35, 0), TEAL, sx * 1.4 * s, 2.8 * s, 1.75 * s, { glow: true, sc: [1, 1, 0.4] });
    for (let i = 0; i < 3; i++) k.add(new (window.THREE.TorusGeometry)(2.25 * s - i * 0.3, 0.06, 3, 18), '#5a9a4a', 0, 1.6 * s + i * 1.0, 0, { rot: [Math.PI / 2 + 0.2 * (i - 1), 0, 0] });
    return o.v % 2 ? { pulse: true } : null;
  }
  function shroom(k) { k.add(K.post(0.12, 2.2, 6, 0.08), '#e8e0d0', 0, 0, 0); k.add(K.lathe([[0.001, 0], [0.9, 0.1], [0.7, 0.45], [0.001, 0.6]], 8), TEAL, 0, 2.1, 0, { glow: true }); }
  function lily(k) { k.add(K.post(4, 0.2, 14, 4), '#5a9a4a', 0, 0, 0); for (let j = 0; j < 6; j++) k.add(B(6, 0.5, 0.36, 0.12), pick(C.rice, j * 0.3), 0, 0.2, -2.2 + j * 0.8); k.add(K.ball(0.7), PINK, 3.2, 0.5, 2.2, { glow: true }); }
  const F = [0, 6];
  P.ERA[9] = {
    yard: { x: 0, z: 2, r: 22, color: '#93bf7e' },
    pieces: [
      { kind: 'hall', x: 0, z: -8, clear: 9 },
      ...ring('bud', 10, 15.5, 0.8, 2.0, F),
      ...[[-4, 8], [4, 8], [-7, 13], [7, 13], [0, 15]].map(([x, z]) => ({ kind: 'shroom', x, z, clear: 0.8 })),
      { kind: 'lily', x: -17, z: 15, clear: 5 }, { kind: 'lily', x: 17, z: 15, clear: 5 },
    ],
    BUILD: { hall, bud, shroom, lily },
    NAME: { hall: 'Lõi San Hô', bud: 'Nhà búp tự mọc', shroom: 'Đèn nấm', lily: 'Ruộng trên lá sen' },
  };
})(typeof self !== 'undefined' ? self : globalThis);
