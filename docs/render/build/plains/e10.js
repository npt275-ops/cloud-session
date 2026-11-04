/* Bể Kính · render/build/plains/e10.js · Cấp 10, Mặt Trời Nhân Tạo (Lúa Vàng) · thời vượt người
 * Thắp một mặt trời trong vòm kính: Tháp Lơ Lửng (nhà chính, các tầng đĩa trôi lơ lửng không trụ), mặt trời nhỏ treo trên
 * làng, nhà trôi lơ lửng có quầng sáng phía dưới, cột dẫn nắng, ruộng lúa vàng óng. */
(function (root) {
  const BK = root.BK, P = BK.Plains3D, K = BK.BuildKit, { C, pick, B, Bc, ring, homes, COMMON } = P;
  const SUN = '#ffd27a', WARM = '#ffe9b0';
  function hall(k) {
    k.add(K.lathe([[5, 0], [5, 0.4], [3.6, 0.8]], 12), '#e8dcc0', 0, 0, 0);
    k.add(K.post(3.2, 0.1, 14, 3.2), SUN, 0, 0.82, 0, { glow: true });
    const out = { bob: [] };
    for (let i = 0; i < 4; i++) {
      const t = k.sub('tier' + i, [0, 4 + i * 4, 0]), r = 4.6 - i * 0.8;
      t.add(K.lathe([[0.4, -0.8], [r, -0.2], [r, 0.3], [r * 0.85, 0.6], [0.001, 0.7]], 12), pick(['#f2e8d0', '#e8dcc0', '#fff4dc'], i * 0.3), 0, 0, 0);
      t.add(new (window.THREE.TorusGeometry)(r + 0.05, 0.08, 3, 24), SUN, 0, 0.05, 0, { rot: [Math.PI / 2, 0, 0], glow: true });
      out.bob.push(['tier' + i, 0.25, 0.5 + i * 0.13]);
    }
    return out;
  }
  function sun(k) { const s = k.sub('sun', [0, 26, 0]); s.add(K.ball(2.6, 1), '#fff2c0', 0, 0, 0, { glow: true }); s.add(K.ball(3.6, 1), SUN, 0, 0, 0, { glow: true, sc: [1, 1, 1] }); return { bob: [['sun', 0.6, 0.25]], pulse: true }; }
  function floatHouse(k, o) {
    const h = k.sub('h', [0, 2.6 + (o.v % 3) * 1.2, 0]), c = pick(['#f6efe0', '#ece0c4', '#fff8e8'], o.v * 0.3);
    h.add(K.lathe([[0.4, -1.2], [2.0, -0.4], [2.4, 0], [2.4, 1.8], [1.8, 2.8], [0.001, 3.1]], 10), c, 0, 0, 0);
    h.add(K.post(1.2, 0.08, 10, 1.2), WARM, 0, -1.25, 0, { glow: true });
    h.add(Bc(1.0, 1.4, 0.2, 0.08), '#5a4a3a', 0, 0.8, 2.3, { ao: false }); h.add(Bc(2.4, 0.3, 0.2, 0.05), SUN, 0, 1.9, 2.25, { glow: true });
    k.add(K.disc(1.6, 10), '#d8c890', 0, 0.02, 0, { ao: false });
    return { bob: [['h', 0.3, 0.6 + (o.v % 4) * 0.1]] };
  }
  function pylon(k) { k.add(K.post(0.3, 6, 6, 0.1), '#e8dcc0', 0, 0, 0); k.add(K.ball(0.4), SUN, 0, 6.2, 0, { glow: true }); }
  const F = [0, 6];
  P.ERA[10] = {
    yard: { x: 0, z: 2, r: 22, color: '#e2d6b4' },
    pieces: [
      { kind: 'hall', x: 0, z: -8, clear: 8 }, { kind: 'sun', x: 0, z: 4, clear: 0 },
      ...homes('floatHouse'),
      ...[[-5, 9], [5, 9], [-9, 15], [9, 15]].map(([x, z]) => ({ kind: 'pylon', x, z, clear: 0.6 })),
      { kind: 'field', x: -17, z: 15, w: 9, d: 6, fence: false, clear: 6 }, { kind: 'field', x: 17, z: 15, w: 9, d: 6, fence: false, clear: 6 },
    ],
    BUILD: { hall, sun, floatHouse, pylon, field: COMMON.field },
    NAME: { hall: 'Tháp Lơ Lửng', sun: 'Mặt trời nhân tạo', floatHouse: 'Nhà lơ lửng', pylon: 'Cột dẫn nắng', field: 'Ruộng lúa' },
  };
})(typeof self !== 'undefined' ? self : globalThis);
