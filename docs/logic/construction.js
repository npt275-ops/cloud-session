/* Bể Kính · logic/construction.js
 * Dựng công trình trong mỗi thời. Đầu thời, làng có danh sách công trình của thời mới (S.buildPlan(cấp): tên, cỡ, có sẵn hay
 * chưa); thợ dựng lần lượt từng cái, bắt đầu từ nhà chính. Mỗi ngày, công trình đang dựng tiến thêm theo số thợ (cả ghế thợ
 * cả) nhân với phần thợ đang có mặt ở công trường (không ai ở công trường thì đứng yên); đủ tổ 4 thợ làm đều thì xong cả
 * danh sách lúc khoảng 80% thời, thiếu thợ thì chậm hơn. Sang thời mới, cái nào chưa xong
 * thì coi như xong (đã kịp dựng trong lúc chuyển thời). Dựng xong ghi nhật ký. Phần vẽ đọc S.build.list[i].progress.
 * Không vẽ gì, chạy được bằng Node. Cần: logic/rules.js, logic/eras.js. */
(function (root, factory) {
  const BK = root.BK || (root.BK = {});
  BK.Construction = factory(BK);
  if (typeof module === 'object' && module.exports) module.exports = BK.Construction;
})(typeof self !== 'undefined' ? self : globalThis, function (BK) {
  'use strict';
  const DUTY = 0.8; // phần thợ có mặt ở công trường trong giờ làm của một ngày thường (đo trên trận mẫu)
  const builders = (S) => {
    let n = 0;
    for (const p of S.people.values()) if (p.alive && (p.job === 'builder' || p.role === 'builder')) n++;
    return n;
  };
  const rateOf = (S) => {
    const n = builders(S);
    return n ? 0.55 + 0.45 * Math.min(1, n / (BK.Rules.BUILDERS || 4)) : 0.55;
  };
  function setEra(S, level) {
    const E = BK.Eras;
    if (S.build)
      for (const it of S.build.list)
        if (!it.done) {
          it.done = true;
          it.progress = 1;
        }
    const plan = S.buildPlan ? S.buildPlan(level) : [];
    const list = plan.map((x, i) => ({ i, name: x.name, size: x.size || 1, progress: x.done ? 1 : 0, done: !!x.done }));
    const total = list.reduce((a, it) => a + (it.done ? 0 : it.size), 0);
    // việc cần cho một đơn vị cỡ: với số thợ đang có đầu thời, có mặt ở công trường như ngày thường (DUTY), cả danh sách xong ở
    // 80% thời (thêm thợ thì xong sớm hơn; thợ bị kéo đi việc khác, chạy nạn thì chậm lại hay dừng hẳn)
    const unit = total ? (0.8 * E.ERA_DAYS * rateOf(S) * DUTY) / total : 1;
    S.build = { level, startDay: S.day, list, unit, active: null };
    next(S);
  }
  function next(S) {
    const B = S.build;
    const it = B.list.find((x) => !x.done);
    B.active = it ? it.i : null;
  }
  // Thợ có mặt ở công trường (design/ke-hoach-buoc-14.md): mỗi lần cả làng nghĩ lại việc trong giờ làm (sáng, chiều), ghi phần thợ
  // xây đang có việc dựng ở công trường (logic/tasks.js: verb build, place site). Thợ đi bắc cầu, sửa chỗ hư, ra trận, chạy nạn
  // thì không tính. logic/island.js step gọi sau mỗi nhịp nghĩ.
  const WORK = new Set(['morning', 'afternoon']);
  function onSite(S) {
    let n = 0,
      all = 0;
    for (const p of S.people.values())
      if (p.alive && (p.job === 'builder' || p.role === 'builder')) {
        all++;
        const m = S.minds.get(p.id);
        if (m && m.verb === 'build' && m.place === 'site') n++;
      }
    return all ? n / all : 0;
  }
  function note(S) {
    const B = S.build;
    if (!B || B.active == null) return;
    if (BK.Schedule && !WORK.has(BK.Schedule.phase(S.tod))) return;
    B.crewAcc = (B.crewAcc || 0) + onSite(S);
    B.crewN = (B.crewN || 0) + 1;
  }
  // mỗi ngày: công trình đang dựng tiến thêm theo số thợ (thiếu thợ thì chậm) nhân với phần thợ có mặt ở công trường trong giờ
  // làm của ngày đó (B.crew, 0..1): không ai ở công trường thì công trình đứng yên
  // (ngày không có nhịp nghĩ nào rơi vào giờ làm, khi chạy nhảy từng ngày: lấy phần thợ có mặt của ngày gần nhất đo được)
  function dayTick(S, day) {
    const B = S.build;
    if (!B || B.active == null) return;
    const it = B.list[B.active],
      crew = B.crewN ? B.crewAcc / B.crewN : B.crew != null ? B.crew : onSite(S);
    B.crewAcc = 0;
    B.crewN = 0;
    B.crew = crew;
    const rate = builders(S) ? rateOf(S) * crew : 0;
    it.progress = Math.min(1, it.progress + rate / (B.unit * it.size));
    if (it.progress >= 1) {
      it.done = true;
      S.log.push({ day, kind: 'built', ids: [], text: 'Dựng xong ' + it.name.toLowerCase() + '.' });
      next(S);
      S.situChanged = true;
    }
  }
  return { setEra, dayTick, builders, note, onSite };
});
