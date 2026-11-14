/* Bể Kính · magic/time/sounds.js · Tiếng của phép thời gian (thêm vào render/fx/magic-audio.js bằng add)
 *   bell(on)   chuông trầm khi thời gian dừng (on), chuông cao, ngắn khi thời gian chạy tiếp
 *   tick(k)    tiếng tích tắc (tua nhanh, tua lùi): k > 0 cao, k < 0 trầm
 * kit.band(f0, f1, q, đường bao, giây): tiếng ồn lọc dải; kit.tone(f0, f1, độ to, giây, dạng sóng): một nốt. */
(function (root) {
  const BK = root.BK || (root.BK = {});
  BK.MagicAudio.add({
    bell(kit, on) {
      const f = on ? 196 : 392;
      kit.tone(f, f * 0.998, 0.12, on ? 2.4 : 1.1, 'sine');
      kit.tone(f * 2.01, f * 2, 0.05, on ? 1.8 : 0.8, 'sine');
      kit.tone(f * 3.02, f * 3, 0.025, on ? 1.2 : 0.5, 'triangle');
      kit.band(on ? 3000 : 600, on ? 400 : 4000, 1.5, [[0.05, 0.12], [0.6, 0.0001]], 0.65);
    },
    tick(kit, k) {
      const f = k < 0 ? 900 : 1700;
      kit.tone(f, f * 0.9, 0.05, 0.05, 'square');
    },
  });
})(typeof self !== 'undefined' ? self : globalThis);
