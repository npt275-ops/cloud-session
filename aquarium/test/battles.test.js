// Bể Kính · test/battles.test.js · Bước 8: vũ khí theo thời (logic/arms.js), kịch bản chiến tranh (logic/battles.js),
// thịnh vượng và suy tàn (logic/prosperity.js), biên niên và nhịp kịch tính (logic/chronicle.js)
const test = require('node:test');
const assert = require('node:assert');
for (const f of ['rng', 'rules', 'genes', 'people', 'family', 'council', 'temper', 'posts', 'jobs', 'eras', 'schedule', 'scenes', 'leader', 'guards', 'tasks',
    'dramas', 'economy', 'climate', 'epigen', 'construction', 'homes', 'siege', 'arms', 'missiles', 'ecology', 'brain', 'island', 'diplomacy', 'war',
    'battles', 'chronicle', 'prosperity', 'strategy', 'powers', 'goals', 'world']) require('../logic/' + f + '.js');
const BK = globalThis.BK, E = BK.Economy, Arms = BK.Arms, Siege = BK.Siege, living = BK.Island.living;
const H = require('./helpers.js'); // (bước 12: quân chỉ đi qua cầu; H.launch bắc cầu dọc đường trước)
const temper = (S, tr) => { for (const k of ['king', 'advisor', 'general1', 'general2']) { const p = S.seats[k] != null && S.people.get(S.seats[k]); if (p) p.traits = Object.assign({}, BK.People.traits(p), tr); } };
const fill = (S, k) => { const st = E.state(S); for (const r of E.RES) st.stock[r] = E.CAP(S.level, r) * k; };
function world(seed, lv) { const W = BK.World.create({ seed, war: false }); BK.World.jump(W, 500); if (lv) for (const S of W.islands) E.devSetLevel(S, lv); return W; }
const soldiers = (S, n) => living(S).filter((p) => p.job === 'worker').slice(0, n).forEach((p) => { p.job = 'soldier'; });
const tick = (W, n) => { for (let k = 0; k < n; k++) { BK.World.tick(W); BK.War.step(W, W.day, W.rng, 1 / 12); if (k % 12 === 11) BK.War.dayTick(W, W.day, W.rng); } };

test('vũ khí theo thời: thời đồ đá chỉ có ná; thời trung đại có nỏ, máy bắn đá (tốn gỗ); đảo nghèo không có máy', () => {
  assert.strictEqual(Arms.kit(1).ranged, 'sling'); assert.strictEqual(Arms.kit(1).engine, null);
  assert.strictEqual(Arms.kit(3).engine, 'catapult'); assert.strictEqual(Arms.kit(4).ranged, 'musket'); assert.ok(Arms.kit(11).portal && Arms.kit(12).shield);
  const W = world(3, 3), A = W.islands[2]; soldiers(A, 12); fill(A, 1);
  // (bước 10: xe, máy công thành chỉ đi qua cầu: cho đoàn quân đi qua cầu rồi trang bị lại)
  const wood0 = E.state(A).stock.wood, w = H.launch(W, W.day, 2, 1, 'conquer', 1, W.rng); w.by = 'bridge'; Arms.equip(W, w);
  assert.ok(w.engines.length >= 1 && w.engines.every((e) => e.kind === 'catapult'), 'có máy bắn đá: ' + w.engines.length);
  assert.ok(E.state(A).stock.wood < wood0, 'tốn gỗ');
  // chỉ đánh bằng vũ khí bắn xa (mục 8): cả đoàn quân đều bắn xa
  assert.ok(w.troops.every((x) => x.arm === 'ranged'), 'cả đoàn quân bắn xa');
  const W2 = world(3, 3), A2 = W2.islands[2]; soldiers(A2, 12); fill(A2, 0); const w2 = H.launch(W2, W2.day, 2, 1, 'conquer', 1, W2.rng);
  assert.strictEqual(w2.engines.length, 0, 'kho trống: không có máy');
});

test('ở cổng: máy công thành phá cổng, tên lửa đốt làm cháy nhà; cổng dịch chuyển (thời 11) mở cổng từ bên trong', () => {
  const W = world(5, 4), A = W.islands[2], B = W.islands[1]; soldiers(A, 14); fill(A, 1);
  const w = H.launch(W, W.day, 2, 1, 'conquer', 1, W.rng); w.by = 'bridge'; Arms.equip(W, w); w.stage = 'gate'; w.since = W.day; w.gate = 'gate'; w.sg = B.situ.siege = { war: w.id, from: 2, stage: 'gate', gate: 'gate', def: [], foes: [] };
  const def = Siege.gateGuards(B, 'gate').map((p) => ({ i: 1, p }));
  for (let k = 0; k < 24; k++) Arms.gateTick(W, W.day + k / 12, w, def, 1 / 12, W.rng, (x) => { x.p.alive = false; });
  assert.ok(Siege.hp(B, 'gate') < 1, 'cổng bị đại bác phá: ' + Siege.hp(B, 'gate'));
  assert.ok(w.armLog.volleys > 0, 'có bắn xa');
  const W3 = world(5, 11), A3 = W3.islands[2], B3 = W3.islands[1]; soldiers(A3, 14);
  const w3 = H.launch(W3, W3.day, 2, 1, 'conquer', 1, W3.rng); w3.stage = 'gate'; w3.since = W3.day - 1.1; w3.gate = 'gate';
  Arms.gateTick(W3, W3.day, w3, [], 1 / 12, W3.rng, () => {});
  assert.ok(w3.portal && Siege.hp(B3, 'gate') === 0, 'cổng dịch chuyển mở cổng');
});

