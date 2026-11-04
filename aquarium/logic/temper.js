/* Bể Kính · logic/temper.js · Tính cách nổi trội của một người
 * Từ 8 gen tính cách (logic/genes.js) rút ra MỘT tính cách nổi trội, để gom người cùng tính vào các kịch bản (logic/dramas.js):
 *   hothead   Nóng nảy    hiếu chiến, đa nghi: dễ kéo nhau đi bạo loạn, ẩu đả
 *   devout    Sùng đạo    hay cầu nguyện, đi lễ
 *   sociable  Hoạt ngôn   cởi mở, khéo nói: buôn chuyện, đi nghe diễn thuyết, đứng xem
 *   scholar   Ham học     trí tuệ: tranh luận ở trường, thư viện
 *   timid     Nhút nhát   sợ hãi, nhu nhược: tránh đám đông, chạy về nhà
 *   ambitious Tham vọng   tham vọng, mưu mô: cầm đầu đám đông, diễn thuyết
 * Mỗi tính cách là một công thức điểm trên gen; tính cách nổi trội là cái vượt mức trung bình (0,5) nhiều nhất.
 * Không phụ thuộc đảo: đảo nào cũng dùng chung. Không vẽ gì, chạy được bằng Node. */
(function (root, factory) {
  const BK = root.BK || (root.BK = {});
  BK.Temper = factory();
  if (typeof module === 'object' && module.exports) module.exports = BK.Temper;
})(typeof self !== 'undefined' ? self : globalThis, function () {
  'use strict';
  // w: trọng số trên gen (số âm: càng thấp gen đó càng hợp, như "ít sợ hãi"); điểm thô 0..1, trung bình 0,5
  const TEMPERS = [
    { key: 'hothead', name: 'Nóng nảy', w: { aggression: 0.6, paranoia: 0.4 } },
    { key: 'devout', name: 'Sùng đạo', w: { piety: 0.85, aggression: -0.15 } },
    { key: 'sociable', name: 'Hoạt ngôn', w: { paranoia: -0.4, cunning: 0.25, meekness: -0.35 } },
    { key: 'scholar', name: 'Ham học', w: { intellect: 0.85, fear: -0.15 } },
    { key: 'timid', name: 'Nhút nhát', w: { fear: 0.6, meekness: 0.4 } },
    { key: 'ambitious', name: 'Tham vọng', w: { ambition: 0.65, cunning: 0.35 } },
  ];
  // điểm thô (0..1) và độ lệch chuẩn của nó khi mỗi gen ~ 0,5 ± 0,2: công thức gộp nhiều gen dao động hẹp hơn công thức một
  // gen, nên tính cách nổi trội so theo điểm chuẩn hoá (z), để sáu tính cách công bằng như nhau
  for (const T of TEMPERS) { T.sd = 0.2 * Math.sqrt(Object.values(T.w).reduce((s, v) => s + v * v, 0)); T.score = (t) => { let s = 0.5; for (const k in T.w) s += T.w[k] * (t[k] - 0.5); return s; }; }
  const BY_KEY = Object.fromEntries(TEMPERS.map((T) => [T.key, T]));
  // điểm hợp của một người với một (hay vài) tính cách: điểm thô cao nhất
  const fit = (p, keys) => Math.max(...[].concat(keys).map((k) => BY_KEY[k].score(p.genome.traits)));
  // tính cách nổi trội: điểm chuẩn hoá cao nhất
  function of(p) {
    let best = TEMPERS[0], bs = -1e9;
    for (const T of TEMPERS) { const z = (T.score(p.genome.traits) - 0.5) / T.sd; if (z > bs) { bs = z; best = T; } }
    return best.key;
  }
  const nameOf = (k) => (BY_KEY[k] ? BY_KEY[k].name : k);
  return { TEMPERS, BY_KEY, of, fit, nameOf };
});
