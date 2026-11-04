/* Bể Kính · render/buildings3d.js
 * Đặt công trình lên đảo theo cấp văn minh (1..12). Kiểu công trình của từng đảo nằm ở render/build/<đảo>/ (mỗi thời một
 * tệp, đăng ký vào ERA[cấp] = { yard, pieces, BUILD, NAME }); tệp này chỉ đọc bố cục, dựng từng công trình bằng
 * render/build/kit3d.js, xoay mặt trước về đúng hướng, dọn cây chỗ đặt, trải sân, và làm phần chuyển động:
 *   spin [tên, trục, tốc độ]   quay (cánh quạt, cổng, vòng sáng)
 *   bob  [tên, biên độ, nhịp]  nhấp nhô (khí cầu, drone, nhà lơ lửng)
 *   slide [tên, trục, tốc độ, quãng]  chạy qua lại (đầu máy)
 *   pulse                      khối sáng phập phồng
 * Dựng dần theo logic (logic/construction.js, setProgress): công trình các thời trước không biến mất. Sang thời mới, thợ
 * sửa, nâng cấp từng công trình cũ ngay tại chỗ (giàn giáo bao quanh cái cũ, xong thì cái mới thay vào) và dựng mới ở chỗ
 * trống (giàn giáo, mọc dần lên). Cái cũ không ai thay thì giữ nguyên. Đảo nào chưa có kiểu thì để trống.
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
    // mỗi đảo: { level, pieces (công trình của thời đang có), standing (công trình các thời trước còn đứng), groups, yard }
    const shown = lands3d.lands.map(() => null);
    let clock = 0;
    const scaffoldMat = new THREE.MeshStandardMaterial({ color: '#b89060', roughness: 0.9, flatShading: true });
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
        for (const P of old.pieces) finish(old, P); // cái nào thời trước chưa xong thì coi như đã kịp xong
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
      for (const P of lay.pieces) {
        const build = lay.BUILD[P.kind]; if (!build) continue;
        const k = new K.Kit(), anim = build(k, P) || null;
        const g = k.bake(3), p = at(P.x, P.z);
        let dir = f; if (Array.isArray(P.face)) { const d = at(P.face[0], P.face[1]).sub(p); if (d.lengthSq() > 1e-6) dir = d.normalize(); }
        g.position.set(p.x, 0, p.y); g.rotation.y = Math.atan2(dir.x, dir.y); g.visible = false;
        g.userData.kind = P.kind; g.userData.name = lay.NAME[P.kind];
        group.add(g); tris += g.userData.tris || 0;
        const glows = []; if (g.userData.glow) glows.push(g.userData.glow); if (g.userData.subGlows) glows.push(...g.userData.subGlows);
        const subs = g.userData.subs || {}; for (const n in subs) subs[n].userData.base = subs[n].position.clone();
        const box = new THREE.Box3().setFromObject(g);
        const piece = { g, grp: group, kind: P.kind, anim, glows, subs, ph: (P.x * 0.37 + P.z * 0.61) % 6, clear: P.clear || 1.5, x: p.x, z: p.y, box, progress: -1, scaffold: null, started: false, pop: 0 };
        piece.replaces = standing.filter((Q) => near(piece, Q));
        if (piece.replaces.length) for (const Q of piece.replaces) box.union(Q.box); // giàn giáo bao cả công trình cũ đang sửa
        pieces.push(piece);
      }
      L.g.add(group); groups = [...groups, group];
      shown[i] = { level, pieces, standing, groups, yard, tris: Math.round(tris), count: pieces.length, name: lay.NAME.hall, yardR: lay.yard ? lay.yard.r : 12, L };
    }
    // giàn giáo quanh chỗ đang dựng hay đang sửa: bốn cột và hai vòng thanh ngang theo khung bao
    function scaffoldOf(P) {
      const g = new THREE.Group(), b = P.box, w = Math.max(1, b.max.x - b.min.x) + 0.3, d = Math.max(1, b.max.z - b.min.z) + 0.3, h = Math.max(1.2, Math.min(8, b.max.y + 0.3)), cx = (b.min.x + b.max.x) / 2, cz = (b.min.z + b.max.z) / 2;
      for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const m = new THREE.Mesh(new THREE.BoxGeometry(0.12, h, 0.12), scaffoldMat); m.position.set(cx + sx * w / 2, h / 2, cz + sz * d / 2); g.add(m); }
      for (const y of [h * 0.45, h * 0.9]) for (const [dx, dz, lx, lz] of [[0, -d / 2, w, 0.08], [0, d / 2, w, 0.08], [-w / 2, 0, 0.08, d], [w / 2, 0, 0.08, d]]) { const m = new THREE.Mesh(new THREE.BoxGeometry(lx, 0.08, lz), scaffoldMat); m.position.set(cx + dx, y, cz + dz); g.add(m); }
      return g;
    }
    // xong một công trình: dỡ giàn giáo, cái cũ ở đúng chỗ đó nhường chỗ cho cái mới
    function finish(sh, P) {
      if (P.progress >= 1 && !P.scaffold && P.g.visible) return;
      P.progress = 1; P.g.visible = true; P.g.scale.y = 1;
      if (P.scaffold) { P.grp.remove(P.scaffold); K.dispose(P.scaffold); P.scaffold = null; }
      if (P.replaces.length) P.pop = 1; // sửa xong: cái mới hiện lên tại chỗ (nhún nhẹ)
      for (const Q of P.replaces) { Q.g.visible = false; Q.gone = true; }
      if (P.kind === 'hall' && sh.yard) { sh.yard.visible = true; for (const g of sh.groups) if (g !== P.grp && g.userData.yard) g.userData.yard.visible = false; } // sân mới trải ra khi nhà chính xong
      // nhóm của thời cũ nào không còn công trình nào đứng thì bỏ hẳn
      for (const g of sh.groups) if (g !== P.grp && !sh.standing.some((Q) => Q.grp === g && !Q.gone)) { dropGroup(sh.L, g); sh.groups = sh.groups.filter((x) => x !== g); }
    }
    // tiến độ từ logic (S.build.list[j].progress, 0..1)
    function setProgress(i, list) {
      const sh = shown[i]; if (!sh) return;
      sh.pieces.forEach((P, j) => {
        const pr = list && list[j] ? list[j].progress : 1;
        if (pr === P.progress) return;
        P.progress = pr;
        if (pr >= 1) { if (!P.started) { P.started = true; lands3d.clearTrees(sh.L, P.x, P.z, P.clear); } finish(sh, P); P.progress = 1; return; }
        if (pr <= 0) { P.g.visible = false; return; }
        if (!P.started) { P.started = true; lands3d.clearTrees(sh.L, P.x, P.z, P.clear); }
        if (!P.scaffold) { P.scaffold = scaffoldOf(P); P.grp.add(P.scaffold); }
        if (P.replaces.length) P.g.visible = false; // đang sửa: cái cũ vẫn đứng trong giàn giáo
        else { P.g.visible = true; P.g.scale.y = Math.max(0.04, ease(pr)); } // dựng mới: mọc dần lên
      });
    }

    function animate(dt, t, night) {
      const s = Math.min(0.1, Math.max(0, dt) / 1000); clock += s; const ts = t * 0.001;
      for (const sh of shown) if (sh) for (const set of [sh.pieces, sh.standing]) for (const p of set) {
        if (!p.g.visible) continue;
        if (p.pop > 0) { p.pop = Math.max(0, p.pop - s * 2.5); const u = 1 - p.pop; p.g.scale.setScalar(0.86 + 0.14 * u + Math.sin(u * Math.PI) * 0.05); }
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
      const out = { hall: null, square: [], field: [], homes: [], guard: [], site: [], market: [], shrine: [], school: [], all: [] }, f = new THREE.Vector2(L.inw.x, L.inw.z).normalize();
      for (const [P, isNew] of [...sh.pieces.map((P) => [P, true]), ...sh.standing.map((P) => [P, false])]) {
        const g = P.g, pos = new THREE.Vector3(g.position.x, 0, g.position.z), fwd = new THREE.Vector3(Math.sin(g.rotation.y), 0, Math.cos(g.rotation.y)), k = P.kind;
        if (isNew && P.progress > 0 && P.progress < 1) { out.site.push(pos.clone().addScaledVector(fwd, Math.max(2.5, P.clear * 0.8))); continue; }
        if (!g.visible || P.gone) continue;
        const door = pos.clone().addScaledVector(fwd, Math.max(1.6, P.clear * 0.6));
        if (k !== 'road' && k !== 'asphalt' && k !== 'glowRoad' && k !== 'lamp' && k !== 'pole') out.all.push(door);
        if (k === 'hall') { if (!out.hall || isNew) out.hall = pos.clone().addScaledVector(fwd, 6); }
        else if (HOME.has(k)) out.homes.push(pos.clone().addScaledVector(fwd, 2.8));
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
      if (!out.all.length) out.all.push(...out.homes);
      return out;
    }
    const stats = (i) => shown[i] && { level: shown[i].level, tris: shown[i].tris, count: shown[i].count, hall: shown[i].name };
    return { show, setProgress, animate, stats, places };
  }
  return { create };
});
