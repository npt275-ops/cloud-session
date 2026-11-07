/* Bể Kính · logic/jobs.js
 * Việc của người không ngồi trong hội đồng, chọn theo tính cách: vị trí cứng (logic/posts.js: gác cổng chính, cổng phụ, diễn
 * thuyết), thợ xây (cho đủ 4 kể cả thợ cả), thương nhân (đủ 2 kể cả
 * thương chủ), lính (máu chiến nhất), người đi đường (hướng ngoại), người làm ra tài nguyên (số còn lại: ruộng, rừng, mỏ...,
 * logic/economy.js), người già, trẻ em.
 * Khi đảo đang đói (logic/economy.js hunger): chỉ giữ một thợ xây, không ai đi đường, ai rảnh tay đều ra làm (xây chậm lại
 * để có cái ăn); chốt gác và diễn thuyết vẫn giữ (logic/posts.js).
 * Gán lại mỗi ngày (người lớn lên, già đi, mất). Không vẽ gì, chạy được bằng Node.
 * Cần: logic/rules.js, logic/people.js, logic/posts.js, logic/temper.js. */
(function (root, factory) {
  const BK = root.BK || (root.BK = {});
  BK.Jobs = factory(BK);
  if (typeof module === 'object' && module.exports) module.exports = BK.Jobs;
})(typeof self !== 'undefined' ? self : globalThis, function (BK) {
  'use strict';
  const NAME = { gatekeeper: 'Lính gác cổng chính', sideguard: 'Lính gác cổng phụ', orator: 'Người diễn thuyết', soldier: 'Lính', builder: 'Thợ xây', trader: 'Thương nhân', worker: 'Người làm', walker: 'Người đi đường', elder: 'Người già', child: 'Trẻ em' };
  // chọn theo tính cách biểu hiện (gen gốc + ngoại gen, logic/epigen.js): lấy n người có điểm cao nhất trong số còn trống, gán việc
  const take = (pool, n, score, job) => { pool.sort((a, b) => score(BK.People.traits(b), b) - score(BK.People.traits(a), a)); pool.splice(0, Math.max(0, n)).forEach((p) => { p.job = job; }); };
  function assign(S) {
    const R = BK.Rules, P = BK.People, day = S.day, pool = [];
    for (const p of S.people.values()) {
      if (!p.alive) continue;
      if (BK.Temper) p.temper = BK.Temper.of(p); // tính cách nổi trội (logic/temper.js), để gom người vào kịch bản
      const age = P.ageOf(p, day);
      if (p.away) continue; // đang đi đánh trận (logic/war.js): vẫn là lính, không gán lại
      if (age < R.ADULT_AGE) p.job = 'child';
      else if (age >= R.OLD_AGE) p.job = 'elder';
      else if (p.role) p.job = null; // người trong hội đồng làm việc của ghế mình
      else pool.push(p);
    }
    // vị trí cứng (logic/posts.js): 4 lính gác cổng chính, 2 cổng phụ trái, 2 cổng phụ phải, 1 người diễn thuyết; người cũ còn
    // làm được thì giữ đúng chốt của mình, thiếu thì người hợp tính nhất thay vào. Chọn trước mọi việc khác: chốt không bao giờ trống
    if (BK.Posts) BK.Posts.assign(S, pool, [...S.people.values()].filter((p) => p.alive && !p.role && p.job === 'elder'));
    // thợ xây: khéo tay, gan, không đa nghi (đủ 4 người kể cả thợ cả); thương nhân: khôn khéo, có chí (đủ 2 kể cả thương chủ)
    const seated = (k) => (S.seats[k] != null ? 1 : 0), lean = !!(S.eco && S.eco.hunger);
    take(pool, (lean ? 1 : R.BUILDERS) - seated('builder'), (t) => t.intellect * 0.4 + (1 - t.fear) * 0.3 + (1 - t.paranoia) * 0.3, 'builder');
    take(pool, R.TRADERS - seated('merchant'), (t) => t.cunning * 0.6 + t.ambition * 0.4, 'trader');
    for (const p of pool) p.postKey = null; // ai không giữ chốt nào thì bỏ dấu chốt cũ
    // lính: máu chiến nhất (nam trước); bao nhiêu lính do người đứng đầu quyết (S.policy.soldierShare, logic/strategy.js)
    take(pool, Math.round(pool.length * (S.policy ? S.policy.soldierShare : R.SOLDIER_SHARE)), (t, p) => (p.sex === 'm' ? 1 : 0) + t.aggression, 'soldier');
    // dân: người hướng ngoại, ít đa nghi đi đường (đi lại, mua bán, trò chuyện); người chăm, hiền làm ruộng
    take(pool, lean ? 0 : Math.round(pool.length * R.WALKER_SHARE), (t) => (1 - t.paranoia) * 0.5 + t.cunning * 0.2 + (1 - t.meekness) * 0.3, 'walker');
    // còn lại là người làm ra tài nguyên; làm thứ gì (p.res) do kinh tế chia theo nhu cầu (logic/economy.js)
    pool.forEach((p) => { p.job = 'worker'; });
  }
  const count = (S, job) => { let n = 0; for (const p of S.people.values()) if (p.alive && p.job === job) n++; return n; };
  return { NAME, assign, count };
});
