// Bể Kính · test/war.test.js · Chiến tranh, sáp nhập, nổi dậy (logic/war.js, quyết định ở logic/strategy.js)
const test = require('node:test');
const assert = require('node:assert');
for (const f of ['rng', 'rules', 'genes', 'people', 'family', 'council', 'temper', 'posts', 'jobs', 'eras', 'schedule', 'scenes', 'leader', 'guards', 'tasks',
    'dramas', 'economy', 'climate', 'epigen', 'construction', 'homes', 'siege', 'arms', 'missiles', 'ecology', 'brain', 'island', 'diplomacy', 'war',
    'battles', 'chronicle', 'prosperity', 'strategy', 'powers', 'goals', 'world']) require('../logic/' + f + '.js');
const BK = globalThis.BK, E = BK.Economy, War = BK.War, living = BK.Island.living;
const starved = (W) => W.islands.reduce((a, S) => a + [...S.people.values()].filter((p) => p.cause === 'đói').length, 0);

// một trận dựng sẵn: tới ngày 500, đảo b mất hết người giữ cổng (đi vắng), đảo a đem quân sang
// a == null: đảo có nhiều quân nhất đi đánh
function setup(seed, a, b, kind) {
  const W = BK.World.create({ seed, war: false }); BK.World.jump(W, 500);
  if (a == null) a = [0, 1, 2, 3, 4, 5].filter((i) => i !== b).sort((x, y) => War.musterable(W, y, W.day).length - War.musterable(W, x, W.day).length)[0];
  for (const p of living(W.islands[b])) if (p.job === 'soldier' || p.job === 'sideguard' || p.job === 'gatekeeper' || /general/.test(p.role || '')) p.away = 'test';
  // tổng tấn công: bên đánh có đạo quân đủ mạnh (thêm 10 người làm lính) để kết quả không phụ thuộc may rủi
  // (bước 9: cổng chỉ vỡ khi hết máu, quân đánh cần mạnh hơn hẳn người giữ nên thêm 20 người)
  if (kind === 'conquer') living(W.islands[a]).filter((p) => p.job === 'worker').slice(0, 20).forEach((p) => { p.job = 'soldier'; });
  const w = War.launch(W, W.day, a, b, kind, 1, W.rng);
  return { W, w, a };
}
// chạy tiếp days ngày: trận đánh theo từng giờ (War.step), việc đảo bị sáp nhập theo ngày (War.dayTick)
const run = (W, days) => { for (let k = 0; k < days; k++) { BK.World.jump(W, W.day + 1); for (let h = 1; h <= 12; h++) War.step(W, W.day - 1 + h / 12, W.rng, 1 / 12); War.dayTick(W, W.day, W.rng); } };

test('đi đánh là người thật rời đảo: không làm ở nhà, đi mất số ngày đường', () => {
  const { W, w } = setup(3, 2, 1, 'conquer');
  assert.ok(w && w.troops.length >= 2, 'có quân');
  assert.strictEqual(w.arrive - w.depart, BK.Diplomacy.travelDays(W, 2, 1));
  assert.ok(w.troops.every((x) => x.p.away === w.id), 'quân đánh dấu đi vắng');
  BK.World.jump(W, W.day + 1);
  assert.ok(w.troops.every((x) => x.p.job === 'soldier' || x.p.job === 'worker' || x.p.job === 'walker' || x.p.role), 'việc giữ nguyên khi đi vắng');
});

test('chiếm nhà chính thì sáp nhập: kho sang đảo thắng, người cai quản từ đảo thắng, giữ thời của mình, có quân đóng giữ', () => {
  // (kiểm thử hành vi: đặt thẳng trận vào lúc mất nhà chính, không phụ thuộc may rủi của trận đánh)
  const { W, w } = setup(3, 2, 1, 'conquer'), A = W.islands[2], B = W.islands[1];
  w.stage = 'inside'; w.siege = 'hall'; w.since = W.day; w.gate = 'gate';
  E.state(B).stock.wood = 300; const wood0 = E.state(A).stock.wood, pop = living(B).length, lv0 = B.level;
  War.annex(W, W.day, 2, 1, w); run(W, 2);
  assert.strictEqual(B.annexedBy, 2, 'Thông Xanh thuộc về Đá Mây');
  assert.ok(E.state(A).stock.wood > wood0, 'gỗ chuyển sang đảo thắng');
  const gov = B.people.get(B.seats.king);
  assert.ok(gov && gov.governor === 2 && gov.alive, 'người cai quản từ Đá Mây ngồi ghế vua');
  assert.strictEqual(B.level, lv0, 'giữ thời của mình (không nhảy theo đảo thắng)');
  assert.ok(living(B).length >= pop * 0.7, 'dân vẫn sống trên đảo cũ (' + living(B).length + '/' + pop + ')');
  assert.ok(B.garrison && B.garrison.troops.length >= 1, 'có quân đóng giữ');
  assert.ok(!BK.Diplomacy.alive(W, 1), 'đảo bị sáp nhập không tự quyết nữa');
  assert.ok(W.log.some((e) => /bị sáp nhập vào Đá Mây/.test(e.text)));
});

