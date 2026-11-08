/* Bể Kính · render/war3d.js · Quân đi đánh, vây cổng, cờ của đảo cai quản
 * Vẽ các chiến dịch của logic (logic/war.js, W.wars), mỗi người lính một hình nhỏ mặc màu đảo mình (áo, khiên), cầm giáo:
 *   hành quân, rút về   thuyền chiến chở lính băng biển (lượn phía ngược với đoàn buôn), hay hàng quân đi qua cầu
 *                       (render/build/bridges3d.js bridgePoint); tiến độ theo ngày lịch của trận.
 *   đánh ở cổng         quân đứng thành hai hàng cong trước cổng phụ hướng về đảo mình (L.landing[S.situ.warSide]),
 *                       xông tới lùi lại; số hình đúng số quân còn sống (tối đa MAX_SHOWN mỗi chiến dịch).
 *   vào thành           quân tiến dần từ cổng vào giữa thành (đốt phá xung quanh), rồi vây nhà chính.
 *   sáp nhập            cờ màu đảo cai quản cắm ở sân trước nhà chính của đảo bị sáp nhập (hallOf(đảo): chỗ đó, theo toạ độ
 *                       của đảo); cột cao hơn mái nhà; quân đóng giữ đứng quanh cờ. Vừa mất thành thì cờ đảo cũ hạ xuống,
 *                       cờ đảo thắng kéo lên trong RAISE_DAYS ngày.
 * Đảo đang vẽ gần (near): quân là người thật trong làng (render/village3d.js, logic/war.js onIsland), không vẽ hình nhỏ.
 * Người ở nhà (dân, lính giữ cổng) do render/village3d.js vẽ, theo bộ não (logic/brain.js đọc S.situ.war).
 * Lính vẽ bằng khối dựng sẵn dùng chung (InstancedMesh): thân, đầu, giáo, mỗi thứ một lần vẽ cho mọi người lính.
 * Cần: three.js, render/map/map3d.js (lands3d), render/build/bridges3d.js, logic/war.js. */
