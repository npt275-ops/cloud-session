/* Bể Kính · render/village3d.js
 * Người của một làng trên đảo: mỗi người một khung khớp (render/rig3d.js, nét vẽ đã chốt, trang phục theo thời và nhóm),
 * cử động bằng render/anim3d.js theo việc mà bộ não (logic/brain.js) đã chọn. Người đi tới chỗ cần đến theo công trình
 * của thời đang có (render/buildings3d.js places: nhà chính, sân, ruộng, nhà ở, chỗ tuần tra, cầu) hay tới gần người
 * mình nói chuyện, cãi nhau, đánh nhau. Nét mặt đổi theo việc (vui khi trò chuyện, giận khi cãi, sợ khi chạy, nhắm mắt
 * khi cầu nguyện), mắt tự chớp. Người đi đường đi dạo dọc phố theo mạng đường của đảo, gặp nhau thì dừng lại trò chuyện
 * rồi đi tiếp; drama (logic/dramas.js) gom người tới chỗ của nó: đám bạo loạn hô hào, người nghe đứng thành vòng quanh người nói. Tới nơi làm việc thì dùng cử chỉ trong thư viện (render/work3d.js: cuốc, gặt, đóng búa, canh
 * gác, diễn thuyết, ăn, ngồi...) và cầm đúng đồ; đêm thì vào nhà ngủ (không vẽ). Không có tên trên đầu: bấm vào người để mở thẻ.
 * Bộ phận cùng loại của mọi người là một khối lặp: khoảng 40 lượt vẽ cho cả làng dù đông bao nhiêu.
 * Đi đường (lối đi, vỉa hè, sang đường, tường thành, đi dạo): render/nav3d.js.
 * Cần: three.js, logic/brain.js, logic/people.js, logic/island.js, render/rig3d.js, render/anim3d.js, render/nav3d.js. Không sửa logic. */
