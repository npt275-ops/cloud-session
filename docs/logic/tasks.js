/* Bể Kính · logic/tasks.js
 * Việc làm trong ngày thường theo vai và theo buổi (logic/schedule.js). Mỗi việc ghi rõ: đến đâu (place), làm gì (verb:
 * động từ, phần vẽ đổi động từ thành cử chỉ và đồ cầm theo thời ở render/work3d.js), và vì sao (reason, hiện trong thẻ người).
 * Không ai đứng không: nghỉ cũng có việc (ăn ở nhà, ngồi trước cửa, ngủ trong nhà). Ai làm ở đâu thì ở đó; trò chuyện với
 * hàng xóm ngay trước cửa nhà; giữa sân chỉ có người đứng đầu, người diễn thuyết và người đi bộ qua (trừ lúc có drama).
 * Vai: người đứng đầu, tướng, quân sư, tư tế, thương chủ, thầy thuốc, thợ cả (ghế hội đồng); thợ xây, thương nhân, lính,
 * nông dân, người đi đường, người già, trẻ em.
 * Vị trí cứng (logic/posts.js) đứng đúng chốt; drama (logic/dramas.js) được bộ não xét trước lịch này.
 * Người đứng đầu có bộ kịch bản riêng (logic/leader.js), lính gác cổng cũng vậy (logic/guards.js); người khác bị kéo vào kịch
 * bản của họ (họp hội đồng, hộ vệ, nghe nói, mang cơm ra cổng) trước lịch thường.
 * Đầu vào, đầu ra (design/npc-song-that.md mục 3): việc làm ra hay dùng vật liệu có chu trình (cycle), phần vẽ chạy theo:
 *   người làm ra tài nguyên  { item, src: chỗ làm, dst: 'store', workAt: 'src' }: làm ở chỗ làm, mang sản phẩm về kho, đặt
 *                            xuống, quay lại (năng lượng không mang: đi theo dây)
 *   thợ xây                  { item, src: 'store', dst: 'site', workAt: 'dst' }: ra kho lấy gỗ, đá, mang tới công trình, dựng
 * Cần: logic/schedule.js, logic/people.js, logic/posts.js. Chạy được bằng Node. */
