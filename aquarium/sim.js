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
    off: {},            // tắt từng cơ chế câu chuyện để chẩn đoán: { invent, fear, fad, airship, fire }
  };

  function create(opts) {
    const cfg = Object.assign({}, DEFAULTS, opts || {});
    const rand = makeRng(cfg.seed);
    const w = {
      cfg, rand, day: 0,
      households: [], firms: [],
      bank: { key: 'bank', cash: 0, loansOut: 0, writtenOff: 0, losses: 0 },
      gov: { key: 'gov', cash: 0 },
      ledger: { M0: 0, printed: 0, inflow: 0, created: 0, destroyed: 0, absorbed: 0 },
      policy: { taxRate: cfg.taxRate, interestRate: cfg.interestRate, minWage: cfg.minWage },
      stats: [], events: [], flows: [], nextFirmId: 0, basePrice: null,
      phen: { rain: 0, drought: 0, droughtYear: -1, festival: 0, panic: 0, panicCool: 0, badDebt: 0 },
      // bộ máy câu chuyện
      stories: [], storySeq: 0, cands: [], lastSmall: -99, spread: [], fearShare: 0,
      fads: [], fadSeq: 0, inventions: [], inventionsUsed: [], variety: 0, seedReady: 0,
      airship: { state: 'away', days: 0, cool: 140, visits: 0, units: 0, revenue: 0, demand: 0, called: false },
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
    return { key: 'h' + id, id, cash, employer: null, hungry: 0, ateToday: true, skill: 0.7 + r * 0.7, fear: 0, calm: 0, hype: 0, bored: [], hoard: 0, joblessSince: 0, richFlag: false };
  }

  function newFirm(w, sector, cash) {
    const id = w.nextFirmId++;
    const prod = sector === 'food' ? w.cfg.foodProd : w.cfg.goodsProd;
    const unitCost = w.cfg.wage / prod;
    // mỗi doanh nghiệp có 3 hộ làm chủ, nhận cổ tức
    const owners = [];
    for (let k = 0; k < 3 && w.households.length; k++) owners.push(Math.floor(w.rand() * w.households.length));
    return {
      owners, name: firmNameFor(w, sector), inventions: 0, downUntil: 0, fadId: 0, peakWorkers: 0,
      key: 'f' + id, id, sector, cash: cash || 0, inv: 6, prod, baseProd: prod,
      price: unitCost * 1.25, wage: w.cfg.wage, workers: [], vacancies: 0, unfilled: 0,
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
    let m = w.bank.cash + w.gov.cash;
    for (const h of w.households) m += h.cash;
    for (const f of w.firms) m += f.cash;
    return m;
  }
  function expectedMoney(w) {
    const L = w.ledger;
    return L.M0 + L.printed + (L.inflow || 0) + L.created - L.destroyed - (L.absorbed || 0);
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
  function outputOf(w, f) { let s = 0; for (const hid of f.workers) s += f.prod * w.households[hid].skill; return s; }
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
    else if (season === 1 && p.droughtYear !== year && w.rand() < 0.012) { p.drought = 30 + Math.floor(w.rand() * 25); p.droughtYear = year; p.rain = 0; story(w, 'drought', 'epic', 'Hạn hán', 'Trời không mưa suốt nhiều tuần. Ruộng khô nứt, sản lượng lương thực giảm hơn một phần ba trong ' + p.drought + ' ngày.', { kind: 'farms' }); }
    // lễ hội đèn lồng cuối năm
    if (doy === 345) { p.festival = 15; story(w, 'festival', 'major', 'Lễ hội đèn lồng', 'Mười lăm ngày cuối năm. Người dân sắm sửa, đèn trời bay lên từ mọi mái nhà.', { kind: 'plaza' }); }
    else if (p.festival > 0) p.festival--;
    // khủng hoảng niềm tin: nợ xấu tăng vọt thì ngân hàng ngừng cho vay
    p.badDebt *= 0.985;
    if (p.panicCool > 0) p.panicCool--;
    if (p.panic > 0) {
      p.panic--;
      if (p.panic === 0) {
        if ((w.fearShare || 0) > 0.12) p.panic = 1; // còn nhiều người sợ thì đám đông chưa giải tán
        else story(w, 'bankrun-end', 'major', 'Kho Bạc trụ vững', 'Nỗi sợ lắng xuống, đám đông giải tán. Ngân hàng cho vay trở lại.', { kind: 'bank' });
      }
    } else if (p.panicCool === 0 && p.badDebt > 0.13 * Math.max(2000, w.bank.loansOut)) {
      // nợ xấu không trực tiếp gây khủng hoảng: nó gieo tin đồn, còn tin đồn có lan hay không là chuyện của đám đông
      p.panicCool = 150;
      const k = Math.round(w.households.length * 0.18);
      for (let i = 0; i < k; i++) scare(w, w.households[Math.floor(w.rand() * w.households.length)], 6 + Math.floor(w.rand() * 5));
      story(w, 'rumor', 'major', 'Tin đồn về Kho Bạc', 'Nợ xấu chồng chất. Người ta bắt đầu thì thầm rằng Kho Bạc sắp không trả nổi tiền.', { kind: 'bank' });
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
  const GOODS_NAMES = ['Xưởng Bánh Răng Đồng', 'Lò Thuỷ Tinh Lam', 'Xưởng Đồng Hồ Sao', 'Lò Gốm Mây', 'Xưởng Dệt Gió', 'Lò Rèn Ánh Lửa', 'Xưởng Đèn Lồng', 'Xưởng Gỗ Rêu', 'Lò Đúc Chuông', 'Xưởng Giấy Sương', 'Xưởng Kính Màu', 'Xưởng Hộp Nhạc', 'Lò Nến Thơm', 'Xưởng Ô Giấy', 'Xưởng Diều Gió', 'Lò Bánh Mật', 'Xưởng Thuyền Mây', 'Xưởng Mũ Lá'];
  function firmNameFor(w, sector) {
    const list = sector === 'food' ? FOOD_NAMES : GOODS_NAMES;
    const used = new Set(w.firms.filter((f) => f.alive).map((f) => f.name));
    const pool = list.filter((n) => !used.has(n));
    const src = pool.length ? pool : list;
    return src[Math.floor(w.rand() * src.length)];
  }
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
      story(w, 'bankrun', 'epic', 'Đám đông kéo đến Kho Bạc', Math.round(w.fearShare * 100) + '% người dân tin Kho Bạc sắp vỡ và kéo đến đòi tiền. Ngân hàng siết chặt cho vay.', { kind: 'bank' });
    }
    // Cơn sốt
    const fad = activeFad(w);
    if (fad) fadDay(w, fad);
    // Phát minh tự nhiên, và cách làm mới lan sang đối thủ
    if (w.rand() < 1 / 150 && !w.cfg.off.invent) {
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

  /* ----- Cơn sốt: lây lan, chán, miễn dịch; đầu cơ và vỡ bong bóng ----- */
  function startFad(w, firm, item) {
    if (!firm || !firm.alive || activeFad(w) || w.cfg.off.fad) return null;
    const fad = { id: ++w.fadSeq, firmId: firm.id, item, color: FAD_COLORS[w.fadSeq % FAD_COLORS.length], start: w.day, state: 'rising', share: 0, peakShare: 0, peakDay: w.day, basePrice: firm.price, maxRatio: 1, hoarded: 0, units: 0 };
    w.fads.push(fad); firm.fadId = fad.id;
    const seeds = firm.workers.slice(0, 6).map((id) => w.households[id]);
    if (!seeds.length) seeds.push(w.households[Math.floor(w.rand() * w.households.length)]);
    for (const h of seeds) h.hype = fad.id;
    story(w, 'fad', 'major', 'Cơn sốt ' + item.toLowerCase() + ' bắt đầu', 'Những người thợ ở ' + firm.name + ' mang ' + item.toLowerCase() + ' về khoe với hàng xóm. Ai nhìn thấy cũng muốn có một chiếc.', { kind: 'firm', id: firm.id }, { fadId: fad.id, color: fad.color });
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
    const a = w.airship;
    a.state = 'docked'; a.days = 18 + Math.floor(w.rand() * 12); a.units = 0; a.revenue = 0; a.demand = 6 + Math.floor(w.rand() * 8); a.visits++; a.called = false;
    story(w, 'airship', 'epic', a.visits === 1 ? 'Khí cầu đầu tiên ghé đảo' : 'Khí cầu thương nhân cập bến', 'Đoàn thương nhân từ phương xa muốn mua ' + a.demand + ' món hàng mỗi ngày, trả bằng tiền của thế giới bên ngoài. Họ ở lại ' + a.days + ' ngày.', { kind: 'dock' });
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

    // 3. Trả lương (vay nếu thiếu tiền, sa thải nếu không vay được)
    for (const f of alive) {
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
    for (const f of alive) if (!(f.downUntil > w.day)) f.inv += outputOf(w, f) * (f.sector === 'food' ? ff : 1); // xưởng đang dựng lại sau hoả hoạn thì không sản xuất

    // 5. Tiêu dùng
    const food = alive.filter((f) => f.sector === 'food');
    const goods = alive.filter((f) => f.sector === 'goods');
    const avgFoodPrice = food.length ? food.reduce((s, f) => s + f.price, 0) / food.length : 1;
    const fadNow = activeFad(w), fadFirm = fadNow ? firmById(w, fadNow.firmId) : null;
    for (const h of shuffle(w, w.households.slice())) {
      h.ateToday = false;
      const fs = cheapestOf(w, food, true);
      if (fs && h.cash >= fs.price) {
        transfer(w, h, fs, fs.price, 'buy'); fs.inv -= 1; fs.sold += 1;
        h.ateToday = true; h.hungry = 0;
      } else {
        h.hungry++;
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
      const wants = 1 + (w.rand() < 0.55 ? 1 : 0) + (h.cash > avgFoodPrice * 90 ? 1 : 0) + (w.phen.festival > 0 ? 1 : 0) + Math.floor(w.variety) + (w.rand() < w.variety % 1 ? 1 : 0);
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
      if (f.debt <= 0) continue;
      const interest = f.debt * rDay;
      if (w.phen.panic > 0) { transfer(w, f, w.bank, Math.min(interest, Math.max(0, f.cash)), 'interest'); continue; }
      if (f.cash < interest) lend(w, f, interest - f.cash);
      transfer(w, f, w.bank, interest, 'interest');
    }

    // 7. Doanh nghiệp trả nợ và chia cổ tức phần tiền dư
    for (const f of alive) {
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
      if (f.workers.length === 0 && f.cash < f.wage && !canBorrow(w, f, f.wage * 3)) {
        f.alive = false; f.deadSince = w.day;
        const big = f.debt > 300 || (f.peakWorkers || 0) >= 6;
        story(w, 'bankrupt', big ? 'major' : 'small', f.name + ' phá sản', (f.debt > 0 ? 'Không trả nổi ' + Math.round(f.debt).toLocaleString('vi-VN') + ' xu nợ, ' : '') + f.name + ' đóng cửa. Tin dữ lan trong xóm của những người chủ.', { kind: 'firm', id: f.id }, { actors: f.owners.slice() });
        for (const hid of f.owners) { const o = w.households[hid]; if (!o) continue; scare(w, o, 7); for (let k = 0; k < 3; k++) { const c = randomContact(w, o); if (c) scare(w, c, 5); } }
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
    if (w.firms.length > 40) w.firms = w.firms.filter((f) => f.alive || f.deadSince !== null);

    for (const h of w.households) {
      if (h.hungry === 4) cand(w, 2, 'hungry', 'Nhà ' + nameOf(h.id) + ' nhịn đói', 'Đã bốn ngày ' + nameOf(h.id) + ' không đủ tiền mua cơm.', { kind: 'house', id: Math.floor(h.id / 4) }, [h.id]);
    }
    richest(w);
    pickSmall(w);
    record(w);
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
  function addHouseholds(w, n, savings) {
    const added = [];
    savings = savings || 0;
    for (let k = 0; k < n; k++) {
      const id = w.households.length;
      const h = newHousehold(id, savings, w.rand());
      w.households.push(h);
      added.push(h);
    }
    w.ledger.inflow = (w.ledger.inflow || 0) + n * savings;
    log(w, n + ' gia đình mới chuyển đến thành phố.', 'good');
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
    const basket = foodP + goodsP;
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

  return {
    create, step, printMoney, setPolicy, fund, openFirm: (w, sector, why) => openFirmAt(w, sector, why, true), addHouseholds, phenomena, trigger, SEASONS, totalMoney, expectedMoney, gini, DEFAULTS,
    // bộ máy câu chuyện
    nameOf, storiesSince, activeFad, seedInvention, scare,
    invent: (w, firmId, opts) => invent(w, firmById(w, firmId), opts),
    startFad: (w, firmId, item) => startFad(w, firmById(w, firmId), item || 'Món hàng mới'),
    burn: (w, firmId) => { const f = firmById(w, firmId); if (f && f.alive) burn(w, f); },
    arriveAirship,
  };
});
