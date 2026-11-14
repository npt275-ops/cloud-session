/* Bể Kính · magic/fire/recipes.js · Công thức hiệu ứng hạt của hệ lửa
 * Chỉ là số và màu (cách viết: render/magic/recipes.js); render/magic/vfx.js đọc theo tên: G.vfx.play('tên', chỗ).
 * Lửa kiểu "thế giới đồ chơi": lưỡi lửa tròn, mập, bay lên rồi nhỏ dần; khói là cục bông xám ấm; vết cháy xém nâu sẫm. */
(function (root) {
  const BK = root.BK || (root.BK = {});
  const SCORCH = '#2b211b'; // (vết cháy xém trên đất, mảnh than)
  // lưỡi lửa đặc: cục lửa tròn trộn màu thường (không cộng sáng) để ban ngày vẫn rõ màu cam trên nền trời, cỏ; lớp hạt sáng
  // (glow) đi kèm làm lõi rực. Cùng một kiểu cho lửa trên nhà, vòng lửa, cầu lửa
  const solid = (o) => Object.assign({ dir: 'up', spread: 0.35, grav: -1.4, drag: 0.6, color: ['fire.core', 'fire.edge'], alpha: 0.95 }, o);
  BK.MagicRecipes = Object.assign(BK.MagicRecipes || {}, {
    // niệm phép: lửa bùng quanh đầu gậy
    fireCast: {
      glow: [{ n: 22, life: [0.25, 0.5], size: [0.32, 0.05], speed: [0.6, 1.8], dir: 'sphere', grav: -1.5, drag: 3, color: ['fire.core', 'fire.edge'] }],
      light: { color: 'fire.mid', intensity: 1.8, range: 4, life: 0.3 },
    },
    // cầu lửa đang bay: lõi tròn sáng, lưỡi lửa kéo đuôi, khói bông, tàn than
    fireTrail: {
      rate: 70,
      glow: [
        { life: [0.08, 0.1], size: [1.0, 0.8], speed: [0, 0], dir: 'sphere', color: ['fire.core', 'fire.mid'] },
        { life: [0.3, 0.55], size: [0.5, 0.06], speed: [0.2, 0.8], dir: 'up', grav: -1.6, drag: 2, color: ['fire.mid', 'fire.edge'], jitter: 0.18 },
      ],
      soft: [
        solid({ life: [0.12, 0.2], size: [0.75, 0.3], speed: [0, 0.3], color: ['fire.mid', 'fire.edge'], jitter: 0.1 }),
        { life: [0.7, 1.1], size: [0.2, 0.55], speed: [0.05, 0.2], dir: 'up', grav: -0.6, drag: 1.5, color: ['fire.soft', 'fire.soft'], alpha: 0.35 },
      ],
    },
    // nổ: chớp sáng, lửa toả tròn, tàn lửa bắn lên, khói bông bốc cao, mảnh than, vòng sóng, vết cháy xém
    fireBurst: {
      glow: [
        { n: 1, life: [0.25, 0.25], size: [3.4, 0.6], speed: [0, 0], dir: 'sphere', color: ['fire.core', 'fire.mid'] },
        { n: 70, life: [0.4, 0.9], size: [0.8, 0.08], speed: [3, 7.5], dir: 'sphere', drag: 3.5, grav: -0.8, color: ['fire.core', 'fire.edge'] },
        { n: 26, life: [0.8, 1.5], size: [0.12, 0.03], speed: [3, 6.5], dir: 'up', spread: 1.4, grav: 5, drag: 0.6, color: ['fire.core', 'fire.edge'] },
      ],
      soft: [
        solid({ n: 28, life: [0.35, 0.7], size: [1.1, 0.15], speed: [2, 5], dir: 'sphere', grav: -1, drag: 3 }),
        { n: 26, life: [1.8, 3.0], size: [0.6, 2.1], speed: [0.6, 1.8], dir: 'up', spread: 1.6, grav: -0.5, drag: 1.4, color: ['#6d6560', 'fire.soft'], alpha: 0.55, jitter: 0.6 },
      ],
      debris: { n: 10, size: [0.05, 0.12], speed: [3, 6], dir: 'up', spread: 1.8, life: [1.5, 2.5], color: SCORCH },
      decal: [
        { kind: 'ring', r: [0.4, 5.5], life: 0.6, color: 'fire.mid', alpha: 0.85 },
        { kind: 'disc', r: [1.4, 2.4], life: 9, color: SCORCH, alpha: 0.55 },
      ],
      light: { color: 'fire.mid', intensity: 5, range: 11, life: 0.6 },
    },
    // một lưỡi lửa của vòng lửa (nguồn phát liên tục ở mỗi điểm trên vòng)
    flameTongue: {
      rate: 40,
      soft: [solid({ life: [0.35, 0.65], size: [0.62, 0.08], speed: [1.2, 2.2], jitter: 0.18 })],
      glow: [{ life: [0.3, 0.55], size: [0.7, 0.1], speed: [1.3, 2.4], dir: 'up', spread: 0.3, grav: -1.5, drag: 0.6, color: ['fire.core', 'fire.mid'], jitter: 0.2 }],
    },
    // khói nhẹ trên vòng lửa
    ringSmoke: {
      rate: 3,
      soft: [{ life: [1.4, 2.2], size: [0.35, 1.1], speed: [0.3, 0.7], dir: 'up', grav: -0.5, drag: 1.2, color: ['fire.soft', 'fire.soft'], alpha: 0.3, jitter: 0.3 }],
    },
    // vòng lửa bùng lên: lửa toả ngang từ chân ra mép vòng, vết cháy xém thành vòng (cỡ cho vòng bán kính 4: phát với scale = r / 4)
    ringBurst: {
      glow: [{ n: 50, life: [0.3, 0.6], size: [0.45, 0.06], speed: [4, 7], dir: 'flat', drag: 3, grav: -1, color: ['fire.core', 'fire.edge'] }],
      decal: [
        { kind: 'ring', r: [0.4, 3.8], life: 0.5, color: 'fire.mid', alpha: 0.8 },
        { kind: 'ring', r: [4.1, 4.3], life: 10, color: SCORCH, alpha: 0.6 },
      ],
      light: { color: 'fire.mid', intensity: 4, range: 9, life: 0.5 },
    },
    // ánh lửa chập chờn (vòng lửa, nhà cháy): chỉ là đèn chớp ngắn, phát lại liên tục
    fireFlicker: { light: { color: 'fire.mid', intensity: 2.2, range: 8, life: 0.35 } },
    // nhà đang cháy: lưỡi lửa to dày trên mái (khói: houseSmoke, nguồn phát riêng vì nhịp phát khác)
    houseFire: {
      rate: 60,
      soft: [solid({ life: [0.45, 0.85], size: [1.3, 0.15], speed: [1.3, 2.5], spread: 0.45, jitter: 0.9 })],
      glow: [{ life: [0.4, 0.7], size: [1.0, 0.15], speed: [1.4, 2.6], dir: 'up', spread: 0.45, grav: -1.5, drag: 0.6, color: ['fire.core', 'fire.mid'], jitter: 0.9 }],
    },
    // khói đen xám bốc cao trên nhà cháy
    houseSmoke: {
      rate: 9,
      soft: [{ life: [2.4, 3.8], size: [0.7, 2.4], speed: [0.5, 1], dir: 'up', spread: 0.6, grav: -0.8, drag: 0.8, color: ['#5b5450', '#7d7671'], alpha: 0.5, jitter: 0.8 }],
    },
    // tàn lửa nhỏ bay lên (lửa cháy)
    embers: {
      rate: 18,
      glow: [{ life: [0.6, 1.2], size: [0.07, 0.02], speed: [0.3, 0.9], dir: 'up', spread: 0.8, grav: -0.6, drag: 0.8, color: ['fire.core', 'fire.edge'] }],
    },
  });
})(typeof self !== 'undefined' ? self : globalThis);
