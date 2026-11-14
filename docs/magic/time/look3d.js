/* Bể Kính · magic/time/look3d.js · Hình ảnh của phép thời gian (design/ke-hoach-buoc-37.md)
 * Chỉ vẽ (điều khiển ở magic/time/cast.js gọi setup; công thức hạt magic/time/recipes.js). Màu theo bảng màu chung.
 *   stopOn(chỗ)   dừng thời gian: vòng phù chú đồng hồ cát lớn dưới chân, sóng lan trên đất, MOTES hạt bụi vàng lơ lửng đứng im
 *                 quanh người (đứng im giữa không trung suốt lúc thời gian dừng)
 *   stopOff(chỗ)  thời gian chạy tiếp: sóng lan, bụi tan
 *   fast(chỗ, giây)  tua nhanh: vệt sáng xoáy quanh người, phù chú dưới chân quay nhanh
 *   back(chỗ, giây)  tua lùi: hạt nâu vàng bay ngược vào người, phù chú dưới chân quay ngược
 *   step(chỗ)     mỗi nấc tua lùi: chớp nhỏ, vòng sóng
 * Cần: three.js, render/magic/vfx.js, render/style/palette.js. */
(function (root) {
  const BK = root.BK || (root.BK = {});
  const MOTES = 160, // hạt bụi đứng im khi dừng thời gian
    MOTE_R = 9, // (đơn vị đảo) bán kính vùng bụi quanh người
    SIGIL_EVERY = 0.55; // (giây) đặt lại phù chú dưới chân khi đang giữ phép
  function setup(G) {
    const { THREE } = G;
    const p = new THREE.Vector3(),
      v = new THREE.Vector3(),
      ZERO = new THREE.Vector3();
    const st = { sig: 0, acc: 0 };
    function stopOn(at) {
      G.vfx.play('timeWave', at);
      G.vfx.sigil('time', at, null, { size: 6, life: 1.6, spin: 0.6 });
      for (let k = 0; k < MOTES; k++) {
        const a = Math.random() * Math.PI * 2,
          r = Math.sqrt(Math.random()) * MOTE_R;
        p.set(at.x + Math.cos(a) * r, at.y + 0.2 + Math.random() * 3.2, at.z + Math.sin(a) * r);
        G.vfx.spawn(Math.random() < 0.35 ? 'glow' : 'soft', p, ZERO, {
          life: 9,
          size: [0.05 + Math.random() * 0.09, 0.04],
          color: Math.random() < 0.5 ? 'time.core' : 'time.soft',
          alpha: 0.75,
        });
      }
    }
    function stopOff(at) {
      G.vfx.play('timeWave', at, { scale: 0.7 });
    }
    // phù chú dưới chân, đặt lại theo nhịp khi đang giữ phép (spin âm: quay ngược)
    function feetSigil(at, sec, spin) {
      st.sig -= sec;
      if (st.sig > 0) return;
      st.sig = SIGIL_EVERY;
      G.vfx.sigil('time', at, null, { size: 3.2, life: SIGIL_EVERY * 1.5, spin });
    }
    function fast(at, sec) {
      feetSigil(at, sec, 9);
      st.acc += sec * 90;
      for (; st.acc >= 1; st.acc--) {
        const a = Math.random() * Math.PI * 2,
          r = 1.4 + Math.random() * 2.5;
        p.set(at.x + Math.cos(a) * r, at.y + 0.3 + Math.random() * 2, at.z + Math.sin(a) * r);
        v.set(-Math.sin(a), 0.2, Math.cos(a)).multiplyScalar(7 + Math.random() * 5); // (xoáy quanh người)
        G.vfx.spawn('glow', p, v, { life: 0.35, size: [0.14, 0.02], color: ['time.core', 'time.mid'], drag: 1 });
      }
    }
    function back(at, sec) {
      feetSigil(at, sec, -7);
      st.acc += sec * 70;
      for (; st.acc >= 1; st.acc--) {
        const a = Math.random() * Math.PI * 2,
          r = 5 + Math.random() * 3;
        p.set(at.x + Math.cos(a) * r, at.y + 0.3 + Math.random() * 2.4, at.z + Math.sin(a) * r);
        v.set(at.x - p.x, at.y + 1 - p.y, at.z - p.z).multiplyScalar(1.6); // (bay ngược vào người)
        G.vfx.spawn(Math.random() < 0.5 ? 'glow' : 'soft', p, v, { life: 0.6, size: [0.16, 0.04], color: ['#ffe2b0', '#b08a5a'], alpha: 0.8 });
      }
    }
    const step = (at) => G.vfx.play('timeStep', at);
    G.time3d = { stopOn, stopOff, fast, back, step };
  }
  BK.Time3D = { setup, MOTES };
})(typeof self !== 'undefined' ? self : globalThis);
