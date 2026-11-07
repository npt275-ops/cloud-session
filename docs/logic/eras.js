/* Bể Kính · logic/eras.js
 * Mười hai thời kỳ văn minh của một trận chín năm. Thời đầu tiên luôn là Thời đồ đá; bốn thời cuối vượt tầm hiểu biết
 * của con người. Mỗi đảo lên cấp riêng khi nộp đủ giỏ tài nguyên của thời sau (cost, logic/economy.js), nên có đảo không
 * chạm tới thời 12 trong chín năm. ERA_DAYS: số ngày dự kiến của một thời, chỉ để định nhịp dựng công trình
 * (logic/construction.js). Không vẽ gì, chạy được bằng Node.
 * Cần: logic/rules.js (MATCH_DAYS). */
(function (root, factory) {
  const BK = root.BK || (root.BK = {});
  BK.Eras = factory(BK.Rules || (typeof require === 'function' ? require('./rules.js') : null));
  if (typeof module === 'object' && module.exports) module.exports = BK.Eras;
})(typeof self !== 'undefined' ? self : globalThis, function (R) {
  'use strict';
  // level: cấp 1..12; hall: tên nhà chính của Lúa Vàng ở thời đó; tech: phát minh mở thời; beyond: thời vượt người;
  // cost: giỏ tài nguyên phải nộp để bước vào thời này (logic/economy.js): các thời sau luôn đòi thứ đảo mình thiếu, và nặng dần
  // (từ thời 4 mỗi thời nặng thêm 75% so với giỏ gốc)
  const LIST = [
    { level: 1, key: 'stone', name: 'Thời đồ đá', hall: 'Lều lớn của tù trưởng', leader: 'Tù trưởng', tech: 'lửa, rìu đá và hái lượm', cost: {} },
    { level: 2, key: 'ancient', name: 'Cổ đại', hall: 'Cung Đất Nung', leader: 'Thủ lĩnh', tech: 'nung gạch, làm gốm và trồng lúa', cost: { food: 120, wood: 60, stone: 40 } },
    { level: 3, key: 'medieval', name: 'Trung đại', hall: 'Đình làng', leader: 'Vua', tech: 'rèn sắt và cối xay gió', cost: { food: 180, wood: 80, stone: 80, metal: 40 } },
    { level: 4, key: 'early', name: 'Cận đại', hall: 'Tháp Đồng Hồ', leader: 'Vua', tech: 'in sách, mài kính và khí cầu', cost: { food: 390, wood: 170, metal: 140, luxury: 70 } },
    { level: 5, key: 'industrial', name: 'Công nghiệp', hall: 'Toà Thị Chính', leader: 'Thị trưởng', tech: 'máy hơi nước và đường ray', cost: { food: 640, stone: 200, metal: 360, energy: 200 } },
    { level: 6, key: 'modern', name: 'Hiện đại', hall: 'Trung Tâm Hành Chính', leader: 'Chủ tịch', tech: 'điện, máy tính và tuabin gió', cost: { food: 970, metal: 530, energy: 530, luxury: 190 } },
    { level: 7, key: 'rocket', name: 'Tên lửa', hall: 'Tháp Điều Hành', leader: 'Tổng chỉ huy', tech: 'tên lửa, vệ tinh và điện hạt nhân', cost: { food: 1290, metal: 890, energy: 960, luxury: 400 } },
    { level: 8, key: 'ai', name: 'Robot AI', hall: 'Lõi Trí Tuệ', leader: 'Người điều hành', tech: 'robot, trí tuệ nhân tạo và máy tính lượng tử', cost: { stone: 570, metal: 1230, energy: 1430, luxury: 670 } },
    { level: 9, key: 'living', name: 'Vật Chất Sống', hall: 'Lõi San Hô', leader: 'Người điều hành', tech: 'vật chất sống và những ngôi nhà tự mọc', beyond: true, cost: { food: 1980, wood: 1100, energy: 1750, luxury: 880 } },
    { level: 10, key: 'sun', name: 'Mặt Trời Nhân Tạo', hall: 'Tháp Lơ Lửng', leader: 'Người điều hành', tech: 'thắp một mặt trời trong vòm kính', beyond: true, cost: { metal: 1870, energy: 2620, luxury: 1250 } },
    { level: 11, key: 'warp', name: 'Bẻ Cong Không Gian', hall: 'Cổng Trung Tâm', leader: 'Người điều hành', tech: 'gấp không gian để đi xuyên qua nó', beyond: true, cost: { stone: 1400, metal: 2100, energy: 3500, luxury: 1830 } },
    { level: 12, key: 'light', name: 'Siêu Việt', hall: 'Cột Sáng', leader: 'Người điều hành', tech: 'sống như ánh sáng và nghĩ chung một ý', beyond: true, cost: { food: 3100, metal: 2790, energy: 4650, luxury: 2490 } },
  ];
  const MATCH_DAYS = (R && R.MATCH_DAYS) || 3240;
  const ERA_DAYS = MATCH_DAYS / LIST.length; // 270 ngày: nhịp dựng công trình của một thời (không phải hạn lên cấp)
  const of = (level) => LIST[Math.max(1, Math.min(LIST.length, level)) - 1];
  return { LIST, ERA_DAYS, MATCH_DAYS, of, COUNT: LIST.length };
});
