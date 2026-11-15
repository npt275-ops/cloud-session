/* Bể Kính · render/magic/recipes.js · Công thức hiệu ứng phép (design/ke-hoach-buoc-37.md mục 3)
 * Chỉ là số và màu: chỉnh cho đẹp ở đây, không sửa code vẽ (render/magic/vfx.js đọc công thức).
 * Một công thức gồm các phần (đều tuỳ chọn):
 *   soft, glow  danh sách nhóm hạt mềm, hạt sáng: { n số hạt, life [giây ít, nhiều], size [cỡ đầu, cỡ cuối] (mỗi cỡ là số hay
 *               [ít, nhiều]), speed [ít, nhiều], dir 'sphere' | 'up' | 'flat' | 'cone' (theo hướng của phép), spread độ toả,
 *               up thêm vận tốc lên, grav trọng lực (âm: bay lên), drag độ hãm, color [màu đầu, màu cuối], alpha, jitter bán
 *               kính chỗ sinh }
 *   debris      mảnh vụn: { n, size [ít, nhiều], speed [ít, nhiều], dir, spread, life, color }
 *   decal       vết trên đất: [{ kind 'disc' | 'ring', r [bán kính đầu, cuối], life, color, alpha }]
 *   light       đèn chớp: { color, intensity, range, life }
 *   rate        (nguồn phát liên tục) số lần phát mỗi giây; mỗi lần phát n = 1 hạt mỗi nhóm
 * Ở đây chỉ có công thức dùng chung; công thức riêng của từng hệ nằm ở magic/<hệ>/recipes.js (thêm vào BK.MagicRecipes).
 * Màu: tên trong bảng màu chung (render/style/palette.js), ví dụ 'soul.core', hay '#rrggbb'. Đơn vị: đơn vị đảo (người cao 1,4). */
(function (root) {
  const BK = root.BK || (root.BK = {});
  const R = {
    /* ----- dùng chung ----- */
    // bụi đất bốc lên (trụ đá, rung đất, vật rơi)
    dustPuff: {
      soft: [{ n: 24, life: [0.8, 1.6], size: [0.25, 0.8], speed: [0.6, 1.8], dir: 'flat', up: 0.6, grav: -0.2, drag: 1.8, color: ['earth.soft', 'earth.soft'], alpha: 0.55 }],
      debris: { n: 10, size: [0.05, 0.13], speed: [2, 4.5], dir: 'up', spread: 1.6, life: [1.5, 2.5], color: 'earth.mid' },
      decal: [{ kind: 'disc', r: [0.4, 1.4], life: 3, color: 'earth.edge', alpha: 0.35 }],
    },
    // chân gậy phép chống xuống đất (render/magic/staff3d.js): bụi nhỏ toả sát đất, vài hạt sỏi nảy
    staffThud: {
      soft: [{ n: 8, life: [0.4, 0.8], size: [0.06, 0.2], speed: [0.4, 0.9], dir: 'flat', up: 0.15, drag: 3, color: ['earth.soft', 'earth.soft'], alpha: 0.45 }],
      debris: { n: 3, size: [0.012, 0.025], speed: [0.8, 1.4], dir: 'up', spread: 1.8, life: [0.5, 0.8], color: 'earth.mid' },
    },
  };
  BK.MagicRecipes = Object.assign(BK.MagicRecipes || {}, R);
})(typeof self !== 'undefined' ? self : globalThis);
