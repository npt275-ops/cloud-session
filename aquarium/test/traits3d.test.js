// Bể Kính · test/traits3d.test.js · Nét riêng và tỉ lệ theo tuổi của thân mềm (render/body/traits3d.js; design/ke-hoach-buoc-34.md)
const test = require('node:test');
const assert = require('node:assert');
require('../render/body/traits3d.js');
const T = globalThis.BK.Traits3D;

test('cùng người thì luôn cùng nét (qua mọi lần dựng, mọi thời)', () => {
  const p = { id: 'p-17', sex: 'f' };
  assert.deepStrictEqual(T.of(p, 30, true), T.of(p, 30, true));
});

test('lứa tuổi và tỉ lệ đầu: trẻ nhỏ đầu to, mắt to; người lớn tỉ lệ 1', () => {
  const p = { id: 7, sex: 'm' };
  assert.strictEqual(T.bracket(2), 'baby');
  assert.strictEqual(T.bracket(8), 'kid');
  assert.strictEqual(T.bracket(14), 'teen');
  assert.strictEqual(T.bracket(30), 'adult');
  assert.strictEqual(T.bracket(70), 'old');
  const baby = T.of(p, 2),
    kid = T.of(p, 8),
    adult = T.of(p, 30);
  assert.ok(baby.head > kid.head && kid.head > adult.head && adult.head === 1);
  assert.ok(baby.eye > adult.eye);
  assert.strictEqual(baby.hair, 'tuft');
  assert.strictEqual(baby.brow, 0);
  assert.ok(baby.blush && !adult.blush);
});

test('mọi người khác nhau: đủ kiểu tóc, dáng người, có râu, hói ở người già nam', () => {
  const hair = new Set(),
    wide = new Set();
  let beardOld = 0,
    bald = 0,
    beardYoungF = 0;
  for (let i = 0; i < 400; i++) {
    const m = { id: 'm' + i, sex: 'm' },
      f = { id: 'f' + i, sex: 'f' };
    hair.add(T.of(m, 30, false).hair);
    hair.add(T.of(f, 30, true).hair);
    wide.add(T.of(m, 30).wide.toFixed(2));
    const o = T.of(m, 70, false);
    if (o.beard) beardOld++;
    if (o.hair === 'bald') bald++;
    if (T.of(f, 30, true).beard) beardYoungF++;
  }
  for (const h of ['cap', 'bangs', 'spiky', 'long', 'pony', 'bun']) assert.ok(hair.has(h), 'thiếu kiểu tóc ' + h);
  assert.ok(wide.size > 10, 'dáng người phải khác nhau');
  assert.ok(beardOld > 200 && beardOld < 360, 'người già nam phần lớn có râu: ' + beardOld);
  assert.ok(bald > 100 && bald < 220, 'chừng 40% người già nam hói: ' + bald);
  assert.strictEqual(beardYoungF, 0);
});

test('khung cũ có tóc dài thì kiểu tóc dài (người ở xa và ở gần cùng một kiểu)', () => {
  for (let i = 0; i < 50; i++) assert.ok(['long', 'pony', 'bun'].includes(T.of({ id: i, sex: 'f' }, 25, true).hair));
  for (let i = 0; i < 50; i++) assert.ok(['cap', 'bangs', 'spiky'].includes(T.of({ id: i, sex: 'm' }, 25, false).hair));
});
