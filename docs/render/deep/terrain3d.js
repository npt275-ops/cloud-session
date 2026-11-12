/* Bể Kính · render/deep/terrain3d.js · Địa hình đáy bể (design/ke-hoach-buoc-18.md, 19, 20)
 * Đáy bể là một vùng đất liền chìm sâu dưới mặt biển: núi cao gấp nhiều lần núi trên đảo, ba khối núi trụ đỡ ba đảo Lúa Vàng,
 * Đá Mây, Cửa Sóng, một khối núi giữa bể. Giữa các núi là ba rãnh sâu sát đáy kính (SITES, mỗi rãnh một phế tích, nằm dưới
 * Thông Xanh, Tuyết Trắng, Cát Hồng). Ở đây: hàm cao độ hAt, vị trí ba rãnh, ba đường hầm (TUNNELS, chỉ số học), lưới mặt đáy
 * (khoét chỗ lòng hầm khi vẽ), mặt cắt đất sát vách kính, khối đất đỡ ba đảo trên rãnh (ceilAt: mặt dưới của nó).
 * Cần: three.js, render/map/map3d.js (đảo), sea3d.js. Gọi từ render/deep3d.js. */
(function (root) {
  'use strict';
  const BK = root.BK || (root.BK = {});
  // D: ngữ cảnh chung của đáy bể (render/deep3d.js); phần này đọc từ D và ghi thêm vào D những gì phần sau dùng
  function build(D) {
    const { THREE, scene, lands3d, sea3d, clamp } = D;
    const SEA_Y = sea3d.SEA_Y,
      FLOOR = sea3d.FLOOR_Y,
      lands = lands3d.lands;
    // khối đất phủ tới sát vách kính nhưng nằm trọn bên trong vách nước (sea3d.js EDGE_R): nhìn từ ngoài bể, mặt cắt đất đá cũng
    // được màu nước biển phủ lên như mọi thứ khác trong bể, không lòi ra ngoài kính
    const EDGE = sea3d.EDGE_R - 0.3;
    const TOP_MAX = SEA_Y - 3.2; // ngoài chân đảo không gì ở đáy cao quá chừng này (đáy sóng sâu nhất khoảng -3)
    const ISLE_TOP = -2.7; // đỉnh núi trụ và mặt trên khối đất đỡ đảo: sát mặt dưới đảo (vách đảo xuống tới -2,62)
    const deep = new THREE.Group();
    deep.name = 'đáy bể';
    scene.add(deep);
    const hash = (n) => {
      const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
      return x - Math.floor(x);
    };

    /* =============== Địa hình đáy =============== */
    const n2 = (x, z) => Math.sin(x * 0.071 + Math.sin(z * 0.053) * 1.7) * Math.cos(z * 0.067 - Math.sin(x * 0.041) * 1.3);
    const fbm = (x, z) => n2(x, z) * 0.55 + n2(x * 2.1 + 17, z * 2.1 - 9) * 0.28 + n2(x * 4.3 - 31, z * 4.3 + 5) * 0.17;
    const ridge = (x, z) => 1 - Math.abs(n2(x * 1.7 + 3, z * 1.7 - 7));
    const polar = (a, r) => ({ x: Math.cos(a) * r, z: Math.sin(a) * r });
    // ba rãnh có phế tích: dưới đảo 1, 3, 5, tâm cách giữa bể 130; trục dài theo bán kính (96), ngang 68
    const SITES = [1, 3, 5].map((j, k) => {
      const a = lands[j].ang,
        c = polar(a, 130);
      return { k, a, x: c.x, z: c.z, ux: Math.cos(a), uz: Math.sin(a), A: 96, B: 68 };
    });
    const TAU = Math.PI * 2;
    const ROAD_U = 30; // đường lát đá từ hai cửa hầm (hai bên rãnh) vào phế tích chạy ở u = 30 (bước 19)
    const local = (S, x, z) => {
      const dx = x - S.x,
        dz = z - S.z;
      return { u: dx * S.ux + dz * S.uz, v: -dx * S.uz + dz * S.ux };
    };
    /* ---------- Ba đường hầm (bước 20, design/ke-hoach-buoc-20.md): tính trước để đắp đất phủ kín vòm hầm ----------
     * Mỗi hầm là một cung tròn quanh giữa bể (bán kính TUN_RC), xuyên chân núi trụ dưới đảo 0, 2, 4, nối cửa bên +v của phế
     * tích k với cửa bên −v của phế tích kế tiếp. Lòng hầm: sàn phẳng rộng 16, tường đứng cao 14, trần vòm bán kính 8 (cao 22). */
    const TUN_RC = 172,
      TUN_W = 8,
      TUN_WALL = 14,
      TUN_FLOOR = FLOOR + 1.6,
      TUN_TOP = TUN_FLOOR + TUN_WALL + TUN_W;
    // góc lệch từ trục phế tích tới cửa hầm: điểm trên cung TUN_RC nằm sát chân vách rãnh (e = 0,985)
    const TUN_D = (() => {
      const S = SITES[0];
      let lo = 0.1,
        hi = 0.8;
      for (let i = 0; i < 40; i++) {
        const m = (lo + hi) / 2,
          L = local(S, Math.cos(S.a + m) * TUN_RC, Math.sin(S.a + m) * TUN_RC);
        if (Math.hypot(L.u / S.A, L.v / S.B) < 0.985) lo = m;
        else hi = m;
      }
      return lo;
    })();
    const TUNNELS = SITES.map((S, k) => ({
      k,
      from: k,
      to: (k + 1) % 3,
      pillar: (2 * k + 2) % 6,
      a: S.a + TUN_D,
      b: S.a + (2 * Math.PI) / 3 - TUN_D,
    }));
    for (const TN of TUNNELS) {
      TN.mid = (TN.a + TN.b) / 2;
      TN.half = (TN.b - TN.a) / 2;
    }
    const angOff = (a, b) => {
      let d = a - b;
      while (d > Math.PI) d -= 2 * Math.PI;
      while (d < -Math.PI) d += 2 * Math.PI;
      return d;
    };
    // núi: { x, z, R bán kính chân, top đỉnh, pl phần đỉnh bằng, p độ nhọn }; núi trụ đỡ đảo thêm isle: đỉnh bằng đúng theo mép
    // đảo đó (L.rOf, rộng hơn 3%), sườn đổ xuống đáy ở cách tâm đảo 100; đỉnh không gồ ghề (đảo đặt kín lên núi, không hở nước)
    const PEAKS = [];
    for (const j of [0, 2, 4]) {
      // núi trụ đỡ đảo: đỉnh bằng ngay dưới đáy đảo (khối đá nón ngược dưới đảo nằm gọn trong núi)
      const a = lands[j].ang,
        c = lands[j].center;
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
        const dd = Math.hypot(x - P.x, z - P.z);
        if (dd >= P.R) continue;
        let t;
        if (P.isle) {
          const r0 = P.isle.rOf(Math.atan2(z - P.z, x - P.x)) * 1.03;
          t = dd <= r0 ? 0 : (dd - r0) / (P.R - r0);
        } else {
          const d = dd / P.R;
          t = d <= P.pl ? 0 : (d - P.pl) / (1 - P.pl);
        }
        const f = Math.pow(1 - t, P.p),
          rough = 1 - 0.12 * (1 - ridge(x, z)) * Math.min(1, t * 4); // (đỉnh bằng không gồ ghề)
        h = Math.max(h, FLOOR + (P.top - FLOOR) * f * rough + (t > 0 ? fbm(x * 1.9, z * 1.9) * 5 * f * Math.min(1, t * 4) : 0));
      }
      for (const S of SITES) {
        // rãnh: đáy phẳng sát kính, vách dựng; một khe hẹp chạy tiếp dọc trục vào phía giữa bể
        const L = local(S, x, z),
          e = Math.hypot(L.u / S.A, L.v / S.B);
        h = Math.min(h, FLOOR + 1.4 + (e < 1 ? 0 : Math.pow(e - 1, 0.7) * 170) + fbm(x * 3, z * 3) * 0.5);
        // (phía vách kính khe nông dần và khép lại trước vách: nhìn từ ngoài bể chỉ thấy khối đất liền)
        h = Math.min(
          h,
          FLOOR + 3 + Math.max(0, Math.abs(L.v) - 5) * 7 + Math.max(0, -L.u - S.A - 50) * 0.5 + Math.max(0, L.u - S.A + 5) * 6,
        );
      }
      // hầm: đất trên lòng hầm đắp cao hơn trần vòm 9 (lan ra hai bên); nền trước hai cửa phẳng (vách dựng không chọc mũi đất ra
      // trước ngưỡng cửa)
      const r = Math.hypot(x, z),
        th = Math.atan2(z, x),
        off = Math.abs(r - TUN_RC);
      for (const TN of TUNNELS) {
        // ex > 0: ngoài hai đầu hầm (bước). Chỗ đất đắp dốc lên nằm từ 5 bước trong miệng hầm trở vào (sau mặt đá cửa, lòng
        // hầm được khoét): lưới đất thưa không chìa mặt dốc ra trước ngưỡng cửa
        const ex = (Math.abs(angOff(th, TN.mid)) - TN.half) * TUN_RC;
        if (ex <= -5 && off < 34) h = Math.max(h, TUN_TOP + 9 - Math.max(0, off - 11) * 2.5);
        else if (ex > -5 && ex < 18 && off < (ex < 0 ? 15.5 : 17)) h = Math.min(h, FLOOR + 1.4);
      }
      return clamp(h, FLOOR + 0.8, ISLE_TOP);
    }

    const tmpC = new THREE.Color(),
      deepC = new THREE.Color('#0f4a63');
    const depthTint = (c, y) => c.lerp(deepC, clamp((SEA_Y - y) / 150, 0, 1) * 0.42);
    const matOf = (o) =>
      new THREE.MeshStandardMaterial(
        Object.assign(
          { vertexColors: true, flatShading: true, roughness: 0.92, metalness: 0.02, emissive: '#0b2c44', emissiveIntensity: 0.4 },
          o || {},
        ),
      );
    const noPick = (m) => {
      m.raycast = () => {};
      m.castShadow = m.receiveShadow = false;
      m.matrixAutoUpdate = false;
      m.updateMatrix();
      return m;
    };
    {
      const NR = 100,
        NS = 256,
        pos = [],
        col = [],
        idx = [];
      const SAND = new THREE.Color('#c4b48a'),
        ROCK = new THREE.Color('#6c665c'),
        DARK = new THREE.Color('#47443f'),
        MOSS = new THREE.Color('#5c7652'),
        CORAL = new THREE.Color('#c07b6c');
      pos.push(0, hAt(0, 0), 0);
      depthTint(tmpC.copy(ROCK), pos[1]);
      col.push(tmpC.r, tmpC.g, tmpC.b);
      for (let k = 1; k <= NR; k++)
        for (let j = 0; j < NS; j++) {
          const r = (EDGE * k) / NR,
            a = (j / NS) * Math.PI * 2 + (k % 2) * (Math.PI / NS),
            x = Math.cos(a) * r,
            z = Math.sin(a) * r,
            y = hAt(x, z);
          const sl = Math.hypot(hAt(x + 1.2, z) - hAt(x - 1.2, z), hAt(x, z + 1.2) - hAt(x, z - 1.2)) / 2.4,
            up = (y - FLOOR) / (SEA_Y - FLOOR);
          tmpC
            .copy(SAND)
            .lerp(MOSS, clamp((up - 0.15) * 3, 0, 1) * 0.7)
            .lerp(ROCK, clamp(sl * 0.9 - 0.2, 0, 1))
            .lerp(DARK, clamp(sl - 1.2, 0, 1) * 0.7);
          if (up > 0.8 && hash(k * 977 + j) > 0.55) tmpC.lerp(CORAL, 0.45); // san hô gần mặt nước
          tmpC.multiplyScalar(0.92 + hash(k * 31 + j * 7) * 0.12);
          depthTint(tmpC, y);
          pos.push(x, y, z);
          col.push(tmpC.r, tmpC.g, tmpC.b);
        }
      const id = (k, j) => (k === 0 ? 0 : 1 + (k - 1) * NS + (((j % NS) + NS) % NS));
      for (let j = 0; j < NS; j++) idx.push(0, id(1, j + 1), id(1, j));
      for (let k = 1; k < NR; k++)
        for (let j = 0; j < NS; j++) {
          const o = k % 2;
          idx.push(id(k, j), id(k + 1, j + 1 - o), id(k + 1, j - o), id(k, j), id(k, j + 1), id(k + 1, j + 1 - o));
        }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
      g.setIndex(idx);
      g.computeVertexNormals();
      // khoét mặt đất chỗ cắt qua lòng ba đường hầm (và 4 bước trước hai cửa, trên mặt sàn): đứng trong hầm thấy lối đi thông
      const tm = matOf({ roughness: 0.97, side: THREE.DoubleSide }),
        gl3 = (v) => v.toFixed(5),
        ext = 4 / TUN_RC;
      const tunCheck = TUNNELS.map(
        (TN) =>
          `{ float d = th - ${gl3(TN.mid)}; d = mod(d + 3.14159265, 6.2831853) - 3.14159265; if (abs(d) < ${gl3(TN.half + ext)}) discard; }`,
      ).join('\n');
      tm.onBeforeCompile = (sh) => {
        sh.vertexShader =
          'varying vec3 vWP;\n' +
          sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvWP = (modelMatrix * vec4(transformed, 1.0)).xyz;');
        sh.fragmentShader =
          'varying vec3 vWP;\n' +
          sh.fragmentShader.replace(
            '#include <clipping_planes_fragment>',
            '#include <clipping_planes_fragment>\n' +
              `{ float r = length(vWP.xz), th = atan(vWP.z, vWP.x), lx = r - ${gl3(TUN_RC)}, ly = vWP.y - ${gl3(TUN_FLOOR)};
  if (abs(lx) < ${gl3(TUN_W + 0.6)} && ly > -0.12 && (ly < ${gl3(TUN_WALL)} || lx * lx + (ly - ${gl3(TUN_WALL)}) * (ly - ${gl3(TUN_WALL)}) < ${gl3((TUN_W + 0.6) ** 2)})) {\n${tunCheck}\n} }`,
          );
      };
      tm.customProgramCacheKey = () => 'deepFloorTunnels';
      const m = new THREE.Mesh(g, tm);
      m.name = 'đáy';
      deep.add(noPick(m));
      // mặt cắt khối đất sát vách kính: từ mép đất (đúng các đỉnh vòng ngoài) xuống đáy kính, tầng đất đá xen nhau; tấm đáy kín
      // bên dưới. Đất, núi là một khối liền: nhìn từ ngoài bể không nhìn xuyên qua được.
      const sp = [],
        sc = [],
        si = [],
        STRATA = ['#5a4a3b', '#6d5a45', '#4b4038', '#7a6650', '#55493e'].map((h) => new THREE.Color(h)),
        NL = 26;
      for (let j = 0; j < NS; j++) {
        const a = (j / NS) * Math.PI * 2,
          x = Math.cos(a) * EDGE,
          z = Math.sin(a) * EDGE,
          top = pos[(1 + (NR - 1) * NS + j) * 3 + 1];
        for (let l = 0; l <= NL; l++) {
          const y = top - (top - FLOOR) * (l / NL);
          sp.push(x, y, z);
          const band = Math.floor((y - FLOOR + Math.sin(a * 7) * 3 + Math.sin(a * 23) * 1.2) / 5.5);
          tmpC.copy(STRATA[((band % 5) + 5) % 5]).multiplyScalar(0.9 + hash(j * 13 + l) * 0.16);
          if (l === 0) tmpC.lerp(new THREE.Color('#5c7652'), 0.35);
          sc.push(tmpC.r, tmpC.g, tmpC.b);
        }
      }
      const sid = (j, l) => (((j % NS) + NS) % NS) * (NL + 1) + l;
      for (let j = 0; j < NS; j++)
        for (let l = 0; l < NL; l++) si.push(sid(j, l), sid(j + 1, l), sid(j, l + 1), sid(j + 1, l), sid(j + 1, l + 1), sid(j, l + 1));
      const cen = sp.length / 3;
      sp.push(0, FLOOR + 0.2, 0);
      sc.push(0.28, 0.24, 0.2);
      const rimFloor = sp.length / 3;
      for (let j = 0; j < NS; j++) {
        const a = (j / NS) * Math.PI * 2;
        sp.push(Math.cos(a) * EDGE, FLOOR + 0.2, Math.sin(a) * EDGE);
        sc.push(0.3, 0.25, 0.21);
      }
      for (let j = 0; j < NS; j++) si.push(cen, rimFloor + j, rimFloor + ((j + 1) % NS));
      const sg = new THREE.BufferGeometry();
      sg.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
      sg.setAttribute('color', new THREE.Float32BufferAttribute(sc, 3));
      sg.setIndex(si);
      sg.computeVertexNormals();
      const sm = new THREE.Mesh(sg, matOf({ roughness: 1, side: THREE.DoubleSide, emissiveIntensity: 0.18 }));
      sm.name = 'mặt cắt đất';
      deep.add(noPick(sm));
    }

    /* =============== Khối đất đỡ ba đảo nằm trên rãnh (Thông Xanh, Tuyết Trắng, Cát Hồng) ===============
     * Một dải đất đá liền chạy theo vòng đảo từ núi trụ bên này sang núi trụ bên kia, đi qua ngay dưới đảo: mặt trên sát mặt
     * dưới đảo (-2,7), võng xuống giữa hai đảo; dưới đảo dày tới -44 (bao trọn khối đá nón ngược dưới đảo), hai cánh đổ chéo
     * xuống cắm vào sườn hai núi. Bên dưới vẫn hở: rãnh và phế tích nằm dưới vòm đất này. */
    const SAD_R = lands3d.RING,
      SPAN = Math.PI / 3;
    const sadW = (s) => {
      const q = Math.abs(s);
      return q < 0.42 ? 74 : 74 - ((q - 0.42) / 0.58) * 26;
    };
    const sadTop = (s) => {
      const q = Math.abs(s);
      return ISLE_TOP - 6 * Math.max(0, Math.sin(clamp((q - 0.42) / 0.5, 0, 1) * Math.PI));
    };
    const sadBot = (s) => {
      const q = Math.abs(s),
        k = clamp((q - 0.3) / 0.15, 0, 1),
        arm = -36 - 60 * Math.pow(clamp((q - 0.38) / 0.62, 0, 1), 1.3);
      return -44 + (arm + 44) * k * k * (3 - 2 * k);
    };
    const angDiff = (a, b) => {
      let d = a - b;
      while (d > Math.PI) d -= Math.PI * 2;
      while (d < -Math.PI) d += Math.PI * 2;
      return d;
    };
    // dưới khối đất đỡ đảo? trả cao độ mặt dưới khối đất (bọt khí tan ở đó), không thì null
    const ceilAt = (x, z) => {
      const r = Math.hypot(x, z),
        a = Math.atan2(z, x);
      for (const S of SITES) {
        const s = angDiff(a, S.a) / SPAN;
        if (Math.abs(s) < 1 && Math.abs(r - SAD_R) < sadW(s)) return sadBot(s);
      }
      return null;
    };
    {
      const NSs = 96,
        NT = 44,
        pos = [],
        col = [],
        idx = [];
      const ROCK = new THREE.Color('#6a6156'),
        DARK = new THREE.Color('#47403a'),
        MOSS = new THREE.Color('#5c7652');
      for (const S of SITES) {
        const base = pos.length / 3;
        for (let i = 0; i <= NSs; i++) {
          const s = -1 + (2 * i) / NSs,
            a = S.a + s * SPAN,
            nx = Math.cos(a),
            nz = Math.sin(a),
            W = sadW(s),
            top = sadTop(s),
            bot = sadBot(s),
            yc = (top + bot) / 2,
            hh = (top - bot) / 2;
          for (let k = 0; k < NT; k++) {
            const th = (k / NT) * Math.PI * 2,
              c = Math.cos(th),
              sn = Math.sin(th);
            let t = Math.sign(c) * Math.pow(Math.abs(c), 0.35) * W,
              y = yc + Math.sign(sn) * Math.pow(Math.abs(sn), 0.45) * hh;
            const wx = nx * (SAD_R + t),
              wz = nz * (SAD_R + t),
              onTop = sn > 0.2;
            if (!onTop) {
              const n = fbm(wx * 1.6, wz * 1.6 + y * 0.3);
              t += n * 4 * Math.sign(c);
              y += n * 3 * (sn < -0.2 ? 1 : 0.4);
            } else y = Math.min(y, top);
            const r = SAD_R + t;
            pos.push(nx * r, y, nz * r);
            tmpC
              .copy(onTop ? MOSS : ROCK)
              .lerp(DARK, onTop ? 0.1 : clamp(0.3 + fbm(wx * 3, y) * 0.5, 0, 0.8))
              .multiplyScalar(0.9 + hash(i * 57 + k + S.k * 7) * 0.15);
            depthTint(tmpC, y);
            col.push(tmpC.r, tmpC.g, tmpC.b);
          }
        }
        for (let i = 0; i < NSs; i++)
          for (let k = 0; k < NT; k++) {
            const a0 = base + i * NT + k,
              a1 = base + i * NT + ((k + 1) % NT),
              b0 = a0 + NT,
              b1 = a1 + NT;
            idx.push(a0, b0, a1, a1, b0, b1);
          }
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
      g.setIndex(idx);
      g.computeVertexNormals();
      const m = new THREE.Mesh(g, matOf({ roughness: 0.96, side: THREE.DoubleSide }));
      m.name = 'khối đất đỡ đảo';
      deep.add(noPick(m));
    }
    Object.assign(D, {
      SEA_Y,
      FLOOR,
      lands,
      EDGE,
      TOP_MAX,
      deep,
      hash,
      polar,
      SITES,
      TAU,
      ROAD_U,
      TUN_RC,
      TUN_W,
      TUN_WALL,
      TUN_FLOOR,
      TUNNELS,
      hAt,
      depthTint,
      matOf,
      noPick,
      ceilAt,
    });
  }
  BK.DeepTerrain = { build };
})(typeof self !== 'undefined' ? self : globalThis);