(function (root) {
  'use strict';
  const BK = root.BK || (root.BK = {});
  const SEA_Y = -0.55;
  const MAX_SOLDIERS = 240, MAX_SHOWN = 24, PER_BOAT = 6, SHORE = 3;
  const INSIDE_DAYS = 3;
  const RAISE_DAYS = 1, RAISE_H = 12.5;   // kéo cờ: một ngày, từ chân cột lên đỉnh

  function create(o) {
    const { THREE, scene, lands3d, bridges3d, colors } = o, lands = lands3d.lands, R = lands3d.LAND_R, shots = o.shots || null, navalNext = new Map();
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
    // thuyền chiến: thân dài sẫm, mũi nhọn, cột và lá cờ màu đảo
    const hullG = new THREE.BoxGeometry(4.6, 0.6, 1.7), mastG = new THREE.CylinderGeometry(0.06, 0.06, 3.2, 5), flagG = new THREE.PlaneGeometry(1.2, 0.8);
    flagG.translate(0.6, 0, 0);
    const hullM = mat('#3b2c22'), mastM = mat('#4a3422'), flagM = col.map((c) => mat(c, { side: THREE.DoubleSide, emissive: c, emissiveIntensity: 0.15 }));
    const boats = [], flags = [];
    function boat(k) {
      if (!boats[k]) { const g = new THREE.Group(); g.add(new THREE.Mesh(hullG, hullM)); const m = new THREE.Mesh(mastG, mastM); m.position.set(0.4, 1.6, 0);
          g.add(m); const f = new THREE.Mesh(flagG, flagM[0]); f.position.set(0.45, 2.8, 0); g.add(f); g.userData.flag = f; scene.add(g); boats[k] = g; }
      boats[k].visible = true; return boats[k];
    }
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
    // điểm bờ biển của đảo s phía đảo d
    function shore(s, d, out) { const A = lands[s].center, B = lands[d].center; dir.copy(B).sub(A).setY(0).normalize(); return out.copy(A).addScaledVector(dir, R + SHORE); }
    // điểm cổng phụ của đảo b (side 0, 1: L.landing)
    function gate(b, sideK, k, out) { const L = lands[b]; return out.copy(L.landing[sideK || 0]).multiplyScalar(k).add(L.center).setY(0); }

    // hành quân, rút về: s → d, u 0..1, cnt người, c màu
    let nb = 0;
    function march(s, d, u, cnt, c, t) {
      const B = bridges3d.bridgeOf(s, d);
      if (B && B.era >= 0) {
        const fwd = B.a === s; side.copy(B.pb).sub(B.pa).normalize(); const perp = new THREE.Vector3(-side.z, 0, side.x), face = side.clone().multiplyScalar(fwd ? 1 : -1);
        for (let k = 0; k < cnt; k++) { const uu = Math.max(0, Math.min(1, (fwd ? u : 1 - u) - (fwd ? 1 : -1) * Math.floor(k / 2) * 0.03));
            bridges3d.bridgePoint(B, uu, tmp); tmp.addScaledVector(perp, (k % 2 ? 0.45 : -0.45) - 0.55 * (fwd ? 1 : -1));
            tmp.y += Math.abs(Math.sin(t * 0.012 + k)) * 0.06; soldier(tmp, yawOf(face), c); }
        return;
      }
      shore(s, d, from); shore(d, s, to); dir.copy(to).sub(from).setY(0).normalize(); side.set(dir.z, 0, -dir.x);
      for (let b = 0; b * PER_BOAT < cnt; b++) {
        const g = boat(nb++); g.userData.flag.material = flagM[c];
        g.position.copy(from).lerp(to, u).addScaledVector(side, Math.sin(Math.PI * u) * 7 + b * 2.4).addScaledVector(dir, -b * 1.5).setY(SEA_Y + 0.25 + Math.sin(t * 0.003 + b) * 0.08);
        g.rotation.set(0, -Math.atan2(dir.z, dir.x), Math.sin(t * 0.002 + b) * 0.04);
        for (let k = b * PER_BOAT; k < Math.min(cnt, (b + 1) * PER_BOAT); k++) { const j = k - b * PER_BOAT; tmp.copy(g.position).addScaledVector(dir, -1.6 + (j >> 1) * 1.1).addScaledVector(side, j % 2 ? 0.45 : -0.45).setY(g.position.y + 0.3); soldier(tmp, yawOf(dir), c); }
      }
    }
    // hải chiến (logic/battles.js w.naval): đội thuyền đảo bị đánh chắn trước đội thuyền bên đánh, hai bên bắn nhau
    // bằng vũ khí thời mình (tên, đạn, tia; render/shots3d.js)
    function naval(W, w, lead, t) {
      const N = w.naval, crew = N.crew.filter((x) => x.p.alive).length, nd = Math.max(1, Math.min(4, Math.ceil(crew / PER_BOAT))), now = t * 0.001;
      const at = [];
      for (let b = 0; b < nd; b++) {
        const g = boat(nb++); g.userData.flag.material = flagM[N.r];
        g.position.copy(lead).addScaledVector(dir, 7 + (b % 2) * 1.5).addScaledVector(side, (b - (nd - 1) / 2) * 2.6).setY(SEA_Y + 0.25 + Math.sin(t * 0.003 + b + 2) * 0.08);
        g.rotation.set(0, -Math.atan2(-dir.z, -dir.x), Math.sin(t * 0.002 + b) * 0.04); at.push(g.position);
      }
      const nx = navalNext.get(w.id) || 0; if (!shots || (now < nx && nx - now < 5)) return;
      navalNext.set(w.id, now + 0.35 + Math.random() * 0.4); if (navalNext.size > 50) navalNext.clear();
      const fire = (lv, a, b) => { const k = BK.Shots3D.OF[BK.Arms ? BK.Arms.kit(lv).ranged : 'bow'] || ['arrow']; const f = a.clone(), e = b.clone();
          f.y += 1; e.y += 0.6; e.x += (Math.random() - 0.5) * 1.5; e.z += (Math.random() - 0.5) * 1.5; shots.fire(k[0], f, e, now, { color: k[1],
          puff: k[2] }); };
      const d = at[Math.floor(Math.random() * at.length)];
      fire(W.islands[w.a].level, lead, d); fire(W.islands[N.r].level, d, lead);
    }
    // mỗi khung hình: W (logic/world.js), day (có phần lẻ), t (ms), hallOf(i): sân trước nhà chính của đảo i (toạ độ của đảo)
    // near(i): làng đảo i đang được vẽ gần (người thật, render/village3d.js): không vẽ thêm hình lính nhỏ ở đó;
    // gateAt(i): chỗ cổng đang bị đánh (toạ độ của đảo), không có thì cổng phụ phía đảo kia
    function update(W, day, t, hallOf, near, gateAt) {
      n = 0; nb = 0; let nf = 0;
      for (const w of W.wars || []) {
        const cnt = Math.min(MAX_SHOWN, w.troops.filter((x) => x.p.alive).length); if (!cnt) continue;
        const c = w.a, B = W.islands[w.b];
        if (w.stage === 'march' || w.stage === 'return') {
          const u = Math.max(0, Math.min(1, (day - w.depart) / Math.max(1e-6, w.arrive - w.depart)));
          const nb0 = nb;
          if (w.stage === 'march') march(w.a, w.b, u, cnt, c, t); else march(w.b, w.a, u, cnt, c, t);
          if (w.stage === 'march' && w.naval && !w.naval.done && day >= w.naval.from && nb > nb0) naval(W, w, boats[nb0].position, t);
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
      for (let k = nb; k < boats.length; k++) boats[k].visible = false;
      for (let k = nf; k < flags.length; k++) flags[k].visible = false;
      for (const m of [bodies, heads, spears]) { m.count = n; m.instanceMatrix.needsUpdate = true; }
      if (bodies.instanceColor) bodies.instanceColor.needsUpdate = true;
    }
    return { update };
  }
  BK.War3D = { create };
})(typeof self !== 'undefined' ? self : globalThis);
