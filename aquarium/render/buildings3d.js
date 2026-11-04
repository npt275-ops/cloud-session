/* Bể Kính · render/buildings3d.js
 * Đặt công trình lên đảo theo cấp văn minh (1..12). Kiểu công trình của từng đảo nằm ở render/build/<đảo>/ (mỗi thời một
 * tệp, đăng ký vào ERA[cấp] = { yard, pieces, BUILD, NAME }); tệp này chỉ đọc bố cục, dựng từng công trình bằng
 * render/build/kit3d.js, xoay mặt trước về đúng hướng, dọn cây chỗ đặt, trải sân, và làm phần chuyển động:
 *   spin [tên, trục, tốc độ]   quay (cánh quạt, cổng, vòng sáng)
 *   bob  [tên, biên độ, nhịp]  nhấp nhô (khí cầu, drone, nhà lơ lửng)
 *   slide [tên, trục, tốc độ, quãng]  chạy qua lại (đầu máy)
 *   pulse                      khối sáng phập phồng
 * Dựng dần theo logic (logic/construction.js, setProgress): đầu thời làng cũ vẫn đứng, thợ dựng nhà chính mới rồi lần lượt các
 * công trình khác (có giàn giáo, mọc dần lên); dựng xong chỗ nào thì dỡ công trình cũ ở chỗ đó. Đảo nào chưa có kiểu thì để trống.
 * Cần: three.js, render/build/kit3d.js, các tệp render/build/<đảo>/. */
