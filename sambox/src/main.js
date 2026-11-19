// SamBox · src/main.js · Ảnh mô phỏng đích: ba đảo trống (Đồng Bằng, Sa Mạc, Tuyết) theo hướng đồ hoạ đã chốt (ảnh đích 5–15)
// Ghép: mức đồ hoạ (src/core/quality.js), trời (sky.js), biển (water.js), đất ba đảo (terrain.js + islands/*.js), cây cỏ
// (nature/*), nắng và đèn bán cầu, bóng đổ theo chỗ đang nhìn, hậu kỳ (fx/post.js), bốn buổi (daytime.js), bảng điều khiển.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { detectTier, TIERS } from './core/quality.js';
import { ISLANDS } from './world/layout.js';
import { DAYTIME } from './world/daytime.js';
import { buildTerrain } from './world/terrain.js';
import { buildWater } from './world/water.js';
import { buildSky } from './world/sky.js';
import { scatter } from './nature/placement.js';
import { buildTrees } from './nature/trees.js';
import { buildGrass, GRASS_TYPES } from './nature/grass.js';
import { buildFireflies } from './nature/fireflies.js';
import { WIND } from './nature/wind.js';
import { LIGHT } from './fx/stylize.js';
import { buildPost } from './fx/post.js';
import { buildHud } from './ui/hud.js';

const tier = detectTier();
const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: tier.antialias, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, tier.dpr));
renderer.setSize(innerWidth, innerHeight, false);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.fog = new THREE.Fog('#d6b8d8', 450, 2100);
const camera = new THREE.PerspectiveCamera(42, innerWidth / innerHeight, 1, 9000);
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.maxPolarAngle = Math.PI * 0.47;
controls.minDistance = 25;
controls.maxDistance = 1700;

// nắng (hay trăng) và đèn bán cầu: bóng ngả tím theo màu đất của đèn bán cầu
const hemi = new THREE.HemisphereLight();
scene.add(hemi);
const sun = new THREE.DirectionalLight();
sun.castShadow = true;
sun.shadow.mapSize.set(tier.shadow, tier.shadow);
Object.assign(sun.shadow.camera, { left: -230, right: 230, top: 230, bottom: -230, near: 10, far: 1600 });
sun.shadow.bias = -0.0004;
sun.shadow.normalBias = 0.6;
scene.add(sun, sun.target);

const sky = buildSky();
scene.add(sky);
const water = buildWater();
scene.add(water);

// ba đảo: đất, cây, cỏ
const t0 = performance.now();
let plains = null;
for (const I of ISLANDS) {
  scene.add(buildTerrain(I, tier));
  for (const rule of I.spec.flora) {
    const pts = scatter(I, rule, tier.flora);
    scene.add(GRASS_TYPES.includes(rule.type) ? buildGrass(rule.type, pts) : buildTrees(rule.type, pts, I.spec.key));
  }
  if (I.spec.key === 'plains') plains = I;
}
const fireflies = buildFireflies(plains, tier.key === 'high' ? 260 : 90);
scene.add(fireflies);
console.log('dựng cảnh', Math.round(performance.now() - t0), 'ms');

const post = buildPost(renderer, scene, camera, tier);

/* ---------- buổi trong ngày ---------- */
const sunDir = new THREE.Vector3();
LIGHT.uSunView.value = new THREE.Vector3();
LIGHT.uSunColor.value = new THREE.Color();
let daytime = 'sunset';
function applyDaytime(key) {
  daytime = key;
  const P = DAYTIME[key],
    e = THREE.MathUtils.degToRad(P.sun.elev),
    a = THREE.MathUtils.degToRad(P.sun.azim);
  sunDir.set(Math.cos(e) * Math.sin(a), Math.sin(e), Math.cos(e) * Math.cos(a));
  sun.color.set(P.sun.color);
  sun.intensity = P.sun.intensity;
  hemi.color.set(P.hemi.sky);
  hemi.groundColor.set(P.hemi.ground);
  hemi.intensity = P.hemi.intensity;
  scene.fog.color.set(P.fog.color);
  scene.fog.near = P.fog.near;
  scene.fog.far = P.fog.far;
  renderer.toneMappingExposure = P.exposure;
  LIGHT.uSunColor.value.set(P.sun.color);
  LIGHT.uRimK.value = P.rim;
  sky.apply(P, sunDir);
  post.apply(P);
  fireflies.visible = !!P.fireflies;
}

/* ---------- máy quay: toàn cảnh, bay tới từng đảo ---------- */
const VIEWS = {
  all: { pos: new THREE.Vector3(0, 430, 860), target: new THREE.Vector3(0, 0, 40) },
};
for (const I of ISLANDS)
  VIEWS[I.spec.key] = { pos: new THREE.Vector3(I.x + 40, 120, I.z + 270), target: new THREE.Vector3(I.x, 25, I.z) };
camera.position.copy(VIEWS.all.pos);
controls.target.copy(VIEWS.all.target);
let fly = null;
function flyTo(key) {
  const v = VIEWS[key];
  fly = { p0: camera.position.clone(), t0: controls.target.clone(), p1: v.pos, t1: v.target, u: 0 };
}

const hud = buildHud({
  tier,
  tiers: TIERS,
  islands: [{ key: 'all', name: 'Toàn cảnh' }, ...ISLANDS.map((I) => ({ key: I.spec.key, name: I.spec.name }))],
  daytimes: Object.entries(DAYTIME).map(([key, P]) => ({ key, name: P.name })),
  onIsland: flyTo,
  onDaytime: applyDaytime,
});
applyDaytime(new URLSearchParams(location.search).get('buoi') || daytime);
const startView = new URLSearchParams(location.search).get('dao');
if (VIEWS[startView]) {
  camera.position.copy(VIEWS[startView].pos);
  controls.target.copy(VIEWS[startView].target);
}

function resize() {
  renderer.setSize(innerWidth, innerHeight, false);
  camera.aspect = innerWidth / innerHeight;
  camera.fov = camera.aspect < 1 ? 60 : 42;
  camera.updateProjectionMatrix();
  post.resize(innerWidth, innerHeight);
}
addEventListener('resize', resize);
resize();

const clock = new THREE.Clock();
const tmp = new THREE.Vector3();
function frame() {
  const dt = Math.min(0.05, clock.getDelta()),
    sec = clock.elapsedTime;
  if (fly) {
    fly.u = Math.min(1, fly.u + dt / 1.6);
    const k = fly.u * fly.u * (3 - 2 * fly.u);
    camera.position.lerpVectors(fly.p0, fly.p1, k);
    controls.target.lerpVectors(fly.t0, fly.t1, k);
    if (fly.u >= 1) fly = null;
  }
  controls.update();
  // bóng đổ theo chỗ đang nhìn; hướng nắng trong không gian máy quay cho viền sáng
  sun.target.position.copy(controls.target);
  sun.position.copy(controls.target).addScaledVector(sunDir, 700);
  LIGHT.uSunView.value.copy(tmp.copy(sunDir).transformDirection(camera.matrixWorldInverse));
  WIND.uTime.value = sec;
  water.update(sec, DAYTIME[daytime], sunDir);
  sky.update(sec);
  sky.position.copy(camera.position);
  if (fireflies.visible) fireflies.update(sec);
  post.render();
  hud.tick(dt);
  requestAnimationFrame(frame);
}
frame();
// (cho công cụ chụp ảnh kiểm tra: đặt máy quay sát đất bằng tia dò)
window.__sambox = { scene, camera, controls, flyTo, applyDaytime, Raycaster: THREE.Raycaster, V3: THREE.Vector3 };
