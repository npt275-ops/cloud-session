/* Bể Kính · logic/island.js
 * Trạng thái của một đảo và nhịp chạy theo ngày: 8 người đầu tiên, hội đồng, tuổi và cái chết, mốc thế hệ mỗi 1,5 năm,
 * hạn hán mùa hạ, bộ não của từng người, và các tình huống thử (lệnh chiến tranh, cãi nhau, lễ hội).
 * Không vẽ gì: phần vẽ đọc S.people, S.minds, S.seats, S.log. Chạy được bằng Node (xem test/island.test.js).
 * Cần: logic/rng.js, rules.js, genes.js, people.js, family.js, council.js, brain.js. */
(function (root, factory) {
  const BK = root.BK || (root.BK = {});
  BK.Island = factory(BK);
  if (typeof module === 'object' && module.exports) module.exports = BK.Island;
})(typeof self !== 'undefined' ? self : globalThis, function (BK) {
  'use strict';
  const R = BK.Rules, G = BK.Genes, P = BK.People, F = BK.Family, CO = BK.Council, B = BK.Brain;

  // nét chung của từng đảo (bộ gen của người đầu tiên và người dân thường lệch theo đây)
  const ISLANDS = {
    plains: { name: 'Lúa Vàng', bias: { aggression: -0.06, piety: 0.05, intellect: 0.02 } },
  };

  /* ---------- Tạo đảo với 8 người đầu tiên (4 nam, 4 nữ) ---------- */
  function create(o) {
    const key = o.key || 'plains', def = ISLANDS[key], rng = BK.Rng.create(o.seed || 1);
    const S = {
      key, name: def.name, bias: def.bias, clans: P.CLANS[key], rng,
      day: 0, lastDay: 0, nextGenDay: R.GEN_DAYS, gen: 0, nextId: 1,
      people: new Map(), usedNames: new Set(), seats: {}, minds: new Map(), log: [],
      food: 1, situ: { drought: 0, war: 0, festival: 0, mourning: 0, quarrel: null }, situChanged: false, thinkAcc: 0,
    };
    const sexes = ['m', 'f', 'm', 'f', 'm', 'f', 'm', 'f'];
    sexes.forEach((sex, i) => {
      const age = rng.range(R.START_AGE[0], R.START_AGE[1]), name = P.pickName(rng, sex, S.usedNames);
      const p = P.create({ id: S.nextId++, name, clan: S.clans[i], sex, born: -age / R.AGE_PER_DAY, genome: G.random(rng, S.bias), gen: 0 });
      S.people.set(p.id, p); S.usedNames.add(name);
    });
    CO.assignAll(S, [...S.people.values()]);
    S.log.push({ day: 0, kind: 'start', ids: [], text: 'Tám người đầu tiên dựng làng ' + S.name + '.' });
    F.generation(S, rng); // lập làng: tám người kết đôi và sinh lứa con đầu tiên
    B.think(S, rng);
    return S;
  }

  /* ---------- Chạy tới ngày mới ---------- */
  // days: số ngày trong game trôi qua (có thể lẻ). Việc theo ngày chạy ở từng mốc ngày nguyên.
  function step(S, days) {
    const rng = S.rng;
    S.day += days;
    while (S.lastDay + 1 <= S.day) { S.lastDay++; dayTick(S, S.lastDay, rng); }
    S.thinkAcc += days * R.THINK_PER_DAY;
    if (S.thinkAcc >= 1 || S.situChanged) { S.thinkAcc = 0; B.think(S, rng); }
  }
  function dayTick(S, day, rng) {
    const saved = S.day; S.day = day;
    // già đi và mất
    for (const p of S.people.values()) if (P.ageStep(p, day, rng)) { S.log.push({ day, kind: 'death', ids: [p.id], text: P.fullName(p) + ' qua đời ở tuổi ' + Math.round(P.ageOf(p, day)) + '.' }); if (p.role) S.situ.mourning = day + 4; S.situChanged = true; }
    CO.update(S);
    // hạn hán: mỗi mùa hạ có thể có một đợt
    const doy = day % R.YEAR_DAYS;
    if (doy === 100 && rng.chance(R.DROUGHT_CHANCE)) startDrought(S, rng.int(R.DROUGHT_DAYS[0], R.DROUGHT_DAYS[1]));
    S.food = S.situ.drought > day ? 0.4 : 1;
    // mốc thế hệ
    if (day >= S.nextGenDay) { S.gen++; S.nextGenDay += R.GEN_DAYS; S.log.push({ day, kind: 'gen', ids: [], text: 'Thế hệ thứ ' + (S.gen + 1) + ' bắt đầu.' }); F.generation(S, rng); S.situChanged = true; }
    if (S.log.length > 600) S.log.splice(0, S.log.length - 600);
    S.day = saved;
  }

  /* ---------- Tình huống (dùng cho thời tiết thật và cho nút thử) ---------- */
  function startDrought(S, days) { S.situ.drought = S.day + days; S.situChanged = true; S.log.push({ day: Math.floor(S.day), kind: 'drought', ids: [], text: 'Hạn hán kéo đến ' + S.name + ', ruộng nứt nẻ.' }); }
  function trigger(S, kind) {
    const rng = S.rng, day = S.day;
    if (kind === 'drought') startDrought(S, 20);
    else if (kind === 'war') { S.situ.war = day + 6; S.log.push({ day: Math.floor(day), kind: 'war', ids: [], text: 'Lệnh chiến tranh được ban ra.' }); }
    else if (kind === 'festival') { S.situ.festival = day + 4; S.log.push({ day: Math.floor(day), kind: 'festival', ids: [], text: 'Làng mở hội.' }); }
    else if (kind === 'quarrel') { const adults = [...S.people.values()].filter((p) => p.alive && P.ageOf(p, day) >= R.ADULT_AGE); if (adults.length > 1) { const a = rng.pick(adults); let b = rng.pick(adults); while (b === a) b = rng.pick(adults); S.situ.quarrel = null; B.startQuarrel(S, a.id, b.id, rng); } }
    else if (kind === 'calm') { S.situ = { drought: 0, war: 0, festival: 0, mourning: 0, quarrel: null }; S.log.push({ day: Math.floor(day), kind: 'calm', ids: [], text: 'Mọi chuyện lắng xuống.' }); }
    else if (kind === 'nextGen') { const d = Math.max(0, S.nextGenDay - S.day); step(S, d + 0.01); return; }
    S.situChanged = true; B.think(S, rng);
  }

  /* ---------- Đọc nhanh cho phần vẽ và bảng ---------- */
  const living = (S) => [...S.people.values()].filter((p) => p.alive);
  function situNow(S) { const X = S.situ, d = S.day; return { war: X.war > d, drought: X.drought > d, festival: X.festival > d, mourning: X.mourning > d, quarrel: !!(X.quarrel && X.quarrel.until > d) }; }

  return { ISLANDS, create, step, trigger, living, situNow };
});
