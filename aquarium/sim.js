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
    interestRate: 0.05, // năm
    foodProd: 3,
    goodsProd: 2,
    maxFlows: 700,
  };

  function create(opts) {
    const cfg = Object.assign({}, DEFAULTS, opts || {});
    const rand = makeRng(cfg.seed);
    const w = {
      cfg, rand, day: 0,
      households: [], firms: [],
      bank: { key: 'bank', cash: 0, loansOut: 0, writtenOff: 0 },
      gov: { key: 'gov', cash: 0 },
      ledger: { M0: 0, printed: 0, created: 0, destroyed: 0 },
      policy: { taxRate: cfg.taxRate, interestRate: cfg.interestRate, minWage: cfg.minWage },
      stats: [], events: [], flows: [], nextFirmId: 0, basePrice: null,
    };
    for (let i = 0; i < cfg.households; i++) {
      w.households.push({ key: 'h' + i, id: i, cash: cfg.householdCash, employer: null, hungry: 0, ateToday: true });
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
    return {
      key: 'f' + id, id, sector, cash: cash || 0, inv: 6, prod,
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
    return L.M0 + L.printed + L.created - L.destroyed;
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
  function creditLimit(firm) { return Math.max(150, firm.wage * Math.max(1, firm.workers.length) * 25); }
  function canBorrow(firm, amt) { return firm.debt + amt <= creditLimit(firm); }

  /* ---------- Một ngày ---------- */
  function step(w) {
    w.day++;
    w.flows = [];
    const P = w.policy;
    const alive = w.firms.filter((f) => f.alive);
    const unemployedShare = w.households.filter((h) => h.employer === null).length / w.households.length;

    // 1. Doanh nghiệp lập kế hoạch: giá, tuyển dụng, lương
    for (const f of alive) {
      f.avgSales = f.avgSales * 0.8 + f.sold * 0.2;
      const target = Math.max(4, f.avgSales * 2);
      const unitCost = f.wage / f.prod;
      if (f.inv > target * 1.5) {
        f.price *= 1 - 0.03 * w.rand();
        if (f.workers.length > 1 && f.inv > target * 2.5) fire(w, f, f.workers[Math.floor(w.rand() * f.workers.length)]);
        f.vacancies = 0;
      } else if (f.inv < target * 0.6) {
        f.price *= 1 + 0.03 * w.rand();
        // Mở rộng: lãi suất càng cao càng ngại tuyển thêm bằng tiền vay
        const appetite = Math.max(0, 1 - P.interestRate / 0.15);
        const affordable = f.cash > f.wage * (f.workers.length + 1) * 5;
        f.vacancies = affordable || w.rand() < appetite ? 1 + (f.inv < target * 0.2 ? 1 : 0) : 0;
      } else {
        f.vacancies = 0;
      }
      f.price = Math.max(f.price, unitCost * 0.7, 0.2);
      if (f.vacancies > 0) f.unfilled++; else f.unfilled = 0;
      if (f.unfilled > 3) { f.wage *= 1.02; f.unfilled = 0; }
      if (unemployedShare > 0.15 && w.rand() < 0.05) f.wage *= 0.99;
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
      let payroll = f.wage * f.workers.length;
      if (f.cash < payroll) {
        const need = payroll - f.cash + f.wage * 2;
        if (canBorrow(f, need)) lend(w, f, need);
        while (f.cash < payroll && f.workers.length) {
          fire(w, f, f.workers[f.workers.length - 1]);
          payroll = f.wage * f.workers.length;
        }
      }
      for (const hid of f.workers) {
        const h = w.households[hid];
        const tax = f.wage * P.taxRate;
        transfer(w, f, h, f.wage - tax, 'wage');
        transfer(w, f, w.gov, tax, 'tax');
      }
    }

    // 4. Sản xuất
    for (const f of alive) f.inv += f.workers.length * f.prod;

    // 5. Tiêu dùng
    const food = alive.filter((f) => f.sector === 'food');
    const goods = alive.filter((f) => f.sector === 'goods');
    const avgFoodPrice = food.length ? food.reduce((s, f) => s + f.price, 0) / food.length : 1;
    for (const h of shuffle(w, w.households.slice())) {
      h.ateToday = false;
      const fs = cheapestOf(w, food);
      if (fs && h.cash >= fs.price) {
        transfer(w, h, fs, fs.price, 'buy'); fs.inv -= 1; fs.sold += 1;
        h.ateToday = true; h.hungry = 0;
      } else {
        h.hungry++;
      }
      let budget = Math.max(0, h.cash - avgFoodPrice * 3) * 0.3;
      for (let k = 0; k < 3; k++) {
        const g = cheapestOf(w, goods);
        if (!g || budget < g.price) break;
        transfer(w, h, g, g.price, 'buy'); g.inv -= 1; g.sold += 1; budget -= g.price;
      }
    }

    // 6. Ngân hàng: lãi vay
    const rDay = P.interestRate / 360;
    for (const f of alive) {
      if (f.debt <= 0) continue;
      const interest = f.debt * rDay;
      if (f.cash < interest) lend(w, f, interest - f.cash);
      transfer(w, f, w.bank, interest, 'interest');
    }

    // 7. Doanh nghiệp trả nợ và chia cổ tức phần tiền dư
    for (const f of alive) {
      const buffer = Math.max(60, f.wage * f.workers.length * 8);
      let excess = f.cash - buffer;
      if (excess > 0 && f.debt > 0) { repay(w, f, excess * 0.6); excess = f.cash - buffer; }
      if (excess > 0) payToHouseholds(w, f, excess * 0.5, 'dividend', 8);
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
      if (f.workers.length === 0 && f.cash < f.wage && !canBorrow(f, f.wage * 3)) {
        f.alive = false; f.deadSince = w.day;
        if (f.debt > 0) {
          w.bank.loansOut -= f.debt; w.bank.writtenOff += f.debt;
          log(w, (f.sector === 'food' ? 'Lò thực phẩm' : 'Xưởng hàng') + ' #' + f.id + ' phá sản, ngân hàng xoá nợ ' + f.debt.toFixed(0) + ' xu.', 'bad');
          f.debt = 0;
        } else {
          log(w, (f.sector === 'food' ? 'Lò thực phẩm' : 'Xưởng hàng') + ' #' + f.id + ' đóng cửa.', 'bad');
        }
        if (f.cash > 0) payToHouseholds(w, f, f.cash, 'dividend', 4);
        if (f.inv > 0) f.inv = 0;
      }
    }
    for (const f of w.firms) {
      if (!f.alive && f.deadSince !== null && w.day - f.deadSince >= 12) {
        f.deadSince = null; // chỉ thay một lần
        const nf = newFirm(w, f.sector, 0);
        lend(w, nf, 250);
        w.firms.push(nf);
        log(w, 'Một ' + (nf.sector === 'food' ? 'lò thực phẩm' : 'xưởng hàng') + ' mới (#' + nf.id + ') mở cửa bằng khoản vay 250 xu.', 'good');
      }
    }
    // dọn xác doanh nghiệp đã chết lâu
    if (w.firms.length > 40) w.firms = w.firms.filter((f) => f.alive || f.deadSince !== null);

    for (const h of w.households) {
      if (h.hungry === 3) log(w, 'Hộ #' + h.id + ' đã nhịn đói 3 ngày liền.', 'warn');
    }
    record(w);
  }

  function cheapestOf(w, list) {
    let best = null;
    for (let k = 0; k < 3 && list.length; k++) {
      const f = list[Math.floor(w.rand() * list.length)];
      if (f.inv >= 1 && (!best || f.price < best.price)) best = f;
    }
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

  return { create, step, printMoney, setPolicy, totalMoney, expectedMoney, gini, DEFAULTS };
});