test('đột kích: cướp kho rồi về, chiến lợi phẩm vào kho đảo mình', () => {
  const { W, w, a } = setup(5, null, 1, 'raid'), A = W.islands[a], B = W.islands[1];
  assert.ok(w, 'có quân đi đột kích');
  E.state(B).stock.wood = 400; E.state(A).stock.wood = 0;
  run(W, 40);
  assert.ok(E.state(B).stock.wood < 400, 'kho bên kia vơi đi');
  assert.ok(!W.wars.includes(w), 'quân đã về');
  assert.ok(w.troops.every((x) => !x.p.away), 'người về nhà');
  // xông vào cướp kho, hay bên kia xin hoà nộp kho trước khi bị cướp (logic/war.js maybePeace): đều mang hàng về
  assert.ok(Object.keys(w.loot).length > 0 && W.log.some((e) => /cướp kho|để được hoà/.test(e.text)), 'mang chiến lợi phẩm về');
  assert.ok(E.state(A).stock.wood > 0, 'chiến lợi phẩm vào kho đảo mình');
});

test('người chết trận có thật, bên mất người thù bên kia', () => {
  const W = BK.World.create({ seed: 9, war: false }); BK.World.jump(W, 500);
  // Cửa Sóng có đủ quân (thêm 10 người làm lính), Tuyết Trắng giữ cổng thật: chắc chắn có trận
  living(W.islands[4]).filter((p) => p.job === 'worker').slice(0, 10).forEach((p) => { p.job = 'soldier'; });
  const w = War.launch(W, W.day, 4, 3, 'conquer', 1, W.rng);
  assert.ok(w, 'có quân xuất trận');
  run(W, 40);
  const deadOf = (i) => [...W.islands[i].people.values()].filter((p) => p.cause === 'chiến tranh').length;
  assert.ok(deadOf(3) + deadOf(4) > 0, 'có người ngã xuống');
  // bên nào mất người thì thù bên kia
  if (deadOf(3)) assert.ok(W.rel[3][4].grudge > 0.05, 'Tuyết Trắng mất người thì thù Cửa Sóng');
  if (deadOf(4)) assert.ok(W.rel[4][3].grudge > 0.05, 'Cửa Sóng mất người thì thù Tuyết Trắng');
});

test('phản bội: đang có hiệp ước mà đánh thì hiệp ước tan, các đảo khác bớt tin', () => {
  const W = BK.World.create({ seed: 2, war: false }); BK.World.jump(W, 500);
  BK.Diplomacy.sign(W, W.day, 0, 1, 'pact', 360);
  for (let j = 2; j < 6; j++) W.rel[j][0].trust = 0.5;
  War.launch(W, W.day, 0, 1, 'raid', 1, W.rng);
  assert.ok(!BK.Diplomacy.treatyOf(W, 0, 1, W.day), 'hiệp ước tan');
  assert.ok(W.rel[3][0].trust < 0.5 && W.rel[1][0].grudge >= 0.5);
});

test('đảo bị sáp nhập bất bình thì nổi dậy (thắng hay thua không đoán trước)', () => {
  let revolts = 0;
  for (const seed of [3, 4]) {
    // (đặt thẳng sáp nhập rồi xét nổi dậy: kiểm thử hành vi)
    const { W, w } = setup(seed, 2, 1, 'conquer'); w.stage = 'inside'; w.siege = 'hall'; War.annex(W, W.day, 2, 1, w);
    const B = W.islands[1];
    for (const x of B.garrison ? B.garrison.troops : []) x.p.alive = false; // quân đóng giữ đã đi hết
    W.rel[1][2].grudge = 1;
    for (let k = 0; k < 260; k++) { B.unrest = 1; run(W, 1); if (W.revolts) break; }
    revolts += W.revolts;
  }
  assert.ok(revolts >= 1, 'có nổi dậy');
});

