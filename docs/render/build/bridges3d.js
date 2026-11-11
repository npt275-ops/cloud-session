(function (root) {
  'use strict';
  const BK = root.BK || (root.BK = {});
  /* Bể Kính · render/build/bridges3d.js
   * Cầu nối hai đảo kề nhau, dáng đổi theo thời (cầu treo, gỗ, đá, sắt, dây văng, cầu ánh sáng...). Cầu do logic bắc
   * (logic/diplomacy.js: hai đảo buôn bán đủ nhiều, cùng góp gỗ đá); phần chạy game gọi sync(danh sách cầu, dáng) mỗi giây:
   * cầu mới mọc ra, cầu cũ đổi dáng khi hai đảo lên thời. Cầu i nối điểm đổ bộ landing[1] của đảo i tới landing[0] của đảo
   * i+1. Dùng bộ gom mảnh của bản đồ (lands3d.shared: Kit, meshOf). Cần: three.js, render/map/map3d.js (đối tượng lands3d). */
  function create(o) {
    const { scene, lands3d } = o, X = lands3d.shared, lands = lands3d.lands;
    const { THREE, TAU, C, clamp, hash, LAND_R, RING, SC, UBOX, UCYL, UCONE, TCYL, DOME, ICO, DOD, OCT, GABLE, TORUS, VAULT, SPHG, Kit, mergeG, bodyMat, metalMat, meshOf, disposeGroup, pick, TSTYLE, landRng } = X;
    /* =============== Cầu nối hai miền =============== */
    const bridges = [];
    // cầu rộng (ngang mặt cầu gấp WIDE lần dáng gốc): đủ chỗ cho quân lính, xe hàng, xe tăng đi hai làn
    const WIDE = 2.2;
    function bridgeEnds(b) {
      // (landing[1]: bến phía đảo kế tiếp, landing[0]: phía đảo trước; logic ghi b = a + 1, nhưng cầu ghi ngược chiều vẫn nối đúng bến)
      const A = lands[b.a], B = lands[b.b], fwd = b.b === (b.a + 1) % lands.length;
      const pa = A.world(A.landing[fwd ? 1 : 0]), pb = B.world(B.landing[fwd ? 0 : 1]);
      return [pa, pb];
    }
    // độ cao mặt cầu dọc theo chiều dài (0..1)
    const deckY = (e, u) => e === 0 ? -1.6 * Math.sin(Math.PI * u) : e === 2 || e === 3 || e === 8 ? 1.0 * Math.sin(Math.PI * u) : e === 9 ? 0.7 : 0;
    function buildBridge(B, e) {
      if (B.g) { scene.remove(B.g); disposeGroup(B.g); B.g = null; }
      { const [pa0, pb0] = bridgeEnds(B.sim); B.pa = pa0; B.pb = pb0; B.len = pa0.distanceTo(pb0) + 1.2; }
      if (e < 0) { B.era = -1; return; }
      const [pa, pb] = bridgeEnds(B.sim), len = pa.distanceTo(pb) + 1.2, k = new Kit(), N = Math.round(len / 0.9);
      const roofK = new Kit(); // mái nhà giữa cầu (khối riêng: ẩn khi quân đứng trên cầu đánh cổng, để thấy người dưới mái, game/cities.js)
      const y = (u) => deckY(e, u);
      if (e === 0) {
        for (let s = 0; s <= N; s++) { const u = s / N; k.box(pick(['#8f6a46', '#7d5a3a', '#9b7653'], hash(s)), u * len, y(u) - 0.05, 0, 0.6, 0.08, 1.7); }
        for (const sz of [-0.95, 0.95]) for (let s = 0; s < N; s++) { const u0 = s / N, u1 = (s + 1) / N, a = Math.atan2(y(u1) - y(u0), len / N); k.add(UBOX(), '#c8b07a', (u0 + u1) / 2 * len, (y(u0) + y(u1)) / 2 + 0.9, sz, len / N + 0.05, 0.05, 0.05, 0, 0, a); }
        for (const u of [0, 1]) for (const sz of [-0.95, 0.95]) k.cyl('#6d5139', u * len, -0.2, sz, 0.1, 1.4, 5);
      } else if (e === 1) {
        k.box('#8a6a46', len / 2, -0.12, 0, len, 0.25, 2.2);
        for (const sz of [-1.05, 1.05]) k.add(UCYL(6), '#6d5139', len / 2, 0.75, sz, 0.09, len, 0.09, 0, 0, Math.PI / 2);
        for (const u of [0.33, 0.67]) { k.tcyl('#9a9182', u * len, -9, 0, 1.0, 1.25, 9, 8); k.blob(DOD(), '#8a8174', u * len, -9.4, 0, 1.4, 0.8); }
      } else if (e === 2 || e === 3) {
        for (let s = 0; s < N; s++) { const u0 = s / N, u1 = (s + 1) / N, a = Math.atan2(y(u1) - y(u0), len / N); k.add(UBOX(),
            e === 2 ? '#b1a99c' : '#c9bda4', (u0 + u1) / 2 * len, (y(u0) + y(u1)) / 2 - 0.45, 0, len / N + 0.06, 0.5, 2.4, 0, 0, a); for (const sz of [-1.15,
            1.15]) k.add(UBOX(), e === 2 ? '#9d9589' : '#b8ab92', (u0 + u1) / 2 * len, (y(u0) + y(u1)) / 2, sz, len / N + 0.06, 0.6, 0.22, 0, 0, a); }
        for (const u of [0.25, 0.5, 0.75]) k.tcyl(e === 2 ? '#a39b8e' : '#bcb09a', u * len, -7, 0, 0.9, 1.1, 7 + y(u) - 0.5, 8);
        if (e === 3) { for (let s = 0; s <= 4; s++) { const u = s / 4; k.cyl('#2f3540', u * len, y(u), 1.15, 0.07, 1.8, 6); } roofK.add(GABLE(), '#7a4e3e',
            len / 2, 2.4, 0, len * 0.5, 0.9, 2.6); for (const sx of [-1, 1]) k.cyl('#6d5139', len / 2 + sx * len * 0.24, y(0.5 + sx * 0.24), -1.15, 0.08,
            2.4 - 0.4, 5); }
      } else if (e === 4) {
        k.box('#5d5f63', len / 2, -0.25, 0, len, 0.35, 2.8);
        // giàn thép: hai thanh dọc, cột đứng và thanh chéo đan xen hình chữ V
        for (const sz of [-1.4, 1.4]) { k.box('#8f2f26', len / 2, 2.2, sz, len, 0.18, 0.18); k.box('#8f2f26', len / 2, 0.0, sz, len, 0.2, 0.2); for (let s = 0;
            s <= 8; s++) { const x = (s / 8) * len; k.box('#8f2f26', x, 0, sz, 0.15, 2.3, 0.15); if (s < 8) { const pw = len / 8, ang = Math.atan2(pw, 2.2);
            if (s % 2 === 0) k.add(UBOX(), '#8f2f26', x, 0, sz, 0.12, Math.hypot(pw, 2.2), 0.12, 0, 0, -ang); else k.add(UBOX(), '#8f2f26', x + pw, 0, sz,
            0.12, Math.hypot(pw, 2.2), 0.12, 0, 0, ang); } } }
      } else if (e === 6) {
        k.box('#3a3d42', len / 2, -0.3, 0, len, 0.4, 3.6); k.box('#7fd7ff', len / 2, 0.11, 0, len - 0.6, 0.06, 0.3, 0, true);
        for (const u of [0.22, 0.78]) { k.box('#eef1f4', u * len, -0.3, -1.6, 0.6, 15, 0.6); k.box('#eef1f4', u * len, -0.3, 1.6, 0.6, 15, 0.6); k.box('#eef1f4', u * len, 13.8, 0, 0.6, 0.6, 3.8); k.box('#ff5a4f', u * len, 14.5, 0, 0.3, 0.3, 0.3, 0, true); }
        for (const sz of [-1.6, 1.6]) for (let s = 0; s < 24; s++) {
          const u0 = s / 24, u1 = (s + 1) / 24, cy = (u) => (u < 0.22 ? 14.4 * (u / 0.22) : u > 0.78 ? 14.4 * ((1 - u) / 0.22) : 2 + 12.4 * Math.pow((u - 0.5) / 0.28, 2));
          const x0 = u0 * len, x1 = u1 * len, y0 = cy(u0), y1 = cy(u1);
          k.add(UBOX(), '#c9d1d9', (x0 + x1) / 2, (y0 + y1) / 2, sz, Math.hypot(x1 - x0, y1 - y0) + 0.05, 0.08, 0.08, 0, 0, Math.atan2(y1 - y0, x1 - x0));
          if (s % 2 === 0 && u0 > 0.22 && u0 < 0.78) k.add(UBOX(), '#c9d1d9', x0, 0, sz, 0.03, y0, 0.03);
        }
      } else if (e === 8) { // cầu vòm nano tự mọc: chuỗi hạt ngọc, mặt cầu trắng, đường ráp lam
        for (let s2 = 0; s2 < N; s2++) { const u0 = s2 / N, u1 = (s2 + 1) / N, a = Math.atan2(y(u1) - y(u0), len / N); k.add(UBOX(), '#eef3f7', ((u0 + u1) / 2) * len, (y(u0) + y(u1)) / 2 - 0.2, 0, len / N + 0.05, 0.3, 2.6, 0, 0, a); }
        for (let s2 = 0; s2 <= N; s2 += 2) { const u = s2 / N; for (const sz of [-1.35, 1.35]) k.add(ICO(), s2 % 4 ? '#dff6ff' : '#eef3f7', u * len, y(u) + 0.3, sz, 0.45, 0.55, 0.45); k.add(ICO(), '#7ff0ff', u * len, y(u) + 0.05, 0, 0.12, 0.12, 0.12, 0, 0, 0, 'glow'); }
        for (const u of [0.3, 0.7]) k.add(SPHG(), '#e2ebf0', u * len, -8, 0, 1.2, 8 + y(u), 1.2);
      } else if (e === 9) { // lối đi lơ lửng: những phiến sáng trôi giữa vòng năng lượng
        for (let s2 = 0; s2 < 9; s2++) { const x = ((s2 + 0.5) / 9) * len; k.box('#fff3e0', x, 0.55 + Math.sin(s2 * 1.7) * 0.08, 0, len / 9.6, 0.18, 2.4); k.add(TORUS(), '#ffb347', x, 0.1, 0, 0.9, 0.9, 0.9, 0, Math.PI / 2, 0, 'glow'); }
        for (const sz of [-1.3, 1.3]) k.box('#ffd27a', len / 2, 0.75, sz, len, 0.05, 0.05, 0, 'glow');
      } else if (e === 10) { // cặp cổng không gian: bước vào cổng này, bước ra ở cổng kia
        for (const u of [0.05, 0.95]) { k.add(TORUS(), '#b48cff', u * len, 2.6, 0, 2.5, 2.5, 3.2, Math.PI / 2, 0, 0, 'glow'); k.add(TORUS(), '#e0ccff',
            u * len, 2.6, 0, 1.9, 1.9, 2.2, Math.PI / 2, 0, 0, 'glow'); k.add(UCYL(24), '#6a3fc0', u * len, 2.6, 0, 2.3, 0.05, 2.3, 0, 0, Math.PI / 2,
            'ghost'); k.box('#3a2a5a', u * len, -0.2, 0, 3.2, 0.3, 3.2); }
        for (let s2 = 1; s2 < 12; s2++) k.add(ICO(), '#c9a6ff', (s2 / 12) * len, 1.2 + Math.sin(s2) * 0.4, 0, 0.12, 0.12, 0.12, 0, 0, 0, 'ghost');
      } else if (e === 11) { // cầu ánh sáng
        k.add(UCYL(10), '#fff6dc', len / 2, 0.2, 0, 0.9, len, 0.9, 0, 0, Math.PI / 2, 'ghost');
        k.box('#fff3c4', len / 2, 0.02, 0, len, 0.06, 2.2, 0, 'glow');
      } else if (e === 7) {
        k.box('#7ff0ff', len / 2, -0.1, 0, len, 0.12, 2.8, 0, true); k.box('#20252c', len / 2, -0.3, 0, len, 0.2, 3.2);
        for (let i = 1; i < 6; i++) k.add(TORUS(), '#dfe7ee', (i / 6) * len, 1.6, 0, 2.2, 2.2, 2.2, Math.PI / 2, 0, 0, true);
        for (const sz of [-1.5, 1.5]) k.box('#7ff0ff', len / 2, 0.5, sz, len, 0.05, 0.05, 0, true);
      } else {
        k.box('#4a4d52', len / 2, -0.3, 0, len, 0.4, 3.4); k.box('#f4f4f4', len / 2, 0.11, 0, len - 1, 0.02, 0.12);
        k.box('#eef1f4', len / 2, -0.3, 0, 1.0, 13, 1.0); k.box('#eef1f4', len / 2, 12.6, 0, 1.4, 0.4, 1.4);
        // dây văng: từ mặt cầu lên đỉnh trụ, hai mặt phẳng dây
        for (const sz of [-0.8, 0.8]) for (let s = 1; s <= 5; s++) for (const dir of [-1, 1]) { const x = len / 2 + dir * s * len / 12, dx = x - len / 2, hgt = 12.4 - (s - 1) * 1.4; k.add(UBOX(), '#cfd6dd', x, 0.1, sz, 0.05, Math.hypot(dx, hgt), 0.05, 0, 0, Math.atan2(dx, hgt)); }
      }
      const g = meshOf(k, B.litMat, scene, 0, 0, 0, e === 4);
      B.roof = e === 3 ? meshOf(roofK, B.litMat, g, 0, 0, 0) : null;
      const d = pb.clone().sub(pa);
      g.position.copy(pa).addScaledVector(d.clone().normalize(), -0.6); g.rotation.y = -Math.atan2(d.z, d.x); g.scale.set(1, 1, WIDE);
      B.g = g; B.era = e; B.len = len; B.pa = pa; B.pb = pb;
    }
    function bridgePoint(B, u, out) { return out.copy(B.pa).lerp(B.pb, u).setY(deckY(Math.max(0, B.era), u) + 0.12); }
    // theo danh sách cầu của logic: cầu mới thì dựng, dáng đổi (style(cầu) → 0..11, theo thời của hai đảo) thì dựng lại
    function sync(list, style) {
      // cầu không còn trong logic (bị phá, hay đã xây lại thành cầu mới): gỡ khỏi màn hình
      for (let k = bridges.length - 1; k >= 0; k--) if (!list.includes(bridges[k].sim)) { buildBridge(bridges[k], -1); bridges.splice(k, 1); }
      for (const b of list) {
        let B = bridges.find((x) => x.sim === b);
        if (!B) { B = { sim: b, a: b.a, b: b.b, era: -1, g: null, litMat: new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.4, emissive: '#ffcf7a', emissiveIntensity: 0 }) }; bridges.push(B); }
        const e = style(b); if (e !== B.era) buildBridge(B, e);
      }
    }
    // cầu đang xây (logic/diplomacy.js W.bridgeWorks): giàn giáo và ván mọc dần theo tiến độ thật, từ hai đầu vào giữa (cầu
    // quân sự: từ phía đảo tự xây); xong thì cầu thật hiện ra (sync)
    const works = new Map();
    const scafMat = new THREE.MeshStandardMaterial({ color: '#b08a5a', roughness: 0.9, flatShading: true });
    const plankG = new THREE.BoxGeometry(1.0, 0.1, 1.9), poleG = new THREE.CylinderGeometry(0.07, 0.07, 6.5, 5);
    function syncWorks(list) {
      const keep = new Set();
      for (const w of list) {
        const key = w.a + '-' + w.b; keep.add(key);
        let S = works.get(key);
        if (!S) { const [pa, pb] = bridgeEnds(w); S = { g: new THREE.Group(), pa, pb, step: -1 }; scene.add(S.g); works.set(key, S); }
        const step = Math.floor(w.progress * 20); if (step === S.step) continue;
        S.step = step; while (S.g.children.length) S.g.remove(S.g.children[0]);
        const len = S.pa.distanceTo(S.pb), n = Math.round(len / 1.05), d = S.pb.clone().sub(S.pa).normalize(), side = new THREE.Vector3(-d.z, 0, d.x);
        const fromA = w.by == null || w.by === w.a, fromB = w.by == null || w.by === w.b, each = Math.ceil((n * w.progress) / (fromA && fromB ? 2 : 1));
        const put = (k) => {
          const pos = S.pa.clone().addScaledVector(d, (k + 0.5) * (len / n));
          const pl = new THREE.Mesh(plankG, scafMat); pl.position.copy(pos).setY(0.05); pl.rotation.y = -Math.atan2(d.z, d.x); S.g.add(pl);
          if (k % 2 === 0) for (const sd of [-1, 1]) { const po = new THREE.Mesh(poleG, scafMat); po.position.copy(pos).addScaledVector(side, 1.05 * sd).setY(-2.6); S.g.add(po); }
        };
        for (let k = 0; k < Math.min(n, each); k++) { if (fromA) put(k); if (fromB && n - 1 - k !== k) put(n - 1 - k); }
      }
      for (const [key, S] of works) if (!keep.has(key)) { scene.remove(S.g); works.delete(key); }
    }
    const bridgeOf = (a, b) => bridges.find((B) => (B.a === a && B.b === b) || (B.a === b && B.b === a)) || null;
    // ban đêm cầu sáng đèn
    function animate(night) { for (const B of bridges) B.litMat.emissiveIntensity = night * 1.2; }
    return { bridges, sync, syncWorks, bridgeOf, bridgePoint, animate, WIDE };
  }
  BK.Bridges3D = { create };
})(typeof self !== 'undefined' ? self : globalThis);
