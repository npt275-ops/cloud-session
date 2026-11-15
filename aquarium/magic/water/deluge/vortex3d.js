/* Bể Kính · magic/water/deluge/vortex3d.js · Lốc xoáy nước giữa bể (phần hình của Đại hồng thuỷ)
 * Phễu nước xoắn (khối tròn xoay: hẹp ở mặt nước, loe dần lên cao HEIGHT), vệt nước chảy xoắn ốc (magic/water/stream-mat.js),
 * quay quanh trục; chân phễu tung bụi nước xoáy tròn bốc lên, gợn nước quanh chân. Đặt ở giữa bể: chỗ biển xa mọi bờ nhất
 * gần tâm bể (heart). set(k, mựcNước, giây): k 0..1 cỡ lốc xoáy (magic/water/deluge/plan.js vortex); 0 thì ẩn.
 * Cần: three.js, render/magic/vfx.js, magic/water/stream-mat.js, sea3d.js. */
(function (root) {
  const BK = root.BK || (root.BK = {});
  const HEIGHT = 70,
    FOOT_R = 2.2, // bán kính chân phễu
    TOP_R = 22, // bán kính miệng phễu
    SPIN = 1.6, // (vòng quay mỗi giây, tính theo radian / 2π)
    SPRAY = 70; // hạt bụi nước mỗi giây ở chân
  function setup(G) {
    const { THREE, scene } = G;
    const pts = [];
    for (let i = 0; i <= 24; i++) {
      const u = i / 24;
      pts.push(new THREE.Vector2(FOOT_R + (TOP_R - FOOT_R) * Math.pow(u, 1.7), u * HEIGHT));
    }
    const mat = BK.WaterStream.make(THREE, { color: '#7ccfe0', spin: 2.2, speed: 7 }),
      mesh = new THREE.Mesh(new THREE.LatheGeometry(pts, 56), mat);
    mesh.visible = false;
    mesh.frustumCulled = false;
    mesh.renderOrder = 5;
    scene.add(mesh);
    // chỗ biển xa mọi bờ nhất gần tâm bể
    function heart() {
      let best = [0, 0],
        bd = -1;
      for (let r = 0; r <= 30; r += 3)
        for (let a = 0; a < 6.283; a += 0.26) {
          const x = Math.cos(a) * r,
            z = Math.sin(a) * r;
          let m = 1e9;
          for (const L of G.lands) {
            const dx = x - L.center.x,
              dz = z - L.center.z;
            m = Math.min(m, Math.hypot(dx, dz) - L.rOf(Math.atan2(dz, dx)));
          }
          if (m > bd + 4) {
            bd = m;
            best = [x, z];
          }
          if (r === 0) break;
        }
      return best;
    }
    const st = { at: null, acc: 0, t: 0 },
      p = new THREE.Vector3(),
      v = new THREE.Vector3();
    function set(k, y, sec) {
      if (!st.at) st.at = heart();
      mesh.visible = k > 0.01;
      if (!mesh.visible) return;
      st.t += sec;
      mesh.position.set(st.at[0], y - 0.5, st.at[1]);
      mesh.scale.set(0.3 + 0.7 * k, k, 0.3 + 0.7 * k);
      mesh.rotation.y += sec * SPIN * Math.PI * 2 * (0.4 + 0.6 * k);
      mat.uniforms.uT.value = st.t;
      mat.uniforms.uA.value = 0.6 * k;
      st.acc += sec * SPRAY * k;
      for (; st.acc >= 1; st.acc--) {
        const a = Math.random() * Math.PI * 2,
          r = FOOT_R * (1 + Math.random() * 2.5);
        p.set(st.at[0] + Math.cos(a) * r, y + Math.random() * 1.5, st.at[1] + Math.sin(a) * r);
        v.set(-Math.sin(a) * 9, 4 + Math.random() * 8, Math.cos(a) * 9); // (xoáy quanh trục, bốc lên)
        G.vfx.spawn('soft', p, v, { life: 1.4, size: [0.6, 2.2], color: ['water.core', 'water.soft'], alpha: 0.55, drag: 0.6, grav: -1 });
      }
      if (G.water && Math.random() < sec * 6) G.water.splash(st.at[0], st.at[1], 3 * k, 0.8 * k);
    }
    G.vortex3d = { set, heart: () => st.at || (st.at = heart()) };
  }
  BK.Vortex3D = { setup, HEIGHT };
})(typeof self !== 'undefined' ? self : globalThis);
