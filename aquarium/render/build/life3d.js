/* Bể Kính · render/build/life3d.js
 * Khói bốc lên từ công trình (bếp lửa, ống khói, lò rèn, nhà máy). Công trình khai báo chỗ khói trong phần chuyển động mà
 * hàm dựng trả về: smoke: [[x, y, z, cỡ], ...] theo toạ độ của chính công trình. Mỗi đảo một khối vẽ chung (InstancedMesh)
 * cho mọi cụm khói: mỗi chỗ khói 5 cụm mây nhỏ bay lên, to dần rồi tan. Một lượt vẽ cho cả đảo.
 * Dùng: const smoke = BK.Life3D.create(THREE, parent[, { color, opacity }]); mỗi khung hình smoke.update(emitters, giây, gió). Cần: three.js. */
(function (root, factory) {
  const BK = root.BK || (root.BK = {});
  BK.Life3D = factory();
})(typeof self !== 'undefined' ? self : globalThis, function () {
  'use strict';
  const PUFFS = 5, MAX = 240, RISE = 3.2, LIFE = 4.2;
  // o (tuỳ chọn): { color, opacity } — khói đen của công trình đang cháy (render/build/ruins3d.js)
  function create(THREE, parent, o) {
    const geo = new THREE.IcosahedronGeometry(0.5, 0);
    const mat = new THREE.MeshStandardMaterial({ color: (o && o.color) || '#d8d4cc', roughness: 1, flatShading: true, transparent: true, opacity: (o && o.opacity) || 0.62, depthWrite: false });
    const mesh = new THREE.InstancedMesh(geo, mat, MAX); mesh.count = 0; mesh.frustumCulled = false; mesh.renderOrder = 3; parent.add(mesh);
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), sc = new THREE.Vector3(), p = new THREE.Vector3();
    // emitters: [{ x, y, z, s }] theo toạ độ của parent; t: giây
    function update(emitters, t, wind) {
      let n = 0; const wx = wind ? wind.x : 0.4, wz = wind ? wind.z : 0.2;
      for (let i = 0; i < emitters.length && n < MAX; i++) {
        const E = emitters[i];
        for (let k = 0; k < PUFFS && n < MAX; k++) {
          const u = ((t / LIFE + k / PUFFS + i * 0.137) % 1), s = E.s * (0.45 + u * 1.4) * (u > 0.8 ? (1 - u) / 0.2 : 1);
          p.set(E.x + wx * u * 2.2 + Math.sin(t * 1.3 + k + i) * 0.15, E.y + u * RISE * E.s, E.z + wz * u * 2.2);
          e.set(u * 2 + k, u * 3 + i, 0); q.setFromEuler(e); sc.setScalar(Math.max(0.01, s));
          m.compose(p, q, sc); mesh.setMatrixAt(n++, m);
        }
      }
      mesh.count = n; mesh.instanceMatrix.needsUpdate = true; mesh.visible = n > 0;
    }
    return { update, mesh };
  }
  return { create };
});
