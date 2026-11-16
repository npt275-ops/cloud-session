/* Bể Kính · render/units/siege.js · Cỗ máy chiến tranh của xưởng xe (xe tấn công) theo bậc
 * Cùng một mẫu dùng hai nơi: xưởng xe trưng ở sân (render/blocks/shapes/workshop.js) và đội quân ra trận (render/units/units.js).
 * Mỗi hàm vẽ vào bộ gom k, gốc ở (x, y, z), đầu xe quay về +z; P là bảng màu bậc của đảo; xe mang màu cờ đảo (cờ, nắp).
 *   wheel      bánh xe gỗ/sắt: vành, nan chữ thập, trục (rot: hướng mặt bánh; bậc tương lai: vành sáng)
 *   ram        bậc 1 xe phá cổng: sàn, bốn bánh, mái che, khúc gỗ đầu bịt sắt
 *   catapult   bậc 2 máy bắn đá: sàn, bánh, giá chữ A, cần ném, đối trọng, gàu
 *   tank       bậc 3 xe tăng: xích, thân, tháp pháo, nòng, nắp có dấu
 *   hoverTank  bậc 4 xe tăng bay: bãi đỗ vành sáng, thân, viền sáng đáy, tháp pháo, nòng sáng
 *   golem      bậc 5 cỗ máy huyền ảo: thân đá bay có vân sáng, khối pha lê nòng, vòng chữ cổ, pha lê bay quanh
 *   BY_TIER    hàm theo bậc 0..4
 * Cần: three.js, render/build/kit3d.js, render/blocks/parts.js, render/blocks/mythic.js. */
