/* Bể Kính · render/build/plains/outer.js · Công trình ngoài làng của Lúa Vàng (mọi thời)
 * Làng không chỉ ở giữa đảo: có bến và thuyền ở bờ biển, nhà trong rừng, tháp canh, đền giữa rừng, hải đăng, trại ngoài
 * và công trình ngoài khơi. Mỗi loại đổi dáng theo thời (lv 1..12): bến đá thành bến gỗ, cảng đá, cảng nổi; xuồng độc mộc
 * thành thuyền buồm, tàu hơi nước, tàu máy, tàu lướt sóng... Tệp này chạy sau e01..e12 và thêm các món vào ERA[cấp].
 * Mỗi món có outer: 'coast' (mép đảo, mặt trước quay ra biển), 'sea' (ngoài khơi, đặt ở mặt nước), 'forest' (trong rừng),
 * a: góc ưa thích quanh làng (0 là phía trước), slot: tên chỗ (cùng slot ở thời sau thì mọc lên thay đúng chỗ đó).
 * render/buildings3d.js tìm chỗ trống thật trên đảo (tránh núi, hồ, sông) gần góc ưa thích. Cần: common.js. */
(function (root) {
  const BK = root.BK,
    P = BK.Plains3D,
    K = BK.BuildKit,
    { C, pick, B, Bc } = P;
  const tier = (lv, cuts) => {
    let t = 0;
    while (t < cuts.length && lv >= cuts[t]) t++;
    return t;
  }; // tier(lv,[2,5,8]) → 0..3

  // bến: đá và bè (thời đá) → bến gỗ → cảng đá có cần cẩu → cảng bê tông có công-te-nơ → bến nổi viền sáng
  function dock(k, o) {
    const t = tier(o.lv, [2, 5, 7, 9]);
    if (t === 0) {
      for (let i = 0; i < 6; i++)
        k.add(K.ball(0.5), pick(C.stone, i * 0.3), -1.5 + (i % 3) * 1.4, 0, 0.6 + Math.floor(i / 3) * 1.3, { sc: [1.3, 0.55, 1] });
      for (let i = 0; i < 5; i++) k.add(K.post(0.16, 3.2, 6), C.woodL, -1 + i * 0.45, 0.05, 4.5, { rot: [Math.PI / 2, 0, 0] });
      for (const x of [-1.6, 1.6]) k.add(K.post(0.05, 1.6, 4), C.wood, x, 0, -1.2);
      k.add(Bc(3.4, 0.05, 0.05, 0.01), C.wood, 0, 1.5, -1.2);
      for (let i = 0; i < 4; i++) k.add(Bc(0.12, 0.45, 0.06, 0.02), '#9aa6b0', -1.1 + i * 0.7, 1.2, -1.2);
      return;
    }
    if (t === 1) {
      for (let i = 0; i < 6; i++) for (const x of [-0.9, 0.9]) k.add(K.post(0.1, 2.0, 5), C.wood, x, -1.6, 0.5 + i * 1.6);
      k.add(B(2.2, 0.16, 9.2, 0.03), C.woodL, 0, 0.25, 4.4);
      for (let i = 0; i < 12; i++) k.add(Bc(2.2, 0.04, 0.05, 0.01), C.wood, 0, 0.42, 0.2 + i * 0.75, { ao: false });
      if (o.lv >= 3) {
        k.add(B(2.4, 1.9, 2, 0.06), C.woodL, -2.6, 0, -0.6);
        k.add(K.roof(2.8, 1, 2.4, 0.1, 0.3, 2.2), C.thatch[0], -2.6, 1.9, -0.6);
      }
      k.add(K.post(0.12, 0.6, 6), C.dark, 0.8, 0.4, 8.6);
      return;
    }
    if (t === 2) {
      k.add(B(4.4, 1.3, 9, 0.1), C.stone[2], 0, -0.9, 4.2);
      for (let i = 0; i < 4; i++) k.add(K.post(0.14, 0.4, 6), '#4a4a4a', 1.9, 0.4, 1.2 + i * 2.2);
      k.add(K.post(0.18, 4.8, 6), '#6a5a4a', -1.3, 0.4, 6.5);
      k.add(Bc(0.2, 0.2, 4.2, 0.03), '#6a5a4a', -1.3, 5.1, 5.2, { rot: [0.3, 0, 0] });
      for (let i = 0; i < 3; i++) k.add(B(1, 0.8, 0.8, 0.05), C.woodL, -1.1 + i * 1.1, 0.4, 1.4);
      return;
    }
    if (t === 3) {
      k.add(B(6, 1.4, 10, 0.1), C.concrete[1], 0, -1, 4.6);
      const cl = ['#c94f3a', '#3f7fb8', '#e0b23a', '#3f8a5a'];
      for (let i = 0; i < 6; i++) k.add(B(1.2, 1.1, 2.6, 0.04), cl[i % 4], -2 + (i % 3) * 1.4, 0.4 + Math.floor(i / 3) * 1.1, 2.4);
      for (const z of [6.5, 8.8]) k.add(K.post(0.15, 0.45, 6), '#3a3a3e', 2.6, 0.4, z);
      k.add(K.post(0.2, 7, 6), '#d4a63a', -2.2, 0.4, 7.8);
      k.add(Bc(0.3, 0.3, 6, 0.04), '#d4a63a', -2.2, 7.3, 6.2);
      return;
    }
    k.add(Bc(6, 0.3, 10, 0.12), '#2e3450', 0, 0.15, 4.6);
    for (const x of [-3, 3]) k.add(Bc(0.12, 0.12, 10, 0.03), '#6ae0ff', x, 0.34, 4.6, { glow: true });
    for (const z of [1, 4.6, 8.2]) k.add(K.ball(0.4), '#6ae0ff', 0, 0.6, z, { glow: true });
    return { pulse: true };
  }
  // thuyền ngoài khơi (bập bềnh): xuồng độc mộc → thuyền buồm → tàu hơi nước → tàu máy → tàu lướt sóng → thuyền bay sáng
  function boat(k, o) {
    const t = tier(o.lv, [2, 4, 5, 6, 8, 9]),
      b = k.sub('hull', [0, 0, 0]);
    if (t <= 1) {
      b.add(
        K.lathe(
          [
            [0.001, -2],
            [0.45, -1.4],
            [0.55, 0],
            [0.45, 1.4],
            [0.001, 2],
          ],
          6,
        ),
        C.wood,
        0,
        0.1,
        0,
        { rot: [Math.PI / 2, 0, 0], sc: [1, 1, 0.55] },
      );
      b.add(Bc(0.7, 0.06, 2.6, 0.02), C.woodL, 0, 0.32, 0);
      if (t === 1) b.add(K.post(0.03, 2, 4), C.woodL, 0.5, 0.3, 0.3, { rot: [0.9, 0, 0.3] });
    } else if (t === 2) {
      b.add(
        K.lathe(
          [
            [0.001, -2.6],
            [0.8, -1.6],
            [1, 0],
            [0.8, 1.8],
            [0.001, 2.6],
          ],
          8,
        ),
        C.wood,
        0,
        0.15,
        0,
        { rot: [Math.PI / 2, 0, 0], sc: [1, 1, 0.6] },
      );
      b.add(K.post(0.06, 4.4, 5), C.woodL, 0, 0.3, 0);
      b.add(Bc(0.05, 3.4, 2.4, 0.01), '#f2e6c8', 0, 2.5, -0.8);
    } else if (t === 3) {
      b.add(B(2, 0.9, 6, 0.2), '#3a3a3e', 0, -0.4, 0);
      b.add(B(1.6, 1.2, 2.4, 0.06), '#e6d6b8', 0, 0.5, -0.6);
      b.add(K.post(0.25, 1.6, 8), '#b8462e', 0, 1.7, 0.2);
      b.add(K.post(0.27, 0.2, 8), C.dark, 0, 3.3, 0.2);
    } else if (t === 4) {
      b.add(B(2.4, 1, 7, 0.25), C.white, 0, -0.4, 0);
      b.add(Bc(2.42, 0.18, 7.02, 0.04), '#3f7fb8', 0, 0.2, 0);
      b.add(B(1.8, 1.4, 2.8, 0.1), C.white, 0, 0.6, -1);
      b.add(Bc(1.82, 0.4, 0.06, 0.02), C.glass, 0, 1.5, 0.42);
    } else if (t === 5) {
      b.add(B(1.8, 0.7, 6, 0.3), '#e2e0da', 0, 0.3, 0);
      b.add(B(1.3, 0.6, 2.4, 0.2), '#2f4a6b', 0, 1, -0.2);
      for (const x of [-0.8, 0.8]) b.add(Bc(0.08, 0.8, 1.6, 0.02), '#9aa4ae', x, 0, 0.8, { rot: [0.3, 0, 0] });
    } else {
      b.add(K.ball(1, 1), '#d6d2e0', 0, 1.4, 0, { sc: [1.4, 0.45, 2.4] });
      b.add(K.disc(1.4, 16), '#6ae0ff', 0, 0.9, 0, { glow: true });
    }
    return { bob: [['hull', t >= 6 ? 0.35 : 0.12, t >= 6 ? 0.5 : 0.9]] };
  }
  // nhà trong rừng: lều lá của thợ săn → nhà gỗ tiều phu có đống củi → xưởng cưa → trạm kiểm lâm → nhà trên cây phát sáng
  function lodge(k, o) {
    const t = tier(o.lv, [2, 5, 7, 9]);
    if (t === 0) {
      for (let i = 0; i < 6; i++) k.add(K.post(0.05, 2.6, 4), C.woodL, -1.2 + i * 0.5, 0, -0.6, { rot: [-0.7, 0, 0] });
      k.add(Bc(3.2, 0.06, 2.3, 0.02), C.hide[0], 0, 1, 0.1, { rot: [-0.7, 0, 0] });
      k.add(K.cone(0.3, 0.6, 5), '#ff9a2e', 0, 0, 2, { glow: true });
      for (let i = 0; i < 5; i++) {
        const a = i * 1.26;
        k.add(K.ball(0.16), C.stone[1], Math.cos(a) * 0.5, 0.05, 2 + Math.sin(a) * 0.5);
      }
      return;
    }
    if (t === 1) {
      k.add(B(3.6, 2.2, 3, 0.1), '#8a5a36', 0, 0, 0);
      k.add(K.roof(4.2, 1.3, 3.6, 0.1, 4, 0.3), C.thatchD, 0, 2.2, 0);
      k.add(B(0.8, 1.6, 0.1, 0.02), C.dark, 0, 0, 1.52);
      for (let i = 0; i < 6; i++)
        k.add(K.post(0.18, 1.6, 6), C.woodL, 2.6, 0.18 + (i % 3) * 0.34, -0.8 + Math.floor(i / 3) * 0.36 + (i % 3) * 0.02, {
          rot: [0, 0, Math.PI / 2],
        });
      return;
    }
    if (t === 2) {
      k.add(B(5, 2.8, 3.4, 0.08), '#9a7350', 0, 0, 0);
      k.add(K.roof(5.6, 1.2, 4, 0.1, 5.4, 0.3), '#6a6a6a', 0, 2.8, 0);
      const w = k.sub('wheel', [-3, 1.3, 0.4]);
      w.add(new window.THREE.CylinderGeometry(1.2, 1.2, 0.25, 10).rotateZ(Math.PI / 2), C.wood, 0, 0, 0);
      for (let i = 0; i < 6; i++) w.add(Bc(0.3, 2.5, 0.08, 0.02), C.woodL, 0, 0, 0, { rot: [(i * Math.PI) / 6, 0, 0] });
      for (let i = 0; i < 4; i++) k.add(K.post(0.22, 3, 6), C.woodL, 1, 0.22, 2.4 + i * 0.1, { rot: [0, 0, Math.PI / 2] });
      return { spin: [['wheel', 'x', 0.8]] };
    }
    if (t === 3) {
      k.add(B(4, 2.8, 3, 0.08), C.concrete[0], 0, 0, 0);
      k.add(B(4.2, 0.2, 3.2, 0.04), '#3a6a4a', 0, 2.8, 0);
      k.add(Bc(3, 0.6, 0.06, 0.02), C.glass, 0, 1.8, 1.52);
      k.add(K.post(0.05, 4, 4), C.steel, 1.5, 3, -1);
      const d = k.sub('dish', [1.5, 6.8, -1]);
      d.add(
        K.lathe(
          [
            [0.001, 0],
            [0.7, 0.15],
            [0.8, 0.35],
          ],
          10,
        ),
        C.white,
        0,
        0,
        0,
        { rot: [1.2, 0, 0] },
      );
      return { spin: [['dish', 'y', 0.4]] };
    }
    k.add(
      K.lathe(
        [
          [0.7, 0],
          [0.45, 0.4],
          [0.4, 4],
          [0.6, 4.6],
        ],
        8,
      ),
      '#6b5038',
      0,
      0,
      0,
    );
    k.add(K.ball(1.6, 1), '#9fe0c0', 0, 5.6, 0, { sc: [1, 0.8, 1] });
    k.add(K.ball(0.35), '#ffe9a8', 0, 5.4, 1.45, { glow: true });
    for (let i = 0; i < 5; i++)
      k.add(K.ball(1), '#5a9646', Math.cos(i * 1.25) * 1.8, 7 + (i % 2) * 0.5, Math.sin(i * 1.25) * 1.8, { sc: [1.2, 0.8, 1.2] });
    return { pulse: true };
  }
  // tháp canh trên đồi, bìa rừng: ụ đá → chòi gỗ → tháp đá → tháp ra-đa → tháp pha lê
  function watch(k, o) {
    const t = tier(o.lv, [2, 4, 7, 9]);
    if (t === 0) {
      for (let i = 0; i < 5; i++)
        k.add(K.ball(0.7 - i * 0.1), pick(C.stone, i * 0.4), (i % 2) * 0.1, 0.4 + i * 0.75, 0, { sc: [1.2, 0.75, 1.1] });
      k.add(K.post(0.04, 1.4, 4), C.wood, 0, 3.6, 0);
      k.add(Bc(0.6, 0.4, 0.03, 0.01), C.paint, 0.3, 4.6, 0);
      return;
    }
    if (t === 1) {
      for (const [x, z] of [
        [-1, -1],
        [1, -1],
        [-1, 1],
        [1, 1],
      ])
        k.add(K.post(0.1, 5, 5), C.wood, x, 0, z);
      k.add(B(2.6, 0.15, 2.6, 0.03), C.woodL, 0, 5, 0);
      k.add(K.roof(3, 1.3, 3, 0.1, 0.2, 0.2), C.thatch[1], 0, 6.4, 0);
      for (const sz of [-1, 1]) k.add(Bc(2.6, 0.5, 0.06, 0.02), C.woodL, 0, 5.4, sz * 1.25);
      return;
    }
    if (t === 2) {
      k.add(
        K.lathe(
          [
            [1.6, 0],
            [1.4, 6],
            [1.8, 6.2],
            [1.8, 7.2],
            [0.001, 7.3],
          ],
          10,
        ),
        C.stone[0],
        0,
        0,
        0,
      );
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        k.add(B(0.4, 0.5, 0.4, 0.04), C.stone[2], Math.cos(a) * 1.6, 7.2, Math.sin(a) * 1.6);
      }
      k.add(B(0.7, 1.4, 0.1, 0.02), C.dark, 0, 0, 1.5);
      return;
    }
    if (t === 3) {
      k.add(K.post(0.6, 8, 8, 0.35), C.concrete[1], 0, 0, 0);
      k.add(K.ball(1.4, 1), C.white, 0, 9, 0);
      const d = k.sub('radar', [0, 10.6, 0]);
      d.add(Bc(3.2, 0.5, 0.15, 0.04), C.steel, 0, 0, 0);
      return { spin: [['radar', 'y', 1.2]] };
    }
    k.add(K.cone(1.3, 10, 6), '#bfe3ff', 0, 0, 0, { glow: true });
    k.add(K.cone(0.7, 6, 6), '#e6f6ff', 1.2, 0, 0.6, { glow: true });
    return { pulse: true };
  }
  // đền giữa rừng: vòng đá thiêng → miếu nhỏ → chùa ba tầng → đài thiên văn → vòng sáng lơ lửng
  function shrineF(k, o) {
    const t = tier(o.lv, [2, 5, 7, 9]);
    if (t === 0) {
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * Math.PI * 2;
        k.add(B(0.55, 1.6 + (i % 2) * 0.5, 0.4, 0.1), pick(C.stone, i * 0.5), Math.cos(a) * 2.4, 0, Math.sin(a) * 2.4, { rot: [0, -a, 0] });
      }
      k.add(K.disc(1, 8), C.ochre, 0, 0.05, 0);
      return;
    }
    if (t === 1) {
      k.add(B(3, 0.5, 3, 0.06), C.stone[1], 0, 0, 0);
      for (const [x, z] of [
        [-1.1, -1.1],
        [1.1, -1.1],
        [-1.1, 1.1],
        [1.1, 1.1],
      ])
        k.add(K.post(0.12, 2, 6), C.paint, x, 0.5, z);
      k.add(K.roof(3.6, 1.2, 3.6, 0.12, 0.4, 0.4, 0.4), C.tile, 0, 2.5, 0);
      k.add(B(0.8, 0.8, 0.6, 0.04), C.gold, 0, 0.5, 0);
      return;
    }
    if (t === 2) {
      for (let f = 0; f < 3; f++) {
        const s = 1 - f * 0.22;
        k.add(B(3 * s, 1.4, 3 * s, 0.06), f ? '#c94f3a' : C.lime, 0, f * 1.9, 0);
        k.add(K.roof(4.2 * s, 0.6, 4.2 * s, 0.08, 2.8 * s, 2.8 * s, 0.35), C.tileD, 0, f * 1.9 + 1.4, 0);
      }
      k.add(K.post(0.06, 1.2, 5), C.gold, 0, 5.7, 0);
      return;
    }
    if (t === 3) {
      k.add(K.post(2.2, 2.6, 12), C.white, 0, 0, 0);
      k.add(K.ball(2.2, 1), '#dfe4ea', 0, 2.6, 0, { sc: [1, 0.85, 1] });
      k.add(Bc(0.5, 2.6, 0.2, 0.02), C.dark, 0, 3.3, 2, { rot: [0.5, 0, 0] });
      return;
    }
    const r = k.sub('ring', [0, 3.5, 0]);
    r.add(new window.THREE.TorusGeometry(2.2, 0.18, 6, 24), '#c8a8ff', 0, 0, 0, { glow: true });
    k.add(K.ball(0.6), '#fff0b0', 0, 3.5, 0, { glow: true });
    k.add(K.disc(2.6, 12), '#6a6a88', 0, 0.05, 0);
    return { spin: [['ring', 'y', 0.6]], pulse: true };
  }
  // ngọn lửa hiệu, hải đăng ở mũi đảo: đài lửa → hải đăng sọc có đèn quay → cột tia sáng
  function beacon(k, o) {
    const t = tier(o.lv, [4, 8]);
    if (t === 0) {
      k.add(
        K.lathe(
          [
            [1.4, 0],
            [1.1, 3],
            [1.4, 3.2],
            [1.3, 3.6],
            [0.001, 3.6],
          ],
          8,
        ),
        C.stone[1],
        0,
        0,
        0,
      );
      k.add(K.cone(0.7, 1.4, 6), '#ff9a2e', 0, 3.6, 0, { glow: true });
      return;
    }
    if (t === 1) {
      for (let i = 0; i < 4; i++) k.add(K.post(1.1 - i * 0.1, 2, 10, 1.0 - i * 0.1), i % 2 ? '#c94f3a' : C.white, 0, i * 2, 0);
      k.add(B(2, 0.2, 2, 0.04), C.dark, 0, 8, 0);
      k.add(K.post(0.6, 1.2, 8), '#ffe07a', 0, 8.2, 0, { glow: true });
      k.add(K.cone(0.8, 0.8, 8), '#c94f3a', 0, 9.4, 0);
      const L = k.sub('lamp', [0, 8.8, 0]);
      L.add(Bc(0.12, 0.12, 4, 0.02), '#fff6c0', 0, 0, 2, { glow: true });
      return { spin: [['lamp', 'y', 1]] };
    }
    k.add(K.post(0.5, 10, 6, 0.3), '#2e3450', 0, 0, 0);
    k.add(K.post(0.2, 12, 6, 0.05), '#6ae0ff', 0, 10, 0, { glow: true });
    return { pulse: true };
  }
  // trại ngoài làng: bụi quả dại → vườn cây ăn quả → nhà kính → cánh đồng hoa năng lượng
  function farmOut(k, o) {
    const t = tier(o.lv, [2, 6, 8]);
    if (t === 0) {
      for (let i = 0; i < 9; i++) {
        k.add(K.ball(0.7, 1), '#4f8a3f', (i % 3) * 2 - 2, 0.5, Math.floor(i / 3) * 2 - 2);
        k.add(K.ball(0.14), '#c0304a', (i % 3) * 2 - 1.6, 0.9, Math.floor(i / 3) * 2 - 1.6);
      }
      return;
    }
    if (t === 1) {
      for (let i = 0; i < 9; i++) {
        const x = (i % 3) * 2.6 - 2.6,
          z = Math.floor(i / 3) * 2.6 - 2.6;
        k.add(K.post(0.12, 1.2, 5), '#6b5038', x, 0, z);
        k.add(K.ball(1, 1), i % 2 ? '#5a9646' : '#4f8a3f', x, 1.9, z, { sc: [1, 0.85, 1] });
        for (let j = 0; j < 3; j++) k.add(K.ball(0.13), '#e8a03a', x + Math.cos(j * 2) * 0.8, 1.7, z + Math.sin(j * 2) * 0.8);
      }
      k.add(B(7.6, 0.6, 0.15, 0.02), C.woodL, 0, 0, -4);
      return;
    }
    if (t === 2) {
      for (let i = 0; i < 3; i++) {
        k.add(B(2, 0.3, 6, 0.04), C.concrete[1], -2.6 + i * 2.6, 0, 0);
        k.add(K.roof(2, 1.6, 6, 0.04, 0.2, 6), '#bfe6f0', -2.6 + i * 2.6, 0.3, 0);
      }
      return;
    }
    for (let i = 0; i < 12; i++) {
      const x = (i % 4) * 2 - 3,
        z = Math.floor(i / 4) * 2.4 - 2.4;
      k.add(K.post(0.06, 1.4, 4), C.steel, x, 0, z);
      k.add(K.disc(0.7, 6), '#3a6ad0', x, 1.45, z, { rot: [0.5, 0, 0] });
    }
    k.add(K.ball(0.3), '#6ae0ff', 0, 2.4, 0, { glow: true });
    return { pulse: true };
  }
  // ngoài khơi: tuabin gió trên biển → vườn nổi → khối pha lê nổi
  function offshore(k, o) {
    const t = tier(o.lv, [9, 11]);
    if (t === 0) {
      k.add(K.post(0.7, 1.2, 8), '#d4a63a', 0, -1, 0);
      k.add(K.post(0.3, 12, 8, 0.2), C.white, 0, 0, 0);
      const r = k.sub('rotor', [0, 12, 0.5]);
      for (let i = 0; i < 3; i++) r.add(Bc(0.3, 5, 0.12, 0.04), C.white, 0, 0, 0, { rot: [0, 0, (i * Math.PI * 2) / 3], sc: [1, 1, 1] });
      r.add(K.ball(0.4), C.white, 0, 0, 0);
      return { spin: [['rotor', 'z', 1.4]] };
    }
    if (t === 1) {
      const g = k.sub('raft', [0, 0, 0]);
      g.add(K.disc(4, 14), '#7fbf7a', 0, 0.2, 0);
      for (let i = 0; i < 6; i++) g.add(K.ball(0.8, 1), '#5a9646', Math.cos(i) * 2.4, 0.7, Math.sin(i) * 2.4);
      g.add(K.ball(0.4), '#ffe9a8', 0, 0.8, 0, { glow: true });
      return { bob: [['raft', 0.15, 0.6]] };
    }
    const c = k.sub('gem', [0, 3, 0]);
    c.add(K.cone(1.4, 3.2, 5), '#c8a8ff', 0, 0, 0, { glow: true });
    c.add(K.cone(1.4, 2, 5), '#e6d6ff', 0, 0, 0, { rot: [Math.PI, 0, 0], glow: true });
    return { bob: [['gem', 0.6, 0.4]], pulse: true };
  }

  const NAMES = {
    dock: ['Bãi đá và bè gỗ', 'Bến gỗ', 'Cảng đá có cần cẩu', 'Cảng công-te-nơ', 'Bến nổi phát sáng'],
    boat: ['Xuồng độc mộc', 'Thuyền chèo', 'Thuyền buồm', 'Tàu hơi nước', 'Tàu máy', 'Tàu lướt sóng', 'Thuyền bay'],
    lodge: ['Lều thợ săn', 'Nhà tiều phu', 'Xưởng cưa', 'Trạm kiểm lâm', 'Nhà trên cây'],
    watch: ['Ụ đá dẫn đường', 'Chòi canh', 'Tháp đá', 'Tháp ra-đa', 'Tháp pha lê'],
    shrineF: ['Vòng đá thiêng', 'Miếu trong rừng', 'Chùa ba tầng', 'Đài thiên văn', 'Vòng sáng'],
    beacon: ['Đài lửa hiệu', 'Hải đăng', 'Cột tia sáng'],
    farmOut: ['Bụi quả dại', 'Vườn cây ăn quả', 'Nhà kính', 'Đồng hoa năng lượng'],
    offshore: ['Tuabin gió ngoài khơi', 'Vườn nổi', 'Khối pha lê nổi'],
  };
  const CUTS = {
    dock: [2, 5, 7, 9],
    boat: [2, 4, 5, 6, 8, 9],
    lodge: [2, 5, 7, 9],
    watch: [2, 4, 7, 9],
    shrineF: [2, 5, 7, 9],
    beacon: [4, 8],
    farmOut: [2, 6, 8],
    offshore: [9, 11],
  };
  const BUILD = { dock, boat, lodge, watch, shrineF, beacon, farmOut, offshore };
  // món ngoài làng của mỗi thời (từ cấp nào có món nào)
  const SPOTS = [
    { kind: 'dock', outer: 'coast', a: 0.45, slot: 'dock', from: 1, clear: 3 },
    { kind: 'boat', outer: 'sea', a: 0.3, slot: 'boat', from: 1, clear: 3 },
    { kind: 'boat', outer: 'sea', a: -0.55, slot: 'boat2', from: 4, clear: 3 },
    { kind: 'lodge', outer: 'forest', a: -1.35, slot: 'lodge', from: 1, clear: 3 },
    { kind: 'farmOut', outer: 'forest', a: 1.3, slot: 'farmOut', from: 1, clear: 5 },
    { kind: 'watch', outer: 'forest', a: 2.2, slot: 'watch', from: 1, clear: 2.5 },
    { kind: 'shrineF', outer: 'forest', a: -2.3, slot: 'shrineF', from: 1, clear: 3 },
    { kind: 'beacon', outer: 'coast', a: -0.95, slot: 'beacon', from: 3, clear: 2.5 },
    { kind: 'offshore', outer: 'sea', a: 0.95, slot: 'offshore', from: 6, clear: 4 },
    { kind: 'offshore', outer: 'sea', a: -1.3, slot: 'offshore2', from: 7, clear: 4 },
  ];
  // thêm các món ngoài làng vào bố cục của một thời: xen giữa danh sách (sau nhà chính, cứ vài công trình làng lại một món)
  // để thợ dựng dần ra khắp đảo; tint: bảng màu riêng của đảo (các đảo khác dùng lại, render/build/isles/compose.js)
  function addTo(E, lv, tint) {
    let at = Math.max(1, E.pieces.findIndex((x) => x.kind === 'hall') + 2);
    for (const S of SPOTS) {
      if (lv < S.from) continue;
      E.pieces.splice(Math.min(at, E.pieces.length), 0, Object.assign({ x: 0, z: 0, lv, tint: tint || null }, S));
      at += 4;
      if (!E.BUILD[S.kind]) E.BUILD[S.kind] = BUILD[S.kind];
      E.NAME[S.kind] = NAMES[S.kind][tier(lv, CUTS[S.kind])];
    }
  }
  for (let lv = 1; lv <= 12; lv++) if (P.ERA[lv]) addTo(P.ERA[lv], lv);
  P.OUTER = { SPOTS, BUILD, NAMES, addTo };
})(typeof self !== 'undefined' ? self : globalThis);
