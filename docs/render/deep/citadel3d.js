/* Bể Kính · render/deep/citadel3d.js · Thành Vỏ Ốc Xà Cừ: phế tích trong rãnh dưới Thông Xanh (design/ke-hoach-buoc-22.md)
 * Thay Thành Vòng Nước. Thiết kế riêng của Bể Kính: một nền văn minh biết uốn đá như vỏ ốc, đã chìm. Công trình phần lớn là vỏ
 * ốc, từ nhỏ tới lớn, bốn kiểu (hàm dựng ở đầu tệp, dùng lại được):
 *   - ốc xoắn phẳng (nautilus): vỏ chính cao 58 giữa rãnh, mặt xoắn quay về phía vách kính, miệng ôm lõi sáng; bốn sảnh vỏ ốc
 *     cao 14–18; nhà vỏ ốc nhỏ cao 5–9. Khoang ngăn bằng đường sáng.
 *   - ốc vặn tháp (xoắn nhọn lên cao): tháp cao 22–46, đường khớp sáng chạy theo vòng xoắn, đỉnh sáng.
 *   - vỏ sò quạt (gân toả, dựng đứng): đền sò lớn giữa vỏ chính và quảng trường, hai sò nhỏ cạnh lối vào quảng trường.
 *   - ốc tiền (thuôn, khe sáng): nhà nhỏ.
 * Thêm: ba vòng đá có hạt sáng quay chậm quanh vỏ chính, năm đảo đá lơ lửng nhấp nhô (động: D.anims); tháp pha lê xoắn;
 * quảng trường hoa hải quỳ quanh hồ sáng, nơi hai đường từ cửa hầm gặp nhau; cổng xương sườn dọc hai đường đó; nhà vòm bong
 * bóng, tháp nấm, vòm vỡ.
 * Cần: render/deep/terrain3d.js, render/deep/kit3d.js. Dựng trước hai phế tích kia (render/deep3d.js). */
