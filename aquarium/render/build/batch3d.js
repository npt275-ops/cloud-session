/* Bể Kính · render/build/batch3d.js
 * Gộp công trình của một đảo thành ít khối để máy nhẹ khi nhìn từ xa: mọi phần đứng yên của các công trình đang hiện gộp
 * thành ba khối (khối chính đổ bóng, khối sáng, khối cửa sổ sáng về đêm) và các đường viền neon (thời 10 trở đi). Phần chuyển động (cánh quạt, xe, thuyền...) vẫn
 * để riêng. render/buildings3d.js dùng khối gộp cho đảo ở xa máy quay, đảo ở gần thì vẽ từng công trình như thường.
 * Dùng: const b = BK.Batch3D.create(THREE, parent, mats); b.rebuild(pieces, shadow, kinds); b.show(true|false); b.dispose().
 * shadow = false: khối gộp không đổ bóng (đảo ở xa, bóng nhỏ không thấy rõ mà tốn gấp đôi công vẽ).
 * pieces: [{ g (nhóm công trình đã đặt chỗ), parts: { main, flat, glow, lit, neon } (các khối đứng yên của nó) }]. Cần: three.js. */
(function (root, factory) {
  const BK = root.BK || (root.BK = {});
  BK.Batch3D = factory();
})(typeof self !== 'undefined' ? self : globalThis, function () {
  'use strict';
  // phần đứng yên của công trình: khối chính (đổ bóng), mảnh dẹt sát đất (không đổ bóng), khối sáng, cửa sổ sáng đêm, viền neon
  const KINDS = ['main', 'flat', 'glow', 'lit', 'neon'];
  function create(THREE, parent, mats) {
    const meshes = {};
    const tmp = new THREE.Matrix4(), nm = new THREE.Matrix3(), v = new THREE.Vector3();
    function mergeOf(list) {
      let n = 0; for (const [geo] of list) n += geo.attributes.position.count;
      if (!n) return null;
      const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), col = new Float32Array(n * 3), lk = new Float32Array(n * 4), gy = new Float32Array(n); let o = 0;
      for (const [geo, M] of list) {
        const P = geo.attributes.position, N = geo.attributes.normal, Cc = geo.attributes.color; nm.getNormalMatrix(M);
        if (geo.attributes.aLk) lk.set(geo.attributes.aLk.array, o * 4); if (geo.attributes.aGy) gy.set(geo.attributes.aGy.array, o); // mảng tường lớn (render/build/kit3d.js wallMark)
        for (let i = 0; i < P.count; i++, o++) {
          v.fromBufferAttribute(P, i).applyMatrix4(M); pos[o * 3] = v.x; pos[o * 3 + 1] = v.y; pos[o * 3 + 2] = v.z;
          if (N) { v.fromBufferAttribute(N, i).applyMatrix3(nm).normalize(); nor[o * 3] = v.x; nor[o * 3 + 1] = v.y; nor[o * 3 + 2] = v.z; }
          if (Cc) { col[o * 3] = Cc.getX(i); col[o * 3 + 1] = Cc.getY(i); col[o * 3 + 2] = Cc.getZ(i); } else { col[o * 3] = col[o * 3 + 1] = col[o * 3 + 2] = 1; }
        }
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.setAttribute('aLk', new THREE.BufferAttribute(lk, 4)); g.setAttribute('aGy', new THREE.BufferAttribute(gy, 1));
      g.computeBoundingSphere(); return g;
    }
    // ma trận của một khối so với parent: đi ngược lên tới parent
    function rel(mesh) { tmp.identity(); let q = mesh; const chain = []; while (q && q !== parent) { q.updateMatrix(); chain.push(q.matrix); q = q.parent; } for (let i = chain.length - 1; i >= 0; i--) tmp.multiply(chain[i]); return tmp.clone(); }
    // kinds: những phần được gộp (mặc định cả năm); phần nào không gộp thì công trình tự vẽ (đảo gần: phần sáng nhấp nháy riêng)
    function rebuild(pieces, shadow, kinds) {
      kinds = kinds || KINDS;
      const lists = { main: [], flat: [], glow: [], lit: [], neon: [] };
      for (const P of pieces) for (const kind of kinds) { const m = P.parts[kind]; if (m) lists[kind].push([m.geometry, rel(m)]); }
      for (const kind of KINDS) {
        if (meshes[kind]) { parent.remove(meshes[kind]); meshes[kind].geometry.dispose(); meshes[kind] = null; }
        const geo = mergeOf(lists[kind]); if (!geo) continue;
        const M = mats[kind === 'flat' ? 'main' : kind]; if (!M) continue; const m = kind === 'neon' ? new THREE.LineSegments(geo, M) : new THREE.Mesh(geo, M);
            if (kind === 'main') { m.castShadow = shadow !== false; m.receiveShadow = true; } else if (kind === 'flat') m.receiveShadow = true;
            else m.renderOrder = 2;
        parent.add(m); meshes[kind] = m;
      }
    }
    function show(on) { for (const k in meshes) if (meshes[k]) meshes[k].visible = on; }
    function dispose() { for (const k in meshes) if (meshes[k]) { parent.remove(meshes[k]); meshes[k].geometry.dispose(); meshes[k] = null; } }
    return { rebuild, show, dispose, meshes };
  }
  return { create };
});
