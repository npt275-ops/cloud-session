/* Bể Kính · render/blocks/blocks.js · Khối công trình quan trọng (design/ke-hoach-buoc-39.md)
 * Người chơi chốt: mỗi công trình quan trọng là MỘT KHỐI riêng: bấm vào được (đưa máy quay tới, hiện nâng cấp), có máu, có
 * công dụng; cùng loại thì cùng máu, cùng công dụng, chỉ khác hình ảnh (theo bậc và theo đảo) để nhân bản ra sáu đảo.
 *   KINDS   bảy loại: id, tên, máu (thang 10), cỡ chân đế [ngang, sâu], công dụng
 *   TIERS   bốn bậc hình ảnh gom 12 thời: gỗ tre (1–3), đá (4–6), gạch thép (7–9), tương lai (10–12)
 *   SKINS   lớp vỏ của từng đảo: mỗi bậc một bảng màu (tường, mái, viền, đá, màu cờ, màu sáng); thêm đảo thì thêm một mục ở đây,
 *           hình dáng không đổi
 *   shape(id, fn)   mỗi loại một tệp hình dáng render/blocks/shapes/<id>.js đăng ký fn(k, P, t, H): vẽ các mảnh vào bộ gom k
 *                   (render/build/kit3d.js Kit) theo bảng màu P, bậc t (0..3); H: mảnh dùng chung (bệ, cờ, cửa, răng tường)
 *   build(loại, bậc, đảo)   trả một THREE.Group đã gộp (một khối); group.userData.block = { kind, tier, skin, hp, hpMax }
 *   next(khối)      khối cùng loại ở bậc kế (nâng cấp), hay null nếu đã bậc cuối
 * Gốc toạ độ của khối: giữa chân đế, sát đất; mặt trước quay về +z. Cần: three.js, render/build/kit3d.js. */
