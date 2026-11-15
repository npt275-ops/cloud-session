/* Bể Kính · render/blocks/shapes/barracks.js · Hình khối Nhà lính (render/blocks/blocks.js)
 * Người chơi chốt: nhà lính rộng, nhiều chi tiết, có sân tập. Khối 11 × 9 (bệ 10,6 × 8,6), mặt trước +z:
 *   phía sau   nhà ở của lính (MAIN) bên trái, nhà phụ (SIDE: kho vũ khí, nhà ăn, tháp điều khiển) bên phải
 *   phía trước sân tập rào kín (YARD), cổng sân ở giữa rào trước. Trong sân chia ba khu:
 *              trái: đánh gần (hàng hình nộm, lính tập), giữa: tập hợp (cờ, lửa, giếng, đội hình), phải: bắn xa (hàng bia, vạch bắn,
 *              lính bắn). Dọc rào: giá vũ khí, hòm, thùng.
 *   bậc 0 gỗ tre    nhà dài vách gỗ mái rơm, lán vũ khí mái rơm, chòi canh góc, rào cọc nhọn, lửa trại, trống
 *   bậc 1 đá        doanh trại đá có răng tường, kho vũ khí mái ngói, tháp canh góc, tường đá có vòm cổng sân, giếng, cờ treo
 *   bậc 2 gạch thép doanh trại hai tầng mái tôn, nhà ăn, sân duyệt binh kẻ vạch, bãi vượt chướng ngại, xe tải, bao cát trường bắn
 *   bậc 3 tương lai nhà chứa mái vòm, tháp điều khiển, bãi đáp có xe bay, rào năng lượng, bia ảnh nổi (viền neon: blocks.js) */
