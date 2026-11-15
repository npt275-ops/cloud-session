/* Bể Kính · magic/water/deluge/plan.js · Nhịp của Đại hồng thuỷ (chỉ là số và đường cong; chạy được bằng Node)
 * Người chơi chốt: sóng mạnh dần, giữa bể là lốc xoáy, cả nước trong bể dâng lên cao gấp 13 tới 15 lần tầm mắt nhân vật rồi
 * rơi thật mạnh xuống, sóng tràn vào cả sáu đảo. Các pha (giây thật kể từ lúc phát phép):
 *   swell  0 → RISE_AT       sóng lớn dần, lốc xoáy thành hình giữa bể
 *   rise   RISE_AT → HOLD_AT  cả bể dâng lên RISE (= EYES lần tầm mắt EYE), chậm lúc đầu, nhanh giữa chừng, chậm lúc cuối
 *   hold   HOLD_AT → CRASH_AT nước đứng ở đỉnh, lốc xoáy mạnh nhất
 *   crash  CRASH_AT → HIT_AT  nước rơi xuống, càng lúc càng nhanh (như rơi tự do), lốc xoáy sụp
 *   surge  HIT_AT → END       nước đập xuống: sóng tràn vào sáu đảo (hậu quả thật lúc HIT_AT), mặt nước dội xuống thấp
 *                             hơn mặt biển một chút rồi dềnh lên, sóng nhỏ dần về bình thường
 * at(t) → { phase, level (mực nước dâng thêm), swell (độ lớn sóng nhân thêm), vortex (0..1 cỡ lốc xoáy), done }. */
(function (root, factory) {
  const BK = root.BK || (root.BK = {});
  BK.DelugePlan = factory();
  if (typeof module === 'object' && module.exports) module.exports = BK.DelugePlan;
})(typeof self !== 'undefined' ? self : globalThis, function () {
  'use strict';
  const EYE = 1.25, // (đơn vị đảo) tầm mắt nhân vật so với chân (người cao 1,4)
    EYES = 14, // người chơi chốt: 13 tới 15 lần tầm mắt
    RISE = EYE * EYES;
  const RISE_AT = 3,
    HOLD_AT = 8,
    CRASH_AT = 9.5,
    HIT_AT = 11,
    END = 18;
  const SWELL = { top: 2.8, crash: 3.6 }; // độ lớn sóng: lúc dâng, lúc đập xuống
  const clamp = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
  const smooth = (x) => x * x * (3 - 2 * x);
  function at(t) {
    if (t < RISE_AT) {
      const u = t / RISE_AT;
      return { phase: 'swell', level: 0, swell: 1 + (SWELL.top - 1) * smooth(u), vortex: smooth(clamp(t / 4)), done: false };
    }
    if (t < HOLD_AT) {
      const u = (t - RISE_AT) / (HOLD_AT - RISE_AT);
      return { phase: 'rise', level: RISE * smooth(u), swell: SWELL.top, vortex: smooth(clamp(t / 4)), done: false };
    }
    if (t < CRASH_AT) return { phase: 'hold', level: RISE, swell: SWELL.top, vortex: 1, done: false };
    if (t < HIT_AT) {
      const u = (t - CRASH_AT) / (HIT_AT - CRASH_AT);
      return { phase: 'crash', level: RISE * (1 - u * u), swell: SWELL.top + (SWELL.crash - SWELL.top) * u, vortex: 1 - smooth(u), done: false };
    }
    if (t < END) {
      const u = (t - HIT_AT) / (END - HIT_AT);
      // dội xuống thấp hơn mặt biển rồi dềnh lên, tắt dần
      const level = -1.6 * Math.sin(Math.PI * 2.5 * u) * Math.exp(-4 * u);
      return { phase: 'surge', level, swell: 1 + (SWELL.crash - 1) * (1 - smooth(u)), vortex: 0, done: false };
    }
    return { phase: 'done', level: 0, swell: 1, vortex: 0, done: true };
  }
  return { at, EYE, EYES, RISE, RISE_AT, HOLD_AT, CRASH_AT, HIT_AT, END };
});
