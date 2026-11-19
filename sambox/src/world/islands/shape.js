// SamBox · src/world/islands/shape.js · Mảnh dựng hình dùng chung cho các đảo (thuần JS)
//   rgb(hex)                      '#rrggbb' → [r, g, b] 0..1
//   mix3(a, b, t)                 trộn hai màu
//   terrace(h, step, k)           bậc thang: mặt phẳng rộng, vách dốc ở cuối mỗi bậc (k: phần phẳng của bậc, 0..1)
//   RIM                           đai ven biển: dải đất phẳng chạy quanh mép mỗi đảo để xây tường thành { level: cao, bank: bờ kè,
//                                 width: bề rộng } (đơn vị bản vẽ)
//   coast(land, d, edge, cliff)   mặt cắt bờ: ngoài mép (edge: bán kính bờ ở hướng đó) dốc xuống đáy biển; từ mép vào là bờ kè ngắn
//                                 lên đai ven biển phẳng, hết đai thì lên đất liền: vách dựng (cliff 1) hay sườn thoải (cliff 0)
//   onRim(u)                      0..1: điểm cách mép bờ u (đo vào trong) nằm trên đai ven biển (dọn cây, chừa chỗ tường thành)
//   VALLEY                        hẻm nhà chính, dùng chung cho cả ba đảo (cùng toạ độ bản vẽ nên khi xoay vào bể ba nhà chính
//                                 thành tam giác đều quanh tâm bể, đường từ đầu cầu lên nhà chính dài như nhau): hall tâm nền nhà
//                                 chính (gần lưng đảo, núi chắn sau lưng); heads hai đầu cầu trên đai ven biển hai bên cửa hẻm;
//                                 mouth cửa hẻm; steps bậc lòng hẻm [z mốc, cao thêm]; face bán kính bờ chung ở mặt đảo; back bán kính
//                                 bờ tối thiểu ở lưng đảo (chỗ cho núi sau nhà chính); eye chỗ đứng tầm mắt (up: cao hơn mặt đất)
//   valleyLevel(x, z)             độ cao lòng hẻm: cửa hẻm bằng đai ven biển, đi vào trong qua mỗi mốc lên một bậc (vách bậc), giữa
//                                 hẻm là dốc nối bậc (đường lính đi lên), nền nhà chính cao nhất
//   valleyFloor(x, z)             0..1: điểm nằm trong lòng hẻm (chỗ xây, dọn cây)
//   withValley(land, x, z, wall)  khoét hẻm vào đất riêng của đảo: lòng hẻm phẳng theo bậc; hai bên và sau nhà chính là vách cao
//                                 hơn lòng hẻm ít nhất wall; ra xa hẻm thì về địa hình riêng của đảo
//   roadPath(side)                đường lính trên bản vẽ: đầu cầu (0 trái, 1 phải) → cửa hẻm → thẳng lên nhà chính
//   bump(x, z, cx, cz, r)         khối đồi hình chuông (Gauss) tâm (cx, cz), bán kính r
//   lineDist(pts, x, z)           khoảng cách tới đường gấp khúc pts [[x, z], ...] (sông, hẻm vực, vịnh hẹp, thung băng)
//   shoreEdge(x, z, R, seed, k)   bán kính bờ theo hướng: mũi đất và vịnh xen nhau (k: độ khúc khuỷu). Chỉ phụ thuộc hướng (nhiễu lấy
//                                 trên một vòng tròn) nên đai ven biển đo theo bán kính rộng đều quanh đảo; mặt đảo dùng bờ chung VALLEY.face
//   placed(spec, k, ky, turn)     đặt đảo vào bể: phóng ngang × k, cao × ky, xoay turn (radian, quanh trục đứng, chiều x → z);
//                                 đảo vẽ theo bán kính gốc, mặt đảo (phía +z của bản vẽ) quay về hướng layout chọn
import { smooth, lerp, fbm } from '../../core/noise.js';