(function (root) {
  const BK = root.BK;
  const K = () => BK.BuildKit;
  const MAIN = { x: -1.4, z: -2.85, w: 7.2, d: 2.6 },
    SIDE = { x: 3.95, z: -2.7, w: 2.3, d: 2.9 },
    YARD = { x0: -5.0, x1: 5.0, z0: -1.2, z1: 4.0, gate: 1.1 }; // gate: nửa bề rộng cổng sân
  const MZF = MAIN.z + MAIN.d / 2, // mặt trước nhà chính
    SZF = SIDE.z + SIDE.d / 2;
  /* ---------- đồ trong sân ---------- */
  // hình nộm (đánh gần): cọc, thân, tay ngang, đầu
  function dummy(k, P, t, x, y, z) {
    const B = K(),
      body = t === 3 ? P.wall2 : t === 2 ? '#6b6250' : '#d8c59a';
    k.add(B.post(0.07, 1.15, 5), P.trim, x, y, z);
    k.add(B.box(0.38, 0.5, 0.26, 0.04, true), body, x, y + 0.55, z);
    k.add(B.box(0.85, 0.07, 0.07, 0.01), P.trim, x, y + 0.9, z);
    k.add(B.ball(0.17, 0), t === 3 ? P.glow : body, x, y + 1.25, z, t === 3 ? { glow: true } : null);
  }
  // bia tròn trên giá, mặt về +z
  function target(k, P, t, x, y, z) {
    const B = K(),
      R = [Math.PI / 2, 0, 0],
      g = t === 3 ? { glow: true } : {};
    if (t < 3) for (const s of [-1, 1]) k.add(B.post(0.04, 0.95, 4), P.trim, x + s * 0.3, y, z - 0.1, { rot: [-0.2, 0, 0] });
    else k.add(B.post(0.05, 0.7, 5), P.metal, x, y, z - 0.05);
    k.add(B.post(0.45, 0.06, 12), t === 3 ? P.glow : '#f1ead8', x, y + 1.0, z, Object.assign({ rot: R }, g));
    k.add(B.post(0.28, 0.07, 12), P.accent, x, y + 1.0, z + 0.01, Object.assign({ rot: R }, g));
    k.add(B.post(0.1, 0.08, 8), t === 3 ? P.glow : '#f1ead8', x, y + 1.0, z + 0.02, Object.assign({ rot: R }, g));
  }
  // giá vũ khí dọc trục x: hai cọc, xà, n ngọn giáo dựng nghiêng (bậc 2, 3: giá súng thấp)
  function rack(k, P, t, x, y, z, n) {
    const B = K();
    for (const s of [-1, 1]) k.add(B.post(0.05, 1.1, 5), t === 3 ? P.metal : P.trim, x + s * 0.55, y, z);
    k.add(B.box(1.2, 0.07, 0.07, 0.01), t === 3 ? P.glow : P.trim, x, y + 1.0, z, t === 3 ? { glow: true } : null);
    for (let i = 0; i < n; i++) {
      const xx = x - 0.45 + (0.9 * i) / Math.max(1, n - 1);
      if (t >= 2) {
        k.add(B.box(0.06, 0.95, 0.08, 0.01, true), '#2b2b2b', xx, y + 0.05, z - 0.08, { rot: [0.15, 0, 0] });
        continue;
      }
      k.add(B.post(0.025, 1.6, 4), P.wall2, xx, y, z - 0.1, { rot: [0.12, 0, 0] });
      k.add(B.cone(0.06, 0.22, 4), P.metal, xx, y + 1.58, z + 0.09, { rot: [0.12, 0, 0] });
    }
  }
  // rào quanh sân: hai cạnh bên và cạnh trước (chừa cổng sân); piece(x, z) dựng một đoạn
  function fence(step, piece) {
    const { x0, x1, z0, z1, gate } = YARD;
    for (let x = x0; x <= x1 + 1e-6; x += step) if (Math.abs(x) > gate) piece(x, z1);
    for (let z = z0; z < z1 - 1e-6; z += step) for (const x of [x0, x1]) piece(x, z);
  }
  // đồ chung của sân: ba hình nộm, ba bia và vạch bắn, hai giá vũ khí, hòm và thùng cạnh nhà phụ, lính tập hai khu
  function yard(k, P, t, H) {
    const y0 = H.PLINTH;
    for (const x of [-4.2, -3.2, -2.2]) dummy(k, P, t, x, y0, -0.3);
    for (const x of [2.3, 3.3, 4.3]) target(k, P, t, x, y0, -0.3);
    k.add(K().box(3.0, 0.02, 0.1, 0.01, true), t === 3 ? P.glow : '#f2efe6', 3.3, y0, 2.6, t === 3 ? { glow: true } : null);
    rack(k, P, t, -4.4, y0, 3.4, 4);
    rack(k, P, t, 4.4, y0, 3.4, 4);
    for (const x of [-3.9, -3.4]) H.barrel(k, P, t, x, y0, -0.95);
    H.crate(k, P, t, -4.6, y0, -0.95, 0.5);
    H.crate(k, P, t, -4.6, y0 + 0.5, -0.95, 0.4);
    for (const x of [-3.7, -2.7]) H.guard(k, P, t, x, y0, 0.7); // lính tập đánh gần trước hình nộm
    for (const x of [2.3, 3.3, 4.3]) H.guard(k, P, t, x, y0, 2.9); // lính đứng vạch bắn
  }
  // cổng sân: hai trụ ở hai bên lối vào rào trước, xà ngang và biển
  function yardGate(k, P, t, color, h) {
    const B = K(),
      y0 = BK.Blocks.H.PLINTH,
      g = YARD.gate;
    for (const s of [-1, 1]) k.add(B.box(0.35, h, 0.35, 0.03, true), color, s * g, y0, YARD.z1);
    k.add(B.box(g * 2 + 0.5, 0.25, 0.4, 0.03, true), color, 0, y0 + h, YARD.z1);
    k.add(B.box(1.2, 0.35, 0.05, 0.01), t === 3 ? P.glow : P.accent, 0, y0 + h - 0.42, YARD.z1 + 0.2, t === 3 ? { glow: true } : null);
  }
  const TIER = [
    // trại gỗ
    (k, P, H) => {
      const B = K(),
        y0 = H.PLINTH;
      k.add(B.box(MAIN.w, 1.7, MAIN.d, 0.06, true), P.wall, MAIN.x, y0, MAIN.z);
      for (let i = 0; i < 12; i++) k.add(B.box(0.05, 1.7, 0.05, 0.01), P.wall2, MAIN.x - 3.3 + i * 0.6, y0, MZF + 0.02); // nẹp vách
      k.add(B.roof(MAIN.w + 0.8, 1.5, MAIN.d + 0.9, 0.08, MAIN.w + 0.2, 0.25, 0.45), P.roof, MAIN.x, y0 + 1.7, MAIN.z);
      H.door(k, P, MAIN.x, y0, MZF, 1.0, 1.25);
      for (const dx of [-2.6, -1.4, 1.4, 2.6]) H.win(k, P, 0, MAIN.x + dx, y0 + 0.8, MZF, 0.45, 0.4);
      // lán vũ khí: bốn cột, mái rơm, giá giáo và khiên bên trong
      for (const dx of [-1.0, 1.0]) for (const dz of [-1.2, 1.2]) k.add(B.post(0.08, 1.7, 5), P.trim, SIDE.x + dx, y0, SIDE.z + dz);
      k.add(B.roof(2.8, 0.9, 3.3, 0.06, 2.3, 0.2, 0.3), P.roof, SIDE.x, y0 + 1.7, SIDE.z);
      rack(k, P, 0, SIDE.x, y0, SIDE.z - 0.6, 5);
      for (const dx of [-0.6, 0.1, 0.8]) k.add(B.post(0.3, 0.07, 10), P.accent, SIDE.x + dx, y0 + 0.35, SIDE.z + 0.6, { rot: [1.3, 0, 0] });
      // chòi canh góc trước trái
      const cx = YARD.x0 + 0.5,
        cz = YARD.z1 - 0.5;
      for (const dx of [-0.45, 0.45]) for (const dz of [-0.45, 0.45]) k.add(B.post(0.07, 3.4, 5), P.trim, cx + dx, y0, cz + dz);
      k.add(B.box(1.2, 0.1, 1.2, 0.02, true), P.trim, cx, y0 + 2.1, cz);
      H.rail(k, P.trim, cx - 0.55, cx + 0.55, y0 + 2.2, cz + 0.55, 0.4, 4);
      k.add(B.cone(0.95, 0.8, 4), P.roof, cx, y0 + 3.4, cz, { rot: [0, Math.PI / 4, 0] });
      H.guard(k, P, 0, cx, y0 + 2.2, cz);
      const stake = (x, z) => {
        k.add(B.post(0.08, 1.0, 5), P.trim, x, y0, z);
        k.add(B.cone(0.08, 0.2, 5), P.trim, x, y0 + 1.0, z);
      };
      fence(0.42, stake);
      yardGate(k, P, 0, P.trim, 1.9);
      // giữa sân: lửa trại có khúc gỗ ngồi, trống, cờ
      k.add(B.lathe([[0.45, 0], [0.5, 0.12], [0.35, 0.16]], 8), P.stone, 0, y0, 1.4);
      k.add(B.cone(0.25, 0.5, 6), '#ff9a3a', 0, y0 + 0.1, 1.4, { glow: true });
      for (const a of [0.4, 2.5, 4.4]) k.add(B.post(0.12, 0.9, 6), P.trim, Math.cos(a) * 0.95, y0 + 0.12, 1.4 + Math.sin(a) * 0.95, { rot: [0, a, Math.PI / 2] });
      k.add(B.post(0.3, 0.55, 10), '#a8452c', -1.3, y0, 2.6);
      H.flag(k, P, 0.9, y0, -0.9, 3.6, 1.1);
    },
    // doanh trại đá
    (k, P, H) => {
      const B = K(),
        y0 = H.PLINTH,
        h = 2.2;
      k.add(B.box(MAIN.w, h, MAIN.d, 0.06, true), P.wall, MAIN.x, y0, MAIN.z);
      k.add(B.box(MAIN.w + 0.2, 0.18, MAIN.d + 0.2, 0.03, true), P.wall2, MAIN.x, y0 + h, MAIN.z);
      H.crenels(k, P.wall2, MAIN.x - 3.5, MAIN.x + 3.5, y0 + h + 0.18, MZF - 0.05, 11, 0.38, 0.34, 0.3);
      H.door(k, P, MAIN.x, y0, MZF, 1.1, 1.5);
      for (const dx of [-2.8, -1.8, 1.8, 2.8]) H.win(k, P, 1, MAIN.x + dx, y0 + 1.1, MZF, 0.32, 0.6);
      for (const dx of [-1.0, 1.0]) H.banner(k, P, MAIN.x + dx, y0 + 2.0, MZF, 0.5, 1.0);
      // kho vũ khí mái ngói, khiên treo
      k.add(B.box(SIDE.w, 1.9, SIDE.d, 0.05, true), P.wall2, SIDE.x, y0, SIDE.z);
      k.add(B.roof(SIDE.w + 0.5, 0.9, SIDE.d + 0.5, 0.06, 0.4, SIDE.d, 0.3), P.roof, SIDE.x, y0 + 1.9, SIDE.z);
      H.door(k, P, SIDE.x, y0, SZF, 0.8, 1.3);
      for (const s of [-1, 1]) {
        k.add(B.post(0.3, 0.08, 10), P.accent, SIDE.x + s * 0.75, y0 + 1.3, SZF + 0.04, { rot: [Math.PI / 2, 0, 0] });
        k.add(B.post(0.09, 0.1, 6), P.metal, SIDE.x + s * 0.75, y0 + 1.3, SZF + 0.08, { rot: [Math.PI / 2, 0, 0] });
      }
      // tháp canh góc trước trái
      const cx = YARD.x0 + 0.55,
        cz = YARD.z1 - 0.55;
      k.add(B.box(1.3, 3.4, 1.3, 0.05, true), P.wall2, cx, y0, cz);
      k.add(B.box(1.5, 0.15, 1.5, 0.03, true), P.stone, cx, y0 + 3.4, cz);
      for (const dz of [-0.6, 0.6]) H.crenels(k, P.wall2, cx - 0.55, cx + 0.55, y0 + 3.55, cz + dz, 3, 0.3, 0.3, 0.25);
      H.guard(k, P, 1, cx, y0 + 3.55, cz);
      // tường đá thấp có vòm cổng sân, giếng giữa sân
      fence(0.5, (x, z) => k.add(B.box(0.5, 0.75, 0.45, 0.03, true), P.stone, x, y0, z));
      yardGate(k, P, 1, P.wall2, 2.0);
      for (const s of [-1, 1]) H.torch(k, P, 1, s * (YARD.gate + 0.45), y0 + 0.75, YARD.z1);
      k.add(B.lathe([[0.5, 0], [0.5, 0.55], [0.38, 0.55], [0.38, 0.1]], 10), P.stone, 0, y0, 1.6);
      for (const s of [-1, 1]) k.add(B.post(0.05, 1.2, 4), P.trim, s * 0.42, y0 + 0.55, 1.6);
      k.add(B.roof(1.2, 0.4, 1.0, 0.03, 0.2, 1.0), P.roof, 0, y0 + 1.75, 1.6);
      H.flag(k, P, MAIN.x + 3.4, y0 + h + 0.18, MAIN.z - 0.8, 1.8, 1.1);
    },
    // doanh trại gạch
    (k, P, H) => {
      const B = K(),
        y0 = H.PLINTH,
        hf = 1.3;
      k.add(B.box(MAIN.w, hf * 2, MAIN.d, 0.06, true), P.wall, MAIN.x, y0, MAIN.z);
      k.add(B.box(MAIN.w + 0.1, 0.1, MAIN.d + 0.1, 0.02, true), '#e8e0d0', MAIN.x, y0 + hf, MAIN.z);
      k.add(B.roof(MAIN.w + 0.4, 0.9, MAIN.d + 0.5, 0.05, MAIN.w, 0.3), P.roof, MAIN.x, y0 + hf * 2, MAIN.z);
      for (const dx of [-2.5, 2.5]) k.add(B.box(0.35, 0.9, 0.35, 0.03, true), P.wall2, MAIN.x + dx, y0 + hf * 2 + 0.4, MAIN.z - 0.4);
      for (const dx of [-3.0, -2.2, -1.4, 1.4, 2.2, 3.0]) for (const f of [0, 1]) H.win(k, P, 2, MAIN.x + dx, y0 + 0.5 + f * hf, MZF, 0.42, 0.55);
      H.door(k, P, MAIN.x, y0, MZF, 1.2, 1.1);
      k.add(B.box(1.8, 0.08, 0.7, 0.01), P.roof, MAIN.x, y0 + 1.15, MZF + 0.35, { rot: [0.15, 0, 0] });
      // nhà ăn: một tầng, mái dốc, ống khói, cửa sổ
      k.add(B.box(SIDE.w, 1.6, SIDE.d, 0.05, true), P.wall2, SIDE.x, y0, SIDE.z);
      k.add(B.roof(SIDE.w + 0.4, 0.8, SIDE.d + 0.4, 0.05, 0.3, SIDE.d + 0.4), P.roof, SIDE.x, y0 + 1.6, SIDE.z);
      k.add(B.box(0.3, 0.8, 0.3, 0.02, true), P.stone, SIDE.x + 0.6, y0 + 1.9, SIDE.z - 0.6);
      H.door(k, P, SIDE.x - 0.5, y0, SZF, 0.6, 1.05);
      H.win(k, P, 2, SIDE.x + 0.5, y0 + 0.6, SZF, 0.6, 0.5);
      // rào lưới thép, cổng sân, vạch sân duyệt binh
      fence(0.6, (x, z) => k.add(B.box(0.06, 1.0, 0.06, 0.01, true), P.metal, x, y0, z));
      for (const x of [YARD.x0, YARD.x1]) k.add(B.box(0.03, 0.04, YARD.z1 - YARD.z0, 0.01), P.metal, x, y0 + 0.95, (YARD.z0 + YARD.z1) / 2);
      yardGate(k, P, 2, P.wall2, 2.0);
      k.add(B.box(3.4, 0.02, 2.4, 0.01, true), '#c9c3b2', 0, y0, 1.6);
      for (const z of [0.4, 2.8]) k.add(B.box(3.4, 0.03, 0.07, 0.01, true), '#f2efe6', 0, y0, z);
      // đội hình hai hàng giữa sân, cột cờ
      for (let r = 0; r < 2; r++) for (let i = 0; i < 4; i++) H.guard(k, P, 2, -1.2 + i * 0.8, y0, 1.2 + r * 0.9);
      k.add(B.post(0.06, 3.8, 6), P.metal, 0, y0, -0.6);
      k.add(B.box(1.2, 0.75, 0.04, 0.01), P.accent, 0.64, y0 + 3.2, -0.6);
      // bãi vượt chướng ngại (bên trái thay hình nộm thứ ba): rào thấp, tường leo, khung dây
      for (const z of [1.6, 2.3]) {
        for (const s of [-1, 1]) k.add(B.box(0.06, 0.5, 0.06, 0.01, true), P.trim, -3.6 + s * 0.35, y0, z);
        k.add(B.box(0.8, 0.08, 0.08, 0.01), P.accent, -3.6, y0 + 0.45, z);
      }
      k.add(B.box(1.2, 1.3, 0.25, 0.02, true), '#9a7a50', -2.3, y0, 2.0);
      for (const s of [-1, 1]) k.add(B.post(0.05, 2.0, 5), P.metal, -4.5 + s * 0.0, y0, 2.0 + s * 0.6);
      k.add(B.box(0.05, 0.05, 1.2, 0.01), P.metal, -4.5, y0 + 2.0, 2.0);
      // xe tải đậu cạnh cổng sân, bao cát trước bia
      const tx = 1.7,
        tz = 3.55;
      k.add(B.box(1.2, 0.8, 0.9, 0.04, true), '#4a6040', tx - 0.35, y0 + 0.25, tz);
      k.add(B.box(0.55, 0.65, 0.85, 0.04, true), '#3d5035', tx + 0.55, y0 + 0.25, tz);
      k.add(B.box(0.04, 0.3, 0.7, 0.01), '#bfe0f0', tx + 0.83, y0 + 0.55, tz);
      for (const dx of [-0.6, 0.55]) for (const s of [-1, 1]) k.add(B.post(0.2, 0.12, 10), '#222', tx + dx, y0 + 0.2, tz + s * 0.45, { rot: [Math.PI / 2, 0, 0] });
      for (let i = 0; i < 6; i++) k.add(B.box(0.5, 0.22, 0.3, 0.06, true), '#b9a77a', 2.0 + i * 0.5, y0, 0.5);
      for (let i = 0; i < 5; i++) k.add(B.box(0.5, 0.22, 0.3, 0.06, true), '#b9a77a', 2.25 + i * 0.5, y0 + 0.22, 0.5);
    },
    // trại neon
    (k, P, H) => {
      const B = K(),
        y0 = H.PLINTH;
      // nhà chứa mái vòm (nửa ống nằm dọc trục x), dải sáng uốn theo mái
      k.add(B.box(MAIN.w, 0.6, MAIN.d + 0.2, 0.05, true), P.wall2, MAIN.x, y0, MAIN.z);
      const vault = new root.THREE.CylinderGeometry(1.45, 1.45, MAIN.w, 14, 1, false, 0, Math.PI);
      k.add(vault, P.wall, MAIN.x, y0 + 0.6, MAIN.z, { rot: [0, 0, Math.PI / 2] });
      const arc = new root.THREE.TorusGeometry(1.48, 0.05, 4, 16, Math.PI);
      for (const dx of [-3.0, -1.5, 0, 1.5, 3.0]) k.add(arc, dx === 0 ? P.accent : P.glow, MAIN.x + dx, y0 + 0.6, MAIN.z, { glow: true, rot: [0, Math.PI / 2, 0] });
      H.lightBox(k, P, 3, 2.4, 1.3, 0.06, MAIN.x, y0 + 0.6, MAIN.z + 1.42);
      H.lightBox(k, P, 3, MAIN.w, 0.08, 0.06, MAIN.x, y0 + 0.5, MAIN.z + 1.42);
      // tháp điều khiển: thân thon, dải cửa sáng, đĩa ăng-ten
      k.add(B.box(1.6, 3.6, 1.6, 0.05, true), P.wall2, SIDE.x, y0, SIDE.z);
      k.add(B.box(2.3, 0.9, 2.3, 0.05, true), P.wall, SIDE.x, y0 + 3.6, SIDE.z);
      H.lightBox(k, P, 3, 2.34, 0.4, 2.34, SIDE.x, y0 + 3.85, SIDE.z);
      for (const y of [1.0, 2.0, 3.0]) H.lightBox(k, P, 3, 0.9, 0.12, 0.06, SIDE.x, y0 + y, SIDE.z + 0.82);
      k.add(B.lathe([[0.01, 0], [0.55, 0.25], [0.6, 0.3]], 10), P.metal, SIDE.x + 0.5, y0 + 4.6, SIDE.z, { rot: [0.5, 0, 0] });
      k.add(B.post(0.04, 1.2, 4), P.metal, SIDE.x - 0.6, y0 + 4.5, SIDE.z - 0.6);
      k.add(B.ball(0.09, 0), P.accent, SIDE.x - 0.6, y0 + 5.75, SIDE.z - 0.6, { glow: true });
      // bãi đáp có xe bay đậu
      k.add(B.post(1.4, 0.06, 16), P.stone, 0, y0, 1.7);
      H.torus(k, P.glow, 1.3, 0.05, 0, y0 + 0.07, 1.7, { glow: true });
      k.add(B.ball(0.75, 1), P.wall, 0, y0 + 0.65, 1.7, { sc: [1.4, 0.45, 0.9] });
      k.add(B.box(0.7, 0.2, 0.5, 0.03), '#9fe8ff', 0.25, y0 + 0.9, 1.7);
      H.torus(k, P.accent, 0.8, 0.05, 0, y0 + 0.35, 1.7, { glow: true });
      // rào năng lượng: cột sáng nối thanh sáng, cổng sân
      fence(0.7, (x, z) => k.add(B.box(0.08, 0.9, 0.08, 0.01, true), P.glow, x, y0, z, { glow: true }));
      for (const x of [YARD.x0, YARD.x1]) k.add(B.box(0.03, 0.03, YARD.z1 - YARD.z0, 0.01), P.accent, x, y0 + 0.6, (YARD.z0 + YARD.z1) / 2, { glow: true });
      yardGate(k, P, 3, P.wall2, 2.1);
      for (const x of [-2.6, 2.6]) H.guard(k, P, 3, x, y0, 3.6); // gác cổng sân
      H.flag(k, P, MAIN.x - 3.3, y0 + 0.6, MAIN.z - 1.0, 2.8, 1.0);
    },
  ];
  BK.Blocks.shape('barracks', (k, P, t, H) => {
    H.plinth(k, P, 10.6, 8.6);
    TIER[t](k, P, H);
    yard(k, P, t, H);
  });
})(typeof self !== 'undefined' ? self : globalThis);
