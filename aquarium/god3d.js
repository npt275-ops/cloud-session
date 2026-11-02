/* Bể Kính — bàn tay của vị thần: hình ảnh thiên tai và ban phước trên sáu miền đất.
 * Mỗi lần thần ra tay bắt đầu bằng một chạm sáng trên vách kính phía trên miền đất, rồi đến tai hoạ hay phép lành. */
(function (root) {
  'use strict';
  const TAU = Math.PI * 2;

  function create(K) {
    const { THREE, scene, Sim, W, lands3d, war3d, glowTex, puff, label3d, reduce } = K;
    const { Kit, UBOX, UCYL, UCONE, ICO, DOD, TORUS, bodyMat, clearTrees } = lands3d.kit;
    const lands = lands3d.lands, v3 = (x, y, z) => new THREE.Vector3(x, y, z);
    const active = [];
    const sfx = (name, a) => { if (K.audio && K.audio.on && K.audio[name]) K.audio[name](a); };
    const firmGroup = (L, id) => { const o = L.firmObj.get(id); return o ? o.g : null; };
    const sprite = (color, size, add) => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color, transparent: true, opacity: 0, depthWrite: false, blending: add === false ? THREE.NormalBlending : THREE.AdditiveBlending })); s.scale.setScalar(size); scene.add(s); return s; };
    const kill = (o) => { if (!o) return; scene.remove(o); if (o.parent) o.parent.remove(o); o.traverse && o.traverse((x) => { if (x.isMesh || x.isSprite) { if (x.geometry && !x.geometry.__keep) x.geometry.dispose(); if (x.material) x.material.dispose(); } }); };
    // vết nứt và đất khô: vẽ một lần lên canvas
    function crackTex(color, dense) {
      const c = document.createElement('canvas'); c.width = c.height = 256;
      const x = c.getContext('2d'); x.strokeStyle = color; x.lineCap = 'round';
      for (let n = 0; n < dense; n++) {
        let px = 128 + (Math.random() - 0.5) * 220, py = 128 + (Math.random() - 0.5) * 220, a = Math.random() * TAU;
        x.lineWidth = 1 + Math.random() * 2.5; x.beginPath(); x.moveTo(px, py);
        for (let k = 0; k < 9; k++) { a += (Math.random() - 0.5) * 1.3; px += Math.cos(a) * 12; py += Math.sin(a) * 12; x.lineTo(px, py); }
        x.stroke();
      }
      const t = new THREE.CanvasTexture(c); return t;
    }
    const TEX = {};
    function decal(L, tex, opacity, y, r) {
      const m = new THREE.Mesh(new THREE.CircleGeometry(r || lands3d.LAND_R - 0.6, 40), new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity, depthWrite: false }));
      m.rotation.x = -Math.PI / 2; m.position.copy(L.center).setY(y || 0.14); m.renderOrder = 3; scene.add(m); m.raycast = () => {};
      return m;
    }
    // chạm sáng trên vách kính, ngay phía trên miền đất
    function touch(L, color) {
      const D = K.dome, c = L.center, h = Math.sqrt(Math.max(0, D * D - c.x * c.x - c.z * c.z));
      const p = v3(c.x, h, c.z).normalize().multiplyScalar(D - 0.5);
      const s = sprite(color, 6);
      const ring = new THREE.Mesh(new THREE.RingGeometry(0.6, 1.2, 40), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.8, side: THREE.DoubleSide, depthWrite: false }));
      ring.position.copy(p); ring.lookAt(0, 0, 0); scene.add(ring); s.position.copy(p);
      active.push({ t0: now(), dur: 1600, update(u) { s.material.opacity = (1 - u) * 0.9; s.scale.setScalar(6 + u * 18); ring.scale.setScalar(1 + u * 22); ring.material.opacity = 0.8 * (1 - u); }, end() { kill(s); kill(ring); } });
    }
    const now = () => performance.now();
    const dayMs = () => (K.dayMs ? K.dayMs() : 670);
    // dựng tạm một nhà xưởng nghiêng sập, trả lại dáng cũ khi đã sửa xong
    const tilted = [];
    function collapse(L, ids, city) {
      for (const id of ids || []) {
        const g = firmGroup(L, id); if (!g || g.userData.fallen) continue;
        g.userData.fallen = { rz: g.rotation.z, sy: g.scale.y };
        g.rotation.z = (Math.random() - 0.5) * 0.5; g.scale.y = 0.45 + Math.random() * 0.2;
        tilted.push({ L, id, g, city });
        for (let k = 0; k < 4 && !reduce; k++) puff(g.getWorldPosition(v3(0, 0, 0)).add(v3((Math.random() - 0.5) * 3, 0.8 + Math.random(), (Math.random() - 0.5) * 3)), true, '#a89a86');
      }
    }
    function restoreFallen() {
      for (let i = tilted.length - 1; i >= 0; i--) {
        const t = tilted[i], c = W.cities[t.city], f = c.w ? c.w.firms.find((x) => x.id === t.id) : null;
        if (f && f.alive && (f.downUntil || 0) > W.day && t.g.parent) continue;
        if (t.g.userData.fallen) { t.g.rotation.z = t.g.userData.fallen.rz; t.g.scale.y = t.g.userData.fallen.sy; delete t.g.userData.fallen; }
        tilted.splice(i, 1);
      }
    }

    /* =============== Từng thiên tai =============== */
    function flood(L, fx) {
      const geo = new THREE.CircleGeometry(lands3d.LAND_R + 0.4, 48); geo.rotateX(-Math.PI / 2);
      const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: '#4f7f9c', transparent: true, opacity: 0.8, roughness: 0.15, metalness: 0.15, emissive: '#16303d', emissiveIntensity: 0.35, depthWrite: false }));
      m.position.copy(L.center).setY(-0.4); m.renderOrder = 2; scene.add(m); m.raycast = () => {};
      const hold = Math.min(14000, Math.max(5000, fx.days * dayMs()));
      if (K.doRain) K.doRain();
      sfx('surge', 4);
      collapse(L, (fx.firms || []).slice(0, 3), L.i);
      active.push({ t0: now(), dur: hold + 7000, update(u, ms) {
        const up = Math.min(1, ms / 2500), down = ms > hold ? Math.min(1, (ms - hold) / 6000) : 0;
        m.position.y = -0.4 + 1.25 * up * (1 - down) + Math.sin(ms * 0.002) * 0.05;
        m.material.opacity = 0.72 * (1 - down * 0.4);
        if (!reduce && Math.random() < 0.05 && down < 0.5) puff(L.center.clone().add(v3((Math.random() - 0.5) * 40, 1, (Math.random() - 0.5) * 40)), false, '#cfe3ec');
      }, end() {
        kill(m);
        const silt = decal(L, TEX.silt || (TEX.silt = crackTex('rgba(120,92,58,0.55)', 40)), 0.6, 0.13);
        active.push({ t0: now(), dur: 20000, update(u) { silt.material.opacity = 0.6 * (1 - u); }, end() { kill(silt); } });
      } });
    }
    function drought(L, fx) {
      const d = decal(L, TEX.dry || (TEX.dry = crackTex('rgba(90,62,30,0.8)', 70)), 0, 0.14);
      const haze = sprite('#e3c27a', lands3d.LAND_R * 2.6, false); haze.position.copy(L.center).setY(6);
      const hold = Math.min(16000, Math.max(6000, fx.days * dayMs()));
      active.push({ t0: now(), dur: hold, update(u, ms) {
        const a = Math.min(1, ms / 3000) * (u > 0.85 ? (1 - u) / 0.15 : 1);
        d.material.opacity = 0.75 * a; haze.material.opacity = 0.22 * a;
        if (!reduce && Math.random() < 0.06) puff(L.center.clone().add(v3((Math.random() - 0.5) * 44, 0.6, (Math.random() - 0.5) * 44)), false, '#d9b36b');
      }, end() { kill(d); kill(haze); } });
    }
    function quake(L, fx) {
      const base = L.g.position.clone(), big = !fx.after;
      if (K.shake) K.shake(big ? 2600 : 900);
      sfx('rumble', big ? 3.5 : 1.6);
      collapse(L, fx.firms, L.i);
      const cr = big ? decal(L, TEX.crack || (TEX.crack = crackTex('rgba(40,30,22,0.85)', 26)), 0.85, 0.15) : null;
      for (let k = 0; k < (big ? 14 : 5) && !reduce; k++) puff(L.center.clone().add(v3((Math.random() - 0.5) * 46, 0.8, (Math.random() - 0.5) * 46)), true, '#b9ab98');
      active.push({ t0: now(), dur: big ? 3400 : 1400, update(u) { const a = (1 - u) * (big ? 0.45 : 0.18); if (!reduce) L.g.position.set(base.x + (Math.random() - 0.5) * a, base.y + (Math.random() - 0.5) * a * 0.5, base.z + (Math.random() - 0.5) * a); }, end() { L.g.position.copy(base); } });
      if (cr) active.push({ t0: now(), dur: 30000, update(u) { cr.material.opacity = 0.85 * (1 - u); }, end() { kill(cr); } });
      for (const bid of fx.bridges || []) { const B = lands3d.bridges[bid]; if (B && B.pa) for (let k = 0; k < 6; k++) puff(B.pa.clone().lerp(B.pb, Math.random()).setY(-1), true, '#8d8d8d'); }
    }
    function tornado(L, fx) {
      const g = new THREE.Group(); scene.add(g);
      const mat = new THREE.MeshStandardMaterial({ color: '#7d8590', transparent: true, opacity: 0.55, flatShading: true, roughness: 1, depthWrite: false, side: THREE.DoubleSide });
      const rings = [];
      for (let i = 0; i < 9; i++) { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.9 + i * 0.75, 0.6 + i * 0.7, 2.6, 10, 1, true), mat); m.position.y = 1.3 + i * 2.3; g.add(m); rings.push(m); }
      const debris = [];
      for (let i = 0; i < 26; i++) { const d = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.15, 0.3), new THREE.MeshStandardMaterial({ color: ['#8f6a46', '#6d6359', '#a8603e', '#5b9a52'][i % 4], flatShading: true })); g.add(d); debris.push({ d, a: Math.random() * TAU, r: 2 + Math.random() * 6, y: Math.random() * 18, w: 2 + Math.random() * 3 }); }
      const a0 = Math.random() * TAU, pts = [L.world(v3(Math.cos(a0) * 31, 0, Math.sin(a0) * 31))];
      for (const id of fx.firms || []) { const fg = firmGroup(L, id); if (fg) pts.push(fg.getWorldPosition(v3(0, 0, 0))); }
      pts.push(L.world(v3(Math.cos(a0 + Math.PI + 0.4) * 31, 0, Math.sin(a0 + Math.PI + 0.4) * 31)));
      const hit = new Set();
      sfx('gust', 7);
      active.push({ t0: now(), dur: 7500, update(u, ms) {
        const f = u * (pts.length - 1), i = Math.min(pts.length - 2, Math.floor(f)), s = f - i;
        g.position.copy(pts[i]).lerp(pts[i + 1], s); g.position.y = 0;
        const fade = u < 0.08 ? u / 0.08 : u > 0.9 ? (1 - u) / 0.1 : 1;
        mat.opacity = 0.55 * fade;
        rings.forEach((m, k) => { m.rotation.y = ms * 0.006 * (k % 2 ? 1 : -1.3); m.position.x = Math.sin(ms * 0.002 + k * 0.6) * 0.5 * (k / 8); });
        for (const d of debris) { d.a += 0.08 * d.w; d.d.position.set(Math.cos(d.a) * d.r, (d.y + ms * 0.004 * d.w) % 20, Math.sin(d.a) * d.r); d.d.rotation.set(d.a, d.a * 1.3, 0); d.d.visible = fade > 0.3; }
        if (!reduce && Math.random() < 0.4) puff(g.position.clone().add(v3((Math.random() - 0.5) * 3, 0.4, (Math.random() - 0.5) * 3)), true, '#a89a86');
        for (const id of fx.firms || []) { if (hit.has(id)) continue; const fg = firmGroup(L, id); if (fg && fg.getWorldPosition(v3(0, 0, 0)).distanceTo(g.position) < 4) { hit.add(id); collapse(L, [id], L.i); } }
      }, end() { kill(g); } });
    }
    function plague(L, fx) {
      const clouds = [];
      for (let i = 0; i < 9; i++) { const s = sprite('#9fe07a', 10 + Math.random() * 8, false); clouds.push({ s, a: Math.random() * TAU, r: 4 + Math.random() * 18, y: 2 + Math.random() * 4, w: (Math.random() - 0.5) * 0.0002 }); }
      const hold = Math.min(18000, Math.max(7000, fx.days * dayMs()));
      active.push({ t0: now(), dur: hold, update(u, ms) {
        const a = Math.min(1, ms / 2500) * (u > 0.8 ? (1 - u) / 0.2 : 1);
        for (const c of clouds) { c.a += c.w * 16; c.s.position.copy(L.center).add(v3(Math.cos(c.a) * c.r, c.y + Math.sin(ms * 0.001 + c.r) * 0.6, Math.sin(c.a) * c.r)); c.s.material.opacity = 0.28 * a; }
      }, end() { for (const c of clouds) kill(c.s); } });
    }
    function volcano(L, fx) {
      const a = Math.atan2(L.out.z, L.out.x) - 0.55, lp = v3(Math.cos(a) * 18, 0, Math.sin(a) * 18), P = L.world(lp);
      clearTrees(L, lp.x, lp.z, 8);
      const k = new Kit();
      k.cone('#4a403a', 0, 0, 0, 8, 11, 10); k.cone('#3a322e', 0, 7.2, 0, 3.4, 3.9, 10); k.cyl('#ff6a1a', 0, 10.6, 0, 1.4, 0.3, 10, true);
      for (let i = 0; i < 4; i++) { const b = (i / 4) * TAU + 0.3; k.add(UBOX(), '#ff7a2a', Math.cos(b) * 3.2, 5.0, Math.sin(b) * 3.2, 0.5, 0.12, 6.6, -b + Math.PI / 2, 0.85, 0, true); }
      const { body, lit } = k.bake(), g = new THREE.Group();
      const bm = new THREE.Mesh(body, bodyMat); bm.castShadow = true; g.add(bm);
      const lavaMat = new THREE.MeshStandardMaterial({ vertexColors: true, emissive: '#ff5a10', emissiveIntensity: 1.2, flatShading: true });
      if (lit) g.add(new THREE.Mesh(lit, lavaMat));
      g.position.copy(P); g.scale.set(1, 0.01, 1); scene.add(g);
      const glow = sprite('#ff7a2a', 16); glow.position.copy(P).setY(11);
      if (K.shake) K.shake(2400);
      sfx('rumble', 4.5);
      collapse(L, fx.firms, L.i);
      const hold = Math.min(24000, Math.max(10000, (fx.days || 120) * dayMs()));
      const ash = decal(L, TEX.ash || (TEX.ash = crackTex('rgba(70,70,70,0.6)', 90)), 0, 0.16);
      let nextBomb = 0;
      active.push({ t0: now(), dur: hold, update(u, ms) {
        g.scale.y = Math.min(1, ms / 2500);
        const erupt = ms < 9000 ? 1 : 0.25;
        glow.material.opacity = (0.55 + 0.25 * Math.sin(ms * 0.01)) * erupt + 0.15;
        lavaMat.emissiveIntensity = 0.8 + 0.6 * erupt;
        ash.material.opacity = Math.min(0.55, ms / 6000) * (u > 0.85 ? (1 - u) / 0.15 : 1);
        if (!reduce && Math.random() < 0.5 * erupt) puff(P.clone().setY(11 + Math.random() * 2), true, Math.random() < 0.5 ? '#3a3a3a' : '#5a5a5a');
        if (!reduce && erupt === 1 && ms > nextBomb) { nextBomb = ms + 220; K.shot && K.shot(P.clone().setY(11), L.center.clone().add(v3((Math.random() - 0.5) * 40, 0.5, (Math.random() - 0.5) * 40)), '#ff6a1a', 0.35, 9, 1400, 'boom'); }
      }, end() { kill(glow); kill(ash); active.push({ t0: now(), dur: 60000, update(u) { if (!reduce && Math.random() < 0.03) puff(P.clone().setY(11), true, '#6a6a6a'); }, end() {} }); } });
      L.volcanoG = g;
    }
    function tsunami(L) {
      const z = war3d.zoneC(L.i), shore = L.world(L.dockPos).setY(0), dir = shore.clone().sub(z).setY(0).normalize();
      const start = z.clone().addScaledVector(dir, -8).setY(war3d.SEA_Y);
      const geo = new THREE.CylinderGeometry(1, 1, 30, 16, 1, false, 0, Math.PI); geo.rotateZ(Math.PI / 2);
      const wave = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: '#3f8fb8', transparent: true, opacity: 0.85, emissive: '#0c3b52', emissiveIntensity: 0.4, flatShading: true }));
      const foam = new THREE.Mesh(new THREE.BoxGeometry(30, 0.5, 1.2), new THREE.MeshStandardMaterial({ color: '#f4fbff', flatShading: true }));
      const g = new THREE.Group(); g.add(wave); g.add(foam); scene.add(g);
      g.lookAt(g.position.clone().add(v3(-dir.z, 0, dir.x))); g.rotation.y = Math.atan2(dir.x, dir.z) + Math.PI / 2;
      sfx('surge', 4);
      let crashed = false;
      active.push({ t0: now(), dur: 4200, update(u) {
        const s = Math.min(1, u / 0.75);
        g.position.copy(start).lerp(shore, s);
        const h = u < 0.75 ? 0.5 + 6.5 * s : 7 * (1 - (u - 0.75) / 0.25);
        wave.scale.set(1, Math.max(0.1, h), Math.max(0.1, h * 0.7)); foam.position.y = h * 0.95; foam.scale.y = Math.max(0.2, h / 7);
        if (u > 0.75 && !crashed) { crashed = true; if (K.shake) K.shake(1200); for (let i = 0; i < 18 && !reduce; i++) puff(shore.clone().add(v3((Math.random() - 0.5) * 22, 1 + Math.random() * 3, (Math.random() - 0.5) * 22)), false, '#f4fbff'); flood(L, { days: 2, firms: [] }); }
      }, end() { kill(g); } });
    }
    function lightning(L, fx) {
      const target = (fx.firms || []).map((id) => firmGroup(L, id)).filter(Boolean)[0];
      const to = target ? target.getWorldPosition(v3(0, 0, 0)) : L.center.clone();
      const top = to.clone().setY(95), pts = [];
      for (let i = 0; i <= 12; i++) { const p = top.clone().lerp(to, i / 12); if (i && i < 12) { p.x += (Math.random() - 0.5) * 6; p.z += (Math.random() - 0.5) * 6; } pts.push(p); }
      const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: '#f4fbff', transparent: true }));
      scene.add(line);
      const fl = sprite('#e8f4ff', 30); fl.position.copy(to).setY(6);
      sfx('thunder');
      active.push({ t0: now(), dur: 900, update(u) { const on = Math.sin(u * 30) > 0; line.material.opacity = on ? 1 : 0.15; fl.material.opacity = on ? 0.9 * (1 - u) : 0.1; }, end() { kill(line); kill(fl); } });
    }

    /* =============== Ban phước =============== */
    function rainbow(L) {
      if (K.doRain) K.doRain();
      const g = new THREE.Group(), cols = ['#ff5a5a', '#ffa64d', '#ffe066', '#7be08a', '#5fc6e6', '#6f7fe0', '#b07fe0'];
      cols.forEach((c, i) => { const m = new THREE.Mesh(new THREE.TorusGeometry(24 - i * 0.7, 0.35, 6, 48, Math.PI), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0, depthWrite: false })); g.add(m); });
      g.position.copy(L.center).setY(0); g.rotation.y = Math.atan2(L.out.x, L.out.z); scene.add(g);
      sfx('bless');
      active.push({ t0: now(), dur: 11000, update(u) { const a = u < 0.2 ? u / 0.2 : u > 0.75 ? (1 - u) / 0.25 : 1; g.children.forEach((m) => { m.material.opacity = 0.42 * a; }); }, end() { kill(g); } });
    }
    function sparkles(L, color, n, rise) {
      const ss = [];
      for (let i = 0; i < n; i++) { const s = sprite(color, 1.6 + Math.random() * 1.4); ss.push({ s, p: L.center.clone().add(v3((Math.random() - 0.5) * 48, Math.random() * 2, (Math.random() - 0.5) * 48)), d: Math.random() * 1500 }); }
      sfx('bless');
      active.push({ t0: now(), dur: 6500, update(u, ms) { for (const x of ss) { const k = Math.max(0, (ms - x.d) / 5000); x.s.position.copy(x.p).setY(x.p.y + k * rise); x.s.material.opacity = k > 0 && k < 1 ? Math.sin(k * Math.PI) * 0.9 : 0; } }, end() { for (const x of ss) kill(x.s); } });
    }
    function beam(L, fx) {
      const fg = fx.firm != null ? firmGroup(L, fx.firm) : null, to = fg ? fg.getWorldPosition(v3(0, 0, 0)) : L.center.clone();
      const m = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 2.2, 110, 16, 1, true), new THREE.MeshBasicMaterial({ color: '#fff3c4', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
      m.position.copy(to).setY(55); scene.add(m);
      sfx('chime');
      active.push({ t0: now(), dur: 3600, update(u) { m.material.opacity = Math.sin(u * Math.PI) * 0.55; m.scale.x = m.scale.z = 1 + u * 0.4; }, end() { kill(m); } });
      sparkles(L, '#fff3c4', 14, 8);
    }
    function truceRing(L) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(lands3d.LAND_R + 2, 0.35, 8, 64), new THREE.MeshBasicMaterial({ color: '#f4fbff', transparent: true, opacity: 0.9, depthWrite: false }));
      ring.rotation.x = Math.PI / 2; ring.position.copy(L.center).setY(1.5); scene.add(ring);
      const doves = [];
      for (let i = 0; i < 10; i++) { const d = new THREE.Mesh(new THREE.ConeGeometry(0.4, 1.2, 3), new THREE.MeshStandardMaterial({ color: '#ffffff', flatShading: true })); d.rotation.x = Math.PI / 2; scene.add(d); doves.push({ d, a: (i / 10) * TAU }); }
      sfx('bless');
      active.push({ t0: now(), dur: 6000, update(u) { ring.scale.setScalar(1 + u * 0.6); ring.material.opacity = 0.9 * (1 - u); for (const x of doves) { const r = 6 + u * 46; x.d.position.copy(L.center).add(v3(Math.cos(x.a) * r, 8 + u * 22 + Math.sin(u * 20 + x.a) * 0.6, Math.sin(x.a) * r)); x.d.rotation.z = -x.a; } }, end() { kill(ring); for (const x of doves) kill(x.d); } });
    }

    /* =============== Những cỗ máy gõ lên kính từ bên trong =============== */
    let knockT = 0;
    function awakeKnock(t) {
      if (!W.god.awakened || t < knockT) return;
      knockT = t + 2600 + Math.random() * 3000;
      const L = lands[W.god.awakeCity]; if (!L) return;
      const D = K.dome, a = Math.atan2(L.center.z, L.center.x) + (Math.random() - 0.5) * 0.4, el = 0.25 + Math.random() * 0.5;
      const p = v3(Math.cos(a) * Math.cos(el), Math.sin(el), Math.sin(a) * Math.cos(el)).multiplyScalar(D - 0.6);
      const s = sprite('#7ff0ff', 3); s.position.copy(p);
      const ring = new THREE.Mesh(new THREE.RingGeometry(0.4, 0.7, 32), new THREE.MeshBasicMaterial({ color: '#7ff0ff', transparent: true, opacity: 0.9, side: THREE.DoubleSide, depthWrite: false }));
      ring.position.copy(p); ring.lookAt(0, 0, 0); scene.add(ring);
      if (K.audio && K.audio.on && K.audio.knock) K.audio.knock(1);
      active.push({ t0: now(), dur: 1400, update(u) { s.material.opacity = 0.9 * (1 - u); ring.scale.setScalar(1 + u * 10); ring.material.opacity = 0.9 * (1 - u); }, end() { kill(s); kill(ring); } });
    }

    function play(fx) {
      let L = lands[fx.city]; if (!L) return;
      // thần chạm vào một chỗ trên đảo: thiên tai lấy chỗ đó làm tâm (một bản sao của miền đất với tâm dời tới chỗ chạm)
      if (fx.at && (fx.at.x || fx.at.z)) { const P = Object.create(L); P.center = L.center.clone().add(v3(fx.at.x, 0, fx.at.z)); L = P; }
      const bad = Sim.POWERS[fx.key] ? Sim.POWERS[fx.key].kind === 'bad' : true;
      if (!fx.after) touch(L, bad ? '#ff9a7a' : '#fff3c4');
      ({ flood, drought, quake, tornado, plague, volcano, tsunami, fire: lightning, rain: rainbow,
        harvest: (L2) => sparkles(L2, '#ffd36b', 40, 10), enlighten: beam, heal: (L2) => sparkles(L2, '#bff5c8', 40, 14), truce: truceRing }[fx.key] || (() => {}))(L, fx);
    }
    function update(dt, t) {
      const n = now();
      for (let i = active.length - 1; i >= 0; i--) {
        const e = active[i], ms = n - e.t0, u = Math.min(1, ms / e.dur);
        try { e.update(u, ms); } catch (err) { u === u; }
        if (u >= 1) { active.splice(i, 1); try { e.end(); } catch (err) { /* hình ảnh hỏng thì bỏ qua */ } }
      }
      if (Math.random() < 0.02) restoreFallen();
      awakeKnock(n);
    }
    return { play, update, get active() { return active.length; }, fxs: { flood, drought, quake, tornado, plague, volcano, tsunami, lightning } };
  }
  root.God3D = { create };
})(typeof self !== 'undefined' ? self : this);
