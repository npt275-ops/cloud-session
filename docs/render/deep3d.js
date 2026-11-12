/* Bể Kính · render/deep3d.js · Đáy bể: núi chìm, rãnh sâu, ba phế tích của những nền văn minh cổ (design/ke-hoach-buoc-18.md)
 * Đáy bể là một vùng đất liền chìm sâu 130 dưới mặt biển: những ngọn núi cao gấp nhiều lần núi trên đảo (đỉnh còn cách mặt
 * nước vài bước), ba khối núi trụ đỡ ba đảo Lúa Vàng, Đá Mây, Cửa Sóng, một khối núi giữa bể. Giữa các núi là ba rãnh sâu sát
 * đáy kính, vách dựng như rãnh đại dương; mỗi rãnh chứa một phế tích lớn hơn bề rộng một đảo (dài khoảng 185, đảo rộng 124),
 * nằm ngay dưới ba đảo Thông Xanh, Tuyết Trắng, Cát Hồng:
 *   - Thành Vòng Nước: ba vòng tường đồng tâm (đá trắng, đá đỏ, đá đen) có tháp, viền đồng đỏ còn ánh sáng, đường đắp cao trên
 *     vòm cầu chạy vào gò giữa, đền cột đổ một nửa, trụ pha lê cam, xác thuyền ở bến, đầu tượng đổ.
 *   - Vườn Treo Bậc Thang: sáu tầng gạch xếp lùi, mặt tầng là dãy vòm cuốn, rong biển rủ xuống từ mép tầng như vườn treo xưa,
 *     cầu thang lớn, đình đỉnh vỡ, cổng men lam viền vàng có hai tháp, đại lộ tường thấp, rừng tảo trong vườn.
 *   - Đô Thị Đá Khổng Lồ: đại lộ lát đá hai bên tượng người khổng lồ quỳ (vài tượng đổ) xen cột đá khắc chữ sáng, vòng cột đá
 *     có đà ngang bao quanh kim tự tháp bậc, đỉnh đá sáng, đĩa đá lịch khổng lồ dựa vào chân tháp.
 * Ba thiết kế là của Bể Kính, chỉ gợi theo các truyền thuyết thành chìm, vườn treo và đô thị cự thạch.
 * Màu ngả lam theo độ sâu; rong và tảo đung đưa (shader), bọt khí bay lên từ khe đáy, đá sáng nhịp nhàng.
 * Máy quay xuống dưới mặt nước thì trời tối lại thành màu nước sâu (sương mù gần), vách nước gần như đục (sea3d.js setUnder).
 * Thanh đảo có nút "Đáy bể" bay tới từng phế tích (ui/landbar.js). Cần: three.js, render/map/map3d.js (đảo), sea3d.js. */
