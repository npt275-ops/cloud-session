/* Bể Kính · render/blocks/style.js · Kiểu dáng theo đảo cho các khối công trình (người chơi chốt: 6 đảo × 4 bậc, không đảo nào giống)
 * Tệp hình dáng (render/blocks/shapes/*.js) không vẽ thẳng mái, tường, bệ mà gọi qua đây; mỗi đảo (render/blocks/isles/*.js)
 * chọn kiểu cho từng bậc trong P.S (style). Kiểu 'native' là hình gốc tệp hình dáng đưa vào (Lúa Vàng dùng toàn bộ kiểu gốc).
 *   H.roof(k, P, t, s)       mái chữ nhật; s = { w, h, d, x, y, z, tw, td, lift, color }: cỡ chân mái, độ cao, chỗ đặt và hình gốc
 *                            (tw, td: bề ngang, bề sâu ở đỉnh; lift: góc cong). Kiểu (S.roof[t]): native, gable (mái hai dốc),
 *                            (vòm trên mái dài hơn 1,5 lần bề sâu: thành vòm cuốn)
 *                            hip (mái bốn dốc), thatch (rơm dày có diềm), leaf (lá dốc đứng), curved (ngói cong góc, có nóc),
 *                            tiered (hai tầng mái cong), steep (dốc đứng), flat (mái bằng có tường chắn), dome (vòm), onion
 *                            (vòm củ hành có chóp), tent (lều vải, đỉnh màu nhấn), sail (mái bằng có hai cánh buồm), leafdome (vòm
 *                            lá có vành sáng), glassdome (vòm có sườn sáng), stepped (ba tầng bậc có viền sáng). Trả kiểu đã dùng
 *                            (tệp hình dáng chỉ thêm chi tiết riêng của hình gốc khi trả 'native')
 *   H.roofRound(k, P, t, s)  mái tròn (tháp tròn, silo): s = { r, h, x, y, z, color, native(k) }; kiểu chữ nhật đổi sang kiểu tròn tương ứng
 *   H.wall(k, P, t, s)       thân tường: s = { w, h, d, x, y, z, color, r }; mặt trước là +z. Kiểu (S.wall[t]): native, log (gỗ cây
 *                            nằm ngang), plank (ván dọc), timber (khung gỗ chéo trên tường trát), stone (lớp đá, viên nhô), adobe
 *                            (đất bo tròn, đầu xà nhô), plaster (tường trát, viền chân và viền đầu), ice (khối tuyết)
 *   H.plinth(k, P, w, d)     bệ dưới khối theo S.base: slab, deck (sàn gỗ), rock (đá tảng), snow (tuyết), sand (cát, lối ván), tile (gạch nung)
 *   H.form(P, 'roof' | 'wall', t)  kiểu đảo chọn cho bậc t ('native' nếu không chọn)
 *   Đảo có S.snow: mọi mái phủ tuyết phần đỉnh, mái bằng có lớp tuyết.
 * Cần: three.js, render/build/kit3d.js, render/blocks/parts.js. */
