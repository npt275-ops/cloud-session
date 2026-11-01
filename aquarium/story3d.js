/* Bể Kính — lớp hình ảnh của bộ máy câu chuyện, cho cả sáu miền đất.
 * Mỗi miền có một lớp riêng (makeLayer): sợi lan truyền, quầng sáng, tinh thể phát minh, khí cầu, lửa,
 * ký ức, đường mòn, mỏ vàng, trạm xá, lều người lạ... trong toạ độ của miền đó.
 * Người dẫn chuyện chung (create): phụ đề, biên niên sử, đạo diễn camera, công cụ của người giữ bể, chương năm. */
(function (root) {
  'use strict';

  const TYPE = {
    invention: ['Phát minh', '#ffd36b'], fad: ['Cơn sốt', '#ff6b9d'], 'fad-peak': ['Cơn sốt', '#ff6b9d'], 'fad-crash': ['Bong bóng vỡ', '#ff9f43'], 'fad-over': ['Cơn sốt', '#c9b6c0'],
    bankrun: ['Rút tiền ồ ạt', '#ff5a5a'], 'bankrun-end': ['Kho Bạc', '#9cc3ff'], rumor: ['Tin đồn', '#ff8a8a'],
    airship: ['Khí cầu', '#7bdff2'], 'airship-leave': ['Khí cầu', '#7bdff2'], fire: ['Hoả hoạn', '#ff7a2f'],
    bankrupt: ['Phá sản', '#d49a9a'], open: ['Khai trương', '#9be564'], job: ['Việc làm', '#9df0c4'], layoff: ['Mất việc', '#b9a3a3'],
    rich: ['Giàu lên', '#f2c14e'], hungry: ['Thiếu ăn', '#e58f8f'], copy: ['Học theo', '#e8d38a'],
    'epidemic-start': ['Dịch sốt', '#8fdc9a'], epidemic: ['Dịch sốt', '#8fdc9a'], 'epidemic-end': ['Dịch sốt', '#b9d8bd'],
    gold: ['Mạch vàng', '#ffd36b'], 'gold-rush': ['Cơn sốt vàng', '#ffd36b'], 'gold-farms': ['Mạch vàng', '#e0b060'], 'gold-imports': ['Hàng ngoại', '#e8c98a'], 'gold-end': ['Mạch vàng cạn', '#c9a35a'],
    ponzi: ['Người lạ', '#c3a6ff'], 'ponzi-grow': ['Người lạ', '#c3a6ff'], 'ponzi-flee': ['Bỏ trốn', '#a98bff'],
    strike: ['Đình công', '#ff7b6b'], 'strike-end': ['Đình công', '#e8a59d'], merger: ['Thâu tóm', '#e8c98a'], monopoly: ['Độc quyền', '#ffcf5a'], 'monopoly-end': ['Độc quyền', '#d9c58f'],
    wedding: ['Đám cưới', '#ffb3c7'], baby: ['Em bé', '#ffd1dc'], generation: ['Thế hệ mới', '#9df0c4'], immigrants: ['Người đến', '#7bdff2'],
    settle: ['Định cư', '#9df0c4'], era: ['Thời đại mới', '#ffd27a'], bridge: ['Cây cầu', '#c8b6ff'], trade: ['Buôn bán', '#e8c98a'], learn: ['Học hỏi', '#b6d7ff'], settlers: ['Nhập cư', '#7bdff2'],
    tap: ['Tiếng gõ', '#cfe8ff'], 'rumor-food': ['Tin đồn', '#f0b85a'], 'food-rush': ['Tích trữ', '#f0b85a'], 'food-rush-end': ['Tích trữ', '#c9b48a'], chapter: ['Chương mới', '#ffd27a'],
    season: ['Mùa', '#a6d6a0'], drought: ['Hạn hán', '#e0b060'], 'drought-end': ['Hạn hán', '#a6d6a0'], festival: ['Lễ hội', '#ffb36b'],
  };
  const TIER_PRI = { small: 1, major: 2, epic: 3 }, TIER_HOLD = { small: 4800, major: 7500, epic: 10000 }, TIER_DIST = { small: 26, major: 32, epic: 44 }, TIER_AGE = { small: 8, major: 24, epic: 45 };
  const typeOf = (t) => TYPE[t] || ['Chuyện', '#d9d4c7'];


  function makeLayer(X, N) {
    const { THREE, island, Sim, houses, firmObj, glowTex, mat, mesh, box, label3d, toast, puff, ripple, spawnMote, flyTo, select, audio, $, reduce, PLAZA, R, bank, C } = X;
    const W0 = X.W, CI = X.city;
    let world = W0.cities[CI].w; // thành phố của miền này (lớp chỉ được dựng khi miền đã có người)
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const lerp = (a, b, k) => a + (b - a) * k;
    const now = () => performance.now();
    const firmOf = (id) => world.firms.find((f) => f.id === id);
    const additive = (color, opacity) => new THREE.SpriteMaterial({ map: glowTex, color, transparent: true, opacity: opacity || 0, depthWrite: false, blending: THREE.AdditiveBlending });
    const bankName = () => Sim.ERAS[W0.cities[CI].era].bank;

    /* =============== Vị trí =============== */
    const DOCK_ANG = X.outAng + 1.75, outDir = new THREE.Vector3(Math.cos(DOCK_ANG), 0, Math.sin(DOCK_ANG));
    const dockHover = outDir.clone().multiplyScalar(R + 6.5).setY(7.5);
    function housePos(i) { const H = houses[i]; return H ? H.g.position : PLAZA; }
    function firmPos(id) { const o = firmObj.get(id); return o ? o.g.position : null; }
    function placePos(place) {
      if (!place) return PLAZA;
      if (place.kind === 'house') return housePos(place.id);
      if (place.kind === 'firm') return firmPos(place.id) || PLAZA;
      if (place.kind === 'bank') return bank.position;
      if (place.kind === 'dock') return dockHover.clone().setY(0).addScaledVector(outDir, -4);
      if (place.kind === 'mine') return X.minePos;
      if (place.kind === 'ponzi') return ponziPos;
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
      const of = (k, n) => list.filter((s) => s.kind === k).slice(0, n);
      const pick = [...of('fear', 14), ...of('hype', 14), ...of('food', 12), ...of('sick', 12), ...of('greed', 10)];
      const COL = { fear: '#ff5a5a', food: '#f0b85a', sick: '#8fdc9a', greed: '#c3a6ff' };
      for (const s of pick) spawnArc(housePos(Math.floor(s.from / 4)), housePos(Math.floor(s.to / 4)), COL[s.kind] || (fad ? fad.color : '#ffd166'));
    }

    /* =============== Quầng sáng trên mái: nhà đang sợ, nhà đang mê =============== */
    const auras = [];
    function computeAuras() {
      while (auras.length < houses.length) { const s = new THREE.Sprite(additive('#ff5a5a')); s.scale.set(3.4, 3.4, 1); island.add(s); auras.push({ s, level: 0, target: 0 }); }
      const fad = Sim.activeFad(world);
      for (let i = 0; i < houses.length; i++) {
        const c = { fear: 0, hype: 0, food: 0, sick: 0 };
        for (let k = 0; k < 4; k++) { const h = world.households[i * 4 + k]; if (!h) continue; if (h.fear > 0) c.fear++; if (fad && h.hype === fad.id) c.hype++; if (h.foodRumor > 0) c.food++; if (h.sick > 0) c.sick++; }
        const A = auras[i], top = Object.keys(c).reduce((a, b) => (c[b] > c[a] ? b : a), 'fear');
        A.target = c[top] / 4;
        A.s.material.color.set({ fear: '#ff4d4d', food: '#f0b85a', sick: '#8fdc9a', hype: fad ? fad.color : '#ffd166' }[top]);
      }
    }
    function updateAuras(t) {
      for (let i = 0; i < auras.length; i++) {
        const A = auras[i], H = houses[i];
        if (!H) continue;
        A.level += (A.target - A.level) * 0.08;
        A.s.position.set(H.g.position.x, ((H.g.userData.top || 6) + 1.1) * H.g.scale.y, H.g.position.z);
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
          o.g.add(g); c = { g, n, parent: o.g, base: (o.g.userData.top || 5) + 1.4 };
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
      dock.visible = a.visits > 0 || a.called;
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
        if (fx && fx.group.parent !== o.g) { fireFx.delete(id); fx = null; } // công trình vừa được xây lại theo thời đại mới
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

    /* =============== Công cụ của người giữ bể, phần xảy ra trên miền này =============== */
    const halos = new Map();
    function wants(sel) {
      const mode = N.mode;
      if (!mode) return false;
      if (mode === 'tap') return true;
      if (!sel) return false;
      if (mode === 'seed') return sel.type === 'firm';
      if (mode === 'whisper-fad') { const f = sel.type === 'firm' && firmOf(sel.id); return !!(f && f.alive && f.sector === 'goods'); }
      return sel.type === 'house';
    }
    function haloAt(key, p, size, y) {
      let sp = halos.get(key);
      if (!sp) { sp = new THREE.Sprite(additive('#ffd36b', 0)); island.add(sp); halos.set(key, sp); }
      sp.scale.set(size, size, 1); sp.position.set(p.x, y, p.z);
      return sp;
    }
    function hideHalos() { for (const [, sp] of halos) sp.visible = false; }
    function updateHalos(t) {
      const mode = N.mode;
      if (!mode || mode === 'tap') { if (halos.size) hideHalos(); return; }
      const color = mode === 'seed' ? '#ffd36b' : mode === 'whisper-bank' ? '#ff6b6b' : mode === 'whisper-food' ? '#f0b85a' : '#ff6b9d';
      if (mode === 'seed' || mode === 'whisper-fad') {
        for (const [, sp] of halos) sp.visible = false;
        for (const [id, o] of firmObj) {
          const f = firmOf(id), sp = haloAt('f' + id, o.g.position, 7, 3.5);
          sp.visible = !!(f && f.alive && !o.dying && (mode === 'seed' || f.sector === 'goods'));
          sp.material.color.set(color); sp.material.opacity = 0.35 + 0.25 * Math.sin(t * 0.005 + id);
        }
      } else {
        for (const [, sp] of halos) sp.visible = false;
        houses.forEach((H, i) => { const sp = haloAt('h' + i, H.g.position, 4.4, 2.6); sp.visible = true; sp.material.color.set(color); sp.material.opacity = 0.2 + 0.14 * Math.sin(t * 0.005 + i); });
      }
    }
    // kể ngay những chuyện vừa sinh ra sau khi người giữ bể ra tay
    function tellNow(type) {
      const fresh = ingest(), st = fresh.filter((x) => x.type === type).pop();
      if (st) N.dequeue(st);
      return st;
    }

    /* ----- Gieo phát minh ----- */
    function doSeed(sel) {
      const r = Sim.seedInvention(world, sel.id);
      if (!r.ok) { toast(r.reason === 'wait' ? 'Hạt giống của ' + X.cityName + ' đang ủ lại, còn ' + r.wait + ' ngày nữa.' : 'Nơi này đã đóng cửa.', 3000); return true; }
      N.setMode(null);
      const f = firmOf(sel.id), share = () => { const g = world.firms.filter((x) => x.alive && x.sector === f.sector); return f.avgSales / Math.max(1e-9, g.reduce((a, x) => a + x.avgSales, 0)); };
      const s0 = share(), p0 = f.price;
      flyTo(firmPos(sel.id), 34); N.pause(15000);
      r.story.city = CI;
      dropSeed(sel.id, () => {
        inventFlash(sel.id, r.story.item);
        N.showSub(r.story, 9000);
        X.watch(60, () => !f.alive ? '<b>' + f.name + '</b> đã đóng cửa, dù từng được gieo hạt phát minh.' : 'Hai tháng sau hạt giống: <b>' + f.name + '</b> chiếm ' + Math.round(s0 * 100) + '% → <b>' + Math.round(share() * 100) + '%</b> lượng hàng bán ra, giá ' + p0.toFixed(1).replace('.', ',') + ' → <b>' + f.price.toFixed(1).replace('.', ',') + ' xu</b>.');
      });
      return true;
    }

    /* ----- Gõ vào kính: vòm kính là chung, nhưng tiếng gõ làm giật mình người ở miền ngay bên dưới ----- */
    const CEN = X.center, DOME = X.dome;
    const domeWorld = (lp) => { const x = lp.x + CEN.x, z = lp.z + CEN.z; return new THREE.Vector3(x, Math.sqrt(Math.max(4, DOME * DOME - x * x - z * z)), z); };
    const ringGeo = new THREE.RingGeometry(0.9, 1, 64), glassFx = [];
    let shake = null;
    function glassRipple(p, level) {
      const qw = domeWorld(p), n = qw.clone().normalize(), q = qw.clone().sub(CEN);
      for (let k = 0; k < 1 + level; k++) {
        const m = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: level >= 3 ? '#ffd2d2' : '#e8f8ff', transparent: true, opacity: 0, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false }));
        m.position.copy(q); m.lookAt(qw.clone().add(n)); island.add(m);
        glassFx.push({ m, t0: now() + k * 170, dur: 1300 + level * 350, size: 7 + level * 4.5, kind: 'ring' });
      }
      const fl = new THREE.Sprite(additive('#ffffff', 1)); fl.position.copy(q); island.add(fl);
      glassFx.push({ m: fl, t0: now(), dur: 700, size: 10 + level * 5, kind: 'flash' });
      if (level < 3) return;
      // vết rạn toả ra trên mặt kính, mờ dần sau vài giây
      const t1 = new THREE.Vector3().crossVectors(n, new THREE.Vector3(0, 1, 0.01)).normalize(), t2 = new THREE.Vector3().crossVectors(n, t1).normalize();
      for (let k = 0; k < 5 + level * 2; k++) {
        const a = (k / (5 + level * 2)) * Math.PI * 2 + Math.random() * 0.4, pts = [q.clone()];
        let cur = qw.clone(), dir = t1.clone().multiplyScalar(Math.cos(a)).addScaledVector(t2, Math.sin(a));
        for (let j = 0; j < 4; j++) {
          dir.applyAxisAngle(n, (Math.random() - 0.5) * 0.8);
          cur = cur.clone().addScaledVector(dir, 1.6 + Math.random() * 2.2 * (level - 1)).setLength(DOME - 0.05);
          pts.push(cur.clone().sub(CEN));
        }
        const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.9, depthWrite: false }));
        island.add(line);
        glassFx.push({ m: line, t0: now(), dur: 3600 + level * 900, kind: 'crack' });
      }
    }
    function updateGlass() {
      const n = now();
      for (let i = glassFx.length - 1; i >= 0; i--) {
        const G = glassFx[i], k = (n - G.t0) / G.dur;
        if (k < 0) continue;
        if (k >= 1) { island.remove(G.m); if (G.m.geometry !== ringGeo && G.kind !== 'flash') G.m.geometry.dispose(); G.m.material.dispose(); glassFx.splice(i, 1); continue; }
        if (G.kind === 'ring') { G.m.scale.setScalar(0.5 + k * G.size); G.m.material.opacity = 0.85 * (1 - k); }
        else if (G.kind === 'flash') { G.m.scale.setScalar(2 + k * G.size); G.m.material.opacity = 1 - k; }
        else G.m.material.opacity = 0.9 * (1 - k * k);
      }
      if (shake) {
        const k = (n - shake.t0) / 650;
        if (k >= 1 || reduce) { island.position.copy(CEN); shake = null; }
        else { const a = shake.amp * (1 - k); island.position.set(CEN.x + (Math.random() - 0.5) * a, CEN.y + (Math.random() - 0.5) * a * 0.5, CEN.z + (Math.random() - 0.5) * a); }
      }
    }
    function doTap(p) {
      const ids = [];
      houses.forEach((H, i) => { if (Math.hypot(H.g.position.x - p.x, H.g.position.z - p.z) < 12) for (let k = 0; k < 4; k++) if (world.households[i * 4 + k]) ids.push(i * 4 + k); });
      const r = Sim.tapGlass(world, ids);
      if (!r.ok) { toast('Vòm kính còn đang rung. Sang ngày mới mới gõ tiếp được.', 2200); return; }
      glassRipple(p, r.level);
      shake = { t0: now(), amp: 0.1 + r.level * 0.12 };
      if (audio) audio.knock(r.level);
      const q = domeWorld(p).sub(CEN);
      let shown = 0;
      for (let i = 0; i < world.households.length && shown < 26; i++) { const h = world.households[i]; if (h.fear > 0 && (ids.includes(i) || r.level >= 3) && Math.random() < 0.6) { spawnArc(q, housePos(Math.floor(i / 4)), '#ff5a5a'); shown++; } }
      const st = tellNow('tap');
      if (st) N.showSub(st, 6500);
      computeAuras();
    }

    /* ----- Thì thầm tin đồn ----- */
    let rumorWatch = null;
    function whisperFx(p, color, text) {
      ripple(p, color);
      for (let k = 0; k < 18; k++) { const a = (k / 18) * Math.PI * 4; spawnMote(new THREE.Vector3(p.x + Math.cos(a) * 6, 14 + k * 0.3, p.z + Math.sin(a) * 6), new THREE.Vector3(p.x, 3, p.z), color, 1300 + k * 40); }
      label3d(text, new THREE.Vector3(p.x, 9, p.z), color);
    }
    function doWhisper(kind, sel) {
      const r = Sim.whisper(world, kind, kind === 'fad' ? sel.id : sel.i);
      if (!r.ok) { toast(r.reason === 'wait' ? 'Ở ' + X.cityName + ', còn ' + r.wait + ' ngày nữa mới thì thầm tiếp được.' : r.reason === 'fad' ? 'Thành phố đang có một cơn sốt rồi. Chờ nó qua đã.' : 'Không thì thầm được ở đây.', 3200); return true; }
      N.setMode(null);
      const p = kind === 'fad' ? firmPos(sel.id) : housePos(sel.i);
      flyTo(p, 30); N.pause(14000);
      whisperFx(p, kind === 'bank' ? '#ff6b6b' : kind === 'food' ? '#f0b85a' : r.fad.color, kind === 'bank' ? '“' + bankName() + ' sắp vỡ…”' : kind === 'food' ? '“Sắp mất mùa…”' : '“' + r.item + '…”');
      if (audio) audio.whisper();
      const st = tellNow(kind === 'fad' ? 'fad' : kind === 'food' ? 'rumor-food' : 'rumor');
      if (st) N.showSub(st, 8000);
      const day0 = world.day;
      if (kind === 'bank') { rumorWatch = { kind, peak: 0 }; const Wt = rumorWatch; X.watch(25, () => world.stories.some((x) => x.type === 'bankrun' && x.day > day0) ? 'Lời thì thầm ở ' + X.cityName + ' đã thành <b>đám đông kéo đến đòi tiền</b>.' : 'Hai mươi lăm ngày sau lời thì thầm: nỗi sợ ở ' + X.cityName + ' lan tới nhiều nhất <b>' + Math.round(Wt.peak * 100) + '%</b> dân rồi tự tắt.'); }
      else if (kind === 'food') { rumorWatch = { kind, peak: 0 }; const Wt = rumorWatch, food = () => world.firms.filter((f) => f.alive && f.sector === 'food'), price = () => food().reduce((t, f) => t + f.price, 0) / Math.max(1, food().length), p0 = price(); X.watch(20, () => 'Hai mươi ngày sau lời thì thầm: tin mất mùa ở ' + X.cityName + ' lan tới <b>' + Math.round(Wt.peak * 100) + '%</b> dân, giá lương thực ' + p0.toFixed(1).replace('.', ',') + ' → <b>' + price().toFixed(1).replace('.', ',') + ' xu</b>.'); }
      else X.watch(30, () => { const f = r.fad; return 'Cơn sốt ' + f.item.toLowerCase() + ' từ lời thì thầm: <b>' + Math.round(f.peakShare * 100) + '%</b> dân từng mê, giá lên gấp <b>' + f.maxRatio.toFixed(1).replace('.', ',') + '</b> lần.'; });
      return true;
    }

    /* ----- Gọi khí cầu ----- */
    function callAirship() {
      if (W0.cities[CI].era < 3) { toast(X.cityName + ' còn ở thời ' + Sim.ERAS[W0.cities[CI].era].name.toLowerCase() + '. Khí cầu chỉ bay tới những thành phố từ thời cận đại.', 4200); return; }
      const r = Sim.callAirship(world);
      if (!r.ok) { toast(r.reason === 'docked' ? 'Khí cầu đang neo ở bến ' + X.cityName + ' rồi.' : 'Đèn hiệu trên bến còn nóng, ' + r.wait + ' ngày nữa mới thắp lại được.', 3000); return; }
      N.setMode(null);
      dock.visible = true;
      flyTo(dock.position, 38); N.pause(12000);
      toast('Đèn hiệu trên bến ' + X.cityName + ' đã thắp. Đoàn thương nhân sẽ đến vào ngày mai.', 4200);
      if (audio) audio.chime();
      const in0 = world.ledger.inflow;
      X.watch(40, () => 'Chuyến khí cầu được gọi đã mang về cho ' + X.cityName + ' <b>' + Math.round(world.ledger.inflow - in0).toLocaleString('vi-VN') + ' xu</b> từ bên ngoài.');
    }

    /* ----- Đám đông trước nơi giữ tiền khi nỗi sợ lan rộng ----- */
    const CROWD = 40, crowdB = new THREE.InstancedMesh(X.people.bodyGeo, new THREE.MeshStandardMaterial({ flatShading: true, roughness: 0.8 }), CROWD), crowdH = new THREE.InstancedMesh(X.people.headGeo, X.people.headMat, CROWD);
    for (let i = 0; i < CROWD; i++) crowdB.setColorAt(i, C(X.people.shirts[(i * 7) % X.people.shirts.length]));
    for (const m of [crowdB, crowdH]) { m.castShadow = true; m.frustumCulled = false; island.add(m); }
    let panicLv = 0;
    const toPl = new THREE.Vector3(-bank.position.x, 0, -bank.position.z).normalize(), crowdAng = Math.atan2(toPl.z, toPl.x);
    function updateBankCrowd(t) {
      const target = Math.max(world.phen.panic > 0 ? 1 : 0, clamp(((world.fearShare || 0) - 0.1) / 0.2, 0, 1));
      panicLv += (target - panicLv) * 0.03;
      const show = panicLv > 0.02; crowdB.visible = crowdH.visible = show;
      if (!show) return;
      for (let i = 0; i < CROWD; i++) {
        const row = Math.floor(i / 10), col = i % 10, a = crowdAng + (col - 4.5) * 0.17, r = 4.4 + row * 0.85;
        if (panicLv < (i / CROWD) * 0.9 + 0.05) { qd.position.set(0, -80, 0); qd.scale.setScalar(0.001); }
        else { const jig = reduce ? 0 : Math.sin(t * 0.008 + i * 1.7) * 0.06; qd.position.set(bank.position.x + Math.cos(a) * r + jig, 0.31 + Math.abs(Math.sin(t * 0.006 + i)) * 0.05, bank.position.z + Math.sin(a) * r); qd.scale.setScalar(1); }
        qd.updateMatrix(); crowdB.setMatrixAt(i, qd.matrix);
        qd.position.y += 0.47; qd.updateMatrix(); crowdH.setMatrixAt(i, qd.matrix);
      }
      crowdB.instanceMatrix.needsUpdate = crowdH.instanceMatrix.needsUpdate = true;
    }

    /* =============== Ký ức: tượng, tàn tích, Đảo Đồ Cũ =============== */
    const memo3d = new Map(); // id ký ức -> { g, kind, pos }
    const exitAng = (X.plazaExits || []).map((e) => Math.atan2(e.z - PLAZA.z, e.x - PLAZA.x));
    const statueSlots = [];
    for (const [r, n, off] of [[5.2, 14, 0], [6.35, 18, 0.09]]) for (let k = 0; k < n; k++) {
      const a = (k / n) * Math.PI * 2 + off;
      if (exitAng.every((e) => Math.abs(Math.atan2(Math.sin(a - e), Math.cos(a - e))) > 0.34)) statueSlots.push({ a, r, used: 0 });
    }
    const stoneMat = mat('#d3c8b2'), bronzeMat = mat('#a9824f', { metalness: 0.65, roughness: 0.35 }), plaqueMat = mat('#4b4238');
    function buildStatue(m) {
      let slot = statueSlots.find((x) => !x.used);
      if (!slot) { // hết chỗ: tượng cũ nhất nhường chỗ
        let old = null; for (const [id, o] of memo3d) if (o.kind === 'statue' && (!old || id < old[0])) old = [id, o];
        if (!old) return null;
        island.remove(old[1].g); X.unclickable(old[1].g); memo3d.delete(old[0]); slot = old[1].slot; slot.used = 0;
      }
      slot.used = m.id;
      const g = new THREE.Group(); g.position.set(PLAZA.x + Math.cos(slot.a) * slot.r, 0.12, PLAZA.z + Math.sin(slot.a) * slot.r); g.rotation.y = Math.PI / 2 - slot.a;
      mesh(box(0.9, 0.62, 0.9), stoneMat, 0, 0, 0, g); mesh(box(1.06, 0.12, 1.06), stoneMat, 0, 0.62, 0, g);
      mesh(new THREE.CylinderGeometry(0.16, 0.27, 0.86, 7), bronzeMat, 0, 0.74 + 0.43, 0, g);
      mesh(new THREE.SphereGeometry(0.19, 8, 6), bronzeMat, 0, 1.8, 0, g);
      const arm = mesh(box(0.1, 0.56, 0.1), bronzeMat, 0.17, 1.42, 0, g); arm.rotation.z = -0.45;
      mesh(new THREE.OctahedronGeometry(0.17, 0), new THREE.MeshStandardMaterial({ color: '#fff3c4', emissive: m.sector === 'food' ? '#8fdc5c' : '#ffc94d', emissiveIntensity: 1.2, flatShading: true }), 0.42, 2.08, 0, g);
      mesh(box(0.52, 0.26, 0.04), plaqueMat, 0, 0.2, 0.46, g).castShadow = false;
      island.add(g); X.clickable(g, { type: 'memo', id: m.id });
      return { g, kind: 'statue', slot, rise: 0 };
    }
    const ruinStone = mat('#8f8373'), ruinDark = mat('#51473f'), charMat = mat('#3a3330'), deadPlot = mat('#8a7a5a');
    function buildRuin(m, seen) {
      const g = new THREE.Group(); g.position.copy(seen.pos); g.rotation.y = seen.rot;
      if (seen.kind === 'shop') {
        mesh(box(3.6, 0.95, 0.3), ruinStone, 0, 0, -1.15, g); mesh(box(0.3, 1.55, 2.6), ruinStone, -1.65, 0, 0, g); mesh(box(1.3, 0.55, 0.3), ruinStone, 1.1, 0, 1.15, g); mesh(box(0.3, 0.8, 1.0), ruinDark, 1.65, 0, -0.6, g);
        const roofPiece = mesh(new THREE.CylinderGeometry(1.35, 1.35, 1.7, 10, 1, true, 0, Math.PI * 0.55), new THREE.MeshStandardMaterial({ color: '#4d4740', flatShading: true, roughness: 0.9, side: THREE.DoubleSide }), 0.4, 0.5, 0.2, g); roofPiece.rotation.set(0.3, 0.5, Math.PI / 2 + 0.45);
        const chim = mesh(new THREE.CylinderGeometry(0.28, 0.38, 3.2, 8), charMat, 0.9, 0.36, 0.1, g); chim.rotation.set(Math.PI / 2, 0, 0.7);
      } else {
        mesh(new THREE.CylinderGeometry(0.72, 1.05, 1.5, 8), ruinStone, 0, 0.75, -1.4, g);
        const b1 = mesh(box(0.66, 0.05, 2.6), mat('#d9d2c2'), 0.9, 0.02, 0.4, g); b1.rotation.y = 0.7;
        const b2 = mesh(box(0.11, 0.09, 3.0), mat('#6d4c35'), -0.7, 0.02, 0.8, g); b2.rotation.y = -0.4;
        for (const cx of [-1.15, 1.15]) mesh(box(2.0, 0.12, 3.0), deadPlot, cx, 0, 1.5, g).castShadow = false;
      }
      for (let k = 0; k < 8; k++) mesh(new THREE.DodecahedronGeometry(0.16 + Math.random() * 0.22, 0), k % 2 ? ruinStone : ruinDark, (Math.random() - 0.5) * 3.2, 0.1, (Math.random() - 0.5) * 2.6, g);
      island.add(g); X.clickable(g, { type: 'memo', id: m.id });
      for (let k = 0; k < 6; k++) puff(new THREE.Vector3(seen.pos.x + (Math.random() - 0.5) * 3, 1 + Math.random(), seen.pos.z + (Math.random() - 0.5) * 3), true, '#9a8f84');
      return { g, kind: 'ruin', pos: seen.pos.clone() };
    }
    // Đảo Đồ Cũ: hòn đảo nhỏ lơ lửng cạnh rìa, nơi đồ của những cơn sốt đã qua bị bỏ lại
    const JA = X.outAng - 0.62, junk = new THREE.Group();
    junk.position.set(Math.cos(JA) * (R + 8), -1.6, Math.sin(JA) * (R + 8)); junk.visible = false; island.add(junk);
    (function buildJunk() {
      const rock = mesh(new THREE.DodecahedronGeometry(4.3, 0), mat('#7b6a58'), 0, -2.7, 0, junk); rock.scale.set(1.25, 0.8, 1.1);
      mesh(new THREE.CylinderGeometry(4.7, 4.1, 0.6, 9), mat('#86b86a'), 0, -0.3, 0, junk);
      mesh(new THREE.CylinderGeometry(0.07, 0.09, 2.2, 5), mat('#6d5139'), -3.3, 1.1, 1.6, junk);
      const sign = mesh(box(1.9, 0.6, 0.08), mat('#9b7653'), -3.3, 1.75, 1.6, junk); sign.rotation.y = 0.5;
      const cv = document.createElement('canvas'); cv.width = 256; cv.height = 80;
      const c2 = cv.getContext('2d'); c2.fillStyle = '#9b7653'; c2.fillRect(0, 0, 256, 80); c2.fillStyle = '#fff3d6'; c2.font = '600 34px Outfit, "Segoe UI", sans-serif'; c2.textAlign = 'center'; c2.textBaseline = 'middle'; c2.fillText('Đảo Đồ Cũ', 128, 42);
      const face = new THREE.Mesh(new THREE.PlaneGeometry(1.86, 0.56), new THREE.MeshStandardMaterial({ map: new THREE.CanvasTexture(cv), roughness: 0.9 }));
      face.position.set(0, 0.3, 0.045); sign.add(face);
    })();
    const junkSlots = [0, 1, 2, 3, 4, 5, 6].map((k) => ({ a: k * 0.95 + 0.4, r: k ? 2.4 : 0.4 }));
    function buildPile(m, idx) {
      const slot = junkSlots[idx % junkSlots.length], g = new THREE.Group();
      g.position.set(Math.cos(slot.a) * slot.r, 0, Math.sin(slot.a) * slot.r); g.scale.setScalar(1.45); junk.add(g); junk.visible = true;
      const c = m.color || '#ff6b9d', n = clamp(6 + Math.round((m.units || 0) / 3), 8, 22);
      const coneM = new THREE.MeshStandardMaterial({ color: c, flatShading: true, roughness: 0.7 }), dark = new THREE.MeshStandardMaterial({ color: new THREE.Color(c).multiplyScalar(0.6), flatShading: true, roughness: 0.8 });
      for (let k = 0; k < n; k++) {
        const a = Math.random() * Math.PI * 2, r = Math.random() * 1.1, h = (1 - r / 1.3) * 0.9;
        const it = mesh(k % 3 ? new THREE.ConeGeometry(0.42, 0.22, 8) : new THREE.BoxGeometry(0.34, 0.3, 0.34), k % 2 ? coneM : dark, Math.cos(a) * r, h, Math.sin(a) * r, g);
        it.rotation.set((Math.random() - 0.5) * 2.4, Math.random() * 3, (Math.random() - 0.5) * 2.4);
      }
      X.clickable(g, { type: 'memo', id: m.id });
      return { g, kind: 'pile' };
    }
    const lastSeen = new Map(); // id doanh nghiệp -> vị trí lô đất lần cuối nhìn thấy
    let pileCount = 0;
    function syncMemories(animate) {
      for (const [id, o] of firmObj) if (!o.dying) lastSeen.set(id, { pos: o.g.position.clone(), rot: o.g.rotation.y, kind: o.kind });
      for (const m of world.memorials) {
        if (memo3d.has(m.id) || m.skip) continue;
        let o = null;
        if (m.kind === 'statue') { if (!m.seeded && m.id % 3) { m.skip = true; continue; } o = buildStatue(m); }
        else if (m.kind === 'pile') o = buildPile(m, pileCount++);
        else if (m.kind === 'ruin') {
          if (firmObj.has(m.firmId)) continue; // còn đang sập dần
          const seen = lastSeen.get(m.firmId);
          if (!seen) { m.skip = true; continue; }
          for (const [id, x] of memo3d) if (x.kind === 'ruin' && x.pos.distanceTo(seen.pos) < 1) { island.remove(x.g); X.unclickable(x.g); memo3d.delete(id); } // tàn tích mới đè lên tàn tích cũ
          o = buildRuin(m, seen);
        }
        if (!o) { m.skip = true; continue; }
        if (animate && o.kind === 'statue') { o.rise = 0.001; o.g.scale.y = 0.001; ripple(o.g.position, '#ffd36b'); }
        memo3d.set(m.id, o);
      }
      // xưởng mới dựng trên nền cũ thì dọn tàn tích đi
      for (const [id, x] of memo3d) {
        if (x.kind !== 'ruin') continue;
        for (const [, o] of firmObj) if (!o.dying && o.g.position.distanceTo(x.pos) < 1) { island.remove(x.g); X.unclickable(x.g); memo3d.delete(id); for (let k = 0; k < 5; k++) puff(new THREE.Vector3(x.pos.x + (Math.random() - 0.5) * 3, 1, x.pos.z + (Math.random() - 0.5) * 3), false, '#d8cbb3'); break; }
      }
    }
    function memoOf(id) { return world.memorials.find((m) => m.id === id); }
    function memoCard(id) {
      const m = memoOf(id); if (!m) return null;
      if (m.kind === 'statue') return { kind: 'Tượng nhà phát minh · năm ' + m.year, title: 'Tượng ' + Sim.nameOf(m.inventor), text: 'Dựng ở quảng trường để nhớ ngày ' + Sim.nameOf(m.inventor) + ' nghĩ ra ' + m.item.toLowerCase() + ' ở ' + m.firmName + '.' + (m.seeded ? ' Hạt giống phát minh do người giữ bể gieo xuống.' : ''), list: [['Phát minh', m.item], ['Nơi làm ra', m.firmName], ['Ngày', 'Ngày ' + m.day]] };
      if (m.kind === 'ruin') return { kind: 'Tàn tích · năm ' + m.year, title: m.name, text: (m.workers ? 'Nơi này từng có ' + m.workers + ' người làm việc. ' : '') + 'Đóng cửa ngày ' + m.day + (m.debt ? ', để lại ' + m.debt.toLocaleString('vi-VN') + ' xu nợ cho Kho Bạc.' : '.') + ' Khi có người mở xưởng mới ở đây, tàn tích sẽ được dọn đi.', list: [] };
      if (m.kind === 'pile') return { kind: 'Đảo Đồ Cũ · năm ' + m.year, title: 'Đống ' + m.item.toLowerCase(), text: 'Bị bỏ lại sau khi bong bóng ' + m.item.toLowerCase() + ' vỡ. Ai cũng từng muốn có một chiếc, rồi chẳng ai cần nữa.', list: [['Số món bị bỏ', String(m.units)], ['Nơi làm ra', m.firmName], ['Ngày vỡ', 'Ngày ' + m.day]] };
      return null;
    }
    function memoPos(id) {
      const o = memo3d.get(id); if (!o) return null;
      if (o.kind === 'pile') return junk.position.clone();
      return o.g.position.clone();
    }
    function updateMemories(dt, t) {
      for (const [, o] of memo3d) if (o.rise > 0 && o.rise < 1) { o.rise = Math.min(1, o.rise + dt / 1600); o.g.scale.y = 1 - Math.pow(1 - o.rise, 3); }
      if (junk.visible) { junk.position.y = -1.6 + (reduce ? 0 : Math.sin(t * 0.0007) * 0.35); junk.rotation.y = reduce ? 0 : Math.sin(t * 0.0002) * 0.1; }
    }

    /* =============== Đường mòn: lối đi tự hình thành từ những bước chân =============== */
    const WEAR = 512, wearCv = document.createElement('canvas'); wearCv.width = wearCv.height = WEAR;
    const wctx = wearCv.getContext('2d'), wearTex = new THREE.CanvasTexture(wearCv);
    const wearMesh = new THREE.Mesh(new THREE.PlaneGeometry(2 * R, 2 * R), new THREE.MeshStandardMaterial({ map: wearTex, transparent: true, opacity: 0.42, roughness: 1, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }));
    wearMesh.rotation.x = -Math.PI / 2; wearMesh.position.y = 0.02; wearMesh.receiveShadow = true; wearMesh.renderOrder = -1; island.add(wearMesh);
    const px = (v) => ((v + R) / (2 * R)) * WEAR;
    let wearN = 0, wearDirty = false, lastWear = 0;
    function wearDay() {
      wctx.strokeStyle = 'rgba(120, 98, 70, 0.0045)'; wctx.lineWidth = 2.0; wctx.lineCap = 'round'; wctx.lineJoin = 'round';
      const hs = world.households;
      for (let i = 0; i < hs.length; i++) {
        const h = hs[i];
        const pts = h.employer !== null ? X.walkPath(h) : i % 3 === 0 ? [housePos(Math.floor(i / 4)), PLAZA] : null;
        if (!pts) continue;
        const jx = ((i * 7) % 5 - 2) * 0.13, jz = ((i * 3) % 5 - 2) * 0.13;
        wctx.beginPath();
        pts.forEach((p, k) => { const x = px(p.x + jx), y = px(p.z + jz); if (k) wctx.lineTo(x, y); else wctx.moveTo(x, y); });
        wctx.stroke();
      }
      // cỏ mọc lại trên những lối không ai đi nữa
      if (++wearN % 10 === 0) { wctx.globalCompositeOperation = 'destination-out'; wctx.fillStyle = 'rgba(0,0,0,0.1)'; wctx.fillRect(0, 0, WEAR, WEAR); wctx.globalCompositeOperation = 'source-over'; }
      wearDirty = true;
    }

    /* =============== Mốc 3: Đồi Mây, trạm xá, lều người lạ, đình công, độc quyền, đám cưới =============== */
    // --- Tháp giếng mỏ trên Đồi Mây
    const minePos = X.minePos, mineG = new THREE.Group();
    mineG.position.copy(minePos); mineG.rotation.y = Math.atan2(minePos.x, minePos.z); mineG.visible = false; island.add(mineG);
    const wood = mat('#7a5638'), darkWood = mat('#4e3a2a'), goldMat = new THREE.MeshStandardMaterial({ color: '#fff1b0', emissive: '#ffc23d', emissiveIntensity: 1.1, flatShading: true, roughness: 0.3, metalness: 0.4 });
    const mineParts = { wheel: null, crystals: [], bucket: null, glow: null };
    (function buildMine() {
      mesh(new THREE.CylinderGeometry(3.9, 4.3, 0.5, 9), mat('#9b8a72'), 0, 0.25, 0, mineG).castShadow = false; // nền đá
      const hole = mesh(new THREE.CylinderGeometry(1.1, 1.1, 0.12, 12), mat('#1d1712'), 0, 0.52, 0.6, mineG); hole.castShadow = false;
      for (const sx of [-1, 1]) { const leg = mesh(box(0.22, 5.4, 0.22), wood, sx * 1.15, 0.5, 0.6, mineG); leg.rotation.z = -sx * 0.14; const leg2 = mesh(box(0.22, 5.2, 0.22), wood, sx * 1.15, 0.5, -0.6, mineG); leg2.rotation.z = -sx * 0.14; }
      mesh(box(2.0, 0.22, 1.6), wood, 0, 5.7, 0, mineG);
      const wheel = new THREE.Group(); wheel.position.set(0, 6.25, 0); mineG.add(wheel); mineParts.wheel = wheel;
      mesh(new THREE.TorusGeometry(0.75, 0.08, 6, 18), darkWood, 0, 0, 0, wheel);
      for (let k = 0; k < 4; k++) { const sp = mesh(box(0.08, 1.5, 0.08), darkWood, 0, -0.75, 0, wheel); sp.geometry = new THREE.BoxGeometry(0.08, 1.5, 0.08); sp.position.set(0, 0, 0); sp.rotation.z = (k * Math.PI) / 4; }
      const bucket = mesh(new THREE.CylinderGeometry(0.35, 0.28, 0.45, 8), darkWood, 0.75, 3.2, 0, mineG); mineParts.bucket = bucket;
      const shed = mesh(box(2.2, 1.6, 1.8), mat('#b08a62'), -2.4, 0.5, -1.2, mineG); shed.rotation.y = 0.3;
      const roof = mesh(new THREE.ConeGeometry(1.7, 0.9, 4), mat('#6b4a33'), -2.4, 2.55, -1.2, mineG); roof.rotation.y = Math.PI / 4 + 0.3;
      for (let k = 0; k < 7; k++) { const a = k * 0.9, r = 2.3 + (k % 3) * 0.5; const c = mesh(new THREE.OctahedronGeometry(0.22 + (k % 3) * 0.08, 0), goldMat, Math.cos(a) * r, 0.75, Math.sin(a) * r + 0.6, mineG); c.rotation.set(k, k * 2, 0); mineParts.crystals.push(c); }
      for (const rx of [1.55, 2.05]) mesh(box(0.07, 0.07, 2.8), mat('#5b5f66', { metalness: 0.6, roughness: 0.4 }), rx, 0.55, 2.7, mineG);
      for (let k = 0; k < 5; k++) mesh(box(0.75, 0.05, 0.14), darkWood, 1.8, 0.5, 1.5 + k * 0.6, mineG).castShadow = false;
      const cart = mesh(box(0.6, 0.38, 0.8), mat('#5b5f66', { metalness: 0.5, roughness: 0.5 }), 1.8, 0.62, 3.4, mineG);
      for (let k = 0; k < 3; k++) mesh(new THREE.OctahedronGeometry(0.15, 0), goldMat, 1.65 + k * 0.15, 1.05, 3.3 + (k % 2) * 0.15, mineG);
      mineParts.cart = cart;
      const g = new THREE.Sprite(additive('#ffd36b', 0)); g.scale.set(9, 9, 1); g.position.set(0, 2, 0.6); mineG.add(g); mineParts.glow = g;
    })();
    X.clickable(mineG, { type: 'mine' });
    function mineFirm() { const G = world.gold; return G ? world.firms.find((f) => f.id === G.firmId) : null; }
    function updateMine(t, dt) {
      const G = world.gold, f = mineFirm();
      mineG.visible = !!G;
      if (!G) return;
      const active = f && f.alive && !G.closed, busy = active ? clamp(f.workers.length / 20, 0, 1) : 0;
      mineParts.wheel.rotation.z -= dt * 0.004 * busy;
      mineParts.bucket.position.y = 1.2 + (Math.sin(t * 0.0016) * 0.5 + 0.5) * 3.6 * (busy > 0 ? 1 : 0);
      goldMat.emissiveIntensity = active ? 0.6 + 0.6 * clamp(G.yield, 0, 1) : 0.05;
      for (const c of mineParts.crystals) c.visible = active || G.yield > 0.3;
      mineParts.glow.material.opacity = active ? (0.25 + 0.25 * Math.sin(t * 0.004)) * clamp(G.yield, 0.2, 1) : 0;
      // bụi vàng bay lên: vàng được bán ra ngoài đảo
      if (active && busy > 0 && !reduce && Math.random() < 0.08 * busy) spawnMote(new THREE.Vector3(minePos.x, 3, minePos.z), new THREE.Vector3(minePos.x + (Math.random() - 0.5) * 6, 30 + Math.random() * 8, minePos.z + (Math.random() - 0.5) * 6), '#ffd36b', 2200);
    }

    // --- Trạm xá dựng tạm cạnh Đài Quan Sát Sao trong mùa dịch
    const sp0 = X.school.position, toPlazaS = new THREE.Vector3(PLAZA.x - sp0.x, 0, PLAZA.z - sp0.z).normalize();
    const clinicPos = sp0.clone().addScaledVector(toPlazaS, 3.9), clinic = new THREE.Group();
    clinic.position.copy(clinicPos); clinic.visible = false; island.add(clinic);
    (function buildClinic() {
      mesh(new THREE.ConeGeometry(1.45, 1.9, 6), mat('#f4f1e8'), 0, 0.95, 0, clinic);
      mesh(new THREE.CylinderGeometry(1.45, 1.45, 0.5, 6), mat('#e9e4d6'), 0, 0, 0, clinic).castShadow = false;
      mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.6, 5), mat('#6d5139'), 0, 1.3, 0, clinic);
      const flag = mesh(box(0.7, 0.42, 0.04), mat('#5fbf7a'), 0.36, 2.2, 0, clinic); flag.castShadow = false;
    })();
    X.clickable(clinic, { type: 'clinic' });
    // --- Lều sặc sỡ của người lạ, dựng ngay cạnh Kho Bạc
    const toPlazaB = new THREE.Vector3(PLAZA.x - bank.position.x, 0, PLAZA.z - bank.position.z).normalize();
    const ponziPos = bank.position.clone().addScaledVector(toPlazaB, 3.9), tent = new THREE.Group();
    tent.position.copy(ponziPos); tent.visible = false; island.add(tent);
    const tentParts = {};
    (function buildTent() {
      const g = new THREE.Group(); tent.add(g); tentParts.body = g;
      for (let k = 0; k < 8; k++) { const seg = mesh(new THREE.CylinderGeometry(0.01, 1.5, 2.1, 8, 1, false, (k / 8) * Math.PI * 2, Math.PI / 4), new THREE.MeshStandardMaterial({ color: k % 2 ? '#7d4cc9' : '#f2c14e', flatShading: true, roughness: 0.6, side: THREE.DoubleSide }), 0, 1.05 + 0.6, 0, g); seg.castShadow = true; }
      mesh(new THREE.CylinderGeometry(1.5, 1.5, 0.6, 8), mat('#5b3a8f'), 0, 0, 0, g);
      const cv = document.createElement('canvas'); cv.width = 256; cv.height = 96;
      const c2 = cv.getContext('2d'); c2.fillStyle = '#2b1c45'; c2.fillRect(0, 0, 256, 96); c2.strokeStyle = '#f2c14e'; c2.lineWidth = 6; c2.strokeRect(4, 4, 248, 88); c2.fillStyle = '#ffe08a'; c2.font = '700 38px Outfit, "Segoe UI", sans-serif'; c2.textAlign = 'center'; c2.textBaseline = 'middle'; c2.fillText('Lãi 3%/tuần', 128, 50);
      const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 0.64), new THREE.MeshStandardMaterial({ map: new THREE.CanvasTexture(cv), emissive: '#ffffff', emissiveMap: new THREE.CanvasTexture(cv), emissiveIntensity: 0.35, side: THREE.DoubleSide }));
      sign.position.set(0, 1.2, 1.55); g.add(sign);
      const glowS = new THREE.Sprite(additive('#c3a6ff', 0.5)); glowS.scale.set(6, 6, 1); glowS.position.y = 2; g.add(glowS); tentParts.glow = glowS;
      const balloon = new THREE.Group(); balloon.visible = false; tent.add(balloon); tentParts.balloon = balloon;
      mesh(new THREE.SphereGeometry(1.1, 12, 10), mat('#7d4cc9'), 0, 2.4, 0, balloon);
      mesh(new THREE.CylinderGeometry(0.45, 0.35, 0.4, 8), wood, 0, 0.9, 0, balloon);
    })();
    tent.rotation.y = Math.atan2(toPlazaB.x, toPlazaB.z);
    X.clickable(tent, { type: 'ponzi' });
    let fleeT0 = 0;
    function updateTent(t) {
      const P = world.ponzi;
      const open = P && P.state === 'open', fled = P && P.state === 'fled' && world.day - P.fled < 60;
      tent.visible = !!(open || fled);
      if (!tent.visible) return;
      tentParts.glow.material.opacity = open ? 0.35 + 0.2 * Math.sin(t * 0.005) : 0;
      tentParts.body.scale.y = open ? 1 : 0.35; // lều xẹp xuống sau khi người lạ bỏ đi
      const B = tentParts.balloon;
      if (fled && !fleeT0) fleeT0 = now();
      if (!fled) fleeT0 = 0;
      const k = fleeT0 ? (now() - fleeT0) / 9000 : 0;
      B.visible = fled && k < 1;
      if (B.visible) { B.position.set(k * k * 30, k * 34, -k * 12); B.rotation.y = k * 3; }
    }

    // --- Đám đông: người ốm trước trạm xá, người góp tiền trước lều
    const CN = 16, crowds = {};
    function makeCrowd(key, hatColor) {
      const bodies = new THREE.InstancedMesh(P.bodyGeo, new THREE.MeshStandardMaterial({ flatShading: true, roughness: 0.8 }), CN), heads = new THREE.InstancedMesh(P.headGeo, P.headMat, CN);
      for (let i = 0; i < CN; i++) bodies.setColorAt(i, C(P.shirts[(i * 3 + key.length) % P.shirts.length]));
      for (const m of [bodies, heads]) { m.castShadow = true; m.frustumCulled = false; m.visible = false; island.add(m); }
      crowds[key] = { bodies, heads, level: 0 };
    }
    makeCrowd('clinic'); makeCrowd('ponzi');
    function updateCrowd(key, origin, dir, target, t) {
      const Cr = crowds[key];
      Cr.level += (target - Cr.level) * 0.03;
      const show = Cr.level > 0.01;
      Cr.bodies.visible = Cr.heads.visible = show;
      if (!show) return;
      // một cụm 4×4 đứng bên hông lều, trong khoảng đất trống của công trình bên cạnh
      const n = Cr.level * CN, side = new THREE.Vector3(-dir.z, 0, dir.x);
      for (let i = 0; i < CN; i++) {
        if (i >= n) { qd.position.set(0, -80, 0); qd.scale.setScalar(0.001); }
        else { const row = Math.floor(i / 4), col = i % 4, jig = reduce ? 0 : Math.sin(t * 0.006 + i) * 0.05; qd.position.copy(origin).addScaledVector(side, 2.3 + row * 0.6).addScaledVector(dir, (col - 1.5) * 0.6 + jig); qd.position.y = 0.31 + Math.abs(Math.sin(t * 0.007 + i)) * 0.04; qd.scale.setScalar(1); }
        qd.updateMatrix(); Cr.bodies.setMatrixAt(i, qd.matrix);
        qd.position.y += 0.47; qd.updateMatrix(); Cr.heads.setMatrixAt(i, qd.matrix);
      }
      Cr.bodies.instanceMatrix.needsUpdate = Cr.heads.instanceMatrix.needsUpdate = true;
    }
    function updateEpidemic(t) {
      const sick = (world.sickN || 0) / world.households.length, on = world.epi.state !== 'none';
      clinic.visible = on || sick > 0;
      const tod = X.tod(), day = tod > 0.3 && tod < 0.74;
      updateCrowd('clinic', clinicPos, toPlazaS, on && day ? clamp(sick * 3, 0.12, 1) : 0, t);
      const P = world.ponzi;
      updateCrowd('ponzi', ponziPos, toPlazaB, P && P.state === 'open' && day ? clamp(P.investors.length / 30, 0.1, 1) : 0, t);
    }

    // --- Đình công: thợ cầm biển đỏ đứng chắn trước cửa xưởng
    const PK = 9, picketB = new THREE.InstancedMesh(P.bodyGeo, new THREE.MeshStandardMaterial({ flatShading: true, roughness: 0.8 }), PK * 3), picketH = new THREE.InstancedMesh(P.headGeo, P.headMat, PK * 3);
    const signs = new THREE.InstancedMesh(new THREE.BoxGeometry(0.62, 0.42, 0.05), new THREE.MeshStandardMaterial({ color: '#d9473a', flatShading: true, roughness: 0.7, emissive: '#5a120c', emissiveIntensity: 0.25 }), PK * 3);
    for (let i = 0; i < PK * 3; i++) picketB.setColorAt(i, C(P.shirts[(i * 5 + 2) % P.shirts.length]));
    for (const m of [picketB, picketH, signs]) { m.castShadow = true; m.frustumCulled = false; island.add(m); }
    function updatePickets(t) {
      const list = [];
      for (const [id, o] of firmObj) { const f = firmOf(id); if (f && f.alive && f.strike > 0 && !o.dying) list.push(o); }
      for (let i = 0; i < PK * 3; i++) {
        const o = list[Math.floor(i / PK)];
        if (!o) { qd.position.set(0, -80, 0); qd.scale.setScalar(0.001); qd.updateMatrix(); picketB.setMatrixAt(i, qd.matrix); picketH.setMatrixAt(i, qd.matrix); signs.setMatrixAt(i, qd.matrix); continue; }
        const k = i % PK, th = o.g.rotation.y, cs = Math.cos(th), sn = Math.sin(th), lx = (k - (PK - 1) / 2) * 0.55, lz = 2.7 + (k % 2) * 0.35;
        const bob = reduce ? 0 : Math.abs(Math.sin(t * 0.005 + k)) * 0.12;
        qd.position.set(o.g.position.x + lx * cs + lz * sn, 0.31 + bob * 0.3, o.g.position.z - lx * sn + lz * cs); qd.scale.setScalar(1); qd.rotation.set(0, th, 0);
        qd.updateMatrix(); picketB.setMatrixAt(i, qd.matrix);
        qd.position.y += 0.47; qd.updateMatrix(); picketH.setMatrixAt(i, qd.matrix);
        if (k % 3 === 1) { qd.position.y += 0.75 + bob; qd.updateMatrix(); signs.setMatrixAt(i, qd.matrix); } else { qd.scale.setScalar(0.001); qd.updateMatrix(); signs.setMatrixAt(i, qd.matrix); }
        qd.rotation.set(0, 0, 0);
      }
      picketB.instanceMatrix.needsUpdate = picketH.instanceMatrix.needsUpdate = signs.instanceMatrix.needsUpdate = true;
    }

    // --- Độc quyền: cờ vàng trên mái
    const flags = new Map(), flagMat = new THREE.MeshStandardMaterial({ color: '#ffd04d', emissive: '#7a5200', emissiveIntensity: 0.35, flatShading: true, side: THREE.DoubleSide });
    function syncFlags(t) {
      for (const [id, o] of firmObj) {
        const f = firmOf(id), on = !!(f && f.alive && f.monopoly);
        let fl = flags.get(id);
        if (on && !fl) { fl = new THREE.Group(); mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.4, 5), mat('#3b3b3b'), 0, 1.2, 0, fl); const cloth = mesh(new THREE.PlaneGeometry(1.2, 0.7), flagMat, 0.62, 2.0, 0, fl); fl.userData.cloth = cloth; fl.position.set(-1.0, Math.min(8, o.g.userData.top || 3.6), 0.4); o.g.add(fl); flags.set(id, fl); }
        if (fl && fl.parent !== o.g) { flags.delete(id); fl = null; if (on) { syncFlags(t); return; } }
        if (!on && fl) { fl.parent.remove(fl); flags.delete(id); }
        if (fl) fl.userData.cloth.rotation.y = Math.sin(t * 0.004 + id) * 0.35;
      }
    }

    // --- Đám cưới: hoa rải từ nhà này sang nhà kia
    function weddingFx(st) {
      const a = housePos(st.from), b = housePos(st.to);
      for (let k = 0; k < 30; k++) spawnMote(new THREE.Vector3(a.x, 3 + Math.random(), a.z), new THREE.Vector3(b.x + (Math.random() - 0.5) * 2, 3, b.z + (Math.random() - 0.5) * 2), k % 3 ? '#ffb3c7' : '#fff1f5', 2600 + k * 40);
      label3d('Đám cưới', new THREE.Vector3(b.x, 8, b.z), '#ffc2d4');
    }

    function extraPos(id) { const G = world.gold; return G && G.firmId === id && !G.closed ? minePos : null; }
    function customCard(sel) {
      if (sel.type === 'memo') return memoCard(sel.id);
      if (sel.type === 'mine') {
        const G = world.gold, f = mineFirm(); if (!G) return null;
        const open = f && f.alive && !G.closed;
        return { kind: open ? 'Mỏ vàng · đang khai thác' : 'Mỏ vàng · đã cạn', title: 'Mỏ Vàng Đồi Mây', text: open ? 'Mạch vàng tìm thấy ngày ' + G.start + '. Lương ở đây gấp rưỡi xưởng thường, nên thợ khắp đảo bỏ việc lên đồi. Mạch vàng mỏng dần mỗi ngày.' : 'Mạch vàng đã cạn sau ' + (G.closed - G.start) + ' ngày. Tháp giếng còn đứng đó, bánh xe không quay nữa.', list: [['Thợ mỏ', open ? f.workers.length : 0], ['Độ dày mạch vàng', Math.round(clamp(G.yield, 0, 1) * 100) + '%'], ['Vàng đã bán ra ngoài', Math.round(G.revenue).toLocaleString('vi-VN') + ' xu'], ['Tiền theo hàng ngoại ra đi', Math.round(G.imports || 0).toLocaleString('vi-VN') + ' xu']] };
      }
      if (sel.type === 'ponzi') {
        const Pz = world.ponzi; if (!Pz) return null;
        const open = Pz.state === 'open';
        return { kind: open ? 'Lều của người lạ' : 'Lều bỏ hoang', title: Pz.name, text: open ? 'Hứa trả lãi ba phần trăm mỗi tuần. Lãi của người góp trước được trả bằng tiền của người góp sau.' : Pz.name + ' đã bỏ trốn ngày ' + Pz.fled + ', mang theo ' + Pz.amount.toLocaleString('vi-VN') + ' xu.', list: [['Gia đình đã góp', Pz.investors.length], ['Tiền đã nhận', Math.round(Pz.pool).toLocaleString('vi-VN') + ' xu'], ['"Lãi" đã trả', Math.round(Pz.paid).toLocaleString('vi-VN') + ' xu']] };
      }
      if (sel.type === 'clinic') {
        const sick = world.sickN || 0;
        return { kind: 'Trạm xá dựng tạm', title: 'Trạm xá Đài Sao', text: sick ? sick + ' người đang nằm nhà vì sốt. Người ốm không đi làm, không đi chợ; khỏi rồi thì một thời gian không mắc lại.' : 'Dịch đã qua. Trạm xá sắp được dỡ đi.', list: [['Lúc cao điểm', Math.round(world.epi.peak * 100) + '% dân'], ['Ngày công đã mất', Math.round(world.epi.lost)]] };
      }
      return null;
    }
    function customPos(sel) {
      if (sel.type === 'memo') return memoPos(sel.id);
      if (sel.type === 'mine') return minePos.clone();
      if (sel.type === 'ponzi') return ponziPos.clone();
      if (sel.type === 'clinic') return clinicPos.clone();
      return null;
    }

    /* =============== Nhịp ngày và khung hình của miền này =============== */
    let lastId = world.storySeq;
    // chuyện mới của thành phố: gắn tên miền, gây hiệu ứng tại chỗ, rồi giao cho người dẫn chuyện
    function ingest() {
      const fresh = Sim.storiesSince(world, lastId).filter((st) => st.type !== 'chapter'); // chương năm do cả thế giới kể
      const all = Sim.storiesSince(world, lastId);
      if (all.length) lastId = all[all.length - 1].id;
      for (const st of fresh) {
        st.city = CI;
        N.addChron(st);
        if (st.type === 'invention' && st.seeded) continue; // đã kể khi hạt giống chạm đất
        if (st.tier !== 'small' || Math.random() < 0.25) N.enqueue(st);
        if (st.type === 'invention') inventFlash(st.place.id, st.item);
        else if (st.type === 'fire' && audio) audio.crackle();
        else if (st.type === 'airship' && audio) audio.horn();
        else if (st.type === 'bankrun') label3d('Người dân kéo đến đòi tiền', new THREE.Vector3(bank.position.x, 14, bank.position.z), '#ff9b94');
        else if (st.type === 'wedding') weddingFx(st);
        else if (st.type === 'settlers' || st.type === 'immigrants') X.procession(4);
        else if (st.type === 'gold') { flashAt(X.minePos, '#ffd36b', 30); ripple(X.minePos, '#ffd36b'); label3d('Mạch vàng!', new THREE.Vector3(X.minePos.x, 11, X.minePos.z), '#ffe08a'); if (audio) audio.chime(); }
        else if (st.type === 'ponzi-flee') { label3d('Bỏ trốn', new THREE.Vector3(ponziPos.x, 10, ponziPos.z), '#d4c2ff'); if (audio) audio.whoosh(); }
        else if (st.type === 'strike') { const p = placePos(st.place); label3d('Đình công', new THREE.Vector3(p.x, 9, p.z), '#ff9b8f'); }
        else if (st.type === 'monopoly') { const p = placePos(st.place); flashAt(p, '#ffd04d', 18); label3d('Độc quyền', new THREE.Vector3(p.x, 10, p.z), '#ffe08a'); }
        else if (st.type === 'food-rush') { const p = placePos(st.place); label3d('Người dân đổ xô mua gạo', new THREE.Vector3(p.x, 11, p.z), '#f0c27a'); }
        else if (st.type === 'fad-crash') { const p = placePos(st.place); flashAt(p, '#ff9f43', 16); label3d('Bong bóng vỡ', new THREE.Vector3(p.x, 11, p.z), '#ffb27a'); }
      }
      return fresh;
    }
    function onDay() {
      world = W0.cities[CI].w;
      ingest();
      if (rumorWatch) rumorWatch.peak = Math.max(rumorWatch.peak, rumorWatch.kind === 'bank' ? world.fearShare || 0 : (world.foodRumorN || 0) / world.households.length);
      spreadArcs(); computeAuras(); sendCrates(); syncMemories(true); wearDay();
    }
    let lastSlow = 0;
    function update(dt, t) {
      updateArcs(); updateAuras(t); updateFx(dt); updateShip(t, dt); updateHalos(t); updateQueue(t); updateGlass(); updateMemories(dt, t);
      updateMine(t, dt); updateTent(t); updateEpidemic(t); updatePickets(t); updateBankCrowd(t);
      if (t - lastSlow > 250) { lastSlow = t; syncCrystals(t); syncFires(t); syncFlags(t); }
      else for (const [, c] of crystals) { c.g.rotation.y = t * 0.0012; }
      for (const [, fx] of fireFx) if (fx.burning) for (let k = 0; k < fx.flames.length; k++) { const s = fx.flames[k], fl = 0.6 + 0.4 * Math.sin(t * 0.02 + k * 2.1) * Math.sin(t * 0.013 + k); s.scale.setScalar(2.4 + fl * 2.2); s.material.opacity = 0.55 + 0.35 * fl; }
      if (wearDirty && t - lastWear > 450) { wearTex.needsUpdate = true; wearDirty = false; lastWear = t; }
      // đèn hiệu trên bến cháy sáng cho đến khi khí cầu đến
      const calling = world.airship.called;
      dockLamp.scale.setScalar(3 + (calling ? 4 + Math.sin(t * 0.008) * 1.5 : 0));
      dockLamp.material.opacity = calling ? 1 : 0.7;
    }
    computeAuras();
    return { onDay, update, ingest, placePos, wants, doSeed, doTap, doWhisper, callAirship, customCard, customPos, extraPos, hideHalos, goTo: (st) => placePos(st.place) };
  }

  /* =============== Người dẫn chuyện chung cho cả sáu miền =============== */
  function create(G) {
    const { THREE, W, Sim, lands3d, $, reduce, audio } = G;
    const now = () => performance.now();
    const layers = [];
    const cityName = (i) => (i >= 0 && W.cities[i] ? W.cities[i].name : '');

    /* ----- Phụ đề ----- */
    let subUntil = 0;
    function showSub(st, ms) {
      const [label, color] = typeOf(st.type);
      const el = $('subtitle'), where = st.city >= 0 && st.city != null ? cityName(st.city) + ' · ' : '';
      el.innerHTML = '<span class="sk" style="color:' + color + '">Ngày ' + st.day + ' · ' + where + label + '</span><b>' + st.title + '</b><span class="st">' + st.text + '</span>';
      el.hidden = false; el.classList.remove('out'); void el.offsetWidth; el.classList.add('in');
      const hint = $('hint'); if (hint) hint.style.opacity = 0;
      subUntil = now() + (ms || TIER_HOLD[st.tier] || 6000);
    }
    function updateSub() { const el = $('subtitle'); if (!el.hidden && now() > subUntil) { el.classList.remove('in'); el.classList.add('out'); if (now() > subUntil + 500) el.hidden = true; } }

    /* ----- Vị trí của một câu chuyện trong toạ độ thế giới ----- */
    function placeOf(st) {
      const pl = st.place;
      if (pl && pl.kind === 'land') return lands3d.lands[pl.city].center.clone();
      if (pl && pl.kind === 'bridge') { const B = lands3d.bridges[pl.bridge]; return B.pa.clone().lerp(B.pb, 0.5); }
      if (st.city >= 0 && layers[st.city]) return lands3d.lands[st.city].world(layers[st.city].placePos(pl));
      if (st.city >= 0) return lands3d.lands[st.city].center.clone();
      return new THREE.Vector3();
    }

    /* ----- Biên niên sử ----- */
    const chron = [];
    let unread = 0;
    function chronItem(st) {
      if (st.type === 'chapter') return '<li class="t-chapter"><button data-id="' + st.uid + '"><span class="cd">' + st.title.split(': ')[0] + ' khép lại · Ngày ' + st.day + '</span><b>' + (st.title.split(': ')[1] || st.title) + '</b><span class="ct">' + (st.recap || []).slice(0, 3).join(' · ') + '</span></button></li>';
      const [label, color] = typeOf(st.type), where = st.city >= 0 && st.city != null ? cityName(st.city) + ' · ' : '';
      return '<li class="t-' + st.tier + '"><button data-id="' + st.uid + '"><i style="background:' + color + ';color:' + color + '"></i><span class="cd">Ngày ' + st.day + ' · ' + where + label + '</span><b>' + st.title + '</b><span class="ct">' + st.text + '</span></button></li>';
    }
    function renderChron() {
      const list = $('chronList');
      list.innerHTML = chron.length ? chron.map(chronItem).join('') : '<li class="empty">Sáu miền đất còn hoang sơ. Chờ những người đầu tiên.</li>';
      unread = 0; badge();
    }
    function badge() { const b = $('chronBadge'); b.textContent = unread > 99 ? '99+' : unread; b.hidden = unread === 0; }
    let uidSeq = 0;
    function addChron(st) {
      st.uid = ++uidSeq;
      chron.unshift(st); if (chron.length > 220) chron.pop();
      if (!$('chron').hidden) { $('chronList').insertAdjacentHTML('afterbegin', chronItem(st)); const li = $('chronList').querySelector('.empty'); if (li) li.remove(); while ($('chronList').children.length > 220) $('chronList').lastElementChild.remove(); }
      else if (st.tier !== 'small') { unread++; badge(); }
    }
    $('chronList').addEventListener('click', (e) => {
      const b = e.target.closest('button[data-id]'); if (!b) return;
      const st = chron.find((s) => s.uid === +b.dataset.id); if (!st) return;
      if (st.type === 'chapter') { G.closePanels(); showChapter(st); return; }
      goTo(st, true);
    });
    function goTo(st, manual) {
      const p = placeOf(st), pl = st.place;
      const dist = pl && pl.kind === 'land' ? 70 : pl && pl.kind === 'bridge' ? 46 : TIER_DIST[st.tier] || 30;
      G.flyTo(p, dist);
      showSub(st, manual ? 9000 : null);
      if (st.city >= 0) G.setFocus(st.city);
      if (manual) {
        pausedUntil = now() + 20000;
        const land = st.city;
        if (pl && pl.kind === 'firm') G.select({ type: 'firm', id: pl.id, land }, true);
        else if (pl && pl.kind === 'house') G.select({ type: 'house', i: pl.id, land }, true);
        else if (pl && pl.kind === 'bank') G.select({ type: 'bank', land }, true);
      }
    }

    /* ----- Đạo diễn ----- */
    let directorOn = true, holdUntil = 0, pausedUntil = 0, idleSince = now(), overview = false;
    const queue = [];
    const PRI_BONUS = { settle: 2, era: 2, chapter: 2 };
    const pri = (st) => TIER_PRI[st.tier] + (PRI_BONUS[st.type] || 0);
    function takeNext(minPri) {
      for (let i = queue.length - 1; i >= 0; i--) if (W.day - queue[i].day > TIER_AGE[queue[i].tier]) queue.splice(i, 1);
      let best = -1;
      for (let i = queue.length - 1; i >= 0; i--) {
        if (pri(queue[i]) < minPri) continue;
        if (best < 0 || pri(queue[i]) > pri(queue[best])) best = i;
      }
      return best < 0 ? null : queue.splice(best, 1)[0];
    }
    function enqueue(st) { queue.push(st); while (queue.length > 24) queue.shift(); }
    function dequeue(st) { const i = queue.indexOf(st); if (i >= 0) queue.splice(i, 1); }
    function updateDirector() {
      const n = now();
      if (n < holdUntil) return;
      if (!directorOn || n < pausedUntil) {
        const st = takeNext(2);
        if (st && n > subUntil) { showSub(st); holdUntil = n + 1500; }
        return;
      }
      const st = takeNext(1);
      if (st) { goTo(st, false); holdUntil = n + (TIER_HOLD[st.tier] || 6000); G.setAutoRotate(false); idleSince = n; overview = false; }
      else if (!overview && n - idleSince > 8000) { G.flyTo(new THREE.Vector3(0, 0, 0), G.overviewDist); G.setAutoRotate(true); overview = true; }
    }

    /* ----- Công cụ ----- */
    let mode = null;
    const HINT = {
      seed: 'Chọn một xưởng hoặc một nơi làm ra lương thực, ở bất cứ miền nào, để gieo hạt phát minh.',
      tap: 'Chạm vào một chỗ trên một miền đất để gõ lên vòm kính phía trên. Gõ liên tiếp nhiều ngày thì nỗi sợ lan rộng hơn.',
      'whisper-bank': 'Chọn một ngôi nhà để thì thầm: nơi giữ tiền sắp vỡ.',
      'whisper-food': 'Chọn một ngôi nhà để thì thầm: “Năm nay sắp mất mùa”.',
      'whisper-fad': 'Chọn một xưởng để thì thầm về một món hàng mới.',
    };
    const TOOL_OF = { seed: 'toolSeed', tap: 'toolTap', 'whisper-bank': 'toolWhisper', 'whisper-food': 'toolWhisper', 'whisper-fad': 'toolWhisper' };
    function setMode(m) {
      mode = m || null;
      for (const id of ['toolSeed', 'toolTap', 'toolWhisper']) $(id).setAttribute('aria-pressed', String(!!mode && TOOL_OF[mode] === id));
      document.body.classList.toggle('seeding', !!mode);
      showMenu(false);
      if (mode) { G.closePanels(); G.select(null); G.toast(HINT[mode], 3800); pausedUntil = now() + 30000; }
      for (const ly of layers) if (ly) ly.hideHalos();
    }
    function showMenu(on) {
      const m = $('whisperMenu'); m.hidden = !on; $('toolWhisper').setAttribute('aria-expanded', String(on));
      if (!on) return;
      const b = $('toolWhisper').getBoundingClientRect(), mw = Math.min(300, window.innerWidth - 24);
      m.style.width = mw + 'px';
      const left = b.right + 10 + mw < window.innerWidth ? b.right + 10 : Math.max(12, b.left - 10 - mw);
      m.style.left = left + 'px'; m.style.top = Math.max(12, Math.min(window.innerHeight - m.offsetHeight - 90, b.top - 20)) + 'px';
      m.querySelector('button').focus({ preventScroll: true });
    }
    const focusW = () => { const c = W.cities[G.focus()]; return c && c.settled ? c.w : null; };
    $('toolWhisper').addEventListener('click', () => {
      if (mode && mode.startsWith('whisper')) { setMode(null); return; }
      if (!$('whisperMenu').hidden) { showMenu(false); return; }
      setMode(null); showMenu(true);
    });
    $('whisperMenu').addEventListener('click', (e) => { const b = e.target.closest('button[data-k]'); if (b) setMode('whisper-' + b.dataset.k); });
    $('scene').addEventListener('pointerdown', () => { if (!$('whisperMenu').hidden) showMenu(false); });
    $('toolSeed').addEventListener('click', () => setMode(mode === 'seed' ? null : 'seed'));
    $('toolTap').addEventListener('click', () => setMode(mode === 'tap' ? null : 'tap'));
    $('toolCall').addEventListener('click', () => {
      const i = G.focus(), ly = layers[i];
      if (!ly) { G.toast('Hãy chọn một thành phố đã có người trước (bấm vào tên thành phố ở trên).', 3500); return; }
      ly.callAirship(); updateToolUi();
    });
    function ringUi(id, wait, total) { const b = $(id); b.style.setProperty('--p', String(Math.max(0, Math.min(1, 1 - wait / total)))); b.classList.toggle('ready', wait <= 0); }
    // các vòng chờ hiển thị trạng thái của thành phố đang xem
    function updateToolUi() {
      const w = focusW();
      if (!w) { for (const [id, el] of [['toolSeed', 'seedWait'], ['toolTap', 'tapWait'], ['toolWhisper', 'whisperWait'], ['toolCall', 'callWait']]) { $(el).textContent = 'Chọn một thành phố'; ringUi(id, 0, 1); } return; }
      const d = w.day, K = w.keeper, a = w.airship, nm = cityName(G.focus());
      const sw = Math.max(0, w.seedReady - d);
      $('seedWait').textContent = sw ? nm + ' · còn ' + sw + ' ngày' : 'Sẵn sàng ở mọi miền'; ringUi('toolSeed', sw, 40);
      const live = K.tapLevel > 0 && d - K.lastTap <= 6;
      $('tapWait').textContent = K.lastTap === d ? 'Kính còn rung' : live ? 'Gõ tiếp: mức ' + Math.min(4, K.tapLevel + 1) + '/4' : 'Chạm vào một miền'; ringUi('toolTap', K.lastTap === d ? 1 : 0, 1);
      const ww = Math.max(0, K.whisperReady - d);
      $('whisperWait').textContent = ww ? nm + ' · còn ' + ww + ' ngày' : 'Sẵn sàng'; ringUi('toolWhisper', ww, 20);
      const era = W.cities[G.focus()].era, cw = Math.max(0, K.callReady - d), busy = a.state === 'docked' || a.called;
      $('callWait').textContent = era < 3 ? nm + ' chưa có bến' : a.state === 'docked' ? 'Đang neo ở bến' : a.called ? 'Đang trên đường' : cw ? 'Còn ' + cw + ' ngày' : 'Gọi tới ' + nm; ringUi('toolCall', era < 3 || busy ? 1 : cw, era < 3 || busy ? 1 : 90);
    }
    const GROUND = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    function landAt(wp) { for (const L of lands3d.lands) if (Math.hypot(wp.x - L.center.x, wp.z - L.center.z) < lands3d.LAND_R + 1) return L; return null; }
    function handlePick(sel, ray) {
      if (!mode) return false;
      if (mode === 'tap') {
        const wp = new THREE.Vector3();
        if (!ray || !ray.ray.intersectPlane(GROUND, wp)) return true;
        const L = landAt(wp);
        if (!L) return true;
        if (!layers[L.i]) { G.toast('Miền ' + W.cities[L.i].terrain.land.toLowerCase() + ' chưa có ai ở. Tiếng gõ chỉ làm chim bay.', 2600); return true; }
        G.setFocus(L.i); layers[L.i].doTap(wp.clone().sub(L.center)); updateToolUi();
        return true;
      }
      const ly = sel && sel.land != null ? layers[sel.land] : null;
      if (!ly || !ly.wants(sel)) { G.toast(mode === 'seed' ? 'Hãy chọn một xưởng hoặc một nơi làm ra lương thực.' : mode === 'whisper-fad' ? 'Hãy chọn một xưởng thủ công còn mở cửa.' : 'Hãy chọn một ngôi nhà.', 2500); return true; }
      G.setFocus(sel.land);
      const r = mode === 'seed' ? ly.doSeed(sel) : ly.doWhisper(mode.slice(8), sel);
      updateToolUi();
      return r;
    }
    function wants(sel) { if (!mode) return false; if (mode === 'tap') return true; const ly = sel && sel.land != null ? layers[sel.land] : null; return !!(ly && ly.wants(sel)); }

    /* ----- Chương năm của cả thế giới ----- */
    let chapterUntil = 0;
    function showChapter(st) {
      const [yr, ...rest] = st.title.split(': ');
      $('cpYear').textContent = yr + ' khép lại';
      $('cpTitle').textContent = rest.join(': ');
      $('cpList').innerHTML = (st.recap || []).map((l) => '<li>' + l + '</li>').join('');
      const el = $('chapter'); el.hidden = false; el.classList.remove('in'); void el.offsetWidth; el.classList.add('in');
      chapterUntil = now() + 16000;
      G.flyTo(new THREE.Vector3(0, 0, 0), G.overviewDist); G.setAutoRotate(true); overview = true; holdUntil = now() + 9000;
      if (audio) audio.chime();
    }
    function hideChapter() { $('chapter').hidden = true; chapterUntil = 0; }
    $('cpClose').addEventListener('click', hideChapter);

    /* ----- Chuyện của cả thế giới: định cư, thời đại mới, cầu, buôn bán, chương năm ----- */
    let lastWorld = 0;
    function ingestWorld() {
      for (const st of W.stories) {
        if (st.id <= lastWorld) continue;
        lastWorld = st.id;
        if (st.city == null || st.city < 0) st.city = st.place && st.place.kind === 'bridge' ? lands3d.bridges[st.place.bridge].a : -1;
        addChron(st);
        if (st.type === 'chapter') { showChapter(st); continue; }
        enqueue(st);
        const p = placeOf(st);
        if (st.type === 'era') {
          G.label3d(W.cities[st.city].name + ' · thời ' + Sim.ERAS[st.era].name, p.clone().setY(26), '#ffe08a'); G.ripple(p, '#ffd27a'); if (audio) audio.chime();
          // người từ thành phố láng giềng kéo đến thành phố vừa sang thời mới
          const nb = lands3d.lands[st.city].neighbors.filter((j) => W.cities[j].settled);
          lands3d.procession(st.city, 10, nb.length ? nb[Math.floor(Math.random() * nb.length)] : -1);
        }
        else if (st.type === 'settle') { G.label3d('Những người đầu tiên', p.clone().setY(18), '#9df0c4'); G.ripple(p, '#9df0c4'); lands3d.procession(st.city, 18, st.from); }
        else if (st.type === 'bridge') G.label3d('Cầu mới', p.clone().setY(12), '#d9ccff');
      }
    }

    /* ----- Ngữ cảnh của một miền cho lớp hình ảnh ----- */
    function contextFor(L) {
      const c = W.cities[L.i];
      return {
        THREE, Sim, W, city: L.i, cityName: c.name, island: L.g, center: L.center, dome: G.dome, outAng: L.ang,
        houses: L.houses, firmObj: L.firmObj, glowTex: G.glowTex, mat: G.mat, mesh: G.mesh, box: G.box, C: G.C, audio, $, reduce,
        PLAZA: new THREE.Vector3(0, 0, 0), R: lands3d.LAND_R, bank: { position: L.bankPos }, school: { position: L.schoolPos }, minePos: L.minePos,
        plazaExits: [...L.landing, L.bankPos, L.schoolPos],
        label3d: (text, p, color) => G.label3d(text, L.world(p), color),
        toast: G.toast,
        puff: (p, dark, col) => G.puff(L.world(p), dark, col),
        ripple: (p, col) => G.ripple(L.world(p), col),
        spawnMote: (a, b, col, dur) => G.spawnMote(L.world(a), L.world(b), col, dur),
        flyTo: (p, d) => G.flyTo(L.world(p), d),
        select: (s, f) => G.select(s ? Object.assign({ land: L.i }, s) : null, f),
        watch: (d, fn) => G.watch(L.i, d, fn),
        setAutoRotate: G.setAutoRotate, closePanels: G.closePanels,
        people: G.people, tod: G.tod,
        clickable: (g, sel) => G.clickable(g, Object.assign({ land: L.i }, sel)), unclickable: G.unclickable,
        walkPath: (h) => lands3d.walkPath(L, h),
        procession: (n) => { const nb = L.neighbors.filter((j) => W.cities[j].settled); lands3d.procession(L.i, n, nb.length ? nb[Math.floor(Math.random() * nb.length)] : -1); },
      };
    }
    const N = { showSub, addChron, enqueue, dequeue, setMode, pause: (ms) => { pausedUntil = now() + ms; }, get mode() { return mode; } };
    function ensureLayers() {
      for (const L of lands3d.lands) if (!layers[L.i] && W.cities[L.i].settled && L.shown) layers[L.i] = makeLayer(contextFor(L), N);
    }
    function onDay() {
      ensureLayers();
      for (const ly of layers) if (ly) ly.onDay();
      ingestWorld();
      updateToolUi();
    }
    function update(dt, t) {
      for (const ly of layers) if (ly) ly.update(dt, t);
      updateSub(); updateDirector();
      if (chapterUntil && now() > chapterUntil) hideChapter();
    }
    updateToolUi();

    return {
      onDay, update, handlePick, renderChron, wants, setMode, hideChapter, showSub, chron, queue, updateToolUi,
      customCard: (sel) => { const ly = layers[sel.land]; return ly ? ly.customCard(sel) : null; },
      customPos: (sel) => { const ly = layers[sel.land], p = ly ? ly.customPos(sel) : null; return p ? lands3d.lands[sel.land].world(p) : null; },
      extraPos: (i, id) => { const ly = layers[i]; return ly ? ly.extraPos(id) : null; },
      userMoved() { pausedUntil = now() + 25000; overview = false; },
      setDirector(on) { directorOn = on; if (on) { pausedUntil = 0; holdUntil = 0; } },
      get director() { return directorOn; },
      get mode() { return mode; },
      get chapterOpen() { return !$('chapter').hidden; },
      layer: (i) => layers[i],
    };
  }

  root.Story3D = { create };
})(typeof self !== 'undefined' ? self : this);
