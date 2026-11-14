/* Bể Kính · magic/earth/rise.js · Đất nhô của phép đất trong thế giới (luật, chạy được bằng Node; test/earth.test.js)
 * Trạng thái nằm trong đảo (S.rises: được lưu cùng trận, tua lùi thì núi về như lúc đó): [{ id, kind, x, z, r, h, seed, born,
 * until }] toạ độ đảo. Gò đất đứng LAST[kind] ngày game rồi hạ xuống; mỗi đảo tối đa MAX khối (thêm nữa thì khối cũ nhất hạ).
 *   raise(S, { kind, x, z, r, h }, ngày)  thêm một khối; trả khối đó
 *   step(S, ngày)                         bỏ khối đã hết giờ
 * Phần vẽ (magic/earth/look3d.js) theo danh sách này: khối mới thì trồi lên, khối mất thì hạ xuống. */
(function (root, factory) {
  const BK = root.BK || (root.BK = {});
  BK.EarthRise = factory();
  if (typeof module === 'object' && module.exports) module.exports = BK.EarthRise;
})(typeof self !== 'undefined' ? self : globalThis, function () {
  'use strict';
  const LAST = { uplift: 40, mount: 60 }, // ngày game gò đất đứng (tốc độ thường chừng 0,75 ngày mỗi giây thật)
    MAX = 6;
  function raise(S, o, day) {
    const list = S.rises || (S.rises = []);
    S.riseSeq = (S.riseSeq || 0) + 1;
    const b = { id: S.riseSeq, kind: o.kind, x: o.x, z: o.z, r: o.r, h: o.h, seed: (S.riseSeq * 2.399) % 6.283, born: day };
    b.until = day + (LAST[o.kind] || 30);
    list.push(b);
    while (list.length > MAX) list.shift();
    return b;
  }
  function step(S, day) {
    if (S.rises && S.rises.some((b) => b.until <= day)) S.rises = S.rises.filter((b) => b.until > day);
  }
  return { raise, step, LAST, MAX };
});
