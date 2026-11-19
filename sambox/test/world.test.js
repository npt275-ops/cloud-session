// SamBox · test/world.test.js · Kiểm thử thuần JS: nhiễu ổn định, ba đảo có hình đúng ý (đỉnh, vách, phần nổi), đáy biển giữa đảo,
// khung đường cân bằng, khu nhà chính kín tầm nhìn, ba suối uốn lượn dài bằng nhau
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rng, simplex2 } from '../src/core/noise.js';
import { ISLANDS, TANK, SCALE, SCALE_Y, heightAt, hallAt, BRIDGES, road, pathLength, toWorld } from '../src/world/layout.js';
import { RIM, lineDist } from '../src/world/islands/shape.js';
import { LANES, TRAILS, BACKPASS, DOOR, GATES, HEADS, HALL, TOWN, EYE, FORD, inTown } from '../src/world/islands/lanes.js';
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
test('đường chính (cả khe sau cổng), lối mòn, cửa trước, đèo đều đi được; chỉ lát đường tới cổng', () => {
  for (const spec of [plains, desert, tundra]) {
    const p = spec.paths.paths;
    for (const L of LANES) assert.ok(steepest(spec, L) < 0.4, spec.name + ': đường chính dốc ' + steepest(spec, L).toFixed(2));
    for (const T of TRAILS) assert.ok(steepest(spec, T) < 0.6, spec.name + ': lối mòn dốc ' + steepest(spec, T).toFixed(2));
    assert.ok(steepest(spec, DOOR) < 0.45, spec.name + ': cửa trước dốc ' + steepest(spec, DOOR).toFixed(2));
    assert.ok(steepest(spec, BACKPASS.slice(0, -1)) < 0.8, spec.name + ': đèo dốc ' + steepest(spec, BACKPASS.slice(0, -1)).toFixed(2));
    for (const L of LANES) {
      const along = (P, i, t) => [P[i][0] + (P[i + 1][0] - P[i][0]) * t, P[i][1] + (P[i + 1][1] - P[i][1]) * t];
      assert.ok(p(...along(L, 3, 0.5)).lane > 0.9, spec.name + ': trước cổng là đường lát');
      const q = p(...along(L, 4, 0.5));
      assert.ok(q.lane < 0.01 && q.defile > 0.9, spec.name + ': sau cổng là khe đất, không lát');
    }
    for (const [gx, gz] of GATES) {
      const [mx, mz] = [(gx + HALL[0]) / 2, (gz + HALL[1]) / 2]; // giữa cổng và nhà chính
      assert.ok(p(mx, mz).lane < 0.01 && inTown(mx, mz) > 0.9, spec.name + ': sau cổng là đất xây, không còn đường');
    }
  }
});

test('khu nhà chính trũng, vành đồi che kín: đứng trong khu không thấy cổng, đầu cầu, cầu (cả ba cầu)', () => {
  // tầm nhìn trong bể (toạ độ thế giới; chỉ đất chắn): người đứng trong khu cao 3,6; chỗ tầm mắt; đích cao hơn mặt đất/mặt cầu vài đơn vị
  const blocked = (a, b) => {
    const n = Math.ceil(Math.hypot(b[0] - a[0], b[2] - a[2]) / 2.5);
    for (let i = 1; i < n; i++) {
      const t = i / n;
      if (heightAt(a[0] + (b[0] - a[0]) * t, a[2] + (b[2] - a[2]) * t) > a[1] + (b[1] - a[1]) * t) return true;
    }
    return false;
  };
  for (const I of ISLANDS) {
    const at = (lx, lz, up) => {
      const [x, z] = toWorld(I, lx, lz);
      return [x, heightAt(x, z) + up, z];
    };
    const targets = [...HEADS, ...GATES].map(([x, z]) => at(x, z, 10));
    for (const b of BRIDGES)
      for (let t = 0; t <= 1.0001; t += 0.1) targets.push([b.from[0] + (b.to[0] - b.from[0]) * t, 9.6 + 9 * Math.sin(Math.PI * t), b.from[1] + (b.to[1] - b.from[1]) * t]);
    const eyes = [at(EYE.from[0], EYE.from[1], EYE.up * SCALE_Y)];
    for (let x = -108; x <= 108; x += 24) for (let z = -160; z <= -58; z += 17) if (inTown(x, z) > 0.999) eyes.push(at(x, z, 3.6));
    assert.ok(eyes.length > 25, 'đủ chỗ đứng trong khu');
    for (const e of eyes) for (const t of targets) assert.ok(blocked(e, t), I.spec.name + ': từ ' + e.map(Math.round) + ' thấy ' + t.map(Math.round));
    const town = TOWN.level * SCALE_Y;
    assert.ok(GATES.every(([x, z]) => at(x, z, 0)[1] > town), I.spec.name + ': cổng cao hơn khu nhà chính (khu trũng)');
  }
});

