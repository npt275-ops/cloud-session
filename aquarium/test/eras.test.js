// Mười hai thời kỳ trong chín năm: thời đầu là Thời đồ đá, lên đủ 12 cấp đúng hạn
const test = require('node:test'); const assert = require('node:assert');
const R = require('../logic/rules.js'); global.BK = { Rules: R }; const E = require('../logic/eras.js');
test('12 thời kỳ, thời đầu là Thời đồ đá', () => { assert.strictEqual(E.COUNT, 12); assert.strictEqual(E.of(1).name, 'Thời đồ đá'); assert.ok(E.of(9).beyond && !E.of(8).beyond); });
test('chín năm đi hết 12 cấp', () => {
  assert.strictEqual(E.levelOfDay(0), 1); assert.strictEqual(E.levelOfDay(E.ERA_DAYS - 0.01), 1); assert.strictEqual(E.levelOfDay(E.ERA_DAYS), 2);
  assert.strictEqual(E.levelOfDay(R.MATCH_DAYS - 1), 12); assert.strictEqual(E.levelOfDay(R.MATCH_DAYS + 500), 12);
  for (let l = 1; l <= 12; l++) assert.strictEqual(E.levelOfDay(E.startOf(l)), l);
});
