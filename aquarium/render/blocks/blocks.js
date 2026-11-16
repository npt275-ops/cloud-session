/* Bể Kính · render/blocks/blocks.js · Khối công trình quan trọng (design/ke-hoach-buoc-39.md)
 * Người chơi chốt: mỗi công trình quan trọng là MỘT KHỐI riêng: bấm vào được (đưa máy quay tới, hiện nâng cấp), có máu, có
 * công dụng; cùng loại thì cùng máu, cùng công dụng, chỉ khác hình ảnh (theo bậc và theo đảo) để nhân bản ra sáu đảo.
 *   KINDS   tám loại: id, tên, máu (thang 10), cỡ chân đế [ngang, sâu], chỗ trống đặt đồ trang trí, công dụng; coast: chỉ xây
 *           ở mép biển (nhà cảng, mặt trước +z quay ra biển)
 *   TIERS   năm bậc hình ảnh: gỗ tre (thời 1–3), đá (4–6), gạch thép (7–9), tương lai (10–12), huyền ảo (sau thời 12: công
 *           trình lơ lửng trên đá bay, pha lê bay quanh, biểu tượng đảo trên đỉnh)
 *   ISLES   sáu đảo (thứ tự logic/world.js KEYS); mỗi đảo một tệp render/blocks/isles/<đảo>.js gọi isle(key, def): tên, bốn bảng
 *           màu (tường, mái, viền, đá, màu cờ, màu sáng), kiểu dáng S (mái, tường, bệ, tuyết, áo lính: render/blocks/style.js),
 *           flag { color, mark, emblem(m) }: màu cờ cố định của đảo, màu ký hiệu, cách vẽ ký hiệu (render/blocks/parts.js emblem);
 *           deco(k, P, t, H, spots, loại) đồ riêng của đảo đặt vào các chỗ trống spots của từng loại (KINDS[i].spots)
 *   shape(id, fn)   mỗi loại một tệp hình dáng render/blocks/shapes/<id>.js đăng ký fn(k, P, t, H): vẽ các mảnh vào bộ gom k
 *                   (render/build/kit3d.js Kit) theo bảng màu P, bậc t (0..3); H: mảnh dùng chung (render/blocks/parts.js)
 *   bậc neon (TIERS[i].neon): sau khi gộp, mọi cạnh gãy của khối có viền neon (màu glow ở chân chuyển dần sang accent ở đỉnh)
 *   build(loại, bậc, đảo)   trả một THREE.Group đã gộp (một khối); group.userData.block = { kind, tier, skin, hp, hpMax }
 *                   (cùng loại thì cùng máu ở mọi đảo, mọi bậc: chỉ khác hình)
 *   next(khối)      khối cùng loại ở bậc kế (nâng cấp), hay null nếu đã bậc cuối
 *   animate(khối, giây)  phần chuyển động của khối (Kit con tên 'float…' nhấp nhô, 'spin…' quay quanh trục đứng)
 * Gốc toạ độ của khối: giữa chân đế, sát đất; mặt trước quay về +z. Cần: three.js, render/build/kit3d.js. */
