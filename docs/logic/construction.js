/* Bể Kính · logic/construction.js
 * Dựng công trình trong mỗi thời. Đầu thời, làng có danh sách công trình của thời mới (S.buildPlan(cấp): tên, cỡ, có sẵn hay
 * chưa); thợ dựng lần lượt từng cái, bắt đầu từ nhà chính. Mỗi ngày, công trình đang dựng tiến thêm theo số thợ (cả ghế thợ
 * cả); tốc độ tính sao cho với số thợ đầu thời thì xong cả danh sách lúc khoảng 80% thời. Sang thời mới, cái nào chưa xong
 * thì coi như xong (đã kịp dựng trong lúc chuyển thời). Dựng xong ghi nhật ký. Phần vẽ đọc S.build.list[i].progress.
 * Không vẽ gì, chạy được bằng Node. Cần: logic/rules.js, logic/eras.js. */
(function (root, factory) {
  const BK = root.BK || (root.BK = {});
  BK.Construction = factory(BK);
  if (typeof module === 'object' && module.exports) module.exports = BK.Construction;
})(typeof self !== 'undefined' ? self : globalThis, function (BK) {
  'use strict';
  const builders = (S) => { let n = 0; for (const p of S.people.values()) if (p.alive && (p.job === 'builder' || p.role === 'builder')) n++; return n; };
  function setEra(S, level) {
    const E = BK.Eras;
    if (S.build) for (const it of S.build.list) if (!it.done) { it.done = true; it.progress = 1; }
    const plan = S.buildPlan ? S.buildPlan(level) : [];
    const list = plan.map((x, i) => ({ i, name: x.name, size: x.size || 1, progress: x.done ? 1 : 0, done: !!x.done }));
    const total = list.reduce((a, it) => a + (it.done ? 0 : it.size), 0), b0 = Math.max(1, builders(S));
    // việc cần cho một đơn vị cỡ: với b0 thợ, cả danh sách xong ở 80% thời
    const unit = total ? (0.8 * E.ERA_DAYS * (1 + 0.8 * b0)) / total : 1;
    S.build = { level, startDay: S.day, list, unit, active: null };
    next(S);
  }
  function next(S) { const B = S.build; const it = B.list.find((x) => !x.done); B.active = it ? it.i : null; }
  // mỗi ngày: công trình đang dựng tiến thêm (1 + 0,8 × số thợ) đơn vị việc
  function dayTick(S, day) {
    const B = S.build; if (!B || B.active == null) return;
    const it = B.list[B.active], rate = 1 + 0.8 * builders(S);
    it.progress = Math.min(1, it.progress + rate / (B.unit * it.size));
    if (it.progress >= 1) { it.done = true; S.log.push({ day, kind: 'built', ids: [], text: 'Dựng xong ' + it.name.toLowerCase() + '.' }); next(S); S.situChanged = true; }
  }
  return { setEra, dayTick, builders };
});
