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
    const a = Sim.create({ seed: 4 }), b = Sim.create({ seed: 4 });
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
  for (const t of ['invention', 'fad', 'airship', 'bankrupt', 'job', 'layoff']) assert.ok(types.has(t), `thiếu loại chuyện ${t}`);
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
  const w = Sim.create({ seed: 5 });
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
