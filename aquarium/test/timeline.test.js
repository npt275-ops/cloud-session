// Bể Kính · test/timeline.test.js · Ảnh chụp trận, tua lùi thời gian (logic/timeline.js; design/ke-hoach-buoc-37.md)
const test = require('node:test');
const assert = require('node:assert');
for (const f of [
  'rng',
  'rules',
  'genes',
  'people',
  'family',
  'council',
  'temper',
  'posts',
  'jobs',
  'eras',
  'schedule',
  'scenes',
  'leader',
  'guards',
  'tasks',
  'dramas',
  'economy',
  'climate',
  'epigen',
  'construction',
  'homes',
  'siege',
  'arms',
  'missiles',
  'ecology',
  'brain',
  'island',
  'diplomacy',
  'war',
  'battles',
  'chronicle',
  'prosperity',
  'strategy',
  'powers',
  'goals',
  'world',
  'save',
  'timeline',
])
  require('../logic/' + f + '.js');
const BK = globalThis.BK;
const sum = (W) =>
  JSON.stringify([
    W.day,
    W.rng.state,
    W.islands.map((S) => [S.level, BK.Island.living(S).length, Math.round(BK.Economy.state(S).stock.food), S.rng.state]),
  ]);

test('chụp mỗi 3 ngày, chỉ giữ 30 ngày gần nhất', () => {
  const W = BK.World.create({ seed: 4 }),
    T = BK.Timeline.create();
  BK.World.jump(W, 100);
  for (let d = 0; d < 60; d += 0.5) {
    BK.World.jump(W, W.day + 0.5);
    T.capture(W);
  }
  assert.ok(T.count() >= 10 && T.count() <= 12, 'số ảnh: ' + T.count());
  assert.ok(W.day - T.oldest() <= 30 + BK.Timeline.EVERY + 0.01, 'ảnh cũ nhất trong 30 ngày (cộng một nhịp chụp)');
});

test('tua lùi: thế giới về đúng lúc chụp, chạy tiếp ra đúng lịch sử như chưa tua; giữ nguyên đối tượng thế giới, đảo', () => {
  const W = BK.World.create({ seed: 6 }),
    T = BK.Timeline.create();
  BK.World.jump(W, 300);
  T.capture(W, true);
  const at = sum(W);
  // chạy tiếp ra "tương lai" để có cái mà so
  const ref = BK.Save.load(BK.Save.save(W));
  BK.World.jump(ref, 340);
  BK.World.jump(W, 320);
  const isle0 = W.islands[0],
    people0 = W.islands[0].people;
  W.soul = { i: 0, id: 'x', magic: { mana: 42, cd: {} } }; // (linh hồn: đứng ngoài thời gian)
  const day = T.back(W);
  assert.strictEqual(day, 300);
  assert.strictEqual(sum(W), at, 'về đúng lúc chụp');
  assert.strictEqual(W.islands[0], isle0, 'giữ đối tượng đảo (phần vẽ trỏ vào)');
  assert.notStrictEqual(W.islands[0].people, people0, 'nội dung đảo đã thay');
  assert.strictEqual(W.soul.magic.mana, 42, 'linh lực không quay lại');
  BK.World.jump(W, 340);
  assert.strictEqual(sum(W), sum(ref), 'chạy tiếp ra đúng lịch sử');
});

test('lùi hết ảnh thì trả null; lùi rồi chạy tiếp thì ảnh "tương lai" bị bỏ', () => {
  const W = BK.World.create({ seed: 2 }),
    T = BK.Timeline.create();
  BK.World.jump(W, 200);
  T.capture(W, true);
  BK.World.jump(W, 206);
  T.capture(W, true);
  BK.World.jump(W, 212);
  assert.strictEqual(T.back(W), 206);
  assert.strictEqual(T.back(W), 200);
  assert.strictEqual(T.back(W), null);
  T.capture(W, true);
  assert.strictEqual(T.count(), 1);
});
