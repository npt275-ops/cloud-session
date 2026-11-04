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
    // danh sách công trình phải dựng trong mỗi thời, lấy đúng thứ tự từ bố cục của thời đó (render/build/plains/eNN.js):
    // nhà chính nặng nhất, công trình lớn gấp đôi, đồ nhỏ (đèn, đường, cột…) nhẹ; thời đồ đá có sẵn nhà chính, bếp lửa, bốn lều
    const BIG = new Set(['field', 'market', 'factory', 'station', 'school', 'shop', 'pad', 'nuclear', 'datacenter']);
    const SMALL = new Set(['lamp', 'hay', 'road', 'asphalt', 'glowRoad', 'pole', 'shroom', 'mote', 'pylon', 'shard', 'totem', 'rack', 'well', 'robot', 'tractor']);
    // nhà riêng của dân nhẹ hơn một chút (20 nhà mỗi thời); công trình ngoài làng như công trình lớn
    function buildPlan(level) {
      const lay = BK.Plains3D && BK.Plains3D.ERA[level]; if (!lay) return [];
      let huts = 0;
      return lay.pieces.filter((P) => lay.BUILD[P.kind]).map((P) => {
        const size = P.kind === 'hall' ? 4 : P.wonder ? 3 : P.town ? 1.5 : P.home != null ? 0.7 : P.outer ? 1.5 : BIG.has(P.kind) ? 2 : SMALL.has(P.kind) ? 0.4 : 1;
        const done = level === 1 && (P.kind === 'hall' || P.kind === 'fire' || (P.home != null && huts++ < 4));
        return { name: lay.NAME[P.kind] || P.kind, size, done };
      });
    }
    const isle = Island.create({ key: 'plains', seed: +q.get('seed') || 42, buildPlan });
    { const cap = +q.get('cap'); if (cap > 1 && cap <= Eras.COUNT) { W.day = Eras.startOf(cap) + 0.01; Island.step(isle, W.day); } }
    G.level = isle.level;
    buildings.show(0, G.level, false); buildings.setProgress(0, isle.build && isle.build.list, isle.build && isle.build.level);
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
    // giờ trong ngày đi vào logic để người biết sáng đi làm, trưa về ăn, tối ra quảng trường, đêm về ngủ (logic/schedule.js)
    const step = (dDays) => { isle.tod = G.time.tod; Island.step(isle, dDays); };
    // logic sang thời ở khung hình nào thì công trình đổi thời ngay khung hình đó (không chờ nhịp chậm, tránh nhấp nháy)
    function animate(dt, t, night) { if (isle.level !== G.level) syncEra(true); buildings.setProgress(0, isle.build && isle.build.list, isle.build && isle.build.level); buildings.animate(dt, t, night); village.update(dt, t); }
    // mỗi giây: đồng bộ thời kỳ, chỗ đến của người (công trình vừa dựng xong, chỗ đang dựng), bảng làng
    function slow() { syncEra(true); village.setPlaces(buildings.places(0)); villageUi.render(); }
    Object.assign(G, { isle, buildings, village, villageUi, jumpEra, villageRun: { step, animate, slow } });
  }
  BK.GameVillage = { setup };
})(typeof self !== 'undefined' ? self : globalThis);
