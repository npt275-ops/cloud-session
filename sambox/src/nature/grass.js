// SamBox · src/nature/grass.js · Đồng cỏ, oải hương, lúa mì lượn sóng theo gió (ảnh đích 8–13), vẽ hàng loạt
// Mỗi ngọn là một lá thuôn cong ba đốt (gốc tối, ngọn sáng); oải hương thêm bông tím ở ngọn, lúa mì thêm bông vàng. Pháp tuyến
// chĩa lên trời để cả đồng sáng đều như mặt đất (mẹo thường dùng cho cỏ); nắng xuyên ngọn khi nhìn ngược nắng; gió làm cả cánh
// đồng lượn sóng theo vị trí (src/nature/wind.js).
//   TYPES                 grass, lavender, wheat, dryGrass (cỏ khô sa mạc), snowGrass (cỏ lạnh): màu gốc, ngọn, bông, cao
//   buildGrass(type, pts) một InstancedMesh
import * as THREE from 'three';
import { stylize } from '../fx/stylize.js';

const TYPES = {
  grass: { base: '#3f7a2c', tip: '#b4dc62', h: 1.3, w: 0.16 },
  lavender: { base: '#4f6a3a', tip: '#7f9a5a', head: '#8f6ae0', headTip: '#c4a8ff', h: 1.25, w: 0.1 },
  wheat: { base: '#9a7a30', tip: '#e8b850', head: '#f2c25a', headTip: '#ffe29a', h: 1.6, w: 0.1 },
  dryGrass: { base: '#9a7a4a', tip: '#ecc98a', h: 1.0, w: 0.14 },
  snowGrass: { base: '#7a8a6a', tip: '#e2ead8', h: 0.9, w: 0.14 },
};
const GEO = {};
function bladeGeo(type) {
  if (GEO[type]) return GEO[type];
  const T = TYPES[type],
    pos = [],
    col = [],
    cb = new THREE.Color(T.base),
    ct = new THREE.Color(T.tip);
  // lá: 4 tầng (0, 0.4, 0.75, 1), hẹp dần, cong ra trước
  const lv = [0, 0.4, 0.75, 1].map((t) => ({ y: t * T.h, w: T.w * (1 - t) * (t < 1 ? 1 : 0), z: t * t * 0.25 * T.h, c: cb.clone().lerp(ct, t) }));
  const quad = (a, b, ca, cbb) => {
    const P = [[-a.w, a.y, a.z, ca], [a.w, a.y, a.z, ca], [b.w, b.y, b.z, cbb], [-a.w, a.y, a.z, ca], [b.w, b.y, b.z, cbb], [-b.w, b.y, b.z, cbb]];
    for (const [x, y, z, c] of P) {
      pos.push(x, y, z);
      col.push(c.r, c.g, c.b);
    }
  };
  for (let i = 0; i < 3; i++) quad(lv[i], lv[i + 1], lv[i].c, lv[i + 1].c);
  if (T.head) {
    // bông ở ngọn: hai tấm chéo nhau hình thoi
    const h0 = new THREE.Color(T.head),
      h1 = new THREE.Color(T.headTip),
      y0 = T.h * 0.78,
      y1 = T.h * 1.15,
      z = 0.2 * T.h,
      r = type === 'wheat' ? 0.07 : 0.09;
    for (const [dx, dz] of [[r, 0], [0, r]]) {
      const P = [[-dx, y0, z - dz, h0], [dx, y0, z + dz, h0], [dx, y1, z + dz, h1], [-dx, y0, z - dz, h0], [dx, y1, z + dz, h1], [-dx, y1, z - dz, h1]];
      for (const [x, y, zz, c] of P) {
        pos.push(x, y, zz);
        col.push(c.r, c.g, c.b);
      }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(pos.map((_, i) => (i % 3 === 1 ? 1 : 0)), 3));
  return (GEO[type] = g);
}
const MAT = {};
function grassMat(type) {
  return (MAT[type] ||= stylize(new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide }), {
    rim: 0.3,
    trans: 1.1,
    wind: [type === 'wheat' ? 0.45 : 0.32, TYPES[type].h],
  }));
}
export function buildGrass(type, pts) {
  const m = new THREE.InstancedMesh(bladeGeo(type), grassMat(type), Math.max(1, pts.length)),
    o = new THREE.Object3D();
  pts.forEach((p, i) => {
    o.position.set(p.x, p.y - 0.05, p.z);
    o.rotation.set(0, p.rot, 0);
    o.scale.set(p.s, p.s * (0.8 + (i % 5) * 0.1), p.s);
    o.updateMatrix();
    m.setMatrixAt(i, o.matrix);
  });
  m.count = pts.length;
  m.receiveShadow = true;
  m.computeBoundingSphere();
  return m;
}
export const GRASS_TYPES = Object.keys(TYPES);
