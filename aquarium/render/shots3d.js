/* Bể Kính · render/shots3d.js · Tên, đạn, tia bay trên chiến trường (design/chien-tranh-thinh-vuong.md mục 1)
 * Người bắn xa (render/village3d.js), máy công thành (render/engines3d.js), thuyền chiến (render/war3d.js) gọi fire(kiểu, từ, tới)
 * mỗi phát; tệp này vẽ đường bay rồi xoá. Toạ độ thế giới. Kiểu:
 *   stone   đá ná, đá máy bắn đá (bay vòng cung, xám)          arrow  mũi tên, tên nỏ (vòng cung thấp, thân gỗ)
 *   fire    tên lửa đốt (vòng cung, đầu lửa)                     bullet đạn súng (thẳng, vệt sáng vàng ngắn)
 *   ball    đạn đại bác, pháo (vòng cung, cầu sẫm)               plasma cầu sáng xanh lá hay xanh dương (thẳng, chậm)
 *   beam    tia (súng điện, súng tia: tia sáng loé rồi tắt)      shell  đạn pháo xe tăng (thẳng, nhanh, đầu đạn sáng cam)
 * Súng hoả mai, súng trường, đại bác, pháo có khói trắng ở nòng (puff). Khối lặp dùng chung, mỗi loại một lần vẽ.
 * Cần: three.js. */
