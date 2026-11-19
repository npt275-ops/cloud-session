// SamBox · src/world/islands/lanes.js · Khung đường chiến thuật dùng chung cho ba đảo (thuần JS; toạ độ bản vẽ, mặt đảo phía +z).
// Cùng một khung nên khi xoay vào bể: ba nhà chính thành tam giác đều, các lối đi trên ba đảo dài bằng nhau (cân bằng), còn địa
// hình xung quanh mỗi đảo một kiểu (islands/*.js).
//   HALL, TOWN        nhà chính và khu nhà chính (lòng chảo phẳng sau lưng đảo, núi chắn sau): chỗ DUY NHẤT xây công trình
//   HEADS, GATES      hai đầu cầu (trên đai ven biển, hai bên cửa hẻm suối) và hai cổng khu nhà chính
//   LANES             hai đường chính (lính đi theo đợt): đầu cầu → men theo sườn đảo → cổng; sau cổng là đất xây, không còn đường
//   TRAILS            lối mòn xuyên rừng giữa: lối trước nối hai đường qua bến lội của hẻm suối; lối sau nối hai đường vào thẳng
//                     cửa sau khu nhà chính
//   GORGE, BACKPASS   hẻm suối giữa rừng (từ biển, giữa hai đầu cầu, lên cửa sau khu nhà chính) và đèo sau núi (lưng khu nhà chính
//                     ra đai ven biển phía sau)
//   FACE, BACK, EYE   bán kính bờ chung ở mặt đảo, bán kính bờ tối thiểu ở lưng đảo, chỗ đứng tầm mắt (ban công tháp nhà chính)
//   withPaths(land, x, z)  khoét khung đường vào đất riêng của đảo: khu nhà chính phẳng, nền nhà chính, hẻm, đèo, lối mòn, đường
//   paths(x, z)       chỗ này thuộc lối nào: { lane, trail, gorge, pass, town } 0..1 (tô màu đường, dọn cây)
//   route(side)       lối lính từ đầu cầu (0 trái, 1 phải) tới nhà chính: đường chính rồi qua cổng băng khu đất xây tới nhà chính
import { smooth, lerp, fbm } from '../../core/noise.js';

export const HALL = [0, -125];
export const TOWN = { cx: 0, cz: -110, rx: 118, rz: 58, level: 40, hall: 46 };
export const HEADS = [[-70, 214], [70, 214]];
export const GATES = [[-98, -92], [98, -92]];
export const FACE = 236;
export const BACK = 268;
export const EYE = { from: [0, -100], to: [0, 165], up: 42 }; // ban công tháp nhà chính nhìn xuống rừng giữa
const mirror = (P) => P.map(([x, z]) => [-x, z]);
const LEFT = [HEADS[0], [-115, 152], [-150, 90], [-157, 10], [-135, -55], GATES[0]];
export const LANES = [LEFT, mirror(LEFT)];
export const GORGE = [[0, -52], [-28, 10], [18, 70], [-12, 140], [8, 200], [0, 238]];
const FORD = [8, 92]; // bến lội: lối mòn trước cắt ngang hẻm suối
const FRONT = [[-150, 90], [-105, 78], [-55, 96], FORD, [60, 96], [105, 78], [150, 90]];
const REAR = [[-148, -16], [-95, -12], [-40, -40], GORGE[0], [40, -40], [95, -12], [148, -16]];
export const TRAILS = [FRONT, REAR];
export const BACKPASS = [[0, -168], [-22, -205], [8, -240], [0, -272]];

// đường gấp khúc có tham số: khoảng cách gần nhất d và vị trí s (0..1 theo chiều dài); xa hơn reach thì bỏ qua (dò nhanh)
function poly(P, reach) {
  const seg = P.slice(1).map((q, i) => {
    const [ax, az] = P[i],
      [bx, bz] = q;
    return { ax, az, dx: bx - ax, dz: bz - az, len: Math.hypot(bx - ax, bz - az), x0: Math.min(ax, bx) - reach, x1: Math.max(ax, bx) + reach, z0: Math.min(az, bz) - reach, z1: Math.max(az, bz) + reach };
  });
  const total = seg.reduce((a, g) => a + g.len, 0);
  const f = (x, z) => {
    let d = Infinity,
      s = 0,
      acc = 0;
    for (const g of seg) {
      if (x >= g.x0 && x <= g.x1 && z >= g.z0 && z <= g.z1) {
        const t = Math.max(0, Math.min(1, ((x - g.ax) * g.dx + (z - g.az) * g.dz) / (g.len * g.len))),
          e = Math.hypot(x - g.ax - g.dx * t, z - g.az - g.dz * t);
        if (e < d) [d, s] = [e, (acc + g.len * t) / total];
      }
      acc += g.len;
    }
    return { d, s };
  };
  f.total = total;
  return f;
}
const curve = (K) => (s) => {
  for (let i = 0; i < K.length - 1; i++) if (s <= K[i + 1][0]) return lerp(K[i][1], K[i + 1][1], smooth(K[i][0], K[i + 1][0], s));
  return K[K.length - 1][1];
};
// độ cao mặt đường theo s: bến 4 → nền tháp ngoài 18 → nền tháp trong 30 → cổng khu nhà chính 40
const laneY = curve([[0, 4], [0.08, 4], [0.32, 18], [0.44, 18], [0.68, 30], [0.78, 30], [1, 40]]);
const gorgeY = curve([[0, 40], [0.12, 28], [0.3, 19], [0.6, 11], [0.9, 6], [1, 4]]);
const passY = curve([[0, 40], [0.5, 26], [1, 4]]);
const lane = LANES.map((P) => poly(P, 30)),
  gorge = poly(GORGE, 28),
  pass = poly(BACKPASS, 20);
