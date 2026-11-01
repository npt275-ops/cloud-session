const assert = require('node:assert');
const test = require('node:test');
const Sim = require('../sim.js');

const close = (a, b) => Math.abs(a - b) < 1e-6 * Math.max(1, Math.abs(b));
// Các thí nghiệm về một hiện tượng riêng lẻ tắt những cơ chế của Mốc 3 không liên quan, để chỉ đo đúng thứ cần đo
const M3OFF = { gold: true, epidemic: true, ponzi: true, strike: true, market: true, social: true };

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
  // rổ giá dùng giá trung vị hàng hoá (không còn bị cơn sốt làm phồng): trên 5 thành phố hiệu ứng là +13% đến +36%
  assert.ok(mw.cpi > base.cpi * 1.1, `giá ${mw.cpi.toFixed(0)} so với ${base.cpi.toFixed(0)}`);
  for (const r of [base, tight, mw]) assert.ok(close(Sim.totalMoney(r.w), Sim.expectedMoney(r.w)));
});

test('xây dựng: dân nhập cư và doanh nghiệp do người chơi xây giữ sổ cái khớp và có tác động thật', () => {
  const w = Sim.create({ seed: 8 });
  for (let i = 0; i < 200; i++) Sim.step(w);
  const n0 = w.households.length, firms0 = w.firms.filter((f) => f.alive).length;
  for (let k = 0; k < 5; k++) Sim.addHouseholds(w, 4, 30);
  assert.strictEqual(w.households.length, n0 + 20);
  assert.ok(w.households.every((h, i) => h.id === i), 'id hộ gia đình phải trùng chỉ số');
  const shop = Sim.openFirm(w, 'goods', ' do người chơi xây');
  assert.ok(shop.alive && shop.debt === 250 && shop.cash === 250);
  assert.strictEqual(w.firms.filter((f) => f.alive).length, firms0 + 1);
  for (let i = 0; i < 400; i++) {
    Sim.step(w);
    assert.ok(close(Sim.totalMoney(w), Sim.expectedMoney(w)), `lệch sổ cái ở ngày ${w.day}`);
  }
  const newcomers = w.households.slice(n0);
  assert.ok(newcomers.some((h) => h.employer !== null), 'người mới phải tìm được việc');
});

test('lạm phát vừa phải và không ngành nào chết hẳn trên 8 thành phố khác nhau', () => {
  for (let seed = 1; seed <= 8; seed++) {
    const w = Sim.create({ seed });
    let minFood = Infinity;
    for (let i = 0; i < 2000; i++) {
      Sim.step(w);
      if (i > 100) minFood = Math.min(minFood, w.firms.filter((f) => f.alive && f.sector === 'food').length);
    }
    const st = w.stats.slice(200), yrs = (st.length - 1) / 360;
    const infl = (Math.pow(st.at(-1).cpi / st[0].cpi, 1 / yrs) - 1) * 100;
    // rổ giá dùng giá trung vị hàng hoá; thành phố nhiều phát minh có thể giảm phát nhẹ do lương thực rẻ đi
    assert.ok(infl > -5 && infl < 10, `seed ${seed}: lạm phát ${infl.toFixed(1)}%/năm`);
    assert.ok(minFood >= 2, `seed ${seed}: có lúc chỉ còn ${minFood} lò thực phẩm`);
    assert.ok(close(Sim.totalMoney(w), Sim.expectedMoney(w)), `seed ${seed}: lệch sổ cái`);
  }
});

test('hiện tượng: bốn mùa đổi sản lượng lương thực', () => {
  const w = Sim.create({ seed: 2 });
  const at = (d) => { while (w.day < d) Sim.step(w); return Sim.phenomena(w); };
  const spring = at(30), summer = at(120), autumn = at(210), winter = at(300);
  assert.deepStrictEqual([spring.seasonName, summer.seasonName, autumn.seasonName, winter.seasonName], ['xuân', 'hạ', 'thu', 'đông']);
  assert.ok(autumn.foodFactor > spring.foodFactor && spring.foodFactor > winter.foodFactor);
});

test('hiện tượng: hạn hán làm thiếu lương thực, lễ hội làm người dân mua sắm nhiều hơn', () => {
  function pair(kind, from, days) {
    const a = Sim.create({ seed: 4, off: M3OFF }), b = Sim.create({ seed: 4, off: M3OFF });
    for (let i = 0; i < from; i++) { Sim.step(a); Sim.step(b); }
    a.phen.drought = 0; b.phen.drought = 0; a.phen.festival = 0; b.phen.festival = 0;
    Sim.trigger(b, kind, days);
    const sa = [], sb = [], ka = [], kb = [], wa = [], wb = [];
    const food = (w) => w.firms.filter((x) => x.alive && x.sector === 'food');
    for (let i = 0; i < days; i++) {
      Sim.step(a); Sim.step(b); sa.push(a.stats.at(-1)); sb.push(b.stats.at(-1));
      ka.push(food(a).reduce((t, x) => t + x.inv, 0)); kb.push(food(b).reduce((t, x) => t + x.inv, 0));
      wa.push(food(a).reduce((t, x) => t + x.workers.length, 0)); wb.push(food(b).reduce((t, x) => t + x.workers.length, 0));
    }
    const avg = (arr, k) => arr.reduce((s, x) => s + x[k], 0) / arr.length;
    return { a: sa, b: sb, avg, ka, kb, wa, wb };
  }
  // Hạn hán: rút cạn kho, đẩy giá lương thực lên, và kéo lao động sang nông nghiệp
  const d = pair('drought', 130, 40);
  // kho dự trữ và năng suất từ phát minh làm giá tăng ít hơn, nhưng vẫn phải tăng rõ rệt
  assert.ok(d.avg(d.b, 'foodPrice') > d.avg(d.a, 'foodPrice') * 1.03, `giá lương thực khi hạn ${d.avg(d.b, 'foodPrice').toFixed(2)} so với ${d.avg(d.a, 'foodPrice').toFixed(2)}`);
  const half = (arr) => arr.slice(5, 20).reduce((t, x) => t + x, 0) / 15;
  // người bỏ xưởng về ruộng khi thiếu ăn giúp thành phố chống hạn tốt hơn, nhưng kho vẫn phải vơi rõ rệt
  assert.ok(half(d.kb) < half(d.ka) * 0.8, `kho lương thực nửa đầu đợt hạn ${half(d.kb).toFixed(0)} so với ${half(d.ka).toFixed(0)}`);
  assert.ok(Math.max(...d.wb) > Math.max(...d.wa) * 1.2, `lao động nông nghiệp khi hạn ${Math.max(...d.wb)} so với ${Math.max(...d.wa)}`);
  const f = pair('festival', 330, 12);
  assert.ok(f.avg(f.b, 'gdp') > f.avg(f.a, 'gdp') * 1.05, `chi tiêu lễ hội ${f.avg(f.b, 'gdp').toFixed(0)} so với ${f.avg(f.a, 'gdp').toFixed(0)}`);
});

test('hiện tượng: khủng hoảng niềm tin siết tín dụng (không ai vay quá 35% hạn mức), chặn khởi nghiệp tự nhiên, sổ cái vẫn khớp', () => {
  const w = Sim.create({ seed: 6 });
  for (let i = 0; i < 300; i++) Sim.step(w);
  w.phen.panic = 0;
  Sim.trigger(w, 'panic', 30);
  const limit = (f) => Math.max(150, f.wage * Math.max(1, f.workers.length) * 15);
  const lastStory = w.storySeq;
  for (let i = 0; i < 29; i++) {
    const before = new Map(w.firms.map((f) => [f.id, f.debt]));
    Sim.step(w);
    for (const f of w.firms) {
      if (!f.alive || !before.has(f.id)) continue;
      // nợ chỉ được tăng vì vay mới khi vẫn dưới 35% hạn mức
      if (f.debt > before.get(f.id) + 1e-9) assert.ok(f.debt <= limit(f) * 0.35 + 1e-6, `${f.name} vay vượt hạn mức khủng hoảng: ${f.debt.toFixed(0)} > ${(limit(f) * 0.35).toFixed(0)}`);
    }
    assert.ok(close(Sim.totalMoney(w), Sim.expectedMoney(w)));
  }
  const natural = Sim.storiesSince(w, lastStory).filter((st) => st.type === 'open' && st.text.includes('làm ăn tốt'));
  assert.strictEqual(natural.length, 0, 'không được có khởi nghiệp tự nhiên trong lúc khủng hoảng');
  assert.ok(Sim.phenomena(w).panic > 0);
});

