/* Bể Kính · render/build/isles/tundra.js · Tuyết Trắng (Băng nguyên): kiến trúc 12 thời
 * Làng băng: nhà băng tròn, lều da tuần lộc, nhà dài, nhà vòm tuyết, rồi chung cư sưởi ấm, tháp băng, tháp đĩa cực quang.
 * Mỗi dòng một thời: kiểu nhà riêng (render/build/isles/arch.js HOME), tên; kiểu nhà chính (HALL), tên; kỳ quan (số: kỳ quan
 * của Lúa Vàng dùng lại với màu của đảo, chữ: kỳ quan riêng trong arch.js WONDER), tên. Bảng màu theo bốn giai đoạn
 * (xưa, cận đại, hiện đại, tương lai): a tường, b mái, c điểm nhấn, d sẫm, g sáng, w cửa sổ đêm. Cần: compose.js. */
(function (root) {
  const R = (home, homeName, hall, hallName, wonder, wonderName) => ({ home, homeName, hall, hallName, wonder: [wonder, wonderName] });
  root.BK.IslesCompose.define({
    key: 'tundra',
    name: 'Tuyết Trắng',
    accent: '#7fc8e8',
    yard: ['#d8e2ea', '#e8f2f8'],
    pal: [
      { a: '#eef4f8', b: '#8a6a4a', c: '#c94f3a', d: '#3a4048', g: '#ffb04a', w: '#ffd89a' },
      { a: '#c8a888', b: '#5a6a7a', c: '#b8462e', d: '#33383e', g: '#ffd27a', w: '#ffe0a0' },
      { a: '#e8eef4', b: '#4a6a8a', c: '#5fc8e8', d: '#2a3440', g: '#bff0ff', w: '#e8f8ff' },
      { a: '#dff4ff', b: '#7fa8d8', c: '#a0f0e0', d: '#2a3a50', g: '#c8fff0', w: '#f0ffff' },
    ],
    eras: [
      null,
      R('igloo', 'Nhà băng tròn', 'snowHall', 'Nhà Băng Lớn', 'iceSpire', 'Mũi Băng Thiêng'),
      R('tent', 'Lều da tuần lộc', 'greatTent', 'Lều Da Lớn', 1, 'Vòng Đá Băng'),
      R('dome', 'Nhà vòm tuyết', 'longhall', 'Nhà Rông Băng', 'colossus', 'Tượng Băng'),
      R('longhouse', 'Nhà dài mái cong tuyết', 'domeHall', 'Vòm Sưởi', 3, 'Pháo Đài Tuyết'),
      R('block', 'Chung cư tuyết', 'mill', 'Xưởng Lớn Băng', 4, 'Tháp Chuông Tuyết'),
      R('glass', 'Cao ốc kính tuyết', 'domeHall', 'Nhà Vòm Băng', 5, 'Lò Hơi Lớn'),
      R('domeTower', 'Tháp vòm chồng tuyết', 'glassPyramid', 'Kim Tự Tháp Kính Băng', 6, 'Tháp Cực Quang'),
      R('ice', 'Tháp băng', 'arcology', 'Siêu Tháp Băng', 'megaDome', 'Vòm Băng Ấm'),
      R('twist', 'Tòa xoắn tuyết', 'orb', 'Quả Cầu Cực Quang', 8, 'Tháp Dữ Liệu Lạnh'),
      R('spire', 'Tháp kim tuyết', 'ringHall', 'Nhà Vòng Nổi Băng', 10, 'Mặt Trời Băng'),
      R('float', 'Tháp đĩa cực quang', 'bioHall', 'Nhà Cây Sống Băng', 'orbitRing', 'Vành Cực Quang'),
      R('bio', 'Tòa sinh học tuyết', 'orb', 'Lõi Tuyết Sáng', 12, 'Thành Băng Lơ Lửng'),
    ],
  });
})(typeof self !== 'undefined' ? self : globalThis);
