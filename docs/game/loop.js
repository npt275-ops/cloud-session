/* Bể Kính · game/loop.js
 * Khởi động game và nhịp mỗi khung hình. start() dựng bộ nhớ chung G theo thứ tự (thế giới, cảnh, bầu trời, độ mượt,
 * bể kính, thiên nhiên, mùa, tuyết, camera, thanh đảo, sáu thành phố, màn hình), rồi chạy vòng lặp:
 *   thời gian thật nhân tốc độ đưa vào logic của cả bể (tới 1 giây mỗi khung: máy chậm vẫn đúng nhịp 1×, 2×, 4×); logic chạy
 *   theo bước cố định và giữ lịch, giờ trong ngày (logic/world.js);
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
    BK.GameCities.setup(G);  // game/cities.js (sáu thành phố: logic của cả bể, công trình, người)
    if (BK.NeonCity3D) BK.NeonCity3D.setup(G); // render/neon3d.js (mặt trời nhân tạo của thành phố neon, thời 10 trở đi)
    BK.Hud.setup(G);         // ui/hud.js
    BK.RaceDev.setup(G);     // ui/race-dev.js (tin giữa các đảo, bảng dev "Cuộc đua")

    const { W, renderer, scene, camera, controls } = G, T = G.time;
    let last = performance.now(), lastSlow = 0;
    G.seasons.update(true);
    function frame(t) {
      const f0 = performance.now(); // đo hiệu năng (G.frameTime: thời gian phần JS (trong đó phần logic), phần vẽ mỗi khung hình, trung bình trượt; tools/ đo 4 cảnh)
      const raw = Math.max(0, Math.min(1000, t - last)), dt = Math.min(100, raw); last = t; // khung đầu có thể mang mốc giờ sớm hơn lúc khởi động: không để thời gian âm
      G.perf.govern(dt);
      // xem chậm (game/cities.js G.slowmo): đảo đang xem có chuyện (trận đánh, biểu tình, đám tang…) thì thời gian chậm lại để kịp thấy
      const l0 = performance.now();
      G.citiesRun.step((raw * T.tps * (G.slowmo ? G.slowmo : 1)) / 1000); // lịch và giờ trong ngày do logic giữ (logic/world.js); W.day, T.tod lấy lại từ đó
      const l1 = performance.now();
      const { night } = G.sky.applyTime();
      G.weather.night = night; G.weather.winter = G.seasons.winter();
      if (t - lastSlow > 1000) { lastSlow = t; G.seasons.update(false); G.hud.slow(); G.citiesRun.slow(); G.raceDev.slow(); }
      G.nature.animate(dt, t, night);
      G.citiesRun.animate(dt, t, night);
      if (G.neonCity) G.neonCity.update(dt, t);
      G.snow.update(dt, t, G.weather.winter);
      const now = performance.now();
      G.updatePuffs(now, dt);
      G.tank.animate(t);
      G.cameraFly.update(dt, now);
      controls.update();
      G.perf.shadowTick();
      const f1 = performance.now();
      renderer.render(scene, camera);
      const f2 = performance.now(), FT = G.frameTime || (G.frameTime = { js: 0, gl: 0, n: 0 }), k = FT.n < 30 ? 1 / ++FT.n : 1 / 30;
      FT.js += (f1 - f0 - FT.js) * k; FT.gl += (f2 - f1 - FT.gl) * k; FT.logic = (FT.logic || 0) + (l1 - l0 - (FT.logic || 0)) * k;
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);

    window.__glass = {
      G, THREE, W, scene, camera, controls, renderer, lands3d: G.lands3d, clouds3d: G.clouds3d, sea3d: G.sea3d,
      buildings: G.buildings, jumpEra: G.jumpEra, level: () => G.level, world: G.world, isle: G.isle, village: G.village, villageUi: G.villageUi, villageOf: G.villageOf,
      lockQuality: (q) => G.perf.lock(q), perf: G.perf,
    };
  }
  BK.GameLoop = { start };
})(typeof self !== 'undefined' ? self : globalThis);
