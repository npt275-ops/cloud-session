// SamBox · src/nature/trees.js · Cây và đá kiểu tranh vẽ, vẽ hàng loạt (InstancedMesh: mỗi loại một lượt vẽ mỗi đảo)
//   fluffy   cây tán bông xù (ảnh đích 5–15): tán là ~80 tấm lá trong suốt dồn quanh 5 khối cầu, pháp tuyến bẻ theo mặt cầu nên
//            cả tán sáng tối mềm như một quả bông; thân cong có hai cành; lá rung theo gió, ánh nắng xuyên lá khi nhìn ngược nắng
//   pine     thông: bốn tầng nón răng cưa, mặt trên phủ tuyết (đảo Tuyết)
//   palm     dừa: thân cong nhiều đốt, chín tàu lá rủ, chùm quả (ốc đảo)
//   cactus   xương rồng hai tay;  rock: tảng đá góc cạnh mặt trên rêu hay cát
//   buildTrees(type, points, island)  Group các InstancedMesh của loại đó tại các điểm mọc (src/nature/placement.js)
import * as THREE from 'three';
import { rng } from '../core/noise.js';
import { merge, colorize } from '../core/geom.js';
import { stylize } from '../fx/stylize.js';

const R = rng(4242);
// '#rrggbb' → [r, g, b] sRGB 0..1 (colorize đổi sang tuyến tính)
const hex = (h) => {
  const n = parseInt(h.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};
/* ---------- ảnh lá: cụm lá nhỏ vẽ bằng canvas (trắng xám, màu thật lấy từ màu từng cây) ---------- */
let LEAF = null;
function leafTexture() {
  if (LEAF) return LEAF;
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d'),
    r = rng(77);
  for (let i = 0; i < 46; i++) {
    const a = r() * Math.PI * 2,
      d = Math.sqrt(r()) * 46,
      x = 64 + Math.cos(a) * d,
      y = 64 + Math.sin(a) * d,
      l = 150 + r() * 105;
    g.save();
    g.translate(x, y);
    g.rotate(r() * Math.PI * 2);
    g.fillStyle = `rgb(${l},${l},${l})`;
    g.beginPath();
    g.ellipse(0, 0, 13, 6, 0, 0, Math.PI * 2);
    g.fill();
    g.restore();
  }
  LEAF = new THREE.CanvasTexture(c);
  LEAF.colorSpace = THREE.SRGBColorSpace;
  return LEAF;
}
/* ---------- hình mẫu (dựng một lần) ---------- */
const GEO = {};
function canopyGeo() {
  if (GEO.canopy) return GEO.canopy;
  const C = [[0, 0, 0, 1.25], [0.85, 0.25, 0.3, 0.9], [-0.8, 0.15, -0.35, 0.95], [0.15, 0.85, -0.45, 0.85], [-0.25, -0.2, 0.8, 0.85]],
    pos = [],
    nor = [],
    uv = [],
    col = [];
  const v = new THREE.Vector3(),
    q = new THREE.Quaternion(),
    up = new THREE.Vector3(0, 0, 1);
  for (const [cx, cy, cz, cr] of C)
    for (let i = 0; i < 17; i++) {
      v.set(R() * 2 - 1, R() * 2 - 1, R() * 2 - 1).normalize();
      const px = cx + v.x * cr * 0.8,
        py = cy + v.y * cr * 0.8,
        pz = cz + v.z * cr * 0.8,
        s = cr * (1.1 + R() * 0.4);
      q.setFromUnitVectors(up, v);
      q.multiply(new THREE.Quaternion().setFromAxisAngle(up, R() * Math.PI * 2));
      const n = new THREE.Vector3(px, py * 0.8, pz).normalize(); // (pháp tuyến cầu của cả tán)
      const shade = 0.72 + 0.28 * Math.min(1, Math.hypot(px, py, pz) / 1.6); // trong lõi tối hơn
      const corners = [[-1, -1, 0, 0], [1, -1, 1, 0], [1, 1, 1, 1], [-1, -1, 0, 0], [1, 1, 1, 1], [-1, 1, 0, 1]];
      for (const [a, b, u, w] of corners) {
        const p = new THREE.Vector3(a * s * 0.5, b * s * 0.5, 0).applyQuaternion(q);
        pos.push(px + p.x, py + p.y, pz + p.z);
        nor.push(n.x, n.y, n.z);
        uv.push(u, w);
        col.push(shade, shade, shade);
      }
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.scale(1.6, 1.4, 1.6).translate(0, 4.6, 0);
  return (GEO.canopy = g);
}
// thân cong: ống thuôn uốn theo một đường cong, thêm hai cành
function trunkGeo(h, r0, r1, bend) {
  const g = new THREE.CylinderGeometry(r1, r0, h, 7, 6, false).translate(0, h / 2, 0),
    p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const t = p.getY(i) / h;
    p.setX(i, p.getX(i) + Math.sin(t * Math.PI * 0.8) * bend);
  }
  g.computeVertexNormals();
  return g;
}
function fluffyTrunk() {
  if (GEO.ftrunk) return GEO.ftrunk;
  const m = (x, y, z, rz, ry) => new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry, rz)), new THREE.Vector3(1, 1, 1));
  return (GEO.ftrunk = merge([
    { geo: trunkGeo(4.6, 0.38, 0.2, 0.35), color: '#6b4a34' },
    { geo: trunkGeo(1.6, 0.14, 0.06, 0.1), m: m(0.2, 2.8, 0, -0.9, 0.3), color: '#6b4a34' },
    { geo: trunkGeo(1.4, 0.12, 0.05, 0.1), m: m(0.1, 3.3, 0, 0.9, 1.9), color: '#6b4a34' },
  ]));
}
function pineGeo(snow) {
  const key = 'pine' + snow;
  if (GEO[key]) return GEO[key];
  const parts = [{ geo: trunkGeo(1.6, 0.25, 0.18, 0), color: '#5a3c2a' }];
  for (let i = 0; i < 4; i++) {
    const c = new THREE.ConeGeometry(2.4 - i * 0.5, 2.6 - i * 0.2, 10, 1).translate(0, 1.2 + i * 1.45 + (2.6 - i * 0.2) / 2, 0),
      p = c.attributes.position;
    for (let j = 0; j < p.count; j++) if (p.getY(j) < 1.25 + i * 1.45 + 0.05) p.setY(j, p.getY(j) - R() * 0.35); // mép răng cưa
    c.computeVertexNormals();
    parts.push({ geo: c, color: '#ffffff' });
  }
  const g = merge(parts);
  colorize(g, (x, y, z, nx, ny) => {
    if (y < 1.6) return hex('#5a3c2a');
    const green = [0.36, 0.64, 0.46],
      top = snow && (y > 6.6 || (ny > 0.8 && y > 4)) ? 1 : 0;
    const k = 0.7 + 0.3 * (y / 8);
    return top ? [0.93, 0.96, 1] : green.map((v) => v * k);
  });
  return (GEO[key] = g);
}
function palmGeo() {
  if (GEO.palm) return GEO.palm;
  const parts = [];
  let x = 0,
    y = 0;
  for (let i = 0; i < 7; i++) {
    const tilt = 0.06 * (i + 1);
    parts.push({ geo: new THREE.CylinderGeometry(0.2, 0.26, 1.1, 7).translate(0, 0.55, 0), m: new THREE.Matrix4().makeRotationZ(-tilt).setPosition(x, y, 0), color: i % 2 ? '#8a6a48' : '#7a5c3e' });
    x += Math.sin(tilt) * 1.05;
    y += Math.cos(tilt) * 1.05;
  }
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2,
      leaf = new THREE.PlaneGeometry(0.7, 3.4, 1, 6).translate(0, 1.7, 0),
      p = leaf.attributes.position;
    for (let j = 0; j < p.count; j++) {
      const t = p.getY(j) / 3.4;
      p.setX(j, p.getX(j) * (1 - t * 0.8));
      p.setZ(j, -t * t * 1.6); // rủ xuống
    }
    leaf.rotateX(-Math.PI / 2 + 0.35);
    leaf.computeVertexNormals();
    parts.push({ geo: leaf, m: new THREE.Matrix4().makeRotationY(a).setPosition(x, y, 0), color: i % 2 ? '#4f9a3a' : '#5fae44' });
  }
  for (let i = 0; i < 3; i++) parts.push({ geo: new THREE.SphereGeometry(0.2, 6, 5), m: new THREE.Matrix4().setPosition(x + Math.cos(i * 2) * 0.25, y - 0.25, Math.sin(i * 2) * 0.25), color: '#6a4a2a' });
  return (GEO.palm = merge(parts));
}
function cactusGeo() {
  if (GEO.cactus) return GEO.cactus;
  const cap = (r, h) => new THREE.CapsuleGeometry(r, h, 4, 10);
  return (GEO.cactus = merge([
    { geo: cap(0.38, 2.6), m: new THREE.Matrix4().setPosition(0, 1.6, 0), color: '#5c9a52' },
    { geo: cap(0.24, 0.9), m: new THREE.Matrix4().setPosition(0.6, 1.9, 0), color: '#5c9a52' },
    { geo: cap(0.22, 0.7), m: new THREE.Matrix4().setPosition(-0.55, 2.3, 0), color: '#5c9a52' },
    { geo: cap(0.2, 0.5), m: new THREE.Matrix4().makeRotationZ(Math.PI / 2).setPosition(0.4, 1.45, 0), color: '#5c9a52' },
    { geo: cap(0.19, 0.4), m: new THREE.Matrix4().makeRotationZ(Math.PI / 2).setPosition(-0.38, 1.85, 0), color: '#5c9a52' },
  ]));
}
function rockGeo(island) {
  const key = 'rock' + island;
  if (GEO[key]) return GEO[key];
  const g = new THREE.IcosahedronGeometry(1.6, 1),
    p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const k = 0.75 + R() * 0.5;
    p.setXYZ(i, p.getX(i) * k * 1.2, p.getY(i) * k * 0.7, p.getZ(i) * k);
  }
  g.computeVertexNormals();
  const base = { plains: '#a8957a', desert: '#c9805e', tundra: '#7a8592' }[island],
    top = { plains: '#7fa64a', desert: '#e8b496', tundra: '#f0f4f8' }[island];
  const nonIdx = g.toNonIndexed();
  nonIdx.computeVertexNormals();
  return (GEO[key] = colorize(nonIdx, (x, y, z, nx, ny) => hex(ny > 0.55 ? top : base)));
}
/* ---------- vật liệu ---------- */
const MAT = {};
const mat = (key, make) => MAT[key] || (MAT[key] = make());
const leafMat = () => mat('leaf', () => stylize(new THREE.MeshLambertMaterial({ map: leafTexture(), alphaTest: 0.45, side: THREE.DoubleSide, vertexColors: true }), { rim: 0.6, trans: 0.9, wind: [0.35, 7] }));
const solidMat = () => mat('solid', () => stylize(new THREE.MeshLambertMaterial({ vertexColors: true }), { rim: 0.35 }));
const swayMat = () => mat('sway', () => stylize(new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide }), { rim: 0.5, trans: 0.6, wind: [0.25, 8] }));
/* ---------- dựng hàng loạt ---------- */
const PALETTE = {
  plains: ['#7cc04a', '#6ab446', '#5ea83e', '#8fc850', '#a8cc4a', '#7cc04a', '#d8b84a', '#4f9a52'], // xanh là chính, điểm một cây vàng
  desert: ['#7caa4a'],
  tundra: ['#3f7a5a'],
};
function instanced(geo, material, pts, scale, color) {
  const m = new THREE.InstancedMesh(geo, material, pts.length),
    o = new THREE.Object3D(),
    c = new THREE.Color();
  pts.forEach((p, i) => {
    o.position.set(p.x, p.y - 0.15, p.z);
    o.rotation.set(0, p.rot, 0);
    o.scale.setScalar(p.s * scale);
    o.updateMatrix();
    m.setMatrixAt(i, o.matrix);
    if (color) m.setColorAt(i, c.set(color(i, p)));
  });
  m.castShadow = true;
  m.receiveShadow = true;
  m.computeBoundingSphere();
  return m;
}
export function buildTrees(type, pts, island) {
  const g = new THREE.Group();
  if (!pts.length) return g;
  const pal = PALETTE[island] || PALETTE.plains;
  if (type === 'fluffy') {
    g.add(instanced(fluffyTrunk(), solidMat(), pts, 1.5));
    g.add(instanced(canopyGeo(), leafMat(), pts, 1.5, (i) => pal[(i * 7 + (i >> 3)) % pal.length]));
  } else if (type === 'pine') g.add(instanced(pineGeo(true), solidMat(), pts, 1.25));
  else if (type === 'palm') g.add(instanced(palmGeo(), swayMat(), pts, 1.1));
  else if (type === 'cactus') g.add(instanced(cactusGeo(), solidMat(), pts, 1.0));
  else if (type === 'rock') g.add(instanced(rockGeo(island), solidMat(), pts, 1.3));
  return g;
}
