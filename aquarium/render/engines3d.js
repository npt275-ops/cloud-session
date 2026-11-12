/* Bể Kính · render/engines3d.js · Máy công thành, trại vây, cổng dịch chuyển, lá chắn (design/chien-tranh-thinh-vuong.md mục 1, 2)
 * Mỗi khung hình game/cities.js đưa vào danh sách những thứ cần vẽ ở đảo đang có trận (toạ độ thế giới):
 *   { kind: 'catapult' | 'cannon' | 'artillery' | 'armor' | 'drone' | 'plasma', at, face, color } máy công thành của bên đánh,
 *       đứng ngoài cổng, quay về cổng; máy bắn đá vung cần, đại bác, pháo giật lùi khi bắn, xe bọc thép nhích tới lui, drone
 *       bay lượn trên cổng, pháo plasma: vòng từ trường chạy dọc nòng, lõi loé khi bắn, khe tản nhiệt sáng. fired(k): máy k vừa bắn (cho hoạt cảnh giật, vung)
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
    const glow = (c, op) =>
      new THREE.MeshBasicMaterial({
        color: c,
        transparent: true,
        opacity: op == null ? 0.85 : op,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
    const box = (w, h, d) => new THREE.BoxGeometry(w, h, d),
      cyl = (r1, r2, h, n) => new THREE.CylinderGeometry(r1, r2, h, n || 8);
    const M = {
      wood: std('#7a5534'),
      dark: std('#3a2a1c'),
      iron: std('#3b3f45', { metalness: 0.5 }),
      steel: std('#6f7780', { metalness: 0.6 }),
      olive: std('#5d6b48'),
      white: std('#e9ecef', { metalness: 0.3 }),
      tent: std('#d9cdb2'),
      stone: std('#8f8a80'),
      tire: std('#1f1f22'),
      tread: std('#2b2c2e', { metalness: 0.3 }),
      rope: std('#b89a68'),
      gun: std('#4a4f57', { metalness: 0.55, roughness: 0.45 }),
    };
    const add = (g, geo, m, x, y, z, rx, ry, rz) => {
      const me = new THREE.Mesh(geo, m);
      me.position.set(x || 0, y || 0, z || 0);
      me.rotation.set(rx || 0, ry || 0, rz || 0);
      g.add(me);
      return me;
    };
    // bánh xe có vành, nan hoa (gỗ thời đầu) hay lốp cao su có mâm (thời sau); trục nằm ngang theo x
    function wheel(g, x, y, z, r, kind) {
      const w = new THREE.Group();
      w.position.set(x, y, z);
      g.add(w);
      if (kind === 'tire') {
        add(w, cyl(r, r, 0.32, 16), M.tire, 0, 0, 0, 0, 0, Math.PI / 2);
        add(w, cyl(r * 0.55, r * 0.55, 0.34, 10), M.steel, 0, 0, 0, 0, 0, Math.PI / 2);
      } else {
        add(w, new THREE.TorusGeometry(r, r * 0.12, 6, 16), M.dark, 0, 0, 0, 0, Math.PI / 2, 0);
        add(w, cyl(r * 0.18, r * 0.18, 0.22, 8), M.iron, 0, 0, 0, 0, 0, Math.PI / 2);
        for (let k = 0; k < 6; k++) add(w, box(0.06, r * 1.9, 0.06), M.wood, 0, 0, 0, (k * Math.PI) / 6, 0, 0);
      }
      return w;
    }
    // xích xe: dải xích, bánh chịu lực, bánh dẫn
    function track(g, x, len) {
      add(g, box(0.42, 0.62, len), M.tread, x, 0.36, 0);
      for (let k = 0; k < 5; k++)
        add(g, cyl(0.24, 0.24, 0.46, 10), M.iron, x, 0.3, -len / 2 + 0.35 + (k * (len - 0.7)) / 4, 0, 0, Math.PI / 2);
      add(g, box(0.5, 0.08, len + 0.1), M.olive, x, 0.7, 0);
    }
    const BUILD = {
      // máy bắn đá: khung gỗ có thanh giằng chéo, cần dài có túi đá và đối trọng, bốn bánh nan hoa
      catapult: () => {
        const g = new THREE.Group();
        add(g, box(1.6, 0.22, 2.6), M.wood, 0, 0.55, 0);
        for (const x of [-0.7, 0.7]) add(g, box(0.16, 0.16, 2.8), M.dark, x, 0.45, 0);
        for (const x of [-0.6, 0.6]) {
          add(g, box(0.18, 1.7, 0.18), M.wood, x, 1.4, 0.2);
          add(g, box(0.12, 1.5, 0.12), M.wood, x, 1.15, -0.45, 0.6, 0, 0);
        }
        add(g, box(1.4, 0.18, 0.18), M.wood, 0, 2.2, 0.2);
        add(g, box(1.3, 0.12, 0.12), M.dark, 0, 1.1, 0.2);
        const arm = new THREE.Group();
        arm.position.set(0, 1.3, 0.2);
        add(arm, box(0.16, 0.16, 2.8), M.dark, 0, 0, -0.9);
        add(arm, box(0.55, 0.6, 0.55), M.stone, 0, -0.25, 0.55);
        add(arm, box(0.5, 0.12, 0.5), M.rope, 0, 0.05, -2.2);
        add(arm, new THREE.SphereGeometry(0.22, 8, 6), M.stone, 0, 0.28, -2.2);
        g.add(arm);
        g.userData.arm = arm;
        for (const [x, z] of [
          [-0.86, -1],
          [0.86, -1],
          [-0.86, 1],
          [0.86, 1],
        ])
          wheel(g, x, 0.42, z, 0.4);
        return g;
      },
      // đại bác: nòng gang có vành, đặt trên giá gỗ có càng kéo, hai bánh nan hoa lớn
      cannon: () => {
        const g = new THREE.Group();
        const b = new THREE.Group();
        b.position.set(0, 0.95, 0.1);
        b.rotation.x = -0.15;
        g.add(b);
        g.userData.barrel = b;
        add(b, cyl(0.15, 0.25, 2.0, 12), M.iron, 0, 0, 0.6, Math.PI / 2);
        for (const z of [-0.25, 0.5, 1.45]) add(b, cyl(0.27, 0.27, 0.1, 12), M.iron, 0, 0, z, Math.PI / 2);
        add(b, new THREE.SphereGeometry(0.2, 10, 8), M.iron, 0, 0, -0.45);
        add(g, box(0.55, 0.32, 1.2), M.wood, 0, 0.72, -0.05);
        add(g, box(0.3, 0.2, 1.6), M.wood, 0, 0.35, -1.05, -0.35, 0, 0);
        for (const x of [-0.42, 0.42]) wheel(g, x, 0.62, 0.05, 0.6);
        return g;
      },
      // pháo dã chiến: lá chắn thép, nòng dài có chống giật, hai càng xoè, bánh lốp
      artillery: () => {
        const g = new THREE.Group();
        const b = new THREE.Group();
        b.position.set(0, 1.05, 0.2);
        b.rotation.x = -0.2;
        g.add(b);
        g.userData.barrel = b;
        add(b, cyl(0.1, 0.13, 2.8, 12), M.olive, 0, 0, 1.0, Math.PI / 2);
        add(b, cyl(0.17, 0.17, 0.35, 10), M.iron, 0, 0, 2.45, Math.PI / 2);
        add(b, box(0.32, 0.3, 1.1), M.olive, 0, -0.18, 0.1);
        add(g, box(1.5, 1.0, 0.08), M.olive, 0, 1.1, 0.55, -0.12, 0, 0);
        for (const sx of [-1, 1]) add(g, box(0.16, 0.14, 2.2), M.olive, sx * 0.45, 0.35, -1.0, -0.12, sx * 0.3, 0);
        add(g, box(0.9, 0.18, 0.4), M.iron, 0, 0.62, 0.1);
        for (const x of [-0.72, 0.72]) wheel(g, x, 0.55, 0.1, 0.52, 'tire');
        return g;
      },
      // xe bọc thép: thân vát trước, hai dải xích có bánh, tháp pháo có mặt nạ nòng, nòng có hãm thanh, nắp tháp, súng máy
      armor: () => {
        const g = new THREE.Group();
        add(g, box(1.7, 0.6, 2.9), M.olive, 0, 0.85, -0.05);
        add(g, box(1.7, 0.42, 0.7), M.olive, 0, 0.78, 1.5, -0.5, 0, 0);
        add(g, box(1.6, 0.2, 0.5), M.olive, 0, 1.12, -1.4);
        track(g, -1.0, 3.3);
        track(g, 1.0, 3.3);
        const tur = new THREE.Group();
        tur.position.set(0, 1.4, -0.25);
        g.add(tur);
        g.userData.barrel = tur;
        add(tur, cyl(0.62, 0.72, 0.5, 8), M.olive, 0, 0, 0);
        add(tur, box(0.5, 0.36, 0.3), M.olive, 0, 0.02, 0.72);
        add(tur, cyl(0.075, 0.09, 2.2, 10), M.iron, 0, 0.05, 1.85, Math.PI / 2);
        add(tur, cyl(0.12, 0.12, 0.3, 10), M.iron, 0, 0.05, 2.95, Math.PI / 2);
        add(tur, cyl(0.2, 0.2, 0.1, 10), M.iron, 0.25, 0.3, -0.15);
        add(tur, box(0.05, 0.05, 0.6), M.iron, -0.3, 0.32, 0.1);
        return g;
      },
      // drone: thân khí động, bốn cần có vòng bảo vệ cánh quạt, cánh quạt quay, máy ảnh treo dưới bụng, đèn nhấp nháy
      drone: () => {
        const g = new THREE.Group();
        add(g, new THREE.SphereGeometry(0.42, 12, 8), M.white, 0, 0, 0, 0, 0, 0).scale.set(1, 0.45, 1.5);
        const rotors = [];
        for (const [x, z] of [
          [-0.75, -0.75],
          [0.75, -0.75],
          [-0.75, 0.75],
          [0.75, 0.75],
        ]) {
          add(g, box(0.08, 0.06, 1.06), M.steel, x / 2, 0, z / 2, 0, Math.atan2(x, z), 0);
          add(g, new THREE.TorusGeometry(0.36, 0.04, 6, 18), M.dark, x, 0.05, z, Math.PI / 2, 0, 0);
          const r = new THREE.Group();
          r.position.set(x, 0.08, z);
          add(r, box(0.62, 0.02, 0.07), M.dark, 0, 0, 0);
          add(r, box(0.07, 0.02, 0.62), M.dark, 0, 0, 0);
          g.add(r);
          rotors.push(r);
        }
        add(g, new THREE.SphereGeometry(0.13, 10, 8), M.dark, 0, -0.22, 0.35);
        add(g, new THREE.SphereGeometry(0.06, 8, 6), glow('#ff5050', 1), 0, 0.12, -0.55);
        g.userData.rotors = rotors;
        return g;
      },
      // pháo plasma: bệ giáp trên hai dải xích, vòng quay tháp, tháp góc cạnh có lỗ tản nhiệt sáng, nòng dài nhiều đoạn quấn vòng
      // từ trường phát sáng, đầu phát có lõi năng lượng; cáp dẫn từ khối nguồn sau tháp
      plasma: () => {
        const g = new THREE.Group();
        track(g, -1.05, 3.0);
        track(g, 1.05, 3.0);
        add(g, box(1.8, 0.55, 2.8), M.gun, 0, 0.9, 0);
        add(g, box(1.8, 0.36, 0.6), M.gun, 0, 0.82, 1.55, -0.45, 0, 0);
        const ring = add(g, cyl(0.8, 0.85, 0.16, 16), M.steel, 0, 1.24, -0.1);
        const b = new THREE.Group();
        b.position.set(0, 1.62, -0.1);
        g.add(b);
        g.userData.barrel = b;
        add(b, box(1.25, 0.6, 1.5), M.white, 0, 0, -0.1);
        add(b, box(1.0, 0.3, 0.6), M.white, 0, 0.42, -0.35);
        add(b, box(0.7, 0.5, 0.5), M.gun, 0, 0.05, -1.0);
        const vents = [];
        for (const sx of [-1, 1]) vents.push(add(b, box(0.04, 0.26, 0.9), glow('#5ff0ff', 0.7), sx * 0.64, 0, -0.1));
        add(b, cyl(0.16, 0.2, 2.4, 12), M.gun, 0, 0, 1.75, Math.PI / 2);
        const coils = [];
        for (let k = 0; k < 4; k++)
          coils.push(add(b, new THREE.TorusGeometry(0.27, 0.07, 8, 18), glow('#7af7ff', 0.85), 0, 0, 1.0 + k * 0.42, 0, 0, 0));
        add(b, cyl(0.28, 0.22, 0.4, 12), M.steel, 0, 0, 3.0, Math.PI / 2);
        const core = add(b, new THREE.SphereGeometry(0.22, 14, 10), glow('#b8fbff', 1), 0, 0, 3.25);
        add(b, new THREE.TorusGeometry(0.3, 0.05, 6, 16), M.dark, 0.0, -0.25, -0.75, Math.PI / 2, 0, 0);
        g.userData.core = core;
        g.userData.coils = coils;
        g.userData.vents = vents;
        g.userData.ring = null;
        return g;
      },
      tent: () => {
        const g = new THREE.Group();
        add(g, new THREE.ConeGeometry(1.3, 1.8, 6), M.tent, 0, 0.9, 0);
        add(g, new THREE.ConeGeometry(1.0, 1.5, 6), M.tent, 2.6, 0.75, 1.0);
        add(g, new THREE.SphereGeometry(0.3, 8, 6), glow('#ff9a2e'), 1.3, 0.3, -1.6);
        for (let k = 0; k < 5; k++)
          add(g, cyl(0.06, 0.06, 0.8), M.dark, 1.3 + Math.cos(k) * 0.3, 0.12, -1.6 + Math.sin(k) * 0.3, Math.PI / 2, k);
        g.userData.fire = g.children[2];
        return g;
      },
      portal: () => {
        const g = new THREE.Group();
        const ring = add(g, new THREE.TorusGeometry(1.6, 0.18, 10, 32), glow('#c38bff'), 0, 1.8, 0);
        add(g, new THREE.CircleGeometry(1.5, 32), glow('#6a3bff', 0.35), 0, 1.8, 0);
        g.userData.ring = ring;
        return g;
      },
      shield: () => {
        const g = new THREE.Group();
        const d = add(
          g,
          new THREE.SphereGeometry(1, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2),
          new THREE.MeshBasicMaterial({
            color: '#7fe8ff',
            transparent: true,
            opacity: 0.16,
            depthWrite: false,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending,
          }),
        );
        g.userData.dome = d;
        return g;
      },
    };
    const pool = {},
      used = {};
    function take(kind) {
      const P = pool[kind] || (pool[kind] = []);
      used[kind] = used[kind] || 0;
      if (used[kind] >= P.length) {
        const g = BUILD[kind]();
        g.name = 'engine:' + kind;
        scene.add(g);
        P.push(g);
      }
      const g = P[used[kind]++];
      g.visible = true;
      return g;
    }
    const V = new THREE.Vector3();
    // list: [{ kind, at, face, shot (thời điểm phát bắn gần nhất, giây), hp, r }]; t: giây
    function update(list, t) {
      for (const k in used) used[k] = 0;
      for (const e of list) {
        if (!BUILD[e.kind]) continue;
        const g = take(e.kind),
          U = g.userData,
          since = e.shot != null ? t - e.shot : 9;
        g.position.copy(e.at);
        if (BK.groundAt) g.position.y = Math.max(e.at.y, BK.groundAt(e.at.x, e.at.z));
        if (e.face) {
          V.copy(e.face).sub(e.at);
          g.rotation.y = Math.atan2(V.x, V.z);
        }
        if (U.arm)
          U.arm.rotation.x =
            since < 0.5 ? -1.6 * Math.sin((Math.min(1, since / 0.25) * Math.PI) / 2) : -1.6 * Math.max(0, 1 - (since - 0.5) / 2); // vung cần rồi hạ về
        if (U.barrel && e.kind !== 'armor') {
          if (U.bz == null) U.bz = U.barrel.position.z;
          U.barrel.position.z = U.bz - (since < 0.3 ? 0.25 * (1 - since / 0.3) : 0);
        } // giật lùi
        if (e.kind === 'armor') {
          g.position.addScaledVector(V.normalize(), Math.sin(t * 0.4 + e.at.x) * 0.6);
          if (U.barrel) U.barrel.rotation.y = Math.sin(t * 0.7) * 0.3;
        }
        if (U.rotors) {
          for (const r of U.rotors) r.rotation.y = t * 30;
          g.position.y += 5 + Math.sin(t * 2 + e.at.z) * 0.4;
          g.position.x += Math.sin(t * 0.6 + e.at.x) * 1.5;
        }
        if (U.core) U.core.scale.setScalar(0.8 + 0.3 * Math.sin(t * 6) + (since < 0.4 ? 0.9 * (1 - since / 0.4) : 0)); // vừa bắn: lõi loé to
        if (U.coils)
          U.coils.forEach((c, k) => {
            c.material.opacity = 0.35 + 0.5 * Math.max(0, Math.sin(t * 7 - k * 0.9)) + (since < 0.5 ? 0.4 : 0);
          }); // từ trường chạy dọc nòng
        if (U.vents) for (const v of U.vents) v.material.opacity = 0.35 + 0.35 * Math.sin(t * 3) + (since < 1 ? 0.3 * (1 - since) : 0);
        if (U.fire) U.fire.scale.setScalar(0.8 + 0.25 * Math.sin(t * 9) * Math.sin(t * 5.3));
        if (U.ring) {
          U.ring.rotation.z = t * 1.5;
          g.rotation.y += t * 0.0;
        }
        if (U.dome) {
          g.scale.setScalar(e.r || 40);
          U.dome.material.opacity = 0.05 + 0.13 * (e.hp == null ? 1 : e.hp) + 0.03 * Math.sin(t * 2);
        }
      }
      for (const k in pool) for (let n = used[k] || 0; n < pool[k].length; n++) pool[k][n].visible = false;
    }
    return { update };
  }
  BK.Engines3D = { create };
})(typeof self !== 'undefined' ? self : globalThis);
