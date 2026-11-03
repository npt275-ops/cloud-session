/* Bể Kính · logic/rules.js
 * Mọi con số luật chơi của logic ngầm nằm ở đây, để chỉnh nhịp trận mà không phải tìm trong từng tệp.
 * Không phụ thuộc tệp nào khác. */
(function (root, factory) {
  const BK = root.BK || (root.BK = {});
  BK.Rules = factory();
  if (typeof module === 'object' && module.exports) module.exports = BK.Rules;
})(typeof self !== 'undefined' ? self : globalThis, function () {
  'use strict';

  const YEAR_DAYS = 360;
  const GEN_DAYS = 540;                 // một thế hệ = 1,5 năm trong game
  const LIFE_YEARS_PER_GEN = 25;        // một thế hệ ứng với khoảng 25 năm đời người
  return {
    YEAR_DAYS,
    GEN_DAYS,
    MATCH_DAYS: 9 * YEAR_DAYS,          // một trận chín năm
    AGE_PER_DAY: LIFE_YEARS_PER_GEN / GEN_DAYS, // tuổi đời tăng mỗi ngày trong game (khoảng 0,046)

    // con người
    CORE_SIZE: 8,                        // hội đồng: 4 nam, 4 nữ
    START_AGE: [20, 30],                 // tuổi của tám người đầu tiên
    ADULT_AGE: 18,                       // đủ tuổi kết hôn và vào hội đồng
    FERTILE_MAX: 45,                     // người mẹ còn sinh con tới tuổi này
    RETIRE_AGE: 72,                      // rời hội đồng
    OLD_AGE: 62,                         // từ tuổi này bắt đầu có thể mất vì già
    DEATH_K: 0.0026,                     // độ dốc của rủi ro mất vì già (mỗi ngày)
    CHILDREN: [1, 3],                    // mỗi cặp mỗi thế hệ có 1 tới 3 con
    NAMED_CAP: 40,                       // tối đa số người có tên còn sống trên một đảo (phần dân còn lại chỉ là con số, làm sau)

    // ghép đôi: điểm hợp = (1 - khác biệt tính cách) × nặng + ngẫu nhiên × (1 - nặng)
    MATCH_FIT_WEIGHT: 0.6,
    COUSIN_PENALTY: 0.25,                // anh em họ được cưới nhưng kém hợp hơn

    // bộ não: vài lần mỗi ngày trong game, mỗi người quyết định làm gì
    THINK_PER_DAY: 6,
    DROUGHT_CHANCE: 0.35,                // xác suất có hạn hán vào mỗi mùa hạ
    DROUGHT_DAYS: [18, 40],
  };
});