(function (root) {
  const BK = root.BK || (root.BK = {});
  const KINDS = [
    { id: 'hall', name: 'Nhà chính', hp: 10, size: [8, 8], spots: [[-3.2, -3.2], [3.2, -3.2]], use: 'Mất là thua. Cấp nhà chính mở khoá cấp của các công trình khác.' },
    { id: 'house', name: 'Nhà dân', hp: 5, size: [4, 4], spots: [[1.45, -1.45]], use: 'Dân ở. Mất nhà thì mất số dân đang sống trong đó.' },
    { id: 'barracks', name: 'Nhà lính', hp: 7, size: [15, 12], spots: [[-2.6, 4.7]], use: 'Sinh lính đánh gần và lính đánh xa. Nâng cấp thì lính mạnh hơn, đông hơn.' },
    { id: 'workshop', name: 'Xưởng xe', hp: 7, size: [10, 9], spots: [[4.3, -3.9], [-4.3, 3.9]], use: 'Sinh xe tấn công: xe phá cổng, máy bắn đá, về sau là xe tăng.' },
    { id: 'gate', name: 'Cổng thành', hp: 8, size: [14, 5], spots: [[-2.6, -1.7], [2.6, -1.7]], use: 'Lối vào duy nhất: địch phải phá cổng trước. Hai chòi gác hai bên báo tin.' },
    { id: 'wall', name: 'Tường bao', hp: 10, size: [4, 1.4], spots: [], use: 'Bao kín thành. Mỗi đoạn là một khối cùng mẫu, nối khít nhau.' },
    { id: 'granary', name: 'Kho lương', hp: 6, size: [6, 6], spots: [[2.35, 2.35], [2.4, -2.3]], use: 'Nuôi dân và lính; về sau là nguồn tiền nâng cấp. Mất kho thì dân đói, lính yếu.' },
    { id: 'port', name: 'Nhà cảng', hp: 7, size: [10, 9], coast: true, spots: [[-4.3, -3.9], [4.3, -3.9]], use: 'Chỉ xây ở mép biển. Bến cho thuyền buôn và thuyền chở quân; mất cảng thì mất đường biển.' },
  ];
  const TIERS = [
    { name: 'Gỗ tre', eras: 'thời 1–3' },
    { name: 'Đá', eras: 'thời 4–6' },
    { name: 'Gạch thép', eras: 'thời 7–9' },
    { name: 'Tương lai', eras: 'thời 10–12', neon: true },
    { name: 'Huyền ảo', eras: 'sau thời 12' }, // (bậc 5: render/blocks/mythic.js)
  ];
  // đảo: render/blocks/isles/<đảo>.js đăng ký (thứ tự hiển thị theo ISLE_KEYS)
  const ISLE_KEYS = ['plains', 'forest', 'mountain', 'tundra', 'coast', 'desert'],
    ISLES = {};
  function isle(key, def) {
    if (ISLES[key]) throw new Error('đảo đăng ký hai lần: ' + key);
    ISLES[key] = Object.assign({ key, S: {} }, def);
  }
  // tường bao và cổng thành nối khít nhau: cùng độ cao theo bậc, cùng bề dày (người chơi chốt: tường kín và dày; thời gỗ
  // tre tường thấp, không đạt chuẩn)
  const WALL_H = [2.2, 3.0, 3.4, 3.6, 3.8],
    WALL_D = 1.1;
  const SHAPES = {};
  function shape(id, fn) {
    if (SHAPES[id]) throw new Error('hình khối đăng ký hai lần: ' + id);
    SHAPES[id] = fn;
  }
  const kind = (id) => KINDS.find((k) => k.id === id);
  // dựng một khối: loại, bậc 0..3, đảo
  function build(id, tier, skin) {
    const K = BK.BuildKit,
      def = kind(id),
      I = ISLES[skin || 'plains'];
    if (!def || !SHAPES[id]) throw new Error('chưa có hình cho khối: ' + id);
    if (!I) throw new Error('chưa có đảo: ' + skin);
    const t = Math.max(0, Math.min(TIERS.length - 1, tier | 0)),
      k = new K.Kit();
    k.noBalcony = true; // (ban công tự thêm của nhà phố: khối quan trọng tự vẽ đủ chi tiết)
    const P = Object.assign({ S: I.S, isle: I.key, flag: I.flag }, I.tiers[t]),
      H = BK.Blocks.H;
    SHAPES[id](k, P, t, H);
    if (I.deco && def.spots.length) I.deco(k, P, t, H, def.spots, id);
    const g = k.bake(4);
    if (TIERS[t].neon) neonEdges(g, P);
    g.name = def.name + ' · ' + TIERS[t].name;
    g.userData.block = { kind: id, tier: t, skin: I.key, hp: def.hp, hpMax: def.hp };
    return g;
  }
  // viền neon dọc các cạnh gãy của khối chính (như thành phố neon từ thời 10, render/build/neon.js): glow ở chân, accent ở đỉnh
  function neonEdges(g, P) {
    const T = root.THREE,
      m = g.userData.main;
    if (!m) return;
    const e = new T.EdgesGeometry(m.geometry, 32),
      pos = e.attributes.position;
    if (!m.geometry.boundingBox) m.geometry.computeBoundingBox();
    const y0 = m.geometry.boundingBox.min.y,
      h = Math.max(1, m.geometry.boundingBox.max.y - y0),
      A = new T.Color(P.glow),
      B = new T.Color(P.accent),
      c = new T.Color(),
      col = new Float32Array(pos.count * 3);
    for (let i = 0; i < pos.count; i++) {
      c.copy(A).lerp(B, Math.min(1, Math.max(0, (pos.getY(i) - y0) / h)));
      col.set([c.r, c.g, c.b], i * 3);
    }
    e.setAttribute('color', new T.BufferAttribute(col, 3));
    const line = new T.LineSegments(e, BK.BuildKit.neonMat());
    line.renderOrder = 3;
    g.add(line);
    g.userData.neon = line;
  }
  // nâng cấp: khối cùng loại, cùng đảo ở bậc kế; đã bậc cuối thì null (bên gọi thay khối cũ bằng khối mới ở đúng chỗ)
  function next(g) {
    const b = g && g.userData.block;
    return b && b.tier < TIERS.length - 1 ? build(b.kind, b.tier + 1, b.skin) : null;
  }
  // phần chuyển động: Kit con 'float…' nhấp nhô quanh chỗ dựng, 'spin…' quay chậm (mỗi phần lệch pha theo tên)
  function animate(g, sec) {
    const subs = g.userData.subs;
    if (!subs) return;
    let i = 0;
    for (const name in subs) {
      const c = subs[name];
      i++;
      if (c.userData.y0 == null) c.userData.y0 = c.position.y;
      if (name.startsWith('float')) c.position.y = c.userData.y0 + Math.sin(sec * 0.9 + i * 1.7) * 0.18;
      else if (name.startsWith('spin')) c.rotation.y = sec * (0.35 + (i % 3) * 0.1) * (i % 2 ? 1 : -1);
    }
  }
  // khối chứa một vật thể con (bấm trúng mảnh nào thì ra khối đó)
  function of(o) {
    for (; o; o = o.parent) if (o.userData && o.userData.block) return o;
    return null;
  }
  // (H: render/blocks/parts.js, render/blocks/style.js)
  BK.Blocks = { KINDS, TIERS, ISLE_KEYS, ISLES, isle, WALL_H, WALL_D, kind, shape, build, next, of, animate, H: null };
})(typeof self !== 'undefined' ? self : globalThis);
