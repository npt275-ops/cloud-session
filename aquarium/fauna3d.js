/* Bể Kính — thú hoang và thợ săn trên bãi săn của mỗi miền.
 * Thời nguyên thủy là khủng long, cá sấu khổng lồ, voi ma mút, thằn lằn bay, thằn lằn cổ dài dưới biển trong.
 * Sau đó là thú lớn (bò rừng, hươu sừng, dê núi, tuần lộc, linh dương, lạc đà), rồi thú nhỏ; từ thời tên lửa không còn ai đi săn.
 * Số thú đi lại theo trữ lượng thú của thành trong bản mô phỏng; mỗi lần thợ săn hạ được một con, con thú ngã xuống trước mắt. */
(function (root) {
  'use strict';
  function create(K) {
    const { THREE, scene, Sim, W, lands3d, war3d, puff, reduce } = K;
    const TAU = Math.PI * 2, lands = lands3d.lands, F = lands3d.fig;
    const MATS = {};
    const lam = (c) => MATS[c] || (MATS[c] = new THREE.MeshStandardMaterial({ color: c, flatShading: true, roughness: 0.85 }));
    const BOX = new THREE.BoxGeometry(1, 1, 1), SPH = new THREE.SphereGeometry(1, 9, 6), CONE = new THREE.ConeGeometry(1, 1, 7), CYL = new THREE.CylinderGeometry(1, 1, 1, 7);
    function part(parent, geo, c, x, y, z, sx, sy, sz, rx, ry, rz) { const m = new THREE.Mesh(geo, lam(c)); m.position.set(x, y, z); m.scale.set(sx, sy, sz); m.rotation.set(rx || 0, ry || 0, rz || 0); m.castShadow = sx * sy * sz > 0.25; parent.add(m); return m; } // chỉ khối lớn đổ bóng cho nhẹ máy
    function limb(parent, c, x, y, z, w, h, d) { const pv = new THREE.Group(); pv.position.set(x, y, z); part(pv, BOX, c, 0, -h / 2, 0, w, h, d); parent.add(pv); return pv; }

    /* =============== Khủng long và thú tiền sử =============== */
    function beast(kind) {
      const g = new THREE.Group(), legs = [], ex = {};
      if (kind === 'sauropod') { const M = '#7f8f5a'; part(g, SPH, M, 0, 3, 0, 1.3, 1, 2.2); const neck = new THREE.Group(); neck.position.set(0, 3.6, 1.8); g.add(neck); part(neck, CYL, M, 0, 2, 0.7, 0.45, 4.5, 0.45, 0.4); part(neck, SPH, M, 0, 4.2, 1.7, 0.5, 0.4, 0.75); ex.neck = neck; part(g, CONE, M, 0, 2.8, -3.6, 0.6, 4.5, 0.6, -Math.PI / 2 - 0.2); for (const [x, z] of [[-0.8, 1.2], [0.8, 1.2], [-0.8, -1.2], [0.8, -1.2]]) legs.push(limb(g, M, x, 2.6, z, 0.55, 2.6, 0.55)); }
      else if (kind === 'trex') { const M = '#6b5a3a'; part(g, SPH, M, 0, 2.6, 0, 0.9, 1, 1.6, -0.25); part(g, BOX, M, 0, 3.6, 1.6, 0.9, 0.9, 1.5, 0.15); part(g, BOX, '#e8d9c0', 0, 3.1, 1.75, 0.8, 0.25, 1.3); part(g, CONE, M, 0, 2.6, -2.2, 0.55, 3.2, 0.55, -Math.PI / 2 - 0.3); for (const x of [-0.5, 0.5]) legs.push(limb(g, M, x, 2.2, -0.2, 0.45, 2.2, 0.55)); }
      else if (kind === 'tri') { const M = '#8a7a5a'; part(g, SPH, M, 0, 1.6, 0, 1, 0.85, 1.6); part(g, CYL, '#c27a4a', 0, 2.2, 1.6, 1.1, 0.2, 1.1, Math.PI / 2 - 0.5); part(g, BOX, M, 0, 1.7, 1.9, 0.7, 0.6, 0.9); for (const [x, y, z, rx] of [[-0.35, 2.3, 2.1, 1.1], [0.35, 2.3, 2.1, 1.1], [0, 1.7, 2.5, 1.4]]) part(g, CONE, '#efe6d2', x, y, z, 0.12, 0.9, 0.12, rx); for (const [x, z] of [[-0.6, 0.8], [0.6, 0.8], [-0.6, -0.8], [0.6, -0.8]]) legs.push(limb(g, M, x, 1.2, z, 0.4, 1.2, 0.4)); }
      else if (kind === 'raptor') { const M = '#9a6b3a'; part(g, SPH, M, 0, 1.4, 0, 0.4, 0.45, 0.8, -0.2); part(g, BOX, M, 0, 1.9, 0.8, 0.4, 0.4, 0.7); part(g, CONE, M, 0, 1.4, -1.1, 0.25, 1.6, 0.25, -Math.PI / 2 - 0.2); for (const x of [-0.22, 0.22]) legs.push(limb(g, M, x, 1.2, 0, 0.18, 1.2, 0.22)); }
      else if (kind === 'mammoth') { const M = '#6b4a32'; part(g, SPH, M, 0, 2.4, 0, 1.2, 1.2, 1.56); part(g, SPH, M, 0, 3, 1.5, 0.75, 0.75, 0.75); part(g, CYL, M, 0, 2, 2.1, 0.2, 1.8, 0.2, 0.3); for (const x of [-0.35, 0.35]) part(g, CONE, '#efe6d2', x, 2.3, 2.2, 0.1, 1.4, 0.1, 1.9); for (const [x, z] of [[-0.6, 0.7], [0.6, 0.7], [-0.6, -0.7], [0.6, -0.7]]) legs.push(limb(g, M, x, 1.6, z, 0.5, 1.6, 0.5)); }
      else if (kind === 'croc') { const M = '#4f6b3a'; part(g, BOX, M, 0, 0.35, 0, 0.8, 0.35, 2.6); part(g, BOX, M, 0, 0.35, 1.8, 0.45, 0.25, 1.2); part(g, CONE, M, 0, 0.35, -2.1, 0.3, 1.8, 0.3, -Math.PI / 2); for (const [x, z] of [[-0.5, 0.7], [0.5, 0.7], [-0.5, -0.7], [0.5, -0.7]]) legs.push(limb(g, M, x, 0.35, z, 0.18, 0.35, 0.3)); }
      else if (kind === 'ptero') { const M = '#a0785a'; part(g, BOX, M, 0, 0, 0, 0.3, 0.3, 1.2); part(g, CONE, M, 0, 0.1, 0.9, 0.12, 1, 0.12, Math.PI / 2); for (const sd of [-1, 1]) { const w = new THREE.Group(); w.position.set(sd * 0.15, 0, 0); part(w, BOX, '#c8a07a', sd * 1.2, 0, 0, 2.4, 0.05, 0.9); g.add(w); legs.push(w); } ex.fly = 18; }
      else if (kind === 'fly') { part(g, BOX, '#3f7fd6', 0, 0, 0, 0.15, 0.15, 1.4); for (const sd of [-1, 1]) for (const z of [-0.2, 0.2]) { const w = new THREE.Group(); w.position.set(sd * 0.08, 0.05, z); const m = new THREE.Mesh(BOX, new THREE.MeshStandardMaterial({ color: '#cfe8f5', transparent: true, opacity: 0.6 })); m.position.x = sd * 0.55; m.scale.set(1.1, 0.02, 0.25); w.add(m); g.add(w); legs.push(w); } ex.fly = 4; }
      else if (kind === 'plesio') { const M = '#3b5a5c'; part(g, SPH, M, 0, 0, 0, 1.4, 0.6, 2.2); part(g, CYL, M, 0, 1.6, 2.4, 0.32, 4, 0.32, 0.7); part(g, SPH, M, 0, 3.2, 3.6, 0.4, 0.32, 0.56); for (const [x, z] of [[-1.3, 1], [1.3, 1], [-1.2, -1.2], [1.2, -1.2]]) legs.push(limb(g, M, x, 0, z, 1.6, 0.1, 0.6)); }
      else return quad(kind);
      return { g, legs, ex, kind };
    }
    /* =============== Thú bốn chân của các thời sau =============== */
    const Q = {
      bison: { c: '#5b4030', b: [1.1, 0.9, 1.7], leg: 0.8, head: 0.5, low: true, hump: true, horn: 'short' },
      deer: { c: '#a0785a', b: [0.5, 0.55, 1.0], leg: 0.85, head: 0.32, horn: 'antler' },
      elk: { c: '#7a5a3a', b: [0.7, 0.75, 1.4], leg: 1.0, head: 0.4, horn: 'antler', big: true },
      boar: { c: '#4a3a30', b: [0.55, 0.5, 1.0], leg: 0.4, head: 0.36, low: true, horn: 'tusk' },
      goat: { c: '#e8e0d0', b: [0.45, 0.45, 0.8], leg: 0.55, head: 0.3, horn: 'curl' },
      reindeer: { c: '#8a6a4a', b: [0.6, 0.6, 1.15], leg: 0.85, head: 0.34, horn: 'antler', neck: '#efe6d2' },
      fox: { c: '#eef3f6', b: [0.28, 0.28, 0.65], leg: 0.32, head: 0.22, tail: true },
      oryx: { c: '#e2c79a', b: [0.5, 0.55, 1.05], leg: 0.9, head: 0.3, horn: 'long' },
      camel: { c: '#c9a06e', b: [0.6, 0.65, 1.3], leg: 1.2, head: 0.3, hump: true, neckLong: true },
      turtle: { c: '#5b6b3a', b: [0.9, 0.45, 1.1], leg: 0.12, head: 0.22, shell: true },
    };
    function quad(kind) {
      const o = Q[kind] || Q.deer, g = new THREE.Group(), legs = [], M = o.c, [w, h, l] = o.b, y0 = o.leg + h / 2;
      if (o.shell) { part(g, SPH, '#6b5a3a', 0, 0.25, 0, w / 2, h, l / 2); part(g, SPH, M, 0, 0.18, l / 2 + 0.1, o.head * 0.8, o.head * 0.7, o.head); for (const [x, z] of [[-w * 0.4, l * 0.3], [w * 0.4, l * 0.3], [-w * 0.4, -l * 0.3], [w * 0.4, -l * 0.3]]) legs.push(limb(g, M, x, 0.2, z, 0.16, 0.2, 0.22)); return { g, legs, ex: { slow: true }, kind }; }
      part(g, SPH, M, 0, y0, 0, w / 2, h / 2, l / 2);
      if (o.hump) part(g, SPH, M, 0, y0 + h * 0.45, o.neckLong ? -0.1 : l * 0.15, w * 0.35, h * 0.45, l * 0.25);
      const hy = o.low ? y0 + h * 0.05 : y0 + h * 0.55, hz = l / 2 + o.head * 0.6;
      if (o.neckLong) { part(g, BOX, M, 0, y0 + h * 0.7, l / 2 + 0.05, 0.16, 0.9, 0.18, -0.5); part(g, BOX, M, 0, y0 + h * 1.15, l / 2 + 0.45, 0.16, 0.18, 0.4); }
      else { part(g, SPH, o.neck || M, 0, hy - o.head * 0.3, l / 2, o.head * 0.7, o.head, o.head * 0.7); part(g, BOX, M, 0, hy, hz, o.head * 1.1, o.head * 1.0, o.head * 1.6); }
      if (o.horn === 'antler') for (const sd of [-1, 1]) { part(g, BOX, '#c8b07a', sd * 0.12, hy + o.head * 0.9, hz - 0.1, 0.04, o.big ? 0.7 : 0.45, 0.04, 0, 0, sd * 0.45); part(g, BOX, '#c8b07a', sd * 0.25, hy + o.head * (o.big ? 1.6 : 1.25), hz - 0.1, 0.03, 0.3, 0.03, 0.6, 0, sd * 0.9); }
      if (o.horn === 'short') for (const sd of [-1, 1]) part(g, CONE, '#efe6d2', sd * 0.3, hy + 0.25, hz - 0.1, 0.06, 0.3, 0.06, 0, 0, -sd * 1.1);
      if (o.horn === 'tusk') for (const sd of [-1, 1]) part(g, CONE, '#efe6d2', sd * 0.12, hy - 0.05, hz + 0.25, 0.04, 0.22, 0.04, -1.2);
      if (o.horn === 'curl') for (const sd of [-1, 1]) part(g, CONE, '#8a8174', sd * 0.1, hy + 0.2, hz - 0.15, 0.05, 0.35, 0.05, -0.7, 0, sd * 0.4);
      if (o.horn === 'long') for (const sd of [-1, 1]) part(g, CONE, '#2b2622', sd * 0.08, hy + 0.45, hz - 0.15, 0.025, 0.9, 0.025, -0.35, 0, sd * 0.08);
      if (o.tail) part(g, SPH, '#ffffff', 0, y0, -l / 2 - 0.2, 0.12, 0.12, 0.3, 0.4);
      const lw = Math.max(0.1, w * 0.22);
      for (const [x, z] of [[-w * 0.3, l * 0.3], [w * 0.3, l * 0.3], [-w * 0.3, -l * 0.3], [w * 0.3, -l * 0.3]]) legs.push(limb(g, '#3a2a1e', x, o.leg + 0.05, z, lw, o.leg + 0.05, lw));
      return { g, legs, ex: {}, kind };
    }
    // thú của từng miền theo ba tầng thời đại (nguyên thủy, cổ trung đại, cận đến hiện đại)
    const FAUNA = {
      plains: [[['sauropod', 2], ['tri', 3]], [['bison', 4]], [['deer', 3]]],
      forest: [[['trex', 1], ['raptor', 3], ['fly', 3]], [['elk', 3], ['boar', 2]], [['boar', 2], ['deer', 2]]],
      mountain: [[['ptero', 4], ['tri', 1]], [['goat', 4]], [['goat', 3]]],
      tundra: [[['mammoth', 3]], [['reindeer', 4], ['mammoth', 1]], [['fox', 3]]],
      coast: [[['croc', 4], ['turtle', 2]], [['boar', 3], ['croc', 1]], [['turtle', 3]]],
      desert: [[['raptor', 4]], [['oryx', 4], ['camel', 2]], [['camel', 2], ['oryx', 2]]],
    };
    const SIZE = { sauropod: 0.85, trex: 0.8, tri: 0.85, mammoth: 0.9, raptor: 1, croc: 0.9, ptero: 0.8, fly: 1, plesio: 1 };
    const v3 = (x, y, z) => new THREE.Vector3(x, y, z);
    function zonePoint(L, rnd) {
      const H = L.hunt;
      for (let t = 0; t < 30; t++) {
        const a = H.oa + (rnd() - 0.5) * 2 * H.spread, rMax = L.rOf(a) - H.margin, r = H.r0 + rnd() * Math.max(1, rMax - H.r0);
        const x = Math.cos(a) * r, z = Math.sin(a) * r;
        if (L.inside(x, z, 2) && !L.blockedWild(x, z, 1.2)) return v3(x, 0, z);
      }
      return v3(Math.cos(H.oa) * (H.r0 + 2), 0, Math.sin(H.oa) * (H.r0 + 2));
    }
    /* =============== Thợ săn: người tròn cầm giáo, cung của miền =============== */
    function huntSet(L, e) {
      const set = { meshes: [], cap: 8, e, ter: L.ter, n: [], dress: F.dressOf(e, L.ter) }, mat = F.figMaterial();
      for (const cls of ['melee', 'ranged']) {
        const k = new F.FigKit(); F.soldierShape(k, cls, Math.min(e, 5), L.ter);
        const geo = k.bake(), m = new THREE.InstancedMesh(geo, mat, 8);
        geo.setAttribute('anim', new THREE.InstancedBufferAttribute(new Float32Array(32), 4));
        for (const a of ['cA', 'cB', 'cC', 'cD']) geo.setAttribute(a, new THREE.InstancedBufferAttribute(new Float32Array(24).fill(1), 3));
        m.count = 0; m.castShadow = true; m.frustumCulled = false; m.raycast = () => {};
        L.g.add(m); set.meshes.push(m); set.n.push(0);
      }
      return set;
    }
    const H = lands.map((L) => ({ L, tier: -2, era: -1, animals: [], hunters: [], set: null, rnd: lands3d.kit.landRng(L.i + 900) }));
    function clearIsland(h) {
      for (const a of h.animals) h.L.g.remove(a.B.g);
      h.animals = [];
      if (h.set) { for (const m of h.set.meshes) { h.L.g.remove(m); m.geometry.dispose(); } h.set = null; }
      h.hunters = [];
    }
    function stockIsland(h, c) {
      const tier = Sim.gameTier(c.era), L = h.L;
      clearIsland(h);
      h.tier = tier; h.era = c.era;
      if (tier < 0) return;
      for (const [kind, n] of FAUNA[L.ter][tier]) for (let j = 0; j < n; j++) {
        const B = beast(kind), s = SIZE[kind] || 1;
        B.g.scale.setScalar(s);
        const p = zonePoint(L, h.rnd);
        B.g.position.copy(p); L.g.add(B.g);
        h.animals.push({ B, kind, p: p.clone(), to: zonePoint(L, h.rnd), sp: kind === 'raptor' ? 2.2 : kind === 'sauropod' || kind === 'mammoth' || kind === 'turtle' ? 0.45 : kind === 'ptero' ? 3 : 1.1, ph: h.rnd() * TAU, fall: 0, gone: 0, rest: h.rnd() * 4, fly: B.ex.fly || 0 });
      }
      h.set = huntSet(L, c.era);
      for (let i = 0; i < 4; i++) h.hunters.push({ p: zonePoint(L, h.rnd).multiplyScalar(0.85), ph: i * 1.3, target: null, cls: i % 2 });
    }
    // thằn lằn cổ dài bơi trong biển trong khi còn thành ở thời nguyên thủy
    const plesios = [0, 1].map((j) => { const B = beast('plesio'); B.g.visible = false; scene.add(B.g); return { B, j }; });
    function syncDay() {
      for (const h of H) {
        const c = W.cities[h.L.i];
        if (!c.settled) { if (h.tier !== -2) { clearIsland(h); h.tier = -2; } continue; }
        if (Sim.gameTier(c.era) !== h.tier || (h.set && h.set.e !== c.era && h.tier >= 0)) stockIsland(h, c);
        if (h.tier < 0) continue;
        const G = c.game || { stock: 1, K: 1 }, want = Math.max(G.stock > 0.5 ? 1 : 0, Math.ceil(h.animals.length * Math.min(1, G.stock / G.K)));
        let alive = h.animals.filter((a) => !a.fall && !a.gone);
        // con thú bị hạ hôm nay: con gần thợ săn nhất ngã xuống
        const kills = (W.hunts || []).filter((x) => x.city === c.id).length;
        for (let k = 0; k < kills && alive.length; k++) {
          let best = null, bd = 1e9;
          for (const a of alive) for (const t of h.hunters) { const d = a.p.distanceTo(t.p); if (d < bd) { bd = d; best = a; } }
          if (!best) best = alive[0];
          best.fall = 0.001;
          for (const t of h.hunters) t.target = best;
          if (war3d && war3d.shotRaw && !reduce) for (const t of h.hunters.slice(0, 2)) war3d.shotRaw(h.L.world(t.p).setY(1.3), h.L.world(best.p).setY(1), '#6d5139', 0.12, 1.2, 600);
          alive = alive.filter((a) => a !== best);
        }
        // trữ lượng thấp thì ít thú đi lại; hồi lại thì thú trở về
        let shown = alive.length;
        for (const a of h.animals) { if (a.gone && shown < want) { a.gone = 0; a.fall = 0; a.p.copy(zonePoint(h.L, h.rnd)); a.B.g.visible = true; a.B.g.rotation.z = 0; shown++; } }
        for (const a of alive) if (shown > want && !a.fall) { a.gone = 1; a.B.g.visible = false; shown--; }
        h.nHunters = Math.min(4, c.hunters || 0);
      }
      const any0 = W.cities.some((c) => c.settled && c.era === 0);
      for (const P of plesios) P.B.g.visible = any0;
    }
    const _v = new THREE.Vector3();
    function animate(dt, t) {
      const ts = t * 0.001, k = Math.min(0.1, dt / 1000);
      for (const h of H) {
        if (h.tier < 0 || !h.animals.length) { if (h.set) { F.crowdBegin(h.set); F.crowdEnd(h.set); } continue; }
        const L = h.L;
        for (const a of h.animals) {
          if (a.gone) continue;
          const g = a.B.g;
          if (a.fall) { // ngã nghiêng rồi chìm dần vào cỏ
            a.fall += k;
            g.rotation.z = Math.min(Math.PI / 2, a.fall * 2.2);
            if (a.fall > 7) { g.position.y = -(a.fall - 7) * 0.6; if (a.fall > 10) { a.gone = 1; g.visible = false; g.position.y = 0; g.rotation.z = 0; } }
            continue;
          }
          if (a.rest > 0) a.rest -= k;
          else {
            _v.copy(a.to).sub(a.p); const d = _v.length();
            if (d < 0.6) { a.to = zonePoint(L, h.rnd); a.rest = 1 + h.rnd() * 5; }
            else { _v.multiplyScalar(Math.min(d, a.sp * k) / d); a.p.add(_v); g.rotation.y = Math.atan2(_v.x, _v.z); }
          }
          const moving = a.rest <= 0;
          if (a.fly) { g.position.set(a.p.x, a.fly + Math.sin(ts + a.ph) * 1.5, a.p.z); a.B.legs.forEach((w, i) => { w.rotation.z = Math.sin(ts * (a.kind === 'fly' ? 40 : 5) + i) * 0.5 * (i % 2 ? 1 : -1); }); continue; }
          g.position.set(a.p.x, 0, a.p.z);
          const step = moving && !reduce ? Math.sin(ts * (a.kind === 'raptor' ? 10 : 4) + a.ph) * 0.45 : 0;
          a.B.legs.forEach((l, i) => { l.rotation.x = step * (i % 2 ? 1 : -1) * (i < 2 ? 1 : -1); });
          if (a.B.ex.neck) a.B.ex.neck.rotation.x = Math.sin(ts * 0.6 + a.ph) * 0.15;
        }
        // thợ săn: chạy tới con thú gần nhất, vây quanh con vừa ngã, rồi quay về
        const S = h.set;
        F.crowdBegin(S);
        const live = h.animals.filter((a) => !a.gone && !a.fall);
        h.hunters.forEach((u, i) => {
          if (i >= (h.nHunters || 0)) return;
          let tgt = u.target && !u.target.gone ? u.target : null;
          if (!tgt && live.length) tgt = live[(i + Math.floor(ts / 20)) % live.length];
          let run = 0, atk = 0;
          if (tgt) {
            _v.copy(tgt.p).sub(u.p); const d = _v.length(), keep = tgt.fall ? 1.6 + i * 0.4 : 3 + i;
            if (d > keep) { _v.multiplyScalar(Math.min(d - keep, 2.4 * k) / d); u.p.add(_v); run = 1; }
            else atk = tgt.fall ? 0 : 1;
            u.ry = Math.atan2(tgt.p.x - u.p.x, tgt.p.z - u.p.z);
            if (tgt.fall && tgt.fall > 6) u.target = null;
          }
          F.crowdPut(S, u.cls, u.p, u.ry || 0, run, atk, L.i * 17 + i, 1.15);
        });
        F.crowdEnd(S);
      }
      for (const P of plesios) {
        if (!P.B.g.visible) continue;
        const a = ts * 0.06 * (P.j ? -1 : 1) + P.j * Math.PI, r = 30 + P.j * 12;
        P.B.g.position.set(Math.cos(a) * r, -0.5 + Math.sin(ts + P.j) * 0.2, Math.sin(a) * r);
        P.B.g.rotation.y = -a + (P.j ? 0 : Math.PI);
        P.B.legs.forEach((l, i) => { l.rotation.z = Math.sin(ts * 2 + i) * 0.4; });
      }
    }
    return { syncDay, animate };
  }
  root.Fauna3D = { create };
})(typeof window !== 'undefined' ? window : globalThis);
