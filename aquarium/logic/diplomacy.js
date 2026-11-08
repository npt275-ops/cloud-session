/* Bể Kính · logic/diplomacy.js · Quan hệ giữa các đảo, giao thương, hiệp ước, cầu
 * (design/quy-trinh-tong-quat.md mục 6.4, 7) Ở cấp cả bể (W, logic/world.js); chỉ làm theo quyết định của người đứng đầu
 * (logic/strategy.js), không tự quyết.
 *   rel        quan hệ của từng cặp đảo, nhìn từ phía đảo a: tin cậy (trust), sợ (fear), thù hằn (grudge); có trí nhớ, phai dần
 *   giá trị    một đơn vị tài nguyên đáng bao nhiêu với một đảo (value): thứ đang thiếu cho giỏ thời sau thì quý, thứ đầy kho thì rẻ
 *   dư, thiếu  available: phần có thể đem đổi (trừ phần giữ cho giỏ thời sau và lương thực dự trữ); need: phần còn thiếu
 *   đoàn buôn  trade(): hai bên giao hàng cùng lúc, đoàn đi thật mất travelDays ngày (cầu thì nhanh, thuyền thì chậm, xa thì
 *              lâu hơn); tới nơi mới nhận hàng, tin cậy hai bên tăng
 *   hiệp ước   pact (không xâm phạm), alliance (liên minh): có hạn; bước 5 (chiến tranh) đọc ở đây
 *   cướp, cứu  đoàn đi thuyền qua đảo khác (đảo nằm giữa đường, path) có thể bị đảo đó cướp (rob); đảo cai quản gửi lương
 *              thực cứu đói cho đảo mình chiếm (gift): đoàn chỉ chở một chiều. Ai cướp, ai cứu do người đứng đầu quyết
 *              (logic/strategy.js).
 *   cầu        do người đứng đầu quyết (logic/strategy.js tryBridge, design/npc-song-that.md mục 7.2), ở đây chỉ thực hiện:
 *              startBridge mở công trình (W.bridgeWorks): trả vật liệu trước (hai bên góp, bên thiếu thì bên kia bù; cầu quân
 *              sự thì một bên chịu cả), rồi thợ xây hai đầu làm BUILD_DAYS ngày (ngày nào bên làm còn thợ xây thì cầu tiến);
 *              xong thì có cầu (W.bridges, era: kiểu cầu của thời lúc xây). Xây lại (rebuild) theo kiểu thời mới: cầu cũ vẫn đi
 *              được tới khi cầu mới xong. destroyBridge: phá cầu (người đứng đầu đa nghi khi bị đánh). Cầu làm đường đi nhanh
 *              hơn, cũng là đường quân giặc tràn sang.
 *   qua lại    startVisit (W.visits): người thật sang đảo bên (thăm chợ, sứ giả, theo đoàn buôn): đi (qua cầu hay thuyền), ở
 *              lại vài ngày ở một chỗ của đảo kia, rồi về; trong lúc đi vắng không ở đảo nhà (p.away = 'visit', p.loc = đảo
 *              đang ở). Hai đảo đang thù nhau thì có thể xô xát ở đầu cầu: khách bị đuổi về, hai bên thêm thù.
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
  const BRIDGE_LEVEL = 3, BUILD_DAYS = 25;                  // cầu từ thời 3; thợ xây làm chừng này ngày
  // giá cả cây cầu theo thời (gỗ, đá; từ thời 5 thêm kim loại), hai đảo cùng góp
  const bridgeCost = (era) => { const f = 1 + 0.35 * Math.max(0, era - 3); return Object.assign({ wood: Math.round(80 * f), stone: Math.round(80 * f) }, era >= 5 ? { metal: Math.round(60 * f) } : {}); };
  const STAY = [1.5, 4];                                    // khách ở lại đảo kia chừng này ngày
  const TRUST_TRADE = 0.06, DECAY = 0.003;                  // tin cậy tăng mỗi chuyến buôn trọn vẹn; quan hệ phai dần mỗi ngày

  function init(W) {
    W.rel = Array.from({ length: N }, () => Array.from({ length: N }, () => ({ trust: 0, fear: 0, grudge: 0 })));
    W.caravans = []; W.treaties = []; W.bridges = []; W.bridgeWorks = []; W.visits = []; W.bridgeStats = { build: 0, rebuild: 0, military: 0, done: 0, destroyed: 0, visits: 0, brawls: 0 }; W.tradeCount = {}; W.log = []; W.nextId = 1;
  }
  const hops = (a, b) => { const d = Math.abs(a - b); return Math.min(d, N - d); };
  const pairKey = (a, b) => (a < b ? a + '-' + b : b + '-' + a);
  const bridged = (W, a, b) => hops(a, b) === 1 && W.bridges.some((x) => pairKey(x.a, x.b) === pairKey(a, b));
  const travelDays = (W, a, b) => (bridged(W, a, b) ? BRIDGE_DAYS : BOAT_DAYS + HOP_DAYS * (hops(a, b) - 1));
  // các đảo nằm giữa đường đi thuyền từ a tới b (theo chiều ngắn hơn quanh vòng sáu đảo; ngang nhau thì theo chiều tăng)
  function path(a, b) { const fwd = (b - a + N) % N, dir = fwd <= N - fwd ? 1 : -1, out = []; for (let i = (a + dir + N) % N; i !== b; i = (i + dir + N) % N) out.push(i); return out; }
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
  // quà (cứu đói): a gửi give cho b, không đổi lại
  function gift(W, day, a, b, give) {
    const E = BK.Economy, A = W.islands[a], B = W.islands[b];
    for (const r in give) E.state(A).stock[r] -= give[r];
    const days = travelDays(W, a, b), c = { id: W.nextId++, a, b, give, get: {}, depart: day, arrive: day + days, by: bridged(W, a, b) ? 'bridge' : 'boat', gift: true };
    W.caravans.push(c);
    say(W, day, A.name + ' gửi ' + Object.entries(give).map(([r, v]) => Math.round(v) + ' ' + E.NAME[r].toLowerCase()).join(', ') + ' cứu đói ' + B.name + '.', [a, b]);
    return c;
  }
  // c (đảo giữa đường) cướp đoàn buôn: hàng hai chiều về kho c; hai bên thù c, ai cũng bớt tin c
  function rob(W, day, cv, c) {
    const E = BK.Economy, C = W.islands[c], sc = E.state(C).stock, got = {};
    for (const o of [cv.give, cv.get]) for (const r in o) { const k = Math.min(o[r], E.CAP(C.level, r) - sc[r]); if (k > 0) { sc[r] += k; got[r] = (got[r] || 0) + k; } }
    W.caravans.splice(W.caravans.indexOf(cv), 1);
    for (const v of [cv.a, cv.b]) { W.rel[v][c].grudge = Math.min(1, W.rel[v][c].grudge + 0.35); W.rel[v][c].trust = 0; }
    for (let j = 0; j < N; j++) if (j !== c) W.rel[j][c].trust = Math.max(0, W.rel[j][c].trust - 0.1);
    W.robberies = (W.robberies || 0) + 1;
    say(W, day, 'Thuyền ' + C.name + ' chặn cướp đoàn buôn giữa ' + W.islands[cv.a].name + ' và ' + W.islands[cv.b].name + ' (' + Object.entries(got).map(([r, v]) => Math.round(v) + ' ' + E.NAME[r].toLowerCase()).join(', ') + ').', [c, cv.a, cv.b]);
  }
  function arrive(W, day, c) {
    const E = BK.Economy, A = W.islands[c.a], B = W.islands[c.b], sa = E.state(A), sb = E.state(B);
    if (c.gift) { for (const r in c.give) sb.stock[r] = Math.min(E.CAP(B.level, r), sb.stock[r] + c.give[r]); B.unrest = Math.max(0, (B.unrest || 0) - 0.15);
        W.rel[c.b][c.a].grudge = Math.max(0, W.rel[c.b][c.a].grudge - 0.1); B.log.push({ day: Math.floor(day), kind: 'trade', ids: [],
        text: 'Lương thực cứu đói từ ' + A.name + ' về tới nơi.' }); return; }
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
  // cầu nối đảo i với đảo i+1 (render/build/bridges3d.js: điểm đổ bộ landing[1] của i tới landing[0] của i+1)
  const ends = (a, b) => (b === (a + 1) % N ? [a, b] : [b, a]);
  const bridgeOf = (W, a, b) => W.bridges.find((x) => pairKey(x.a, x.b) === pairKey(a, b)) || null;
  const workOf = (W, a, b) => (W.bridgeWorks || []).find((x) => pairKey(x.a, x.b) === pairKey(a, b)) || null;
  // trả được không (by: cầu quân sự một bên chịu cả; không thì hai kho gộp lại)
  function canPay(W, a, b, era, by) {
    const E = BK.Economy, c = bridgeCost(era), sa = E.state(W.islands[a]).stock, sb = E.state(W.islands[b]).stock;
    return Object.keys(c).every((r) => (by != null ? E.state(W.islands[by]).stock[r] : sa[r] + sb[r]) >= c[r]);
  }
  // mở công trình cầu: kind 'build' | 'rebuild' | 'military' (by: đảo tự xây)
  function startBridge(W, day, a, b, kind, by) {
    if (hops(a, b) !== 1 || workOf(W, a, b)) return null;
    const A = W.islands[a], B = W.islands[b], E = BK.Economy, era = Math.min(A.level, B.level, by != null ? W.islands[by].level : 99);
    if (era < BRIDGE_LEVEL || !canPay(W, a, b, era, kind === 'military' ? by : null)) return null;
    const c = bridgeCost(era), sa = E.state(A).stock, sb = E.state(B).stock;
    if (kind === 'military') { const sx = E.state(W.islands[by]).stock; for (const r in c) sx[r] -= c[r]; }
    else for (const r in c) { const fa = Math.min(sa[r], Math.max(c[r] / 2, c[r] - sb[r])); sa[r] -= fa; sb[r] -= c[r] - fa; }
    const [lo, hi] = ends(a, b), w = { a: lo, b: hi, kind, by: kind === 'military' ? by : null, era, progress: 0, from: day };
    W.bridgeWorks.push(w); W.bridgeStats[kind]++;
    say(W, day, kind === 'military' ? W.islands[by].name + ' tự bắc cầu quân sự sang ' + W.islands[by === a ? b : a].name + '.' : kind === 'rebuild' ? A.name + ' và ' + B.name + ' cùng xây lại cầu theo kiểu thời mới.' : A.name + ' và ' + B.name + ' cùng khởi công bắc cầu nối hai đảo.', [a, b]);
    return w;
  }
  // phá cầu (người đứng đầu đa nghi khi bị đánh): cầu và công trình đang xây giữa hai đảo đều mất
  function destroyBridge(W, day, a, b, by) {
    const br = bridgeOf(W, a, b), wk = workOf(W, a, b); if (!br && !wk) return false;
    W.bridges = W.bridges.filter((x) => x !== br); W.bridgeWorks = W.bridgeWorks.filter((x) => x !== wk); W.bridgeStats.destroyed++;
    W.rel[by === a ? b : a][by].grudge = Math.min(1, W.rel[by === a ? b : a][by].grudge + 0.2);
    say(W, day, W.islands[by].name + ' phá cầu sang ' + W.islands[by === a ? b : a].name + ' để chặn đường.', [a, b]);
    return true;
  }
  // mỗi ngày: công trình cầu tiến khi bên làm còn thợ xây (cầu quân sự: chỉ bên tự xây)
  const builders = (S) => BK.Island.living(S).filter((p) => !p.away && (p.job === 'builder' || p.role === 'builder')).length;
  function buildDay(W, day) {
    for (const w of [...W.bridgeWorks]) {
      const sides = w.by != null ? [w.by] : [w.a, w.b];
      // thợ xây của bên làm ra cổng phụ phía cầu (logic/tasks.js đọc S.bridgeJob; side 0 cổng trái, 1 cổng phải)
      for (const i of sides) { const o = i === w.a ? w.b : w.a; W.islands[i].bridgeJob = { to: o, toName: W.islands[o].name, side: (o - i + N) % N === 1 ? 1 : 0, until: day + 1.5, progress: w.progress }; }
      if (sides.some((i) => !alive(W, i) && !W.islands[i].annexedBy) || sides.some((i) => builders(W.islands[i]) === 0)) continue;
      w.progress = Math.min(1, w.progress + 1 / BUILD_DAYS);
      if (w.progress < 1) continue;
      W.bridgeWorks.splice(W.bridgeWorks.indexOf(w), 1);
      const old = bridgeOf(W, w.a, w.b); if (old) W.bridges.splice(W.bridges.indexOf(old), 1);
      W.bridges.push({ a: w.a, b: w.b, era: w.era, day, military: w.kind === 'military' }); W.bridgeStats.done++;
      say(W, day, 'Cầu giữa ' + W.islands[w.a].name + ' và ' + W.islands[w.b].name + (w.kind === 'rebuild' ? ' xây lại xong.' : ' đã xong.'), [w.a, w.b]);
    }
  }

  /* ---------- Người qua lại ---------- */
  // kind: 'market' (thăm chợ), 'envoy' (sứ giả, tới nhà chính), 'trade' (theo đoàn buôn); place: chỗ ở đảo kia
  function startVisit(W, day, p, from, to, kind, place, rng) {
    if (!p || !p.alive || p.away) return null;
    const days = travelDays(W, from, to), v = { id: W.nextId++, pid: p.id, from, to, kind, place, by: bridged(W, from, to) ? 'bridge' : 'boat', depart: day, arrive: day + days, stage: 'go' };
    v.leave = v.arrive + (rng ? rng.range(STAY[0], STAY[1]) : STAY[0]); v.back = v.leave + days;
    p.away = 'visit'; p.loc = from;
    W.visits.push(v); W.bridgeStats.visits++;
    return v;
  }
  function visitDay(W, day, rng) {
    for (const v of [...W.visits]) {
      const S = W.islands[v.from], p = S.people.get(v.pid);
      if (!p || !p.alive) { W.visits.splice(W.visits.indexOf(v), 1); continue; }
      // người chạy nạn (logic/ecology.js): tới nơi thì cả hộ ở lại đảo kia
      if (v.kind === 'refugee') { if (day >= v.arrive) { W.visits.splice(W.visits.indexOf(v), 1); BK.Ecology.arrive(W, day, v); } continue; }
      if (v.stage === 'go' && day >= v.arrive) {
        v.stage = 'stay'; p.loc = v.to;
        // đầu cầu: hai đảo đang thù nhau thì có thể xô xát với lính gác, khách bị đuổi về
        const g = Math.max(W.rel[v.to][v.from].grudge, W.rel[v.from][v.to].grudge);
        if (v.by === 'bridge' && v.kind !== 'envoy' && g > 0.3 && rng.chance(Math.min(0.7, g))) {
          v.brawl = true; W.bridgeStats.brawls++; v.leave = day + 0.4; v.back = v.leave + (v.arrive - v.depart);
          W.rel[v.to][v.from].grudge = Math.min(1, W.rel[v.to][v.from].grudge + 0.05); W.rel[v.from][v.to].grudge = Math.min(1, W.rel[v.from][v.to].grudge + 0.08);
          say(W, day, 'Xô xát ở đầu cầu ' + W.islands[v.to].name + ': lính gác đuổi ' + BK.People.fullName(p) + ' của ' + S.name + ' về.', [v.to, v.from]);
          W.islands[v.to].log.push({ day: Math.floor(day), kind: 'brawl', ids: [], text: 'Lính gác xô xát với người ' + S.name + ' ở đầu cầu.' });
        }
      }
      if (v.stage === 'stay' && day >= v.leave) { v.stage = 'back'; p.loc = null; }
      if (v.stage === 'back' && day >= v.back) { p.away = null; p.loc = null; W.visits.splice(W.visits.indexOf(v), 1); }
    }
  }

  /* ---------- Mỗi ngày ---------- */
  function dayTick(W, day, rng) {
    for (const c of [...W.caravans]) if (c.arrive <= day) { W.caravans.splice(W.caravans.indexOf(c), 1); arrive(W, day, c); }
    buildDay(W, day);
    visitDay(W, day, rng || W.rng);
    for (let a = 0; a < N; a++) for (let b = 0; b < N; b++) if (a !== b) { const R = W.rel[a][b]; R.trust *= 1 - DECAY; R.grudge *= 1 - DECAY * 0.5; }
    W.treaties = W.treaties.filter((t) => t.until > day || (say(W, day, 'Hiệp ước giữa ' + W.islands[t.a].name + ' và ' + W.islands[t.b].name + ' hết hạn.', [t.a, t.b]), false));
  }
  return { N, init, hops, path, travelDays, bridged, alive, need, available, value, canSend, load, trade, gift, rob, treatyOf, sign, startBridge, destroyBridge, bridgeOf, workOf, canPay, bridgeCost, startVisit, dayTick, say, pairKey, BRIDGE_LEVEL, BUILD_DAYS };
});
