/* Bể Kính · render/build/vehicles.js · Xe cộ của từng thời
 * Mỗi xe vẽ ở gốc toạ độ, mũi xe hướng +z. fleet(k, cấp, vòng đường, tint) tạo mỗi xe một phần chuyển động riêng và trả về
 * phần chuyển động path: render/buildings3d.js cho từng xe chạy dọc vòng đường (khép kín), đầu xe luôn quay theo hướng
 * đường đang đi, các toa tàu nối đuôi nhau theo khoảng cách.
 *   2 xe trâu (con trâu có chân bước) · 3 người cưỡi ngựa · 4 xe ngựa kéo · 5 tàu hơi nước kéo ba toa · 6 ô tô · 7 tàu một ray trên cao và ô tô
 *   8 rô-bốt giao hàng · 9 hạt giống bay · 10 xe bay · 11 quả cầu sáng · 12 thoi ánh sáng
 * Cần: render/build/kit3d.js, plains/common.js. */
(function (root) {
  const BK = root.BK, K = BK.BuildKit, { C, B, Bc } = BK.Plains3D;
  const THREE = () => window.THREE;
  const wheel = (s, x, y, z, r) => s.add(new (THREE().CylinderGeometry)(r, r, 0.14, 10).rotateZ(Math.PI / 2), '#2a2a2a', x, y, z);
  const M = {
    // trâu kéo xe: con trâu có thân, u vai, đầu, sừng cong, tai, đuôi và bốn chân bước được (leg: chân là phần chuyển động riêng,
    // render/build/traffic3d.js vung theo quãng đường đi); xe hai bánh lớn, càng gác lên cổ trâu, người đánh xe ngồi trước thùng
    ox(s, c, leg) { const hide = c || '#5a5550', dk = '#2a2622';
        s.add(K.ball(0.55, 0), hide, 0, 1.05, 1.3, { sc: [0.82, 0.72, 1.55] }); s.add(K.ball(0.32, 0), hide, 0, 1.38, 1.75, { sc: [0.9, 0.7, 1] });
        s.add(K.ball(0.3, 0), hide, 0, 1.2, 2.45, { sc: [0.75, 0.75, 1.15] }); s.add(K.ball(0.16, 0), '#8a7a6a', 0, 1.08, 2.75, { sc: [1.1, 0.8, 0.8] });
        for (const sx of [-1, 1]) { s.add(Bc(0.42, 0.07, 0.07, 0.02), '#e8dcc0', sx * 0.3, 1.42, 2.4, { rot: [0, 0, sx * 0.35] }); s.add(Bc(0.07, 0.07, 0.22, 0.02), '#e8dcc0', sx * 0.5, 1.5, 2.48);
          s.add(Bc(0.16, 0.06, 0.1, 0.02), hide, sx * 0.3, 1.3, 2.3); }
        s.add(Bc(0.05, 0.6, 0.05, 0.01), dk, 0, 0.95, 0.4, { rot: [0.25, 0, 0] });
        for (const [x, z, ph] of [[-0.28, 1.9, 0], [0.28, 1.9, Math.PI], [-0.28, 0.75, Math.PI], [0.28, 0.75, 0]]) leg(x, 0.92, z, 0.86, hide, ph, 0.17);
        s.add(B(1.2, 0.45, 1.5, 0.06), C.woodL, 0, 0.55, -0.9); s.add(B(1.25, 0.08, 1.55, 0.02), C.wood, 0, 1.0, -0.9);
        for (const x of [-0.5, 0.5]) s.add(Bc(0.08, 0.08, 2.4, 0.02), C.wood, x, 0.85, 0.5); s.add(Bc(1.2, 0.1, 0.1, 0.02), C.wood, 0, 1.45, 1.95);
        for (const x of [-0.7, 0.7]) wheel(s, x, 0.5, -0.9, 0.5);
        s.add(B(0.34, 0.45, 0.28, 0.06), '#6a5a48', 0, 1.08, -0.35); s.add(K.ball(0.14, 0), '#c8a07a', 0, 1.67, -0.35); s.add(K.cone(0.32, 0.18, 8), '#d8c08a', 0, 1.78, -0.35); },
    // ngựa (dùng cho người cưỡi ngựa, xe ngựa kéo): thân, cổ vươn, đầu, bờm, tai, đuôi, bốn chân thon có móng
    horse(s, c, leg, z0) { const coat = c || '#7a4a2a', dk = '#2a1c14', z = z0 || 0;
        s.add(K.ball(0.5, 0), coat, 0, 1.25, z, { sc: [0.62, 0.66, 1.45] }); s.add(Bc(0.3, 0.75, 0.36, 0.1), coat, 0, 1.65, z + 0.75, { rot: [0.55, 0, 0] });
        s.add(Bc(0.26, 0.28, 0.62, 0.08), coat, 0, 1.98, z + 1.12, { rot: [0.35, 0, 0] }); s.add(Bc(0.08, 0.5, 0.36, 0.02), dk, 0, 1.78, z + 0.68, { rot: [0.55, 0, 0] });
        for (const sx of [-1, 1]) s.add(Bc(0.05, 0.16, 0.05, 0.01), coat, sx * 0.08, 2.18, z + 0.95);
        s.add(Bc(0.08, 0.7, 0.1, 0.02), dk, 0, 1.0, z - 0.78, { rot: [0.35, 0, 0] });
        for (const [x, dz, ph] of [[-0.18, 0.5, 0], [0.18, 0.5, Math.PI], [-0.18, -0.5, Math.PI], [0.18, -0.5, 0]]) leg(x, 1.0, z + dz, 1.0, coat, ph, 0.12); },
    rider(s, c, leg) { M.horse(s, c, leg); s.add(B(0.5, 0.08, 0.6, 0.02), '#5a2a1e', 0, 1.55, -0.05);
        s.add(B(0.36, 0.55, 0.26, 0.06), '#c94f3a', 0, 1.62, -0.1); s.add(K.ball(0.15, 0), '#e8c8a0', 0, 2.36, -0.1); s.add(K.cone(0.22, 0.16, 8), '#3a2a20', 0, 2.5, -0.1);
        for (const sx of [-1, 1]) s.add(Bc(0.1, 0.5, 0.12, 0.02), '#4a3a2a', sx * 0.3, 1.45, 0.0); },
    carriage(s, c, leg) { M.horse(s, c, leg, 1.6); for (const x of [-0.42, 0.42]) s.add(Bc(0.06, 0.06, 1.6, 0.01), C.wood, x, 1.15, 0.55);
        s.add(B(1.2, 0.9, 1.5, 0.08), C.woodL, 0, 0.6, -0.6); s.add(K.roof(1.3, 0.5, 1.6, 0.05, 0.2, 1.5), C.paint, 0, 1.5, -0.6);
        s.add(B(0.3, 0.45, 0.26, 0.06), '#2f3a5a', 0, 1.5, 0.25); s.add(K.ball(0.13, 0), '#e8c8a0', 0, 2.08, 0.25);
        for (const z of [-1.1, -0.1]) for (const x of [-0.65, 0.65]) wheel(s, x, 0.45, z, 0.45); },
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
  const ROAD = new Set(['ox', 'rider', 'carriage', 'car', 'bot']); // xe chạy trên mặt đường (không phải tàu, không bay): đi khắp mạng đường
  // tạo đội xe trên vòng đường loop ([[x, z], ...] khép kín). Xe cách đều nhau trên vòng; toa (khoảng cách > 0) bám xe trước
  // spokes: các đường toả ra (render/build/roads.js net), cho xe chạy khắp mạng đường chứ không chỉ một vòng
  function fleet(k, lv, loop, spokes) {
    const list = FLEET[lv] || [], path = [];
    let L = 0; for (let i = 0; i < loop.length; i++) { const a = loop[i], b = loop[(i + 1) % loop.length]; L += Math.hypot(b[0] - a[0], b[1] - a[1]); }
    const heads = list.filter((x) => !x[3]).length || 1; let h = 0, off = 0, head = null;
    list.forEach(([kind, col, y0, gap], i) => {
      const y = (y0 || 0) < 1 ? (y0 || 0) + 0.07 : y0; // xe chạy trên mặt đường (mặt đường cao 0,13, render/build/roads.js Y); xe bay giữ độ cao
      const name = 'veh' + i, s = k.sub(name, [0, y || 0, 0]), legs = [];
      // chân con vật: mỗi chân một phần chuyển động riêng, gốc ở hông (x, hy, z theo toạ độ của xe), chân thả xuống dài len
      const leg = (x, hy, z, len, col, ph, w) => { const n = name + 'l' + legs.length, q = k.sub(n, [0, 0, 0]); q.add(Bc(w, len, w, 0.03), col, 0, -len / 2, 0);
        q.add(Bc(w * 1.15, 0.12, w * 1.25, 0.02), '#262220', 0, -len + 0.06, 0.02); legs.push([n, x, hy + (y || 0), z, ph]); };
      M[kind](s, col, leg);
      if (gap) off -= gap; else { off = (h * L) / heads; h++; head = name; }
      // [tên, tốc độ, quãng lệch, độ cao, đầu xe nó bám (toa), bay trên cao, chân, chạy theo mạng đường (ngã rẽ, mỗi xe một đường)]
      const road = ROAD.has(kind) && !gap; // (toa tàu và tàu chạy ray giữ vòng đường của mình)
      path.push([name, SPEED[lv], off, y || 0, gap ? head : null, (y || 0) > 2, legs, road]);
    });
    return path.length ? { loop: loop.map((p) => p.slice()), spokes: (spokes || []).map((sp) => sp.map((p) => p.slice())), path } : null;
  }
  BK.Vehicles3D = { M, FLEET, fleet };
})(typeof self !== 'undefined' ? self : globalThis);
