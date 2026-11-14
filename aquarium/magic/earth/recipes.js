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
    // đất nứt bung dưới chân lúc núi bắt đầu trồi: vòng nứt, đá vụn bắn lên, bụi toả ngang
    riseBurst: {
      soft: [{ n: 30, life: [1.2, 2.2], size: [0.5, 1.6], speed: [2, 4.5], dir: 'flat', up: 0.6, grav: -0.2, drag: 2, color: ['earth.soft', '#b9a88a'], alpha: 0.6 }],
      debris: { n: 22, size: [0.12, 0.3], speed: [3, 7], dir: 'up', spread: 1.6, life: [2, 3.2], color: ROCK },
      decal: [
        { kind: 'ring', r: [0.5, 9], life: 0.8, color: 'earth.mid', alpha: 0.7 },
        { kind: 'disc', r: [2, 3.5], life: 6, color: 'earth.edge', alpha: 0.35 },
      ],
    },
    // bụi đất trào ra ở chân núi đang trồi (phát nhiều lần quanh viền)
    riseDust: {
      soft: [{ n: 6, life: [1, 1.8], size: [0.5, 1.4], speed: [0.8, 2], dir: 'flat', up: 0.9, grav: -0.3, drag: 1.8, color: ['earth.soft', '#b9a88a'], alpha: 0.55, jitter: 0.4 }],
      debris: { n: 2, size: [0.08, 0.2], speed: [2, 4], dir: 'up', spread: 1.4, life: [1.5, 2.5], color: ROCK },
    },
    // đỉnh trụ đá vừa lên tới: bụi rơi xuống từ mép trụ
    topDust: {
      soft: [{ n: 14, life: [1, 1.8], size: [0.3, 0.9], speed: [0.5, 1.4], dir: 'flat', grav: 0.8, drag: 1.5, color: ['earth.soft', 'earth.soft'], alpha: 0.5 }],
    },
    // sóng rung đất: vòng sóng lan, bụi bốc theo vòng, đá vụn nảy lên
    quakeWave: {
      soft: [{ n: 40, life: [1, 2], size: [0.5, 1.5], speed: [4, 8], dir: 'flat', up: 0.4, grav: -0.2, drag: 2.5, color: ['earth.soft', '#b9a88a'], alpha: 0.5 }],
      debris: { n: 16, size: [0.08, 0.22], speed: [2, 5], dir: 'up', spread: 2, life: [1.5, 2.5], color: ROCK },
      decal: [
        { kind: 'ring', r: [0.5, 10], life: 1, color: 'earth.mid', alpha: 0.75 },
        { kind: 'ring', r: [0.3, 6], life: 0.8, color: 'earth.edge', alpha: 0.5 },
      ],
    },
    // vết nứt sẫm ở tâm rung đất
    quakeScar: { decal: [{ kind: 'disc', r: [1.5, 3], life: 10, color: 'earth.edge', alpha: 0.45 }] },
  });
})(typeof self !== 'undefined' ? self : globalThis);
