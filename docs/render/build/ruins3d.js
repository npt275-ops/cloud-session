/* Bể Kính · render/build/ruins3d.js · Công trình hư hại trong chiến tranh
 * (design/npc-song-that.md mục 7.3) Vẽ những chỗ bị phá của một đảo theo logic/siege.js (S.ruin: độ bền còn lại 0..1):
 *   đang cháy   lửa (chóp sáng màu cam, phập phồng) và khói đen bốc lên, chừng nào còn giặc trên đảo
 *   hư          đống gạch gỗ cháy đen quanh chân công trình, nhiều hay ít theo phần độ bền đã mất
 *   sụp         (độ bền dưới COLLAPSE) công trình biến mất, chỉ còn đống đổ nát (render/buildings3d.js ẩn công trình)
 *   đang sửa    giàn giáo gỗ dựng quanh chỗ hư, thợ tới làm (logic/tasks.js); đống đổ nát vơi dần theo độ bền
 * Mỗi đảo một bộ khối lặp (InstancedMesh) cho đống đổ, lửa, giàn giáo; khói dùng render/build/life3d.js (màu khói đen).
 * Dùng: const R = BK.Ruins3D.create(THREE, parent); mỗi khung hình R.update(sites, giây) với
 * sites: [{ x, z, r, hp, burning, fixing }] theo toạ độ của parent. Cần: three.js, render/build/life3d.js. */
(function (root) {
  'use strict';
  const BK = root.BK || (root.BK = {});
  const COLLAPSE = 0.35;
  const MAX_SITES = 16, RUBBLE = 9, FLAMES = 4, POLES = 6;
  function create(THREE, parent) {
    const mat = (c, x) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.95, flatShading: true }, x || {}));
    const mk = (geo, m, n) => { const I = new THREE.InstancedMesh(geo, m, n); I.count = 0; I.frustumCulled = false; parent.add(I); return I; };
    const rubble = mk(new THREE.BoxGeometry(1, 1, 1), mat('#2f2925'), MAX_SITES * RUBBLE);
    const coneG = new THREE.ConeGeometry(0.75, 2.4, 6); coneG.translate(0, 1.2, 0);
    const flame = mk(coneG, new THREE.MeshBasicMaterial({ color: '#ff8a2a', transparent: true, opacity: 0.85, depthWrite: false }), MAX_SITES * FLAMES);
    const poleG = new THREE.BoxGeometry(0.12, 1, 0.12); poleG.translate(0, 0.5, 0);
    const poles = mk(poleG, mat('#9a6b3c'), MAX_SITES * (POLES + 2));
    const smoke = BK.Life3D ? BK.Life3D.create(THREE, parent, { color: '#36312d', opacity: 0.7 }) : null;
    const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), P = new THREE.Vector3(), S = new THREE.Vector3();
    const rnd = (k) => { const v = Math.sin(k * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); }; // cố định theo chỗ, không nhảy mỗi khung hình
    const emit = [];
    function update(sites, t) {
      let nr = 0, nf = 0, np = 0; emit.length = 0;
      for (let s = 0; s < Math.min(MAX_SITES, sites.length); s++) {
        const A = sites[s], lost = 1 - Math.max(0, Math.min(1, A.hp)), seed = Math.round(A.x * 7 + A.z * 13);
        // đống đổ nát: số khối và độ cao theo phần độ bền đã mất; sụp thì phủ cả nền
        const k = Math.round(RUBBLE * Math.min(1, lost * 1.3)), spread = A.r * (A.hp < COLLAPSE ? 0.8 : 0.6);
        for (let j = 0; j < k; j++) {
          const a = rnd(seed + j) * 6.283, d = Math.sqrt(rnd(seed + j * 3 + 1)) * spread, h = (0.25 + rnd(seed + j * 5) * 0.7) * (A.hp < COLLAPSE ? 1.6 : 1);
          P.set(A.x + Math.cos(a) * d, h * 0.4, A.z + Math.sin(a) * d); E.set(rnd(seed + j * 7) * 0.6, a, rnd(seed + j * 11) * 0.5); Q.setFromEuler(E);
          S.set(0.6 + rnd(seed + j * 13) * 1.1, h, 0.5 + rnd(seed + j * 17) * 0.9); M.compose(P, Q, S); rubble.setMatrixAt(nr++, M);
        }
        // lửa, khói đen
        if (A.burning) {
          for (let j = 0; j < FLAMES; j++) {
            const a = rnd(seed + j * 19) * 6.283, d = rnd(seed + j * 23) * A.r * 0.5, f = 0.7 + 0.35 * Math.sin(t * (7 + j) + j * 2.1) * Math.sin(t * 4.3 + j);
            P.set(A.x + Math.cos(a) * d, 0.1, A.z + Math.sin(a) * d); Q.identity(); S.set(f, f * (1.2 + rnd(seed + j) * 0.8), f); M.compose(P, Q, S); flame.setMatrixAt(nf++, M);
          }
          emit.push({ x: A.x, y: 1.2, z: A.z, s: 0.7 + A.r * 0.08 });
        }
        // giàn giáo khi sửa: cột quanh chỗ hư, hai thanh ngang
        if (A.fixing) {
          const H = 2.2 + A.r * 0.4;
          for (let j = 0; j < POLES; j++) { const a = (j / POLES) * 6.283; P.set(A.x + Math.cos(a) * A.r * 0.7, 0, A.z + Math.sin(a) * A.r * 0.7); Q.identity(); S.set(1, H, 1); M.compose(P, Q, S); poles.setMatrixAt(np++, M); }
          for (const y of [H * 0.45, H * 0.9]) { P.set(A.x, y, A.z); Q.identity(); S.set(A.r * 12, 0.12, 1); M.compose(P, Q, S); poles.setMatrixAt(np++, M); }
        }
      }
      for (const [I, n] of [[rubble, nr], [flame, nf], [poles, np]]) { I.count = n; I.instanceMatrix.needsUpdate = true; I.visible = n > 0; }
      if (smoke) smoke.update(emit, t);
    }
    return { update, COLLAPSE };
  }
  BK.Ruins3D = { create, COLLAPSE };
})(typeof self !== 'undefined' ? self : globalThis);
