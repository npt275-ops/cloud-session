/* Bể Kính · render/build/batch3d.js
 * Gộp công trình của một đảo thành ít khối để máy nhẹ khi nhìn từ xa: mọi phần đứng yên của các công trình đang hiện gộp
 * thành ba khối (khối chính đổ bóng, khối sáng, khối cửa sổ sáng về đêm). Phần chuyển động (cánh quạt, xe, thuyền...) vẫn
 * để riêng. render/buildings3d.js dùng khối gộp cho đảo ở xa máy quay, đảo ở gần thì vẽ từng công trình như thường.
 * Dùng: const b = BK.Batch3D.create(THREE, parent, mats); b.rebuild(pieces, shadow); b.show(true|false); b.dispose().
 * shadow = false: khối gộp không đổ bóng (đảo ở xa, bóng nhỏ không thấy rõ mà tốn gấp đôi công vẽ).
 * pieces: [{ g (nhóm công trình đã đặt chỗ), parts: { main, glow, lit } (các khối đứng yên của nó) }]. Cần: three.js. */
(function (root, factory) {
  const BK = root.BK || (root.BK = {});
  BK.Batch3D = factory();
})(typeof self !== 'undefined' ? self : globalThis, function () {
  'use strict';
  function create(THREE, parent, mats) {
    const meshes = {};
    const tmp = new THREE.Matrix4(), nm = new THREE.Matrix3(), v = new THREE.Vector3();
    function mergeOf(list) {
      let n = 0; for (const [geo] of list) n += geo.attributes.position.count;
      if (!n) return null;
      const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), col = new Float32Array(n * 3); let o = 0;
      for (const [geo, M] of list) {
        const P = geo.attributes.position, N = geo.attributes.normal, Cc = geo.attributes.color; nm.getNormalMatrix(M);
        for (let i = 0; i < P.count; i++, o++) {
          v.fromBufferAttribute(P, i).applyMatrix4(M); pos[o * 3] = v.x; pos[o * 3 + 1] = v.y; pos[o * 3 + 2] = v.z;
          if (N) { v.fromBufferAttribute(N, i).applyMatrix3(nm).normalize(); nor[o * 3] = v.x; nor[o * 3 + 1] = v.y; nor[o * 3 + 2] = v.z; }
          if (Cc) { col[o * 3] = Cc.getX(i); col[o * 3 + 1] = Cc.getY(i); col[o * 3 + 2] = Cc.getZ(i); } else { col[o * 3] = col[o * 3 + 1] = col[o * 3 + 2] = 1; }
        }
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
      g.computeBoundingSphere(); return g;
    }
    // ma trận của một khối so với parent: đi ngược lên tới parent
    function rel(mesh) { tmp.identity(); let q = mesh; const chain = []; while (q && q !== parent) { q.updateMatrix(); chain.push(q.matrix); q = q.parent; } for (let i = chain.length - 1; i >= 0; i--) tmp.multiply(chain[i]); return tmp.clone(); }
    function rebuild(pieces, shadow) {
      const lists = { main: [], glow: [], lit: [] };
      for (const P of pieces) for (const kind of ['main', 'glow', 'lit']) { const m = P.parts[kind]; if (m) lists[kind].push([m.geometry, rel(m)]); }
      for (const kind of ['main', 'glow', 'lit']) {
        if (meshes[kind]) { parent.remove(meshes[kind]); meshes[kind].geometry.dispose(); meshes[kind] = null; }
        const geo = mergeOf(lists[kind]); if (!geo) continue;
        const m = new THREE.Mesh(geo, mats[kind]); if (kind === 'main') { m.castShadow = shadow !== false; m.receiveShadow = true; } else m.renderOrder = 2;
        parent.add(m); meshes[kind] = m;
      }
    }
    function show(on) { for (const k in meshes) if (meshes[k]) meshes[k].visible = on; }
    function dispose() { for (const k in meshes) if (meshes[k]) { parent.remove(meshes[k]); meshes[k].geometry.dispose(); meshes[k] = null; } }
    return { rebuild, show, dispose, meshes };
  }
  return { create };
});
