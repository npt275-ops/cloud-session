/* Bể Kính · render/work3d.js
 * Đổi động từ của việc (logic/tasks.js) thành cử chỉ trong thư viện (render/gestures3d.js) và đồ cầm tay, theo thời kỳ.
 * Mỗi việc có vài cử chỉ để thay phiên (người này cuốc, người kia gặt), chọn theo người và theo lượt.
 * Đồ cầm tay là bộ phận "tool" trong khung người (render/rig3d.js): hoe cuốc, sickle liềm, hammer búa, axe rìu, sack bao, coin xu, bowl bát.
 * Cần: render/gestures3d.js. */
(function (root, factory) {
  const BK = root.BK || (root.BK = {});
  BK.Work3D = factory(BK);
})(typeof self !== 'undefined' ? self : globalThis, function (BK) {
  'use strict';
  // [cử chỉ, đồ cầm]; hàm theo cấp thời kỳ
  const V = {
    farm: (lv) => (lv <= 1 ? [['harvest', null], ['carry', 'sack']] : lv <= 6 ? [['hoe', 'hoe'], ['harvest', 'sickle'], ['carry', 'sack']] : [['point', null], ['crossArms', null], ['carry', 'sack']]),
    build: (lv) => (lv <= 1 ? [['mine', 'hammer'], ['carry', 'sack']] : lv <= 7 ? [['build', 'hammer'], ['carry', 'sack'], ['mine', 'hammer']] : [['point', null], ['build', 'hammer']]),
    craft: () => [['mine', 'hammer'], ['chop', 'axe']],
    guard: () => [['guard', null], ['lookAround', null], ['handsBehind', null]],
    drill: () => [['thrust', null], ['block', null], ['command', null]],
    rule: () => [['speech', null], ['command', null], ['handsBehind', null]],
    advise: () => [['talk', null], ['think', null], ['nod', null]],
    pray: (lv) => (lv <= 1 ? [['rainDance', null], ['kneelPray', null]] : [['pray', null], ['kneelPray', null]]),
    trade: () => [['trade', 'coin'], ['talk', null]],
    learn: () => [['think', null], ['nod', null]],
    study: () => [['think', null], ['scratchHead', null]],
    tell: () => [['talk', null], ['wave', null], ['laugh', null]],
    play: () => [['cheer', null], ['dance', null]],
    help: () => [['carry', 'sack'], ['harvest', null]],
    eat: () => [['eat', 'bowl'], ['drink', null]],
    rest: () => [['sit', null], ['sway', null], ['stand', null]],
    chat: () => [['talk', null], ['laugh', null], ['nod', null], ['whisper', null]],
  };
  // cử chỉ thứ n của một việc cho một người (đổi lượt thì sang cử chỉ khác)
  function gestureOf(verb, level, pid, turn) {
    const list = (V[verb] || V.rest)(level || 1), [key, tool] = list[(pid + turn) % list.length];
    const G = BK.Gestures3D && BK.Gestures3D.BY_KEY[key];
    return G ? { G, tool } : null;
  }
  return { gestureOf, VERBS: Object.keys(V) };
});
