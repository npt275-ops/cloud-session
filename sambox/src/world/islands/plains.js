// SamBox · src/world/islands/plains.js · Đảo Đồng Bằng (núi đồi, đồng cỏ): đảo mẫu theo ảnh đích (đảo ấm cúng, ảnh 5–14)
// Dáng (bán kính 300, mặt đảo phía +z): núi lớn nhiều bậc phía tây bắc, đồi phụ đông bắc, cao nguyên mặt bàn phía tây, đồi cỏ
// lượn sóng phía đông; thung sông chảy từ chân núi ra vịnh tây nam; hồ phía đông có suối ra biển; vài cột đá ngoài biển. Mặt đảo
// là nền xây ba bậc (bến · thị trấn · nền cao dưới chân núi) nối bằng dốc; quanh đảo là đai ven biển phẳng để xây tường thành.
// Ngoài vùng xây: đồng oải hương, lúa mì, rừng cây tán bông thành từng đám.
import { fbm, ridged, simplex2, smooth } from '../../core/noise.js';
import { rgb, mix3, terrace, coast, bump, lineDist, shoreEdge, RIM, onRim, withTown, townZone } from './shape.js';

const R = 300;
const LAKE = [165, -30]; // (phía đông: chừa mặt đảo cho nền xây)
const RIVER = [[-70, -10], [-95, 70], [-120, 150], [-150, 215], [-185, 260]]; // từ chân núi ra vịnh tây nam
const BROOK = [LAKE, [230, -15], [300, 0]]; // suối từ hồ ra biển
// nền xây: bến (cao bằng đai ven biển) · thị trấn +12 · nền cao +18; dốc nối bậc ở các x đã chọn
const TOWN = { cx: 40, cz: 118, rx: 145, rz: 112, steps: [[175, 12, [-20, 125]], [58, 18, [60]]] };
const STACKS = [[288, -44, 9, 34], [274, 46, 6, 22], [-32, -302, 8, 28], [-294, -66, 7, 24]]; // cột đá ngoài biển (ngoài đai ven biển)
const C = {
  grass: rgb('#8cc152'), grass2: rgb('#5e9e3e'), high: rgb('#86a35a'), sand: rgb('#ecd6a2'), wet: rgb('#c9ad7c'),
  rock: rgb('#d2b892'), rock2: rgb('#b0926c'), lav: rgb('#7f8a5c'), wheat: rgb('#c8a14a'),
};
// vùng đồng: oải hương, lúa mì (mặt phẳng, độ cao vừa)
const lavender = (x, z) => smooth(0.28, 0.42, fbm(x * 0.012 + 5.3, z * 0.012 - 2.1, 3));
const wheat = (x, z) => smooth(0.28, 0.42, fbm(x * 0.012 - 7.7, z * 0.012 + 4.4, 3));
const forest = (x, z) => smooth(0.0, 0.4, fbm(x * 0.009 + 11, z * 0.009 - 3, 3));

const edgeAt = (x, z) => shoreEdge(x, z, R, 1.3);
const EYE = { from: [40, 40], to: [60, 170] }; // tầm mắt: đứng mép bậc nền cao nhìn xuống thị trấn, bến và biển
// chỗ trống (không cây, không ruộng): nền xây, đai ven biển, chỗ đứng ngắm cảnh
const clear = (x, z) =>
  Math.max(townZone(TOWN, x, z), onRim(edgeAt(x, z) - Math.hypot(x, z)), smooth(30, 20, Math.hypot(x - EYE.from[0], z - EYE.from[1])));

