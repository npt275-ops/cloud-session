/* Bể Kính · render/village3d.js
 * Người của một làng trên đảo: mỗi người một khung khớp (render/rig3d.js, nét vẽ đã chốt, trang phục theo thời và nhóm),
 * cử động bằng render/anim3d.js theo việc mà bộ não (logic/brain.js) đã chọn. Người đi tới chỗ cần đến theo công trình
 * của thời đang có (render/buildings3d.js places: nhà chính, sân, ruộng, nhà ở, chỗ tuần tra, cầu) hay tới gần người
 * mình nói chuyện, cãi nhau, đánh nhau. Nét mặt đổi theo việc (vui khi trò chuyện, giận khi cãi, sợ khi chạy, nhắm mắt
 * khi cầu nguyện), mắt tự chớp. Người đi đường đi dạo dọc phố theo mạng đường của đảo, gặp nhau thì dừng lại trò chuyện
 * rồi đi tiếp; drama (logic/dramas.js) gom người tới chỗ của nó: đám bạo loạn hô hào, người nghe đứng thành vòng quanh người nói. Tới nơi làm việc thì dùng cử chỉ trong thư viện (render/work3d.js: cuốc, gặt, đóng búa, canh
 * gác, diễn thuyết, ăn, ngồi...) và cầm đúng đồ; đêm thì vào nhà ngủ (không vẽ). Không có tên trên đầu: bấm vào người để mở thẻ.
 * Bộ phận cùng loại của mọi người là một khối lặp: khoảng 40 lượt vẽ cho cả làng dù đông bao nhiêu.
 * Đi đường (lối đi, vỉa hè, sang đường, tường thành, đi dạo): render/nav3d.js.
 * Cần: three.js, logic/brain.js, logic/people.js, logic/island.js, render/rig3d.js, render/anim3d.js, render/nav3d.js. Không sửa logic. */
