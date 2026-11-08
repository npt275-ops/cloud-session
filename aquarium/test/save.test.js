// Bể Kính · test/save.test.js · Lưu và nạp lại trận (logic/save.js)
const test = require('node:test');
const assert = require('node:assert');
for (const f of ['rng', 'rules', 'genes', 'people', 'family', 'council', 'temper', 'posts', 'jobs', 'eras', 'schedule', 'scenes', 'leader', 'guards', 'tasks',
  'dramas', 'economy', 'climate', 'epigen', 'construction', 'homes', 'siege', 'arms', 'missiles', 'ecology', 'brain', 'island', 'diplomacy', 'war', 'battles',
  'chronicle', 'prosperity', 'strategy', 'world', 'save']) require('../logic/' + f + '.js');
const BK = globalThis.BK;
const sum = (W) => JSON.stringify([W.day, W.warCount, W.annexations, W.rng.state, W.islands.map((S) => [S.level, BK.Island.living(S).length,
  Math.round(BK.Economy.state(S).stock.food), S.rng.state, S.annexedBy])]);

test('lưu rồi nạp lại, chạy tiếp 100 ngày: ra đúng như không lưu (cùng số ngẫu nhiên, cùng lịch sử)', () => {
  const A = BK.World.create({ seed: 5 }); BK.World.jump(A, 700);
  const text = BK.Save.save(A), B = BK.Save.load(text);
  assert.strictEqual(sum(B), sum(A), 'nạp lại y như lúc lưu');
  BK.World.jump(A, 800); BK.World.jump(B, 800);
  assert.strictEqual(sum(B), sum(A), 'chạy tiếp ra cùng lịch sử');
});

test('nạp lại giữ tham chiếu dùng chung: người trong đoàn quân là cùng một người trong dân của đảo', () => {
  const W = BK.World.create({ seed: 3 }); BK.World.jump(W, 500);
  const A = W.islands[2]; BK.Island.living(A).filter((p) => p.job === 'worker').slice(0, 12).forEach((p) => { p.job = 'soldier'; });
  const w = BK.War.launch(W, W.day, 2, 1, 'raid', 1, W.rng); assert.ok(w, 'có trận');
  const L = BK.Save.load(BK.Save.save(W)), lw = L.wars.find((x) => x.id === w.id), x = lw.troops[0];
  assert.strictEqual(x.p, L.islands[x.i].people.get(x.p.id), 'cùng một đối tượng');
  assert.strictEqual(BK.Save.load('{"v":0}'), null, 'bản lưu khác phiên bản thì bỏ');
});
