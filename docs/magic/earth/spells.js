/* Bể Kính · magic/earth/spells.js · Danh sách phép hệ đất (trang "Đất" của sách)
 * Chỉ là dữ liệu: tên, giá, hồi phép, cách dùng, đã mở chưa (ý nghĩa từng trường: logic/spells.js). Thêm, bớt phép của hệ này
 * thì sửa ở đây; tác động khi phát nằm ở magic/earth/cast.js. Chạy được bằng Node (kiểm thử: test/spells.test.js). */
(function (root) {
  const BK = root.BK || (root.BK = {});
  const SP = BK.Spells || require('../../logic/spells.js');
  SP.add('earth', [
    { id: 'uplift', name: 'Đất trồi', cost: 25, cd: 4, use: 'tap', hold: 1.6, self: true, open: true, desc: 'Mảng đất quanh chân phồng lên thành gò, nâng mình lên cao hơn người một chút.' },
    { id: 'mount', name: 'Núi đất', cost: 35, cd: 6, use: 'tap', hold: 2, aim: true, open: true, desc: 'Một gò đất nhỏ hình ngọn núi trồi lên ở chỗ ngắm; nhà ở đó bị đẩy nứt, sập.' },
  ]);
})(typeof self !== 'undefined' ? self : globalThis);
