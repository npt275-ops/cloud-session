// SamBox · src/world/sky.js · Bầu trời kiểu tranh vẽ (ảnh đích 8–11): trời chuyển màu, quầng mặt trời, mây bông, sao về đêm
//   buildSky(tier)   Group gồm vòm trời (shader chuyển màu đỉnh → chân trời, quầng và đĩa mặt trời), mây bông (ảnh vẽ bằng
//                    canvas: khối bông mặt trên sáng, đáy tối), sao (chỉ đêm)
//   sky.apply(preset, sunDir)  đổi màu theo buổi;  sky.update(giây) mây trôi chậm
import * as THREE from 'three';
import { rng } from '../core/noise.js';

function cloudTexture(seed) {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 128;
  const g = c.getContext('2d'),
    r = rng(seed);
  for (let i = 0; i < 14; i++) {
    const x = 40 + r() * 176,
      y = 52 + r() * 40 - Math.abs(x - 128) * 0.12,
      rad = 22 + r() * 30;
    const gr = g.createRadialGradient(x, y - rad * 0.3, rad * 0.1, x, y, rad);
    gr.addColorStop(0, 'rgba(255,255,255,1)');
    gr.addColorStop(0.65, 'rgba(236,236,246,0.95)');
    gr.addColorStop(1, 'rgba(210,210,230,0)');
    g.fillStyle = gr;
    g.beginPath();
    g.arc(x, y, rad, 0, Math.PI * 2);
    g.fill();
  }
  // đáy mây phẳng và tối hơn
  const shade = g.createLinearGradient(0, 40, 0, 128);
  shade.addColorStop(0, 'rgba(0,0,0,0)');
  shade.addColorStop(1, 'rgba(90,80,140,0.45)');
  g.globalCompositeOperation = 'source-atop';
  g.fillStyle = shade;
  g.fillRect(0, 0, 256, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
export function buildSky() {
  const group = new THREE.Group();
  const U = {
    uZenith: { value: new THREE.Color() },
    uHorizon: { value: new THREE.Color() },
    uGlow: { value: new THREE.Color() },
    uSunDir: { value: new THREE.Vector3() },
  };
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(4000, 32, 16),
    new THREE.ShaderMaterial({
      uniforms: U,
      side: THREE.BackSide,
      depthWrite: false,
      vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: `
        uniform vec3 uZenith, uHorizon, uGlow, uSunDir; varying vec3 vD;
        void main() {
          float y = vD.y;
          vec3 col = mix(uHorizon, uZenith, pow(clamp(y, 0.0, 1.0), 0.55));
          col = mix(col, uHorizon * 0.85, smoothstep(0.0, -0.25, y));
          float s = max(dot(normalize(vD), uSunDir), 0.0);
          col += uGlow * (pow(s, 6.0) * 0.4 + pow(s, 60.0) * 0.5);
          col += vec3(1.0, 0.96, 0.85) * smoothstep(0.9993, 0.9997, s) * 3.0; // đĩa mặt trời
          gl_FragColor = vec4(col, 1.0);
        }`,
    }),
  );
  dome.renderOrder = -10;
  dome.frustumCulled = false;
  group.add(dome);
  // mây bông: vòng quanh chân trời và trên đầu
  const r = rng(99),
    tex = [cloudTexture(1), cloudTexture(2), cloudTexture(3)],
    clouds = [];
  for (let i = 0; i < 46; i++) {
    const m = new THREE.SpriteMaterial({ map: tex[i % 3], transparent: true, depthWrite: false, fog: false });
    const s = new THREE.Sprite(m),
      a = r() * Math.PI * 2,
      d = 2700 + r() * 1000,
      w = 420 + r() * 620;
    s.position.set(Math.cos(a) * d, -250 + r() * 750, Math.sin(a) * d); // (vòm trời đi theo máy quay: mây quanh bể, cả dưới đáy bể)
    s.scale.set(w, w * 0.5, 1);
    s.userData = { a, d, speed: 0.004 + r() * 0.006 };
    clouds.push(s);
    group.add(s);
  }
  // sao
  const sp = [];
  for (let i = 0; i < 1600; i++) {
    const a = r() * Math.PI * 2,
      y = 0.08 + r() * 0.92,
      k = Math.sqrt(1 - y * y);
    sp.push(Math.cos(a) * k * 3800, y * 3800, Math.sin(a) * k * 3800);
  }
  const sg = new THREE.BufferGeometry();
  sg.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
  const stars = new THREE.Points(sg, new THREE.PointsMaterial({ color: '#ffffff', size: 2.2, sizeAttenuation: false, fog: false, transparent: true }));
  group.add(stars);
  group.apply = (P, sunDir) => {
    U.uZenith.value.set(P.sky.zenith);
    U.uHorizon.value.set(P.sky.horizon);
    U.uGlow.value.set(P.sky.glow);
    U.uSunDir.value.copy(sunDir);
    for (const c of clouds) c.material.color.set(P.cloud);
    stars.visible = !!P.stars;
  };
  group.update = (sec) => {
    for (const c of clouds) {
      const a = c.userData.a + sec * c.userData.speed * 0.05;
      c.position.x = Math.cos(a) * c.userData.d;
      c.position.z = Math.sin(a) * c.userData.d;
    }
  };
  return group;
}
