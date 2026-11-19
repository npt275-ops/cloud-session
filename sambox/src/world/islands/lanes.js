// SamBox · src/world/islands/lanes.js · Khung đường chiến thuật dùng chung cho ba đảo (thuần JS; toạ độ bản vẽ, mặt đảo phía +z).
// Cùng một khung nên khi xoay vào bể: ba nhà chính thành tam giác đều, các lối đi trên ba đảo dài bằng nhau (cân bằng); địa hình
// xung quanh và dáng suối mỗi đảo một kiểu (islands/*.js, createPaths).
//   HALL, TOWN        nhà chính và khu nhà chính: lòng chảo trũng (thấp hơn cổng) sau lưng đảo, núi chắn sau: chỗ DUY NHẤT xây
//                     công trình
//   RING              vành đồi kín quanh khu nhà chính (cao hơn khu up; đỉnh vành cách mép khu crest, chân vành foot): đứng trong khu
//                     không thấy cổng, đầu cầu, cầu. Mọi lối vào khu đều gãy khúc khi xuyên vành (không có khe thẳng để nhìn ra)
//   HEADS, GATES      hai đầu cầu (trên đai ven biển, hai bên cửa hẻm suối) và hai cổng (chân vành đồi, ngoài khe vào khu)
//   LANES             hai đường chính (lính đi theo đợt): đầu cầu → men theo sườn đảo → cổng → khe gãy khúc xuyên vành đồi xuống
//                     khu nhà chính. Chỉ lát đường tới cổng; khe sau cổng là lối đất (không còn đường)
//   DOOR              cửa trước khu nhà chính: khe gấp khúc chữ Z xuyên vành đồi từ khu xuống ngã ba đầu hẻm suối (chân vành đồi)
//   TRAILS            lối mòn xuyên rừng giữa: lối trước nối hai đường qua bến lội FORD của suối; lối sau men chân vành đồi, nối hai
//                     đường vào ngã ba (từ đó lên cửa trước vào khu, hay xuôi hẻm suối ra biển)
//   BACKPASS          đèo sau núi: lưng khu nhà chính vượt yên đèo ra đai ven biển phía sau
//   FACE, BACK, EYE   bán kính bờ chung ở mặt đảo, bán kính bờ tối thiểu ở lưng đảo, chỗ đứng tầm mắt (hiên nhà chính nhìn ra khu)
//   inTown(x, z)      0..1: thuộc khu nhà chính
//   route(side)       lối lính từ đầu cầu (0 trái, 1 phải) tới nhà chính: đường chính, qua cổng, qua khe, băng khu đất xây
//   createPaths(o)    khung đường riêng của một đảo (dáng suối riêng, chiều dài bằng nhau): o.bends hệ số khúc uốn, o.pool chỗ vũng
//                     (z), o.seed nhiễu vành đồi. Trả về:
//     .gorge          tim hẻm suối [[x, z], ...]: ngã ba chân vành đồi → uốn lượn qua bến lội → cửa hẻm ở đai ven biển
//     .stream         mặt nước suối [{ x, z, a, y, w, f }] (a: quãng đường từ ngã ba, y: mặt nước, w: nửa bề rộng mặt nước, f: nửa bề
//                     rộng lòng hẻm: hai bờ đi được từ mép nước tới f), từ mạch nước dưới ngã ba ra tới biển
//     .ring(x, z)     độ cao vành đồi (0 ngoài vành); đảo tự nặn theo chất đất của mình (bậc thềm, vân đá, sống băng) rồi lấy max
//     .walls(x, z)    vách hai bên hẻm (o.canyon: cao hơn lòng hẻm bao nhiêu; 0 thì không có) cho đảo đất thấp
//     .withPaths(land, x, z)  khoét khung đường vào đất: khu nhà chính, nền nhà chính, hẻm suối (lòng rộng: suối giữa, hai bờ đi
//                     được), đèo, lối mòn, đường chính, khe sau cổng, cửa trước
//     .channel(h, x, z)  khoét lòng suối (sau khi ép đai ven biển phẳng nên suối chảy qua đai ra biển; chỗ bến lội nông)
//     .paths(x, z)    chỗ này thuộc lối nào: { lane, defile, trail, gorge, stream, pass, town } 0..1 (tô màu, dọn cây)
import { smooth, lerp, fbm } from '../../core/noise.js';

