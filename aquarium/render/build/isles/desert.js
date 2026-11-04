/* Bể Kính · render/build/isles/desert.js · Cát Hồng (Sa mạc): kiến trúc 12 thời
 * Làng cát hồng: lều vải, nhà vòm đất, nhà gạch đất mái bằng, nhà đá, rồi tháp bậc thang có vườn treo, cao ốc kính hồng, tháp xoắn cát.
 * Mỗi dòng một thời: kiểu nhà riêng (render/build/isles/arch.js HOME), tên; kiểu nhà chính (HALL), tên; kỳ quan (số: kỳ quan
 * của Lúa Vàng dùng lại với màu của đảo, chữ: kỳ quan riêng trong arch.js WONDER), tên. Bảng màu theo bốn giai đoạn
 * (xưa, cận đại, hiện đại, tương lai): a tường, b mái, c điểm nhấn, d sẫm, g sáng, w cửa sổ đêm. Cần: compose.js. */
(function (root) {
  const R = (home, homeName, hall, hallName, wonder, wonderName) => ({ home, homeName, hall, hallName, wonder: [wonder, wonderName] });
  root.BK.IslesCompose.define({
    key: 'desert', name: 'Cát Hồng', accent: '#e08a6a', yard: ['#e8c0a0', '#f0d0b8'],
    pal: [
      { a: '#e0b088', b: '#a8603e', c: '#c94f3a', d: '#4a3020', g: '#ffb04a', w: '#ffd89a' },
      { a: '#e8c09a', b: '#b8704a', c: '#3f7fb8', d: '#4a3426', g: '#ffd27a', w: '#ffe0a0' },
      { a: '#f2d8c8', b: '#c87a5a', c: '#5fb8c8', d: '#4a3430', g: '#ffe0c0', w: '#fff0e0' },
      { a: '#ffe0d0', b: '#e89a8a', c: '#ffb0d0', d: '#4a2a3a', g: '#ffd0f0', w: '#fff0f8' }
    ],
    eras: [null,
      R('dome', 'Nhà vòm cát hồng', 'stoneHut', 'Nhà Đá Tròn', 'obelisk', 'Cột Đá Mặt Trời'),
      R('adobe', 'Nhà gạch đất cát hồng', 'ziggurat', 'Đền Bậc Thang Cát', 'pyramid', 'Kim Tự Tháp Hồng'),
      R('tent', 'Lều vải lớn cát hồng', 'greatTent', 'Lều Lớn Cát', 'colossus', 'Tượng Người Gác Cát'),
      R('cliff', 'Nhà đá mái bằng', 'clock', 'Toà Đồng Hồ Cát', 'arch', 'Cổng Sa Mạc'),
      R('adobe', 'Nhà gạch đất cát hồng', 'keep', 'Thành Cát', 4, 'Tháp Chuông Cát'),
      R('courtyard', 'Toà sân trong tháp gió cát hồng', 'hq', 'Trụ Sở Kính Cát', 5, 'Tháp Nước Lớn'),
      R('stepped', 'Tháp bậc vườn treo', 'clock', 'Toà Thị Chính', 6, 'Tháp Gió'),
      R('domeTower', 'Tháp vòm chồng cát hồng', 'orb', 'Quả Cầu Cát', 7, 'Bệ Phóng Sa Mạc'),
      R('sun', 'Tháp mặt trời cát hồng', 'spireHall', 'Ngọn Pha Lê Cát', 'megaDome', 'Vòm Ốc Đảo'),
      R('glass', 'Cao ốc kính cát hồng', 'bioHall', 'Nhà Cây Sống Cát', 10, 'Mặt Trời Sa Mạc'),
      R('spire', 'Tháp kim cát hồng', 'hq', 'Trụ Sở Kính Cát', 'elevator', 'Thang Lên Sao'),
      R('twist', 'Tòa xoắn cát hồng', 'bioHall', 'Nhà Cây Sống Cát', 12, 'Thành Phố Cát Bay'),
    ],
  });
})(typeof self !== 'undefined' ? self : globalThis);
