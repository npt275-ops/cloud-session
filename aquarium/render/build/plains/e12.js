/* Bể Kính · render/build/plains/e12.js · Cấp 12, Siêu Việt (Lúa Vàng) · thời vượt người
 * Sống như ánh sáng, nghĩ chung một ý: Cột Sáng (nhà chính, cột ánh sáng cao vút trên vòng đá trắng), nhà pha lê trong
 * suốt, đốm sáng trôi, vòng đá trắng cũ như dấu vết của làng xưa. */
(function (root) {
  const BK = root.BK, P = BK.Plains3D, K = BK.BuildKit, { C, pick, B, Bc, ring, homes, COMMON } = P;
  const L1 = '#fff8e8', L2 = '#e8f4ff', L3 = '#ffe8f6';
  function hall(k) {
    k.add(K.lathe([[7, 0], [7, 0.4], [5.5, 0.7], [5.5, 1.0], [3.5, 1.2]], 14), '#f2f0ea', 0, 0, 0);
    const c = k.sub('col', [0, 0, 0]);
    c.add(K.post(1.6, 40, 10, 1.2), L1, 0, 1.2, 0, { glow: true }); c.add(K.post(2.6, 26, 10, 0.1), L2, 0, 1.2, 0, { glow: true });
    for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; k.add(B(0.6, 2.2 + (i % 3) * 0.6, 0.6, 0.15), '#f2f0ea', Math.sin(a) * 6.2, 0.4, Math.cos(a) * 6.2); }
    return { pulse: true };
  }
  // nhà pha lê: cụm ba khối pha lê màu rực (vỏ đục, lõi sáng), bệ vòng sáng, cửa sáng về đêm, một mảnh pha lê bay trên mái
  const HUE = [['#b8a0ff', '#7fe0ff'], ['#ff9ad0', '#ffe08a'], ['#7fe0c0', '#b8a0ff'], ['#ffb08a', '#ff9ad0']];
  function crystal(k, o) {
    const h = 6 + (o.v % 3) * 1.6, [c1, c2] = HUE[o.v % HUE.length], oct = (sx, sy, sz) => new (window.THREE.OctahedronGeometry)(1, 0).scale(sx, sy, sz).translate(0, sy, 0);
    k.add(K.post(2.6, 0.4, 14), '#e8e4f0', 0, 0, 0); k.add(K.post(2.62, 0.08, 14), c2, 0, 0.36, 0, { glow: true });
    k.add(oct(1.7, h / 2, 1.7), c1, 0, 0.4, 0);
    k.add(oct(0.8, h / 3, 0.8), c2, 1.6, 0.4, 0.7, { rot: [0, 0, -0.25] }); k.add(oct(0.7, h / 3.6, 0.7), c1, -1.5, 0.4, -0.4, { rot: [0.2, 0, 0.3] });
    k.add(oct(0.7, h / 2.6, 0.7), '#fff8e8', 0, 0.6, 0, { glow: true }); // lõi sáng
    k.add(Bc(0.9, 1.6, 0.06, 0.02), '#fff0ff', 0, 1.2, 1.55, { lit: true });
    const s = k.sub('shard', [0, h + 2.2, 0]); s.add(new (window.THREE.OctahedronGeometry)(0.55, 0), c2, 0, 0, 0, { glow: true, sc: [0.7, 1.4, 0.7] });
    return { bob: [['shard', 0.5, 0.4 + (o.v % 4) * 0.08]], spin: [['shard', 'y', 0.9]] };
  }
  function mote(k, o) { const s = k.sub('m', [0, 2.5 + (o.v % 4) * 1.2, 0]); s.add(K.ball(0.45, 1), pick([L1, L2, L3], o.v * 0.3), 0, 0, 0, { glow: true }); return { bob: [['m', 0.8, 0.4 + (o.v % 5) * 0.08]] }; }
  const F = [0, 6];
  P.ERA[12] = {
    yard: { x: 0, z: 2, r: 22, color: '#d6d2e0' },
    pieces: [
      { kind: 'hall', x: 0, z: -8, clear: 8 },
      ...homes('crystal'),
      ...Array.from({ length: 12 }, (_, i) => ({ kind: 'mote', x: Math.sin(i * 2.4) * (6 + (i % 4) * 3), z: 6 + Math.cos(i * 2.4) * (5 + (i % 3) * 3), v: i, clear: 0 })),
    ],
    BUILD: { hall, crystal, mote },
    NAME: { hall: 'Cột Sáng', crystal: 'Nhà pha lê', mote: 'Đốm sáng' },
  };
})(typeof self !== 'undefined' ? self : globalThis);
