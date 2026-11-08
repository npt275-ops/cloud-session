/* Bể Kính · logic/island.js
 * Trạng thái của một đảo và nhịp chạy theo ngày: 8 người đầu tiên, hội đồng, tuổi và cái chết, mốc thế hệ mỗi 1,5 năm,
 * hạn hán mùa hạ, bộ não của từng người, và các tình huống thử (lệnh chiến tranh, cãi nhau, lễ hội).
 * Sáu đảo dùng chung tệp này, mỗi đảo một nét gen và bộ gia tộc riêng (ISLANDS, People.CLANS); cả bể do logic/world.js chạy.
 * Không vẽ gì: phần vẽ đọc S.people, S.minds, S.seats, S.log. Chạy được bằng Node (xem test/island.test.js).
 * Thời kỳ lên khi đảo nộp đủ giỏ tài nguyên (logic/economy.js); việc của dân (logic/jobs.js) gán lại mỗi ngày.
 * Buổi trong ngày (S.tod, phần chạy game ghi vào) quyết định việc ngày thường (logic/schedule.js, logic/tasks.js); công trình của
 * mỗi thời được dựng dần (logic/construction.js, danh sách lấy từ o.buildPlan(cấp)).
 * Drama trong thành phố (logic/dramas.js) chạy mỗi nhịp: gom người cùng tính cách bỏ việc ra tham gia, tan thì về việc cũ.
 * Khí hậu, thiên tai (logic/climate.js) và ngoại gen (logic/epigen.js) chạy mỗi ngày.
 * Cần: logic/rng.js, rules.js, genes.js, people.js, family.js, council.js, temper.js, posts.js, jobs.js, eras.js, schedule.js, tasks.js,
 * dramas.js, economy.js, climate.js, epigen.js, construction.js, brain.js. */
