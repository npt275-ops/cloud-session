/* Bể Kính · magic/soul/spells.js · Danh sách phép hệ linh hồn (trang "Linh hồn" của sách)
 * Chỉ là dữ liệu: tên, giá, hồi phép, cách dùng, đã mở chưa (ý nghĩa từng trường: logic/spells.js). Thêm, bớt phép của hệ này
 * thì sửa ở đây; tác động khi phát nằm ở magic/soul/cast.js. Chạy được bằng Node (kiểm thử: test/spells.test.js). */
(function (root) {
  const BK = root.BK || (root.BK = {});
  const SP = BK.Spells || require('../../logic/spells.js');
  SP.add('soul', [
    { id: 'soulBolt', name: 'Tia linh lực', cost: 8, cd: 0.5, use: 'tap', aim: true, open: true, desc: 'Một đốm sáng linh hồn bay tới chỗ ngắm rồi bung ra. Phép thử: chưa tác động lên thế giới.' },
    {
      id: 'blackHole',
      name: 'Hố đen',
      cost: 45,
      cd: 44,
      use: 'tap',
      aim: true,
      open: true,
      desc: 'Hố đen ở chỗ ngắm lớn dần tới nửa đảo, bẻ cong không gian, hút người, nhà rồi cả hòn đảo, hút luôn người nhập hồn.',
    },
  ]);
})(typeof self !== 'undefined' ? self : globalThis);
