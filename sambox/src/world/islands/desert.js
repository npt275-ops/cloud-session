// SamBox · src/world/islands/desert.js · Đảo Sa Mạc (cát hồng): biển cồn cát, đồi cát hình sao, suối ốc đảo, cột đá, chảo muối
// Dáng (bán kính 300, mặt đảo phía +z; khung đường chung lanes.js): mặt đất là biển cát (sóng cồn dài uốn theo gió, đỉnh sắc chân
// tròn); khu nhà chính trũng giữa vành đá vân có cát dồn ngoài; rừng giữa là núi cát hình sao cao (che tầm nhìn ra cầu; thung giữa
// các núi và hai bên lối mòn thoải), suối ốc đảo xẻ qua núi cát giữa, khúc dưới vòng cổ ngỗng, hồ ốc đảo ở đỉnh vòng (bờ cỏ, cọ);
// sườn tây là thềm cát phẳng, rừng cột đá, chảo
// muối; sườn đông là núi bàn thấp đỉnh phẳng, miệng hố cổ (hai nền phẳng xây được, nhìn xuống đường chính); sau khu nhà chính là
// biển cát cao với hai đồi cát lớn chắn, có đèo; quanh đảo là đai ven biển. Đá chỉ còn ở vành khu, cột đá, núi bàn, hố cổ.
import { fbm, smooth, rng, lerp } from '../../core/noise.js';
import { rgb, mix3, terrace, coast, shoreEdge, RIM, onRim, keepRim } from './shape.js';
import { createPaths, EYE, PADS, padOut, MOUNTS } from './lanes.js';

const R = 300;
const P = createPaths({ bends: [11, -39, 11, 0], pool: 156, seed: 2, canyon: 10 }); // suối: khúc trên lượn nhẹ trái, khúc dưới vòng lớn sang phải
// đồi cát hình sao (đỉnh giữa, ba sống cát toả ra): núi giữa chung khung (lanes.js MOUNTS: cùng chỗ, cùng độ cao) [x, z, bán kính, cao,
// xoay sống]; hai đồi cát lớn sau lưng khu nhà chính (chân loang rộng) [x, z, bán kính, cao]
const STARS = MOUNTS.map(([x, z, ax, az, h], i) => [x, z, Math.sqrt(ax * az), h, i * 1.7]);
const BACKDUNES = [[-70, -214, 93, 84], [72, -216, 87, 78]];
function star(x, z, [cx, cz, r, h, rot]) {
  const dx = x - cx,
    dz = z - cz,
    d = Math.hypot(dx, dz);
  if (d > r * 1.5) return 0;
  const u = (d / (r * 0.95)) ** 2;
  let v = u < 1 ? h * (1 - u) ** 1.5 : 0; // đỉnh giữa
  for (let a = 0; a < 3; a++) {
    const t = rot + (a * 2 * Math.PI) / 3,
      along = (dx * Math.cos(t) + dz * Math.sin(t)) / (r * 1.45),
      across = Math.abs(-dx * Math.sin(t) + dz * Math.cos(t)) / (r * 0.62 * (1 - 0.5 * Math.min(1, Math.max(0, along))));
    if (along > 0 && along < 1 && across < 1) v = Math.max(v, h * 0.62 * (1 - along) ** 1.3 * (1 - across)); // sống cát: đỉnh sắc
  }
  return v;
}
const HOODOOS = (() => {
  const r = rng(77),
    out = [];
  for (let i = 0; i < 14; i++) out.push([-238 + r() * 58, 110 + r() * 90, 3 + r() * 2.5, 14 + r() * 16]);
  return out;
})(); // rừng cột đá hình nấm ở sườn tây [x, z, bán kính, cao]
const SALT = [-205, -55];
const CRATER = [205, -65, 24]; // [x, z, bán kính vành]
const STRATA = ['#d98a68', '#eaa984', '#c26e52', '#f2c29e', '#b9604a', '#e39a76'].map(rgb);
const C = {
  sand: rgb('#f0c3a6'), sand2: rgb('#e2a687'), crest: rgb('#f9dcc6'), lee: rgb('#d99a7e'), top: rgb('#e0a47e'), oasis: rgb('#93b25a'),
  wet: rgb('#cf9a80'), salt: rgb('#f6ece4'), salt2: rgb('#e9d6cc'), road: rgb('#ecd2b4'), road2: rgb('#dcb998'), trail: rgb('#c99a78'),
};
const edgeAt = (x, z) => shoreEdge(x, z, R, 4.1, 0.8);
const clear = (x, z) => {
  const p = P.paths(x, z);
  return Math.max(onRim(edgeAt(x, z) - Math.hypot(x, z)), p.town, p.lane, p.defile, p.trail, p.gorge, p.pass, p.ramp, p.pad);
};
// ốc đảo: quanh hồ ở đỉnh vòng suối và dọc hai bờ suối
const oasisNear = (x, z) => Math.max(smooth(34, 14, Math.hypot(x - P.pool.x, z - P.pool.z)), 0.7 * P.paths(x, z).gorge);
const saltNear = (x, z) => smooth(32, 22, Math.hypot(x - SALT[0], z - SALT[1]) + 8 * fbm(x * 0.03, z * 0.03, 2));
const strata = (h) => (h > 6 ? 0.2 * h + 0.8 * terrace(h, 5, 0.55) : h); // vân đá tầng tầng (chỉ đá; cát không qua đây)