export const HALL = [0, -125];
export const TOWN = { cx: 0, cz: -110, rx: 118, rz: 58, level: 22, hall: 26 };
export const RING = { up: 38, crest: 14, foot: 56 };
export const HEADS = [[-70, 214], [70, 214]];
export const FACE = 236;
export const BACK = 268;
export const EYE = { from: [-70, -145], to: [40, -70], up: 16 };
const mirror = (P) => P.map(([x, z]) => [-x, z]);
// đường chính trái: đầu cầu, khuỷu sườn, bến tháp ngoài (nối lối mòn trước), bến tháp trong (nối lối mòn sau), cổng, khe gãy khúc
const LEFT = [HEADS[0], [-115, 152], [-150, 90], [-157, 10], [-162, -50], [-160, -96], [-132, -110], [-106, -110]];
export const LANES = [LEFT, mirror(LEFT)];
export const GATES = LANES.map((L) => L[4]);
const CONF = [0, 6]; // ngã ba ở chân vành đồi: lối mòn sau, cửa trước khu nhà chính, đầu hẻm suối
export const DOOR = [[0, TOWN.cz + TOWN.rz], [-8, -48], [-38, -44], [-50, -36], [-50, -24], [-38, -16], [-12, -8], CONF]; // (cua tay áo)
export const FORD = [0, 110]; // bến lội: lối mòn trước cắt ngang suối (giữa khúc uốn trên và khúc uốn dưới)
const MOUTH = [0, 214]; // cửa hẻm: mép trong đai ven biển, giữa hai đầu cầu
const FRONT = [LEFT[2], [-108, 86], [-58, 106], FORD, [58, 106], [108, 86], mirror(LEFT)[2]];
const REAR = [LEFT[3], [-108, 14], [-55, 12], CONF, [55, 12], [108, 14], mirror(LEFT)[3]];
export const TRAILS = [FRONT, REAR];
export const BACKPASS = [[0, -168], [-22, -205], [8, -240], [0, -272]];
// chiều dài hai khúc suối (ngã ba → bến lội, bến lội → cửa hẻm): ba đảo uốn khác nhau nhưng dài đúng bằng nhau
const UPPER = 116,
  LOWER = 124,
  GORGE_LEN = UPPER + LOWER;

// đường gấp khúc có tham số: khoảng cách gần nhất d, quãng đường a từ điểm đầu tới chỗ gần nhất, s = a / tổng; xa hơn reach thì bỏ
// qua (đoạn được chia vào ô lưới 32 nên mỗi lần hỏi chỉ xét vài đoạn)
function poly(P, reach) {
  const CS = 32,
    grid = new Map();
  let acc = 0;
  P.slice(1).forEach((q, i) => {
    const [ax, az] = P[i],
      [bx, bz] = q,
      g = { ax, az, dx: bx - ax, dz: bz - az, len: Math.hypot(bx - ax, bz - az), a0: acc };
    acc += g.len;
    for (let cx = Math.floor((Math.min(ax, bx) - reach) / CS); cx <= Math.floor((Math.max(ax, bx) + reach) / CS); cx++)
      for (let cz = Math.floor((Math.min(az, bz) - reach) / CS); cz <= Math.floor((Math.max(az, bz) + reach) / CS); cz++) {
        const k = cx * 4096 + cz;
        if (!grid.has(k)) grid.set(k, []);
        grid.get(k).push(g);
      }
  });
  const f = (x, z) => {
    let d = Infinity,
      a = 0;
    for (const g of grid.get(Math.floor(x / CS) * 4096 + Math.floor(z / CS)) || []) {
      const t = Math.max(0, Math.min(1, ((x - g.ax) * g.dx + (z - g.az) * g.dz) / (g.len * g.len))),
        e = Math.hypot(x - g.ax - g.dx * t, z - g.az - g.dz * t);
      if (e < d) [d, a] = [e, g.a0 + g.len * t];
    }
    return { d, a, s: a / acc };
  };
  f.total = acc;
  return f;
}
const curve = (K) => (s) => {
  for (let i = 0; i < K.length - 1; i++) if (s <= K[i + 1][0]) return lerp(K[i][1], K[i + 1][1], smooth(K[i][0], K[i + 1][0], s));
  return K[K.length - 1][1];
};
const at = (P) => P.reduce((c, p, i) => [...c, i ? c[i - 1] + Math.hypot(p[0] - P[i - 1][0], p[1] - P[i - 1][1]) : 0], []);
// độ cao mặt đường theo quãng đường: bến 4 → nền tháp ngoài 12 → nền tháp trong 20 → cổng 24 → yên khe 27 → xuống khu nhà chính 22
const LA = at(LEFT),
  GATE_A = LA[4];
