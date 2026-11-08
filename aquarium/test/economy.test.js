// Bể Kính · test/economy.test.js · Tài nguyên và lên cấp: mỗi đảo một nhịp, thiếu thứ gì thì kẹt ở đó (khi chưa có giao thương)
const test = require('node:test');
const assert = require('node:assert');
for (const f of ['rng', 'rules', 'genes', 'people', 'family', 'council', 'temper', 'posts', 'jobs', 'eras', 'schedule', 'scenes', 'leader', 'guards', 'tasks', 'dramas', 'economy', 'climate', 'epigen', 'construction', 'homes', 'siege', 'brain', 'island', 'diplomacy', 'war', 'strategy', 'world']) require('../logic/' + f + '.js');
const BK = globalThis.BK;
const runs = [1, 2, 3].map((seed) => { const W = BK.World.create({ seed, diplomacy: false }); BK.World.jump(W, 9 * 360); return W; });

// đảo 100 dân và công nghệ các thời sau làm ra được cả thứ gần như không có, nên sống riêng 9 năm vẫn có đảo chạm thời 12;
// nhưng đảo thiếu hẳn một thứ (Cát Hồng: gỗ) thì kẹt, và các đảo lên cấp khác hẳn nhau
test('mỗi đảo lên cấp theo nhịp riêng khi chưa có giao thương: các đảo không cùng cấp, ít đảo chạm thời 12, Cát Hồng (không có gỗ) kẹt lại', () => {
  for (const W of runs) {
    const lv = W.islands.map((S) => S.level);
    assert.ok(new Set(lv).size >= 2, 'cấp cuối: ' + lv.join(','));
    assert.ok(lv.filter((l) => l === 12).length <= 2, 'số đảo chạm thời 12: ' + lv.join(','));
    assert.ok(BK.World.island(W, 'desert').level <= 9, 'Cát Hồng: ' + BK.World.island(W, 'desert').level);
  }
});

test('đặc sản theo địa hình: Lúa Vàng giàu lương thực, Đá Mây giàu đá và kim loại, Cát Hồng gần như không có gỗ', () => {
  const E = BK.Economy, S = (W, k) => BK.World.island(W, k);
  const W = runs[0];
  assert.ok(E.richOf(S(W, 'plains'), 'food') > E.richOf(S(W, 'mountain'), 'food'));
  assert.ok(E.richOf(S(W, 'mountain'), 'metal') > E.richOf(S(W, 'plains'), 'metal') * 10);
  assert.ok(E.richOf(S(W, 'desert'), 'wood') < 0.1);
  assert.ok(E.richOf(S(W, 'tundra'), 'food') > 0.6, 'Tuyết Trắng sống nhờ cá (đất trồng gần như không có)');
});

test('giỏ tài nguyên: lên cấp thì nộp giỏ; kho không vượt sức chứa; ai làm việc gì cũng là thứ đảo đã khai thác được', () => {
  for (const W of runs) for (const S of W.islands) {
    const st = BK.Economy.state(S);
    for (const r of BK.Economy.RES) assert.ok(st.stock[r] >= 0 && st.stock[r] <= BK.Economy.CAP(S.level, r) + 1e-6, S.name + ' ' + r);
    for (const p of BK.Island.living(S)) if (p.job === 'worker') assert.ok(S.level >= BK.Economy.UNLOCK[p.res], S.name + ': ' + p.res + ' ở cấp ' + S.level);
  }
});

test('đói thì không sinh thêm con', () => {
  const W = BK.World.create({ seed: 4 }); BK.World.jump(W, 400); const S = W.islands[0];
  BK.Economy.state(S).hunger = 5;
  for (let k = 0; k < 400; k++) assert.strictEqual(BK.Family.trickle(S, S.rng), null);
  BK.Economy.state(S).hunger = 0;
  let born = 0; for (let k = 0; k < 400; k++) if (BK.Family.trickle(S, S.rng)) born++;
  assert.ok(born >= 0);
});
