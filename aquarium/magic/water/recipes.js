/* Bể Kính · magic/water/recipes.js · Công thức hiệu ứng hạt của hệ nước
 * Chỉ là số và màu (cách viết: render/magic/recipes.js); render/magic/vfx.js đọc theo tên: G.vfx.play('tên', chỗ).
 * Nước kiểu "đồ chơi": giọt tròn trong, bọt trắng như bông, mây mưa là cục bông xám xanh. */
(function (root) {
  const BK = root.BK || (root.BK = {});
  const DROP = '#bfe9f5'; // (giọt nước to: mảnh văng có vật lý)
  BK.MagicRecipes = Object.assign(BK.MagicRecipes || {}, {
    // niệm phép: giọt nước sáng quanh đầu gậy
    waterCast: {
      glow: [{ n: 18, life: [0.3, 0.6], size: [0.26, 0.04], speed: [0.6, 1.6], dir: 'sphere', grav: 2, drag: 2.5, color: ['water.core', 'water.mid'] }],
      soft: [{ n: 8, life: [0.5, 0.9], size: [0.15, 0.35], speed: [0.3, 0.8], dir: 'sphere', drag: 2, color: ['water.soft', 'water.soft'], alpha: 0.6 }],
    },
    // mây mưa tụ lại: cục bông xám xanh nằm ngang, trôi chậm
    rainCloud: {
      soft: [{ n: 34, life: [6, 8], size: [1.8, 3.2], speed: [0.1, 0.5], dir: 'flat', drag: 0.8, color: ['#7d8996', '#9aa6b2'], alpha: 0.9, jitter: 2.8 }],
    },
    // hạt mưa chạm đất: tóe nhỏ
    rainSplash: {
      soft: [{ n: 4, life: [0.2, 0.35], size: [0.06, 0.02], speed: [0.8, 1.6], dir: 'up', spread: 2.5, grav: 9, drag: 1, color: ['water.core', 'water.core'], alpha: 0.8 }],
    },
    // đất ướt sẫm dưới mưa
    wetGround: { decal: [{ kind: 'disc', r: [4.5, 5.2], life: 14, color: '#2e3d48', alpha: 0.35 }] },
    // cột nước phun: vòng nước bắn tóe ở chân, giọt văng, vòng sóng
    geyserBurst: {
      soft: [{ n: 26, life: [0.6, 1.1], size: [0.3, 0.9], speed: [2.5, 5], dir: 'flat', up: 1.5, grav: 4, drag: 1.5, color: ['water.core', 'water.soft'], alpha: 0.7 }],
      debris: { n: 14, size: [0.08, 0.16], speed: [3, 6], dir: 'up', spread: 1.4, life: [0.8, 1.4], color: DROP },
      decal: [
        { kind: 'ring', r: [0.4, 3.5], life: 0.7, color: 'water.mid', alpha: 0.8 },
        { kind: 'disc', r: [1.2, 2.2], life: 8, color: '#2e3d48', alpha: 0.35 },
      ],
    },
    // đỉnh cột nước: bọt tung, giọt văng ra rồi rơi
    geyserSpray: {
      soft: [{ n: 3, life: [0.6, 1], size: [0.4, 1], speed: [1, 3], dir: 'sphere', grav: 6, drag: 1, color: ['water.core', 'water.soft'], alpha: 0.75 }],
      glow: [{ n: 2, life: [0.4, 0.7], size: [0.12, 0.04], speed: [2, 4], dir: 'up', spread: 2.2, grav: 9, color: ['water.core', 'water.mid'] }],
    },
    // cột nước đổ sụp: nước ụp xuống, bắn tóe rộng
    geyserFall: {
      soft: [{ n: 30, life: [0.6, 1.2], size: [0.4, 1.2], speed: [3, 6], dir: 'flat', up: 0.6, grav: 3, drag: 1.8, color: ['water.core', 'water.soft'], alpha: 0.7 }],
      debris: { n: 10, size: [0.07, 0.14], speed: [2.5, 5], dir: 'up', spread: 1.8, life: [0.8, 1.4], color: DROP },
      decal: [{ kind: 'ring', r: [0.6, 5], life: 0.8, color: 'water.mid', alpha: 0.7 }],
    },
    // sóng đại hồng thuỷ đập vào mép đảo: bọt trắng tung cao
    crashSplash: {
      soft: [
        { n: 16, life: [1, 1.8], size: [0.8, 2.6], speed: [4, 9], dir: 'up', spread: 1.2, grav: 5, drag: 1.2, color: ['water.core', 'water.soft'], alpha: 0.8, jitter: 1 },
      ],
      debris: { n: 6, size: [0.12, 0.25], speed: [5, 10], dir: 'up', spread: 1.6, life: [1, 1.8], color: DROP },
    },
    // bụi nước mù mịt sau khi nước đổ ập
    surgeMist: {
      soft: [{ n: 40, life: [3, 5], size: [2, 6], speed: [1, 3], dir: 'flat', up: 0.6, grav: -0.1, drag: 0.6, color: ['water.soft', '#dfeef4'], alpha: 0.45, jitter: 6 }],
    },
  });
})(typeof self !== 'undefined' ? self : globalThis);
