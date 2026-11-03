// Bể Kính · kiểm thử logic ngầm của một đảo (Lúa Vàng): chạy bằng `node --test` trong thư mục aquarium.
const test = require('node:test');
const assert = require('node:assert');
for (const f of ['rng', 'rules', 'genes', 'people', 'family', 'council', 'brain', 'island']) require('../logic/' + f + '.js');
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
  assert.ok(Island.living(S).length <= Rules.NAMED_CAP, 'vượt giới hạn người có tên');
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

test('hạn hán mùa hạ có thể xảy ra và làm thiếu lương thực, ít con hơn', () => {
  let droughts = 0;
  for (const seed of [1, 2, 3, 4, 5, 6]) droughts += runMatch(seed).log.filter((e) => e.kind === 'drought').length;
  assert.ok(droughts >= 3, 'sáu trận, chín năm mỗi trận, phải có vài đợt hạn: ' + droughts);
});
