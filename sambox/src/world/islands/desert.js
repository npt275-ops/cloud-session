// SamBox · src/world/islands/desert.js · Đảo Sa Mạc (cát hồng, đá vân): mê cung núi bàn, khe vực, ốc đảo, cột đá, chảo muối
// Dáng (bán kính 300, mặt đảo phía +z; khung đường chung lanes.js): mặt đất là cồn cát thấp; rừng giữa là mê cung núi bàn vân đá
// (hẻm suối xẻ đôi núi bàn lớn thành khe vực hẹp), hồ ốc đảo bên bến lội; sườn tây có núi bàn đứng (đất cao), rừng cột đá và chảo
// muối; sườn đông có núi bàn và miệng hố cổ; sau khu nhà chính là cao nguyên và hai núi bàn lớn chắn, có đèo; quanh đảo là đai ven
// biển.
import { fbm, smooth, rng, lerp } from '../../core/noise.js';
import { rgb, mix3, terrace, coast, lineDist, shoreEdge, RIM, onRim, keepRim } from './shape.js';
import { withPaths, paths, inTown, STREAM, EYE } from './lanes.js';

const R = 300;
const MESAS = [
  [0, 55, 46, 58], // núi bàn lớn giữa rừng (hẻm suối xẻ đôi)
  [-75, 128, 26, 42],
  [75, 122, 26, 42], // núi bàn trước
  [-64, -8, 22, 40],
  [64, -6, 22, 40], // núi bàn sau, sát khu nhà chính
  [-118, 55, 14, 34],
  [118, 50, 14, 34], // trụ đá giữa lối mòn và đường chính
  [-200, 30, 30, 52],
  [205, 30, 28, 50], // đất cao hai sườn
  [-70, -205, 34, 86],
  [72, -210, 32, 80], // núi bàn sau lưng khu nhà chính
]; // [tâm x, tâm z, bán kính, đỉnh]
const HOODOOS = (() => {
  const r = rng(77),
    out = [];
  for (let i = 0; i < 14; i++) out.push([-238 + r() * 58, 110 + r() * 90, 3 + r() * 2.5, 14 + r() * 16]);
  return out;
})(); // rừng cột đá hình nấm ở sườn tây [x, z, bán kính, cao]
const OASIS = [34, 120]; // hồ ốc đảo bên bến lội (lệch khỏi lối mòn)
const SALT = [-205, -55];
const CRATER = [205, -65, 24]; // [x, z, bán kính vành]
const STRATA = ['#d98a68', '#eaa984', '#c26e52', '#f2c29e', '#b9604a', '#e39a76'].map(rgb);
const C = {
  sand: rgb('#f0c3a6'), sand2: rgb('#e6ad8e'), crest: rgb('#f7d6bf'), top: rgb('#e0a47e'), oasis: rgb('#93b25a'), wet: rgb('#cf9a80'),
  salt: rgb('#f6ece4'), salt2: rgb('#e9d6cc'), road: rgb('#ecd2b4'), road2: rgb('#dcb998'), trail: rgb('#c99a78'),
};
const edgeAt = (x, z) => shoreEdge(x, z, R, 4.1, 0.8);
const clear = (x, z) => {
  const p = paths(x, z);
  return Math.max(onRim(edgeAt(x, z) - Math.hypot(x, z)), p.town, p.lane, p.trail, p.gorge, p.pass);
};
const oasisNear = (x, z) => Math.max(smooth(30, 10, Math.hypot(x - OASIS[0], z - OASIS[1])), 0.7 * smooth(10, 3, lineDist(STREAM, x, z)));
const saltNear = (x, z) => smooth(32, 22, Math.hypot(x - SALT[0], z - SALT[1]) + 8 * fbm(x * 0.03, z * 0.03, 2));
const strata = (h) => (h > 6 ? 0.2 * h + 0.8 * terrace(h, 5, 0.55) : h); // vân đá tầng tầng (đá; cồn cát không qua đây)

