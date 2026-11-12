// Bể Kính · test/ecology.test.js · Hệ sinh thái hỗn loạn (logic/ecology.js): môi trường, chạy nạn, lấy vợ chồng khác đảo,
// dịch lây và đóng cầu, đảo chính, cấm vận, chuyền nước chữa cháy, bàn giao ca
const test = require('node:test');
const assert = require('node:assert');
for (const f of [
  'rng',
  'rules',
  'genes',
  'people',
  'family',
  'council',
  'temper',
  'posts',
  'jobs',
  'eras',
  'schedule',
  'scenes',
  'leader',
  'guards',
  'tasks',
  'dramas',
  'economy',
  'climate',
  'epigen',
  'construction',
  'homes',
  'siege',
  'arms',
  'missiles',
  'ecology',
  'brain',
  'island',
  'diplomacy',
  'war',
  'battles',
  'chronicle',
  'prosperity',
  'strategy',
  'powers',
  'goals',
  'world',
])
  require('../logic/' + f + '.js');
const BK = globalThis.BK,
  Eco = BK.Ecology,
  E = BK.Economy,
  D = BK.Diplomacy,
  living = BK.Island.living;
const temper = (S, tr) => {
  for (const k of ['king', 'advisor', 'general1', 'general2']) {
    const p = S.seats[k] != null && S.people.get(S.seats[k]);
    if (p) p.traits = Object.assign({}, BK.People.traits(p), tr);
  }
};
const world = (seed, war) => {
  const W = BK.World.create({ seed, war: !!war });
  BK.World.jump(W, 500);
  return W;
};

test('môi trường: đốn gỗ nhiều thì rừng thưa, sản lượng gỗ giảm; người giữ đất cho đời sau thì hao chậm hơn', () => {
  const run = (keep) => {
    const W = world(4),
      S = W.islands[0];
    for (let d = 0; d < 40; d++) {
      temper(S, keep ? { intellect: 0.9, ambition: 0.2 } : { intellect: 0.3, ambition: 0.9 });
      for (const p of living(S)) if (p.job === 'worker') p.res = 'wood';
      Eco.dayTick(W, W.day + d, W.rng);
    }
    return S;
  };
  const fast = run(false),
    slow = run(true);
  assert.ok(fast.env.forest < 0.8, 'rừng thưa: ' + fast.env.forest.toFixed(2));
  assert.ok(Eco.output(fast, 'wood') < 0.95, 'ít gỗ hơn');
  assert.ok(
    slow.conserve && slow.env.forest > fast.env.forest,
    'giữ đất: ' + slow.env.forest.toFixed(2) + ' > ' + fast.env.forest.toFixed(2),
  );
});

test('chạy nạn: đói kéo dài thì cả hộ mang bọc sang đảo khác và ở lại; người đứng đầu đa nghi có thể đóng cửa', () => {
  const W = world(3, true),
    S = W.islands[1],
    st = E.state(S);
  for (const T of W.islands) temper(T, { paranoia: 0.2 });
  let v = null;
  for (let d = 0; d < 400 && !v; d++) {
    st.stock.food = 0;
    st.hunger = 1;
    S.hungerDays = 20;
    Eco.dayTick(W, W.day, W.rng);
    v = W.visits.find((x) => x.kind === 'refugee' && x.from === 1);
  }
  assert.ok(v && v.members.length >= 1, 'có hộ chạy nạn');
  const T = W.islands[v.to],
    pop = living(T).length,
    n = v.members.length,
    kin0 = living(T).filter((q) => q.kin === 1).length;
  assert.ok(
    v.members.every((id) => S.people.get(id).away === 'refugee'),
    'đang đi, không ở đảo cũ',
  );
  for (let k = 0; k < 12 * 15 && W.visits.includes(v); k++) BK.World.tick(W);
  // (đếm người gốc đảo cũ ở đảo kia: trong 15 ngày đảo kia có thể có người sinh, người mất vì chuyện khác)
  assert.strictEqual(living(T).filter((q) => q.kin === 1).length, kin0 + n, 'tới nơi, ở lại đảo kia');
  assert.ok(
    v.members.every((id) => !S.people.get(id).alive && S.people.get(id).left === v.to),
    'rời đảo cũ (không tính là chết)',
  );
  // đảo nhận đa nghi, không tin: đóng cửa
  const W2 = world(3, true),
    S2 = W2.islands[1];
  for (const T2 of W2.islands) temper(T2, { paranoia: 0.9 });
  for (let j = 0; j < 6; j++) W2.rel[j][1].trust = 0;
  for (let d = 0; d < 300 && !W2.ecoStats.refused; d++) {
    E.state(S2).hunger = 1;
    S2.hungerDays = 20;
    for (const T2 of W2.islands) temper(T2, { paranoia: 0.9 });
    Eco.dayTick(W2, W2.day, W2.rng);
  }
  assert.ok(W2.ecoStats.refused >= 1, 'bị đóng cửa');
});