(function (root) {
  const BK = root.BK;
  const K = () => BK.BuildKit;
  const S = {};
  const team = (P) => (P.flag && P.flag.color) || P.accent; // màu cờ đảo: biết xe của đảo nào
  // bánh xe: vành, nan chữ thập, trục (rot: hướng mặt bánh)
  S.wheel = function (k, P, t, x, y, z, r, rot) {
    const B = K(),
      fut = t >= 3;
    k.add(new root.THREE.TorusGeometry(r, r * 0.14, 5, 14), fut ? P.glow : P.trim, x, y, z, { rot, glow: fut });
    k.add(B.box(r * 1.9, r * 0.12, r * 0.12, 0.01), P.wall2, x, y, z, { rot });
    k.add(B.box(r * 0.12, r * 1.9, r * 0.12, 0.01), P.wall2, x, y, z, { rot });
    k.add(B.post(r * 0.2, r * 0.3, 6), P.metal, x, y, z, { rot: [rot[0] + Math.PI / 2, rot[1], rot[2]] });
  };
  S.ram = function (k, P, x, y, z) {
    const B = K();
    k.add(B.box(1.2, 0.1, 2.2, 0.02), P.trim, x, y + 0.4, z);
    for (const dz of [-0.75, 0.75]) for (const s of [-1, 1]) S.wheel(k, P, 0, x + s * 0.68, y + 0.38, z + dz, 0.36, [0, Math.PI / 2, 0]);
    for (const dx of [-0.5, 0.5]) for (const dz of [-0.9, 0.9]) k.add(B.post(0.05, 1.3, 5), P.trim, x + dx, y + 0.45, z + dz);
    k.add(B.roof(1.5, 0.7, 2.4, 0.03, 0.2, 2.4), P.roof, x, y + 1.75, z); // mái che
    k.add(B.post(0.17, 2.6, 7, 0.17), '#8a6038', x, y + 0.85, z - 1.3, { rot: [Math.PI / 2, 0, 0] });
    k.add(B.cone(0.22, 0.4, 7), P.metal, x, y + 0.85, z + 1.3, { rot: [Math.PI / 2, 0, 0] });
    BK.Blocks.H.flag(k, P, x - 0.5, y + 1.6, z - 1.0, 0.9, 0.5);
  };
  S.catapult = function (k, P, x, y, z) {
    const B = K();
    k.add(B.box(1.3, 0.14, 2.0, 0.02), P.trim, x, y + 0.35, z);
    for (const dz of [-0.7, 0.7]) for (const s of [-1, 1]) S.wheel(k, P, 1, x + s * 0.72, y + 0.34, z + dz, 0.32, [0, Math.PI / 2, 0]);
    for (const s of [-1, 1]) {
      k.add(B.box(0.1, 1.6, 0.1, 0.01, true), P.trim, x + s * 0.5, y + 0.42, z - 0.1, { rot: [0.25, 0, 0] });
      k.add(B.box(0.1, 1.6, 0.1, 0.01, true), P.trim, x + s * 0.5, y + 0.42, z + 0.3, { rot: [-0.25, 0, 0] });
    }
    k.add(B.box(1.1, 0.08, 0.08, 0.01), P.metal, x, y + 1.95, z + 0.1);
    k.add(B.box(0.1, 0.1, 2.6, 0.01), '#8a6038', x, y + 1.95, z + 0.5, { rot: [0.55, 0, 0] }); // cần ném
    k.add(B.box(0.55, 0.5, 0.5, 0.03, true), P.stone, x, y + 1.0, z - 0.75); // đối trọng
    k.add(B.lathe([[0.01, 0], [0.25, 0.05], [0.25, 0.15]], 8), '#5a3c22', x, y + 2.6, z - 0.6); // gàu ở đầu cần nhấc cao
    BK.Blocks.H.flag(k, P, x + 0.6, y + 0.42, z - 0.9, 1.3, 0.5);
  };
  S.tank = function (k, P, x, y, z) {
    const B = K(),
      c = '#566b46';
    for (const s of [-1, 1]) {
      k.add(B.box(0.4, 0.5, 2.4, 0.08, true), '#2b2b2b', x + s * 0.75, y, z); // xích
      for (let i = 0; i < 4; i++) k.add(B.post(0.17, 0.42, 8), '#444', x + s * 0.75, y + 0.25, z - 0.8 + i * 0.53, { rot: [0, 0, Math.PI / 2] });
    }
    k.add(B.box(1.4, 0.45, 2.2, 0.06, true), c, x, y + 0.42, z);
    k.add(B.box(0.9, 0.4, 1.0, 0.08, true), c, x, y + 0.87, z - 0.15); // tháp pháo
    k.add(B.post(0.07, 1.4, 6), '#3a4a32', x, y + 1.05, z + 0.3, { rot: [Math.PI / 2, 0, 0] });
    k.add(B.box(0.3, 0.12, 0.3, 0.01, true), team(P), x, y + 1.27, z - 0.3); // nắp màu cờ đảo
    BK.Blocks.H.flag(k, P, x - 0.3, y + 1.07, z - 0.5, 0.9, 0.45); // cờ trên ăng-ten
  };
  S.hoverTank = function (k, P, x, y, z) {
    const B = K(),
      H = BK.Blocks.H;
    k.add(B.post(1.3, 0.06, 16), P.stone, x, y, z);
    H.torus(k, P.glow, 1.2, 0.05, x, y + 0.07, z, { glow: true });
    k.add(B.box(1.4, 0.45, 2.2, 0.12, true), P.wall, x, y + 0.55, z);
    k.add(B.box(1.5, 0.06, 2.3, 0.01, true), P.glow, x, y + 0.5, z, { glow: true });
    k.add(B.box(0.9, 0.38, 1.0, 0.1, true), P.wall2, x, y + 1.0, z - 0.15);
    k.add(B.box(0.1, 0.1, 1.3, 0.01), P.accent, x, y + 1.18, z + 0.55, { glow: true });
    k.add(B.box(0.95, 0.06, 1.05, 0.01, true), team(P), x, y + 1.38, z - 0.15); // nắp màu cờ đảo
  };
  // cỗ máy huyền ảo: thân đá bay (Kit con 'float…'), nòng pha lê sáng, vòng chữ cổ dưới đất, pha lê bay quanh
  S.golem = function (k, P, x, y, z) {
    const B = K(),
      H = BK.Blocks.H;
    H.runes(k, P, x, y, z, 1.2);
    const f = k.sub('float' + Math.round(x * 10), [x, y + 1.2, z]);
    f.add(B.lathe([[0.01, -0.7], [0.6, -0.35], [0.85, 0], [0.7, 0.4], [0.01, 0.5]], 8), P.stone, 0, 0, 0, { sc: [1, 1, 1.4] });
    f.add(B.box(0.06, 0.5, 0.06, 0.01), P.glow, 0.5, -0.1, 0.6, { glow: true });
    f.add(new root.THREE.OctahedronGeometry(1, 0).scale(0.22, 0.22, 0.9), P.glow, 0, 0.55, 0.5, { glow: true });
    H.crown(f, P, 0, 0.5, -0.4, 0.45);
    H.orbit(k, P, 'spin' + Math.round(x * 10), x, y + 1.3, z, 1.1, 3);
  };
  S.BY_TIER = [S.ram, S.catapult, S.tank, S.hoverTank, S.golem];
  BK.Machines = S;
})(typeof self !== 'undefined' ? self : globalThis);
