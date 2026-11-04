/* Bể Kính · render/outfits3d.js
 * Trang phục của 5 nhóm người hay gặp qua 12 thời kỳ: người đứng đầu, tướng, lính, dân thường nam, dân thường nữ.
 * Chỉ là bảng dữ liệu; render/rig3d.js đọc bảng này để dựng người. Các ghế khác trong hội đồng (quân sư, tư tế, thương
 * chủ, học giả, thợ cả) mặc như dân thường của thời đó, cộng một món theo nghề (SEAT_PROP).
 * Mỗi bộ: shirt áo, sleeve tay áo ('skin' là cởi trần tay, bỏ trống là cùng màu áo), fore cẳng tay ('skin' hay màu),
 * pants quần ('skin' là chân trần), shoe giày, skirt [dài, màu] (váy, khố, áo bào), front màu mảng trước ngực (yếm, giáp,
 * cà vạt...), tie cà vạt, hat [kiểu, màu, màu phụ], prop món cầm tay, glow màu vạch sáng (thời tương lai), halo quầng sáng.
 * Kiểu mũ: band khăn quấn, feathers mũ lông chim, nonLa nón lá, crown mũ miện, helmet mũ tròn (trụ, bảo hộ, phi công),
 * plume chóp lông trên mũ, khanDong khăn đóng, quaiThao nón quai thao, kepi mũ lưỡi trai, topHat mũ chóp cao, beret mũ nồi,
 * visor kính sáng. Món cầm tay: spear giáo, staff gậy, sword kiếm, musket hoả mai, rifle súng trường, shield khiên,
 * basket giỏ, briefcase cặp. */
