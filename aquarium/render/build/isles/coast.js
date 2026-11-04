/* Bể Kính · render/build/isles/coast.js · Cửa Sóng (Biển): kiến trúc 12 thời
 * Làng biển: lều chài, nhà sàn trên cát, nhà dài như thuyền úp, nhà mái chùa ven cảng, rồi cao ốc trắng, tháp buồm, tháp đĩa sóng.
 * Mỗi dòng một thời: kiểu nhà riêng (render/build/isles/arch.js HOME), tên; kiểu nhà chính (HALL), tên; kỳ quan (số: kỳ quan
 * của Lúa Vàng dùng lại với màu của đảo, chữ: kỳ quan riêng trong arch.js WONDER), tên. Bảng màu theo bốn giai đoạn
 * (xưa, cận đại, hiện đại, tương lai): a tường, b mái, c điểm nhấn, d sẫm, g sáng, w cửa sổ đêm. Cần: compose.js. */
(function (root) {
  const R = (home, homeName, hall, hallName, wonder, wonderName) => ({ home, homeName, hall, hallName, wonder: [wonder, wonderName] });
  root.BK.IslesCompose.define({
    key: 'coast', name: 'Cửa Sóng', accent: '#3f9ac0', yard: ['#d8c8a0', '#c8d8d8'],
    pal: [
      { a: '#c8b088', b: '#7a5a3a', c: '#3f8ab8', d: '#3a2c20', g: '#ffb04a', w: '#ffd89a' },
      { a: '#e8dcc4', b: '#3f6a8a', c: '#c94f3a', d: '#2a3038', g: '#ffd27a', w: '#ffe0a0' },
      { a: '#f2f2ee', b: '#3f7fb8', c: '#5fd8e0', d: '#2a3440', g: '#bff0ff', w: '#e8f8ff' },
      { a: '#e8f8ff', b: '#5fa8d8', c: '#7ff0e0', d: '#1f3a50', g: '#a0fff0', w: '#f0ffff' }
    ],
    eras: [null,
      R('stilt', 'Nhà sàn biển', 'boatHall', 'Nhà Thuyền Úp', 1, 'Vòng Đá Ven Biển'),
      R('longhouse', 'Nhà dài mái cong biển', 'lodge', 'Nhà Vỏ Cây Ven Biển', 'colossus', 'Tượng Thần Biển'),
      R('pagoda', 'Nhà mái chùa biển', 'temple', 'Đền Sóng', 'giantLight', 'Hải Đăng Lớn'),
      R('townhouse', 'Nhà phố biển', 'longhall', 'Nhà Kho Cảng', 'arch', 'Cổng Biển'),
      R('longhouse', 'Nhà dài mái cong biển', 'hq', 'Trụ Sở Kính Biển', 4, 'Tháp Chuông Cảng'),
      R('wave', 'Tháp ban công sóng biển', 'arcology', 'Siêu Tháp Biển', 5, 'Xưởng Tàu Khổng Lồ'),
      R('sail', 'Tháp buồm biển', 'orb', 'Quả Cầu Biển', 6, 'Tháp Ngắm Biển'),
      R('glass', 'Cao ốc kính biển', 'spireHall', 'Ngọn Pha Lê Biển', 7, 'Bệ Phóng Trên Biển'),
      R('stepped', 'Tháp bậc thang biển', 'arcology', 'Siêu Tháp Sóng', 'megaDome', 'Vòm Đại Dương'),
      R('twist', 'Tòa xoắn biển', 'orb', 'Quả Cầu Sóng', 10, 'Mặt Trời Biển'),
      R('crystal', 'Tháp pha lê biển', 'ringHall', 'Nhà Vòng Nổi Biển', 11, 'Cổng Sóng'),
      R('sun', 'Tháp mặt trời biển', 'glassPyramid', 'Kim Tự Tháp Kính Biển', 'orbitRing', 'Vành Sóng'),
    ],
  });
})(typeof self !== 'undefined' ? self : globalThis);