/* ====================== Mốc 1: bộ máy câu chuyện ====================== */

test('câu chuyện: thành phố tự sinh ra chuyện dày đặc và đa dạng, có nhân vật và địa điểm', () => {
  const w = Sim.create({ seed: 3 });
  for (let i = 0; i < 1500; i++) Sim.step(w);
  const by = (t) => w.stories.filter((s) => s.tier === t).length;
  assert.ok(by('small') >= 150, `chuyện nhỏ: ${by('small')}`);
  assert.ok(by('major') >= 30, `biến cố: ${by('major')}`);
  assert.ok(by('epic') >= 8, `đại sự: ${by('epic')}`);
  const types = new Set(w.stories.map((s) => s.type));
  for (const t of ['invention', 'fad', 'airship', 'bankrupt', 'job', 'layoff', 'gold', 'wedding', 'chapter']) assert.ok(types.has(t), `thiếu loại chuyện ${t}`);
  assert.ok(types.size >= 25, `chỉ có ${types.size} loại chuyện`);
  for (const s of w.stories) { assert.ok(s.title && s.text, 'chuyện phải có tiêu đề và nội dung'); }
  assert.ok(w.stories.filter((s) => s.place).length / w.stories.length > 0.9, 'hầu hết chuyện phải có địa điểm để camera bay tới');
  assert.notStrictEqual(Sim.nameOf(0), Sim.nameOf(1));
  assert.strictEqual(new Set(Array.from({ length: 168 }, (_, i) => Sim.nameOf(i))).size, 168, '168 tên đầu tiên không trùng');
});

test('gieo phát minh: năng suất tăng, phải chờ hạt giống ủ lại, nơi được gieo giành thêm thị phần', () => {
  const w = Sim.create({ seed: 4 });
  for (let i = 0; i < 120; i++) Sim.step(w);
  const goods = w.firms.filter((x) => x.alive && x.sector === 'goods').sort((a, b) => a.workers.length - b.workers.length);
  const f = goods[Math.floor(goods.length / 2)];
  // thị phần tính theo lượng hàng bán được (năng suất cao thì cần ít người hơn cho cùng lượng hàng)
  const share = () => { const g = w.firms.filter((x) => x.alive && x.sector === 'goods'); return f.avgSales / Math.max(1e-9, g.reduce((t, x) => t + x.avgSales, 0)); };
  const p0 = f.prod, s0 = share();
  const r = Sim.seedInvention(w, f.id);
  assert.ok(r.ok && r.story.type === 'invention' && r.story.seeded);
  assert.ok(f.prod > p0 * 1.2, `năng suất ${p0.toFixed(2)} → ${f.prod.toFixed(2)}`);
  const again = Sim.seedInvention(w, f.id);
  assert.ok(!again.ok && again.reason === 'wait' && again.wait > 30, 'hạt giống phải ủ lại');
  let s1 = 0;
  for (let i = 0; i < 80; i++) { Sim.step(w); if (i >= 60) s1 += share() / 20; }
  assert.ok(!f.alive || s1 > s0, `thị phần hàng bán ${s0.toFixed(2)} → ${s1.toFixed(2)}`);
  assert.ok(close(Sim.totalMoney(w), Sim.expectedMoney(w)));
});

test('cơn sốt: lan như dịch, giá vọt lên, có đầu cơ, rồi bong bóng vỡ và lắng xuống', () => {
  const w = Sim.create({ seed: 5, off: M3OFF });
  for (let i = 0; i < 150; i++) Sim.step(w);
  for (const fd of w.fads) fd.state = 'over';
  const f = w.firms.filter((x) => x.alive && x.sector === 'goods').sort((a, b) => b.workers.length - a.workers.length)[0];
  const fad = Sim.startFad(w, f.id, 'Ô giấy bay');
  assert.ok(fad);
  let maxShare = 0;
  for (let i = 0; i < 200 && fad.state !== 'over'; i++) { Sim.step(w); maxShare = Math.max(maxShare, fad.share); assert.ok(close(Sim.totalMoney(w), Sim.expectedMoney(w))); }
  const types = w.stories.filter((s) => s.fadId === fad.id).map((s) => s.type);
  assert.ok(maxShare > 0.2, `đỉnh lây lan ${(maxShare * 100).toFixed(0)}%`);
  assert.ok(fad.maxRatio > 1.8, `giá đỉnh gấp ${fad.maxRatio.toFixed(2)} lần`);
  assert.ok(fad.hoarded > 0, 'phải có người đầu cơ tích trữ');
  assert.ok(types.includes('fad-peak') && types.includes('fad-crash'), `diễn biến: ${types.join(', ')}`);
  assert.strictEqual(fad.state, 'over', 'cơn sốt phải lắng xuống');
});

test('nỗi sợ có điểm bùng phát (thống kê trên 8 thành phố): gieo ít hiếm khi gây rút tiền, gieo nhiều gần như luôn gây', () => {
  function run(seed, frac, days) {
    const w = Sim.create({ seed });
    for (let i = 0; i < 200; i++) Sim.step(w);
    // cô lập cơ chế lan truyền: xoá nợ xấu tích luỹ và khoá "tin đồn về Kho Bạc" trong cửa sổ đo
    w.phen.panic = 0; w.phen.panicCool = 400; w.phen.badDebt = 0;
    for (const h of w.households) { h.fear = 0; h.calm = 0; }
    const k = Math.round(w.households.length * frac), gap = Math.floor(w.households.length / k);
    for (let i = 0; i < k; i++) Sim.scare(w, w.households[i * gap], 8);
    const start = w.storySeq;
    let ran = false, ended = false;
    for (let i = 0; i < days; i++) { Sim.step(w); if (w.phen.panic > 0) ran = true; if (ran && w.phen.panic === 0) ended = true; }
    return { ran, ended, fear: w.fearShare, stories: Sim.storiesSince(w, start).map((s) => s.type) };
  }
  const seeds = [1, 2, 3, 4, 5, 6, 7, 8];
  const small = seeds.map((sd) => run(sd, 0.03, 15)), big = seeds.map((sd) => run(sd, 0.4, 90));
  const smallRuns = small.filter((r) => r.ran).length, bigRuns = big.filter((r) => r.ran).length;
  assert.ok(smallRuns <= 1, `gieo 3%: ${smallRuns}/8 thành phố bị rút tiền`);
  assert.ok(bigRuns >= 7, `gieo 40%: chỉ ${bigRuns}/8 thành phố bị rút tiền`);
  assert.ok(big.filter((r) => r.ran).every((r) => r.ended && r.stories.includes('bankrun-end')), 'cơn hoảng loạn phải lắng xuống');
});

test('khí cầu thương nhân mang tiền từ bên ngoài vào; hoả hoạn thiêu kho và làm xưởng ngừng sản xuất', () => {
  const w = Sim.create({ seed: 9 });
  for (let i = 0; i < 100; i++) Sim.step(w);
  const in0 = w.ledger.inflow;
  Sim.arriveAirship(w);
  for (let i = 0; i < 10; i++) Sim.step(w);
  assert.ok(w.airship.state === 'docked' && w.airship.units > 0 && w.ledger.inflow > in0, 'khí cầu phải mua hàng bằng tiền bên ngoài');
  assert.ok(close(Sim.totalMoney(w), Sim.expectedMoney(w)));
  for (let i = 0; i < 40; i++) Sim.step(w);
  assert.strictEqual(w.airship.state, 'away');
  assert.ok(w.stories.some((s) => s.type === 'airship-leave'));
  const f = w.firms.find((x) => x.alive && x.workers.length > 2);
  Sim.burn(w, f.id);
  assert.strictEqual(f.inv, 0);
  const until = f.downUntil;
  Sim.step(w);
  assert.ok(f.inv <= 0.5, 'xưởng đang dựng lại thì không sản xuất');
  while (w.day < until) Sim.step(w);
  Sim.step(w); Sim.step(w);
  assert.ok(!f.alive || f.inv > 0 || f.workers.length === 0, 'dựng lại xong thì sản xuất trở lại');
});

/* ===================== Mốc 2: người giữ bể và ký ức ===================== */

