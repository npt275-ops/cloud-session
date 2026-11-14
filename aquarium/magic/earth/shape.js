/* Bể Kính · magic/earth/shape.js · Hình dáng đất nhô của phép đất (chỉ là toán: dùng chung cho mặt đất và khối vẽ)
 * at(b, dx, dz, k): đất cao thêm bao nhiêu ở (dx, dz) tính từ tâm khối b, khi khối đã trồi được k (0: chưa, 1: xong).
 * b = { kind, r, h, seed }:
 *   'uplift'  Đất trồi: mảng đất quanh chân phồng lên thành gò, mặt trên bằng (bán kính TOP_R) cao h, sườn thoải xuống viền r
 *   'mount'   Núi đất: gò đất nhỏ hình ngọn núi, đỉnh hơi tròn cao h, sườn thoải dần ra viền r
 * Viền không tròn đều (seed: mỗi gò một dáng). Mặt đất (L.bumps, render/map/height3d.js) và khối vẽ (magic/earth/look3d.js)
 * cùng đọc hàm này nên người đứng đúng trên mặt gò. Chạy được bằng Node (test/earth.test.js). */
(function (root, factory) {
  const BK = root.BK || (root.BK = {});
  BK.EarthShape = factory();
  if (typeof module === 'object' && module.exports) module.exports = BK.EarthShape;
})(typeof self !== 'undefined' ? self : globalThis, function () {
  'use strict';
  const TOP_R = 1.0, // (đơn vị đảo) bán kính mặt bằng trên gò Đất trồi (người đứng vừa)
    EDGE = 1.17; // viền gồ ghề lớn nhất so với r
  const clamp = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
  const sstep = (a, b, x) => {
    const t = clamp((x - a) / (b - a));
    return t * t * (3 - 2 * t);
  };
  const out3 = (t) => 1 - Math.pow(1 - clamp(t), 3); // (trồi nhanh rồi chậm lại)
  const rough = (b, a) => 1 + 0.1 * Math.sin(a * 5 + b.seed) + 0.06 * Math.sin(a * 9 + b.seed * 2.3);
  function at(b, dx, dz, k) {
    if (!(k > 0)) return 0;
    const d = Math.hypot(dx, dz);
    if (d >= b.r * EDGE) return 0;
    const R = b.r * rough(b, Math.atan2(dz, dx));
    if (d >= R) return 0;
    const e = out3(k);
    if (b.kind === 'uplift') return e * b.h * (1 - sstep(TOP_R, R, d));
    const s = d / R;
    return e * b.h * Math.pow(1 - s, 1.5) * (1 - 0.25 * Math.pow(1 - s, 6)); // (đỉnh hơi tròn, không nhọn hoắt)
  }
  const reach = (b) => b.r * EDGE;
  return { at, reach, TOP_R };
});
