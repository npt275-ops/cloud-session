(function (root) {
  'use strict';
  const BK = root.BK || (root.BK = {});
  /* Bể Kính · render/map/terrain3d.js
   * Dáng đất riêng của sáu miền: mép đảo (shapeOf), phần đất đá phía dưới đảo (underside), mặt đảo, hồ sẵn có của từng
   * miền, dãy núi Đá Mây, đầm phá Cửa Sóng, ốc đảo Cát Hồng (terrain). Không có sông. Hồ, đầm, ốc đảo là lỗ thủng xuyên đảo
   * xuống biển (L.addHole: render/map/height3d.js). Dải bờ cát, hẻm núi đánh dấu để gộp lại (render/map/water3d.js).
   * Cần: render/map/shared3d.js, render/map/mountains3d.js. */
  function create(X, MT) {
    const {
        THREE,
        TAU,
        C,
        clamp,
        hash,
        LAND_R,
        RING,
        SC,
        UBOX,
        UCYL,
        UCONE,
        TCYL,
        DOME,
        ICO,
        DOD,
        OCT,
        GABLE,
        TORUS,
        VAULT,
        SPHG,
        Kit,
        mergeG,
        bodyMat,
        metalMat,
        meshOf,
        disposeGroup,
        pick,
        TSTYLE,
        landRng,
      } = X,
      { MOUNTAIN_STYLES, mountainOn } = MT;
    // Mép đảo: nửa nhìn ra biển trong luôn tròn (cầu, bến cá, cảng gắn vào đó); nửa ngoài mỗi miền một dáng riêng
    function shapeOf(L) {
      const oa = Math.atan2(L.out.z, L.out.x),
        rnd = landRng(L.i + 300),
        noise = Array.from({ length: 24 }, () => rnd() - 0.5);
      const nz = (u) => {
        const t = ((((u / TAU) % 1) + 1) % 1) * 24,
          i = Math.floor(t),
          f = t - i;
        return noise[i % 24] * (1 - f) + noise[(i + 1) % 24] * f;
      };
      const tri = (x) => 1 - 2 * Math.abs(((((x / Math.PI) % 2) + 2) % 2) - 1);
      const G = {
        plains: (u) => 0.06 * Math.cos(u * 1.6) + 0.025 * Math.sin(u * 5),
        forest: (u) => 0.12 * Math.max(0, Math.cos(u * 3.3)) - 0.02 + 0.05 * nz(u * 3),
        mountain: (u) => 0.07 + 0.07 * tri(u * 5.5) + 0.06 * nz(u * 5),
        tundra: (u) => -0.02 + 0.045 * Math.sin(u * 9 + 1) + 0.06 * nz(u * 7),
        coast: (u) => 0.12 * Math.cos(u * 0.9),
        desert: (u) => 0.05 + 0.06 * tri(u * 3.2),
      }[L.ter];
      L.oa = oa;
      L.rOf = (a) => {
        const u = Math.atan2(Math.sin(a - oa), Math.cos(a - oa)),
          w = clamp((1.95 - Math.abs(u)) / 0.7, 0, 1);
        return LAND_R * (1 + w * w * (3 - 2 * w) * G(u));
      };
      L.inside = (x, z, m) => Math.hypot(x, z) < L.rOf(Math.atan2(z, x)) - (m || 0);
      L.outerRel = (x, z) => {
        const a = Math.atan2(z, x);
        return Math.abs(Math.atan2(Math.sin(a - oa), Math.cos(a - oa)));
      };
      L.props = []; // những khối lớn (đồi, núi, hồ, mỏm đá) mà người, thú và cây phải tránh
      L.blockedWild = (x, z, r) => L.props.some((q) => (q.x - x) ** 2 + (q.z - z) ** 2 < (q.r + (r || 0)) ** 2);
      // đường của đảo (render/build/roads.js isleSegs), tính ngay từ lúc dựng đất: núi, hồ, đá, cây đều tránh, đường luôn thông
      L.roadSegs = BK.Roads3D ? BK.Roads3D.isleSegs(L) : null;
      L.roadW = BK.Roads3D ? BK.Roads3D.HALF : 1.9;
      L.onRoad = (x, z, r) => !!L.roadSegs && BK.Roads3D.hits(L.roadSegs, x, z, r, L.roadW + 0.6);
      // dải cong đã trải trên mặt đảo (bãi cát, hẻm núi: ribbon) [x, z, nửa bề rộng]: hồ không thủng vào
      L.dry = [];
      // một đường viền hồ [[x, z], ...] đặt được không: cả viền ở vành giữa làng (bán kính 28) và dải mép đảo (cách mép 6: tường,
      // cầu tàu, bãi đá), không lấn đường (chừa chỗ đèn, cây ven đường), khối lớn (L.props, gồm các hồ đã có) hay dải cong nào
      // (render/map/relief3d.js cũng dùng)
      L.holeFits = (pts) =>
        pts.every(
          ([x, z]) =>
            Math.hypot(x, z) > 28 &&
            L.inside(x, z, 6) &&
            !L.onRoad(x, z, 1.5) &&
            !L.blockedWild(x, z, 0.3) &&
            !L.dry.some(([a, b, w]) => (a - x) ** 2 + (b - z) ** 2 < (w + 0.6) ** 2),
        );
    }
    // phần đất đá phía dưới đảo: dựng theo đúng mép đảo, mỗi miền một kiểu vân
    const UNDER = {
      plains: {
        lv: [
          [-2.6, 1],
          [-7, 0.86],
          [-13, 0.68],
          [-20, 0.46],
          [-27, 0.24],
          [-32, 0.08],
        ],
        jit: 0.06,
      },
      forest: {
        lv: [
          [-2.6, 1],
          [-6, 0.9],
          [-12, 0.7],
          [-19, 0.48],
          [-26, 0.26],
          [-31, 0.08],
        ],
        jit: 0.1,
      },
      mountain: {
        lv: [
          [-2.6, 1],
          [-9, 0.92],
          [-17, 0.7],
          [-27, 0.46],
          [-37, 0.24],
          [-46, 0.06],
        ],
        jit: 0.16,
      },
      tundra: {
        lv: [
          [-2.6, 1],
          [-5, 0.94],
          [-10, 0.74],
          [-16, 0.5],
          [-22, 0.26],
          [-27, 0.06],
        ],
        jit: 0.12,
      },
      coast: {
        lv: [
          [-2.6, 1],
          [-6, 0.88],
          [-11, 0.7],
          [-17, 0.5],
          [-23, 0.28],
          [-28, 0.08],
        ],
        jit: 0.08,
      },
      desert: {
        lv: [
          [-2.6, 1],
          [-8, 0.97],
          [-12, 0.86],
          [-15, 0.6],
          [-17, 0.3],
          [-18, 0.05],
        ],
        jit: 0.07,
      },
    };
    function underside(L, st) {
      const U = UNDER[L.ter],
        N = 72,
        rnd = landRng(L.i + 77),
        rings = [];
      U.lv.forEach(([y, sc], j) => {
        const ring = [];
        for (let k = 0; k < N; k++) {
          const a = (k / N) * TAU,
            jit = j === 0 ? 0 : (rnd() - 0.5) * U.jit * 2;
          const r = L.rOf(a) * sc * (1 + jit);
          ring.push([Math.cos(a) * r, y + (j === 0 ? 0 : (rnd() - 0.5) * 2.2), Math.sin(a) * r]);
        }
        rings.push(ring);
      });
      const pos = [],
        col = [],
        strata = st.rock.map((h) => C(h));
      const push = (p, j) => {
        pos.push(p[0], p[1], p[2]);
        const c = strata[clamp(j, 0, strata.length - 1)];
        col.push(c.r, c.g, c.b);
      };
      for (let j = 0; j < rings.length - 1; j++)
        for (let k = 0; k < N; k++) {
          const a = rings[j][k],
            b = rings[j][(k + 1) % N],
            c2 = rings[j + 1][k],
            d = rings[j + 1][(k + 1) % N];
          push(a, j);
          push(b, j);
          push(c2, j + 1);
          push(b, j);
          push(d, j + 1);
          push(c2, j + 1);
        }
      const last = rings[rings.length - 1],
        tip = [0, U.lv[U.lv.length - 1][0] - (L.ter === 'desert' ? 0.5 : 5), 0];
      for (let k = 0; k < N; k++) {
        push(last[k], rings.length - 1);
        push(last[(k + 1) % N], rings.length - 1);
        push(tip, rings.length);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
      g.computeVertexNormals();
      const m = new THREE.Mesh(
        g,
        new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.95, side: THREE.DoubleSide }),
      );
      L.g.add(m);
      // (lỗ hồ thủng cả phần này: render/map/height3d.js holes) độ sâu mặt dưới đảo tại (x, z): theo các vòng bậc đá
      L.underMat = m.material;
      L.underY = (x, z) => {
        const sc = Math.hypot(x, z) / L.rOf(Math.atan2(z, x)),
          lv = U.lv;
        for (let j = 0; j + 1 < lv.length; j++)
          if (sc >= lv[j + 1][1]) return lv[j][0] + ((lv[j + 1][0] - lv[j][0]) * (lv[j][1] - sc)) / (lv[j][1] - lv[j + 1][1]);
        return lv[lv.length - 1][0];
      };
      // nét riêng bên dưới: rễ cây rủ, băng nhũ, san hô, vân đá đỏ
      const k = new Kit(),
        at = (a, r, y) => [Math.cos(a) * r, y, Math.sin(a) * r];
      if (L.ter === 'forest')
        for (let i = 0; i < 26; i++) {
          const a = rnd() * TAU,
            r = L.rOf(a) * (0.7 + rnd() * 0.25),
            [x, , z] = at(a, r, 0),
            h = 4 + rnd() * 9;
          k.add(
            UCYL(5),
            pick(['#5b4630', '#6b4b32', '#4a3826'], rnd()),
            x,
            -2.8 - h,
            z,
            0.18,
            h,
            0.18,
            0,
            (rnd() - 0.5) * 0.4,
            (rnd() - 0.5) * 0.4,
          );
        }
      if (L.ter === 'tundra')
        for (let i = 0; i < 40; i++) {
          const a = rnd() * TAU,
            r = L.rOf(a) * (0.55 + rnd() * 0.42),
            [x, , z] = at(a, r, 0),
            h = 2 + rnd() * 6;
          k.add(UCONE(5), pick(['#cfeaf5', '#b9e0ef', '#e6f6fb'], rnd()), x, -2.6, z, 0.5 + rnd() * 0.5, -h, 0.5 + rnd() * 0.5);
        }
      if (L.ter === 'coast')
        for (let i = 0; i < 30; i++) {
          const a = rnd() * TAU,
            r = L.rOf(a) * (0.92 + rnd() * 0.07),
            [x, , z] = at(a, r, 0);
          k.blob(ICO(), pick(['#ff8f7a', '#ffb36b', '#e97ab0', '#7fd1c6', '#f4e3a1'], rnd()), x, -3 - rnd() * 3, z, 0.6 + rnd() * 0.8, 1.2);
        }
      if (L.ter === 'desert')
        for (let j = 0; j < 4; j++)
          for (let kk = 0; kk < 36; kk++) {
            const a = (kk / 36) * TAU,
              r = L.rOf(a) * (0.99 - j * 0.035),
              [x, , z] = at(a, r, 0);
            k.add(UBOX(), j % 2 ? '#d99a62' : '#a8603e', x, -3.4 - j * 1.6, z, 3.6, 0.35, 0.6, -a + Math.PI / 2);
          }
      if (k.b.length) meshOf(k, bodyMat, L.g, 0, 0, 0);
    }
    function terrain(L, HT) {
      const st = TSTYLE[L.ter];
      shapeOf(L);
      L.groundMat = new THREE.MeshStandardMaterial({ color: st.ground, flatShading: true, roughness: 0.95 });
      L.groundBase = new THREE.Color(st.ground);
      // mặt đảo theo đúng mép riêng của miền
      // (mặt đảo nhấp nhô và vách quanh mép: render/map/height3d.js, dựng sau khi sông hồ đã có chỗ)
      if (HT) HT.init(L);
      underside(L, st);
      L.waterMats = [];
      // hồ: lỗ thủng xuyên qua đảo xuống biển (render/map/height3d.js holes) theo một đường viền riêng r(góc), mỗi miền một dáng
      const lakeShape = (R, rf, n) => {
        const sh = new THREE.Shape();
        for (let i = 0; i <= (n || 48); i++) {
          const t = (i / (n || 48)) * TAU,
            r = R * rf(t);
          if (i === 0) sh.moveTo(Math.cos(t) * r, Math.sin(t) * r);
          else sh.lineTo(Math.cos(t) * r, Math.sin(t) * r);
        }
        return sh;
      };
      // đặt một hồ gần (x, z): đường viền (toạ độ dáng, nằm ngang: xoay ry quanh trục đứng) dời tới chỗ gần nhất cả viền vừa
      // (L.holeFits) thành lỗ thủng của đảo, ghi vào L.props đủ phủ cả viền (người, cây, công trình tránh); trả chỗ đặt, hay null
      const hole = (shape, x, z, ry) => {
        const c = Math.cos(ry || 0),
          sn = Math.sin(ry || 0),
          sp = shape.getPoints(),
          ring = (X, Z) => sp.map((q) => [X + q.x * c - q.y * sn, Z - (q.x * sn + q.y * c)]),
          p = nearest(x, z, (X, Z) => L.holeFits(ring(X, Z)), true);
        if (!p) return null;
        L.addHole(ring(p[0], p[1]));
        prop(p[0], p[1], Math.max(...sp.map((q) => Math.hypot(q.x, q.y))) + 0.6);
        return p;
      };
      const k = new Kit(),
        rng = landRng(L.i),
        oa = L.oa;
      const at = (deg, r) => {
        const a = oa + (deg * Math.PI) / 180;
        return [Math.cos(a) * r, Math.sin(a) * r];
      };
      const edge = (deg, m) => L.rOf(oa + (deg * Math.PI) / 180) - (m || 0);
      const prop = (x, z, r) => L.props.push({ x, z, r });
      // chỗ gần (x, z) nhất mà ok(X, Z): ra phía ngoài trước, rồi xoay dọc theo vòng (all: xoay hết vòng); không có thì null.
      // offRoad: dời một khối lớn (núi, cao nguyên, mỏm đá...) ra khỏi đường, vẫn trong đảo; không có chỗ thì null (bỏ khối đó)
      const DR = [0, 3, 6, 9, 12, 15, -3, -6],
        DR_ALL = [0, 3, 6, 9, 12, 15, 18, 21, 24, 27, 30, -3, -6, -9],
        DA = [0, 0.08, -0.08, 0.16, -0.16, 0.25, -0.25, 0.35, -0.35, 0.5, -0.5],
        DA_ALL = [0, ...Array.from({ length: 78 }, (_, i) => (i % 2 ? -1 : 1) * 0.08 * Math.ceil((i + 1) / 2))]; // all: xa hơn, cả vòng
      const nearest = (x, z, ok, all) => {
        const a0 = Math.atan2(z, x),
          r0 = Math.hypot(x, z);
        for (const dr of all ? DR_ALL : DR)
          for (const da of all ? DA_ALL : DA) {
            const a = a0 + da,
              rr = r0 + dr,
              X = Math.cos(a) * rr,
              Z = Math.sin(a) * rr;
            if (ok(X, Z)) return [X, Z];
          }
        return null;
      };
      const offRoad = (x, z, r) =>
        L.onRoad(x, z, r) ? nearest(x, z, (X, Z) => L.inside(X, Z, r * 0.7 + 1) && !L.onRoad(X, Z, r)) : [x, z];
      // mảnh nhỏ rải rác (đá, cỏ, nón cây, khối băng nhỏ) lấn đường thì bỏ
      k.avoid = (x, z, s) => L.onRoad(x, z, s * 0.8);
      // dải cong (bãi cát, hẻm núi): theo một dãy điểm; ghi vào L.dry để hồ không thủng vào
      const ribbon = (pts, wid, y, mat) => {
        const pos = [],
          idx = [];
        for (const [x, z] of pts) L.dry.push([x, z, wid / 2]);
        for (let s = 0; s < pts.length; s++) {
          const [x, z] = pts[s],
            [x2, z2] = pts[Math.min(pts.length - 1, s + 1)],
            [x0, z0] = pts[Math.max(0, s - 1)];
          const tx = x2 - x0,
            tz = z2 - z0,
            l = Math.hypot(tx, tz) || 1,
            nx = -tz / l,
            nz = tx / l;
          pos.push(x + (nx * wid) / 2, y, z + (nz * wid) / 2, x - (nx * wid) / 2, y, z - (nz * wid) / 2);
          if (s) {
            const b = s * 2;
            idx.push(b - 2, b - 1, b, b - 1, b + 1, b);
          }
        }
        const gg = new THREE.BufferGeometry();
        gg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
        gg.setIndex(idx);
        gg.computeVertexNormals();
        const me = new THREE.Mesh(gg, mat);
        me.receiveShadow = true;
        me.userData.flatPart = 'shore';
        L.g.add(me);
        return me;
      };
      if (L.ter === 'plains') {
        // đồng bằng: đồng cỏ hoa dại ở hai cánh, đồng cỏ ở giữa, hồ hình quả thận thông xuống biển, viền cỏ lác và hoa
        {
          const R = 6.2,
            rf = (t) => 1 + 0.24 * Math.sin(2 * t) + 0.1 * Math.sin(3 * t + 1),
            p = hole(lakeShape(R, rf), ...at(15, 30), 0);
          if (p) {
            const [x, z] = p;
            for (let i = 0; i < 22; i++) {
              const t = rng() * TAU,
                r = R * rf(t) + 0.4 + rng() * 0.8;
              k.cone(
                pick(['#8fb04a', '#a7b85e', '#7f9f3f'], rng()),
                x + Math.cos(t) * r,
                0,
                z - Math.sin(t) * r,
                0.18,
                0.7 + rng() * 0.5,
                5,
              );
              if (rng() < 0.4)
                k.add(
                  ICO(),
                  pick(['#f28ab2', '#f7b6cf', '#ffffff'], rng()),
                  x + Math.cos(t) * r,
                  0.75,
                  z - Math.sin(t) * r,
                  0.16,
                  0.16,
                  0.16,
                );
            }
          }
        }
        for (let i = 0; i < 26; i++) {
          const [x, z] = at((rng() - 0.5) * 70, 25 + rng() * 8);
          if (L.inside(x, z, 1)) k.cone(pick(['#b7c46a', '#a7b85e', '#c9cf74'], rng()), x, 0, z, 0.35, 0.7 + rng() * 0.6, 5);
        }
      }
      if (L.ter === 'forest') {
        // rừng: cây mẹ ngàn năm, suối và hồ (đồi tròn đã bỏ)
        {
          const [x, z] = offRoad(...at(4, Math.min(edge(4, 6), 29)), 4) || at(4, Math.min(edge(4, 6), 29));
          k.tcyl('#5b4630', x, 0, z, 2.0, 1.2, 15, 9);
          for (let b = 0; b < 4; b++) {
            const a = b * 1.57 + 0.4;
            k.add(
              UCYL(6),
              '#5b4630',
              x + Math.cos(a) * 1.6,
              0,
              z + Math.sin(a) * 1.6,
              0.5,
              3,
              0.5,
              0,
              Math.sin(a) * 0.6,
              -Math.cos(a) * 0.6,
            );
          }
          for (let c2 = 0; c2 < 6; c2++) {
            const a = c2 * 1.05;
            k.blob(
              ICO(),
              pick(['#3f7a4c', '#4a8a55', '#2f6b3f'], c2 * 0.17),
              x + Math.cos(a) * 3.2,
              15 + (c2 % 2) * 1.6,
              z + Math.sin(a) * 3.2,
              3.6,
              0.8,
            );
          }
          k.blob(ICO(), '#4a8a55', x, 17.5, z, 3.4, 0.9);
          prop(x, z, 3.2);
          L.motherTree = [x, z];
        }
        // hồ rừng: bờ lượn nhiều khúc, thông xuống biển, lau sậy quanh bờ
        {
          const R = 6.6,
            rf = (t) => 1 + 0.16 * Math.sin(3 * t) + 0.1 * Math.cos(5 * t + 0.6),
            p = hole(lakeShape(R, rf), ...at(62, 28), 0);
          if (p) {
            const [x, z] = p;
            for (let i = 0; i < 30; i++) {
              const t = rng() * TAU,
                r = R * rf(t) * (1.06 + rng() * 0.18);
              k.add(
                UCYL(4),
                pick(['#6f8f3a', '#8a9a48', '#5d7a32'], rng()),
                x + Math.cos(t) * r,
                0,
                z - Math.sin(t) * r,
                0.07,
                1.1 + rng() * 0.9,
                0.07,
                (rng() - 0.5) * 0.3,
                0,
                (rng() - 0.5) * 0.3,
              );
            }
          }
        }
        for (let i = 0; i < 40; i++) {
          const [x, z] = at((rng() - 0.5) * 200, 12 + rng() * 26);
          if (L.inside(x, z, 1) && !L.blockedWild(x, z, 0.5)) k.cone(pick(['#4f8f45', '#5f9f4a', '#3f7a4c'], rng()), x, 0, z, 0.45, 0.6, 5);
        }
      }
      if (L.ter === 'mountain') {
        // núi: dãy đỉnh tuyết phía ngoài, một cao nguyên có bậc đá, hồ núi, đá lở
        // dãy núi phía ngoài: 7 ngọn, mỗi ngọn một dáng (nhọn, sống dài, đôi, tròn, đầu bằng, đá lởm chởm), cao thấp khác nhau
        for (let m = 0; m < 7; m++) {
          const d = -95 + m * 31 + (rng() - 0.5) * 10,
            r = Math.min(edge(d, 4), 29 + rng() * 7),
            hgt = 10 + rng() * 16 - Math.abs(d) * 0.04,
            rad = 4.6 + rng() * 3,
            q = offRoad(...at(d, r), rad * 1.05); // ngọn núi lấn vòng đường: dời ra ngoài đường
          if (!q) continue;
          const [x, z] = q;
          mountainOn(
            k,
            x,
            z,
            rad,
            hgt,
            ['#8b8577', '#7f7a6e', '#948d7e', '#857f72'],
            m % 3 === 1 ? null : '#f4f7f9',
            rng,
            MOUNTAIN_STYLES[(m * 2 + Math.floor(rng() * 2)) % MOUNTAIN_STYLES.length],
          );
          prop(x, z, rad * 1.1);
        }
        {
          const [x, z] = offRoad(...at(-28, 24), 6.4) || at(-28, 24);
          k.tcyl('#8f8a7c', x, 0, z, 6.2, 5.8, 4.2, 9);
          k.cyl('#8fa274', x, 4.2, z, 5.8, 0.12, 9);
          prop(x, z, 6.4);
          L.plateau = [x, z, 4.3];
        }
        // hồ núi hình giọt nước thông xuống biển, viền đá cuội
        {
          const R = 5.6,
            rf = (t) => 0.72 + 0.36 * Math.cos(t) * Math.abs(Math.cos(t * 0.5)) + 0.06 * Math.sin(4 * t),
            ry = -(oa + 0.6), // mũi giọt nước chĩa về phía trong đảo
            p = hole(lakeShape(R, rf), ...at(30, 22), ry);
          if (p) {
            const [x, z] = p;
            for (let i = 0; i < 18; i++) {
              const t = (i / 18) * TAU,
                r = R * rf(t) + 0.5;
              k.blob(
                DOD(),
                pick(['#8b8577', '#7c776b', '#a39b8e'], rng()),
                x + Math.cos(t + ry) * r,
                0.15,
                z - Math.sin(t + ry) * r,
                0.35 + rng() * 0.35,
                0.6,
              );
            }
          }
        }
        for (let b = 0; b < 26; b++) {
          const [x, z] = at((rng() - 0.5) * 190, 20 + rng() * 14);
          if (L.inside(x, z, 1) && !L.blockedWild(x, z, 0.5))
            k.blob(DOD(), pick(['#8b8577', '#7c776b', '#9d9589'], rng()), x, 0.2, z, 0.4 + rng() * 0.9, 0.7);
        }
      }
      if (L.ter === 'tundra') {
        // băng nguyên: hồ băng, sống băng, vách sông băng, khe nứt, mảng băng trôi tách khỏi đảo
        // hồ sáu cạnh thông xuống biển
        {
          const R = 7.4,
            rf = (t) => {
              const s6 = Math.PI / 3,
                u = (((t % s6) + s6) % s6) - s6 / 2;
              return (Math.cos(s6 / 2) / Math.cos(u)) * (1 + 0.05 * Math.sin(7 * t));
            };
          hole(lakeShape(R, rf, 72), ...at(-22, 23), 0.3);
        }
        {
          const [x, z] = offRoad(...at(8, Math.min(edge(8, 4), 32)), 8) || at(8, Math.min(edge(8, 4), 32));
          for (let i = 0; i < 9; i++)
            k.add(
              OCT(),
              pick(['#cfeaf5', '#e6f6fb', '#b9e0ef'], rng()),
              x + (i - 4) * 1.8,
              0,
              z + (rng() - 0.5) * 2,
              1.6 + rng(),
              4 + rng() * 5,
              1.4,
              -(oa + 0.14) + rng() * 0.4,
            );
          prop(x, z, 8);
        }
        for (let i = 0; i < 16; i++) {
          const d = (rng() - 0.5) * 180,
            [x, z] = at(d, 18 + rng() * 14);
          if (L.inside(x, z, 1) && !L.blockedWild(x, z, 1)) {
            k.blob(OCT(), pick(['#bfe3f2', '#d6eef7', '#a9d6ea'], rng()), x, 0.3, z, 0.7 + rng() * 1.1, 1.6);
          }
        }
        for (let i = 0; i < 10; i++) {
          const d = (rng() - 0.5) * 220,
            r0 = 14 + rng() * 8,
            [x0, z0] = at(d, r0),
            [x1, z1] = at(d + (rng() - 0.5) * 20, Math.min(edge(d, 0.5), r0 + 8 + rng() * 8));
          const len = Math.hypot(x1 - x0, z1 - z0);
          k.box('#7fa7c0', (x0 + x1) / 2, 0.015, (z0 + z1) / 2, 0.18, 0.03, len, Math.atan2(x1 - x0, z1 - z0));
        }
        // mảng băng trôi bên ngoài mép đảo
        L.floes = [];
        for (let i = 0; i < 4; i++) {
          const d = -60 + i * 40 + (rng() - 0.5) * 10,
            r = edge(d) + 4 + rng() * 4,
            [x, z] = at(d, r),
            R = 2 + rng() * 2.2;
          k.cyl('#e9f3f8', x, -0.8, z, R, 0.8, 7);
          k.cone('#cfe6f1', x, -0.8, z, R * 0.95, -3 - rng() * 3, 7);
          if (rng() < 0.6) k.add(OCT(), '#d6eef7', x, -0.1, z, 0.8, 1.6, 0.8);
          L.floes.push([x, z, R]);
        }
        L.aurora = true;
      }
      if (L.ter === 'coast') {
        // biển: bãi cát dài dọc mép (trải trước để đầm tránh), đầm phá hình bông hoa khoét vào nửa ngoài, thông xuống biển,
        // dừa quanh bờ
        const sandPts = [];
        for (let s = 0; s <= 50; s++) {
          const d = -120 + s * 4.8;
          sandPts.push(at(d, edge(d, 2.4)));
        }
        ribbon(
          sandPts,
          4.6,
          0.025,
          new THREE.MeshStandardMaterial({ color: '#ecd9a8', roughness: 0.95, flatShading: true, side: THREE.DoubleSide }),
        );
        const LR = 9.5,
          lagoonF = (t) => 1 + 0.2 * Math.cos(5 * t) + 0.05 * Math.sin(9 * t),
          lagoon = hole(lakeShape(LR, lagoonF, 80), ...at(0, 26), 0);
        // dừa trên bờ quanh đầm
        if (lagoon)
          for (let i = 0; i < 5; i++) {
            const t = (i / 5) * TAU + 0.3,
              r = LR * lagoonF(t) + 1.6,
              px = lagoon[0] + Math.cos(t) * r,
              pz = lagoon[1] - Math.sin(t) * r;
            k.add(UCYL(5), '#8a6a46', px, 0.1, pz, 0.12, 2.4, 0.12, 0, 0.18, 0.1);
            k.blob(ICO(), '#5f9f4a', px + 0.4, 2.5, pz + 0.2, 1.1, 0.3);
            prop(px, pz, 0.8);
          }
        for (let r2 = 0; r2 < 12; r2++) {
          const d = -110 + rng() * 220,
            [x, z] = at(d, edge(d, 0.8));
          k.blob(DOD(), '#7d7a74', x, 0.2, z, 0.6 + rng() * 0.8, 0.7);
        }
      }
      if (L.ter === 'desert') {
        // sa mạc: đồi cát gợn sóng, mỏm đá đỏ đầu bằng, hẻm núi, ốc đảo
        for (let d = 0; d < 9; d++) {
          const deg = -80 + d * 20 + rng() * 6,
            r = 24 + rng() * 7,
            len = 5 + rng() * 4,
            q = offRoad(...at(deg, Math.min(edge(deg, 4), r)), len * 0.55);
          if (!q) {
            rng();
            rng();
            rng();
            rng();
            continue;
          }
          const [x, z] = q,
            ry = -(oa + (deg * Math.PI) / 180) + Math.PI / 2 + (rng() - 0.5) * 0.5;
          k.add(GABLE(), pick(['#e3bd7f', '#dcb479', '#e8c48a'], rng()), x, 0, z, len, 1.4 + rng() * 1.4, 3.2 + rng() * 1.6, ry);
          k.add(GABLE(), '#d4a86c', x + 0.4, 0, z + 0.4, len * 0.9, 1.0 + rng(), 2.4, ry);
          prop(x, z, len * 0.45);
        }
        for (let m = 0; m < 4; m++) {
          const deg = -70 + m * 46 + rng() * 10,
            p0 = at(deg, Math.min(edge(deg, 4), 31 + rng() * 3)),
            R = 3.2 + rng() * 1.8,
            h = 6 + rng() * 6,
            [x, z] = offRoad(p0[0], p0[1], R + 0.5) || p0;
          for (let j = 0; j < 4; j++)
            k.tcyl(
              pick(['#c98a5a', '#a8603e', '#b87b4f', '#d99a62'], j * 0.27 + m * 0.1),
              x,
              (h / 4) * j,
              z,
              R * (1 - j * 0.04),
              R * (1 - (j + 1) * 0.04),
              h / 4,
              8,
            );
          prop(x, z, R);
        }
        {
          const pts = [];
          for (let s = 0; s <= 24; s++) {
            const u = s / 24,
              d = -10 + u * 34,
              r = 20 + u * 18;
            pts.push(at(d, Math.min(edge(d, 0.4), r)));
          }
          ribbon(
            pts,
            3.4,
            0.02,
            new THREE.MeshStandardMaterial({ color: '#7a3f2a', roughness: 1, flatShading: true, side: THREE.DoubleSide }),
          );
          ribbon(
            pts,
            1.4,
            0.035,
            new THREE.MeshStandardMaterial({ color: '#4a2a1e', roughness: 1, flatShading: true, side: THREE.DoubleSide }),
          );
          L.canyon = pts;
        }
        // ốc đảo hình trăng khuyết thông xuống biển
        {
          const R = 5.2,
            rot = -(oa + (62 * Math.PI) / 180);
          const cres = (rr) => {
            const sh = new THREE.Shape();
            for (let i = 0; i <= 40; i++) {
              const t = -2.4 + (i / 40) * 4.8;
              const px = Math.cos(t) * rr,
                py = Math.sin(t) * rr;
              if (i === 0) sh.moveTo(px, py);
              else sh.lineTo(px, py);
            }
            for (let i = 40; i >= 0; i--) {
              const t = -2.0 + (i / 40) * 4.0;
              sh.lineTo(Math.cos(t) * rr * 0.62 + rr * 0.42, Math.sin(t) * rr * 0.62);
            }
            return sh;
          };
          L.oasis = hole(cres(R), ...at(62, 20), rot);
        }
      }
      if (k.b.length || k.l.length) meshOf(k, bodyMat, L.g, 0, 0, 0);
    }
    return { shapeOf, underside, terrain };
  }
  BK.MapTerrain = { create };
})(typeof self !== 'undefined' ? self : globalThis);
