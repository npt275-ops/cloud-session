// Bể Kính · kiểm thử logic ngầm của một đảo (Lúa Vàng): chạy bằng `node --test` trong thư mục aquarium.
const test = require('node:test');
const assert = require('node:assert');
for (const f of ['rng', 'rules', 'genes', 'people', 'family', 'council', 'temper', 'posts', 'jobs', 'eras', 'schedule', 'scenes', 'leader', 'guards', 'tasks',
    'dramas', 'economy', 'climate', 'epigen', 'construction', 'homes', 'siege', 'arms', 'missiles', 'ecology', 'brain',
    'island']) require('../logic/' + f + '.js');
const BK = globalThis.BK, { Island, Genes, People, Brain, Rules, Rng } = BK;

// chạy trọn chín năm, mỗi lần một ngày
function runMatch(seed) { const S = Island.create({ key: 'plains', seed }); for (let d = 0; d < Rules.MATCH_DAYS; d++) Island.step(S, 1); return S; }

test('tám người đầu tiên: 4 nam 4 nữ, đủ tám ghế hội đồng, gen trong khoảng 0..1', () => {
  const S = Island.create({ key: 'plains', seed: 7 });
  const ps = [...S.people.values()].filter((p) => p.gen === 0 && !p.commoner); // tám người lập làng (con đầu lòng sinh ngay khi lập làng)
  assert.strictEqual(ps.length, 8);
  assert.strictEqual(ps.filter((p) => p.sex === 'm').length, 4);
  assert.strictEqual(Object.values(S.seats).filter((x) => x != null).length, 8);
  for (const p of ps) for (const k of Genes.KEYS) assert.ok(p.genome.traits[k] >= 0 && p.genome.traits[k] <= 1);
  for (const p of ps) assert.ok(People.ageOf(p, 0) >= 20 && People.ageOf(p, 0) <= 30);
});

test('chín năm: đủ 6 thế hệ, có người mất và người sinh ra, hội đồng không bao giờ trống', () => {
  const S = Island.create({ key: 'plains', seed: 11 });
  let minSeats = 8;
  for (let d = 0; d < Rules.MATCH_DAYS; d++) { Island.step(S, 1); minSeats = Math.min(minSeats, Object.values(S.seats).filter((x) => x != null).length); }
  assert.strictEqual(S.gen, 6, 'số mốc thế hệ');
  const births = S.log.filter((e) => e.kind === 'birth').length, deaths = S.log.filter((e) => e.kind === 'death').length;
  assert.ok(births >= 20, 'quá ít trẻ sinh ra: ' + births);
  assert.ok(deaths >= 8, 'tám người đầu tiên phải mất dần trong chín năm: ' + deaths);
  assert.ok(minSeats >= 6, 'hội đồng thiếu người: ' + minSeats);
  assert.ok(Island.living(S).length <= Rules.POP_CAP, "vượt giới hạn dân số của đảo");
  const firsts = [...S.people.values()].filter((p) => p.gen === 0);
  assert.ok(firsts.every((p) => !p.alive), 'người đầu tiên vẫn còn sống sau 150 năm đời người');
  assert.ok(Math.max(...[...S.people.values()].map((p) => p.gen)) >= 4, 'dòng dõi phải kéo dài qua nhiều đời');
});

test('không có cha mẹ với con hay anh chị em ruột cưới nhau; ai cưới cũng đủ tuổi', () => {
  for (const seed of [3, 5, 8]) {
    const S = runMatch(seed);
    for (const e of S.log.filter((x) => x.kind === 'marry')) {
      const [a, b] = e.ids.map((id) => S.people.get(id));
      assert.ok(!People.forbidden(a, b), 'cưới người cấm: ' + e.text);
      assert.ok(People.ageOf(a, e.day) >= Rules.ADULT_AGE && People.ageOf(b, e.day) >= Rules.ADULT_AGE, 'cưới khi chưa đủ tuổi: ' + e.text);
      assert.notStrictEqual(a.sex, b.sex);
    }
  }
});

