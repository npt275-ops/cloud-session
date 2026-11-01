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
    };
    for (let i = 0; i < cfg.households; i++) {
      w.households.push({ key: 'h' + i, id: i, cash: cfg.householdCash, employer: null, hungry: 0, ateToday: true, skill: 0.7 + rand() * 0.7 });
    }
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

  function newFirm(w, sector, cash) {
    const id = w.nextFirmId++;
    const prod = sector === 'food' ? w.cfg.foodProd : w.cfg.goodsProd;
    const unitCost = w.cfg.wage / prod;
    // mỗi doanh nghiệp có 3 hộ làm chủ, nhận cổ tức
    const owners = [];
    for (let k = 0; k < 3 && w.households.length; k++) owners.push(Math.floor(w.rand() * w.households.length));
    return {
      owners,
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
    w.households[hid].employer = null;
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
    if (doy % 90 === 0) log(w, 'Mùa ' + SEASONS[season] + ' đến với thành phố.', 'season');
    // mưa (mùa đông là tuyết), không mưa giữa hạn hán
    if (p.rain > 0) { p.rain--; if (p.rain === 0) log(w, season === 3 ? 'Tuyết ngừng rơi.' : 'Trời tạnh mưa.', 'nature'); }
    else if (p.drought === 0 && w.rand() < 0.035) { p.rain = 2 + Math.floor(w.rand() * 4); log(w, season === 3 ? 'Tuyết bắt đầu rơi trên thành phố.' : 'Trời đổ mưa.', 'nature'); }
    // hạn hán: có thể xảy ra một lần mỗi mùa hạ
    if (p.drought > 0) { p.drought--; if (p.drought === 0) log(w, 'Hạn hán chấm dứt. Ruộng đồng hồi phục.', 'nature'); }
    else if (season === 1 && p.droughtYear !== year && w.rand() < 0.012) { p.drought = 30 + Math.floor(w.rand() * 25); p.droughtYear = year; p.rain = 0; log(w, 'Hạn hán bắt đầu: ruộng khô, sản lượng lương thực giảm mạnh.', 'nature'); }
    // lễ hội đèn lồng cuối năm
    if (doy === 345) { p.festival = 15; log(w, 'Lễ hội đèn lồng cuối năm bắt đầu. Người dân sắm sửa, đèn trời bay lên.', 'nature'); }
    else if (p.festival > 0) p.festival--;
    // khủng hoảng niềm tin: nợ xấu tăng vọt thì ngân hàng ngừng cho vay
    p.badDebt *= 0.985;
    if (p.panicCool > 0) p.panicCool--;
    if (p.panic > 0) { p.panic--; if (p.panic === 0) log(w, 'Niềm tin quay lại. Kho Bạc cho vay trở lại.', 'panic'); }
    else if (p.panicCool === 0 && p.badDebt > 0.13 * Math.max(2000, w.bank.loansOut)) {
      p.panic = 20 + Math.floor(w.rand() * 15); p.panicCool = 330;
      log(w, 'Nợ xấu tăng vọt, người dân xếp hàng trước Kho Bạc. Ngân hàng ngừng cho vay.', 'panic');
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

  /* ---------- Một ngày ---------- */
  function step(w) {
    w.day++;
    updatePhenomena(w);
    w.flows = [];
    const P = w.policy;
    const alive = w.firms.filter((f) => f.alive);
    const unemployedShare = w.households.filter((h) => h.employer === null).length / w.households.length;

    // 1. Doanh nghiệp lập kế hoạch: giá, tuyển dụng, lương
    for (const f of alive) {
      f.avgSales = f.avgSales * 0.8 + f.sold * 0.2;
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
        f.price *= 1 + 0.03 * w.rand();
        // Mở rộng: lãi suất càng cao càng ngại tuyển thêm bằng tiền vay
        const appetite = Math.max(0, 1 - P.interestRate / 0.15);
        const affordable = f.cash > f.wage * (f.workers.length + 1) * 5;
        f.vacancies = affordable || w.rand() < appetite ? 1 + (f.inv < target * 0.2 ? 2 : 0) : 0;
      } else {
        f.vacancies = 0;
      }
      f.price = Math.max(f.price, unitCost * 0.7, 0.2);
      if (f.vacancies > 0) f.unfilled++; else f.unfilled = 0;
      // Lương chỉ tăng khi thị trường lao động thật sự căng; giảm chậm khi thất nghiệp cao
      if (f.unfilled > 3) { if (unemployedShare < 0.03) f.wage *= 1.006; f.unfilled = 0; }
      if (unemployedShare > 0.1 && w.rand() < 0.025) f.wage *= 0.99;
      f.wage = Math.max(f.wage, P.minWage);
      f.sold = 0;
    }

    // 2. Thị trường lao động
    const jobless = shuffle(w, w.households.filter((h) => h.employer === null));
    const hiring = alive.filter((f) => f.vacancies > 0).sort((a, b) => b.wage - a.wage);
    for (const f of hiring) {
      while (f.vacancies > 0 && jobless.length) { hire(f, jobless.pop()); f.vacancies--; }
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
    for (const f of alive) f.inv += outputOf(w, f) * (f.sector === 'food' ? ff : 1);

    // 5. Tiêu dùng
    const food = alive.filter((f) => f.sector === 'food');
    const goods = alive.filter((f) => f.sector === 'goods');
    const avgFoodPrice = food.length ? food.reduce((s, f) => s + f.price, 0) / food.length : 1;
    for (const h of shuffle(w, w.households.slice())) {
      h.ateToday = false;
      const fs = cheapestOf(w, food, true);
      if (fs && h.cash >= fs.price) {
        transfer(w, h, fs, fs.price, 'buy'); fs.inv -= 1; fs.sold += 1;
        h.ateToday = true; h.hungry = 0;
      } else {
        h.hungry++;
      }
      // Tiết kiệm phòng thân: giữ lại tiền ăn nhiều ngày, người thất nghiệp và lúc kinh tế xấu thì chi tiêu dè dặt hơn
      const jobless = h.employer === null;
      const reserveDays = (jobless ? 14 : 8 + unemployedShare * 25) + (w.phen.panic > 0 ? 6 : 0);
      const propensity = jobless ? 0.12 : 0.26;
      let budget = Math.max(0, h.cash - avgFoodPrice * reserveDays) * propensity;
      // Bão hoà: mỗi hộ muốn khoảng 1,5 món hàng mỗi ngày, không mua vô hạn
      // người giàu tiêu xa xỉ hơn: thêm món theo mức tài sản
      const wants = 1 + (w.rand() < 0.55 ? 1 : 0) + (h.cash > avgFoodPrice * 90 ? 1 : 0) + (w.phen.festival > 0 ? 1 : 0);
      for (let k = 0; k < wants; k++) {
        const g = cheapestOf(w, goods);
        if (!g || budget < g.price) break;
        transfer(w, h, g, g.price, 'buy'); g.inv -= 1; g.sold += 1; budget -= g.price;
      }
    }

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
      if (h.hungry === 3) log(w, 'Hộ #' + h.id + ' đã nhịn đói 3 ngày liền.', 'warn');
    }
    record(w);
  }

  /* Mở một doanh nghiệp mới, vốn khởi nghiệp vay từ ngân hàng. Dùng cho khởi nghiệp tự nhiên và cho người chơi xây. */
  function openFirmAt(w, sector, why, force) {
    if (!force && w.phen.panic > 0) return null; // khủng hoảng niềm tin: không ai được vay để khởi nghiệp
    const nf = newFirm(w, sector, 0);
    lend(w, nf, 250);
    w.firms.push(nf);
    log(w, 'Một ' + (sector === 'food' ? 'lò thực phẩm' : 'xưởng hàng') + ' mới (#' + nf.id + ') mở cửa' + (why || '') + '.', 'good');
    return nf;
  }

  /* Dân nhập cư: n gia đình mới mang theo tiền tiết kiệm từ bên ngoài đảo (sổ cái ghi là dòng tiền vào). */
  function addHouseholds(w, n, savings) {
    const added = [];
    savings = savings || 0;
    for (let k = 0; k < n; k++) {
      const id = w.households.length;
      const h = { key: 'h' + id, id, cash: savings, employer: null, hungry: 0, ateToday: true, skill: 0.7 + w.rand() * 0.7 };
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

  return { create, step, printMoney, setPolicy, fund, openFirm: (w, sector, why) => openFirmAt(w, sector, why, true), addHouseholds, phenomena, trigger, SEASONS, totalMoney, expectedMoney, gini, DEFAULTS };
});
