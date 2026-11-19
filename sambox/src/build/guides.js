// SamBox · src/build/guides.js · Đường căn chỉnh (bật bằng nút "Căn chỉnh"): tam giác nối tâm ba nhà chính; trên mỗi đảo: hai đường
// chính (trắng), lối mòn (cam), hẻm suối (xanh), đèo sau núi (tím); số đo để thấy ba đảo cân nhau (src/world/layout.js, lanes.js)
//   buildGuides()   Group; .info: { sides: cạnh tam giác, roads: lối lính đầu cầu → nhà chính mỗi đảo, bridges: chiều dài ba cầu }
import * as THREE from 'three';
import { ISLANDS, BRIDGES, hallAt, road, pathLength, toWorld } from '../world/layout.js';
import { LANES, TRAILS, GORGE, BACKPASS } from '../world/islands/lanes.js';

const line = (pts, color, dashed) => {
  const g = new THREE.BufferGeometry().setFromPoints(pts.map(([x, y, z]) => new THREE.Vector3(x, y, z)));
  const m = new THREE.Line(
    g,
    dashed
      ? new THREE.LineDashedMaterial({ color, dashSize: 8, gapSize: 6, depthTest: false, transparent: true })
      : new THREE.LineBasicMaterial({ color, depthTest: false, transparent: true }),
  );
  if (dashed) m.computeLineDistances();
  m.renderOrder = 9;
  return m;
};
export function buildGuides() {
  const g = new THREE.Group(),
    halls = ISLANDS.map(hallAt),
    up = (p, dy) => [p[0], p[1] + dy, p[2]];
  // tam giác nối tâm ba nhà chính (vẽ cao trên mái): ống mảnh để nhìn từ xa vẫn rõ
  const gold = new THREE.MeshBasicMaterial({ color: '#ffd166', depthTest: false, transparent: true });
  halls.forEach((p, i) => {
    const q = halls[(i + 1) % 3],
      edge = new THREE.Mesh(new THREE.TubeGeometry(new THREE.LineCurve3(new THREE.Vector3(...up(p, 60)), new THREE.Vector3(...up(q, 60))), 1, 3, 6), gold);
    edge.renderOrder = 9;
    g.add(edge);
  });
  for (const p of halls) {
    g.add(line([up(p, 0), up(p, 60)], '#ffd166', true)); // cột dóng từ tâm nền lên tam giác
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(16, 19, 48).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: '#ffd166', depthTest: false, transparent: true, opacity: 0.9 }),
    );
    ring.position.set(p[0], p[1] + 0.6, p[2]);
    ring.renderOrder = 9;
    g.add(ring);
  }
  // các lối trên mỗi đảo, phủ theo mặt đất
  const drape = (I, P) => {
    const out = [];
    for (let i = 0; i < P.length - 1; i++)
      for (let k = 0; k <= 16; k++) {
        const t = k / 16,
          [x, z] = toWorld(I, P[i][0] + (P[i + 1][0] - P[i][0]) * t, P[i][1] + (P[i + 1][1] - P[i][1]) * t);
        out.push([x, I.spec.height(x - I.x, z - I.z) + 1.5, z]);
      }
    return out;
  };
  const roads = {};
  for (const I of ISLANDS) {
    for (const L of LANES) g.add(line(drape(I, L), '#ffffff'));
    for (const T of TRAILS) g.add(line(drape(I, T), '#ffb347', true));
    g.add(line(drape(I, GORGE), '#6fe7ff', true));
    g.add(line(drape(I, BACKPASS), '#d59bff', true));
    roads[I.spec.key] = [0, 1].map((side) => pathLength(road(I, side)));
  }
  g.info = {
    sides: halls.map((p, i) => Math.hypot(p[0] - halls[(i + 1) % 3][0], p[2] - halls[(i + 1) % 3][2])),
    roads,
    bridges: BRIDGES.map((b) => Math.hypot(b.from[0] - b.to[0], b.from[1] - b.to[1])),
  };
  g.name = 'căn chỉnh';
  return g;
}