test('lai tạo: con gần trung bình cha mẹ trừ gen đột biến; thói quen của cha hoặc mẹ trừ khi ghi là mới', () => {
  const rng = Rng.create(99);
  const a = Genes.random(rng), b = Genes.random(rng);
  let mut = 0, newHabit = 0, n = 3000;
  for (let i = 0; i < n; i++) {
    const c = Genes.cross(a, b, rng);
    for (const k of Genes.KEYS) {
      const mean = (a.traits[k] + b.traits[k]) / 2, mutated = c.mutations.some((m) => m.key === k);
      if (!mutated && !c.rare) assert.ok(Math.abs(c.traits[k] - mean) < 0.35, 'lệch quá xa khi không đột biến');
      assert.ok(c.traits[k] >= 0 && c.traits[k] <= 1);
    }
    mut += c.mutations.length;
    if (c.habitFrom === 'new') newHabit++;
    else assert.strictEqual(c.habit, c.habitFrom === 'a' ? a.habit : b.habit);
  }
  const rate = mut / (n * Genes.KEYS.length);
  assert.ok(rate > 0.03 && rate < 0.07, 'tỉ lệ đột biến khoảng 5%: ' + rate);
  assert.ok(newHabit / n > 0.02 && newHabit / n < 0.08, 'tỉ lệ thói quen mới khoảng 5%');
});

test('cùng một hạt giống thì trận diễn ra y hệt', () => {
  const a = runMatch(21), b = runMatch(21);
  assert.deepStrictEqual(a.log.map((e) => e.text), b.log.map((e) => e.text));
});

test('bộ não: cùng lệnh chiến tranh, người máu chiến ra đánh, người nhút nhát chạy, người sùng đạo cầu nguyện', () => {
  const S = Island.create({ key: 'plains', seed: 4 });
  const [p1, p2, p3] = [...S.people.values()];
  const set = (p, o) => { for (const k of Genes.KEYS) p.genome.traits[k] = 0.4; Object.assign(p.genome.traits, o); p.role = null; };
  set(p1, { aggression: 0.95, fear: 0.05 }); set(p2, { fear: 0.95, aggression: 0.1 }); set(p3, { piety: 0.95, aggression: 0.2, fear: 0.2 });
  Island.trigger(S, 'war');
  assert.strictEqual(S.minds.get(p1.id).state, 'attack');
  assert.strictEqual(S.minds.get(p2.id).state, 'panic');
  assert.strictEqual(S.minds.get(p3.id).mood, 'pray');
  // núm vặn cử động: máu chiến nhanh hơn, vung rộng hơn, ngả tới; nhút nhát run hơn, ngả lùi
  const k1 = Brain.knobs(p1.genome, 1), k2 = Brain.knobs(p2.genome, 1);
  assert.ok(k1.tempo > k2.tempo && k1.amplitude > k2.amplitude && k1.lean > 0 && k2.lean < 0 && k2.jitter > k1.jitter);
});

test('hạn hán mùa hạ có thể xảy ra ở Lúa Vàng (logic/climate.js)', () => {
  let droughts = 0;
  for (const seed of [1, 2, 3, 4, 5, 6]) droughts += (runMatch(seed).climate.count.drought || 0);
  assert.ok(droughts >= 3, 'sáu trận, chín năm mỗi trận, phải có vài đợt hạn: ' + droughts);
});

test('chín năm: lên cấp bằng tài nguyên (nhiều thời, không cần đủ 12), có lính và người làm, ghi sinh và mất', () => {
  const S = BK.Island.create({ key: 'plains', seed: 9 });
  for (let d = 0; d < 9 * 360; d++) { BK.Island.step(S, 1); }
  assert.ok(S.level >= 4 && S.level <= 12, 'cấp cuối ' + S.level);
  const live = BK.Island.living(S);
  assert.ok(BK.Jobs.count(S, 'soldier') >= 1 && BK.Jobs.count(S, 'worker') >= 1, 'có lính và người làm');
  assert.ok(S.births > 8 && S.deaths > 0, 'có sinh và mất: ' + S.births + '/' + S.deaths);
  assert.ok(live.length > 8 && live.length <= BK.Rules.POP_CAP);
});

