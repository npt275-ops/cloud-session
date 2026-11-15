/* Bể Kính · magic/water/spells.js · Danh sách phép hệ nước (trang "Nước" của sách)
 * Chỉ là dữ liệu: tên, giá, hồi phép, cách dùng, đã mở chưa (ý nghĩa từng trường: logic/spells.js). Thêm, bớt phép của hệ này
 * thì sửa ở đây; tác động khi phát nằm ở magic/water/cast.js. Chạy được bằng Node (kiểm thử: test/spells.test.js). */
(function (root) {
  const BK = root.BK || (root.BK = {});
  const SP = BK.Spells || require('../../logic/spells.js');
  SP.add('water', [
    { id: 'rain', name: 'Gọi mưa', cost: 30, cd: 10, use: 'tap', aim: true, open: true, desc: 'Mây nhỏ kéo tới chỗ ngắm, mưa rơi vài giây: nhà đang cháy tắt lửa, đảo hết hạn hán, hết cháy rừng.' },
    { id: 'geyser', name: 'Cột nước', cost: 25, cd: 3, use: 'tap', aim: true, open: true, desc: 'Cột nước phun vọt lên ở chỗ ngắm: dập lửa tức thì, người gần đó bị hất ra, bỏ chạy.' },
    { id: 'deluge', name: 'Đại hồng thuỷ', cost: 100, cd: 120, use: 'tap', self: true, need: 'sea', open: true, desc: 'Chỉ khi đứng gần biển: lốc xoáy giữa bể, cả bể dâng cao gấp 14 lần tầm mắt rồi đổ ập, sóng tràn vào sáu đảo.' },
  ]);
})(typeof self !== 'undefined' ? self : globalThis);
