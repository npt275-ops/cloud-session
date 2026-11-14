/* Bể Kính · magic/time/spells.js · Danh sách phép hệ thời gian (trang "Thời gian" của sách)
 * Chỉ là dữ liệu: tên, giá, hồi phép, cách dùng, đã mở chưa (ý nghĩa từng trường: logic/spells.js). Thêm, bớt phép của hệ này
 * thì sửa ở đây; tác động khi phát nằm ở magic/time/cast.js. Chạy được bằng Node (kiểm thử: test/spells.test.js). */
(function (root) {
  const BK = root.BK || (root.BK = {});
  const SP = BK.Spells || require('../../logic/spells.js');
  SP.add('time', [
    { id: 'timeStop', open: true, name: 'Dừng thời gian', cost: 30, cd: 8, use: 'toggle', self: true, desc: 'Cả thế giới đứng im, chỉ linh hồn vẫn đi lại được.' },
    { id: 'timeFast', open: true, name: 'Tua nhanh', cost: 14, cd: 0, use: 'hold', self: true, desc: 'Giữ để thời gian trôi nhanh 8 lần, 16 lần.' },
    { id: 'timeBack', open: true, name: 'Tua lùi', cost: 20, cd: 0, use: 'hold', self: true, desc: 'Giữ để lùi từng ngày, xa nhất 30 ngày.' },
  ]);
})(typeof self !== 'undefined' ? self : globalThis);
