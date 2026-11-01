/* Bể Kính — lớp hình ảnh của bộ máy câu chuyện.
 * Sợi lan truyền giữa các nhà, quầng sáng trên mái, tinh thể phát minh, hạt giống rơi,
 * khí cầu và bến cảng, lửa và giàn giáo, đạo diễn camera, phụ đề, biên niên sử.
 * Nhận ngữ cảnh X từ index.html; không tự chạy vòng lặp, index gọi onDay() và update(). */
(function (root) {
  'use strict';

  const TYPE = {
    invention: ['Phát minh', '#ffd36b'], fad: ['Cơn sốt', '#ff6b9d'], 'fad-peak': ['Cơn sốt', '#ff6b9d'], 'fad-crash': ['Bong bóng vỡ', '#ff9f43'], 'fad-over': ['Cơn sốt', '#c9b6c0'],
    bankrun: ['Rút tiền ồ ạt', '#ff5a5a'], 'bankrun-end': ['Kho Bạc', '#9cc3ff'], rumor: ['Tin đồn', '#ff8a8a'],
    airship: ['Khí cầu', '#7bdff2'], 'airship-leave': ['Khí cầu', '#7bdff2'], fire: ['Hoả hoạn', '#ff7a2f'],
    bankrupt: ['Phá sản', '#d49a9a'], open: ['Khai trương', '#9be564'], job: ['Việc làm', '#9df0c4'], layoff: ['Mất việc', '#b9a3a3'],
    rich: ['Giàu lên', '#f2c14e'], hungry: ['Thiếu ăn', '#e58f8f'], copy: ['Học theo', '#e8d38a'],
    season: ['Mùa', '#a6d6a0'], drought: ['Hạn hán', '#e0b060'], 'drought-end': ['Hạn hán', '#a6d6a0'], festival: ['Lễ hội', '#ffb36b'],
  };
  const TIER_PRI = { small: 1, major: 2, epic: 3 }, TIER_HOLD = { small: 4800, major: 7500, epic: 10000 }, TIER_DIST = { small: 26, major: 32, epic: 44 }, TIER_AGE = { small: 8, major: 24, epic: 45 };
  const typeOf = (t) => TYPE[t] || ['Chuyện', '#d9d4c7'];

  function create(X) {
    const { THREE, island, world, Sim, houses, firmObj, glowTex, mat, mesh, box, label3d, toast, puff, ripple, spawnMote, flyTo, select, audio, $, reduce, PLAZA, R, bank, C } = X;
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const lerp = (a, b, k) => a + (b - a) * k;
    const now = () => performance.now();
    const firmOf = (id) => world.firms.find((f) => f.id === id);
    const additive = (color, opacity) => new THREE.SpriteMaterial({ map: glowTex, color, transparent: true, opacity: opacity || 0, depthWrite: false, blending: THREE.AdditiveBlending });

    /* =============== Vị trí =============== */
    const DOCK_ANG = 0.75, outDir = new THREE.Vector3(Math.cos(DOCK_ANG), 0, Math.sin(DOCK_ANG));
    const dockHover = outDir.clone().multiplyScalar(R + 6.5).setY(7.5);
    function housePos(i) { const H = houses[i]; return H ? H.g.position : PLAZA; }
    function firmPos(id) { const o = firmObj.get(id); return o ? o.g.position : null; }
    function placePos(place) {
      if (!place) return PLAZA;
      if (place.kind === 'house') return housePos(place.id);
      if (place.kind === 'firm') return firmPos(place.id) || PLAZA;
      if (place.kind === 'bank') return bank.position;
      if (place.kind === 'dock') return dockHover.clone().setY(0).addScaledVector(outDir, -4);
      if (place.kind === 'farms') { const fs = [...firmObj.values()].filter((o) => o.kind === 'farm'); if (!fs.length) return PLAZA; const p = new THREE.Vector3(); for (const o of fs) p.add(o.g.position); return p.multiplyScalar(1 / fs.length); }
      return PLAZA;
    }

    /* =============== Sợi lan truyền =============== */
    const ARC_N = 72, SEG = 18, arcs = [];
    for (let i = 0; i < ARC_N; i++) {
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array((SEG + 1) * 3), 3));
      const line = new THREE.Line(g, new THREE.LineBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
      line.frustumCulled = false; line.visible = false; island.add(line);
      const spark = new THREE.Sprite(additive('#ffffff')); spark.scale.set(1.7, 1.7, 1); spark.visible = false; island.add(spark);
      arcs.push({ line, spark, t0: 0, dur: 1, pts: [] });
    }
    let arcIdx = 0;
    function spawnArc(a, b, color) {
      if (!a || !b || a.distanceTo(b) < 0.8) return;
      const A = arcs[arcIdx++ % ARC_N], d = a.distanceTo(b);
      const mid = a.clone().lerp(b, 0.5); mid.y = 6 + d * 0.3;
      const pos = A.line.geometry.attributes.position; A.pts = [];
      for (let i = 0; i <= SEG; i++) {
        const u = i / SEG, v = 1 - u;
        const p = new THREE.Vector3(v * v * a.x + 2 * v * u * mid.x + u * u * b.x, v * v * (a.y + 4) + 2 * v * u * mid.y + u * u * (b.y + 4), v * v * a.z + 2 * v * u * mid.z + u * u * b.z);
        pos.setXYZ(i, p.x, p.y, p.z); A.pts.push(p);
      }
      pos.needsUpdate = true;
      A.line.material.color.set(color); A.spark.material.color.set(color);
      A.t0 = now() + Math.random() * 700; A.dur = 1300 + Math.random() * 700; A.line.visible = A.spark.visible = true;
    }
    function updateArcs() {
      const n = now();
      for (const A of arcs) {
        if (!A.line.visible) continue;
        const k = (n - A.t0) / A.dur;
        if (k < 0) { A.line.material.opacity = 0; A.spark.material.opacity = 0; continue; }
        if (k > 1.7) { A.line.visible = A.spark.visible = false; continue; }
        A.spark.position.copy(A.pts[Math.min(A.pts.length - 1, Math.floor(Math.min(1, k) * (A.pts.length - 1)))]);
        A.spark.material.opacity = k <= 1 ? 0.95 : 0;
        A.line.material.opacity = k < 1 ? 0.6 * Math.min(1, k * 3) : 0.6 * (1 - (k - 1) / 0.7);
      }
    }
    function spreadArcs() {
      const fad = Sim.activeFad(world), list = world.spread || [];
      const fear = list.filter((s) => s.kind === 'fear'), hype = list.filter((s) => s.kind === 'hype');
      const pick = [...fear.slice(0, 14), ...hype.slice(0, 14)];
      for (const s of pick) spawnArc(housePos(Math.floor(s.from / 4)), housePos(Math.floor(s.to / 4)), s.kind === 'fear' ? '#ff5a5a' : fad ? fad.color : '#ffd166');
    }

    /* =============== Quầng sáng trên mái: nhà đang sợ, nhà đang mê =============== */
    const auras = [];
    function computeAuras() {
      while (auras.length < houses.length) { const s = new THREE.Sprite(additive('#ff5a5a')); s.scale.set(3.4, 3.4, 1); island.add(s); auras.push({ s, level: 0, target: 0 }); }
      const fad = Sim.activeFad(world);
      for (let i = 0; i < houses.length; i++) {
        let fear = 0, hype = 0;
        for (let k = 0; k < 4; k++) { const h = world.households[i * 4 + k]; if (!h) continue; if (h.fear > 0) fear++; if (fad && h.hype === fad.id) hype++; }
        const A = auras[i];
        A.target = Math.max(fear, hype) / 4;
        A.s.material.color.set(fear >= hype && fear > 0 ? '#ff4d4d' : fad ? fad.color : '#ffd166');
      }
    }
    function updateAuras(t) {
      for (let i = 0; i < auras.length; i++) {
        const A = auras[i], H = houses[i];
        if (!H) continue;
        A.level += (A.target - A.level) * 0.08;
        A.s.position.set(H.g.position.x, 7.4 + H.level * 1.45 * H.g.scale.y, H.g.position.z);
        A.s.material.opacity = A.level * (0.5 + 0.3 * Math.sin(t * 0.004 + i));
        A.s.visible = A.level > 0.02;
      }
    }

    /* =============== Hàng người chen mua món đang sốt =============== */
    const QN = 18, P = X.people;
    const hatMat = new THREE.MeshStandardMaterial({ color: '#ff6b9d', flatShading: true, roughness: 0.7, emissive: '#3a1020', emissiveIntensity: 0.25 });
    const qBodies = new THREE.InstancedMesh(P.bodyGeo, new THREE.MeshStandardMaterial({ flatShading: true, roughness: 0.8 }), QN);
    const qHeads = new THREE.InstancedMesh(P.headGeo, P.headMat, QN);
    const qHats = new THREE.InstancedMesh(new THREE.ConeGeometry(0.48, 0.24, 8), hatMat, QN);
    for (let i = 0; i < QN; i++) qBodies.setColorAt(i, C(P.shirts[(i * 5) % P.shirts.length]));
    for (const m of [qBodies, qHeads, qHats]) { m.castShadow = true; m.frustumCulled = false; island.add(m); }
    const qd = new THREE.Object3D();
    let qLevel = 0, qFirm = null;
    function updateQueue(t) {
      const fad = Sim.activeFad(world), tod = X.tod();
      const o = fad && firmObj.get(fad.firmId);
      const open = tod > 0.3 && tod < 0.74;
      const target = o && open && (fad.state === 'rising' || fad.state === 'peak') ? clamp(fad.share * 2.4, 0.15, 1) : 0;
      qLevel += (target - qLevel) * 0.03;
      if (o) qFirm = o;
      const show = qLevel > 0.01 && qFirm;
      for (const m of [qBodies, qHeads, qHats]) m.visible = !!show;
      if (!show) return;
      if (fad) hatMat.color.set(fad.color);
      // chen trước mặt xưởng (phía lò và thùng hàng, trục +z cục bộ)
      const p = qFirm.g.position, th = qFirm.g.rotation.y, cs = Math.cos(th), sn = Math.sin(th), n = qLevel * QN;
      for (let i = 0; i < QN; i++) {
        // các lô xưởng chỉ cách nhau ~6 đơn vị: hai hàng sát cửa, rồi đứng tràn sang hai bên hông
        let lx, lz;
        if (i < 14) { const row = Math.floor(i / 7), col = i % 7; lx = (row ? 3 - col : col - 3) * 0.62; lz = 2.75 + row * 0.7; }
        else { const k = i - 14; lx = (k % 2 ? 1 : -1) * 2.45; lz = 2.05 - Math.floor(k / 2) * 0.65; }
        if (i >= n) qd.position.set(0, -80, 0), qd.scale.setScalar(0.001);
        else { const jig = reduce ? 0 : Math.sin(t * 0.007 + i * 1.3) * 0.06; qd.position.set(p.x + lx * cs + lz * sn + jig, 0.31 + Math.abs(Math.sin(t * 0.009 + i)) * 0.07, p.z - lx * sn + lz * cs); qd.scale.setScalar(1); }
        qd.updateMatrix(); qBodies.setMatrixAt(i, qd.matrix);
        qd.position.y += 0.47; qd.updateMatrix(); qHeads.setMatrixAt(i, qd.matrix);
        qd.position.y += 0.45; qd.updateMatrix(); qHats.setMatrixAt(i, qd.matrix);
      }
      qBodies.instanceMatrix.needsUpdate = qHeads.instanceMatrix.needsUpdate = qHats.instanceMatrix.needsUpdate = true;
    }

    /* =============== Phát minh: tinh thể, hạt giống rơi, ánh loé =============== */
    const crystalGeo = new THREE.OctahedronGeometry(0.42, 0);
    const crystalMat = new THREE.MeshStandardMaterial({ color: '#fff1b8', emissive: '#ffc94d', emissiveIntensity: 1.1, flatShading: true, roughness: 0.3 });
    const crystals = new Map();
    function syncCrystals(t) {
      for (const [id, o] of firmObj) {
        const f = firmOf(id), n = f && f.alive ? Math.min(3, f.inventions || 0) : 0;
        let c = crystals.get(id);
        if (c && (c.n !== n || c.parent !== o.g)) { c.parent.remove(c.g); crystals.delete(id); c = null; }
        if (!n) continue;
        if (!c) {
          const g = new THREE.Group();
          for (let k = 0; k < n; k++) { const m = new THREE.Mesh(crystalGeo, crystalMat); m.position.set((k - (n - 1) / 2) * 0.95, 0, 0); g.add(m); }
          const halo = new THREE.Sprite(additive('#ffd36b', 0.55)); halo.scale.set(3.4, 3.4, 1); g.add(halo);
          o.g.add(g); c = { g, n, parent: o.g, base: o.kind === 'farm' ? 7.6 : 6.4 };
          crystals.set(id, c);
        }
        c.g.position.y = c.base + Math.sin(t * 0.002 + id) * 0.18;
        c.g.rotation.y = t * 0.0012;
      }
    }
    const flashes = [], seeds = [];
    function flashAt(p, color, size) {
      const s = new THREE.Sprite(additive(color, 1)); s.position.set(p.x, 5, p.z); island.add(s);
      flashes.push({ s, t0: now(), size: size || 24 });
    }
    function inventFlash(firmId, item) {
      const p = firmPos(firmId) || PLAZA;
      flashAt(p, '#ffe08a', 26); ripple(p, '#ffd36b');
      for (let k = 0; k < 26; k++) { const a = (k / 26) * Math.PI * 2; spawnMote(new THREE.Vector3(p.x, 5, p.z), new THREE.Vector3(p.x + Math.cos(a) * 7, 9 + Math.random() * 5, p.z + Math.sin(a) * 7), '#ffe08a', 1500); }
      label3d('Phát minh: ' + item, new THREE.Vector3(p.x, 9.5, p.z), '#ffd27a');
      if (audio) audio.chime();
    }
    function dropSeed(firmId, onLand) {
      const p = firmPos(firmId); if (!p) { onLand(); return; }
      const g = new THREE.Group();
      g.add(new THREE.Mesh(new THREE.OctahedronGeometry(0.55, 0), new THREE.MeshStandardMaterial({ color: '#fff6d6', emissive: '#ffd36b', emissiveIntensity: 1.8, flatShading: true })));
      const halo = new THREE.Sprite(additive('#ffd36b', 0.9)); halo.scale.set(5, 5, 1); g.add(halo);
      g.position.set(p.x, 40, p.z); island.add(g);
      seeds.push({ g, p: p.clone(), t0: now(), dur: 1500, onLand, trail: 0 });
      if (audio) audio.whoosh();
    }
    function updateFx(dt) {
      const n = now();
      for (let i = flashes.length - 1; i >= 0; i--) {
        const F = flashes[i], k = (n - F.t0) / 1100;
        if (k >= 1) { island.remove(F.s); F.s.material.dispose(); flashes.splice(i, 1); continue; }
        F.s.scale.setScalar(2 + k * F.size); F.s.material.opacity = 1 - k;
      }
      for (let i = seeds.length - 1; i >= 0; i--) {
        const S = seeds[i], k = Math.min(1, (n - S.t0) / S.dur), e = k * k;
        S.g.position.y = lerp(40, 4.5, e); S.g.rotation.y += dt * 0.01;
        S.trail += dt;
        if (S.trail > 45 && !reduce) { S.trail = 0; puff(new THREE.Vector3(S.p.x + (Math.random() - 0.5) * 0.6, S.g.position.y + 0.8, S.p.z + (Math.random() - 0.5) * 0.6), false, '#ffe7a3'); }
        if (k >= 1) { island.remove(S.g); seeds.splice(i, 1); S.onLand(); }
      }
    }

    /* =============== Khí cầu và bến cảng =============== */
    const dock = new THREE.Group();
    dock.position.copy(outDir.clone().multiplyScalar(R - 2.5)); dock.rotation.y = Math.atan2(outDir.x, outDir.z); dock.visible = false; island.add(dock);
    for (let k = 0; k < 9; k++) mesh(box(2.6, 0.22, 1.05), mat('#9b7653'), 0, 0.25, k * 1.1, dock);
    for (const sx of [-1.25, 1.25]) for (let k = 0; k < 5; k++) mesh(box(0.2, 1.5, 0.2), mat('#6d5139'), sx, -0.8, k * 2.2, dock);
    const dockLamp = new THREE.Sprite(additive('#ffc970', 0.7)); dockLamp.scale.set(3, 3, 1); dockLamp.position.set(0, 2.6, 9); dock.add(dockLamp);
    mesh(new THREE.CylinderGeometry(0.08, 0.1, 2.4, 6), mat('#2f3540'), 0, 1.2, 9, dock);
    const ship = new THREE.Group(); ship.visible = false; island.add(ship);
    (function buildShip() {
      const env = mesh(new THREE.SphereGeometry(2.6, 18, 12), mat('#c9584f'), 0, 0, 0, ship); env.scale.set(1, 1, 1.75);
      for (const z of [-2.6, 0, 2.6]) { const band = mesh(new THREE.TorusGeometry(2.62 * Math.sqrt(1 - (z / 4.55) ** 2), 0.09, 6, 28), mat('#e8c25a', { metalness: 0.5, roughness: 0.4 }), 0, 0, z, ship); }
      for (const s of [-1, 1]) { const fin = mesh(new THREE.BoxGeometry(0.12, 1.6, 1.4), mat('#a8463e'), s * 0.0, s * 0, -4.3, ship); fin.rotation.z = s * Math.PI / 2 * 0; }
      mesh(new THREE.BoxGeometry(1.6, 0.12, 1.4), mat('#a8463e'), 0, 0, -4.3, ship);
      const gond = mesh(box(1.5, 0.9, 3), mat('#7a5638'), 0, -3.9, 0, ship);
      for (let k = 0; k < 4; k++) mesh(box(0.3, 0.3, 0.06), mat('#ffd98a', { emissive: '#ffc970', emissiveIntensity: 0.8 }), 0.76, -3.45, -1 + k * 0.66, ship);
      for (const [x, z] of [[-0.6, -1.2], [0.6, -1.2], [-0.6, 1.2], [0.6, 1.2]]) { const r = mesh(new THREE.CylinderGeometry(0.03, 0.03, 2.4, 4), mat('#3a3a3a'), x, -2.2, z, ship); r.castShadow = false; }
      const prop = new THREE.Group(); prop.position.set(0, -3.5, -1.75); ship.add(prop); ship.userData.prop = prop;
      for (let k = 0; k < 2; k++) { const b = mesh(new THREE.BoxGeometry(0.15, 1.6, 0.05), mat('#5a4636'), 0, 0, 0, prop); b.rotation.z = k * Math.PI / 2; }
      const lamp = new THREE.Sprite(additive('#ffc970', 0.8)); lamp.scale.set(2.6, 2.6, 1); lamp.position.set(0, -4.2, 1.6); ship.add(lamp);
    })();
    const shipVis = { mode: 'hidden', t0: 0, from: new THREE.Vector3(), to: new THREE.Vector3() };
    const farPoint = outDir.clone().multiplyScalar(R + 150).setY(45);
    const crates = [];
    const crateGeo = new THREE.BoxGeometry(0.55, 0.55, 0.55), crateMat = mat('#c49a62');
    function sendCrates() {
      const ex = (world.flows || []).filter((f) => f.kind === 'export').slice(0, 5);
      for (const f of ex) {
        const p = firmPos(+String(f.to).slice(1)); if (!p) continue;
        const m = new THREE.Mesh(crateGeo, crateMat); m.castShadow = true; island.add(m);
        crates.push({ m, a: new THREE.Vector3(p.x, 2.5, p.z), b: ship.position.clone().add(new THREE.Vector3(0, -3.5, 0)), t0: now() + Math.random() * 500, dur: 1700 });
      }
    }
    function updateShip(t, dt) {
      const a = world.airship;
      dock.visible = a.visits > 0;
      if (a.state === 'docked' && (shipVis.mode === 'hidden' || shipVis.mode === 'leaving')) { shipVis.mode = 'arriving'; shipVis.t0 = now(); shipVis.from.copy(ship.visible ? ship.position : farPoint); ship.visible = true; }
      if (a.state !== 'docked' && (shipVis.mode === 'arriving' || shipVis.mode === 'docked')) { shipVis.mode = 'leaving'; shipVis.t0 = now(); shipVis.from.copy(ship.position); }
      if (shipVis.mode === 'hidden') { ship.visible = false; return; }
      const k = clamp((now() - shipVis.t0) / 7000, 0, 1), e = 1 - Math.pow(1 - k, 3);
      let target;
      if (shipVis.mode === 'arriving') { ship.position.lerpVectors(shipVis.from, dockHover, e); target = dockHover; if (k >= 1) shipVis.mode = 'docked'; }
      else if (shipVis.mode === 'leaving') { ship.position.lerpVectors(shipVis.from, farPoint, k * k); target = farPoint; if (k >= 1) { shipVis.mode = 'hidden'; ship.visible = false; } }
      else { ship.position.set(dockHover.x, dockHover.y + Math.sin(t * 0.0012) * 0.35, dockHover.z); target = null; }
      if (target && ship.position.distanceTo(target) > 0.5) ship.lookAt(island.localToWorld(target.clone()));
      else ship.rotation.set(0, Math.atan2(-outDir.z, outDir.x) + Math.PI / 2, 0);
      ship.userData.prop.rotation.z += dt * (shipVis.mode === 'docked' ? 0.002 : 0.02);
      const n = now();
      for (let i = crates.length - 1; i >= 0; i--) {
        const C = crates[i], kk = (n - C.t0) / C.dur;
        if (kk < 0) { C.m.visible = false; continue; }
        C.m.visible = true;
        if (kk >= 1) { island.remove(C.m); crates.splice(i, 1); continue; }
        C.m.position.lerpVectors(C.a, C.b, kk); C.m.position.y += Math.sin(kk * Math.PI) * 9; C.m.rotation.y = kk * 4;
      }
    }

    /* =============== Hoả hoạn và dựng lại =============== */
    const fireFx = new Map();
    const scaffoldMat = mat('#a07a50');
    function syncFires(t) {
      for (const [id, o] of firmObj) {
        const f = firmOf(id);
        const down = f && f.alive && f.downUntil > world.day;
        const burning = down && world.day - (f.fireDay == null ? -99 : f.fireDay) <= 3;
        let fx = fireFx.get(id);
        if (!down) { if (fx) { o.g.remove(fx.group); fireFx.delete(id); } continue; }
        if (!fx) {
          const group = new THREE.Group(); o.g.add(group);
          const flames = [];
          for (let k = 0; k < 7; k++) { const s = new THREE.Sprite(additive(['#ff7a2f', '#ffb347', '#ff4d2e'][k % 3], 0)); s.position.set((Math.random() - 0.5) * 3, 2.4 + Math.random() * 1.6, (Math.random() - 0.5) * 2.2); group.add(s); flames.push(s); }
          const sc = new THREE.Group(); group.add(sc);
          for (const [x, z] of [[-2, -1.6], [2, -1.6], [-2, 1.6], [2, 1.6]]) mesh(box(0.12, 4.2, 0.12), scaffoldMat, x, 0, z, sc);
          for (const y of [1.4, 2.8]) { mesh(box(4.2, 0.1, 0.12), scaffoldMat, 0, y, -1.6, sc); mesh(box(4.2, 0.1, 0.12), scaffoldMat, 0, y, 1.6, sc); mesh(box(0.12, 0.1, 3.3), scaffoldMat, -2, y, 0, sc); mesh(box(0.12, 0.1, 3.3), scaffoldMat, 2, y, 0, sc); }
          fx = { group, flames, sc, smokeT: 0 };
          fireFx.set(id, fx);
        }
        fx.burning = burning;
        fx.sc.visible = !burning;
        for (let k = 0; k < fx.flames.length; k++) {
          const s = fx.flames[k];
          s.visible = burning;
          if (burning) { const fl = 0.6 + 0.4 * Math.sin(t * 0.02 + k * 2.1) * Math.sin(t * 0.013 + k); s.scale.setScalar(2.4 + fl * 2.2); s.material.opacity = 0.55 + 0.35 * fl; }
        }
        if (burning && !reduce) { fx.smokeT += 16; if (fx.smokeT > 110) { fx.smokeT = 0; const p = o.g.localToWorld(new THREE.Vector3((Math.random() - 0.5) * 2, 4.5, (Math.random() - 0.5) * 2)); puff(island.worldToLocal(p), true, '#3d3a38'); } }
      }
    }

    /* =============== Phụ đề =============== */
    let subUntil = 0;
    function showSub(st, ms) {
      const [label, color] = typeOf(st.type);
      const el = $('subtitle');
      el.innerHTML = '<span class="sk" style="color:' + color + '">Ngày ' + st.day + ' · ' + label + '</span><b>' + st.title + '</b><span class="st">' + st.text + '</span>';
      el.hidden = false; el.classList.remove('out'); void el.offsetWidth; el.classList.add('in');
      const hint = $('hint'); if (hint) hint.style.opacity = 0;
      subUntil = now() + (ms || TIER_HOLD[st.tier] || 6000);
    }
    function updateSub() { const el = $('subtitle'); if (!el.hidden && now() > subUntil) { el.classList.remove('in'); el.classList.add('out'); if (now() > subUntil + 500) el.hidden = true; } }

    /* =============== Biên niên sử =============== */
    const chron = [];
    let unread = 0;
    function chronItem(st) {
      const [label, color] = typeOf(st.type);
      return '<li class="t-' + st.tier + '"><button data-id="' + st.id + '"><i style="background:' + color + ';color:' + color + '"></i><span class="cd">Ngày ' + st.day + ' · ' + label + '</span><b>' + st.title + '</b><span class="ct">' + st.text + '</span></button></li>';
    }
    function renderChron() {
      const list = $('chronList');
      list.innerHTML = chron.length ? chron.map(chronItem).join('') : '<li class="empty">Thành phố chưa có chuyện gì để kể. Chờ một chút.</li>';
      unread = 0; badge();
    }
    function badge() { const b = $('chronBadge'); b.textContent = unread > 99 ? '99+' : unread; b.hidden = unread === 0; }
    function addChron(st) {
      chron.unshift(st); if (chron.length > 160) chron.pop();
      if (!$('chron').hidden) { $('chronList').insertAdjacentHTML('afterbegin', chronItem(st)); const li = $('chronList').querySelector('.empty'); if (li) li.remove(); while ($('chronList').children.length > 160) $('chronList').lastElementChild.remove(); }
      else if (st.tier !== 'small') { unread++; badge(); }
    }
    $('chronList').addEventListener('click', (e) => {
      const b = e.target.closest('button[data-id]'); if (!b) return;
      const st = chron.find((s) => s.id === +b.dataset.id); if (!st) return;
      goTo(st, true);
    });
    function goTo(st, manual) {
      const p = placePos(st.place);
      flyTo(p, TIER_DIST[st.tier] || 30);
      showSub(st, manual ? 9000 : null);
      if (manual) {
        pausedUntil = now() + 20000;
        if (st.place && st.place.kind === 'firm' && firmObj.has(st.place.id)) select({ type: 'firm', id: st.place.id }, true);
        else if (st.place && st.place.kind === 'house' && houses[st.place.id]) select({ type: 'house', i: st.place.id }, true);
        else if (st.place && st.place.kind === 'bank') select({ type: 'bank' }, true);
      }
    }

    /* =============== Đạo diễn =============== */
    let directorOn = true, holdUntil = 0, pausedUntil = 0, idleSince = now(), overview = false;
    const queue = [];
    function takeNext(minPri) {
      for (let i = queue.length - 1; i >= 0; i--) if (world.day - queue[i].day > TIER_AGE[queue[i].tier]) queue.splice(i, 1);
      let best = -1;
      for (let i = queue.length - 1; i >= 0; i--) {
        if (TIER_PRI[queue[i].tier] < minPri) continue;
        if (best < 0 || TIER_PRI[queue[i].tier] > TIER_PRI[queue[best].tier]) best = i;
      }
      return best < 0 ? null : queue.splice(best, 1)[0];
    }
    function updateDirector() {
      const n = now();
      if (n < holdUntil) return;
      if (!directorOn || n < pausedUntil) {
        const st = takeNext(2);
        if (st && n > subUntil) { showSub(st); holdUntil = n + 1500; }
        return;
      }
      const st = takeNext(1);
      if (st) { goTo(st, false); holdUntil = n + (TIER_HOLD[st.tier] || 6000); X.setAutoRotate(false); idleSince = n; overview = false; }
      else if (!overview && n - idleSince > 7000) { flyTo(new THREE.Vector3(0, 0, 0), 128); X.setAutoRotate(true); overview = true; }
    }

    /* =============== Gieo phát minh =============== */
    let seedMode = false;
    const halos = new Map();
    function setSeedMode(on) {
      seedMode = on;
      $('toolSeed').setAttribute('aria-pressed', String(on));
      document.body.classList.toggle('seeding', on);
      if (on) { X.closePanels(); select(null); toast('Chọn một xưởng hoặc cối xay để gieo hạt phát minh.', 3500); pausedUntil = now() + 30000; }
      for (const [, s] of halos) s.visible = on;
    }
    function updateHalos(t) {
      if (!seedMode) return;
      for (const [id, o] of firmObj) {
        let s = halos.get(id);
        if (!s) { s = new THREE.Sprite(additive('#ffd36b', 0)); s.scale.set(7, 7, 1); island.add(s); halos.set(id, s); }
        const f = firmOf(id); s.visible = !!(f && f.alive);
        s.position.set(o.g.position.x, 3.5, o.g.position.z);
        s.material.opacity = 0.35 + 0.25 * Math.sin(t * 0.005 + id);
      }
    }
    function updateSeedUi() {
      const wait = Math.max(0, world.seedReady - world.day);
      $('seedWait').textContent = wait ? 'Ủ lại · còn ' + wait + ' ngày' : 'Sẵn sàng';
      $('toolSeed').style.setProperty('--p', String(1 - wait / 40));
      $('toolSeed').classList.toggle('ready', !wait);
    }
    $('toolSeed').addEventListener('click', () => setSeedMode(!seedMode));
    function handlePick(sel) {
      if (!seedMode) return false;
      if (!sel || sel.type !== 'firm') { toast('Hãy chọn một xưởng hoặc một cối xay gió.', 2500); return true; }
      const r = Sim.seedInvention(world, sel.id);
      if (!r.ok) { toast(r.reason === 'wait' ? 'Hạt giống đang ủ lại, còn ' + r.wait + ' ngày nữa.' : 'Nơi này đã đóng cửa.', 3000); return true; }
      setSeedMode(false); updateSeedUi();
      const f = firmOf(sel.id), share = () => { const g = world.firms.filter((x) => x.alive && x.sector === f.sector); return f.avgSales / Math.max(1e-9, g.reduce((a, x) => a + x.avgSales, 0)); };
      const s0 = share(), p0 = f.price;
      flyTo(firmPos(sel.id), 34); pausedUntil = now() + 15000;
      dropSeed(sel.id, () => {
        inventFlash(sel.id, r.story.item);
        showSub(r.story, 9000);
        X.watch(60, () => !f.alive ? '<b>' + f.name + '</b> đã đóng cửa, dù từng được gieo hạt phát minh.' : 'Hai tháng sau hạt giống: <b>' + f.name + '</b> chiếm ' + Math.round(s0 * 100) + '% → <b>' + Math.round(share() * 100) + '%</b> lượng hàng bán ra, giá ' + p0.toFixed(1).replace('.', ',') + ' → <b>' + f.price.toFixed(1).replace('.', ',') + ' xu</b>.');
      });
      return true;
    }

    /* =============== Nhịp ngày và khung hình =============== */
    let lastId = world.storySeq;
    function onDay() {
      const fresh = Sim.storiesSince(world, lastId);
      if (fresh.length) lastId = fresh[fresh.length - 1].id;
      for (const st of fresh) {
        addChron(st);
        if (st.type === 'invention' && st.seeded) continue; // đã kể khi hạt giống chạm đất
        if (st.tier !== 'small' || Math.random() < 0.3) queue.push(st);
        if (st.type === 'invention') inventFlash(st.place.id, st.item);
        else if (st.type === 'fire' && audio) audio.crackle();
        else if (st.type === 'airship' && audio) audio.horn();
        else if (st.type === 'bankrun') label3d('Người dân kéo đến đòi tiền', new THREE.Vector3(bank.position.x, 14, bank.position.z), '#ff9b94');
        else if (st.type === 'fad-crash') { const p = placePos(st.place); flashAt(p, '#ff9f43', 16); label3d('Bong bóng vỡ', new THREE.Vector3(p.x, 11, p.z), '#ffb27a'); }
      }
      while (queue.length > 14) queue.shift();
      spreadArcs(); computeAuras(); sendCrates(); updateSeedUi();
    }
    let lastSlow = 0;
    function update(dt, t) {
      updateArcs(); updateAuras(t); updateFx(dt); updateShip(t, dt); updateSub(); updateDirector(); updateHalos(t); updateQueue(t);
      if (t - lastSlow > 250) { lastSlow = t; syncCrystals(t); syncFires(t); }
      else for (const [, c] of crystals) { c.g.rotation.y = t * 0.0012; }
      for (const [, fx] of fireFx) if (fx.burning) for (let k = 0; k < fx.flames.length; k++) { const s = fx.flames[k], fl = 0.6 + 0.4 * Math.sin(t * 0.02 + k * 2.1) * Math.sin(t * 0.013 + k); s.scale.setScalar(2.4 + fl * 2.2); s.material.opacity = 0.55 + 0.35 * fl; }
    }
    updateSeedUi(); computeAuras();

    return {
      onDay, update, handlePick, renderChron,
      userMoved() { pausedUntil = now() + 25000; overview = false; },
      setDirector(on) { directorOn = on; if (on) { pausedUntil = 0; holdUntil = 0; } },
      get director() { return directorOn; },
      get seedMode() { return seedMode; },
      setSeedMode, inventFlash, showSub, queue, chron, placePos,
    };
  }

  root.Story3D = { create };
})(typeof self !== 'undefined' ? self : this);