test('tắt chiến tranh thì không ai đánh ai (số trận, sáp nhập, chết đói theo năm: tools/calibrate.js)', () => {
  const P = BK.World.create({ seed: 1, war: false }); BK.World.jump(P, 2 * 360);
  assert.strictEqual(P.warCount, 0, 'tắt chiến tranh thì không ai đánh');
});

// ---------- Bước 11e (design/ke-hoach-khac-phuc.md mục 4.3, 4.4, 5.2) ----------
test('đảo bị chiếm giữ thời của mình, đảo cai quản chuyển công nghệ dần: mỗi 90 ngày một thời, tới bằng mình trừ một', () => {
  const { W, w } = setup(3, 2, 1, 'conquer'), A = W.islands[2], B = W.islands[1];
  War.annex(W, W.day, 2, 1, w);
  A.level = 9; B.level = 4; const d0 = W.day;
  run(W, 89); assert.strictEqual(B.level, 4, 'chưa đủ 90 ngày thì chưa lên');
  run(W, 2); assert.strictEqual(B.level, 5, 'đủ 90 ngày lên một thời');
  // (dân không bất bình, để không nổi dậy giành lại đảo giữa chừng; đảo cai quản vẫn tự lên thời)
  for (let k = 0; k < 10; k++) { W.rel[1][2].grudge = 0; B.unrest = 0; run(W, 91); assert.ok(B.level <= Math.max(5, A.level - 1), 'không vượt đảo cai quản trừ một'); }
  assert.strictEqual(B.annexedBy, 2);
  assert.strictEqual(B.level, A.level - 1, 'tới bằng đảo cai quản trừ một rồi dừng');
  assert.ok(W.day - d0 > 360);
  assert.ok(B.log.some((e) => /chuyển công nghệ/.test(e.text)), 'có tin chuyển công nghệ');
});

test('đầu hàng để cứu dân có điều kiện: người đứng đầu giữ ghế, đảo giữ lại một phần kho', () => {
  const { W, w } = setup(3, 2, 1, 'conquer'), B = W.islands[1], king = B.seats.king;
  E.state(B).stock.stone = 200;
  War.annex(W, W.day, 2, 1, w, 'cứu dân');
  assert.strictEqual(B.annexedBy, 2);
  assert.strictEqual(B.seats.king, king, 'người đứng đầu cũ giữ ghế');
  assert.strictEqual(B.people.get(king).governor, 2, 'cai quản thay đảo thắng');
  assert.ok(E.state(B).stock.stone >= 200 * 0.4 - 1, 'giữ lại một phần kho (' + E.state(B).stock.stone + ')');
  assert.ok(W.log.some((e) => /đầu hàng Đá Mây để cứu dân/.test(e.text)));
});

test('xét đầu hàng mỗi khi nhà chính mất thêm một phần tư độ bền', () => {
  const S = { seats: { king: 1 }, people: new Map([[1, { id: 1, alive: true, genome: { traits: { fear: 0.9, meekness: 0.9, aggression: 0.1, ambition: 0.1 } } }]]) };
  BK.People.traits = ((f) => (p) => (p.genome && p.genome.traits && p.genome.traits.fear != null && p.id === 1 ? Object.assign({ cunning: 0.5, paranoia: 0.5, piety: 0.5, intellect: 0.5 }, p.genome.traits) : f(p)))(BK.People.traits);
  const yes = { chance: (p) => p > 0.25 }, Gs = BK.Siege;
  assert.strictEqual(Gs.surrender(S, 0.2, 1, yes, 0.25, false), null, 'xét nhẹ mỗi ngày: chưa hàng');
  assert.strictEqual(Gs.surrender(S, 0.2, 1, yes, 0.25, true), 'cứu dân', 'nhà chính vừa mất thêm một phần tư: người nhút nhát hàng');
});

test('đảo nhỏ tự xin làm chư hầu: không đánh, không quân đóng giữ, không tính là mất thành', () => {
  const W = BK.World.create({ seed: 3, war: false }); BK.World.jump(W, 500);
  const n0 = (W.cityLoss || []).length;
  assert.ok(War.submit(W, W.day, 2, 1), 'bá chủ nhận');
  const B = W.islands[1];
  assert.strictEqual(B.annexedBy, 2);
  assert.ok(!B.garrison, 'không quân đóng giữ');
  assert.strictEqual((W.cityLoss || []).length, n0, 'không tính là mất thành (không có càn quét)');
  assert.strictEqual(W.warStats.vassal, 1);
  assert.ok(W.log.some((e) => /tự xin làm chư hầu Đá Mây/.test(e.text)));
  assert.ok(!War.submit(W, W.day, 2, 1), 'đã là chư hầu thì không xin lại');
});
