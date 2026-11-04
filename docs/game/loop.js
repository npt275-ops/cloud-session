/* Bể Kính · game/loop.js
 * Khởi động game và nhịp mỗi khung hình. start() dựng bộ nhớ chung G theo thứ tự (thế giới, cảnh, bầu trời, độ mượt,
 * bể kính, thiên nhiên, mùa, tuyết, camera, thanh đảo, Lúa Vàng, năm đảo còn lại, màn hình), rồi chạy vòng lặp:
 *   đồng hồ trận đi theo thời gian thật (tới 1 giây mỗi khung: máy chậm vẫn đúng nhịp 1×, 2×, 4×), logic đảo chạy theo;
 *   chuyển động dùng thời gian khung (tối đa 0,1 giây); mỗi giây đổi mùa, ghi ngày, đồng bộ thời kỳ và bảng làng.
 * window.__glass: móc cho các bài kiểm tra chạy trình duyệt không giao diện. */
(function (root) {
  const BK = root.BK || (root.BK = {});
  function start() {
    if (!window.THREE || !THREE.OrbitControls || !window.Lands3D || !window.Sea3D) {
      document.body.insertAdjacentHTML('beforeend', '<div class="err">Không tải được thư viện 3D. Hãy tải lại trang.</div>');
      return;
    }
    const G = {};
    BK.GameWorld.setup(G);   // game/world.js
    BK.Scene3D.setup(G);     // render/scene3d.js
    BK.Sky3D.setup(G);       // render/sky3d.js
    BK.Perf3D.setup(G);      // render/perf3d.js
    BK.Tank3D.setup(G);      // render/tank3d.js
    BK.GameNature.setup(G);  // game/nature.js
    BK.GameSeasons.setup(G); // game/seasons.js
    BK.Snow3D.setup(G);      // render/snow3d.js
    BK.CameraFly.setup(G);   // ui/camera-fly.js
    BK.LandBar.setup(G);     // ui/landbar.js
    BK.GameVillage.setup(G); // game/village.js
    BK.GameIsles.setup(G);   // game/isles.js (công trình năm đảo còn lại)
    if (BK.NeonCity3D) BK.NeonCity3D.setup(G); // render/neon3d.js (mặt trời nhân tạo của thành phố neon, thời 10 trở đi)
    BK.Hud.setup(G);         // ui/hud.js

    const { W, renderer, scene, camera, controls } = G, T = G.time;
    let last = performance.now(), lastSlow = 0;
    G.seasons.update(true);
    function frame(t) {
      const raw = Math.max(0, Math.min(1000, t - last)), dt = Math.min(100, raw); last = t; // khung đầu có thể mang mốc giờ sớm hơn lúc khởi động: không để thời gian âm
      G.perf.govern(dt);
      T.tod = (T.tod + (raw * (T.tps / 1.5)) / T.DAY_MS) % 1; // 1×: một vòng ngày đêm 3 phút
      const dDays = (raw * T.tps) / 1000; W.day += dDays; G.villageRun.step(dDays);
      const { night } = G.sky.applyTime();
      G.weather.night = night; G.weather.winter = G.seasons.winter();
      if (t - lastSlow > 1000) { lastSlow = t; G.seasons.update(false); G.hud.slow(); G.villageRun.slow(); }
      G.nature.animate(dt, t, night);
      G.villageRun.animate(dt, t, night);
      G.islesRun.update();
      if (G.neonCity) G.neonCity.update(dt, t);
      G.snow.update(dt, t, G.weather.winter);
      const now = performance.now();
      G.updatePuffs(now, dt);
      G.tank.animate(t);
      G.cameraFly.update(dt, now);
      controls.update();
      G.perf.shadowTick();
      renderer.render(scene, camera);
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);

    window.__glass = {
      G, THREE, W, scene, camera, controls, renderer, lands3d: G.lands3d, clouds3d: G.clouds3d, sea3d: G.sea3d,
      buildings: G.buildings, jumpEra: G.jumpEra, level: () => G.level, isle: G.isle, village: G.village, villageUi: G.villageUi,
      ff: (days) => { W.day += days; G.seasons.update(true); },
      lockQuality: (q) => G.perf.lock(q), perf: G.perf,
    };
  }
  BK.GameLoop = { start };
})(typeof self !== 'undefined' ? self : globalThis);
