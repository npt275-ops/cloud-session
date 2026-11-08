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
  const Y = 0.13; // độ cao mặt đường (render/build/lamps.js, neon.js, plains/town.js đặt đồ trên mặt đường theo mốc này)
  const polar = (a, r) => [Math.sin(a) * r, Math.cos(a) * r];
  const loopOf = (rOf, n) => Array.from({ length: n || 72 }, (_, i) => { const a = (i / (n || 72)) * TAU; return polar(a, rOf(a)); });
  const spoke = (a, r0, edge, wob) => { const r1 = Math.max(r0 + 6, (edge ? edge(a) : 52) - 4), pts = []; for (let r = r0; r <= r1 + 0.01; r += 2) { const w = wob ? wob(r) : 0; pts.push([Math.sin(a) * r + Math.cos(a) * w, Math.cos(a) * r - Math.sin(a) * w]); } return pts; };
  const BACK = 20; // đường toả ra phía sau bắt đầu từ đây (sau lưng nhà chính, nhà chính các thời sau to tới bán kính ~18)
  const NETS = {
    plains: (edge) => ({ loop: loopOf(() => 24), spokes: [0, Math.PI, 0.6, -0.6].map((a) => spoke(a, a === Math.PI ? BACK : 12, edge)) }),
    forest: (edge) => ({ loop: loopOf((a) => 24 + 2.2 * Math.sin(3 * a + 0.7)), spokes: [0, 2.7, -2.7].map((a) => spoke(a, a ? BACK : 12, edge, (r) => Math.sin(r * 0.25) * 1.6)) }),
    mountain: (edge) => ({ loop: loopOf(() => 32), spokes: [spoke(0, 12, edge, (r) => ((Math.floor(r / 6) % 2) ? 2.6 : -2.6) * Math.min(1, (r - 12) / 6)), spoke(Math.PI, BACK, edge), spoke(0.7, 12, edge), spoke(-0.7, 12, edge)] }),
    tundra: (edge) => ({ loop: loopOf((a) => { const c = Math.abs(Math.cos(a)), s = Math.abs(Math.sin(a)); return 23 / Math.pow(Math.pow(c, 4) + Math.pow(s, 4), 0.25); }, 96), spokes: [spoke(0, 12, edge), spoke(Math.PI, BACK, edge), spoke(2.5, BACK + 2, edge), spoke(-2.5, BACK + 2, edge)] }),
    coast: (edge) => ({ loop: loopOf((a) => { const rx = 31, rz = 21; return 1 / Math.sqrt(Math.pow(Math.sin(a) / rx, 2) + Math.pow(Math.cos(a) / rz, 2)); }, 80), spokes: [0, 0.95, -0.95, Math.PI].map((a) => spoke(a, a === Math.PI ? BACK : 12, edge)) }),
    desert: (edge) => ({ loop: loopOf((a) => { const c = Math.abs(Math.cos(a)), s = Math.abs(Math.sin(a)); return 22 / Math.max(c, s); }, 96), spokes: [0, Math.PI / 2, Math.PI, -Math.PI / 2].map((a) => spoke(a, a === Math.PI ? BACK : 12, edge)) }),
  };
  function net(key, edge) { const N = (NETS[key] || NETS.plains)(edge); N.all = [[...N.loop, N.loop[0]], ...N.spokes]; return N; }
  // các đoạn thẳng của mạng đường: [[x0, z0, x1, z1], ...]
  function segs(N) { const out = []; for (const pl of N.all) for (let i = 0; i + 1 < pl.length; i++) out.push([pl[i][0], pl[i][1], pl[i + 1][0], pl[i + 1][1]]); return out; }
  // vẽ mạng đường: mỗi đoạn một tấm phẳng (dài hơn một chút để nối liền), vạch giữa nếu có
  function draw(k, N, st) {
    const w = st.w || 2.2, y = st.y || Y; // mặt đường cao hơn mặt sông, hồ (0,12): đường đi qua sông như cầu phẳng
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
  // mạng đường của một đảo theo toạ độ của đảo (như lớp đường đặt ở tâm, quay mặt ra biển trong): tính ngay khi dựng đất
  // (render/map/terrain3d.js) để núi, hồ, đá, cây không mọc chắn đường; render/buildings3d.js dùng lại cho công trình.
  // HALF: nửa bề rộng chỗ phải để trống: nửa mặt đường rộng nhất (3,6 / 2) cộng vỉa hè (WALK) — nhà, núi, cây không lấn vỉa hè.
  const WALK = 0.6, HALF = 1.8 + WALK;
  // isleNet: vòng đường và các đường toả theo toạ độ đảo (người đi dạo dọc phố, render/village3d.js); isleSegs: các đoạn thẳng
  function isleNet(L, key) {
    const fx = L.inw.x, fz = L.inw.z, fl = Math.hypot(fx, fz) || 1, th = Math.atan2(fx / fl, fz / fl), c = Math.cos(th), sn = Math.sin(th);
    const rot = ([x, z]) => [x * c + z * sn, -x * sn + z * c];
    const edge = (a) => { const [X, Z] = rot([Math.sin(a), Math.cos(a)]); return L.rOf(Math.atan2(Z, X)); };
    const N = net(key || L.ter, edge);
    return { loop: N.loop.map(rot), spokes: N.spokes.map((sp) => sp.map(rot)) };
  }
  function isleSegs(L, key) { const N = isleNet(L, key); return segs({ all: [[...N.loop, N.loop[0]], ...N.spokes] }); }
  const segDist = (x, z, [x0, z0, x1, z1]) => { const dx = x1 - x0, dz = z1 - z0, L2 = dx * dx + dz * dz || 1, t = Math.max(0, Math.min(1, ((x - x0) * dx + (z - z0) * dz) / L2)); return Math.hypot(x - x0 - dx * t, z - z0 - dz * t); };
  // một vòng tròn (x, z, r) có lấn vào đường không
  const hits = (segList, x, z, r, half) => !!segList && segList.some((S) => segDist(x, z, S) < (r || 0) + (half || HALF));
  // chỗ qua đường trên vòng đường (chỉ số điểm của vòng): hai bên mỗi ngã giao với đường toả, và rải đều dọc vòng (cứ khoảng
  // CROSS_EVERY điểm) — người đi bộ chỉ sang đường ở đây (render/village3d.js), xe dừng nhường người (render/buildings3d.js)
  const CROSS_EVERY = 9;
  function crossIdx(N) {
    const n = N.loop.length, out = new Set();
    for (const sp of N.spokes) { let bj = -1, bd = 1e18; N.loop.forEach(([x, z], j) => { for (const [a, b] of sp) { const d = (a - x) ** 2 + (b - z) ** 2; if (d < bd) { bd = d; bj = j; } } }); if (bd < 3.2 * 3.2) { out.add((bj + 2) % n); out.add((bj - 2 + n) % n); } }
    for (let j = 0; j < n; j += CROSS_EVERY) if (![...out].some((k) => Math.min(Math.abs(k - j), n - Math.abs(k - j)) < 4)) out.add(j);
    return [...out].sort((a, b) => a - b);
  }
  // vỉa hè hai bên mọi đoạn đường (bỏ chỗ chạm vào đường khác, ở ngã giao) và vạch qua đường ở các chỗ qua đường
  // st: { w (bề rộng mặt đường), walk (màu vỉa hè), cross (màu vạch), glow (vạch phát sáng) }
  function dressWalks(k, N, st) {
    const w = st.w || 2.4, all = segs(N);
    if (st.walk) {
      N.all.forEach((pl, pi) => {
        const others = segs({ all: N.all.filter((_, j) => j !== pi) });
        for (let i = 0; i + 1 < pl.length; i++) {
          const [x0, z0] = pl[i], [x1, z1] = pl[i + 1], dx = x1 - x0, dz = z1 - z0, L = Math.hypot(dx, dz); if (L < 1e-6) continue;
          const nx = dz / L, nz = -dx / L, a = Math.atan2(dx, dz);
          for (const s of [-1, 1]) { const cx = (x0 + x1) / 2 + nx * s * (w / 2 + WALK / 2), cz = (z0 + z1) / 2 + nz * s * (w / 2 + WALK / 2);
              if (others.some((S) => segDist(cx, cz, S) < w / 2 + WALK * 0.5)) continue; k.add(Bc(WALK, 0.07, L + 0.15, 0.01), st.walk, cx, Y + 0.02, cz,
              { rot: [0, a, 0], ao: false }); }
        }
      });
    }
    if (st.cross) {
      const n = N.loop.length;
      for (const j of crossIdx(N)) {
        const [x, z] = N.loop[j], [x2, z2] = N.loop[(j + 1) % n], dx = x2 - x, dz = z2 - z, L = Math.hypot(dx, dz) || 1, nx = dz / L, nz = -dx / L, a = Math.atan2(dx, dz);
        const bars = Math.max(3, Math.floor(w / 0.5));
        for (let b = 0; b < bars; b++) { const o = -w / 2 + (b + 0.5) * (w / bars); k.add(Bc(w / bars * 0.55, 0.03, 1.5, 0.005), st.cross, x + nx * o, Y + 0.04, z + nz * o, { rot: [0, a, 0], ao: false, glow: !!st.glow }); }
      }
    }
    return all;
  }
  BK.Roads3D = { NETS, net, segs, draw, along, isleNet, isleSegs, segDist, hits, crossIdx, dressWalks, HALF, WALK, Y };
})(typeof self !== 'undefined' ? self : globalThis);
