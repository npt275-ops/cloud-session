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

  // chỗ đứng trên mặt cầu khi đánh cổng (design/ke-hoach-buoc-12.md): quân hàng bốn người, hàng đầu cách cổng (tầm bắn − 5: hai hàng đầu
  // hai bên bắn tới nhau), tức cách đầu cầu (tầm bắn − 5 − gap; gap: cổng phụ nằm sâu trong mép đảo chừng 7 đơn vị), không ra khỏi mặt cầu;
  // xe, máy công thành hai làn sau hàng quân cuối. Cầu ngắn (hay quân đông, tầm xa ở thời cuối) thì các hàng, các xe đứng sít lại,
  // còn thiếu chỗ thì hàng đầu tiến gần cổng hơn (vẫn trong tầm), để không ai bị dồn chồng lên nhau ở cuối cầu. len: dài mặt cầu; rg: tầm bắn; nT: số quân;
  // nG: số xe (không kể drone); gap: khoảng từ cổng tới đầu cầu. Trả khoảng cách từ đầu cầu phía đảo bị đánh: troop(k), gear(k)
  const DECK = { IN: 5, ROW: 1.3, ROW_MIN: 0.95, GEAR: 6, GEAR_MIN: 3.6, GEAR_IN: 3 };
  function deckPlan(len, rg, nT, nG, gap) {
    const R = Math.max(1, Math.ceil(nT / 4)), P = Math.ceil((nG || 0) / 2), avail = Math.max(4, len * 0.97 - 1);
    let front = Math.max(0.5, rg - DECK.IN - (gap || 0)), row = DECK.ROW, gear = DECK.GEAR;
    const need = () => front + (R - 1) * row + (P ? DECK.GEAR_IN + (P - 1) * gear : 0);
    if (need() > avail) { const k = Math.max(0, (avail - front - (P ? DECK.GEAR_IN : 0)) / ((R - 1) * row + (P ? (P - 1) * gear : 0) || 1));
      row = Math.max(DECK.ROW_MIN, row * Math.min(1, k)); gear = Math.max(DECK.GEAR_MIN, gear * Math.min(1, k)); }
    if (need() > avail) front = Math.max(0.5, front - (need() - avail));
    const last = front + (R - 1) * row;
    return { troop: (k) => Math.min(avail, front + Math.floor(k / 4) * row), gear: (k) => Math.min(avail, last + DECK.GEAR_IN + Math.floor(k / 2) * gear) };
  }

  function create(o) {
    const { THREE, scene, L, S } = o, Rig = BK.Rig3D, Anim = BK.Anim3D, Brain = BK.Brain, P = BK.People, Work = BK.Work3D;
    const SCALE = Rig.PERSON_SCALE;
    const shots = o.shots || null; // tên, đạn bay (render/shots3d.js, game/cities.js tạo dùng chung)
    const camera = o.camera || null, LOD_FAR = 40; let frameNo = 0; // người ở xa máy quay cập nhật thưa hơn
    const bars = o.bars || null;   // thanh máu (render/hpbars3d.js): người đang ra trận, người bị thương
    const UNSTICK_S = 3, UNSTICK_D = 0.5, SEP = 0.6; let stuckN = 0, stuckHard = 0, phantom = 0; // gỡ người kẹt: đi chừng này giây (giờ game) không tiến được chừng này đơn vị (đếm số lần cho auditStats)
    let level = o.level || 1, PL = o.places || null;
    const Nav = BK.Nav3D.create({ THREE, L, level: () => level, places: () => PL }); // lối đi: render/nav3d.js

    /* ---------- Những chỗ trong làng ---------- */
    // chỗ ra giữ cổng khi có chiến tranh: cổng phụ phía quân địch tới (logic/war.js ghi S.situ.warSide)
    const bridges = L.landing.map((v) => v.clone().multiplyScalar(0.86));
    const hopS = new WeakMap(); // đi vòng (spot hop): chỗ thứ mấy, tới lúc nào
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
      // sân chơi của làng: bãi trống phía ngoài một dãy nhà dân, trẻ nhỏ chơi thành nhóm, người già ngồi trông
      if (place === 'playground') { if (PL.playground) return PL.playground;
          const h = PL.homes && PL.homes.length ? PL.homes[Math.floor(PL.homes.length / 2)] : null;
          return h ? h.clone().addScaledVector(h.clone().setY(0).normalize(), 4.5) : pickOf(PL.square, 0); } // bãi trống ngoài dãy nhà, xa nhà chính
      if (place === 'market') return (S.decline ? null : pickOf(PL.market, k)) || pickOf(PL.store, k) || pickOf(PL.square, k); // thời chưa có chợ: trao đổi ở kho, ở sân; suy tàn: chợ đóng cửa, mua ở kho
      if (place === 'shrine') return pickOf(PL.shrine, k);
      if (place === 'school') return pickOf(PL.school, k);
      // đi vòng: người đi đường, thợ đi tu bổ, thầy thuốc đi thăm từng nhà, lính đi tuần: tới chỗ này, ở lại dwell giây game rồi mới
      // sang chỗ kế tiếp (không đổi chỗ theo đồng hồ: chưa tới nơi đã đổi hướng thì người đi tới đi lui, bị coi là kẹt)
      const hop = (arr, dwell) => {
        if (!arr || !arr.length) return null;
        let s = hopS.get(p); if (!s || s.place !== place) { s = { place, i: p.id * 3 + (p.id % 7), at: null }; hopS.set(p, s); }
        const tgt = pickOf(arr, s.i), f = folkOf.get(p);
        if (f && tgt && (f.pos.x - tgt.x) ** 2 + (f.pos.z - tgt.z) ** 2 < 9) { if (s.at == null) s.at = gameT; else if (gameT - s.at > dwell) { s.i++; s.at = null; } }
        return pickOf(arr, s.i);
      };
      if (place === 'stroll') return hop(PL.all, 4);
      if (place === 'repair') return hop(PL.all, 12);
      if (place === 'visit') return hop(PL.homes, 10);
      if (place === 'patrol') return hop(PL.guard, 6);
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
      const R = L.rOf(a) * (0.42 + ((k * 13) % 20) / 100); const v = new THREE.Vector3(Math.cos(a) * R, 0, Math.sin(a) * R); Nav.keepInside(v); return Nav.offCarriage(v); // (không đứng giữa lòng đường, chặn xe)
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
      const keep = new Set();
      for (const x of list || []) {
        if (n >= FALLEN_MAX || !PL) break;
        // ngã trong trận đang xem gần: nằm đúng chỗ đứng lúc trúng đạn, quay theo hướng đang đứng (bodies, takeHits)
        const bk = x.i + ':' + x.id, B = bodies.get(bk);
        if (B) { keep.add(bk); V.copy(B.pos).add(L.center); V.y = L.center.y + 0.02 + Math.max(0, B.pos.y); Q.setFromAxisAngle(new THREE.Vector3(0, 1, 0),
            B.yaw + Math.PI); M.compose(V, Q, one); fallenBody.setMatrixAt(n, M); fallenHead.setMatrixAt(n, M); fallenBody.setColorAt(n, c.set(x.color)); n++;
            continue; }
        // quân đánh ngã trước cổng lúc không ai xem: nằm trên mặt cầu (chỗ quân đánh đứng nã cổng), không nằm trong thành
        const sg = S.situ.siege, br = /^gate/.test(x.at) && x.i !== o.idx && o.deck ? (sg && sg.bridge != null ? sg.bridge : x.i) : null,
          dk = br != null ? o.deck(br, 0.25 + ((x.id * 7) % 10) / 30) : null;
        if (dk) { const nx = o.deck(br, 0.3), al = nx ? nx.clone().sub(dk).setY(0) : null; if (al && al.lengthSq() > 1e-6) dk.addScaledVector(new THREE.Vector3(-al.z, 0, al.x).normalize(), (((x.id * 13) % 7) - 3) * 0.4);
          V.copy(dk).add(L.center); V.y = L.center.y + dk.y + 0.02; Q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), x.id * 2.39996 * 3.1); M.compose(V, Q, one);
          fallenBody.setMatrixAt(n, M); fallenHead.setMatrixAt(n, M); fallenBody.setColorAt(n, c.set(x.color)); n++; continue; }
        const base = spot(x.at, { id: x.id, clan: null, home: null, post: x.id }); if (!base) continue;
        const a = x.id * 2.39996, r = 0.8 + (x.id % 7) * 0.45; V.set(base.x + Math.cos(a) * r, 0.02, base.z + Math.sin(a) * r);
        // ngã ở cổng: chỗ đứng của chốt gác nằm trong khung cổng, dịch vào phía trong thành vài bước cho khỏi lẫn vào nhà cổng
        if (/^gate/.test(x.at)) { const inw = V.clone().setY(0); if (inw.lengthSq() > 1) V.addScaledVector(inw.normalize(), -4.5); } Nav.keepInside(V); V.add(L.center); V.y = L.center.y + 0.02;
        Q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), a * 3.1); M.compose(V, Q, one);
        fallenBody.setMatrixAt(n, M); fallenHead.setMatrixAt(n, M); fallenBody.setColorAt(n, c.set(x.color)); n++;
      }
      for (const k of [...bodies.keys()]) if (!keep.has(k) && bodies.get(k).seen) bodies.delete(k); else bodies.get(k).seen = true; // logic đã dọn chiến trường
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
    const folks = new Map(), folkOf = new WeakMap(); // folkOf: người logic → người đang vẽ (spot: đi vòng theo chỗ đã tới)
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
        f = { fresh: true, p, cur: Anim.blank(), pos: at, yaw: Math.random() * 6.28, ph: Math.random() * 6, jit: new THREE.Vector3(), blinkAt: Math.random() * 4, blink: 0, guest: typeof id === 'string' };
        folks.set(id, f);
      }
      folkOf.set(p, f); f.mid = id; // (khoá của người này trong folks: mind.target của người khác trỏ tới khoá này)
      // chỗ đứng lệch một chút quanh điểm đến (trước cửa, trước chỗ làm), không dồn đúng một điểm
      // đứng ngay trước chỗ làm, cửa nhà; mỗi người một chỗ quanh đó theo khoá riêng (người làng: mã; khách, quân đảo khác: 'w<đảo>:<mã>',
      // vì mã người đánh theo từng đảo nên phải tính cả đảo), xếp theo góc vàng để hai người cùng chỗ không đứng chồng lên nhau
      { let n = 0; for (const ch of String(id)) n = (n * 31 + ch.charCodeAt(0)) % 9973; const r = 0.8 + ((n % 11) / 11) * 1.5, a = n * 2.39996; f.jit.set(Math.cos(a) * r, 0, Math.sin(a) * r); }
      f.rig = rig; f.key = key; return f;
    }

    /* ---------- Phát trúng thật (design/ke-hoach-khac-phuc.md mục 2.1, 2.3) ----------
     * logic/war.js ghi mỗi phát trúng trên đảo vào W.hitLog { seq, isle, i, id, by, byI, dmg, kill } (game/cities.js đưa qua o.hits).
     * Đảo đang vẽ gần: viên đạn bay từ người bắn (by, không thấy thì người bên kia gần nhất) tới người trúng; khi tới thì thanh máu
     * tụt (f.hpShow); phát hết máu thì người đó ngã đúng lúc đạn tới, nằm đúng chỗ đứng (bodies). */
    const idx = o.idx != null ? o.idx : -1, ownColor = o.color || null, bodies = new Map();
    let hitSeq = -1;
    const keyOf = (i, id) => (i === idx ? id : 'w' + i + ':' + id);
    function takeHits(rs) {
      const log = o.hits ? o.hits() : null; if (!log || !log.length) return;
      if (hitSeq < 0) { hitSeq = log[log.length - 1].seq; return; } // lần đầu: bỏ qua phát cũ
      for (const h of log) {
        if (h.seq <= hitSeq) continue; hitSeq = h.seq;
        if (h.isle !== idx || !shownNow) continue;
        const v = folks.get(keyOf(h.i, h.id)); if (!v) continue;
        // người bắn: người logic ghi lại nếu đang đứng trong tầm; không thì người gần nhất bên kia đang trong tầm (đạn không bay từ
        // ngoài tầm vũ khí tới)
        let sh = h.by != null ? folks.get(keyOf(h.byI, h.by)) : null;
        const inRange = (q) => q && q.rig && q.pos.distanceToSquared(v.pos) <= (q.range || SIGHT) ** 2;
        if (!inRange(sh)) { sh = null; let bd = 1e9; for (const o2 of v.side === 'foe' ? sightDef : sightFoe) { const d = o2.pos.distanceToSquared(v.pos); if (d < bd && inRange(o2)) { bd = d; sh = o2; } } }
        const K = BK.Arms ? BK.Arms.kit(sh && sh.gst ? sh.gst.level : level) : null, kind = (K && BK.Shots3D && BK.Shots3D.OF[K.ranged]) || ['arrow'];
        const to = v.pos.clone().add(L.center); to.y += 0.9 * SCALE;
        // trúng đạn máy công thành (logic/arms.js): đạn bay ra từ chiếc xe gần nhất (game/cities.js siegeGear, toạ độ thế giới)
        let eng = null; if (!sh && h.eng && o.gear) { let bd = 1e9; for (const e of o.gear() || []) { if (!e.at || !BK.Shots3D.OF[e.kind]) continue; const d = e.at.distanceToSquared(to); if (d < bd) { bd = d; eng = e; } } }
        // phục kích (logic/battles.js): người phục kích nấp trên bờ hai bên đầu cầu (không vẽ người), đạn bay ra từ chỗ nấp
        let amb = null; if (!sh && !eng && h.ambush && o.deck) { const sg = S.situ.siege, br = sg && sg.bridge != null ? sg.bridge : h.i, e0 = o.deck(br, 0), e1 = o.deck(br, 0.1);
          if (e0 && e1) { const al = e1.clone().sub(e0).setY(0).normalize(), side = ((h.seq % 2) * 2 - 1) * (3.5 + (h.seq % 3)); amb = e0.clone().addScaledVector(new THREE.Vector3(-al.z, 0, al.x), side).addScaledVector(al, -1.5).add(L.center); amb.y = L.center.y; } }
        const ek = eng ? BK.Shots3D.OF[eng.kind] : kind, now = lastRs, fly = BK.Shots3D && BK.Shots3D.FLIGHT ? BK.Shots3D.FLIGHT(ek[0]) : 0.5;
        const from = sh ? sh.pos.clone().add(L.center) : eng ? eng.at.clone().setY(eng.at.y + 1.6 - 1.25 * SCALE) : amb || to.clone().add(new THREE.Vector3(8, 0, 8)); from.y += 1.25 * SCALE;
        let why = null; if (!sh && !eng && !amb) { phantom++; let bd = 1e9, bq = null; for (const o2 of v.side === 'foe' ? sightDef : sightFoe) { const d = o2.pos.distanceTo(v.pos); if (d < bd) { bd = d; bq = o2; } }
          const vm = v.gst ? v.gst.mind : S.minds.get(v.p.id) || {}; why = (v.side || '-') + ' ' + (vm.verb || vm.state) + '@' + (vm.place || '-') + (h.eng ? ' (xe)' : '') + ' gần nhất ' + (bq ? bd.toFixed(1) + '/' + (bq.range || 0) : 'không có ai'); } // logic ghi một phát trúng mà không ai bên kia đứng trong tầm: bộ quét lỗi đếm
        // (không ai bên kia đứng trong tầm: không vẽ viên đạn bay ra từ chỗ trống; phát không chết thì chỉ trừ máu, phát chết thì người
        // đó gục xuống. Bộ quét lỗi vẫn đếm để biết logic và phần vẽ còn lệch nhau bao nhiêu)
        if (why) { if (shots && shots.note) shots.note({ src: 'phantom', why: why + (h.kill ? ' (chết)' : '') }); (v.pend || (v.pend = [])).push({ at: now, dmg: h.dmg, from: null }); if (h.kill) v.dieAt = now + 0.2; continue; }
        if (shots) shots.fire(ek[0], from, to, now, { color: ek[1], puff: ek[2], src: sh ? 'hit' : eng ? 'gear' : 'ambush', rg: sh ? sh.range || SIGHT : 0 });
        (v.pend || (v.pend = [])).push({ at: now + fly, dmg: h.dmg, from: sh ? sh.pos.clone() : eng ? eng.at.clone().sub(L.center) : amb ? amb.clone().sub(L.center) : null });
        if (h.kill) v.dieAt = now + fly;
      }
    }
    let lastRs = 0;

    /* ---------- Đội hình trận (design/chien-tranh-thinh-vuong.md mục 8) ----------
     * Chỉ đánh bằng vũ khí bắn xa: mỗi bên xếp thành hàng ngang, hàng dọc, quay mặt về phía bên kia mà bắn.
     *   ở cổng       quân đánh hai hàng ngoài tường (dải đất giữa tường và mép đảo), trải dọc hai bên cổng; quân giữ ba hàng
     *                ngay trong cổng
     *   nhà chính    quân giữ hàng ngang trước cửa nhà chính; quân đánh hàng ngang cách đó một đoạn, phía cổng đã vỡ
     *   trên phố     quân đánh hàng ngang trước công trình đang bị phá; dân binh hàng ngang chắn bên sườn
     * mind.side: 'foe' (quân đánh) hay 'def' (bên giữ); mind.rank: thứ tự trong đội; mind.of: số người của đội. */
    const FORM_GAP = 1.3, SIGHT = 13, FLINCH = 0.35;
    const DEF_IN = 2.5; // bên giữ đứng sau cổng (phía trong thành) chừng này (quân đánh trên cầu: deckPlan)
    let sightFoe = [], sightDef = [];
    function gateAnchor() { const sg = S.situ.siege, k = sg && sg.gate; return k && PL && PL[k] && PL[k].length ? PL[k][0] : null; }
    function formation(f, mind) {
      // hành quân trên mặt cầu (game/cities.js): chỗ trên cầu theo ngày (u0 + du × số ngày), hàng bốn người, người sau lùi lại
      // theo chiều đi; quay mặt về phía trước
      if (mind.place === 'deck' && o.deck && mind.u0 != null) {
        // (kẹp đầu đoàn trong mặt cầu; các hàng sau lùi theo đầu đoàn, hàng chưa lên cầu đứng trên đất ngay sau đầu cầu: không hàng
        // nào bị dồn vào cùng một điểm ở cuối cầu)
        const dir = mind.du >= 0 ? 1 : -1, row = Math.floor((mind.rank || 0) / 4), col = (mind.rank || 0) % 4, head = Math.max(0.02, Math.min(0.98, mind.u0 + mind.du * (S.day - mind.d0)));
        const u1 = Math.max(-0.45, Math.min(1.45, head - dir * row * 0.035)), at = o.deck(mind.bridge, u1), nx = o.deck(mind.bridge, Math.max(0, Math.min(1, u1 + dir * 0.03)));
        if (!at || !nx) return null; const al = nx.clone().sub(at).setY(0); if (al.lengthSq() < 1e-6) al.set(0, 0, 1); al.normalize();
        at.addScaledVector(new THREE.Vector3(-al.z, 0, al.x), (col - 1.5) * 1.0); return { p: at, face: at.clone().addScaledVector(al, 5), bridge: true };
      }
      if (mind.duel && PL) { const g = spot(mind.place, f.p); if (g) { const out = g.clone().setY(0).normalize(), at = g.clone().addScaledVector(out, mind.duel === 'foe' ? 4.6 : 2.4); at.y = 0;
        return { p: at, face: g.clone().addScaledVector(out, mind.duel === 'foe' ? 2.4 : 4.6), outside: true }; } } // đấu tướng: gặp nhau trước cổng, giữa cổng và đầu cầu
      if ((mind.state !== 'attack' && !mind.camp && !mind.muster) || !mind.side || !PL || mind.rank == null) return null; // (camp: trại vây, đứng xem đấu tướng: đứng hàng, không bắn)
      // tập hợp quân trước khi lên đường: hàng ngang trong cổng mình, mỗi hàng 6 người, quay ra cổng (không dồn một chỗ)
      if (mind.muster) { const g = spot(mind.place, f.p); if (!g) return null; const a0 = Math.atan2(g.z, g.x), row = Math.floor(mind.rank / 6), col = mind.rank % 6, r = L.rOf(a0) - 8 - row * 1.3, a = a0 + ((col - 2.5) * 1.2) / r;
        return { p: new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r), face: g }; }
      const foe = mind.side === 'foe', k = mind.rank, base = mind.place === 'hall' ? PL.hall : spot(mind.place, f.p);
      if (!base) return null;
      const gateSide = mind.place === 'gate' || mind.place === 'gateL' || mind.place === 'gateR';
      // trận ở cầu (design/ke-hoach-buoc-12.md): cả đạo quân đứng trên mặt cầu, hàng bốn người, hàng đầu cách cổng vừa trong tầm
      // bắn (khoảng giữa cầu), nã vào cổng; cổng đổ mới tràn vào thành (chặng 'inside': nhánh khác). Trại vây cũng đứng trên cầu
      if (gateSide && foe && mind.bridge != null && o.deck) {
        const a0 = o.deck(mind.bridge, 0), a1 = o.deck(mind.bridge, 1), len = a0 && a1 ? a0.distanceTo(a1) : 30;
        const rg = BK.Arms && BK.Arms.rangeOf ? BK.Arms.rangeOf(f.gst ? f.gst.level : level) : SIGHT, plan = deckPlan(len, rg, mind.of || 8, mind.ng || 0, a0 ? Math.hypot(a0.x - base.x, a0.z - base.z) : 7);
        const col = k % 4, u = plan.troop(k) / len, at = o.deck(mind.bridge, u), nx = o.deck(mind.bridge, Math.min(1, u + 0.02));
        if (at && nx) { const al = nx.clone().sub(at).setY(0).normalize(), pr = new THREE.Vector3(-al.z, 0, al.x); at.addScaledVector(pr, (col - 1.5) * 1.0); return { p: at, face: base, bridge: true }; }
      }
      if (gateSide) {
        // dọc theo vòng tường: cột theo góc quanh cổng, hàng theo bán kính
        const a0 = Math.atan2(base.z, base.x), COLS = foe ? Math.max(4, Math.min(14, Math.ceil((mind.of || 8) / 2))) : 8, row = Math.floor(k / COLS), col = k % COLS;
        const r = foe ? L.rOf(a0) - 0.9 - row * 1.15 : Math.hypot(base.x, base.z) - DEF_IN - row * FORM_GAP; // bên giữ: ngay sau cổng (phía trong thành), trong tầm bắn tới hàng đầu trên cầu
        const a = a0 + ((col - (COLS - 1) / 2) * FORM_GAP) / r, rr = foe ? L.rOf(a) - 0.9 - row * 1.15 : r;
        const at = new THREE.Vector3(Math.cos(a) * rr, 0, Math.sin(a) * rr), fr = foe ? L.rOf(a0) - 7 : L.rOf(a0) - 1;
        return { p: at, face: new THREE.Vector3(Math.cos(a0) * fr, 0, Math.sin(a0) * fr), outside: foe };
      }
      const g = gateAnchor() || base.clone().multiplyScalar(1.6), out = g.clone().sub(base).setY(0); if (out.lengthSq() < 1e-3) out.set(1, 0, 0); out.normalize();
      const side = new THREE.Vector3(-out.z, 0, out.x), COLS = 8, row = Math.floor(k / COLS), col = k % COLS, cs = (col - (COLS - 1) / 2) * FORM_GAP;
      let c, back, face;
      // nhà chính: quân đánh đứng cách hàng giữ vừa trong tầm bắn của cả hai bên (tầm ngắn thời đầu thì đứng gần hơn)
      const rg = (lv) => (BK.Arms && BK.Arms.rangeOf ? BK.Arms.rangeOf(lv) : SIGHT), gap = Math.max(5, Math.min(13, rg(level) - 1.5, rg(f.gst ? f.gst.level : level) - 1.5) + 1.5);
      if (mind.place === 'hall') { c = foe ? base.clone().addScaledVector(out, gap) : base.clone().addScaledVector(out, 1.5); back = foe ? out : out.clone().negate(); face = foe ? base.clone().addScaledVector(out, 1.5) : base.clone().addScaledVector(out, gap); }
      else { c = foe ? base.clone().addScaledVector(out, 3) : base.clone().addScaledVector(out, 3).addScaledVector(side, 12); back = foe ? out : side; face = foe ? base.clone().addScaledVector(out, 3).addScaledVector(side, 12) : base.clone().addScaledVector(out, 3); }
      const lat = foe || mind.place === 'hall' ? side : out;
      return { p: c.addScaledVector(lat, cs).addScaledVector(back, row * FORM_GAP), face, outside: false };
    }

    // vừa rời mặt cầu (cổng đổ: quân trên cầu tràn vào thành): đi dọc mặt cầu về đầu cầu, qua cổng rồi mới theo lối trong đảo
    // (không bị kéo thẳng vào trong tường, trông như nhảy chỗ). Dùng cho cả bước chính lẫn các bước con trong một khung hình
    function leaveDeck(f, aim, goal) {
      if (goal && goal.bridge) { f.deckOf = aim.bridge; return goal; }
      if (!goal || f.deckOf == null || !o.deck) return goal;
      if (goal.outside) { f.deckOf = null; return goal; } // đích ngoài tường (đấu tướng trước cổng): đi thẳng từ cầu xuống, không qua cổng
      const r = Math.hypot(f.pos.x, f.pos.z), e = r > L.rOf(Math.atan2(f.pos.z, f.pos.x)) - 5.6 ? o.deck(f.deckOf, 0) : null;
      if (!e) { f.deckOf = null; return goal; }
      const gA = gateAnchor(); if (gA && Math.hypot(e.x - gA.x, e.z - gA.z) < 15) e.set(gA.x, e.y, gA.z); else e.multiplyScalar(Math.max(0, L.rOf(Math.atan2(e.z, e.x)) - 5.8) / Math.max(1e-3, Math.hypot(e.x, e.z)));
      // chân theo mặt cầu ở chỗ đang đứng (cầu vồng lên giữa nhịp): chiếu vị trí lên trục cầu
      const a0 = o.deck(f.deckOf, 0), a1 = o.deck(f.deckOf, 1); if (a0 && a1) { const ax = a1.x - a0.x, az = a1.z - a0.z, u = Math.max(0, Math.min(1, ((f.pos.x - a0.x) * ax + (f.pos.z - a0.z) * az) / (ax * ax + az * az || 1))), on = o.deck(f.deckOf, u); if (on) f.pos.y = on.y; }
      e.y = f.pos.y; return { p: e, face: goal.p, bridge: true, leave: true };
    }
    /* ---------- Đi tới đâu ---------- */
    const _v = new THREE.Vector3();
    function goalOf(f, mind) {
      const fm = formation(f, mind); if (fm) return fm;
      const tgt = mind.target != null ? folks.get(mind.target) : null;
      if (tgt && (mind.state === 'talk' || mind.state === 'attack')) {
        // đứng nghe, đứng xem (drama): toả thành vòng rộng quanh người nói; trò chuyện, cãi, đánh: đứng sát
        const K = f.knobs, gap = mind.verb === 'listen' ? 2.6 + (f.p.id % 5) * 0.55 : mind.state === 'attack' ? 7 + (f.p.id % 4) * 0.6 : 1.3 + (K.lean < 0 ? -K.lean * 0.6 : 0);
        // rủ nói chuyện mà người kia đang đi chỗ khác (không rủ lại mình): tới chỗ người kia sắp tới mà đứng chờ, không đuổi theo từng
        // bước (đuổi theo thì hai người đi vòng vòng, bị coi là kẹt)
        const at = mind.state === 'talk' && tgt.moving && tgt.gp && !(tgt.doing && tgt.doing.target === f.mid) ? tgt.gp : tgt.pos;
        _v.copy(f.pos).sub(at); if (_v.lengthSq() < 1e-4) _v.set(1, 0, 0);
        return { p: at.clone().addScaledVector(_v.normalize(), gap), face: tgt.pos };
      }
      // đi theo một người (hộ vệ đi sau người đứng đầu, người nhà đi dạo cùng): đứng sau lưng người đó một chút
      if (mind.follow != null) { const tg = folks.get(mind.follow); if (tg) return { p: tg.pos.clone().add(new THREE.Vector3(-Math.sin(tg.yaw) * 1.5 + Math.cos(tg.yaw) * 0.6, 0, -Math.cos(tg.yaw) * 1.5 - Math.sin(tg.yaw) * 0.6)), face: null }; }
      if (mind.place === 'stroll') { const g = Nav.strollGoal(f); if (g) return g; }
      if (mind.place === 'hallLoop') { const g = Nav.hallGoal(f); if (g) return g; }
      // trước cửa nhà người mất (đám tang, logic/scenes.js); hàng người nhận khẩu phần trước kho lúc đói (thứ tự trong hàng: qRank)
      if (mind.place === 'homeSlot' && PL && PL.homeSlots && PL.homeSlots[mind.slot]) return { p: Nav.offCarriage(PL.homeSlots[mind.slot].clone().add(f.jit)), face: PL.homeSlots[mind.slot] };
      if (mind.place === 'queue' && PL && PL.store && PL.store.length) { const s1 = PL.store[Math.min(1, PL.store.length - 1)], dir = s1.clone().negate().setY(0).normalize(); return { p: s1.clone().addScaledVector(dir, 0.9 * ((f.qRank || 0) + 1)), face: s1 }; }
      // chuyền nước chữa cháy rừng (logic/ecology.js): hàng người từ giếng giữa làng ra bãi gỗ, mỗi người một chỗ theo thứ tự
      if (mind.place === 'bucket' && PL) { const w0 = pickOf(PL.square, 0), f0 = pickOf(PL.wood, 0) || pickOf(PL.outer, 0) || pickOf(PL.guard, 0);
          if (w0 && f0) { const u = ((mind.rank || 0) + 0.5) / Math.max(1, mind.of || 1), at = w0.clone().lerp(f0, u), nx = w0.clone().lerp(f0, Math.min(1,
          u + 0.05)); return { p: at, face: nx }; } }
      // biểu tình (logic/dramas.js): xếp hàng ngang hàng dọc ngay trước nhà chính, mỗi hàng 4 người, quay mặt vào nhà chính
      if (mind.place === 'protest' && PL && PL.hall) { const H = PL.hall, dv = (PL.podium ? PL.podium.clone().sub(H) : H.clone().negate()).setY(0);
          if (dv.lengthSq() < 1e-3) dv.set(1, 0, 0); dv.normalize(); const sd = new THREE.Vector3(-dv.z, 0, dv.x), k = mind.rank || 0, COLS = 4,
          r = Math.floor(k / COLS), c = k % COLS; return { p: H.clone().addScaledVector(dv, -(0.3 + r * 1.3)).addScaledVector(sd, (c - (COLS - 1) / 2) * 1.4),
          face: H.clone().addScaledVector(dv, -9) }; } // các hàng ở khoảng trống giữa sân và nhà chính (sân có đống lửa, giếng), quay mặt vào nhà chính
      const base = spot(mind.place, f.p);
      if (mind.place === 'podium' && PL && PL.podium) return { p: base.clone(), face: PL.podiumFace }; // người diễn thuyết đứng giữa bục, nhìn ra sân
      const tight = mind.place === 'gate' || mind.place === 'gateL' || mind.place === 'gateR'; // lính gác đứng sát chốt của mình
      if (!base) return null;
      // (nhớ kết quả né lòng đường theo chỗ đến, khỏi tính lại mỗi khung hình: design/ke-hoach-khac-phuc.md mục 1.3)
      const oc = f.oc; if (oc && oc.x === base.x && oc.z === base.z && oc.t === tight && oc.j === f.jit.x) return { p: oc.p.clone(), face: null };
      const q = Nav.offCarriage(tight ? base.clone().addScaledVector(f.jit, 0.15) : base.clone().add(f.jit));
      f.oc = { x: base.x, z: base.z, t: tight, j: f.jit.x, p: q.clone() };
      return { p: q, face: null };
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
      if (mind.verb === 'protest') return 'neutral'; // biểu tình: nghiêm, không giận dữ
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
      gameT += sec; gestT += real * Math.min(k, GESTURE_MAX); const ts = gameT, gs = gestT, rs = t * 0.001; lastRs = rs; frameNo++;
      // không ai đứng chồng lên ai (design/ke-hoach-buoc-12.md mục 4): người đang đứng yên mà sát người khác hơn SEP thì đẩy nhẹ ra
      // (theo vị trí khung trước; người đang đi tự tránh nhau theo lối đi, người trong nhà không tính)
      if (shownNow && frameNo % 2 === 0) { const st = []; for (const f of folks.values()) if (f.rig && !f.inside && !f.moving && !f.dieAt) st.push(f);
        for (let a = 0; a < st.length; a++) for (let b = a + 1; b < st.length; b++) { const A = st[a].pos, B = st[b].pos, dx = B.x - A.x, dz = B.z - A.z, d2 = dx * dx + dz * dz;
          if (d2 >= SEP * SEP) continue; const d = Math.sqrt(d2) || 1e-3, push = (SEP - d) * 0.25, ux = d2 > 1e-6 ? dx / d : Math.cos(a * 2.4), uz = d2 > 1e-6 ? dz / d : Math.sin(a * 2.4);
          A.x -= ux * push; A.z -= uz * push; B.x += ux * push; B.z += uz * push;
          // dời luôn chỗ đứng riêng của hai người (jit), để lần sau đi tới không quay lại đứng chồng (không giằng co qua lại)
          st[a].jit.x -= ux * push; st[a].jit.z -= uz * push; st[b].jit.x += ux * push; st[b].jit.z += uz * push; st[a].oc = st[b].oc = null; } }
      // hàng nhận khẩu phần: thứ tự theo người tới trước (giữ thứ tự cũ, người mới đứng cuối)
      { const q = []; for (const [id] of folks) { const m = S.minds.get(id); if (m && m.place === 'queue') q.push(id); } q.sort((a,
          b) => (folks.get(a).qSince || 0) - (folks.get(b).qSince || 0) || a - b); q.forEach((id, n) => { const f = folks.get(id);
          if (!f.qSince) f.qSince = ts + n * 1e-3; f.qRank = n; }); for (const [, f] of folks) if (f.qSince && !q.includes(f.p.id)) f.qSince = 0; }
      const kingF = S.seats.king != null ? folks.get(S.seats.king) : null, hungry = S.food < 0.5;
      // người có mặt trên đảo: dân (trừ người đi vắng: đi đánh, đóng giữ, sang đảo khác) và khách từ đảo khác (setGuests)
      const roster = []; for (const p of S.people.values()) if (p.alive && !p.away) roster.push([p.id, p, null]);
      // khách vừa chết ở logic (phục kích trên cầu, sấm sét…) mà danh sách khách chưa kịp làm mới (mỗi giây): ngã xuống ngay tại chỗ,
      // không đi tiếp
      for (const g of guests) { if (g.p.alive !== false) { roster.push([g.key, g.p, g]); continue; } const f = folks.get(g.key); if (f && f.rig && !f.dieAt) f.dieAt = rs; }
      // phát trúng thật (logic/war.js W.hitLog; design/ke-hoach-khac-phuc.md mục 2.1): mỗi phát là một viên đạn từ đúng người bắn tới
      // đúng người trúng; thanh máu tụt khi đạn tới; người hết máu vẫn đứng tới lúc viên đạn cuối tới rồi mới ngã, nằm đúng chỗ đó
      takeHits(rs);
      { const inRoster = new Set(roster.map((r) => r[0])); for (const [key, f] of folks) if (f.dieAt && !inRoster.has(key)) roster.push([key, f.p, f.gst || null, true]); }
      // gặp là bắn (design/chien-tranh-thinh-vuong.md mục 9): người cầm súng của hai bên thấy nhau trong tầm SIGHT thì dừng lại bắn,
      // không đi lướt qua nhau. Vị trí theo khung hình trước (sightFoe: quân đánh; sightDef: bên giữ, quân đồng minh, lính gác)
      const seenFoe = sightFoe, seenDef = sightDef; sightFoe = []; sightDef = [];
      for (const [key, p, gst, dying] of roster) {
        const f0 = folks.get(key);
        if (dying && f0 && rs >= f0.dieAt) { bodies.set(f0.bodyKey, { pos: f0.pos.clone(), yaw: f0.yaw, color: f0.color || '#cccccc' }); continue; } // đạn tới: ngã xuống
        alive.add(key);
        // người ở xa máy quay (quá LOD_FAR) cập nhật cách một khung hình (design/ke-hoach-khac-phuc.md mục 1.3); thời gian bỏ qua
        // dồn sang lần sau (debt) nên vẫn đi đúng quãng đường
        // người đứng trong hàng bắn (không đi) cũng vậy: trận đông người thì nửa số người cập nhật mỗi khung hình
        if (camera && f0 && f0.rig && (frameNo + p.id) % 2 === 1 && !(f0.pend && f0.pend.length) && ((f0.side && !f0.moving) || (!f0.engage && f0.rig.root.position.distanceToSquared(camera.position) > LOD_FAR * LOD_FAR))) { f0.debt = Math.min(0.8, (f0.debt || 0) + sec); continue; }
        const age = P.ageOf(p, S.day), f = ensure(p, age, key, gst ? gst.level : level, gst ? spot(gst.enter, p) : null, gst && gst.color), mind = dying && f.lastMind ? f.lastMind : gst ? gst.mind : S.minds.get(p.id) || { state: 'idle' };
        f.lastMind = mind; f.gst = gst; f.color = gst && gst.color ? gst.color : f.color || ownColor; f.bodyKey = (gst ? (/^w(\d+):/.exec(key) || [0, idx])[1] : idx) + ':' + p.id;
        if (f.pend && f.pend.length && rs >= f.pend[0].at) { const h = f.pend.shift(); f.hpShow = Math.max(0, (f.hpShow == null ? 100 : f.hpShow) - h.dmg);
          // trúng đạn: giật lùi nửa bước theo hướng đạn tới, khựng lại một chút (FLINCH giây)
          if (h.from) { _v.copy(f.pos).sub(h.from).setY(0); if (_v.lengthSq() > 1e-4) { _v.normalize(); f.pos.addScaledVector(_v, 0.35); if (!f.onDeck) Nav.keepInside(f.pos); } } f.flinch = rs + FLINCH; } // (trên mặt cầu: không kéo vào trong đảo)
        if (!f.pend || !f.pend.length) { f.hpShow = p.alive ? (p.hp == null ? 100 : p.hp) : 0; }
        f.knobs = Object.assign(Brain.knobs(p.genome, mind.stress || 0, P.traits(p)), { seed: p.id * 1.7 }); // tính cách biểu hiện (logic/epigen.js)
        const cyc = cycleOf(f, mind), aim = cyc ? cyc.aim : mind; // chu trình: đi tới chỗ của bước đang làm
        let goal = goalOf(f, aim), meetVerb = null, meetGoal = null;
        goal = leaveDeck(f, aim, goal);
        // quân đánh vừa tới: đứng ngay vào hàng ngoài tường (không đi xuyên tường); người đánh nhắm về phía bên kia
        if (goal && (goal.outside || goal.bridge) && f.fresh) f.pos.copy(goal.p);
        f.onDeck = !!(goal && goal.bridge); f.gp = goal ? goal.p : null; f.doing = mind; // (đích, việc khung này: cho bộ quét lỗi)
        if (goal && goal.bridge && !goal.leave) f.pos.y = goal.p.y; else if (goal && f.pos.y && !goal.leave) f.pos.y = 0; // đứng trên mặt cầu
        f.fresh = false; if (mind.state === 'attack' && goal && goal.face) f.shootAt = goal.face;
        // ai cầm súng lúc này: người ra trận, và lính, lính gác của đảo khi trên đảo có giặc
        const armed = (mind.state === 'attack' && (S.situ.siege || gst)) || (!gst && !!S.situ.siege && (p.job === 'soldier' || p.job === 'gatekeeper' || p.job === 'sideguard'));
        f.side = armed ? (mind.side || (gst && gst.side === 'foe' ? 'foe' : 'def')) : null; f.engage = null;
        if (armed) {
          const R = BK.Arms && BK.Arms.rangeOf ? BK.Arms.rangeOf(gst ? gst.level : level) : SIGHT; f.range = R; // tầm bắn của vũ khí người này
          let best = null, bd = R * R;
          for (const o2 of f.side === 'foe' ? seenDef : seenFoe) { const dd = (o2.pos.x - f.pos.x) ** 2 + (o2.pos.z - f.pos.z) ** 2; if (dd < bd) { bd = dd; best = o2; } }
          // (tướng ra đấu tay đôi: tới chỗ đấu trước cổng rồi mới đánh, không dừng giữa đường)
          if (best && !(mind.duel && goal && Math.hypot(goal.p.x - f.pos.x, goal.p.z - f.pos.z) > 1)) { f.engage = best; goal = null; } // dừng lại, quay về phía kẻ địch mà bắn
          (f.side === 'foe' ? sightFoe : sightDef).push(f);
        }
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
        const secF = sec + (f.debt || 0); f.debt = 0;
        const n = Math.max(1, Math.min(6, Math.ceil(secF / STEP))), h = secF / n;
        // đích chỉ tính lại giữa các bước con khi đích di động (đi theo người, nhắm người, đi dạo), không thì dùng lại
        const moverGoal = aim.target != null || aim.follow != null || aim.place === 'stroll' || aim.place === 'hallLoop';
        for (let i = 0; i < n; i++) {
          if (i && moverGoal && !f.engage) goal = meetGoal ? null : leaveDeck(f, aim, goalOf(f, aim)); // (đang dừng bắn kẻ địch trong tầm: đứng yên cả các bước con)
          let g = meetGoal || goal;
          // (gỡ kẹt: đứng lại tại chỗ khi đích chưa đổi; đi thẳng tới đích, bỏ lối đi)
          if (g && f.hold) { if (f.hold.distanceToSquared(g.p) < 4) g = { p: f.pos.clone(), face: g.face }; else f.hold = null; }
          if (g && f.direct && f.direct.distanceToSquared(g.p) > 4) f.direct = null;
          if (g && !meetVerb && !g.road && !g.outside && !g.bridge && !f.direct) g = Nav.follow(f, g); // đi theo lối đi, không xuyên tường, xuyên nhà (render/nav3d.js)
          if (!g) break;
          _v.copy(g.p).sub(f.pos); _v.y = 0;
          const d = _v.length(), run = mind.state === 'panic' || (mind.state === 'attack' && d > 2) || d > 14;
          // ra trận mà đích còn xa (chạy từ nhà ra cổng, đuổi theo dân chạy nạn sang phía kia đảo): chạy nước rút, tới kịp lúc logic
          // cho vào trận (logic/war.js JOIN_DAYS, CIV_CHASE)
          const sprint = mind.state === 'attack' && goal && Math.hypot(goal.p.x - f.pos.x, goal.p.z - f.pos.z) > 18 ? 1.8 : 1;
          const speed = sprint * (run ? 3.4 : mind.verb === 'sleep' ? 2 : 1.25) * f.knobs.tempo * (0.8 + 0.4 * f.knobs.stride) * (carrying(f) || mind.carryItem ? 0.85 : 1) * (hungry ? 0.8 : 1); // tối muộn về ngủ thì rảo bước; mang hàng, đói thì chậm lại
          if (d > 0.25) { moving = true; const step = Math.min(d, speed * h), r0 = Math.hypot(f.pos.x, f.pos.z); f.pos.addScaledVector(_v.normalize(), step);
              // (ngoài tường: giữ trên đất, trừ khi đang từ mặt cầu bước xuống: r0 còn ngoài mép đảo)
              if (g.bridge) { /* trên cầu: không giữ trong đảo */ } else if (g.outside) { const a = Math.atan2(f.pos.z, f.pos.x), R = L.rOf(a) - 0.6,
              r = Math.hypot(f.pos.x, f.pos.z); if (r > R && r0 <= R + 0.05) f.pos.multiplyScalar(R / r); } else Nav.keepInside(f.pos);
              f.ph += step / ((0.55 + 0.3 * f.knobs.stride) * SCALE) * Math.PI; turnTo(f, Math.atan2(_v.x, _v.z), h); }
          else { if (g.face) { _v.copy(g.face).sub(f.pos); turnTo(f, Math.atan2(_v.x, _v.z), h); } break; }
        }
        if (!moving) f.ph += real * 3 * f.knobs.tempo;
        // gỡ người kẹt (design/ke-hoach-khac-phuc.md mục 6.3): đang đi tới đích còn xa (hơn 1,5) mà UNSTICK_S giây không tiến được
        // UNSTICK_D thì tìm lại đường; kẹt lần hai thì đi thẳng tới đích (bỏ lối đi); lần ba thì đứng lại tại chỗ cho tới khi đích đổi.
        // Không bao giờ dịch chuyển người (nhảy chỗ là lỗi nhìn thấy được). Bước tại chỗ: đang đi mà không nhích (đếm cho audit)
        // (đo bằng thời gian đi của chính người đó theo giờ game: xem chậm thì người đi chậm, không phải kẹt)
        if (moving) {
          const pr = f.prog || (f.prog = { x: f.pos.x, z: f.pos.z, t: 0, n: 0 }); pr.t += secF;
          f.inplace = !!f.lastP && secF > 0.02 && Math.abs(f.lastP.x - f.pos.x) + Math.abs(f.lastP.z - f.pos.z) < 1e-4;
          if (pr.t >= UNSTICK_S) {
            const far = goal && Math.hypot(goal.p.x - f.pos.x, goal.p.z - f.pos.z) > 1.5;
            if (far && Math.hypot(f.pos.x - pr.x, f.pos.z - pr.z) < UNSTICK_D) {
              stuckN++; pr.n++;
              if (pr.n === 1) f.nav = null;
              else if (pr.n === 2) { f.nav = null; f.direct = goal.p.clone(); stuckHard++; }
              else { f.hold = goal.p.clone(); f.direct = null; pr.n = 0; }
            } else pr.n = 0;
            pr.x = f.pos.x; pr.z = f.pos.z; pr.t = 0;
          }
        } else { f.prog = null; f.inplace = false; }
        (f.lastP || (f.lastP = new THREE.Vector3())).copy(f.pos);
        if (cyc) cycleNext(f, !moving && !!goal && Math.hypot(goal.p.x - f.pos.x, goal.p.z - f.pos.z) < 0.8, ts);
        // tới nơi thì làm việc bằng cử chỉ trong thư viện (render/work3d.js); đang đi, hay đang có sự kiện thì cử động theo trạng thái
        // cử chỉ làm việc chỉ ở chỗ làm (bước 'work' của chu trình), không ở kho, không trên đường
        const verb = meetVerb || mind.verb, working = !moving && verb && verb !== 'sleep' && (!cyc || cyc.stage === 'work' || meetVerb) && (meetVerb || mind.state === 'work' || (mind.state === 'talk' && !mind.mood));
        f.inside = !moving && (verb === 'sleep' || verb === 'hide' || verb === 'indoor'); // ngủ, trốn giặc, ở trong nhà: vào trong nhà (không vẽ)
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
        if (!gst && !moving && (mind.place === 'gateL' || mind.place === 'gateR')) { const g = guests.find((x) => x.brawl && x.mind.target === p.id);
            const gf = g && folks.get(g.key); if (gf && gf.pos.distanceToSquared(f.pos) < 9) { tgt = Anim.target('talk', f.ph, gs, f.knobs, { mood: 'argue',
            moving: false }); f.tool = null; f.gk = 'cãi'; _v.copy(gf.pos).sub(f.pos); turnTo(f, Math.atan2(_v.x, _v.z), real); } }
        // lính gác cúi chào khi người đứng đầu đi ngang qua chốt (mỗi lần đi ngang chào một lần)
        if (kingF && kingF !== f && !moving && (mind.place === 'gate' || mind.place === 'gateL' || mind.place === 'gateR' || mind.place === 'nightGate') && kingF.moving && kingF.pos.distanceToSquared(f.pos) < 25 && !(ts < (f.salCool || 0))) { f.salUntil = gs + 1.6; f.salCool = ts + 15; }
        if (f.salUntil > gs) { const G = BK.Gestures3D.BY_KEY.bow; tgt = Anim.basePose(f.knobs); G.pose(tgt, f.ph, Math.min(1, 1 - (f.salUntil - gs) / 1.6), gs, f.knobs); f.tool = null; f.gk = 'chào'; if (kingF) { _v.copy(kingF.pos).sub(f.pos); turnTo(f, Math.atan2(_v.x, _v.z), real); } }
        if (!tgt) { f.verb = null; f.tool = null; f.gk = null; tgt = Anim.target(mind.state, f.ph, gs, f.knobs, { habit: p.genome.habit, mood: mind.mood, moving });
          // đứng chờ, đứng gác không đứng trơ (design/ke-hoach-buoc-12.md mục 4.3): liếc nhìn, chuyển trọng tâm (Anim.addLife), cứ chừng
          // mươi giây lại nhìn quanh một lượt (mỗi người một nhịp riêng)
          if (!moving && (mind.state === 'idle' || mind.state === 'walk')) { Anim.addLife(tgt, gs, f.knobs); const u = (gs * 0.09 + p.id * 0.37) % 1, G = BK.Gestures3D.BY_KEY.lookAround;
            if (G && u < 0.16) { G.pose(tgt, f.ph, u / 0.16, gs, f.knobs); f.gk = 'nhìn quanh'; } else tgt.prz += Math.sin(gs * 0.5 + p.id) * 0.04; } }
        // đánh trận: chỉ bắn xa (design/chien-tranh-thinh-vuong.md mục 8). Ai ra trận (lính, quân đảo khác, dân tự nguyện) cũng
        // cầm vũ khí bắn xa của thời đảo mình (logic/arms.js KIT); đứng vào hàng (formation), ngắm (súng, súng tia) hay giương
        // (ná, cung, nỏ) rồi bắn về phía người mình nhắm, không có ai thì về phía hàng bên kia, công trình đang phá
        if (mind.march && BK.Arms) { const K = BK.Arms.kit(gst ? gst.level : level); f.tool = K ? K.ranged : null; } // hành quân: vác vũ khí của thời mình
        if ((mind.state === 'attack' && (S.situ.siege || gst)) || f.engage) {
          const K = BK.Arms && BK.Arms.kit(gst ? gst.level : level);
          f.tool = K ? K.ranged : 'sling';
          if (K && !moving) {
            const draw = K.ranged === 'sling' || K.ranged === 'bow' || K.ranged === 'crossbow', G = BK.Gestures3D.BY_KEY[draw ? 'draw' : 'aim'];
            const hit = f.flinch > rs, Gh = hit && BK.Gestures3D.BY_KEY.startle; // vừa trúng đạn: khựng người, không bắn
            if (Gh) { tgt = Anim.basePose(f.knobs); Gh.pose(tgt, f.ph, 0.5, gs, f.knobs); f.gk = 'trúng đạn'; }
            else if (G) { tgt = Anim.basePose(f.knobs); G.pose(tgt, f.ph, 0, gs, f.knobs); f.gk = 'bắn'; }
            // tầm bắn thật (design/ke-hoach-buoc-12.md mục 3.3): chỉ bắn kẻ địch đang trong tầm vũ khí; ngoài tầm thì giương
            // vũ khí hướng về phía đó mà chờ, không bắn bâng quơ
            const T0 = f.engage || (mind.target != null ? folks.get(mind.target) : null), Rg = f.range || (BK.Arms && BK.Arms.rangeOf ? BK.Arms.rangeOf(gst ? gst.level : level) : SIGHT);
            const T = T0 && T0.rig && (T0.pos.x - f.pos.x) ** 2 + (T0.pos.z - f.pos.z) ** 2 <= Rg * Rg ? T0 : null, aimAt = T ? T.pos : T0 ? T0.pos : f.shootAt;
            if (aimAt) { _v.copy(aimAt).sub(f.pos); turnTo(f, Math.atan2(_v.x, _v.z), real); }
            if (shots && T && !hit && (rs > (f.nextShot || 0) || f.nextShot - rs > 5)) { // đồng hồ lùi (tải lại, tua): bắn lại ngay
              const kind = BK.Shots3D.OF[K.ranged] || ['arrow'], gap = K.ranged === 'mg' || K.ranged === 'autorifle' ? 0.35 : draw ? 1.8 : 1.1;
              f.nextShot = rs + gap * (0.7 + Math.random() * 0.8);
              const from = new THREE.Vector3().copy(L.center).add(f.pos); from.y += 1.25 * SCALE; from.x += Math.sin(f.yaw) * 0.5 * SCALE; from.z += Math.cos(f.yaw) * 0.5 * SCALE;
              // (phát trang trí cho nhịp bắn đều: luôn trượt, rơi cạnh người; phát trúng thật do logic quyết định: takeHits)
              const to = new THREE.Vector3().copy(L.center).add(T.pos); to.y += 0.9 * SCALE; { const a = Math.random() * 6.283, r = 1.4 + Math.random() * 1.2; to.x += Math.cos(a) * r; to.z += Math.sin(a) * r; }
              shots.fire(K.fire && Math.random() < 0.25 ? 'fire' : kind[0], from, to, rs, { color: kind[1], puff: kind[2], src: 'npc', rg: Rg + 2.6 });
            }
          }
        }
        f.moving = moving; f.meetVerb = meetVerb;
        Anim.apply(f.rig, f.cur, tgt, dt);
        const sc = age >= 16 ? 1 : 0.5 + 0.5 * Math.max(0, age) / 16;
        f.rig.root.position.copy(L.center).add(f.pos); f.rig.root.position.y += (f.cur.ty || 0) * sc * SCALE; // ngồi, quỳ thì hạ người
        f.rig.root.rotation.set(f.cur.rx || 0, f.yaw, 0, 'YXZ'); f.rig.root.scale.setScalar(sc * SCALE);
        f.rig.root.updateMatrixWorld(true);
        // thanh máu trên đầu: người đang ra trận, người bị thương chưa hồi (logic/war.js p.hp)
        // (thanh máu từng người: người đã mất máu, hay người ra trận ở gần máy quay; ở xa thì game/cities.js vẽ thanh tổng của cả đội)
        if (bars && shownNow && !f.inside && f.hpShow < 100 && f.hpShow > 0) { _p.copy(f.rig.root.position); _p.y += 2.25 * sc * SCALE; bars.add(_p, f.hpShow / 100, 0.75 * SCALE); }
        // chớp mắt vài giây một lần
        if (rs > f.blinkAt) { f.blink = 0.14; f.blinkAt = rs + 2.2 + Math.random() * 3; } // giờ thực
        f.blink = Math.max(0, f.blink - real);
        const ek = meetVerb ? 'happy' : gface && EXPR[gface] && mind.verb !== 'protest' && !X.war && !X.mourning && !mind.mood && !hungry ? gface : exprOf(mind, X, p) === 'neutral' && hungry ? 'sad' : exprOf(mind, X, p); // bạo loạn, cãi nhau: giận (mood) dù đang làm cử chỉ
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
    function peds() { pedList.length = 0; for (const [, f] of folks) if (!f.inside) { f.pos.who = f; pedList.push(f.pos); } return pedList; } // (who: cho bộ quét lỗi biết ai chặn xe)
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
    // số đo "không vô nghĩa" (design/ke-hoach-khac-phuc.md mục 7.2): phần người đứng không, người đi không có đích, số người
    // trong vòng 10 quanh nhà chính, số người bước tại chỗ, số lần kẹt (từ lần đo trước)
    const HALLISH = new Set(['hall', 'square', 'hallLoop', 'podium', '-']);
    function auditStats() {
      let out = 0, idle = 0, noGoal = 0, nearHall = 0, inplace = 0; const H = PL && (PL.hallC || PL.hall), why = {};
      for (const [id, f] of folks) {
        if (!f.rig || f.inside) continue; out++;
        const mind = S.minds.get(id) || {};
        if (!f.moving && !f.verb && !f.gk && (mind.state === 'idle' || !mind.state)) idle++;
        if (f.moving && !mind.place && mind.target == null && mind.follow == null) noGoal++;
        // tụ tập quanh nhà chính: người ở trong vòng 10 mà việc là ở nhà chính, sân, vòng quanh nhà chính hay không có chỗ (người
        // về nhà mình, đi làm ngang qua ở làng nhỏ thời đầu không tính)
        if (H && HALLISH.has(mind.place || '-') && (f.pos.x - H.x) ** 2 + (f.pos.z - H.z) ** 2 < 100) { nearHall++; const k = (mind.verb || mind.state) + '@' + (mind.place || '-'); why[k] = (why[k] || 0) + 1; }
        if (f.moving && f.inplace) inplace++;
      }
      // người đứng chồng lên nhau (gần hơn 0,45, cả hai đứng yên): lỗi nhìn thấy được (một cục người)
      const still = [...folks.values()].filter((f) => f.rig && !f.inside && !f.moving); let overlap = 0;
      const ow = (f) => { const m = f.gst ? f.gst.mind : S.minds.get(f.p.id) || {}; return (m.verb || m.state) + '@' + (m.place || '-'); }, overWhy = [];
      for (let a = 0; a < still.length; a++) for (let b = a + 1; b < still.length; b++) if ((still[a].pos.x - still[b].pos.x) ** 2 + (still[a].pos.z - still[b].pos.z) ** 2 < 0.2) { overlap++; if (overWhy.length < 4) overWhy.push(ow(still[a]) + '+' + ow(still[b])); }
      const r = { people: out, idle: out ? idle / out : 0, noGoal, nearHall, inplace, stuck: stuckN, overlap, overWhy, hallWhy: why, phantom, stuckHard }; stuckN = 0; stuckHard = 0; phantom = 0; return r;
    }
    // trạng thái từng người cho bộ quét lỗi (tools/bug-hunt.js): vị trí (toạ độ đảo), đang đi, trong nhà, phe, việc, chỗ, đồ cầm,
    // đứng trên mặt cầu
    function inspect() {
      const out = [];
      for (const [key, f] of folks) { if (!f.rig) continue; const m = f.gst ? f.gst.mind : S.minds.get(f.p.id) || {};
        out.push({ key, x: f.pos.x, y: f.pos.y, z: f.pos.z, moving: !!f.moving, inside: !!f.inside, side: f.side || (f.gst && f.gst.side) || null, guest: !!f.gst,
          state: m.state, verb: m.verb, place: m.place, tool: f.tool || null, deck: !!f.onDeck, gx: f.gp ? f.gp.x : null, gz: f.gp ? f.gp.z : null, nav: f.nav ? f.nav.pts.map((q) => [+q.x.toFixed(1), +q.z.toFixed(1)]) : null, navI: f.nav ? f.nav.i : null, stuckN: f.prog ? f.prog.n : 0, dying: !!f.dieAt, alive: f.p.alive !== false }); }
      return out;
    }
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
    return { update, pick, select, audit, auditStats, inspect, setGuests, setFallen, worldPos, peds, setPlaces, setLevel, drawCalls, setVisible, get visible() { return shownNow; },
        get selected() { return selected; }, get count() { return folks.size; }, get indoors() { let n = 0; for (const [, f] of folks) if (f.inside) n++;
        return n; } };
  }

  return { create, EXPR, deckPlan };
});