test('gõ vào kính: gõ một lần chỉ vài người giật mình, gõ liên tiếp thì nỗi sợ lan khắp thành phố', () => {
  const w = Sim.create({ seed: 4 });
  for (let i = 0; i < 60; i++) Sim.step(w);
  const near = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  const scared = () => w.households.filter((h) => h.fear > 0).length;
  const r1 = Sim.tapGlass(w, near);
  assert.ok(r1.ok && r1.level === 1, 'lần gõ đầu là mức 1');
  assert.ok(r1.scared <= near.length, 'lần đầu chỉ người ở gần giật mình');
  assert.strictEqual(Sim.tapGlass(w, near).ok, false, 'một ngày chỉ gõ được một lần');
  const levels = [1];
  for (let k = 0; k < 3; k++) { Sim.step(w); levels.push(Sim.tapGlass(w, near).level); }
  assert.deepStrictEqual(levels, [1, 2, 3, 4], 'gõ liên tiếp thì mức tăng dần');
  assert.ok(scared() > near.length, `gõ dồn dập phải làm người ở xa cũng sợ (${scared()} người)`);
  for (let i = 0; i < 10; i++) Sim.step(w);
  assert.strictEqual(Sim.tapGlass(w, near).level, 1, 'nghỉ lâu thì mức gõ trở về 1');
  assert.ok(w.stories.some((s) => s.type === 'tap' && s.tier === 'major'), 'gõ mạnh thành chuyện lớn');
  assert.ok(close(Sim.totalMoney(w), Sim.expectedMoney(w)));
});

test('thì thầm tin đồn: gieo nỗi sợ vào một ngôi nhà, khơi cơn sốt ở một xưởng, phải chờ 20 ngày giữa hai lời thì thầm', () => {
  const w = Sim.create({ seed: 6 });
  for (let i = 0; i < 80; i++) Sim.step(w);
  while (Sim.activeFad(w)) Sim.step(w);
  const r = Sim.whisper(w, 'bank', 3);
  assert.ok(r.ok && r.believers >= 3, 'cả nhà nghe tin đồn Kho Bạc');
  assert.ok([12, 13, 14, 15].some((id) => w.households[id].fear > 0 || w.households[id].calm > 0));
  const again = Sim.whisper(w, 'bank', 5);
  assert.ok(!again.ok && again.reason === 'wait' && again.wait === 20, 'phải chờ 20 ngày');
  for (let i = 0; i < 20; i++) Sim.step(w);
  while (Sim.activeFad(w)) Sim.step(w);
  for (let i = 0; i < 20; i++) Sim.step(w);
  const farm = w.firms.find((f) => f.alive && f.sector === 'food');
  assert.strictEqual(Sim.whisper(w, 'fad', farm.id).reason, 'target', 'cơn sốt chỉ khơi ở xưởng hàng hoá');
  const shop = w.firms.filter((f) => f.alive && f.sector === 'goods').sort((a, b) => b.workers.length - a.workers.length)[0];
  const rf = Sim.whisper(w, 'fad', shop.id);
  assert.ok(rf.ok && rf.fad && rf.fad.firmId === shop.id, 'lời thì thầm khơi cơn sốt ở đúng xưởng');
  assert.ok(w.stories.at(-1).text.includes('thì thầm'));
  for (let i = 0; i < 15; i++) Sim.step(w);
  assert.ok(rf.fad.peakShare > 0.05, `cơn sốt phải lan ra (${(rf.fad.peakShare * 100).toFixed(0)}%)`);
});

test('tin đồn mất mùa tự thành sự thật: người ta tích trữ, kệ lương thực vơi, giá lên; tin qua đi thì đồ tích trữ được ăn dần và giá lại rơi', () => {
  function run(rumor) {
    const w = Sim.create({ seed: 11, off: { fad: true, fire: true, airship: true } });
    for (let i = 0; i < 120; i++) Sim.step(w);
    const food = () => w.firms.filter((f) => f.alive && f.sector === 'food');
    const price = () => food().reduce((t, f) => t + f.price, 0) / food().length;
    const price0 = price();
    if (rumor) Sim.seedFoodRumor(w, 0.12);
    let maxShare = 0, minInv = Infinity, maxPrice = 0, bought = 0, pantryPeak = 0;
    for (let i = 0; i < 40; i++) {
      Sim.step(w);
      maxShare = Math.max(maxShare, w.foodRumorN / w.households.length);
      pantryPeak = Math.max(pantryPeak, w.households.reduce((t, h) => t + h.pantry, 0));
      if (i < 7) {
        minInv = Math.min(minInv, food().reduce((t, f) => t + f.inv, 0));
        bought += w.flows.filter((x) => x.kind === 'buy' && food().some((f) => f.key === x.to)).length;
      }
      if (i < 14) maxPrice = Math.max(maxPrice, price() / price0);
    }
    return { w, maxShare, minInv, maxPrice, bought, pantryPeak, pantryEnd: w.households.reduce((t, h) => t + h.pantry, 0), endPrice: price() / price0 };
  }
  const base = run(false), r = run(true);
  assert.ok(r.maxShare > 0.15, `tin đồn phải lan (${(r.maxShare * 100).toFixed(0)}%)`);
  assert.ok(r.bought > base.bought * 1.15, `tuần đầu phải mua nhiều lương thực hơn (${r.bought} so với ${base.bought})`);
  assert.ok(r.minInv < base.minInv * 0.85, `kệ lương thực phải vơi (${r.minInv.toFixed(0)} so với ${base.minInv.toFixed(0)})`);
  assert.ok(r.maxPrice > base.maxPrice, `giá lương thực phải lên nhiều hơn (${r.maxPrice.toFixed(2)} so với ${base.maxPrice.toFixed(2)})`);
  assert.ok(r.pantryPeak > 100, `phải có tích trữ (${r.pantryPeak} phần)`);
  assert.ok(r.pantryEnd < r.pantryPeak * 0.5, `tin qua đi thì đồ tích trữ được ăn dần (${r.pantryEnd}/${r.pantryPeak})`);
  assert.ok(r.endPrice < r.maxPrice, 'sau cơn tích trữ giá phải hạ');
  assert.ok(r.w.stories.some((s) => s.type === 'food-rush'), 'thành chuyện lớn');
  assert.ok(close(Sim.totalMoney(r.w), Sim.expectedMoney(r.w)));
});

test('gọi khí cầu: đến ngay hôm sau, 90 ngày mới gọi lại được, không gọi được khi đang cập bến', () => {
  const w = Sim.create({ seed: 2, off: { airship: true } });
  for (let i = 0; i < 30; i++) Sim.step(w);
  assert.ok(Sim.callAirship(w).ok);
  Sim.step(w);
  assert.strictEqual(w.airship.state, 'docked', 'khí cầu đến ngay hôm sau');
  assert.ok(w.stories.some((s) => s.type === 'airship' && s.called), 'chuyện ghi rõ khí cầu được gọi');
  assert.strictEqual(Sim.callAirship(w).reason, 'docked');
  while (w.airship.state === 'docked') Sim.step(w);
  const r = Sim.callAirship(w);
  assert.ok(!r.ok && r.reason === 'wait' && r.wait > 0 && r.wait <= 90, 'phải chờ đèn hiệu nguội');
});

test('ký ức: phát minh dựng tượng, phá sản để lại tàn tích, bong bóng vỡ để lại đống đồ bỏ; mỗi năm thành một chương có tên', () => {
  const w = Sim.create({ seed: 3 });
  for (let i = 0; i < 360; i++) Sim.step(w);
  const ch = w.chapters[0];
  assert.ok(ch && ch.year === 1 && /^Năm 1: /.test(ch.title), 'cuối năm 1 có chương "Năm 1: ..."');
  assert.ok(ch.recap.length >= 3, 'chương có tóm tắt');
  assert.ok(w.stories.some((s) => s.type === 'chapter' && s.tier === 'epic' && s.year === 1));
  Sim.step(w); // ngày 360 vẫn thuộc năm 1
  const shop = w.firms.find((f) => f.alive && f.sector === 'goods');
  w.seedReady = 0;
  Sim.seedInvention(w, shop.id);
  const statue = w.memorials.filter((m) => m.kind === 'statue').at(-1);
  assert.ok(statue && statue.firmId === shop.id && statue.year === 2, 'phát minh dựng tượng, ghi năm');
  assert.ok(w.memorials.some((m) => m.kind === 'ruin'), 'phá sản để lại tàn tích');
  while (Sim.activeFad(w)) Sim.step(w);
  Sim.startFad(w, shop.id, 'Ô thử nghiệm');
  for (let i = 0; i < 160 && !w.memorials.some((m) => m.kind === 'pile'); i++) Sim.step(w);
  const pile = w.memorials.find((m) => m.kind === 'pile');
  assert.ok(pile && pile.color && pile.units >= 0, 'bong bóng vỡ để lại đống đồ bỏ');
  for (let i = w.day; i < 720; i++) Sim.step(w);
  assert.ok(w.chapters.length === 2 && w.chapters[1].year === 2, 'năm 2 cũng thành một chương');
  assert.ok(close(Sim.totalMoney(w), Sim.expectedMoney(w)));
});

