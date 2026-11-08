/* Bể Kính · render/work3d.js
 * Hai thứ tách bạch (design/npc-song-that.md mục 2, 3, 7.1):
 *   gestureOf  cử chỉ làm việc TẠI CHỖ của một động từ (logic/tasks.js), theo thời kỳ: chỉ những cử chỉ đứng làm ở chỗ làm,
 *              có đồ nghề đúng việc (cuốc ở ruộng, rìu ở bãi gỗ, búa ở mỏ, ở công trình). Không có cử chỉ đi trong danh sách
 *              này: vác hàng là cử chỉ đi, chỉ dùng khi đang mang hàng (carryOf).
 *   carryOf    cách mang một thứ hàng khi đi giữa chỗ làm và kho: bao lương thực vác vai, khúc gỗ vác vai, thúng đá hay quặng
 *              và thùng hàng quý ôm trước ngực (cử chỉ đi trong thư viện, đồ mang trong khung người render/rig3d.js).
 *   PUT        cúi xuống đặt hàng xuống hay nhặt hàng lên (ở kho, ở công trình).
 * Mỗi việc có vài cử chỉ để thay phiên (người này cuốc, người kia gặt), chọn theo người và theo lượt.
 * Đồ cầm tay là bộ phận "tool" trong khung người: hoe cuốc, sickle liềm, hammer búa, axe rìu, coin xu, bowl bát; sack bao, log
 * khúc gỗ, basket thúng, crate thùng hàng.
 * Cần: render/gestures3d.js. */
