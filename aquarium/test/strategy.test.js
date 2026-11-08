// Bể Kính · test/strategy.test.js · Người đứng đầu, quan hệ giữa các đảo, giao thương, hiệp ước, cầu
const test = require('node:test');
const assert = require('node:assert');
for (const f of ['rng', 'rules', 'genes', 'people', 'family', 'council', 'temper', 'posts', 'jobs', 'eras', 'schedule', 'scenes', 'leader', 'guards', 'tasks',
    'dramas', 'economy', 'climate', 'epigen', 'construction', 'homes', 'siege', 'arms', 'missiles', 'ecology', 'brain', 'island', 'diplomacy', 'war',
    'battles', 'chronicle', 'prosperity', 'strategy', 'powers', 'goals', 'world']) require('../logic/' + f + '.js');
const BK = globalThis.BK;
const starved = (W) => W.islands.reduce((a, S) => a + [...S.people.values()].filter((p) => p.cause === 'đói').length, 0);
// so giao thương với sống riêng: tắt chiến tranh ở cả hai (chiến tranh cũng gây đói, test/war.test.js); sáu năm là đủ thấy
// (để tệp chạy dưới 60 giây; số đo cả chín năm: tools/calibrate.js)
const runs = [1, 2, 3].map((seed) => { const on = BK.World.create({ seed, war: false }), off = BK.World.create({ seed, diplomacy: false }); BK.World.jump(on, 6 * 360); BK.World.jump(off, 6 * 360); return { on, off }; });

test('các đảo tự đi buôn: nhiều chuyến buôn trọn vẹn, có hiệp ước, bắc cầu giữa các đảo kề nhau buôn nhiều', () => {
  for (const { on } of runs) {
    const trips = Object.values(on.tradeCount).reduce((a, b) => a + b, 0);
    assert.ok(trips >= 40, 'số chuyến buôn: ' + trips);
    assert.ok(on.log.some((e) => /ký (hiệp ước|liên minh)/.test(e.text)), 'có hiệp ước');
    assert.ok(on.bridges.length >= 2, 'số cầu: ' + on.bridges.length);
  }
});

test('giao thương giúp các đảo lên thời nhanh hơn, không làm đói thêm (cùng seed, so với sáu đảo sống riêng)', () => {
  const lv = (W) => W.islands.reduce((s, S) => s + S.level, 0);
  const a = runs.reduce((s, r) => s + lv(r.on), 0), b = runs.reduce((s, r) => s + lv(r.off), 0);
  assert.ok(a > b, 'tổng cấp khi có buôn ' + a + ', sống riêng ' + b);
  const fa = runs.reduce((s, r) => s + starved(r.on), 0), fb = runs.reduce((s, r) => s + starved(r.off), 0);
  // chết đói rất ít ở cả hai (đo 10 trận: 14 so với 13), 3 trận thì lệch vài người là nhiễu
  assert.ok(fa <= fb + 10, 'chết đói khi có buôn ' + fa + ', sống riêng ' + fb);
});

test('đi buôn có trí nhớ: cặp đảo đang buôn với nhau (gần đây) tin nhau hơn cặp không buôn', () => {
  let near = [], other = [];
  for (const { on: W } of runs) {
    // cặp có chuyến buôn trong 200 ngày cuối (nhật ký cả bể); tin cậy phai dần nên chỉ xét chuyến gần đây
    const recent = new Set(W.log.filter((e) => / đổi /.test(e.text) && e.day > W.day - 200 && e.isles.length === 2).map((e) => BK.Diplomacy.pairKey(e.isles[0], e.isles[1])));
    for (let a = 0; a < 6; a++) for (let b = a + 1; b < 6; b++) (recent.has(BK.Diplomacy.pairKey(a, b)) ? near : other).push((W.rel[a][b].trust + W.rel[b][a].trust) / 2);
  }
  const avg = (x) => x.reduce((s, v) => s + v, 0) / Math.max(1, x.length);
  assert.ok(near.length && avg(near) > avg(other), 'đang buôn ' + avg(near).toFixed(3) + ' (' + near.length + ' cặp), không buôn ' + avg(other).toFixed(3));
});

test('người đứng đầu hiếu chiến, đa nghi thì tích quân; hiền lành thì giải bớt quân', () => {
  const W = BK.World.create({ seed: 4 }); BK.World.jump(W, 200); const S = W.islands[0], king = S.people.get(S.seats.king);
  const set = (v) => { for (const k of ['aggression', 'paranoia']) king.genome.traits[k] = v; king.genome.traits.meekness = 1 - v; BK.Epigen.express(king); };
  set(1); for (let k = 0; k < 6; k++) BK.Strategy.islandTick(W, 0, W.day, W.rng);
  const hawk = S.policy.soldierShare;
  set(0); for (let k = 0; k < 6; k++) BK.Strategy.islandTick(W, 0, W.day, W.rng);
  assert.ok(hawk > BK.Strategy.BASE_SOLDIERS && S.policy.soldierShare < hawk - 0.1, 'tích quân ' + hawk.toFixed(2) + ' rồi giảm ' + S.policy.soldierShare.toFixed(2));
});

