/* Bể Kính · magic/fire/blaze.js · Nhà cháy vì phép lửa (luật, chạy được bằng Node; kiểm thử: test/blaze.test.js)
 * Trạng thái nằm trong đảo (S.blaze: được lưu cùng trận, tua lùi thì về như cũ): { khoá: { last, until } }; khoá là chỗ có độ
 * bền của logic/siege.js (nhà dân 'home:<số>', bãi làm việc: store, craft, power, farm, wood, stone).
 *   ignite(S, khoá, ngày)  bén lửa: cháy BURN_DAYS ngày game (đang cháy thì cháy lâu thêm, tối đa MAX_DAYS kể từ lúc này)
 *   step(S, ngày)          cháy tới ngày này: mỗi ngày mất RATE độ bền (BK.Siege.hit: kho cháy thì mất hàng); hết giờ thì tắt
 *   douse(S, khoá)         dập lửa (phép nước sau này); không khoá: dập hết
 * Hậu quả theo luật sẵn có (logic/siege.js): nhà dưới độ bền HOMELESS thì người nhà ở nhờ hàng xóm; dưới COLLAPSE thì sụp;
 * hết chiến tranh thì thợ xây sửa lại (tốn gỗ, đá). Một lần bén lửa làm một nhà mất gần nửa độ bền (người nhà phải ở nhờ); ba lần thì sụp.
 * Lửa trên nhà (hạt) vẽ ở magic/fire/look3d.js theo S.blaze. Theo ngày game: dừng thời gian thì lửa không cháy thêm, tua nhanh thì cháy nhanh. Cần: logic/siege.js. */
(function (root, factory) {
  const BK = root.BK || (root.BK = {});
  BK.Blaze = factory(BK);
  if (typeof module === 'object' && module.exports) module.exports = BK.Blaze;
})(typeof self !== 'undefined' ? self : globalThis, function (BK) {
  'use strict';
  const BURN_DAYS = 10, // ngày game một lần bén lửa cháy (tốc độ thường chừng 0,75 ngày mỗi giây thật: cháy hơn 10 giây)
    MAX_DAYS = 16, // cháy lâu nhất (kể từ lúc này) khi bị đốt chồng
    RATE = 0.045; // độ bền mất mỗi ngày đang cháy
  const all = (S) => S.blaze || (S.blaze = {});
  function ignite(S, key, day) {
    const B = all(S),
      b = B[key];
    if (b) b.until = Math.min(day + MAX_DAYS, Math.max(b.until, day) + BURN_DAYS);
    else B[key] = { last: day, until: day + BURN_DAYS };
    return B[key];
  }
  function step(S, day) {
    if (!S.blaze) return;
    for (const key of Object.keys(S.blaze)) {
      const b = S.blaze[key],
        t = Math.min(day, b.until);
      if (t > b.last) BK.Siege.hit(S, key, RATE * (t - b.last));
      b.last = Math.max(b.last, t);
      if (day >= b.until || (S.ruin && S.ruin[key] === 0)) delete S.blaze[key];
    }
  }
  function douse(S, key) {
    if (!S.blaze) return;
    if (key == null) S.blaze = {};
    else delete S.blaze[key];
  }
  return { ignite, step, douse, BURN_DAYS, MAX_DAYS, RATE };
});
