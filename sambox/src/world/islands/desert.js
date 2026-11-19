// SamBox · src/world/islands/desert.js · Đảo Sa Mạc (cát hồng): cao nguyên đá nhiều tầng, hẻm vực bậc thang, núi bàn, cồn cát
// Dáng (bán kính 300, mặt đảo phía +z), lấy cảm giác cao độ và chiều sâu của ảnh đích: gần cả đảo là cao nguyên đá vân hồng (mặt
// cao nguyên cũng thành từng thềm) bị hẻm vực bậc thang xẻ từ cửa hẻm ở mặt đảo lên tới nhà chính gần lưng đảo (mẫu hẻm chung
// shape.js VALLEY: nền nhà chính bằng mặt cao nguyên, đứng ở đầu hẻm nhìn xuống); hồ ốc đảo trong lòng hẻm; núi bàn chắn sau lưng
// nhà chính và hai bên; miệng hố cổ phía đông; phía tây mặt đảo là vùng trũng cồn cát, rừng cột đá, chảo muối; quanh đảo là đai
// ven biển phẳng để xây tường thành.
import { fbm, smooth, rng, lerp } from '../../core/noise.js';
import { rgb, mix3, terrace, coast, shoreEdge, onRim, VALLEY, withValley, valleyFloor } from './shape.js';

const R = 300;
const PLATEAU = 46; // mặt cao nguyên (bằng nền nhà chính)
const BUTTES = [
  [-70, -205, 34, 86],
  [72, -210, 32, 80],
  [-180, -70, 28, 72],
  [175, -80, 26, 70],
  [-205, 50, 24, 66],
  [195, 70, 20, 62],
]; // núi bàn [tâm x, tâm z, bán kính, đỉnh]: hai khối sau lưng nhà chính, còn lại hai bên hẻm
const HOODOOS = (() => {
  const r = rng(77),
    out = [];
  for (let i = 0; i < 14; i++) out.push([-255 + r() * 95, -20 + r() * 170, 3 + r() * 2.5, 14 + r() * 16]);
  return out;
})(); // rừng cột đá hình nấm trong vùng trũng phía tây [x, z, bán kính, cao]
const OASIS = [-60, 105]; // hồ ốc đảo trong lòng hẻm (bậc dưới, phía trái)
const SALT = [-200, 20];
const CRATER = [165, -30, 30]; // [x, z, bán kính vành]
const STRATA = ['#d98a68', '#eaa984', '#c26e52', '#f2c29e', '#b9604a', '#e39a76'].map(rgb);
const C = {
  sand: rgb('#f0c3a6'), sand2: rgb('#e6ad8e'), crest: rgb('#f7d6bf'), top: rgb('#e0a47e'), oasis: rgb('#93b25a'), wet: rgb('#cf9a80'),
  salt: rgb('#f6ece4'), salt2: rgb('#e9d6cc'),
};
const edgeAt = (x, z) => shoreEdge(x, z, R, 4.1, 0.8);
const EYE = VALLEY.eye;
// chỗ trống (không cây): lòng hẻm, đai ven biển, chỗ đứng ngắm cảnh
const clear = (x, z) =>
  Math.max(valleyFloor(x, z), onRim(edgeAt(x, z) - Math.hypot(x, z)), smooth(30, 20, Math.hypot(x - EYE.from[0], z - EYE.from[1])));
const lowland = (x, z) => smooth(-130, -160, x + 10 * fbm(x * 0.02, z * 0.02, 2)) * smooth(-40, -10, z); // vùng trũng tây mặt đảo
const oasisNear = (x, z) => smooth(36, 14, Math.hypot(x - OASIS[0], z - OASIS[1]));
const saltNear = (x, z) => smooth(36, 26, Math.hypot(x - SALT[0], z - SALT[1]) + 8 * fbm(x * 0.03, z * 0.03, 2));
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
  land = withValley(land, x, z, 14); // hẻm vực lên nhà chính: vách là mép cao nguyên vân đá
  let h = coast(land, d, edge, 0.75);
  h = h + (-2 - h) * smooth(18, 11, Math.hypot(x - OASIS[0], z - OASIS[1])); // hồ ốc đảo
  return h;
}
function ground(x, z, y, slope) {
  if (slope > 0.42) return STRATA[((Math.floor(y / 2.2) % STRATA.length) + STRATA.length) % STRATA.length];
  if (y < 0.5) return C.wet;
  if (oasisNear(x, z) > 0.3 && y < 18) return mix3(C.sand, C.oasis, oasisNear(x, z)); // cỏ quanh hồ ốc đảo
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
  flag: '#f08cae', // cờ hồng (cát hồng)
  height,
  ground,
  flora: [
    { type: 'palm', count: 90, where: (x, z, y, s) => (y > 0.3 && y < 20 && s < 0.4 ? oasisNear(x, z) * (1 - 0.7 * clear(x, z)) : 0) },
    { type: 'cactus', count: 140, where: (x, z, y, s) => (y > 2 && y < 52 && s < 0.35 ? 0.5 * (1 - saltNear(x, z)) * (1 - clear(x, z)) : 0) },
    { type: 'dryGrass', count: 9000, where: (x, z, y, s) => (y > 1 && y < 52 && s < 0.4 ? (0.25 + 0.75 * oasisNear(x, z)) * (1 - saltNear(x, z)) : 0) },
    { type: 'rock', count: 120, where: (x, z, y, s) => (y > 0 && s > 0.25 && s < 0.6 ? 0.9 : 0) * (1 - clear(x, z)) },
  ],
};
