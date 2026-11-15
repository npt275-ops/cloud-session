/* Bể Kính · magic/water/deluge/surge3d.js · Sóng đập vào sáu đảo (phần hình của Đại hồng thuỷ, lúc nước đổ ập xuống)
 * crash(): quanh mép cả sáu đảo, sóng tung bọt trắng cao (crashSplash) chạy vòng quanh mép trong WAVE_SEC giây, bụi nước
 * mù mịt (surgeMist), gợn nước lớn (G.water.splash); update(giây) chạy tiếp các cú tung bọt đã hẹn giờ, rồi bọt tung nhỏ dần
 * trong AFTER giây. Cần: render/magic/vfx.js, render/water/water3d.js, sea3d.js. */
(function (root) {
  const BK = root.BK || (root.BK = {});
  const STEP = 0.22, // (radian) khoảng cách hai cú tung bọt quanh mép đảo
    WAVE_SEC = 1.4, // sóng chạy vòng quanh mép trong chừng này
    AFTER = 4, // bọt tung nhỏ dần thêm chừng này
    OUT = 1.5; // cú tung bọt nằm ngoài mép đảo chừng này
  function setup(G) {
    const { THREE } = G;
    const st = { q: [], t: 0, after: 0 },
      p = new THREE.Vector3();
    const seaY = () => G.sea3d.SEA_Y + G.sea3d.seaDy;
    function rimPoint(L, a, out) {
      const r = L.rOf(a) + OUT;
      return out.set(L.center.x + Math.cos(a) * r, seaY(), L.center.z + Math.sin(a) * r);
    }
    function crash() {
      st.t = 0;
      st.after = AFTER;
      for (const L of G.lands)
        for (let a = 0; a < Math.PI * 2; a += STEP) st.q.push({ L, a, at: (a / (Math.PI * 2)) * WAVE_SEC + Math.random() * 0.2 });
      for (const L of G.lands) G.vfx.play('surgeMist', rimPoint(L, Math.random() * 6.28, p), { scale: 2 });
    }
    function update(sec) {
      st.t += sec;
      for (let k = st.q.length - 1; k >= 0; k--) {
        const s = st.q[k];
        if (s.at > st.t) continue;
        st.q.splice(k, 1);
        rimPoint(s.L, s.a, p);
        G.vfx.play('crashSplash', p, { scale: 1.3 });
        if (G.water && Math.random() < 0.35) G.water.splash(p.x, p.z, 2.5, 1.2);
      }
      if (st.after > 0 && !st.q.length) {
        st.after -= sec;
        if (Math.random() < sec * 10 * (st.after / AFTER)) {
          const L = G.lands[Math.floor(Math.random() * G.lands.length)];
          G.vfx.play('crashSplash', rimPoint(L, Math.random() * Math.PI * 2, p), { scale: 0.6 + 0.6 * (st.after / AFTER) });
        }
      }
    }
    G.surge3d = { crash, update };
  }
  BK.Surge3D = { setup, WAVE_SEC };
})(typeof self !== 'undefined' ? self : globalThis);