const fordS = (() => {
  const g = poly(GORGE, 1e9)(...FORD);
  return gorgeY(g.s); // (độ cao lòng hẻm ở bến lội: lối mòn trước xuống tới đây)
})();
const trailY = [
  curve([[0, 18], [0.2, 22], [0.4, 22], [0.5, fordS], [0.6, 22], [0.8, 22], [1, 18]]), // lối trước: xuống bến lội rồi lên
  curve([[0, 30], [0.25, 34], [0.45, 38], [0.5, 40], [0.55, 38], [0.75, 34], [1, 30]]), // lối sau: lên tới cửa sau khu nhà chính
];
const trail = TRAILS.map((P) => poly(P, 16));
const townOut = (x, z) => Math.hypot((x - TOWN.cx) / TOWN.rx, (z - TOWN.cz) / TOWN.rz) + 0.08 * fbm(x * 0.03 + 5, z * 0.03, 2);
export const inTown = (x, z) => smooth(1.0, 0.94, townOut(x, z));

// nhớ một điểm vừa tính (độ cao, màu đất và luật mọc cây hỏi lại đúng điểm đó liên tiếp)
let kx = NaN,
  kz = NaN,
  kv = null;
function near(x, z) {
  if (x === kx && z === kz) return kv;
  kx = x;
  kz = z;
  return (kv = { lane: lane.map((f) => f(x, z)), trail: trail.map((f) => f(x, z)), gorge: gorge(x, z), pass: pass(x, z) });
}
export function withPaths(land, x, z) {
  const n = near(x, z);
  let h = lerp(land, TOWN.level, inTown(x, z)); // khu nhà chính: lòng chảo phẳng, núi sau lưng thành vách
  h = lerp(h, TOWN.hall, smooth(32, 26, Math.hypot(x - HALL[0], z - HALL[1]))); // nền nhà chính, cao nhất
  // hẻm suối, đèo: hai bên chỉ xẻ xuống (thành vách), lòng thì phẳng đúng dốc (đắp cả chỗ trũng: ba đảo đi như nhau)
  if (n.gorge.d < 26) {
    const y = gorgeY(n.gorge.s);
    h = lerp(lerp(h, Math.min(h, y), smooth(16, 6, n.gorge.d)), y, smooth(9, 6, n.gorge.d));
  }
  if (n.pass.d < 18) {
    const y = passY(n.pass.s);
    h = lerp(lerp(h, Math.min(h, y), smooth(12, 4, n.pass.d)), y, smooth(7, 4, n.pass.d));
  }
  n.trail.forEach((t, i) => {
    if (t.d < 16) h = lerp(h, trailY[i](t.s), smooth(16, 4, t.d)); // lối mòn: lòng lối phẳng, hai bên đắp hoặc xẻ
  });
  for (const l of n.lane) if (l.d < 28) h = lerp(h, laneY(l.s), smooth(28, 9, l.d)); // đường chính
  return h;
}
export function paths(x, z) {
  const n = near(x, z);
  return {
    lane: Math.max(...n.lane.map((l) => smooth(8, 6, l.d))),
    trail: Math.max(...n.trail.map((t) => smooth(5, 3, t.d))),
    gorge: smooth(7, 4, n.gorge.d),
    pass: smooth(5, 3, n.pass.d),
    town: inTown(x, z),
  };
}
// suối ở khúc dưới hẻm, chảy sát một bên lòng hẻm (bên kia vẫn đi được), ra biển giữa hai đầu cầu; bến lội ở khúc trên nên khô
export const STREAM = GORGE.slice(3).map(([x, z]) => [x + 4, z]);
export const route = (side) => [...LANES[side], HALL];
