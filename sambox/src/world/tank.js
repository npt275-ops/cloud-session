// SamBox · src/world/tank.js · Bể kính chứa ba đảo (kiểu sa bàn trong hộp kính): thành kính trong, khung gỗ, khối nước nhìn
// thấy qua thành bể, lớp cát đáy, bệ gỗ. Cỡ bể ở src/world/layout.js (TANK); mặt nước ở water.js.
//   buildTank()                 Group của bể
//   tank.apply(preset)          màu khối nước theo buổi (src/world/daytime.js water)
import * as THREE from 'three';
import { TANK } from './layout.js';
import { stylize } from '../fx/stylize.js';

const GLASS = {
  transparent: true,
  depthWrite: false,
  side: THREE.DoubleSide,
  vertexShader: `varying vec3 vW; varying vec3 vN;
    void main() { vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vN = normalize(mat3(modelMatrix) * normal);
      gl_Position = projectionMatrix * viewMatrix * w; }`,
  fragmentShader: `varying vec3 vW; varying vec3 vN;
    void main() {
      vec3 V = normalize(cameraPosition - vW);
      float f = 1.0 - abs(dot(normalize(vN), V));
      float streak = smoothstep(0.93, 1.0, sin((vW.x + vW.z) * 0.0035 + vW.y * 0.012)) * 0.07; // vệt phản chiếu chéo
      float a = 0.05 + 0.42 * pow(f, 3.0) + streak;
      gl_FragColor = vec4(mix(vec3(0.86, 0.95, 1.0), vec3(1.0), streak * 4.0), a);
    }`,
};
// khối nước nhìn qua thành bể: nông ở trên, sâu ở dưới, một dải sáng sát mặt nước
function waterSideMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: { uShallow: { value: new THREE.Color() }, uDeep: { value: new THREE.Color() } },
    transparent: true,
    vertexShader: 'varying vec3 vW; void main() { vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: `uniform vec3 uShallow, uDeep; varying vec3 vW;
      void main() {
        float t = clamp(-vW.y / ${(-TANK.floor).toFixed(1)}, 0.0, 1.0);
        vec3 col = mix(uShallow, uDeep, pow(t, 0.6));
        col += vec3(0.9, 1.0, 1.0) * smoothstep(-3.0, 0.0, vW.y) * 0.35;
        col += vec3(0.25, 0.4, 0.45) * smoothstep(0.75, 1.0, sin(vW.x * 0.03 + sin(vW.z * 0.02) * 3.0 + vW.y * 0.2)) * (1.0 - t) * 0.25; // vân sáng
        gl_FragColor = vec4(col, 0.9);
      }`,
  });
}
const lambert = (hex) => stylize(new THREE.MeshLambertMaterial({ color: hex }), { rim: 0.25, key: 'tank' });
function box(w, h, d, x, y, z, mat) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  return m;
}
export function buildTank() {
  const g = new THREE.Group(),
    { x, z, w, d, floor, top } = TANK,
    H = top - floor,
    T = 10; // độ dày khung
  g.name = 'bể kính';
  // thành kính bốn mặt (không nắp)
  const glass = new THREE.ShaderMaterial(GLASS);
  for (const [px, pz, ry, len] of [[0, d / 2, 0, w], [0, -d / 2, 0, w], [w / 2, 0, Math.PI / 2, d], [-w / 2, 0, Math.PI / 2, d]]) {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(len, H), glass);
    p.position.set(x + px, floor + H / 2, z + pz);
    p.rotation.y = ry;
    p.renderOrder = 5;
    g.add(p);
  }
  // khối nước: bốn mặt bên, sát trong thành kính
  const ws = waterSideMaterial();
  for (const [px, pz, ry, len] of [[0, d / 2, 0, w], [0, -d / 2, Math.PI, w], [w / 2, 0, Math.PI / 2, d], [-w / 2, 0, -Math.PI / 2, d]]) {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(len - 2, -floor), ws); // mặt quay ra ngoài, chỉ thấy từ ngoài bể
    p.position.set(x + px * (1 - 1 / w), floor / 2, z + pz * (1 - 1 / d));
    p.rotation.y = ry;
    p.renderOrder = 2;
    g.add(p);
  }
  // cát đáy và bệ gỗ
  g.add(box(w, 16, d, x, floor - 8, z, lambert('#e8cfa4')));
  const wood = lambert('#7a5a46'),
    trim = lambert('#9c7656');
  g.add(box(w + 70, 44, d + 70, x, floor - 16 - 22, z, wood));
  g.add(box(w + 90, 10, d + 90, x, floor - 16 - 44 - 5, z, trim));
  g.add(box(w + 40, 8, d + 40, x, floor - 16 + 0.5, z, trim));
  // khung: bốn cột góc, viền trên
  for (const sx of [-1, 1])
    for (const sz of [-1, 1]) {
      const c = box(T, H, T, x + (sx * w) / 2, floor + H / 2, z + (sz * d) / 2, wood);
      c.castShadow = true;
      g.add(c);
    }
  g.add(box(w + T, T, T, x, top, z + d / 2, wood), box(w + T, T, T, x, top, z - d / 2, wood));
  g.add(box(T, T, d + T, x + w / 2, top, z, wood), box(T, T, d + T, x - w / 2, top, z, wood));
  g.apply = (P) => {
    ws.uniforms.uShallow.value.set(P.water.shallow);
    ws.uniforms.uDeep.value.set(P.water.deep);
  };
  return g;
}