test('kịch bản: vây thành làm đảo bị vây gần như không làm ra lương thực (bước 12 bỏ hải chiến: quân chỉ đi qua cầu)', () => {
  // vây thành: lương thực đảo bị vây gần như không làm ra
  const W = world(7, 5), S = W.islands[1], st = E.state(S); BK.World.jump(W, W.day + 2);
  const made0 = st.made.food; S.situ.blockade = W.day + 10; BK.World.jump(W, W.day + 1);
  assert.ok(st.made.food < made0 * 0.6, 'bị vây: ' + st.made.food.toFixed(0) + ' < ' + made0.toFixed(0));
});

test('tù binh bị bắt khi bên đánh thua ở cổng, được chuộc về; quân thắng về thì diễu hành, dân ra mừng', () => {
  const W = world(3, 3), A = W.islands[2], B = W.islands[1]; soldiers(A, 6);
  const w = H.launch(W, W.day, 2, 1, 'raid', 1, W.rng); w.stage = 'gate'; w.since = W.day; w.gate = 'gate'; w.n0 = 10;
  BK.Battles.onRepelled(W, W.day, w, W.rng);
  assert.ok(B.prisoners && B.prisoners.length >= 1, 'có tù binh');
  const q = B.prisoners[0], p = A.people.get(q.pid); assert.strictEqual(p.away, 'prisoner');
  E.state(A).stock.food = 5000; for (let d = 0; d < 400 && B.prisoners.length; d++) BK.Battles.dayTick(W, W.day + d, W.rng);
  assert.ok(!B.prisoners.some((x) => x.pid === q.pid), 'được chuộc về hay ở lại làm dân');
  // khải hoàn (thế giới khác: lính đảo này vừa đi đột kích hết)
  { const W = world(3, 3), A = W.islands[2];
  const ids = living(A).filter((x) => !x.away && x.job === 'soldier').slice(0, 3);
  BK.Battles.onHome(W, W.day, { id: 999, a: 2, b: 1, won: true, n0: 3, troops: ids.map((x) => ({ i: 2, p: x })) });
  for (let k = 0; k < 100 && BK.Schedule.phase(A.tod) !== 'morning'; k++) A.tod = k / 100;
  A.situ.festival = 0; A.situChanged = true; BK.Brain.think(A, W.rng);
  assert.ok(ids.every((x) => A.minds.get(x.id).verb === 'parade'), 'quân diễu hành');
  { const c = {}; for (const m of A.minds.values()) c[m.verb || m.state] = (c[m.verb || m.state] || 0) + 1; assert.ok([...A.minds.values()].some((m) => m.verb === 'celebrate'), 'dân ra mừng: ' + JSON.stringify(c)); } }
});

test('thịnh vượng: đảo đủ ăn, kho đầy, yên ổn lâu thì vào thời hoàng kim, làm ra thêm, dựng kỳ quan; dân giảm mạnh thì suy tàn', () => {
  const W = world(9, 5), S = W.islands[0];
  S.fedDays = 200; S.lastWar = -1e9; S.discontent = 0; BK.Prosperity.init(W);
  for (let d = 0; d < 3; d++) { fill(S, 0.9); BK.Prosperity.dayTick(W, W.day + d, W.rng); }
  assert.ok(S.golden, 'thời hoàng kim'); assert.ok(BK.Prosperity.output(S) > 1);
  assert.ok(S.wonder, 'khởi công kỳ quan');
  for (let d = 3; d < 260 && S.wonder; d++) { fill(S, 0.9); S.fedDays = 300; BK.Prosperity.dayTick(W, W.day + d, W.rng); }
  assert.ok(S.wonders.length >= 1, 'dựng xong kỳ quan');
  // suy tàn
  const T = W.islands[1]; T.peakPop = 100; BK.Prosperity.dayTick(W, W.day + 300, W.rng);
  assert.ok(T.decline || BK.Island.living(T).length >= 70, 'dân giảm dưới 70% lúc đông nhất thì suy tàn');
});

