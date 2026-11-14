(function (root) {
  'use strict';
  const BK = root.BK || (root.BK = {});
  /* Bể Kính · render/map/water3d.js
   * Gộp các dải phẳng (bãi cát, hẻm núi) của một đảo thành một khối, một lượt vẽ (màu theo đỉnh, giữ nguyên chỗ và dáng).
   * Khối nào được đánh dấu userData.flatPart = 'shore' (render/map/terrain3d.js ribbon) thì được gộp. Mặt nước hồ ở
   * render/map/height3d.js holes. Cần: shared3d.js. */
  function create(X) {
    const { THREE } = X;
    function mergeFlat(L) {
      const items = L.g.children.filter((m) => m.isMesh && !m.isInstancedMesh && m.userData.flatPart === 'shore');
      if (items.length < 2) return;
      const pos = [],
        col = [];
      for (const m of items) {
        m.updateMatrix();
        const g = (m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone()).applyMatrix4(m.matrix),
          p = g.attributes.position,
          c = m.material.color;
        for (let i = 0; i < p.count; i++) {
          pos.push(p.getX(i), p.getY(i), p.getZ(i));
          col.push(c.r, c.g, c.b);
        }
        g.dispose();
        m.geometry.dispose();
        L.g.remove(m);
        m.material.dispose();
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
      g.computeVertexNormals();
      const me = new THREE.Mesh(
        g,
        new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, flatShading: true, side: THREE.DoubleSide }),
      );
      me.receiveShadow = true;
      me.userData.noDrape = true;
      me.userData.flatPart = 'shore'; // (render/map/height3d.js finish nâng theo độ nâng của đất từng đỉnh)
      L.g.add(me);
    }
    return { mergeFlat };
  }
  BK.MapWater = { create };
})(typeof self !== 'undefined' ? self : globalThis);
