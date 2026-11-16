/* Bể Kính · render/blocks/shapes/workshop.js · Hình khối Xưởng xe (render/blocks/blocks.js)
 * Người chơi chốt: xưởng xe lớn, đẹp, nhiều chi tiết. Khối 10 × 9 (bệ 9,6 × 8,6), mặt trước +z:
 *   phía sau   xưởng chính (MAIN) cửa rất rộng cho xe ra vào, nhà phụ bên trái (ANNEX: lán đồ nghề, lò rèn, kho, phòng máy)
 *   phía trước sân xưởng: bên phải cỗ máy chiến tranh của thời đó đang đỗ, bên trái đống vật liệu, bàn thợ, bánh xe dựng; thợ
 *   bậc 0 gỗ tre    nhà kho gỗ cửa hai cánh mở, lán đồ nghề, cần trục chữ A, xe phá cổng có mái che, đống gỗ, bàn cưa
 *   bậc 1 đá        xưởng đá cửa vòm, lò rèn có ống khói và lửa, máy bắn đá (cần, đối trọng), đống đạn đá, bánh xe
 *   bậc 2 gạch thép nhà máy mái răng cưa, hai ống khói, cửa cuốn kéo lên nửa, giàn cẩu, xe tăng, thùng dầu
 *   bậc 3 tương lai nhà chứa, cửa sáng, phòng máy, tay máy, xe tăng bay trên bãi có vành sáng, máy bay nhỏ
 *   bậc 4 huyền ảo  xưởng vòm kính có sườn sáng, cổng không gian, hai bánh răng bay quay, xe bay (render/blocks/mythic.js)
 * Tường, mái, bệ theo đảo (render/blocks/style.js). */
