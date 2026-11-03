/* Bể Kính · render/buildings3d.js
 * Đặt công trình lên đảo theo cấp văn minh (1..12). Kiểu công trình của từng đảo nằm ở render/build/<đảo>/ (mỗi thời một
 * tệp, đăng ký vào ERA[cấp] = { yard, pieces, BUILD, NAME }); tệp này chỉ đọc bố cục, dựng từng công trình bằng
 * render/build/kit3d.js, xoay mặt trước về đúng hướng, dọn cây chỗ đặt, trải sân, và làm phần chuyển động:
 *   spin [tên, trục, tốc độ]   quay (cánh quạt, cổng, vòng sáng)
 *   bob  [tên, biên độ, nhịp]  nhấp nhô (khí cầu, drone, nhà lơ lửng)
 *   slide [tên, trục, tốc độ, quãng]  chạy qua lại (đầu máy)
 *   pulse                      khối sáng phập phồng
 * Lên cấp: làng cũ lún xuống, làng mới mọc lên từ nhà chính ra ngoài. Đảo nào chưa có kiểu thì để trống.
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
    const shown = lands3d.lands.map(() => null); // mỗi đảo: { group, level, pieces, tris }
    const leaving = [];
    let clock = 0;

    // dựng công trình của một đảo ở một cấp; animate: làng cũ lún xuống, làng mới mọc lên
    function show(i, level, animate) {
      const L = lands3d.lands[i], old = shown[i];
      if (old) { L.g.remove(old.group); if (animate) { L.g.add(old.group); leaving.push({ L, g: old.group, t0: clock }); } else K.dispose(old.group); shown[i] = null; }
      const S = STYLE_OF[L.ter] && STYLE_OF[L.ter](), lay = S && S.ERA && S.ERA[level];
      if (!lay) return;
      const group = new THREE.Group(), pieces = [];
      // trục của làng: phía trước là biển trong (hướng camera nhìn vào), bên phải vuông góc
      const f = new THREE.Vector2(L.inw.x, L.inw.z).normalize(), r = new THREE.Vector2(-f.y, f.x);
      const at = (x, z) => new THREE.Vector2(r.x * x + f.x * z, r.y * x + f.y * z);
      if (lay.yard) {
        const p = at(lay.yard.x, lay.yard.z), yard = new THREE.Mesh(K.disc(lay.yard.r, 20), new THREE.MeshStandardMaterial({ color: lay.yard.color || '#c9b184', roughness: 1, flatShading: true }));
        yard.position.set(p.x, 0.04, p.y); yard.receiveShadow = true; group.add(yard);
      }
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
        pieces.push({ g, anim, glows, subs, ph: (P.x * 0.37 + P.z * 0.61) % 6, delay: animate ? Math.hypot(P.x, P.z) * 0.05 : 0, grow: animate ? 0 : 1 });
        if (animate) g.scale.set(1, 0.001, 1);
        if (P.clear) lands3d.clearTrees(L, p.x, p.y, P.clear);
      }
      L.g.add(group);
      shown[i] = { group, level, pieces, tris: Math.round(tris), count: pieces.length, t0: clock, name: lay.NAME.hall, yard: lay.yard ? lay.yard.r : 12 };
    }

    function animate(dt, t, night) {
      const s = Math.min(0.1, Math.max(0, dt) / 1000); clock += s; const ts = t * 0.001;
      // làng cũ lún xuống rồi biến mất
      for (let j = leaving.length - 1; j >= 0; j--) { const Lv = leaving[j], u = (clock - Lv.t0) / 0.9; Lv.g.scale.y = Math.max(0.001, 1 - ease(u)); if (u >= 1) { Lv.L.g.remove(Lv.g); K.dispose(Lv.g); leaving.splice(j, 1); } }
      for (const sh of shown) if (sh) for (const p of sh.pieces) {
        if (p.grow < 1) { const u = (clock - sh.t0 - 0.5 - p.delay) / 1.3; p.grow = Math.max(0, Math.min(1, u)); p.g.scale.y = Math.max(0.001, ease(p.grow)); }
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
      const out = { hall: null, square: [], field: [], homes: [], guard: [] }, f = new THREE.Vector2(L.inw.x, L.inw.z).normalize();
      for (const p of sh.pieces) {
        const g = p.g, pos = new THREE.Vector3(g.position.x, 0, g.position.z), fwd = new THREE.Vector3(Math.sin(g.rotation.y), 0, Math.cos(g.rotation.y)), k = g.userData.kind;
        if (k === 'hall') out.hall = pos.clone().addScaledVector(fwd, 6);
        else if (HOME.has(k)) out.homes.push(pos.clone().addScaledVector(fwd, 2.8));
        else if (FIELD.has(k)) out.field.push(pos.clone().addScaledVector(fwd, 0.5));
        else if (SQUARE.has(k)) out.square.push(pos.clone().addScaledVector(fwd, 2.2));
        else if (k === 'gate' || k === 'pad' || k === 'station') out.guard.push(pos.clone().addScaledVector(fwd, 3));
      }
      const r = sh.yard || 12;
      for (const a of [-0.9, 0, 0.9]) out.guard.push(new THREE.Vector3(Math.sin(a) * 0 + f.x * r * 0.9 * Math.cos(a) - f.y * r * 0.9 * Math.sin(a), 0, f.y * r * 0.9 * Math.cos(a) + f.x * r * 0.9 * Math.sin(a)));
      if (!out.hall) out.hall = new THREE.Vector3(f.x * 4, 0, f.y * 4);
      if (!out.square.length) out.square.push(new THREE.Vector3(f.x * 7, 0, f.y * 7));
      if (!out.field.length) out.field.push(new THREE.Vector3(f.x * 14, 0, f.y * 14));
      if (!out.homes.length) out.homes.push(out.square[0].clone());
      return out;
    }
    const stats = (i) => shown[i] && { level: shown[i].level, tris: shown[i].tris, count: shown[i].count, hall: shown[i].name };
    return { show, animate, stats, places };
  }
  return { create };
});
