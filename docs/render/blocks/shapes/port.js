/* Bể Kính · render/blocks/shapes/port.js · Hình khối Nhà cảng (render/blocks/blocks.js)
 * Người chơi chốt: nhà cảng chỉ xây ở mép biển (KINDS coast: true), máu 7/10. Khối 10 × 9, mặt trước +z quay ra biển:
 *   nửa sau (đất liền) bệ, nhà kho (WARE) mái theo đảo, cần cẩu ở mép bờ, hàng hoá, người khuân vác
 *   nửa trước (mặt nước) cầu tàu trên cọc chìa ra biển, cọc buộc thuyền dọc cầu, một con tàu của thời đó đậu bên phải cầu
 *   bậc 0 gỗ tre    cầu tre trên cọc, nhà thuyền mái rơm, thuyền nan mui cong, lưới phơi, cọc buộc
 *   bậc 1 đá        kè đá, nhà kho mái ngói, cần trục gỗ có ròng rọc, thuyền buồm (cánh buồm màu cờ đảo)
 *   bậc 2 gạch thép cầu tàu bê tông, kho gạch, cần cẩu thép, tàu hơi nước có ống khói sọc màu cờ, chồng công-te-nơ
 *   bậc 3 tương lai bến sáng viền, nhà chứa, cần cẩu tay máy, tàu lướt có đáy sáng, máy bay chở hàng
 *   bậc 4 huyền ảo  cầu tàu bay, thuyền mây buồm sáng lơ lửng trên mặt nước, ngọn hải đăng pha lê có biểu tượng đảo
 * Mặt nước nằm ngoài khối (cảng đặt ở mép biển; trang mẫu vẽ một dải nước trước khối). Cần: blocks.js, parts.js, style.js. */
