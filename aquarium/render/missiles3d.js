/* Bể Kính · render/missiles3d.js · Tên lửa bay, vụ nổ, nấm hạt nhân
 * Vẽ W.missiles của logic (logic/missiles.js): mỗi quả { kind: 'missile' | 'nuke', from, to, key, launch, hit }.
 *   đang bay   thân tên lửa (trắng, đầu đỏ; hạt nhân: thân to, đầu vàng) bay vòng cung từ đảo bắn, cao dần rồi lao xuống
 *              đúng chỗ nhắm trên đảo kia (spotAt: chỗ của khoá như cổng, kho, nhà số…, render/buildings3d.js places);
 *              phía sau có lửa và một vệt khói (các cụm khói dọc đường đã bay, mờ dần).
 *   trúng      tên lửa: quả cầu lửa loé lên, to ra rồi tan, khói đen bốc lên (đống đổ, lửa ở chỗ đó: render/build/ruins3d.js).
 *              hạt nhân: chớp trắng cả vùng, vòng sóng xung kích lan trên mặt đất, cột khói và mũ nấm bốc cao, đổi từ cam
 *              sang xám rồi tan trong khoảng hai ngày lịch.
 * Thời gian theo ngày lịch của trận (day, có phần lẻ), nên ở 1×, 2×, 4× khớp với logic. Cần: three.js, render/map/map3d.js. */
