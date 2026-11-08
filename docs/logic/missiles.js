/* Bể Kính · logic/missiles.js · Tên lửa (từ thời 7) và hạt nhân (từ thời 8) (design/npc-song-that.md mục 7.4)
 * Ở cấp cả bể (W). logic/war.js gọi vào: step mỗi bước (tên lửa đang bay, trúng đích), dayTick mỗi ngày (chế tạo, quyết bắn
 * hạt nhân), salvo khi quân sắp tới cổng.
 *   kho vũ khí    S.arms = { missiles, nukes, nukeDone (ngày xong quả đang chế tạo), lastNuke }. Chỉ đảo độc lập chế tạo.
 *   tên lửa       mỗi quả tốn MISSILE (kim loại, năng lượng). Mỗi ngày người đứng đầu xét có làm thêm không: theo tính cách
 *                 (hiếu chiến, đa nghi, tham vọng thì hay làm; nhu nhược, sùng đạo thì ít) và mối đe doạ (sợ, thù đảo khác,
 *                 đang có chiến tranh). Chỉ làm khi kho dư hẳn (gấp RICH lần giá một quả): đảo giàu có nhiều, đảo nghèo ít hay
 *                 không có; mỗi quả là phần không dùng để lên thời. Số giữ trong kho tối đa MAX_MISSILES + 2 mỗi thời sau thời 7,
 *                 nhân theo độ đầy của kho kim loại, năng lượng (30% khi kho vơi, đủ khi kho đầy).
 *   bắn           (salvo) quân sắp tới cổng thì bắn trước: số quả theo tính người đứng đầu. Đảo bị bắn báo động (S.situ.alarm):
 *                 dân trốn vào nhà (logic/siege.js roleOf). Bay FLIGHT ngày rồi trúng: hai quả đầu nhắm cổng (cổng yếu đi thì
 *                 người giữ mất chỗ dựa, logic/war.js gateCover), sau đó kho, xưởng, nhà dân (logic/siege.js plan). Trúng thì
 *                 công trình mất HIT độ bền, người đang ở đúng chỗ đó có thể chết (trốn trong nhà thì ít hơn). Tên lửa chỉ phá,
 *                 bộ binh vẫn phải vào chiếm nhà chính. Đảo bị đánh có tên lửa, người đứng đầu không nhu nhược, thì bắn trả vào
 *                 đảo kia.
 *   hạt nhân      từ thời 8, rất đắt (NUKE), chế tạo NUKE_DAYS ngày, tối đa 4 quả. Chỉ người đứng đầu hiếu chiến, tham vọng,
 *                 ít sùng đạo, ít nhu nhược mới làm và mới bắn; bắn khi đang đánh nhau mà thua hay thù rất sâu (hay để yểm trợ
 *                 quân mình đang đánh vào đảo mình thù sâu hay đang núng thế ở cổng), hoặc để trả đũa đảo vừa bắn hạt nhân vào mình; thù tột đỉnh mà sợ đảo kia thì có khi bắn phủ đầu. Mỗi quả san phẳng một phần tư đảo: năm nhà dân và một phần các bãi làm
 *                 việc thành đống đổ, người trong vùng chết, đất nhiễm xạ FALLOUT_DAYS ngày (sản xuất kém). Đủ 4 quả thì cả đảo
 *                 bị san phẳng, nhà chính sụp, buộc phải đầu hàng và bị sáp nhập (logic/war.js annex) dù còn quân hay không.
 *                 Cả bể: mọi đảo sợ và thù kẻ dùng hạt nhân; bụi làm trời xám DUST_DAYS ngày, mọi đảo mất mùa.
 * Tên lửa đang bay: W.missiles [{ id, kind, from, to, key, launch, hit }] (phần vẽ: render/missiles3d.js).
 * Không vẽ gì, chạy được bằng Node. Cần: logic/siege.js, logic/war.js, logic/economy.js, logic/strategy.js. */
