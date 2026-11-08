// Bể Kính · test/missiles.test.js · Tên lửa (thời 7), hạt nhân (thời 8) (logic/missiles.js)
const test = require('node:test');
const assert = require('node:assert');
for (const f of ['rng', 'rules', 'genes', 'people', 'family', 'council', 'temper', 'posts', 'jobs', 'eras', 'schedule', 'scenes', 'leader', 'guards', 'tasks', 'dramas', 'economy', 'climate', 'epigen', 'construction', 'homes', 'siege', 'arms', 'missiles', 'ecology', 'brain', 'island', 'diplomacy', 'war', 'battles', 'chronicle', 'prosperity', 'strategy', 'world']) require('../logic/' + f + '.js');
const BK = globalThis.BK, M = BK.Missiles, E = BK.Economy, Siege = BK.Siege, living = BK.Island.living;
const until = (W, cond, max) => { for (let k = 0; k < max && !cond(); k++) { BK.World.tick(W); BK.War.step(W, W.day, W.rng, 1 / 12); if (k % 12 === 11) BK.War.dayTick(W, W.day, W.rng); } return cond(); };
// đặt người đứng đầu đảo S có tính cách tr (hội đồng cũng vậy, để logic/strategy.js mind ra đúng tính này)
const temper = (S, tr) => { for (const k of ['king', 'advisor', 'general1', 'general2']) { const p = S.seats[k] != null && S.people.get(S.seats[k]); if (p) p.traits = Object.assign({}, BK.People.traits(p), tr); } };
const HAWK = { aggression: 0.95, ambition: 0.9, paranoia: 0.8, piety: 0.1, meekness: 0.1, fear: 0.2 }, DOVE = { aggression: 0.1, ambition: 0.2, paranoia: 0.1, piety: 0.9, meekness: 0.9, fear: 0.5 };
function world(seed, lv) { const W = BK.World.create({ seed, war: false }); BK.World.jump(W, 500); for (const S of W.islands) E.devSetLevel(S, lv); return W; }
const fill = (S, k) => { const st = E.state(S); for (const r of E.RES) st.stock[r] = E.CAP(S.level, r) * k; };

test('tên lửa theo kinh tế và tính cách: đảo giàu, người đứng đầu hiếu chiến làm nhiều; đảo nghèo, nhu nhược làm ít; trước thời 7 không có', () => {
  const W = world(3, 7); const [A, B, C] = W.islands;
  temper(A, HAWK); temper(B, DOVE); temper(C, HAWK); fill(A, 1); fill(B, 1); fill(C, 0.12); E.devSetLevel(W.islands[3], 6); fill(W.islands[3], 1);
  // (kiểm thử hành vi: rng "có" khi khả năng làm một quả trong ngày trên 10%, nên kết quả không phụ thuộc may rủi; người hiếu
  // chiến có khả năng đó cao, người nhu nhược thấp)
  const rng = Object.assign(Object.create(W.rng), { chance: (p) => p > 0.1 });
  for (let d = 0; d < 40; d++) { for (const S of [A, B, C]) fill(S, S === C ? 0.12 : 1); M.dayTick(W, W.day + d, rng); }
  const n = (S) => (S.arms ? S.arms.missiles : 0);
  assert.ok(n(A) >= 3, 'giàu, hiếu chiến: ' + n(A));
  assert.ok(M.militancy(HAWK) > M.militancy(DOVE), 'người hiếu chiến muốn tên lửa hơn');
  assert.ok(n(A) > n(B), 'hiếu chiến ' + n(A) + ' > nhu nhược ' + n(B));
  assert.ok(n(A) > n(C), 'giàu ' + n(A) + ' > nghèo ' + n(C));
  assert.strictEqual(n(W.islands[3]), 0, 'thời 6 chưa có tên lửa');
});

