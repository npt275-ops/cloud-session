/* Bể Kính · render/village3d.js
 * Hiển thị người của một làng trên đảo: mỗi người một khung khớp (render/rig3d.js), cử động bằng render/anim3d.js
 * theo việc mà bộ não (logic/brain.js) đã chọn. Người đi tới chỗ cần đến (nhà, ruộng, nhà chính, quảng trường, cầu)
 * hay tới gần người mình nói chuyện, cãi nhau, đánh nhau. Tên nổi trên đầu khi nhìn gần, bấm vào người để chọn.
 * Bộ phận cùng loại của mọi người là một khối lặp: khoảng 25 lượt vẽ cho cả làng dù đông bao nhiêu.
 * Cần: three.js, logic/brain.js, logic/people.js, render/rig3d.js, render/anim3d.js. Không sửa trạng thái logic. */
(function (root, factory) {
  const BK = root.BK || (root.BK = {});
  BK.Village3D = factory(BK);
})(typeof self !== 'undefined' ? self : globalThis, function (BK) {
  'use strict';

  function create(o) {
    const { THREE, scene, L, S, clearTrees } = o, Rig = BK.Rig3D, Anim = BK.Anim3D, Brain = BK.Brain, P = BK.People;
    const CAP = 64; // số người tối đa vẽ được (logic giới hạn 40 người có tên)

    /* ---------- Những chỗ trong làng (toạ độ trên đảo) ---------- */
    const at = (a, r) => new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r);
    const ia = Math.atan2(L.inw.z, L.inw.x), oa = L.oa;
    const SPOT = {
      hall: new THREE.Vector3(0, 0, 0),
      square: at(ia, 6.5),
      field: at(oa + 0.9, 27),
      bridge: L.landing[0].clone().multiplyScalar(0.86),
    };
    const homeOf = (clan) => { const i = Math.max(0, S.clans.indexOf(clan)); return at(ia + 0.6 + i * (Math.PI * 2 - 1.2) / 8, 11.5); };
    // dọn một khoảng đất trống cho làng (cây quanh chỗ ở và nhà chính)
    if (clearTrees) { clearTrees(L, 0, 0, 9); clearTrees(L, SPOT.square.x, SPOT.square.z, 4); for (const c of S.clans) { const h = homeOf(c); clearTrees(L, h.x, h.z, 3.2); } }

    /* ---------- Khối lặp cho từng loại bộ phận ---------- */
    const shapes = Rig.shapes(), mat = new THREE.MeshStandardMaterial({ roughness: 0.75, metalness: 0 });
    const IM = {};
    for (const type in shapes) {
      const per = type === 'eye' ? 2 : 2; // tay chân có hai bên
      const m = new THREE.InstancedMesh(shapes[type], mat, CAP * per);
      m.setColorAt(0, new THREE.Color()); // tạo bộ màu đủ chỗ trước khi đặt số lượng về 0 (three.js cấp bộ màu theo số lượng lúc này)
      m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); m.instanceColor.setUsage(THREE.DynamicDrawUsage); m.count = 0; m.castShadow = true; m.frustumCulled = false; m.userData.owner = [];
      scene.add(m); IM[type] = m;
    }

    /* ---------- Mỗi người: khung, tư thế, vị trí ---------- */
    const folks = new Map(); // id → { p, rig, cur, pos, yaw, ph, key, label }
    function rigKey(p) { return p.role + '|' + (P.ageOf(p, S.day) >= 6 ? 'a' : 'c'); }
    function ensure(p) {
      let f = folks.get(p.id);
      if (f && f.key === rigKey(p)) return f;
      const rig = Rig.build(p, 0);
      if (!f) {
        const start = homeOf(p.clan).clone().add(new THREE.Vector3((Math.random() - 0.5) * 3, 0, (Math.random() - 0.5) * 3));
        f = { p, rig, cur: Anim.blank(), pos: start, yaw: Math.random() * 6.28, ph: Math.random() * 6, label: null, jit: new THREE.Vector3((Math.random() - 0.5) * 3, 0, (Math.random() - 0.5) * 3) };
        folks.set(p.id, f);
      }
      f.rig = rig; f.key = rigKey(p);
      if (f.label) { scene.remove(f.label); f.label.material.map.dispose(); f.label.material.dispose(); }
      f.label = makeLabel(p);
      scene.add(f.label);
      return f;
    }

    /* ---------- Tên nổi trên đầu ---------- */
    function makeLabel(p) {
      const c = document.createElement('canvas'); c.width = 256; c.height = 64; const x = c.getContext('2d');
      x.fillStyle = 'rgba(14,22,38,0.72)'; const w = 236; x.beginPath(); x.roundRect ? x.roundRect(10, 6, w, 52, 18) : x.rect(10, 6, w, 52); x.fill();
      x.fillStyle = '#fffaf0'; x.font = '600 24px Outfit, system-ui, sans-serif'; x.textAlign = 'center'; x.fillText(P.fullName(p), 128, 32);
      x.fillStyle = '#ffd27a'; x.font = '500 16px Outfit, system-ui, sans-serif'; x.fillText(p.role ? BK.Council.seatName(p.role, p.sex) : p.commoner ? 'người dân thường' : 'đời thứ ' + (p.gen + 1), 128, 52);
      const t = new THREE.CanvasTexture(c);
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false }));
      s.scale.set(1.7, 0.42, 1); s.renderOrder = 10; return s;
    }

    /* ---------- Đi tới đâu ---------- */
    const _v = new THREE.Vector3();
    function goalOf(f, mind) {
      const tgt = mind.target != null ? folks.get(mind.target) : null;
      if (tgt && (mind.state === 'talk' || mind.state === 'attack')) {
        // đứng cách người kia một khoảng, nhìn về phía họ (người sợ hãi đứng xa hơn)
        const K = f.knobs, gap = mind.state === 'attack' ? 0.95 - K.lean * 0.2 : 1.3 + (K.lean < 0 ? -K.lean * 0.6 : 0);
        _v.copy(f.pos).sub(tgt.pos); if (_v.lengthSq() < 1e-4) _v.set(1, 0, 0);
        return { p: tgt.pos.clone().addScaledVector(_v.normalize(), gap), face: tgt.pos };
      }
      const base = mind.place === 'home' ? homeOf(f.p.clan) : SPOT[mind.place] || null;
      return base ? { p: base.clone().add(f.jit), face: null } : null;
    }

    /* ---------- Mỗi khung hình ---------- */
    const _m = new THREE.Matrix4(), _w = new THREE.Vector3();
    let selected = null;
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.55, 0.7, 32), new THREE.MeshBasicMaterial({ color: '#ffd27a', transparent: true, opacity: 0.9, depthWrite: false, side: THREE.DoubleSide }));
    ring.rotation.x = -Math.PI / 2; ring.visible = false; scene.add(ring);
    function update(dt, t, camera) {
      const sec = Math.min(0.1, dt / 1000), alive = new Set();
      for (const p of S.people.values()) {
        if (!p.alive) continue;
        alive.add(p.id);
        const f = ensure(p), mind = S.minds.get(p.id) || { state: 'idle' };
        f.knobs = Object.assign(Brain.knobs(p.genome, mind.stress || 0), { seed: p.id * 1.7 });
        // tới chỗ cần đến
        const goal = goalOf(f, mind);
        let moving = false;
        if (goal) {
          _v.copy(goal.p).sub(f.pos); _v.y = 0;
          const d = _v.length(), run = mind.state === 'panic' || (mind.state === 'attack' && d > 2);
          const speed = (run ? 3.2 : 1.1) * f.knobs.tempo * (0.8 + 0.4 * f.knobs.stride);
          if (d > 0.25) { moving = true; const step = Math.min(d, speed * sec); f.pos.addScaledVector(_v.normalize(), step); f.ph += step / (0.55 + 0.3 * f.knobs.stride) * Math.PI; turnTo(f, Math.atan2(_v.x, _v.z), sec); }
          else if (goal.face) { _v.copy(goal.face).sub(f.pos); turnTo(f, Math.atan2(_v.x, _v.z), sec); }
        }
        if (!moving) f.ph += sec * 3 * f.knobs.tempo;
        const tgt = Anim.target(mind.state, f.ph, t * 0.001, f.knobs, { habit: p.genome.habit, mood: mind.mood, moving });
        Anim.apply(f.rig, f.cur, tgt, dt);
        // đặt khung vào thế giới: trẻ con nhỏ hơn
        const age = P.ageOf(p, S.day), sc = age >= 16 ? 1 : 0.5 + 0.5 * Math.max(0, age) / 16;
        f.rig.root.position.copy(L.center).add(f.pos); f.rig.root.rotation.y = f.yaw; f.rig.root.scale.setScalar(sc * 1.15);
        f.rig.root.updateMatrixWorld(true);
        // tên: hiện khi nhìn gần
        f.label.position.copy(f.rig.root.position).setY(2.55 * sc * 1.15 + 0.35);
        f.label.visible = camera.position.distanceTo(f.label.position) < 34 || selected === p.id; // tên chỉ hiện khi nhìn gần, hoặc người đang chọn
      }
      for (const [id, f] of folks) if (!alive.has(id)) { scene.remove(f.label); f.label.material.map.dispose(); folks.delete(id); if (selected === id) selected = null; }
      // đổ vào các khối lặp
      for (const type in IM) { IM[type].count = 0; IM[type].userData.owner.length = 0; }
      for (const [id, f] of folks) for (const part of f.rig.parts) {
        const m = IM[part.type], i = m.count; if (i >= m.instanceMatrix.count) continue;
        _m.multiplyMatrices(part.node.matrixWorld, part.local); m.setMatrixAt(i, _m); m.setColorAt(i, part.color); m.userData.owner[i] = id; m.count++;
      }
      for (const type in IM) { const m = IM[type]; m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; }
      const sf = selected != null && folks.get(selected);
      ring.visible = !!sf; if (sf) ring.position.copy(sf.rig.root.position).setY(sf.rig.root.position.y + 0.06);
    }
    function turnTo(f, yaw, sec) { let d = yaw - f.yaw; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; f.yaw += d * Math.min(1, sec * 8); }

    /* ---------- Bấm chọn một người ---------- */
    function pick(raycaster) {
      let best = null, bd = 1e9;
      for (const type of ['head', 'torso', 'pelvis', 'hairShort', 'hairLong']) {
        const m = IM[type]; if (!m.count) continue;
        for (const h of raycaster.intersectObject(m)) if (h.distance < bd && h.instanceId != null) { bd = h.distance; best = m.userData.owner[h.instanceId]; }
      }
      return best;
    }
    const select = (id) => { selected = id; };
    const worldPos = (id) => { const f = folks.get(id); return f ? f.rig.root.position.clone() : null; };
    const center = () => L.center.clone();
    return { update, pick, select, worldPos, center, get selected() { return selected; } };
  }

  return { create };
});
