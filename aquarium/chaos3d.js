/* Bể Kính — hình ảnh của bốn mươi bốn kịch bản hỗn loạn, cùng không chiến và đổ quân qua cổng không gian.
 * Mỗi kịch bản được ghép từ vài mảnh hình dùng chung (đá trời, xúc tu, đàn thú, mây hạt, sương, tàu, máy bay, cổng,
 * khe nứt thời gian, tia sáng, nhiễu sóng, robot, gai san hô...). Mọi thứ chạy theo thời gian thật rồi tự dọn đi;
 * dấu vết lâu dài (nhà cháy, đổ nát) do lớp công trình vẽ theo bản mô phỏng. */
(function (root) {
  'use strict';
  function create(K) {
    const { THREE, scene, Sim, W, lands3d, war3d, god3d, fauna, puff, reduce, glowTex, shake, audio, ripple, camera, setDim, factionColor } = K;
    const TAU = Math.PI * 2, lands = lands3d.lands, F = lands3d.fig, rnd = Math.random, v3 = (x, y, z) => new THREE.Vector3(x, y, z);
    const SEA_Y = war3d && war3d.SEA_Y != null ? war3d.SEA_Y : -0.55;
    const active = [];
    const now = () => performance.now();
    const run = (dur, update, end) => active.push({ t0: now(), dur, update, end });
    const later = (ms, fn) => setTimeout(fn, ms);
    // bỏ một vật khỏi cảnh; keep: chỉ gỡ ra, không huỷ hình (hình dùng chung với thú, nhà)
    function kill(o, keep) { if (!o) return; if (o.parent) o.parent.remove(o); if (keep) return; o.traverse((x) => { if (x.geometry && !x.userData.shared) x.geometry.dispose(); if (x.material && !x.userData.sharedMat) x.material.dispose(); }); }
    function spr(color, size, op, normal) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color, transparent: true, opacity: op == null ? 1 : op, depthWrite: false, blending: normal ? THREE.NormalBlending : THREE.AdditiveBlending })); s.scale.setScalar(size); scene.add(s); return s; }
    const basic = (color, op, add) => new THREE.MeshBasicMaterial({ color, transparent: op != null, opacity: op == null ? 1 : op, depthWrite: op == null, side: THREE.DoubleSide, blending: add ? THREE.AdditiveBlending : THREE.NormalBlending });
    const lam = (color) => new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: 0.8 });
    function ring(p, color, size, dur, vertical) { const m = new THREE.Mesh(new THREE.RingGeometry(0.8, 1.4, 48), basic(color, 0.9)); if (!vertical) m.rotation.x = -Math.PI / 2; m.position.copy(p); scene.add(m); run(dur, (u) => { m.scale.setScalar(1 + u * size); m.material.opacity = 0.9 * (1 - u); }, () => kill(m)); }
    function flash(p, size, color) { const s = spr(color || '#ffd27a', size * 0.3, 1); s.position.copy(p); run(900, (u) => { s.scale.setScalar(size * (0.3 + u)); s.material.opacity = 1 - u; }, () => kill(s)); }
    function crater(p, r, dur) { const m = new THREE.Mesh(new THREE.CircleGeometry(r, 24), basic('#2b2420', 0.85)); m.rotation.x = -Math.PI / 2; m.position.copy(p).setY(0.06); m.renderOrder = 1; scene.add(m); run(dur, (u) => { m.material.opacity = 0.85 * Math.min(1, (1 - u) * 6); }, () => kill(m)); }
    function smoke(p, n, color, spread) { for (let k = 0; k < n; k++) later(k * 90, () => puff(p.clone().add(v3((rnd() - 0.5) * (spread || 2), rnd() * 2, (rnd() - 0.5) * (spread || 2))), true, color || '#4a4a4a')); }
    // điểm ngẫu nhiên: trong thành (bán kính rMax quanh quảng trường) hoặc trên bãi săn
    function cityPt(L, rMax) { for (let t = 0; t < 30; t++) { const a = rnd() * TAU, r = 4 + rnd() * ((rMax || 22) - 4), x = Math.cos(a) * r, z = Math.sin(a) * r; if (L.inside(x, z, 2)) return L.world(v3(x, 0, z)); } return L.center.clone(); }
    function wildPt(L) { const H = L.hunt; for (let t = 0; t < 30; t++) { const a = H.oa + (rnd() - 0.5) * 2 * H.spread, r = H.r0 + rnd() * (L.rOf(a) - H.margin - H.r0), x = Math.cos(a) * r, z = Math.sin(a) * r; if (L.inside(x, z, 2)) return L.world(v3(x, 0, z)); } return L.world(v3(Math.cos(H.oa) * 28, 0, Math.sin(H.oa) * 28)); }
    // chỗ vừa bị thiệt hại hôm nay (để vụ nổ, hố sụt rơi đúng chỗ nhà cháy)
    function dmgPt(L) {
      const c = W.cities[L.i], d = (c.dmg || []).filter((x) => x.day === W.day).pop();
      if (d) {
        if (d.kind === 'land' && L.slots[d.ref]) return L.world(L.slots[d.ref]);
        if (d.kind === 'firm') { const o = L.firmObj.get(d.ref); if (o) return L.world(o.g.position); }
        if (d.kind === 'house') { const H = L.houses[d.ref]; if (H) return L.world(H.g.position); }
      }
      return cityPt(L, 18);
    }
    const inwardW = (L) => L.inw.clone();

    /* =============== Mảnh hình dùng chung =============== */
    function meteors(L, n, big) {
      for (let i = 0; i < n; i++) later(i * (big ? 0 : 260), () => {
        const to = big ? L.center.clone().add(v3((rnd() - 0.5) * 14, 0, (rnd() - 0.5) * 14)) : cityPt(L, 32), from = to.clone().add(v3(-55 + rnd() * 20, 110 + rnd() * 30, -30 + rnd() * 20));
        const head = spr(big ? '#ffd9a0' : '#ffe8c0', big ? 16 : 5, 1), tail = spr('#ff8a3d', big ? 34 : 12, 0.6);
        const rock = big ? new THREE.Mesh(new THREE.DodecahedronGeometry(3, 0), lam('#4a3a30')) : null;
        if (rock) scene.add(rock);
        run(big ? 2600 : 1300 + rnd() * 400, (u) => { const p = from.clone().lerp(to, u * u); head.position.copy(p); tail.position.copy(from.clone().lerp(to, Math.max(0, u * u - 0.06))); if (rock) { rock.position.copy(p); rock.rotation.x += 0.12; } if (!reduce && rnd() < 0.4) puff(p.clone(), true, '#6a5a4a'); },
          () => { kill(head); kill(tail); kill(rock); impact(to, big); });
      });
    }
    function impact(p, big) {
      flash(p.clone().setY(1.5), big ? 46 : 11, '#ffcf7a'); ring(p.clone().setY(0.4), '#ffb36b', big ? 26 : 8, 1600);
      smoke(p, big ? 16 : 5, '#5a4a3a', big ? 10 : 3); crater(p, big ? 7 : 2.2, big ? 45000 : 16000);
      if (big) { shake(800); if (audio && audio.on && audio.boom) audio.boom(); }
    }
    function kraken(L) {
      const base = L.world(L.harbor).addScaledVector(inwardW(L), 11).setY(SEA_Y), g = new THREE.Group(); g.position.copy(base); scene.add(g);
      const tents = [], mats = [lam('#b0485a'), lam('#c25a6a')];
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * TAU, t = new THREE.Group(); t.position.set(Math.cos(a) * 3.6, -7, Math.sin(a) * 3.6); g.add(t);
        let parent = t;
        for (let s = 0; s < 7; s++) { const seg = new THREE.Mesh(new THREE.CylinderGeometry(0.5 - s * 0.06, 0.62 - s * 0.06, 1.6, 7), mats[s % 2]); seg.position.y = 0.8; parent.add(seg); const j = new THREE.Group(); j.position.y = 0.8; seg.add(j); parent = j; tents.push({ seg, i, s }); }
      }
      const boat = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.7, 3.8), lam('#6d5139')); boat.position.copy(base).add(v3(1.5, 0.2, 0.5)); scene.add(boat);
      ring(base.clone().setY(SEA_Y + 0.1), '#dff6ff', 12, 2200);
      run(9000, (u, ms) => {
        const rise = u < 0.2 ? u / 0.2 : u > 0.82 ? (1 - u) / 0.18 : 1;
        g.children.forEach((t) => { t.position.y = -7 + rise * 7.4; });
        for (const T of tents) T.seg.rotation.z = Math.sin(ms * 0.003 + T.i + T.s * 0.6) * 0.36 * rise;
        boat.position.y = SEA_Y + 0.2 - Math.max(0, u - 0.4) * 9; boat.rotation.z = Math.sin(ms * 0.01) * 0.4 * rise; boat.rotation.x = Math.max(0, u - 0.4) * 1.2;
        if (!reduce && rnd() < 0.05) ring(base.clone().add(v3((rnd() - 0.5) * 8, SEA_Y + 0.1 - base.y, (rnd() - 0.5) * 8)), '#dff6ff', 4, 1200);
      }, () => { kill(g); kill(boat); });
    }
    function eclipse() {
      const fwd = v3(0, 0.62, 0.5).unproject(camera).sub(camera.position).normalize();
      const at = camera.position.clone().addScaledVector(fwd, 900), side = v3(1, 0, 0).applyQuaternion(camera.quaternion);
      const sunS = spr('#fff1c4', 150, 1); sunS.material.fog = false; sunS.position.copy(at);
      const moon = new THREE.Mesh(new THREE.CircleGeometry(22, 32), new THREE.MeshBasicMaterial({ color: '#05070d', fog: false })); scene.add(moon);
      run(9000, (u) => { const k = Math.max(0, 1 - Math.abs(u - 0.5) * 2.4); setDim(k); moon.position.copy(at).addScaledVector(side, (0.5 - u) * 150).addScaledVector(fwd, -6); moon.lookAt(camera.position); }, () => { setDim(0); kill(sunS); kill(moon); });
    }
    // một bầy thú chạy băng qua đảo
    function herd(L, kinds, n, speed, across) {
      const a0 = Math.atan2(L.out.z, L.out.x) + (rnd() - 0.5) * 1.2, a1 = a0 + Math.PI + (rnd() - 0.5) * 0.8, R = lands3d.LAND_R * 0.82;
      const from = across === false ? wildPt(L) : L.world(v3(Math.cos(a0) * R, 0, Math.sin(a0) * R)), to = across === false ? L.center.clone() : L.world(v3(Math.cos(a1) * R, 0, Math.sin(a1) * R));
      const pack = [];
      for (let i = 0; i < n; i++) { const B = fauna.beast(kinds[i % kinds.length]); B.g.scale.setScalar(kinds[i % kinds.length] === 'sauropod' ? 0.6 : 0.85); scene.add(B.g); pack.push({ B, off: i * 0.06, lat: (rnd() - 0.5) * 6 }); }
      const dir = to.clone().sub(from), side = v3(-dir.z, 0, dir.x).normalize();
      run(speed || 9000, (u, ms) => {
        for (const h of pack) { const k = Math.min(1, Math.max(0, u * 1.25 - h.off)), p = from.clone().lerp(to, k).addScaledVector(side, h.lat); h.B.g.position.copy(p); h.B.g.lookAt(to.x + side.x * h.lat, p.y, to.z + side.z * h.lat); h.B.legs.forEach((l, i) => { l.rotation.x = Math.sin(ms * 0.016 + i * Math.PI) * 0.6; }); if (!reduce && rnd() < 0.04) puff(p.clone().setY(0.6), true, '#b9ab98'); }
      }, () => pack.forEach((h) => kill(h.B.g, true)));
    }
    function flyers(L, kind, n) {
      const birds = [];
      for (let i = 0; i < n; i++) { const B = fauna.beast(kind); scene.add(B.g); birds.push({ B, ph: i * (TAU / n), r: 10 + rnd() * 8, dive: 0.25 + rnd() * 0.5 }); }
      run(10000, (u, ms) => {
        for (const b of birds) {
          const a = b.ph + ms * 0.0012, d = Math.max(0, 1 - Math.abs(u - b.dive) * 5), y = 26 - d * 24;
          b.B.g.position.copy(L.center).add(v3(Math.cos(a) * b.r * (1 - d * 0.7), y, Math.sin(a) * b.r * (1 - d * 0.7)));
          b.B.g.rotation.y = -a; b.B.g.rotation.x = d * 0.6;
          b.B.legs.forEach((w, i) => { w.rotation.z = Math.sin(ms * 0.012 + i) * 0.6 * (i % 2 ? 1 : -1); });
        }
      }, () => birds.forEach((b) => kill(b.B.g, true)));
    }
    // cháy lan theo một dải rừng, cây cháy rụi để lại đất trống
    function wildfire(L, inCity) {
      const c0 = inCity ? cityPt(L, 18) : wildPt(L), fires = [];
      run(9000, (u) => {
        if (fires.length < 26 && rnd() < 0.35) { const p = c0.clone().add(v3((rnd() - 0.5) * (6 + u * 16), 0.8 + rnd() * 2, (rnd() - 0.5) * (6 + u * 16))); const s = spr(rnd() < 0.5 ? '#ff7a2a' : '#ffb347', 2.5 + rnd() * 2.5, 0.85); s.position.copy(p); fires.push({ s, t: 0, ph: rnd() * 6 }); }
        for (const f of fires) { f.t += 0.016; f.s.scale.setScalar((2.5 + Math.sin(f.t * 12 + f.ph)) * Math.min(1, f.t * 2)); if (!reduce && rnd() < 0.02) puff(f.s.position.clone().setY(f.s.position.y + 2), true, '#3a3a3a'); }
      }, () => {
        for (const f of fires) kill(f.s);
        const loc = c0.clone().sub(L.center); lands3d.kit.clearTrees(L, loc.x, loc.z, 9); crater(c0, 8, 60000);
      });
    }
    // mây hạt: châu chấu, cát, bụi nano, tuyết, sương độc
    function particles(L, color, n, size, mode, dur) {
      const geo = new THREE.BufferGeometry(), pos = new Float32Array(n * 3), seed = [];
      for (let i = 0; i < n; i++) seed.push({ a: rnd() * TAU, r: rnd(), y: rnd(), w: 0.5 + rnd() });
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const pts = new THREE.Points(geo, new THREE.PointsMaterial({ color, size, transparent: true, opacity: 0.9, depthWrite: false }));
      scene.add(pts);
      const R = lands3d.LAND_R, from = L.world(v3(Math.cos(L.oa) * R, 0, Math.sin(L.oa) * R)), to = L.world(v3(-Math.cos(L.oa) * R * 0.6, 0, -Math.sin(L.oa) * R * 0.6));
      run(dur || 9000, (u, ms) => {
        const fade = Math.min(1, u * 6, (1 - u) * 6);
        pts.material.opacity = 0.9 * fade;
        const c = mode === 'sweep' ? from.clone().lerp(to, u) : L.center;
        for (let i = 0; i < n; i++) {
          const q = seed[i];
          if (mode === 'fall') { pos[i * 3] = L.center.x + Math.cos(q.a) * q.r * R; pos[i * 3 + 2] = L.center.z + Math.sin(q.a) * q.r * R; pos[i * 3 + 1] = 22 - (((ms * 0.004 * q.w) + q.y * 22) % 22); continue; }
          q.a += (mode === 'swarm' ? 0.03 : 0.012) * q.w;
          const rr = (mode === 'sweep' ? 9 : R * 0.8) * q.r * (1 + 0.25 * Math.sin(ms * 0.003 + i));
          pos[i * 3] = c.x + Math.cos(q.a) * rr; pos[i * 3 + 1] = (mode === 'drift' ? 1 : 2) + q.y * (mode === 'drift' ? 6 : 9) + Math.sin(ms * 0.005 + i) * 0.5; pos[i * 3 + 2] = c.z + Math.sin(q.a) * rr;
        }
        geo.attributes.position.needsUpdate = true;
      }, () => kill(pts));
    }
    // vòm sương phủ đảo: khói độc, sương giá, nóng, phóng xạ
    function haze(L, color, op, dur) {
      const m = new THREE.Mesh(new THREE.SphereGeometry(lands3d.LAND_R * 1.12, 32, 12, 0, TAU, 0, Math.PI / 2), basic(color, 0)); m.scale.y = 0.35; m.position.copy(L.center); m.renderOrder = 4; scene.add(m);
      run(dur || 12000, (u) => { m.material.opacity = op * Math.min(1, u * 5, (1 - u) * 5); }, () => kill(m));
    }
    function avalanche(L) {
      const a = L.oa + (rnd() - 0.5) * 0.6, from = L.world(v3(Math.cos(a) * 36, 6, Math.sin(a) * 36)), to = L.world(v3(Math.cos(a) * 13, 0, Math.sin(a) * 13)), balls = [];
      for (let i = 0; i < 16; i++) { const m = new THREE.Mesh(new THREE.IcosahedronGeometry(1.2 + rnd() * 1.6, 0), lam('#f4f8fb')); scene.add(m); balls.push({ m, off: rnd() * 0.25, lat: (rnd() - 0.5) * 9 }); }
      const side = v3(-(to.z - from.z), 0, to.x - from.x).normalize();
      run(6000, (u) => { for (const b of balls) { const k = Math.min(1, Math.max(0, u * 1.3 - b.off)); b.m.position.copy(from).lerp(to, k).addScaledVector(side, b.lat); b.m.position.y = from.y * (1 - k) + 0.8; b.m.rotation.x += 0.15; if (!reduce && rnd() < 0.08) puff(b.m.position.clone(), false, '#f4f8fb'); } },
        () => { for (const b of balls) kill(b.m); const snow = new THREE.Mesh(new THREE.CircleGeometry(6, 20), basic('#f4f8fb', 0.95)); snow.rotation.x = -Math.PI / 2; snow.position.copy(to).setY(0.08); scene.add(snow); run(40000, (u) => { snow.material.opacity = 0.95 * Math.min(1, (1 - u) * 5); }, () => kill(snow)); });
    }
    function sinkhole(L) {
      const p = dmgPt(L), m = new THREE.Mesh(new THREE.CircleGeometry(1, 24), basic('#0b0907', 0.95)); m.rotation.x = -Math.PI / 2; m.position.copy(p).setY(0.07); scene.add(m);
      shake(400); smoke(p, 10, '#8a7a68', 5); ring(p.clone().setY(0.3), '#8a7a68', 8, 1500);
      run(40000, (u, ms) => { m.scale.setScalar(Math.min(4.2, 0.2 + ms * 0.004)); m.material.opacity = 0.95 * Math.min(1, (1 - u) * 6); }, () => kill(m));
    }
    function explosion(p, size) {
      flash(p.clone().setY(2), size * 3, '#fff1c4'); flash(p.clone().setY(1.5), size * 2, '#ff8a3d'); ring(p.clone().setY(0.4), '#ffb36b', size * 2, 1400);
      smoke(p.clone().setY(2), 14, '#3a3a3a', 3);
      const bits = [];
      for (let i = 0; i < 10; i++) { const m = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.3, 0.4), lam('#3a3430')); m.position.copy(p).setY(1.5); scene.add(m); bits.push({ m, v: v3((rnd() - 0.5) * 12, 8 + rnd() * 8, (rnd() - 0.5) * 12) }); }
      run(1800, () => { for (const b of bits) { b.v.y -= 0.6; b.m.position.addScaledVector(b.v, 0.016); b.m.rotation.x += 0.2; if (b.m.position.y < 0.1) { b.m.position.y = 0.1; b.v.multiplyScalar(0.3); } } }, () => bits.forEach((b) => kill(b.m)));
      shake(300);
      if (audio && audio.on && audio.boom) audio.boom();
    }
    // tàu cập bến: cướp biển (buồm đen, bắn đại bác) hoặc thuyền ma (trong suốt, lạnh lẽo)
    function ships(L, kind) {
      const dock = L.world(L.harbor).setY(SEA_Y), out = dock.clone().addScaledVector(inwardW(L), 30), side = v3(-L.inw.z, 0, L.inw.x), fleet = [];
      const n = kind === 'ghost' ? 1 : 3;
      for (let i = 0; i < n; i++) {
        const g = new THREE.Group(), ghost = kind === 'ghost';
        const hull = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.9, 5), ghost ? basic('#cfe8e0', 0.45, true) : lam('#2b221c')); hull.position.y = 0.3; g.add(hull);
        const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 4.4, 5), ghost ? basic('#cfe8e0', 0.45, true) : lam('#3a2a1e')); mast.position.y = 2.6; g.add(mast);
        const sail = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 2.4), ghost ? basic('#e8fff4', 0.35, true) : basic('#111111', 1)); sail.position.set(0, 3, 0.1); g.add(sail);
        if (!ghost) { const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.5), basic('#e05a6a')); flag.position.set(0.4, 5, 0); g.add(flag); }
        scene.add(g); fleet.push({ g, lat: (i - (n - 1) / 2) * 4, glow: ghost ? spr('#9fffd8', 9, 0.5) : null });
      }
      run(kind === 'ghost' ? 14000 : 11000, (u, ms) => {
        const k = Math.min(1, u * 1.6), fade = kind === 'ghost' ? Math.min(1, u * 4, (1 - u) * 4) : 1;
        for (const f of fleet) {
          const p = out.clone().lerp(dock.clone().addScaledVector(L.inw, 3), k).addScaledVector(side, f.lat); p.y = SEA_Y + Math.sin(ms * 0.002 + f.lat) * 0.1;
          f.g.position.copy(p); f.g.lookAt(dock.x + side.x * f.lat, p.y, dock.z + side.z * f.lat);
          if (f.glow) { f.glow.position.copy(p).setY(p.y + 2); f.glow.material.opacity = 0.5 * fade; f.g.traverse((o) => { if (o.material && o.material.transparent) o.material.opacity = 0.4 * fade; }); }
          if (kind !== 'ghost' && k > 0.6 && rnd() < 0.03 && war3d && war3d.shotRaw) war3d.shotRaw(p.clone().setY(p.y + 1), dock.clone().addScaledVector(L.inw, -6).add(v3((rnd() - 0.5) * 8, 1, (rnd() - 0.5) * 8)), '#2b2b2b', 0.25, 2, 700);
        }
        if (kind !== 'ghost' && u > 0.55 && rnd() < 0.02) { const q = L.world(L.dockPos).add(v3((rnd() - 0.5) * 6, 1.5, (rnd() - 0.5) * 6)); flash(q, 6, '#ff8a3d'); puff(q, true, '#3a3a3a'); }
      }, () => fleet.forEach((f) => { kill(f.g); kill(f.glow); }));
    }
    // máy bay: ném bom một đảo, hoặc hai phi đội không chiến trên biển trong rồi phe thắng ném bom thành thua
    function planeMesh(col) {
      const g = new THREE.Group();
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.5, 3), lam('#dfe3e8')); g.add(body);
      const wing = new THREE.Mesh(new THREE.BoxGeometry(4, 0.08, 0.9), lam(col)); g.add(wing);
      const tail = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.06, 0.5), lam(col)); tail.position.z = -1.3; g.add(tail);
      const fin = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.6, 0.5), lam(col)); fin.position.set(0, 0.3, -1.3); g.add(fin);
      scene.add(g); return g;
    }
    function bombRun(L, col, delay) {
      later(delay || 0, () => {
        const a = rnd() * TAU, from = L.center.clone().add(v3(Math.cos(a) * 60, 30, Math.sin(a) * 60)), to = L.center.clone().add(v3(-Math.cos(a) * 60, 30, -Math.sin(a) * 60)), planes = [];
        for (let i = 0; i < 4; i++) planes.push({ g: planeMesh(col), lat: (i - 1.5) * 4, drop: 0.35 + rnd() * 0.3, done: false });
        const side = v3(-Math.sin(a), 0, Math.cos(a));
        run(7000, (u) => {
          for (const P of planes) {
            const p = from.clone().lerp(to, u).addScaledVector(side, P.lat); P.g.position.copy(p); P.g.lookAt(to.clone().addScaledVector(side, P.lat));
            if (!P.done && u > P.drop) { P.done = true; const bomb = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 6), lam('#2b2b2b')); bomb.position.copy(p); scene.add(bomb); const tgt = cityPt(L, 24), start = p.clone(); run(1300, (k) => { bomb.position.copy(start).lerp(tgt, k * k); }, () => { kill(bomb); explosion(tgt, 3); }); }
          }
        }, () => planes.forEach((P) => kill(P.g)));
      });
    }
    function dogfight(Lw, Ll, colW, colL) {
      const mid = Lw.center.clone().lerp(Ll.center, 0.5).multiplyScalar(0.55).setY(24), planes = [];
      for (let s = 0; s < 2; s++) for (let i = 0; i < 4; i++) planes.push({ g: planeMesh(s ? colL : colW), s, ph: i * 0.7 + s * Math.PI, r: 10 + i * 3, h: 22 + i * 2, alive: true });
      let next = 0;
      run(11000, (u, ms) => {
        for (const P of planes) {
          if (!P.alive) { P.g.position.y -= 0.35; P.g.rotation.z += 0.09; if (!reduce && rnd() < 0.3) puff(P.g.position.clone(), true, '#4a4a4a'); continue; }
          const a = P.ph + ms * 0.0008 * (P.s ? -1 : 1), p = mid.clone().add(v3(Math.cos(a) * P.r, P.h - 24 + Math.sin(ms * 0.002 + P.ph) * 2.5, Math.sin(a) * P.r));
          const n = mid.clone().add(v3(Math.cos(a + 0.05 * (P.s ? -1 : 1)) * P.r, p.y - 24, Math.sin(a + 0.05 * (P.s ? -1 : 1)) * P.r));
          P.g.position.copy(p); P.g.lookAt(n.x, p.y, n.z); P.g.rotation.z = P.s ? 0.45 : -0.45;
        }
        if (ms > next) {
          next = ms + 170;
          const A = planes.filter((P) => P.alive && P.s === 0), B = planes.filter((P) => P.alive && P.s === 1);
          if (A.length && B.length) {
            const pair = rnd() < 0.6 ? [A, B] : [B, A], f = pair[0][Math.floor(rnd() * pair[0].length)], t = pair[1][Math.floor(rnd() * pair[1].length)];
            const tr = spr('#ffe9a0', 0.9, 1), p0 = f.g.position.clone(), p1 = t.g.position.clone();
            run(240, (k) => tr.position.copy(p0).lerp(p1, k), () => kill(tr));
            if (u > 0.25 && t.s === 1 && rnd() < 0.08) { t.alive = false; flash(p1, 4, '#ff8a3d'); }
          }
        }
      }, () => planes.forEach((P) => kill(P.g)));
      bombRun(Ll, colW, 7000);
    }
    // cổng không gian: lính bước ra (chiến tranh) hoặc khủng long từ thời xưa (cổng mất kiểm soát)
    function portal(L, spawn, color) {
      const at = cityPt(L, 16).setY(4.6), face = L.center.clone().setY(4.6);
      const ringM = new THREE.Mesh(new THREE.TorusGeometry(4.2, 0.38, 10, 48), basic('#c9a6ff')); ringM.position.copy(at); ringM.lookAt(face); scene.add(ringM);
      const disc = new THREE.Mesh(new THREE.CircleGeometry(4, 40), basic('#2a1550', 0.9)); disc.position.copy(at); disc.lookAt(face); scene.add(disc);
      const halo = spr('#b48cff', 24, 0.7); halo.position.copy(at);
      const goal = L.center.clone().lerp(at.clone().setY(0), 0.35).setY(0), dir = goal.clone().sub(at.clone().setY(0)).normalize(), side = v3(-dir.z, 0, dir.x);
      const walkers = [];
      if (spawn === 'dinos') { for (const kind of ['trex', 'raptor', 'tri', 'raptor']) { const B = fauna.beast(kind); B.g.scale.setScalar(0.7); B.g.visible = false; scene.add(B.g); walkers.push({ B, d: walkers.length * 700, lat: (walkers.length - 1.5) * 2.5 }); } }
      else for (let i = 0; i < 12; i++) {
        const g = new THREE.Group(); const b = new THREE.Mesh(new THREE.BoxGeometry(0.9, 2.2, 0.7), lam('#3a3f48')); b.position.y = 1.1; g.add(b);
        const h = new THREE.Mesh(new THREE.SphereGeometry(0.42, 10, 8), lam('#2b313a')); h.position.y = 2.55; g.add(h);
        const vis = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.15, 0.06), basic(color || '#d9b8ff')); vis.position.set(0, 2.6, 0.38); g.add(vis);
        const tm = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.5, 0.75), basic(color || '#b48cff')); tm.position.y = 1.5; g.add(tm);
        g.visible = false; scene.add(g); walkers.push({ g, d: i * 260, lat: ((i % 5) - 2) * 1.3 });
      }
      run(10000, (u, ms) => {
        const open = Math.min(1, ms / 900), close = u > 0.88 ? (1 - u) / 0.12 : 1;
        ringM.scale.setScalar(Math.max(0.01, open * close)); disc.scale.setScalar(Math.max(0.01, open * close)); ringM.rotation.z += 0.06; halo.material.opacity = 0.7 * open * close;
        for (const w of walkers) {
          const k = Math.min(1, Math.max(0, (ms - 900 - w.d) / 3400)), obj = w.B ? w.B.g : w.g;
          obj.visible = k > 0 && (w.B || Math.sin(ms * 0.04 + w.d) > -0.7);
          const p = at.clone().setY(0).lerp(goal, k).addScaledVector(side, w.lat * Math.min(1, k * 3));
          obj.position.copy(p).setY(Math.max(0, (at.y - 2.2) * (1 - k / 0.15)));
          obj.lookAt(goal.x, obj.position.y, goal.z);
          if (w.B) w.B.legs.forEach((l, i) => { l.rotation.x = Math.sin(ms * 0.015 + i * Math.PI) * 0.6; });
        }
      }, () => { kill(ringM); kill(disc); kill(halo); for (const w of walkers) { if (w.B) kill(w.B.g, true); else kill(w.g); } });
    }
    // khe nứt thời gian: thành phố ngày xưa hiện về như bóng ma tím
    const ghostMat = new THREE.MeshBasicMaterial({ color: '#c9a6ff', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
    function rift(L) {
      const center = L.center.clone(), crack = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 20), basic('#e0ccff', 0, true)), halo = spr('#b48cff', 26, 0);
      const toCam = camera.position.clone().sub(center).setY(0).normalize(), at = center.clone().addScaledVector(toCam, 6).setY(10);
      crack.position.copy(at); crack.lookAt(at.clone().add(toCam)); scene.add(crack); halo.position.copy(at);
      const ghosts = [];
      const pickG = [L.civic.hall, ...L.houses.slice(0, 40).filter(() => rnd() < 0.25).map((H) => H.g)].filter(Boolean).slice(0, 10);
      for (const src of pickG) { const g = src.clone(); g.traverse((o) => { if (o.isMesh) { o.material = ghostMat; o.userData.shared = true; } }); g.position.add(v3((rnd() - 0.5) * 2, 0.4, (rnd() - 0.5) * 2)); g.rotation.y += (rnd() - 0.5) * 0.6; L.g.add(g); ghosts.push(g); }
      for (let i = 0; i < 3; i++) later(i * 300, () => ring(center.clone().setY(4 + i * 4), '#b48cff', 12, 1800));
      run(9000, (u, ms) => { const s = Math.sin(u * Math.PI); crack.material.opacity = Math.min(1, s * 1.6); crack.scale.set(0.4 + s * (1 + 0.4 * Math.sin(ms * 0.04)), 0.2 + s * 0.8, 1); halo.material.opacity = s * 0.8; ghostMat.opacity = s * (0.35 + 0.2 * Math.sin(ms * 0.03)); },
        () => { kill(crack); kill(halo); for (const g of ghosts) kill(g, true); ghostMat.opacity = 0; });
    }
    function beam(from, to, color, dur, width) {
      const d = to.clone().sub(from), m = new THREE.Mesh(new THREE.CylinderGeometry(width || 0.8, width || 0.8, 1, 10, 1, true), basic(color, 0, true));
      m.scale.y = d.length(); m.position.copy(from).addScaledVector(d, 0.5); m.quaternion.setFromUnitVectors(v3(0, 1, 0), d.clone().normalize()); scene.add(m);
      run(dur, (u) => { m.material.opacity = 0.8 * Math.sin(u * Math.PI); }, () => kill(m));
    }
    // nhiễu sóng: ô vuông màu chớp tắt trên thành, đèn tắt từng cơn
    function glitch(L, colors, dur) {
      const tiles = [];
      for (let i = 0; i < 34; i++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(1.2 + rnd() * 2.4, 0.6 + rnd() * 1.4), basic(colors[i % colors.length], 0.8, true)); m.position.copy(cityPt(L, 22)).setY(2 + rnd() * 14); m.lookAt(camera.position); m.visible = false; scene.add(m); tiles.push(m); }
      run(dur || 8000, () => { for (const t of tiles) { t.visible = rnd() < 0.35; t.lookAt(camera.position); } L.dark = rnd() < 0.5 ? now() + 300 : 0; }, () => { tiles.forEach((t) => kill(t)); L.dark = 0; });
    }
    function aurora(L) {
      const bands = [];
      ['#ff4d6d', '#7fffb0', '#b48cff'].forEach((col, i) => { const g = new THREE.PlaneGeometry(60, 10, 40, 1), m = new THREE.Mesh(g, basic(col, 0, true)); m.position.copy(L.center).setY(30 + i * 5); m.rotation.y = rnd() * TAU; scene.add(m); bands.push({ m, g, base: g.attributes.position.array.slice(), i }); });
      run(10000, (u, ms) => { const f = Math.min(1, u * 5, (1 - u) * 5); for (const B of bands) { const p = B.g.attributes.position; for (let k = 0; k < p.count; k++) p.setZ(k, Math.sin(B.base[k * 3] * 0.15 + ms * 0.0015 + B.i) * 4); p.needsUpdate = true; B.m.material.opacity = 0.45 * f; } if (rnd() < 0.05) L.dark = now() + 400; }, () => { bands.forEach((B) => kill(B.m)); L.dark = 0; });
    }
    function robots(L) {
      const k = new F.FigKit(); F.soldierShape(k, 'melee', 7, L.ter);
      const geo = k.bake(), mat = F.figMaterial(), N = 10, m = new THREE.InstancedMesh(geo, mat, N);
      geo.setAttribute('anim', new THREE.InstancedBufferAttribute(new Float32Array(N * 4), 4));
      for (const a of ['cA', 'cB', 'cC', 'cD']) geo.setAttribute(a, new THREE.InstancedBufferAttribute(new Float32Array(N * 3).fill(1), 3));
      m.frustumCulled = false; scene.add(m);
      const set = { meshes: [m], cap: N, e: 7, n: [0] }, from = cityPt(L, 26), to = L.center.clone(), eyes = [];
      for (let i = 0; i < N; i++) eyes.push(spr('#ff3030', 1.2, 0.9));
      run(11000, (u, ms) => {
        F.crowdBegin(set);
        const k2 = Math.min(1, u * 1.5), side = v3(-(to.z - from.z), 0, to.x - from.x).normalize();
        for (let i = 0; i < N; i++) {
          const p = from.clone().lerp(to, k2).addScaledVector(side, (i % 5 - 2) * 1.6).add(v3(0, 0, Math.floor(i / 5) * 1.6 - 0.8));
          F.crowdPut(set, 0, p, Math.atan2(to.x - from.x, to.z - from.z), k2 < 1 ? 1 : 0, k2 >= 1 ? 1 : 0, i * 13, 1.5, ['#ff3030', '#5d6670', '#ff3030', '#9aa3ad']);
          eyes[i].position.copy(p).setY(1.6);
        }
        F.crowdEnd(set);
        if (k2 >= 1 && rnd() < 0.08) flash(to.clone().add(v3((rnd() - 0.5) * 8, 1.5, (rnd() - 0.5) * 8)), 3, '#ff4d4d');
      }, () => { kill(m); eyes.forEach((e) => kill(e)); });
    }
    function drones(L) {
      const N = 40, geo = new THREE.BoxGeometry(0.5, 0.18, 0.5), m = new THREE.InstancedMesh(geo, new THREE.MeshBasicMaterial({ color: '#7ff0ff' }), N), o = new THREE.Object3D(), seeds = [];
      m.frustumCulled = false; scene.add(m);
      for (let i = 0; i < N; i++) seeds.push({ a: rnd() * TAU, r: 6 + rnd() * 14, h: 14 + rnd() * 8, dive: 0.45 + rnd() * 0.45, t: cityPt(L, 24), hit: false });
      run(10000, (u, ms) => {
        for (let i = 0; i < N; i++) {
          const s = seeds[i];
          if (u < s.dive) { const a = s.a + ms * 0.002; o.position.copy(L.center).add(v3(Math.cos(a) * s.r, s.h + Math.sin(ms * 0.01 + i), Math.sin(a) * s.r)); }
          else { const k = Math.min(1, (u - s.dive) * 6), a = s.a + s.dive * 10 * 0.002 * 1000; o.position.copy(L.center).add(v3(Math.cos(a) * s.r, s.h, Math.sin(a) * s.r)).lerp(s.t, k); if (k >= 1 && !s.hit) { s.hit = true; if (i % 4 === 0) explosion(s.t, 1.5); else flash(s.t.clone().setY(1), 3, '#ff8a3d'); } if (s.hit) o.position.y = -50; }
          o.updateMatrix(); m.setMatrixAt(i, o.matrix);
        }
        m.instanceMatrix.needsUpdate = true;
      }, () => kill(m));
    }
    // gai san hô của vật chất sống mọc tràn ra phố
    function growth(L) {
      const spikes = [];
      for (let i = 0; i < 22; i++) { const m = new THREE.Mesh(new THREE.ConeGeometry(0.7 + rnd() * 0.6, 1, 6), lam(i % 3 ? '#eef3f7' : '#d5f3fb')); m.geometry.translate(0, 0.5, 0); m.position.copy(cityPt(L, 24)); m.scale.set(1, 0.01, 1); scene.add(m); spikes.push({ m, h: 3 + rnd() * 6, d: rnd() * 0.4 }); }
      run(42000, (u) => { for (const s of spikes) { const g = Math.min(1, Math.max(0, (u - s.d * 0.1) * 6)), f = u > 0.85 ? (1 - u) / 0.15 : 1; s.m.scale.y = Math.max(0.01, s.h * g * f); } }, () => spikes.forEach((s) => kill(s.m)));
    }
    function ascend(L) {
      beam(L.center.clone().setY(0), L.center.clone().setY(150), '#fff6dc', 6000, 3);
      const motes = [];
      for (let i = 0; i < 36; i++) { const s = spr('#fff3c4', 1 + rnd(), 0); s.position.copy(cityPt(L, 22)).setY(1); motes.push({ s, v: 3 + rnd() * 5, d: rnd() * 0.4 }); }
      run(8000, (u) => { for (const m of motes) { const k = Math.max(0, u - m.d); m.s.position.y = 1 + k * m.v * 8; m.s.material.opacity = Math.sin(Math.min(1, k * 1.4) * Math.PI) * 0.9; } }, () => motes.forEach((m) => kill(m.s)));
    }
    function gravity(L) {
      const bits = [];
      for (let i = 0; i < 30; i++) { const m = new THREE.Mesh(new THREE.BoxGeometry(0.4 + rnd(), 0.3 + rnd() * 0.6, 0.4 + rnd()), lam(['#c9b6ff', '#8a8174', '#dfe3e8', '#6d5139'][i % 4])); const p = cityPt(L, 24); m.position.copy(p).setY(0.3); scene.add(m); bits.push({ m, y0: 0.3, top: 10 + rnd() * 16, s: rnd() * 0.2 }); }
      run(9000, (u) => { for (const b of bits) { const up = u < 0.7 ? Math.min(1, (u - b.s * 0.3) * 2.5) : Math.max(0, 1 - (u - 0.7) / 0.08); b.m.position.y = b.y0 + Math.max(0, up) * b.top; b.m.rotation.x += 0.03; b.m.rotation.z += 0.02; } if (u > 0.7 && u < 0.72) shake(500); }, () => bits.forEach((b) => kill(b.m)));
    }
    function torches(L) {
      const lights = [];
      for (let i = 0; i < 22; i++) { const s = spr('#ffb347', 1.6, 0.95); lights.push({ s, a: rnd() * TAU, r: 3 + rnd() * 7, w: 0.3 + rnd() * 0.6 }); }
      run(11000, (u, ms) => { for (const t of lights) { t.a += 0.006 * t.w; t.s.position.copy(L.center).add(v3(Math.cos(t.a) * t.r, 1.6 + Math.sin(ms * 0.02 + t.r) * 0.15, Math.sin(t.a) * t.r)); } if (!reduce && rnd() < 0.05) puff(L.center.clone().add(v3((rnd() - 0.5) * 10, 2, (rnd() - 0.5) * 10)), true, '#3a3a3a'); }, () => lights.forEach((t) => kill(t.s)));
    }
    function papers(p) {
      const ps = [];
      for (let i = 0; i < 30; i++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.35), basic('#f4f0e8')); m.position.copy(p).setY(3); scene.add(m); ps.push({ m, v: v3((rnd() - 0.5) * 3, 3 + rnd() * 3, (rnd() - 0.5) * 3) }); }
      run(6000, (u) => { for (const q of ps) { q.v.y -= 0.05; q.m.position.addScaledVector(q.v, 0.016); q.m.rotation.x += 0.1; q.m.rotation.y += 0.07; if (q.m.position.y < 0.1) q.m.position.y = 0.1; } }, () => ps.forEach((q) => kill(q.m)));
    }
    function redtide(L) {
      const p = L.world(L.harbor).addScaledVector(inwardW(L), 12).setY(SEA_Y + 0.08), m = new THREE.Mesh(new THREE.CircleGeometry(11, 32), basic('#b0283a', 0)); m.rotation.x = -Math.PI / 2; m.position.copy(p); m.renderOrder = 3; scene.add(m);
      const fish = [];
      for (let i = 0; i < 14; i++) { const s = spr('#f4f4f4', 0.8, 0.8, true); s.position.copy(p).add(v3((rnd() - 0.5) * 16, 0.1, (rnd() - 0.5) * 16)); fish.push(s); }
      run(40000, (u) => { m.material.opacity = 0.55 * Math.min(1, u * 8, (1 - u) * 4); for (const f of fish) f.material.opacity = 0.8 * Math.min(1, (1 - u) * 4); }, () => { kill(m); fish.forEach((f) => kill(f)); });
    }
    function rocketCrash(L) {
      const g = new THREE.Group(), b = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 5, 10), lam('#f4f6f8')); b.position.y = 2.5; g.add(b);
      const n = new THREE.Mesh(new THREE.ConeGeometry(0.6, 1.6, 10), lam('#e05a6a')); n.position.y = 5.8; g.add(n); scene.add(g);
      const fl = spr('#ffb347', 5, 0.9), start = L.world(L.siloPos || v3(0, 0, 0)), top = start.clone().setY(45).add(v3((rnd() - 0.5) * 20, 0, (rnd() - 0.5) * 20)), end = dmgPt(L);
      run(5200, (u) => { const p = u < 0.5 ? start.clone().lerp(top, u * 2) : top.clone().lerp(end, (u - 0.5) * 2 * ((u - 0.5) * 2)); g.position.copy(p); g.rotation.z = u < 0.5 ? 0 : Math.PI * (u - 0.5) * 2; fl.position.copy(p); if (!reduce && rnd() < 0.5) puff(p.clone(), false, '#e8e8e8'); }, () => { kill(g); kill(fl); explosion(end, 4); });
    }
    function burst(L) { // nước phun ra từ đập vỡ
      const a = L.oa + (rnd() - 0.5), src = L.world(v3(Math.cos(a) * 30, 0, Math.sin(a) * 30)), drops = [];
      for (let i = 0; i < 40; i++) { const s = spr('#8fd3ee', 1.4, 0.9); s.position.copy(src).setY(4); drops.push({ s, v: v3((L.center.x - src.x) * 0.02 + (rnd() - 0.5) * 2, 4 + rnd() * 4, (L.center.z - src.z) * 0.02 + (rnd() - 0.5) * 2) }); }
      run(3500, () => { for (const d of drops) { d.v.y -= 0.18; d.s.position.addScaledVector(d.v, 0.05); if (d.s.position.y < 0.2) d.s.position.y = 0.2; } }, () => drops.forEach((d) => kill(d.s)));
    }

    /* =============== Mỗi kịch bản một cảnh =============== */
    const godFx = god3d && god3d.fxs ? god3d.fxs : {};
    const g3 = (name, L, days) => { if (godFx[name]) try { godFx[name](L, { city: L.i, day: W.day, days: days || 10, firms: [] }); } catch (err) { /* hình ảnh của thần hỏng thì bỏ qua */ } };
    const LAND_DINO = { plains: ['sauropod', 'tri'], forest: ['trex', 'raptor'], mountain: ['tri', 'raptor'], tundra: ['mammoth'], coast: ['croc', 'raptor'], desert: ['raptor'] };
    const SCENE = {
      meteor: (L) => meteors(L, 10, false),
      impact: (L) => meteors(L, 1, true),
      kraken: (L) => kraken(L),
      eclipse: () => eclipse(),
      stampede: (L) => herd(L, LAND_DINO[L.ter], 6, 9000),
      pteros: (L) => flyers(L, 'ptero', 6),
      predators: (L) => herd(L, W.cities[L.i].era === 0 ? ['raptor'] : ['wolf'], 6, 7000, false),
      wildfire: (L) => wildfire(L, false),
      sandstorm: (L) => { particles(L, '#d9a46e', 1200, 0.9, 'sweep', 10000); haze(L, '#d9a46e', 0.45, 10000); },
      avalanche: (L) => avalanche(L),
      sinkhole: (L) => sinkhole(L),
      locusts: (L) => particles(L, '#3a2f1a', 900, 0.55, 'swarm', 11000),
      flashflood: (L) => { g3('flood', L, 8); ring(L.center.clone().setY(0.5), '#8fd3ee', 22, 2000); },
      frost: (L) => { haze(L, '#e8f6ff', 0.3, 14000); particles(L, '#ffffff', 900, 0.45, 'fall', 14000); },
      miasma: (L) => { haze(L, '#7fd16b', 0.22, 12000); particles(L, '#9fe07a', 500, 1.2, 'drift', 12000); },
      heat: (L) => { g3('drought', L, 12); haze(L, '#ffb36b', 0.18, 12000); },
      plague: (L) => g3('plague', L, 12),
      riot: (L) => { torches(L); ring(L.center.clone().setY(0.4), '#ff6b5a', 14, 1800); },
      pirates: (L) => ships(L, 'pirate'),
      ghostship: (L) => ships(L, 'ghost'),
      greatfire: (L) => wildfire(L, true),
      assassin: (L) => { ring(L.center.clone().setY(0.4), '#8a1a1a', 10, 2200); flash(L.center.clone().setY(6), 12, '#ff3030'); },
      mold: (L) => { for (const [, o] of L.firmObj) if (o.kind === 'farm') smoke(L.world(o.g.position).setY(1.5), 6, '#7a8a5a', 3); haze(L, '#8a9a6a', 0.12, 8000); },
      redtide: (L) => redtide(L),
      mine: (L) => { const p = L.world(L.minePos); smoke(p, 24, '#8a7a68', 6); crater(p, 3, 30000); shake(500); },
      dam: (L) => { burst(L); later(1200, () => g3('flood', L, 10)); },
      blast: (L) => { const p = dmgPt(L); explosion(p, 5); later(400, () => explosion(p.clone().add(v3(2, 0, 1)), 3)); },
      smog: (L) => { haze(L, '#8a7a5a', 0.38, 14000); particles(L, '#6b5a45', 600, 1.4, 'drift', 14000); },
      crash: (L) => { const p = L.world(L.bankPos); ring(p.clone().setY(0.4), '#ff4d4d', 10, 2200); papers(p); },
      blackout: (L) => { L.dark = now() + 12000; for (let i = 0; i < 6; i++) later(i * 300, () => flash(cityPt(L, 20).setY(5), 3, '#bfe6ff')); },
      airraid: (L) => bombRun(L, '#5d6670', 0),
      meltdown: (L) => { haze(L, '#7fff7f', 0.25, 16000); flash(L.center.clone().setY(8), 30, '#9bff9b'); },
      rocketcrash: (L) => rocketCrash(L),
      cyber: (L) => glitch(L, ['#ff3060', '#30ffd0', '#7ff0ff'], 9000),
      robots: (L) => robots(L),
      drones: (L) => drones(L),
      aurora: (L) => aurora(L),
      nano: (L) => { particles(L, '#cfd6dd', 1100, 0.6, 'sweep', 10000); const p = wildPt(L).sub(L.center); later(9000, () => lands3d.kit.clearTrees(L, p.x, p.z, 10)); },
      overgrowth: (L) => growth(L),
      flare: (L) => { beam(v3(0, 74, 0), L.center.clone().setY(2), '#ffb347', 3500, 2.5); later(1500, () => flash(L.center.clone().setY(3), 40, '#ffd27a')); },
      rift: (L) => rift(L),
      portal: (L) => portal(L, 'dinos', '#b48cff'),
      gravity: (L) => gravity(L),
      ascend: (L) => ascend(L),
    };
    function play(fx) {
      if (reduce) return;
      const L = lands[fx.city];
      if (!L) return;
      if (fx.key === 'airwar') { const Lw = lands[fx.from]; if (Lw) dogfight(Lw, L, factionColor(fx.win), factionColor(fx.lose)); return; }
      if (fx.key === 'portalwar') { portal(L, 'troops', factionColor(fx.by)); return; }
      const f = SCENE[fx.key];
      if (!f) return;
      ripple(L.center.clone().setY(0.5), '#ff6b5a');
      try { f(L); } catch (err) { console.error('chaos3d', fx.key, err); } // một cảnh hỏng không làm hỏng cả bể
    }
    function update() {
      const n = now();
      for (let i = active.length - 1; i >= 0; i--) {
        const e = active[i], ms = n - e.t0, u = Math.min(1, ms / e.dur);
        try { e.update(u, ms); } catch (err) { /* bỏ qua khung lỗi */ }
        if (u >= 1) { active.splice(i, 1); try { e.end(); } catch (err) { /* bỏ */ } }
      }
    }
    return { play, update, scenes: Object.keys(SCENE), get active() { return active.length; } };
  }
  root.Chaos3D = { create };
})(typeof window !== 'undefined' ? window : globalThis);
