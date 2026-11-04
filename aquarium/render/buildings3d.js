/* Bể Kính · render/buildings3d.js
 * Đặt công trình lên cả sáu đảo theo cấp văn minh (1..12). Kiểu công trình: Lúa Vàng ở render/build/plains/ (mỗi thời một
 * tệp), năm đảo kia ở render/build/isles/ (bộ kiểu kiến trúc chung, mỗi đảo một tệp chọn kiểu, màu, kỳ quan theo thời).
 * Mỗi kiểu đăng ký ERA[cấp] = { yard, pieces, BUILD, NAME, tint? }. Tệp này đọc bố cục, dựng từng công trình bằng
 * render/build/kit3d.js, tìm chỗ đặt (render/build/place3d.js), dọn cây, trải sân, và làm phần chuyển động:
 *   spin [tên, trục, tốc độ] quay · bob [tên, biên độ, nhịp] nhấp nhô · slide [tên, trục, tốc độ, quãng] chạy qua lại
 *   sway [tên, trục, biên độ, nhịp] đung đưa · pulse khối sáng phập phồng · smoke [[x, y, z, cỡ]] khói (render/build/life3d.js)
 * Mảnh { lit: true } là ô cửa sổ sáng đèn về đêm (và đèn đường, render/build/lamps.js). Từ thời 10 mỗi công trình có viền neon
 * (render/build/neon.js outline).
 *
 * Lên đời: sang thời mới, mọi công trình của thời trước đều được thay trong thời đó, không giữ lại cái nào. Thợ làm lần lượt
 * từng chỗ (logic/construction.js với Lúa Vàng; năm đảo kia theo thời gian, setProgressByTime); chỗ nào xong thì công trình
 * cũ ở đó (cùng slot, hoặc đè chỗ, hoặc cái cũ gần nhất chưa có ai thay) đổi ngay thành công trình mới. Hết thời thì cái gì
 * còn sót của thời trước nữa cũng mất. Mỗi đảo một lớp vẽ gộp khi ở xa máy quay (render/build/batch3d.js) cho nhẹ máy.
 * Cần: three.js, render/build/kit3d.js, place3d.js, batch3d.js, life3d.js, các tệp kiểu công trình. */
