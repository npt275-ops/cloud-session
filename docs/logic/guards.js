/* Bể Kính · logic/guards.js · Kịch bản của lính gác cổng (design/npc-song-that.md mục 7.8)
 * Lính giữ chốt cổng chính, cổng phụ (logic/posts.js) gác ca ngày; ca đêm do lính thường thay (logic/tasks.js: nửa số lính ra
 * các chốt cổng ban đêm), nên không ai gác suốt ngày đêm. Mỗi người gác một kiểu theo tính cách của mình:
 *   đa nghi      đảo mắt, chỉ trỏ người qua lại (watch)
 *   hiếu chiến   cầm giáo thẳng, thỉnh thoảng tập đâm (spear)
 *   nhu nhược    đứng dựa, đung đưa, chắp tay sau lưng (lean)
 *   hoạt ngôn    hay quay sang nói chuyện với người gác bên cạnh
 *   sùng đạo     đầu ca sáng chắp tay khấn ở chốt
 * Kịch bản:
 *   báo tin      người được người đứng đầu gọi (S.report, logic/leader.js) chạy vào nhà chính báo, rồi về chốt
 *   kiểm đoàn    đoàn buôn vừa đi hay vừa về (nhật ký của đảo) thì lính cổng phụ ra xem hàng, chỉ đường
 *   ăn trưa      ăn tại chốt; người nhà mang cơm ra (người nhà đi từ nhà tới chốt, logic/tasks.js)
 *   chiều đông   xoa tay cho ấm
 *   giặc tới     logic/brain.js (S.situ.war) đưa lính ra cổng phía bị đánh
 * Không vẽ gì, chạy được bằng Node. Cần: logic/people.js, logic/temper.js, logic/climate.js. */
(function (root, factory) {
  const BK = root.BK || (root.BK = {});
  BK.Guards = factory(BK);
  if (typeof module === 'object' && module.exports) module.exports = BK.Guards;
})(typeof self !== 'undefined' ? self : globalThis, function (BK) {
  'use strict';
  // kiểu đứng gác theo tính cách (động từ, render/work3d.js đổi thành cử chỉ)
  function styleOf(p) {
    const t = BK.People.traits(p), temper = BK.Temper ? BK.Temper.of(p) : null;
    if (t.paranoia > 0.62) return ['watch', 'đảo mắt canh người qua lại'];
    if (t.aggression > 0.62 || temper === 'hothead') return ['spear', 'cầm giáo canh cổng, thỉnh thoảng tập đâm'];
    if (t.meekness > 0.62 || temper === 'timid') return ['lean', 'đứng dựa canh cổng'];
    return ['guard', 'canh cổng'];
  }
  // đoàn buôn vừa đi hay vừa về (trong nửa ngày qua)
  const caravanNow = (S) => S.log.slice(-12).some((e) => e.kind === 'trade' && e.day >= S.day - 0.5 && /Đoàn buôn/.test(e.text));
  // người cùng chốt để nói chuyện
  const mate = (S, p) => [...S.people.values()].find((q) => q !== p && q.alive && !q.away && q.postKey === p.postKey && q.job === p.job) || null;

  // ctx: { S, p, rng, d, job, ph, morning } (logic/tasks.js); post: chốt (logic/posts.js)
  function pick(ctx, post) {
    const { S, p, rng, d, job, ph } = ctx, day = S.day, temper = BK.Temper ? BK.Temper.of(p) : null;
    // báo tin cho người đứng đầu
    if (S.report && S.report.from === p.id && S.report.until > day) return d('talk', { verb: 'report', target: S.seats.king, place: 'hall', reason: 'chạy vào báo tin: ' + S.report.text, until: S.report.until, phase: ph });
    // đêm: lính thường gác thay (logic/tasks.js), người giữ chốt về nhà ngủ
    if (ph === 'night') return job('sleep', 'home', 'về nhà ngủ (ca đêm có lính thường thay)');
    if (ph === 'noon') return job('eat', post.place, 'ăn trưa tại chốt, người nhà mang cơm ra');
    // đầu ca sáng: người sùng đạo khấn ở chốt
    if (ctx.morning && temper === 'devout' && rng.chance(0.5)) return job('pray', post.place, 'khấn đầu ca ở chốt', { until: day + 0.15 });
    // đoàn buôn qua cổng phụ: ra xem hàng
    if (p.job === 'sideguard' && caravanNow(S) && rng.chance(0.6)) return job('inspect', post.place, 'xem hàng đoàn buôn qua cổng', { until: day + 0.3 });
    // chiều đông lạnh (mùa 3, logic/climate.js): xoa tay
    if (ph === 'evening' && BK.Climate && BK.Climate.seasonOf && BK.Climate.seasonOf(day) === 3 && rng.chance(0.5)) return job('warm', post.place, 'xoa tay cho ấm lúc chiều đông');
    // người hoạt ngôn: quay sang nói chuyện với người cùng chốt
    if (temper === 'sociable' && rng.chance(0.4)) { const m = mate(S, p); if (m) return d('talk', { verb: 'chat', target: m.id, place: post.place, reason: 'nói chuyện với người gác cạnh mình', until: day + 0.2, phase: ph }); }
    const [verb, why] = styleOf(p);
    return job(verb, post.place, why);
  }
  // ca đêm: lính thường ra các chốt cổng, kiểu gác ban đêm (đi qua đi lại cho tỉnh, xoa tay, người nhu nhược ngủ gật)
  function nightShift(ctx) {
    const { p, job } = ctx, t = BK.People.traits(p);
    return job(t.meekness > 0.62 ? 'doze' : 'nightWatch', 'nightGate', t.meekness > 0.62 ? 'gác đêm ở cổng (hay ngủ gật)' : 'gác đêm ở cổng');
  }
  // người nhà mang cơm trưa ra chốt cho người gác (logic/tasks.js gọi trước lịch thường)
  function bringMeal(ctx) {
    // người đang giữ chốt (cũng là lính gác) thì không bỏ chốt đi mang cơm
    const { S, p, d, ph } = ctx; if (ph !== 'noon' || p.spouse == null || (BK.Posts && BK.Posts.of(p))) return null;
    const g = S.people.get(p.spouse); if (!g || !g.alive || g.away || !BK.Posts || !BK.Posts.of(g) || !BK.Posts.of(g).night) return null;
    return d('talk', { verb: 'bring', target: g.id, place: 'home', reason: 'mang cơm trưa ra cổng cho ' + BK.People.fullName(g), until: S.day + 0.25, phase: ph });
  }
  return { pick, nightShift, bringMeal, styleOf };
});
