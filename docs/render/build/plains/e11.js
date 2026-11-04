/* Bể Kính · render/build/plains/e11.js · Cấp 11, Bẻ Cong Không Gian (Lúa Vàng) · thời vượt người
 * Gấp không gian để đi xuyên qua nó: Cổng Trung Tâm (nhà chính, vòng cổng khổng lồ, lòng cổng xoáy sáng), nhà gấp khúc
 * (các tầng xoay lệch nhau), cổng nhỏ nối các nhà, mảnh không gian trôi quanh. */
(function (root) {
  const BK = root.BK, P = BK.Plains3D, K = BK.BuildKit, { C, pick, B, Bc, ring, homes, COMMON } = P;
  const VIO = '#b48cff', MAG = '#ff6ad8', CY = '#7ff0ff';
  const torus = (R, t, s) => new (window.THREE.TorusGeometry)(R, t, 6, s || 28);
  function hall(k) {
    k.add(K.lathe([[6, 0], [6, 0.5], [4.5, 1.0]], 12), '#3a3a5a', 0, 0, 0);
    for (const sx of [-1, 1]) k.add(B(1.4, 3, 1.6, 0.2), '#4a4a6a', sx * 5.6, 0, 0);
    k.add(torus(6.2, 0.7), '#5a5a7a', 0, 7.2, 0);
    const p = k.sub('portal', [0, 7.2, 0]);
    p.add(new (window.THREE.CircleGeometry)(5.4, 24), VIO, 0, 0, 0, { glow: true }); p.add(new (window.THREE.CircleGeometry)(3.4, 20), MAG, 0, 0, 0.05, { glow: true }); p.add(new (window.THREE.CircleGeometry)(1.6, 16), CY, 0, 0, 0.1, { glow: true });
    for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; p.add(Bc(0.5, 2.4, 0.06, 0.02), '#e8d8ff', Math.cos(a) * 3, Math.sin(a) * 3, 0.15, { rot: [0, 0, a], glow: true }); }
    return { spin: [['portal', 'z', 0.8]] };
  }
  function folded(k, o) {
    const n = 4 + (o.v % 3), c = pick(['#d8d0ee', '#c8c0e0', '#e8e0f6'], o.v * 0.3);
    for (let i = 0; i < n; i++) { const y = i * 1.9, rot = (i * 0.45 + o.v) % (Math.PI * 2); k.add(B(3.4 - i * 0.2, 1.8, 3.0 - i * 0.15, 0.2), c, Math.sin(i) * 0.4, y, Math.cos(i) * 0.3, { rot: [0, rot, 0] }); k.add(Bc(1.4, 0.6, 3.1, 0.04), VIO, Math.sin(i) * 0.4, y + 0.9, Math.cos(i) * 0.3, { rot: [0, rot, 0], glow: true }); k.add(Bc(0.7, 0.6, 0.06, 0.02), '#ffe9ff', Math.sin(i) * 0.4, y + 0.9, Math.cos(i) * 0.3 + 1.55 - i * 0.08, { rot: [0, rot, 0], lit: true }); }
    k.add(torus(0.9, 0.12, 14), MAG, 0, 1.1, 1.75, { glow: true }); // cửa cổng nhỏ
    const s = k.sub('orb', [0, n * 1.9 + 1, 0]); s.add(new (window.THREE.OctahedronGeometry)(0.6, 0), pick([VIO, CY, MAG], o.v * 0.4), 0, 0, 0, { glow: true });
    return { spin: [['orb', 'y', 1.2]] };
  }
  function miniPortal(k) { k.add(torus(1.3, 0.18, 18), '#5a5a7a', 0, 1.6, 0); const p = k.sub('p', [0, 1.6, 0]); p.add(new (window.THREE.CircleGeometry)(1.15, 16), MAG, 0, 0, 0, { glow: true }); return { spin: [['p', 'z', 1.6]] }; }
  function shard(k, o) { const s = k.sub('s', [0, 3 + (o.v % 3), 0]); s.add(new (window.THREE.OctahedronGeometry)(0.8, 0), pick([VIO, CY, MAG], o.v * 0.3), 0, 0, 0, { glow: true, sc: [0.6, 1.4, 0.6] }); return { spin: [['s', 'y', 0.9]], bob: [['s', 0.5, 0.7]] }; }
  const F = [0, 6];
  P.ERA[11] = {
    yard: { x: 0, z: 2, r: 22, color: '#6a6a88' },
    pieces: [
      { kind: 'hall', x: 0, z: -8, clear: 8 },
      ...homes('folded'),
      ...[[-6, 10], [6, 10], [0, 16]].map(([x, z]) => ({ kind: 'miniPortal', x, z, face: 'front', clear: 1.6 })),
      ...[[-10, 4], [10, 4], [-13, 18], [13, 18], [-3, 20], [3, 20]].map(([x, z], i) => ({ kind: 'shard', x, z, v: i, clear: 0 })),
    ],
    BUILD: { hall, folded, miniPortal, shard },
    NAME: { hall: 'Cổng Trung Tâm', folded: 'Nhà gấp khúc', miniPortal: 'Cổng nhỏ', shard: 'Mảnh không gian' },
  };
})(typeof self !== 'undefined' ? self : globalThis);
