/* Bể Kính · render/build/plains/e04.js · Cấp 4, Cận đại (Lúa Vàng)
 * Biết in sách, mài kính, đóng khí cầu: Tháp Đồng Hồ (nhà chính), nhà gạch hai tầng mái ngói, chợ có mái, nhà in,
 * bãi khí cầu (khí cầu nhấp nhô), đèn dầu, giếng, cây đa, ruộng, đường lát đá. */
(function (root) {
  const BK = root.BK,
    P = BK.Plains3D,
    K = BK.BuildKit,
    { C, pick, B, Bc, ring, homes, COMMON } = P;
  const win = (k, x, y, z, w, h) => {
    k.add(Bc(w, h, 0.08, 0.02), '#3a4a5a', x, y, z, { ao: false });
    k.add(Bc(w * 0.9, h * 0.9, 0.04, 0.01), '#ffd88a', x, y, z + 0.06, { lit: true });
    k.add(Bc(w + 0.14, 0.08, 0.12, 0.02), C.white, x, y - h / 2 - 0.04, z + 0.02, { ao: false });
  };

  // Tháp Đồng Hồ: khối gạch hai tầng, tháp vuông có mặt đồng hồ bốn phía, chóp ngói nhọn
  function hall(k) {
    k.add(B(8.4, 0.4, 6, 0.08), C.stone[0], 0, 0, 0);
    k.add(B(7.6, 4.4, 5.2, 0.1), C.brick[0], 0, 0.4, 0);
    for (let f = 0; f < 2; f++) for (const x of [-2.8, -1.4, 1.4, 2.8]) win(k, x, 1.6 + f * 2, 2.62, 0.7, 1.1);
    k.add(B(1.6, 2.2, 0.14, 0.04), '#5a3a24', 0, 0.4, 2.6);
    k.add(K.roof(8.2, 1.4, 5.8, 0.2, 7.0, 1.2), C.tile, 0, 4.8, 0);
    k.add(B(2.8, 6.5, 2.8, 0.08), C.brick[2], 0, 4.8, 0);
    for (let i = 0; i < 4; i++) {
      const a = (i * Math.PI) / 2,
        sx = Math.sin(a),
        cz = Math.cos(a);
      k.add(new window.THREE.CylinderGeometry(0.95, 0.95, 0.12, 14).rotateX(Math.PI / 2), C.white, sx * 1.44, 9.6, cz * 1.44, {
        rot: [0, a, 0],
        ao: false,
      });
      k.add(Bc(0.08, 0.7, 0.06, 0.01), C.dark, sx * 1.52, 9.85, cz * 1.52, { rot: [0, a, 0], ao: false });
      k.add(Bc(0.5, 0.08, 0.06, 0.01), C.dark, sx * 1.52 + cz * 0.2, 9.6, cz * 1.52 - sx * 0.2, { rot: [0, a, 0], ao: false });
    }
    k.add(B(3.2, 0.3, 3.2, 0.06), C.white, 0, 11.3, 0);
    k.add(K.roof(3.0, 3.2, 3.0, 0.15, 0.2, 0.2), C.tileD, 0, 11.6, 0);
    k.add(K.post(0.04, 1.2, 4), C.gold, 0, 14.6, 0);
  }
  // nhà gạch hai tầng mái ngói, cửa sổ có bậu, ống khói
  function house(k, o) {
    const wall = pick(['#d9c3a0', '#e6d6b8', C.brick[2], '#cfb08a'], o.v * 0.27);
    k.add(B(4.2, 0.3, 3.4, 0.06), C.stone[1], 0, 0, 0);
    k.add(B(3.8, 3.9, 3.0, 0.08), wall, 0, 0.3, 0);
    k.add(B(0.95, 1.8, 0.1, 0.03), '#5a3a24', -0.8, 0.3, 1.5);
    win(k, 0.9, 1.4, 1.52, 0.7, 0.9);
    for (const x of [-0.9, 0.9]) win(k, x, 3.3, 1.52, 0.7, 0.9);
    k.add(B(3.9, 0.12, 0.5, 0.03), C.white, 0, 2.3, 1.6);
    k.add(K.roof(4.5, 1.6, 3.6, 0.15, 4.3, 0.3), pick([C.tile, C.tileD, '#7a4a3a'], o.v * 0.4), 0, 4.2, 0);
    k.add(B(0.45, 1.2, 0.45, 0.04), C.brick[1], 1.2, 4.6, -0.6);
    return o.v % 3 === 0 ? { smoke: [[1.2, 5.9, -0.6, 0.6]] } : null; // vài nhà đang đỏ lửa bếp
  }
  // chợ có mái: mái dài trên hàng cột, sạp hàng có mái vải nhiều màu
  function market(k) {
    for (let i = 0; i < 5; i++) for (const z of [-1.8, 1.8]) k.add(K.post(0.13, 2.8, 6), C.wood, -4.8 + i * 2.4, 0, z);
    k.add(K.roof(11, 1.5, 5, 0.2, 10, 0.3), C.tile, 0, 2.8, 0);
    const cl = ['#c94f3a', '#3f7fb8', '#e0b23a', '#3f8a5a'];
    for (let i = 0; i < 4; i++) {
      const x = -3.6 + i * 2.4;
      k.add(B(1.8, 0.8, 1.0, 0.06), C.woodL, x, 0, 0.3);
      k.add(Bc(2.0, 0.06, 1.2, 0.02), cl[i], x, 1.6, 0.6, { rot: [0.25, 0, 0], ao: false });
      for (let j = 0; j < 3; j++) k.add(K.ball(0.16), ['#e05a3a', '#e8c24a', '#7fbf5a'][(i + j) % 3], x - 0.5 + j * 0.5, 0.95, 0.3);
    }
  }
  // nhà in: nhà gạch có biển hiệu, ống khói, chồng giấy trước cửa
  function press(k) {
    k.add(B(5, 3.2, 3.6, 0.08), '#c9b08a', 0, 0, 0);
    k.add(K.roof(5.6, 1.4, 4.2, 0.15, 5.2, 0.3), C.tileD, 0, 3.2, 0);
    k.add(B(1.2, 1.9, 0.1, 0.03), '#4a3426', 0, 0, 1.8);
    k.add(Bc(2.6, 0.55, 0.1, 0.03), '#2f4a6b', 0, 2.55, 1.86);
    k.add(Bc(2.2, 0.12, 0.12, 0.02), C.gold, 0, 2.55, 1.92, { ao: false });
    k.add(K.post(0.25, 2.2, 6), C.brick[1], -1.8, 3.4, -1);
    for (let i = 0; i < 3; i++) k.add(B(0.6, 0.12, 0.45, 0.02), C.white, 1.8, i * 0.13, 2.3);
  }
  // bãi khí cầu: cọc neo, dây, khí cầu sọc nhấp nhô
  function balloon(k) {
    k.add(B(3, 0.2, 3, 0.05), C.stone[1], 0, 0, 0);
    k.add(K.post(0.12, 1.4, 6), C.wood, -1.2, 0.2, 0);
    k.add(K.post(0.12, 1.4, 6), C.wood, 1.2, 0.2, 0);
    const b = k.sub('balloon', [0, 5.5, 0]);
    for (let i = 0; i < 4; i++)
      b.add(
        K.lathe(
          [
            [0.001, -1.9],
            [1.3, -1.3],
            [1.9, 0],
            [1.6, 1.2],
            [0.8, 1.9],
            [0.001, 2.1],
          ],
          8,
        ),
        i % 2 ? '#c94f3a' : '#f2e6c8',
        0,
        0,
        0,
        { rot: [0, (i * Math.PI) / 8, 0], sc: [1 - i * 0.01, 1, 1 - i * 0.01] },
      );
    b.add(B(0.9, 0.6, 0.9, 0.05), C.woodL, 0, -3.1, 0);
    for (const [x, z] of [
      [-0.4, -0.4],
      [0.4, -0.4],
      [-0.4, 0.4],
      [0.4, 0.4],
    ])
      b.add(K.post(0.015, 1.3, 3), '#5a4a3a', x, -2.5, z);
    return { bob: [['balloon', 0.35, 0.7]] };
  }
  function lamp(k) {
    k.add(K.post(0.07, 2.6, 6), '#3a3a3e', 0, 0, 0);
    k.add(B(0.36, 0.45, 0.36, 0.04), '#3a3a3e', 0, 2.6, 0);
    k.add(B(0.24, 0.3, 0.24, 0.02), '#e8e2c8', 0, 2.67, 0);
    k.add(B(0.26, 0.32, 0.26, 0.02), '#ffd27a', 0, 2.66, 0, { lit: true });
  }

  const F = [0, 5];
  P.ERA[4] = {
    yard: { x: 0, z: 2, r: 17, color: '#bcb2a0' },
    pieces: [
      { kind: 'hall', x: 0, z: -7, clear: 7 },
      { kind: 'road', x: 0, z: 9, d: 14, color: '#a8a092', clear: 0 },
      ...homes('house'),
      { kind: 'market', x: 9, z: 6.5, face: [0, 6.5], clear: 6 },
      { kind: 'press', x: -9, z: 6.5, face: [0, 6.5], clear: 4 },
      { kind: 'balloon', x: 16, z: 14, clear: 3 },
      { kind: 'well', x: 3.4, z: 2.6, clear: 1.6 },
      { kind: 'banyan', x: -12, z: -13, clear: 4 },
      { kind: 'lamp', x: -2, z: 6, clear: 0.5 },
      { kind: 'lamp', x: 2, z: 6, clear: 0.5 },
      { kind: 'lamp', x: -2, z: 12, clear: 0.5 },
      { kind: 'lamp', x: 2, z: 12, clear: 0.5 },
      // (đã bỏ ruộng lúa: sau thời trung đại Lúa Vàng không còn ruộng)
    ],
    BUILD: {
      hall,
      house,
      market,
      press,
      balloon,
      lamp,
      well: COMMON.well,
      banyan: COMMON.banyan,
      field: COMMON.field,
      hay: COMMON.hay,
      road: COMMON.road,
    },
    NAME: {
      hall: 'Tháp Đồng Hồ',
      house: 'Nhà gạch hai tầng',
      market: 'Chợ có mái',
      press: 'Nhà in',
      balloon: 'Bãi khí cầu',
      lamp: 'Đèn dầu',
      well: 'Giếng',
      banyan: 'Cây đa',
      field: 'Ruộng lúa',
      hay: 'Đống rơm',
      road: 'Đường lát đá',
    },
  };
})(typeof self !== 'undefined' ? self : globalThis);
