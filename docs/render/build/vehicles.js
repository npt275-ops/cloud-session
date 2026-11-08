/* Bể Kính · render/build/vehicles.js · Xe cộ của từng thời
 * Mỗi xe vẽ ở gốc toạ độ, mũi xe hướng +z. fleet(k, cấp, vòng đường, tint) tạo mỗi xe một phần chuyển động riêng và trả về
 * phần chuyển động path: render/buildings3d.js cho từng xe chạy dọc vòng đường (khép kín), đầu xe luôn quay theo hướng
 * đường đang đi, các toa tàu nối đuôi nhau theo khoảng cách.
 *   2 xe trâu · 3 người cưỡi ngựa · 4 xe ngựa kéo · 5 tàu hơi nước kéo ba toa · 6 ô tô · 7 tàu một ray trên cao và ô tô
 *   8 rô-bốt giao hàng · 9 hạt giống bay · 10 xe bay · 11 quả cầu sáng · 12 thoi ánh sáng
 * Cần: render/build/kit3d.js, plains/common.js. */
(function (root) {
  const BK = root.BK, K = BK.BuildKit, { C, B, Bc } = BK.Plains3D;
  const THREE = () => window.THREE;
  const wheel = (s, x, y, z, r) => s.add(new (THREE().CylinderGeometry)(r, r, 0.14, 10).rotateZ(Math.PI / 2), '#2a2a2a', x, y, z);
  const M = {
    ox(s, c) { s.add(B(1.2, 0.5, 1.7, 0.08), C.woodL, 0, 0.5, -0.6); for (const z of [-1.1, -0.2]) for (const x of [-0.65, 0.65]) wheel(s, x, 0.42, z, 0.42);
        s.add(K.ball(0.55, 0), c || '#6a6a6a', 0, 0.8, 1.2, { sc: [0.8, 0.8, 1.5] }); s.add(K.ball(0.3, 0), c || '#6a6a6a', 0, 1.0, 2.1); s.add(Bc(0.08, 0.08,
        1.4, 0.02), C.wood, 0, 0.8, 0.4); },
    rider(s, c) { s.add(B(0.5, 0.7, 1.4, 0.15), c || '#7a4a2a', 0, 0.95, 0); for (const z of [-0.5, 0.5]) for (const x of [-0.18, 0.18]) s.add(K.post(0.07, 1,
        4), c || '#7a4a2a', x, 0, z); s.add(B(0.35, 0.8, 0.35, 0.08), c || '#7a4a2a', 0, 1.45, 0.75, { rot: [0.5, 0, 0] }); s.add(B(0.4, 0.7, 0.3, 0.08),
        '#c94f3a', 0, 1.7, -0.1); s.add(K.ball(0.18, 0), '#e8c8a0', 0, 2.2, -0.1); },
    carriage(s, c) { M.rider(s, c); s.add(B(1.2, 0.9, 1.4, 0.08), C.woodL, 0, 0.6, -1.8); s.add(K.roof(1.3, 0.5, 1.5, 0.05, 0.2, 1.4), C.paint, 0, 1.5, -1.8); for (const x of [-0.65, 0.65]) wheel(s, x, 0.45, -1.8, 0.45); },
    loco(s) { s.add(K.post(0.55, 2.0, 10).rotateX(Math.PI / 2), '#2e2e32', 0, 1.0, 0.4); s.add(B(1.2, 1.4, 1.0, 0.06), '#2e2e32', 0, 0.4, -0.9);
        s.add(K.post(0.22, 0.9, 8), '#2e2e32', 0, 1.5, 1.0); s.add(B(1.3, 0.2, 2.6, 0.04), '#b8462e', 0, 0.25, 0); for (const z of [-0.8, 0,
        0.8]) for (const x of [-0.6, 0.6]) wheel(s, x, 0.35, z, 0.32); return { smoke: true }; },
    wagon(s, c) { s.add(B(1.2, 1.2, 2.3, 0.06), c || '#7a3a2a', 0, 0.35, 0); s.add(K.roof(1.3, 0.25, 2.4, 0.04, 1.1, 2.3), '#3a3a3e', 0, 1.55, 0); for (const z of [-0.8, 0.8]) for (const x of [-0.6, 0.6]) wheel(s, x, 0.3, z, 0.28); },
    car(s, c) { s.add(B(0.95, 0.55, 1.9, 0.15), c || '#c94f3a', 0, 0.2, 0); s.add(B(0.85, 0.45, 1.1, 0.15), '#2f4a6b', 0, 0.75, -0.1); for (const z of [-0.6, 0.6]) for (const x of [-0.48, 0.48]) wheel(s, x, 0.2, z, 0.2); s.add(Bc(0.7, 0.12, 0.04, 0.01), '#fff2c8', 0, 0.45, 0.96, { glow: true }); },
    mono(s) { s.add(B(1.3, 1.4, 3, 0.4), C.white, 0, -0.7, 0); s.add(Bc(1.32, 0.4, 2.6, 0.05), '#3f7fb8', 0, 0.2, 0); },
    bot(s) { s.add(B(0.9, 0.8, 0.9, 0.2), '#e2e0da', 0, 0.15, 0); s.add(K.ball(0.18), '#6ae0ff', 0, 1.05, 0.2, { glow: true }); for (const z of [-0.3, 0.3]) for (const x of [-0.42, 0.42]) wheel(s, x, 0.15, z, 0.14); },
    seed(s, c) { s.add(K.ball(0.6, 1), c || '#f6e6b0', 0, 0, 0); s.add(K.post(0.03, 1.6, 4), '#e8e0d0', 0, 0.4, 0); for (let i = 0; i < 6; i++) s.add(Bc(0.04, 0.6, 0.04, 0.01), '#f2f2e8', 0, 2, 0, { rot: [Math.cos(i) * 0.9, 0, Math.sin(i) * 0.9] }); },
    hover(s, c) { s.add(K.ball(1, 1), c || '#f2f2ee', 0, 0, 0, { sc: [0.9, 0.45, 1.6] }); s.add(K.ball(0.6, 1), '#2f4a6b', 0, 0.3, 0.3, { sc: [0.8, 0.5, 1] }); s.add(K.disc(0.8, 10), '#ffd27a', 0, -0.45, 0, { glow: true }); },
    orb(s) { s.add(K.ball(0.5, 1), '#e6d6ff', 0, 0, 0, { glow: true }); },
    pod(s, c) { s.add(new (THREE().OctahedronGeometry)(0.6, 0), c || '#b8f0ff', 0, 0, 0, { glow: true, sc: [0.6, 0.6, 1.8] }); },
  };
  // đội xe của một thời: [kiểu, màu, độ cao, khoảng cách theo sau xe trước (toa tàu), nhóm]
  const FLEET = [null, [],
    [['ox', '#6a6a6a'], ['ox', '#7a5a3a']],
    [['rider', '#7a4a2a'], ['rider', '#3a2a20'], ['rider', '#c8b8a0']],
    [['carriage', '#7a4a2a'], ['carriage', '#c8b8a0'], ['carriage', '#3a2a20']],
    [['loco'], ['wagon', '#7a3a2a', 0, 2.9], ['wagon', '#2f4a6b', 0, 2.6], ['wagon', '#7a3a2a', 0, 2.6]],
    [['car', '#c94f3a'], ['car', '#3f7fb8'], ['car', '#e0b23a'], ['car', '#e2e0da'], ['car', '#3f8a5a']],
    [['mono', null, 5.1], ['mono', null, 5.1, 3.2], ['mono', null, 5.1, 3.2], ['car', '#e2e0da'], ['car', '#3f7fb8'], ['car', '#c94f3a']],
    [['bot'], ['bot'], ['bot'], ['bot'], ['car', '#363a48']],
    [['seed', '#f6e6b0', 5], ['seed', '#d8f0c0', 6.2], ['seed', '#f6e6b0', 4.4], ['seed', '#d8f0c0', 5.6], ['seed', '#f6e6b0', 6.6], ['seed', '#d8f0c0', 5]],
    [['hover', '#f2f2ee', 3.2], ['hover', '#ffb04a', 3.6], ['hover', '#e6d6b8', 3.0], ['hover', '#f2f2ee', 3.4]],
    [['orb', null, 7], ['orb', null, 6.4], ['orb', null, 7.6], ['orb', null, 6.8], ['orb', null, 7.2]],
    [['pod', '#b8f0ff', 2.5], ['pod', '#e6d6ff', 2.8], ['pod', '#b8f0ff', 2.2], ['pod', '#e6d6ff', 2.6]]];
  const SPEED = [0, 0, 1.3, 2.2, 2.0, 3.0, 4.0, 4.6, 1.8, 1.0, 5.0, 3.0, 6.0];
  // tạo đội xe trên vòng đường loop ([[x, z], ...] khép kín). Xe cách đều nhau trên vòng; toa (khoảng cách > 0) bám xe trước
  function fleet(k, lv, loop) {
    const list = FLEET[lv] || [], path = [];
    let L = 0; for (let i = 0; i < loop.length; i++) { const a = loop[i], b = loop[(i + 1) % loop.length]; L += Math.hypot(b[0] - a[0], b[1] - a[1]); }
    const heads = list.filter((x) => !x[3]).length || 1; let h = 0, off = 0, head = null;
    list.forEach(([kind, col, y0, gap], i) => {
      const y = (y0 || 0) < 1 ? (y0 || 0) + 0.07 : y0; // xe chạy trên mặt đường (mặt đường cao 0,13, render/build/roads.js Y); xe bay giữ độ cao
      const name = 'veh' + i, s = k.sub(name, [0, y || 0, 0]); M[kind](s, col);
      if (gap) off -= gap; else { off = (h * L) / heads; h++; head = name; }
      path.push([name, SPEED[lv], off, y || 0, gap ? head : null, (y || 0) > 2]); // [tên, tốc độ, quãng lệch, độ cao, đầu xe nó bám (toa), bay trên cao]
    });
    return path.length ? { loop: loop.map((p) => p.slice()), path } : null;
  }
  BK.Vehicles3D = { M, FLEET, fleet };
})(typeof self !== 'undefined' ? self : globalThis);
