/* Bể Kính · render/units/body.js · Thân người và đồ cầm tay cho nhân vật (dân, lính) của các khối nhân vật
 * Một người cao chừng 1,7 đứng ở (x, y, z), mặt quay về +z, dáng đồ chơi mềm như người trong bể (render/body/softbody3d.js):
 * đầu to tròn, thân tròn, tay chân viên nang, bàn tay tròn, giày bo; mặt có mắt đốm sáng, mày, mũi, má hồng, miệng cười,
 * tai; tóc ôm đầu. Khối tròn nhiều mặt (nhẵn) và chất liệu nhựa mờ có viền sáng (softMat) nên không thấy cạnh đa giác.
 *   person(k, P, x, y, z, o)   vẽ một người theo dáng o (render/units/isles/<đảo>.js LOOK):
 *       skin, hair (màu), hairStyle (short | bun | long | none), hat (non | quaithao | khan | helm | cap | helmet | visor |
 *       halo | band | none), hatColor, top (màu áo), topStyle (tunic | dress | armor | suit | robe), legs, shoes, sash
 *       (dải chéo màu cờ đảo), cape (áo choàng màu cờ đảo), glow (đường sáng trên áo bậc tương lai),
 *       right, left (đồ hai tay: tên trong GEAR), back (đồ sau lưng: tên trong GEAR)
 *   Tay có đồ thì gập ra trước (bàn tay ở R hay L), không có đồ thì buông thõng.
 *   GEAR    đồ cầm tay, đeo lưng: spear (giáo có tua màu cờ), sword, shieldRound (khiên tròn có ký hiệu đảo), crossbow (nỏ),
 *           bow, quiver (ống tên), rifle, baton, riotShield, energySword, laserRifle, staff (gậy phép có cầu sáng),
 *           greatsword, wings (đôi cánh sáng), hoe (cuốc vác vai), pole (đòn gánh hai thúng), basket, toolbox, handbag,
 *           tablet, lantern
 * Cần: three.js, render/build/kit3d.js, render/blocks/parts.js (H.emblem, H.torus). */
