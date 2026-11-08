/* Bể Kính · game/cities.js · Sáu thành phố chạy theo đồng hồ của trận
 * Nối logic của cả bể (logic/world.js: sáu đảo, một đồng hồ, bước cố định) với phần vẽ:
 *   công trình của từng đảo dựng dần theo danh sách xây dựng của logic (render/buildings3d.js setProgress), mỗi đảo theo cấp
 *   của chính nó; người của đảo nào thì vẽ ở đảo đó (render/village3d.js), chỉ những đảo gần máy quay (NEAR) mới vẽ người;
 *   bảng làng và thẻ người (ui/village-ui.js) cho mọi đảo: bấm vào một người ở đảo nào thì mở thẻ của người đó;
 *   giữa các đảo (logic/diplomacy.js): cầu logic bắc thì hiện ra (render/build/bridges3d.js, dáng theo thời thấp hơn của hai
 *   đảo), đoàn buôn đi thuyền, đi xe qua cầu (render/travel3d.js);
 *   chiến tranh (logic/war.js): quân đi thuyền, qua cầu, vây cổng, tiến vào nhà chính, cờ đảo cai quản (render/war3d.js).
 * Đồng hồ (design/quy-trinh-tong-quat.md mục 1.1): mỗi khung hình đưa thêm số ngày lịch (tps × thời gian thật) vào logic; giờ
 * trong ngày lấy từ logic (G.time.tod) cho bầu trời; người đi, xe chạy theo giờ game (speed: 1, 2, 4).
 * Mở với ?seed= để thử trận khác, ?cap= để vào thẳng một cấp khi phát triển. Nút ◀ ▶ (dev): đặt thẳng cả sáu đảo vào một thời.
 * Cần: game/world.js, game/nature.js, game/seasons.js, logic/ (world.js và các tệp nó cần), render/ của người và công trình,
 * render/travel3d.js, render/war3d.js, ui/village-ui.js. */
