/* Bể Kính · render/buildings3d.js
 * Đặt công trình lên đảo theo cấp văn minh (1..12). Kiểu công trình của từng đảo nằm ở render/build/<đảo>/ (mỗi thời một
 * tệp, đăng ký vào ERA[cấp] = { yard, pieces, BUILD, NAME }); tệp này chỉ đọc bố cục, dựng từng công trình bằng
 * render/build/kit3d.js, xoay mặt trước về đúng hướng, dọn cây chỗ đặt, trải sân, và làm phần chuyển động:
 *   spin [tên, trục, tốc độ]   quay (cánh quạt, cổng, vòng sáng)
 *   bob  [tên, biên độ, nhịp]  nhấp nhô (khí cầu, drone, nhà lơ lửng)
 *   slide [tên, trục, tốc độ, quãng]  chạy qua lại (đầu máy)
 *   pulse                      khối sáng phập phồng
 * Lên đời theo logic (logic/construction.js, setProgress): công trình các thời trước không biến mất; sang thời mới, thợ làm
 * lần lượt từng chỗ, chỗ nào làm xong thì công trình ở đó đổi ngay sang kiểu của thời mới (nhà riêng số i thay nhà số i),
 * chỗ trống thì công trình mới hiện ra ngay. Cái cũ không có gì thay thì giữ nguyên. Nhà riêng (home) dịch tránh núi,
 * hồ, công trình khác; công trình ngoài làng (outer: coast, sea, forest) tìm chỗ trống trên đảo. Đảo nào chưa có kiểu thì để trống.
 * Cần: three.js, render/build/kit3d.js, các tệp render/build/<đảo>/. */
