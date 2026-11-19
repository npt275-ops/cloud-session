// SamBox · src/world/rivers.js · Mặt nước suối trong hẻm của ba đảo (src/world/islands/lanes.js createPaths .stream): dải nước bám
// theo tim suối, cao đúng mặt nước từng đoạn (suối chảy dốc dần từ mạch nước ở cửa trước khu nhà chính ra biển), mép dải lấn dưới
// bờ nên bờ đất che mép nước. Nước chảy: gợn trôi theo dòng (nhanh hơn ở chỗ dốc), bọt dọc mép và ở ghềnh, loá nắng, phản màu trời;
// màu theo buổi (daytime water) pha màu riêng của đảo. Đảo Tuyết: suối đóng băng (mặt băng có vết nứt, không chảy).
//   buildRivers()   Group ba dải nước;  rivers.update(giây, preset, sunDir)
import * as THREE from 'three';
import { ISLANDS, SCALE, SCALE_Y, toWorld } from './layout.js';

const TINT = { plains: '#4fbfc4', desert: '#2fd3bd', tundra: '#9fc3da' };
const ICE = { tundra: true };

function ribbon(I) {
  const S = I.spec.paths.stream.filter((p) => p.y > 0.2), // (tới mép biển thì mặt biển lo phần còn lại)
    pos = [],
    uv = [],
    slope = [],
    idx = [];
  let v = 0;
  S.forEach((p, i) => {
    const a = S[Math.max(0, i - 1)],
      b = S[Math.min(S.length - 1, i + 1)],
      tx = b.x - a.x,
      tz = b.z - a.z,
      l = Math.hypot(tx, tz) || 1,
      nx = -tz / l,
      nz = tx / l;
    if (i) v += Math.hypot(p.x - S[i - 1].x, p.z - S[i - 1].z) * SCALE;
    const dy = Math.abs(b.y - a.y) / l; // (độ dốc mặt nước: ghềnh)
    for (const side of [-1, 1]) {
      const [x, z] = toWorld(I, p.x + nx * p.w * side, p.z + nz * p.w * side);
      pos.push(x, p.y * SCALE_Y, z);
      uv.push(side < 0 ? 0 : 1, v);
      slope.push(dy);
    }
    if (i) {
      const k = i * 2;
      idx.push(k - 2, k - 1, k, k - 1, k + 1, k);
    }
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute('aSlope', new THREE.Float32BufferAttribute(slope, 1));
  g.setIndex(idx);
  return g;
}
function material(key) {
  const U = {
    uTime: { value: 0 },
    uTint: { value: new THREE.Color(TINT[key]) },
    uShallow: { value: new THREE.Color() },
    uDeep: { value: new THREE.Color() },
    uSky: { value: new THREE.Color() },
    uSunDir: { value: new THREE.Vector3(0, 1, 0) },
    uSunColor: { value: new THREE.Color() },
    uGlint: { value: 2.5 },
    ...THREE.UniformsLib.fog,
  };
  const m = new THREE.ShaderMaterial({
    uniforms: U,
    transparent: true,
    depthWrite: false,
    fog: true,
    defines: ICE[key] ? { ICE: 1 } : {},
    vertexShader: `
      attribute float aSlope;
      varying vec3 vW; varying vec2 vUv; varying float vSlope;
      #include <fog_pars_vertex>
      void main() {
        vec4 w = modelMatrix * vec4(position, 1.0);
        vW = w.xyz; vUv = uv; vSlope = aSlope;
        vec4 mvPosition = viewMatrix * w;
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: `
      uniform float uTime, uGlint;
      uniform vec3 uTint, uShallow, uDeep, uSky, uSunDir, uSunColor;
      varying vec3 vW; varying vec2 vUv; varying float vSlope;
      #include <fog_pars_fragment>
      void main() {
        float mid = 1.0 - abs(vUv.x * 2.0 - 1.0); // 0 ở mép, 1 giữa dòng
        vec3 V = normalize(cameraPosition - vW);
      #ifdef ICE
        // mặt băng: trắng xanh, vết nứt mảnh, ánh bóng nhẹ
        vec2 q = vec2(vUv.x * 5.0, vUv.y * 0.18);
        float c1 = abs(sin(q.x * 2.3 + sin(q.y * 1.7) * 2.0) + sin(q.y * 2.9 + q.x * 0.7));
        float crack = 1.0 - smoothstep(0.0, 0.06, c1);
        float frost = 0.5 + 0.5 * sin(vUv.y * 0.9 + sin(vUv.x * 7.0) * 1.5) * sin(vUv.y * 0.37 - vUv.x * 3.0);
        vec3 col = mix(uTint, vec3(0.5, 0.68, 0.82), 0.4 * mid);
        col = mix(col, vec3(0.86, 0.92, 0.97), 0.25 * (1.0 - mid) + 0.12 * frost); // (mép băng đục trắng hơn)
        col = mix(col, vec3(0.36, 0.5, 0.64), crack * 0.55);
        float spec = pow(max(dot(reflect(-uSunDir, vec3(0.0, 1.0, 0.0)), V), 0.0), 40.0);
        col += uSunColor * spec * 0.15;
        gl_FragColor = vec4(col, 0.95);
      #else
        // nước chảy: gợn trôi theo dòng, chỗ dốc chảy nhanh và nổi bọt
        float speed = 5.0 + 60.0 * vSlope;
        float f = vUv.y - uTime * speed;
        vec3 n = normalize(vec3(
          0.10 * sin(f * 0.55 + vUv.x * 9.0) + 0.06 * sin(f * 1.3 - vUv.x * 14.0),
          1.0,
          0.10 * cos(f * 0.7 - vUv.x * 7.0) + 0.05 * cos(f * 1.9 + vUv.x * 11.0)));
        vec3 col = mix(mix(uShallow, uTint, 0.55), mix(uDeep, uTint, 0.35), 0.55 * mid);
        float fres = pow(1.0 - max(dot(n, V), 0.0), 4.0);
        col = mix(col, uSky, fres * 0.55);
        col += uSunColor * pow(max(dot(reflect(-uSunDir, n), V), 0.0), 140.0) * uGlint;
        float streak = 0.5 + 0.5 * sin(f * 0.9 + sin(vUv.x * 6.0 + f * 0.2) * 2.0);
        float foam = (1.0 - smoothstep(0.0, 0.22, mid)) * smoothstep(0.3, 0.9, streak) + smoothstep(0.03, 0.12, vSlope) * smoothstep(0.55, 0.95, streak);
        col = mix(col, vec3(1.0), clamp(foam, 0.0, 1.0) * 0.75);
        gl_FragColor = vec4(col, mix(0.72, 0.92, mid));
      #endif
        #include <fog_fragment>
      }`,
  });
  m.update = (sec, P, sunDir) => {
    U.uTime.value = sec;
    U.uShallow.value.set(P.water.shallow);
    U.uDeep.value.set(P.water.deep);
    U.uGlint.value = P.water.glint ?? 2.5;
    U.uSky.value.set(P.sky.horizon);
    U.uSunColor.value.set(P.sun.color);
    U.uSunDir.value.copy(sunDir);
  };
  return m;
}
export function buildRivers() {
  const g = new THREE.Group(),
    mats = [];
  for (const I of ISLANDS) {
    const m = new THREE.Mesh(ribbon(I), mats[mats.push(material(I.spec.key)) - 1]);
    m.renderOrder = 2;
    m.name = 'suối ' + I.spec.name;
    g.add(m);
  }
  g.name = 'suối';
  g.update = (sec, P, sunDir) => mats.forEach((m) => m.update(sec, P, sunDir));
  return g;
}
