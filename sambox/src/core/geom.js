// SamBox · src/core/geom.js · Tiện ích hình học nhỏ: gộp nhiều hình làm một, tô màu theo đỉnh
//   merge(list)          gộp [{ geo, m (Matrix4), color? }] thành một BufferGeometry (không chỉ mục) có position, normal, uv, color
//   colorize(geo, fn)    gán màu đỉnh: fn(x, y, z, nx, ny, nz) → [r, g, b] (sRGB 0..1, đổi sang tuyến tính)
import * as THREE from 'three';

export function merge(list) {
  const parts = list.map(({ geo, m, color }) => {
    const g = (geo.index ? geo.toNonIndexed() : geo.clone()).applyMatrix4(m || new THREE.Matrix4());
    if (!g.attributes.uv) g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
    if (!g.attributes.color) {
      const c = new THREE.Color(color || '#ffffff'),
        a = new Float32Array(g.attributes.position.count * 3);
      for (let i = 0; i < a.length; i += 3) a.set([c.r, c.g, c.b], i);
      g.setAttribute('color', new THREE.BufferAttribute(a, 3));
    }
    return g;
  });
  const out = new THREE.BufferGeometry();
  for (const name of ['position', 'normal', 'uv', 'color']) {
    const size = parts[0].attributes[name].itemSize,
      total = parts.reduce((s, g) => s + g.attributes[name].count, 0),
      arr = new Float32Array(total * size);
    let o = 0;
    for (const g of parts) {
      arr.set(g.attributes[name].array, o);
      o += g.attributes[name].array.length;
    }
    out.setAttribute(name, new THREE.BufferAttribute(arr, size));
  }
  return out;
}
export function colorize(geo, fn) {
  const p = geo.attributes.position,
    n = geo.attributes.normal,
    a = new Float32Array(p.count * 3),
    c = new THREE.Color();
  for (let i = 0; i < p.count; i++) {
    const [r, g, b] = fn(p.getX(i), p.getY(i), p.getZ(i), n.getX(i), n.getY(i), n.getZ(i));
    c.setRGB(r, g, b, THREE.SRGBColorSpace);
    a.set([c.r, c.g, c.b], i * 3);
  }
  geo.setAttribute('color', new THREE.BufferAttribute(a, 3));
  return geo;
}