(function (root, factory) {
  const BK = root.BK || (root.BK = {});
  BK.Tasks = factory(BK);
  if (typeof module === 'object' && module.exports) module.exports = BK.Tasks;
})(typeof self !== 'undefined' ? self : globalThis, function (BK) {
  'use strict';
  // việc của người làm ra từng loại tài nguyên: [động từ, chỗ, lý do]
  const WORK = { food: ['farm', 'field', 'làm ra lương thực'], wood: ['chop', 'woods', 'đốn gỗ'], stone: ['mine', 'quarry', 'đục đá'], metal: ['mine', 'quarry', 'đào quặng'], energy: ['tend', 'plant', 'coi giữ nguồn năng lượng'], luxury: ['craft', 'craft', 'làm hàng quý ở xưởng'] };
  // tên động từ (cho thẻ người)
  const VERB_NAME = { farm: 'làm ruộng', chop: 'đốn gỗ', mine: 'đục đá, đào quặng', tend: 'coi máy', craft: 'làm hàng', build: 'dựng nhà', repair: 'sửa nhà', craft: 'làm thợ', guard: 'canh gác', gatekeep: 'gác cổng', patrol: 'đi tuần', drill: 'luyện quân',
    direct: 'chỉ đạo', rule: 'nói với dân', advise: 'bàn việc làng', pray: 'cầu nguyện', heal: 'chữa bệnh', trade: 'bán hàng', shop: 'mua hàng',
    stroll: 'đi bộ', learn: 'học', tell: 'kể chuyện', play: 'chơi đùa', help: 'phụ việc', eat: 'ăn', chat: 'trò chuyện', rest: 'nghỉ', sleep: 'ngủ' };

  // chọn việc cho một người trong ngày thường; d(state, o) tạo đối tượng việc của logic/brain.js; friendOf: tìm bạn để nói chuyện.
  // Mỗi vai có một việc chính cố định qua mọi thời; tính cách chỉ đổi cách làm (luyện hay gác, đi chợ hay trò chuyện).
  // Nhà chính chỉ có người đứng đầu và quân sư; dân chỉ kéo tới đó khi biểu tình (logic/brain.js).
  function pick(S, p, rng, d, friendOf) {
    const P = BK.People, ph = BK.Schedule.phase(S.tod), age = P.ageOf(p, S.day), when = BK.Schedule.nameOf(ph), t = P.traits(p);
    const span = () => S.day + rng.range(5, 12); // một việc kéo dài vài ngày trong game (khoảng 7 tới 16 giây ở 1×), đổi buổi thì chọn lại
    const job = (verb, place, why, o) => d(o && o.state ? o.state : 'work', Object.assign({ verb, place, reason: why + ' (' + when + ')', until: span(), phase: ph, intensity: 0.4 }, o || {}));
    const chat = (why, place) => { const f = friendOf(S, p, rng); return f != null ? d('talk', { verb: 'chat', target: f, place, reason: why + ' (' + when + ')', until: span(), phase: ph }) : job('rest', place || 'home', why); };
    // trò chuyện với hàng xóm (nhà kề bên) hay vợ chồng, ngay trước cửa nhà: không băng qua cả làng tìm bạn
    const neighborChat = (why) => {
      const near = [...S.people.values()].filter((q) => q.alive && q.id !== p.id && P.ageOf(q, S.day) >= 12 && (q.id === p.spouse || (q.home != null && p.home != null && Math.abs(q.home - p.home) <= 1)));
      const f = near.length ? near[Math.floor(rng.next() * near.length)].id : null;
      return f != null ? d('talk', { verb: 'chat', target: f, place: 'home', reason: why + ' (' + when + ')', until: span(), phase: ph }) : job('rest', 'home', 'ngồi nghỉ trước cửa nhà');
    };
    const role = p.role, j = p.job;
    const building = S.build && S.build.active != null ? S.build.list[S.build.active] : null;
    const post = BK.Posts && BK.Posts.of(p);
    const ctx = { S, p, rng, d, job, ph, morning: ph === 'morning', building };
    // bị kéo vào kịch bản của người đứng đầu (họp, hộ vệ, nghe nói, đi dạo cùng); mang cơm trưa ra cổng cho người nhà đang gác
    if (BK.Leader) { const x = BK.Leader.joinIn(ctx); if (x) return x; }
    if (BK.Guards) { const x = BK.Guards.bringMeal(ctx); if (x) return x; }
    // người đứng đầu, lính giữ chốt cổng: kịch bản riêng
    if (role === 'king' && BK.Leader) return BK.Leader.pick(ctx);
    if (post && post.night && BK.Guards) return BK.Guards.pick(ctx, post);
    // đói (logic/economy.js): trưa ra kho xếp hàng nhận khẩu phần; trẻ con đói thì khóc ở nhà
    const eco = S.eco, hungry = !!(eco && (eco.hunger || eco.scarce)); // logic/economy.js: đang đói, hay kho dưới 3 ngày ăn
    if (hungry && ph === 'noon' && age >= 6 && !p.away) return job('ration', 'queue', 'xếp hàng nhận khẩu phần ở kho (đảo đang đói)', { until: S.day + 0.3 });
    if (hungry && j === 'child' && ph !== 'night' && rng.chance(0.3)) return job('cry', 'home', 'đói, khóc đòi ăn', { until: S.day + 0.2 });
    // người diễn thuyết: sáng và tối đứng ở bục giữa sân nói với dân, trưa về ăn, chiều đi gặp dân, đêm ngủ
    if (post && post.key === 'orator' && ph !== 'night') {
      if (ph === 'morning' || ph === 'evening') return job('rule', 'podium', ph === 'morning' ? 'diễn thuyết buổi sáng ở bục giữa sân' : 'diễn thuyết buổi tối cho dân nghe');
      if (ph === 'noon') return job('eat', 'home', 'về nhà ăn trưa');
      return job('stroll', 'stroll', 'đi bộ dọc phố gặp dân');
    }
    // đêm: ai cũng về nhà ngủ, trừ một nửa số lính ra các chốt cổng thay ca gác đêm (logic/guards.js)
    if (ph === 'night') { if (j === 'soldier' && p.id % 2 === 0) return BK.Guards ? BK.Guards.nightShift(ctx) : job('guard', 'guard', 'gác đêm cho làng'); return job('sleep', 'home', 'về nhà ngủ'); }
    // trưa: về nhà ăn (người đứng đầu, lính gác, người bán hàng vẫn ở chỗ mình)
    if (ph === 'noon') {
      if (j === 'soldier' && p.id % 3 === 0) return job('guard', 'guard', 'gác thay ca trưa');
      if (role === 'merchant' || j === 'trader') return job('trade', 'market', 'bán hàng giờ trưa');
      return age < 6 ? job('play', 'home', 'chơi quanh nhà') : job('eat', 'home', 'về nhà ăn trưa');
    }
    // tối: tụ ở sân làng (không phải nhà chính); người đứng đầu ra nói với dân, người già kể chuyện cho trẻ
    if (ph === 'evening') {
      if (role === 'priest') return job('pray', 'shrine', 'làm lễ buổi tối');
      if (j === 'soldier') return p.id % 2 ? job('patrol', 'patrol', 'tuần quanh làng lúc chạng vạng') : job('rest', 'guard', 'nghỉ ở chốt sau ca gác');
      if (j === 'elder') return job('tell', 'home', 'kể chuyện cho con cháu trước cửa nhà');
      if (j === 'child') return job('play', 'home', 'chơi trước cửa nhà');
      if (role === 'merchant' || j === 'trader') return job('trade', 'market', 'bán nốt hàng');
      return rng.chance(0.4 + 0.4 * (1 - t.paranoia)) ? neighborChat('trò chuyện với hàng xóm sau một ngày làm') : job('rest', 'home', 'ngồi nghỉ trước cửa nhà');
    }
    // sáng và chiều: việc chính của vai
    const morning = ph === 'morning';
    // trẻ: nhỏ thì chơi gần nhà; lớn hơn thì nửa đi học, nửa phụ việc (ruộng, chợ, thợ), sáng chiều đổi phiên để lớp không đông
    if (j === 'child') {
      if (age < 6) return job('play', 'home', 'chơi gần nhà');
      if ((p.id % 2 === 0) === morning) return job('learn', 'school', 'đi học');
      const k = p.id % 3; return k === 0 ? job('help', 'field', 'phụ cha mẹ ngoài ruộng') : k === 1 ? job('help', 'market', 'phụ bán hàng ở chợ') : job('help', 'site', 'phụ thợ khuân vác');
    }
    if (j === 'elder') return morning ? job('rest', 'home', 'ngồi trước nhà') : neighborChat('kể chuyện với hàng xóm');
    switch (role) {
      case 'advisor': return job('advise', 'hall', 'bàn việc làng với người đứng đầu');
      case 'general1': case 'general2': return (role === 'general1') === morning ? job('drill', 'drill', 'luyện quân ở bãi tập') : job('patrol', 'patrol', 'đi kiểm tra các chốt gác');
      case 'priest': return job('pray', 'shrine', 'cầu cho làng yên ổn');
      case 'healer': return job('heal', 'visit', 'đi thăm bệnh từng nhà');
      case 'merchant': return job('trade', 'market', 'bán hàng ở chợ');
      case 'builder': break; // thợ cả làm cùng thợ
    }
    // thợ xây: ra kho lấy vật liệu (gỗ hay đá, người này người kia), mang tới công trình rồi dựng
    if (role === 'builder' || j === 'builder') return building ? job('build', 'site', 'dựng ' + building.name.toLowerCase(), { cycle: { item: p.id % 2 ? 'wood' : 'stone', src: 'store', dst: 'site', workAt: 'dst' } }) : job('repair', 'repair', 'đi sửa, tu bổ nhà cửa trong làng');
    if (j === 'trader') return job('trade', 'market', 'bán hàng ở chợ');
    if (j === 'soldier') { const drillFirst = t.aggression > t.paranoia; return drillFirst === morning ? job('drill', 'drill', 'luyện võ ở bãi tập') : rng.chance(0.5) ? job('guard', 'guard', 'canh gác làng') : job('patrol', 'patrol', 'đi tuần quanh làng'); }
    // người làm ra tài nguyên: làm đúng thứ kinh tế giao (p.res, logic/economy.js), ở đúng chỗ của thứ đó
    // làm xong một mẻ thì mang sản phẩm về kho (năng lượng đi theo dây, không mang)
    if (j === 'worker') { const r = WORK[p.res] ? p.res : 'food', w = WORK[r]; return job(w[0], w[1], morning ? w[2] : w[2] + ' nốt buổi chiều', r === 'energy' ? null : { cycle: { item: r, src: w[1], dst: 'store', workAt: 'src' } }); }
    // người đi đường: chủ yếu đi bộ dọc phố (gặp ai thì dừng lại nói chuyện, render/village3d.js), có lúc ra chợ, có lúc ngồi trước nhà
    if (j === 'walker' && p.id % 3 === 0) return job('stroll', 'hallLoop', 'đi bộ quanh nhà chính'); // vài người (khoảng một phần ba người đi đường) đi dạo quanh nhà chính
    if (j === 'walker') { const r = rng.next(); return r < 0.6 ? job('stroll', 'stroll', 'đi bộ dọc phố') : r < 0.85 ? job('shop', 'market', 'ra chợ mua đồ') : job('rest', 'home', 'ngồi nghỉ trước cửa nhà'); }
    return neighborChat('trò chuyện với hàng xóm');
  }
  return { VERB_NAME, WORK, pick };
});
