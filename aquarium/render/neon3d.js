/* Bể Kính · render/neon3d.js · Mặt trời nhân tạo của thành phố neon (từ thời 10)
 * Khi bất kỳ đảo nào tới thời 10, mặt trời thật tắt: trên trời chỉ còn một đĩa đen viền lửa hồng tím (mặt trời đã mất), trời tím không còn
 * ngày đêm (render/sky3d.js, render/mood3d.js NEON). Mỗi đảo tự treo một mặt trời nhân tạo trên thành phố của mình, rọi
 * thẳng xuống: lõi sáng, quầng sáng, cột sáng hình nón chiếu xuống thành phố, một đèn điểm (không đổ bóng) tô màu cả đảo.
 * Sáu đảo sáu dáng mặt trời, màu theo render/build/neon.js PAL:
 *   plains   Lúa Vàng    Mặt Trời Hồn Lúa: lõi vàng trong ba vòng con quay xoay ba trục, vòng hạt lúa quay quanh
 *   forest   Thông Xanh  Mặt Trời Hạt Giống: lõi xanh lá ôm bởi tám cánh lá khép mở như hoa thở
 *   mountain Đá Mây      Mặt Trời Lò Rèn: lõi đa diện cam đỏ, mười hai mảnh đá nóng chảy bay quanh quỹ đạo nghiêng
 *   tundra   Tuyết Trắng Mặt Trời Băng Lăng Trụ: lăng trụ băng xanh, vầng hào quang phẳng có bốn mặt trời giả (sundog)
 *   coast    Cửa Sóng    Mặt Trời Sứa: vòm sứa phát sáng, mười hai xúc tu ánh sáng đung đưa rủ xuống
 *   desert   Cát Hồng    Mặt Trời Hai Vành: cầu hồng có hai vành rộng bắt chéo, khung bát diện vàng quay ngược
 * Cấp 10, 11, 12 mặt trời lớn dần (SCALE). update(dt, t) mỗi khung hình: mặt trời của đảo bật khi đảo đó tới thời 10; mặt trời
 * thật tắt khi bất kỳ đảo nào tới thời 10; cho các phần quay, thở.
 * Cần: render/build/neon.js (BK.Neon3D), render/sky3d.js (G.glowTex dùng chung), lands3d (G.lands3d.lands). */
