/* Bể Kính · logic/dramas.js · Drama trong thành phố
 * Một drama gom những người CÙNG TÍNH CÁCH (logic/temper.js) đang làm việc khác (ruộng, chợ, trường, bệnh viện...) lại một chỗ,
 * diễn qua vài màn, xong thì ai về việc nấy: người đi làm ở bệnh viện bỏ việc ra tham gia, drama tan thì lịch thường
 * (logic/tasks.js) đưa họ về đúng việc của mình. Người giữ vị trí cứng (logic/posts.js: lính gác cổng) không bỏ chốt.
 *
 * Mỗi drama là một dòng trong bảng DRAMAS (thêm drama mới chỉ cần thêm dòng, không sửa bộ máy):
 *   key, name        mã và tên
 *   phases           drama chỉ nổ ra vào các buổi này (logic/schedule.js); tới đêm thì tan
 *   chance           khả năng nổ ra mỗi ngày trong game (nhân với boost(S): hạn hán, tang, đổi thời...)
 *   cooldown         số ngày tối thiểu giữa hai lần
 *   minPeople        làng phải có ít nhất chừng này người lớn
 *   cast             các nhóm vai: { id, temper (tính cách cần), n: [ít nhất, nhiều nhất], fitMin (điểm hợp tính tối thiểu), from: 'post:orator' | 'role:priest' (lấy
 *                    đúng người giữ chốt hay ghế) }. Nhóm đầu là người cầm đầu.
 *   stages           các màn: { dur (ngày), why, act: { [id nhóm]: việc } }; việc = { state, verb, mood, place, target }
 *                    target: 'lead' (người cầm đầu), 'king' (người đứng đầu làng), 'pair' (người cùng nhóm ghép đôi)
 *   avoid            người ngoài drama mà sợ nó: { temper, why } ở trong nhà tới khi drama tan (lính gác, hội đồng không trốn)
 *   responders       người được gọi tới xử lý (không cùng tính cách): { pick: 'job:soldier' | 'role:general' | 'post:orator', n, act }
 *   say              câu ghi vào nhật ký lúc bắt đầu và lúc tan
 * Bộ máy: update(S, days) mỗi nhịp chạy (logic/island.js): sang màn, tan drama, bốc thăm drama mới; taskFor(S, p, d) cho bộ não
 * (logic/brain.js) biết người này đang ở drama nào và phải làm gì. Không phụ thuộc đảo. Chạy được bằng Node.
 * Cần: logic/rules.js, logic/people.js, logic/temper.js, logic/posts.js, logic/schedule.js. */
