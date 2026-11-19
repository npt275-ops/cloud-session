// SamBox · test/world.test.js · Kiểm thử thuần JS: nhiễu ổn định, ba đảo có hình đúng ý (đỉnh, vách, phần nổi), đáy biển giữa đảo
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rng, simplex2 } from '../src/core/noise.js';
import { ISLANDS, TANK, SCALE, SCALE_Y, heightAt } from '../src/world/layout.js';
import { RIM } from '../src/world/islands/shape.js';
import { buildCells, patches } from '../src/build/cells.js';
import plains from '../src/world/islands/plains.js';
import desert from '../src/world/islands/desert.js';
import tundra from '../src/world/islands/tundra.js';

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
  for (const I of ISLANDS) assert.ok(heightAt(I.x, I.z) > 0, 'giữa đảo ' + I.spec.name + ' nổi trên mặt nước');
});

test('cả ba đảo nằm trọn trong bể kính tròn, không chồng lên nhau', () => {
  for (const I of ISLANDS) assert.ok(Math.hypot(I.x, I.z) + I.spec.radius * 1.15 < TANK.r - 10, I.spec.name + ' trong bể');
  for (const A of ISLANDS)
    for (const B of ISLANDS)
      if (A !== B) assert.ok(Math.hypot(A.x - B.x, A.z - B.z) > (A.spec.radius + B.spec.radius) * 1.15, 'lưới đất không chồng');
});

test('ba đảo quay mặt vào nhau: phía +z của bản vẽ nằm về phía tâm bể', () => {
  const base = { plains, desert, tundra };
  for (const I of ISLANDS) {
    const [lx, lz] = [40, 150], // một điểm phía mặt đảo trên bản vẽ
      wx = (lx * Math.cos(I.turn) - lz * Math.sin(I.turn)) * SCALE,
      wz = (lx * Math.sin(I.turn) + lz * Math.cos(I.turn)) * SCALE;
    assert.ok(Math.abs(I.spec.height(wx, wz) - base[I.spec.key].height(lx, lz) * SCALE_Y) < 1e-6, I.spec.name + ' xoay đúng');
    const [fx, fz] = [-Math.sin(I.turn), Math.cos(I.turn)]; // hướng +z của bản vẽ sau khi xoay
    assert.ok(fx * -I.x + fz * -I.z > 0.99 * Math.hypot(I.x, I.z), I.spec.name + ' mặt hướng thẳng về tâm');
  }
});

test('đai ven biển phẳng quanh mỗi đảo (xây tường thành); chỉ đứt ở cửa sông, suối, vịnh hẹp', () => {
  const L = RIM.level * SCALE_Y;
  for (const I of ISLANDS) {
    let ok = 0,
      n = 0;
    for (let a = 0; a < 360; a += 1, n++) {
      const c = Math.cos((a * Math.PI) / 180),
        s = Math.sin((a * Math.PI) / 180),
        h = (r) => I.spec.height(c * r, s * r);
      let r = I.spec.radius * 1.15;
      for (;;) {
        while (r > 0 && h(r) < L - 0.05) r -= 0.5; // đi từ ngoài biển vào tới mép đai
        let k = 1; // (cột đá ngoài biển: sau nó lại là nước thì đi tiếp vào trong)
        while (k <= 30 && h(r - k) >= 0) k++;
        if (k > 30) break;
        r -= k;
      }
      let flat = true;
      for (let k = 1; k <= 14; k++) flat &&= Math.abs(h(r - k) - L) < 0.3;
      if (flat) ok++;
    }
    assert.ok(ok / n > 0.95, I.spec.name + ': đai phẳng ' + Math.round((100 * ok) / n) + '% vòng đảo');
  }
});

test('mỗi đảo có nền xây liền đủ rộng cho một thị trấn; đỉnh núi Đồng Bằng, Tuyết giữ nguyên', () => {
  for (const I of ISLANDS) {
    const big = patches(buildCells(I))[0];
    assert.ok(big >= 900, I.spec.name + ': mảnh nền liền lớn nhất ' + big + ' ô');
  }
  const peak = (s) => {
    let m = -1e9;
    for (let x = -300; x <= 300; x += 1) for (let z = -300; z <= 300; z += 1) m = Math.max(m, s.height(x, z));
    return m;
  };
  assert.ok(Math.abs(peak(plains) - 125.07) < 0.5, 'đỉnh Đồng Bằng');
  assert.ok(Math.abs(peak(tundra) - 204.83) < 0.5, 'đỉnh Tuyết');
});
