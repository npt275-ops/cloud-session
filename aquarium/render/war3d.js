/* Bể Kính · render/war3d.js · Quân đi đánh, vây cổng, cờ của đảo cai quản
 * Vẽ các chiến dịch của logic (logic/war.js, W.wars), mỗi người lính một hình nhỏ mặc màu đảo mình (áo, khiên), cầm giáo:
 *   hành quân, rút về   hàng quân đi qua từng cây cầu trên đường (w.path, render/build/bridges3d.js bridgePoint), băng qua
 *                       đảo ở giữa từ đầu cầu này sang đầu cầu kia; tiến độ theo ngày lịch của trận. Không đi thuyền.
 *   đánh ở cổng         quân đứng thành hai hàng cong trước cổng phụ hướng về đảo mình (L.landing[S.situ.warSide]),
 *                       xông tới lùi lại; số hình đúng số quân còn sống (tối đa MAX_SHOWN mỗi chiến dịch).
 *   vào thành           quân tiến dần từ cổng vào giữa thành (đốt phá xung quanh), rồi vây nhà chính.
 *   sáp nhập            cờ màu đảo cai quản cắm ở sân trước nhà chính của đảo bị sáp nhập (hallOf(đảo): chỗ đó, theo toạ độ
 *                       của đảo); cột cao hơn mái nhà; quân đóng giữ đứng quanh cờ. Vừa mất thành thì cờ đảo cũ hạ xuống,
 *                       cờ đảo thắng kéo lên trong RAISE_DAYS ngày.
 * Đảo đang vẽ gần (near): quân là người thật trong làng (render/village3d.js, logic/war.js onIsland; hành quân trên cầu, băng qua
 * đảo: game/cities.js), không vẽ hình nhỏ. Hình nhỏ chỉ để nhìn từ xa.
 * Người ở nhà (dân, lính giữ cổng) do render/village3d.js vẽ, theo bộ não (logic/brain.js đọc S.situ.war).
 * Lính vẽ bằng khối dựng sẵn dùng chung (InstancedMesh): thân, đầu, giáo, mỗi thứ một lần vẽ cho mọi người lính.
 * Cần: three.js, render/map/map3d.js (lands3d), render/build/bridges3d.js, logic/war.js. */
