// Bể Kính · test/spells.test.js · Luật sách phép thuật (logic/spells.js; design/ke-hoach-buoc-37.md)
const test = require('node:test');
const assert = require('node:assert');
const S = require('../logic/spells.js');
const IN = { inside: true, nearSea: false };
const DEV0 = Object.assign({}, S.DEV);
// (các bài dưới thử luật chơi thật: tắt chế độ thử)
S.DEV.infinite = false;
S.DEV.cost = null;

test('chế độ thử: mọi phép giá 5, linh lực không bị trừ', () => {
  assert.deepStrictEqual(DEV0, { infinite: true, cost: 5 });
  Object.assign(S.DEV, DEV0);
  const W = {};
  for (let i = 0; i < 40; i++) assert.ok(S.channel(W, 'timeBack', 1, IN).ok);
  assert.strictEqual(S.cast(W, 'soulBolt', IN).cost, 5);
  assert.strictEqual(S.state(W).mana, S.MANA_MAX);
  S.DEV.infinite = false;
  S.DEV.cost = null;
});

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
  assert.ok(S.can({}, 'timeStop', IN).ok, 'phép thời gian đã mở');
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

test('phép giữ phím (tua nhanh, tua lùi): tốn linh lực theo giây, hết thì dừng', () => {
  const W = {};
  let t = 0;
  while (S.channel(W, 'timeBack', 0.1, IN).ok) t += 0.1;
  const per = S.BY.get('timeBack').cost;
  assert.ok(Math.abs(t - S.MANA_MAX / per) < 0.25, 'giữ được chừng ' + (S.MANA_MAX / per) + ' giây: ' + t.toFixed(1));
  assert.strictEqual(S.channel(W, 'timeBack', 0.1, IN).why, 'mana');
  assert.strictEqual(S.channel({}, 'timeFast', 0.1, { inside: false }).why, 'outside');
});

test('đang giữ phép thì linh lực không tự hồi: giữ lâu phải cạn', () => {
  const W = {};
  let t = 0;
  // mỗi khung hình: hồi (đang giữ) rồi trừ theo giây, như game/spellbook.js và game/time-magic.js
  for (; t < 60; t += 0.1) {
    S.regen(W, 0.1, true);
    if (!S.channel(W, 'timeFast', 0.1, IN).ok) break;
  }
  assert.ok(t < 10, 'tua nhanh giữ được ' + t.toFixed(1) + ' giây rồi cạn');
  S.regen(W, 2, false);
  assert.ok(S.state(W).mana >= 13, 'thả ra thì hồi lại');
});
