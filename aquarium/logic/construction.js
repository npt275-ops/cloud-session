/* Bể Kính · logic/construction.js
 * Dựng công trình trong mỗi thời (design/ke-hoach-buoc-27.md). Đầu thời, làng có danh sách công trình của thời mới
 * (S.buildPlan(cấp): tên, cỡ, có sẵn hay chưa); thợ dựng lần lượt từng cái, bắt đầu từ nhà chính. Tới lượt thì khởi công
 * (progress 0,02: phần vẽ cho thợ tới đứng bốn góc nhà, cái cũ ở chỗ đó vẫn đứng nguyên); đủ người ở công trường (4 thợ, hay mọi
 * thợ của đảo nếu đảo có ít hơn 4; thiếu đúng một người suốt 3 lần nghĩ liền cũng tính) thì xong ngay (progress 1: phần vẽ đổi sang nhà mới luôn, không mọc dần), sang cái kế tiếp.
 * Không có thợ thì không dựng được. Sang thời mới, cái nào chưa xong thì coi như xong (đã kịp dựng trong lúc chuyển thời).
 * Dựng xong ghi nhật ký. Phần vẽ đọc S.build.list[i].progress.
 * Không vẽ gì, chạy được bằng Node. Cần: logic/rules.js, logic/schedule.js. */
(function (root, factory) {
  const BK = root.BK || (root.BK = {});
  BK.Construction = factory(BK);
  if (typeof module === 'object' && module.exports) module.exports = BK.Construction;
})(typeof self !== 'undefined' ? self : globalThis, function (BK) {
  'use strict';
  const STARTED = 0.02; // tiến độ lúc khởi công (đã tới lượt, chờ thợ)
  const builders = (S) => {
    let n = 0;
    for (const p of S.people.values()) if (p.alive && (p.job === 'builder' || p.role === 'builder')) n++;
    return n;
  };
  function setEra(S, level) {
    if (S.build)
      for (const it of S.build.list)
        if (!it.done) {
          it.done = true;
          it.progress = 1;
        }
    const plan = S.buildPlan ? S.buildPlan(level) : [];
    const list = plan.map((x, i) => ({ i, name: x.name, size: x.size || 1, progress: x.done ? 1 : 0, done: !!x.done }));
    S.build = { level, startDay: S.day, list, active: null };
    next(S);
  }
  // khởi công cái kế tiếp chưa xong
  function next(S) {
    const B = S.build;
    const it = B.list.find((x) => !x.done);
    B.active = it ? it.i : null;
    if (it) it.progress = Math.max(it.progress, STARTED);
  }
  // Thợ có mặt ở công trường (design/ke-hoach-buoc-14.md): số thợ xây đang có việc dựng ở công trường (logic/tasks.js: verb build,
  // place site). Thợ đi bắc cầu, sửa chỗ hư, ra trận, chạy nạn thì không tính.
  function onSite(S) {
    let n = 0;
    for (const p of S.people.values())
      if (p.alive && (p.job === 'builder' || p.role === 'builder')) {
        const m = S.minds.get(p.id);
        if (m && m.verb === 'build' && m.place === 'site') n++;
      }
    return n;
  }
  // mỗi lần cả làng nghĩ lại việc (logic/island.js step): đủ người ở công trường thì công trình đang dựng xong ngay
  const WORK = new Set(['morning', 'afternoon']);
  function note(S) {
    const B = S.build;
    if (!B || B.active == null) return;
    if (BK.Schedule && !WORK.has(BK.Schedule.phase(S.tod))) return;
    // đủ người: 4 thợ (hay mọi thợ, đảo ít thợ); thiếu đúng một người (thợ kia bận trông con, ăn) suốt 3 lần nghĩ liền cũng xong
    const need = Math.min(BK.Rules.BUILDERS || 4, builders(S)),
      n = onSite(S);
    B.short = n >= need - 1 && n > 0 ? (B.short || 0) + 1 : 0;
    if (!need || (n < need && B.short < 3)) return;
    B.short = 0;
    const it = B.list[B.active];
    it.progress = 1;
    it.done = true;
    S.log.push({ day: S.day, kind: 'built', ids: [], text: 'Dựng xong ' + it.name.toLowerCase() + '.' });
    next(S);
    S.situChanged = true;
  }
  return { setEra, builders, note, onSite };
});
