// SamBox · src/world/islands/desert.js · Đảo Sa Mạc (cát hồng): cao nguyên đá nhiều tầng, hẻm vực bậc thang, núi bàn, cồn cát
// Dáng (bán kính 300, mặt đảo phía +z), lấy cảm giác cao độ và chiều sâu của ảnh đích: gần cả đảo là cao nguyên đá vân hồng (mặt
// cao nguyên cũng thành từng thềm) bị một hẻm vực sâu ba bậc xẻ dọc từ lưng đảo ra mặt đảo; đáy hẻm có hồ ốc đảo và suối chảy ra
// biển; năm núi bàn nhô cao trên cao nguyên; miệng hố cổ phía đông; phía tây mặt đảo là vùng trũng cồn cát, rừng cột đá, chảo
// muối. Mặt đảo phía đông hẻm vực là nền xây ba bậc (bậc cao bằng mặt cao nguyên) nối bằng dốc; quanh đảo là đai ven biển phẳng.
import { fbm, smooth, simplex2, rng, lerp } from '../../core/noise.js';
import { rgb, mix3, terrace, coast, lineDist, shoreEdge, onRim, withTown, townZone } from './shape.js';

const R = 300;
const PLATEAU = 34; // mặt cao nguyên (bằng bậc nền cao của thị trấn)
const BUTTES = [
  [-120, -110, 40, 76],
  [150, -45, 32, 60],
  [-185, 25, 28, 56],
  [40, -190, 30, 66],
  [-130, -160, 20, 62],
]; // núi bàn [tâm x, tâm z, bán kính, đỉnh]
const HOODOOS = (() => {
  const r = rng(77),
    out = [];
  for (let i = 0; i < 14; i++) out.push([-250 + r() * 140, 40 + r() * 160, 3 + r() * 2.5, 14 + r() * 16]);
  return out;
})(); // rừng cột đá hình nấm trong vùng trũng [x, z, bán kính, cao]
const CANYON = [[-30, -235], [-10, -150], [-60, -70], [-20, 10], [-62, 95], [-45, 175], [-80, 275]]; // hẻm vực từ lưng ra mặt đảo
const OASIS = [-37, 45];
const STREAM = [OASIS, [-62, 95], [-45, 175], [-80, 275]]; // suối đáy hẻm từ hồ ốc đảo ra biển
const SALT = [-165, 110];
const CRATER = [120, -120, 30]; // [x, z, bán kính vành]
// nền xây phía đông hẻm vực: bến (cao bằng đai ven biển) · thị trấn +12 · nền cao +18 (bằng mặt cao nguyên)
const TOWN = { cx: 90, cz: 140, rx: 110, rz: 95, steps: [[190, 12, [40, 150]], [85, 18, [100]]] };
const STRATA = ['#d98a68', '#eaa984', '#c26e52', '#f2c29e', '#b9604a', '#e39a76'].map(rgb);
const C = {
  sand: rgb('#f0c3a6'), sand2: rgb('#e6ad8e'), crest: rgb('#f7d6bf'), top: rgb('#e0a47e'), oasis: rgb('#93b25a'), wet: rgb('#cf9a80'),
  salt: rgb('#f6ece4'), salt2: rgb('#e9d6cc'),
};
const edgeAt = (x, z) => shoreEdge(x, z, R, 4.1, 0.8);
const EYE = { from: [5, -20], to: [-40, 60] }; // tầm mắt: đứng mép hẻm vực nhìn xuống hồ ốc đảo
// chỗ trống (không cây, không ruộng): nền xây, đai ven biển, chỗ đứng ngắm cảnh
const clear = (x, z) =>
  Math.max(townZone(TOWN, x, z), onRim(edgeAt(x, z) - Math.hypot(x, z)), smooth(30, 20, Math.hypot(x - EYE.from[0], z - EYE.from[1])));
const lowland = (x, z) => smooth(-85, -115, x + 10 * fbm(x * 0.02, z * 0.02, 2)) * smooth(-30, 5, z); // vùng trũng tây mặt đảo
const oasisNear = (x, z) => smooth(40, 14, Math.hypot(x - OASIS[0], z - OASIS[1]));
const streamNear = (x, z) => smooth(16, 4, lineDist(STREAM, x, z));
const saltNear = (x, z) => smooth(46, 34, Math.hypot(x - SALT[0], z - SALT[1]) + 8 * fbm(x * 0.03, z * 0.03, 2));
const strata = (h) => (h > 6 ? 0.2 * h + 0.8 * terrace(h, 5, 0.55) : h); // vân đá tầng tầng (đá; cồn cát không qua đây)