test('quân sắp tới thì bắn trước: báo động, dân trốn vào nhà; tên lửa trúng cổng thì cổng yếu đi; có thể bắn trả', () => {
  const W = world(3, 7), A = W.islands[2], B = W.islands[1];
  temper(A, HAWK); A.arms = { missiles: 5, nukes: 0, nukeDone: null, lastNuke: -1e9 }; B.arms = { missiles: 2, nukes: 0, nukeDone: null, lastNuke: -1e9 }; temper(B, HAWK);
  living(A).filter((p) => p.job === 'worker').slice(0, 10).forEach((p) => { p.job = 'soldier'; });
  const w = BK.War.launch(W, W.day, 2, 1, 'conquer', 1, W.rng);
  // (tính cách tính lại mỗi ngày theo ngoại gen, logic/epigen.js: giữ tính người đứng đầu hai bên trong lúc chờ)
  assert.ok(until(W, () => { temper(A, HAWK); temper(B, HAWK); return w.salvo; }, 12 * 30), 'bắn trước khi tới');
  assert.ok(A.arms.missiles < 5 && W.missiles.some((m) => m.to === 1), 'tên lửa đang bay sang');
  assert.ok(B.situ.alarm > W.day, 'báo động');
  BK.World.tick(W);
  const civ = living(B).filter((p) => !p.away && !Siege.isGuard(p) && p.id !== B.seats.king).map((p) => B.minds.get(p.id)).filter(Boolean);
  assert.ok(civ.filter((m) => m.verb === 'hide').length >= civ.length * 0.9, 'dân trốn vào nhà');
  assert.ok(W.missiles.some((m) => m.to === 2), 'đảo bị đánh bắn trả');
  assert.ok(until(W, () => w.stage !== 'march', 12 * 10));
  assert.ok(Siege.hp(B, w.gate) < 1, 'cổng bị tên lửa phá: ' + Siege.hp(B, w.gate));
});

test('hạt nhân: chỉ người đứng đầu dám dùng mới chế tạo; mỗi quả phá một phần tư đảo, nhiễm xạ, cả bể sợ và mất mùa; bốn quả thì san phẳng, buộc sáp nhập', () => {
  const W = world(5, 8), A = W.islands[0], B = W.islands[3], C = W.islands[4];
  temper(A, HAWK); temper(C, DOVE); fill(A, 1); fill(C, 1);
  for (const j of [3, 4]) { W.rel[0][j].fear = 0.9; W.rel[4][j === 4 ? 3 : j].fear = 0.9; }
  for (let d = 0; d < 200; d++) { fill(A, 1); fill(C, 1); M.dayTick(W, W.day + d, W.rng); }
  assert.ok(A.arms.nukes + (A.arms.nukeDone ? 1 : 0) >= 1, 'người hiếu chiến chế tạo hạt nhân');
  assert.ok(!C.arms || !C.arms.nukes, 'người nhu nhược, sùng đạo không làm');
  const pop0 = living(B).length, fear0 = W.rel[2][0].fear;
  M.fire(W, W.day, 0, 3, 'nuke', 'nuke'); until(W, () => (B.nuked || 0) >= 1, 12 * 2);
  assert.ok(living(B).length < pop0, 'người trong vùng nổ chết');
  assert.ok([0, 1, 2, 3, 4].every((s) => Siege.hp(B, 'home:' + s) === 0), 'một phần tư số nhà thành đống đổ');
  assert.ok(M.output(B, 'wood', W.day) < 1, 'nhiễm xạ: sản xuất kém');
  assert.ok(M.output(W.islands[5], 'food', W.day) < 1, 'bụi: cả bể mất mùa');
  assert.ok(W.rel[2][0].fear > fear0, 'đảo khác sợ kẻ dùng hạt nhân');
  for (let k = 0; k < 3; k++) { M.fire(W, W.day, 0, 3, 'nuke', 'nuke'); until(W, () => !W.missiles.some((m) => !m.done), 12 * 2); }
  assert.strictEqual(B.annexedBy, 0, 'bốn quả: san phẳng, buộc sáp nhập');
  assert.strictEqual(Siege.hp(B, 'hall'), 0, 'nhà chính sụp');
});