(function (root) {
  'use strict';
  const BK = root.BK || (root.BK = {});

  /* ---------- Hình vỏ ốc (toạ độ riêng của một công trình: x, z ngang, y lên; gốc ở chân) ---------- */
  // ống cong có bán kính đổi dần theo một dãy điểm 3D: pts [{ x, y, z, r }]. Lưới không chỉ mục (put cần thế), mặt quay ra ngoài.
  function tube(THREE, pts, sides) {
    const V = (x, y, z) => new THREE.Vector3(x, y, z),
      rings = [];
    pts.forEach((p, i) => {
      const a = pts[Math.max(0, i - 1)],
        b = pts[Math.min(pts.length - 1, i + 1)],
        t = V(b.x - a.x, b.y - a.y, b.z - a.z).normalize(),
        ref = Math.abs(t.y) < 0.9 ? V(0, 1, 0) : V(1, 0, 0),
        n = V().crossVectors(t, ref).normalize(),
        m = V().crossVectors(t, n);
      const ring = [];
      for (let k = 0; k < sides; k++) {
        const w = (k / sides) * Math.PI * 2,
          c = Math.cos(w) * p.r,
          s = Math.sin(w) * p.r;
        ring.push([p.x + n.x * c + m.x * s, p.y + n.y * c + m.y * s, p.z + n.z * c + m.z * s]);
      }
      rings.push(ring);
    });
    // chiều mặt: tam giác đầu tiên phải quay ra xa trục ống
    const A = V(...rings[0][0]),
      B = V(...rings[1][0]),
      C = V(...rings[1][1]),
      out = A.clone().sub(V(pts[0].x, pts[0].y, pts[0].z)),
      flip = V().crossVectors(B.clone().sub(A), C.clone().sub(A)).dot(out) < 0;
    const pos = [];
    for (let i = 0; i < rings.length - 1; i++)
      for (let k = 0; k < sides; k++) {
        const k2 = (k + 1) % sides,
          a = rings[i][k],
          b = rings[i + 1][k],
          c = rings[i + 1][k2],
          e = rings[i][k2];
        if (flip) pos.push(...a, ...c, ...b, ...a, ...e, ...c);
        else pos.push(...a, ...b, ...c, ...a, ...c, ...e);
      }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    return g;
  }
  // ốc xoắn phẳng: xoắn lôgarit r = a·e^(kθ) hai vòng trong mặt phẳng (z, y), ống dày 0,55 r (vòng sau ôm sát vòng trước);
  // miệng vỏ nằm dưới, mở theo +z. Cao H, đáy lún 0,03 H. Trả điểm và tâm xoắn.
  function nautilusPts(H, n) {
    const K = 0.2,
      T0 = 0.7,
      T1 = 4 * Math.PI + 0.25,
      off = -1.4 - T1; // (góc vị trí của miệng vỏ: −80°)
    let pts = [];
    for (let i = 0; i <= n; i++) {
      const th = T0 + ((T1 - T0) * i) / n,
        r = 2.2 * Math.exp(K * th),
        a = th + off;
      pts.push({ x: 0, y: Math.sin(a) * r, z: Math.cos(a) * r, r: 0.55 * r });
    }
    const minY = Math.min(...pts.map((p) => p.y - p.r)),
      maxY = Math.max(...pts.map((p) => p.y + p.r)),
      sc = H / (maxY - minY),
      sink = 0.03 * H;
    pts = pts.map((p) => ({ x: 0, y: (p.y - minY) * sc - sink, z: p.z * sc, r: p.r * sc }));
    return { pts, cy: -minY * sc - sink };
  }
  // ốc vặn tháp: vòng xoắn đi lên, bán kính và độ dày ống nhỏ dần tới đỉnh nhọn
  function turretPts(H, n, turns) {
    const pts = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n,
        a = t * turns * Math.PI * 2,
        R = H * 0.16 * (1 - t) + 0.25,
        r = H * 0.13 * (1 - t) + 0.22;
      pts.push({ x: Math.cos(a) * R, y: r * 0.6 + (H - r) * Math.pow(t, 0.9), z: Math.sin(a) * R, r });
    }
    return pts;
  }

  function build(D) {
    const { THREE, SITES, frame, groups, put, rnd, hAt, BOX, CYL, CONE, BALL, GEM, DOME, RINGG, ARCH, FRU, TAU, ROAD_U } = D;
    const { TUNNELS, TUN_RC, matOf, deep, depthTint, anims } = D;
    const S = SITES[0],
      F = frame(S),
      st = groups.stone,
      gl = groups.glow,
      wd = groups.weed;
    D.reseed(1000);
    const PEARL = ['#efe6f2', '#dccfe8', '#f2e8da', '#d2e6ec'],
      SEAM = '#7ff6ff',
      VIOLET = '#c9a6ff';
    const floorY = hAt(S.x, S.z) - 0.3; // (đáy rãnh phẳng: một cao độ cho cả phế tích)
    const CU = -30; // tâm vỏ ốc chính theo trục u (giữa rãnh là 0, vách kính phía +u)
    // điểm (lx, lz) trong toạ độ riêng của một công trình đặt ở (u, v), quay ry: ra (u, v) của phế tích
    const off = (u, v, ry, lx, lz) => [u + lx * Math.cos(ry) + lz * Math.sin(ry), v - lx * Math.sin(ry) + lz * Math.cos(ry)];

    /* ---------- Đường từ hai cửa hầm (tính trước để chừa lối) ---------- */
    // cửa hầm bên +v: đầu hầm 0 (TUNNELS[0].a); bên −v: đầu cuối hầm 2 (TUNNELS[2].b). Đường tới (ROAD_U, ±22).
    const local = (x, z) => {
      const dx = x - S.x,
        dz = z - S.z;
      return { u: dx * S.ux + dz * S.uz, v: -dx * S.uz + dz * S.ux };
    };
    const roads = [
      [TUNNELS[0].a, 1],
      [TUNNELS[2].b, -1],
    ].map(([th, side]) => {
      const a = local(Math.cos(th) * TUN_RC, Math.sin(th) * TUN_RC);
      return { a, b: { u: ROAD_U, v: side * 22 }, side };
    });
    const segDist = (u, v, R) => {
      const dx = R.b.u - R.a.u,
        dv = R.b.v - R.a.v,
        t = Math.max(0, Math.min(1, ((u - R.a.u) * dx + (v - R.a.v) * dv) / (dx * dx + dv * dv)));
      return Math.hypot(u - (R.a.u + dx * t), v - (R.a.v + dv * t));
    };
    const occ = [
      [CU, 0, 34],
      [ROAD_U, 0, 24],
    ];
    const free = (u, v, r) =>
      Math.hypot(u / S.A, v / S.B) < 0.9 &&
      roads.every((R) => segDist(u, v, R) > r + 5) &&
      occ.every(([a, b, q]) => Math.hypot(u - a, v - b) > r + q);

    /* ---------- Quảng trường hoa hải quỳ, hồ sáng ---------- */
    {
      const u0 = ROAD_U;
      F.add(st, CYL(28), '#cfc6dc', u0, 0, 0, 21, 0.7, 21);
      F.add(st, CYL(24), '#b9b0cc', u0, 0.7, 0, 10, 0.9, 10);
      F.add(gl, CYL(24), '#58e6ff', u0, 1.4, 0, 9, 0.25, 9);
      // cánh đá cong quanh quảng trường (chừa hai chỗ đường vào ở hai phía v)
      for (let i = 0; i < 18; i++) {
        const a = (i / 18) * TAU;
        if (Math.abs(Math.sin(a)) > 0.9) continue;
        const h = 9 + (i % 3) * 3;
        F.add(st, BOX(), PEARL[i % 4], u0 + Math.cos(a) * 18, 0, Math.sin(a) * 18, 3.2, h, 0.6, -a, 0, -0.38);
        F.add(gl, BOX(), i % 2 ? SEAM : VIOLET, u0 + Math.cos(a) * 18.9, h * 0.85, Math.sin(a) * 18.9, 1.2, 0.3, 0.7, -a, 0, -0.38);
      }
      // ngọc sáng lơ lửng trên hồ (động)
      anims.push(spinner(u0, 9, 0, 0.9));
    }
    // một khối nhỏ quay, nhấp nhô ở (u, y, v): ngọc trên hồ
    function spinner(u, y, v, s) {
      const G = { pos: [], col: [], noTint: true },
        p = F.at(u, v),
        y0 = floorY + y;
      put(G, GEM(), '#b8fbff', 0, -1.6 * s, 0, 1.6 * s, 2 * s, 1.6 * s);
      put(G, RINGG(), VIOLET, 0, 0.4, 0, 3.2 * s, 3.2 * s, 3.2 * s, 0, Math.PI / 2);
      const m = meshAt(G, new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false }), p.x, y0, p.z);
      return (ts) => {
        m.rotation.y = ts * 0.4;
        m.position.y = y0 + Math.sin(ts * 0.7) * 0.8;
      };
    }
    // lưới động riêng (không gộp): toạ độ trong G tính quanh gốc, đặt ở (x, y, z)
    function meshAt(G, mat, x, y, z) {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(G.pos, 3));
      g.setAttribute('color', new THREE.Float32BufferAttribute(G.col, 3));
      g.computeVertexNormals();
      const m = new THREE.Mesh(g, mat);
      m.position.set(x, y, z);
      m.raycast = () => {};
      deep.add(m);
      return m;
    }

    /* ---------- Cổng xương sườn dọc hai đường từ cửa hầm ---------- */
    for (const R of roads) {
      const L = Math.hypot(R.b.u - R.a.u, R.b.v - R.a.v),
        ry = Math.atan2(R.b.u - R.a.u, R.b.v - R.a.v); // (cổng vuông góc với đường)
      for (let t = 0.22; t < 0.9; t += 7 / L) {
        const u = R.a.u + (R.b.u - R.a.u) * t,
          v = R.a.v + (R.b.v - R.a.v) * t,
          s = 7.5 - t * 2;
        F.add(st, ARCH(), PEARL[Math.round(t * 20) % 4], u, 0, v, s, s * 1.35, 5, ry);
        F.add(gl, ARCH(), SEAM, u, 0.2, v, s * 0.86, s * 1.18, 2, ry);
      }
    }

    /* ---------- Bốn kiểu công trình vỏ ốc ---------- */
    // ốc xoắn phẳng cao H ở (u, v), quay ry (ry = 0: mặt xoắn nhìn về +u); dẹt 0,78 theo bề dày. Khoang màu xà cừ thay nhau,
    // đường sáng ngăn khoang; miệng có viền tím và lõi sáng; vỏ lớn có gờ sáng dọc lưng. Trả tâm xoắn (u, y, v).
    function nautilus(u, v, H, ry) {
      const big = H > 30,
        N = big ? 150 : H > 12 ? 90 : 56,
        sides = big ? 14 : 10,
        { pts, cy } = nautilusPts(H, N),
        STEP = Math.max(2, Math.round(N * 0.034)),
        shade = rnd() * 4;
      const add = (G, part, color, grow, sd) =>
        F.add(
          G,
          tube(
            THREE,
            part.map((p) => ({ ...p, r: p.r * grow })),
            sd || sides,
          ),
          color,
          u,
          0,
          v,
          0.78,
          1,
          1,
          ry,
        );
      for (let i = 0, seg = 0; i < N; i += STEP, seg++) {
        const j = Math.min(N, i + STEP);
        add(st, pts.slice(i, j + 1), PEARL[Math.floor(seg + shade) % 4], 1);
        if (j < N && (big || seg % 2)) add(gl, [pts[j - 1], pts[j]], SEAM, 1.035);
      }
      const e = pts[N],
        p = pts[N - 2],
        tl = Math.hypot(e.z - p.z, e.y - p.y);
      add(gl, [p, e], VIOLET, 1.06, sides + 2);
      const [cu, cv] = off(u, v, ry, 0, e.z - ((e.z - p.z) / tl) * e.r * 1.1);
      F.add(gl, BALL(), '#9ff8ff', cu, e.y - ((e.y - p.y) / tl) * e.r * 1.1, cv, e.r * 0.62, e.r * 0.7, e.r * 0.82, ry);
      if (big) {
        const ridge = pts.filter((_, i) => i % 2 === 0).map((q) => ({ ...q, r: 0.3 + q.r * 0.08 }));
        F.add(gl, tube(THREE, ridge, 6), VIOLET, u, 0, v, 1, 1, 1, ry);
        for (let k = 0; k < 9; k++) {
          const [gu, gv] = off(u, v, ry, (rnd() - 0.5) * 14, e.z + 4 + rnd() * 14);
          F.add(gl, GEM(), k % 2 ? SEAM : VIOLET, gu, e.y - e.r * 0.6 + rnd() * e.r * 1.6, gv, 0.35, 0.8, 0.35, rnd() * 3);
        }
      }
      return { u, y: cy, v };
    }
    // ốc vặn tháp cao H ở (u, v): vòng xoắn màu xà cừ, đường khớp sáng theo vòng xoắn, miệng sáng ở chân, ngọc sáng ở đỉnh
    function turret(u, v, H, ry) {
      const n = H > 30 ? 150 : 110,
        pts = turretPts(H, n, 5.5),
        shade = rnd() * 4,
        STEP = Math.round(n / 22);
      for (let i = 0, seg = 0; i < n; i += STEP, seg++)
        F.add(st, tube(THREE, pts.slice(i, Math.min(n, i + STEP) + 1), 10), PEARL[Math.floor(seg + shade) % 4], u, 0, v, 1, 1, 1, ry);
      // đường khớp: chạy ở mép dưới phía ngoài của ống, chỗ vòng xoắn đè lên vòng dưới
      const suture = pts
        .filter((_, i) => i % 2 === 0)
        .map((p) => {
          const R = Math.hypot(p.x, p.z) || 1,
            k = (R + p.r * 0.8) / R;
          return { x: p.x * k, y: p.y - p.r * 0.45, z: p.z * k, r: 0.12 + H * 0.004 };
        });
      F.add(gl, tube(THREE, suture, 5), SEAM, u, 0, v, 1, 1, 1, ry);
      const [bu, bv] = off(u, v, ry, pts[0].x * 1.4, pts[0].z * 1.4);
      F.add(gl, BALL(), VIOLET, bu, pts[0].r * 0.7, bv, pts[0].r * 0.55, pts[0].r * 0.6, pts[0].r * 0.55);
      F.add(gl, GEM(), SEAM, u, H - 0.2, v, 0.6 + H * 0.015, 1.4 + H * 0.03, 0.6 + H * 0.015);
    }
    // vỏ sò quạt cao H ở (u, v), dựng đứng, mặt quạt nhìn theo hướng ry (ry = π/2: nhìn về +u); gân toả từ bản lề, rãnh sáng
    // giữa các gân, hai tai bản lề, bệ đá
    function scallop(u, v, H, ry) {
      const ribs = 13,
        hinge = H * 0.08;
      F.add(st, BOX(), '#a59cb8', u, 0, v, H * 0.5, hinge, H * 0.22, ry);
      for (let i = 0; i < ribs; i++) {
        const phi = 0.2 + (i / (ribs - 1)) * (Math.PI - 0.4),
          rz = phi - Math.PI / 2,
          w = H * 0.045;
        F.add(st, FRU(4, 2.8), PEARL[i % 4], u, hinge, v, w, H * (0.92 - Math.abs(i - 6) * 0.012), w * 0.55, ry, 0, rz);
        if (i < ribs - 1) {
          const ph2 = phi + (Math.PI - 0.4) / (ribs - 1) / 2,
            [gu, gv] = off(u, v, ry, Math.cos(ph2) * H * 0.55, 0.15);
          F.add(gl, BOX(), i % 2 ? SEAM : VIOLET, gu, hinge + Math.sin(ph2) * H * 0.55, gv, 0.25, H * 0.42, 0.2, ry, 0, ph2 - Math.PI / 2);
        }
      }
      for (const q of [-1, 1]) {
        const [eu, ev] = off(u, v, ry, q * H * 0.13, 0);
        F.add(st, BOX(), PEARL[1], eu, hinge * 0.6, ev, H * 0.14, H * 0.12, H * 0.06, ry, 0, q * 0.3);
      }
      F.add(gl, GEM(), '#9ff8ff', u, hinge + H * 0.18, v, 0.8 + H * 0.03, 1.2 + H * 0.05, 0.8 + H * 0.03, ry);
    }
    // ốc tiền: nhà nhỏ thuôn dài nửa vùi, đốm xà cừ trên lưng, khe sáng dọc một bên, cửa tối ở đầu
    function cowrie(u, v, r, ry) {
      F.add(st, BALL(), PEARL[Math.floor(rnd() * 4)], u, r * 0.35, v, r * 1.7, r * 0.95, r * 1.1, ry);
      for (let k = 0; k < 5; k++) {
        const [du, dv] = off(u, v, ry, (rnd() - 0.5) * r * 1.8, (rnd() - 0.5) * r * 0.8);
        F.add(st, BALL(), '#b9a4f0', du, r * 1.22, dv, r * 0.16, r * 0.08, r * 0.16);
      }
      const [su, sv] = off(u, v, ry, 0, r * 1.05);
      F.add(gl, BOX(), SEAM, su, r * 0.2, sv, r * 2.6, r * 0.18, 0.2, ry);
      const [du, dv] = off(u, v, ry, r * 1.62, 0);
      F.add(st, BALL(), '#1e1a2a', du, r * 0.45, dv, 0.25, r * 0.38, r * 0.3, ry);
    }

    /* ---------- Vỏ ốc chính, sảnh vỏ ốc, tháp ốc vặn, đền sò ---------- */
    const shellC = nautilus(CU, 0, 58, 0); // (tâm xoắn: tâm quay của ba vòng đá, phần động bên dưới)
    // sảnh vỏ ốc cỡ vừa (quay mặt xoắn về phía giữa rãnh), tháp ốc vặn, đền sò: [u, v, cao, hướng]
    const HALLS = [
      [-72, 30, 18, 0.7],
      [-70, -34, 16, -0.6],
      [58, 44, 14, Math.PI - 0.5],
      [58, -44, 15, Math.PI + 0.4],
      [-46, 50, 12, 0.2],
    ];
    const TURRETS = [
      [-4, 48, 40],
      [-10, -50, 46],
      [-84, 4, 34],
      [70, 18, 24],
      [72, -16, 22],
      [-50, -54, 28],
    ];
    for (const [u, v, H, ry] of HALLS)
      if (free(u, v, H * 0.45)) {
        nautilus(u, v, H, ry);
        occ.push([u, v, H * 0.5]);
      }
    for (const [u, v, H] of TURRETS)
      if (free(u, v, H * 0.17)) {
        turret(u, v, H, rnd() * TAU);
        occ.push([u, v, H * 0.2 + 2]);
      }
    scallop(4, 0, 24, Math.PI / 2); // đền sò lớn giữa vỏ chính và quảng trường
    occ.push([4, 0, 13]);
    for (const q of [-1, 1])
      if (free(46, q * 30, 4)) {
        scallop(46, q * 30, 10, Math.PI / 2 + q * 0.5);
        occ.push([46, q * 30, 6]);
      }

    /* ---------- Tháp pha lê xoắn ---------- */
    const SPIRES = [
      [-74, 50, 62],
      [-86, -24, 54],
      [24, 52, 44],
      [26, -52, 50],
    ];
    for (const [u, v, H] of SPIRES) {
      if (!free(u, v, 3)) continue;
      const n = 12,
        tw = 0.28 * (rnd() < 0.5 ? 1 : -1);
      F.add(st, CYL(10), '#9c94b0', u, 0, v, 5.2, 1.4, 5.2);
      for (let i = 0; i < n; i++) {
        const w = 3.4 * (1 - (i / n) * 0.75),
          col = i % 2 ? '#8fd8e8' : '#b9a4f0';
        F.add(st, FRU(5, 0.85), col, u, 1.4 + (i * H) / n, v, w, H / n + 0.05, w, i * tw);
        if (i % 3 === 2) F.add(gl, CYL(10), i % 2 ? SEAM : VIOLET, u, 1.4 + ((i + 1) * H) / n - 0.4, v, w * 0.92, 0.5, w * 0.92);
      }
      F.add(gl, GEM(), SEAM, u, 1.4 + H, v, 1.3, 3.4, 1.3);
      occ.push([u, v, 6]);
    }

    /* ---------- Nhà nhỏ: vỏ ốc nhỏ, ốc tiền, vòm bong bóng, tháp nấm, vòm vỡ ---------- */
    let houses = 0;
    for (let i = 0; i < 600 && houses < 54; i++) {
      const a = rnd() * TAU,
        k = 0.35 + rnd() * 0.55,
        u = Math.cos(a) * S.A * k,
        v = Math.sin(a) * S.B * k,
        r = 2.4 + rnd() * 3.2;
      if (!free(u, v, r)) continue;
      houses++;
      occ.push([u, v, r + 1.2]);
      const kind = rnd(),
        col = PEARL[Math.floor(rnd() * 4)];
      if (kind < 0.24) {
        // nhà vỏ ốc nhỏ, quay mặt xoắn về phía giữa rãnh
        nautilus(u, v, r * 2.2, Math.atan2(-u, -v) - Math.PI / 2 + (rnd() - 0.5) * 0.8);
      } else if (kind < 0.42) {
        cowrie(u, v, r * 0.8, rnd() * TAU);
      } else if (kind < 0.66) {
        // vòm bong bóng: chân sáng, cửa tròn, có vòm chồng đôi
        F.add(st, CYL(14), '#a59cb8', u, 0, v, r * 1.05, 0.6, r * 1.05);
        F.add(st, DOME(), col, u, 0.6, v, r, r * 1.05, r);
        F.add(gl, RINGG(), SEAM, u, 0.7, v, r * 1.02, r * 1.02, r * 1.02, 0, Math.PI / 2);
        F.add(st, BALL(), '#1e1a2a', u + r * 0.9, r * 0.45, v, 0.2, r * 0.32, r * 0.32, rnd());
        if (rnd() < 0.35) {
          F.add(st, DOME(), PEARL[(Math.floor(rnd() * 4) + 1) % 4], u, 0.6 + r * 0.85, v, r * 0.55, r * 0.6, r * 0.55);
          F.add(gl, GEM(), VIOLET, u, 0.6 + r * 1.4, v, 0.35, 0.9, 0.35);
        }
      } else if (kind < 0.86) {
        // tháp nấm: thân mảnh, mũ rộng, vòng sáng dưới mũ
        const h = 7 + rnd() * 9;
        F.add(st, CYL(8), '#bfb6cf', u, 0, v, r * 0.28, h, r * 0.28);
        F.add(st, DOME(), col, u, h, v, r * 1.25, r * 0.6, r * 1.25);
        F.add(gl, RINGG(), rnd() < 0.5 ? SEAM : VIOLET, u, h - 0.1, v, r * 1.1, r * 1.1, r * 1.1, 0, Math.PI / 2);
      } else {
        // vòm vỡ: nửa vòm nghiêng, mảnh vỏ rơi
        F.add(st, CYL(14), '#a59cb8', u, 0, v, r, 0.6, r);
        F.add(st, DOME(), col, u + 1, 0.2, v, r, r * 0.9, r, rnd() * 3, 0.5 + rnd() * 0.4, 0.3);
        for (let q = 0; q < 3; q++)
          F.add(
            st,
            BOX(),
            col,
            u + (rnd() - 0.5) * r * 3,
            0,
            v + (rnd() - 0.5) * r * 3,
            1.2 + rnd(),
            0.3,
            1 + rnd(),
            rnd() * 3,
            rnd() * 0.5,
          );
      }
    }
    // tảo quanh chân vỏ ốc và giữa nhà
    for (let i = 0; i < 60; i++) {
      const a = rnd() * TAU,
        k = 0.3 + rnd() * 0.62,
        u = Math.cos(a) * S.A * k,
        v = Math.sin(a) * S.B * k;
      if (!free(u, v, 0.5)) continue;
      F.add(wd, CONE(4), rnd() < 0.5 ? '#3f8a52' : '#6caf55', u, 0, v, 0.7, 4 + rnd() * 7, 0.7);
    }

    /* ---------- Phần động: vòng quay quanh vỏ ốc, đảo đá lơ lửng ---------- */
    const pivot = F.at(shellC.u, 0),
      pivotY = floorY + shellC.y;
    const ringMat = matOf(),
      glowMat = new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false });
    [
      [44, 0.35, 0.2, 0.05],
      [38, -0.5, 0.9, -0.07],
      [50, 1.2, -0.3, 0.035],
    ].forEach(([R, tiltX, tiltZ, speed]) => {
      const G = { pos: [], col: [] },
        Gg = { pos: [], col: [], noTint: true },
        c = new THREE.Color('#d8cfe6');
      depthTint(c, pivotY);
      put(G, new THREE.TorusGeometry(R, 0.55, 6, 120).toNonIndexed(), '#' + c.getHexString(), 0, 0, 0, 1, 1, 1);
      for (let k = 0; k < 14; k++) {
        const a = (k / 14) * TAU;
        put(Gg, BALL(), k % 2 ? SEAM : VIOLET, Math.cos(a) * R, Math.sin(a) * R, 0, 1.1, 1.1, 1.1);
      }
      const tilt = new THREE.Group();
      tilt.position.set(pivot.x, pivotY, pivot.z);
      tilt.rotation.set(tiltX, F.ry0, tiltZ);
      deep.add(tilt);
      const spin = new THREE.Group();
      tilt.add(spin);
      for (const [g, mat] of [
        [G, ringMat],
        [Gg, glowMat],
      ]) {
        const m = meshAt(g, mat, 0, 0, 0);
        deep.remove(m);
        spin.add(m);
      }
      anims.push((ts) => {
        spin.rotation.z = ts * speed;
      });
    });
    // đảo đá lơ lửng: khối đá nón ngược, mặt bằng, đình vòm, vòng sáng dưới đáy; nhấp nhô lệch pha nhau
    const FLOATS = [
      [-60, -6, 52, 6],
      [-36, 40, 64, 5],
      [8, -30, 48, 4.5],
      [48, 46, 40, 4],
      [-10, 26, 70, 3.5],
    ];
    FLOATS.forEach(([u, v, y, r], k) => {
      const G = { pos: [], col: [] },
        Gg = { pos: [], col: [], noTint: true },
        p = F.at(u, v),
        y0 = floorY + y,
        c = (h) => {
          const q = new THREE.Color(h);
          depthTint(q, y0);
          return '#' + q.getHexString();
        };
      put(G, CONE(7), c('#8d8698'), 0, 0, 0, r, r * 2.2, r, 0, Math.PI);
      put(G, CYL(12), c(PEARL[k % 4]), 0, 0, 0, r * 1.05, 0.7, r * 1.05);
      for (let q = 0; q < 4; q++) {
        const a = (q / 4) * TAU + 0.4;
        put(G, CYL(6), c('#efe6f2'), Math.cos(a) * r * 0.55, 0.7, Math.sin(a) * r * 0.55, 0.25, 3, 0.25);
      }
      put(G, DOME(), c(PEARL[(k + 1) % 4]), 0, 3.7, 0, r * 0.7, r * 0.55, r * 0.7);
      put(Gg, RINGG(), k % 2 ? SEAM : VIOLET, 0, -0.6, 0, r * 0.9, r * 0.9, r * 0.9, 0, Math.PI / 2);
      put(Gg, GEM(), SEAM, 0, -r * 2.2 - 1.6, 0, 0.5, 1.2, 0.5);
      const ms = [meshAt(G, ringMat, p.x, y0, p.z), meshAt(Gg, glowMat, p.x, y0, p.z)];
      anims.push((ts) => {
        const dy = Math.sin(ts * 0.45 + k * 1.7) * 1.4;
        for (const m of ms) {
          m.position.y = y0 + dy;
          m.rotation.y = Math.sin(ts * 0.2 + k) * 0.25;
        }
      });
    });

    S.name = 'Thành Vỏ Ốc Xà Cừ';
    S.top = floorY + 60;
  }
  BK.DeepCitadel = { build };
})(typeof self !== 'undefined' ? self : globalThis);
