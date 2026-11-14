/* Bể Kính · magic/earth/spells.js · Danh sách phép hệ đất (trang "Đất" của sách)
 * Chỉ là dữ liệu: tên, giá, hồi phép, cách dùng, đã mở chưa (ý nghĩa từng trường: logic/spells.js). Thêm, bớt phép của hệ này
 * thì sửa ở đây; tác động khi phát sẽ nằm ở magic/earth/cast.js (chưa làm). Chạy được bằng Node (kiểm thử: test/spells.test.js). */
(function (root) {
  const BK = root.BK || (root.BK = {});
  const SP = BK.Spells || require('../../logic/spells.js');
  SP.add('earth', [
    { id: 'pillar', name: 'Trụ đá', cost: 25, cd: 4, use: 'tap', self: true, desc: 'Trụ đá trồi lên ngay dưới chân, nâng mình lên cao.' },
    { id: 'quake', name: 'Rung đất', cost: 40, cd: 10, use: 'tap', aim: true, desc: 'Sóng đất toả ra, người gần đó ngã ngồi.' },
  ]);
})(typeof self !== 'undefined' ? self : globalThis);