(function (root, factory) {
  const BK = root.BK || (root.BK = {});
  BK.Work3D = factory(BK);
})(typeof self !== 'undefined' ? self : globalThis, function (BK) {
  'use strict';
  // [cử chỉ, đồ cầm]; hàm theo cấp thời kỳ
  const V = {
    // ruộng: thời đồ đá hái lượm bằng tay; rồi cuốc, gặt; từ thời Tên lửa máy làm, người cúi kiểm tra cây, chỉ việc cho máy
    farm: (lv) => (lv <= 1 ? [['harvest', null]] : lv <= 6 ? [['hoe', 'hoe'], ['harvest', 'sickle']] : [['harvest', null], ['point', null]]),
    build: (lv) => (lv <= 7 ? [['build', 'hammer'], ['mine', 'hammer']] : [['build', 'hammer'], ['point', null]]),
    repair: (lv) => (lv <= 7 ? [['build', 'hammer'], ['mine', 'hammer']] : [['build', 'hammer'], ['point', null]]),
    craft: () => [['build', 'hammer'], ['mine', 'hammer']],      // bàn thợ, đe ở xưởng
    chop: () => [['chop', 'axe']],                               // đốn gỗ ở bãi gỗ (logic/economy.js)
    mine: () => [['mine', 'hammer']],                            // đục đá, đào quặng ở mỏ
    tend: (lv) => (lv <= 6 ? [['build', 'hammer'], ['think', null]] : [['point', null], ['think', null]]), // coi lò, coi máy
    direct: () => [['command', null], ['point', null], ['crossArms', null], ['handsBehind', null]],
    patrol: () => [['lookAround', null], ['guard', null]],
    heal: () => [['kneelPray', null], ['nod', null], ['talk', null]],
    shop: () => [['trade', 'coin'], ['point', null], ['nod', null]],
    stroll: () => [['lookAround', null], ['wave', null], ['stand', null]],
    guard: () => [['guard', null], ['lookAround', null], ['handsBehind', null]],
    drill: () => [['thrust', null], ['block', null], ['command', null]],
    rule: () => [['speech', null], ['command', null], ['handsBehind', null]],
    advise: () => [['talk', null], ['think', null], ['nod', null]],
    pray: (lv) => (lv <= 1 ? [['rainDance', null], ['kneelPray', null]] : [['pray', null], ['kneelPray', null]]),
    trade: () => [['trade', 'coin'], ['talk', null]],
    learn: () => [['think', null], ['nod', null]],
    study: () => [['think', null], ['scratchHead', null]],
    tell: () => [['talk', null], ['wave', null], ['laugh', null]],
    play: () => [['cheer', null], ['dance', null], ['laugh', null]],
    mind: () => [['sit', null], ['wave', null], ['laugh', null]],   // người già trông trẻ ở sân chơi
    errand: () => [['trade', 'coin'], ['nod', null]],
    indoor: () => [['stand', null]],                                // (ở trong nhà: không vẽ, render/village3d.js)               // đi chợ, ra kho lĩnh phần (chu trình mang về nhà)
    help: () => [['harvest', null]],                             // trẻ phụ việc: nhặt, hái cùng người lớn
    eat: () => [['eat', 'bowl'], ['drink', null]],
    rest: () => [['sit', null], ['sway', null], ['stand', null]],
    chat: () => [['talk', null], ['laugh', null], ['nod', null], ['whisper', null]],
    riot: () => [['cheer', null], ['command', null], ['point', null], ['thrust', null]], // (động từ cũ của bạo loạn)
    protest: () => [['cheer', 'sign'], ['command', 'sign']], // biểu tình: giơ biển, hô khẩu hiệu (logic/dramas.js)
    // đám tang (logic/scenes.js): người nhà khóc, quỳ; người khiêng quan tài đứng chờ
    mourn: () => [['cry', null], ['sad', null], ['kneelPray', null]],
    // đói: xếp hàng nhận khẩu phần, trẻ khóc; lễ hội: nhảy múa
    ration: () => [['stand', null], ['sad', null], ['tapFoot', null]],
    cry: () => [['cry', null]],
    dance: () => [['dance', null], ['cheer', null], ['laugh', null]],
    bear: () => [['stand', null], ['sad', null]],
    listen: () => [['nod', null], ['crossArms', null], ['handsBehind', null], ['stand', null]], // đứng nghe diễn thuyết, đứng xem
    // người đứng đầu (logic/leader.js)
    command: () => [['command', null], ['point', null]],                     // ra lệnh sau khi nghe tin
    judge: () => [['point', null], ['command', null], ['shakeHead', null]],  // phân xử hai người cãi nhau
    inspect: () => [['lookAround', null], ['point', null], ['think', null], ['handsBehind', null]], // thị sát, xem hàng
    review: () => [['command', null], ['handsBehind', null], ['point', null]], // duyệt quân
    speech: () => [['speech', null], ['command', null]],                     // nói với dân ở bục
    // người bị kéo vào: báo tin, hộ vệ, mang cơm (logic/leader.js, logic/guards.js)
    report: () => [['bow', null], ['talk', null], ['point', null]],
    escort: () => [['guard', null], ['lookAround', null], ['handsBehind', null]],
    bring: () => [['talk', null], ['nod', null]],
    // lính gác cổng, mỗi người một kiểu (logic/guards.js)
    watch: () => [['lookAround', null], ['point', null], ['guard', null]],
    spear: () => [['guard', null], ['thrust', null]],
    lean: () => [['handsBehind', null], ['sway', null], ['crossArms', null]],
    warm: () => [['rubHands', null]],
    nightWatch: () => [['lookAround', null], ['rubHands', null], ['guard', null]],
    doze: () => [['sway', null], ['stand', null]],
    // đánh thành (logic/siege.js): người nhà ra cổng tiễn quân; dân dạt sang phía bên kia đảo co rúm lại; trốn trong nhà (không
    // vẽ); người đứng đầu cũ quỳ ở sân nhà chính sau khi mất thành
    farewell: () => [['wave', null], ['cry', null], ['sad', null]],
    shelter: () => [['cower', null], ['sad', null]],
    hide: () => [['stand', null]],
    kneel: () => [['submit', null], ['surrender', null]],
    // hệ sinh thái (logic/ecology.js): người ốm vì dịch nằm, ngồi ở nhà; chuyền nước chữa cháy rừng (cúi nhận, đưa lên)
    sick: () => [['sick', null], ['sit', null]],
    // kịch bản chiến tranh (logic/battles.js): xem đấu tướng, khải hoàn, ra mừng, tù binh ngồi
    watchDuel: () => [['cheer', null], ['point', null]],
    parade: () => [['victory', null], ['cheer', null]],
    celebrate: () => [['cheer', null], ['dance', null]],
    captive: () => [['sit', null], ['sad', null]],
    bucket: () => [['harvest', null], ['build', null]],
  };
  // cử chỉ thứ n của một việc cho một người (đổi lượt thì sang cử chỉ khác)
  function gestureOf(verb, level, pid, turn) {
    const list = (V[verb] || V.rest)(level || 1), [key, tool] = list[(pid + turn) % list.length];
    const G = BK.Gestures3D && BK.Gestures3D.BY_KEY[key];
    return G ? { G, tool } : null;
  }
  // cách mang một thứ hàng khi đi: [cử chỉ đi, đồ mang]
  const CARRY = { coffin: ['carryFront', 'crate'], food: ['carry', 'sack'], wood: ['carry', 'log'], stone: ['carryFront', 'basket'], metal: ['carryFront', 'basket'], luxury: ['carryFront', 'crate'] };
  function carryOf(item) { const c = CARRY[item]; const G = c && BK.Gestures3D && BK.Gestures3D.BY_KEY[c[0]]; return G ? { G, tool: c[1] } : null; }
  const PUT = 'harvest'; // cúi xuống đặt, nhặt hàng
  // mọi cử chỉ được phép theo động từ (kiểm thử "không vô nghĩa")
  const allowed = (verb, level) => new Set((V[verb] || V.rest)(level || 1).map((x) => x[0]));
  return { gestureOf, carryOf, PUT, allowed, CARRY, VERBS: Object.keys(V) };
});
