/* Bể Kính · render/fx/soul-fx.js · Hạt và âm thanh theo từng pha của cú nhập hồn (design/ke-hoach-buoc-32.md mục 2)
 * game/possess.js gọi G.soulFx.phase(tên pha) khi đổi pha và G.soulFx.update(giây, trạng thái) mỗi khung hình:
 *   wind   gió hút, tai bắt đầu ù (bịt bớt âm cao)
 *   dive   vệt gió bay ngược về phía máy quay, dày và dài theo tốc độ; gió rít to dần; tiếng gõ kính khi xuyên vòm
 *   hit    tiếng trầm, bịt tai hẳn; vòng bụi toả ra trên mặt đất quanh chân người
 *   wake   hai nhịp tim, tai mở dần
 *   in     bụi lơ lửng quanh máy quay (bắt nắng); chạy thì bụi tung dưới chân
 *   leave  gió vút, tai mở hết
 * Không đổi máy quay, không đổi người. Cần: render/fx/particles3d.js (G.particles), render/fx/soul-audio.js, game/possess.js.
 */
(function (root) {
  const BK = root.BK || (root.BK = {});
  // màu bụi theo miền của đảo
  const DUST = { plains: '#b49a70', forest: '#8a7a58', mountain: '#a39d90', tundra: '#e8f0f4', coast: '#e6d4a8', desert: '#e3b58e' };
  function setup(G) {
    const { THREE, camera } = G;
    const A = BK.SoulAudio.create(G),
      Pt = () => G.particles;
    const v = new THREE.Vector3(),
      d = new THREE.Vector3(),
      r = new THREE.Vector3(),
      u = new THREE.Vector3();
    let rang = false,
      motesT = 0,
      stepT = 0;
    const isleKey = (st) => (G.lands[st.i] ? G.lands[st.i].ter : 'plains');
    function phase(ph) {
      const au = G.audio;
      if (ph === 'wind') {
        rang = false;
        A.suck();
        if (au && au.muffle) au.muffle(2400, 0.3);
      } else if (ph === 'hit') {
        A.roar(0);
        A.thump();
        if (au && au.muffle) au.muffle(260, 0.03);
        ring(G.possess.st);
      } else if (ph === 'wake') {
        A.heart(2);
        if (au && au.muffle) au.muffle(20000, 0.5);
      } else if (ph === 'leave') {
        if (au && au.whoosh) au.whoosh();
        if (au && au.muffle) au.muffle(20000, 0.2);
      } else if (ph === 'off') {
        A.roar(0);
        if (au && au.muffle) au.muffle(20000, 0.1);
      }
    }
    // vòng bụi khi chạm: hạt toả ra từ chân người, sát đất, hãm dần, rơi xuống
    function ring(st) {
      const f = G.villageOf(st.i).folk(st.id);
      if (!f || !f.rig || !Pt()) return;
      const feet = f.rig.root.position,
        col = DUST[isleKey(st)] || DUST.plains;
      for (let k = 0; k < 90; k++) {
        const a = (k / 90) * Math.PI * 2 + Math.random() * 0.1,
          sp = 3.5 + Math.random() * 3;
        Pt().emit({
          p: v.set(feet.x + Math.cos(a) * 0.4, feet.y + 0.1, feet.z + Math.sin(a) * 0.4),
          v: d.set(Math.cos(a) * sp, 0.6 + Math.random() * 1.2, Math.sin(a) * sp),
          life: 0.9 + Math.random() * 0.6,
          size: 0.28 + Math.random() * 0.2,
          grow: 2.2,
          drag: 2.6,
          grav: 1.6,
          alpha: 0.55,
          color: col,
        });
      }
    }
    function update(sec, st) {
      const P = Pt();
      if (!P) return;
      const T = G.possess.T;
      if (st.phase === 'dive') {
        const k = Math.min(1, st.t / T.dive),
          speed = (4 * Math.exp(4 * k)) / (Math.exp(4) - 1) / 4; // (như đường lao của game/possess.js)
        A.roar(Math.min(1, speed * 1.1));
        if (!rang && G.post.fx.ring > 0.02) {
          rang = true;
          A.ting();
        }
        // vệt gió: rải trong ống quanh trục nhìn, phía trước máy quay, bay ngược về phía máy quay
        camera.getWorldDirection(d);
        r.set(1, 0, 0).applyQuaternion(camera.quaternion);
        u.set(0, 1, 0).applyQuaternion(camera.quaternion);
        const n = Math.round(2 + 10 * speed);
        for (let i = 0; i < n; i++) {
          const a = Math.random() * Math.PI * 2,
            rad = 1.2 + Math.random() * 5,
            dist = 6 + Math.random() * 26;
          v.copy(camera.position).addScaledVector(d, dist).addScaledVector(r, Math.cos(a) * rad).addScaledVector(u, Math.sin(a) * rad);
          P.streak({
            p: v,
            v: d.clone().multiplyScalar(-60 * (0.3 + speed)),
            dir: d.clone().negate(),
            len: 1.5 + 6 * speed,
            life: 0.25 + Math.random() * 0.2,
            color: '#dfeeff',
          });
        }
      }
      if (st.phase === 'in' || st.phase === 'wake') {
        // bụi lơ lửng quanh máy quay (bắt nắng): ít, chậm, sống lâu
        motesT -= sec;
        while (motesT < 0) {
          motesT += 0.09;
          camera.getWorldDirection(d);
          v.copy(camera.position)
            .addScaledVector(d, 1.5 + Math.random() * 6)
            .add(r.set((Math.random() - 0.5) * 7, (Math.random() - 0.4) * 2.5, (Math.random() - 0.5) * 7));
          P.emit({
            p: v,
            v: d.set((Math.random() - 0.5) * 0.12, 0.03 + Math.random() * 0.05, (Math.random() - 0.5) * 0.12),
            life: 5 + Math.random() * 3,
            size: 0.035 + Math.random() * 0.03,
            alpha: 0.55,
            color: '#fff4dc',
          });
        }
        // chạy: bụi tung sau gót, mỗi bước một nhúm
        const f = G.villageOf(st.i).folk(st.id);
        if (f && f.moving && st.run) {
          stepT -= sec;
          if (stepT < 0) {
            stepT = 0.28;
            const feet = f.rig.root.position,
              col = DUST[isleKey(st)] || DUST.plains;
            for (let k = 0; k < 5; k++)
              P.emit({
                p: v.set(feet.x + (Math.random() - 0.5) * 0.3, feet.y + 0.05, feet.z + (Math.random() - 0.5) * 0.3),
                v: d.set((Math.random() - 0.5) * 0.8, 0.4 + Math.random() * 0.5, (Math.random() - 0.5) * 0.8),
                life: 0.7 + Math.random() * 0.4,
                size: 0.16 + Math.random() * 0.1,
                grow: 1.8,
                drag: 2,
                grav: 0.6,
                alpha: 0.35,
                color: col,
              });
          }
        }
      }
    }
    G.soulFx = { phase, update };
  }
  BK.SoulFx = { setup, DUST };
})(typeof self !== 'undefined' ? self : globalThis);
