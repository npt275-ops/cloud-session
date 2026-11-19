// SamBox · src/world/layout.js · Ba đảo trong một bể kính: vị trí, cỡ bể, độ cao chung của cả thế giới (thuần JS)
//   ISLANDS      [{ spec, x, z }]: đảo Đồng Bằng phía trước, Sa Mạc bên trái, Tuyết bên phải; mỗi đảo vẽ theo bán kính gốc 300
//                rồi phóng ngang × SCALE, cao × SCALE_Y (shape.js scaled)
//   TANK         bể kính { x, z: tâm; w, d: rộng, sâu; floor: đáy cát; top: mép trên thành kính }
//   WORLD        cạnh vuông (tâm ở gốc) của bản đồ độ sâu biển, phủ hết lòng bể
//   heightAt(x, z)  độ cao mặt đất ở toạ độ thế giới (đáy biển giữa các đảo)
//   island(x, z)    đảo chứa điểm này (hay null)
import plains from './islands/plains.js';
import desert from './islands/desert.js';
import tundra from './islands/tundra.js';
import { SEA_FLOOR, scaled } from './islands/shape.js';

export const SCALE = 1.45,
  SCALE_Y = 1.2;
export const ISLANDS = [
  { spec: scaled(plains, SCALE, SCALE_Y), x: 0, z: 500 },
  { spec: scaled(desert, SCALE, SCALE_Y), x: -560, z: -330 },
  { spec: scaled(tundra, SCALE, SCALE_Y), x: 560, z: -330 },
];
export const TANK = { x: 0, z: 85, w: 2160, d: 1880, floor: -130, top: 270 };
export const WORLD = 2300;
export function island(x, z) {
  for (const I of ISLANDS) if (Math.hypot(x - I.x, z - I.z) < I.spec.radius * 1.15) return I;
  return null;
}
export function heightAt(x, z) {
  const I = island(x, z);
  return I ? I.spec.height(x - I.x, z - I.z) : SEA_FLOOR * SCALE_Y;
}
