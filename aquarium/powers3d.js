/* Bể Kính — hậu quả nhìn thấy được của phép thần mượn thân.
 * Mưa thật rơi dưới cánh chim và lửa tắt kèm hơi nước, sét giáng xuống đúng toán giặc rồi xác nằm lại, gió quét giặc lùi trên cầu,
 * đàn chim xoáy rồi bổ nhào, lá thư sáng bay về quảng trường, nắng vàng rọi xuống ruộng; mèo cào cửa thì cửa nhà loé sáng và
 * người chạy ra, gặm dây thì cờ giặc rơi khỏi mái, mèo đen thì lính giặc bỏ chạy, chuột chạy tán loạn khỏi kho, mèo rù rì thì
 * tim hồng bay lên, lối bí mật thì dấu chân sáng dẫn ra bến. Đủ năm lần giúp thì tượng con vật đứng trên quảng trường. */
(function (root) {
  'use strict';
  function create(K) {
    const { THREE, scene, Sim, W, lands3d, war3d, chaos3d, puff, reduce, glowTex, shake, audio, factionColor } = K;
    const P = chaos3d.prims, lands = lands3d.lands, KT = lands3d.kit, TAU = Math.PI * 2, rnd = Math.random;
    const v3 = (x, y, z) => new THREE.Vector3(x, y, z);

    /* ----- Dò quanh một chỗ trên đảo: nhà, xưởng, đám cháy gần nhất ----- */
    function dmgPos(L, d) {
      if (d.kind === 'house') { const H = L.houses[d.ref]; return H ? L.houseLots[H.idx].p : null; }
      if (d.kind === 'firm') { const o = L.firmObj.get(d.ref); return o ? o.g.position : null; }
      if (d.kind === 'land') return L.slots[d.ref] || null;
      return null;
    }
    function spotAt(L, x, z, R) {
      const c = W.cities[L.i], d2 = (p) => (p.x - x) ** 2 + (p.z - z) ** 2, R2 = R * R;
      const houses = L.houses.map((H, i) => [i, d2(L.houseLots[H.idx].p)]).filter((q) => q[1] < R2).sort((a, b) => a[1] - b[1]).map((q) => q[0]);
      const firms = [...L.firmObj.entries()].map(([id, o]) => [id, d2(o.g.position)]).filter((q) => q[1] < R2 * 1.4).sort((a, b) => a[1] - b[1]).map((q) => q[0]);
      const dmg = (c.dmg || []).filter((d) => d.state === 'fire').map((d) => [d.id, dmgPos(L, d)]).filter((q) => q[1] && d2(q[1]) < R2 * 1.4).map((q) => q[0]);
      return { x, z, houses, firms, dmg };
    }

    /* ----- Mảnh hình ----- */
    const world = (L, p, y) => L.world(p).setY(y == null ? 0 : y);
    function rainOver(at, R, dur) {
      const n = 520, geo = new THREE.BufferGeometry(), pos = new Float32Array(n * 6), seed = [];
      for (let i = 0; i < n; i++) seed.push({ a: rnd() * TAU, r: Math.sqrt(rnd()) * R, y: rnd() * 16, v: 18 + rnd() * 10 });
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const lines = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: '#cfe8ff', transparent: true, opacity: 0.75, depthWrite: false }));
      lines.frustumCulled = false; lines.userData.noFade = true; scene.add(lines);
      const cloud = [];
      for (let i = 0; i < 9; i++) { const s = P.spr('#6b7480', 9 + rnd() * 6, 0, true); s.position.copy(at).add(v3((rnd() - 0.5) * R * 1.4, 15 + rnd() * 2, (rnd() - 0.5) * R * 1.4)); cloud.push(s); }
      P.run(dur, (u, ms) => {
        const f = Math.min(1, u * 6, (1 - u) * 5);
        for (const s of cloud) s.material.opacity = 0.75 * f;
        lines.material.opacity = 0.75 * f;
        for (let i = 0; i < n; i++) { const q = seed[i], y = 16 - ((ms * 0.001 * q.v + q.y) % 16), x = at.x + Math.cos(q.a) * q.r, z = at.z + Math.sin(q.a) * q.r; pos[i * 6] = x; pos[i * 6 + 1] = y; pos[i * 6 + 2] = z; pos[i * 6 + 3] = x + 0.05; pos[i * 6 + 4] = y + 0.7; pos[i * 6 + 5] = z; }
        geo.attributes.position.needsUpdate = true;
      }, () => { P.kill(lines); cloud.forEach((s) => P.kill(s)); });
      const wet = new THREE.Mesh(new THREE.CircleGeometry(R, 32), P.basic('#2a3a48', 0)); wet.rotation.x = -Math.PI / 2; wet.position.copy(at).setY(0.07); wet.renderOrder = 2; scene.add(wet);
      P.run(dur + 14000, (u) => { wet.material.opacity = 0.32 * Math.min(1, u * 4, (1 - u) * 2); }, () => P.kill(wet));
    }
    function steam(p) { for (let k = 0; k < 7; k++) P.later(k * 160, () => puff(p.clone().add(v3((rnd() - 0.5) * 1.6, 0.5 + rnd(), (rnd() - 0.5) * 1.6)), false, '#eef6fb')); P.flash(p.clone().setY(1.2), 4, '#9fd3f0'); }
    function bolt(to) {
      const from = to.clone().add(v3((rnd() - 0.5) * 6, 60, (rnd() - 0.5) * 6));
      P.beam(from, to.clone().setY(0.5), '#e8f4ff', 520, 1.4);
      P.later(60, () => P.beam(from.clone().add(v3(2, 0, -1)), to.clone().setY(0.5), '#ffffff', 300, 0.7));
      P.flash(to.clone().setY(1.5), 18, '#e8f4ff'); P.explosion(to, 3.2); P.crater(to, 1.6, 20000);
      if (shake) shake(380);
    }
    function wind(at, dirs) {
      const geo = new THREE.BufferGeometry(), n = 260, pos = new Float32Array(n * 6), seed = [];
      for (let i = 0; i < n; i++) seed.push({ d: dirs[i % dirs.length], o: v3((rnd() - 0.5) * 8, 0.5 + rnd() * 5, (rnd() - 0.5) * 8), s: rnd() });
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const lines = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: '#f4fbff', transparent: true, opacity: 0.7, depthWrite: false }));
      lines.frustumCulled = false; lines.userData.noFade = true; scene.add(lines);
      P.run(4200, (u) => {
        lines.material.opacity = 0.7 * Math.min(1, u * 5, (1 - u) * 4);
        for (let i = 0; i < n; i++) { const q = seed[i], k = ((u * 2.4 + q.s) % 1) * 46, p = at.clone().add(q.o).addScaledVector(q.d, k); pos[i * 6] = p.x; pos[i * 6 + 1] = p.y; pos[i * 6 + 2] = p.z; pos[i * 6 + 3] = p.x + q.d.x * 2.2; pos[i * 6 + 4] = p.y; pos[i * 6 + 5] = p.z + q.d.z * 2.2; }
        geo.attributes.position.needsUpdate = true;
      }, () => P.kill(lines));
      for (let i = 0; i < 18; i++) P.later(i * 120, () => puff(at.clone().add(v3((rnd() - 0.5) * 10, 0.6, (rnd() - 0.5) * 10)), false, '#a8d48a'));
    }
    function flock(at, targets) {
      const birds = [], mat = new THREE.MeshBasicMaterial({ color: '#2b2b2b' }), geo = new THREE.ConeGeometry(0.22, 0.7, 4); geo.rotateX(Math.PI / 2);
      for (let i = 0; i < 46; i++) { const m = new THREE.Mesh(geo, mat); m.userData.shared = true; scene.add(m); birds.push({ m, ph: rnd() * TAU, r: 3 + rnd() * 7, h: 6 + rnd() * 6, t: targets.length ? targets[i % targets.length] : null, w: 0.8 + rnd() * 0.8 }); }
      P.run(6500, (u, ms) => {
        for (const b of birds) {
          const a = b.ph + ms * 0.003 * b.w, swirl = at.clone().add(v3(Math.cos(a) * b.r, b.h + Math.sin(ms * 0.006 + b.ph) * 0.8, Math.sin(a) * b.r));
          const k = b.t ? Math.max(0, Math.min(1, (u - 0.45) * 2.4)) : 0, dive = b.t ? swirl.clone().lerp(b.t.clone().setY(1.2), k * k) : swirl;
          b.m.lookAt(dive.x + Math.cos(a + 1.5), dive.y, dive.z + Math.sin(a + 1.5)); b.m.position.copy(dive);
        }
      }, () => { birds.forEach((b) => P.kill(b.m, true)); geo.dispose(); mat.dispose(); });
    }
    function letter(from, to) {
      const s = P.spr('#fffbe8', 2.2, 1), card = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.5), P.basic('#fff6dc')); scene.add(card);
      P.run(2600, (u) => { const p = from.clone().lerp(to, u); p.y += Math.sin(u * Math.PI) * 6; s.position.copy(p); card.position.copy(p); card.rotation.set(0, u * 8, Math.sin(u * 12) * 0.4); }, () => { P.kill(s); P.kill(card); P.ring(to.clone().setY(0.4), '#ffe08a', 16, 1800); P.flash(to.clone().setY(3), 10, '#ffe08a'); });
    }
    function sunbeam(at) {
      P.beam(at.clone().setY(70), at.clone().setY(0.5), '#ffd36b', 3600, 3.2);
      for (let i = 0; i < 40; i++) { const s = P.spr(i % 2 ? '#ffe08a' : '#b9f07a', 0.8 + rnd() * 0.6, 0); const o = v3((rnd() - 0.5) * 22, 0.3, (rnd() - 0.5) * 22), d = rnd() * 0.5; P.run(5200, (u) => { const k = Math.max(0, u - d); s.position.copy(at).add(o).setY(0.3 + k * 6); s.material.opacity = Math.sin(Math.min(1, k * 2) * Math.PI) * 0.9; }, () => P.kill(s)); }
      const glow = new THREE.Mesh(new THREE.CircleGeometry(12, 32), P.basic('#ffe08a', 0, true)); glow.rotation.x = -Math.PI / 2; glow.position.copy(at).setY(0.09); scene.add(glow);
      P.run(6000, (u) => { glow.material.opacity = 0.35 * Math.sin(u * Math.PI); }, () => P.kill(glow));
    }
    function doorFlashes(L, idxs) {
      idxs.slice(0, 6).forEach((idx, j) => P.later(j * 180, () => { const H = L.houses[idx]; if (!H) return; const p = L.houseLots[H.idx].p, r = Math.hypot(p.x, p.z) || 1, door = v3(p.x - (p.x / r) * 1.4, 0, p.z - (p.z / r) * 1.4); P.ring(world(L, door, 0.3), '#ffb347', 3, 900); P.flash(world(L, door, 1.2), 3.4, '#ffd27a'); }));
      if (audio && audio.on && audio.chime) audio.chime();
    }
    function fallingFlag(L, idx, color) {
      const H = L.houses[idx]; if (!H) return;
      const p = L.houseLots[H.idx].p, b = new THREE.Box3().setFromObject(H.g), top = b.max.y;
      const g = new THREE.Group(), pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.3, 5), P.lam('#3a2a1e')), cloth = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.62), P.basic(color));
      pole.position.y = 1.15; cloth.position.set(0.52, 1.9, 0); g.add(pole); g.add(cloth); g.position.copy(L.world(p)).setY(top); scene.add(g);
      P.run(2400, (u) => { g.rotation.z = -u * 1.7; g.position.y = top + Math.sin(u * Math.PI) * 0.6 - u * u * top; cloth.material.opacity = 1; }, () => { P.kill(g); puff(L.world(p).setY(0.6), false, '#c9b9a0'); });
      P.flash(L.world(p).setY(top + 1), 6, '#9df0c4');
    }
    function darkOmen(at) {
      P.ring(at.clone().setY(0.3), '#2b1640', 14, 2200); P.ring(at.clone().setY(0.35), '#7a3ac9', 9, 1700);
      for (let i = 0; i < 12; i++) P.later(i * 90, () => puff(at.clone().add(v3((rnd() - 0.5) * 6, 0.4, (rnd() - 0.5) * 6)), false, '#3a2a4a'));
    }
    function rats(from) {
      const list = [], mat = P.lam('#6b6460'), geo = new THREE.SphereGeometry(0.16, 6, 4); geo.scale(1, 0.7, 1.6);
      for (let i = 0; i < 22; i++) { const m = new THREE.Mesh(geo, mat); m.userData.shared = true; scene.add(m); const a = rnd() * TAU; list.push({ m, a, v: 3 + rnd() * 3, d: rnd() * 0.3 }); }
      P.run(3200, (u) => { for (const r of list) { const k = Math.max(0, u - r.d) * r.v * 3; r.m.position.copy(from).add(v3(Math.cos(r.a) * k, 0.1 + Math.abs(Math.sin(u * 40 + r.a)) * 0.08, Math.sin(r.a) * k)); r.m.rotation.y = -r.a + Math.PI / 2; r.m.visible = u < 0.95; } }, () => { list.forEach((r) => P.kill(r.m, true)); geo.dispose(); mat.dispose(); });
      for (let i = 0; i < 10; i++) P.later(400 + i * 120, () => { const s = P.spr('#9df0c4', 1.2, 0.9); s.position.copy(from).add(v3((rnd() - 0.5) * 3, 1 + rnd() * 2, (rnd() - 0.5) * 3)); P.run(1400, (u) => { s.position.y += 0.02; s.material.opacity = 0.9 * (1 - u); }, () => P.kill(s)); });
    }
    function hearts(at, n) {
      for (let i = 0; i < (n || 26); i++) { const s = P.spr(i % 3 ? '#ff9ad8' : '#b9f0c4', 0.9 + rnd() * 0.5, 0); const o = v3((rnd() - 0.5) * 7, 0.3, (rnd() - 0.5) * 7), d = rnd() * 0.5; P.run(4600, (u) => { const k = Math.max(0, u - d); s.position.copy(at).add(o).add(v3(Math.sin(k * 9 + i) * 0.4, k * 7, 0)); s.material.opacity = Math.sin(Math.min(1, k * 1.6) * Math.PI) * 0.95; }, () => P.kill(s)); }
      P.ring(at.clone().setY(0.3), '#ff9ad8', 7, 2000);
    }
    function pawTrail(L, from, to) {
      const steps = Math.max(8, Math.floor(from.distanceTo(to) / 1.4)), dir = to.clone().sub(from).normalize(), side = v3(-dir.z, 0, dir.x);
      for (let i = 0; i <= steps; i++) P.later(i * 70, () => { const p = from.clone().lerp(to, i / steps).addScaledVector(side, i % 2 ? 0.3 : -0.3); const s = P.spr('#ffe08a', 0.9, 0.95); s.position.copy(p).setY(0.25); P.run(16000, (u) => { s.material.opacity = 0.95 * (1 - u); }, () => P.kill(s)); });
    }

    /* ----- Tượng chim, tượng mèo trên quảng trường ----- */
    const statues = {};
    function statueKit(body) {
      const k = new KT.Kit();
      k.cyl('#c9bda4', 0, 0, 0, 1.0, 1.0, 10); k.cyl('#b1a99c', 0, 1.0, 0, 0.8, 0.25, 10);
      const g = '#d9a441';
      if (body === 'bird') {
        k.add(KT.ICO(), g, 0, 2.2, 0, 0.75, 0.62, 0.95); k.add(KT.ICO(), g, 0, 2.85, 0.45, 0.48, 0.48, 0.48); k.add(KT.UCONE(6), '#e0b23a', 0, 2.8, 0.85, 0.14, 0.45, 0.14, 0, Math.PI / 2, 0);
        for (const s of [-1, 1]) k.add(KT.UBOX(), g, s * 0.9, 2.35, 0, 1.3, 0.12, 0.7, 0, 0, s * 0.5);
        k.add(KT.UCONE(6), g, 0, 2.1, -0.85, 0.35, 0.7, 0.12, 0, -Math.PI / 2 - 0.3, 0);
      } else {
        k.add(KT.ICO(), g, 0, 1.8, 0, 0.6, 0.55, 0.85); k.add(KT.ICO(), g, 0, 2.55, 0.5, 0.48, 0.44, 0.44);
        for (const s of [-1, 1]) k.add(KT.UCONE(4), g, s * 0.25, 2.85, 0.45, 0.14, 0.32, 0.14, 0, 0, -s * 0.25);
        for (const [x, z] of [[-0.3, 0.45], [0.3, 0.45], [-0.3, -0.45], [0.3, -0.45]]) k.cyl(g, x, 1.25, z, 0.12, 0.45, 6);
        k.add(KT.UCYL(6), g, 0, 1.9, -0.75, 0.08, 1.1, 0.08, 0, -0.5, 0);
      }
      k.add(KT.ICO(), '#fff3c4', 0, body === 'bird' ? 3.5 : 3.3, 0, 0.18, 0.18, 0.18, 0, 0, 0, 'glow');
      return k;
    }
    function syncStatues() {
      for (const L of lands) {
        const c = W.cities[L.i];
        for (const body of ['bird', 'cat']) {
          const key = L.i + body, want = c.settled && c.legend && c.legend[body] >= 5;
          if (want && !statues[key]) {
            const a = Math.atan2(L.inw.z, L.inw.x) + (body === 'bird' ? 0.9 : -0.9), p = v3(Math.cos(a) * 6.2, 0, Math.sin(a) * 6.2);
            statues[key] = KT.meshOf(statueKit(body), L.litMat, L.g, p.x, p.z, Math.atan2(-p.x, -p.z));
            P.flash(L.world(p).setY(3), 9, '#ffe08a'); P.ring(L.world(p).setY(0.3), '#ffe08a', 8, 1600);
          } else if (!want && statues[key]) { L.g.remove(statues[key]); KT.disposeGroup(statues[key]); delete statues[key]; }
        }
      }
    }

    /* ----- Mỗi phép một cảnh ----- */
    function play(r, avatarPos) {
      if (!r || !r.fx) return;
      const fx = r.fx, L = lands[fx.city];
      if (!L) return;
      const at = avatarPos ? avatarPos.clone().setY(0) : L.world(v3(fx.at.x, 0, fx.at.z)), c = W.cities[L.i];
      if (reduce) { syncStatues(); return; }
      if (fx.key === 'rain') { rainOver(at, 11, 6500); for (const id of fx.out || []) { const d = (c.dmg || []).find((x) => x.id === id); const p = d && dmgPos(L, d); if (p) P.later(900 + rnd() * 1500, () => steam(L.world(p))); } }
      else if (fx.key === 'bolt') {
        let to = null;
        if (fx.lane && war3d.lanePos) { to = v3(0, 0, 0); if (!war3d.lanePos(fx.lane, fx.x, 0, to)) to = null; }
        if (!to) to = fx.unitCity != null && lands[fx.unitCity] && lands[fx.unitCity].musterPos ? lands[fx.unitCity].world(lands[fx.unitCity].musterPos) : at.clone().add(v3((rnd() - 0.5) * 8, 0, (rnd() - 0.5) * 8));
        bolt(to); if (war3d.deathsNow) P.later(250, () => war3d.deathsNow());
      }
      else if (fx.key === 'gust') { const dirs = L.landing.map((g) => g.clone().normalize()); dirs.push(L.inw.clone().negate().normalize().negate()); wind(at.clone().setY(0), dirs); if (war3d.deathsNow) war3d.deathsNow(); }
      else if (fx.key === 'flock') { const ts = L.gates.map((g) => L.world(g.clone().multiplyScalar(1.2))); flock(at, fx.hit ? ts : []); if (war3d.deathsNow) P.later(3500, () => war3d.deathsNow()); }
      else if (fx.key === 'letter') { letter(avatarPos ? avatarPos.clone() : at.clone().setY(8), L.center.clone().setY(2)); for (const g of L.gates) P.later(2700, () => P.flash(L.world(g).setY(2), 7, '#ffe08a')); }
      else if (fx.key === 'sun') sunbeam(at);
      else if (fx.key === 'alarm') doorFlashes(L, fx.houses || []);
      else if (fx.key === 'gnaw') fallingFlag(L, fx.house, factionColor(fx.by));
      else if (fx.key === 'omen') darkOmen(at);
      else if (fx.key === 'rats') { const o = fx.firm != null ? L.firmObj.get(fx.firm) : null; rats(o ? L.world(o.g.position) : at); }
      else if (fx.key === 'purr') hearts(at, 30);
      else if (fx.key === 'path') { const B = fx.bridge != null ? lands3d.bridges.find((b) => b.sim.id === fx.bridge) : null, end = B ? (B.a === L.i ? B.pa : B.pb).clone() : L.world(L.dockPos || L.harbor); pawTrail(L, L.center.clone().add(L.inw.clone().multiplyScalar(6)), end); }
      if (r.statue) P.later(1500, syncStatues); else syncStatues();
    }
    return { play, spotAt, syncStatues, dmgPos };
  }
  root.Powers3D = { create };
})(typeof window !== 'undefined' ? window : globalThis);
