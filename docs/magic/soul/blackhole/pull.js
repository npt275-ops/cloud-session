/* Bể Kính · magic/soul/blackhole/pull.js · Hố đen hút người (design/ke-hoach-buoc-37.md mục "Hố đen")
 * Người trong tầm hút (plan.js reach: hố lớn hơn người thì hút được) bị nhấc khỏi đất rồi xoắn ốc vào tâm: quay càng nhanh khi
 * càng gần, lộn nhào, kéo dài người ra, mỏng đi (lớp bẻ cong không gian warp3d.js còn kéo méo thêm khi tới gần); vào tới lõi
 * thì thu nhỏ hẳn (bị lõi che). Giữ thân người qua f.grab (render/village3d.js gọi sau khi đặt gốc khung).
 * Người nhập hồn (player): lơ lửng từ FLOAT_AT (không đi được, chỉ xoay nhìn: game/possess.js setHeld), xoay chậm, nhấp nhô;
 * từ playerAt bị hút vào như mọi người; playerIn là lúc qua chân trời sự kiện.
 * create(G) trả { step(t, hố), player(f, t, hố) trả 'float' | 'pull' | 'in', releaseAll() }; hố = { c (tâm), R, i (đảo) }.
 * Cần: three.js, render/village3d.js (each, f.grab), magic/soul/blackhole/plan.js. */
(function (root) {
  const BK = root.BK || (root.BK = {});
  function create(G) {
    const { THREE } = G;
    const Plan = BK.BlackHolePlan,
      P = Plan.P;
    const held = new Set(); // người đang bị giữ (để thả hết khi hố tan)
    const tmp = new THREE.Vector3();
    // đặt gốc khung theo đường xoắn: s = { t0, dur, d0, a0, y0, spin, yaw }, u 0..1
    function place(rt, s, u, hole) {
      const sp = Plan.spiral(u, s.d0),
        c = hole.c,
        hz = Plan.horizon(hole.t, hole.R);
      const d = Math.max(hz * 0.2, s.d0 * sp.d),
        a = s.a0 + sp.turn * s.spin;
      const y = s.y0 + (c.y - s.y0) * Math.min(1, u * u * 1.3) + sp.lift * 1.2 * (1 - u);
      rt.position.set(c.x + Math.cos(a) * d, y, c.z + Math.sin(a) * d);
      rt.rotation.set(u * u * 5 * s.spin, s.yaw + u * 7 * s.spin, u * 2.2, 'YXZ');
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
    // người nhập hồn: lơ lửng rồi bị hút
    function player(f, hole) {
      const t = hole.t;
      if (!f.void) {
        const rt = f.rig.root;
        f.void = { base: rt.position.clone(), yaw: f.yaw, pulled: null };
        f.grab = (r) => {
          const s = f.void;
          if (s.pulled) return place(r, s.pulled, Math.min(1, (hole.t - s.pulled.t0) / s.pulled.dur), hole);
          const u = Math.min(1, (hole.t - P.FLOAT_AT) / 2),
            e = u <= 0 ? 0 : u * u * (3 - 2 * u);
          tmp.copy(hole.c).sub(s.base).setY(0).multiplyScalar(0.04 * e); // (trôi nhẹ về phía hố)
          r.position.copy(s.base).add(tmp);
          r.position.y += P.FLOAT_UP * e + Math.sin(hole.t * 1.3) * 0.12 * e;
          r.rotation.set(0.12 * e * Math.sin(hole.t * 0.7), s.yaw + 0.25 * e * Math.sin(hole.t * 0.4), 0.1 * e * Math.sin(hole.t * 0.9), 'YXZ');
        };
        held.add(f);
      }
      if (t >= Plan.playerAt(hole.R) && !f.void.pulled) {
        const rt = f.rig.root,
          s = f.void;
        s.pulled = {
          t0: t,
          dur: P.PLAYER_SEC,
          d0: Math.hypot(rt.position.x - hole.c.x, rt.position.z - hole.c.z),
          a0: Math.atan2(rt.position.z - hole.c.z, rt.position.x - hole.c.x),
          y0: rt.position.y,
          spin: 0.6,
          yaw: f.yaw,
        };
      }
      return t >= Plan.playerIn(hole.R) ? 'in' : f.void.pulled ? 'pull' : t >= P.FLOAT_AT ? 'float' : 'stand';
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
