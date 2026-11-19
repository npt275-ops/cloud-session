// SamBox · src/world/layout.js · Ba đảo trong một bể kính tròn: vị trí, hướng, cỡ bể, độ cao chung của thế giới (thuần JS)
//   ISLANDS      [{ spec, x, z, turn }]: ba đảo xếp vòng quanh tâm bể, cách tâm RING, lệch nhau 120°, quay mặt vào nhau: mặt đảo
//                (phía +z của bản vẽ: bãi, hồ, đồng thấp) hướng về tâm bể, núi lưng ra thành kính. Đồng Bằng phía sau (nhìn từ góc
//                toàn cảnh thấy mặt đảo), Sa Mạc trước trái, Tuyết trước phải. Mỗi đảo vẽ theo bán kính gốc 300 rồi phóng ngang
//                × SCALE, cao × SCALE_Y, xoay turn (shape.js placed)
//   TANK         bể kính tròn tâm ở gốc toạ độ { r: bán kính (vòm kính bán cầu cùng bán kính), floor: đáy kính }
//   WORLD        cạnh vuông (tâm ở gốc) của bản đồ độ sâu biển, phủ hết lòng bể
//   heightAt(x, z)  độ cao mặt đất ở toạ độ thế giới (đáy biển giữa các đảo)
//   toWorld(I, lx, lz)  điểm (lx, lz) trên bản vẽ đảo I (bán kính gốc 300, mặt đảo phía +z) → [x, z] trong bể
//   hallAt(I)       tâm nền nhà chính của đảo I [x, y, z] (mẫu hẻm chung shape.js VALLEY: ba nhà chính thành tam giác đều)
//   BRIDGES         ba cây cầu [{ a, b, from, to }]: đầu cầu trái của đảo a nối đầu cầu phải của đảo kế bên b (toạ độ thế giới)
//   road(I, side)   đường lính trên đảo I từ đầu cầu (0 trái, 1 phải) qua cửa hẻm lên nhà chính: điểm [x, y, z] cách nhau ~3
//   pathLength(pts) chiều dài đường gấp khúc 3 chiều
//   island(x, z)    đảo chứa điểm này (hay null)
import plains from './islands/plains.js';
import desert from './islands/desert.js';
import tundra from './islands/tundra.js';
import { SEA_FLOOR, placed, VALLEY, roadPath } from './islands/shape.js';

export const SCALE = 1.45,
  SCALE_Y = 1.2;
export const RING = 600;
// mặt đảo hướng về tâm: góc xoay đưa phía +z của bản vẽ về hướng (−x, −z) của chính đảo
const facing = (x, z) => Math.atan2(-z, -x) - Math.PI / 2;
export const ISLANDS = [
  [plains, 0, -RING],
  [desert, (-RING * Math.sqrt(3)) / 2, RING / 2],
  [tundra, (RING * Math.sqrt(3)) / 2, RING / 2],
].map(([spec, x, z]) => ({ spec: placed(spec, SCALE, SCALE_Y, facing(x, z)), x, z, turn: facing(x, z) }));
export const TANK = { r: 1130, floor: -200 }; // (lưới đất mỗi đảo tròn bán kính 1,15 × bán kính đảo: RING + 500 < r)
export const WORLD = 2300;
export function island(x, z) {
  for (const I of ISLANDS) if (Math.hypot(x - I.x, z - I.z) < I.spec.radius * 1.15) return I;
  return null;
}
export function heightAt(x, z) {
  const I = island(x, z);
  return I ? I.spec.height(x - I.x, z - I.z) : SEA_FLOOR * SCALE_Y;
}
export function toWorld(I, lx, lz) {
  const c = Math.cos(I.turn),
    s = Math.sin(I.turn);
  return [I.x + (lx * c - lz * s) * SCALE, I.z + (lx * s + lz * c) * SCALE];
}
export function hallAt(I) {
  const [x, z] = toWorld(I, ...VALLEY.hall);
  return [x, I.spec.height(x - I.x, z - I.z), z];
}
const by = (k) => ISLANDS.find((I) => I.spec.key === k);
export const BRIDGES = [['plains', 'desert'], ['desert', 'tundra'], ['tundra', 'plains']].map(([a, b]) => ({
  a,
  b,
  from: toWorld(by(a), ...VALLEY.heads[0]),
  to: toWorld(by(b), ...VALLEY.heads[1]),
}));
export function road(I, side) {
  const pts = [];
  const P = roadPath(side).map(([lx, lz]) => toWorld(I, lx, lz));
  for (let i = 0; i < P.length - 1; i++) {
    const [ax, az] = P[i],
      [bx, bz] = P[i + 1],
      n = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / 3));
    for (let k = i ? 1 : 0; k <= n; k++) {
      const x = ax + ((bx - ax) * k) / n,
        z = az + ((bz - az) * k) / n;
      pts.push([x, I.spec.height(x - I.x, z - I.z), z]);
    }
  }
  return pts;
}
export const pathLength = (pts) => pts.slice(1).reduce((s, p, i) => s + Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1], p[2] - pts[i][2]), 0);