(function (root, factory) {
  const BK = root.BK || (root.BK = {});
  BK.Buildings3D = factory(BK);
})(typeof self !== 'undefined' ? self : globalThis, function (BK) {
  'use strict';
  const STYLE_OF = { plains: () => BK.Plains3D }; // thêm đảo khác ở đây khi có tệp kiểu công trình
  const SEA_Y = -0.55; // mặt biển (sea3d.js)

  function create(o) {
    const { THREE, lands3d } = o, K = BK.BuildKit;
    // mỗi đảo: { level, pieces (công trình của thời đang có), standing (công trình các thời trước còn đứng), groups, yard }
    const shown = lands3d.lands.map(() => null);
    let clock = 0;
    const yardOf = (lay, at) => { const p = at(lay.yard.x, lay.yard.z), yard = new THREE.Mesh(K.disc(lay.yard.r, 20), new THREE.MeshStandardMaterial({ color: lay.yard.color || '#c9b184', roughness: 1, flatShading: true })); yard.position.set(p.x, 0.04, p.y); yard.receiveShadow = true; return yard; };
    const near = (P, Q) => { const rr = P.clear + Q.clear * 0.6 + 0.5; return (Q.x - P.x) ** 2 + (Q.z - P.z) ** 2 < rr * rr || (P.kind === 'hall' && Q.kind === 'hall'); };
    const dropGroup = (L, g) => { L.g.remove(g); K.dispose(g); };

    // dựng sẵn công trình của một đảo ở một cấp; cái nào hiện là do tiến độ của logic (setProgress).
    // animate (sang thời mới): công trình các thời trước vẫn đứng nguyên. Công trình mới đặt trùng chỗ một công trình cũ thì là
    // SỬA, NÂNG CẤP: cái cũ vẫn đứng, thợ dựng giàn giáo quanh nó, xong thì cái mới thay vào đúng chỗ đó. Công trình mới ở chỗ
    // trống thì DỰNG MỚI: có giàn giáo và mọc dần lên. Cái cũ không ai thay thì giữ mãi.
    function show(i, level, animate) {
      const L = lands3d.lands[i], old = shown[i];
      let standing = [], groups = [];
      if (old && animate) {
        for (const P of old.pieces) if (P.progress < 1 || !P.g.visible) finish(old, P); // cái nào thời trước chưa xong thì coi như đã kịp xong
        standing = [...old.standing, ...old.pieces].filter((P) => P.g.visible && !P.gone);
        groups = old.groups;
      } else if (old) for (const g of old.groups) dropGroup(L, g);
      const S = STYLE_OF[L.ter] && STYLE_OF[L.ter](), lay = S && S.ERA && S.ERA[level];
      if (!lay) { for (const g of groups) dropGroup(L, g); shown[i] = null; return; }
      const group = new THREE.Group(), pieces = [];
      // trục của làng: phía trước là biển trong (hướng camera nhìn vào), bên phải vuông góc
      const f = new THREE.Vector2(L.inw.x, L.inw.z).normalize(), r = new THREE.Vector2(-f.y, f.x);
      const at = (x, z) => new THREE.Vector2(r.x * x + f.x * z, r.y * x + f.y * z);
      let yard = null; if (lay.yard) { yard = yardOf(lay, at); group.add(yard); group.userData.yard = yard; if (standing.length) yard.visible = false; }
      let tris = 0;
      // chỗ của các công trình không phải nhà riêng, để nhà riêng tránh ra
      const fixed = lay.pieces.filter((P) => P.home == null && !P.outer && lay.BUILD[P.kind] && (P.clear || 0) > 0.6).map((P) => { const q = at(P.x, P.z); return { x: q.x, y: q.y, r: P.clear }; });
      for (const P of lay.pieces) {
        const build = lay.BUILD[P.kind]; if (!build) continue;
        const k = new K.Kit(), anim = build(k, P) || null;
        const g = k.bake(3);
        let p, dir = f;
        let dead = false; // không tìm được chỗ trên đảo: giữ chỗ trong danh sách (khớp thứ tự với logic) nhưng không hiện
        if (P.outer) { const o = outerSpot(L, P, at); if (o) { p = o.p; dir = o.dir; } else { p = at(0, 0); dead = true; } }
        else {
          p = at(P.x, P.z);
          if (P.home != null) p = homeSpot(L, p, P.clear, fixed);
          if (Array.isArray(P.face)) { const d = at(P.face[0], P.face[1]).sub(p); if (d.lengthSq() > 1e-6) dir = d.normalize(); }
        }
        g.position.set(p.x, P.outer === 'sea' ? SEA_Y : 0, p.y); g.rotation.y = Math.atan2(dir.x, dir.y); g.visible = false;
        // nhà riêng to quá (thời cao tầng) thì thu lại cho vừa chỗ của một hộ
        let fitS = 1; if (P.fit) { const bb = new THREE.Box3().setFromObject(g), m = Math.max(bb.max.x - bb.min.x, bb.max.z - bb.min.z); if (m > P.fit) fitS = P.fit / m; }
        g.userData.kind = P.kind; g.userData.name = lay.NAME[P.kind];
        group.add(g); tris += g.userData.tris || 0;
        const glows = []; if (g.userData.glow) glows.push(g.userData.glow); if (g.userData.subGlows) glows.push(...g.userData.subGlows);
        const subs = g.userData.subs || {}; for (const n in subs) subs[n].userData.base = subs[n].position.clone();
        const box = new THREE.Box3().setFromObject(g);
        const piece = { g, grp: group, kind: P.kind, slot: P.slot || null, home: P.home, outer: P.outer || null, fitS, anim, glows, subs, ph: (p.x * 0.37 + p.y * 0.61) % 6, clear: P.clear || 1.5, x: p.x, z: p.y, box, progress: -1, started: false, dead };
        // thay cái cũ: cùng chỗ (slot) hoặc đè lên chỗ cái cũ
        piece.replaces = standing.filter((Q) => (piece.slot && Q.slot === piece.slot) || (near(piece, Q) && !(Q.home != null && piece.home != null)));
        pieces.push(piece);
      }
      L.g.add(group); groups = [...groups, group];
      shown[i] = { level, pieces, standing, groups, yard, tris: Math.round(tris), count: pieces.length, name: lay.NAME.hall, yardR: lay.yard ? lay.yard.r : 12, L };
    }
    // chỗ cho nhà riêng: giữ đúng chỗ đã định nếu trống; đè lên núi, hồ, công trình khác hay ra ngoài mép đảo thì dịch dần
    function homeSpot(L, p, r, fixed) {
      const ok = (q) => L.inside(q.x, q.y, r + 2) && !L.blockedWild(q.x, q.y, r) && !fixed.some((F) => (F.x - q.x) ** 2 + (F.y - q.y) ** 2 < (F.r + r) ** 2);
      if (ok(p)) return p;
      for (const [ks, da] of [[1.12, 0], [0.9, 0], [1, 0.1], [1, -0.1], [1.22, 0.06], [1.22, -0.06], [0.82, 0.1], [1.34, 0]]) {
        const a = Math.atan2(p.y, p.x) + da, R = p.length() * ks, q = new THREE.Vector2(Math.cos(a) * R, Math.sin(a) * R); if (ok(q)) return q;
      }
      return p;
    }
    // chỗ cho công trình ngoài làng, tìm một lần cho mỗi slot (địa hình không đổi): coast mép đảo, sea ngoài khơi, forest trong rừng
    function outerSpot(L, P, at) {
      const cache = L.outerSpots || (L.outerSpots = {}), key = P.slot + ':' + P.outer;
      if (key in cache) return cache[key];
      const d0 = at(Math.sin(P.a || 0), Math.cos(P.a || 0)), th0 = Math.atan2(d0.y, d0.x), r = Math.max(2.5, P.clear || 3);
      const taken = Object.values(cache).filter(Boolean);
      const free = (q, rr) => !taken.some((o) => o.p.distanceTo(q) < o.r + rr + 3);
      let found = null;
      for (let k = 0; k < 60 && !found; k++) {
        const th = th0 + (k % 2 ? 1 : -1) * Math.ceil(k / 2) * 0.06, u = new THREE.Vector2(Math.cos(th), Math.sin(th)), edge = L.rOf(th);
        const tries = P.outer === 'coast' ? [edge - 3] : P.outer === 'sea' ? [edge + 7, edge + 10] : [38, 34, 42, 46];
        for (const R of tries) {
          const q = u.clone().multiplyScalar(R);
          if (P.outer === 'sea') { if (!L.inside(q.x, q.y, -4) && free(q, r)) { found = { p: q, dir: new THREE.Vector2(-u.y, u.x), r }; break; } continue; }
          if (P.outer === 'coast') { if (L.inside(q.x, q.y, 1.2) && !L.blockedWild(q.x, q.y, r) && free(q, r)) { found = { p: q, dir: u.clone(), r }; break; } continue; }
          if (L.inside(q.x, q.y, r + 4) && !L.blockedWild(q.x, q.y, r + 0.5) && free(q, r)) { found = { p: q, dir: u.clone().negate(), r }; break; }
        }
      }
      cache[key] = found; return found;
    }
    const setS = (P, xz, y) => P.g.scale.set(P.fitS * xz, P.fitS * y, P.fitS * xz);
    // xong một công trình: cái cũ ở đúng chỗ đó đã lún hẳn, cái mới đứng đủ cỡ
    function finish(sh, P) {
      P.progress = 1; if (P.dead) return; P.g.visible = true; setS(P, 1, 1);
      for (const Q of P.replaces) { Q.g.visible = false; Q.gone = true; }
      if (P.kind === 'hall' && sh.yard) { sh.yard.visible = true; for (const g of sh.groups) if (g !== P.grp && g.userData.yard) g.userData.yard.visible = false; } // sân mới trải ra khi nhà chính xong
      // nhóm của thời cũ nào không còn công trình nào đứng thì bỏ hẳn
      for (const g of sh.groups) if (g !== P.grp && !sh.standing.some((Q) => Q.grp === g && !Q.gone)) { dropGroup(sh.L, g); sh.groups = sh.groups.filter((x) => x !== g); }
    }
    // tiến độ từ logic (S.build.list[j].progress, 0..1): đang làm thì cái cũ vẫn đứng nguyên (thợ làm ở đó); làm xong là lên
    // đời ngay lập tức: cái cũ biến mất, cái mới hiện đủ cỡ đúng chỗ đó. Không mọc dần, không giàn giáo.
    function setProgress(i, list) {
      const sh = shown[i]; if (!sh) return;
      sh.pieces.forEach((P, j) => {
        const pr = list && list[j] ? list[j].progress : 1;
        if (pr === P.progress || P.dead) return;
        P.progress = pr;
        if (pr >= 1) { if (!P.started) { P.started = true; lands3d.clearTrees(sh.L, P.x, P.z, P.clear); } finish(sh, P); P.progress = 1; return; }
        P.g.visible = false;
      });
    }

    function animate(dt, t, night) {
      const s = Math.min(0.1, Math.max(0, dt) / 1000); clock += s; const ts = t * 0.001;
      for (const sh of shown) if (sh) for (const set of [sh.pieces, sh.standing]) for (const p of set) {
        if (!p.g.visible) continue;
        const A = p.anim;
        if (A) {
          if (A.spin) for (const [n, axis, v] of A.spin) if (p.subs[n]) p.subs[n].rotation[axis] = ts * v + p.ph;
          if (A.bob) for (const [n, amp, v] of A.bob) if (p.subs[n]) p.subs[n].position.y = p.subs[n].userData.base.y + Math.sin(ts * v * 2 + p.ph) * amp;
          if (A.slide) for (const [n, axis, v, range] of A.slide) if (p.subs[n]) p.subs[n].position[axis] = p.subs[n].userData.base[axis] + Math.sin(ts * v * 0.3 + p.ph) * range;
        }
        for (const G of p.glows) {
          const fl = A && A.pulse ? 0.7 + 0.3 * Math.sin(ts * 1.6 + p.ph) : 0.86 + 0.14 * Math.sin(ts * 17 + p.ph) * Math.sin(ts * 11 + p.ph * 2);
          G.material.opacity = Math.min(1, (0.7 + 0.25 * (night || 0)) * fl + 0.1);
        }
      }
    }
    // những chỗ người hay đến, theo các công trình đang đứng (toạ độ trên đảo): nhà chính, sân, ruộng, nhà ở (cửa), chợ,
    // chỗ thờ, trường, chỗ tuần tra, chỗ đang dựng hay đang sửa, và cửa mọi công trình (người đi đường, thợ đi tu bổ)
    const HOME = new Set(['hut', 'tent', 'house', 'row', 'flats', 'tower', 'pods', 'bud', 'floatHouse', 'folded', 'crystal']);
    const FIELD = new Set(['field', 'wildRice', 'lily', 'greenhouse', 'knap', 'kiln', 'forge', 'factory', 'hay', 'tractor', 'robot']);
    const SQUARE = new Set(['fire', 'well', 'sun']);
    const MARKET = new Set(['market', 'shop', 'granary', 'press', 'hideRack', 'rack', 'dronePad']);
    const SHRINE = new Set(['totem', 'paintedRock', 'banyan', 'miniPortal', 'shard', 'mote', 'pylon']);
    const SCHOOL = new Set(['school', 'datacenter', 'dish']);
    function places(i) {
      const sh = shown[i], L = lands3d.lands[i]; if (!sh) return null;
      const out = { hall: null, square: [], field: [], homes: [], homeSlots: [], guard: [], site: [], market: [], shrine: [], school: [], outer: [], all: [] }, f = new THREE.Vector2(L.inw.x, L.inw.z).normalize();
      for (const [P, isNew] of [...sh.pieces.map((P) => [P, true]), ...sh.standing.map((P) => [P, false])]) {
        const g = P.g, pos = new THREE.Vector3(g.position.x, 0, g.position.z), fwd = new THREE.Vector3(Math.sin(g.rotation.y), 0, Math.cos(g.rotation.y)), k = P.kind;
        if (isNew && P.progress > 0 && P.progress < 1) { out.site.push(pos.clone().addScaledVector(fwd, Math.max(2.5, P.clear * 0.8))); continue; }
        if (!g.visible || P.gone) continue;
        const door = pos.clone().addScaledVector(fwd, Math.max(1.6, P.clear * 0.6));
        if (!P.outer && k !== 'road' && k !== 'asphalt' && k !== 'glowRoad' && k !== 'lamp' && k !== 'pole') out.all.push(door);
        if (P.outer) { out.outer.push(P.outer === 'sea' ? null : P.outer === 'coast' ? pos.clone().addScaledVector(fwd, -2.5) : door); continue; }
        if (k === 'hall') { if (!out.hall || isNew) out.hall = pos.clone().addScaledVector(fwd, 6); }
        else if (HOME.has(k)) { const dv = pos.clone().addScaledVector(fwd, 2.8 * P.fitS); out.homes.push(dv); if (P.home != null && !out.homeSlots[P.home]) out.homeSlots[P.home] = dv; }
        else if (FIELD.has(k)) out.field.push(pos.clone().addScaledVector(fwd, 0.5));
        else if (SQUARE.has(k)) out.square.push(pos.clone().addScaledVector(fwd, 2.2));
        else if (MARKET.has(k)) out.market.push(door);
        else if (SHRINE.has(k)) out.shrine.push(pos.clone().addScaledVector(fwd, 2));
        else if (SCHOOL.has(k)) out.school.push(door);
        else if (k === 'gate' || k === 'pad' || k === 'station') out.guard.push(pos.clone().addScaledVector(fwd, 3));
      }
      const r = sh.yardR || 12;
      for (const a of [-0.9, 0, 0.9]) out.guard.push(new THREE.Vector3(f.x * r * 0.9 * Math.cos(a) - f.y * r * 0.9 * Math.sin(a), 0, f.y * r * 0.9 * Math.cos(a) + f.x * r * 0.9 * Math.sin(a)));
      if (!out.hall) out.hall = new THREE.Vector3(f.x * 4, 0, f.y * 4);
      if (!out.square.length) out.square.push(new THREE.Vector3(f.x * 9, 0, f.y * 9));
      if (!out.field.length) out.field.push(new THREE.Vector3(f.x * 14, 0, f.y * 14));
      if (!out.homes.length) out.homes.push(out.square[0].clone());
      // chưa có chợ, chỗ thờ, trường riêng thì dùng chỗ có nghĩa giữa các nhà (không dồn về nhà chính, không dồn giữa sân):
      // chợ họp trước cửa vài nhà, lớp học dưới mái hiên một nhà ở mép làng
      const H = out.homes;
      if (!out.market.length) out.market.push(...[H[1 % H.length], H[Math.floor(H.length / 2)]].map((v) => v.clone().multiplyScalar(0.85)));
      if (!out.shrine.length) out.shrine.push(out.square[out.square.length - 1].clone().add(new THREE.Vector3(-2.5, 0, -1)));
      if (!out.school.length) out.school.push(H[H.length - 1].clone().multiplyScalar(0.9));
      out.outer = out.outer.filter(Boolean); // người đi đường, thợ đi tu bổ có khi ra tới bến, trại, đền trong rừng
      out.all.push(...out.outer);
      if (!out.all.length) out.all.push(...out.homes);
      return out;
    }
    const stats = (i) => shown[i] && { level: shown[i].level, tris: shown[i].tris, count: shown[i].count, hall: shown[i].name };
    return { show, setProgress, animate, stats, places };
  }
  return { create };
});
