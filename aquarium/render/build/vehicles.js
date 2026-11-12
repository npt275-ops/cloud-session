/* Bể Kính · render/build/vehicles.js · Xe bay của từng thời
 * Chỉ còn xe bay trên cao (người chơi bỏ xe chạy dưới đất: design/ke-hoach-buoc-27.md). Mỗi xe vẽ ở gốc toạ độ, mũi xe hướng +z.
 * fleet(k, cấp, vòng đường) tạo mỗi xe một phần chuyển động riêng và trả về phần chuyển động path: render/build/traffic3d.js
 * cho từng xe bay dọc vòng đường (khép kín) ở độ cao riêng, mũi xe quay theo hướng bay.
 *   thời 1–8: không có xe · 9 hạt giống bay · 10 xe bay · 11 quả cầu sáng · 12 thoi ánh sáng
 * Cần: render/build/kit3d.js, plains/common.js. */
(function (root) {
  const BK = root.BK,
    K = BK.BuildKit,
    { Bc } = BK.Plains3D;
  const THREE = () => window.THREE;
  const M = {
    seed(s, c) {
      s.add(K.ball(0.6, 1), c || '#f6e6b0', 0, 0, 0);
      s.add(K.post(0.03, 1.6, 4), '#e8e0d0', 0, 0.4, 0);
      for (let i = 0; i < 6; i++) s.add(Bc(0.04, 0.6, 0.04, 0.01), '#f2f2e8', 0, 2, 0, { rot: [Math.cos(i) * 0.9, 0, Math.sin(i) * 0.9] });
    },
    hover(s, c) {
      s.add(K.ball(1, 1), c || '#f2f2ee', 0, 0, 0, { sc: [0.9, 0.45, 1.6] });
      s.add(K.ball(0.6, 1), '#2f4a6b', 0, 0.3, 0.3, { sc: [0.8, 0.5, 1] });
      s.add(K.disc(0.8, 10), '#ffd27a', 0, -0.45, 0, { glow: true });
    },
    orb(s) {
      s.add(K.ball(0.5, 1), '#e6d6ff', 0, 0, 0, { glow: true });
    },
    pod(s, c) {
      s.add(new (THREE().OctahedronGeometry)(0.6, 0), c || '#b8f0ff', 0, 0, 0, { glow: true, sc: [0.6, 0.6, 1.8] });
    },
  };
  // đội xe bay của một thời: [kiểu, màu, độ cao bay]
  const FLEET = [
    null,
    [],
    [],
    [],
    [],
    [],
    [],
    [],
    [],
    [
      ['seed', '#f6e6b0', 5],
      ['seed', '#d8f0c0', 6.2],
      ['seed', '#f6e6b0', 4.4],
      ['seed', '#d8f0c0', 5.6],
      ['seed', '#f6e6b0', 6.6],
      ['seed', '#d8f0c0', 5],
    ],
    [
      ['hover', '#f2f2ee', 3.2],
      ['hover', '#ffb04a', 3.6],
      ['hover', '#e6d6b8', 3.0],
      ['hover', '#f2f2ee', 3.4],
    ],
    [
      ['orb', null, 7],
      ['orb', null, 6.4],
      ['orb', null, 7.6],
      ['orb', null, 6.8],
      ['orb', null, 7.2],
    ],
    [
      ['pod', '#b8f0ff', 2.5],
      ['pod', '#e6d6ff', 2.8],
      ['pod', '#b8f0ff', 2.2],
      ['pod', '#e6d6ff', 2.6],
    ],
  ];
  const SPEED = [0, 0, 0, 0, 0, 0, 0, 0, 0, 1.0, 5.0, 3.0, 6.0];
  // tạo đội xe bay trên vòng đường loop ([[x, z], ...] khép kín): xe cách đều nhau trên vòng
  function fleet(k, lv, loop) {
    const list = FLEET[lv] || [],
      path = [];
    let L = 0;
    for (let i = 0; i < loop.length; i++) {
      const a = loop[i],
        b = loop[(i + 1) % loop.length];
      L += Math.hypot(b[0] - a[0], b[1] - a[1]);
    }
    list.forEach(([kind, col, y], i) => {
      const name = 'veh' + i;
      M[kind](k.sub(name, [0, y, 0]), col);
      // [tên, tốc độ, quãng lệch trên vòng, độ cao bay]
      path.push([name, SPEED[lv], (i * L) / list.length, y]);
    });
    return path.length ? { loop: loop.map((p) => p.slice()), path } : null;
  }
  BK.Vehicles3D = { M, FLEET, fleet };
})(typeof self !== 'undefined' ? self : globalThis);
