// SamBox · src/world/islands/plains.js · Đảo Đồng Bằng (núi đồi, đồng cỏ, rừng tán bông): đảo mẫu theo ảnh đích (ảnh 5–14)
// Dáng (bán kính 300, mặt đảo phía +z; khung đường chung lanes.js): khu nhà chính trũng giữa vành đồi rừng bậc thềm; rừng giữa là
// đồi thoải phủ rừng tán bông (một dải đồi dài phía tây, hai quả đồi rời phía đông, đồi bên suối, đồi thấp dần ra biển; đồi liền nhau
// bằng yên ngựa, từ lối mòn đi lên được), đá tảng nằm thành cụm ở sườn đồi; suối uốn chữ S từ chân vành đồi ra biển (hai bờ cỏ đi
// được, có vũng); sườn tây là cao nguyên mặt bàn vách đá, sườn đông là đồi cỏ đỉnh bằng (hai nền phẳng xây được, nhìn xuống đường
// chính); núi lớn nhiều bậc chắn sau khu nhà chính, có đèo; hồ phía đông có suối ra biển; vài cột đá ngoài biển; quanh đảo là đai
// ven biển. Đồng oải hương, lúa mì ở hai sườn.
import { fbm, ridged, simplex2, smooth } from '../../core/noise.js';
import { rgb, mix3, terrace, coast, bump, hills, lineDist, shoreEdge, RIM, onRim, keepRim } from './shape.js';
import { createPaths, EYE, PADS, padOut } from './lanes.js';

const R = 300;
const P = createPaths({ bends: [0, 40, 0, 0], pool: 162, seed: 1 }); // suối chữ S: khúc trên lượn phải, khúc dưới lượn trái, vũng cuối khúc dưới
// đồi rừng giữa [x, z, nửa dài, nửa ngang, cao thêm, hướng, lệch] (shape.js hills): to nhỏ, cao thấp, hướng khác nhau
const HILLS = [
  [-56, 58, 27, 17, 17, 0.15, 0.2], // đồi lớn phía tây, sát suối
  [-102, 50, 24, 14, 11, -0.1], // vai đồi kéo dài về phía đường chính (liền đồi lớn bằng yên ngựa)
  [74, 54, 27, 17, 17, 0.35, 0.2], // đồi phía đông
  [114, 54, 20, 14, 12, -0.3], // gò thấp gần đường chính đông (liền đồi đông bằng yên ngựa)
  [58, 156, 29, 22, 18, 0.5, -0.2], // đồi rộng phía trước đông (trong khúc uốn suối)
  [-82, 136, 25, 15, 14, -1.0, 0.3], // đồi thuôn phía trước tây, nằm dọc theo đường chính
  [-48, 186, 12, 10, 6],
  [34, 198, 11, 9, 5],
];
const LAKE = [198, -40];
const BROOK = [LAKE, [250, -40], [300, -35]]; // suối từ hồ ra biển
const STACKS = [[288, -44, 9, 34], [274, 46, 6, 22], [-32, -302, 8, 28], [-294, -66, 7, 24]]; // cột đá ngoài biển (ngoài đai ven biển)
const C = {
  grass: rgb('#8cc152'), grass2: rgb('#5e9e3e'), high: rgb('#86a35a'), sand: rgb('#ecd6a2'), wet: rgb('#c9ad7c'),
  rock: rgb('#d2b892'), rock2: rgb('#b0926c'), lav: rgb('#7f8a5c'), wheat: rgb('#c8a14a'),
  road: rgb('#cdbb9a'), road2: rgb('#b9a582'), dirt: rgb('#a88a62'), moss: rgb('#6f9a4a'), pebble: rgb('#9c9378'),
};
const lavender = (x, z) => smooth(0.28, 0.42, fbm(x * 0.012 + 5.3, z * 0.012 - 2.1, 3));
const wheat = (x, z) => smooth(0.28, 0.42, fbm(x * 0.012 - 7.7, z * 0.012 + 4.4, 3));
// rừng: dày ở vùng giữa hai đường chính (rừng phục kích), thưa ở hai sườn
const middle = (x, z) => smooth(150, 105, Math.abs(x)) * smooth(-70, -40, z) * smooth(225, 190, z);
const forest = (x, z) => Math.max(smooth(-0.15, 0.25, fbm(x * 0.012 + 11, z * 0.012 - 3, 3)) * middle(x, z), 0.35 * smooth(0.1, 0.4, fbm(x * 0.009 + 4, z * 0.009, 3)));
const edgeAt = (x, z) => shoreEdge(x, z, R, 1.3);
// chỗ trống (không cây, không ruộng): khu nhà chính, các lối đi, bờ suối, đai ven biển
// đá tảng nằm thành cụm tự nhiên (đốm nhiễu): sườn đồi, bìa rừng, ven lối
const stony = (x, z) => smooth(0.2, 0.46, fbm(x * 0.021 + 31, z * 0.021 - 31, 2));
const clear = (x, z) => {
  const p = P.paths(x, z);
  return Math.max(onRim(edgeAt(x, z) - Math.hypot(x, z)), p.town, p.lane, p.defile, p.trail, p.gorge, p.pass, p.ramp, p.pad);
};

