/* Bể Kính · logic/jobs.js
 * Việc của người không ngồi trong hội đồng, chọn theo tính cách: thợ xây (cho đủ 4 kể cả thợ cả), thương nhân (đủ 2 kể cả
 * thương chủ), lính (máu chiến nhất), người đi đường (hướng ngoại), nông dân (số còn lại), người già, trẻ em.
 * Gán lại mỗi ngày (người lớn lên, già đi, mất). Không vẽ gì, chạy được bằng Node.
 * Cần: logic/rules.js, logic/people.js. */
(function (root, factory) {
  const BK = root.BK || (root.BK = {});
  BK.Jobs = factory(BK);
  if (typeof module === 'object' && module.exports) module.exports = BK.Jobs;
})(typeof self !== 'undefined' ? self : globalThis, function (BK) {
  'use strict';
  const NAME = { gatekeeper: 'Lính gác cổng', soldier: 'Lính', builder: 'Thợ xây', trader: 'Thương nhân', farmer: 'Nông dân', walker: 'Người đi đường', elder: 'Người già', child: 'Trẻ em' };
  // chọn theo tính cách: lấy n người có điểm cao nhất trong số còn trống, gán việc
  const take = (pool, n, score, job) => { pool.sort((a, b) => score(b.genome.traits, b) - score(a.genome.traits, a)); pool.splice(0, Math.max(0, n)).forEach((p) => { p.job = job; }); };
  function assign(S) {
    const R = BK.Rules, P = BK.People, day = S.day, pool = [];
    for (const p of S.people.values()) {
      if (!p.alive) continue;
      const age = P.ageOf(p, day);
      if (age < R.ADULT_AGE) p.job = 'child';
      else if (age >= R.OLD_AGE) p.job = 'elder';
      else if (p.role) p.job = null; // người trong hội đồng làm việc của ghế mình
      else pool.push(p);
    }
    // thợ xây: khéo tay, gan, không đa nghi (đủ 4 người kể cả thợ cả); thương nhân: khôn khéo, có chí (đủ 2 kể cả thương chủ)
    const seated = (k) => (S.seats[k] != null ? 1 : 0);
    take(pool, R.BUILDERS - seated('builder'), (t) => t.intellect * 0.4 + (1 - t.fear) * 0.3 + (1 - t.paranoia) * 0.3, 'builder');
    take(pool, R.TRADERS - seated('merchant'), (t) => t.cunning * 0.6 + t.ambition * 0.4, 'trader');
    // lính gác cổng thành: đa nghi (hay để ý), gan dạ, không nhút nhát; luôn đủ 4 người, mỗi người một chốt (p.post 0..3),
    // người cũ còn đứng gác thì giữ nguyên chốt của mình
    const keep = pool.filter((p) => p.wasGate).sort((a, b) => a.post - b.post).slice(0, R.GATEKEEPERS);
    for (const p of keep) { p.job = 'gatekeeper'; pool.splice(pool.indexOf(p), 1); }
    const posts = new Set(keep.map((p) => p.post));
    take(pool, R.GATEKEEPERS - keep.length, (t) => t.paranoia * 0.4 + (1 - t.fear) * 0.4 + t.aggression * 0.2, 'gatekeeper');
    for (const p of S.people.values()) { if (p.alive && p.job === 'gatekeeper') { if (p.post == null || !p.wasGate) { let k = 0; while (posts.has(k)) k++; p.post = k; posts.add(k); } p.wasGate = true; } else if (p.alive) p.wasGate = false; }
    // lính: máu chiến nhất (nam trước)
    take(pool, Math.round(pool.length * R.SOLDIER_SHARE), (t, p) => (p.sex === 'm' ? 1 : 0) + t.aggression, 'soldier');
    // dân: người hướng ngoại, ít đa nghi đi đường (đi lại, mua bán, trò chuyện); người chăm, hiền làm ruộng
    take(pool, Math.round(pool.length * R.WALKER_SHARE), (t) => (1 - t.paranoia) * 0.5 + t.cunning * 0.2 + (1 - t.meekness) * 0.3, 'walker');
    pool.forEach((p) => { p.job = 'farmer'; });
  }
  const count = (S, job) => { let n = 0; for (const p of S.people.values()) if (p.alive && p.job === job) n++; return n; };
  return { NAME, assign, count };
});
