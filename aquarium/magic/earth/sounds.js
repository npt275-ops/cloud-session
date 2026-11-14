/* Bể Kính · magic/earth/sounds.js · Tiếng của phép đất (thêm vào render/fx/magic-audio.js bằng add)
 *   rumble(giây)  tiếng đất ầm ầm trầm khi gò đất trồi (dài chừng ấy giây)
 *   crack()       tiếng đất nứt khô, gọn
 * kit.band(f0, f1, q, đường bao, giây): tiếng ồn lọc dải; kit.tone(f0, f1, độ to, giây, dạng sóng): một nốt. */
(function (root) {
  const BK = root.BK || (root.BK = {});
  BK.MagicAudio.add({
    rumble(kit, sec) {
      const d = sec || 1.6;
      kit.band(70, 140, 0.6, [[0.2, 0.45], [d, 0.0001]], d + 0.1);
      kit.tone(48, 40, 0.18, d, 'sine');
    },
    crack(kit) {
      kit.band(2600, 700, 1.5, [[0.005, 0.3], [0.18, 0.0001]], 0.22);
      kit.tone(160, 80, 0.08, 0.2, 'triangle');
    },
  });
})(typeof self !== 'undefined' ? self : globalThis);
