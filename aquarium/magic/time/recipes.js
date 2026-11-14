/* Bể Kính · magic/time/recipes.js · Công thức hiệu ứng hạt của hệ thời gian
 * Chỉ là số và màu (cách viết: render/magic/recipes.js); render/magic/vfx.js đọc theo tên: G.vfx.play('tên', chỗ). */
(function (root) {
  const BK = root.BK || (root.BK = {});
  BK.MagicRecipes = Object.assign(BK.MagicRecipes || {}, {
      // niệm phép thời gian: bụi vàng toả quanh đầu gậy
      timeCast: {
        glow: [{ n: 22, life: [0.3, 0.6], size: [0.28, 0.04], speed: [0.6, 1.8], dir: 'sphere', drag: 3, color: ['time.core', 'time.edge'] }],
        light: { color: 'time.mid', intensity: 1.6, range: 4, life: 0.35 },
      },
      // thời gian dừng lại / chạy tiếp: chớp vàng nhạt quanh người, vòng sóng lan trên đất
      timeWave: {
        glow: [{ n: 40, life: [0.4, 0.9], size: [0.3, 0.05], speed: [3, 7], dir: 'flat', drag: 3, color: ['time.core', 'time.edge'] }],
        decal: [
          { kind: 'ring', r: [0.5, 14], life: 1.3, color: 'time.mid', alpha: 0.8 },
          { kind: 'ring', r: [0.3, 8], life: 1, color: 'time.edge', alpha: 0.6 },
        ],
        light: { color: 'time.mid', intensity: 3, range: 9, life: 0.6 },
      },
      // mỗi nấc tua lùi: chớp nâu vàng nhỏ
      timeStep: {
        glow: [{ n: 16, life: [0.3, 0.6], size: [0.24, 0.04], speed: [1, 3], dir: 'sphere', drag: 3, color: ['#ffe2b0', 'time.edge'] }],
        decal: [{ kind: 'ring', r: [0.3, 5], life: 0.6, color: '#d9b27a', alpha: 0.6 }],
      },
  });
})(typeof self !== 'undefined' ? self : globalThis);
