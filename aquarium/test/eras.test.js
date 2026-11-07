// Mười hai thời kỳ: thời đầu là Thời đồ đá; lên cấp bằng giỏ tài nguyên (logic/economy.js)
const test = require('node:test'); const assert = require('node:assert');
const R = require('../logic/rules.js'); global.BK = { Rules: R }; const E = require('../logic/eras.js');
test('12 thời kỳ, thời đầu là Thời đồ đá', () => { assert.strictEqual(E.COUNT, 12); assert.strictEqual(E.of(1).name, 'Thời đồ đá'); assert.ok(E.of(9).beyond && !E.of(8).beyond); });
test('mỗi thời sau thời đồ đá có giỏ tài nguyên để lên cấp; các thời sau đòi năng lượng, hàng quý', () => {
  assert.deepStrictEqual(E.of(1).cost, {});
  for (let l = 2; l <= 12; l++) { const c = E.of(l).cost; assert.ok(Object.keys(c).length >= 3, 'thời ' + l); assert.ok(Object.values(c).every((v) => v > 0)); }
  for (let l = 6; l <= 12; l++) assert.ok(E.of(l).cost.energy || E.of(l).cost.luxury, 'thời ' + l + ' cần năng lượng hay hàng quý');
});
