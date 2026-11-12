/* Bể Kính · render/build/isles/mountain.js · Đá Mây (Núi): kiến trúc 12 thời
 * Làng đá trên núi: lều da, nhà vòm đá, nhà đá bám vách, chùa núi, rồi cao ốc đá xám, tháp bậc thang tựa núi, tháp mây.
 * Mỗi dòng một thời: kiểu nhà riêng (render/build/isles/arch.js HOME), tên; kiểu nhà chính (HALL), tên; kỳ quan (số: kỳ quan
 * của Lúa Vàng dùng lại với màu của đảo, chữ: kỳ quan riêng trong arch.js WONDER), tên. Bảng màu theo bốn giai đoạn
 * (xưa, cận đại, hiện đại, tương lai): a tường, b mái, c điểm nhấn, d sẫm, g sáng, w cửa sổ đêm. Cần: compose.js. */
(function (root) {
  const R = (home, homeName, hall, hallName, wonder, wonderName) => ({ home, homeName, hall, hallName, wonder: [wonder, wonderName] });
  root.BK.IslesCompose.define({
    key: 'mountain',
    name: 'Đá Mây',
    accent: '#7a8aa8',
    yard: ['#9a9488', '#b8bcc4'],
    pal: [
      { a: '#9a9080', b: '#6d6359', c: '#b8582e', d: '#3a3430', g: '#ffb04a', w: '#ffd89a' },
      { a: '#b0a796', b: '#5a5a66', c: '#8a3e2a', d: '#33302c', g: '#ffd27a', w: '#ffe0a0' },
      { a: '#c8ccd4', b: '#5a6478', c: '#3f7fb8', d: '#2a2e38', g: '#bfe3ff', w: '#e8f4ff' },
      { a: '#e0e6f2', b: '#8a98c0', c: '#b8c8ff', d: '#2e3450', g: '#d8e8ff', w: '#f0f6ff' },
    ],
    eras: [
      null,
      R('tent', 'Lều da', 'cave', 'Hang Tổ Tiên', 1, 'Vòng Đá Đỉnh Núi'),
      R('dome', 'Nhà vòm đá', 'stoneHut', 'Nhà Đá Tròn Núi', 'obelisk', 'Cột Đá Khắc'),
      R('cliff', 'Nhà đá bám vách', 'keep', 'Thành Đá', 'monastery', 'Tu Viện Vách Đá'),
      R('pagoda', 'Nhà mái chùa', 'pagoda', 'Chùa Mây Bốn Tầng', 3, 'Pháo Đài Núi'),
      R('timber', 'Nhà gỗ đá', 'domeHall', 'Nhà Vòm Núi', 'arch', 'Cổng Đá Mây'),
      R('rockTower', 'Tháp bám đá núi', 'clock', 'Toà Đồng Hồ Núi', 5, 'Mỏ Lớn Ống Khói'),
      R('spire', 'Tháp kim núi', 'arcology', 'Siêu Tháp Núi', 6, 'Đài Phát Sóng Đỉnh Núi'),
      R('stepped', 'Tháp bậc thang núi', 'hq', 'Trụ Sở Kính Núi', 7, 'Bệ Phóng Núi'),
      R('domeTower', 'Tháp vòm chồng núi', 'ringHall', 'Nhà Vòng Nổi Núi', 8, 'Lõi Dữ Liệu Trong Núi'),
      R('float', 'Tháp đĩa nổi núi', 'glassPyramid', 'Kim Tự Tháp Kính Núi', 'colossus', 'Người Đá Thức Tỉnh'),
      R('sun', 'Tháp mặt trời núi', 'orb', 'Quả Cầu Mây', 'elevator', 'Thang Lên Trời'),
      R('crystal', 'Tháp thạch anh', 'spireHall', 'Ngọn Thạch Anh', 'orbitRing', 'Vành Mây Đá'),
    ],
  });
})(typeof self !== 'undefined' ? self : globalThis);