(function (root) {
  const BK = root.BK,
    H = BK.Blocks.H;
  const K = () => BK.BuildKit;
  const SNOW = '#f2f6fa';
  const form = (P, key, t) => (P.S && P.S[key] && P.S[key][t]) || 'native';
  const cyl = (r, len, seg) => new root.THREE.CylinderGeometry(r, r, len, seg || 6);
  // mái vuốt (hộp vát thu nhỏ lên đỉnh); đảo có tuyết: phủ trắng 40% phía trên
  function taper(k, P, c, w, h, d, tw, td, x, y, z, lift) {
    k.add(K().roof(w, h, d, 0.06, tw, td, lift || 0), c, x, y, z);
    if (!P.S || !P.S.snow) return;
    const f = 0.42;
    k.add(K().roof(tw + (w - tw) * f + 0.05, h * f + 0.03, td + (d - td) * f + 0.05, 0.03, tw + 0.03, td + 0.03), SNOW, x, y + h * (1 - f), z);
  }
  function parapet(k, c, w, d, x, y, z) {
    for (const s of [-1, 1]) {
      k.add(K().box(w, 0.28, 0.12, 0.01, true), c, x, y, z + s * (d / 2 - 0.06));
      k.add(K().box(0.12, 0.28, d, 0.01, true), c, x + s * (w / 2 - 0.06), y, z);
    }
  }
  const dome = (R) => K().lathe([[R, 0], [R * 0.97, R * 0.3], [R * 0.8, R * 0.62], [R * 0.5, R * 0.86], [0.01, R * 0.95]], 12);
  const onion = (R) => K().lathe([[R * 0.6, 0], [R * 0.95, R * 0.45], [R * 0.75, R * 0.95], [R * 0.3, R * 1.25], [0.01, R * 1.5]], 12);
  const ROOF = {
    native: (k, P, t, s, c) => taper(k, P, c, s.w, s.h, s.d, s.tw, s.td, s.x, s.y, s.z, s.lift),
    gable: (k, P, t, s, c) => taper(k, P, c, s.w, s.h, s.d, s.w, 0.2, s.x, s.y, s.z),
    hip: (k, P, t, s, c) => taper(k, P, c, s.w, s.h, s.d, Math.max(0.2, s.w - s.d * 0.9), 0.2, s.x, s.y, s.z),
    thatch: (k, P, t, s, c) => {
      taper(k, P, c, s.w + 0.25, s.h * 1.15, s.d + 0.25, s.w * 0.8, 0.22, s.x, s.y, s.z, 0.12);
      k.add(K().box(s.w + 0.32, 0.12, s.d + 0.32, 0.02, true), P.trim, s.x, s.y - 0.08, s.z); // diềm rơm
      k.add(K().box(s.w * 0.8, 0.16, 0.3, 0.03, true), P.trim, s.x, s.y + s.h * 1.15 - 0.04, s.z);
    },
    leaf: (k, P, t, s, c) => {
      taper(k, P, c, s.w + 0.35, s.h * 1.5, s.d + 0.35, s.w * 0.7, 0.2, s.x, s.y, s.z);
      taper(k, P, P.wall2, s.w + 0.45, s.h * 0.35, s.d + 0.45, s.w + 0.1, s.d * 0.75, s.x, s.y - 0.1, s.z); // vạt lá dưới
    },
    curved: (k, P, t, s, c) => {
      const h = s.h * 0.85;
      taper(k, P, c, s.w, h, s.d, s.w * 0.55, Math.max(0.2, s.d * 0.18), s.x, s.y, s.z, Math.max(0.45, s.h * 0.5));
      k.add(K().box(s.w * 0.62, 0.14, 0.22, 0.02, true), P.trim, s.x, s.y + h, s.z);
      for (const e of [-1, 1]) k.add(K().cone(0.08, 0.45, 5), P.accent, s.x + e * s.w * 0.31, s.y + h, s.z, { rot: [0, 0, -e * 0.7] });
    },
    tiered: (k, P, t, s, c) => {
      ROOF.curved(k, P, t, Object.assign({}, s, { h: s.h * 0.6 }), c);
      const y2 = s.y + s.h * 0.5;
      k.add(K().box(s.w * 0.45, 0.4, s.d * 0.45, 0.03, true), P.wall, s.x, y2, s.z);
      ROOF.curved(k, P, t, Object.assign({}, s, { w: s.w * 0.62, d: s.d * 0.62, h: s.h * 0.6, y: y2 + 0.4 }), c);
    },
    steep: (k, P, t, s, c) => taper(k, P, c, s.w, s.h * 1.7, s.d, s.w, 0.15, s.x, s.y, s.z),
    flat: (k, P, t, s, c) => {
      k.add(K().box(s.w, 0.18, s.d, 0.03, true), c, s.x, s.y, s.z);
      parapet(k, P.wall2, s.w, s.d, s.x, s.y + 0.18, s.z);
      if (P.S && P.S.snow) k.add(K().box(s.w - 0.24, 0.12, s.d - 0.24, 0.05, true), SNOW, s.x, s.y + 0.18, s.z);
    },
    dome: (k, P, t, s, c) => {
      const R = Math.min(s.w, s.d) / 2;
      k.add(K().box(s.w, 0.16, s.d, 0.03, true), P.wall2, s.x, s.y, s.z);
      if (s.w / s.d > 1.5) {
        // mái dài: vòm cuốn (nửa ống dọc trục x), có tuyết thì sống vòm trắng
        k.add(new root.THREE.CylinderGeometry(R, R, s.w, 12, 1, false, 0, Math.PI), c, s.x, s.y + 0.16, s.z, { rot: [0, 0, Math.PI / 2] });
        if (P.S && P.S.snow) k.add(K().box(s.w, 0.1, R * 0.8, 0.04, true), SNOW, s.x, s.y + 0.12 + R, s.z);
        return;
      }
      k.add(dome(R * 0.95), c, s.x, s.y + 0.16, s.z);
      k.add(K().ball(0.12, 0), P.accent, s.x, s.y + 0.16 + R * 0.95, s.z);
    },
    onion: (k, P, t, s, c) => {
      const R = Math.min(s.w, s.d) / 2;
      k.add(K().box(s.w, 0.16, s.d, 0.03, true), P.wall2, s.x, s.y, s.z);
      k.add(onion(R * 0.8), c, s.x, s.y + 0.16, s.z);
      k.add(K().post(0.03, 0.5, 4), P.metal, s.x, s.y + 0.16 + R * 1.2, s.z);
    },
    tent: (k, P, t, s, c) => {
      taper(k, P, c, s.w + 0.5, s.h * 0.8, s.d + 0.5, 0.25, 0.25, s.x, s.y, s.z);
      const f = 0.35,
        h = s.h * 0.8;
      k.add(K().roof(0.25 + (s.w + 0.25) * f, h * f + 0.02, 0.25 + (s.d + 0.25) * f, 0.02, 0.27, 0.27), P.accent, s.x, s.y + h * (1 - f), s.z);
      k.add(K().post(0.04, 0.5, 4), P.trim, s.x, s.y + h, s.z);
    },
    sail: (k, P, t, s, c) => {
      k.add(K().box(s.w, 0.16, s.d, 0.03, true), c, s.x, s.y, s.z);
      for (const e of [-1, 1]) {
        const fin = { rot: [0, 0, e * 0.35] };
        k.add(K().box(0.12, s.h * 1.7, s.d * 0.85, 0.02, true), P.wall, s.x + e * s.w * 0.22, s.y + 0.1, s.z, fin);
        k.add(K().box(0.05, 0.08, s.d * 0.85, 0.01), P.glow, s.x + e * (s.w * 0.22 + s.h * 0.58), s.y + s.h * 1.68, s.z, { glow: true });
      }
    },
    leafdome: (k, P, t, s, c) => {
      ROOF.dome(k, P, t, s, c);
      const R = Math.min(s.w, s.d) / 2;
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        k.add(K().ball(R * 0.35, 1), P.wall2, s.x + Math.cos(a) * R * 0.8, s.y + R * 0.35, s.z + Math.sin(a) * R * 0.8, { sc: [1.3, 0.45, 1.3] });
      }
      H.torus(k, P.glow, R * 0.9, 0.05, s.x, s.y + 0.2, s.z, { glow: true });
    },
    glassdome: (k, P, t, s, c) => {
      ROOF.dome(k, P, t, s, c);
      const R = Math.min(s.w, s.d) / 2 * 0.96,
        rib = new root.THREE.TorusGeometry(R, 0.04, 4, 16, Math.PI);
      for (let i = 0; i < 3; i++) k.add(rib, P.glow, s.x, s.y + 0.16, s.z, { glow: true, rot: [0, (i * Math.PI) / 3, 0] });
    },
    stepped: (k, P, t, s, c) => {
      for (let i = 0; i < 3; i++) {
        const f = 1 - i * 0.2,
          y = s.y + i * s.h * 0.3;
        k.add(K().box(s.w * f, s.h * 0.3, s.d * f, 0.03, true), i % 2 ? P.wall2 : c, s.x, y, s.z);
        k.add(K().box(s.w * f + 0.04, 0.05, s.d * f + 0.04, 0.01, true), P.glow, s.x, y + s.h * 0.3 - 0.05, s.z, { glow: true });
      }
    },
  };
  // kiểu chữ nhật → kiểu tròn tương ứng
  const ROUND = { gable: 'cone', hip: 'cone', thatch: 'cone', leaf: 'cone', curved: 'cone', tiered: 'cone', steep: 'cone', tent: 'cone' };
  Object.assign(ROUND, { flat: 'flat', stepped: 'flat', sail: 'flat', dome: 'dome', glassdome: 'dome', leafdome: 'dome', onion: 'onion' });
  H.form = form; // (kiểu đảo chọn cho bậc t: tệp hình dáng hỏi để bỏ chi tiết chỉ hợp với hình gốc)
  H.roof = function (k, P, t, s) {
    const f = form(P, 'roof', t),
      fn = ROOF[f] || ROOF.native;
    fn(k, P, t, s, s.color || P.roof);
    return ROOF[f] ? f : 'native';
  };
  H.roofRound = function (k, P, t, s) {
    const f = ROUND[form(P, 'roof', t)],
      c = s.color || P.roof,
      B = K();
    if (!f) {
      s.native(k);
      return 'native';
    }
    if (f === 'cone') {
      const steep = form(P, 'roof', t) === 'steep' || form(P, 'roof', t) === 'leaf' ? 1.6 : 1;
      k.add(B.cone(s.r * 1.2, s.h * steep, 10), c, s.x, s.y, s.z);
      if (P.S && P.S.snow) k.add(B.cone(s.r * 0.55, s.h * steep * 0.46, 10), SNOW, s.x, s.y + s.h * steep * 0.55, s.z);
    } else if (f === 'flat') {
      k.add(B.post(s.r + 0.05, 0.16, 12), c, s.x, s.y, s.z);
      H.torus(k, P.wall2, s.r - 0.05, 0.08, s.x, s.y + 0.24, s.z);
      if (P.S && P.S.snow) k.add(B.post(s.r - 0.1, 0.1, 12), SNOW, s.x, s.y + 0.16, s.z);
    } else if (f === 'dome') k.add(dome(s.r * 1.02), c, s.x, s.y, s.z);
    else {
      k.add(onion(s.r), c, s.x, s.y, s.z);
      k.add(B.post(0.03, 0.4, 4), P.metal, s.x, s.y + s.r * 1.45, s.z);
    }
    return f;
  };
  /* ---------- tường ---------- */
  const WALL = {
    native: () => {},
    log: (k, P, t, s, c) => {
      const zf = s.z + s.d / 2 - 0.05;
      for (let y = 0.16; y < s.h - 0.05; y += 0.3) {
        k.add(cyl(0.11, s.w + 0.24), c, s.x, s.y + y, zf, { rot: [0, 0, Math.PI / 2] });
        for (const e of [-1, 1]) k.add(cyl(0.11, s.d + 0.24), c, s.x + e * (s.w / 2 - 0.05), s.y + y, s.z, { rot: [Math.PI / 2, 0, 0] });
      }
    },
    plank: (k, P, t, s) => {
      const zf = s.z + s.d / 2 + 0.01,
        n = Math.max(2, Math.round(s.w / 0.45));
      for (let i = 0; i <= n; i++) k.add(K().box(0.05, s.h, 0.04, 0.01, true), P.wall2, s.x - s.w / 2 + (s.w * i) / n, s.y, zf);
      for (const y of [0.05, s.h - 0.1]) k.add(K().box(s.w + 0.06, 0.1, 0.06, 0.01, true), P.trim, s.x, s.y + y, zf);
    },
    timber: (k, P, t, s) => {
      const zf = s.z + s.d / 2 + 0.01,
        n = Math.max(1, Math.round(s.w / 1.3));
      for (const y of [0, s.h - 0.12]) k.add(K().box(s.w + 0.04, 0.12, 0.05, 0.01, true), P.trim, s.x, s.y + y, zf);
      for (let i = 0; i <= n; i++) k.add(K().box(0.1, s.h, 0.05, 0.01, true), P.trim, s.x - s.w / 2 + (s.w * i) / n, s.y, zf);
      const pw = s.w / n,
        a = Math.atan2(s.h - 0.12, pw);
      for (let i = 0; i < n; i += 2) {
        const cx = s.x - s.w / 2 + pw * (i + 0.5);
        k.add(K().box(Math.hypot(pw, s.h) * 0.9, 0.08, 0.05, 0.01), P.trim, cx, s.y + s.h / 2, zf, { rot: [0, 0, a] });
      }
    },
    stone: (k, P, t, s) => {
      const zf = s.z + s.d / 2 + 0.01;
      for (let y = 0.4; y < s.h - 0.1; y += 0.42) {
        k.add(K().box(s.w + 0.02, 0.04, 0.03, 0.01), P.wall2, s.x, s.y + y, zf);
        for (const e of [-1, 1]) k.add(K().box(0.03, 0.04, s.d + 0.02, 0.01), P.wall2, s.x + e * (s.w / 2 + 0.01), s.y + y, s.z);
      }
      for (let i = 0; i < Math.round(s.w * 1.2); i++) {
        const u = (i * 0.618) % 1,
          v = (i * 0.383 + 0.2) % 1;
        k.add(K().box(0.38, 0.22, 0.06, 0.02), P.stone, s.x - s.w / 2 + 0.3 + u * (s.w - 0.6), s.y + 0.2 + v * (s.h - 0.5), zf + 0.01);
      }
    },
    adobe: (k, P, t, s) => {
      const zf = s.z + s.d / 2;
      for (let x = -s.w / 2 + 0.35; x < s.w / 2 - 0.2; x += 0.6) k.add(cyl(0.06, 0.4), P.trim, s.x + x, s.y + s.h - 0.28, zf, { rot: [Math.PI / 2, 0, 0] });
      k.add(K().box(s.w + 0.04, 0.22, s.d + 0.04, 0.05, true), P.wall2, s.x, s.y, s.z);
    },
    plaster: (k, P, t, s) => {
      k.add(K().box(s.w + 0.05, 0.28, s.d + 0.05, 0.02, true), P.accent, s.x, s.y, s.z);
      k.add(K().box(s.w + 0.05, 0.1, s.d + 0.05, 0.01, true), P.trim, s.x, s.y + s.h - 0.1, s.z);
    },
    ice: (k, P, t, s) => {
      const zf = s.z + s.d / 2 + 0.01;
      for (let y = 0.35; y < s.h - 0.1; y += 0.35) k.add(K().box(s.w + 0.02, 0.035, 0.03, 0.01), '#c8dbe8', s.x, s.y + y, zf);
      for (let x = -s.w / 2 + 0.5; x < s.w / 2; x += 0.7) k.add(K().box(0.035, s.h, 0.03, 0.01, true), '#c8dbe8', s.x + x, s.y, zf);
    },
  };
  H.wall = function (k, P, t, s) {
    const f = form(P, 'wall', t),
      c = s.color || P.wall;
    k.add(K().box(s.w, s.h, s.d, f === 'adobe' ? 0.16 : s.r || 0.06, true), c, s.x, s.y, s.z);
    (WALL[f] || WALL.native)(k, P, t, s, c);
    return WALL[f] ? f : 'native';
  };
  /* ---------- bệ ---------- */
  const BASE = {
    slab: (k, P, w, d) => k.add(K().box(w, H.PLINTH, d, 0.07, true), P.stone, 0, 0, 0),
    deck: (k, P, w, d) => {
      k.add(K().box(w, H.PLINTH, d, 0.04, true), P.trim, 0, 0, 0);
      for (let x = -w / 2 + 0.35; x < w / 2; x += 0.35) k.add(K().box(0.03, 0.02, d - 0.04, 0.01, true), P.dark, x, H.PLINTH - 0.01, 0);
      for (const e of [-1, 1]) k.add(K().box(w + 0.1, 0.1, 0.12, 0.01, true), '#5c7a3a', 0, 0, e * (d / 2)); // rêu mép sàn
    },
    rock: (k, P, w, d) => {
      k.add(K().box(w, H.PLINTH, d, 0.07, true), P.stone, 0, 0, 0);
      const n = Math.round((w + d) / 1.4);
      for (let i = 0; i < n; i++) {
        const u = i / n,
          side = i % 4,
          px = side < 2 ? (u * 2 - 1) * w * 0.48 : (side === 2 ? -1 : 1) * w * 0.5,
          pz = side < 2 ? (side === 0 ? -1 : 1) * d * 0.5 : (u * 2 - 1) * d * 0.48;
        k.add(K().ball(0.28 + ((i * 7) % 3) * 0.06, 0), P.wall2, px, 0.12, pz, { sc: [1.2, 0.7, 1] });
      }
    },
    snow: (k, P, w, d) => {
      k.add(K().box(w, H.PLINTH, d, 0.1, true), SNOW, 0, 0, 0);
      for (const [x, z] of [[-0.45, -0.5], [0.48, 0.5], [0.5, -0.47], [-0.48, 0.46]]) k.add(K().ball(0.35, 1), SNOW, x * w, 0.1, z * d, { sc: [1.5, 0.5, 1.2] });
    },
    sand: (k, P, w, d) => {
      k.add(K().box(w, H.PLINTH, d, 0.08, true), '#e6d3a3', 0, 0, 0);
      for (let x = -0.6; x <= 0.6; x += 0.3) k.add(K().box(0.26, 0.04, 1.2, 0.01, true), P.trim, x, H.PLINTH, d / 2 - 0.6); // lối ván
    },
    tile: (k, P, w, d) => {
      k.add(K().box(w, H.PLINTH, d, 0.05, true), P.stone, 0, 0, 0);
      for (let x = -w / 2 + 0.6; x < w / 2; x += 0.6) k.add(K().box(0.03, 0.02, d - 0.05, 0.01, true), P.wall2, x, H.PLINTH - 0.01, 0);
      for (let z = -d / 2 + 0.6; z < d / 2; z += 0.6) k.add(K().box(w - 0.05, 0.02, 0.03, 0.01, true), P.wall2, 0, H.PLINTH - 0.01, z);
    },
  };
  H.plinth = function (k, P, w, d) {
    (BASE[(P.S && P.S.base) || 'slab'] || BASE.slab)(k, P, w, d);
  };
})(typeof self !== 'undefined' ? self : globalThis);
