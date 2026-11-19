// SamBox · src/main.js · Ảnh mô phỏng đích: ba đảo trống (Đồng Bằng, Sa Mạc, Tuyết) theo hướng đồ hoạ đã chốt (ảnh đích 5–15)
// Ghép: mức đồ hoạ (src/core/quality.js), trời (sky.js), biển (water.js), đất ba đảo (terrain.js + islands/*.js), cây cỏ
// (nature/*), nắng và đèn bán cầu, bóng đổ theo chỗ đang nhìn, hậu kỳ (fx/post.js), bốn buổi (daytime.js), bảng điều khiển.
// Máy quay: toàn cảnh, từng đảo nhìn từ tâm bể, hoặc tầm mắt (nút "Tầm mắt": đứng trên đảo nhìn xa); nút "Lưới xây" hiện ô xây được.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { detectTier, TIERS } from './core/quality.js';
import { ISLANDS, RING, toWorld } from './world/layout.js';
import { DAYTIME } from './world/daytime.js';
import { buildTerrain } from './world/terrain.js';
import { buildWater } from './world/water.js';
import { buildTank } from './world/tank.js';
import { buildSky } from './world/sky.js';
import { scatter } from './nature/placement.js';
import { buildTrees } from './nature/trees.js';
import { buildGrass, GRASS_TYPES } from './nature/grass.js';
import { buildFireflies } from './nature/fireflies.js';
import { WIND } from './nature/wind.js';
import { LIGHT } from './fx/stylize.js';
import { buildPost } from './fx/post.js';
import { buildHud } from './ui/hud.js';
import { buildGrid } from './build/grid.js';

const tier = detectTier();
const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: tier.antialias, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, tier.dpr));
renderer.setSize(innerWidth, innerHeight, false);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.fog = new THREE.Fog('#d6b8d8', 1400, 6400);
const camera = new THREE.PerspectiveCamera(42, innerWidth / innerHeight, 1, 12000);
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.maxPolarAngle = Math.PI * 0.47;
controls.minDistance = 25;
controls.maxDistance = 6000;

// nắng (hay trăng) và đèn bán cầu: bóng ngả tím theo màu đất của đèn bán cầu
const hemi = new THREE.HemisphereLight();
scene.add(hemi);
const sun = new THREE.DirectionalLight();
sun.castShadow = true;
sun.shadow.mapSize.set(tier.shadow, tier.shadow);
Object.assign(sun.shadow.camera, { left: -450, right: 450, top: 450, bottom: -450, near: 10, far: 2400 });
sun.shadow.bias = -0.0004;
sun.shadow.normalBias = 0.6;
scene.add(sun, sun.target);

const sky = buildSky();
scene.add(sky, sky.clouds);
const water = buildWater();
scene.add(water);
const tank = buildTank();
scene.add(tank);

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
  renderer.toneMappingExposure = P.exposure;
  LIGHT.uSunColor.value.set(P.sun.color);
  LIGHT.uRimK.value = P.rim;
  sky.apply(P, sunDir);
  tank.apply(P, sunDir);
  post.apply(P);
  fireflies.visible = !!P.fireflies;
}

