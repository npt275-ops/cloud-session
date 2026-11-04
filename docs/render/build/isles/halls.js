/* Bể Kính · render/build/isles/halls.js · Nhà chính của năm đảo, lên cấp đều qua 12 thời
 * Mỗi đảo một dòng nhà chính riêng (không dùng chung với đảo khác), thời sau luôn to hơn, cao hơn, hiện đại hơn thời trước:
 *   số tầng, chiều cao, tháp bên tăng dần; thời 6 có dải kính; thời 9 có vạch sáng giữa các tầng và tháp sáng; thời 11 có
 *   vòng quay quanh đỉnh; thời 12 vương miện tách hẳn ra lơ lửng trên cao, có cột sáng.
 * Hoa văn riêng của từng đảo (MOTIF):
 *   forest   Thông Xanh: thân vuông xoay, mái chùa cong, tán lá xanh trên các tầng (tương lai: tán phát sáng)
 *   mountain Đá Mây: thân lục giác, gờ răng cưa, khối đá bay quanh đỉnh (tương lai: mũi thạch anh)
 *   tundra   Tuyết Trắng: thân tròn, mái vòm, mũi băng quanh tầng, vòng cực quang nghiêng
 *   coast    Cửa Sóng: thân tròn, vây buồm hai bên, vòng sóng quay, vỏ ốc trên đỉnh
 *   desert   Cát Hồng: thân vuông bậc thang, mái củ hành, đĩa mặt trời quay, mũi kim tự tháp nổi
 * Thời 1 và 2 dùng nhà chính sơ khai của từng đảo (arch.js: cave, snowHall, boatHall, stoneHut, lodge...).
 * BK.IslesHalls.build(đảo) trả hàm dựng (k, o) theo o.lv; NAME[đảo][cấp] là tên. Cần: kit3d, common, isles/arch.js. */
