// SamBox · test/world.test.js · Kiểm thử thuần JS: nhiễu ổn định, ba đảo có hình đúng ý (đỉnh, vách, phần nổi), đáy biển giữa đảo
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rng, simplex2 } from '../src/core/noise.js';
import { ISLANDS, TANK, SCALE, SCALE_Y, heightAt, hallAt, BRIDGES, road, pathLength, toWorld } from '../src/world/layout.js';
import { RIM } from '../src/world/islands/shape.js';
import { LANES, TRAILS, GORGE, BACKPASS, GATES, HALL, TOWN, inTown, paths } from '../src/world/islands/lanes.js';
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

test('mỗi đảo có khu nhà chính liền đủ rộng cho một thị trấn; đỉnh núi Đồng Bằng, Tuyết giữ cao độ', () => {
  for (const I of ISLANDS) {
    const big = patches(buildCells(I))[0];
    assert.ok(big >= 700, I.spec.name + ': khu nhà chính liền ' + big + ' ô');
  }
  const peak = (s) => {
    let m = -1e9;
    for (let x = -300; x <= 300; x += 1) for (let z = -300; z <= 300; z += 1) m = Math.max(m, s.height(x, z));
    return m;
  };
  // (núi dời ra sau lưng nhà chính; cao độ đỉnh giữ gần như cũ: Đồng Bằng ~125, Tuyết ~205)
  assert.ok(Math.abs(peak(plains) - 125) < 5, 'đỉnh Đồng Bằng ' + peak(plains).toFixed(1));
  assert.ok(Math.abs(peak(tundra) - 205) < 5, 'đỉnh Tuyết ' + peak(tundra).toFixed(1));
});

test('ba nhà chính thành tam giác đều quanh tâm bể; đường từ đầu cầu lên nhà chính và ba cầu dài bằng nhau', () => {
  const H = ISLANDS.map(hallAt),
    side = (i) => Math.hypot(H[i][0] - H[(i + 1) % 3][0], H[i][2] - H[(i + 1) % 3][2]);
  assert.ok(Math.abs(side(0) - side(1)) < 0.01 && Math.abs(side(1) - side(2)) < 0.01, 'ba cạnh bằng nhau');
  assert.ok(Math.hypot((H[0][0] + H[1][0] + H[2][0]) / 3, (H[0][2] + H[1][2] + H[2][2]) / 3) < 0.01, 'tâm tam giác là tâm bể');
  const roads = ISLANDS.flatMap((I) => [pathLength(road(I, 0)), pathLength(road(I, 1))]);
  assert.ok(Math.max(...roads) - Math.min(...roads) < 0.01, 'đường lính bằng nhau: ' + roads.map((v) => v.toFixed(2)).join(' '));
  const L = BRIDGES.map((b) => Math.hypot(b.from[0] - b.to[0], b.from[1] - b.to[1]));
  assert.ok(Math.max(...L) - Math.min(...L) < 0.01, 'ba cầu bằng nhau');
  for (const b of BRIDGES)
    for (const [k, p] of [[b.a, b.from], [b.b, b.to]]) {
      const I = ISLANDS.find((i) => i.spec.key === k);
      assert.ok(Math.abs(I.spec.height(p[0] - I.x, p[1] - I.z) - RIM.level * SCALE_Y) < 0.05, 'đầu cầu nằm trên đai ven biển');
    }
});

test('nhà chính ở chỗ cao nhất khu nhà chính, núi chắn sau lưng', () => {
  for (const I of ISLANDS) {
    const hall = hallAt(I)[1];
    assert.ok(Math.abs(hall - TOWN.hall * SCALE_Y) < 1e-6, I.spec.name + ': nền nhà chính');
    let back = -1e9,
      top = -1e9;
    for (let lx = -60; lx <= 60; lx += 4)
      for (let lz = -250; lz <= -170; lz += 4) {
        const [x, z] = toWorld(I, lx, lz);
        back = Math.max(back, heightAt(x, z));
      }
    for (let lx = -120; lx <= 120; lx += 6)
      for (let lz = -170; lz <= -50; lz += 6)
        if (inTown(lx, lz) > 0.999) {
          const [x, z] = toWorld(I, lx, lz);
          top = Math.max(top, heightAt(x, z));
        }
    assert.ok(top <= hall + 1e-6, I.spec.name + ': không chỗ nào trong khu nhà chính cao hơn nền nhà chính');
    assert.ok(back > hall + 30, I.spec.name + ': núi sau lưng cao ' + back.toFixed(0) + ', nhà chính ' + hall.toFixed(0));
  }
});

// độ dốc lớn nhất dọc một lối (đơn vị bản vẽ): đi được thì không có vách
function steepest(spec, P) {
  let worst = 0;
  for (let i = 0; i < P.length - 1; i++) {
    const [ax, az] = P[i],
      [bx, bz] = P[i + 1],
      n = Math.ceil(Math.hypot(bx - ax, bz - az) / 2);
    for (let k = 0; k < n; k++) {
      const x0 = ax + ((bx - ax) * k) / n,
        z0 = az + ((bz - az) * k) / n,
        x1 = ax + ((bx - ax) * (k + 1)) / n,
        z1 = az + ((bz - az) * (k + 1)) / n;
      worst = Math.max(worst, Math.abs(spec.height(x1, z1) - spec.height(x0, z0)) / Math.hypot(x1 - x0, z1 - z0));
    }
  }
  return worst;
}
test('đường chính, lối mòn, hẻm suối, đèo đều đi được trên cả ba đảo; đường chính dừng ở cổng', () => {
  for (const spec of [plains, desert, tundra]) {
    for (const L of LANES) assert.ok(steepest(spec, L) < 0.4, spec.name + ': đường chính dốc ' + steepest(spec, L).toFixed(2));
    for (const T of TRAILS) assert.ok(steepest(spec, T) < 0.6, spec.name + ': lối mòn dốc ' + steepest(spec, T).toFixed(2));
    // (hẻm: tính từ dưới bậc đá đầu hẻm; suối nông giữa lòng hẻm, men theo mép lòng hẻm)
    const G = GORGE.slice(0, -1).map(([x, z]) => [x - 4, z]); // (tới đai ven biển; điểm cuối là mép nước)
    assert.ok(steepest(spec, G) < 0.8, spec.name + ': hẻm suối dốc ' + steepest(spec, G).toFixed(2));
    assert.ok(steepest(spec, BACKPASS.slice(0, -1)) < 0.8, spec.name + ': đèo dốc ' + steepest(spec, BACKPASS.slice(0, -1)).toFixed(2));
    for (const [gx, gz] of GATES) {
      const [mx, mz] = [(gx + HALL[0]) / 2, (gz + HALL[1]) / 2]; // giữa cổng và nhà chính
      assert.ok(paths(mx, mz).lane < 0.01 && inTown(mx, mz) > 0.9, spec.name + ': sau cổng là đất xây, không còn đường');
    }
  }
});