/* ---------- máy quay: toàn cảnh, bay tới từng đảo ---------- */
const VIEWS = {
  all: { pos: new THREE.Vector3(), target: new THREE.Vector3(0, 300, 0) },
};
// màn dọc (điện thoại) lùi xa hơn để thấy trọn bể kính
const allPos = () => VIEWS.all.pos.set(0, ...(innerWidth < innerHeight ? [1850, 3800] : [1300, 3300]));
allPos();
for (const I of ISLANDS) {
  // đứng phía tâm bể nhìn ra mặt đảo (núi đảo làm nền), lệch sang bên một chút
  VIEWS[I.spec.key] = {
    pos: new THREE.Vector3(I.x * (1 - 620 / RING) + I.z * (90 / RING), 520, I.z * (1 - 620 / RING) - I.x * (90 / RING)),
    target: new THREE.Vector3(I.x, 40, I.z),
  };
  // tầm mắt: mắt cao hơn mặt đất 4 đơn vị tại chỗ đứng của đảo (spec.eye), nhìn về điểm đã chọn
  const at = ([lx, lz], up) => {
    const [x, z] = toWorld(I, lx, lz);
    return new THREE.Vector3(x, I.spec.height(x - I.x, z - I.z) + up, z);
  };
  VIEWS[I.spec.key + ':mat'] = { pos: at(I.spec.eye.from, 4), target: at(I.spec.eye.to, 2) };
}
const QS = new URLSearchParams(location.search);
let place = VIEWS[QS.get('dao')] ? QS.get('dao') : 'all',
  eye = QS.get('mat') === '1';
const view = (key) => VIEWS[eye && key !== 'all' ? key + ':mat' : key];
camera.position.copy(view(place).pos);
controls.target.copy(view(place).target);
let fly = null;
function flyTo(key) {
  place = key;
  const v = view(key);
  fly = { p0: camera.position.clone(), t0: controls.target.clone(), p1: v.pos, t1: v.target, u: 0 };
}
// lưới ô xây: dựng lần đầu khi bật (mỗi đảo vài trăm mili giây)
const grids = [];
function showGrid(on) {
  if (on && !grids.length) for (const I of ISLANDS) scene.add(grids[grids.push(buildGrid(I)) - 1]);
  for (const g of grids) g.visible = on;
}

const hud = buildHud({
  tier,
  tiers: TIERS,
  islands: [{ key: 'all', name: 'Toàn cảnh' }, ...ISLANDS.map((I) => ({ key: I.spec.key, name: I.spec.name }))],
  daytimes: Object.entries(DAYTIME).map(([key, P]) => ({ key, name: P.name })),
  toggles: [{ key: 'mat', name: 'Tầm mắt' }, { key: 'luoi', name: 'Lưới xây' }],
  onIsland: flyTo,
  onDaytime: applyDaytime,
  onToggle: (key, on) => {
    if (key === 'mat') {
      eye = on;
      flyTo(place);
    } else showGrid(on);
  },
});
applyDaytime(QS.get('buoi') || daytime);
if (QS.get('luoi') === '1') showGrid(true);

function resize() {
  renderer.setSize(innerWidth, innerHeight, false);
  camera.aspect = innerWidth / innerHeight;
  camera.fov = camera.aspect < 1 ? 60 : 42;
  allPos();
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
  // sương: đứng sát đất thì xa mờ dần (chiều sâu như ảnh đích), máy quay lùi xa thì sương lùi theo (toàn bể không bị mờ trắng)
  const P = DAYTIME[daytime],
    dist = camera.position.distanceTo(controls.target);
  scene.fog.near = P.fog.near + 0.75 * dist;
  scene.fog.far = P.fog.far + 2.2 * dist;
  // bóng đổ theo chỗ đang nhìn; hướng nắng trong không gian máy quay cho viền sáng
  sun.target.position.copy(controls.target);
  sun.position.copy(controls.target).addScaledVector(sunDir, 1000);
  LIGHT.uSunView.value.copy(tmp.copy(sunDir).transformDirection(camera.matrixWorldInverse));
  WIND.uTime.value = sec;
  water.update(sec, P, sunDir);
  sky.update(sec);
  tank.update(sec);
  sky.position.copy(camera.position);
  if (fireflies.visible) fireflies.update(sec);
  post.render();
  hud.tick(dt);
  requestAnimationFrame(frame);
}
frame();
// (cho công cụ chụp ảnh kiểm tra: đặt máy quay sát đất bằng tia dò)
window.__sambox = { scene, camera, controls, renderer, flyTo, applyDaytime, Raycaster: THREE.Raycaster, V3: THREE.Vector3 };
