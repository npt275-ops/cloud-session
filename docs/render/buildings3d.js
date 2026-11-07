/* Bể Kính · render/buildings3d.js
 * Đặt công trình lên cả sáu đảo theo cấp văn minh (1..12). Kiểu công trình: Lúa Vàng ở render/build/plains/ (mỗi thời một
 * tệp), năm đảo kia ở render/build/isles/ (bộ kiểu kiến trúc chung, mỗi đảo một tệp chọn kiểu, màu, kỳ quan theo thời).
 * Mỗi kiểu đăng ký ERA[cấp] = { yard, pieces, BUILD, NAME, tint? }. Tệp này đọc bố cục, dựng từng công trình bằng
 * render/build/kit3d.js, tìm chỗ đặt (render/build/place3d.js), dọn cây, trải sân, và làm phần chuyển động:
 *   spin [tên, trục, tốc độ] quay · bob [tên, biên độ, nhịp] nhấp nhô · slide [tên, trục, tốc độ, quãng] chạy qua lại
 *   sway [tên, trục, biên độ, nhịp] đung đưa · pulse khối sáng phập phồng · smoke [[x, y, z, cỡ]] khói (render/build/life3d.js)
 * Mảnh { lit: true } là ô cửa sổ sáng đèn về đêm (và đèn đường, render/build/lamps.js). Từ thời 10 mỗi công trình có đường viền neon
 * chạy dọc các cạnh (render/build/neon.js edges).
 *
 * Lên đời: sang thời mới, mọi công trình của thời trước đều được thay trong thời đó, không giữ lại cái nào. Thợ làm lần lượt
 * từng chỗ (logic/construction.js với Lúa Vàng; năm đảo kia theo thời gian, setProgressByTime); chỗ nào xong thì công trình
 * cũ ở đó (cùng slot, hoặc đè chỗ, hoặc cái cũ gần nhất chưa có ai thay) đổi ngay thành công trình mới. Hết thời thì cái gì
 * còn sót của thời trước nữa cũng mất. Mỗi đảo một lớp vẽ gộp khi ở xa máy quay (render/build/batch3d.js) cho nhẹ máy.
 * Bãi làm việc (kho, bãi gỗ, mỏ đá, chỗ làm năng lượng, xưởng, bãi tập; render/build/workyards3d.js) dựng cùng mỗi thời, sau
 * các công trình; places() trả cả chỗ làm của các bãi đó, và không còn chỗ thay thế vô nghĩa (design/npc-song-that.md mục 2).
 * Cần: three.js, render/build/kit3d.js, place3d.js, batch3d.js, life3d.js, workyards3d.js, các tệp kiểu công trình. */
