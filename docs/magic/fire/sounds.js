/* Bể Kính · magic/fire/sounds.js · Tiếng của phép lửa (thêm vào render/fx/magic-audio.js bằng add)
 *   whoosh()   tiếng vù khi cầu lửa bay ra
 *   boom(k)    tiếng nổ trầm khi cầu lửa chạm đất (k 0..1 độ mạnh: xa thì nhỏ)
 *   roar()     tiếng lửa bùng lên thành vòng
 * kit.band(f0, f1, q, đường bao, giây): tiếng ồn lọc dải; kit.tone(f0, f1, độ to, giây, dạng sóng): một nốt. */
(function (root) {
  const BK = root.BK || (root.BK = {});
  BK.MagicAudio.add({
    whoosh(kit) {
      kit.band(300, 1500, 1.2, [[0.08, 0.26], [0.5, 0.0001]], 0.55);
      kit.tone(190, 95, 0.04, 0.4, 'sine');
    },
    boom(kit, k) {
      const v = 0.2 + 0.4 * (k == null ? 1 : k);
      kit.band(900, 70, 0.7, [[0.01, v], [1.0, 0.0001]], 1.1);
      kit.tone(110, 38, 0.25 * v, 0.9, 'sine');
      kit.band(3200, 1100, 2, [[0.01, 0.1 * v], [0.3, 0.0001]], 0.35);
    },
    roar(kit) {
      kit.band(180, 750, 0.8, [[0.15, 0.3], [1.3, 0.0001]], 1.4);
      kit.tone(70, 115, 0.07, 1.2, 'triangle');
    },
  });
})(typeof self !== 'undefined' ? self : globalThis);
