/* Bể Kính · magic/soul/blackhole/blackhole.js · Điều khiển Hố đen: nối các phần theo nhịp (magic/soul/blackhole/plan.js)
 * start(chỗ ngắm): bắt đầu (đang có thì thôi). update(giây, đứng) mỗi khung hình:
 *   hình hố       hole3d.js: lớn dần trong GROW giây tới nửa đảo, bay cao dần trên chỗ ngắm
 *   hút vật thể   pieces.js tách đảo thành từng vật (cây, cỏ, đá, nhà, mảng gạch đường); warp3d.js cho từng vật nhấc lên, lộn
 *                 nhào, xoắn ốc vào lõi khi mặt hút qua nó và hố lớn hơn nó (vật nhỏ trước, nhà sau). Đất giữ nguyên
 *   hút người     pull.js: người trong tầm (hố lớn hơn người) bị cuốn lên xoắn vào tâm; dân cả đảo hoảng sợ bỏ chạy
 *   người nhập hồn (nếu ở đảo này): vẫn chạy tự do quan sát; vào tầm hút thì bị giữ (không đi được, chỉ xoay nhìn:
 *                 game/possess.js setHeld), lơ lửng rồi bị hút; qua lõi thì vào trong hố (inside.js), linh hồn rời thân
 *   màu ánh sáng  (render/fx/post3d.js voidTint): ánh sáng không thoát được nên cả ảnh ngả dần sang vàng cam của đĩa bồi tụ. Mạnh
 *                 dần theo cỡ hố và độ gần (trong tầm hút là hết cỡ, ra ngoài nhạt dần); mạnh nhất khi quay lưng chạy khỏi hố. Chỉ
 *                 đổi màu, đổi từ từ; không làm méo, không nhoè màn hình (người chơi chốt: màn hình chính không có hiệu ứng động)
 *   hạt           vật chất cuốn về tâm theo đĩa, bụi bốc lên ở mặt hút; tiếng ù trầm (magic/soul/sounds.js)
 *   tan           sau HOLD_END hố tan dần, trả lại đảo (bản thử, để thử lại được)
 * Thời gian dừng (đứng): mọi thứ đứng im giữa chừng. Cần: plan.js, warp3d.js, pieces.js, hole3d.js, pull.js, inside.js. */