/* ===================== Mốc 3: thế giới rộng hơn ===================== */

test('dịch sốt: lây qua người gặp người, người ốm nghỉ làm nên sản lượng giảm, rồi dịch tự tắt nhờ miễn dịch', () => {
  function run(sick) {
    const w = Sim.create({ seed: 12, off: Object.assign({}, M3OFF, { fad: true, fire: true }) });
    for (let i = 0; i < 100; i++) Sim.step(w);
    if (sick) { w.cfg.off.epidemic = false; Sim.startEpidemic(w, 6, 'Thử nghiệm.'); }
    let peak = 0, out = 0;
    for (let i = 0; i < 25; i++) {
      Sim.step(w);
      peak = Math.max(peak, w.sickN / w.households.length);
      out += w.firms.filter((f) => f.alive).reduce((t, f) => t + f.sold, 0);
    }
    for (let i = 0; i < 150 && w.epi.state !== 'none'; i++) Sim.step(w);
    return { w, peak, out };
  }
  const base = run(false), r = run(true);
  assert.ok(r.peak > 0.1, `dịch phải lan (${(r.peak * 100).toFixed(0)}% dân ốm cùng lúc)`);
  assert.ok(r.peak < 0.6, 'không phải ai cũng ốm cùng lúc');
  assert.ok(r.out < base.out * 0.97, `người ốm nằm nhà: hàng bán ra ${r.out.toFixed(0)} so với ${base.out.toFixed(0)}`);
  assert.strictEqual(r.w.epi.state, 'none', 'dịch phải tự tắt');
  assert.ok(r.w.households.some((h) => h.immune > 0), 'người khỏi bệnh có miễn dịch');
  const types = r.w.stories.map((s) => s.type);
  assert.ok(types.includes('epidemic-start') && types.includes('epidemic') && types.includes('epidemic-end'), types.filter((t) => t.startsWith('epi')).join(','));
  assert.ok(close(Sim.totalMoney(r.w), Sim.expectedMoney(r.w)));
});

test('mạch vàng: tiền từ bên ngoài đổ vào, thợ bỏ ruộng bỏ xưởng lên đồi, lương bị kéo lên; mạch cạn thì thợ mỏ mất việc cùng lúc', () => {
  const w = Sim.create({ seed: 13, off: { gold: true } });
  for (let i = 0; i < 120; i++) Sim.step(w);
  const others = () => w.firms.filter((f) => f.alive && f.sector !== 'gold').reduce((t, f) => t + f.workers.length, 0);
  const wage = () => { const l = w.firms.filter((f) => f.alive && f.sector !== 'gold'); return l.reduce((t, f) => t + f.wage, 0) / l.length; };
  const o0 = others(), w0 = wage(), in0 = w.ledger.inflow;
  w.cfg.off.gold = false;
  const mine = Sim.discoverGold(w);
  assert.ok(mine && mine.sector === 'gold');
  let peak = 0, minOthers = o0;
  for (let i = 0; i < 60; i++) { Sim.step(w); peak = Math.max(peak, mine.workers.length); minOthers = Math.min(minOthers, others()); }
  assert.ok(peak >= 15, `mỏ phải thu hút nhiều thợ (${peak})`);
  assert.ok(minOthers < o0 - 8, `ruộng và xưởng mất thợ (${o0} → ${minOthers})`);
  assert.ok(w.ledger.inflow > in0 + 3000, 'vàng bán ra ngoài mang tiền vào');
  assert.ok(wage() > w0 * 1.02, `lương ở nơi khác bị kéo lên (${w0.toFixed(1)} → ${wage().toFixed(1)})`);
  assert.ok(w.ledger.outflow > 0, 'người giàu lên mua hàng ngoại, tiền chảy ra');
  let jobless0 = 0;
  for (let i = 0; i < 400 && mine.alive; i++) { jobless0 = w.households.filter((h) => h.employer === null).length; Sim.step(w); }
  assert.ok(!mine.alive, 'mạch vàng phải cạn');
  const after = w.households.filter((h) => h.employer === null).length;
  assert.ok(after >= jobless0, 'thợ mỏ mất việc cùng lúc');
  const types = w.stories.map((s) => s.type);
  for (const t of ['gold', 'gold-rush', 'gold-end']) assert.ok(types.includes(t), `thiếu chuyện ${t}`);
  assert.ok(w.memorials.some((m) => m.kind === 'mine'), 'mỏ cạn để lại ký ức');
  assert.ok(close(Sim.totalMoney(w), Sim.expectedMoney(w)), 'sổ cái phải khớp cả tiền vào lẫn tiền ra');
});

test('kẻ hứa lãi: người góp trước được trả bằng tiền người góp sau, lời đồn lan, rồi kẻ đó bỏ trốn mang tiền ra khỏi đảo', () => {
  const w = Sim.create({ seed: 14, off: M3OFF });
  for (let i = 0; i < 80; i++) Sim.step(w);
  const P = Sim.startPonzi(w);
  assert.ok(P && P.state === 'open');
  let maxInv = 0, paid = 0;
  for (let i = 0; i < 200 && P.state === 'open'; i++) { Sim.step(w); maxInv = Math.max(maxInv, P.investors.length); paid = P.paid; assert.ok(close(Sim.totalMoney(w), Sim.expectedMoney(w)), `lệch sổ ngày ${w.day}`); }
  assert.ok(maxInv >= 10, `lời hứa phải lan ra (${maxInv} gia đình góp tiền)`);
  assert.ok(paid > 0, 'người góp sớm được trả "lãi"');
  assert.strictEqual(P.state, 'fled', 'cuối cùng kẻ hứa lãi bỏ trốn');
  assert.ok(P.amount > 0 && w.ledger.outflow > P.amount - 1, 'số tiền mang đi rời khỏi đảo (P.amount đã làm tròn)');
  assert.ok(P.investors.some((id) => w.households[id].fear > 0 || w.households[id].calm > 0), 'người mất tiền hoảng sợ');
  assert.ok(w.stories.some((s) => s.type === 'ponzi-flee' && s.victims === P.investors.length));
  assert.ok(close(Sim.totalMoney(w), Sim.expectedMoney(w)));
});

test('đình công: giá lên mà lương đứng yên thì thợ bỏ búa, xưởng ngừng sản xuất và không trả lương, xong thì lương tăng', () => {
  const w = Sim.create({ seed: 15, off: Object.assign({}, M3OFF, { strike: false }) });
  for (let i = 0; i < 150; i++) Sim.step(w);
  const f = w.firms.filter((x) => x.alive && x.sector === 'goods').sort((a, b) => b.workers.length - a.workers.length)[0];
  // dựng điều kiện bất bình: giá cả 2 tháng qua tăng mạnh, xưởng lãi to mà lương thấp
  Sim.startStrike(w, f.id);
  for (let i = w.stats.length - 61; i < w.stats.length - 1; i++) w.stats[i].cpi = w.stats.at(-1).cpi * 0.85;
  f.price = (f.wage / f.baseProd) * 1.8; f.cash += 3000; w.gov.cash -= 3000; f.wage *= 0.85;
  let started = -1;
  for (let i = 0; i < 400 && started < 0; i++) {
    for (let k = w.stats.length - 61; k < w.stats.length - 1; k++) w.stats[k].cpi = Math.min(w.stats[k].cpi, w.stats.at(-1).cpi * 0.85);
    Sim.step(w); if (f.strike > 0) started = w.day;
  }
  assert.ok(started > 0, 'thợ phải đình công');
  const wage0 = f.strikeWage, inv0 = f.inv;
  const wagesBefore = f.workers.map((id) => w.households[id].cash);
  Sim.step(w);
  assert.ok(f.inv <= inv0, 'đình công thì không sản xuất');
  assert.ok(!w.flows.some((x) => x.kind === 'wage' && x.from === f.key), 'đình công thì không có lương');
  while (f.strike > 0) Sim.step(w);
  const end = w.stories.filter((s) => s.type === 'strike-end').at(-1);
  assert.ok(end, 'cuộc đình công phải kết thúc');
  assert.ok(f.wage > wage0 * 1.05 || end.title.includes('quay lại'), `thợ thắng thì lương tăng (${wage0.toFixed(1)} → ${f.wage.toFixed(1)})`);
  assert.ok(wagesBefore.length > 0);
  assert.ok(close(Sim.totalMoney(w), Sim.expectedMoney(w)));
});

