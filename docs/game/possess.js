/* Bể Kính · game/possess.js · Cú nhập hồn (design/ke-hoach-buoc-32.md)
 * Linh hồn người chơi nhập vào một NPC ngẫu nhiên và dính với người đó tới khi người đó chết (không được chọn người khác;
 * W.soul = { i: đảo, id: người }, lưu cùng trận). Máy trạng thái:
 *   off → wind (khựng lấy đà) → dive (lao xuống) → hit (chạm) → wake (mở mắt) → in (trong thân) → leave (bay ngược lên) → off
 * Mỗi pha một hàm trong PHASE; dòng thời gian (thời lượng, hiệu ứng) ở bảng T và các hàm của từng pha. Tệp này chỉ điều phối:
 *   máy quay (đặt thẳng camera, tắt OrbitControls lúc nhập hồn), lượt hậu kỳ (render/fx/post3d.js: G.post.fx),
 *   người bị nhập (render/village3d.js setDriver: đi theo phím; logic/brain.js: p.possessed thì không giao việc),
 *   đồ hoạ gần (render/near3d.js), hạt (render/fx/particles3d.js), âm thanh (render/fx/soul-audio.js), phím và cần ảo
 *   (ui/possess-ctl.js). Các phần đó không biết về nhau.
 * G.timeK: hệ số thời gian của logic trong lúc lao (game/loop.js nhân vào), 1 khi không nhập hồn.
 * Máy bật "giảm chuyển động": bỏ rung, bỏ mờ toả tâm, cú lao thay bằng tối dần rồi sáng lại.
 * Cần: three.js, game/cities.js (G.villageOf, G.lands), render/fx/post3d.js, render/rig3d.js (cỡ người). */
