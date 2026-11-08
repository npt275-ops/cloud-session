/* Bể Kính · render/perf3d.js
 * Mượt và nét: bộ điều tốc nhắm 60 khung hình mỗi giây (chậm thì hạ độ nét, vẽ bóng thưa hơn, rồi bỏ bóng; nhanh lại thì
 * nâng dần), vùng bóng nắng theo khoảng cách camera, phím F hiện số khung hình mỗi giây.
 * G.perf.half: nửa bề rộng vùng bóng (render/sky3d.js dùng để nhích khung bóng). Cần: game/world.js, render/scene3d.js, render/sky3d.js. */
(function (root) {
  const BK = root.BK || (root.BK = {});
  function setup(G) {
    const { THREE, renderer, scene, camera, controls, sun, clamp, $, resize } = G;
    const lowEnd = window.innerWidth < 720 || (navigator.hardwareConcurrency || 8) <= 4;
    const PERF = { prMax: Math.min(2, window.devicePixelRatio || 1), prMin: 0.75, pr: 1, shadow: lowEnd ? 1024 : 2048, shadowEvery: 2, frame: 0, ema: 16.7,
        slow: 0, good: 0, ceiling: 9, cool: 0, half: 70, force: true, lastT: new THREE.Vector3(1e9, 0, 0), fps: 60, fpsN: 0, fpsT: 0, fpsOn: false,
        locked: false };
    PERF.pr = PERF.prMax; // cảnh đã nhẹ: máy nào cũng bắt đầu ở độ nét cao nhất, chậm thì bộ điều tốc tự hạ
    const PRESETS = [{ pr: 2, shadow: 2048 }, { pr: 1.5, shadow: 1024 }, { pr: 1, shadow: 0 }, { pr: 0.75, shadow: 0 }];
    function applyQuality() {
      renderer.setPixelRatio(Math.min(PERF.pr, window.devicePixelRatio || 1));
      const shadows = PERF.shadow > 0;
      if (shadows && sun.shadow.mapSize.x !== PERF.shadow) { sun.shadow.mapSize.set(PERF.shadow, PERF.shadow); if (sun.shadow.map) { sun.shadow.map.dispose(); sun.shadow.map = null; } }
      if (renderer.shadowMap.enabled !== shadows) { renderer.shadowMap.enabled = shadows; scene.traverse((o) => { if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => (m.needsUpdate = true)); }); }
      PERF.force = true;
      resize();
    }
    applyQuality();
    function govern(dt) {
      if (PERF.locked || document.hidden || dt > 250) return;
      const t = performance.now();
      PERF.fpsN++; if (t - PERF.fpsT > 500) { PERF.fps = (PERF.fpsN * 1000) / (t - PERF.fpsT); PERF.fpsN = 0; PERF.fpsT = t; if (PERF.fpsOn) $('fps').textContent = Math.round(PERF.fps) + ' khung/giây · nét ' + renderer.getPixelRatio().toFixed(2) + '×' + (PERF.shadow ? '' : ' · tắt bóng'); }
      PERF.ema = PERF.ema * 0.92 + dt * 0.08;
      if (PERF.ema > 19.5) { PERF.slow += dt; PERF.good = 0; }
      else { PERF.slow = Math.max(0, PERF.slow - dt * 0.5); PERF.good = PERF.ema < 17.8 ? PERF.good + dt : 0; }
      if (PERF.slow > 1200) {
        PERF.slow = 0; PERF.ceiling = Math.min(PERF.ceiling, PERF.pr); PERF.cool = t + 45000;
        if (PERF.pr > PERF.prMin + 0.01) PERF.pr = Math.max(PERF.prMin, +(PERF.pr - 0.15).toFixed(2));
        else if (PERF.shadowEvery < 3) PERF.shadowEvery = 3;
        else if (PERF.shadow > 1024) PERF.shadow = 1024;
        else if (PERF.shadow > 0) PERF.shadow = 0;
        else return;
        applyQuality(); PERF.ema = 16.7;
      } else if (PERF.good > 4000) {
        PERF.good = 0;
        if (PERF.shadow === 0) PERF.shadow = 1024;
        else if (PERF.shadow < (lowEnd ? 1024 : 2048)) PERF.shadow = 2048;
        else if (PERF.shadowEvery > 2) PERF.shadowEvery = 2;
        else if (PERF.pr < PERF.prMax - 0.01 && (t > PERF.cool || PERF.pr + 0.1 < PERF.ceiling - 0.01)) { PERF.pr = Math.min(PERF.prMax, +(PERF.pr + 0.1).toFixed(2)); if (t > PERF.cool) PERF.ceiling = 9; }
        else return;
        applyQuality();
      }
    }
    // bóng đổ: vùng bóng theo khoảng cách camera, vẽ lại hai khung một lần hoặc khi chỗ nhìn đổi
    function shadowTick() {
      PERF.frame++;
      if (!renderer.shadowMap.enabled) return;
      const moved = controls.target.distanceToSquared(PERF.lastT) > 0.0004;
      if (moved) PERF.lastT.copy(controls.target);
      const half = clamp(camera.position.distanceTo(controls.target) * 0.62, 10, 80); // nhìn gần thì bóng sắc hơn
      if (Math.abs(half - PERF.half) > 3) { PERF.half = half; const sc = sun.shadow.camera; sc.left = -half; sc.right = half; sc.top = half; sc.bottom = -half; sc.updateProjectionMatrix(); PERF.force = true; }
      renderer.shadowMap.needsUpdate = PERF.force || moved || PERF.frame % PERF.shadowEvery === 0;
      PERF.force = false;
    }
    document.addEventListener('keydown', (e) => { if (e.code === 'KeyF' && !e.ctrlKey && !e.metaKey && !G.typing(e.target)) { PERF.fpsOn = !PERF.fpsOn; $('fps').hidden = !PERF.fpsOn; } });
    // khoá một mức chất lượng (cho bài kiểm tra chạy trình duyệt không giao diện)
    function lock(q) { PERF.locked = true; PERF.pr = Math.min(PRESETS[q].pr, PERF.prMax); PERF.shadow = PRESETS[q].shadow; applyQuality(); }
    Object.assign(PERF, { govern, shadowTick, applyQuality, lock });
    G.perf = PERF;
  }
  BK.Perf3D = { setup };
})(typeof self !== 'undefined' ? self : globalThis);
