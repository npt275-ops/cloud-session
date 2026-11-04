/* Bể Kính · render/snow3d.js
 * Tuyết rơi mùa đông trên băng nguyên (dày) và núi (thưa), dày dần theo độ đông (G.weather.winter).
 * Cần: game/world.js, render/scene3d.js, game/nature.js (các đảo). */
(function (root) {
  const BK = root.BK || (root.BK = {});
  function setup(G) {
    const { THREE, scene, hash, glowTex, reduce, lands } = G;
    const SNOW_N = 900, snowSets = ['tundra', 'mountain'].map((ter) => {
      const L = lands.find((l) => l.ter === ter), pos = new Float32Array(SNOW_N * 3);
      for (let i = 0; i < SNOW_N; i++) { const a = hash(i * 5 + L.i) * Math.PI * 2, r = Math.sqrt(hash(i * 5 + 1 + L.i)) * (Lands3D.LAND_R + 4); pos[i * 3] = Math.cos(a) * r; pos[i * 3 + 1] = hash(i * 5 + 2) * 48; pos[i * 3 + 2] = Math.sin(a) * r; }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const m = new THREE.Points(g, new THREE.PointsMaterial({ color: '#ffffff', size: 0.9, map: glowTex, transparent: true, opacity: 0, depthWrite: false }));
      m.position.copy(L.center); m.frustumCulled = false; m.visible = false; scene.add(m);
      return { L, m, pos, k: 0, heavy: ter === 'tundra' ? 1 : 0.6 };
    });
    function update(dt, t, winter) {
      const sdt = dt / 1000;
      for (const S of snowSets) {
        S.k += (winter * S.heavy - S.k) * Math.min(1, dt / 3000);
        S.m.visible = S.k > 0.02; if (!S.m.visible) continue;
        S.m.material.opacity = 0.9 * S.k;
        for (let i = 0; i < SNOW_N; i++) { const o = i * 3; S.pos[o + 1] -= (reduce ? 1 : 2.6) * sdt * (0.7 + hash(i) * 0.6); S.pos[o] += Math.sin(t * 0.0008 + i) * 0.4 * sdt; if (S.pos[o + 1] < 0) S.pos[o + 1] += 48; }
        S.m.geometry.attributes.position.needsUpdate = true;
      }
    }
    G.snow = { update };
  }
  BK.Snow3D = { setup };
})(typeof self !== 'undefined' ? self : globalThis);
