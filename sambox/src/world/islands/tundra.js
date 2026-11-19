// SamBox · src/world/islands/tundra.js · Đảo Tuyết: khối núi đá nhọn phủ tuyết, thung băng, vịnh hẹp, rừng thông, hồ băng
// Dáng (bán kính 300, mặt đảo phía +z): thung băng chữ U chạy dọc giữa đảo từ cửa hẻm ở mặt đảo lên nhà chính gần lưng đảo (mẫu
// hẻm chung shape.js VALLEY), lòng thung là băng tuyết phẳng theo bậc; khối núi chính cao nhất bể chắn sau lưng nhà chính, dãy
// sống núi nối sang núi phụ phía tây; vịnh hẹp (fjord) vách dựng ăn vào từ bờ đông, hai bên lòng vịnh có thềm phẳng; hồ băng phía
// đông; quanh đảo là đai ven biển phẳng để xây tường thành. Tuyết phủ chỗ thoải, đá lộ ở vách dốc.
import { fbm, ridged, smooth } from '../../core/noise.js';
import { rgb, mix3, coast, bump, lineDist, shoreEdge, RIM, onRim, VALLEY, withValley, valleyFloor } from './shape.js';

const R = 300;
const LAKE = [185, 60]; // hồ băng phía đông, ngoài vách thung
const FJORD = [[330, -70], [240, -55], [175, -30]];
const RIDGE = [[0, -215], [-95, -125], [-150, -10], [-165, 90]]; // từ khối núi chính sang núi phụ phía tây
const C = {
  snow: rgb('#f3f7fc'), snow2: rgb('#dfe8f2'), rock: rgb('#6f7b8a'), rock2: rgb('#555f6c'), tundra: rgb('#99a98a'), ice: rgb('#cfe7f3'),
  beach: rgb('#a9a69c'), glacier: rgb('#bfe0f0'), glacier2: rgb('#9ccbe4'),
};
const lakeNear = (x, z) => smooth(26, 16, Math.hypot(x - LAKE[0], z - LAKE[1]));
const edgeAt = (x, z) => shoreEdge(x, z, R, 2.2, 1.1);
const EYE = VALLEY.eye;
// chỗ trống (không cây): lòng thung (chỗ xây), đai ven biển, chỗ đứng ngắm cảnh
const clear = (x, z) =>
  Math.max(valleyFloor(x, z), onRim(edgeAt(x, z) - Math.hypot(x, z)), smooth(30, 20, Math.hypot(x - EYE.from[0], z - EYE.from[1])));
const forest = (x, z) => smooth(-0.1, 0.35, fbm(x * 0.009 - 4, z * 0.009 + 8, 3));

function height(x, z) {
  const d = Math.hypot(x, z),
    edge = edgeAt(x, z);
  if (d > edge + 45) return coast(0, d, edge, 0); // ngoài khơi: chỉ còn đáy biển, khỏi tính nhiễu
  let land = 6 + 9 * fbm(x * 0.007, z * 0.007, 4);
  land += 205 * bump(x, z, 0, -215, 90) * (0.45 + 0.55 * ridged(x * 0.006, z * 0.006, 5)); // khối núi chính sau lưng nhà chính
  land += 95 * bump(x, z, -150, 75, 55) * (0.5 + 0.5 * ridged(x * 0.01 + 5, z * 0.01, 4)); // núi phụ
  land += 70 * smooth(45, 0, lineDist(RIDGE, x, z)) * (0.4 + 0.6 * ridged(x * 0.014 - 3, z * 0.014, 4)); // dãy sống núi
  land = withValley(land, x, z, 45); // thung băng lên nhà chính
  land = land + (1 - land) * smooth(44, 18, Math.hypot(x - LAKE[0], z - LAKE[1])); // hồ băng: lòng phẳng, bờ thoải dần lên
  let h = coast(land, d, edge, 0.45);
  // vịnh hẹp: hai bên lòng vịnh là thềm phẳng cao bằng đai ven biển (xây tường được), sau thềm là vách dựng
  const fd = lineDist(FJORD, x, z) + 5 * fbm(x * 0.04, z * 0.04, 2);
  h = h + (RIM.level - h) * smooth(30, 26, fd);
  h = h + (-16 - h) * smooth(13, 10, fd);
  return h;
}
function ground(x, z, y, slope) {
  if (lakeNear(x, z) > 0.5 && Math.abs(y - 1.1) < 0.7) return C.ice;
  if (y < RIM.level + 0.6 && slope < 0.2 && edgeAt(x, z) - Math.hypot(x, z) < RIM.bank + 7) return C.beach; // đai ven biển: ngoài sỏi
  if (valleyFloor(x, z) > 0.5 && slope < 0.3 && y > RIM.level + 1) {
    const crack = 0.5 + 0.5 * Math.sin(x * 0.25 + fbm(x * 0.05, z * 0.05) * 4); // vệt nứt dọc lòng thung băng
    return mix3(C.snow, mix3(C.glacier, C.glacier2, crack), 0.45);
  }
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
  height,
  ground,
  flora: [
    { type: 'pine', count: 1400, where: (x, z, y, s) => (y > 2.5 && y < 70 && s < 0.5 ? forest(x, z) * (1 - lakeNear(x, z)) * (1 - clear(x, z)) : 0) },
    { type: 'snowGrass', count: 9000, where: (x, z, y, s) => (y > 2 && y < 34 && s < 0.45 ? 0.35 * (1 - lakeNear(x, z)) * (1 - valleyFloor(x, z)) : 0) },
    { type: 'rock', count: 170, where: (x, z, y, s) => (y > 0 && s > 0.3 && s < 0.7 ? 0.8 : y > 0 && y < 2.5 ? 0.2 : 0) * (1 - clear(x, z)) },
  ],
};
