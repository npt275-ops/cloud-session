// Bể Kính · test/possess-swim.test.js · Bơi của nhân vật đang nhập hồn (game/possess-swim.js)
const test = require('node:test');
const assert = require('node:assert');
require('../game/possess-swim.js');
const { create, SWIM } = globalThis.BK.PossessSwim;
const DT = 1 / 60;
const run = (S, sec, depth, up, down) => {
  for (let t = 0; t < sec; t += DT) S.step(DT, depth, up, down);
};

test('nước nông thì không bơi; ngập quá chân thì bơi, chuyển dần sang tư thế bơi', () => {
  const S = create();
  run(S, 1, 0.5);
  assert.strictEqual(S.on, false);
  assert.strictEqual(S.step(DT, 10), 'in');
  run(S, 1.5, 10);
  assert.ok(S.on && S.k > 0.95);
});

test('giữ Space bơi lên tới sát mặt nước rồi dừng; giữ Shift lặn xuống tới đáy; thả ra thì lơ lửng', () => {
  const S = create(),
    depth = 12;
  run(S, 8, depth, true, false);
  const top = depth - SWIM.EYE + SWIM.HEAD_OUT;
  assert.ok(Math.abs(S.y - top) < 1e-6, 'sát mặt nước ' + S.y);
  run(S, 1, depth, false, true);
  const mid = S.y;
  assert.ok(mid < top - 0.5, 'đang lặn');
  run(S, 1, depth, false, false);
  const a = S.lift;
  run(S, 0.9, depth, false, false);
  assert.ok(Math.abs(S.lift - a) < 0.4 && S.lift > 0, 'lơ lửng, không rơi xuống đáy');
  run(S, 12, depth, false, true);
  assert.strictEqual(S.y, 0, 'chạm đáy thì dừng');
});

test('vào nước mà không bấm gì: nổi nhẹ lên, lơ lửng cách đáy', () => {
  const S = create();
  run(S, 4, 10, false, false);
  assert.ok(S.lift > SWIM.FLOAT * 0.7 && S.lift < SWIM.FLOAT + 0.3, 'lơ lửng ' + S.lift);
});

test('nước rút thì thôi bơi, trả độ cao để rơi xuống', () => {
  const S = create();
  run(S, 3, 8, true, false);
  const y = S.lift;
  assert.strictEqual(S.step(DT, 0.3), 'out');
  assert.strictEqual(S.on, false);
  assert.ok(Math.abs(S.y - y) < 1e-9);
});
