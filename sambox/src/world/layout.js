// SamBox · src/world/layout.js · Ba đảo trong một bể kính tròn: vị trí, hướng, cỡ bể, độ cao chung của thế giới (thuần JS)
//   ISLANDS      [{ spec, x, z, turn }]: ba đảo xếp vòng quanh tâm bể, cách tâm RING, lệch nhau 120°, quay mặt vào nhau: mặt đảo
//                (phía +z của bản vẽ: bãi, hồ, đồng thấp) hướng về tâm bể, núi lưng ra thành kính. Đồng Bằng phía sau (nhìn từ góc
//                toàn cảnh thấy mặt đảo), Sa Mạc trước trái, Tuyết trước phải. Mỗi đảo vẽ theo bán kính gốc 300 rồi phóng ngang
//                × SCALE, cao × SCALE_Y, xoay turn (shape.js placed)
//   TANK         bể kính tròn tâm ở gốc toạ độ { r: bán kính (vòm kính bán cầu cùng bán kính), floor: đáy kính }
//   WORLD        cạnh vuông (tâm ở gốc) của bản đồ độ sâu biển, phủ hết lòng bể
//   heightAt(x, z)  độ cao mặt đất ở toạ độ thế giới (đáy biển giữa các đảo)
//   toWorld(I, lx, lz)  điểm (lx, lz) trên bản vẽ đảo I (bán kính gốc 300, mặt đảo phía +z) → [x, z] trong bể
//   island(x, z)    đảo chứa điểm này (hay null)
import plains from './islands/plains.js';
import desert from './islands/desert.js';
import tundra from './islands/tundra.js';
import { SEA_FLOOR, placed } from './islands/shape.js';

export const SCALE = 1.45,
  SCALE_Y = 1.2;
export const RING = 600;
// mặt đảo hướng về tâm: góc xoay đưa phía +z của bản vẽ về hướng (−x, −z) của chính đảo
const facing = (x, z) => Math.atan2(-z, -x) - Math.PI / 2;
export const ISLANDS = [
  [plains, 0, -RING],
  [desert, -Math.round(RING * 0.866), RING / 2],
  [tundra, Math.round(RING * 0.866), RING / 2],
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
