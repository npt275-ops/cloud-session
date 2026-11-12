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
    const SEA_Y = sea3d.SEA_Y, FLOOR = sea3d.FLOOR_Y, lands = lands3d.lands;
    // khối đất phủ tới sát vách kính nhưng nằm trọn bên trong vách nước (sea3d.js EDGE_R): nhìn từ ngoài bể, mặt cắt đất đá cũng
    // được màu nước biển phủ lên như mọi thứ khác trong bể, không lòi ra ngoài kính
    const EDGE = sea3d.EDGE_R - 0.3;
    const TOP_MAX = SEA_Y - 3.2; // ngoài chân đảo không gì ở đáy cao quá chừng này (đáy sóng sâu nhất khoảng -3)
    const ISLE_TOP = -2.7;       // đỉnh núi trụ và mặt trên khối đất đỡ đảo: sát mặt dưới đảo (vách đảo xuống tới -2,62)
    const deep = new THREE.Group(); deep.name = 'đáy bể'; scene.add(deep);
    const hash = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

    /* =============== Địa hình đáy =============== */
    const n2 = (x, z) => Math.sin(x * 0.071 + Math.sin(z * 0.053) * 1.7) * Math.cos(z * 0.067 - Math.sin(x * 0.041) * 1.3);
    const fbm = (x, z) => n2(x, z) * 0.55 + n2(x * 2.1 + 17, z * 2.1 - 9) * 0.28 + n2(x * 4.3 - 31, z * 4.3 + 5) * 0.17;
    const ridge = (x, z) => 1 - Math.abs(n2(x * 1.7 + 3, z * 1.7 - 7));
    const polar = (a, r) => ({ x: Math.cos(a) * r, z: Math.sin(a) * r });
    // ba rãnh có phế tích: dưới đảo 1, 3, 5, tâm cách giữa bể 130; trục dài theo bán kính (96), ngang 68
    const SITES = [1, 3, 5].map((j, k) => { const a = lands[j].ang, c = polar(a, 130); return { k, a, x: c.x, z: c.z, ux: Math.cos(a), uz: Math.sin(a), A: 96, B: 68 }; });
    const TAU = Math.PI * 2;
    const ROAD_U = 30; // đường lát đá từ hai cửa hầm (hai bên rãnh) vào phế tích chạy ở u = 30 (bước 19)
    const local = (S, x, z) => { const dx = x - S.x, dz = z - S.z; return { u: dx * S.ux + dz * S.uz, v: -dx * S.uz + dz * S.ux }; };
    /* ---------- Ba đường hầm (bước 20, design/ke-hoach-buoc-20.md): tính trước để đắp đất phủ kín vòm hầm ----------
     * Mỗi hầm là một cung tròn quanh giữa bể (bán kính TUN_RC), xuyên chân núi trụ dưới đảo 0, 2, 4, nối cửa bên +v của phế
     * tích k với cửa bên −v của phế tích kế tiếp. Lòng hầm: sàn phẳng rộng 16, tường đứng cao 14, trần vòm bán kính 8 (cao 22). */
    const TUN_RC = 172, TUN_W = 8, TUN_WALL = 14, TUN_FLOOR = FLOOR + 1.6, TUN_TOP = TUN_FLOOR + TUN_WALL + TUN_W;
    // góc lệch từ trục phế tích tới cửa hầm: điểm trên cung TUN_RC nằm sát chân vách rãnh (e = 0,985)
    const TUN_D = (() => { const S = SITES[0]; let lo = 0.1, hi = 0.8; for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2, L = local(S, Math.cos(S.a + m) * TUN_RC, Math.sin(S.a + m) * TUN_RC); if (Math.hypot(L.u / S.A, L.v / S.B) < 0.985) lo = m; else hi = m; } return lo; })();
    const TUNNELS = SITES.map((S, k) => ({ k, from: k, to: (k + 1) % 3, pillar: (2 * k + 2) % 6, a: S.a + TUN_D, b: S.a + (2 * Math.PI) / 3 - TUN_D }));
    for (const TN of TUNNELS) { TN.mid = (TN.a + TN.b) / 2; TN.half = (TN.b - TN.a) / 2; }
    const angOff = (a, b) => { let d = a - b; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return d; };
    // núi: { x, z, R bán kính chân, top đỉnh, pl phần đỉnh bằng, p độ nhọn }; núi trụ đỡ đảo thêm isle: đỉnh bằng đúng theo mép
    // đảo đó (L.rOf, rộng hơn 3%), sườn đổ xuống đáy ở cách tâm đảo 100; đỉnh không gồ ghề (đảo đặt kín lên núi, không hở nước)
    const PEAKS = [];
    for (const j of [0, 2, 4]) { // núi trụ đỡ đảo: đỉnh bằng ngay dưới đáy đảo (khối đá nón ngược dưới đảo nằm gọn trong núi)
      const a = lands[j].ang, c = lands[j].center;
      PEAKS.push({ x: c.x, z: c.z, R: 100, top: ISLE_TOP, p: 1.15, isle: lands[j] });
      PEAKS.push(Object.assign(polar(a, 222), { R: 30, top: -15, pl: 0, p: 1.6 })); // mỏm sát vách kính
      for (const s of [-1, 1]) PEAKS.push(Object.assign(polar(a + s * 0.22, 112), { R: 30, top: -34, pl: 0, p: 1.7 }));
      PEAKS.push(Object.assign(polar(a, 44), { R: 34, top: -40, pl: 0, p: 1.5 }));
    }
    PEAKS.push({ x: 0, z: 0, R: 52, top: -8, pl: 0, p: 1.45 }); // núi giữa bể, cao nhất
    for (let k = 0; k < 3; k++) PEAKS.push(Object.assign(polar(SITES[k].a + Math.PI / 3 + 0.5, 22), { R: 26, top: -22, pl: 0, p: 1.8 }));
    function hAt(x, z) {
      let h = FLOOR + 24 + fbm(x, z) * 8; // nền đáy: gò đồi thấp
      for (const P of PEAKS) {
        const dd = Math.hypot(x - P.x, z - P.z); if (dd >= P.R) continue;
        let t;
        if (P.isle) { const r0 = P.isle.rOf(Math.atan2(z - P.z, x - P.x)) * 1.03; t = dd <= r0 ? 0 : (dd - r0) / (P.R - r0); }
        else { const d = dd / P.R; t = d <= P.pl ? 0 : (d - P.pl) / (1 - P.pl); }
        const f = Math.pow(1 - t, P.p), rough = 1 - 0.12 * (1 - ridge(x, z)) * Math.min(1, t * 4); // (đỉnh bằng không gồ ghề)
        h = Math.max(h, FLOOR + (P.top - FLOOR) * f * rough + (t > 0 ? fbm(x * 1.9, z * 1.9) * 5 * f * Math.min(1, t * 4) : 0));
      }
      for (const S of SITES) { // rãnh: đáy phẳng sát kính, vách dựng; một khe hẹp chạy tiếp dọc trục vào phía giữa bể
        const L = local(S, x, z), e = Math.hypot(L.u / S.A, L.v / S.B);
        h = Math.min(h, FLOOR + 1.4 + (e < 1 ? 0 : Math.pow(e - 1, 0.7) * 170) + fbm(x * 3, z * 3) * 0.5);
        // (phía vách kính khe nông dần và khép lại trước vách: nhìn từ ngoài bể chỉ thấy khối đất liền)
        h = Math.min(h, FLOOR + 3 + Math.max(0, Math.abs(L.v) - 5) * 7 + Math.max(0, -L.u - S.A - 50) * 0.5 + Math.max(0, L.u - S.A + 5) * 6);
      }
      // hầm: đất trên lòng hầm đắp cao hơn trần vòm 9 (lan ra hai bên); nền trước hai cửa phẳng (vách dựng không chọc mũi đất ra
      // trước ngưỡng cửa)
      const r = Math.hypot(x, z), th = Math.atan2(z, x), off = Math.abs(r - TUN_RC);
      for (const TN of TUNNELS) {
        // ex > 0: ngoài hai đầu hầm (bước). Chỗ đất đắp dốc lên nằm từ 5 bước trong miệng hầm trở vào (sau mặt đá cửa, lòng
        // hầm được khoét): lưới đất thưa không chìa mặt dốc ra trước ngưỡng cửa
        const ex = (Math.abs(angOff(th, TN.mid)) - TN.half) * TUN_RC;
        if (ex <= -5 && off < 34) h = Math.max(h, TUN_TOP + 9 - Math.max(0, off - 11) * 2.5);
        else if (ex > -5 && ex < 18 && off < (ex < 0 ? 15.5 : 17)) h = Math.min(h, FLOOR + 1.4);
      }
      return clamp(h, FLOOR + 0.8, ISLE_TOP);
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
      // khoét mặt đất chỗ cắt qua lòng ba đường hầm (và 4 bước trước hai cửa, trên mặt sàn): đứng trong hầm thấy lối đi thông
      const tm = matOf({ roughness: 0.97, side: THREE.DoubleSide }), gl3 = (v) => v.toFixed(5), ext = 4 / TUN_RC;
      const tunCheck = TUNNELS.map((TN) => `{ float d = th - ${gl3(TN.mid)}; d = mod(d + 3.14159265, 6.2831853) - 3.14159265; if (abs(d) < ${gl3(TN.half + ext)}) discard; }`).join('\n');
      tm.onBeforeCompile = (sh) => {
        sh.vertexShader = 'varying vec3 vWP;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvWP = (modelMatrix * vec4(transformed, 1.0)).xyz;');
        sh.fragmentShader = 'varying vec3 vWP;\n' + sh.fragmentShader.replace('#include <clipping_planes_fragment>', '#include <clipping_planes_fragment>\n'
          + `{ float r = length(vWP.xz), th = atan(vWP.z, vWP.x), lx = r - ${gl3(TUN_RC)}, ly = vWP.y - ${gl3(TUN_FLOOR)};
  if (abs(lx) < ${gl3(TUN_W + 0.6)} && ly > -0.12 && (ly < ${gl3(TUN_WALL)} || lx * lx + (ly - ${gl3(TUN_WALL)}) * (ly - ${gl3(TUN_WALL)}) < ${gl3((TUN_W + 0.6) ** 2)})) {\n${tunCheck}\n} }`);
      };
      tm.customProgramCacheKey = () => 'deepFloorTunnels';
      const m = new THREE.Mesh(g, tm); m.name = 'đáy'; deep.add(noPick(m));
      // mặt cắt khối đất sát vách kính: từ mép đất (đúng các đỉnh vòng ngoài) xuống đáy kính, tầng đất đá xen nhau; tấm đáy kín
      // bên dưới. Đất, núi là một khối liền: nhìn từ ngoài bể không nhìn xuyên qua được.
      const sp = [], sc = [], si = [], STRATA = ['#5a4a3b', '#6d5a45', '#4b4038', '#7a6650', '#55493e'].map((h) => new THREE.Color(h)), NL = 26;
      for (let j = 0; j < NS; j++) {
        const a = (j / NS) * Math.PI * 2, x = Math.cos(a) * EDGE, z = Math.sin(a) * EDGE, top = pos[(1 + (NR - 1) * NS + j) * 3 + 1];
        for (let l = 0; l <= NL; l++) {
          const y = top - (top - FLOOR) * (l / NL); sp.push(x, y, z);
          const band = Math.floor((y - FLOOR + Math.sin(a * 7) * 3 + Math.sin(a * 23) * 1.2) / 5.5);
          tmpC.copy(STRATA[((band % 5) + 5) % 5]).multiplyScalar(0.9 + hash(j * 13 + l) * 0.16);
          if (l === 0) tmpC.lerp(new THREE.Color('#5c7652'), 0.35); sc.push(tmpC.r, tmpC.g, tmpC.b);
        }
      }
      const sid = (j, l) => (((j % NS) + NS) % NS) * (NL + 1) + l;
      for (let j = 0; j < NS; j++) for (let l = 0; l < NL; l++) si.push(sid(j, l), sid(j + 1, l), sid(j, l + 1), sid(j + 1, l), sid(j + 1, l + 1), sid(j, l + 1));
      const cen = sp.length / 3; sp.push(0, FLOOR + 0.2, 0); sc.push(0.28, 0.24, 0.2);
      const rimFloor = sp.length / 3;
      for (let j = 0; j < NS; j++) { const a = (j / NS) * Math.PI * 2; sp.push(Math.cos(a) * EDGE, FLOOR + 0.2, Math.sin(a) * EDGE); sc.push(0.3, 0.25, 0.21); }
      for (let j = 0; j < NS; j++) si.push(cen, rimFloor + j, rimFloor + ((j + 1) % NS));
      const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3)); sg.setAttribute('color', new THREE.Float32BufferAttribute(sc, 3)); sg.setIndex(si); sg.computeVertexNormals();
      const sm = new THREE.Mesh(sg, matOf({ roughness: 1, side: THREE.DoubleSide, emissiveIntensity: 0.18 })); sm.name = 'mặt cắt đất'; deep.add(noPick(sm));
    }

    /* =============== Khối đất đỡ ba đảo nằm trên rãnh (Thông Xanh, Tuyết Trắng, Cát Hồng) ===============
     * Một dải đất đá liền chạy theo vòng đảo từ núi trụ bên này sang núi trụ bên kia, đi qua ngay dưới đảo: mặt trên sát mặt
     * dưới đảo (-2,7), võng xuống giữa hai đảo; dưới đảo dày tới -44 (bao trọn khối đá nón ngược dưới đảo), hai cánh đổ chéo
     * xuống cắm vào sườn hai núi. Bên dưới vẫn hở: rãnh và phế tích nằm dưới vòm đất này. */
    const SAD_R = lands3d.RING, SPAN = Math.PI / 3;
    const sadW = (s) => { const q = Math.abs(s); return q < 0.42 ? 74 : 74 - (q - 0.42) / 0.58 * 26; };
    const sadTop = (s) => { const q = Math.abs(s); return ISLE_TOP - 6 * Math.max(0, Math.sin(clamp((q - 0.42) / 0.5, 0, 1) * Math.PI)); };
    const sadBot = (s) => { const q = Math.abs(s), k = clamp((q - 0.3) / 0.15, 0, 1), arm = -36 - 60 * Math.pow(clamp((q - 0.38) / 0.62, 0, 1), 1.3); return -44 + (arm + 44) * k * k * (3 - 2 * k); };
    const angDiff = (a, b) => { let d = a - b; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; return d; };
    // dưới khối đất đỡ đảo? trả cao độ mặt dưới khối đất (bọt khí tan ở đó), không thì null
    const ceilAt = (x, z) => { const r = Math.hypot(x, z), a = Math.atan2(z, x); for (const S of SITES) { const s = angDiff(a, S.a) / SPAN; if (Math.abs(s) < 1 && Math.abs(r - SAD_R) < sadW(s)) return sadBot(s); } return null; };
    {
      const NSs = 96, NT = 44, pos = [], col = [], idx = [];
      const ROCK = new THREE.Color('#6a6156'), DARK = new THREE.Color('#47403a'), MOSS = new THREE.Color('#5c7652');
      for (const S of SITES) {
        const base = pos.length / 3;
        for (let i = 0; i <= NSs; i++) {
          const s = -1 + (2 * i) / NSs, a = S.a + s * SPAN, nx = Math.cos(a), nz = Math.sin(a), W = sadW(s), top = sadTop(s), bot = sadBot(s), yc = (top + bot) / 2, hh = (top - bot) / 2;
          for (let k = 0; k < NT; k++) {
            const th = (k / NT) * Math.PI * 2, c = Math.cos(th), sn = Math.sin(th);
            let t = Math.sign(c) * Math.pow(Math.abs(c), 0.35) * W, y = yc + Math.sign(sn) * Math.pow(Math.abs(sn), 0.45) * hh;
            const wx = nx * (SAD_R + t), wz = nz * (SAD_R + t), onTop = sn > 0.2;
            if (!onTop) { const n = fbm(wx * 1.6, wz * 1.6 + y * 0.3); t += n * 4 * Math.sign(c); y += n * 3 * (sn < -0.2 ? 1 : 0.4); } else y = Math.min(y, top);
            const r = SAD_R + t; pos.push(nx * r, y, nz * r);
            tmpC.copy(onTop ? MOSS : ROCK).lerp(DARK, onTop ? 0.1 : clamp(0.3 + fbm(wx * 3, y) * 0.5, 0, 0.8)).multiplyScalar(0.9 + hash(i * 57 + k + S.k * 7) * 0.15); depthTint(tmpC, y);
            col.push(tmpC.r, tmpC.g, tmpC.b);
          }
        }
        for (let i = 0; i < NSs; i++) for (let k = 0; k < NT; k++) { const a0 = base + i * NT + k, a1 = base + i * NT + ((k + 1) % NT), b0 = a0 + NT, b1 = a1 + NT; idx.push(a0, b0, a1, a1, b0, b1); }
      }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx); g.computeVertexNormals();
      const m = new THREE.Mesh(g, matOf({ roughness: 0.96, side: THREE.DoubleSide })); m.name = 'khối đất đỡ đảo'; deep.add(noPick(m));
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
        cc.set(color).multiplyScalar(shade); if (G !== groups.glow && !G.noTint) depthTint(cc, V3.y); G.col.push(cc.r, cc.g, cc.b);
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
          if (Math.abs(Math.cos((a0 + a1) / 2) * A * k - ROAD_U) < 6) continue; // chỗ đường từ cửa hầm đi qua (cổng tháp ở dưới)
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
      let W = 128, D = 80, u0 = 6, y = 0; const H = 7.5;
      for (let t = 0; t < 6; t++) {
        F.add(st, BOX(), t % 2 ? BRICK2 : BRICK, u0, y, 0, W, H, D);
        // tháp tròn bốn góc tầng, mái vòm men lam hay vàng (bước 19)
        for (const [cu, cv] of [[-1, -1], [-1, 1], [1, -1], [1, 1]]) { const tu = u0 + cu * (W / 2 - 1), tv = cv * (D / 2 - 1); F.add(st, CYL(10), COL, tu, y, tv, 2.6, H + 3.5, 2.6); F.add(st, DOME(), t % 2 ? '#3a6fb8' : '#c99a3c', tu, y + H + 3.5, tv, 2.9, 2.6, 2.9); F.add(gl, GEM(), '#ffd36a', tu, y + H + 6, tv, 0.5, 1.2, 0.5); }
        // cây cọ trên dải mặt tầng phía trước và hai bên: thân nghiêng, tàu lá đung đưa
        for (let i = 0; i < 9; i++) {
          const fr = rnd() < 0.5, pu = fr ? u0 - W / 2 + 3 + rnd() * 9 : u0 - W / 2 + 8 + rnd() * (W - 16), pv = fr ? (rnd() - 0.5) * (D - 14) : (rnd() < 0.5 ? -1 : 1) * (D / 2 - 2.5 - rnd() * 3);
          if (fr && Math.abs(pv) < 8) continue; // (cầu thang)
          const th = 5 + rnd() * 3; F.add(st, CYL(5), '#7a5a3a', pu, y + H, pv, 0.45, th, 0.45, 0, (rnd() - 0.5) * 0.2, (rnd() - 0.5) * 0.2);
          for (let l = 0; l < 6; l++) F.add(wd, CONE(4), l % 2 ? '#4f9a58' : '#6cb55a', pu, y + H + th - 0.3, pv, 0.6, 4.2, 1.1, (l / 6) * TAU, 1.25);
        }
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
      for (let i = 0; i < 70; i++) { const a = (i / 70) * Math.PI * 2; if (rnd() < 0.3 || (Math.cos(a) < -0.96)) continue; const u = Math.cos(a) * S.A * 0.93, v = Math.sin(a) * S.B * 0.9; if (Math.abs(-u - ROAD_U) < 8) continue; F.add(st, BOX(), BRICK2, u, 0, v, 7.5, 3 + rnd() * 3, 2, -Math.atan2(Math.cos(a) * S.B, -Math.sin(a) * S.A)); } // (bỏ đoạn ở lối từ cửa hầm; trục u đã lật)
      for (let i = 0; i < 90; i++) { const a = rnd() * Math.PI * 2, k = 0.82 + rnd() * 0.12, u = Math.cos(a) * S.A * k, v = Math.sin(a) * S.B * k; if ((u < -60 && Math.abs(v) < 14) || (Math.abs(-u - ROAD_U) < 13 && Math.abs(v) > 36)) continue; F.add(wd, CONE(4), rnd() < 0.5 ? '#3e8a4c' : '#6caf55', u, 0, v, 0.8 + rnd() * 0.8, 6 + rnd() * 12, 0.8 + rnd() * 0.8); }
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
        if (Math.abs(u - ROAD_U) < 5 && Math.abs(v) > 20) continue; // (lối từ cửa hầm đi qua vòng cột)
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

    /* =============== Bước 19: thêm kiến trúc cho ba phế tích, ba đường hầm xuyên núi (design/ke-hoach-buoc-19.md) =============== */
    // chỗ trống trong một phế tích: tránh danh sách vòng tròn đã có công trình (u, v, bán kính) và lối từ cửa hầm (u = ROAD_U)
    const RINGS_C = { 1: '#d8d0bd', 0.68: '#a35c47', 0.4: '#3f3c3b' }; // (màu ba vòng tường Thành Vòng Nước)
    const freeOf = (occ, S) => (u, v, r) => Math.abs(u - ROAD_U) > r + 5 && Math.hypot(u / S.A, v / S.B) < 0.93 && occ.every(([a, b, q]) => Math.hypot(u - a, v - b) > r + q);
    const tangentRy = (a, A, B) => -Math.atan2(Math.cos(a) * B, -Math.sin(a) * A);

    /* ---------- 1. Thành Vòng Nước: khu nhà giữa các vòng, cổng tháp, nhà hát, tượng thần biển, hải đăng, cột dọc đường đắp ---------- */
    {
      const S = SITES[0], F = frame(S), st = groups.stone, gl = groups.glow, wd = groups.weed, A = S.A * 0.92, B = S.B * 0.92;
      const amph = [Math.cos(2.4) * A * 0.84, Math.sin(2.4) * B * 0.84];
      const occ = [[0, 0, 24], [amph[0], amph[1], 14], [A * 0.84, 0, 9], [A * Math.cos(0.75), B * Math.sin(0.75), 6], [A * Math.cos(0.75), -B * Math.sin(0.75), 6]];
      for (let i = 0; i < 4; i++) { const a = 0.7 + i * 1.25; occ.push([Math.cos(a) * A * 0.84, Math.sin(a) * B * 0.84, 9]); } // (xác thuyền)
      occ.push([A * 0.5, -B * 0.25, 9]);
      const free = freeOf(occ, S), WALLS = ['#e2dacb', '#d3b9a0', '#c99d86', '#e8e2d2'];
      // nhà dân giữa vòng ngoài và vòng giữa, đền nhỏ giữa vòng giữa và vòng trong: mái bằng có lan can, mái vòm đồng, mái chóp
      for (const [k, n, sc] of [[0.84, 50, 1], [0.545, 26, 0.85]]) for (let i = 0; i < n; i++) {
        const a = ((i + rnd() * 0.4) / n) * TAU, kk = k + (rnd() - 0.5) * 0.06, u = Math.cos(a) * A * kk, v = Math.sin(a) * B * kk;
        if (!free(u, v, 3.5) || (u < -12 && Math.abs(v) < 9)) continue;
        const ry = tangentRy(a, A, B), w = (3.6 + rnd() * 2) * sc, h = (3.5 + rnd() * 3) * sc, kind = Math.floor(rnd() * 3), col = WALLS[Math.floor(rnd() * 4)];
        if (rnd() < 0.18) { F.add(st, BOX(), col, u, 0, v, w, h * 0.4, w * 0.9, ry, 0, 0.15); F.add(st, BOX(), col, u + 2, 0, v + 1.5, w * 0.5, 0.8, w * 0.4, ry + 0.7, 0.3); continue; } // nhà sập
        F.add(st, BOX(), col, u, 0, v, w, h, w * 0.85, ry);
        F.add(st, BOX(), '#1d1a18', u, 0.1, v, w * 0.28, h * 0.55, w * 0.85 + 0.3, ry); // cửa
        if (kind === 0) F.add(st, BOX(), col, u, h, v, w + 0.5, 0.6, w * 0.85 + 0.5, ry);
        else if (kind === 1) F.add(st, DOME(), rnd() < 0.5 ? '#b8733d' : '#e9e2d0', u, h, v, w * 0.46, w * 0.42, w * 0.4, ry);
        else F.add(st, CONE(4), '#9a5b45', u, h, v, w * 0.72, h * 0.5, w * 0.62, ry + Math.PI / 4);
        if (rnd() < 0.2) F.add(gl, BOX(), '#ffb066', u, h * 0.55, v, w * 0.2, h * 0.2, w * 0.85 + 0.35, ry + Math.PI / 2); // cửa sổ còn ánh
      }
      // cổng tháp ở chỗ đường từ cửa hầm cắt qua ba vòng tường
      for (const [k, H] of [[1, 8], [0.68, 7], [0.4, 6]]) { const ak = A * k; if (ak <= ROAD_U) continue; const vr = B * k * Math.sqrt(1 - (ROAD_U / ak) ** 2);
        for (const s of [-1, 1]) for (const q of [-1, 1]) { F.add(st, CYL(8), RINGS_C[k], ROAD_U + q * 5.5, 0, s * vr, 2.4, H * 2, 2.4); F.add(st, CONE(8), '#b8733d', ROAD_U + q * 5.5, H * 2, s * vr, 2.8, 3, 2.8); F.add(gl, BOX(), '#ff9b52', ROAD_U + q * 5.5, H * 1.6, s * vr, 2.6, 0.5, 2.6); } }
      // nhà hát lộ thiên năm bậc ghế, sân khấu, mở về phía giữa thành
      for (let t = 0; t < 5; t++) { const R = 5 + t * 2.3; for (let j = 0; j < 12; j++) { const ph = -Math.PI / 2 + ((j + 0.5) / 12) * Math.PI, u = amph[0] + Math.cos(ph) * R, v = amph[1] + Math.sin(ph) * R; F.add(st, BOX(), t % 2 ? '#d8d0bd' : '#cbc2ad', u, 0, v, (Math.PI * R) / 12 + 0.3, 1 + t * 1.1, 2.3, -Math.atan2(Math.cos(ph), -Math.sin(ph))); } }
      F.add(st, BOX(), '#e2dccb', amph[0] - 2, 0, amph[1], 5, 1.2, 9); for (const q of [-1, 1]) F.add(st, CYL(8), '#ece6d6', amph[0] - 4, 1.2, amph[1] + q * 4, 0.6, 6, 0.6);
      // tượng thần biển đứng ở bến ngoài, cầm đinh ba, mặt nhìn ra vách kính
      { const u = A * 0.84, OR = '#c9bfa6';
        F.add(st, BOX(), '#a89f8a', u, 0, 0, 9, 3, 9); for (const q of [-1, 1]) F.add(st, BOX(), OR, u, 3, q * 1.7, 2.6, 9, 2.3);
        F.add(st, FRU(6, 0.75), OR, u, 11, 0, 3.6, 9, 4.8); F.add(st, FRU(6, 0.7), '#b8733d', u, 9.5, 0, 3.9, 2.5, 5.2);
        F.add(st, BALL(), OR, u, 22.5, 0, 2.3, 2.6, 2.2); F.add(st, CONE(6), '#b8733d', u, 24.4, 0, 2.1, 2.6, 2.1); F.add(gl, BOX(), '#ffb066', u + 2.1, 22.8, 0, 0.3, 0.4, 1.6);
        F.add(st, BOX(), OR, u, 13, -4.6, 1.6, 7.5, 1.6, 0, 0, 0.15); F.add(st, BOX(), OR, u, 17, 4.4, 1.6, 6, 1.6, 0, 0, -0.5);
        F.add(st, CYL(6), '#7b5a32', u + 0.5, 4, 6.2, 0.4, 28, 0.4); F.add(st, BOX(), '#7b5a32', u + 0.5, 31.5, 6.2, 0.5, 0.5, 4.4);
        for (const q of [-1, 0, 1]) F.add(gl, CONE(4), '#ffb066', u + 0.5, 32, 6.2 + q * 2, 0.35, 3.2, 0.35); }
      // hai hải đăng trên vòng tường ngoài, đỉnh còn sáng
      for (const s of [-1, 1]) { const u = A * Math.cos(0.75), v = s * B * Math.sin(0.75);
        F.add(st, CYL(10), '#e2dacb', u, 0, v, 3.8, 15, 3.8); F.add(st, CYL(10), '#d3b9a0', u, 15, v, 2.8, 10, 2.8); F.add(st, CYL(10), '#b8733d', u, 25, v, 3.2, 0.8, 3.2);
        F.add(gl, GEM(), '#ffcf7a', u, 25.8, v, 1.6, 2.2, 1.6); F.add(st, CONE(10), '#b8733d', u, 30, v, 2.6, 4, 2.6); }
      // cột vuông hai bên đường đắp, đầu cột đồng còn ánh
      for (let u = -A + 4; u < -20; u += 15) for (const s of [-1, 1]) { F.add(st, FRU(4, 0.55), '#e2dacb', u, 0, s * 7.5, 1.5, 13, 1.5, Math.PI / 4); F.add(gl, GEM(), '#ff9b52', u, 13, s * 7.5, 0.7, 1.2, 0.7); }
      // bậc lên gò giữa, phía vách kính
      for (let i = 0; i < 10; i++) F.add(st, BOX(), '#e2dccb', 12.5 + i * 1.6, 0, 0, 1.7, 14 - i * 1.4, 8);
      for (let i = 0; i < 46; i++) { const a = rnd() * TAU, k = [1, 0.68, 0.4][i % 3], u = Math.cos(a) * A * k, v = Math.sin(a) * B * k + 2.2; if (Math.abs(u - ROAD_U) < 13) continue; F.add(wd, CONE(4), rnd() < 0.5 ? '#3f8a52' : '#6caf55', u, 0, v, 0.7, 4 + rnd() * 6, 0.7); } // rong chân tường
    }

    /* ---------- 2. Vườn Treo: hai cung điện bên, cầu dẫn nước, sư tử đá canh cổng, đình nghỉ trong vườn ---------- */
    {
      const S = SITES[1], F0 = frame(S), F = { add: (G, geo, c, u, y, v, su, sy, sv, ry, rx, rz) => F0.add(G, geo, c, -u, y, v, su, sy, sv, Math.PI - (ry || 0), rx, -(rz || 0)) };
      const st = groups.stone, gl = groups.glow, wd = groups.weed, COL = '#d6c299';
      // hai cung điện dài hai bên vườn: dãy vòm, lan can răng cưa, ba mái vòm men lam đỉnh vàng
      for (const s of [-1, 1]) {
        const v = s * 52, u0 = 30;
        F.add(st, BOX(), '#b58a5c', u0, 0, v, 38, 10, 8); F.add(st, BOX(), '#9a6a45', u0, 10, v, 39, 1.2, 9);
        for (let i = 0; i < 8; i++) { const u = u0 - 17 + i * 4.85; F.add(st, BOX(), '#2c241f', u, 1, v - s * 4.1, 3, 6, 0.4); F.add(st, ARCH(), COL, u, 7, v - s * 4.25, 1.5, 1.5, 1.2); F.add(st, BOX(), '#9a6a45', u + 2.4, 11.2, v - s * 4.3, 1.2, 1.4, 0.8); }
        for (const q of [-1, 0, 1]) { F.add(st, CYL(10), COL, u0 + q * 12, 11.2, v, 3.4, 2, 3.4); F.add(st, DOME(), '#3a6fb8', u0 + q * 12, 13.2, v, 3.6, 3.8, 3.6); F.add(gl, GEM(), '#ffd36a', u0 + q * 12, 17, v, 0.5, 1.6, 0.5); }
      }
      // cầu dẫn nước từ vách rãnh phía giữa bể lên tầng ba (vòm đá, máng nước còn ánh lam)
      for (let i = 0; i < 6; i++) { const u = 74 + i * 4.4; F.add(st, BOX(), '#a07a52', u, 0, 0, 1.8, 23, 2.4); if (i < 5) F.add(st, ARCH(), '#a07a52', u + 2.2, 19, 0, 2.2, 2.4, 2.4); }
      F.add(st, BOX(), '#9a6a45', 84, 23, 0, 26, 1.4, 3); F.add(gl, BOX(), '#7fe3ff', 84, 24.4, 0, 26, 0.25, 1.4);
      // hai sư tử đá canh đại lộ trước cổng lam
      for (const s of [-1, 1]) { const u = -70, v = s * 13;
        F.add(st, BOX(), '#c9a77c', u, 0, v, 7, 2, 4); F.add(st, BOX(), '#d8b98c', u, 2, v, 6, 3.4, 2.8); F.add(st, BALL(), '#d8b98c', u - 3.4, 5.6, v, 2, 2, 2); F.add(st, DOME(), '#b58a5c', u - 3.1, 5, v, 2.6, 2.6, 2.6, Math.PI / 2, Math.PI / 2); F.add(gl, BOX(), '#ffd36a', u - 5.3, 6, v, 0.2, 0.4, 1.4); }
      // đình nghỉ tròn trong vườn
      const occ = [[0, 0, 70], [30, 52, 22], [30, -52, 22], [-80, 0, 16], [84, 0, 12]], free = freeOf(occ.map(([u, v, r]) => [-u, v, r]), S);
      for (let i = 0, n = 0; i < 60 && n < 7; i++) { const a = rnd() * TAU, k = 0.78 + rnd() * 0.1, u = Math.cos(a) * S.A * k, v = Math.sin(a) * S.B * k; if (Math.abs(v) < 44 || !free(-u, v, 5)) continue; n++;
        F.add(st, CYL(10), COL, u, 0, v, 4, 0.8, 4); for (let c = 0; c < 6; c++) { const ca = (c / 6) * TAU; F.add(st, CYL(6), COL, u + Math.cos(ca) * 3.2, 0.8, v + Math.sin(ca) * 3.2, 0.35, 5, 0.35); }
        F.add(st, DOME(), rnd() < 0.5 ? '#3a6fb8' : '#c99a3c', u, 5.8, v, 4, 3, 4); F.add(gl, GEM(), '#9fffd0', u, 0.8, v, 0.6, 1.4, 0.6); }
    }

    /* ---------- 3. Đô Thị Đá Khổng Lồ: cổng trời, hai tháp nhỏ, tượng nằm, nhà đá tổ ong, bãi bia khắc, tháp đá chồng ---------- */
    {
      const S = SITES[2], F = frame(S), st = groups.stone, gl = groups.glow, wd = groups.weed, STONE = '#7f877b', BAS = '#46494b', GLY = '#5ff0ff';
      // cổng trời ở đầu đại lộ
      for (const s of [-1, 1]) F.add(st, BOX(), BAS, -91, 0, s * 9.5, 3.6, 22, 3.6);
      F.add(st, BOX(), STONE, -91, 22, 0, 4.2, 3.4, 25); F.add(gl, BOX(), GLY, -93.2, 23.2, 0, 0.2, 1, 18); F.add(gl, RINGG(), GLY, -93.3, 15, 0, 3, 3, 3, Math.PI / 2);
      // hai kim tự tháp nhỏ ba bậc hai bên đại lộ
      for (const s of [-1, 1]) { [[16, 6], [11, 6], [6, 5]].forEach(([r, h], i) => F.add(st, FRU(4, 0.86), i % 2 ? '#9a9f90' : '#8a8f80', -50, i * 6, s * 44, r, h, r, Math.PI / 4)); F.add(gl, GEM(), GLY, -50, 17, s * 44, 1.4, 2.4, 1.4); }
      // người khổng lồ nằm ngửa, nửa vùi trong cát, vòng cổ khắc chữ sáng
      { const v = 46, y = -1;
        F.add(st, BOX(), STONE, -6, y, v, 15, 5.4, 9); for (const q of [-1, 1]) F.add(st, BOX(), STONE, -21, y, v + q * 2.3, 15, 3.6, 3.4);
        for (const q of [-1, 1]) F.add(st, BOX(), STONE, -5, y, v + q * 6, 13, 2.6, 2.4); F.add(st, BALL(), '#8b9286', 5.5, y + 3.2, v, 4, 3.6, 3.8); F.add(st, CONE(6), BAS, 9.5, y + 3, v, 3.4, 5, 3.4, 0, 0, -Math.PI / 2);
        F.add(gl, BOX(), GLY, 1, y + 5.5, v, 0.6, 0.3, 7.5); for (const q of [-1, 1]) F.add(gl, BOX(), GLY, 5.6, y + 6.9, v + q * 1.3, 0.8, 0.2, 0.6); }
      // nhà đá tổ ong
      const occ = [[-45, 0, 22], [-20, 0, 14], [40, 0, 40], [-50, 44, 14], [-50, -44, 14], [-8, 46, 18], [12, 26, 14], [70, 40, 13], [70, -40, 13], [84, 0, 8], [-91, 0, 14]], free = freeOf(occ, S);
      for (let i = 0, n = 0; i < 400 && n < 40; i++) { const a = rnd() * TAU, k = 0.5 + rnd() * 0.42, u = Math.cos(a) * S.A * k, v = Math.sin(a) * S.B * k, r = 2.3 + rnd() * 1.8; if (!free(u, v, r)) continue; n++; occ.push([u, v, r]);
        F.add(st, CYL(10), BAS, u, 0, v, r * 1.05, 0.8, r * 1.05); F.add(st, DOME(), rnd() < 0.5 ? STONE : '#949b8f', u, 0.8, v, r, r * 1.15, r); F.add(st, BOX(), '#1a1c1d', u, 0.8, v, r * 2.1, r * 0.8, 1.3, rnd() * TAU); if (rnd() < 0.25) F.add(gl, BOX(), GLY, u, r * 1.6, v, 0.3, 0.3, 0.3); }
      // bãi bia khắc chữ sáng hai bên vòng cột
      for (const s of [-1, 1]) for (let i = 0; i < 9; i++) { const u = 62 + (i % 3) * 7 + (rnd() - 0.5) * 2, v = s * (34 + Math.floor(i / 3) * 6); F.add(st, BOX(), BAS, u, 0, v, 2.6, 6 + rnd() * 3, 0.8, rnd() * 0.3 - 0.15, 0, (rnd() - 0.5) * 0.15); F.add(gl, BOX(), GLY, u, 2.5, v, 1.6, 0.25, 0.9); }
      // tháp đá chồng thăng bằng, đỉnh sáng
      { let y = 0; for (let i = 0; i < 7; i++) { const w = 7 - i * 0.75, h = 3 - i * 0.2; F.add(st, BOX(), i % 2 ? STONE : BAS, 84, y, 0, w, h, w * 0.8, rnd() * 0.6); y += h; } F.add(gl, GEM(), GLY, 84, y, 0, 1.2, 2.2, 1.2); }
      for (let i = 0; i < 40; i++) { const a = rnd() * TAU, k = 0.6 + rnd() * 0.33; if (Math.abs(Math.cos(a) * S.A * k - ROAD_U) < 13) continue; F.add(wd, CONE(4), rnd() < 0.5 ? '#3f7f4a' : '#7a9a4a', Math.cos(a) * S.A * k, 0, Math.sin(a) * S.B * k, 0.7, 3 + rnd() * 6, 0.7); }
    }

    /* ---------- Ba đường hầm xuyên ba núi trụ (dưới Lúa Vàng, Đá Mây, Cửa Sóng), nối ba phế tích (bước 19, 20) ----------
     * Lòng hầm là lối đi thật: sàn lát đá, tường đứng, trần vòm, cong theo cung tròn xuyên chân núi. Đá phát sáng thành cụm dọc
     * chân hai tường (lam, lục, tím, vàng cam xen nhau) và treo trên trần; ánh của đá được tính sẵn vào màu tường, sàn và hình
     * khắc (càng gần đá càng sáng, ngả màu đá), không thêm đèn thật vào cảnh. Hai bên tường là các ô chạm khắc hình thù lạ (xoắn
     * ốc, mắt, sinh vật nhiều chân, mặt trời vòng, người nhiều tay, mê cung sao), một số ô có nét khắc tự sáng.
     * Mặt đất đáy chỗ cắt qua lòng hầm được khoét khi vẽ (shader của lưới đáy), nên đứng trong hầm thấy lối đi thông suốt. */
    const STYLE = [
      { wall: '#d8d0bd', frame: '#e8e2d2', trim: '#b8733d', glow: '#ff9b52', door: '#9a6a36', road: '#cfc6b0' },
      { wall: '#93653f', frame: '#2f5fa8', trim: '#d8b04a', glow: '#ffd36a', door: '#7a5530', road: '#c9a77c' },
      { wall: '#6f776c', frame: '#8a9186', trim: '#46494b', glow: '#5ff0ff', door: '#4d5250', road: '#8f968a' },
    ];
    const TG = { pos: [], col: [], noTint: true }; // lòng hầm: tường, sàn, hình khắc (màu đã gồm ánh đá sáng)
    const PROF = (() => { // mặt cắt lòng hầm (ngang, cao): sàn → tường phải → vòm → tường trái
      const p = [];
      for (let i = 0; i <= 4; i++) p.push([-TUN_W + (2 * TUN_W * i) / 4, 0, 0, 0]);
      for (let i = 1; i <= 3; i++) p.push([TUN_W, (TUN_WALL * i) / 3, 1, 0]);
      for (let i = 1; i < 14; i++) { const a = (i / 14) * Math.PI; p.push([Math.cos(a) * TUN_W, TUN_WALL + Math.sin(a) * TUN_W, Math.cos(a), Math.sin(a)]); }
      for (let i = 3; i >= 1; i--) p.push([-TUN_W, (TUN_WALL * i) / 3, -1, 0]);
      return p;
    })();
    const GLOWS = ['#6ff6ff', '#8dffb0']; // (bước 21: hai màu lam, lục)
    const portals = [];
    const tri = (G, a, b, c, ca, cb, cc2) => { G.pos.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z); for (const k of [ca, cb, cc2]) G.col.push(k.r, k.g, k.b); };
    for (const TN of TUNNELS) {
      const v0 = TG.pos.length / 3, lights = [], span = TN.b - TN.a, NR = Math.round((span * TUN_RC) / 2.5);
      const at = (th, lat, y) => new THREE.Vector3(Math.cos(th) * (TUN_RC + lat), TUN_FLOOR + y, Math.sin(th) * (TUN_RC + lat));
      // ống hầm: các vòng mặt cắt dọc cung; tường, trần gồ ghề nhẹ (đá đẽo), sàn phẳng
      const rings = [];
      for (let i = 0; i <= NR; i++) {
        const th = TN.a + (span * i) / NR, ring = [];
        for (let j = 0; j < PROF.length; j++) { const [x, y, nx, ny] = PROF[j], end = i === 0 || i === NR, jit = end || (!nx && !ny) ? 0 : (hash(i * 31 + j * 7 + TN.k * 997) - 0.5) * (ny > 0.3 ? 1.2 : 0.5); ring.push(at(th, x + nx * jit, y + ny * jit)); }
        rings.push(ring);
      }
      const ROCK = new THREE.Color('#766d61'), FLOORC = new THREE.Color('#6d655a'), c1 = new THREE.Color(), c2 = new THREE.Color(), c3 = new THREE.Color(), c4 = new THREE.Color();
      for (let i = 0; i < NR; i++) for (let j = 0; j < PROF.length; j++) {
        const j2 = (j + 1) % PROF.length, a = rings[i][j], b = rings[i + 1][j], c = rings[i + 1][j2], d = rings[i][j2], fl = PROF[j][1] === 0 && PROF[j2][1] === 0;
        const base = fl ? FLOORC : ROCK, s = 0.85 + hash(i * 13 + j) * 0.25;
        c1.copy(base).multiplyScalar(s); c2.copy(c1); c3.copy(c1); c4.copy(c1);
        tri(TG, a, b, c, c1, c2, c3); tri(TG, a, c, d, c1, c3, c4);
      }
      // sàn lát đá dọc lối đi, rãnh hai bên
      for (let s = 1.5; s < span * TUN_RC - 1; s += 3.2) { const th = TN.a + s / TUN_RC, p = at(th, 0, 0); put(TG, BOX(), hash(s * 7 + TN.k) < 0.5 ? '#a49a88' : '#958b7a', p.x, p.y, p.z, 12.5, 0.3, 2.9, Math.atan2(-Math.sin(th), Math.cos(th))); }
      // đá phát sáng: cụm ở chân hai tường mỗi 9 bước, đá treo trên trần mỗi 18 bước
      let n = 0;
      // (bước 21: cụm đá mỗi 16 bước, ánh toả hẹp: vùng sáng quanh cụm đá xen vùng tối rõ rệt)
      for (let s = 7; s < span * TUN_RC - 4; s += 16, n++) for (const q of [-1, 1]) {
        const th = TN.a + s / TUN_RC, col = GLOWS[(n + (q > 0 ? 1 : 0) + TN.k) % 2], p = at(th, q * (TUN_W - 1.3), 0), ry = Math.atan2(-Math.sin(th), Math.cos(th));
        put(groups.glow, GEM(), col, p.x, p.y, p.z, 0.9, 2.4, 0.9, ry, 0, q * 0.25);
        put(groups.glow, GEM(), col, p.x + Math.cos(th + 0.02) * 0.6, p.y, p.z + Math.sin(th + 0.02) * 0.6, 0.6, 1.5, 0.6, ry + 1, 0, -q * 0.4);
        put(groups.glow, GEM(), col, p.x - Math.sin(th) * 1.2, p.y, p.z + Math.cos(th) * 1.2, 0.5, 1.1, 0.5, ry + 2, 0.3, q * 0.5);
        lights.push({ p: at(th, q * (TUN_W - 1.5), 2), c: new THREE.Color(col), I: 1.15 });
        if (q > 0 && n % 2 === 0) { const t2 = th + 0.5 / TUN_RC, p2 = at(t2, 0, TUN_WALL + TUN_W - 0.4), c2c = GLOWS[(n + 1 + TN.k) % 2]; put(groups.glow, GEM(), c2c, p2.x, p2.y, p2.z, 1.1, -3.2, 1.1, ry); lights.push({ p: at(t2, 0, TUN_WALL + TUN_W - 3.5), c: new THREE.Color(c2c), I: 0.6 }); }
      }
      // ô chạm khắc hai bên tường: khung nổi, hình thù lạ bên trong; ô thứ ba có nét khắc tự sáng
      let pn = 0;
      for (let s = 10.5; s < span * TUN_RC - 8; s += 12) for (const q of [-1, 1]) {
        const th = TN.a + s / TUN_RC, tx = -Math.sin(th), tz = Math.cos(th), ry = Math.atan2(-tz, tx), wall = at(th, q * (TUN_W - 0.55), 0), yc = 7.6, kind = (pn + TN.k * 2 + (q > 0 ? 3 : 0)) % 6, lit = pn % 4 === 0; pn++;
        const el = (G, geo, color, a, b, sx, sy, sz, rz, depth) => { const dd = (depth || 0) * q; put(G, geo, color, wall.x + tx * a - Math.cos(th) * dd, wall.y + yc + b, wall.z + tz * a - Math.sin(th) * dd, sx, sy, sz, ry, 0, rz || 0); };
        const C = '#cfc3a8', K = (a, b, sx, sy, sz, rz, geo) => { el(TG, geo || BOX(), C, a, b, sx, sy, sz || 0.5, rz); if (lit) el(groups.glow, geo || BOX(), GLOWS[(pn + TN.k) % 2], a, b, sx * 0.55, sy * 0.55, 0.2, rz, 0.32); };
        // nền ô tối, khung nổi
        el(TG, BOX(), '#3e3630', 0, -4.4, 9.6, 8.8, 0.25, 0, -0.1);
        el(TG, BOX(), '#b5a98f', 0, 4.4, 10, 0.5, 0.6); el(TG, BOX(), '#b5a98f', 0, -4.6, 10, 0.5, 0.6); el(TG, BOX(), '#b5a98f', -5, -4.6, 0.5, 9.5, 0.6); el(TG, BOX(), '#b5a98f', 5, -4.6, 0.5, 9.5, 0.6);
        if (kind === 0) { for (let i = 0; i < 24; i++) { const t = i / 23, r = 0.3 + t * 3.3, an = t * Math.PI * 4; K(Math.cos(an) * r, Math.sin(an) * r, 0.55, 0.55, 0.5, an); } } // xoắn ốc
        else if (kind === 1) { for (let i = 0; i <= 8; i++) { const t = -1 + i / 4, b = 1.8 * (1 - t * t); K(t * 3.4, b, 0.9, 0.35, 0.5, -t * 0.9); K(t * 3.4, -b, 0.9, 0.35, 0.5, t * 0.9); } K(0, 0, 1.1, 1.1, 1.1, 0, RINGG()); K(0, 0, 0.55, 0.55, 0.3, 0, BALL()); for (let i = 0; i < 8; i++) { const an = (i / 8) * Math.PI * 2; K(Math.cos(an) * 3.6, Math.sin(an) * 3.6 * 0.9, 0.9, 0.25, 0.5, an); } } // mắt toả tia
        else if (kind === 2) { K(0, 0, 2.6, 1.2, 0.5, 0, BALL()); K(3.1, 0.5, 0.8, 0.8, 0.5, 0, BALL()); for (let l = 0; l < 3; l++) for (const sg of [-1, 1]) K(-1.6 + l * 1.6, sg * 1.7, 0.25, 1.5, 0.5, sg * (0.5 - l * 0.4)); for (const sg of [-1, 1]) K(3.9, 0.5 + sg * 0.9, 1.4, 0.18, 0.5, sg * 0.7); for (let i = 0; i < 5; i++) K(-3 - i * 0.7, Math.sin(i) * 0.6, 0.6 - i * 0.08, 0.6 - i * 0.08, 0.5, 0, BALL()); } // sinh vật nhiều chân
        else if (kind === 3) { for (const r of [3.2, 2.2, 1.2]) K(0, 0, r, r, r, 0, RINGG()); for (let i = 0; i < 12; i++) { const an = (i / 12) * Math.PI * 2; K(Math.cos(an) * 3.9, Math.sin(an) * 3.6, 0.35, 0.8, 0.5, an - Math.PI / 2, CONE(3)); } } // mặt trời vòng
        else if (kind === 4) { K(0, -1.2, 0.9, 3.6, 0.5, 0, FRU(6, 0.6)); K(0, 2.8, 0.9, 0.9, 0.5, 0, BALL()); for (let i = 0; i < 6; i++) { const an = -0.9 + (i / 5) * 1.8; for (const sg of [-1, 1]) K(sg * (0.8 + Math.cos(an) * 1.5), 1 + Math.sin(an) * 1.6, 2.2, 0.25, 0.5, sg * an); } K(0, 4, 0.3, 0.9, 0.5, 0); } // người nhiều tay
        else { let a = -3.6, b = -3; for (let i = 0; i < 7; i++) { const h = i % 2 ? 1.6 : 0; K(a + 0.5, b + h, 1.2, 0.3, 0.5); K(a + 1.1, b + 0.8, 0.3, 1.6, 0.5); a += 1.1; b += 0.6; } for (const [a2, b2] of [[-2.6, 2.6], [2.6, 2.6], [2.8, -2.4]]) for (let i = 0; i < 4; i++) K(a2, b2, 0.3, 1.4, 0.5, (i * Math.PI) / 4); } // mê cung, sao
      }
      // ánh đá sáng tính sẵn vào màu lòng hầm (từ v0): giảm theo khoảng cách, mặt quay về phía đá sáng hơn (mặt khắc nổi khối)
      const P = TG.pos, Cc = TG.col, AMB = [0.035, 0.04, 0.05], nv = new THREE.Vector3(), e1 = new THREE.Vector3(), e2 = new THREE.Vector3();
      for (let t = v0; t < P.length / 3; t += 3) {
        e1.set(P[t * 3 + 3] - P[t * 3], P[t * 3 + 4] - P[t * 3 + 1], P[t * 3 + 5] - P[t * 3 + 2]); e2.set(P[t * 3 + 6] - P[t * 3], P[t * 3 + 7] - P[t * 3 + 1], P[t * 3 + 8] - P[t * 3 + 2]); nv.crossVectors(e1, e2).normalize();
        for (let v = t; v < t + 3; v++) {
          const x = P[v * 3], y = P[v * 3 + 1], z = P[v * 3 + 2]; let r = AMB[0], g = AMB[1], b = AMB[2];
          for (const L of lights) {
            const dx = L.p.x - x, dy = L.p.y - y, dz = L.p.z - z, d2 = dx * dx + dy * dy + dz * dz; if (d2 > 1600) continue;
            const f = (L.I / (1 + d2 / 6.5)) * (0.3 + 0.7 * Math.abs(nv.x * dx + nv.y * dy + nv.z * dz) / Math.sqrt(d2 + 1e-6));
            r += L.c.r * f; g += L.c.g * f; b += L.c.b * f;
          }
          Cc[v * 3] *= Math.min(r, 1.2); Cc[v * 3 + 1] *= Math.min(g, 1.2); Cc[v * 3 + 2] *= Math.min(b, 1.2);
        }
      }
      // hai cửa hầm ở hai đầu
      portalAt(TN, 0, rings[0]); portalAt(TN, 1, rings[NR]);
    }
    /* Cửa hầm ở một đầu (end 0: phía phế tích TN.from, bên +v; end 1: phía TN.to, bên −v): mặt đá dày có lỗ đúng hình lòng hầm,
     * khung cột có đèn, vòm viền sáng, đà ngang, bảng khắc; hai cánh cửa đồng mở rộng vào trong hầm; ba bậc đá, hai lò đèn; đường
     * lát đá có đèn từ cửa vào phế tích. Kiểu cửa theo phế tích bên đó. */
    function portalAt(TN, end, ring) {
      const S = SITES[end ? TN.to : TN.from], T = STYLE[S.k], st = groups.stone, gl = groups.glow, side = end ? -1 : 1;
      const th = end ? TN.b : TN.a, D = new THREE.Vector3(-Math.sin(th) * side, 0, Math.cos(th) * side), Lt = new THREE.Vector3(Math.cos(th), 0, Math.sin(th));
      const P0 = new THREE.Vector3(Math.cos(th) * TUN_RC, TUN_FLOOR, Math.sin(th) * TUN_RC), ry0 = Math.atan2(-Lt.z, Lt.x);
      // điểm theo khung cửa: lat ngang (theo bán kính), y cao từ sàn hầm, d > 0 ra phía lòng rãnh, d < 0 vào trong núi
      const W = (lat, y, d) => P0.clone().addScaledVector(Lt, lat).addScaledVector(D, -d).setY(TUN_FLOOR + y);
      const add = (G, geo, color, lat, y, d, sx, sy, sz, ry, rx, rz) => { const p = W(lat, y, d); put(G, geo, color, p.x, p.y, p.z, sx, sy, sz, ry0 + (ry || 0), rx, rz); };
      // mặt đá dày có lỗ hình lòng hầm: mỗi điểm mặt cắt nối ra mép chữ nhật 32 × 30 (chiếu từ tâm (0, 12))
      const wc = new THREE.Color(T.wall), wc2 = wc.clone().multiplyScalar(0.8);
      const outer = PROF.map(([x, y]) => { const dx = x, dy = y - 12; let t = 1e9; if (Math.abs(dx) > 1e-6) t = Math.min(t, 16 / Math.abs(dx)); t = Math.min(t, dy > 0 ? 18 / dy : dy < 0 ? 12 / -dy : 1e9); return [dx * t, 12 + dy * t]; });
      for (let j = 0; j < PROF.length; j++) {
        const j2 = (j + 1) % PROF.length, i0 = W(PROF[j][0], PROF[j][1], 0), i1 = W(PROF[j2][0], PROF[j2][1], 0), o0 = W(outer[j][0], outer[j][1], 0), o1 = W(outer[j2][0], outer[j2][1], 0);
        const b0 = W(outer[j][0], outer[j][1], -5), b1 = W(outer[j2][0], outer[j2][1], -5), bi0 = W(PROF[j][0], PROF[j][1], -5), bi1 = W(PROF[j2][0], PROF[j2][1], -5);
        tri(st, i0, o0, o1, wc, wc, wc); tri(st, i0, o1, i1, wc, wc, wc); tri(st, bi0, b1, b0, wc2, wc2, wc2); tri(st, bi0, bi1, b1, wc2, wc2, wc2); tri(st, o0, b0, b1, wc2, wc2, wc2); tri(st, o0, b1, o1, wc2, wc2, wc2);
      }
      for (const q of [-1, 1]) { add(st, BOX(), T.frame, q * 10.6, -0.5, 1.4, 3, 24.5, 3); add(st, BOX(), T.trim, q * 10.6, 24, 1.4, 3.8, 1.4, 3.8); add(gl, GEM(), T.glow, q * 10.6, 25.4, 1.4, 0.9, 1.8, 0.9); }
      add(st, BOX(), T.frame, 0, 25.4, 1.6, 27, 3, 4); add(st, BOX(), T.trim, 0, 28.4, 1.2, 14, 2.2, 1.6); add(gl, BOX(), T.glow, 0, 29, 0.35, 10, 0.5, 0.2);
      add(st, ARCH(), T.trim, 0, TUN_WALL, 0.9, 9.4, 9.4, 3); add(gl, ARCH(), T.glow, 0, TUN_WALL, 0.5, 8.7, 8.7, 0.5); add(gl, RINGG(), T.glow, 0, 33, 0.2, 2.6, 2.6, 2.6);
      // hai cánh cửa mở rộng vào trong hầm (bản lề ở hai mép lỗ)
      for (const [q, ang] of [[-1, 1.35], [1, 1.2]]) {
        const hinge = W(q * TUN_W, 0, -0.4), dir = Lt.clone().multiplyScalar(-q * Math.cos(ang)).addScaledVector(D, Math.sin(ang)), c = hinge.clone().addScaledVector(dir, 4), ry = Math.atan2(-dir.z, dir.x);
        put(st, BOX(), T.door, c.x, TUN_FLOOR, c.z, 7.8, 14, 0.7, ry); put(gl, BOX(), T.glow, c.x, TUN_FLOOR + 6.5, c.z, 0.4, 7, 0.8, ry); put(st, BOX(), T.trim, c.x, TUN_FLOOR + 13.6, c.z, 7.9, 0.6, 0.85, ry);
      }
      for (let i = 0; i < 3; i++) add(st, BOX(), T.frame, 0, -0.6, 2.5 + i * 2, 21 - i * 2, 1.6 - i * 0.5, 2);
      // rong trước cửa hầm che nửa lối vào (bước 21): đám rong cao hai bên và lấn vào giữa, sợi rong rủ từ đà cửa xuống
      const wd = groups.weed, WC = ['#3f8a52', '#5aa35a', '#2f6e44'];
      for (let i = 0; i < 16; i++) {
        const q = i % 2 ? 1 : -1, lat = q * (3 + rnd() * 10) - (i % 5 === 0 ? q * 6 : 0), d = 1.8 + rnd() * 6, h = 9 + rnd() * 10;
        add(wd, CONE(4), WC[i % 3], lat, -0.4, d, 0.9 + rnd() * 0.7, h, 0.9 + rnd() * 0.7, rnd() * 3);
      }
      for (let i = 0; i < 9; i++) { const lat = -9 + rnd() * 11, len = 4 + rnd() * 7; add(wd, BOX(), WC[i % 3], lat, 24.6, 0.9 + rnd() * 0.6, 0.5 + rnd() * 0.5, -len, 0.25, rnd() * 3); }
      for (const q of [-1, 1]) { add(st, CYL(8), T.trim, q * 14, -0.5, 6, 1.2, 4.5, 1.2); add(st, CYL(8), T.frame, q * 14, 4, 6, 1.8, 0.8, 1.8); add(gl, GEM(), T.glow, q * 14, 4.8, 6, 1, 1.6, 1); }
      // đường lát đá có đèn từ cửa vào phế tích (tới gần phế tích: u = ROAD_U, |v| = 22, Vườn Treo 42)
      const F = frame(S), e = F.at(ROAD_U, side * (S.k === 1 ? 42 : 22)), st0 = W(0, 0, 9), dx = e.x - st0.x, dz = e.z - st0.z, Lr = Math.hypot(dx, dz), ryR = Math.atan2(dz, dx) * -1;
      for (let s = 0, i = 0; s < Lr; s += 3.2, i++) { const x = st0.x + (dx * s) / Lr, z = st0.z + (dz * s) / Lr, g = hAt(x, z) - 0.3; put(st, BOX(), T.road, x, g, z, 3, 0.5, 7, ryR); if (i % 4 === 0) for (const q of [-1, 1]) { const lx = x - (dz / Lr) * 5 * q, lz = z + (dx / Lr) * 5 * q, lg = hAt(lx, lz) - 0.3; put(st, CYL(6), T.trim, lx, lg, lz, 0.35, 3, 0.35); put(gl, GEM(), T.glow, lx, lg + 3, lz, 0.45, 0.8, 0.45); } }
      // máy quay: trước cửa trên đường, cách 32, cao 24
      const cam = W(3, 24, 32);
      portals.push({ k: S.k, side, x: P0.x, z: P0.z, y: TUN_FLOOR + 12, cam });
    }

    /* ---------- Rong mọc trên sườn núi, quanh chân núi ---------- */
    for (let i = 0; i < 420; i++) {
      const a = hash(i * 3.1) * Math.PI * 2, r = 20 + hash(i * 5.7) * (EDGE - 26), x = Math.cos(a) * r, z = Math.sin(a) * r, y = hAt(x, z);
      if (y > TOP_MAX - 4 || portals.some((q) => Math.hypot(x - q.x, z - q.z) < 20)) continue; // (không mọc chắn cửa hầm)
      put(groups.weed, CONE(4), hash(i) < 0.5 ? '#3f7f4a' : '#7a9a4a', x, y - 0.4, z, 0.7 + hash(i * 2) * 0.9, 4 + hash(i * 9) * 10, 0.7 + hash(i * 2) * 0.9, hash(i * 4) * 3);
    }

    /* ---------- Lưới gộp ---------- */
    const meshOf = (G, mat) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(G.pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(G.col, 3)); if (G.sway) g.setAttribute('aSway', new THREE.Float32BufferAttribute(G.sway, 1)); g.computeVertexNormals(); const m = new THREE.Mesh(g, mat); deep.add(noPick(m)); return m; };
    meshOf(groups.stone, matOf());
    const glowMat = new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false });
    meshOf(groups.glow, glowMat);
    // lòng hầm: màu đã gồm ánh đá sáng, không cần đèn của cảnh (vẫn chịu sương nước sâu)
    // (chỉ vẽ khi máy quay ở dưới nước: từ trên mặt nước lòng hầm bị núi che kín)
    const tunMesh = meshOf(TG, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide })); tunMesh.visible = false;
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
    for (const v of vents) { v.y = hAt(v.x, v.z); const c = ceilAt(v.x, v.z); v.top = c == null ? TOP_MAX + 2.4 : c - 0.5; } // (dưới khối đất đỡ đảo: bọt tan ở mặt dưới khối đất)
    for (let i = 0; i < NB; i++) { const v = vents[i % vents.length]; bpos[i * 3] = v.x + (hash(i) - 0.5) * 3; bpos[i * 3 + 1] = v.y + hash(i * 7) * (v.top - v.y); bpos[i * 3 + 2] = v.z + (hash(i * 3) - 0.5) * 3; bsp.push(3 + hash(i * 11) * 5); }
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
        for (let i = 0; i < NB; i++) { const v = vents[i % vents.length]; let y = bpos[i * 3 + 1] + bsp[i] * s; if (y > v.top) { y = v.y; bpos[i * 3] = v.x + (hash(i + ts) - 0.5) * 3; bpos[i * 3 + 2] = v.z + (hash(i * 3 + ts) - 0.5) * 3; } bpos[i * 3 + 1] = y; bpos[i * 3] += Math.sin(ts * 2 + i) * 0.02; }
        bgeo.attributes.position.needsUpdate = true;
      }
      // máy quay dưới mặt nước: sương nước sâu, càng xuống càng tối
      const fog = scene.fog; if (fog && !FOG0) FOG0 = { near: fog.near, far: fog.far }; // (sương của trời: render/sky3d.js)
      const top = SEA_Y + sea3d.seaDy, p = cam.position, under = p.y < top - 0.15 && Math.hypot(p.x, p.z) < EDGE;
      if (under && fog) {
        const d = clamp((top - p.y) / (top - FLOOR), 0, 1);
        fog.near = 10; fog.far = 330 - d * 90; fog.color.copy(deepFog).lerp(darkFog, d * 0.7).multiplyScalar(1 - night * 0.55);
      } else if (wasUnder && fog && FOG0) { fog.near = FOG0.near; fog.far = FOG0.far; }
      if (under !== wasUnder) { sea3d.setUnder(under); tunMesh.visible = under; }
      wasUnder = under;
      // dưới nước góc nhìn rộng ra (62°) để thấy trọn một phế tích dài 185 trong lòng rãnh; lên mặt nước trả lại góc thường
      // (góc thường theo render/scene3d.js resize: 34°, màn hẹp 50°)
      const base = window.innerWidth < 720 ? 50 : 34, want = under ? Math.max(base, 62) : base;
      if (Math.abs(cam.fov - want) > 0.05) { cam.fov += (want - cam.fov) * Math.min(1, (dt || 16) / 400); if (Math.abs(cam.fov - want) < 0.05) cam.fov = want; cam.updateProjectionMatrix(); }
    }
    // các điểm lặn cho nút "Đáy bể" (ui/landbar.js): phế tích, rồi cửa hầm bên +v của nó (thông sang phế tích kế tiếp), lần lượt
    // máy quay phế tích: trong lòng rãnh phía vách kính (cách tâm 92 theo trục, cao hơn đáy rãnh 80: dưới vòm đất đỡ đảo)
    const stops = [];
    for (const S of SITES) {
      const y = hAt(S.x, S.z) + 12; stops.push({ name: S.name, x: S.x, z: S.z, y, cam: new THREE.Vector3(S.x + S.ux * 92, y + 68, S.z + S.uz * 92) });
      const P = portals.find((q) => q.k === S.k && q.side > 0), j = (2 * S.k + 2) % 6;
      stops.push({ name: 'Hầm xuyên núi dưới ' + lands[j].T.city, x: P.x, z: P.z, y: P.y, cam: P.cam });
      // trong lòng hầm: máy quay giữa lối đi ở 30% chiều dài, nhìn dọc lối đi tới 50% (cao ngang tầm hình khắc)
      const TN = TUNNELS[S.k], t1 = TN.a + (TN.b - TN.a) * 0.3, t2 = TN.a + (TN.b - TN.a) * 0.5;
      stops.push({ name: 'Trong hầm dưới ' + lands[j].T.city, x: Math.cos(t2) * TUN_RC, z: Math.sin(t2) * TUN_RC, y: TUN_FLOOR + 6.5, cam: new THREE.Vector3(Math.cos(t1) * TUN_RC, TUN_FLOOR + 9.5, Math.sin(t1) * TUN_RC) });
    }
    const out = { animate, stops, heightAt: hAt, group: deep, FLOOR };
    return out;
  }
  BK.Deep3D = { create };
})(typeof self !== 'undefined' ? self : globalThis);
