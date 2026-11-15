// Bể Kính · test/blackhole.test.js · Nhịp và luật của Hố đen (magic/soul/blackhole/plan.js; design/ke-hoach-buoc-37.md)
const test = require('node:test');
const assert = require('node:assert');
const H = require('../magic/soul/blackhole/plan.js');
const P = H.P;
for (const R of [30, 45, 60])
  test('đảo bán kính ' + R + ': hố lớn dần tới nửa đảo, hút người trước, rồi nhà, rồi người nhập hồn, rồi cả đảo', () => {
    let last = 0;
    for (let t = 0; t <= P.GROW + 5; t += 0.5) {
      const o = H.outer(t, R);
      assert.ok(o >= last, 'chỉ lớn lên');
      last = o;
    }
    assert.ok(Math.abs(H.outer(P.GROW, R) - R / 2) < 1e-9, 'cỡ đủ: nửa đảo');
    assert.ok(H.horizon(P.GROW, R) < H.outer(P.GROW, R) / 2, 'lõi nhỏ hơn cả hố');
    const person = H.eatAt(P.PERSON, R),
      house = H.houseAt(R);
    assert.ok(person < 2, 'người bị hút gần như ngay: ' + person.toFixed(1));
    assert.ok(house > 6 && house < 15, 'nhà bị nhấc lên sau chừng 10 giây: ' + house.toFixed(1));
    assert.ok(H.playerAt(R) > house && H.playerIn(R) > H.playerAt(R), 'người nhập hồn bị hút sau khi thấy nhà bị nhấc');
    assert.ok(H.reach(person + 0.1, R) > 0 && H.reach(0, R) === (H.eats(P.PERSON, 0, R) ? H.outer(0, R) * P.REACH : 0));
    assert.strictEqual(H.front(house - 0.1, R), 0, 'trước khi đủ lớn: đất, nhà chưa bị hút');
    assert.ok(H.front(P.EAT_END, R) >= H.height(P.EAT_END, R) + R, 'mặt hút phủ hết đảo');
  });
test('hố lớn hơn vật thì mới hút được vật', () => {
  assert.ok(!H.eats(P.HOUSE, 0, 40) && H.eats(P.HOUSE, P.GROW, 40));
  assert.ok(!H.eats(200, P.GROW, 40), 'vật to hơn cả hố thì không');
  assert.strictEqual(H.eatAt(200, 40), Infinity);
});
test('hố còn tới HOLD_END rồi tan dần (bản thử: trả lại đảo)', () => {
  assert.strictEqual(H.fade(P.HOLD_END), 1);
  assert.ok(H.fade(P.HOLD_END + P.RELEASE / 2) > 0 && H.fade(P.HOLD_END + P.RELEASE / 2) < 1);
  assert.strictEqual(H.fade(P.HOLD_END + P.RELEASE), 0);
  assert.ok(!H.done(P.HOLD_END) && H.done(P.HOLD_END + P.RELEASE));
});
test('đường xoắn vào tâm: gần dần, quay thêm, kéo dài người ra', () => {
  const a = H.spiral(0, 20),
    b = H.spiral(0.5, 20),
    c = H.spiral(1, 20);
  assert.ok(a.d === 1 && b.d < 1 && c.d === 0);
  assert.ok(c.turn > b.turn && b.turn > a.turn);
  assert.ok(a.stretch === 1 && c.stretch > b.stretch);
});
