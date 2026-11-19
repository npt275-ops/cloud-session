// SamBox · src/world/water.js · Biển kiểu tranh vẽ (ảnh đích 5, 15): màu theo độ sâu, viền bọt sát bờ, gợn sóng, ánh nắng lấp lánh
// Độ sâu lấy từ bản đồ độ cao cả thế giới (src/world/layout.js) nướng vào một ảnh 768 × 768 lúc dựng. Nước nông trong suốt nhẹ
// (thấy cát dưới đáy), nước sâu đục; nhìn xiên thì phản màu chân trời.
//   buildWater(daytime)  Mesh mặt biển ở y = 0;  water.update(giây, preset, sunDir)
import * as THREE from 'three';
import { WORLD, heightAt } from './layout.js';

const N = 768,
  H0 = -40,
  H1 = 12; // (chỉ cần độ sâu: đất cao hơn 12 đều ghi 255)
function heightTexture() {
  const d = new Uint8Array(N * N);
  for (let j = 0; j < N; j++)
    for (let i = 0; i < N; i++) {
      const x = (i / (N - 1) - 0.5) * WORLD,
        z = (j / (N - 1) - 0.5) * WORLD;
      d[j * N + i] = Math.max(0, Math.min(255, Math.round(((heightAt(x, z) - H0) / (H1 - H0)) * 255)));
    }
  const t = new THREE.DataTexture(d, N, N, THREE.RedFormat, THREE.UnsignedByteType);
  t.magFilter = t.minFilter = THREE.LinearFilter;
  t.needsUpdate = true;
  return t;
}
export function buildWater() {
  const U = {
    uHeight: { value: heightTexture() },
    uTime: { value: 0 },
    uShallow: { value: new THREE.Color() },
    uDeep: { value: new THREE.Color() },
    uSky: { value: new THREE.Color() },
    uSunDir: { value: new THREE.Vector3(0, 1, 0) },
    uSunColor: { value: new THREE.Color() },
    uGlint: { value: 2.5 },
    ...THREE.UniformsLib.fog,
  };
  const mat = new THREE.ShaderMaterial({
    uniforms: U,
    transparent: true,
    fog: true,
    vertexShader: `
      varying vec3 vW;
      #include <fog_pars_vertex>
      void main() {
        vec4 w = modelMatrix * vec4(position, 1.0);
        vW = w.xyz;
        vec4 mvPosition = viewMatrix * w;
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: `
      uniform sampler2D uHeight; uniform float uTime;
      uniform vec3 uShallow, uDeep, uSky, uSunDir, uSunColor;
      uniform float uGlint;
      varying vec3 vW;
      #include <fog_pars_fragment>
      void main() {
        vec2 uv = vW.xz / ${WORLD.toFixed(1)} + 0.5;
        float h = mix(${H0.toFixed(1)}, ${H1.toFixed(1)}, texture2D(uHeight, uv).r);
        float depth = max(0.0, -h);
        // gợn sóng: pháp tuyến từ vài sóng sin chồng nhau
        float t = uTime;
        vec2 p = vW.xz;
        vec3 n = normalize(vec3(
          0.06 * cos(p.x * 0.11 + t * 1.3) + 0.04 * cos((p.x + p.y) * 0.23 - t * 1.7) + 0.02 * cos(p.y * 0.6 + t * 2.3),
          1.0,
          0.06 * cos(p.y * 0.13 - t * 1.1) + 0.04 * cos((p.x - p.y) * 0.21 + t * 1.5) + 0.02 * cos(p.x * 0.5 - t * 2.1)));
        vec3 V = normalize(cameraPosition - vW);
        vec3 col = mix(uShallow, uDeep, smoothstep(0.0, 26.0, depth));
        float fres = pow(1.0 - max(dot(n, V), 0.0), 4.0);
        col = mix(col, uSky, fres * 0.65);
        float spec = pow(max(dot(reflect(-uSunDir, n), V), 0.0), 180.0);
        col += uSunColor * spec * uGlint;
        // bọt sát bờ: dải trắng gợn theo nhịp sóng
        float sh = 1.0 - smoothstep(0.0, 2.2, depth);
        float wave = 0.5 + 0.5 * sin(depth * 4.0 - t * 1.8 + sin(p.x * 0.07) * 3.0);
        float foam = sh * smoothstep(0.35, 0.8, wave) + (1.0 - smoothstep(0.0, 0.5, depth)) * 0.8;
        col = mix(col, vec3(1.0), clamp(foam, 0.0, 1.0) * 0.85);
        float a = mix(0.45, 1.0, smoothstep(0.0, 7.0, depth)); // (nước sâu đục hẳn: không lộ mép tấm đất dưới đáy)
        gl_FragColor = vec4(col, max(a, foam * 0.9));
        #include <fog_fragment>
      }`,
  });
  const g = new THREE.PlaneGeometry(6000, 6000, 1, 1);
  g.rotateX(-Math.PI / 2);
  const m = new THREE.Mesh(g, mat);
  m.renderOrder = 1;
  m.name = 'biển';
  m.update = (sec, P, sunDir) => {
    U.uTime.value = sec;
    U.uShallow.value.set(P.water.shallow);
    U.uDeep.value.set(P.water.deep);
    U.uGlint.value = P.water.glint ?? 2.5; // trưa và đêm lấp lánh nhẹ hơn để không loá
    U.uSky.value.set(P.sky.horizon);
    U.uSunColor.value.set(P.sun.color);
    U.uSunDir.value.copy(sunDir);
  };
  return m;
}
