// Bể Kính · test/staff-weight.test.js · Sức nặng của gậy phép (render/magic/staff-weight.js; design/ke-hoach-buoc-37.md)
const test = require('node:test');
const assert = require('node:assert');
const SW = require('../render/magic/staff-weight.js');
const UP = { x: 0, y: 1, z: 0 },
  FWD = { x: 0, y: 0, z: 1 },
  DT = 1 / 60;
// chạy tay theo đường hand(t) với hướng đích dir(t) trong T giây, trả mọi hướng thật
function run(st, T, hand, dir, t0 = 0) {
  const out = [];
  for (let t = t0; t < t0 + T; t += DT) out.push(SW.step(st, hand(t), dir(t), 0.6, DT));
  return out;
}
test('chạy đều thì gậy không trễ (về đúng hướng đích)', () => {
  const st = SW.state();
  const r = run(st, 3, (t) => ({ x: 7.5 * t, y: 1, z: 0 }), () => UP);
  const d = r[r.length - 1];
  assert.ok(Math.abs(d.x) < 0.02 && d.y > 0.99, JSON.stringify(d));
});
test('phanh gấp: đầu gậy văng tới trước rồi lắc về', () => {
  const st = SW.state();
  run(st, 2, (t) => ({ x: 5 * t, y: 1, z: 0 }), () => UP);
  const r = run(st, 2, () => ({ x: 10, y: 1, z: 0 }), () => UP, 2);
  const peak = Math.max(...r.map((d) => d.x));
  assert.ok(peak > 0.08, 'văng tới ' + peak.toFixed(3));
  assert.ok(Math.abs(r[r.length - 1].x) < 0.02, 'về đứng ' + r[r.length - 1].x.toFixed(3));
});
test('đổi hướng đích (rẽ, chống gậy): đi theo sau một nhịp, không giật', () => {
  const st = SW.state();
  run(st, 1, () => ({ x: 0, y: 1, z: 0 }), () => UP);
  const r = run(st, 1.5, () => ({ x: 0, y: 1, z: 0 }), () => FWD, 1);
  assert.ok(r[1].y > 0.9, 'khung đầu còn gần đứng ' + r[1].y.toFixed(3));
  assert.ok(r[r.length - 1].z > 0.97, 'tới hướng mới ' + r[r.length - 1].z.toFixed(3));
});
test('cầm ngang thì hơi trĩu, khung chậm (0,1 giây) không nổ', () => {
  const st = SW.state();
  let d;
  for (let i = 0; i < 40; i++) d = SW.step(st, { x: 0, y: 1, z: 0 }, FWD, 0.6, 0.1);
  assert.ok(d.y < 0 && d.y > -0.1, 'trĩu ' + d.y.toFixed(3));
  assert.ok(Math.abs(Math.hypot(d.x, d.y, d.z) - 1) < 1e-6);
});
