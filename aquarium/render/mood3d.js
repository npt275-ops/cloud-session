/* Bể Kính · render/mood3d.js · Không khí ánh sáng ("chill")
 * Một chỗ cho mọi màu trời và ánh sáng theo giờ trong ngày, để chỉnh không khí mà không phải tìm khắp nơi:
 *   KEYS  các mốc trong ngày (tod 0..1): màu trời trên, màu chân trời, màu và độ mạnh của nắng, màu ánh trời (trên) và ánh
 *         đất (dưới) của đèn trời, độ mạnh đèn trời, độ mạnh đèn hắt. Bình minh hồng cam, sáng trong, trưa vàng nhạt, chiều
 *         vàng mật ong, hoàng hôn cam tím, chạng vạng tím, đêm tím xanh. Giữa hai mốc thì pha dần.
 *   TONE  cách nén màu (linear giữ màu đậm như gốc, aces dịu hơn nhưng nhạt màu) và độ phơi sáng (render/scene3d.js dùng).
 *   SOFT  bóng đổ dịu: đèn trời sáng hơn một chút và một đèn hắt nhẹ phía ngược nắng (không đổ bóng) để mặt khuất nắng
 *         không tối đen (render/sky3d.js dùng).
 *   NEON  trời tím của thành phố neon (từ thời 10, mặt trời đã mất): không còn ngày đêm, chỉ trôi rất chậm giữa tím chiều
 *         tối (dusk) và tím tối (dark) theo giờ; nắng thay bằng ánh tím nhạt từ trên cao (các mặt trời nhân tạo, render/neon3d.js).
 * at(tod) trả màu của lúc đó, neonAt(tod) trả màu trời tím (các đối tượng Color dùng lại, không tạo mới mỗi khung hình). Cần: three.js. */
