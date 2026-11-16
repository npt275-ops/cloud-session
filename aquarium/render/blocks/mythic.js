/* Bể Kính · render/blocks/mythic.js · Mảnh của bậc 5 Huyền ảo (người chơi chốt: bậc sau bậc 4, ảo và thú vị hơn)
 * Bậc 5: công trình rời khỏi mặt đất, đứng trên tảng đá bay lơ lửng; dưới chân là vòng chữ cổ sáng và trụ ánh sáng nối đất với
 * tảng đá; pha lê bay vòng quanh; đỉnh mỗi công trình mang biểu tượng của đảo (P.S.myth). Phần lơ lửng và phần quay vẽ vào Kit
 * con đặt tên 'float…' (nhấp nhô) và 'spin…' (quay quanh trục đứng): BK.Blocks.animate làm chúng chuyển động.
 *   H.floatRock(k, P, x, y, z, r, h)   tảng đá bay: mặt trên phẳng (cỏ hay sàn theo đảo), thân đá nhọn dần xuống dưới
 *   H.runes(k, P, x, y, z, r)          vòng chữ cổ trên mặt đất: hai vành sáng, tám phiến chữ
 *   H.beam(k, P, x, y, z, r, h)        trụ ánh sáng đứng (mờ, phát sáng) từ đất lên
 *   H.orbit(k, P, name, x, y, z, r, n) n viên pha lê bay vòng quanh trục đứng (Kit con 'spin…')
 *   H.crown(k, P, x, y, z, s)          biểu tượng đỉnh theo đảo: lotus (sen vàng), tree (cây linh hồn), peaks (núi bay có thác
 *                                      sáng), crystal (cụm pha lê), wave (cầu nước có vành), sun (mặt trời vàng có tia)
 * Cần: three.js, render/build/kit3d.js, render/blocks/parts.js. */
