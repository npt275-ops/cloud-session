/* Bể Kính · magic/soul/recipes.js · Công thức hiệu ứng hạt của hệ linh hồn
 * Chỉ là số và màu (cách viết: render/magic/recipes.js); render/magic/vfx.js đọc theo tên: G.vfx.play('tên', chỗ). */
(function (root) {
  const BK = root.BK || (root.BK = {});
  BK.MagicRecipes = Object.assign(BK.MagicRecipes || {}, {
      // tay toả sáng lúc niệm phép
      soulCast: {
        glow: [{ n: 18, life: [0.25, 0.5], size: [0.3, 0.04], speed: [0.6, 1.6], dir: 'sphere', drag: 3, color: ['soul.core', 'soul.edge'] }],
        light: { color: 'soul.mid', intensity: 1.5, range: 3.5, life: 0.3 },
      },
      // đạn đang bay: lõi cầu sáng (mỗi lần phát một hạt to, sống ngắn: nối nhau thành quả cầu) và đuôi hạt nhỏ
      soulTrail: {
        rate: 60,
        glow: [
          { life: [0.08, 0.1], size: [0.62, 0.5], speed: [0, 0], dir: 'sphere', color: ['soul.core', 'soul.mid'] },
          { life: [0.3, 0.55], size: [0.26, 0.03], speed: [0.1, 0.5], dir: 'sphere', drag: 2, color: ['soul.mid', 'soul.edge'], alpha: 0.9, jitter: 0.08 },
        ],
        soft: [{ life: [0.5, 0.8], size: [0.12, 0.34], speed: [0.05, 0.2], dir: 'sphere', grav: -0.4, drag: 1.5, color: ['soul.soft', 'soul.soft'], alpha: 0.4 }],
      },
      // chạm đích: bung hạt sáng, vòng sóng mỏng, đốm sáng bay lên, bụi sáng
      soulBurst: {
        glow: [
          { n: 48, life: [0.35, 0.8], size: [0.42, 0.04], speed: [2.5, 6], dir: 'sphere', drag: 3.5, grav: 2, color: ['soul.core', 'soul.edge'] },
          { n: 16, life: [0.8, 1.4], size: [0.18, 0.03], speed: [0.4, 1.4], dir: 'up', grav: -0.7, drag: 1, color: ['soul.core', 'soul.mid'], jitter: 0.4 },
          { n: 1, life: [0.22, 0.22], size: [2.2, 0.4], speed: [0, 0], dir: 'sphere', color: ['soul.core', 'soul.mid'] },
        ],
        soft: [{ n: 14, life: [0.7, 1.2], size: [0.35, 0.9], speed: [0.4, 1], dir: 'flat', grav: -0.3, drag: 2, color: ['soul.soft', 'soul.soft'], alpha: 0.45 }],
        decal: [
          { kind: 'ring', r: [0.3, 2.4], life: 0.7, color: 'soul.mid', alpha: 0.8 },
          { kind: 'disc', r: [0.6, 1.1], life: 1.4, color: 'soul.soft', alpha: 0.4 },
        ],
        light: { color: 'soul.mid', intensity: 3.5, range: 7, life: 0.5 },
      },
  });
})(typeof self !== 'undefined' ? self : globalThis);
