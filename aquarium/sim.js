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
  };

  /* Thời đại và miền đất: dùng chung cho thế giới sáu thành phố */
  const ERAS = [
    { key: 'primitive', name: 'Nguyên thủy', know: 0, pop: 0, bank: 'Kho Chung', hall: 'Lều Tù Trưởng', fest: 'Lễ hội lửa trại', tech: '' },
    { key: 'ancient', name: 'Cổ đại', know: 3, pop: 36, bank: 'Kho Đền', hall: 'Cung Đất Nung', fest: 'Lễ hội mùa gặt', tech: 'cách nung gạch và làm gốm' },
    { key: 'medieval', name: 'Trung đại', know: 7, pop: 48, bank: 'Nhà Đổi Tiền', hall: 'Thành Đá', fest: 'Lễ hội đèn lồng', tech: 'cách rèn sắt và dựng cối xay gió' },
    { key: 'early', name: 'Cận đại', know: 12, pop: 60, bank: 'Kho Bạc', hall: 'Tháp Đồng Hồ', fest: 'Lễ hội đèn lồng', tech: 'cách in sách, mài kính và đóng khí cầu' },
    { key: 'industrial', name: 'Công nghiệp', know: 18, pop: 76, bank: 'Ngân Hàng Thành Phố', hall: 'Toà Thị Chính', fest: 'Lễ hội pháo hoa', tech: 'máy hơi nước và đường ray' },
    { key: 'modern', name: 'Hiện đại', know: 25, pop: 92, bank: 'Ngân Hàng Trung Tâm', hall: 'Trung Tâm Hành Chính', fest: 'Lễ hội ánh sáng', tech: 'điện, máy tính và tuabin gió' },
  ];
  const eraOf = (w) => ERAS[Math.max(0, Math.min(5, w.cfg.era == null ? 3 : w.cfg.era))];
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
    let s = 0;
    for (const hid of f.workers) { const h = w.households[hid]; if (!(h.sick > 0)) s += f.prod * h.skill; }
    return s;
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
  const FOOD_PREFIX = ['Bãi Săn', 'Ruộng', 'Cối Xay', 'Trang Trại', 'Nông Trường', 'Nông Trại'];
  const GOODS_PREFIX = ['Lều Chế Tác', 'Lò', 'Lò Rèn', 'Xưởng', 'Nhà Máy', 'Công Ty'];
  function firmTitle(sector, era, root) { return (sector === 'food' ? FOOD_PREFIX : GOODS_PREFIX)[Math.max(0, Math.min(5, era))] + ' ' + root; }
  function firmRootFor(w, sector) {
    const list = sector === 'food' ? FOOD_ROOTS : GOODS_ROOTS;
    const used = new Set(w.firms.filter((f) => f.alive).map((f) => f.root));
    const pool = list.filter((n) => !used.has(n));
    const src = pool.length ? pool : list;
    return src[Math.floor(w.rand() * src.length)];
  }
  function firmNameFor(w, sector) { const root = firmRootFor(w, sector); return { root, name: firmTitle(sector, w.cfg.era == null ? 3 : w.cfg.era, root) }; }
  // sang thời đại mới, các nơi làm ăn đổi biển hiệu
  function renameFirms(w) { for (const f of w.firms) if (f.root && f.sector !== 'gold') f.name = firmTitle(f.sector, w.cfg.era, f.root); }
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
    for (const f of alive) if (!(f.downUntil > w.day)) f.inv += outputOf(w, f) * (f.sector === 'food' ? ff : f.sector === 'gold' ? w.gold.yield : 1); // xưởng đang dựng lại sau hoả hoạn thì không sản xuất
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
    if (w.gov.cash > 300) payToHouseholds(w, w.gov, w.gov.cash - 300, 'benefit', w.households.length);

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
    { key: 'forest', land: 'Rừng', city: 'Thông Xanh', food: 1.0, goods: 1.1, settle: 90, from: 'Một nhóm thợ săn vượt cầu dây leo sang khu rừng già, dựng lều giữa những gốc thông.' },
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
  ];
  const BRIDGE_TEXT = ['cầu dây leo', 'cầu gỗ trên trụ đá', 'cầu vòm đá', 'cầu có mái che và đèn', 'cầu sắt', 'cầu dây văng'];
  const BRIDGE_CAP = [2, 4, 6, 9, 13, 18]; // số món hàng mỗi ngày mỗi chiều, theo thời đại của cây cầu

  function createWorld(opts) {
    opts = opts || {};
    const seed = opts.seed == null ? 7 : opts.seed;
    const W = {
      seed, day: 0, rand: makeRng(seed * 7919 + 13), cfg: Object.assign({ start: 28, growth: 2.2, inventRate: 1 / 110, settle: null, off: {} }, opts),
      cities: TERRAINS.map((t, i) => ({ id: i, terrain: t, name: t.city, era: 0, settled: false, w: null, learned: 0, founded: -1 })),
      bridges: TERRAINS.map((t, i) => ({ id: i, a: i, b: (i + 1) % TERRAINS.length, era: 0, traded: 0, firstTrade: false })),
      stories: [], storySeq: 0, trade: [], tradeTotal: 0, chapters: [],
    };
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
    // chia việc theo nhu cầu thật: chỉ cần đủ người làm ra lương thực, số còn lại làm hàng hoá
    const food = w.firms.filter((f) => f.sector === 'food'), goods = w.firms.filter((f) => f.sector === 'goods');
    const need = Math.ceil((k * 1.12) / (w.cfg.foodProd * 1.05));
    let fw = food.reduce((t, f) => t + f.workers.length, 0), gi = 0;
    while (fw > need) {
      const f = food.reduce((a, b) => (b.workers.length > a.workers.length ? b : a));
      const hid = f.workers.pop(); const g = goods[gi++ % goods.length]; g.workers.push(hid); w.households[hid].employer = g.id; fw--;
    }
    // kỳ vọng bán hàng ban đầu theo đúng số miệng ăn, để không nơi nào tuyển thừa rồi sa thải hàng loạt
    for (const f of food) { f.avgSales = k / food.length; f.inv = f.avgSales * 2; }
    for (const f of goods) { f.avgSales = (k * 1.3) / goods.length; f.inv = f.avgSales * 1.5; }
    w.cityId = i; w.cityName = c.name;
    c.w = w; c.settled = true; c.founded = W.day;
    const near = W.cities.filter((x) => x.settled && x !== c && W.bridges.some((b) => (b.a === i && b.b === x.id) || (b.b === i && b.a === x.id)));
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
  // Buôn bán qua cầu: hàng đi từ nơi rẻ sang nơi đắt, tiền đi ngược lại; sổ cái mỗi thành phố ghi tiền vào và tiền ra
  function bridgeDay(W, B) {
    const A = W.cities[B.a], Z = W.cities[B.b];
    const era = A.settled && Z.settled ? Math.min(A.era, Z.era) : 0;
    if (era > B.era) { B.era = era; wstory(W, 'bridge', 'major', 'Cầu nối ' + A.name + ' và ' + Z.name + ' được xây lại', 'Cây cầu cũ được thay bằng ' + BRIDGE_TEXT[era] + '. Mỗi ngày giờ chở được ' + BRIDGE_CAP[era] + ' xe hàng mỗi chiều.', { kind: 'bridge', bridge: B.id }, { bridge: B.id }); }
    if (!A.settled || !Z.settled) return;
    for (const sector of ['food', 'goods']) {
      const pa = avgPrice(A.w, sector), pz = avgPrice(Z.w, sector);
      if (!pa || !pz) continue;
      const [src, dst, ps, pd] = pa < pz ? [A, Z, pa, pz] : [Z, A, pz, pa];
      if (ps > pd * 0.85) continue; // chênh lệch không đủ bù công chở
      const sellers = src.w.firms.filter((f) => f.alive && f.sector === sector && f.inv > 4 && !(f.downUntil > W.day)).sort((x, y) => x.price - y.price);
      const buyers = dst.w.firms.filter((f) => f.alive && f.sector === sector).sort((x, y) => x.inv - y.inv);
      const se = sellers[0], bu = buyers[0];
      if (!se || !bu) continue;
      const q = Math.min(BRIDGE_CAP[B.era], Math.floor(se.inv - 3));
      const price = (ps + pd) / 2, amt = q * price;
      if (q <= 0 || bu.cash < amt) continue;
      se.inv -= q; se.sold += q; bu.inv += q;
      bu.cash -= amt; se.cash += amt;
      dst.w.ledger.outflow += amt; src.w.ledger.inflow += amt;
      B.traded += q; W.tradeTotal += q;
      W.trade.push({ bridge: B.id, from: src.id, to: dst.id, q, sector });
      if (!B.firstTrade) { B.firstTrade = true; wstory(W, 'trade', 'major', 'Chuyến hàng đầu tiên qua cầu', 'Người ' + src.name + ' chở ' + (sector === 'food' ? 'lương thực' : 'hàng hoá') + ' sang bán ở ' + dst.name + ', nơi giá đắt hơn ' + Math.round((pd / ps - 1) * 100) + '%. Từ nay hai thành phố nương vào nhau.', { kind: 'bridge', bridge: B.id }, { bridge: B.id, from: src.id, to: dst.id }); }
    }
    // tri thức đi theo người qua cầu: nơi đi sau học được của nơi đi trước
    if (A.era !== Z.era && W.rand() < 1 / 120) {
      const [hi, lo] = A.era > Z.era ? [A, Z] : [Z, A];
      lo.learned++;
      const st = lo.w.stories;
      lo.w.cands.push({ pri: 3, type: 'learn', title: 'Người ' + lo.name + ' học được ' + ERAS[hi.era].tech, text: 'Những người qua cầu từ ' + hi.name + ' mang theo ' + ERAS[hi.era].tech + '.', place: { kind: 'plaza' }, actors: [] });
      void st;
    }
  }
  function advanceEra(W, c) {
    c.era++;
    const w = c.w;
    w.cfg.era = c.era; renameFirms(w);
    // thời đại mới thu hút người từ những bộ lạc còn lang thang
    const added = addHouseholds(w, 8, 30, true);
    wstory(W, 'era', 'epic', c.name + ' bước vào thời ' + ERAS[c.era].name, ERA_TEXT[c.era] + ' Tám gia đình mới kéo đến.', { kind: 'land', city: c.id }, { city: c.id, era: c.era, actors: added.map((h) => h.id) });
  }
  function stepWorld(W) {
    W.day++;
    W.trade = [];
    for (const c of W.cities) if (!c.settled && W.day >= (W.cfg.settle ? W.cfg.settle[c.id] : c.terrain.settle)) settle(W, c.id);
    for (const c of W.cities) {
      if (!c.settled) continue;
      scaleLimits(c.w);
      step(c.w);
      c.w.cfg.growth = W.cfg.growth;
      // người lang thang xin nhập cư khi thành phố có việc và có cơm
      const n = c.w.households.length, ue = c.w.households.filter((h) => h.employer === null).length / n, hungry = c.w.stats.at(-1).hungry;
      if (n < 240 && ue < 0.06 && hungry <= n * 0.03 && W.rand() < 1 / 70) {
        const added = addHouseholds(c.w, 4, 25, true);
        c.w.stories.push({ id: ++c.w.storySeq, day: c.w.day, type: 'settlers', tier: 'small', title: 'Bốn gia đình xin nhập cư', text: 'Nghe nói ở ' + c.name + ' ai cũng có việc, họ mang theo chút của cải và dựng nhà mới.', place: { kind: 'house', id: Math.floor(added[0].id / 4) }, actors: added.map((h) => h.id) });
      }
    }
    for (const B of W.bridges) bridgeDay(W, B);
    for (const c of W.cities) {
      if (!c.settled || c.era >= 5) continue;
      const next = ERAS[c.era + 1];
      if (knowledgeOf(c) >= next.know && c.w.households.length >= next.pop) advanceEra(W, c);
    }
    if (W.day % 360 === 0) worldChapter(W);
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
    createWorld, stepWorld, settle, worldMoney, knowledgeOf, TERRAINS, ERAS, BRIDGE_CAP,
    advanceEra: (W, id) => advanceEra(W, W.cities[id]),
    create, step, printMoney, setPolicy, fund, openFirm: (w, sector, why) => openFirmAt(w, sector, why, true), addHouseholds, phenomena, trigger, SEASONS, totalMoney, expectedMoney, gini, DEFAULTS,
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
