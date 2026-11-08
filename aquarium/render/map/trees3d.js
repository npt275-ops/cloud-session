(function (root) {
  'use strict';
  const BK = root.BK || (root.BK = {});
  /* Bể Kính · render/map/trees3d.js
   * Cây và bụi của sáu miền (FLORA): cây tán tròn ít mặt mọc thành lùm, giữ lại thông, thông tuyết, dừa, xương rồng;
   * mỗi loại một khối lặp chỉ giữ đúng số cây của nó; cây không đổ bóng thật, có vệt bóng dưới gốc; đổi màu theo mùa
   * (treeColors); clearTrees dọn cây chỗ đặt công trình. Cần: render/map/shared3d.js. */
  function create(X) {
    const { THREE, TAU, C, clamp, hash, LAND_R, RING, SC, UBOX, UCYL, UCONE, TCYL, DOME, ICO, DOD, OCT, GABLE, TORUS, VAULT, SPHG, Kit, mergeG, bodyMat, metalMat, meshOf, disposeGroup, pick, TSTYLE, landRng } = X;
    /* =============== Cây: một bộ instanced cho mỗi miền =============== */
    // Cây tán tròn (kiểu mới): tán ghép từ vài khối tròn ít mặt, chân tán sẫm dần lên ngọn, thân to; mọc thành lùm và rừng,
    // chừa đồng trống. Giữ lại một phần cây cũ: thông, thông tuyết, dừa, xương rồng, cây bụi khô.
    const trunkGeo = (() => { const g = new THREE.CylinderGeometry(0.11, 0.17, 1, 6); g.translate(0, 0.5, 0); return g; })();
    const trunkFat = (() => { const g = new THREE.CylinderGeometry(0.15, 0.26, 1, 6); g.translate(0, 0.5, 0); return g; })();
    const coneGeo = (() => { const g = new THREE.ConeGeometry(1, 1, 7); g.translate(0, 0.5, 0); return g; })();
    const icoGeo = new THREE.IcosahedronGeometry(1, 0);
    // gộp vài quả cầu ít mặt thành một tán; màu theo đỉnh: dưới sẫm, trên sáng (nhân với màu của từng cây)
    function blobs(list, detail) {
      const parts = list.map(([x, y, z, r]) => { const g = new THREE.IcosahedronGeometry(r, detail == null ? 1 : detail).toNonIndexed(); g.translate(x, y, z); return g; });
      let n = 0; for (const g of parts) n += g.attributes.position.count;
      const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), col = new Float32Array(n * 3); let o = 0, lo = 1e9, hi = -1e9;
      for (const g of parts) { const p = g.attributes.position; for (let i = 0; i < p.count; i++) { lo = Math.min(lo, p.getY(i)); hi = Math.max(hi, p.getY(i)); } }
      for (const g of parts) { const p = g.attributes.position; pos.set(p.array, o * 3); nor.set(g.attributes.normal.array, o * 3); for (let i = 0; i < p.count; i++) { const f = 0.66 + 0.34 * (p.getY(i) - lo) / (hi - lo); col.set([f, f, f], (o + i) * 3); } o += p.count; g.dispose(); }
      const out = new THREE.BufferGeometry(); out.setAttribute('position', new THREE.BufferAttribute(pos, 3)); out.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); out.setAttribute('color', new THREE.BufferAttribute(col, 3)); out.computeBoundingSphere(); return out;
    }
    // ít mặt cho nhẹ máy: mỗi khối tròn là khối 20 mặt, tán ghép 3 khối (khoảng 60 tam giác một tán)
    const roundGeo = blobs([[0, 0.05, 0, 1], [0.66, -0.2, 0.25, 0.74], [-0.6, -0.15, -0.3, 0.76]], 0);
    const tallGeo = blobs([[0, -0.75, 0, 0.8], [0, 0.35, 0, 0.64]], 0);
    const bushGeo = blobs([[0, 0, 0, 0.62], [0.5, -0.1, 0.15, 0.46], [-0.45, -0.12, -0.12, 0.48]], 0); // bụi nhỏ: ít mặt cho nhẹ
    const shadowGeo = new THREE.CircleGeometry(1, 10).rotateX(-Math.PI / 2), shadowMat = new THREE.MeshBasicMaterial({ color: '#1e2a14', transparent: true, opacity: 0.22, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
    const SEASON_LEAF = [['#a9e07c', 0.4], [null, 0], ['autumn', 1], ['#e8eef2', 0.6]];
    // mỗi miền: số cây, số bụi, tỉ lệ từng loại cây (kiểu mới round/tall, kiểu cũ giữ lại), số lùm cây
    const FLORA = {
      plains: { n: 120, bush: 60, groves: 9, kinds: [['round', 0.62], ['tall', 0.1], ['blossom', 0.1], ['conifer', 0.18]] },
      forest: { n: 260, bush: 90, groves: 12, kinds: [['round', 0.45], ['tall', 0.1], ['conifer', 0.45]] },
      mountain: { n: 200, bush: 45, groves: 11, kinds: [['conifer', 0.7], ['round', 0.3]] },
      tundra: { n: 170, bush: 28, groves: 10, kinds: [['snowpine', 0.82], ['snowround', 0.18]] },
      coast: { n: 130, bush: 55, groves: 8, kinds: [['palm', 0.5], ['round', 0.38], ['tall', 0.12]] },
      desert: { n: 80, bush: 50, groves: 6, kinds: [['cactus', 0.65], ['shrub', 0.35]] },
    };
    // khối lặp nào dùng cho loại cây nào (mỗi khối chỉ giữ đúng số cây của nó, không cấp chỗ thừa)
    const USE = { conifer: ['trunks', 'cones'], snowpine: ['trunks', 'cones'], round: ['fat', 'rounds'], blossom: ['fat', 'rounds'], snowround: ['fat', 'rounds'], tall: ['fat', 'talls'], bush: ['bushes'], palm: ['trunks', 'icos'], cactus: ['trunks'], broad: ['trunks', 'icos'], shrub: ['icos'] };
    function plantTrees(L) {
      const rng = landRng(L.i + 40), list = [], F = FLORA[L.ter];
      const ok = (x, z, r) => {
        const d = Math.hypot(x, z);
        if (!L.inside(x, z, 1.2) || d < 7.5) return false;
        if (L.blocked(x, z, r) || L.blockedWild(x, z, r * 0.6)) return false;
        if (L.onRoad && L.onRoad(x, z, r * 0.6)) return false; // cây không mọc trên đường của đảo
        for (const t of list) if ((t.x - x) ** 2 + (t.z - z) ** 2 < (t.r + r) ** 2) return false;
        return true;
      };
      const pickKind = () => { let u = rng(); for (const [k, w] of F.kinds) { if ((u -= w) <= 0) return k; } return F.kinds[0][0]; };
      // lùm cây: phần lớn cây mọc quanh vài tâm lùm, phần còn lại rải lẻ
      const groves = []; for (let g = 0; g < F.groves * 6 && groves.length < F.groves; g++) { const a = rng() * TAU, r = 14 + Math.sqrt(rng()) * (LAND_R - 18), x = Math.cos(a) * r, z = Math.sin(a) * r; if (L.inside(x, z, 4)) groves.push([x, z, 5 + rng() * 6]); }
      const spot = () => { if (groves.length && rng() < 0.72) { const [gx, gz, gr] = groves[Math.floor(rng() * groves.length)], a = rng() * TAU,
          r = Math.sqrt(rng()) * gr; return [gx + Math.cos(a) * r, gz + Math.sin(a) * r]; } const a = rng() * TAU, r = Math.sqrt(rng()) * LAND_R * 1.12;
          return [Math.cos(a) * r, Math.sin(a) * r]; };
      for (let n = 0; n < F.n * 10 && list.length < F.n; n++) {
        const [x, z] = spot(); let kind = pickKind();
        if (L.ter === 'desert') { const nearOasis = L.oasis && Math.hypot(x - L.oasis[0], z - L.oasis[1]) < 9; if (nearOasis) kind = rng() < 0.6 ? 'palm' : 'round'; }
        const s = (kind === 'round' || kind === 'blossom' || kind === 'snowround' ? 0.95 : kind === 'tall' ? 0.9 : 0.75) + rng() * 0.6;
        const r = (kind === 'round' || kind === 'blossom' || kind === 'snowround' ? 1.5 : 0.95) * s;
        if (!ok(x, z, r)) continue;
        list.push({ x, z, r, s, kind, rot: rng() * TAU, tilt: kind === 'palm' ? (rng() - 0.5) * 0.4 : 0, shade: rng(), hidden: false });
      }
      // bụi cây thấp: quanh mép lùm và rải trên đồng
      for (let n = 0; n < F.bush * 10 && list.filter((t) => t.kind === 'bush').length < F.bush; n++) {
        const [x, z] = spot(), s = 0.6 + rng() * 0.6; if (!ok(x, z, 0.7 * s)) continue;
        list.push({ x, z, r: 0.7 * s, s, kind: 'bush', rot: rng() * TAU, tilt: 0, shade: rng(), hidden: false });
      }
      const N = list.length, cnt = { trunks: 0, fat: 0, cones: 0, icos: 0, rounds: 0, talls: 0, bushes: 0 };
      for (const t of list) { t.slot = {}; for (const k of USE[t.kind] || ['icos']) t.slot[k] = cnt[k]++; }
      const std = (vc) => new THREE.MeshStandardMaterial({ flatShading: true, roughness: 0.88, vertexColors: !!vc });
      const mk = (geo, k, vc) => new THREE.InstancedMesh(geo, std(vc), Math.max(1, cnt[k]));
      const T = { list, trunks: mk(trunkGeo, 'trunks'), fat: mk(trunkFat, 'fat'), cones: mk(coneGeo, 'cones'), icos: mk(icoGeo, 'icos'), rounds: mk(roundGeo, 'rounds', true), talls: mk(tallGeo, 'talls', true), bushes: mk(bushGeo, 'bushes', true) };
      T.all = [T.trunks, T.fat, T.cones, T.icos, T.rounds, T.talls, T.bushes];
      // cây không đổ bóng thật (đỡ một lần vẽ cả rừng cây); thay bằng vệt bóng tròn mờ dưới gốc, cùng một lượt vẽ
      for (const k of ['trunks', 'fat', 'cones', 'icos', 'rounds', 'talls', 'bushes']) { T[k].count = cnt[k]; T[k].castShadow = false; T[k].receiveShadow = true; L.g.add(T[k]); }
      T.shadow = new THREE.InstancedMesh(shadowGeo, shadowMat, Math.max(1, N)); T.shadow.count = N; T.shadow.renderOrder = 1; L.g.add(T.shadow); T.all.push(T.shadow);
      list.forEach((t, n) => { t.slot.shadow = n; });
      L.trees = T;
      for (let n = 0; n < N; n++) placeTree(L, n);
      for (const m of T.all) m.instanceMatrix.needsUpdate = true;
      treeColors(L, [0, 1, 0, 0]);
    }
    const _o = new THREE.Object3D(), ZERO = new THREE.Matrix4().makeScale(0, 0, 0);
    function placeTree(L, n) {
      const t = L.trees.list[n], T = L.trees, s = t.s;
      if (t.hidden || t.felled) { for (const k in t.slot) T[k].setMatrixAt(t.slot[k], ZERO); return; }
      _o.position.set(t.x, 0.05, t.z); _o.rotation.set(0, 0, 0); _o.scale.set(t.r * 1.15, 1, t.r * 1.15); _o.updateMatrix(); T.shadow.setMatrixAt(t.slot.shadow, _o.matrix);
      _o.position.set(t.x, 0, t.z); _o.rotation.set(t.tilt, t.rot, 0);
      const set = (k, sx, sy, sz, y) => { _o.position.y = y; _o.scale.set(sx, sy, sz); _o.updateMatrix(); T[k].setMatrixAt(t.slot[k], _o.matrix); };
      if (t.kind === 'conifer' || t.kind === 'snowpine') { set('trunks', s, 1.1 * s, s, 0); set('cones', 0.95 * s, 2.6 * s, 0.95 * s, 0.85 * s); }
      else if (t.kind === 'round' || t.kind === 'blossom' || t.kind === 'snowround') { set('fat', s, 1.7 * s, s, 0); set('rounds', 1.55 * s, 1.35 * s, 1.55 * s, 2.9 * s); }
      else if (t.kind === 'tall') { set('fat', 0.8 * s, 1.4 * s, 0.8 * s, 0); set('talls', 1.15 * s, 1.55 * s, 1.15 * s, 3.1 * s); }
      else if (t.kind === 'bush') set('bushes', 1.1 * s, 0.85 * s, 1.1 * s, 0.42 * s);
      else if (t.kind === 'palm') { set('trunks', 0.7 * s, 3.0 * s, 0.7 * s, 0); set('icos', 1.25 * s, 0.32 * s, 1.25 * s, 3.0 * s); }
      else if (t.kind === 'cactus') set('trunks', 2.2 * s, 1.7 * s, 2.2 * s, 0);
      else if (t.kind === 'broad') { set('trunks', s, 1.3 * s, s, 0); set('icos', 1.05 * s, 1.0 * s, 1.05 * s, 1.9 * s); }
      else set('icos', 0.55 * s, 0.4 * s, 0.55 * s, 0.25 * s);
    }
    const LEAF = { conifer: ['#3f7a4c', '#4a8a55', '#356b43'], broad: ['#5b9a52', '#6aa85a', '#4f8d48'], round: ['#62a24e', '#71b058', '#5a9646', '#7cb85e'],
        tall: ['#4f8f45', '#5a9a4a'], bush: ['#6aa04e', '#5f9446', '#7aa858'], blossom: ['#e8a0b8', '#f2bc78', '#d8a8e6'], palm: ['#5f9f4a', '#6aa85a'],
        snowpine: ['#e9f0f3', '#d8e4ea'], snowround: ['#e6eef2', '#dbe6ec'], shrub: ['#9aa060', '#8a9455'] };
    const DRY = { desert: ['#a8a060', '#9a9455'], tundra: ['#c8d4d8', '#b8c6cc'] }; // bụi ở sa mạc khô, ở băng nguyên phủ tuyết
    function treeColors(L, w) {
      const T = L.trees, tmp = new THREE.Color();
      const sw = w || [1, 0, 0, 0];
      T.list.forEach((t, n) => {
        const pal = t.kind === 'bush' && DRY[L.ter] ? DRY[L.ter] : LEAF[t.kind] || LEAF.broad, leaf = C(pick(pal, t.shade));
        if (TSTYLE[L.ter].season && (t.kind === 'broad' || t.kind === 'blossom' || t.kind === 'conifer' || t.kind === 'round' || t.kind === 'tall' || t.kind === 'bush')) {
          const evergreen = t.kind === 'conifer';
          const sp = leaf.clone().lerp(C(t.kind === 'blossom' ? '#ffd0e0' : '#a9e07c'), 0.35), au = evergreen ? leaf.clone().lerp(C('#2e5a3a'), 0.3) : C(pick(['#d9822b', '#c4512f', '#e0b23a', '#b8642a'], t.shade)), wi = leaf.clone().lerp(C('#eef3f6'), evergreen ? 0.5 : 0.75);
          const cs = [sp, leaf, au, wi];
          tmp.setRGB(0, 0, 0); for (let s = 0; s < 4; s++) if (sw[s]) { tmp.r += cs[s].r * sw[s]; tmp.g += cs[s].g * sw[s]; tmp.b += cs[s].b * sw[s]; }
        } else tmp.copy(leaf);
        const bark = C(t.kind === 'cactus' ? '#5d8f4a' : t.kind === 'palm' ? '#8a6a46' : '#6b4b32');
        for (const k in t.slot) if (k !== 'shadow') T[k].setColorAt(t.slot[k], k === 'trunks' || k === 'fat' ? bark : tmp);
      });
      for (const m of T.all) if (m.instanceColor) m.instanceColor.needsUpdate = true;
    }
    function clearTrees(L, x, z, r) {
      let any = false;
      L.trees.list.forEach((t, n) => { if (!t.hidden && (t.x - x) ** 2 + (t.z - z) ** 2 < (r + t.r * 0.6) ** 2) { t.hidden = true; placeTree(L, n); any = true; } });
      if (any) for (const m of L.trees.all) m.instanceMatrix.needsUpdate = true;
    }

    // rừng thưa dần theo môi trường của đảo (logic/ecology.js S.env.forest, 0..1): cây bị đốn mất trước theo một thứ tự cố định,
    // rừng mọc lại thì cây hiện lại đúng chỗ cũ; giữ ít nhất một phần năm số cây
    function thinTrees(L, f) {
      if (!L.trees || (L.treeF != null && Math.abs(L.treeF - f) < 0.02)) return; L.treeF = f;
      const keep = 0.2 + 0.8 * f; let any = false;
      L.trees.list.forEach((t, n) => { const fell = ((n * 0.6180339887) % 1) >= keep; if (!!t.felled !== fell) { t.felled = fell; placeTree(L, n); any = true; } });
      if (any) for (const m of L.trees.all) m.instanceMatrix.needsUpdate = true;
    }
    return { plantTrees, placeTree, treeColors, clearTrees, thinTrees };
  }
  BK.MapTrees = { create };
})(typeof self !== 'undefined' ? self : globalThis);
