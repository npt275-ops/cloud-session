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
    BK.GameWorld.setup(G); // game/world.js
    BK.Scene3D.setup(G); // render/scene3d.js
    BK.Sky3D.setup(G); // render/sky3d.js
    BK.Perf3D.setup(G); // render/perf3d.js
    BK.Tank3D.setup(G); // render/tank3d.js
    BK.GameNature.setup(G); // game/nature.js
    BK.Water3D.setup(G); // render/water/water3d.js (nước quang học: phản chiếu, khúc xạ, hấp thụ, gợn, caustics)
    BK.GameSeasons.setup(G); // game/seasons.js
    BK.Snow3D.setup(G); // render/snow3d.js
    BK.CameraFly.setup(G); // ui/camera-fly.js
    BK.Post3D.setup(G); // render/fx/post3d.js (lượt vẽ hậu kỳ của cú nhập hồn)
    BK.Particles3D.setup(G); // render/fx/particles3d.js (bộ hạt dùng chung)
    BK.SoulFx.setup(G); // render/fx/soul-fx.js (hạt, âm thanh theo pha của cú nhập hồn)
    BK.Near3D.setup(G); // render/near3d.js (cảnh vật gần sau cú nhập hồn: sương, đèn, cỏ, sỏi, hoa)
    BK.SoftBody3D.setup(G); // render/body/softbody3d.js (thân đồ chơi mềm cho nhân vật mình và người gần)
    BK.Diorama3D.setup(G); // render/style/diorama3d.js (bản thử thế giới đồ chơi thu nhỏ sau khi nhập hồn, đảo Lúa Vàng)
    BK.LandBar.setup(G); // ui/landbar.js
    BK.GameCities.setup(G); // game/cities.js (sáu thành phố: logic của cả bể, công trình, người)
    if (BK.Look3D) BK.Look3D.setup(G); // render/look3d.js (hình ảnh mô hình thu nhỏ: màu, vệt tối chân, chi tiết bề mặt)
    if (BK.NeonCity3D) BK.NeonCity3D.setup(G); // render/neon3d.js (mặt trời nhân tạo của thành phố neon, thời 10 trở đi)
    BK.Hud.setup(G); // ui/hud.js
    BK.Possess.setup(G); // game/possess.js (cú nhập hồn)
    BK.PossessCtl.setup(G); // ui/possess-ctl.js (nút, phím, cần ảo của cú nhập hồn)
    BK.VFX.setup(G); // render/magic/vfx.js (bộ hạt dùng chung của phép)
    BK.Aim3D.setup(G); // render/magic/aim3d.js (vòng ngắm của phép)
    BK.Staff3D.setup(G); // render/magic/staff3d.js (gậy phép trong tay khi nhập hồn)
    BK.Spellbook.setup(G); // game/spellbook.js (sách phép thuật: chọn, ngắm, phát phép, linh lực; dựng các hệ ở magic/<hệ>/)
    BK.SpellbookUi.setup(G); // ui/spellbook-ui.js (cuốn sách, thanh phép, linh lực)
    BK.RaceDev.setup(G); // ui/race-dev.js (tin giữa các đảo, bảng dev "Cuộc đua")

    const { W, renderer, scene, camera, controls } = G,
      T = G.time;
    let last = performance.now(),
      lastSlow = 0,
      frozenMs = 0; // (mili giây thời gian thế giới đã đứng im: phép dừng thời gian)
    G.seasons.update(true);
    function frame(t) {
      const f0 = performance.now(); // đo hiệu năng (G.frameTime: thời gian phần JS (trong đó phần logic), phần vẽ mỗi khung hình, trung bình trượt; tools/ đo 4 cảnh)
      const raw = Math.max(0, Math.min(1000, t - last)),
        dt = Math.min(100, raw);
      last = t; // khung đầu có thể mang mốc giờ sớm hơn lúc khởi động: không để thời gian âm
      G.perf.govern(dt);
      // xem chậm (game/cities.js G.slowmo): đảo đang xem có chuyện (trận đánh, biểu tình, đám tang…) thì thời gian chậm lại để kịp thấy
      const l0 = performance.now();
      // (phép thời gian, magic/time/cast.js: G.timeCtl.mul 0 khi dừng, tua lùi; 8, 16 khi tua nhanh)
      const tc = G.timeCtl,
        frozen = !!(tc && tc.frozen);
      // lịch và giờ trong ngày do logic giữ (logic/world.js); W.day, T.tod lấy lại từ đó; G.timeK: chậm lại lúc lao nhập hồn (game/possess.js)
      G.citiesRun.step((raw * T.tps * (G.slowmo ? G.slowmo : 1) * G.timeK * (tc ? tc.mul : 1)) / 1000);
      const l1 = performance.now();
      const { night } = G.sky.applyTime();
      G.weather.night = night;
      G.weather.winter = G.seasons.winter();
      if (t - lastSlow > 1000) {
        lastSlow = t;
        G.seasons.update(false);
        G.hud.slow();
        G.citiesRun.slow();
        G.raceDev.slow();
      }
      // thời gian thế giới (mây, sóng, khói, tuyết, thuyền, đạn, người trong làng): đứng im khi dừng thời gian; làng vẫn nhận giờ thật
      // để linh hồn (người bị nhập hồn) đi lại được, người khác đứng im (frozen)
      if (frozen) frozenMs += raw;
      const wdt = frozen ? 0 : dt,
        wt = t - frozenMs;
      G.nature.animate(wdt, wt, night);
      G.citiesRun.animate(dt, wt, night, frozen);
      if (G.look) G.look.update();
      if (G.neonCity) G.neonCity.update(wdt, wt);
      G.snow.update(wdt, wt, G.weather.winter);
      const now = performance.now();
      G.updatePuffs(now - frozenMs, wdt);
      G.tank.animate(wt);
      G.cameraFly.update(dt, now);
      controls.update();
      G.possess.update(dt); // game/possess.js: lúc nhập hồn máy quay do cú nhập hồn đặt
      G.possessUi.sync();
      G.particles.update(Math.min(0.1, dt / 1000));
      G.spellbook.update(Math.min(0.1, dt / 1000)); // (giờ thật: hồi linh lực, các hệ phép, đạn phép, vòng ngắm)
      G.vfx.update(Math.min(0.1, dt / 1000));
      G.spellbookUi.sync();
      G.perf.shadowTick();
      const f1 = performance.now();
      G.water.frame(Math.min(0.1, dt / 1000)); // (vẽ trước ảnh dưới nước, ảnh phản chiếu cho mặt nước)
      G.post.render(); // render/fx/post3d.js: không có hiệu ứng thì vẽ thẳng như renderer.render(scene, camera)
      const f2 = performance.now(),
        FT = G.frameTime || (G.frameTime = { js: 0, gl: 0, n: 0 }),
        k = FT.n < 30 ? 1 / ++FT.n : 1 / 30;
      FT.js += (f1 - f0 - FT.js) * k;
      FT.gl += (f2 - f1 - FT.gl) * k;
      FT.logic = (FT.logic || 0) + (l1 - l0 - (FT.logic || 0)) * k;
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);

    window.__glass = {
      G,
      THREE,
      W,
      scene,
      camera,
      controls,
      renderer,
      lands3d: G.lands3d,
      clouds3d: G.clouds3d,
      sea3d: G.sea3d,
      buildings: G.buildings,
      jumpEra: G.jumpEra,
      level: () => G.level,
      world: G.world,
      isle: G.isle,
      village: G.village,
      villageUi: G.villageUi,
      villageOf: G.villageOf,
      lockQuality: (q) => G.perf.lock(q),
      perf: G.perf,
    };
  }
  BK.GameLoop = { start };
})(typeof self !== 'undefined' ? self : globalThis);
