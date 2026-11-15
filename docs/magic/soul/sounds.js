/* Bể Kính · magic/soul/sounds.js · Tiếng của phép linh hồn (thêm vào render/fx/magic-audio.js bằng add)
 *   voidHum(giây)  Hố đen: tiếng ù rất trầm lớn dần, gió hút rít cao dần (chừng ấy giây)
 *   voidSuck()     người nhập hồn bị cuốn vào hố: tiếng hút vút xuống trầm
 * kit.band(f0, f1, q, đường bao, giây): tiếng ồn lọc dải; kit.tone(f0, f1, độ to, giây, dạng sóng): một nốt. */
(function (root) {
  const BK = root.BK || (root.BK = {});
  BK.MagicAudio.add({
    voidHum(kit, sec) {
      const d = sec || 30;
      kit.tone(42, 28, 0.22, d, 'sine');
      kit.band(80, 40, 0.6, [[d * 0.7, 0.35], [d, 0.0001]], d);
      kit.band(500, 2600, 4, [[d * 0.8, 0.07], [d, 0.0001]], d);
    },
    voidSuck(kit) {
      kit.band(3000, 120, 1.2, [[0.3, 0.3], [2.5, 0.0001]], 2.6);
      kit.tone(220, 40, 0.12, 2.4, 'triangle');
    },
  });
})(typeof self !== 'undefined' ? self : globalThis);
