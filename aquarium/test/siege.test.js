// Bể Kính · test/siege.test.js · Đánh thành (logic/siege.js, logic/war.js): cổng theo đường tới, công trình hư, vây nhà chính,
// đầu hàng, quỳ, sửa lại, tiễn quân, vai của dân trong trận
const test = require('node:test');
const assert = require('node:assert');
for (const f of ['rng', 'rules', 'genes', 'people', 'family', 'council', 'temper', 'posts', 'jobs', 'eras', 'schedule', 'scenes', 'leader', 'guards', 'tasks', 'dramas', 'economy', 'climate', 'epigen', 'construction', 'homes', 'siege', 'missiles', 'ecology', 'brain', 'island', 'diplomacy', 'war', 'strategy', 'world']) require('../logic/' + f + '.js');
const BK = globalThis.BK, War = BK.War, Siege = BK.Siege, E = BK.Economy, living = BK.Island.living;

// dựng sẵn: tới ngày 500, đảo a (thêm extra lính) đánh đảo b; weak: lính đảo b đi vắng hết
function setup(seed, a, b, extra, weak) {
  const W = BK.World.create({ seed, war: false }); BK.World.jump(W, 500);
  if (weak) for (const p of living(W.islands[b])) if (Siege.isGuard(p)) p.away = 'test'; // chỉ còn dân tự nguyện giữ thành
  living(W.islands[a]).filter((p) => p.job === 'worker').slice(0, extra).forEach((p) => { p.job = 'soldier'; });
  return { W, w: War.launch(W, W.day, a, b, 'conquer', 1, W.rng) };
}
// chạy từng giờ (trận) cho tới khi cond đúng hay hết max giờ
const until = (W, cond, max) => { for (let k = 0; k < max && !cond(); k++) { BK.World.tick(W); War.step(W, W.day, W.rng, 1 / 12); if (k % 12 === 11) War.dayTick(W, W.day, W.rng); } return cond(); };

test('tiễn quân: quân tập hợp ở cổng, người nhà ra cổng tiễn rồi mới lên đường', () => {
  const { W, w } = setup(3, 2, 1, 10), A = W.islands[2], M = A.situ.muster;
  assert.strictEqual(w.stage, 'muster');
  assert.ok(M && M.family.length >= 3 && M.troops.length >= 2, 'người nhà ' + (M && M.family.length));
  BK.World.tick(W);
  const m = A.minds.get(M.family[0]);
  assert.ok(m && m.verb === 'farewell' && m.place === M.gate, 'người nhà ra cổng tiễn: ' + JSON.stringify(m && [m.verb, m.place]));
  assert.ok(until(W, () => w.stage === 'march', 12), 'lên đường');
  assert.ok(!A.situ.muster, 'tiễn xong');
});

test('đi thuyền thì đánh cổng chính, qua cầu thì đánh cổng phụ đầu cầu; người giữ cổng gồm lính gác đúng cổng và dân tự nguyện', () => {
  const { W, w } = setup(3, 2, 1, 10), B = W.islands[1];
  assert.ok(until(W, () => w.stage === 'gate', 12 * 30));
  assert.strictEqual(w.gate, w.by === 'bridge' ? (BK.War.sideOf(1, 2) ? 'gateR' : 'gateL') : 'gate');
  const sg = B.situ.siege, def = sg.def.map((id) => B.people.get(id));
  assert.ok(def.length >= 3, 'người giữ ' + def.length);
  if (w.gate === 'gate') assert.ok(def.every((p) => p.job !== 'sideguard'), 'lính gác cổng phụ giữ chốt của mình');
  assert.ok(def.some((p) => !Siege.isGuard(p)), 'có dân tự nguyện');
  BK.World.tick(W);
  const m = B.minds.get(sg.def[0]);
  assert.ok(m.state === 'attack' && m.place === w.gate && /^w2:/.test(m.target), 'người giữ đánh một quân giặc ở cổng: ' + JSON.stringify([m.state, m.place, m.target]));
  // người không cầm vũ khí: trốn trong nhà, cầu ở chỗ thờ; người đứng đầu chỉ huy ở nhà chính
  const others = living(B).filter((p) => !p.away && !sg.def.includes(p.id) && p.id !== B.seats.king).map((p) => B.minds.get(p.id)).filter(Boolean);
  assert.ok(others.every((x) => x.verb === 'hide' || x.place === 'shrine'), 'dân không ra cổng: ' + JSON.stringify([...new Set(others.map((x) => x.verb + '@' + x.place))]));
  assert.strictEqual(B.minds.get(B.seats.king).verb, 'command');
});