(function (root, factory) {
  const BK = root.BK || (root.BK = {});
  BK.Buildings3D = factory(BK);
})(typeof self !== 'undefined' ? self : globalThis, function (BK) {
  'use strict';
  const STYLE_OF = { plains: () => BK.Plains3D }; // thêm đảo khác ở đây khi có tệp kiểu công trình
  const ease = (u) => 1 - Math.pow(1 - Math.max(0, Math.min(1, u)), 3);

  function create(o) {
    const { THREE, lands3d } = o, K = BK.BuildKit;
    const shown = lands3d.lands.map(() => null); // mỗi đảo: { group, level, pieces, prev (làng thời trước đang được thay dần) }
    let clock = 0;
    const scaffoldMat = new THREE.MeshStandardMaterial({ color: '#b89060', roughness: 0.9, flatShading: true });
    const yardOf = (lay, at) => { const p = at(lay.yard.x, lay.yard.z), yard = new THREE.Mesh(K.disc(lay.yard.r, 20), new THREE.MeshStandardMaterial({ color: lay.yard.color || '#c9b184', roughness: 1, flatShading: true })); yard.position.set(p.x, 0.04, p.y); yard.receiveShadow = true; return yard; };

    // dựng sẵn công trình của một đảo ở một cấp, nhưng chỉ hiện cái nào logic đã dựng (setProgress); animate: làng cũ được
    // giữ lại và dỡ dần từng chỗ khi công trình mới ở chỗ đó dựng xong
    function show(i, level, animate) {
      const L = lands3d.lands[i], old = shown[i];
      if (old) { if (old.prev) { L.g.remove(old.prev.group); K.dispose(old.prev.group); } if (!animate) { L.g.remove(old.group); K.dispose(old.group); } }
      const S = STYLE_OF[L.ter] && STYLE_OF[L.ter](), lay = S && S.ERA && S.ERA[level];
      if (!lay) { shown[i] = null; return; }
      const group = new THREE.Group(), pieces = [];
      // trục của làng: phía trước là biển trong (hướng camera nhìn vào), bên phải vuông góc
      const f = new THREE.Vector2(L.inw.x, L.inw.z).normalize(), r = new THREE.Vector2(-f.y, f.x);
      const at = (x, z) => new THREE.Vector2(r.x * x + f.x * z, r.y * x + f.y * z);
      let yard = null; if (lay.yard) { yard = yardOf(lay, at); group.add(yard); }
      let tris = 0;
      for (const P of lay.pieces) {
        const build = lay.BUILD[P.kind]; if (!build) continue;
        const k = new K.Kit(), anim = build(k, P) || null;
        const g = k.bake(3), p = at(P.x, P.z);
        let dir = f; if (Array.isArray(P.face)) { const d = at(P.face[0], P.face[1]).sub(p); if (d.lengthSq() > 1e-6) dir = d.normalize(); }
        g.position.set(p.x, 0, p.y); g.rotation.y = Math.atan2(dir.x, dir.y);
        g.userData.kind = P.kind; g.userData.name = lay.NAME[P.kind];
        group.add(g); tris += g.userData.tris || 0;
        const glows = []; if (g.userData.glow) glows.push(g.userData.glow); if (g.userData.subGlows) glows.push(...g.userData.subGlows);
        const subs = g.userData.subs || {}; for (const n in subs) subs[n].userData.base = subs[n].position.clone();
        const box = new THREE.Box3().setFromObject(g);
        pieces.push({ g, anim, glows, subs, ph: (P.x * 0.37 + P.z * 0.61) % 6, clear: P.clear || 1.5, x: p.x, z: p.y, box, progress: 1, scaffold: null, started: false });
      }
      L.g.add(group);
      const prev = animate && old ? { group: old.group, pieces: old.pieces } : null;
      if (prev && yard) yard.visible = false; // sân mới trải ra khi nhà chính mới dựng xong
      shown[i] = { group, level, pieces, prev, yard, tris: Math.round(tris), count: pieces.length, name: lay.NAME.hall, yardR: lay.yard ? lay.yard.r : 12, L };
    }
    // giàn giáo quanh công trình đang dựng: bốn cột và hai vòng thanh ngang theo khung bao của công trình
    function scaffoldOf(P) {
      const g = new THREE.Group(), b = P.box, w = Math.max(1, b.max.x - b.min.x), d = Math.max(1, b.max.z - b.min.z), h = Math.max(1.2, Math.min(8, b.max.y)), cx = (b.min.x + b.max.x) / 2 - P.g.position.x, cz = (b.min.z + b.max.z) / 2 - P.g.position.z;
      for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const m = new THREE.Mesh(new THREE.BoxGeometry(0.12, h, 0.12), scaffoldMat); m.position.set(cx + sx * w / 2, h / 2, cz + sz * d / 2); g.add(m); }
      for (const y of [h * 0.45, h * 0.9]) for (const [dx, dz, lx, lz] of [[0, -d / 2, w, 0.08], [0, d / 2, w, 0.08], [-w / 2, 0, 0.08, d], [w / 2, 0, 0.08, d]]) { const m = new THREE.Mesh(new THREE.BoxGeometry(lx, 0.08, lz), scaffoldMat); m.position.set(cx + dx, y, cz + dz); g.add(m); }
      g.position.set(P.g.position.x, 0, P.g.position.z); return g;
    }
    // tiến độ dựng từ logic (S.build.list[j].progress, 0..1): chưa dựng thì ẩn; đang dựng thì có giàn giáo và mọc dần lên;
    // dựng xong thì dỡ giàn giáo và dỡ công trình cũ của thời trước ở chỗ đó
    function setProgress(i, list) {
      const sh = shown[i]; if (!sh) return;
      sh.pieces.forEach((P, j) => {
        const pr = list && list[j] ? list[j].progress : 1;
        if (pr === P.progress && P.started) return;
        P.progress = pr;
        if (pr > 0 && !P.started) { P.started = true; lands3d.clearTrees(sh.L, P.x, P.z, P.clear); }
        P.g.visible = pr > 0;
        P.g.scale.y = pr >= 1 ? 1 : Math.max(0.04, ease(pr));
        if (pr > 0 && pr < 1 && !P.scaffold) { P.scaffold = scaffoldOf(P); sh.group.add(P.scaffold); }
        if (pr >= 1 && P.scaffold) { sh.group.remove(P.scaffold); K.dispose(P.scaffold); P.scaffold = null; }
        if (pr >= 1 && sh.prev) { removeOldNear(sh, P); if (P.g.userData.kind === 'hall' && sh.yard) sh.yard.visible = true; }
      });
      if (sh.prev && sh.pieces.every((P) => P.progress >= 1)) { sh.L.g.remove(sh.prev.group); K.dispose(sh.prev.group); sh.prev = null; }
    }
    function removeOldNear(sh, P) {
      for (const Q of sh.prev.pieces) { if (Q.gone) continue; const rr = P.clear + Q.clear * 0.6 + 1; if ((Q.x - P.x) ** 2 + (Q.z - P.z) ** 2 < rr * rr || P.g.userData.kind === 'hall' && Q.g.userData.kind === 'hall') { Q.g.visible = false; Q.gone = true; } }
    }

    function animate(dt, t, night) {
      const s = Math.min(0.1, Math.max(0, dt) / 1000); clock += s; const ts = t * 0.001;
      for (const sh of shown) if (sh) for (const set of [sh.pieces, sh.prev ? sh.prev.pieces : []]) for (const p of set) {
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
    // những chỗ người hay đến, theo làng đang có (toạ độ trên đảo): nhà chính, sân, ruộng, nhà ở (cửa), chỗ tuần tra
    const HOME = new Set(['hut', 'tent', 'house', 'row', 'flats', 'tower', 'pods', 'bud', 'floatHouse', 'folded', 'crystal']);
    const FIELD = new Set(['field', 'wildRice', 'lily', 'greenhouse', 'knap', 'kiln', 'forge', 'factory', 'market', 'datacenter']);
    const SQUARE = new Set(['fire', 'well', 'totem', 'sun', 'miniPortal']);
    function places(i) {
      const sh = shown[i], L = lands3d.lands[i]; if (!sh) return null;
      const out = { hall: null, square: [], field: [], homes: [], guard: [], site: [] }, f = new THREE.Vector2(L.inw.x, L.inw.z).normalize();
      const all = [...sh.pieces.map((P) => [P, true]), ...(sh.prev ? sh.prev.pieces.map((P) => [P, false]) : [])];
      for (const [P, isNew] of all) {
        const g = P.g, pos = new THREE.Vector3(g.position.x, 0, g.position.z), fwd = new THREE.Vector3(Math.sin(g.rotation.y), 0, Math.cos(g.rotation.y)), k = g.userData.kind;
        if (isNew && P.progress > 0 && P.progress < 1) { out.site.push(pos.clone().addScaledVector(fwd, Math.max(2.5, P.clear * 0.8))); continue; }
        if (!g.visible) continue;
        if (k === 'hall') { if (!out.hall || isNew) out.hall = pos.clone().addScaledVector(fwd, 6); }
        else if (HOME.has(k)) out.homes.push(pos.clone().addScaledVector(fwd, 2.8));
        else if (FIELD.has(k)) out.field.push(pos.clone().addScaledVector(fwd, 0.5));
        else if (SQUARE.has(k)) out.square.push(pos.clone().addScaledVector(fwd, 2.2));
        else if (k === 'gate' || k === 'pad' || k === 'station') out.guard.push(pos.clone().addScaledVector(fwd, 3));
      }
      const r = sh.yardR || 12;
      for (const a of [-0.9, 0, 0.9]) out.guard.push(new THREE.Vector3(f.x * r * 0.9 * Math.cos(a) - f.y * r * 0.9 * Math.sin(a), 0, f.y * r * 0.9 * Math.cos(a) + f.x * r * 0.9 * Math.sin(a)));
      if (!out.hall) out.hall = new THREE.Vector3(f.x * 4, 0, f.y * 4);
      if (!out.square.length) out.square.push(new THREE.Vector3(f.x * 7, 0, f.y * 7));
      if (!out.field.length) out.field.push(new THREE.Vector3(f.x * 14, 0, f.y * 14));
      if (!out.homes.length) out.homes.push(out.square[0].clone());
      return out;
    }
    const stats = (i) => shown[i] && { level: shown[i].level, tris: shown[i].tris, count: shown[i].count, hall: shown[i].name };
    return { show, setProgress, animate, stats, places };
  }
  return { create };
});
