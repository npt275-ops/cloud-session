// SamBox · src/world/tank.js · Bể kính tròn chứa ba đảo (dáng bể của dự án cũ aquarium/, vẽ lại kiểu tranh): vòm kính bán cầu
// trong suốt phủ trên mặt nước, vòng đồng và núm đồng ở chân vòm; dưới mặt nước là chậu kính tròn (thành kính, đáy kính, vòng
// đồng ở chân) nhìn thấy khối nước và lớp cát đáy; đá bay có cỏ trên mặt lơ lửng quanh bể, nhấp nhô. Cỡ bể: src/world/layout.js
// (TANK); mặt nước: water.js.
//   buildTank()                  Group của bể
//   tank.apply(preset, sunDir)   màu khối nước, ánh nắng loé trên kính theo buổi (src/world/daytime.js)
//   tank.update(giây)            đá bay nhấp nhô
import * as THREE from 'three';
import { TANK } from './layout.js';
import { rng, simplex2 } from '../core/noise.js';
import { merge } from '../core/geom.js';
import { stylize } from '../fx/stylize.js';

const SAND = 26; // (đơn vị) lớp cát trên đáy kính
const SUN = { uSunDir: { value: new THREE.Vector3(0, 1, 0) }, uSunColor: { value: new THREE.Color() }, uTint: { value: new THREE.Color() }, uK: { value: 1 } };

