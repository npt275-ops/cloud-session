/* Bể Kính · logic/jobs.js
 * Việc của người không ngồi trong hội đồng: lính (người máu chiến nhất trong số người lớn), thợ (khéo và có chí nhất trong số
 * còn lại), nông dân, người già, trẻ em.
 * Lính đi tuần quanh làng và ra cầu khi có chiến tranh; nông dân ra ruộng; người già quanh quẩn ở nhà và sân làng.
 * Gán lại mỗi ngày (người lớn lên, già đi, mất). Không vẽ gì, chạy được bằng Node.
 * Cần: logic/rules.js, logic/people.js. */
(function (root, factory) {
  const BK = root.BK || (root.BK = {});
  BK.Jobs = factory(BK);
  if (typeof module === 'object' && module.exports) module.exports = BK.Jobs;
})(typeof self !== 'undefined' ? self : globalThis, function (BK) {
  'use strict';
  const NAME = { soldier: 'Lính', builder: 'Thợ', farmer: 'Nông dân', elder: 'Người già', child: 'Trẻ em' };
  function assign(S) {
    const R = BK.Rules, P = BK.People, day = S.day, adults = [];
    for (const p of S.people.values()) {
      if (!p.alive) continue;
      const age = P.ageOf(p, day);
      if (age < R.ADULT_AGE) p.job = 'child';
      else if (age >= R.OLD_AGE) p.job = 'elder';
      else if (p.role) p.job = null; // người trong hội đồng làm việc của ghế mình
      else adults.push(p);
    }
    // lính: phần người lớn máu chiến nhất (nam trước, thiếu thì lấy cả nữ)
    adults.sort((a, b) => (b.sex === 'm') - (a.sex === 'm') || b.genome.traits.aggression - a.genome.traits.aggression);
    const n = Math.round(adults.length * R.SOLDIER_SHARE);
    adults.forEach((p, i) => { p.job = i < n ? 'soldier' : 'farmer'; });
    // thợ: phần người lớn còn lại khéo và có chí nhất (gen trí tuệ và tham vọng) dựng nhà, làm đồ
    const rest = adults.filter((p) => p.job === 'farmer').sort((a, b) => (b.genome.traits.intellect + b.genome.traits.ambition) - (a.genome.traits.intellect + a.genome.traits.ambition));
    const nb = Math.max(rest.length ? 1 : 0, Math.round(rest.length * R.BUILDER_SHARE));
    rest.forEach((p, i) => { if (i < nb) p.job = 'builder'; });
  }
  const count = (S, job) => { let n = 0; for (const p of S.people.values()) if (p.alive && p.job === job) n++; return n; };
  return { NAME, assign, count };
});
