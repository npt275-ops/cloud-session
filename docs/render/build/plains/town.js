/* Bể Kính · render/build/plains/town.js · Làng lớn dần qua các thời (Lúa Vàng)
 * Một lớp chung cho cả làng ở mỗi thời: mặt đường theo mạng đường riêng của đảo (render/build/roads.js), hàng rào, tường
 * thành, đường ray, cây bên lề đường, đèn đường của thời (render/build/lamps.js, thời 1-9) hoặc neon (render/build/neon.js, thời 10-12), và xe cộ của thời chạy dọc vòng đường, đầu xe theo hướng đi (vehicles.js):
 *   1 lối mòn · 2 lối đất, lũy tre, xe trâu · 3 đường đá, tường thành có cổng, xe ngựa · 4 phố lát đá, đèn dầu, xe ngựa kéo
 *   5 đường ray vòng, tàu hơi nước · 6 đường nhựa, cây xanh, ô tô · 7 đường lớn, tàu một ray trên cao · 8 đường sáng, rô-bốt
 *   giao hàng, drone · 9 lối dây leo phát sáng, hạt giống bay · 10 đường vàng, xe bay · 11 sàn nổi, cầu sáng · 12 vòng sáng
 * Từ thời 2, tường bao kín sát mép đảo (theo dáng mép thật), chỉ hở ở cổng thành chính và hai chỗ bắc cầu sang hai đảo bên
 * cạnh (o.land từ render/build/place3d.js). Món 'town' đặt ở giữa làng, solo (chỉ thay món town của thời trước).
 * P.TOWN.addTo(E, cấp, tint) thêm lớp này vào bố cục của một thời (các đảo khác dùng lại). Tệp này chạy sau e01..e12.
 * Cần: common.js. */
