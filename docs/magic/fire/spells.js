/* Bể Kính · magic/fire/spells.js · Danh sách phép hệ lửa (trang "Lửa" của sách)
 * Chỉ là dữ liệu: tên, giá, hồi phép, cách dùng, đã mở chưa (ý nghĩa từng trường: logic/spells.js). Thêm, bớt phép của hệ này
 * thì sửa ở đây; tác động khi phát nằm ở magic/fire/cast.js. Chạy được bằng Node (kiểm thử: test/spells.test.js). */
(function (root) {
  const BK = root.BK || (root.BK = {});
  const SP = BK.Spells || require('../../logic/spells.js');
  SP.add('fire', [
    { id: 'fireball', name: 'Cầu lửa', cost: 20, cd: 1.5, use: 'tap', aim: true, open: true, desc: 'Ném quả cầu lửa tới chỗ ngắm: nổ tung, nhà gần đó bén lửa, người gần đó hoảng sợ bỏ chạy.' },
    { id: 'fireRing', name: 'Vòng lửa', cost: 35, cd: 8, use: 'tap', self: true, open: true, desc: 'Vòng lửa bùng lên quanh mình vài giây: không ai đi qua được, người trong vòng bị đẩy ra.' },
  ]);
})(typeof self !== 'undefined' ? self : globalThis);