test('công trình mỗi thời được dựng dần và xong hết; việc ngày thường theo buổi', () => {
  const plan = (lv) => Array.from({ length: 6 + lv }, (_, i) => ({ name: 'Công trình ' + lv + '.' + i, size: i === 0 ? 3 : 1, done: lv === 1 && i < 2 }));
  const S = BK.Island.create({ key: 'plains', seed: 5, buildPlan: plan });
  assert.ok(S.build && S.build.list[0].done && !S.build.list[3].done, 'thời 1 có sẵn 2 công trình');
  let built = 0; const seenVerbs = new Set();
  for (let d = 0; d < 9 * 360; d++) {
    const lv0 = S.level, done0 = S.build.list.filter((x) => x.done).length;
    S.tod = (d % 6) / 6; BK.Island.step(S, 1);
    if (S.level === lv0) built += S.build.list.filter((x) => x.done).length - done0; // đếm thẳng trên danh sách xây (nhật ký chỉ giữ 600 dòng cuối)
    for (const m of S.minds.values()) if (m.verb) seenVerbs.add(m.verb);
    // vào thời nào cũng dựng được phần lớn công trình trong khoảng 200 ngày (thời dài ngắn tuỳ tài nguyên)
    if (S.build && d - S.build.startDay === 200) { const B = S.build, doneN = B.list.filter((x) => x.done).length; assert.ok(doneN >= B.list.length * 0.6, 'cấp ' + S.level + ': dựng được ' + doneN + '/' + B.list.length + ' sau 200 ngày'); }
  }
  assert.ok(built > 15, 'nhật ký có ' + built + ' lần dựng xong');
  for (const v of ['farm', 'build', 'guard', 'sleep', 'eat', 'chat']) assert.ok(seenVerbs.has(v), 'có việc ' + v);
});

test('dàn vai cố định, dân không vượt trần POP_CAP; nhà chính chỉ đông khi biểu tình, họp hội đồng, báo tin', () => {
  const S = BK.Island.create({ key: 'plains', seed: 9 });
  const R = BK.Rules, hallCrowd = () => { let n = 0; for (const m of S.minds.values()) if (m.place === 'hall' || (m.mood === 'argue' && m.target === S.seats.king)) n++; return n; };
  let maxPop = 0, maxHall = 0, meetings = 0;
  for (let d = 0; d < 9 * 360; d++) {
    S.tod = 0.35; S.situ.drought = 0; S.situ.protest = 0; BK.Island.step(S, 1); // ngày thường, buổi sáng
    maxPop = Math.max(maxPop, BK.Island.living(S).length);
    // ngày thường: không tính lúc có bạo loạn, lúc họp hội đồng, lúc lính vào báo tin (logic/leader.js)
    const meeting = S.meeting && S.meeting.until > S.day, report = S.report && S.report.cmdUntil > S.day;
    if (meeting && [...S.minds.values()].some((m) => m.verb === 'advise')) meetings++;
    if (d > 900 && !meeting && !report && !BK.Dramas.active(S).some((A) => A.key === 'riot')) { maxHall = Math.max(maxHall, hallCrowd()); }
  }
  assert.ok(maxPop <= R.POP_CAP, 'dân tối đa ' + maxPop);
  const live = BK.Island.living(S).length; assert.ok(live >= 35, 'cuối trận còn ' + live + ' người');
  const count = (job, seat) => BK.Jobs.count(S, job) + (S.seats[seat] != null ? 1 : 0);
  assert.strictEqual(count('builder', 'builder'), R.BUILDERS, 'đủ thợ xây');
  assert.strictEqual(count('trader', 'merchant'), R.TRADERS, 'đủ thương nhân');
  for (const k of ['king', 'general1', 'general2', 'priest', 'healer']) assert.ok(S.seats[k] != null, 'có ghế ' + k);
  assert.ok(maxHall <= 3, 'ngày thường nhà chính chỉ có người đứng đầu, quân sư, hộ vệ: ' + maxHall);
  assert.ok(meetings >= 5, 'hội đồng có họp: ' + meetings + ' lần thấy đang họp');
  BK.Island.trigger(S, 'protest');
  assert.ok(hallCrowd() >= 8, 'biểu tình: ' + hallCrowd() + ' người ở nhà chính');
});

