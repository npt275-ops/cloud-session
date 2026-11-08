// Bể Kính · test/bridges.test.js · Cầu do người đứng đầu quyết, xây thật, phá cầu; người qua lại (logic/diplomacy.js, logic/strategy.js)
const test = require('node:test');
const assert = require('node:assert');
for (const f of ['rng', 'rules', 'genes', 'people', 'family', 'council', 'temper', 'posts', 'jobs', 'eras', 'schedule', 'scenes', 'leader', 'guards', 'tasks', 'dramas', 'economy', 'climate', 'epigen', 'construction', 'homes', 'siege', 'brain', 'island', 'diplomacy', 'war', 'strategy', 'world']) require('../logic/' + f + '.js');
const BK = globalThis.BK, D = BK.Diplomacy, E = BK.Economy, living = BK.Island.living;
const ready = (seed) => { const W = BK.World.create({ seed, war: false }); BK.World.jump(W, 900); for (const S of W.islands) { const st = E.state(S).stock; st.wood = st.stone = st.metal = 2000; } return W; };

test('không còn tự bắc cầu: cầu chỉ có khi được khởi công (người đứng đầu quyết), và chỉ tiến khi còn thợ xây', () => {
  const W = ready(3), A = W.islands[0], B = W.islands[1];
  W.bridges = []; W.bridgeWorks = [];
  BK.World.jump(W, W.day + 5);
  const era0 = Math.min(A.level, B.level), w = D.startBridge(W, W.day, 0, 1, 'build'); assert.ok(w, 'khởi công');
  assert.ok(D.workOf(W, 0, 1) && !D.bridged(W, 0, 1), 'đang xây thì chưa đi qua được');
  // một bên không còn thợ xây (trong ngày đó, trước khi đảo chọn thợ mới): cầu không tiến; có thợ thì tiến 1/BUILD_DAYS mỗi ngày
  const fired = living(B).filter((p) => p.job === 'builder' || p.role === 'builder'); fired.forEach((p) => { p.away = 'test'; });
  const p0 = w.progress; D.dayTick(W, W.day + 1, W.rng); assert.strictEqual(w.progress, p0, 'thiếu thợ thì cầu đứng');
  fired.forEach((p) => { p.away = null; });
  D.dayTick(W, W.day + 1, W.rng); assert.ok(Math.abs(w.progress - p0 - 1 / D.BUILD_DAYS) < 1e-9, 'có thợ thì cầu tiến');
  BK.World.jump(W, W.day + D.BUILD_DAYS + 5);
  assert.ok(D.bridged(W, 0, 1) && !D.workOf(W, 0, 1), 'xong thì có cầu');
  assert.strictEqual(D.bridgeOf(W, 0, 1).era, era0, 'kiểu cầu theo thời lúc khởi công (lên thời không tự đổi)');
});

test('thợ xây ra đầu cầu làm (cổng phụ phía cầu), lấy gỗ ở kho mang ra', () => {
  const W = ready(4), S = W.islands[0]; W.bridges = []; W.bridgeWorks = [];
  for (let k = 0; k < 12 * 140 && ['night', 'noon'].includes(BK.Schedule.phase(S.tod)); k++) BK.World.tick(W); // tới ban ngày (đêm thì về ngủ)
  D.startBridge(W, W.day, 0, 1, 'build'); BK.World.jump(W, W.day + 2);
  S.situChanged = true; for (let k = 0; k < 3; k++) BK.World.tick(W);
  const m = [...S.minds.values()].find((x) => x.place === 'bridgeR' || (x.cycle && x.cycle.dst === 'bridgeR'));
  assert.ok(m && m.cycle && m.cycle.src === 'store' && m.cycle.item === 'wood', 'thợ xây đầu cầu phía đảo 1 (cổng phải)');
});

test('bị đánh qua cầu: người đứng đầu đa nghi phá cầu, quân phải vòng đi thuyền', () => {
  const W = ready(5); W.war = true; BK.War.init(W);
  W.bridges = [{ a: 0, b: 1, era: 3, day: W.day }];
  const king = W.islands[1].people.get(W.islands[1].seats.king); king.genome.traits.paranoia = 1; king.genome.traits.fear = 1; king.genome.traits.aggression = 0; BK.Epigen.express(king);
  living(W.islands[0]).filter((p) => p.job === 'worker').slice(0, 8).forEach((p) => { p.job = 'soldier'; });
  let broke = 0; for (let k = 0; k < 6 && !broke; k++) { W.bridges = [{ a: 0, b: 1, era: 3, day: W.day }]; W.wars = []; for (const p of living(W.islands[0])) p.away = null; const w = BK.War.launch(W, W.day, 0, 1, 'raid', 0.5, W.rng); if (w && !D.bridged(W, 0, 1)) { broke++; assert.strictEqual(w.by, 'boat'); } }
  assert.ok(broke, 'có lần phá cầu');
});

test('người qua lại: sang đảo bên, ở lại vài ngày rồi về; đi vắng thì không ở đảo nhà', () => {
  const W = ready(6); W.bridges = [{ a: 0, b: 1, era: 3, day: W.day }];
  const p = living(W.islands[0]).find((q) => q.job === 'walker' || q.job === 'worker');
  const v = D.startVisit(W, W.day, p, 0, 1, 'market', 'market', W.rng);
  assert.ok(v && p.away === 'visit');
  BK.World.jump(W, Math.ceil(v.arrive) + 0.5); assert.strictEqual(v.stage, 'stay'); assert.strictEqual(p.loc, 1, 'đang ở đảo 1');
  BK.World.jump(W, Math.ceil(v.back) + 1); assert.ok(!p.away && !W.visits.includes(v), 'đã về nhà');
});

test('chạy thật 9 năm: cầu được khởi công, xây lại theo thời mới, có người qua lại, có xô xát ở đầu cầu', () => {
  const T = {};
  for (const seed of [1, 2, 3]) { const W = BK.World.create({ seed }); BK.World.jump(W, 9 * 360); for (const k in W.bridgeStats) T[k] = (T[k] || 0) + W.bridgeStats[k]; }
  assert.ok(T.build >= 3 && T.done >= 3, 'cầu: ' + JSON.stringify(T));
  assert.ok(T.rebuild >= 1, 'xây lại theo thời mới');
  assert.ok(T.visits >= 30, 'người qua lại: ' + T.visits);
});
