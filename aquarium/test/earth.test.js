// Bể Kính · test/earth.test.js · Đất nhô của phép đất (magic/earth/shape.js, magic/earth/rise.js; design/ke-hoach-buoc-37.md)
const test = require('node:test');
const assert = require('node:assert');
const Sh = require('../magic/earth/shape.js');
const R = require('../magic/earth/rise.js');

test('Đất trồi: mặt trên bằng cao h quanh chân, sườn thoải, ngoài viền bằng 0', () => {
  const b = { kind: 'uplift', r: 3.6, h: 1.8, seed: 1 };
  assert.ok(Math.abs(Sh.at(b, 0, 0, 1) - 1.8) < 1e-9);
  assert.ok(Math.abs(Sh.at(b, 0.7, 0.3, 1) - 1.8) < 1e-9, 'mặt trên bằng: người đứng vừa');
  const mid = Sh.at(b, 2.2, 0, 1);
  assert.ok(mid > 0.2 && mid < 1.6, 'sườn ' + mid);
  assert.strictEqual(Sh.at(b, 5, 0, 1), 0);
  assert.strictEqual(Sh.at(b, 0, 0, 0), 0, 'chưa trồi');
  assert.ok(Sh.at(b, 0, 0, 0.3) < Sh.at(b, 0, 0, 0.6), 'trồi dần');
});

test('Núi đất: cao nhất ở đỉnh, thấp dần đều ra viền (hình ngọn núi)', () => {
  const b = { kind: 'mount', r: 4.5, h: 3.2, seed: 0 };
  let last = Infinity;
  for (let d = 0; d < 4; d += 0.5) {
    const y = Sh.at(b, d, 0, 1);
    assert.ok(y < last, 'thấp dần ở ' + d);
    last = y;
  }
  assert.ok(Sh.at(b, 0, 0, 1) > 2 && Sh.at(b, 0, 0, 1) <= 3.2);
});

test('đất nhô theo trận: hết giờ thì bỏ, tối đa MAX khối mỗi đảo', () => {
  const S = {};
  const a = R.raise(S, { kind: 'uplift', x: 1, z: 2, r: 3.6, h: 1.8 }, 10);
  assert.strictEqual(a.until, 10 + R.LAST.uplift);
  R.step(S, 20);
  assert.strictEqual(S.rises.length, 1);
  R.step(S, 10 + R.LAST.uplift);
  assert.strictEqual(S.rises.length, 0);
  for (let k = 0; k < R.MAX + 3; k++) R.raise(S, { kind: 'mount', x: k, z: 0, r: 4.5, h: 3.2 }, 100);
  assert.strictEqual(S.rises.length, R.MAX);
  assert.strictEqual(S.rises[0].x, 3, 'khối cũ nhất hạ trước');
});
