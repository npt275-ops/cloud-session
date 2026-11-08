/* Bể Kính · logic/goals.js · Mục tiêu theo trận cho người chơi (design/ke-hoach-khac-phuc.md mục 8)
 * Phần logic cho vòng chơi (giao diện làm sau). Mỗi mục tiêu đang 'active' cho tới khi thành ('done') hay hỏng ('failed'):
 *   hegemon    đưa đảo isle thành bá chủ: hết trận (năm 9) đảo đó còn độc lập và cai quản ít nhất HEGEMON_VASSALS đảo
 *   allAlive   giữ cả sáu đảo còn người tới năm 9: một đảo hết người thì hỏng ngay
 *   noNuke     không để ai dùng hạt nhân: có một quả hạt nhân được bắn thì hỏng ngay; hết trận thì thành
 * add(W, loại, o) thêm mục tiêu; dayTick(W, ngày) xét mỗi ngày (logic/world.js). Không vẽ gì, chạy được bằng Node.
 * Cần: logic/eras.js (MATCH_DAYS), logic/island.js. */
(function (root, factory) {
  const BK = root.BK || (root.BK = {});
  BK.Goals = factory(BK);
  if (typeof module === 'object' && module.exports) module.exports = BK.Goals;
})(typeof self !== 'undefined' ? self : globalThis, function (BK) {
  'use strict';
  const HEGEMON_VASSALS = 3;
  const NAME = { hegemon: 'Đưa một đảo thành bá chủ', allAlive: 'Giữ cả sáu đảo sống tới năm 9', noNuke: 'Không để ai dùng hạt nhân' };
  const end = () => (BK.Eras && BK.Eras.MATCH_DAYS) || 3240;
  function add(W, kind, o) {
    if (!NAME[kind]) return null;
    const g = { kind, name: NAME[kind], isle: o && o.isle != null ? o.isle : null, status: 'active', from: Math.floor(W.day || 0), at: null };
    (W.goals || (W.goals = [])).push(g);
    return g;
  }
  const finish = (g, status, day, why) => { g.status = status; g.at = Math.floor(day); g.why = why; };
  function dayTick(W, day) {
    for (const g of W.goals || []) {
      if (g.status !== 'active') continue;
      if (g.kind === 'noNuke' && W.armStats && W.armStats.nukes > 0) { finish(g, 'failed', day, 'có đảo đã dùng hạt nhân'); continue; }
      if (g.kind === 'allAlive') { const dead = W.islands.find((S) => !BK.Island.living(S).length); if (dead) { finish(g, 'failed', day, dead.name + ' không còn ai'); continue; } }
      if (day < end()) continue;
      if (g.kind === 'hegemon') {
        const S = W.islands[g.isle], n = W.islands.filter((V) => V.annexedBy === g.isle).length;
        if (S.annexedBy == null && n >= HEGEMON_VASSALS) finish(g, 'done', day, S.name + ' cai quản ' + n + ' đảo');
        else finish(g, 'failed', day, S.annexedBy != null ? S.name + ' bị chiếm' : S.name + ' chỉ cai quản ' + n + ' đảo');
      } else finish(g, 'done', day, 'giữ được tới hết trận');
    }
  }
  return { NAME, HEGEMON_VASSALS, add, dayTick };
});
