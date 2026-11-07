/* Bể Kính · render/build/traffic3d.js · Xe chạy trên vòng đường và nhường người đi bộ
 * drive(đảo, thời, A, công trình, giây game): mỗi xe của lớp đường (render/build/vehicles.js fleet: A.loop, A.path) có quãng đường
 * đã đi của riêng nó; render/buildings3d.js gọi mỗi khung hình. setPeds(đảo, danh sách): vị trí người đang ở ngoài (toạ độ
 * đảo, game/village.js lấy từ render/village3d.js peds) để xe dừng nhường người đang ở trên lòng đường phía trước.
 * Cần: render/build/plains/town.js (ROAD_W). */
(function (root) {
  const BK = root.BK || (root.BK = {});
  const STEP = 0.05; // bước con (giây game)
  function create() {
    // xe chạy dọc vòng đường khép kín A.loop ([[x, z], ...] theo toạ độ của lớp đường): mỗi xe có quãng đường đã đi của riêng nó,
    // đầu xe quay theo hướng đoạn đường đang đi. Xe chạy dưới đất nhường người đi bộ: có người đang ở trên mặt đường ngay phía
    // trước (peds: toạ độ đảo, setPeds từ game/village.js) thì dừng chờ; toa bám theo đầu xe của nó; xe bay không phải dừng.
    const pedsOf = [];
    function setPeds(i, list) { pedsOf[i] = list; }
    function blockedAhead(isle, lv, p, x, z, hx, hz) {
      const list = pedsOf[isle]; if (!list || !list.length) return false;
      const c = Math.cos(p.g.rotation.y), s = Math.sin(p.g.rotation.y), X = p.g.position.x + x * c + z * s, Z = p.g.position.z - x * s + z * c, HX = hx * c + hz * s, HZ = -hx * s + hz * c;
      const lane = ((BK.Plains3D.TOWN && BK.Plains3D.TOWN.ROAD_W[lv]) || 2.6) / 2 + 0.15; // chỉ người đang ở trên mặt đường (không tính người trên vỉa hè)
      for (const q of list) { const dx = q.x - X, dz = q.z - Z, fwd = dx * HX + dz * HZ, lat = Math.abs(dx * HZ - dz * HX); if (fwd > 0.3 && fwd < 4.2 && lat < lane) return true; }
      return false;
    }
    function drive(isle, lv, A, p, ts) {
      if (!A.cum) { A.cum = [0]; for (let i = 0; i < A.loop.length; i++) { const a = A.loop[i], b = A.loop[(i + 1) % A.loop.length]; A.cum.push(A.cum[i] + Math.hypot(b[0] - a[0], b[1] - a[1])); } A.len = A.cum[A.cum.length - 1]; }
      const st = p.drive || (p.drive = { at: ts, d: {} }), total = Math.min(0.5, Math.max(0, ts - st.at)); st.at = ts; // ts: giờ game (giây)
      const steps = Math.max(1, Math.ceil(total / STEP)), dt = total / steps; // bước con: ở 4× xe vẫn kịp thấy người và dừng
      const place = (sub, d, y) => {
        d %= A.len; if (d < 0) d += A.len;
        let i = 0; while (i < A.loop.length - 1 && A.cum[i + 1] < d) i++;
        const a = A.loop[i], b = A.loop[(i + 1) % A.loop.length], u = (d - A.cum[i]) / Math.max(1e-6, A.cum[i + 1] - A.cum[i]);
        const x = a[0] + (b[0] - a[0]) * u, z = a[1] + (b[1] - a[1]) * u, hx = b[0] - a[0], hz = b[1] - a[1];
        sub.position.set(x, y, z); sub.rotation.y = Math.atan2(hx, hz); return [x, z, hx / (Math.hypot(hx, hz) || 1), hz / (Math.hypot(hx, hz) || 1)];
      };
      for (let k = 0; k < steps; k++) for (const [n, speed, off, y, head, flying] of A.path) {
        const sub = p.subs[n]; if (!sub) continue;
        if (head) { const H = A.path.find((x) => x[0] === head); st.d[n] = (st.d[head] != null ? st.d[head] : 0) + (off - H[2]); place(sub, st.d[n], y); continue; } // toa: bám đầu xe
        if (st.d[n] == null) st.d[n] = ts * speed + off;
        const [x, z, hx, hz] = place(sub, st.d[n], y);
        // giữ khoảng cách với xe (hay toa cuối của đoàn) phía trước: xe trước dừng nhường người thì xe sau cũng dừng, không đâm vào nhau
        const tooClose = !flying && A.path.some(([m, , , , , fl]) => m !== n && !fl && st.d[m] != null && (((st.d[m] - st.d[n]) % A.len) + A.len) % A.len > 0.1 && (((st.d[m] - st.d[n]) % A.len) + A.len) % A.len < 3.6);
        if (flying || (!tooClose && !blockedAhead(isle, lv, p, x, z, hx, hz))) st.d[n] += speed * dt; // có người trên đường phía trước: dừng chờ
      }
    }
    return { drive, setPeds };
  }
  BK.Traffic3D = { create };
})(typeof self !== 'undefined' ? self : globalThis);