(function (root) {
  'use strict';
  const BK = root.BK || (root.BK = {});
  const ARC = { missile: 45, nuke: 110 };        // độ cao đỉnh vòng cung
  const BOOM = { missile: 0.4, nuke: 2.2 };      // vụ nổ kéo dài chừng này ngày
  const TRAIL = 10;

  function create(o) {
    const { THREE, scene, lands3d } = o, lands = lands3d.lands;
    const basic = (c, x) => new THREE.MeshBasicMaterial(Object.assign({ color: c, transparent: true, depthWrite: false }, x || {}));
    const bodyG = new THREE.CylinderGeometry(0.35, 0.45, 3.2, 8); bodyG.rotateX(Math.PI / 2);
    const tipG = new THREE.ConeGeometry(0.45, 1.1, 8); tipG.rotateX(Math.PI / 2); tipG.translate(0, 0, 2.15);
    const flameG = new THREE.ConeGeometry(0.4, 1.8, 8); flameG.rotateX(-Math.PI / 2); flameG.translate(0, 0, -2.5);
    const ball = new THREE.SphereGeometry(1, 16, 12), ring = new THREE.RingGeometry(0.85, 1, 48); ring.rotateX(-Math.PI / 2);
    const stemG = new THREE.CylinderGeometry(0.5, 0.8, 1, 12); stemG.translate(0, 0.5, 0);
    const M = { body: new THREE.MeshStandardMaterial({ color: '#e9ecef', roughness: 0.4, metalness: 0.4 }), tip: new THREE.MeshStandardMaterial({ color: '#c0392b', roughness: 0.5 }), nukeTip: new THREE.MeshStandardMaterial({ color: '#f1c40f', roughness: 0.4, metalness: 0.3 }) };
    const puffG = new THREE.IcosahedronGeometry(0.7, 0), puffM = new THREE.MeshStandardMaterial({ color: '#d9d6d0', roughness: 1, transparent: true, opacity: 0.55, depthWrite: false, flatShading: true });
    const puffs = new THREE.InstancedMesh(puffG, puffM, 64 * TRAIL); puffs.count = 0; puffs.frustumCulled = false; scene.add(puffs);
    const pool = [];
    function make() {
      const g = new THREE.Group();
      const rocket = new THREE.Group(); rocket.add(new THREE.Mesh(bodyG, M.body)); const tip = new THREE.Mesh(tipG, M.tip); rocket.add(tip); rocket.add(new THREE.Mesh(flameG, basic('#ffb347', { opacity: 0.9 }))); g.add(rocket);
      const fire = new THREE.Mesh(ball, basic('#ff7a1a')), smoke = new THREE.Mesh(ball, basic('#4a4440', { opacity: 0.6 })), flash = new THREE.Mesh(ball, basic('#fffbe6'));
      const wave = new THREE.Mesh(ring, basic('#ffe2b0', { side: THREE.DoubleSide })), stem = new THREE.Mesh(stemG, basic('#e07b39')), cap = new THREE.Mesh(ball, basic('#f39c3d'));
      for (const m of [fire, smoke, flash, wave, stem, cap]) g.add(m);
      g.userData = { rocket, tip, fire, smoke, flash, wave, stem, cap }; scene.add(g); return g;
    }
    const P0 = new THREE.Vector3(), P1 = new THREE.Vector3(), P = new THREE.Vector3(), Q = new THREE.Vector3(), mat4 = new THREE.Matrix4(), q = new THREE.Quaternion(), one = new THREE.Vector3();
    // vị trí trên vòng cung lúc u (0..1)
    function arc(m, u, out) { out.copy(P0).lerp(P1, u); out.y += Math.sin(Math.PI * u) * ARC[m.kind] + (1 - u) * 3; return out; }
    // missiles: W.missiles; day: ngày lịch có phần lẻ; spotAt(i, key): chỗ của khoá trên đảo i (toạ độ đảo) hay null
    const aim = new Map(); // mã tên lửa → chỗ nhắm (toạ độ đảo)
    function update(missiles, day, t, spotAt) {
      let n = 0, np = 0;
      if (aim.size > 200) { const live = new Set((missiles || []).map((m) => m.id)); for (const k of [...aim.keys()]) if (!live.has(k)) aim.delete(k); }
      for (const m of missiles || []) {
        const g = pool[n] || (pool[n] = make()); n++; g.visible = true; const U = g.userData;
        const A = lands[m.from].center, B = lands[m.to].center;
        P0.copy(A).add(Q.copy(B).sub(A).setY(0).normalize().multiplyScalar(lands3d.LAND_R * 0.35)); P0.y = A.y + 2;
        let at = aim.get(m.id); if (!at) { const s = spotAt && spotAt(m.to, m.key); at = s ? s.clone() : new THREE.Vector3(); aim.set(m.id, at); } // nhớ chỗ nhắm (tính một lần)
        P1.copy(B).add(at); P1.y = B.y + 0.5;
        const u = (day - m.launch) / Math.max(1e-6, m.hit - m.launch), big = m.kind === 'nuke' ? 2.2 : 1;
        if (u < 1) {
          // đang bay: thân hướng theo đường bay, vệt khói phía sau
          U.rocket.visible = true; U.tip.material = m.kind === 'nuke' ? M.nukeTip : M.tip;
          arc(m, Math.max(0, u), P); arc(m, Math.min(1, Math.max(0, u) + 0.01), Q);
          U.rocket.position.copy(P); U.rocket.lookAt(Q); U.rocket.scale.setScalar(big);
          for (let k = 1; k <= TRAIL && np < puffs.instanceMatrix.count; k++) { const uk = u - k * 0.025; if (uk < 0) break; arc(m, uk, Q); const s = big * (0.6 + k * 0.18); q.identity(); mat4.compose(Q, q, one.setScalar(s)); puffs.setMatrixAt(np++, mat4); }
          for (const x of [U.fire, U.smoke, U.flash, U.wave, U.stem, U.cap]) x.visible = false;
          continue;
        }
        // trúng: vụ nổ theo thời gian kể từ lúc trúng
        U.rocket.visible = false;
        const e = Math.min(1, (day - m.hit) / BOOM[m.kind]);
        if (m.kind === 'missile') {
          U.fire.visible = true; U.fire.position.copy(P1); U.fire.scale.setScalar(1.5 + 7 * Math.sqrt(e)); U.fire.material.opacity = Math.max(0, 1 - e * 1.6);
          U.smoke.visible = true; U.smoke.position.copy(P1).setY(P1.y + 2 + 9 * e); U.smoke.scale.setScalar(2 + 5 * e); U.smoke.material.opacity = 0.65 * (1 - e);
          for (const x of [U.flash, U.wave, U.stem, U.cap]) x.visible = false;
        } else {
          // hạt nhân: chớp trắng, sóng xung kích, cột khói và mũ nấm
          U.flash.visible = e < 0.12; U.flash.position.copy(P1); U.flash.scale.setScalar(10 + 400 * e); U.flash.material.opacity = Math.max(0, 1 - e / 0.12);
          U.wave.visible = true; U.wave.position.copy(P1).setY(P1.y + 0.4); U.wave.scale.setScalar(4 + 110 * Math.sqrt(e)); U.wave.material.opacity = Math.max(0, 0.8 - e * 1.4);
          const h = 8 + 52 * Math.min(1, e * 2.2), grey = Math.min(1, e * 1.5);
          U.stem.visible = true; U.stem.position.copy(P1); U.stem.scale.set(3 + 3 * e, h, 3 + 3 * e); U.stem.material.color.set('#e07b39').lerp(new THREE.Color('#6d6660'), grey); U.stem.material.opacity = Math.max(0, 0.9 - Math.max(0, e - 0.6) * 2.2);
          U.cap.visible = true; U.cap.position.copy(P1).setY(P1.y + h); U.cap.scale.set(14 + 14 * e, 8 + 7 * e, 14 + 14 * e); U.cap.material.color.set('#ffb347').lerp(new THREE.Color('#77706a'), grey); U.cap.material.opacity = Math.max(0, 0.95 - Math.max(0, e - 0.6) * 2.4);
          U.fire.visible = e < 0.35; U.fire.position.copy(P1).setY(P1.y + 4); U.fire.scale.setScalar(6 + 20 * e); U.fire.material.opacity = Math.max(0, 1 - e / 0.35);
          U.smoke.visible = false;
        }
      }
      for (let k = n; k < pool.length; k++) pool[k].visible = false;
      puffs.count = np; puffs.instanceMatrix.needsUpdate = true; puffs.visible = np > 0;
    }
    return { update };
  }
  BK.Missiles3D = { create };
})(typeof self !== 'undefined' ? self : globalThis);