(function (root) {
  const BK = root.BK || (root.BK = {});
  const NEAR = 120, FAR = 150; // vẽ người khi máy quay cách tâm đảo dưới NEAR, thôi vẽ khi xa hơn FAR
  // khối lượng mỗi công trình trong danh sách xây dựng: nhà chính nặng nhất, kỳ quan, công trình lớn, ngoài làng nặng hơn; nhà
  // riêng, đồ nhỏ (đèn, đường, cột…) nhẹ. Thời đồ đá có sẵn nhà chính, bếp lửa, bốn lều.
  const BIG = new Set(['field', 'market', 'factory', 'station', 'school', 'shop', 'pad', 'nuclear', 'datacenter']);
  const SMALL = new Set(['lamp', 'hay', 'road', 'asphalt', 'glowRoad', 'pole', 'shroom', 'mote', 'pylon', 'shard', 'totem', 'rack', 'well', 'robot', 'tractor']);
  function layoutOf(key, level) { return key === 'plains' ? BK.Plains3D && BK.Plains3D.ERA[level] : BK.Isles3D && BK.Isles3D[key] && BK.Isles3D[key].ERA[level]; }
  function buildPlan(key, level) {
    const lay = layoutOf(key, level); if (!lay) return [];
    let huts = 0;
    return lay.pieces.filter((P) => lay.BUILD[P.kind]).map((P) => {
      const size = P.kind === 'hall' ? 4 : P.wonder ? 3 : P.town ? 1.5 : P.home != null ? 0.7 : P.outer ? 1.5 : P.civic || BIG.has(P.kind) ? 2 : SMALL.has(P.kind) || /^x_/.test(P.kind) ? 0.4 : 1;
      const done = level === 1 && (P.kind === 'hall' || P.kind === 'fire' || /^x_fire/.test(P.kind) || (P.home != null && huts++ < 4));
      return { name: lay.NAME[P.kind] || P.kind, size, done };
    });
  }

  function setup(G) {
    const { THREE, W, lands, lands3d, bridges3d, scene, camera, controls, canvas, $ } = G;
    const Eras = BK.Eras, World = BK.World, Island = BK.Island, buildings = BK.Buildings3D.create({ THREE, lands3d });
    // trận mặc định: seed 7 (chạy theo nhịp chơi thật có phản bội, đánh úp, sáp nhập hai đảo, chặn cướp đoàn buôn); ?seed= để đổi
    const q = new URLSearchParams(location.search), seed = +q.get('seed') || 7;
    const world = World.create({ seed, buildPlan });
    // ?cap=: dev vào thẳng một cấp (cả sáu đảo đặt thẳng cấp đó, công trình của thời đó dựng sẵn)
    const devLevel = (l) => { for (const S of world.islands) { BK.Economy.devSetLevel(S, l); BK.Construction.setEra(S, l); for (const it of S.build.list) { it.done = true; it.progress = 1; } S.build.active = null; S.situChanged = true; } };
    { const cap = +q.get('cap'); if (cap > 1 && cap <= Eras.COUNT) devLevel(cap); }
    // ?day=: dev vào thẳng một ngày của trận (nút về năm trước dựng lại trận từ đầu với cùng seed rồi chạy tới đó: cùng seed
    // ra cùng lịch sử)
    { const day = +q.get('day'); if (day > 0) World.jump(world, Math.min(day, Eras.MATCH_DAYS)); }
    const N = world.islands.length, isle = (i) => world.islands[i];
    const shownLv = [], villages = [], uis = [];
    // cấp của từng đảo (mặt trời nhân tạo, render/neon3d.js), cấp thấp nhất (bầu trời tím khi cả sáu đảo tới thời 10)
    G.levelOf = (i) => isle(i).level;
    const syncLevels = () => { G.skyLevel = Math.min(...world.islands.map((S) => S.level)); G.level = isle(G.focus || 0).level; W.day = world.day; G.time.tod = world.tod; };
    syncLevels();
    for (let i = 0; i < N; i++) { shownLv[i] = isle(i).level; buildings.show(i, shownLv[i], false); }
    // người và bảng làng của một đảo: dựng khi cần lần đầu
    function villageOf(i) {
      if (!villages[i]) villages[i] = BK.Village3D.create({ THREE, scene, L: lands[i], S: isle(i), level: shownLv[i], places: buildings.places(i) });
      return villages[i];
    }
    function uiOf(i) {
      if (!uis[i]) uis[i] = BK.VillageUI.create({ S: isle(i), Island, panel: false, onFly: () => G.flyTo(lands[i].center, 34, lands[i].inw.clone().setY(0.55), 1.5) });
      return uis[i];
    }
    // đảo i sang thời mới: dựng bố cục thời mới (cái cũ thay dần), người mặc đồ thời mới, chỗ đến mới
    function syncEra(i, animate) {
      const S = isle(i); if (S.level === shownLv[i]) return;
      shownLv[i] = S.level; buildings.show(i, S.level, animate);
      if (villages[i]) { villages[i].setLevel(S.level); villages[i].setPlaces(buildings.places(i)); }
    }
    // nhãn thời kỳ của đảo đang xem: phần giỏ tài nguyên của thời sau đã gom được (logic/economy.js), thiên tai đang có
    // (logic/climate.js), đang đói
    // chuyện vừa tìm được (nút Sự kiện ⏭) hiện kèm nhãn 15 giây
    let evNote = null;
    function eraLabel() { return 'Năm ' + Math.min(9, Math.floor(world.day / (BK.Rules.YEAR_DAYS || 360)) + 1) + '/9 · ' + eraLabel0() + (evNote && performance.now() < evNote.until ? ' · ' + evNote.text : '') + (G.slowmo ? ' · đang xem chậm' : ''); }
    function eraLabel0() { const i = G.focus || 0, S = isle(i), l = S.level; if (world.day >= Eras.MATCH_DAYS) return S.name + ' · ' + Eras.of(l).name + ' · hết 9 năm'; const dis = BK.Climate.active(S, S.day).map((e) => e.name).join(', '), hungry = BK.Economy.state(S).hunger ? ' · đang đói' : ''; const pr = l < Eras.COUNT ? BK.Economy.progress(S) : 1; $('eraProg').style.width = Math.round(pr * 100) + '%'; $('eraProgBox').title = l < Eras.COUNT ? 'Đã gom ' + Math.floor(pr * 100) + '% tài nguyên cho thời sau' : 'Thời cuối'; return S.name + ' · ' + Eras.of(l).name + (dis ? ' · ' + dis : '') + hungry; } // phần đã gom cho thời sau: thanh phần trăm cạnh nhãn (không ghi bằng chữ)
    function resyncAll() {
      syncLevels();
      for (let i = 0; i < N; i++) { shownLv[i] = isle(i).level; buildings.show(i, shownLv[i], false); buildings.setProgress(i, isle(i).build && isle(i).build.list, isle(i).build && isle(i).build.level); if (villages[i]) { villages[i].setLevel(shownLv[i]); villages[i].setPlaces(buildings.places(i)); } }
      $('eraName').textContent = eraLabel();
    }
    // dev rà soát (nút ◀ ▶): đặt thẳng cả sáu đảo vào một thời, công trình của thời đó dựng sẵn, để xem kiến trúc từng thời. Chỉ cho
    // dev: lên cấp thật là do tài nguyên (logic/economy.js)
    function goEra(l) {
      l = Math.max(1, Math.min(Eras.COUNT, l)); if (l === G.level) return;
      devLevel(l); G.seasons.update(true); resyncAll(); for (const u of uis) if (u) u.render(true);
    }
    const jumpEra = () => goEra(G.level + 1); // bài kiểm tra chạy trình duyệt không giao diện
    /* ---------- Dev: đi qua từng năm của trận, tua tới sự kiện kế tiếp ----------
     * ▶ năm sau: chạy thật tới đầu năm sau (logic như chơi thường, chỉ nhanh); ◀ năm trước: dựng lại trận từ đầu với cùng seed
     * rồi chạy tới đầu năm trước (?seed=&day=), vì cùng seed ra cùng lịch sử. Sự kiện ⏭: chạy từng ngày tới khi có chuyện đáng xem
     * (quân đánh tới cổng hay vào thành, đảo chính, biểu tình, tên lửa đang bay), rồi bay tới đúng chỗ đó. */
    const YEAR = BK.Rules.YEAR_DAYS || 360;
    function busy(on, text) { for (const id of ['yearPrev', 'yearNext', 'nextEvent', 'nextDrama']) $(id).disabled = on; if (text) $('eraName').textContent = text; }
    function afterJump() { resyncAll(); syncWorld(); slow(); for (const u of uis) if (u) u.render(true); }
    $('yearNext').onclick = () => {
      if (world.day >= Eras.MATCH_DAYS) return;
      const to = Math.min(Eras.MATCH_DAYS, (Math.floor(world.day / YEAR) + 1) * YEAR);
      busy(true, 'Đang tua tới năm ' + (to / YEAR + 1) + '…');
      setTimeout(() => { World.jump(world, to); afterJump(); busy(false); }, 30); // để thanh dev kịp hiện chữ "đang tua"
    };
    $('yearPrev').onclick = () => {
      const y = Math.ceil(world.day / YEAR) - 1, to = Math.max(0, (y - 1) * YEAR);
      busy(true, 'Đang dựng lại trận…'); location.search = '?seed=' + seed + (to > 0 ? '&day=' + to : '');
    };
    // chuyện đáng xem lúc này: [đảo, chỗ (khoá chỗ trên đảo) hay null, tên]; kind 'war': trận đánh, tên lửa, nổi dậy, đảo chính;
    // 'drama': drama trong làng (biểu tình, ẩu đả, diễn thuyết…), đám tang, người đứng đầu cũ quỳ
    function eventNow(kind, only) {
      const want = (i) => only == null || only === i;
      if (kind === 'war') {
        for (const w of world.wars) {
          if (w.kind !== 'revolt' && ['gate', 'loot', 'inside'].includes(w.stage) && want(w.b)) return [w.b, w.stage === 'inside' && w.siege === 'hall' ? 'hall' : w.gate, 'quân ' + isle(w.a).name + ' đánh ' + isle(w.b).name];
          if (w.kind !== 'revolt' && w.stage === 'muster' && want(w.a) && only != null) return [w.a, null, 'tiễn quân ' + isle(w.a).name];
          if (w.kind === 'revolt' && want(w.a)) return [w.a, 'hall', 'nổi dậy ở ' + isle(w.a).name];
        }
        for (const m of world.missiles || []) if (!m.done && want(m.to)) return [m.to, m.key, (m.kind === 'nuke' ? 'hạt nhân' : 'tên lửa') + ' bay tới ' + isle(m.to).name];
        for (let i = 0; i < N; i++) { const S = isle(i); if (want(i) && S.situ.coup && !S.situ.coup.done) return [i, 'hall', 'đảo chính ở ' + S.name]; }
        return null;
      }
      for (let i = 0; i < N; i++) {
        if (!want(i)) continue; const S = isle(i), A = BK.Dramas.active(S)[0];
        if (A) return [i, A.key === 'riot' ? 'hall' : null, A.name.toLowerCase() + ' ở ' + S.name];
        const sc = (S.scenes || []).find((x) => x.until > S.day); if (sc) return [i, sc.kind === 'funeral' ? 'grave' : 'shrine', (sc.kind === 'funeral' ? 'đám tang ' : 'lễ tưởng niệm ') + sc.name];
        if (S.situ.kneel && S.situ.kneel.until > S.day) return [i, 'hall', 'người đứng đầu cũ quỳ ở ' + S.name];
      }
      return null;
    }
    function lookAt(i, key) {
      const pl = buildings.places(i), L = lands[i], at = key && pl ? (key === 'hall' ? pl.hall : (pl[key] && pl[key][0]) || pl.hall) : null;
      G.setFocus(i); G.flyTo(at ? at.clone().add(L.center) : L.center, at ? 30 : 96);
    }
    function seek(kind) {
      busy(true, 'Đang tìm ' + (kind === 'war' ? 'trận đánh' : 'drama') + ' kế tiếp…');
      setTimeout(() => {
        // chuyện đang diễn ra thì bỏ qua nó, tìm chuyện mới (tối đa 2 năm). Trận đánh: tua từng ngày trọn (World.jump chỉ chạy
        // chiến tranh, việc giữa các đảo khi qua trọn một ngày; trận ở cổng kéo dài nhiều ngày nên không lỡ). Drama ngắn hơn một
        // ngày: chạy từng nhịp như chơi thường (World.advance), dừng ở mỗi phần tư ngày
        const now = eventNow(kind), skip = now ? now[2] : null; let ev = null;
        for (let k = 0; k < (kind === 'war' ? 2 : 8) * YEAR && world.day < Eras.MATCH_DAYS; k++) {
          if (kind === 'war') World.jump(world, Math.floor(world.day) + 1); else World.advance(world, 0.25);
          const e = eventNow(kind);
          // drama: chỉ dừng ở chuyện ban ngày (tối, đêm thì một lát sau cả làng đi ngủ, không còn gì để xem)
          if (e && e[2] !== skip && (kind === 'war' || ['morning', 'noon', 'afternoon'].includes(BK.Schedule.phase(world.tod)))) { ev = e; break; }
        }
        afterJump(); busy(false);
        evNote = { text: ev ? ev[2] : 'không có ' + (kind === 'war' ? 'trận đánh' : 'drama') + ' nào trong 2 năm tới', until: performance.now() + 15000 };
        if (ev) { lookAt(ev[0], ev[1]); watch = { kind, i: ev[0] }; G.slowmo = SLOWMO; } // xem chậm ngay, theo đúng chuyện vừa tìm
        $('eraName').textContent = eraLabel();
      }, 30);
    }
    $('nextEvent').onclick = () => seek('war');
    $('nextDrama').onclick = () => seek('drama');
    // xem chậm: đảo đang xem (gần máy quay) có trận đánh hay drama thì thời gian chậm lại SLOWMO lần, cho kịp thấy từng người làm gì
    const SLOWMO = 1 / 16;
    // chuyện vừa tìm bằng nút (watch): xem chậm tới khi chuyện đó xong, dù máy quay còn đang bay tới
    let watch = null;
    function slowmoNow() {
      if (watch && eventNow(watch.kind, watch.i)) return SLOWMO; watch = null;
      const i = G.focus || 0, v = villages[i]; return v && v.visible && (eventNow('war', i) || eventNow('drama', i)) ? SLOWMO : 0;
    }
    $('eraName').textContent = eraLabel();
    // mở game là nhìn vào làng Lúa Vàng (cuộn ra để thấy cả bể)
    { const L = lands[0]; controls.target.copy(L.center).setY(1.5); camera.position.copy(L.center).addScaledVector(L.inw, 26).add(new THREE.Vector3(6, 17, 0)); if (window.innerWidth < 720) camera.position.sub(controls.target).multiplyScalar(1.5).add(controls.target); }
    villageOf(0); uiOf(0);
    // bấm vào một người (chạm nhẹ, không kéo) ở bất kỳ đảo nào đang vẽ người: mở thẻ người đó; bấm chỗ khác để đóng
    { const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(); let down = null;
      canvas.addEventListener('pointerdown', (e) => { down = [e.clientX, e.clientY]; });
      canvas.addEventListener('pointerup', (e) => {
        if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 6) return;
        ndc.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1); ray.setFromCamera(ndc, camera);
        let hit = -1, id = null; villages.forEach((v, i) => { if (v && v.visible && id == null) { const x = v.pick(ray); if (x != null) { id = x; hit = i; } } });
        if (hit >= 0) uiOf(hit);
        villages.forEach((v, i) => { if (v) v.select(i === hit ? id : null); });
        uis.forEach((u, i) => { if (u) u.select(i === hit ? id : null); });
      }); }
    // giữa các đảo: cầu theo danh sách của logic (dáng theo thời thấp hơn của hai đảo), đoàn buôn, quân (tin và bảng dev:
    // ui/race-dev.js)
    const travel = BK.Travel3D.create({ THREE, scene, lands3d, bridges3d, colors: G.TERRAINS.map((T) => T.color) });
    const war = BK.War3D.create({ THREE, scene, lands3d, bridges3d, colors: G.TERRAINS.map((T) => T.color) });
    // tên lửa, hạt nhân (logic/missiles.js W.missiles): bay vòng cung tới đúng chỗ nhắm, nổ (render/missiles3d.js)
    const missiles3d = BK.Missiles3D ? BK.Missiles3D.create({ THREE, scene, lands3d }) : null;
    function spotAt(i, key) {
      const pl = buildings.places(i); if (!pl) return null; const first = (a) => (a && a.length ? a[0] : null);
      if (key.startsWith('home:')) return (pl.homeSlots && pl.homeSlots[+key.slice(5)]) || first(pl.homes);
      return key === 'hall' ? pl.hall : first(key === 'farm' ? pl.field : pl[key]) || pl.hall;
    }
    // kiểu cầu: theo thời lúc xây (logic/diplomacy.js b.era); lên thời thì người đứng đầu quyết có xây lại hay không
    const bridgeStyle = (b) => Math.max(0, Math.min(Eras.COUNT, b.era) - 1);
    const hallAt = [], hallOf = (i) => hallAt[i] || null;
    const gateAt = [];
    let guestMind = new Map(); // việc của khách lần trước (theo khoá)
    function syncWorld() {
      if (!world.diplomacy) return;
      bridges3d.sync(world.bridges, bridgeStyle); bridges3d.syncWorks(world.bridgeWorks || []);
      // sân trước nhà chính của đảo bị sáp nhập (cờ đảo cai quản, render/war3d.js)
      world.islands.forEach((S, i) => { hallAt[i] = S.annexedBy != null ? buildings.places(i).hall : null; });
      // cổng của đảo đang bị đánh (quân ở xa vẽ trước đúng cổng đó: cổng chính hay cổng phụ, render/war3d.js)
      world.islands.forEach((S, i) => { const sg = S.situ.siege; if (!sg) { gateAt[i] = null; return; } const pl = buildings.places(i), g = pl && pl[sg.gate]; gateAt[i] = g && g.length ? g[0] : null; });
      // khách từ đảo khác (logic/diplomacy.js W.visits, chặng ở lại): vào bằng cổng phụ phía đảo mình, đi chợ (sứ giả: nhà chính);
      // gần lúc về thì đi ra cổng; xô xát ở đầu cầu thì đứng cãi với lính gác cổng đó
      const guests = world.islands.map(() => []);
      for (const v of world.visits || []) {
        if (v.stage !== 'stay') continue;
        const p = isle(v.from).people.get(v.pid); if (!p) continue;
        const enter = BK.War.sideOf(v.to, v.from) ? 'gateR' : 'gateL', leaving = world.day > v.leave - 0.3;
        const guard = v.brawl ? BK.Island.living(isle(v.to)).find((q) => q.job === 'sideguard' && q.postKey === (enter === 'gateR' ? 'gateRight' : 'gateLeft')) : null;
        const mind = guard && !leaving ? { state: 'talk', verb: 'chat', mood: 'argue', target: guard.id, place: enter, brawl: true }
          : leaving ? { state: 'walk', verb: null, place: enter } : v.kind === 'envoy' ? { state: 'work', verb: 'advise', place: 'hall' } : { state: 'work', verb: v.kind === 'trade' ? 'trade' : 'shop', place: 'market' };
        guests[v.to].push({ key: 'g' + v.from + ':' + v.pid, p, level: isle(v.from).level, mind, enter, brawl: v.brawl && !leaving, color: G.TERRAINS[v.from].color });
      }
      // trận trên đảo (logic/war.js onIsland): quân giặc, quân đồng minh tới giúp, quân đóng giữ là người thật mặc màu đảo mình,
      // mỗi người một việc theo chặng trận (đánh cổng, khuân hàng cướp, đốt phá, vây nhà chính)
      world.islands.forEach((S, i) => { for (const x of BK.War.onIsland(world, i)) guests[i].push({ key: x.key, p: x.p, level: isle(x.i).level, mind: x.mind, enter: x.enter, color: G.TERRAINS[x.i].color, side: x.side }); });
      // quân đang tập hợp ở cổng trước khi lên đường (logic/war.js sendOff): vẫn là người của làng (giữ khoá số, đi tiếp từ chỗ
      // đang đứng), người nhà ra tiễn (logic/siege.js roleOf)
      world.islands.forEach((S, i) => { const M = S.situ.muster; if (!M || M.until <= world.day) return; for (const id of M.troops) { const p = S.people.get(id); if (p && p.alive) guests[i].push({ key: id, p, level: S.level, mind: { state: 'work', verb: 'guard', place: M.gate, reason: 'tập hợp ở cổng, sắp lên đường đánh ' + M.to }, enter: 'home', color: null }); } });
      // việc không đổi thì giữ đúng đối tượng việc cũ (chu trình khuân hàng của phần vẽ chạy tiếp, không bắt đầu lại mỗi giây)
      const seen = new Map(); for (const list of guests) for (const g of list) { const j = JSON.stringify(g.mind), old = guestMind.get(g.key); if (old && old.j === j) g.mind = old.mind; seen.set(g.key, { j, mind: g.mind }); }
      guestMind = seen;
      guests.forEach((list, i) => { if (villages[i]) villages[i].setGuests(list); });
      // người ngã xuống còn nằm trên chiến trường (logic/war.js S.fallen): hai ngày
      world.islands.forEach((S, i) => { if (villages[i]) villages[i].setFallen((S.fallen || []).filter((x) => world.day - x.day < 2).map((x) => ({ id: x.id, at: x.at, color: G.TERRAINS[x.i].color }))); });
    }
    syncWorld();
    // mỗi khung hình: đưa thêm ngày lịch vào logic (chỉ chạy các bước cố định nguyên), lấy lại giờ trong ngày cho bầu trời
    function step(dDays) { World.advance(world, dDays); syncLevels(); }
    // mỗi khung hình: công trình theo tiến độ xây của logic, người của các đảo gần máy quay, xe nhường người
    function animate(dt, t, night) {
      const speed = G.time.tps / G.time.SPEEDS[0][0];
      for (let i = 0; i < N; i++) { syncEra(i, true); buildings.setProgress(i, isle(i).build && isle(i).build.list, isle(i).build && isle(i).build.level); }
      buildings.animate(dt, t, night, camera.position, speed);
      if (world.diplomacy) { const day = world.day + world.acc / World.TICKS_PER_DAY; travel.update(world.caravans, day, t, G.levelOf, world.visits); war.update(world, day, t, hallOf, (i) => !!(villages[i] && villages[i].visible), (i) => gateAt[i] || null);
        if (missiles3d) missiles3d.update(world.missiles, day, t, spotAt);
        G.dust = BK.Missiles ? BK.Missiles.dust(world, day) : 0; } // bụi hạt nhân: trời xám (render/sky3d.js)
      for (let i = 0; i < N; i++) {
        const d = camera.position.distanceTo(lands[i].center), v = villages[i];
        if (d < NEAR || (v && v.visible && d < FAR)) { const vv = villageOf(i); vv.setVisible(true); vv.update(dt, t, speed); buildings.setPeds(i, vv.peds()); }
        else if (v) { v.setVisible(false); buildings.setPeds(i, []); }
      }
    }
    // mỗi giây: nhãn thời kỳ, cầu giữa các đảo, chỗ đến của người (công trình vừa dựng xong, chỗ đang dựng), bảng làng
    function slow() { G.slowmo = slowmoNow(); $('eraName').textContent = eraLabel(); syncWorld();
      // đống hàng trong kho của từng đảo theo lượng hàng thật (render/build/workyards3d.js); chỗ hư trong chiến tranh (đang cháy khi còn giặc,
      // hay ba ngày sau khi bị hạt nhân)
      world.islands.forEach((S, i) => { const st = BK.Economy.state(S); buildings.setStock(i, Object.fromEntries(BK.Economy.RES.map((r) => [r, st.stock[r] / BK.Economy.CAP(S.level, r)]))); buildings.setGraves(i, (S.graves || []).length); buildings.setRuin(i, S.ruin, !!S.situ.siege || S.falloutUntil - world.day > 357, S.repairJob && S.repairJob.key); if (S.env && lands3d.thinTrees) lands3d.thinTrees(lands[i], S.env.forest); }); villages.forEach((v, i) => { if (v && v.visible) v.setPlaces(buildings.places(i)); }); uis.forEach((u) => u && u.render()); }
    Object.assign(G, { world, isle: isle(0), buildings, village: villages[0], villageUi: uis[0], villageOf, jumpEra, goEra, citiesRun: { step, animate, slow } });
  }
  BK.GameCities = { setup, buildPlan };
})(typeof self !== 'undefined' ? self : globalThis);
