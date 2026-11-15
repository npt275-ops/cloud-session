// Bể Kính · test/blackhole.test.js · Nhịp và luật của Hố đen (magic/soul/blackhole/plan.js; design/ke-hoach-buoc-37.md)
const test = require('node:test');
const assert = require('node:assert');
const H = require('../magic/soul/blackhole/plan.js');
const P = H.P;
for (const R of [30, 45, 60])
  test('đảo bán kính ' + R + ': hố lớn dần tới nửa đảo, vật nhỏ trước rồi tới nhà, tầm hút lan dần', () => {
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
    let lr = 0;
    for (let t = 0; t <= P.REACH_END + 4; t += 0.5) {
      assert.ok(H.reach(t, R) >= lr, 'tầm hút chỉ lan ra');
      lr = H.reach(t, R);
    }
    assert.ok(Math.abs(H.reach(P.REACH_END, R) - R * P.REACH_MAX) < 1e-9, 'tầm hút lớn nhất');
  });
test('hố lớn hơn vật thì mới hút được vật', () => {
  assert.ok(!H.eats(P.HOUSE, 0, 40) && H.eats(P.HOUSE, P.GROW, 40));
  assert.ok(!H.eats(200, P.GROW, 40), 'vật to hơn cả hố thì không');
  assert.strictEqual(H.eatAt(200, 40), Infinity);
});
test('phát ở giữa đảo thì hút gần hết đảo; phát ở đầu đảo thì chạy về cuối đảo không bị hút', () => {
  const R = 60,
    far = H.reach(P.HOLD_END, R);
  assert.ok(far >= 0.8 * R, 'từ giữa đảo: tầm hút phủ gần tới mép');
  assert.ok(far < R, 'từ đầu đảo: cuối đảo (cách hơn R, cả ở đảo hẹp) vẫn ngoài tầm');
});
test('hố còn tới HOLD_END rồi tan dần (bản thử: trả lại đảo)', () => {
  assert.strictEqual(H.fade(P.HOLD_END), 1);
  assert.ok(H.fade(P.HOLD_END + P.RELEASE / 2) > 0 && H.fade(P.HOLD_END + P.RELEASE / 2) < 1);
  assert.strictEqual(H.fade(P.HOLD_END + P.RELEASE), 0);
  assert.ok(!H.done(P.HOLD_END) && H.done(P.HOLD_END + P.RELEASE));
});
test('đường bị cuốn: quay quanh hố nhiều vòng, co dần, rồi mới lao vào tâm', () => {
  const a = H.spiral(0, 20),
    b = H.spiral(0.5, 20),
    c = H.spiral(1, 20);
  assert.ok(a.d === 1 && b.d < 1 && c.d === 0);
  assert.ok(c.turn > b.turn && b.turn > a.turn);
  assert.ok(a.stretch === 1 && c.stretch > b.stretch);
  assert.ok(c.turn >= Math.PI * 2 && c.turn <= Math.PI * 4, 'quay quanh hố 1–2 vòng');
  const ring = H.spiral(0.55, 20, 6);
  assert.ok(Math.abs(ring.d * 20 - 6) < 0.3, 'quay vòng sát lõi trước khi chui vào: ' + (ring.d * 20).toFixed(2));
  assert.ok(c.head === 1 && c.stretch >= 4, 'cuối: quay đầu vào tâm, người bị kéo dài');
});