test('lấy vợ chồng khác đảo: người sang đảo bên ở lại, có vợ chồng bên đó, hai đảo thành họ hàng', () => {
  const W = world(5),
    A = W.islands[0],
    B = W.islands[1];
  const p = living(A).find((q) => q.spouse == null && !q.role && BK.People.ageOf(q, W.day) >= 18 && BK.People.ageOf(q, W.day) <= 40);
  const mate = living(B).find(
    (q) => q.sex !== p.sex && q.spouse == null && !q.role && BK.People.ageOf(q, W.day) >= 18 && BK.People.ageOf(q, W.day) <= 40,
  );
  const g = Eco.settle(W, W.day, 0, 1, [p.id], 'cưới', mate)[0];
  assert.ok(g && B.people.get(g.id) === g && g.spouse === mate.id && mate.spouse === g.id, 'thành vợ chồng ở đảo kia');
  assert.ok(!p.alive && p.left === 1);
});

test('dịch lây theo khách qua lại; đảo kề bên có người đứng đầu đa nghi đóng cầu; người ốm nằm nhà', () => {
  const W = world(6),
    A = W.islands[0];
  BK.Climate.start(A, 'plague', 30, 1);
  // khách của đảo 0 đang ở đảo 1
  const p = living(A).find((q) => !q.role && !q.away && q.job === 'walker') || living(A).find((q) => !q.role && !q.away);
  // sứ giả: không cưới xin ở lại đảo kia (logic/ecology.js marryDay), để bài chỉ kiểm việc lây theo người qua lại
  const v = D.startVisit(W, W.day, p, 0, 1, 'envoy', 'hall', W.rng);
  v.stage = 'stay';
  v.leave = W.day + 50;
  v.back = W.day + 52;
  let hit = false;
  for (let d = 0; d < 60 && !hit; d++) {
    Eco.dayTick(W, W.day, W.rng);
    hit = !!BK.Climate.active(W.islands[1], W.day).find((e) => e.key === 'plague');
  }
  assert.ok(hit, 'dịch lây sang đảo 1');
  assert.ok(A.sick && A.sick.length > 0, 'có người ốm');
  for (let k = 0; k < 100 && BK.Schedule.phase(A.tod) !== 'morning'; k++) A.tod = k / 100; // ban ngày (đêm thì ai cũng ngủ)
  A.situChanged = true;
  BK.Brain.think(A, W.rng);
  const m = A.minds.get(A.sick[0]);
  assert.ok(m && m.verb === 'sick' && m.place === 'home', 'người ốm nằm nhà');
  // đóng cầu: đảo có cầu sang đảo đang có dịch
  const W2 = world(6),
    j = [1, 5].find((x) => D.bridged(W2, 0, x));
  if (j != null) {
    BK.Climate.start(W2.islands[0], 'plague', 40, 1);
    for (let d = 0; d < 40 && !W2.islands[j].closed; d++) {
      temper(W2.islands[j], { paranoia: 0.9 });
      Eco.dayTick(W2, W2.day, W2.rng);
    }
    assert.ok(W2.islands[j].closed, 'đóng cầu');
    assert.ok(Eco.blocked(W2, 0, j, W2.day), 'không qua lại được');
  }
});

