/* Bể Kính — đời sống trong thành lúc có chuyện.
 * Nhà bị giặc chiếm cắm cờ phe giặc trên mái, lính gác trước cửa; trại tạm trên quảng trường; dân chạy loạn, đoàn người tản cư
 * qua cầu, biểu tình, xếp hàng cứu tế, chuyền nước chữa cháy, dựng lại nhà, đưa tang, reo mừng ngày giải phóng; lính tuần tra,
 * giới nghiêm, thao luyện, động viên, duyệt binh, đánh nhau giữa phố, vá tường; và những cảnh chống trả riêng của từng miền.
 * Mọi thứ đọc từ bản mô phỏng (c.occ). Lính dùng chung bộ hình của lớp chiến tranh nên không tốn thêm lượt vẽ. */
(function (root) {
  'use strict';
  function create(K) {
    const { THREE, scene, Sim, W, lands3d, war3d, chaos3d, puff, reduce, glowTex, factionColor, audio, shake } = K;
    const F = lands3d.fig, KT = lands3d.kit, lands = lands3d.lands, bridges = lands3d.bridges, P = chaos3d.prims;
    const TAU = Math.PI * 2, rnd = Math.random, v3 = (x, y, z) => new THREE.Vector3(x, y, z);
    const hash = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const EB = (e) => (e <= 1 ? 0 : e <= 3 ? 1 : e <= 5 ? 2 : e <= 7 ? 3 : 4);
    const now = () => performance.now();
    const _o = new THREE.Object3D(), _c = new THREE.Color(), _p = v3(0, 0, 0), _q = v3(0, 0, 0), _r = v3(0, 0, 0);
    let night = 0;

    /* =============== Hình dùng chung: cờ trên mái, lều trại, chiến luỹ =============== */
    const mat = new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.8 });
    const R_LAND = lands3d.LAND_R + 6;
    function inst(build, cap, parent) {
      const k = new KT.Kit(); build(k);
      const geo = k.bake().body;
      geo.boundingSphere = new THREE.Sphere(v3(0, 0, 0), R_LAND); // cả đảo: đảo ra ngoài khung nhìn thì khỏi vẽ
      const m = new THREE.InstancedMesh(geo, mat, cap);
      for (let i = 0; i < cap; i++) m.setColorAt(i, _c.set('#ffffff'));
      m.count = 0; m.visible = false; m.castShadow = true; m.raycast = () => {};
      parent.add(m);
      return m;
    }
    const flagKit = (k) => { k.cyl('#3a2a1e', 0, 0, 0, 0.05, 2.3, 5); k.box('#ffffff', 0.52, 1.62, 0, 1.0, 0.62, 0.05); k.add(KT.ICO(), '#d9c27a', 0, 2.36, 0, 0.1, 0.1, 0.1); };
    const tentKit = (k) => { k.gable('#ffffff', 0, 0, -0.9, 1.7, 1.15, 1.8); k.cyl('#5b4630', 0, 0, 0.95, 0.04, 1.3, 4); k.box('#2b241e', 0, 0, 0.88, 0.5, 0.75, 0.03); };
    const barrKit = (k) => { k.box('#ffffff', 0, 0, 0, 2.4, 0.5, 0.62); k.box('#ffffff', -0.35, 0.5, 0, 1.5, 0.46, 0.56); k.box('#e6e6e6', 0.62, 0.5, 0.04, 0.62, 0.62, 0.52, 0.4); for (const x of [-1, 0, 1]) k.add(KT.UCONE(4), '#e6e6e6', x * 0.9, 0.2, 0.42, 0.07, 0.75, 0.07, 0, 0.9, 0); };
    const TENT_C = ['#a0785a', '#d9c9a8', '#c9bfa6', '#6b7a55', '#dfe7ee'];
    const BARR_C = ['#8f6a46', '#a0785a', '#c8b48a', '#7d7a74', '#9fe7ff'];
    const torchMat = () => new THREE.SpriteMaterial({ map: glowTex, color: '#ffb347', transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending });

    const ST = lands.map((L) => {
      const torches = [];
      for (let i = 0; i < 10; i++) { const s = new THREE.Sprite(torchMat()); s.scale.setScalar(1.3); s.visible = false; scene.add(s); torches.push(s); }
      return { L, flags: inst(flagKit, 64, L.g), tents: inst(tentKit, 24, L.g), barr: inst(barrKit, 14, L.g), crowd: null, crowdE: -99, torches, nt: 0, top: new Map(), seen: new Set(), shotT: 0, puffT: 0, loop: null };
    });

    /* =============== Vị trí trong thành (toạ độ của đảo) =============== */
    const homeOf = (L, idx) => { const H = L.houses[idx]; return H ? L.houseLots[H.idx].p : null; };
    function roofOf(St, idx) {
      const L = St.L, H = L.houses[idx];
      if (!H) return 3;
      if (H.grow < 1) return 3.2;
      let t = St.top.get(H.g);
      if (t == null) { const b = new THREE.Box3().setFromObject(H.g); t = b.max.y - L.g.position.y; St.top.set(H.g, t); if (St.top.size > 240) St.top.clear(); }
      return t;
    }
    // chỗ đứng trước cửa: nhà quay mặt về quảng trường
    const doorOf = (p, d, out) => { const r = Math.hypot(p.x, p.z) || 1; return out.set(p.x - (p.x / r) * d, 0, p.z - (p.z / r) * d); };
    function gateToward(L, toCity) {
      const gs = L.gates;
      if (!gs || !gs.length) return v3(L.rOf(0) * 0.8, 0, 0);
      if (toCity == null || toCity < 0 || !lands[toCity]) return gs[0];
      const d = lands[toCity].center.clone().sub(L.center);
      let best = gs[0], bd = -1e9;
      for (const g of gs) { const s = g.x * d.x + g.z * d.z; if (s > bd) { bd = s; best = g; } }
      return best;
    }
    function dmgPos(L, d) {
      if (!d) return null;
      if (d.kind === 'house') return homeOf(L, d.ref);
      if (d.kind === 'firm') { const o = L.firmObj.get(d.ref); return o ? o.g.position : null; }
      if (d.kind === 'land') return L.slots[d.ref] || null;
      return null;
    }
    // vòng tuần tra qua các dãy nhà
    function loopOf(St) {
      if (St.loop) return St.loop;
      const L = St.L, pts = [];
      for (let k = 0; k < 10; k++) { const a = (k / 10) * TAU + 0.2, r = 10.5 + (k % 2) * 4.5; let x = Math.cos(a) * r, z = Math.sin(a) * r; if (!L.inside(x, z, 2.5)) { x *= 0.75; z *= 0.75; } pts.push(v3(x, 0, z)); }
      const lens = [0];
      for (let i = 1; i <= pts.length; i++) lens.push(lens[i - 1] + pts[i % pts.length].distanceTo(pts[i - 1]));
      return (St.loop = { pts, lens, len: lens[lens.length - 1] });
    }
    function alongLoop(lp, u, out, dir) {
      const d = (((u % 1) + 1) % 1) * lp.len;
      let i = 1; while (i < lp.lens.length - 1 && lp.lens[i] < d) i++;
      const a = lp.pts[i - 1], b = lp.pts[i % lp.pts.length], k = (d - lp.lens[i - 1]) / Math.max(1e-6, lp.lens[i] - lp.lens[i - 1]);
      out.copy(a).lerp(b, k);
      if (dir) dir.copy(b).sub(a);
      return out;
    }
    const W2 = (L, p, out) => (out || _p).copy(p).add(L.center); // toạ độ đảo sang toạ độ thế giới

    /* =============== Phe, thời đại, miền của người cầm súng =============== */
    const facInfo = {};
    function fac(f) {
      const k = f + ':' + W.day;
      if (facInfo[f] && facInfo[f].k === k) return facInfo[f];
      let e = 0;
      for (const c of W.cities) if (c.settled && c.owner === f) e = Math.max(e, c.era);
      const cap = Sim.capitalOf && W.war && W.war.on ? Sim.capitalOf(W, f) : W.cities[f];
      return (facInfo[f] = { k, e, ter: (cap || W.cities[f] || W.cities[0]).terrain.key, color: factionColor(f) });
    }
    const colorsFor = (f, e, seed) => war3d.soldierColors(f, e, seed);

    /* =============== Người dân trong các cảnh =============== */
    function crowdOf(St) {
      const L = St.L, e = Math.max(0, W.cities[L.i].era);
      if (!St.crowd || St.crowdE !== e) { if (St.crowd) F.crowdDispose(St.crowd); St.crowd = F.crowdSet(scene, 90, e, L.ter); St.crowdE = e; St.top.clear(); }
      return St.crowd;
    }
    const MOURN = [['#2b2b2b', '#3a3a3a', '#f4f4f4'], ['#2b2b2b', '#3a3a3a'], ['#2b2b2b', '#1a1a1a']];
    function torch(St, p, y) { if (St.nt >= St.torches.length) return; const s = St.torches[St.nt++]; s.position.set(p.x, (p.y || 0) + (y || 2.1), p.z); s.material.opacity = 0.55 + 0.35 * Math.sin(now() * 0.02 + St.nt * 1.7); s.visible = true; }
    function civilians(St, c, sc, tn, t) {
      const L = St.L, O = c.occ;
      const need = O.camp > 0 || sc.flee || sc.refugee || sc.welcome || sc.protest || sc.breadline || sc.bucket || sc.rebuild || sc.mourn || sc.cheer || sc.parade || sc.mobilize || (sc.return && !sc.return.bridge);
      if (!need) { if (St.crowd) { F.crowdBegin(St.crowd); F.crowdEnd(St.crowd); } return; }
      const S = crowdOf(St), robots = S.e >= 7 ? 3 : 0;
      F.crowdBegin(S);
      const put = (i, p, ry, walk, atk, colors, scale) => F.crowdPut(S, robots && i % 5 === 0 ? 2 : i % 3 === 0 ? 1 : 0, W2(L, p, _r), ry, reduce ? 0 : walk, reduce ? 0 : atk, i * 13 + L.i * 7, scale || 1.05, colors);
      // trại tạm: người đứng quanh lều
      if (O.camp > 0) {
        const n = Math.min(12, Math.ceil(O.camp / 4));
        for (let i = 0; i < n; i++) { const a = (i / n) * TAU * 0.92 + 0.4, r = 4.1 + (i % 2) * 1.7 + 0.9; _q.set(Math.cos(a) * r, 0, Math.sin(a) * r); put(100 + i, _q, -a + Math.sin(tn * 0.0004 + i) * 0.8, 0, 0); }
      }
      // dân chạy loạn: từ nhà ở rìa thành về quảng trường, dòng người không dứt
      if (sc.flee) {
        const s = sc.flee, nh = L.houses.length;
        for (let i = 0; i < 14; i++) {
          const idx = s.house != null && i < 6 ? s.house : Math.max(0, nh - 1 - Math.floor(hash(i * 7 + s.id) * Math.max(1, nh * 0.45)));
          const from = homeOf(L, idx); if (!from) continue;
          const u = ((tn / (s.drill ? 3400 : 2300)) + hash(i * 3 + s.id)) % 1, a = hash(i + 5) * TAU, to = _r.set(Math.cos(a) * 4.5, 0, Math.sin(a) * 4.5);
          _q.copy(from).lerp(to, u); const ry = Math.atan2(to.x - from.x, to.z - from.z);
          put(i, _q, ry, 1, s.drill ? 0 : 0.3);
        }
      }
      // tản cư bằng thuyền: ra bến
      if (sc.refugee && sc.refugee.bridge == null && L.dockPos) {
        for (let i = 0; i < 10; i++) { const u = ((tn / 3000) + hash(i * 5 + 1)) % 1, a = hash(i) * TAU, from = _r.set(Math.cos(a) * 4.5, 0, Math.sin(a) * 4.5); _q.copy(from).lerp(L.dockPos, u); put(20 + i, _q, Math.atan2(L.dockPos.x - from.x, L.dockPos.z - from.z), 1, 0); }
      }
      // đón người tản cư ở đầu cầu
      if (sc.welcome) {
        const B = bridges.find((b) => b.sim.id === sc.welcome.bridge || (b.a === L.i && b.b === sc.welcome.from) || (b.b === L.i && b.a === sc.welcome.from));
        const end = B ? (B.a === L.i ? B.pa : B.pb).clone().sub(L.center) : gateToward(L, sc.welcome.from);
        const into = end.clone().multiplyScalar(-1).normalize();
        for (let i = 0; i < 8; i++) { _q.copy(end).addScaledVector(into, 2 + (i % 2) * 1.2).add(_r.set(-into.z, 0, into.x).multiplyScalar((i - 3.5) * 0.9)); put(30 + i, _q, Math.atan2(-into.x, -into.z), 0, 0.6); }
      }
      // biểu tình, hát giữ thành: vòng cung hướng về trại lính
      if (sc.protest) {
        const focus = L.musterPos || L.milLot.barracks || v3(0, 0, 0), from = focus.clone().multiplyScalar(0.55), song = sc.protest.song;
        for (let i = 0; i < 16; i++) {
          const a = (i / 15 - 0.5) * 2.2 + Math.atan2(focus.x - from.x, focus.z - from.z), r = 3 + (i % 3) * 0.8;
          _q.set(from.x - Math.sin(a) * r, 0, from.z - Math.cos(a) * r);
          put(40 + i, _q, a, 0, song ? 0 : 0.55 + 0.45 * Math.sin(tn * 0.006 + i));
          if (night > 0.35 && i % 3 === 0) torch(St, W2(L, _q, _r), 2.2);
        }
      }
      // xếp hàng nhận cứu tế: hàng dài từ quảng trường tới chợ
      if (sc.breadline) {
        const to = L.slots.eco || v3(8, 0, 0), dir = to.clone().normalize();
        for (let i = 0; i < 11; i++) { const sh = ((tn / 9000) % 1) * 0.8; _q.copy(dir).multiplyScalar(2.2 + i * 0.85 - sh); put(60 + i, _q, Math.atan2(dir.x, dir.z), 0, 0); }
      }
      // chuyền nước chữa cháy: một hàng người từ giếng ở quảng trường tới đám cháy
      if (sc.bucket) {
        const d = (c.dmg || []).find((x) => x.id === sc.bucket.dmg) || (c.dmg || []).find((x) => x.state === 'fire');
        const fp = dmgPos(L, d || { kind: sc.bucket.kind, ref: sc.bucket.ref });
        if (fp) {
          const dir = fp.clone().setY(0), len = dir.length(); dir.normalize();
          const n = Math.min(9, Math.max(4, Math.floor(len / 1.6)));
          for (let i = 0; i < n; i++) { _q.copy(dir).multiplyScalar(2 + (i / Math.max(1, n - 1)) * (len - 3.2)).add(_r.set(-dir.z, 0, dir.x).multiplyScalar(i % 2 ? 0.35 : -0.35)); put(72 + i, _q, Math.atan2(dir.x, dir.z) + (i % 2 ? Math.PI / 2 : -Math.PI / 2), 0, 1); }
          if (!reduce && tn - St.puffT > 500) { St.puffT = tn; puff(W2(L, fp, v3(0, 0, 0)).setY(1.6 + rnd()), false, '#e8f6ff'); }
        }
      }
      // dựng lại nhà
      if (sc.rebuild) {
        const rs = (c.dmg || []).filter((x) => x.state === 'ruin' || x.state === 'rebuild').slice(0, 2);
        rs.forEach((d, j) => { const p = dmgPos(L, d); if (!p) return; for (let i = 0; i < 3; i++) { const a = (i / 3) * TAU + j; _q.set(p.x + Math.cos(a) * 1.7, 0, p.z + Math.sin(a) * 1.7); put(82 + j * 3 + i, _q, -a - Math.PI / 2, 0, 1); } if (!reduce && tn - St.puffT > 900) { St.puffT = tn; puff(W2(L, p, v3(0, 0, 0)).setY(0.8), false, '#c9b9a0'); } });
      }
      // đưa tang: đi chậm quanh đền
      if (sc.mourn) {
        const ctr = L.slots.rel || v3(0, 0, 0), D = MOURN[Math.min(2, EB(c.era) >> 1)];
        for (let i = 0; i < 10; i++) { const a = -tn * 0.00016 + i * 0.32, r = 3.6; _q.set(ctr.x + Math.cos(a) * r, 0, ctr.z + Math.sin(a) * r); put(90 + i, _q, -a + Math.PI, 0.45, 0, [D[i % D.length], '#2b2b2b', '#2b2b2b', F.SKIN_T[i % F.SKIN_T.length]]); if (night > 0.35 && i % 3 === 0) torch(St, W2(L, _q, _r), 2.1); }
      }
      // reo mừng, xem duyệt binh, tiễn lính ra trận
      if (sc.cheer || sc.parade || sc.mobilize) {
        const n = sc.cheer ? 16 : 10;
        for (let i = 0; i < n; i++) {
          let a = (i / n) * TAU, r = sc.parade ? 9.6 : 3.4 + (i % 3) * 1.1;
          if (sc.mobilize && !sc.parade && !sc.cheer) { const g = gateToward(L, -1), m = L.musterPos || v3(0, 0, 0), k = (i >> 1) / (n / 2); _q.copy(m).lerp(g, 0.15 + k * 0.7).add(_r.set(-(g.z - m.z), 0, g.x - m.x).normalize().multiplyScalar(i % 2 ? 1.8 : -1.8)); put(110 + i, _q, Math.atan2(-(_r.x), -(_r.z)), 0, 0.6); continue; }
          _q.set(Math.cos(a) * r, 0, Math.sin(a) * r);
          if (sc.cheer && !reduce) _q.y = Math.abs(Math.sin(tn * 0.011 + i * 1.3)) * 0.35;
          put(110 + i, _q, -a - Math.PI / 2 + (sc.parade ? Math.PI : 0) + Math.PI / 2, 0, sc.cheer ? 1 : 0.4);
        }
        if (sc.cheer && !reduce && tn - St.puffT > 700) { St.puffT = tn; const a = rnd() * TAU; puff(W2(L, v3(Math.cos(a) * 4, 0, Math.sin(a) * 4), v3(0, 0, 0)).setY(3 + rnd() * 2), false, ['#ffd27a', '#ff8a80', '#9df0c4', '#9fd3f0'][Math.floor(rnd() * 4)]); }
      }
      F.crowdEnd(S);
    }

    /* =============== Cờ trên mái, lều trại, chiến luỹ =============== */
    function props(St, c, sc, tn) {
      const L = St.L, O = c.occ;
      // cờ phe chiếm trên mái những ngôi nhà bị chiếm; đêm "thay cờ" thì vài lá là cờ của thành
      let n = 0;
      if (O.n > 0) {
        for (const k in O.h) {
          if (n >= 64) break;
          const idx = +k, p = homeOf(L, idx); if (!p) continue;
          const by = sc.flagswap && idx % 3 === 0 ? c.id : O.h[k].by;
          _o.position.set(p.x + 0.3, roofOf(St, idx) - 0.15, p.z - 0.2);
          _o.rotation.set(0, (reduce ? 0 : Math.sin(tn * 0.0021 + idx) * 0.35) + idx, 0); _o.scale.setScalar(1.15); _o.updateMatrix();
          St.flags.setMatrixAt(n, _o.matrix); St.flags.setColorAt(n, _c.set(factionColor(by))); n++;
        }
      }
      St.flags.count = n; St.flags.visible = n > 0;
      if (n) { St.flags.instanceMatrix.needsUpdate = true; St.flags.instanceColor.needsUpdate = true; }
      // lều trại tạm trên quảng trường
      const nt = O.camp > 0 ? Math.min(18, Math.ceil(O.camp / 4)) : sc.rescue ? 2 : 0;
      for (let i = 0; i < nt; i++) {
        const a = (i / nt) * TAU * 0.92 + 0.15, r = 4.1 + (i % 2) * 1.7;
        _o.position.set(Math.cos(a) * r, 0, Math.sin(a) * r); _o.rotation.set(0, -a, 0); _o.scale.setScalar(1); _o.updateMatrix();
        St.tents.setMatrixAt(i, _o.matrix); St.tents.setColorAt(i, _c.set(sc.rescue && O.camp <= 0 ? '#f4f4f4' : TENT_C[EB(c.era)]));
      }
      St.tents.count = nt; St.tents.visible = nt > 0;
      if (nt) { St.tents.instanceMatrix.needsUpdate = true; St.tents.instanceColor.needsUpdate = true; }
      // chiến luỹ chắn các ngả đường vào quảng trường
      const nb = sc.barricade ? 12 : 0;
      for (let i = 0; i < nb; i++) {
        const a = (i / nb) * TAU + 0.26, r = 11.5;
        _o.position.set(Math.cos(a) * r, 0, Math.sin(a) * r); _o.rotation.set(0, -a + Math.PI / 2, 0); _o.scale.setScalar(1); _o.updateMatrix();
        St.barr.setMatrixAt(i, _o.matrix); St.barr.setColorAt(i, _c.set(BARR_C[EB(c.era)]));
      }
      St.barr.count = nb; St.barr.visible = nb > 0;
      if (nb) { St.barr.instanceMatrix.needsUpdate = true; St.barr.instanceColor.needsUpdate = true; }
    }

    /* =============== Lính trong phố (vẽ chung bộ hình với lớp chiến tranh) =============== */
    function shot(L, a, b, e, color) {
      if (reduce || !war3d.shotRaw) return;
      const from = W2(L, a, v3(0, 0, 0)).setY(1.1), to = W2(L, b, v3(0, 0, 0)).setY(0.9);
      war3d.shotRaw(from, to, color || (e <= 3 ? '#8a6a46' : e <= 7 ? '#ffd27a' : '#7ff0ff'), e <= 3 ? 0.12 : 0.1, e <= 3 ? 1.2 : 0.1, 260 + rnd() * 200, null);
    }
    function soldiers(put, tn) {
      for (const St of ST) {
        const L = St.L, c = W.cities[L.i];
        if (!c.settled || !c.occ) continue;
        try { citySoldiers(St, c, put, tn); } catch (err) { /* một cảnh hỏng không làm hỏng cả bể */ }
      }
    }
    function citySoldiers(St, c, put, tn) {
      const L = St.L, O = c.occ, day = W.day, sc = scenesOf(c);
      const own = c.owner, mine = fac(own);
      const P1 = (f, cls, p, ry, walk, atk, seed) => { const I = fac(f); put(cls, I.e, I.ter, W2(L, p, _r), ry, reduce ? 0 : walk, reduce ? 0 : atk, seed, I.e >= 7 ? 1.3 : 1.12, colorsFor(f, I.e, seed)); };
      // lính gác trước cửa những ngôi nhà bị chiếm
      let g = 0;
      for (const k in O.h) {
        if (g >= 12) break;
        const idx = +k; if (idx % 2) continue;
        const p = homeOf(L, idx); if (!p) continue;
        doorOf(p, 1.7, _q);
        P1(O.h[k].by, 'melee', _q, Math.atan2(-p.x, -p.z) + Math.sin(tn * 0.0007 + idx) * 0.6, 0, 0, 900 + idx);
        g++;
      }
      // tuần tra: giặc trong thành bị chiếm, giới nghiêm thì dày hơn; đội tuần đêm của chính thành thì mang cờ nhà
      const held = W.war && W.war.on && own !== c.id;
      const squads = (held ? 2 : 0) + (sc.patrolx ? 2 : 0) + (held && sc.curfew && night > 0.4 ? 1 : 0);
      if (squads) {
        const lp = loopOf(St);
        for (let s = 0; s < squads; s++) {
          const dirS = s % 2 ? -1 : 1, u = (tn / 46000) * dirS + s / squads;
          for (let m = 0; m < 3; m++) {
            alongLoop(lp, u - dirS * m * 0.012, _q, _p);
            const ry = Math.atan2(_p.x, _p.z) + (dirS < 0 ? Math.PI : 0);
            P1(own, 'melee', _q, ry, 1, 0, 700 + s * 3 + m);
            if (m === 0 && night > 0.35) torch(St, W2(L, _q, v3(0, 0, 0)), mine.e >= 4 ? 2.6 : 2.2);
          }
        }
      }
      // đánh nhau giữa phố quanh ngôi nhà vừa bị chiếm
      if (sc.streetfight) {
        const s = sc.streetfight, p = homeOf(L, s.house != null ? s.house : +Object.keys(O.h)[0]);
        if (p) {
          const out = _p.copy(p).normalize(), side = v3(-out.z, 0, out.x), by = s.by != null && s.by >= 0 ? s.by : own, def = own === c.id ? c.id : (by === own ? c.id : own);
          const A = [], D = [];
          for (let i = 0; i < 4; i++) {
            const lunge = reduce ? 0 : Math.max(0, Math.sin(tn * 0.009 + i * 1.7)) * 0.35;
            const a = p.clone().addScaledVector(out, -2.0 - lunge).addScaledVector(side, (i - 1.5) * 0.9), d = p.clone().addScaledVector(out, -4.6 + lunge).addScaledVector(side, (i - 1.5) * 0.9);
            P1(by, 'melee', a, Math.atan2(-out.x, -out.z), 0, 1, 800 + i); P1(def, 'melee', d, Math.atan2(out.x, out.z), 0, 1, 810 + i);
            A.push(a); D.push(d);
          }
          if (tn - St.shotT > 380) { St.shotT = tn; const i = Math.floor(rnd() * 4); if (rnd() < 0.5) shot(L, A[i], D[(i + 1) % 4], fac(by).e); else shot(L, D[i], A[(i + 2) % 4], fac(def).e); }
        }
      }
      // dân quân, thanh niên xung phong, đánh trả quái vật
      if (sc.militia) {
        const s = sc.militia, tgt = s.fight === 'kraken' || s.fight === 'pirates' || s.fight === 'ghostship' ? (L.dockPos || gateToward(L, -1)) : gateToward(L, c.landBy);
        const dir = tgt.clone().setY(0).normalize(), side = v3(-dir.z, 0, dir.x), base = dir.clone().multiplyScalar(s.farm ? 13 : 6.5);
        for (let i = 0; i < 10; i++) { _q.copy(base).addScaledVector(side, (i % 5 - 2) * 1.0).addScaledVector(dir, -Math.floor(i / 5) * 1.1); P1(c.id, i % 3 ? 'melee' : 'ranged', _q, Math.atan2(dir.x, dir.z), 0, Math.sin(tn * 0.004 + i) > 0.3 ? 1 : 0, 600 + i); }
      }
      // thao luyện trên bãi tập
      if (sc.drill && L.musterPos) {
        const m = L.musterPos, f = L.musterRy != null ? L.musterRy : Math.atan2(-m.x, -m.z), fx = Math.sin(f), fz = Math.cos(f), step = reduce ? 0 : Math.sin(tn * 0.0011) * 1.6;
        for (let i = 0; i < 12; i++) { const col = (i % 4) - 1.5, row = Math.floor(i / 4) - 1; _q.set(m.x + fz * col * 1.3 + fx * (row * 1.4 + step), 0, m.z - fx * col * 1.3 + fz * (row * 1.4 + step)); P1(own, i % 4 === 3 ? 'ranged' : 'melee', _q, f + (Math.cos(tn * 0.0011) < 0 ? Math.PI : 0), 1, Math.sin(tn * 0.005) > 0.6 ? 1 : 0, 500 + i); }
      }
      // động viên, xuất kích: hàng quân từ bãi tập ra cổng
      if (sc.mobilize) {
        const m = L.musterPos || v3(0, 0, 0), gt = gateToward(L, c.landBy), d = gt.clone().sub(m), len = d.length(); d.normalize();
        for (let i = 0; i < 12; i++) { const u = ((tn / 9000) + i / 12) % 1; _q.copy(m).addScaledVector(d, u * len).add(_r.set(-d.z, 0, d.x).multiplyScalar(i % 2 ? 0.55 : -0.55)); P1(own, i % 4 === 3 ? 'ranged' : 'melee', _q, Math.atan2(d.x, d.z), 1, 0, 520 + i); }
      }
      // duyệt binh quanh quảng trường
      if (sc.parade) {
        for (let i = 0; i < 14; i++) { const a = tn * 0.00012 + (Math.floor(i / 2) / 7) * TAU, r = 6.6 + (i % 2) * 1.0; _q.set(Math.cos(a) * r, 0, Math.sin(a) * r); P1(own, 'melee', _q, -a - Math.PI, 1, 0, 540 + i); }
      }
      // cứu dân: lính bới đổ nát, khiêng người
      if (sc.rescue) {
        const rs = (c.dmg || []).filter((x) => x.state !== 'gone').slice(0, 2);
        const pts = rs.map((d) => dmgPos(L, d)).filter(Boolean);
        if (!pts.length) pts.push(v3(5, 0, 2));
        for (let i = 0; i < 6; i++) { const p = pts[i % pts.length], a = (i / 6) * TAU; _q.set(p.x + Math.cos(a) * 1.9, 0, p.z + Math.sin(a) * 1.9); P1(own, 'melee', _q, -a - Math.PI / 2, 0, 1, 560 + i); }
      }
      // vá tường thành ở cổng bị đánh
      if (sc.repair) {
        const gt = gateToward(L, c.landBy), side = v3(-gt.z, 0, gt.x).normalize(), inn = gt.clone().normalize();
        for (let i = 0; i < 6; i++) { _q.copy(gt).addScaledVector(side, (i - 2.5) * 0.9).addScaledVector(inn, -1.4); P1(own, 'melee', _q, Math.atan2(inn.x, inn.z), 0, 1, 580 + i); }
        if (!reduce && tn - St.puffT > 800) { St.puffT = tn; puff(W2(L, gt, v3(0, 0, 0)).setY(1.4), false, '#c9b9a0'); }
      }
      // quân giữ chiến luỹ
      if (sc.barricade) {
        for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU + 0.26 + 0.26, r = 10.4; _q.set(Math.cos(a) * r, 0, Math.sin(a) * r); P1(c.id, i % 2 ? 'ranged' : 'melee', _q, Math.atan2(Math.cos(a), Math.sin(a)), 0, 0.3, 590 + i); }
      }
    }

    /* =============== Mỗi khung hình =============== */
    function scenesOf(c) {
      const sc = {}, O = c.occ;
      if (!O) return sc;
      for (const s of O.scenes) if (s.until > W.day) sc[s.kind] = s;
      return sc;
    }
    function animate(dt, t, nv) {
      night = nv || 0;
      const tn = now();
      for (const St of ST) {
        const L = St.L, c = W.cities[L.i];
        St.nt = 0;
        if (!c.settled || !c.occ) { St.flags.visible = St.tents.visible = St.barr.visible = false; if (St.crowd) { F.crowdBegin(St.crowd); F.crowdEnd(St.crowd); } continue; }
        try {
          const sc = scenesOf(c);
          props(St, c, sc, tn);
          civilians(St, c, sc, tn, t);
          // phố vắng: xuống hầm, hay đêm giới nghiêm
          if (sc.shelter || (sc.curfew && night > 0.45)) L.hush = tn + 400;
          // đoàn người tản cư qua cầu, người về nhà: mỗi cảnh một lần
          for (const k of ['refugee', 'return']) {
            const s = sc[k]; if (!s || St.seen.has(s.id + k)) continue;
            St.seen.add(s.id + k);
            if (k === 'refugee' && s.bridge != null) lands3d.procession(s.to, Math.min(14, s.n * 2), L.i);
            if (k === 'return' && s.from != null && s.from >= 0 && bridges.some((b) => ((b.a === s.from && b.b === L.i) || (b.b === s.from && b.a === L.i)) && b.sim.level >= 0)) lands3d.procession(L.i, Math.min(14, s.n * 2), s.from);
          }
        } catch (err) { /* bỏ qua khung lỗi */ }
      }
    }
    // đuốc của người biểu tình, đưa tang, lính tuần: tắt những ngọn không dùng
    function endFrame() { for (const St of ST) for (let i = St.nt; i < St.torches.length; i++) St.torches[i].visible = false; }
    if (war3d.addSoldiers) war3d.addSoldiers((put, tn) => { soldiers(put, tn); endFrame(); });

    /* =============== Cảnh một lần: chống trả của từng miền, chiếm nhà, khởi nghĩa =============== */
    const at = (L, p, y) => W2(L, p, v3(0, 0, 0)).setY(y || 0);
    function rocks(L, toward) { // đá lăn từ vách núi xuống cổng
      const gt = gateToward(L, toward), from = gt.clone().multiplyScalar(1.45).setY(9), balls = [];
      for (let i = 0; i < 9; i++) { const m = new THREE.Mesh(new THREE.DodecahedronGeometry(0.7 + rnd() * 0.8, 0), P.lam('#8a8174')); scene.add(m); balls.push({ m, off: rnd() * 0.3, lat: (rnd() - 0.5) * 6 }); }
      const side = v3(-gt.z, 0, gt.x).normalize();
      P.run(4200, (u) => { for (const b of balls) { const k = clamp(u * 1.4 - b.off, 0, 1); _q.copy(from).lerp(gt, k).addScaledVector(side, b.lat); _q.y = from.y * (1 - k) * (1 - k) + 0.7; b.m.position.copy(W2(L, _q, _r)); b.m.rotation.x += 0.2; if (!reduce && rnd() < 0.05) puff(b.m.position.clone(), false, '#b9ab98'); } }, () => { for (const b of balls) P.kill(b.m); P.smoke(at(L, gt, 1), 8, '#8a7a68', 4); if (shake) shake(300); });
    }
    function arrows(L, n, color, fromWild, toward) { // tên bắn từ rừng, từ cồn cát vào quân giặc ở cổng
      const gt = gateToward(L, toward);
      for (let i = 0; i < n; i++) P.later(i * 140, () => { const a = Math.atan2(gt.z, gt.x) + (rnd() - 0.5) * 1.4, r = fromWild ? 24 + rnd() * 6 : 12, from = v3(Math.cos(a) * r, 0, Math.sin(a) * r), to = gt.clone().multiplyScalar(1.25 + rnd() * 0.2).add(v3((rnd() - 0.5) * 4, 0, (rnd() - 0.5) * 4)); if (war3d.shotRaw) war3d.shotRaw(at(L, from, 3), at(L, to, 0.6), color, 0.12, 2.4, 700 + rnd() * 300, 'dust'); });
    }
    function burningBoats(L) { // thuyền lửa trôi ra đội tàu giặc
      if (!L.dockPos) return;
      const d0 = L.dockPos.clone(), out = d0.clone().normalize(), boats = [];
      for (let i = 0; i < 3; i++) { const g = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.5, 2.6), P.lam('#5b4630')), f = P.spr('#ff8a3d', 3, 0.9); scene.add(g); boats.push({ g, f, lat: (i - 1) * 3 }); }
      const side = v3(-out.z, 0, out.x);
      P.run(7000, (u) => { for (const b of boats) { _q.copy(d0).addScaledVector(out, 3 + u * 22).addScaledVector(side, b.lat); const w = W2(L, _q, _r).setY(-0.4); b.g.position.copy(w); b.g.rotation.y = Math.atan2(out.x, out.z); b.f.position.copy(w).setY(1.2); b.f.scale.setScalar(2.5 + Math.sin(u * 60 + b.lat) * 0.6); if (!reduce && rnd() < 0.15) puff(w.clone().setY(1.6), true, '#3a3a3a'); } }, () => { for (const b of boats) { P.flash(b.g.position.clone().setY(1), 9, '#ff8a3d'); P.kill(b.g); P.kill(b.f); } });
    }
    function beacons(L) { // lửa hiệu bùng lên từ đỉnh này sang đỉnh khác
      for (let i = 0; i < 5; i++) P.later(i * 500, () => { const a = (i / 5) * TAU + 0.5, r = L.rOf(a) - 3, p = at(L, v3(Math.cos(a) * r, 0, Math.sin(a) * r), 6.5), s = P.spr('#ffb347', 4, 0.95); s.position.copy(p); P.run(9000, (u) => { s.scale.setScalar(3.4 + Math.sin(u * 80 + i) * 0.6); s.material.opacity = 0.95 * Math.min(1, (1 - u) * 5); if (!reduce && rnd() < 0.08) puff(p.clone().setY(p.y + 1.5), true, '#3a3a3a'); }, () => P.kill(s)); });
    }
    function ghosts(L, color) { // ảo ảnh một đạo quân trên đường chân trời
      const gt = gateToward(L, -1), side = v3(-gt.z, 0, gt.x).normalize(), ss = [];
      for (let i = 0; i < 12; i++) { const s = P.spr(color, 2.2, 0); s.position.copy(at(L, gt.clone().multiplyScalar(1.7).addScaledVector(side, (i - 5.5) * 1.6), 1.2)); ss.push(s); }
      P.run(7000, (u, ms) => { for (let i = 0; i < ss.length; i++) { ss[i].material.opacity = 0.5 * Math.min(1, u * 5, (1 - u) * 4) * (0.6 + 0.4 * Math.sin(ms * 0.01 + i)); ss[i].position.y = 1.2 + Math.sin(ms * 0.004 + i) * 0.3; } }, () => ss.forEach((s) => P.kill(s)));
    }
    function crack(L, toward) { // băng vỡ dưới chân giặc
      const gt = gateToward(L, toward), p = at(L, gt.clone().multiplyScalar(1.3), 0.15);
      P.ring(p, '#dff6ff', 7, 1600); P.later(300, () => P.ring(p.clone(), '#9fd3f0', 11, 1800)); P.flash(p.clone().setY(1), 8, '#e8fbff'); P.smoke(p, 8, '#f4f8fb', 4);
    }
    const DUST = (L, p, n) => P.smoke(at(L, p, 0.6), n || 6, '#c9b9a0', 2.5);
    const ONE = {
      seize: (L, fx) => { const p = homeOf(L, fx.house); if (p) { P.flash(at(L, p, 2.4), 6, '#ff9a6a'); DUST(L, p, 6); } },
      uprising: (L, fx) => { if (fx.win) { P.ring(at(L, v3(0, 0, 0), 0.5), '#ffe08a', 24, 2400); for (let i = 0; i < 8; i++) P.later(i * 220, () => P.flash(at(L, v3((rnd() - 0.5) * 16, 0, (rnd() - 0.5) * 16), 4 + rnd() * 2), 6, ['#ffd27a', '#ff8a80', '#9df0c4'][i % 3])); } else { P.ring(at(L, v3(0, 0, 0), 0.5), '#8a1a1a', 14, 2000); P.smoke(at(L, v3(0, 0, 0), 1), 10, '#3a3a3a', 6); } },
      retake: (L, fx) => { const p = homeOf(L, fx.house); if (p) { P.flash(at(L, p, 3), 7, '#9df0c4'); DUST(L, p, 4); } },
      quarter: (L, fx) => { const p = homeOf(L, fx.house); if (p) DUST(L, p, 6); },
      sabotage: (L) => { const p = L.musterPos || L.milLot.barracks; if (p) P.explosion(at(L, p, 0), 4); },
      grainburn: (L) => { const p = L.slots.eco; if (p) { P.flash(at(L, p, 2), 10, '#ff8a3d'); P.smoke(at(L, p, 2), 14, '#3a3a3a', 3); } },
      bridgeblow: (L, fx) => { const b = bridges.find((x) => (x.a === L.i || x.b === L.i) && x.sim.level >= 0 && x.pa); if (b) P.explosion((b.a === L.i ? b.pa.clone().lerp(b.pb, 0.15) : b.pb.clone().lerp(b.pa, 0.15)), 4); },
      boulders: (L, fx) => rocks(L, fx.by),
      icebreak: (L, fx) => crack(L, fx.by),
      fireships: (L) => burningBoats(L),
      ambush: (L, fx) => arrows(L, 14, '#8a6a46', true, fx.by),
      traps: (L, fx) => { const gt = gateToward(L, fx.by); DUST(L, gt.clone().multiplyScalar(1.3), 10); },
      hornets: (L, fx) => { const gt = at(L, gateToward(L, fx.by).clone().multiplyScalar(1.2), 2); P.ring(gt.clone().setY(0.4), '#3a2f1a', 6, 1600); for (let i = 0; i < 4; i++) P.later(i * 300, () => puff(gt.clone().add(v3((rnd() - 0.5) * 3, rnd(), (rnd() - 0.5) * 3)), false, '#3a2f1a')); },
      fireflies: (L) => P.particles(L, '#e8ff7a', 380, 0.5, 'swarm', 9000),
      sandraid: (L, fx) => { arrows(L, 10, '#c98a5a', true, fx.by); P.smoke(at(L, gateToward(L, fx.by).clone().multiplyScalar(1.4), 0.5), 12, '#d9a46e', 6); },
      wells: (L) => { for (let i = 0; i < 4; i++) { const a = (i / 4) * TAU + 0.4, r = L.rOf(a) - 6; DUST(L, v3(Math.cos(a) * r, 0, Math.sin(a) * r), 6); } },
      mirage: (L, fx) => ghosts(L, factionColor(W.cities[L.i].id)),
      blizzardraid: (L) => { P.particles(L, '#ffffff', 700, 0.45, 'fall', 9000); P.haze(L, '#e8f6ff', 0.28, 9000); },
      beacons: (L) => beacons(L),
      tunnels: (L, fx) => { const p = homeOf(L, fx.house); DUST(L, p || v3(6, 0, 4), 10); },
      floodfields: (L) => { const p = L.slots.eco || v3(10, 0, 0), m = new THREE.Mesh(new THREE.CircleGeometry(9, 28), P.basic('#6fb7d9', 0)); m.rotation.x = -Math.PI / 2; m.position.copy(at(L, p.clone().multiplyScalar(1.5), 0.09)); m.renderOrder = 2; scene.add(m); P.run(14000, (u) => { m.material.opacity = 0.55 * Math.min(1, u * 6, (1 - u) * 4); }, () => P.kill(m)); },
      pitchfork: (L, fx) => DUST(L, gateToward(L, fx.by), 8),
      smuggle: (L) => { for (let i = 0; i < 6; i++) { const s = P.spr('#ffd27a', 1.1, 0.9), a = rnd() * TAU, from = v3(Math.cos(a) * 30, 0, Math.sin(a) * 30); P.run(6000, (u) => { s.position.copy(at(L, from.clone().multiplyScalar(1 - u), 1.6)); s.material.opacity = 0.9 * Math.min(1, (1 - u) * 6); }, () => P.kill(s)); } },
      spies: (L) => { const s = P.spr('#ffffff', 1.4, 0.9), a = rnd() * TAU, from = v3(Math.cos(a) * 60, 18, Math.sin(a) * 60); P.run(5000, (u) => { s.position.copy(at(L, from.clone().multiplyScalar(1 - u), 18 * (1 - u) + 4)); }, () => P.kill(s)); },
      capture: (L) => { P.ring(at(L, v3(0, 0, 0), 0.4), '#ffe08a', 10, 1800); },
      sortie: (L, fx) => arrows(L, 8, '#ffd27a', false, fx.by),
      nets: (L, fx) => P.ring(at(L, gateToward(L, fx.by).clone().multiplyScalar(1.2), 0.3), '#e8e0d0', 5, 2400),
      streetfight: (L, fx) => { const p = homeOf(L, fx.house); if (p) P.flash(at(L, p, 3), 6, '#ff8a3d'); },
      flagswap: (L) => P.ring(at(L, v3(0, 0, 0), 0.4), '#9df0c4', 12, 1600),
      fightback: (L) => P.ring(at(L, L.dockPos || v3(0, 0, 0), 0.4), '#ffd27a', 9, 1600),
    };
    function play(fx) {
      if (reduce || !fx || !fx.street) return;
      const L = lands[fx.city]; if (!L) return;
      const key = fx.key.replace(/^st-/, ''), f = ONE[key];
      if (!f) return;
      try { f(L, fx); } catch (err) { console.error('streets3d', key, err); }
    }

    return { animate, play, scenesOf, keys: Object.keys(ONE), stats: () => ST.map((S) => ({ flags: S.flags.count, tents: S.tents.count, barr: S.barr.count, crowd: S.crowd ? S.crowd.n.reduce((a, b) => a + b, 0) : 0 })) };
  }
  root.Streets3D = { create };
})(typeof window !== 'undefined' ? window : globalThis);
