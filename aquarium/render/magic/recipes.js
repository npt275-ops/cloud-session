/* Bể Kính · render/magic/recipes.js · Công thức hiệu ứng phép (design/ke-hoach-buoc-37.md mục 3)
 * Chỉ là số và màu: chỉnh cho đẹp ở đây, không sửa code vẽ (render/magic/vfx.js đọc công thức).
 * Một công thức gồm các phần (đều tuỳ chọn):
 *   soft, glow  danh sách nhóm hạt mềm, hạt sáng: { n số hạt, life [giây ít, nhiều], size [cỡ đầu, cỡ cuối] (mỗi cỡ là số hay
 *               [ít, nhiều]), speed [ít, nhiều], dir 'sphere' | 'up' | 'flat' | 'cone' (theo hướng của phép), spread độ toả,
 *               up thêm vận tốc lên, grav trọng lực (âm: bay lên), drag độ hãm, color [màu đầu, màu cuối], alpha, jitter bán
 *               kính chỗ sinh }
 *   debris      mảnh vụn: { n, size [ít, nhiều], speed [ít, nhiều], dir, spread, life, color }
 *   decal       vết trên đất: [{ kind 'disc' | 'ring', r [bán kính đầu, cuối], life, color, alpha }]
 *   light       đèn chớp: { color, intensity, range, life }
 *   rate        (nguồn phát liên tục) số lần phát mỗi giây; mỗi lần phát n = 1 hạt mỗi nhóm
 * Màu: tên trong bảng màu chung (render/style/palette.js), ví dụ 'soul.core', hay '#rrggbb'. Đơn vị: đơn vị đảo (người cao 1,4). */
(function (root) {
  const BK = root.BK || (root.BK = {});
  const R = {
    /* ----- linh hồn: phép thử "Tia linh lực" ----- */
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
    /* ----- thời gian ----- */
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
    /* ----- dùng chung cho các hệ sau ----- */
    // bụi đất bốc lên (trụ đá, rung đất, vật rơi)
    dustPuff: {
      soft: [{ n: 24, life: [0.8, 1.6], size: [0.25, 0.8], speed: [0.6, 1.8], dir: 'flat', up: 0.6, grav: -0.2, drag: 1.8, color: ['earth.soft', 'earth.soft'], alpha: 0.55 }],
      debris: { n: 10, size: [0.05, 0.13], speed: [2, 4.5], dir: 'up', spread: 1.6, life: [1.5, 2.5], color: 'earth.mid' },
      decal: [{ kind: 'disc', r: [0.4, 1.4], life: 3, color: 'earth.edge', alpha: 0.35 }],
    },
    // tàn lửa nhỏ bay lên (lửa cháy)
    embers: {
      rate: 18,
      glow: [{ life: [0.6, 1.2], size: [0.07, 0.02], speed: [0.3, 0.9], dir: 'up', spread: 0.8, grav: -0.6, drag: 0.8, color: ['fire.core', 'fire.edge'] }],
    },
  };
  BK.MagicRecipes = R;
})(typeof self !== 'undefined' ? self : globalThis);
