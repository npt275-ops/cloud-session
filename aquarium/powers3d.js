/* Bể Kính — quyền năng của vị thần ngoài bể kính: hình ảnh của mười lăm phép.
 * Thần ra tay bằng chính hiệu ứng trên bể. Gõ, khoan lỗ thở, làm nứt, đập vỡ, vá kính; đổ thêm nước,
 * rút bớt nước, nghiêng bể; che đèn, kéo đèn lại gần, mở nắp; thả đồng xu, hạt giống, viên sỏi; lắc cả bể.
 * Dấu vết ở lại trên bể bao lâu còn hậu quả: vết nứt, lỗ vỡ với bầu trời tím và đếm ngược, lỗ thở, mặt biển dâng hạ,
 * bóng tối trên đảo bị che đèn, mặt trời nhân tạo sát đảo, cây khổng lồ, đồng xu cắm đất, viên sỏi trong hố. */
(function (root) {
  'use strict';
  const TAU = Math.PI * 2;

  function create(K) {
    const { THREE, scene, W, lands3d, war3d, god3d, chaos3d, puff, reduce, glowTex, camera } = K;
    const lands = lands3d.lands, DOME = K.dome, PR = chaos3d.prims, rnd = Math.random;
    const v3 = (x, y, z) => new THREE.Vector3(x, y, z), UP = v3(0, 1, 0);
    const now = () => performance.now();
    const sfx = (name, a) => { if (K.audio && K.audio.on && K.audio[name]) K.audio[name](a); };
    const shake = (ms) => { if (K.shake) K.shake(ms); };
    const active = [];
    const run = (dur, update, end) => active.push({ t0: now(), dur, update, end: end || (() => {}) });
    const later = (ms, fn) => run(ms, () => {}, fn);
    const clamp01 = (v) => Math.max(0, Math.min(1, v));
    const seg = (u, a, b) => clamp01((u - a) / (b - a));
    const ease = (u) => u * u * (3 - 2 * u);
    let holdUntil = 0;
    const kill = (o) => { if (!o) return; if (o.parent) o.parent.remove(o); o.traverse((x) => { if (x.geometry && !x.geometry.__keep) x.geometry.dispose(); if (x.material && !x.material.__keep) { if (x.material.map && !x.material.map.__keep) x.material.map.dispose(); x.material.dispose(); } }); };
    const keep = (o) => { o.__keep = true; return o; };
    function sprite(color, size, op, normal) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color, transparent: true, opacity: op == null ? 1 : op, depthWrite: false, blending: normal ? THREE.NormalBlending : THREE.AdditiveBlending })); s.scale.setScalar(size); scene.add(s); return s; }

    /* =============== Dò quanh một chỗ trên đảo: nhà, xưởng, đám cháy gần nhất =============== */
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


    /* =============== Mặt vòm kính =============== */
    const azOf = (L) => Math.atan2(L.center.z, L.center.x);
    const domePt = (a, el, r) => v3(Math.cos(a) * Math.cos(el), Math.sin(el), Math.sin(a) * Math.cos(el)).multiplyScalar(r || DOME);
    const GLASS_EL = 0.3, OUTER_EL = 0.5; // chỗ chạm kính: vách vòm thấp, ngay sau mép ngoài của đảo
    const glassOf = (L) => domePt(azOf(L), GLASS_EL, DOME - 0.2);
    const domeAbove = (x, z) => v3(x, Math.sqrt(Math.max(1, DOME * DOME - x * x - z * z)), z);
    // vệt tròn mềm: tâm đặc, mép tan dần (bóng tối, hơi nóng, trời tím)
    const SOFT = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'), g = x.createRadialGradient(64, 64, 4, 64, 64, 64); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.55, 'rgba(255,255,255,0.75)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128); const t = new THREE.CanvasTexture(c); t.__keep = true; return t; })();
    function softDisc(L, color, r, y, additive) {
      const m = new THREE.Mesh(new THREE.CircleGeometry(r, 40), new THREE.MeshBasicMaterial({ map: SOFT, color, transparent: true, opacity: 0, depthWrite: false, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending }));
      m.material.map.__keep = true; m.rotation.x = -Math.PI / 2; m.position.copy(L.center).setY(y); m.renderOrder = 5; m.userData.noFade = true; m.raycast = () => {}; scene.add(m);
      return m;
    }
    function softHaze(p, color, size) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: SOFT, color, transparent: true, opacity: 0, depthWrite: false })); s.material.map.__keep = true;
      s.scale.set(size, size * 0.6, 1); s.position.copy(p); s.renderOrder = 5; s.userData.noFade = true; scene.add(s); return s;
    }
    // vệt mảnh nằm trên mặt vòm (đường nứt, viền lỗ vỡ): mỗi cặp điểm thành một dải hẹp
    function ribbons(pairs, widths, color, op) {
      const pos = [], s = v3(0, 0, 0), d = v3(0, 0, 0), n = v3(0, 0, 0);
      for (let i = 0; i < pairs.length; i += 2) {
        const a = pairs[i], b = pairs[i + 1], w = widths[i / 2] / 2;
        d.copy(b).sub(a); n.copy(a).add(b).normalize(); s.crossVectors(d, n).normalize().multiplyScalar(w);
        pos.push(a.x + s.x, a.y + s.y, a.z + s.z, a.x - s.x, a.y - s.y, a.z - s.z, b.x + s.x * 0.6, b.y + s.y * 0.6, b.z + s.z * 0.6);
        pos.push(b.x + s.x * 0.6, b.y + s.y * 0.6, b.z + s.z * 0.6, a.x - s.x, a.y - s.y, a.z - s.z, b.x - s.x * 0.6, b.y - s.y * 0.6, b.z - s.z * 0.6);
      }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: op, depthWrite: false, side: THREE.DoubleSide }));
      m.renderOrder = 6; m.userData.noFade = true; m.raycast = () => {}; scene.add(m);
      return m;
    }
    function crackMesh(center, n, reach, seed, color, op) {
      const nrm = center.clone().normalize(), t1 = v3(0, 0, 0).crossVectors(nrm, UP).normalize(), t2 = v3(0, 0, 0).crossVectors(nrm, t1).normalize();
      let s = seed % 2147483647 || 7;
      const r = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
      const onDome = (p) => p.normalize().multiplyScalar(DOME - 0.15);
      const pairs = [], widths = [];
      for (let b = 0; b < n; b++) {
        let a = (b / n) * TAU + r() * 0.6, p = center.clone(), w = 1.3;
        const steps = 4 + Math.floor(r() * 6);
        for (let k = 0; k < steps; k++) {
          a += (r() - 0.5) * 0.9;
          const len = reach * (0.5 + r() * 0.8), q = onDome(p.clone().addScaledVector(t1, Math.cos(a) * len).addScaledVector(t2, Math.sin(a) * len));
          pairs.push(p, q); widths.push(w);
          if (r() < 0.3) { const a2 = a + (r() < 0.5 ? 1 : -1) * (0.6 + r() * 0.7), q2 = onDome(q.clone().addScaledVector(t1, Math.cos(a2) * len * 0.8).addScaledVector(t2, Math.sin(a2) * len * 0.8)); pairs.push(q, q2); widths.push(w * 0.55); }
          p = q; w *= 0.8;
        }
      }
      return ribbons(pairs, widths, color || '#f4fbff', op == null ? 0.88 : op);
    }
    // lỗ vỡ: mảng tối lởm chởm, viền mảnh kính sáng
    function holeMesh(center, R, seed) {
      const nrm = center.clone().normalize(), t1 = v3(0, 0, 0).crossVectors(nrm, UP).normalize(), t2 = v3(0, 0, 0).crossVectors(nrm, t1).normalize();
      let s = seed || 11; const r = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
      const N = 22, ring = [];
      for (let i = 0; i < N; i++) { const a = (i / N) * TAU, rr = R * (i % 2 ? 0.55 + r() * 0.3 : 0.9 + r() * 0.35); ring.push(center.clone().addScaledVector(t1, Math.cos(a) * rr).addScaledVector(t2, Math.sin(a) * rr).normalize().multiplyScalar(DOME - 0.1)); }
      const pos = [];
      for (let i = 0; i < N; i++) { const a = ring[i], b = ring[(i + 1) % N]; pos.push(center.x, center.y, center.z, a.x, a.y, a.z, b.x, b.y, b.z); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      const grp = new THREE.Group();
      const fill = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: '#1a0b2e', transparent: true, opacity: 0.6, depthWrite: false, side: THREE.DoubleSide }));
      fill.renderOrder = 6; grp.add(fill);
      const pairs = [], widths = [];
      for (let i = 0; i < N; i++) { pairs.push(ring[i], ring[(i + 1) % N]); widths.push(1.1); }
      grp.add(ribbons(pairs, widths, '#e9dcff', 0.95)); // add() tự gỡ khỏi cảnh trước khi gắn vào nhóm
      grp.add(crackMesh(center.clone(), 14, R * 0.55, seed + 5, '#f4fbff', 0.8));
      grp.userData.noFade = true; grp.traverse((o) => { o.userData.noFade = true; o.raycast = () => {}; });
      scene.add(grp);
      return grp;
    }
    // chạm sáng và gợn sóng trên vách kính
    function glassRipple(p, color, size) {
      const m = new THREE.Mesh(new THREE.RingGeometry(0.7, 1.4, 48), new THREE.MeshBasicMaterial({ color: color || '#dff3ff', transparent: true, opacity: 0.9, side: THREE.DoubleSide, depthWrite: false }));
      m.position.copy(p); m.lookAt(0, 0, 0); m.renderOrder = 7; scene.add(m);
      const s = sprite(color || '#dff3ff', 4, 0.9); s.position.copy(p);
      run(1500, (u) => { m.scale.setScalar(1 + u * (size || 16)); m.material.opacity = 0.9 * (1 - u); s.material.opacity = 0.9 * (1 - u); s.scale.setScalar(4 + u * 12); }, () => { kill(m); kill(s); });
    }
    // nhãn bền: chữ trên nền tối, vẽ lại khi chữ đổi
    function tag(color) {
      const c = document.createElement('canvas'); c.width = 512; c.height = 112;
      const tex = new THREE.CanvasTexture(c), sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false, depthWrite: false }));
      sp.renderOrder = 21; sp.scale.set(30, 6.6, 1); sp.userData.noFade = true; scene.add(sp);
      sp.userData.set = (text) => {
        if (sp.userData.text === text) return; sp.userData.text = text;
        const x = c.getContext('2d'); x.clearRect(0, 0, 512, 112);
        x.font = '600 44px Outfit, "Segoe UI", system-ui, sans-serif';
        const w = Math.min(500, x.measureText(text).width + 60), x0 = (512 - w) / 2;
        x.beginPath(); x.moveTo(x0 + 40, 12); x.arcTo(x0 + w, 12, x0 + w, 100, 40); x.arcTo(x0 + w, 100, x0, 100, 40); x.arcTo(x0, 100, x0, 12, 40); x.arcTo(x0, 12, x0 + w, 12, 40); x.closePath();
        x.fillStyle = 'rgba(20,10,34,0.82)'; x.fill(); x.fillStyle = color; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(text, 256, 58);
        tex.needsUpdate = true;
      };
      return sp;
    }


    /* =============== Vật thể =============== */
    const metal = (color, r) => new THREE.MeshStandardMaterial({ color, roughness: r == null ? 0.35 : r, metalness: 0.6 });
    const matte = (color) => new THREE.MeshStandardMaterial({ color, roughness: 0.8, flatShading: true });
    function coinMesh() {
      const g = new THREE.Group();
      const m = new THREE.Mesh(new THREE.CylinderGeometry(6.5, 6.5, 1.1, 40), metal('#e9c04a', 0.25)); g.add(m);
      for (const y of [0.58, -0.58]) { const r = new THREE.Mesh(new THREE.TorusGeometry(5.3, 0.32, 6, 40), metal('#c99a2e', 0.3)); r.rotation.x = Math.PI / 2; r.position.y = y; g.add(r); const st = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, 0.3, 5), metal('#c99a2e', 0.3)); st.position.y = y; g.add(st); }
      return g;
    }
    function seedMesh() { const m = new THREE.Mesh(new THREE.SphereGeometry(1, 14, 10), matte('#8a5a2b')); m.scale.set(2.4, 3.6, 2.4); const g = new THREE.Group(); g.add(m); const s = new THREE.Mesh(new THREE.ConeGeometry(0.8, 2.4, 6), matte('#7cc25a')); s.position.y = 3.6; g.add(s); return g; }
    function rockMesh(r) { const geo = new THREE.IcosahedronGeometry(r, 1), p = geo.attributes.position; for (let i = 0; i < p.count; i++) { const k = 0.82 + rnd() * 0.32; p.setXYZ(i, p.getX(i) * k, p.getY(i) * k * 0.85, p.getZ(i) * k); } geo.computeVertexNormals(); return new THREE.Mesh(geo, matte('#7b7369')); }
    function treeMesh() {
      const g = new THREE.Group();
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 3.2, 20, 10), matte('#6b4a2e')); trunk.position.y = 10; g.add(trunk);
      for (const [x, z, a] of [[0, 0, 0.5], [3, 1, -0.6], [-2.5, -1.5, 0.9]]) { const br = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 1.1, 9, 6), matte('#6b4a2e')); br.position.set(x * 0.6, 17, z * 0.6); br.rotation.set(z * 0.25, 0, -x * 0.2 + a * 0.2); g.add(br); }
      const greens = ['#3f9b4a', '#4fb35a', '#2f8a43', '#5cc06a'];
      for (let i = 0; i < 9; i++) { const a = (i / 9) * TAU, r = i === 8 ? 0 : 6 + (i % 3), y = i === 8 ? 28 : 20 + (i % 3) * 2.5; const m = new THREE.Mesh(new THREE.IcosahedronGeometry(i === 8 ? 8 : 6.5 + (i % 2), 1), matte(greens[i % 4])); m.position.set(Math.cos(a) * r, y, Math.sin(a) * r); g.add(m); }
      for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU + 0.3; const f = new THREE.Mesh(new THREE.SphereGeometry(0.9, 8, 6), new THREE.MeshStandardMaterial({ color: '#ffd36b', emissive: '#ff9a3a', emissiveIntensity: 0.6 })); f.position.set(Math.cos(a) * 8, 18 + (i % 3) * 3, Math.sin(a) * 8); g.add(f); }
      const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: '#bff5c8', transparent: true, opacity: 0.35, depthWrite: false, blending: THREE.AdditiveBlending })); glow.scale.setScalar(46); glow.position.y = 22; g.add(glow);
      g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.raycast = () => {}; } });
      return g;
    }

    /* =============== Mỗi quyền năng: hình ảnh của phép =============== */
    // Thần ra tay bằng chính hiệu ứng trên bể. Gõ kính thì vòm gợn sóng; khoan lỗ thở thì một vòng
    // sáng xoáy trên kính; làm nứt kính thì một chớp trắng và vết nứt toả ra; đập vỡ thì vòm nổ tung, mảnh kính rơi như mưa;
    // vá kính thì một lớp sáng lành lại trên kính; đổ thêm nước thì thác nước từ đỉnh vòm đổ xuống giữa biển; rút bớt nước
    // thì xoáy nước giữa biển; nghiêng bể thì cả bể nghiêng; che đèn thì bóng tối như nhật thực phủ xuống đảo; kéo đèn lại
    // gần thì một mặt trời nhân tạo hạ xuống sát vòm; mở nắp thì nắp tròn trên đỉnh vòm tự bật lên; đồng xu, hạt giống, viên
    // sỏi hiện ra từ một đốm sáng trên trời rồi rơi xuống đúng chỗ chạm; lắc bể thì cả bể rung chuyển.
    function lightPulse(p, color, size, dur) {
      const s = sprite(color, size * 0.3, 0.95); s.position.copy(p);
      run(dur || 900, (u) => { s.scale.setScalar(size * (0.3 + u)); s.material.opacity = 0.95 * (1 - u); }, () => kill(s));
    }
    // gõ kính: ba gợn sóng trên vòm, đảo rung nhẹ
    function tap(L, fx, done) {
      const gp = glassOf(L);
      [0, 380, 760].forEach((ms, k) => later(ms, () => { glassRipple(gp, '#dff3ff', 20 + k * 6); lightPulse(gp, '#ffffff', 10, 700); shake(220); sfx('knock', 1); if (k === 0) { done(); god3d.fxs.quake(L, { after: true, firms: [] }); } }));
      PR.ring(L.center.clone().setY(0.5), '#eaf6ff', 30, 2200);
    }
    // khoan lỗ thở: vòng sáng xoáy trên kính rồi thủng một lỗ tròn
    function vent(L, fx, done) {
      const gp = glassOf(L), n = gp.clone().normalize();
      const rings = [0, 1, 2].map((k) => { const m = new THREE.Mesh(new THREE.TorusGeometry(3.4 - k * 0.9, 0.18, 6, 32), new THREE.MeshBasicMaterial({ color: k ? '#bff5c8' : '#ffffff', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })); m.position.copy(gp).addScaledVector(n, 0.3); m.lookAt(0, 0, 0); scene.add(m); return m; });
      let hit = false;
      run(1900, (u, ms) => {
        rings.forEach((m, k) => { m.rotateZ(0.12 + k * 0.05); m.material.opacity = Math.sin(Math.min(1, u * 1.2) * Math.PI) * 0.9; m.scale.setScalar(1 + (1 - u) * 1.5); });
        if (!reduce && Math.random() < 0.4) PR.flash(gp.clone().addScaledVector(n, 0.5), 2 + rnd() * 2, '#e8fff0');
        if (ms > 1400 && !hit) {
          hit = true; glassRipple(gp, '#bff5c8', 10); done(); sfx('bless');
          PR.particles(L, fx.risk === 'locusts' ? '#5a6b2a' : fx.risk === 'cold' ? '#f4fbff' : '#bff5c8', fx.risk ? 90 : 60, fx.risk === 'locusts' ? 0.5 : 0.7, fx.risk === 'locusts' ? 'swarm' : fx.risk === 'cold' ? 'fall' : 'drift', 9000);
        }
      }, () => rings.forEach(kill));
    }
    // làm nứt kính: một chớp trắng trên vòm, vết nứt toả ra
    function crack(L, fx, done) {
      const gp = glassOf(L);
      lightPulse(gp, '#ffffff', 26, 900); PR.flash(gp, 18, '#ffffff');
      later(260, () => { shake(700); sfx('crack', 2); glassRipple(gp, '#ffffff', 24); done(); });
    }
    // đập vỡ kính: vòm nổ tung một mảng, mảnh kính rơi như mưa xuống đảo
    function shatter(L, fx, done) {
      const gp = glassOf(L);
      lightPulse(gp, '#f4e8ff', 40, 1200);
      later(420, () => {
        shake(1600); sfx('crack', 4); sfx('rumble', 3); glassRipple(gp, '#e9dcff', 34); PR.flash(gp, 40, '#f4e8ff'); done();
        const shards = [];
        for (let i = 0; i < (reduce ? 10 : 46); i++) {
          const g = new THREE.BufferGeometry(), s = 1 + rnd() * 3.5;
          g.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, s, rnd() * s, 0, rnd() * s, s * 1.4, 0.2], 3));
          const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: '#dff3ff', transparent: true, opacity: 0.75, side: THREE.DoubleSide, depthWrite: false }));
          m.position.copy(gp); scene.add(m);
          const to = L.center.clone().add(v3((rnd() - 0.5) * 70, 0.3, (rnd() - 0.5) * 70));
          shards.push({ m, to, d: rnd() * 0.25, sp: v3(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).multiplyScalar(0.3) });
        }
        run(3400, (k) => { for (const s of shards) { const q = clamp01((k - s.d) / (1 - s.d)); s.m.position.copy(gp).lerp(s.to, q * q); s.m.position.y = gp.y * (1 - q * q) + s.to.y; s.m.rotation.x += s.sp.x; s.m.rotation.y += s.sp.y; if (q >= 1) s.m.material.opacity *= 0.96; } }, () => { for (const s of shards) { if (!reduce && rnd() < 0.3) PR.flash(s.to.clone().setY(0.6), 3, '#dff3ff'); kill(s.m); } });
      });
    }
    // vá kính: một lớp sáng xanh lành lại trên chỗ nứt, chỗ vỡ
    function patch(L, fx, done) {
      const gp = glassOf(L), R = fx.was === 'broken' ? 17 : 12;
      const film = new THREE.Mesh(new THREE.CircleGeometry(R, 6), new THREE.MeshBasicMaterial({ color: '#bfe9ff', transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }));
      film.position.copy(gp); film.lookAt(0, 0, 0); film.userData.noFade = true; scene.add(film);
      const edge = new THREE.Mesh(new THREE.RingGeometry(R - 0.5, R, 6), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false })); edge.position.copy(gp); edge.lookAt(0, 0, 0); scene.add(edge);
      let hit = false;
      run(3200, (u) => {
        const grow = ease(seg(u, 0, 0.35)), fade = seg(u, 0.55, 1);
        film.scale.setScalar(0.05 + grow); edge.scale.setScalar(0.05 + grow);
        film.material.opacity = 0.55 * grow * (1 - fade); edge.material.opacity = 0.9 * grow * (1 - fade);
        film.rotateZ(0.01);
        if (grow >= 1 && !hit) { hit = true; glassRipple(gp, '#9fd3f0', 14); sfx('bless'); done(); for (let k = 0; k < 10 && !reduce; k++) later(k * 80, () => PR.flash(gp.clone().add(v3((rnd() - 0.5) * R, (rnd() - 0.5) * R, (rnd() - 0.5) * R)), 3, '#e8fbff')); }
      }, () => { kill(film); kill(edge); });
    }
    // chỗ phía trên một đảo, bên ngoài vách kính sau mép đảo (đèn, bóng tối)
    function overIsland(L, lift) {
      const a = azOf(L);
      return { top: domePt(a, OUTER_EL, DOME), pos: domePt(a, OUTER_EL, DOME + lift), inw: v3(-Math.cos(a), 0, -Math.sin(a)) };
    }
    // che đèn: bóng tối như nhật thực phủ xuống đảo, đuốc thắp giữa trưa
    function shade(L, fx, done) {
      const corona = sprite('#fff3c4', 60, 0); corona.position.copy(L.center).setY(95);
      const moonDisk = new THREE.Mesh(new THREE.CircleGeometry(15, 40), new THREE.MeshBasicMaterial({ color: '#06080f', transparent: true, opacity: 0, depthWrite: false }));
      moonDisk.position.copy(corona.position); scene.add(moonDisk);
      const disc = sprite('#05070f', lands3d.LAND_R * 0.5, 0, true); disc.position.copy(L.center).setY(70);
      run(2600, (u) => {
        if (camera) moonDisk.lookAt(camera.position);
        const a = Math.sin(Math.min(1, u * 1.25) * Math.PI);
        corona.material.opacity = 0.9 * a; corona.scale.setScalar(44 + 20 * u); moonDisk.material.opacity = 0.95 * a; moonDisk.position.x = corona.position.x + (1 - Math.min(1, u * 2)) * 12;
        disc.scale.setScalar(lands3d.LAND_R * (0.5 + 2.4 * ease(u))); disc.material.opacity = 0.6 * Math.sin(u * Math.PI); disc.position.y = 70 - 40 * u;
        if (u > 0.3) done();
      }, () => { kill(disc); kill(corona); kill(moonDisk); });
      sfx('gust', 2);
      if (PR.torches) later(900, () => PR.torches(L));
    }
    // kéo đèn lại gần: một mặt trời nhân tạo hạ xuống sát vòm, đỏ rực, đất nóng hầm hập
    function sunOrb() {
      const g = new THREE.Group();
      const core = new THREE.Mesh(new THREE.SphereGeometry(6, 18, 12), new THREE.MeshBasicMaterial({ color: '#fff1c4' })); g.add(core);
      const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: '#ffb35a', transparent: true, opacity: 0.85, depthWrite: false, blending: THREE.AdditiveBlending })); glow.scale.setScalar(70); g.add(glow);
      const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: '#ff7a2a', transparent: true, opacity: 0.4, depthWrite: false, blending: THREE.AdditiveBlending })); halo.scale.setScalar(130); g.add(halo);
      g.userData = { glow, halo, core }; return g;
    }
    function lamp(L, fx, done) {
      const o = overIsland(L, 22), sun = sunOrb();
      sun.position.copy(o.pos).add(v3(0, 150, 0)); scene.add(sun);
      lamps[L.i] = { g: sun, base: o.pos.clone(), floor: softDisc(L, '#ff8a3a', lands3d.LAND_R * 1.2, 0.45, true) };
      run(2200, (u) => {
        const k = ease(u); sun.position.copy(o.pos).add(v3(0, 150 * (1 - k), 0));
        sun.userData.glow.material.opacity = 0.5 + 0.4 * k;
        if (u >= 1) { done(); god3d.fxs.drought(L, { days: 30 }); if (fx.melt) god3d.fxs.flood(L, { days: 20, firms: [] }); for (let i = 0; i < 12 && !reduce; i++) puff(L.center.clone().add(v3((rnd() - 0.5) * 50, 1, (rnd() - 0.5) * 50)), true, '#5a4a3a'); }
      });
      sfx('gust', 3);
    }
    // thả vào bể: vật hiện ra từ một đốm sáng trên trời rồi rơi đúng chỗ chạm
    function drop(L, fx, done, kind) {
      const x = fx.at ? fx.at.x : 0, z = fx.at ? fx.at.z : 0;
      const obj = kind === 'coin' ? coinMesh() : kind === 'seed' ? seedMesh() : rockMesh(4.2);
      if (kind === 'coin') obj.rotation.x = Math.PI / 2;
      const ground = L.center.clone().add(v3(x, kind === 'coin' ? 4.5 : kind === 'seed' ? 1 : 1.6, z));
      const from = ground.clone().setY(75), portal = sprite(kind === 'pebble' ? '#ffb3a8' : '#fff1c4', 2, 0); portal.position.copy(from);
      obj.position.copy(from); obj.scale.setScalar(0.01); scene.add(obj);
      let fell = false;
      run(3000, (u) => {
        const open = seg(u, 0, 0.3), f = seg(u, 0.3, kind === 'pebble' ? 0.62 : 0.78);
        portal.scale.setScalar(4 + open * 20); portal.material.opacity = 0.9 * Math.sin(Math.min(1, u * 1.6) * Math.PI);
        obj.scale.setScalar(Math.max(0.01, ease(open)));
        if (f > 0) { obj.position.copy(from).lerp(ground, f * f); if (kind === 'coin') obj.rotation.z += 0.12 * (1 - f); else obj.rotation.x += 0.05; }
        if (f >= 1 && !fell) {
          fell = true; done();
          if (kind === 'pebble') { PR.explosion(ground.clone().setY(0.5), 6); PR.crater(ground.clone(), 6.5, 60000); shake(1000); sfx('boom'); rocks[L.i] = { m: obj, day: W.day }; }
          else if (kind === 'coin') { shake(500); PR.ring(ground.clone().setY(0.4), '#ffd36b', 14, 1600); PR.flash(ground.clone().setY(5), 24, '#ffe9a8'); for (let i = 0; i < 10 && !reduce; i++) puff(ground.clone().add(v3((rnd() - 0.5) * 6, 0.6, (rnd() - 0.5) * 6)), true, '#b9ab98'); coins[L.i] = { m: obj, day: W.day }; sfx('chime'); }
          else { PR.ring(ground.clone().setY(0.3), '#bff5c8', 10, 1600); sfx('bless'); kill(obj); }
        }
      }, () => kill(portal));
    }
    // đổ thêm nước: thác nước từ đỉnh vòm đổ xuống giữa biển
    function pour(fx, done) {
      const top = v3(0, DOME - 4, 0), sea = () => war3d.SEA_Y + war3d.seaDy;
      const col = new THREE.Mesh(new THREE.CylinderGeometry(5, 9, 1, 20, 1, true), new THREE.MeshStandardMaterial({ color: '#4f9fd0', transparent: true, opacity: 0, emissive: '#16405a', emissiveIntensity: 0.5, depthWrite: false, side: THREE.DoubleSide }));
      scene.add(col);
      const spring = sprite('#cfeeff', 30, 0); spring.position.copy(top);
      let said = false, splashT = 0;
      run(6000, (u, ms) => {
        const on = Math.min(1, u * 5) * (u > 0.85 ? (1 - u) / 0.15 : 1), y0 = sea(), len = top.y - y0;
        col.scale.set(1, len, 1); col.position.set(0, y0 + len / 2, 0); col.material.opacity = 0.65 * on;
        spring.material.opacity = 0.8 * on;
        if (on > 0.6 && !said) { said = true; done(); sfx('surge', 5); }
        if (on > 0.3 && ms > splashT && !reduce) { splashT = ms + 120; puff(v3((rnd() - 0.5) * 14, y0 + 0.5, (rnd() - 0.5) * 14), false, '#eef6fb'); if (rnd() < 0.3) PR.ring(v3(0, y0 + 0.1, 0), '#dff3ff', 30, 2200); }
      }, () => { kill(col); kill(spring); });
    }
    // rút bớt nước: xoáy nước giữa biển, mặt biển hạ dần
    function drain(fx, done) {
      const sea = () => war3d.SEA_Y + war3d.seaDy, rings = [];
      // xoáy: những dải bọt xoắn ốc quay quanh một con mắt nước tối
      for (let k = 0; k < 4; k++) {
        const pts = []; for (let i = 0; i <= 90; i++) { const u = i / 90, a = u * TAU * 2.2 + (k * TAU) / 4, r = 4 + u * 58; pts.push(v3(Math.cos(a) * r, 0, Math.sin(a) * r)); }
        const m = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 120, 1.1, 5, false), new THREE.MeshBasicMaterial({ color: k % 2 ? '#f4fbff' : '#cfeeff', transparent: true, opacity: 0, depthWrite: false }));
        m.userData.noFade = true; scene.add(m); rings.push(m);
      }
      const eye = new THREE.Mesh(new THREE.CircleGeometry(9, 32), new THREE.MeshBasicMaterial({ color: '#082231', transparent: true, opacity: 0, depthWrite: false })); eye.rotation.x = -Math.PI / 2; scene.add(eye);
      let said = false, bubT = 0;
      run(6200, (u, ms) => {
        const on = Math.min(1, u * 4) * (u > 0.8 ? (1 - u) / 0.2 : 1), y = sea() + 0.15;
        rings.forEach((m) => { m.position.y = y; m.rotation.y = -ms * 0.0011; m.material.opacity = 0.85 * on; });
        eye.position.y = y + 0.05; eye.material.opacity = 0.85 * on; eye.scale.setScalar(0.6 + 0.4 * on);
        if (on > 0.6 && !said) { said = true; done(); sfx('surge', 3); }
        if (on > 0.3 && ms > bubT && !reduce) { bubT = ms + 140; puff(v3((rnd() - 0.5) * 10, y + 0.3, (rnd() - 0.5) * 10), false, '#cfe8ff'); }
      }, () => { rings.forEach(kill); kill(eye); });
    }
    // nghiêng bể: cả bể nghiêng về phía đảo được chạm, nước giữ phẳng rồi sóng sánh, sóng thần đánh vào bờ
    function tilt(L, fx, done) {
      const a = azOf(L), axis = v3(-Math.sin(a), 0, Math.cos(a));
      let said = false;
      run(4600, (u) => {
        const up = ease(seg(u, 0, 0.3)), back = ease(seg(u, 0.62, 0.92));
        const ang = 0.06 * up * (1 - back), slosh = back > 0 ? Math.sin(back * Math.PI * 3) * 0.03 * (1 - back) : 0;
        scene.quaternion.setFromAxisAngle(axis, ang);
        tw.x = -(ang * 0.85 + slosh) * axis.x; tw.z = -(ang * 0.85 + slosh) * axis.z; war3d.setSea(seaNow, tw.x, tw.z);
        if (up >= 1 && !said) { said = true; done(); shake(1200); sfx('surge', 6); for (const j of fx.sides || [L.i]) if (lands[j]) god3d.fxs.tsunami(lands[j]); }
      }, () => { scene.quaternion.identity(); tw.x = tw.z = 0; war3d.setSea(seaNow, 0, 0); });
    }
    // mở nắp bể: nắp tròn trên đỉnh vòm tự bật lên, gió, mưa, lá khô rơi vào
    function lid(fx, done) {
      const cap = new THREE.Group(), R = Math.sqrt(DOME * DOME - (DOME - 8) * (DOME - 8));
      const disc = new THREE.Mesh(new THREE.CylinderGeometry(R, R, 2, 48), new THREE.MeshStandardMaterial({ color: '#dff3ff', transparent: true, opacity: 0.35, roughness: 0.1, depthWrite: false }));
      const knob = new THREE.Mesh(new THREE.SphereGeometry(5, 14, 10), metal('#c9a35a')); knob.position.y = 4;
      const rim = new THREE.Mesh(new THREE.TorusGeometry(R, 1.4, 8, 64), metal('#c9a35a')); rim.rotation.x = Math.PI / 2;
      cap.add(disc, knob, rim); cap.position.set(0, DOME - 8, 0); scene.add(cap);
      const hinge = v3(R, DOME - 8, 0);
      let said = false;
      run(6400, (u) => {
        const open = ease(seg(u, 0.05, 0.28)) * (1 - ease(seg(u, 0.78, 0.92))), fade = seg(u, 0.92, 1);
        cap.position.copy(hinge).add(v3(-R * Math.cos(open * 1.7), R * Math.sin(open * 1.7), 0));
        cap.rotation.z = open * 1.7;
        disc.material.opacity = 0.35 * (1 - fade);
        if (open > 0.95 && !said) {
          said = true; done(); sfx('gust', 6); if (K.doRain) K.doRain();
          for (const L of lands) if (W.cities[L.i].settled) PR.particles(L, '#c98a3a', 50, 0.9, 'fall', 8000);
          if (fx.bugs != null && lands[fx.bugs]) later(1500, () => PR.particles(lands[fx.bugs], '#4f5f23', 120, 0.45, 'swarm', 14000));
        }
      }, () => kill(cap));
    }
    // lắc bể: cả bể rung chuyển, động đất trên sáu đảo
    function shakeAll(fx, done) {
      const base = scene.position.clone();
      let said = false;
      run(3600, (u, ms) => {
        const amp = Math.sin(Math.min(1, u * 1.15) * Math.PI) * (reduce ? 0.3 : 2.4);
        scene.position.set(base.x + Math.sin(ms * 0.045) * amp, base.y, base.z + Math.cos(ms * 0.037) * amp * 0.6);
        if (amp > 1 && !said) { said = true; done(); shake(3000); sfx('rumble', 5); for (const L of lands) if (W.cities[L.i].settled) god3d.fxs.quake(L, { firms: [] }); }
      }, () => scene.position.copy(base));
    }

    /* =============== Dấu vết bền trên bể =============== */
    const marks = lands.map(() => ({})), lamps = [], coins = [], rocks = [];
    function dropMark(i, key) { const M = marks[i]; if (M[key]) { kill(M[key]); M[key] = null; } }
    function syncDay() {
      for (const L of lands) {
        const i = L.i, c = W.cities[i], M = marks[i], gl = (c.settled && c.glass) || {};
        const broken = !!gl.broken, cracked = broken || (gl.crack || 0) > W.day, vented = (gl.vent || 0) > W.day;
        const gp = glassOf(L);
        if (cracked && !M.crack) M.crack = crackMesh(gp, 9, 6.5, 97 + i * 31);
        if (!cracked && M.crack) dropMark(i, 'crack');
        if (cracked && !broken && !M.frost) M.frost = softDisc(L, '#cfe8ff', lands3d.LAND_R * 1.25, 0.5);
        if ((!cracked || broken) && M.frost) dropMark(i, 'frost');
        if (broken && !M.hole) {
          M.hole = holeMesh(gp, 13, 53 + i * 7);
          M.sky = softHaze(L.center.clone().setY(26), '#3a1a66', lands3d.LAND_R * 3.2);
          M.skyFloor = softDisc(L, '#2a1050', lands3d.LAND_R * 1.3, 0.35);
          const n = 160, pos = new Float32Array(n * 3);
          for (let k = 0; k < n; k++) { const a = rnd() * TAU, r = Math.sqrt(rnd()) * lands3d.LAND_R * 1.1; pos[k * 3] = L.center.x + Math.cos(a) * r; pos[k * 3 + 1] = 18 + rnd() * 30; pos[k * 3 + 2] = L.center.z + Math.sin(a) * r; }
          const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
          M.stars = new THREE.Points(sg, new THREE.PointsMaterial({ color: '#f4ecff', size: 0.9, transparent: true, opacity: 0.9, depthWrite: false })); M.stars.userData.noFade = true; scene.add(M.stars);
          M.tag = tag('#e9c8ff');
          M.tag.position.copy(L.center).setY(40);
        }
        if (!broken && M.hole) { for (const k of ['hole', 'sky', 'skyFloor', 'stars', 'tag']) dropMark(i, k); }
        if (M.tag && broken) M.tag.userData.set('Kính vỡ · còn ' + Math.max(0, gl.broken.collapse - W.day) + ' ngày');
        if (vented && !M.vent) {
          M.vent = new THREE.Group();
          const ring = new THREE.Mesh(new THREE.TorusGeometry(3.2, 0.7, 8, 28), metal('#b8c4cc')); ring.position.copy(gp); ring.lookAt(0, 0, 0); M.vent.add(ring);
          const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: '#bff5c8', transparent: true, opacity: 0.6, depthWrite: false, blending: THREE.AdditiveBlending })); glow.scale.setScalar(12); glow.position.copy(gp); M.vent.add(glow);
          M.vent.userData.noFade = true; M.vent.traverse((o) => { o.userData.noFade = true; o.raycast = () => {}; }); scene.add(M.vent);
        }
        if (!vented && M.vent) dropMark(i, 'vent');
        // đảo bị che đèn: tối bao lâu còn hậu quả
        const dark = c.settled && (c.dark || 0) > W.day;
        if (dark && !M.dark) { M.dark = softDisc(L, '#04060f', lands3d.LAND_R * 1.35, 0.4); M.darkAir = softHaze(L.center.clone().setY(14), '#05070f', lands3d.LAND_R * 2.6); }
        if (!dark && M.dark) {
          const m = M.dark, h = M.darkAir; M.dark = M.darkAir = null; run(2000, (u) => { m.material.opacity = 0.72 * (1 - u); if (h) h.material.opacity = 0.4 * (1 - u); }, () => { kill(m); kill(h); });
        }
        // mặt trời nhân tạo bay xa dần khi hết nóng
        const hot = c.settled && (c.heat || 0) > W.day, Lp = lamps[i];
        if (Lp && !hot && !Lp.leaving) { Lp.leaving = true; const from = Lp.g.position.clone(); run(2400, (u) => { Lp.g.position.copy(from).add(v3(0, 150 * ease(u), 0)); Lp.g.userData.glow.material.opacity = 0.9 * (1 - u); Lp.floor.material.opacity = 0.35 * (1 - u); }, () => { kill(Lp.g); kill(Lp.floor); lamps[i] = null; }); }
        // cây khổng lồ mọc đúng chỗ hạt giống rơi
        const T = c.settled && c.tree;
        if (T && (!M.tree || M.treeDay !== T.day)) {
          dropMark(i, 'tree'); M.treeDay = T.day;
          const g = treeMesh(); g.position.copy(L.center).add(v3(T.x, 0, T.z)); g.scale.setScalar(0.01); scene.add(g); M.tree = g;
          if (lands3d.kit.clearTrees) lands3d.kit.clearTrees(L, T.x, T.z, 7);
          const born = W.day === T.day;
          run(born ? 3200 : 10, (u) => { g.scale.setScalar(Math.max(0.01, ease(u))); if (born && !reduce && rnd() < 0.2) puff(g.position.clone().add(v3((rnd() - 0.5) * 8, 1, (rnd() - 0.5) * 8)), false, '#bff5c8'); });
        }
        if (!T && M.tree) dropMark(i, 'tree');
        // đồng xu, viên sỏi ở lại một thời gian rồi chìm dần vào đất
        for (const [arr, days] of [[coins, 120], [rocks, 45]]) {
          const o = arr[i]; if (!o) continue;
          if (!c.settled || W.day - o.day > days) { arr[i] = null; const m = o.m, y0 = m.position.y; run(3000, (u) => { m.position.y = y0 - u * 8; }, () => kill(m)); }
        }
        if (!c.settled) { for (const k of ['crack', 'frost', 'hole', 'sky', 'skyFloor', 'stars', 'tag', 'vent', 'dark', 'darkAir', 'tree']) dropMark(i, k); }
      }
    }

    /* =============== Mỗi khung hình =============== */
    let seaNow = 0;
    const tw = { x: 0, z: 0 }; // độ nghiêng mặt nước khi bể nghiêng
    function update(dt, t) {
      const n = now();
      for (let i = active.length - 1; i >= 0; i--) {
        const e = active[i], ms = n - e.t0, u = Math.min(1, ms / e.dur);
        try { e.update(u, ms); } catch (err) { e.dur = 0; }
        if (u >= 1) { active.splice(i, 1); try { e.end(); } catch (err) { /* hình ảnh hỏng thì bỏ qua */ } }
      }
      // mặt biển dâng hạ theo quyền năng của thần
      const T = W.tank, want = T && T.level > 0 ? 1.25 : T && T.level < 0 ? -1.7 : 0;
      if (Math.abs(seaNow - want) > 0.001) { seaNow += (want - seaNow) * Math.min(1, dt / 1400); if (Math.abs(seaNow - want) < 0.002) seaNow = want; war3d.setSea(seaNow, tw.x, tw.z); }
      // trời tím trên đảo kính vỡ: sao nhấp nháy, khí bị hút về lỗ thủng
      for (const L of lands) {
        const M = marks[L.i];
        if (M.sky) { M.sky.material.opacity = 0.42 + 0.08 * Math.sin(t * 0.002 + L.i); M.skyFloor.material.opacity = 0.5; M.stars.material.opacity = 0.6 + 0.35 * Math.sin(t * 0.004 + L.i); if (!reduce && rnd() < 0.08) { const p = L.center.clone().add(v3((rnd() - 0.5) * 60, 2, (rnd() - 0.5) * 60)), to = glassOf(L); const s = sprite('#d9c8ff', 2.2, 0.8); s.position.copy(p); run(2600, (u) => { s.position.copy(p).lerp(to, u * u); s.material.opacity = 0.8 * (1 - u); }, () => kill(s)); } }
        if (M.tag && camera) { const d = camera.position.distanceTo(M.tag.position), k = Math.max(18, Math.min(90, d * 0.075)); M.tag.scale.set(k, k * 0.22, 1); }
        if (M.dark) { M.dark.material.opacity = Math.min(0.72, M.dark.material.opacity + dt / 2500); if (M.darkAir) M.darkAir.material.opacity = Math.min(0.4, M.darkAir.material.opacity + dt / 4000); }
        if (M.tree && !reduce) M.tree.rotation.y = Math.sin(t * 0.0004 + L.i) * 0.03;
        if (M.frost) { M.frost.material.opacity = Math.min(0.28, M.frost.material.opacity + dt / 6000); if (!reduce && rnd() < 0.05) { const gp = glassOf(L), s = sprite('#d6ecff', 2.4, 0.7); s.position.copy(gp); const to = L.center.clone().add(v3((rnd() - 0.5) * 50, 3, (rnd() - 0.5) * 50)); run(3400, (u) => { s.position.copy(gp).lerp(to, u); s.material.opacity = 0.7 * (1 - u); }, () => kill(s)); } }
        if (M.vent && !reduce && rnd() < 0.03) { const gp = glassOf(L), s = sprite('#e8fff0', 1.6, 0.7); s.position.copy(gp); const to = L.center.clone().add(v3((rnd() - 0.5) * 40, 4, (rnd() - 0.5) * 40)); run(3000, (u) => { s.position.copy(gp).lerp(to, u); s.material.opacity = 0.7 * (1 - u); }, () => kill(s)); }
        const Lp = lamps[L.i]; if (Lp && !Lp.leaving) { const f = 0.85 + 0.15 * Math.sin(t * 0.009); Lp.g.userData.glow.material.opacity = 0.9 * f; Lp.floor.material.opacity = Math.min(0.35, Lp.floor.material.opacity + dt / 3000) * (0.9 + 0.1 * f); if (!reduce && rnd() < 0.05) puff(L.center.clone().add(v3((rnd() - 0.5) * 50, 2, (rnd() - 0.5) * 50)), false, '#ffd9a8'); }
      }
    }

    /* =============== Thần ra tay =============== */
    // thời điểm phép chạm tới bể (ms): lúc đó hậu quả mới hiện ra trên đảo
    const HIT = { tap: 300, vent: 1400, crack: 300, shatter: 450, patch: 1150, pour: 1000, drain: 1000, tilt: 1400, shade: 900, lamp: 2200, lid: 1500, coin: 2400, seed: 2400, pebble: 1900, shake: 700 };
    function play(fx, onHit) {
      const L = fx.city >= 0 ? lands[fx.city] : null;
      let fired = false;
      const done = () => { if (fired) return; fired = true; if (onHit) try { onHit(); } catch (err) { console.error('powers3d hit', fx.key, err); } };
      const k = fx.key;
      holdUntil = now() + (HIT[k] || 1000) + 500;
      later((HIT[k] || 1000) + 1200, done); // lưới an toàn: hậu quả luôn hiện dù hình ảnh lỗi
      try {
        if (k === 'tap' && L) tap(L, fx, done);
        else if (k === 'vent' && L) vent(L, fx, done);
        else if (k === 'crack' && L) crack(L, fx, done);
        else if (k === 'shatter' && L) shatter(L, fx, done);
        else if (k === 'patch' && L) patch(L, fx, done);
        else if (k === 'pour') pour(fx, done);
        else if (k === 'drain') drain(fx, done);
        else if (k === 'tilt' && L) tilt(L, fx, done);
        else if (k === 'shade' && L) shade(L, fx, done);
        else if (k === 'lamp' && L) lamp(L, fx, done);
        else if (k === 'lid') lid(fx, done);
        else if ((k === 'coin' || k === 'seed' || k === 'pebble') && L) drop(L, fx, done, k);
        else if (k === 'shake') shakeAll(fx, done);
        else { holdUntil = 0; if (L && god3d.fxs[k]) god3d.fxs[k](L, fx); done(); }
      } catch (err) { console.error('powers3d', k, err); holdUntil = 0; done(); }
    }
    return {
      play, update, syncDay, spotAt, glassOf,
      get holdUntil() { return holdUntil; }, get active() { return active.length; },
    };
  }
  root.Powers3D = { create };
})(typeof self !== 'undefined' ? self : this);