// sóng cồn: pha theo hướng gió (uốn bằng nhiễu) và độ cao đỉnh sóng (0 chân, 1 đỉnh)
function wave(x, z) {
  const u = (x * 0.5 + z * 0.866 + 22 * fbm(x * 0.005 + 3, z * 0.005 - 1, 2)) * 0.05;
  return { u, k: Math.pow(0.5 + 0.5 * Math.cos(u), 1.7) };
}
// cát: biển cồn + đồi cát hình sao + thềm cát sườn tây + biển cát cao sau lưng + cát dồn ngoài vành đá + bờ cát hai bên suối
const memo = (f) => {
  let kx = NaN,
    kz = NaN,
    kv = 0;
  return (x, z) => (x === kx && z === kz ? kv : ((kx = x), (kz = z), (kv = f(x, z))));
};
const sand = memo(sandAt),
  rock = memo(rockAt);
function sandAt(x, z) {
  let h = 9 + 4 * fbm(x * 0.009, z * 0.009, 3) + (5 + 8 * smooth(-0.35, 0.45, fbm(x * 0.007 - 5, z * 0.007 + 2, 2))) * wave(x, z).k;
  for (const S of STARS) h = Math.max(h, star(x, z, S));
  for (const [cx, cz, r, hm] of BACKDUNES) {
    const d2 = (x - cx) ** 2 + (z - cz) ** 2;
    if (d2 < 9 * r * r) h = Math.max(h, hm * Math.exp((-1.2 * d2) / (r * r)));
  }
  h = Math.max(h, lerp(0, 50 + 6 * fbm(x * 0.01, z * 0.01, 3), smooth(-140, -176, z))); // biển cát cao sau lưng khu nhà chính
  h = Math.max(h, PADS[0].y * smooth(2.2, 1.1, padOut(PADS[0], x, z) + 0.15 * fbm(x * 0.03, z * 0.03, 2))); // thềm cát sườn tây
  return Math.max(h, 0.8 * P.ring(x, z, 86), P.walls(x, z)); // cát dồn ngoài vành đá; bờ cát hai bên suối
}
// đá: vành khu nhà chính, núi bàn thấp sườn đông, cột đá, vành hố cổ (vân đá tầng tầng)
function rockAt(x, z) {
  let h = Math.max(P.ring(x, z), PADS[1].y * smooth(1.45, 1.15, padOut(PADS[1], x, z) + 0.12 * fbm(x * 0.03, z * 0.03, 2)));
  for (const [cx, cz, r, hm] of HOODOOS) {
    const dd = Math.hypot(x - cx, z - cz);
    h = Math.max(h, smooth(r + 1, r - 1, dd) * hm + smooth(r * 1.9, r * 1.3, dd) * hm * 0.12); // thân cột, mũ rộng hơn ở đỉnh
  }
  const cd = Math.hypot(x - CRATER[0], z - CRATER[1]);
  return strata(Math.max(h, 20 * Math.exp(-((cd - CRATER[2]) ** 2) / 90))); // vành hố cổ
}
function height(x, z) {
  const d = Math.hypot(x, z),
    edge = edgeAt(x, z);
  if (d > edge + 45) return coast(0, d, edge, 0); // ngoài khơi: chỉ còn đáy biển, khỏi tính nhiễu
  let land = Math.max(sand(x, z), rock(x, z));
  land = lerp(land, 2, smooth(CRATER[2] - 8, CRATER[2] - 16, Math.hypot(x - CRATER[0], z - CRATER[1]))); // lòng hố
  land = land + (1.2 - land) * saltNear(x, z); // chảo muối
  const h = coast(land, d, edge, 0.6);
  return P.channel(keepRim(P.withPaths(h, x, z), edge - d), x, z); // (sau bờ biển: lối đi ba đảo giống hệt nhau; suối khoét sau cùng)
}
function ground(x, z, y, slope) {
  const p = P.paths(x, z),
    stone = rock(x, z) > sand(x, z) + 0.5 && y > 3; // (mặt đá lộ, không phải cát)
  if (stone && slope > 0.3) return STRATA[((Math.floor(y / 2.2) % STRATA.length) + STRATA.length) % STRATA.length];
  if (slope > 0.42) return mix3(C.lee, C.sand2, 0.3 + 0.3 * fbm(x * 0.06, z * 0.06)); // vách cát xẻ (bờ hẻm, lối đi)
  if (y < 0.5) return C.wet;
  if (p.lane > 0.5) return mix3(C.road2, C.road, 0.5 + 0.5 * fbm(x * 0.2, z * 0.2)); // đường chính đá cát nén
  if (p.stream > 0.5) return C.wet; // lòng suối
  if (p.trail > 0.5 || p.pass > 0.5 || p.defile > 0.5 || p.ramp > 0.5) return C.trail; // lối mòn, đèo, khe, dốc lên nền phẳng
  if (oasisNear(x, z) > 0.3 && y < 24) return mix3(C.sand, C.oasis, oasisNear(x, z)); // cỏ quanh hồ ốc đảo, ven suối
  if (saltNear(x, z) > 0.3 && y < 3) return mix3(C.sand, mix3(C.salt, C.salt2, 0.5 + 0.5 * fbm(x * 0.08, z * 0.08)), saltNear(x, z));
  if (stone) return mix3(C.top, C.sand2, 0.2 + 0.25 * fbm(x * 0.05, z * 0.05)); // mặt đá phẳng (núi bàn, trụ đá)
  if (y < RIM.level + 0.6) return C.sand;
  // cát: đỉnh cồn sáng, sườn khuất gió sẫm hơn, gợn cát
  const w = wave(x, z),
    lee = smooth(0.1, 0.9, Math.sin(w.u)) * (1 - w.k),
    rip = Math.abs(Math.sin((x * 0.6 + z * 0.8) * 0.21 + 2 * fbm(x * 0.03, z * 0.03, 2)));
  let c = mix3(mix3(C.sand, C.sand2, 0.35 + 0.35 * fbm(x * 0.04, z * 0.04)), C.lee, 0.45 * lee);
  c = mix3(c, C.crest, smooth(0.82, 1, w.k) * 0.8 + smooth(0.9, 1, rip) * 0.25);
  return c;
}
export default {
  key: 'desert',
  name: 'Sa Mạc',
  radius: R,
  cliff: { colors: ['#d98a68', '#eeb08a', '#c26e52', '#f2c29e'], freq: 1 / 2.2, range: [0.5, 0.72] }, // vân đá ở vách dựng đứng
  eye: EYE,
  flag: '#f08cae', // cờ hồng (cát hồng)
  buildZone: (x, z) => 1 - P.paths(x, z).way, // chỗ nào phẳng là xây được, trừ lối đi
  cliffMask: (x, z) => smooth(-0.5, 1.5, rock(x, z) - sand(x, z)), // (vân đá chỉ ở đá thật; sườn cát dốc vẫn là cát)
  paths: P,
  height,
  ground,
  flora: [
    { type: 'palm', count: 150, where: (x, z, y, s) => (y > 0.3 && y < 24 && s < 0.4 ? oasisNear(x, z) * (1 - 0.8 * clear(x, z)) : 0) },
    { type: 'cactus', count: 160, where: (x, z, y, s) => (y > 2 && y < 60 && s < 0.3 ? 0.4 * (1 - saltNear(x, z)) * (1 - clear(x, z)) : 0) },
    { type: 'dryGrass', count: 9000, where: (x, z, y, s) => (y > 1 && y < 60 && s < 0.4 ? (0.2 + 0.8 * oasisNear(x, z)) * (1 - saltNear(x, z)) * (1 - P.paths(x, z).lane) * (1 - P.paths(x, z).stream) : 0) },
    { type: 'rock', count: 120, where: (x, z, y, s) => (y > 0 && s > 0.25 && s < 0.6 && rock(x, z) > 2 ? 0.9 : 0) * (1 - clear(x, z)) },
  ],
};
