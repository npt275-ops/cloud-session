/* Bể Kính · render/build/plains/town.js · Làng lớn dần qua các thời (Lúa Vàng)
 * Một lớp chung cho cả làng ở mỗi thời: đường (vòng đường giữa hai vòng nhà và các đường toả ra), hàng rào, tường thành,
 * đường ray, đèn đường, cây hai bên đường, và xe cộ của thời đó chạy vòng quanh làng:
 *   1 lối mòn · 2 lối đất, lũy tre, xe trâu · 3 đường đá, tường thành có cổng, xe ngựa · 4 phố lát đá, đèn dầu, xe ngựa kéo
 *   5 đường ray vòng, tàu hơi nước · 6 đường nhựa, cây xanh, ô tô · 7 đường lớn, tàu một ray trên cao · 8 đường sáng, rô-bốt
 *   giao hàng, drone · 9 lối dây leo phát sáng, hạt giống bay · 10 đường vàng, xe bay · 11 sàn nổi, cầu sáng · 12 vòng sáng
 * Tường của mỗi thời chạy sát mép đảo (theo dáng mép thật, ngắt ở chỗ núi, hồ, sông; o.land từ render/build/place3d.js), có
 * cổng ở đầu các đường toả ra. Món 'town' đặt ở giữa làng, solo (chỉ thay món town của thời trước).
 * P.TOWN.addTo(E, cấp, tint) thêm lớp này vào bố cục của một thời (các đảo khác dùng lại). Tệp này chạy sau e01..e12.
 * Cần: common.js. */
