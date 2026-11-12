/* Bể Kính · render/deep/denizens3d.js · Sinh vật sống dưới đáy bể: chỗ ở, nếp sống, cảnh báo kẻ địch (design/ke-hoach-buoc-23.md)
 * Hình và cử động: render/deep/beings3d.js. Ở đây: đặt sinh vật vào ba phế tích và ba đường hầm, cho từng con sống theo nếp
 * riêng, và trạng thái chiến khi có kẻ địch.
 *   - Người Ốc (10, Thành Vỏ Ốc): ở trong nhà vỏ ốc; thỉnh thoảng ra đi vài vòng hay bơi một vòng trong phế tích rồi về.
 *   - Người Vây (10, Vườn Treo): ở trong vòm cuốn của các tầng vườn; thỉnh thoảng bơi ra một vòng rồi chui lại vào vòm.
 *   - Người Canh Hầm (mỗi hầm 1): đi qua lại trong lòng hầm, thỉnh thoảng ra sát cửa thò đầu nhìn ra. Không bơi.
 *   - Người Rêu Đá (Đô Thị Đá 6, Thành Vỏ Ốc 2, Vườn Treo 1), Người San Hô (Đô Thị Đá 9): không bơi; phần lớn thời gian nằm co
 *     ngụy trang, thỉnh thoảng đứng dậy đi vài bước rồi co lại.
 *   - Quái vật: Rồng Lươn Đen theo bầy (Thành Vỏ Ốc 4, Vườn Treo 4), Cá Mập Xương theo đàn (Vườn Treo 3, Đô Thị Đá 3), Bạch
 *     Tuộc Mắt Vực đơn lẻ (Thành Vỏ Ốc 1, Đô Thị Đá 1). Mỗi phế tích có hai trong ba loài.
 * Cảnh báo kẻ địch: kẻ địch là máy quay khi ở dưới nước (người chơi) và mọi vật trong D.threats ({ position }: tàu ngầm sau
 * này). Mỗi sinh vật có một chỗ ở (nhà, chỗ nằm, lãnh địa của bầy) và một vùng cảnh báo quanh chỗ ở đó (RULES.zone): kẻ địch
 * vào trong vùng thì nó mới chuyển sang chiến: dồn tốc lực lao tới, cắn xé (cử động chiến); bạch tuộc quấn xúc tu lấy con mồi;
 * bầy quái vật cùng lao vào. Đuổi không xa chỗ ở quá zone × leash, không ra khỏi phế tích (hầm với Người Canh Hầm), không lên
 * cao quá trần: kẻ địch ra ngoài thì chúng dừng lại, chờ một lúc rồi về chỗ.
 * Chỉ vẽ và cho chạy khi máy quay ở dưới nước, và chỉ những phế tích gần máy quay.
 * Cần: three.js, render/deep/terrain3d.js, citadel3d.js (S.homes, S.free), tunnels3d.js, beings3d.js. */