test('biên niên: chuyện lớn được ghi; cả bể yên quá lâu thì người đứng đầu tham vọng thấy bị sỉ nhục, muốn đánh hơn', () => {
  const W = BK.World.create({ seed: 11 }); BK.World.jump(W, 360 * 4);
  assert.ok(W.chronicle.length >= 5, 'có biên niên: ' + W.chronicle.length);
  assert.ok(BK.Chronicle.byYear(W, 3).length >= 2, 'nhiều năm có chuyện');
  W.chronicle = []; W.lastPush = 0; const before = W.pushes;
  BK.Chronicle.dayTick(W, W.day + 1, W.rng);
  assert.ok(W.pushes > before, 'đẩy một nguyên nhân thật');
  assert.ok(W.islands.some((S) => S.policy && S.policy.provoked > W.day), 'có người đứng đầu bị khiêu khích');
});

test('máu: trúng đạn mất máu, hết máu thì ngã; cổng hết máu thì vỡ; nhà chính hết máu thì mất thành; rút về thì hồi máu', () => {
  const W = world(4, 5), A = W.islands[2], B = W.islands[1]; soldiers(A, 30); fill(A, 1);
  const w = H.launch(W, W.day, 2, 1, 'conquer', 1, W.rng); w.stage = 'gate'; w.since = W.day; w.gate = 'gate'; w.navalChecked = true; w.duelChecked = true;
  let hurtSeen = 0, k = 0;
  for (; k < 12 * 30 && w.stage === 'gate'; k++) { tick(W, 1); hurtSeen = Math.max(hurtSeen, [...B.people.values(), ...A.people.values()].filter((p) => p.alive && p.hp != null && p.hp < 100).length); }
  assert.ok(hurtSeen > 0, 'có người bị thương mà chưa ngã');
  if (w.stage === 'inside') assert.ok(Siege.hp(B, 'gate') <= 0, 'cổng vỡ khi hết máu: ' + Siege.hp(B, 'gate'));
  // nhà chính hết máu thì mất thành
  const W2 = world(6, 5), A2 = W2.islands[2], B2 = W2.islands[1]; soldiers(A2, 30);
  const w2 = H.launch(W2, W2.day, 2, 1, 'conquer', 1, W2.rng); w2.stage = 'inside'; w2.siege = 'hall'; w2.since = W2.day; w2.gate = 'gate'; w2.team = []; w2.team0 = 1; w2.sg = B2.situ.siege = { war: w2.id, from: 2, stage: 'hall', gate: 'gate', def: [], foes: [] };
  Siege.hit(B2, 'hall', 0.99); const keep = BK.Siege.hallTeam(B2, W2.day); w2.team = keep.map((p) => p.id); w2.team0 = Math.max(1, keep.length);
  for (let n = 0; n < 12 * 3 && B2.annexedBy == null && W2.wars.includes(w2); n++) tick(W2, 1);
  assert.ok(B2.annexedBy === 2 || !W2.wars.includes(w2), 'trận nhà chính kết thúc');
  // hồi máu
  const q = BK.Island.living(A)[0]; q.hp = 40; q.hurtAt = W.day - 2; BK.War.dayTick(W, W.day, W.rng); assert.ok(q.hp == null || q.hp > 40, 'hồi máu');
});

test('xe, máy công thành đi qua cầu theo quân; cầu bị phá giữa đường thì máy kẹt lại', () => {
  const W = world(3, 5), A = W.islands[2]; soldiers(A, 14); fill(A, 1);
  const w = H.launch(W, W.day, 2, 1, 'conquer', 1, W.rng);
  assert.strictEqual(w.by, 'bridge'); assert.ok(w.engines.length >= 1, 'qua cầu: có máy');
  Arms.strand(w); assert.strictEqual(w.engines.length, 0, 'cầu bị phá: máy kẹt lại');
});