(function (root) {
  const BK = root.BK || (root.BK = {});
  // [tod, trời trên, chân trời, nắng, độ nắng, ánh trời, ánh đất, độ đèn trời, độ đèn hắt]
  const KEYS = [
    [0.00, '#0d1733', '#262a5e', '#7a8ad8', 0.00, '#6f7fc8', '#2a2f48', 0.44, 0.10],
    [0.20, '#1a2350', '#5a4a86', '#c07aa0', 0.00, '#7a7ac0', '#2e2e48', 0.42, 0.10],
    [0.25, '#4a5a9a', '#f0a088', '#ff9a7a', 0.30, '#f0c8c8', '#5a4a50', 0.48, 0.14],
    [0.30, '#7096d4', '#ffd0a8', '#ffc08a', 0.80, '#ffe0d0', '#6a6050', 0.56, 0.18],
    [0.40, '#62aee6', '#e4f2f4', '#fff2dc', 1.00, '#e8f4ff', '#7a8a60', 0.60, 0.20],
    [0.50, '#58a8e6', '#eaf4f4', '#fff6e4', 1.05, '#eef6ff', '#808c62', 0.62, 0.20],
    [0.64, '#6aa2d8', '#f6dcae', '#ffd89c', 0.95, '#fff0d8', '#7e6e4a', 0.60, 0.22],
    [0.72, '#5a62a8', '#ffa070', '#ff9a60', 0.62, '#ffc8a8', '#6a5040', 0.54, 0.18],
    [0.78, '#323470', '#a8607e', '#d07090', 0.16, '#a088c0', '#3a3048', 0.46, 0.12],
    [0.86, '#121a3c', '#2e2c62', '#8a8ad8', 0.00, '#7080c8', '#2a2f48', 0.44, 0.10],
    [1.00, '#0d1733', '#262a5e', '#7a8ad8', 0.00, '#6f7fc8', '#2a2f48', 0.44, 0.10],
  ];
  // map: 'linear' giữ đúng độ đậm của màu gốc (ACES làm màu nhạt đi); exposure: độ phơi sáng
  const TONE = { map: 'linear', exposure: 1.0 };
  const SOFT = { hemiBoost: 0.82, fillBoost: 0.7, fillColor: '#cfe0ff' };
  // [trời trên, chân trời, ánh tím trên cao, độ, ánh trời, ánh đất, độ đèn trời, độ đèn hắt]
  const NEON = {
    dusk: ['#1e1046', '#7e3488', '#d8a8ff', 0.22, '#a68ae8', '#2e1a3c', 0.44, 0.1],
    dark: ['#0e0828', '#4a2276', '#b890ff', 0.17, '#8a70d0', '#22142e', 0.38, 0.08],
  };
  function create(THREE) {
    const C = (h) => new THREE.Color(h), K = KEYS.map((k) => ({ t: k[0], top: C(k[1]), bot: C(k[2]), sun: C(k[3]), sunI: k[4], hemiSky: C(k[5]), hemiGround: C(k[6]), hemiI: k[7], fillI: k[8] }));
    const out = { top: C('#000'), bot: C('#000'), sun: C('#000'), sunI: 0, hemiSky: C('#000'), hemiGround: C('#000'), hemiI: 0, fillI: 0, fog: C('#000') };
    function at(tod) {
      tod = ((tod % 1) + 1) % 1;
      let i = 0; while (i < K.length - 2 && K[i + 1].t <= tod) i++;
      const a = K[i], b = K[i + 1], u = Math.max(0, Math.min(1, (tod - a.t) / Math.max(1e-6, b.t - a.t))), s = u * u * (3 - 2 * u); // pha mềm
      out.top.copy(a.top).lerp(b.top, s); out.bot.copy(a.bot).lerp(b.bot, s); out.sun.copy(a.sun).lerp(b.sun, s);
      out.hemiSky.copy(a.hemiSky).lerp(b.hemiSky, s); out.hemiGround.copy(a.hemiGround).lerp(b.hemiGround, s);
      out.sunI = a.sunI + (b.sunI - a.sunI) * s; out.hemiI = (a.hemiI + (b.hemiI - a.hemiI) * s) * SOFT.hemiBoost; out.fillI = (a.fillI + (b.fillI - a.fillI) * s) * (SOFT.fillBoost || 1);
      out.fog.copy(out.bot).lerp(out.top, 0.12); // sương ngả theo chân trời
      return out;
    }
    const N = [NEON.dusk, NEON.dark].map((k) => ({ top: C(k[0]), bot: C(k[1]), sun: C(k[2]), sunI: k[3], hemiSky: C(k[4]), hemiGround: C(k[5]), hemiI: k[6], fillI: k[7] }));
    // trời tím: tím chiều tối lúc "ngày", tím tối lúc "đêm", pha rất mềm (không có lúc nào sáng như ngày)
    function neonAt(tod) {
      const u = 0.5 - 0.5 * Math.cos(((tod % 1) + 1) % 1 * Math.PI * 2), a = N[1], b = N[0]; // u: 0 nửa đêm, 1 giữa trưa
      out.top.copy(a.top).lerp(b.top, u); out.bot.copy(a.bot).lerp(b.bot, u); out.sun.copy(a.sun).lerp(b.sun, u);
      out.hemiSky.copy(a.hemiSky).lerp(b.hemiSky, u); out.hemiGround.copy(a.hemiGround).lerp(b.hemiGround, u);
      out.sunI = a.sunI + (b.sunI - a.sunI) * u; out.hemiI = (a.hemiI + (b.hemiI - a.hemiI) * u) * SOFT.hemiBoost; out.fillI = (a.fillI + (b.fillI - a.fillI) * u) * (SOFT.fillBoost || 1);
      out.fog.copy(out.bot).lerp(out.top, 0.25);
      return out;
    }
    return { at, neonAt };
  }
  BK.Mood3D = { KEYS, TONE, SOFT, NEON, create };
})(typeof self !== 'undefined' ? self : globalThis);
