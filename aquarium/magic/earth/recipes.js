/* Bể Kính · magic/earth/recipes.js · Công thức hiệu ứng hạt của hệ đất
 * Chỉ là số và màu (cách viết: render/magic/recipes.js); render/magic/vfx.js đọc theo tên: G.vfx.play('tên', chỗ).
 * Bụi đất dùng chung 'dustPuff' (render/magic/recipes.js). Đất kiểu "đồ chơi": cục bụi tròn màu cát, đá vụn tròn cạnh. */
(function (root) {
  const BK = root.BK || (root.BK = {});
  const ROCK = '#8d867b'; // (đá vụn)
  BK.MagicRecipes = Object.assign(BK.MagicRecipes || {}, {
    // niệm phép: bụi cát sáng quanh đầu gậy
    earthCast: {
      glow: [{ n: 16, life: [0.3, 0.6], size: [0.26, 0.04], speed: [0.5, 1.5], dir: 'sphere', grav: 1.5, drag: 3, color: ['earth.core', 'earth.mid'] }],
      soft: [{ n: 10, life: [0.5, 0.9], size: [0.18, 0.4], speed: [0.3, 0.9], dir: 'sphere', drag: 2, color: ['earth.soft', 'earth.soft'], alpha: 0.6 }],
    },
    // đất nứt bung lúc gò bắt đầu trồi: vòng sóng đất, đá vụn bắn lên, bụi toả ngang (cỡ cho gò bán kính 4)
    riseBurst: {
      soft: [{ n: 22, life: [1, 1.8], size: [0.4, 1.2], speed: [1.5, 3.2], dir: 'flat', up: 0.5, grav: -0.2, drag: 2, color: ['earth.soft', '#b9a88a'], alpha: 0.55 }],
      debris: { n: 14, size: [0.08, 0.2], speed: [2.5, 5], dir: 'up', spread: 1.6, life: [1.6, 2.6], color: ROCK },
      decal: [{ kind: 'ring', r: [0.5, 5.5], life: 0.7, color: 'earth.mid', alpha: 0.6 }],
    },
    // bụi đất trào ra ở chân gò đang trồi (phát nhiều lần quanh viền)
    riseDust: {
      soft: [{ n: 6, life: [1, 1.8], size: [0.5, 1.4], speed: [0.8, 2], dir: 'flat', up: 0.9, grav: -0.3, drag: 1.8, color: ['earth.soft', '#b9a88a'], alpha: 0.55, jitter: 0.4 }],
      debris: { n: 2, size: [0.08, 0.2], speed: [2, 4], dir: 'up', spread: 1.4, life: [1.5, 2.5], color: ROCK },
    },
  });
})(typeof self !== 'undefined' ? self : globalThis);
