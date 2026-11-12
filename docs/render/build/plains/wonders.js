/* Bể Kính · render/build/plains/wonders.js · Mười hai kỳ quan của Lúa Vàng (mỗi thời một)
 * Mỗi thời có một công trình cao gấp hai ba lần nhà thường, nhìn từ xa biết ngay là thời nào. Kỳ quan đứng ở một chỗ cố
 * định bên cạnh làng (slot 'wonder'); sang thời mới, kỳ quan của thời mới thay kỳ quan cũ ngay tại chỗ đó.
 * Tệp này chạy sau e01..e12 và outer.js. P.WONDERS.addTo(E, cấp, hàm dựng, tên, tint) thêm kỳ quan vào một bố cục (các đảo
 * khác dùng lại, render/build/isles/compose.js). Cần: common.js. */
(function (root) {
  const BK = root.BK,
    P = BK.Plains3D,
    K = BK.BuildKit,
    { C, pick, B, Bc } = P;
  const THREE = () => window.THREE;
  const torus = (r, t, a, b) => new (THREE().TorusGeometry)(r, t, a || 6, b || 28);

  // 1 · Vòng Đá Mặt Trời: mười cột đá lớn có đá gác ngang, bàn thờ lửa ở giữa, hai cột vẽ
  function w1(k) {
    k.add(K.disc(8.5, 18), '#b9a27a', 0, 0.03, 0, { ao: false });
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2,
        x = Math.cos(a) * 6.5,
        z = Math.sin(a) * 6.5,
        h = 5.2 + (i % 3) * 0.5;
      k.add(B(1.3, h, 0.9, 0.18), pick(C.stone, i * 0.37), x, 0, z, { rot: [0, -a + Math.PI / 2, i % 2 ? 0.04 : -0.03] });
      if (i % 2 === 0) {
        const b2 = ((i + 1) / 10) * Math.PI * 2,
          mx = (Math.cos(a) + Math.cos(b2)) * 3.25,
          mz = (Math.sin(a) + Math.sin(b2)) * 3.25;
        k.add(B(4.4, 0.7, 0.9, 0.15), C.stone[2], mx, 5.3, mz, { rot: [0, -(a + b2) / 2 + Math.PI / 2, 0] });
      }
    }
    k.add(B(2.6, 1.1, 1.6, 0.15), C.stone[0], 0, 0, 0);
    k.add(K.cone(0.7, 1.6, 6), '#ff9a2e', 0, 1.1, 0, { glow: true });
    k.add(K.cone(0.4, 1.1, 5), '#ffe07a', 0.1, 1.15, 0.05, { glow: true });
    for (const sx of [-1, 1]) {
      k.add(K.post(0.35, 6.5, 6), C.wood, sx * 2.6, 0, 3.2);
      for (let j = 0; j < 4; j++)
        k.add(B(0.8, 0.5, 0.8, 0.08), [C.paint, C.ochre, C.bone, '#3f7fb8'][(j + (sx > 0 ? 1 : 0)) % 4], sx * 2.6, 2 + j * 1.1, 3.2);
    }
    return { smoke: [[0, 2.4, 0, 1.2]] };
  }
  // 2 · Tháp Lúa: kho lúa tròn nhiều tầng thu nhỏ dần, mái rơm, bó lúa vàng trên đỉnh, thang tre, cờ đuôi nheo
  function w2(k) {
    for (let f = 0; f < 4; f++) {
      const r = 4 - f * 0.75,
        y = f * 3.4;
      k.add(K.post(r, 2.6, 12, r * 0.95), pick(C.mud, f * 0.4), 0, y, 0);
      k.add(
        K.lathe(
          [
            [r + 0.9, 0],
            [r * 0.6, 0.9],
            [0.001, 1.0],
          ],
          12,
        ),
        pick(C.thatch, f * 0.3),
        0,
        y + 2.6,
        0,
      );
    }
    k.add(K.post(0.25, 2.4, 6), C.gold, 0, 14, 0);
    for (let i = 0; i < 8; i++) k.add(K.post(0.06, 1.6, 4), C.gold, 0, 15.6, 0, { rot: [Math.cos(i) * 0.5, 0, Math.sin(i) * 0.5] });
    for (let i = 0; i < 14; i++) k.add(Bc(1.4, 0.08, 0.08, 0.02), C.woodL, 0, 0.6 + i * 0.75, 4.15);
    for (const sx of [-0.65, 0.65]) k.add(K.post(0.06, 11, 4), C.woodL, sx, 0, 4.15);
    const fl = k.sub('flag', [0, 16.6, 0]);
    fl.add(K.post(0.04, 2.4, 4), C.wood, 0, 0, 0);
    fl.add(Bc(1.8, 0.7, 0.04, 0.01), C.paint, 0.9, 2, 0);
    return { sway: [['flag', 'y', 0.6, 1.2]] };
  }
  // 3 · Thành Lũy: tháp chính đá vuông có răng cưa, bốn tháp góc mái nhọn đỏ, cổng vòm, cờ
  function w3(k) {
    k.add(B(10, 4.2, 10, 0.12), C.stone[1], 0, 0, 0);
    for (let i = 0; i < 9; i++)
      for (const [dx, dz] of [
        [1, 0],
        [0, 1],
      ])
        for (const sg of [-1, 1])
          k.add(B(0.6, 0.7, 0.6, 0.05), C.stone[2], dx ? -4.4 + i * 1.1 : sg * 4.7, 4.2, dz ? -4.4 + i * 1.1 : sg * 4.7);
    k.add(B(5, 9, 5, 0.12), C.stone[0], 0, 0, 0);
    for (let i = 0; i < 4; i++)
      for (const sg of [-1, 1]) {
        k.add(B(0.6, 0.7, 0.6, 0.05), C.stone[2], -1.9 + i * 1.27, 9, sg * 2.3);
        k.add(B(0.6, 0.7, 0.6, 0.05), C.stone[2], sg * 2.3, 9, -1.9 + i * 1.27);
      }
    for (const [x, z] of [
      [-5, -5],
      [5, -5],
      [-5, 5],
      [5, 5],
    ]) {
      k.add(K.post(1.3, 6.5, 10), C.stone[2], x, 0, z);
      k.add(K.cone(1.7, 3, 10), C.tile, x, 6.5, z);
    }
    k.add(B(2.4, 3, 0.3, 0.05), C.dark, 0, 0, 5.05);
    k.add(K.post(1.2, 0.3, 10, 1.2).rotateX(Math.PI / 2), C.dark, 0, 3, 5.05);
    for (let f = 0; f < 2; f++)
      k.add(Bc(0.6, 0.9, 0.08, 0.02), '#3a3a3a', -1.2 + f * 2.4, 6.5, 2.52, { ao: false }),
        k.add(Bc(0.5, 0.8, 0.06, 0.02), '#ffd27a', -1.2 + f * 2.4, 6.5, 2.56, { lit: true });
    const fl = k.sub('flag', [0, 9.7, 0]);
    fl.add(K.post(0.06, 3.5, 4), C.wood, 0, 0, 0);
    fl.add(Bc(2.2, 1.2, 0.05, 0.01), '#c94f3a', 1.1, 2.8, 0);
    return { sway: [['flag', 'y', 0.5, 1.4]] };
  }
  // 4 · Đại Tháp Chuông: tháp gạch cao, tầng chuông mở bốn phía (chuông đung đưa), chóp đồng xanh, đồng hồ lớn
  function w4(k) {
    k.add(B(6, 0.6, 6, 0.1), C.stone[0], 0, 0, 0);
    k.add(B(4.4, 13, 4.4, 0.12), C.brick[0], 0, 0.6, 0);
    for (let f = 0; f < 4; f++)
      for (const z of [2.22])
        k.add(Bc(0.9, 1.5, 0.08, 0.02), '#2e3a48', 0, 2.5 + f * 2.8, z, { ao: false }),
          k.add(Bc(0.8, 1.3, 0.06, 0.02), '#ffd27a', 0, 2.5 + f * 2.8, z + 0.04, { lit: true });
    for (let i = 0; i < 4; i++) {
      const a = (i * Math.PI) / 2;
      k.add(new (THREE().CylinderGeometry)(1.5, 1.5, 0.14, 16).rotateX(Math.PI / 2), C.white, Math.sin(a) * 2.25, 12, Math.cos(a) * 2.25, {
        rot: [0, a, 0],
        ao: false,
      });
      k.add(Bc(0.1, 1.1, 0.06, 0.01), C.dark, Math.sin(a) * 2.36, 12.3, Math.cos(a) * 2.36, { rot: [0, a, 0], ao: false });
    }
    for (const [x, z] of [
      [-1.9, -1.9],
      [1.9, -1.9],
      [-1.9, 1.9],
      [1.9, 1.9],
    ])
      k.add(K.post(0.3, 3.4, 6), C.lime, x, 13.6, z);
    k.add(B(4.8, 0.4, 4.8, 0.06), C.lime, 0, 17, 0);
    k.add(K.cone(3, 6, 4), '#5f9a84', 0, 17.4, 0, { rot: [0, Math.PI / 4, 0] });
    k.add(K.post(0.06, 2, 4), C.gold, 0, 23.2, 0);
    const bell = k.sub('bell', [0, 16.6, 0]);
    bell.add(
      K.lathe(
        [
          [0.001, 0],
          [0.5, -0.1],
          [0.8, -1.3],
          [1.1, -1.8],
          [0.001, -1.8],
        ],
        10,
      ),
      C.gold,
      0,
      0,
      0,
    );
    return { sway: [['bell', 'x', 0.35, 1.6]] };
  }
  // 5 · Nhà Máy Ống Khói: xưởng lớn mái răng cưa, ba ống khói cao (khói bốc), tháp nước, cửa sổ sáng ca đêm
  function w5(k) {
    k.add(B(14, 5, 8, 0.1), C.brick[1], 0, 0, 0);
    for (let i = 0; i < 5; i++) {
      k.add(K.roof(2.8, 1.6, 8, 0.05, 0.2, 8), '#5a5a5e', -5.6 + i * 2.8, 5, 0, { rot: [0, 0, 0] });
      k.add(Bc(0.1, 1.2, 7.6, 0.02), C.glass, -4.4 + i * 2.8, 5.7, 0, { ao: false });
    }
    for (let i = 0; i < 6; i++)
      k.add(Bc(1.2, 1.6, 0.08, 0.02), '#2e3640', -5 + i * 2, 2.5, 4.02, { ao: false }),
        k.add(Bc(1.1, 1.5, 0.06, 0.02), '#ffcf7a', -5 + i * 2, 2.5, 4.06, { lit: true });
    const st = [
      [-4, -2.5, 16],
      [0, -2.5, 19],
      [4, -2.5, 15],
    ];
    for (const [x, z, h] of st) {
      k.add(K.post(0.9, h, 10, 0.65), C.brick[2], x, 0, z);
      for (const y of [h * 0.5, h - 1]) k.add(K.post(1.0, 0.4, 10, 0.9), C.white, x, y, z);
    }
    k.add(K.post(0.15, 7, 5), C.steel, 8.5, 0, 2);
    k.add(K.post(0.15, 7, 5), C.steel, 10, 0, 2);
    k.add(K.post(1.4, 2.4, 10), '#7a5a3a', 9.25, 7, 2);
    k.add(K.cone(1.6, 1, 10), C.dark, 9.25, 9.4, 2);
    return { smoke: st.map(([x, z, h]) => [x, h + 0.3, z, 1.8]) };
  }
  // 6 · Tháp Truyền Hình: thân bê tông thon cao, vọng lâu tròn có cửa kính sáng đèn, ăng-ten sọc đỏ trắng
  function w6(k) {
    k.add(B(6, 1.2, 6, 0.2), C.concrete[1], 0, 0, 0);
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2;
      k.add(B(1.2, 10, 1.2, 0.1), C.concrete[0], Math.cos(a) * 2, 0, Math.sin(a) * 2, {
        rot: [Math.sin(a) * 0.12, 0, -Math.cos(a) * 0.12],
      });
    }
    k.add(K.post(1.1, 18, 10, 0.7), C.concrete[2], 0, 1.2, 0);
    k.add(
      K.lathe(
        [
          [0.8, 0],
          [3.2, 0.8],
          [3.4, 2.4],
          [2.6, 3.2],
          [0.8, 3.4],
        ],
        14,
      ),
      C.white,
      0,
      17,
      0,
    );
    k.add(K.post(3.42, 0.9, 14), '#2f4a6b', 0, 18.3, 0);
    k.add(K.post(3.46, 0.7, 14), '#ffe9a8', 0, 18.4, 0, { lit: true });
    for (let i = 0; i < 6; i++) k.add(K.post(0.22 - i * 0.025, 1.4, 6), i % 2 ? '#c94f3a' : C.white, 0, 20.4 + i * 1.4, 0);
    k.add(K.ball(0.25), '#ff4a3a', 0, 28.9, 0, { glow: true });
    return { pulse: true };
  }
  // 7 · Bệ Phóng: tên lửa trắng ba tầng trên bệ, giàn tháp thép có tay đỡ, lửa và khói dưới đáy
  function w7(k) {
    k.add(B(10, 1, 10, 0.15), C.concrete[1], 0, 0, 0);
    k.add(B(4, 0.4, 4, 0.06), '#3a3a3e', 0, 1, 0);
    k.add(K.post(1.4, 10, 12, 1.4), C.white, 0, 1.4, 0);
    k.add(K.post(1.45, 0.6, 12), '#c94f3a', 0, 6.2, 0);
    k.add(K.post(1.1, 4, 12, 0.95), C.white, 0, 11.4, 0);
    k.add(K.cone(0.95, 3.4, 12), '#c94f3a', 0, 15.4, 0);
    for (let i = 0; i < 4; i++) {
      const a = (i * Math.PI) / 2 + Math.PI / 4;
      k.add(K.cone(0.7, 2.6, 4), C.steel, Math.cos(a) * 1.5, 1.4, Math.sin(a) * 1.5, { rot: [Math.PI, 0, 0], sc: [0.5, 1, 1.4] });
    }
    for (const [x, z] of [
      [-4, -1],
      [-4, 1],
      [-2.2, -1],
      [-2.2, 1],
    ])
      k.add(K.post(0.12, 17, 4), '#d4a63a', x, 1, z);
    for (let y = 2; y < 18; y += 2) {
      k.add(Bc(1.9, 0.12, 0.12, 0.02), '#d4a63a', -3.1, y, -1);
      k.add(Bc(1.9, 0.12, 0.12, 0.02), '#d4a63a', -3.1, y, 1);
    }
    for (const y of [7, 12]) k.add(Bc(2.2, 0.3, 0.6, 0.05), '#d4a63a', -1.9, y, 0);
    k.add(K.cone(1, 1.6, 8), '#ffb04a', 0, 0.2, 0, { glow: true, rot: [Math.PI, 0, 0] });
    return {
      smoke: [
        [3, 1.2, 0, 2.2],
        [-2, 1.2, 2.5, 1.8],
      ],
      pulse: true,
    };
  }
  // 8 · Tháp Dữ Liệu: các khối máy chủ đen chồng so le, vạch sáng xanh chạy dọc, vòng drone bay quanh
  function w8(k) {
    for (let f = 0; f < 7; f++) {
      const w = 6 - f * 0.55,
        a = f * 0.22;
      k.add(B(w, 2.6, w, 0.15), f % 2 ? '#2a2e3a' : '#363a48', 0, f * 2.6, 0, { rot: [0, a, 0] });
      k.add(Bc(w + 0.04, 0.12, w + 0.04, 0.02), '#6ae0ff', 0, f * 2.6 + 2.4, 0, { rot: [0, a, 0], glow: true });
    }
    for (let i = 0; i < 4; i++) {
      const a = (i * Math.PI) / 2;
      k.add(Bc(0.12, 17, 0.12, 0.02), '#6ae0ff', Math.cos(a) * 3.05, 9, Math.sin(a) * 3.05, { glow: true });
    }
    k.add(K.ball(0.9, 1), '#6ae0ff', 0, 19.4, 0, { glow: true });
    const r = k.sub('drones', [0, 12, 0]);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      r.add(B(0.8, 0.25, 0.8, 0.08), '#e2e0da', Math.cos(a) * 6, 0, Math.sin(a) * 6);
      r.add(K.ball(0.15), '#ff4a8a', Math.cos(a) * 6, 0.35, Math.sin(a) * 6, { glow: true });
    }
    return { spin: [['drones', 'y', 0.5]], pulse: true };
  }
  // 9 · Cây Sống Khổng Lồ: thân xoắn nhiều nhánh, tán nhiều màu, quả phát sáng, rễ lớn ôm đất
  function w9(k) {
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      k.add(K.post(0.7, 4.5, 6, 0.2), '#7a5a48', Math.cos(a) * 2.6, 0, Math.sin(a) * 2.6, {
        rot: [Math.sin(a) * 0.9, 0, -Math.cos(a) * 0.9],
      });
    }
    k.add(
      K.lathe(
        [
          [2.4, 0],
          [1.6, 2],
          [1.4, 8],
          [1.8, 12],
          [0.6, 14],
        ],
        9,
      ),
      '#8a6450',
      0,
      0,
      0,
    );
    const can = [
      [0, 16, 0, 5, '#f29ab8'],
      [4, 13.5, 1, 3.5, '#5fd8c0'],
      [-4, 14, -1, 3.8, '#c8f07a'],
      [1, 13, -4, 3.2, '#f2c46a'],
      [-1.5, 13.5, 4, 3.4, '#b8a0f2'],
    ];
    for (const [x, y, z, r, c] of can) {
      k.add(K.post(0.5, Math.hypot(x, z) + 1, 6, 0.3), '#8a6450', 0, 11, 0, { rot: [Math.atan2(z, 5) * 0.9, 0, -Math.atan2(x, 5) * 0.9] });
      k.add(K.ball(r, 1), c, x, y, z, { sc: [1, 0.7, 1] });
    }
    for (let i = 0; i < 10; i++) {
      const a = i * 1.7,
        r = 3 + (i % 3);
      k.add(K.ball(0.5), '#ffe9a8', Math.cos(a) * r, 11 + (i % 4), Math.sin(a) * r, { glow: true });
    }
    return { pulse: true };
  }
  // 10 · Mặt Trời Nhân Tạo: giá ba chân cao đỡ quả cầu lửa, hai vòng từ trường quay quanh
  function w10(k) {
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2;
      k.add(B(1.2, 15, 1.2, 0.2), '#e2d6b4', Math.cos(a) * 4, 0, Math.sin(a) * 4, { rot: [Math.sin(a) * 0.22, 0, -Math.cos(a) * 0.22] });
    }
    k.add(K.post(5, 1, 16), '#d6c8a0', 0, 0, 0);
    k.add(torus(2.6, 0.35, 6, 24), '#d6c8a0', 0, 14.4, 0, { rot: [Math.PI / 2, 0, 0] });
    k.add(K.ball(3, 2), '#ffd27a', 0, 18, 0, { glow: true });
    k.add(K.ball(2.2, 1), '#fff6c0', 0, 18, 0, { glow: true });
    const r1 = k.sub('ring1', [0, 18, 0]);
    r1.add(torus(4.4, 0.18), '#ffb04a', 0, 0, 0, { glow: true });
    const r2 = k.sub('ring2', [0, 18, 0]);
    r2.add(torus(5.2, 0.14), '#ff8a3a', 0, 0, 0, { glow: true, rot: [Math.PI / 2, 0, 0] });
    return {
      spin: [
        ['ring1', 'y', 0.7],
        ['ring2', 'x', 0.45],
      ],
      pulse: true,
    };
  }
  // 11 · Cổng Không Gian: vòng cổng đứng khổng lồ, mặt cổng xoáy sáng, đá lơ lửng quanh
  function w11(k) {
    k.add(B(12, 1, 4, 0.2), '#4a4a68', 0, 0, 0);
    for (const sx of [-1, 1]) k.add(B(1.6, 4, 2.4, 0.2), '#5a5a7a', sx * 5.6, 1, 0);
    k.add(torus(6.5, 0.9, 8, 32), '#6a6a88', 0, 8, 0);
    k.add(torus(6.5, 0.3, 6, 32), '#c8a8ff', 0, 8, 0.55, { glow: true });
    const sw = k.sub('swirl', [0, 8, 0]);
    sw.add(new (THREE().CircleGeometry)(5.6, 24), '#8a6aff', 0, 0, 0, { glow: true });
    for (let i = 0; i < 3; i++)
      sw.add(torus(1.5 + i * 1.3, 0.12, 4, 20), '#e6d6ff', 0, 0, 0.05, { glow: true, sc: [1, 0.6 + i * 0.15, 1] });
    for (let i = 0; i < 5; i++) {
      const s = k.sub('rock' + i, [Math.cos(i * 1.3) * 9, 4 + i * 2.2, Math.sin(i * 1.3) * 3]);
      s.add(K.ball(0.9 + (i % 2) * 0.5, 0), '#7a7a98', 0, 0, 0);
    }
    return { spin: [['swirl', 'z', 0.8]], bob: [0, 1, 2, 3, 4].map((i) => ['rock' + i, 0.6, 0.3 + i * 0.07]), pulse: true };
  }
  // 12 · Thành Phố Lơ Lửng: đảo nhỏ bay trên cột sáng, trên có tháp pha lê, thác sáng đổ xuống
  function w12(k) {
    k.add(K.post(1.2, 3, 8), '#d6d2e0', 0, 0, 0);
    k.add(K.post(0.5, 9, 8, 0.2), '#b8f0ff', 0, 3, 0, { glow: true });
    const c = k.sub('city', [0, 13, 0]);
    c.add(
      K.lathe(
        [
          [0.001, -4.5],
          [3, -2.5],
          [6, -0.4],
          [6.2, 0],
        ],
        12,
      ),
      '#8a7a9a',
      0,
      0,
      0,
    );
    c.add(K.disc(6.2, 18), '#c8e8c0', 0, 0.02, 0);
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2,
        r = i ? 3.6 : 0,
        h = i ? 3 + (i % 3) * 1.6 : 8;
      c.add(K.cone(i ? 0.9 : 1.4, h, 5), i % 2 ? '#e6d6ff' : '#c8a8ff', Math.cos(a) * r, 0, Math.sin(a) * r, { glow: !i });
    }
    for (let i = 0; i < 3; i++) {
      const a = i * 2.1;
      c.add(Bc(0.6, 5, 0.1, 0.02), '#b8f0ff', Math.cos(a) * 6, -2.6, Math.sin(a) * 6, { glow: true, rot: [0, -a, 0] });
    }
    return { bob: [['city', 0.5, 0.35]], pulse: true };
  }

  const BUILD = [null, w1, w2, w3, w4, w5, w6, w7, w8, w9, w10, w11, w12];
  const NAME = [
    null,
    'Vòng Đá Mặt Trời',
    'Tháp Lúa',
    'Thành Lũy',
    'Đại Tháp Chuông',
    'Nhà Máy Ống Khói',
    'Tháp Truyền Hình',
    'Bệ Phóng',
    'Tháp Dữ Liệu',
    'Cây Sống Khổng Lồ',
    'Mặt Trời Nhân Tạo',
    'Cổng Không Gian',
    'Thành Phố Lơ Lửng',
  ];
  // chỗ kỳ quan: một bên làng, hơi lùi về sau (phía trước để trống cho máy quay nhìn vào làng)
  const ANGLE = 1.75;
  // thêm kỳ quan vào bố cục của một thời, dựng ngay sau nhà chính
  function addTo(E, lv, build, name, tint) {
    const kind = 'wonder' + lv,
      at = Math.max(1, E.pieces.findIndex((x) => x.kind === 'hall') + 1);
    E.pieces.splice(at, 0, {
      kind,
      x: 0,
      z: 0,
      outer: 'forest',
      a: ANGLE,
      slot: 'wonder',
      solo: true,
      wonder: true,
      clear: 7,
      tint: tint || null,
    });
    E.BUILD[kind] = build;
    E.NAME[kind] = name;
  }
  for (let lv = 1; lv <= 12; lv++) if (P.ERA[lv]) addTo(P.ERA[lv], lv, BUILD[lv], NAME[lv]);
  P.WONDERS = { BUILD, NAME, ANGLE, addTo };
})(typeof self !== 'undefined' ? self : globalThis);
