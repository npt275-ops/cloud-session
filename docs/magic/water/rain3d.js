/* Bể Kính · magic/water/rain3d.js · Hình ảnh phép Gọi mưa (chỉ vẽ; điều khiển ở magic/water/cast.js)
 * start(chỗ, giây, yAt): đám mây xám nhỏ tụ trên chỗ ngắm (CLOUD_UP cao), mưa rơi trong bán kính R suốt chừng ấy giây: hạt mưa
 * rơi thẳng nhanh, chạm đất bắn tóe nhỏ, đất sẫm ướt dần (vết ướt); chạm mặt biển thì gợn nước (G.water.splash).
 * update(giây, đứng): đứng = thời gian đang dừng: hạt mưa ngừng sinh (hạt đã có đứng theo bộ hạt). yAt(x, z): mặt đất hay
 * mặt biển chỗ đó (thế giới), trả { y, sea }. Cần: render/magic/vfx.js, render/water/water3d.js (G.water.splash). */
(function (root) {
  const BK = root.BK || (root.BK = {});
  const R = 5, // (đơn vị) bán kính vùng mưa
    CLOUD_UP = 8, // mây cao hơn chỗ ngắm
    DROPS = 220, // hạt mưa mỗi giây
    SPLASH_EVERY = 0.06; // (giây) một chỗ bắn tóe, gợn nước
  function setup(G) {
    const { THREE } = G;
    const st = { on: [], p: new THREE.Vector3(), v: new THREE.Vector3() };
    function start(at, sec, yAt) {
      const r = { at: at.clone(), t: 0, sec, yAt, acc: 0, sp: 0, cloud: 0 };
      st.on.push(r);
      G.vfx.play('rainCloud', st.p.copy(at).setY(at.y + CLOUD_UP));
      G.vfx.play('wetGround', at);
      return r;
    }
    function update(sec, still) {
      if (still) return;
      const { p, v } = st;
      for (let k = st.on.length - 1; k >= 0; k--) {
        const r = st.on[k];
        r.t += sec;
        if (r.t > r.sec) {
          st.on.splice(k, 1);
          continue;
        }
        // mây tụ thêm cho dày (mỗi giây một đợt)
        if ((r.cloud -= sec) <= 0) {
          r.cloud = 1;
          G.vfx.play('rainCloud', p.copy(r.at).setY(r.at.y + CLOUD_UP), { scale: 0.8 });
        }
        r.acc += sec * DROPS;
        for (; r.acc >= 1; r.acc--) {
          const a = Math.random() * Math.PI * 2,
            d = Math.sqrt(Math.random()) * R;
          p.set(r.at.x + Math.cos(a) * d, r.at.y + CLOUD_UP - 1 - Math.random() * 1.5, r.at.z + Math.sin(a) * d);
          v.set(0, -14 - Math.random() * 4, 0);
          G.vfx.spawn('soft', p, v, { life: 0.5, size: [0.2, 0.15], color: ['#cfe7f2', '#9fd3ea'], alpha: 0.95 });
        }
        if ((r.sp -= sec) <= 0) {
          r.sp = SPLASH_EVERY;
          const a = Math.random() * Math.PI * 2,
            d = Math.sqrt(Math.random()) * R,
            x = r.at.x + Math.cos(a) * d,
            z = r.at.z + Math.sin(a) * d,
            g = r.yAt(x, z);
          G.vfx.play('rainSplash', p.set(x, g.y + 0.05, z));
          if (g.sea && G.water) G.water.splash(x, z, 0.35, 0.18);
        }
      }
    }
    G.rain3d = { start, update, R, active: () => st.on.length };
  }
  BK.Rain3D = { setup, R };
})(typeof self !== 'undefined' ? self : globalThis);