test('phát trúng ghi lại cho phần vẽ (ai bắn ai, trên đảo nào); đổi chặng gặp dân binh trên đường thì đánh, không đi qua', () => {
  const W = world(4, 5), A = W.islands[2], B = W.islands[1]; soldiers(A, 30); fill(A, 1);
  const w = H.launch(W, W.day, 2, 1, 'conquer', 1, W.rng); w.stage = 'gate'; w.since = W.day; w.gate = 'gate'; w.navalChecked = true; w.duelChecked = true;
  for (let k = 0; k < 12 * 3 && !(W.hitLog && W.hitLog.length); k++) tick(W, 1);
  assert.ok(W.hitLog && W.hitLog.length, 'có phát trúng được ghi');
  const h = W.hitLog[0]; assert.strictEqual(h.isle, 1); assert.ok(h.by != null && h.byI != null, 'biết người bắn');
  // đổi chặng: quân đang chạy tới nhà chính, dân binh còn đông trên đường thì chưa tới được nhà chính
  const W2 = world(6, 5), A2 = W2.islands[2], B2 = W2.islands[1]; soldiers(A2, 20);
  const w2 = H.launch(W2, W2.day, 2, 1, 'conquer', 1, W2.rng); w2.stage = 'inside'; w2.siege = 'move'; w2.since = W2.day; w2.moveUntil = W2.day; w2.gate = 'gate';
  w2.sg = B2.situ.siege = { war: w2.id, from: 2, stage: 'outer', gate: 'gate', def: [], foes: [] };
  const militia = Siege.gateGuards(B2, 'gate').length + living(B2).filter((p) => p.job === 'soldier' && !p.away).length;
  assert.ok(militia > 1, 'có dân binh, lính trên đường: ' + militia);
  BK.War.step(W2, W2.day + 0.01, W2.rng, 1 / 12);
  assert.strictEqual(w2.siege, 'move', 'chưa tới nhà chính khi còn dân binh');
});

// ---------- Bước 11e (design/ke-hoach-khac-phuc.md mục 5.1): kịch bản hiếm có nguyên nhân ghi trong tin ----------
test('nội gián có lý do (nợ ân đảo kia); phục kích ở đầu cầu của đảo rừng; cứu viện tới lúc nhà chính bị vây', () => {
  const yes = { chance: () => true, next: () => 0.5, range: (a, b) => (a + b) / 2, int: (a) => a }, no = Object.assign({}, yes, { chance: () => false });
  // nội gián: một người Thông Xanh từng sang chợ Đá Mây được tiếp đãi
  { const W = world(3), B = W.islands[1]; temper(W.islands[2], { cunning: 0.8 });
    const tr = living(B).find((p) => !p.role && p.job !== 'soldier' && BK.People.ageOf(p, W.day) >= 18); tr.owes = { 2: W.day - 10 };
    const w = { a: 2, b: 1, gate: 'gateR', by: 'bridge', surprise: true, troops: [], n0: 0, morale: 1, helpers: [] };
    const fall = Object.assign(() => false, { chance: (k) => k });
    // (rng chỉ nhận lần bốc thăm nội gián; phục kích không xét vì đánh úp)
    BK.Battles.onArrive(W, W.day, w, { chance: (p) => p > 0, next: () => 0.5, range: (a, b) => a, int: (a) => a }, fall);
    assert.ok(w.forceGate && w.traitor != null, 'có người mở cổng');
    assert.ok(W.log.some((e) => /\(nợ ân Đá Mây\) lén mở cổng/.test(e.text)), 'tin ghi rõ lý do'); }
  // phục kích: Thông Xanh (đảo rừng) phục quân trong rừng sát bãi đổ bộ
  { const W = world(3), A = W.islands[2]; soldiers(A, 10);
    const troops = living(A).filter((p) => p.job === 'soldier').map((p) => ({ i: 2, p }));
    const w = { a: 2, b: 1, gate: 'gateR', by: 'bridge', surprise: false, troops, n0: troops.length, morale: 1, helpers: [] };
    const fall = Object.assign((x) => { x.p.alive = false; return true; }, { chance: (k) => k });
    BK.Battles.onArrive(W, W.day, w, yes, fall);
    assert.ok(w.ambush > 0, 'có người ngã vì phục kích');
    assert.ok(W.log.some((e) => /phục kích quân Đá Mây trong rừng sát đầu cầu/.test(e.text)), 'tin ghi chỗ phục kích'); }
  // cứu viện: nhà chính bị vây, đảo tin cậy gửi quân gấp, tới thì vào đánh cùng đội giữ nhà chính
  { const W = world(3), B = W.islands[1]; W.rel[4][1].trust = 0.9; soldiers(W.islands[4], 12);
    H.road(W, 4, 1); const w = H.launch(W, W.day, 2, 1, 'conquer', 1, no); assert.ok(w, 'có trận'); // (Cửa Sóng cần đường cầu sang Thông Xanh)
    w.stage = 'inside'; w.siege = 'move'; w.moveUntil = W.day; w.since = W.day - 5; w.sg = w.sg || { targets: [], at: 0, hit: [] };
    for (const p of living(B)) if (p.job === 'soldier' || /guard|keeper/.test(p.job || '')) p.away = 'test';
    BK.War.step(W, W.day, yes, 1 / 12);
    const h = w.helpers.find((x) => x.c === 4);
    assert.ok(h && h.troops.length >= 1, 'Cửa Sóng gửi gấp quân sang');
    h.arrive = W.day; BK.War.step(W, W.day + 0.05, yes, 1 / 12);
    assert.ok(W.log.some((e) => /tới cứu viện Thông Xanh đúng lúc nhà chính sắp mất/.test(e.text)), 'cứu viện phút chót ở nhà chính'); }
});
