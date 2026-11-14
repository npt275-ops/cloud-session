/* Bể Kính · magic/earth/spells.js · Danh sách phép hệ đất (trang "Đất" của sách)
 * Chỉ là dữ liệu: tên, giá, hồi phép, cách dùng, đã mở chưa (ý nghĩa từng trường: logic/spells.js). Thêm, bớt phép của hệ này
 * thì sửa ở đây; tác động khi phát nằm ở magic/earth/cast.js. Chạy được bằng Node (kiểm thử: test/spells.test.js). */
(function (root) {
  const BK = root.BK || (root.BK = {});
  const SP = BK.Spells || require('../../logic/spells.js');
  SP.add('earth', [
    { id: 'pillar', name: 'Trụ đá', cost: 25, cd: 4, use: 'tap', self: true, open: true, desc: 'Núi đá trồi lên ngay dưới chân, đỉnh là trụ đá nâng mình lên cao; máy quay bật ra xa để thấy cả ngọn núi.' },
    { id: 'mount', name: 'Núi đá', cost: 35, cd: 6, use: 'tap', aim: true, open: true, desc: 'Vòng trụ đá trồi lên ở chỗ ngắm rồi đất giữa dâng lên thành núi; nhà ở đó bị đẩy sập.' },
    { id: 'quake', name: 'Rung đất', cost: 40, cd: 10, use: 'tap', aim: true, open: true, desc: 'Sóng đất toả ra từ chỗ ngắm: nhà rung nứt, người gần đó hoảng sợ bỏ chạy.' },
  ]);
})(typeof self !== 'undefined' ? self : globalThis);
