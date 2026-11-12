/* Bể Kính · logic/leader.js · Kịch bản của người đứng đầu đảo (design/npc-song-that.md mục 7.7)
 * Mỗi buổi người đứng đầu (ghế king, logic/council.js) chọn một kịch bản theo hoàn cảnh của đảo và tính cách của mình
 * (tính cách nổi trội logic/temper.js và gen biểu hiện). Kịch bản kéo theo người khác thật:
 *   nhận tin      có tin lớn mới (nhật ký của đảo: chiến tranh, đoàn buôn, hiệp ước, lên thời, đói, người trong hội đồng mất)
 *                 thì một lính gác cổng chính chạy vào báo (S.report: ai báo, tin gì, tới khi nào; logic/guards.js đọc), người
 *                 đứng đầu đứng nghe rồi ra lệnh
 *   họp hội đồng  vài ngày một lần, hay ngay sau tin lớn: S.meeting; quân sư, hai tướng, tư tế, thương chủ tới sân nhà chính
 *                 đứng quanh người đứng đầu (logic/tasks.js đọc)
 *   thị sát       đang dựng công trình thì tới công trình; kho vơi, đói thì tới kho; hạn hán thì ra ruộng; có lính hộ vệ đi
 *                 theo (S.escort; người đa nghi thì luôn có hộ vệ)
 *   duyệt quân    đang tích quân hay vừa có chiến tranh thì ra bãi tập
 *   nói trước dân lễ hội, mới lên thời, dân bất bình (đảo bị sáp nhập) hay người hoạt ngôn: lên bục giữa sân (S.leaderSpeech;
 *                 người đi đường ghé nghe)
 *   xử kiện       đang có người cãi nhau (S.situ.quarrel): tới chỗ hai người, chỉ tay phân xử
 *   cầu nguyện    thiên tai, dịch, tang, hay người sùng đạo: tới chỗ thờ
 *   ở trường      người ham học: ghé trường xem trẻ học
 *   ăn, nghỉ      trưa ăn ở nhà chính; tối dạo sân với vợ hay chồng (người kia đi theo), đêm về nhà ngủ
 * Mở kịch bản kéo người khác vào thì đặt S.rethink: lần nghĩ sau (logic/brain.js think) mọi người xét lại, người được gọi tới ngay.
 * Không vẽ gì, chạy được bằng Node. Cần: logic/people.js, logic/temper.js, logic/economy.js, logic/climate.js. */
