/* Bể Kính · render/style/palette.js · Bảng màu chung của phép và giao diện sách (design/ke-hoach-buoc-37.md)
 * Một chỗ duy nhất cho màu của mọi hiệu ứng phép (render/magic/) và cuốn sách (ui/spellbook-ui.js): muốn đổi không khí đồ hoạ
 * thì đổi ở đây, không sửa từng hiệu ứng. Màu hợp "thế giới đồ chơi thu nhỏ": tươi nhưng dịu, không chói.
 *   mỗi hệ phép: core (lõi sáng nhất), mid (thân), edge (rìa, tàn), soft (khói, bụi, hơi của hệ đó), ui (màu chữ, viền trong sách)
 *   ui: giấy sách, mực, linh lực
 * PAL.c(tên) trả màu dạng '#rrggbb' theo đường 'hệ.phần' (ví dụ 'fire.core'); không có thì trả màu trắng. */
(function (root) {
  const BK = root.BK || (root.BK = {});
  const PAL = {
    soul: { core: '#f4fbff', mid: '#9fe0ff', edge: '#5aa8ff', soft: '#cfe6ff', ui: '#4a8fd8' }, // linh hồn: lam bạc
    time: { core: '#fff8e0', mid: '#e8d39a', edge: '#b39ce8', soft: '#d9d2f2', ui: '#8a74c8' }, // thời gian: vàng đồng, tím nhạt
    fire: { core: '#fff2b0', mid: '#ffa23a', edge: '#e2483a', soft: '#8a8580', ui: '#d8572e' }, // lửa: vàng, cam, đỏ; khói xám ấm
    earth: { core: '#e9d3a6', mid: '#b38a5a', edge: '#7a5a3c', soft: '#c9b28c', ui: '#8a6a3e' }, // đất: cát, nâu, bụi vàng
    water: { core: '#f2fbff', mid: '#7fd0f0', edge: '#3a8fc8', soft: '#d8f0fa', ui: '#2f86c0' }, // nước: trắng bọt, lam
    ui: { paper: '#f6ecd4', paperDark: '#e8d8b4', ink: '#4a3a28', inkSoft: '#8a7458', mana: '#58b4ff', manaDark: '#2a5f9a', lock: '#b8a88c' },
  };
  PAL.c = (path) => {
    const [a, b] = String(path).split('.');
    return (PAL[a] && PAL[a][b]) || '#ffffff';
  };
  BK.Palette = PAL;
})(typeof self !== 'undefined' ? self : globalThis);
