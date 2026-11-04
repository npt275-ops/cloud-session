/* Bể Kính · render/build/roads.js · Mạng đường của sáu đảo
 * Mỗi đảo một kiểu đường riêng (giữ qua mọi thời, chỉ đổi mặt đường, đèn, cây và xe theo thời):
 *   plains   Lúa Vàng: vòng tròn giữa hai vòng nhà, bốn đường toả (trước, sau, hai bên trước)
 *   forest   Thông Xanh: vòng lượn sóng theo rừng, ba lối toả (trước, hai bên sau)
 *   mountain Đá Mây: vòng ngoài rộng, đường trước đi chữ chi lên dốc, ba lối toả
 *   tundra   Tuyết Trắng: vòng vuông bo góc, đại lộ trước sau thẳng tắp
 *   coast    Cửa Sóng: vòng bầu dục chạy dọc bờ, ba lối toả ra biển
 *   desert   Cát Hồng: vòng vuông góc sắc, bốn đại lộ thẳng chữ thập
 * Toạ độ theo trục làng (z dương là phía trước, ra biển trong; x dương bên phải), đơn vị như đảo.
 * net(key, edge) trả { loop: đường vòng khép kín cho xe chạy, spokes: các đường toả ra (tới mép đảo), all: mọi đoạn }.
 * edge(góc) là bán kính mép đảo theo hướng đó (từ place3d.landFor); không có thì coi mép ở 52.
 * Phần vẽ: draw(k, net, kiểu); dọn chỗ: segs(net) để công trình tránh đường (render/buildings3d.js). */
(function (root) {
  const BK = root.BK, K = BK.BuildKit, { Bc } = BK.Plains3D;
  const TAU = Math.PI * 2;
  const polar = (a, r) => [Math.sin(a) * r, Math.cos(a) * r];
  const loopOf = (rOf, n) => Array.from({ length: n || 72 }, (_, i) => { const a = (i / (n || 72)) * TAU; return polar(a, rOf(a)); });
  const spoke = (a, r0, edge, wob) => { const r1 = Math.max(r0 + 6, (edge ? edge(a) : 52) - 4), pts = []; for (let r = r0; r <= r1 + 0.01; r += 2) { const w = wob ? wob(r) : 0; pts.push([Math.sin(a) * r + Math.cos(a) * w, Math.cos(a) * r - Math.sin(a) * w]); } return pts; };
  const NETS = {
    plains: (edge) => ({ loop: loopOf(() => 24), spokes: [0, Math.PI, 0.6, -0.6].map((a) => spoke(a, a === Math.PI ? 15 : 12, edge)) }),
    forest: (edge) => ({ loop: loopOf((a) => 24 + 2.2 * Math.sin(3 * a + 0.7)), spokes: [0, 2.7, -2.7].map((a) => spoke(a, a ? 15 : 12, edge, (r) => Math.sin(r * 0.25) * 1.6)) }),
    mountain: (edge) => ({ loop: loopOf(() => 32), spokes: [spoke(0, 12, edge, (r) => ((Math.floor(r / 6) % 2) ? 2.6 : -2.6) * Math.min(1, (r - 12) / 6)), spoke(Math.PI, 15, edge), spoke(0.7, 12, edge), spoke(-0.7, 12, edge)] }),
    tundra: (edge) => ({ loop: loopOf((a) => { const c = Math.abs(Math.cos(a)), s = Math.abs(Math.sin(a)); return 23 / Math.pow(Math.pow(c, 4) + Math.pow(s, 4), 0.25); }, 96), spokes: [spoke(0, 12, edge), spoke(Math.PI, 15, edge), spoke(2.5, 16, edge), spoke(-2.5, 16, edge)] }),
    coast: (edge) => ({ loop: loopOf((a) => { const rx = 31, rz = 21; return 1 / Math.sqrt(Math.pow(Math.sin(a) / rx, 2) + Math.pow(Math.cos(a) / rz, 2)); }, 80), spokes: [0, 0.95, -0.95, Math.PI].map((a) => spoke(a, a === Math.PI ? 15 : 12, edge)) }),
    desert: (edge) => ({ loop: loopOf((a) => { const c = Math.abs(Math.cos(a)), s = Math.abs(Math.sin(a)); return 22 / Math.max(c, s); }, 96), spokes: [0, Math.PI / 2, Math.PI, -Math.PI / 2].map((a) => spoke(a, a === Math.PI ? 15 : 12, edge)) }),
  };
  function net(key, edge) { const N = (NETS[key] || NETS.plains)(edge); N.all = [[...N.loop, N.loop[0]], ...N.spokes]; return N; }
  // các đoạn thẳng của mạng đường: [[x0, z0, x1, z1], ...]
  function segs(N) { const out = []; for (const pl of N.all) for (let i = 0; i + 1 < pl.length; i++) out.push([pl[i][0], pl[i][1], pl[i + 1][0], pl[i + 1][1]]); return out; }
  // vẽ mạng đường: mỗi đoạn một tấm phẳng (dài hơn một chút để nối liền), vạch giữa nếu có
  function draw(k, N, st) {
    const w = st.w || 2.2, y = st.y || 0.06;
    for (const [x0, z0, x1, z1] of segs(N)) {
      const dx = x1 - x0, dz = z1 - z0, L = Math.hypot(dx, dz), a = Math.atan2(dx, dz);
      k.add(Bc(w, 0.05, L + w * 0.6, 0.01), st.color, (x0 + x1) / 2, y, (z0 + z1) / 2, { rot: [0, a, 0], ao: false });
      if (st.line) k.add(Bc(0.12, 0.05, L * 0.55, 0.01), st.line, (x0 + x1) / 2, y + 0.02, (z0 + z1) / 2, { rot: [0, a, 0], ao: false });
      if (st.glow) k.add(Bc(0.16, 0.05, L, 0.01), st.glow, (x0 + x1) / 2, y + 0.03, (z0 + z1) / 2, { rot: [0, a, 0], glow: true });
    }
  }
  // các điểm cách đều nhau dọc một đường (khép kín hay không), kèm hướng: [{ x, z, a (góc hướng đi), n: [nx, nz] (pháp tuyến) }]
  function along(pl, step, closed) {
    const pts = closed ? [...pl, pl[0]] : pl, out = []; let carry = 0;
    for (let i = 0; i + 1 < pts.length; i++) {
      const [x0, z0] = pts[i], [x1, z1] = pts[i + 1], L = Math.hypot(x1 - x0, z1 - z0); if (L < 1e-6) continue;
      const ux = (x1 - x0) / L, uz = (z1 - z0) / L;
      let d = carry; for (; d < L; d += step) out.push({ x: x0 + ux * d, z: z0 + uz * d, a: Math.atan2(ux, uz), n: [uz, -ux] });
      carry = d - L; // phần còn lại tới điểm kế tiếp, sang đoạn sau
    }
    return out;
  }
  BK.Roads3D = { NETS, net, segs, draw, along };
})(typeof self !== 'undefined' ? self : globalThis);
