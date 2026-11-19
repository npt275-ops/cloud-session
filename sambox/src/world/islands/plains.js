// SamBox · src/world/islands/plains.js · Đảo Đồng Bằng (núi đồi, đồng cỏ): đảo mẫu theo ảnh đích (đảo ấm cúng, ảnh 5–14)
// Dáng: cao nguyên nhiều bậc mặt cỏ, vách đá dựng xuống biển (vài đoạn là bãi cát thoải), một đỉnh núi lớn phía tây bắc, đồi phụ
// phía đông bắc, hồ trong vịnh phía nam. Mặt bậc phẳng có đồng oải hương tím và đồng lúa mì vàng; rừng cây tán bông xù thành
// từng đám; đá lăn dưới chân vách.
import { fbm, ridged, simplex2, smooth } from '../../core/noise.js';
import { rgb, mix3, terrace, coast, bump } from './shape.js';

const R = 175;
const C = {
  grass: rgb('#8cc152'), grass2: rgb('#5e9e3e'), high: rgb('#86a35a'), sand: rgb('#ecd6a2'), wet: rgb('#c9ad7c'),
  rock: rgb('#d2b892'), rock2: rgb('#b0926c'), lav: rgb('#7f8a5c'), wheat: rgb('#c8a14a'),
};
// vùng đồng: oải hương, lúa mì (mặt phẳng, độ cao vừa)
const lavender = (x, z) => smooth(0.28, 0.42, fbm(x * 0.018 + 5.3, z * 0.018 - 2.1, 3));
const wheat = (x, z) => smooth(0.28, 0.42, fbm(x * 0.018 - 7.7, z * 0.018 + 4.4, 3));
const forest = (x, z) => smooth(0.0, 0.4, fbm(x * 0.014 + 11, z * 0.014 - 3, 3));

function height(x, z) {
  const d = Math.hypot(x, z),
    edge = R * 0.8 + 22 * fbm(x * 0.012, z * 0.012, 3);
  let land = 10 + 10 * fbm(x * 0.008, z * 0.008, 4) + 5 * fbm(x * 0.03, z * 0.03, 3);
  land += 82 * bump(x, z, -48, -38, 52) * (0.82 + 0.25 * ridged(x * 0.016, z * 0.016, 4));
  land += 34 * bump(x, z, 72, -58, 32);
  // bậc lớn, không đều: bậc chỉ rõ ở chỗ nhiễu cho phép, chỗ khác là sườn đồi thoải
  const tk = 0.35 + 0.45 * smooth(-0.3, 0.4, fbm(x * 0.01 + 3, z * 0.01, 2));
  land = (1 - tk) * land + tk * terrace(land, 15, 0.72);
  const cliff = 0.5 + 0.5 * simplex2(Math.atan2(z, x) * 1.6, 3.1);
  let h = coast(land, d, edge, smooth(-0.2, 0.3, cliff));
  // hồ trong vịnh phía nam
  h = h + (-4 - h) * smooth(32, 14, Math.hypot(x - 52, z - 72));
  return h;
}
function ground(x, z, y, slope) {
  if (slope > 0.62) return mix3(C.rock, C.rock2, 0.5 + 0.5 * Math.sin(y * 0.9 + fbm(x * 0.05, z * 0.05) * 3));
  if (y < 0.4) return C.wet;
  if (y < 2.2) return C.sand;
  let g = mix3(C.grass, C.grass2, 0.5 + 0.5 * fbm(x * 0.03, z * 0.03, 3));
  if (y > 55) g = mix3(g, C.high, smooth(55, 90, y));
  if (slope < 0.25 && y > 4 && y < 45) {
    g = mix3(g, C.lav, lavender(x, z) * 0.8);
    g = mix3(g, C.wheat, wheat(x, z) * 0.8);
  }
  return g;
}
const flat = (y, s, lo, hi, smax) => (y > lo && y < hi && s < smax ? 1 : 0);
export default {
  key: 'plains',
  name: 'Đồng Bằng',
  radius: R,
  cliff: { colors: ['#cdb898', '#c2ab88', '#d6c2a2', '#bba282'], freq: 1 / 5, range: [0.5, 0.7] }, // đá vôi ấm, vân nhẹ
  height,
  ground,
  // luật mọc: số lượng (mức Cao) và xác suất ở một điểm
  flora: [
    { type: 'fluffy', count: 950, where: (x, z, y, s) => flat(y, s, 2.5, 80, 0.45) * forest(x, z) * (1 - lavender(x, z)) * (1 - wheat(x, z)) },
    { type: 'grass', count: 70000, where: (x, z, y, s) => flat(y, s, 2.4, 90, 0.55) * (1 - lavender(x, z)) * (1 - wheat(x, z)) },
    { type: 'lavender', count: 26000, where: (x, z, y, s) => flat(y, s, 4, 45, 0.25) * lavender(x, z) },
    { type: 'wheat', count: 26000, where: (x, z, y, s) => flat(y, s, 4, 45, 0.25) * wheat(x, z) * (1 - lavender(x, z)) },
    { type: 'rock', count: 160, where: (x, z, y, s) => (y > 0 && s > 0.3 && s < 0.7 ? 0.8 : y > -1 && y < 3 ? 0.15 : 0) },
  ],
};