test('ba suối uốn lượn mềm, dáng khác nhau, dài bằng nhau; hai bờ đi được; nước xuống dần ra biển', () => {
  const S = [plains, desert, tundra].map((s) => s.paths);
  const len = (P) => P.slice(1).reduce((a, p, i) => a + Math.hypot(p[0] - P[i][0], p[1] - P[i][1]), 0);
  const cut = (P, z0, z1) => P.filter(([, z]) => z >= z0 && z <= z1);
  const L = S.map((p) => [len(cut(p.gorge, -1e9, FORD[1])), len(cut(p.gorge, FORD[1], 1e9))]);
  for (const k of [0, 1]) assert.ok(Math.max(...L.map((l) => l[k])) - Math.min(...L.map((l) => l[k])) < 0.01, 'hai khúc suối dài bằng nhau: ' + JSON.stringify(L));
  assert.ok(L[0][0] + L[0][1] > (S[0].gorge.at(-1)[1] - S[0].gorge[0][1]) * 1.12, 'suối uốn lượn dài hơn đường thẳng');
  for (const p of S) {
    assert.ok(p.gorge.some(([x, z]) => Math.hypot(x - FORD[0], z - FORD[1]) < 0.5), 'bến lội nằm trên suối');
    let r = 1e9; // bán kính cong nhỏ nhất (không gãy nhọn)
    for (let i = 1; i < p.gorge.length - 1; i++) {
      const [a, b, c] = [p.gorge[i - 1], p.gorge[i], p.gorge[i + 1]],
        cross = Math.abs((b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0]));
      if (cross > 1e-9) r = Math.min(r, (Math.hypot(b[0] - a[0], b[1] - a[1]) * Math.hypot(c[0] - b[0], c[1] - b[1]) * Math.hypot(c[0] - a[0], c[1] - a[1])) / (2 * cross));
    }
    assert.ok(r > 18, 'suối uốn mềm: bán kính cong nhỏ nhất ' + r.toFixed(1));
  }
  for (let i = 0; i < 3; i++)
    for (let j = i + 1; j < 3; j++) {
      const d = Math.max(...S[i].gorge.map(([x], k) => Math.abs(x - S[j].gorge[k][0])));
      assert.ok(d > 20, 'dáng suối khác nhau: lệch nhau ' + d.toFixed(1));
    }
  for (const spec of [plains, desert, tundra]) {
    const W = spec.paths.stream;
    assert.ok(W[0].y > 19 && W.at(-1).y < 0.3, spec.name + ': suối từ chân vành đồi chảy ra tới biển');
    assert.ok(W.every((w, i) => !i || w.y <= W[i - 1].y + 1e-9), spec.name + ': mặt nước xuống dần');
    // hai bờ: dải đất phẳng ngang mặt lòng hẻm từ mép nước tới mép lòng hẻm, dọc theo bờ đi được (trừ chỗ lối mòn cắt ngang)
    const sides = [[[]], [[]]]; // (mỗi bờ: các đoạn liền, ngắt ở chỗ lối mòn cắt ngang)
    W.forEach((w, i) => {
      if (!w.f || TRAILS.some((T) => lineDist(T, w.x, w.z) < w.f + 18)) return sides.forEach((B) => B.at(-1).length && B.push([])); // (bờ dốc xuống bến lội)
      const a = W[Math.max(0, i - 1)],
        b = W[Math.min(W.length - 1, i + 1)],
        l = Math.hypot(b.x - a.x, b.z - a.z),
        [nx, nz] = [-(b.z - a.z) / l, (b.x - a.x) / l];
      [-1, 1].forEach((sd, k) => {
        for (const o of [w.w + 1.6, w.f - 3.5]) {
          const h = spec.height(w.x + nx * o * sd, w.z + nz * o * sd);
          assert.ok(Math.abs(h - (w.y + 0.5)) < 0.7, spec.name + ': bờ suối phẳng, khô ở ' + [w.x, w.z].map(Math.round) + ' cách ' + o.toFixed(1));
        }
        sides[k].at(-1).push([w.x + nx * (w.w + w.f) * 0.5 * sd, w.z + nz * (w.w + w.f) * 0.5 * sd]);
      });
    });
    for (const B of sides) {
      assert.ok(B.flat().length > 60, spec.name + ': bờ suối đủ dài');
      for (const run of B.filter((r) => r.length > 1)) assert.ok(steepest(spec, run) < 0.5, spec.name + ': lối bờ suối đi được, dốc ' + steepest(spec, run).toFixed(2));
    }
  }
});