(function (root, factory) {
  const BK = root.BK || (root.BK = {});
  BK.Village3D = factory(BK);
})(typeof self !== 'undefined' ? self : globalThis, function (BK) {
  'use strict';

  // biểu cảm: độ mở mắt, độ nghiêng và độ cao lông mày, hình miệng, má hồng
  const EXPR = {
    neutral: { eye: 1, tilt: 0, by: 0, mouth: 'line' }, happy: { eye: 0.62, tilt: -0.1, by: 0.01, mouth: 'smile', cheek: true },
    sad: { eye: 0.75, tilt: -0.45, by: 0.006, mouth: 'frown' }, angry: { eye: 0.55, tilt: 0.5, by: -0.012, mouth: 'line' },
    fear: { eye: 1.3, tilt: -0.4, by: 0.02, mouth: 'open' }, surprise: { eye: 1.4, tilt: 0, by: 0.035, mouth: 'open' }, closed: { eye: 0.1, tilt: 0, by: -0.008, mouth: 'line' },
  };

  function create(o) {
    const { THREE, scene, L, S } = o, Rig = BK.Rig3D, Anim = BK.Anim3D, Brain = BK.Brain, P = BK.People, Work = BK.Work3D;
    const SCALE = Rig.PERSON_SCALE;
    let level = o.level || 1, PL = o.places || null;
    const Nav = BK.Nav3D.create({ THREE, L, level: () => level, places: () => PL }); // lối đi: render/nav3d.js

    /* ---------- Những chỗ trong làng ---------- */
    const bridge = L.landing[0].clone().multiplyScalar(0.86);
    const pickOf = (arr, k) => (arr && arr.length ? arr[Math.abs(k) % arr.length] : null);
    function spot(place, p) {
      if (!PL) return null;
      const k = p.id * 7 + Math.max(0, S.clans.indexOf(p.clan));
      // nhà theo gia đình: vợ chồng, con cái ở chung một nhà (theo người cha hay người mẹ đầu tiên của nhà đó)
      if (place === 'home' && p.home != null && PL.homeSlots && PL.homeSlots[p.home]) return PL.homeSlots[p.home]; // nhà riêng của hộ (logic/homes.js)
      if (place === 'home') { const fam = p.parents && p.parents.length && P.ageOf(p, S.day) < 18 ? p.parents[0] : Math.min(p.id, p.spouse || p.id); return pickOf(PL.homes, fam * 5 + Math.max(0, S.clans.indexOf(p.clan))); }
      if (place === 'hall') return PL.hall;
      if (place === 'square') return pickOf(PL.square, k);
      if (place === 'field') return pickOf(PL.field, k);
      if (place === 'guard') return pickOf(PL.guard, p.id);
      if (place === 'bridge') return bridge;
      if (place === 'gate') return PL.gate && PL.gate.length ? PL.gate[(p.post || 0) % PL.gate.length] : pickOf(PL.guard, p.id); // bốn chốt gác cổng thành
      if (place === 'gateL' || place === 'gateR') return PL[place] && PL[place].length ? PL[place][(p.post || 0) % PL[place].length] : pickOf(PL.guard, p.id); // hai chốt mỗi cổng phụ
      if (place === 'podium') return PL.podium || pickOf(PL.square, k); // bục diễn thuyết giữa sân
      if (place === 'hallLoop') return PL.hall; // (vòng đi dạo quanh nhà chính: hallGoal)
      if (place === 'site') return pickOf(PL.site && PL.site.length ? PL.site : PL.all, p.id);
      if (place === 'market') return pickOf(PL.market, k);
      if (place === 'shrine') return pickOf(PL.shrine, k);
      if (place === 'school') return pickOf(PL.school, k);
      // đi vòng: người đi đường, thợ đi tu bổ, thầy thuốc đi thăm từng nhà, lính đi tuần đổi chỗ theo thời gian
      const hop = (arr, every) => pickOf(arr, p.id * 3 + Math.floor(S.day * every + (p.id % 7) * 0.13));
      if (place === 'stroll') return hop(PL.all, 5);
      if (place === 'repair') return hop(PL.all, 1.5);
      if (place === 'visit') return hop(PL.homes, 2);
      if (place === 'patrol') return hop(PL.guard, 3);
      return null;
    }
    const setPlaces = (pl) => { PL = pl; Nav.reset(); }; // bục giữa sân có thể đổi theo thời: dựng lại mạng lối đi

    /* ---------- Khối lặp cho từng loại bộ phận (tự nới chỗ khi làng đông lên) ---------- */
    const shapes = Rig.shapes(), mat = new THREE.MeshStandardMaterial({ roughness: 0.78, metalness: 0 }), glowMat = new THREE.MeshBasicMaterial({ toneMapped: false });
    const IM = {};
    function im(type, need) {
      let m = IM[type];
      if (m && m.instanceMatrix.count >= need) return m;
      const cap = Math.max(64, Math.ceil(need * 1.5));
      if (m) { scene.remove(m); m.dispose(); }
      m = new THREE.InstancedMesh(shapes[type], Rig.GLOW.has(type) ? glowMat : mat, cap);
      m.setColorAt(0, new THREE.Color()); // tạo bộ màu đủ chỗ trước khi đặt số lượng về 0
      m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); m.instanceColor.setUsage(THREE.DynamicDrawUsage); m.count = 0;
      m.castShadow = !Rig.GLOW.has(type); m.frustumCulled = false; m.userData.owner = []; scene.add(m); IM[type] = m;
      return m;
    }

    /* ---------- Mỗi người: khung, tư thế, vị trí ---------- */
    const folks = new Map();
    const ageBand = (a) => (a < 6 ? 'c' : a < 55 ? 'a' : 'o');
    function rigKey(p, age) { return level + '|' + p.role + '|' + p.job + '|' + ageBand(age); }
    function ensure(p, age) {
      let f = folks.get(p.id); const key = rigKey(p, age);
      if (f && f.key === key) return f;
      const rig = Rig.build(p, { level, age });
      for (const part of rig.parts) if (part.face) { part.dec = { p: new THREE.Vector3(), q: new THREE.Quaternion(), s: new THREE.Vector3() }; part.local.decompose(part.dec.p, part.dec.q, part.dec.s); }
      if (!f) {
        const h = spot('home', p), start = (h ? h.clone() : new THREE.Vector3()).add(new THREE.Vector3((Math.random() - 0.5) * 3, 0, (Math.random() - 0.5) * 3));
        f = { p, cur: Anim.blank(), pos: start, yaw: Math.random() * 6.28, ph: Math.random() * 6, jit: new THREE.Vector3(), blinkAt: Math.random() * 4, blink: 0 };
        folks.set(p.id, f);
      }
      // chỗ đứng lệch một chút quanh điểm đến (trước cửa, trước chỗ làm), không dồn đúng một điểm
      { const r = 0.7 + Math.sqrt(Math.random()) * 1.5, a = Math.random() * Math.PI * 2; f.jit.set(Math.cos(a) * r, 0, Math.sin(a) * r); } // đứng ngay trước chỗ làm, cửa nhà
      f.rig = rig; f.key = key; return f;
    }

    /* ---------- Đi tới đâu ---------- */
    const _v = new THREE.Vector3();
    function goalOf(f, mind) {
      const tgt = mind.target != null ? folks.get(mind.target) : null;
      if (tgt && (mind.state === 'talk' || mind.state === 'attack')) {
        // đứng nghe, đứng xem (drama): toả thành vòng rộng quanh người nói; trò chuyện, cãi, đánh: đứng sát
        const K = f.knobs, gap = mind.verb === 'listen' ? 2.6 + (f.p.id % 5) * 0.55 : mind.state === 'attack' ? 0.95 - K.lean * 0.2 : 1.3 + (K.lean < 0 ? -K.lean * 0.6 : 0);
        _v.copy(f.pos).sub(tgt.pos); if (_v.lengthSq() < 1e-4) _v.set(1, 0, 0);
        return { p: tgt.pos.clone().addScaledVector(_v.normalize(), gap), face: tgt.pos };
      }
      if (mind.place === 'stroll') { const g = Nav.strollGoal(f); if (g) return g; }
      if (mind.place === 'hallLoop') { const g = Nav.hallGoal(f); if (g) return g; }
      const base = spot(mind.place, f.p);
      if (mind.place === 'podium' && PL && PL.podium) return { p: base.clone(), face: PL.podiumFace }; // người diễn thuyết đứng giữa bục, nhìn ra sân
      const tight = mind.place === 'gate' || mind.place === 'gateL' || mind.place === 'gateR'; // lính gác đứng sát chốt của mình
      return base ? { p: Nav.offCarriage(tight ? base.clone().addScaledVector(f.jit, 0.15) : base.clone().add(f.jit)), face: null } : null;
    }
    function exprOf(mind, X, p) {
      if (mind.mood === 'pray') return 'closed';
      if (mind.state === 'attack' || mind.mood === 'argue') return 'angry';
      if (mind.state === 'panic') return 'fear';
      if (X.mourning || (X.drought && (mind.stress || 0) > 0.4)) return 'sad';
      if (mind.state === 'talk' || X.festival) return 'happy';
      if (X.war && p.job === 'soldier') return 'angry';
      return 'neutral';
    }

    /* ---------- Mỗi khung hình ---------- */
    const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _s = new THREE.Vector3(), _p = new THREE.Vector3(), _f = new THREE.Matrix4();
    let selected = null;
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.55, 0.72, 32), new THREE.MeshBasicMaterial({ color: '#ffd27a', transparent: true, opacity: 0.9, depthWrite: false, side: THREE.DoubleSide }));
    ring.rotation.x = -Math.PI / 2; ring.visible = false; scene.add(ring);
    const need = {};
    function update(dt, t) {
      dt = Math.max(0, dt || 0); const sec = Math.min(0.1, dt / 1000), ts = t * 0.001, alive = new Set(), X = BK.Island.situNow(S);
      for (const p of S.people.values()) {
        if (!p.alive) continue;
        alive.add(p.id);
        const age = P.ageOf(p, S.day), f = ensure(p, age), mind = S.minds.get(p.id) || { state: 'idle' };
        f.knobs = Object.assign(Brain.knobs(p.genome, mind.stress || 0), { seed: p.id * 1.7 });
        let goal = goalOf(f, mind), meetVerb = null;
        // gặp người quen trên phố: hai người đang đi dạo gặp nhau thì dừng lại trò chuyện vài giây rồi đi tiếp
        if (f.meet) { const o2 = folks.get(f.meet.id); if (ts < f.meet.until && o2 && o2.meet && o2.meet.id === p.id) { goal = { p: f.pos.clone(), face: o2.pos }; meetVerb = 'chat'; } else { f.meet = null; f.meetCool = ts + 18 + (p.id % 7) * 3; } }
        else if ((mind.place === 'stroll' || mind.place === 'hallLoop') && goal && goal.road && !(ts < (f.meetCool || 0))) {
          for (const [oid, o2] of folks) {
            if (oid === p.id || o2.meet || !o2.strolling || ts < (o2.meetCool || 0)) continue;
            if ((o2.pos.x - f.pos.x) ** 2 + (o2.pos.z - f.pos.z) ** 2 < 2.6) { const until = ts + 3.5 + Math.random() * 4; f.meet = { id: oid, until }; o2.meet = { id: p.id, until }; goal = { p: f.pos.clone(), face: o2.pos }; meetVerb = 'chat'; break; }
          }
        }
        f.strolling = (mind.place === 'stroll' || mind.place === 'hallLoop') && !meetVerb;
        if (goal && !meetVerb && !goal.road) goal = Nav.follow(f, goal); // đi theo lối đi, không xuyên tường, xuyên nhà (render/nav3d.js)
        let moving = false;
        if (goal) {
          _v.copy(goal.p).sub(f.pos); _v.y = 0;
          const d = _v.length(), run = mind.state === 'panic' || (mind.state === 'attack' && d > 2) || d > 14;
          const speed = (run ? 3.4 : mind.verb === 'sleep' ? 2 : 1.25) * f.knobs.tempo * (0.8 + 0.4 * f.knobs.stride); // tối muộn về ngủ thì rảo bước
          if (d > 0.25) { moving = true; const step = Math.min(d, speed * sec); f.pos.addScaledVector(_v.normalize(), step); Nav.keepInside(f.pos); f.ph += step / ((0.55 + 0.3 * f.knobs.stride) * SCALE) * Math.PI; turnTo(f, Math.atan2(_v.x, _v.z), sec); }
          else if (goal.face) { _v.copy(goal.face).sub(f.pos); turnTo(f, Math.atan2(_v.x, _v.z), sec); }
        }
        if (!moving) f.ph += sec * 3 * f.knobs.tempo;
        // tới nơi thì làm việc bằng cử chỉ trong thư viện (render/work3d.js); đang đi, hay đang có sự kiện thì cử động theo trạng thái
        const verb = meetVerb || mind.verb, working = !moving && verb && verb !== 'sleep' && (meetVerb || mind.state === 'work' || (mind.state === 'talk' && !mind.mood));
        f.inside = !moving && verb === 'sleep'; // ngủ: vào trong nhà (không vẽ)
        let tgt, gface = null;
        if (working && Work) {
          if (f.verb !== verb || ts > f.gEnd) { // đổi việc, hay hết một lượt cử chỉ: sang cử chỉ khác của việc đó
            f.turn = f.verb === verb ? (f.turn || 0) + 1 : 0; f.verb = verb;
            f.work = Work.gestureOf(verb, level, p.id, f.turn); f.gStart = ts;
            f.gEnd = ts + (f.work && !f.work.G.loop ? f.work.G.dur + 0.8 : 6 + (p.id % 4));
          }
          if (f.work) { const G = f.work.G, u = G.loop ? 0 : Math.min(1, (ts - f.gStart) / G.dur); tgt = Anim.basePose(f.knobs); G.pose(tgt, f.ph, u, ts, f.knobs); Anim.addLife(tgt, ts, f.knobs); gface = G.face; f.tool = f.work.tool; }
        }
        if (!tgt) { f.verb = null; f.tool = null; tgt = Anim.target(mind.state, f.ph, ts, f.knobs, { habit: p.genome.habit, mood: mind.mood, moving }); }
        Anim.apply(f.rig, f.cur, tgt, dt);
        const sc = age >= 16 ? 1 : 0.5 + 0.5 * Math.max(0, age) / 16;
        f.rig.root.position.copy(L.center).add(f.pos); f.rig.root.position.y += (f.cur.ty || 0) * sc * SCALE; // ngồi, quỳ thì hạ người
        f.rig.root.rotation.set(f.cur.rx || 0, f.yaw, 0, 'YXZ'); f.rig.root.scale.setScalar(sc * SCALE);
        f.rig.root.updateMatrixWorld(true);
        // chớp mắt vài giây một lần
        if (ts > f.blinkAt) { f.blink = 0.14; f.blinkAt = ts + 2.2 + Math.random() * 3; }
        f.blink = Math.max(0, f.blink - sec);
        const ek = meetVerb ? 'happy' : gface && EXPR[gface] && !X.war && !X.mourning && !mind.mood ? gface : exprOf(mind, X, p); // bạo loạn, cãi nhau: giận (mood) dù đang làm cử chỉ
        f.expr = EXPR[ek] || EXPR.neutral; f.closed = f.expr === EXPR.closed || f.blink > 0;
      }
      for (const [id] of folks) if (!alive.has(id)) { folks.delete(id); if (selected === id) selected = null; }
      // đếm chỗ cần cho từng loại bộ phận, rồi đổ vào các khối lặp
      for (const k in need) need[k] = 0;
      for (const [, f] of folks) if (!f.inside) for (const part of f.rig.parts) need[part.type] = (need[part.type] || 0) + 1;
      for (const type in need) { const m = im(type, need[type]); m.count = 0; m.userData.owner.length = 0; }
      for (const [id, f] of folks) {
        if (f.inside) continue;
        const E = f.expr || EXPR.neutral;
        for (const part of f.rig.parts) {
          let local = part.local;
          if (part.face) {
            const F = part.face, D = part.dec;
            if (F.startsWith('tool:')) { if (F.slice(5) !== f.tool) continue; }
            else if (F.startsWith('mouth:') && F.slice(6) !== E.mouth) continue;
            if (F === 'cheek' && !E.cheek) continue;
            if (F === 'shine' && f.closed) continue;
            if (F === 'eye') { _s.copy(D.s); _s.y *= f.closed ? 0.12 : E.eye; local = _f.compose(D.p, D.q, _s); }
            else if (F === 'browL' || F === 'browR') { const sx = F === 'browL' ? 1 : -1; _p.copy(D.p); _p.y += E.by + (f.closed ? -0.01 : 0); _q.setFromEuler(_e.set(0, 0, sx * E.tilt * 0.5)); local = _f.compose(_p, _q, D.s); }
          }
          const m = IM[part.type], i = m.count; if (i >= m.instanceMatrix.count) continue;
          _m.multiplyMatrices(part.node.matrixWorld, local); m.setMatrixAt(i, _m); m.setColorAt(i, part.color); m.userData.owner[i] = id; m.count++;
        }
      }
      for (const type in IM) { const m = IM[type]; if (!need[type]) m.count = 0; m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; }
      const sf = selected != null && folks.get(selected);
      ring.visible = !!sf; if (sf) ring.position.copy(sf.rig.root.position).setY(sf.rig.root.position.y + 0.06);
    }
    function turnTo(f, yaw, sec) { let d = yaw - f.yaw; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; f.yaw += d * Math.min(1, sec * 8); }
    // đổi thời: mọi người thay trang phục ngay ở nhịp vẽ sau
    const setLevel = (l) => { level = l; };

    /* ---------- Bấm chọn một người ---------- */
    function pick(raycaster) {
      let best = null, bd = 1e9;
      for (const type of ['head', 'shirt', 'shorts', 'hairCap', 'skirt']) {
        const m = IM[type]; if (!m || !m.count) continue;
        for (const h of raycaster.intersectObject(m)) if (h.distance < bd && h.instanceId != null) { bd = h.distance; best = m.userData.owner[h.instanceId]; }
      }
      return best;
    }
    const select = (id) => { selected = id; };
    const worldPos = (id) => { const f = folks.get(id); return f ? f.rig.root.position.clone() : null; };
    const drawCalls = () => Object.values(IM).filter((m) => m.count).length;
    // vị trí những người đang ở ngoài (toạ độ đảo) để xe nhường người đi bộ (render/buildings3d.js setPeds)
    const pedList = [];
    function peds() { pedList.length = 0; for (const [, f] of folks) if (!f.inside) pedList.push(f.pos); return pedList; }
    return { update, pick, select, worldPos, peds, setPlaces, setLevel, drawCalls, get selected() { return selected; }, get count() { return folks.size; }, get indoors() { let n = 0; for (const [, f] of folks) if (f.inside) n++; return n; } };
  }

  return { create, EXPR };
});
