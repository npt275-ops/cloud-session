(function (root) {
  'use strict';
  const BK = root.BK || (root.BK = {});
  /* Bể Kính · render/map/relief3d.js
   * Địa hình thêm của từng đảo, đặt ngoài vùng làng ở giữa đảo: khối núi riêng (MASSIF ở mountains3d.js), hồ, ao nhỏ thủng
   * xuống biển (WATERS, L.addHole: render/map/height3d.js), cụm đá (RELIEF), và nét riêng từng miền (hoa dại, thân cây đổ, vòng nấm, cột đá, khe núi,
   * vách băng, gai băng, cột đá ven biển, vũng triều, vòm đá đỏ, trụ đá). Chi tiết nhỏ để riêng (L.detail) để ẩn khi nhìn xa.
   * Mỗi món ghi vào L.props để cây tránh; không món nào đặt chắn đường của đảo (L.onRoad, render/map/terrain3d.js). Cần: shared3d.js, mountains3d.js, water3d.js. */
  function create(X, MT, W2) {
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
    } = X;
    /* =============== Địa hình thêm: núi, hồ, ao, đá, và nét riêng của từng miền =============== */
    // Đặt ngoài vùng làng ở giữa đảo (bán kính 26), tránh hồ và những khối lớn đã có; mỗi món ghi vào L.props để
    // cây và người tránh. Đồi dùng chung vật liệu mặt đất nên đổi màu theo mùa cùng đảo; đá và các món khác gộp một khối.
    const RELIEF = {
      plains: { hills: 7, rocks: 5 },
      forest: { hills: 8, rocks: 7 },
      mountain: { hills: 12, rocks: 12 },
      tundra: { hills: 12, rocks: 8 },
      coast: { hills: 0, rocks: 5 },
      desert: { hills: 0, rocks: 10 },
    };
    // hồ, ao thêm cho từng miền (lỗ thủng xuyên đảo xuống biển: render/map/height3d.js holes); núi thêm nằm ở MASSIF
    const WATERS = {
      plains: { lakes: 1, ponds: 3 },
      forest: { lakes: 2, ponds: 3 },
      mountain: { lakes: 2, ponds: 2 },
      tundra: { lakes: 1, ponds: 3 },
      coast: { lakes: 2, ponds: 3 },
      desert: { lakes: 1, ponds: 1 },
    };
    function relief(L) {
      const rng = landRng(L.i + 500),
        st = TSTYLE[L.ter],
        R = RELIEF[L.ter],
        k = new Kit(),
        kD = new Kit(),
        oa = L.oa; // kD: chi tiết nhỏ, ẩn khi nhìn xa
      const free = (x, z, r) =>
        L.inside(x, z, r + 1.5) && Math.hypot(x, z) > 26 + r && !L.blockedWild(x, z, r) && !(L.onRoad && L.onRoad(x, z, r)); // không chắn đường (L.onRoad, terrain3d)
      if (L.onRoad) k.avoid = kD.avoid = (x, z, s) => L.onRoad(x, z, s * 0.8); // mảnh nhỏ nằm trên đường: bỏ
      const spot = (r, tries, inner) => {
        for (let t = 0; t < (tries || 40); t++) {
          const a = rng() * TAU,
            rr = (inner || 28) + Math.sqrt(rng()) * (LAND_R - (inner || 28)),
            x = Math.cos(a) * rr,
            z = Math.sin(a) * rr;
          if (free(x, z, r)) return [x, z];
        }
        return null;
      };
      const prop = (x, z, r) => L.props.push({ x, z, r });
      const rockC = st.rock.slice(0, 3);
      /* ----- núi, hồ, ao thêm (đặt trước đồi và đá để có chỗ) ----- */
      L.reliefStats = { peaks: 0, lakes: 0, ponds: 0 };
      const W = WATERS[L.ter];
      // khối núi nhiều mặt riêng của từng đảo (Đá Mây đã có dãy núi riêng ở terrain nên không thêm)
      for (const M of MT.MASSIF[L.ter] || []) MT.massif(L, k, M, rng, free, prop);
      // hồ, ao: lỗ thủng xuyên đảo xuống biển theo đường viền (x + r(t)·cos t, z + r(t)·sin t); hồ viền lau sậy, ao viền đá cuội
      const holeAt = (R, rf, m) => {
        for (let t = 0; t < 40; t++) {
          const p = spot(R + m, 1);
          if (!p) continue;
          const pts = [];
          for (let i = 0; i < 64; i++) {
            const a = (i / 64) * TAU;
            pts.push([p[0] + Math.cos(a) * R * rf(a), p[1] + Math.sin(a) * R * rf(a)]);
          }
          if (!L.holeFits(pts)) continue; // cả viền phải vừa: không lấn đường, bãi cát, hẻm núi, khối lớn
          L.addHole(pts);
          prop(p[0], p[1], Math.max(...pts.map(([x, z]) => Math.hypot(x - p[0], z - p[1]))) + 0.6);
          return p;
        }
        return null;
      };
      for (let i = 0; i < W.lakes; i++) {
        const R = 3.6 + rng() * 2.4,
          rf = (t) => 1 + 0.18 * Math.sin(2 * t + i) + 0.08 * Math.sin(5 * t),
          p = holeAt(R, rf, 1.5);
        if (!p) continue;
        for (let t = 0; t < 12; t++) {
          const q = rng() * TAU,
            rr = R * rf(q) * (1.08 + rng() * 0.15);
          kD.add(
            UCYL(4),
            pick(['#6f8f3a', '#8a9a48', '#5d7a32'], rng()),
            p[0] + Math.cos(q) * rr,
            0,
            p[1] + Math.sin(q) * rr,
            0.05,
            0.6 + rng() * 0.5,
            0.05,
          );
        }
        L.reliefStats.lakes++;
      }
      for (let i = 0; i < W.ponds; i++) {
        const R = 1.8 + rng() * 1.6,
          rf = (t) => 1 + 0.12 * Math.sin(3 * t + i),
          p = holeAt(R, rf, 1);
        if (!p) continue;
        for (let j = 0; j < 5; j++) {
          const q = (j / 5) * TAU,
            rr = R * rf(q) + 0.5;
          kD.blob(DOD(), pick(rockC, rng()), p[0] + Math.cos(q) * rr, 0.15, p[1] + Math.sin(q) * rr, 0.3, 0.6);
        }
        L.reliefStats.ponds++;
      }
      // cụm đá: vài tảng to nhỏ chụm lại
      const rockCluster = (x, z, n, sz, cap) => {
        for (let j = 0; j < n; j++) {
          const a = rng() * TAU,
            rr = rng() * sz * 1.2,
            s2 = sz * (0.45 + rng() * 0.6);
          k.blob(j % 2 ? DOD() : ICO(), pick(rockC, rng()), x + Math.cos(a) * rr, s2 * 0.35, z + Math.sin(a) * rr, s2, 0.75);
          if (cap) k.blob(ICO(), cap, x + Math.cos(a) * rr, s2 * 0.9, z + Math.sin(a) * rr, s2 * 0.6, 0.35);
        }
        prop(x, z, sz * 1.5);
      };
      for (let i = 0; i < R.rocks; i++) {
        const p = spot(2.5);
        if (p)
          rockCluster(
            p[0],
            p[1],
            3 + Math.floor(rng() * 3),
            1.0 + rng() * 0.9,
            L.ter === 'forest' ? '#5f8f45' : L.ter === 'tundra' ? '#f4f8fb' : null,
          );
      }
      if (L.ter === 'plains') {
        // khóm hoa dại nhiều màu trên đồng
        for (let i = 0; i < 14; i++) {
          const p = spot(2, 30, 26);
          if (!p) continue;
          const c = pick(['#f2d04a', '#e86a6a', '#f2f0e8', '#c88ae0', '#f0a050'], rng());
          for (let j = 0; j < 9; j++) {
            const a = rng() * TAU,
              rr = rng() * 1.8;
            kD.blob(ICO(), c, p[0] + Math.cos(a) * rr, 0.22, p[1] + Math.sin(a) * rr, 0.16 + rng() * 0.08, 0.8);
          }
        }
      }
      if (L.ter === 'forest') {
        // thân cây đổ phủ rêu, vòng nấm
        for (let i = 0; i < 7; i++) {
          const p = spot(2.5);
          if (!p) continue;
          const ry = rng() * Math.PI;
          k.add(UCYL(7), '#6b4b32', p[0], 0.35, p[1], 0.35, 3.6 + rng() * 2, 0.35, ry, Math.PI / 2, 0);
          k.blob(ICO(), '#5f8f45', p[0], 0.62, p[1], 0.45, 0.4);
          prop(p[0], p[1], 2.4);
        }
        for (let i = 0; i < 6; i++) {
          const p = spot(1.6);
          if (!p) continue;
          for (let j = 0; j < 7; j++) {
            const a = (j / 7) * TAU,
              rr = 1.1;
            const x = p[0] + Math.cos(a) * rr,
              z = p[1] + Math.sin(a) * rr;
            kD.cyl('#f2ece0', x, 0, z, 0.07, 0.35, 5);
            kD.add(SPHG(), j % 3 ? '#d24a3a' : '#e8b44a', x, 0.33, z, 0.24, 0.18, 0.24);
          }
        }
      }
      if (L.ter === 'mountain') {
        // cột đá cao chồng tầng, bãi đá lở
        for (let i = 0; i < 4; i++) {
          const p = spot(2.2);
          if (!p) continue;
          let y = 0;
          const h = 3 + Math.floor(rng() * 3);
          for (let j = 0; j < h; j++) {
            const r2 = 1.6 - j * 0.2 + rng() * 0.3;
            k.blob(DOD(), pick(rockC, rng()), p[0] + (rng() - 0.5) * 0.4, y + r2 * 0.7, p[1] + (rng() - 0.5) * 0.4, r2, 0.9);
            y += r2 * 1.3;
          }
          prop(p[0], p[1], 2.2);
        }
        for (let i = 0; i < 4; i++) {
          const p = spot(3);
          if (p) rockCluster(p[0], p[1], 7, 0.7, null);
        }
      }
      if (L.ter === 'mountain') {
        // khe núi: hai dải đá đổ dài, suối đá cuội khô giữa hai sườn
        for (let i = 0; i < 2; i++) {
          const p = spot(6);
          if (!p) continue;
          const ry = rng() * Math.PI;
          for (let j = -4; j <= 4; j++) {
            const x = p[0] + Math.cos(ry) * j * 1.5,
              z = p[1] + Math.sin(ry) * j * 1.5;
            for (const sd of [-1, 1])
              k.blob(DOD(), pick(rockC, rng()), x - Math.sin(ry) * sd * 2.2, 0.7, z + Math.cos(ry) * sd * 2.2, 1.1 + rng() * 0.6, 1.1);
            k.blob(ICO(), '#a39b8e', x, 0.08, z, 0.35, 0.4);
          }
          prop(p[0], p[1], 7);
        }
      }
      if (L.ter === 'tundra') {
        // vách băng: dãy khối băng dựng sát nhau
        for (let i = 0; i < 3; i++) {
          const p = spot(5);
          if (!p) continue;
          const ry = rng() * Math.PI;
          for (let j = -3; j <= 3; j++)
            k.add(
              OCT(),
              pick(['#cfeaf5', '#e6f6fb', '#b9e0ef'], rng()),
              p[0] + Math.cos(ry) * j * 1.6,
              0,
              p[1] + Math.sin(ry) * j * 1.6,
              1.3 + rng() * 0.6,
              2.4 + rng() * 2.2,
              1.0,
              ry,
            );
          prop(p[0], p[1], 6);
        }
        // tảng đá đen phủ tuyết
        for (let i = 0; i < 6; i++) {
          const p = spot(2);
          if (p) rockCluster(p[0], p[1], 3, 1.1, '#f4f8fb');
        }
      }
      if (L.ter === 'desert') {
        // trụ đá đỏ mảnh
        for (let i = 0; i < 6; i++) {
          const p = spot(2);
          if (!p) continue;
          let y = 0;
          const h = 3 + Math.floor(rng() * 4);
          for (let j = 0; j < h; j++) {
            const r2 = 1.1 + rng() * 0.4;
            k.add(UCYL(7), pick(['#c98a5a', '#b87b4f', '#d99a62', '#a56d46'], rng()), p[0], y, p[1], r2, 1.2, r2, rng() * 3);
            y += 1.2;
          }
          k.cyl('#a56d46', p[0], y, p[1], 1.4, 0.3, 7);
          prop(p[0], p[1], 2);
        }
      }
      if (L.ter === 'tundra') {
        // rừng gai băng
        for (let i = 0; i < 7; i++) {
          const p = spot(2);
          if (!p) continue;
          for (let j = 0; j < 5; j++) {
            const a = rng() * TAU,
              rr = rng() * 1.6;
            k.add(
              UCONE(5),
              pick(['#cfeaf5', '#b9e0ef', '#e6f6fb'], rng()),
              p[0] + Math.cos(a) * rr,
              0,
              p[1] + Math.sin(a) * rr,
              0.3 + rng() * 0.3,
              1.6 + rng() * 2.6,
              0.3 + rng() * 0.3,
              rng() * 3,
              (rng() - 0.5) * 0.3,
              0,
            );
          }
          prop(p[0], p[1], 2.2);
        }
      }
      if (L.ter === 'coast') {
        // cột đá giữa sóng sát mép đảo, vũng nước khi thuỷ triều rút
        for (let i = 0; i < 3; i++) {
          const a = oa + (rng() - 0.5) * 2.6,
            rr = L.rOf(a) - 1,
            x0 = Math.cos(a) * rr,
            z0 = Math.sin(a) * rr;
          let y = 0;
          for (let j = 0; j < 4; j++) {
            const r2 = 1.5 - j * 0.22;
            k.blob(DOD(), pick(['#8f7a5e', '#7d6b54', '#a08a6a'], rng()), x0, y + r2 * 0.7, z0, r2, 0.95);
            y += r2 * 1.25;
          }
          k.blob(ICO(), '#6aa04e', x0, y + 0.2, z0, 0.6, 0.4);
        }
        for (let i = 0; i < 6; i++) {
          const a = rng() * TAU,
            rr = L.rOf(a) - 4,
            x0 = Math.cos(a) * rr,
            z0 = Math.sin(a) * rr;
          if (!free(x0, z0, 1.6)) continue;
          k.cyl('#4fb8c8', x0, 0.04, z0, 1.1 + rng() * 0.5, 0.04, 9);
          for (let j = 0; j < 6; j++) {
            const t = (j / 6) * TAU;
            k.blob(DOD(), '#8f7a5e', x0 + Math.cos(t) * 1.5, 0.18, z0 + Math.sin(t) * 1.5, 0.35, 0.6);
          }
          prop(x0, z0, 1.8);
        }
      }
      if (L.ter === 'desert') {
        // vòm đá đỏ
        for (let i = 0; i < 2; i++) {
          const p = spot(4.5);
          if (!p) continue;
          const ry = rng() * Math.PI,
            span = 3.6 + rng() * 1.4;
          for (let j = 0; j <= 10; j++) {
            const t = (j / 10) * Math.PI,
              x = Math.cos(t) * span,
              y = Math.sin(t) * span * 0.9;
            k.blob(
              DOD(),
              pick(['#c98a5a', '#b87b4f', '#a56d46'], rng()),
              p[0] + Math.cos(ry) * x,
              y + 0.5,
              p[1] + Math.sin(ry) * x,
              1.0 + (j % 2) * 0.25,
              0.9,
            );
          }
          prop(p[0], p[1], span + 1);
        }
      }
      if (k.b.length) meshOf(k, bodyMat, L.g, 0, 0, 0);
      L.detail = new THREE.Group();
      L.g.add(L.detail);
      if (kD.b.length) meshOf(kD, bodyMat, L.detail, 0, 0, 0);
      if (L.collectWater) L.collectWater(); // (mặt nước khoét đất xuống: render/map/height3d.js)
      W2.mergeFlat(L);
    }

    return { relief };
  }
  BK.MapRelief = { create };
})(typeof self !== 'undefined' ? self : globalThis);