(function (root, factory) {
  const BK = root.BK || (root.BK = {});
  BK.Village3D = factory(BK);
})(typeof self !== 'undefined' ? self : globalThis, function (BK) {
  'use strict';

  // biểu cảm: độ mở mắt, độ nghiêng và độ cao lông mày, hình miệng, má hồng
  const EXPR = {
    neutral: { eye: 1, tilt: 0, by: 0, mouth: 'line' }, happy: { eye: 0.62, tilt: -0.1, by: 0.01, mouth: 'smile', cheek: true },
    sad: { eye: 0.75, tilt: -0.45, by: 0.006, mouth: 'frown' }, angry: { eye: 0.55, tilt: 0.5, by: -0.012, mouth: 'line' },
    fear: { eye: 1.3, tilt: -0.4, by: 0.02, mouth: 'open' }, surprise: { eye: 1.4, tilt: 0, by: 0.035, mouth: 'open' }, closed: { eye: 0.1, tilt: 0, by: -0.008, mouth: 'line' },
  };

  function create(o) {
    const { THREE, scene, L, S } = o, Rig = BK.Rig3D, Anim = BK.Anim3D, Brain = BK.Brain, P = BK.People, Work = BK.Work3D;
    const SCALE = Rig.PERSON_SCALE;
    let level = o.level || 1, PL = o.places || null;
    const Nav = BK.Nav3D.create({ THREE, L, level: () => level, places: () => PL }); // lối đi: render/nav3d.js

    /* ---------- Những chỗ trong làng ---------- */
    // chỗ ra giữ cổng khi có chiến tranh: cổng phụ phía quân địch tới (logic/war.js ghi S.situ.warSide)
    const bridges = L.landing.map((v) => v.clone().multiplyScalar(0.86));
    const pickOf = (arr, k) => (arr && arr.length ? arr[Math.abs(k) % arr.length] : null);
    function spot(place, p) {
      if (!PL) return null;
      const k = p.id * 7 + Math.max(0, S.clans.indexOf(p.clan));
      // nhà theo gia đình: vợ chồng, con cái ở chung một nhà (theo người cha hay người mẹ đầu tiên của nhà đó)
      if (place === 'home' && p.home != null && PL.homeSlots && PL.homeSlots[p.home]) return PL.homeSlots[p.home]; // nhà riêng của hộ (logic/homes.js)
      if (place === 'home') { const fam = p.parents && p.parents.length && P.ageOf(p, S.day) < 18 ? p.parents[0] : Math.min(p.id, p.spouse || p.id); return pickOf(PL.homes, fam * 5 + Math.max(0, S.clans.indexOf(p.clan))); }
      if (place === 'hall') return PL.hall;
      if (place === 'square') return pickOf(PL.square, k);
      if (place === 'field') return pickOf(PL.field, k);
      if (place === 'guard') return pickOf(PL.guard, p.id);
      if (place === 'bridge') return bridges[S.situ.warSide || 0];
      if (place === 'gate') return PL.gate && PL.gate.length ? PL.gate[(p.post || 0) % PL.gate.length] : pickOf(PL.guard, p.id); // bốn chốt gác cổng thành
      if (place === 'gateL' || place === 'gateR') return PL[place] && PL[place].length ? PL[place][(p.post || 0) % PL[place].length] : pickOf(PL.guard, p.id); // hai chốt mỗi cổng phụ
      if (place === 'podium') return PL.podium || pickOf(PL.square, k); // bục diễn thuyết giữa sân
      if (place === 'nightGate') return pickOf([...(PL.gate || []), ...(PL.gateL || []), ...(PL.gateR || [])], p.id); // ca gác đêm ở các chốt cổng (logic/guards.js)
      if (place === 'hallLoop') return PL.hall; // (vòng đi dạo quanh nhà chính: hallGoal)
      // chỗ làm ra tài nguyên (logic/tasks.js WORK): bãi làm việc thật của đảo (render/build/workyards3d.js); kho (mang sản phẩm về),
      // bãi tập (luyện quân)
      if (place === 'woods') return pickOf(PL.wood, p.id);
      if (place === 'quarry') return pickOf(PL.stone, p.id);
      if (place === 'plant') return pickOf(PL.power, p.id);
      if (place === 'craft') return pickOf(PL.craft, p.id);
      if (place === 'store') return pickOf(PL.store, p.id);
      if (place === 'drill') return pickOf(PL.drill, p.id);
      if (place === 'grave') return pickOf(PL.grave, p.id);
      if (place === 'bridgeL' || place === 'bridgeR') return pickOf(PL[place === 'bridgeL' ? 'gateL' : 'gateR'], p.id); // đầu cầu: cổng phụ phía cầu (logic/diplomacy.js)
      if (place === 'site') return pickOf(PL.site && PL.site.length ? PL.site : PL.all, p.id);
      // đánh thành (logic/siege.js): chỗ đang bị phá hay đang sửa ('ruin:<khoá>'); chỗ dân dạt tới khi giặc vào thành: phía bên
      // kia đảo so với cổng bị đánh
      if (place && place.startsWith('ruin:')) return ruinSpot(place.slice(5), p.id);
      if (place === 'refuge') return refugeOf(p.id);
      if (place === 'market') return pickOf(PL.market, k);
      if (place === 'shrine') return pickOf(PL.shrine, k);
      if (place === 'school') return pickOf(PL.school, k);
      // đi vòng: người đi đường, thợ đi tu bổ, thầy thuốc đi thăm từng nhà, lính đi tuần đổi chỗ theo thời gian
      const hop = (arr, every) => pickOf(arr, p.id * 3 + Math.floor(S.day * every + (p.id % 7) * 0.13));
      if (place === 'stroll') return hop(PL.all, 5);
      if (place === 'repair') return hop(PL.all, 1.5);
      if (place === 'visit') return hop(PL.homes, 2);
      if (place === 'patrol') return hop(PL.guard, 3);
      return null;
    }
    // chỗ của một công trình theo khoá của logic/siege.js (bãi làm việc, nhà số, cổng)
    function ruinSpot(key, k) {
      if (key.startsWith('home:')) return (PL.homeSlots && PL.homeSlots[+key.slice(5)]) || pickOf(PL.homes, k);
      return pickOf(key === 'farm' ? PL.field : PL[key], k) || pickOf(PL.all, k);
    }
    // phía bên kia đảo so với cổng đang bị đánh, rải theo người (trong tường thành)
    function refugeOf(k) {
      const sg = S.situ.siege, g = (sg && pickOf(PL[sg.gate], 0)) || pickOf(PL.gate, 0) || PL.hall, a = Math.atan2(-g.z, -g.x) + (((k * 37) % 100) / 100 - 0.5) * 1.1;
      const R = L.rOf(a) * (0.42 + ((k * 13) % 20) / 100); const v = new THREE.Vector3(Math.cos(a) * R, 0, Math.sin(a) * R); Nav.keepInside(v); return v;
    }
    const setPlaces = (pl) => { PL = pl; Nav.reset(); };
    // khách từ đảo khác đang ở đảo này (game/cities.js mỗi giây, từ logic/diplomacy.js W.visits): [{ key, p, level, mind, enter }]
    let guests = [];
    const setGuests = (list) => { guests = list || []; }; // bục giữa sân có thể đổi theo thời: dựng lại mạng lối đi
    // người ngã xuống trong trận (logic/war.js S.fallen, game/cities.js mỗi giây): nằm lại trên đất ở chỗ đã ngã, áo màu đảo mình,
    // tới hết trận (hai ngày); người nhà đảo này thì có đám tang (logic/scenes.js)
    const FALLEN_MAX = 80, fbG = new THREE.BoxGeometry(0.42, 0.26, 1.0), fhG = new THREE.SphereGeometry(0.17, 8, 6); fbG.translate(0, 0.13, 0); fhG.translate(0, 0.16, 0.66);
    const fallenBody = new THREE.InstancedMesh(fbG, new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.8, flatShading: true }), FALLEN_MAX), fallenHead = new THREE.InstancedMesh(fhG, new THREE.MeshStandardMaterial({ color: '#d9a982', roughness: 0.8 }), FALLEN_MAX);
    for (let k = 0; k < FALLEN_MAX; k++) fallenBody.setColorAt(k, new THREE.Color('#ffffff'));
    for (const m of [fallenBody, fallenHead]) { m.count = 0; m.frustumCulled = false; scene.add(m); }
    function setFallen(list) {
      let n = 0; const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), V = new THREE.Vector3(), one = new THREE.Vector3(1, 1, 1), c = new THREE.Color();
      for (const x of list || []) {
        if (n >= FALLEN_MAX || !PL) break;
        const base = spot(x.at, { id: x.id, clan: null, home: null, post: x.id }); if (!base) continue;
        const a = x.id * 2.39996, r = 0.8 + (x.id % 7) * 0.45; V.set(base.x + Math.cos(a) * r, 0.02, base.z + Math.sin(a) * r); Nav.keepInside(V); V.add(L.center); V.y = L.center.y + 0.02;
        Q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), a * 3.1); M.compose(V, Q, one);
        fallenBody.setMatrixAt(n, M); fallenHead.setMatrixAt(n, M); fallenBody.setColorAt(n, c.set(x.color)); n++;
      }
      for (const m of [fallenBody, fallenHead]) { m.count = n; m.instanceMatrix.needsUpdate = true; m.visible = shownNow && n > 0; }
      if (fallenBody.instanceColor) fallenBody.instanceColor.needsUpdate = true;
    }

    /* ---------- Khối lặp cho từng loại bộ phận (tự nới chỗ khi làng đông lên) ---------- */
    const shapes = Rig.shapes(), mat = new THREE.MeshStandardMaterial({ roughness: 0.78, metalness: 0 }), glowMat = new THREE.MeshBasicMaterial({ toneMapped: false });
    const IM = {};
    function im(type, need) {
      let m = IM[type];
      if (m && m.instanceMatrix.count >= need) return m;
      const cap = Math.max(64, Math.ceil(need * 1.5));
      if (m) { scene.remove(m); m.dispose(); }
      m = new THREE.InstancedMesh(shapes[type], Rig.GLOW.has(type) ? glowMat : mat, cap);
      m.setColorAt(0, new THREE.Color()); // tạo bộ màu đủ chỗ trước khi đặt số lượng về 0
      m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); m.instanceColor.setUsage(THREE.DynamicDrawUsage); m.count = 0;
      m.castShadow = !Rig.GLOW.has(type); m.frustumCulled = false; m.userData.owner = []; scene.add(m); IM[type] = m;
      return m;
    }

    /* ---------- Mỗi người: khung, tư thế, vị trí ---------- */
    const folks = new Map();
    const ageBand = (a) => (a < 6 ? 'c' : a < 55 ? 'a' : 'o');
    function rigKey(p, age, lv) { return (lv || level) + '|' + p.role + '|' + p.job + '|' + ageBand(age); }
    // id: khoá trong folks (dân: mã số người; khách từ đảo khác: 'g' + đảo + ':' + mã số); lv: thời của đảo nhà người đó (trang phục);
    // color: khách mặc áo màu đảo nhà (nhìn là biết người từ đảo bên)
    function ensure(p, age, id, lv, start, color) {
      if (id == null) id = p.id;
      let f = folks.get(id); const key = rigKey(p, age, lv);
      if (f && f.key === key) return f;
      const rig = Rig.build(p, { level: lv || level, age });
      if (color) for (const part of rig.parts) if (part.type === 'shirt') part.color.set(color);
      for (const part of rig.parts) if (part.face) { part.dec = { p: new THREE.Vector3(), q: new THREE.Quaternion(), s: new THREE.Vector3() }; part.local.decompose(part.dec.p, part.dec.q, part.dec.s); }
      if (!f) {
        const h = start || spot('home', p), at = (h ? h.clone() : new THREE.Vector3()).add(new THREE.Vector3((Math.random() - 0.5) * 3, 0, (Math.random() - 0.5) * 3));
        f = { p, cur: Anim.blank(), pos: at, yaw: Math.random() * 6.28, ph: Math.random() * 6, jit: new THREE.Vector3(), blinkAt: Math.random() * 4, blink: 0, guest: typeof id === 'string' };
        folks.set(id, f);
      }
      // chỗ đứng lệch một chút quanh điểm đến (trước cửa, trước chỗ làm), không dồn đúng một điểm
      { const r = 0.7 + Math.sqrt(Math.random()) * 1.5, a = Math.random() * Math.PI * 2; f.jit.set(Math.cos(a) * r, 0, Math.sin(a) * r); } // đứng ngay trước chỗ làm, cửa nhà
      f.rig = rig; f.key = key; return f;
    }

    /* ---------- Đi tới đâu ---------- */
    const _v = new THREE.Vector3();
    function goalOf(f, mind) {
      const tgt = mind.target != null ? folks.get(mind.target) : null;
      if (tgt && (mind.state === 'talk' || mind.state === 'attack')) {
        // đứng nghe, đứng xem (drama): toả thành vòng rộng quanh người nói; trò chuyện, cãi, đánh: đứng sát
        const K = f.knobs, gap = mind.verb === 'listen' ? 2.6 + (f.p.id % 5) * 0.55 : mind.state === 'attack' ? 0.95 - K.lean * 0.2 : 1.3 + (K.lean < 0 ? -K.lean * 0.6 : 0);
        _v.copy(f.pos).sub(tgt.pos); if (_v.lengthSq() < 1e-4) _v.set(1, 0, 0);
        return { p: tgt.pos.clone().addScaledVector(_v.normalize(), gap), face: tgt.pos };
      }
      // đi theo một người (hộ vệ đi sau người đứng đầu, người nhà đi dạo cùng): đứng sau lưng người đó một chút
      if (mind.follow != null) { const tg = folks.get(mind.follow); if (tg) return { p: tg.pos.clone().add(new THREE.Vector3(-Math.sin(tg.yaw) * 1.5 + Math.cos(tg.yaw) * 0.6, 0, -Math.cos(tg.yaw) * 1.5 - Math.sin(tg.yaw) * 0.6)), face: null }; }
      if (mind.place === 'stroll') { const g = Nav.strollGoal(f); if (g) return g; }
      if (mind.place === 'hallLoop') { const g = Nav.hallGoal(f); if (g) return g; }
      // trước cửa nhà người mất (đám tang, logic/scenes.js); hàng người nhận khẩu phần trước kho lúc đói (thứ tự trong hàng: qRank)
      if (mind.place === 'homeSlot' && PL && PL.homeSlots && PL.homeSlots[mind.slot]) return { p: Nav.offCarriage(PL.homeSlots[mind.slot].clone().add(f.jit)), face: PL.homeSlots[mind.slot] };
      if (mind.place === 'queue' && PL && PL.store && PL.store.length) { const s1 = PL.store[Math.min(1, PL.store.length - 1)], dir = s1.clone().negate().setY(0).normalize(); return { p: s1.clone().addScaledVector(dir, 0.9 * ((f.qRank || 0) + 1)), face: s1 }; }
      // chuyền nước chữa cháy rừng (logic/ecology.js): hàng người từ giếng giữa làng ra bãi gỗ, mỗi người một chỗ theo thứ tự
      if (mind.place === 'bucket' && PL) { const w0 = pickOf(PL.square, 0), f0 = pickOf(PL.wood, 0) || pickOf(PL.outer, 0) || pickOf(PL.guard, 0); if (w0 && f0) { const u = ((mind.rank || 0) + 0.5) / Math.max(1, mind.of || 1), at = w0.clone().lerp(f0, u), nx = w0.clone().lerp(f0, Math.min(1, u + 0.05)); return { p: at, face: nx }; } }
      const base = spot(mind.place, f.p);
      if (mind.place === 'podium' && PL && PL.podium) return { p: base.clone(), face: PL.podiumFace }; // người diễn thuyết đứng giữa bục, nhìn ra sân
      const tight = mind.place === 'gate' || mind.place === 'gateL' || mind.place === 'gateR'; // lính gác đứng sát chốt của mình
      return base ? { p: Nav.offCarriage(tight ? base.clone().addScaledVector(f.jit, 0.15) : base.clone().add(f.jit)), face: null } : null;
    }
    /* ---------- Chu trình đầu vào, đầu ra (logic/tasks.js cycle; design/npc-song-that.md mục 3) ----------
     * người làm ra tài nguyên (workAt 'src'): làm ở chỗ làm → mang sản phẩm tới kho → cúi đặt xuống → quay lại
     * thợ xây (workAt 'dst'): ra kho → cúi nhặt vật liệu → mang tới công trình → dựng
     * Bước đổi khi tới nơi (làm đủ một mẻ thì đi, đặt nhặt xong thì đi); hàng chỉ hiện khi đang mang. */
    const STAGES = { src: ['work', 'carry', 'drop', 'back'], dst: ['fetch', 'pick', 'carry', 'work'] };
    const WORK_SECS = 9;                       // một mẻ làm (giây game), cộng thêm theo người
    function cycleOf(f, mind) {
      const C = mind.cycle; if (!C || mind.state !== 'work') { f.cyc = null; return null; }
      if (!f.cyc || f.cyc.mind !== mind) f.cyc = { mind, k: 0, until: 0, at: false, aim: null, stage: null };
      const st = STAGES[C.workAt][f.cyc.k], src = C.src, dst = C.dst;
      const place = st === 'work' ? (C.workAt === 'src' ? src : dst) : st === 'carry' || st === 'drop' ? dst : src;
      if (!f.cyc.aim || f.cyc.aim.place !== place) f.cyc.aim = Object.assign({}, mind, { place });
      f.cyc.stage = st; return f.cyc;
    }
    function cycleNext(f, arrived, ts) {
      const c = f.cyc; if (!c) return;
      if (!arrived) { c.at = false; return; }
      if (!c.at) { c.at = true; c.until = ts + (c.stage === 'work' ? WORK_SECS + (f.p.id % 5) * 1.5 : c.stage === 'drop' || c.stage === 'pick' ? 1.6 : 0); }
      if (ts >= c.until) { c.k = (c.k + 1) % 4; c.at = false; }
    }
    const carrying = (f) => !!f.cyc && (f.cyc.stage === 'carry' || f.cyc.stage === 'drop' || (f.cyc.stage === 'pick' && f.cyc.at));
    function exprOf(mind, X, p) {
      if (mind.mood === 'pray') return 'closed';
      if (mind.verb === 'mourn' || mind.verb === 'bear' || mind.verb === 'ration' || mind.verb === 'cry') return 'sad'; // tang, đói
      if (mind.state === 'attack' || mind.mood === 'argue') return 'angry';
      if (mind.state === 'panic') return 'fear';
      if (X.mourning || (X.drought && (mind.stress || 0) > 0.4)) return 'sad';
      if (mind.state === 'talk' || X.festival) return 'happy';
      if (X.war && p.job === 'soldier') return 'angry';
      return 'neutral';
    }

    /* ---------- Mỗi khung hình ---------- */
    const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _s = new THREE.Vector3(), _p = new THREE.Vector3(), _f = new THREE.Matrix4();
    let selected = null;
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.55, 0.72, 32), new THREE.MeshBasicMaterial({ color: '#ffd27a', transparent: true, opacity: 0.9, depthWrite: false, side: THREE.DoubleSide }));
    ring.rotation.x = -Math.PI / 2; ring.visible = false; scene.add(ring);
    const need = {};
    /* Ba đồng hồ (design/quy-trinh-tong-quat.md mục 1.1): đi lại và hẹn giờ (gặp nhau trên phố) theo giờ game (nhân tốc độ),
     * chia thành bước con STEP giây để ở 4× không ai đi vượt đích hay xuyên tường; cử chỉ tại chỗ theo giờ game nhưng nhanh nhất
     * GESTURE_MAX lần; chớp mắt theo giờ thực. speed: 1, 2, 4 (game/cities.js). */
    const STEP = 0.05, GESTURE_MAX = 2;
    let gameT = 0, gestT = 0;
    function update(dt, t, speed) {
      dt = Math.max(0, dt || 0); const k = speed || 1, real = Math.min(0.1, dt / 1000), sec = real * k, alive = new Set(), X = BK.Island.situNow(S);
      gameT += sec; gestT += real * Math.min(k, GESTURE_MAX); const ts = gameT, gs = gestT, rs = t * 0.001;
      // hàng nhận khẩu phần: thứ tự theo người tới trước (giữ thứ tự cũ, người mới đứng cuối)
      { const q = []; for (const [id] of folks) { const m = S.minds.get(id); if (m && m.place === 'queue') q.push(id); } q.sort((a, b) => (folks.get(a).qSince || 0) - (folks.get(b).qSince || 0) || a - b); q.forEach((id, n) => { const f = folks.get(id); if (!f.qSince) f.qSince = ts + n * 1e-3; f.qRank = n; }); for (const [, f] of folks) if (f.qSince && !q.includes(f.p.id)) f.qSince = 0; }
      const kingF = S.seats.king != null ? folks.get(S.seats.king) : null, hungry = S.food < 0.5;
      // người có mặt trên đảo: dân (trừ người đi vắng: đi đánh, đóng giữ, sang đảo khác) và khách từ đảo khác (setGuests)
      const roster = []; for (const p of S.people.values()) if (p.alive && !p.away) roster.push([p.id, p, null]); for (const g of guests) roster.push([g.key, g.p, g]);
      for (const [key, p, gst] of roster) {
        alive.add(key);
        const age = P.ageOf(p, S.day), f = ensure(p, age, key, gst ? gst.level : level, gst ? spot(gst.enter, p) : null, gst && gst.color), mind = gst ? gst.mind : S.minds.get(p.id) || { state: 'idle' };
        f.knobs = Object.assign(Brain.knobs(p.genome, mind.stress || 0, P.traits(p)), { seed: p.id * 1.7 }); // tính cách biểu hiện (logic/epigen.js)
        const cyc = cycleOf(f, mind), aim = cyc ? cyc.aim : mind; // chu trình: đi tới chỗ của bước đang làm
        let goal = goalOf(f, aim), meetVerb = null, meetGoal = null;
        // gặp người quen trên phố: hai người đang đi dạo gặp nhau thì dừng lại trò chuyện vài giây rồi đi tiếp
        if (f.meet) { const o2 = folks.get(f.meet.id); if (ts < f.meet.until && o2 && o2.meet && o2.meet.id === key) { meetGoal = { p: f.pos.clone(), face: o2.pos }; meetVerb = 'chat'; } else { f.meet = null; f.meetCool = ts + 18 + (p.id % 7) * 3; } }
        else if ((mind.place === 'stroll' || mind.place === 'hallLoop') && goal && goal.road && !(ts < (f.meetCool || 0))) {
          for (const [oid, o2] of folks) {
            if (oid === key || o2.meet || !o2.strolling || ts < (o2.meetCool || 0)) continue;
            if ((o2.pos.x - f.pos.x) ** 2 + (o2.pos.z - f.pos.z) ** 2 < 2.6) { const until = ts + 3.5 + Math.random() * 4; f.meet = { id: oid, until }; o2.meet = { id: key, until }; meetGoal = { p: f.pos.clone(), face: o2.pos }; meetVerb = 'chat'; break; }
          }
        }
        f.strolling = (mind.place === 'stroll' || mind.place === 'hallLoop') && !meetVerb;
        // đi theo giờ game, từng bước con: mỗi bước tìm lại đích (lối đi, điểm kế tiếp trên phố), đi một đoạn, giữ trong tường thành
        let moving = false;
        const n = Math.max(1, Math.ceil(sec / STEP)), h = sec / n;
        for (let i = 0; i < n; i++) {
          if (i) goal = meetGoal ? null : goalOf(f, aim);
          let g = meetGoal || goal;
          if (g && !meetVerb && !g.road) g = Nav.follow(f, g); // đi theo lối đi, không xuyên tường, xuyên nhà (render/nav3d.js)
          if (!g) break;
          _v.copy(g.p).sub(f.pos); _v.y = 0;
          const d = _v.length(), run = mind.state === 'panic' || (mind.state === 'attack' && d > 2) || d > 14;
          const speed = (run ? 3.4 : mind.verb === 'sleep' ? 2 : 1.25) * f.knobs.tempo * (0.8 + 0.4 * f.knobs.stride) * (carrying(f) || mind.carryItem ? 0.85 : 1) * (hungry ? 0.8 : 1); // tối muộn về ngủ thì rảo bước; mang hàng, đói thì chậm lại
          if (d > 0.25) { moving = true; const step = Math.min(d, speed * h); f.pos.addScaledVector(_v.normalize(), step); Nav.keepInside(f.pos); f.ph += step / ((0.55 + 0.3 * f.knobs.stride) * SCALE) * Math.PI; turnTo(f, Math.atan2(_v.x, _v.z), h); }
          else { if (g.face) { _v.copy(g.face).sub(f.pos); turnTo(f, Math.atan2(_v.x, _v.z), h); } break; }
        }
        if (!moving) f.ph += real * 3 * f.knobs.tempo;
        if (cyc) cycleNext(f, !moving && !!goal && Math.hypot(goal.p.x - f.pos.x, goal.p.z - f.pos.z) < 0.8, ts);
        // tới nơi thì làm việc bằng cử chỉ trong thư viện (render/work3d.js); đang đi, hay đang có sự kiện thì cử động theo trạng thái
        // cử chỉ làm việc chỉ ở chỗ làm (bước 'work' của chu trình), không ở kho, không trên đường
        const verb = meetVerb || mind.verb, working = !moving && verb && verb !== 'sleep' && (!cyc || cyc.stage === 'work' || meetVerb) && (meetVerb || mind.state === 'work' || (mind.state === 'talk' && !mind.mood));
        f.inside = !moving && (verb === 'sleep' || verb === 'hide'); // ngủ, trốn giặc: vào trong nhà (không vẽ)
        let tgt, gface = null;
        if (working && Work) {
          if (f.verb !== verb || gs > f.gEnd) { // đổi việc, hay hết một lượt cử chỉ: sang cử chỉ khác của việc đó (đồng hồ cử chỉ gs)
            f.turn = f.verb === verb ? (f.turn || 0) + 1 : 0; f.verb = verb;
            f.work = Work.gestureOf(verb, level, p.id, f.turn); f.gStart = gs;
            f.gEnd = gs + (f.work && !f.work.G.loop ? f.work.G.dur + 0.8 : 6 + (p.id % 4));
          }
          if (f.work) { const G = f.work.G, u = G.loop ? 0 : Math.min(1, (gs - f.gStart) / G.dur); tgt = Anim.basePose(f.knobs); G.pose(tgt, f.ph, u, gs, f.knobs); Anim.addLife(tgt, gs, f.knobs); gface = G.face; f.tool = f.work.tool; f.gk = G.key; }
        }
        // mang hàng: đi bằng cử chỉ vác hay ôm (render/work3d.js carryOf); tới kho, tới công trình thì cúi đặt, nhặt
        if (!tgt && cyc && Work && carrying(f)) {
          const c = Work.carryOf(mind.cycle.item), put = BK.Gestures3D.BY_KEY[Work.PUT];
          if (c && moving && cyc.stage === 'carry') { tgt = Anim.basePose(f.knobs); c.G.pose(tgt, f.ph, 0, gs, f.knobs); f.tool = c.tool; f.verb = null; f.gk = 'mang:' + c.G.key; }
          else if (c && put && !moving) { tgt = Anim.basePose(f.knobs); put.pose(tgt, f.ph, 0, gs, f.knobs); f.tool = c.tool; f.verb = null; f.gk = 'đặt nhặt'; }
        }
        // khiêng quan tài (đám tang): ôm trước ngực mà đi
        f.carryNow = false;
        if (!tgt && mind.carryItem && Work && moving) { const c = Work.carryOf(mind.carryItem); if (c) { tgt = Anim.basePose(f.knobs); c.G.pose(tgt, f.ph, 0, gs, f.knobs); f.tool = c.tool; f.verb = null; f.gk = 'mang:' + c.G.key; f.carryNow = true; } }
        // lính gác cổng phụ cãi lại khách đang xô xát ở đầu cầu (khách từ đảo khác, game/cities.js)
        if (!gst && !moving && (mind.place === 'gateL' || mind.place === 'gateR')) { const g = guests.find((x) => x.brawl && x.mind.target === p.id); const gf = g && folks.get(g.key); if (gf && gf.pos.distanceToSquared(f.pos) < 9) { tgt = Anim.target('talk', f.ph, gs, f.knobs, { mood: 'argue', moving: false }); f.tool = null; f.gk = 'cãi'; _v.copy(gf.pos).sub(f.pos); turnTo(f, Math.atan2(_v.x, _v.z), real); } }
        // lính gác cúi chào khi người đứng đầu đi ngang qua chốt (mỗi lần đi ngang chào một lần)
        if (kingF && kingF !== f && !moving && (mind.place === 'gate' || mind.place === 'gateL' || mind.place === 'gateR' || mind.place === 'nightGate') && kingF.moving && kingF.pos.distanceToSquared(f.pos) < 25 && !(ts < (f.salCool || 0))) { f.salUntil = gs + 1.6; f.salCool = ts + 15; }
        if (f.salUntil > gs) { const G = BK.Gestures3D.BY_KEY.bow; tgt = Anim.basePose(f.knobs); G.pose(tgt, f.ph, Math.min(1, 1 - (f.salUntil - gs) / 1.6), gs, f.knobs); f.tool = null; f.gk = 'chào'; if (kingF) { _v.copy(kingF.pos).sub(f.pos); turnTo(f, Math.atan2(_v.x, _v.z), real); } }
        if (!tgt) { f.verb = null; f.tool = null; f.gk = null; tgt = Anim.target(mind.state, f.ph, gs, f.knobs, { habit: p.genome.habit, mood: mind.mood, moving }); }
        // đánh trận: lính (cả quân đảo khác) cầm giáo; dân tự nguyện cầm đồ nghề của mình làm vũ khí
        if (mind.state === 'attack' && (S.situ.siege || gst)) f.tool = gst || p.job === 'soldier' || p.job === 'gatekeeper' || p.job === 'sideguard' || /general/.test(p.role || '') ? 'spear' : p.job === 'builder' ? 'hammer' : p.res === 'wood' ? 'axe' : 'hoe';
        f.moving = moving; f.meetVerb = meetVerb;
        Anim.apply(f.rig, f.cur, tgt, dt);
        const sc = age >= 16 ? 1 : 0.5 + 0.5 * Math.max(0, age) / 16;
        f.rig.root.position.copy(L.center).add(f.pos); f.rig.root.position.y += (f.cur.ty || 0) * sc * SCALE; // ngồi, quỳ thì hạ người
        f.rig.root.rotation.set(f.cur.rx || 0, f.yaw, 0, 'YXZ'); f.rig.root.scale.setScalar(sc * SCALE);
        f.rig.root.updateMatrixWorld(true);
        // chớp mắt vài giây một lần
        if (rs > f.blinkAt) { f.blink = 0.14; f.blinkAt = rs + 2.2 + Math.random() * 3; } // giờ thực
        f.blink = Math.max(0, f.blink - real);
        const ek = meetVerb ? 'happy' : gface && EXPR[gface] && !X.war && !X.mourning && !mind.mood && !hungry ? gface : exprOf(mind, X, p) === 'neutral' && hungry ? 'sad' : exprOf(mind, X, p); // bạo loạn, cãi nhau: giận (mood) dù đang làm cử chỉ
        f.expr = EXPR[ek] || EXPR.neutral; f.closed = f.expr === EXPR.closed || f.blink > 0;
      }
      for (const [id] of folks) if (!alive.has(id)) { folks.delete(id); if (selected === id) selected = null; }
      // đếm chỗ cần cho từng loại bộ phận, rồi đổ vào các khối lặp
      for (const k in need) need[k] = 0;
      for (const [, f] of folks) if (!f.inside) for (const part of f.rig.parts) need[part.type] = (need[part.type] || 0) + 1;
      for (const type in need) { const m = im(type, need[type]); m.count = 0; m.userData.owner.length = 0; }
      for (const [id, f] of folks) {
        if (f.inside) continue;
        const E = f.expr || EXPR.neutral;
        for (const part of f.rig.parts) {
          let local = part.local;
          if (part.face) {
            const F = part.face, D = part.dec;
            if (F.startsWith('tool:')) { if (F.slice(5) !== f.tool) continue; }
            else if (F.startsWith('mouth:') && F.slice(6) !== E.mouth) continue;
            if (F === 'cheek' && !E.cheek) continue;
            if (F === 'shine' && f.closed) continue;
            if (F === 'eye') { _s.copy(D.s); _s.y *= f.closed ? 0.12 : E.eye; local = _f.compose(D.p, D.q, _s); }
            else if (F === 'browL' || F === 'browR') { const sx = F === 'browL' ? 1 : -1; _p.copy(D.p); _p.y += E.by + (f.closed ? -0.01 : 0); _q.setFromEuler(_e.set(0, 0, sx * E.tilt * 0.5)); local = _f.compose(_p, _q, D.s); }
          }
          const m = IM[part.type], i = m.count; if (i >= m.instanceMatrix.count) continue;
          _m.multiplyMatrices(part.node.matrixWorld, local); m.setMatrixAt(i, _m); m.setColorAt(i, part.color); m.userData.owner[i] = id; m.count++;
        }
      }
      for (const type in IM) { const m = IM[type]; if (!need[type]) m.count = 0; m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; }
      const sf = selected != null && folks.get(selected);
      ring.visible = !!sf; if (sf) ring.position.copy(sf.rig.root.position).setY(sf.rig.root.position.y + 0.06);
    }
    function turnTo(f, yaw, sec) { let d = yaw - f.yaw; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; f.yaw += d * Math.min(1, sec * 8); }
    // đổi thời: mọi người thay trang phục ngay ở nhịp vẽ sau
    const setLevel = (l) => { level = l; };

    /* ---------- Bấm chọn một người ---------- */
    function pick(raycaster) {
      let best = null, bd = 1e9;
      for (const type of ['head', 'shirt', 'shorts', 'hairCap', 'skirt']) {
        const m = IM[type]; if (!m || !m.count) continue;
        for (const h of raycaster.intersectObject(m)) if (h.distance < bd && h.instanceId != null && typeof m.userData.owner[h.instanceId] === 'number') { bd = h.distance; best = m.userData.owner[h.instanceId]; } // khách từ đảo khác: không mở thẻ người
      }
      return best;
    }
    const select = (id) => { selected = id; };
    const worldPos = (id) => { const f = folks.get(id); return f ? f.rig.root.position.clone() : null; };
    const drawCalls = () => Object.values(IM).filter((m) => m.count).length;
    // vị trí những người đang ở ngoài (toạ độ đảo) để xe nhường người đi bộ (render/buildings3d.js setPeds)
    const pedList = [];
    function peds() { pedList.length = 0; for (const [, f] of folks) if (!f.inside) pedList.push(f.pos); return pedList; }
    // ẩn, hiện cả làng (đảo xa máy quay thì không vẽ người, game/cities.js); hiện lại thì ai nấy đứng ngay chỗ đáng ra đang ở
    let shownNow = true;
    function setVisible(on) {
      if (on === shownNow) return; shownNow = on;
      for (const k in IM) IM[k].visible = on; if (!on) ring.visible = false;
      fallenBody.visible = fallenHead.visible = on && fallenBody.count > 0;
      if (on) for (const [, f] of folks) { const mind = S.minds.get(f.p.id) || { state: 'idle' }, g = goalOf(f, mind); if (g) f.pos.copy(g.p); f.nav = null; f.route = null; f.meet = null; }
    }
    // kiểm thử "không vô nghĩa" (design/npc-song-that.md mục 7.1): ở khung hình vừa vẽ, ai làm cử chỉ không hợp với việc,
    // mang hàng khi không đi giữa chỗ làm và kho, hay làm việc khi đang đi, ở chỗ không phải chỗ làm. Trả về danh sách vi phạm
    const LOAD = new Set(['sack', 'log', 'basket', 'crate']);
    function audit() {
      const bad = [];
      for (const [id, f] of folks) {
        if (!f.rig || f.inside) continue;
        const mind = S.minds.get(id) || {}, why = (t) => bad.push(t + ' · người ' + id + ' (' + (mind.verb || mind.state) + ')');
        if (f.work && f.gk === f.work.G.key && !f.meetVerb) {
          if (f.moving) why('làm cử chỉ ' + f.gk + ' khi đang đi');
          if (Work && !Work.allowed(f.verb, level).has(f.gk)) why('cử chỉ ' + f.gk + ' không thuộc việc ' + f.verb);
          if (f.cyc && f.cyc.stage !== 'work') why('làm việc ở bước ' + f.cyc.stage + ' (không ở chỗ làm)');
        }
        if (LOAD.has(f.tool) && !carrying(f) && !f.carryNow) why('mang ' + f.tool + ' khi không chở hàng');
      }
      return bad;
    }
    return { update, pick, select, audit, setGuests, setFallen, worldPos, peds, setPlaces, setLevel, drawCalls, setVisible, get visible() { return shownNow; }, get selected() { return selected; }, get count() { return folks.size; }, get indoors() { let n = 0; for (const [, f] of folks) if (f.inside) n++; return n; } };
  }

  return { create, EXPR };
});
