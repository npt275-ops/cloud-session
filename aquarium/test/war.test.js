// Bể Kính · test/war.test.js · Chiến tranh, sáp nhập, nổi dậy (logic/war.js, quyết định ở logic/strategy.js)
const test = require('node:test');
const assert = require('node:assert');
for (const f of ['rng', 'rules', 'genes', 'people', 'family', 'council', 'temper', 'posts', 'jobs', 'eras', 'schedule', 'scenes', 'leader', 'guards', 'tasks', 'dramas', 'economy', 'climate', 'epigen', 'construction', 'homes', 'siege', 'arms', 'missiles', 'ecology', 'brain', 'island', 'diplomacy', 'war', 'battles', 'chronicle', 'prosperity', 'strategy', 'world']) require('../logic/' + f + '.js');
const BK = globalThis.BK, E = BK.Economy, War = BK.War, living = BK.Island.living;
const starved = (W) => W.islands.reduce((a, S) => a + [...S.people.values()].filter((p) => p.cause === 'đói').length, 0);

// một trận dựng sẵn: tới ngày 500, đảo b mất hết người giữ cổng (đi vắng), đảo a đem quân sang
// a == null: đảo có nhiều quân nhất đi đánh
function setup(seed, a, b, kind) {
  const W = BK.World.create({ seed, war: false }); BK.World.jump(W, 500);
  if (a == null) a = [0, 1, 2, 3, 4, 5].filter((i) => i !== b).sort((x, y) => War.musterable(W, y, W.day).length - War.musterable(W, x, W.day).length)[0];
  for (const p of living(W.islands[b])) if (p.job === 'soldier' || p.job === 'sideguard' || p.job === 'gatekeeper' || /general/.test(p.role || '')) p.away = 'test';
  // tổng tấn công: bên đánh có đạo quân đủ mạnh (thêm 10 người làm lính) để kết quả không phụ thuộc may rủi
  if (kind === 'conquer') living(W.islands[a]).filter((p) => p.job === 'worker').slice(0, 10).forEach((p) => { p.job = 'soldier'; });
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

test('chiếm nhà chính thì sáp nhập: kho sang đảo thắng, người cai quản từ đảo thắng, dùng chung thời, có quân đóng giữ', () => {
  const { W, w } = setup(3, 2, 1, 'conquer'), A = W.islands[2], B = W.islands[1];
  E.state(B).stock.wood = 300; const wood0 = E.state(A).stock.wood, pop = living(B).length;
  run(W, 60); // (vây thành có thể kéo dài tới 24 ngày, logic/battles.js)
  assert.strictEqual(B.annexedBy, 2, 'Thông Xanh thuộc về Đá Mây');
  assert.ok(E.state(A).stock.wood > wood0, 'gỗ chuyển sang đảo thắng');
  const gov = B.people.get(B.seats.king);
  assert.ok(gov && gov.governor === 2 && gov.alive, 'người cai quản từ Đá Mây ngồi ghế vua');
  assert.strictEqual(B.level, A.level, 'dùng chung thời');
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
  for (const seed of [3, 4, 6]) {
    const { W } = setup(seed, 2, 1, 'conquer'); run(W, 30);
    const B = W.islands[1]; if (B.annexedBy == null) continue;
    for (const x of B.garrison ? B.garrison.troops : []) x.p.alive = false; // quân đóng giữ đã đi hết
    W.rel[1][2].grudge = 1;
    for (let k = 0; k < 260; k++) { B.unrest = 1; run(W, 1); if (W.revolts) break; }
    revolts += W.revolts;
  }
  assert.ok(revolts >= 1, 'có nổi dậy');
});

test('chạy thật 9 năm: các đảo tự đánh nhau theo tính cách; chiến tranh có làm đói thêm nhưng không thành nạn đói lớn', () => {
  let wars = 0, annex = 0, a = 0, b = 0;
  // sáp nhập: khoảng 1,2 mỗi trận ở bước 6; sau 7d (đánh thành khó hơn) khoảng 0,5 mỗi trận, cân chỉnh lại ở 7g
  for (const seed of [1, 6, 16, 14, 17]) {
    const W = BK.World.create({ seed }), P = BK.World.create({ seed, war: false });
    BK.World.jump(W, 9 * 360); BK.World.jump(P, 9 * 360);
    wars += W.warCount; annex += W.annexations; a += starved(W); b += starved(P);
    assert.strictEqual(P.warCount, 0, 'tắt chiến tranh thì không ai đánh');
  }
  assert.ok(wars >= 6, 'số trận: ' + wars);
  assert.ok(annex >= 1, 'có trận sáp nhập');
  // đột kích cướp lương thực, dân binh bỏ ruộng: đói thêm là thật; nhưng trung bình dưới 20 người mỗi trận (100 dân mỗi đảo)
  assert.ok(a / 5 < 20, 'chết đói có chiến tranh ' + a + ', không chiến tranh ' + b);
});
