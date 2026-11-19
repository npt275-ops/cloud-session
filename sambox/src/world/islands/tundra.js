// SamBox · src/world/islands/tundra.js · Đảo Tuyết: khối núi đá nhọn phủ tuyết, rừng thông dưới chân, hồ băng
// Dáng: khối núi chính lởm chởm cao nhất bể ở giữa lệch bắc, núi phụ phía tây nam; sườn dưới thoải có rừng thông phủ tuyết;
// hồ đóng băng phía đông nam; bờ đá xám xen bãi sỏi. Tuyết phủ chỗ thoải, đá lộ ở vách dốc.
import { fbm, ridged, smooth } from '../../core/noise.js';
import { rgb, mix3, coast, bump } from './shape.js';

const R = 175;
const LAKE = [58, 62];
const C = { snow: rgb('#f3f7fc'), snow2: rgb('#dfe8f2'), rock: rgb('#6f7b8a'), rock2: rgb('#555f6c'), tundra: rgb('#99a98a'), ice: rgb('#cfe7f3'), beach: rgb('#a9a69c') };
const lakeNear = (x, z) => smooth(27, 17, Math.hypot(x - LAKE[0], z - LAKE[1]));
const forest = (x, z) => smooth(-0.1, 0.35, fbm(x * 0.013 - 4, z * 0.013 + 8, 3));

function height(x, z) {
  const d = Math.hypot(x, z),
    edge = R * 0.8 + 20 * fbm(x * 0.012 - 3, z * 0.012, 3);
  let land = 6 + 8 * fbm(x * 0.01, z * 0.01, 4);
  const r = ridged(x * 0.009, z * 0.009, 5);
  land += 165 * bump(x, z, 8, -30, 64) * (0.45 + 0.55 * r);
  land += 80 * bump(x, z, -72, 46, 36) * (0.5 + 0.5 * ridged(x * 0.014 + 5, z * 0.014, 4));
  let h = coast(land, d, edge, 0.45);
  h = h + (1 - h) * lakeNear(x, z); // hồ băng phẳng, cao hơn mặt nước một chút
  return h;
}
function ground(x, z, y, slope) {
  if (lakeNear(x, z) > 0.5 && Math.abs(y - 1) < 0.6) return C.ice;
  if (y < 1.8) return C.beach;
  if (slope > 0.6) return mix3(C.rock, C.rock2, 0.5 + 0.5 * fbm(x * 0.06, z * 0.06));
  const snowLine = 18 + 10 * fbm(x * 0.03, z * 0.03);
  if ((y > snowLine && slope < 0.6) || slope < 0.18) return mix3(C.snow, C.snow2, 0.5 + 0.5 * fbm(x * 0.05, z * 0.05));
  return mix3(C.tundra, C.snow, smooth(0.1, 0.5, fbm(x * 0.04 + 7, z * 0.04, 3)));
}
export default {
  key: 'tundra',
  name: 'Tuyết',
  radius: R,
  cliff: { colors: ['#7a8592', '#717b88', '#838d99', '#6c7683'], freq: 1 / 7, range: [0.5, 0.66] }, // đá xám lộ dưới tuyết
  height,
  ground,
  flora: [
    { type: 'pine', count: 1400, where: (x, z, y, s) => (y > 2.5 && y < 60 && s < 0.5 ? forest(x, z) * (1 - lakeNear(x, z)) : 0) },
    { type: 'snowGrass', count: 9000, where: (x, z, y, s) => (y > 2 && y < 30 && s < 0.45 ? 0.35 * (1 - lakeNear(x, z)) : 0) },
    { type: 'rock', count: 170, where: (x, z, y, s) => (y > 0 && s > 0.3 && s < 0.7 ? 0.8 : y > 0 && y < 2.5 ? 0.2 : 0) },
  ],
};