(function (root, factory) {
  const BK = root.BK || (root.BK = {});
  BK.Dramas = factory(BK);
  if (typeof module === 'object' && module.exports) module.exports = BK.Dramas;
})(typeof self !== 'undefined' ? self : globalThis, function (BK) {
  'use strict';
  const DAY = ['morning', 'afternoon', 'evening'];
  const DRAMAS = [
    // biểu tình (khoá cũ 'riot'): tụ tập ở sân, rồi xếp hàng ngang hàng dọc trước nhà chính, cầm biển hô khẩu hiệu (không giận dữ)
    { key: 'riot', name: 'Biểu tình', phases: DAY, chance: 0.005, cooldown: 45, minPeople: 14,
      avoid: { temper: ['timid'], why: 'sợ đám đông, ở trong nhà' }, // người nhút nhát (không trong drama) trốn trong nhà
      boost: (S) => (S.situ.drought > S.day ? 6 : 1) * (S.food < 1 ? 2 : 1),
      // đám biểu tình: người nóng nảy, tham vọng, cả người hoạt ngôn (đủ đông để xếp hàng ngang hàng dọc)
      cast: [{ id: 'lead', temper: ['ambitious', 'hothead'], n: [1, 1] }, { id: 'mob', temper: ['hothead', 'ambitious', 'sociable'], n: [5, 16], fitMin: 0.45 }],
      stages: [
        { dur: 0.7, why: 'tụ tập ở sân, nghe người cầm đầu nói, giơ biển', act: { lead: { state: 'work', verb: 'speech', place: 'square' }, mob: { state: 'work', verb: 'protest', place: 'square' } } },
        { dur: 1.4, why: 'biểu tình trước nhà chính: xếp hàng, cầm biển hô khẩu hiệu', act: { lead: { state: 'talk', target: 'king' }, mob: { state: 'work', verb: 'protest', place: 'protest' } } },
      ],
      responders: [
        { pick: 'job:soldier', n: 4, act: { state: 'work', verb: 'guard', place: 'hall' }, why: 'giữ trật tự trước nhà chính' },
        { pick: 'role:general', n: 2, act: { state: 'work', verb: 'drill', place: 'hall' }, why: 'chỉ huy lính giữ nhà chính' },
        { pick: 'post:orator', n: 1, act: { state: 'work', verb: 'rule', place: 'hall' }, why: 'ra nói với đám đông cho dịu lại' },
      ],
      say: ['{lead} dẫn {n} người kéo nhau đi biểu tình trước nhà chính.', 'Cuộc biểu tình tan, ai về việc nấy.'] },
    { key: 'brawl', name: 'Ẩu đả ở chợ', phases: DAY, chance: 0.05, cooldown: 8, minPeople: 8,
      cast: [{ id: 'fight', temper: ['hothead', 'ambitious'], n: [2, 2], fitMin: 0.52 }, { id: 'watch', temper: ['sociable', 'ambitious'], n: [2, 5], fitMin: 0.5 }],
      stages: [{ dur: 0.45, why: 'ẩu đả ngoài chợ', act: { fight: { state: 'attack', target: 'pair', place: 'market' }, watch: { state: 'talk', verb: 'listen', target: 'lead', place: 'market' } } }],
      responders: [{ pick: 'job:soldier', n: 2, act: { state: 'work', verb: 'guard', place: 'market' }, why: 'tới can hai người đánh nhau' }],
      say: ['{lead} và một người nóng tính đánh nhau ngoài chợ, {n} người đứng xem.', 'Hai người đánh nhau ngoài chợ đã bị can ra.'] },
    { key: 'speech', name: 'Diễn thuyết lớn', phases: ['morning', 'evening'], chance: 0.12, cooldown: 3, minPeople: 8,
      cast: [{ id: 'lead', from: 'post:orator', n: [1, 1] }, { id: 'crowd', temper: ['sociable', 'ambitious'], n: [3, 10], fitMin: 0.52 }],
      stages: [{ dur: 0.6, why: 'nghe diễn thuyết ở sân', act: { lead: { state: 'work', verb: 'rule', place: 'podium' }, crowd: { state: 'talk', verb: 'listen', target: 'lead', place: 'podium' } } }],
      say: ['{lead} diễn thuyết giữa sân, {n} người tụ lại nghe.', 'Buổi diễn thuyết xong, người nghe tản đi.'] },
    { key: 'vigil', name: 'Cầu nguyện tập thể', phases: DAY, chance: 0.04, cooldown: 10, minPeople: 8,
      boost: (S) => (S.situ.drought > S.day ? 5 : 1) * (S.situ.mourning > S.day ? 4 : 1),
      cast: [{ id: 'lead', from: 'role:priest', n: [1, 1] }, { id: 'faith', temper: ['devout'], n: [4, 8] }],
      stages: [{ dur: 0.8, why: 'cầu nguyện cùng mọi người', act: { lead: { state: 'work', verb: 'pray', place: 'shrine' }, faith: { state: 'idle', mood: 'pray', place: 'shrine' } } }],
      say: ['{lead} dẫn {n} người sùng đạo cầu nguyện.', 'Buổi cầu nguyện kết thúc.'] },
    { key: 'debate', name: 'Tranh luận ở trường', phases: ['morning', 'afternoon'], chance: 0.05, cooldown: 8, minPeople: 10,
      cast: [{ id: 'lead', temper: ['scholar'], n: [1, 1] }, { id: 'minds', temper: ['scholar'], n: [2, 4] }],
      stages: [{ dur: 0.6, why: 'tranh luận với những người ham học', act: { lead: { state: 'work', verb: 'advise', place: 'school' }, minds: { state: 'talk', verb: 'chat', target: 'lead', place: 'school' } } }],
      say: ['{lead} mở cuộc tranh luận ở trường, {n} người ham học tham gia.', 'Cuộc tranh luận ở trường tạm dừng.'] },
    { key: 'gossip', name: 'Tụ tập buôn chuyện', phases: DAY, chance: 0.1, cooldown: 2, minPeople: 6,
      cast: [{ id: 'lead', temper: ['sociable'], n: [1, 1], fitMin: 0.5 }, { id: 'ring', temper: ['sociable', 'timid', 'devout'], n: [2, 5], fitMin: 0.5 }],
      stages: [{ dur: 0.35, why: 'tụ lại buôn chuyện trước cửa nhà', act: { lead: { state: 'work', verb: 'tell', place: 'home' }, ring: { state: 'talk', verb: 'chat', target: 'lead', place: 'home' } } }], // trước cửa nhà người kể
      say: ['{lead} và {n} người tụ lại buôn chuyện.', null] },
    { key: 'eraFeast', name: 'Mừng thời mới', phases: DAY, chance: 0, cooldown: 0, minPeople: 4, onEra: true,
      cast: [{ id: 'lead', from: 'post:orator', n: [1, 1] }, { id: 'all', temper: ['sociable', 'ambitious', 'devout', 'scholar'], n: [8, 16] }],
      stages: [{ dur: 0.9, why: 'mừng làng sang thời mới', act: { lead: { state: 'work', verb: 'rule', place: 'podium' }, all: { state: 'work', verb: 'play', place: 'square' } } }],
      say: ['Cả làng ra sân mừng thời mới, {lead} đứng nói.', null] },
  ];
  const BY_KEY = Object.fromEntries(DRAMAS.map((D) => [D.key, D]));
  const MAX_ACTIVE = 2;
  const FIT_MIN = 0.56; // điểm tính cách tối thiểu để bị cuốn vào drama khi tính cách nổi trội là cái khác

  const state = (S) => S.dramas || (S.dramas = { active: [], last: {} });
  const adult = (S, p) => { const a = BK.People.ageOf(p, S.day); return a >= BK.Rules.ADULT_AGE && a < BK.Rules.OLD_AGE + 8; };
  const busy = (S, id) => state(S).active.some((A) => A.who.has(id));
  const fixedPost = (p) => p.job === 'gatekeeper' || p.job === 'sideguard'; // lính gác cổng không bỏ chốt

  // chọn người cho một nhóm vai
  function pickPeople(S, spec, taken, rng) {
    const living = [...S.people.values()].filter((p) => p.alive && !taken.has(p.id) && !busy(S, p.id));
    if (spec.from) {
      const [kind, k] = spec.from.split(':');
      const hit = living.filter((p) => (kind === 'post' ? p.postKey === k && p.job === (BK.Posts.BY_KEY[k] || {}).job : kind === 'role' ? (p.role || '').startsWith(k) : p.job === k));
      return hit.slice(0, spec.n[1]);
    }
    const pool = living.filter((p) => adult(S, p) && !p.role && !fixedPost(p) && p.job !== 'orator');
    const T = BK.Temper; const n = rng.int(spec.n[0], spec.n[1]);
    // chỉ nhận người thật hợp tính: đúng tính cách nổi trội, hay điểm tính cách đó đủ cao (FIT_MIN); thiếu người thì đám nhỏ đi
    // (dưới số tối thiểu thì drama không thành), không kéo người khác tính vào cho đủ
    for (let i = pool.length - 1; i >= 0; i--) if (!spec.temper.includes(pool[i].temper) && T.fit(pool[i], spec.temper) < (spec.fitMin || FIT_MIN)) pool.splice(i, 1);
    // người có tính cách đúng trước, rồi người gần tính đó nhất; thêm chút ngẫu nhiên để không lần nào cũng đúng mấy người ấy
    pool.sort((a, b) => (T.fit(b, spec.temper) + (spec.temper.includes(b.temper) ? 0.3 : 0) + rng.next() * 0.12) - (T.fit(a, spec.temper) + (spec.temper.includes(a.temper) ? 0.3 : 0) + rng.next() * 0.12));
    return pool.slice(0, n);
  }
  function pickResponders(S, R, taken) {
    const [kind, k] = R.pick.split(':');
    return [...S.people.values()].filter((p) => p.alive && !taken.has(p.id) && !busy(S, p.id) && (kind === 'job' ? p.job === k : kind === 'role' ? (p.role || '').startsWith(k) : p.postKey === k && p.job === (BK.Posts.BY_KEY[k] || {}).job)).slice(0, R.n);
  }

  // mở một drama (thử nút, hay bốc thăm trúng); trả lại drama đang chạy hoặc null nếu không đủ người
  // o.stage: mở thẳng vào màn thứ mấy (nút "Biểu tình" kéo đám đông thẳng tới nhà chính)
  function start(S, key, rng, o) {
    const D = BY_KEY[key]; if (!D) return null;
    rng = rng || S.rng;
    const taken = new Set(), parts = {};
    for (const spec of D.cast) {
      const got = pickPeople(S, spec, taken, rng);
      if (got.length < spec.n[0]) return null; // thiếu người: drama không thành
      parts[spec.id] = got.map((p) => p.id); got.forEach((p) => taken.add(p.id));
    }
    const resp = [];
    for (const R of D.responders || []) for (const p of pickResponders(S, R, taken)) { resp.push([p.id, R]); taken.add(p.id); }
    const lead = parts[D.cast[0].id][0], A = { key, name: D.name, parts, resp, lead, who: taken, stage: 0, started: S.day, stageAt: S.day };
    const skip = Math.min(D.stages.length - 1, (o && o.stage) || 0);
    for (let k = 0; k < skip; k++) A.started -= D.stages[k].dur; // lùi mốc bắt đầu cho đúng màn được mở
    A.stage = skip; A.stageAt = S.day;
    A.until = A.started + D.stages.reduce((s, x) => s + x.dur, 0);
    state(S).active.push(A); state(S).last[key] = S.day;
    const L = S.people.get(lead), others = taken.size - 1 - resp.length;
    if (D.say && D.say[0]) S.log.push({ day: Math.floor(S.day), kind: 'drama', drama: key, ids: [...taken], text: D.say[0].replace('{lead}', L ? BK.People.fullName(L) : 'Một người').replace('{n}', Math.max(1, others)) });
    if (key === 'riot') S.situ.protest = A.until; // bảng làng vẫn hiện "Biểu tình" khi có bạo loạn
    S.situChanged = true;
    return A;
  }
  function end(S, A) {
    const st = state(S); st.active.splice(st.active.indexOf(A), 1);
    const D = BY_KEY[A.key]; if (D.say && D.say[1]) S.log.push({ day: Math.floor(S.day), kind: 'drama', drama: A.key, ids: [], text: D.say[1] });
    if (A.key === 'riot') S.situ.protest = 0;
    S.situChanged = true; // mọi người trong drama chọn lại việc: về việc của mình theo lịch
  }
  // mỗi nhịp chạy: sang màn, tan, bốc thăm drama mới
  function update(S, days, rng) {
    const st = state(S), ph = BK.Schedule.phase(S.tod);
    for (const A of [...st.active]) {
      const D = BY_KEY[A.key];
      // người cầm đầu mất, đêm xuống, hay hết giờ: tan
      const leadAlive = S.people.get(A.lead) && S.people.get(A.lead).alive;
      if (S.day >= A.until || !leadAlive || !D.phases.includes(ph)) { end(S, A); continue; }
      let t = A.started, k = 0; while (k < D.stages.length - 1 && S.day >= t + D.stages[k].dur) { t += D.stages[k].dur; k++; }
      if (k !== A.stage) { A.stage = k; A.stageAt = t; S.situChanged = true; }
    }
    if (!days || st.active.length >= MAX_ACTIVE) return;
    const adults = [...S.people.values()].filter((p) => p.alive && adult(S, p)).length;
    for (const D of DRAMAS) {
      if (!D.chance || !D.phases.includes(ph) || adults < D.minPeople) continue;
      if (st.active.some((A) => A.key === D.key) || S.day - (st.last[D.key] != null ? st.last[D.key] : -1e9) < D.cooldown) continue;
      if (rng.chance(Math.min(0.9, D.chance * (D.boost ? D.boost(S) : 1) * days))) { if (start(S, D.key, rng) && st.active.length >= MAX_ACTIVE) break; }
    }
  }
  // làng sang thời mới: mừng thời mới (drama có onEra)
  function onEra(S, rng) { for (const D of DRAMAS) if (D.onEra) start(S, D.key, rng); }

  // việc của một người trong drama (null nếu không ở drama nào); d(state, o) tạo việc của logic/brain.js
  function taskFor(S, p, d) {
    for (const A of state(S).active) {
      const av = BY_KEY[A.key].avoid;
      if (!A.who.has(p.id)) { if (av && av.temper.includes(p.temper) && !p.role && !fixedPost(p) && adult(S, p)) return d('idle', { place: 'home', reason: av.why + ' (' + A.name.toLowerCase() + ')', until: A.until, drama: A.key, phase: null }); continue; }
      const D = BY_KEY[A.key], stage = D.stages[A.stage], until = Math.min(A.until, A.stageAt + stage.dur);
      const R = A.resp.find(([id]) => id === p.id);
      if (R) return d(R[1].act.state, Object.assign({}, R[1].act, { reason: R[1].why + ' (' + D.name.toLowerCase() + ')', until, drama: A.key, phase: null, intensity: 0.6 }));
      let part = null; for (const id in A.parts) if (A.parts[id].includes(p.id)) part = id;
      const act = stage.act[part]; if (!act) return null;
      let target = null;
      if (act.target === 'lead') target = A.lead !== p.id ? A.lead : null;
      else if (act.target === 'king') target = S.seats.king != null ? S.seats.king : null;
      else if (act.target === 'pair') { const g = A.parts[part], i = g.indexOf(p.id); target = g[i % 2 ? i - 1 : i + 1] != null ? g[i % 2 ? i - 1 : i + 1] : g[0] !== p.id ? g[0] : null; }
      const why = (part === D.cast[0].id && A.lead === p.id ? 'cầm đầu: ' : '') + stage.why;
      // xếp hàng biểu tình: thứ tự của mỗi người trong đám (hàng ngang hàng dọc, render/village3d.js)
      const line = act.place === 'protest' ? { rank: A.parts[part].indexOf(p.id), of: A.parts[part].length } : {};
      return d(act.state, Object.assign(line, { verb: act.verb || null, mood: act.mood || null, place: act.place || null, target, reason: why + ' (' + D.name.toLowerCase() + ')', until, drama: A.key, phase: null, intensity: act.mood === 'argue' ? 0.8 : 0.55  }));
    }
    return null;
  }
  const active = (S) => state(S).active;
  return { DRAMAS, BY_KEY, start, end, update, onEra, taskFor, active };
});
