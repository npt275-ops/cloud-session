/* Bể Kính · logic/posts.js · Vị trí cứng (kịch bản cố định của thành phố)
 * Những chỗ luôn có người, đời này qua đời khác: người cũ còn làm được thì giữ chỗ, ai mất hay già thì người hợp tính nhất
 * thay vào đúng chốt đó.
 *   gateMain  4 lính gác cổng thành chính (giữa mép trước, cổng thành của đảo)  ngày đêm
 *   gateLeft  2 lính gác cổng phụ bên trái (chỗ hở tường phía đảo bên trái, nơi sau này bắc cầu)  ngày đêm
 *   gateRight 2 lính gác cổng phụ bên phải  ngày đêm
 *   orator    1 người diễn thuyết: sáng và tối đứng ở bục giữa sân nói với dân, cầm đầu các buổi diễn thuyết lớn (logic/dramas.js)
 * Mỗi chốt ghi: số người (count), việc (job, cho trang phục và thẻ người), chỗ đứng (place, phần vẽ đổi thành vị trí thật
 * theo công trình của đảo), điểm chọn người theo gen (score), và có làm cả đêm không (night).
 * p.postKey: chốt đang giữ, p.post: số thứ tự trong chốt (0..count-1). Không phụ thuộc đảo. Chạy được bằng Node.
 * Cần: logic/rules.js. */
(function (root, factory) {
  const BK = root.BK || (root.BK = {});
  BK.Posts = factory(BK);
  if (typeof module === 'object' && module.exports) module.exports = BK.Posts;
})(typeof self !== 'undefined' ? self : globalThis, function (BK) {
  'use strict';
  const guardScore = (t) => (1 - t.fear) * 0.45 + t.paranoia * 0.25 + (1 - t.meekness) * 0.2 + (1 - t.aggression) * 0.1; // gan dạ, hay để ý, vững vàng (người nóng nảy để lại cho đời thường)
  const POSTS = [
    { key: 'gateMain', name: 'Lính gác cổng chính', count: () => BK.Rules.GATEKEEPERS, job: 'gatekeeper', place: 'gate', verb: 'guard', night: true, score: guardScore, why: 'canh gác cổng thành chính' },
    { key: 'gateLeft', name: 'Lính gác cổng phụ trái', count: () => BK.Rules.SIDE_GUARDS, job: 'sideguard', place: 'gateL', verb: 'guard', night: true, score: guardScore, why: 'canh gác cổng phụ bên trái' },
    { key: 'gateRight', name: 'Lính gác cổng phụ phải', count: () => BK.Rules.SIDE_GUARDS, job: 'sideguard', place: 'gateR', verb: 'guard', night: true, score: guardScore, why: 'canh gác cổng phụ bên phải' },
    { key: 'orator', name: 'Người diễn thuyết', count: () => BK.Rules.ORATORS, job: 'orator', place: 'podium', verb: 'rule', night: false, score: (t) => t.cunning * 0.35 + t.ambition * 0.35 + (1 - t.fear) * 0.2 + (1 - t.meekness) * 0.1, why: 'diễn thuyết trước dân' },
  ];
  const BY_KEY = Object.fromEntries(POSTS.map((X) => [X.key, X]));
  // gán chốt từ những người còn trống (pool: người lớn không ngồi hội đồng); trả lại pool đã bớt người
  function assign(S, pool) {
    for (const X of POSTS) {
      const n = X.count();
      // người đang giữ chốt mà còn trong pool: giữ nguyên
      const keep = pool.filter((p) => p.postKey === X.key && p.post != null && p.post < n).sort((a, b) => a.post - b.post);
      const used = new Set(); const kept = [];
      for (const p of keep) { if (used.has(p.post)) continue; used.add(p.post); kept.push(p); }
      for (const p of kept) { p.job = X.job; pool.splice(pool.indexOf(p), 1); }
      // chốt còn trống: người hợp nhất (và chưa giữ chốt khác)
      pool.sort((a, b) => X.score(b.genome.traits) - X.score(a.genome.traits));
      for (let k = 0; k < n; k++) {
        if (used.has(k)) continue;
        const p = pool.shift(); if (!p) break;
        p.job = X.job; p.postKey = X.key; p.post = k; used.add(k);
      }
    }
    return pool;
  }
  // người này đang giữ chốt nào (null nếu không)
  const of = (p) => (p.postKey && BY_KEY[p.postKey] && p.job === BY_KEY[p.postKey].job ? BY_KEY[p.postKey] : null);
  return { POSTS, BY_KEY, assign, of };
});
