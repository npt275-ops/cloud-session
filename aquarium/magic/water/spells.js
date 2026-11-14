/* Bể Kính · magic/water/spells.js · Danh sách phép hệ nước (trang "Nước" của sách)
 * Chỉ là dữ liệu: tên, giá, hồi phép, cách dùng, đã mở chưa (ý nghĩa từng trường: logic/spells.js). Thêm, bớt phép của hệ này
 * thì sửa ở đây; tác động khi phát sẽ nằm ở magic/water/cast.js (chưa làm). Chạy được bằng Node (kiểm thử: test/spells.test.js). */
(function (root) {
  const BK = root.BK || (root.BK = {});
  const SP = BK.Spells || require('../../logic/spells.js');
  SP.add('water', [
    { id: 'rain', name: 'Gọi mưa', cost: 30, cd: 10, use: 'tap', aim: true, desc: 'Mây nhỏ kéo đến, mưa dập lửa, tưới ruộng.' },
    { id: 'geyser', name: 'Cột nước', cost: 25, cd: 3, use: 'tap', aim: true, desc: 'Cột nước phun lên, đẩy người ra xa, dập lửa.' },
    { id: 'deluge', name: 'Đại hồng thuỷ', cost: 100, cd: 120, use: 'tap', self: true, need: 'sea', desc: 'Chỉ khi ở gần biển: lốc xoáy nước, cả bể dâng cao rồi đổ ập, sóng tràn vào sáu đảo.' },
  ]);
})(typeof self !== 'undefined' ? self : globalThis);