test('mỗi hộ một nhà riêng trong 20 nhà; vợ chồng ở chung, trẻ ở với bố mẹ', () => {
  const S = BK.Island.create({ key: 'plains', seed: 11 });
  for (let d = 0; d < 6 * 360; d++) BK.Island.step(S, 1);
  const live = BK.Island.living(S), occ = BK.Homes.occupancy(S);
  assert.ok(live.every((p) => p.home != null && p.home >= 0 && p.home < BK.Rules.HOME_SLOTS), 'ai cũng có nhà');
  for (const p of live) { const q = p.spouse != null && S.people.get(p.spouse); if (q && q.alive) assert.strictEqual(p.home, q.home, 'vợ chồng chung nhà'); }
  for (const p of live) if (BK.People.ageOf(p, S.day) < BK.Rules.ADULT_AGE) { const par = p.parents.map((id) => S.people.get(id)).filter((q) => q && q.alive); if (par.length) assert.ok(par.some((q) => q.home === p.home), 'trẻ ở với bố mẹ'); }
  assert.ok(occ.filter((n) => n > 0).length >= 12, 'dân ở rải trong nhiều nhà: ' + occ.join(' '));
});

test('cổng thành đã mở thì luôn có đủ 4 lính gác, mỗi người một chốt, qua mọi thế hệ', () => {
  const S = BK.Island.create({ key: 'plains', seed: 21 });
  let checked = 0;
  for (let d = 0; d < 9 * 360; d++) {
    S.tod = (d % 4) / 4; BK.Island.step(S, 1);
    if (d > 720 && d % 30 === 0) {
      const g = BK.Island.living(S).filter((p) => p.job === 'gatekeeper');
      if (!S.postsOpen.includes('gateMain')) { assert.strictEqual(g.length, 0); continue; } // cổng chính mở khi có tường thành và đủ người
      assert.strictEqual(g.length, BK.Rules.GATEKEEPERS, 'ngày ' + d + ': ' + g.length + ' lính gác');
      assert.deepStrictEqual(g.map((p) => p.post).sort(), [0, 1, 2, 3], 'mỗi người một chốt');
      // ca ngày: lính gác đứng ở cổng (trừ lúc chạy vào báo tin); ca đêm về nhà ngủ, lính thường ra gác thay (logic/guards.js)
      for (const p of g) { const m = S.minds.get(p.id); if (m && m.verb && m.verb !== 'sleep' && m.verb !== 'report' && !m.scene) assert.strictEqual(m.place, 'gate', 'lính gác đứng ở cổng'); } // !m.scene: đi đám tang người nhà
      if (BK.Schedule.phase(S.tod) === 'night') assert.ok([...S.minds.values()].some((m) => m.place === 'nightGate'), 'đêm có lính thường gác ở cổng');
      checked++;
    }
  }
  assert.ok(checked > 70);
});

