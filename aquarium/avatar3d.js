/* Bể Kính — hoá thân: vị thần hoá thành một con chim hay một con mèo để tự đi xem bể kính bằng phím mũi tên.
 * Chim bay tự do trong vòm kính (lên cao, sà xuống sát mái nhà); mèo đi trên mặt đảo, nhảy lên bậc thấp, đi qua cầu,
 * gặp tường cao hay mép nước thì dừng. Camera bám sau lưng con vật. Esc (hoặc nút Trở lại) để làm thần như cũ. */
(function (root) {
  'use strict';
  function create(K) {
    const { THREE, scene, camera, controls, lands3d, W, DOME, reduce, onChange } = K;
    const TAU = Math.PI * 2, v3 = (x, y, z) => new THREE.Vector3(x, y, z), clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const lands = lands3d.lands, bridges = lands3d.bridges;
    const lam = (c, o) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.6, metalness: 0.02 }, o || {}));
    // con vật nhỏ hơn người trong bể (người cao khoảng 1,3): chim dài chừng nửa đơn vị, mèo cao chừng một phần tư người;
    // đi, bay chậm theo cỡ con vật, camera thấp và gần, góc nhìn rộng, nên nhà cửa, cây cầu, đảo hiện ra to và xa
    const SPEC = {
      bird: { scale: 0.32, cruise: 3.2, fast: 7.5, slow: 1.1, turn: 1.7, climb: 3.4, floor: 0.45, ceil: 70, camBack: 2.3, camUp: 0.7, ahead: 2.6, eye: 0.15 },
      cat: { scale: 0.34, walk: 1.9, run: 3.9, back: 0.9, turn: 2.7, jump: 5.2, step: 0.3, climb: 0.6, probe: 0.16, camBack: 1.45, camUp: 0.68, ahead: 1.6, lookUp: 0.36, eye: 0.3 },
    };
    const ball = (r, c, x, y, z, sx, sy, sz, parent) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 18, 12), lam(c)); m.position.set(x, y, z); m.scale.set(sx || 1, sy || 1, sz || 1); m.castShadow = true; (parent || null) && parent.add(m); return m; };

    /* ----- Chim xanh tròn ----- */
    function makeBird() {
      const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
      ball(0.5, '#3f7fd6', 0, 0, 0, 1, 0.86, 1.25, body);
      ball(0.42, '#f4f1e8', 0, -0.12, 0.16, 0.9, 0.7, 1.0, body);
      const head = new THREE.Group(); head.position.set(0, 0.36, 0.48); body.add(head);
      ball(0.34, '#3f7fd6', 0, 0, 0, 1, 1, 1, head);
      const beak = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.3, 8), lam('#ffb347')); beak.rotation.x = Math.PI / 2; beak.position.set(0, -0.04, 0.38); head.add(beak);
      for (const sx of [-1, 1]) { ball(0.085, '#ffffff', sx * 0.17, 0.08, 0.26, 1, 1, 1, head); ball(0.05, '#1a1a1a', sx * 0.19, 0.09, 0.32, 1, 1, 1, head); }
      const wings = [];
      for (const sx of [-1, 1]) {
        const pv = new THREE.Group(); pv.position.set(sx * 0.42, 0.12, 0); body.add(pv);
        const w = ball(0.5, '#2f66b3', sx * 0.42, 0, -0.05, 1, 0.16, 0.62, pv); void w;
        wings.push({ pv, sx });
      }
      const tail = new THREE.Mesh(new THREE.ConeGeometry(0.26, 0.6, 6), lam('#2f66b3')); tail.rotation.x = -Math.PI / 2 - 0.25; tail.scale.set(1, 1, 0.3); tail.position.set(0, 0.08, -0.72); body.add(tail);
      for (const sx of [-1, 1]) { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.3, 5), lam('#ffb347')); l.position.set(sx * 0.15, -0.5, 0.05); body.add(l); }
      g.scale.setScalar(SPEC.bird.scale);
      return { g, body, head, wings, tail };
    }
    /* ----- Mèo cam tròn ----- */
    function makeCat() {
      const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
      ball(0.36, '#f2a541', 0, 0.42, 0, 0.9, 0.78, 1.35, body);
      ball(0.3, '#fff3dc', 0, 0.34, 0.12, 0.7, 0.6, 1.0, body);
      for (const z of [-0.18, 0.02, 0.22]) { const st = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.06, 0.05), lam('#d9822b')); st.position.set(0, 0.68, z); body.add(st); }
      const head = new THREE.Group(); head.position.set(0, 0.74, 0.46); body.add(head);
      ball(0.3, '#f2a541', 0, 0, 0, 1.08, 0.94, 1, head);
      ball(0.14, '#fff3dc', 0, -0.08, 0.22, 1.2, 0.8, 0.8, head);
      for (const sx of [-1, 1]) {
        const ear = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.24, 4), lam('#f2a541')); ear.position.set(sx * 0.17, 0.27, -0.02); ear.rotation.z = -sx * 0.25; head.add(ear);
        const inner = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.14, 4), lam('#ffb3b3')); inner.position.set(sx * 0.17, 0.25, 0.03); inner.rotation.z = -sx * 0.25; head.add(inner);
        ball(0.07, '#ffffff', sx * 0.12, 0.05, 0.25, 1, 1.15, 0.6, head); ball(0.045, '#1a1a1a', sx * 0.12, 0.05, 0.29, 0.7, 1.2, 0.6, head);
        for (const dy of [-0.02, 0.03]) { const wk = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.28, 3), lam('#ffffff')); wk.rotation.z = Math.PI / 2 + sx * dy * 4; wk.position.set(sx * 0.2, -0.07 + dy, 0.26); head.add(wk); }
      }
      ball(0.04, '#ff8fa3', 0, -0.03, 0.32, 1, 0.8, 0.8, head);
      const legs = [];
      for (const [x, z] of [[-0.17, 0.3], [0.17, 0.3], [-0.17, -0.3], [0.17, -0.3]]) { const pv = new THREE.Group(); pv.position.set(x, 0.36, z); body.add(pv); const l = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.065, 0.34, 8), lam('#f2a541')); l.position.y = -0.17; l.castShadow = true; pv.add(l); ball(0.08, '#fff3dc', 0, -0.34, 0.02, 1, 0.6, 1.2, pv); legs.push(pv); }
      const tail = [];
      let parent = body, px = 0, py = 0.5, pz = -0.44;
      for (let i = 0; i < 6; i++) { const s = new THREE.Group(); s.position.set(px, py, pz); parent.add(s); const m = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.06, 0.2, 6), lam(i === 5 ? '#d9822b' : '#f2a541')); m.position.y = 0.1; m.castShadow = true; s.add(m); tail.push(s); parent = s; px = 0; py = 0.2; pz = 0; }
      tail[0].rotation.x = -2.05; // đuôi chĩa ra sau rồi cong dần lên, không che camera sau lưng
      g.scale.setScalar(SPEC.cat.scale);
      return { g, body, head, legs, tail };
    }

    /* ----- Trạng thái ----- */
    const S = { kind: null, m: null, pos: v3(0, 0, 0), yaw: 0, speed: 0, vy: 0, y: 0, ground: 0, onBridge: false, t: 0, land: -1, camPos: v3(0, 0, 0), started: false };
    const keys = {};
    const ray = new THREE.Raycaster(), DOWN = v3(0, -1, 0), _o = v3(0, 0, 0), _a = v3(0, 0, 0), _b = v3(0, 0, 0);
    ray.far = 80; ray.camera = camera; // tia dò mặt đất cũng chạm vào các đốm sáng (sprite), cần biết camera
    function landAt(p) { let best = -1, bd = 1e9; for (const L of lands) { const d = Math.hypot(p.x - L.center.x, p.z - L.center.z); if (d < bd) { bd = d; best = L.i; } } return bd < lands3d.LAND_R + 6 ? best : -1; }
    // mặt cầu dưới chân (nếu có): độ cao mặt cầu tại chỗ đó
    function bridgeY(p) {
      for (const B of bridges) {
        if (!B.pa || !B.sim || B.sim.level < 0) continue;
        _a.copy(B.pb).sub(B.pa); const len2 = _a.x * _a.x + _a.z * _a.z;
        const u = ((p.x - B.pa.x) * _a.x + (p.z - B.pa.z) * _a.z) / len2;
        if (u < -0.02 || u > 1.02) continue;
        const cx = B.pa.x + _a.x * u, cz = B.pa.z + _a.z * u;
        if (Math.hypot(p.x - cx, p.z - cz) > 1.7) continue;
        lands3d.bridgePoint(B, clamp(u, 0, 1), _b);
        return _b.y - 0.1;
      }
      return null;
    }
    const solid = (h) => h.object.isMesh && !h.object.isInstancedMesh && !(h.object.material && (Array.isArray(h.object.material) ? false : h.object.material.transparent));
    // có vật cản (tường, gốc cây...) ngay trước mặt con mèo không
    const hray = new THREE.Raycaster(); hray.camera = camera;
    function wallAhead(p, dir, dist) {
      const i = landAt(p); if (i < 0) return false;
      hray.set(_o.set(p.x, p.y + SPEC.cat.probe, p.z), dir); hray.far = dist + 0.1;
      return hray.intersectObject(lands[i].g, true).some(solid);
    }
    // độ cao mặt đất (hay mái nhà) ngay dưới một điểm; null nếu dưới đó là biển. lift: dò từ độ cao nào trở xuống
    function groundAt(x, z, fromY, lift) {
      const i = landAt(_o.set(x, 0, z));
      const by = bridgeY(_o);
      if (i < 0) return by;
      const L = lands[i];
      if (!L.inside(x - L.center.x, z - L.center.z, 0.4)) return by;
      ray.set(_o.set(x, (fromY == null ? 0 : fromY) + (lift == null ? 40 : lift), z), DOWN);
      const hits = ray.intersectObject(L.g, true);
      let y = 0;
      for (const h of hits) { if (!solid(h)) continue; y = h.point.y; break; }
      return by != null ? Math.max(by, y) : y;
    }

    /* ----- Bắt đầu, kết thúc ----- */
    function start(kind, cityId) {
      stop(true);
      const c = cityId != null && W.cities[cityId] && W.cities[cityId].settled ? W.cities[cityId] : W.cities.find((x) => x.settled) || W.cities[0];
      const L = lands[c.id];
      S.kind = kind; S.m = kind === 'bird' ? makeBird() : makeCat(); scene.add(S.m.g);
      const a = Math.atan2(L.inw.z, L.inw.x);
      if (kind === 'bird') { S.pos.copy(L.center).add(v3(L.inw.x * 16, 7, L.inw.z * 16)); S.yaw = Math.atan2(-L.inw.x, -L.inw.z); S.speed = SPEC.bird.cruise; }
      else catStart(L, a);
      S.vy = 0; S.t = 0; S.started = false;
      S.camPos.copy(camera.position);
      if (!S.lens) S.lens = { near: camera.near, far: camera.far };
      camera.userData.avatarLens = true; lens();
      controls.enabled = false; controls.autoRotate = false;
      if (onChange) onChange(kind);
    }
    // mèo xuất hiện trên một con đường từ quảng trường ra cổng, quay mặt dọc theo đường, phía trước thoáng
    function catStart(L, a) {
      const tries = [];
      for (const g of L.landing || []) for (const f of [0.45, 0.58, 0.32, 0.7]) tries.push([g.x * f, g.z * f, Math.atan2(g.x, g.z)]);
      tries.push([Math.cos(a) * 7.6, Math.sin(a) * 7.6, Math.atan2(L.inw.x, L.inw.z)]);
      for (const [x, z, yaw] of tries) {
        S.pos.set(L.center.x + x, 0, L.center.z + z); S.y = S.ground = S.pos.y = groundAt(S.pos.x, S.pos.z, 0, SPEC.cat.climb) || 0; S.yaw = yaw; S.speed = 0;
        fwd.set(Math.sin(yaw), 0, Math.cos(yaw));
        if (!wallAhead(S.pos, fwd, 2.5)) return;
      }
    }
    // ống kính khi hoá thân: góc rộng (dọc 62°, màn hình đứng 78°), mặt phẳng gần sát để không cắt mất con vật nhỏ
    function lens() {
      camera.near = 0.08; camera.far = Math.max(camera.far, S.lens ? S.lens.far : 4200); // giữ xa như cũ để bầu trời không bị cắt
      camera.fov = camera.aspect < 1 ? 78 : 62;
      camera.updateProjectionMatrix();
    }
    function stop(silent) {
      if (!S.kind) return;
      scene.remove(S.m.g); S.m.g.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
      const at = S.pos.clone();
      S.kind = null; S.m = null;
      for (const k in keys) keys[k] = false;
      controls.enabled = true;
      if (S.lens) { camera.near = S.lens.near; camera.far = S.lens.far; S.lens = null; }
      camera.userData.avatarLens = false; if (K.onLens) K.onLens();
      // làm thần trở lại: camera lùi lên cao nhìn chỗ con vật vừa đứng
      controls.target.copy(at).setY(Math.max(0, Math.min(at.y, 8)));
      const back = camera.position.clone().sub(controls.target); back.y = Math.max(back.y, 14); back.setLength(Math.max(36, back.length())); camera.position.copy(controls.target).add(back);
      if (!silent && onChange) onChange(null);
    }

    /* ----- Phím ----- */
    const MAP = { ArrowUp: 'fwd', ArrowDown: 'back', ArrowLeft: 'left', ArrowRight: 'right', w: 'fwd', s: 'back', a: 'left', d: 'right', W: 'fwd', S: 'back', A: 'left', D: 'right', ' ': 'up', Shift: 'down', e: 'up', q: 'down', E: 'up', Q: 'down', PageUp: 'up', PageDown: 'down' };
    function onKey(e, down) {
      if (!S.kind) return false;
      const t = e.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return false;
      const k = MAP[e.key];
      if (!k) return false;
      keys[k] = down;
      e.preventDefault();
      return true;
    }
    window.addEventListener('keydown', (e) => onKey(e, true));
    window.addEventListener('keyup', (e) => onKey(e, false));
    window.addEventListener('blur', () => { for (const k in keys) keys[k] = false; });
    // nút bấm trên màn hình cảm ứng
    function press(k, down) { if (S.kind) keys[k] = down; }
    const sprint = () => !!keys.down; // mèo: giữ Shift để chạy

    /* ----- Mỗi khung hình ----- */
    const fwd = v3(0, 0, 0), want = v3(0, 0, 0), look = v3(0, 0, 0), head = v3(0, 0, 0), cdir = v3(0, 0, 0), cray = new THREE.Raycaster();
    cray.camera = camera;
    function update(dt) {
      if (!S.kind) return false;
      const s = Math.min(0.05, dt / 1000);
      S.t += s;
      const turn = (keys.left ? 1 : 0) - (keys.right ? 1 : 0);
      if (S.kind === 'bird') {
        const B = SPEC.bird;
        S.yaw += turn * s * B.turn;
        const target = keys.fwd ? B.fast : keys.back ? B.slow : B.cruise;
        S.speed += (target - S.speed) * Math.min(1, s * 1.4);
        const climb = (keys.up ? 1 : 0) - (keys.down ? 1 : 0);
        S.vy += (climb * B.climb - S.vy) * Math.min(1, s * 3);
        fwd.set(Math.sin(S.yaw), 0, Math.cos(S.yaw));
        S.pos.addScaledVector(fwd, S.speed * s); S.pos.y += S.vy * s;
        // trong vòm kính, không chui xuống đất hay xuống biển
        const r = Math.hypot(S.pos.x, S.pos.z), maxR = DOME - 8;
        if (r > maxR) { S.pos.x *= maxR / r; S.pos.z *= maxR / r; S.yaw += s * 2.2; }
        if ((Math.floor(S.t * 30) & 1) === 0) S.ground = groundAt(S.pos.x, S.pos.z, S.pos.y);
        const floor = (S.ground == null ? -0.2 : S.ground) + B.floor;
        if (S.pos.y < floor) { S.pos.y += (floor - S.pos.y) * Math.min(1, s * 10); S.vy = Math.max(0, S.vy); }
        S.pos.y = Math.min(S.pos.y, B.ceil);
        // vỗ cánh: bay nhanh, bay lên thì vỗ mạnh; hạ xuống thì lượn
        const M = S.m, flap = reduce ? 0 : (S.vy < -1 ? 0.15 : 1) * Math.sin(S.t * (13 + S.speed * 1.5));
        for (const w of M.wings) w.pv.rotation.z = w.sx * (0.25 + flap * 0.75);
        M.body.rotation.z = -turn * 0.45; M.body.rotation.x = clamp(-S.vy * 0.05, -0.5, 0.5);
        M.g.position.copy(S.pos); M.g.rotation.y = S.yaw;
        // camera bám sau lưng, cao hơn một chút
        want.copy(S.pos).addScaledVector(fwd, -B.camBack).add(v3(0, B.camUp, 0));
        // bay càng cao càng nhìn chếch xuống để thấy đảo bên dưới
        const alt = S.pos.y - (S.ground == null ? 0 : S.ground);
        look.copy(S.pos).addScaledVector(fwd, B.ahead).add(v3(0, -0.25 - Math.min(3.2, Math.max(0, alt) * 0.11), 0));
      } else {
        const Ct = SPEC.cat;
        S.yaw += turn * s * Ct.turn;
        const target = keys.fwd ? (sprint() ? Ct.run : Ct.walk) : keys.back ? -Ct.back : 0;
        S.speed += (target - S.speed) * Math.min(1, s * 6);
        fwd.set(Math.sin(S.yaw), 0, Math.cos(S.yaw));
        const step = S.speed * s;
        if (Math.abs(step) > 1e-4) {
          // tường hay gốc cây trước mặt thì đứng lại (nhảy lên thì qua được bậc thấp); mép nước thì không đi tiếp
          _b.copy(fwd).multiplyScalar(Math.sign(step));
          const nx = S.pos.x + fwd.x * step, nz = S.pos.z + fwd.z * step;
          const wall = wallAhead(S.pos, _b, Math.abs(step) + 0.12), gy = groundAt(nx, nz, S.y, Ct.climb);
          // bậc thềm, bờ đường thấp thì bước lên luôn; vật cao hơn thì phải nhảy
          if (gy != null && (wall ? gy - S.y <= Ct.step : gy - S.y < Ct.climb)) { S.pos.x = nx; S.pos.z = nz; S.ground = gy; }
          else S.speed *= 0.3;
        } else if (S.ground == null) S.ground = groundAt(S.pos.x, S.pos.z, S.y, Ct.climb) || 0;
        if (keys.up && S.y <= S.ground + 0.02) S.vy = Ct.jump; // nhảy cao gấp mấy lần thân mình
        S.vy -= 16 * s; S.y += S.vy * s;
        if (S.y < S.ground) { S.y = S.ground; S.vy = 0; }
        S.pos.y = S.y;
        const M = S.m, walk = reduce ? 0 : clamp(Math.abs(S.speed) / Ct.walk, 0, 1.4), ph = S.t * (11 + Math.abs(S.speed) * 3);
        M.legs.forEach((l, i) => { l.rotation.x = Math.sin(ph + (i === 0 || i === 3 ? 0 : Math.PI)) * 0.7 * walk; });
        M.tail.forEach((t, i) => { if (i) t.rotation.x = 0.24 + Math.sin(S.t * 3 + i * 0.6) * 0.1; t.rotation.z = Math.sin(S.t * 2.2 + i * 0.5) * 0.18; });
        M.body.position.y = Math.abs(Math.sin(ph)) * 0.05 * walk;
        M.head.rotation.y = -turn * 0.3;
        M.g.position.copy(S.pos); M.g.rotation.y = S.yaw;
        want.copy(S.pos).addScaledVector(fwd, -Ct.camBack).add(v3(0, Ct.camUp, 0));
        look.copy(S.pos).addScaledVector(fwd, Ct.ahead).add(v3(0, Ct.lookUp, 0));
      }
      // camera không chui vào vách núi hay vào nhà: dò từ đầu con vật về phía camera, vướng thì kéo camera lại gần
      head.set(S.pos.x, S.pos.y + SPEC[S.kind].eye, S.pos.z);
      cdir.copy(want).sub(head); const cd = cdir.length(); cdir.normalize();
      const li = landAt(want) >= 0 ? landAt(want) : landAt(S.pos);
      if (li >= 0 && cd > 0.2) { cray.set(head, cdir); cray.far = cd; const hit = cray.intersectObject(lands[li].g, true).find(solid); if (hit) want.copy(head).addScaledVector(cdir, Math.max(0.35, hit.distance - 0.15)); }
      const wr = Math.hypot(want.x, want.z); if (wr > DOME - 3) { want.x *= (DOME - 3) / wr; want.z *= (DOME - 3) / wr; }
      // camera theo sau, mượt (không giật khi rẽ gắt)
      const k = S.started ? 1 - Math.exp(-s * 6) : 1; S.started = true;
      camera.position.lerp(want, k);
      camera.lookAt(look);
      controls.target.copy(look);
      S.land = landAt(S.pos);
      return true;
    }
    function where() {
      if (!S.kind) return '';
      const c = S.land >= 0 ? W.cities[S.land] : null;
      if (S.kind === 'cat' && bridgeY(S.pos) != null && (!c || !lands[c.id].inside(S.pos.x - lands[c.id].center.x, S.pos.z - lands[c.id].center.z, 0.4))) return 'Trên cầu';
      if (!c) return S.kind === 'bird' ? 'Trên biển trong' : '';
      return (S.kind === 'bird' ? 'Trên trời ' : 'Ở ') + (c.settled ? c.name : c.terrain.land.toLowerCase() + ' hoang sơ');
    }
    // dò thử bước kế tiếp (để kiểm tra): có tường không, mặt đất cao bao nhiêu
    function probe() { if (!S.kind) return null; fwd.set(Math.sin(S.yaw), 0, Math.cos(S.yaw)); const nx = S.pos.x + fwd.x * 0.2, nz = S.pos.z + fwd.z * 0.2; return { wall: wallAhead(S.pos, fwd, 0.55), gy: groundAt(nx, nz, S.y, 1.3), y: S.y, inside: lands[landAt(S.pos)] ? lands[landAt(S.pos)].inside(nx - lands[landAt(S.pos)].center.x, nz - lands[landAt(S.pos)].center.z, 0.4) : null }; }
    return { start, stop, update, press, where, probe, get kind() { return S.kind; }, get pos() { return S.pos; } };
  }
  root.Avatar3D = { create };
})(typeof window !== 'undefined' ? window : globalThis);