(function (root) {
  'use strict';
  const BK = root.BK || (root.BK = {});
  const MAX = 240;
  // [thời gian bay (giây), độ cao vòng cung, cỡ]
  const KIND = { stone: [0.9, 2.2, 0.16], arrow: [0.6, 1.0, 1], fire: [0.7, 1.4, 1], bullet: [0.14, 0, 1], ball: [1.1, 3.5, 0.28], plasma: [0.45, 0, 0.22], beam: [0.12, 0, 1], shell: [0.3, 0.15, 0.13] };
  function create(o) {
    const { THREE, scene } = o;
    const mk = (geo, mat) => { const I = new THREE.InstancedMesh(geo, mat, MAX); I.count = 0; I.frustumCulled = false; scene.add(I); return I; };
    const arrowG = new THREE.BoxGeometry(0.04, 0.04, 0.7), sph = new THREE.SphereGeometry(1, 10, 8), beamG = new THREE.BoxGeometry(0.05, 0.05, 1); beamG.translate(0, 0, 0.5);
    const tracerG = new THREE.BoxGeometry(0.035, 0.035, 0.6);
    const add = (c) => new THREE.MeshBasicMaterial({ color: c, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
    const I = {
      arrow: mk(arrowG, new THREE.MeshStandardMaterial({ color: '#6b4a2f', roughness: 0.8 })),
      stone: mk(sph, new THREE.MeshStandardMaterial({ color: '#7d7a73', roughness: 0.9, flatShading: true })),
      ball: mk(sph, new THREE.MeshStandardMaterial({ color: '#25262a', roughness: 0.6, metalness: 0.4 })),
      glow: mk(sph, add('#ffffff')), tracer: mk(tracerG, add('#ffd860')), beam: mk(beamG, add('#ffffff')),
      puff: mk(new THREE.IcosahedronGeometry(1, 0), new THREE.MeshStandardMaterial({ color: '#f2f0ea', roughness: 1, transparent: true, opacity: 0.7, depthWrite: false, flatShading: true })),
    };
    for (const k of ['glow', 'beam']) for (let n = 0; n < MAX; n++) I[k].setColorAt(n, new THREE.Color('#ffffff'));
    const live = [], puffs = [];
    const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), V = new THREE.Vector3(), V2 = new THREE.Vector3(), S = new THREE.Vector3(), Z = new THREE.Vector3(0, 0, 1), col = new THREE.Color();
    // một phát: kind (KIND), from, to (Vector3 thế giới), now (giây); o: { color, puff (cỡ khói ở nòng) }
    function fire(kind, from, to, now, opt) {
      if (live.length >= MAX) live.shift();
      live.push({ kind, a: from.clone(), b: to.clone(), t0: now, color: opt && opt.color });
      if (opt && opt.puff) { if (puffs.length >= MAX) puffs.shift(); puffs.push({ p: from.clone(), t0: now, s: opt.puff }); }
    }
    const at = (s, u, out) => { const K = KIND[s.kind]; out.copy(s.a).lerp(s.b, u); out.y += Math.sin(Math.PI * u) * K[1] * Math.min(1, s.a.distanceTo(s.b) / 8); return out; };
    function update(now) {
      const n = { arrow: 0, stone: 0, ball: 0, glow: 0, tracer: 0, beam: 0, puff: 0 };
      for (let k = live.length - 1; k >= 0; k--) {
        const s = live[k], K = KIND[s.kind], u = (now - s.t0) / K[0];
        if (u >= 1 || u < 0) { live.splice(k, 1); continue; }
        if (s.kind === 'beam') { // tia: một đoạn sáng từ nòng tới đích, mờ dần
          V.copy(s.b).sub(s.a); const L = V.length(); Q.setFromUnitVectors(Z, V.normalize()); S.set(1 - u * 0.6, 1 - u * 0.6, L); M.compose(s.a, Q, S);
          I.beam.setMatrixAt(n.beam, M); I.beam.setColorAt(n.beam, col.set(s.color || '#ff6af0')); n.beam++; continue;
        }
        at(s, u, V); at(s, Math.min(1, u + 0.03), V2); V2.sub(V); if (V2.lengthSq() < 1e-8) V2.set(0, 0, 1); Q.setFromUnitVectors(Z, V2.normalize());
        if (s.kind === 'arrow' || s.kind === 'fire') { S.set(1, 1, 1); M.compose(V, Q, S); I.arrow.setMatrixAt(n.arrow++, M); if (s.kind === 'fire') { S.setScalar(0.12); M.compose(V, Q, S); I.glow.setMatrixAt(n.glow, M); I.glow.setColorAt(n.glow++, col.set('#ff8a2a')); } }
        else if (s.kind === 'bullet') { S.set(1, 1, 1); M.compose(V, Q, S); I.tracer.setMatrixAt(n.tracer++, M); }
        else if (s.kind === 'shell') { S.set(2.2, 2.2, 1.6); M.compose(V, Q, S); I.tracer.setMatrixAt(n.tracer++, M); S.setScalar(K[2]); M.compose(V, Q, S); I.glow.setMatrixAt(n.glow, M); I.glow.setColorAt(n.glow++, col.set('#ffb347')); }
        else if (s.kind === 'plasma') { S.setScalar(K[2]); M.compose(V, Q, S); I.glow.setMatrixAt(n.glow, M); I.glow.setColorAt(n.glow++, col.set(s.color || '#5fd8ff')); }
        else { S.setScalar(K[2]); M.compose(V, Q, S); I[s.kind].setMatrixAt(n[s.kind]++, M); }
      }
      for (let k = puffs.length - 1; k >= 0; k--) {
        const P = puffs[k], u = (now - P.t0) / 1.4; if (u >= 1) { puffs.splice(k, 1); continue; }
        V.copy(P.p); V.y += u * 0.8; Q.identity(); S.setScalar(P.s * (0.4 + u * 1.2)); M.compose(V, Q, S); I.puff.setMatrixAt(n.puff++, M);
      }
      for (const k in I) { I[k].count = n[k]; I[k].instanceMatrix.needsUpdate = true; I[k].visible = n[k] > 0; if (I[k].instanceColor) I[k].instanceColor.needsUpdate = true; }
    }
    return { fire, update, get live() { return live.length; } };
  }
  // kiểu đạn, màu, khói ở nòng theo vũ khí (logic/arms.js KIT ranged) và theo máy công thành
  const OF = {
    sling: ['stone'], bow: ['arrow'], crossbow: ['arrow'], musket: ['bullet', null, 0.35], rifle: ['bullet', null, 0.18], mg: ['bullet'], autorifle: ['bullet'],
    shock: ['beam', '#5fd8ff'], spore: ['plasma', '#9dff6a'], ray: ['beam', '#ff6af0'],
    catapult: ['stone'], cannon: ['ball', null, 0.8], artillery: ['ball', null, 1.0], armor: ['shell', null, 0.7], drone: ['bullet'], plasma: ['plasma', '#7af7ff'],
  };
  BK.Shots3D = { create, OF };
})(typeof self !== 'undefined' ? self : globalThis);
