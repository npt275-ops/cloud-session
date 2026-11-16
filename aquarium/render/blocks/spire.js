/* Bể Kính · render/blocks/spire.js · Thân tháp bậc tương lai theo đảo (H.spire)
 * Người chơi chốt: không đảo nào giống đảo nào, kể cả bậc neon. Nhà chính bậc 4, hai trụ cổng bậc 4 và tháp điều khiển của nhà
 * lính bậc 4 dựng thân tháp theo dáng riêng của đảo (P.S.spire); đảo không chọn (Lúa Vàng) giữ tháp gốc của tệp hình dáng.
 *   H.spire(k, P, x, y, z, h, r)   thân tháp cao h, bán kính chân r, gốc ở (x, y, z). Dáng:
 *     tree     thân cây thon, ba tán lá tròn dẹt có vành sáng dưới tán (Thông Xanh)
 *     stack    năm khối đá vuông chồng lệch xoay dần, viền sáng mỗi tầng (Đá Mây)
 *     crystal  khối pha lê tám mặt cao ở giữa, ba khối nhỏ quanh, vành sáng (Tuyết Trắng)
 *     sail     lõi thon, cánh buồm cong phía trước có mép sáng, sàn nhỏ phía sau (Cửa Sóng)
 *     pyramid  kim tự tháp bậc, kim nhọn trên đỉnh, vành sáng lơ lửng (Cát Hồng)
 * Cần: three.js, render/build/kit3d.js, render/blocks/parts.js. */
(function (root) {
  const BK = root.BK,
    H = BK.Blocks.H;
  const K = () => BK.BuildKit;
  const oct = (sx, h, sz) => new root.THREE.OctahedronGeometry(1, 0).scale(sx, h / 2, sz).translate(0, h / 2, 0);
  const SPIRE = {
    tree(k, P, x, y, z, h, r) {
      const B = K();
      k.add(B.lathe([[r, 0], [r * 0.75, h * 0.5], [r * 0.45, h]], 8), P.trim, x, y, z);
      [[0.42, 1.7], [0.68, 1.35], [0.92, 0.95]].forEach(([u, f]) => {
        k.add(B.ball(r * f, 1), P.wall2, x, y + h * u + r * 0.2, z, { sc: [1, 0.42, 1] });
        H.torus(k, P.glow, r * f * 0.92, 0.05, x, y + h * u, z, { glow: true });
      });
    },
    stack(k, P, x, y, z, h, r) {
      const B = K(),
        n = 5;
      for (let i = 0; i < n; i++) {
        const s = r * 2 * (1 - i * 0.14),
          yy = y + (h / n) * i;
        k.add(B.box(s, h / n, s, 0.05, true), i % 2 ? P.wall2 : P.wall, x, yy, z, { rot: [0, i * 0.35, 0] });
        k.add(B.box(s + 0.06, 0.06, s + 0.06, 0.01, true), i % 2 ? P.accent : P.glow, x, yy + h / n - 0.06, z, { glow: true, rot: [0, i * 0.35, 0] });
      }
    },
    crystal(k, P, x, y, z, h, r) {
      k.add(oct(r * 0.8, h, r * 0.8), P.wall, x, y, z);
      for (let i = 0; i < 3; i++) {
        const a = (i / 3) * Math.PI * 2 + 0.4;
        k.add(oct(r * 0.4, h * 0.45, r * 0.4), i ? P.wall2 : P.glow, x + Math.cos(a) * r * 0.9, y, z + Math.sin(a) * r * 0.9, i ? null : { glow: true });
      }
      for (const u of [0.3, 0.6]) H.torus(k, u > 0.5 ? P.accent : P.glow, r * 1.25, 0.05, x, y + h * u, z, { glow: true });
    },
    sail(k, P, x, y, z, h, r) {
      const B = K(),
        n = 9;
      k.add(B.post(r * 0.45, h, 8, r * 0.2), P.wall2, x, y, z - r * 0.3);
      for (let i = 0; i < n; i++) {
        const u = i / n,
          zz = z + r * 0.2 + Math.sin(u * Math.PI) * r * 0.9,
          w = r * 1.8 * (1 - u * 0.7);
        k.add(B.box(w, h / n + 0.02, 0.18, 0.01, true), P.wall, x, y + h * u, zz);
        k.add(B.box(0.08, h / n + 0.02, 0.2, 0.01, true), P.glow, x + w / 2, y + h * u, zz, { glow: true });
      }
      for (const u of [0.35, 0.65]) k.add(B.box(r * 1.4, 0.12, r * 0.9, 0.02, true), P.roof, x, y + h * u, z - r * 0.7);
    },
    pyramid(k, P, x, y, z, h, r) {
      const B = K();
      for (let i = 0; i < 4; i++) {
        const s = r * 2.2 * (1 - i * 0.22),
          yy = y + h * 0.11 * i;
        k.add(B.box(s, h * 0.11, s, 0.03, true), i % 2 ? P.wall2 : P.wall, x, yy, z);
        k.add(B.box(s + 0.05, 0.05, s + 0.05, 0.01, true), P.glow, x, yy + h * 0.11 - 0.05, z, { glow: true });
      }
      k.add(B.post(r * 0.18, h * 0.56, 6, 0.02), P.metal, x, y + h * 0.44, z);
      H.torus(k, P.accent, r * 0.8, 0.05, x, y + h * 0.7, z, { glow: true });
    },
  };
  H.spire = function (k, P, x, y, z, h, r) {
    (SPIRE[P.S && P.S.spire] || SPIRE.stack)(k, P, x, y, z, h, r);
  };
  H.hasSpire = (P) => !!(P.S && SPIRE[P.S.spire]); // (đảo có dáng tháp riêng: tệp hình dáng bỏ tháp gốc)
})(typeof self !== 'undefined' ? self : globalThis);
