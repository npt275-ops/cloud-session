/* Bể Kính · logic/economy.js · Tài nguyên, sản xuất, kho và lên cấp của một đảo
 * (design/quy-trinh-tong-quat.md mục 5) Sáu loại tài nguyên; mỗi đảo dồi dào vài thứ, thiếu hẳn vài thứ (RICH), nên một mình
 * thì các thời sau rất chậm (sau này giao thương, chiếm đoạt sẽ bù vào: logic/diplomacy.js, logic/war.js).
 * Mỗi ngày (dayTick):
 *   chia người làm (job 'worker') theo nhu cầu: thiếu lương thực thì dồn ra ruộng trước, rồi thứ giỏ thời sau còn thiếu
 *   nhiều nhất mà đảo làm ra được (p.res); người cũ giữ việc của mình nếu không phải đổi
 *   sản xuất = năng suất (gen: trí tuệ giỏi hơn; sợ hãi, nhu nhược kém hơn; đói thì kém) × độ giàu của đảo × khí hậu
 *            (mùa, hạn hán) × công nghệ của thời
 *   ăn: mỗi người một phần, lính ăn nhiều hơn, trẻ ít hơn; hết lương thực thì đói (S.hunger), bạo loạn dễ nổ hơn
 *   kho có sức chứa, đầy thì phần dư bỏ phí
 *   đủ giỏ của thời sau (Eras cost), đủ dân, ở thời này đủ lâu (MIN_DAYS), không đói: nộp giỏ, lên cấp
 * Không vẽ gì, chạy được bằng Node. Cần: logic/rules.js, logic/people.js, logic/eras.js. */
