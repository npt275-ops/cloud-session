// Bể Kính · test/spells.test.js · Luật sách phép thuật (logic/spells.js; design/ke-hoach-buoc-37.md)
const test = require('node:test');
const assert = require('node:assert');
const S = require('../logic/spells.js');
const IN = { inside: true, nearSea: false };

test('sách có đủ các trang và các phép người chơi đã chốt', () => {
  assert.deepStrictEqual(
    S.SCHOOLS.map((s) => s.id),
    ['soul', 'time', 'fire', 'earth', 'water'],
  );
  for (const id of ['timeStop', 'timeFast', 'timeBack', 'fireball', 'fireRing', 'pillar', 'quake', 'rain', 'geyser', 'deluge'])
    assert.ok(S.BY.has(id), 'thiếu phép ' + id);
  for (const s of S.SPELLS) assert.ok(S.SCHOOLS.some((c) => c.id === s.school), s.id + ' thuộc trang lạ');
});

test('chỉ dùng được khi đang nhập hồn', () => {
  const W = {};
  assert.strictEqual(S.can(W, 'soulBolt', { inside: false }).why, 'outside');
  assert.ok(S.can(W, 'soulBolt', IN).ok);
});

test('phép chưa làm xong thì "sắp có"', () => {
  assert.strictEqual(S.can({}, 'fireball', IN).why, 'soon');
});

test('tốn linh lực, hồi phép; linh lực tự hồi theo giờ thật, không quá tối đa', () => {
  const W = {};
  const r = S.cast(W, 'soulBolt', IN);
  assert.ok(r.ok);
  assert.strictEqual(S.state(W).mana, S.MANA_MAX - S.BY.get('soulBolt').cost);
  assert.strictEqual(S.can(W, 'soulBolt', IN).why, 'cooldown');
  S.regen(W, 2);
  assert.ok(S.can(W, 'soulBolt', IN).ok, 'hết hồi phép sau 2 giây');
  assert.strictEqual(S.state(W).mana, S.MANA_MAX, 'hồi đầy, không vượt tối đa');
  // dùng liên tục tới khi cạn
  let n = 0;
  while (S.cast(W, 'soulBolt', IN).ok) {
    n++;
    S.regen(W, 0.5);
  }
  assert.strictEqual(S.can(W, 'soulBolt', IN).why, 'mana', 'cạn linh lực');
  assert.ok(n > 10, 'dùng được nhiều lần trước khi cạn: ' + n);
});

test('Đại hồng thuỷ chỉ dùng khi ở gần biển', () => {
  const W = {},
    sp = S.BY.get('deluge');
  sp.open = true; // (giả như đã làm xong, chỉ để kiểm tra điều kiện)
  try {
    assert.strictEqual(S.can(W, 'deluge', IN).why, 'sea');
    assert.ok(S.can(W, 'deluge', { inside: true, nearSea: true }).ok);
  } finally {
    sp.open = false;
  }
});