function height(x, z) {
  const d = Math.hypot(x, z),
    edge = edgeAt(x, z);
  if (d > edge + 45) return stacks(coast(0, d, edge, 0), x, z); // ngoài khơi: chỉ còn đáy biển và cột đá, khỏi tính nhiễu
  let land = 10 + 12 * fbm(x * 0.005, z * 0.005, 4) + 5 * fbm(x * 0.025, z * 0.025, 3);
  land += 22 * Math.max(0, fbm(x * 0.011 + 20, z * 0.011, 3)) * smooth(-40, 80, x); // đồi cỏ lượn sóng phía đông
  land += 112 * bump(x, z, -80, -75, 85) * (0.8 + 0.28 * ridged(x * 0.011, z * 0.011, 4)); // núi lớn
  land += 46 * bump(x, z, 125, -105, 50); // đồi phụ
  land = Math.max(land, 42 * smooth(68, 52, Math.hypot(x + 185, z - 55) + 10 * fbm(x * 0.03, z * 0.03, 2))); // cao nguyên mặt bàn
  // bậc lớn, không đều: bậc chỉ rõ ở chỗ nhiễu cho phép, chỗ khác là sườn đồi thoải
  const tk = 0.35 + 0.45 * smooth(-0.3, 0.4, fbm(x * 0.008 + 3, z * 0.008, 2));
  land = (1 - tk) * land + tk * terrace(land, 15, 0.72);
  land = withTown(TOWN, land, x, z);
  // thung sông: lòng thung hạ dần; dòng nước (thấp hơn mặt biển một chút) khoét sau cùng nên cắt qua đai ven biển ra tới biển
  const rv = lineDist(RIVER, x, z) + 4 * simplex2(x * 0.04, z * 0.04);
  land = land - (land - 3) * 0.75 * smooth(48, 12, rv);
  const cliff = 0.5 + 0.5 * simplex2(Math.atan2(z, x) * 1.6, 3.1);
  let h = coast(land, d, edge, smooth(-0.2, 0.3, cliff));
  h = h + (-2.5 - h) * smooth(7, 3.5, rv);
  h = h + (-2 - h) * smooth(5, 2.5, lineDist(BROOK, x, z));
  h = h + (-4 - h) * smooth(38, 27, Math.hypot(x - LAKE[0], z - LAKE[1])); // hồ
  return stacks(h, x, z);
}
function stacks(h, x, z) {
  for (const [cx, cz, r, hm] of STACKS) {
    const k = smooth(r + 2, r - 2, Math.hypot(x - cx, z - cz));
    if (k > 0) h = h + (hm * (0.9 + 0.2 * fbm(x * 0.2, z * 0.2)) - h) * k; // (k = 0 thì giữ nguyên đáy biển)
  }
  return h;
}
function ground(x, z, y, slope) {
  if (slope > 0.62) return mix3(C.rock, C.rock2, 0.5 + 0.5 * Math.sin(y * 0.9 + fbm(x * 0.05, z * 0.05) * 3));
  if (y < 0.4) return C.wet;
  if (y < 2.2) return C.sand;
  let g = mix3(C.grass, C.grass2, 0.5 + 0.5 * fbm(x * 0.03, z * 0.03, 3));
  if (y < RIM.level + 0.6) g = mix3(C.sand, g, smooth(RIM.bank + 3, RIM.bank + 9, edgeAt(x, z) - Math.hypot(x, z))); // đai ven biển: ngoài cát
  if (y > 60) g = mix3(g, C.high, smooth(60, 110, y));
  if (slope < 0.25 && y > 4 && y < 45 && clear(x, z) < 0.5) {
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
  eye: EYE,
  height,
  ground,
  // luật mọc: số lượng (mức Cao) và xác suất ở một điểm
  flora: [
    { type: 'fluffy', count: 950, where: (x, z, y, s) => flat(y, s, 2.5, 95, 0.45) * forest(x, z) * (1 - lavender(x, z)) * (1 - wheat(x, z)) * (1 - clear(x, z)) },
    { type: 'grass', count: 70000, where: (x, z, y, s) => flat(y, s, 2.4, 110, 0.55) * (1 - lavender(x, z)) * (1 - wheat(x, z)) },
    { type: 'lavender', count: 26000, where: (x, z, y, s) => flat(y, s, 4, 45, 0.25) * lavender(x, z) * (1 - clear(x, z)) },
    { type: 'wheat', count: 26000, where: (x, z, y, s) => flat(y, s, 4, 45, 0.25) * wheat(x, z) * (1 - lavender(x, z)) * (1 - clear(x, z)) },
    { type: 'rock', count: 160, where: (x, z, y, s) => (y > 0 && s > 0.3 && s < 0.7 ? 0.8 : y > -1 && y < 3 ? 0.15 : 0) * (1 - clear(x, z)) },
  ],
};