(function (root, factory) {
  const BK = root.BK || (root.BK = {});
  BK.Economy = factory(BK);
  if (typeof module === 'object' && module.exports) module.exports = BK.Economy;
})(typeof self !== 'undefined' ? self : globalThis, function (BK) {
  'use strict';
  const RES = ['food', 'wood', 'stone', 'metal', 'energy', 'luxury'];
  const NAME = { food: 'Lương thực', wood: 'Gỗ', stone: 'Đá', metal: 'Kim loại', energy: 'Năng lượng', luxury: 'Hàng quý' };
  // tên người làm ra từng thứ (thẻ người, bảng làng)
  const WORKER = { food: 'Nông dân', wood: 'Tiều phu', stone: 'Thợ đá', metal: 'Thợ mỏ', energy: 'Thợ năng lượng', luxury: 'Thợ hàng quý' };
  // thời bắt đầu khai thác được (lương thực, gỗ, đá từ đầu; kim loại, hàng quý từ Cổ đại; năng lượng từ Cận đại)
  const UNLOCK = { food: 1, wood: 1, stone: 1, metal: 2, energy: 4, luxury: 2 };
  // độ giàu của từng đảo với từng thứ: 1,6 dồi dào, 1 thường, 0,6 có ít, 0,08 gần như không có (design mục 5.2). Lương thực
  // không đảo nào dưới 0,6: đất cằn vẫn săn bắt, hái lượm được
  const A = 1.6, M = 1, F = 0.6, X = 0.08;
  const RICH = {
    plains: { food: A, wood: F, stone: X, metal: X, energy: M, luxury: M },
    forest: { food: M, wood: A, stone: M, metal: X, energy: M, luxury: M },   // rừng: săn bắt, hái lượm đủ ăn; gần như không có kim loại
    mountain: { food: F, wood: M, stone: A, metal: A, energy: M, luxury: F },
    tundra: { food: X, wood: X, stone: F, metal: M, energy: A, luxury: M },
    coast: { food: M, wood: F, stone: M, metal: X, energy: M, luxury: A },
    desert: { food: F, wood: X, stone: F, metal: M, energy: A, luxury: A },
  };
  // cá: Tuyết Trắng và Cửa Sóng nuôi dân bằng cá (lương thực từ biển, không phải trồng trọt)
  const FISH = { tundra: 0.6, coast: 0.6 };                // biển băng khó đánh cá hơn mặt nước ấm nhưng bù lại ít đất trồng
  const EAT = { adult: 0.45, child: 0.3, soldier: 0.6 };    // phần ăn mỗi ngày
  const BASE = 3;                                           // một người làm một ngày, đảo thường, thời đầu
  const COUNCIL_WORK = (lv) => (lv <= 3 ? 1 : 0.5);         // người trong hội đồng cũng làm ra lương thực: thời đầu làm đủ sức
                                                            // như mọi người (tù trưởng, bô lão cùng đi làm), về sau nửa sức
  // sức chứa kho mỗi thứ (lương thực gấp ba: kho thóc); luôn chứa đủ giỏ của thời sau, dư thêm 25%
  const CAP = (lv, r) => { const next = lv < BK.Eras.COUNT ? BK.Eras.of(lv + 1).cost[r] || 0 : 0; return Math.max((400 + 80 * lv) * (r === 'food' ? 3 : 1), next * 1.25); };
  const MIN_DAYS = 120;                                       // ở một thời ít nhất chừng này ngày mới lên được thời sau
  // thời muộn (design/chien-tranh-thinh-vuong.md mục 9): công nghệ cũ dẫn đường cho công nghệ mới, nên từ thời LATE_LV giỏ
  // nhẹ hơn (LATE_COST phần) và ở mỗi thời ngắn hơn (LATE_DAYS): đảo dẫn đầu tới thời 11 vào khoảng năm 7, 8
  const LATE_LV = 7, LATE_COST = 0.6, LATE_DAYS = 75;
  const minDays = (lv) => (lv >= LATE_LV ? LATE_DAYS : MIN_DAYS);
  const POP_NEED = (lv) => 12 + lv;                          // dân tối thiểu để lên thời lv

  const state = (S) => S.eco || (S.eco = { stock: Object.fromEntries(RES.map((r) => [r, r === 'food' ? 160 : 0])), made: {}, eaten: 0, hunger: 0, since: 0 });
  const richOf = (S, r) => (RICH[S.key] || RICH.plains)[r] + (r === 'food' ? FISH[S.key] || 0 : 0); // cá cộng thêm vào lương thực trồng trọt
  const can = (S, r) => (S.level || 1) >= UNLOCK[r];
  // năng suất một người theo gen, đói thì kém
  function skill(S, p) { const t = BK.People.traits(p); return Math.max(0.3, 0.75 + 0.5 * t.intellect - 0.2 * t.fear - 0.2 * t.meekness) * (state(S).hunger > 0 ? 0.7 : 1); }
  // khí hậu của ngày: mùa đông lương thực trồng trọt kém; thiên tai (hạn hán, bão, cháy rừng...) theo logic/climate.js
  function climate(S, r, day) {
    const season = Math.floor(((day % BK.Rules.YEAR_DAYS) + BK.Rules.YEAR_DAYS) % BK.Rules.YEAR_DAYS / 90); // 0 xuân 1 hạ 2 thu 3 đông
    let k = 1;
    if (r === 'food') k *= [1, 1.15, 1.1, 0.45][season];
    if (r === 'wood' && season === 3) k *= 0.8;
    return k * (BK.Climate ? BK.Climate.factor(S, r, day) : 1); // thiên tai đang có (logic/climate.js)
  }
  const tech = (lv) => 1 + 0.1 * (lv - 1); // công nghệ của thời: mỗi thời làm ra nhiều hơn 10%
  const nextCost = (S) => { if (S.level >= BK.Eras.COUNT) return null; const c = BK.Eras.of(S.level + 1).cost; if (S.level + 1 < LATE_LV + 1) return c; const o = {}; for (const r in c) o[r] = Math.round(c[r] * LATE_COST); return o; };
  // chia người làm: trước hết đủ người làm lương thực để ăn dư ~15% (thêm người khi kho cạn); số còn lại chia cho những thứ
  // giỏ thời sau còn thiếu, nghiêng về thứ đảo mình giàu, và một phần làm đặc sản để bán
  function allocate(S, workers, day, eat, councilFood) {
    // năng suất một người làm ruộng: đo thật (trung bình trượt st.perFood, tính ở dayTick), chưa có thì ước theo độ giàu
    const st = state(S), cost = nextCost(S) || {}, per = st.perFood || BASE * richOf(S, 'food') * tech(S.level);
    const foodDays = st.stock.food / Math.max(1, eat), full = st.stock.food >= CAP(S.level, 'food') * 0.9;
    // kho sắp cạn thì làm dư nhiều; kho gần đầy thì chỉ đủ ăn, phần người còn lại làm thứ khác
    const needFood = Math.max(0, eat * (foodDays < 15 ? 1.45 : foodDays < 45 ? 1.25 : full ? 0.95 : 1.1) - councilFood);
    const quota = { food: Math.min(workers.length, Math.ceil(needFood / Math.max(0.1, per))) };
    const want = {};
    for (const r of RES) { if (r === 'food' || !can(S, r)) continue; const lack = Math.max(0, (cost[r] || 0) - st.stock[r]) / Math.max(1, cost[r] || 1); if (cost[r] && lack > 0) want[r] = lack * Math.sqrt(richOf(S, r)); }
    // giỏ thời sau cũng đòi lương thực: dành thêm, nhưng không đòi quá trần kho (đòi quá thì không bao giờ đủ, cả làng làm ruộng mãi)
    if (cost.food && st.stock.food < Math.min(CAP(S.level, 'food') * 0.95, cost.food + eat * 30)) want.food = 0.5;
    // hàng xuất khẩu: đặc sản của đảo (độ giàu cao nhất) làm thêm khi kho còn vơi, để đem đổi lấy thứ mình thiếu (logic/diplomacy.js)
    { const best = RES.filter((r) => r !== 'food' && can(S, r)).sort((x, y) => richOf(S, y) - richOf(S, x))[0];
      if (best && richOf(S, best) >= 1.5 && st.stock[best] < CAP(S.level, best) * 0.6) want[best] = (want[best] || 0) + 0.35 * Math.sqrt(richOf(S, best)); }
    let rest = workers.length - quota.food; const sum = Object.values(want).reduce((a, b) => a + b, 0);
    if (sum > 0) { const order = Object.keys(want).sort((a, b) => want[b] - want[a]); let given = 0;
        for (const r of order) { const k = Math.floor((want[r] / sum) * rest); quota[r] = (quota[r] || 0) + k; given += k; } for (let k = 0; given < rest; k++,
        given++) quota[order[k % order.length]] = (quota[order[k % order.length]] || 0) + 1; }
    else quota.food += rest; // giỏ đã đủ: làm thêm lương thực để dành
    // giữ người cũ ở việc cũ còn chỗ; ai thừa thì sang việc còn thiếu người
    const free = [];
    for (const p of workers) { if (p.res && quota[p.res] > 0) quota[p.res]--; else free.push(p); }
    for (const p of free) { const r = Object.keys(quota).find((x) => quota[x] > 0) || 'food'; p.res = r; quota[r]--; }
  }
  // một ngày của kinh tế: trả về true nếu đảo vừa lên cấp
  function dayTick(S, day, rng) {
    const st = state(S), live = BK.Island.living(S), P = BK.People, R = BK.Rules;
    const workers = live.filter((p) => p.job === 'worker' && !p.away); // người đi đánh trận (logic/war.js) không làm ở nhà
    for (const p of live) if (p.job !== 'worker') p.res = null;
    let eat = 0; for (const p of live) { const a = P.ageOf(p, day); eat += a < R.ADULT_AGE ? EAT.child : p.job === 'soldier' || p.job === 'gatekeeper' || p.job === 'sideguard' ? EAT.soldier : EAT.adult; }
    let councilFood = 0; for (const p of live) if (p.role) councilFood += COUNCIL_WORK(S.level) * BASE * skill(S, p) * richOf(S, 'food') * climate(S, 'food', day) * tech(S.level);
    allocate(S, workers, day, eat, councilFood);
    st.made = { food: councilFood }; // phần lương thực người trong hội đồng làm ra
    let farm = 0, farmers = 0;
    for (const p of workers) { const r = p.res; if (!can(S, r)) continue; const v = BASE * skill(S, p) * richOf(S, r) * climate(S, r,
        day) * tech(S.level) * (BK.Siege ? BK.Siege.output(S, r) : 1) * (BK.Missiles ? BK.Missiles.output(S, r, day) : 1) * (BK.Ecology ? BK.Ecology.output(S,
        r) : 1) * (BK.Prosperity ? BK.Prosperity.output(S) : 1); st.made[r] = (st.made[r] || 0) + v; if (r === 'food') { farm += v; farmers++; } }
    // bị vây (logic/battles.js): ruộng ngoài thành không ra được, cả đảo gần như không làm ra lương thực
    if (S.situ.blockade > day) { st.made.food *= BK.Battles ? BK.Battles.BLOCKADE_FOOD : 0.3; farm *= BK.Battles ? BK.Battles.BLOCKADE_FOOD : 0.3; }
    if (farmers) st.perFood = st.perFood ? st.perFood * 0.8 + (farm / farmers) * 0.2 : farm / farmers; // năng suất thật (cho allocate)
    // thợ cả, thương nhân góp thêm hàng quý từ thời có chợ (buôn bán trong đảo)
    if (can(S, 'luxury')) for (const p of live) if (p.job === 'trader' || p.role === 'merchant') st.made.luxury = (st.made.luxury || 0) + 0.4 * richOf(S, 'luxury') * tech(S.level);
    st.eaten = eat;
    for (const r of RES) st.stock[r] = Math.min(CAP(S.level, r), st.stock[r] + (st.made[r] || 0) - (r === 'food' ? eat : 0));
    // đói: hết lương thực thì đói (kéo dài thì người yếu có thể mất), bất bình dễ thành bạo loạn (logic/dramas.js riot.boost)
    // bắt đầu đói, hết đói: cả đảo xét lại việc (logic/brain.js; trưa ra kho xếp hàng nhận khẩu phần, logic/tasks.js)
    if (st.stock.food < 0) { st.stock.food = 0; if (!st.hunger) { S.log.push({ day: Math.floor(day), kind: 'hunger', ids: [], text: S.name + ' hết lương thực, dân bắt đầu đói.' }); S.situChanged = true; } st.hunger++; }
    else if (st.hunger) { st.hunger = 0; S.log.push({ day: Math.floor(day), kind: 'hunger', ids: [], text: S.name + ' đã có lại lương thực.' }); S.situChanged = true; }
    S.food = st.hunger ? 0.4 : S.situ.drought > day ? 0.6 : 1;
    // kho lương thực xuống dưới 3 ngày ăn (bắt đầu phát khẩu phần, logic/tasks.js) hay có lại: cả đảo xét lại việc
    const scarce = st.stock.food < eat * 3; if (scarce !== !!st.scarce) { st.scarce = scarce; S.situChanged = true; }
    if (st.hunger > 20 && rng.chance(0.03)) { const weak = live.filter((p) => P.ageOf(p, day) >= R.OLD_AGE || P.ageOf(p, day) < 4);
        if (weak.length) { const v = rng.pick(weak); v.alive = false; v.died = day; v.cause = 'đói'; S.deaths++; S.log.push({ day: Math.floor(day),
        kind: 'death', ids: [v.id], text: P.fullName(v) + ' chết đói.' }); S.situChanged = true; } }
    // lên cấp
    st.since++;
    const cost = nextCost(S);
    // đảo bị sáp nhập (logic/war.js) không tự lên cấp: dùng chung thời với đảo cai quản
    if (cost && S.annexedBy == null && st.since >= minDays(S.level) && !st.hunger && live.length >= POP_NEED(S.level + 1) && Object.keys(cost).every((r) => st.stock[r] >= cost[r])) {
      for (const r in cost) st.stock[r] -= cost[r];
      S.level++; st.since = 0; return true;
    }
    return false;
  }
  // phần đã có của giỏ thời sau (0..1, bảng dev)
  function progress(S) { const cost = nextCost(S); if (!cost) return 1; const st = state(S), ks = Object.keys(cost); return ks.reduce((a, r) => a + Math.min(1, st.stock[r] / cost[r]), 0) / ks.length; }
  // dev rà soát: đặt thẳng cấp cho một đảo (nút ◀ ▶), kho đủ ăn
  function devSetLevel(S, lv) { const st = state(S); S.level = lv; st.since = 0; st.hunger = 0; st.stock.food = Math.max(st.stock.food, 200); }
  return { RES, NAME, WORKER, UNLOCK, RICH, CAP, MIN_DAYS, state, richOf, can, dayTick, progress, nextCost, devSetLevel };
});