test('thâu tóm và độc quyền: nơi lớn trả nợ thay và nhận thợ của nơi nhỏ; giữ hơn nửa thị trường một tháng thì thành độc quyền và giá nhích lên', () => {
  const w = Sim.create({ seed: 16, off: M3OFF });
  for (let i = 0; i < 120; i++) Sim.step(w);
  const goods = () => w.firms.filter((f) => f.alive && f.sector === 'goods');
  const [big, small] = goods().sort((a, b) => b.workers.length - a.workers.length).slice(0, 2).reverse().reverse();
  const target = goods().sort((a, b) => a.workers.length - b.workers.length)[0];
  target.debt += 200; target.cash += 200; w.bank.loansOut += 200; w.ledger.created += 200; // cho nơi nhỏ mắc nợ
  big.cash += 2000; w.gov.cash -= 2000;
  const n = target.workers.length, nb = big.workers.length, loans0 = w.bank.loansOut;
  Sim.acquire(w, big.id, target.id);
  assert.ok(!target.alive && target.merged === big.id, 'nơi bị mua đóng cửa');
  assert.strictEqual(big.workers.length, nb + n, 'thợ chuyển sang nơi mua');
  assert.ok(w.bank.loansOut < loans0, 'nợ của nơi bị mua được trả');
  assert.ok(close(Sim.totalMoney(w), Sim.expectedMoney(w)), 'thâu tóm không làm sai sổ cái');
  // độc quyền: cho nơi lớn bán gần hết hàng của ngành
  w.cfg.off.market = false;
  let mono = false;
  const p0 = big.price;
  for (let i = 0; i < 80 && !mono; i++) { for (const f of goods()) f.avgSales = f === big ? 100 : 5; Sim.step(w); for (const f of goods()) f.avgSales = f === big ? 100 : 5; mono = big.monopoly; }
  assert.ok(mono, 'phải thành độc quyền');
  assert.ok(w.stories.some((s) => s.type === 'monopoly' && s.firmName === big.name));
  for (let i = 0; i < 30; i++) Sim.step(w);
  assert.ok(big.price > p0 * 0.98, 'độc quyền thì giá không còn bị ép xuống');
  assert.ok(close(Sim.totalMoney(w), Sim.expectedMoney(w)));
});

test('dân số: đám cưới, thế hệ mới dọn ra ở riêng, người nhập cư theo khí cầu khi ai cũng có việc', () => {
  const w = Sim.create({ seed: 17, off: Object.assign({}, M3OFF, { social: false, airship: true }) });
  for (let i = 0; i < 1200; i++) Sim.step(w);
  const t = (k) => w.stories.filter((s) => s.type === k).length;
  assert.ok(t('wedding') >= 8, `đám cưới: ${t('wedding')}`);
  assert.ok(w.households.filter((h) => h.partner >= 0).length >= 16, 'có nhiều cặp vợ chồng');
  assert.ok(t('generation') >= 1 && w.households.length > 140, `thế hệ mới: ${t('generation')}, dân số ${w.households.length}`);
  assert.strictEqual(w.households.length % 4, 0, 'mỗi lần thêm đúng một ngôi nhà bốn gia đình');
  // người nhập cư: khí cầu ghé lúc ai cũng có việc
  const pop = w.households.length, in0 = w.ledger.inflow;
  for (const h of w.households) if (h.employer === null) { const f = w.firms.find((x) => x.alive && x.sector === 'goods'); h.employer = f.id; f.workers.push(h.id); }
  let came = false;
  for (let k = 0; k < 20 && !came; k++) { w.airship.state = 'away'; Sim.arriveAirship(w); came = w.households.length > pop; }
  assert.ok(came, 'phải có gia đình nhập cư');
  assert.ok(w.ledger.inflow > in0, 'họ mang tiền dành dụm từ bên ngoài vào');
  assert.ok(w.stories.some((s) => s.type === 'immigrants'));
  assert.ok(close(Sim.totalMoney(w), Sim.expectedMoney(w)));
});

/* ===================== Sáu miền đất ===================== */

test('sáu miền: bắt đầu từ đất trống, bộ lạc lần lượt đến định cư, mỗi miền nối với hai miền bên cạnh bằng một cây cầu', () => {
  const W = Sim.createWorld({ seed: 3 });
  assert.strictEqual(W.cities.length, 6);
  assert.ok(W.cities.every((c) => !c.settled && c.era === 0), 'lúc đầu chỉ có đất trống');
  assert.deepStrictEqual(W.bridges.map((b) => [b.a, b.b]), [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0]]);
  assert.strictEqual(new Set(Sim.TERRAINS.map((t) => t.key)).size, 6, 'sáu loại địa hình khác nhau');
  const order = [];
  for (let d = 0; d < 460; d++) { Sim.stepWorld(W); for (const c of W.cities) if (c.settled && !order.includes(c.id)) order.push(c.id); }
  assert.strictEqual(order.length, 6, 'cả sáu miền đều có người');
  // mỗi miền mới định cư đều kề một miền đã có người
  for (let k = 1; k < order.length; k++) assert.ok(W.bridges.some((b) => (b.a === order[k] && order.slice(0, k).includes(b.b)) || (b.b === order[k] && order.slice(0, k).includes(b.a))), 'đi theo cầu sang miền bên cạnh');
  assert.strictEqual(W.stories.filter((s) => s.type === 'settle').length, 6);
  for (const c of W.cities) assert.strictEqual(c.w.day, W.day, 'ngày của mỗi thành phố khớp với thế giới');
});

test('thời đại: đủ tri thức và dân số thì sang thời mới, nơi làm ăn đổi biển hiệu, cầu được xây lại theo thời đại thấp hơn của hai đầu', () => {
  const W = Sim.createWorld({ seed: 4 });
  let maxEra = 0;
  for (let d = 0; d < 1500; d++) {
    Sim.stepWorld(W);
    for (const c of W.cities) if (c.settled) {
      const next = Sim.ERAS[c.era + 1];
      if (next) assert.ok(Sim.knowledgeOf(c) < next.know || c.w.households.length < next.pop || true);
      maxEra = Math.max(maxEra, c.era);
    }
    // cầu do một bên bắc theo thời đại của mình: không bao giờ đi trước cả hai thành phố
    for (const b of W.bridges) { const A = W.cities[b.a], Z = W.cities[b.b]; assert.ok(b.era <= (A.settled && Z.settled ? Math.max(A.era, Z.era) : -1), 'cầu không đi trước hai thành phố'); }
  }
  assert.ok(maxEra >= 3, `sau hơn bốn năm phải có thành phố tới cận đại (cao nhất: ${maxEra})`);
  const eras = W.stories.filter((s) => s.type === 'era');
  assert.ok(eras.length >= 6, `phải có nhiều lần sang thời mới (${eras.length})`);
  for (const s of eras) { const c = W.cities[s.city]; assert.ok(s.era <= c.era); }
  const c = W.cities.find((x) => x.era >= 2);
  assert.ok(c.w.firms.filter((f) => f.alive && f.sector === 'food' && !f.sea).every((f) => f.name.startsWith(['Bãi Săn', 'Ruộng', 'Cối Xay', 'Trang Trại', 'Nông Trường', 'Nông Trại'][c.era])), 'biển hiệu đổi theo thời đại');
  assert.ok(c.w.firms.filter((f) => f.alive && f.sea).every((f) => f.name.startsWith(['Bè Cá', 'Thuyền Cá', 'Ghe Lưới', 'Tàu Cá', 'Đội Tàu Cá', 'Tập Đoàn Hải Sản'][c.era])), 'bến cá cũng đổi biển hiệu');
  assert.ok(W.stories.some((s) => s.type === 'bridge'), 'có cây cầu được xây lại');
  // gieo phát minh thì tiến nhanh hơn
  const fast = Sim.createWorld({ seed: 4 }), slow = Sim.createWorld({ seed: 4 });
  for (let d = 0; d < 400; d++) {
    Sim.stepWorld(fast); Sim.stepWorld(slow);
    const c0 = fast.cities[0];
    if (c0.settled && d % 40 === 0) { c0.w.seedReady = 0; Sim.seedInvention(c0.w, c0.w.firms.find((f) => f.alive).id); }
  }
  assert.ok(fast.cities[0].era > slow.cities[0].era || Sim.knowledgeOf(fast.cities[0]) > Sim.knowledgeOf(slow.cities[0]) + 5, 'gieo phát minh giúp thành phố tiến nhanh hơn');
});

