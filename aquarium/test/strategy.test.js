// Bể Kính · test/strategy.test.js · Người đứng đầu, quan hệ giữa các đảo, giao thương, hiệp ước, cầu
const test = require('node:test');
const assert = require('node:assert');
for (const f of ['rng', 'rules', 'genes', 'people', 'family', 'council', 'temper', 'posts', 'jobs', 'eras', 'schedule', 'tasks', 'dramas', 'economy', 'climate', 'epigen', 'construction', 'homes', 'brain', 'island', 'diplomacy', 'war', 'strategy', 'world']) require('../logic/' + f + '.js');
const BK = globalThis.BK;
const starved = (W) => W.islands.reduce((a, S) => a + [...S.people.values()].filter((p) => p.cause === 'đói').length, 0);
const runs = [1, 2, 3].map((seed) => { const on = BK.World.create({ seed }), off = BK.World.create({ seed, diplomacy: false }); BK.World.jump(on, 9 * 360); BK.World.jump(off, 9 * 360); return { on, off }; });

test('các đảo tự đi buôn: nhiều chuyến buôn trọn vẹn, có hiệp ước, bắc cầu giữa các đảo kề nhau buôn nhiều', () => {
  for (const { on } of runs) {
    const trips = Object.values(on.tradeCount).reduce((a, b) => a + b, 0);
    assert.ok(trips >= 40, 'số chuyến buôn: ' + trips);
    assert.ok(on.log.some((e) => /ký (hiệp ước|liên minh)/.test(e.text)), 'có hiệp ước');
    assert.ok(on.bridges.length >= 2, 'số cầu: ' + on.bridges.length);
  }
});

test('giao thương làm ít người chết đói hơn so với sáu đảo sống riêng (cùng seed)', () => {
  const a = runs.reduce((s, r) => s + starved(r.on), 0), b = runs.reduce((s, r) => s + starved(r.off), 0);
  assert.ok(a < b * 0.5, 'chết đói khi có buôn ' + a + ', sống riêng ' + b);
});

test('đi buôn có trí nhớ: đảo buôn với nhau nhiều thì tin cậy nhau hơn', () => {
  const W = runs[0].on, pairs = Object.entries(W.tradeCount).sort((x, y) => y[1] - x[1]);
  const [a, b] = pairs[0][0].split('-').map(Number);
  const avg = W.rel.flat().reduce((s, r) => s + r.trust, 0) / 30;
  assert.ok(W.rel[a][b].trust > avg, 'cặp buôn nhiều nhất tin nhau hơn trung bình');
});

test('người đứng đầu hiếu chiến, đa nghi thì tích quân; hiền lành thì giải bớt quân', () => {
  const W = BK.World.create({ seed: 4 }); BK.World.jump(W, 200); const S = W.islands[0], king = S.people.get(S.seats.king);
  const set = (v) => { for (const k of ['aggression', 'paranoia']) king.genome.traits[k] = v; king.genome.traits.meekness = 1 - v; BK.Epigen.express(king); };
  set(1); for (let k = 0; k < 6; k++) BK.Strategy.islandTick(W, 0, W.day, W.rng);
  const hawk = S.policy.soldierShare;
  set(0); for (let k = 0; k < 6; k++) BK.Strategy.islandTick(W, 0, W.day, W.rng);
  assert.ok(hawk > BK.Strategy.BASE_SOLDIERS && S.policy.soldierShare < hawk - 0.1, 'tích quân ' + hawk.toFixed(2) + ' rồi giảm ' + S.policy.soldierShare.toFixed(2));
});

test('sắp hết lương thực thì không đợi kỳ xét: còn thương nhân rảnh là đi mua ngay', () => {
  const W = BK.World.create({ seed: 5 }); BK.World.jump(W, 400);
  const S = W.islands[1], st = BK.Economy.state(S); st.stock.food = 0; st.hunger = 1;
  for (const j of [0, 2, 3, 4, 5]) BK.Economy.state(W.islands[j]).stock.food = 3000;
  W.caravans = [];
  for (let k = 1; k <= 3; k++) BK.World.jump(W, 400 + k);
  assert.ok(W.caravans.some((c) => c.a === 1 && c.get.food > 0), 'có đoàn đi mua lương thực trong 3 ngày');
});

test('đoàn buôn đi thật: hàng rời kho lúc đi, tới nơi mới nhận; qua cầu nhanh hơn đi thuyền', () => {
  const W = BK.World.create({ seed: 8 }); BK.World.jump(W, 30);
  const E = BK.Economy, A = W.islands[0], B = W.islands[1];
  E.state(A).stock.food = 500; E.state(B).stock.wood = 200;
  const a0 = E.state(A).stock.food, b0 = E.state(B).stock.food;
  const c = BK.Diplomacy.trade(W, W.day, 0, 1, { food: 50 }, { wood: 30 });
  assert.strictEqual(E.state(A).stock.food, a0 - 50, 'hàng rời kho');
  assert.strictEqual(E.state(B).stock.food, b0, 'chưa tới thì chưa nhận');
  assert.strictEqual(c.arrive - c.depart, 6, 'đi thuyền sang đảo kề: 6 ngày');
  W.bridges.push({ a: 0, b: 1 }); assert.strictEqual(BK.Diplomacy.travelDays(W, 0, 1), 3, 'qua cầu: 3 ngày');
  assert.strictEqual(BK.Diplomacy.travelDays(W, 0, 3), 14, 'đảo đối diện: đi thuyền xa');
});