(function (root, factory) {
  const BK = root.BK || (root.BK = {});
  BK.Leader = factory(BK);
  if (typeof module === 'object' && module.exports) module.exports = BK.Leader;
})(typeof self !== 'undefined' ? self : globalThis, function (BK) {
  'use strict';
  const NEWS = new Set(['war', 'trade', 'treaty', 'era', 'hunger', 'seat']); // loại tin trong nhật ký đáng báo
  const REPORT_DAYS = 0.35,
    MEETING_DAYS = 0.5,
    MEETING_EVERY = 4,
    SPEECH_DAYS = 0.4;

  // tin lớn mới nhất chưa báo (trong 2 ngày qua)
  function freshNews(S) {
    for (let k = S.log.length - 1; k >= 0 && k > S.log.length - 30; k--) {
      const e = S.log[k];
      if (e.day < S.day - 2) break;
      if (NEWS.has(e.kind) && e !== S.lastNews) return e;
    }
    return null;
  }
  // người gác cổng chính sẽ chạy vào báo tin (người giữ chốt đầu tiên còn ở đảo)
  const messenger = (S) => [...S.people.values()].find((q) => q.alive && !q.away && q.job === 'gatekeeper') || null;

  // ctx: { S, p, rng, d, job, ph, morning, building } (logic/tasks.js)
  function pick(ctx) {
    const { S, p, rng, d, job, ph, building } = ctx,
      P = BK.People,
      t = P.traits(p),
      temper = BK.Temper ? BK.Temper.of(p) : null;
    const day = S.day,
      E = BK.Economy,
      st = E ? E.state(S) : null,
      king = p.id;
    if (ph === 'night') return job('sleep', 'home', 'về nhà ngủ (lính gác trước cửa)');
    // đang nghe tin
    if (S.report && S.report.until > day)
      return d('talk', {
        verb: 'listen',
        target: S.report.from,
        place: 'hall',
        reason: 'nghe lính gác báo: ' + S.report.text,
        until: S.report.until,
        phase: ph,
      });
    if (S.report && S.report.cmdUntil > day) return job('command', 'hall', 'ra lệnh sau khi nghe tin', { until: S.report.cmdUntil });
    // tin lớn mới: gọi lính gác vào báo
    // tin lớn mới (báo xong một tin thì ít nhất một ngày sau mới báo tin tiếp, kẻo lính gác chạy vào liên tục)
    const news = !S.report || day > S.report.cmdUntil + 1 ? freshNews(S) : null,
      m = news && messenger(S);
    if (news && m && ph !== 'noon') {
      S.lastNews = news;
      S.report = { from: m.id, text: news.text, until: day + REPORT_DAYS, cmdUntil: day + REPORT_DAYS + 0.2 };
      S.rethink = true;
      if (news.kind === 'war' || news.kind === 'era' || news.kind === 'hunger')
        S.meeting = { until: day + REPORT_DAYS + MEETING_DAYS, why: news.text };
      return d('talk', {
        verb: 'listen',
        target: m.id,
        place: 'hall',
        reason: 'nghe lính gác báo: ' + news.text,
        until: S.report.until,
        phase: ph,
      });
    }
    // đang họp
    if (S.meeting && S.meeting.until > day)
      return job('rule', 'hall', 'họp hội đồng: ' + (S.meeting.why || 'việc của đảo'), { until: S.meeting.until });
    // đang có người cãi nhau: tới phân xử
    const Q = S.situ.quarrel;
    if (Q && Q.until > day && ph !== 'noon')
      return d('talk', {
        verb: 'judge',
        target: Q.a,
        place: 'square',
        reason: 'phân xử hai người cãi nhau',
        until: Math.min(Q.until, day + 0.4),
        phase: ph,
      });
    if (ph === 'noon') return job('eat', 'hall', 'ăn trưa ở nhà chính');
    if (ph === 'evening') {
      // tối: dạo sân với vợ hay chồng (người kia đi theo, logic/tasks.js), hay ra sân nói chuyện với dân
      if (temper === 'sociable' || rng.chance(0.3)) return job('rule', 'square', 'ra sân làng nói chuyện với dân');
      return job('stroll', 'hallLoop', 'dạo quanh nhà chính lúc chiều tối' + (p.spouse ? ' cùng người nhà' : ''), { walkWith: p.spouse });
    }
    // sáng, chiều: chọn kịch bản theo hoàn cảnh, tính cách nghiêng điểm, bốc thăm có trọng số
    const opts = [];
    const add = (w, f) => {
      if (w > 0) opts.push([w, f]);
    };
    const disaster = BK.Climate ? BK.Climate.active(S, day).length > 0 : false;
    // họp hội đồng định kỳ (sáng)
    add(ctx.morning && (!S.meetDay || day - S.meetDay > MEETING_EVERY) ? 2 : 0, () => {
      S.meetDay = day;
      S.meeting = { until: day + MEETING_DAYS, why: 'bàn việc định kỳ' };
      S.rethink = true;
      return job('rule', 'hall', 'họp hội đồng bàn việc định kỳ', { until: S.meeting.until });
    });
    // thị sát công trình đang dựng, kho, ruộng
    add(building ? 1 + (temper === 'ambitious' ? 1 : 0) : 0, () => {
      S.escort = { of: king, until: day + 0.5 };
      S.rethink = true;
      return job('inspect', 'site', 'thị sát chỗ dựng ' + building.name.toLowerCase(), { until: day + 0.5 });
    });
    add(st && (st.hunger || st.stock.food < st.eaten * 20) ? 2 : 0.3, () => {
      S.escort = { of: king, until: day + 0.4 };
      S.rethink = true;
      return job('inspect', 'store', st && st.hunger ? 'xem kho lương thực lúc dân đói' : 'xem kho của đảo', { until: day + 0.4 });
    });
    add(S.situ.drought > day ? 1.5 : 0, () => job('inspect', 'field', 'ra ruộng xem hạn hán', { until: day + 0.4 }));
    // duyệt quân
    add((S.policy && S.policy.stance === 'arm' ? 1.2 : 0.2) + (temper === 'ambitious' || temper === 'hothead' ? 0.8 : 0), () => {
      S.escort = { of: king, until: day + 0.4 };
      S.rethink = true;
      return job('review', 'drill', 'duyệt quân ở bãi tập', { until: day + 0.4 });
    });
    // nói trước dân
    add((S.situ.festival > day ? 2 : 0) + ((S.unrest || 0) > 0.4 ? 1.5 : 0) + (temper === 'sociable' ? 1 : 0.15), () => {
      S.leaderSpeech = { until: day + SPEECH_DAYS };
      S.rethink = true;
      return job('speech', 'podium', 'nói với dân ở bục giữa sân', { until: day + SPEECH_DAYS });
    });
    // cầu nguyện
    add((disaster || S.situ.mourning > day ? 1.5 : 0) + (temper === 'devout' ? 1.2 : 0.1), () =>
      job('pray', 'shrine', disaster ? 'cầu cho đảo qua thiên tai' : 'cầu cho đảo yên ổn', { until: day + 0.4 }),
    );
    // ghé trường
    add(temper === 'scholar' ? 1 : 0.15, () => job('inspect', 'school', 'ghé trường xem trẻ học', { until: day + 0.4 }));
    // ở nhà chính lo việc (người nhút nhát hay ở đây; đa nghi thì có hộ vệ đứng cạnh)
    add(0.8 + (temper === 'timid' ? 1.5 : 0) + 0.3 * t.paranoia, () => {
      if (t.paranoia > 0.6) {
        S.escort = { of: king, until: day + 0.5 };
        S.rethink = true;
      }
      return job('direct', 'hall', building ? 'chỉ đạo dựng ' + building.name.toLowerCase() : 'trông coi việc của đảo');
    });
    const sum = opts.reduce((s, o) => s + o[0], 0);
    let r = rng.next() * sum;
    for (const [w, f] of opts) {
      r -= w;
      if (r <= 0) return f();
    }
    return opts[opts.length - 1][1]();
  }
  // người khác bị kéo vào kịch bản của người đứng đầu (logic/tasks.js gọi trước lịch thường): họp hội đồng, hộ vệ, nghe nói,
  // đi dạo cùng. Trả về việc hay null
  const COUNCIL = new Set(['advisor', 'general1', 'general2', 'priest', 'merchant']);
  function joinIn(ctx) {
    const { S, p, d, ph } = ctx,
      day = S.day,
      king = S.seats.king;
    if (king == null || king === p.id || ph === 'night') return null;
    const K = S.people.get(king);
    if (!K || !K.alive) return null;
    if (S.meeting && S.meeting.until > day && COUNCIL.has(p.role))
      return d('talk', {
        verb: 'advise',
        target: king,
        place: 'hall',
        reason: 'họp hội đồng: ' + (S.meeting.why || ''),
        until: S.meeting.until,
        phase: ph,
      });
    // hộ vệ: người lính đầu tiên đang ở nhà đi theo người đứng đầu
    if (
      S.escort &&
      S.escort.until > day &&
      p.job === 'soldier' &&
      p === [...S.people.values()].find((q) => q.alive && !q.away && q.job === 'soldier')
    )
      return d('work', { verb: 'escort', follow: king, place: 'hall', reason: 'hộ vệ người đứng đầu', until: S.escort.until, phase: ph });
    // người nhà đi dạo cùng lúc chiều tối
    if (ph === 'evening' && K.spouse === p.id) {
      const m = S.minds.get(king);
      if (m && m.walkWith === p.id)
        return d('work', { verb: 'stroll', follow: king, place: 'hallLoop', reason: 'đi dạo cùng người nhà', until: m.until, phase: ph });
    }
    // người đi đường ghé nghe người đứng đầu nói
    if (S.leaderSpeech && S.leaderSpeech.until > day && p.job === 'walker')
      return d('talk', {
        verb: 'listen',
        target: king,
        place: 'podium',
        reason: 'nghe người đứng đầu nói',
        until: S.leaderSpeech.until,
        phase: ph,
      });
    return null;
  }
  return { pick, joinIn, freshNews };
});
