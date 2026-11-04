/* Bể Kính · logic/tasks.js
 * Việc làm trong ngày thường theo vai và theo buổi (logic/schedule.js). Mỗi việc ghi rõ: đến đâu (place), làm gì (verb:
 * động từ, phần vẽ đổi động từ thành cử chỉ và đồ cầm theo thời ở render/work3d.js), và vì sao (reason, hiện trong thẻ người).
 * Không ai đứng không: nghỉ cũng có việc (ăn ở nhà, ngồi bếp lửa, ngủ trong nhà).
 * Vai: người đứng đầu, tướng, quân sư, tư tế, thương chủ, học giả, thợ cả (ghế hội đồng); lính, thợ, nông dân, người già, trẻ em.
 * Cần: logic/schedule.js, logic/people.js. Chạy được bằng Node. */
(function (root, factory) {
  const BK = root.BK || (root.BK = {});
  BK.Tasks = factory(BK);
  if (typeof module === 'object' && module.exports) module.exports = BK.Tasks;
})(typeof self !== 'undefined' ? self : globalThis, function (BK) {
  'use strict';
  // tên động từ (cho thẻ người)
  const VERB_NAME = { farm: 'làm ruộng', build: 'dựng nhà', craft: 'làm thợ', guard: 'canh gác', drill: 'luyện quân', rule: 'điều hành làng', advise: 'bàn việc làng',
    pray: 'cầu nguyện', trade: 'buôn bán', learn: 'học', study: 'nghiên cứu', tell: 'kể chuyện', play: 'chơi đùa', help: 'phụ việc', eat: 'ăn', chat: 'trò chuyện', rest: 'nghỉ', sleep: 'ngủ' };

  // chọn việc cho một người trong ngày thường; d(state, o) tạo đối tượng việc của logic/brain.js; friendOf: tìm bạn để nói chuyện
  function pick(S, p, rng, d, friendOf) {
    const P = BK.People, ph = BK.Schedule.phase(S.tod), age = P.ageOf(p, S.day), when = BK.Schedule.nameOf(ph);
    const span = () => S.day + rng.range(5, 12); // một việc kéo dài vài ngày trong game (khoảng 7 tới 16 giây ở 1×), đổi buổi thì chọn lại
    const job = (verb, place, why, o) => d(o && o.state ? o.state : 'work', Object.assign({ verb, place, reason: why + ' (' + when + ')', until: span(), phase: ph, intensity: 0.4 }, o || {}));
    const chat = (why) => { const f = friendOf(S, p, rng); return f != null ? d('talk', { verb: 'chat', target: f, reason: why + ' (' + when + ')', until: span(), phase: ph }) : job('rest', 'square', why); };
    const role = p.role, j = p.job;
    // đêm: ai cũng về nhà ngủ, trừ một nửa số lính thay nhau gác
    if (ph === 'night') { if (j === 'soldier' && p.id % 2 === 0) return job('guard', 'guard', 'gác đêm cho làng'); return job('sleep', 'home', 'về nhà ngủ'); }
    // trưa: về nhà ăn
    if (ph === 'noon') return age < 6 ? job('play', 'home', 'chơi quanh nhà') : job('eat', 'home', 'về nhà ăn trưa');
    // tối: tụ ở bếp lửa, sân làng; người đứng đầu nói với dân, người già kể chuyện cho trẻ
    if (ph === 'evening') {
      if (role === 'king' && rng.chance(0.5)) return job('rule', 'square', 'nói chuyện với dân làng');
      if (j === 'elder') return job('tell', 'square', 'kể chuyện cho con cháu');
      if (j === 'child') return job('play', 'square', 'chơi quanh bếp lửa');
      return rng.chance(0.6) ? chat('tụ ở sân làng sau một ngày làm') : job('rest', 'square', 'ngồi nghỉ bên bếp lửa');
    }
    // sáng và chiều: làm việc của mình
    if (j === 'child') { if (age < 6) return job('play', 'home', 'chơi gần nhà'); return ph === 'morning' ? job('learn', 'hall', 'đi học') : job('help', 'field', 'phụ cha mẹ ngoài ruộng'); }
    if (j === 'elder') return ph === 'morning' ? job('rest', 'home', 'ngồi trước nhà') : job('tell', 'square', 'ra sân làng kể chuyện');
    if (role === 'king') return job('rule', 'hall', 'điều hành làng ở nhà chính');
    if (role === 'advisor') return job('advise', 'hall', 'bàn việc làng với người đứng đầu');
    if (role === 'general1' || role === 'general2') return job('drill', 'guard', 'luyện quân');
    if (role === 'priest') return job('pray', 'hall', 'cầu cho làng yên ổn');
    if (role === 'merchant') return job('trade', 'square', 'buôn bán ở sân làng');
    if (role === 'scholar') return job('study', 'hall', 'nghiên cứu điều mới');
    if (role === 'builder' || j === 'builder') return S.build && S.build.active != null ? job('build', 'site', 'dựng ' + S.build.list[S.build.active].name.toLowerCase()) : job('craft', 'field', 'làm đồ cho làng');
    if (j === 'soldier') return p.id % 2 === (ph === 'morning' ? 0 : 1) ? job('guard', 'guard', 'canh gác làng') : job('drill', 'guard', 'luyện võ');
    if (j === 'farmer') return job('farm', 'field', ph === 'morning' ? 'ra ruộng làm' : 'làm ruộng nốt buổi chiều');
    return chat('trò chuyện');
  }
  return { VERB_NAME, pick };
});
