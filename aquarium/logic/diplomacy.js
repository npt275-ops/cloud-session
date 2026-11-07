/* Bể Kính · logic/diplomacy.js · Quan hệ giữa các đảo, giao thương, hiệp ước, cầu
 * (design/quy-trinh-tong-quat.md mục 6.4, 7) Ở cấp cả bể (W, logic/world.js); chỉ làm theo quyết định của người đứng đầu
 * (logic/strategy.js), không tự quyết.
 *   rel        quan hệ của từng cặp đảo, nhìn từ phía đảo a: tin cậy (trust), sợ (fear), thù hằn (grudge); có trí nhớ, phai dần
 *   giá trị    một đơn vị tài nguyên đáng bao nhiêu với một đảo (value): thứ đang thiếu cho giỏ thời sau thì quý, thứ đầy kho thì rẻ
 *   dư, thiếu  available: phần có thể đem đổi (trừ phần giữ cho giỏ thời sau và lương thực dự trữ); need: phần còn thiếu
 *   đoàn buôn  trade(): hai bên giao hàng cùng lúc, đoàn đi thật mất travelDays ngày (cầu thì nhanh, thuyền thì chậm, xa thì
 *              lâu hơn); tới nơi mới nhận hàng, tin cậy hai bên tăng
 *   hiệp ước   pact (không xâm phạm), alliance (liên minh): có hạn; bước 5 (chiến tranh) đọc ở đây
 *   cầu        hai đảo kề nhau buôn bán đủ nhiều, cùng từ thời 3, hai kho gộp lại đủ gỗ đá thì cùng bắc cầu (mỗi bên góp
 *              một nửa, bên thiếu thì bên kia bù); xét mỗi ngày; cầu làm đường đi nhanh hơn
 * Không vẽ gì, chạy được bằng Node. Cần: logic/economy.js, logic/island.js. */