(function (root) {
  const BK = root.BK || (root.BK = {});
  // dòng thời gian (giây thật)
  const T = { wind: 0.4, dive: 1.4, hit: 0.2, wake: 1.2, leave: 1.2 };
  // máy quay sau vai: lùi sau đầu BACK, cao hơn đầu UP, lệch phải SIDE (đơn vị đảo; người cao 1,4); tường che thì lại gần nhưng
  // không gần hơn NEAR_MIN, nâng cao thêm tới LIFT; góc nhìn khi ở trong thân; tốc độ đi, chạy (đơn vị mỗi giây thật)
  const CAM = {
    BACK: 4.2,
    UP: 0.85,
    SIDE: 0.7,
    NEAR_MIN: 1.7,
    LIFT: 1.6,
    WALK: 2.2,
    ACC: 6, // tăng tốc, hãm (hệ số mỗi giây): đi tới đủ tốc độ chừng 0,4 giây, dừng chừng 0,3 giây
    DEC: 9,
    JUMP_V: 4.6, // nhảy: vận tốc bật lên, trọng lực (đơn vị mỗi giây): cao chừng nửa thân người, chạm đất sau 0,6 giây
    GRAV: 15,
    RUN: 5,
    FOV: 52,
    FOV_GOD: 34,
    PITCH_MIN: -0.55,
    PITCH_MAX: 0.75,
  };
  // hiệu ứng khi ở trong thân (render/fx/post3d.js)
  const IN_FX = { grade: 0.85, vignette: 0.45, grain: 0.3, dof: 0.75, focusRange: 26 };
  const HEAD = 1.22; // độ cao mắt người trưởng thành so với chân
  const reduce = () => !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
  const smooth = (v) => {
    v = clamp01(v);
    return v * v * (3 - 2 * v);
  };

  function setup(G) {
    const { THREE, camera, controls } = G,
      Wd = () => G.world; // thế giới logic (game/cities.js; có thể thay mới khi tua năm)
    const st = {
      phase: 'off',
      t: 0, // giây đã qua trong pha
      i: -1, // đảo
      id: null, // người
      god: null, // chỗ máy quay thượng đế lúc vào: { pos, target, fov }
      from: new THREE.Vector3(), // chỗ, hướng nhìn, góc nhìn của máy quay đầu pha
      fromLook: new THREE.Vector3(),
      fromFov: 34,
      yaw: 0, // hướng nhìn của máy quay sau vai (quanh trục đứng)
      pitch: 0.12,
      move: new THREE.Vector2(), // phím, cần ảo: (phải, tới) -1..1
      vel: new THREE.Vector3(), // vận tốc đi hiện tại (đơn vị mỗi giây thật, mặt phẳng ngang)
      jumpY: 0, // nhảy: độ cao trên mặt đất, vận tốc đứng
      jumpV: 0,
      run: false,
      camPos: new THREE.Vector3(),
      look: new THREE.Vector3(),
    };
    const v1 = new THREE.Vector3(),
      v2 = new THREE.Vector3(),
      up = new THREE.Vector3(0, 1, 0);
    G.timeK = 1;

    /* ---------- Người được nhập ---------- */
    // linh hồn chỉ nhập một lần vào một người ngẫu nhiên (người lớn, còn sống, đang ở đảo mình), dính với người đó tới khi chết
    function soulOf() {
      const W = Wd(),
        s = W.soul;
      if (s) {
        const S = W.islands[s.i],
          p = S && S.people.get(s.id);
        if (p && p.alive) return s;
      }
      const all = [];
      W.islands.forEach((S, i) => {
        for (const p of S.people.values())
          if (p.alive && !p.away && BK.People.ageOf(p, S.day) >= 16 && BK.People.ageOf(p, S.day) < 60) all.push({ i, id: p.id });
      });
      if (!all.length) return null;
      W.soul = all[Math.floor(Math.random() * all.length)];
      return W.soul;
    }
    const personOf = () => (st.i >= 0 ? Wd().islands[st.i].people.get(st.id) : null);
    const villageNow = () => (st.i >= 0 ? G.villageOf(st.i) : null);
    const folkNow = () => {
      const V = villageNow();
      return V ? V.folk(st.id) : null;
    };
    // chỗ đầu người (toạ độ thế giới); người chưa có hình (đảo xa chưa vẽ người): tâm đảo
    function headOf(out) {
      const f = folkNow();
      if (f && f.rig) return out.copy(f.rig.root.position).add(v2.set(0, HEAD, 0));
      const L = G.lands[st.i];
      return out.copy(L.center).add(v2.set(0, 4, 0));
    }
    const yawOfFolk = () => {
      const f = folkNow();
      return f ? f.yaw : 0;
    };

    // hướng tới và hướng sang phải của máy quay theo yaw (mặt phẳng ngang)
    const fwdOf = (yaw, out) => out.set(Math.sin(yaw), 0, Math.cos(yaw));
    const rightOf = (yaw, out) => out.set(-Math.cos(yaw), 0, Math.sin(yaw));
    /* ---------- Máy quay sau vai ---------- */
    // chỗ máy quay mong muốn sau vai (yaw, pitch của máy quay); tường che thì kéo máy quay lại gần (khung công trình, places().solids)
    function shoulder(head, out) {
      const cp = Math.cos(st.pitch),
        dir = v1.set(Math.sin(st.yaw) * cp, Math.sin(st.pitch), Math.cos(st.yaw) * cp); // hướng nhìn
      out.copy(head).addScaledVector(dir, -CAM.BACK).addScaledVector(rightOf(st.yaw, v2), CAM.SIDE).addScaledVector(up, CAM.UP);
      // (tường che: tìm chỗ gần nhất trên đường từ đầu ra máy quay còn trống; bị che thì máy quay lại gần, không gần hơn
      // NEAR_MIN, và nâng cao lên để nhìn chéo qua vai, không chui vào sau gáy)
      const free = clearFrac(head, out);
      if (free < 1) {
        const k = Math.max(CAM.NEAR_MIN / CAM.BACK, free);
        out.lerpVectors(head, out, k).addScaledVector(up, (1 - k) * CAM.LIFT);
      }
      // không chui xuống đất
      const L2 = G.lands[st.i],
        gy = L2.center.y + L2.surfAt(out.x - L2.center.x, out.z - L2.center.z) + 0.35;
      if (out.y < gy) out.y = gy;
      return out;
    }

    // phần trống trên đoạn từ đầu a tới máy quay b (0..1): điểm đầu tiên rơi vào khung công trình (places().solids), dưới nóc
    function clearFrac(a, b) {
      const L = G.lands[st.i],
        PL = G.buildings && G.buildings.places ? G.buildings.places(st.i) : null,
        solids = (PL && PL.solids) || [],
        q = new THREE.Vector3();
      for (let k = 1; k <= 10; k++) {
        q.lerpVectors(a, b, k / 10);
        const x = q.x - L.center.x,
          z = q.z - L.center.z,
          hy = q.y - L.center.y - L.surfAt(x, z);
        const hit = solids.some((B) => {
          if (B.kind === 'town' || hy > (B.self && B.self.box ? B.self.box.h : 4)) return false;
          const dx = x - B.x,
            dz = z - B.z,
            lx = dx * B.c - dz * B.s,
            lz = dx * B.s + dz * B.c;
          return lx > B.x0 - 0.25 && lx < B.x1 + 0.25 && lz > B.z0 - 0.25 && lz < B.z1 + 0.25;
        });
        if (hit) return (k - 1) / 10;
      }
      return 1;
    }

    /* ---------- Người bị nhập đi theo phím ---------- */
    // (vận tốc theo phím đổi dần: tăng tốc ACC, hãm DEC đơn vị mỗi giây bình phương, tính trong update)
    function driver(f) {
      f.lift = st.jumpY; // (render/village3d.js nâng người lên chừng này khi nhảy)
      if (!f.motion && BK.Motion3D) f.motion = BK.Motion3D.state(); // cử động có sức nặng (render/body/motion3d.js)
      const sp = st.vel.length();
      if (st.phase !== 'in' || sp < 0.05) return null;
      return { p: f.pos.clone().addScaledVector(v1.copy(st.vel).normalize(), 1.6), road: true, run: st.run, realSpeed: sp };
    }
    // vận tốc mong muốn theo phím: tới (move.y) theo hướng máy quay, ngang (move.x) sang phải
    function steer(sec) {
      const m = st.move,
        want = new THREE.Vector3();
      if (st.phase === 'in' && m.lengthSq() >= 0.01)
        fwdOf(st.yaw, want)
          .multiplyScalar(m.y)
          .addScaledVector(rightOf(st.yaw, v1), m.x)
          .normalize()
          .multiplyScalar(st.run ? CAM.RUN : CAM.WALK);
      const k = Math.min(1, sec * (want.lengthSq() > st.vel.lengthSq() ? CAM.ACC : CAM.DEC));
      st.vel.lerp(want, k);
    }

    /* ---------- Các pha ---------- */
    const fx = () => G.post.fx;
    function go(phase) {
      st.phase = phase;
      st.t = 0;
      st.from.copy(camera.position);
      st.fromFov = camera.fov;
      camera.getWorldDirection(v1);
      st.fromLook.copy(camera.position).addScaledVector(v1, 10);
      if (G.soulFx) G.soulFx.phase(phase); // âm thanh, hạt theo pha (render/fx/soul-audio.js, render/fx/particles3d.js)
    }
    const PHASE = {
      // khựng lấy đà: máy quay lùi lên một chút, viền tối lại, thời gian chậm hẳn
      wind(u) {
        const aim = headOf(v1);
        st.camPos.copy(st.from).addScaledVector(st.from.clone().sub(aim).normalize(), st.from.distanceTo(aim) * 0.06 * smooth(u));
        st.look.copy(st.fromLook).lerp(aim, smooth(u));
        Object.assign(fx(), { vignette: 0.6 * u, radial: 0, chroma: 0 });
        G.timeK = 1 - 0.85 * smooth(u);
        if (u >= 1) go('dive');
      },
      // lao xuống: nhanh dần theo hàm mũ, góc nhìn nới rộng rồi thu lại, mờ toả tâm và tách màu theo tốc độ; qua vòm kính một
      // vòng nứt sáng
      dive(u) {
        const aim = headOf(v1),
          e = (Math.exp(4 * u) - 1) / (Math.exp(4) - 1),
          de = (4 * Math.exp(4 * u)) / (Math.exp(4) - 1) / 4; // tốc độ (0..~1)
        const end = aim.clone().addScaledVector(fwdOf(yawOfFolk(), v2), -0.25);
        st.camPos.copy(st.from).lerp(end, e);
        st.camPos.y += Math.sin(Math.PI * u) * st.from.distanceTo(end) * 0.06; // (đường lao hơi cong)
        st.look.copy(st.fromLook).lerp(aim, smooth(Math.min(1, u * 2.2)));
        camera.fov = CAM.FOV_GOD + 61 * Math.pow(Math.sin(Math.PI * Math.min(1, u * 1.1)), 0.7);
        const calm = reduce();
        Object.assign(fx(), {
          radial: calm ? 0 : Math.min(1, de * 1.1),
          chroma: calm ? 0 : Math.min(1, de),
          vignette: 0.6 + 0.3 * u,
          ring: calm ? 0 : clamp01((u - 0.42) / 0.22) || 0,
          lids: calm ? smooth(u) : 0,
        });
        if (u >= 1) go('hit');
      },
      // chạm: chớp trắng, máy quay ở ngay đầu người
      hit(u) {
        headOf(st.camPos);
        st.look.copy(st.camPos).add(v1.set(Math.sin(yawOfFolk()), -0.05, Math.cos(yawOfFolk())));
        const calm = reduce();
        Object.assign(fx(), {
          flash: calm ? 0 : 1 - smooth(u * 1.6),
          radial: 0,
          chroma: calm ? 0 : 0.6 * (1 - u),
          ring: 0,
          lids: calm ? 1 : 0,
        });
        if (u >= 1) {
          st.yaw = yawOfFolk();
          st.pitch = 0.12;
          go('wake');
        }
      },
      // mở mắt: mí mắt mở dần (chớp lại một lần), ảnh nhoè rồi nét, máy quay lùi ra sau vai, thời gian về bình thường
      wake(u) {
        const head = headOf(v1).clone(),
          want = shoulder(head, v2.clone());
        st.camPos.copy(head).lerp(want, smooth(u));
        st.look.copy(head).add(v1.set(Math.sin(st.yaw), Math.sin(st.pitch) * 0.6, Math.cos(st.yaw)).multiplyScalar(4));
        camera.fov = CAM.FOV_GOD + (CAM.FOV - CAM.FOV_GOD) * smooth(u * 1.4);
        const blink = u > 0.5 && u < 0.72 ? Math.sin(((u - 0.5) / 0.22) * Math.PI) * 0.55 : 0;
        Object.assign(fx(), {
          flash: 0,
          chroma: 0,
          lids: Math.max(1 - smooth(u / 0.45), blink),
          blur: 0.9 * (1 - smooth(u)),
          grade: IN_FX.grade * smooth(u),
          vignette: 0.9 - (0.9 - IN_FX.vignette) * smooth(u),
          grain: IN_FX.grain * smooth(u),
          dof: IN_FX.dof * smooth(u),
          focusRange: IN_FX.focusRange,
        });
        G.timeK = 0.15 + 0.85 * smooth(u);
        if (u >= 1) go('in');
      },
      // trong thân: máy quay bám sau vai (lò xo), người đi theo phím
      in(u, sec) {
        const head = headOf(v1).clone(),
          want = shoulder(head, v2.clone());
        st.camPos.lerp(want, 1 - Math.exp(-sec * 12)); // (bám theo giờ thật: máy chậm vẫn theo kịp người chạy)
        st.look.copy(head).add(v1.set(Math.sin(st.yaw), Math.sin(st.pitch), Math.cos(st.yaw)).multiplyScalar(6));
        camera.fov += (CAM.FOV - camera.fov) * (1 - Math.exp(-sec * 6));
        Object.assign(fx(), IN_FX, { focus: st.camPos.distanceTo(head) });
        G.timeK = 1;
        if (!personOf() || !personOf().alive) exit();
      },
      // bay ngược lên về chỗ máy quay thượng đế, hiệu ứng tắt dần
      leave(u) {
        const e = smooth(u);
        st.camPos.copy(st.from).lerp(st.god.pos, e);
        st.look.copy(st.fromLook).lerp(st.god.target, e);
        camera.fov = st.fromFov + (st.god.fov - st.fromFov) * e;
        const k = 1 - e;
        Object.assign(fx(), {
          grade: IN_FX.grade * k,
          vignette: IN_FX.vignette * k,
          grain: IN_FX.grain * k,
          dof: IN_FX.dof * k,
          blur: 0,
          radial: 0,
        });
        if (u >= 1) done();
      },
    };

    /* ---------- Vào, ra ---------- */
    function enter() {
      if (st.phase !== 'off') return false;
      const s = soulOf();
      if (!s) return false;
      st.i = s.i;
      st.id = s.id;
      st.god = { pos: camera.position.clone(), target: controls.target.clone(), fov: camera.fov };
      controls.enabled = false;
      const p = personOf();
      p.possessed = true; // logic/brain.js: không giao việc
      villageNow().setDriver(st.id, driver);
      if (G.setFocus) G.setFocus(st.i);
      go('wind');
      return true;
    }
    function exit() {
      if (st.phase === 'off' || st.phase === 'leave') return;
      release();
      go('leave');
    }
    // trả người lại cho bộ não (người đó sống tiếp bình thường); linh hồn vẫn dính với người đó (W.soul)
    function release() {
      const p = personOf();
      if (p) p.possessed = false;
      const V = villageNow();
      if (V) {
        V.setDriver(st.id, null);
        const f = V.folk(st.id);
        if (f) f.motion = null; // (trả lại dáng đi chung của làng)
      }
      st.vel.set(0, 0, 0);
      if (G.near) G.near.set(false);
      if (G.softCrowd) G.softCrowd.clear();
    }
    function done() {
      st.phase = 'off';
      G.post.reset();
      G.timeK = 1;
      camera.fov = st.god.fov;
      camera.updateProjectionMatrix();
      camera.position.copy(st.god.pos);
      controls.target.copy(st.god.target);
      controls.enabled = true;
      controls.update();
      if (G.soulFx) G.soulFx.phase('off');
    }

    /* ---------- Mỗi khung hình (game/loop.js gọi sau controls.update, trước khi vẽ) ---------- */
    function update(dt) {
      if (st.phase === 'off') return;
      const sec = Math.min(0.1, dt / 1000);
      st.t += sec;
      const dur = T[st.phase],
        u = dur ? Math.min(1, st.t / dur) : 0;
      PHASE[st.phase](u, sec);
      steer(sec);
      // nhảy: bay lên rồi rơi xuống theo trọng lực, chạm đất thì dừng
      if (st.jumpY > 0) {
        st.jumpV -= CAM.GRAV * sec;
        st.jumpY += st.jumpV * sec;
        if (st.jumpY <= 0) {
          st.jumpY = 0;
          st.jumpV = 0;
          if (G.soulFx && G.soulFx.land) G.soulFx.land(st);
        }
      }
      if (st.phase === 'off') return;
      if (G.near) G.near.set(st.phase === 'wake' || st.phase === 'in', st.i, headOf(v1)); // đồ hoạ gần (render/near3d.js)
      // thân đồ chơi mềm cho mình và người gần (render/body/softbody3d.js): từ lúc chạm
      if (G.softCrowd) G.softCrowd.update(st.phase === 'hit' || st.phase === 'wake' || st.phase === 'in', st.i, headOf(v1), st.id, sec);
      // (vùng bóng nắng theo controls.target, render/perf3d.js: đặt vào đầu người thì bóng quanh người sắc nét)
      if (st.phase === 'wake' || st.phase === 'in') controls.target.copy(headOf(v1));
      camera.position.copy(st.camPos);
      camera.lookAt(st.look);
      camera.updateProjectionMatrix();
      // tâm toả của mờ toả tâm: chỗ người bị nhập trên màn hình
      const h = headOf(v1).project(camera);
      G.post.center.set(clamp01(h.x * 0.5 + 0.5), clamp01(h.y * 0.5 + 0.5));
      if (G.soulFx) G.soulFx.update(sec, st);
    }
    // nhảy (ui/possess-ctl.js, phím Space): chỉ khi đang đứng trên đất
    function jump() {
      if (st.phase !== 'in' || st.jumpY > 0) return;
      st.jumpV = CAM.JUMP_V;
      st.jumpY = 0.0001;
      if (G.soulFx && G.soulFx.jump) G.soulFx.jump(st);
    }
    // xoay nhìn (ui/possess-ctl.js): dx, dy theo radian
    function look(dx, dy) {
      if (st.phase !== 'in' && st.phase !== 'wake') return;
      st.yaw -= dx;
      st.pitch = Math.max(CAM.PITCH_MIN, Math.min(CAM.PITCH_MAX, st.pitch - dy));
    }
    G.possess = {
      enter,
      exit,
      update,
      look,
      jump,
      st,
      T,
      CAM,
      get active() {
        return st.phase !== 'off';
      },
      get inside() {
        return st.phase === 'in';
      },
      get person() {
        return personOf();
      },
    };
  }
  BK.Possess = { setup, T, CAM };
})(typeof self !== 'undefined' ? self : globalThis);