(function (root, factory) {
  const BK = root.BK || (root.BK = {});
  BK.Island = factory(BK);
  if (typeof module === 'object' && module.exports) module.exports = BK.Island;
})(typeof self !== 'undefined' ? self : globalThis, function (BK) {
  'use strict';
  const R = BK.Rules, G = BK.Genes, P = BK.People, F = BK.Family, CO = BK.Council, B = BK.Brain, J = BK.Jobs, E = BK.Eras, K = BK.Construction, H = BK.Homes;

  // nét chung của từng đảo (bộ gen của người đầu tiên và người dân thường lệch theo đây)
  // nét gen chung của dân mỗi đảo (độ lệch gen gốc, logic/genes.js): mỗi đảo một kiểu người, dẫn tới những lựa chọn khác nhau
  const ISLANDS = {
    plains: { name: 'Lúa Vàng', bias: { aggression: -0.06, piety: 0.05, intellect: 0.02 } },      // hiền, sùng đạo
    forest: { name: 'Thông Xanh', bias: { piety: 0.04, meekness: 0.03, aggression: -0.03 } },     // trầm lặng, gắn với rừng
    mountain: { name: 'Đá Mây', bias: { aggression: 0.06, fear: -0.05, paranoia: 0.02 } },        // gan lì, hiếu chiến
    tundra: { name: 'Tuyết Trắng', bias: { paranoia: 0.05, fear: -0.03, intellect: 0.02 } },      // đa nghi, chịu rét
    coast: { name: 'Cửa Sóng', bias: { cunning: 0.06, ambition: 0.03, paranoia: -0.03 } },       // khéo buôn bán
    desert: { name: 'Cát Hồng', bias: { ambition: 0.05, piety: 0.04, cunning: 0.02 } },          // tham vọng, sùng đạo
  };

  /* ---------- Tạo đảo với 8 người đầu tiên (4 nam, 4 nữ) ---------- */
  function create(o) {
    const key = o.key || 'plains', def = ISLANDS[key] || ISLANDS.plains, rng = BK.Rng.create(o.seed || 1);
    const S = {
      key, name: def.name, bias: def.bias, clans: P.CLANS[key], rng,
      day: 0, lastDay: 0, nextGenDay: R.GEN_DAYS, gen: 0, nextId: 1, level: 1, births: 0, deaths: 0, tod: 0.3, buildPlan: o.buildPlan || null, build: null,
      people: new Map(), usedNames: new Set(), seats: {}, minds: new Map(), log: [],
      food: 1, situ: { drought: 0, war: 0, festival: 0, mourning: 0, quarrel: null, protest: 0 }, situChanged: false, thinkAcc: 0,
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
    // lứa con đầu tiên đủ các tuổi (sơ sinh tới khoảng 12 tuổi, nhỏ hơn cha mẹ ít nhất 18 tuổi): ngày đầu làng có trẻ đi học,
    // trẻ phụ việc, không phải chỉ toàn trẻ nhỏ chạy quanh nhà
    for (const c of S.people.values()) {
      if (!c.parents || !c.parents.length) continue;
      const young = Math.min(...c.parents.map((id) => P.ageOf(S.people.get(id), 0))), age = Math.max(0, Math.min(young - 17, rng.range(0, 8)));
      c.born = -age / R.AGE_PER_DAY;
    }
    S.births = S.people.size - 8; if (J) J.assign(S);
    if (K) K.setEra(S, 1);
    B.think(S, rng);
    return S;
  }

  /* ---------- Chạy tới ngày mới ---------- */
  // days: số ngày trong game trôi qua (có thể lẻ). Việc theo ngày chạy ở từng mốc ngày nguyên.
  function step(S, days) {
    const rng = S.rng;
    S.day += days;
    while (S.lastDay + 1 <= S.day) { S.lastDay++; dayTick(S, S.lastDay, rng); }
    BK.Dramas.update(S, days, rng); // drama trong thành phố: sang màn, tan, bốc thăm drama mới
    S.thinkAcc += days * R.THINK_PER_DAY;
    if (S.thinkAcc >= 1 || S.situChanged) { S.thinkAcc = 0; B.think(S, rng); }
  }
  function dayTick(S, day, rng) {
    const saved = S.day; S.day = day;
    // già đi và mất
    for (const p of S.people.values()) if (P.ageStep(p, day, rng, S.level)) { S.deaths++; S.log.push({ day, kind: 'death', ids: [p.id], text: P.fullName(p) + ' qua đời ở tuổi ' + Math.round(P.ageOf(p, day)) + '.' }); if (p.role) S.situ.mourning = day + 4; S.situChanged = true; }
    CO.update(S);
    // khí hậu và thiên tai của đảo (logic/climate.js): hạn hán, lũ, bão, cháy rừng, dịch bệnh... đúng mùa của từng đảo
    BK.Climate.dayTick(S, day, rng);
    // mốc thế hệ
    if (day >= S.nextGenDay) { S.gen++; S.nextGenDay += R.GEN_DAYS; S.log.push({ day, kind: 'gen', ids: [], text: 'Thế hệ thứ ' + (S.gen + 1) + ' bắt đầu.' }); const n0 = S.people.size; F.generation(S, rng); S.births += S.people.size - n0; S.situChanged = true; }
    else if (F.trickle) { const kids = F.trickle(S, rng); if (kids && kids.length) { S.births += kids.length; S.situChanged = true; } }
    if (J) J.assign(S);
    if (H) H.assign(S);
    // kinh tế (logic/economy.js): làm ra, ăn, cất kho; đủ giỏ tài nguyên của thời sau thì lên cấp
    if (BK.Economy.dayTick(S, day, rng)) { const l = S.level; S.log.push({ day, kind: 'era', ids: [], text: S.name + ' bước sang ' + E.of(l).name + ': ' + E.of(l).tech + '.' }); if (K) K.setEra(S, l); BK.Dramas.onEra(S, rng); S.situChanged = true; }
    if (K) K.dayTick(S, day);
    // ngoại gen (logic/epigen.js): nghịch cảnh hôm nay để lại dấu lên tính cách, yên ổn thì phai dần
    BK.Epigen.dayTick(S, day);
    // cảnh theo sự kiện (logic/scenes.js): người mới mất thì có đám tang
    if (BK.Scenes) BK.Scenes.dayTick(S, day);
    // chỗ hư sau chiến tranh (logic/siege.js): thợ xây sửa lại
    if (BK.Siege) BK.Siege.repairDay(S, day);
    if (S.log.length > 600) S.log.splice(0, S.log.length - 600);
    S.day = saved;
  }

  /* ---------- Tình huống (dùng cho thời tiết thật và cho nút thử) ---------- */
  function trigger(S, kind) {
    const rng = S.rng, day = S.day;
    if (BK.Climate.HAZARDS[S.key] && Object.values(BK.Climate.HAZARDS).flat().concat([BK.Climate.PLAGUE]).some((z) => z.key === kind)) BK.Climate.start(S, kind, 20, 1); // thử một thiên tai (logic/climate.js)
    else if (kind === 'war') { S.situ.war = day + 6; S.log.push({ day: Math.floor(day), kind: 'war', ids: [], text: 'Lệnh chiến tranh được ban ra.' }); }
    else if (kind === 'protest') { if (!BK.Dramas.start(S, 'riot', rng, { stage: 1 })) S.log.push({ day: Math.floor(day), kind: 'drama', ids: [], text: 'Không đủ người nóng tính hưởng ứng, bạo loạn không thành.' }); } // bạo loạn kéo thẳng tới nhà chính
    else if (BK.Dramas.BY_KEY[kind]) BK.Dramas.start(S, kind, rng); // thử một drama (logic/dramas.js)
    else if (kind === 'festival') { S.situ.festival = day + 4; S.log.push({ day: Math.floor(day), kind: 'festival', ids: [], text: 'Làng mở hội.' }); }
    else if (kind === 'quarrel') { const adults = [...S.people.values()].filter((p) => p.alive && P.ageOf(p, day) >= R.ADULT_AGE);
        if (adults.length > 1) { const a = rng.pick(adults); let b = rng.pick(adults); while (b === a) b = rng.pick(adults); S.situ.quarrel = null;
        B.startQuarrel(S, a.id, b.id, rng); } }
    else if (kind === 'calm') { for (const A of [...BK.Dramas.active(S)]) BK.Dramas.end(S, A); for (const e of BK.Climate.active(S, day)) e.until = day;
        S.situ = { drought: 0, war: 0, festival: 0, mourning: 0, quarrel: null, protest: 0 }; S.log.push({ day: Math.floor(day), kind: 'calm', ids: [],
        text: 'Mọi chuyện lắng xuống.' }); }
    else if (kind === 'nextGen') { const d = Math.max(0, S.nextGenDay - S.day); step(S, d + 0.01); return; }
    S.situChanged = true; B.think(S, rng);
  }

  /* ---------- Đọc nhanh cho phần vẽ và bảng ---------- */
  const living = (S) => [...S.people.values()].filter((p) => p.alive);
  function situNow(S) { const X = S.situ, d = S.day; return { war: X.war > d, drought: X.drought > d, festival: X.festival > d, mourning: X.mourning > d, protest: X.protest > d, quarrel: !!(X.quarrel && X.quarrel.until > d) }; }

  return { ISLANDS, create, step, trigger, living, situNow };
});
