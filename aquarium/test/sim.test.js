const assert = require('node:assert');
const test = require('node:test');
const Sim = require('../sim.js');

const close = (a, b) => Math.abs(a - b) < 1e-6 * Math.max(1, Math.abs(b));

test('sổ cái: tiền không tự sinh ra hay mất đi', () => {
  const w = Sim.create({ seed: 7 });
  for (let i = 0; i < 1500; i++) {
    if (i === 200) Sim.printMoney(w, 5000);
    if (i === 400) Sim.setPolicy(w, 'interestRate', 0.18);
    if (i === 700) Sim.setPolicy(w, 'taxRate', 0.4);
    Sim.step(w);
    assert.ok(close(Sim.totalMoney(w), Sim.expectedMoney(w)), `lệch sổ cái ở ngày ${w.day}`);
  }
});

test('tất định: cùng seed cho cùng lịch sử', () => {
  const a = Sim.create({ seed: 99 }), b = Sim.create({ seed: 99 });
  for (let i = 0; i < 300; i++) { Sim.step(a); Sim.step(b); }
  assert.deepStrictEqual(a.stats.at(-1), b.stats.at(-1));
});

test('nền kinh tế sống: không sụp và không chết đói hàng loạt khi không can thiệp', () => {
  for (const seed of [1, 2, 3, 4, 5]) {
    const w = Sim.create({ seed });
    for (let i = 0; i < 1000; i++) Sim.step(w);
    const last = w.stats.slice(-100);
    const avg = (k) => last.reduce((s, x) => s + x[k], 0) / last.length;
    assert.ok(avg('firms') >= 8, `seed ${seed}: còn quá ít doanh nghiệp (${avg('firms')})`);
    assert.ok(avg('unemployment') < 35, `seed ${seed}: thất nghiệp ${avg('unemployment').toFixed(1)}%`);
    assert.ok(avg('hungry') < 20, `seed ${seed}: ${avg('hungry').toFixed(1)} hộ đói mỗi ngày`);
    assert.ok(avg('cpi') > 20 && avg('cpi') < 500, `seed ${seed}: CPI ${avg('cpi').toFixed(0)}`);
  }
});

test('in nhiều tiền làm giá tăng', () => {
  const base = Sim.create({ seed: 11 }), inflated = Sim.create({ seed: 11 });
  for (let i = 0; i < 200; i++) { Sim.step(base); Sim.step(inflated); }
  for (let k = 0; k < 5; k++) Sim.printMoney(inflated, 20000);
  for (let i = 0; i < 150; i++) { Sim.step(base); Sim.step(inflated); }
  assert.ok(inflated.stats.at(-1).cpi > base.stats.at(-1).cpi * 1.3,
    `CPI ${inflated.stats.at(-1).cpi.toFixed(0)} vs ${base.stats.at(-1).cpi.toFixed(0)}`);
});
