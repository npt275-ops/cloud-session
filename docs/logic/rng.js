/* Bể Kính · logic/rng.js
 * Số ngẫu nhiên có hạt giống: cùng một hạt giống thì cả trận diễn ra y hệt (để kiểm thử và chơi lại).
 * Không phụ thuộc tệp nào khác. */
(function (root, factory) {
  const BK = root.BK || (root.BK = {});
  BK.Rng = factory();
  if (typeof module === 'object' && module.exports) module.exports = BK.Rng;
})(typeof self !== 'undefined' ? self : globalThis, function () {
  'use strict';

  // mulberry32: nhanh, đủ đều cho trò chơi
  function create(seed) {
    let s = (seed >>> 0) || 1;
    const next = () => {
      s = (s + 0x6d2b79f5) >>> 0;
      let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const R = {
      next,
      range: (a, b) => a + (b - a) * next(),
      int: (a, b) => a + Math.floor(next() * (b - a + 1)), // a..b, tính cả hai đầu
      chance: (p) => next() < p,
      pick: (arr) => arr[Math.floor(next() * arr.length)],
      // phân bố chuông (Box-Muller): phần lớn gần 0, hiếm khi xa
      gauss: () => { let u = 0, v = 0; while (u === 0) u = next(); while (v === 0) v = next(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); },
      // lưu và nạp lại trạng thái (New Game+, lưu trận)
      get state() { return s; },
      set state(v) { s = v >>> 0; },
    };
    return R;
  }

  return { create };
});