(function (root) {
  const BK = root.BK || (root.BK = {});
  const K = () => BK.BuildKit;
  const H = () => BK.Blocks.H;
  const team = (P) => (P.flag && P.flag.color) || P.accent;
  const R = [0.3, 0.84, 0.26], // bàn tay phải khi cầm đồ (so với gốc người)
    L = [-0.3, 0.84, 0.22];
  /* ---------- đồ cầm tay, đeo lưng (gốc ở chân người: x, y, z) ---------- */
  const GEAR = {
    spear(k, P, x, y, z) {
      const B = K();
      k.add(B.post(0.024, 2.25, 5), '#7a5232', x + R[0], y + 0.05, z + R[2]);
      k.add(B.cone(0.05, 0.26, 5), P.metal, x + R[0], y + 2.3, z + R[2]);
      k.add(B.box(0.08, 0.12, 0.08, 0.01, true), team(P), x + R[0], y + 2.15, z + R[2]);
    },
    sword(k, P, x, y, z, glow) {
      const B = K(),
        o = { rot: [-0.35, 0, 0] };
      k.add(B.box(0.05, 0.16, 0.05, 0.01, true), '#3a2a1a', x + R[0], y + R[1] - 0.05, z + R[2], o);
      k.add(B.box(0.22, 0.04, 0.06, 0.01, true), P.metal, x + R[0], y + R[1] + 0.1, z + R[2] + 0.04, o);
      k.add(B.box(0.06, 0.78, 0.015, 0.005, true), glow ? P.glow : '#d8dde2', x + R[0], y + R[1] + 0.13, z + R[2] + 0.05, Object.assign({ glow: !!glow }, o));
    },
    energySword: (k, P, x, y, z) => GEAR.sword(k, P, x, y, z, true),
    greatsword(k, P, x, y, z) {
      const B = K();
      k.add(B.box(0.05, 0.22, 0.05, 0.01, true), P.trim, x + R[0], y + R[1] - 0.1, z + R[2]);
      k.add(B.box(0.36, 0.05, 0.08, 0.01, true), P.metal, x + R[0], y + R[1] + 0.1, z + R[2]);
      k.add(B.box(0.1, 1.3, 0.02, 0.005, true), P.glow, x + R[0], y + R[1] + 0.14, z + R[2], { glow: true });
    },
    shieldRound(k, P, x, y, z) {
      const T = root.THREE,
        cx = x + L[0] - 0.05,
        cy = y + L[1],
        cz = z + L[2] + 0.08;
      k.add(new T.CylinderGeometry(0.3, 0.3, 0.05, 14), P.trim, cx, cy, cz, { rot: [Math.PI / 2, 0, 0] });
      k.add(new T.CylinderGeometry(0.26, 0.26, 0.06, 14), team(P), cx, cy, cz, { rot: [Math.PI / 2, 0, 0] });
      H().emblem(k, P, cx, cy, cz + 0.005, 0.5);
    },
    riotShield(k, P, x, y, z) {
      const B = K(),
        cx = x + L[0] - 0.05,
        cz = z + L[2] + 0.08;
      k.add(B.box(0.5, 0.85, 0.04, 0.02, true), '#2e3640', cx, y + 0.4, cz);
      k.add(B.box(0.4, 0.2, 0.045, 0.01, true), '#9fc4d8', cx, y + 0.95, cz);
      k.add(B.box(0.5, 0.08, 0.05, 0.01, true), team(P), cx, y + 0.65, cz);
    },
    baton(k, P, x, y, z) {
      k.add(K().post(0.025, 0.55, 6), '#1e1e1e', x + R[0], y + R[1] - 0.1, z + R[2], { rot: [0.5, 0, 0] });
    },
    crossbow(k, P, x, y, z) {
      const B = K(),
        cx = x + 0.08,
        cy = y + 0.9,
        cz = z + 0.36;
      k.add(B.box(0.07, 0.07, 0.7, 0.01), '#7a5232', cx, cy, cz);
      k.add(B.box(0.7, 0.05, 0.05, 0.01), '#5a3c22', cx, cy + 0.02, cz + 0.3, { rot: [0, 0.12, 0] });
      k.add(B.box(0.66, 0.012, 0.012, 0.005), '#e8dcc0', cx, cy + 0.03, cz + 0.12);
      k.add(B.box(0.02, 0.02, 0.4, 0.005), P.metal, cx, cy + 0.06, cz + 0.2); // mũi tên
    },
    bow(k, P, x, y, z) {
      const T = root.THREE,
        cx = x + L[0] - 0.05,
        cy = y + L[1] + 0.1,
        cz = z + L[2] + 0.1;
      k.add(new T.TorusGeometry(0.6, 0.025, 4, 16, Math.PI), '#6a4228', cx, cy, cz, { rot: [0, 0, Math.PI / 2] });
      k.add(K().box(0.01, 1.2, 0.01, 0.005), '#e8dcc0', cx, cy, cz);
    },
    quiver(k, P, x, y, z) {
      const B = K(),
        o = { rot: [-0.3, 0, -0.25] };
      k.add(B.post(0.08, 0.55, 8), '#6a4228', x + 0.12, y + 0.8, z - 0.22, o);
      for (const dx of [-0.03, 0.02, 0.06]) k.add(B.post(0.012, 0.75, 4), '#d8c8a0', x + 0.12 + dx, y + 0.83, z - 0.22, o);
      for (const dx of [-0.03, 0.02, 0.06]) k.add(B.box(0.04, 0.08, 0.01, 0.005), team(P), x + 0.12 + dx + 0.2, y + 1.53, z - 0.44, o);
    },
    rifle(k, P, x, y, z, glow) {
      const B = K(),
        cx = x + 0.16,
        cy = y + 1.0,
        cz = z + 0.32;
      k.add(B.box(0.07, 0.12, 0.85, 0.01), glow ? P.wall : '#3a3226', cx, cy, cz);
      k.add(B.post(0.022, 0.4, 6), glow ? P.metal : '#2a2a2a', cx, cy + 0.03, cz + 0.42, { rot: [Math.PI / 2, 0, 0] });
      k.add(B.box(0.05, 0.14, 0.06, 0.01), '#2a2a2a', cx, cy - 0.12, cz + 0.05); // tay cầm
      if (glow) {
        k.add(B.box(0.075, 0.03, 0.7, 0.005), P.glow, cx, cy + 0.04, cz, { glow: true });
        k.add(B.ball(0.04, 0), P.glow, cx, cy + 0.03, cz + 0.84, { glow: true });
      }
    },
    laserRifle: (k, P, x, y, z) => GEAR.rifle(k, P, x, y, z, true),
    staff(k, P, x, y, z) {
      const B = K();
      k.add(B.post(0.03, 2.0, 6), P.trim, x + R[0], y + 0.05, z + R[2]);
      k.add(B.ball(0.13, 1), P.glow, x + R[0], y + 2.15, z + R[2], { glow: true });
      H().torus(k, P.accent, 0.2, 0.02, x + R[0], y + 2.15, z + R[2], { glow: true });
    },
    wings(k, P, x, y, z) {
      const B = K();
      for (const e of [-1, 1]) {
        const o = { rot: [0.2, e * 0.5, e * 0.5] };
        k.add(B.box(0.9, 0.5, 0.03, 0.01, true), P.wall, x + e * 0.5, y + 0.9, z - 0.25, o);
        k.add(B.box(0.9, 0.05, 0.035, 0.005), P.glow, x + e * 0.5, y + 1.4, z - 0.25, Object.assign({ glow: true }, o));
      }
    },
    hoe(k, P, x, y, z) {
      const B = K();
      k.add(B.post(0.022, 1.4, 5), '#8a6038', x + 0.24, y + 0.7, z - 0.2, { rot: [0.9, 0, 0] });
      k.add(B.box(0.18, 0.2, 0.03, 0.01), P.metal, x + 0.24, y + 1.6, z + 0.25, { rot: [0.9, 0, 0] });
    },
    pole(k, P, x, y, z) {
      const B = K();
      k.add(B.box(1.6, 0.04, 0.05, 0.01), '#a07a4e', x, y + 1.16, z - 0.02);
      for (const e of [-1, 1]) {
        k.add(B.box(0.01, 0.5, 0.01, 0.005), '#5a3c22', x + e * 0.72, y + 0.91, z - 0.02);
        k.add(B.lathe([[0.12, 0], [0.22, 0.15], [0.24, 0.3]], 10), '#b8925a', x + e * 0.72, y + 0.45, z - 0.02);
        k.add(B.ball(0.18, 1), '#e8c234', x + e * 0.72, y + 0.72, z - 0.02, { sc: [1, 0.4, 1] }); // thóc trong thúng
      }
    },
    basket(k, P, x, y, z) {
      k.add(K().lathe([[0.1, 0], [0.18, 0.12], [0.2, 0.24]], 10), '#b8925a', x + L[0], y + L[1] - 0.25, z + L[2]);
      k.add(new root.THREE.TorusGeometry(0.15, 0.015, 4, 10, Math.PI), '#8a6038', x + L[0], y + L[1] - 0.01, z + L[2], {});
    },
    toolbox(k, P, x, y, z) {
      k.add(K().box(0.35, 0.22, 0.16, 0.02, true), '#c8402f', x + 0.3, y + 0.5, z + 0.05);
      k.add(K().box(0.2, 0.04, 0.03, 0.01), '#2a2a2a', x + 0.3, y + 0.76, z + 0.05);
    },
    handbag(k, P, x, y, z) {
      k.add(K().box(0.26, 0.2, 0.1, 0.03, true), team(P), x - 0.32, y + 0.62, z + 0.05);
      k.add(new root.THREE.TorusGeometry(0.1, 0.012, 4, 10, Math.PI), '#3a2a1a', x - 0.32, y + 0.82, z + 0.05, {});
    },
    tablet(k, P, x, y, z) {
      k.add(K().box(0.24, 0.32, 0.02, 0.01), P.dark, x + L[0] + 0.1, y + L[1] + 0.05, z + L[2] + 0.05, { rot: [-0.6, 0, 0] });
      k.add(K().box(0.2, 0.27, 0.01, 0.005), P.glow, x + L[0] + 0.1, y + L[1] + 0.055, z + L[2] + 0.065, { rot: [-0.6, 0, 0], glow: true });
    },
    lantern(k, P, x, y, z) {
      k.add(K().box(0.01, 0.25, 0.01, 0.005), P.metal, x + R[0], y + R[1] - 0.12, z + R[2]);
      k.add(K().ball(0.11, 1), P.glow, x + R[0], y + R[1] - 0.32, z + R[2], { glow: true });
    },
  };
  // đồ ở tay phải / tay trái: cầm ra trước hay vác (đòn gánh, cuốc, đồ xách, cánh, ống tên không cần gập tay)
  const HOLD_R = ['spear', 'sword', 'energySword', 'greatsword', 'baton', 'crossbow', 'rifle', 'laserRifle', 'staff', 'lantern'],
    HOLD_L = ['shieldRound', 'riotShield', 'bow', 'crossbow', 'rifle', 'laserRifle', 'basket', 'tablet'];
  /* ---------- khối tròn nhẵn (như thân mềm trong bể: render/body/softbody3d.js) ---------- */
  const CACHE = new Map();
  const cached = (key, fn) => CACHE.get(key) || (CACHE.set(key, fn()), CACHE.get(key));
  const sph = (r, cap) => cached('s' + r + ',' + (cap || 0), () => new root.THREE.SphereGeometry(r, 22, 16, 0, Math.PI * 2, 0, cap || Math.PI));
  // viên nang bán kính r, từ y0 tới y1 (dọc trục y)
  function capsule(r, y0, y1) {
    return cached('c' + r + ',' + y0 + ',' + y1, () => {
      const V = root.THREE.Vector2,
        pts = [],
        n = 8;
      for (let i = 0; i <= n; i++) {
        const a = -Math.PI / 2 + (i / n) * (Math.PI / 2);
        pts.push(new V(Math.max(1e-4, Math.cos(a) * r), y0 + Math.sin(a) * r));
      }
      for (let i = 0; i <= n; i++) {
        const a = (i / n) * (Math.PI / 2);
        pts.push(new V(Math.max(1e-4, Math.cos(a) * r), y1 + Math.sin(a) * r));
      }
      return new root.THREE.LatheGeometry(pts, 16);
    });
  }
  const lathe = (prof) => new root.THREE.LatheGeometry(prof.map(([r, y]) => new root.THREE.Vector2(Math.max(1e-4, r), y)), 22);
  // chi (tay, chân) từ điểm a tới điểm b, bán kính r: viên nang xoay theo hướng a→b
  function limb(k, color, r, a, b) {
    const T = root.THREE,
      d = new T.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]),
      L = d.length(),
      q = new T.Quaternion().setFromUnitVectors(new T.Vector3(0, 1, 0), d.normalize()),
      e = new T.Euler().setFromQuaternion(q);
    k.add(capsule(r, 0, L), color, a[0], a[1], a[2], { rot: [e.x, e.y, e.z] });
  }
  /* ---------- mũ (đỉnh đầu ở HT) ---------- */
  const HY = 1.43, // tâm đầu
    HR = 0.24, // bán kính đầu (đầu to như đồ chơi)
    HT = HY + HR; // đỉnh đầu
  function hat(k, o, x, y, z, P) {
    const T = root.THREE,
      c = o.hatColor || '#d8bf78',
      hy = y + HT;
    switch (o.hat) {
      case 'non': // nón lá
        k.add(new T.ConeGeometry(0.42, 0.26, 24).translate(0, 0.13, 0), c, x, hy - 0.1, z);
        break;
      case 'quaithao': // nón quai thao: vành phẳng rộng, chóp thấp
        k.add(new T.CylinderGeometry(0.46, 0.46, 0.04, 28), c, x, hy - 0.06, z);
        k.add(new T.CylinderGeometry(0.2, 0.22, 0.12, 22).translate(0, 0.06, 0), c, x, hy - 0.06, z);
        break;
      case 'khan': // khăn đóng
        k.add(lathe([[0.25, 0], [0.26, 0.07], [0.235, 0.14], [0.01, 0.15]]), c, x, hy - 0.13, z);
        break;
      case 'helm': // mũ sắt có chỏm, tua màu cờ
        k.add(sph(HR + 0.025, Math.PI * 0.55), c, x, y + HY + 0.05, z);
        k.add(new T.ConeGeometry(0.05, 0.18, 12).translate(0, 0.09, 0), team(P), x, hy, z);
        break;
      case 'cap':
        k.add(sph(HR + 0.015, Math.PI * 0.5), c, x, y + HY + 0.08, z);
        k.add(new T.CylinderGeometry(0.14, 0.14, 0.025, 18), c, x, y + HY + 0.1, z + 0.2, { sc: [1.2, 1, 1] });
        break;
      case 'helmet': // mũ lính tròn có vành
        k.add(sph(HR + 0.03, Math.PI * 0.52), c, x, y + HY + 0.06, z);
        k.add(new T.CylinderGeometry(HR + 0.06, HR + 0.06, 0.025, 24), c, x, y + HY + 0.07, z);
        break;
      case 'visor':
        k.add(sph(HR + 0.03, Math.PI * 0.62), c, x, y + HY, z);
        k.add(new T.CylinderGeometry(HR + 0.035, HR + 0.035, 0.07, 24, 1, true, -0.9, 1.8), P.glow, x, y + HY + 0.02, z, { glow: true });
        break;
      case 'halo':
        H().torus(k, P.glow, 0.2, 0.025, x, hy + 0.14, z, { glow: true });
        break;
      case 'band':
        k.add(new T.CylinderGeometry(HR + 0.012, HR + 0.012, 0.06, 24), team(P), x, y + HY + 0.07, z);
        break;
    }
  }
  /* ---------- một người (dáng đồ chơi mềm: đầu to, thân tròn, tay chân viên nang) ---------- */
  function person(k, P, x, y, z, o) {
    const skin = o.skin || '#eab890',
      top = o.top || '#8a6a3a',
      legs = o.legs || '#3a3026',
      hair = o.hair || '#2a1e16',
      slim = o.female ? 0.9 : 1,
      Y = (v) => y + v;
    // giày bo tròn, chân
    for (const e of [-1, 1]) {
      k.add(sph(0.1), o.shoes || '#3a2a1e', x + e * 0.1, Y(0.06), z + 0.04, { sc: [1, 0.7, 1.45] });
      limb(k, legs, 0.075, [x + e * 0.1, Y(0.1), z], [x + e * 0.1, Y(0.6), z]);
    }
    // váy, áo dài, áo choàng phủ chân
    if (o.topStyle === 'dress' || o.topStyle === 'robe')
      k.add(lathe([[0.31, 0], [0.29, 0.25], [0.24, 0.5], [0.19 * slim, 0.66], [0.01, 0.67]]), o.skirt || top, x, Y(0.05), z);
    k.add(sph(0.2), o.topStyle === 'dress' ? o.skirt || top : legs, x, Y(0.66), z, { sc: [slim, 0.55, 0.8] }); // hông
    // thân áo tròn, đai
    k.add(lathe([[0.01, 0], [0.18 * slim, 0.03], [0.21 * slim, 0.2], [0.21 * slim, 0.36], [0.16 * slim, 0.5], [0.01, 0.55]]), top, x, Y(0.64), z, { sc: [1, 1, 0.82] });
    k.add(new root.THREE.TorusGeometry(0.2 * slim, 0.025, 8, 24), o.belt || '#3a2a1a', x, Y(0.7), z, { rot: [Math.PI / 2, 0, 0], sc: [1, 0.82, 1] });
    if (o.topStyle === 'armor') {
      k.add(sph(0.2, Math.PI * 0.5), o.plate || P.metal, x, Y(0.86), z + 0.04, { rot: [Math.PI / 2, 0, 0], sc: [1, 0.55, 1.1] }); // giáp ngực
      for (const e of [-1, 1]) k.add(sph(0.11), o.plate || P.metal, x + e * 0.22, Y(1.12), z, { sc: [1.1, 0.7, 1] }); // giáp vai
    }
    if (o.glow) for (const e of [-1, 1]) k.add(capsule(0.012, 0, 0.42), P.glow, x + e * 0.1, Y(0.74), z + 0.17, { glow: true });
    if (o.sash) k.add(capsule(0.035, -0.32, 0.32), o.sash, x, Y(0.94), z + 0.15, { rot: [0, 0, 0.65], sc: [1.4, 1, 0.45] });
    if (o.cape) k.add(lathe([[0.3, 0], [0.26, 0.4], [0.18, 0.62], [0.01, 0.63]]), o.cape, x, Y(0.5), z - 0.06, { sc: [1, 1, 0.45] });
    // tay: có đồ thì gập ra trước, không thì buông
    for (const e of [-1, 1]) {
      const busy = (e > 0 ? HOLD_R : HOLD_L).includes(e > 0 ? o.right : o.left),
        sh = [x + e * 0.22 * slim, Y(1.1), z],
        el = [x + e * 0.27, Y(0.86), z + (busy ? 0.02 : 0)],
        hand = busy ? [x + (e > 0 ? R : L)[0], Y((e > 0 ? R : L)[1]), z + (e > 0 ? R : L)[2]] : [x + e * 0.29 * slim, Y(0.62), z + 0.03];
      limb(k, top, 0.062, sh, el);
      limb(k, o.topStyle === 'armor' ? o.plate || P.metal : top, 0.055, el, hand);
      k.add(sph(0.066), skin, ...hand);
    }
    // cổ, đầu, mặt
    limb(k, skin, 0.07, [x, Y(1.12), z], [x, Y(1.24), z]);
    k.add(sph(HR), skin, x, Y(HY), z, { sc: [1, 0.98, 0.96] });
    const fz = z + HR * 0.9;
    for (const e of [-1, 1]) {
      k.add(sph(0.038), '#1e1a16', x + e * 0.085, Y(HY + 0.02), fz, { sc: [1, 1.3, 0.6] }); // mắt
      k.add(sph(0.012), '#ffffff', x + e * 0.075, Y(HY + 0.04), fz + 0.025); // đốm sáng trong mắt
      limb(k, hair, 0.012, [x + e * 0.05, Y(HY + 0.095), fz + 0.01], [x + e * 0.12, Y(HY + 0.085 + (o.female ? 0.01 : 0)), fz - 0.01]); // mày
      k.add(sph(0.046), '#f0a090', x + e * 0.135, Y(HY - 0.05), fz - 0.04, { sc: [1, 0.6, 0.4] }); // má hồng
      k.add(sph(0.05), skin, x + e * HR, Y(HY), z, { sc: [0.6, 1, 0.8] }); // tai
    }
    k.add(sph(0.03), skin, x, Y(HY - 0.03), fz + 0.03); // mũi
    k.add(new root.THREE.TorusGeometry(0.04, 0.011, 6, 12, Math.PI), '#9a3a3a', x, Y(HY - 0.08), fz - 0.005, { rot: [0, 0, Math.PI] }); // miệng cười
    // tóc ôm đỉnh và sau đầu (chừa trán), búi, tóc dài
    if (o.hairStyle !== 'none') {
      k.add(sph(HR + 0.018, Math.PI * 0.5), hair, x, Y(HY + 0.01), z - 0.02, { rot: [-0.45, 0, 0] });
      if (o.hairStyle === 'bun') k.add(sph(0.09), hair, x, Y(HY + 0.16), z - 0.2);
      if (o.hairStyle === 'long') limb(k, hair, 0.12, [x, Y(HY - 0.02), z - 0.13], [x, Y(1.0), z - 0.14]);
    }
    hat(k, o, x, y, z, P);
    // đồ cầm, đồ đeo
    for (const g of [o.right, o.left, o.back]) if (g && GEAR[g] && !(g === o.left && g === o.right)) GEAR[g](k, P, x, y, z);
    if (o.right && o.right === o.left) GEAR[o.right](k, P, x, y, z); // (đồ cầm hai tay: vẽ một lần)
  }
  // chất liệu nhựa mờ của nhân vật (như thân mềm trong bể): sáng tối chuyển mềm, viền sáng quanh người, ấm ở chỗ da
  let SOFT = null;
  function softMat() {
    if (SOFT) return SOFT;
    const T = root.THREE;
    SOFT = new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.5, metalness: 0 });
    SOFT.onBeforeCompile = (sh) => {
      sh.fragmentShader = sh.fragmentShader.replace(
        '#include <emissivemap_fragment>',
        '#include <emissivemap_fragment>\n' +
          '{ float fr = pow(1.0 - clamp(dot(normal, normalize(vViewPosition)), 0.0, 1.0), 2.6);\n' +
          '  float warm = clamp((diffuseColor.r - diffuseColor.b) * 2.0, 0.0, 1.0);\n' +
          '  totalEmissiveRadiance += mix(vec3(0.55, 0.62, 0.72), vec3(0.95, 0.55, 0.42), warm) * fr * 0.28 * diffuseColor.rgb + vec3(0.03) * fr; }\n',
      );
    };
    SOFT.customProgramCacheKey = () => 'unit-soft';
    return SOFT;
  }
  BK.Body = { person, GEAR, softMat };
})(typeof self !== 'undefined' ? self : globalThis);