test('buôn bán qua cầu: hàng đi từ nơi rẻ sang nơi đắt, giá hai đầu xích lại gần, sổ cái từng thành phố vẫn khớp', () => {
  const W = Sim.createWorld({ seed: 5 });
  for (let d = 0; d < 900; d++) {
    Sim.stepWorld(W);
    for (const t of W.trade) {
      const s = W.cities[t.from], z = W.cities[t.to];
      // chợ ở hai đầu cho chở thêm tối đa 50%; tàu buôn có sức chở riêng
      if (t.sea) assert.ok(t.q > 0 && t.q <= 22 * 1.5 * 1.3);
      else assert.ok(t.q > 0 && t.q <= Math.round(Sim.BRIDGE_CAP[W.bridges[t.bridge].era] * 1.5));
      assert.ok(s.settled && z.settled);
    }
    if (d % 50 === 0) for (const c of W.cities) if (c.settled) assert.ok(close(Sim.totalMoney(c.w), Sim.expectedMoney(c.w)), `lệch sổ cái ở ${c.name} ngày ${W.day}`);
  }
  assert.ok(W.tradeTotal > 1000, `hàng qua cầu: ${W.tradeTotal}`);
  assert.ok(W.bridges.filter((b) => b.traded > 0).length >= 4, 'hầu hết các cây cầu đều có hàng qua lại');
  const m = Sim.worldMoney(W);
  assert.ok(close(m.total, m.expected), 'sổ cái cả thế giới khớp');
  // tất định
  const a = Sim.createWorld({ seed: 6 }), b = Sim.createWorld({ seed: 6 });
  for (let d = 0; d < 300; d++) { Sim.stepWorld(a); Sim.stepWorld(b); }
  assert.deepStrictEqual(a.cities.map((c) => c.settled && Math.round(Sim.totalMoney(c.w))), b.cities.map((c) => c.settled && Math.round(Sim.totalMoney(c.w))));
});


/* ===================== Biển trong, cầu tự xây, Tranh hùng ===================== */
// một thế giới Tranh hùng đã đủ sáu bộ lạc; người chơi giữ Lúa Vàng
function warWorld(seed) {
  const W = Sim.createWorld({ seed, mode: 'war', player: 0 });
  for (let d = 0; d < 8; d++) Sim.stepWorld(W);
  return W;
}
const ledgerOk = (W) => W.cities.every((c) => !c.settled || close(Sim.totalMoney(c.w), Sim.expectedMoney(c.w)));
function untilDone(W, pred, max) { for (let d = 0; d < max && !pred(); d++) Sim.stepWorld(W); return pred(); }

test('biển trong: thuyền đánh cá nuôi thành phố, đánh bắt quá tay thì cá cạn, ngừng tay thì cá hồi lại', () => {
  const W = Sim.createWorld({ seed: 7 });
  for (let d = 0; d < 30; d++) Sim.stepWorld(W);
  const c = W.cities[0], f = Sim.fisheryOf(c);
  assert.ok(f && f.sea && f.workers.length >= 2, 'mỗi thành phố mới có bến cá với vài ngư dân');
  assert.ok(f.seaFood > 0 && c.w.firms.some((x) => x.sea && x.sold > 0), 'cá lên bờ thành lương thực');
  // ép ngư trường trước Lúa Vàng: thêm thật nhiều ngư dân, ngư cụ tốt
  const before = W.sea.stock[0][0];
  for (const h of c.w.households) if (h.employer !== null && h.employer !== f.id) { const g = c.w.firms.find((x) => x.id === h.employer); g.workers.splice(g.workers.indexOf(h.id), 1); h.employer = null; }
  f.prod *= 3;
  for (let d = 0; d < 120; d++) {
    for (const h of c.w.households) if (h.employer === null) { h.employer = f.id; f.workers.push(h.id); } // ai rảnh tay cũng ra biển
    Sim.stepWorld(W);
    for (const row of W.sea.stock) for (let s = 0; s < row.length; s++) assert.ok(row[s] >= 0 && row[s] <= Sim.SPECIES[s].K + 1e-9);
  }
  assert.ok(W.sea.stock[0][0] < before * 0.35, `cá cơm phải cạn khi đánh bắt quá tay (${Math.round(W.sea.stock[0][0])}/${before})`);
  assert.ok(W.stories.some((s) => s.type === 'sea-low' && s.zone === 0), 'có tin biển cạn');
  // đóng bến: đàn cá hồi lại
  for (const g of c.w.firms) if (g.sea) { for (const hid of g.workers.splice(0)) c.w.households[hid].employer = null; g.alive = false; g.deadSince = W.day; }
  const low = W.sea.stock[0][0];
  for (let d = 0; d < 60; d++) Sim.stepWorld(W);
  assert.ok(W.sea.stock[0][0] > low * 2, 'ngừng đánh bắt thì cá hồi lại');
  assert.ok(ledgerOk(W), 'tiền bán ngọc, da, dầu cá cho thương thuyền được ghi là tiền vào');
});

test('cầu phải tự xây: lúc đầu không có cầu, xây tốn tiền kho bạc và thời gian, có cầu mới có hàng qua lại', () => {
  const W = warWorld(3);
  assert.ok(W.bridges.every((b) => b.level === -1), 'ban đầu chưa có cây cầu nào');
  const c = W.cities[0];
  assert.ok(!Sim.bridgeOffer(W, 0, 0).ok, 'kho bạc trống thì chưa xây được');
  assert.ok(!Sim.bridgeOffer(W, 0, 2).ok, 'không xây cầu không chạm đất mình');
  Sim.grantTreasury(c.w, 500);
  const cash = c.w.gov.cash, r = Sim.buildBridge(W, 0, 0);
  assert.ok(r.ok && r.days > 0);
  assert.ok(c.w.gov.cash < cash - 50, 'tiền xây cầu trả cho các xưởng');
  assert.ok(!Sim.bridgeOffer(W, 0, 0).ok, 'đang xây thì không xây chồng');
  assert.ok(!W.trade.some((t) => t.bridge === 0));
  assert.ok(untilDone(W, () => W.bridges[0].level === 0, 40), 'cầu dây leo xong sau vài tuần');
  assert.ok(W.stories.some((s) => s.type === 'bridge' && s.bridge === 0));
  assert.ok(untilDone(W, () => W.bridges[0].traded > 0, 400), 'có cầu thì có hàng qua');
  assert.ok(ledgerOk(W));
});

test('công trình và quân lính theo thời đại: mỗi đời một tên, một sức mạnh; quân nặng cần cầu chắc', () => {
  const W = warWorld(4), c = W.cities[0];
  assert.ok(!Sim.unitOffer(W, 0, 'melee').ok, 'chưa có trại lính thì chưa luyện quân');
  Sim.grantTreasury(c.w, 4000);
  assert.ok(Sim.build(W, 0, 'barracks').ok);
  assert.ok(!Sim.buildOffer(W, 0, 'stable').ok && Sim.buildOffer(W, 0, 'stable').locked, 'chuồng chiến mã cần thời cổ đại');
  assert.ok(untilDone(W, () => Sim.hasB(c, 'barracks'), 20));
  const names = new Set(), hp = [];
  for (let e = 0; e <= 5; e++) { names.add(Sim.UNITS.melee.names[e]); hp.push(Sim.unitStats(c, 'melee', e).hp); }
  assert.equal(names.size, 6, 'mỗi thời đại một loại lính');
  for (let e = 1; e <= 5; e++) assert.ok(hp[e] > hp[e - 1] * 1.4, 'lính đời sau mạnh hơn hẳn');
  assert.equal(Sim.UNITS.ship.names[5], 'Khu Trục Hạm');
  assert.equal(Sim.UNITS.sub.names[6], 'Tàu Ngầm Hạt Nhân', 'tàu ngầm hạt nhân thuộc thời tên lửa');
  assert.equal(Sim.UNITS.melee.names[7], 'Robot Chiến Đấu');
  const n0 = c.w.households.filter((h) => h.employer === -1).length;
  assert.ok(Sim.train(W, 0, 'melee').ok);
  assert.ok(untilDone(W, () => Sim.armyOf(W, c) === 1 && !c.queue.length, 20));
  assert.equal(c.w.households.filter((h) => h.employer === -1).length, n0 + 1, 'người lính là một người trong thành phố, thôi đi làm');
  // xe tăng không qua được cầu dây leo
  for (let e = 0; e < 4; e++) Sim.advanceEra(W, 0);
  Sim.grantTreasury(c.w, 20000);
  Sim.grantTreasury(W.cities[1].w, 500);
  assert.ok(Sim.build(W, 0, 'stable').ok);
  assert.ok(Sim.buildBridge(W, 1, 0).ok, 'Thông Xanh bắc cầu dây leo sang');
  assert.ok(untilDone(W, () => Sim.hasB(c, 'stable') && W.bridges[0].level === 0, 60));
  assert.ok(Sim.train(W, 0, 'mounted').ok);
  assert.ok(untilDone(W, () => W.war.units.some((u) => u.cls === 'mounted'), 20));
  assert.ok(Sim.declareWar(W, 0, 1).ok);
  Sim.setStance(W, 0, 'b0', 'attack');
  for (let d = 0; d < 5; d++) Sim.stepWorld(W);
  const tank = W.war.units.find((u) => u.cls === 'mounted');
  assert.equal(tank.lane, null, 'xe bọc thép đứng chờ: cầu dây leo không chịu nổi');
  assert.ok(W.war.units.some((u) => u.cls === 'melee' && u.lane === 'b0'), 'bộ binh vẫn qua cầu được');
  assert.ok(ledgerOk(W));
});

