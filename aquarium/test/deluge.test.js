// Bể Kính · test/deluge.test.js · Nhịp của Đại hồng thuỷ (magic/water/deluge/plan.js; design/ke-hoach-buoc-37.md)
const test = require('node:test');
const assert = require('node:assert');
const D = require('../magic/water/deluge/plan.js');

test('nước dâng tới 13 đến 15 lần tầm mắt nhân vật, dâng đều lên, đứng ở đỉnh', () => {
  assert.ok(D.EYES >= 13 && D.EYES <= 15);
  assert.ok(Math.abs(D.at(D.HOLD_AT).level - D.EYE * D.EYES) < 1e-9);
  let last = -1;
  for (let t = D.RISE_AT; t <= D.HOLD_AT; t += 0.25) {
    const L = D.at(t).level;
    assert.ok(L >= last, 'dâng đều ở ' + t);
    last = L;
  }
  assert.strictEqual(D.at(D.HOLD_AT + 0.5).phase, 'hold');
});

test('nước rơi càng lúc càng nhanh rồi đập xuống, sóng mạnh nhất lúc đập, rồi về bình thường', () => {
  const v1 = D.at(D.CRASH_AT + 0.2).level - D.at(D.CRASH_AT + 0.4).level,
    v2 = D.at(D.HIT_AT - 0.4).level - D.at(D.HIT_AT - 0.2).level;
  assert.ok(v2 > v1, 'rơi nhanh dần');
  assert.ok(D.at(D.HIT_AT - 0.01).swell > D.at(D.HOLD_AT).swell);
  assert.ok(D.at(D.HIT_AT + 0.3).level < 0, 'dội xuống thấp hơn mặt biển');
  const end = D.at(D.END + 1);
  assert.deepStrictEqual([end.done, end.level, end.swell, end.vortex], [true, 0, 1, 0]);
});

test('lốc xoáy thành hình lúc sóng dâng, mạnh nhất lúc đứng, sụp khi nước rơi', () => {
  assert.ok(D.at(1).vortex > 0 && D.at(1).vortex < 1);
  assert.strictEqual(D.at(D.HOLD_AT + 0.1).vortex, 1);
  assert.ok(D.at(D.HIT_AT - 0.01).vortex < 0.05);
});
