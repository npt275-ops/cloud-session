// SamBox · src/build/hall.js · Nhà chính TẠM (khối mẫu để căn chỉnh vị trí, chưa phải thiết kế công trình): đặt ở tâm nền nhà chính
// (src/world/layout.js hallAt), quay mặt xuống hẻm (ra cửa hẻm, về phía tâm bể). Nền đá, toà chính mái dốc, hiên cột, tháp giữa có
// đá phép sáng trên đỉnh, hai cột cờ màu đảo (spec.flag). Chiếm chừng 6 × 6 ô.
//   buildHall(I)   Group
import * as THREE from 'three';
import { hallAt } from '../world/layout.js';
import { merge } from '../core/geom.js';
import { stylize } from '../fx/stylize.js';

const T = (x, y, z, ry = 0) => new THREE.Matrix4().makeRotationY(ry).setPosition(x, y, z);
const box = (w, h, d, x, y, z, color) => ({ geo: new THREE.BoxGeometry(w, h, d), m: T(x, y + h / 2, z), color });
function roof(w, h, d) {
  // mái hai dốc, nóc chạy theo trục x
  const A = [-w / 2, 0, -d / 2], B = [w / 2, 0, -d / 2], C = [w / 2, 0, d / 2], D = [-w / 2, 0, d / 2], E = [-w / 2, h, 0], F = [w / 2, h, 0];
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([D, C, F, D, F, E, B, A, E, B, E, F, A, D, E, C, B, F].flat(), 3));
  g.computeVertexNormals();
  return g;
}
const mat = stylize(new THREE.MeshLambertMaterial({ vertexColors: true }), { rim: 0.4, key: 'hall' });
const glow = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.8, 2.2, 2.8), toneMapped: false });

export function buildHall(I) {
  const [x, y, z] = hallAt(I),
    flag = I.spec.flag;
  const parts = [
    box(42, 3, 42, 0, -1, 0, '#cfc4b0'), // nền đá
    box(18, 1.6, 8, 0, -1, 23, '#c4b8a2'), // bậc thềm trước
    box(28, 14, 20, 0, 2, -2, '#efe3cc'), // toà chính
    { geo: roof(32, 9, 25), m: T(0, 16, -2), color: '#6a5a8a' },
    ...[-9, -3, 3, 9].map((cx) => ({ geo: new THREE.CylinderGeometry(0.9, 1.1, 11, 8), m: T(cx, 7.5, 10), color: '#e6dccb' })), // hiên cột
    box(30, 1.4, 6, 0, 13, 10, '#d8cdb8'),
    box(5, 7, 0.6, 0, 2, 8.4, '#6b4a34'), // cửa lớn
    box(10, 32, 10, 0, 2, -8, '#e6dccb'), // tháp giữa
    { geo: new THREE.ConeGeometry(8.5, 11, 4), m: new THREE.Matrix4().makeRotationY(Math.PI / 4).setPosition(0, 39.5, -8), color: '#6a5a8a' },
    ...[-1, 1].flatMap((s) => [
      { geo: new THREE.CylinderGeometry(0.35, 0.35, 24, 6), m: T(s * 17, 13, 17), color: '#7a5a42' }, // cột cờ
      box(0.3, 6, 9, s * 17, 18, 21.6, flag), // lá cờ màu đảo
    ]),
  ];
  const g = new THREE.Group(),
    body = new THREE.Mesh(merge(parts), mat);
  body.castShadow = body.receiveShadow = true;
  const gem = new THREE.Mesh(new THREE.OctahedronGeometry(2.4), glow);
  gem.position.set(0, 49, -8);
  gem.scale.y = 1.6;
  g.add(body, gem);
  g.position.set(x, y, z);
  g.rotation.y = -I.turn; // mặt nhà (phía +z) quay xuống hẻm
  g.name = 'nhà chính tạm ' + I.spec.name;
  return g;
}
