/* Bể Kính · render/engines3d.js · Máy công thành, trại vây, cổng dịch chuyển, lá chắn (design/chien-tranh-thinh-vuong.md mục 1, 2)
 * Mỗi khung hình game/cities.js đưa vào danh sách những thứ cần vẽ ở đảo đang có trận (toạ độ thế giới):
 *   { kind: 'catapult' | 'cannon' | 'artillery' | 'armor' | 'drone' | 'plasma', at, face, color } máy công thành của bên đánh,
 *       đứng ngoài cổng, quay về cổng; máy bắn đá vung cần, đại bác, pháo giật lùi khi bắn, xe bọc thép nhích tới lui, drone
 *       bay lượn trên cổng, pháo plasma phát sáng phập phồng. fired(k): máy k vừa bắn (cho hoạt cảnh giật, vung)
 *   { kind: 'tent', at }     trại vây thành: lều và đống lửa
 *   { kind: 'portal', at }   cổng dịch chuyển (thời 11): vòng sáng đứng trong thành
 *   { kind: 'shield', at, r } lá chắn năng lượng (thời 12): vòm trong suốt trùm lên đảo, mờ dần khi bị phá
 * Mỗi loại dựng sẵn một nhóm khối, dùng lại theo kho. Cần: three.js. */
(function (root) {
  'use strict';
  const BK = root.BK || (root.BK = {});
  function create(o) {
    const { THREE, scene } = o;
    const std = (c, x) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.75, flatShading: true }, x || {}));
    const glow = (c, op) => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: op == null ? 0.85 : op, depthWrite: false, blending: THREE.AdditiveBlending });
    const box = (w, h, d) => new THREE.BoxGeometry(w, h, d), cyl = (r1, r2, h, n) => new THREE.CylinderGeometry(r1, r2, h, n || 8);
    const M = { wood: std('#7a5534'), dark: std('#3a2a1c'), iron: std('#3b3f45', { metalness: 0.5 }), steel: std('#6f7780', { metalness: 0.6 }), olive: std('#5d6b48'), white: std('#e9ecef', { metalness: 0.3 }), tent: std('#d9cdb2'), stone: std('#8f8a80') };
    const add = (g, geo, m, x, y, z, rx, ry, rz) => { const me = new THREE.Mesh(geo, m); me.position.set(x || 0, y || 0, z || 0); me.rotation.set(rx || 0, ry || 0, rz || 0); g.add(me); return me; };
    const BUILD = {
      catapult: () => { const g = new THREE.Group(); add(g, box(1.6, 0.25, 2.4), M.wood, 0, 0.35, 0); for (const x of [-0.6, 0.6]) add(g, box(0.18, 1.6, 0.18), M.wood, x, 1.1, 0.2); add(g, box(1.4, 0.18, 0.18), M.wood, 0, 1.85, 0.2);
        const arm = new THREE.Group(); arm.position.set(0, 1.0, 0.2); add(arm, box(0.16, 0.16, 2.6), M.dark, 0, 0, -0.9); add(arm, box(0.5, 0.25, 0.5), M.dark, 0, 0.05, -2.1); add(arm, new THREE.SphereGeometry(0.22, 8, 6), M.stone, 0, 0.3, -2.1); g.add(arm); g.userData.arm = arm;
        for (const [x, z] of [[-0.8, -1], [0.8, -1], [-0.8, 1], [0.8, 1]]) add(g, cyl(0.3, 0.3, 0.15), M.dark, x, 0.3, z, 0, 0, Math.PI / 2); return g; },
      cannon: () => { const g = new THREE.Group(); const b = new THREE.Group(); add(b, cyl(0.16, 0.24, 1.8, 10), M.iron, 0, 0, 0.6, Math.PI / 2); b.position.set(0, 0.75, 0); b.rotation.x = -0.18; g.add(b); g.userData.barrel = b;
        add(g, box(0.6, 0.35, 1.2), M.wood, 0, 0.5, -0.2); for (const x of [-0.42, 0.42]) add(g, cyl(0.45, 0.45, 0.1, 12), M.dark, x, 0.45, 0, 0, 0, Math.PI / 2); return g; },
      artillery: () => { const g = BUILD.cannon(); g.scale.setScalar(1.35); g.userData.barrel.children[0].material = M.olive; return g; },
      armor: () => { const g = new THREE.Group(); add(g, box(1.8, 0.8, 3.0), M.olive, 0, 0.7, 0); for (const x of [-1.0, 1.0]) add(g, box(0.35, 0.6, 3.1), M.dark, x, 0.4, 0);
        const tur = new THREE.Group(); tur.position.set(0, 1.25, -0.2); add(tur, box(1.0, 0.5, 1.1), M.olive, 0, 0, 0); add(tur, cyl(0.08, 0.1, 1.8, 8), M.iron, 0, 0.05, 1.2, Math.PI / 2); g.add(tur); g.userData.barrel = tur; return g; },
      drone: () => { const g = new THREE.Group(); add(g, box(0.6, 0.18, 0.6), M.white, 0, 0, 0); const rotors = [];
        for (const [x, z] of [[-0.5, -0.5], [0.5, -0.5], [-0.5, 0.5], [0.5, 0.5]]) { add(g, box(0.5, 0.05, 0.06), M.steel, x / 2, 0, z / 2, 0, Math.atan2(x, z)); const r = add(g, box(0.5, 0.02, 0.06), M.dark, x, 0.1, z); rotors.push(r); }
        add(g, new THREE.SphereGeometry(0.08, 8, 6), glow('#ff5050', 1), 0, -0.1, 0.3); g.userData.rotors = rotors; return g; },
      plasma: () => { const g = new THREE.Group(); add(g, box(1.2, 0.5, 1.6), M.white, 0, 0.3, 0); const b = new THREE.Group(); b.position.set(0, 0.9, 0); add(b, cyl(0.2, 0.3, 1.6, 12), M.steel, 0, 0, 0.5, Math.PI / 2); g.add(b);
        const core = add(g, new THREE.SphereGeometry(0.32, 12, 10), glow('#7af7ff'), 0, 0.9, 1.35); g.userData.barrel = b; g.userData.core = core; return g; },
      tent: () => { const g = new THREE.Group(); add(g, new THREE.ConeGeometry(1.3, 1.8, 6), M.tent, 0, 0.9, 0); add(g, new THREE.ConeGeometry(1.0, 1.5, 6), M.tent, 2.6, 0.75, 1.0);
        add(g, new THREE.SphereGeometry(0.3, 8, 6), glow('#ff9a2e'), 1.3, 0.3, -1.6); for (let k = 0; k < 5; k++) add(g, cyl(0.06, 0.06, 0.8), M.dark, 1.3 + Math.cos(k) * 0.3, 0.12, -1.6 + Math.sin(k) * 0.3, Math.PI / 2, k); g.userData.fire = g.children[2]; return g; },
      portal: () => { const g = new THREE.Group(); const ring = add(g, new THREE.TorusGeometry(1.6, 0.18, 10, 32), glow('#c38bff'), 0, 1.8, 0); add(g, new THREE.CircleGeometry(1.5, 32), glow('#6a3bff', 0.35), 0, 1.8, 0); g.userData.ring = ring; return g; },
      shield: () => { const g = new THREE.Group(); const d = add(g, new THREE.SphereGeometry(1, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#7fe8ff', transparent: true, opacity: 0.16, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending })); g.userData.dome = d; return g; },
    };
    const pool = {}, used = {};
    function take(kind) { const P = pool[kind] || (pool[kind] = []); used[kind] = used[kind] || 0; if (used[kind] >= P.length) { const g = BUILD[kind](); scene.add(g); P.push(g); } const g = P[used[kind]++]; g.visible = true; return g; }
    const V = new THREE.Vector3();
    // list: [{ kind, at, face, shot (thời điểm phát bắn gần nhất, giây), hp, r }]; t: giây
    function update(list, t) {
      for (const k in used) used[k] = 0;
      for (const e of list) {
        if (!BUILD[e.kind]) continue;
        const g = take(e.kind), U = g.userData, since = e.shot != null ? t - e.shot : 9;
        g.position.copy(e.at); if (e.face) { V.copy(e.face).sub(e.at); g.rotation.y = Math.atan2(V.x, V.z); }
        if (U.arm) U.arm.rotation.x = since < 0.5 ? -1.6 * Math.sin(Math.min(1, since / 0.25) * Math.PI / 2) : -1.6 * Math.max(0, 1 - (since - 0.5) / 2); // vung cần rồi hạ về
        if (U.barrel && e.kind !== 'armor') U.barrel.position.z = since < 0.3 ? -0.25 * (1 - since / 0.3) : 0; // giật lùi
        if (e.kind === 'armor') { g.position.addScaledVector(V.normalize(), Math.sin(t * 0.4 + e.at.x) * 0.6); if (U.barrel) U.barrel.rotation.y = Math.sin(t * 0.7) * 0.3; }
        if (U.rotors) { for (const r of U.rotors) r.rotation.y = t * 30; g.position.y += 5 + Math.sin(t * 2 + e.at.z) * 0.4; g.position.x += Math.sin(t * 0.6 + e.at.x) * 1.5; }
        if (U.core) U.core.scale.setScalar(0.8 + 0.3 * Math.sin(t * 6));
        if (U.fire) U.fire.scale.setScalar(0.8 + 0.25 * Math.sin(t * 9) * Math.sin(t * 5.3));
        if (U.ring) { U.ring.rotation.z = t * 1.5; g.rotation.y += t * 0.0; }
        if (U.dome) { g.scale.setScalar(e.r || 40); U.dome.material.opacity = 0.05 + 0.13 * (e.hp == null ? 1 : e.hp) + 0.03 * Math.sin(t * 2); }
      }
      for (const k in pool) for (let n = used[k] || 0; n < pool[k].length; n++) pool[k][n].visible = false;
    }
    return { update };
  }
  BK.Engines3D = { create };
})(typeof self !== 'undefined' ? self : globalThis);
