// SamBox · src/world/islands/tundra.js · Đảo Tuyết: khối núi đá nhọn phủ tuyết, đồi băng phủ thông, khe băng, vịnh hẹp
// Dáng (bán kính 300, mặt đảo phía +z; khung đường chung lanes.js): khu nhà chính trũng giữa vành sống băng; rừng giữa là núi băng
// đỉnh đá nhọn, chân phủ rừng thông (thung giữa các núi và hai bên lối mòn thoải: lính đi xuyên rừng), khe băng có suối đóng băng
// uốn hai vòng cùng phía xẻ qua núi giữa (ao băng ở vòng trên);
// sườn tây là thềm băng phẳng dưới chân núi phụ (núi phụ nối khối núi chính bằng sống núi), sườn đông là thềm băng trước sống băng
// (hai nền phẳng xây được, nhìn xuống đường chính); vịnh hẹp ăn vào bờ đông (xa đường chính); khối núi chính cao nhất bể chắn sau
// khu nhà chính, có đèo băng; quanh đảo là đai ven biển. Tuyết phủ chỗ thoải, đá lộ ở vách dốc.
import { fbm, ridged, smooth } from '../../core/noise.js';
import { rgb, mix3, coast, bump, lineDist, shoreEdge, RIM, onRim, keepRim } from './shape.js';
import { createPaths, EYE, PADS, padOut, relief } from './lanes.js';

const R = 300;
const P = createPaths({ bends: [-22, 4, -22, -4], pool: 58, seed: 3 }); // suối băng: hai vòng cùng lượn trái, vòng trên to hơn, ao băng
const FJORD = [[330, -70], [262, -48]]; // vịnh hẹp bờ đông (dừng xa đường chính phải)
const RIDGE = [[0, -215], [-95, -150], [-170, -70], [-205, -42]]; // sống núi từ khối núi chính sang núi phụ phía tây
const C = {
  snow: rgb('#f3f7fc'), snow2: rgb('#dfe8f2'), rock: rgb('#6f7b8a'), rock2: rgb('#555f6c'), tundra: rgb('#99a98a'), ice: rgb('#cfe7f3'),
  beach: rgb('#a9a69c'), glacier: rgb('#bfe0f0'), road: rgb('#d9dfe6'), road2: rgb('#c4ccd6'), trail: rgb('#c9d2dc'),
};
const edgeAt = (x, z) => shoreEdge(x, z, R, 2.2, 1.1);
const clear = (x, z) => {
  const p = P.paths(x, z);
  return Math.max(onRim(edgeAt(x, z) - Math.hypot(x, z)), p.town, p.lane, p.defile, p.trail, p.gorge, p.pass, p.ramp, p.pad);
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
  land += 92 * bump(x, z, -205, -42, 40) * (0.5 + 0.5 * ridged(x * 0.01 + 5, z * 0.01, 4)); // núi phụ sườn tây, sau thềm băng
  land += 60 * smooth(40, 0, lineDist(RIDGE, x, z)) * (0.4 + 0.6 * ridged(x * 0.014 - 3, z * 0.014, 4)); // sống núi
  land += 60 * bump(x, z, 204, -58, 28) * (0.6 + 0.4 * ridged(x * 0.02, z * 0.02, 3)); // sống băng sườn đông, sau thềm băng
  land = Math.max(land, relief(x, z) * (0.8 + 0.4 * ridged(x * 0.025 + 2, z * 0.025, 4))); // núi băng giữa (lanes.js MOUNTS): đỉnh đá nhọn
  for (const p of PADS) land = Math.max(land, p.y * smooth(1.7, 1.15, padOut(p, x, z) + 0.15 * fbm(x * 0.03, z * 0.03, 2))); // thềm băng
  land = Math.max(land, P.ring(x, z) * (0.9 + 0.22 * ridged(x * 0.02 - 6, z * 0.02 + 1, 3))); // vành sống băng quanh khu nhà chính
  let h = coast(land, d, edge, 0.45);
  h = keepRim(P.withPaths(h, x, z), edge - d); // (sau bờ biển: lối đi trên ba đảo giống hệt nhau, không lệch theo bờ riêng)
  // vịnh hẹp: hai bên lòng vịnh là thềm phẳng cao bằng đai ven biển (xây tường được), sau thềm là vách dựng
  const fd = lineDist(FJORD, x, z) + 5 * fbm(x * 0.04, z * 0.04, 2);
  h = h + (RIM.level - h) * smooth(30, 26, fd);
  h = h + (-16 - h) * smooth(13, 10, fd);
  return P.channel(h, x, z); // suối đóng băng (khoét sau cùng nên băng qua đai ven biển ra tới biển)
}
function ground(x, z, y, slope) {
  const p = P.paths(x, z);
  if (p.stream > 0.5) return C.ice; // lòng suối băng
  if (y < RIM.level + 0.6 && slope < 0.2 && edgeAt(x, z) - Math.hypot(x, z) < RIM.bank + 7) return C.beach; // đai ven biển: ngoài sỏi
  if (p.lane > 0.5) return mix3(C.road2, C.road, 0.5 + 0.5 * fbm(x * 0.2, z * 0.2)); // đường chính tuyết nén, lộ đá
  if (p.trail > 0.5 || p.pass > 0.5 || p.defile > 0.5 || p.ramp > 0.5) return C.trail; // lối mòn, đèo, khe, dốc lên nền: tuyết giẫm
  if (p.gorge > 0.5) return mix3(C.glacier, C.snow2, 0.55); // hai bờ suối băng
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
  buildZone: (x, z) => 1 - P.paths(x, z).way, // chỗ nào phẳng là xây được, trừ lối đi
  paths: P,
  height,
  ground,
  flora: [
    { type: 'pine', count: 1700, where: (x, z, y, s) => (y > 2.5 && y < 80 && s < 0.5 ? forest(x, z) * (1 - clear(x, z)) : 0) },
    { type: 'snowGrass', count: 9000, where: (x, z, y, s) => (y > 2 && y < 40 && s < 0.45 ? 0.35 * (1 - P.paths(x, z).lane) * (1 - P.paths(x, z).stream) : 0) },
    { type: 'rock', count: 190, where: (x, z, y, s) => (y > 0 && s > 0.3 && s < 0.7 ? 0.8 : y > 0 && y < 2.5 ? 0.2 : 0) * (1 - clear(x, z)) },
  ],
};
