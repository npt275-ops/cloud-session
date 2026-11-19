// SamBox · src/world/islands/desert.js · Đảo Sa Mạc (cát hồng): biển đụn cát, núi bàn vân đá nhiều tầng, hẻm vực, rừng cột đá
// Dáng (bán kính 300): sáu khối núi bàn (mesa) đỉnh phẳng vách sọc; hẻm vực dài uốn khúc xẻ ngang đảo ra biển; biển đụn cát cao
// phía đông bắc; rừng cột đá hình nấm phía nam; lòng chảo muối trắng phía tây nam; miệng hố cổ có vành đá phía đông; ốc đảo ven
// biển đông nam (hồ, dừa, cỏ xanh). Bờ biển thoải, cát mịn, có mũi đất và vịnh.
import { fbm, smooth, simplex2, rng } from '../../core/noise.js';
import { rgb, mix3, terrace, coast, lineDist, shoreEdge } from './shape.js';

const R = 300;
const MESAS = [
  [-60, -45, 80, 66],
  [100, 30, 46, 46],
  [13, 135, 36, 36],
  [-160, 60, 34, 44],
  [140, -150, 30, 32],
  [-110, -175, 26, 40],
]; // [tâm x, tâm z, bán kính, độ cao]
const HOODOOS = (() => {
  const r = rng(77),
    out = [];
  for (let i = 0; i < 16; i++) out.push([-60 + r() * 150, 170 + r() * 70, 3 + r() * 2.5, 16 + r() * 16]);
  return out;
})(); // rừng cột đá hình nấm phía nam [x, z, bán kính, cao]
const OASIS = [175, -95];
const SALT = [-150, 165];
const CRATER = [195, 95, 34]; // [x, z, bán kính vành]
const DUNES = (x, z) => smooth(-0.05, 0.35, fbm(x * 0.006 + 3, z * 0.006 - 8, 2)) * smooth(-60, 40, x - z); // vùng đụn cao
const STRATA = ['#d98a68', '#eaa984', '#c26e52', '#f2c29e', '#b9604a', '#e39a76'].map(rgb);
const C = {
  sand: rgb('#f0c3a6'), sand2: rgb('#e6ad8e'), crest: rgb('#f7d6bf'), top: rgb('#e0a47e'), oasis: rgb('#93b25a'), wet: rgb('#cf9a80'),
  salt: rgb('#f6ece4'), salt2: rgb('#e9d6cc'),
};
const CANYON = [[-230, -110], [-150, -100], [-90, -60], [-45, -15], [-5, -55], [50, -15], [110, -45], [170, -20], [240, 10]];
const canyonDist = (x, z) => lineDist(CANYON, x, z) + 3 * simplex2(x * 0.05, z * 0.05);
const oasisNear = (x, z) => smooth(40, 14, Math.hypot(x - OASIS[0], z - OASIS[1]));
const saltNear = (x, z) => smooth(62, 48, Math.hypot(x - SALT[0], z - SALT[1]) + 10 * fbm(x * 0.03, z * 0.03, 2));

function height(x, z) {
  const d = Math.hypot(x, z),
    edge = shoreEdge(x, z, R, 4.1, 0.8);
  if (d > edge + 45) return coast(0, d, edge, 0); // ngoài khơi: chỉ còn đáy biển, khỏi tính nhiễu
  const w = 2 * fbm(x * 0.02, z * 0.02, 2),
    ridge = Math.abs(Math.sin((x * 0.6 + z * 0.8) * 0.06 + w));
  let land = 3 + 3 * fbm(x * 0.008, z * 0.008, 3) + 2.4 * ridge + 14 * DUNES(x, z) * ridge ** 1.6;
  for (const [cx, cz, r, hm] of MESAS) {
    const k = smooth(r + 6, r - 3, Math.hypot(x - cx, z - cz) + 9 * fbm(x * 0.035, z * 0.035, 2));
    land = Math.max(land, k * (hm + 4 * fbm(x * 0.03, z * 0.03)));
  }
  for (const [cx, cz, r, hm] of HOODOOS) {
    const dd = Math.hypot(x - cx, z - cz);
    land = Math.max(land, smooth(r + 1, r - 1, dd) * hm + smooth(r * 1.9, r * 1.3, dd) * hm * 0.12); // thân cột, mũ rộng hơn ở đỉnh
  }
  const cd = Math.hypot(x - CRATER[0], z - CRATER[1]);
  land = Math.max(land, 16 * Math.exp(-((cd - CRATER[2]) ** 2) / 120)); // vành hố
  land = land + (1.5 - land) * smooth(CRATER[2] - 6, CRATER[2] - 14, cd); // lòng hố
  if (land > 6) land = 0.2 * land + 0.8 * terrace(land, 5, 0.55); // vân đá tầng tầng
  land = land + (1.2 - land) * saltNear(x, z); // lòng chảo muối
  land = land + (2 - land) * smooth(11, 4, canyonDist(x, z)); // hẻm vực
  let h = coast(land, d, edge, 0.1);
  h = h + (-2 - h) * smooth(17, 8, Math.hypot(x - OASIS[0], z - OASIS[1])); // hồ ốc đảo
  return h;
}
function ground(x, z, y, slope) {
  if (slope > 0.42) return STRATA[((Math.floor(y / 2.2) % STRATA.length) + STRATA.length) % STRATA.length];
  if (y < 0.5) return C.wet;
  if (oasisNear(x, z) > 0.4 && y < 6) return mix3(C.sand, C.oasis, oasisNear(x, z));
  if (saltNear(x, z) > 0.3 && y < 3) return mix3(C.sand, mix3(C.salt, C.salt2, 0.5 + 0.5 * fbm(x * 0.08, z * 0.08)), saltNear(x, z));
  if (y > 18 && slope < 0.3) return C.top;
  const w = Math.abs(Math.sin((x * 0.6 + z * 0.8) * 0.06 + 2 * fbm(x * 0.02, z * 0.02, 2)));
  return mix3(mix3(C.sand2, C.sand, 0.5 + 0.5 * fbm(x * 0.04, z * 0.04)), C.crest, smooth(0.85, 1, w));
}
export default {
  key: 'desert',
  name: 'Sa Mạc',
  radius: R,
  cliff: { colors: ['#d98a68', '#eeb08a', '#c26e52', '#f2c29e'], freq: 1 / 2.2, range: [0.36, 0.56] }, // vân đá nhiều tầng
  height,
  ground,
  flora: [
    { type: 'palm', count: 90, where: (x, z, y, s) => (y > 0.3 && y < 6 && s < 0.4 ? Math.max(oasisNear(x, z), y < 2.5 ? 0.12 : 0) : 0) },
    { type: 'cactus', count: 140, where: (x, z, y, s) => (y > 2 && y < 12 && s < 0.35 ? 0.5 * (1 - saltNear(x, z)) : 0) },
    { type: 'dryGrass', count: 9000, where: (x, z, y, s) => (y > 1 && y < 14 && s < 0.4 ? (0.25 + 0.75 * oasisNear(x, z)) * (1 - saltNear(x, z)) : 0) },
    { type: 'rock', count: 120, where: (x, z, y, s) => (y > 0 && s > 0.25 && s < 0.6 ? 0.9 : 0) },
  ],
};
