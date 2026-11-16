/* Bể Kính · render/units/units.js · Khối nhân vật: dân, lính, xe tấn công (bản dev, thử trên Lúa Vàng)
 * Người chơi chốt: nhân vật có máu như công trình; thử trên một đảo (Lúa Vàng) rồi mới nhân ra 6 đảo. Mỗi nhân vật là một khối:
 * đứng trên đế tròn có viền màu cờ đảo (nhìn là biết quân đảo nào), bấm vào được, nâng cấp được theo năm bậc của công trình.
 *   KINDS   farmer (dân nam), woman (dân nữ), melee (lính đánh gần), ranged (lính đánh xa), siege (xe tấn công của xưởng xe);
 *           mỗi loại một máu cố định (thang 10) và công dụng; xe tấn công có tên theo bậc (names)
 *   LOOKS   trang phục theo đảo: render/units/isles/<đảo>.js gọi look(key, { farmer: [5 bậc], woman, melee, ranged }); mỗi bậc
 *           là dáng người của render/units/body.js. Đảo chưa có trang phục thì dùng của Lúa Vàng
 *   build(loại, bậc, đảo)  một THREE.Group đã gộp; userData.block = { kind, tier, skin, hp, hpMax, unit: true }
 *   next(khối)  cùng loại ở bậc kế; kind(id)
 * Cần: three.js, render/build/kit3d.js, render/blocks/blocks.js (bậc, đảo, bảng màu, cờ), render/units/body.js, siege.js. */
(function (root) {
  const BK = root.BK;
  const KINDS = [
    { id: 'farmer', name: 'Dân (nam)', hp: 5, use: 'Làm ruộng, xây nhà, nộp lương. Mất dân thì làng chậm lại.' },
    { id: 'woman', name: 'Dân (nữ)', hp: 5, use: 'Gánh lương, buôn bán, chăm làng. Cùng máu với dân nam.' },
    { id: 'melee', name: 'Lính đánh gần', hp: 7, use: 'Giữ cổng, xông lên giáp lá cà. Nhà lính sinh ra; máu dày nhất trong lính.' },
    { id: 'ranged', name: 'Lính đánh xa', hp: 5, use: 'Bắn từ sau hàng lính gần và trên tường. Đánh xa nhưng máu mỏng.' },
    {
      id: 'siege',
      name: 'Xe tấn công',
      hp: 8,
      names: ['Xe phá cổng', 'Máy bắn đá', 'Xe tăng', 'Xe tăng bay', 'Cỗ máy huyền ảo'],
      use: 'Xưởng xe sinh ra. Phá cổng, phá tường, phá nhà; chậm, cần lính đi kèm.',
    },
  ];
  const LOOKS = {};
  function look(key, def) {
    if (LOOKS[key]) throw new Error('trang phục đảo đăng ký hai lần: ' + key);
    LOOKS[key] = def;
  }
  const kind = (id) => KINDS.find((k) => k.id === id);
  function build(id, tier, skin) {
    const B = BK.Blocks,
      Kit = BK.BuildKit,
      def = kind(id),
      I = B.ISLES[skin || 'plains'],
      t = Math.max(0, Math.min(B.TIERS.length - 1, tier | 0)),
      P = Object.assign({ S: I.S, isle: I.key, flag: I.flag }, I.tiers[t]),
      k = new Kit.Kit();
    if (!def) throw new Error('chưa có nhân vật: ' + id);
    k.noBalcony = true;
    // đế tròn có viền màu cờ đảo
    const r = id === 'siege' ? 1.7 : 0.45;
    k.add(Kit.post(r, 0.06, 18), P.stone, 0, 0, 0);
    B.H.torus(k, (I.flag && I.flag.color) || P.accent, r - 0.03, 0.035, 0, 0.07, 0);
    if (id === 'siege') BK.Machines.BY_TIER[t](k, P, 0, 0.06, 0);
    else BK.Body.person(k, P, 0, 0.06, 0, ((LOOKS[I.key] || LOOKS.plains)[id] || [])[t] || {});
    const g = k.bake(2);
    if (id !== 'siege' && g.userData.main) g.userData.main.material = BK.Body.softMat(); // (người: nhựa mờ nhẵn như trong bể)
    g.name = (def.names ? def.names[t] : def.name) + ' · ' + B.TIERS[t].name;
    g.userData.block = { kind: id, tier: t, skin: I.key, hp: def.hp, hpMax: def.hp, unit: true };
    return g;
  }
  function next(g) {
    const b = g && g.userData.block;
    return b && b.tier < BK.Blocks.TIERS.length - 1 ? build(b.kind, b.tier + 1, b.skin) : null;
  }
  BK.Units = { KINDS, LOOKS, look, kind, build, next };
})(typeof self !== 'undefined' ? self : globalThis);