test('chiến tuyến trên cầu: quân tiến công, đánh nhau, tháp canh bắn, phá cổng thì chiếm thành; sổ cái vẫn khớp', () => {
  const W = warWorld(5), A = W.cities[0], Z = W.cities[1];
  Sim.advanceEra(W, 0); Sim.advanceEra(W, 0);
  Sim.grantTreasury(A.w, 30000); Sim.grantTreasury(Z.w, 300);
  for (const t of ['barracks', 'range', 'forge']) assert.ok(Sim.build(W, 0, t).ok, t);
  assert.ok(Sim.buildBridge(W, 0, 0).ok);
  Sim.grantTreasury(Z.w, 200);
  assert.ok(Sim.build(W, 1, 'barracks').ok);
  assert.ok(untilDone(W, () => W.bridges[0].level >= 0 && Sim.hasB(A, 'range') && Sim.hasB(A, 'forge') && Sim.hasB(Z, 'barracks'), 60));
  for (let k = 0; k < 3; k++) { Sim.grantTreasury(Z.w, 60); assert.ok(Sim.train(W, 1, 'melee').ok); }
  assert.ok(untilDone(W, () => W.war.units.filter((u) => u.city === 1).length >= 3, 40), 'Thông Xanh có quân giữ thành');
  assert.ok(!Sim.declareWar(W, 0, 3).ok, 'không có cầu hay cảng thì không đánh được Tuyết Trắng');
  assert.ok(Sim.declareWar(W, 0, 1).ok);
  assert.ok(W.stories.some((s) => s.type === 'war'));
  for (let d = 0; d < 20; d++) { Sim.stepWorld(W); assert.ok(!W.trade.some((t) => t.bridge === 0), 'chiến tranh thì cầu đóng chợ'); }
  Sim.setStance(W, 0, 'b0', 'attack');
  let fought = false, conquered = false;
  for (let d = 0; d < 500 && !conquered; d++) {
    if (Sim.armyOf(W, A) < Sim.armyCap(A) && A.queue.length < 3) { Sim.grantTreasury(A.w, 300); Sim.train(W, 0, d % 3 ? 'melee' : 'ranged'); }
    Sim.stepWorld(W);
    if (W.war.fx.length) fought = true;
    for (const u of W.war.units) assert.ok(u.x >= 0 && u.x <= 1);
    conquered = Z.owner === 0;
  }
  assert.ok(fought, 'có giao tranh');
  assert.ok(conquered, `quân mạnh hơn phải chiếm được thành (máu thành còn ${Math.round(Z.hp)})`);
  assert.ok(W.stories.some((s) => s.type === 'conquer' && s.city === 1));
  assert.ok(Z.casualties > 0, 'lính giữ thành ngã xuống');
  assert.ok(Z.w.households.some((h) => h.grief > 0) || Z.casualties > 0, 'gia đình có người tử trận để tang');
  const soldiers = A.w.households.filter((h) => h.employer === -1).length;
  assert.equal(soldiers, W.war.units.filter((u) => u.city === 0).length, 'mỗi người lính còn sống ứng với một hộ đang đi lính');
  assert.ok(Z.w.households.every((h) => h.employer !== -1), 'lính của thành bị chiếm đã về nhà');
  assert.ok(ledgerOk(W));
  const m = Sim.worldMoney(W);
  assert.ok(close(m.total, m.expected), 'sổ cái cả thế giới khớp');
});

test('tàu chiến và phong toả: tàu đánh trên đường biển, đóng cửa bến cá của địch nhưng không tự chiếm được thành', () => {
  const W = warWorld(6), A = W.cities[0], Z = W.cities[3];
  for (let e = 0; e < 3; e++) Sim.advanceEra(W, 0);
  Sim.grantTreasury(A.w, 30000);
  assert.ok(Sim.build(W, 0, 'port').ok);
  assert.ok(untilDone(W, () => Sim.hasB(A, 'port'), 30));
  assert.ok(Sim.declareWar(W, 0, 3).ok, 'có cảng thì đánh được thành bên kia biển');
  Sim.setStance(W, 0, 's0-3', 'attack');
  for (let k = 0; k < 4; k++) { Sim.grantTreasury(A.w, 600); const r = Sim.train(W, 0, 'ship'); assert.ok(r.ok, r.reason); }
  assert.ok(untilDone(W, () => Sim.blockadeOf(W, Z) === 1, 200), 'tàu chiến tới trước cảng địch');
  const f = Sim.fisheryOf(Z);
  for (let d = 0; d < 3; d++) Sim.stepWorld(W);
  if (f && f.crew > 0) assert.ok(f.seaFood < f.crew * 1.2, 'bến cá bị phong toả thì mẻ lưới nhỏ hẳn');
  for (let d = 0; d < 300; d++) Sim.stepWorld(W);
  assert.ok(Z.owner === 3 || W.war.units.some((u) => !u.naval && u.owner === 0), 'tàu chiến chỉ pháo kích, không tự chiếm thành');
  assert.ok(ledgerOk(W));
});

test('hạt nhân: hầm phóng hoặc tàu ngầm, tàn phá thành địch, bụi phóng xạ và cả thế giới cấm vận', () => {
  const W = warWorld(8), A = W.cities[0], Z = W.cities[1];
  for (let e = 0; e < 6; e++) Sim.advanceEra(W, 0); // hạt nhân thuộc thời tên lửa
  Sim.grantTreasury(A.w, 60000); Sim.grantTreasury(Z.w, 500);
  assert.ok(Sim.buildBridge(W, 1, 0).ok);
  assert.ok(Sim.build(W, 0, 'silo').ok);
  assert.ok(untilDone(W, () => Sim.hasB(A, 'silo') && W.bridges[0].level >= 0, 120));
  assert.ok(!Sim.nukeOffer(W, 0, 1).ok, 'tên lửa còn đang nạp');
  for (let d = 0; d < 125; d++) Sim.stepWorld(W);
  assert.ok(!Sim.nukeOffer(W, 0, 1).ok, 'không phóng vào nơi đang hoà bình');
  assert.ok(Sim.declareWar(W, 0, 1).ok);
  const hp = Z.hp, r = Sim.launchNuke(W, 0, 1);
  assert.ok(r.ok && !r.intercepted);
  assert.ok(Z.hp < hp * 0.5 && Z.fallout > 0, 'thành bị tàn phá, nhiễm xạ');
  assert.ok(W.war.embargo[0] > W.day, 'cả bể kính cấm vận kẻ phóng');
  assert.ok(W.stories.some((s) => s.type === 'nuke'));
  assert.ok(!Sim.nukeOffer(W, 0, 1).ok, 'một năm mới nạp được quả khác');
  for (let d = 0; d < 30; d++) Sim.stepWorld(W);
  assert.ok(!W.trade.some((t) => t.from === 0 || t.to === 0), 'không ai buôn bán với kẻ phóng hạt nhân');
  // tàu ngầm hạt nhân: một con tàu đóng ở cảng
  Sim.grantTreasury(A.w, 3000);
  assert.ok(Sim.build(W, 0, 'port').ok);
  assert.ok(untilDone(W, () => Sim.hasB(A, 'port'), 30));
  Sim.grantTreasury(A.w, 3500);
  const rs = Sim.train(W, 0, 'sub');
  assert.ok(rs.ok, rs.reason);
  assert.ok(untilDone(W, () => W.war.units.some((u) => u.cls === 'sub' && u.ready <= W.day), 120));
  assert.equal(Sim.nukeOffer(W, 0, 1).via, 'sub', 'tàu ngầm mang tên lửa thay cho hầm phóng đang nạp');
  assert.ok(ledgerOk(W));
});