function rockForms(x, z) {
  let h = 0;
  for (const [cx, cz, r, hm] of MESAS) {
    const k = smooth(r + 6, r - 3, Math.hypot(x - cx, z - cz) + 9 * fbm(x * 0.035, z * 0.035, 2));
    if (k > 0) h = Math.max(h, k * (hm + 4 * fbm(x * 0.03, z * 0.03)));
  }
  for (const [cx, cz, r, hm] of HOODOOS) {
    const dd = Math.hypot(x - cx, z - cz);
    h = Math.max(h, smooth(r + 1, r - 1, dd) * hm + smooth(r * 1.9, r * 1.3, dd) * hm * 0.12); // thân cột, mũ rộng hơn ở đỉnh
  }
  const cd = Math.hypot(x - CRATER[0], z - CRATER[1]);
  return Math.max(h, 20 * Math.exp(-((cd - CRATER[2]) ** 2) / 90)); // vành hố cổ
}
function height(x, z) {
  const d = Math.hypot(x, z),
    edge = edgeAt(x, z);
  if (d > edge + 45) return coast(0, d, edge, 0); // ngoài khơi: chỉ còn đáy biển, khỏi tính nhiễu
  const w = 2 * fbm(x * 0.02, z * 0.02, 2);
  let land = 9 + 3 * fbm(x * 0.008, z * 0.008, 3) + 4 * Math.abs(Math.sin((x * 0.6 + z * 0.8) * 0.06 + w)) ** 1.6; // cồn cát
  land = Math.max(land, lerp(0, 58 + 3 * fbm(x * 0.01, z * 0.01, 3), smooth(-140, -172, z))); // cao nguyên sau lưng
  land = Math.max(land, strata(rockForms(x, z)));
  land = lerp(land, 2, smooth(CRATER[2] - 8, CRATER[2] - 16, Math.hypot(x - CRATER[0], z - CRATER[1]))); // lòng hố
  land = land + (1.2 - land) * saltNear(x, z); // chảo muối
  let h = coast(land, d, edge, 0.6);
  h = keepRim(withPaths(h, x, z), edge - d); // (sau bờ biển: lối đi trên ba đảo giống hệt nhau, không lệch theo bờ riêng)
  h = h + (-2 - h) * smooth(3.5, 1.8, lineDist(STREAM, x, z)); // suối ốc đảo trong hẻm (khoét sau cùng nên ra tới biển)
  h = h + (-2 - h) * smooth(13, 8, Math.hypot(x - OASIS[0], z - OASIS[1])); // hồ ốc đảo
  return h;
}
function ground(x, z, y, slope) {
  if (slope > 0.42) return STRATA[((Math.floor(y / 2.2) % STRATA.length) + STRATA.length) % STRATA.length];
  if (y < 0.5) return C.wet;
  const p = paths(x, z);
  if (p.lane > 0.5) return mix3(C.road2, C.road, 0.5 + 0.5 * fbm(x * 0.2, z * 0.2)); // đường chính đá cát nén
  if (p.trail > 0.5 || p.pass > 0.5) return C.trail; // lối mòn, đèo
  if (oasisNear(x, z) > 0.3 && y < 24) return mix3(C.sand, C.oasis, oasisNear(x, z)); // cỏ quanh hồ ốc đảo, ven suối
  if (saltNear(x, z) > 0.3 && y < 3) return mix3(C.sand, mix3(C.salt, C.salt2, 0.5 + 0.5 * fbm(x * 0.08, z * 0.08)), saltNear(x, z));
  if (y > 26 && slope < 0.3) return mix3(C.top, C.sand2, 0.2 + 0.25 * fbm(x * 0.05, z * 0.05)); // mặt núi bàn, cao nguyên
  if (y < RIM.level + 0.6) return C.sand;
  const wv = Math.abs(Math.sin((x * 0.6 + z * 0.8) * 0.06 + 2 * fbm(x * 0.02, z * 0.02, 2)));
  return mix3(mix3(C.sand2, C.sand, 0.5 + 0.5 * fbm(x * 0.04, z * 0.04)), C.crest, smooth(0.85, 1, wv));
}
export default {
  key: 'desert',
  name: 'Sa Mạc',
  radius: R,
  cliff: { colors: ['#d98a68', '#eeb08a', '#c26e52', '#f2c29e'], freq: 1 / 2.2, range: [0.36, 0.56] }, // vân đá nhiều tầng
  eye: EYE,
  flag: '#f08cae', // cờ hồng (cát hồng)
  buildZone: inTown, // chỉ xây trong khu nhà chính
  height,
  ground,
  flora: [
    { type: 'palm', count: 90, where: (x, z, y, s) => (y > 0.3 && y < 24 && s < 0.4 ? oasisNear(x, z) * (1 - 0.8 * clear(x, z)) : 0) },
    { type: 'cactus', count: 160, where: (x, z, y, s) => (y > 2 && y < 60 && s < 0.35 ? 0.5 * (1 - saltNear(x, z)) * (1 - clear(x, z)) : 0) },
    { type: 'dryGrass', count: 9000, where: (x, z, y, s) => (y > 1 && y < 60 && s < 0.4 ? (0.25 + 0.75 * oasisNear(x, z)) * (1 - saltNear(x, z)) * (1 - paths(x, z).lane) : 0) },
    { type: 'rock', count: 140, where: (x, z, y, s) => (y > 0 && s > 0.25 && s < 0.6 ? 0.9 : 0) * (1 - clear(x, z)) },
  ],
};
