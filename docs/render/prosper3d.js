/* Bể Kính · render/prosper3d.js · Thịnh vượng và suy tàn thấy được (design/chien-tranh-thinh-vuong.md mục 3; logic/prosperity.js)
 *   thời hoàng kim  dây cờ đuôi nheo nhiều màu và đèn lồng treo quanh nhà chính (đèn sáng hơn về đêm)
 *   kỳ quan         đài tưởng niệm cạnh nhà chính: mỗi kỳ quan dựng xong là một tầng đá có viền vàng; tầng đang dựng mọc
 *                   dần theo tiến độ, có giàn giáo; đỉnh có ngọn lửa vàng khi đã có ít nhất một kỳ quan
 *   suy tàn         cỏ dại, bụi hoang mọc trước cửa nhà
 *   tài nguyên chung ngư trường chung đang được hai đảo cùng khai thác: thuyền đánh cá hai màu đảo giữa hai đảo
 * Chỉ vẽ ở đảo đang vẽ gần (near(i)), trừ thuyền đánh cá ngoài biển. Cần: three.js. */
(function (root) {
  'use strict';
  const BK = root.BK || (root.BK = {});
  const MAXF = 400, MAXW = 600, SEA_Y = -0.55;
  const PAL = ['#e63946', '#f4a261', '#e9c46a', '#2a9d8f', '#457b9d', '#9b5de5'];
  function create(o) {
    const { THREE, scene, lands, colors } = o;
    const std = (c, x) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.8, flatShading: true }, x || {}));
    const inst = (geo, mat, n) => { const I = new THREE.InstancedMesh(geo, mat, n); I.count = 0; I.frustumCulled = false; scene.add(I); return I; };
    // cờ đuôi nheo: tam giác nhỏ treo trên dây; đèn lồng: cầu sáng
    const flagG = new THREE.BufferGeometry(); flagG.setAttribute('position', new THREE.Float32BufferAttribute([-0.25, 0, 0, 0.25, 0, 0, 0, -0.55, 0], 3)); flagG.computeVertexNormals();
    const flags = inst(flagG, std('#ffffff', { side: THREE.DoubleSide, emissive: '#331a00', emissiveIntensity: 0.3 }), MAXF);
    const lantM = new THREE.MeshBasicMaterial({ color: '#ffb347', transparent: true, opacity: 0.95 });
    const lanterns = inst(new THREE.SphereGeometry(0.22, 8, 6), lantM, 120);
    const ropeM = new THREE.LineBasicMaterial({ color: '#5a4630' });
    for (let k = 0; k < MAXF; k++) flags.setColorAt(k, new THREE.Color(PAL[k % PAL.length]));
    // cỏ dại: chóp nhọn xanh úa
    const weeds = inst(new THREE.ConeGeometry(0.4, 1.1, 5), std('#8a8a3c'), MAXW);
    // đài kỳ quan: tầng đá, viền vàng, giàn giáo, lửa đỉnh
    const stoneM = std('#cfc6b0'), goldM = std('#d4a017', { metalness: 0.6, roughness: 0.35, emissive: '#5a3d00', emissiveIntensity: 0.3 }), poleM = std('#7a5534');
    const flameM = new THREE.MeshBasicMaterial({ color: '#ffd23f', transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false });
    const tierG = new THREE.BoxGeometry(1, 1, 1); tierG.translate(0, 0.5, 0);
    const monuments = [];
    function monument(i) {
      if (monuments[i]) return monuments[i];
      const g = new THREE.Group(); g.userData.tiers = []; g.userData.rims = []; scene.add(g);
      for (let k = 0; k < 13; k++) { const t = new THREE.Mesh(tierG, stoneM), r = new THREE.Mesh(tierG, goldM); g.add(t); g.add(r); g.userData.tiers.push(t); g.userData.rims.push(r); }
      const sc = new THREE.Group(); for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1, 5), poleM); p.position.set(x, 0.5, z); sc.add(p); } g.add(sc); g.userData.scaffold = sc;
      const fl = new THREE.Mesh(new THREE.ConeGeometry(0.4, 1.2, 8), flameM); g.add(fl); g.userData.flame = fl;
      return (monuments[i] = g);
    }
    // thuyền đánh cá
    const boats = [], hullG = new THREE.BoxGeometry(1.8, 0.35, 0.7), hullM = std('#6b4a2f'), sailG = new THREE.PlaneGeometry(0.9, 1.1), sailM = (colors || PAL).map((c) => std(c, { side: THREE.DoubleSide }));
    function boat(k) { if (!boats[k]) { const g = new THREE.Group(); g.add(new THREE.Mesh(hullG, hullM)); const s = new THREE.Mesh(sailG, sailM[0]);
        s.position.set(0, 0.8, 0); s.rotation.y = Math.PI / 2; g.add(s); g.userData.sail = s; scene.add(g); boats[k] = g; } boats[k].visible = true;
        return boats[k]; }
    const ropes = [];
    function rope(k, pts) {
      if (!ropes[k]) { ropes[k] = new THREE.Line(new THREE.BufferGeometry(), ropeM); ropes[k].frustumCulled = false; scene.add(ropes[k]); }
      ropes[k].geometry.setFromPoints(pts); ropes[k].visible = true; return ropes[k];
    }
    const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), V = new THREE.Vector3(), S = new THREE.Vector3(), E = new THREE.Euler(), C = new THREE.Vector3();
    // chỗ dựng đài: quanh nhà chính, cách xa cửa các công trình (pl.all, pl.homes), đường và mép đảo; nhớ theo đảo và thời
    const spots = new Map();
    function spotFor(i, lv, pl, L, hc, R) {
      const key = i + ':' + lv; if (spots.has(key)) return spots.get(key);
      const busy = [...(pl.all || []), ...(pl.homes || []), ...(pl.square || []), ...(pl.market || [])], f = pl.podiumFace || new THREE.Vector3(0, 0, 1), a0 = Math.atan2(f.z, f.x);
      let best = null, bs = -1;
      for (let r = R + 4; r <= R + 22 && bs < 7; r += 2) for (let k = 0; k < 24; k++) {
        const a = a0 + Math.PI / 2 + (k % 2 ? 1 : -1) * Math.ceil(k / 2) * (Math.PI / 12), x = hc.x + Math.cos(a) * r, z = hc.z + Math.sin(a) * r;
        if (!L.inside(x, z, 6) || (L.blockedWild && L.blockedWild(x, z, 2.5))) continue;
        if (L.onRoad && L.onRoad(x, z, 2.5)) continue;
        let d = 1e9; for (const b of busy) if (b) d = Math.min(d, Math.hypot(b.x - x, b.z - z));
        for (const F of pl.fixed || []) d = Math.min(d, Math.hypot(F.x - x, F.y - z) - F.r);
        if (d > bs) { bs = d; best = new THREE.Vector3(x, 0, z); }
      }
      best = best || new THREE.Vector3(hc.x + Math.cos(a0 + Math.PI / 2) * (R + 4), 0, hc.z + Math.sin(a0 + Math.PI / 2) * (R + 4));
      spots.set(key, best); return best;
    }
    const hash = (n) => { const x = Math.sin(n * 127.1) * 43758.5453; return x - Math.floor(x); };
    // W (logic/world.js), day, t (giây), near(i), placesOf(i) (render/buildings3d.js places), night (0..1)
    function update(W, day, t, near, placesOf, night) {
      let nf = 0, nl = 0, nw = 0, nr = 0, nb = 0;
      W.islands.forEach((S0, i) => {
        const m = monuments[i];
        if (!near(i)) { if (m) m.visible = false; return; }
        const pl = placesOf(i), L = lands[i]; if (!pl) { if (m) m.visible = false; return; }
        const hc = pl.hallC && pl.hall && pl.hallC.distanceTo(pl.hall) < 15 ? pl.hallC : pl.hall; if (!hc) { if (m) m.visible = false; return; }
        const base = L.center.y + (L.surfAt ? L.surfAt(hc.x, hc.z) : 0), R = Math.min(12, pl.hallR || 5) + 2.5; // (đảo nhấp nhô: theo cao độ nền nhà chính)
        // thời hoàng kim: hai vòng dây cờ quanh nhà chính, đèn lồng giữa các đoạn
        if (S0.golden) {
          const seg = 14, pts = [];
          for (let k = 0; k <= seg; k++) {
            const a = (k / seg) * Math.PI * 2, x = hc.x + L.center.x + Math.cos(a) * R, z = hc.z + L.center.z + Math.sin(a) * R; pts.push(new THREE.Vector3(x, base + 4.2, z));
            if (k === seg) break;
            const a2 = ((k + 1) / seg) * Math.PI * 2, x2 = hc.x + L.center.x + Math.cos(a2) * R, z2 = hc.z + L.center.z + Math.sin(a2) * R;
            for (let j = 1; j < 6 && nf < MAXF; j++) {
              const u = j / 6, sag = Math.sin(Math.PI * u) * 0.6; V.set(x + (x2 - x) * u, base + 4.2 - sag, z + (z2 - z) * u);
              E.set(0, Math.atan2(x2 - x, z2 - z) + Math.PI / 2, Math.sin(t * 3 + nf) * 0.25); Q.setFromEuler(E); S.set(1, 1, 1); M.compose(V, Q, S); flags.setMatrixAt(nf++, M);
            }
            if (nl < 120) { V.set(x, base + 4.0 - 0.15 * Math.sin(t * 2 + k), z); Q.identity(); S.setScalar(1 + 0.5 * night); M.compose(V, Q, S); lanterns.setMatrixAt(nl++, M); }
          }
          rope(nr++, pts);
        }
        // kỳ quan: đài cạnh nhà chính (lệch sang bên, cách nhà chính một đoạn)
        const done = (S0.wonders || []).length, building = S0.wonder ? S0.wonder.progress : 0;
        if (!done && !S0.wonder) { if (m) m.visible = false; }
        else {
          const g = monument(i); g.visible = true;
          const sp = spotFor(i, S0.level, pl, L, hc, (pl.hallR || 5) + 2.5); g.position.set(sp.x + L.center.x, L.center.y + (L.surfAt ? L.surfAt(sp.x, sp.z) : 0), sp.z + L.center.z);
          let y = 0;
          const n = done + (S0.wonder ? 1 : 0);
          for (let k = 0; k < 13; k++) {
            const T = g.userData.tiers[k], Rm = g.userData.rims[k], w = 3.2 - k * 0.22, h = k < done ? 1.1 : k === done && S0.wonder ? 1.1 * Math.max(0.05, building) : 0;
            T.visible = Rm.visible = h > 0 && k < n;
            if (!T.visible) continue;
            T.scale.set(w, h, w); T.position.y = y; Rm.scale.set(w + 0.1, 0.12, w + 0.1); Rm.position.y = y + h - 0.06; Rm.visible = k < done; y += h;
          }
          const sc = g.userData.scaffold; sc.visible = !!S0.wonder; if (sc.visible) { const w = 3.2 - done * 0.22; sc.scale.set(w * 0.62, y + 0.8, w * 0.62); }
          const fl = g.userData.flame; fl.visible = done > 0; fl.position.y = y + 0.6; fl.scale.set(1, 1 + 0.25 * Math.sin(t * 8), 1);
        }
        // suy tàn: cỏ dại cao trước cửa nhà, giữa sân, quanh chợ đã đóng cửa (design/ke-hoach-khac-phuc.md mục 6.4)
        if (S0.decline) for (const d of [...(pl.homes || []), ...(pl.square || []).slice(0, 2), ...(pl.market || []).slice(0, 2)]) {
          if (nw > MAXW - 8) break; const h = Math.round(d.x * 7 + d.z * 13);
          for (let j = 0; j < 8; j++) { const a = hash(i * 977 + h * 31 + j) * Math.PI * 2, r = 0.8 + hash(h * 7 + j * 13 + i) * 2.6;
              V.set(d.x + L.center.x + Math.cos(a) * r, base + 0.6, d.z + L.center.z + Math.sin(a) * r); Q.identity();
              S.set(1, 1.1 + hash(h + j * 3) * 0.9, 1).multiplyScalar(0.8 + hash(h + j) * 0.5); M.compose(V, Q, S); weeds.setMatrixAt(nw++, M); }
        }
      });
      // ngư trường chung: thuyền đánh cá của hai đảo giữa biển
      for (const c of W.commons || []) {
        if (c.kind !== 'fish' || !c.active) continue;
        const A = lands[c.a].center, B = lands[c.b].center; C.copy(A).add(B).multiplyScalar(0.5).setY(0);
        for (let k = 0; k < 4; k++) {
          const g = boat(nb++), isle = k % 2 ? c.b : c.a, a = t * 0.05 + k * 1.6 + c.a;
          g.userData.sail.material = sailM[isle % sailM.length];
          const px = C.x + Math.cos(a) * 5, pz = C.z + Math.sin(a) * 5, S = BK.seaAt ? BK.seaAt(px, pz) : null; // (nổi trên sóng: sea3d.js)
          g.position.set(px, (S ? S.y : SEA_Y) + 0.2, pz); g.rotation.set(S ? Math.atan(S.tx * Math.sin(-a) + S.tz * Math.cos(-a)) * 0.8 : 0, -a, S ? -Math.atan(S.tx * Math.cos(-a) - S.tz * Math.sin(-a)) * 0.8 : Math.sin(t * 1.3 + k) * 0.05);
        }
      }
      for (const [I, n] of [[flags, nf], [lanterns, nl], [weeds, nw]]) { I.count = n; I.instanceMatrix.needsUpdate = true; I.visible = n > 0; }
      lantM.opacity = 0.65 + 0.35 * night;
      for (let k = nr; k < ropes.length; k++) ropes[k].visible = false;
      for (let k = nb; k < boats.length; k++) boats[k].visible = false;
    }
    return { update, spotOf: (i, lv) => spots.get(i + ':' + lv) || null }; // spotOf: chỗ đài kỳ quan đã chọn (tools/check-scene.js)
  }
  BK.Prosper3D = { create };
})(typeof self !== 'undefined' ? self : globalThis);
