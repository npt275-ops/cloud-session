/* Bể Kính · game/village.js
 * Lúa Vàng chạy theo thời gian thực: logic ngầm của đảo (logic/island.js: người già đi, kết đôi, sinh con, mất; 1,5 năm
 * một thế hệ; thời kỳ lên theo lịch logic/eras.js), công trình theo thời (render/buildings3d.js), người đi lại trong làng
 * (render/village3d.js), bảng làng và thẻ người (ui/village-ui.js), bấm vào một người để mở thẻ. Năm đảo còn lại để
 * trống tới khi chốt Lúa Vàng. Mở với ?seed= để thử làng khác, ?cap= để vào thẳng một cấp khi phát triển.
 * Cần: game/world.js, game/nature.js, game/seasons.js, các tệp logic/, render/ của người và công trình, ui/village-ui.js. */
(function (root) {
  const BK = root.BK || (root.BK = {});
  function setup(G) {
    const { THREE, W, lands, lands3d, scene, camera, controls, canvas, $ } = G;
    const Eras = BK.Eras, Island = BK.Island, buildings = BK.Buildings3D.create({ THREE, lands3d });
    const q = new URLSearchParams(location.search);
    const isle = Island.create({ key: 'plains', seed: +q.get('seed') || 42 });
    { const cap = +q.get('cap'); if (cap > 1 && cap <= Eras.COUNT) { W.day = Eras.startOf(cap) + 0.01; Island.step(isle, W.day); } }
    G.level = isle.level;
    buildings.show(0, G.level, false);
    const village = BK.Village3D.create({ THREE, scene, L: lands[0], S: isle, level: G.level, places: buildings.places(0) });
    const villageUi = BK.VillageUI.create({ S: isle, Island, panel: false, onFly: () => G.flyTo(lands[0].center, 34, lands[0].inw.clone().setY(0.55), 1.5) });
    // thời kỳ đang có và phần đã đi được tới thời sau (giống bể kính cũ: xem từng thời trôi qua ở 1×, 2×, 4×)
    function eraLabel() { const l = G.level; if (W.day >= Eras.MATCH_DAYS) return Eras.of(l).name + ' · hết 9 năm'; const into = (W.day - Eras.startOf(l)) / Eras.ERA_DAYS; return Eras.of(l).name + (l < Eras.COUNT ? ' · ' + Math.min(99, Math.floor(into * 100)) + '% tới thời sau' : ' · thời cuối'); }
    function syncEra(animate) {
      if (isle.level !== G.level) { G.level = isle.level; buildings.show(0, G.level, animate); village.setLevel(G.level); village.setPlaces(buildings.places(0)); }
      $('eraName').textContent = eraLabel();
    }
    // chỉ dùng cho bài kiểm tra chạy trình duyệt không giao diện (trong game không có nút tua: thời gian đi 1×, 2×, 4×)
    const jumpEra = () => { if (G.level >= Eras.COUNT) return; const to = Eras.startOf(G.level + 1) + 0.01, d = to - W.day; if (d <= 0) return; W.day = to; Island.step(isle, d); G.seasons.update(true); syncEra(true); villageUi.render(true); };
    $('villageBtn').onclick = () => { const on = villageUi.togglePanel(); $('villageBtn').setAttribute('aria-pressed', String(on)); };
    $('eraName').textContent = eraLabel();
    // mở game là nhìn vào làng Lúa Vàng (cuộn ra để thấy cả bể)
    { const L = lands[0]; controls.target.copy(L.center).setY(1.5); camera.position.copy(L.center).addScaledVector(L.inw, 26).add(new THREE.Vector3(6, 17, 0)); if (window.innerWidth < 720) camera.position.sub(controls.target).multiplyScalar(1.5).add(controls.target); }
    // bấm vào một người (chạm nhẹ, không kéo) để mở thẻ nhỏ; bấm chỗ khác để đóng
    { const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(); let down = null;
      canvas.addEventListener('pointerdown', (e) => { down = [e.clientX, e.clientY]; });
      canvas.addEventListener('pointerup', (e) => {
        if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 6) return;
        ndc.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1); ray.setFromCamera(ndc, camera);
        const id = village.pick(ray); village.select(id); villageUi.select(id);
      }); }
    // logic đi theo đồng hồ của trận; mỗi khung hình vẽ người và công trình; mỗi giây đồng bộ thời kỳ và bảng làng
    const step = (dDays) => Island.step(isle, dDays);
    function animate(dt, t, night) { buildings.animate(dt, t, night); village.update(dt, t); }
    function slow() { syncEra(true); villageUi.render(); }
    Object.assign(G, { isle, buildings, village, villageUi, jumpEra, villageRun: { step, animate, slow } });
  }
  BK.GameVillage = { setup };
})(typeof self !== 'undefined' ? self : globalThis);
