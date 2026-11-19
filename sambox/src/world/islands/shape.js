// SamBox · src/world/islands/shape.js · Mảnh dựng hình dùng chung cho các đảo (thuần JS)
//   rgb(hex)                      '#rrggbb' → [r, g, b] 0..1
//   mix3(a, b, t)                 trộn hai màu
//   terrace(h, step, k)           bậc thang: mặt phẳng rộng, vách dốc ở cuối mỗi bậc (k: phần phẳng của bậc, 0..1)
//   coast(x, z, edge, cliff, deep) mặt cắt bờ biển: trong đất liền giữ độ cao, ra tới bờ thì dốc xuống đáy biển; cliff 0..1
//                                 trộn giữa bãi thoải (0) và vách dựng (1); edge: bán kính bờ ở hướng đó
//   bump(x, z, cx, cz, r)         khối đồi hình chuông (Gauss) tâm (cx, cz), bán kính r
//   lineDist(pts, x, z)           khoảng cách tới đường gấp khúc pts [[x, z], ...] (sông, hẻm vực, vịnh hẹp, thung băng)
//   shoreEdge(x, z, R, seed, k)   bán kính bờ theo hướng: mũi đất và vịnh xen nhau (k: độ khúc khuỷu)
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
export function coast(land, d, edge, cliff) {
  const e = (edge - d) / 18; // (đơn vị 18: chiều sâu vào đất liền tính theo bậc)
  if (e < 0) return Math.max(SEA_FLOOR, -12 + e * 14);
  const k = lerp(smooth(0, 1.5, e), smooth(0, 0.1, e), cliff);
  return lerp(-12, land, k);
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
  const a = Math.atan2(z, x);
  return R * (0.8 + k * (0.07 * Math.sin(3 * a + seed) + 0.05 * Math.sin(5 * a + seed * 2.3))) + 30 * fbm(x * 0.007 + seed, z * 0.007, 3);
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