const laneY = curve([[0, 4], [20, 4], [LA[2] - 38, 12], [LA[2] + 12, 12], [LA[3] - 23, 20], [GATE_A - 26, 20], [GATE_A, 24], [GATE_A + 32, 27], [LA[7], TOWN.level]]);
// lòng hẻm suối: từ ngã ba (20) xuống dần tới đai ven biển (4), dốc tăng dần về phía biển
const gorgeY = (a) => 20 - 16 * Math.pow(Math.min(1, Math.max(0, a / GORGE_LEN)), 1.25);
// cửa trước: từ khu nhà chính lên yên khe giữa vành đồi rồi xuống ngã ba
const DA = at(DOOR),
  doorY = curve([[0, TOWN.level], [DA[1], TOWN.level + 0.5], [DA[3], 30], [DA[4], 30], [DA[6], 23], [DA[7], gorgeY(0)]]);
const passY = curve([[0, TOWN.level], [0.3, 30], [0.45, 30], [1, 4]]);
const trailY = [
  curve([[0, 12], [0.15, 15], [0.38, 15], [0.5, gorgeY(UPPER)], [0.62, 15], [0.85, 15], [1, 12]]), // lối trước: xuống bến lội
  curve([[0, 20], [0.2, 21], [0.4, 21], [0.5, gorgeY(0)], [0.6, 21], [0.8, 21], [1, 20]]), // lối sau: men chân vành đồi tới ngã ba
];
const lane = LANES.map((P) => poly(P, 30)),
  trail = TRAILS.map((P) => poly(P, 16)),
  pass = poly(BACKPASS, 20),
  door = poly(DOOR, 20);
const townOut = (x, z) => Math.hypot((x - TOWN.cx) / TOWN.rx, (z - TOWN.cz) / TOWN.rz) + 0.08 * fbm(x * 0.03 + 5, z * 0.03, 2);
export const inTown = (x, z) => smooth(1.0, 0.94, townOut(x, z));
// khoảng cách tính ra ngoài từ mép khu nhà chính (theo tia từ tâm khu; âm: trong khu)
function gap(x, z) {
  const dx = x - TOWN.cx,
    dz = z - TOWN.cz,
    o = townOut(x, z),
    r = Math.hypot(dx, dz);
  return r < 1e-6 ? -TOWN.rz : (r * (o - 1)) / Math.max(o, 1e-6);
}
export const route = (side) => [...LANES[side], HALL];