function height(x, z) {
  const d = Math.hypot(x, z),
    edge = edgeAt(x, z);
  if (d > edge + 45) return stacks(coast(0, d, edge, 0), x, z); // ngoài khơi: chỉ còn đáy biển và cột đá, khỏi tính nhiễu
  const mid = middle(x, z); // (rừng giữa: gồ ghề ít hơn, không bậc thềm: lính đi lên rừng được)
  let land = 12 + 14 * (1 - 0.5 * mid) * fbm(x * 0.006, z * 0.006, 4) + 6 * (1 - 0.8 * mid) * fbm(x * 0.025, z * 0.025, 3);
  land += 22 * (1 - 0.75 * mid) * Math.max(0, fbm(x * 0.011 + 20, z * 0.011, 3)); // đồi cỏ lượn sóng
  land += 109 * bump(x, z, -5, -212, 80) * (0.8 + 0.28 * ridged(x * 0.011, z * 0.011, 4)); // núi lớn sau lưng khu nhà chính
  land += hills(HILLS, x, z, 1) * (0.9 + 0.25 * fbm(x * 0.021 + 4, z * 0.021, 3)); // đồi rừng giữa: thoải, mỗi quả một dáng
  const n = 0.12 * fbm(x * 0.03, z * 0.03, 2);
  land = Math.max(land, PADS[0].y * smooth(1.5, 1.2, padOut(PADS[0], x, z) + n)); // cao nguyên sườn tây: mặt bàn, vách quanh
  land = Math.max(land, PADS[1].y * smooth(2.5, 1.05, padOut(PADS[1], x, z) + n)); // đồi sườn đông: đỉnh bằng, sườn thoải
  land = Math.max(land, P.ring(x, z) + 4 * fbm(x * 0.05, z * 0.05, 2)); // vành đồi quanh khu nhà chính (bậc thềm như các đồi khác)
  const tk = (0.35 + 0.45 * smooth(-0.3, 0.4, fbm(x * 0.008 + 3, z * 0.008, 2))) * (1 - mid);
  land = (1 - tk) * land + tk * terrace(land, 15, 0.72); // bậc thềm không đều (trừ rừng giữa: đồi thoải)
  const cliff = 0.5 + 0.5 * simplex2(Math.atan2(z, x) * 1.6, 3.1);
  let h = coast(land, d, edge, smooth(-0.2, 0.3, cliff));
  h = P.channel(keepRim(P.withPaths(h, x, z), edge - d), x, z); // (sau bờ biển: lối đi ba đảo giống hệt nhau; suối khoét sau cùng)
  h = h + (-2 - h) * smooth(5, 2.5, lineDist(BROOK, x, z));
  h = h + (-4 - h) * smooth(26, 17, Math.hypot(x - LAKE[0], z - LAKE[1])); // hồ
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
  const p = P.paths(x, z);
  if (p.lane > 0.5) return mix3(C.road2, C.road, 0.5 + 0.5 * fbm(x * 0.2, z * 0.2)); // đường chính lát đá
  if (p.stream > 0.5) return mix3(C.pebble, C.wet, 0.5 + 0.5 * fbm(x * 0.3, z * 0.3)); // lòng suối sỏi
  if (p.trail > 0.5 || p.pass > 0.5 || p.ramp > 0.5) return C.dirt; // lối mòn, đèo, dốc lên nền phẳng
  let g = mix3(C.grass, C.grass2, 0.5 + 0.5 * fbm(x * 0.03, z * 0.03, 3));
  if (p.defile > 0.5) return mix3(g, C.dirt, 0.45); // khe sau cổng: lối đất cỏ mọc
  if (p.gorge > 0.5) return mix3(g, C.moss, 0.55); // hai bờ suối: cỏ rêu (lối nhỏ, không lát)
  if (y < RIM.level + 0.6) g = mix3(C.sand, g, smooth(RIM.bank + 3, RIM.bank + 9, edgeAt(x, z) - Math.hypot(x, z))); // đai ven biển: ngoài cát
  if (y > 60) g = mix3(g, C.high, smooth(60, 110, y));
  if (slope < 0.25 && y > 4 && y < 45 && clear(x, z) < 0.5 && middle(x, z) < 0.5) {
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
  flag: '#e8b83a', // cờ vàng (lúa vàng)
  buildZone: (x, z) => 1 - P.paths(x, z).way, // chỗ nào phẳng là xây được, trừ lối đi
  paths: P,
  height,
  ground,
  // luật mọc: số lượng (mức Cao) và xác suất ở một điểm
  flora: [
    { type: 'fluffy', count: 1700, where: (x, z, y, s) => flat(y, s, 2.5, 95, 0.5) * forest(x, z) * (1 - clear(x, z)) },
    { type: 'grass', count: 70000, where: (x, z, y, s) => flat(y, s, 2.4, 110, 0.55) * (1 - P.paths(x, z).lane) * (1 - P.paths(x, z).stream) * (1 - lavender(x, z) * (1 - middle(x, z))) },
    { type: 'lavender', count: 22000, where: (x, z, y, s) => flat(y, s, 4, 45, 0.25) * lavender(x, z) * (1 - clear(x, z)) * (1 - middle(x, z)) },
    { type: 'wheat', count: 22000, where: (x, z, y, s) => flat(y, s, 4, 45, 0.25) * wheat(x, z) * (1 - lavender(x, z)) * (1 - clear(x, z)) * (1 - middle(x, z)) },
    { type: 'rock', count: 200, where: (x, z, y, s) => (y > 0 && s > 0.3 && s < 0.7 ? 0.8 : 0) * (1 - clear(x, z)) },
    { type: 'boulder', count: 80, where: (x, z, y, s) => (y > 2.5 && s < 0.5 ? stony(x, z) * (1 - clear(x, z)) : 0) },
  ],
};