(function (root) {
  'use strict';
  const BK = root.BK || (root.BK = {});
  const MAX_SOLDIERS = 240, MAX_SHOWN = 24;
  const INSIDE_DAYS = 3;
  const RAISE_DAYS = 1, RAISE_H = 12.5;   // kéo cờ: một ngày, từ chân cột lên đỉnh

  function create(o) {
    const { THREE, scene, lands3d, bridges3d, colors } = o, lands = lands3d.lands;
    const col = colors.map((c) => new THREE.Color(c));
    const mat = (c, extra) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.7, flatShading: true }, extra || {}));
    // lính: thân (áo màu đảo), đầu, giáo; mỗi thứ một InstancedMesh
    const bodyG = new THREE.CylinderGeometry(0.22, 0.3, 0.95, 6); bodyG.translate(0, 0.48, 0);
    const headG = new THREE.SphereGeometry(0.2, 8, 6); headG.translate(0, 1.15, 0);
    const spearG = new THREE.BoxGeometry(0.05, 1.9, 0.05); spearG.translate(0.32, 0.95, 0);
    const bodies = new THREE.InstancedMesh(bodyG, mat('#ffffff'), MAX_SOLDIERS), heads = new THREE.InstancedMesh(headG, mat('#e2b48c'), MAX_SOLDIERS), spears = new THREE.InstancedMesh(spearG, mat('#7a6a55', { metalness: 0.3 }), MAX_SOLDIERS);
    // màu từng người phải có từ đầu (three.js r128 dựng shader theo lần vẽ đầu tiên, và tạo mảng màu theo count lúc gọi)
    for (let k = 0; k < MAX_SOLDIERS; k++) bodies.setColorAt(k, new THREE.Color('#ffffff'));
    for (const m of [bodies, heads, spears]) { m.count = 0; m.frustumCulled = false; scene.add(m); }
    // cờ: cột, lá cờ màu đảo
    const flagM = col.map((c) => mat(c, { side: THREE.DoubleSide, emissive: c, emissiveIntensity: 0.15 })), mastM = mat('#4a3422');
    const flags = [];
    // cờ của đảo cai quản trên đảo bị sáp nhập: cột cao, lá cờ lớn
    const poleG = new THREE.CylinderGeometry(0.12, 0.15, 16, 6); poleG.translate(0, 8, 0);
    const bigFlagG = new THREE.PlaneGeometry(3.6, 2.2); bigFlagG.translate(1.8, 14.7, 0);
    function flagAt(k) {
      if (!flags[k]) { const g = new THREE.Group(); g.add(new THREE.Mesh(poleG, mastM)); const f = new THREE.Mesh(bigFlagG, flagM[0]); g.add(f); g.userData.flag = f; scene.add(g); flags[k] = g; }
      flags[k].visible = true; return flags[k];
    }

    const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), S1 = new THREE.Vector3(1, 1, 1), UP = new THREE.Vector3(0, 1, 0);
    const tmp = new THREE.Vector3(), dir = new THREE.Vector3(), side = new THREE.Vector3(), from = new THREE.Vector3(), to = new THREE.Vector3();
    let n = 0;
    // một người lính ở pos, quay mặt theo góc yaw, màu đảo c
    function soldier(pos, yaw, c) {
      if (n >= MAX_SOLDIERS) return;
      Q.setFromAxisAngle(UP, yaw); M4.compose(pos, Q, S1);
      bodies.setMatrixAt(n, M4); heads.setMatrixAt(n, M4); spears.setMatrixAt(n, M4); bodies.setColorAt(n, col[c]); n++;
    }
    const yawOf = (d) => Math.atan2(d.x, d.z); // hình lính quay mặt theo hướng d (mặt về +z cục bộ)
    // điểm cổng phụ của đảo b (side 0, 1: L.landing)
    function gate(b, sideK, k, out) { const L = lands[b]; return out.copy(L.landing[sideK || 0]).multiplyScalar(k).add(L.center).setY(0); }

    // hành quân, rút về theo đường cầu path ([đảo đi, ..., đảo tới]), u 0..1 cả đường, cnt người, c màu. Mỗi chặng là một cây cầu;
    // từ chặng thứ hai, phần đầu của chặng là băng qua đảo ở giữa (từ đầu cầu trước tới đầu cầu sau)
    const ACROSS = 0.3, perp = new THREE.Vector3(), face = new THREE.Vector3(), endA = new THREE.Vector3();
    function march(path, u, cnt, c, t, near) {
      const legs = path.length - 1;
      for (let k = 0; k < cnt; k++) {
        const uk = Math.max(0, Math.min(1 - 1e-6, u - Math.floor(k / 2) * 0.012)), li = Math.min(legs - 1, Math.floor(uk * legs)), v = uk * legs - li;
        const s = path[li], d = path[li + 1], B = bridges3d.bridgeOf(s, d); if (!B || B.era < 0) continue;
        // làng ở đầu cầu đang vẽ gần: quân là người thật trong làng đó (game/cities.js), không vẽ hình nhỏ
        if (near && (near(s) || (!(li > 0 && v < ACROSS) && near(d)))) continue;
        const fwd = B.a === s; side.copy(B.pb).sub(B.pa).normalize(); perp.set(-side.z, 0, side.x); face.copy(side).multiplyScalar(fwd ? 1 : -1);
        let w = v;
        if (li > 0 && v < ACROSS) { // băng qua đảo s: từ cuối cầu trước tới đầu cầu này
          const P = bridges3d.bridgeOf(path[li - 1], s); if (P) { bridges3d.bridgePoint(P, P.a === s ? 0 : 1, endA); bridges3d.bridgePoint(B, fwd ? 0 : 1, tmp);
            // (đường cong vào phía trong đảo: mép đảo không tròn, đường thẳng giữa hai đầu cầu có đoạn thò ra mặt nước)
            const q = v / ACROSS; tmp.lerp(endA, 1 - q); dir.copy(tmp).sub(endA).setY(0); const C = lands[s] && lands[s].center; if (C) { const y = tmp.y; tmp.lerp(C, 0.3 * Math.sin(Math.PI * q)); tmp.y = y; }
            tmp.addScaledVector(perp, k % 2 ? 0.45 : -0.45); soldier(tmp, yawOf(dir.lengthSq() > 1e-4 ? dir : face), c); continue; }
        }
        if (li > 0) w = Math.max(0, (v - ACROSS) / (1 - ACROSS)); // (cầu trước đã bị phá: không ngoại suy ra ngoài đầu cầu, xuống nước)
        bridges3d.bridgePoint(B, fwd ? w : 1 - w, tmp); tmp.addScaledVector(perp, (k % 2 ? 0.45 : -0.45) - 0.55 * (fwd ? 1 : -1));
        tmp.y += Math.abs(Math.sin(t * 0.012 + k)) * 0.06; soldier(tmp, yawOf(face), c);
      }
    }
    // mỗi khung hình: W (logic/world.js), day (có phần lẻ), t (ms), hallOf(i): sân trước nhà chính của đảo i (toạ độ của đảo)
    // near(i): làng đảo i đang được vẽ gần (người thật, render/village3d.js): không vẽ thêm hình lính nhỏ ở đó;
    // gateAt(i): chỗ cổng đang bị đánh (toạ độ của đảo), không có thì cổng phụ phía đảo kia
    function update(W, day, t, hallOf, near, gateAt) {
      n = 0; let nf = 0;
      for (const w of W.wars || []) {
        const cnt = Math.min(MAX_SHOWN, w.troops.filter((x) => x.p.alive).length); if (!cnt) continue;
        const c = w.a, B = W.islands[w.b];
        if (w.stage === 'march' || w.stage === 'return') {
          const u = Math.max(0, Math.min(1, (day - w.depart) / Math.max(1e-6, w.arrive - w.depart)));
          const path = w.path || [w.a, w.b];
          march(w.stage === 'march' ? path : path.slice().reverse(), u, cnt, c, t, near);
          continue;
        }
        if (w.stage === 'muster' || (near && near(w.b))) continue; // tập hợp ở nhà, hay đảo đang vẽ gần: người thật
        // trước cổng (hai hàng cong, xông tới lùi lại), hay đang tiến vào nhà chính
        const sideK = B.situ.warSide || 0, L = lands[w.b];
        const f = w.stage === 'inside' ? (w.siege === 'hall' ? 1 : Math.max(0, Math.min(0.6, (day - w.since) / INSIDE_DAYS))) : 0;
        const ga = gateAt && gateAt(w.b); if (ga) from.copy(ga).add(L.center).setY(0); else gate(w.b, sideK, 1.0, from); to.copy(L.center).setY(0);
        dir.copy(to).sub(from).normalize(); side.set(dir.z, 0, -dir.x);
        const base = from.clone().lerp(to, f * 0.82);
        for (let k = 0; k < cnt; k++) {
          const row = k % 2, col2 = (k >> 1) - (cnt >> 2), lunge = w.stage === 'gate' || w.stage === 'loot' ? Math.max(0, Math.sin(t * 0.006 + k * 1.7)) * 0.6 : Math.sin(t * 0.01 + k) * 0.1;
          tmp.copy(base).addScaledVector(side, col2 * 0.9).addScaledVector(dir, -row * 1.0 - Math.abs(col2) * 0.15 + lunge).setY(0);
          soldier(tmp, yawOf(dir), c);
        }
      }
      // đảo bị sáp nhập: cờ đảo cai quản cạnh nhà chính, quân đóng giữ quanh cờ
      W.islands.forEach((S, i) => {
        if (S.annexedBy == null) return;
        const L = lands[i], g = flagAt(nf++); g.userData.flag.material = flagM[S.annexedBy];
        const h = hallOf && hallOf(i); if (h) tmp.copy(h).add(L.center).setY(0); else tmp.copy(L.center).addScaledVector(L.inw, 8).setY(0);
        g.position.copy(tmp); g.rotation.y = Math.sin(t * 0.0004) * 0.6;
        // vừa mất thành: cờ đảo cũ hạ dần xuống, cờ đảo thắng kéo dần lên (một ngày)
        const up = Math.max(0, Math.min(1, (day - (S.annexDay || 0)) / RAISE_DAYS));
        g.userData.flag.position.y = -(1 - up) * RAISE_H;
        if (up < 1) { const o = flagAt(nf++); o.userData.flag.material = flagM[i]; o.position.copy(tmp).add(side.set(0.6, 0, 0.6)); o.rotation.y = g.rotation.y; o.userData.flag.position.y = -up * RAISE_H; }
        if (near && near(i)) return; // quân đóng giữ là người thật đi tuần trong làng
        const gar = S.garrison ? Math.min(MAX_SHOWN, S.garrison.troops.filter((x) => x.p.alive).length) : 0;
        for (let k = 0; k < gar; k++) { const a = (k / Math.max(1, gar)) * Math.PI * 2; side.set(Math.cos(a), 0, Math.sin(a)); from.copy(tmp).addScaledVector(side, 2.2); soldier(from, yawOf(side), S.annexedBy); }
      });
      for (let k = nf; k < flags.length; k++) flags[k].visible = false;
      for (const m of [bodies, heads, spears]) { m.count = n; m.instanceMatrix.needsUpdate = true; }
      if (bodies.instanceColor) bodies.instanceColor.needsUpdate = true;
    }
    // vị trí các hình lính nhỏ đang vẽ (toạ độ thế giới), cho tools/bug-hunt.js
    const figures = () => { const out = [], m = new THREE.Matrix4(), v = new THREE.Vector3(); for (let k = 0; k < bodies.count; k++) { bodies.getMatrixAt(k, m); out.push(v.setFromMatrixPosition(m).clone()); } return out; };
    return { update, figures };
  }
  BK.War3D = { create };
})(typeof self !== 'undefined' ? self : globalThis);
