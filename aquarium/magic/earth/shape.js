/* Bể Kính · magic/earth/shape.js · Hình dáng đất nhô của phép đất (chỉ là toán: dùng chung cho mặt đất và khối vẽ)
 * at(b, dx, dz, k): đất cao thêm bao nhiêu ở (dx, dz) tính từ tâm khối b, khi khối đã trồi được k (0: chưa, 1: xong).
 * b = { kind, r, h, seed }:
 *   'peak'   Trụ đá: núi thấp bán kính r, giữa là trụ đá đỉnh phẳng (bán kính PILLAR_R) cao h; núi và trụ trồi cùng lúc
 *   'mount'  Núi đá: CRAGS trụ đá quanh tâm trồi lên trước, rồi đất giữa chúng dâng lên thành núi cao chừng h; trụ nằm lại thành
 *            mỏm đá trên sườn núi, một mỏm giữa đỉnh
 * Viền núi không tròn đều (seed: mỗi ngọn núi một dáng). Mặt đất (L.bumps, render/map/height3d.js) và khối vẽ
 * (magic/earth/look3d.js) cùng đọc hàm này nên người đứng đúng trên mặt núi. Chạy được bằng Node (test/earth.test.js). */
(function (root, factory) {
  const BK = root.BK || (root.BK = {});
  BK.EarthShape = factory();
  if (typeof module === 'object' && module.exports) module.exports = BK.EarthShape;
})(typeof self !== 'undefined' ? self : globalThis, function () {
  'use strict';
  const PILLAR_R = 1.1, // (đơn vị đảo) bán kính mặt đỉnh trụ (người đứng vừa)
    PILLAR_EDGE = 0.45, // vách trụ: từ đỉnh xuống sườn trong chừng này
    CRAGS = 6, // số trụ đá quanh tâm của 'mount'
    CRAG_R = 1.0;
  const clamp = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
  const sstep = (a, b, x) => {
    const t = clamp((x - a) / (b - a));
    return t * t * (3 - 2 * t);
  };
  const out3 = (t) => 1 - Math.pow(1 - clamp(t), 3); // (trồi nhanh rồi chậm lại)
  // viền gồ ghề: bán kính đổi theo hướng
  const rough = (b, a) => 1 + 0.1 * Math.sin(a * 5 + b.seed) + 0.06 * Math.sin(a * 9 + b.seed * 2.3);
  // gờ đá trên sườn (núi đá, không phải gò đất trơn): cao nhất giữa sườn, bằng 0 ở đỉnh và viền
  const ridge = (b, d, a, s) =>
    b.h * 0.16 * (0.5 + 0.5 * Math.sin(a * 7 + b.seed * 1.3)) * (0.5 + 0.5 * Math.sin(d * 2.1 + b.seed)) * 4 * s * (1 - s);
  function peak(b, d, a, k) {
    const s = d / (b.r * rough(b, a));
    if (s >= 1) return 0;
    const e = out3(k),
      body = 0.62 * b.h * Math.pow(1 - s, 1.35) + ridge(b, d, a, s),
      pillar = b.h * (1 - sstep(PILLAR_R, PILLAR_R + PILLAR_EDGE, d));
    return e * Math.max(body, pillar);
  }
  function mount(b, dx, dz, d, a, k) {
    const s = d / (b.r * rough(b, a));
    if (s >= 1) return 0;
    const kc = out3(k / 0.45),
      kb = out3((k - 0.35) / 0.65),
      body = b.h * Math.pow(1 - s * s, 1.3) + ridge(b, d, a, s);
    let crag = 0.45 * b.h * (1 - sstep(CRAG_R * 0.6, CRAG_R * 1.2, d)); // (mỏm giữa đỉnh)
    for (let i = 0; i < CRAGS; i++) {
      const ca = (i / CRAGS) * Math.PI * 2 + b.seed,
        cr = 0.5 * b.r,
        dd = Math.hypot(dx - Math.cos(ca) * cr, dz - Math.sin(ca) * cr),
        ch = b.h * (0.32 + 0.16 * Math.abs(Math.sin(b.seed * 3.1 + i * 1.7)));
      crag = Math.max(crag, ch * (1 - sstep(CRAG_R * 0.6, CRAG_R * 1.1, dd)));
    }
    return body * kb + crag * kc;
  }
  function at(b, dx, dz, k) {
    if (!(k > 0)) return 0;
    const d = Math.hypot(dx, dz);
    if (d >= b.r * 1.17) return 0;
    const a = Math.atan2(dz, dx);
    return b.kind === 'peak' ? peak(b, d, a, k) : mount(b, dx, dz, d, a, k);
  }
  // bán kính ngoài cùng có thể nhô (viền gồ ghề lớn nhất)
  const reach = (b) => b.r * 1.17;
  return { at, reach, PILLAR_R, CRAGS };
});
