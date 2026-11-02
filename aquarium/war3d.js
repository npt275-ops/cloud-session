/* Bể Kính — lớp hình ảnh của biển trong và Tranh hùng: sóng, cá và thú biển, thuyền cá, tàu buôn,
 * công trình kinh tế và quân sự theo từng miền và từng thời đại, quân lính trên chiến tuyến, đạn, khói và hạt nhân. */
(function (root) {
  'use strict';
  const SEA_R = 89, SEA_Y = -0.55, TAU = Math.PI * 2; // biển trong rộng theo đảo mới (RING 132, đảo bán kính 50)

  function create(K) {
    const { THREE, scene, Sim, W, lands3d, hash, C, clamp, lerp, reduce, glowTex, puff, label3d } = K;
    const { Kit, meshOf, UBOX, UCYL, UCONE, TCYL, DOME, GABLE, VAULT, ICO, DOD, SPHG, TORUS, disposeGroup, bodyMat, metalMat, pick, STY, roofOn, styHall, clearTrees, dust, setBeyond, recolorG } = lands3d.kit;
    const E7 = (e) => Math.min(7, e);
    // màu chung của mỗi thời vượt người cho tàu, xe và công trình chiến tranh
    const BEY_TINT = [null, null, null, null, null, null, null, null, ['#eef3f7', 0.6], ['#fff1dc', 0.45], ['#c9b6ff', 0.45], ['#fff6dc', 0.7]];
    const F = lands3d.fig;
    const lands = lands3d.lands;
    const v3 = (x, y, z) => new THREE.Vector3(x, y, z);
    const flat = (p) => v3(p.x, 0, p.z);

    /* =============== Biển trong =============== */
    const sea = new THREE.Group(); scene.add(sea);
    const waterGeo = new THREE.RingGeometry(0.6, SEA_R, 96, 12);
    waterGeo.rotateX(-Math.PI / 2);
    const wpos = waterGeo.attributes.position, wbase = new Float32Array(wpos.count * 2), wcol = [];
    const deepC = C('#1c5a86'), shallowC = C('#46b3cf'), tmpC = new THREE.Color();
    for (let i = 0; i < wpos.count; i++) {
      const x = wpos.getX(i), z = wpos.getZ(i), r = Math.hypot(x, z);
      wbase[i * 2] = x; wbase[i * 2 + 1] = z;
      tmpC.copy(deepC).lerp(shallowC, clamp((r - 26) / 26, 0, 1)); wcol.push(tmpC.r, tmpC.g, tmpC.b);
    }
    waterGeo.setAttribute('color', new THREE.Float32BufferAttribute(wcol, 3));
    const waterMat = new THREE.MeshStandardMaterial({ vertexColors: true, transparent: true, opacity: 0.84, roughness: 0.2, metalness: 0.15, flatShading: true, emissive: '#0b3550', emissiveIntensity: 0.28, depthWrite: false });
    let seaDy = 0; // bàn tay đổ thêm nước hay rút bớt nước: mặt biển dâng, hạ
    const water = new THREE.Mesh(waterGeo, waterMat); water.position.y = SEA_Y; water.receiveShadow = true; water.renderOrder = 2; sea.add(water);
    water.raycast = () => {};
    // đáy biển: cát vàng ven bờ, xanh thẫm ngoài khơi; bên dưới là bồn đá
    const floorGeo = new THREE.RingGeometry(0.6, SEA_R - 0.4, 48, 6); floorGeo.rotateX(-Math.PI / 2);
    const fcol = [];
    for (let i = 0; i < floorGeo.attributes.position.count; i++) { const r = Math.hypot(floorGeo.attributes.position.getX(i), floorGeo.attributes.position.getZ(i)); tmpC.set('#244f5c').lerp(C('#d9c48f'), clamp((r - 34) / 20, 0, 1)); fcol.push(tmpC.r, tmpC.g, tmpC.b); }
    floorGeo.setAttribute('color', new THREE.Float32BufferAttribute(fcol, 3));
    const floor = new THREE.Mesh(floorGeo, new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.95 })); floor.position.y = -3.3; floor.receiveShadow = true; sea.add(floor);
    const basinG = new THREE.ConeGeometry(SEA_R, 28, 40, 4); basinG.rotateX(Math.PI); basinG.translate(0, -3.3 - 14, 0);
    { const bp = basinG.attributes.position, cs = []; for (let i = 0; i < bp.count; i++) { const y = bp.getY(i); if (y < -5) { bp.setX(i, bp.getX(i) * (0.9 + hash(i) * 0.2)); bp.setZ(i, bp.getZ(i) * (0.9 + hash(i + 7) * 0.2)); } tmpC.set(['#7d6b58', '#6d5d4c', '#5c5045', '#4c443d'][clamp(Math.floor(-y / 8), 0, 3)]); cs.push(tmpC.r, tmpC.g, tmpC.b); } basinG.setAttribute('color', new THREE.Float32BufferAttribute(cs, 3)); basinG.computeVertexNormals(); }
    sea.add(new THREE.Mesh(basinG, new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.95 })));
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(SEA_R, SEA_R - 0.6, 2.9, 96, 1, true), new THREE.MeshStandardMaterial({ color: '#4aa3c7', transparent: true, opacity: 0.55, emissive: '#0c3b52', emissiveIntensity: 0.3, side: THREE.DoubleSide, depthWrite: false }));
    rim.position.y = SEA_Y - 1.45; sea.add(rim); rim.raycast = () => {};
    // thác nước ở sáu khe giữa các miền: biển trong tràn xuống khoảng trời
    for (let i = 0; i < 6; i++) {
      const a = Math.PI / 2 + i * (Math.PI / 3) + Math.PI / 6;
      const f = new THREE.Mesh(new THREE.BoxGeometry(0.5, 26, 7), new THREE.MeshStandardMaterial({ color: '#8fd3ee', transparent: true, opacity: 0.7, emissive: '#2a6f8f', emissiveIntensity: 0.3 }));
      f.position.set(Math.cos(a) * (SEA_R + 0.2), -13.5, Math.sin(a) * (SEA_R + 0.2)); f.rotation.y = -a; sea.add(f); f.raycast = () => {};
    }
    const zoneC = (z) => (z === 6 ? v3(0, 0, 0) : flat(lands[z].center).normalize().multiplyScalar(62));
    const inwW = (L) => L.inw.clone();
    const dockEnd = (L) => L.world(L.dockPos).addScaledVector(inwW(L), 8.4).setY(SEA_Y);
    const portWater = (L) => L.world(L.portPos).addScaledVector(inwW(L), 7.5).setY(SEA_Y);

    /* =============== Mô hình nhỏ: thuyền, tàu, thú biển, quân lính =============== */
    // mỗi mô hình gồm phần thân (màu sẵn) và phần màu cờ của phe (trắng, nhuộm theo từng bản sao)
    function bake2(build) {
      const k = new Kit(), kt = new Kit();
      build(k, kt);
      const a = k.bake().body;
      if (!kt.b.length) kt.box('#ffffff', 0, -50, 0, 0.001, 0.001, 0.001);
      return { body: a, team: kt.bake().body };
    }
    const instMats = { body: new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.75, metalness: 0.05 }), team: new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.6 }) };
    function instSet(geos, cap) {
      const b = new THREE.InstancedMesh(geos.body, instMats.body, cap), t = new THREE.InstancedMesh(geos.team, instMats.team, cap);
      for (let i = 0; i < cap; i++) t.setColorAt(i, C('#ffffff')); // phải tạo bảng màu khi count còn bằng sức chứa
      for (const m of [b, t]) { m.count = 0; m.castShadow = true; m.frustumCulled = false; scene.add(m); m.raycast = () => {}; }
      return { b, t, cap, n: 0 };
    }
    const _o = new THREE.Object3D();
    function put(S, pos, ry, scale, color, tilt) {
      if (S.n >= S.cap) return;
      _o.position.copy(pos); _o.rotation.set(tilt || 0, ry, 0); _o.scale.setScalar(scale || 1); _o.updateMatrix();
      S.b.setMatrixAt(S.n, _o.matrix); S.t.setMatrixAt(S.n, _o.matrix);
      if (color) S.t.setColorAt(S.n, tmpC.set(color));
      S.n++;
    }
    function flush(S) { S.b.count = S.t.count = S.n; S.b.visible = S.t.visible = S.n > 0; S.b.instanceMatrix.needsUpdate = S.t.instanceMatrix.needsUpdate = true; if (S.t.instanceColor) S.t.instanceColor.needsUpdate = true; S.n = 0; }

    // thân thuyền: mũi nhọn, đuôi vuông, dọc theo trục z
    function hull(k, col, len, wid, h, y) {
      k.box(col, 0, y || 0, -len * 0.1, wid, h, len * 0.8);
      k.add(UCONE(4), col, 0, (y || 0) + h * 0.5, len * 0.3 + len * 0.08, wid * 0.72, len * 0.25, h * 0.72, Math.PI / 4, Math.PI / 2, 0);
    }
    const sail = (kt, x, y, z, w, h) => kt.box('#ffffff', x, y, z, w, h, 0.06);
    const FISHBOAT = [
      (k, kt) => { for (let i = -1; i <= 1; i++) k.cyl('#8f6a46', i * 0.32, 0, 0, 0.15, 2.2, 6); k.add(UCYL(6), '#8f6a46', 0, 0.12, 0, 0.12, 1.2, 0.12, 0, 0, Math.PI / 2); k.cyl('#8a6a4a', 0, 0.15, 0.3, 0.14, 0.5, 6); k.add(SPHG(), '#e8c4a0', 0, 0.68, 0.3, 0.12, 0.12, 0.12); },
      (k, kt) => { hull(k, '#7a5a3a', 2.6, 0.6, 0.35, 0); k.cyl('#6d5139', 0, 0.3, 0, 0.04, 1.6, 5); sail(kt, 0, 0.7, 0.05, 0.9, 0.9); },
      (k, kt) => { hull(k, '#8a6440', 3.2, 0.9, 0.45, 0); k.cyl('#6d5139', 0, 0.4, 0.1, 0.05, 2.2, 5); k.add(UCONE(3), '#ffffff', 0, 0.6, 0.4, 0.05, 1.7, 0.8, Math.PI / 2); },
      (k, kt) => { hull(k, '#5b6f8a', 3.6, 1.0, 0.55, 0); k.cyl('#6d5139', 0, 0.5, 0, 0.05, 2.6, 5); sail(kt, 0, 0.9, 0.06, 1.2, 1.4); k.box('#efe6d2', 0, 0.55, -1.0, 0.8, 0.5, 0.8); },
      (k, kt) => { hull(k, '#3f4650', 4.0, 1.2, 0.7, 0); k.box('#e8e4da', 0, 0.7, -0.7, 0.9, 0.8, 1.0); k.cyl('#7a3a2e', 0, 1.4, -0.7, 0.16, 0.9, 6); kt.box('#ffffff', 0, 0.72, -1.25, 0.5, 0.3, 0.04); },
      (k, kt) => { hull(k, '#d9472f', 4.4, 1.3, 0.8, 0); k.box('#ffffff', 0, 0.8, -0.9, 1.0, 1.0, 1.1); k.box('#3f4650', 0, 1.8, -0.9, 0.06, 1.0, 0.06); k.add(UBOX(), '#e0b23a', 0, 1.0, 0.8, 0.08, 0.08, 1.6, 0, 0.6, 0); kt.box('#ffffff', 0, 1.3, -0.33, 0.7, 0.2, 0.04); },
      (k, kt) => { hull(k, '#2f6b8f', 5.0, 1.4, 0.9, 0); k.box('#f4f6f8', 0, 0.9, -1.1, 1.1, 1.2, 1.3); k.add(SPHG(), '#ffffff', 0, 2.1, -1.1, 0.4, 0.4, 0.4); k.add(UBOX(), '#f2a541', 0, 1.1, 0.9, 0.09, 0.09, 1.8, 0, 0.55, 0); kt.box('#ffffff', 0, 1.5, -0.44, 0.8, 0.22, 0.04); },
      (k, kt) => { for (const sx of [-0.6, 0.6]) k.add(UCYL(8), '#e8ecef', sx, 0.15, 0, 0.3, 3.6, 0.3, 0, Math.PI / 2, 0); k.box('#2b313a', 0, 0.45, 0, 1.5, 0.3, 1.8); k.box('#7ff0ff', 0, 0.76, 0, 1.2, 0.04, 1.4); kt.box('#ffffff', 0, 0.62, -0.92, 1.0, 0.2, 0.04); },
    ];
    const MERCHANT = [null,
      (k, kt) => { hull(k, '#8a6440', 3.6, 1.1, 0.6, 0); k.cyl('#6d5139', 0, 0.5, 0, 0.06, 2.6, 5); sail(kt, 0, 1.0, 0.07, 1.6, 1.4); for (let i = 0; i < 3; i++) k.box('#c8a36a', -0.25 + i * 0.25, 0.6, -0.9, 0.3, 0.3, 0.3); },
      (k, kt) => { hull(k, '#7a5a3a', 4.6, 1.6, 0.9, 0); k.box('#6d5139', 0, 0.9, -1.6, 1.4, 0.6, 1.0); k.cyl('#6d5139', 0, 0.8, 0.2, 0.08, 3.2, 5); sail(kt, 0, 1.6, 0.28, 2.2, 1.7); },
      (k, kt) => { hull(k, '#5a4030', 6.0, 1.8, 1.0, 0); k.box('#3a2a1e', 0, 1.0, -2.2, 1.6, 0.8, 1.2); for (const z of [-1.2, 0.4, 1.8]) { k.cyl('#6d5139', 0, 0.9, z, 0.08, 3.6, 5); k.box('#f4efe2', 0, 1.8, z + 0.07, 2.2, 1.6, 0.06); } kt.box('#ffffff', 0, 4.2, 0.4, 0.6, 0.35, 0.04); },
      (k, kt) => { hull(k, '#2f3540', 6.4, 1.9, 1.1, 0); k.box('#efe6d2', 0, 1.1, -1.8, 1.4, 1.0, 1.6); k.cyl('#c46a2e', 0, 2.1, -1.4, 0.3, 1.4, 8); k.box('#9b8466', 0, 1.1, 1.0, 1.4, 0.5, 2.2); kt.box('#ffffff', 0, 2.2, -2.0, 0.6, 0.3, 0.04); },
      (k, kt) => { hull(k, '#a33a2e', 8.0, 2.2, 1.0, 0); k.box('#ffffff', 0, 1.0, -3.0, 1.8, 1.6, 1.0); const cc = ['#3f7fd6', '#e0b23a', '#3f9a5a', '#e05a6a', '#8e7cc3']; for (let r = 0; r < 2; r++) for (let i = 0; i < 4; i++) k.box(cc[(r * 4 + i) % 5], 0, 1.0 + r * 0.5, -1.6 + i * 1.0, 1.9, 0.48, 0.95); kt.box('#ffffff', 0, 2.65, -3.0, 0.6, 0.3, 0.04); },
      (k, kt) => { hull(k, '#2b3d5a', 10.0, 2.6, 1.2, 0); k.box('#ffffff', 0, 1.2, -4.0, 2.2, 2.2, 1.2); const cc = ['#3f7fd6', '#e0b23a', '#3f9a5a', '#e05a6a', '#8e7cc3', '#f2a541']; for (let r = 0; r < 3; r++) for (let i = 0; i < 6; i++) k.box(cc[(r * 6 + i) % 6], 0, 1.2 + r * 0.5, -2.6 + i * 1.0, 2.3, 0.48, 0.95); kt.box('#ffffff', 0, 3.5, -4.0, 0.7, 0.35, 0.04); },
      (k, kt) => { for (const sx of [-0.9, 0.9]) k.add(UCYL(10), '#f4f7f9', sx, 0.2, 0, 0.45, 7.0, 0.45, 0, Math.PI / 2, 0); k.box('#f4f7f9', 0, 0.7, 0, 2.4, 0.9, 5.4); for (let i = 0; i < 3; i++) k.add(UBOX(), '#24345a', 0, 1.65, -1.8 + i * 1.8, 2.2, 0.05, 1.5, 0, 0.12, 0); k.box('#7ff0ff', 0, 0.75, 2.71, 2.0, 0.12, 0.02); kt.box('#ffffff', 0, 1.0, -2.71, 1.2, 0.3, 0.04); },
    ];
    // chiến thuyền mỗi thời; tàu ngầm hạt nhân
    const WARSHIP = [null,
      (k, kt) => { hull(k, '#6d5139', 5.0, 1.1, 0.6, 0); for (let i = 0; i < 6; i++) for (const sx of [-1, 1]) k.add(UBOX(), '#8f6a46', sx * 0.9, 0.35, -1.6 + i * 0.6, 0.05, 0.05, 1.1, 0, 0, sx * 0.4); k.cyl('#6d5139', 0, 0.5, 0.2, 0.07, 2.6, 5); sail(kt, 0, 1.4, 0.27, 1.8, 1.2); k.add(UCONE(4), '#b08d57', 0, 0.2, 2.7, 0.18, 0.6, 0.18, Math.PI / 4, Math.PI / 2, 0); },
      (k, kt) => { hull(k, '#5a4030', 5.4, 1.8, 1.0, 0); k.box('#6d5139', 0, 1.0, -2.0, 1.6, 0.9, 1.0); k.box('#6d5139', 0, 1.0, 1.6, 1.4, 0.6, 0.8); k.cyl('#6d5139', 0, 0.9, 0, 0.09, 3.6, 5); sail(kt, 0, 2.0, 0.1, 2.4, 2.0); },
      (k, kt) => { hull(k, '#3a2a1e', 7.0, 2.2, 1.4, 0); for (let r = 0; r < 2; r++) for (let i = 0; i < 7; i++) for (const sx of [-1, 1]) k.box('#1a1a1a', sx * 1.11, 0.5 + r * 0.45, -2.6 + i * 0.75, 0.04, 0.22, 0.3); k.box('#e0b23a', 0, 1.4, -2.9, 2.1, 0.12, 1.0); for (const z of [-1.6, 0.3, 2.0]) { k.cyl('#5b4630', 0, 1.4, z, 0.1, 4.2, 5); k.box('#f4efe2', 0, 2.4, z + 0.08, 2.4, 1.8, 0.06); } kt.box('#ffffff', 0, 5.2, 0.3, 0.8, 0.45, 0.04); },
      (k, kt) => { hull(k, '#4a4d52', 7.4, 2.2, 1.2, 0); k.box('#6b6e73', 0, 1.2, -0.6, 1.4, 1.1, 2.0); for (const z of [-0.9, 0.0]) k.cyl('#2f3540', 0, 2.3, z, 0.28, 1.4, 8); for (const z of [-2.6, 2.0]) { k.cyl('#5d5f63', 0, 1.2, z, 0.55, 0.45, 10); k.add(UCYL(6), '#2f3540', 0, 1.45, z + (z > 0 ? 0.9 : -0.9), 0.08, 1.6, 0.08, 0, Math.PI / 2, 0); } k.box('#3f4650', 0, 2.3, -0.4, 0.06, 1.8, 0.06); kt.box('#ffffff', 0, 3.8, -0.4, 0.6, 0.35, 0.04); },
      (k, kt) => { hull(k, '#7d848c', 8.0, 2.0, 1.1, 0); k.box('#9aa0a6', 0, 1.1, -0.8, 1.5, 1.4, 2.6); k.add(UCONE(4), '#9aa0a6', 0, 2.5, -0.8, 0.5, 1.6, 0.5, Math.PI / 4); k.add(UBOX(), '#2f3540', 0, 3.4, -0.8, 1.4, 0.08, 0.08); k.cyl('#5d5f63', 0, 1.1, 2.0, 0.45, 0.4, 10); k.add(UCYL(6), '#2f3540', 0, 1.3, 2.8, 0.07, 1.3, 0.07, 0, Math.PI / 2, 0); for (let i = 0; i < 4; i++) k.box('#3f4650', -0.3 + (i % 2) * 0.6, 1.1, 0.8 + Math.floor(i / 2) * 0.4, 0.35, 0.12, 0.3); kt.box('#ffffff', 0, 2.2, -2.15, 0.7, 0.4, 0.04); },
      (k, kt) => { hull(k, '#6b737c', 9.4, 2.3, 1.2, 0); k.box('#8f969e', 0, 1.2, -1.2, 1.8, 1.8, 3.2); k.add(SPHG(), '#f4f6f8', 0, 3.0, -1.2, 0.7, 0.7, 0.7); for (let i = 0; i < 8; i++) k.box('#2b313a', -0.45 + (i % 2) * 0.9, 1.2, 1.2 + Math.floor(i / 2) * 0.55, 0.6, 0.1, 0.4); k.cyl('#5d5f63', 0, 1.2, 3.6, 0.4, 0.4, 10); kt.box('#ffffff', 0, 2.8, -2.81, 0.8, 0.45, 0.04); },
      (k, kt) => { k.add(UCONE(4), '#2b313a', 0, 0.4, 0, 1.3, 9.0, 0.9, Math.PI / 4, Math.PI / 2, 0); k.box('#20252c', 0, 0.2, -0.6, 2.0, 0.7, 6.0); k.add(UCONE(4), '#2b313a', 0, 0.9, -0.8, 1.0, 1.6, 2.2, Math.PI / 4); k.box('#7ff0ff', 0, 0.56, -0.6, 2.02, 0.05, 5.0); k.box('#7ff0ff', 0, 2.0, -0.8, 0.5, 0.05, 0.5); kt.box('#ffffff', 0, 0.9, -3.61, 1.4, 0.12, 0.04); },
    ];
    const SUB7 = (k, kt) => { k.add(UCYL(12), '#1c2128', 0, 0, -2.8, 0.6, 5.6, 0.6, 0, Math.PI / 2, 0); k.add(SPHG(), '#1c2128', 0, 0, 2.8, 0.6, 0.6, 1.4, 0, Math.PI / 2, 0); for (const z of [-2, 0, 2]) k.add(TORUS(), '#7ff0ff', 0, 0, z, 0.62, 0.62, 0.62); k.box('#1c2128', 0, 0.35, 0.4, 0.2, 0.8, 1.6); kt.box('#ffffff', 0, 0.8, 0.4, 0.22, 0.14, 1.62); };
    const DRONES = (k, kt) => { for (const [x, z] of [[0, 0.6], [-0.7, -0.5], [0.7, -0.5]]) { k.box('#2b313a', x, 0, z, 0.32, 0.14, 0.32); for (const [ax, az] of [[-0.24, -0.24], [0.24, -0.24], [-0.24, 0.24], [0.24, 0.24]]) { k.add(UBOX(), '#2b313a', x + ax / 2, 0.05, z + az / 2, 0.05, 0.05, 0.36, Math.atan2(ax, az)); k.cyl('#7ff0ff', x + ax, 0.08, z + az, 0.13, 0.02, 10); } kt.box('#ffffff', x, 0.15, z, 0.2, 0.04, 0.2); k.box('#ff4d4d', x, -0.08, z + 0.17, 0.06, 0.04, 0.02); } };
    const SUB = (k, kt) => { k.add(UCYL(10), '#2b3138', 0, 0, -3.0, 0.7, 6.0, 0.7, 0, Math.PI / 2, 0); k.add(SPHG(), '#2b3138', 0, 0, 3.0, 0.7, 0.7, 1.2, 0, Math.PI / 2, 0); k.box('#2b3138', 0, 0.4, 0.6, 0.35, 1.3, 1.3); kt.box('#ffffff', 0, 1.2, 0.6, 0.38, 0.18, 1.32); };
    // lính bộ theo thời đại: đầu, mũ, áo, vũ khí; lá cờ nhỏ sau lưng mang màu phe
    const SKIN = '#e8c4a0';
    function trooper(k, kt, cls, e) {
      const coat = ['#8a6a4a', '#c9a46e', '#9aa0a6', '#ffffff', '#7a7a52', '#5a6b4a'][e];
      for (const sx of [-0.1, 0.1]) k.box(e >= 4 ? '#4a4a3a' : '#5b4630', sx, 0, 0, 0.13, 0.42, 0.15);
      if (e === 3) kt.box('#ffffff', 0, 0.4, 0, 0.42, 0.52, 0.26); else k.box(coat, 0, 0.4, 0, 0.42, 0.52, 0.26);
      k.add(ICO(), SKIN, 0, 0.98, 0, 0.15, 0.16, 0.15);
      const helm = [null, '#b08d57', '#9aa0a6', '#1a1a1a', '#6b6b45', '#4f5a3f'][e];
      if (helm) { if (e === 3) k.cyl(helm, 0, 1.02, 0, 0.16, 0.26, 8); else k.add(SPHG(), helm, 0, 1.0, 0, 0.18, 0.13, 0.18); }
      if (e === 1) k.box('#c0392b', 0, 1.13, 0, 0.04, 0.12, 0.26);
      if (e === 5) k.box('#3f4a35', 0, 0.42, 0.02, 0.46, 0.36, 0.3);
      kt.cyl('#ffffff', 0, 0.6, -0.18, 0.02, 0.9, 4); kt.box('#ffffff', 0.12, 1.28, -0.18, 0.24, 0.16, 0.02);
      if (cls === 'melee') {
        if (e === 0) { k.add(UCYL(5), '#6d5139', 0.28, 0.5, 0.15, 0.04, 0.6, 0.04, 0, 0.5, 0); k.add(DOD(), '#7d7a74', 0.28, 0.98, 0.42, 0.1, 0.1, 0.1); }
        else if (e === 1) { k.add(UCYL(5), '#6d5139', 0.26, 0.2, 0.1, 0.025, 1.4, 0.025); k.cone('#b08d57', 0.26, 1.6, 0.1, 0.05, 0.16, 4); kt.add(UCYL(10), '#ffffff', -0.26, 0.45, 0.08, 0.2, 0.05, 0.2, 0, 0, Math.PI / 2); }
        else if (e === 2) { k.box('#dfe6ea', 0.28, 0.45, 0.2, 0.04, 0.6, 0.06); kt.box('#ffffff', -0.27, 0.32, 0.06, 0.05, 0.42, 0.3); }
        else { k.add(UBOX(), e >= 4 ? '#2f3540' : '#5b4630', 0.2, 0.55, 0.18, 0.05, 0.05, 0.9, 0, -0.3, 0); if (e === 3) k.box('#dfe6ea', 0.2, 0.42, 0.66, 0.02, 0.02, 0.22); }
      } else {
        if (e === 0) k.add(DOD(), '#7d7a74', 0.26, 0.42, 0.12, 0.07, 0.07, 0.07);
        else if (e === 1) { for (let i = -1; i <= 1; i++) k.add(UBOX(), '#6d5139', 0.27, 0.65 + i * 0.22, 0.2 - Math.abs(i) * 0.08, 0.03, 0.26, 0.03, 0, i * 0.5, 0); k.cyl('#8f6a46', -0.12, 0.45, -0.16, 0.06, 0.4, 5); }
        else if (e === 2) { k.box('#6d5139', 0.12, 0.62, 0.3, 0.06, 0.06, 0.5); k.box('#5b4630', 0.12, 0.62, 0.5, 0.42, 0.04, 0.04); }
        else if (e === 3) k.add(UBOX(), '#5b4630', 0.2, 0.5, 0.2, 0.05, 0.05, 1.0, 0, -0.15, 0);
        else if (e === 4) { k.box('#2f3540', 0.15, 0.55, 0.2, 0.1, 0.12, 0.7); k.cyl('#2f3540', 0.15, 0.4, 0.5, 0.02, 0.2, 4); }
        else { k.add(UCYL(8), '#4f5a3f', 0.2, 0.92, -0.3, 0.09, 1.1, 0.09, 0, Math.PI / 2, 0); }
      }
    }
    function horse(k, col, cloth) {
      for (const [x, z] of [[-0.18, 0.45], [0.18, 0.45], [-0.18, -0.45], [0.18, -0.45]]) k.box('#3a2a1e', x, 0, z, 0.1, 0.55, 0.1);
      k.box(col, 0, 0.5, 0, 0.42, 0.42, 1.2);
      k.add(UBOX(), col, 0, 0.75, 0.62, 0.2, 0.55, 0.22, 0, -0.6, 0); k.box(col, 0, 1.08, 0.86, 0.18, 0.2, 0.36);
      if (cloth) cloth.box('#ffffff', 0, 0.38, 0, 0.48, 0.42, 1.0);
    }
    // thú cưỡi riêng của mỗi miền: ngựa ở đồng bằng và bờ biển, hươu sừng ở rừng, dê núi, voi ma mút ở băng nguyên, lạc đà ở sa mạc
    function mountBeast(k, ter, col, cloth) {
      if (ter === 'tundra') { for (const [x, z] of [[-0.3, 0.55], [0.3, 0.55], [-0.3, -0.55], [0.3, -0.55]]) k.cyl('#5b3a22', x, 0, z, 0.15, 0.75, 6); k.add(SPHG(), '#6b4a32', 0, 0.55, 0, 0.62, 0.75, 0.95); k.add(ICO(), '#6b4a32', 0, 1.0, 0.85, 0.36, 0.36, 0.36); for (const sx of [-0.18, 0.18]) k.add(UCONE(5), '#efe6d2', sx, 0.75, 1.05, 0.06, 0.6, 0.06, 0, -1.2, 0); k.add(UCYL(5), '#6b4a32', 0, 0.3, 1.1, 0.09, 0.6, 0.09); if (cloth) cloth.box('#ffffff', 0, 1.05, 0, 0.9, 0.08, 1.0); return 0.75; }
      if (ter === 'desert') { for (const [x, z] of [[-0.16, 0.42], [0.16, 0.42], [-0.16, -0.42], [0.16, -0.42]]) k.box('#b8925f', x, 0, z, 0.09, 0.8, 0.09); k.box(col === '#7a5a3a' ? '#c9a06e' : col, 0, 0.75, 0, 0.42, 0.42, 1.1); k.add(SPHG(), '#c9a06e', 0, 1.15, -0.1, 0.25, 0.3, 0.3); k.add(UBOX(), '#c9a06e', 0, 1.0, 0.6, 0.16, 0.6, 0.18, 0, -0.5, 0); k.box('#c9a06e', 0, 1.42, 0.86, 0.16, 0.18, 0.32); if (cloth) cloth.box('#ffffff', 0, 0.7, 0, 0.46, 0.3, 0.8); return 0.4; }
      if (ter === 'mountain') { for (const [x, z] of [[-0.14, 0.32], [0.14, 0.32], [-0.14, -0.32], [0.14, -0.32]]) k.box('#3a2a1e', x, 0, z, 0.08, 0.42, 0.08); k.box('#d9d2c2', 0, 0.4, 0, 0.34, 0.34, 0.85); k.box('#d9d2c2', 0, 0.72, 0.48, 0.18, 0.2, 0.28); for (const sx of [-0.08, 0.08]) k.add(TORUS(), '#8a8174', sx, 0.86, 0.42, 0.08, 0.08, 0.2, Math.PI / 2, 0, 0); if (cloth) cloth.box('#ffffff', 0, 0.3, 0, 0.4, 0.34, 0.7); return -0.15; }
      horse(k, col, cloth);
      if (ter === 'forest') for (const sx of [-1, 1]) { k.add(UBOX(), '#c8b07a', sx * 0.12, 1.2, 0.86, 0.04, 0.4, 0.04, 0, 0, sx * 0.5); k.add(UBOX(), '#c8b07a', sx * 0.2, 1.36, 0.86, 0.03, 0.2, 0.03, 0, 0.5, sx * 0.9); }
      return 0;
    }
    function mounted(k, kt, e, ter) {
      ter = ter || 'plains';
      if (e >= 1 && e <= 3 && ter !== 'plains' && ter !== 'coast') { // kỵ sĩ trên thú của miền
        const lift = mountBeast(k, ter, e === 2 ? '#d9d2c2' : '#7a5a3a', kt), y0 = 0.95 + lift;
        k.box(e >= 2 ? '#9aa0a6' : '#c9a46e', 0, y0, -0.1, 0.36, 0.45, 0.26); kt.box('#ffffff', 0, y0, -0.1, 0.38, 0.46, 0.27);
        k.add(ICO(), SKIN, 0, y0 + 0.55, -0.1, 0.15, 0.16, 0.15); k.add(SPHG(), ter === 'desert' ? '#ffffff' : ter === 'tundra' ? '#e8e0d0' : '#4a3426', 0, y0 + 0.56, -0.1, 0.18, 0.13, 0.18);
        if (ter === 'desert' || e === 1) { for (let i = -1; i <= 1; i++) k.add(UBOX(), '#6d5139', -0.25, y0 + 0.2 + i * 0.2, 0.05, 0.025, 0.24, 0.025, 0, i * 0.5, 0); }
        else k.add(UCYL(5), '#d9c9a8', 0.3, y0 + 0.05, 0.2, 0.03, 1.8, 0.03, 0, Math.PI / 2 - 0.2, 0);
        return;
      }
      if (e === 1) {
        horse(k, '#7a5a3a'); for (const sx of [-0.5, 0.5]) k.add(UCYL(10), '#5b4630', sx, 0.45, -1.1, 0.42, 0.06, 0.42, 0, 0, Math.PI / 2);
        k.box('#8f6a46', 0, 0.4, -1.1, 0.9, 0.2, 0.7); k.box('#8f6a46', 0, 0.6, -0.8, 0.9, 0.4, 0.06);
        k.box('#c9a46e', 0, 0.6, -1.15, 0.36, 0.5, 0.26); k.add(ICO(), SKIN, 0, 1.2, -1.15, 0.14, 0.15, 0.14); kt.cyl('#ffffff', 0.3, 0.6, -1.4, 0.02, 1.2, 4); kt.box('#ffffff', 0.45, 1.6, -1.4, 0.3, 0.2, 0.02);
      } else if (e <= 3) {
        horse(k, e === 2 ? '#d9d2c2' : '#5b3a28', kt);
        k.box(e === 2 ? '#9aa0a6' : '#ffffff', 0, 0.95, -0.1, 0.36, 0.45, 0.26); if (e === 3) kt.box('#ffffff', 0, 0.95, -0.1, 0.38, 0.46, 0.27);
        k.add(ICO(), SKIN, 0, 1.5, -0.1, 0.14, 0.15, 0.14); k.add(SPHG(), e === 2 ? '#9aa0a6' : '#1a1a1a', 0, 1.5, -0.1, 0.17, 0.12, 0.17);
        if (e === 2) k.add(UCYL(5), '#d9c9a8', 0.3, 1.0, 0.2, 0.03, 1.8, 0.03, 0, Math.PI / 2 - 0.2, 0); else k.box('#dfe6ea', 0.28, 1.0, 0.2, 0.03, 0.03, 0.6);
      } else if (e === 4) {
        k.box('#5f6b4a', 0, 0.35, 0, 1.0, 0.6, 1.8); k.box('#55613f', 0, 0.95, -0.2, 0.6, 0.35, 0.7); k.add(UCYL(6), '#2f3540', 0, 1.1, 0.4, 0.05, 0.7, 0.05, 0, Math.PI / 2, 0);
        for (const [x, z] of [[-0.55, 0.6], [0.55, 0.6], [-0.55, -0.6], [0.55, -0.6]]) k.add(UCYL(8), '#1a1a1a', x, 0.3, z, 0.28, 0.16, 0.28, 0, 0, Math.PI / 2);
        kt.cyl('#ffffff', 0.35, 1.2, -0.6, 0.015, 0.8, 4); kt.box('#ffffff', 0.47, 1.85, -0.6, 0.24, 0.16, 0.02);
      } else if (e <= 6) {
        k.box('#55613f', 0, 0.3, 0, 1.3, 0.45, 2.2); for (const sx of [-0.62, 0.62]) k.box('#2a2a2a', sx, 0.05, 0, 0.3, 0.42, 2.3);
        k.box('#5f6b4a', 0, 0.75, -0.15, 0.9, 0.35, 1.0); k.add(UCYL(8), '#3f4a35', 0, 0.92, 0.9, 0.07, 1.5, 0.07, 0, Math.PI / 2, 0);
        if (e === 6) for (const sx of [-0.55, 0.55]) { k.box('#e8ecef', sx, 0.85, -0.2, 0.22, 0.26, 0.9); k.box('#e05a6a', sx, 0.85, 0.27, 0.2, 0.2, 0.06); }
        kt.box('#ffffff', 0, 0.76, -0.66, 0.92, 0.1, 0.06); kt.cyl('#ffffff', -0.35, 0.9, -0.5, 0.015, 0.8, 4); kt.box('#ffffff', -0.23, 1.55, -0.5, 0.24, 0.16, 0.02);
      } else { // cỗ máy bọc thép đi hai chân
        for (const sx of [-0.4, 0.4]) { k.box('#5d6670', sx, 0, 0.1, 0.28, 0.9, 0.36); k.box('#3a3f48', sx, 0, 0.25, 0.36, 0.12, 0.6); k.box('#5d6670', sx, 0.85, -0.05, 0.3, 0.6, 0.3); }
        k.box('#8f99a3', 0, 1.4, 0, 1.1, 0.7, 0.9); k.box('#7ff0ff', 0, 1.65, 0.46, 0.5, 0.12, 0.02);
        for (const sx of [-0.68, 0.68]) { k.box('#5d6670', sx, 1.35, 0.2, 0.26, 0.3, 0.7); k.add(UCYL(8), '#2b313a', sx, 1.45, 0.55, 0.08, 0.9, 0.08, 0, Math.PI / 2, 0); }
        kt.box('#ffffff', 0, 1.8, -0.1, 0.9, 0.12, 0.6); kt.box('#ffffff', 0, 1.42, -0.46, 0.7, 0.4, 0.02);
      }
    }
    function siegeM(k, kt, e) {
      const wheels = (z, r) => { for (const sx of [-0.55, 0.55]) k.add(UCYL(10), '#3a2a1e', sx, r, z, r, 0.1, r, 0, 0, Math.PI / 2); };
      if (e === 1) { k.box('#6d5139', 0, 0.3, 0, 1.0, 0.12, 2.0); k.gable('#8a6a46', 0, 0.42, 0, 2.0, 0.8, 1.2, Math.PI / 2); k.add(UCYL(8), '#5b4630', 0, 0.55, 0.3, 0.16, 2.4, 0.16, 0, Math.PI / 2, 0); wheels(0.7, 0.3); wheels(-0.7, 0.3); kt.box('#ffffff', 0, 1.3, -0.8, 0.3, 0.22, 0.03); }
      else if (e === 2) { k.box('#6d5139', 0, 0.3, 0, 1.1, 0.15, 1.8); for (const sx of [-0.4, 0.4]) { k.add(UBOX(), '#6d5139', sx, 0.3, 0.3, 0.1, 1.5, 0.1, 0, 0.35, 0); k.add(UBOX(), '#6d5139', sx, 0.3, -0.3, 0.1, 1.5, 0.1, 0, -0.35, 0); } k.add(UBOX(), '#8f6a46', 0, 1.6, 0, 0.1, 0.1, 2.4, 0, 0.5, 0); k.box('#7d7a74', 0, 0.9, -0.6, 0.4, 0.4, 0.4); wheels(0.6, 0.25); wheels(-0.6, 0.25); kt.box('#ffffff', 0.4, 1.7, 0, 0.03, 0.22, 0.3); }
      else if (e === 3) { k.box('#6d5139', 0, 0.3, -0.2, 0.5, 0.25, 1.2); k.add(UCYL(10), '#2b2b2b', 0, 0.62, 0.2, 0.15, 1.5, 0.15, 0, Math.PI / 2 - 0.12, 0); wheels(0, 0.42); kt.cyl('#ffffff', 0, 0.3, -0.8, 0.015, 1.0, 4); kt.box('#ffffff', 0.12, 1.2, -0.8, 0.24, 0.16, 0.02); }
      else if (e === 4) { for (const sx of [-0.25, 0.25]) k.add(UBOX(), '#4f5a3f', sx, 0.15, -0.8, 0.1, 0.1, 1.4, 0, 0, sx); k.box('#5f6b4a', 0, 0.45, 0.1, 1.0, 0.7, 0.08); k.add(UCYL(10), '#3f4a35', 0, 0.75, 0.6, 0.12, 2.0, 0.12, 0, Math.PI / 2 - 0.35, 0); wheels(0, 0.4); kt.box('#ffffff', 0, 0.9, 0.06, 0.4, 0.16, 0.02); }
      else if (e === 5) { k.box('#55613f', 0, 0.3, 0, 1.3, 0.5, 2.4); for (const sx of [-0.62, 0.62]) k.box('#2a2a2a', sx, 0.05, 0, 0.3, 0.42, 2.5); k.box('#5f6b4a', 0, 0.8, -0.3, 1.1, 0.6, 1.3); k.add(UCYL(10), '#3f4a35', 0, 1.1, 0.9, 0.11, 2.6, 0.11, 0, Math.PI / 2 - 0.25, 0); kt.box('#ffffff', 0, 1.41, -0.3, 0.6, 0.06, 0.6); }
      else if (e >= 7) { k.box('#2b313a', 0, 0.2, 0, 1.4, 0.4, 2.4); for (const sx of [-0.3, 0.3]) { k.box('#9aa3ad', sx, 0.6, 0.6, 0.16, 0.2, 3.4); k.box('#7ff0ff', sx, 0.72, 0.6, 0.06, 0.04, 3.4); } k.box('#5d6670', 0, 0.6, -0.8, 1.0, 0.6, 0.8); for (let i = 0; i < 3; i++) k.cyl('#7ff0ff', -0.35 + i * 0.35, 0.9, -0.8, 0.12, 0.3, 8); kt.box('#ffffff', 0, 0.42, -1.21, 1.0, 0.2, 0.02); }
      else { k.box('#5f6b4a', 0, 0.45, 0.9, 1.2, 0.9, 0.9); k.box('#4f5a3f', 0, 0.35, -0.4, 1.2, 0.3, 1.9); k.add(UBOX(), '#6b7a55', 0, 0.6, -0.6, 1.0, 0.6, 1.8, 0, 0.45, 0); for (let i = 0; i < 4; i++) k.box('#e8e8e8', -0.32 + (i % 2) * 0.64, 1.25, -0.5 - Math.floor(i / 2) * 0.35, 0.3, 0.3, 0.3); for (const z of [0.9, 0.0, -0.9]) for (const sx of [-0.6, 0.6]) k.add(UCYL(8), '#1a1a1a', sx, 0.28, z, 0.28, 0.14, 0.28, 0, 0, Math.PI / 2); kt.box('#ffffff', 0, 0.92, 1.36, 0.5, 0.2, 0.02); }
    }
    // Lính bộ là người tròn có khớp (dựng trong lands3d): tay phải cầm vũ khí của miền, khiên ở tay trái, cờ phe sau lưng
    function soldierShape(k, cls, e, ter) { F.soldierShape(k, cls, e, ter); }
    const SOLDIER_SETS = {}, extraSoldiers = [];
    const putSoldier = (cls, e, ter, p, ry, walk, atk, seed, scale, colors, tilt) => F.crowdPut(soldierSet(cls, e, ter), 0, p, ry, walk, atk, seed, scale || (e >= 7 ? 1.35 : 1.15), colors, tilt);
    const terOf = (u) => { const c = W.cities[u.city]; return c ? c.terrain.key : 'plains'; };
    function soldierSet(cls, e, ter) {
      const key = cls + ':' + e + ':' + (ter || 'plains');
      if (SOLDIER_SETS[key]) return SOLDIER_SETS[key];
      const cap = 300, mat = F.figMaterial(), k = new F.FigKit(); soldierShape(k, cls, e, ter || 'plains');
      const geo = k.bake(), m = new THREE.InstancedMesh(geo, mat, cap);
      geo.setAttribute('anim', new THREE.InstancedBufferAttribute(new Float32Array(cap * 4), 4));
      for (const a of ['cA', 'cB', 'cC', 'cD']) geo.setAttribute(a, new THREE.InstancedBufferAttribute(new Float32Array(cap * 3).fill(1), 3));
      m.count = 0; m.castShadow = true; m.frustumCulled = false; m.raycast = () => {}; scene.add(m);
      return (SOLDIER_SETS[key] = { meshes: [m], cap, e, n: [0] });
    }
    const PANTS = ['#7a5a3a', '#c9a46e', '#5b4630', '#efe6d2', '#6b6b45', '#4f5a3f', '#5d6670', '#2b313a', '#eef3f7', '#fff3e0', '#c9b6ff', '#fff6dc'];
    const HELMS = ['#2b1d14', '#b08d57', '#9aa0a6', '#1a1a1a', '#6b6b45', '#4f5a3f', '#e8ecef', '#ff4d4d', '#bff6ff', '#ffb347', '#b48cff', '#fff3c4'];
    const squadSize = (u) => (u.cls === 'melee' ? (u.era >= 7 ? 3 : 5) : 4);
    const FORM = [[0, 0.35], [-0.6, 0], [0.6, 0], [-0.3, -0.65], [0.3, -0.65], [0, -1.2]];
    const corpses = [];
    const isFig = (u) => (u.cls === 'melee' || u.cls === 'ranged') && !(u.cls === 'ranged' && (u.era === 7 || u.era === 8));
    const MODELS = {};
    const keyOf = (u) => u.cls + ':' + u.era + (u.cls === 'mounted' && u.era >= 1 && u.era <= 3 ? ':' + terOf(u) : '');
    function modelOf(key) {
      if (MODELS[key]) return MODELS[key];
      const [cls, es, tk] = key.split(':'), eReal = +es, e = E7(eReal);
      let geos, cap = 48;
      if (cls === 'ranged' && e >= 7) { geos = bake2(DRONES); cap = 40; }
      else if (cls === 'melee' || cls === 'ranged') geos = bake2((k, kt) => trooper(k, kt, cls, Math.min(5, e)));
      else if (cls === 'mounted') geos = bake2((k, kt) => mounted(k, kt, e, tk));
      else if (cls === 'siege') geos = bake2((k, kt) => siegeM(k, kt, e));
      else if (cls === 'ship') { geos = bake2(WARSHIP[e]); cap = 24; }
      else if (cls === 'sub') { geos = bake2(e >= 7 ? SUB7 : SUB); cap = 8; }
      else if (cls === 'fish') { geos = bake2(FISHBOAT[e]); cap = 40; }
      else if (cls === 'trade') { geos = bake2(MERCHANT[Math.max(1, e)]); cap = 20; }
      if (BEY_TINT[eReal]) recolorG(geos.body, BEY_TINT[eReal][0], BEY_TINT[eReal][1]);
      MODELS[key] = instSet(geos, cap);
      return MODELS[key];
    }

    /* =============== Cá và thú biển =============== */
    const fishGeo = (() => { const k = new Kit(); k.add(UCONE(5), '#ffffff', 0, 0, 0.25, 0.14, 0.6, 0.09, 0, Math.PI / 2, 0); k.add(UCONE(3), '#ffffff', 0, 0, -0.28, 0.16, 0.25, 0.04, 0, -Math.PI / 2, 0); return k.bake().body; })();
    const FISH_N = 7 * 22;
    const fishMesh = new THREE.InstancedMesh(fishGeo, new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.4, metalness: 0.4 }), FISH_N);
    for (let i = 0; i < FISH_N; i++) fishMesh.setColorAt(i, C('#c9d6de'));
    fishMesh.count = 0; fishMesh.frustumCulled = false; fishMesh.raycast = () => {}; scene.add(fishMesh);
    const fish = [];
    for (let z = 0; z < 7; z++) for (let i = 0; i < 22; i++) fish.push({ z, i, r: (z === 6 ? 6 : 2.5) + hash(z * 40 + i) * (z === 6 ? 16 : 8.5), ph: hash(z * 9 + i * 3) * TAU, w: (0.18 + hash(i + z) * 0.2) * (hash(i * 7 + z) < 0.5 ? 1 : -1), d: -1.0 - hash(i * 13 + z) * 1.6, kind: 'anchovy' });
    const want = { anchovy: [0, 0, 0, 0, 0, 0, 0], mackerel: [0, 0, 0, 0, 0, 0, 0], tuna: [0, 0, 0, 0, 0, 0, 0] };
    function bigBuild(fn) { const k = new Kit(); fn(k); const m = new THREE.Mesh(k.bake().body, bodyMat); m.castShadow = true; const g = new THREE.Group(); g.add(m); g.visible = false; scene.add(g); return g; }
    const whales = [0, 1, 2].map((i) => ({ g: bigBuild((k) => { k.add(SPHG(), '#3b4a5c', 0, 0, 0, 1.3, 1.0, 3.6); k.add(DOME(10), '#cfd6dc', 0, 0, 0, 1.25, -0.5, 3.4); k.add(UBOX(), '#3b4a5c', 0, 0.1, -4.0, 2.6, 0.12, 0.8, 0, 0, 0); k.box('#3b4a5c', 0.9, -0.2, 0.8, 1.2, 0.08, 0.5); k.box('#3b4a5c', -0.9, -0.2, 0.8, 1.2, 0.08, 0.5); }), ph: i * 2.1, r: 10 + i * 4, spout: 0 }));
    const sharks = [0, 1, 2].map((i) => ({ g: bigBuild((k) => { k.add(UCONE(3), '#5d6b78', 0, 0, 0, 0.35, 0.9, 0.08); k.add(UCYL(6), '#5d6b78', 0, -0.35, 0, 0.3, 1.8, 0.3, 0, Math.PI / 2, 0); }), ph: i * 2.3 + 1, r: 6 + i * 5 }));
    const turtles = [0, 1, 2, 3, 4, 5].map((i) => ({ g: bigBuild((k) => { k.dome('#6b7a3f', 0, 0, 0, 0.55, 0.45, 8); k.box('#8a9a5a', 0, 0.02, 0.6, 0.25, 0.18, 0.3); for (const [x, z] of [[-0.55, 0.25], [0.55, 0.25], [-0.4, -0.35], [0.4, -0.35]]) k.box('#8a9a5a', x, 0.02, z, 0.4, 0.06, 0.18); }), zone: i < 3 ? 4 : 1, ph: i * 1.7, r: 3 + (i % 3) * 2.5 }));
    const seals = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => ({ g: bigBuild((k) => { k.add(OCTF(), '#f1f6f9', 0, -0.25, 0, 1.4, 0.35, 1.2); k.add(SPHG(), '#6c6a66', 0, 0.1, 0, 0.3, 0.35, 0.65); k.add(SPHG(), '#6c6a66', 0, 0.2, 0.55, 0.2, 0.22, 0.22); }), zone: i < 5 ? 3 : 2, ph: i * 1.3 }));
    function OCTF() { return new THREE.CylinderGeometry(1, 1, 1, 6); }
    const squid = { g: bigBuild((k) => { for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU; k.add(UCYL(5), '#b0485a', Math.cos(a) * 0.6, 0, Math.sin(a) * 0.6, 0.12, 2.4, 0.12, 0, Math.cos(a) * 0.5, Math.sin(a) * 0.5); } k.add(UCONE(8), '#c25a6a', 0, 0, 0, 0.7, 1.4, 0.7); }) };
    const pearls = [];
    for (const z of [5, 4, 0]) for (let i = 0; i < 6; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: '#fff6d6', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })); const c = zoneC(z), a = hash(z * 17 + i) * TAU, r = 3 + hash(z + i * 5) * 7; s.position.set(c.x + Math.cos(a) * r, -3.0, c.z + Math.sin(a) * r); s.scale.setScalar(1.1); scene.add(s); pearls.push({ s, z, i, ph: hash(i * 3 + z) * 6 }); }
    const stockFrac = (z, key) => { const s = Sim.SPECIES.findIndex((x) => x.key === key); return s < 0 ? 0 : W.sea.stock[z][s] / Sim.SPECIES[s].K; };

    /* =============== Thuyền cá và tàu buôn =============== */
    const boats = []; // { city, slot, state, t0, from, to, dur, spot }
    const ships = []; // tàu buôn đang chạy
    function syncBoats() {
      for (const L of lands) {
        const c = W.cities[L.i], f = c.settled ? Sim.fisheryOf(c) : null;
        const n = f ? Math.min(6, Math.ceil(f.workers.length / 2)) : 0;
        const mine = boats.filter((b) => b.city === L.i);
        for (let k = mine.length; k < n; k++) boats.push({ city: L.i, slot: k, state: 'dock', t0: performance.now() + Math.random() * 4000, dur: 1 });
        for (let k = n; k < mine.length; k++) mine[k].retire = true;
      }
      for (let i = boats.length - 1; i >= 0; i--) if (boats[i].retire && boats[i].state === 'dock') boats.splice(i, 1);
    }
    function spawnShip(t) {
      const A = W.cities[t.from], Z = W.cities[t.to];
      if (!A.settled || !Z.settled || ships.length > 22) return;
      const a = portWater(lands[t.from]), b = portWater(lands[t.to]), ctrl = a.clone().add(b).multiplyScalar(0.5).multiplyScalar(0.55).setY(SEA_Y);
      ships.push({ a, b, ctrl, t0: performance.now(), dur: (a.distanceTo(b) / 7) * 1000 + 2500, era: Math.max(1, Math.min(A.era, Z.era)), color: K.factionColor(A.owner) });
    }
    const bez = (a, c, b, u, out) => out.set((1 - u) * (1 - u) * a.x + 2 * (1 - u) * u * c.x + u * u * b.x, (SEA_Y + seaDy), (1 - u) * (1 - u) * a.z + 2 * (1 - u) * u * c.z + u * u * b.z);

    /* =============== Công trình theo miền và thời đại =============== */
    const BLD_OF = {}; // khoá "city:type" -> { g, key }
    function scaffold(k, w, d, h) { for (const [x, z] of [[-w / 2, -d / 2], [w / 2, -d / 2], [-w / 2, d / 2], [w / 2, d / 2]]) k.cyl('#c8b07a', x, 0, z, 0.07, h, 5); for (let y = 1; y < h; y += 1.4) { k.box('#c8b07a', 0, y, -d / 2, w, 0.07, 0.07); k.box('#c8b07a', 0, y, d / 2, w, 0.07, 0.07); } }
    const flagPole = (k, x, z, h) => k.cyl('#5b4630', x, 0, z, 0.06, h, 5);
    function buildModel(type, k, S, e, ter) {
      const out = {};
      if (type === 'barracks') {
        if (e === 0) { styHall(k, S, 0, -1.2, 2.4, 1.4, 1.8); k.cyl('#5b4630', 0.6, 0, 1.2, 0.5, 0.15, 8); k.add(DOD(), '#ff8a3d', 0.6, 0.2, 1.2, 0.25, 0.25, 0.25); for (let i = 0; i < 3; i++) { k.cyl('#6d5139', -1.6 + i * 0.7, 0, 1.6, 0.08, 1.4, 5); k.box('#6d5139', -1.6 + i * 0.7, 1.0, 1.6, 0.5, 0.08, 0.08); } }
        else { const h = styHall(k, S, 0, -1.0, e >= 3 ? 4.8 : 4.2, e === 3 ? 3.0 : 2.0, 2.4); void h; k.box(S.base, 0, 0, 1.6, 4.8, 0.06, 2.6); if (e <= 2) for (let i = 0; i <= 8; i++) k.cyl('#6d5139', -2.4 + i * 0.6, 0, 2.9, 0.06, 0.9, 5); if (e >= 4) for (const sx of [-1.6, 1.6]) k.box('#b8a37a', sx, 0, 2.4, 1.4, 0.6, 0.5); if (e >= 5) { k.cyl('#3f4650', 1.4, 0.02, 1.4, 1.0, 0.04, 16); k.box('#f4f4f4', 1.4, 0.06, 1.4, 0.15, 0.02, 0.9); k.box('#f4f4f4', 1.4, 0.06, 1.4, 0.6, 0.02, 0.15); } if (e >= 7) for (const sx of [-1.6, 1.6]) { k.box('#f2a541', sx, 0, 0.6, 0.4, 0.5, 0.4); k.add(UBOX(), '#f2a541', sx, 0.5, 0.6, 0.14, 1.2, 0.14, 0, 0.6, 0); k.box('#7ff0ff', 0, 1.5, 0.21, 3.6, 0.06, 0.02); } for (let i = 0; i < 2; i++) { k.cyl('#6d5139', -1.4 + i * 0.9, 0, 1.4, 0.07, 1.3, 5); k.box('#c8b07a', -1.4 + i * 0.9, 0.9, 1.4, 0.5, 0.07, 0.07); } }
        out.flag = [2.2, 1.6];
      } else if (type === 'range') {
        styHall(k, S, -1.6, -1.6, 2.0, e >= 3 ? 1.8 : 1.4, 1.6);
        if (e === 4) k.box('#7a6a4a', 0.6, 0, 2.4, 4.4, 1.0, 0.9);
        for (let i = 0; i < 3; i++) { const x = -0.6 + i * 1.2; if (e === 0) { k.add(DOD(), '#8b8577', x, 0.3, 1.6, 0.35, 0.35, 0.35); k.add(DOD(), '#9d9589', x, 0.75, 1.6, 0.25, 0.25, 0.25); } else { k.cyl('#6d5139', x, 0, 1.6, 0.05, 0.9, 5); k.add(UCYL(12), e >= 4 ? '#f4f4f4' : '#d8c27a', x, 1.2, 1.6, 0.42, 0.08, 0.42, 0, Math.PI / 2, 0); k.add(UCYL(12), '#c0392b', x, 1.2, 1.64, 0.22, 0.04, 0.22, 0, Math.PI / 2, 0); } }
        if (e === 2) for (let i = 0; i < 3; i++) k.box(S.wall2, -0.6 + i * 1.2, 0, -0.4, 0.6, 0.8, 0.08);
        if (e === 5 || e === 6) k.box('#5f6b4a', 1.8, 0, -1.4, 1.4, 1.2, 2.4);
        if (e >= 7) { k.add(UCYL(6), '#3a3f48', 1.8, 0, -1.2, 1.0, 3.4, 1.0); for (let i = 0; i < 3; i++) { k.cyl('#7ff0ff', 1.8, 1.0 + i * 1.0, -1.2, 1.05, 0.05, 6); } k.box('#2b313a', 1.8, 3.6, -1.2, 0.5, 0.1, 0.5); }
        out.flag = [-2.4, 0.4];
      } else if (type === 'stable') {
        if (e <= 3) { styHall(k, S, 0, -1.4, 5.0, 1.5, 2.0); for (let i = 0; i <= 8; i++) k.cyl('#6d5139', -2.4 + i * 0.6, 0, 2.6, 0.05, 0.8, 5); for (const x of [-2.4, 2.4]) for (let z = 0; z < 2.6; z += 0.6) k.cyl('#6d5139', x, 0, z, 0.05, 0.8, 5); k.box('#6d5139', 0, 0.6, 2.6, 4.8, 0.06, 0.06); k.cyl('#e0c06a', 1.6, 0, 0.6, 0.4, 0.5, 8); const hk = new Kit(); void hk; k.box('#7a5a3a', -1.0, 0.45, 1.2, 0.35, 0.35, 0.9); k.box('#7a5a3a', -1.0, 0.75, 1.65, 0.16, 0.4, 0.2); }
        else { styHall(k, S, 0, -1.0, 5.0, 2.4, 2.8); for (let i = 0; i < 3; i++) k.box('#3f4650', -1.6 + i * 1.6, 0.2, 0.41, 1.2, 1.6, 0.04); k.box('#55613f', 1.2, 0.3, 2.0, 1.2, 0.4, 2.0); k.box('#5f6b4a', 1.2, 0.7, 1.9, 0.8, 0.3, 0.9); if (e >= 5) k.add(UCYL(6), '#3f4a35', 1.2, 0.85, 2.8, 0.06, 1.2, 0.06, 0, Math.PI / 2, 0); if (e >= 7) { for (const sx of [-0.3, 0.3]) k.box('#5d6670', -1.4 + sx, 0, 2.0, 0.22, 0.8, 0.3); k.box('#8f99a3', -1.4, 0.8, 2.0, 0.9, 0.55, 0.7); } }
        out.flag = [-2.6, 2.6];
      } else if (type === 'siege') {
        styHall(k, S, -1.4, -1.6, 2.4, e >= 3 ? 2.2 : 1.6, 2.0);
        if (e === 1) { k.gable('#8a6a46', 1.2, 0, 1.0, 2.0, 0.8, 1.2, Math.PI / 2); k.add(UCYL(8), '#5b4630', 1.2, 0.5, 1.2, 0.16, 2.4, 0.16, 0, Math.PI / 2, 0); for (let i = 0; i < 3; i++) k.add(UCYL(6), '#7a5a3a', -1.2 + i * 0.3, 0.12, 1.6, 0.12, 2.0, 0.12, 0, Math.PI / 2, 0); }
        else if (e === 2) { for (const sx of [0.6, 1.8]) { k.add(UBOX(), '#6d5139', sx, 0, 0.4, 0.12, 2.6, 0.12, 0, 0.3, 0); k.add(UBOX(), '#6d5139', sx, 0, 1.6, 0.12, 2.6, 0.12, 0, -0.3, 0); } k.add(UBOX(), '#8f6a46', 1.2, 2.4, 1.0, 0.12, 0.12, 3.6, 0, 0.7, 0); k.box('#7d7a74', 1.2, 1.2, -0.2, 0.7, 0.7, 0.7); }
        else if (e === 3) { k.cyl('#7a3a2e', -2.2, 2.2, -2.2, 0.3, 2.2, 8); k.box('#6d5139', 1.2, 0.3, 1.0, 0.6, 0.3, 1.4); k.add(UCYL(10), '#2b2b2b', 1.2, 0.7, 1.4, 0.18, 1.8, 0.18, 0, Math.PI / 2 - 0.15, 0); for (let i = 0; i < 6; i++) k.add(SPHG(), '#2b2b2b', -0.2 + (i % 3) * 0.3, 0, 1.6 + Math.floor(i / 3) * 0.3, 0.14, 0.28, 0.14); }
        else if (e === 4) { k.box(S.wall2, 1.2, 0, 1.0, 2.0, 1.6, 2.4); k.add(UCYL(10), '#3f4a35', 1.2, 1.0, 2.2, 0.14, 2.2, 0.14, 0, Math.PI / 2 - 0.4, 0); }
        else if (e === 5) { k.box(S.wall2, 1.2, 0, 1.0, 2.2, 1.4, 2.6); k.box('#55613f', 1.2, 0.2, 2.6, 1.2, 0.45, 2.0); k.add(UCYL(10), '#3f4a35', 1.2, 0.8, 3.0, 0.11, 2.2, 0.11, 0, Math.PI / 2 - 0.3, 0); }
        else if (e === 6) { k.box('#9aa0a6', 1.2, 0, 0.4, 2.0, 0.5, 1.2); k.add(UCYL(10), '#f4f4f4', 1.2, 0.5, 0.4, 0.3, 4.0, 0.3, 0, 0.35, 0); k.cone('#c0392b', 1.2 + 0, 4.2, 0.4 + 1.42, 0.3, 0.7, 10); k.cyl('#9aa0a6', -1.8, 2.2, 1.6, 0.06, 1.0, 5); k.add(SPHG(), '#e8e8e8', -1.8, 3.1, 1.6, 0.7, 0.25, 0.7, 0, -0.6, 0); }
        else { k.box('#2b313a', 1.2, 0, 0.6, 2.4, 0.6, 2.4); for (const sx of [-0.35, 0.35]) { k.add(UBOX(), '#9aa3ad', 1.2 + sx, 0.9, 1.2, 0.2, 0.25, 4.2, 0, -0.35, 0); k.add(UBOX(), '#7ff0ff', 1.2 + sx, 1.07, 1.2, 0.06, 0.04, 4.2, 0, -0.35, 0, true); } }
        out.flag = [2.4, -2.4];
      } else if (type === 'forge') {
        const h = styHall(k, S, 0, -0.6, e >= 4 ? 4.4 : 3.4, e >= 4 ? 2.8 : 1.8, 2.6);
        const stacks = e === 4 ? [[-1.4, -1.4], [0, -1.4], [1.4, -1.4]] : e === 3 ? [[-1, -1.6], [1, -1.6]] : [[1.2, -1.6]];
        out.smoke = [];
        for (const [x, z] of stacks) { const sh = e >= 4 ? 4.8 : 2.6; k.cyl(e >= 4 ? '#7a3a2e' : S.wall2, x, h - 0.6, z, e >= 4 ? 0.32 : 0.26, sh, 8); out.smoke.push([x, h - 0.6 + sh + 0.3, z]); }
        k.box('#2b2b2b', -1.0, 0, 1.4, 0.5, 0.45, 0.3); k.box('#2b2b2b', -1.0, 0.45, 1.4, 0.8, 0.12, 0.35);
        out.fire = [0.9, 0.5, 0.75];
        if (e >= 5) for (let i = 0; i < 3; i++) k.add(UBOX(), '#24345a', -1.2 + i * 1.2, h + 0.15, 0, 1.0, 0.05, 1.6, 0, 0.35, 0);
        if (e >= 7) k.box('#7ff0ff', 0, 1.0, 0.71, 2.6, 0.3, 0.02, 0, true);
      } else if (type === 'granary') {
        if (e === 0) { for (const [x, z] of [[-0.6, -0.6], [0.6, -0.6], [-0.6, 0.6], [0.6, 0.6]]) k.cyl('#6d5139', x, 0, z, 0.08, 1.0, 5); k.box('#8f6a46', 0, 1.0, 0, 1.6, 0.12, 1.6); styHall(k, Object.assign({}, S, { roofT: S.roofT === 'igloo' || S.roofT === 'mud' ? 'thatch' : S.roofT }), 0, 0, 1.3, 0.7, 1.3, { wall: S.wall }); }
        else if (e === 1 || e === 3) { for (let i = 0; i < 3; i++) { const x = -1.6 + i * 1.6; k.cyl(S.wall, x, 0, 0, 0.75, 2.0, 10); k.dome(S.roof, x, 2.0, 0, 0.75, 0.8, 10); } if (e === 3) styHall(k, S, 0, -2.0, 4.0, 1.2, 1.2); }
        else if (e === 2) { styHall(k, S, 0, 0, 4.0, 2.2, 2.4); k.cyl(S.wall2, 2.4, 0, 1.4, 0.6, 2.4, 10); k.cone(S.roof, 2.4, 2.4, 1.4, 0.75, 0.8, 10); }
        else { for (let i = 0; i < 3; i++) { const x = -1.6 + i * 1.6; k.cyl(e >= 5 ? '#eef1f4' : '#b8bec4', x, 0, -0.6, 0.72, 3.4, 12); k.cone(e >= 5 ? '#d9dfe4' : '#9aa0a6', x, 3.4, -0.6, 0.76, 0.7, 12); } k.add(UBOX(), '#6b6e73', 0, 2.6, 0.6, 0.3, 0.3, 3.6, 0, 0.5, 0); if (e >= 5) styHall(k, S, 0, 1.8, 3.6, 1.4, 1.4); }
      } else if (type === 'academy') {
        if (e === 0) { for (let i = 0; i < 7; i++) { const a = (i / 7) * TAU; k.box('#8b8577', Math.cos(a) * 2.0, 0, Math.sin(a) * 2.0, 0.45, 1.5 + (i % 2) * 0.4, 0.3, -a); } k.cyl('#5b4630', 0, 0, 0, 0.45, 0.12, 8); k.add(DOD(), '#ff8a3d', 0, 0.2, 0, 0.22, 0.22, 0.22); out.fire = [0, 0.4, 0]; }
        else {
          const h = styHall(k, S, 0, -0.8, 4.0, e >= 4 ? 2.8 : 2.0, 2.6);
          if (e <= 2) for (let i = 0; i < 4; i++) k.cyl(S.trim === '#3a2a1e' ? '#efe6d2' : '#efe6d2', -1.5 + i, 0, 0.75, 0.16, h - 0.2, 8);
          if (e === 2) { k.box(S.wall2, 1.5, 0, -1.6, 1.0, 4.4, 1.0); roofOn(k, Object.assign({}, S, { roofT: 'cone' }), 1.5, 4.4, -1.6, 1.0, 1.0); }
          if (e === 3) { k.dome('#efe6d2', 0, h + 0.2, -0.8, 1.0, 1, 12); k.box('#2f3540', 0, h + 0.6, -0.1, 0.25, 0.7, 0.2); }
          if (e === 4) { k.box(S.wall, 0, h, -0.8, 1.0, 2.2, 1.0); k.cyl('#f4efe2', 0, h + 1.3, -0.29, 0.32, 0.05, 12); roofOn(k, Object.assign({}, S, { roofT: 'cone' }), 0, h + 2.2, -0.8, 1.0, 1.0); }
          if (e >= 5) { k.cyl('#9aa0a6', 1.6, 0, 1.4, 0.07, 1.6, 5); k.add(SPHG(), '#f4f4f4', 1.6, 1.8, 1.4, 0.9, 0.3, 0.9, 0, -0.7, 0); k.cyl('#9aa0a6', -1.4, h, -1.2, 0.04, 2.4, 4); }
          if (e === 6) { k.add(UCYL(10), '#f4f6f8', -1.8, 0, 1.6, 0.3, 3.4, 0.3); k.cone('#e05a6a', -1.8, 3.4, 1.6, 0.3, 0.7, 10); }
          if (e >= 7) { k.add(ICO(), '#7ff0ff', 0, h + 1.4, -0.8, 0.6, 0.6, 0.6, 0, 0, 0, true); k.add(TORUS(), '#dfe7ee', 0, h + 1.4, -0.8, 1.1, 1.1, 1.1, 0, 0.5, 0); }
        }
      } else if (type === 'market') {
        if (e === 1) { const cs = ['#c0392b', '#e0b23a', '#3f7fd6', '#3f9a5a']; for (let i = 0; i < 4; i++) { const x = -1.8 + (i % 2) * 3.6 * 0.5 + (i > 1 ? 1.8 : 0), z = i > 1 ? 1.0 : -1.0; for (const [dx, dz] of [[-0.6, -0.5], [0.6, -0.5], [-0.6, 0.5], [0.6, 0.5]]) k.cyl('#6d5139', x + dx, 0, z + dz, 0.05, 1.3, 5); k.add(UBOX(), cs[i], x, 1.3, z, 1.5, 0.06, 1.3, 0, 0.18, 0); k.box('#8f6a46', x, 0.6, z, 1.1, 0.12, 0.6); } }
        else if (e === 2) { for (let i = 0; i < 4; i++) for (const sz of [-1, 1]) k.cyl('#6d5139', -1.8 + i * 1.2, 0, sz * 1.1, 0.1, 1.8, 6); roofOn(k, S, 0, 1.8, 0, 4.4, 2.6); for (let i = 0; i < 3; i++) k.box(pick(['#c0392b', '#e0b23a', '#3f9a5a'], i * 0.34), -1.2 + i * 1.2, 0.5, 0, 0.8, 0.5, 0.6); }
        else if (e === 3) { styHall(k, S, -0.6, -0.6, 3.6, 3.0, 2.4); k.cyl('#6d5139', 2.0, 0, 1.2, 0.08, 2.8, 5); k.add(UBOX(), '#6d5139', 1.6, 2.7, 1.2, 1.2, 0.08, 0.08); for (let i = 0; i < 4; i++) k.box('#c8a36a', 1.4 + (i % 2) * 0.5, 0, 1.8 + Math.floor(i / 2) * 0.5, 0.45, 0.45, 0.45); }
        else if (e === 4) { const h = styHall(k, S, 0, -0.8, 4.4, 2.6, 2.4); for (let i = 0; i < 5; i++) k.cyl('#efe6d2', -1.8 + i * 0.9, 0, 0.6, 0.15, h - 0.2, 8); k.gable('#efe6d2', 0, h, 0.6, 4.6, 0.7, 0.5); }
        else { const h = styHall(k, S, 0, -0.4, 4.6, 3.0, 3.0); k.dome('#bfe3f2', 0, h, -0.4, 1.3, 0.7, 12); }
      } else if (type === 'port') {
        const pier = ['#8f6a46', '#8f6a46', '#a39b8e', '#9a8f80', '#9a948a', '#c9ced4', '#d9dfe4', '#e8eef3'][e];
        for (let z = 0; z < 9.6; z += 1.2) k.box(pier, 0, -0.12, z + 0.6, 3.2, 0.2, 1.16);
        for (let z = 1; z < 10; z += 2.4) for (const sx of [-1.4, 1.4]) k.cyl('#5b4630', sx, -2.4, z, 0.16, 2.4, 6);
        styHall(k, S, -2.6, -1.2, 3.2, e >= 3 ? 2.6 : 1.8, 2.4);
        // ụ đóng tàu: dốc gỗ xuôi xuống nước
        k.add(UBOX(), '#7a5a3a', 3.4, -0.6, 3.0, 1.8, 0.15, 5.0, 0, -0.18, 0);
        if (e === 2) { k.cyl('#6d5139', 1.6, 0, 6.0, 0.14, 3.0, 6); k.add(UBOX(), '#6d5139', 1.6, 2.9, 6.8, 0.12, 0.12, 1.8); k.add(UCYL(12), '#8f6a46', 1.6, 0.9, 5.4, 0.8, 0.25, 0.8, 0, 0, Math.PI / 2); }
        if (e === 3) { k.cyl('#efe6d2', -1.2, 0, 9.4, 0.5, 4.2, 10); k.cyl('#ffe08a', -1.2, 4.2, 9.4, 0.52, 0.6, 10); k.cone('#c0392b', -1.2, 4.8, 9.4, 0.6, 0.7, 10); out.lamp = [-1.2, 4.5, 9.4]; }
        if (e === 4) { for (const z of [4.0, 7.6]) { k.box('#a33a2e', 1.1, 0, z, 0.2, 4.4, 0.2); k.add(UBOX(), '#a33a2e', 0.6, 4.3, z, 2.6, 0.18, 0.18); k.box('#2f3540', -0.5, 3.3, z, 0.04, 1.0, 0.04); } }
        if (e === 6) { k.box('#9aa0a6', 0, 0, 8.2, 3.0, 0.4, 3.0); k.box('#c46a2e', 1.3, 0.4, 8.2, 0.3, 7.0, 0.3); k.add(UCYL(12), '#f4f6f8', 0, 0.4, 8.2, 0.45, 6.0, 0.45); k.cone('#e05a6a', 0, 6.4, 8.2, 0.45, 1.2, 12); }
        if (e >= 7) { for (const z of [4.0, 7.0]) { k.box('#f4f7fa', 1.3, 0, z, 0.3, 4.6, 0.3); k.add(UBOX(), '#f4f7fa', 0.5, 4.4, z, 2.2, 0.25, 0.3); k.box('#7ff0ff', 0.5, 4.3, z, 2.2, 0.05, 0.32, 0, true); } }
        if (e === 5) { for (const sx of [-1.4, 1.4]) for (const z of [4.6, 7.4]) k.box('#e05a6a', sx, 0, z, 0.25, 5.2, 0.25); k.box('#e05a6a', 0, 5.0, 6.0, 3.4, 0.3, 3.4); k.box('#e05a6a', 0, 5.0, 9.0, 0.6, 0.3, 3.0); const cc = ['#3f7fd6', '#e0b23a', '#3f9a5a', '#e05a6a']; for (let i = 0; i < 6; i++) k.box(cc[i % 4], -2.6 + (i % 3) * 0.95, Math.floor(i / 3) * 0.5, 1.8, 0.9, 0.48, 1.6); }
        out.flag = [-2.6, 1.2];
      } else if (type === 'tower') {
        if (e === 0) { for (const [x, z] of [[-0.6, -0.6], [0.6, -0.6], [-0.6, 0.6], [0.6, 0.6]]) k.cyl('#6d5139', x, 0, z, 0.08, 3.0, 5); k.box('#8f6a46', 0, 3.0, 0, 1.6, 0.14, 1.6); roofOn(k, Object.assign({}, S, { roofT: S.roofT === 'igloo' || S.roofT === 'mud' ? 'tent' : S.roofT }), 0, 4.0, 0, 1.4, 1.4); for (const [x, z] of [[-0.75, 0], [0.75, 0], [0, -0.75], [0, 0.75]]) k.box('#6d5139', x, 3.1, z, x ? 0.06 : 1.5, 0.5, z ? 0.06 : 1.5); out.top = 4.2; }
        else if (e === 1) { k.box(S.wall, 0, 0, 0, 1.6, 4.2, 1.6); for (const [x, z] of [[-0.6, -0.6], [0.6, -0.6], [-0.6, 0.6], [0.6, 0.6]]) k.box(S.wall2, x, 4.2, z, 0.4, 0.5, 0.4); k.box('#2b2b2b', 0, 2.6, 0.81, 0.12, 0.6, 0.05); out.top = 4.6; }
        else if (e === 2) { k.cyl(S.wall, 0, 0, 0, 1.05, 5.2, 10); k.cyl(S.wall2, 0, 5.2, 0, 1.25, 0.4, 10); for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU; k.box(S.wall2, Math.cos(a) * 1.1, 5.6, Math.sin(a) * 1.1, 0.35, 0.45, 0.35, -a); } roofOn(k, Object.assign({}, S, { roofT: 'cone' }), 0, 5.6, 0, 1.8, 1.8); out.top = 6.0; }
        else if (e === 3) { k.add(UCYL(5), S.wall, 0, 0, 0, 1.9, 1.6, 1.9); k.box('#6d5139', 0, 1.6, 0.2, 0.5, 0.3, 0.9); k.add(UCYL(10), '#2b2b2b', 0, 1.9, 0.9, 0.14, 1.1, 0.14, 0, Math.PI / 2 - 0.1, 0); out.top = 2.2; }
        else if (e === 4) { k.add(UCYL(6), '#8f8a80', 0, 0, 0, 1.4, 1.2, 1.4); k.box('#1a1a1a', 0, 0.7, 1.15, 1.2, 0.18, 0.1); for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU; k.box('#b8a37a', Math.cos(a) * 1.9, 0, Math.sin(a) * 1.9, 0.9, 0.5, 0.4, -a + Math.PI / 2); } out.top = 1.4; }
        else if (e === 6) { k.box('#9aa0a6', 0, 0, 0, 2.2, 0.6, 2.2); for (let i = 0; i < 6; i++) k.add(UCYL(8), '#f4f4f4', -0.6 + (i % 3) * 0.6, 0.6, -0.4 + Math.floor(i / 3) * 0.8, 0.18, 1.6, 0.18); k.cyl('#9aa0a6', 1.6, 0, -1.4, 0.08, 2.6, 5); k.add(SPHG(), '#f4f4f4', 1.6, 2.6, -1.4, 0.9, 0.9, 0.9); out.top = 2.2; }
        else if (e >= 7) { k.add(UCYL(8), '#2b313a', 0, 0, 0, 0.7, 0.5, 0.7); k.add(TCYL(0.4, 8), '#dfe3e8', 0, 0.5, 0, 0.45, 5.2, 0.45); k.add(ICO(), '#ff4d4d', 0, 5.9, 0, 0.36, 0.36, 0.36, 0, 0, 0, true); k.add(TORUS(), '#7ff0ff', 0, 5.9, 0, 0.6, 0.6, 0.6, 0, Math.PI / 2, 0, true); out.top = 5.9; }
        else { k.box('#7d848c', 0, 0, 0, 1.8, 0.6, 1.8); k.add(UBOX(), '#5d6b4a', 0, 0.6, 0, 1.4, 0.9, 1.6, 0, -0.5, 0); for (let i = 0; i < 4; i++) k.add(UCYL(6), '#e8e8e8', -0.45 + (i % 2) * 0.9, 1.15, 0.45 - Math.floor(i / 2) * 0.5, 0.15, 0.6, 0.15, 0, -0.5 + Math.PI / 2, 0); k.cyl('#9aa0a6', 1.4, 0, -1.2, 0.06, 2.2, 5); k.add(SPHG(), '#f4f4f4', 1.4, 2.4, -1.2, 0.6, 0.2, 0.6, 0, -0.6, 0); out.top = 1.6; }
        out.flag = e <= 2 ? [0.6, 0.6] : null;
      } else if (type === 'silo') {
        k.cyl('#9aa0a6', 0, 0, 0, 1.6, 0.25, 16); k.cyl('#3f4650', 0, 0.25, 0, 1.2, 0.08, 16); k.add(UCYL(12), '#f4f4f4', 0, 0.3, 0, 0.45, 3.4, 0.45); k.cone('#c0392b', 0, 3.7, 0, 0.45, 0.9, 12);
        for (let i = 0; i < 10; i++) { const a = (i / 10) * TAU; k.cyl('#7d848c', Math.cos(a) * 2.8, 0, Math.sin(a) * 2.8, 0.05, 1.2, 4); }
        k.box('#8f8a80', -2.0, 0, -1.2, 1.4, 1.0, 1.0); k.cyl('#9aa0a6', 2.0, 0, -1.4, 0.06, 1.8, 5); k.add(SPHG(), '#f4f4f4', 2.0, 2.0, -1.4, 0.6, 0.2, 0.6, 0, -0.6, 0);
      } else if (type === 'wonder') wonderModel(k, S, ter);
      return out;
    }
    function wonderModel(k, S, ter) {
      if (ter === 'plains') { for (let i = 0; i < 6; i++) k.box(i % 2 ? '#e0b23a' : '#c9a046', 0, i * 1.6, 0, 7 - i * 1.1, 1.6, 7 - i * 1.1); k.cyl('#f2d36b', 0, 9.6, 0, 0.6, 3, 8); k.add(SPHG(), '#ffe08a', 0, 12.6, 0, 0.8, 1.6, 0.8); }
      else if (ter === 'forest') { k.tcyl('#6d5139', 0, 0, 0, 2.4, 1.4, 12, 10); for (let i = 0; i < 9; i++) { const a = (i / 9) * TAU, r = 2.4 + (i % 3); k.add(ICO(), i % 2 ? '#3f7a4c' : '#4f8f45', Math.cos(a) * r, 11 + (i % 3) * 1.6, Math.sin(a) * r, 2.6, 2.0, 2.6); } k.add(ICO(), '#5b9a52', 0, 15, 0, 3.4, 2.6, 3.4); for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU * 2; k.box('#c8a36a', Math.cos(a) * 2.5, i * 0.85, Math.sin(a) * 2.5, 1.0, 0.12, 0.6, -a); k.add(SPHG(), '#ffd27a', Math.cos(a) * 2.9, i * 0.85 + 0.5, Math.sin(a) * 2.9, 0.15, 0.3, 0.15); } }
      else if (ter === 'mountain') { k.add(DOD(), '#8b8577', 0, 1.2, 0, 4.2, 0.6, 3.6); k.box('#9d9589', 0, 1.6, -0.4, 4.2, 3.6, 2.6); k.box('#a9a294', 0, 5.2, -0.6, 3.2, 3.8, 2.0); for (const sx of [-1, 1]) k.box('#9d9589', sx * 2.0, 5.0, 0.3, 0.9, 3.0, 0.9); k.add(SPHG(), '#b8b2a4', 0, 9.0, -0.6, 1.3, 2.6, 1.3); k.box('#8b8577', 0, 9.8, 0.4, 0.7, 0.3, 0.4); }
      else if (ter === 'tundra') { const ice = ['#bfe3f2', '#d6eef7', '#a9d6ea']; k.box('#d6eef7', 0, 0, 0, 6, 2.6, 5); k.dome('#e8f6fb', 0, 2.6, 0, 2.2, 1, 12); for (const [x, z, h] of [[-2.8, -2.2, 8], [2.8, -2.2, 8], [-2.8, 2.2, 6], [2.8, 2.2, 6], [0, -2.6, 10]]) { k.cyl(pick(ice, x * 0.1 + z), x, 0, z, 0.6, h, 8); k.cone('#ffffff', x, h, z, 0.7, 2.4, 8); } }
      else if (ter === 'coast') { for (let i = 0; i < 6; i++) k.tcyl(i % 2 ? '#c0392b' : '#fbfaf6', 0, i * 2.4, 0, 1.8 - i * 0.18, 1.8 - (i + 1) * 0.18, 2.4, 12); k.cyl('#ffe08a', 0, 14.4, 0, 0.75, 1.4, 12); k.cone('#3f4650', 0, 15.8, 0, 0.9, 1.4, 12); k.cyl('#9a948a', 0, 0, 0, 3.0, 0.6, 14); }
      else { k.add(UCONE(4), '#e8a0a8', 0, 0, 0, 6.6, 8.4, 6.6, Math.PI / 4); k.add(UCONE(4), '#ffd36b', 0, 7.2, 0, 1.0, 1.4, 1.0, Math.PI / 4); for (const sx of [-1, 1]) { k.box('#e2bd85', sx * 6.0, 0, 5.0, 0.6, 5.0, 0.6); k.add(UCONE(4), '#ffd36b', sx * 6.0, 5.0, 5.0, 0.45, 0.8, 0.45, Math.PI / 4); } }
    }
    // tường thành vòng quanh, chừa cổng ở hai đầu cầu và lối ra bến
    function wallModel(k, L, eReal) {
      const e = E7(eReal), S = STY[L.ter][e], RA = (a) => Math.min(28.6 * lands3d.SC, L.rOf(a) - 1.8), gaps = [...L.landing.map((p) => Math.atan2(p.z, p.x)), Math.atan2(L.inw.z, L.inw.x)];
      const N = 96;
      for (let i = 0; i < N; i++) {
        const a = (i / N) * TAU, a2 = ((i + 1) / N) * TAU, mid = (a + a2) / 2;
        if (gaps.some((g, gi) => Math.abs(Math.atan2(Math.sin(mid - g), Math.cos(mid - g))) < (gi === 2 ? 0.42 : 0.12))) continue;
        const R = RA(mid), x = Math.cos(mid) * R, z = Math.sin(mid) * R, len = R * (a2 - a) + 0.05, ry = -mid + Math.PI / 2;
        if (eReal >= 8) { // tường tự lành, khiên plasma, tường gấp khúc, màn ánh sáng
          if (eReal === 8) { if (i % 2 === 0) k.add(SPHG(), '#e2ebf0', x, 0, z, len * 0.8, 2.4, 0.9, ry); k.box('#7ff0ff', x, 1.2, z, len, 0.08, 1.0, ry, 'glow'); }
          else if (eReal === 9) { k.box('#3a3d42', x, 0, z, 0.2, 2.8, 0.2, ry); k.box('#ffb347', x, 0.5, z, len, 2.0, 0.05, ry, 'ghost'); }
          else if (eReal === 10) { k.box('#b48cff', x, 0, z, len, 2.4, 0.1, ry + (i % 2 ? 0.35 : -0.35), 'glow'); }
          else k.box('#fff6dc', x, 0, z, len, 3.4, 0.06, ry, 'ghost');
          continue;
        }
        if (e === 0) for (let s = 0; s < 3; s++) { const t = mid - (a2 - a) / 2 + ((s + 0.5) / 3) * (a2 - a); k.cone('#7a5a3a', Math.cos(t) * R, 0, Math.sin(t) * R, 0.12, 1.7, 5); }
        else if (e === 1) k.box(S.wall2, x, 0, z, len, 1.1, 1.0, ry);
        else if (e === 2) { k.box(S.wall, x, 0, z, len, 2.2, 0.8, ry); if (i % 2 === 0) k.box(S.wall2, x, 2.2, z, len * 0.45, 0.45, 0.85, ry); if (i % 12 === 0) { k.cyl(S.wall, x, 0, z, 1.0, 3.2, 8); roofOn(k, Object.assign({}, S, { roofT: 'cone' }), x, 3.2, z, 1.6, 1.6); } }
        else if (e === 3) { k.box(S.wall2, x, 0, z, len, 1.4, 1.6, ry); if (i % 8 === 0) k.add(UCONE(3), S.wall2, Math.cos(mid) * (R + 1.2), 0, Math.sin(mid) * (R + 1.2), 1.8, 1.4, 1.8, ry + Math.PI / 6); }
        else if (e === 4) { k.box('#b8a37a', x, 0, z, len, 0.55, 0.5, ry); if (i % 2 === 0) k.cyl('#5d5f63', Math.cos(mid) * (R + 0.9), 0, Math.sin(mid) * (R + 0.9), 0.04, 0.8, 4); }
        else if (e === 5) k.box('#c9ced4', x, 0, z, len - 0.08, 2.4, 0.5, ry);
        else if (e === 6) { k.box('#8a98a8', x, 0, z, len - 0.05, 3.0, 0.4, ry); k.box('#dfe3e8', x, 3.0, z, len, 0.2, 0.6, ry); }
        else { k.box('#2b313a', x, 0, z, 0.25, 2.6, 0.25, ry); k.box('#7ff0ff', x, 0.6, z, len, 1.6, 0.05, ry, true); }
      }
      // cổng thành ở hai đầu cầu: hai tháp, xà ngang, cánh cổng; thành sắp vỡ thì cổng gãy
      if (e >= 1) for (const g of L.landing) {
        const a = Math.atan2(g.z, g.x), R = RA(a), ry = -a + Math.PI / 2, tx = -Math.sin(a), tz = Math.cos(a), cx = Math.cos(a) * R, cz = Math.sin(a) * R;
        for (const sd of [-1, 1]) { const x = cx + tx * sd * 2.4, z = cz + tz * sd * 2.4; if (e <= 4) { k.box(e <= 1 ? S.wall2 : S.wall, x, 0, z, 1.4, e === 1 ? 2.0 : 3.4, 1.4, ry); if (e >= 2) k.box(S.wall2, x, e === 1 ? 2.0 : 3.4, z, 1.6, 0.4, 1.6, ry); } else k.box(e >= 7 ? '#2b313a' : '#9aa0a6', x, 0, z, 0.9, 3.2, 0.9, ry); }
        if (e <= 4) k.box(S.wall2, cx, e === 1 ? 1.6 : 2.8, cz, 4.2, 0.6, 1.0, ry);
        if (!L._broken) for (const sd of [-1, 1]) k.box(e >= 5 ? '#5d6670' : '#5b4630', cx + tx * sd * 0.85, 0, cz + tz * sd * 0.85, 1.6, e === 1 ? 1.6 : 2.6, 0.18, ry);
        else k.add(UBOX(), '#3a2a1e', cx + tx * 0.9, 0, cz + tz * 0.9, 1.6, 0.18, 2.4, ry, 0, 0);
      }
    }
    const FLAGS = [];
    function updateBuildings(animate) {
      for (const L of lands) {
        const c = W.cities[L.i];
        const want = new Map(); // thành chết (đảo hoang) thì gỡ hết công trình quân sự
        if (c.settled && c.bld) for (const type in c.bld) {
          const b = c.bld[type];
          const step = b.done ? 10 : Math.floor((1 - b.left / b.total) * 5);
          if (type === 'tower') L.towerPos.forEach((p, i) => want.set('tower' + i, { type, p, step, e: c.era }));
          else if (type === 'wall') want.set('wall', { type, p: v3(0, 0, 0), step: step + (c.hp / c.hpMax < 0.35 ? 100 : 0), e: c.era, broken: c.hp / c.hpMax < 0.35 });
          else want.set(type, { type, p: type === 'port' ? L.portPos : type === 'wonder' ? L.wonderPos : type === 'silo' ? L.siloPos : L.milLot[type], step, e: c.era });
        }
        for (const [key, o] of Object.entries(BLD_OF)) { if (!key.startsWith(L.i + ':')) continue; const k2 = key.slice(key.indexOf(':') + 1); if (!want.has(k2)) { L.g.remove(o.g); disposeGroup(o.g); K.unclickable(o.g); delete BLD_OF[key]; L.fires = L.fires.filter((f) => f.owner !== 'bld' + key); } }
        for (const [k2, d] of want) {
          if (!d.p) continue;
          const key = L.i + ':' + k2, sig = d.e + ':' + d.step, cur = BLD_OF[key];
          if (cur && cur.sig === sig) continue;
          if (cur) { L.g.remove(cur.g); disposeGroup(cur.g); K.unclickable(cur.g); L.fires = L.fires.filter((f) => f.owner !== 'bld' + key); }
          const k = new Kit(), S = STY[L.ter][E7(d.e)];
          let out = {};
          if (d.type === 'wall') { L._broken = !!d.broken; wallModel(k, L, d.e); }
          else out = buildModel(d.type, k, S, E7(d.e), L.ter) || {};
          if (lands3d.kit.motif && d.type !== 'wall') lands3d.kit.motif(k, L.ter, d.e); // hoạ tiết riêng của đảo
          if (d.type !== 'wall') setBeyond(d.e);
          const building = d.step < 10 && d.type !== 'wall' ? true : d.type === 'wall' && d.step % 100 < 10;
          if (building && d.type !== 'wall') scaffold(k, d.type === 'wonder' ? 8 : 5, d.type === 'wonder' ? 8 : 4.6, d.type === 'wonder' ? 6 + d.step * 2 : 3.2);
          const ry = d.type === 'port' ? Math.atan2(d.p.x, d.p.z) : d.type === 'wall' ? 0 : Math.atan2(-d.p.x, -d.p.z);
          const g = meshOf(k, L.litMat, L.g, d.p.x, d.p.z, ry, false);
          setBeyond(0);
          if (building && d.type !== 'wall') g.scale.y = 0.25 + d.step * 0.15;
          if (d.type !== 'wall') { clearTrees(L, d.p.x, d.p.z, d.type === 'wonder' ? 6.2 : d.type === 'silo' ? 4 : 3.2); K.clickable(g, { type: 'bld', bld: d.type, land: L.i }); }
          if (out.fire && !building) lands3d.kit.addFire(L, g, out.fire, 'bld' + key, 1.4);
          BLD_OF[key] = { g, sig, smoke: building ? null : out.smoke, lamp: out.lamp, top: out.top, flag: out.flag };
          if (animate && cur && d.step === 10) dust(L, d.p);
        }
      }
    }
    // cờ trên quảng trường: màu của phe đang giữ thành
    const flagGeo = new THREE.PlaneGeometry(2.4, 1.4, 6, 1); flagGeo.translate(1.2, 0, 0);
    for (const L of lands) {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 11, 6), new THREE.MeshStandardMaterial({ color: '#d9d2c2', metalness: 0.4, roughness: 0.4 }));
      const p = L.world(v3(0, 0, 0)).addScaledVector(L.out.clone().applyAxisAngle(v3(0, 1, 0), Math.PI / 2), 6.4).addScaledVector(L.inw, 3.8);
      pole.position.copy(p).setY(5.5); scene.add(pole);
      const fl = new THREE.Mesh(flagGeo.clone(), new THREE.MeshStandardMaterial({ color: '#ffffff', side: THREE.DoubleSide, flatShading: true, roughness: 0.7 }));
      fl.position.copy(p).setY(10.2); scene.add(fl);
      pole.visible = fl.visible = false;
      FLAGS.push({ pole, fl, base: fl.geometry.attributes.position.array.slice(), owner: -1, i: L.i });
    }
    // thanh sức chịu của thành
    const bars = lands.map((L) => {
      const cv = document.createElement('canvas'); cv.width = 256; cv.height = 64;
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(cv), transparent: true, depthWrite: false, depthTest: false }));
      sp.position.copy(L.center).setY(22); sp.scale.set(16, 4, 1); sp.visible = false; sp.renderOrder = 10; scene.add(sp);
      return { cv, sp, sig: '' };
    });
    function drawBar(i) {
      const c = W.cities[i], B = bars[i], X = W.war;
      const show = X.on && c.settled && (c.hp < c.hpMax - 1 || X.factions.some((f) => f.alive && Sim.atWarF(W, c.owner, f.id)));
      B.sp.visible = show;
      if (!show) return;
      const sig = c.owner + ':' + Math.round((c.hp / c.hpMax) * 40);
      if (sig === B.sig) return;
      B.sig = sig;
      const x = B.cv.getContext('2d'), col = K.factionColor(c.owner), f = clamp(c.hp / c.hpMax, 0, 1);
      x.clearRect(0, 0, 256, 64);
      x.fillStyle = 'rgba(12,18,28,0.72)'; x.beginPath(); x.roundRect ? x.roundRect(2, 2, 252, 60, 14) : x.rect(2, 2, 252, 60); x.fill();
      x.fillStyle = col; x.fillRect(14, 12, 14, 14);
      x.fillStyle = '#fff'; x.font = '600 20px system-ui, sans-serif'; x.fillText(c.name, 36, 26);
      x.fillStyle = 'rgba(255,255,255,0.18)'; x.fillRect(14, 36, 228, 14);
      x.fillStyle = f > 0.5 ? '#7bd389' : f > 0.25 ? '#f2c14e' : '#ef6f6c'; x.fillRect(14, 36, 228 * f, 14);
      B.sp.material.map.needsUpdate = true;
    }

    /* =============== Chiến tuyến: vị trí trên cầu và trên biển =============== */
    const gateW = (i, j) => { const L = lands[i], k = L.neighbors.indexOf(j); return L.world(L.gates[Math.max(0, k)]); };
    const _a = v3(0, 0, 0), _b = v3(0, 0, 0);
    // điểm thứ x (0..1) trên tuyến; trả về vị trí và hướng tiến của phe a
    function lanePos(key, x, lat, out, dir) {
      const Ln = W.war.lanes[key];
      if (!Ln) return false;
      if (Ln.kind === 'bridge') {
        const B = lands3d.bridges[Ln.bridge], GA = gateW(Ln.a, Ln.b), GZ = gateW(Ln.b, Ln.a);
        const l1 = GA.distanceTo(B.pa), l2 = B.pa.distanceTo(B.pb), l3 = B.pb.distanceTo(GZ), T = l1 + l2 + l3, d = x * T;
        if (d < l1) { out.copy(GA).lerp(B.pa, d / l1); dir.copy(B.pa).sub(GA); }
        else if (d < l1 + l2) { lands3d.bridgePoint(B, (d - l1) / l2, out); out.y -= 0.12; dir.copy(B.pb).sub(B.pa); }
        else { out.copy(B.pb).lerp(GZ, (d - l1 - l2) / l3); dir.copy(GZ).sub(B.pb); }
        dir.y = 0; dir.normalize();
        out.x += -dir.z * lat * 0.75; out.z += dir.x * lat * 0.75;
        return true;
      }
      const PA = portWater(lands[Ln.a]), PZ = portWater(lands[Ln.b]);
      out.copy(PA).lerp(PZ, x); dir.copy(PZ).sub(PA).setY(0).normalize();
      out.x += -dir.z * lat * 3; out.z += dir.x * lat * 3; out.y = (SEA_Y + seaDy);
      return true;
    }

    /* =============== Đạn, nổ, ngã xuống =============== */
    const ballMesh = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 6, 4), new THREE.MeshBasicMaterial({ color: '#ffffff' }), 160);
    const boltMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(0.06, 0.06, 1), new THREE.MeshBasicMaterial({ color: '#ffffff' }), 200);
    for (let i = 0; i < 200; i++) { if (i < 160) ballMesh.setColorAt(i, C('#ffffff')); boltMesh.setColorAt(i, C('#ffffff')); }
    for (const m of [ballMesh, boltMesh]) { m.count = 0; m.frustumCulled = false; m.raycast = () => {}; scene.add(m); }
    const shots = [], flashes = [], wrecks = [];
    const flashPool = [];
    for (let i = 0; i < 40; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: '#ffcf7a', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })); s.visible = false; scene.add(s); flashPool.push(s); }
    let flashIdx = 0;
    function flash(p, color, size, dur) { const s = flashPool[flashIdx++ % flashPool.length]; s.position.copy(p); s.material.color.set(color); s.visible = true; flashes.push({ s, t0: performance.now(), dur: dur || 380, size: size || 2 }); }
    // kiểu đạn theo binh chủng và thời đại: [dạng, màu, cỡ, độ cong, tốc độ, nổ khi trúng]
    function shotStyle(kind, e) {
      if (kind === 'tower') kind = ['ranged', 'ranged', 'ranged', 'siege', 'ranged', 'siege', 'siege', 'ranged', 'ranged', 'siege', 'ranged', 'ranged'][e];
      if (kind === 'ranged') return [['ball', '#8b8577', 0.12, 1.4, 600], ['bolt', '#6d5139', 0.7, 1.1, 520], ['bolt', '#3a2a1e', 0.6, 0.5, 420], ['ball', '#2b2b2b', 0.06, 0.05, 180, 'smoke'], ['bolt', '#ffd36b', 0.9, 0, 140], ['ball', '#f4f4f4', 0.14, 0.3, 380, 'boom'], ['bolt', '#f4f4f4', 1.0, 1.2, 420, 'boom'], ['bolt', '#ff4d4d', 1.6, 0, 110], ['ball', '#bff6ff', 0.12, 0.4, 260, 'boom'], ['bolt', '#ffb347', 1.4, 0, 120, 'boom'], ['bolt', '#b48cff', 1.4, 0, 90, 'boom'], ['bolt', '#fff6dc', 2.0, 0, 70]][e];
      if (kind === 'siege') return [['ball', '#8b8577', 0.3, 2, 900], ['ball', '#8b8577', 0.1, 0, 300, 'dust'], ['ball', '#8b8577', 0.35, 4.5, 1300, 'dust'], ['ball', '#2b2b2b', 0.2, 2.2, 900, 'smoke'], ['ball', '#3a3a3a', 0.2, 4, 1100, 'boom'], ['ball', '#3a3a3a', 0.22, 3, 900, 'boom'], ['bolt', '#f4f4f4', 1.4, 7, 1500, 'boom'], ['bolt', '#7ff0ff', 2.6, 0, 150, 'boom'], ['ball', '#bff6ff', 0.3, 3, 900, 'boom'], ['ball', '#ffb347', 0.4, 2, 700, 'boom'], ['bolt', '#b48cff', 2.4, 0, 130, 'boom'], ['bolt', '#fff6dc', 3.0, 0, 110, 'boom']][e];
      if (kind === 'ship') return [null, ['bolt', '#6d5139', 0.7, 1.2, 600], ['ball', '#ff8a3d', 0.18, 1.6, 800, 'fire'], ['ball', '#2b2b2b', 0.2, 1.2, 700, 'smoke'], ['ball', '#3a3a3a', 0.22, 3, 1000, 'boom'], ['bolt', '#f4f4f4', 1.0, 4, 1100, 'boom'], ['bolt', '#f4f4f4', 1.2, 5, 1200, 'boom'], ['bolt', '#7ff0ff', 2.2, 0, 150, 'boom'], ['ball', '#bff6ff', 0.3, 3, 900, 'boom'], ['ball', '#ffb347', 0.4, 2, 700, 'boom'], ['bolt', '#b48cff', 2.4, 0, 130, 'boom'], ['bolt', '#fff6dc', 3.0, 0, 110, 'boom']][e];
      if (kind === 'mounted' && e >= 4) return [null, null, null, null, ['bolt', '#ffd36b', 0.9, 0, 140], ['ball', '#ffcf7a', 0.12, 0.2, 260, 'boom'], ['bolt', '#f4f4f4', 1.0, 1, 500, 'boom'], ['bolt', '#ff4d4d', 1.6, 0, 110], ['bolt', '#bff6ff', 1.2, 0, 140], ['bolt', '#ffb347', 1.4, 0, 120, 'boom'], ['bolt', '#b48cff', 1.4, 0, 100], ['bolt', '#fff6dc', 1.8, 0, 90]][e];
      return null;
    }
    const _p = v3(0, 0, 0), _d = v3(0, 0, 0), _q = v3(0, 0, 0);
    // tiếng trận: chỉ nghe khi camera ở gần, mỗi nhịp một tiếng
    let sfxAt = 0;
    function sfx(fx, p) {
      const A = K.audio; if (!A || !A.on || !K.camera) return;
      const t = performance.now(); if (t < sfxAt || K.camera.position.distanceTo(p) > 140) return;
      sfxAt = t + 140;
      const e = fx.era;
      if (fx.kind === 'melee' || (fx.kind === 'mounted' && e < 4)) A.clash();
      else if (e >= 7) A.laser();
      else if (fx.kind === 'siege' || fx.kind === 'ship' || (fx.kind === 'mounted' && e >= 5)) A.boom(false);
      else if (e >= 3) A.shot(e);
      else A.whoosh && Math.random() < 0.3 && A.whoosh();
    }
    function shotRaw(from, to, color, size, arc, dur, hit) { shots.push({ from, to, t0: performance.now(), dur, form: 'ball', color, size, arc, hit, gate: false }); }
    function onFx(fx, dayMs) {
      if (fx.kind === 'nuke') return nukeFx(fx);
      if (!fx.lane || !W.war.lanes[fx.lane]) return;
      const delay = Math.random() * dayMs * 0.85;
      const from = v3(0, 0, 0), to = v3(0, 0, 0);
      if (!lanePos(fx.lane, fx.x0, 0, from, _d)) return;
      lanePos(fx.lane, fx.x1, (Math.random() - 0.5) * 1.2, to, _d);
      const Ln = W.war.lanes[fx.lane];
      if (fx.kind === 'tower') { const L = lands[fx.city], ti = Ln.kind === 'sea' ? 2 : Math.max(0, L.neighbors.indexOf(fx.city === Ln.a ? Ln.b : Ln.a)); from.copy(L.world(L.towerPos[ti])); from.y += 3.5; }
      else from.y += Ln.kind === 'sea' ? 1.6 : 1.0;
      to.y += Ln.kind === 'sea' ? 0.6 : 0.6;
      if (fx.gate != null) { to.y += 1.5; }
      const st = shotStyle(fx.kind, fx.era);
      if (!st) { setTimeout(() => flash(to.clone().setY(to.y + 0.3), '#fff2c0', 0.9, 160), delay); return; }
      shots.push({ from, to, t0: performance.now() + delay, dur: st[4] * (0.8 + Math.random() * 0.4), form: st[0], color: st[1], size: st[2], arc: st[3], hit: st[5], gate: fx.gate != null });
      setTimeout(() => sfx(fx, from), delay);
      if (st[5] === 'smoke' && !reduce) setTimeout(() => puff(from.clone(), false, '#e8e8e8'), delay);
    }
    const _sq = v3(0, 0, 0);
    // một đơn vị là một tiểu đội; máu vơi thì người ngã xuống, xác nằm lại
    function drawSquad(u, base, ry, moving, fighting, col, now) {
      const ter = terOf(u), S = soldierSet(u.cls, u.era, ter), size = squadSize(u), n = Math.max(1, Math.ceil(size * clamp(u.hp / u.hpMax, 0, 1)));
      const fx = Math.sin(ry), fz = Math.cos(ry), rx = fz, rz = -fx, sc = u.era >= 7 ? 1.4 : 1.2, sp = 0.85 * sc;
      const at = (i, lunge) => _sq.set(base.x + rx * FORM[i][0] * sp + fx * (FORM[i][1] * sp + lunge), base.y, base.z + rz * FORM[i][0] * sp + fz * (FORM[i][1] * sp + lunge));
      if (u.shown != null && n < u.shown) for (let i = n; i < Math.min(u.shown, FORM.length); i++) addCorpse(u, at(i, 0).clone(), ry, i, col, sc, now);
      u.shown = n;
      for (let i = 0; i < n; i++) {
        const lunge = fighting && u.cls === 'melee' && !reduce ? Math.max(0, Math.sin(now * 0.009 + u.id + i * 1.7)) * 0.3 : 0;
        F.crowdPut(S, 0, at(i, lunge), ry + (fighting ? Math.sin(u.id + i) * 0.15 : 0), moving && !reduce ? 1 : 0, fighting && !reduce ? 1 : 0, u.id * 7 + i, sc, [col, PANTS[u.era], HELMS[u.era], F.SKIN_T[(u.id + i) % 6]]);
      }
    }
    function addCorpse(u, p, ry, i, col, sc, now) {
      if (corpses.length > 220) corpses.shift();
      p.y += 0.12 * sc;
      corpses.push({ cls: u.cls, era: u.era, ter: u.ter || (u.city != null ? terOf(u) : 'plains'), p, ry: ry + (Math.random() - 0.5) * 1.6, seed: u.id * 7 + i, sc, colors: [col, PANTS[u.era], HELMS[u.era], F.SKIN_T[(u.id + i) % 6]], t0: now });
      if (!reduce) puff(p.clone().setY(p.y + 0.4), false, '#b9ab98');
    }
    function onDeath(d) {
      if (!d.lane || !W.war.lanes[d.lane]) return;
      const p = v3(0, 0, 0);
      if (!lanePos(d.lane, d.x, d.lat, p, _d)) return;
      if ((d.cls === 'melee' || d.cls === 'ranged') && !(d.cls === 'ranged' && (d.era === 7 || d.era === 8))) { addCorpse({ cls: d.cls, era: d.era, ter: W.cities[d.owner] ? W.cities[d.owner].terrain.key : 'plains', id: Math.floor(Math.random() * 1e4) }, p.clone(), Math.random() * TAU, 0, K.factionColor(d.owner), d.era >= 7 ? 1.4 : 1.2, performance.now()); return; }
      const big = d.cls === 'ship' || (d.cls === 'mounted' && d.era >= 4) || (d.cls === 'siege' && d.era >= 3);
      wrecks.push({ p, t0: performance.now(), dur: big ? 3200 : 1600, big, sea: W.war.lanes[d.lane].kind === 'sea', color: K.factionColor(d.owner) });
      if (!reduce) puff(p.clone().setY(p.y + 0.6), big, big ? '#5d5d5d' : '#b9ab98');
      if (big) flash(p.clone().setY(p.y + 1), '#ff9a3d', 3, 600);
    }
    // tên lửa hạt nhân: bay vòng cung, chớp sáng, sóng xung kích, nấm khói
    const nukes = [];
    function nukeFx(fx) {
      const T = lands[fx.to], A = lands[fx.from];
      const from = fx.via === 'sub' ? portWater(A).addScaledVector(A.inw, 10).setY(SEA_Y) : A.world(A.siloPos).setY(4);
      const to = T.center.clone().setY(2);
      const m = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 3.2, 8), new THREE.MeshStandardMaterial({ color: '#f4f4f4', emissive: '#ffcf7a', emissiveIntensity: 0.4 }));
      scene.add(m);
      nukes.push({ m, from, to, t0: performance.now(), dur: 3400, stopped: fx.intercepted, phase: 0, parts: [] });
      if (K.audio && K.audio.on && K.audio.horn) K.audio.horn();
    }
    function nukeBoom(n) {
      const p = n.to;
      if (n.stopped) { flash(n.m.position.clone(), '#ffffff', 22, 900); for (let i = 0; i < 6; i++) puff(n.m.position.clone().add(v3((Math.random() - 0.5) * 6, Math.random() * 3, (Math.random() - 0.5) * 6)), true, '#9a9a9a'); return; }
      flash(p.clone().setY(8), '#ffffff', 120, 1600); flash(p.clone().setY(6), '#ffd27a', 70, 3200);
      const ring = new THREE.Mesh(new THREE.RingGeometry(0.8, 1.6, 48), new THREE.MeshBasicMaterial({ color: '#ffe6b0', transparent: true, opacity: 0.9, side: THREE.DoubleSide, depthWrite: false }));
      ring.rotation.x = -Math.PI / 2; ring.position.copy(p).setY(1); scene.add(ring);
      const cloud = new THREE.Group(); cloud.position.copy(p).setY(0); scene.add(cloud);
      const cm = new THREE.MeshStandardMaterial({ color: '#ffb36b', emissive: '#ff6a2a', emissiveIntensity: 0.9, flatShading: true, roughness: 1, transparent: true, opacity: 0.95 });
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 3.6, 1, 10), cm); stem.position.y = 0.5; cloud.add(stem);
      const cap = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 1), cm); cloud.add(cap);
      const skirt = new THREE.Mesh(new THREE.TorusGeometry(1, 0.45, 8, 16), cm); skirt.rotation.x = Math.PI / 2; cloud.add(skirt);
      n.parts = [ring, cloud]; n.cloud = { stem, cap, skirt, cm }; n.boomT = performance.now();
      if (K.audio && K.audio.on && K.audio.knock) K.audio.knock(3);
      if (K.shake) K.shake(1400);
    }

    /* =============== Mỗi ngày =============== */
    let lastFxDay = -1;
    function syncDay(animate, dayMs) {
      syncBoats();
      updateBuildings(animate);
      if (animate) for (const t of W.trade) if (t.sea) spawnShip(t);
      for (const L of lands) {
        const c = W.cities[L.i], F = FLAGS[L.i];
        const show = W.war.on && c.settled;
        F.pole.visible = F.fl.visible = show;
        if (show && F.owner !== c.owner) { F.owner = c.owner; F.fl.material.color.set(K.factionColor(c.owner)); }
        drawBar(L.i);
      }
      // số cá và thú biển nhìn thấy theo trữ lượng thật
      for (let z = 0; z < 7; z++) { want.anchovy[z] = Math.round(14 * stockFrac(z, 'anchovy')); want.mackerel[z] = Math.round(6 * stockFrac(z, 'mackerel')); want.tuna[z] = z === 6 ? Math.round(14 * stockFrac(6, 'tuna')) : 0; }
      if (animate && W.war.on && W.day !== lastFxDay) { lastFxDay = W.day; for (const fx of W.war.fx) onFx(fx, dayMs); deathsNow(); }
      // chỉ những mẻ hiếm mới hiện chữ: cá voi, mực khổng lồ
      for (const c2 of W.sea.catches) { const k = Sim.SPECIES[c2.species].key; if (animate && (k === 'whale' || k === 'squid')) label3d('+ ' + Sim.SPECIES[c2.species].name, zoneC(c2.zone).setY(5), '#bfefff'); }
    }

    /* =============== Mỗi khung hình =============== */
    const _dir = v3(0, 0, 0), _pos = v3(0, 0, 0);
    function animate(dt, t, frac, night) {
      const ts = t * 0.001;
      // sóng
      if (!reduce) { for (let i = 0; i < wpos.count; i++) { const x = wbase[i * 2], z = wbase[i * 2 + 1]; wpos.setY(i, Math.sin(x * 0.18 + ts * 1.1) * 0.16 + Math.cos(z * 0.21 + ts * 0.9) * 0.14 + Math.sin((x + z) * 0.07 + ts * 0.5) * 0.12); } wpos.needsUpdate = true; }
      waterMat.emissiveIntensity = 0.22 + night * 0.25;
      // cá
      let n = 0;
      for (const f of fish) {
        const zw = f.z, idx = f.i;
        let kind = null;
        if (idx < want.anchovy[zw]) kind = 'a'; else if (idx >= 14 && idx - 14 < want.mackerel[zw]) kind = 'm'; else if (zw === 6 && idx < 14 + want.tuna[6]) kind = 't';
        if (!kind || n >= FISH_N) continue;
        const c = zoneC(zw), a = f.ph + ts * f.w;
        _o.position.set(c.x + Math.cos(a) * f.r, f.d + Math.sin(ts * 2 + f.ph) * 0.15, c.z + Math.sin(a) * f.r);
        _o.rotation.set(0, -a + (f.w > 0 ? 0 : Math.PI), 0);
        _o.scale.setScalar(kind === 't' ? 2.2 : kind === 'm' ? 1.4 : 1); _o.updateMatrix();
        fishMesh.setMatrixAt(n, _o.matrix); fishMesh.setColorAt(n, tmpC.set(kind === 't' ? '#3d5f8a' : kind === 'm' ? '#7fa3b8' : '#d3dde3')); n++;
      }
      fishMesh.count = n; fishMesh.instanceMatrix.needsUpdate = true; if (fishMesh.instanceColor) fishMesh.instanceColor.needsUpdate = true;
      // cá voi, cá mập, rùa, hải cẩu, ngọc trai, mực
      const nw = Math.round(3 * stockFrac(6, 'whale')), ns = Math.round(3 * stockFrac(6, 'shark'));
      whales.forEach((wh, i) => {
        wh.g.visible = i < nw; if (!wh.g.visible) return;
        const a = wh.ph + ts * 0.05, cyc = (ts * 0.12 + i * 0.37) % 1, up = cyc > 0.82 ? Math.sin(((cyc - 0.82) / 0.18) * Math.PI) : 0;
        wh.g.position.set(Math.cos(a) * wh.r, -2.4 + up * 2.3, Math.sin(a) * wh.r); wh.g.rotation.set(-up * 0.25, -a + Math.PI, 0);
        if (up > 0.9 && ts - wh.spout > 6 && !reduce) { wh.spout = ts; puff(wh.g.position.clone().setY(1.2), false, '#ffffff'); }
      });
      sharks.forEach((s, i) => { s.g.visible = i < ns; if (!s.g.visible) return; const a = s.ph - ts * 0.18; s.g.position.set(Math.cos(a) * s.r, (SEA_Y + seaDy) + 0.05, Math.sin(a) * s.r); s.g.rotation.y = -a; });
      turtles.forEach((tt, i) => { const z = tt.zone, nt = Math.round(3 * stockFrac(z, 'turtle')); tt.g.visible = (i % 3) < nt; if (!tt.g.visible) return; const c = zoneC(z), a = tt.ph + ts * 0.08; tt.g.position.set(c.x + Math.cos(a) * tt.r, -1.1 + Math.sin(ts + i) * 0.1, c.z + Math.sin(a) * tt.r); tt.g.rotation.y = -a; });
      seals.forEach((s, i) => { const z = s.zone, cnt = Math.round((z === 3 ? 5 : 3) * stockFrac(z, 'seal')); s.g.visible = (z === 3 ? i : i - 5) < cnt; if (!s.g.visible) return; const L = lands[z], base = L.world(L.dockPos).addScaledVector(L.inw, 9 + (i % 3) * 3).add(v3(Math.cos(i * 2.1) * 6, 0, Math.sin(i * 2.1) * 6)); s.g.position.set(base.x, SEA_Y + 0.25 + Math.sin(ts * 0.8 + i) * 0.08, base.z); s.g.rotation.y = i; });
      for (const P of pearls) { const show = (P.i % 6) < Math.round(6 * stockFrac(P.z, 'pearl')); P.s.material.opacity = show ? 0.35 + 0.35 * Math.max(0, Math.sin(ts * 2 + P.ph)) : 0; }
      squid.g.visible = stockFrac(6, 'squid') > 0.2 && night > 0.5;
      if (squid.g.visible) { squid.g.position.set(Math.cos(ts * 0.03) * 8, -0.8 + Math.sin(ts * 0.7) * 0.4, Math.sin(ts * 0.03) * 8); squid.g.rotation.y = ts * 0.2; }
      // thuyền cá: ra khơi, thả lưới, về bến
      const now = performance.now();
      for (const b of boats) {
        const L = lands[b.city], c = W.cities[b.city], e = c.era, dock = dockEnd(L);
        const blocked = W.war.on && Sim.blockadeOf(W, c);
        if (now > b.t0 + b.dur) {
          b.t0 = now;
          if (b.state === 'dock' && !blocked && !b.retire) { const deep = Math.random() < [0, 0.2, 0.35, 0.45, 0.5, 0.55, 0.6, 0.62][E7(e)], zc = zoneC(deep ? 6 : b.city), a = Math.random() * TAU, r = Math.random() * (deep ? 16 : 8); b.spot = v3(zc.x + Math.cos(a) * r, SEA_Y, zc.z + Math.sin(a) * r); b.state = 'out'; b.dur = (dock.distanceTo(b.spot) / 4) * 1000; }
          else if (b.state === 'out') { b.state = 'fish'; b.dur = 5000 + Math.random() * 6000; }
          else if (b.state === 'fish') { b.state = 'back'; b.dur = (dock.distanceTo(b.spot) / 4) * 1000; }
          else { b.state = 'dock'; b.dur = 3000 + Math.random() * 5000; }
        }
        const u = clamp((now - b.t0) / b.dur, 0, 1), side = v3(-L.inw.z, 0, L.inw.x).multiplyScalar((b.slot - 2.5) * 1.1);
        const home = dock.clone().add(side).addScaledVector(L.inw, -2 - (b.slot % 2) * 1.5);
        let p, ry;
        if (b.state === 'dock') { p = home; ry = Math.atan2(L.inw.x, L.inw.z); }
        else if (b.state === 'fish') { p = b.spot; ry = ts * 0.3 + b.slot; if (Math.random() < 0.004 && !reduce) puff(b.spot.clone().setY(0.2), false, '#e8f4fa'); }
        else { const a = b.state === 'out' ? home : b.spot, z = b.state === 'out' ? b.spot : home; p = a.clone().lerp(z, u * u * (3 - 2 * u)); ry = Math.atan2(z.x - a.x, z.z - a.z); }
        put(modelOf('fish:' + e), _pos.copy(p).setY((SEA_Y + seaDy) + Math.sin(ts * 2 + b.slot) * 0.06), ry, 1, K.factionColor(c.owner));
      }
      for (let i = ships.length - 1; i >= 0; i--) {
        const s = ships[i], u = (now - s.t0) / s.dur;
        if (u >= 1) { ships.splice(i, 1); continue; }
        bez(s.a, s.ctrl, s.b, u, _pos); bez(s.a, s.ctrl, s.b, Math.min(1, u + 0.01), _p);
        put(modelOf('trade:' + s.era), _pos.setY((SEA_Y + seaDy) + Math.sin(ts * 1.6 + i) * 0.08), Math.atan2(_p.x - _pos.x, _p.z - _pos.z), 1, s.color);
      }
      // quân lính: trên tuyến thì nội suy vị trí giữa hai ngày; trong doanh trại thì đứng thành hàng
      for (const key in SOLDIER_SETS) F.crowdBegin(SOLDIER_SETS[key]);
      if (W.war.on) {
        const garrison = {};
        for (const u of W.war.units) {
          if (u.dead) continue;
          const col = K.factionColor(u.owner), fig = isFig(u), fighting = W.day - (u.fight == null ? -9 : u.fight) <= 1;
          if (u.lane && W.war.lanes[u.lane]) {
            const x = lerp(u.px, u.x, clamp(frac, 0, 1));
            if (!lanePos(u.lane, x, u.lat, _pos, _dir)) continue;
            const moving = Math.abs(u.x - u.px) > 1e-4, fwd = u.side === 0 ? 1 : -1, ry = Math.atan2(_dir.x * fwd, _dir.z * fwd);
            if (fig) { drawSquad(u, _pos, ry, moving, fighting, col, now); continue; }
            const S = modelOf(keyOf(u)), naval = u.naval;
            if (!naval && moving) _pos.y += Math.abs(Math.sin(ts * 9 + u.id)) * 0.06;
            if (naval) _pos.y = (SEA_Y + seaDy) + Math.sin(ts * 1.4 + u.id) * 0.07;
            if (u.cls === 'ranged') _pos.y += 2.2 + Math.sin(ts * 3 + u.id) * 0.2; // bầy máy bay không người lái
            if (fighting && (u.cls === 'mounted' || u.cls === 'siege') && !reduce) _pos.addScaledVector(_dir, -fwd * Math.max(0, Math.sin(ts * 14 + u.id)) * 0.12); // giật lùi khi bắn
            put(S, _pos, ry, naval ? 1 : 1.25, col);
          } else {
            const L = lands[u.city], gk = u.city + (u.naval ? 'n' : 'l'), g = garrison[gk] = (garrison[gk] || 0) + 1;
            if (u.naval) {
              if (g > 4) continue;
              const p = portWater(L).addScaledVector(v3(-L.inw.z, 0, L.inw.x), (g - 2.5) * 3.2);
              p.y = u.cls === 'sub' ? (SEA_Y + seaDy) - 0.55 : (SEA_Y + seaDy) + Math.sin(ts + g) * 0.06;
              put(modelOf(u.cls + ':' + u.era), p, Math.atan2(L.inw.x, L.inw.z), 1, col);
            } else {
              if (g > 24) continue;
              const lot = L.musterPos || L.milLot.barracks || L.gates[0], face = L.musterRy != null ? L.musterRy : Math.atan2(-lot.x, -lot.z);
              const p = L.world(lot).add(v3(((g - 1) % 6) * 1.25 - 3.1, 0, Math.floor((g - 1) / 6) * 1.35 - 2.0).applyAxisAngle(v3(0, 1, 0), face));
              if (fig) F.crowdPut(soldierSet(u.cls, u.era, terOf(u)), 0, p, face, 0, Math.sin(ts * 0.8 + u.id) > 0.7 ? 0.5 : 0, u.id * 7, u.era >= 7 ? 1.35 : 1.15, [col, PANTS[u.era], HELMS[u.era], F.SKIN_T[u.id % 6]]);
              else { if (u.cls === 'ranged') p.y += 2; put(modelOf(keyOf(u)), p, face, 1.1, col); }
            }
          }
        }
      }
      // xác lính nằm lại trên chiến trường một lúc
      for (let i = corpses.length - 1; i >= 0; i--) { const c = corpses[i]; if (now - c.t0 > 24000) { corpses.splice(i, 1); continue; } F.crowdPut(soldierSet(c.cls, c.era, c.ter), 0, c.p, c.ry, 0, 0, c.seed, c.sc, c.colors, -Math.PI / 2); }
      for (const fn of extraSoldiers) { try { fn(putSoldier, now); } catch (err) { /* một lớp hỏng không làm hỏng quân */ } }
      for (const key in SOLDIER_SETS) F.crowdEnd(SOLDIER_SETS[key]);
      // thành đang bị vây: khói lửa ở cổng
      if (!reduce && W.war.on && Math.random() < 0.25) for (const c of W.cities) {
        if (!c.settled || W.day - c.lastHit > 2 || c.hp / c.hpMax > 0.75) continue;
        const L = lands[c.id], gt = L.gates[Math.floor(Math.random() * L.gates.length)];
        puff(L.world(gt).setY(1.5 + Math.random() * 2), true, '#4a4a4a');
        if (Math.random() < 0.3) flash(L.world(gt).setY(1.2), '#ff8a3d', 2.4, 500);
      }
      for (const key in MODELS) flush(MODELS[key]);
      // đạn
      let nb = 0, nl = 0;
      for (let i = shots.length - 1; i >= 0; i--) {
        const s = shots[i], u = (now - s.t0) / s.dur;
        if (u < 0) continue;
        if (u >= 1) {
          shots.splice(i, 1);
          if (s.hit === 'boom') { flash(s.to, '#ffb347', 3.2, 520); if (!reduce) puff(s.to.clone(), true, '#6b6b6b'); }
          else if (s.hit === 'dust' || s.hit === 'smoke') { if (!reduce) puff(s.to.clone(), false, '#c9b9a0'); }
          else if (s.hit === 'fire') flash(s.to, '#ff8a3d', 2, 500);
          else if (s.gate) flash(s.to, '#fff2c0', 1.2, 200);
          continue;
        }
        _p.copy(s.from).lerp(s.to, u); _p.y += Math.sin(u * Math.PI) * s.arc;
        if (s.form === 'ball' && nb < 160) { _o.position.copy(_p); _o.rotation.set(0, 0, 0); _o.scale.setScalar(s.size); _o.updateMatrix(); ballMesh.setMatrixAt(nb, _o.matrix); ballMesh.setColorAt(nb, tmpC.set(s.color)); nb++; }
        else if (nl < 200) { _q.copy(s.from).lerp(s.to, Math.min(1, u + 0.02)); _q.y += Math.sin(Math.min(1, u + 0.02) * Math.PI) * s.arc; _o.position.copy(_p); _o.lookAt(_q); _o.scale.set(1, 1, s.size); _o.updateMatrix(); boltMesh.setMatrixAt(nl, _o.matrix); boltMesh.setColorAt(nl, tmpC.set(s.color)); nl++; }
      }
      ballMesh.count = nb; boltMesh.count = nl;
      for (const m of [ballMesh, boltMesh]) { m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; }
      for (let i = flashes.length - 1; i >= 0; i--) { const f = flashes[i], u = (now - f.t0) / f.dur; if (u >= 1) { f.s.visible = false; flashes.splice(i, 1); continue; } f.s.material.opacity = (1 - u) * 0.95; f.s.scale.setScalar(f.size * (0.6 + u * 0.8)); }
      for (let i = wrecks.length - 1; i >= 0; i--) { const w = wrecks[i], u = (now - w.t0) / w.dur; if (u >= 1) { wrecks.splice(i, 1); continue; } if (w.big && Math.random() < 0.08 && !reduce) puff(w.p.clone().setY(w.p.y + 0.8), true, '#4a4a4a'); }
      // khói ống khói công trình
      if (!reduce && Math.random() < 0.06) for (const key in BLD_OF) { const o = BLD_OF[key]; if (!o.smoke || Math.random() > 0.3) continue; const L = lands[+key.split(':')[0]]; for (const s of o.smoke) puff(o.g.localToWorld(v3(s[0], s[1], s[2])), true, '#8d8d8d'); }
      // cờ bay
      for (const F of FLAGS) { if (!F.fl.visible) continue; const pa = F.fl.geometry.attributes.position; for (let i = 0; i < pa.count; i++) { const x0 = F.base[i * 3]; pa.setZ(i, Math.sin(x0 * 1.6 - ts * 4 + F.i) * 0.18 * (x0 / 2.4)); } pa.needsUpdate = true; }
      // hạt nhân
      for (let i = nukes.length - 1; i >= 0; i--) {
        const nk = nukes[i];
        if (!nk.boomT) {
          const u = clamp((now - nk.t0) / nk.dur, 0, 1), end = nk.stopped ? 0.78 : 1;
          _p.copy(nk.from).lerp(nk.to, u); _p.y += Math.sin(u * Math.PI) * 70;
          _q.copy(nk.from).lerp(nk.to, Math.min(1, u + 0.01)); _q.y += Math.sin(Math.min(1, u + 0.01) * Math.PI) * 70;
          nk.m.position.copy(_p); nk.m.lookAt(_q); nk.m.rotateX(Math.PI / 2);
          if (!reduce && Math.random() < 0.6) puff(_p.clone(), false, '#f4f4f4');
          if (u >= end) { scene.remove(nk.m); nukeBoom(nk); if (nk.stopped) { nukes.splice(i, 1); } }
          continue;
        }
        const u = (now - nk.boomT) / 9000;
        const [ring, cloud] = nk.parts;
        if (u >= 1) { scene.remove(ring); scene.remove(cloud); nukes.splice(i, 1); continue; }
        ring.scale.setScalar(1 + u * 70); ring.material.opacity = 0.9 * (1 - Math.min(1, u * 3));
        const h = 4 + Math.min(1, u * 2.2) * 34, cl = nk.cloud;
        cl.stem.scale.set(1 + u, h, 1 + u); cl.stem.position.y = h / 2;
        cl.cap.position.y = h + 3; cl.cap.scale.set(7 + u * 9, 5 + u * 5, 7 + u * 9);
        cl.skirt.position.y = h - 1; cl.skirt.scale.setScalar(6 + u * 9);
        cl.cm.emissiveIntensity = Math.max(0, 0.9 - u * 1.4); cl.cm.color.set(u < 0.3 ? '#ffb36b' : '#8a7f78'); cl.cm.opacity = u < 0.7 ? 0.95 : 0.95 * (1 - (u - 0.7) / 0.3);
      }
    }

    // những người lính vừa ngã (kể cả giữa ngày, vì phép của chim, mèo): xác nằm lại ngay chỗ ngã
    function deathsNow() { for (const d of W.war.deaths) if (!d.shown) { d.shown = true; onDeath(d); } }
    function setSea(dy, tiltX, tiltZ) {
      seaDy = dy; water.position.y = SEA_Y + dy; rim.position.y = SEA_Y - 1.45 + dy;
      water.rotation.x = tiltX || 0; water.rotation.z = tiltZ || 0;
    }
    return { syncDay, animate, lanePos, portWater, zoneC, shotRaw, deathsNow, SEA_R, SEA_Y, setSea, get seaDy() { return seaDy; }, buildings: BLD_OF, addSoldiers: (fn) => extraSoldiers.push(fn), soldierColors: (owner, era, seed) => [K.factionColor(owner), PANTS[era], HELMS[era], F.SKIN_T[(seed >>> 0) % 6]] };
  }

  root.War3D = { create, SEA_R, SEA_Y };
})(typeof self !== 'undefined' ? self : this);
