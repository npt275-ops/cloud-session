// SamBox · src/nature/fireflies.js · Đom đóm đêm trên đồng cỏ đảo Đồng Bằng (ảnh đích 6): chấm sáng bay lượn, chớp tắt
//   buildFireflies(I, n)  Points; .update(giây). Chỉ hiện khi buổi có fireflies (src/world/daytime.js)
import * as THREE from 'three';
import { rng } from '../core/noise.js';

export function buildFireflies(I, n) {
  const r = rng(555),
    base = [],
    pos = new Float32Array(n * 3),
    ph = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    let x, z, y;
    do {
      x = (r() * 2 - 1) * I.spec.radius * 0.8;
      z = (r() * 2 - 1) * I.spec.radius * 0.8;
      y = I.spec.height(x, z);
    } while (y < 2);
    base.push([x + I.x, y + 1 + r() * 4, z + I.z]);
    ph[i] = r() * 100;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('aPh', new THREE.BufferAttribute(ph, 1));
  const U = { uTime: { value: 0 } };
  const m = new THREE.ShaderMaterial({
    uniforms: U,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: `attribute float aPh; uniform float uTime; varying float vA;
      void main(){ vA = 0.5 + 0.5 * sin(uTime * 2.3 + aPh); vec4 mv = modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = 260.0 / -mv.z; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `varying float vA; void main(){ float d = length(gl_PointCoord - 0.5);
      gl_FragColor = vec4(vec3(1.0, 0.92, 0.45) * 3.0, smoothstep(0.5, 0.0, d) * vA); }`,
  });
  const pts = new THREE.Points(g, m);
  pts.frustumCulled = false;
  pts.update = (sec) => {
    U.uTime.value = sec;
    for (let i = 0; i < n; i++) {
      const [x, y, z] = base[i],
        p = ph[i];
      pos.set([x + Math.sin(sec * 0.3 + p) * 3, y + Math.sin(sec * 0.7 + p * 2) * 1.2, z + Math.cos(sec * 0.25 + p) * 3], i * 3);
    }
    g.attributes.position.needsUpdate = true;
  };
  return pts;
}
