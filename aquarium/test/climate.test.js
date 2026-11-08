// Bể Kính · test/climate.test.js · Khí hậu, thiên tai từng đảo và ngoại gen
const test = require('node:test');
const assert = require('node:assert');
for (const f of ['rng', 'rules', 'genes', 'people', 'family', 'council', 'temper', 'posts', 'jobs', 'eras', 'schedule', 'scenes', 'leader', 'guards', 'tasks',
    'dramas', 'economy', 'climate', 'epigen', 'construction', 'homes', 'siege', 'arms', 'missiles', 'ecology', 'brain', 'island', 'diplomacy', 'war',
    'battles', 'chronicle', 'prosperity', 'strategy', 'powers', 'goals', 'world']) require('../logic/' + f + '.js');
const BK = globalThis.BK;
const W = BK.World.create({ seed: 2 }); BK.World.jump(W, 9 * 360);

test('mỗi đảo gặp đúng thiên tai của mình: bão tuyết chỉ ở Tuyết Trắng, bão cát chỉ ở Cát Hồng, cháy rừng chỉ ở Thông Xanh', () => {
  const cnt = (k) => BK.World.island(W, k).climate.count;
  assert.ok((cnt('tundra').blizzard || 0) >= 3, 'Tuyết Trắng có bão tuyết: ' + JSON.stringify(cnt('tundra')));
  assert.ok((cnt('desert').sandstorm || 0) >= 2, 'Cát Hồng có bão cát');
  assert.ok((cnt('forest').wildfire || 0) >= 1, 'Thông Xanh có cháy rừng');
  for (const k of ['plains', 'forest', 'mountain', 'coast', 'desert']) assert.ok(!cnt(k).blizzard, k + ' không có bão tuyết');
  for (const k of ['plains', 'forest', 'mountain', 'tundra', 'coast']) assert.ok(!cnt(k).sandstorm, k + ' không có bão cát');
});

test('thiên tai làm sản xuất kém đi; bão bắt dân trú trong nhà (trừ lính gác)', () => {
  const W2 = BK.World.create({ seed: 5 }); BK.World.jump(W2, 400); const S = BK.World.island(W2, 'tundra');
  const before = BK.Climate.factor(S, 'food', S.day);
  BK.Climate.start(S, 'blizzard', 6, 1);
  assert.ok(BK.Climate.factor(S, 'food', S.day) < before * 0.7, 'bão tuyết làm ít cái ăn');
  S.tod = 0.35; S.situChanged = true; BK.Brain.think(S, S.rng);
  for (const p of BK.Island.living(S)) { const m = S.minds.get(p.id); if (p.job === 'gatekeeper' || p.job === 'sideguard') assert.notStrictEqual(m.reason && m.reason.startsWith('trú'), true); else if (BK.People.ageOf(p, S.day) >= 6) assert.strictEqual(m.place, 'home', p.job + ' trú trong nhà'); }
});

test('ngoại gen: đói lâu làm đa nghi, hiếu chiến tăng; yên ổn thì phai; tính cách biểu hiện khác gen gốc', () => {
  const W3 = BK.World.create({ seed: 6 }); BK.World.jump(W3, 500); const S = W3.islands[0];
  const p = BK.Island.living(S).find((q) => BK.People.ageOf(q, S.day) > 20 && q.genome.traits.paranoia < 0.8 && !(q.epi && q.epi.paranoia < 0));
  const base = p.genome.traits.paranoia;
  for (let d = 0; d < 60; d++) { S.eco.hunger = 3; BK.Epigen.dayTick(S, S.day + d); }
  assert.ok(p.epi.paranoia > 0.08, 'dấu đa nghi: ' + p.epi.paranoia);
  assert.ok(BK.People.traits(p).paranoia > base, 'biểu hiện cao hơn gen gốc');
  assert.strictEqual(p.genome.traits.paranoia, base, 'gen gốc không đổi');
  const mark = p.epi.paranoia; S.eco.hunger = 0;
  for (let d = 60; d < 400; d++) BK.Epigen.dayTick(S, S.day + d);
  assert.ok(p.epi.paranoia < mark * 0.4, 'phai dần khi yên ổn');
});

test('con nhận một phần dấu ngoại gen của mẹ; sinh ra lúc khổ thì đột biến nhiều hơn', () => {
  const mom = { epi: { aggression: 0.2 }, genome: { traits: { aggression: 0.5 } } }, child = { genome: { traits: { aggression: 0.5 } } };
  BK.Epigen.inherit(child, mom);
  assert.ok(Math.abs(child.epi.aggression - 0.2 * BK.Epigen.INHERIT) < 1e-9);
  const rng = BK.Rng.create(9), g = BK.Genes.random(rng), h = BK.Genes.random(rng);
  let calm = 0, hard = 0; for (let i = 0; i < 3000; i++) { calm += BK.Genes.cross(g, h, rng).mutations.length; hard += BK.Genes.cross(g, h, rng, { mutate: 2.5 }).mutations.length; }
  assert.ok(hard > calm * 1.8, 'đột biến lúc khổ ' + hard + ' so với lúc yên ' + calm);
});