(function (root, factory) {
  const BK = root.BK || (root.BK = {});
  BK.Buildings3D = factory(BK);
})(typeof self !== 'undefined' ? self : globalThis, function (BK) {
  'use strict';
  // kiểu công trình của từng đảo (theo khoá địa hình của đảo)
  const STYLE_OF = (ter) => (ter === 'plains' ? BK.Plains3D : BK.Isles3D && BK.Isles3D[ter]);
  const SEA_Y = -0.55;     // mặt biển (sea3d.js)
  const FAR = 95;          // máy quay xa đảo hơn thế này thì vẽ đảo bằng khối gộp
  const BATCH_GAP = 1.5;   // giây tối thiểu giữa hai lần gộp lại của một đảo

  function create(o) {
    const { THREE, lands3d } = o, K = BK.BuildKit, PL = BK.Place3D.create(THREE);
    // mỗi đảo: { level, pieces (thời đang có), standing (thời trước, đang được thay dần), group, prevGroup, yard, batch }
    const shown = lands3d.lands.map(() => null);
    const yardOf = (lay, at) => { const p = at(lay.yard.x, lay.yard.z), yard = new THREE.Mesh(K.disc(lay.yard.r, 20), new THREE.MeshStandardMaterial({ color: lay.yard.color || '#c9b184', roughness: 1, flatShading: true })); yard.position.set(p.x, 0.04, p.y); yard.receiveShadow = true; return yard; };
    const near = (P, Q) => { const rr = P.clear + Q.clear * 0.6 + 0.5; return (Q.x - P.x) ** 2 + (Q.z - P.z) ** 2 < rr * rr || (P.kind === 'hall' && Q.kind === 'hall'); };
    const dropGroup = (L, g) => { if (g) { L.g.remove(g); K.dispose(g); } };

    /* ---------- Dựng bố cục một thời ---------- */
    function show(i, level, animate) {
      const L = lands3d.lands[i], old = shown[i];
      let standing = [], prevGroup = null;
      if (old) {
        if (old.batch) old.batch.dispose();
        dropGroup(L, old.prevGroup); // công trình hai thời trước: bỏ hẳn
        if (animate) {
          for (const P of old.pieces) if (P.progress < 1 || !P.g.visible) finish(old, P); // cái nào chưa xong thì coi như đã kịp xong
          standing = old.pieces.filter((P) => P.g.visible && !P.gone && !P.dead);
          prevGroup = old.group;
        } else dropGroup(L, old.group);
      }
      const S = STYLE_OF(L.ter), lay = S && S.ERA && S.ERA[level];
      if (!lay) { dropGroup(L, prevGroup); shown[i] = null; return; }
      const group = new THREE.Group(), pieces = [];
      // trục của làng: phía trước là biển trong (hướng camera nhìn vào), bên phải vuông góc
      const f = new THREE.Vector2(L.inw.x, L.inw.z).normalize(), r = new THREE.Vector2(-f.y, f.x);
      const at = (x, z) => new THREE.Vector2(r.x * x + f.x * z, r.y * x + f.y * z);
      let yard = null; if (lay.yard) { yard = yardOf(lay, at); group.add(yard); group.userData.yard = yard; if (standing.length) yard.visible = false; }
      // mạng đường của đảo (render/build/roads.js) theo toạ độ đảo: công trình không đặt chắn đường, xe chạy trên đường
      const townSpec = lay.pieces.find((P) => P.town);
      if (townSpec && BK.Roads3D) {
        const land = PL.landFor(L, at(0, 0), Math.atan2(f.x, f.y)), N = BK.Roads3D.net(townSpec.net || 'plains', land.edge);
        // cùng phép xoay với lớp đường (công trình đặt ở tâm, rotation.y = góc hướng ra biển trong), để chỗ tránh khớp chỗ vẽ
        const th = Math.atan2(f.x, f.y), c = Math.cos(th), sn = Math.sin(th), rot = (x, z) => [x * c + z * sn, -x * sn + z * c];
        L.roadSegs = BK.Roads3D.segs(N).map(([x0, z0, x1, z1]) => [...rot(x0, z0), ...rot(x1, z1)]);
        L.roadW = (townSpec.roadW || 3) / 2 + 0.4;
        // chỗ hở của tường (theo trục của lớp đường): cổng chính góc 0, hai chỗ bắc cầu sang hai đảo bên cạnh (L.landing)
        L.wallGaps = [0, ...(L.landing || []).map((v) => { const lx = v.x * c - v.z * sn, lz = v.x * sn + v.z * c; return Math.atan2(lx, lz); })];
      }
      // chỗ của các công trình có chỗ cố định trong bố cục, để công trình khác tránh ra (mỗi cái cũng tự tránh đường)
      const fixed = lay.pieces.filter((P) => P.home == null && !P.nudge && !P.outer && !P.town && lay.BUILD[P.kind] && (P.clear || 0) > 0.6).map((P) => { const q = at(P.x, P.z); return { x: q.x, y: q.y, r: P.clear, P }; });
      for (const P of lay.pieces) {
        const build = lay.BUILD[P.kind]; if (!build) continue;
        // chỉ đặt chỗ; hình dựng lúc công trình hiện ra lần đầu (bakeOf), để sang thời không phải dựng cả làng một lúc
        const g = new THREE.Group();
        let p, dir = f, dead = false; // dead: không có chỗ trên đảo, giữ chỗ trong danh sách (khớp thứ tự với logic) nhưng không hiện
        if (P.outer) { const q = PL.outerSpot(L, P, at); if (q) { p = q.p; dir = q.dir; fixed.push({ x: p.x, y: p.y, r: q.r }); } else { p = at(0, 0); dead = true; } }
        else {
          p = at(P.x, P.z);
          // mọi công trình trong làng (trừ nhà chính và lớp đường): dịch tránh đường, núi, hồ và công trình khác
          if (P.kind !== 'hall' && !P.town && (P.clear || 0) > 0.3) {
            p = PL.homeSpot(L, p, P.clear, fixed, P);
            const F = fixed.find((x) => x.P === P); if (F) { F.x = p.x; F.y = p.y; } else fixed.push({ x: p.x, y: p.y, r: P.clear, P });
          }
          if (Array.isArray(P.face)) { const d = at(P.face[0], P.face[1]).sub(p); if (d.lengthSq() > 1e-6) dir = d.normalize(); }
        }
        g.position.set(p.x, P.outer === 'sea' ? SEA_Y : 0, p.y); g.rotation.y = Math.atan2(dir.x, dir.y); g.visible = false;
        g.userData.kind = P.kind; g.userData.name = lay.NAME[P.kind];
        group.add(g);
        const piece = { g, grp: group, kind: P.kind, slot: P.slot || null, home: P.home, outer: P.outer || null, solo: !!P.solo, fitS: 1, anim: null, glows: [], subs: {}, parts: {}, ph: (p.x * 0.37 + p.y * 0.61) % 6, clear: P.clear || 1.5, x: p.x, z: p.y, progress: -1, started: false, dead, spec: P, build, tint: P.tint || lay.tint || null, baked: false };
        // thay cái cũ cùng slot, hoặc cái cũ đè chỗ (solo: lớp đường của làng, kỳ quan, chỉ thay món cùng slot)
        piece.replaces = standing.filter((Q) => (piece.slot && Q.slot === piece.slot) || (!piece.solo && !Q.solo && near(piece, Q) && !(Q.home != null && piece.home != null)));
        pieces.push(piece);
      }
      // cái cũ chưa có ai thay: giao cho công trình mới gần nhất, xong cái đó thì cái cũ cũng mất (thời mới không giữ gì của thời trước)
      const live = pieces.filter((P) => !P.dead && !P.solo);
      for (const Q of standing) if (!pieces.some((P) => P.replaces.includes(Q)) && live.length) {
        let best = live[0], bd = 1e9; for (const P of live) { const d = (P.x - Q.x) ** 2 + (P.z - Q.z) ** 2; if (d < bd) { bd = d; best = P; } }
        best.replaces.push(Q);
      }
      L.g.add(group);
      const pre = lay.pieces.filter((P) => lay.BUILD[P.kind] && P.pre).length;
      shown[i] = { level, pieces, standing, group, prevGroup, yard, pre, tris: 0, count: pieces.length, name: lay.NAME.hall, yardR: lay.yard ? lay.yard.r : 12, L, batch: BK.Batch3D ? BK.Batch3D.create(THREE, L.g, K.mats()) : null, dirty: true, batchAt: -1e9, inBatch: [] };
    }

    /* ---------- Dựng hình và lên đời ---------- */
    // dọn cây chỗ đặt; lớp đường của cả làng (clearRing: [bán kính, rộng, các góc đường toả ra]) dọn dọc đường
    function clearAround(sh, P) {
      lands3d.clearTrees(sh.L, P.x, P.z, P.clear);
      if (!P.spec.town) return;
      // lớp đường của cả làng: dọn cây dọc mạng đường của đảo
      for (const [x0, z0, x1, z1] of sh.L.roadSegs || []) { const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, z1 - z0) / 1.5)); for (let i = 0; i <= n; i++) lands3d.clearTrees(sh.L, x0 + ((x1 - x0) * i) / n, z0 + ((z1 - z0) * i) / n, 2.2); }
      // tường sát mép đảo (render/build/plains/town.js edgeWall): dọn cây dọc mép
      for (let i = 0; i < 120; i++) { const th = (i / 120) * Math.PI * 2, R = sh.L.rOf(th) - 3.5; lands3d.clearTrees(sh.L, Math.cos(th) * R, Math.sin(th) * R, 1.6); }
    }
    const setS = (P, xz, y) => P.g.scale.set(P.fitS * xz, P.fitS * y, P.fitS * xz);
    // dựng hình một công trình (một lần): hàm dựng nhận thông số của món, cấp, và đất quanh nó (land: edge, free)
    function bakeOf(P, sh) {
      if (P.baked) return; P.baked = true;
      const k = new K.Kit(); if (P.tint) k.tint = P.tint;
      const land = PL.landFor(sh.L, new THREE.Vector2(P.x, P.z), P.g.rotation.y); land.gaps = sh.L.wallGaps; // chỗ hở của tường bao
      const opt = Object.assign(Object.create(P.spec), { lv: P.spec.lv || sh.level, land });
      P.anim = P.build(k, opt) || null;
      if (BK.Neon3D && !P.spec.town) BK.Neon3D.outline(k, sh.L.ter, opt.lv); // thành phố neon (thời 10 tới 12): viền sáng chân và nóc
      const m = k.bake(3); P.g.add(m); sh.tris = (sh.tris || 0) + (m.userData.tris || 0);
      if (P.spec.fit) { const bb = new THREE.Box3().setFromObject(m), w = Math.max(bb.max.x - bb.min.x, bb.max.z - bb.min.z); if (w > P.spec.fit) P.fitS = P.spec.fit / w; }
      if (m.userData.glow) P.glows.push(m.userData.glow); if (m.userData.subGlows) P.glows.push(...m.userData.subGlows);
      P.subs = m.userData.subs || {}; for (const n in P.subs) P.subs[n].userData.base = P.subs[n].position.clone();
      P.parts = { main: m.userData.main || null, glow: m.userData.glow || null, lit: m.userData.lit || null };
    }
    // xong một công trình: cái cũ nó thay mất ngay, cái mới đứng đủ cỡ
    function finish(sh, P) {
      P.progress = 1; if (P.dead) return; bakeOf(P, sh); P.g.visible = true; setS(P, 1, 1);
      for (const Q of P.replaces) { Q.g.visible = false; Q.gone = true; }
      if (P.kind === 'hall' && sh.yard) { sh.yard.visible = true; if (sh.prevGroup && sh.prevGroup.userData.yard) sh.prevGroup.userData.yard.visible = false; } // sân mới trải ra khi nhà chính xong
      if (sh.prevGroup && sh.standing.every((Q) => Q.gone)) { dropGroup(sh.L, sh.prevGroup); sh.prevGroup = null; } // thời trước đã thay hết
      sh.dirty = true;
    }
    function applyProgress(sh, P, pr) {
      if (pr === P.progress || P.dead) return;
      P.progress = pr;
      if (pr >= 1) { if (!P.started) { P.started = true; clearAround(sh, P); } finish(sh, P); P.progress = 1; return; }
      P.g.visible = false;
    }
    // Lúa Vàng: tiến độ từ logic (S.build.list[j].progress, 0..1); chỉ nhận tiến độ của đúng thời đang vẽ
    function setProgress(i, list, level) {
      const sh = shown[i]; if (!sh || (level != null && level !== sh.level)) return;
      sh.pieces.forEach((P, j) => applyProgress(sh, P, list && list[j] ? list[j].progress : 1));
    }
    // năm đảo kia (chưa có logic dân): dựng đều theo thời gian, frac là phần đã đi của thời (0..1), xong cả ở 80% thời
    function setProgressByTime(i, frac, level) {
      const sh = shown[i]; if (!sh || (level != null && level !== sh.level)) return;
      const N = sh.pieces.length;
      sh.pieces.forEach((P, j) => applyProgress(sh, P, j < sh.pre || frac >= (0.8 * (j + 1)) / N ? 1 : 0));
    }

    /* ---------- Mỗi khung hình ---------- */
    const LIT = K.litMat ? K.litMat() : null;
    const _v = new THREE.Vector3(), _Y = new THREE.Vector3(0, 1, 0);
    let batchedThisFrame = false;
    // đảo ở xa: gộp mọi khối đứng yên thành khối chung (gộp lại khi có thay đổi, cách nhau ít nhất BATCH_GAP giây)
    function batchIsland(sh, far, ts) {
      if (!sh.batch) return;
      if (!far) { if (sh.inBatch.length) { for (const P of sh.inBatch) for (const k in P.parts) if (P.parts[k]) P.parts[k].visible = true; sh.inBatch = []; sh.batch.show(false); sh.dirty = true; } return; }
      if (!sh.dirty || batchedThisFrame || ts - sh.batchAt < BATCH_GAP) return;
      batchedThisFrame = true; sh.batchAt = ts; sh.dirty = false;
      for (const P of sh.inBatch) for (const k in P.parts) if (P.parts[k]) P.parts[k].visible = true;
      const list = [...sh.pieces, ...sh.standing].filter((P) => P.baked && P.g.visible && !P.gone);
      for (const P of list) P.g.updateMatrixWorld(true);
      sh.batch.rebuild(list, false); // đảo ở xa: không đổ bóng
      for (const P of list) for (const k in P.parts) if (P.parts[k]) P.parts[k].visible = false;
      sh.inBatch = list; sh.batch.show(true);
    }
    // xe chạy dọc vòng đường khép kín A.loop ([[x, z], ...] theo toạ độ của lớp đường): mỗi xe ở quãng đường (thời gian × tốc độ +
    // khoảng lệch), đầu xe quay theo hướng đoạn đường đang đi
    function drive(A, p, ts) {
      if (!A.cum) { A.cum = [0]; for (let i = 0; i < A.loop.length; i++) { const a = A.loop[i], b = A.loop[(i + 1) % A.loop.length]; A.cum.push(A.cum[i] + Math.hypot(b[0] - a[0], b[1] - a[1])); } A.len = A.cum[A.cum.length - 1]; }
      for (const [n, speed, off, y] of A.path) {
        const sub = p.subs[n]; if (!sub) continue;
        let d = (ts * speed + off) % A.len; if (d < 0) d += A.len;
        let i = 0; while (i < A.loop.length - 1 && A.cum[i + 1] < d) i++;
        const a = A.loop[i], b = A.loop[(i + 1) % A.loop.length], u = (d - A.cum[i]) / Math.max(1e-6, A.cum[i + 1] - A.cum[i]);
        sub.position.set(a[0] + (b[0] - a[0]) * u, y, a[1] + (b[1] - a[1]) * u); sub.rotation.y = Math.atan2(b[0] - a[0], b[1] - a[1]);
      }
    }
    function animate(dt, t, night, cam) {
      const ts = t * 0.001; batchedThisFrame = false;
      if (LIT) { LIT.opacity = Math.max(0, Math.min(0.95, ((night || 0) - 0.15) * 1.4)); LIT.visible = LIT.opacity > 0.01; }
      for (const sh of shown) if (sh) {
        const far = !!cam && cam.distanceToSquared(sh.L.center) > FAR * FAR;
        batchIsland(sh, far, ts);
        const emit = sh.emit || (sh.emit = []); emit.length = 0;
        for (const set of [sh.pieces, sh.standing]) for (const p of set) {
          if (!p.g.visible) continue;
          const A = p.anim;
          if (A) {
            if (A.sway) for (const [n, axis, amp, v] of A.sway) if (p.subs[n]) p.subs[n].rotation[axis] = Math.sin(ts * v + p.ph) * amp;
            if (A.smoke && !far) for (const [x, y, z, sz] of A.smoke) { _v.set(x, y, z).multiplyScalar(p.fitS).applyAxisAngle(_Y, p.g.rotation.y).add(p.g.position); emit.push({ x: _v.x, y: _v.y, z: _v.z, s: (sz || 1) * p.fitS }); }
            if (A.spin) for (const [n, axis, v] of A.spin) if (p.subs[n]) p.subs[n].rotation[axis] = ts * v + p.ph;
            if (A.bob) for (const [n, amp, v] of A.bob) if (p.subs[n]) p.subs[n].position.y = p.subs[n].userData.base.y + Math.sin(ts * v * 2 + p.ph) * amp;
            if (A.slide) for (const [n, axis, v, range] of A.slide) if (p.subs[n]) p.subs[n].position[axis] = p.subs[n].userData.base[axis] + Math.sin(ts * v * 0.3 + p.ph) * range;
          if (A.path) drive(A, p, ts); // xe chạy dọc vòng đường (render/build/vehicles.js)
          }
          if (!far) for (const G of p.glows) {
            const fl = A && A.pulse ? 0.7 + 0.3 * Math.sin(ts * 1.6 + p.ph) : 0.86 + 0.14 * Math.sin(ts * 17 + p.ph) * Math.sin(ts * 11 + p.ph * 2);
            G.material.opacity = Math.min(1, (0.7 + 0.25 * (night || 0)) * fl + 0.1);
          }
        }
        if (BK.Life3D) { if (!sh.smoke) sh.smoke = BK.Life3D.create(THREE, sh.L.g); sh.smoke.update(emit, ts); }
      }
    }

    /* ---------- Những chỗ người hay đến (cho người trong làng) ---------- */
    const HOME = new Set(['hut', 'tent', 'house', 'row', 'flats', 'tower', 'pods', 'bud', 'floatHouse', 'folded', 'crystal', 'home']);
    const FIELD = new Set(['field', 'wildRice', 'lily', 'greenhouse', 'knap', 'kiln', 'forge', 'factory', 'hay', 'tractor', 'robot']);
    const SQUARE = new Set(['fire', 'well', 'sun']);
    const MARKET = new Set(['market', 'shop', 'granary', 'press', 'hideRack', 'rack', 'dronePad']);
    const SHRINE = new Set(['totem', 'paintedRock', 'banyan', 'miniPortal', 'shard', 'mote', 'pylon']);
    const SCHOOL = new Set(['school', 'datacenter', 'dish']);
    const NOT_A_PLACE = new Set(['town', 'road', 'asphalt', 'glowRoad', 'lamp', 'pole']);
    function places(i) {
      const sh = shown[i], L = lands3d.lands[i]; if (!sh) return null;
      const out = { hall: null, square: [], field: [], homes: [], homeSlots: [], guard: [], gate: [], site: [], market: [], shrine: [], school: [], outer: [], all: [] }, f = new THREE.Vector2(L.inw.x, L.inw.z).normalize();
      for (const [P, isNew] of [...sh.pieces.map((P) => [P, true]), ...sh.standing.map((P) => [P, false])]) {
        const g = P.g, pos = new THREE.Vector3(g.position.x, 0, g.position.z), fwd = new THREE.Vector3(Math.sin(g.rotation.y), 0, Math.cos(g.rotation.y)), k = P.kind;
        if (isNew && P.progress > 0 && P.progress < 1) { out.site.push(pos.clone().addScaledVector(fwd, Math.max(2.5, P.clear * 0.8))); continue; }
        if (!g.visible || P.gone || NOT_A_PLACE.has(k)) continue;
        const door = pos.clone().addScaledVector(fwd, Math.max(1.6, P.clear * 0.6));
        // cổng thành: bốn chốt gác, hai chốt phía ngoài hai bên lối đi, hai chốt phía trong
        if (P.spec.gate) { const side = new THREE.Vector3(fwd.z, 0, -fwd.x); for (const [d, s2] of [[1.8, 2.9], [1.8, -2.9], [-2.6, 2.9], [-2.6, -2.9]]) out.gate.push(pos.clone().addScaledVector(fwd, d).addScaledVector(side, s2)); continue; }
        if (P.outer) { out.outer.push(P.outer === 'sea' ? null : P.outer === 'coast' ? pos.clone().addScaledVector(fwd, -2.5) : door); continue; }
        out.all.push(door);
        if (k === 'hall') { if (!out.hall || isNew) out.hall = pos.clone().addScaledVector(fwd, 6); }
        else if (P.home != null || HOME.has(k)) { const dv = pos.clone().addScaledVector(fwd, 2.8 * P.fitS); out.homes.push(dv); if (P.home != null && (!out.homeSlots[P.home] || isNew)) out.homeSlots[P.home] = dv; }
        else if (FIELD.has(k)) out.field.push(pos.clone().addScaledVector(fwd, 0.5));
        else if (SQUARE.has(k)) out.square.push(pos.clone().addScaledVector(fwd, 2.2));
        else if (MARKET.has(k)) out.market.push(door);
        else if (SHRINE.has(k)) out.shrine.push(pos.clone().addScaledVector(fwd, 2));
        else if (SCHOOL.has(k) || P.spec.civic === 'school' || P.spec.civic === 'library') out.school.push(door);
        else if (k === 'gate' || k === 'pad' || k === 'station') out.guard.push(pos.clone().addScaledVector(fwd, 3));
      }
      const r = sh.yardR || 12;
      for (const a of [-0.9, 0, 0.9]) out.guard.push(new THREE.Vector3(f.x * r * 0.9 * Math.cos(a) - f.y * r * 0.9 * Math.sin(a), 0, f.y * r * 0.9 * Math.cos(a) + f.x * r * 0.9 * Math.sin(a)));
      if (!out.hall) out.hall = new THREE.Vector3(f.x * 4, 0, f.y * 4);
      if (!out.square.length) out.square.push(new THREE.Vector3(f.x * 9, 0, f.y * 9));
      if (!out.field.length) out.field.push(new THREE.Vector3(f.x * 14, 0, f.y * 14));
      if (!out.homes.length) out.homes.push(out.square[0].clone());
      // chưa có chợ, chỗ thờ, trường riêng thì dùng chỗ có nghĩa giữa các nhà (không dồn về nhà chính, không dồn giữa sân)
      const H = out.homes;
      if (!out.market.length) out.market.push(...[H[1 % H.length], H[Math.floor(H.length / 2)]].map((v) => v.clone().multiplyScalar(0.85)));
      if (!out.shrine.length) out.shrine.push(out.square[out.square.length - 1].clone().add(new THREE.Vector3(-2.5, 0, -1)));
      if (!out.school.length) out.school.push(H[H.length - 1].clone().multiplyScalar(0.9));
      out.outer = out.outer.filter(Boolean); // người đi đường, thợ đi tu bổ có khi ra tới bến, trại, đền trong rừng
      out.all.push(...out.outer);
      if (!out.all.length) out.all.push(...out.homes);
      return out;
    }
    // số liệu một đảo (bảng làng, bài kiểm tra): old = số công trình của thời trước còn đứng, done = số công trình thời này đã có
    const stats = (i) => shown[i] && { level: shown[i].level, tris: Math.round(shown[i].tris), count: shown[i].count, hall: shown[i].name, old: shown[i].standing.filter((P) => P.g.visible && !P.gone).length, done: shown[i].pieces.filter((P) => P.g.visible).length };
    return { show, setProgress, setProgressByTime, animate, stats, places };
  }
  return { create };
});
