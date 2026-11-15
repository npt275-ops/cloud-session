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
 *                     (spiral: kéo giãn, quay vòng, lao vào) vào lõi. Ở ngoài tầm thì vẫn chạy tự do quan sát: phát phép ở đầu đảo rồi chạy về cuối
 *                     đảo (xa hơn REACH_MAX × R) thì không bị hút
 *   fade(t)         1 suốt lúc hố còn; sau HOLD_END tan dần về 0 trong RELEASE giây (bản thử: trả lại đảo để thử tiếp)
 *   spiral(u, d0, rIn) đường bị cuốn vào của một người (u 0..1 trên pullSec() giây; d0: khoảng cách ngang lúc bị cuốn; rIn: bán kính
 *                   vòng trong sát lõi), ba chặng nối nhau (người chơi chốt):
 *                   - kéo giãn (STRETCH_SEC): vẫn lơ lửng tại chỗ, cả thân dài dần ra, quay dần theo hướng về tâm hố
 *                   - quay vòng (ORBIT_SEC): nhấc lên ngang mặt đĩa bồi tụ, quay ORBITS vòng quanh hố, bán kính co dần về rIn
 *                   - lao vào (PLUNGE_SEC): lao thẳng vào tâm (không quay thêm), thân dài thêm nữa
 *                   Trả { d: khoảng cách (phần của d0), turn: góc đã quay, lift: 0..1 lên tới mặt đĩa, head: 0..1 quay đầu vào
 *                   tâm, stretch: kéo dài người theo trục thân }
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
    STRETCH_SEC: 2.5, // (giây) chặng kéo giãn người (lơ lửng tại chỗ)
    ORBIT_SEC: 3, // (giây) chặng quay vòng quanh hố
    PLUNGE_SEC: 1, // (giây) chặng lao thẳng vào tâm
    ORBITS: 2, // (vòng) quay quanh hố chừng này vòng rồi lao vào tâm (mảnh vụn: warp3d.js, 1–2 vòng)
    STRETCH: 3.5, // người dài ra chừng này lần sau chặng kéo giãn; lúc lao vào thêm STRETCH_PLUNGE
    STRETCH_PLUNGE: 2,
    PULL_JIT: [0.9, 1.15], // (người trong làng) mỗi người nhanh chậm chừng này lần
    CAM_GAP: 6, // (đơn vị) vòng quay của người nhập hồn nới ra chừng này (máy quay sau lưng ~5: chỉ vào lõi ở chặng lao vào)
    BAND: 16, // (đơn vị) tầm hút lan qua chừng này thì vật đi hết đường: kéo dài, nứt, bật gốc, xé mảnh, quay vòng, vào lõi
    SIZE: 1, // vật bán kính b bị hút khi cỡ cả hố ≥ b × SIZE (cùng luật với eats: đường kính hố ≥ cỡ vật)
    CATCH_FLOAT: 2, // (giây) người nhập hồn vào tầm hút: lơ lửng chừng này rồi mới bị hút
    FLOAT_UP: 2.6, // (đơn vị) lơ lửng cao chừng này
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
  // đường bị cuốn vào: kéo giãn (lơ lửng tại chỗ), quay vòng (lên mặt đĩa, co về sát lõi), lao thẳng vào tâm
  const smooth = (a, b, x) => {
    const t = clamp01((x - a) / (b - a));
    return t * t * (3 - 2 * t);
  };
  const pullSec = () => P.STRETCH_SEC + P.ORBIT_SEC + P.PLUNGE_SEC;
  function spiral(u, d0, rIn) {
    u = clamp01(u);
    const T = pullSec(),
      s1 = P.STRETCH_SEC / T,
      s2 = (P.STRETCH_SEC + P.ORBIT_SEC) / T;
    const inner = Math.min(1, (rIn || 0) / Math.max(1e-3, d0)),
      o = clamp01((u - s1) / (s2 - s1)); // (tiến độ chặng quay vòng)
    const d = (1 - (1 - inner) * smooth(0, 1, o)) * (1 - smooth(s2, 1, u));
    return {
      d,
      turn: Math.PI * 2 * P.ORBITS * Math.pow(o, 1.4),
      lift: smooth(s1, s1 + (s2 - s1) * 0.4, u),
      head: smooth(0, s1, u),
      stretch: 1 + (P.STRETCH - 1) * smooth(0, s1, u) + P.STRETCH_PLUNGE * smooth(s2, 1, u),
    };
  }
  BK.BlackHolePlan = { P, outer, horizon, height, eats, eatAt, houseAt, reach, fade, done, spiral, pullSec };
  if (typeof module !== 'undefined') module.exports = BK.BlackHolePlan;
})(typeof self !== 'undefined' ? self : globalThis);
