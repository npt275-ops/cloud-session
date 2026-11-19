// SamBox · test/world.test.js · Kiểm thử thuần JS: nhiễu ổn định, ba đảo có hình đúng ý (đỉnh, vách, phần nổi), đáy biển giữa đảo
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rng, simplex2 } from '../src/core/noise.js';
import { ISLANDS, heightAt } from '../src/world/layout.js';

const stats = (spec) => {
  let max = -1e9,
    land = 0,
    n = 0,
    steep = 0;
  for (let x = -spec.radius; x <= spec.radius; x += 3)
    for (let z = -spec.radius; z <= spec.radius; z += 3) {
      const h = spec.height(x, z),
        s = Math.abs(spec.height(x + 1, z) - h) + Math.abs(spec.height(x, z + 1) - h);
      max = Math.max(max, h);
      n++;
      if (h > 0) land++;
      if (h > 0 && s > 2.5) steep++;
    }
  return { max, land: land / n, steep: steep / Math.max(1, land) };
};

test('nhiễu và số ngẫu nhiên lặp lại y hệt', () => {
  const a = rng(7),
    b = rng(7);
  for (let i = 0; i < 5; i++) assert.equal(a(), b());
  assert.equal(simplex2(1.3, 2.7), simplex2(1.3, 2.7));
});

test('ba đảo: đỉnh cao đúng tính cách, phần nổi vừa phải, có vách dốc', () => {
  const S = Object.fromEntries(ISLANDS.map((I) => [I.spec.key, stats(I.spec)]));
  console.log(JSON.stringify(S));
  assert.ok(S.tundra.max > S.plains.max && S.plains.max > S.desert.max, 'Tuyết cao nhất, Sa Mạc thấp nhất');
  for (const k in S) {
    assert.ok(S[k].land > 0.3 && S[k].land < 0.75, k + ' phần nổi');
    assert.ok(S[k].steep > 0.02, k + ' có vách dốc');
  }
});

test('giữa các đảo là đáy biển', () => {
  assert.ok(heightAt(0, -100) < -20);
  assert.ok(heightAt(0, 250) > 0, 'giữa đảo Đồng Bằng nổi trên mặt nước');
});