test('vị trí cứng: chốt đã mở thì luôn đủ người (4 gác cổng chính, 2 + 2 cổng phụ, 1 người diễn thuyết), qua mọi thế hệ', () => {
  const S = BK.Island.create({ key: 'plains', seed: 31 });
  let checked = 0;
  for (let d = 0; d < 9 * 360; d++) {
    S.tod = (d % 4) / 4; BK.Island.step(S, 1);
    if (d > 720 && d % 45 === 0) {
      const live = BK.Island.living(S), by = (k) => live.filter((p) => p.postKey === k && BK.Posts.of(p));
      for (const [k, n] of [['gateMain', 4], ['gateLeft', 2], ['gateRight', 2], ['orator', 1]]) {
        if (!S.postsOpen.includes(k)) { assert.strictEqual(by(k).length, 0, k + ' chưa mở mà có người'); continue; } // chốt mở khi có tường và đủ người lớn
        const g = by(k); assert.strictEqual(g.length, n, 'ngày ' + d + ' ' + k + ': ' + g.length);
        assert.deepStrictEqual(g.map((p) => p.post).sort(), [...Array(n).keys()], k + ': mỗi người một chỗ');
      }
      for (const p of by('gateLeft').concat(by('gateRight'))) { const m = S.minds.get(p.id); if (m && m.verb && m.verb !== 'sleep' && m.verb !== 'report' && m.state !== 'talk' && !m.scene) assert.ok(m.place === 'gateL' || m.place === 'gateR', 'lính cổng phụ đứng ở cổng phụ: ' + m.place); }
      checked++;
    }
  }
  assert.ok(checked > 40);
  assert.ok(S.postsOpen.includes('gateMain'), 'cuối trận cổng chính có người gác');
});

test('drama: gom người cùng tính cách, bỏ việc ra tham gia, tan thì về việc cũ', () => {
  const S = BK.Island.create({ key: 'plains', seed: 5 });
  for (let d = 0; d < 3 * 360; d++) { S.tod = 0.35; BK.Island.step(S, 1); }
  // bạo loạn chỉ thành khi làng có đủ người nóng tính: chạy tiếp tới lúc mở được
  let A = null; for (let d = 0; d < 4 * 360 && !A; d++) { S.tod = 0.35; BK.Island.step(S, 1); for (const x of [...BK.Dramas.active(S)]) BK.Dramas.end(S, x); A = BK.Dramas.start(S, 'riot', S.rng); }
  assert.ok(A, 'mở được bạo loạn');
  BK.Brain.think(S, S.rng);
  const mob = A.parts.mob.map((id) => S.people.get(id));
  // biểu tình (khoá 'riot'): đám đông là người nóng nảy, tham vọng, hoạt ngôn (logic/dramas.js cast)
  const T = ['hothead', 'ambitious', 'sociable'], hot = mob.filter((p) => T.includes(p.temper) || BK.Temper.fit(p, T) >= 0.45).length;
  assert.strictEqual(hot, mob.length, 'cả đám đông đều nóng tính, tham vọng hay hoạt ngôn: ' + hot + '/' + mob.length);
  for (const p of mob) assert.strictEqual(S.minds.get(p.id).drama, 'riot', 'người trong đám làm việc của drama');
  assert.ok(!mob.some((p) => p.job === 'gatekeeper' || p.job === 'sideguard'), 'lính gác cổng không bỏ chốt');
  const before = new Map(mob.map((p) => [p.id, p.job]));
  // hết drama: về việc cũ theo lịch
  BK.Island.step(S, 3); BK.Brain.think(S, S.rng);
  assert.ok(!BK.Dramas.active(S).some((x) => x === A), 'bạo loạn đã tan');
  for (const p of mob) { const m = S.minds.get(p.id); assert.ok(!m.drama || m.drama !== 'riot', 'không còn ở trong bạo loạn'); assert.strictEqual(p.job, before.get(p.id), 'việc không đổi'); }
  // có đủ các loại drama nổ ra trong một năm
  const seen = new Set(); for (let d = 0; d < 360; d++) { S.tod = [0.3, 0.6, 0.8][d % 3]; BK.Island.step(S, 1); for (const x of BK.Dramas.active(S)) seen.add(x.key); }
  for (const k of ['brawl', 'speech', 'gossip']) assert.ok(seen.has(k), 'có drama ' + k + ' (' + [...seen].join(',') + ')');
});