export function createPaths({ bends, pool, seed = 0, canyon = 0 }) {
  // tim suối khúc giữa: x = k · Σ c_i sin(πu) sin(iπu) theo z (u 0..1 từ ngã ba tới cửa hẻm): hai đầu thẳng hướng dọc; c1 = c3 nên
  // bến lội ở chính giữa x = 0. Khúc trên, khúc dưới co giãn riêng (ku, kl) cho dài đúng UPPER, LOWER
  const zC = CONF[1],
    zM = MOUTH[1],
    shape = (z) => {
      const u = (z - zC) / (zM - zC);
      return bends.reduce((b, c, i) => b + c * Math.sin(Math.PI * u) * Math.sin((i + 1) * Math.PI * u), 0);
    };
  const build = (ku, kl) => {
    const P = [];
    for (let z = zC; z <= zM + 1e-9; z += 2) P.push([lerp(ku, kl, smooth(FORD[1] - 22, FORD[1] + 22, z)) * shape(z), z]);
    return P;
  };
  const len = (P, z0, z1) => P.slice(1).reduce((s, p, i) => s + (p[1] > z0 && p[1] <= z1 + 1e-9 ? Math.hypot(p[0] - P[i][0], p[1] - P[i][1]) : 0), 0);
  const fit = (want, f) => {
    let lo = 0,
      hi = 4;
    for (let i = 0; i < 60; i++) {
      const m = (lo + hi) / 2;
      if (f(m) < want) lo = m;
      else hi = m;
    }
    return (lo + hi) / 2;
  };
  let ku = 1,
    kl = 1;
  for (let r = 0; r < 4; r++) {
    ku = fit(UPPER, (k) => len(build(k, kl), zC, FORD[1]));
    kl = fit(LOWER, (k) => len(build(ku, k), FORD[1], zM));
  }
  const gorge = build(ku, kl),
    G = poly(gorge, 48);
  // vũng (chỗ suối phình rộng) và bến lội tính theo quãng đường dọc suối
  const near1 = (z0) => G(...gorge.reduce((b, p) => (Math.abs(p[1] - z0) < Math.abs(b[1] - z0) ? p : b))).a;
  const POOL_A = near1(pool),
    FORD_A = UPPER;
  const poolK = (a) => smooth(POOL_A - 16, POOL_A - 4, a) * smooth(POOL_A + 16, POOL_A + 4, a);
  const fordK = (a) => smooth(FORD_A - 14, FORD_A - 5, a) * smooth(FORD_A + 14, FORD_A + 5, a);
  const floorW = (a) => 13 + 6 * poolK(a); // nửa bề rộng lòng hẻm (suối giữa, hai bờ đi được)
  // lòng suối: mạch nước ngay dưới ngã ba (ngã ba khô), ra quá cửa hẻm thì băng qua đai ven biển xuống biển
  const SPRING = 4,
    SEA = GORGE_LEN + 30;
  const flow = [...gorge, [MOUTH[0], MOUTH[1] + 30]],
    S = poly(flow, 14);
  function bed(a) {
    const k = smooth(SPRING, SPRING + 16, a),
      p = poolK(a),
      wb = k * (2.6 + 6 * p),
      depth = k * (1.6 + 0.6 * p - 0.85 * fordK(a)),
      g = a <= GORGE_LEN ? gorgeY(a) : lerp(4, -1.4, smooth(GORGE_LEN, SEA - 6, a)); // (ngoài cửa hẻm: đai 4, bờ kè, mặt biển)
    return { g, bottom: g - depth, wb, we: wb + 0.1 + 2.3 * k, water: Math.max(0.04, g - Math.min(0.5, depth * 0.6)) }; // (we > wb: luôn có mép)
  }
  // mặt nước: mép nước là chỗ lòng suối cắt mặt nước (nghịch đảo smoothstep), lấn dưới bờ một chút
  const stream = [];
  for (let a = SPRING + 2; a <= SEA; a += 2) {
    const b = bed(a),
      { x, z } = pointAt(flow, a),
      depth = b.g - b.bottom,
      v = depth > 1e-3 ? Math.max(0, Math.min(1, (b.g - b.water) / depth)) : 1,
      t = 0.5 - Math.sin(Math.asin(1 - 2 * v) / 3);
    stream.push({ x, z, a, y: b.water, w: b.we - t * (b.we - b.wb) + 0.3, f: a <= GORGE_LEN ? floorW(a) : 0 });
  }
  const crest = (x, z) => RING.up * (1 + 0.18 * fbm(x * 0.022 + seed * 7.1, z * 0.022 - seed * 3.3, 3));
  const ring = (x, z) => {
    const g = gap(x, z);
    if (g > RING.foot) return 0;
    const top = TOWN.level + crest(x, z);
    return Math.min(TOWN.level + (top - TOWN.level) * smooth(-2, RING.crest, g), top * smooth(RING.foot, RING.crest + 14, g));
  };
  // vách hẻm: đảo đất thấp (cồn cát) nâng hai bên hẻm cao hơn lòng hẻm canyon thành khe vực (đứng trong khu không nhìn thấu hẻm)
  const walls = (x, z) => {
    const n = near(x, z).gorge;
    return canyon && n.d < 46 ? (gorgeY(n.a) + canyon) * smooth(46, 26, n.d) * smooth(GORGE_LEN, GORGE_LEN - 30, n.a) : 0;
  };
  // nhớ một điểm vừa tính (độ cao, màu đất và luật mọc cây hỏi lại đúng điểm đó liên tiếp)
  let kx = NaN,
    kz = NaN,
    kv = null;
  const near = (x, z) => {
    if (x === kx && z === kz) return kv;
    kx = x;
    kz = z;
    return (kv = { lane: lane.map((f) => f(x, z)), trail: trail.map((f) => f(x, z)), gorge: G(x, z), pass: pass(x, z), door: door(x, z), flow: S(x, z) });
  };
  function withPaths(land, x, z) {
    const n = near(x, z);
    let h = lerp(land, TOWN.level, inTown(x, z)); // khu nhà chính: lòng chảo phẳng
    h = lerp(h, TOWN.hall, smooth(32, 26, Math.hypot(x - HALL[0], z - HALL[1]))); // nền nhà chính, cao nhất khu
    // hẻm suối, đèo: hai bên chỉ xẻ xuống (thành vách), lòng thì phẳng đúng dốc (đắp cả chỗ trũng: ba đảo đi như nhau)
    if (n.gorge.d < 32) {
      const y = gorgeY(n.gorge.a),
        w = floorW(n.gorge.a);
      h = lerp(lerp(h, Math.min(h, y), smooth(w + 12, w, n.gorge.d)), y, smooth(w, w - 3, n.gorge.d));
    }
    if (n.pass.d < 18) {
      const y = passY(n.pass.s);
      h = lerp(lerp(h, Math.min(h, y), smooth(12, 4, n.pass.d)), y, smooth(7, 4, n.pass.d));
    }
    n.trail.forEach((t, i) => {
      if (t.d < 16) h = lerp(h, trailY[i](t.s), smooth(16, 4, t.d)); // lối mòn: lòng lối phẳng, hai bên đắp hoặc xẻ
    });
    // cửa trước: khe vách dựng, lòng hẹp
    if (n.door.d < 17) {
      const y = doorY(n.door.a);
      h = lerp(lerp(h, Math.min(h, y), smooth(17, 8, n.door.d)), y, smooth(8, 5, n.door.d));
    }
    // đường chính: tới cổng thì đắp, xẻ rộng hai bên; sau cổng là khe: vách dựng, lòng hẹp
    for (const l of n.lane)
      if (l.d < 28) {
        const y = laneY(l.a),
          k = smooth(GATE_A - 8, GATE_A + 8, l.a),
          road = lerp(h, y, smooth(28, 9, l.d)),
          cut = lerp(lerp(h, Math.min(h, y), smooth(17, 8, l.d)), y, smooth(8, 5, l.d));
        h = lerp(road, cut, k);
      }
    return h;
  }
  function channel(h, x, z) {
    const n = near(x, z).flow;
    if (n.d > 16) return h;
    const b = bed(n.a);
    return lerp(h, Math.min(h, b.bottom), smooth(b.we, b.wb, n.d));
  }
  function paths(x, z) {
    const n = near(x, z),
      b = n.flow.d < 16 ? bed(n.flow.a) : null;
    return {
      lane: Math.max(...n.lane.map((l) => smooth(8, 6, l.d) * smooth(GATE_A + 4, GATE_A - 4, l.a))),
      defile: Math.max(smooth(8, 6, n.door.d), ...n.lane.map((l) => smooth(8, 6, l.d) * smooth(GATE_A - 4, GATE_A + 4, l.a))),
      trail: Math.max(...n.trail.map((t) => smooth(5, 3, t.d))),
      gorge: n.gorge.d < 32 ? smooth(floorW(n.gorge.a), floorW(n.gorge.a) - 3, n.gorge.d) : 0,
      stream: b ? smooth(b.we + 0.6, b.wb + 0.6, n.flow.d) : 0,
      pass: smooth(5, 3, n.pass.d),
      town: inTown(x, z),
    };
  }
  return { gorge, stream, ring, walls, withPaths, channel, paths, pool: pointAt(flow, POOL_A) };
}
// điểm trên đường gấp khúc ở quãng đường a
function pointAt(P, a) {
  for (let i = 1; i < P.length; i++) {
    const l = Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]);
    if (a <= l || i === P.length - 1) {
      const t = Math.min(1, a / l);
      return { x: lerp(P[i - 1][0], P[i][0], t), z: lerp(P[i - 1][1], P[i][1], t) };
    }
    a -= l;
  }
}
