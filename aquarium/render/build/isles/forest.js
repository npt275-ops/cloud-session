/* Bể Kính · render/build/isles/forest.js · Thông Xanh (Rừng): kiến trúc 12 thời
 * Làng gỗ giữa rừng thông: lều lá, nhà sàn, nhà rông, nhà khung gỗ, rồi cao ốc ốp gỗ xanh, tháp cây sống, tháp lá hứng nắng.
 * Mỗi dòng một thời: kiểu nhà riêng (render/build/isles/arch.js HOME), tên; kiểu nhà chính (HALL), tên; kỳ quan (số: kỳ quan
 * của Lúa Vàng dùng lại với màu của đảo, chữ: kỳ quan riêng trong arch.js WONDER), tên. Bảng màu theo bốn giai đoạn
 * (xưa, cận đại, hiện đại, tương lai): a tường, b mái, c điểm nhấn, d sẫm, g sáng, w cửa sổ đêm. Cần: compose.js. */
(function (root) {
  const R = (home, homeName, hall, hallName, wonder, wonderName) => ({ home, homeName, hall, hallName, wonder: [wonder, wonderName] });
  root.BK.IslesCompose.define({
    key: 'forest', name: 'Thông Xanh', accent: '#3f8a4a', yard: ['#9a8a5a', '#7fae6a'],
    pal: [
      { a: '#a8845a', b: '#6a8a40', c: '#c94f3a', d: '#3e2c20', g: '#ffb04a', w: '#ffd89a' },
      { a: '#c8a070', b: '#5a6a3a', c: '#b8462e', d: '#3a2a20', g: '#ffd27a', w: '#ffe0a0' },
      { a: '#d8d8c8', b: '#3f6a4a', c: '#5fa86a', d: '#2a3a30', g: '#bff0c8', w: '#e8ffd8' },
      { a: '#c8ecd0', b: '#2f7a4a', c: '#7fe0a0', d: '#1f3a2a', g: '#c8ff9a', w: '#e8ffd0' }
    ],
    eras: [null,
      R('lean', 'Lều lá', 'greatTent', 'Lều Tù Trưởng', 'sacredTree', 'Cây Thiêng'),
      R('stilt', 'Nhà sàn gỗ', 'longhall', 'Nhà Rông', 'colossus', 'Tượng Thần Rừng'),
      R('longhouse', 'Nhà dài mái cong', 'pagoda', 'Đình Gỗ Bốn Tầng', 2, 'Tháp Hạt Thông'),
      R('timber', 'Nhà khung gỗ', 'keep', 'Lũy Gỗ Lớn', 'monastery', 'Chùa Trên Cây'),
      R('townhouse', 'Nhà phố gỗ', 'clock', 'Toà Đồng Hồ Gỗ', 5, 'Xưởng Cưa Khổng Lồ'),
      R('terrace', 'Cao ốc vườn mái xanh', 'mill', 'Xưởng Giấy', 6, 'Tháp Kiểm Lâm'),
      R('glass', 'Cao ốc kính xanh', 'hq', 'Trụ Sở Rừng', 'megaDome', 'Vòm Rừng Kính'),
      R('spire', 'Tháp gỗ công nghệ', 'glassPyramid', 'Kim Tự Tháp Kính Rừng', 8, 'Tháp Dữ Liệu Rừng'),
      R('bio', 'Tòa cây sống', 'bioHall', 'Nhà Cây Sống Rừng', 9, 'Cây Mẹ'),
      R('sun', 'Tháp lá hứng nắng', 'arcology', 'Siêu Tháp Lá', 10, 'Mặt Trời Lá'),
      R('twist', 'Tòa xoắn dây leo', 'spireHall', 'Ngọn Rừng Pha Lê', 'orbitRing', 'Vành Lá Xanh'),
      R('float', 'Tháp đĩa nổi xanh', 'ringHall', 'Nhà Vòng Nổi Rừng', 12, 'Rừng Lơ Lửng'),
    ],
  });
})(typeof self !== 'undefined' ? self : globalThis);