// kính: rìa (nhìn xiên) đậm, giữa gần như trong suốt; nắng loé; vòm có hai vệt sáng phản chiếu phía trên trái (hl = 1);
// màu kính ngả theo chân trời (uTint), đêm mờ bớt (uK) để không trắng đục
function glassMat(hl) {
  return new THREE.ShaderMaterial({
    uniforms: SUN,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    vertexShader: `varying vec3 vW; varying vec3 vN; varying vec3 vNV;
      void main() { vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vN = normalize(mat3(modelMatrix) * normal);
        vNV = normalize(normalMatrix * normal); gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: `uniform vec3 uSunDir, uSunColor, uTint; uniform float uK; varying vec3 vW; varying vec3 vN; varying vec3 vNV;
      void main() {
        vec3 V = normalize(cameraPosition - vW), N = faceforward(normalize(vN), -V, normalize(vN)), nv = normalize(vNV);
        float f = 1.0 - abs(dot(N, V));
        float glint = pow(max(dot(reflect(-V, N), uSunDir), 0.0), 400.0);
        float hl = ${hl.toFixed(1)} * (smoothstep(0.88, 0.98, dot(nv, normalize(vec3(-0.55, 0.5, 0.67)))) * 0.2
          + smoothstep(0.985, 0.996, dot(nv, normalize(vec3(-0.25, 0.75, 0.6)))) * 0.22);
        float a = (0.035 + 0.4 * pow(f, 3.0) + hl) * uK + glint * 0.9;
        vec3 col = uTint + (vec3(1.0) - uTint) * clamp(hl * 4.0, 0.0, 1.0) + uSunColor * glint * 2.0;
        gl_FragColor = vec4(col, clamp(a, 0.0, 1.0));
      }`,
  });
}
// khối nước nhìn qua thành kính: nông ở trên, sâu ở dưới, dải sáng sát mặt nước, vân sáng lượn
function waterBodyMat(depth, R) {
  return new THREE.ShaderMaterial({
    uniforms: { uShallow: { value: new THREE.Color() }, uDeep: { value: new THREE.Color() } },
    transparent: true,
    vertexShader: 'varying vec3 vW; void main() { vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: `uniform vec3 uShallow, uDeep; varying vec3 vW;
      void main() {
        float t = clamp(-vW.y / ${depth.toFixed(1)}, 0.0, 1.0);
        vec3 col = mix(uShallow, uDeep, pow(t, 0.6));
        col += vec3(0.9, 1.0, 1.0) * smoothstep(-4.0, 0.0, vW.y) * 0.35;
        float s = atan(vW.z, vW.x) * ${R.toFixed(1)}; // (độ dài cung quanh thành bể)
        col += vec3(0.25, 0.4, 0.45) * smoothstep(0.75, 1.0, sin(s * 0.03 + sin(s * 0.004) * 3.0 + vW.y * 0.15)) * (1.0 - t) * 0.25;
        gl_FragColor = vec4(col, 0.9);
      }`,
  });
}
// đá bay: khối đá chúc mũi xuống, mặt trên phủ cỏ
function floaterGeo(s, seed) {
  const body = new THREE.ConeGeometry(s, s * 1.8, 9, 4),
    p = body.attributes.position;
  body.rotateX(Math.PI);
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i),
      y = p.getY(i),
      z = p.getZ(i),
      k = 0.78 + 0.22 * (simplex2(x * 0.08 + seed, z * 0.08 + y * 0.05) + 1); // (theo vị trí: đỉnh trùng ở đường nối không bị hở)
    p.setXYZ(i, x * k, y, z * k);
  }
  body.computeVertexNormals();
  body.translate(0, -s * 0.9, 0);
  const cap = new THREE.CylinderGeometry(s * 1.04, s * 0.94, s * 0.26, 11);
  cap.translate(0, s * 0.06, 0);
  return merge([{ geo: body, color: '#8d7b66' }, { geo: cap, color: '#86b85c' }]);
}
export function buildTank() {
  const g = new THREE.Group(),
    { r: R, floor } = TANK,
    deep = -(floor + SAND);
  g.name = 'bể kính';
  const add = (m, order = 0) => {
    m.renderOrder = order;
    m.raycast = () => {}; // (tia dò chọn đất xuyên qua kính)
    g.add(m);
    return m;
  };
  // vòm kính bán cầu trên mặt nước; chậu kính dưới mặt nước: thành và đáy
  add(new THREE.Mesh(new THREE.SphereGeometry(R, 96, 40, 0, Math.PI * 2, 0, Math.PI / 2), glassMat(1)), 5);
  const wall = add(new THREE.Mesh(new THREE.CylinderGeometry(R, R, -floor, 128, 1, true), glassMat(0)), 4);
  wall.position.y = floor / 2;
  const bottom = add(new THREE.Mesh(new THREE.CircleGeometry(R, 128), glassMat(0)), 4);
  bottom.rotation.x = Math.PI / 2;
  bottom.position.y = floor;
  // khối nước sát trong thành kính (mặt quay ra ngoài: chỉ thấy từ ngoài bể), lớp cát đáy
  const body = waterBodyMat(deep, R),
    water = add(new THREE.Mesh(new THREE.CylinderGeometry(R - 1.5, R - 1.5, deep, 128, 1, true), body), 2);
  water.position.y = -deep / 2;
  const sand = add(new THREE.Mesh(new THREE.CylinderGeometry(R - 2, R - 2, SAND, 128), stylize(new THREE.MeshLambertMaterial({ color: '#e6cfa6' }), { rim: 0.2, key: 'sand' })));
  sand.position.y = floor + SAND / 2;
  // đồng: vòng chân vòm (mặt nước) có 18 núm, vòng chân chậu
  const brass = stylize(new THREE.MeshPhongMaterial({ color: '#b8925a', specular: '#ffe2a8', shininess: 60 }), { rim: 0.8, key: 'brass' });
  for (const y of [0, floor]) {
    const ring = add(new THREE.Mesh(new THREE.TorusGeometry(R, 9, 10, 240), brass));
    ring.rotation.x = Math.PI / 2;
    ring.position.y = y;
  }
  const stud = new THREE.SphereGeometry(15, 14, 10);
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * Math.PI * 2;
    add(new THREE.Mesh(stud, brass)).position.set(Math.cos(a) * R, 0, Math.sin(a) * R);
  }
  // đá bay quanh bể
  const r = rng(515),
    rockMat = stylize(new THREE.MeshLambertMaterial({ vertexColors: true }), { rim: 0.45, key: 'floater' }),
    floaters = [];
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2 + r() * 0.3,
      d = R + 200 + r() * 520,
      s = 26 + r() * 50,
      m = add(new THREE.Mesh(floaterGeo(s, i * 7.3), rockMat));
    m.position.set(Math.cos(a) * d, -260 + r() * 420, Math.sin(a) * d);
    m.rotation.y = r() * Math.PI * 2;
    floaters.push({ m, y: m.position.y, ph: r() * 6.28 });
  }
  g.apply = (P, sunDir) => {
    body.uniforms.uShallow.value.set(P.water.shallow);
    body.uniforms.uDeep.value.set(P.water.deep);
    SUN.uSunDir.value.copy(sunDir);
    SUN.uSunColor.value.set(P.sun.color);
    SUN.uTint.value.set(P.sky.horizon).lerp(new THREE.Color('#eef8ff'), 0.6);
    SUN.uK.value = P.stars ? 0.55 : 1;
  };
  g.update = (sec) => {
    for (const f of floaters) f.m.position.y = f.y + Math.sin(sec * 0.45 + f.ph) * 7;
  };
  return g;
}