(function (root) {
  const BK = root.BK, K = BK.BuildKit, { B, Bc } = BK.Plains3D, A = BK.IslesArch;
  const THREE = () => window.THREE;
  const torus = (r, t, a) => new (THREE().TorusGeometry)(r, t, 6, 28, a);
  const oct = (sx, sy, sz) => new (THREE().OctahedronGeometry)(1, 0).scale(sx, sy, sz).translate(0, sy, 0);
  // độ cao tổng theo cấp (tăng đều, không bao giờ thấp hơn thời trước)
  const H = [0, 0, 0, 9, 12, 15, 19, 23, 27, 31, 35, 39, 44];
  const MOTIF = {
    forest: { seg: 4, rot: Math.PI / 4, roof: (k, w, y, p, lv) => k.add(K.roof(w * 1.5, 0.9, w * 1.5, 0.12, w * 0.9, w * 0.9, 0.7), p.b, 0, y, 0),
      deco: (k, w, y, p, lv) => { for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2 + 0.4; k.add(K.ball(w * 0.28, 1), lv >= 9 ? '#6ad890' : '#5a9646', Math.cos(a) * w * 0.62, y + 0.3, Math.sin(a) * w * 0.62, { sc: [1, 0.7, 1], glow: lv >= 11 }); } },
      crown: (k, y, p, lv) => { k.add(K.ball(3 + lv * 0.25, 1), lv >= 9 ? '#5fd8a0' : '#4f8a3f', 0, y + 1.5, 0, { sc: [1, 0.7, 1] }); for (let i = 0; i < 6; i++) k.add(K.ball(0.4), p.g, Math.cos(i) * 2.6, y + 1.2, Math.sin(i) * 2.6, { glow: true }); } },
    mountain: { seg: 6, rot: 0, roof: (k, w, y, p, lv) => { for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; k.add(B(0.7, 0.7, 0.7, 0.05), p.a, Math.cos(a) * w * 0.48, y, Math.sin(a) * w * 0.48); } },
      deco: (k, w, y, p, lv) => { if (lv >= 6) for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2 + 0.5; k.add(B(0.5, 1.4, 0.5, 0.1), p.b, Math.cos(a) * w * 0.52, y - 1.4, Math.sin(a) * w * 0.52); } },
      crown: (k, y, p, lv) => { k.add(oct(1.4 + lv * 0.08, 3 + lv * 0.4, 1.4 + lv * 0.08), lv >= 9 ? p.g : p.c, 0, y, 0, { glow: lv >= 9 }); } },
    tundra: { seg: 12, rot: 0, roof: (k, w, y, p, lv) => k.add(K.lathe([[w * 0.55, 0], [w * 0.5, 0.6], [w * 0.3, 1.3], [0.001, 1.5]], 14), p.b, 0, y, 0),
      deco: (k, w, y, p, lv) => { for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; k.add(oct(0.25, 0.9 + (i % 2) * 0.5, 0.25), lv >= 9 ? p.g : p.c, Math.cos(a) * w * 0.52, y, Math.sin(a) * w * 0.52, { glow: lv >= 9 }); } },
      crown: (k, y, p, lv) => { k.add(K.lathe([[2.6, 0], [2.4, 1.2], [1.4, 2.4], [0.001, 2.8]], 16), p.a, 0, y, 0); k.add(oct(0.7, 2.6 + lv * 0.2, 0.7), p.g, 0, y + 2.6, 0, { glow: true }); } },
    coast: { seg: 12, rot: 0, roof: (k, w, y, p, lv) => k.add(K.post(w * 0.62, 0.3, 14, w * 0.62), p.b, 0, y, 0),
      deco: (k, w, y, p, lv) => { for (const sx of [-1, 1]) k.add(Bc(0.12, 2.2, w * 0.8, 0.03), p.c, sx * w * 0.55, y - 1, 0, { rot: [0, 0, sx * 0.25], glow: lv >= 9 }); },
      crown: (k, y, p, lv) => { k.add(K.lathe([[0.001, 0], [2.2, 0.6], [2.4, 1.6], [1.4, 2.8], [0.4, 3.6], [0.001, 4.2]], 10), p.a, 0, y, 0, { rot: [0, 0, 0.15] }); k.add(K.ball(0.8, 1), p.g, 0, y + 1.6, 1.6, { glow: true }); } },
    desert: { seg: 4, rot: 0, step: true, roof: (k, w, y, p, lv) => k.add(B(w * 1.08, 0.35, w * 1.08, 0.05), p.c, 0, y, 0),
      deco: (k, w, y, p, lv) => { for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) k.add(K.lathe([[0.35, 0], [0.55, 0.35], [0.28, 0.8], [0.001, 1.2]], 8), lv >= 9 ? p.g : p.b, x * w * 0.48, y, z * w * 0.48, { glow: lv >= 9 }); },
      crown: (k, y, p, lv) => { k.add(K.lathe([[2.2, 0], [3, 1.4], [1.6, 3.2], [0.001, 4.8]], 12), p.b, 0, y, 0); k.add(K.ball(0.5), p.g, 0, y + 5, 0, { glow: true }); } },
  };
  // một tầng thân theo hoa văn: dải cửa (thời 3-5 ô cửa nhỏ, thời 6 trở đi dải kính), vạch sáng ở chân tầng (thời 9 trở đi)
  function tier(k, M, p, w, h, y, lv, v) {
    k.add(K.post(w / 2, h, M.seg, w / 2 * (M.step ? 1 : 0.94)), p.a, 0, y, 0, { rot: [0, M.rot, 0] });
    const n = M.seg === 4 ? 4 : M.seg === 6 ? 6 : 8, r = (w / 2) * (M.seg === 4 ? 0.71 : 0.9);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + (M.seg === 4 ? M.rot + Math.PI / 4 : 0), x = Math.sin(a) * r, z = Math.cos(a) * r;
      if (lv >= 6) { k.add(Bc(w * 0.5, h * 0.55, 0.06, 0.02), p.c, x, y + h * 0.5, z, { rot: [0, a, 0], ao: false }); if ((i + v) % 3) k.add(Bc(w * 0.42, h * 0.45, 0.04, 0.01), p.w, x * 1.01, y + h * 0.5, z * 1.01, { rot: [0, a, 0], lit: true }); }
      else { k.add(Bc(0.6, 0.9, 0.06, 0.02), p.d, x, y + h * 0.55, z, { rot: [0, a, 0], ao: false }); if ((i + v) % 2) k.add(Bc(0.5, 0.75, 0.04, 0.01), p.w, x * 1.01, y + h * 0.55, z * 1.01, { rot: [0, a, 0], lit: true }); }
    }
    if (lv >= 9) k.add(K.post(w / 2 + 0.06, 0.18, M.seg, w / 2 + 0.06), p.g, 0, y, 0, { rot: [0, M.rot, 0], glow: true });
  }
  function progressive(key) {
    const M = MOTIF[key];
    return (k, o) => {
      const lv = o.lv, p = o.pal || A.pal(o), Ht = H[lv], n = 2 + Math.floor(lv / 2), W = 8 + lv * 0.35, A2 = {};
      // bậc nền rộng dần theo cấp
      k.add(B(W + 3, 0.6, W + 3, 0.12), p.b, 0, 0, 0); if (lv >= 6) k.add(B(W + 5, 0.3, W + 5, 0.08), p.d, 0, 0, 0);
      let y = 0.6; const th = (Ht - 0.6) / n;
      for (let i = 0; i < n; i++) {
        const w = M.step ? W * (1 - (i * 0.6) / n) : W * (1 - (i * 0.5) / n);
        tier(k, M, p, w, th, y, lv, i); y += th;
        if (lv <= 5 || i === n - 1) M.roof(k, w, y, p, lv); else k.add(K.post(w / 2 + 0.2, 0.2, M.seg, w / 2 + 0.2), p.b, 0, y, 0, { rot: [0, M.rot, 0] });
        if (i % 2 === 1) M.deco(k, w, y, p, lv);
      }
      // tháp bên: 2 tháp (thời 4-5), 4 tháp (thời 6-8), 4 tháp mảnh có đỉnh sáng (thời 9 trở đi)
      const nt = lv >= 6 ? 4 : lv >= 4 ? 2 : 0, tr = W * 0.72;
      for (let i = 0; i < nt; i++) {
        const a = (i / nt) * Math.PI * 2 + Math.PI / 4, x = Math.cos(a) * tr, z = Math.sin(a) * tr, h = Ht * (lv >= 9 ? 0.7 : 0.55), r = lv >= 9 ? 0.6 : 1.0;
        k.add(K.post(r, h, M.seg, r * 0.8), p.a, x, 0, z); if (lv >= 6) k.add(Bc(0.12, h * 0.8, 0.12, 0.02), p.c, x, h * 0.5, z + r, { glow: lv >= 9 });
        if (lv >= 9) k.add(oct(0.4, 1.4, 0.4), p.g, x, h, z, { glow: true }); else M.roof(k, r * 2, h, p, lv);
      }
      // đỉnh: mái và vật trang trí (thời 3-8), vương miện của đảo (thời 9-11), vương miện lơ lửng có cột sáng (thời 12)
      if (lv <= 8) { M.crown(k, y, p, lv); if (lv >= 6) { k.add(K.post(0.08, 4 + lv * 0.4, 4, 0.03), p.d, 0, y + 3, 0); k.add(K.ball(0.18), '#ff5a4f', 0, y + 7 + lv * 0.4, 0, { glow: true }); } }
      else if (lv <= 11) { M.crown(k, y, p, lv); const r = k.sub('halo', [0, y + 2, 0]); r.add(torus(W * 0.5, 0.18), p.g, 0, 0, 0, { glow: true, rot: [Math.PI / 2 + (key === 'tundra' ? 0.4 : 0), 0, 0] }); (A2.spin || (A2.spin = [])).push(['halo', 'y', 0.35]); }
      else { const c = k.sub('crown', [0, y + 5, 0]); M.crown(c, 0, p, lv); c.add(torus(W * 0.55, 0.22), p.g, 0, 1, 0, { glow: true, rot: [Math.PI / 2, 0, 0] }); k.add(K.post(0.35, 5, 8, 0.15), p.g, 0, y, 0, { glow: true }); (A2.bob || (A2.bob = [])).push(['crown', 0.6, 0.3]); }
      if (lv >= 11) { const o2 = k.sub('orbit', [0, Ht * 0.6, 0]); o2.add(torus(W * 0.85, 0.14), p.c, 0, 0, 0, { glow: true, rot: [Math.PI / 2 - 0.25, 0, 0] }); for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2; o2.add(key === 'mountain' ? K.ball(0.9, 0) : oct(0.5, 1, 0.5), key === 'mountain' ? p.b : p.g, Math.cos(a) * W * 0.85, 0, Math.sin(a) * W * 0.85, { glow: key !== 'mountain' }); } (A2.spin || (A2.spin = [])).push(['orbit', 'y', -0.25]); }
      if (lv >= 9) A2.pulse = true;
      return A2;
    };
  }
  const EARLY = { forest: ['greatTent', 'longhall'], mountain: ['cave', 'stoneHut'], tundra: ['snowHall', 'greatTent'], coast: ['boatHall', 'lodge'], desert: ['stoneHut', 'ziggurat'] };
  function build(key) { const P = progressive(key); return (k, o) => (o.lv <= 2 ? A.HALL[EARLY[key][o.lv - 1]](k, o) : P(k, o)); }
  const NAME = {
    forest: [null, 'Lều Tù Trưởng', 'Nhà Rông', 'Đình Gỗ Ba Tầng', 'Đình Gỗ Có Tháp', 'Toà Gỗ Năm Tầng', 'Toà Gỗ Kính', 'Tháp Gỗ Lớn', 'Tháp Rừng Kính', 'Tháp Tán Sáng', 'Tháp Lá Mặt Trời', 'Tháp Rừng Quay', 'Vương Miện Rừng'],
    mountain: [null, 'Hang Tổ Tiên', 'Nhà Đá Tròn', 'Đền Đá Lục Giác', 'Pháo Đài Núi', 'Toà Đá Năm Tầng', 'Toà Đá Kính', 'Tháp Đá Lớn', 'Tháp Núi Kính', 'Tháp Thạch Anh', 'Tháp Mây Sáng', 'Tháp Đá Bay', 'Đỉnh Núi Lơ Lửng'],
    tundra: [null, 'Nhà Băng Lớn', 'Lều Da Lớn', 'Đền Vòm Băng', 'Thành Vòm Băng', 'Toà Vòm Năm Tầng', 'Toà Vòm Kính', 'Tháp Băng Lớn', 'Tháp Tuyết Kính', 'Tháp Cực Quang', 'Tháp Băng Sáng', 'Tháp Cực Quang Quay', 'Cung Điện Băng Bay'],
    coast: [null, 'Nhà Thuyền Úp', 'Nhà Vỏ Cây', 'Đền Sóng Ba Tầng', 'Toà Cảng Có Tháp', 'Toà Cảng Năm Tầng', 'Toà Buồm Kính', 'Tháp Cảng Lớn', 'Tháp Biển Kính', 'Tháp Sóng Sáng', 'Tháp Ngọc Biển', 'Tháp Sóng Quay', 'Cung Điện Ngọc Trai'],
    desert: [null, 'Nhà Đá Tròn', 'Đền Bậc Thang', 'Đền Bậc Ba Tầng', 'Thành Cát Có Tháp', 'Cung Điện Năm Tầng', 'Cung Điện Kính', 'Tháp Bậc Lớn', 'Tháp Cát Kính', 'Tháp Mặt Trời', 'Tháp Nắng Vàng', 'Tháp Cát Quay', 'Kim Tự Tháp Bay'],
  };
  BK.IslesHalls = { build, NAME, H, MOTIF };
})(typeof self !== 'undefined' ? self : globalThis);