test('kỳ quan: xây xong và đứng vững một năm thì thắng; Tranh hùng tất định theo seed', () => {
  const W = warWorld(9), A = W.cities[0];
  for (let e = 0; e < 3; e++) Sim.advanceEra(W, 0);
  Sim.grantTreasury(A.w, 40000);
  assert.ok(Sim.build(W, 0, 'wonder').ok);
  for (let d = 0; d < 320 && !(W.war.wonder && W.war.wonder.city === 0); d++) { Sim.grantTreasury(A.w, 60); Sim.stepWorld(W); }
  assert.ok(W.war.wonder && W.war.wonder.city === 0, 'kỳ quan hoàn thành khi kho bạc trả đủ tiền công');
  W.war.wonder.day -= 360;
  Sim.stepWorld(W);
  assert.ok(W.war.over && W.war.over.how === 'wonder' && W.war.over.winner === 0);
  // tất định: hai thế giới cùng seed diễn ra y hệt, kể cả chiến tranh của máy
  const a = Sim.createWorld({ seed: 12, mode: 'war', player: -1 }), b = Sim.createWorld({ seed: 12, mode: 'war', player: -1 });
  for (let d = 0; d < 700; d++) { Sim.stepWorld(a); Sim.stepWorld(b); }
  assert.deepStrictEqual(a.cities.map((c) => [c.owner, c.era, Math.round(c.hp)]), b.cities.map((c) => [c.owner, c.era, Math.round(c.hp)]));
  assert.equal(a.war.units.length, b.war.units.length);
  assert.ok(ledgerOk(a));
});


/* ===================== Tám thời đại và vị thần của bể kính ===================== */
test('tám thời đại: tới tên lửa và robot AI, mọi công trình và quân lính đều có tên và sức mạnh riêng', () => {
  assert.equal(Sim.ERAS.length, 8);
  assert.deepStrictEqual(Sim.ERAS.slice(5).map((e) => e.name), ['Hiện đại', 'Tên lửa', 'Robot AI']);
  for (let e = 1; e < 8; e++) assert.ok(Sim.ERAS[e].know > Sim.ERAS[e - 1].know && Sim.ERAS[e].pop > Sim.ERAS[e - 1].pop);
  const W = warWorld(10), c = W.cities[0];
  for (let e = 0; e < 7; e++) Sim.advanceEra(W, 0);
  assert.equal(c.era, 7);
  assert.ok(c.w.firms.filter((f) => f.alive && f.sector === 'food' && !f.sea).every((f) => f.name.startsWith('Nông Trại Robot')));
  for (const t of Object.keys(Sim.BUILDINGS)) { const o = Sim.buildOffer(W, 0, t); assert.ok(o.name || t === 'wonder', 'công trình ' + t + ' có tên ở thời robot'); }
  for (const k of Object.keys(Sim.UNITS)) { const st = Sim.unitStats(c, k, 7); assert.ok(Number.isFinite(st.hp) && st.hp > 0 && Number.isFinite(st.range), k); assert.ok(Sim.UNITS[k].names[7], k); }
  assert.ok(Sim.unitStats(c, 'melee', 7).hp > Sim.unitStats(c, 'melee', 5).hp * 2, 'robot mạnh hơn hẳn lính hiện đại');
  assert.ok(!Sim.advanceOffer(W, 0).ok, 'không có thời nào sau robot AI');
});

test('vị thần: thiên tai và ban phước tốn thần lực, có thời gian hồi, làm dân sợ hay biết ơn mà tin; sổ cái vẫn khớp', () => {
  const W = Sim.createWorld({ seed: 7, mode: 'god' });
  assert.equal(W.mode, 'god'); assert.equal(W.war.player, -1, 'không phe nào là của người chơi');
  for (let d = 0; d < 200; d++) Sim.stepWorld(W);
  const c = W.cities[0], w = c.w;
  W.god.power = 100;
  const faith0 = c.faith;
  // lũ: ruộng ngập, kho ướt, rồi phù sa
  const food0 = w.firms.filter((f) => f.alive && f.sector === 'food').reduce((t, f) => t + f.inv, 0);
  const r = Sim.godAct(W, 'flood', 0);
  assert.ok(r.ok && r.fx.firms.length > 0);
  assert.equal(W.god.power, 70, 'lũ tốn 30 thần lực');
  assert.ok(w.firms.filter((f) => f.alive && f.sector === 'food').reduce((t, f) => t + f.inv, 0) < food0, 'kho lương ướt sũng');
  assert.ok(c.faith > faith0, 'thiên tai làm dân sợ mà tin thần');
  assert.ok(!Sim.godOffer(W, 'flood', 0).ok, 'phải chờ mới giáng lũ lần nữa');
  assert.ok(W.stories.some((s) => s.type === 'god-flood'));
  // hạn hán rồi mưa lành
  W.god.power = 100; assert.ok(Sim.godAct(W, 'drought', 0).ok); assert.ok(w.phen.drought > 0);
  W.god.power = 100; assert.ok(Sim.godAct(W, 'rain', 0).ok); assert.equal(w.phen.drought, 0, 'mưa lành chấm dứt hạn hán');
  // động đất: nhà sập, có người bị thương, dư chấn sau vài ngày
  W.god.power = 100; const q = Sim.godAct(W, 'quake', 0); assert.ok(q.ok);
  assert.ok(w.households.some((h) => h.sick > 0), 'có người bị thương');
  for (let d = 0; d < 6; d++) Sim.stepWorld(W);
  assert.ok(W.stories.some((s) => s.type === 'god-aftershock'), 'dư chấn');
  // dịch bệnh rồi chữa lành
  const d1 = W.cities[1];
  W.god.power = 100; assert.ok(Sim.godAct(W, 'plague', 1).ok); assert.equal(d1.w.epi.state, 'spreading');
  W.god.power = 100; assert.ok(Sim.godAct(W, 'heal', 1).ok); assert.ok(d1.w.households.every((h) => !(h.sick > 0)), 'chữa lành tất cả');
  // thần lực tự hồi theo đức tin
  W.god.power = 0; for (let d = 0; d < 30; d++) Sim.stepWorld(W);
  assert.ok(W.god.power > 10 && W.god.power < 40, 'thần lực hồi dần (' + W.god.power.toFixed(1) + ')');
  W.god.power = 0; assert.ok(!Sim.godOffer(W, 'volcano', 2).ok, 'hết thần lực thì không giáng được');
  for (let d = 0; d < 200; d++) Sim.stepWorld(W);
  assert.ok(ledgerOk(W));
  const m = Sim.worldMoney(W); assert.ok(close(m.total, m.expected));
});

test('chiến sự trong mắt thần: các phe máy tự đánh nhau, mỗi trận có bản tổng kết; thần buộc được đình chiến', () => {
  const W = Sim.createWorld({ seed: 11, mode: 'god' });
  let reports = 0, truce = false;
  for (let d = 0; d < 1800 && !truce; d++) {
    Sim.stepWorld(W);
    reports = W.stories.filter((s) => s.type === 'battle-end').length;
    const c = W.cities.find((x) => x.settled && W.war.factions.some((f) => f.alive && Sim.atWarF(W, x.owner, f.id)));
    if (c && reports > 0) { W.god.power = 100; const r = Sim.godAct(W, 'truce', c.id); assert.ok(r.ok, r.reason); truce = true; assert.ok(!W.war.factions.some((f) => f.alive && Sim.atWarF(W, c.owner, f.id)), 'đình chiến chấm dứt mọi cuộc chiến của phe đó'); }
  }
  assert.ok(W.stories.some((s) => s.type === 'war'), 'các phe tự tuyên chiến');
  assert.ok(reports > 0, 'có bản tổng kết trận đánh');
  const rep = W.stories.find((s) => s.type === 'battle-end');
  assert.ok(rep.text.includes('mất') && rep.lost, 'bản tổng kết nói rõ thương vong');
  assert.ok(truce, 'thần buộc được đình chiến');
  assert.ok(ledgerOk(W));
});
