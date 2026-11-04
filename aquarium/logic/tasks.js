/* Bể Kính · logic/tasks.js
 * Việc làm trong ngày thường theo vai và theo buổi (logic/schedule.js). Mỗi việc ghi rõ: đến đâu (place), làm gì (verb:
 * động từ, phần vẽ đổi động từ thành cử chỉ và đồ cầm theo thời ở render/work3d.js), và vì sao (reason, hiện trong thẻ người).
 * Không ai đứng không: nghỉ cũng có việc (ăn ở nhà, ngồi bếp lửa, ngủ trong nhà).
 * Vai: người đứng đầu, tướng, quân sư, tư tế, thương chủ, thầy thuốc, thợ cả (ghế hội đồng); thợ xây, thương nhân, lính,
 * nông dân, người đi đường, người già, trẻ em.
 * Cần: logic/schedule.js, logic/people.js. Chạy được bằng Node. */
(function (root, factory) {
  const BK = root.BK || (root.BK = {});
  BK.Tasks = factory(BK);
  if (typeof module === 'object' && module.exports) module.exports = BK.Tasks;
})(typeof self !== 'undefined' ? self : globalThis, function (BK) {
  'use strict';
  // tên động từ (cho thẻ người)
  const VERB_NAME = { farm: 'làm ruộng', build: 'dựng nhà', repair: 'sửa nhà', craft: 'làm thợ', guard: 'canh gác', gatekeep: 'gác cổng', patrol: 'đi tuần', drill: 'luyện quân',
    direct: 'chỉ đạo', rule: 'nói với dân', advise: 'bàn việc làng', pray: 'cầu nguyện', heal: 'chữa bệnh', trade: 'bán hàng', shop: 'mua hàng',
    stroll: 'đi đường', learn: 'học', tell: 'kể chuyện', play: 'chơi đùa', help: 'phụ việc', eat: 'ăn', chat: 'trò chuyện', rest: 'nghỉ', sleep: 'ngủ' };

  // chọn việc cho một người trong ngày thường; d(state, o) tạo đối tượng việc của logic/brain.js; friendOf: tìm bạn để nói chuyện.
  // Mỗi vai có một việc chính cố định qua mọi thời; tính cách chỉ đổi cách làm (luyện hay gác, đi chợ hay trò chuyện).
  // Nhà chính chỉ có người đứng đầu và quân sư; dân chỉ kéo tới đó khi biểu tình (logic/brain.js).
  function pick(S, p, rng, d, friendOf) {
    const P = BK.People, ph = BK.Schedule.phase(S.tod), age = P.ageOf(p, S.day), when = BK.Schedule.nameOf(ph), t = p.genome.traits;
    const span = () => S.day + rng.range(5, 12); // một việc kéo dài vài ngày trong game (khoảng 7 tới 16 giây ở 1×), đổi buổi thì chọn lại
    const job = (verb, place, why, o) => d(o && o.state ? o.state : 'work', Object.assign({ verb, place, reason: why + ' (' + when + ')', until: span(), phase: ph, intensity: 0.4 }, o || {}));
    const chat = (why, place) => { const f = friendOf(S, p, rng); return f != null ? d('talk', { verb: 'chat', target: f, place, reason: why + ' (' + when + ')', until: span(), phase: ph }) : job('rest', place || 'square', why); };
    const role = p.role, j = p.job;
    const building = S.build && S.build.active != null ? S.build.list[S.build.active] : null;
    // lính gác cổng thành: ngày đêm đứng ở cổng (bữa ăn mang ra cổng), canh người ra vào
    if (j === 'gatekeeper') return job('guard', 'gate', ph === 'night' ? 'gác cổng thành ban đêm' : 'canh gác cổng thành');
    // đêm: ai cũng về nhà ngủ, trừ một nửa số lính thay nhau gác
    if (ph === 'night') { if (j === 'soldier' && p.id % 2 === 0) return job('guard', 'guard', 'gác đêm cho làng'); return job('sleep', 'home', 'về nhà ngủ'); }
    // trưa: về nhà ăn (người đứng đầu, lính gác, người bán hàng vẫn ở chỗ mình)
    if (ph === 'noon') {
      if (role === 'king') return job('direct', 'hall', 'trông coi làng giờ trưa');
      if (j === 'soldier' && p.id % 3 === 0) return job('guard', 'guard', 'gác thay ca trưa');
      if (role === 'merchant' || j === 'trader') return job('trade', 'market', 'bán hàng giờ trưa');
      return age < 6 ? job('play', 'home', 'chơi quanh nhà') : job('eat', 'home', 'về nhà ăn trưa');
    }
    // tối: tụ ở sân làng (không phải nhà chính); người đứng đầu ra nói với dân, người già kể chuyện cho trẻ
    if (ph === 'evening') {
      if (role === 'king') return rng.chance(0.5) ? job('rule', 'square', 'ra sân làng nói chuyện với dân') : job('direct', 'hall', 'xem lại việc trong ngày');
      if (role === 'priest') return job('pray', 'shrine', 'làm lễ buổi tối');
      if (j === 'soldier') return p.id % 2 ? job('patrol', 'patrol', 'tuần quanh làng lúc chạng vạng') : chat('nghỉ sau ca gác', 'square');
      if (j === 'elder') return job('tell', 'square', 'kể chuyện cho con cháu');
      if (j === 'child') return job('play', 'square', 'chơi quanh bếp lửa');
      if (role === 'merchant' || j === 'trader') return job('trade', 'market', 'bán nốt hàng');
      return rng.chance(0.4 + 0.4 * (1 - t.paranoia)) ? chat('tụ ở sân làng sau một ngày làm', 'square') : job('rest', 'square', 'ngồi nghỉ bên bếp lửa');
    }
    // sáng và chiều: việc chính của vai
    const morning = ph === 'morning';
    // trẻ: nhỏ thì chơi gần nhà; lớn hơn thì nửa đi học, nửa phụ việc (ruộng, chợ, thợ), sáng chiều đổi phiên để lớp không đông
    if (j === 'child') {
      if (age < 6) return job('play', 'home', 'chơi gần nhà');
      if ((p.id % 2 === 0) === morning) return job('learn', 'school', 'đi học');
      const k = p.id % 3; return k === 0 ? job('help', 'field', 'phụ cha mẹ ngoài ruộng') : k === 1 ? job('help', 'market', 'phụ bán hàng ở chợ') : job('help', 'site', 'phụ thợ khuân vác');
    }
    if (j === 'elder') return morning ? job('rest', 'home', 'ngồi trước nhà') : job('tell', 'square', 'ra sân làng kể chuyện');
    switch (role) {
      case 'king': return job('direct', 'hall', building ? 'chỉ đạo dựng ' + building.name.toLowerCase() : 'chỉ đạo việc của cả làng');
      case 'advisor': return job('advise', 'hall', 'bàn việc làng với người đứng đầu');
      case 'general1': case 'general2': return (role === 'general1') === morning ? job('drill', 'guard', 'luyện quân') : job('patrol', 'patrol', 'đi kiểm tra các chốt gác');
      case 'priest': return job('pray', 'shrine', 'cầu cho làng yên ổn');
      case 'healer': return job('heal', 'visit', 'đi thăm bệnh từng nhà');
      case 'merchant': return job('trade', 'market', 'bán hàng ở chợ');
      case 'builder': break; // thợ cả làm cùng thợ
    }
    if (role === 'builder' || j === 'builder') return building ? job('build', 'site', 'dựng ' + building.name.toLowerCase()) : job('repair', 'repair', 'đi sửa, tu bổ nhà cửa trong làng');
    if (j === 'trader') return job('trade', 'market', 'bán hàng ở chợ');
    if (j === 'soldier') { const drillFirst = t.aggression > t.paranoia; return drillFirst === morning ? job('drill', 'guard', 'luyện võ') : rng.chance(0.5) ? job('guard', 'guard', 'canh gác làng') : job('patrol', 'patrol', 'đi tuần quanh làng'); }
    if (j === 'farmer') return job('farm', 'field', morning ? 'ra ruộng làm' : 'làm ruộng nốt buổi chiều');
    if (j === 'walker') { const r = rng.next(); return r < 0.45 ? job('stroll', 'stroll', 'đi qua lại trong làng') : r < 0.75 ? job('shop', 'market', 'ra chợ mua đồ') : chat('gặp người quen trên đường', 'stroll'); }
    return chat('trò chuyện', 'square');
  }
  return { VERB_NAME, pick };
});