function rockForms(x, z) {
  let h = 0;
  for (const [cx, cz, r, hm] of BUTTES) {
    const k = smooth(r + 6, r - 3, Math.hypot(x - cx, z - cz) + 9 * fbm(x * 0.035, z * 0.035, 2));
    if (k > 0) h = Math.max(h, k * (hm + 4 * fbm(x * 0.03, z * 0.03)));
  }
  for (const [cx, cz, r, hm] of HOODOOS) {
    const dd = Math.hypot(x - cx, z - cz);
    h = Math.max(h, smooth(r + 1, r - 1, dd) * hm + smooth(r * 1.9, r * 1.3, dd) * hm * 0.12); // thân cột, mũ rộng hơn ở đỉnh
  }
  return h;
}
function height(x, z) {
  const d = Math.hypot(x, z),
    edge = edgeAt(x, z);
  if (d > edge + 45) return coast(0, d, edge, 0); // ngoài khơi: chỉ còn đáy biển, khỏi tính nhiễu
  // mặt cao nguyên (có miệng hố cổ) và vùng trũng cồn cát
  let plateau = PLATEAU + 3 * fbm(x * 0.01, z * 0.01, 3);
  const cd = Math.hypot(x - CRATER[0], z - CRATER[1]);
  plateau = Math.max(plateau, PLATEAU + 14 * Math.exp(-((cd - CRATER[2]) ** 2) / 120)); // vành hố
  plateau = plateau + (PLATEAU - 16 - plateau) * smooth(CRATER[2] - 6, CRATER[2] - 14, cd); // lòng hố
  const w = 2 * fbm(x * 0.02, z * 0.02, 2),
    dunes = 2.5 + 1.5 * fbm(x * 0.03, z * 0.03, 2) + 4 * Math.abs(Math.sin((x * 0.6 + z * 0.8) * 0.06 + w)) ** 1.6;
  let land = lerp(strata(plateau), dunes, lowland(x, z));
  land = Math.max(land, strata(rockForms(x, z)));
  land = land + (1.2 - land) * saltNear(x, z); // chảo muối
  land = withTown(TOWN, land, x, z);
  // hẻm vực ba bậc (24 · 13 · đáy 3), khoét sau nền xây nên luôn xẻ qua, thành hào tự nhiên phía tây thị trấn
  const hd = lineDist(CANYON, x, z) + 6 * simplex2(x * 0.03, z * 0.03);
  for (const [half, hh] of [[40, 24], [27, 13], [15, 3]]) land = land + (Math.min(land, hh) - land) * smooth(half + 3, half - 1, hd);
  const od = Math.hypot(x - OASIS[0], z - OASIS[1]);
  land = land + (Math.min(land, 3) - land) * smooth(30, 24, od); // đáy hẻm mở rộng quanh hồ
  let h = coast(land, d, edge, 0.75);
  h = h + (-2.5 - h) * smooth(5, 2.5, lineDist(STREAM, x, z)); // suối khoét sau cùng: cắt qua đai ven biển ra biển
  h = h + (-2 - h) * smooth(19, 12, od); // hồ ốc đảo
  return h;
}
function ground(x, z, y, slope) {
  if (slope > 0.42) return STRATA[((Math.floor(y / 2.2) % STRATA.length) + STRATA.length) % STRATA.length];
  if (y < 0.5) return C.wet;
  const green = Math.max(oasisNear(x, z), 0.7 * streamNear(x, z));
  if (green > 0.3 && y < 6) return mix3(C.sand, C.oasis, green); // cỏ quanh hồ ốc đảo, ven suối
  if (saltNear(x, z) > 0.3 && y < 3) return mix3(C.sand, mix3(C.salt, C.salt2, 0.5 + 0.5 * fbm(x * 0.08, z * 0.08)), saltNear(x, z));
  if (y > 18 && slope < 0.3) return mix3(C.top, C.sand2, 0.2 + 0.25 * fbm(x * 0.05, z * 0.05)); // mặt cao nguyên
  const w = Math.abs(Math.sin((x * 0.6 + z * 0.8) * 0.06 + 2 * fbm(x * 0.02, z * 0.02, 2)));
  return mix3(mix3(C.sand2, C.sand, 0.5 + 0.5 * fbm(x * 0.04, z * 0.04)), C.crest, smooth(0.85, 1, w));
}
export default {
  key: 'desert',
  name: 'Sa Mạc',
  radius: R,
  cliff: { colors: ['#d98a68', '#eeb08a', '#c26e52', '#f2c29e'], freq: 1 / 2.2, range: [0.36, 0.56] }, // vân đá nhiều tầng
  eye: EYE,
  height,
  ground,
  flora: [
    { type: 'palm', count: 90, where: (x, z, y, s) => (y > 0.3 && y < 8 && s < 0.4 ? Math.max(oasisNear(x, z), 0.6 * streamNear(x, z)) * (1 - clear(x, z)) : 0) },
    { type: 'cactus', count: 140, where: (x, z, y, s) => (y > 2 && y < 42 && s < 0.35 ? 0.5 * (1 - saltNear(x, z)) * (1 - clear(x, z)) : 0) },
    { type: 'dryGrass', count: 9000, where: (x, z, y, s) => (y > 1 && y < 42 && s < 0.4 ? (0.25 + 0.75 * Math.max(oasisNear(x, z), streamNear(x, z))) * (1 - saltNear(x, z)) : 0) },
    { type: 'rock', count: 120, where: (x, z, y, s) => (y > 0 && s > 0.25 && s < 0.6 ? 0.9 : 0) * (1 - clear(x, z)) },
  ],
};