(function (root) {
  const BK = root.BK, P = BK.Plains3D, K = BK.BuildKit, { C, pick, B, Bc } = P;
  const THREE = () => window.THREE;
  const R3 = () => BK.Roads3D, V3 = () => BK.Vehicles3D;
  const RR = 24;                                     // bán kính vòng đường của Lúa Vàng (để cũ tham chiếu)
  const SPOKES = [0, Math.PI, 0.6, -0.6];           // các góc có cổng trên tường (đầu đường toả ra)
  // mạng đường của đảo (render/build/roads.js): vẽ mặt đường theo kiểu của thời (st), dựng đèn đường của thời bên lề
  // (render/build/lamps.js, thời 1 tới 9) hoặc lớp neon trên đường (render/build/neon.js, thời 10 tới 12); trả lại mạng để đặt cây, xe
  function roads(k, o, st) {
    const key = o.net || 'plains', N = R3().net(key, o.land ? o.land.edge : null); R3().draw(k, N, st);
    if (BK.Neon3D && BK.Neon3D.on(o.lv)) BK.Neon3D.street(k, N, o.lv, key, st.w || 2.4); else if (BK.Lamps3D) BK.Lamps3D.line(k, N, o.lv, key, st);
    return N;
  }
  // đèn, cây… dọc vòng đường, đứng bên lề (lệch ra theo pháp tuyến), không đứng giữa đường
  function beside(N, step, side, fn) { for (const q of R3().along(N.loop, step, true)) fn(q.a, q.x + q.n[0] * side, q.z + q.n[1] * side, q); }
  // xe của thời chạy theo vòng đường (render/build/vehicles.js); gộp với phần chuyển động khác của lớp làng
  function withTraffic(k, lv, N, anim) { const F = V3().fleet(k, lv, N.loop); return Object.assign(anim || {}, F || {}); }
  // tường bao kín sát mép đảo (từ thời 2), chỉ hở ba chỗ: cổng thành chính giữa mép trước (góc 0) và hai chỗ sau này bắc cầu
  // sang hai đảo bên cạnh (o.land.gaps, render/buildings3d.js tính từ L.landing). Tường chạy liền qua cả chỗ núi, hồ, sông;
  // hai đầu mỗi lỗ hở có trụ (gateEnd). Mỗi đoạn (seg) đặt theo mép thật của đảo.
  function edgeWall(k, o, st) {
    const L = o.land; if (!L) return;
    const n = st.n || 120, inset = st.inset || 3.5, gaps = L.gaps || [0], half = (a) => (a === gaps[0] ? 0.13 : 0.085);
    const gapAt = (a) => gaps.some((g) => Math.abs(Math.atan2(Math.sin(a - g), Math.cos(a - g))) < half(g));
    for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; if (gapAt(a)) continue; const R = L.edge(a) - inset; st.seg(k, a, Math.sin(a) * R, Math.cos(a) * R, i); }
    // trụ hai đầu chỗ hở cầu (cổng chính có cổng thành riêng, render/build/gates.js)
    if (st.gate) for (const g of gaps.slice(1)) for (const s of [-1, 1]) { const a = g + s * (half(g) + 0.01), R = L.edge(a) - inset; st.gate(k, a, Math.sin(a) * R, Math.cos(a) * R); }
  }
  const gateTowers = (h, col, cap, capH) => (k, a, x, z) => { k.add(K.post(1.1, h, 8), col, x, 0, z); if (cap) k.add(K.cone(1.4, capH || 2.2, 8), cap, x, h, z); }; // trụ một đầu chỗ hở
  const T = [];
  // 1 · lối mòn giữa các lều (thời đồ đá chưa có tường)
  T[1] = (k, o) => { roads(k, o, { color: '#b49a70', w: 1.4 }); };

  // 2 · lối đất, lũy tre bao quanh làng, xe trâu
  T[2] = (k, o) => {
    const N = roads(k, o, { color: '#b8a074', w: 1.8 });
    edgeWall(k, o, { n: 110, seg: (k, a, x, z) => { for (let j = 0; j < 3; j++) k.add(K.post(0.09, 4.5 + ((j + Math.round(a * 10)) % 3) * 0.8, 4), j % 2 ? '#7fa54a' : '#6a9440', x + Math.cos(a) * j * 0.3, 0, z - Math.sin(a) * j * 0.3, { rot: [(j - 1) * 0.12, 0, (j - 1) * 0.1] }); k.add(K.ball(0.9, 0), '#7fb050', x, 4.8, z, { sc: [1, 1.6, 1] }); } });
    return withTraffic(k, 2, N);
  };
  // 3 · đường đá, tường thành có răng cưa và bốn cổng tháp, xe ngựa
  T[3] = (k, o) => {
    const N = roads(k, o, { color: '#a39a8a', w: 2.2 });
    edgeWall(k, o, { n: 130, seg: (k, a, x, z, i) => { k.add(B(3.1, 2.8, 1.0, 0.08), C.stone[i % 3], x, 0, z, { rot: [0, a, 0] }); if (i % 2) k.add(B(0.9, 0.7, 1.0, 0.05), C.stone[2], x, 2.8, z, { rot: [0, a, 0] }); if (i % 13 === 0) { k.add(K.post(1.0, 4.4, 8), C.stone[0], x, 0, z); k.add(K.cone(1.3, 2, 8), C.tile, x, 4.4, z); } }, gate: gateTowers(5.2, C.stone[0], C.tile) });
    return withTraffic(k, 3, N);
  };
  // 4 · phố lát đá có vỉa, xe ngựa kéo (đèn dầu dọc đường: render/build/lamps.js)
  T[4] = (k, o) => {
    const N = roads(k, o, { color: '#a8a092', w: 2.6 });
    edgeWall(k, o, { n: 130, seg: (k, a, x, z, i) => { k.add(B(3.1, 2.2, 1.2, 0.1), C.brick[i % 3], x, 0, z, { rot: [0, a, 0] }); k.add(B(3.2, 0.3, 1.4, 0.05), C.stone[2], x, 2.2, z, { rot: [0, a, 0] }); if (i % 16 === 0) { k.add(B(3, 3.4, 3, 0.15), C.brick[2], x, 0, z, { rot: [0, a, 0] }); k.add(K.post(0.2, 1.8, 6).rotateX(Math.PI / 2), '#3a3a3e', x, 3, z, { rot: [0, a + Math.PI / 2, 0] }); } }, gate: gateTowers(4.4, C.brick[1], C.tileD, 1.6) });
    return withTraffic(k, 4, N);
  };
  // 5 · đường ray vòng (tà vẹt, hai ray), tàu hơi nước kéo toa; đường đá toả ra
  T[5] = (k, o) => {
    const N = roads(k, o, { color: '#9a9488', w: 2.0, r0: 14 });
    edgeWall(k, o, { n: 140, seg: (k, a, x, z, i) => { if (i % 4 === 0) k.add(B(0.7, 2.2, 0.7, 0.06), C.brick[1], x, 0, z); else { k.add(Bc(2.6, 0.08, 0.08, 0.02), '#2e2e32', x, 1.7, z, { rot: [0, a, 0] }); for (let j = -2; j <= 2; j++) k.add(K.post(0.03, 1.8, 3), '#2e2e32', x + Math.cos(a) * j * 0.5, 0, z - Math.sin(a) * j * 0.5); } }, gate: gateTowers(3.2, C.brick[0], '#3a3a3e', 1) });
    for (const q of R3().along(N.loop, 0.7, true)) { k.add(Bc(1.8, 0.08, 0.25, 0.01), '#5a4636', q.x, 0.1, q.z, { rot: [0, q.a, 0], ao: false }); for (const d of [-0.55, 0.55]) k.add(Bc(0.1, 0.08, 0.75, 0.01), '#6a6a70', q.x + q.n[0] * d, 0.18, q.z + q.n[1] * d, { rot: [0, q.a, 0], ao: false }); }
    return withTraffic(k, 5, N);
  };
  // 6 · đường nhựa có vạch, cây xanh hai bên, ô tô chạy vòng
  T[6] = (k, o) => {
    const N = roads(k, o, { color: '#4a4a50', w: 3, line: '#f2f2ee', r0: 14 });
    edgeWall(k, o, { n: 130, inset: 2.6, seg: (k, a, x, z, i) => { k.add(B(3.1, 1.0, 1.6, 0.1), C.concrete[i % 3], x, 0, z, { rot: [0, a, 0] }); if (i % 6 === 0) { k.add(K.post(0.06, 3.2, 5), '#5a5a60', x, 1, z); k.add(B(0.6, 0.15, 0.3, 0.03), '#e8e6dc', x, 4.2, z); k.add(B(0.64, 0.17, 0.34, 0.03), '#fff2c8', x, 4.19, z, { lit: true }); } } });
    beside(N, 6, 3.4, (a, x, z) => { k.add(K.post(0.12, 1.4, 5), '#6b5038', x, 0, z); k.add(K.ball(0.9, 1), pick(['#4f8a3f', '#5a9646'], a), x, 2.1, z); });
    return withTraffic(k, 6, N);
  };
  // 7 · đường lớn hai làn, tàu một ray trên cao (cột đỡ, dầm vòng), toa tàu chạy
  T[7] = (k, o) => {
    const N = roads(k, o, { color: '#3e3e44', w: 3.6, line: '#f2d24a', r0: 14 });
    edgeWall(k, o, { n: 120, seg: (k, a, x, z, i) => { k.add(B(3.1, 3.2, 0.8, 0.3), C.white, x, 0, z, { rot: [0, a, 0] }); k.add(Bc(3.12, 0.15, 0.82, 0.03), '#3f7fb8', x, 2.6, z, { rot: [0, a, 0] }); }, gate: (k, a, x, z) => { k.add(K.post(1.6, 3, 10), C.white, x, 0, z); k.add(K.ball(1.6, 1), '#e2e0da', x, 3, z, { sc: [1, 0.8, 1] }); } });
    for (const q of R3().along(N.loop, 8, true)) k.add(K.post(0.35, 4.7, 8), C.concrete[1], q.x, 0, q.z);
    for (const q of R3().along(N.loop, 1.5, true)) k.add(Bc(1.2, 0.35, 1.7, 0.04), C.concrete[2], q.x, 4.8, q.z, { rot: [0, q.a, 0] });
    return withTraffic(k, 7, N);
  };
  // 8 · đường sáng (vạch xanh phát sáng), rô-bốt giao hàng chạy dưới, drone bay vòng trên cao
  T[8] = (k, o) => {
    const N = roads(k, o, { color: '#2e3450', w: 3, glow: '#6ae0ff' });
    edgeWall(k, o, { n: 120, seg: (k, a, x, z, i) => { if (i % 3 === 0) k.add(K.post(0.18, 3.4, 6), '#363a48', x, 0, z); k.add(Bc(3.1, 0.12, 0.06, 0.02), '#6ae0ff', x, 1.2 + (i % 2) * 1.4, z, { rot: [0, a, 0], glow: true }); } });
    const d = k.sub('drones', [0, 9, 0]); for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; d.add(B(0.9, 0.2, 0.9, 0.08), '#363a48', Math.sin(a) * 28, 0, Math.cos(a) * 28); d.add(K.ball(0.14), '#ff4a8a', Math.sin(a) * 28, 0.25, Math.cos(a) * 28, { glow: true }); }
    return withTraffic(k, 8, N, { spin: [['drones', 'y', 0.25]] });
  };
  // 9 · lối dây leo phát sáng, hạt giống bay lơ lửng quanh làng (đèn sinh học: render/build/lamps.js)
  T[9] = (k, o) => {
    const N = roads(k, o, { color: '#7fbf6a', w: 2.4, glow: '#c8f07a' });
    edgeWall(k, o, { n: 110, seg: (k, a, x, z, i) => { k.add(K.ball(1.3, 1), i % 2 ? '#5a9646' : '#6aa850', x, 1.1, z, { sc: [1.3, 1, 0.8] }); if (i % 3 === 0) k.add(K.ball(0.3), i % 2 ? '#f29ab8' : '#c8f07a', x, 2.2, z, { glow: true }); } });
    return withTraffic(k, 9, N, { pulse: true });
  };
  // 10 · đường vàng, xe bay lướt vòng
  T[10] = (k, o) => {
    const N = roads(k, o, { color: '#d8c890', w: 3, glow: '#ffd27a' });
    edgeWall(k, o, { n: 110, seg: (k, a, x, z, i) => { k.add(K.post(0.1, 2.4, 5), '#d6c8a0', x, 0, z); k.add(Bc(3, 1.6, 0.08, 0.02), i % 2 ? '#e8b84a' : '#f2c46a', x, 2.6, z, { rot: [-0.5, a, 0] }); } });
    return withTraffic(k, 10, N, { pulse: true });
  };
  // 11 · sàn nổi quanh làng nối bằng cầu sáng, quả cầu ánh sáng quay quanh
  T[11] = (k, o) => {
    const N = roads(k, o, { color: '#5a5a7a', w: 2.4 });
    edgeWall(k, o, { n: 100, seg: (k, a, x, z, i) => { if (i % 2 === 0) { k.add(new (THREE().OctahedronGeometry)(0.6, 0), '#7a7a98', x, 3 + (i % 3) * 0.6, z, { sc: [0.7, 1.5, 0.7] }); k.add(K.post(0.04, 3, 3), '#c8a8ff', x, 0, z, { glow: true }); } else k.add(Bc(3.2, 0.1, 0.05, 0.02), '#c8a8ff', x, 2.2, z, { rot: [0, a, 0], glow: true }); } });
    beside(N, 14, 4.5, (a, x, z) => { k.add(K.post(2, 0.5, 8), '#6a6a88', x, 4, z); k.add(K.lathe([[0.001, -2], [2, -0.1], [2, 0]], 8), '#5a5a7a', x, 4, z); k.add(K.post(0.08, 4, 4), '#c8a8ff', x, 0, z, { glow: true }); });
    return withTraffic(k, 11, N, { pulse: true });
  };
  // 12 · ba vòng sáng tầng tầng lơ lửng trên làng, đường ánh sáng
  T[12] = (k, o) => {
    const N = roads(k, o, { color: '#cfc8e0', w: 2.6, glow: '#b8f0ff' });
    edgeWall(k, o, { n: 120, seg: (k, a, x, z, i) => { k.add(K.post(0.07, 4 + (i % 4) * 1.2, 4, 0.02), i % 2 ? '#b8f0ff' : '#e6d6ff', x, 0, z, { glow: true }); } });
    const s1 = k.sub('halo1', [0, 11, 0]); for (const q of R3().along(N.loop, 1.4, true)) s1.add(Bc(0.5, 0.12, 1.5, 0.02), '#e6d6ff', q.x, 0, q.z, { rot: [0, q.a, 0], glow: true });
    return withTraffic(k, 12, N, { bob: [['halo1', 0.5, 0.3]], pulse: true });
  };

  const NAME = [null, 'Lối mòn', 'Lối đất và lũy tre', 'Đường đá và tường thành', 'Phố lát đá', 'Đường ray vòng', 'Đường nhựa', 'Tàu một ray', 'Đường sáng', 'Lối dây leo', 'Đường vàng', 'Sàn nổi', 'Vòng sáng'];
  // thêm lớp đường, tường, xe của một thời vào bố cục (dựng ngay sau nhà chính)
  const OLD_ROADS = new Set(['road', 'asphalt', 'glowRoad']);
  function addTo(E, lv, tint, net) {
    E.pieces = E.pieces.filter((x) => !OLD_ROADS.has(x.kind)); // đường riêng của bố cục cũ: nay mạng đường của đảo lo
    const at = Math.max(1, E.pieces.findIndex((x) => x.kind === 'hall') + 1);
    E.pieces.splice(at, 0, { kind: 'town', x: 0, z: 0, slot: 'town', solo: true, clear: 0.1, net: net || 'plains', roadW: 3, town: true, tint: tint || null });
    E.BUILD.town = T[lv]; E.NAME.town = NAME[lv];
  }
  for (let lv = 1; lv <= 12; lv++) if (P.ERA[lv]) addTo(P.ERA[lv], lv);
  P.TOWN = { RR, SPOKES, BUILD: T, NAME, addTo };
})(typeof self !== 'undefined' ? self : globalThis);