(function (root) {
  const BK = root.BK;
  const K = () => BK.BuildKit;
  const LAND = { z0: -4.3, z1: 0.1 }, // nửa đất liền
    WARE = { x: -1.8, z: -2.4, w: 5.0, d: 3.0 },
    PIER = { x: 1.4, w: 2.0, z0: 0.1, z1: 4.3 }, // cầu tàu chìa ra biển
    SHIP = { x: 3.7, z: 2.4 }, // tàu đậu bên phải cầu
    WATER = 0; // (mặt nước ngang mặt đất ở mép biển; cọc cầu cắm xuống dưới)
  const flagColor = (P) => (P.flag && P.flag.color) || P.accent;
  // cầu tàu: mặt cầu, cọc chìm xuống nước, cọc buộc thuyền dọc mép phải
  function pier(k, P, t, y0) {
    const B = K(),
      len = PIER.z1 - PIER.z0,
      cz = (PIER.z0 + PIER.z1) / 2;
    k.add(B.box(PIER.w, 0.16, len, 0.02, true), t === 0 ? '#8a6a44' : t === 1 ? P.stone : t === 2 ? '#a8a49a' : P.wall2, PIER.x, y0 - 0.16, cz);
    if (t === 0) for (let z = PIER.z0 + 0.2; z < PIER.z1; z += 0.3) k.add(B.box(PIER.w, 0.02, 0.04, 0.01, true), '#5a3c22', PIER.x, y0, z); // nan tre
    for (let z = PIER.z0 + 0.6; z < PIER.z1; z += 1.2)
      for (const e of [-1, 1]) k.add(B.post(t <= 1 ? 0.1 : 0.14, y0 - WATER + 0.6, 6), t <= 1 ? '#5a3c22' : '#6a6a6a', PIER.x + e * (PIER.w / 2 - 0.1), WATER - 0.6, z);
    for (let z = PIER.z0 + 0.8; z < PIER.z1; z += 1.4) {
      k.add(B.post(0.09, 0.3, 8), t >= 3 ? P.metal : '#3a3a3a', PIER.x + PIER.w / 2 - 0.15, y0, z); // cọc buộc
      k.add(B.post(0.12, 0.05, 8), t >= 3 ? P.glow : '#3a3a3a', PIER.x + PIER.w / 2 - 0.15, y0 + 0.3, z, t >= 3 ? { glow: true } : null);
    }
    if (t >= 3) for (const e of [-1, 1]) k.add(B.box(0.05, 0.04, len, 0.01, true), P.glow, PIER.x + e * (PIER.w / 2 - 0.02), y0, cz, { glow: true });
    // dây buộc từ cọc ra tàu
    k.add(B.box(0.02, 0.02, 1.2, 0.01), '#d8c8a0', SHIP.x - 0.9, y0 + 0.2, SHIP.z - 0.4, { rot: [0, 1.2, 0.15] });
  }
  /* ---------- tàu của từng thời (mũi tàu quay ra +z) ---------- */
  // thân tàu: khối vuốt lật ngược (rộng ở mép boong, hẹp ở đáy), dài d
  const hull = (k, color, x, y, z, w, h, d) => k.add(K().roof(w, h, d, 0.05, w * 0.35, d * 0.7), color, x, y, z, { rot: [Math.PI, 0, 0] });
  const SHIPS = [
    // thuyền nan: thân thấp, mui tre cong ở giữa, mái chèo
    (k, P, x, y, z) => {
      hull(k, '#6a4a2a', x, y + 0.25, z, 0.9, 0.4, 2.6);
      k.add(new root.THREE.CylinderGeometry(0.42, 0.42, 1.1, 10, 1, false, 0, Math.PI), '#c9b27a', x, y + 0.25, z, { rot: [Math.PI / 2, 0, Math.PI / 2] });
      k.add(K().box(0.05, 0.05, 1.6, 0.01), '#8a6a44', x + 0.45, y + 0.35, z - 0.4, { rot: [0.3, 0, 0] });
    },
    // thuyền buồm: thân gỗ, boong, cột buồm, cánh buồm màu cờ đảo có nẹp ngang, cờ đuôi
    (k, P, x, y, z) => {
      hull(k, '#7a5232', x, y + 0.45, z, 1.4, 0.65, 3.6);
      k.add(K().box(1.3, 0.08, 3.2, 0.02, true), '#a07a4e', x, y + 0.45, z);
      k.add(K().post(0.07, 3.4, 6), '#5a3c22', x, y + 0.5, z);
      k.add(K().box(0.06, 2.2, 1.7, 0.01, true), flagColor(P), x, y + 1.3, z + 0.1);
      for (let i = 0; i < 4; i++) k.add(K().box(0.08, 0.04, 1.75, 0.01), '#5a3c22', x, y + 1.4 + i * 0.55, z + 0.1);
      k.add(K().box(1.0, 0.5, 0.9, 0.03, true), '#8a6038', x, y + 0.53, z - 1.2); // lầu lái
    },
    // tàu hơi nước: thân sắt, cabin trắng hai tầng, ống khói sọc màu cờ đảo, cửa sổ tròn
    (k, P, x, y, z) => {
      hull(k, '#2e3440', x, y + 0.55, z, 1.6, 0.75, 4.2);
      k.add(K().box(1.5, 0.08, 3.9, 0.02, true), '#9a2a22', x, y + 0.5, z);
      k.add(K().box(1.2, 0.6, 1.8, 0.04, true), '#f0f0ea', x, y + 0.58, z - 0.6);
      k.add(K().box(0.9, 0.45, 1.0, 0.04, true), '#f0f0ea', x, y + 1.18, z - 0.8);
      for (let i = 0; i < 4; i++) k.add(K().post(0.06, 0.02, 8), '#3a5a7a', x + 0.61, y + 0.85, z - 1.3 + i * 0.45, { rot: [0, 0, Math.PI / 2] });
      k.add(K().post(0.22, 1.0, 10), '#2a2a2a', x, y + 1.6, z - 0.3);
      k.add(K().post(0.225, 0.22, 10), flagColor(P), x, y + 2.25, z - 0.3);
    },
    // tàu lướt: thân thon sẫm, đáy sáng, buồng lái kính, hai cánh lướt
    (k, P, x, y, z) => {
      hull(k, P.wall, x, y + 0.75, z, 1.4, 0.55, 4.0);
      k.add(K().box(1.3, 0.04, 3.6, 0.01, true), P.glow, x, y + 0.2, z, { glow: true });
      k.add(K().ball(0.55, 1), '#9fe8ff', x, y + 0.85, z + 0.4, { sc: [1, 0.55, 1.6] });
      for (const e of [-1, 1]) k.add(K().box(0.9, 0.05, 0.5, 0.01), P.wall2, x + e * 0.95, y + 0.4, z - 0.6, { rot: [0, 0, e * 0.3] });
    },
    // thuyền mây: thân gỗ sáng lơ lửng trên mặt nước, buồm sáng, vòng chữ cổ dưới đáy (Kit con 'float1': nhấp nhô)
    (k, P, x, y, z) => {
      const f = k.sub('float1', [x, y + 1.2, z]);
      hull(f, P.wall, 0, 0.45, 0, 1.3, 0.6, 3.4);
      f.add(K().box(1.2, 0.08, 3.0, 0.02, true), P.wall2, 0, 0.45, 0);
      f.add(K().post(0.06, 2.8, 6), P.metal, 0, 0.5, 0);
      f.add(K().box(0.04, 1.9, 1.5, 0.01, true), P.glow, 0, 1.1, 0.1, { glow: true });
      BK.Blocks.H.torus(f, P.accent, 0.8, 0.04, 0, -0.1, 0, { glow: true });
    },
  ];
  /* ---------- cần cẩu của từng thời (ở mép bờ, cạnh đầu cầu tàu) ---------- */
  function crane(k, P, t, x, y, z) {
    const B = K();
    if (t === 0) {
      // giàn phơi lưới
      for (const e of [-1, 1]) k.add(B.post(0.05, 1.6, 4), '#5a3c22', x + e * 0.8, y, z);
      k.add(B.box(1.7, 0.05, 0.05, 0.01), '#5a3c22', x, y + 1.55, z);
      k.add(B.box(1.5, 1.1, 0.03, 0.01), '#8a7a5a', x, y + 0.95, z);
      return;
    }
    const c = t === 1 ? '#7a5232' : t === 2 ? '#d8a830' : P.wall2;
    k.add(B.box(0.35, 3.4, 0.35, 0.02, true), c, x, y, z);
    k.add(B.box(0.25, 0.25, 3.2, 0.02), c, x, y + 3.3, z + 1.1, { rot: [-0.25, 0, 0] }); // cần vươn ra biển
    k.add(B.box(0.03, 1.6, 0.03, 0.01, true), '#2a2a2a', x, y + 2.0, z + 2.5);
    if (t === 1) k.add(new root.THREE.TorusGeometry(0.45, 0.06, 5, 14), '#7a5232', x - 0.3, y + 0.7, z, { rot: [0, Math.PI / 2, 0] }); // bánh guồng
    if (t >= 3) BK.Blocks.H.torus(k, P.glow, 0.3, 0.04, x, y + 3.4, z, { glow: true });
    k.add(B.box(0.5, 0.4, 0.5, 0.02, true), t >= 3 ? P.wall : '#a77b48', x, y + 1.6, z + 2.5); // kiện hàng treo
  }
  const TIER = [
    // bến tre
    (k, P, H) => {
      const B = K(),
        y0 = H.PLINTH;
      for (const dx of [-2.2, 2.2]) for (const dz of [-1.3, 1.3]) k.add(B.post(0.09, 2.0, 5), P.trim, WARE.x + dx, y0, WARE.z + dz);
      H.roof(k, P, 0, { w: WARE.w + 0.6, h: 1.4, d: WARE.d + 0.6, tw: WARE.w, td: 0.25, lift: 0.4, x: WARE.x, y: y0 + 2.0, z: WARE.z });
      SHIPS[0](k, P, WARE.x, y0, WARE.z); // thuyền kéo lên bờ sửa
      for (let i = 0; i < 3; i++) H.barrel(k, P, 0, -4.2 + i * 0.5, y0, -0.5);
    },
    // bến đá
    (k, P, H) => {
      const B = K(),
        y0 = H.PLINTH;
      H.wall(k, P, 1, { w: WARE.w, h: 2.4, d: WARE.d, x: WARE.x, y: y0, z: WARE.z });
      H.roof(k, P, 1, { w: WARE.w + 0.6, h: 1.2, d: WARE.d + 0.6, tw: WARE.w - 0.6, td: 0.3, lift: 0.4, x: WARE.x, y: y0 + 2.4, z: WARE.z });
      H.door(k, P, WARE.x, y0, WARE.z + WARE.d / 2, 1.4, 1.7, 1);
      for (const dx of [-1.7, 1.7]) H.win(k, P, 1, WARE.x + dx, y0 + 1.3, WARE.z + WARE.d / 2, 0.45, 0.55);
      k.add(B.box(9.6, 0.4, 0.3, 0.03, true), P.stone, 0, y0 - 0.4, LAND.z1 - 0.15); // kè đá mép bờ
      for (const [x, z] of [[-4.2, -0.6], [-3.6, -0.6], [-3.9, -0.1]]) H.crate(k, P, 1, x, y0, z, 0.5);
    },
    // bến bê tông
    (k, P, H) => {
      const B = K(),
        y0 = H.PLINTH;
      H.wall(k, P, 2, { w: WARE.w, h: 2.8, d: WARE.d, x: WARE.x, y: y0, z: WARE.z });
      H.roof(k, P, 2, { w: WARE.w + 0.4, h: 0.9, d: WARE.d + 0.4, tw: WARE.w, td: 0.3, x: WARE.x, y: y0 + 2.8, z: WARE.z });
      H.door(k, P, WARE.x - 0.8, y0, WARE.z + WARE.d / 2, 1.8, 2.0, 2);
      for (const dx of [1.0, 2.0]) H.win(k, P, 2, WARE.x + dx, y0 + 1.6, WARE.z + WARE.d / 2, 0.6, 0.7);
      k.add(B.box(9.6, 0.4, 0.3, 0.03, true), '#a8a49a', 0, y0 - 0.4, LAND.z1 - 0.15);
      // công-te-nơ chồng màu
      [['#c8402f', 0], ['#2a6aa8', 0], [flagColor(P), 1]].forEach(([c, lv], i) => {
        const x = -4.0 + (lv ? 0.7 : i * 1.4);
        k.add(B.box(1.3, 0.75, 0.75, 0.02, true), c, x, y0 + lv * 0.75, -0.55);
        for (let j = 0; j < 5; j++) k.add(B.box(0.03, 0.7, 0.02, 0.01, true), '#3a3a3a', x - 0.5 + j * 0.25, y0 + lv * 0.75, -0.17);
      });
    },
    // bến tương lai
    (k, P, H) => {
      const B = K(),
        y0 = H.PLINTH;
      H.wall(k, P, 3, { w: WARE.w, h: 2.6, d: WARE.d, x: WARE.x, y: y0, z: WARE.z });
      if (H.form(P, 'roof', 3) !== 'native') H.roof(k, P, 3, { w: WARE.w + 0.3, h: 1.1, d: WARE.d + 0.3, x: WARE.x, y: y0 + 2.6, z: WARE.z });
      else k.add(B.roof(WARE.w + 0.3, 0.9, WARE.d + 0.3, 0.2, WARE.w * 0.6, WARE.d), P.roof, WARE.x, y0 + 2.6, WARE.z);
      H.lightBox(k, P, 3, 2.4, 1.8, 0.06, WARE.x, y0 + 0.9, WARE.z + WARE.d / 2 + 0.02);
      for (const dx of [-1.9, 1.9]) H.win(k, P, 3, WARE.x + dx, y0 + 1.6, WARE.z + WARE.d / 2, 0.5, 1.0);
      // máy bay chở hàng đậu trên mái
      k.add(B.box(0.8, 0.2, 0.8, 0.03), P.wall2, WARE.x + 1.5, y0 + 3.0, WARE.z);
      for (const e of [-1, 1]) for (const f of [-1, 1]) H.torus(k, P.glow, 0.18, 0.02, WARE.x + 1.5 + e * 0.45, y0 + 3.15, WARE.z + f * 0.45, { glow: true });
    },
    // bến huyền ảo
    (k, P, H) => {
      const B = K(),
        y0 = H.PLINTH;
      H.wall(k, P, 4, { w: WARE.w, h: 2.2, d: WARE.d, x: WARE.x, y: y0, z: WARE.z });
      H.roof(k, P, 4, { w: WARE.w + 0.8, h: 1.0, d: WARE.d + 0.8, tw: WARE.w * 0.6, td: 0.3, lift: 0.5, x: WARE.x, y: y0 + 2.2, z: WARE.z });
      H.door(k, P, WARE.x, y0, WARE.z + WARE.d / 2, 1.4, 1.6, 4);
      // ngọn hải đăng pha lê ở góc bờ, biểu tượng đảo trên đỉnh
      const lx = -4.0,
        lz = -0.6;
      k.add(new root.THREE.OctahedronGeometry(1, 0).scale(0.45, 2.0, 0.45).translate(0, 2.0, 0), P.wall2, lx, y0, lz);
      H.torus(k, P.glow, 0.5, 0.04, lx, y0 + 2.0, lz, { glow: true });
      H.crown(k, P, lx, y0 + 4.0, lz, 0.6);
      H.orbit(k, P, 'spin0', lx, y0 + 2.6, lz, 0.9, 3);
    },
  ];
  BK.Blocks.shape('port', (k, P, t, H) => {
    const y0 = H.PLINTH,
      lz = (LAND.z0 + LAND.z1) / 2;
    // bệ chỉ ở nửa đất liền (dời theo z qua một bộ gom phụ)
    H.plinth({ add: (g, c, x, y, z, o) => k.add(g, c, x, y, z + lz, o) }, P, 9.6, LAND.z1 - LAND.z0);
    TIER[t](k, P, H);
    pier(k, P, t, y0);
    if (t > 0) crane(k, P, t, PIER.x - 1.6, y0, LAND.z1 - 0.5);
    else crane(k, P, t, -3.6, y0, -1.0);
    SHIPS[t](k, P, SHIP.x, WATER, SHIP.z);
    H.guard(k, P, t, PIER.x, y0, PIER.z0 + 1.0); // người canh bến
    H.flag(k, P, PIER.x - PIER.w / 2 + 0.1, y0, PIER.z1 - 0.2, 2.2, 0.9);
  });
})(typeof self !== 'undefined' ? self : globalThis);
