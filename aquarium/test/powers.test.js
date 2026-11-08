// Bể Kính · test/powers.test.js · Quyền năng có giá, mục tiêu theo trận (logic/powers.js, logic/goals.js; design/ke-hoach-khac-phuc.md mục 8)
const test = require('node:test');
const assert = require('node:assert');
for (const f of ['rng', 'rules', 'genes', 'people', 'family', 'council', 'temper', 'posts', 'jobs', 'eras', 'schedule', 'scenes', 'leader', 'guards', 'tasks', 'dramas',
  'economy', 'climate', 'epigen', 'construction', 'homes', 'siege', 'arms', 'missiles', 'ecology', 'brain', 'island', 'diplomacy', 'war', 'battles',
  'chronicle', 'prosperity', 'strategy', 'powers', 'goals', 'world']) require('../logic/' + f + '.js');
const BK = globalThis.BK, Pw = BK.Powers, E = BK.Economy, living = BK.Island.living;
const world = (day) => { const W = BK.World.create({ seed: 3, war: false }); BK.World.jump(W, day || 400); return W; };

test('niềm tin dâng lên theo ngày; chưa đủ niềm tin thì không dùng được, dùng thì trừ đúng giá', () => {
  const W = world(400);
  assert.ok(W.faith > 0 && W.faith <= Pw.FAITH_MAX, 'có niềm tin: ' + W.faith);
  W.faith = 10; const r = Pw.cast(W, 'miracle', 0, W.day);
  assert.ok(!r.ok && /chưa đủ niềm tin/.test(r.why), 'thiếu niềm tin thì không được');
  W.faith = 100; assert.ok(Pw.cast(W, 'miracle', 0, W.day).ok);
  assert.strictEqual(W.faith, 100 - Pw.COST.miracle, 'trừ đúng giá');
  assert.ok(!Pw.cast(W, 'không có', 0, W.day).ok);
});

test('mưa dứt hạn hán, thêm lương thực; ban phúc làm ra nhiều hơn một thời gian', () => {
  const W = world(400), S = W.islands[0];
  BK.Climate.start(S, 'drought', 30, 1); assert.ok(BK.Climate.active(S, W.day).some((e) => e.key === 'drought'));
  E.state(S).stock.food = 10; const food = 10; W.faith = 100; // (kho chưa đầy)
  assert.ok(Pw.cast(W, 'rain', 0, W.day).ok);
  assert.ok(!BK.Climate.active(S, W.day + 0.01).some((e) => e.key === 'drought'), 'hạn hán dứt');
  assert.ok(E.state(S).stock.food > food, 'thêm lương thực');
  W.faith = 100; assert.strictEqual(Pw.output(S, W.day), 1);
  assert.ok(Pw.cast(W, 'bless', 0, W.day).ok);
  assert.ok(Pw.output(S, W.day + 10) > 1 && Pw.output(S, W.day + 100) === 1, 'làm ra nhiều hơn 60 ngày rồi thôi');
});

test('phép lạ làm lành người bị thương, dân bớt bất bình; đảo được ban ơn thì dâng niềm tin nhiều hơn', () => {
  const W = world(400), S = W.islands[1], p = living(S)[0]; p.hp = 30; S.unrest = 0.5; W.faith = 100;
  assert.ok(Pw.cast(W, 'miracle', 1, W.day).ok);
  assert.strictEqual(p.hp, 100); assert.ok(S.unrest < 0.5);
  assert.ok(S.awe && S.awe.k > 1, 'đảo tin hơn');
});

test('sấm sét: đảo đang bị đánh thì đánh vào quân giặc; không thì đánh vào nhà chính, dân sợ; dịch bệnh giáng xuống đảo', () => {
  const W = world(500), B = W.islands[1];
  const troops = living(W.islands[2]).filter((p) => p.job === 'soldier').slice(0, 5).map((p) => ({ i: 2, p }));
  W.wars.push({ kind: 'conquer', a: 2, b: 1, stage: 'gate', troops, n0: troops.length, morale: 1, helpers: [] });
  W.faith = 100; assert.ok(Pw.cast(W, 'lightning', 1, W.day).ok);
  assert.ok(troops.filter((x) => !x.p.alive).length >= Math.min(3, troops.length), 'quân giặc ngã');
  W.wars.length = 0; W.faith = 100; const u = B.unrest || 0;
  assert.ok(Pw.cast(W, 'lightning', 1, W.day).ok);
  assert.ok(BK.Siege.hp(B, 'hall') < 1 && B.unrest > u, 'nhà chính hư, dân sợ');
  assert.ok(B.awe.k < 1, 'đảo bị trừng phạt dâng ít đi');
  W.faith = 100; assert.ok(Pw.cast(W, 'plague', 3, W.day).ok);
  assert.ok(BK.Climate.active(W.islands[3], W.day).some((e) => e.key === 'plague'), 'có dịch');
});

test('mục tiêu theo trận: không ai dùng hạt nhân, giữ sáu đảo sống, đưa một đảo thành bá chủ', () => {
  const W = world(400), G = BK.Goals;
  const nn = G.add(W, 'noNuke'), aa = G.add(W, 'allAlive'), hg = G.add(W, 'hegemon', { isle: 2 });
  G.dayTick(W, W.day); assert.ok([nn, aa, hg].every((g) => g.status === 'active'));
  W.armStats.nukes = 1; G.dayTick(W, W.day); assert.strictEqual(nn.status, 'failed');
  for (const j of [0, 1, 3]) W.islands[j].annexedBy = 2;
  G.dayTick(W, BK.Eras.MATCH_DAYS || 3240);
  assert.strictEqual(hg.status, 'done', hg.why); assert.strictEqual(aa.status, 'done');
  const W2 = world(400), a2 = G.add(W2, 'allAlive'); for (const p of living(W2.islands[4])) p.alive = false;
  G.dayTick(W2, W2.day); assert.strictEqual(a2.status, 'failed');
});
