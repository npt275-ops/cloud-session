// SamBox · src/world/islands/desert.js · Đảo Sa Mạc (cát hồng): bãi cát hồng gợn sóng, núi bàn có vân đá nhiều tầng, hẻm vực
// Dáng: đụn cát thấp chạy chéo theo gió; bốn khối núi bàn (mesa) đỉnh phẳng, vách dựng sọc nhiều màu; một hẻm vực uốn khúc xẻ
// ngang khối lớn nhất; ốc đảo ven biển phía đông nam (hồ nhỏ, cây dừa, cỏ xanh). Bờ biển thoải, cát mịn.
import { fbm, smooth, simplex2 } from '../../core/noise.js';
import { rgb, mix3, terrace, coast } from './shape.js';

const R = 185;
const MESAS = [
  [-38, -28, 52, 62],
  [62, 18, 30, 44],
  [8, 84, 24, 34],
  [-96, 44, 22, 40],
]; // [tâm x, tâm z, bán kính, độ cao]
const HOODOOS = [[40, -60, 5, 30], [-80, -40, 4, 24], [70, 70, 4.5, 26], [-20, 40, 3.5, 20], [100, 10, 4, 22], [-60, 95, 3.5, 18]]; // cột đá hình nấm
const OASIS = [92, -62];
const STRATA = ['#d98a68', '#eaa984', '#c26e52', '#f2c29e', '#b9604a', '#e39a76'].map(rgb);
const C = { sand: rgb('#f0c3a6'), sand2: rgb('#e6ad8e'), crest: rgb('#f7d6bf'), top: rgb('#e0a47e'), oasis: rgb('#93b25a'), wet: rgb('#cf9a80') };
// khoảng cách tới đường hẻm vực (đoạn gấp khúc)
const CANYON = [[-100, -70], [-55, -40], [-30, -10], [-5, -30], [30, -5]];
function canyonDist(x, z) {
  let best = 1e9;
  for (let i = 0; i < CANYON.length - 1; i++) {
    const [ax, az] = CANYON[i],
      [bx, bz] = CANYON[i + 1],
      dx = bx - ax,
      dz = bz - az,
      t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz)));
    best = Math.min(best, Math.hypot(x - ax - dx * t, z - az - dz * t));
  }
  return best + 3 * simplex2(x * 0.05, z * 0.05);
}
const oasisNear = (x, z) => smooth(34, 12, Math.hypot(x - OASIS[0], z - OASIS[1]));

function height(x, z) {
  const d = Math.hypot(x, z),
    edge = R * 0.8 + 18 * fbm(x * 0.011 + 9, z * 0.011, 3);
  const w = 2 * fbm(x * 0.02, z * 0.02, 2);
  let land = 3 + 2.5 * fbm(x * 0.01, z * 0.01, 3) + 2.4 * Math.abs(Math.sin((x * 0.6 + z * 0.8) * 0.09 + w));
  for (const [cx, cz, r, hm] of MESAS) {
    const k = smooth(r + 6, r - 3, Math.hypot(x - cx, z - cz) + 7 * fbm(x * 0.04, z * 0.04, 2));
    land = Math.max(land, k * (hm + 4 * fbm(x * 0.03, z * 0.03)));
  }
  for (const [cx, cz, r, hm] of HOODOOS) {
    const dd = Math.hypot(x - cx, z - cz);
    land = Math.max(land, smooth(r + 1, r - 1, dd) * hm + smooth(r * 1.9, r * 1.3, dd) * hm * 0.12); // thân cột, mũ rộng hơn ở đỉnh
  }
  if (land > 6) land = 0.2 * land + 0.8 * terrace(land, 5, 0.55); // vân đá tầng tầng
  land = land + (2 - land) * smooth(10, 4, canyonDist(x, z)); // hẻm vực
  let h = coast(land, d, edge, 0.1);
  h = h + (-2 - h) * smooth(15, 7, Math.hypot(x - OASIS[0], z - OASIS[1])); // hồ ốc đảo
  return h;
}
function ground(x, z, y, slope) {
  if (slope > 0.42) return STRATA[((Math.floor(y / 2.2) % STRATA.length) + STRATA.length) % STRATA.length];
  if (y < 0.5) return C.wet;
  if (oasisNear(x, z) > 0.4 && y < 6) return mix3(C.sand, C.oasis, oasisNear(x, z));
  if (y > 14) return C.top;
  const w = Math.abs(Math.sin((x * 0.6 + z * 0.8) * 0.09 + 2 * fbm(x * 0.02, z * 0.02, 2)));
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
    { type: 'cactus', count: 140, where: (x, z, y, s) => (y > 2 && y < 9 && s < 0.35 ? 0.5 : 0) },
    { type: 'dryGrass', count: 9000, where: (x, z, y, s) => (y > 1 && y < 12 && s < 0.4 ? 0.25 + 0.75 * oasisNear(x, z) : 0) },
    { type: 'rock', count: 120, where: (x, z, y, s) => (y > 0 && s > 0.25 && s < 0.6 ? 0.9 : 0) },
  ],
};
