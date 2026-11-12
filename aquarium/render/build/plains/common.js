/* Bể Kính · render/build/plains/common.js
 * Phần dùng chung cho công trình đảo Lúa Vàng: bảng màu, chỗ đặt nhà quanh làng, 20 nhà riêng của dân (homes), và những món dùng lại qua nhiều thời
 * (bếp lửa, ruộng, đống rơm, đá dựng, giếng, cây đa). Mỗi thời có một tệp riêng (e01.js … e12.js) đăng ký vào
 * BK.Plains3D.ERA[cấp] = { yard, pieces, BUILD, NAME }. render/buildings3d.js đọc ERA để dựng làng.
 * Toạ độ trong làng: z dương là phía trước (biển trong, phía camera), x dương là bên phải. Mặt trước công trình là +z.
 * Cỡ theo người cao 1,4: cửa cao khoảng 1,6 đến 1,8. Cần: render/build/kit3d.js. */
(function (root, factory) {
  const BK = root.BK || (root.BK = {});
  BK.Plains3D = factory(BK);
})(typeof self !== 'undefined' ? self : globalThis, function (BK) {
  'use strict';
  const K = BK.BuildKit;
  const C = {
    mud: ['#c9a274', '#bf9668', '#d2ad80'],
    thatch: ['#d8b45a', '#cfa94f', '#e0bd66'],
    thatchD: '#a98a3c',
    wood: '#7a5134',
    woodL: '#a8784a',
    dark: '#3e2c20',
    stone: ['#a39a8a', '#9a9080', '#b0a796'],
    paint: '#b8462e',
    ochre: '#d9a03a',
    bone: '#ebe0c8',
    hide: ['#b88a5c', '#a67a4e', '#c89a68'],
    brick: ['#b5654a', '#a85a42', '#c07055'],
    tile: '#a8523a',
    tileD: '#8a3e2a',
    lime: '#ecdcbc',
    concrete: ['#d8d6d0', '#cfcdc6', '#e2e0da'],
    glass: '#7fb2cc',
    steel: '#9aa4ae',
    white: '#f2f2ee',
    gold: '#e6c04a',
    rice: ['#d9bd4a', '#cbb042', '#e0c85a'],
  };
  const pick = (a, v) => a[Math.abs(Math.floor(v * 997)) % a.length];
  const B = (w, h, d, r) => K.box(w, h, d, r || 0.06, true); // hộp vát, gốc ở chân
  const Bc = (w, h, d, r) => K.box(w, h, d, r || 0.06, false); // hộp vát, gốc ở giữa
  // n chỗ đặt nhà trên vòng bán kính r, góc tính từ phía trước (0) sang phải (dương), quay mặt về điểm face
  function ring(kind, n, r, a0, a1, face, extra) {
    const out = [];
    const m = Math.ceil(n / 2); // một nửa bên phải, một nửa bên trái, đối xứng qua trục làng
    for (let i = 0; i < m; i++) {
      const t = m === 1 ? 0.5 : i / (m - 1),
        a = a0 + (a1 - a0) * t;
      for (const s of [1, -1])
        if (out.length < n)
          out.push(Object.assign({ kind, x: s * Math.sin(a) * r, z: Math.cos(a) * r, face, v: out.length, clear: 3 }, extra || {}));
    }
    return out;
  }

  // 20 nhà riêng của dân (mỗi hộ một nhà: bố mẹ và con, logic/homes.js giữ nhà nào của hộ nào). Chỗ đặt giống nhau ở mọi
  // thời: vòng trong 8 nhà, vòng ngoài 12 nhà, chia đều hai bên làng, chừa phía trước (ruộng, đường) và phía sau (nhà chính).
  // Sang thời mới nhà số i của thời mới mọc lên đúng chỗ nhà số i cũ (render/buildings3d.js); fit: nhà to quá thì thu cho vừa.
  const HOME_SLOTS = 20;
  // mix: { small, odd } cho các thời có cao ốc: nhà cao, nhà nhỏ và một vài toà dáng lạ đứng xen kẽ (cao thấp không đều)
  const mixKind = (i, kind, mix) => (!mix ? kind : mix.odd && i % 6 === 4 ? mix.odd : mix.small && i % 3 === 1 ? mix.small : kind);
  function homes(kind, extra, mix) {
    const out = [],
      rows = [
        [20, 4, 1.0, 2.3],
        [27.5, 6, 0.95, 2.45],
      ];
    for (const [r, m, a0, a1] of rows)
      for (let i = 0; i < m; i++) {
        const a = a0 + ((a1 - a0) * i) / (m - 1);
        for (const sx of [1, -1]) {
          const n = out.length;
          out.push(
            Object.assign(
              {
                kind: mixKind(n, kind, mix),
                x: sx * Math.sin(a) * r,
                z: Math.cos(a) * r,
                face: [0, 2],
                v: n,
                clear: 2.8,
                slot: 'home' + n,
                home: n,
                fit: 5.4,
              },
              extra || {},
            ),
          );
        }
      }
    return out.slice(0, HOME_SLOTS);
  }

  // dùng một kiểu nhà của bộ kiểu chung (render/build/isles/arch.js, tải sau tệp này) với bảng màu của Lúa Vàng
  const archHome = (name, pal) => (k, o) => BK.IslesArch.HOME[name](k, Object.assign(Object.create(o), { pal }));

  /* ---------- Những món dùng lại qua nhiều thời ---------- */
  function fire(k, o) {
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2;
      k.add(K.ball(0.24), pick(C.stone, i * 0.37), Math.cos(a) * 0.85, 0.12, Math.sin(a) * 0.85, { sc: [1.1, 0.7, 1] });
    }
    for (let i = 0; i < 3; i++) k.add(Bc(1.1, 0.14, 0.14, 0.04), '#5a3a24', 0, 0.12, 0, { rot: [0, (i * Math.PI) / 3, 0.25] });
    k.add(K.cone(0.42, 1.0, 6), '#ff9a2e', 0, 0.1, 0, { glow: true });
    k.add(K.cone(0.24, 0.75, 5), '#ffe07a', 0.05, 0.12, 0.04, { glow: true });
    if (o.seats !== false)
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2 + 0.4;
        k.add(B(1.5, 0.34, 0.4, 0.12), C.woodL, Math.cos(a) * 2.5, 0, Math.sin(a) * 2.5, { rot: [0, -a + Math.PI / 2, 0] });
      }
    return { smoke: [[0, 1.2, 0, 0.8]] }; // khói bếp (render/build/life3d.js)
  }
  function field(k, o) {
    const w = o.w || 7,
      d = o.d || 5;
    k.add(B(w, 0.14, d, 0.05), '#8f7a4a', 0, 0, 0, { ao: false });
    for (let j = 0; j < Math.floor(d / 0.6); j++)
      k.add(B(w - 0.5, 0.42, 0.34, 0.12), pick(C.rice, j * 0.31), 0, 0.12, -d / 2 + 0.45 + j * 0.6);
    if (o.fence !== false) {
      for (let i = 0; i <= 8; i++)
        for (const sz of [-1, 1]) k.add(K.post(0.04, 0.6, 5), C.woodL, -w / 2 + (i * w) / 8, 0, sz * (d / 2 + 0.15));
      for (const sz of [-1, 1]) k.add(B(w + 0.2, 0.06, 0.06, 0.02), C.woodL, 0, 0.45, sz * (d / 2 + 0.15));
    }
  }
  function hay(k, o) {
    const s = o.s || 1;
    k.add(
      K.lathe(
        [
          [0.8 * s, 0],
          [0.85 * s, 0.5 * s],
          [0.62 * s, 1.15 * s],
          [0.25 * s, 1.5 * s],
          [0.001, 1.6 * s],
        ],
        8,
      ),
      C.thatch[2],
      0,
      0,
      0,
    );
    k.add(K.post(0.03, 0.5, 4), C.wood, 0, 1.55 * s, 0);
  }
  function stones(k) {
    k.add(B(1.3, 0.4, 0.9, 0.08), C.stone[0], 0, 0, 0);
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 + 0.3,
        h = 1.3 + (i % 3) * 0.35;
      k.add(B(0.55, h, 0.35, 0.1), pick(C.stone, i * 0.61), Math.cos(a) * 1.9, 0, Math.sin(a) * 1.9, {
        rot: [0, -a, i % 2 ? 0.06 : -0.05],
      });
    }
  }
  function well(k) {
    k.add(
      K.lathe(
        [
          [0.72, 0],
          [0.98, 0],
          [1.0, 0.62],
          [0.95, 0.72],
          [0.74, 0.72],
          [0.7, 0.62],
          [0.72, 0],
        ],
        10,
      ),
      C.stone[2],
      0,
      0,
      0,
    );
    k.add(K.disc(0.72, 10), '#3f7fa8', 0, 0.5, 0, { ao: false });
    for (const sx of [-1, 1]) k.add(K.post(0.07, 1.7), C.wood, sx * 0.9, 0, 0);
    k.add(Bc(2.0, 0.12, 0.12, 0.04), C.wood, 0, 1.72, 0);
    k.add(K.post(0.15, 0.26, 8, 0.17), '#8a5a32', 0.25, 0.86, 0);
  }
  function banyan(k) {
    k.add(
      K.lathe(
        [
          [0.75, 0],
          [0.5, 0.3],
          [0.42, 1.6],
          [0.5, 2.6],
          [0.001, 2.8],
        ],
        8,
      ),
      '#6b5038',
      0,
      0,
      0,
    );
    for (let i = 0; i < 6; i++) {
      const a = i * 1.05;
      k.add(K.post(0.05, 2.6, 4), '#7a6048', Math.cos(a) * 1.6, 0, Math.sin(a) * 1.6);
    }
    for (const [cx, cy, cz, r, c] of [
      [0, 3.6, 0, 2.3, '#4f8a3f'],
      [1.7, 3.2, 0.6, 1.6, '#5a9646'],
      [-1.7, 3.3, -0.3, 1.7, '#4a8040'],
      [0.4, 4.6, -0.6, 1.6, '#5f9a48'],
      [-0.6, 3.1, 1.6, 1.4, '#5a9646'],
    ])
      k.add(K.ball(1, 1), c, cx, cy, cz, { sc: [r, r * 0.78, r] });
  }
  // đường lát: dải phẳng trên mặt đất (màu theo thời)
  function road(k, o) {
    k.add(B(o.w || 2.4, 0.06, o.d || 12, 0.02), o.color || '#b8ad99', 0, 0, 0, { ao: false });
  }

  return { ERA: {}, C, pick, B, Bc, ring, homes, archHome, HOME_SLOTS, COMMON: { fire, field, hay, stones, well, banyan, road } };
});