test('sắp hết lương thực thì không đợi kỳ xét: còn thương nhân rảnh là đi mua ngay', () => {
  const W = BK.World.create({ seed: 5 }); BK.World.jump(W, 400);
  const S = W.islands[1], st = BK.Economy.state(S); st.stock.food = 0; st.hunger = 1; st.stock.wood = 300; // có hàng để trả
  for (const j of [0, 2, 3, 4, 5]) BK.Economy.state(W.islands[j]).stock.food = 3000;
  W.caravans = [];
  // giữ kho cạn suốt 3 ngày (ruộng làm ra mỗi ngày có thể kéo đảo khỏi mức sắp hết)
  for (let k = 1; k <= 3; k++) { st.stock.food = 0; st.hunger = 1; BK.World.jump(W, 400 + k); }
  // đi hỏi mua ngay: có đoàn đi mua, hay đã hỏi mà đảo kia từ chối (đảo bán nhận hay không theo lời lãi, tin cậy, tính người đứng đầu)
  const asked = S.log.some((e) => e.day > 400 && /từ chối đổi lương thực/.test(e.text));
  assert.ok(W.caravans.some((c) => c.a === 1 && c.get.food > 0) || asked, 'đi hỏi mua lương thực trong 3 ngày');
});

test('đoàn buôn đi thật: hàng rời kho lúc đi, tới nơi mới nhận; qua cầu nhanh hơn đi thuyền', () => {
  const W = BK.World.create({ seed: 8 }); BK.World.jump(W, 30);
  const E = BK.Economy, A = W.islands[0], B = W.islands[1];
  E.state(A).stock.food = 500; E.state(B).stock.wood = 200;
  const a0 = E.state(A).stock.food, b0 = E.state(B).stock.food;
  const c = BK.Diplomacy.trade(W, W.day, 0, 1, { food: 50 }, { wood: 30 });
  assert.strictEqual(E.state(A).stock.food, a0 - 50, 'hàng rời kho');
  assert.strictEqual(E.state(B).stock.food, b0, 'chưa tới thì chưa nhận');
  assert.strictEqual(c.arrive - c.depart, 6, 'đi thuyền sang đảo kề: 6 ngày');
  W.bridges.push({ a: 0, b: 1 }); assert.strictEqual(BK.Diplomacy.travelDays(W, 0, 1), 3, 'qua cầu: 3 ngày');
  assert.strictEqual(BK.Diplomacy.travelDays(W, 0, 3), 14, 'đảo đối diện: đi thuyền xa');
});

// ---------- Bước 11e (design/ke-hoach-khac-phuc.md mục 4.1, 4.2, 4.3) ----------
const yes = { chance: () => true, next: () => 0.5, range: (a, b) => (a + b) / 2, int: (a) => a }, no = Object.assign({}, yes, { chance: () => false });
test('tối hậu thư của bá chủ: đảo yếu chịu thì làm chư hầu không cần đánh, khước từ thì bá chủ muốn đánh', () => {
  for (const [rng, take] of [[yes, true], [no, false]]) {
    const W = BK.World.create({ seed: 2 }); BK.World.jump(W, 400);
    const boss = 3; W.islands[boss].level = 11; const day = 5 * 360 + 10;
    assert.ok(BK.Strategy.ultimatum(W, day, rng, boss), 'có tối hậu thư');
    const sub = W.islands.findIndex((S) => S.annexedBy === boss);
    if (take) { assert.ok(sub >= 0, 'một đảo chịu thần phục'); assert.ok(W.log.some((e) => /tự xin làm chư hầu/.test(e.text))); }
    else {
      assert.strictEqual(sub, -1, 'không ai bị chiếm');
      assert.ok(W.islands[boss].policy.provoked > day, 'bá chủ muốn đánh đảo khước từ');
      assert.ok(W.chronicle.some((c) => c.w >= 3 && /khước từ tối hậu thư/.test(c.text)), 'chuyện lớn trên biên niên');
    }
  }
});

test('hạt nhân là vũ khí răn đe: chỉ bắn khi nhà chính đang bị vây (hay bị bắn trước), không bắn yểm trợ, phủ đầu', () => {
  // tìm một đảo có người đứng đầu dám dùng hạt nhân (BK.Missiles.nukeWill), cho nó một quả, cho giặc đánh vào
  let W = null, b = -1;
  for (let seed = 1; seed <= 12 && b < 0; seed++) { W = BK.World.create({ seed }); BK.World.jump(W, 400);
    b = W.islands.findIndex((S) => { const M = BK.Strategy.mind(S); return M && BK.Missiles.nukeWill(M.t); }); }
  assert.ok(b >= 0, 'có đảo dám dùng hạt nhân');
  const B = W.islands[b], a = (b + 1) % 6; BK.Missiles.arms(B).nukes = 1; BK.Missiles.arms(B).lastNuke = -1e9;
  const w = { kind: 'conquer', a, b, stage: 'gate', troops: [], n0: 10, morale: 1 }; W.wars.push(w);
  const fired = () => (W.missiles || []).some((m) => m.kind === 'nuke');
  BK.Missiles.nukeDecide(W, 2000, b, yes);
  assert.ok(!fired(), 'giặc mới ở cổng: chưa bắn, giữ làm răn đe');
  w.stage = 'inside'; w.siege = 'hall';
  BK.Missiles.nukeDecide(W, 2000, b, yes);
  assert.ok(fired(), 'nhà chính bị vây: bắn');
});

test('năm đầu có chuyện thời đồ đá có nguyên nhân, khoảng lặng ngắn', () => {
  const W = BK.World.create({ seed: 4 }); BK.World.jump(W, 300);
  const early = W.chronicle.filter((c) => c.day < 300 && c.w >= 3);
  assert.ok(early.length >= 2, 'ít nhất hai chuyện lớn trước ngày 300 (' + early.map((c) => c.text).join('; ') + ')');
  assert.ok(early.every((c) => /Thú dữ|săn|bãi săn|Lần đầu gặp/.test(c.text)), 'đúng thời đồ đá');
});
