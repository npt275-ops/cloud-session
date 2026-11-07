// Bể Kính · test/world.test.js · Cả bể: sáu đảo có dân, một đồng hồ, kết quả không phụ thuộc tốc độ chạy
const test = require('node:test');
const assert = require('node:assert');
for (const f of ['rng', 'rules', 'genes', 'people', 'family', 'council', 'temper', 'posts', 'jobs', 'eras', 'schedule', 'tasks', 'dramas', 'construction', 'homes', 'brain', 'island', 'world']) require('../logic/' + f + '.js');
const BK = globalThis.BK;

test('sáu đảo đều có dân, gia tộc riêng, đủ vị trí cứng sau 3 năm', () => {
  const W = BK.World.create({ seed: 7 });
  BK.World.jump(W, 3 * 360);
  assert.strictEqual(W.islands.length, 6);
  W.islands.forEach((S, i) => {
    const live = BK.Island.living(S);
    assert.ok(live.length >= 20, S.name + ': ' + live.length + ' người');
    assert.ok(live.every((p) => BK.People.CLANS[W.keys[i]].includes(p.clan)), S.name + ': gia tộc của đảo mình');
    for (const [k, n] of [['gateMain', 4], ['gateLeft', 2], ['gateRight', 2], ['orator', 1]]) assert.strictEqual(live.filter((p) => p.postKey === k && BK.Posts.of(p)).length, n, S.name + ' ' + k);
  });
});

test('mỗi đảo một kiểu người: trung bình qua nhiều trận, Đá Mây hiếu chiến hơn Lúa Vàng, Cửa Sóng mưu mô hơn Thông Xanh', () => {
  const avg = (key, k) => { let s = 0, n = 0; for (let seed = 1; seed <= 12; seed++) { const W = BK.World.create({ seed }); for (const p of BK.Island.living(BK.World.island(W, key))) { s += p.genome.traits[k]; n++; } } return s / n; };
  assert.ok(avg('mountain', 'aggression') > avg('plains', 'aggression') + 0.05, 'hiếu chiến');
  assert.ok(avg('coast', 'cunning') > avg('forest', 'cunning') + 0.03, 'mưu mô');
});

test('giờ trong ngày do logic tính từ lịch: một vòng ngày đêm ứng với CYCLE_DAYS ngày', () => {
  const W = BK.World.create({ seed: 3 });
  const t0 = W.tod; BK.World.advance(W, BK.World.CYCLE_DAYS / 2);
  assert.ok(Math.abs(((W.tod - t0 + 1) % 1) - 0.5) < 1e-6, 'nửa vòng: ' + W.tod);
  assert.ok(W.islands.every((S) => S.tod === W.tod), 'sáu đảo cùng giờ');
});

test('cùng seed: chạy 1×, 2×, 4× (khung hình khác nhau) ra cùng một lịch sử', () => {
  const run = (perFrame, jitter) => {
    const W = BK.World.create({ seed: 11 }); let i = 0;
    while (W.day < 200) BK.World.advance(W, perFrame * (1 + (jitter ? ((i++ * 7919) % 13) / 26 : 0)));
    BK.World.advance(W, 0);
    return W.islands.map((S) => S.log.filter((e) => e.day <= 199).map((e) => e.day + ':' + e.text).join('|') + '#' + [...S.minds.values()].length).join('\n');
  };
  const a = run(0.75 / 60), b = run(1.5 / 60, true), c = run(3 / 60, true);
  assert.strictEqual(b, a, '2× khác 1×'); assert.strictEqual(c, a, '4× khác 1×');
});
