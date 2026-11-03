/* Bể Kính — bầu trời chiến tranh và những cỗ máy bay.
 * Hai phe đánh nhau thì thành bị trút đạn: thời đại bác thì đạn tròn bay vòng qua biển, thời máy bay thì đội máy bay
 * ném bom bay ngang trời, thời tên lửa thì tên lửa kéo vệt khói vòng lên rồi lao xuống, bốn thời cuối là tia năng lượng
 * từ trời giáng thẳng. Công trình trúng đạn sập trong bụi gạch. Một hai đảo bị đẩy lùi thì cả thành chìm trong lửa khói.
 * Ngày thường bầu trời có khinh khí cầu, phi thuyền, máy bay cánh quạt, phản lực, máy bay không người lái, tàu bay ánh
 * sáng, theo thời đại cao nhất trong bể. */
(function (root) {
  'use strict';
  const TAU = Math.PI * 2;

  function create(K) {
    const { THREE, scene, W, lands3d, war3d, chaos3d, puff, reduce, glowTex } = K;
    const P = chaos3d.prims, lands = lands3d.lands, rnd = Math.random, v3 = (x, y, z) => new THREE.Vector3(x, y, z);
    const sfx = (name, a) => { if (K.audio && K.audio.on && K.audio[name]) K.audio[name](a); };
    const shake = (ms) => { if (K.shake) K.shake(ms); };
    const active = [];
    const now = () => performance.now();
    const run = (dur, update, end) => active.push({ t0: now(), dur, update, end: end || (() => {}) });
    const later = (ms, fn) => run(ms, () => {}, fn);
    const col = (owner) => (K.factionColor ? K.factionColor(owner) : '#d0d0d0');
    const mat = (c, em) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.55, metalness: 0.25, flatShading: true, emissive: em || '#000000', emissiveIntensity: em ? 0.8 : 0 });
    const kill = (o) => { if (!o) return; if (o.parent) o.parent.remove(o); o.traverse((x) => { if (x.geometry) x.geometry.dispose(); if (x.material) x.material.dispose(); }); };
    function glow(c, size, op) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: c, transparent: true, opacity: op == null ? 0.9 : op, depthWrite: false, blending: THREE.AdditiveBlending })); s.scale.setScalar(size); return s; }

    /* =============== Những cỗ máy bay =============== */
    // mũi máy bay chĩa về +Z
    function bomber(c) {
      const g = new THREE.Group();
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.38, 6.2, 10), mat(c)); body.rotation.x = Math.PI / 2; g.add(body);
      const nose = new THREE.Mesh(new THREE.SphereGeometry(0.56, 10, 8), mat('#cfd6dc')); nose.position.z = 3.1; g.add(nose);
      const wing = new THREE.Mesh(new THREE.BoxGeometry(9, 0.14, 1.3), mat(c)); wing.position.z = 0.4; g.add(wing);
      const tail = new THREE.Mesh(new THREE.BoxGeometry(3, 0.12, 0.8), mat(c)); tail.position.z = -2.8; g.add(tail);
      const fin = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.2, 0.9), mat(c)); fin.position.set(0, 0.6, -2.8); g.add(fin);
      for (const sx of [-2.4, 2.4]) { const eng = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 1.2, 8), mat('#3a3f46')); eng.rotation.x = Math.PI / 2; eng.position.set(sx, -0.1, 1.0); g.add(eng); const pr = new THREE.Mesh(new THREE.CircleGeometry(0.75, 12), new THREE.MeshBasicMaterial({ color: '#dfe5ea', transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false })); pr.position.set(sx, -0.1, 1.65); g.add(pr); }
      return g;
    }
    function jet(c) {
      const g = new THREE.Group();
      const body = new THREE.Mesh(new THREE.ConeGeometry(0.5, 6, 8), mat(c)); body.rotation.x = Math.PI / 2; g.add(body);
      const wg = new THREE.BufferGeometry().setFromPoints([v3(0, 0, 1.2), v3(-3.2, 0, -1.6), v3(3.2, 0, -1.6)]); wg.computeVertexNormals();
      const wing = new THREE.Mesh(wg, new THREE.MeshStandardMaterial({ color: c, side: THREE.DoubleSide, flatShading: true })); g.add(wing);
      const fin = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.1, 1), mat(c)); fin.position.set(0, 0.55, -2.2); g.add(fin);
      const ex = glow('#ffb35a', 1.8, 0.8); ex.position.z = -3.2; g.add(ex);
      return g;
    }
    function balloon(c) {
      const g = new THREE.Group();
      const env = new THREE.Mesh(new THREE.SphereGeometry(2.6, 14, 10), mat(c)); env.scale.y = 1.25; env.position.y = 3.2; g.add(env);
      for (let i = 0; i < 6; i++) { const s = new THREE.Mesh(new THREE.BoxGeometry(0.06, 3.0, 0.06), mat('#f4ead2')); const a = (i / 6) * TAU; s.position.set(Math.cos(a) * 1.4, 1.0, Math.sin(a) * 1.4); g.add(s); }
      const bk = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.55, 0.7, 8), mat('#8a6a46')); g.add(bk);
      const fl = glow('#ffb35a', 1.4, 0.7); fl.position.y = 0.9; g.add(fl);
      return g;
    }
    function airship(c) {
      const g = new THREE.Group();
      const env = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 10), mat(c)); env.scale.set(1.6, 1.6, 6); g.add(env);
      const gon = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.6, 2.4), mat('#5a4636')); gon.position.y = -1.9; g.add(gon);
      for (const sx of [-1, 1]) { const f = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.6, 1.2), mat(c)); f.position.set(sx * 0.9, 0, -5.2); f.rotation.z = sx * 0.8; g.add(f); }
      return g;
    }
    function drone(c) {
      const g = new THREE.Group();
      const b = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.3, 0.9), mat('#2b2f36')); g.add(b);
      for (const [x, z] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.05, 4, 14), mat(c)); r.rotation.x = Math.PI / 2; r.position.set(x * 0.75, 0.12, z * 0.75); g.add(r); }
      const l = glow(c, 0.9, 0.9); l.position.y = -0.2; g.add(l);
      return g;
    }
    function hover(c, neon) {
      const g = new THREE.Group();
      const d = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 1.2, 0.8, 18), mat(neon ? '#1b1f33' : '#e8eef4')); g.add(d);
      const dome = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8, 0, TAU, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#bfefff', transparent: true, opacity: 0.6 })); dome.position.y = 0.35; g.add(dome);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(2.6, 0.12, 6, 32), new THREE.MeshBasicMaterial({ color: neon ? c : '#7ff0ff' })); ring.rotation.x = Math.PI / 2; g.add(ring);
      const under = glow(neon ? c : '#7ff0ff', 4.5, 0.75); under.position.y = -0.6; g.add(under);
      return g;
    }
    function missile(c) {
      const g = new THREE.Group();
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 2.6, 8), mat('#e8ecef')); body.rotation.x = Math.PI / 2; g.add(body);
      const nose = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.7, 8), mat(c)); nose.rotation.x = Math.PI / 2; nose.position.z = 1.6; g.add(nose);
      for (let i = 0; i < 4; i++) { const f = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.5, 0.5), mat(c)); f.rotation.z = (i * Math.PI) / 2; f.position.z = -1.1; f.translateY(0.25); g.add(f); }
      const ex = glow('#ffcf7a', 2.4, 0.95); ex.position.z = -1.6; g.add(ex);
      return g;
    }

    /* =============== Thành trúng đạn =============== */
    const cityPt = (L, r) => (P.cityPt ? P.cityPt(L, r || 22) : L.center.clone());
    // chỗ công trình vừa sập: tường thành, tháp canh, trại lính, lò rèn, chợ, học viện
    function fellPos(L, key) {
      if (!key) return null;
      if (key === 'wall') return L.world(L.gates[0]).setY(0);
      if (key === 'tower') return L.world(L.towerPos[0]).setY(0);
      const p = L.milLot && L.milLot[key]; return p ? L.world(p).setY(0) : null;
    }
    function collapse(p) {
      // công trình sập: bụi gạch cuộn lên, gạch đá văng, một đống đổ nát nằm lại
      shake(900); sfx('rumble', 3);
      for (let k = 0; k < (reduce ? 4 : 18); k++) later(k * 70, () => puff(p.clone().add(v3((rnd() - 0.5) * 6, 0.6 + rnd() * 3, (rnd() - 0.5) * 6)), true, k % 3 ? '#a89a86' : '#6d6359'));
      P.ring(p.clone().setY(0.4), '#c9b8a0', 10, 1800);
      const pile = new THREE.Group();
      for (let i = 0; i < 16; i++) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.5 + rnd() * 1.1, 0.3 + rnd() * 0.6, 0.5 + rnd() * 0.9), mat(['#8a8073', '#6d6359', '#a39684', '#5a4f45'][i % 4])); b.position.set((rnd() - 0.5) * 4.5, rnd() * 0.8, (rnd() - 0.5) * 4.5); b.rotation.set(rnd(), rnd() * TAU, rnd()); pile.add(b); }
      pile.position.copy(p); scene.add(pile);
      const bits = [];
      for (let i = 0; i < 12; i++) { const m = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.3, 0.35), mat('#7a7064')); m.position.copy(p).setY(3); scene.add(m); bits.push({ m, v: v3((rnd() - 0.5) * 10, 6 + rnd() * 8, (rnd() - 0.5) * 10) }); }
      run(1800, () => { for (const b of bits) { b.v.y -= 0.55; b.m.position.addScaledVector(b.v, 0.016); b.m.rotation.x += 0.2; if (b.m.position.y < 0.15) { b.m.position.y = 0.15; b.v.multiplyScalar(0.3); } } }, () => bits.forEach((b) => kill(b.m)));
      run(45000, (u) => { if (u > 0.85) pile.position.y = p.y - (u - 0.85) / 0.15 * 1.2; }, () => kill(pile));
    }
    function boom(p, size) {
      const sz = (size || 3) * 1.5;
      if (P.explosion) P.explosion(p.clone().setY(0.4), sz); else P.flash(p.clone().setY(1.5), sz * 2, '#ff8a3d');
      if (P.crater) P.crater(p.clone(), sz * 0.7, 30000);
      const fb = glow('#ff7a2a', sz * 3.2, 0.95); fb.material.blending = THREE.NormalBlending; fb.position.copy(p).setY(2.5); scene.add(fb); // quả cầu lửa thấy được cả giữa trưa
      run(1300, (u) => { fb.scale.setScalar(sz * (2.4 + u * 3)); fb.material.opacity = 0.95 * (1 - u); fb.position.y = 2.5 + u * 4; }, () => kill(fb));
      for (let k = 0; k < (reduce ? 2 : 6); k++) later(150 + k * 120, () => puff(p.clone().add(v3((rnd() - 0.5) * 3, 2 + k * 0.8, (rnd() - 0.5) * 3)), true, '#3a3a3a'));
    }
    // một đường bay vòng: từ a lên đỉnh cao h rồi xuống b
    const arcAt = (a, b, h, u, out) => out.copy(a).lerp(b, u).setY(a.y + (b.y - a.y) * u + Math.sin(u * Math.PI) * h);

    function strike(fx) {
      const A = lands[fx.from], B = lands[fx.city]; if (!A || !B) return;
      const c = col(fx.by), n = Math.max(2, Math.min(6, fx.n || 3)), targets = [];
      for (let i = 0; i < n; i++) targets.push(cityPt(B, 24));
      const fall = fellPos(B, fx.fell); if (fall) targets[0] = fall.clone();
      const hitAt = (p, k, big) => { boom(p, big ? 4 : 2.6); if (k === 0 && fall) later(250, () => collapse(fall)); };
      if (fx.kind === 'cannon') {
        // đại bác ở cổng thành bên kia bắn đạn tròn bay vòng qua biển
        const g = A.world(A.gates[Math.max(0, A.neighbors.indexOf(B.i))]).setY(2.2);
        targets.forEach((p, k) => later(k * 380, () => { sfx('boom', 1); P.flash(g.clone().setY(3), 5, '#ffcf7a'); puff(g.clone().setY(3), true, '#8a8a8a'); if (war3d.shotRaw) war3d.shotRaw(g.clone(), p.clone().setY(0.5), '#2b2b2b', 0.6, 22, 1500, 'boom'); later(1500, () => hitAt(p, k)); }));
      } else if (fx.kind === 'bomber') {
        // ba máy bay ném bom bay thành hàng từ đảo bên kia, thả bom khi ngang qua thành
        const dir = B.center.clone().sub(A.center).setY(0).normalize(), side = v3(-dir.z, 0, dir.x), y = 34;
        const from = A.center.clone().addScaledVector(dir, -20).setY(y), to = B.center.clone().addScaledVector(dir, 70).setY(y);
        sfx('gust', 3);
        [-1, 0, 1].forEach((s2, j) => {
          const pl = bomber(c); pl.scale.setScalar(1.9); scene.add(pl); const off = side.clone().multiplyScalar(s2 * 11).add(v3(0, Math.abs(s2) * 2, -Math.abs(s2) * 6));
          const dropped = new Set();
          run(7600, (u) => {
            pl.position.copy(from).lerp(to, u).add(off); pl.lookAt(pl.position.clone().add(dir)); pl.rotation.z += Math.sin(u * 20 + j) * 0.02;
            targets.forEach((p, k) => {
              if (k % 3 !== j || dropped.has(k)) return;
              const along = p.clone().sub(from).dot(dir) / to.clone().sub(from).dot(dir);
              if (u >= along - 0.06) { dropped.add(k); const b0 = pl.position.clone(), bomb = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 6), mat('#2b2b2b')); bomb.scale.z = 1.8; scene.add(bomb); run(1200, (q) => { bomb.position.copy(b0).lerp(p, q).setY(b0.y * (1 - q * q) + 0.4); }, () => { kill(bomb); hitAt(p, k, true); }); }
            });
          }, () => kill(pl));
        });
      } else if (fx.kind === 'missile') {
        // tên lửa rời hầm phóng, vòng lên cao kéo vệt khói, rồi lao xuống thành
        const silo = A.world(A.siloPos || v3(0, 0, 0)).setY(1.5);
        targets.forEach((p, k) => later(k * 420, () => {
          const m = missile(c); m.scale.setScalar(2.6); scene.add(m); sfx('launch', 1);
          const pos = v3(0, 0, 0), nxt = v3(0, 0, 0), h = 42 + rnd() * 18, to = p.clone().setY(0.4);
          let tr = 0;
          run(3200, (u, ms) => {
            const e = u < 0.5 ? u * u * 2 : 1 - Math.pow(-2 * u + 2, 2) / 2;
            arcAt(silo, to, h, e, pos); arcAt(silo, to, h, Math.min(1, e + 0.01), nxt);
            m.position.copy(pos); m.lookAt(nxt);
            if (!reduce && ms > tr) { tr = ms + 45; puff(pos.clone(), false, '#e8ecef'); puff(pos.clone().add(v3((rnd() - 0.5) * 0.8, 0, (rnd() - 0.5) * 0.8)), false, '#cfd6dc'); }
          }, () => { kill(m); hitAt(p, k, true); });
        }));
      } else {
        // tia năng lượng giáng thẳng từ trời
        targets.forEach((p, k) => later(k * 300, () => {
          const top = p.clone().setY(150), beam = new THREE.Mesh(new THREE.CylinderGeometry(2.0, 3.0, 150, 14, 1, true), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }));
          beam.position.copy(top).setY(75); scene.add(beam);
          const core = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 1.0, 150, 8, 1, true), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })); core.position.copy(beam.position); scene.add(core);
          sfx('zap', 1);
          run(1300, (u) => { const a = Math.sin(u * Math.PI); beam.material.opacity = 0.7 * a; core.material.opacity = 0.95 * a; beam.scale.x = beam.scale.z = 1 + u * 0.6; }, () => { kill(beam); kill(core); });
          later(300, () => hitAt(p, k, true));
        }));
      }
    }

    /* =============== Một đảo bị đẩy lùi: cả thành chìm trong lửa khói =============== */
    function setback(fx) {
      const L = lands[fx.city]; if (!L) return;
      shake(1600); sfx('rumble', 4);
      if (P.haze) P.haze(L, '#2a1d1a', 0.4, 16000);
      const fires = [];
      for (let i = 0; i < (reduce ? 8 : 28); i++) {
        const p = cityPt(L, 36), sz = 4 + rnd() * 4, s = glow('#ff6a1a', sz, 0.95), core = glow('#ffd36b', sz * 0.55, 0.95);
        s.material.blending = THREE.NormalBlending; s.position.copy(p).setY(sz * 0.32); core.position.copy(p).setY(sz * 0.25); scene.add(s, core); fires.push({ s, core, p, ph: rnd() * 6, sz });
      }
      // nền đất cháy đen loang khắp thành
      const scorch = new THREE.Mesh(new THREE.CircleGeometry(lands3d.LAND_R * 0.92, 40), new THREE.MeshBasicMaterial({ color: '#1a1410', transparent: true, opacity: 0, depthWrite: false }));
      scorch.rotation.x = -Math.PI / 2; scorch.position.copy(L.center).setY(0.3); scorch.renderOrder = 4; scene.add(scorch);
      run(20000, (u, ms) => {
        const fade = u > 0.75 ? (1 - u) / 0.25 : 1;
        scorch.material.opacity = 0.38 * Math.min(1, u * 6) * (u > 0.85 ? (1 - u) / 0.15 : 1);
        for (const f of fires) { const fl = 0.75 + 0.25 * Math.sin(ms * 0.017 + f.ph); f.s.material.opacity = 0.85 * fl * fade; f.core.material.opacity = 0.9 * fl * fade; f.s.scale.setScalar(f.sz * (0.9 + 0.2 * fl)); if (!reduce && rnd() < 0.06) puff(f.p.clone().setY(f.sz * 0.6), true, rnd() < 0.5 ? '#2b2b2b' : '#4a4a4a'); }
      }, () => { fires.forEach((f) => { kill(f.s); kill(f.core); }); kill(scorch); });
      if (fx.why === 'missiles') { const from = lands[(fx.city + 3) % 6]; if (from) strike({ from: from.i, city: fx.city, by: W.cities[from.i].owner, kind: 'missile', n: 6 }); }
      if (fx.why === 'civil' && P.torches) P.torches(L);
    }

    /* =============== Bầu trời ngày thường: máy bay theo thời đại =============== */
    const craft = [];
    let craftEra = -1;
    function syncDay() {
      let e = -1; for (const c of W.cities) if (c.settled) e = Math.max(e, c.era);
      if (e === craftEra) return;
      craftEra = e;
      for (const q of craft) kill(q.g);
      craft.length = 0;
      if (e < 3) return;
      const n = e >= 7 ? 8 : e >= 5 ? 6 : 4, cs = ['#e05a6a', '#3f7fd6', '#e0b23a', '#3f9a5a', '#c58bff', '#ff8a3d'];
      for (let i = 0; i < n; i++) {
        const c = cs[i % cs.length], kind = e >= 8 ? 'hover' : e === 7 ? 'drone' : e === 6 ? 'jet' : e === 5 ? 'bomber' : i % 2 ? 'airship' : 'balloon';
        const g = kind === 'hover' ? hover(e === 11 ? ['#2ef2ff', '#ff3ec8', '#ffe14a'][i % 3] : c, e === 11) : kind === 'drone' ? drone(c) : kind === 'jet' ? jet(c) : kind === 'bomber' ? bomber(c) : kind === 'airship' ? airship(c) : balloon(c);
        g.scale.setScalar(kind === 'drone' ? 3 : kind === 'jet' ? 2.4 : kind === 'bomber' ? 1.8 : kind === 'hover' ? 1.6 : 1.5);
        g.traverse((o) => { o.raycast = () => {}; });
        scene.add(g);
        craft.push({ g, kind, r: 60 + (i % 4) * 32 + rnd() * 10, y: kind === 'balloon' || kind === 'airship' ? 55 + rnd() * 30 : 70 + rnd() * 45, a: rnd() * TAU, w: (kind === 'jet' ? 0.00016 : kind === 'balloon' ? 0.000025 : 0.00006) * (i % 2 ? 1 : -1) * (0.8 + rnd() * 0.4), ph: rnd() * 6 });
      }
    }

    function play(fx) { try { if (fx.key === 'strike') strike(fx); else if (fx.key === 'setback') setback(fx); } catch (err) { console.error('sky3d', fx.key, err); } }
    const _a = v3(0, 0, 0);
    function update(dt, t) {
      const n = now();
      for (let i = active.length - 1; i >= 0; i--) {
        const e = active[i], ms = n - e.t0, u = Math.min(1, ms / e.dur);
        try { e.update(u, ms); } catch (err) { e.dur = 0; }
        if (u >= 1) { active.splice(i, 1); try { e.end(); } catch (err) { /* bỏ qua */ } }
      }
      for (const q of craft) {
        if (!reduce) q.a += q.w * dt;
        const x = Math.cos(q.a) * q.r, z = Math.sin(q.a) * q.r, y = q.y + Math.sin(t * 0.0006 + q.ph) * 2;
        q.g.position.set(x, y, z);
        _a.set(Math.cos(q.a + Math.sign(q.w) * 0.05) * q.r, y, Math.sin(q.a + Math.sign(q.w) * 0.05) * q.r);
        if (q.kind !== 'balloon') { q.g.lookAt(_a); if (q.kind === 'jet' || q.kind === 'bomber') q.g.rotateZ(-Math.sign(q.w) * 0.25); }
        if (q.kind === 'drone' || q.kind === 'hover') q.g.rotation.y += dt * 0.001;
      }
    }
    return { play, update, syncDay, get active() { return active.length; } };
  }
  root.Sky3D = { create };
})(typeof self !== 'undefined' ? self : this);
