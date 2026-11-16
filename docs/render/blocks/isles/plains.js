/* Bể Kính · render/blocks/isles/plains.js · Lúa Vàng (Đồng bằng): vỏ khối công trình
 * Đảo mẫu: dùng hình gốc của mọi tệp hình dáng (kiểu 'native', render/blocks/style.js), bệ đá, không thêm đồ trang trí.
 * Bảng màu một bậc: wall tường, wall2 tường phụ, roof mái, trim viền gỗ/sắt, stone bệ đá, dark cửa và bóng, accent cờ,
 * glow phần phát sáng, metal sắt thép; light (tuỳ chọn) đá trắng, vữa trắng; upper (tuỳ chọn) tầng trên nhà dân bậc 1.
 * Cần: render/blocks/blocks.js. */
(function (root) {
  root.BK.Blocks.isle('plains', {
    name: 'Lúa Vàng',
    sky: '#bcd9e6',
    ground: '#8fbf63',
    tiers: [
      { wall: '#c39a62', wall2: '#a57c48', roof: '#d2ae52', trim: '#6e4b2b', stone: '#a39a86', dark: '#3b2a1c', accent: '#c8402f', glow: '#ffd27a', metal: '#7d6a50' },
      { wall: '#c2bcab', wall2: '#9d9684', roof: '#a9573c', trim: '#6b5645', stone: '#8f8878', dark: '#3a2f27', accent: '#c8402f', glow: '#ffd27a', metal: '#6f6a62' },
      { wall: '#b9684c', wall2: '#93503b', roof: '#4d5a66', trim: '#39424b', stone: '#8b8a86', dark: '#262b30', accent: '#c8402f', glow: '#ffe2a0', metal: '#8a96a2' },
      { wall: '#323b4c', wall2: '#262d3b', roof: '#1b212c', trim: '#3d475c', stone: '#4c5668', dark: '#0e1219', accent: '#ff3fa4', glow: '#3ff0ff', metal: '#7a879c' },
      { wall: '#f6e7c1', wall2: '#e0c27a', roof: '#e8b440', trim: '#b8892e', stone: '#cfc3a6', dark: '#4a3a6a', accent: '#ff7ad9', glow: '#fff1a8', metal: '#e8d08a' }, // bậc 5 huyền ảo
    ],
    S: { base: 'slab', myth: 'lotus' }, // (myth: biểu tượng đỉnh bậc 5, render/blocks/mythic.js)
  });
})(typeof self !== 'undefined' ? self : globalThis);
