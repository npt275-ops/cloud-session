/* Bể Kính · magic/soul/blackhole/blackhole.js · Điều khiển Hố đen: nối các phần theo nhịp (magic/soul/blackhole/plan.js)
 * start(chỗ ngắm): bắt đầu (đang có thì thôi). update(giây, đứng) mỗi khung hình:
 *   hình hố       hole3d.js: lớn dần trong GROW giây tới nửa đảo, bay cao dần trên chỗ ngắm
 *   hút vật thể   pieces.js tách đảo thành từng vật (cây, cỏ, đá, nhà, mảng gạch đường); warp3d.js cho từng vật nhấc lên, lộn
 *                 nhào, xoắn ốc vào lõi khi mặt hút qua nó và hố lớn hơn nó (vật nhỏ trước, nhà sau). Đất giữ nguyên
 *   hút người     pull.js: người trong tầm (hố lớn hơn người) bị cuốn lên xoắn vào tâm; dân cả đảo hoảng sợ bỏ chạy
 *   người nhập hồn (nếu ở đảo này): vẫn chạy tự do quan sát; vào tầm hút thì bị giữ (không đi được, chỉ xoay nhìn:
 *                 game/possess.js setHeld), lơ lửng rồi bị hút; qua lõi thì vào trong hố (inside.js), linh hồn rời thân
 *   bẻ cong ánh sáng  lượt hậu kỳ (render/fx/post3d.js lens): thấu kính hấp dẫn quanh lõi, theo chỗ hố trên màn hình
 *   hạt           vật chất cuốn về tâm theo đĩa, bụi bốc lên ở mặt hút; tiếng ù trầm (magic/soul/sounds.js)
 *   tan           sau HOLD_END hố tan dần, trả lại đảo (bản thử, để thử lại được)
 * Thời gian dừng (đứng): mọi thứ đứng im giữa chừng. Cần: plan.js, warp3d.js, pieces.js, hole3d.js, pull.js, inside.js. */
(function (root) {
  const BK = root.BK || (root.BK = {});
  const FX = {
    STREAM: 70, // (hạt/giây) vật chất cuốn vào theo đĩa
    DUST: 30, // (hạt/giây) bụi bốc lên ở mép tầm hút
    LENS_R: 1.7, // bóng đen trên màn hình (bán kính Einstein) bằng chừng này lần lõi đen
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
    const st = { acc: 0, dust: 0, player: null, sucked: false, inside: false };
    const sound = (name, ...a) => kit.audio && kit.audio[name] && kit.audio[name](...a);
    const v1 = new THREE.Vector3(),
      v2 = new THREE.Vector3();
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
      Object.assign(st, { acc: 0, dust: 0, player: null, sucked: false, inside: false });
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
      if (G.post) G.post.fx.lens = 0;
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
    // bẻ cong ánh sáng quanh hố (render/fx/post3d.js lens): tâm, bán kính Einstein trên màn hình theo chỗ hố, cỡ lõi
    function lens(hz, fade) {
      const fx = G.post && G.post.fx;
      if (!fx) return;
      const cam = G.camera;
      v1.copy(hole.c).project(cam);
      v2.copy(cam.up).applyQuaternion(cam.quaternion).multiplyScalar(hz * FX.LENS_R).add(hole.c).project(cam);
      // (sau máy quay thì thôi; máy quay chưa có ma trận hợp lệ khung này thì thôi, đừng để số hỏng làm đen cả màn hình)
      const bad = !Number.isFinite(v1.x + v1.y + v1.z + v2.x + v2.y);
      fx.lens = bad || v1.z > 1 || v1.z < -1 ? 0 : fade;
      if (bad) return;
      fx.lensC = [v1.x * 0.5 + 0.5, v1.y * 0.5 + 0.5];
      fx.lensR = Math.min(0.9, Math.abs(v2.y - v1.y) * 0.5 + Math.abs(v2.x - v1.x) * 0.5 * (cam.aspect || 1));
    }
    // người nhập hồn ở đảo này: lơ lửng, bị hút, vào trong hố
    function player() {
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
      if (s === 'in') {
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
      lens(hz, fade);
      Warp.set({ center: hole.c, reach: Plan.reach(t, hole.R), band: P.BAND, outer, size: P.SIZE, time: t, isle: hole.isle, fade });
      if (fade < 1) pull.releaseAll(); // (hố đang tan: trả người lại)
      else {
        const skip = G.possess && G.possess.inside && G.possess.st.i === hole.i ? G.possess.st.id : null;
        pull.step(hole, skip);
        player();
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
