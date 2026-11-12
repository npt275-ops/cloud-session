(function (root) {
  'use strict';
  const BK = root.BK || (root.BK = {});
  /* Bể Kính · render/map/water3d.js
   * Gộp mặt nước và bờ của một đảo: mỗi loại một khối, một lượt vẽ (màu theo đỉnh, giữ nguyên chỗ và dáng). Những khối nào
   * được đánh dấu userData.flatPart = 'water' hay 'shore' (ở terrain3d.js, relief3d.js) thì được gộp. Cần: shared3d.js. */
  function create(X) {
    const { THREE } = X;
    /* =============== Gộp mặt nước và bờ của một đảo: mỗi loại một khối, một lượt vẽ =============== */
    // Sông, hồ, ao vẽ riêng từng khối thì tốn lượt vẽ; gộp lại theo màu từng khối (màu theo đỉnh), giữ nguyên chỗ và dáng.
    // Mặt nước trong suốt (đầm phá) để riêng vì cần vẽ sau cùng.
    function mergeFlat(L) {
      for (const kind of ['water', 'shore']) {
        const items = L.g.children.filter((m) => m.isMesh && !m.isInstancedMesh && m.userData.flatPart === kind);
        if (items.length < 2) continue;
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
          const wi = L.waterMats.indexOf(m.material);
          if (wi >= 0) L.waterMats.splice(wi, 1);
          m.material.dispose();
        }
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
        g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
        g.computeVertexNormals();
        const mat =
          kind === 'water'
            ? new THREE.MeshStandardMaterial({
                vertexColors: true,
                roughness: 0.15,
                metalness: 0.2,
                emissive: '#0c3b52',
                emissiveIntensity: 0.3,
                side: THREE.DoubleSide,
              })
            : new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, flatShading: true, side: THREE.DoubleSide });
        if (kind === 'water') L.waterMats.push(mat);
        const me = new THREE.Mesh(g, mat);
        me.receiveShadow = true;
        me.userData.noDrape = true;
        me.userData.flatLift = true;
        L.g.add(me);
      }
    }
    return { mergeFlat };
  }
  BK.MapWater = { create };
})(typeof self !== 'undefined' ? self : globalThis);
