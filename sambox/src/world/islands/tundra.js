// SamBox · src/world/islands/tundra.js · Đảo Tuyết: khối núi đá nhọn phủ tuyết, đồi băng phủ thông, khe băng, vịnh hẹp
// Dáng (bán kính 300, mặt đảo phía +z; khung đường chung lanes.js): rừng giữa là đồi băng phủ rừng thông, hẻm suối thành khe băng
// (suối đóng băng), ao băng bên bến lội; sườn tây là núi phụ (đất cao) nối khối núi chính bằng sống núi; sườn đông là sống băng;
// vịnh hẹp ăn vào bờ đông (xa đường chính); khối núi chính cao nhất bể chắn sau khu nhà chính, có đèo băng; quanh đảo là đai ven
// biển. Tuyết phủ chỗ thoải, đá lộ ở vách dốc.
import { fbm, ridged, smooth } from '../../core/noise.js';
import { rgb, mix3, coast, bump, lineDist, shoreEdge, RIM, onRim, keepRim } from './shape.js';
import { withPaths, paths, inTown, STREAM, EYE } from './lanes.js';

const R = 300;
const POND = [34, 120]; // ao băng bên bến lội (lệch khỏi lối mòn)
const FJORD = [[330, -70], [262, -48]]; // vịnh hẹp bờ đông (dừng xa đường chính phải)
const RIDGE = [[0, -215], [-95, -150], [-165, -40], [-185, 40]]; // sống núi từ khối núi chính sang núi phụ phía tây
const C = {
  snow: rgb('#f3f7fc'), snow2: rgb('#dfe8f2'), rock: rgb('#6f7b8a'), rock2: rgb('#555f6c'), tundra: rgb('#99a98a'), ice: rgb('#cfe7f3'),
  beach: rgb('#a9a69c'), glacier: rgb('#bfe0f0'), road: rgb('#d9dfe6'), road2: rgb('#c4ccd6'), trail: rgb('#c9d2dc'),
};
const pondNear = (x, z) => smooth(13, 9, Math.hypot(x - POND[0], z - POND[1]));
const edgeAt = (x, z) => shoreEdge(x, z, R, 2.2, 1.1);
const clear = (x, z) => {
  const p = paths(x, z);
  return Math.max(onRim(edgeAt(x, z) - Math.hypot(x, z)), p.town, p.lane, p.trail, p.gorge, p.pass);
};
// rừng thông: dày ở vùng giữa hai đường chính, thưa ở hai sườn
const middle = (x, z) => smooth(150, 105, Math.abs(x)) * smooth(-70, -40, z) * smooth(225, 190, z);
const forest = (x, z) => Math.max(smooth(-0.15, 0.25, fbm(x * 0.012 - 4, z * 0.012 + 8, 3)) * middle(x, z), 0.35 * smooth(-0.1, 0.35, fbm(x * 0.009 - 4, z * 0.009 + 8, 3)));

function height(x, z) {
  const d = Math.hypot(x, z),
    edge = edgeAt(x, z);
  if (d > edge + 45) return coast(0, d, edge, 0); // ngoài khơi: chỉ còn đáy biển, khỏi tính nhiễu
  let land = 6 + 9 * fbm(x * 0.007, z * 0.007, 4);
  land += 223 * bump(x, z, 0, -215, 90) * (0.45 + 0.55 * ridged(x * 0.006, z * 0.006, 5)); // khối núi chính sau lưng khu nhà chính
  land += 92 * bump(x, z, -185, 40, 42) * (0.5 + 0.5 * ridged(x * 0.01 + 5, z * 0.01, 4)); // núi phụ sườn tây (đất cao)
  land += 60 * smooth(40, 0, lineDist(RIDGE, x, z)) * (0.4 + 0.6 * ridged(x * 0.014 - 3, z * 0.014, 4)); // sống núi
  land += 60 * bump(x, z, 205, 35, 28) * (0.6 + 0.4 * ridged(x * 0.02, z * 0.02, 3)); // sống băng sườn đông (đất cao)
  land += 50 * bump(x, z, 0, 60, 48) * (0.6 + 0.5 * ridged(x * 0.02 + 2, z * 0.02, 3)); // đồi băng giữa rừng
  land += 26 * bump(x, z, -72, 132, 30) + 26 * bump(x, z, 74, 122, 30) + 24 * bump(x, z, -62, -12, 26) + 24 * bump(x, z, 64, -6, 26); // gò
  let h = coast(land, d, edge, 0.45);
  h = keepRim(withPaths(h, x, z), edge - d); // (sau bờ biển: lối đi trên ba đảo giống hệt nhau, không lệch theo bờ riêng)
  // vịnh hẹp: hai bên lòng vịnh là thềm phẳng cao bằng đai ven biển (xây tường được), sau thềm là vách dựng
  const fd = lineDist(FJORD, x, z) + 5 * fbm(x * 0.04, z * 0.04, 2);
  h = h + (RIM.level - h) * smooth(30, 26, fd);
  h = h + (-16 - h) * smooth(13, 10, fd);
  h = h + (0.6 - h) * smooth(3.5, 1.8, lineDist(STREAM, x, z)); // suối đóng băng trong khe (mặt băng nhỉnh trên mặt biển)
  h = h + (1 - h) * pondNear(x, z); // ao băng
  return h;
}
function ground(x, z, y, slope) {
  if ((pondNear(x, z) > 0.5 || lineDist(STREAM, x, z) < 2.5) && y < 1.6) return C.ice;
  if (y < RIM.level + 0.6 && slope < 0.2 && edgeAt(x, z) - Math.hypot(x, z) < RIM.bank + 7) return C.beach; // đai ven biển: ngoài sỏi
  const p = paths(x, z);
  if (p.lane > 0.5) return mix3(C.road2, C.road, 0.5 + 0.5 * fbm(x * 0.2, z * 0.2)); // đường chính tuyết nén, lộ đá
  if (p.trail > 0.5 || p.pass > 0.5) return C.trail; // lối mòn, đèo: tuyết giẫm
  if (p.gorge > 0.5) return mix3(C.glacier, C.snow2, 0.4); // lòng khe băng
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
  eye: EYE,
  flag: '#f4f7fb', // cờ trắng (tuyết trắng)
  buildZone: inTown, // chỉ xây trong khu nhà chính
  height,
  ground,
  flora: [
    { type: 'pine', count: 1700, where: (x, z, y, s) => (y > 2.5 && y < 80 && s < 0.5 ? forest(x, z) * (1 - pondNear(x, z)) * (1 - clear(x, z)) : 0) },
    { type: 'snowGrass', count: 9000, where: (x, z, y, s) => (y > 2 && y < 40 && s < 0.45 ? 0.35 * (1 - pondNear(x, z)) * (1 - paths(x, z).lane) : 0) },
    { type: 'rock', count: 190, where: (x, z, y, s) => (y > 0 && s > 0.3 && s < 0.7 ? 0.8 : y > 0 && y < 2.5 ? 0.2 : 0) * (1 - clear(x, z)) },
  ],
};
