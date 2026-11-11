(function (root) {
  'use strict';
  const BK = root.BK || (root.BK = {});
  /* Bể Kính · render/map/height3d.js · Cao độ mặt đảo (đảo nhấp nhô như đảo thật; design/ke-hoach-buoc-14.md)
   * Mỗi đảo một mặt đất lồi lõm riêng, không đảo nào giống đảo nào:
   *   plains   Lúa Vàng: gò thoải, hai cánh là ruộng bậc thang, một gò lớn phía sau
   *   forest   Thông Xanh: làng nằm trong khe của một quả đồi lớn chẻ đôi (hai nửa đồi hai bên, khe hẹp phía sau)
   *   mountain Đá Mây: cả đảo dốc dần lên phía ngoài, sườn đá gồ ghề, vách dựng sát mép
   *   tundra   Tuyết Trắng: gò băng dài nằm song song, khe nứt trũng xuống
   *   coast    Cửa Sóng: thấp, cồn cát chạy dọc bờ, bãi thoải rộng, một mũi đá cao
   *   desert   Cát Hồng: cồn cát lưỡi liềm một sườn thoải một sườn dốc, một bậc cao nguyên đá
   * Mặt đất là một lưới cực (K vòng × S múi, đỉnh vòng ngoài nằm đúng mép đảo, cao độ 0). Cao độ một điểm:
   *   mép (thoải hay dựng) × (nền + dáng lớn M + gồ ghề W chỉ ở ngoài đường)  →  khoét nước  →  nền công trình (pads)
   * Đường của đảo đi trên dáng lớn M (thoải), gồ ghề tránh mặt đường; sông, hồ, ao khoét xuống dưới mặt nước; mỗi công trình
   * có một nền phẳng ở cao độ chỗ nó đứng (đất quanh nền nối thoải vào đất tự nhiên).
   * Dùng:
   *   L.surfAt(x, z)   cao độ chỗ đứng (toạ độ đảo); trong lòng sông, hồ trả 0 (mặt nước); ngoài đảo trả 0
   *   L.setPads(list)  nền công trình của thời đang vẽ: [{ x, z, r, y? (bỏ: lấy cao độ tự nhiên), blend? }]; dựng lại lưới, phủ
   *                    lại các khối phủ theo đất (L.drape), đặt lại cây; tăng L.hVer (ai giữ cao độ thì theo số này mà cập nhật)
   *   L.drape(obj)     ghi một nhóm khối vẽ ở cao độ 0 (đá, núi, lớp đường, tường) để nâng từng đỉnh theo đất
   *   L.padY(x, z, r)  cao độ tự nhiên trung bình của một nền (chưa tính nền nào)
   * Cần: three.js, render/map/shared3d.js; đường của đảo (L.roadSegs) và mép đảo (L.rOf) đã có trước khi gọi init. */
  function create(X) {
    const { THREE, TAU, clamp, LAND_R } = X;
    const K = 46, S = 144, DA = TAU / S;
    const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
    const lerp = (a, b, t) => a + (b - a) * t;
    // nhiễu giá trị hai chiều theo hạt giống (−1..1), mượt
    function noiseOf(seed) {
      const h = (i, j) => { let n = (i * 374761393 + j * 668265263 + seed * 362437) | 0; n = (n ^ (n >>> 13)) * 1274126177 | 0; n ^= n >>> 16; return ((n >>> 0) / 4294967295) * 2 - 1; };
      return (x, z) => { const i = Math.floor(x), j = Math.floor(z), fx = x - i, fz = z - j, u = fx * fx * (3 - 2 * fx), v = fz * fz * (3 - 2 * fz);
        return lerp(lerp(h(i, j), h(i + 1, j), u), lerp(h(i, j + 1), h(i + 1, j + 1), u), v); };
    }
    const gauss = (x, z, cx, cz, s) => Math.exp(-((x - cx) ** 2 + (z - cz) ** 2) / (2 * s * s));
    const angd = (a, b) => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));

    /* ---------- Dáng đất từng miền: (lx phải, lz trước, r, af góc tính từ phía trước) → { M dáng lớn, W gồ ghề, B khối lớn, rim bề rộng mép } ---------- */
    const SHAPE = {
      plains: (n, lx, lz, r) => {
        const t = sstep(30, 58, Math.abs(lx)) * sstep(22, -6, lz), s5 = t * 5, fl = Math.floor(s5), terr = (fl + sstep(0.72, 1, s5 - fl)) * 0.62;
        return { M: 0.55 + 0.7 * n(lx / 38, lz / 38), W: 1.1 * n(lx / 10, lz / 10) + 0.3 * n(lx / 4, lz / 4), B: terr + 5 * gauss(lx, lz, -18, -44, 9) + 3 * gauss(lx, lz, 34, 30, 7) - 1.6 * gauss(lx, lz, 12, 44, 7), rim: 5 };
      },
      forest: (n, lx, lz, r, af) => {
        // hai nửa đồi hai bên (góc 68°..160° tính từ phía trước), khe hẹp phía sau, phía trước mở ra biển trong
        const a = Math.abs(af), lobe = sstep(1.12, 1.5, a) * sstep(2.86, 2.52, a) * sstep(30, 45, r) * (1 - 0.3 * sstep(48, 64, r));
        return { M: 0.5 + 0.6 * n(lx / 40, lz / 40), W: 1.5 * n(lx / 8, lz / 8) + 0.45 * n(lx / 3.5, lz / 3.5), B: lobe * (14 + 3.5 * n(lx / 12, lz / 12)) - 1.5 * gauss(lx, lz, -22, 40, 6), rim: lobe > 0.3 ? 2 : 4.5 };
      },
      mountain: (n, lx, lz, r) => {
        const up = sstep(28, -58, lz);
        return { M: 0.4 + 6.2 * up + 0.3 * n(lx / 36, lz / 36), W: 2.0 * Math.abs(n(lx / 7, lz / 7)) + 0.5 * n(lx / 3, lz / 3) - 0.5, B: 3 * up * Math.max(0, n(lx / 15, lz / 15)) - 1.8 * gauss(lx, lz, 30, 34, 7), rim: lerp(6, 1.8, up) };
      },
      tundra: (n, lx, lz, r) => {
        const d = n(lx / 24 + 3, lz / 8), cr = 1 - sstep(0, 0.1, Math.abs(n(lx / 16 - 5, lz / 16 + 2)));
        return { M: 0.5 + 0.7 * n(lx / 36, lz / 36), W: 2.8 * Math.max(0, d) + 0.35 * n(lx / 4, lz / 4) - 1.5 * cr, B: 3.5 * gauss(lx, lz, 30, -40, 8) - 1.6 * gauss(lx, lz, -30, 36, 8), rim: 3 };
      },
      coast: (n, lx, lz, r) => {
        const dune = sstep(30, 38, r) * sstep(14, -8, lz) * 1.7 * (0.5 + 0.5 * Math.sin(r * 0.55 + 2.2 * n(lx / 20, lz / 20)));
        return { M: 0.32 + 0.4 * n(lx / 40, lz / 40), W: 0.7 * n(lx / 8, lz / 8), B: dune + 7 * gauss(lx, lz, 44, -34, 8) + 2.4 * gauss(lx, lz, -38, 26, 7) - 1.2 * gauss(lx, lz, 30, 32, 7), rim: gauss(lx, lz, 46, -36, 12) > 0.35 ? 1.8 : 9 };
      },
      desert: (n, lx, lz, r) => {
        const d = (lx * 0.8 + lz * 0.6 + 7 * n(lx / 25, lz / 25)) / 15, f = d - Math.floor(d), saw = f < 0.72 ? f / 0.72 : (1 - f) / 0.28;
        const mesa = sstep(0, 3.5, 13 - Math.hypot(lx + 36, lz + 34)) * 5.2;
        return { M: 0.5 + 0.6 * n(lx / 34, lz / 34), W: 3.0 * saw * (0.45 + 0.55 * (0.5 + 0.5 * n(lx / 30 + 9, lz / 30))) + 0.15 * n(lx / 3, lz / 3) - 0.5, B: mesa, rim: 3 };
      },
    };

    function init(L) {
      const n = noiseOf(L.i * 7 + 11), shape = SHAPE[L.ter] || SHAPE.plains;
      const fx = L.inw.x, fz = L.inw.z, fl = Math.hypot(fx, fz) || 1, FX = fx / fl, FZ = fz / fl, RX = -FZ, RZ = FX; // trục làng: trước (ra biển trong), phải
      const segs = L.roadSegs || [], HALF = L.roadW || 2.4;
      // khoảng cách tới đường gần nhất
      const roadD = (x, z) => { let m = 1e9; for (const s of segs) { const dx = s[2] - s[0], dz = s[3] - s[1], l2 = dx * dx + dz * dz || 1, t = clamp(((x - s[0]) * dx + (z - s[1]) * dz) / l2, 0, 1), d = Math.hypot(x - s[0] - dx * t, z - s[1] - dz * t); if (d < m) m = d; } return m; };
      // chỗ mép phải thoải: hai đầu bến (cầu), cổng chính phía trước, đầu các đường toả ra mép
      const soft = [Math.atan2(FZ, FX)];
      for (const v of L.landing || []) soft.push(Math.atan2(v.z, v.x));
      for (const s of segs) if (Math.hypot(s[2], s[3]) > L.rOf(Math.atan2(s[3], s[2])) - 7) soft.push(Math.atan2(s[3], s[2]));
      const rj = new Float32Array(S), cj = new Float32Array(S), sj = new Float32Array(S);
      for (let j = 0; j < S; j++) { const a = j * DA; rj[j] = L.rOf(a); cj[j] = Math.cos(a); sj[j] = Math.sin(a); }
      const NV = (K + 1) * S, nat = new Float32Array(NV), road = new Float32Array(NV), Hs = new Float32Array(NV), H = new Float32Array(NV), px = new Float32Array(NV), pz = new Float32Array(NV);
      for (let k = 0; k <= K; k++) for (let j = 0; j < S; j++) {
        const v = k * S + j, u = k / K, x = u * rj[j] * cj[j], z = u * rj[j] * sj[j]; px[v] = x; pz[v] = z;
        const lx = x * RX + z * RZ, lz = x * FX + z * FZ, r = Math.hypot(x, z), a = j * DA, sh = shape(n, lx, lz, r, Math.atan2(lx, lz));
        const dR = roadD(x, z); road[v] = dR;
        let rim = sh.rim; for (const sa of soft) rim = Math.max(rim, lerp(10, rim, sstep(0.1, 0.32, angd(a, sa))));
        const A = sstep(HALF + 0.4, HALF + 6.5, dR), env = 0.3 + 0.7 * sstep(24, 38, r);
        nat[v] = k === K ? 0 : sstep(0, rim, rj[j] - r) * Math.max(0.08, 0.9 + sh.M + A * (env * sh.W + sh.B));
      }
      L.hf = { K, S, rj, cj, sj, nat, road, Hs, H, px, pz, tris: [], lines: [], pads: [], draped: [], mesh: null };
      Hs.set(nat); H.set(nat);
      L.hVer = 0;
      L.surfAt = (x, z) => Math.max(0, sample(L.hf, H, x, z));
      L.natAt = (x, z) => Math.max(0, sample(L.hf, Hs, x, z));
      L.padY = (x, z, r) => { let s = L.natAt(x, z), c = 1; for (let q = 0; q < 6; q++) { const a = q * 1.0472; s += L.natAt(x + Math.cos(a) * r * 0.6, z + Math.sin(a) * r * 0.6); c++; } return s / c; };
      L.drape = (obj) => { L.hf.draped.push(obj); if (L.hf.mesh) drapeOne(L, obj); return obj; };
      L.setPads = (list) => { L.hf.pads = list || []; rebuild(L); };
      L.collectWater = () => collectWater(L);
    }

    // cao độ tại (x, z): nội suy đúng theo tam giác của lưới vẽ (người và vật đứng khít mặt đất)
    function sample(F, A, x, z) {
      const r2 = x * x + z * z; if (r2 < 1e-8) return A[0];
      let a = Math.atan2(z, x); if (a < 0) a += TAU;
      let j = Math.floor(a / DA); if (j >= S) j = S - 1; const j1 = (j + 1) % S;
      // p = α·R_j + β·R_j1 (R: điểm mép của hai múi); u = α + β
      const ax = F.rj[j] * F.cj[j], az = F.rj[j] * F.sj[j], bx = F.rj[j1] * F.cj[j1], bz = F.rj[j1] * F.sj[j1], det = ax * bz - az * bx;
      const al = (x * bz - z * bx) / det, be = (ax * z - az * x) / det, u = al + be;
      if (u >= 1) return 0;
      const k = Math.min(K - 1, Math.floor(u * K)), u0 = k / K, u1 = (k + 1) / K;
      const h10 = A[(k + 1) * S + j], h11 = A[(k + 1) * S + j1];
      if (k === 0) return A[0] * (1 - u / u1) + h10 * (al / u1) + h11 * (be / u1);
      const h00 = A[k * S + j], h01 = A[k * S + j1];
      // tam giác 1: (u0,0) (u1,0) (0,u1); tam giác 2: (u0,0) (0,u1) (0,u0)
      const w2 = be / u1, w0 = (u1 * (1 - w2) - al) / (u1 - u0);
      if (1 - w2 - w0 >= 0) return h00 * w0 + h10 * (1 - w2 - w0) + h11 * w2;
      const v0 = al / u0, v1 = (be - u0 * (1 - v0)) / (u1 - u0);
      return h00 * v0 + h11 * v1 + h01 * (1 - v0 - v1);
    }

    /* ---------- Khoét nước: mọi mặt nước của đảo (hồ, ao, đầm, sông) hạ đất xuống dưới mặt nước, bờ nối thoải ---------- */
    // ghi các tam giác mặt nước (toạ độ đảo) trước khi chúng được gộp (render/map/water3d.js); line: dải khoét theo dãy điểm (hẻm núi)
    function collectWater(L) {
      const F = L.hf, v = new THREE.Vector3();
      for (const m of L.g.children) {
        if (!m.isMesh || !(m.userData.flatPart === 'water' || m.userData.carve)) continue;
        m.updateMatrix(); const g = m.geometry, P = g.attributes.position, I = g.index, n = I ? I.count : P.count, pt = (q) => { v.fromBufferAttribute(P, I ? I.getX(q) : q).applyMatrix4(m.matrix); return [v.x, v.z]; };
        for (let q = 0; q < n; q += 3) { const a = pt(q), b = pt(q + 1), c = pt(q + 2); F.tris.push([a[0], a[1], b[0], b[1], c[0], c[1], Math.min(a[0], b[0], c[0]), Math.max(a[0], b[0], c[0]), Math.min(a[1], b[1], c[1]), Math.max(a[1], b[1], c[1])]); }
      }
      if (L.canyon) F.lines.push({ pts: L.canyon, w: 3.4, y: 0 });
    }
    const segD = (x, z, x0, z0, x1, z1) => { const dx = x1 - x0, dz = z1 - z0, l2 = dx * dx + dz * dz || 1, t = clamp(((x - x0) * dx + (z - z0) * dz) / l2, 0, 1); return Math.hypot(x - x0 - dx * t, z - z0 - dz * t); };
    // khoảng cách có dấu tới mặt nước gần nhất (âm: trong nước), chỉ xét trong tầm BANK
    const BANK = 3.2;
    function waterD(F, x, z) {
      let out = 1e9, inside = -1e9;
      for (const t of F.tris) {
        if (x < t[6] - BANK || x > t[7] + BANK || z < t[8] - BANK || z > t[9] + BANK) continue;
        const d = Math.min(segD(x, z, t[0], t[1], t[2], t[3]), segD(x, z, t[2], t[3], t[4], t[5]), segD(x, z, t[4], t[5], t[0], t[1]));
        const s1 = (t[2] - t[0]) * (z - t[1]) - (t[3] - t[1]) * (x - t[0]), s2 = (t[4] - t[2]) * (z - t[3]) - (t[5] - t[3]) * (x - t[2]), s3 = (t[0] - t[4]) * (z - t[5]) - (t[1] - t[5]) * (x - t[4]);
        if ((s1 >= 0 && s2 >= 0 && s3 >= 0) || (s1 <= 0 && s2 <= 0 && s3 <= 0)) inside = Math.max(inside, 0); else if (d < out) out = d;
      }
      return inside === 0 ? -1 : out;
    }
    function carve(L) {
      const F = L.hf, { nat, Hs, road, px, pz } = F, HALF = L.roadW || 2.4;
      // điểm lưới trong nước hạ xuống dưới mặt nước; quanh bờ (trong tầm BANK) đất nối thoải từ mép nước lên đất tự nhiên
      for (let v = 0; v < nat.length; v++) {
        let h = nat[v];
        if (F.tris.length) {
          const d = waterD(F, px[v], pz[v]);
          if (d < BANK) { const free = sstep(HALF * 0.7, HALF + 1.4, road[v]); // mặt đường giữ nguyên (đường qua sông như đập đất)
            const tgt = d < 0 ? -0.4 : lerp(0.02, h, sstep(0, BANK, d)); h = lerp(h, Math.min(h, tgt), free); }
        }
        for (const ln of F.lines) { let d = 1e9; for (let q = 0; q + 1 < ln.pts.length; q++) d = Math.min(d, segD(px[v], pz[v], ln.pts[q][0], ln.pts[q][1], ln.pts[q + 1][0], ln.pts[q + 1][1]));
          if (d < ln.w / 2 + BANK) h = lerp(h, Math.min(h, lerp(ln.y, h, sstep(ln.w / 2, ln.w / 2 + BANK, d))), sstep(HALF * 0.7, HALF + 1.4, road[v])); }
        Hs[v] = h;
      }
      F.H.set(Hs);
    }

    /* ---------- Lưới vẽ ---------- */
    const ROCK = { plains: '#8f8672', forest: '#77705c', mountain: '#8d877a', tundra: '#a9bccb', coast: '#b9a888', desert: '#b9794e' };
    const SAND = { plains: '#d9cf9e', forest: '#b9ad84', mountain: '#b0aa98', tundra: '#f4f8fb', coast: '#f1e2b4', desert: '#edd3a0' };
    function build(L, st) {
      const F = L.hf, NV = (K + 1) * S, pos = new Float32Array(NV * 3), col = new Float32Array(NV * 3), idx = [];
      for (let k = 0; k < K; k++) for (let j = 0; j < S; j++) { const j1 = (j + 1) % S, a = k * S + j, b = (k + 1) * S + j, c = (k + 1) * S + j1, d = k * S + j1; if (k === 0) idx.push(a, c, b); else idx.push(a, c, b, a, d, c); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.setIndex(idx);
      L.groundMat.vertexColors = true; L.groundMat.needsUpdate = true;
      const m = new THREE.Mesh(g, L.groundMat); m.receiveShadow = true; m.userData.noDrape = true; m.name = 'ground'; L.g.add(m); F.mesh = m;
      // vách quanh mép đảo: từ mép (cao độ 0) xuống phần đất đá phía dưới
      const sp = [], si = [];
      for (let j = 0; j <= 144; j++) { const a = (j / 144) * TAU, r = L.rOf(a); sp.push(Math.cos(a) * r, 0.001, Math.sin(a) * r, Math.cos(a) * r, -2.62, Math.sin(a) * r); if (j) { const b = j * 2; si.push(b - 2, b, b - 1, b - 1, b, b + 1); } }
      const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3)); sg.setIndex(si); sg.computeVertexNormals();
      const skirt = new THREE.Mesh(sg, new THREE.MeshStandardMaterial({ color: st.rock[0], flatShading: true, roughness: 0.95, side: THREE.DoubleSide })); skirt.userData.noDrape = true; L.g.add(skirt);
      F.rock = new THREE.Color(ROCK[L.ter] || '#888'); F.sand = new THREE.Color(SAND[L.ter] || '#ddd'); F.base = new THREE.Color(st.ground);
      refresh(L);
    }
    // chép cao độ vào lưới vẽ; màu theo đỉnh (nhân với màu mặt đất theo mùa): sườn dốc ngả màu đá, mép thấp ngả màu cát, đáy nước sẫm
    function refresh(L) {
      const F = L.hf, { H, px, pz, mesh } = F, P = mesh.geometry.attributes.position, Cc = mesh.geometry.attributes.color;
      const tint = (c, base) => [c.r / Math.max(0.05, base.r), c.g / Math.max(0.05, base.g), c.b / Math.max(0.05, base.b)];
      const rk = tint(F.rock, F.base), sd = tint(F.sand, F.base);
      for (let k = 0; k <= K; k++) for (let j = 0; j < S; j++) {
        const v = k * S + j, h = H[v]; P.setXYZ(v, px[v], h, pz[v]);
        const kn = Math.min(K, k + 1), kp = Math.max(0, k - 1), dr = (F.rj[j] * (kn - kp)) / K || 1, dt = (k / K) * F.rj[j] * DA * 2 || 1;
        const slope = Math.hypot((H[kn * S + j] - H[kp * S + j]) / dr, k ? (H[k * S + ((j + 1) % S)] - H[k * S + ((j + S - 1) % S)]) / dt : 0);
        const rock = sstep(0.55, 1.05, slope), sand = (1 - rock) * sstep(K - 5, K - 1, k) * sstep(1.2, 0.3, h), wet = sstep(0, -0.3, h);
        let r = 1, g = 1, b = 1; r = lerp(r, rk[0], rock); g = lerp(g, rk[1], rock); b = lerp(b, rk[2], rock);
        r = lerp(r, sd[0], sand); g = lerp(g, sd[1], sand); b = lerp(b, sd[2], sand); const dk = 1 - 0.45 * wet;
        Cc.setXYZ(v, r * dk, g * dk, b * dk);
      }
      P.needsUpdate = true; Cc.needsUpdate = true; mesh.geometry.computeBoundingSphere();
    }

    /* ---------- Nền công trình và phủ lại ---------- */
    function rebuild(L) {
      const F = L.hf, { Hs, H, road, px, pz } = F, HALF = L.roadW || 2.4;
      H.set(Hs);
      for (const p of F.pads) {
        const y = p.y != null ? p.y : L.padY(p.x, p.z, p.r), bl = p.blend || 2.6, R = p.r + bl; p.at = y;
        for (let v = 0; v < H.length; v++) { const dx = px[v] - p.x, dz = pz[v] - p.z; if (dx > R || dx < -R || dz > R || dz < -R) continue; const d = Math.hypot(dx, dz); if (d >= R) continue;
          const w = (1 - sstep(p.r, R, d)) * (p.road ? 1 : sstep(HALF * 0.8, HALF + 1.2, road[v])); if (v >= K * S) continue; H[v] = lerp(H[v], y, w); }
      }
      if (F.mesh) refresh(L);
      for (let q = F.draped.length - 1; q >= 0; q--) { const o = F.draped[q]; let top = o; while (top.parent) top = top.parent; if (top.type !== 'Scene') { F.draped.splice(q, 1); continue; } drapeOne(L, o); }
      if (L.trees && L.replant) L.replant();
      L.hVer++;
    }
    // nâng từng đỉnh của một nhóm khối theo đất (giữ cao độ gốc trong userData.y0); đỉnh thấp hơn −0,5 (phần dưới đảo) để nguyên
    const _v = new THREE.Vector3(), _inv = new THREE.Matrix4(), _mm = new THREE.Matrix4();
    function drapeOne(L, obj) {
      L.g.updateMatrixWorld(true); _inv.copy(L.g.matrixWorld).invert();
      obj.traverse((o) => {
        if (!(o.isMesh || o.isLine) || o.isInstancedMesh || o.userData.noDrape || o.userData.flatPart || !o.geometry.attributes.position) return;
        const P = o.geometry.attributes.position; let y0 = o.geometry.userData.y0;
        if (!y0 || y0.length !== P.count) { y0 = o.geometry.userData.y0 = new Float32Array(P.count); for (let q = 0; q < P.count; q++) y0[q] = P.getY(q); }
        _mm.multiplyMatrices(_inv, o.matrixWorld); const sy = Math.hypot(_mm.elements[4], _mm.elements[5], _mm.elements[6]) || 1;
        for (let q = 0; q < P.count; q++) { _v.set(P.getX(q), y0[q], P.getZ(q)).applyMatrix4(_mm); if (_v.y < -0.5) { P.setY(q, y0[q]); continue; } P.setY(q, y0[q] + L.surfAt(_v.x, _v.z) / sy); }
        P.needsUpdate = true; o.geometry.computeBoundingSphere(); if (o.geometry.boundingBox) o.geometry.computeBoundingBox();
      });
    }
    // xong phần thiên nhiên của một đảo: khoét nước, dựng lưới, phủ mọi khối tĩnh đã có trên đảo
    function finish(L, st) {
      carve(L); build(L, st);
      for (const o of L.g.children.slice()) if (o !== L.hf.mesh && !o.userData.noDrape && !o.userData.flatPart && !o.isInstancedMesh) L.drape(o);
    }
    return { init, collectWater, finish, K, S };
  }
  BK.MapHeight = { create };
})(typeof self !== 'undefined' ? self : globalThis);