(function (root, factory) {
  const BK = root.BK || (root.BK = {});
  BK.Outfits3D = factory();
})(typeof self !== 'undefined' ? self : globalThis, function () {
  'use strict';
  const S = 'skin';
  const E = {
    1: { // Thời đồ đá: da thú, lá, chân trần
      leader: { shirt: '#6b4a32', sleeve: S, pants: S, shoe: S, skirt: [0.46, '#5a3e2a'], hat: ['feathers', '#d24a2e', '#f0c040'], prop: 'staff', paint: true },
      general: { shirt: '#8a6a44', sleeve: S, pants: S, shoe: S, skirt: [0.22, '#7a5a36'], hat: ['band', '#b8462e'], prop: 'spear', paint: true },
      soldier: { shirt: '#9c7a4e', sleeve: S, pants: S, shoe: S, skirt: [0.2, '#8a6a44'], prop: 'spear' },
      m: { shirt: '#9c7a4e', sleeve: S, pants: S, shoe: S, skirt: [0.2, '#7a5a36'] },
      f: { shirt: '#6f5034', sleeve: S, pants: S, shoe: S, skirt: [0.32, '#6f8f3a'], hat: ['band', '#d9a03a'], prop: 'basket' },
    },
    2: { // Cổ đại: vải thô, đồng
      leader: { shirt: '#a8322c', pants: '#7a2a24', shoe: '#6b4a2e', skirt: [0.5, '#8a2a24'], hat: ['helmet', '#b8863a'], prop: 'staff' },
      general: { shirt: '#7a5a3a', front: '#5a4030', pants: '#5a4030', shoe: '#5a3a24', skirt: [0.26, '#6b4a30'], hat: ['helmet', '#b8863a', '#c8302a'], prop: 'spear' },
      soldier: { shirt: '#8a6a44', pants: '#6b5034', shoe: S, skirt: [0.22, '#7a5a3a'], prop: 'spearShield' },
      m: { shirt: '#a8865a', fore: S, pants: '#7a6448', shoe: S },
      f: { shirt: '#b89066', fore: S, front: '#a8423a', pants: '#5a4a3a', shoe: S, skirt: [0.48, '#5a4a3a'] },
    },
    3: { // Trung đại: đã chốt ở làng lúa
      leader: { shirt: '#e2b23a', pants: '#a8322c', shoe: '#6b2a22', skirt: [0.56, '#e2b23a'], sash: '#a8322c', hat: ['crown', '#f0cc4a', '#c8302a'] },
      general: { shirt: '#8a2e2a', front: '#9aa4ae', pants: '#3a2e2a', shoe: '#3a2a20', skirt: [0.32, '#6d7680'], sash: '#d8b04a', hat: ['helmet', '#8f99a3', '#c8302a'], prop: 'sword' },
      soldier: { shirt: '#6b5a45', pants: '#4a3e30', shoe: '#3a2a20', hat: ['nonLa', '#c9b07a'], prop: 'spearShield' },
      m: { shirt: '#8a5a3a', fore: S, pants: '#d9c7a2', shoe: '#5a3a24', sash: '#c9a14a', hat: ['nonLa', '#e8d29a'] },
      f: { shirt: '#9a6a44', fore: S, front: '#b8423a', pants: '#2e2a2a', shoe: '#5a3a24', skirt: [0.5, '#2e2a2a'], sash: '#3f8a5a', hat: ['band', '#2e2a2a'] },
    },
    4: { // Cận đại: áo dài, gấm, hoả mai
      leader: { shirt: '#d9a83a', pants: '#f2ece0', shoe: '#6b2a22', skirt: [0.56, '#c8962e'], sash: '#a8322c', hat: ['crown', '#f0cc4a', '#2f5a9a'] },
      general: { shirt: '#2f4a6b', front: '#d8b04a', pants: '#f2ece0', shoe: '#1e1816', skirt: [0.3, '#2f4a6b'], hat: ['kepi', '#1e1e22', '#c8302a'], prop: 'sword' },
      soldier: { shirt: '#a8322c', pants: '#f2ece0', shoe: '#1e1816', hat: ['kepi', '#1e1e22'], prop: 'musket' },
      m: { shirt: '#3a4a5a', pants: '#f2ece0', shoe: '#1e1816', skirt: [0.42, '#3a4a5a'], hat: ['khanDong', '#1e1a1a'] },
      f: { shirt: '#c86a8a', pants: '#f2ece0', shoe: '#7a3a2e', skirt: [0.5, '#c86a8a'], hat: ['quaiThao', '#3a2a22', '#e8c24a'] },
    },
    5: { // Công nghiệp: đuôi tôm, quân phục cài khuy, quần yếm
      leader: { shirt: '#2a2a30', front: '#f2f0ec', tie: '#2a2a30', pants: '#2a2a30', shoe: '#141414', hat: ['topHat', '#1e1e22'] },
      general: { shirt: '#2f4a3a', front: '#d8b04a', pants: '#2a3a30', shoe: '#141414', hat: ['kepi', '#2f4a3a', '#d8b04a'], prop: 'sword' },
      soldier: { shirt: '#3a5a4a', pants: '#2a3a30', shoe: '#141414', hat: ['kepi', '#3a5a4a'], prop: 'rifle' },
      m: { shirt: '#6a7a8a', front: '#2f5f9a', pants: '#2f5f9a', shoe: '#3a2a20', hat: ['kepi', '#3a3a3a'] },
      f: { shirt: '#8a5a6a', front: '#e8e2d0', pants: '#5a3a4a', shoe: '#3a2a20', skirt: [0.52, '#5a3a4a'], hat: ['band', '#c8a07a'] },
    },
    6: { // Hiện đại: com-lê, rằn ri, áo phông
      leader: { shirt: '#3a4250', front: '#f4f2ee', tie: '#b8302a', pants: '#2e333b', shoe: '#141414', prop: 'briefcase' },
      general: { shirt: '#5a6a3a', front: '#4a5a30', pants: '#4a5a30', shoe: '#2a2a20', hat: ['beret', '#6a2a2a'], prop: 'rifle' },
      soldier: { shirt: '#5a6a3a', front: '#3a4a2a', pants: '#4a5a30', shoe: '#2a2a20', hat: ['helmet', '#4a5a3a'], prop: 'rifle' },
      m: { shirt: '#3f7fb8', fore: S, pants: '#2f4a6b', shoe: '#e8e8e8' },
      f: { shirt: '#e8e2d8', pants: '#c84a6a', shoe: '#c84a6a', skirt: [0.36, '#c84a6a'] },
    },
    7: { // Tên lửa: đồ bay, mũ có kính
      leader: { shirt: '#f2f2ee', front: '#e6c04a', pants: '#d8dee6', shoe: '#9aa8b8', skirt: [0.4, '#e8e8e4'] },
      general: { shirt: '#4a5a6a', front: '#e6c04a', pants: '#3a4a5a', shoe: '#2a2e34', hat: ['helmet', '#e8e8e8', '#5aa8d8'], prop: 'rifle' },
      soldier: { shirt: '#3a4250', front: '#2a2e34', pants: '#3a4250', shoe: '#1e2024', hat: ['helmet', '#2a2e34', '#5fe8ff'], prop: 'rifle' },
      m: { shirt: '#d8dee6', pants: '#5a6a7a', shoe: '#3a3e44' },
      f: { shirt: '#e8a04a', pants: '#e8a04a', shoe: '#3a3e44' },
    },
    8: { // Robot AI: đồ ôm có vạch sáng
      leader: { shirt: '#e8ecf0', pants: '#d0d8e2', shoe: '#9aa4ae', skirt: [0.5, '#e8ecf0'], glow: '#5fe8ff', hat: ['visor', '#5fe8ff'] },
      general: { shirt: '#7a8490', front: '#9aa4b0', pants: '#6a7480', shoe: '#3a4250', glow: '#5fe8ff', hat: ['helmet', '#9aa4b0', '#5fe8ff'], prop: 'rifle' },
      soldier: { shirt: '#9aa4b0', front: '#7a8490', pants: '#7a8490', shoe: '#3a4250', glow: '#ff5a4f', hat: ['helmet', '#7a8490', '#ff5a4f'] },
      m: { shirt: '#2a2e3a', pants: '#23262e', shoe: '#1a1c22', glow: '#5fe8ff' },
      f: { shirt: '#3a2e4a', pants: '#2e2638', shoe: '#1a1c22', glow: '#ff6ad8', hair: '#e0447a' },
    },
    9: { // Vật Chất Sống: áo dệt lá, cánh hoa, vỏ sống
      leader: { shirt: '#e8909e', pants: '#d07080', shoe: '#8a4a5a', skirt: [0.56, '#f0b0b8'], hat: ['feathers', '#f6c0c4', '#5fd8c0'], glow: '#c8f07a' },
      general: { shirt: '#c8b890', front: '#a89870', pants: '#8a7a5a', shoe: '#5a4a3a', hat: ['helmet', '#c8b890', '#5fd8c0'], prop: 'spear' },
      soldier: { shirt: '#a8c890', front: '#88a870', pants: '#6a8a5a', shoe: '#4a5a3a', prop: 'spear' },
      m: { shirt: '#8fc89a', pants: '#6aa87a', shoe: '#4a7a5a' },
      f: { shirt: '#f2b8c8', pants: '#e0a0b4', shoe: '#a86a7a', skirt: [0.46, '#f6c8d6'] },
    },
    10: { // Mặt Trời Nhân Tạo: áo phản quang ấm, quầng sáng
      leader: { shirt: '#ffd27a', pants: '#f2c260', shoe: '#c8963a', skirt: [0.58, '#ffe0a0'], halo: '#ffd27a' },
      general: { shirt: '#f6f0e0', front: '#ffd27a', pants: '#e8dcc0', shoe: '#c8b890', glow: '#ffd27a', prop: 'spear' },
      soldier: { shirt: '#e8dcc0', pants: '#d8ccb0', shoe: '#a89a7a', glow: '#ffd27a', prop: 'shield' },
      m: { shirt: '#f2e6c8', pants: '#e2d6b8', shoe: '#b8a888' },
      f: { shirt: '#ffe0a0', pants: '#f2d090', shoe: '#c8a86a', skirt: [0.5, '#fff0c8'] },
    },
    11: { // Bẻ Cong Không Gian: áo gấp nếp, vạch tím
      leader: { shirt: '#8a6ad8', pants: '#6a4ab8', shoe: '#3a2a6a', skirt: [0.58, '#a88ae8'], halo: '#b48cff' },
      general: { shirt: '#5a5a7a', front: '#7a7a9a', pants: '#4a4a6a', shoe: '#2a2a4a', glow: '#b48cff', hat: ['helmet', '#5a5a7a', '#ff6ad8'], prop: 'spear' },
      soldier: { shirt: '#6a6a8a', pants: '#4a4a6a', shoe: '#2a2a4a', glow: '#ff6ad8', prop: 'shield' },
      m: { shirt: '#c8c0e0', pants: '#a8a0c8', shoe: '#6a6a8a', glow: '#b48cff' },
      f: { shirt: '#e0c8f0', pants: '#c8b0e0', shoe: '#8a7aa8', skirt: [0.5, '#e8d8f6'], glow: '#ff6ad8' },
    },
    12: { // Siêu Việt: hình người bằng ánh sáng
      leader: { shirt: '#fff8e8', pants: '#fff2d8', shoe: '#f2e8d0', skirt: [0.6, '#fffaf0'], halo: '#ffd27a', light: true },
      general: { shirt: '#f4f2ff', pants: '#e8e6f6', shoe: '#dcdaf0', halo: '#e8f4ff', light: true },
      soldier: { shirt: '#eef2ff', pants: '#e2e6f6', shoe: '#d6dcf0', halo: '#e8f4ff', light: true },
      m: { shirt: '#f2f4ff', pants: '#e6e8f6', shoe: '#dadcec', light: true },
      f: { shirt: '#fff0f8', pants: '#f6e4f0', shoe: '#ecd8e6', skirt: [0.5, '#fff6fb'], light: true },
    },
  };
  // món theo nghề của các ghế khác trong hội đồng
  const SEAT_PROP = { advisor: 'staff', priest: 'staff', merchant: 'basket', healer: 'basket', builder: 'staff' };
  // nhóm của một người: người đứng đầu, tướng, lính, dân thường nam hay nữ
  function groupOf(p) {
    if (p.role === 'king') return 'leader';
    if (p.role === 'general1' || p.role === 'general2') return 'general';
    if (p.job === 'soldier' || p.job === 'gatekeeper') return 'soldier'; // lính gác cổng mặc như lính
    return p.sex === 'f' ? 'f' : 'm';
  }
  function look(p, level) {
    const T = E[Math.max(1, Math.min(12, level || 1))], g = groupOf(p);
    let o = T[g];
    // người đứng đầu và tướng là nữ: giữ trang phục của ghế, thêm váy nếu chưa có
    if (p.sex === 'f' && (g === 'leader' || g === 'general' || g === 'soldier') && !o.skirt) o = Object.assign({}, o, { skirt: [0.42, o.pants === 'skin' ? o.shirt : o.pants] });
    if (p.role && SEAT_PROP[p.role] && !o.prop && g !== 'leader') o = Object.assign({}, o, { prop: SEAT_PROP[p.role] });
    return Object.assign({ group: g }, o);
  }
  const GROUP_NAME = { leader: 'Người đứng đầu', general: 'Tướng', soldier: 'Lính', m: 'Dân thường', f: 'Dân thường' };
  return { E, look, groupOf, GROUP_NAME };
});
