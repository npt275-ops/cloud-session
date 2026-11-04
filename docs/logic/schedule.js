/* Bể Kính · logic/schedule.js
 * Lịch một ngày theo giờ trong ngày (S.tod, 0..1, do phần chạy game ghi vào theo vòng ngày đêm trên trời): đêm, sáng, trưa,
 * chiều, tối. Bộ não (logic/brain.js, logic/tasks.js) chọn việc theo buổi; đổi buổi thì mọi người chọn lại việc.
 * Không vẽ gì, chạy được bằng Node. */
(function (root, factory) {
  const BK = root.BK || (root.BK = {});
  BK.Schedule = factory();
  if (typeof module === 'object' && module.exports) module.exports = BK.Schedule;
})(typeof self !== 'undefined' ? self : globalThis, function () {
  'use strict';
  const PHASES = [
    { key: 'night', name: 'đêm', from: 0.9, to: 1.23 }, { key: 'morning', name: 'buổi sáng', from: 0.23, to: 0.45 },
    { key: 'noon', name: 'buổi trưa', from: 0.45, to: 0.55 }, { key: 'afternoon', name: 'buổi chiều', from: 0.55, to: 0.75 },
    { key: 'evening', name: 'buổi tối', from: 0.75, to: 0.9 },
  ];
  function phase(tod) {
    const t = ((tod == null ? 0.35 : tod) % 1 + 1) % 1;
    for (const P of PHASES) { const x = t < P.from && P.to > 1 ? t + 1 : t; if (x >= P.from && x < P.to) return P.key; }
    return 'morning';
  }
  const nameOf = (k) => (PHASES.find((P) => P.key === k) || PHASES[1]).name;
  return { PHASES, phase, nameOf };
});
