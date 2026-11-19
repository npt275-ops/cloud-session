// SamBox · src/world/islands/tundra.js · Đảo Tuyết: khối núi đá nhọn phủ tuyết, thung băng, vịnh hẹp, rừng thông, hồ băng
// Dáng (bán kính 300, mặt đảo phía +z): khối núi chính cao nhất bể lệch bắc, dãy sống núi nối sang núi phụ phía tây; dòng sông
// băng chảy từ khối núi xuống bờ nam trong thung hình chữ U; vịnh hẹp (fjord) vách dựng ăn sâu từ bờ đông, hai bên lòng vịnh có
// thềm phẳng; hồ băng bên sườn tây sông băng. Mặt đảo phía đông sông băng là nền xây ba bậc nối bằng dốc; quanh đảo là đai ven biển
// phẳng để xây tường thành. Tuyết phủ chỗ thoải, đá lộ ở vách dốc.
import { fbm, ridged, smooth } from '../../core/noise.js';
import { rgb, mix3, coast, bump, lineDist, shoreEdge, RIM, onRim, withTown, townZone } from './shape.js';

const R = 300;
const LAKE = [-85, 168]; // hồ băng bên sườn tây sông băng, gần bờ
const FJORD = [[330, -70], [230, -55], [160, -25], [120, 10]];
const GLACIER = [[15, -50], [5, 40], [-20, 130], [-45, 230], [-55, 300]];
const RIDGE = [[15, -70], [-60, -40], [-130, 40], [-170, 110]];
// nền xây phía đông sông băng: bến (cao bằng đai ven biển) · thị trấn +12 · nền cao +18 cắt vào chân khối núi
const TOWN = { cx: 125, cz: 140, rx: 105, rz: 100, steps: [[195, 12, [70, 180]], [95, 18, [130]]] };
const C = {
  snow: rgb('#f3f7fc'), snow2: rgb('#dfe8f2'), rock: rgb('#6f7b8a'), rock2: rgb('#555f6c'), tundra: rgb('#99a98a'), ice: rgb('#cfe7f3'),
  beach: rgb('#a9a69c'), glacier: rgb('#bfe0f0'), glacier2: rgb('#9ccbe4'),
};
const lakeNear = (x, z) => smooth(30, 20, Math.hypot(x - LAKE[0], z - LAKE[1]));
const edgeAt = (x, z) => shoreEdge(x, z, R, 2.2, 1.1);
const EYE = { from: [-60, 40], to: [-20, 230] }; // tầm mắt: đứng sườn tây thung băng nhìn dọc sông băng ra biển
// chỗ trống (không cây, không ruộng): nền xây, đai ven biển, chỗ đứng ngắm cảnh
const clear = (x, z) =>
  Math.max(townZone(TOWN, x, z), onRim(edgeAt(x, z) - Math.hypot(x, z)), smooth(30, 20, Math.hypot(x - EYE.from[0], z - EYE.from[1])));
const glacierNear = (x, z) => smooth(30, 18, lineDist(GLACIER, x, z) + 6 * fbm(x * 0.03, z * 0.03, 2));
const forest = (x, z) => smooth(-0.1, 0.35, fbm(x * 0.009 - 4, z * 0.009 + 8, 3));

function height(x, z) {
  const d = Math.hypot(x, z),
    edge = edgeAt(x, z);
  if (d > edge + 45) return coast(0, d, edge, 0); // ngoài khơi: chỉ còn đáy biển, khỏi tính nhiễu
  let land = 6 + 9 * fbm(x * 0.007, z * 0.007, 4);
  land += 205 * bump(x, z, 15, -70, 95) * (0.45 + 0.55 * ridged(x * 0.006, z * 0.006, 5)); // khối núi chính
  land += 95 * bump(x, z, -150, 75, 55) * (0.5 + 0.5 * ridged(x * 0.01 + 5, z * 0.01, 4)); // núi phụ
  land += 70 * smooth(45, 0, lineDist(RIDGE, x, z)) * (0.4 + 0.6 * ridged(x * 0.014 - 3, z * 0.014, 4)); // dãy sống núi
  // thung băng chữ U: lòng thung phẳng, hạ dần ra biển
  const gd = lineDist(GLACIER, x, z),
    floor = 8 + 50 * smooth(260, -40, z);
  land = land + (Math.min(land, floor) - land) * smooth(48, 22, gd + 6 * fbm(x * 0.03, z * 0.03, 2));
  land = withTown(TOWN, land, x, z);
  land = land + (1 - land) * smooth(52, 20, Math.hypot(x - LAKE[0], z - LAKE[1])); // hồ băng: lòng phẳng, bờ thoải dần lên
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
  if (glacierNear(x, z) > 0.5 && slope < 0.5 && y > 3 && townZone(TOWN, x, z) < 0.5) return mix3(C.glacier, C.glacier2, 0.5 + 0.5 * Math.sin(x * 0.25 + fbm(x * 0.05, z * 0.05) * 4)); // vệt nứt dọc dòng băng
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
  height,
  ground,
  flora: [
    { type: 'pine', count: 1400, where: (x, z, y, s) => (y > 2.5 && y < 70 && s < 0.5 ? forest(x, z) * (1 - lakeNear(x, z)) * (1 - glacierNear(x, z)) * (1 - clear(x, z)) : 0) },
    { type: 'snowGrass', count: 9000, where: (x, z, y, s) => (y > 2 && y < 34 && s < 0.45 ? 0.35 * (1 - lakeNear(x, z)) * (1 - glacierNear(x, z)) : 0) },
    { type: 'rock', count: 170, where: (x, z, y, s) => (y > 0 && s > 0.3 && s < 0.7 ? 0.8 : y > 0 && y < 2.5 ? 0.2 : 0) * (1 - clear(x, z)) },
  ],
};