(function (root) {
  const BK = root.BK,
    H = BK.Blocks.H;
  const K = () => BK.BuildKit;
  const oct = (sx, h, sz) => new root.THREE.OctahedronGeometry(1, 0).scale(sx, h / 2, sz).translate(0, h / 2, 0);
  H.floatRock = function (k, P, x, y, z, r, h) {
    const B = K();
    k.add(B.lathe([[0.01, -h], [r * 0.35, -h * 0.75], [r * 0.75, -h * 0.4], [r, -0.12], [r, 0]], 9), P.stone, x, y, z);
    k.add(B.post(r * 1.02, 0.12, 14), P.wall2, x, y - 0.02, z);
    for (let i = 0; i < 3; i++) {
      const a = i * 2.1 + 0.5;
      k.add(B.ball(r * 0.22, 0), P.stone, x + Math.cos(a) * r * 0.55, y - h * 0.55, z + Math.sin(a) * r * 0.55, { sc: [1, 1.4, 1] }); // mỏm đá
    }
    k.add(B.box(0.05, h * 0.5, 0.05, 0.01, true), P.glow, x + r * 0.3, y - h * 0.65, z + r * 0.4, { glow: true }); // vân sáng trong đá
  };
  H.runes = function (k, P, x, y, z, r) {
    H.torus(k, P.glow, r, 0.05, x, y + 0.02, z, { glow: true });
    H.torus(k, P.accent, r * 0.82, 0.03, x, y + 0.02, z, { glow: true });
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      k.add(K().box(0.28, 0.02, 0.12, 0.01), P.glow, x + Math.cos(a) * r * 0.91, y + 0.02, z + Math.sin(a) * r * 0.91, { glow: true, rot: [0, -a, 0] });
    }
  };
  H.beam = function (k, P, x, y, z, r, h) {
    k.add(K().post(r, h, 10, r * 0.7), P.glow, x, y, z, { glow: true });
  };
  H.orbit = function (k, P, name, x, y, z, r, n) {
    const s = k.sub(name, [x, y, z]);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      s.add(oct(0.18, 0.6, 0.18), i % 2 ? P.accent : P.glow, Math.cos(a) * r, (i % 3) * 0.3, Math.sin(a) * r, { glow: true });
    }
    return s;
  };
  const CROWN = {
    lotus(k, P, x, y, z, s) {
      const B = K();
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        k.add(B.ball(0.45 * s, 1), i % 2 ? P.roof : P.metal, x + Math.cos(a) * 0.4 * s, y + 0.25 * s, z + Math.sin(a) * 0.4 * s, { sc: [0.5, 1, 0.25], rot: [0, -a, 0.5] });
      }
      k.add(B.ball(0.3 * s, 1), P.glow, x, y + 0.45 * s, z, { glow: true });
    },
    tree(k, P, x, y, z, s) {
      const B = K();
      k.add(B.post(0.12 * s, 1.2 * s, 6, 0.05 * s), P.trim, x, y, z);
      [[0, 1.5, 0.55], [0.45, 1.15, 0.38], [-0.45, 1.2, 0.4], [0, 1.0, 0.35]].forEach(([dx, dy, r], i) =>
        k.add(B.ball(r * s, 1), i ? P.wall2 : P.glow, x + dx * s, y + dy * s, z + (i === 3 ? 0.4 * s : 0), i ? null : { glow: true }),
      );
    },
    peaks(k, P, x, y, z, s) {
      const B = K();
      [[0, 0, 1.4], [0.55, 0.2, 0.9], [-0.5, -0.15, 1.0]].forEach(([dx, dz, h]) => k.add(B.cone(0.35 * s, h * s, 5), P.stone, x + dx * s, y, z + dz * s));
      k.add(B.box(0.08 * s, 1.1 * s, 0.06, 0.01), P.glow, x + 0.15 * s, y - 0.9 * s, z + 0.25 * s, { glow: true }); // thác sáng
      k.add(B.cone(0.12 * s, 0.3 * s, 5), '#ffffff', x, y + 1.15 * s, z);
    },
    crystal(k, P, x, y, z, s) {
      k.add(oct(0.35 * s, 1.6 * s, 0.35 * s), P.glow, x, y, z, { glow: true });
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2 + 0.3;
        k.add(oct(0.2 * s, 0.9 * s, 0.2 * s), i % 2 ? P.accent : P.wall2, x + Math.cos(a) * 0.35 * s, y, z + Math.sin(a) * 0.35 * s, { rot: [Math.cos(a) * 0.3, 0, Math.sin(a) * 0.3] });
      }
    },
    wave(k, P, x, y, z, s) {
      k.add(K().ball(0.55 * s, 2), P.glow, x, y + 0.6 * s, z, { glow: true });
      H.torus(k, P.accent, 0.8 * s, 0.05, x, y + 0.6 * s, z, { glow: true, rot: [Math.PI / 2 - 0.4, 0, 0.3] });
      for (let i = 0; i < 3; i++) k.add(K().ball(0.08 * s, 1), P.glow, x + (i - 1) * 0.5 * s, y + 1.3 * s + (i % 2) * 0.2 * s, z, { glow: true });
    },
    sun(k, P, x, y, z, s) {
      const B = K();
      H.torus(k, P.metal, 0.6 * s, 0.07, x, y + 0.8 * s, z, { rot: [0, 0, 0] });
      k.add(B.post(0.48 * s, 0.06, 16), P.glow, x, y + 0.8 * s, z, { glow: true, rot: [Math.PI / 2, 0, 0] });
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        k.add(B.box(0.06, 0.35 * s, 0.04, 0.01), P.roof, x + Math.cos(a) * 0.85 * s, y + 0.8 * s + Math.sin(a) * 0.85 * s, z, { rot: [0, 0, a - Math.PI / 2] });
      }
      k.add(B.post(0.05, 0.4 * s, 5), P.metal, x, y, z);
    },
  };
  H.crown = function (k, P, x, y, z, s) {
    (CROWN[P.S && P.S.myth] || CROWN.lotus)(k, P, x, y, z, s || 1);
  };
})(typeof self !== 'undefined' ? self : globalThis);
