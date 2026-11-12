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
  const GEN_DAYS = 540; // một thế hệ = 1,5 năm trong game
  const LIFE_YEARS_PER_GEN = 25; // một thế hệ ứng với khoảng 25 năm đời người
  return {
    YEAR_DAYS,
    GEN_DAYS,
    MATCH_DAYS: 9 * YEAR_DAYS, // một trận chín năm
    AGE_PER_DAY: LIFE_YEARS_PER_GEN / GEN_DAYS, // tuổi đời tăng mỗi ngày trong game (khoảng 0,046)

    // con người
    CORE_SIZE: 8, // hội đồng: 4 nam, 4 nữ
    START_AGE: [20, 30], // tuổi của tám người đầu tiên
    ADULT_AGE: 18, // đủ tuổi kết hôn và vào hội đồng
    FERTILE_MAX: 45, // người mẹ còn sinh con tới tuổi này
    RETIRE_AGE: 72, // rời hội đồng
    OLD_AGE: 62, // người già: thôi làm việc nặng (logic/jobs.js)
    // rủi ro mất mỗi năm đời người theo luật Gompertz: MORTALITY_A × e^(MORTALITY_B × (tuổi − 20)); tăng gấp đôi sau khoảng 8
    // năm tuổi; người trẻ cũng có thể mất vì bệnh. Thời càng tiến bộ y học càng tốt: hệ số giảm MEDICINE mỗi thời, tối đa
    // còn MEDICINE_FLOOR (thời 1: 60 tuổi khoảng 5%/năm, 80 tuổi khoảng 27%/năm)
    MORTALITY_A: 0.0015,
    MORTALITY_B: 0.087,
    MEDICINE: 0.06,
    MEDICINE_FLOOR: 0.35,
    CHILDREN: [2, 4], // mỗi cặp mỗi thế hệ có 2 tới 4 con khi làng còn thưa (mỗi người mẹ chỉ kịp sinh ở một mốc thế hệ)
    KIDS_SHARE: 0.28, // trẻ em tối đa bằng chừng này phần của POP_CAP (để các lứa tuổi đều nhau)
    BIRTH_PER_DAY: 0.08, // giữa hai mốc thế hệ: mỗi ngày có chừng này cơ hội một cặp sinh thêm con (khi còn chỗ)
    CHILDREN_FULL: [2, 3], // làng gần đầy: vẫn đủ thay thế thế hệ trước, không để hụt một lứa
    POP_CAP: 100, // tối đa người trên một đảo (đã chốt); ai cũng có vai rõ ràng (logic/jobs.js)
    BASKET_SCALE: 2.2, // giỏ tài nguyên mỗi thời (logic/eras.js) ghi cho đảo 50 dân; nhân hệ số này cho đảo 100 dân

    // ghép đôi: điểm hợp = (1 - khác biệt tính cách) × nặng + ngẫu nhiên × (1 - nặng)
    MATCH_FIT_WEIGHT: 0.6,
    COUSIN_PENALTY: 0.25, // anh em họ được cưới nhưng kém hợp hơn

    // bộ não: vài lần mỗi ngày trong game, mỗi người quyết định làm gì
    THINK_PER_DAY: 6,
    // dàn vai của một đảo (logic/jobs.js): hội đồng 8 ghế (vua, 2 tướng, quân sư, tư tế, thương chủ, thầy thuốc, thợ cả),
    // thêm thợ cho đủ 4 người dựng và sửa nhà, thêm 1 người bán hàng cho đủ 2 thương nhân, một phần người lớn làm lính,
    // còn lại là dân: người làm ra tài nguyên (logic/economy.js) và người đi đường (đi lại, mua bán, trò chuyện)
    HOME_SLOTS: 20, // số nhà riêng trong làng: mỗi hộ (bố mẹ và con) một nhà (logic/homes.js)
    GATEKEEPERS: 4, // lính gác cổng thành: luôn đủ 4 người, thế hệ này qua thế hệ khác (logic/jobs.js)
    SIDE_GUARDS: 2, // lính gác mỗi cổng phụ (trái, phải: chỗ hở tường nơi bắc cầu sang hai đảo bên) (logic/posts.js)
    ORATORS: 1, // người diễn thuyết ở bục giữa sân (logic/posts.js)
    BUILDERS: 4, // tổng số thợ xây kể cả thợ cả
    TRADERS: 2, // tổng số thương nhân kể cả thương chủ
    SOLDIER_SHARE: 0.25, // phần người lớn ngoài hội đồng làm lính
    WALKER_SHARE: 0.15, // phần dân còn lại là người đi đường (số kia làm ra tài nguyên, logic/economy.js)
  };
});