(function (root, factory) {
  const BK = root.BK || (root.BK = {});
  BK.Diplomacy = factory(BK);
  if (typeof module === 'object' && module.exports) module.exports = BK.Diplomacy;
})(typeof self !== 'undefined' ? self : globalThis, function (BK) {
  'use strict';
  const N = 6;
  const BRIDGE_DAYS = 3, BOAT_DAYS = 6, HOP_DAYS = 4;       // đi qua cầu, đi thuyền sang đảo kề, mỗi đảo xa hơn thêm
  const PER_TRADER = 60;                                    // mỗi thương nhân chở được chừng này đơn vị một chuyến
  const BRIDGE_TRADES = 3, BRIDGE_LEVEL = 3, BRIDGE_COST = { wood: 80, stone: 80 }; // giá cả cây cầu, hai đảo cùng góp
  const TRUST_TRADE = 0.06, DECAY = 0.003;                  // tin cậy tăng mỗi chuyến buôn trọn vẹn; quan hệ phai dần mỗi ngày

  function init(W) {
    W.rel = Array.from({ length: N }, () => Array.from({ length: N }, () => ({ trust: 0, fear: 0, grudge: 0 })));
    W.caravans = []; W.treaties = []; W.bridges = []; W.tradeCount = {}; W.log = []; W.nextId = 1;
  }
  const hops = (a, b) => { const d = Math.abs(a - b); return Math.min(d, N - d); };
  const pairKey = (a, b) => (a < b ? a + '-' + b : b + '-' + a);
  const bridged = (W, a, b) => hops(a, b) === 1 && W.bridges.some((x) => pairKey(x.a, x.b) === pairKey(a, b));
  const travelDays = (W, a, b) => (bridged(W, a, b) ? BRIDGE_DAYS : BOAT_DAYS + HOP_DAYS * (hops(a, b) - 1));
  const alive = (W, i) => !W.islands[i].annexedBy && BK.Island.living(W.islands[i]).length > 0;
  const say = (W, day, text, ids) => { W.log.push({ day: Math.floor(day), text, isles: ids || [] }); if (W.log.length > 400) W.log.splice(0, W.log.length - 400); };

  /* ---------- Giá trị, dư, thiếu ---------- */
  function need(S, r) { const E = BK.Economy, st = E.state(S), cost = E.nextCost(S) || {}; let n = Math.max(0, (cost[r] || 0) - st.stock[r]); if (r === 'food') n += Math.max(0, st.eaten * 40 - st.stock.food); return n; }
  function available(S, r) {
    const E = BK.Economy, st = E.state(S), cost = E.nextCost(S) || {};
    const keep = (cost[r] || 0) + (r === 'food' ? st.eaten * 45 : 0);
    return Math.max(0, Math.floor(st.stock[r] - keep));
  }
  // giá trị một đơn vị: thứ đang thiếu (so với giỏ thời sau, lương thực dự trữ) thì quý tới 3, thứ đầy kho thì rẻ
  function value(S, r) {
    const E = BK.Economy, st = E.state(S), cost = (E.nextCost(S) || {})[r] || 0, cap = E.CAP(S.level, r);
    const short = need(S, r) / Math.max(40, cost || st.eaten * 40 || 40);
    return Math.max(0.15, 1 + 2 * Math.min(1, short) - 0.8 * Math.min(1, st.stock[r] / cap));
  }

  /* ---------- Đoàn buôn ---------- */
  const busyCaravans = (W, i) => W.caravans.filter((c) => c.a === i || c.b === i).length;
  const traders = (S) => Math.max(1, BK.Island.living(S).filter((p) => p.job === 'trader' || p.role === 'merchant').length);
  const canSend = (W, i) => busyCaravans(W, i) < traders(W.islands[i]);
  const load = (S) => PER_TRADER * (1 + 0.1 * (S.level - 1));
  // giao kèo: a đưa give (của a), b đưa get (của b); hai đoàn cùng lên đường, tới nơi mới nhận
  function trade(W, day, a, b, give, get) {
    const A = W.islands[a], B = W.islands[b], E = BK.Economy, sa = E.state(A), sb = E.state(B);
    for (const r in give) sa.stock[r] -= give[r];
    for (const r in get) sb.stock[r] -= get[r];
    const days = travelDays(W, a, b), c = { id: W.nextId++, a, b, give, get, depart: day, arrive: day + days, by: bridged(W, a, b) ? 'bridge' : 'boat' };
    W.caravans.push(c);
    const txt = (o) => Object.entries(o).map(([r, v]) => Math.round(v) + ' ' + E.NAME[r].toLowerCase()).join(', ');
    say(W, day, A.name + ' đổi ' + txt(give) + ' lấy ' + txt(get) + ' của ' + B.name + ' (' + (c.by === 'bridge' ? 'qua cầu' : 'đi thuyền') + ', ' + days + ' ngày).', [a, b]);
    A.log.push({ day: Math.floor(day), kind: 'trade', ids: [], text: 'Đoàn buôn lên đường sang ' + B.name + '.' });
    B.log.push({ day: Math.floor(day), kind: 'trade', ids: [], text: 'Đoàn buôn lên đường sang ' + A.name + '.' });
    return c;
  }
  function arrive(W, day, c) {
    const E = BK.Economy, A = W.islands[c.a], B = W.islands[c.b], sa = E.state(A), sb = E.state(B);
    for (const r in c.give) sb.stock[r] = Math.min(E.CAP(B.level, r), sb.stock[r] + c.give[r]);
    for (const r in c.get) sa.stock[r] = Math.min(E.CAP(A.level, r), sa.stock[r] + c.get[r]);
    W.rel[c.a][c.b].trust = Math.min(1, W.rel[c.a][c.b].trust + TRUST_TRADE); W.rel[c.b][c.a].trust = Math.min(1, W.rel[c.b][c.a].trust + TRUST_TRADE);
    const k = pairKey(c.a, c.b); W.tradeCount[k] = (W.tradeCount[k] || 0) + 1;
    A.log.push({ day: Math.floor(day), kind: 'trade', ids: [], text: 'Đoàn buôn từ ' + B.name + ' về tới nơi.' });
    B.log.push({ day: Math.floor(day), kind: 'trade', ids: [], text: 'Đoàn buôn từ ' + A.name + ' về tới nơi.' });
  }

  /* ---------- Hiệp ước ---------- */
  const treatyOf = (W, a, b, day) => W.treaties.find((t) => pairKey(t.a, t.b) === pairKey(a, b) && t.until > day) || null;
  function sign(W, day, a, b, kind, days) {
    const t = { a, b, kind, from: day, until: day + days };
    W.treaties = W.treaties.filter((x) => !(pairKey(x.a, x.b) === pairKey(a, b)));
    W.treaties.push(t);
    for (const [x, y] of [[a, b], [b, a]]) W.rel[x][y].trust = Math.min(1, W.rel[x][y].trust + (kind === 'alliance' ? 0.15 : 0.08));
    say(W, day, W.islands[a].name + ' và ' + W.islands[b].name + ' ký ' + (kind === 'alliance' ? 'liên minh' : 'hiệp ước không xâm phạm') + '.', [a, b]);
    for (const i of [a, b]) W.islands[i].log.push({ day: Math.floor(day), kind: 'treaty', ids: [], text: 'Ký ' + (kind === 'alliance' ? 'liên minh' : 'hiệp ước không xâm phạm') + ' với ' + W.islands[i === a ? b : a].name + '.' });
    return t;
  }

  /* ---------- Cầu ---------- */
  function maybeBridge(W, day, a, b) {
    if (hops(a, b) !== 1 || bridged(W, a, b)) return null;
    const A = W.islands[a], B = W.islands[b], E = BK.Economy;
    if ((W.tradeCount[pairKey(a, b)] || 0) < BRIDGE_TRADES || A.level < BRIDGE_LEVEL || B.level < BRIDGE_LEVEL) return null;
    const sa = E.state(A).stock, sb = E.state(B).stock;
    if (!Object.keys(BRIDGE_COST).every((r) => sa[r] + sb[r] >= BRIDGE_COST[r])) return null;
    for (const r in BRIDGE_COST) { const fa = Math.min(sa[r], Math.max(BRIDGE_COST[r] / 2, BRIDGE_COST[r] - sb[r])); sa[r] -= fa; sb[r] -= BRIDGE_COST[r] - fa; }
    // cầu nối đảo i với đảo i+1 (render/build/bridges3d.js: điểm đổ bộ landing[1] của i tới landing[0] của i+1)
    const lo = (b === (a + 1) % N) ? a : b, hi = lo === a ? b : a;
    const br = { a: lo, b: hi, era: Math.min(A.level, B.level), day };
    W.bridges.push(br);
    say(W, day, A.name + ' và ' + B.name + ' cùng bắc cầu nối hai đảo.', [a, b]);
    return br;
  }

  /* ---------- Mỗi ngày ---------- */
  function dayTick(W, day) {
    for (const c of [...W.caravans]) if (c.arrive <= day) { W.caravans.splice(W.caravans.indexOf(c), 1); arrive(W, day, c); }
    for (let a = 0; a < N; a++) if (alive(W, a) && alive(W, (a + 1) % N)) maybeBridge(W, day, a, (a + 1) % N);
    for (let a = 0; a < N; a++) for (let b = 0; b < N; b++) if (a !== b) { const R = W.rel[a][b]; R.trust *= 1 - DECAY; R.grudge *= 1 - DECAY * 0.5; }
    W.treaties = W.treaties.filter((t) => t.until > day || (say(W, day, 'Hiệp ước giữa ' + W.islands[t.a].name + ' và ' + W.islands[t.b].name + ' hết hạn.', [t.a, t.b]), false));
  }
  return { N, init, hops, travelDays, bridged, alive, need, available, value, canSend, load, trade, treatyOf, sign, maybeBridge, dayTick, say, pairKey };
});
