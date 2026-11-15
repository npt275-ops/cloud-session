// Bể Kính · test/soak.test.js · Hậu quả của phép nước (magic/water/soak.js; design/ke-hoach-buoc-37.md)
const test = require('node:test');
const assert = require('node:assert');
globalThis.BK = globalThis.BK || {};
const hits = [];
BK.Siege = { hit: (S, key, dmg) => hits.push([key, dmg]) };
const started = [];
BK.Climate = { start: (S, key, days) => started.push([key, days]) };
const W = require('../magic/water/soak.js');
const island = () => ({ name: 'Lúa Vàng', log: [], situ: { drought: 50 }, climate: { active: [{ key: 'drought', until: 50 }, { key: 'storm', until: 50 }] } });

test('mưa: hết hạn hán ngay, thiên tai khác giữ nguyên', () => {
  const S = island();
  assert.deepStrictEqual(W.rain(S, 20), ['drought']);
  assert.strictEqual(S.situ.drought, 20);
  assert.strictEqual(S.climate.active[1].until, 50);
});

test('dập lửa: chỉ những chỗ được dập; không khoá thì dập hết', () => {
  const S = { blaze: { 'home:1': {}, 'home:2': {}, store: {} } };
  assert.strictEqual(W.douse(S, ['home:1', 'home:9']), 1);
  assert.deepStrictEqual(Object.keys(S.blaze), ['home:2', 'store']);
  assert.strictEqual(W.douse(S), 2);
});

test('đại hồng thuỷ: ven biển hư nặng hơn trong đảo, đảo bị lũ, lửa tắt, ghi biên niên', () => {
  const S = Object.assign(island(), { blaze: { 'home:3': {} } });
  hits.length = started.length = 0;
  W.flood(S, 30, [{ key: 'home:1', coast: true }, { key: 'store', coast: false }]);
  assert.deepStrictEqual(hits, [['home:1', W.COAST_HIT], ['store', W.INLAND_HIT]]);
  assert.deepStrictEqual(started, [['flood', W.FLOOD_DAYS]]);
  assert.deepStrictEqual(S.blaze, {});
  assert.ok(/Đại hồng thuỷ/.test(S.log[S.log.length - 1].text));
});