export function rgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}
export const mix3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
export function terrace(h, step, k) {
  const base = Math.floor(h / step) * step,
    f = (h - base) / step;
  return base + smooth(k, 1, f) * step;
}
export const SEA_FLOOR = -38;
export const RIM = { level: 4, bank: 3, width: 18 };
export function coast(land, d, edge, cliff) {
  const u = edge - d; // (đo vào trong từ mép bờ; âm: ngoài biển)
  if (u < 0) return Math.max(SEA_FLOOR, -3 + u * 0.8);
  if (u < RIM.bank) return lerp(-3, RIM.level, smooth(0, RIM.bank, u)); // bờ kè
  const t = u - RIM.bank - RIM.width;
  return t < 0 ? RIM.level : lerp(RIM.level, land, smooth(0, lerp(40, 5, cliff), t));
}
export const onRim = (u) => smooth(-1, 1, u) * smooth(RIM.bank + RIM.width + 8, RIM.bank + RIM.width + 2, u);
export const VALLEY = {
  hall: [0, -125],
  heads: [[-70, 214], [70, 214]],
  mouth: [0, 200],
  steps: [[165, 12], [45, 14], [-90, 16]], // cửa 4 → lòng hẻm 16 → thị trấn 30 → nền nhà chính 46
  face: 236,
  back: 268,
  eye: { from: [0, -100], to: [0, 165], up: 42 }, // tầm mắt từ ban công tháp nhà chính nhìn xuống hẻm
};
export const roadPath = (side) => [VALLEY.heads[side], VALLEY.mouth, VALLEY.hall];
const halfWidth = (z) => 62 + 48 * smooth(VALLEY.hall[1], 210, z); // nửa bề rộng lòng hẻm: hẹp ở nhà chính, rộng ở cửa
function valleyOut(x, z) {
  const hz = VALLEY.hall[1],
    d = z >= hz ? Math.abs(x) - halfWidth(z) : Math.hypot(x, (z - hz) * 1.8) - halfWidth(hz); // (cuối hẻm bo tròn sau nền nhà chính)
  return d + 4 * fbm(x * 0.03 + 11, z * 0.03, 2); // > 0: ra ngoài lòng hẻm
}
export const valleyFloor = (x, z) => smooth(6, 0, valleyOut(x, z));
export function valleyLevel(x, z) {
  const f = z + 6 * fbm(x * 0.02 + 3, z * 0.02, 2); // (mép bậc lượn nhẹ, không thẳng như kẻ)
  let L = RIM.level;
  for (const [zc, rise] of VALLEY.steps) {
    const w = 4 + 42 * smooth(18, 9, Math.abs(x)); // vách bậc dày 4; giữa hẻm là dốc dài 46 cho đường lính
    L += rise * smooth(zc + w / 2, zc - w / 2, f);
  }
  return L;
}
export function withValley(land, x, z, wall) {
  const out = valleyOut(x, z);
  if (out > 95) return land;
  const L = valleyLevel(x, z),
    sides = lerp(Math.max(land, L + wall * smooth(2, 28, out)), land, smooth(50, 90, out)); // vách hẻm, xa dần về đất riêng
  return lerp(sides, L, smooth(6, 0, out));
}
export const bump = (x, z, cx, cz, r) => Math.exp(-((x - cx) ** 2 + (z - cz) ** 2) / (2 * r * r));
export function lineDist(pts, x, z) {
  let best = 1e9;
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, az] = pts[i],
      [bx, bz] = pts[i + 1],
      dx = bx - ax,
      dz = bz - az,
      t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz)));
    best = Math.min(best, Math.hypot(x - ax - dx * t, z - az - dz * t));
  }
  return best;
}
export function shoreEdge(x, z, R, seed, k = 1) {
  const a = Math.atan2(z, x),
    own = R * (0.8 + k * (0.07 * Math.sin(3 * a + seed) + 0.05 * Math.sin(5 * a + seed * 2.3))) + 30 * fbm(Math.cos(a) * 1.7 + seed, Math.sin(a) * 1.7, 3);
  const e = lerp(own, VALLEY.face, smooth(0.5, 0.78, Math.sin(a))); // mặt đảo: bờ chung cả ba đảo (cửa hẻm, đầu cầu trùng khớp)
  return lerp(e, Math.max(e, VALLEY.back), smooth(-0.55, -0.8, Math.sin(a))); // lưng đảo đủ rộng cho núi chắn sau nhà chính
}
export function placed(spec, k, ky, turn = 0) {
  const c = Math.cos(turn) / k,
    s = Math.sin(turn) / k,
    local = (f) => (x, z, ...rest) => f(c * x + s * z, c * z - s * x, ...rest); // (toạ độ trong bể → toạ độ bản vẽ)
  return {
    ...spec,
    radius: spec.radius * k,
    cliff: { ...spec.cliff, freq: spec.cliff.freq / ky },
    height: local((x, z) => spec.height(x, z) * ky),
    ground: local((x, z, y, sl) => spec.ground(x, z, y / ky, sl)),
    flora: spec.flora.map((r) => ({ ...r, where: local((x, z, y, sl) => r.where(x, z, y / ky, sl)) })),
  };
}