test('cổng vỡ: địch đốt phá công trình quanh thành (kho mất hàng, sản lượng giảm, dân dạt sang phía kia), rồi vây nhà chính; mất thành thì vua cũ quỳ', () => {
  let done = 0;
  for (const seed of [3, 5, 8]) {
    const { W, w } = setup(seed, 2, 1, 16, true), B = W.islands[1], sb = E.state(B).stock;
    if (!until(W, () => w.stage === 'inside' || w.stage === 'return', 12 * 40) || w.stage !== 'inside') continue;
    assert.strictEqual(Siege.hp(B, w.gate), 0, 'cổng vỡ hẳn');
    const food0 = sb.food;
    until(W, () => Siege.hp(B, 'store') < 0.5 || w.siege !== 'outer', 12 * 3);
    if (Siege.hp(B, 'store') < 0.5) assert.ok(sb.food < food0, 'kho cháy mất hàng');
    BK.World.tick(W);
    if (w.siege === 'outer') {
      const ref = living(B).filter((p) => !p.away && !B.situ.siege.def.includes(p.id) && p.id !== B.seats.king).map((p) => B.minds.get(p.id)).filter(Boolean);
      assert.ok(ref.filter((x) => x.place === 'refuge').length >= ref.length * 0.6, 'dân dạt sang phía bên kia đảo');
    }
    const old = B.seats.king;
    until(W, () => w.stage === 'return' || !W.wars.includes(w), 12 * 20);
    if (B.annexedBy !== 2) continue;
    done++;
    assert.ok(B.situ.kneel && B.situ.kneel.id === old, 'vua cũ bị dẫn ra quỳ');
    BK.World.tick(W);
    assert.strictEqual(B.minds.get(old).verb, 'kneel');
    assert.ok((B.fallen || []).length > 0, 'người ngã nằm lại trên chiến trường');
    assert.ok(Siege.damaged(B).length >= 2, 'còn chỗ hư: ' + JSON.stringify(B.ruin));
  }
  assert.ok(done >= 1, 'ít nhất một trận mất thành');
});

test('công trình hư: sản lượng giảm theo độ bền, nhà cháy thì ở nhờ; hết giặc thì thợ sửa lại, có thợ tới chỗ hư', () => {
  const W = BK.World.create({ seed: 4, war: false }); BK.World.jump(W, 400);
  const S = W.islands[0];
  Siege.hit(S, 'wood', 1); assert.ok(Math.abs(Siege.output(S, 'wood') - 0.3) < 1e-9 && Siege.output(S, 'food') === 1);
  const p = living(S).find((q) => q.home != null); Siege.hit(S, 'home:' + p.home, 0.8);
  const lodge = Siege.lodging(S, p); assert.ok(lodge != null && lodge !== p.home, 'ở nhờ nhà khác');
  const st = E.state(S).stock; st.wood = st.stone = 500;
  BK.World.jump(W, W.day + 1);
  assert.ok(S.repairJob && Siege.damaged(S).includes(S.repairJob.key), 'có việc sửa');
  // thợ tới chỗ hư (ban ngày: một vòng ngày đêm dài nhiều ngày lịch, nên đặt giờ buổi sáng rồi cho mọi người nghĩ lại)
  for (let k = 0; k < 100 && BK.Schedule.phase(S.tod) !== 'morning'; k++) S.tod = k / 100;
  S.situChanged = true; BK.Brain.think(S, W.rng);
  const fixers = living(S).filter((q) => q.job === 'builder' || q.role === 'builder').map((q) => S.minds.get(q.id)).filter((m) => m && m.verb === 'repair' && /^ruin:/.test(m.place));
  assert.ok(fixers.length >= 1, 'thợ đi sửa chỗ hư');
  BK.World.jump(W, W.day + 120);
  assert.strictEqual(Siege.damaged(S).length, 0, 'sửa xong: ' + JSON.stringify(S.ruin));
});

test('đầu hàng theo tính cách: người sợ hãi, nhu nhược hàng sớm hơn người hiếu chiến, tham vọng', () => {
  const W = BK.World.create({ seed: 2, war: false }), S = W.islands[0], K = S.people.get(S.seats.king), rng = W.rng;
  const odds = (tr) => { K.traits = Object.assign({}, BK.People.traits(K), tr); let n = 0; for (let k = 0; k < 2000; k++) if (Siege.surrender(S, 0.5, 1, rng)) n++; return n / 2000; };
  const timid = odds({ fear: 0.9, meekness: 0.9, aggression: 0.1, ambition: 0.1 }), bold = odds({ fear: 0.1, meekness: 0.1, aggression: 0.9, ambition: 0.9 });
  // (7g: khả năng đầu hàng giảm còn 30% so với trước: người nhát hàng khoảng 18% mỗi ngày khi đã mất nửa đội giữ thành)
  assert.ok(timid > 0.1 && bold === 0, 'nhát ' + timid + ', gan ' + bold);
  assert.strictEqual(Siege.surrender(S, 0, Siege.HALL_DAYS, rng), 'hết lương', 'vây lâu quá thì hết lương');
});