(function (root, factory) {
  const BK = root.BK || (root.BK = {});
  BK.Buildings3D = factory(BK);
})(typeof self !== 'undefined' ? self : globalThis, function (BK) {
  'use strict';
  // kiểu công trình của từng đảo (theo khoá địa hình của đảo)
  const STYLE_OF = (ter) => (ter === 'plains' ? BK.Plains3D : BK.Isles3D && BK.Isles3D[ter]);
  const SEA_Y = -0.55;     // mặt biển (sea3d.js)
  const FAR = 95;          // máy quay xa đảo hơn thế này thì vẽ đảo bằng khối gộp
  const BATCH_GAP = 1.5;   // đảo xa: gộp lại khi đã yên (không có công trình nào xong thêm) ít nhất chừng này giây
  const NEAR_GAP = 4;      // đảo gần: gộp phần đứng yên khi đã yên chừng này giây (phần sáng nhấp nháy vẫn vẽ riêng)
  const NEAR_KINDS = ['main', 'flat', 'lit', 'neon'];
  const BAKE_MS = 6, BAKE_MS_BUSY = 14; // mỗi khung hình dựng hình công trình tối đa chừng này mili giây (dựng rải, sang thời không khựng); hàng đợi dài (vừa sang thời) thì dựng nhanh hơn
  const SKIP_KEY = new Set(['x', 'z', 'face', 'clear', 'nudge', 'home', 'pre']); // thông số chỉ về chỗ đặt, không đổi hình

  function create(o) {
    const { THREE, lands3d } = o, K = BK.BuildKit, PL = BK.Place3D.create(THREE), WY = BK.WorkYards3D.create({ THREE, lands3d });
    // mỗi đảo: { level, pieces (thời đang có), standing (thời trước, đang được thay dần), group, prevGroup, yard, batch }
    const shown = lands3d.lands.map(() => null);
    const yardOf = (lay, at) => { const p = at(lay.yard.x, lay.yard.z), yard = new THREE.Mesh(K.disc(lay.yard.r, 20), new THREE.MeshStandardMaterial({ color: lay.yard.color || '#c9b184', roughness: 1, flatShading: true })); yard.position.set(p.x, 0.04, p.y); yard.receiveShadow = true; return yard; };
    const near = (P, Q) => { const rr = P.clear + Q.clear * 0.6 + 0.5; return (Q.x - P.x) ** 2 + (Q.z - P.z) ** 2 < rr * rr || (P.kind === 'hall' && Q.kind === 'hall'); };
    // bỏ một nhóm công trình: trả bộ nhớ hình, trừ hình dùng chung còn nằm trong kho BAKED
    const SHARED = new WeakSet();
    const dropGroup = (L, g) => { if (g) { L.g.remove(g); g.traverse((o) => { if ((o.isMesh || o.isLine) && !SHARED.has(o.geometry)) o.geometry.dispose(); }); } };
    /* ---------- Kho hình đã dựng (dựng một lần, dùng lại) ----------
     * Công trình cùng hàm dựng, cùng thông số (trừ chỗ đặt), cùng thời, cùng đảo, cùng cách tô màu cho ra cùng một hình: dựng
     * một lần, các cái sau sao nhóm khối dùng chung hình (mỗi cái vẫn có vật liệu sáng riêng để nhấp nháy lệch nhau). Hàm dựng
     * nào hỏi tới đất quanh nó (land: lớp đường, tường, công trình ven bờ) thì hình theo chỗ, không dùng lại. */
    const BAKED = new Map(), ids = new WeakMap(); let nextId = 1;
    const idOf = (f) => { if (!f) return 0; if (!ids.has(f)) ids.set(f, nextId++); return ids.get(f); };
    function keyOf(P, lv, ter) {
      if (P.spec.town || P.outer) return null;
      const own = {}; for (const k of Object.keys(P.spec)) if (!SKIP_KEY.has(k) && typeof P.spec[k] !== 'function') own[k] = P.spec[k];
      try { return idOf(P.build) + '|' + lv + '|' + ter + '|' + idOf(P.tint) + '|' + JSON.stringify(own); } catch (e) { return null; }
    }
    function evict(level) { for (const [k, E] of BAKED) if (Math.abs(E.lv - level) > 2) { BAKED.delete(k); E.tpl.traverse((o) => { if (o.isMesh || o.isLine) o.geometry.dispose(); }); } }
    // sao một nhóm khối đã dựng: dùng chung hình, vai trò (main, flat, glow, lit, subs) gán lại cho bản sao
    function cloneBaked(src, base) {
      const dst = new THREE.Group(); dst.name = src.name;
      for (const c of src.children) {
        let n;
        if (c.isMesh || c.isLine) { n = c.isLine ? new THREE.LineSegments(c.geometry, c.material) : new THREE.Mesh(c.geometry, c === src.userData.glow ? c.material.clone() : c.material); n.castShadow = c.castShadow; n.receiveShadow = c.receiveShadow; n.renderOrder = c.renderOrder; n.name = c.name; }
        else n = cloneBaked(c, base);
        if (c.isGroup && base && base[c.name]) n.position.copy(base[c.name]); else n.position.copy(c.position);
        n.rotation.set(0, 0, 0); if (!c.isGroup) n.rotation.copy(c.rotation); n.scale.copy(c.scale);
        dst.add(n);
      }
      for (const k of ['main', 'flat', 'glow', 'lit']) if (src.userData[k]) dst.userData[k] = dst.children[src.children.indexOf(src.userData[k])];
      dst.userData.tris = src.userData.tris; dst.userData.subs = {};
      for (const nm in src.userData.subs || {}) { const c = dst.children[src.children.indexOf(src.userData.subs[nm])]; dst.userData.subs[nm] = c; if (c.userData.glow) (dst.userData.subGlows || (dst.userData.subGlows = [])).push(c.userData.glow); }
      return dst;
    }
    /* ---------- Dựng rải theo khung hình ----------
     * Công trình xong (tiến độ 1) chưa có hình thì xếp hàng; mỗi khung hình dựng vài cái (BAKE_MS), đảo gần máy quay trước.
     * Cái cũ nó thay vẫn đứng tới khi cái mới có hình, nên không có lúc trống. */
    const queue = [];
    function pump(cam) {
      const t0 = performance.now(); let n = 0;
      const ms = queue.length > 40 ? BAKE_MS_BUSY : BAKE_MS;
      while (queue.length && (n === 0 || performance.now() - t0 < ms)) {
        let bi = 0;
        if (cam && queue.length > 1) { let bd = 1e18; for (let j = 0; j < queue.length; j++) { const d = cam.distanceToSquared(queue[j][0].L.center); if (d < bd - 1) { bd = d; bi = j; } } }
        const [sh, P] = queue.splice(bi, 1)[0]; P.queued = false; n++;
        if (shown.includes(sh) && !P.dead && !P.gone) finish(sh, P);
      }
    }
    // dựng hết hàng đợi ngay (bài kiểm tra, chụp ảnh)
    function flush() { while (queue.length) { const [sh, P] = queue.shift(); P.queued = false; if (shown.includes(sh) && !P.dead && !P.gone) finish(sh, P); } }

    /* ---------- Dựng bố cục một thời ---------- */
    function show(i, level, animate) {
      const L = lands3d.lands[i], old = shown[i];
      let standing = [], prevGroup = null;
      if (old) {
        if (old.wy) for (const Y of old.wy.yards) Y.g.visible = false; // bãi làm việc của thời cũ: thời mới dựng bãi mới
        if (old.batch) { if (old.inBatch.length) unbatch(old); old.batch.dispose(); } // trả lại hình riêng cho công trình cũ còn đứng
        dropGroup(L, old.prevGroup); // công trình hai thời trước: bỏ hẳn
        if (animate) {
          for (const P of old.pieces) if (!P.queued && (P.progress < 1 || !P.g.visible)) finish(old, P); // cái nào chưa xong thì coi như đã kịp xong (cái đang chờ dựng hình chưa ai thấy: bỏ qua, thời mới thay luôn)
          standing = old.pieces.filter((P) => P.g.visible && !P.gone && !P.dead);
          prevGroup = old.group;
        } else dropGroup(L, old.group);
      }
      const S = STYLE_OF(L.ter), lay = S && S.ERA && S.ERA[level];
      evict(level);
      if (!lay) { dropGroup(L, prevGroup); shown[i] = null; return; }
      const group = new THREE.Group(), pieces = [];
      // trục của làng: phía trước là biển trong (hướng camera nhìn vào), bên phải vuông góc
      const f = new THREE.Vector2(L.inw.x, L.inw.z).normalize(), r = new THREE.Vector2(-f.y, f.x);
      const at = (x, z) => new THREE.Vector2(r.x * x + f.x * z, r.y * x + f.y * z);
      let yard = null; if (lay.yard) { yard = yardOf(lay, at); group.add(yard); group.userData.yard = yard; if (standing.length) yard.visible = false; }
      // mạng đường của đảo (render/build/roads.js) theo toạ độ đảo: công trình không đặt chắn đường, xe chạy trên đường
      const townSpec = lay.pieces.find((P) => P.town);
      if (townSpec && BK.Roads3D) {
        // cùng phép xoay với lớp đường (công trình đặt ở tâm, rotation.y = góc hướng ra biển trong), để chỗ tránh khớp chỗ vẽ;
        // cùng một mạng đường với lúc dựng đất (render/build/roads.js isleSegs), nên núi, hồ, cây và công trình cùng tránh một đường
        const th = Math.atan2(f.x, f.y), c = Math.cos(th), sn = Math.sin(th);
        L.roadSegs = BK.Roads3D.isleSegs(L, townSpec.net || 'plains');
        L.roadW = BK.Roads3D.HALF; // nửa mặt đường rộng nhất cộng vỉa hè
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
      for (let j = queue.length - 1; j >= 0; j--) if (queue[j][0] === old) { queue[j][1].queued = false; queue.splice(j, 1); } // việc dựng của thời cũ trên đảo này: bỏ
      const pre = lay.pieces.filter((P) => lay.BUILD[P.kind] && P.pre).length;
      // bãi làm việc của thời này (sau các công trình, tránh chỗ của chúng)
      const wy = WY.build(L, group, fixed, f, level);
      shown[i] = { level, pieces, standing, group, prevGroup, yard, pre, wy, tris: 0, count: pieces.length, name: lay.NAME.hall, yardR: lay.yard ? lay.yard.r : 12, L, fixed, batch: BK.Batch3D ? BK.Batch3D.create(THREE, L.g, K.mats()) : null, dirty: true, changedAt: -1e9, inBatch: [] };
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
    // dựng hình một công trình (một lần): hàm dựng nhận thông số của món, cấp, và đất quanh nó (land: edge, free); dựng xong thì
    // đo cỡ thật, lấn đường thì dời hay thu nhỏ vừa đủ (render/build/place3d.js clearRoad)
    function bakeOf(P, sh) {
      if (P.baked) return; P.baked = true;
      const lv = P.spec.lv || sh.level, key = keyOf(P, lv, sh.L.ter), E = key && BAKED.get(key);
      let m;
      if (E) { m = cloneBaked(E.tpl, E.base); P.anim = E.anim; P.fitS = E.fitS; }
      else {
        const k = new K.Kit(); if (P.tint) k.tint = P.tint;
        // đất quanh công trình; hàm dựng nào hỏi tới thì hình theo chỗ đặt, không cất vào kho
        const land0 = PL.landFor(sh.L, new THREE.Vector2(P.x, P.z), P.g.rotation.y); let usedLand = false;
        const land = { edge: (a) => { usedLand = true; return land0.edge(a); }, free: (x, z, r) => { usedLand = true; return land0.free(x, z, r); }, get gaps() { usedLand = true; return sh.L.wallGaps; } }; // chỗ hở của tường bao
        const opt = Object.assign(Object.create(P.spec), { lv, land });
        P.anim = P.build(k, opt) || null;
        const src = k.bake(3);
        // thành phố neon (thời 10 tới 12): đường viền sáng chạy dọc các cạnh của công trình (render/build/neon.js edges)
        const eg = BK.Neon3D && !P.spec.town && src.userData.main ? BK.Neon3D.edges(src.userData.main.geometry, sh.L.ter, lv) : null;
        if (eg) { const ln = new THREE.LineSegments(eg, K.neonMat()); ln.renderOrder = 2; ln.name = 'neon'; src.add(ln); }
        if (P.spec.fit) { const bb = new THREE.Box3().setFromObject(src), w = Math.max(bb.max.x - bb.min.x, bb.max.z - bb.min.z); if (w > P.spec.fit) P.fitS = P.spec.fit / w; }
        if (key && !usedLand) {
          const base = {}; for (const n in src.userData.subs || {}) base[n] = src.userData.subs[n].position.clone();
          src.traverse((o) => { if (o.isMesh || o.isLine) SHARED.add(o.geometry); });
          BAKED.set(key, { tpl: src, base, anim: P.anim, fitS: P.fitS, lv });
          m = cloneBaked(src, base);
        } else m = src;
      }
      m.updateMatrixWorld(true);
      // không chắn đường: trừ lớp đường, cổng thành nằm trên đường chính, công trình ngoài khơi
      if (sh.L.roadSegs && !P.spec.town && !P.spec.gate && P.outer !== 'sea') {
        const q = PL.clearRoad(sh.L, { x: P.x, z: P.z, rotY: P.g.rotation.y, fitS: P.fitS, hall: P.kind === 'hall', self: P.spec }, m, sh.fixed);
        if (q) { sh.moved = (sh.moved || 0) + (q.stuck ? 0 : 1); sh.stuck = (sh.stuck || 0) + (q.stuck ? 1 : 0); if (!q.stuck) { P.x = q.x; P.z = q.z; P.fitS = q.fitS; P.g.position.x = q.x; P.g.position.z = q.z; } }
      }
      P.g.add(m); sh.tris = (sh.tris || 0) + (m.userData.tris || 0);
      if (m.userData.glow) P.glows.push(m.userData.glow); if (m.userData.subGlows) P.glows.push(...m.userData.subGlows);
      P.subs = m.userData.subs || {}; for (const n in P.subs) P.subs[n].userData.base = P.subs[n].position.clone();
      P.parts = { main: m.userData.main || null, flat: m.userData.flat || null, glow: m.userData.glow || null, lit: m.userData.lit || null, neon: m.children.find((c) => c.name === 'neon') || null };
    }
    // xong một công trình: cái cũ nó thay mất ngay, cái mới đứng đủ cỡ
    function finish(sh, P) {
      P.progress = 1; if (P.dead) return; bakeOf(P, sh); P.g.visible = true; setS(P, 1, 1);
      for (const Q of P.replaces) { if (Q.inBatch) sh.unbatch = true; Q.g.visible = false; Q.gone = true; } // cái cũ đang nằm trong khối gộp: tách khối gộp ra ngay
      if (P.kind === 'hall' && sh.yard) { sh.yard.visible = true; if (sh.prevGroup && sh.prevGroup.userData.yard) sh.prevGroup.userData.yard.visible = false; } // sân mới trải ra khi nhà chính xong
      if (sh.prevGroup && sh.standing.every((Q) => Q.gone)) { dropGroup(sh.L, sh.prevGroup); sh.prevGroup = null; } // thời trước đã thay hết
      sh.dirty = true; sh.changedAt = performance.now() * 0.001;
    }
    function applyProgress(sh, P, pr) {
      if (pr === P.progress || P.dead) return;
      P.progress = pr;
      if (pr >= 1) { if (!P.started) { P.started = true; clearAround(sh, P); } P.progress = 1; if (P.baked) finish(sh, P); else if (!P.queued) { P.queued = true; queue.push([sh, P]); } return; } // chưa có hình: xếp hàng dựng rải
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
    // gộp phần đứng yên của cả đảo thành ít khối: đảo xa gộp hết, không đổ bóng; đảo gần gộp khối chính, mảnh dẹt, cửa sổ sáng,
    // viền neon (có đổ bóng), phần sáng nhấp nháy vẫn vẽ riêng. Gộp lại khi đảo đã yên (BATCH_GAP, NEAR_GAP giây không có công
    // trình nào xong thêm), mỗi khung hình nhiều nhất một đảo. Công trình mới xong thì tạm vẽ riêng; cái cũ trong khối gộp bị
    // thay, hay máy quay đi gần ra xa, thì tách khối gộp ngay (nhẹ, không phải gộp) rồi chờ yên mới gộp lại.
    function unbatch(sh) { for (const P of sh.inBatch) { P.inBatch = false; for (const k in P.parts) if (P.parts[k]) P.parts[k].visible = true; } sh.inBatch = []; sh.batch.show(false); }
    function batchIsland(sh, far, ts) {
      if (!sh.batch) return;
      const mode = far ? 'far' : 'near';
      if (sh.unbatch || (sh.batchMode && sh.batchMode !== mode)) { sh.unbatch = false; if (sh.inBatch.length) unbatch(sh); sh.batchMode = null; sh.dirty = true; sh.changedAt = far ? -1e9 : Math.max(sh.changedAt, ts - NEAR_GAP * 0.5); } // ra xa: gộp ngay như trước; vào gần: chờ máy quay yên một chút
      if (!sh.dirty || batchedThisFrame || ts - sh.changedAt < (far ? BATCH_GAP : NEAR_GAP)) return;
      batchedThisFrame = true; sh.dirty = false;
      if (sh.inBatch.length) unbatch(sh);
      const kinds = far ? null : NEAR_KINDS;
      const list = [...sh.pieces, ...sh.standing].filter((P) => P.baked && P.g.visible && !P.gone);
      for (const P of list) P.g.updateMatrixWorld(true);
      sh.batch.rebuild(list, !far, kinds);
      for (const P of list) { P.inBatch = true; for (const k of kinds || Object.keys(P.parts)) if (P.parts[k]) P.parts[k].visible = false; }
      sh.inBatch = list; sh.batchMode = mode; sh.batch.show(true);
    }
    // xe chạy, nhường người đi bộ: render/build/traffic3d.js
    const traffic = BK.Traffic3D.create();
    // speed: 1, 2, 4 — xe chạy theo giờ game (gameT); quạt quay, nhấp nhô, khói, đèn chập chờn theo giờ thực (ts)
    let gameT = 0;
    function animate(dt, t, night, cam, speed) {
      const ts = t * 0.001; batchedThisFrame = false; gameT += Math.min(0.1, Math.max(0, dt || 0) / 1000) * (speed || 1);
      if (queue.length) pump(cam);
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
          if (A.path) traffic.drive(shown.indexOf(sh), sh.level, A, p, gameT); // xe chạy dọc vòng đường, nhường người đi bộ
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
    const FIELD = new Set(['field', 'wildRice', 'lily', 'greenhouse', 'hay', 'tractor', 'robot']);   // chỗ trồng trọt
    const CRAFT = new Set(['knap', 'kiln', 'forge', 'factory']);                                      // xưởng (làm hàng quý)
    const SQUARE = new Set(['fire', 'well', 'sun']);
    const MARKET = new Set(['market', 'shop', 'granary', 'press', 'hideRack', 'rack', 'dronePad']);
    const SHRINE = new Set(['totem', 'paintedRock', 'banyan', 'miniPortal', 'shard', 'mote', 'pylon']);
    const SCHOOL = new Set(['school', 'datacenter', 'dish']);
    const NOT_A_PLACE = new Set(['town', 'road', 'asphalt', 'glowRoad', 'lamp', 'pole']);
    function places(i) {
      const sh = shown[i], L = lands3d.lands[i]; if (!sh) return null;
      const out = { hall: null, square: [], field: [], homes: [], homeSlots: [], guard: [], gate: [], gateL: [], gateR: [], podium: null, site: [], market: [], shrine: [], school: [], outer: [], all: [], store: [], wood: [], stone: [], power: [], craft: [], drill: [] }, f = new THREE.Vector2(L.inw.x, L.inw.z).normalize();
      for (const [P, isNew] of [...sh.pieces.map((P) => [P, true]), ...sh.standing.map((P) => [P, false])]) {
        const g = P.g, pos = new THREE.Vector3(g.position.x, 0, g.position.z), fwd = new THREE.Vector3(Math.sin(g.rotation.y), 0, Math.cos(g.rotation.y)), k = P.kind;
        if (isNew && P.progress > 0 && P.progress < 1) { out.site.push(pos.clone().addScaledVector(fwd, Math.max(2.5, P.clear * 0.8))); continue; }
        if ((!g.visible && !P.queued) || P.gone || NOT_A_PLACE.has(k)) continue; // đang chờ dựng hình (P.queued): đã xong, sắp hiện
        const door = pos.clone().addScaledVector(fwd, Math.max(1.6, P.clear * 0.6));
        // cổng thành: bốn chốt gác đều ở PHÍA TRONG cổng (hai hàng, hai bên lối đi), không ai đứng ngoài tường hay ra khỏi đảo
        if (P.spec.gate) { const side = new THREE.Vector3(fwd.z, 0, -fwd.x); for (const [d, s2] of [[-2.4, 2.9], [-2.4, -2.9], [-4.9, 2.9], [-4.9, -2.9]]) out.gate.push(pos.clone().addScaledVector(fwd, d).addScaledVector(side, s2)); continue; }
        if (P.outer) { out.outer.push(P.outer === 'sea' ? null : P.outer === 'coast' ? pos.clone().addScaledVector(fwd, -2.5) : door); continue; }
        out.all.push(door);
        if (k === 'hall') { if (!out.hall || isNew) out.hall = pos.clone().addScaledVector(fwd, 6); }
        else if (P.home != null || HOME.has(k)) { const dv = pos.clone().addScaledVector(fwd, 2.8 * P.fitS); out.homes.push(dv); if (P.home != null && (!out.homeSlots[P.home] || isNew)) out.homeSlots[P.home] = dv; }
        else if (FIELD.has(k)) out.field.push(pos.clone().addScaledVector(fwd, 0.5));
        else if (CRAFT.has(k)) out.craft.push(door);
        else if (SQUARE.has(k)) out.square.push(pos.clone().addScaledVector(fwd, 2.2));
        else if (MARKET.has(k)) out.market.push(door);
        else if (SHRINE.has(k)) out.shrine.push(pos.clone().addScaledVector(fwd, 2));
        else if (SCHOOL.has(k) || P.spec.civic === 'school' || P.spec.civic === 'library') out.school.push(door);
        else if (k === 'gate' || k === 'pad' || k === 'station') out.guard.push(pos.clone().addScaledVector(fwd, 3));
      }
      // cổng phụ trái, phải (chỗ hở tường nơi bắc cầu, L.wallGaps theo trục lớp đường): hai chốt mỗi bên, lùi vào trong tường;
      // bục diễn thuyết: giữa sân trước nhà chính (logic/posts.js)
      if (L.wallGaps && L.wallGaps.length > 2) {
        const th = Math.atan2(f.x, f.y), c = Math.cos(th), sn = Math.sin(th);
        [['gateL', L.wallGaps[1]], ['gateR', L.wallGaps[2]]].forEach(([k, g]) => { const dx = Math.sin(g), dz = Math.cos(g), X = dx * c + dz * sn, Z = -dx * sn + dz * c, R = L.rOf(Math.atan2(Z, X)) - 7.5, base = new THREE.Vector3(X * R, 0, Z * R), tan = new THREE.Vector3(-Z, 0, X); out[k] = [base.clone().addScaledVector(tan, 2.4), base.clone().addScaledVector(tan, -2.4)]; });
      }
      // vòng đi dạo quanh nhà chính: tâm và bán kính theo khung bao thật của nhà chính đang đứng
      { const H = sh.pieces.find((P) => P.kind === 'hall' && P.g.visible) || sh.standing.find((P) => P.kind === 'hall' && P.g.visible && !P.gone);
        if (H) { const bb = new THREE.Box3().setFromObject(H.g), c = bb.getCenter(new THREE.Vector3()).sub(L.g.position); out.hallC = new THREE.Vector3(c.x, 0, c.z); out.hallR = Math.max(bb.max.x - bb.min.x, bb.max.z - bb.min.z) / 2; } }
      out.podium = new THREE.Vector3(f.x * 4, 0, f.y * 4); out.podiumFace = new THREE.Vector3(f.x * 12, 0, f.y * 12);
      // chốt tuần tra, luyện quân: rải dọc phía trong tường thành (xa sân giữa), không dồn quanh nhà chính
      { const a0 = Math.atan2(f.y, f.x); for (let k = 0; k < 6; k++) { const a = a0 + Math.PI / 6 + (k * Math.PI) / 3, R = L.rOf(a) - 10; out.guard.push(new THREE.Vector3(Math.cos(a) * R, 0, Math.sin(a) * R)); } }
      if (!out.hall) out.hall = new THREE.Vector3(f.x * 4, 0, f.y * 4);
      if (!out.square.length) out.square.push(new THREE.Vector3(f.x * 9, 0, f.y * 9));
      if (!out.homes.length) out.homes.push(out.square[0].clone());
      // bãi làm việc (render/build/workyards3d.js): chỗ làm phía trước mỗi bãi; mảnh ruộng trồng cộng thêm vào ruộng
      if (sh.wy) for (const Y of sh.wy.yards) (Y.kind === 'farm' ? out.field : out[Y.kind]).push(...Y.spots);
      // thời đầu chưa có chợ, chỗ thờ, trường riêng: đổi chác, cúng tế, dạy trẻ đều ở sân làng (quanh đống lửa, giếng) như
      // làng thật; không dùng chỗ thay thế vô nghĩa (trước cửa một nhà bất kỳ)
      const sq = (k) => out.square.map((v, j) => v.clone().add(new THREE.Vector3(Math.cos(k + j), 0, Math.sin(k + j)).multiplyScalar(2.5)));
      if (!out.market.length) out.market.push(...sq(0));
      if (!out.shrine.length) out.shrine.push(...sq(2));
      if (!out.school.length) out.school.push(...sq(4));
      out.outer = out.outer.filter(Boolean); // người đi đường, thợ đi tu bổ có khi ra tới bến, trại, đền trong rừng
      out.outer = out.outer.filter((v) => L.inside(v.x, v.z, 5.5)); // chỉ những chỗ còn trong tường thành (bến, trại ngoài tường thì không tới)
      out.all.push(...out.outer);
      if (!out.all.length) out.all.push(...out.homes);
      return out;
    }
    // số liệu một đảo (bảng làng, bài kiểm tra): old = số công trình của thời trước còn đứng, done = số công trình thời này đã có
    const stats = (i) => shown[i] && { level: shown[i].level, tris: Math.round(shown[i].tris), count: shown[i].count, hall: shown[i].name, old: shown[i].standing.filter((P) => P.g.visible && !P.gone).length, done: shown[i].pieces.filter((P) => P.g.visible).length, moved: shown[i].moved || 0, stuck: shown[i].stuck || 0 };
    // chỉ cho bài kiểm tra: đo lại chỗ lấn đường của các công trình đang đứng (như lúc dựng), trạng thái gộp khối của một đảo
    const debug = {
      roadCheck: (i, all) => { const sh = shown[i]; if (!sh) return null; return sh.pieces.filter((P) => P.baked && P.g.visible && !P.spec.town && !P.spec.gate).map((P) => { const m = P.g.children[0]; if (!m) return null; P.g.remove(m); m.updateMatrixWorld(true); const fp = PL.footprint(m, P.g.rotation.y, P.fitS); P.g.add(m); return { kind: P.kind, x: +P.x.toFixed(1), z: +P.z.toFixed(1), r: +fp.r.toFixed(2), blocks: PL.blocks(sh.L, fp, P.x, P.z), fitS: +P.fitS.toFixed(2) }; }).filter((x) => x && (x.blocks || all)); },
      batchInfo: (i) => shown[i] && { mode: shown[i].batchMode, inBatch: shown[i].inBatch.length, dirty: shown[i].dirty, quiet: +(performance.now() * 0.001 - shown[i].changedAt).toFixed(1) },
    };
    // đống hàng trong kho của đảo i theo lượng hàng thật (ratio: 0..1 mỗi thứ, game/cities.js mỗi giây)
    const setStock = (i, ratio) => { if (shown[i] && shown[i].wy) WY.setStock(shown[i].wy.piles, ratio); };
    return { show, setProgress, setProgressByTime, animate, stats, places, setStock, setPeds: (i, list) => traffic.setPeds(i, list), flush, debug, queued: () => queue.length, cacheSize: () => BAKED.size };
  }
  return { create };
});
