/* Bể Kính · logic/epigen.js · Ngoại gen: nghịch cảnh để lại dấu lên tính cách
 * (design/quy-trinh-tong-quat.md mục 3) Mỗi người có dấu ngoại gen p.epi trên từng chỉ số tính cách. Tính cách biểu hiện
 * p.traits = gen gốc (p.genome.traits) + dấu ngoại gen; mọi chỗ ra quyết định đọc tính cách biểu hiện qua People.traits(p),
 * còn lai gen cho con vẫn dùng gen gốc.
 * Mỗi ngày (dayTick), nghịch cảnh đang có đẩy dấu lên dần (RATE mỗi ngày, tối đa CAP):
 *   đói          đa nghi, hiếu chiến tăng; nhu nhược giảm
 *   thiên tai    người vốn sợ hãi càng sợ; ai cũng sùng đạo hơn
 *   chiến tranh  người gan thì hiếu chiến hơn, người nhát thì sợ hãi hơn
 *   mất người thân (cha mẹ, con, vợ chồng trong 30 ngày)  sùng đạo, sợ hãi tăng
 * Yên ổn thì dấu phai dần (DECAY mỗi ngày).
 * Truyền đời: con sinh ra nhận một phần dấu của mẹ (INHERIT); con sinh ra lúc đảo đang khổ (đói, thiên tai, chiến tranh) có tỉ
 * lệ đột biến cao hơn (mutateBoost, logic/family.js truyền vào Genes.cross).
 * Không vẽ gì, chạy được bằng Node. Cần: logic/genes.js, logic/people.js, logic/climate.js, logic/economy.js. */
(function (root, factory) {
  const BK = root.BK || (root.BK = {});
  BK.Epigen = factory(BK);
  if (typeof module === 'object' && module.exports) module.exports = BK.Epigen;
})(typeof self !== 'undefined' ? self : globalThis, function (BK) {
  'use strict';
  const RATE = 0.002, CAP = 0.25, DECAY = 0.004, INHERIT = 0.4, GRIEF_DAYS = 30;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  // tính cách biểu hiện = gen gốc + dấu ngoại gen
  function express(p) {
    const g = p.genome.traits, e = p.epi || {}, t = p.traits || (p.traits = {});
    for (const k in g) t[k] = clamp(g[k] + (e[k] || 0), 0, 1);
    return t;
  }
  const push = (p, k, d) => { const e = p.epi || (p.epi = {}); e[k] = clamp((e[k] || 0) + d, -CAP, CAP); };
  // mức khổ của cả đảo lúc này (0..1): đói, thiên tai, chiến tranh
  function islandStress(S, day) {
    const hunger = S.eco && S.eco.hunger ? 1 : 0, war = S.situ.war > day ? 1 : 0, dis = BK.Climate ? BK.Climate.stress(S, day) : 0;
    return Math.max(hunger * 0.9, war, dis);
  }
  function dayTick(S, day) {
    const P = BK.People, hunger = !!(S.eco && S.eco.hunger), war = S.situ.war > day, dis = BK.Climate ? BK.Climate.stress(S, day) : 0;
    // ai vừa mất hôm qua, hôm nay: người thân (cha mẹ, con, vợ chồng) mang tang
    for (const q of S.people.values()) {
      if (q.alive || q.died == null || q.died < day - 1) continue;
      for (const id of [...q.parents, ...q.children, ...(q.spouses || [])]) { const r = S.people.get(id); if (r && r.alive) r.grief = day + GRIEF_DAYS; }
    }
    for (const p of S.people.values()) {
      if (!p.alive) continue;
      if (P.ageOf(p, day) < 6) { express(p); continue; }
      const g = p.genome.traits, grief = p.grief > day;
      if (hunger) { push(p, 'paranoia', RATE); push(p, 'aggression', RATE * 0.7); push(p, 'meekness', -RATE * 0.5); }
      if (dis > 0) { push(p, 'fear', RATE * dis * (g.fear > 0.5 ? 1 : 0.3)); push(p, 'piety', RATE * dis * 0.6); }
      if (war) { if (g.fear < 0.5) push(p, 'aggression', RATE); else push(p, 'fear', RATE); }
      if (grief) { push(p, 'piety', RATE * 0.8); push(p, 'fear', RATE * 0.4); }
      if (!hunger && !dis && !war && !grief && p.epi) for (const k in p.epi) p.epi[k] *= 1 - DECAY;
      express(p);
    }
  }
  // con mới sinh: nhận một phần dấu của mẹ
  function inherit(child, mom) { if (!mom || !mom.epi) { express(child); return; } child.epi = {}; for (const k in mom.epi) child.epi[k] = mom.epi[k] * INHERIT; express(child); }
  // hệ số đột biến cho con sinh ra lúc này (1 khi yên ổn, tới 2,5 khi đảo khổ nhất)
  const mutateBoost = (S, day) => 1 + 1.5 * islandStress(S, day);
  return { RATE, CAP, DECAY, INHERIT, express, dayTick, inherit, islandStress, mutateBoost };
});