(function (root) {
  const BK = root.BK || (root.BK = {});
  const H = 64;                                  // độ cao treo mặt trời trên tâm đảo
  const LIGHT = 0.9;                             // độ mạnh đèn điểm của mặt trời nhân tạo (tắt dần theo khoảng cách, tới 135)
  const SCALE = { 10: 0.8, 11: 1.0, 12: 1.25 };
  const NAME = { plains: 'Mặt Trời Hồn Lúa', forest: 'Mặt Trời Hạt Giống', mountain: 'Mặt Trời Lò Rèn', tundra: 'Mặt Trời Băng Lăng Trụ', coast: 'Mặt Trời Sứa', desert: 'Mặt Trời Hai Vành' };
  function setup(G) {
    const { THREE, scene, camera, glowTex } = G, N = BK.Neon3D;
    const basic = (c, o) => new THREE.MeshBasicMaterial(Object.assign({ color: c, fog: false }, o || {}));
    const add = (o) => new THREE.MeshBasicMaterial(Object.assign({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }, o));
    const halo = (c, s, op) => { const h = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: c, transparent: true, opacity: op, depthWrite: false, blending: THREE.AdditiveBlending, fog: false })); h.scale.setScalar(s); return h; };
    // phần riêng của từng đảo: dựng vào nhóm g, trả hàm chuyển động (ts: giây)
    const DESIGN = {
      plains(g, c) {
        g.add(new THREE.Mesh(new THREE.IcosahedronGeometry(4.2, 2), basic(c.sun)));
        const rings = [7, 8.6, 10.2].map((r, i) => { const m = new THREE.Mesh(new THREE.TorusGeometry(r, 0.4, 6, 64), basic(i === 1 ? c.b : c.a)); g.add(m); return m; });
        const grain = new THREE.Group(); for (let i = 0; i < 18; i++) { const a = (i / 18) * Math.PI * 2, m = new THREE.Mesh(new THREE.OctahedronGeometry(0.55, 0), basic(c.a)); m.position.set(Math.cos(a) * 13, Math.sin(a * 3) * 1.2, Math.sin(a) * 13); m.scale.set(0.6, 1.6, 0.6); grain.add(m); } g.add(grain);
        return (ts) => { rings[0].rotation.set(ts * 0.5, ts * 0.2, 0); rings[1].rotation.set(Math.PI / 2, ts * 0.35, ts * 0.15); rings[2].rotation.set(ts * 0.12, 0, Math.PI / 3 + ts * 0.4); grain.rotation.y = -ts * 0.18; };
      },
      forest(g, c) {
        g.add(new THREE.Mesh(new THREE.IcosahedronGeometry(4, 2), basic(c.sun)));
        const petals = []; for (let i = 0; i < 8; i++) { const piv = new THREE.Group(), m = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 8), basic(i % 2 ? c.a : c.b)); m.scale.set(2.2, 0.35, 6); m.position.z = 6.5; piv.add(m); piv.rotation.y = (i / 8) * Math.PI * 2; g.add(piv); petals.push(piv); }
        const seeds = new THREE.Group(); for (let i = 0; i < 24; i++) { const a = i * 2.4, r = 9 + (i % 5), m = new THREE.Mesh(new THREE.SphereGeometry(0.35, 6, 4), basic(c.a)); m.position.set(Math.cos(a) * r, -3 - (i % 7) * 2.2, Math.sin(a) * r); seeds.add(m); } g.add(seeds);
        return (ts) => { const open = 0.35 + 0.3 * Math.sin(ts * 0.6); petals.forEach((p, i) => { p.rotation.x = -open; p.rotation.y = (i / 8) * Math.PI * 2 + ts * 0.1; }); seeds.rotation.y = ts * 0.12; seeds.position.y = -((ts * 1.5) % 6); };
      },
      mountain(g, c) {
        const core = new THREE.Mesh(new THREE.IcosahedronGeometry(4.8, 0), basic(c.sun)); g.add(core);
        const inner = new THREE.Mesh(new THREE.IcosahedronGeometry(5.6, 0), add({ color: c.b, opacity: 0.35, wireframe: true })); g.add(inner);
        const orbit = new THREE.Group(); orbit.rotation.z = 0.45; for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2, m = new THREE.Mesh(new THREE.OctahedronGeometry(0.8 + (i % 3) * 0.4, 0), basic(i % 2 ? c.a : c.b)); m.position.set(Math.cos(a) * 11, Math.sin(a * 2) * 1.5, Math.sin(a) * 11); orbit.add(m); } g.add(orbit);
        return (ts) => { core.rotation.set(ts * 0.3, ts * 0.45, 0); inner.rotation.set(-ts * 0.2, -ts * 0.3, 0); orbit.rotation.y = ts * 0.4; orbit.children.forEach((m, i) => { m.rotation.set(ts * (1 + i * 0.1), ts * 0.7, 0); }); };
      },
      tundra(g, c) {
        const core = new THREE.Mesh(new THREE.OctahedronGeometry(4.5, 0), basic(c.sun)); core.scale.set(0.8, 1.7, 0.8); g.add(core);
        const ring = new THREE.Mesh(new THREE.RingGeometry(12, 12.8, 80), add({ color: c.a, opacity: 0.8, side: THREE.DoubleSide })); ring.rotation.x = -Math.PI / 2; g.add(ring);
        const ring2 = new THREE.Mesh(new THREE.RingGeometry(15.5, 15.9, 80), add({ color: c.b, opacity: 0.55, side: THREE.DoubleSide })); ring2.rotation.x = -Math.PI / 2; g.add(ring2);
        const dogs = new THREE.Group(); for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2, m = new THREE.Mesh(new THREE.OctahedronGeometry(1.2, 0), basic(c.a)); m.position.set(Math.cos(a) * 12.4, 0, Math.sin(a) * 12.4); m.scale.set(0.7, 1.4, 0.7); dogs.add(m); } g.add(dogs);
        return (ts) => { core.rotation.y = ts * 0.35; dogs.rotation.y = -ts * 0.15; ring2.rotation.z = ts * 0.05; };
      },
      coast(g, c) {
        const dome = new THREE.Mesh(new THREE.SphereGeometry(6, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), basic(c.sun)); g.add(dome);
        const skirt = new THREE.Mesh(new THREE.TorusGeometry(6, 0.5, 6, 40), basic(c.b)); skirt.rotation.x = Math.PI / 2; g.add(skirt);
        const arms = []; for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2, piv = new THREE.Group(), len = 10 + (i % 3) * 4, m = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.3, len, 5).translate(0, -len / 2, 0), basic(i % 2 ? c.a : c.b)); piv.position.set(Math.cos(a) * 5, 0, Math.sin(a) * 5); piv.add(m); g.add(piv); arms.push(piv); }
        return (ts) => { const s = 1 + 0.08 * Math.sin(ts * 1.2); dome.scale.set(s, 1 / s, s); arms.forEach((p, i) => { p.rotation.x = Math.sin(ts * 0.9 + i) * 0.22; p.rotation.z = Math.cos(ts * 0.7 + i * 1.7) * 0.22; }); g.position.y = g.userData.y0 + Math.sin(ts * 0.6) * 1.5; };
      },
      desert(g, c) {
        g.add(new THREE.Mesh(new THREE.SphereGeometry(4.6, 24, 16), basic(c.sun)));
        const r1 = new THREE.Mesh(new THREE.RingGeometry(7, 10, 64), add({ color: c.a, opacity: 0.75, side: THREE.DoubleSide })), r2 = new THREE.Mesh(new THREE.RingGeometry(11, 12.5, 64), add({ color: c.b, opacity: 0.6, side: THREE.DoubleSide }));
        g.add(r1, r2);
        const frame = new THREE.Mesh(new THREE.OctahedronGeometry(9, 0), add({ color: c.b, opacity: 0.32, wireframe: true })); frame.scale.y = 1.5; g.add(frame);
        return (ts) => { r1.rotation.set(-Math.PI / 2 + 0.5, ts * 0.25, 0); r2.rotation.set(-Math.PI / 2 - 0.45, -ts * 0.2, 0.3); frame.rotation.y = -ts * 0.3; };
      },
    };
    const suns = [];
    for (const L of G.lands3d.lands) {
      const key = DESIGN[L.ter] ? L.ter : 'plains', c = N.of(key), root = new THREE.Group(), g = new THREE.Group();
      root.position.set(L.center.x, 0, L.center.z); root.visible = false; scene.add(root);
      g.position.y = g.userData.y0 = H; root.add(g);
      const anim = DESIGN[key](g, c);
      const h1 = halo(c.sun, 40, 0.55), h2 = halo(c.b, 100, 0.18); g.add(h1, h2);
      // cột sáng nón rọi xuống thành phố
      const beam = new THREE.Mesh(new THREE.CylinderGeometry(4, 40, H, 40, 1, true).translate(0, H / 2, 0), add({ color: c.sun, opacity: 0.06, side: THREE.DoubleSide }));
      root.add(beam);
      // vòng sáng trên mặt đất dưới mặt trời
      const pool = new THREE.Mesh(new THREE.RingGeometry(36, 40, 72).rotateX(-Math.PI / 2), add({ color: c.a, opacity: 0.07, side: THREE.DoubleSide })); pool.position.y = 0.4; root.add(pool);
      const light = new THREE.PointLight(c.sun, LIGHT, 135, 1.5); light.position.y = H - 6; root.add(light);
      suns.push({ root, g, anim, h1, h2, beam, light, key, ph: suns.length * 1.3 });
    }
    // mặt trời đã mất: đĩa đen, viền lửa hồng, quầng tím mờ (thay trăng trên trời)
    const dead = new THREE.Group(); dead.visible = false; scene.add(dead);
    const disc = new THREE.Mesh(new THREE.CircleGeometry(62, 48), basic('#07040e', { depthWrite: false })), rim = new THREE.Mesh(new THREE.RingGeometry(61, 67, 64), add({ color: '#ff4fd8', opacity: 0.85 }));
    const cor = halo('#a040ff', 420, 0.3); disc.renderOrder = rim.renderOrder = cor.renderOrder = -1; dead.add(cor, disc, rim); rim.position.z = 0.1;
    const DEAD_AT = new THREE.Vector3(-0.42, 0.34, -0.84).normalize().multiplyScalar(1500);
    // mỗi đảo một mặt trời, bật khi chính đảo đó tới thời 10 (G.levelOf(i)); mặt trời thật tắt (đĩa đen trên trời) khi bất kỳ đảo nào
    // đã tới thời 10 (G.skyLevel: cấp cao nhất trong các đảo, game/cities.js)
    function update(dt, t) {
      const ts = t * 0.001;
      suns.forEach((S, i) => { const lv = G.levelOf ? G.levelOf(i) : G.level || 0; if (lv !== S.lv) { S.lv = lv; S.root.visible = N.on(lv); S.g.scale.setScalar(SCALE[lv] || 1); } });
      dead.visible = N.on(G.skyLevel != null ? G.skyLevel : G.level || 0);
      for (const S of suns) {
        if (!S.root.visible) continue;
        S.anim(ts); const br = 0.92 + 0.08 * Math.sin(ts * 1.3 + S.ph);
        S.h1.material.opacity = 0.5 * br; S.h2.material.opacity = 0.16 + 0.04 * Math.sin(ts * 0.5 + S.ph); S.light.intensity = LIGHT * br; S.beam.material.opacity = 0.03 + 0.01 * Math.sin(ts * 0.8 + S.ph);
      }
      if (dead.visible) { dead.position.copy(camera.position).add(DEAD_AT); dead.lookAt(camera.position); rim.rotation.z = ts * 0.05; }
    }
    G.neonCity = { update, suns, NAME };
  }
  BK.NeonCity3D = { setup, NAME, H };
})(typeof self !== 'undefined' ? self : globalThis);
