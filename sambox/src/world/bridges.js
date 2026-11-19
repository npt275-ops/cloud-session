// SamBox · src/world/bridges.js · Ba cây cầu nối mặt các đảo (mỗi cầu là một làn đánh, src/world/layout.js BRIDGES): mặt cầu đá rộng
// 4 ô vồng nhẹ ở giữa, gờ hai bên, lan can gỗ, trụ đá cắm xuống đáy biển. Gộp làm một khối (một lệnh vẽ).
//   buildBridges()   Mesh ba cây cầu
import * as THREE from 'three';
import { BRIDGES, SCALE_Y } from './layout.js';
import { RIM } from './islands/shape.js';
import { merge } from '../core/geom.js';
import { stylize } from '../fx/stylize.js';

const W = 24, // bề rộng mặt cầu (4 ô)
  ARCH = 9, // độ vồng ở giữa cầu
  FLOOR = -46; // đáy biển (chân trụ)
const Y0 = RIM.level * SCALE_Y + 0.8; // mặt cầu ở hai đầu: nhỉnh hơn đai ven biển

function bridgeParts({ from, to }) {
  const [ax, az] = from,
    [bx, bz] = to,
    len = Math.hypot(bx - ax, bz - az),
    heading = Math.atan2(bx - ax, bz - az), // quay trục +z theo hướng cầu
    y = (t) => Y0 + ARCH * Math.sin(Math.PI * t),
    at = (t) => [ax + (bx - ax) * t, az + (bz - az) * t],
    parts = [],
    N = Math.ceil(len / 12);
  const piece = (geo, t0, t1, dx, dy, color) => {
    const [x0, z0] = at(t0),
      [x1, z1] = at(t1),
      y0 = y(t0),
      y1 = y(t1),
      m = new THREE.Matrix4()
        .makeRotationY(heading)
        .multiply(new THREE.Matrix4().makeRotationX(-Math.atan2(y1 - y0, (len * (t1 - t0)))))
        .setPosition((x0 + x1) / 2 + Math.cos(heading) * dx, (y0 + y1) / 2 + dy, (z0 + z1) / 2 - Math.sin(heading) * dx);
    parts.push({ geo, m, color });
  };
  for (let i = 0; i < N; i++) {
    const t0 = i / N,
      t1 = (i + 1) / N,
      seg = (len / N) * 1.02;
    piece(new THREE.BoxGeometry(W, 2.2, seg), t0, t1, 0, -1.1, i % 2 ? '#d8c3a0' : '#d2bd99'); // mặt cầu đá
    for (const s of [-1, 1]) {
      piece(new THREE.BoxGeometry(1.6, 1.4, seg), t0, t1, s * (W / 2 - 0.8), 0.7, '#b8a283'); // gờ đá
      piece(new THREE.BoxGeometry(0.5, 0.5, seg), t0, t1, s * (W / 2 - 0.8), 3.2, '#8a6a50'); // tay vịn gỗ
      piece(new THREE.BoxGeometry(0.6, 2.6, 0.6), t0, t0, s * (W / 2 - 0.8), 1.8, '#7a5a42'); // cột lan can
    }
  }
  // trụ đá: cách đều dọc cầu, chừa hai đầu (đầu cầu nằm trên đai ven biển)
  for (const t of [0.17, 0.34, 0.5, 0.66, 0.83]) {
    const [x, z] = at(t),
      top = y(t) - 2.2,
      h = top - FLOOR,
      m = new THREE.Matrix4().makeRotationY(heading).setPosition(x, FLOOR + h / 2, z);
    parts.push({ geo: new THREE.BoxGeometry(W + 4, h, 9), m, color: '#bfae94' });
  }
  return parts;
}
export function buildBridges() {
  const g = merge(BRIDGES.flatMap(bridgeParts));
  g.computeVertexNormals();
  const m = new THREE.Mesh(g, stylize(new THREE.MeshLambertMaterial({ vertexColors: true }), { rim: 0.35, key: 'bridge' }));
  m.castShadow = m.receiveShadow = true;
  m.name = 'cầu';
  return m;
}
