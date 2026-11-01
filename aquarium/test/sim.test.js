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
    if (i === 900) Sim.fund(w, w.firms.filter((f) => f.alive && f.sector === 'food'), 2000, 'print');
    if (i === 950) Sim.fund(w, w.households, 5000, 'print');
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

test('cú sốc năng suất bằng 0 không làm giá thành vô hạn', () => {
  const w = Sim.create({ seed: 3 });
  for (let i = 0; i < 100; i++) Sim.step(w);
  for (const f of w.firms) if (f.sector === 'goods') f.prod = 0;
  for (let i = 0; i < 20; i++) Sim.step(w);
  const s = w.stats.at(-1);
  assert.ok(Number.isFinite(s.cpi) && s.cpi < 1000, `CPI ${s.cpi}`);
});

test('nền kinh tế có nhịp sống: thất nghiệp tự nhiên, chu kỳ, phá sản, giàu nghèo, lạm phát vừa phải', () => {
  for (const seed of [1, 2, 3]) {
    const w = Sim.create({ seed });
    for (let i = 0; i < 2000; i++) Sim.step(w);
    const st = w.stats.slice(200);
    const mean = (k) => st.reduce((s, x) => s + x[k], 0) / st.length;
    const sd = (k) => { const m = mean(k); return Math.sqrt(st.reduce((s, x) => s + (x[k] - m) ** 2, 0) / st.length); };
    const yrs = (st.length - 1) / 360, infl = (Math.pow(st.at(-1).cpi / st[0].cpi, 1 / yrs) - 1) * 100;
    assert.ok(mean('unemployment') > 1 && mean('unemployment') < 12, `seed ${seed}: thất nghiệp TB ${mean('unemployment').toFixed(1)}%`);
    assert.ok(sd('unemployment') > 2, `seed ${seed}: không có chu kỳ (độ lệch ${sd('unemployment').toFixed(1)})`);
    assert.ok(Math.max(...st.map((x) => x.unemployment)) > 12, `seed ${seed}: không có suy thoái nào`);
    assert.ok(w.firms.filter((f) => !f.alive).length >= 3, `seed ${seed}: quá ít phá sản`);
    assert.ok(mean('gini') > 0.2 && mean('gini') < 0.55, `seed ${seed}: Gini ${mean('gini').toFixed(2)}`);
    assert.ok(infl > -3 && infl < 12, `seed ${seed}: lạm phát ${infl.toFixed(1)}%/năm`);
    assert.ok(mean('hungry') < 12, `seed ${seed}: ${mean('hungry').toFixed(1)} hộ đói/ngày`);
  }
});

test('chính sách có tác động thật: lãi suất cao làm tăng thất nghiệp, lương tối thiểu nâng lương sàn và đẩy giá', () => {
  function run(setup) {
    const w = Sim.create({ seed: 5 });
    for (let i = 0; i < 150; i++) Sim.step(w);
    setup(w);
    let ue = 0, n = 0;
    for (let i = 0; i < 300; i++) { Sim.step(w); if (i > 100) { ue += w.stats.at(-1).unemployment; n++; } }
    return { ue: ue / n, cpi: w.stats.at(-1).cpi, minWage: Math.min(...w.firms.filter((f) => f.alive).map((f) => f.wage)), w };
  }
  const base = run(() => {}), tight = run((w) => Sim.setPolicy(w, 'interestRate', 0.18)), mw = run((w) => Sim.setPolicy(w, 'minWage', 14));
  assert.ok(tight.ue > base.ue + 5, `lãi 18%: thất nghiệp ${tight.ue.toFixed(1)}% so với ${base.ue.toFixed(1)}%`);
  assert.ok(mw.minWage >= 14, `lương sàn ${mw.minWage}`);
  assert.ok(mw.cpi > base.cpi * 1.15, `giá ${mw.cpi.toFixed(0)} so với ${base.cpi.toFixed(0)}`);
  for (const r of [base, tight, mw]) assert.ok(close(Sim.totalMoney(r.w), Sim.expectedMoney(r.w)));
});
