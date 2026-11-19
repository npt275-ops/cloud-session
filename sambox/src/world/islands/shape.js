// SamBox · src/world/islands/shape.js · Mảnh dựng hình dùng chung cho các đảo (thuần JS)
//   rgb(hex)                      '#rrggbb' → [r, g, b] 0..1
//   mix3(a, b, t)                 trộn hai màu
//   terrace(h, step, k)           bậc thang: mặt phẳng rộng, vách dốc ở cuối mỗi bậc (k: phần phẳng của bậc, 0..1)
//   coast(x, z, edge, cliff, deep) mặt cắt bờ biển: trong đất liền giữ độ cao, ra tới bờ thì dốc xuống đáy biển; cliff 0..1
//                                 trộn giữa bãi thoải (0) và vách dựng (1); edge: bán kính bờ ở hướng đó
//   bump(x, z, cx, cz, r)         khối đồi hình chuông (Gauss) tâm (cx, cz), bán kính r
import { smooth, lerp } from '../../core/noise.js';

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
export function coast(land, d, edge, cliff) {
  const e = (edge - d) / 18; // (đơn vị 18: chiều sâu vào đất liền tính theo bậc)
  if (e < 0) return Math.max(SEA_FLOOR, -12 + e * 14);
  const k = lerp(smooth(0, 1.5, e), smooth(0, 0.1, e), cliff);
  return lerp(-12, land, k);
}
export const bump = (x, z, cx, cz, r) => Math.exp(-((x - cx) ** 2 + (z - cz) ** 2) / (2 * r * r));