(function (root) {
  'use strict';
  const BK = root.BK || (root.BK = {});
  function create(K) {
    const { THREE, scene, lands3d, sea3d, clamp, reduce, glowTex } = K;
    const SEA_Y = sea3d.SEA_Y, FLOOR = sea3d.FLOOR_Y, EDGE = sea3d.EDGE_R - 0.3, lands = lands3d.lands;
    const TOP_MAX = SEA_Y - 3.2; // không gì ở đáy cao quá chừng này (đáy sóng sâu nhất khoảng -3)
    const deep = new THREE.Group(); deep.name = 'đáy bể'; scene.add(deep);
    const hash = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

    /* =============== Địa hình đáy =============== */
    const n2 = (x, z) => Math.sin(x * 0.071 + Math.sin(z * 0.053) * 1.7) * Math.cos(z * 0.067 - Math.sin(x * 0.041) * 1.3);
    const fbm = (x, z) => n2(x, z) * 0.55 + n2(x * 2.1 + 17, z * 2.1 - 9) * 0.28 + n2(x * 4.3 - 31, z * 4.3 + 5) * 0.17;
    const ridge = (x, z) => 1 - Math.abs(n2(x * 1.7 + 3, z * 1.7 - 7));
    const polar = (a, r) => ({ x: Math.cos(a) * r, z: Math.sin(a) * r });
    // ba rãnh có phế tích: dưới đảo 1, 3, 5, tâm cách giữa bể 130; trục dài theo bán kính (95), ngang 60
    const SITES = [1, 3, 5].map((j, k) => { const a = lands[j].ang, c = polar(a, 130); return { k, a, x: c.x, z: c.z, ux: Math.cos(a), uz: Math.sin(a), A: 95, B: 60 }; });
    const local = (S, x, z) => { const dx = x - S.x, dz = z - S.z; return { u: dx * S.ux + dz * S.uz, v: -dx * S.uz + dz * S.ux }; };
    // núi: { x, z, R bán kính chân, top đỉnh, pl phần đỉnh bằng, p độ nhọn }
    const PEAKS = [];
    for (const j of [0, 2, 4]) { // núi trụ đỡ đảo: đỉnh bằng ngay dưới đáy đảo
      const a = lands[j].ang, c = lands[j].center;
      PEAKS.push({ x: c.x, z: c.z, R: 92, top: TOP_MAX - 0.3, pl: 0.56, p: 1.15 });
      PEAKS.push(Object.assign(polar(a, 222), { R: 30, top: -15, pl: 0, p: 1.6 })); // mỏm sát vách kính
      for (const s of [-1, 1]) PEAKS.push(Object.assign(polar(a + s * 0.22, 112), { R: 30, top: -34, pl: 0, p: 1.7 }));
      PEAKS.push(Object.assign(polar(a, 44), { R: 34, top: -40, pl: 0, p: 1.5 }));
    }
    PEAKS.push({ x: 0, z: 0, R: 52, top: -8, pl: 0, p: 1.45 }); // núi giữa bể, cao nhất
    for (let k = 0; k < 3; k++) PEAKS.push(Object.assign(polar(SITES[k].a + Math.PI / 3 + 0.5, 22), { R: 26, top: -22, pl: 0, p: 1.8 }));
    function hAt(x, z) {
      let h = FLOOR + 24 + fbm(x, z) * 8; // nền đáy: gò đồi thấp
      for (const P of PEAKS) {
        const d = Math.hypot(x - P.x, z - P.z) / P.R; if (d >= 1) continue;
        const t = d <= P.pl ? 0 : (d - P.pl) / (1 - P.pl), f = Math.pow(1 - t, P.p);
        h = Math.max(h, FLOOR + (P.top - FLOOR) * f * (0.88 + 0.12 * ridge(x, z)) + (t > 0 ? fbm(x * 1.9, z * 1.9) * 5 * f : 0));
      }
      for (const S of SITES) { // rãnh: đáy phẳng sát kính, vách dựng; một khe hẹp chạy tiếp dọc trục ra tới vách kính và vào giữa
        const L = local(S, x, z), e = Math.hypot(L.u / S.A, L.v / S.B);
        h = Math.min(h, FLOOR + 1.4 + (e < 1 ? 0 : Math.pow(e - 1, 0.7) * 170) + fbm(x * 3, z * 3) * 0.5);
        h = Math.min(h, FLOOR + 3 + Math.max(0, Math.abs(L.v) - 5) * 7 + Math.max(0, -L.u - S.A - 50) * 0.5);
      }
      return clamp(h, FLOOR + 0.8, TOP_MAX);
    }

    const tmpC = new THREE.Color(), deepC = new THREE.Color('#0f4a63');
    const depthTint = (c, y) => c.lerp(deepC, clamp((SEA_Y - y) / 150, 0, 1) * 0.42);
    const matOf = (o) => new THREE.MeshStandardMaterial(Object.assign({ vertexColors: true, flatShading: true, roughness: 0.92, metalness: 0.02, emissive: '#0b2c44', emissiveIntensity: 0.4 }, o || {}));
    const noPick = (m) => { m.raycast = () => {}; m.castShadow = m.receiveShadow = false; m.matrixAutoUpdate = false; m.updateMatrix(); return m; };
    {
      const NR = 100, NS = 256, pos = [], col = [], idx = [];
      const SAND = new THREE.Color('#c4b48a'), ROCK = new THREE.Color('#6c665c'), DARK = new THREE.Color('#47443f'), MOSS = new THREE.Color('#5c7652'), CORAL = new THREE.Color('#c07b6c');
      pos.push(0, hAt(0, 0), 0); depthTint(tmpC.copy(ROCK), pos[1]); col.push(tmpC.r, tmpC.g, tmpC.b);
      for (let k = 1; k <= NR; k++) for (let j = 0; j < NS; j++) {
        const r = (EDGE * k) / NR, a = (j / NS) * Math.PI * 2 + (k % 2) * (Math.PI / NS), x = Math.cos(a) * r, z = Math.sin(a) * r, y = hAt(x, z);
        const sl = Math.hypot(hAt(x + 1.2, z) - hAt(x - 1.2, z), hAt(x, z + 1.2) - hAt(x, z - 1.2)) / 2.4, up = (y - FLOOR) / (SEA_Y - FLOOR);
        tmpC.copy(SAND).lerp(MOSS, clamp((up - 0.15) * 3, 0, 1) * 0.7).lerp(ROCK, clamp(sl * 0.9 - 0.2, 0, 1)).lerp(DARK, clamp(sl - 1.2, 0, 1) * 0.7);
        if (up > 0.8 && hash(k * 977 + j) > 0.55) tmpC.lerp(CORAL, 0.45); // san hô gần mặt nước
        tmpC.multiplyScalar(0.92 + hash(k * 31 + j * 7) * 0.12); depthTint(tmpC, y);
        pos.push(x, y, z); col.push(tmpC.r, tmpC.g, tmpC.b);
      }
      const id = (k, j) => (k === 0 ? 0 : 1 + (k - 1) * NS + (((j % NS) + NS) % NS));
      for (let j = 0; j < NS; j++) idx.push(0, id(1, j + 1), id(1, j));
      for (let k = 1; k < NR; k++) for (let j = 0; j < NS; j++) { const o = k % 2; idx.push(id(k, j), id(k + 1, j + 1 - o), id(k + 1, j - o), id(k, j), id(k, j + 1), id(k + 1, j + 1 - o)); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx); g.computeVertexNormals();
      const m = new THREE.Mesh(g, matOf({ roughness: 0.97 })); m.name = 'đáy'; deep.add(noPick(m));
    }

    /* =============== Bộ ghép khối (gộp mọi khối của phế tích vào vài lưới) =============== */
    const unit = {};
    const U = (key, make) => unit[key] || (unit[key] = (() => { const g = make(); return g.index ? g.toNonIndexed() : g; })());
    const BOX = () => U('box', () => new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0));
    const CYL = (n) => U('cyl' + n, () => new THREE.CylinderGeometry(1, 1, 1, n || 8).translate(0, 0.5, 0));
    const FRU = (n, t) => U('fru' + n + t, () => new THREE.CylinderGeometry(t, 1, 1, n, 1).translate(0, 0.5, 0)); // thân côn: đỉnh t, chân 1
    const CONE = (n) => U('cone' + n, () => new THREE.ConeGeometry(1, 1, n || 8).translate(0, 0.5, 0));
    const BALL = () => U('ball', () => new THREE.IcosahedronGeometry(1, 1));
    const GEM = () => U('gem', () => new THREE.OctahedronGeometry(1, 0).translate(0, 1, 0));
    const DOME = () => U('dome', () => new THREE.SphereGeometry(1, 10, 5, 0, Math.PI * 2, 0, Math.PI / 2));
    const RINGG = () => U('ring', () => new THREE.TorusGeometry(1, 0.06, 4, 32));
    const ARCH = () => U('arch', () => new THREE.TorusGeometry(1, 0.22, 4, 10, Math.PI));
    const groups = { stone: { pos: [], col: [] }, glow: { pos: [], col: [] }, weed: { pos: [], col: [], sway: [] } };
    const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), E3 = new THREE.Euler(0, 0, 0, 'YXZ'), P3 = new THREE.Vector3(), S3 = new THREE.Vector3(), V3 = new THREE.Vector3(), cc = new THREE.Color();
    let seed = 1; const rnd = () => hash(seed++);
    // một khối vào nhóm G: hình gốc geo, màu, toạ độ thế giới (x, y, z), cỡ (sx, sy, sz), góc quay (rx, ry, rz)
    function put(G, geo, color, x, y, z, sx, sy, sz, ry, rx, rz) {
      E3.set(rx || 0, ry || 0, rz || 0); Q.setFromEuler(E3); M4.compose(P3.set(x, y, z), Q, S3.set(sx, sy, sz));
      const p = geo.attributes.position, shade = G === groups.glow ? 1 : 0.9 + rnd() * 0.18;
      for (let i = 0; i < p.count; i++) {
        V3.fromBufferAttribute(p, i).applyMatrix4(M4); G.pos.push(V3.x, V3.y, V3.z);
        cc.set(color).multiplyScalar(shade); if (G !== groups.glow) depthTint(cc, V3.y); G.col.push(cc.r, cc.g, cc.b);
        if (G.sway) G.sway.push(clamp(p.getY(i), 0, 1));
      }
    }
    // khung riêng của một phế tích: u dọc trục (từ giữa bể ra vách kính), v ngang; at(u, v) cho toạ độ thế giới, cao độ đáy
    function frame(S) {
      const ry0 = Math.atan2(-S.uz, S.ux);
      const at = (u, v) => ({ x: S.x + S.ux * u - S.uz * v, z: S.z + S.uz * u + S.ux * v });
      // đặt khối theo toạ độ riêng (u, v), y tính từ đáy rãnh tại đó (hoặc cao độ tuyệt đối khi abs)
      const add = (G, geo, color, u, y, v, su, sy, sv, ry, rx, rz, abs) => { const p = at(u, v); put(G, geo, color, p.x, abs ? y : hAt(p.x, p.z) - 0.3 + y, p.z, su, sy, sv, ry0 + (ry || 0), rx, rz); };
      return { at, add, ry0 };
    }
    const S0 = (G) => (G || groups.stone);

    /* ---------- 1. Thành Vòng Nước (rãnh dưới Thông Xanh) ---------- */
    {
      const S = SITES[0], F = frame(S), st = groups.stone, gl = groups.glow, A = S.A * 0.92, B = S.B * 0.92;
      const RINGS = [[1, '#d8d0bd', 8], [0.68, '#a35c47', 7], [0.4, '#3f3c3b', 6]]; // đá trắng, đá đỏ, đá đen
      for (const [k, c, H] of RINGS) {
        const n = Math.round(80 * k) + 12;
        for (let i = 0; i < n; i++) {
          const a0 = (i / n) * Math.PI * 2, a1 = ((i + 1) / n) * Math.PI * 2;
          if (Math.abs(Math.sin(a0)) < 0.06 && Math.cos(a0) < 0) continue; // chỗ đường đắp xuyên qua
          if (rnd() < 0.18) { F.add(st, BOX(), c, Math.cos(a0) * A * k + (rnd() - 0.5) * 6, 0, Math.sin(a0) * B * k + (rnd() - 0.5) * 6, 3 + rnd() * 3, 1.5 + rnd() * 2, 2 + rnd() * 3, rnd() * 3, rnd() * 0.4); continue; } // đoạn sập
          const u0 = Math.cos(a0) * A * k, v0 = Math.sin(a0) * B * k, u1 = Math.cos(a1) * A * k, v1 = Math.sin(a1) * B * k;
          const L = Math.hypot(u1 - u0, v1 - v0) + 0.6, h = H * (0.45 + rnd() * 0.55), ang = -Math.atan2(v1 - v0, u1 - u0);
          F.add(st, BOX(), c, (u0 + u1) / 2, 0, (v0 + v1) / 2, L, h, 3, ang, 0, (rnd() - 0.5) * 0.08);
          if (h > H * 0.8) F.add(gl, BOX(), '#ff8a3d', (u0 + u1) / 2, h, (v0 + v1) / 2, L * 0.9, 0.35, 3.2, ang); // viền đồng đỏ còn ánh
          if (i % 5 === 0) { F.add(st, CYL(8), c, u0, 0, v0, 3.4, H * 1.7 * (0.6 + rnd() * 0.4), 3.4); F.add(st, CONE(8), c, u0, H * 1.7, v0, 3.8, 3.5, 3.8, 0, rnd() * 0.5); }
        }
      }
      // đường đắp cao trên vòm cầu, từ cổng ngoài vào gò giữa
      for (let u = -A - 8; u < -14; u += 9) { F.add(st, BOX(), '#cfc6b0', u, 5, 0, 9.4, 1.4, 8); for (const s of [-1, 1]) F.add(st, CYL(6), '#bdb39c', u, 0, s * 3, 1.3, 5, 1.3); F.add(st, ARCH(), '#bdb39c', u + 4.5, 2.6, 0, 3.2, 3, 4, Math.PI / 2); }
      // gò giữa ba bậc, đền cột (một nửa cột đã đổ), mái vỡ nghiêng, trụ pha lê cam
      [[22, 5], [16, 5], [11, 4]].forEach(([r, h], i) => F.add(st, CYL(14), '#b7ad98', 0, i * 5, 0, r, h, r * 0.8));
      const top = 14;
      F.add(st, BOX(), '#e2dccb', 0, top, 0, 24, 1.6, 15);
      for (let i = 0; i < 16; i++) {
        const side = i < 8 ? -1 : 1, q = i % 8, u = -10.5 + q * 3, v = side * 6.2;
        if (rnd() < 0.35) F.add(st, CYL(8), '#ece6d6', u + rnd() * 2, top + 1.6 + 0.8, v + side * (3 + rnd() * 8), 0.8, 9 * (0.5 + rnd() * 0.5), 0.8, rnd() * 3, Math.PI / 2);
        else { const h = 9 * (0.6 + rnd() * 0.4); F.add(st, CYL(8), '#ece6d6', u, top + 1.6, v, 0.8, h, 0.8); if (h > 8.2) F.add(st, BOX(), '#e8e1cf', u, top + 1.6 + h, v, 2, 0.6, 2); }
      }
      F.add(st, BOX(), '#e5ddca', 4, top + 10.7, 0, 13, 1.2, 15, 0, 0, -0.09); // nửa mái còn lại
      F.add(st, BOX(), '#d8cfba', -12, top - 1, 9, 12, 1.2, 9, 0.6, 0.25, 0.5);  // nửa mái rơi xuống sườn gò
      F.add(gl, GEM(), '#ff9b52', 0, top + 1.6, 0, 2.6, 9, 2.6);
      // bến cảng: xác thuyền nằm nghiêng giữa vòng ngoài và vòng giữa; đầu tượng lớn đổ
      for (let i = 0; i < 4; i++) {
        const a = 0.7 + i * 1.25, u = Math.cos(a) * A * 0.84, v = Math.sin(a) * B * 0.84, ry = rnd() * 3, lean = 0.5 + rnd() * 0.4;
        F.add(st, FRU(6, 0.6), '#5d4632', u, 1.5, v, 3, 15, 2.2, ry, Math.PI / 2, lean);
        F.add(st, CYL(5), '#4c3a2a', u, 1, v, 0.35, 10, 0.35, ry, 0.9 + rnd() * 0.4, lean);
      }
      F.add(st, BALL(), '#cfc5ae', A * 0.5, 6, -B * 0.25, 7, 7.5, 6.5, 0.4, 0.3); F.add(st, CONE(5), '#c2a14f', A * 0.5 + 2, 11, -B * 0.25, 6, 5, 6, 0.4, 0.9, 0.5);
      for (let i = 0; i < 60; i++) { const a = rnd() * Math.PI * 2, k = 0.15 + rnd() * 0.85; F.add(st, BOX(), rnd() < 0.5 ? '#cfc6b0' : '#8b5a48', Math.cos(a) * A * k, 0, Math.sin(a) * B * k, 1 + rnd() * 3, 0.8 + rnd() * 2, 1 + rnd() * 3, rnd() * 3, rnd() * 0.5, rnd() * 0.5); }
      S.name = 'Thành Vòng Nước'; S.top = hAt(S.x, S.z) + 30;
    }

    /* ---------- 2. Vườn Treo Bậc Thang (rãnh dưới Tuyết Trắng) ---------- */
    {
      // mặt trước (cầu thang, cổng lam) quay ra phía vách kính, chỗ máy quay lặn xuống: lật trục u (góc quay ry thành π − ry)
      const S = SITES[1], F0 = frame(S), F = { add: (G, geo, c, u, y, v, su, sy, sv, ry, rx, rz) => F0.add(G, geo, c, -u, y, v, su, sy, sv, Math.PI - (ry || 0), rx, -(rz || 0)) };
      const st = groups.stone, gl = groups.glow, wd = groups.weed;
      const BRICK = '#ad7f52', BRICK2 = '#93653f', COL = '#d6c299', DARKA = '#2c241f';
      let W = 122, D = 76, u0 = 6, y = 0; const H = 7.5;
      for (let t = 0; t < 6; t++) {
        F.add(st, BOX(), t % 2 ? BRICK2 : BRICK, u0, y, 0, W, H, D);
        // mặt tầng: dãy vòm cuốn ở mặt trước và hai bên
        const front = u0 - W / 2 - 0.2, n = Math.max(3, Math.round(D / 7.5));
        for (let i = 0; i < n; i++) { const v = -D / 2 + (i + 0.5) * (D / n); F.add(st, BOX(), DARKA, front, y + 1, v, 0.6, H - 3, D / n - 2.4); F.add(st, ARCH(), COL, front - 0.3, y + H - 2.1, v, (D / n - 2.4) / 2, 1.6, 1.4, Math.PI / 2); F.add(st, CYL(6), COL, front - 0.6, y, v - D / n / 2, 0.6, H - 0.6, 0.6); }
        const ns = Math.max(4, Math.round(W / 9));
        for (const s of [-1, 1]) for (let i = 0; i < ns; i++) { const u = u0 - W / 2 + (i + 0.5) * (W / ns); F.add(st, BOX(), DARKA, u, y + 1, s * (D / 2 + 0.2), W / ns - 2.6, H - 3, 0.6); F.add(st, CYL(6), COL, u - W / ns / 2, y, s * (D / 2 + 0.6), 0.6, H - 0.6, 0.6); }
        // rong biển rủ xuống từ mép tầng (vườn treo xưa): sợi dài ngắn, đung đưa ở ngọn
        for (let i = 0; i < 26 + t * 2; i++) {
          const side = rnd(), len = 3 + rnd() * (H + 2), w = 0.5 + rnd() * 0.8;
          let u, v; if (side < 0.5) { u = front - 0.9; v = (rnd() - 0.5) * D; } else { u = u0 - W / 2 + rnd() * W; v = (side < 0.75 ? -1 : 1) * (D / 2 + 0.9); }
          F.add(wd, BOX(), rnd() < 0.5 ? '#3f8a52' : '#5aa35a', u, y + H + 0.3, v, w, -len, w * 0.4, rnd() * 3);
        }
        // bồn cây trên mặt tầng: tảo mọc thẳng lên
        for (let i = 0; i < 10; i++) F.add(wd, CONE(4), rnd() < 0.5 ? '#4f9a58' : '#7cbf62', u0 - W / 2 + 3 + rnd() * 10, y + H, (rnd() - 0.5) * (D - 6), 0.9 + rnd(), 4 + rnd() * 5, 0.9 + rnd());
        y += H; W -= 15; D -= 9; u0 += 4.5;
      }
      // cầu thang lớn ở mặt trước lên tầng bốn
      for (let i = 0; i < 22; i++) F.add(st, BOX(), '#c9a77c', -61 + i * 1.6, 0, 0, 1.7, (i + 1) * 1.4, 12);
      // đình đỉnh vỡ: bốn cột, vòm nứt nghiêng
      for (const [a, b] of [[-1, -1], [-1, 1], [1, -1], [1, 1]]) F.add(st, CYL(8), COL, u0 - 4.5 + a * 6, y, b * 6, 0.9, a + b === 2 ? 4 : 9, 0.9);
      F.add(st, DOME(), '#c99a5c', u0 - 6, y + 7, 2, 8.5, 6, 8.5, 0, 0.35, 0.25);
      F.add(gl, GEM(), '#9fffd0', u0 - 4.5, y, 0, 1.6, 4, 1.6);
      // cổng men lam viền vàng, hai tháp; đại lộ tường thấp có hình thú vàng
      const gu = -88;
      for (const s of [-1, 1]) { F.add(st, BOX(), '#2f5fa8', gu, 0, s * 10, 9, 26, 9); for (let k = 0; k < 4; k++) F.add(st, BOX(), '#2f5fa8', gu + (k - 1.5) * 2.3, 26, s * 10 + (k % 2 ? 3 : -3), 1.6, 2.2, 1.6); F.add(gl, BOX(), '#ffd36a', gu - 4.6, 8 + 0, s * 10, 0.3, 0.8, 9.2); F.add(gl, BOX(), '#ffd36a', gu - 4.6, 18, s * 10, 0.3, 0.8, 9.2); }
      F.add(st, BOX(), '#2f5fa8', gu, 14, 0, 9, 8, 11.2); F.add(st, BOX(), '#1b2236', gu - 0.2, 0, 0, 9.5, 14, 7); F.add(st, ARCH(), '#ffd36a', gu - 4.7, 13.6, 0, 3.5, 3.5, 3, Math.PI / 2);
      for (let u = gu + 7; u < -64; u += 2.4) for (const s of [-1, 1]) { F.add(st, BOX(), '#355f9c', u, 0, s * 9, 2.4, 4 + rnd() * 1.5, 1.6); if (Math.round(u) % 5 === 0) F.add(gl, BOX(), '#e9c460', u, 2, s * 8.1, 1.4, 1.2, 0.2); }
      // tường vườn thấp quanh rãnh (đổ nhiều đoạn), rừng tảo trong vườn
      for (let i = 0; i < 70; i++) { const a = (i / 70) * Math.PI * 2; if (rnd() < 0.3 || (Math.cos(a) < -0.96)) continue; const u = Math.cos(a) * S.A * 0.93, v = Math.sin(a) * S.B * 0.9; F.add(st, BOX(), BRICK2, u, 0, v, 7.5, 3 + rnd() * 3, 2, -Math.atan2(Math.cos(a) * S.B, -Math.sin(a) * S.A)); }
      for (let i = 0; i < 90; i++) { const a = rnd() * Math.PI * 2, k = 0.82 + rnd() * 0.12, u = Math.cos(a) * S.A * k, v = Math.sin(a) * S.B * k; if (u < -60 && Math.abs(v) < 14) continue; F.add(wd, CONE(4), rnd() < 0.5 ? '#3e8a4c' : '#6caf55', u, 0, v, 0.8 + rnd() * 0.8, 6 + rnd() * 12, 0.8 + rnd() * 0.8); }
      S.name = 'Vườn Treo Bậc Thang'; S.top = hAt(S.x, S.z) + 46;
    }

    /* ---------- 3. Đô Thị Đá Khổng Lồ (rãnh dưới Cát Hồng) ---------- */
    {
      const S = SITES[2], F = frame(S), st = groups.stone, gl = groups.glow;
      const STONE = '#7f877b', BAS = '#46494b', GLY = '#5ff0ff';
      for (let u = -90; u < 6; u += 4) F.add(st, BOX(), (Math.round(u / 4) % 2) ? '#8f968a' : '#878e82', u, 0, 0, 3.8, 0.6, 16); // đại lộ lát đá
      for (let i = 0; i < 6; i++) for (const s of [-1, 1]) {
        const u = -82 + i * 16, v = s * 15, fallen = rnd() < 0.25;
        if (i % 2 === 0) { // tượng người khổng lồ quỳ, mặt hướng ra đại lộ
          const ry = s > 0 ? Math.PI / 2 : -Math.PI / 2;
          if (!fallen) { F.add(st, BOX(), STONE, u, 0, v, 7, 5, 8, ry); F.add(st, FRU(6, 0.7), STONE, u, 5, v + s * 1, 6, 9, 4.5, ry); F.add(st, BALL(), '#8b9286', u, 15.5, v + s * 0.5, 3, 3.4, 3); F.add(st, BOX(), BAS, u, 15.5, v - s * 2.6, 2.6, 0.8, 0.3, ry); for (const q of [-1, 1]) F.add(st, BOX(), STONE, u + q * 3.4, 6, v + s * 0.5, 1.6, 7, 2, ry, 0, q * 0.12); }
          else { F.add(st, FRU(6, 0.7), STONE, u, 3, v + s * 6, 6, 12, 4.5, ry + 0.3, Math.PI / 2); F.add(st, BALL(), '#8b9286', u + 4, 2.5, v + s * 16, 3, 3.4, 3); F.add(st, BOX(), STONE, u, 0, v, 7, 5, 8, ry); }
        } else { // cột đá vuông vót nhọn, khắc chữ sáng
          const h = 22 + rnd() * 6;
          if (!fallen) { F.add(st, FRU(4, 0.6), BAS, u, 0, v, 2.6, h, 2.6, Math.PI / 4); F.add(st, CONE(4), BAS, u, h, v, 1.6, 3, 1.6, Math.PI / 4); for (let k = 0; k < 4; k++) F.add(gl, BOX(), GLY, u - 1.95, 3 + k * 4.5, v, 0.15, 2.4, 0.9); }
          else F.add(st, FRU(4, 0.6), BAS, u, 1.6, v, 2.6, h, 2.6, Math.PI / 4 + 0.4, Math.PI / 2, 0.2);
        }
      }
      // vòng cột đá có đà ngang quanh kim tự tháp bậc
      const cu = 40, R = 36, N = 18;
      for (let i = 0; i < N; i++) {
        const a = (i / N) * Math.PI * 2, u = cu + Math.cos(a) * R, v = Math.sin(a) * R * 0.95, ry = -a, down = rnd() < 0.2;
        if (down) { F.add(st, BOX(), STONE, u, 1.6, v, 4.5, 18, 3.2, ry, Math.PI / 2 * 0.95, 0.2); continue; }
        F.add(st, BOX(), STONE, u, 0, v, 4.5, 18, 3.2, ry, 0, (rnd() - 0.5) * 0.08);
        if (i % 2 === 0 && rnd() < 0.8) { const a2 = a + Math.PI / N, u2 = cu + Math.cos(a2) * R, v2 = Math.sin(a2) * R * 0.95; F.add(st, BOX(), BAS, u2, 18, v2, 3.2, 2.6, 14, -a2); }
      }
      [[30, 7], [23, 7], [16, 7], [9, 6]].forEach(([r, h], i) => F.add(st, FRU(4, 0.86), i % 2 ? '#9a9f90' : '#8a8f80', cu, i * 7, 0, r, h, r, Math.PI / 4));
      F.add(gl, GEM(), '#7ef9ff', cu, 27, 0, 4, 6, 4);
      // vạch chữ sáng trên mặt trước từng bậc (bậc vuông xoay 45°: nửa cạnh = 0,707 bán kính, mặt hơi nghiêng vào)
      [30, 23, 16, 9].forEach((r, i) => F.add(gl, BOX(), GLY, cu - r * 0.707 * 0.93 - 0.15, i * 7 + 3, 0, 0.2, 1, r * 0.85));
      // đĩa đá lịch khổng lồ dựa vào chân tháp, vòng khắc sáng
      F.add(st, CYL(20), '#9aa093', cu - 28, 13, 26, 13, 2.4, 13, 0.6, Math.PI / 2 - 0.35);
      F.add(gl, RINGG(), GLY, cu - 28, 13.4, 26, 10, 10, 10, 0.6, -0.35); F.add(gl, RINGG(), GLY, cu - 28, 13.4, 26, 6, 6, 6, 0.6, -0.35);
      for (let i = 0; i < 70; i++) { const a = rnd() * Math.PI * 2, k = 0.2 + rnd() * 0.8; F.add(st, BOX(), rnd() < 0.5 ? STONE : BAS, Math.cos(a) * S.A * 0.9 * k, 0, Math.sin(a) * S.B * 0.9 * k, 1.5 + rnd() * 4, 1 + rnd() * 3, 1.5 + rnd() * 4, rnd() * 3, rnd() * 0.6, rnd() * 0.6); }
      S.name = 'Đô Thị Đá Khổng Lồ'; S.top = hAt(S.x, S.z) + 36;
    }

    /* ---------- Rong mọc trên sườn núi, quanh chân núi ---------- */
    for (let i = 0; i < 420; i++) {
      const a = hash(i * 3.1) * Math.PI * 2, r = 20 + hash(i * 5.7) * (EDGE - 26), x = Math.cos(a) * r, z = Math.sin(a) * r, y = hAt(x, z);
      if (y > TOP_MAX - 4) continue;
      put(groups.weed, CONE(4), hash(i) < 0.5 ? '#3f7f4a' : '#7a9a4a', x, y - 0.4, z, 0.7 + hash(i * 2) * 0.9, 4 + hash(i * 9) * 10, 0.7 + hash(i * 2) * 0.9, hash(i * 4) * 3);
    }

    /* ---------- Lưới gộp ---------- */
    const meshOf = (G, mat) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(G.pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(G.col, 3)); if (G.sway) g.setAttribute('aSway', new THREE.Float32BufferAttribute(G.sway, 1)); g.computeVertexNormals(); const m = new THREE.Mesh(g, mat); deep.add(noPick(m)); return m; };
    meshOf(groups.stone, matOf());
    const glowMat = new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false });
    meshOf(groups.glow, glowMat);
    // rong, tảo: đung đưa theo dòng nước (ngọn đưa nhiều, gốc đứng yên)
    const weedMat = matOf({ side: THREE.DoubleSide, roughness: 0.8 }), WU = { uT: { value: 0 } };
    weedMat.onBeforeCompile = (sh) => {
      sh.uniforms.uT = WU.uT;
      sh.vertexShader = 'uniform float uT;\nattribute float aSway;\n' + sh.vertexShader.replace('#include <begin_vertex>',
        '#include <begin_vertex>\n{ vec4 wp = modelMatrix * vec4(transformed, 1.0); float s = aSway * aSway; transformed.x += sin(uT * 0.9 + wp.x * 0.11 + wp.z * 0.07) * 1.6 * s; transformed.z += cos(uT * 0.7 + wp.z * 0.09) * 1.2 * s; }');
    };
    weedMat.customProgramCacheKey = () => 'deepWeed';
    meshOf(groups.weed, weedMat);

    /* ---------- Bọt khí bay lên từ khe đáy và phế tích ---------- */
    const NB = 360, bpos = new Float32Array(NB * 3), bsp = [], vents = [];
    for (const S of SITES) for (let k = 0; k < 4; k++) { const a = hash(S.k * 9 + k) * Math.PI * 2, r = 10 + hash(S.k * 5 + k) * 50; vents.push({ x: S.x + Math.cos(a) * r, z: S.z + Math.sin(a) * r * 0.6 }); }
    for (let k = 0; k < 6; k++) { const p = polar(k * 1.05 + 0.3, 60 + hash(k) * 150); vents.push(p); }
    for (const v of vents) v.y = hAt(v.x, v.z);
    for (let i = 0; i < NB; i++) { const v = vents[i % vents.length]; bpos[i * 3] = v.x + (hash(i) - 0.5) * 3; bpos[i * 3 + 1] = v.y + hash(i * 7) * (TOP_MAX - v.y); bpos[i * 3 + 2] = v.z + (hash(i * 3) - 0.5) * 3; bsp.push(3 + hash(i * 11) * 5); }
    const bgeo = new THREE.BufferGeometry(); bgeo.setAttribute('position', new THREE.BufferAttribute(bpos, 3));
    const bubbles = new THREE.Points(bgeo, new THREE.PointsMaterial({ color: '#cfefff', size: 1.1, map: glowTex, transparent: true, opacity: 0.7, depthWrite: false }));
    bubbles.raycast = () => {}; bubbles.frustumCulled = false; deep.add(bubbles);

    /* ---------- Mỗi khung hình ---------- */
    let FOG0 = null; const deepFog = new THREE.Color('#0e4d6e'), darkFog = new THREE.Color('#06202f');
    let wasUnder = false;
    function animate(dt, t, night, cam) {
      const ts = reduce ? 0 : t * 0.001;
      WU.uT.value = ts;
      glowMat.color.setScalar(0.8 + 0.2 * Math.sin(ts * 1.3));
      if (!reduce) {
        const s = Math.min(dt || 16, 100) / 1000;
        for (let i = 0; i < NB; i++) { let y = bpos[i * 3 + 1] + bsp[i] * s; if (y > TOP_MAX + 2.4) { const v = vents[i % vents.length]; y = v.y; bpos[i * 3] = v.x + (hash(i + ts) - 0.5) * 3; bpos[i * 3 + 2] = v.z + (hash(i * 3 + ts) - 0.5) * 3; } bpos[i * 3 + 1] = y; bpos[i * 3] += Math.sin(ts * 2 + i) * 0.02; }
        bgeo.attributes.position.needsUpdate = true;
      }
      // máy quay dưới mặt nước: sương nước sâu, càng xuống càng tối
      const fog = scene.fog; if (fog && !FOG0) FOG0 = { near: fog.near, far: fog.far }; // (sương của trời: render/sky3d.js)
      const top = SEA_Y + sea3d.seaDy, p = cam.position, under = p.y < top - 0.15 && Math.hypot(p.x, p.z) < EDGE;
      if (under && fog) {
        const d = clamp((top - p.y) / (top - FLOOR), 0, 1);
        fog.near = 10; fog.far = 330 - d * 90; fog.color.copy(deepFog).lerp(darkFog, d * 0.7).multiplyScalar(1 - night * 0.55);
      } else if (wasUnder && fog && FOG0) { fog.near = FOG0.near; fog.far = FOG0.far; }
      if (under !== wasUnder) sea3d.setUnder(under);
      wasUnder = under;
      // dưới nước góc nhìn rộng ra (62°) để thấy trọn một phế tích dài 185 trong lòng rãnh; lên mặt nước trả lại góc thường
      // (góc thường theo render/scene3d.js resize: 34°, màn hẹp 50°)
      const base = window.innerWidth < 720 ? 50 : 34, want = under ? Math.max(base, 62) : base;
      if (Math.abs(cam.fov - want) > 0.05) { cam.fov += (want - cam.fov) * Math.min(1, (dt || 16) / 400); if (Math.abs(cam.fov - want) < 0.05) cam.fov = want; cam.updateProjectionMatrix(); }
    }
    // các phế tích cho nút "Đáy bể": tên, tâm, cao độ để máy quay nhìn vào
    // máy quay: trên lòng rãnh phía vách kính (cách tâm 92 theo trục, cao -22), nhìn chếch vào phế tích
    const sites = SITES.map((S) => { const y = hAt(S.x, S.z) + 12; return { name: S.name, x: S.x, z: S.z, y, ux: S.ux, uz: S.uz, cam: new THREE.Vector3(S.x + S.ux * 92, -22, S.z + S.uz * 92) }; });
    const out = { animate, sites, heightAt: hAt, group: deep, FLOOR };
    return out;
  }
  BK.Deep3D = { create };
})(typeof self !== 'undefined' ? self : globalThis);
