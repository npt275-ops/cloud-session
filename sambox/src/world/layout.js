// SamBox · src/world/layout.js · Ba đảo trong bể: vị trí, độ cao chung của cả thế giới (thuần JS)
//   ISLANDS      [{ spec, x, z }]: đảo Đồng Bằng phía trước, Sa Mạc bên trái, Tuyết bên phải (tam giác quanh tâm bể)
//   heightAt(x, z)  độ cao mặt đất ở toạ độ thế giới (đáy biển giữa các đảo)
//   island(x, z)    đảo chứa điểm này (hay null)
import plains from './islands/plains.js';
import desert from './islands/desert.js';
import tundra from './islands/tundra.js';
import { SEA_FLOOR } from './islands/shape.js';

export const ISLANDS = [
  { spec: plains, x: 0, z: 250 },
  { spec: desert, x: -300, z: -150 },
  { spec: tundra, x: 300, z: -150 },
];
export const WORLD = 1400; // (đơn vị) cạnh vuông bao cả ba đảo, tâm ở gốc toạ độ
export function island(x, z) {
  for (const I of ISLANDS) if (Math.hypot(x - I.x, z - I.z) < I.spec.radius * 1.15) return I;
  return null;
}
export function heightAt(x, z) {
  const I = island(x, z);
  return I ? I.spec.height(x - I.x, z - I.z) : SEA_FLOOR;
}