(function (root) {
  const BK = root.BK;
  const K = () => BK.BuildKit;
  const MAIN = { x: 0.6, z: -1.8, w: 6.2, d: 4.0 },
    ANNEX = { x: -3.4, z: -2.3, w: 2.4, d: 3.0 },
    ZF = MAIN.z + MAIN.d / 2, // mặt trước xưởng chính
    DW = 3.4; // bề ngang cửa lớn
  /* ---------- mảnh riêng của xưởng ---------- */
  // bánh xe: vành, nan chữ thập, trục (rot: hướng mặt bánh)
  function wheel(k, P, t, x, y, z, r, rot) {
    const B = K(),
      fut = t >= 3;
    k.add(new root.THREE.TorusGeometry(r, r * 0.14, 5, 14), fut ? P.glow : P.trim, x, y, z, { rot, glow: fut });
    k.add(B.box(r * 1.9, r * 0.12, r * 0.12, 0.01), P.wall2, x, y, z, { rot });
    k.add(B.box(r * 0.12, r * 1.9, r * 0.12, 0.01), P.wall2, x, y, z, { rot });
    k.add(B.post(r * 0.2, r * 0.3, 6), P.metal, x, y, z, { rot: [rot[0] + Math.PI / 2, rot[1], rot[2]] });
  }
  // cửa lớn: ô cửa tối (thấy lòng xưởng), khung, lanh tô; t0/t1 hai cánh mở xoè ra ngoài; t2 cửa cuốn kéo lên nửa; t3 viền sáng
  function bigDoor(k, P, t, y0) {
    const B = K(),
      h = 2.5;
    k.add(B.box(DW, h, 0.1, 0.01, true), '#15110d', MAIN.x, y0, ZF + 0.01);
    for (const e of [-1, 1]) k.add(B.box(0.18, h + 0.1, 0.2, 0.02, true), t >= 3 ? P.glow : t === 2 ? P.light || '#e8e0d0' : P.trim, MAIN.x + e * (DW / 2 + 0.09), y0, ZF + 0.05, t >= 3 ? { glow: true } : null);
    k.add(B.box(DW + 0.6, 0.22, 0.24, 0.02, true), t === 1 ? P.stone : t >= 3 ? P.glow : P.trim, MAIN.x, y0 + h, ZF + 0.06, t >= 3 ? { glow: true } : null);
    if (t <= 1)
      for (const e of [-1, 1]) {
        // cánh cửa mở xoè: ván dọc, nẹp chéo, bản lề sắt
        const hx = MAIN.x + e * (DW / 2),
          a = e * 1.2,
          cx = hx + (e * Math.cos(1.2) * DW) / 4,
          cz = ZF + (Math.sin(1.2) * DW) / 4;
        k.add(B.box(DW / 2, h - 0.1, 0.1, 0.01, true), t === 0 ? '#7a5232' : '#6a4228', cx, y0, cz, { rot: [0, -a, 0] });
        k.add(B.box(DW / 2 - 0.1, 0.1, 0.04, 0.01), '#4a321e', cx, y0 + h * 0.5, cz + 0.06 * Math.cos(1.2), { rot: [0, -a, e * 0.7] });
        for (const y of [0.4, h - 0.5]) k.add(B.box(0.3, 0.06, 0.12, 0.01), P.metal, hx + e * 0.12, y0 + y, ZF + 0.12, { rot: [0, -a, 0] });
      }
    else if (t === 2) {
      // cửa cuốn kéo lên nửa: các lá ngang, hộp cuốn trên
      for (let i = 0; i < 6; i++) k.add(B.box(DW, 0.16, 0.06, 0.01, true), P.metal, MAIN.x, y0 + h - 0.2 - i * 0.18, ZF + 0.06);
      k.add(B.box(DW + 0.2, 0.3, 0.3, 0.02, true), P.metal, MAIN.x, y0 + h - 0.05, ZF + 0.15);
      for (const e of [-1, 1]) k.add(B.box(0.2, 0.06, 0.05, 0.01), '#e8c040', MAIN.x + e * 1.3, y0 + 0.4, ZF + 0.08); // vạch vàng đen
    }
    // trong lòng xưởng: một bánh xe dựng và ánh đèn
    k.add(B.box(DW - 0.4, 0.06, 0.06, 0.01), t >= 3 ? P.glow : '#ffe2a0', MAIN.x, y0 + h - 0.3, ZF - 0.6, { glow: true });
  }
  // bàn thợ: mặt bàn, bốn chân, đồ nghề trên bàn (cưa, búa)
  function bench(k, P, x, y, z) {
    const B = K();
    k.add(B.box(1.3, 0.08, 0.6, 0.01, true), '#8a6a44', x, y + 0.75, z);
    for (const dx of [-0.55, 0.55]) for (const dz of [-0.22, 0.22]) k.add(B.box(0.07, 0.75, 0.07, 0.01, true), '#5a3c22', x + dx, y, z + dz);
    k.add(B.box(0.5, 0.02, 0.14, 0.01), P.metal, x - 0.2, y + 0.84, z);
    k.add(B.box(0.06, 0.06, 0.3, 0.01), P.metal, x + 0.35, y + 0.85, z);
  }
  // đống gỗ: khúc gỗ tròn nằm chồng dọc trục x
  function lumber(k, x, y, z) {
    const g = new root.THREE.CylinderGeometry(0.13, 0.13, 1.8, 6);
    for (let r = 0; r < 3; r++) for (let i = 0; i < 4 - r; i++) k.add(g, '#8a6038', x, y + 0.13 + r * 0.23, z + (i - (3 - r) / 2) * 0.27, { rot: [0, 0, Math.PI / 2] });
  }
  /* ---------- cỗ máy chiến tranh của từng thời (đỗ ở sân phải, đầu quay ra +z) ---------- */
  function ram(k, P, x, y, z) {
    const B = K();
    k.add(B.box(1.2, 0.1, 2.2, 0.02), P.trim, x, y + 0.4, z);
    for (const dz of [-0.75, 0.75]) for (const s of [-1, 1]) wheel(k, P, 0, x + s * 0.68, y + 0.38, z + dz, 0.36, [0, Math.PI / 2, 0]);
    for (const dx of [-0.5, 0.5]) for (const dz of [-0.9, 0.9]) k.add(B.post(0.05, 1.3, 5), P.trim, x + dx, y + 0.45, z + dz);
    k.add(B.roof(1.5, 0.7, 2.4, 0.03, 0.2, 2.4), P.roof, x, y + 1.75, z); // mái che
    k.add(B.post(0.17, 2.6, 7, 0.17), '#8a6038', x, y + 0.85, z - 1.3, { rot: [Math.PI / 2, 0, 0] });
    k.add(B.cone(0.22, 0.4, 7), P.metal, x, y + 0.85, z + 1.3, { rot: [Math.PI / 2, 0, 0] });
  }
  function catapult(k, P, x, y, z) {
    const B = K();
    k.add(B.box(1.3, 0.14, 2.0, 0.02), P.trim, x, y + 0.35, z);
    for (const dz of [-0.7, 0.7]) for (const s of [-1, 1]) wheel(k, P, 1, x + s * 0.72, y + 0.34, z + dz, 0.32, [0, Math.PI / 2, 0]);
    for (const s of [-1, 1]) {
      k.add(B.box(0.1, 1.6, 0.1, 0.01, true), P.trim, x + s * 0.5, y + 0.42, z - 0.1, { rot: [0.25, 0, 0] });
      k.add(B.box(0.1, 1.6, 0.1, 0.01, true), P.trim, x + s * 0.5, y + 0.42, z + 0.3, { rot: [-0.25, 0, 0] });
    }
    k.add(B.box(1.1, 0.08, 0.08, 0.01), P.metal, x, y + 1.95, z + 0.1);
    k.add(B.box(0.1, 0.1, 2.6, 0.01), '#8a6038', x, y + 1.95, z + 0.5, { rot: [0.55, 0, 0] }); // cần ném
    k.add(B.box(0.55, 0.5, 0.5, 0.03, true), P.stone, x, y + 1.0, z - 0.75); // đối trọng
    k.add(B.lathe([[0.01, 0], [0.25, 0.05], [0.25, 0.15]], 8), '#5a3c22', x, y + 2.55, z + 1.6);
  }
  function tank(k, P, x, y, z) {
    const B = K(),
      c = '#566b46';
    for (const s of [-1, 1]) {
      k.add(B.box(0.4, 0.5, 2.4, 0.08, true), '#2b2b2b', x + s * 0.75, y, z); // xích
      for (let i = 0; i < 4; i++) k.add(B.post(0.17, 0.42, 8), '#444', x + s * 0.75, y + 0.25, z - 0.8 + i * 0.53, { rot: [0, 0, Math.PI / 2] });
    }
    k.add(B.box(1.4, 0.45, 2.2, 0.06, true), c, x, y + 0.42, z);
    k.add(B.box(0.9, 0.4, 1.0, 0.08, true), c, x, y + 0.87, z - 0.15); // tháp pháo
    k.add(B.post(0.07, 1.4, 6), '#3a4a32', x, y + 1.05, z + 0.3, { rot: [Math.PI / 2, 0, 0] });
    k.add(B.box(0.3, 0.12, 0.3, 0.01, true), P.accent, x, y + 1.27, z - 0.3); // nắp có dấu
  }
  function hoverTank(k, P, x, y, z) {
    const B = K(),
      H = BK.Blocks.H;
    k.add(B.post(1.3, 0.06, 16), P.stone, x, y, z);
    H.torus(k, P.glow, 1.2, 0.05, x, y + 0.07, z, { glow: true });
    k.add(B.box(1.4, 0.45, 2.2, 0.12, true), P.wall, x, y + 0.55, z);
    k.add(B.box(1.5, 0.06, 2.3, 0.01, true), P.glow, x, y + 0.5, z, { glow: true });
    k.add(B.box(0.9, 0.38, 1.0, 0.1, true), P.wall2, x, y + 1.0, z - 0.15);
    k.add(B.box(0.1, 0.1, 1.3, 0.01), P.accent, x, y + 1.18, z + 0.55, { glow: true });
  }
  /* ---------- năm bậc ---------- */
  const TIER = [
    // nhà kho gỗ
    (k, P, H) => {
      const B = K(),
        y0 = H.PLINTH,
        h = 3.0;
      H.wall(k, P, 0, { w: MAIN.w, h, d: MAIN.d, x: MAIN.x, y: y0, z: MAIN.z });
      H.roof(k, P, 0, { w: MAIN.w + 0.8, h: 2.0, d: MAIN.d + 0.8, tw: MAIN.w + 0.2, td: 0.3, lift: 0.3, x: MAIN.x, y: y0 + h, z: MAIN.z });
      bigDoor(k, P, 0, y0);
      for (const dx of [-2.5, 2.5]) H.win(k, P, 0, MAIN.x + dx, y0 + 1.6, ZF, 0.5, 0.45);
      // lán đồ nghề: bốn cột, mái, giá công cụ, bánh xe dựng
      for (const dx of [-1.0, 1.0]) for (const dz of [-1.3, 1.3]) k.add(B.post(0.08, 2.0, 5), P.trim, ANNEX.x + dx, y0, ANNEX.z + dz);
      H.roof(k, P, 0, { w: ANNEX.w + 0.5, h: 0.9, d: ANNEX.d + 0.5, tw: ANNEX.w, td: 0.2, x: ANNEX.x, y: y0 + 2.0, z: ANNEX.z });
      bench(k, P, ANNEX.x, y0, ANNEX.z - 0.3);
      wheel(k, P, 0, ANNEX.x - 1.0, y0 + 0.75, ANNEX.z + 0.6, 0.7, [0, Math.PI / 2 - 0.15, 0]);
      // cần trục chữ A có dây và móc
      for (const s of [-1, 1]) k.add(B.box(0.12, 3.4, 0.12, 0.01, true), '#7a5232', -1.4 + s * 0.6, y0, 1.6, { rot: [0, 0, -s * 0.18] });
      k.add(B.box(0.14, 0.14, 2.4, 0.01), '#7a5232', -1.4, y0 + 3.3, 2.3);
      k.add(B.box(0.02, 1.4, 0.02, 0.01, true), '#d8c8a0', -1.4, y0 + 1.9, 3.4);
      k.add(B.box(0.5, 0.4, 0.4, 0.02, true), '#a77b48', -1.4, y0 + 1.5, 3.4);
      ram(k, P, 2.4, y0, 2.4);
      lumber(k, -3.6, y0, 2.4);
      bench(k, P, -3.4, y0, 0.6);
      H.guard(k, P, 0, -2.6, y0, 0.9);
      H.flag(k, P, MAIN.x + 3.0, y0 + h, MAIN.z - 1.6, 2.0, 1.0);
    },
    // xưởng đá có lò rèn
    (k, P, H) => {
      const B = K(),
        y0 = H.PLINTH,
        h = 3.2;
      H.wall(k, P, 1, { w: MAIN.w, h, d: MAIN.d, x: MAIN.x, y: y0, z: MAIN.z });
      H.roof(k, P, 1, { w: MAIN.w + 0.7, h: 1.6, d: MAIN.d + 0.7, tw: MAIN.w - 0.4, td: 0.3, lift: 0.4, x: MAIN.x, y: y0 + h, z: MAIN.z });
      bigDoor(k, P, 1, y0);
      for (const dx of [-2.5, 2.5]) for (const y of [1.0, 2.3]) H.win(k, P, 1, MAIN.x + dx, y0 + y, ZF, 0.4, 0.6);
      // lò rèn: tường, mái, ống khói cao, miệng lò lửa, đe
      H.wall(k, P, 1, { w: ANNEX.w, h: 2.2, d: ANNEX.d, x: ANNEX.x, y: y0, z: ANNEX.z, color: P.wall2 });
      H.roof(k, P, 1, { w: ANNEX.w + 0.4, h: 0.8, d: ANNEX.d + 0.4, tw: 0.3, td: ANNEX.d, x: ANNEX.x, y: y0 + 2.2, z: ANNEX.z });
      k.add(B.box(0.7, 2.6, 0.7, 0.04, true), P.stone, ANNEX.x - 0.6, y0 + 1.6, ANNEX.z - 0.8);
      k.add(B.cone(0.25, 0.5, 6), '#ff9a3a', ANNEX.x - 0.6, y0 + 4.2, ANNEX.z - 0.8, { glow: true });
      k.add(B.box(1.0, 0.7, 0.1, 0.02, true), '#15110d', ANNEX.x, y0, ANNEX.z + 1.51);
      k.add(B.box(0.7, 0.35, 0.06, 0.01), '#ff8a3a', ANNEX.x, y0 + 0.1, ANNEX.z + 1.54, { glow: true });
      k.add(B.box(0.5, 0.3, 0.25, 0.02, true), '#3a3a3a', ANNEX.x + 0.7, y0 + 0.35, ANNEX.z + 2.1); // đe
      k.add(B.box(0.25, 0.35, 0.2, 0.02, true), '#5a4a3a', ANNEX.x + 0.7, y0, ANNEX.z + 2.1);
      catapult(k, P, 2.4, y0, 2.3);
      for (let i = 0; i < 6; i++) k.add(B.ball(0.22, 0), P.stone, -1.2 + (i % 3) * 0.42, y0 + 0.2 + Math.floor(i / 3) * 0.32, 3.3 - (i % 2) * 0.1);
      for (const z of [1.0, 1.5]) wheel(k, P, 1, -3.9, y0 + 0.6, z, 0.55, [0, Math.PI / 2 - 0.2, 0]);
      bench(k, P, -2.6, y0, 2.9);
      H.guard(k, P, 1, -1.6, y0, 1.6);
      H.banner(k, P, MAIN.x, y0 + h - 0.1, ZF, 0.7, 0.3);
    },
    // nhà máy
    (k, P, H) => {
      const B = K(),
        y0 = H.PLINTH,
        h = 3.4;
      H.wall(k, P, 2, { w: MAIN.w, h, d: MAIN.d, x: MAIN.x, y: y0, z: MAIN.z });
      if (H.form(P, 'roof', 2) !== 'native') H.roof(k, P, 2, { w: MAIN.w + 0.4, h: 1.3, d: MAIN.d + 0.4, x: MAIN.x, y: y0 + h, z: MAIN.z });
      else
        for (let i = 0; i < 4; i++) {
          // mái răng cưa: dốc ngắn có kính hướng bắc
          k.add(B.roof(MAIN.w + 0.3, 0.9, 1.0, 0.04, MAIN.w + 0.3, 0.12), P.roof, MAIN.x, y0 + h, MAIN.z - 1.5 + i * 1.0);
          k.add(B.box(MAIN.w, 0.6, 0.04, 0.01), '#cfe3ee', MAIN.x, y0 + h + 0.35, MAIN.z - 1.5 + i * 1.0 - 0.38, { rot: [-0.5, 0, 0] });
        }
      for (const dx of [1.8, 3.0]) {
        k.add(B.post(0.28, 3.4, 8, 0.22), P.wall2, MAIN.x + dx - 1.0, y0 + h, MAIN.z - 1.4); // ống khói
        k.add(B.post(0.32, 0.18, 8), P.dark, MAIN.x + dx - 1.0, y0 + h + 3.4, MAIN.z - 1.4);
      }
      bigDoor(k, P, 2, y0);
      for (const dx of [-2.55, 2.55]) for (const y of [1.0, 2.4]) H.win(k, P, 2, MAIN.x + dx, y0 + y, ZF, 0.6, 0.7);
      H.wall(k, P, 2, { w: ANNEX.w, h: 2.4, d: ANNEX.d, x: ANNEX.x, y: y0, z: ANNEX.z, color: P.wall2 });
      k.add(B.box(ANNEX.w + 0.1, 0.2, ANNEX.d + 0.1, 0.02, true), P.roof, ANNEX.x, y0 + 2.4, ANNEX.z);
      H.door(k, P, ANNEX.x, y0, ANNEX.z + ANNEX.d / 2, 0.7, 1.4, 2);
      H.win(k, P, 2, ANNEX.x, y0 + 1.8, ANNEX.z + ANNEX.d / 2, 0.9, 0.4);
      // giàn cẩu vàng bắc qua sân, móc cẩu
      for (const x of [-2.2, 4.2]) k.add(B.box(0.18, 3.6, 0.18, 0.01, true), '#d8a830', x, y0, 3.6);
      k.add(B.box(6.6, 0.22, 0.24, 0.02, true), '#d8a830', 1.0, y0 + 3.6, 3.6);
      k.add(B.box(0.4, 0.3, 0.4, 0.02, true), '#3a3a3a', 0.4, y0 + 3.3, 3.6);
      k.add(B.box(0.03, 1.4, 0.03, 0.01, true), '#2a2a2a', 0.4, y0 + 1.9, 3.6);
      tank(k, P, 2.6, y0, 2.0);
      for (let i = 0; i < 4; i++) H.barrel(k, P, 2, -3.9 + (i % 2) * 0.5, y0, 1.0 + Math.floor(i / 2) * 0.55);
      for (const [x, z, s] of [[-2.6, 3.4, 0.6], [-2.0, 3.5, 0.45]]) H.crate(k, P, 2, x, y0, z, s);
      H.guard(k, P, 2, -1.2, y0, 2.0);
      H.guard(k, P, 2, 1.2, y0, 3.0);
    },
    // nhà chứa tương lai
    (k, P, H) => {
      const B = K(),
        y0 = H.PLINTH,
        h = 3.2;
      H.wall(k, P, 3, { w: MAIN.w, h, d: MAIN.d, x: MAIN.x, y: y0, z: MAIN.z });
      if (H.form(P, 'roof', 3) !== 'native') H.roof(k, P, 3, { w: MAIN.w + 0.3, h: 1.3, d: MAIN.d + 0.3, x: MAIN.x, y: y0 + h, z: MAIN.z });
      else k.add(B.roof(MAIN.w + 0.4, 1.2, MAIN.d + 0.3, 0.3, MAIN.w * 0.55, MAIN.d), P.roof, MAIN.x, y0 + h, MAIN.z);
      H.lightBox(k, P, 3, MAIN.w + 0.04, 0.1, MAIN.d + 0.04, MAIN.x, y0 + h - 0.15, MAIN.z);
      bigDoor(k, P, 3, y0);
      k.add(B.box(DW - 0.1, 2.4, 0.04, 0.01, true), P.glow, MAIN.x, y0, ZF + 0.1, { glow: true }); // (lòng cửa sáng, trước ô tối)
      for (const dx of [-2.55, 2.55]) H.win(k, P, 3, MAIN.x + dx, y0 + 2.0, ZF, 0.7, 1.4);
      // phòng máy: khối sẫm, dải sáng, ăng-ten
      H.wall(k, P, 3, { w: ANNEX.w, h: 2.6, d: ANNEX.d, x: ANNEX.x, y: y0, z: ANNEX.z, color: P.wall2 });
      for (const y of [0.8, 1.6]) H.lightBox(k, P, 3, ANNEX.w - 0.4, 0.12, 0.06, ANNEX.x, y0 + y, ANNEX.z + ANNEX.d / 2 + 0.02);
      k.add(B.post(0.04, 1.4, 4), P.metal, ANNEX.x, y0 + 2.6, ANNEX.z);
      k.add(B.ball(0.1, 0), P.accent, ANNEX.x, y0 + 4.05, ANNEX.z, { glow: true });
      // tay máy: đế, hai khúc tay, kẹp sáng
      k.add(B.post(0.3, 0.4, 8), P.metal, -1.6, y0, 2.0);
      k.add(B.box(0.18, 1.5, 0.18, 0.02, true), P.wall, -1.6, y0 + 0.4, 2.0, { rot: [0, 0, 0.35] });
      k.add(B.box(0.16, 1.2, 0.16, 0.02, true), P.wall, -2.1, y0 + 1.7, 2.0, { rot: [0, 0, -0.9] });
      k.add(B.box(0.25, 0.1, 0.25, 0.01), P.glow, -1.2, y0 + 2.3, 2.0, { glow: true });
      hoverTank(k, P, 2.4, y0, 2.3);
      for (const [x, y, z] of [[-3.2, 2.6, 2.6], [-0.4, 3.4, 3.4]]) {
        k.add(B.box(0.5, 0.1, 0.5, 0.02), P.wall2, x, y0 + y, z); // máy bay nhỏ
        for (const e of [-1, 1]) H.torus(k, P.glow, 0.15, 0.02, x + e * 0.3, y0 + y + 0.08, z, { glow: true });
      }
      H.guard(k, P, 3, -3.4, y0, 1.0);
    },
    // xưởng huyền ảo
    (k, P, H) => mythic(k, P, H, H.PLINTH),
  ];
  // xưởng huyền ảo: xưởng vòm kính có sườn sáng, cổng không gian trước cửa (vòng sáng đứng, lòng cổng sáng), hai bánh răng bay
  // quay, cỗ xe bay lơ lửng, biểu tượng đảo trên nóc
  function mythic(k, P, H, y0) {
    const B = K(),
      T = root.THREE;
    H.wall(k, P, 4, { w: MAIN.w, h: 2.8, d: MAIN.d, x: MAIN.x, y: y0, z: MAIN.z });
    k.add(B.box(MAIN.w + 0.1, 0.14, MAIN.d + 0.1, 0.02, true), P.wall2, MAIN.x, y0 + 2.8, MAIN.z);
    k.add(B.lathe([[1.95, 0], [1.8, 0.7], [1.35, 1.35], [0.65, 1.8], [0.01, 1.9]], 12), P.wall2, MAIN.x, y0 + 2.94, MAIN.z);
    const rib = new T.TorusGeometry(1.9, 0.05, 4, 16, Math.PI);
    for (let i = 0; i < 3; i++) k.add(rib, P.glow, MAIN.x, y0 + 2.94, MAIN.z, { glow: true, rot: [0, (i * Math.PI) / 3, 0] });
    H.crown(k, P, MAIN.x, y0 + 4.85, MAIN.z, 0.9);
    bigDoor(k, P, 3, y0);
    k.add(B.box(DW - 0.1, 2.4, 0.04, 0.01, true), P.glow, MAIN.x, y0, ZF + 0.1, { glow: true }); // (lòng cửa sáng, trước ô tối)
    H.wall(k, P, 4, { w: ANNEX.w, h: 2.2, d: ANNEX.d, x: ANNEX.x, y: y0, z: ANNEX.z, color: P.wall2 });
    H.crown(k, P, ANNEX.x, y0 + 2.2, ANNEX.z, 0.5);
    // cổng không gian: vòng sáng đứng, lòng cổng
    k.add(new T.TorusGeometry(1.2, 0.12, 6, 28), P.accent, 2.5, y0 + 1.45, 2.6, { glow: true, rot: [0, 0.5, 0] });
    k.add(B.post(1.08, 0.04, 20), P.glow, 2.5, y0 + 1.45, 2.6, { glow: true, rot: [Math.PI / 2, 0, -0.5] });
    H.runes(k, P, 2.5, y0, 2.6, 1.3);
    // hai bánh răng bay quay
    const gear = (name, x, y, z, r) => {
      const g = k.sub(name, [x, y, z]);
      g.add(new T.TorusGeometry(r, r * 0.16, 5, 20), P.metal, 0, 0, 0);
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2;
        g.add(B.box(r * 0.22, r * 0.22, r * 0.22, 0.01), P.metal, Math.cos(a) * r * 1.12, Math.sin(a) * r * 1.12, 0, { rot: [0, 0, a] });
      }
      g.add(B.ball(r * 0.25, 0), P.glow, 0, 0, 0, { glow: true });
    };
    gear('spin0', -3.4, y0 + 3.2, -0.4, 0.75);
    gear('spin1', -3.6, y0 + 1.6, 0.9, 0.5);
    // cỗ xe bay lơ lửng
    const c = k.sub('float0', [-1.4, y0 + 0.8, 2.6]);
    c.add(B.ball(0.7, 1), P.wall, 0, 0, 0, { sc: [1.5, 0.45, 0.9] });
    c.add(B.box(0.7, 0.2, 0.5, 0.03), '#9fe8ff', 0.3, 0.25, 0);
    H.torus(c, P.glow, 0.8, 0.04, 0, -0.2, 0, { glow: true });
  }
  BK.Blocks.shape('workshop', (k, P, t, H) => {
    H.plinth(k, P, 9.6, 8.6);
    TIER[t](k, P, H);
  });
})(typeof self !== 'undefined' ? self : globalThis);
