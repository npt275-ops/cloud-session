/* Bể Kính · logic/eras.js
 * Mười hai thời kỳ văn minh của một trận chín năm. Thời đầu tiên luôn là Thời đồ đá; bốn thời cuối vượt tầm hiểu biết
 * của con người. Bây giờ mỗi thời dài như nhau (ERA_DAYS ngày); sau này logic của đảo (phát minh, dân số, chính sách)
 * sẽ quyết định khi nào lên cấp, chỉ cần thay eraOfDay. Không vẽ gì, chạy được bằng Node.
 * Cần: logic/rules.js (MATCH_DAYS). */
(function (root, factory) {
  const BK = root.BK || (root.BK = {});
  BK.Eras = factory(BK.Rules || (typeof require === 'function' ? require('./rules.js') : null));
  if (typeof module === 'object' && module.exports) module.exports = BK.Eras;
})(typeof self !== 'undefined' ? self : globalThis, function (R) {
  'use strict';
  // level: cấp 1..12; hall: tên nhà chính của Lúa Vàng ở thời đó; tech: phát minh mở thời; beyond: thời vượt người
  const LIST = [
    { level: 1, key: 'stone', name: 'Thời đồ đá', hall: 'Lều lớn của tù trưởng', leader: 'Tù trưởng', tech: 'lửa, rìu đá và hái lượm' },
    { level: 2, key: 'ancient', name: 'Cổ đại', hall: 'Cung Đất Nung', leader: 'Thủ lĩnh', tech: 'nung gạch, làm gốm và trồng lúa' },
    { level: 3, key: 'medieval', name: 'Trung đại', hall: 'Đình làng', leader: 'Vua', tech: 'rèn sắt và cối xay gió' },
    { level: 4, key: 'early', name: 'Cận đại', hall: 'Tháp Đồng Hồ', leader: 'Vua', tech: 'in sách, mài kính và khí cầu' },
    { level: 5, key: 'industrial', name: 'Công nghiệp', hall: 'Toà Thị Chính', leader: 'Thị trưởng', tech: 'máy hơi nước và đường ray' },
    { level: 6, key: 'modern', name: 'Hiện đại', hall: 'Trung Tâm Hành Chính', leader: 'Chủ tịch', tech: 'điện, máy tính và tuabin gió' },
    { level: 7, key: 'rocket', name: 'Tên lửa', hall: 'Tháp Điều Hành', leader: 'Tổng chỉ huy', tech: 'tên lửa, vệ tinh và điện hạt nhân' },
    { level: 8, key: 'ai', name: 'Robot AI', hall: 'Lõi Trí Tuệ', leader: 'Người điều hành', tech: 'robot, trí tuệ nhân tạo và máy tính lượng tử' },
    { level: 9, key: 'living', name: 'Vật Chất Sống', hall: 'Lõi San Hô', leader: 'Người điều hành', tech: 'vật chất sống và những ngôi nhà tự mọc', beyond: true },
    { level: 10, key: 'sun', name: 'Mặt Trời Nhân Tạo', hall: 'Tháp Lơ Lửng', leader: 'Người điều hành', tech: 'thắp một mặt trời trong vòm kính', beyond: true },
    { level: 11, key: 'warp', name: 'Bẻ Cong Không Gian', hall: 'Cổng Trung Tâm', leader: 'Người điều hành', tech: 'gấp không gian để đi xuyên qua nó', beyond: true },
    { level: 12, key: 'light', name: 'Siêu Việt', hall: 'Cột Sáng', leader: 'Người điều hành', tech: 'sống như ánh sáng và nghĩ chung một ý', beyond: true },
  ];
  const MATCH_DAYS = (R && R.MATCH_DAYS) || 3240;
  const ERA_DAYS = MATCH_DAYS / LIST.length; // 270 ngày (9 tháng trong game) mỗi thời
  const levelOfDay = (day) => Math.max(1, Math.min(LIST.length, 1 + Math.floor(Math.max(0, day) / ERA_DAYS)));
  const startOf = (level) => (Math.max(1, Math.min(LIST.length, level)) - 1) * ERA_DAYS;
  const of = (level) => LIST[Math.max(1, Math.min(LIST.length, level)) - 1];
  return { LIST, ERA_DAYS, MATCH_DAYS, levelOfDay, startOf, of, COUNT: LIST.length };
});