test('đảo chính: dân bất bình lâu, tướng tham vọng dẫn lính vây nhà chính rồi lên thay; người cũ quỳ', () => {
  const W = world(7),
    S = W.islands[2],
    gid = S.seats.general1 != null ? S.seats.general1 : S.seats.general2,
    old = S.seats.king;
  let C = null;
  for (let d = 0; d < 400 && !C; d++) {
    S.discontent = 0.9;
    const g = S.people.get(gid);
    g.traits = Object.assign({}, BK.People.traits(g), { ambition: 0.95, aggression: 0.9 });
    Eco.dayTick(W, W.day, W.rng);
    C = S.situ.coup;
  }
  assert.ok(C && C.by === gid, 'có đảo chính');
  BK.Brain.think(S, W.rng);
  S.situChanged = true;
  BK.Brain.think(S, W.rng);
  const sol = living(S)
    .filter((p) => p.job === 'soldier' && !p.away)
    .map((p) => S.minds.get(p.id));
  assert.ok(sol.length && sol.every((m) => m.state === 'attack' && m.place === 'hall'), 'lính vây nhà chính');
  Eco.dayTick(W, C.until + 0.01, W.rng);
  assert.strictEqual(S.seats.king, gid, 'tướng lên làm người đứng đầu');
  assert.ok(S.situ.kneel && S.situ.kneel.id === old, 'người cũ quỳ');
});

test('cấm vận: ba đảo mất tin và thù một đảo thì không ai buôn bán với đảo đó', () => {
  const W = world(8);
  for (let j = 1; j < 6; j++) {
    W.rel[j][0].trust = 0;
    W.rel[j][0].grudge = 0.9;
  }
  Eco.dayTick(W, W.day, W.rng);
  assert.ok(W.embargo[0] > W.day, 'bị cấm vận');
  assert.ok(Eco.blocked(W, 0, 3, W.day) && Eco.blocked(W, 2, 0, W.day), 'không buôn với ai');
});

test('cháy rừng: người lớn khoẻ xếp hàng chuyền nước; sáng ra lính gác đêm bàn giao ca', () => {
  const W = world(2),
    S = W.islands[1];
  for (let k = 0; k < 100 && BK.Schedule.phase(S.tod) !== 'morning'; k++) S.tod = k / 100;
  BK.Climate.start(S, 'wildfire', 5, 1);
  S.situChanged = true;
  BK.Brain.think(S, W.rng);
  const line = [...S.minds.values()].filter((m) => m.verb === 'bucket');
  assert.ok(line.length >= 6, 'hàng chuyền nước ' + line.length);
  assert.deepStrictEqual(
    line.map((m) => m.rank).sort((a, b) => a - b),
    line.map((_, k) => k),
    'mỗi người một chỗ trong hàng',
  );
  // bàn giao ca
  // (lính gác đêm: lính mang mã chẵn, logic/tasks.js)
  const S2 = W.islands.find((T) => living(T).some((p) => p.job === 'soldier' && p.id % 2 === 0 && !p.away)),
    sol = living(S2).find((p) => p.job === 'soldier' && p.id % 2 === 0 && !p.away);
  sol.lastPh = 'night';
  for (let k = 0; k < 100 && BK.Schedule.phase(S2.tod) !== 'morning'; k++) S2.tod = k / 100;
  const ctx = (state, o) => Object.assign({ state }, o);
  const x = BK.Tasks.pick(S2, sol, W.rng, ctx, () => null);
  assert.ok(x.verb === 'report' && x.target != null, 'bàn giao ca: ' + JSON.stringify([x.verb, x.reason]));
});
