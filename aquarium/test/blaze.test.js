// Bể Kính · test/blaze.test.js · Nhà cháy vì phép lửa (magic/fire/blaze.js; design/ke-hoach-buoc-37.md)
const test = require('node:test');
const assert = require('node:assert');
globalThis.BK = globalThis.BK || {};
// (chỉ cần phần độ bền của logic/siege.js: một bản nhỏ đủ dùng, không dựng cả đảo)
BK.Siege = BK.Siege || {
  hit(S, key, dmg) {
    const was = S.ruin && S.ruin[key] != null ? S.ruin[key] : 1;
    (S.ruin || (S.ruin = {}))[key] = Math.max(0, was - dmg);
  },
};
const B = require('../magic/fire/blaze.js');

test('bén lửa thì cháy BURN_DAYS ngày, mỗi ngày mất RATE độ bền, rồi tắt', () => {
  const S = {};
  B.ignite(S, 'home:3', 10);
  assert.deepStrictEqual(Object.keys(S.blaze), ['home:3']);
  B.step(S, 12);
  assert.ok(Math.abs(S.ruin['home:3'] - (1 - 2 * B.RATE)) < 1e-9);
  B.step(S, 60);
  assert.ok(Math.abs(S.ruin['home:3'] - (1 - B.BURN_DAYS * B.RATE)) < 1e-9, 'chỉ cháy trong thời gian cháy');
  assert.deepStrictEqual(Object.keys(S.blaze), [], 'hết giờ thì tắt');
});

test('dừng thời gian (ngày không đổi) thì không cháy thêm; đốt chồng thì cháy lâu thêm, có giới hạn', () => {
  const S = {};
  B.ignite(S, 'store', 5);
  B.step(S, 5);
  B.step(S, 5);
  assert.strictEqual(S.ruin && S.ruin.store, undefined);
  for (let k = 0; k < 5; k++) B.ignite(S, 'store', 5);
  assert.strictEqual(S.blaze.store.until, 5 + B.MAX_DAYS);
});

test('ba lần bén lửa đủ làm sụp một nhà; dập lửa thì thôi cháy', () => {
  const S = {};
  B.ignite(S, 'home:1', 0);
  B.step(S, 100);
  B.ignite(S, 'home:1', 100);
  B.step(S, 200);
  B.ignite(S, 'home:1', 200);
  B.step(S, 300);
  assert.ok(S.ruin['home:1'] < 0.35, 'dưới ngưỡng sụp của render/build/ruins3d.js');
  B.ignite(S, 'home:2', 0);
  B.douse(S, 'home:2');
  B.step(S, 50);
  assert.strictEqual(S.ruin['home:2'], undefined);
});