(function (root, factory) {
  const BK = root.BK || (root.BK = {});
  BK.Missiles = factory(BK);
  if (typeof module === 'object' && module.exports) module.exports = BK.Missiles;
})(typeof self !== 'undefined' ? self : globalThis, function (BK) {
  'use strict';
  const MISSILE_LV = 7, NUKE_LV = 8;
  const MISSILE = { metal: 60, energy: 80 }, NUKE = { metal: 300, energy: 500 };
  const RICH = 3;               // chỉ làm khi kho có ít nhất chừng này lần giá một quả
  const MAX_MISSILES = 6, MAX_NUKES = 4;
  const NUKE_DAYS = 40;
  const FLIGHT = 0.5, NUKE_FLIGHT = 0.8; // ngày bay
  const HIT = 0.45;             // độ bền một quả tên lửa phá
  const KILL = 0.3, SHELTER = 0.08; // khả năng chết của người ở chỗ trúng (trốn trong nhà: SHELTER)
  const FALLOUT_DAYS = 360, FALLOUT_K = 0.15, DUST_DAYS = 90, DUST_FOOD = 0.75;
  const NUKE_REST = 20;         // giữa hai lần bắn hạt nhân của một đảo
  const HOMES_PER_QUARTER = 5;
  const YARDS = ['store', 'farm', 'wood', 'stone', 'craft', 'power', 'drill'];
  const P = () => BK.People, E = () => BK.Economy, G = () => BK.Siege, Wr = () => BK.War;
  const living = (S) => BK.Island.living(S);
  const say = (W, day, text, isles) => BK.Diplomacy.say(W, day, text, isles);
  const note = (S, day, kind, text, ids) => S.log.push({ day: Math.floor(day), kind, ids: ids || [], text });
  const arms = (S) => S.arms || (S.arms = { missiles: 0, nukes: 0, nukeDone: null, lastNuke: -1e9 });
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  function init(W) { W.missiles = W.missiles || []; W.armStats = { built: 0, fired: 0, nukesBuilt: 0, nukes: 0, flattened: 0, killed: 0 }; }
  // tính người đứng đầu (đã nghe hội đồng, logic/strategy.js mind)
  const traitsOf = (S) => { const M = BK.Strategy.mind(S); return M ? M.t : null; };
  // mức hiếu chiến về vũ khí và có dám dùng hạt nhân không
  const militancy = (t) => clamp(0.15 + 0.4 * t.aggression + 0.3 * t.paranoia + 0.2 * t.ambition - 0.3 * t.meekness - 0.2 * t.piety, 0, 1);
  const nukeWill = (t) => t.aggression > 0.5 && t.ambition > 0.45 && t.piety < 0.55 && t.meekness < 0.45;
  // mối đe doạ đảo i cảm thấy: sợ, thù đảo khác mạnh nhất; đang có chiến tranh thì thêm
  function threat(W, i) {
    let m = 0; for (let j = 0; j < W.islands.length; j++) if (j !== i) m = Math.max(m, 0.6 * W.rel[i][j].fear + 0.6 * W.rel[i][j].grudge);
    return clamp(m + (Wr().atWar(W, i) ? 0.3 : 0), 0, 1);
  }
  const canPay = (st, cost, k) => Object.keys(cost).every((r) => st.stock[r] >= cost[r] * k);
  const pay = (st, cost) => { for (const r in cost) st.stock[r] -= cost[r]; };

  /* ---------- Chế tạo (mỗi ngày) ---------- */
  function build(W, day, i, rng) {
    const S = W.islands[i]; if (S.annexedBy != null || S.level < MISSILE_LV) return;
    const t = traitsOf(S); if (!t) return;
    const A = arms(S), st = E().state(S), want = militancy(t), th = threat(W, i);
    // hạt nhân: quả đang chế tạo xong thì vào kho; người dám dùng, bị đe doạ thật, kho dư hẳn thì khởi công quả mới
    if (A.nukeDone != null && day >= A.nukeDone) { A.nukeDone = null; A.nukes++; W.armStats.nukesBuilt++; note(S, day, 'war', 'Chế tạo xong một quả hạt nhân (có ' + A.nukes + ').'); say(W, day, S.name + ' có thêm một quả hạt nhân.', [i]); }
    if (S.level >= NUKE_LV && A.nukeDone == null && A.nukes < MAX_NUKES && nukeWill(t) && th > 0.3 && canPay(st, NUKE, 1) && rng.chance(0.08 + 0.12 * th)) {
      pay(st, NUKE); A.nukeDone = day + NUKE_DAYS; note(S, day, 'war', 'Người đứng đầu cho chế tạo hạt nhân.');
    }
    // số giữ trong kho theo độ giàu: kho kim loại, năng lượng đầy thì giữ đủ, vơi thì ít (đảo nghèo ít tên lửa)
    const rich = Math.min(st.stock.metal / E().CAP(S.level, 'metal'), st.stock.energy / E().CAP(S.level, 'energy'));
    const cap = Math.round((MAX_MISSILES + 2 * (S.level - MISSILE_LV)) * (0.3 + 0.7 * clamp(rich, 0, 1)));
    if (A.missiles < cap && canPay(st, MISSILE, RICH) && rng.chance(clamp(0.02 + 0.12 * want + 0.15 * th, 0, 0.4))) { pay(st, MISSILE); A.missiles++; W.armStats.built++; }
  }

  /* ---------- Bắn tên lửa ---------- */
  function fire(W, day, a, b, key, kind) {
    const m = { id: W.nextId++, kind, from: a, to: b, key, launch: day, hit: day + (kind === 'nuke' ? NUKE_FLIGHT : FLIGHT) };
    W.missiles.push(m); const B = W.islands[b]; B.situ.alarm = Math.max(B.situ.alarm || 0, m.hit + 0.15); B.situChanged = true;
    return m;
  }
  // quân đảo a sắp tới cổng đảo b (logic/war.js, một lần mỗi trận): bắn trước; đảo b (hay đảo cai quản nó) có thể bắn trả
  function salvo(W, day, w) {
    const A = W.islands[w.a], aa = arms(A), t = traitsOf(A); if (!t || !aa.missiles) return;
    const n = Math.min(aa.missiles, Math.max(1, Math.round(1 + 4 * militancy(t)))), B = W.islands[w.b], gate = G().gateOf(Wr().sideOf(w.b, w.a), w.by === 'bridge');
    const later = G().plan(B, W.rng);
    for (let k = 0; k < n; k++) fire(W, day, w.a, w.b, k < 2 ? gate : later[(k - 2) % later.length], 'missile');
    aa.missiles -= n; W.armStats.fired += n;
    say(W, day, A.name + ' bắn ' + n + ' tên lửa vào ' + B.name + ' trước khi quân tới.', [w.a, w.b]);
    note(B, day, 'war', 'Báo động: ' + n + ' tên lửa của ' + A.name + ' đang bay tới. Dân trốn vào nhà.');
    // bắn trả vào đảo kia
    const r = Wr().rulerOf(W, w.b), R = W.islands[r], ra = arms(R), tr = traitsOf(R);
    if (ra.missiles && tr && tr.meekness < 0.55 && W.rng.chance(Math.min(1, 0.1 + tr.aggression))) {
      const k2 = Math.min(ra.missiles, 2), tg = G().plan(A, W.rng);
      for (let k = 0; k < k2; k++) fire(W, day + 0.1, r, w.a, tg[k % tg.length], 'missile');
      ra.missiles -= k2; W.armStats.fired += k2;
      say(W, day, R.name + ' bắn trả ' + k2 + ' tên lửa vào ' + A.name + '.', [r, w.a]);
    }
  }
  // người đang ở chỗ key của đảo S (theo việc đang làm, logic/brain.js S.minds)
  function atSpot(S, key) {
    const out = [], sg = S.situ.siege;
    for (const p of living(S)) {
      if (p.away) continue; const m = S.minds.get(p.id); if (!m) continue;
      const pl = m.place, here = key.startsWith('home:') ? (pl === 'home' && p.home === +key.slice(5)) || (pl === 'homeSlot' && m.slot === +key.slice(5))
        : key === 'gate' || key === 'gateL' || key === 'gateR' ? pl === key || (sg && sg.gate === key && sg.def.includes(p.id))
          : key === 'farm' ? pl === 'field' : key === 'store' ? pl === 'store' || pl === 'queue' : key === 'craft' ? pl === 'craft' : key === 'power' ? pl === 'plant' : key === 'wood' ? pl === 'woods' : key === 'stone' ? pl === 'quarry' : pl === key || pl === 'ruin:' + key;
      if (here) out.push({ p, hide: m.verb === 'hide' || m.verb === 'sleep' });
    }
    return out;
  }
  function kill(W, day, i, p, enemy, cause, at) {
    const S = W.islands[i]; p.alive = false; p.died = day; p.cause = cause; S.deaths++; W.armStats.killed++;
    if (p.role) S.situ.mourning = day + 4;
    const r = Wr().rulerOf(W, i); W.rel[r][enemy].grudge = Math.min(1, W.rel[r][enemy].grudge + 0.04);
    const list = S.fallen || (S.fallen = []); list.push({ id: p.id, i, at: 'ruin:' + at, day, sex: p.sex }); if (list.length > 80) list.splice(0, list.length - 80);
  }
  function impact(W, day, m) {
    const B = W.islands[m.to], A = W.islands[m.from];
    if (m.kind === 'nuke') return nukeHit(W, day, m);
    G().hit(B, m.key, HIT);
    let dead = 0; for (const x of atSpot(B, m.key)) if (W.rng.chance(x.hide ? SHELTER : KILL)) { kill(W, day, m.to, x.p, m.from, 'tên lửa', m.key); dead++; }
    note(B, day, 'war', 'Tên lửa ' + A.name + ' trúng ' + G().nameOf(m.key) + (dead ? ', ' + dead + ' người chết.' : '.'));
  }

  /* ---------- Hạt nhân ---------- */
  // mỗi ngày: đảo có hạt nhân, người đứng đầu dám dùng, xét bắn
  function nukeDecide(W, day, a, rng) {
    const A = W.islands[a], aa = arms(A); if (!aa.nukes || A.annexedBy != null || day - aa.lastNuke < NUKE_REST) return;
    const t = traitsOf(A); if (!t || !nukeWill(t)) return;
    let best = null, bs = 0;
    for (let b = 0; b < W.islands.length; b++) {
      if (b === a || Wr().rulerOf(W, b) === a) continue;
      const B = W.islands[b], g = W.rel[a][b].grudge;
      const war = W.wars.find((w) => w.kind !== 'revolt' && ((w.a === a && w.b === b) || (w.a === b && Wr().rulerOf(W, w.b) === a)));
      const losing = war && (war.a === a ? war.morale < 0.6 || war.troops.length < war.n0 * 0.5 : true); // đang bị đánh vào nhà: coi như thua
      const revenge = B.arms && B.arms.lastNukeAt === a && day - B.arms.lastNuke < 30;
      const assault = war && war.a === a && war.kind === 'conquer' && (war.stage === 'gate' || war.stage === 'inside') && (g > 0.7 || war.morale < 0.9); // yểm trợ quân mình đang đánh vào đảo mình thù sâu, hay đang núng thế
      // thù rất sâu và sợ đảo kia (không cần đang đánh nhau): bắn phủ đầu, ít khi
      const deep = !war && g >= 0.9 && W.rel[a][b].fear >= 0.3 && rng.chance(0.15);
      const sc = revenge ? 2 : war && (losing || g > 0.9 || assault) ? 1 + g : deep ? 0.5 : 0;
      if (sc > bs) { bs = sc; best = b; }
    }
    if (best == null || !rng.chance(0.25 + 0.3 * t.aggression)) return;
    aa.nukes--; aa.lastNuke = day; aa.lastNukeAt = best; W.armStats.nukes++;
    fire(W, day, a, best, 'nuke', 'nuke');
    say(W, day, A.name + ' bắn hạt nhân vào ' + W.islands[best].name + '!', [a, best]);
  }
  function nukeHit(W, day, m) {
    const a = m.from, b = m.to, B = W.islands[b], A = W.islands[a];
    const q = (B.nuked || 0) % 4; B.nuked = (B.nuked || 0) + 1; B.nukedTotal = (B.nukedTotal || 0) + 1;
    // một phần tư đảo: năm nhà dân, các bãi làm việc theo phần tư
    const slots = []; for (let s = q * HOMES_PER_QUARTER; s < (q + 1) * HOMES_PER_QUARTER; s++) { slots.push(s); G().hit(B, 'home:' + s, 1); }
    YARDS.forEach((k, j) => { if (j % 4 === q) G().hit(B, k, 1); });
    let dead = 0;
    for (const p of living(B)) if (!p.away && ((p.home != null && slots.includes(p.home)) || W.rng.chance(0.08))) { kill(W, day, b, p, a, 'hạt nhân', p.home != null && slots.includes(p.home) ? 'home:' + p.home : 'store'); dead++; }
    B.falloutUntil = day + FALLOUT_DAYS; B.situ.mourning = day + 6; B.situChanged = true;
    // cả bể: sợ và thù kẻ dùng hạt nhân; bụi che trời, mất mùa
    for (let j = 0; j < W.islands.length; j++) {
      W.islands[j].dustUntil = Math.max(W.islands[j].dustUntil || 0, day + DUST_DAYS);
      if (j === a) continue; const r = W.rel[j][a]; r.fear = Math.min(1, r.fear + 0.4); r.grudge = Math.min(1, r.grudge + (j === b ? 0.6 : 0.3)); r.trust = Math.max(0, r.trust - 0.4);
    }
    say(W, day, 'Hạt nhân của ' + A.name + ' nổ ở ' + B.name + ': một phần tư đảo thành tro, ' + dead + ' người chết. Bụi che trời cả bể.', [a, b]);
    note(B, day, 'war', 'Hạt nhân nổ: ' + dead + ' người chết, đất nhiễm xạ (lần thứ ' + B.nuked + ').');
    if (B.nuked >= 4) {
      // san phẳng: mọi công trình, nhà chính sụp; buộc đầu hàng, bị sáp nhập dù còn quân hay không
      for (let s = 0; s < 20; s++) G().hit(B, 'home:' + s, 1); for (const k of YARDS) G().hit(B, k, 1); G().hit(B, 'hall', 1); G().hit(B, 'gate', 1);
      W.armStats.flattened++; B.nuked = 0;
      for (const w of [...W.wars]) if (w.b === b && w.kind !== 'revolt' && w.stage !== 'return') Wr().endWar(W, day, w); // quân đang đánh đảo này thì về
      say(W, day, B.name + ' bị san phẳng sau bốn quả hạt nhân, buộc phải đầu hàng ' + A.name + '.', [a, b]);
      Wr().annex(W, day, a, b, null, 'bị san phẳng');
    }
  }

  /* ---------- Mỗi bước, mỗi ngày ---------- */
  function step(W, day) {
    if (!W.missiles || !W.missiles.length) return;
    for (const m of W.missiles) if (!m.done && day >= m.hit) { m.done = true; impact(W, day, m); }
    W.missiles = W.missiles.filter((m) => !m.done || day < m.hit + (m.kind === 'nuke' ? 2.5 : 0.5)); // còn giữ một lúc cho phần vẽ (vụ nổ)
  }
  function dayTick(W, day, rng) {
    for (let i = 0; i < W.islands.length; i++) { build(W, day, i, rng); nukeDecide(W, day, i, rng); }
  }
  // phần sản lượng còn lại vì nhiễm xạ (đảo bị bắn hạt nhân) và bụi (cả bể mất mùa) (logic/economy.js)
  function output(S, r, day) {
    let k = 1;
    if (S.falloutUntil > day) k *= 1 - FALLOUT_K * Math.min(3, S.nukedTotal || 1);
    if (S.dustUntil > day && r === 'food') k *= DUST_FOOD;
    return k;
  }
  // độ bụi trên trời lúc này (0..1, phần vẽ: trời xám)
  const dust = (W, day) => W.islands.reduce((m, S) => Math.max(m, S.dustUntil > day ? Math.min(1, (S.dustUntil - day) / 20) : 0), 0);
  return { init, step, dayTick, salvo, fire, output, dust, arms, militancy, nukeWill, MISSILE_LV, NUKE_LV, MISSILE, NUKE, FLIGHT, NUKE_FLIGHT };
});