(function (root) {
  const BK = root.BK, P = BK.Plains3D, K = BK.BuildKit, { C, pick, B, Bc } = P;
  const THREE = () => window.THREE;
  const RR = 23.8;                                   // vòng đường giữa vòng nhà trong (20) và vòng nhà ngoài (27,5)
  const SPOKES = [0, Math.PI, 0.6, -0.6, 2.75, -2.75]; // đường toả ra ở các khe không có nhà (0 là phía trước)
  const ringG = (r, w, seg) => new (THREE().RingGeometry)(r - w / 2, r + w / 2, seg || 72).rotateX(-Math.PI / 2);
  // vòng đường và các đường toả ra (từ sân làng ra vòng ngoài)
  function roads(k, o) {
    const w = o.w || 2.2, y = o.y || 0.06;
    k.add(ringG(RR, w), o.color, 0, y, 0, { ao: false });
    for (const a of SPOKES) { const r0 = o.r0 || 13, r1 = o.land ? Math.max(30, o.land.edge(a) - 4) : o.r1 || 33, m = (r0 + r1) / 2; k.add(Bc(w * 0.9, 0.05, r1 - r0, 0.01), o.color, Math.sin(a) * m, y, Math.cos(a) * m, { rot: [0, a, 0], ao: false }); }
    if (o.line) { k.add(ringG(RR, 0.12, 72), o.line, 0, y + 0.02, 0, { ao: false }); }
  }
  // tường sát mép đảo: mỗi đoạn (seg) đặt theo mép thật, chỗ nào vướng núi, hồ, sông thì để trống; cổng (gate) ở đầu đường toả ra
  function edgeWall(k, o, st) {
    const L = o.land; if (!L) return;
    const n = st.n || 120, inset = st.inset || 3.5;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2, R = L.edge(a) - inset, x = Math.sin(a) * R, z = Math.cos(a) * R;
      if (SPOKES.some((s) => Math.abs(Math.atan2(Math.sin(a - s), Math.cos(a - s))) < 0.05)) continue; // chừa lối ra cổng
      if (L.free(x, z, 0.8)) st.seg(k, a, x, z, i);
    }
    if (st.gate) for (const a of SPOKES) { const R = L.edge(a) - inset, x = Math.sin(a) * R, z = Math.cos(a) * R; if (L.free(x, z, 1.5)) st.gate(k, a, x, z); }
  }
  const gateTowers = (h, col, cap, capH) => (k, a, x, z) => { for (const d of [-2.4, 2.4]) { const gx = x + Math.cos(a) * d, gz = z - Math.sin(a) * d; k.add(K.post(1.1, h, 8), col, gx, 0, gz); if (cap) k.add(K.cone(1.4, capH || 2.2, 8), cap, gx, h, gz); } };
  // các thứ đặt dọc vòng đường, tránh chỗ đường toả ra; fn(góc, x, z)
  function alongRing(r, n, fn, skip) { for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; if (skip !== false && SPOKES.some((s) => Math.abs(Math.atan2(Math.sin(a - s), Math.cos(a - s))) < 0.12)) continue; fn(a, Math.sin(a) * r, Math.cos(a) * r); } }
  // xe chạy vòng: một phần quay quanh tâm làng, xe đặt ở bán kính vòng đường, mặt xe theo chiều chạy
  function traffic(k, name, y, cars) { const s = k.sub(name, [0, y || 0, 0]); cars.forEach((draw, i) => { const a = (i / cars.length) * Math.PI * 2; draw(s, Math.sin(a) * RR, Math.cos(a) * RR, a); }); return s; }
  const rotAt = (a) => [0, a + Math.PI / 2, 0]; // mặt xe hướng theo tiếp tuyến của vòng

  const T = [];
  // 1 · lối mòn giữa các lều
  T[1] = (k, o) => {
    roads(k, { color: '#b49a70', w: 1.4, land: o.land });
    edgeWall(k, o, { n: 90, seg: (k, a, x, z, i) => { k.add(K.ball(0.8, 0), i % 2 ? '#6a8a40' : '#7a9a48', x, 0.5, z, { sc: [1.4, 0.8, 1] }); if (i % 3 === 0) k.add(K.post(0.08, 1.6, 4), C.woodL, x, 0, z); } });
  };
  // 2 · lối đất, lũy tre bao quanh làng, xe trâu
  T[2] = (k, o) => {
    roads(k, { color: '#b8a074', w: 1.8, land: o.land });
    edgeWall(k, o, { n: 110, seg: (k, a, x, z) => { for (let j = 0; j < 3; j++) k.add(K.post(0.09, 4.5 + ((j + Math.round(a * 10)) % 3) * 0.8, 4), j % 2 ? '#7fa54a' : '#6a9440', x + Math.cos(a) * j * 0.3, 0, z - Math.sin(a) * j * 0.3, { rot: [(j - 1) * 0.12, 0, (j - 1) * 0.1] }); k.add(K.ball(0.9, 0), '#7fb050', x, 4.8, z, { sc: [1, 1.6, 1] }); } });
    traffic(k, 'cart', 0, [cart('#6a6a6a'), cart('#7a5a3a')]);
    return { spin: [['cart', 'y', -0.05]] };
  };
  function cart(ox) { return (s, x, z, a) => { const r = rotAt(a); s.add(B(1.6, 0.5, 1.1, 0.06), C.woodL, x, 0.5, z, { rot: r }); for (const d of [-0.6, 0.6]) s.add(new (THREE().CylinderGeometry)(0.45, 0.45, 0.12, 10).rotateZ(Math.PI / 2), C.wood, x + Math.cos(a) * d, 0.45, z - Math.sin(a) * d, { rot: [0, a, 0] }); s.add(K.ball(0.55, 0), ox, x + Math.sin(a + Math.PI / 2) * 1.8, 0.75, z + Math.cos(a + Math.PI / 2) * 1.8, { sc: [0.8, 0.8, 1.4], rot: r }); }; }
  // 3 · đường đá, tường thành có răng cưa và bốn cổng tháp, xe ngựa
  T[3] = (k, o) => {
    roads(k, { color: '#a39a8a', w: 2.2, land: o.land });
    edgeWall(k, o, { n: 130, seg: (k, a, x, z, i) => { k.add(B(3.1, 2.8, 1.0, 0.08), C.stone[i % 3], x, 0, z, { rot: [0, a, 0] }); if (i % 2) k.add(B(0.9, 0.7, 1.0, 0.05), C.stone[2], x, 2.8, z, { rot: [0, a, 0] }); if (i % 13 === 0) { k.add(K.post(1.0, 4.4, 8), C.stone[0], x, 0, z); k.add(K.cone(1.3, 2, 8), C.tile, x, 4.4, z); } }, gate: gateTowers(5.2, C.stone[0], C.tile) });
    traffic(k, 'horse', 0, [horse('#7a4a2a'), horse('#3a2a20')]);
    return { spin: [['horse', 'y', -0.07]] };
  };
  function horse(col) { return (s, x, z, a) => { const r = rotAt(a), f = (d) => [x + Math.sin(a + Math.PI / 2) * d, z + Math.cos(a + Math.PI / 2) * d]; const [hx, hz] = f(0); s.add(B(1.4, 0.7, 0.5, 0.15), col, hx, 1, hz, { rot: r }); for (const d of [-0.5, 0.5]) for (const e of [-0.18, 0.18]) { const [lx, lz] = f(d); s.add(K.post(0.07, 1, 4), col, lx + Math.cos(a) * e, 0, lz - Math.sin(a) * e); } const [nx, nz] = f(0.85); s.add(B(0.35, 0.8, 0.35, 0.08), col, nx, 1.4, nz, { rot: [0, a + Math.PI / 2, 0.5] }); const [cx, cz] = f(-1.6); s.add(B(1.4, 0.9, 1.2, 0.08), C.woodL, cx, 0.6, cz, { rot: r }); s.add(K.roof(1.5, 0.5, 1.3, 0.05, 1.4, 0.2), C.paint, cx, 1.5, cz, { rot: r }); }; }
  // 4 · phố lát đá có vỉa, đèn dầu dọc đường (sáng về đêm), xe ngựa kéo
  T[4] = (k, o) => {
    roads(k, { color: '#a8a092', w: 2.6, land: o.land });
    edgeWall(k, o, { n: 130, seg: (k, a, x, z, i) => { k.add(B(3.1, 2.2, 1.2, 0.1), C.brick[i % 3], x, 0, z, { rot: [0, a, 0] }); k.add(B(3.2, 0.3, 1.4, 0.05), C.stone[2], x, 2.2, z, { rot: [0, a, 0] }); if (i % 16 === 0) { k.add(B(3, 3.4, 3, 0.15), C.brick[2], x, 0, z, { rot: [0, a, 0] }); k.add(K.post(0.2, 1.8, 6).rotateX(Math.PI / 2), '#3a3a3e', x, 3, z, { rot: [0, a + Math.PI / 2, 0] }); } }, gate: gateTowers(4.4, C.brick[1], C.tileD, 1.6) }); k.add(ringG(RR - 1.5, 0.3), C.stone[2], 0, 0.1, 0, { ao: false }); k.add(ringG(RR + 1.5, 0.3), C.stone[2], 0, 0.1, 0, { ao: false });
    alongRing(RR + 1.9, 16, (a, x, z) => { k.add(K.post(0.06, 2.6, 5), '#3a3a3e', x, 0, z); k.add(B(0.34, 0.42, 0.34, 0.04), '#3a3a3e', x, 2.6, z); k.add(B(0.24, 0.3, 0.24, 0.02), '#ffd27a', x, 2.66, z, { glow: true }); });
    traffic(k, 'horse', 0, [horse('#7a4a2a'), horse('#c8b8a0'), horse('#3a2a20')]);
    return { spin: [['horse', 'y', -0.08]] };
  };
  // 5 · đường ray vòng (tà vẹt, hai ray), tàu hơi nước kéo toa; đường đá toả ra
  T[5] = (k, o) => {
    roads(k, { color: '#9a9488', w: 2.0, r0: 14, land: o.land });
    edgeWall(k, o, { n: 140, seg: (k, a, x, z, i) => { if (i % 4 === 0) k.add(B(0.7, 2.2, 0.7, 0.06), C.brick[1], x, 0, z); else { k.add(Bc(2.6, 0.08, 0.08, 0.02), '#2e2e32', x, 1.7, z, { rot: [0, a, 0] }); for (let j = -2; j <= 2; j++) k.add(K.post(0.03, 1.8, 3), '#2e2e32', x + Math.cos(a) * j * 0.5, 0, z - Math.sin(a) * j * 0.5); } }, gate: gateTowers(3.2, C.brick[0], '#3a3a3e', 1) });
    alongRing(RR, 110, (a, x, z) => k.add(Bc(0.25, 0.08, 1.8, 0.01), '#5a4636', x, 0.1, z, { rot: [0, a + Math.PI / 2, 0], ao: false }), false);
    for (const d of [-0.55, 0.55]) k.add(ringG(RR + d, 0.1, 96), '#6a6a70', 0, 0.18, 0, { ao: false });
    traffic(k, 'train', 0, [(s, x, z, a) => { const pts = [0, -0.26, -0.52, -0.78]; pts.forEach((da, j) => { const b = a + da, px = Math.sin(b) * RR, pz = Math.cos(b) * RR, r = rotAt(b); if (j === 0) { s.add(K.post(0.55, 2.2, 10).rotateZ(Math.PI / 2), '#2e2e32', px, 1.0, pz, { rot: [0, b, 0] }); s.add(B(1.0, 1.4, 1.2, 0.06), '#2e2e32', px - Math.cos(b) * 0, 0.4, pz, { rot: r }); s.add(K.post(0.22, 1, 8), '#2e2e32', px, 1.5, pz); s.add(B(0.9, 0.2, 1.3, 0.04), '#b8462e', px, 0.25, pz, { rot: r }); } else { s.add(B(2.4, 1.3, 1.2, 0.06), j % 2 ? '#7a3a2a' : '#2f4a6b', px, 0.35, pz, { rot: r }); s.add(K.roof(2.5, 0.25, 1.3, 0.04, 2.4, 1.1), '#3a3a3e', px, 1.65, pz, { rot: r }); } }); }]);
    return { spin: [['train', 'y', -0.12]] };
  };
  // 6 · đường nhựa có vạch, cây xanh hai bên, ô tô chạy vòng
  T[6] = (k, o) => {
    roads(k, { color: '#4a4a50', w: 3, line: '#f2f2ee', r0: 14, land: o.land });
    edgeWall(k, o, { n: 130, inset: 2.6, seg: (k, a, x, z, i) => { k.add(B(3.1, 1.0, 1.6, 0.1), C.concrete[i % 3], x, 0, z, { rot: [0, a, 0] }); if (i % 6 === 0) { k.add(K.post(0.06, 3.2, 5), '#5a5a60', x, 1, z); k.add(B(0.6, 0.15, 0.3, 0.03), '#fff2c8', x, 4.2, z, { glow: true }); } } });
    alongRing(RR + 2.2, 26, (a, x, z) => { k.add(K.post(0.12, 1.4, 5), '#6b5038', x, 0, z); k.add(K.ball(0.9, 1), pick(['#4f8a3f', '#5a9646'], a), x, 2.1, z); });
    traffic(k, 'cars', 0, ['#c94f3a', '#3f7fb8', '#e0b23a', '#e2e0da', '#3f8a5a'].map(car));
    return { spin: [['cars', 'y', -0.16]] };
  };
  function car(col) { return (s, x, z, a) => { const r = rotAt(a); s.add(B(1.9, 0.55, 0.95, 0.15), col, x, 0.2, z, { rot: r }); s.add(B(1.1, 0.45, 0.85, 0.15), '#2f4a6b', x, 0.75, z, { rot: r }); for (const d of [-0.6, 0.6]) for (const e of [-0.48, 0.48]) s.add(new (THREE().CylinderGeometry)(0.2, 0.2, 0.14, 8).rotateX(Math.PI / 2), '#2a2a2a', x + Math.sin(a + Math.PI / 2) * d + Math.cos(a + Math.PI / 2) * e, 0.2, z + Math.cos(a + Math.PI / 2) * d - Math.sin(a + Math.PI / 2) * e, { rot: [0, a + Math.PI / 2, 0] }); }; }
  // 7 · đường lớn hai làn, tàu một ray trên cao (cột đỡ, dầm vòng), toa tàu chạy
  T[7] = (k, o) => {
    roads(k, { color: '#3e3e44', w: 3.6, line: '#f2d24a', r0: 14, land: o.land });
    edgeWall(k, o, { n: 120, seg: (k, a, x, z, i) => { k.add(B(3.1, 3.2, 0.8, 0.3), C.white, x, 0, z, { rot: [0, a, 0] }); k.add(Bc(3.12, 0.15, 0.82, 0.03), '#3f7fb8', x, 2.6, z, { rot: [0, a, 0] }); }, gate: (k, a, x, z) => { k.add(K.post(1.6, 3, 10), C.white, x, 0, z); k.add(K.ball(1.6, 1), '#e2e0da', x, 3, z, { sc: [1, 0.8, 1] }); } });
    alongRing(RR, 18, (a, x, z) => k.add(K.post(0.35, 5, 8), C.concrete[1], x, 0, z), false);
    k.add(ringG(RR, 1.2, 96), C.concrete[2], 0, 5, 0); k.add(ringG(RR, 1.2, 96).rotateX(Math.PI), C.concrete[0], 0, 4.7, 0);
    traffic(k, 'mono', 5.1, [0, 1].map(() => (s, x, z, a) => { for (let j = 0; j < 3; j++) { const b = a - j * 0.13, px = Math.sin(b) * RR, pz = Math.cos(b) * RR; s.add(B(3, 1.4, 1.3, 0.4), C.white, px, 0, pz, { rot: rotAt(b) }); s.add(Bc(2.6, 0.4, 1.32, 0.05), '#3f7fb8', px, 0.9, pz, { rot: rotAt(b) }); } }));
    return { spin: [['mono', 'y', -0.2]] };
  };
  // 8 · đường sáng (vạch xanh phát sáng), rô-bốt giao hàng chạy dưới, drone bay vòng trên cao
  T[8] = (k, o) => {
    roads(k, { color: '#2e3450', w: 3, r0: 14, land: o.land });
    edgeWall(k, o, { n: 120, seg: (k, a, x, z, i) => { if (i % 3 === 0) k.add(K.post(0.18, 3.4, 6), '#363a48', x, 0, z); k.add(Bc(3.1, 0.12, 0.06, 0.02), '#6ae0ff', x, 1.2 + (i % 2) * 1.4, z, { rot: [0, a, 0], glow: true }); } }); k.add(ringG(RR, 0.18, 96), '#6ae0ff', 0, 0.1, 0, { glow: true, ao: false });
    traffic(k, 'bots', 0, [0, 1, 2, 3].map(() => (s, x, z, a) => { s.add(B(0.9, 0.8, 0.9, 0.2), '#e2e0da', x, 0.15, z, { rot: rotAt(a) }); s.add(K.ball(0.18), '#6ae0ff', x, 1.05, z, { glow: true }); }));
    traffic(k, 'drones', 9, [0, 1, 2, 3, 4, 5].map(() => (s, x, z, a) => { s.add(B(0.9, 0.2, 0.9, 0.08), '#363a48', x * 1.2, 0, z * 1.2); s.add(K.ball(0.14), '#ff4a8a', x * 1.2, 0.25, z * 1.2, { glow: true }); }));
    return { spin: [['bots', 'y', -0.1], ['drones', 'y', 0.25]] };
  };
  // 9 · lối dây leo phát sáng, hạt giống bay lơ lửng quanh làng
  T[9] = (k, o) => {
    roads(k, { color: '#7fbf6a', w: 2.4, land: o.land });
    edgeWall(k, o, { n: 110, seg: (k, a, x, z, i) => { k.add(K.ball(1.3, 1), i % 2 ? '#5a9646' : '#6aa850', x, 1.1, z, { sc: [1.3, 1, 0.8] }); if (i % 3 === 0) k.add(K.ball(0.3), i % 2 ? '#f29ab8' : '#c8f07a', x, 2.2, z, { glow: true }); } }); k.add(ringG(RR, 0.25, 96), '#c8f07a', 0, 0.1, 0, { glow: true, ao: false });
    alongRing(RR + 2, 24, (a, x, z) => { k.add(K.post(0.1, 1.6, 5, 0.04), '#5a9646', x, 0, z, { rot: [0.2, a, 0] }); k.add(K.ball(0.35), '#f29ab8', x, 1.7, z, { glow: true }); });
    traffic(k, 'seeds', 5, [0, 1, 2, 3, 4, 5, 6].map((i) => (s, x, z) => { s.add(K.ball(0.6, 1), i % 2 ? '#f6e6b0' : '#d8f0c0', x, (i % 3) * 1.2, z); s.add(K.post(0.03, 1.6, 4), '#e8e0d0', x, (i % 3) * 1.2 + 0.4, z); }));
    return { spin: [['seeds', 'y', 0.06]], pulse: true };
  };
  // 10 · đường vàng, xe bay lướt vòng
  T[10] = (k, o) => {
    roads(k, { color: '#d8c890', w: 3, r0: 14, land: o.land });
    edgeWall(k, o, { n: 110, seg: (k, a, x, z, i) => { k.add(K.post(0.1, 2.4, 5), '#d6c8a0', x, 0, z); k.add(Bc(3, 1.6, 0.08, 0.02), i % 2 ? '#e8b84a' : '#f2c46a', x, 2.6, z, { rot: [-0.5, a, 0] }); } }); k.add(ringG(RR, 0.2, 96), '#ffd27a', 0, 0.1, 0, { glow: true, ao: false });
    traffic(k, 'hover', 3.2, ['#f2f2ee', '#ffb04a', '#e6d6b8', '#f2f2ee'].map((col) => (s, x, z, a) => { s.add(K.ball(1, 1), col, x, 0, z, { sc: [1.6, 0.45, 0.9], rot: rotAt(a) }); s.add(K.disc(0.8, 10), '#ffd27a', x, -0.45, z, { glow: true }); }));
    return { spin: [['hover', 'y', -0.22]], pulse: true };
  };
  // 11 · sàn nổi quanh làng nối bằng cầu sáng, quả cầu ánh sáng quay quanh
  T[11] = (k, o) => {
    roads(k, { color: '#5a5a7a', w: 2.4, land: o.land });
    edgeWall(k, o, { n: 100, seg: (k, a, x, z, i) => { if (i % 2 === 0) { k.add(new (THREE().OctahedronGeometry)(0.6, 0), '#7a7a98', x, 3 + (i % 3) * 0.6, z, { sc: [0.7, 1.5, 0.7] }); k.add(K.post(0.04, 3, 3), '#c8a8ff', x, 0, z, { glow: true }); } else k.add(Bc(3.2, 0.1, 0.05, 0.02), '#c8a8ff', x, 2.2, z, { rot: [0, a, 0], glow: true }); } });
    alongRing(RR, 8, (a, x, z) => { k.add(K.post(2, 0.5, 8), '#6a6a88', x, 4, z); k.add(K.lathe([[0.001, -2], [2, -0.1], [2, 0]], 8), '#5a5a7a', x, 4, z); k.add(K.post(0.08, 4, 4), '#c8a8ff', x, 0, z, { glow: true }); }, false);
    k.add(ringG(RR, 0.25, 96), '#c8a8ff', 0, 4.4, 0, { glow: true, ao: false });
    traffic(k, 'orbs', 7, [0, 1, 2, 3, 4].map(() => (s, x, z) => s.add(K.ball(0.5, 1), '#e6d6ff', x, 0, z, { glow: true })));
    return { spin: [['orbs', 'y', 0.18]], pulse: true };
  };
  // 12 · ba vòng sáng tầng tầng lơ lửng trên làng, đường ánh sáng
  T[12] = (k, o) => {
    roads(k, { color: '#cfc8e0', w: 2.6, land: o.land });
    edgeWall(k, o, { n: 120, seg: (k, a, x, z, i) => { k.add(K.post(0.07, 4 + (i % 4) * 1.2, 4, 0.02), i % 2 ? '#b8f0ff' : '#e6d6ff', x, 0, z, { glow: true }); } }); k.add(ringG(RR, 0.3, 96), '#b8f0ff', 0, 0.1, 0, { glow: true, ao: false });
    const s1 = k.sub('halo1', [0, 9, 0]); s1.add(ringG(RR, 0.5, 96), '#e6d6ff', 0, 0, 0, { glow: true });
    const s2 = k.sub('halo2', [0, 13, 0]); s2.add(ringG(RR * 0.7, 0.4, 72), '#b8f0ff', 0, 0, 0, { glow: true }); for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; s2.add(K.cone(0.6, 1.8, 5), '#c8a8ff', Math.sin(a) * RR * 0.7, -0.9, Math.cos(a) * RR * 0.7, { glow: true }); }
    return { bob: [['halo1', 0.5, 0.3], ['halo2', 0.7, 0.25]], spin: [['halo2', 'y', 0.1]], pulse: true };
  };

  const NAME = [null, 'Lối mòn', 'Lối đất và lũy tre', 'Đường đá và tường thành', 'Phố lát đá', 'Đường ray vòng', 'Đường nhựa', 'Tàu một ray', 'Đường sáng', 'Lối dây leo', 'Đường vàng', 'Sàn nổi', 'Vòng sáng'];
  // thêm lớp đường, tường, xe của một thời vào bố cục (dựng ngay sau nhà chính)
  function addTo(E, lv, tint) {
    const at = Math.max(1, E.pieces.findIndex((x) => x.kind === 'hall') + 1);
    E.pieces.splice(at, 0, { kind: 'town', x: 0, z: 0, slot: 'town', solo: true, clear: 0.1, clearRing: [RR, 2.2, SPOKES], town: true, tint: tint || null });
    E.BUILD.town = T[lv]; E.NAME.town = NAME[lv];
  }
  for (let lv = 1; lv <= 12; lv++) if (P.ERA[lv]) addTo(P.ERA[lv], lv);
  P.TOWN = { RR, SPOKES, BUILD: T, NAME, addTo };
})(typeof self !== 'undefined' ? self : globalThis);
