/* Bể Kính · magic/soul/blackhole/pull.js · Hố đen hút người (design/ke-hoach-buoc-37.md mục "Hố đen")
 * Người trong tầm hút (plan.js reach: hố lớn hơn người thì hút được) bị nhấc khỏi đất rồi xoắn ốc vào tâm: quay càng nhanh khi
 * càng gần, lộn nhào, kéo dài người ra, mỏng đi (lớp bẻ cong không gian warp3d.js còn kéo méo thêm khi tới gần); vào tới lõi
 * thì thu nhỏ hẳn (bị lõi che). Giữ thân người qua f.grab (render/village3d.js gọi sau khi đặt gốc khung).
 * Người nhập hồn (player): ngoài tầm hút thì vẫn chạy tự do ('free'). Vào tầm hút (plan.js reach) thì bị giữ: không đi được,
 * chỉ xoay nhìn (game/possess.js setHeld), lơ lửng, xoay chậm, nhấp nhô CATCH_FLOAT giây ('float'), rồi bị hút vào như mọi
 * người ('pull', PLAYER_SEC giây); qua chân trời sự kiện thì 'in'. Đã bị giữ thì không thoát được nữa.
 * create(G) trả { step(hố), player(f, hố) trả 'free' | 'float' | 'pull' | 'in', releaseAll() }; hố = { c (tâm), t, R, i (đảo) }.
 * Cần: three.js, render/village3d.js (each, f.grab), magic/soul/blackhole/plan.js. */
(function (root) {
  const BK = root.BK || (root.BK = {});
  function create(G) {
    const { THREE } = G;
    const Plan = BK.BlackHolePlan,
      P = Plan.P;
    const held = new Set(); // người đang bị giữ (để thả hết khi hố tan)
    const tmp = new THREE.Vector3(),
      UP = new THREE.Vector3(0, 1, 0),
      qT = new THREE.Quaternion(),
      qA = new THREE.Quaternion(),
      eu = new THREE.Euler();
    // đặt gốc khung theo đường xoắn: s = { t0, dur, d0, a0, y0, spin, yaw }, u 0..1
    function place(rt, s, u, hole) {
      // (vòng trong: sát lõi đen)
      const c = hole.c,
        sp = Plan.spiral(u, s.d0, Plan.horizon(hole.t, hole.R) * 1.4),
        d = s.d0 * sp.d,
        a = s.a0 + sp.turn * s.spin;
      const y = s.y0 + (c.y - s.y0) * sp.lift + Math.sin(u * 9 + s.a0) * 0.4 * (1 - u);
      rt.position.set(c.x + Math.cos(a) * d, y, c.z + Math.sin(a) * d);
      // lộn nhào nhẹ lúc bị nhấc, rồi quay đầu vào tâm; kéo dài người theo trục thân (lúc đó là hướng vào tâm), mỏng ngang
      qT.setFromEuler(eu.set(u * 2.5 * s.spin, s.yaw + u * 3 * s.spin, u * 1.2, 'YXZ'));
      tmp.copy(c).sub(rt.position);
      if (tmp.lengthSq() > 1e-6) qA.setFromUnitVectors(UP, tmp.normalize());
      rt.quaternion.copy(qT).slerp(qA, sp.head);
      const k = rt.scale.y,
        g = u >= 1 ? 0.001 : 1;
      rt.scale.set((k * g) / Math.sqrt(sp.stretch), k * g * sp.stretch, (k * g) / Math.sqrt(sp.stretch));
    }
    function grab(f, hole, sec) {
      const rt = f.rig.root;
      const s = {
        t0: hole.t,
        dur: P.PULL_SEC[0] + Math.random() * (P.PULL_SEC[1] - P.PULL_SEC[0]),
        d0: Math.hypot(rt.position.x - hole.c.x, rt.position.z - hole.c.z),
        a0: Math.atan2(rt.position.z - hole.c.z, rt.position.x - hole.c.x),
        y0: rt.position.y,
        spin: 1,
        yaw: f.yaw,
      };
      if (sec != null) s.dur = sec;
      f.void = s;
      f.grab = (r) => place(r, s, Math.min(1, (hole.t - s.t0) / s.dur), hole);
      held.add(f);
    }
    // mỗi khung hình: người mới vào tầm hút thì bị cuốn lên (trừ người nhập hồn: player lo riêng; người trong nhà đi cùng nhà)
    function step(hole, skip) {
      const V = G.villageOf(hole.i);
      if (!V || !V.each) return 0;
      const reach = Plan.reach(hole.t, hole.R);
      let n = 0;
      V.each((f, key) => {
        if (f.void || key === skip || f.inside || !f.rig) return;
        if (Math.hypot(f.rig.root.position.x - hole.c.x, f.rig.root.position.z - hole.c.z) > reach) return;
        grab(f, hole);
        n++;
      });
      return n;
    }
    // người nhập hồn: ngoài tầm thì tự do; vào tầm thì lơ lửng rồi bị hút
    function player(f, hole) {
      const t = hole.t,
        rt = f.rig.root;
      if (!f.void) {
        if (Math.hypot(rt.position.x - hole.c.x, rt.position.z - hole.c.z) > Plan.reach(t, hole.R)) return 'free';
        f.void = { base: rt.position.clone(), yaw: f.yaw, t0: t, pulled: null };
        f.grab = (r) => {
          const s = f.void;
          if (s.pulled) return place(r, s.pulled, Math.min(1, (hole.t - s.pulled.t0) / s.pulled.dur), hole);
          const u = Math.min(1, (hole.t - s.t0) / 1.2),
            e = u * u * (3 - 2 * u);
          tmp.copy(hole.c).sub(s.base).setY(0).multiplyScalar(0.04 * e); // (trôi nhẹ về phía hố)
          r.position.copy(s.base).add(tmp);
          r.position.y += P.FLOAT_UP * e + Math.sin(hole.t * 1.3) * 0.12 * e;
          r.rotation.set(0.12 * e * Math.sin(hole.t * 0.7), s.yaw + 0.25 * e * Math.sin(hole.t * 0.4), 0.1 * e * Math.sin(hole.t * 0.9), 'YXZ');
        };
        held.add(f);
      }
      const s = f.void;
      if (!s.pulled && t >= s.t0 + P.CATCH_FLOAT) {
        s.pulled = {
          t0: t,
          dur: P.PLAYER_SEC,
          d0: Math.hypot(rt.position.x - hole.c.x, rt.position.z - hole.c.z),
          a0: Math.atan2(rt.position.z - hole.c.z, rt.position.x - hole.c.x),
          y0: rt.position.y,
          spin: 1,
          yaw: f.yaw,
        };
      }
      return s.pulled ? (t >= s.pulled.t0 + s.pulled.dur ? 'in' : 'pull') : 'float';
    }
    function releaseAll() {
      for (const f of held) {
        f.grab = null;
        f.void = null;
      }
      held.clear();
    }
    return { step, player, releaseAll, held };
  }
  BK.BlackHolePull = { create };
})(typeof self !== 'undefined' ? self : globalThis);
