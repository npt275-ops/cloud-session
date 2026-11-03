/* Bể Kính · render/model3d.js
 * NPC mẫu: một người duy nhất trên đảo, dùng để huấn luyện từng cử chỉ trong thư viện (render/gestures3d.js) trước khi áp
 * cho mọi NPC. Tự diễn lần lượt cả danh sách, hoặc diễn một cử chỉ được chọn. Cử chỉ có di chuyển thì người đi vòng
 * quanh sân trước nhà chính. Đồ cầm tay hiện theo cử chỉ. Núm vặn cử động lấy từ gen của người này (logic/brain.js).
 * Khuôn mặt (render/face3d.js) đổi theo cử chỉ, hoặc theo biểu cảm được ghim.
 * Cần: three.js, render/rig3d.js, render/anim3d.js, render/gestures3d.js, render/face3d.js, logic/brain.js. */
(function (root, factory) {
  const BK = root.BK || (root.BK = {});
  BK.Model3D = factory(BK);
})(typeof self !== 'undefined' ? self : globalThis, function (BK) {
  'use strict';

  function create(o) {
    const { THREE, scene, L, person, clearTrees } = o, Rig = BK.Rig3D, Anim = BK.Anim3D, Gs = BK.Gestures3D, Brain = BK.Brain;
    const SCALE = Rig.PERSON_SCALE, LOOP_SEC = 5, HOLD_SEC = 0.9; // cùng cỡ với người trong làng, cân với nhà (render/rig3d.js)
    // sân diễn: bãi trống trước kho bạc, phía biển trong (render/buildings3d.js: SMALL), nhìn vào thấy người đứng trước nhà để so cỡ
    const ia = Math.atan2(L.inw.z, L.inw.x), stage = new THREE.Vector3(Math.cos(ia) * 14, 0, Math.sin(ia) * 14), R = 2;
    if (clearTrees) clearTrees(L, stage.x, stage.z, R + 2);

    /* ---------- Khung và bộ phận: một người nên mỗi bộ phận là một khối riêng ---------- */
    const rig = Rig.build(Object.assign({}, person, { role: null }), 0), shapes = Rig.shapes();
    // mắt dựng riêng ở khuôn mặt (render/face3d.js), nên bỏ mắt mặc định của khung
    const meshes = rig.parts.filter((part) => part.type !== 'eye').map((part) => { const m = new THREE.Mesh(shapes[part.type], new THREE.MeshStandardMaterial({ color: part.color, roughness: 0.75 })); m.matrixAutoUpdate = false; m.castShadow = true; m.userData.model = true; scene.add(m); return { m, part }; });
    const props = Rig.buildProps(rig.nodes);
    scene.add(rig.root); rig.root.rotation.order = 'YXZ';
    // vòng sáng dưới chân: nhìn từ xa vẫn thấy NPC mẫu đứng ở đâu
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.72, 0.96, 40), new THREE.MeshBasicMaterial({ color: '#ffd27a', transparent: true, opacity: 0.85, depthWrite: false, side: THREE.DoubleSide }));
    ring.rotation.x = -Math.PI / 2; ring.renderOrder = 3; scene.add(ring);
    const K = Object.assign(Brain.knobs(person.genome, 0.3), { seed: person.id * 1.7 });
    const face = BK.Face3D.create({ THREE, head: rig.nodes.head });
    let pinnedFace = null; // null: biểu cảm theo cử chỉ

    /* ---------- Đang diễn gì ---------- */
    const faceYaw = Math.atan2(L.inw.x, L.inw.z); // quay mặt về phía biển trong (phía camera nhìn vào); góc quay theo trục y dùng atan2(x, z)
    let idx = 0, auto = true, startT = 0, ang = 0, yaw = faceYaw, ph = 0;
    const pos = stage.clone(), cur = Anim.blank();
    const current = () => Gs.LIST[idx];
    function play(key, keepAuto) { const i = Gs.LIST.findIndex((g) => g.key === key); if (i < 0) return; idx = i; startT = -1; auto = !!keepAuto; }
    function setAuto(on) { auto = on; startT = -1; }
    function showProps(G) {
      for (const k in props) props[k].visible = false;
      if (G.prop && props[G.prop]) { props[G.prop].visible = true; const w = props[G.prop].userData.with; if (w) props[w].visible = true; }
    }
    showProps(current());

    /* ---------- Mỗi khung hình ---------- */
    const _m = new THREE.Matrix4();
    function update(dt, t) {
      dt = Math.max(0, dt || 0); const sec = Math.min(0.1, dt / 1000), ts = t * 0.001;
      if (startT < 0) { startT = ts; showProps(current()); }
      let G = current(), el = ts - startT;
      const span = G.loop ? LOOP_SEC : G.dur + HOLD_SEC;
      if (auto && el > span) { idx = (idx + 1) % Gs.LIST.length; startT = ts; el = 0; G = current(); showProps(G); }
      const u = G.loop ? (el % LOOP_SEC) / LOOP_SEC : Math.min(1, el / G.dur);
      // đi vòng quanh sân khi cử chỉ có di chuyển (lùi lại thì đi giật lùi)
      if (G.move) {
        const v = G.move * K.tempo * 0.9 * (0.8 + 0.4 * K.stride) * SCALE; // bước dài theo cỡ người
        ang += (v * sec) / R; pos.set(stage.x + Math.cos(ang) * R, 0, stage.z + Math.sin(ang) * R);
        const fwd = Math.atan2(-Math.sin(ang), Math.cos(ang)) ; // hướng tiếp tuyến của vòng tròn
        const want = v >= 0 ? fwd : fwd + Math.PI;
        let d = want - yaw; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; yaw += d * Math.min(1, sec * 6);
        ph += (Math.abs(v) * sec) / ((0.55 + 0.3 * K.stride) * SCALE) * Math.PI;
      } else {
        ph += sec * 3 * K.tempo;
        // đứng yên thì quay mặt ra phía camera nhìn vào (phía biển trong)
        let d = faceYaw - yaw; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; yaw += d * Math.min(1, sec * 2);
      }
      face.set(pinnedFace || G.face); face.setClosed(!pinnedFace && G.closed && (G.loop || u > 0.55));
      face.update(dt, ts);
      const p = Anim.basePose(K);
      G.pose(p, ph, u, ts, K);
      Anim.addLife(p, ts, K);
      Anim.apply(rig, cur, p, dt);
      rig.root.position.copy(L.center).add(pos); rig.root.position.y += cur.ty * SCALE;
      rig.root.rotation.set(cur.rx, yaw, 0); rig.root.scale.setScalar(SCALE);
      ring.position.copy(L.center).add(pos).setY(0.08); ring.scale.setScalar(1 + 0.08 * Math.sin(ts * 3));
      rig.root.updateMatrixWorld(true);
      for (const { m, part } of meshes) { _m.multiplyMatrices(part.node.matrixWorld, part.local); m.matrix.copy(_m); m.matrixWorldNeedsUpdate = true; }
    }

    /* ---------- Bấm vào người mẫu ---------- */
    function hit(raycaster) { return raycaster.intersectObjects(meshes.map((x) => x.m)).length > 0; }
    const worldPos = () => L.center.clone().add(pos); // dùng được ngay cả trước khung hình đầu tiên
    const setFace = (key) => { pinnedFace = key || null; };
    return { _rig: rig, _cur: cur, update, play, setAuto, setFace, hit, worldPos, person, knobs: K, get face() { return face.key; }, get pinnedFace() { return pinnedFace; }, get current() { return current(); }, get index() { return idx; }, get auto() { return auto; } };
  }

  return { create };
});
