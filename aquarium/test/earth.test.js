// Bể Kính · test/earth.test.js · Đất nhô của phép đất (magic/earth/shape.js, magic/earth/rise.js; design/ke-hoach-buoc-37.md)
const test = require('node:test');
const assert = require('node:assert');
const Sh = require('../magic/earth/shape.js');
const R = require('../magic/earth/rise.js');

test('Trụ đá: đỉnh trụ phẳng cao h ở giữa, núi thấp dần ra viền, ngoài viền bằng 0', () => {
  const b = { kind: 'peak', r: 7.5, h: 7, seed: 1 };
  assert.ok(Math.abs(Sh.at(b, 0, 0, 1) - 7) < 1e-9);
  assert.ok(Math.abs(Sh.at(b, 0.8, 0.3, 1) - 7) < 1e-9, 'mặt đỉnh phẳng: người đứng vừa');
  const mid = Sh.at(b, 4, 0, 1);
  assert.ok(mid > 0.3 && mid < 3, 'sườn núi ' + mid);
  assert.strictEqual(Sh.at(b, 9, 0, 1), 0);
  assert.strictEqual(Sh.at(b, 0, 0, 0), 0, 'chưa trồi');
  assert.ok(Sh.at(b, 0, 0, 0.3) < Sh.at(b, 0, 0, 0.6), 'trồi dần');
});

test('Núi đá: trụ quanh tâm trồi trước, đất giữa dâng lên sau', () => {
  const b = { kind: 'mount', r: 6.5, h: 4.5, seed: 0 };
  const crag = [Math.cos(0) * 3.25, Math.sin(0) * 3.25],
    between = [Math.cos(Math.PI / 6) * 1.6, Math.sin(Math.PI / 6) * 1.6];
  assert.ok(Sh.at(b, crag[0], crag[1], 0.3) > 1, 'trụ đã lên');
  assert.ok(Sh.at(b, between[0], between[1], 0.3) < 0.3, 'đất giữa chưa lên nhiều');
  assert.ok(Sh.at(b, between[0], between[1], 1) > 3, 'xong: thành núi');
});

test('đất nhô theo trận: hết giờ thì bỏ, tối đa MAX khối mỗi đảo', () => {
  const S = {};
  const a = R.raise(S, { kind: 'peak', x: 1, z: 2, r: 7, h: 7 }, 10);
  assert.strictEqual(a.until, 10 + R.LAST.peak);
  R.step(S, 20);
  assert.strictEqual(S.rises.length, 1);
  R.step(S, 10 + R.LAST.peak);
  assert.strictEqual(S.rises.length, 0);
  for (let k = 0; k < R.MAX + 3; k++) R.raise(S, { kind: 'mount', x: k, z: 0, r: 6, h: 4 }, 100);
  assert.strictEqual(S.rises.length, R.MAX);
  assert.strictEqual(S.rises[0].x, 3, 'khối cũ nhất hạ trước');
});
