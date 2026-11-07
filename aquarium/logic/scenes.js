/* Bể Kính · logic/scenes.js · Cảnh theo sự kiện của một đảo (design/npc-song-that.md mục 4, 7.5)
 * Một cảnh có các vai (ai làm gì, ở đâu, từ khi nào tới khi nào). Bộ não (logic/brain.js) hỏi vai của từng người trước lịch
 * thường (roleOf), nên ai có mặt trong cảnh đều làm đúng việc của cảnh.
 *   đám tang   người vừa mất ở đảo nhà: ba chặng
 *                khóc ở nhà (MOURN): người nhà (vợ chồng, con, cha mẹ, anh em) và tư tế tới trước cửa nhà người mất
 *                đưa tang (PROCESSION): hai người khiêng quan tài đi trước, tư tế dẫn, người nhà theo sau tới bãi mộ
 *                chôn cất (BURIAL): ở bãi mộ, mộ mới thêm vào S.graves (bãi mộ lớn dần theo lịch sử của đảo, phần vẽ
 *                render/build/workyards3d.js)
 *              người mất ở đảo khác (chết trận nơi xa, p.abroad): không có thi thể; người nhà làm lễ tưởng niệm ở chỗ thờ
 * Người mới mất được phát hiện mỗi ngày (dayTick): mất vì già, bệnh, đói, thiên tai, chiến tranh đều có đám tang, không phải
 * móc vào từng chỗ gây ra cái chết. Không vẽ gì, chạy được bằng Node. Cần: logic/people.js, logic/rules.js. */
(function (root, factory) {
  const BK = root.BK || (root.BK = {});
  BK.Scenes = factory(BK);
  if (typeof module === 'object' && module.exports) module.exports = BK.Scenes;
})(typeof self !== 'undefined' ? self : globalThis, function (BK) {
  'use strict';
  const MOURN = 0.3, PROCESSION = 0.25, BURIAL = 0.3;   // độ dài từng chặng (ngày)
  const MAX_MOURNERS = 8;

  const P = () => BK.People;
  // người nhà của người mất (còn sống, ở đảo, từ 6 tuổi)
  function familyOf(S, dead) {
    const out = new Set(), add = (id) => { const q = id != null && S.people.get(id); if (q && q.alive && !q.away && P().ageOf(q, S.day) >= 6) out.add(q.id); };
    add(dead.spouse); (dead.children || []).forEach(add); (dead.parents || []).forEach(add);
    for (const q of S.people.values()) if (q.alive && dead.parents.length && q.parents.some((x) => dead.parents.includes(x)) && q !== dead) add(q.id);
    return [...out].slice(0, MAX_MOURNERS);
  }
  // hai người khiêng: đàn ông khoẻ trong nhà, thiếu thì hàng xóm (không phải người đang giữ chốt, không đi vắng)
  function bearersOf(S, dead, family) {
    const ok = (q) => q && q.alive && !q.away && q.sex === 'm' && !(BK.Posts && BK.Posts.of(q)) && P().ageOf(q, S.day) >= 18 && P().ageOf(q, S.day) < 60;
    const fam = family.map((id) => S.people.get(id)).filter(ok);
    const near = [...S.people.values()].filter((q) => ok(q) && !family.includes(q.id) && q.home != null && dead.home != null && Math.abs(q.home - dead.home) <= 2);
    return fam.concat(near).slice(0, 2).map((q) => q.id);
  }
  function openFuneral(S, dead, day) {
    const family = familyOf(S, dead), priest = S.seats.priest;
    const sc = { kind: dead.abroad ? 'memorial' : 'funeral', dead: dead.id, name: P().fullName(dead), slot: dead.home, from: day, family, priest: priest != null && S.people.get(priest) && S.people.get(priest).alive ? priest : null };
    sc.bearers = sc.kind === 'funeral' ? bearersOf(S, dead, family) : [];
    sc.walk = day + MOURN; sc.bury = sc.walk + PROCESSION; sc.until = sc.kind === 'funeral' ? sc.bury + BURIAL : day + MOURN + 0.2;
    (S.scenes || (S.scenes = [])).push(sc);
    S.rethink = true; // người nhà tới ngay (logic/brain.js)
    S.log.push({ day: Math.floor(day), kind: 'funeral', ids: [dead.id], text: (sc.kind === 'funeral' ? 'Đám tang ' : 'Lễ tưởng niệm ') + sc.name + '.' });
    return sc;
  }
  // mỗi ngày (logic/island.js gọi): người mới mất thì mở đám tang; chặng chôn cất thì thêm mộ; cảnh xong thì bỏ
  function dayTick(S, day) {
    const list = S.scenes || (S.scenes = []);
    for (const p of S.people.values()) if (!p.alive && p.died != null && !p.mourned && day - p.died < 2 && !p.left && p.cause !== 'bị đuổi về') { p.mourned = true; openFuneral(S, p, Math.max(day, p.died)); }
    for (const sc of list) if (sc.kind === 'funeral' && !sc.buried && day >= sc.bury) { sc.buried = true; (S.graves || (S.graves = [])).push({ id: sc.dead, day: Math.floor(day) }); }
    S.scenes = list.filter((sc) => sc.until > day);
  }
  // vai của p trong các cảnh đang có (null: không có vai). d(state, o): tạo việc của logic/brain.js
  function roleOf(S, p, d, ph) {
    if (!S.scenes || !S.scenes.length || ph === 'night') return null;
    const day = S.day;
    for (const sc of S.scenes) {
      if (day < sc.from || day >= sc.until) continue;
      const fam = sc.family.includes(p.id), priest = sc.priest === p.id, bearer = sc.bearers.includes(p.id);
      if (!fam && !priest && !bearer) continue;
      const why = (t) => t + ' ' + sc.name;
      if (sc.kind === 'memorial') return d('idle', { verb: priest ? 'pray' : 'mourn', mood: 'pray', place: 'shrine', reason: why('tưởng niệm'), until: sc.until, phase: ph, scene: sc });
      if (day < sc.walk) return d('work', { verb: priest ? 'pray' : 'mourn', place: 'homeSlot', slot: sc.slot, reason: why('khóc thương ở nhà'), until: sc.walk, phase: ph, scene: sc });
      if (day < sc.bury) return d('work', { verb: bearer ? 'bear' : priest ? 'pray' : 'mourn', place: 'grave', carryItem: bearer ? 'coffin' : null, reason: why(bearer ? 'khiêng quan tài' : 'đưa tang'), until: sc.bury, phase: ph, scene: sc });
      return d('work', { verb: priest ? 'pray' : 'mourn', place: 'grave', reason: why('chôn cất'), until: sc.until, phase: ph, scene: sc });
    }
    return null;
  }
  return { dayTick, roleOf, openFuneral };
});
