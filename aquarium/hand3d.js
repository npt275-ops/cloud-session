/* Bể Kính — bàn tay ngoài bể kính.
 * Vị thần là một bàn tay khổng lồ bên ngoài chiếc bể. Mỗi quyền năng là một việc bàn tay thật làm được với chiếc bể:
 * gõ, khoan, làm nứt, đập vỡ, vá kính; đổ thêm nước, rút bớt nước, nghiêng bể; che đèn, kéo đèn lại gần, mở nắp;
 * thả đồng xu, hạt giống, viên sỏi; lắc cả bể. Bàn tay hiện ra ngoài vòm kính, làm xong thì rút đi.
 * Dấu vết ở lại trên bể bao lâu còn hậu quả: vết nứt, lỗ vỡ với bầu trời tím và đếm ngược, lỗ thở, mặt biển dâng hạ,
 * bàn tay che trên đảo, ngọn đèn sát đảo, cây khổng lồ, đồng xu cắm đất, viên sỏi trong hố. */
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

    /* =============== Bàn tay =============== */
    // dựng theo trục riêng: ngón tay chỉ về +Z, lòng bàn tay úp xuống -Y, cánh tay kéo dài về -Z ra ngoài bể
    const skinMat = keep(new THREE.MeshStandardMaterial({ color: '#e5ad87', roughness: 0.58, metalness: 0 }));
    const sleeveMat = keep(new THREE.MeshStandardMaterial({ color: '#2d4866', roughness: 0.92 }));
    const cuffMat = keep(new THREE.MeshStandardMaterial({ color: '#efece4', roughness: 0.8 }));
    const nailMat = keep(new THREE.MeshStandardMaterial({ color: '#f6dccf', roughness: 0.28 }));
    const BALL = keep(new THREE.SphereGeometry(1, 16, 12));
    const limbG = {};
    function limb(len, r0, r1) {
      const k = len + ':' + r0 + ':' + r1;
      if (!limbG[k]) { const g = new THREE.CylinderGeometry(r1, r0, len, 16, 1, true); g.rotateX(Math.PI / 2); g.translate(0, 0, len / 2); limbG[k] = keep(g); }
      return limbG[k];
    }
    function makeHand(mirror) {
      const g = new THREE.Group(); g.visible = false; scene.add(g);
      const body = new THREE.Group(); g.add(body);
      if (mirror) body.scale.x = -1;
      const add = (geo, mat, x, y, z, sx, sy, sz) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); if (sx) m.scale.set(sx, sy, sz); m.castShadow = false; body.add(m); return m; };
      add(BALL, skinMat, 0, 0, 3, 16.5, 6, 17.5); // lòng bàn tay
      add(BALL, skinMat, 0, 0.6, -9, 13, 5.6, 10); // cổ tay
      const arm = add(limb(170, 10, 13.5), skinMat, 0, 0.6, -10); arm.rotation.y = Math.PI;
      const cuff = add(limb(9, 14.4, 14.4), cuffMat, 0, 0.6, -46); cuff.rotation.y = Math.PI;
      const sleeve = add(limb(170, 15.6, 17), sleeveMat, 0, 0.6, -54); sleeve.rotation.y = Math.PI;
      const F = [];
      // ngón trỏ, giữa, áp út, út (phía +X là ngón út của bàn tay phải úp)
      for (const [x, len, r] of [[-9.4, 23, 3.0], [-3.1, 25.5, 3.2], [3.2, 23.5, 3.05], [9.3, 18.5, 2.6]]) {
        const base = new THREE.Group(); base.position.set(x, 0.6, 16); body.add(base);
        const k1 = new THREE.Mesh(BALL, skinMat); k1.scale.setScalar(r * 1.1); base.add(k1);
        base.add(new THREE.Mesh(limb(len * 0.55, r * 1.05, r * 0.97), skinMat));
        const mid = new THREE.Group(); mid.position.z = len * 0.55; base.add(mid);
        const k2 = new THREE.Mesh(BALL, skinMat); k2.scale.setScalar(r * 0.98); mid.add(k2);
        mid.add(new THREE.Mesh(limb(len * 0.45, r * 0.97, r * 0.86), skinMat));
        const tip = new THREE.Mesh(BALL, skinMat); tip.scale.setScalar(r * 0.87); tip.position.z = len * 0.45; mid.add(tip);
        const nail = new THREE.Mesh(BALL, nailMat); nail.scale.set(r * 0.62, r * 0.28, r * 0.72); nail.position.set(0, r * 0.62, len * 0.45 - r * 0.3); mid.add(nail);
        F.push({ base, mid, tip });
      }
      // ngón cái chĩa chéo ra phía trước bên trái
      const tb = new THREE.Group(); tb.position.set(-14.5, -1.6, 3); tb.rotation.set(0.25, -0.85, 0.3); body.add(tb);
      const t1 = new THREE.Mesh(BALL, skinMat); t1.scale.setScalar(4); tb.add(t1);
      tb.add(new THREE.Mesh(limb(11, 3.8, 3.5), skinMat));
      const tm = new THREE.Group(); tm.position.z = 11; tb.add(tm);
      const t2 = new THREE.Mesh(BALL, skinMat); t2.scale.setScalar(3.5); tm.add(t2);
      tm.add(new THREE.Mesh(limb(9, 3.5, 3.1), skinMat));
      const tt = new THREE.Mesh(BALL, skinMat); tt.scale.setScalar(3.1); tt.position.z = 9; tm.add(tt);
      F.push({ base: tb, mid: tm, tip: tt, thumb: true });
      const H = { g, body, F, hold: new THREE.Group(), busy: 0 };
      H.hold.position.set(-4, -9, 14); body.add(H.hold); // chỗ cầm đồ vật: dưới lòng bàn tay
      return H;
    }
    // độ co của năm ngón: trỏ, giữa, áp út, út, cái
    const POSE = { open: [0, 0, 0, 0, 0], point: [0, 1, 1, 1, 0.7], fist: [1, 1, 1, 1, 0.9], grip: [0.72, 0.75, 0.78, 0.8, 0.55], pinch: [0.5, 0.35, 0.4, 0.45, 0.6], flat: [0.05, 0.05, 0.05, 0.08, 0.15], claw: [0.45, 0.45, 0.45, 0.45, 0.4] };
    function pose(H, a, b, u) {
      const A = POSE[a] || a, B = POSE[b || a] || b || A;
      H.F.forEach((f, i) => {
        const c = A[i] + ((B[i] == null ? A[i] : B[i]) - A[i]) * (u == null ? 1 : u);
        if (f.thumb) { f.base.rotation.x = 0.25 + c * 0.5; f.base.rotation.y = -0.85 + c * 0.55; f.mid.rotation.x = c * 0.9; }
        else { f.base.rotation.x = c * 1.25; f.mid.rotation.x = c * 1.55; }
      });
    }
    const hands = [makeHand(false), makeHand(true)], shadeHand = makeHand(true); // bàn tay che đèn ở lại lâu, dùng riêng
    // đặt bàn tay: gốc ở pos, ngón tay chĩa về phía at
    function place(H, pos, at, up) { H.g.position.copy(pos); H.g.up.copy(up || UP); H.g.lookAt(at); H.g.visible = true; }
    function hide(H) { H.g.visible = false; while (H.hold.children.length) kill(H.hold.children[0]); }
    const tipOf = (H, i) => { H.g.updateMatrixWorld(true); return H.F[i].tip.getWorldPosition(v3(0, 0, 0)); };

    /* =============== Mặt vòm kính =============== */
    const azOf = (L) => Math.atan2(L.center.z, L.center.x);
    const domePt = (a, el, r) => v3(Math.cos(a) * Math.cos(el), Math.sin(el), Math.sin(a) * Math.cos(el)).multiplyScalar(r || DOME);
    const GLASS_EL = 0.3, OUTER_EL = 0.5; // chỗ chạm kính: vách vòm thấp, ngay sau mép ngoài của đảo
    const glassOf = (L) => domePt(azOf(L), GLASS_EL, DOME - 0.2);
    const domeAbove = (x, z) => v3(x, Math.sqrt(Math.max(1, DOME * DOME - x * x - z * z)), z);
    // vệt tròn mềm: tâm đặc, mép tan dần (bóng bàn tay, hơi nóng, trời tím)
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

    /* =============== Đồ vật bàn tay cầm =============== */
    const metal = (color, r) => new THREE.MeshStandardMaterial({ color, roughness: r == null ? 0.35 : r, metalness: 0.6 });
    const matte = (color) => new THREE.MeshStandardMaterial({ color, roughness: 0.8, flatShading: true });
    function drill() {
      const g = new THREE.Group();
      const b = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.2, 20, 14), matte('#e0a526')); b.rotation.x = Math.PI / 2; b.position.z = 2; g.add(b);
      const grip = new THREE.Mesh(new THREE.BoxGeometry(5, 14, 6), matte('#2b2f36')); grip.position.set(0, 7, -3); g.add(grip);
      const chuck = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 3.4, 5, 12), metal('#9aa3ad')); chuck.rotation.x = Math.PI / 2; chuck.position.z = 14; g.add(chuck);
      const bit = new THREE.Mesh(new THREE.ConeGeometry(1.4, 16, 8), metal('#c9d1d9', 0.2)); bit.rotation.x = Math.PI / 2; bit.position.z = 24; g.add(bit);
      g.userData.bit = bit; return g;
    }
    function jug() {
      const pts = []; for (let i = 0; i <= 12; i++) { const t = i / 12; pts.push(new THREE.Vector2(9 + Math.sin(t * Math.PI) * 6 - t * 3, t * 26 - 13)); }
      const g = new THREE.Group(), m = new THREE.Mesh(new THREE.LatheGeometry(pts, 22), new THREE.MeshStandardMaterial({ color: '#dfe9f2', roughness: 0.35, side: THREE.DoubleSide }));
      g.add(m);
      const band = new THREE.Mesh(new THREE.TorusGeometry(13.6, 0.9, 6, 30), matte('#3d7ab8')); band.rotation.x = Math.PI / 2; band.position.y = 1; g.add(band);
      const spout = new THREE.Mesh(new THREE.ConeGeometry(3, 8, 10, 1, true), new THREE.MeshStandardMaterial({ color: '#dfe9f2', side: THREE.DoubleSide })); spout.position.set(-9, 12, 0); spout.rotation.z = 0.9; g.add(spout);
      const water = new THREE.Mesh(new THREE.CircleGeometry(8.5, 20), new THREE.MeshStandardMaterial({ color: '#3f8fb8', roughness: 0.15 })); water.rotation.x = -Math.PI / 2; water.position.y = 10; g.add(water);
      g.userData.spout = spout; return g;
    }
    function lampHead() {
      const g = new THREE.Group();
      const shade = new THREE.Mesh(new THREE.ConeGeometry(17, 13, 24, 1, true), new THREE.MeshStandardMaterial({ color: '#2f3b4a', roughness: 0.5, metalness: 0.4, side: THREE.DoubleSide })); g.add(shade);
      const rim = new THREE.Mesh(new THREE.TorusGeometry(17, 0.8, 6, 32), metal('#c9b27a')); rim.rotation.x = Math.PI / 2; rim.position.y = -6.5; g.add(rim);
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(6, 16, 12), new THREE.MeshBasicMaterial({ color: '#fff1c4' })); bulb.position.y = -4; g.add(bulb);
      const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: '#ffb35a', transparent: true, opacity: 0.85, depthWrite: false, blending: THREE.AdditiveBlending })); glow.scale.setScalar(60); glow.position.y = -6; g.add(glow);
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 160, 8), metal('#5a6470')); arm.position.y = 86; g.add(arm);
      g.userData = { bulb, glow }; return g;
    }
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

    /* =============== Mỗi quyền năng: bàn tay làm gì =============== */
    // vị trí bàn tay khi làm việc với vách kính của một đảo: ngoài vòm, ngón chĩa vào chỗ chạm
    function glassApproach(H, L, gp, back, pz) {
      const n = gp.clone().normalize(), from = gp.clone().addScaledVector(n, 34 + back), at = gp.clone().addScaledVector(n, -20);
      const side = v3(0, 0, 0).crossVectors(n, UP).normalize();
      from.addScaledVector(side, 9.4); at.addScaledVector(side, 9.4); // ngón trỏ lệch khỏi tâm bàn tay
      place(H, from, at); void pz;
      return { n, from, at, side };
    }
    function moveAlong(H, a, b, u) { H.g.position.copy(a).lerp(b, u); }
    // gõ kính: ngón trỏ gõ ba lần
    function tap(L, fx, done) {
      const H = hands[0], gp = glassOf(L), { n, from, side } = glassApproach(H, L, gp, 60);
      const near = gp.clone().addScaledVector(n, 42).addScaledVector(side, 9.4); // đầu ngón trỏ vừa chạm kính
      pose(H, 'point'); let knocks = 0;
      run(3600, (u) => {
        const inU = ease(seg(u, 0, 0.3)), outU = ease(seg(u, 0.8, 1));
        const k = seg(u, 0.32, 0.78), bounce = k > 0 && k < 1 ? Math.abs(Math.sin(k * Math.PI * 3)) : 0;
        H.g.position.copy(from).lerp(near, inU * (1 - outU)).addScaledVector(n, bounce * 7);
        const nk = Math.floor(k * 3 + 0.5); if (k > 0 && nk > knocks && nk <= 3) { knocks = nk; glassRipple(gp, '#dff3ff', 18); shake(260); sfx('knock', 1); if (knocks === 1) done(); }
      }, () => hide(H));
      later(1300, () => { god3d.fxs.quake(L, { after: true, firms: [] }); });
    }
    // khoan lỗ thở
    function vent(L, fx, done) {
      const H = hands[0], gp = glassOf(L), { n, from, side } = glassApproach(H, L, gp, 60), dr = drill();
      H.hold.add(dr); H.hold.position.set(-9.4, -2, 4); pose(H, 'grip');
      const near = gp.clone().addScaledVector(n, 38).addScaledVector(side, 9.4); // mũi khoan vừa chạm kính
      let hit = false;
      run(4200, (u, ms) => {
        const inU = ease(seg(u, 0, 0.28)), push = seg(u, 0.3, 0.7), outU = ease(seg(u, 0.8, 1));
        H.g.position.copy(from).lerp(near, inU * (1 - outU)).addScaledVector(n, -push * 6 * (1 - outU));
        dr.userData.bit.rotation.y = ms * 0.05;
        if (push > 0 && push < 1 && !reduce && rnd() < 0.5) PR.flash(gp.clone().addScaledVector(n, 0.5), 2 + rnd() * 2, '#fff1c4');
        if (push >= 1 && !hit) { hit = true; glassRipple(gp, '#bff5c8', 10); done(); sfx('bless');
          PR.particles(L, fx.risk === 'locusts' ? '#5a6b2a' : fx.risk === 'cold' ? '#f4fbff' : '#bff5c8', fx.risk ? 90 : 60, fx.risk === 'locusts' ? 0.5 : 0.7, fx.risk === 'locusts' ? 'swarm' : fx.risk === 'cold' ? 'fall' : 'drift', 9000); }
      }, () => { H.hold.position.set(-4, -9, 14); hide(H); });
      sfx('drill');
    }
    // làm nứt kính: nắm tay đấm một cú
    function crack(L, fx, done) {
      const H = hands[0], gp = glassOf(L), { n, from } = glassApproach(H, L, gp, 70);
      pose(H, 'fist');
      const near = gp.clone().addScaledVector(n, 21); // mặt nắm tay vừa chạm kính
      let hit = false;
      run(3200, (u) => {
        const wind = seg(u, 0, 0.35), strike = seg(u, 0.35, 0.45), outU = ease(seg(u, 0.75, 1));
        const p = from.clone().lerp(near, ease(wind) * 0.75 + strike * 0.25).addScaledVector(n, outU * 40);
        H.g.position.copy(p);
        if (strike >= 1 && !hit) { hit = true; shake(700); sfx('crack', 2); glassRipple(gp, '#ffffff', 24); PR.flash(gp, 18, '#ffffff'); done(); }
      }, () => hide(H));
    }
    // đập vỡ kính: nắm tay đấm xuyên vòm, mảnh kính rơi như mưa xuống đảo
    function shatter(L, fx, done) {
      const H = hands[0], gp = glassOf(L), { n, from } = glassApproach(H, L, gp, 90);
      pose(H, 'fist');
      const through = gp.clone().addScaledVector(n, 8); // nắm tay xuyên qua vòm
      let hit = false;
      run(4200, (u) => {
        const wind = ease(seg(u, 0, 0.4)), strike = seg(u, 0.4, 0.5), outU = ease(seg(u, 0.72, 1));
        const p = from.clone().lerp(gp.clone().addScaledVector(n, 62), wind).lerp(through, strike).addScaledVector(n, outU * 70);
        H.g.position.copy(p);
        if (strike >= 1 && !hit) {
          hit = true; shake(1600); sfx('crack', 4); sfx('rumble', 3); glassRipple(gp, '#e9dcff', 34); PR.flash(gp, 40, '#f4e8ff'); done();
          // mảnh kính rơi xuống đảo
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
        }
      }, () => hide(H));
    }
    // vá kính: lòng bàn tay áp miếng kính mới lên chỗ nứt, chỗ vỡ
    function patch(L, fx, done) {
      const H = hands[0], gp = glassOf(L), n = gp.clone().normalize();
      const pl = new THREE.Group();
      const sheet = new THREE.Mesh(new THREE.PlaneGeometry(fx.was === 'broken' ? 34 : 24, fx.was === 'broken' ? 34 : 24), new THREE.MeshBasicMaterial({ color: '#d9f1ff', transparent: true, opacity: 0.45, side: THREE.DoubleSide, depthWrite: false }));
      pl.add(sheet);
      for (const [x, y, w, h] of [[0, 12, 28, 3], [0, -12, 28, 3], [12, 0, 3, 28], [-12, 0, 3, 28]]) { const t = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: '#efe3c2', transparent: true, opacity: 0.85, side: THREE.DoubleSide, depthWrite: false })); t.position.set(x * (fx.was === 'broken' ? 1.3 : 1), y * (fx.was === 'broken' ? 1.3 : 1), 0.05); pl.add(t); }
      pl.traverse((o) => { o.userData.noFade = true; o.raycast = () => {}; });
      const from = gp.clone().addScaledVector(n, 80), t = UP.clone().addScaledVector(n, -n.y).normalize(); // t: dọc mặt vòm lên trên
      pose(H, 'flat');
      pl.position.copy(from); pl.lookAt(0, 0, 0); scene.add(pl);
      let hit = false;
      run(3600, (u) => {
        const inU = ease(seg(u, 0, 0.45)), outU = ease(seg(u, 0.7, 1));
        const p = from.clone().lerp(gp.clone().addScaledVector(n, 1.2), inU);
        pl.position.copy(p);
        const hp = p.clone().addScaledVector(n, 7.5 + outU * 70).addScaledVector(t, -8); place(H, hp, hp.clone().add(t), n); // lòng bàn tay áp vào kính
        if (inU >= 1 && !hit) { hit = true; glassRipple(gp, '#9fd3f0', 14); sfx('bless'); done(); }
      }, () => {
        hide(H);
        run(30000, (u) => { pl.children.forEach((o) => { o.material.opacity = (o === sheet ? 0.45 : 0.85) * (1 - u); }); }, () => kill(pl));
      });
    }
    // bàn tay úp trên đảo, ngoài vòm: dùng cho che đèn, thả đồ, kéo đèn
    function overIsland(L, x, z, lift) {
      const a = azOf(L), top = domePt(a, OUTER_EL, DOME), inw = v3(-Math.cos(a), 0, -Math.sin(a));
      void x; void z;
      return { top, pos: domePt(a, OUTER_EL, DOME + lift), inw };
    }
    // lấy tay che đèn: bàn tay xoè ra che trên đảo bao lâu còn tối
    function shade(L, fx, done) {
      const H = shadeHand, o = overIsland(L, 0, 0, 30), far = o.pos.clone().add(v3(0, 26, 0)).addScaledVector(o.inw, -75); // lướt vào từ phía ngoài bể
      pose(H, 'flat'); place(H, far, far.clone().addScaledVector(o.inw, 10));
      H.busy = 1;
      run(2200, (u) => { const k = ease(u); H.g.position.copy(far).lerp(o.pos.clone().addScaledVector(o.inw, -20), k); H.g.lookAt(H.g.position.clone().addScaledVector(o.inw, 10)); if (u >= 1) done(); }, () => { shades[L.i] = { H, pos: H.g.position.clone(), inw: o.inw }; });
      PR.torches && PR.torches(L);
    }
    // kéo đèn lại gần: một ngọn đèn bàn hạ xuống sát vòm, đỏ rực
    function lamp(L, fx, done) {
      const lp = lampHead(), o = overIsland(L, fx.at ? fx.at.x : 0, fx.at ? fx.at.z : 0, 16);
      lp.position.copy(o.pos).add(v3(0, 140, 0)); scene.add(lp);
      const H = hands[0]; pose(H, 'grip');
      lamps[L.i] = { g: lp, base: o.pos.clone(), floor: softDisc(L, '#ff8a3a', lands3d.LAND_R * 1.2, 0.45, true) };
      run(2600, (u) => {
        const k = ease(u); lp.position.copy(o.pos).add(v3(0, 140 * (1 - k), 0));
        lp.userData.glow.material.opacity = 0.5 + 0.4 * k; lp.userData.glow.scale.setScalar(40 + 50 * k);
        place(H, lp.position.clone().add(v3(0, 60, 0)).addScaledVector(o.inw, -26), lp.position.clone().add(v3(0, 40, 0)));
        if (u >= 1) { hide(H); done(); god3d.fxs.drought(L, { days: 30 }); if (fx.melt) god3d.fxs.flood(L, { days: 20, firms: [] }); for (let i = 0; i < 12 && !reduce; i++) puff(L.center.clone().add(v3((rnd() - 0.5) * 50, 1, (rnd() - 0.5) * 50)), true, '#5a4a3a'); }
      });
      sfx('gust', 3);
    }
    // thả đồ vật xuống đảo: đồng xu, hạt giống, viên sỏi
    function drop(L, fx, done, kind) {
      const x = fx.at ? fx.at.x : 0, z = fx.at ? fx.at.z : 0, o = overIsland(L, x, z, 26), H = hands[0];
      const obj = kind === 'coin' ? coinMesh() : kind === 'seed' ? seedMesh() : rockMesh(4.2);
      if (kind === 'coin') obj.rotation.x = Math.PI / 2;
      const ground = L.center.clone().add(v3(x, kind === 'coin' ? 4.5 : kind === 'seed' ? 1 : 1.6, z));
      const hold = o.pos.clone().add(v3(0, -6, 0));
      place(H, o.pos.clone().add(v3(0, 60, 0)).addScaledVector(o.inw, -30), o.pos.clone().addScaledVector(o.inw, 10)); pose(H, 'pinch');
      obj.position.copy(hold); scene.add(obj);
      let fell = false, crossed = false;
      run(4400, (u) => {
        const inU = ease(seg(u, 0, 0.3)), f = seg(u, 0.36, kind === 'pebble' ? 0.6 : 0.72), outU = ease(seg(u, 0.4, 0.8));
        H.g.position.copy(o.pos.clone().add(v3(0, 60, 0)).addScaledVector(o.inw, -30)).lerp(o.pos.clone().add(v3(0, 8, 0)).addScaledVector(o.inw, -14), inU * (1 - outU));
        if (u > 0.36) pose(H, 'pinch', 'open', seg(u, 0.36, 0.45));
        if (f <= 0) obj.position.copy(H.g.position).add(v3(0, -10, 0)).addScaledVector(o.inw, 18);
        else {
          const from = obj.userData.from || (obj.userData.from = obj.position.clone());
          obj.position.copy(from).lerp(ground, f * f);
          if (kind === 'coin') obj.rotation.z += 0.12 * (1 - f); else obj.rotation.x += 0.05;
          if (!crossed && obj.position.y < o.top.y) { crossed = true; glassRipple(o.top.clone().normalize().multiplyScalar(DOME - 0.2), kind === 'pebble' ? '#ffb3a8' : '#fff1c4', 10); }
        }
        if (f >= 1 && !fell) {
          fell = true; done();
          if (kind === 'pebble') { PR.explosion(ground.clone().setY(0.5), 6); PR.crater(ground.clone(), 6.5, 60000); shake(1000); sfx('boom'); rocks[L.i] = { m: obj, day: W.day }; }
          else if (kind === 'coin') { shake(500); PR.ring(ground.clone().setY(0.4), '#ffd36b', 14, 1600); PR.flash(ground.clone().setY(5), 24, '#ffe9a8'); for (let i = 0; i < 10 && !reduce; i++) puff(ground.clone().add(v3((rnd() - 0.5) * 6, 0.6, (rnd() - 0.5) * 6)), true, '#b9ab98'); coins[L.i] = { m: obj, day: W.day }; sfx('chime'); }
          else { PR.ring(ground.clone().setY(0.3), '#bff5c8', 10, 1600); sfx('bless'); kill(obj); }
        }
      }, () => hide(H));
    }
    // mực nước: đổ thêm bằng bình, rút bớt bằng ống
    const viewSide = (fx, turn) => { const a = (fx.view == null ? 0.4 : fx.view) + (turn || 0); return v3(Math.cos(a), 0, Math.sin(a)); };
    function pour(fx, done) {
      const H = hands[0], g = jug(), top = v3(0, DOME + 30, 0), side = viewSide(fx, 0.5);
      g.position.copy(top).addScaledVector(side, 40); scene.add(g);
      const stream = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 3.6, 1, 14, 1, true), new THREE.MeshStandardMaterial({ color: '#4f9fd0', transparent: true, opacity: 0.7, emissive: '#16405a', emissiveIntensity: 0.4, depthWrite: false }));
      stream.visible = false; scene.add(stream);
      pose(H, 'grip');
      let splashT = 0, said = false;
      run(6200, (u, ms) => {
        const inU = ease(seg(u, 0, 0.2)), tilt = ease(seg(u, 0.2, 0.32)) * (1 - ease(seg(u, 0.78, 0.9))), outU = ease(seg(u, 0.88, 1));
        g.position.copy(top).addScaledVector(side, 40 + (1 - inU) * 120 + outU * 120).setY(top.y + 10);
        g.rotation.z = tilt * 1.6; g.rotation.y = -Math.atan2(side.z, side.x);
        place(H, g.position.clone().addScaledVector(side, 30).add(v3(0, 6, 0)), g.position.clone().add(v3(0, 4, 0)));
        const pouring = tilt > 0.6;
        stream.visible = pouring;
        if (pouring) {
          const sp = g.userData.spout.getWorldPosition(v3(0, 0, 0)), end = v3(0, war3d.SEA_Y + war3d.seaDy, 0);
          const len = sp.distanceTo(end); stream.scale.set(1, len, 1); stream.position.copy(sp).lerp(end, 0.5); stream.lookAt(end); stream.rotateX(Math.PI / 2);
          if (!said) { said = true; done(); sfx('surge', 5); }
          if (ms > splashT && !reduce) { splashT = ms + 140; puff(v3((rnd() - 0.5) * 8, war3d.SEA_Y + war3d.seaDy + 0.5, (rnd() - 0.5) * 8), false, '#eef6fb'); if (rnd() < 0.3) PR.ring(v3(0, war3d.SEA_Y + war3d.seaDy + 0.1, 0), '#dff3ff', 30, 2200); }
        }
      }, () => { kill(g); kill(stream); hide(H); });
    }
    function drain(fx, done) {
      const sd = viewSide(fx, -0.9), H = hands[0], out = sd.clone().multiplyScalar(250).setY(150), over = sd.clone().multiplyScalar(60).setY(DOME + 24), down = v3(0, war3d.SEA_Y - 1.5, 0);
      const curve = new THREE.CatmullRomCurve3([out, sd.clone().multiplyScalar(150).setY(DOME + 10), over, sd.clone().multiplyScalar(20).setY(120), down]);
      const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 80, 2.2, 10, false), new THREE.MeshStandardMaterial({ color: '#7fae6a', roughness: 0.55, transparent: true, opacity: 0.92 }));
      tube.userData.noFade = true; scene.add(tube);
      tube.geometry.setDrawRange(0, 0);
      const total = tube.geometry.index ? tube.geometry.index.count : tube.geometry.attributes.position.count;
      pose(H, 'grip');
      let said = false, bubT = 0;
      run(6400, (u, ms) => {
        const grow = ease(seg(u, 0, 0.35)), outU = ease(seg(u, 0.85, 1));
        tube.geometry.setDrawRange(0, Math.floor(total * grow));
        tube.material.opacity = 0.92 * (1 - outU);
        place(H, out.clone().add(v3(30, -10, 10)), out.clone());
        if (grow >= 1 && !said) { said = true; done(); sfx('surge', 3); }
        if (grow >= 1 && outU < 0.5 && ms > bubT && !reduce) { bubT = ms + 160; puff(v3((rnd() - 0.5) * 6, war3d.SEA_Y + war3d.seaDy + 0.4, (rnd() - 0.5) * 6), false, '#cfe8ff'); }
      }, () => { kill(tube); hide(H); });
    }
    // nghiêng bể: hai tay nâng một bên vành, cả bể nghiêng, nước dồn về đảo được chạm
    function tilt(L, fx, done) {
      const a = azOf(L), hi = a + Math.PI, axis = v3(-Math.sin(a), 0, Math.cos(a)); // trục nghiêng: vuông góc hướng đảo
      const A = hands[0], B = hands[1];
      for (const [H, da] of [[A, -0.35], [B, 0.35]]) { const p = domePt(hi + da, 0.05, DOME + 30); pose(H, 'claw'); place(H, p.clone().add(v3(0, -8, 0)), v3(0, 10, 0)); }
      let said = false;
      run(5600, (u) => {
        const up = ease(seg(u, 0.15, 0.4)), hold = seg(u, 0.4, 0.7), back = ease(seg(u, 0.7, 0.95));
        const ang = 0.06 * up * (1 - back), slosh = back > 0 ? Math.sin(back * Math.PI * 3) * 0.03 * (1 - back) : 0;
        scene.quaternion.setFromAxisAngle(axis, ang);
        tw.x = -(ang * 0.85 + slosh) * axis.x; tw.z = -(ang * 0.85 + slosh) * axis.z; war3d.setSea(seaNow, tw.x, tw.z); // mặt nước giữ phẳng rồi sóng sánh lại
        for (const [H, da] of [[A, -0.35], [B, 0.35]]) { const p = domePt(hi + da, 0.05 + up * 0.08 * (1 - back), DOME + 30); H.g.position.copy(p.add(v3(0, -8 + up * 10 * (1 - back), 0))); }
        if (up >= 1 && !said) { said = true; done(); shake(1200); sfx('surge', 6); for (const j of fx.sides || [L.i]) if (lands[j]) god3d.fxs.tsunami(lands[j]); }
        void hold;
      }, () => { scene.quaternion.identity(); tw.x = tw.z = 0; war3d.setSea(seaNow, 0, 0); hide(A); hide(B); });
    }
    // mở nắp bể: nắp tròn trên đỉnh vòm bật lên, gió, mưa, lá khô rơi vào
    function lid(fx, done) {
      const H = hands[0], cap = new THREE.Group(), R = Math.sqrt(DOME * DOME - (DOME - 8) * (DOME - 8));
      const disc = new THREE.Mesh(new THREE.CylinderGeometry(R, R, 2, 48), new THREE.MeshStandardMaterial({ color: '#dff3ff', transparent: true, opacity: 0.35, roughness: 0.1, depthWrite: false }));
      const knob = new THREE.Mesh(new THREE.SphereGeometry(5, 14, 10), metal('#c9a35a')); knob.position.y = 4;
      const rim = new THREE.Mesh(new THREE.TorusGeometry(R, 1.4, 8, 64), metal('#c9a35a')); rim.rotation.x = Math.PI / 2;
      cap.add(disc, knob, rim); cap.position.set(0, DOME - 8, 0); scene.add(cap);
      const hinge = v3(R, DOME - 8, 0);
      pose(H, 'pinch');
      let said = false;
      run(7200, (u) => {
        const open = ease(seg(u, 0.12, 0.32)) * (1 - ease(seg(u, 0.78, 0.92))), fade = seg(u, 0.92, 1);
        cap.position.copy(hinge).add(v3(-R * Math.cos(open * 1.7), R * Math.sin(open * 1.7), 0));
        cap.rotation.z = open * 1.7;
        disc.material.opacity = 0.35 * (1 - fade);
        place(H, cap.position.clone().add(v3(-8, 40, 0)), cap.position.clone().add(v3(0, 4, 0)));
        if (open > 0.95 && !said) {
          said = true; done(); sfx('gust', 6); if (K.doRain) K.doRain();
          for (const L of lands) if (W.cities[L.i].settled) PR.particles(L, '#c98a3a', 50, 0.9, 'fall', 8000);
          if (fx.bugs != null && lands[fx.bugs]) later(1500, () => PR.particles(lands[fx.bugs], '#4f5f23', 120, 0.45, 'swarm', 14000));
        }
      }, () => { kill(cap); hide(H); });
    }
    // lắc bể: hai bàn tay nắm vành đồng hai bên mà lắc
    function shakeAll(fx, done) {
      const A = hands[0], B = hands[1], base = scene.position.clone(), ca = fx.view != null ? fx.view : camera ? Math.atan2(camera.position.z, camera.position.x) : 0;
      for (const [H, a] of [[A, ca - 1.15], [B, ca + 1.15]]) { pose(H, 'claw'); const p = domePt(a, 0.02, DOME + 30); place(H, p.clone().add(v3(0, -6, 0)), v3(0, 0, 0)); H.a = a; }
      let said = false;
      run(4200, (u, ms) => {
        const amp = Math.sin(seg(u, 0.12, 0.85) * Math.PI) * (reduce ? 0.3 : 2.4);
        const ox = Math.sin(ms * 0.045) * amp, oz = Math.cos(ms * 0.037) * amp * 0.6;
        scene.position.set(base.x + ox, base.y, base.z + oz);
        for (const H of [A, B]) { const p = domePt(H.a, 0.02, DOME + 30); H.g.position.copy(p.add(v3(ox, -6, oz))); }
        if (amp > 1 && !said) {
          said = true; done(); shake(3000); sfx('rumble', 5);
          for (const L of lands) if (W.cities[L.i].settled) god3d.fxs.quake(L, { firms: [] });
        }
      }, () => { scene.position.copy(base); hide(A); hide(B); });
    }

    /* =============== Dấu vết bền trên bể =============== */
    const marks = lands.map(() => ({})), shades = [], lamps = [], coins = [], rocks = [];
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
        // bàn tay che đèn ở lại bao lâu còn tối
        const dark = c.settled && (c.dark || 0) > W.day;
        if (dark && !M.dark) { M.dark = softDisc(L, '#04060f', lands3d.LAND_R * 1.35, 0.4); M.darkAir = softHaze(L.center.clone().setY(14), '#05070f', lands3d.LAND_R * 2.6); }
        if (!dark && M.dark) {
          const m = M.dark, h = M.darkAir; M.dark = M.darkAir = null; run(2000, (u) => { m.material.opacity = 0.72 * (1 - u); if (h) h.material.opacity = 0.4 * (1 - u); }, () => { kill(m); kill(h); });
          const S = shades[i]; if (S) { shades[i] = null; const from = S.H.g.position.clone(); run(1800, (u) => { S.H.g.position.copy(from).add(v3(0, 90 * ease(u), 0)).addScaledVector(S.inw, -80 * ease(u)); }, () => { hide(S.H); S.H.busy = 0; }); }
        }
        // ngọn đèn kéo xa dần khi hết nóng
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
      // mặt biển dâng hạ theo bàn tay
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
        const S = shades[L.i]; if (S && !reduce) S.H.g.position.y = S.pos.y + Math.sin(t * 0.0015) * 1.5;
      }
    }

    /* =============== Bàn tay ra tay =============== */
    const HIT = { tap: 1500, vent: 2300, crack: 1400, shatter: 2000, patch: 1600, pour: 1500, drain: 2300, tilt: 2300, shade: 2200, lamp: 2600, lid: 2400, coin: 3200, seed: 3200, pebble: 2700, shake: 900 };
    function play(fx, onHit) {
      const L = fx.city >= 0 ? lands[fx.city] : null;
      let fired = false;
      const done = () => { if (fired) return; fired = true; if (onHit) try { onHit(); } catch (err) { console.error('hand3d hit', fx.key, err); } };
      const k = fx.key;
      holdUntil = now() + (HIT[k] || 1500) + 700;
      later((HIT[k] || 1500) + 1200, done); // lưới an toàn: hậu quả luôn hiện dù hình ảnh lỗi
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
      } catch (err) { console.error('hand3d', k, err); holdUntil = 0; done(); }
    }
    return {
      play, update, syncDay, spotAt, glassOf, hands,
      get holdUntil() { return holdUntil; }, get active() { return active.length; },
    };
  }
  root.Hand3D = { create };
})(typeof self !== 'undefined' ? self : this);