(function (root) {
  const BK = root.BK || (root.BK = {});
  const FX = {
    STREAM: 70, // (hạt/giây) vật chất cuốn vào theo đĩa
    DUST: 30, // (hạt/giây) bụi bốc lên ở mép tầm hút
    TINT: 0.8, // ngả vàng cam lớn nhất (quay lưng chạy khỏi hố thì mạnh nhất)
    TINT_EDGE: 25, // (đơn vị) ngoài tầm hút chừng này thì hết ngả màu
    TINT_RATE: 1.5, // (1/giây) màu đổi từ từ theo chừng này
    CAM_IN: [0.87, 0.98], // máy quay theo người nhập hồn vào trong lõi trong khoảng này của đường bị cuốn (0..1; lao vào từ 0,85)
    DARK_AT: 0.9, // từ đây màn hình tối dần thành một màu đen (inside.js): người đang chui vào lõi
    FACE_RATE: 1.5, // (1/giây) lúc bị cuốn, máy quay xoay về phía hố nhanh chừng này
  };
  function setup(G, kit) {
    const { THREE } = G;
    BK.Hole3D.setup(G);
    BK.VoidInside.setup(G);
    const Plan = BK.BlackHolePlan,
      P = Plan.P,
      Warp = BK.VoidWarp,
      pull = BK.BlackHolePull.create(G),
      pieces = BK.BlackHolePieces.create(G);
    const hole = { on: false, t: 0, c: new THREE.Vector3(), aim: new THREE.Vector3(), R: 30, i: -1, isle: { x: 0, z: 0, r: 30 } };
    const st = { acc: 0, dust: 0, player: null, sucked: false, inside: false, tint: 0, lt: 0, fade: 1, unhook: null };
    const sound = (name, ...a) => kit.audio && kit.audio[name] && kit.audio[name](...a);
    const v1 = new THREE.Vector3(),
      v2 = new THREE.Vector3(),
      v3 = new THREE.Vector3();
    function start(aim) {
      if (hole.on) return false;
      const i = kit.island(),
        L = G.lands[i];
      if (!L) return false;
      let r = 0;
      for (let k = 0; k < 24; k++) r += L.rOf((k / 24) * Math.PI * 2);
      Object.assign(hole, { on: true, t: 0, i, R: r / 24 });
      hole.aim.copy(aim);
      hole.isle = { x: L.center.x, z: L.center.z, r: hole.R };
      Object.assign(st, { acc: 0, dust: 0, player: null, sucked: false, inside: false, tint: 0, lt: 0, camDir: null });
      hole.pieces = pieces.prepare(i);
      const V = G.villageOf(i);
      if (V && V.spook) V.spook(aim, 999, P.HOLD_END, 10);
      sound('voidHum', P.HOLD_END);
      return true;
    }
    function stop() {
      hole.on = false;
      Warp.off();
      pieces.restore();
      if (G.post) G.post.fx.voidTint = 0;
      if (st.unhook) st.unhook();
      st.unhook = null;
      G.hole3d.hide();
      pull.releaseAll();
      if (G.possess && G.possess.setHeld) G.possess.setHeld(false);
    }
    // vật chất cuốn vào: hạt sáng sinh quanh mép đĩa, bay về tâm; bụi bốc lên ở mặt hút trên đất
    function particles(sec, outer) {
      if (!G.vfx) return;
      st.acc += sec * FX.STREAM;
      for (; st.acc >= 1; st.acc--) {
        const a = Math.random() * Math.PI * 2,
          d = outer * (1 + Math.random() * 1.5);
        v1.set(hole.c.x + Math.cos(a) * d, hole.c.y + (Math.random() - 0.5) * outer * 0.3, hole.c.z + Math.sin(a) * d);
        // (bay về tâm, lệch theo chiều xoáy, tới nơi trong khoảng một giây)
        v2.copy(hole.c).sub(v1).multiplyScalar(0.9).add(new THREE.Vector3(-Math.sin(a), 0, Math.cos(a)).multiplyScalar(d * 0.5));
        G.vfx.spawn('glow', v1, v2, { life: [0.8, 1.1], size: [0.35, 0.05], color: ['#fff2c0', '#ff7a22'], alpha: 0.9 });
      }
      // (bụi ở mép tầm hút)
      const rc = Math.min(hole.R * 1.2, Plan.reach(hole.t, hole.R));
      st.dust += sec * FX.DUST;
      for (; st.dust >= 1; st.dust--) {
        const a = Math.random() * Math.PI * 2,
          d = rc * (0.8 + Math.random() * 0.2);
        const x = hole.aim.x + Math.cos(a) * d,
          z = hole.aim.z + Math.sin(a) * d;
        v1.set(x, kit.ground(x, z) + 0.3, z);
        v2.copy(hole.c).sub(v1).multiplyScalar(0.35);
        G.vfx.spawn('soft', v1, v2, { life: [1.5, 2.5], size: [0.6, 1.6], color: ['#b9a58a', '#5a4a3c'], alpha: 0.5 });
      }
    }
    // ánh sáng không thoát được khỏi hố (render/fx/post3d.js voidTint): cả ảnh ngả dần sang vàng cam. Chỉ đổi màu, đổi từ từ
    // (TINT_RATE), không làm méo, không nhoè màn hình
    function light() {
      const fx = G.post && G.post.fx,
        cam = G.camera;
      if (!fx) return;
      const now = performance.now(),
        sec = st.lt ? Math.min(0.1, (now - st.lt) / 1000) : 0;
      st.lt = now;
      const dir = v2.copy(hole.c).sub(cam.position),
        dist = Math.hypot(dir.x, dir.z),
        facing = dir.normalize().dot(v3.set(0, 0, -1).applyQuaternion(cam.quaternion));
      const reach = Plan.reach(hole.t, hole.R),
        near = Math.max(0, Math.min(1, 1 - (dist - reach) / FX.TINT_EDGE)),
        grow = Math.min(1, hole.t / 6) * (0.4 + 0.6 * Math.min(1, Plan.outer(hole.t, hole.R) / (hole.R * 0.25)));
      let want = FX.TINT * st.fade * near * grow * (0.35 + 0.65 * (1 - facing) * 0.5);
      if (!Number.isFinite(want)) want = 0;
      st.tint += (want - st.tint) * Math.min(1, sec * FX.TINT_RATE);
      fx.voidTint = st.tint;
    }
    // người nhập hồn ở đảo này: lơ lửng, bị hút, vào trong hố
    function player(sec) {
      const Pz = G.possess;
      if (!Pz || !Pz.inside || Pz.st.i !== hole.i || st.inside) return;
      const f = G.villageOf(hole.i).folk(Pz.st.id);
      if (!f || !f.rig) return;
      const s = pull.player(f, hole);
      if (s !== 'free') Pz.setHeld(true);
      if (s === 'pull' && !st.sucked) {
        st.sucked = true;
        sound('voidSuck');
      }
      // đang bị cuốn: máy quay tự xoay dần về phía hố (vẫn xoay chuột thêm được), để thấy mình bị cuốn quanh hố
      if (s === 'pull' && Pz.cam) {
        const rp = f.rig.root.position;
        let dw = Math.atan2(hole.c.x - rp.x, hole.c.z - rp.z) - Pz.cam.yawT;
        dw = Math.atan2(Math.sin(dw), Math.cos(dw));
        Pz.look(-dw * Math.min(1, sec * FX.FACE_RATE), 0);
      }
      // lúc người chui vào lõi, máy quay theo vào trong lõi (lõi vẽ cả mặt trong: chỉ còn một màu đen)
      if (s === 'pull' || s === 'in') {
        const pl = f.void.pulled,
          u = Math.min(1, (hole.t - pl.t0) / pl.dur),
          x = Math.max(0, Math.min(1, (u - FX.CAM_IN[0]) / (FX.CAM_IN[1] - FX.CAM_IN[0]))),
          k = x * x * (3 - 2 * x);
        if (k > 0) {
          if (!st.camDir) st.camDir = hole.c.clone().sub(G.camera.position).normalize();
          Pz.setCamPull(hole.c, v1.copy(hole.c).addScaledVector(st.camDir, 10), k);
        }
        if (u >= FX.DARK_AT && !st.inside) {
          st.inside = true;
          G.voidInside.enter();
        }
      }
      if (s === 'in' && !st.inside) {
        st.inside = true;
        G.voidInside.enter();
      }
    }
    function update(sec, still) {
      // bên trong hố (người nhập hồn đã bị hút): tối hẳn thì linh hồn rời thân
      if (G.voidInside.on && G.voidInside.update(sec) === 'exit' && G.possess && G.possess.inside) {
        G.possess.setHeld(false);
        G.possess.exit();
      }
      if (!hole.on) return;
      if (!still) hole.t += sec;
      const t = hole.t,
        fade = Plan.fade(t),
        outer = Plan.outer(t, hole.R),
        hz = Plan.horizon(t, hole.R);
      hole.c.set(hole.aim.x, kit.ground(hole.aim.x, hole.aim.z) + Plan.height(t, hole.R), hole.aim.z);
      G.hole3d.show(hole.c, outer, hz, t, fade);
      // (màu ánh sáng theo hướng nhìn: tính ngay trước khi vẽ, lúc máy quay đã yên chỗ: render/fx/post3d.js hook)
      st.fade = fade;
      if (!st.unhook && G.post && G.post.hook) st.unhook = G.post.hook(() => hole.on && light());
      Warp.set({ center: hole.c, reach: Plan.reach(t, hole.R), band: P.BAND, outer, size: P.SIZE, time: t, isle: hole.isle, fade });
      if (fade < 1) pull.releaseAll(); // (hố đang tan: trả người lại)
      else {
        const skip = G.possess && G.possess.inside && G.possess.st.i === hole.i ? G.possess.st.id : null;
        pull.step(hole, skip);
        player(sec);
      }
      if (!still && fade > 0.2) particles(sec, outer);
      // khối lưới mới dựng trong lúc hố còn (công trình đổi bản vẽ xa, gần theo máy quay): tách thêm, mỗi giây một lần
      if (fade >= 1 && Math.floor(t) !== Math.floor(t - sec)) hole.pieces += pieces.scan(hole.i);
      if (Plan.done(t)) stop();
    }
    G.blackHole = { start, update, stop, hole, get on() {
      return hole.on;
    } };
  }
  BK.BlackHole = { setup, FX };
})(typeof self !== 'undefined' ? self : globalThis);
