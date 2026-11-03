/* Bể Kính · render/buildings3d.js
 * Đặt công trình lên đảo theo cấp văn minh. Kiểu nhà của từng đảo nằm ở render/build/<đảo>3d.js (LEVELS, BUILD);
 * tệp này chỉ đọc bố cục, dựng từng công trình bằng render/build/kit3d.js, xoay mặt trước về đúng hướng, dọn cây chỗ
 * đặt nhà, trải sân đất, và làm lửa bập bùng. Đảo nào chưa có kiểu nhà thì để trống (chỉ có thiên nhiên).
 * Cần: three.js, render/build/kit3d.js, các tệp render/build/<đảo>3d.js. */
(function (root, factory) {
  const BK = root.BK || (root.BK = {});
  BK.Buildings3D = factory(BK);
})(typeof self !== 'undefined' ? self : globalThis, function (BK) {
  'use strict';
  const STYLE_OF = { plains: () => BK.Plains3D }; // thêm đảo khác ở đây khi có tệp kiểu nhà

  function create(o) {
    const { THREE, lands3d } = o, K = BK.BuildKit;
    const shown = lands3d.lands.map(() => null); // mỗi đảo: { group, glows, level }
    function clear(L) { const s = shown[L.i]; if (!s) return; L.g.remove(s.group); K.dispose(s.group); shown[L.i] = null; }

    // dựng công trình của một đảo ở một cấp (1..12); cấp chưa có kiểu thì đảo để trống
    function show(i, level) {
      const L = lands3d.lands[i]; clear(L);
      const S = STYLE_OF[L.ter] && STYLE_OF[L.ter](), lay = S && S.LEVELS[level];
      if (!lay) return;
      const group = new THREE.Group(), glows = [];
      // trục của làng: phía trước là biển trong (hướng camera nhìn vào), bên phải vuông góc
      const f = new THREE.Vector2(L.inw.x, L.inw.z).normalize(), r = new THREE.Vector2(-f.y, f.x);
      const at = (x, z) => new THREE.Vector2(r.x * x + f.x * z, r.y * x + f.y * z);
      if (lay.yard) { const p = at(lay.yard.x, lay.yard.z); const yard = new THREE.Mesh(K.disc(lay.yard.r, 18), new THREE.MeshStandardMaterial({ color: S.yardColor, roughness: 1, flatShading: true })); yard.position.set(p.x, 0.04, p.y); yard.receiveShadow = true; group.add(yard); }
      let tris = 0;
      for (const P of lay.pieces) {
        const k = new K.Kit(); S.BUILD[P.kind](k, P);
        const g = k.bake(3), p = at(P.x, P.z);
        let dir = f; if (Array.isArray(P.face)) dir = at(P.face[0], P.face[1]).sub(p).normalize();
        g.position.set(p.x, 0, p.y); g.rotation.y = Math.atan2(dir.x, dir.y);
        g.userData.kind = P.kind; g.userData.name = S.NAME[P.kind];
        group.add(g); tris += g.userData.tris || 0;
        if (g.userData.glow) glows.push({ m: g.userData.glow, ph: Math.random() * 6 });
        if (P.clear) lands3d.clearTrees(L, p.x, p.y, P.clear);
      }
      L.g.add(group); shown[i] = { group, glows, level, tris: Math.round(tris), count: lay.pieces.length };
    }
    // lửa bập bùng, ban đêm sáng hơn
    function animate(dt, t, night) {
      for (const s of shown) if (s) for (const G of s.glows) { const fl = 0.82 + 0.18 * Math.sin(t * 0.017 + G.ph) * Math.sin(t * 0.011 + G.ph * 2); G.m.scale.set(1, fl, 1); G.m.material.opacity = 0.75 + 0.2 * (night || 0); }
    }
    const stats = (i) => shown[i] && { level: shown[i].level, tris: shown[i].tris, count: shown[i].count };
    return { show, animate, stats };
  }
  return { create };
});
