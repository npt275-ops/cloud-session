// SamBox · src/nature/placement.js · Rải cây cỏ lên đảo theo luật mọc của đảo (spec.flora): chỗ nào, bao nhiêu
//   scatter(I, rule, k)  điểm mọc [{ x, y, z, rot, s }] (toạ độ thế giới) của một luật; k: hệ số số lượng theo mức đồ hoạ.
//                        Gieo ngẫu nhiên có hạt giống (đảo dựng lại y hệt), nhận điểm theo xác suất rule.where(x, z, y, dốc)
import { rng } from '../core/noise.js';
import { slopeAt } from '../world/terrain.js';

const seedOf = (s) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
export function scatter(I, rule, k) {
  const spec = I.spec,
    want = Math.max(1, Math.round(rule.count * k)),
    r = rng(seedOf(spec.key + rule.type)),
    out = [];
  for (let tries = 0; tries < want * 12 && out.length < want; tries++) {
    const a = r() * Math.PI * 2,
      d = Math.sqrt(r()) * spec.radius,
      x = Math.cos(a) * d,
      z = Math.sin(a) * d,
      y = spec.height(x, z);
    if (y < -0.5) continue;
    if (r() > rule.where(x, z, y, slopeAt(spec, x, z))) continue;
    out.push({ x: x + I.x, y, z: z + I.z, rot: r() * Math.PI * 2, s: 0.75 + r() * 0.5 });
  }
  return out;
}
