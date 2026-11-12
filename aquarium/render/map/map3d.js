(function (root) {
  'use strict';
  const BK = root.BK || (root.BK = {});
  /* Bể Kính · render/map/map3d.js · bản đồ sáu đảo (chỉ thiên nhiên)
   * Ghép các phần của bản đồ cho từng đảo: dáng đất (terrain3d.js), địa hình thêm (relief3d.js: núi, sông, hồ, đá; gộp mặt
   * nước ở water3d.js), cây (trees3d.js). Không có công trình hay người ở đây: công trình ở render/buildings3d.js và
   * render/build/ (cả cầu: render/build/bridges3d.js), người ở render/ và logic/.
   * index.html gọi animate() mỗi khung hình và seasons() khi đổi mùa. Giữ tên Lands3D cho các tệp đang dùng.
   * Cần: three.js, render/map/shared3d.js, mountains3d.js, height3d.js, terrain3d.js, water3d.js, relief3d.js, trees3d.js. */
  const { LAND_R, RING, SC } = BK.MapShared;
  function create(K) {
    const { scene, Sim } = K,
      X = BK.MapShared.create(K),
      { THREE, C, TSTYLE } = X;
    const MT = BK.MapMountains.create(X),
      HT = BK.MapHeight.create(X),
      TE = BK.MapTerrain.create(X, MT),
      W2 = BK.MapWater.create(X),
      RE = BK.MapRelief.create(X, MT, W2),
      TR = BK.MapTrees.create(X);

    /* ---------- Một đảo ---------- */
    const lands = [];
    function makeLand(i) {
      const T = Sim.TERRAINS[i],
        ang = Math.PI / 2 + i * (Math.PI / 3);
      const out = new THREE.Vector3(Math.cos(ang), 0, Math.sin(ang)),
        inw = out.clone().negate();
      const center = out.clone().multiplyScalar(RING);
      const g = new THREE.Group();
      g.position.copy(center);
      scene.add(g);
      const L = { i, T, ter: T.key, ang, out, inw, center, g };
      // hai đầu bến phía hai đảo kề bên (chỗ đầu cầu khi có cầu; lính ra đây khi có chiến tranh)
      L.landing = [(i + 5) % 6, (i + 1) % 6].map((j) => {
        const a = Math.PI / 2 + j * (Math.PI / 3);
        return new THREE.Vector3(Math.cos(a) * RING - center.x, 0, Math.sin(a) * RING - center.z).normalize().multiplyScalar(LAND_R - 0.4);
      });
      L.neighbors = [(i + 5) % 6, (i + 1) % 6];
      L.world = (p) => p.clone().add(center);
      TE.terrain(L, HT);
      RE.relief(L);
      HT.finish(L, TSTYLE[L.ter]); // khoét nước, dựng mặt đảo nhấp nhô, phủ đá núi theo đất
      // chỗ cây không mọc: giữa đảo (nhà chính) và những khối lớn đã ghi trong L.props
      L.blocked = (x, z, r) => Math.hypot(x, z) < 6.6 + r;
      TR.plantTrees(L);
      L.replant = () => {
        for (let n = 0; n < L.trees.list.length; n++) TR.placeTree(L, n);
        for (const m of L.trees.all) m.instanceMatrix.needsUpdate = true;
        TR.replantGrass(L);
      };
      lands.push(L);
      return L;
    }
    for (let i = 0; i < 6; i++) makeLand(i);

    /* ---------- Mỗi khung hình ---------- */
    // mặt nước lấp lánh; cam: vị trí camera, ở xa một đảo (quá 120) thì ẩn bụi cây, vệt bóng cây và chi tiết nhỏ của đảo đó
    function animate(dt, t, night, cam) {
      for (const L of lands) {
        for (const m of L.waterMats) m.emissiveIntensity = 0.25 + Math.sin(t * 0.002 + L.i) * 0.05 + night * 0.15;
        if (cam) {
          const near = cam.distanceToSquared(L.center) < 120 * 120;
          if (L.detail) L.detail.visible = near;
          L.trees.bushes.visible = near;
          L.trees.shadow.visible = near;
        }
      }
    }
    // màu theo mùa cho mặt đất và cây
    function seasons(sw, drought) {
      const tmp = new THREE.Color();
      for (const L of lands) {
        const st = TSTYLE[L.ter];
        if (st.season) {
          // (mùa đông: tuyết ngả lam nhạt, không trắng tinh; render/look3d.js đọc L.snow vẽ gò tuyết, mờ mạch lát)
          const g0 = L.groundBase,
            cs = [
              g0.clone().lerp(C('#a2d873'), 0.3),
              g0.clone(),
              g0.clone().lerp(C('#c2ad58'), 0.5),
              g0.clone().lerp(C('#dfe7ef'), L.ter === 'coast' ? 0.4 : 0.72),
            ];
          tmp.setRGB(0, 0, 0);
          for (let s = 0; s < 4; s++)
            if (sw[s]) {
              tmp.r += cs[s].r * sw[s];
              tmp.g += cs[s].g * sw[s];
              tmp.b += cs[s].b * sw[s];
            }
          if (drought) tmp.lerp(C('#cdb168'), drought * 0.6);
          L.groundMat.color.copy(tmp);
          L.snow = (sw[3] || 0) * (L.ter === 'coast' ? 0.5 : 1);
        } else L.snow = L.ter === 'tundra' ? 1 : 0;
        TR.treeColors(L, sw);
      }
    }

    // cao độ mặt đất tại một điểm của thế giới (trên đảo nào thì theo đảo đó; ngoài đảo: 0)
    const groundAt = (x, z) => {
      for (const L of lands) {
        const dx = x - L.center.x,
          dz = z - L.center.z;
        if (dx * dx + dz * dz < LAND_R * LAND_R * 1.5) return L.surfAt(dx, dz);
      }
      return 0;
    };
    BK.groundAt = groundAt; // (quân, xe, đạn ở toạ độ thế giới: render/war3d.js, engines3d.js)
    return {
      lands,
      animate,
      seasons,
      groundAt,
      LAND_R,
      RING,
      SC,
      clearTrees: TR.clearTrees,
      thinTrees: TR.thinTrees,
      landOf: (i) => lands[i],
      shared: X,
    };
  }
  root.Lands3D = { create, LAND_R, RING, SC };
})(typeof self !== 'undefined' ? self : globalThis);
