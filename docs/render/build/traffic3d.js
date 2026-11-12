/* Bể Kính · render/build/traffic3d.js · Xe bay lượn vòng trên cao dọc vòng đường
 * drive(đảo, thời, A, công trình, giây game, ít xe): mỗi xe bay của lớp đường (render/build/vehicles.js fleet: A.loop, A.path) có
 * quãng đường đã bay của riêng nó, bay dọc vòng đường khép kín ở độ cao riêng, mũi xe quay theo hướng bay; render/buildings3d.js
 * gọi mỗi khung hình. Không còn xe chạy dưới đất (design/ke-hoach-buoc-27.md). Cần: render/build/vehicles.js. */
(function (root) {
  const BK = root.BK || (root.BK = {});
  function create() {
    // few: đảo đang suy tàn (logic/prosperity.js decline): trời vắng, chỉ một phần ba số xe còn bay, số còn lại ẩn
    function drive(isle, lv, A, p, ts, few) {
      if (!A.cum) {
        A.cum = [0];
        for (let i = 0; i < A.loop.length; i++) {
          const a = A.loop[i],
            b = A.loop[(i + 1) % A.loop.length];
          A.cum.push(A.cum[i] + Math.hypot(b[0] - a[0], b[1] - a[1]));
        }
        A.len = A.cum[A.cum.length - 1];
      }
      A.path.forEach(([n, speed, off, y], j) => {
        const sub = p.subs[n];
        if (!sub) return;
        sub.visible = !few || j % 3 === 0;
        let d = (ts * speed + off) % A.len;
        if (d < 0) d += A.len;
        let i = 0;
        while (i < A.loop.length - 1 && A.cum[i + 1] < d) i++;
        const a = A.loop[i],
          b = A.loop[(i + 1) % A.loop.length],
          u = (d - A.cum[i]) / Math.max(1e-6, A.cum[i + 1] - A.cum[i]),
          x = a[0] + (b[0] - a[0]) * u,
          z = a[1] + (b[1] - a[1]) * u;
        sub.position.set(x, y + (p.liftAt ? p.liftAt(x, z) : 0), z);
        sub.rotation.y = Math.atan2(b[0] - a[0], b[1] - a[1]);
      });
    }
    return { drive };
  }
  BK.Traffic3D = { create };
})(typeof self !== 'undefined' ? self : globalThis);