(function (root) {
  const BK = root.BK || (root.BK = {});
  const KINDS = [
    { id: 'hall', name: 'Nhà chính', hp: 10, size: [8, 8], use: 'Mất là thua. Cấp nhà chính mở khoá cấp của các công trình khác.' },
    { id: 'house', name: 'Nhà dân', hp: 5, size: [4, 4], use: 'Dân ở. Mất nhà thì mất số dân đang sống trong đó.' },
    { id: 'barracks', name: 'Nhà lính', hp: 7, size: [6, 6], use: 'Sinh lính đánh gần và lính đánh xa. Nâng cấp thì lính mạnh hơn, đông hơn.' },
    { id: 'workshop', name: 'Xưởng xe', hp: 7, size: [6, 6], use: 'Sinh xe tấn công: xe phá cổng, máy bắn đá, về sau là xe tăng.' },
    { id: 'gate', name: 'Cổng thành', hp: 8, size: [10, 4], use: 'Lối vào duy nhất: địch phải phá cổng trước. Hai chòi gác hai bên báo tin.' },
    { id: 'wall', name: 'Tường bao', hp: 10, size: [4, 1.4], use: 'Bao kín thành. Mỗi đoạn là một khối cùng mẫu, nối khít nhau.' },
    { id: 'granary', name: 'Kho lương', hp: 6, size: [6, 6], use: 'Nuôi dân và lính; về sau là nguồn tiền nâng cấp. Mất kho thì dân đói, lính yếu.' },
  ];
  const TIERS = [
    { name: 'Gỗ tre', eras: 'thời 1–3' },
    { name: 'Đá', eras: 'thời 4–6' },
    { name: 'Gạch thép', eras: 'thời 7–9' },
    { name: 'Tương lai', eras: 'thời 10–12' },
  ];
  // bảng màu một bậc: wall tường, wall2 tường phụ, roof mái, trim viền gỗ/sắt, stone bệ đá, dark cửa và bóng, accent cờ,
  // glow phần phát sáng (bậc tương lai), metal sắt thép
  const SKINS = {
    plains: {
      name: 'Lúa Vàng',
      tiers: [
        { wall: '#c39a62', wall2: '#a57c48', roof: '#d2ae52', trim: '#6e4b2b', stone: '#a39a86', dark: '#3b2a1c', accent: '#c8402f', glow: '#ffd27a', metal: '#7d6a50' },
        { wall: '#c2bcab', wall2: '#9d9684', roof: '#a9573c', trim: '#6b5645', stone: '#8f8878', dark: '#3a2f27', accent: '#c8402f', glow: '#ffd27a', metal: '#6f6a62' },
        { wall: '#b9684c', wall2: '#93503b', roof: '#4d5a66', trim: '#39424b', stone: '#8b8a86', dark: '#262b30', accent: '#c8402f', glow: '#ffe2a0', metal: '#8a96a2' },
        { wall: '#e9eff3', wall2: '#bccad4', roof: '#3b4c5f', trim: '#2a3644', stone: '#9fb0bd', dark: '#1d2733', accent: '#ff5a48', glow: '#5fdcff', metal: '#8fa4b5' },
      ],
    },
  };
  // tường bao và cổng thành nối khít nhau: cùng độ cao theo bậc, cùng bề dày (người chơi chốt: tường kín và dày; thời gỗ
  // tre tường thấp, không đạt chuẩn)
  const WALL_H = [2.2, 3.0, 3.4, 3.6],
    WALL_D = 1.1;
  const SHAPES = {};
  function shape(id, fn) {
    if (SHAPES[id]) throw new Error('hình khối đăng ký hai lần: ' + id);
    SHAPES[id] = fn;
  }
  const kind = (id) => KINDS.find((k) => k.id === id);
  /* ---------- Mảnh dùng chung cho mọi loại (H) ---------- */
  const PLINTH = 0.22; // (đơn vị) bệ cao chừng này; mọi khối dựng từ mặt bệ
  const H = {
    PLINTH,
    // bệ chuẩn: mọi khối đứng trên một bệ đá cùng kiểu (nhìn là biết công trình quan trọng, bấm được)
    plinth(k, P, w, d) {
      const K = BK.BuildKit;
      k.add(K.box(w, PLINTH, d, 0.07, true), P.stone, 0, 0, 0);
    },
    // cờ: cột và lá cờ (size: bề ngang lá cờ)
    flag(k, P, x, y, z, h, size) {
      const K = BK.BuildKit;
      k.add(K.post(0.05, h, 5), P.dark, x, y, z);
      k.add(K.box(size, size * 0.62, 0.05, 0.01), P.accent, x + size / 2 + 0.04, y + h - size * 0.36, z);
    },
    // cửa: tấm sẫm áp mặt trước (z: mặt tường trước)
    door(k, P, x, y, z, w, h) {
      const K = BK.BuildKit;
      k.add(K.box(w + 0.16, h + 0.08, 0.1, 0.02, true), P.trim, x, y, z + 0.02);
      k.add(K.box(w, h, 0.1, 0.02, true), P.dark, x, y, z + 0.06);
    },
    // răng tường (lỗ châu mai) dọc trục x: n răng từ x0 tới x1 ở độ cao y
    crenels(k, color, x0, x1, y, z, n, w, h, d) {
      const K = BK.BuildKit;
      for (let i = 0; i < n; i++) k.add(K.box(w, h, d, 0.03, true), color, x0 + ((x1 - x0) * i) / Math.max(1, n - 1), y, z);
    },
    // ô sáng (cửa sổ, dải đèn): màu sáng, bậc tương lai thì phát sáng thật
    lightBox(k, P, t, w, h, d, x, y, z) {
      const K = BK.BuildKit;
      k.add(K.box(w, h, d, 0.01), t === 3 ? P.glow : '#ffe9a8', x, y, z, t === 3 ? { glow: true } : null);
    },
  };
  // dựng một khối: loại, bậc 0..3, đảo
  function build(id, tier, skin) {
    const K = BK.BuildKit,
      def = kind(id),
      S = SKINS[skin || 'plains'];
    if (!def || !SHAPES[id]) throw new Error('chưa có hình cho khối: ' + id);
    const t = Math.max(0, Math.min(TIERS.length - 1, tier | 0)),
      k = new K.Kit();
    k.noBalcony = true; // (ban công tự thêm của nhà phố: khối quan trọng tự vẽ đủ chi tiết)
    SHAPES[id](k, S.tiers[t], t, H);
    const g = k.bake(4);
    g.name = def.name + ' · ' + TIERS[t].name;
    g.userData.block = { kind: id, tier: t, skin: skin || 'plains', hp: def.hp, hpMax: def.hp };
    return g;
  }
  // nâng cấp: khối cùng loại, cùng đảo ở bậc kế; đã bậc cuối thì null (bên gọi thay khối cũ bằng khối mới ở đúng chỗ)
  function next(g) {
    const b = g && g.userData.block;
    return b && b.tier < TIERS.length - 1 ? build(b.kind, b.tier + 1, b.skin) : null;
  }
  // khối chứa một vật thể con (bấm trúng mảnh nào thì ra khối đó)
  function of(o) {
    for (; o; o = o.parent) if (o.userData && o.userData.block) return o;
    return null;
  }
  BK.Blocks = { KINDS, TIERS, SKINS, WALL_H, WALL_D, kind, shape, build, next, of, H };
})(typeof self !== 'undefined' ? self : globalThis);
