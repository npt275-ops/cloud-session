// SamBox · src/world/islands/shape.js · Mảnh dựng hình dùng chung cho các đảo (thuần JS)
//   rgb(hex)                      '#rrggbb' → [r, g, b] 0..1
//   mix3(a, b, t)                 trộn hai màu
//   terrace(h, step, k)           bậc thang: mặt phẳng rộng, vách dốc ở cuối mỗi bậc (k: phần phẳng của bậc, 0..1)
//   RIM                           đai ven biển: dải đất phẳng chạy quanh mép mỗi đảo để xây tường thành { level: cao, bank: bờ kè,
//                                 width: bề rộng } (đơn vị bản vẽ)
//   coast(land, d, edge, cliff)   mặt cắt bờ: ngoài mép (edge: bán kính bờ ở hướng đó) dốc xuống đáy biển; từ mép vào là bờ kè ngắn
//                                 lên đai ven biển phẳng, hết đai thì lên đất liền: vách dựng (cliff 1) hay sườn thoải (cliff 0)
//   onRim(u)                      0..1: điểm cách mép bờ u (đo vào trong) nằm trên đai ven biển (dọn cây, chừa chỗ tường thành)
//   keepRim(h, u)                 ép lại đai ven biển phẳng sau khi khoét lối đi
//   bump(x, z, cx, cz, r)         khối đồi hình chuông (Gauss) tâm (cx, cz), bán kính r
//   lineDist(pts, x, z)           khoảng cách tới đường gấp khúc pts [[x, z], ...] (sông, hẻm vực, vịnh hẹp, thung băng)
//   shoreEdge(x, z, R, seed, k)   bán kính bờ theo hướng: mũi đất và vịnh xen nhau (k: độ khúc khuỷu). Chỉ phụ thuộc hướng (nhiễu lấy
//                                 trên một vòng tròn) nên đai ven biển đo theo bán kính rộng đều quanh đảo; mặt đảo dùng bờ chung, lưng
//                                 và hai sườn có bờ tối thiểu (lanes.js FACE, BACK, SIDE)
//   placed(spec, k, ky, turn)     đặt đảo vào bể: phóng ngang × k, cao × ky, xoay turn (radian, quanh trục đứng, chiều x → z);
//                                 đảo vẽ theo bán kính gốc, mặt đảo (phía +z của bản vẽ) quay về hướng layout chọn
import { smooth, lerp, fbm } from '../../core/noise.js';
import { FACE, BACK, SIDE } from './lanes.js';

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
// giữ đai ven biển phẳng sau khi khoét lối đi (bờ đường đắp tới sát bờ biển không làm gợn đai)
export const keepRim = (h, u) => lerp(h, RIM.level, smooth(RIM.bank, RIM.bank + 1, u) * smooth(RIM.bank + RIM.width + 1, RIM.bank + RIM.width, u));
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
  let e = lerp(own, FACE, smooth(0.5, 0.78, Math.sin(a))); // mặt đảo: bờ chung cả ba đảo (đầu cầu trùng khớp)
  e = lerp(e, Math.max(e, SIDE), smooth(0.9, 0.95, Math.abs(Math.cos(a)))); // hai sườn đủ rộng cho nền phẳng (lanes.js PADS)
  return lerp(e, Math.max(e, BACK), smooth(-0.55, -0.8, Math.sin(a))); // lưng đảo đủ rộng cho núi chắn sau khu nhà chính
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
    buildZone: spec.buildZone && local(spec.buildZone),
  };
}
