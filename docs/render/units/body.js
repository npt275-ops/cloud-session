/* Bể Kính · render/units/body.js · Thân người và đồ cầm tay cho nhân vật (dân, lính) của các khối nhân vật
 * Một người cao chừng 1,75 đứng ở (x, y, z), mặt quay về +z. Dựng từ mảnh của render/build/kit3d.js, gộp chung một khối.
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
  const R = [0.3, 0.95, 0.27], // bàn tay phải khi cầm đồ (so với gốc người)
    L = [-0.3, 0.95, 0.22];
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
      k.add(B.box(0.5, 0.85, 0.04, 0.02, true), '#2e3640', cx, y + 0.5, cz);
      k.add(B.box(0.4, 0.2, 0.045, 0.01, true), '#9fc4d8', cx, y + 1.05, cz);
      k.add(B.box(0.5, 0.08, 0.05, 0.01, true), team(P), cx, y + 0.75, cz);
    },
    baton(k, P, x, y, z) {
      k.add(K().post(0.025, 0.55, 6), '#1e1e1e', x + R[0], y + R[1] - 0.1, z + R[2], { rot: [0.5, 0, 0] });
    },
    crossbow(k, P, x, y, z) {
      const B = K(),
        cx = x + 0.08,
        cy = y + 1.0,
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
      k.add(B.post(0.08, 0.55, 8), '#6a4228', x + 0.12, y + 0.95, z - 0.2, o);
      for (const dx of [-0.03, 0.02, 0.06]) k.add(B.post(0.012, 0.75, 4), '#d8c8a0', x + 0.12 + dx, y + 0.98, z - 0.2, o);
      for (const dx of [-0.03, 0.02, 0.06]) k.add(B.box(0.04, 0.08, 0.01, 0.005), team(P), x + 0.12 + dx + 0.2, y + 1.68, z - 0.42, o);
    },
    rifle(k, P, x, y, z, glow) {
      const B = K(),
        cx = x + 0.16,
        cy = y + 1.12,
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
        k.add(B.box(0.9, 0.5, 0.03, 0.01, true), P.wall, x + e * 0.5, y + 1.05, z - 0.25, o);
        k.add(B.box(0.9, 0.05, 0.035, 0.005), P.glow, x + e * 0.5, y + 1.55, z - 0.25, Object.assign({ glow: true }, o));
      }
    },
    hoe(k, P, x, y, z) {
      const B = K();
      k.add(B.post(0.022, 1.4, 5), '#8a6038', x + 0.24, y + 0.85, z - 0.15, { rot: [0.9, 0, 0] });
      k.add(B.box(0.18, 0.2, 0.03, 0.01), P.metal, x + 0.24, y + 1.75, z + 0.3, { rot: [0.9, 0, 0] });
    },
    pole(k, P, x, y, z) {
      const B = K();
      k.add(B.box(1.6, 0.04, 0.05, 0.01), '#a07a4e', x, y + 1.36, z - 0.02);
      for (const e of [-1, 1]) {
        k.add(B.box(0.01, 0.6, 0.01, 0.005), '#5a3c22', x + e * 0.72, y + 0.76, z - 0.02, { rot: [0, 0, 0] });
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
  /* ---------- mũ ---------- */
  function hat(k, o, x, y, z, P) {
    const B = K(),
      c = o.hatColor || '#d8bf78',
      hy = y + 1.68;
    switch (o.hat) {
      case 'non': // nón lá
        k.add(B.cone(0.36, 0.22, 12), c, x, hy - 0.04, z);
        break;
      case 'quaithao': // nón quai thao: vành phẳng rộng, chóp thấp
        k.add(B.post(0.4, 0.04, 16), c, x, hy - 0.02, z);
        k.add(B.post(0.17, 0.1, 12), c, x, hy, z);
        break;
      case 'khan': // khăn đóng
        k.add(B.lathe([[0.18, 0], [0.19, 0.08], [0.17, 0.13], [0.01, 0.14]], 12), c, x, hy - 0.08, z);
        break;
      case 'helm': // mũ sắt có chỏm, tua màu cờ
        k.add(B.lathe([[0.2, 0], [0.2, 0.1], [0.14, 0.2], [0.01, 0.24]], 10), c, x, hy - 0.1, z);
        k.add(B.cone(0.05, 0.16, 5), team(P), x, hy + 0.14, z);
        break;
      case 'cap':
        k.add(B.post(0.18, 0.12, 10), c, x, hy - 0.06, z);
        k.add(B.box(0.26, 0.025, 0.14, 0.01), c, x, hy - 0.05, z + 0.17);
        break;
      case 'helmet': // mũ lính tròn có vành
        k.add(B.ball(0.21, 1), c, x, hy - 0.06, z, { sc: [1, 0.7, 1.05] });
        k.add(B.post(0.23, 0.03, 12), c, x, hy - 0.1, z);
        break;
      case 'visor':
        k.add(B.ball(0.21, 1), c, x, hy - 0.08, z, { sc: [1, 0.85, 1.05] });
        k.add(B.box(0.3, 0.07, 0.05, 0.01), P.glow, x, hy - 0.11, z + 0.17, { glow: true });
        break;
      case 'halo':
        H().torus(k, P.glow, 0.17, 0.025, x, hy + 0.2, z, { glow: true });
        break;
      case 'band':
        k.add(B.post(0.185, 0.05, 12), team(P), x, hy - 0.1, z);
        k.add(B.box(0.04, 0.16, 0.02, 0.01), team(P), x - 0.05, hy - 0.2, z - 0.18, { rot: [0.3, 0, 0.3] });
        break;
    }
  }
  /* ---------- một người ---------- */
  function person(k, P, x, y, z, o) {
    const B = K(),
      T = root.THREE,
      skin = o.skin || '#e0b48a',
      top = o.top || '#8a6a3a',
      legs = o.legs || '#3a3026',
      slim = o.female ? 0.88 : 1;
    // chân, giày
    for (const e of [-1, 1]) {
      k.add(B.box(0.13, 0.08, 0.24, 0.02, true), o.shoes || '#2a2018', x + e * 0.1, y, z + 0.03);
      k.add(B.post(0.068, 0.7, 6, 0.06), legs, x + e * 0.1, y + 0.06, z);
    }
    // váy, áo dài, áo choàng phủ chân
    if (o.topStyle === 'dress' || o.topStyle === 'robe')
      k.add(B.lathe([[0.3, 0], [0.27, 0.35], [0.2 * slim, 0.75], [0.01, 0.76]], 10), o.skirt || top, x, y + 0.08, z);
    k.add(B.box(0.34 * slim, 0.16, 0.22, 0.03, true), o.topStyle === 'dress' ? o.skirt || top : legs, x, y + 0.7, z);
    // thân áo
    k.add(B.lathe([[0.17 * slim, 0], [0.2 * slim, 0.22], [0.22 * slim, 0.44], [0.17 * slim, 0.56], [0.01, 0.57]], 10), top, x, y + 0.78, z, { sc: [1, 1, 0.8] });
    k.add(B.post(0.19 * slim, 0.05, 10), o.belt || '#3a2a1a', x, y + 0.8, z, { sc: [1, 1, 0.82] });
    if (o.topStyle === 'armor') {
      k.add(B.box(0.36, 0.38, 0.06, 0.02, true), o.plate || P.metal, x, y + 0.86, z + 0.16); // giáp ngực
      for (let i = 0; i < 3; i++) k.add(B.box(0.38, 0.02, 0.07, 0.005, true), '#2a2a2a', x, y + 0.92 + i * 0.1, z + 0.17);
      for (const e of [-1, 1]) k.add(B.ball(0.11, 1), o.plate || P.metal, x + e * 0.24, y + 1.3, z, { sc: [1.1, 0.7, 1] }); // giáp vai
    }
    if (o.glow) for (const e of [-1, 1]) k.add(B.box(0.025, 0.45, 0.02, 0.005), P.glow, x + e * 0.1, y + 0.85, z + 0.17, { glow: true });
    if (o.sash) k.add(B.box(0.08, 0.7, 0.03, 0.01), o.sash, x, y + 1.05, z + 0.17, { rot: [0, 0, 0.6] });
    if (o.cape) k.add(B.box(0.46, 0.95, 0.04, 0.02), o.cape, x, y + 0.85, z - 0.2, { rot: [0.12, 0, 0] });
    // tay: có đồ thì gập ra trước, không thì buông
    for (const e of [-1, 1]) {
      const busy = (e > 0 ? HOLD_R : HOLD_L).includes(e > 0 ? o.right : o.left),
        sx = x + e * 0.26 * slim,
        hand = busy ? (e > 0 ? R : L) : [e * 0.3, 0.68, 0.04];
      k.add(B.post(0.06, 0.33, 6, 0.05), top, sx, y + 0.98, z, { rot: [0, 0, e * 0.12] });
      if (busy) k.add(B.post(0.05, 0.24, 6, 0.045), top, x + e * 0.29, y + 0.98, z + 0.02, { rot: [Math.PI / 2, 0, 0] });
      else k.add(B.post(0.05, 0.28, 6, 0.045), top, x + e * 0.29, y + 0.7, z + 0.02);
      k.add(B.ball(0.055, 1), skin, x + hand[0] * (busy ? 1 : slim), y + hand[1], z + hand[2]);
    }
    // cổ, đầu, mặt
    k.add(B.post(0.06, 0.1, 6), skin, x, y + 1.33, z);
    k.add(B.ball(0.17, 1), skin, x, y + 1.56, z, { sc: [1, 1.08, 1] });
    for (const e of [-1, 1]) {
      k.add(B.ball(0.024, 0), '#1e1a16', x + e * 0.062, y + 1.58, z + 0.155); // mắt
      k.add(B.box(0.06, 0.012, 0.01, 0.003), o.hair || '#1e1a16', x + e * 0.062, y + 1.63, z + 0.158); // lông mày
      k.add(B.ball(0.035, 0), skin, x + e * 0.17, y + 1.56, z); // tai
    }
    k.add(B.ball(0.026, 0), skin, x, y + 1.53, z + 0.17); // mũi
    k.add(B.box(0.06, 0.012, 0.01, 0.003), '#a0544a', x, y + 1.47, z + 0.155); // miệng
    // tóc
    if (o.hairStyle !== 'none') {
      k.add(B.ball(0.182, 1), o.hair || '#1e1a16', x, y + 1.64, z - 0.03, { sc: [1.04, 0.78, 1.04] }); // (phủ kín đỉnh đầu)
      if (o.hairStyle === 'bun') k.add(B.ball(0.08, 1), o.hair || '#1e1a16', x, y + 1.7, z - 0.17);
      if (o.hairStyle === 'long') k.add(B.box(0.3, 0.45, 0.07, 0.03, true), o.hair || '#1e1a16', x, y + 1.15, z - 0.14);
    }
    hat(k, o, x, y, z, P);
    // đồ cầm, đồ đeo
    for (const g of [o.right, o.left, o.back]) if (g && GEAR[g] && !(g === o.left && g === o.right)) GEAR[g](k, P, x, y, z);
    if (o.right && o.right === o.left) GEAR[o.right](k, P, x, y, z); // (đồ cầm hai tay: vẽ một lần)
  }
  BK.Body = { person, GEAR };
})(typeof self !== 'undefined' ? self : globalThis);
