/* Bể Kính · magic/soul/blackhole/plan.js · Nhịp và luật của Hố đen (design/ke-hoach-buoc-37.md mục "Hố đen")
 * Toán thuần, không cần three.js; mọi con số ở P. R là bán kính đảo (trung bình), t là giây kể từ lúc phát phép.
 *   outer(t, R)     bán kính cả hố (tới mép ngoài đĩa bồi tụ): lớn dần trong GROW giây tới nửa đảo (OUT_FRAC)
 *   horizon(t, R)   bán kính chân trời sự kiện (lõi đen): một phần của outer
 *   height(t, R)    tâm hố cao hơn mặt đất chỗ ngắm chừng này (hố lớn thì bay cao lên, đĩa không cắt đất)
 *   eats(cỡ, t, R)  hố lớn hơn vật (đường kính cả hố ≥ cỡ vật) thì hút được vật đó
 *   houseAt(R)      lúc hố đủ lớn để hút nhà (cỡ HOUSE)
 *   reach(t, R)     tầm hút: khoảng cách ngang tới trục hố, lan dần tới REACH_MAX × R lúc REACH_END. Trong tầm:
 *                   - vật thể (cây, cỏ, đá, nhà, mảng gạch đường: pieces.js, warp3d.js) hố lớn hơn nó (SIZE) thì bị kéo dài,
 *                     uốn oằn, nứt, bật gốc, xé thành mảnh bay vào; vật nhỏ trước, nhà sau. Đất giữ nguyên
 *                   - người (hố lớn hơn người) bị cuốn lên (pull.js)
 *                   - người nhập hồn vào tầm thì bị giữ (không đi được, chỉ xoay nhìn), lơ lửng CATCH_FLOAT giây rồi bị hút
 *                     PLAYER_SEC giây vào lõi. Ở ngoài tầm thì vẫn chạy tự do quan sát: phát phép ở đầu đảo rồi chạy về cuối
 *                     đảo (xa hơn REACH_MAX × R) thì không bị hút
 *   fade(t)         1 suốt lúc hố còn; sau HOLD_END tan dần về 0 trong RELEASE giây (bản thử: trả lại đảo để thử tiếp)
 *   spiral(u, d0)   đường xoắn vào tâm của một người bị hút (u 0..1): khoảng cách (phần của d0), góc quay thêm, độ kéo dài
 * Chạy được bằng Node (kiểm thử: test/blackhole.test.js). */
(function (root) {
  const BK = root.BK || (root.BK = {});
  const P = {
    GROW: 26, // (giây) hố lớn tới cỡ đủ
    OUT_MIN: 0.8, // (đơn vị) cỡ lúc mới nhen
    OUT_FRAC: 0.5, // cỡ đủ: nửa bán kính đảo
    OUT_EXP: 1.6, // lớn chậm lúc đầu, nhanh dần
    HORIZON: 0.28, // lõi đen: phần này của cả hố
    LIFT: 0.9, // tâm hố cao hơn đất: 1,5 + outer × LIFT
    PERSON: 1.4, // (đơn vị) cỡ một người
    HOUSE: 10, // (đơn vị) cỡ một ngôi nhà
    REACH_MAX: 0.85, // tầm hút lớn nhất: chừng này lần bán kính đảo (phát ở giữa đảo thì hút gần hết đảo; ở đầu đảo thì cuối đảo thoát)
    REACH_END: 34, // (giây) tầm hút lớn hết cỡ
    PULL_SEC: [3.5, 6], // (giây) một người bị hút từ lúc nhấc lên tới lúc vào trong hố
    BAND: 9, // (đơn vị) tầm hút lan qua chừng này thì vật đi hết đường: kéo dài, nứt, bật gốc, xé mảnh, bay vào lõi
    SIZE: 1, // vật bán kính b bị hút khi cỡ cả hố ≥ b × SIZE (cùng luật với eats: đường kính hố ≥ cỡ vật)
    CATCH_FLOAT: 2, // (giây) người nhập hồn vào tầm hút: lơ lửng chừng này rồi mới bị hút
    FLOAT_UP: 2.6, // (đơn vị) lơ lửng cao chừng này
    PLAYER_SEC: 5, // (giây) người nhập hồn bị hút vào hố
    HOLD_END: 40, // (giây) hố còn tới lúc này
    RELEASE: 4, // (giây) rồi tan dần (bản thử)
  };
  const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
  const outerMax = (R) => R * P.OUT_FRAC;
  const outer = (t, R) => P.OUT_MIN + (outerMax(R) - P.OUT_MIN) * Math.pow(clamp01(t / P.GROW), P.OUT_EXP);
  const horizon = (t, R) => outer(t, R) * P.HORIZON;
  const height = (t, R) => 1.5 + outer(t, R) * P.LIFT;
  const eats = (size, t, R) => 2 * outer(t, R) >= size;
  // lúc hố đủ lớn để hút vật cỡ size (chia đôi: outer chỉ tăng)
  function eatAt(size, R) {
    if (eats(size, 0, R)) return 0;
    if (!eats(size, P.GROW, R)) return Infinity;
    let a = 0,
      b = P.GROW;
    for (let i = 0; i < 40; i++) {
      const m = (a + b) / 2;
      if (eats(size, m, R)) b = m;
      else a = m;
    }
    return b;
  }
  const houseAt = (R) => eatAt(P.HOUSE, R);
  // (luôn hơn cả hố một chút: thứ chạm vào hố thì bị hút; lan dần ra theo thời gian; không quá REACH_MAX × R)
  const reach = (t, R) => Math.min(R * P.REACH_MAX, Math.max(1.5 * outer(t, R), R * P.REACH_MAX * Math.pow(clamp01(t / P.REACH_END), 1.1)));
  const fade = (t) => 1 - clamp01((t - P.HOLD_END) / P.RELEASE);
  const done = (t) => t >= P.HOLD_END + P.RELEASE;
  // đường xoắn vào tâm: chậm lúc đầu (nhấc lên), nhanh dần; quay càng nhanh khi càng gần (như nước xoáy vào lỗ)
  function spiral(u, d0) {
    const e = clamp01(u) * clamp01(u);
    const d = 1 - e;
    return { d, turn: (1.2 + 6 / Math.max(1, d0 * 0.15)) * e, lift: Math.sin(Math.min(1, u * 1.6) * Math.PI * 0.5), stretch: 1 + 2.5 * e };
  }
  BK.BlackHolePlan = { P, outer, horizon, height, eats, eatAt, houseAt, reach, fade, done, spiral };
  if (typeof module !== 'undefined') module.exports = BK.BlackHolePlan;
})(typeof self !== 'undefined' ? self : globalThis);