(function (root) {
  'use strict';
  const BK = root.BK || (root.BK = {});

  /* ---------- Luật (số chỉnh ở đây) ---------- */
  const RULES = {
    // trần của phế tích tính từ đáy rãnh: NPC biết bơi, quái vật
    capNpc: 55,
    capMonster: 30,
    // vùng của mỗi sinh vật, tính từ chỗ ở (a.anchor: nhà, chỗ nằm, lãnh địa của bầy; Người Canh Hầm: chỗ đang đứng):
    //   roam: bán kính đi lại lúc bình thường;
    //   zone: bán kính cảnh báo: kẻ địch vào trong vòng này mới bị đuổi;
    //   đuổi không ra xa chỗ ở quá zone × leash; kẻ địch ra ngoài zone × leave quá calm giây thì thôi, về chỗ
    zone: { snail: 14, fin: 16, keeper: 10, stone: 15, coral: 11, eel: 24, shark: 24, octo: 14 },
    roam: { snail: 12, fin: 22, stone: 14, coral: 9, eel: 16, shark: 16, octo: 8 },
    leash: 1.6,
    leave: 1.4,
    calm: 2.5,
    // bạch tuộc: tầm xúc tu (gần hơn thì quấn lấy con mồi), khoảng cách giữ thân khi quấn
    octoGrab: 6.5,
    octoHold: 3.5,
    // tốc độ (đơn vị / giây): đi, bơi, chiến
    speed: {
      snail: [0.9, 1.8, 5],
      fin: [0, 2.8, 7.5],
      keeper: [1.4, 0, 5.5],
      stone: [1.1, 0, 7.5],
      coral: [0.9, 0, 6],
      eel: [0, 2.8, 9],
      shark: [0, 3.2, 10],
      octo: [0, 1.5, 5.5],
    },
  };
  // điểm (u, v) có nằm trong elip của phế tích (tỉ lệ e) không; kéo điểm ngoài về mép elip
  const ellipse = (S, u, v) => Math.hypot(u / S.A, v / S.B);
  function clampEllipse(S, u, v, emax) {
    const e = ellipse(S, u, v);
    return e <= emax ? [u, v] : [(u * emax) / e, (v * emax) / e];
  }

  function build(D) {
    const { THREE, SITES, TUNNELS, TUN_RC, TUN_FLOOR, hAt, deep } = D;
    const T = THREE,
      V = (x = 0, y = 0, z = 0) => new T.Vector3(x, y, z);
    const BE = BK.DeepBeings.create({ lights: false });
    const group = new T.Group();
    group.name = 'sinh vật đáy bể';
    group.visible = false;
    deep.add(group);
    let seed = 9001;
    const rnd = () => {
      const x = Math.sin(seed++ * 127.1 + 311.7) * 43758.5453;
      return x - Math.floor(x);
    };
    const pick = (a) => a[Math.floor(rnd() * a.length)];

    /* ---------- Toạ độ riêng của từng phế tích ---------- */
    const RU = SITES.map((S, k) => {
      const at = (u, v) => ({ x: S.x + S.ux * u - S.uz * v, z: S.z + S.uz * u + S.ux * v });
      const loc = (x, z) => {
        const dx = x - S.x,
          dz = z - S.z;
        return { u: dx * S.ux + dz * S.uz, v: -dx * S.uz + dz * S.ux };
      };
      return { k, S, at, loc, floor: hAt(S.x, S.z), agents: [] };
    });
    // khối đá của phế tích (render/deep/kit3d.js frame ghi S.solid): điểm (u, v) cách mọi khối hơn m thì là đất trống
    const solids = (R, u, v, m) => (R.S.solid || []).filter((b) => u > b.u0 - m && u < b.u1 + m && v > b.v0 - m && v < b.v1 + m);
    // chỗ đất trống để đi, để nằm (Thành Vỏ Ốc: hỏi thêm S.free của citadel3d.js)
    const openGround = (R, u, v, m = 1) => {
      if (ellipse(R.S, u, v) > 0.86) return false;
      if (R.S.free && !R.S.free(u, v, m, 0.9, 1)) return false;
      return !solids(R, u, v, m).length;
    };
    // đường thẳng p → q trên đất không cắt khối đá nào (dò từng bước 1,5)
    const clearPath = (R, p, q, m) => {
      const n = Math.ceil(Math.hypot(q.u - p.u, q.v - p.v) / 1.5);
      for (let i = 1; i <= n; i++) if (solids(R, p.u + ((q.u - p.u) * i) / n, p.v + ((q.v - p.v) * i) / n, m).length) return false;
      return true;
    };
    // chỗ đất trống ngẫu nhiên: khắp phế tích, hay quanh near trong bán kính radius (đi tới được bằng đường thẳng)
    // (c, cr: chỉ chọn trong vòng bán kính cr quanh c: vùng đi lại của sinh vật)
    const groundPoint = (R, near, radius, m = 1, c, cr) => {
      for (let i = 0; i < 120; i++) {
        const a = rnd() * Math.PI * 2,
          d = Math.sqrt(rnd()) * radius,
          mm = i < 80 ? m : 0.5,
          u = near ? near.u + Math.cos(a) * d : Math.cos(a) * R.S.A * 0.85 * Math.sqrt(rnd()),
          v = near ? near.v + Math.sin(a) * d : Math.sin(a) * R.S.B * 0.85 * Math.sqrt(rnd());
        if (c && Math.hypot(u - c.u, v - c.v) > cr) continue;
        if (openGround(R, u, v, mm) && (!near || clearPath(R, near, { u, v }, 0.6))) return { u, v };
      }
      return near || { u: 0, v: 0 };
    };
    // điểm bơi trong vùng bán kính cr quanh c (trong phế tích), cao hơn mặt đất lo..hi, và cao hơn mái khối đá bên dưới 3
    // (không bơi xuyên mái); trần cap tính từ đáy rãnh
    const swimPoint = (R, lo, hi, cap, c, cr) => {
      const a = rnd() * Math.PI * 2,
        d = Math.sqrt(rnd()) * cr,
        [pu, pv] = clampEllipse(R.S, c.u + Math.cos(a) * d, c.v + Math.sin(a) * d, 0.85),
        p = { u: pu, v: pv },
        w = R.at(p.u, p.v),
        g = hAt(w.x, w.z),
        top = Math.max(0, ...solids(R, p.u, p.v, 3).map((b) => b.top));
      return worldOf(R, p, Math.min(R.floor + cap, Math.max(g + lo + rnd() * (hi - lo), g + top + 3)));
    };
    const worldOf = (R, p, y) => {
      const w = R.at(p.u, p.v);
      return V(w.x, y == null ? hAt(w.x, w.z) : y, w.z);
    };

    /* ---------- Dựng một sinh vật ---------- */
    const agents = [];
    function spawn(kind, R, make, scale, extra) {
      const b = make();
      const holder = new T.Group();
      holder.rotation.order = 'YXZ';
      const inner = new T.Group();
      inner.scale.setScalar(scale || 1);
      inner.add(b.root);
      holder.add(inner);
      BE.bake(holder);
      group.add(holder);
      const sp = RULES.speed[kind];
      const a = Object.assign(
        {
          kind,
          b,
          R,
          holder,
          pos: V(),
          vel: V(),
          yaw: rnd() * Math.PI * 2,
          yawRate: 0,
          state: 'idle',
          timer: rnd() * 6,
          route: [],
          mode: 'idle',
          walk: sp[0],
          swimV: sp[1],
          run: sp[2],
          size: b.size * (scale || 1),
          fight: 0,
          calm: 0,
          tPh: rnd() * 100,
          swimmer: sp[1] > 0,
        },
        extra || {},
      );
      agents.push(a);
      if (R) R.agents.push(a);
      return a;
    }

    /* ---------- Thành Vỏ Ốc: 10 Người Ốc, 2 Người Rêu Đá, bầy 4 Rồng Lươn Đen, 1 Bạch Tuộc ---------- */
    {
      const R = RU[0],
        homes = (R.S.homes || []).slice().sort((p, q) => Math.hypot(p[0], p[1]) - Math.hypot(q[0], q[1]));
      for (let i = 0; i < 10; i++) {
        const h = homes[Math.floor((i * homes.length) / 10)] || [rnd() * 40 - 20, rnd() * 40 - 20, 2];
        // cửa nhà: phía quay về giữa rãnh, cách tâm nhà r + 1
        const dl = Math.hypot(h[0], h[1]) || 1,
          door = { u: h[0] - (h[0] / dl) * (h[2] + 1), v: h[1] - (h[1] / dl) * (h[2] + 1) };
        const a = spawn('snail', R, BE.snailman, 1, { home: { u: h[0], v: h[1] }, door, state: 'home', timer: 3 + rnd() * 25 });
        a.pos.copy(worldOf(R, a.home));
        a.anchor = a.pos.clone();
      }
    }
    /* ---------- Vườn Treo: 10 Người Vây trong vòm cuốn mặt trước các tầng ---------- */
    {
      const R = RU[1],
        arches = [];
      for (let t = 0; t < 4; t++) {
        const W = 128 - 15 * t,
          Dp = 80 - 9 * t,
          u0 = 6 + 4.5 * t,
          front = -(u0 - W / 2 - 0.2), // (Vườn Treo dựng lật trục u: render/deep/ruins3d.js)
          n = Math.max(3, Math.round(Dp / 7.5));
        for (let i = 0; i < n; i++) arches.push({ u: front, v: -Dp / 2 + (i + 0.5) * (Dp / n), tier: t });
      }
      for (let i = 0; i < 10; i++) {
        const ar = arches[Math.floor((i * arches.length) / 10 + 1) % arches.length],
          y = (p) => hAt(R.at(p.u, p.v).x, R.at(p.u, p.v).z) - 0.3 + ar.tier * 7.5 + 1.6;
        const home = { u: ar.u - 1.2, v: ar.v },
          door = { u: ar.u + 2.2, v: ar.v };
        const a = spawn('fin', R, BE.finman, 1, { home, door, homeY: y(home), state: 'home', timer: 3 + rnd() * 25 });
        a.pos.copy(worldOf(R, home, a.homeY));
        a.anchor = a.pos.clone();
      }
    }
    /* ---------- Người Rêu Đá, Người San Hô: nằm co ngụy trang ---------- */
    const camoAt = (kind, R, make, n) => {
      for (let i = 0; i < n; i++) {
        const p = groundPoint(R, null, 0, kind === 'stone' ? 3.5 : 1.5),
          a = spawn(kind, R, make, 1, { state: 'camo', timer: 5 + rnd() * 30, mode: 'curl', spot: p, home: p });
        a.pos.copy(worldOf(R, p));
        a.anchor = a.pos.clone();
      }
    };
    camoAt('stone', RU[0], BE.mossGiant, 2);
    camoAt('stone', RU[1], BE.mossGiant, 1);
    camoAt('stone', RU[2], BE.mossGiant, 6);
    camoAt('coral', RU[2], BE.coralman, 9);
    /* ---------- Người Canh Hầm: mỗi hầm một người ---------- */
    TUNNELS.forEach((TN, k) => {
      const a = spawn('keeper', null, BE.keeper, 1, { tn: TN, s: 0.3 + rnd() * 0.4, sTarget: 0.5, state: 'patrol', timer: 2 });
      a.pos.copy(tunnelPos(TN, a.s));
      a.anchor = a.pos.clone();
    });
    function tunnelPos(TN, s) {
      const th = TN.a + (TN.b - TN.a) * s;
      return V(Math.cos(th) * TUN_RC, TUN_FLOOR, Math.sin(th) * TUN_RC);
    }
    /* ---------- Quái vật: bầy, đàn, đơn lẻ ---------- */
    // lãnh địa: mỗi bầy (hay con đơn lẻ) một vùng trong phế tích, xa lãnh địa của bầy khác nhất có thể
    function territory(R) {
      R.terr = R.terr || [];
      let best = null,
        bd = -1;
      for (let i = 0; i < 40; i++) {
        const p = groundPoint(R, null, 0, 4),
          e = ellipse(R.S, p.u, p.v),
          d = Math.min(1e9, ...R.terr.map((q) => Math.hypot(p.u - q.u, p.v - q.v)));
        if (e < 0.2 || e > 0.7) continue;
        if (d > bd) ((bd = d), (best = p));
      }
      best = best || { u: 0, v: 0 };
      R.terr.push(best);
      return best;
    }
    function pack(kind, R, make, scale, n) {
      const home = territory(R),
        leader = spawn(kind, R, make, scale, { state: 'roam', timer: 0, lead: true, home });
      leader.pos.copy(swimPoint(R, 2, 8, RULES.capMonster - 4, home, RULES.roam[kind]));
      leader.anchor = worldOf(R, home);
      leader.anchor.y += 4;
      leader.pack = [leader];
      for (let i = 1; i < n; i++) {
        const f = spawn(kind, R, make, scale, {
          state: 'follow',
          leader,
          home,
          anchor: leader.anchor,
          slot: V((i % 2 ? 1 : -1) * (2 + i * 1.2), (rnd() - 0.5) * 2, -3 - i * 2.5),
        });
        f.pos.copy(leader.pos).add(f.slot);
        leader.pack.push(f);
      }
    }
    // quái vật: to gấp 3–4 lần NPC (dài khoảng 8–9), bơi sát đáy
    const eel = () => BE.eelDragon(1);
    pack('eel', RU[0], eel, 0.12, 4);
    pack('eel', RU[1], eel, 0.12, 4);
    pack('shark', RU[1], BE.boneShark, 0.18, 3);
    pack('shark', RU[2], BE.boneShark, 0.18, 3);
    for (const R of [RU[0], RU[2]]) {
      const home = territory(R),
        o = spawn('octo', R, BE.abyssEye, 0.1, { state: 'roam', timer: 0, lead: true, home });
      o.pos.copy(worldOf(R, home));
      o.anchor = o.pos.clone();
      o.anchor.y += 3;
    }

    /* ---------- Giới hạn chỗ: trong phế tích, dưới trần; Người Canh Hầm trong lòng hầm ---------- */
    const isMonster = (a) => a.kind === 'eel' || a.kind === 'shark' || a.kind === 'octo';
    function yRange(a, x, z) {
      const g = hAt(x, z);
      if (a.kind === 'octo') return [g, g + 6];
      if (isMonster(a)) return [g + 1.2, a.R.floor + RULES.capMonster];
      if (a.swimming || a.kind === 'fin') return [g + 0.6, a.R.floor + RULES.capNpc];
      return [g, g];
    }
    function confine(a) {
      if (a.kind === 'keeper') {
        const th = Math.atan2(a.pos.z, a.pos.x),
          s = Math.max(0.01, Math.min(0.99, angOff(th, a.tn.a) / (a.tn.b - a.tn.a))),
          p = tunnelPos(a.tn, s);
        a.s = s;
        a.pos.copy(p);
        return;
      }
      const L = a.R.loc(a.pos.x, a.pos.z),
        [u, v] = clampEllipse(a.R.S, L.u, L.v, isMonster(a) ? 0.92 : 0.9),
        w = a.R.at(u, v);
      a.pos.x = w.x;
      a.pos.z = w.z;
      const [lo, hi] = yRange(a, w.x, w.z);
      a.pos.y = Math.max(lo, Math.min(hi, a.pos.y));
    }
    const angOff = (x, base) => {
      let d = x - base;
      while (d > Math.PI) d -= Math.PI * 2;
      while (d < -Math.PI) d += Math.PI * 2;
      return d;
    };

    /* ---------- Nếp sống: chọn đích tiếp theo ---------- */
    function nextPlan(a) {
      const R = a.R;
      switch (a.kind) {
        case 'snail': {
          if (a.state === 'home') {
            // ra khỏi nhà: 60% đi bộ 2–4 chặng quanh nhà, 40% bơi một vòng trong phế tích
            a.swimming = rnd() < 0.4;
            const pts = [];
            let p = a.door;
            for (let i = 0, n = 2 + Math.floor(rnd() * 3); i < n; i++) {
              if (a.swimming) pts.push(swimPoint(R, 3, 12, RULES.capNpc - 2, a.door, RULES.roam.snail));
              else pts.push(worldOf(R, (p = groundPoint(R, p, 8, 1, a.door, RULES.roam.snail))));
            }
            pts.push(worldOf(R, a.door));
            a.route = pts;
            a.state = 'out';
            a.pos.copy(worldOf(R, a.door));
          } else {
            a.state = 'home';
            a.swimming = false;
            a.timer = 10 + rnd() * 35;
          }
          break;
        }
        case 'fin': {
          if (a.state === 'home') {
            // ra khỏi vòm: bơi thẳng ra trước mặt tầng vườn rồi mới lên cao (không xuyên qua khối tầng)
            const gate = worldOf(R, a.door, a.homeY + 1),
              clear = worldOf(R, { u: a.door.u + 12, v: a.door.v }, a.homeY + 4),
              pts = [gate, clear];
            for (let i = 0, n = 3 + Math.floor(rnd() * 3); i < n; i++)
              pts.push(swimPoint(R, 4, 14, RULES.capNpc - 2, a.door, RULES.roam.fin));
            pts.push(clear.clone(), gate.clone());
            a.route = pts;
            a.state = 'out';
            a.pos.copy(pts[0]);
          } else {
            a.state = 'home';
            a.timer = 8 + rnd() * 30;
          }
          break;
        }
        case 'stone':
        case 'coral': {
          if (a.state === 'camo') {
            const pts = [];
            let p = a.spot;
            for (let i = 0, n = 1 + Math.floor(rnd() * 3); i < n; i++)
              pts.push(worldOf(R, (p = groundPoint(R, p, 8, a.kind === 'stone' ? 3.5 : 1.5, a.home, RULES.roam[a.kind]))));
            a.route = pts;
            a.state = 'walk';
            a.wake = 1.2; // (đứng dậy trước rồi mới đi)
          } else {
            a.spot = R.loc(a.pos.x, a.pos.z);
            a.state = 'camo';
            a.timer = 15 + rnd() * 40;
          }
          break;
        }
        case 'keeper': {
          if (a.state === 'patrol' && rnd() < 0.35) {
            // ra sát cửa gần hơn (đôi khi cửa xa), thò đầu nhìn ra
            a.peekEnd = a.s > 0.5 !== rnd() < 0.2 ? 1 : 0;
            a.sTarget = a.peekEnd ? 0.985 : 0.015;
            a.state = 'toPeek';
          } else {
            // đi qua lại một quãng (hầm dài: mỗi lần một phần năm lòng hầm)
            a.sTarget = Math.max(0.05, Math.min(0.95, a.s + (rnd() - 0.5) * 0.4));
            a.state = 'patrol';
          }
          break;
        }
        default: {
          // quái vật dẫn đầu (hay đơn lẻ): bơi tới một điểm ngẫu nhiên trong phế tích
          // (bạch tuộc bò, nổi sát mặt đất; lươn, cá mập bơi sát đáy, cao hơn mái nhà bên dưới)
          a.route = [
            a.kind === 'octo'
              ? swimPoint(R, 0.3, 3, RULES.capMonster - 4, a.home, RULES.roam.octo)
              : swimPoint(R, 1.5, 9, RULES.capMonster - 4, a.home, RULES.roam[a.kind]),
          ];
          a.state = 'roam';
        }
      }
    }

    /* ---------- Cảnh báo kẻ địch ---------- */
    const threats = (D.threats = D.threats || []);
    const camThreat = { position: V(), active: false, player: true };
    const info = { fighting: 0, level: 0, attacks: 0, held: false };
    function threatFor(a) {
      // kẻ địch gần nhất mà sinh vật này được phép đuổi (trong phế tích hay trong hầm của nó)
      let best = null,
        bd = 1e9;
      for (const th of threats.concat(camThreat.active ? [camThreat] : [])) {
        const p = th.position;
        if (a.kind === 'keeper') {
          const r = Math.hypot(p.x, p.z),
            s = angOff(Math.atan2(p.z, p.x), a.tn.a) / (a.tn.b - a.tn.a);
          if (Math.abs(r - TUN_RC) > 14 || s < -0.05 || s > 1.05 || p.y > TUN_FLOOR + 24) continue;
        } else {
          const L = a.R.loc(p.x, p.z);
          if (ellipse(a.R.S, L.u, L.v) > 1.15 || p.y > a.R.floor + (isMonster(a) ? RULES.capMonster : RULES.capNpc) + 25) continue;
        }
        // (kẻ địch gần chỗ ở nhất: dA; khoảng cách tới chính sinh vật: d)
        const dA = p.distanceTo(a.anchor);
        if (dA < bd) ((bd = dA), (best = th));
      }
      return best ? { th: best, dA: bd, d: best.position.distanceTo(a.pos) } : null;
    }

    /* ---------- Mỗi khung hình ---------- */
    const tmp = V(),
      des = V();
    function steer(a, target, speed, dt, accel) {
      des.copy(target).sub(a.pos);
      if (!a.swimming && !isMonster(a) && a.kind !== 'fin') des.y = 0;
      const d = des.length();
      if (d > 1e-3) des.multiplyScalar(Math.min(speed, d * 1.5) / d);
      a.vel.lerp(des, 1 - Math.exp(-dt * accel));
      a.pos.addScaledVector(a.vel, dt);
      return d;
    }
    function face(a, dt, rate) {
      const h = Math.hypot(a.vel.x, a.vel.z);
      if (h > 0.15) {
        const want = Math.atan2(a.vel.x, a.vel.z),
          d = angOff(want, a.yaw),
          step = Math.max(-rate * dt, Math.min(rate * dt, d));
        a.yaw += step;
        a.yawRate = step / Math.max(dt, 1e-3);
      } else a.yawRate *= 0.9;
    }
    function tick(a, dt, ts) {
      // --- chiến: kẻ địch vào vùng cảnh báo quanh chỗ ở (ở trong nhà vẫn nghe thấy)
      if (a.kind === 'keeper' && !a.fight) a.anchor.copy(a.pos); // (Người Canh Hầm: vùng theo chỗ đang đứng)
      const seen = threatFor(a),
        Z = RULES.zone[a.kind];
      a.seeing = !!seen && seen.dA < Z * RULES.leave;
      if (seen && seen.dA < Z) a.fight = Math.max(a.fight, 1);
      if (a.fight > 0) {
        if (!a.seeing) {
          a.calm += dt;
          if (a.calm > RULES.calm) {
            a.fight = 0;
            a.calm = 0;
            a.state =
              a.kind === 'snail' || a.kind === 'fin'
                ? 'out'
                : a.kind === 'stone' || a.kind === 'coral'
                  ? 'walk'
                  : a.kind === 'keeper'
                    ? 'patrol'
                    : a.lead
                      ? 'roam'
                      : 'follow';
            if (a.kind === 'snail' || a.kind === 'fin') a.route = [worldOf(a.R, a.door, a.kind === 'fin' ? a.homeY + 1 : null)];
            if (a.kind === 'stone' || a.kind === 'coral') a.route = [worldOf(a.R, a.home)];
            if (a.lead && isMonster(a)) a.route = [a.anchor.clone()];
            if (a.kind === 'keeper') a.sTarget = a.s;
          }
        } else a.calm = 0;
      }
      if (a.fight > 0 && seen) {
        a.wake = 0;
        // lao tới, dừng cách con mồi một tầm cắn, cắn xé (cử động chiến); bạch tuộc tới gần thì quấn xúc tu
        const grab = a.kind === 'octo' && seen.d < RULES.octoGrab,
          reach = a.kind === 'octo' ? RULES.octoHold : Math.max(1.2, a.size * 0.18);
        tmp.copy(seen.th.position);
        // không đuổi ra xa chỗ ở quá zone × leash
        const lim = Z * RULES.leash;
        if (tmp.distanceTo(a.anchor) > lim) tmp.sub(a.anchor).setLength(lim).add(a.anchor);
        if (a.kind === 'keeper') {
          const s = Math.max(0.01, Math.min(0.99, angOff(Math.atan2(tmp.z, tmp.x), a.tn.a) / (a.tn.b - a.tn.a)));
          tmp.copy(tunnelPos(a.tn, s));
        } else if (!isMonster(a) && a.kind !== 'fin') {
          a.swimming = a.kind === 'snail' && tmp.y > hAt(tmp.x, tmp.z) + 3;
        }
        tmp.sub(a.pos);
        const d = tmp.length();
        if (d > reach) tmp.multiplyScalar((d - reach) / d);
        else tmp.set(0, 0, 0);
        tmp.add(a.pos);
        steer(a, tmp, a.run || a.swimV * 3, dt, 3.2);
        a.mode = grab ? 'grab' : 'chase';
        a.b.prey = grab ? seen.th.position : null;
        if (grab) info.held = true;
        if (d < reach * 1.6 || grab) info.attacks += dt;
        confine(a);
        face(a, dt, isMonster(a) ? 3 : 9);
        // đối mặt con mồi khi ở gần
        if (d < reach * 2)
          a.yaw += angOff(Math.atan2(seen.th.position.x - a.pos.x, seen.th.position.z - a.pos.z), a.yaw) * Math.min(1, dt * 6);
        return;
      }
      // --- nếp sống
      a.b.prey = null;
      a.timer -= dt;
      switch (a.kind) {
        case 'snail':
        case 'fin': {
          if (a.state === 'home') {
            a.mode = 'idle';
            if (a.timer <= 0) nextPlan(a);
            return;
          }
          const tgt = a.route[0];
          if (!tgt) return nextPlan(a);
          const sp0 = a.kind === 'fin' || a.swimming ? a.swimV : a.walk;
          const d = steer(a, tgt, sp0, dt, a.kind === 'fin' ? 2 : 4);
          if (d < 1) a.route.shift();
          a.mode = a.kind === 'snail' && a.swimming ? 'swim' : 'move';
          if (!a.route.length) nextPlan(a);
          break;
        }
        case 'stone':
        case 'coral': {
          if (a.state === 'camo') {
            a.vel.multiplyScalar(0.8);
            a.mode = 'curl';
            if (a.timer <= 0) nextPlan(a);
            break;
          }
          if (a.wake > 0) {
            a.wake -= dt;
            a.mode = 'idle';
            break;
          }
          const tgt = a.route[0];
          if (!tgt) {
            nextPlan(a);
            break;
          }
          const d = steer(a, tgt, a.walk, dt, 3);
          a.mode = 'move';
          if (d < 1.2) {
            a.route.shift();
            if (!a.route.length) nextPlan(a);
          }
          break;
        }
        case 'keeper': {
          const goal = tunnelPos(a.tn, a.sTarget),
            d = steer(a, goal, a.walk, dt, 4);
          if (a.state === 'peek') {
            a.mode = 'idle';
            // nhìn ra cửa: quay mặt ra ngoài hầm
            const out = a.peekEnd ? 1 : -1,
              th = Math.atan2(a.pos.z, a.pos.x);
            a.yaw += angOff(Math.atan2(-Math.sin(th) * out, Math.cos(th) * out), a.yaw) * Math.min(1, dt * 3);
            if (a.timer <= 0) nextPlan(a);
            confine(a);
            return;
          }
          a.mode = d > 0.6 ? 'move' : 'idle';
          if (d <= 0.6) {
            if (a.state === 'toPeek') {
              a.state = 'peek';
              a.timer = 3 + rnd() * 4;
            } else if (a.timer <= 0) {
              a.timer = 2 + rnd() * 5;
              nextPlan(a);
            }
          }
          break;
        }
        default: {
          // quái vật
          if (a.state === 'follow' && a.leader) {
            const L = a.leader,
              c = Math.cos(L.yaw),
              s = Math.sin(L.yaw);
            tmp.set(a.slot.x * c + a.slot.z * s, a.slot.y, -a.slot.x * s + a.slot.z * c).add(L.pos);
            tmp.x += Math.sin(ts * 0.4 + a.tPh) * 3;
            tmp.y += Math.sin(ts * 0.3 + a.tPh * 2) * 2;
            steer(a, tmp, Math.max(a.swimV, L.vel.length() * 1.15), dt, 1.6);
          } else {
            const tgt = a.route[0];
            if (!tgt) nextPlan(a);
            else if (steer(a, tgt, a.swimV, dt, a.kind === 'octo' ? 0.8 : 1.2) < 4) nextPlan(a);
          }
          a.mode = a.kind === 'octo' && a.vel.length() < 0.6 ? 'idle' : 'move';
        }
      }
      confine(a);
      face(a, dt, isMonster(a) ? 0.9 : 5);
    }

    function update(dt, ts, cam, under) {
      group.visible = under;
      info.fighting = 0;
      info.held = false;
      if (!under) return;
      dt = Math.min(dt, 0.05);
      camThreat.position.copy(cam.position);
      camThreat.active = true;
      // chỉ cho chạy phế tích, hầm gần máy quay
      for (const a of agents) {
        const near = (a.R ? Math.hypot(cam.position.x - a.R.S.x, cam.position.z - a.R.S.z) : a.pos.distanceTo(cam.position)) < 260;
        a.live = near;
        if (near) {
          tick(a, dt, ts);
          // (Người Ốc, Người Vây ở trong nhà: không vẽ; có kẻ địch thì lao ra)
          a.live = !(a.state === 'home' && !a.fight);
        }
        a.holder.visible = a.live;
        if (a.fight > 0) info.fighting++;
      }
      // báo cho cả bầy: một con trong bầy thấy kẻ địch trong vùng thì cả bầy cùng lao vào (NPC không báo cho nhau)
      for (const a of agents) {
        const L = a.leader || a;
        if (a.fight > 0 && a.seeing && L.pack)
          for (const o of L.pack) {
            o.fight = Math.max(o.fight, 0.5);
            o.calm = 0;
          }
      }
      // vẽ
      for (const a of agents) {
        if (!a.live) continue;
        a.holder.position.copy(a.pos);
        a.holder.rotation.y = a.yaw;
        if (isMonster(a) && a.kind !== 'octo') a.holder.rotation.x = -Math.atan2(a.vel.y, Math.hypot(a.vel.x, a.vel.z) + 0.5) * 0.7;
        const spd = a.vel.length(),
          curve = isMonster(a) ? Math.max(-0.08, Math.min(0.08, -a.yawRate / Math.max(1, spd))) : 0;
        a.b.update(ts + a.tPh, dt, a.mode, spd / Math.max(1, a.size * 0.6), curve, cam.position);
      }
      info.level += ((info.fighting ? 1 : 0) - info.level) * Math.min(1, dt * 3);
    }

    D.denizens = { update, agents, info, threats, RULES, group };
  }
  BK.DeepDenizens = { build, RULES, clampEllipse, ellipse };
})(typeof self !== 'undefined' ? self : globalThis);
