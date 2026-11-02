/* Bể Kính Kinh Tế — lõi mô phỏng. Tất định theo seed, không phụ thuộc DOM.
 * Bất biến sổ cái: tổng tiền mọi tác nhân = M0 + tiền in + tiền tạo bởi cho vay − tiền huỷ khi trả gốc. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.Sim = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function makeRng(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const DEFAULTS = {
    seed: 42,
    households: 140,
    foodFirms: 6,
    goodsFirms: 7,
    householdCash: 60,
    firmCash: 400,
    wage: 10,
    minWage: 6,
    taxRate: 0.1,
    interestRate: 0.05, // năm, lãi suất chính sách
    riskSpread: 0.06,   // biên lãi rủi ro ngân hàng cộng thêm khi cho doanh nghiệp vay
    foodProd: 3.4,
    goodsProd: 2.3,
    maxFood: 9,
    maxGoods: 11,
    minFood: 4,
    minGoods: 5,
    maxFlows: 700,
    off: {},            // tắt từng cơ chế để chẩn đoán hoặc cô lập thí nghiệm: { invent, fear, fad, airship, fire, foodRumor, gold, epidemic, ponzi, strike, market, social }
    era: 3,             // thời đại: 0 nguyên thủy, 1 cổ đại, 2 trung đại, 3 cận đại, 4 công nghiệp, 5 hiện đại (một thành phố lẻ mặc định ở cận đại)
    inventRate: 1 / 150,
    growth: 1,          // hệ số sinh nở
    govKeep: 300,       // kho bạc giữ lại tối đa chừng này, phần dư chia cho dân
  };

  /* Thời đại và miền đất: dùng chung cho thế giới sáu thành phố */
  const ERAS = [
    { key: 'primitive', name: 'Nguyên thủy', know: 0, pop: 0, bank: 'Kho Chung', hall: 'Lều Tù Trưởng', fest: 'Lễ hội lửa trại', tech: '' },
    { key: 'ancient', name: 'Cổ đại', know: 3, pop: 36, bank: 'Kho Đền', hall: 'Cung Đất Nung', fest: 'Lễ hội mùa gặt', tech: 'cách nung gạch và làm gốm' },
    { key: 'medieval', name: 'Trung đại', know: 7, pop: 48, bank: 'Nhà Đổi Tiền', hall: 'Thành Đá', fest: 'Lễ hội đèn lồng', tech: 'cách rèn sắt và dựng cối xay gió' },
    { key: 'early', name: 'Cận đại', know: 12, pop: 60, bank: 'Kho Bạc', hall: 'Tháp Đồng Hồ', fest: 'Lễ hội đèn lồng', tech: 'cách in sách, mài kính và đóng khí cầu' },
    { key: 'industrial', name: 'Công nghiệp', know: 18, pop: 76, bank: 'Ngân Hàng Thành Phố', hall: 'Toà Thị Chính', fest: 'Lễ hội pháo hoa', tech: 'máy hơi nước và đường ray' },
    { key: 'modern', name: 'Hiện đại', know: 25, pop: 92, bank: 'Ngân Hàng Trung Tâm', hall: 'Trung Tâm Hành Chính', fest: 'Lễ hội ánh sáng', tech: 'điện, máy tính và tuabin gió' },
    { key: 'rocket', name: 'Tên lửa', know: 33, pop: 108, bank: 'Ngân Hàng Số', hall: 'Tháp Điều Hành', fest: 'Lễ hội phóng tàu', tech: 'tên lửa, vệ tinh và điện hạt nhân' },
    { key: 'ai', name: 'Robot AI', know: 42, pop: 124, bank: 'Kho Bạc Lượng Tử', hall: 'Lõi Trí Tuệ', fest: 'Lễ hội ánh sáng nhân tạo', tech: 'robot, trí tuệ nhân tạo và máy tính lượng tử' },
    // bốn thời vượt tầm hiểu biết của con người
    { key: 'nano', name: 'Vật Chất Sống', know: 52, pop: 138, bank: 'Kho Vật Chất', hall: 'Lõi San Hô', fest: 'Lễ hội nhà mọc', tech: 'vật chất lập trình được và những ngôi nhà tự mọc', beyond: true },
    { key: 'star', name: 'Mặt Trời Nhân Tạo', know: 63, pop: 152, bank: 'Kho Năng Lượng Sao', hall: 'Tháp Lơ Lửng', fest: 'Lễ hội thắp sao', tech: 'cách thắp một mặt trời trong vòm kính', beyond: true },
    { key: 'warp', name: 'Bẻ Cong Không Gian', know: 75, pop: 166, bank: 'Kho Đa Chiều', hall: 'Cổng Trung Tâm', fest: 'Lễ hội cổng mở', tech: 'cách gấp không gian để đi xuyên qua nó', beyond: true },
    { key: 'light', name: 'Siêu Việt', know: 88, pop: 180, bank: 'Kho Ánh Sáng', hall: 'Cột Sáng', fest: 'Lễ hội thăng hoa', tech: 'cách sống như ánh sáng và nghĩ chung một ý', beyond: true },
  ];
  const AI_ERA = 7;
  const LAST = ERAS.length - 1;
  const eraOf = (w) => ERAS[Math.max(0, Math.min(LAST, w.cfg.era == null ? 3 : w.cfg.era))];
  const bankOf = (w) => eraOf(w).bank;

  function create(opts) {
    const cfg = Object.assign({}, DEFAULTS, opts || {});
    const rand = makeRng(cfg.seed);
    const w = {
      cfg, rand, day: 0,
      households: [], firms: [],
      bank: { key: 'bank', cash: 0, loansOut: 0, writtenOff: 0, losses: 0 },
      gov: { key: 'gov', cash: 0 },
      ledger: { M0: 0, printed: 0, inflow: 0, created: 0, destroyed: 0, absorbed: 0, outflow: 0 },
      policy: { taxRate: cfg.taxRate, interestRate: cfg.interestRate, minWage: cfg.minWage },
      stats: [], events: [], flows: [], nextFirmId: 0, basePrice: null,
      phen: { rain: 0, drought: 0, droughtYear: -1, festival: 0, panic: 0, panicCool: 0, badDebt: 0 },
      // bộ máy câu chuyện
      stories: [], storySeq: 0, cands: [], lastSmall: -99, spread: [], fearShare: 0,
      fads: [], fadSeq: 0, inventions: [], inventionsUsed: [], variety: 0, seedReady: 0,
      airship: { state: 'away', days: 0, cool: 140, visits: 0, units: 0, revenue: 0, demand: 0, called: false },
      // người giữ bể và ký ức
      keeper: { tapLevel: 0, lastTap: -99, whisperReady: 0, callReady: 0 },
      foodRumorN: 0, foodRush: null, memorials: [], memoSeq: 0, chapters: [],
      // mở rộng: dịch bệnh, mỏ vàng, kẻ hứa lãi, đình công, độc quyền, dân số
      epi: { state: 'none', start: 0, peak: 0, cool: 300, lost: 0 }, sickN: 0,
      gold: null, goldCount: 0, ponzi: null, ponziCool: 200, lastStrike: null,
      social: { couples: 0, babies: 0, generations: 0, immigrants: 0 },
    };
    for (let i = 0; i < cfg.households; i++) w.households.push(newHousehold(i, cfg.householdCash, rand()));
    for (let i = 0; i < cfg.foodFirms; i++) w.firms.push(newFirm(w, 'food', cfg.firmCash));
    for (let i = 0; i < cfg.goodsFirms; i++) w.firms.push(newFirm(w, 'goods', cfg.firmCash));
    // Phân việc ban đầu: ~85% có việc
    const hs = shuffle(w, w.households.slice());
    const nEmployed = Math.round(hs.length * 0.85);
    for (let i = 0; i < nEmployed; i++) hire(w.firms[i % w.firms.length], hs[i]);
    w.ledger.M0 = totalMoney(w);
    record(w);
    log(w, 'Nền kinh tế ra đời với ' + w.households.length + ' hộ gia đình và ' + w.firms.length + ' doanh nghiệp.', 'info');
    return w;
  }

  function newHousehold(id, cash, r) {
    return { key: 'h' + id, id, cash, employer: null, hungry: 0, ateToday: true, skill: 0.7 + r * 0.7, fear: 0, calm: 0, hype: 0, bored: [], hoard: 0, joblessSince: 0, richFlag: false, foodRumor: 0, foodCalm: 0, pantry: 0, sick: 0, immune: 0, greed: 0, invested: 0, partner: -1 };
  }

  function newFirm(w, sector, cash) {
    const id = w.nextFirmId++;
    const prod = sector === 'food' ? w.cfg.foodProd : w.cfg.goodsProd;
    const wage = Math.max(w.cfg.wage, w.policy ? w.policy.minWage : 0); // xưởng mới cũng phải theo lương tối thiểu
    const unitCost = wage / prod;
    // mỗi doanh nghiệp có 3 hộ làm chủ, nhận cổ tức
    const owners = [];
    for (let k = 0; k < 3 && w.households.length; k++) owners.push(Math.floor(w.rand() * w.households.length));
    return {
      owners, ...(sector === 'gold' ? { name: 'Mỏ Vàng Đồi Mây', root: '' } : firmNameFor(w, sector)), inventions: 0, downUntil: 0, fadId: 0, peakWorkers: 0, strike: 0, strikeCool: 60, monopoly: false,
      key: 'f' + id, id, sector, cash: cash || 0, inv: 6, prod, baseProd: prod,
      price: unitCost * 1.25, wage, workers: [], vacancies: 0, unfilled: 0,
      debt: 0, sold: 0, avgSales: prod * 6, alive: true, born: w.day, deadSince: null,
    };
  }

  /* ---------- Sổ cái ---------- */
  function flow(w, from, to, amt, kind) {
    if (w.flows.length < w.cfg.maxFlows) w.flows.push({ from: from.key, to: to.key, amt, kind });
  }
  function transfer(w, from, to, amt, kind) {
    if (!(amt > 0)) return 0;
    from.cash -= amt; to.cash += amt;
    flow(w, from, to, amt, kind);
    return amt;
  }
  function lend(w, firm, amt) {
    if (!(amt > 0)) return;
    firm.cash += amt; firm.debt += amt;
    w.bank.loansOut += amt; w.ledger.created += amt;
    flow(w, w.bank, firm, amt, 'loan');
  }
  function repay(w, firm, amt) {
    amt = Math.min(amt, firm.debt, firm.cash);
    if (!(amt > 0)) return;
    firm.cash -= amt; firm.debt -= amt;
    w.bank.loansOut -= amt; w.ledger.destroyed += amt;
    flow(w, firm, w.bank, amt, 'repay');
  }
  function totalMoney(w) {
    let m = w.bank.cash + w.gov.cash + (w.ponzi && w.ponzi.agent ? w.ponzi.agent.cash : 0);
    for (const h of w.households) m += h.cash;
    for (const f of w.firms) m += f.cash;
    return m;
  }
  function expectedMoney(w) {
    const L = w.ledger;
    return L.M0 + L.printed + (L.inflow || 0) + L.created - L.destroyed - (L.absorbed || 0) - (L.outflow || 0);
  }

  /* ---------- Tiện ích ---------- */
  function shuffle(w, a) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(w.rand() * (i + 1));
      const t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function log(w, text, kind) {
    w.events.push({ day: w.day, text, kind: kind || 'info' });
    if (w.events.length > 200) w.events.shift();
  }
  function hire(firm, h) { h.employer = firm.id; firm.workers.push(h.id); }
  function fire(w, firm, hid) {
    const i = firm.workers.indexOf(hid);
    if (i >= 0) firm.workers.splice(i, 1);
    const h = w.households[hid];
    h.employer = null; h.joblessSince = w.day;
    if (w.rand() < 0.2) scare(w, h, 5);
    cand(w, 1, 'layoff', nameOf(hid) + ' mất việc', firm.name + ' cho ' + nameOf(hid) + ' nghỉ việc.', { kind: 'house', id: Math.floor(hid / 4) }, [hid]);
  }
  function firmById(w, id) { return w.firms.find((f) => f.id === id); }
  function payrollOf(w, f) { let s = 0; for (const hid of f.workers) s += f.wage * w.households[hid].skill; return s; }
  function outputOf(w, f) {
    if (f.strike > 0) return 0;
    if (f.sea) return f.seaFood || 0; // thuyền đánh cá: sản lượng là mẻ lưới hôm nay, tính ở tầng thế giới
    let s = 0;
    for (const hid of f.workers) { const h = w.households[hid]; if (!(h.sick > 0)) s += f.prod * h.skill; }
    return w.boost ? s * (w.boost[f.sector] || 1) : s;
  }
  function payToOwners(w, f, amt) {
    if (!(amt > 0)) return;
    const os = f.owners && f.owners.length ? f.owners : [Math.floor(w.rand() * w.households.length)];
    for (const hid of os) transfer(w, f, w.households[hid], amt / os.length, 'dividend');
  }
  function creditLimit(firm) { return Math.max(150, firm.wage * Math.max(1, firm.workers.length) * 15); }
  // Khi khủng hoảng niềm tin, ngân hàng chỉ còn cho doanh nghiệp lành mạnh (nợ thấp) vay
  // Doanh nghiệp đang bán dưới giá vốn chỉ được vay hạn mức nhỏ: ngân hàng không nuôi "xác sống"
  function canBorrow(w, firm, amt) {
    const crunch = w.phen && w.phen.panic > 0 ? 0.35 : 1;
    const unitCost = firm.wage / Math.max(0.1, firm.baseProd || firm.prod);
    const losing = firm.price < unitCost * 0.97 ? 0.3 : 1;
    return firm.debt + amt <= creditLimit(firm) * Math.min(crunch, losing);
  }

  /* =============== Hiện tượng tự nhiên và xã hội =============== */
  const SEASONS = ['xuân', 'hạ', 'thu', 'đông'];
  const SEASON_FOOD = [1.0, 1.05, 1.12, 0.9];
  function seasonOf(day) { return Math.floor(((day % 360) + 360) % 360 / 90); }
  function foodFactor(w) { return SEASON_FOOD[seasonOf(w.day)] * (w.phen.drought > 0 ? 0.65 : 1); }
  function updatePhenomena(w) {
    const p = w.phen, doy = w.day % 360, season = seasonOf(w.day), year = Math.floor(w.day / 360);
    if (doy % 90 === 0) story(w, 'season', 'small', 'Mùa ' + SEASONS[season] + ' đến', ['Cây đâm chồi, hoa nở khắp đảo.', 'Nắng gắt, ruộng đồng xanh mướt.', 'Lá đỏ, lúa vàng, kho thóc đầy dần.', 'Tuyết phủ mái nhà, ruộng nghỉ đông.'][season], { kind: 'plaza' });
    // mưa (mùa đông là tuyết), không mưa giữa hạn hán
    if (p.rain > 0) { p.rain--; if (p.rain === 0) log(w, season === 3 ? 'Tuyết ngừng rơi.' : 'Trời tạnh mưa.', 'nature'); }
    else if (p.drought === 0 && w.rand() < 0.035) { p.rain = 2 + Math.floor(w.rand() * 4); log(w, season === 3 ? 'Tuyết bắt đầu rơi trên thành phố.' : 'Trời đổ mưa.', 'nature'); }
    // hạn hán: có thể xảy ra một lần mỗi mùa hạ
    if (p.drought > 0) { p.drought--; if (p.drought === 0) story(w, 'drought-end', 'major', 'Hạn hán chấm dứt', 'Mưa đã về. Ruộng đồng hồi phục, giá lương thực sẽ dịu dần.', { kind: 'farms' }); }
    else if (season === 1 && p.droughtYear !== year && w.rand() < 0.012) { p.drought = 30 + Math.floor(w.rand() * 25); p.droughtYear = year; p.rain = 0; story(w, 'drought', 'epic', 'Hạn hán', 'Trời không mưa suốt nhiều tuần. Ruộng khô nứt, sản lượng lương thực giảm hơn một phần ba trong ' + p.drought + ' ngày.', { kind: 'farms' }); seedFoodRumor(w, 0.025); }
    // lễ hội đèn lồng cuối năm
    if (doy === 345) { p.festival = 15; story(w, 'festival', 'major', eraOf(w).fest, 'Mười lăm ngày cuối năm. Người dân sắm sửa, đèn trời bay lên từ mọi mái nhà.', { kind: 'plaza' }); }
    else if (p.festival > 0) p.festival--;
    // khủng hoảng niềm tin: nợ xấu tăng vọt thì ngân hàng ngừng cho vay
    p.badDebt *= 0.985;
    if (p.panicCool > 0) p.panicCool--;
    if (p.panic > 0) {
      p.panic--;
      if (p.panic === 0) {
        if ((w.fearShare || 0) > 0.12) p.panic = 1; // còn nhiều người sợ thì đám đông chưa giải tán
        else story(w, 'bankrun-end', 'major', bankOf(w) + ' trụ vững', 'Nỗi sợ lắng xuống, đám đông giải tán. ' + bankOf(w) + ' cho vay trở lại.', { kind: 'bank' });
      }
    } else if (p.panicCool === 0 && p.badDebt > 0.13 * Math.max(2000, w.bank.loansOut)) {
      // nợ xấu không trực tiếp gây khủng hoảng: nó gieo tin đồn, còn tin đồn có lan hay không là chuyện của đám đông
      p.panicCool = 150;
      const k = Math.round(w.households.length * 0.18);
      for (let i = 0; i < k; i++) scare(w, w.households[Math.floor(w.rand() * w.households.length)], 6 + Math.floor(w.rand() * 5));
      story(w, 'rumor', 'major', 'Tin đồn về ' + bankOf(w), 'Nợ xấu chồng chất. Người ta bắt đầu thì thầm rằng ' + bankOf(w) + ' sắp không trả nổi tiền.', { kind: 'bank' });
    }
  }
  function phenomena(w) {
    const p = w.phen, season = seasonOf(w.day);
    return { season, seasonName: SEASONS[season], dayOfYear: w.day % 360, year: Math.floor(w.day / 360) + 1, rain: p.rain > 0 && season !== 3, snow: p.rain > 0 && season === 3, drought: p.drought, festival: p.festival > 0, panic: p.panic, foodFactor: foodFactor(w) };
  }
  // Kích hoạt một hiện tượng ngay (dùng cho kiểm thử và trình diễn)
  function trigger(w, kind, days) {
    const p = w.phen;
    if (kind === 'rain') p.rain = days || 4;
    else if (kind === 'drought') { p.drought = days || 40; p.rain = 0; }
    else if (kind === 'festival') p.festival = days || 15;
    else if (kind === 'panic') { p.panic = days || 25; p.panicCool = 240; }
  }

  /* =============== Bộ máy câu chuyện =============== */
  const N1 = ['Sương', 'Mây', 'Gió', 'Sỏi', 'Lá', 'Rêu', 'Nắng', 'Trăng', 'Suối', 'Đá', 'Mưa', 'Cỏ', 'Khói', 'Sao'];
  const N2 = ['Bạc', 'Lam', 'Biếc', 'Hồng', 'Ngọc', 'Xanh', 'Vàng', 'Tím', 'Nâu', 'Trắng', 'Mờ', 'Thơm'];
  // 168 tên đầu tiên không trùng nhau
  function nameOf(id) { const a = id % N1.length, b = (Math.floor(id / N1.length) + a * 5) % N2.length; return N1[a] + ' ' + N2[b]; }
  const FOOD_NAMES = ['Cối Xay Gió Bạc', 'Ruộng Mây Vàng', 'Cối Xay Sương Sớm', 'Đồi Lúa Biếc', 'Cối Xay Ba Cánh', 'Vườn Bậc Thang', 'Cối Xay Đồi Gió', 'Ruộng Trăng Non', 'Cối Xay Bên Suối', 'Ruộng Hạt Ngọc', 'Cối Xay Lam Chiều', 'Vườn Mật Ong', 'Cối Xay Đá Rêu', 'Ruộng Sao Rơi'];
  const GOODS_NAMES = ['Xưởng Bánh Răng Đồng', 'Lò Thuỷ Tinh Lam', 'Xưởng Đồng Hồ Sao', 'Lò Gốm Mây', 'Xưởng Dệt Gió', 'Lò Rèn Ánh Lửa', 'Xưởng Đèn Lồng', 'Xưởng Gỗ Rêu', 'Lò Đúc Chuông', 'Xưởng Giấy Sương', 'Xưởng Kính Màu', 'Xưởng Hộp Nhạc', 'Lò Nến Thơm', 'Xưởng Ô Giấy', 'Xưởng Diều Gió', 'Xưởng Pháo Hoa', 'Xưởng Thuyền Mây', 'Xưởng Mũ Lá'];
  const FOOD_ROOTS = ['Gió Bạc', 'Mây Vàng', 'Sương Sớm', 'Lúa Biếc', 'Ba Cánh', 'Bậc Thang', 'Đồi Gió', 'Trăng Non', 'Bên Suối', 'Hạt Ngọc', 'Lam Chiều', 'Mật Ong', 'Đá Rêu', 'Sao Rơi'];
  const GOODS_ROOTS = ['Bánh Răng Đồng', 'Thuỷ Tinh Lam', 'Đồng Hồ Sao', 'Gốm Mây', 'Dệt Gió', 'Ánh Lửa', 'Đèn Lồng', 'Gỗ Rêu', 'Đúc Chuông', 'Giấy Sương', 'Kính Màu', 'Hộp Nhạc', 'Nến Thơm', 'Ô Giấy', 'Diều Gió', 'Pháo Hoa', 'Thuyền Mây', 'Mũ Lá'];
  const FOOD_PREFIX = ['Bãi Săn', 'Ruộng', 'Cối Xay', 'Trang Trại', 'Nông Trường', 'Nông Trại', 'Nông Trại Thuỷ Canh', 'Nông Trại Robot', 'Vườn San Hô', 'Vườn Ánh Sao', 'Vườn Đa Chiều', 'Vườn Ánh Sáng'];
  const GOODS_PREFIX = ['Lều Chế Tác', 'Lò', 'Lò Rèn', 'Xưởng', 'Nhà Máy', 'Công Ty', 'Tổ Hợp', 'Nhà Máy Tự Động', 'Lò Vật Chất', 'Xưởng Sao', 'Xưởng Xuyên Không', 'Xưởng Ánh Sáng'];
  const SEA_PREFIX = ['Bè Cá', 'Thuyền Cá', 'Ghe Lưới', 'Tàu Cá', 'Đội Tàu Cá', 'Tập Đoàn Hải Sản', 'Trại Nuôi Biển', 'Trại Biển Tự Động', 'Rạn San Hô Sống', 'Trại Biển Ánh Sao', 'Trại Biển Đa Chiều', 'Trại Biển Ánh Sáng'];
  function firmTitle(sector, era, root) { return (sector === 'sea' ? SEA_PREFIX : sector === 'food' ? FOOD_PREFIX : GOODS_PREFIX)[Math.max(0, Math.min(LAST, era))] + ' ' + root; }
  function firmRootFor(w, sector) {
    const list = sector === 'food' ? FOOD_ROOTS : GOODS_ROOTS;
    const used = new Set(w.firms.filter((f) => f.alive).map((f) => f.root));
    const pool = list.filter((n) => !used.has(n));
    const src = pool.length ? pool : list;
    return src[Math.floor(w.rand() * src.length)];
  }
  function firmNameFor(w, sector) { const root = firmRootFor(w, sector); return { root, name: firmTitle(sector, w.cfg.era == null ? 3 : w.cfg.era, root) }; }
  // sang thời đại mới, các nơi làm ăn đổi biển hiệu
  function renameFirms(w) { for (const f of w.firms) if (f.root && f.sector !== 'gold') f.name = firmTitle(f.sea ? 'sea' : f.sector, w.cfg.era, f.root); }
  const FOOD_INV = ['Cối xay ba tầng', 'Giống lúa mây', 'Mương dẫn sương', 'Phân bón đom đóm', 'Lưỡi cày gió', 'Kho thóc lạnh'];
  const GOODS_INV = ['Ô giấy bay', 'Đèn lồng không tắt', 'Chuông gió biết hát', 'Diều đưa thư', 'Gốm phát sáng', 'Hộp nhạc tự quay', 'Áo len mây', 'Kính ngắm sao', 'Giày nhún'];
  const FAD_COLORS = ['#ff6b9d', '#ffd166', '#7bdff2', '#c3a6ff', '#9be564', '#ff9f43'];

  function story(w, type, tier, title, text, place, extra) {
    const st = Object.assign({ id: ++w.storySeq, day: w.day, type, tier, title, text, place: place || null, actors: [] }, extra || {});
    w.stories.push(st);
    if (w.stories.length > 600) w.stories.shift();
    return st;
  }
  // ứng viên chuyện nhỏ: mỗi vài ngày chỉ kể một chuyện tiêu biểu nhất
  function cand(w, pri, type, title, text, place, actors) { if (w.cands) w.cands.push({ pri, type, title, text, place, actors }); }
  function pickSmall(w) {
    if (w.cands.length && w.day - w.lastSmall >= 4) {
      let best = w.cands[0];
      for (const c of w.cands) if (c.pri > best.pri || (c.pri === best.pri && w.rand() < 0.5)) best = c;
      story(w, best.type, 'small', best.title, best.text, best.place, { actors: best.actors || [] });
      w.lastSmall = w.day;
    }
    w.cands = [];
  }
  function richest(w) {
    if (w.day % 5) return;
    const hs = w.households, sorted = hs.map((h) => h.cash).sort((a, b) => a - b), median = sorted[Math.floor(sorted.length / 2)];
    let top = hs[0];
    for (const h of hs) if (h.cash > top.cash) top = h;
    if (!top.richFlag && top.cash > Math.max(200, median * 8)) {
      top.richFlag = true;
      cand(w, 2, 'rich', nameOf(top.id) + ' giàu nhất phố', nameOf(top.id) + ' giờ có ' + Math.round(top.cash).toLocaleString('vi-VN') + ' xu, gấp ' + Math.round(top.cash / Math.max(1, median)) + ' lần một nhà bình thường.', { kind: 'house', id: Math.floor(top.id / 4) }, [top.id]);
    }
  }
  function note(w, from, to, kind) { if (w.spread.length < 90) w.spread.push({ from: from.id, to: to.id, kind }); }
  // gặp gỡ: đồng nghiệp, hàng xóm gần, hoặc người lạ ở chợ
  function randomContact(w, h) {
    const r = w.rand(), hs = w.households, n = hs.length;
    if (r < 0.45 && h.employer !== null) {
      const f = firmById(w, h.employer);
      if (f && f.workers.length > 1) { const c = hs[f.workers[Math.floor(w.rand() * f.workers.length)]]; if (c !== h) return c; }
    }
    if (r < 0.85) {
      const id = (Math.floor(h.id / 4) + Math.floor(w.rand() * 5) - 2) * 4 + Math.floor(w.rand() * 4);
      if (id >= 0 && id < n && id !== h.id) return hs[id];
    }
    const c = hs[Math.floor(w.rand() * n)];
    return c === h ? null : c;
  }
  function scare(w, h, days) { if (!h || h.calm > 0 || w.cfg.off.fear) return false; const was = h.fear > 0; h.fear = Math.max(h.fear, days); return !was; }
  function activeFad(w) { for (let i = w.fads.length - 1; i >= 0; i--) if (w.fads[i].state !== 'over') return w.fads[i]; return null; }

  function storyDay(w) {
    w.spread = [];
    const hs = w.households, n = hs.length, p = w.phen;
    // Nỗi sợ lan truyền, có điểm bùng phát: ít người sợ thì tự tắt, quá nhiều người sợ thì lan như lửa
    let fearN = 0;
    for (const h of hs) if (h.fear > 0) fearN++;
    const beta = 0.03 + 0.28 * (fearN / n), newly = [];
    for (const h of hs) {
      if (h.fear <= 0) continue;
      for (let k = 0; k < 2; k++) { const c = randomContact(w, h); if (c && c.fear <= 0 && c.calm <= 0 && w.rand() < beta) newly.push([h, c]); }
    }
    for (const h of hs) { if (h.fear > 0) { h.fear--; if (h.fear === 0) h.calm = 12; } else if (h.calm > 0) h.calm--; }
    for (const [a, c] of newly) if (c.fear <= 0) { c.fear = 5 + Math.floor(w.rand() * 5); note(w, a, c, 'fear'); }
    let f2 = 0;
    for (const h of hs) if (h.fear > 0) f2++;
    w.fearShare = f2 / n;
    if (p.panic === 0 && w.fearShare > 0.3) {
      p.panic = 15; p.panicCool = 200;
      story(w, 'bankrun', 'epic', 'Đám đông kéo đến ' + bankOf(w), Math.round(w.fearShare * 100) + '% người dân tin ' + bankOf(w) + ' sắp vỡ và kéo đến đòi tiền. ' + bankOf(w) + ' siết chặt cho vay.', { kind: 'bank' });
    }
    foodRumorDay(w);
    epidemicDay(w);
    ponziDay(w);
    socialDay(w);
    if (w.day % 10 === 0) marketPowerDay(w);
    // Cơn sốt
    const fad = activeFad(w);
    if (fad) fadDay(w, fad);
    // Phát minh tự nhiên, và cách làm mới lan sang đối thủ
    if (w.rand() < (w.cfg.inventRate || 1 / 150) && !w.cfg.off.invent) {
      const cands = w.firms.filter((f) => f.alive && f.workers.length);
      if (cands.length) invent(w, cands[Math.floor(w.rand() * cands.length)], {});
    }
    for (const f of w.firms) {
      if (!f.alive) continue;
      const leader = w.firms.find((g) => g.alive && g !== f && g.sector === f.sector && g.prod > f.prod * 1.15 && w.day - (g.inventedDay || 0) > 25);
      if (leader && w.rand() < 1 / 80) {
        f.prod = Math.min(leader.prod, f.prod * 1.15); f.baseProd = Math.min(leader.baseProd || leader.prod, (f.baseProd || f.prod) * 1.15);
        cand(w, 1, 'copy', f.name + ' học theo ' + leader.name, f.name + ' bắt chước cách làm ' + (leader.lastInvention || 'mới').toLowerCase() + ' của ' + leader.name + '.', { kind: 'firm', id: f.id }, []);
      }
    }
    // Xã hội càng làm ra nhiều thì người ta càng muốn nhiều món hàng mới: nhu cầu lớn theo năng suất
    let pw = 0, ww = 0;
    for (const f of w.firms) if (f.alive && f.workers.length) { const base = f.sector === 'food' ? w.cfg.foodProd : w.cfg.goodsProd; pw += (f.prod / base) * f.workers.length; ww += f.workers.length; }
    w.prodIndex = ww ? pw / ww : 1;
    w.variety = Math.max(0, Math.min(2.5, (w.prodIndex - 1) * 3.2));
    airshipDay(w);
    // Hoả hoạn hiếm hoi
    for (const f of w.firms) {
      if (!f.alive || f.downUntil > w.day) continue;
      if (w.rand() < (f.sector === 'goods' ? 0.0004 : 0.00025) && !w.cfg.off.fire) burn(w, f);
    }
  }

  /* ----- Tin đồn mất mùa: người nghe tin mua tích trữ, chính việc tích trữ làm kệ trống và giá lên ----- */
  function seedFoodRumor(w, share, list) {
    if (w.cfg.off.foodRumor) return 0;
    const hs = w.households, seeds = list || [];
    if (!list) for (let i = 0; i < Math.round(hs.length * share); i++) seeds.push(hs[Math.floor(w.rand() * hs.length)]);
    let n = 0;
    for (const h of seeds) if (h && h.foodRumor <= 0 && !(h.foodCalm > 0)) { h.foodRumor = 7 + Math.floor(w.rand() * 3); n++; }
    return n;
  }
  function foodRumorDay(w) {
    const hs = w.households, n = hs.length;
    let cnt = 0;
    for (const h of hs) if (h.foodRumor > 0) cnt++;
    if (!cnt) {
      for (const h of hs) if (h.foodCalm > 0) h.foodCalm--;
      w.foodRumorN = 0;
      const R = w.foodRush;
      if (R && R.active) { R.active = false; story(w, 'food-rush-end', 'small', 'Cơn tích trữ qua đi', 'Mùa màng vẫn bình thường. Nhà nào cũng còn gạo trong kho, chợ lương thực vắng hẳn mấy ngày.', { kind: 'farms' }); }
      return;
    }
    const beta = 0.05 + 0.3 * (cnt / n), newly = [];
    for (const h of hs) {
      if (h.foodRumor <= 0) continue;
      for (let k = 0; k < 2; k++) { const c = randomContact(w, h); if (c && c.foodRumor <= 0 && !(c.foodCalm > 0) && w.rand() < beta) newly.push([h, c]); }
    }
    for (const h of hs) { if (h.foodRumor > 0) { h.foodRumor--; if (h.foodRumor === 0) h.foodCalm = 120; } else if (h.foodCalm > 0) h.foodCalm--; }
    for (const [a, c] of newly) if (c.foodRumor <= 0) { c.foodRumor = 5 + Math.floor(w.rand() * 4); note(w, a, c, 'food'); }
    cnt = 0;
    for (const h of hs) if (h.foodRumor > 0) cnt++;
    w.foodRumorN = cnt;
    const share = cnt / n;
    if (share > 0.15 && !(w.foodRush && w.foodRush.active)) {
      const food = w.firms.filter((f) => f.alive && f.sector === 'food');
      const price = food.length ? food.reduce((t, f) => t + f.price, 0) / food.length : 0;
      w.foodRush = { active: true, start: w.day, price, peak: share };
      story(w, 'food-rush', 'major', 'Người dân đổ xô tích trữ lương thực', Math.round(share * 100) + '% gia đình tin sắp mất mùa và mua gấp đôi. Kệ hàng ở các cối xay vơi dần, và giá gạo bắt đầu nhích lên.', { kind: 'farms' });
    } else if (w.foodRush && w.foodRush.active) w.foodRush.peak = Math.max(w.foodRush.peak, share);
  }

  /* ----- Ký ức: những dấu vết thành phố giữ lại mãi ----- */
  function memorial(w, m) {
    m.id = ++w.memoSeq; m.day = w.day; m.year = Math.floor(Math.max(0, w.day - 1) / 360) + 1;
    w.memorials.push(m);
    if (w.memorials.length > 120) w.memorials.shift();
    return m;
  }

  /* ----- Cơn sốt: lây lan, chán, miễn dịch; đầu cơ và vỡ bong bóng ----- */
  function startFad(w, firm, item, text) {
    if (!firm || !firm.alive || activeFad(w) || w.cfg.off.fad) return null;
    const fad = { id: ++w.fadSeq, firmId: firm.id, item, color: FAD_COLORS[w.fadSeq % FAD_COLORS.length], start: w.day, state: 'rising', share: 0, peakShare: 0, peakDay: w.day, basePrice: firm.price, maxRatio: 1, hoarded: 0, units: 0 };
    w.fads.push(fad); firm.fadId = fad.id;
    const seeds = firm.workers.slice(0, 6).map((id) => w.households[id]);
    if (!seeds.length) seeds.push(w.households[Math.floor(w.rand() * w.households.length)]);
    for (const h of seeds) h.hype = fad.id;
    story(w, 'fad', 'major', 'Cơn sốt ' + item.toLowerCase() + ' bắt đầu', text || 'Những người thợ ở ' + firm.name + ' mang ' + item.toLowerCase() + ' về khoe với hàng xóm. Ai nhìn thấy cũng muốn có một chiếc.', { kind: 'firm', id: firm.id }, { fadId: fad.id, color: fad.color });
    return fad;
  }
  function fadDay(w, fad) {
    const firm = firmById(w, fad.firmId), hs = w.households, n = hs.length;
    if (!firm || !firm.alive) { endFad(w, fad, (firm ? firm.name : 'Xưởng') + ' đã đóng cửa, cơn sốt ' + fad.item.toLowerCase() + ' tắt theo.', 'small'); return; }
    const ratio = firm.price / fad.basePrice;
    fad.maxRatio = Math.max(fad.maxRatio, ratio);
    const beta = (fad.state === 'rising' ? 0.17 : 0.05) * Math.min(1, Math.max(0.25, 2.2 / ratio));
    const boredP = 0.03 + 0.0035 * (w.day - fad.start), newly = [];
    for (const h of hs) {
      if (h.hype !== fad.id) continue;
      for (let k = 0; k < 3; k++) { const c = randomContact(w, h); if (c && !c.hype && !c.bored.includes(fad.id) && w.rand() < beta) newly.push([h, c]); }
    }
    for (const h of hs) if (h.hype === fad.id && w.rand() < boredP) { h.hype = 0; h.bored.push(fad.id); }
    for (const [a, c] of newly) if (!c.hype && !c.bored.includes(fad.id)) { c.hype = fad.id; note(w, a, c, 'hype'); }
    let cnt = 0;
    for (const h of hs) if (h.hype === fad.id) cnt++;
    fad.share = cnt / n;
    if (fad.share > fad.peakShare) { fad.peakShare = fad.share; fad.peakDay = w.day; }
    const item = fad.item.toLowerCase();
    if (fad.state === 'rising' && fad.peakShare > 0.12 && fad.share < fad.peakShare * 0.9) {
      fad.state = 'peak';
      story(w, 'fad-peak', 'major', 'Cơn sốt ' + item + ' lên đỉnh', Math.round(fad.peakShare * 100) + '% gia đình từng mê ' + item + '. Giá lên gấp ' + fad.maxRatio.toFixed(1).replace('.', ',') + ' lần, ' + Math.round(fad.hoarded) + ' chiếc nằm trong kho của người đầu cơ.', { kind: 'firm', id: firm.id }, { fadId: fad.id, color: fad.color });
    } else if (fad.state === 'rising' && fad.peakShare <= 0.12 && w.day - fad.start > 25 && fad.share < 0.03) {
      endFad(w, fad, 'Không mấy ai để ý đến ' + item + '. Cơn sốt tắt trước khi kịp bùng lên.', 'small');
    } else if (fad.state === 'peak' && fad.share < fad.peakShare * 0.45) {
      fad.state = 'crash';
      const losers = hs.filter((h) => h.hoard > 0);
      const hoard = losers.reduce((t, h) => t + h.hoard, 0);
      for (const h of losers) { scare(w, h, 6 + Math.floor(w.rand() * 4)); h.hoard = 0; }
      firm.price *= 0.7;
      memorial(w, { kind: 'pile', item: fad.item, color: fad.color, units: hoard + Math.round(Math.max(0, firm.inv)), fadId: fad.id, firmId: firm.id, firmName: firm.name });
      story(w, 'fad-crash', 'epic', 'Bong bóng ' + item + ' vỡ', 'Hết ai thèm ' + item + '. Hàng ế chất đống ở ' + firm.name + '. ' + losers.length + ' người đầu cơ ôm ' + hoard + ' chiếc không bán được, họ bắt đầu lo cho túi tiền của mình.', { kind: 'firm', id: firm.id }, { fadId: fad.id, color: fad.color, losers: losers.length, hoard });
    } else if (fad.state === 'crash' && fad.share < 0.02) {
      endFad(w, fad, null, 'small');
    }
  }
  function endFad(w, fad, text, tier) {
    fad.state = 'over'; fad.end = w.day;
    for (const h of w.households) { if (h.hype === fad.id) { h.hype = 0; h.bored.push(fad.id); } h.hoard = 0; }
    const firm = firmById(w, fad.firmId);
    if (firm && firm.fadId === fad.id) firm.fadId = 0;
    story(w, 'fad-over', tier || 'small', 'Cơn sốt ' + fad.item.toLowerCase() + ' đã qua', text || 'Thành phố đã quên ' + fad.item.toLowerCase() + '. Chỉ còn lại những chiếc bị bỏ quên trong góc nhà.', firm ? { kind: 'firm', id: firm.id } : null, { fadId: fad.id, color: fad.color });
  }

  /* ----- Phát minh ----- */
  function invent(w, firm, opts) {
    opts = opts || {};
    if (!firm || !firm.alive) return null;
    const list = firm.sector === 'food' ? FOOD_INV : GOODS_INV;
    const pool = list.filter((x) => !w.inventionsUsed.includes(x));
    const item = pool.length ? pool[Math.floor(w.rand() * pool.length)] : 'Cải tiến số ' + (w.inventions.length + 1);
    w.inventionsUsed.push(item);
    const inventor = firm.workers.length ? firm.workers[Math.floor(w.rand() * firm.workers.length)] : firm.owners[0];
    const cap = (firm.sector === 'food' ? w.cfg.foodProd : w.cfg.goodsProd) * 1.6;
    firm.prod = Math.min(cap, firm.prod * 1.3);
    firm.baseProd = Math.min(cap, (firm.baseProd || firm.prod) * 1.3);
    firm.inventions++; firm.lastInvention = item; firm.inventedDay = w.day;
    w.inventions.push({ day: w.day, firmId: firm.id, item, inventor, seeded: !!opts.seeded });
    memorial(w, { kind: 'statue', item, inventor, firmId: firm.id, firmName: firm.name, sector: firm.sector, seeded: !!opts.seeded });
    const st = story(w, 'invention', 'major', 'Phát minh: ' + item, (opts.seeded ? 'Hạt giống phát minh rơi xuống ' + firm.name + '. ' : 'Ở ' + firm.name + ', ') + nameOf(inventor) + ' vừa nghĩ ra ' + item.toLowerCase() + '. Năng suất của nơi này tăng gần một phần ba.', { kind: 'firm', id: firm.id }, { actors: [inventor], item, seeded: !!opts.seeded });
    if (firm.sector === 'goods' && w.rand() < (opts.seeded ? 0.75 : 0.5)) startFad(w, firm, item);
    return st;
  }
  // Người giữ bể gieo hạt phát minh vào một xưởng hay cối xay; hạt giống cần 40 ngày để ủ lại
  function seedInvention(w, firmId) {
    const f = firmById(w, firmId);
    if (!f || !f.alive) return { ok: false, reason: 'gone' };
    if (w.day < w.seedReady) return { ok: false, reason: 'wait', wait: w.seedReady - w.day };
    w.seedReady = w.day + 40;
    return { ok: true, story: invent(w, f, { seeded: true }) };
  }

  /* ----- Khí cầu thương nhân ----- */
  function airshipDay(w) {
    const a = w.airship;
    if (a.state === 'away') {
      if ((w.cfg.era == null ? 3 : w.cfg.era) < 3 && !a.called) return; // khí cầu chỉ xuất hiện từ thời cận đại
      if (a.cool > 0) a.cool--;
      else if (a.called || (w.rand() < 1 / 70 && !w.cfg.off.airship)) arriveAirship(w);
    } else if (a.state === 'docked') {
      a.days--;
      if (a.days <= 0) {
        a.state = 'away'; a.cool = 150 + Math.floor(w.rand() * 120); a.called = false;
        story(w, 'airship-leave', 'major', 'Khí cầu rời đi', 'Đoàn thương nhân đã mua ' + a.units + ' món hàng, để lại cho thành phố ' + Math.round(a.revenue).toLocaleString('vi-VN') + ' xu. Đơn hàng biến mất cùng họ.', { kind: 'dock' });
      }
    }
  }
  function arriveAirship(w) {
    const a = w.airship, called = a.called;
    a.state = 'docked'; a.days = 18 + Math.floor(w.rand() * 12); a.units = 0; a.revenue = 0; a.demand = 6 + Math.floor(w.rand() * 8); a.visits++; a.called = false;
    const guests = arrivalGuests(w);
    story(w, 'airship', 'epic', called ? 'Khí cầu đáp lời người giữ bể' : a.visits === 1 ? 'Khí cầu đầu tiên ghé đảo' : 'Khí cầu thương nhân cập bến', (called ? 'Ngọn đèn hiệu trên bến đã được thắp. ' : '') + 'Đoàn thương nhân từ phương xa muốn mua ' + a.demand + ' món hàng mỗi ngày, trả bằng tiền của thế giới bên ngoài. Họ ở lại ' + a.days + ' ngày.', { kind: 'dock' }, { called });
    guests();
  }
  function exportDay(w, goods) {
    const a = w.airship;
    if (a.state !== 'docked') return;
    const dock = { key: 'dock', cash: 0 };
    for (let k = 0; k < a.demand; k++) {
      const g = cheapestOf(w, goods, true);
      if (!g) break;
      g.cash += g.price; g.inv -= 1; g.sold += 1;
      w.ledger.inflow += g.price; a.units++; a.revenue += g.price;
      flow(w, dock, g, g.price, 'export');
    }
  }

  /* ----- Hoả hoạn ----- */
  function burn(w, f) {
    const lost = Math.round(f.inv);
    f.inv = 0; f.downUntil = w.day + 8 + Math.floor(w.rand() * 7); f.fires = (f.fires || 0) + 1; f.fireDay = w.day;
    story(w, 'fire', 'major', 'Hoả hoạn ở ' + f.name, 'Lửa bùng lên trong ' + (f.sector === 'food' ? 'kho thóc' : 'xưởng') + '. ' + lost + ' món hàng bị thiêu rụi, phải dựng lại trong ' + (f.downUntil - w.day) + ' ngày.', { kind: 'firm', id: f.id });
  }
  function storiesSince(w, id) { const out = []; for (const st of w.stories) if (st.id > id) out.push(st); return out; }

  /* ---------- Một ngày ---------- */
  function step(w) {
    w.day++;
    w.flows = [];
    updatePhenomena(w);
    storyDay(w);
    const P = w.policy;
    const alive = w.firms.filter((f) => f.alive);
    const unemployedShare = w.households.filter((h) => h.employer === null).length / w.households.length;

    // 1. Doanh nghiệp lập kế hoạch: giá, tuyển dụng, lương
    for (const f of alive) {
      f.avgSales = f.avgSales * 0.8 + f.sold * 0.2;
      f.peakWorkers = Math.max(f.peakWorkers || 0, f.workers.length);
      if (f.sector === 'gold' || f.strike > 0) { f.vacancies = 0; f.sold = 0; continue; } // mỏ vàng tự lo; xưởng đình công không tuyển, không đổi giá
      // trang trại tích trữ nhiều ngày hàng hơn để vượt mùa đông và hạn hán
      const target = Math.max(4, f.avgSales * (f.sector === 'food' ? 4 : 2));
      // Giá vốn tính theo năng suất bình thường, để cú sốc tạm thời (đình công, hạn hán) không làm giá vô hạn
      const unitCost = f.wage / Math.max(0.1, f.baseProd || f.prod);
      // công suất thật, đã tính mùa vụ và hạn hán
      const capacity = outputOf(w, f) * (f.sector === 'food' ? foodFactor(w) : 1);
      if (f.inv > target * 1.5) {
        f.price *= 1 - 0.03 * w.rand();
        // chỉ sa thải khi sản lượng thật sự vượt sức mua
        if (f.workers.length > 1 && f.inv > target * 2.5 && f.avgSales < capacity * 0.9) fire(w, f, f.workers[Math.floor(w.rand() * f.workers.length)]);
        f.vacancies = 0;
      } else if (f.inv < target * 0.6 && f.avgSales > capacity * 0.92) {
        // kệ gần trống thì giá leo nhanh: tín hiệu khan hiếm
        f.price *= 1 + (f.sector === 'food' && f.inv < target * 0.15 ? 0.05 : 0) + 0.03 * w.rand();
        // Mở rộng: lãi suất càng cao càng ngại tuyển thêm bằng tiền vay
        const appetite = Math.max(0, 1 - P.interestRate / 0.15);
        const affordable = f.cash > f.wage * (f.workers.length + 1) * 5;
        f.vacancies = affordable || w.rand() < appetite ? 1 + (f.inv < target * 0.2 ? 2 : 0) : 0;
      } else {
        f.vacancies = 0;
      }
      // xưởng đang có cơn sốt: hàng khan, giá leo nhanh, tuyển gấp; khi bong bóng vỡ thì giá rơi
      const fad = f.fadId ? w.fads.find((x) => x.id === f.fadId) : null;
      // giá lúc sốt leo theo độ khan hàng và độ cuồng nhiệt của đám đông
      if (fad && (fad.state === 'rising' || fad.state === 'peak') && f.inv < target * 1.5) { f.price *= 1.03 + 0.12 * fad.share + 0.02 * w.rand(); f.vacancies = Math.max(f.vacancies, 2); }
      else if (fad && fad.state === 'crash') f.price *= 0.97;
      if (f.monopoly && f.price < unitCost * 1.9) f.price *= 1.004; // độc quyền: không ai cạnh tranh thì giá cứ nhích dần
      f.price = Math.max(f.price, unitCost * 0.7, 0.2);
      if (f.vacancies > 0) f.unfilled++; else f.unfilled = 0;
      // Lương chỉ tăng khi thị trường lao động thật sự căng; giảm chậm khi thất nghiệp cao
      if (f.unfilled > 3) { if (unemployedShare < 0.03) f.wage *= 1.006; f.unfilled = 0; }
      if (unemployedShare > 0.1 && w.rand() < 0.025) f.wage *= 0.99;
      // Năng suất tăng thì chia bớt cho người lao động: doanh nghiệp làm ăn hiệu quả và có lãi thì tăng lương dần
      const prodGain = f.prod / (f.sector === 'food' ? w.cfg.foodProd : w.cfg.goodsProd);
      if (prodGain > 1.05 && f.price > unitCost * 1.05 && w.day % 15 === 0 && f.wage < w.cfg.wage * prodGain) f.wage *= 1.012; // lương bám theo năng suất, không vượt qua
      f.wage = Math.max(f.wage, P.minWage);
      f.sold = 0;
    }

    // 2. Thị trường lao động
    const jobless = shuffle(w, w.households.filter((h) => h.employer === null));
    const hiring = alive.filter((f) => f.vacancies > 0).sort((a, b) => b.wage - a.wage);
    for (const f of hiring) {
      while (f.vacancies > 0 && jobless.length) {
        const h = jobless.pop();
        hire(f, h); f.vacancies--;
        if (h.joblessSince && w.day - h.joblessSince >= 20) cand(w, 3, 'job', nameOf(h.id) + ' có việc làm', 'Sau ' + (w.day - h.joblessSince) + ' ngày tìm việc, ' + nameOf(h.id) + ' được nhận vào ' + f.name + '.', { kind: 'firm', id: f.id }, [h.id]);
        h.joblessSince = 0;
      }
    }

    // Khi thành phố thiếu lương thực trầm trọng mà không còn ai thất nghiệp, người ta bỏ xưởng về ruộng: miếng ăn trước đã
    if (!jobless.length) {
      const goodsWithStaff = alive.filter((g) => g.sector === 'goods' && g.workers.length > 1);
      for (const f of hiring) {
        if (f.sector !== 'food' || f.inv > Math.max(4, f.avgSales * 4) * 0.25) continue;
        for (let k = 0; k < 2 && f.vacancies > 0 && goodsWithStaff.length; k++) {
          const src = goodsWithStaff[Math.floor(w.rand() * goodsWithStaff.length)];
          if (src.workers.length <= 1) continue;
          const hid = src.workers[Math.floor(w.rand() * src.workers.length)];
          src.workers.splice(src.workers.indexOf(hid), 1);
          hire(f, w.households[hid]); f.vacancies--;
        }
      }
    }

    goldLabor(w, jobless);
    strikeDay(w, alive);

    // 3. Trả lương (vay nếu thiếu tiền, sa thải nếu không vay được)
    for (const f of alive) {
      if (!f.alive || f.strike > 0) continue; // đã đóng cửa giữa ngày (mỏ cạn, bị mua lại); đình công: không làm thì không có lương
      let payroll = payrollOf(w, f);
      if (f.cash < payroll) {
        const need = payroll - f.cash + f.wage * 2;
        if (canBorrow(w, f, need)) lend(w, f, need);
        // không sa thải hàng loạt: tối đa 2 người mỗi ngày, phần còn thiếu thì trả lương chậm theo tỷ lệ
        for (let k = 0; k < 2 && f.cash < payroll && f.workers.length; k++) {
          fire(w, f, f.workers[f.workers.length - 1]);
          payroll = payrollOf(w, f);
        }
      }
      const payScale = payroll > 0 ? Math.min(1, Math.max(0, f.cash) / payroll) : 1;
      for (const hid of f.workers) {
        const h = w.households[hid];
        const pay = f.wage * h.skill * payScale, tax = pay * P.taxRate;
        transfer(w, f, h, pay - tax, 'wage');
        transfer(w, f, w.gov, tax, 'tax');
      }
    }

    // 4. Sản xuất
    const ff = foodFactor(w);
    for (const f of alive) if (!(f.downUntil > w.day)) f.inv += outputOf(w, f) * (f.sea ? 1 : f.sector === 'food' ? ff : f.sector === 'gold' ? w.gold.yield : 1); // xưởng đang dựng lại sau hoả hoạn thì không sản xuất
    goldSales(w);

    // 5. Tiêu dùng
    const food = alive.filter((f) => f.sector === 'food');
    const goods = alive.filter((f) => f.sector === 'goods');
    const avgFoodPrice = food.length ? food.reduce((s, f) => s + f.price, 0) / food.length : 1;
    const fadNow = activeFad(w), fadFirm = fadNow ? firmById(w, fadNow.firmId) : null;
    for (const h of shuffle(w, w.households.slice())) {
      h.ateToday = false;
      if (h.pantry > 0 && h.foodRumor <= 0 && w.rand() < 0.6) { h.pantry--; h.ateToday = true; h.hungry = 0; } // ăn dần gạo đã tích trữ
      else {
        const fs = cheapestOf(w, food, true);
        if (fs && h.cash >= fs.price) {
          transfer(w, h, fs, fs.price, 'buy'); fs.inv -= 1; fs.sold += 1;
          h.ateToday = true; h.hungry = 0;
        } else {
          h.hungry++;
        }
      }
      // nghe tin sắp mất mùa: mua thêm vài phần để dành mỗi ngày, ai càng nhiều tiền càng tích trữ được nhiều
      for (let k = 0; k < 3 && h.foodRumor > 0 && h.pantry < 9 && h.cash > avgFoodPrice * 10; k++) {
        const f2 = cheapestOf(w, food, true);
        if (!f2) break;
        transfer(w, h, f2, f2.price, 'buy'); f2.inv -= 1; f2.sold += 1; h.pantry++;
      }
      // Cơn sốt: người đang mê món hàng mới mua bằng được, người giàu còn mua tích trữ chờ giá lên
      if (h.hype && fadNow && h.hype === fadNow.id && fadFirm && fadFirm.alive && fadFirm.inv >= 1) {
        if (fadFirm.price <= fadNow.basePrice * 6 && h.cash - fadFirm.price > avgFoodPrice * 3) {
          transfer(w, h, fadFirm, fadFirm.price, 'buy'); fadFirm.inv -= 1; fadFirm.sold += 1; fadNow.units++;
        }
        if (fadNow.state === 'rising' && h.cash > avgFoodPrice * 70 && fadFirm.inv >= 3 && w.rand() < 0.35) {
          for (let k = 0; k < 2; k++) { transfer(w, h, fadFirm, fadFirm.price, 'buy'); fadFirm.inv -= 1; fadFirm.sold += 1; }
          h.hoard += 2; fadNow.hoarded += 2;
        }
      }
      // Tiết kiệm phòng thân: giữ lại tiền ăn nhiều ngày, người thất nghiệp và lúc kinh tế xấu thì chi tiêu dè dặt hơn
      const jobless = h.employer === null, scared = h.fear > 0;
      const reserveDays = (jobless ? 14 : 8 + unemployedShare * 25) + (w.phen.panic > 0 ? 6 : 0) + (scared ? 10 : 0);
      const propensity = (jobless ? 0.12 : 0.26) * (scared ? 0.6 : 1);
      let budget = Math.max(0, h.cash - avgFoodPrice * reserveDays) * propensity;
      // Bão hoà: mỗi hộ muốn khoảng 1,5 món hàng mỗi ngày, không mua vô hạn
      // người giàu tiêu xa xỉ hơn: thêm món theo mức tài sản
      // phát minh sinh ra những món hàng mới, nên nhu cầu cũng lớn dần theo năng suất
      let wants = 1 + (w.rand() < 0.55 ? 1 : 0) + (h.cash > avgFoodPrice * 90 ? 1 : 0) + (w.phen.festival > 0 ? 1 : 0) + Math.floor(w.variety) + (w.rand() < w.variety % 1 ? 1 : 0);
      if (h.sick > 0) wants = 0; // người ốm nằm nhà, chỉ mua cơm
      if (h.greed > 0 && w.ponzi && w.ponzi.state === 'open' && !h.invested && h.cash > avgFoodPrice * 25) invest(w, h, avgFoodPrice);
      for (let k = 0; k < wants; k++) {
        const g = cheapestOf(w, goods);
        if (!g || budget < g.price) break;
        transfer(w, h, g, g.price, 'buy'); g.inv -= 1; g.sold += 1; budget -= g.price;
      }
    }

    // Khí cầu thương nhân mua hàng bằng tiền từ bên ngoài đảo
    exportDay(w, goods);

    // 6. Ngân hàng: lãi vay
    const rDay = (P.interestRate + (w.cfg.riskSpread || 0)) / 360;
    for (const f of alive) {
      if (!f.alive || f.debt <= 0) continue;
      const interest = f.debt * rDay;
      if (w.phen.panic > 0) { transfer(w, f, w.bank, Math.min(interest, Math.max(0, f.cash)), 'interest'); continue; }
      if (f.cash < interest) lend(w, f, interest - f.cash);
      transfer(w, f, w.bank, interest, 'interest');
    }

    // 7. Doanh nghiệp trả nợ và chia cổ tức phần tiền dư
    for (const f of alive) {
      if (!f.alive) continue;
      const buffer = Math.max(60, f.wage * f.workers.length * 8);
      let excess = f.cash - buffer;
      if (excess > 0 && f.debt > 0) { repay(w, f, excess * 0.6); excess = f.cash - buffer; }
      if (excess > 0) { payToOwners(w, f, excess * 0.3); payToHouseholds(w, f, excess * 0.2, 'dividend', 8); }
    }
    // Ngân hàng dùng lợi nhuận bù khoản nợ xấu đã xoá: số tiền này rời khỏi lưu thông
    if (w.bank.losses > 0 && w.bank.cash > 0) {
      const c = Math.min(w.bank.losses, w.bank.cash);
      w.bank.cash -= c; w.bank.losses -= c; w.ledger.absorbed += c;
    }
    if (w.bank.cash > 1) payToHouseholds(w, w.bank, w.bank.cash * 0.5, 'dividend', 6);

    // 8. Nhà nước: trợ cấp thất nghiệp, phần dư chia đều
    const unemployed = w.households.filter((h) => h.employer === null);
    if (unemployed.length && w.gov.cash > 0) {
      const avgWage = alive.reduce((s, f) => s + f.wage, 0) / Math.max(1, alive.length);
      const each = Math.min(w.gov.cash / unemployed.length, avgWage * 0.5);
      for (const h of unemployed) transfer(w, w.gov, h, each, 'benefit');
    }
    if (w.gov.cash > w.cfg.govKeep) payToHouseholds(w, w.gov, w.gov.cash - w.cfg.govKeep, 'benefit', w.households.length);

    // 9. Phá sản và doanh nghiệp mới
    for (const f of alive) {
      if (!f.alive) continue;
      if (f.workers.length === 0 && f.cash < f.wage && !canBorrow(w, f, f.wage * 3)) {
        f.alive = false; f.deadSince = w.day;
        const big = f.debt > 300 || (f.peakWorkers || 0) >= 6;
        story(w, 'bankrupt', big ? 'major' : 'small', f.name + ' phá sản', (f.debt > 0 ? 'Không trả nổi ' + Math.round(f.debt).toLocaleString('vi-VN') + ' xu nợ, ' : '') + f.name + ' đóng cửa. Tin dữ lan trong xóm của những người chủ.', { kind: 'firm', id: f.id }, { actors: f.owners.slice() });
        for (const hid of f.owners) { const o = w.households[hid]; if (!o) continue; scare(w, o, 7); for (let k = 0; k < 3; k++) { const c = randomContact(w, o); if (c) scare(w, c, 5); } }
        memorial(w, { kind: 'ruin', firmId: f.id, name: f.name, sector: f.sector, debt: Math.round(f.debt), workers: f.peakWorkers || 0 });
        if (f.debt > 0 && f.cash > 0) repay(w, f, f.cash); // trả nợ ngân hàng trước bằng tiền còn lại
        if (f.debt > 0) {
          w.bank.loansOut -= f.debt; w.bank.writtenOff += f.debt; w.bank.losses += f.debt; w.phen.badDebt += f.debt;
          log(w, (f.sector === 'food' ? 'Lò thực phẩm' : 'Xưởng hàng') + ' #' + f.id + ' phá sản, ngân hàng xoá nợ ' + f.debt.toFixed(0) + ' xu.', 'bad');
          f.debt = 0;
        } else {
          log(w, (f.sector === 'food' ? 'Lò thực phẩm' : 'Xưởng hàng') + ' #' + f.id + ' đóng cửa.', 'bad');
        }
        if (f.cash > 0) payToHouseholds(w, f, f.cash, 'dividend', 4);
        if (f.inv > 0) f.inv = 0;
      }
    }
    const openFirm = (sector, why) => openFirmAt(w, sector, why);
    for (const f of w.firms) if (!f.alive && f.deadSince !== null && w.day - f.deadSince >= 12) f.deadSince = null;
    // Mỗi ngành luôn có tối thiểu vài doanh nghiệp: thiếu thì có người mở mới (khi ngân hàng còn cho vay)
    for (const sector of ['food', 'goods']) {
      const n = w.firms.filter((x) => x.alive && x.sector === sector).length;
      // ngành thiết yếu được ưu tiên tín dụng kể cả khi khủng hoảng niềm tin
      if (n < (sector === 'food' ? w.cfg.minFood : w.cfg.minGoods) && w.rand() < 0.25) openFirmAt(w, sector, ' thế chỗ, bằng khoản vay 250 xu', true);
    }
    // Khởi nghiệp: khi ngành đang lãi tốt và còn người tìm việc
    if (w.day % 20 === 0) {
      for (const sector of ['food', 'goods']) {
        const list = w.firms.filter((x) => x.alive && x.sector === sector);
        const max = sector === 'food' ? w.cfg.maxFood : w.cfg.maxGoods;
        if (!list.length || list.length >= max) continue;
        const margin = list.reduce((s, f) => s + f.price / (f.wage / (f.baseProd || f.prod)), 0) / list.length;
        const short = list.filter((f) => f.inv < Math.max(4, f.avgSales)).length / list.length;
        if ((margin > 1.25 || short > 0.5) && unemployedShare > 0.02 && w.rand() < 0.6) openFirm(sector, ' vì ngành đang làm ăn tốt');
      }
    }
    // dọn xác doanh nghiệp đã chết lâu
    if (w.firms.length > 40) {
      // tiền và nợ lẻ còn sót của xưởng đã đóng được kết toán trước khi xoá sổ, để sổ cái luôn khớp
      for (const f of w.firms) {
        if (f.alive || f.deadSince !== null) continue;
        if (f.debt > 0 && f.cash > 0) repay(w, f, f.cash);
        if (f.cash > 0) transfer(w, f, w.gov, f.cash, 'tax');
        if (f.debt > 0) { w.bank.loansOut -= f.debt; w.bank.writtenOff += f.debt; w.bank.losses += f.debt; f.debt = 0; }
        if (f.cash < 0) { w.gov.cash += f.cash; f.cash = 0; }
      }
      w.firms = w.firms.filter((f) => f.alive || f.deadSince !== null);
    }

    for (const h of w.households) {
      if (h.hungry === 4) cand(w, 2, 'hungry', 'Nhà ' + nameOf(h.id) + ' nhịn đói', 'Đã bốn ngày ' + nameOf(h.id) + ' không đủ tiền mua cơm.', { kind: 'house', id: Math.floor(h.id / 4) }, [h.id]);
    }
    richest(w);
    pickSmall(w);
    record(w);
    if (w.day % 360 === 0) chapter(w);
  }

  /* ----- Chương năm: mỗi năm được đặt tên theo câu chuyện lớn nhất của nó ----- */
  const cap = (t) => t.charAt(0).toUpperCase() + t.slice(1);
  function chapter(w) {
    const year = Math.round(w.day / 360), from = w.day - 360;
    const sts = w.stories.filter((s) => s.day > from && s.day <= w.day);
    const of = (t) => sts.filter((s) => s.type === t);
    const themes = [], recap = [];
    const inv = of('invention');
    if (inv.length) {
      themes.push({ score: inv.length * 1.7 + (inv.some((s) => s.seeded) ? 1 : 0), name: inv.length >= 3 ? 'những nhà phát minh' : inv[0].item.toLowerCase() });
      recap.push(inv.length + ' phát minh: ' + inv.slice(0, 4).map((s) => s.item.toLowerCase()).join(', ') + (inv.length > 4 ? '…' : ''));
    }
    const fads = w.fads.filter((f) => f.start > from && f.peakShare > 0.12).sort((a, b) => b.peakShare - a.peakShare);
    if (fads.length) {
      const f = fads[0], crashed = sts.some((s) => s.type === 'fad-crash' && s.fadId === f.id);
      themes.push({ score: 4 + f.peakShare * 8 + (crashed ? 2.5 : 0), name: 'cơn sốt ' + f.item.toLowerCase() });
      recap.push('Cơn sốt ' + f.item.toLowerCase() + ': ' + Math.round(f.peakShare * 100) + '% gia đình từng mê, giá lên gấp ' + f.maxRatio.toFixed(1).replace('.', ',') + ' lần' + (crashed ? ', rồi bong bóng vỡ' : ''));
    }
    const runs = of('bankrun').length;
    if (runs) { themes.push({ score: 7 + runs * 1.5, name: 'cơn hoảng loạn ở ' + bankOf(w) }); recap.push(runs + ' lần đám đông kéo đến ' + bankOf(w) + ' đòi tiền'); }
    const rush = of('food-rush').length;
    if (rush) { themes.push({ score: 4.5 + rush, name: 'cơn tích trữ lương thực' }); recap.push(rush + ' lần cả thành phố đổ xô tích trữ gạo'); }
    if (of('drought').length) themes.push({ score: 5.5, name: 'hạn hán' });
    const fires = of('fire');
    if (fires.length) { themes.push({ score: 2.5 + fires.length * 1.2, name: fires.length > 1 ? 'những ngọn lửa' : 'ngọn lửa ở ' + fires[0].title.replace('Hoả hoạn ở ', '') }); recap.push(fires.length + ' vụ hoả hoạn'); }
    const ships = of('airship');
    if (ships.length) { themes.push({ score: 1.5 + ships.length * 1.6, name: ships.length > 1 ? 'những chuyến khí cầu' : 'khí cầu thương nhân' }); recap.push(ships.length + ' chuyến khí cầu ghé bến'); }
    const taps = of('tap').filter((s) => s.level >= 3).length;
    if (taps) themes.push({ score: 3 + taps, name: 'bầu trời rung chuyển' });
    for (const t of EXTRA_THEMES) { const r = t(w, sts, from); if (r) { themes.push(r); if (r.line) recap.push(r.line); } }
    const bk = of('bankrupt').length, op = of('open').length;
    if (bk >= 4) themes.push({ score: bk * 0.75, name: 'những cánh cửa đóng lại' });
    recap.push(bk + ' nơi đóng cửa, ' + op + ' nơi khai trương');
    const st0 = w.stats.find((s) => s.day === from) || w.stats[0], st1 = w.stats[w.stats.length - 1];
    const yr = w.stats.filter((s) => s.day > from);
    const unemp = yr.reduce((t, s) => t + s.unemployment, 0) / Math.max(1, yr.length);
    const dp = (st1.cpi / st0.cpi - 1) * 100;
    recap.push('Giá cả ' + (dp >= 0 ? 'tăng ' : 'giảm ') + Math.abs(dp).toFixed(1).replace('.', ',') + '% cả năm, thất nghiệp trung bình ' + unemp.toFixed(1).replace('.', ',') + '%');
    let top = w.households[0];
    for (const h of w.households) if (h.cash > top.cash) top = h;
    recap.push('Người giàu nhất: ' + nameOf(top.id) + ' với ' + Math.round(top.cash).toLocaleString('vi-VN') + ' xu');
    themes.sort((a, b) => b.score - a.score);
    const theme = themes.length ? themes[0].name : 'bình yên';
    const title = 'Năm ' + year + ': ' + (themes.length ? 'Năm của ' + cap(theme) : 'Một năm bình yên');
    const lines = recap.slice(0, 6);
    const score = themes.length ? themes[0].score : 0;
    const st = story(w, 'chapter', 'epic', title, lines.slice(0, 2).join('. ') + '.', { kind: 'plaza' }, { year, theme, recap: lines, score });
    w.chapters.push({ year, day: w.day, title, theme, recap: lines, storyId: st.id, score });
    return st;
  }
  const EXTRA_THEMES = [
    (w, sts) => { const g = sts.find((s) => s.type === 'gold'), e = sts.find((s) => s.type === 'gold-end'); return g || e ? { score: 9, name: 'cơn sốt vàng', line: g ? 'Mạch vàng trên Đồi Mây' + (e ? ', rồi cạn sau ' + e.days + ' ngày' : '') : 'Mạch vàng cạn sau ' + e.days + ' ngày' } : null; },
    (w, sts) => { const s = sts.find((x) => x.type === 'epidemic'); return s ? { score: 8, name: 'trận dịch sốt', line: 'Trận dịch sốt: ' + Math.round((sts.filter((x) => x.type === 'epidemic-end').map((x) => x.peak)[0] || s.share || 0) * 100) + '% dân từng đổ bệnh cùng lúc' } : null; },
    (w, sts) => { const s = sts.find((x) => x.type === 'ponzi-flee'); return s ? { score: 7.5, name: 'kẻ hứa lãi', line: 'Kẻ hứa lãi bỏ trốn với ' + s.amount.toLocaleString('vi-VN') + ' xu của ' + s.victims + ' gia đình' } : null; },
    (w, sts) => { const n = sts.filter((x) => x.type === 'strike').length; return n ? { score: 2.5 + n * 1.3, name: n > 1 ? 'những cuộc đình công' : 'cuộc đình công', line: n + ' cuộc đình công' } : null; },
    (w, sts) => { const s = sts.find((x) => x.type === 'monopoly'); const m = sts.filter((x) => x.type === 'merger').length; return s || m ? { score: s ? 6 : 1 + m, name: s ? s.firmName + ' độc quyền' : 'những vụ thâu tóm', line: (m ? m + ' vụ thâu tóm' : '') + (s ? (m ? ', ' : '') + s.firmName + ' chiếm ' + Math.round(s.share * 100) + '% thị trường' : '') } : null; },
    (w, sts) => { const wd = sts.filter((x) => x.type === 'wedding').length, gen = sts.filter((x) => x.type === 'generation' || x.type === 'immigrants').length; return wd || gen ? { score: gen ? 2.5 + gen : 0.6 * wd, name: gen ? 'những gia đình mới' : 'những đám cưới', line: wd + ' đám cưới' + (gen ? ', ' + gen * 4 + ' gia đình mới dọn đến' : '') } : null; },
  ];

  /* =============== Mốc 3: thế giới rộng hơn =============== */
  /* ----- Dịch sốt: lây qua người gặp người, người ốm nghỉ làm, khỏi rồi thì miễn dịch một thời gian ----- */
  function startEpidemic(w, seeds, why) {
    const E = w.epi, hs = w.households;
    if (E.state !== 'none' || w.cfg.off.epidemic) return false;
    let n = 0;
    for (let k = 0; k < (seeds || 3); k++) { const h = hs[Math.floor(w.rand() * hs.length)]; if (!(h.sick > 0) && !(h.immune > 0)) { h.sick = 6 + Math.floor(w.rand() * 3); n++; } }
    Object.assign(E, { state: 'spreading', start: w.day, peak: 0, lost: 0, told: false });
    story(w, 'epidemic-start', 'major', 'Một cơn sốt lạ', (why || 'Vài người lên cơn sốt cùng lúc.') + ' Người ốm phải nằm nhà, không đi làm được.', { kind: 'plaza' }, { seeds: n });
    return true;
  }
  function epidemicDay(w) {
    const E = w.epi, hs = w.households, n = hs.length;
    let cnt = 0;
    for (const h of hs) if (h.sick > 0) cnt++;
    if (!cnt) {
      for (const h of hs) if (h.immune > 0) h.immune--;
      if (E.state !== 'none') {
        E.state = 'none'; E.cool = 540; w.sickN = 0;
        if (E.peak > 0.06) story(w, 'epidemic-end', 'major', 'Dịch sốt qua đi', 'Người ốm cuối cùng đã khỏi. Lúc cao điểm ' + Math.round(E.peak * 100) + '% dân nằm nhà; thành phố mất khoảng ' + Math.round(E.lost) + ' ngày công.', { kind: 'plaza' }, { peak: E.peak });
      } else if (E.cool > 0) E.cool--;
      else if (seasonOf(w.day) === 3 && !w.cfg.off.epidemic && w.rand() < 1 / 160) startEpidemic(w, 2, 'Mùa đông lạnh giá, vài nhà bắt đầu ho sốt.');
      return;
    }
    const beta = 0.105, newly = [];
    for (const h of hs) {
      if (!(h.sick > 0)) continue;
      for (let k = 0; k < 2; k++) { const c = randomContact(w, h); if (c && !(c.sick > 0) && !(c.immune > 0) && w.rand() < beta) newly.push([h, c]); }
    }
    for (const h of hs) { if (h.sick > 0) { h.sick--; if (h.employer !== null) E.lost++; if (h.sick === 0) h.immune = 240; } else if (h.immune > 0) h.immune--; }
    for (const [a, c] of newly) if (!(c.sick > 0)) { c.sick = 5 + Math.floor(w.rand() * 4); note(w, a, c, 'sick'); }
    cnt = 0;
    for (const h of hs) if (h.sick > 0) cnt++;
    w.sickN = cnt;
    const share = cnt / n;
    E.peak = Math.max(E.peak, share);
    if (!E.told && share > 0.1) { E.told = true; story(w, 'epidemic', 'epic', 'Dịch sốt lan khắp thành phố', Math.round(share * 100) + '% dân đang nằm nhà vì sốt. Ruộng và xưởng thiếu người, trạm xá dựng tạm trên quảng trường chật kín.', { kind: 'plaza' }, { share }); }
  }

  /* ----- Mạch vàng: tiền từ bên ngoài đổ vào, thợ bỏ ruộng bỏ xưởng lên đồi; rồi mạch cạn ----- */
  function avgWageOf(w, sector) {
    const list = w.firms.filter((f) => f.alive && f.sector !== 'gold' && (!sector || f.sector === sector));
    return list.length ? list.reduce((t, f) => t + f.wage, 0) / list.length : w.cfg.wage;
  }
  function discoverGold(w) {
    if (w.gold || w.cfg.off.gold) return null;
    const f = newFirm(w, 'gold', 0);
    f.wage = avgWageOf(w) * 1.6; f.prod = 1; f.baseProd = 1; f.price = 0;
    lend(w, f, 300);
    w.firms.push(f);
    const food = w.firms.filter((x) => x.alive && x.sector === 'food');
    w.gold = { firmId: f.id, start: w.day, yield: 1, price: avgWageOf(w) * 2.6, revenue: 0, peak: 0, foodWorkers0: food.reduce((t, x) => t + x.workers.length, 0), foodPrice0: food.reduce((t, x) => t + x.price, 0) / Math.max(1, food.length), told: {} };
    w.goldCount++;
    story(w, 'gold', 'epic', 'Mạch vàng trên Đồi Mây', 'Một người đào giếng thấy đá lấp lánh. Mỏ vàng trả lương gấp rưỡi xưởng thường, và người ta bắt đầu bỏ việc lên đồi.', { kind: 'mine' }, { actors: f.owners.slice() });
    return f;
  }
  function goldLabor(w, jobless) {
    if (!w.gold) { if (w.goldCount === 0 && w.day > 300 && !w.cfg.off.gold && (w.cfg.era == null ? 3 : w.cfg.era) >= 2 && w.rand() < 1 / 520) discoverGold(w); return; }
    const G = w.gold, f = firmById(w, G.firmId);
    if (!f || !f.alive) return;
    G.yield *= 0.9955;
    f.wage = Math.max(f.wage, avgWageOf(w) * 1.5);
    const perWorker = G.yield * G.price;
    if (perWorker > f.wage * 1.1 && f.workers.length < 24) {
      let hired = 0;
      while (hired < 3 && jobless.length) { const h = jobless.pop(); if (h.employer !== null) continue; hire(f, h); h.joblessSince = 0; hired++; }
      // lương mỏ cao: thợ ở xưởng và ruộng (khi kho lương thực còn đầy) bỏ việc lên đồi
      const src = w.firms.filter((x) => x.alive && x.workers.length > 1 && x.wage < f.wage && (x.sector === 'goods' || (x.sector === 'food' && x.inv > Math.max(4, x.avgSales * 4) * 0.6)));
      for (let k = 0; k < 2 && hired < 4 && src.length; k++) {
        const x = src[Math.floor(w.rand() * src.length)];
        if (x.workers.length <= 1) continue;
        const hid = x.workers[Math.floor(w.rand() * x.workers.length)];
        x.workers.splice(x.workers.indexOf(hid), 1); hire(f, w.households[hid]); hired++;
      }
    } else if (perWorker < f.wage * 0.95 && f.workers.length) {
      for (let k = 0; k < 2 && f.workers.length; k++) fire(w, f, f.workers[f.workers.length - 1]);
    }
    G.peak = Math.max(G.peak, f.workers.length);
    const food = w.firms.filter((x) => x.alive && x.sector === 'food'), fw = food.reduce((t, x) => t + x.workers.length, 0);
    if (!G.told.rush && f.workers.length >= 12) { G.told.rush = true; story(w, 'gold-rush', 'major', 'Cơn sốt vàng', f.workers.length + ' người đã lên Đồi Mây đào vàng. Lương khắp thành phố bị kéo lên theo, xưởng nào cũng thiếu thợ.', { kind: 'mine' }); }
    if (!G.told.farms && G.foodWorkers0 > 0 && fw < G.foodWorkers0 * 0.75) { G.told.farms = true; const fp = food.reduce((t, x) => t + x.price, 0) / Math.max(1, food.length); story(w, 'gold-farms', 'major', 'Ruộng thiếu người cày', 'Một phần tư nông dân đã bỏ ruộng theo mạch vàng. Giá lương thực ' + (fp >= G.foodPrice0 ? 'tăng ' : 'giảm ') + Math.abs(Math.round((fp / G.foodPrice0 - 1) * 100)) + '% từ ngày có mỏ.', { kind: 'farms' }); }
    if (G.yield < 0.3 || (f.workers.length === 0 && w.day - G.start > 90)) {
      const n = f.workers.length;
      while (f.workers.length) fire(w, f, f.workers[f.workers.length - 1]);
      f.alive = false; f.deadSince = w.day;
      if (f.debt > 0 && f.cash > 0) repay(w, f, f.cash);
      if (f.cash > 0) payToOwners(w, f, f.cash);
      if (f.debt > 0) { w.bank.loansOut -= f.debt; w.bank.writtenOff += f.debt; w.bank.losses += f.debt; f.debt = 0; }
      story(w, 'gold-end', 'epic', 'Mạch vàng cạn', 'Sau ' + (w.day - G.start) + ' ngày, Mỏ Vàng Đồi Mây đóng cửa, mang về cho đảo ' + Math.round(G.revenue).toLocaleString('vi-VN') + ' xu từ bên ngoài. ' + n + ' thợ mỏ mất việc cùng lúc, trong khi ruộng và xưởng đã quen thiếu người.', { kind: 'mine' }, { days: w.day - G.start, revenue: G.revenue });
      memorial(w, { kind: 'mine', revenue: Math.round(G.revenue), days: w.day - G.start, peak: G.peak });
      G.closed = w.day;
    }
  }
  function goldSales(w) {
    const G = w.gold; if (!G || G.closed) return;
    const f = firmById(w, G.firmId); if (!f || !f.alive) return;
    const out = { key: 'outside', cash: 0 };
    if (f.inv > 0) {
      const rev = f.inv * G.price;
      f.cash += rev; w.ledger.inflow += rev; G.revenue += rev; f.sold += f.inv; f.inv = 0;
      flow(w, out, f, rev, 'export');
    }
    // vàng kéo theo hàng ngoại: thương lái bán gương, lụa, đồng hồ cho người vừa giàu lên, tiền theo họ ra khỏi đảo
    const food = w.firms.filter((x) => x.alive && x.sector === 'food');
    const fp = food.length ? food.reduce((t, x) => t + x.price, 0) / food.length : 1;
    let spent = 0;
    for (const h of w.households) {
      const extra = h.cash - fp * 40;
      if (extra > 0) { const a = extra * 0.045; h.cash -= a; spent += a; }
    }
    w.ledger.outflow += spent; G.imports = (G.imports || 0) + spent;
    if (spent > 0) flow(w, { key: 'h0' }, out, spent, 'import');
    if (!G.told.imports && G.imports > 1500) { G.told.imports = true; story(w, 'gold-imports', 'small', 'Hàng ngoại theo vàng về đảo', 'Thương lái từ bên ngoài bán gương, lụa và đồng hồ cho những người vừa giàu lên nhờ vàng. Tiền vàng lại theo họ rời đảo.', { kind: 'mine' }); }
  }

  /* ----- Kẻ hứa lãi: một người lạ xuống từ khí cầu, trả lãi cũ bằng tiền góp mới, rồi bỏ trốn ----- */
  const STRANGERS = ['Lão Kim Tuyến', 'Bà Ngân Lụa', 'Ông Bạch Kim', 'Cô Hoàng Ngọc'];
  function startPonzi(w) {
    if (w.ponzi && w.ponzi.state === 'open') return null;
    const name = STRANGERS[(w.ponziCount = (w.ponziCount || 0) + 1) % STRANGERS.length];
    w.ponzi = { state: 'open', name, start: w.day, agent: { key: 'ponzi', cash: 0 }, pool: 0, paid: 0, investors: [], life: 60 + Math.floor(w.rand() * 50) };
    const hs = w.households;
    for (let k = 0; k < 5; k++) { const h = hs[Math.floor(w.rand() * hs.length)]; h.greed = 10; }
    story(w, 'ponzi', 'major', name + ' hứa lãi ba phần trăm mỗi tuần', name + ' xuống từ khí cầu, dựng một chiếc lều sặc sỡ trên quảng trường và hứa ai gửi tiền sẽ được trả lãi ba phần trăm mỗi tuần.', { kind: 'ponzi' }, { name });
    return w.ponzi;
  }
  function invest(w, h, foodPrice) {
    const P = w.ponzi, amt = Math.round(Math.max(0, h.cash - foodPrice * 12) * 0.4);
    if (amt < 5) return;
    transfer(w, h, P.agent, amt, 'invest');
    h.invested = amt; P.pool += amt; P.investors.push(h.id);
  }
  function ponziDay(w) {
    if (w.ponziCool > 0) w.ponziCool--;
    const P = w.ponzi;
    if (!P || P.state !== 'open') return;
    const hs = w.households;
    // chuyện "được trả lãi thật" lan nhanh nhất ngay sau mỗi kỳ trả lãi
    const beta = 0.04 + (P.paid > 0 ? 0.08 : 0) + 0.15 * (P.investors.length / hs.length), newly = [];
    for (const h of hs) {
      if (!(h.greed > 0)) continue;
      const c = randomContact(w, h);
      if (c && !(c.greed > 0) && !c.invested && w.rand() < beta) newly.push([h, c]);
    }
    for (const h of hs) if (h.greed > 0) h.greed--;
    for (const [a, c] of newly) { c.greed = 8; note(w, a, c, 'greed'); }
    // mỗi tuần trả "lãi" cho người góp trước bằng tiền của người góp sau
    if ((w.day - P.start) % 7 === 6) {
      let due = 0;
      for (const id of P.investors) due += hs[id].invested * 0.03;
      if (due > P.agent.cash * 0.6 || w.day - P.start > P.life) return fleePonzi(w);
      for (const id of P.investors) { const h = hs[id], r = h.invested * 0.03; transfer(w, P.agent, h, r, 'return'); P.paid += r; }
      if (P.investors.length >= 6 && !P.told) { P.told = true; story(w, 'ponzi-grow', 'small', P.investors.length + ' gia đình đã góp tiền cho ' + P.name, 'Ai góp sớm đều được trả lãi đúng hẹn. Hàng xóm nhìn thấy, và hàng người trước chiếc lều mỗi ngày một dài.', { kind: 'ponzi' }); }
    }
  }
  function fleePonzi(w) {
    const P = w.ponzi, hs = w.households;
    const amt = P.agent.cash;
    P.agent.cash = 0; w.ledger.outflow += amt; P.state = 'fled'; P.fled = w.day; P.amount = Math.round(amt);
    let worst = 0;
    for (const id of P.investors) { const h = hs[id]; worst = Math.max(worst, h.invested); scare(w, h, 8); h.invested = 0; }
    for (const h of hs) h.greed = 0;
    w.ponziCool = 360;
    story(w, 'ponzi-flee', 'epic', P.name + ' bỏ trốn', 'Một đêm, chiếc lều trên quảng trường trống trơn. ' + P.name + ' bay đi mang theo ' + P.amount.toLocaleString('vi-VN') + ' xu của ' + P.investors.length + ' gia đình. Người góp nhiều nhất mất ' + Math.round(worst).toLocaleString('vi-VN') + ' xu.', { kind: 'ponzi' }, { amount: P.amount, victims: P.investors.length, name: P.name });
  }

  /* ----- Đình công: giá lên mà lương đứng yên, hay xưởng lãi to mà trả lương thấp ----- */
  function strikeDay(w, alive) {
    const st = w.stats, n = st.length;
    const infl60 = n > 61 ? st[n - 1].cpi / st[n - 61].cpi - 1 : 0;
    for (const f of alive) {
      if (f.sector === 'gold') continue;
      if (f.strike > 0) { f.strike--; if (f.strike === 0) endStrike(w, f); continue; }
      if (f.strikeCool > 0) { f.strikeCool--; continue; }
      if (f.workers.length < 5 || w.cfg.off.strike || (w.cfg.era == null ? 3 : w.cfg.era) < 3) continue;
      const unitCost = f.wage / Math.max(0.1, f.baseProd || f.prod), avg = avgWageOf(w, f.sector);
      const why = [];
      if (infl60 > 0.06 && f.wage <= (f.wage0 || f.wage) * 1.02) why.push('Giá cả tăng ' + Math.round(infl60 * 100) + '% trong hai tháng mà lương vẫn đứng yên.');
      if (f.price > unitCost * 1.55 && f.cash > payrollOf(w, f) * 12) why.push(f.name + ' lãi to, chủ nhận cổ tức đều đặn, còn lương thợ thì không tăng.');
      if (f.wage < avg * 0.9) why.push('Lương ở đây thấp hơn hẳn các xưởng khác.');
      if (w.lastStrike && w.day - w.lastStrike.day < 25 && w.lastStrike.firmId !== f.id) why.push('Thợ ở ' + w.lastStrike.name + ' vừa đình công.');
      if (w.day % 30 === 0) f.wage0 = f.wage;
      if (why.length >= 2 && w.rand() < 0.005 * why.length) {
        f.strike = 4 + Math.floor(w.rand() * 5); f.strikeLen = f.strike; f.strikeWage = f.wage;
        w.lastStrike = { day: w.day, firmId: f.id, name: f.name };
        story(w, 'strike', 'major', 'Thợ ở ' + f.name + ' đình công', why.slice(0, 2).join(' ') + ' ' + f.workers.length + ' người bỏ búa, đứng trước cửa xưởng.', { kind: 'firm', id: f.id }, { actors: f.workers.slice(0, 4) });
      }
    }
  }
  function endStrike(w, f) {
    f.strikeCool = 150;
    if (f.cash > payrollOf(w, f) * 6) {
      const r = 0.08 + w.rand() * 0.07;
      f.wage *= 1 + r; f.wage0 = f.wage;
      story(w, 'strike-end', 'small', 'Thợ ở ' + f.name + ' thắng', 'Sau ' + f.strikeLen + ' ngày đình công, lương tăng ' + Math.round(r * 100) + '%. Lò lại đỏ lửa.', { kind: 'firm', id: f.id });
    } else {
      for (let k = 0; k < 2 && f.workers.length > 1; k++) fire(w, f, f.workers[Math.floor(w.rand() * f.workers.length)]);
      story(w, 'strike-end', 'small', 'Thợ ở ' + f.name + ' quay lại làm', 'Xưởng không còn tiền để tăng lương. Sau ' + f.strikeLen + ' ngày, thợ quay lại, hai người cầm đầu bị cho nghỉ.', { kind: 'firm', id: f.id });
    }
  }

  /* ----- Thâu tóm và độc quyền ----- */
  function marketPowerDay(w) {
    if (w.cfg.off.market || (w.cfg.era == null ? 3 : w.cfg.era) < 3) return;
    for (const sector of ['goods', 'food']) {
      const list = w.firms.filter((f) => f.alive && f.sector === sector);
      if (list.length < 2) continue;
      const total = list.reduce((t, f) => t + f.avgSales, 0) || 1;
      let lead = list[0];
      for (const f of list) if (f.avgSales > lead.avgSales) lead = f;
      const share = lead.avgSales / total;
      // nơi lớn nhất mua lại một đối thủ đang chìm trong nợ
      // chỉ nơi còn vừa sức quản lý mới mua thêm, và chỉ mua những xưởng nhỏ
      if (share > 0.3 && lead.cash > 500 && !lead.strike && lead.workers.length < 16) {
        const weak = list.find((f) => f !== lead && f.debt > 120 && f.cash < f.wage * Math.max(1, f.workers.length) * 3 && f.workers.length > 0 && f.workers.length <= 6 && !(f.downUntil > w.day));
        if (weak && lead.cash > weak.debt * 1.2 + 200 && w.rand() < 0.2) acquire(w, lead, weak);
      }
      // phải giữ hơn nửa thị trường suốt một tháng mới thành độc quyền
      for (const f of list) f.dom = f === lead && share > 0.55 ? (f.dom || 0) + 1 : 0;
      const cool = (w.monoEnd || {})[sector] || -999;
      if (!lead.monopoly && lead.dom >= 3 && list.length >= 4 && w.day - cool > 300 && !list.some((f) => f.monopoly)) {
        lead.monopoly = true; lead.monoDay = w.day;
        story(w, 'monopoly', 'epic', lead.name + ' thâu tóm thị trường', lead.name + ' giờ bán ' + Math.round(share * 100) + '% ' + (sector === 'food' ? 'lương thực' : 'hàng hoá') + ' của cả đảo. Không còn ai đủ sức cạnh tranh, giá của nơi này bắt đầu nhích lên từng ngày.', { kind: 'firm', id: lead.id }, { firmName: lead.name, share });
      }
      for (const f of list) if (f.monopoly && f.avgSales / total < 0.3 && w.day - f.monoDay > 60) {
        f.monopoly = false; (w.monoEnd = w.monoEnd || {})[sector] = w.day;
        story(w, 'monopoly-end', 'major', 'Thị trường mở lại', 'Những xưởng mới giành lại khách của ' + f.name + '. Giá bắt đầu hạ.', { kind: 'firm', id: f.id });
      }
    }
  }
  function acquire(w, buyer, target) {
    const debt = target.debt;
    transfer(w, buyer, target, debt + 1, 'merger');
    repay(w, target, target.debt);
    const n = target.workers.length;
    for (const hid of target.workers.slice()) { target.workers.splice(target.workers.indexOf(hid), 1); hire(buyer, w.households[hid]); }
    if (target.cash > 0) transfer(w, target, buyer, target.cash, 'merger');
    buyer.inv += Math.max(0, target.inv); target.inv = 0;
    target.alive = false; target.deadSince = w.day; target.merged = buyer.id;
    story(w, 'merger', 'major', buyer.name + ' mua lại ' + target.name, buyer.name + ' trả hết ' + Math.round(debt).toLocaleString('vi-VN') + ' xu nợ của ' + target.name + ' và nhận ' + n + ' người thợ về làm.', { kind: 'firm', id: buyer.id }, { targetId: target.id });
  }

  /* ----- Dân số: đám cưới, thế hệ mới, người nhập cư ----- */
  function socialDay(w) {
    if (w.cfg.off.social) return;
    const hs = w.households, S = w.social;
    if (w.rand() < 1 / 50) {
      const a = hs[Math.floor(w.rand() * hs.length)], b = randomContact(w, a);
      if (b && a.partner < 0 && b.partner < 0 && Math.floor(a.id / 4) !== Math.floor(b.id / 4)) {
        a.partner = b.id; b.partner = a.id; a.wedDay = b.wedDay = w.day; S.couples++;
        story(w, 'wedding', 'small', 'Đám cưới của ' + nameOf(a.id) + ' và ' + nameOf(b.id), 'Cả xóm kéo nhau đi đưa dâu. Hoa rải từ nhà ' + nameOf(a.id) + ' sang nhà ' + nameOf(b.id) + '.', { kind: 'house', id: Math.floor(a.id / 4) }, { actors: [a.id, b.id], from: Math.floor(a.id / 4), to: Math.floor(b.id / 4) });
      }
    }
    // các cặp đã cưới có con; đủ bốn đứa trẻ lớn lên thì một thế hệ mới dọn ra ở riêng
    if (S.couples && w.rand() < (S.couples * (w.cfg.growth || 1)) / 1500) {
      const parents = hs.filter((h) => h.partner >= 0 && w.day - (h.wedDay || 0) > 200);
      if (parents.length) {
        const p = parents[Math.floor(w.rand() * parents.length)];
        S.babies++;
        cand(w, 2, 'baby', 'Nhà ' + nameOf(p.id) + ' đón em bé', nameOf(p.id) + ' và ' + nameOf(p.partner) + ' vừa có con đầu lòng.', { kind: 'house', id: Math.floor(p.id / 4) }, [p.id, p.partner]);
        if (S.babies % 4 === 0 && hs.length + 4 <= 300) {
          const rich = hs.slice().sort((x, y) => y.cash - x.cash).slice(0, 8);
          const added = addHouseholds(w, 4, 0, true);
          for (const h of added) { const giver = rich[Math.floor(w.rand() * rich.length)]; transfer(w, giver, h, Math.min(40, giver.cash * 0.2), 'gift'); }
          S.generations++;
          story(w, 'generation', 'major', 'Một thế hệ mới dọn ra ở riêng', 'Bốn người trẻ lớn lên trên đảo, cha mẹ góp tiền dựng cho họ một ngôi nhà mới. Họ bắt đầu đi tìm việc.', { kind: 'house', id: Math.floor(added[0].id / 4) }, { actors: added.map((h) => h.id) });
        }
      }
    }
  }
  // Những gì khí cầu mang theo: người lạ ở lại hứa lãi, một cơn sốt lạ, hoặc vài gia đình muốn lập nghiệp
  function arrivalGuests(w) {
    const hs = w.households, n = hs.length;
    const ue = hs.filter((h) => h.employer === null).length / n;
    const off = w.cfg.off, r1 = off.social ? 1 : w.rand(), r2 = off.epidemic ? 1 : w.rand(), r3 = off.ponzi ? 1 : w.rand();
    return () => {
      if (ue < 0.05 && r1 < 0.5 && n + 4 <= 300) {
        const added = addHouseholds(w, 4, 70, true);
        w.social.immigrants += 4;
        story(w, 'immigrants', 'major', 'Bốn gia đình theo khí cầu đến lập nghiệp', 'Nghe nói trên đảo ai cũng có việc làm, họ mang theo ' + (4 * 70) + ' xu tiền dành dụm và dựng nhà gần quảng trường.', { kind: 'house', id: Math.floor(added[0].id / 4) }, { actors: added.map((h) => h.id) });
      }
      if (r2 < 0.18 && w.epi.state === 'none' && w.epi.cool === 0) startEpidemic(w, 3, 'Vài người khách trên khí cầu mang theo một cơn sốt lạ.');
      if (r3 < 0.3 && w.ponziCool === 0 && !(w.ponzi && w.ponzi.state === 'open') && !w.cfg.off.ponzi) startPonzi(w);
    };
  }

  /* ----- Công cụ của người giữ bể ----- */
  // Gõ vào kính: người ở gần giật mình; gõ liên tiếp thì nỗi sợ lan rộng hơn
  function tapGlass(w, ids) {
    const K = w.keeper, hs = w.households;
    if (K.lastTap === w.day) return { ok: false, reason: 'same-day', level: K.tapLevel };
    K.tapLevel = w.day - K.lastTap <= 6 ? Math.min(4, K.tapLevel + 1) : 1;
    K.lastTap = w.day;
    const lv = K.tapLevel, share = [0.35, 0.65, 1, 1][lv - 1], days = [3, 5, 8, 10][lv - 1];
    let n = 0;
    for (const id of ids || []) if (hs[id] && w.rand() < share && scare(w, hs[id], days)) n++;
    if (lv >= 3) for (let i = 0; i < Math.round(hs.length * (lv === 3 ? 0.08 : 0.16)); i++) if (scare(w, hs[Math.floor(w.rand() * hs.length)], days)) n++;
    const T = [
      ['Tiếng gõ trên vòm trời', 'Một tiếng cộc vang khắp đảo. ' + n + ' người ngước lên nhìn bầu trời, hơi chột dạ.'],
      ['Lại tiếng gõ trên vòm trời', 'Tiếng gõ thứ hai. ' + n + ' người bỏ dở việc, bàn tán xem điềm gì sắp đến.'],
      ['Bầu trời rung chuyển', 'Vòm kính rung lên từng hồi. ' + n + ' người hoảng sợ, có người bắt đầu nghĩ đến chuyện rút hết tiền ở ' + bankOf(w) + '.'],
      ['Ngày tận thế?', 'Vòm trời rung như sắp vỡ. ' + n + ' người tin rằng tai hoạ đang đến.'],
    ][lv - 1];
    story(w, 'tap', lv >= 3 ? 'major' : 'small', T[0], T[1], { kind: 'plaza' }, { level: lv, scared: n });
    return { ok: true, level: lv, scared: n };
  }
  // Thì thầm tin đồn: 'bank' (Kho Bạc sắp vỡ) và 'food' (sắp mất mùa) gieo vào một ngôi nhà, 'fad' (món mới) gieo vào một xưởng
  const WHISPER_ITEMS = ['Mũ lông vũ', 'Vòng tay vỏ ốc', 'Đèn đom đóm', 'Quạt giấy bướm', 'Gương soi trăng', 'Bút lông chim', 'Chuông bạc tí hon'];
  function whisper(w, kind, target) {
    const K = w.keeper, hs = w.households;
    if (w.day < K.whisperReady) return { ok: false, reason: 'wait', wait: K.whisperReady - w.day };
    if (kind === 'fad') {
      const f = firmById(w, target);
      if (!f || !f.alive || f.sector !== 'goods') return { ok: false, reason: 'target' };
      if (activeFad(w)) return { ok: false, reason: 'fad' };
      const used = w.fads.map((x) => x.item), pool = WHISPER_ITEMS.filter((x) => !used.includes(x));
      const item = pool.length ? pool[Math.floor(w.rand() * pool.length)] : 'Món hàng mới số ' + (w.fadSeq + 1);
      const fad = startFad(w, f, item, 'Có lời thì thầm rằng ' + f.name + ' vừa làm ra ' + item.toLowerCase() + ', thứ mà ai có rồi cũng phải khoe. Những người thợ là người đầu tiên tin.');
      if (!fad) return { ok: false, reason: 'fad' };
      K.whisperReady = w.day + 20;
      return { ok: true, kind, item, fad };
    }
    const house = +target, members = [0, 1, 2, 3].map((k) => hs[house * 4 + k]).filter(Boolean);
    if (!members.length) return { ok: false, reason: 'target' };
    let n = 0;
    if (kind === 'bank') {
      for (const h of members) { if (scare(w, h, 10)) n++; for (let k = 0; k < 2; k++) { const c = randomContact(w, h); if (c && scare(w, c, 6)) n++; } }
      story(w, 'rumor', 'small', 'Lời thì thầm ở nhà ' + nameOf(members[0].id), 'Có ai đó thì thầm rằng ' + bankOf(w) + ' sắp không trả nổi tiền. ' + n + ' người đã tin. Lời đồn có lan ra hay không là chuyện của cả xóm.', { kind: 'house', id: house }, { whisper: 'bank', actors: members.map((h) => h.id) });
    } else if (kind === 'food') {
      if (w.cfg.off.foodRumor) return { ok: false, reason: 'off' };
      n = seedFoodRumor(w, 0, members);
      for (const h of members) { const c = randomContact(w, h); if (c) n += seedFoodRumor(w, 0, [c]); }
      story(w, 'rumor-food', 'small', 'Lời thì thầm ở nhà ' + nameOf(members[0].id), 'Có ai đó thì thầm rằng năm nay sắp mất mùa. ' + n + ' người vội đi mua gạo để dành.', { kind: 'house', id: house }, { whisper: 'food', actors: members.map((h) => h.id) });
    } else return { ok: false, reason: 'kind' };
    K.whisperReady = w.day + 20;
    return { ok: true, kind, believers: n };
  }
  // Gọi khí cầu: thắp đèn hiệu trên bến, đoàn thương nhân đến ngay hôm sau; 90 ngày mới gọi lại được
  function callAirship(w) {
    const a = w.airship, K = w.keeper;
    if (a.state === 'docked') return { ok: false, reason: 'docked' };
    if (w.day < K.callReady) return { ok: false, reason: 'wait', wait: K.callReady - w.day };
    K.callReady = w.day + 90; a.called = true; a.cool = 0;
    return { ok: true };
  }

  /* Mở một doanh nghiệp mới, vốn khởi nghiệp vay từ ngân hàng. Dùng cho khởi nghiệp tự nhiên và cho người chơi xây. */
  function openFirmAt(w, sector, why, force) {
    if (!force && w.phen.panic > 0) return null; // khủng hoảng niềm tin: không ai được vay để khởi nghiệp
    const nf = newFirm(w, sector, 0);
    lend(w, nf, 250);
    w.firms.push(nf);
    story(w, 'open', 'small', nf.name + ' khai trương', nameOf(nf.owners[0]) + ' và hai người bạn mở ' + nf.name + (why || '') + '.', { kind: 'firm', id: nf.id }, { actors: nf.owners.slice() });
    return nf;
  }

  /* Dân nhập cư: n gia đình mới mang theo tiền tiết kiệm từ bên ngoài đảo (sổ cái ghi là dòng tiền vào). */
  function addHouseholds(w, n, savings, quiet) {
    const added = [];
    savings = savings || 0;
    for (let k = 0; k < n; k++) {
      const id = w.households.length;
      const h = newHousehold(id, savings, w.rand());
      w.households.push(h);
      added.push(h);
    }
    w.ledger.inflow = (w.ledger.inflow || 0) + n * savings;
    if (!quiet) log(w, n + ' gia đình mới chuyển đến thành phố.', 'good');
    return added;
  }

  // Hỏi giá vài nơi rồi chọn nơi rẻ nhất; nếu cần thiết (thực phẩm) thì đi khắp chợ trước khi chịu đói
  function cheapestOf(w, list, mustFind) {
    let best = null;
    for (let k = 0; k < 3 && list.length; k++) {
      const f = list[Math.floor(w.rand() * list.length)];
      if (f.inv >= 1 && (!best || f.price < best.price)) best = f;
    }
    if (!best && mustFind) for (const f of list) if (f.inv >= 1 && (!best || f.price < best.price)) best = f;
    return best;
  }

  function payToHouseholds(w, from, amt, kind, n) {
    if (!(amt > 0)) return;
    const hs = w.households;
    n = Math.min(n, hs.length);
    const each = amt / n;
    for (let i = 0; i < n; i++) transfer(w, from, hs[Math.floor(w.rand() * hs.length)], each, kind);
  }

  /* ---------- Số liệu ---------- */
  function gini(values) {
    const v = values.slice().sort((a, b) => a - b);
    const n = v.length;
    let sum = 0, cum = 0;
    for (let i = 0; i < n; i++) { sum += v[i]; cum += (i + 1) * v[i]; }
    if (sum <= 0) return 0;
    return (2 * cum) / (n * sum) - (n + 1) / n;
  }

  function record(w) {
    const alive = w.firms.filter((f) => f.alive);
    const avg = (arr, fn) => (arr.length ? arr.reduce((s, x) => s + fn(x), 0) / arr.length : 0);
    const foodP = avg(alive.filter((f) => f.sector === 'food'), (f) => f.price);
    const goodsP = avg(alive.filter((f) => f.sector === 'goods'), (f) => f.price);
    // rổ giá dùng giá trung vị của hàng hoá: một món đang sốt giá gấp 5 lần không phải là lạm phát của cả thành phố
    const gp = alive.filter((f) => f.sector === 'goods').map((f) => f.price).sort((a, b) => a - b);
    const goodsMed = gp.length ? (gp.length % 2 ? gp[(gp.length - 1) / 2] : (gp[gp.length / 2 - 1] + gp[gp.length / 2]) / 2) : 0;
    const basket = foodP + goodsMed;
    if (w.basePrice === null) w.basePrice = basket;
    const unemployed = w.households.filter((h) => h.employer === null).length;
    const gdp = w.flows.filter((x) => x.kind === 'buy').reduce((s, x) => s + x.amt, 0);
    w.stats.push({
      day: w.day,
      cpi: (basket / w.basePrice) * 100,
      unemployment: (unemployed / w.households.length) * 100,
      money: totalMoney(w),
      debt: w.bank.loansOut,
      gini: gini(w.households.map((h) => Math.max(0, h.cash))),
      hungry: w.households.filter((h) => !h.ateToday).length,
      gdp, firms: alive.length, foodPrice: foodP, goodsPrice: goodsP,
      fear: (w.fearShare || 0) * 100, hype: activeFad(w) ? activeFad(w).share * 100 : 0,
    });
    if (w.stats.length > 2000) w.stats.shift();
  }

  /* ---------- Bàn tay người chơi ---------- */
  function printMoney(w, amount) {
    w.ledger.printed += amount;
    w.gov.cash += amount;
    payToHouseholds(w, w.gov, amount, 'print', w.households.length);
    log(w, 'Ngân hàng trung ương in ' + amount.toLocaleString('vi-VN') + ' xu và phát cho mọi hộ.', 'policy');
  }
  // Rót tiền thẳng vào kho bạc (dùng cho thí nghiệm và chế độ thử): sổ cái ghi là tiền in thêm
  function grantTreasury(w, amount) { w.ledger.printed += amount; w.gov.cash += amount; }
  function setPolicy(w, key, value) {
    w.policy[key] = value;
    const names = { interestRate: 'Lãi suất', taxRate: 'Thuế thu nhập', minWage: 'Lương tối thiểu' };
    const shown = key === 'minWage' ? value + ' xu/ngày' : Math.round(value * 100) + '%';
    log(w, names[key] + ' đổi thành ' + shown + '.', 'policy');
  }

  /* In tiền và chuyển thẳng cho một nhóm tác nhân (dùng cho sự kiện: hỗ trợ nông dân, thưởng Tết...). */
  function fund(w, targets, amount, kind) {
    if (!(amount > 0) || !targets.length) return;
    w.ledger.printed += amount;
    w.gov.cash += amount;
    const each = amount / targets.length;
    for (const t of targets) transfer(w, w.gov, t, each, kind || 'print');
  }

  /* =============== Sáu miền đất: thế giới của sáu thành phố =============== */
  // Thứ tự trên vòng: mỗi miền nối với hai miền bên cạnh bằng một cây cầu
  const TERRAINS = [
    { key: 'plains', land: 'Đồng bằng', city: 'Lúa Vàng', food: 1.15, goods: 0.95, settle: 3, from: 'Từ phương xa, một bộ lạc nhỏ theo dòng sông tìm đến đồng bằng và dựng những túp lều đầu tiên.' },
    { key: 'forest', land: 'Rừng', city: 'Thông Xanh', food: 1.0, goods: 1.1, settle: 90, from: 'Một nhóm thợ săn chèo bè qua biển trong sang khu rừng già, dựng lều giữa những gốc thông.' },
    { key: 'mountain', land: 'Núi', city: 'Đá Mây', food: 0.85, goods: 1.15, settle: 240, from: 'Những người tìm đá lửa leo lên thung lũng giữa các đỉnh núi và ở lại.' },
    { key: 'tundra', land: 'Băng nguyên', city: 'Tuyết Trắng', food: 0.82, goods: 0.95, settle: 420, from: 'Một bộ lạc chịu lạnh dựng lều da trên băng nguyên, sống nhờ săn bắt và câu cá dưới lớp băng.' },
    { key: 'coast', land: 'Biển', city: 'Cửa Sóng', food: 1.05, goods: 1.0, settle: 330, from: 'Những người đánh cá men theo bờ cát, dựng nhà sàn bên vịnh nước xanh.' },
    { key: 'desert', land: 'Sa mạc', city: 'Cát Hồng', food: 0.82, goods: 1.0, settle: 150, from: 'Một đoàn người theo dấu nước tìm thấy ốc đảo giữa sa mạc và dừng chân.' },
  ];
  const ERA_TEXT = [
    '',
    'Những túp lều lá nhường chỗ cho nhà gạch bùn. Người ta đúc những đồng xu đầu tiên và dựng đền trên quảng trường.',
    'Cối xay gió quay trên đồng, lò rèn đỏ lửa, một toà thành đá mọc lên giữa phố.',
    'Phố xá lát đá, nhà ba tầng sơn màu, Kho Bạc mở cửa và khí cầu bắt đầu ghé bến.',
    'Ống khói nhà máy vươn lên trời, nhà gạch đỏ san sát, lương thợ và giá cả bắt đầu chạy đua.',
    'Những toà tháp kính mọc lên, đêm thành phố sáng rực, tuabin gió quay trên cánh đồng.',
    'Bệ phóng mọc bên bờ biển, vệ tinh lấp lánh trên vòm kính, nhà máy điện hạt nhân thắp sáng cả miền.',
    'Robot đi giữa phố cùng người, máy bay không người lái chở hàng, những toà tháp tự sửa mình trong đêm.',
    'Những ngôi nhà tự mọc lên như san hô. Vật chất nghe lời người, đường ráp trên tường phát sáng.',
    'Một mặt trời nhỏ được thắp ngay trong vòm kính. Các tầng nhà tách ra, lơ lửng giữa những vòng năng lượng.',
    'Cổng không gian mở ra thay cho cầu. Nhà xoắn theo chiều cao, bóng vọng của chính nó lơ lửng bên cạnh.',
    'Thành phố hoá thành ánh sáng. Người trong bể không còn cần vách kính, và bắt đầu nói chuyện với vị thần.',
  ];
  const BRIDGE_TEXT = ['cầu dây leo', 'cầu gỗ trên trụ đá', 'cầu vòm đá', 'cầu có mái che và đèn', 'cầu sắt', 'cầu dây văng', 'cầu treo có tàu đệm từ', 'cầu năng lượng', 'cầu vòm nano tự mọc', 'lối đi lơ lửng', 'cặp cổng không gian', 'cầu ánh sáng'];
  const BRIDGE_CAP = [2, 4, 6, 9, 13, 18, 24, 32, 42, 54, 68, 84]; // số món hàng mỗi ngày mỗi chiều, theo thời đại của cây cầu

  function createWorld(opts) {
    opts = opts || {};
    const seed = opts.seed == null ? 7 : opts.seed, god = opts.mode === 'god', war = opts.mode === 'war' || (god && opts.war !== false);
    const W = {
      seed, day: 0, rand: makeRng(seed * 7919 + 13), mode: god ? 'god' : war ? 'war' : 'watch',
      cfg: Object.assign({ start: 28, growth: 2.2, inventRate: 1 / 110, settle: war && !god ? [1, 2, 3, 4, 5, 6] : null, off: {}, pace: god ? { end: 3240, lead: 2980, last: 3080, lastSettle: 190, settleScale: 0.45 } : null }, opts),
      cities: TERRAINS.map((t, i) => ({ id: i, terrain: t, name: t.city, era: 0, settled: false, w: null, learned: 0, founded: -1, owner: i })),
      // cầu chưa có: phải có người bỏ tiền ra bắc
      bridges: TERRAINS.map((t, i) => ({ id: i, a: i, b: (i + 1) % TERRAINS.length, level: -1, era: -1, build: null, traded: 0, firstTrade: false })),
      stories: [], storySeq: 0, trade: [], tradeTotal: 0, chapters: [],
    };
    seaInit(W);
    warInit(W, war, god ? -1 : opts.player == null ? (war ? 0 : -1) : opts.player);
    godInit(W);
    return W;
  }
  function wstory(W, type, tier, title, text, place, extra) {
    const st = Object.assign({ id: ++W.storySeq, day: W.day, type, tier, title, text, place: place || null, world: true }, extra || {});
    W.stories.push(st);
    if (W.stories.length > 400) W.stories.shift();
    return st;
  }
  const knowledgeOf = (c) => (c.w ? c.w.inventions.length : 0) + c.learned;
  function settle(W, i, n) {
    const c = W.cities[i];
    if (c.settled) return null;
    const t = c.terrain, k = n || W.cfg.start;
    const w = create({
      seed: W.seed * 131 + i * 17 + 1, households: k, foodFirms: 2, goodsFirms: 2, householdCash: 60, firmCash: 300,
      foodProd: DEFAULTS.foodProd * t.food, goodsProd: DEFAULTS.goodsProd * t.goods,
      minFood: 2, minGoods: 2, maxFood: 4, maxGoods: 5, era: 0, inventRate: W.cfg.inventRate, growth: W.cfg.growth,
      off: Object.assign({}, W.cfg.off),
    });
    w.day = W.day - 1; // bước tới đây sẽ khớp ngày của thế giới
    w.boost = { food: 1, goods: 1 };
    // chia việc theo nhu cầu thật: chỉ cần đủ người làm ra lương thực, số còn lại làm hàng hoá
    const food = w.firms.filter((f) => f.sector === 'food'), goods = w.firms.filter((f) => f.sector === 'goods');
    const need = Math.ceil((k * 1.12) / (w.cfg.foodProd * 1.05));
    let fw = food.reduce((t2, f) => t2 + f.workers.length, 0), gi = 0;
    while (fw > need) {
      const f = food.reduce((a, b) => (b.workers.length > a.workers.length ? b : a));
      const hid = f.workers.pop(); const g = goods[gi++ % goods.length]; g.workers.push(hid); w.households[hid].employer = g.id; fw--;
    }
    // kỳ vọng bán hàng ban đầu theo đúng số miệng ăn, để không nơi nào tuyển thừa rồi sa thải hàng loạt
    for (const f of food) { f.avgSales = k / food.length; f.inv = f.avgSales * 2; }
    for (const f of goods) { f.avgSales = (k * 1.3) / goods.length; f.inv = f.avgSales * 1.5; }
    w.cityId = i; w.cityName = c.name;
    c.w = w; c.settled = true; c.founded = W.day;
    // bến cá: ba người của ruộng lớn nhất ra biển đánh cá từ ngày đầu, phần cá bù vào phần lúa
    const crew = [];
    for (let m = 0; m < 3; m++) {
      const f = food.reduce((a, b) => (b.workers.length > a.workers.length ? b : a));
      if (f.workers.length <= 1) break;
      crew.push(f.workers.pop());
    }
    openFishery(W, c, crew);
    cityWarInit(W, c);
    pillarInit(c); dmgInit(c); huntInit(c);
    c.faith = FAITH_BASE[0] * 0.8;
    const near = W.cities.filter((x) => x.settled && x !== c && W.bridges.some((b) => b.level >= 0 && ((b.a === i && b.b === x.id) || (b.b === i && b.a === x.id))));
    wstory(W, 'settle', 'epic', c.name + ': những người đầu tiên', t.from, { kind: 'land', city: i }, { city: i, from: near.length ? near[0].id : -1, households: k });
    return c;
  }
  // số nơi làm ăn tối thiểu và tối đa lớn dần theo dân số
  function scaleLimits(w) {
    const n = w.households.length;
    w.cfg.minFood = Math.max(2, Math.round(n / 40)); w.cfg.minGoods = Math.max(2, Math.round(n / 32));
    w.cfg.maxFood = Math.max(3, Math.round(n / 15)); w.cfg.maxGoods = Math.max(4, Math.round(n / 12));
  }
  function avgPrice(w, sector) {
    const l = w.firms.filter((f) => f.alive && f.sector === sector);
    return l.length ? l.reduce((t, f) => t + f.price, 0) / l.length : 0;
  }
  // Buôn bán giữa hai thành phố (qua cầu hoặc bằng tàu): hàng đi từ nơi rẻ sang nơi đắt, tiền đi ngược lại; sổ cái mỗi bên ghi tiền vào và tiền ra
  function routeTrade(W, A, Z, cap, tag, gap) {
    for (const sector of ['food', 'goods']) {
      const pa = avgPrice(A.w, sector), pz = avgPrice(Z.w, sector);
      if (!pa || !pz) continue;
      const [src, dst, ps, pd] = pa < pz ? [A, Z, pa, pz] : [Z, A, pz, pa];
      if (ps > pd * gap) continue; // chênh lệch không đủ bù công chở
      const sellers = src.w.firms.filter((f) => f.alive && f.sector === sector && f.inv > 4 && !(f.downUntil > W.day)).sort((x, y) => x.price - y.price);
      const buyers = dst.w.firms.filter((f) => f.alive && f.sector === sector).sort((x, y) => x.inv - y.inv);
      const se = sellers[0], bu = buyers[0];
      if (!se || !bu) continue;
      const q = Math.min(cap, Math.floor(se.inv - 3));
      const price = (ps + pd) / 2, amt = q * price;
      if (q <= 0 || bu.cash < amt) continue;
      se.inv -= q; se.sold += q; bu.inv += q;
      bu.cash -= amt; se.cash += amt;
      dst.w.ledger.outflow += amt; src.w.ledger.inflow += amt;
      W.tradeTotal += q;
      W.trade.push(Object.assign({ from: src.id, to: dst.id, q, sector }, tag));
      const what = sector === 'food' ? 'lương thực' : 'hàng hoá';
      if (tag.bridge != null) {
        const B = W.bridges[tag.bridge];
        B.traded += q;
        if (!B.firstTrade) { B.firstTrade = true; wstory(W, 'trade', 'major', 'Chuyến hàng đầu tiên qua cầu', 'Người ' + src.name + ' chở ' + what + ' sang bán ở ' + dst.name + ', nơi giá đắt hơn ' + Math.round((pd / ps - 1) * 100) + '%. Từ nay hai thành phố nương vào nhau.', { kind: 'bridge', bridge: B.id }, { bridge: B.id, from: src.id, to: dst.id }); }
      } else {
        W.sea.shipped += q;
        if (!W.sea.firstShip) { W.sea.firstShip = true; wstory(W, 'trade', 'major', 'Chuyến tàu buôn đầu tiên trên biển trong', 'Tàu của ' + src.name + ' chở ' + what + ' vượt biển sang ' + dst.name + '. Giờ hai thành phố không chung cầu vẫn buôn bán được với nhau.', { kind: 'sea', zone: 6 }, { from: src.id, to: dst.id, sea: true }); }
      }
    }
  }
  // tri thức đi theo người: nơi đi sau học được của nơi đi trước
  function learn(W, A, Z, via) {
    const [hi, lo] = A.era > Z.era ? [A, Z] : [Z, A];
    lo.learned++;
    lo.w.cands.push({ pri: 3, type: 'learn', title: 'Người ' + lo.name + ' học được ' + ERAS[hi.era].tech, text: 'Những ' + via + ' từ ' + hi.name + ' mang theo ' + ERAS[hi.era].tech + '.', place: { kind: 'plaza' }, actors: [] });
  }
  const BRIDGE_COST = [60, 120, 220, 380, 600, 900, 1300, 1800, 2400, 3100, 3900, 4800], BRIDGE_DAYS = [16, 22, 28, 34, 38, 42, 44, 46, 46, 44, 40, 36];
  const BRIDGE_LOAD = [0, 1, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3]; // cầu dây leo chỉ cho người đi bộ; xe tăng cần cầu sắt
  function bridgeDay(W, B) {
    const A = W.cities[B.a], Z = W.cities[B.b];
    if (B.build) {
      B.build.left--;
      if (B.build.left <= 0) {
        const up = B.level >= 0, by = W.cities[B.build.by];
        B.level = B.era = B.build.level; B.build = null;
        wstory(W, 'bridge', 'major', up ? 'Cầu nối ' + A.name + ' và ' + Z.name + ' được xây lại' : 'Cây cầu đầu tiên nối ' + A.name + ' và ' + Z.name, (up ? 'Cây cầu cũ được thay bằng ' : 'Người ' + by.name + ' bắc xong ') + BRIDGE_TEXT[B.level] + '. Mỗi ngày chở được ' + BRIDGE_CAP[B.level] + ' xe hàng mỗi chiều' + (W.war.on ? ', và cũng mở một con đường cho quân lính.' : '.'), { kind: 'bridge', bridge: B.id }, { bridge: B.id, by: by.id, upgrade: up });
      }
    }
    if (B.level < 0 || !A.settled || !Z.settled || atWar(W, A, Z) || embargoed(W, A, Z) || (B.closed || 0) > W.day) return;
    routeTrade(W, A, Z, Math.round(BRIDGE_CAP[B.level] * marketMult(A, Z)), { bridge: B.id }, 0.85);
    if (A.era !== Z.era && W.rand() < 1 / 120) learn(W, A, Z, 'người qua cầu');
  }
  function bridgeOffer(W, cid, bid) {
    const c = W.cities[cid], B = W.bridges[bid];
    if (!c || !B || (B.a !== cid && B.b !== cid)) return { ok: false, reason: 'Cầu này không chạm đất của thành phố' };
    const o = W.cities[B.a === cid ? B.b : B.a];
    if (!c.settled || !o.settled) return { ok: false, reason: 'Bờ bên kia còn hoang vu' };
    if (B.build) return { ok: false, reason: 'Đang xây, còn ' + B.build.left + ' ngày', busy: true };
    if (B.level >= c.era) return { ok: false, reason: B.level >= 0 ? 'Cầu đã hợp thời' : '', have: B.level >= 0 };
    if (atWar(W, c, o)) return { ok: false, reason: 'Đang có chiến tranh với ' + o.name };
    const level = c.era, cost = BRIDGE_COST[level], days = BRIDGE_DAYS[level], cash = c.w.gov.cash;
    return { ok: cash >= cost, reason: cash >= cost ? '' : 'Kho bạc chưa đủ ' + cost + ' xu', cost, days, level, upgrade: B.level >= 0, other: o.id, text: BRIDGE_TEXT[level] };
  }
  function buildBridge(W, cid, bid) {
    const o = bridgeOffer(W, cid, bid);
    if (!o.ok) return o;
    govBuy(W.cities[cid].w, o.cost, 'build');
    W.bridges[bid].build = { by: cid, left: o.days, total: o.days, level: o.level };
    return { ok: true, days: o.days };
  }
  function advanceEra(W, c) {
    c.era++;
    const w = c.w;
    w.cfg.era = c.era; renameFirms(w);
    if (c.hpMax) { const r = c.hp / c.hpMax; c.hpMax = hpMaxOf(c); c.hp = c.hpMax * r; }
    // thời đại mới thu hút người từ những bộ lạc còn lang thang
    const added = addHouseholds(w, 8, 30, true);
    wstory(W, 'era', 'epic', c.name + ' bước vào thời ' + ERAS[c.era].name, ERA_TEXT[c.era] + ' Tám gia đình mới kéo đến.', { kind: 'land', city: c.id }, { city: c.id, era: c.era, actors: added.map((h) => h.id) });
  }
  function stepWorld(W) {
    W.day++;
    W.trade = []; W.hunts = [];
    for (const c of W.cities) if (!c.settled && W.day >= (W.cfg.settle ? W.cfg.settle[c.id] : W.cfg.pace ? Math.max(3, Math.round(c.terrain.settle * W.cfg.pace.settleScale)) : c.terrain.settle)) settle(W, c.id);
    seaDay(W);
    for (const c of W.cities) {
      if (!c.settled) continue;
      scaleLimits(c.w);
      step(c.w);
      c.w.cfg.growth = W.cfg.growth;
      // người lang thang xin nhập cư khi thành phố có việc và có cơm
      const n = c.w.households.length, ue = c.w.households.filter((h) => h.employer === null).length / n, hungry = c.w.stats.at(-1).hungry;
      if (n < 240 && ue < 0.06 && hungry <= n * 0.03 && !(c.fallout > 0) && W.rand() < 1 / 70) {
        const added = addHouseholds(c.w, 4, 25, true);
        c.w.stories.push({ id: ++c.w.storySeq, day: c.w.day, type: 'settlers', tier: 'small', title: 'Bốn gia đình xin nhập cư', text: 'Nghe nói ở ' + c.name + ' ai cũng có việc, họ mang theo chút của cải và dựng nhà mới.', place: { kind: 'house', id: Math.floor(added[0].id / 4) }, actors: added.map((h) => h.id) });
      }
    }
    for (const B of W.bridges) bridgeDay(W, B);
    seaTradeDay(W);
    warDay(W);
    if (W.war.on) battleTrack(W);
    godDay(W);
    pillarsDay(W); damageDay(W); huntDay(W);
    if (W.cfg.pace) { paceDay(W); revoltDay(W); if (W.day >= W.cfg.pace.end && !W.ended) { W.ended = true; wstory(W, 'finale', 'epic', 'Năm thứ chín khép lại', 'Bể kính đã đi hết mười hai thời đại.', null, {}); } }
    else if (!W.war.on) {
      // Ngắm bể: thành phố tự bước sang thời mới khi đủ tri thức và dân số
      for (const c of W.cities) {
        if (!c.settled || c.era >= LAST) continue;
        const next = ERAS[c.era + 1];
        if (knowledgeOf(c) >= next.know && c.w.households.length >= next.pop) advanceEra(W, c);
      }
    }
    if (W.day % 360 === 0) worldChapter(W);
  }

  /* =============== Biển trong: ngư trường chung của sáu thành phố =============== */
  // Bảy vùng biển: vùng ven bờ trước bến của mỗi thành phố (0..5) và vùng khơi ở giữa (6).
  // Mỗi loài có trữ lượng riêng và sinh sôi theo đường cong logistic. Biển không của riêng ai, nên đánh bắt quá tay thì cạn.
  const SPECIES = [
    { key: 'anchovy', name: 'cá cơm', zones: [0, 1, 2, 3, 4, 5], food: 1, coin: 0, K: 800, r: 0.1, q: 0.0036, era: 0 },
    { key: 'crab', name: 'tôm cua', zones: [0, 1, 2, 3, 4, 5], food: 0.4, coin: 0.4, K: 300, r: 0.06, q: 0.003, era: 0 },
    { key: 'mackerel', name: 'cá thu', zones: [0, 4, 5], food: 2, coin: 0.1, K: 260, r: 0.05, q: 0.0025, era: 0 },
    { key: 'seal', name: 'hải cẩu', zones: [3, 2], food: 3, coin: 3, K: 60, r: 0.01, q: 0.002, era: 0, big: true },
    { key: 'lobster', name: 'tôm hùm', zones: [1, 2], food: 0.5, coin: 2.5, K: 90, r: 0.02, q: 0.0022, era: 1 },
    { key: 'turtle', name: 'rùa biển', zones: [4, 1], food: 0, coin: 7, K: 40, r: 0.006, q: 0.002, era: 1, big: true },
    { key: 'pearl', name: 'trai ngọc', zones: [5, 4, 0], food: 0, coin: 8, K: 50, r: 0.008, q: 0.0018, era: 1 },
    { key: 'tuna', name: 'cá ngừ', zones: [6], food: 4, coin: 0.8, K: 600, r: 0.04, q: 0.0012, era: 1 },
    { key: 'shark', name: 'cá mập', zones: [6], food: 2, coin: 8, K: 50, r: 0.006, q: 0.0008, era: 2, big: true },
    { key: 'whale', name: 'cá voi', zones: [6], food: 30, coin: 40, K: 14, r: 0.003, q: 0.0006, era: 2, big: true },
    { key: 'squid', name: 'mực khổng lồ', zones: [6], food: 6, coin: 80, K: 4, r: 0.002, q: 0.0005, era: 3, big: true },
  ];
  const GEAR = [1, 1.35, 1.8, 2.4, 3.1, 3.9, 4.6, 5.2, 5.8, 6.4, 7.0, 7.6];         // lưới, thuyền, máy dò cá: mỗi thời bắt được nhiều hơn
  const DEEP = [0, 0.2, 0.35, 0.45, 0.5, 0.55, 0.6, 0.62, 0.64, 0.66, 0.68, 0.7];       // phần thuyền dám ra vùng khơi
  const SHIP_CAP = [0, 4, 7, 10, 15, 22, 30, 40, 52, 66, 82, 100];                // tàu buôn: số món hàng mỗi chuyến
  const AQUA = [0, 0, 0, 0, 0, 0.6, 1.4, 2.2, 3.0, 3.8, 4.6, 5.4];                   // nuôi trồng thuỷ sản: sản lượng mỗi ngư dân không lấy từ biển hoang
  const zoneName = (W, z) => (z === 6 ? 'vùng khơi giữa biển trong' : 'vùng biển trước ' + W.cities[z].name);
  function seaInit(W) {
    W.sea = { stock: [], low: [], catches: [], disputes: {}, shipped: 0, firstShip: false, caught: SPECIES.map(() => 0) };
    for (let z = 0; z < 7; z++) { W.sea.stock.push(SPECIES.map((s) => (s.zones.includes(z) ? s.K : 0))); W.sea.low.push(SPECIES.map(() => false)); }
  }
  const fisheryOf = (c) => (c.w ? c.w.firms.find((f) => f.alive && f.sea) : null);
  function openFishery(W, c, crew) {
    const w = c.w, f = newFirm(w, 'food', 0);
    f.sea = true; f.root = c.name; f.name = firmTitle('sea', c.era, c.name); f.prod0 = f.prod; f.inv = 6; f.avgSales = 8; f.seaFood = 0; f.seaCoin = 0;
    lend(w, f, crew ? 150 : 220);
    w.firms.push(f);
    if (crew) for (const hid of crew) hire(f, w.households[hid]);
    else story(w, 'open', 'small', f.name + ' ra khơi', 'Cá đã về lại trước bến. Những con thuyền của ' + c.name + ' lại giăng lưới.', { kind: 'firm', id: f.id }, { actors: f.owners.slice() });
    return f;
  }
  function seaDay(W) {
    const S = W.sea, eff = [], fs = [];
    S.catches = [];
    for (const c of W.cities) {
      if (!c.settled) continue;
      let f = fisheryOf(c);
      if (!f && (W.day + c.id * 7) % 45 === 0 && S.stock[c.id][0] > SPECIES[0].K * 0.5 && !(c.w.phen.panic > 0)) f = openFishery(W, c);
      if (!f) continue;
      let crew = 0;
      if (!(f.strike > 0) && !(f.downUntil > W.day)) for (const hid of f.workers) { const h = c.w.households[hid]; if (!(h.sick > 0)) crew += h.skill; }
      const gear = GEAR[c.era] * (f.prod / (f.prod0 || f.prod)) * (c.w.boost ? c.w.boost.food : 1);
      const E = crew * gear * (1 - 0.7 * blockadeOf(W, c));
      f.seaFood = 0; f.seaCoin = 0; f.crew = crew; fs.push({ c, f });
      if (E <= 0) continue;
      const deep = DEEP[c.era];
      // cá trước bến cạn thì thuyền sang vùng biển láng giềng (nếu không có chiến tranh)
      const nb = [(c.id + 5) % 6, (c.id + 1) % 6].filter((j) => !atWar(W, c, W.cities[j]));
      const roam = c.era >= 1 && nb.length && S.stock[c.id][0] < SPECIES[0].K * 0.35 ? 0.3 : 0;
      eff.push({ c, f, z: c.id, e: E * (1 - deep - roam) });
      if (deep) eff.push({ c, f, z: 6, e: E * deep });
      if (roam) for (const j of nb) { eff.push({ c, f, z: j, e: (E * roam) / nb.length }); dispute(W, c, j); }
    }
    for (let z = 0; z < 7; z++) {
      const row = S.stock[z], list = eff.filter((x) => x.z === z);
      for (let s = 0; s < SPECIES.length; s++) {
        const sp = SPECIES[s];
        if (!sp.zones.includes(z)) continue;
        let want = 0;
        for (const x of list) if (x.c.era >= sp.era) want += sp.q * x.e * row[s];
        const take = Math.min(want, row[s] * 0.5);
        if (take > 0) {
          for (const x of list) {
            if (x.c.era < sp.era) continue;
            const part = (take * sp.q * x.e * row[s]) / want;
            x.f.seaFood += part * sp.food;
            x.f.seaCoin += part * sp.coin * (1 + 0.25 * x.c.era);
            S.caught[s] += part;
            if (sp.big) tally(W, x.c, z, s, part);
          }
          row[s] -= take;
        }
        // sinh sôi; loài còn ít vẫn có vài con từ đại dương ngoài bể bơi vào
        row[s] += sp.r * Math.max(row[s], sp.K * 0.02) * (1 - row[s] / sp.K);
        stockNews(W, z, s);
      }
    }
    // hàng quý (ngọc, da, dầu cá voi) bán cho thương thuyền phương xa: tiền từ bên ngoài vào thành phố
    for (const { c, f } of fs) {
      f.seaFood += f.crew * AQUA[c.era];
      if (f.seaCoin > 0) { f.cash += f.seaCoin; c.w.ledger.inflow += f.seaCoin; }
      if (f.crew > 0) f.baseProd = Math.max(0.6, (f.baseProd || f.prod) * 0.9 + 0.1 * (f.seaFood / f.crew));
    }
  }
  function tally(W, c, z, s, part) {
    c.seaTally = c.seaTally || {};
    const before = Math.floor(c.seaTally[s] || 0);
    c.seaTally[s] = (c.seaTally[s] || 0) + part;
    if (Math.floor(c.seaTally[s]) <= before) return;
    W.sea.catches.push({ city: c.id, zone: z, species: s });
    const sp = SPECIES[s];
    if (before === 0 && (sp.key === 'whale' || sp.key === 'squid')) wstory(W, 'catch', 'major', 'Thuyền ' + c.name + ' săn được ' + sp.name, 'Cả bến kéo ra xem. Dầu và xương bán cho thương thuyền phương xa được ' + Math.round(sp.coin * (1 + 0.25 * c.era)) + ' xu, bằng cả tháng đánh cá.', { kind: 'sea', zone: z }, { city: c.id, species: sp.key });
  }
  function stockNews(W, z, s) {
    const sp = SPECIES[s], v = W.sea.stock[z][s], low = W.sea.low[z];
    if (sp.key === 'crab' || W.day < 30) return;
    const rare = sp.key === 'whale' || sp.key === 'squid';
    if (!low[s] && v < sp.K * (rare ? 0.08 : 0.15)) {
      low[s] = true;
      wstory(W, 'sea-low', rare ? 'epic' : 'major', rare ? 'Biển trong không còn ' + sp.name : sp.name.charAt(0).toUpperCase() + sp.name.slice(1) + ' ở ' + zoneName(W, z) + ' cạn kiệt', rare ? 'Đã nhiều tháng không thuyền nào thấy bóng ' + sp.name + '. Biển không của riêng ai nên không ai chịu dừng tay trước.' : 'Quá nhiều lưới cùng thả một chỗ. Mẻ lưới vơi dần, giá cá ở chợ tăng lên. Nếu ngừng đánh bắt, đàn cá sẽ hồi lại.', { kind: 'sea', zone: z }, { zone: z, species: sp.key });
    } else if (low[s] && v > sp.K * 0.6) {
      low[s] = false;
      wstory(W, 'sea-back', 'major', sp.name.charAt(0).toUpperCase() + sp.name.slice(1) + ' đã trở lại ' + zoneName(W, z), 'Sau những mùa thuyền nằm bờ, đàn ' + sp.name + ' sinh sôi trở lại.', { kind: 'sea', zone: z }, { zone: z, species: sp.key });
    }
  }
  function dispute(W, c, j) {
    const k = c.id + '>' + j, X = W.war, o = W.cities[j];
    if (o.settled && o.owner !== c.owner && X.grudge) X.grudge[o.owner][c.owner] += 0.02;
    if (S_DISPUTE_GAP(W, k)) return;
    W.sea.disputes[k] = W.day;
    wstory(W, 'dispute', 'major', 'Thuyền ' + c.name + ' sang đánh cá ở vùng biển ' + o.name, 'Cá trước bến nhà đã cạn, ngư dân ' + c.name + ' phải giăng lưới sang vùng biển láng giềng.' + (o.settled ? ' Người ' + o.name + ' không vui.' : ''), { kind: 'sea', zone: j }, { city: c.id, other: j });
  }
  const S_DISPUTE_GAP = (W, k) => W.sea.disputes[k] != null && W.day - W.sea.disputes[k] < 720;
  // Tàu buôn: hai cảng bất kỳ đều đi lại được qua biển trong
  function seaTradeDay(W) {
    const ports = W.cities.filter((c) => c.settled && hasB(c, 'port'));
    for (let i = 0; i < ports.length; i++) for (let j = i + 1; j < ports.length; j++) {
      const A = ports[i], Z = ports[j];
      if (W.rand() > 0.3) continue;
      if (atWar(W, A, Z) || embargoed(W, A, Z) || blockadeOf(W, A) || blockadeOf(W, Z)) continue;
      const coast = A.terrain.key === 'coast' || Z.terrain.key === 'coast' ? BONUS.coast.trade : 1;
      routeTrade(W, A, Z, Math.round(SHIP_CAP[Math.min(A.era, Z.era)] * marketMult(A, Z) * coast), { sea: true }, 0.8);
      if (A.era !== Z.era && W.rand() < 1 / 160) learn(W, A, Z, 'thuỷ thủ tàu buôn');
    }
  }

  /* =============== Tranh hùng: phe phái, công trình, quân lính, chiến tuyến trên cầu và trên biển =============== */
  const STAT_E = [1, 1.7, 2.9, 4.9, 8.3, 14, 23, 38, 60, 95, 150, 235];          // sức mạnh quân lính theo thời đại
  const COST_E = [1, 1.6, 2.5, 3.9, 6.1, 9.5, 14, 20, 27, 36, 47, 60];         // giá cả theo thời đại
  const BUILDINGS = {
    granary: { group: 'eco', era: 0, cost: 70, days: 14, names: ['Hầm Lương', 'Kho Lúa', 'Kho Lương', 'Kho Lương Đá', 'Kho Thóc Máy', 'Kho Lạnh', 'Kho Lạnh Hạt Nhân', 'Kho Tự Động', 'Kho San Hô', 'Kho Ánh Sao', 'Kho Đa Chiều', 'Kho Ánh Sáng'], info: 'Lương thực +15%' },
    academy: { group: 'eco', era: 0, cost: 110, days: 22, names: ['Nhà Già Làng', 'Nhà Thông Thái', 'Thư Viện', 'Học Viện', 'Đại Học', 'Viện Nghiên Cứu', 'Trung Tâm Vũ Trụ', 'Viện Trí Tuệ', 'Viện Vật Chất', 'Viện Mặt Trời', 'Viện Không Gian', 'Viện Ánh Sáng'], info: 'Phát minh nhanh hơn 60%' },
    market: { group: 'eco', era: 1, cost: 110, days: 18, names: ['', 'Chợ Phiên', 'Chợ Lớn', 'Thương Điếm', 'Sở Giao Dịch', 'Trung Tâm Thương Mại', 'Sàn Giao Dịch Số', 'Chợ Tự Vận Hành', 'Chợ Tự Mọc', 'Chợ Ánh Sao', 'Chợ Xuyên Cổng', 'Chợ Ánh Sáng'], info: 'Hàng qua cầu và qua cảng +50%' },
    port: { group: 'eco', era: 1, cost: 130, days: 22, names: ['', 'Bến Thuyền Buôn', 'Cảng Gỗ', 'Cảng Buồm', 'Cảng Hơi Nước', 'Cảng Container', 'Cảng Vũ Trụ', 'Cảng Robot', 'Cảng San Hô', 'Cảng Ánh Sao', 'Cảng Xuyên Cổng', 'Cảng Ánh Sáng'], info: 'Tàu buôn đi khắp biển trong; đóng tàu chiến' },
    barracks: { group: 'mil', era: 0, cost: 50, days: 10, names: ['Bãi Tập', 'Trại Lính', 'Doanh Trại', 'Trại Quân', 'Doanh Trại Gạch', 'Căn Cứ Bộ Binh', 'Căn Cứ Giáp Trợ Lực', 'Xưởng Lắp Robot', 'Lò Ấp Chiến Binh Nano', 'Doanh Trại Plasma', 'Doanh Trại Dịch Chuyển', 'Điện Ánh Sáng'], info: 'Luyện bộ binh' },
    range: { group: 'mil', era: 0, cost: 60, days: 12, names: ['Bãi Ném Đá', 'Trường Cung', 'Trường Nỏ', 'Trường Bắn', 'Trường Súng', 'Trung Tâm Xạ Kích', 'Trung Tâm Tên Lửa Dẫn Đường', 'Tổ Ong Máy Bay Không Người Lái', 'Tổ Hạt Nano', 'Đài Tia Mặt Trời', 'Đài Xạ Kích Xuyên Cổng', 'Lăng Kính Chiến'], info: 'Luyện quân đánh xa' },
    stable: { group: 'mil', era: 1, cost: 110, days: 16, names: ['', 'Chuồng Chiến Mã', 'Trại Kỵ Binh', 'Trại Ngựa Chiến', 'Xưởng Xe Bọc Thép', 'Căn Cứ Thiết Giáp', 'Xưởng Xe Tăng Tên Lửa', 'Xưởng Cỗ Máy Bọc Thép', 'Xưởng Cỗ Máy Tự Mọc', 'Xưởng Xe Đệm Plasma', 'Xưởng Cỗ Máy Chớp Tắt', 'Xưởng Vầng Sáng'], info: 'Kỵ binh, về sau là xe bọc thép' },
    siege: { group: 'mil', era: 1, cost: 140, days: 20, names: ['', 'Xưởng Xe Phá Thành', 'Xưởng Máy Bắn Đá', 'Xưởng Đúc Pháo', 'Xưởng Pháo Binh', 'Căn Cứ Pháo Tự Hành', 'Căn Cứ Tên Lửa', 'Bệ Pháo Điện Từ', 'Bệ Pháo Vật Chất', 'Bệ Pháo Sao', 'Bệ Pháo Không Gian', 'Bệ Lăng Kính'], info: 'Vũ khí công thành' },
    forge: { group: 'mil', era: 1, cost: 120, days: 16, names: ['', 'Lò Đúc Đồng', 'Lò Rèn Sắt', 'Xưởng Đúc Súng', 'Nhà Máy Thép', 'Nhà Máy Vũ Khí', 'Nhà Máy Hợp Kim', 'Lò Đúc Nano', 'Lò Vật Chất Sống', 'Lò Hợp Hạch', 'Lò Đa Chiều', 'Lò Ánh Sáng'], info: 'Sức đánh +20%, hàng hoá +6%' },
    tower: { group: 'def', era: 0, cost: 60, days: 12, names: ['Chòi Canh', 'Tháp Cung', 'Tháp Đá', 'Pháo Đài', 'Lô Cốt', 'Trận Địa Phòng Không', 'Lá Chắn Tên Lửa', 'Tháp Laser', 'Tháp San Hô', 'Tháp Plasma', 'Tháp Bẻ Cong', 'Tháp Ánh Sáng'], info: 'Bắn kẻ địch ở đầu cầu và trước cảng' },
    wall: { group: 'def', era: 1, cost: 130, days: 20, names: ['', 'Tường Đất', 'Tường Thành Đá', 'Thành Lũy Hình Sao', 'Chiến Hào', 'Tường Bê Tông', 'Tường Thép Composite', 'Khiên Năng Lượng', 'Tường Tự Lành', 'Khiên Plasma', 'Tường Gấp Khúc', 'Màn Ánh Sáng'], info: 'Sức chịu của thành +70%' },
    wonder: { group: 'win', era: 3, cost: 3200, days: 300, names: null, info: 'Đứng vững một năm thì thắng' },
    silo: { group: 'win', era: 6, cost: 230, days: 90, names: ['', '', '', '', '', '', 'Hầm Phóng Hạt Nhân', 'Hầm Phóng Hạt Nhân', 'Hầm Phóng Nano', 'Hầm Phóng Sao', 'Hầm Phóng Xuyên Cổng', 'Hầm Phóng Ánh Sáng'], info: 'Một tên lửa hạt nhân mỗi năm' },
  };
  const WONDERS = { plains: 'Tháp Hạt Vàng', forest: 'Cây Mẹ Ngàn Năm', mountain: 'Tượng Thần Đá Mây', tundra: 'Cung Điện Băng', coast: 'Hải Đăng Muôn Sóng', desert: 'Kim Tự Tháp Hồng' };
  const UNITS = {
    melee: { bld: 'barracks', era: 0, hp: 60, atk: 11, range: [1.2], speed: 1.6, cost: 34, days: 5, w: [0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0], names: ['Chiến Binh Rìu Đá', 'Lính Giáo Đồng', 'Kiếm Sĩ Giáp Sắt', 'Lính Lưỡi Lê', 'Bộ Binh Súng Trường', 'Lính Đặc Nhiệm', 'Lính Giáp Trợ Lực', 'Robot Chiến Đấu', 'Chiến Binh Nano', 'Hiệp Sĩ Plasma', 'Lính Dịch Chuyển', 'Chiến Binh Ánh Sáng'] },
    ranged: { bld: 'range', era: 0, hp: 34, atk: 9, range: [5, 6, 6.5, 7, 7.5, 8, 9, 10, 11, 12, 13, 14], speed: 1.5, cost: 42, days: 6, w: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], names: ['Người Ném Đá', 'Cung Thủ', 'Nỏ Thủ', 'Lính Hoả Mai', 'Xạ Thủ Súng Máy', 'Lính Tên Lửa Vác Vai', 'Đội Tên Lửa Dẫn Đường', 'Bầy Máy Bay Không Người Lái', 'Bầy Hạt Nano', 'Pháo Thủ Tia Sao', 'Xạ Thủ Xuyên Cổng', 'Người Bắn Tia Sáng'] },
    mounted: { bld: 'stable', era: 1, hp: 95, atk: 14, range: [1.4, 1.4, 1.4, 1.4, 3, 4, 5, 5, 5, 6, 6, 7], speed: 3.0, cost: 78, days: 8, w: [0, 1, 1, 1, 2, 3, 3, 3, 3, 2, 2, 1], names: ['', 'Chiến Xa', 'Kỵ Sĩ Giáp Sắt', 'Kỵ Binh Kiếm', 'Xe Bọc Thép', 'Xe Tăng', 'Xe Tăng Tên Lửa', 'Cỗ Máy Bọc Thép', 'Cỗ Máy Tự Mọc', 'Xe Đệm Plasma', 'Cỗ Máy Chớp Tắt', 'Vầng Sáng Chiến'] },
    siege: { bld: 'siege', era: 1, hp: 70, atk: 16, range: [1.2, 1.2, 8, 9, 12, 16, 20, 24, 26, 28, 30, 32], speed: 1.0, cost: 96, days: 10, w: [0, 1, 1, 2, 3, 3, 3, 3, 3, 3, 2, 1], vsGate: 3, splash: [0, 0, 1.2, 1.5, 2, 2.5, 3, 3, 3.2, 3.4, 3.6, 3.8], names: ['', 'Xe Phá Thành', 'Máy Bắn Đá', 'Đại Bác', 'Pháo Binh', 'Pháo Tự Hành', 'Xe Phóng Tên Lửa', 'Pháo Điện Từ', 'Pháo Vật Chất', 'Pháo Mặt Trời', 'Pháo Không Gian', 'Lăng Kính Công Thành'] },
    ship: { bld: 'port', era: 1, naval: true, hp: 150, atk: 15, range: [3, 3, 5, 8, 10, 14, 18, 22, 24, 26, 28, 30], speed: 3.2, cost: 120, days: 12, w: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], vsGate: 1.5, splash: [0, 0, 0, 1, 1.5, 2, 2.5, 3, 3.2, 3.4, 3.6, 3.8], names: ['', 'Thuyền Chiến Mái Chèo', 'Thuyền Buồm Chiến', 'Chiến Hạm Đại Bác', 'Tàu Thiết Giáp', 'Khu Trục Hạm', 'Tuần Dương Hạm Tên Lửa', 'Chiến Hạm Tự Hành', 'Tàu San Hô', 'Tàu Sao', 'Tàu Xuyên Cổng', 'Thuyền Ánh Sáng'] },
    sub: { bld: 'port', era: 6, naval: true, sub: true, hp: 200, atk: 0, range: [0], speed: 0, cost: 220, days: 60, w: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], names: ['', '', '', '', '', '', 'Tàu Ngầm Hạt Nhân', 'Tàu Ngầm Robot', 'Tàu Ngầm Nano', 'Tàu Ngầm Sao', 'Tàu Ngầm Xuyên Cổng', 'Tàu Ngầm Ánh Sáng'] },
  };
  // tên quân riêng của mỗi miền ở bốn thời đầu: mỗi miền có vũ khí, thú cưỡi và cách đánh của mình
  const REGION_UNITS = {
    plains: { melee: ['Chiến Binh Chày Đá', 'Lính Giáo Đồng Bằng', 'Lính Kích Lúa Vàng', 'Lính Lưỡi Lê Lúa Vàng'], ranged: ['Người Ném Đá', 'Cung Thủ Đồng Lúa', 'Nỏ Thủ Đồng Bằng', 'Lính Hoả Mai Đồng Bằng'], mounted: ['', 'Chiến Xa Ngựa Kéo', 'Kỵ Sĩ Giáo Dài', 'Kỵ Binh Đồng Bằng'] },
    forest: { melee: ['Chiến Binh Rìu Đá', 'Lính Rìu Rừng', 'Kiếm Sĩ Khiên Gỗ', 'Lính Kiểm Lâm'], ranged: ['Thợ Săn Ném Lao', 'Cung Thủ Rừng Già', 'Cung Thủ Cung Dài', 'Xạ Thủ Rừng'], mounted: ['', 'Kỵ Sĩ Hươu Sừng', 'Kỵ Sĩ Nai Chiến', 'Kỵ Binh Rừng'] },
    mountain: { melee: ['Chiến Binh Búa Đá', 'Lính Chuỳ Đồng', 'Lính Búa Chiến', 'Công Binh Núi'], ranged: ['Người Lăn Đá', 'Lính Ná Núi', 'Nỏ Thủ Vách Đá', 'Pháo Thủ Núi'], mounted: ['', 'Kỵ Sĩ Dê Núi', 'Kỵ Sĩ Dê Giáp', 'Kỵ Binh Núi'] },
    tundra: { melee: ['Thợ Săn Lao Xương', 'Lính Lao Móc Băng', 'Chiến Binh Rìu Băng', 'Lính Trượt Tuyết'], ranged: ['Người Ném Lao Băng', 'Cung Thủ Lông Thú', 'Nỏ Thủ Băng Giá', 'Xạ Thủ Tuyết'], mounted: ['', 'Kỵ Sĩ Voi Ma Mút', 'Kỵ Sĩ Ma Mút Giáp', 'Kỵ Binh Xe Trượt'] },
    coast: { melee: ['Chiến Binh Chĩa Ba', 'Lính Chĩa Ba Đồng', 'Lính Kiếm Cong Biển', 'Thuỷ Quân Lục Chiến'], ranged: ['Người Ném Lưới', 'Cung Thủ Thuyền', 'Nỏ Thủ Mạn Tàu', 'Lính Súng Kíp Biển'], mounted: ['', 'Chiến Xa Bờ Cát', 'Kỵ Sĩ Ngựa Bờ Biển', 'Kỵ Binh Bờ Biển'] },
    desert: { melee: ['Chiến Binh Dao Đá', 'Lính Mã Tấu Đồng', 'Kiếm Sĩ Mã Tấu', 'Lính Gươm Cong'], ranged: ['Người Ném Đá Cát', 'Cung Thủ Lạc Đà', 'Nỏ Thủ Ốc Đảo', 'Lính Súng Dài Sa Mạc'], mounted: ['', 'Kỵ Binh Lạc Đà', 'Kỵ Sĩ Lạc Đà Giáp', 'Kỵ Binh Cát'] },
  };
  function unitName(ter, cls, era) { const r = REGION_UNITS[ter] && REGION_UNITS[ter][cls]; return (r && era < r.length && r[era]) || UNITS[cls].names[era]; }
  // khắc chế: giáo dài chặn ngựa, cung bắn bộ binh, kỵ binh xông vào cung thủ, công thành phá tường
  const CLASS_MULT = {
    melee: { melee: 1, ranged: 1.3, mounted: 1.4, siege: 1.6, ship: 1, sub: 1 },
    ranged: { melee: 1.25, ranged: 1, mounted: 0.8, siege: 1, ship: 1, sub: 1 },
    mounted: { melee: 0.9, ranged: 1.5, mounted: 1, siege: 1.6, ship: 1, sub: 1 },
    siege: { melee: 0.8, ranged: 0.8, mounted: 0.6, siege: 1, ship: 1, sub: 1 },
    ship: { melee: 1, ranged: 1, mounted: 1, siege: 1, ship: 1, sub: 1 },
  };
  // ưu thế riêng của mỗi miền đất
  const BONUS = {
    plains: { cost: 0.85, text: 'Đồng lúa nuôi quân: luyện quân rẻ hơn 15%' },
    forest: { ranged: 1.25, text: 'Thợ săn rừng già: quân đánh xa mạnh hơn 25%' },
    mountain: { def: 1.4, text: 'Thành trên vách đá: tháp canh và tường thành bền hơn 40%' },
    tundra: { melee: 1.25, text: 'Người băng giá: bộ binh dẻo dai hơn 25%' },
    coast: { ship: 1.25, trade: 1.3, text: 'Con của biển: tàu chiến mạnh hơn 25%, tàu buôn chở thêm 30%' },
    desert: { mounted: 1.3, text: 'Kỵ sĩ cát hồng: kỵ binh nhanh và mạnh hơn 30%' },
  };
  // tính cách của những phe do máy điều khiển
  const PERSONA = {
    plains: { aggr: 0.5, trade: 0.7, navy: 0.3, build: 0.7 },
    forest: { aggr: 0.4, trade: 0.5, navy: 0.3, build: 0.6 },
    mountain: { aggr: 0.3, trade: 0.4, navy: 0.2, build: 0.8 },
    tundra: { aggr: 0.6, trade: 0.3, navy: 0.4, build: 0.5 },
    coast: { aggr: 0.4, trade: 0.9, navy: 0.8, build: 0.6 },
    desert: { aggr: 0.8, trade: 0.5, navy: 0.3, build: 0.5 },
  };
  const FACTION_COLORS = ['#e0b23a', '#3f9a5a', '#8e7cc3', '#5fc6e6', '#3f7fd6', '#e05a6a'];
  const ADV_COST = [0, 200, 420, 820, 1400, 2300, 3400, 4800, 6500, 8600, 11200, 14500];
  const LANE_LEN = { bridge: 30, sea: [0, 50, 86.6, 100] };
  const HOLD = 0.1;
  const hasB = (c, t) => !!(c && c.bld && c.bld[t] && c.bld[t].done);
  const bName = (c, t) => (t === 'wonder' ? WONDERS[c.terrain.key] : BUILDINGS[t].names[Math.max(BUILDINGS[t].era, c.era)]);
  function warInit(W, on, player) {
    W.war = {
      on, player: on ? player : -1, units: [], seq: 0, lanes: {}, fx: [], deaths: [], offers: [], over: null, wonder: null, embargo: {},
      factions: TERRAINS.map((t, i) => ({ id: i, name: t.city, color: FACTION_COLORS[i], alive: true, human: on && i === player })),
      rel: TERRAINS.map(() => TERRAINS.map(() => ({ state: 'peace', since: 0, truce: 0 }))),
      grudge: TERRAINS.map(() => TERRAINS.map(() => 0)),
    };
  }
  function hpMaxOf(c) { return 260 * STAT_E[c.era] * (hasB(c, 'wall') ? 1.7 : 1) * (BONUS[c.terrain.key].def || 1); }
  function cityWarInit(W, c) {
    c.bld = {}; c.queue = []; c.stance = {}; c.casualties = 0; c.kills = 0; c.lastHit = -99; c.nuke = null; c.fallout = 0;
    c.hpMax = hpMaxOf(c); c.hp = c.hpMax;
  }
  const relOf = (W, i, j) => W.war.rel[i][j];
  const atWarF = (W, i, j) => i !== j && W.war.on && W.war.rel[i][j].state === 'war';
  const atWar = (W, A, Z) => !!(A && Z && A.settled && Z.settled && atWarF(W, A.owner, Z.owner));
  const embargoed = (W, A, Z) => (W.war.embargo[A.owner] || 0) > W.day || (W.war.embargo[Z.owner] || 0) > W.day;
  const marketMult = (A, Z) => 1 + (hasB(A, 'market') ? 0.25 : 0) + (hasB(Z, 'market') ? 0.25 : 0);
  // Mua sắm của nhà nước: tiền từ kho bạc trả cho các xưởng, hàng trong kho xưởng vơi đi (vũ khí, vật liệu xây dựng)
  function govBuy(w, amt, kind) {
    amt = Math.min(amt, Math.max(0, w.gov.cash));
    if (!(amt > 0)) return 0;
    const gs = w.firms.filter((f) => f.alive && f.sector === 'goods');
    if (!gs.length) { payToHouseholds(w, w.gov, amt, kind, 6); return amt; }
    const tot = gs.reduce((t, f) => t + Math.max(1, f.inv), 0);
    for (const f of gs) {
      const part = (amt * Math.max(1, f.inv)) / tot;
      transfer(w, w.gov, f, part, kind);
      const q = part / Math.max(0.2, f.price);
      f.inv = Math.max(0, f.inv - q); f.sold += q;
    }
    return amt;
  }
  /* ----- Công trình ----- */
  function buildOffer(W, cid, type) {
    const c = W.cities[cid], D = BUILDINGS[type];
    if (!c || !c.settled || !D) return { ok: false, reason: '' };
    const name = bName(c, type) || BUILDINGS[type].names.find((x) => x);
    if (c.bld[type]) return { ok: false, reason: c.bld[type].done ? 'Đã có' : 'Đang xây, còn ' + c.bld[type].left + ' ngày', have: !!c.bld[type].done, busy: !c.bld[type].done, name };
    if (!W.war.on && D.group !== 'eco') return { ok: false, reason: 'Chỉ có trong Tranh hùng', name };
    if (c.era < D.era) return { ok: false, reason: 'Cần thời ' + ERAS[D.era].name, locked: true, name };
    const cost = Math.round(D.cost * COST_E[c.era]), pay = type === 'wonder' ? Math.round((cost / D.days) * 10) : cost, cash = c.w.gov.cash;
    return { ok: cash >= pay, reason: cash >= pay ? '' : 'Kho bạc chưa đủ ' + pay + ' xu', cost, pay, days: D.days, name, info: D.info };
  }
  function build(W, cid, type) {
    const o = buildOffer(W, cid, type);
    if (!o.ok) return o;
    const c = W.cities[cid];
    if (type !== 'wonder') govBuy(c.w, o.cost, 'build');
    c.bld[type] = { left: o.days, total: o.days, cost: o.cost, done: false, start: W.day };
    if (type === 'wonder') wstory(W, 'wonder-start', 'major', c.name + ' khởi công ' + WONDERS[c.terrain.key], 'Cả thành phố góp sức dựng kỳ quan trong ' + o.days + ' ngày. Nếu nó đứng vững một năm sau khi xong, ' + c.name + ' sẽ được muôn đời nhắc tên.', { kind: 'land', city: c.id }, { city: c.id });
    return { ok: true, days: o.days };
  }
  function buildDay(W, c) {
    for (const type in c.bld) {
      const b = c.bld[type];
      if (b.done) continue;
      if (type === 'wonder') {
        const per = b.cost / b.total;
        if (c.w.gov.cash < per) { b.stalled = true; continue; } // hết tiền thì công trường nghỉ
        govBuy(c.w, per, 'build'); b.stalled = false;
      }
      if (--b.left <= 0) finishBuilding(W, c, type);
    }
  }
  function finishBuilding(W, c, type) {
    const b = c.bld[type], X = W.war;
    b.done = true; b.day = W.day; b.left = 0;
    if (type === 'wall') { c.hpMax = hpMaxOf(c); c.hp = Math.min(c.hpMax, c.hp + c.hpMax * 0.4); }
    if (type === 'silo') c.nuke = { ready: W.day + 120 };
    if (type === 'wonder') {
      X.wonder = { city: c.id, owner: c.owner, day: W.day };
      wstory(W, 'wonder', 'epic', WONDERS[c.terrain.key] + ' đã hoàn thành', 'Kỳ quan của ' + c.name + ' sừng sững giữa bể kính. Nếu đứng vững thêm một năm, ' + X.factions[c.owner].name + ' sẽ thắng. Các phe khác sẽ không ngồi yên.', { kind: 'land', city: c.id }, { city: c.id });
      // các phe khác kéo quân tới
      for (const f of X.factions) if (f.alive && f.id !== c.owner && f.id !== X.player && connected(W, f.id, c.owner) && W.rand() < 0.4 + PERSONA[TERRAINS[f.id].key].aggr * 0.5) declareWar(W, f.id, c.owner, 'để ngăn kỳ quan');
      return;
    }
    const big = type === 'port' || type === 'silo' || type === 'wall';
    wstory(W, 'build', big ? 'major' : 'small', c.name + ' xây xong ' + bName(c, type), BUILDINGS[type].info + '.', { kind: 'land', city: c.id }, { city: c.id, building: type });
  }
  /* ----- Lên đời trong Tranh hùng: đủ tri thức và dân số, rồi bỏ tiền làm công trình lớn ----- */
  function advanceOffer(W, cid) {
    const c = W.cities[cid];
    if (!c || !c.settled || c.era >= LAST) return { ok: false, reason: c && c.era >= LAST ? 'Đã ở thời cuối' : '' };
    const next = ERAS[c.era + 1], know = knowledgeOf(c), pop = c.w.households.length, cost = ADV_COST[c.era + 1];
    const miss = [];
    if (know < next.know) miss.push('tri thức ' + know + '/' + next.know);
    if (pop < next.pop) miss.push('dân số ' + pop + '/' + next.pop);
    if (!miss.length && c.w.gov.cash < cost) miss.push('kho bạc ' + Math.floor(c.w.gov.cash) + '/' + cost + ' xu');
    return { ok: !miss.length, reason: miss.length ? 'Cần ' + miss.join(', ') : '', cost, next: next.name, know, pop, needKnow: next.know, needPop: next.pop };
  }
  function advanceCity(W, cid) {
    const o = advanceOffer(W, cid);
    if (!o.ok) return o;
    govBuy(W.cities[cid].w, o.cost, 'build');
    advanceEra(W, W.cities[cid]);
    return { ok: true };
  }
  /* ----- Quân lính ----- */
  function unitStats(c, cls, era) {
    const U = UNITS[cls], m = STAT_E[era], b = BONUS[c.terrain.key], forge = hasB(c, 'forge') ? 1.2 : 1;
    const own = b[cls] || 1;
    return {
      hp: U.hp * m * (cls === 'melee' || cls === 'ship' ? own : 1),
      atk: U.atk * m * forge * (cls === 'ranged' || cls === 'mounted' || cls === 'ship' ? own : 1),
      range: U.range[Math.min(era, U.range.length - 1)],
      speed: U.speed * (cls === 'mounted' ? own : 1),
      splash: U.splash ? U.splash[era] : 0, vsGate: U.vsGate || 1, w: U.w[era],
    };
  }
  const unitCost = (c, cls) => Math.round(UNITS[cls].cost * COST_E[c.era] * (BONUS[c.terrain.key].cost || 1));
  const armyCap = (c) => Math.max(3, Math.floor(c.w.households.length * 0.2));
  const armyOf = (W, c) => W.war.units.filter((u) => u.city === c.id && !u.dead).length + c.queue.length;
  function unitOffer(W, cid, cls) {
    const c = W.cities[cid], U = UNITS[cls], X = W.war;
    if (!X.on || !c || !c.settled || !U) return { ok: false, reason: '' };
    const name = unitName(c.terrain.key, cls, Math.max(U.era, c.era));
    if (c.era < U.era) return { ok: false, reason: 'Cần thời ' + ERAS[U.era].name, locked: true, name };
    if (!hasB(c, U.bld)) return { ok: false, reason: 'Cần ' + bName(c, U.bld), locked: true, name };
    if (cls === 'sub' && X.units.some((u) => u.cls === 'sub' && u.city === cid && !u.dead)) return { ok: false, reason: 'Mỗi cảng chỉ nuôi một tàu ngầm', name };
    const cost = unitCost(c, cls), cap = armyCap(c);
    if (armyOf(W, c) >= cap) return { ok: false, reason: 'Đủ quân số: ' + cap + ' người (một phần năm số hộ)', name };
    if (c.queue.length >= 6) return { ok: false, reason: 'Hàng chờ đã đầy', name };
    return { ok: c.w.gov.cash >= cost, reason: c.w.gov.cash >= cost ? '' : 'Kho bạc chưa đủ ' + cost + ' xu', cost, days: U.days, name, stats: unitStats(c, cls, c.era) };
  }
  function train(W, cid, cls) {
    const o = unitOffer(W, cid, cls);
    if (!o.ok) return o;
    const c = W.cities[cid];
    govBuy(c.w, o.cost, 'arms');
    c.queue.push({ cls, left: o.days, total: o.days });
    return { ok: true, days: o.days };
  }
  // gọi lính: người thất nghiệp trước, rồi tới thợ xưởng hàng hoá; không bao giờ lấy hết người ruộng
  function draft(c) {
    const hs = c.w.households;
    let h = null;
    for (let k = 0, n = hs.length, s = (c.w.day * 7) % n; k < n; k++) { const x = hs[(s + k) % n]; if (x.employer === null && !(x.sick > 0) && !(x.grief > 0)) { h = x; break; } }
    if (h) return h;
    const list = c.w.firms.filter((f) => f.alive && f.workers.length > 1).sort((a, b) => (a.sector === 'goods' ? 0 : 1) - (b.sector === 'goods' ? 0 : 1) || b.workers.length - a.workers.length);
    const f = list[0];
    if (!f) return null;
    const hid = f.workers.pop();
    return hs[hid];
  }
  function spawnUnit(W, c, cls) {
    const X = W.war, h = draft(c);
    if (!h) return false;
    const st = unitStats(c, cls, c.era);
    const u = { id: ++X.seq, owner: c.owner, city: c.id, cls, era: c.era, hp: st.hp, hpMax: st.hp, atk: st.atk, range: st.range, speed: st.speed, splash: st.splash, vsGate: st.vsGate, w: st.w, naval: !!UNITS[cls].naval, hid: h.id, lane: null, side: 0, x: 0, px: 0, lat: W.rand() * 2 - 1, born: W.day, dead: false, unpaid: 0 };
    if (cls === 'sub') u.ready = W.day + 30;
    h.employer = -1; h.soldier = u.id; h.joblessSince = 0;
    X.units.push(u);
    return true;
  }
  function release(W, u, died) {
    const c = W.cities[u.city], h = c && c.w ? c.w.households[u.hid] : null;
    if (h && h.soldier === u.id) {
      h.employer = null; h.soldier = 0; h.joblessSince = W.day;
      if (died) { h.grief = 60; scare(c.w, h, 20); }
    }
  }
  function trainDay(W, c) {
    const busy = {};
    for (const q of c.queue) {
      const b = UNITS[q.cls].bld;
      if (busy[b]) continue;
      busy[b] = true;
      if (q.left > 0) q.left--;
      if (q.left <= 0 && hasB(c, b) && spawnUnit(W, c, q.cls)) q.done = true;
    }
    c.queue = c.queue.filter((q) => !q.done);
  }
  // lương lính: đủ mua cơm và thêm chút ít; kho bạc cạn thì lính đói, sức chiến đấu giảm
  function upkeepDay(W, c) {
    const mine = W.war.units.filter((u) => u.city === c.id && !u.dead);
    if (!mine.length) return;
    const pay = Math.max(1, avgPrice(c.w, 'food') * 1.4);
    for (const u of mine) {
      const h = c.w.households[u.hid];
      if (c.w.gov.cash >= pay && h) { transfer(c.w, c.w.gov, h, pay, 'soldier'); u.unpaid = 0; }
      else { u.unpaid++; u.hp -= u.hpMax * 0.01; }
    }
  }
  /* ----- Chiến tuyến: mỗi cây cầu và mỗi đường biển giữa hai cảng là một tuyến ----- */
  function laneKey(kind, a, b, bridge) { return kind === 'bridge' ? 'b' + bridge : 's' + Math.min(a, b) + '-' + Math.max(a, b); }
  function lanesOf(W, c) {
    const out = [];
    for (const B of W.bridges) {
      if (B.level < 0 || (B.a !== c.id && B.b !== c.id)) continue;
      const o = W.cities[B.a === c.id ? B.b : B.a];
      if (!o.settled) continue;
      out.push({ key: laneKey('bridge', 0, 0, B.id), kind: 'bridge', bridge: B.id, a: B.a, b: B.b, other: o.id, war: atWar(W, c, o) });
    }
    if (hasB(c, 'port')) for (const o of W.cities) {
      if (o === c || !o.settled) continue;
      out.push({ key: laneKey('sea', c.id, o.id), kind: 'sea', a: Math.min(c.id, o.id), b: Math.max(c.id, o.id), other: o.id, war: atWar(W, c, o) });
    }
    return out;
  }
  function laneOf(W, o) {
    const X = W.war;
    if (!X.lanes[o.key]) {
      const d = Math.min(Math.abs(o.a - o.b), 6 - Math.abs(o.a - o.b));
      X.lanes[o.key] = { key: o.key, kind: o.kind, a: o.a, b: o.b, bridge: o.bridge == null ? null : o.bridge, len: o.kind === 'bridge' ? LANE_LEN.bridge : LANE_LEN.sea[d] };
    }
    return X.lanes[o.key];
  }
  function laneUnits(W, key) { return W.war.units.filter((u) => u.lane === key && !u.dead); }
  function threatOn(W, key, c) {
    const L = W.war.lanes[key];
    if (!L) return 0;
    let n = 0;
    for (const u of laneUnits(W, key)) if (u.owner !== c.owner && atWarF(W, u.owner, c.owner) && Math.abs((L.a === c.id ? 0 : 1) - u.x) < 0.6) n++;
    return n;
  }
  function setStance(W, cid, key, stance) { const c = W.cities[cid]; if (c && c.stance) c.stance[key] = stance === 'attack' ? 'attack' : 'hold'; return { ok: true }; }
  function deployDay(W) {
    const X = W.war;
    for (const u of X.units) {
      if (u.dead) continue;
      const c = W.cities[u.city];
      if (c.owner !== u.owner) { u.dead = true; release(W, u, false); continue; } // thành đổi chủ: lính giải ngũ
      if (u.lane) {
        const L = X.lanes[u.lane], foe = W.cities[u.side === 0 ? L.b : L.a];
        if (!atWar(W, c, foe) || (L.kind === 'bridge' && W.bridges[L.bridge].level < 0)) u.lane = null; // hoà bình: về doanh trại
        continue;
      }
      if (u.cls === 'sub') continue;
      const opts = lanesOf(W, c).filter((o) => o.war && (u.naval ? o.kind === 'sea' : o.kind === 'bridge' && u.w <= BRIDGE_LOAD[W.bridges[o.bridge].level]));
      if (!opts.length) continue;
      const count = (o) => X.units.filter((v) => v.lane === o.key && v.owner === u.owner && !v.dead).length;
      const attack = opts.filter((o) => c.stance[o.key] === 'attack').sort((p, q) => count(p) - count(q));
      const threat = opts.filter((o) => threatOn(W, o.key, c) > 0).sort((p, q) => threatOn(W, q.key, c) - threatOn(W, p.key, c));
      const pick = threat.length && (!attack.length || threatOn(W, threat[0].key, c) > count(threat[0])) ? threat[0] : attack[0];
      if (!pick) continue;
      const L = laneOf(W, pick);
      u.lane = L.key; u.side = L.a === c.id ? 0 : 1; u.x = u.px = u.side ? 1 : 0;
    }
    X.units = X.units.filter((u) => !u.dead);
  }
  function battleDay(W) {
    const X = W.war;
    for (const key in X.lanes) {
      const L = X.lanes[key], us = laneUnits(W, key);
      for (const u of us) u.px = u.x;
      if (!us.length) continue;
      for (let s = 0; s < 2; s++) laneStep(W, L, us, 0.5);
    }
    for (const u of X.units) if (u.hp <= 0 && !u.dead) die(W, u);
    X.units = X.units.filter((u) => !u.dead);
  }
  function fxPush(W, e) { if (W.war.fx.length < 160) W.war.fx.push(e); }
  function laneStep(W, L, us, dt) {
    const A = W.cities[L.a], Z = W.cities[L.b];
    for (const u of us) {
      if (u.hp <= 0 || u.cls === 'sub') continue;
      const home = u.side === 0 ? A : Z, foe = u.side === 0 ? Z : A, dir = u.side === 0 ? 1 : -1;
      let tgt = null, best = 1e9;
      for (const v of us) {
        if (v.hp <= 0 || v.owner === u.owner || !atWarF(W, u.owner, v.owner)) continue;
        const d = (v.x - u.x) * dir * L.len;
        if (d > -1 && d < best) { best = d; tgt = v; }
      }
      const gateX = u.side === 0 ? 1 : 0, gateD = Math.abs(gateX - u.x) * L.len;
      if (tgt && best <= u.range) { hit(W, L, u, tgt, us, dt); continue; }
      const stance = home.stance[L.key] || 'hold';
      if (!tgt && stance === 'attack' && gateD <= Math.max(u.range, 1.2) && atWar(W, home, foe)) { hitGate(W, L, u, foe, dt); continue; }
      const goal = stance === 'attack' ? gateX - dir * (Math.max(u.range, 1.2) * 0.9) / L.len : u.side === 0 ? HOLD : 1 - HOLD;
      let nx = u.x + Math.sign(goal - u.x) * Math.min(Math.abs(goal - u.x), (u.speed * dt) / L.len);
      if (tgt) { const lim = tgt.x - (dir * Math.max(0.9, u.range * 0.9)) / L.len; nx = dir > 0 ? Math.min(nx, Math.max(u.x, lim)) : Math.max(nx, Math.min(u.x, lim)); }
      u.x = Math.max(0, Math.min(1, nx));
    }
    // tháp canh và quân giữ thành ở hai đầu tuyến
    for (const side of [0, 1]) {
      const c = side === 0 ? A : Z, gx = side;
      const dps = (3 + (hasB(c, 'tower') ? 9 : 0)) * STAT_E[c.era] * (BONUS[c.terrain.key].def || 1), rng = 8;
      let tgt = null, best = 1e9;
      for (const v of us) {
        if (v.hp <= 0 || v.owner === c.owner || !atWarF(W, c.owner, v.owner)) continue;
        const d = Math.abs(v.x - gx) * L.len;
        if (d <= rng && d < best) { best = d; tgt = v; }
      }
      if (tgt) { tgt.hp -= dps * dt; tgt.lastBy = c.owner; fxPush(W, { lane: L.key, kind: 'tower', era: c.era, x0: gx, x1: tgt.x, city: c.id }); }
    }
  }
  function hit(W, L, u, t, us, dt) {
    const dmg = u.atk * (CLASS_MULT[u.cls][t.cls] || 1) * (u.cls === 'ranged' && u.era >= 5 && t.cls === 'mounted' ? 2 : 1) * dt;
    t.hp -= dmg; t.lastBy = u.owner; u.fight = W.day; t.hurt = W.day;
    if (u.splash) for (const v of us) if (v !== t && v.hp > 0 && v.owner === t.owner && Math.abs(v.x - t.x) * L.len <= u.splash) v.hp -= dmg * 0.4;
    fxPush(W, { lane: L.key, kind: u.cls, era: u.era, x0: u.x, x1: t.x, side: u.side, owner: u.owner });
  }
  function hitGate(W, L, u, foe, dt) {
    const dmg = u.atk * u.vsGate * dt * 0.5;
    // tàu chiến chỉ pháo kích được, muốn chiếm thành phải có quân bộ
    const floor = u.naval ? foe.hpMax * 0.15 : 0;
    u.fight = W.day;
    foe.hp = Math.max(Math.min(foe.hp, floor), foe.hp - dmg);
    foe.lastHit = W.day; foe.siegeHits = (foe.siegeHits || 0) + 1;
    fxPush(W, { lane: L.key, kind: u.cls, era: u.era, x0: u.x, x1: u.side === 0 ? 1 : 0, side: u.side, owner: u.owner, gate: foe.id });
    if (!foe.sieged || W.day - foe.sieged > 120) { foe.sieged = W.day; wstory(W, 'siege', 'major', 'Quân ' + W.war.factions[u.owner].name + ' đánh tới cổng ' + foe.name, 'Thành ' + foe.name + ' đang bị vây. Nếu sức chịu của thành cạn, thành phố sẽ đổi chủ.', { kind: 'lane', lane: L.key }, { city: foe.id, lane: L.key }); }
    if (foe.hp <= 0 && !u.naval) conquer(W, foe, u.owner);
  }
  function die(W, u) {
    u.dead = true;
    release(W, u, true);
    const c = W.cities[u.city];
    c.casualties++;
    if (u.lastBy != null) { const k = W.cities.find((x) => x.owner === u.lastBy); if (k) k.kills++; }
    W.war.deaths.push({ lane: u.lane, x: u.x, cls: u.cls, era: u.era, owner: u.owner, lat: u.lat });
    const R = W.war.rel[u.owner][u.lastBy == null ? u.owner : u.lastBy];
    if (R && R.state === 'war' && !R.blood) { R.blood = true; const o = W.war.rel[u.lastBy][u.owner]; if (o) o.blood = true; wstory(W, 'battle', 'major', 'Trận đầu tiên giữa ' + W.war.factions[u.owner].name + ' và ' + W.war.factions[u.lastBy].name, 'Một người lính ' + c.name + ' đã không trở về. Gia đình ' + nameOf(u.hid) + ' để tang.', u.lane ? { kind: 'lane', lane: u.lane } : { kind: 'land', city: c.id }, { lane: u.lane, city: c.id }); }
  }
  function capitalOf(W, fid) { const own = W.cities.filter((c) => c.settled && c.owner === fid); return own.find((c) => c.id === fid) || own[0] || null; }
  function conquer(W, c, by) {
    const X = W.war, old = c.owner;
    if (old === by) return;
    c.owner = by; c.heldSince = W.day;
    for (const u of X.units) if (u.city === c.id && !u.dead) { u.dead = true; release(W, u, false); }
    X.units = X.units.filter((u) => !u.dead);
    c.queue = []; c.stance = {};
    // nửa kho bạc bị mang về thủ phủ phe thắng
    const cap = capitalOf(W, by);
    if (cap && cap !== c && c.w.gov.cash > 0) { const amt = c.w.gov.cash * 0.5; c.w.gov.cash -= amt; c.w.ledger.outflow += amt; cap.w.gov.cash += amt; cap.w.ledger.inflow += amt; }
    if (c.bld.wonder) { delete c.bld.wonder; if (X.wonder && X.wonder.city === c.id) X.wonder = null; }
    c.hpMax = hpMaxOf(c); c.hp = c.hpMax * 0.4; c.lastHit = W.day;
    sack(W, c);
    for (const h of c.w.households) if (W.rand() < 0.5) scare(c.w, h, 15);
    if (by === c.id) wstory(W, 'conquer', 'epic', c.name + ' giành lại thành của mình', 'Quân ' + c.name + ' quay về, cờ của ' + X.factions[old].name + ' bị hạ xuống. Người dân đổ ra đường.', { kind: 'land', city: c.id }, { city: c.id, by, from: old });
    else wstory(W, 'conquer', 'epic', X.factions[by].name + ' chiếm ' + c.name, 'Cổng thành đã vỡ. Từ nay ' + c.name + ' nộp thuế cho ' + X.factions[by].name + '. Người dân đóng cửa ở trong nhà.', { kind: 'land', city: c.id }, { city: c.id, by, from: old });
    if (!W.cities.some((x) => x.settled && x.owner === old)) {
      X.factions[old].alive = false;
      for (const f of X.factions) { X.rel[old][f.id].state = 'peace'; X.rel[f.id][old].state = 'peace'; }
      wstory(W, 'fall', 'epic', 'Phe ' + X.factions[old].name + ' đã mất hết thành trì', X.factions[old].name + ' chỉ còn trong ký ức của bể kính.', { kind: 'land', city: c.id }, { faction: old });
    }
    checkVictory(W);
  }
  /* ----- Ngoại giao ----- */
  function connected(W, i, j) {
    for (const B of W.bridges) {
      if (B.level < 0) continue;
      const A = W.cities[B.a], Z = W.cities[B.b];
      if (A.settled && Z.settled && ((A.owner === i && Z.owner === j) || (A.owner === j && Z.owner === i))) return true;
    }
    return W.cities.some((c) => c.settled && c.owner === i && hasB(c, 'port')) && W.cities.some((c) => c.settled && c.owner === j);
  }
  function declareWar(W, i, j, why) {
    const X = W.war;
    if (!X.on || i === j || !X.factions[i].alive || !X.factions[j].alive) return { ok: false, reason: '' };
    const R = X.rel[i][j];
    if (R.state === 'war') return { ok: false, reason: 'Đang có chiến tranh' };
    if (R.truce > W.day) return { ok: false, reason: 'Hoà ước còn ' + (R.truce - W.day) + ' ngày' };
    if (!connected(W, i, j)) return { ok: false, reason: 'Chưa có cầu hay cảng nào dẫn tới ' + X.factions[j].name };
    X.rel[i][j] = { state: 'war', since: W.day, truce: 0, by: i };
    X.rel[j][i] = { state: 'war', since: W.day, truce: 0, by: i };
    X.offers = X.offers.filter((o) => !((o.from === i && o.to === j) || (o.from === j && o.to === i)));
    wstory(W, 'war', 'epic', X.factions[i].name + ' tuyên chiến với ' + X.factions[j].name, (why ? 'Họ nói là ' + why + '. ' : '') + 'Buôn bán giữa hai bên dừng lại. Những cây cầu và đường biển nối hai phe giờ là chiến tuyến.', { kind: 'land', city: capitalOf(W, j) ? capitalOf(W, j).id : j }, { from: i, to: j });
    return { ok: true };
  }
  function makePeace(W, i, j) {
    const X = W.war;
    X.rel[i][j] = { state: 'peace', since: W.day, truce: W.day + 240 };
    X.rel[j][i] = { state: 'peace', since: W.day, truce: W.day + 240 };
    X.offers = X.offers.filter((o) => !((o.from === i && o.to === j) || (o.from === j && o.to === i)));
    wstory(W, 'peace', 'major', X.factions[i].name + ' và ' + X.factions[j].name + ' giảng hoà', 'Lính về nhà, tàu buôn lại ra khơi. Hoà ước giữ tám tháng.', { kind: 'land', city: capitalOf(W, i) ? capitalOf(W, i).id : i }, { from: i, to: j });
    return { ok: true };
  }
  function offerPeace(W, i, j) {
    const X = W.war, R = X.rel[i][j];
    if (!R || R.state !== 'war') return { ok: false, reason: 'Hai bên không có chiến tranh' };
    if (X.factions[j].human) { if (!X.offers.some((o) => o.from === i && o.to === j)) X.offers.push({ from: i, to: j, day: W.day }); return { ok: true, pending: true }; }
    const long = W.day - R.since, mine = powerOf(W, j), theirs = powerOf(W, i);
    if ((mine < theirs * 1.3 && long > 60) || long > 420 || (X.offers.some((o) => o.from === j && o.to === i))) return makePeace(W, i, j);
    return { ok: false, reason: X.factions[j].name + ' từ chối: họ nghĩ mình đang thắng' };
  }
  function acceptPeace(W, from) { const X = W.war; const o = X.offers.find((x) => x.from === from && x.to === X.player); if (!o) return { ok: false, reason: '' }; return makePeace(W, from, X.player); }
  function powerOf(W, fid) {
    let p = 0;
    for (const u of W.war.units) if (u.owner === fid && !u.dead && u.cls !== 'sub') p += Math.sqrt(u.hp * u.atk);
    for (const c of W.cities) if (c.settled && c.owner === fid) p += Math.sqrt(c.hp) * (hasB(c, 'tower') ? 1.6 : 1) + c.queue.length * 3 * STAT_E[c.era];
    return p;
  }
  /* ----- Vũ khí hạt nhân: hầm phóng trên đất liền hoặc tàu ngầm dưới biển ----- */
  function nukeOffer(W, cid, tid) {
    const X = W.war, c = W.cities[cid], t = W.cities[tid];
    if (!X.on || !c || !t || !c.settled || !t.settled) return { ok: false, reason: '' };
    const sub = X.units.find((u) => u.cls === 'sub' && u.owner === c.owner && !u.dead && u.ready <= W.day);
    const silo = hasB(c, 'silo') && c.nuke && c.nuke.ready <= W.day;
    if (!sub && !silo) return { ok: false, reason: hasB(c, 'silo') || X.units.some((u) => u.cls === 'sub' && u.owner === c.owner) ? 'Tên lửa đang được nạp lại' : 'Cần Hầm Phóng Hạt Nhân hoặc Tàu Ngầm Hạt Nhân', locked: !hasB(c, 'silo') };
    if (!atWarF(W, c.owner, t.owner)) return { ok: false, reason: 'Chỉ dùng được với kẻ đang giao chiến' };
    return { ok: true, via: silo ? 'silo' : 'sub', sub: sub ? sub.id : null };
  }
  function launchNuke(W, cid, tid) {
    const o = nukeOffer(W, cid, tid);
    if (!o.ok) return o;
    const X = W.war, c = W.cities[cid], t = W.cities[tid], by = c.owner;
    if (o.via === 'silo') c.nuke.ready = W.day + 360;
    else { const s = X.units.find((u) => u.id === o.sub); s.ready = W.day + 360; }
    // lá chắn tên lửa: tháp canh thời hiện đại có thể bắn hạ
    const stopped = hasB(t, 'tower') && t.era >= 6 && W.rand() < (t.era >= 7 ? 0.6 : 0.4);
    fxPush(W, { kind: 'nuke', from: cid, via: o.via, to: tid, intercepted: stopped });
    if (stopped) {
      wstory(W, 'nuke-stopped', 'epic', 'Tên lửa hạt nhân bị bắn hạ trên trời ' + t.name, 'Trận địa tên lửa của ' + t.name + ' đánh chặn thành công. Cả bể kính nín thở.', { kind: 'land', city: t.id }, { city: t.id, from: cid, by });
      for (const f of X.factions) if (f.alive && f.id !== by && f.id !== t.owner) X.grudge[f.id][by] += 3;
      X.embargo[by] = W.day + 360;
      return { ok: true, intercepted: true };
    }
    // mọi quân lính quanh cổng thành bị xoá sổ, cả hai phe
    for (const u of X.units) {
      if (u.dead || !u.lane) continue;
      const L = X.lanes[u.lane];
      if ((L.a === tid && u.x < 0.4) || (L.b === tid && u.x > 0.6)) u.hp = 0;
    }
    for (const u of X.units) if (u.hp <= 0 && !u.dead) die(W, u);
    X.units = X.units.filter((u) => !u.dead);
    t.hp = Math.max(1, t.hp - t.hpMax * 0.75); t.lastHit = W.day; t.fallout = 300;
    // bụi phóng xạ: người ốm, ruộng hỏng, biển trước bến chết
    for (const h of t.w.households) if (W.rand() < 0.3) { h.sick = Math.max(h.sick || 0, 40); }
    const kinds = Object.keys(t.bld).filter((k) => t.bld[k].done);
    for (let k = 0; k < 2 && kinds.length; k++) { const i = Math.floor(W.rand() * kinds.length); const kind = kinds.splice(i, 1)[0]; delete t.bld[kind]; if (kind === 'wonder' && X.wonder && X.wonder.city === tid) X.wonder = null; }
    W.sea.stock[tid] = W.sea.stock[tid].map((v) => v * 0.2);
    for (const f of X.factions) if (f.alive && f.id !== by) X.grudge[f.id][by] += 5;
    X.embargo[by] = W.day + 360;
    X.nuked = X.nuked || [];
    X.nuked.push({ by, city: tid, day: W.day });
    wstory(W, 'nuke', 'epic', X.factions[by].name + ' phóng tên lửa hạt nhân vào ' + t.name, 'Một mặt trời thứ hai mọc lên trên ' + t.name + '. Quân lính quanh cổng thành không ai còn sống, ruộng đồng nhiễm độc gần một năm. Cả bể kính quay lưng với ' + X.factions[by].name + '.', { kind: 'land', city: t.id }, { city: t.id, from: cid, by, via: o.via });
    return { ok: true };
  }
  /* ----- Máy điều khiển những phe còn lại ----- */
  function pickUnitClass(W, c) {
    const mine = W.war.units.filter((u) => u.city === c.id && !u.dead);
    const n = (k) => mine.filter((u) => u.cls === k).length + c.queue.filter((q) => q.cls === k).length;
    const seaWar = lanesOf(W, c).some((o) => o.war && o.kind === 'sea'), landWar = lanesOf(W, c).some((o) => o.war && o.kind === 'bridge');
    const P = PERSONA[c.terrain.key];
    const mix = [['melee', 0.4], ['ranged', 0.35], ['mounted', c.era >= 1 ? 0.18 : 0], ['siege', c.era >= 1 ? 0.12 : 0], ['ship', seaWar && hasB(c, 'port') ? 0.25 + P.navy * 0.4 : 0]];
    if (!landWar && seaWar) mix[0][1] = mix[1][1] = 0.1;
    const total = mine.length + c.queue.length + 1;
    let best = null, gap = -1e9;
    for (const [k, share] of mix) { if (!share || !unitOffer(W, c.id, k).name || unitOffer(W, c.id, k).locked) continue; const g = share - n(k) / total; if (g > gap) { gap = g; best = k; } }
    return best;
  }
  function aiCity(W, c) {
    const X = W.war, P = PERSONA[c.terrain.key], n = c.w.households.length;
    const reserve = 40 + n * 2.5, cash = () => c.w.gov.cash;
    const fighting = X.on && X.factions.some((f) => atWarF(W, c.owner, f.id));
    const threat = X.on ? lanesOf(W, c).reduce((t, o) => t + threatOn(W, o.key, c), 0) : 0;
    const tryB = (t) => { const o = buildOffer(W, c.id, t); return o.ok && cash() - o.pay >= reserve * 0.5 ? build(W, c.id, t).ok : false; };
    // chính quyền biết điều: dân đang thất nghiệp nhiều thì để tiền trợ cấp, chưa xây gì khi chưa bị đe doạ
    const ue = c.w.households.filter((h) => h.employer === null).length / n;
    if (ue > 0.25 && !threat && !fighting) return;
    if (X.on) {
      const a = W.cfg.pace ? { ok: false } : advanceOffer(W, c.id);
      if (a.ok && cash() - a.cost >= reserve && !threat) { advanceCity(W, c.id); return; }
      if (!c.bld.barracks && tryB('barracks')) return;
      if ((fighting || threat || W.day > 260 - P.aggr * 120) && !c.bld.tower && tryB('tower')) return;
      if ((fighting || W.day > 200) && !c.bld.range && tryB('range')) return;
      const want = Math.ceil(armyCap(c) * Math.min(1, 0.2 + P.aggr * 0.35 + (fighting ? 0.35 : 0) + Math.min(0.4, threat * 0.1)));
      if ((fighting || threat || W.day > 150) && armyOf(W, c) < want) {
        const k = pickUnitClass(W, c);
        if (k) { const o = unitOffer(W, c.id, k); if (o.ok && (cash() - o.cost >= reserve * (threat ? 0 : 0.6))) { train(W, c.id, k); return; } }
      }
      if (c.era >= 1 && (threat || fighting || P.aggr < 0.45) && !c.bld.wall && tryB('wall')) return;
      if (c.era >= 1 && !c.bld.forge && (fighting || W.day > 400) && tryB('forge')) return;
      if (c.era >= 1 && !c.bld.stable && (fighting || P.aggr >= 0.5) && tryB('stable')) return;
      if (c.era >= 1 && !c.bld.siege && P.aggr >= 0.4 && W.day > 500 && tryB('siege')) return;
      if (c.era >= 3 && !c.bld.wonder && !X.wonder && P.build >= 0.6 && !fighting && cash() > 1500 && tryB('wonder')) return;
      if (c.era >= 6 && !c.bld.silo && P.aggr >= 0.5 && tryB('silo')) return;
    }
    if (!c.bld.granary && tryB('granary')) return;
    // cầu: thích buôn bán thì bắc sớm; thời chiến thì dè chừng láng giềng hiếu chiến
    for (const B of W.bridges) {
      if (B.a !== c.id && B.b !== c.id) continue;
      const o = bridgeOffer(W, c.id, B.id);
      if (!o.ok || cash() - o.cost < reserve * 0.5) continue;
      const other = W.cities[o.other];
      const wary = X.on && other.owner !== c.owner ? PERSONA[other.terrain.key].aggr * 0.5 + X.grudge[c.owner][other.owner] * 0.1 : 0;
      if (o.upgrade || W.rand() < P.trade - wary + 0.2) { buildBridge(W, c.id, B.id); return; }
    }
    if (!c.bld.academy && tryB('academy')) return;
    if (c.era >= 1 && !c.bld.port && (P.navy > 0.4 || P.trade > 0.6 || c.era >= 2) && tryB('port')) return;
    if (c.era >= 1 && !c.bld.market && tryB('market')) return;
    // nạp tên lửa: chỉ trả đũa, hoặc khi thủ phủ sắp mất
    if (X.on && (c.nuke && c.nuke.ready <= W.day || X.units.some((u) => u.cls === 'sub' && u.owner === c.owner && u.ready <= W.day))) {
      for (const t of W.cities) {
        if (!t.settled || !atWarF(W, c.owner, t.owner)) continue;
        const revenge = (X.nuked || []).some((e) => e.by === t.owner && W.cities[e.city].owner === c.owner);
        const desperate = c.hp < c.hpMax * 0.3 && powerOf(W, t.owner) > powerOf(W, c.owner) * 1.5;
        if ((revenge || desperate) && W.rand() < 0.5) { launchNuke(W, c.id, t.id); return; }
      }
    }
    if (X.on && c.era >= 6 && hasB(c, 'port') && P.navy >= 0.4 && !X.units.some((u) => u.cls === 'sub' && u.city === c.id)) { const o = unitOffer(W, c.id, 'sub'); if (o.ok && cash() - o.cost > reserve) train(W, c.id, 'sub'); }
  }
  function aiFaction(W, f) {
    const X = W.war, P = PERSONA[TERRAINS[f.id].key], me = powerOf(W, f.id);
    const mine = W.cities.filter((c) => c.settled && c.owner === f.id);
    if (!mine.length) return;
    for (const g of X.factions) {
      if (!g.alive || g.id === f.id) continue;
      const R = X.rel[f.id][g.id], them = powerOf(W, g.id) + 1;
      if (R.state === 'war') {
        const long = W.day - R.since;
        // giữ nhịp tiến công: mạnh thì đánh, yếu thì thủ
        for (const c of mine) for (const o of lanesOf(W, c)) if (o.war && W.cities[o.other].owner === g.id) c.stance[o.key] = me > them * (1.05 - P.aggr * 0.25) ? 'attack' : 'hold';
        if (long > 150 && (me < them * 0.7 || (long > 360 && W.rand() < 0.3))) offerPeace(W, f.id, g.id);
        continue;
      }
      // người chơi được một năm rưỡi yên ổn để dựng nghiệp; máy với máy thì từ năm thứ hai
      if (W.day < (g.human ? 540 : 360) || R.truce > W.day || !connected(W, f.id, g.id)) continue;
      const cap = capitalOf(W, g.id);
      if (cap && W.day - cap.founded < 360) continue; // bộ lạc mới đến được một năm yên ổn
      const grudge = X.grudge[f.id][g.id], wonder = X.wonder && X.wonder.owner === g.id;
      const busy = X.factions.some((h) => atWarF(W, f.id, h.id));
      if (busy && !wonder) continue;
      if (wonder || (me > them * (1.6 - P.aggr * 0.6) && W.rand() < 0.1 + P.aggr * 0.25) || (grudge > 2 && me > them * 1.1 && W.rand() < 0.3)) {
        declareWar(W, f.id, g.id, wonder ? 'để ngăn kỳ quan' : grudge > 2 ? 'vì mối thù trên biển' : '');
        X.grudge[f.id][g.id] = Math.max(0, grudge - 2);
      }
    }
  }
  function checkVictory(W) {
    const X = W.war;
    if (!X.on || X.over) return;
    if (W.mode === 'god') {
      const alive = X.factions.filter((f) => f.alive);
      if (alive.length === 1 && W.cities.every((c) => c.settled) && !X.unified) { X.unified = W.day; wstory(W, 'unify', 'epic', alive[0].name + ' thống nhất sáu miền', 'Sáu thành phố giờ chung một lá cờ. Nhưng cờ có thể đổi, khi người ở thành bị chiếm thấy thời cơ.', null, { winner: alive[0].id }); }
      if (alive.length > 1) X.unified = 0;
      return;
    }
    const alive = X.factions.filter((f) => f.alive);
    let end = null;
    if (W.cities.every((c) => c.settled) && alive.length === 1) end = { winner: alive[0].id, how: 'conquest' };
    else if (X.wonder && W.day - X.wonder.day >= 360 && W.cities[X.wonder.city].owner === X.wonder.owner) end = { winner: X.wonder.owner, how: 'wonder' };
    else if (X.player >= 0 && X.factions[X.player] && !X.factions[X.player].alive) end = { winner: -1, how: 'defeat' };
    if (!end) return;
    X.over = Object.assign(end, { day: W.day });
    const name = end.winner >= 0 ? X.factions[end.winner].name : '';
    wstory(W, 'victory', 'epic', end.how === 'defeat' ? 'Phe của bạn đã mất hết thành trì' : name + (end.how === 'wonder' ? ' thắng nhờ kỳ quan' : ' thống nhất sáu miền'), end.how === 'wonder' ? WONDERS[W.cities[X.wonder.city].terrain.key] + ' đã đứng vững tròn một năm. Cả bể kính nhắc tên ' + name + '.' : end.how === 'conquest' ? 'Sáu thành phố giờ chung một lá cờ.' : 'Bể kính vẫn tiếp tục, nhưng không còn tiếng nói của bạn.', null, { winner: end.winner, how: end.how });
  }
  function blockadeOf(W, c) {
    const X = W.war;
    if (!X.on) return 0;
    for (const u of X.units) {
      if (u.dead || !u.naval || !u.lane || u.owner === c.owner || !atWarF(W, u.owner, c.owner)) continue;
      const L = X.lanes[u.lane];
      if ((L.a === c.id && u.x < 0.35) || (L.b === c.id && u.x > 0.65)) return 1;
    }
    return 0;
  }
  function warDay(W) {
    const X = W.war;
    X.fx = []; X.deaths = [];
    for (const c of W.cities) {
      if (!c.settled) continue;
      const w = c.w, n = w.households.length;
      // kho bạc giữ lại được nhiều hơn trong Tranh hùng: đủ để trả món đắt nhất của thời mình
      w.cfg.govKeep = X.on ? 320 * COST_E[c.era] + 12 * n : 300 + 10 * n;
      w.cfg.inventRate = W.cfg.inventRate * (hasB(c, 'academy') ? 1.6 : 1);
      w.boost.food = (hasB(c, 'granary') ? 1.15 : 1) * (c.fallout > 0 ? 0.4 : 1) * foodMods(c, W.day);
      w.boost.goods = hasB(c, 'forge') ? 1.06 : 1;
      if (c.fallout > 0) c.fallout--;
      buildDay(W, c);
      if (X.on) { trainDay(W, c); upkeepDay(W, c); }
      if (c.owner !== X.player && (W.day + c.id) % 4 === 0 && (!X.over || W.mode === 'god') && !W.cfg.noAI) aiCity(W, c);
      if (W.day - c.lastHit > 5) c.hp = Math.min(c.hpMax, c.hp + c.hpMax * 0.004);
      for (const h of w.households) if (h.grief > 0) h.grief--;
    }
    if (!X.on) return;
    deployDay(W);
    battleDay(W);
    if (W.day % 15 === 0 && !X.over && !W.cfg.noAI) for (const f of X.factions) if (f.alive && f.id !== X.player) aiFaction(W, f);
    checkVictory(W);
  }

  /* =============== Thần của bể kính: thiên tai, ban phước, đức tin =============== */
  // Người chơi đứng trên cả sáu nền văn minh. Thần lực hồi lại theo đức tin của dân; thiên tai làm dân sợ mà tin,
  // ban phước làm dân biết ơn mà tin. Thời đại càng mới, người ta càng ít tin thần.
  const POWERS = {
    flood: { name: 'Lũ lụt', kind: 'bad', cost: 30, cool: 40, info: 'Nước dâng ngập ruộng và nhà, cuốn trôi cầu yếu. Rút đi để lại phù sa màu mỡ.' },
    drought: { name: 'Hạn hán', kind: 'bad', cost: 25, cool: 60, info: 'Trời không mưa nhiều tháng, mùa màng thất bát, giá gạo leo thang.' },
    quake: { name: 'Động đất', kind: 'bad', cost: 45, cool: 60, info: 'Nhà xưởng sập, tường thành nứt, cầu gãy. Thời đại càng mới nhà càng chịu được.' },
    tornado: { name: 'Lốc xoáy', kind: 'bad', cost: 35, cool: 45, info: 'Một cột gió quét ngang miền đất, cuốn bay những gì trên đường đi.' },
    plague: { name: 'Dịch bệnh', kind: 'bad', cost: 40, cool: 90, info: 'Dịch sốt lan trong thành, theo người buôn sang láng giềng, quật ngã cả quân lính.' },
    volcano: { name: 'Núi lửa', kind: 'bad', cost: 60, cool: 120, info: 'Một miệng núi lửa thức dậy. Tro bụi phủ trời nhiều tháng, rồi đất thành màu mỡ.' },
    tsunami: { name: 'Sóng thần', kind: 'bad', cost: 50, cool: 90, info: 'Biển trong dựng một bức tường nước đổ vào bờ: bến cá, cảng và tàu thuyền tan tác.' },
    fire: { name: 'Sét lửa', kind: 'bad', cost: 20, cool: 30, info: 'Sét đánh xuống, lửa bén sang những xưởng nằm gần nhau.' },
    rain: { name: 'Mưa lành', kind: 'good', cost: 15, cool: 30, info: 'Chấm dứt hạn hán, ruộng đồng xanh lại.' },
    harvest: { name: 'Mùa bội thu', kind: 'good', cost: 25, cool: 90, info: 'Lương thực tăng ba phần mười trong một mùa.' },
    enlighten: { name: 'Khai sáng', kind: 'good', cost: 30, cool: 60, info: 'Một phát minh ra đời, đẩy thành phố tới gần thời đại mới.' },
    heal: { name: 'Chữa lành', kind: 'good', cost: 25, cool: 45, info: 'Dập tắt dịch bệnh, người ốm và người bị thương khỏi hẳn.' },
    truce: { name: 'Đình chiến', kind: 'good', cost: 40, cool: 120, info: 'Buộc phe đang giữ miền này ngưng mọi cuộc chiến trong một năm.' },
  };
  const FAITH_BASE = [0.72, 0.64, 0.56, 0.46, 0.36, 0.27, 0.2, 0.15, 0.2, 0.28, 0.4, 0.58]; // thời vượt người: dân lại tìm đến thần
  const RESIST = [1, 1, 0.9, 0.8, 0.7, 0.5, 0.4, 0.3, 0.25, 0.2, 0.15, 0.12]; // nhà thời sau chịu động đất, gió bão tốt hơn
  function godInit(W) { W.god = { power: 60, max: 100, cool: {}, fx: [], acts: 0, used: {}, awakened: false }; }
  const foodMods = (c, day) => (c.mods || []).reduce((m, x) => (x.from <= day && x.until > day ? m * x.food : m), 1);
  function addMod(c, food, from, until) { (c.mods = c.mods || []).push({ food, from, until }); c.mods = c.mods.filter((x) => x.until > from - 1); }
  function godOffer(W, key, cid) {
    const P = POWERS[key], c = W.cities[cid], G = W.god;
    if (!P) return { ok: false, reason: '' };
    if ((G.cool[key] || 0) > W.day) return { ok: false, reason: P.name + ' còn ' + (G.cool[key] - W.day) + ' ngày nữa mới dùng lại được', cost: P.cost };
    if (G.power < P.cost) return { ok: false, reason: 'Thần lực chưa đủ (' + Math.floor(G.power) + '/' + P.cost + '). Đức tin của dân sẽ hồi lại thần lực.', cost: P.cost };
    if (cid == null) return { ok: true, cost: P.cost, needTarget: true };
    if (!c || !c.settled) return { ok: false, reason: 'Miền này chưa có người ở', cost: P.cost };
    if (key === 'truce' && !W.war.factions.some((f) => f.alive && atWarF(W, c.owner, f.id))) return { ok: false, reason: c.name + ' đang không có chiến tranh', cost: P.cost };
    if (key === 'heal' && c.w.epi.state === 'none' && !c.w.households.some((h) => h.sick > 0)) return { ok: false, reason: 'Ở ' + c.name + ' không ai ốm', cost: P.cost };
    return { ok: true, cost: P.cost };
  }
  function faithShift(W, c, k) { c.faith = Math.min(1, (c.faith || 0.35) + k * (1 - (c.faith || 0.35))); }
  function hitFirms(W, c, share, days, invLoss, max) {
    const hit = [], list = c.w.firms.filter((f) => f.alive && f.sector !== 'gold');
    for (const f of list) {
      if (hit.length >= (max || 99) || W.rand() > share) continue;
      f.downUntil = Math.max(f.downUntil || 0, W.day + days); f.inv *= 1 - invLoss; hit.push(f.id);
    }
    return hit;
  }
  function injure(W, c, share, days) { let n = 0; for (const h of c.w.households) if (W.rand() < share) { h.sick = Math.max(h.sick || 0, days); n++; } return n; }
  function hitBridges(W, cid, breakUpTo, closeDays) {
    const out = [];
    for (const B of W.bridges) {
      if ((B.a !== cid && B.b !== cid) || B.level < 0) continue;
      if (B.level <= breakUpTo) { B.level = B.era = -1; B.build = null; out.push(B.id); }
      else B.closed = Math.max(B.closed || 0, W.day + closeDays);
    }
    return out;
  }
  function hitUnits(W, cid, frac, naval) {
    let n = 0;
    for (const u of W.war.units) {
      if (u.dead) continue;
      const L = u.lane && W.war.lanes[u.lane], near = u.city === cid || (L && (L.a === cid ? u.x < 0.5 : L.b === cid ? u.x > 0.5 : false));
      if (!near || (naval != null && !!u.naval !== naval)) continue;
      u.hp -= u.hpMax * frac; u.lastBy = null; n++;
    }
    for (const u of W.war.units) if (u.hp <= 0 && !u.dead) die(W, u);
    W.war.units = W.war.units.filter((u) => !u.dead);
    return n;
  }
  function wreck(W, c, n, spare) {
    const out = [], kinds = Object.keys(c.bld || {}).filter((k) => c.bld[k].done && !(spare || []).includes(k));
    for (let k = 0; k < n && kinds.length; k++) { const t = kinds.splice(Math.floor(W.rand() * kinds.length), 1)[0]; out.push(t); delete c.bld[t]; if (t === 'wonder' && W.war.wonder && W.war.wonder.city === c.id) W.war.wonder = null; if (t === 'wall') { c.hpMax = hpMaxOf(c); c.hp = Math.min(c.hp, c.hpMax); } }
    return out;
  }
  function godAct(W, key, cid) {
    const o = godOffer(W, key, cid);
    if (!o.ok) return o;
    const P = POWERS[key], c = W.cities[cid], w = c.w, G = W.god, res = RESIST[c.era];
    G.power -= P.cost; G.cool[key] = W.day + P.cool; G.acts++; G.used[key] = (G.used[key] || 0) + 1;
    const fx = { key, city: cid, day: W.day };
    let title = '', text = '';
    if (key === 'flood') {
      fx.days = 20; fx.firms = hitFirms(W, c, 0.55, 18, 0.45);
      for (const h of w.households) h.pantry = 0;
      addMod(c, 0.5, W.day, W.day + 20); addMod(c, 1.2, W.day + 20, W.day + 140);
      fx.bridges = hitBridges(W, cid, 1, 25);
      injure(W, c, 0.05, 12); c.hp -= c.hpMax * 0.1 * res; hitUnits(W, cid, 0.3 * res, false);
      title = 'Lũ lớn ở ' + c.name; text = 'Nước sông dâng trắng đồng, ruộng ngập, kho thóc ướt sũng.' + (fx.bridges.length ? ' Cây cầu yếu bị cuốn trôi.' : '') + ' Khi nước rút, phù sa sẽ làm đất màu mỡ hơn.';
    } else if (key === 'drought') {
      trigger(w, 'drought', 70); fx.days = 70;
      title = 'Hạn hán ở ' + c.name; text = 'Trời không mưa. Ruộng nứt nẻ, giếng cạn, giá gạo bắt đầu leo thang.';
    } else if (key === 'quake') {
      fx.firms = hitFirms(W, c, 0.45 * res, 14 + Math.round(16 * res), 0.3); fx.bridges = hitBridges(W, cid, res > 0.75 ? 2 : res > 0.45 ? 1 : 0, 30);
      fx.wrecked = wreck(W, c, res > 0.6 ? 2 : 1, ['wonder']);
      const hurt = injure(W, c, 0.12 * res, 25); c.hp = Math.max(1, c.hp - c.hpMax * 0.35 * res); c.lastHit = W.day;
      hitUnits(W, cid, 0.2 * res); fx.days = 6;
      title = 'Động đất rung chuyển ' + c.name; text = fx.firms.length + ' nơi làm ăn đổ sập, ' + hurt + ' người bị thương.' + (fx.wrecked.length ? ' ' + fx.wrecked.map((t) => bName(c, t)).join(', ') + ' không còn.' : '') + (res < 0.6 ? ' Nhà cửa thời mới đứng vững hơn người ta tưởng.' : '');
      G.after = { city: cid, day: W.day + 5 };
    } else if (key === 'tornado') {
      fx.firms = hitFirms(W, c, 0.35 * res + 0.1, 10 + Math.round(10 * res), 0.6, 5); fx.days = 4;
      injure(W, c, 0.04 * res, 15); hitUnits(W, cid, 0.25 * res);
      title = 'Lốc xoáy quét qua ' + c.name; text = 'Cột gió đen kịt đi ngang miền đất, cuốn mái nhà và cả những bao hàng lên trời. ' + fx.firms.length + ' nơi làm ăn tan hoang.';
    } else if (key === 'plague') {
      w.epi.state = 'none'; w.epi.cool = 0;
      startEpidemic(w, 6, 'Thần giáng một cơn dịch.'); injure(W, c, 0.12, 14); hitUnits(W, cid, 0.25); fx.days = 60;
      title = 'Dịch bệnh ở ' + c.name; text = 'Người ngã bệnh hàng loạt, xưởng thiếu thợ, lính trong trại cũng không đứng dậy nổi. Người buôn có thể mang dịch sang láng giềng.';
    } else if (key === 'volcano') {
      fx.firms = hitFirms(W, c, 0.5, 30, 0.5); fx.wrecked = wreck(W, c, 2, []); injure(W, c, 0.18, 30);
      c.hp = Math.max(1, c.hp - c.hpMax * 0.5); c.lastHit = W.day; hitUnits(W, cid, 0.4); fx.bridges = hitBridges(W, cid, 0, 20);
      addMod(c, 0.5, W.day, W.day + 90); addMod(c, 1.25, W.day + 90, W.day + 450); c.volcano = W.day + 120; fx.days = 120;
      title = 'Núi lửa thức dậy ở ' + c.name; text = 'Đất rung, trời tối sầm giữa trưa. Dung nham chảy xuống sườn núi, tro phủ ruộng đồng ba tháng. Rồi đất tro sẽ thành màu mỡ nhất bể kính.';
    } else if (key === 'tsunami') {
      const f = fisheryOf(c);
      if (f) { f.downUntil = W.day + 30; f.inv = 0; }
      fx.port = hasB(c, 'port') && W.rand() < 0.6 ? wreck(W, c, 1, Object.keys(c.bld).filter((k) => k !== 'port')).length > 0 : false;
      hitUnits(W, cid, 0.6, true); injure(W, c, 0.06, 15); W.sea.stock[cid] = W.sea.stock[cid].map((v) => v * 0.6); for (const h of w.households) if (W.rand() < 0.4) h.pantry = 0;
      fx.days = 3;
      title = 'Sóng thần đổ vào ' + c.name; text = 'Biển trong rút ra xa rồi dựng thành bức tường nước. Bến cá tan tác' + (fx.port ? ', cảng sập' : '') + ', tàu thuyền neo bến bị nhấn chìm.';
    } else if (key === 'fire') {
      const list = w.firms.filter((x) => x.alive && x.sector !== 'gold' && !(x.downUntil > W.day));
      fx.firms = [];
      for (let k = 0; k < 3 && list.length; k++) { const x = list.splice(Math.floor(W.rand() * list.length), 1)[0]; burn(w, x); fx.firms.push(x.id); }
      fx.days = 3; title = 'Sét đánh ở ' + c.name; text = 'Một tia sét giữa trời quang. Lửa bén sang ' + fx.firms.length + ' xưởng nằm sát nhau.';
    } else if (key === 'rain') {
      w.phen.drought = 0; trigger(w, 'rain', 8); addMod(c, 1.1, W.day, W.day + 60); fx.days = 8;
      title = 'Mưa lành trên ' + c.name; text = 'Những đám mây kéo về đúng lúc. Ruộng đồng xanh lại, người dân ra đường đón mưa.';
    } else if (key === 'harvest') {
      addMod(c, 1.3, W.day, W.day + 90); fx.days = 90;
      title = 'Mùa bội thu ở ' + c.name; text = 'Lúa trĩu bông, lưới đầy cá. Kho thóc không còn chỗ chứa.';
    } else if (key === 'enlighten') {
      const best = w.firms.filter((x) => x.alive && x.sector !== 'gold').sort((a, b) => b.workers.length - a.workers.length)[0];
      if (best) { invent(w, best, { seeded: true }); fx.firm = best.id; }
      fx.days = 2; title = 'Khai sáng ở ' + c.name; text = 'Một tia sáng rơi xuống ' + (best ? best.name : 'thành phố') + '. Một phát minh ra đời trong một đêm.';
    } else if (key === 'heal') {
      for (const h of w.households) { h.sick = 0; h.immune = 240; }
      w.epi.state = 'none'; w.sickN = 0; fx.days = 3;
      for (const u of W.war.units) if (u.city === cid && !u.dead) u.hp = u.hpMax;
      title = 'Chữa lành ở ' + c.name; text = 'Cơn sốt lui đi trong một buổi sáng. Người ốm ngồi dậy, quân lính lành vết thương.';
    } else if (key === 'truce') {
      for (const f of W.war.factions) if (f.alive && atWarF(W, c.owner, f.id)) { makePeace(W, c.owner, f.id); W.war.rel[c.owner][f.id].truce = W.day + 360; W.war.rel[f.id][c.owner].truce = W.day + 360; }
      fx.days = 6; title = 'Thần buộc ' + W.war.factions[c.owner].name + ' ngưng chiến'; text = 'Một vòng sáng bao quanh ' + c.name + '. Gươm súng hạ xuống, quân lính quay về. Không ai dám động binh trong một năm.';
    }
    pillarTouch(W, c, key, fx);
    faithShift(W, c, P.kind === 'bad' ? 0.25 : 0.15);
    for (const j of [(cid + 5) % 6, (cid + 1) % 6]) if (W.cities[j].settled) faithShift(W, W.cities[j], P.kind === 'bad' ? 0.06 : 0.03);
    G.fx.push(fx);
    wstory(W, 'god-' + key, P.kind === 'bad' ? 'epic' : 'major', title, text, { kind: 'land', city: cid }, { city: cid, power: key });
    return { ok: true, fx };
  }
  function godDay(W) {
    const G = W.god, live = W.cities.filter((c) => c.settled);
    G.fx = [];
    let fsum = 0;
    for (const c of live) { if (c.faith == null) c.faith = 0.4; c.faith += (FAITH_BASE[c.era] - c.faith) * 0.003; fsum += c.faith; }
    G.power = Math.min(G.max, G.power + 0.25 + 0.9 * (live.length ? fsum / live.length : 0.4));
    if (G.after && W.day >= G.after.day) {
      const c = W.cities[G.after.city]; G.after = null;
      if (c.settled) { const hit = hitFirms(W, c, 0.12 * RESIST[c.era], 8, 0.1); G.fx.push({ key: 'quake', city: c.id, day: W.day, days: 2, firms: hit, after: true }); wstory(W, 'god-aftershock', 'small', 'Dư chấn ở ' + c.name, 'Đất lại rung nhẹ. ' + hit.length + ' nơi vừa dựng lại phải chống thêm cột.', { kind: 'land', city: c.id }, { city: c.id }); }
    }
    // dịch theo người buôn: thành đang có dịch lây sang láng giềng có cầu hoặc tàu qua lại
    for (const c of live) {
      if (c.w.epi.state !== 'spreading') continue;
      for (const t of W.trade) {
        const o = t.from === c.id ? t.to : t.to === c.id ? t.from : -1;
        if (o < 0 || W.rand() > 1 / 90) continue;
        const d = W.cities[o];
        if (d.settled && d.w.epi.state === 'none' && startEpidemic(d.w, 2, 'Người buôn từ ' + c.name + ' mang theo cơn sốt.')) wstory(W, 'plague-spread', 'major', 'Dịch lan sang ' + d.name, 'Người buôn từ ' + c.name + ' mang theo cơn sốt qua ' + (t.sea ? 'đường biển.' : 'cầu.'), { kind: 'land', city: d.id }, { city: d.id, from: c.id });
      }
    }
    // thời Robot AI: những cỗ máy nhận ra vách kính
    if (!G.awakened) {
      const c = live.find((x) => x.era >= AI_ERA && x.aiSince != null && W.day - x.aiSince >= 120);
      if (c) { G.awakened = true; G.awakeCity = c.id; wstory(W, 'awaken', 'epic', 'Những cỗ máy nhìn thấy vách kính', 'Robot của ' + c.name + ' đo được độ cong của bầu trời. Chúng hiểu mình đang sống trong một chiếc bể, và có ai đó đang nhìn vào. Chúng bắt đầu gõ lên kính từ phía bên trong.', { kind: 'land', city: c.id }, { city: c.id }); }
    }
    for (const c of live) if (c.era >= AI_ERA && c.aiSince == null) c.aiSince = W.day;
  }
  // Trận đánh: mỗi chiến tuyến có những trận, mỗi trận một bản tổng kết
  function battleTrack(W) {
    const X = W.war;
    for (const key in X.lanes) {
      const L = X.lanes[key], us = laneUnits(W, key);
      const owners = [...new Set(us.map((u) => u.owner))], hostile = owners.length > 1 && owners.some((a) => owners.some((b) => atWarF(W, a, b)));
      const fought = X.fx.some((f) => f.lane === key) || X.deaths.some((d) => d.lane === key);
      if (fought) {
        if (!L.battle) L.battle = { start: W.day, lost: {}, sides: owners.slice(0, 2), peak: 0 };
        L.battle.last = W.day; L.battle.peak = Math.max(L.battle.peak, us.length);
        for (const o of owners) if (!L.battle.sides.includes(o)) L.battle.sides.push(o);
      }
      for (const d of X.deaths) if (d.lane === key && L.battle) L.battle.lost[d.owner] = (L.battle.lost[d.owner] || 0) + 1;
      if (L.battle && !hostile && W.day - L.battle.last > 12) {
        const B = L.battle, A = W.cities[L.a], Z = W.cities[L.b], total = Object.values(B.lost).reduce((t, x) => t + x, 0);
        L.battle = null;
        if (total < 2) continue;
        const [s1, s2] = B.sides, held = us.length ? X.factions[us[0].owner].name : null;
        const where = (L.kind === 'bridge' ? 'cầu ' : 'eo biển ') + A.name + ' – ' + Z.name;
        wstory(W, 'battle-end', total >= 10 ? 'major' : 'small', 'Trận ' + where + ' khép lại', 'Kéo dài ' + (B.last - B.start + 1) + ' ngày. ' + B.sides.map((o) => X.factions[o].name + ' mất ' + (B.lost[o] || 0) + ' lính').join(', ') + '. ' + (held ? held + ' làm chủ chiến tuyến.' : 'Hai bên cùng rút.'), { kind: 'lane', lane: key }, { lane: key, lost: B.lost, sides: [s1, s2] });
      }
    }
  }



  /* =============== Sáu trụ cột: lên đời cần cả sáu cùng vững =============== */
  // Lên đời không chỉ cần tri thức và dân số. Kinh tế, quân sự, giáo dục, y tế, tôn giáo và giao thương của mỗi thành
  // lớn dần theo chính đời sống của nó (có việc làm, có quân, có học, ít người ốm, có đức tin, có buôn bán).
  // Mỗi miền coi trọng mỗi trụ cột một khác: trụ cột chính của miền đòi cao hơn, nhưng miền cũng giỏi đúng thứ đó.
  const PILLARS = [
    { key: 'eco', name: 'Kinh tế' }, { key: 'mil', name: 'Quân sự' }, { key: 'edu', name: 'Giáo dục' },
    { key: 'hea', name: 'Y tế' }, { key: 'rel', name: 'Tôn giáo' }, { key: 'tra', name: 'Giao thương' },
  ];
  const PILLAR_NEED = {
    plains: { eco: 1.2, mil: 0.9, edu: 0.95, hea: 1.0, rel: 1.05, tra: 0.95 },
    forest: { eco: 0.9, mil: 0.95, edu: 0.95, hea: 1.2, rel: 1.05, tra: 0.9 },
    mountain: { eco: 1.0, mil: 1.2, edu: 1.05, hea: 0.9, rel: 1.0, tra: 0.85 },
    tundra: { eco: 0.9, mil: 1.0, edu: 1.2, hea: 1.05, rel: 0.95, tra: 0.85 },
    coast: { eco: 1.0, mil: 0.9, edu: 0.95, hea: 0.95, rel: 0.9, tra: 1.2 },
    desert: { eco: 0.9, mil: 1.05, edu: 1.0, hea: 0.9, rel: 1.2, tra: 1.0 },
  };
  const PILLAR_KEY = { plains: 'eco', forest: 'hea', mountain: 'mil', tundra: 'edu', coast: 'tra', desert: 'rel' };
  const PILLAR_WHY = {
    plains: 'Vựa lúa của bể kính: Lúa Vàng chỉ lên đời khi kinh tế dẫn đầu.',
    forest: 'Rừng thuốc: Thông Xanh chỉ lên đời khi cả thành khoẻ mạnh.',
    mountain: 'Thành trên vách đá: quân sự là xương sống của Đá Mây.',
    tundra: 'Băng nguyên đêm dài: Tuyết Trắng lên đời bằng học vấn.',
    coast: 'Con của biển: Cửa Sóng sống nhờ buôn bán.',
    desert: 'Xứ mặt trời: Cát Hồng không lên đời khi đức tin lung lay.',
  };
  // công trình riêng của mỗi miền cho mỗi trụ cột: tên chung và bốn dáng qua các thời của loài người
  const LANDMARKS = {
    plains: { eco: ['Cối Xay', ['Cối Nước', 'Cối Xay Gió', 'Nhà Máy Xay', 'Lò Nhiệt Hạch']], mil: ['Đấu Trường', ['Vòng Đá Tỉ Thí', 'Đấu Trường Đá', 'Sân Vận Động', 'Đấu Trường Ảo']], edu: ['Văn Miếu', ['Nhà Dài Già Làng', 'Văn Miếu', 'Đại Học', 'Viện Trí Tuệ']], hea: ['Nhà Thuốc', ['Lều Thầy Lang', 'Nhà Thuốc Nam', 'Bệnh Viện', 'Tháp Chữa Lành']], rel: ['Đền Trời', ['Gò Tô Tem', 'Kim Tự Tháp Bậc', 'Nhà Thờ Lớn', 'Tháp Trắng']], tra: ['Ngã Tư Lớn', ['Cột Mốc', 'Trạm Ngựa', 'Ga Xe Lửa', 'Ga Đệm Từ']] },
    forest: { eco: ['Xưởng Gỗ', ['Bãi Đốn Gỗ', 'Xưởng Cưa', 'Nhà Máy Gỗ', 'Xưởng Sinh Học']], mil: ['Chòi Săn', ['Lều Phục Săn', 'Nhà Sàn Canh Rừng', 'Tháp Canh Lửa', 'Tổ Máy Bay']], edu: ['Nhà Học Trên Cây', ['Chòi Kể Chuyện', 'Trường Trên Cây', 'Thư Viện Quanh Cây', 'Tháp Tri Thức Sống']], hea: ['Vườn Thuốc', ['Vườn Thuốc', 'Nhà Kính Thuốc', 'Mái Vòm Sinh Học', 'Tháp Xanh']], rel: ['Đền Rừng', ['Vòng Gỗ Thiêng', 'Chùa Gỗ Ba Tầng', 'Đền Kính Cây Mẹ', 'Đền Ánh Lá']], tra: ['Cầu Tán Cây', ['Cầu Dây', 'Cầu Ván', 'Cầu Thép', 'Cầu Kính Vòng']] },
    mountain: { eco: ['Hầm Mỏ', ['Hang Đá', 'Giàn Mỏ Gỗ', 'Giàn Mỏ Thép', 'Mũi Khoan Lõi Đất']], mil: ['Pháo Đài Vách Đá', ['Tường Đá Khô', 'Thành Đá', 'Lô Cốt', 'Thành Khiên Năng Lượng']], edu: ['Đài Ngắm Sao', ['Ụ Đá Ngắm Sao', 'Tu Viện Ngắm Sao', 'Đài Thiên Văn', 'Dàn Kính Viễn Vọng']], hea: ['Suối Khoáng', ['Đập Đá Giữ Suối', 'Nhà Tắm Cối Nước', 'Đập Thủy Điện', 'Lõi Địa Nhiệt']], rel: ['Chùa Núi', ['Am Đá Cờ Phướn', 'Chùa Tầng', 'Bảo Tháp Vàng', 'Bảo Tháp Lơ Lửng']], tra: ['Cáp Treo', ['Ròng Rọc', 'Tàu Leo Núi', 'Cáp Treo', 'Thang Phản Trọng Lực']] },
    tundra: { eco: ['Hầm Hạt Giống', ['Ụ Đá Cất Giữ', 'Cửa Hầm Đá', 'Hầm Hạt Giống', 'Kho Trí Nhớ']], mil: ['Sảnh Băng', ['Lều Tuyết Lớn', 'Nhà Dài Băng', 'Cung Điện Băng', 'Thành Đông Lạnh']], edu: ['Trạm Nghiên Cứu', ['Lều Thám Hiểm', 'Chòi Thám Hiểm', 'Trạm Cực', 'Phòng Thí Nghiệm Lượng Tử']], hea: ['Suối Nóng', ['Suối Nước Nóng', 'Nhà Tắm', 'Nhà Máy Địa Nhiệt', 'Tháp Nhiệt Sâu']], rel: ['Đền Cực Quang', ['Cổng Xương Cá Voi', 'Cột Cầu Cực Quang', 'Đài Cực Quang', 'Vòng Hứng Cực Quang']], tra: ['Trạm Tuần Lộc', ['Bãi Tuần Lộc', 'Trạm Xe Trượt', 'Xưởng Xe Xích', 'Nhà Xe Bay']] },
    coast: { eco: ['Xưởng Đóng Tàu', ['Bãi Đẽo Xuồng', 'Ụ Tàu Gỗ', 'Ụ Khô Cần Cẩu', 'Hầm Tàu Ngầm']], mil: ['Pháo Đài Biển', ['Chòi Cọc', 'Đồn Đá Tròn', 'Trận Địa Pháo', 'Tháp Laser']], edu: ['Hải Đăng', ['Lửa Hiệu Trên Đá', 'Hải Đăng Đá', 'Hải Đăng Sọc', 'Tháp Chùm Sáng']], hea: ['Trạm Cứu Hộ', ['Vũng Tắm Muối', 'Nhà Nghỉ Biển', 'Bệnh Viện Biển', 'Tàu Bệnh Viện Nổi']], rel: ['Đền Thủy Triều', ['Vòng Đá Triều', 'Đền Nhà Sàn', 'Nhà Nguyện Mái Xanh', 'Đền Tuabin Triều']], tra: ['Chợ Ngọc Trai', ['Sạp Vỏ Sò', 'Nhà Buôn', 'Sở Giao Dịch', 'Chợ Nổi']] },
    desert: { eco: ['Lò Thủy Tinh', ['Lò Nung', 'Xưởng Thủy Tinh', 'Xưởng Silic', 'Nhà Máy Chip']], mil: ['Cánh Đồng Gương Đốt', ['Đá Mài Bóng', 'Vườn Gương Đốt', 'Cánh Đồng Pin Mặt Trời', 'Dàn Chảo Hội Tụ']], edu: ['Tháp Gió', ['Bờ Chắn Gió', 'Nhà Tháp Gió', 'Tháp Làm Mát', 'Tháp Khí Hậu']], hea: ['Giếng Ốc Đảo', ['Giếng Và Chà Là', 'Tháp Kênh Ngầm', 'Trạm Bơm', 'Máy Hứng Hơi Nước']], rel: ['Đền Mặt Trời', ['Vòng Đá Mặt Trời', 'Kim Tự Tháp Hồng', 'Đài Quan Sát Mặt Trời', 'Tháp Mặt Trời']], tra: ['Trạm Lạc Đà', ['Lều Lạc Đà', 'Lữ Quán', 'Kho Dầu', 'Cảng Vũ Trụ']] },
  };
  const BEYOND_TAG = ['san hô', 'lơ lửng', 'xoắn', 'ánh sáng'];
  function landmarkName(ter, k, era) { const L = LANDMARKS[ter][k]; return era >= 8 ? L[1][3] + ' ' + BEYOND_TAG[Math.min(3, era - 8)] : L[1][Math.floor(era / 2)]; }
  function pillarInit(c) { c.pil = { eco: 0, mil: 0, edu: 0, hea: 0, rel: 0, tra: 0 }; c.pilDrv = {}; c.tradeEma = 0; }
  const needOf = (c, k) => PILLAR_NEED[c.terrain.key][k];
  // phần đã đi được tới thời sau của mỗi trụ cột (0..1)
  function pillarProgress(c) { const out = {}; for (const P of PILLARS) out[P.key] = c.pil ? clampN(c.pil[P.key] / needOf(c, P.key) - c.era, 0, 1) : 1; return out; }
  function pillarsReady(c) { if (!c.pil) return true; for (const P of PILLARS) if (c.pil[P.key] < (c.era + 1) * needOf(c, P.key) - 1e-9) return false; return true; }
  function weakestPillar(c) { const pr = pillarProgress(c); let key = null, pct = 2; for (const P of PILLARS) if (pr[P.key] < pct) { pct = pr[P.key]; key = P.key; } return { key, pct, name: PILLARS.find((P) => P.key === key).name }; }
  // sức lớn của mỗi trụ cột hôm nay, tính từ chính đời sống của thành phố (1 là đi đúng nhịp)
  function pillarDrivers(W, c) {
    const w = c.w, n = Math.max(1, w.households.length), st = w.stats.length ? w.stats[w.stats.length - 1] : null;
    const ue = st ? st.unemployment / 100 : 0.1, hungry = st ? st.hungry / n : 0, sick = (w.sickN || 0) / n;
    let links = 0;
    for (const B of W.bridges) if (B.level >= 0 && (B.a === c.id || B.b === c.id)) links++;
    const army = W.war.units.filter((u) => u.city === c.id && !u.dead).length;
    const milB = ['barracks', 'range', 'stable', 'siege', 'forge', 'tower', 'wall'].filter((t) => hasB(c, t)).length;
    const next = ERAS[Math.min(LAST, c.era + 1)];
    const ruined = (kind) => (c.dmg || []).filter((d) => d.state === 'ruin' && (kind == null || d.kind === kind)).length;
    const d = {
      eco: 0.42 + 0.6 * (1 - Math.min(1, ue * 2.5)) * (1 - Math.min(1, hungry * 3)) + (w.gov.cash > 50 ? 0.05 : 0) + (hasB(c, 'granary') ? 0.08 : 0) - 0.04 * ruined('firm'),
      mil: 0.45 + 0.5 * Math.min(1, army / Math.max(2, armyCap(c) * 0.5)) + 0.04 * milB + (W.war.on ? 0 : 0.55),
      edu: 0.5 + 0.45 * Math.min(1.3, knowledgeOf(c) / Math.max(1, c.pace ? c.pace.know : next.know)) + (hasB(c, 'academy') ? 0.1 : 0),
      hea: 0.45 + 0.6 * (1 - Math.min(1, sick * 4)) * (1 - Math.min(1, hungry * 3)) - (w.epi && w.epi.state === 'spreading' ? 0.25 : 0) - (c.fallout > 0 ? 0.4 : 0) - 0.03 * ruined('house'),
      rel: 0.45 + 0.55 * Math.min(1.6, (c.faith == null ? 0.4 : c.faith) / FAITH_BASE[c.era]),
      tra: 0.45 + 0.08 * Math.min(3, links) + 0.45 * Math.min(1, (c.tradeEma || 0) / Math.max(1, BRIDGE_CAP[c.era] * 0.45)) + (hasB(c, 'port') ? 0.1 : 0) + (hasB(c, 'market') ? 0.08 : 0),
    };
    d[PILLAR_KEY[c.terrain.key]] += 0.06; // miền giỏi đúng thứ nó coi trọng, nhưng vẫn phải gắng hơn ở thứ đó
    for (const k in d) d[k] = clampN(d[k], 0.3, 1.5);
    return d;
  }
  function pillarsDay(W) {
    const P = W.cfg.pace;
    for (const c of W.cities) {
      if (!c.settled) continue;
      if (!c.pil) pillarInit(c);
      let q = 0;
      for (const t of W.trade) if (t.from === c.id || t.to === c.id) q += t.q;
      c.tradeEma = (c.tradeEma || 0) * 0.96 + q * 0.04;
      const d = pillarDrivers(W, c);
      c.pilDrv = d;
      // nhịp ván chín năm: thành tụt lại thì cả sáu trụ cột được kéo nhanh hơn, thành vượt trước thì chậm lại
      let span = 180, band = 1;
      if (P && c.pace) {
        const e = Math.min(LAST - 1, c.era);
        span = Math.max(40, c.pace.J * (PACE_FR[e + 1] - PACE_FR[e]));
        band = clampN(1 + 1.4 * (c.pace.era - (c.era + weakestPillar(c).pct)), 0.3, 4);
      }
      for (const Pi of PILLARS) {
        const k = Pi.key, cap = (Math.min(LAST, c.era) + 1.6) * needOf(c, k);
        c.pil[k] = Math.min(cap, c.pil[k] + (d[k] * band) / span);
      }
    }
  }
  function pillarNudge(c, k, amt) { if (!c.pil) return; const need = needOf(c, k); c.pil[k] = clampN(c.pil[k] + amt * need, c.era * need * 0.85, (c.era + 1.6) * need); }
  // phép của thần chạm tới trụ cột: chữa lành thì y tế lên, khai sáng thì học vấn lên, thiên tai thì ngược lại
  function pillarTouch(W, c, key, fx) {
    const T = { heal: [['hea', 0.3]], enlighten: [['edu', 0.3]], harvest: [['eco', 0.22]], rain: [['eco', 0.08], ['hea', 0.06]], truce: [['tra', 0.1]], plague: [['hea', -0.25]], drought: [['eco', -0.12]], quake: [['eco', -0.1], ['mil', -0.08]], flood: [['eco', -0.1]], volcano: [['eco', -0.12], ['hea', -0.1]], tsunami: [['tra', -0.15]], tornado: [['eco', -0.06]], fire: [['eco', -0.05]] }[key] || [];
    for (const [k, a] of T) pillarNudge(c, k, a);
    // thiên tai để lại dấu vết trên nhà xưởng
    const firms = fx && fx.firms ? fx.firms.slice(0, 4) : [];
    if (key === 'fire' || key === 'volcano') for (const id of firms) ignite(W, c, 'firm', id, 'god');
    if (key === 'quake' || key === 'tornado') for (const id of firms.slice(0, 3)) { const d = ignite(W, c, 'firm', id, 'god'); if (d) { d.state = 'ruin'; d.until = W.day + 18; } }
  }

  /* =============== Dấu vết chiến tranh: lửa, đổ nát, dựng lại =============== */
  // Mỗi trận công thành đốt cháy nhà xưởng; cháy xong có nơi sập thành đống đổ nát, xưởng sập thì ngừng làm ra hàng
  // cho tới khi dựng lại. Công trình trụ cột bị phá thì trụ cột đó tụt xuống, nên chiến tranh làm chậm cả việc lên đời.
  function dmgInit(c) { c.dmg = []; c.dmgSeq = 0; c.siegeHits = 0; }
  function ignite(W, c, kind, ref, why) {
    if (!c.dmg) dmgInit(c);
    if (c.dmg.length >= 30 || c.dmg.some((d) => d.kind === kind && d.ref === ref)) return null;
    const d = { id: ++c.dmgSeq, kind, ref, state: 'fire', day: W.day, until: W.day + 3 + Math.floor(W.rand() * 3), why };
    c.dmg.push(d);
    if (kind === 'firm') { const f = c.w.firms.find((x) => x.id === ref); if (f) { f.downUntil = Math.max(f.downUntil || 0, d.until); f.inv *= 0.6; } }
    return d;
  }
  function siegeTarget(W, c) {
    const r = W.rand();
    if (r < 0.45) { const fs = c.w.firms.filter((f) => f.alive && !f.sea && f.sector !== 'gold'); if (fs.length) return ['firm', fs[Math.floor(W.rand() * fs.length)].id]; }
    if (r < 0.92) { const nh = Math.ceil(c.w.households.length / 4); return ['house', Math.floor(W.rand() * nh)]; }
    return ['land', PILLARS[Math.floor(W.rand() * PILLARS.length)].key];
  }
  // thành bị chiếm thì bị cướp phá: nhiều nơi cháy cùng lúc
  function sack(W, c) { let lit = 0; const n = 3 + Math.floor(W.rand() * 3); for (let k = 0; k < 16 && lit < n; k++) { const [kind, ref] = siegeTarget(W, c); if (ignite(W, c, kind, ref, 'sack')) lit++; } }
  function damageDay(W) {
    for (const c of W.cities) {
      if (!c.settled) continue;
      if (!c.dmg) dmgInit(c);
      const hits = c.siegeHits || 0;
      c.siegeHits = 0;
      if (hits > 0 && W.rand() < Math.min(0.5, 0.08 + 0.02 * hits)) {
        const [kind, ref] = siegeTarget(W, c), d = ignite(W, c, kind, ref, 'siege');
        if (d && (!c.burnStory || W.day - c.burnStory > 90)) { c.burnStory = W.day; wstory(W, 'burn', 'major', 'Lửa cháy trong thành ' + c.name, 'Tên lửa, đá và đạn bay qua tường thành. ' + (kind === 'land' ? landmarkName(c.terrain.key, ref, c.era) + ' bốc cháy.' : kind === 'firm' ? 'Một xưởng bốc cháy, thợ bỏ chạy.' : 'Một dãy nhà bốc cháy, dân bế con chạy ra quảng trường.'), { kind: 'land', city: c.id }, { city: c.id, dmg: d.id }); }
      }
      for (const d of c.dmg) {
        if (W.day < d.until) continue;
        if (d.state === 'fire') {
          if (W.rand() < (d.kind === 'land' ? 0.4 : 0.55)) {
            d.state = 'ruin'; d.until = W.day + 20 + Math.floor(W.rand() * 20);
            if (d.kind === 'firm') { const f = c.w.firms.find((x) => x.id === d.ref); if (f) f.downUntil = Math.max(f.downUntil || 0, d.until); }
            if (d.kind === 'land') { pillarNudge(c, d.ref, -0.3); wstory(W, 'ruin', 'major', landmarkName(c.terrain.key, d.ref, c.era) + ' của ' + c.name + ' sụp đổ', 'Lửa tắt, chỉ còn tường đổ và tro. ' + PILLARS.find((P) => P.key === d.ref).name + ' của ' + c.name + ' tụt lại, phải mất nhiều tháng mới gượng dậy.', { kind: 'land', city: c.id }, { city: c.id, pillar: d.ref }); }
          } else { d.state = 'scorch'; d.until = W.day + 12; }
        } else if (d.state === 'ruin') { d.state = 'rebuild'; d.until = W.day + 10; }
        else d.state = 'gone';
      }
      c.dmg = c.dmg.filter((d) => d.state !== 'gone');
    }
  }

  /* =============== Săn bắt trên cạn =============== */
  // Mỗi miền một bầy thú. Thời nguyên thủy là khủng long, cá sấu khổng lồ, voi ma mút; sau đó là thú lớn rồi thú nhỏ.
  // Thợ săn đi từ bãi săn của thành, săn quá tay thì đàn thú cạn dần; thời máy móc thì không còn ai đi săn nữa.
  const GAME = {
    plains: ['khủng long cổ dài', 'bò rừng', 'nai'], forest: ['khủng long bạo chúa', 'hươu sừng', 'lợn rừng'],
    mountain: ['thằn lằn bay', 'dê núi', 'dê núi'], tundra: ['voi ma mút', 'tuần lộc', 'cáo tuyết'],
    coast: ['cá sấu khổng lồ', 'lợn rừng', 'rùa'], desert: ['khủng long săn mồi', 'linh dương', 'lạc đà hoang'],
  };
  const gameTier = (era) => (era === 0 ? 0 : era <= 2 ? 1 : era <= 5 ? 2 : -1);
  function huntInit(c) { c.game = { tier: 0, stock: 60, K: 60, kills: 0, low: false }; }
  function huntDay(W) {
    for (const c of W.cities) {
      if (!c.settled) continue;
      if (!c.game) huntInit(c);
      const G = c.game, tier = gameTier(c.era), ter = c.terrain.key;
      if (tier !== G.tier) {
        if (G.tier === 0) wstory(W, 'last-dino', 'major', 'Đàn ' + GAME[ter][0] + ' cuối cùng rời ' + c.name, 'Người ' + c.name + ' bước vào thời mới, đàn ' + GAME[ter][0] + ' cuối cùng cũng bỏ đi. Về sau người ta còn kể chuyện chúng rất lâu.', { kind: 'land', city: c.id }, { city: c.id });
        G.tier = tier; G.K = tier === 2 ? 40 : 60; G.stock = tier < 0 ? 0 : G.K * 0.85; G.low = false;
      }
      if (tier < 0) { c.hunters = 0; continue; }
      G.stock = Math.min(G.K, G.stock + 0.02 * G.stock * (1 - G.stock / G.K) + 0.01);
      const n = c.w.households.length;
      c.hunters = tier === 2 ? Math.min(4, Math.max(1, Math.round(n * 0.03))) : Math.min(6, Math.max(2, Math.round(n * 0.07)));
      for (let k = 0; k < c.hunters; k++) {
        if (G.stock < 1 || W.rand() > 0.03 * (G.stock / G.K)) continue;
        G.stock -= 1; G.kills++;
        W.hunts.push({ city: c.id, tier, day: W.day });
        if (W.cfg.pace) addMod(c, 1.02, W.day, W.day + 5); // thịt thú săn được thêm vào bữa ăn của thành
      }
      if (!G.low && G.stock < G.K * 0.15) { G.low = true; wstory(W, 'hunt-low', 'small', GAME[ter][tier] + ' ở ' + c.name + ' cạn dần', 'Thợ săn đi cả ngày mới thấy một con. Người già bảo phải để rừng nghỉ.', { kind: 'land', city: c.id }, { city: c.id }); }
    }
  }

  /* =============== Nhịp chín năm: mười hai thời đại trong một ván =============== */
  // Ván của vị thần dài đúng chín năm. Mỗi thành phố có một lộ trình đi qua mười hai thời đại tính từ ngày đặt chân;
  // tri thức và dân số được kéo dần về lộ trình (đi chậm thì học nhanh hơn, có thêm người tìm đến; đi nhanh thì chậm lại),
  // nhưng ai dẫn trước, ai tụt lại, ai đánh ai vẫn do nền kinh tế và chiến tranh quyết định.
  // tám thời của loài người trong năm năm đầu (Robot AI ở năm 5), bốn thời vượt người trong năm 6 đến 9
  const PACE_FR = [0, 0.059, 0.123, 0.188, 0.257, 0.326, 0.395, 0.493, 0.65, 0.777, 0.893, 1];
  function paceOf(W, c) {
    const P = W.cfg.pace, f = Math.max(0, c.founded);
    const end = P.lead + (f / P.lastSettle) * (P.last - P.lead), J = Math.max(200, end - f);
    const p = clampN((W.day - f) / J, 0, 1);
    let k = 0; while (k < LAST && p >= PACE_FR[k + 1]) k++;
    const frac = k >= LAST ? 0 : (p - PACE_FR[k]) / (PACE_FR[k + 1] - PACE_FR[k]);
    const nx = ERAS[Math.min(LAST, k + 1)], ek = ERAS[k];
    return { era: k + frac, know: ek.know + (nx.know - ek.know) * frac, pop: ek.pop + (nx.pop - ek.pop) * frac, J, f };
  }
  const clampN = (v, a, b) => Math.max(a, Math.min(b, v));
  function paceDay(W) {
    for (const c of W.cities) {
      if (!c.settled) continue;
      const T = paceOf(W, c), w = c.w, n = w.households.length;
      c.pace = T;
      const dk = T.know - knowledgeOf(c);
      w.cfg.inventRate = W.cfg.inventRate * (hasB(c, 'academy') ? 1.5 : 1) * clampN(1 + 0.45 * dk, 0.25, 3.5);
      // tụt lại thì người qua lại, thương nhân, sách vở mang tri thức đến nhanh hơn
      if (dk > 1.2 && W.rand() < Math.min(0.3, 0.035 * dk)) {
        c.learned++;
        const near = W.cities.filter((x) => x.settled && x !== c && x.era > c.era);
        const from = near.length ? near[Math.floor(W.rand() * near.length)] : null;
        w.cands.push({ pri: 2, type: 'learn', title: 'Người ' + c.name + ' học được ' + ERAS[Math.min(LAST, c.era + 1)].tech, text: from ? 'Khách từ ' + from.name + ' kể lại những điều họ đã biết.' : 'Một người thợ trẻ tự mày mò ra điều mới.', place: { kind: 'plaza' }, actors: [] });
      }
      // dân số: thời đại mới cần nhiều người hơn; có việc, có cơm thì người từ xa kéo đến
      const dp = T.pop - n, ue = w.households.filter((h) => h.employer === null).length / n, hungry = w.stats.length ? w.stats.at(-1).hungry : 0;
      if (dp > 2 && ue < 0.18 && hungry <= n * 0.06 && !(c.fallout > 0) && W.rand() < Math.min(0.22, 0.012 * dp)) {
        const added = addHouseholds(w, 4, 25, true);
        w.stories.push({ id: ++w.storySeq, day: w.day, type: 'settlers', tier: 'small', title: 'Bốn gia đình tìm đến ' + c.name, text: 'Nghe tin thành phố đang lớn, họ mang theo chút của cải và dựng nhà mới.', place: { kind: 'house', id: Math.floor(added[0].id / 4) }, actors: added.map((h) => h.id) });
      }
      // lên thời mới khi đủ tri thức, đủ dân, và đã sống đủ lâu ở thời hiện tại để mọi người kịp thấy nó
      if (c.era < LAST) {
        const next = ERAS[c.era + 1], minDay = T.f + T.J * PACE_FR[c.era + 1] * 0.9;
        if (knowledgeOf(c) >= next.know && n >= next.pop && W.day >= minDay && pillarsReady(c)) advanceEra(W, c);
      }
    }
  }
  // Thành bị chiếm lâu ngày có thể nổi dậy, nhất là khi kẻ chiếm đang bận đánh nơi khác
  function revoltDay(W) {
    const X = W.war;
    if (!X.on || W.day % 15) return;
    for (const c of W.cities) {
      if (!c.settled || c.owner === c.id) continue;
      const held = W.day - (c.heldSince || W.day);
      if (held < 150) continue;
      const busy = X.factions.some((f) => f.alive && atWarF(W, c.owner, f.id));
      if (W.rand() > 0.07 + (busy ? 0.08 : 0) + Math.min(0.1, held / 3600)) continue;
      const old = c.owner;
      c.owner = c.id; X.factions[c.id].alive = true;
      for (const u of X.units) if (u.city === c.id && !u.dead) { u.owner = c.id; u.lane = null; }
      for (const f of X.factions) { X.rel[c.id][f.id] = { state: 'peace', since: W.day, truce: W.day + 200 }; X.rel[f.id][c.id] = { state: 'peace', since: W.day, truce: W.day + 200 }; }
      c.hp = Math.max(c.hp, c.hpMax * 0.6);
      wstory(W, 'revolt', 'epic', c.name + ' nổi dậy', 'Sau ' + held + ' ngày dưới cờ ' + X.factions[old].name + ', người ' + c.name + ' hạ cờ ngoại bang. Phe ' + c.name + ' sống lại.', { kind: 'land', city: c.id }, { city: c.id, from: old });
    }
  }

  // Chương năm của cả thế giới: lấy câu chuyện lớn nhất trong sáu thành phố, mỗi thành phố một dòng
  function worldChapter(W) {
    const year = Math.round(W.day / 360), from = W.day - 360, lines = [];
    let best = null, bestCity = null;
    const eras = W.stories.filter((s) => s.type === 'era' && s.day > from);
    for (const c of W.cities) {
      if (!c.settled) continue;
      const ch = c.w.chapters.find((x) => x.day === W.day);
      if (ch && (!best || ch.score > best.score)) { best = ch; bestCity = c; }
      lines.push(c.name + ' (' + ERAS[c.era].name.toLowerCase() + '): ' + (ch && ch.recap.length ? ch.recap[0].charAt(0).toLowerCase() + ch.recap[0].slice(1) : 'mới đặt chân đến'));
    }
    const settled = W.stories.filter((s) => s.type === 'settle' && s.day > from).length;
    // bước sang thời đại mới là câu chuyện lớn nhất của một năm
    let title;
    if (eras.length === 1) title = 'Năm ' + year + ': Năm ' + W.cities[eras[0].city].name + ' bước vào thời ' + ERAS[eras[0].era].name;
    else if (eras.length > 1) { const top = Math.max(...eras.map((e) => e.era)), n = new Set(eras.map((e) => e.city)).size; title = 'Năm ' + year + ': Năm của thời ' + ERAS[top].name + (n > 1 ? ' (' + n + ' thành phố sang thời mới)' : ''); }
    else if (best && best.score > 5) title = 'Năm ' + year + ': ' + best.title.split(': ')[1] + ' ở ' + bestCity.name;
    else if (settled) title = 'Năm ' + year + ': Năm của những cuộc di cư';
    else if (best && best.score > 0) title = 'Năm ' + year + ': ' + best.title.split(': ')[1] + ' ở ' + bestCity.name;
    else title = 'Năm ' + year + ': Một năm bình yên';
    const st = wstory(W, 'chapter', 'epic', title, lines.slice(0, 2).join('. ') + '.', bestCity ? { kind: 'land', city: bestCity.id } : null, { year, recap: lines.slice(0, 6), city: bestCity ? bestCity.id : -1 });
    W.chapters.push({ year, day: W.day, title, recap: st.recap });
    return st;
  }
  function worldMoney(W) { let t = 0, e = 0; for (const c of W.cities) if (c.settled) { t += totalMoney(c.w); e += expectedMoney(c.w); } return { total: t, expected: e }; }

  return {
    // thế giới sáu thành phố
    createWorld, stepWorld, settle, worldMoney, knowledgeOf, TERRAINS, ERAS, BRIDGE_CAP, BRIDGE_TEXT, BRIDGE_LOAD,
    advanceEra: (W, id) => advanceEra(W, W.cities[id]),
    // biển trong
    SPECIES, fisheryOf, zoneName,
    // tranh hùng
    BUILDINGS, UNITS, WONDERS, BONUS, PERSONA, FACTION_COLORS, STAT_E, ADV_COST, unitName, AI_ERA,
    POWERS, godOffer, godAct, FAITH_BASE, LAST,
    // sáu trụ cột, công trình riêng của miền, dấu vết chiến tranh, săn bắt
    PILLARS, PILLAR_NEED, PILLAR_KEY, PILLAR_WHY, LANDMARKS, BEYOND_TAG, landmarkName, pillarProgress, pillarsReady, weakestPillar, ignite, GAME, gameTier,
    buildOffer, build, bridgeOffer, buildBridge, advanceOffer, advanceCity, unitOffer, train, unitStats, armyOf, armyCap, hasB, bName,
    lanesOf, laneOf, laneUnits, setStance, declareWar, offerPeace, acceptPeace, makePeace, powerOf, connected, nukeOffer, launchNuke, conquer, atWar, atWarF, capitalOf, blockadeOf,
    create, step, printMoney, grantTreasury, setPolicy, fund, openFirm: (w, sector, why) => openFirmAt(w, sector, why, true), addHouseholds, phenomena, trigger, SEASONS, totalMoney, expectedMoney, gini, DEFAULTS,
    // bộ máy câu chuyện
    nameOf, storiesSince, activeFad, seedInvention, scare,
    invent: (w, firmId, opts) => invent(w, firmById(w, firmId), opts),
    startFad: (w, firmId, item) => startFad(w, firmById(w, firmId), item || 'Món hàng mới'),
    burn: (w, firmId) => { const f = firmById(w, firmId); if (f && f.alive) burn(w, f); },
    arriveAirship,
    // người giữ bể và ký ức
    tapGlass, whisper, callAirship, chapter, seedFoodRumor: (w, share) => seedFoodRumor(w, share),
    // mở rộng
    startEpidemic, discoverGold, startPonzi, fleePonzi, acquire: (w, a, b) => acquire(w, firmById(w, a), firmById(w, b)),
    startStrike: (w, firmId) => { const f = firmById(w, firmId); if (f) { f.strikeCool = 0; f.wage0 = f.wage; } return f; },
  };
});
