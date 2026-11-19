// SamBox · src/build/grid.js · Lưới ô xây hiện trên mặt đất (bật bằng nút "Lưới xây"): mỗi ô xây được là một ô xanh lá viền xanh đậm
// (rõ cả trên cỏ, cát, tuyết) bám theo độ cao 4 góc (src/build/cells.js)
//   buildGrid(I)   Mesh lưới của đảo I;  .cells: số ô xây được
import * as THREE from 'three';
import { CELL, buildCells } from './cells.js';

const mat = new THREE.ShaderMaterial({
  transparent: true,
  depthWrite: false,
  polygonOffset: true,
  polygonOffsetFactor: -2,
  vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `varying vec2 vUv;
    void main() {
      float e = min(min(vUv.x, 1.0 - vUv.x), min(vUv.y, 1.0 - vUv.y)), line = 1.0 - smoothstep(0.035, 0.09, e);
      gl_FragColor = vec4(mix(vec3(0.3, 0.92, 0.36), vec3(0.06, 0.42, 0.14), line), 0.3 + 0.45 * line);
    }`,
});
export function buildGrid(I) {
  const cells = buildCells(I),
    pos = new Float32Array(cells.length * 18),
    uv = new Float32Array(cells.length * 12);
  cells.forEach(([x, z, h00, h10, h01, h11], n) => {
    const q = [[x, h00, z, 0, 0], [x + CELL, h10, z, 1, 0], [x, h01, z + CELL, 0, 1], [x + CELL, h11, z + CELL, 1, 1]];
    [0, 2, 1, 1, 2, 3].forEach((k, v) => {
      pos.set([q[k][0] + I.x, q[k][1] + 0.45, q[k][2] + I.z], (n * 6 + v) * 3);
      uv.set([q[k][3], q[k][4]], (n * 6 + v) * 2);
    });
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  const m = new THREE.Mesh(g, mat);
  m.renderOrder = 3;
  m.raycast = () => {};
  m.cells = cells.length;
  return m;
}
