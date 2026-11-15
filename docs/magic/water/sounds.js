/* Bể Kính · magic/water/sounds.js · Tiếng của phép nước (thêm vào render/fx/magic-audio.js bằng add)
 *   rain(giây)  tiếng mưa rào (ồn lọc dải cao, dài chừng ấy giây)
 *   gush()      tiếng cột nước phun vọt lên
 *   seaRoar(giây)  tiếng biển gầm, lốc xoáy hú, lớn dần (Đại hồng thuỷ)
 *   crash()     tiếng nước đổ ập xuống, rất trầm, rất lớn
 * kit.band(f0, f1, q, đường bao, giây): tiếng ồn lọc dải; kit.tone(f0, f1, độ to, giây, dạng sóng): một nốt. */
(function (root) {
  const BK = root.BK || (root.BK = {});
  BK.MagicAudio.add({
    rain(kit, sec) {
      const d = sec || 6;
      kit.band(3200, 4200, 0.6, [[0.8, 0.18], [d - 0.8, 0.16], [d, 0.0001]], d);
      kit.band(900, 1300, 0.8, [[1, 0.08], [d, 0.0001]], d);
    },
    gush(kit) {
      kit.band(500, 2400, 0.9, [[0.06, 0.35], [1.6, 0.0001]], 1.7);
      kit.tone(130, 70, 0.06, 0.8, 'sine');
    },
    seaRoar(kit, sec) {
      const d = sec || 10;
      kit.band(60, 220, 0.5, [[d * 0.6, 0.45], [d, 0.25]], d + 0.2);
      kit.band(400, 900, 2.5, [[d * 0.5, 0.08], [d, 0.12]], d + 0.2);
      kit.tone(38, 52, 0.18, d, 'sine');
    },
    crash(kit) {
      kit.band(1600, 60, 0.5, [[0.02, 0.7], [2.6, 0.0001]], 2.8);
      kit.tone(70, 28, 0.35, 2, 'sine');
      kit.band(3500, 1500, 1, [[0.05, 0.25], [1.4, 0.0001]], 1.5);
    },
  });
})(typeof self !== 'undefined' ? self : globalThis);
