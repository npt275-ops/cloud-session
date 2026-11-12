(function (root) {
  'use strict';
  const BK = root.BK || (root.BK = {});
  /* Bể Kính · render/map/relief3d.js
   * Địa hình thêm của từng đảo, đặt ngoài vùng làng ở giữa đảo: khối núi riêng (MASSIF ở mountains3d.js), sông chảy từ mép
   * đảo vào hồ, ao nhỏ (WATERS), cụm đá (RELIEF), và nét riêng từng miền (hoa dại, thân cây đổ, vòng nấm, cột đá, khe núi,
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
    /* =============== Địa hình thêm: núi, sông, hồ, đá, và nét riêng của từng miền =============== */
    // Đặt ngoài vùng làng ở giữa đảo (bán kính 26), tránh sông, hồ và những khối lớn đã có; mỗi món ghi vào L.props để
    // cây và người tránh. Đồi dùng chung vật liệu mặt đất nên đổi màu theo mùa cùng đảo; đá và các món khác gộp một khối.
    const RELIEF = {
      plains: { hills: 7, rocks: 5 },
      forest: { hills: 8, rocks: 7 },
      mountain: { hills: 12, rocks: 12 },
      tundra: { hills: 12, rocks: 8 },
      coast: { hills: 0, rocks: 5 },
      desert: { hills: 0, rocks: 10 },
    };
    // sông, hồ thêm cho từng miền: số sông, bề rộng, màu nước, màu bờ; số ao (núi thêm nằm ở MASSIF)
    const WATERS = {
      plains: { rivers: 1, riverW: 2.4, water: '#4aa3c7', bank: '#c9b48a', shore: '#c9b48a', ponds: 3 },
      forest: { rivers: 2, riverW: 2.2, water: '#3f9cc6', bank: '#6b5a3a', shore: '#6b5a3a', ponds: 3 },
      mountain: { rivers: 2, riverW: 2.0, water: '#3a86b0', bank: '#9d9589', shore: '#9d9589', ponds: 2 },
      tundra: { rivers: 1, riverW: 2.6, water: '#bfe3f2', bank: '#eef6fa', shore: '#eef6fa', ponds: 3 },
      coast: { rivers: 2, riverW: 2.2, water: '#3fb8c8', bank: '#ecd9a8', shore: '#ecd9a8', ponds: 3 },
      desert: { rivers: 1, riverW: 1.6, water: '#3fb0b8', bank: '#b98a55', shore: '#b98a55', ponds: 1 },
    };
    function relief(L) {
      const rng = landRng(L.i + 500),
        st = TSTYLE[L.ter],
        R = RELIEF[L.ter],
        k = new Kit(),
        kD = new Kit(),
        oa = L.oa; // kD: chi tiết nhỏ, ẩn khi nhìn xa
      const nearRiver = (x, z, r) => L.river && L.river.some(([px, pz]) => (px - x) ** 2 + (pz - z) ** 2 < (r + 3.5) ** 2);
      const free = (x, z, r) =>
        L.inside(x, z, r + 1.5) &&
        Math.hypot(x, z) > 26 + r &&
        !L.blockedWild(x, z, r) &&
        !nearRiver(x, z, r) &&
        !(L.onRoad && L.onRoad(x, z, r)); // không chắn đường (L.onRoad, terrain3d)
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
      // nước và bờ (giống phần hồ, sông ở terrain): mặt phẳng nằm ngang theo một đường viền, dải cong theo dãy điểm
      const lakeG = (Rr, rf) => {
        const sh = new THREE.Shape();
        for (let i = 0; i <= 36; i++) {
          const t = (i / 36) * TAU,
            r = Rr * rf(t);
          if (i === 0) sh.moveTo(Math.cos(t) * r, Math.sin(t) * r);
          else sh.lineTo(Math.cos(t) * r, Math.sin(t) * r);
        }
        return new THREE.ShapeGeometry(sh);
      };
      const waterMat = (col) => {
        const m = new THREE.MeshStandardMaterial({
          color: col,
          roughness: 0.15,
          metalness: 0.2,
          emissive: '#0c3b52',
          emissiveIntensity: 0.3,
          side: THREE.DoubleSide,
        });
        L.waterMats.push(m);
        return m;
      };
      const waterMesh = (geo, x, z, y, col) => {
        const me = new THREE.Mesh(geo, waterMat(col));
        me.rotation.x = -Math.PI / 2;
        me.position.set(x, y, z);
        me.receiveShadow = true;
        me.userData.flatPart = 'water';
        L.g.add(me);
        return me;
      };
      const flatMesh = (geo, x, z, y, col) => {
        const me = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: col, roughness: 0.95, flatShading: true }));
        me.rotation.x = -Math.PI / 2;
        me.position.set(x, y, z);
        me.receiveShadow = true;
        me.userData.flatPart = 'shore';
        L.g.add(me);
        return me;
      };
      const ribbon = (pts, wid, y, mat) => {
        const pos = [],
          idx = [];
        for (let q = 0; q < pts.length; q++) {
          const [x, z] = pts[q],
            [x2, z2] = pts[Math.min(pts.length - 1, q + 1)],
            [x0, z0] = pts[Math.max(0, q - 1)],
            tx = x2 - x0,
            tz = z2 - z0,
            l = Math.hypot(tx, tz) || 1,
            nx = -tz / l,
            nz = tx / l;
          pos.push(x + (nx * wid) / 2, y, z + (nz * wid) / 2, x - (nx * wid) / 2, y, z - (nz * wid) / 2);
          if (q) {
            const b = q * 2;
            idx.push(b - 2, b - 1, b, b - 1, b + 1, b);
          }
        }
        const gg = new THREE.BufferGeometry();
        gg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
        gg.setIndex(idx);
        gg.computeVertexNormals();
        const me = new THREE.Mesh(
          gg,
          typeof mat === 'string'
            ? new THREE.MeshStandardMaterial({ color: mat, roughness: 0.9, flatShading: true, side: THREE.DoubleSide })
            : mat,
        );
        me.receiveShadow = true;
        me.userData.flatPart = typeof mat === 'string' ? 'shore' : 'water';
        L.g.add(me);
        return me;
      };
      /* ----- núi, sông, hồ thêm (đặt trước đồi và đá để có chỗ) ----- */
      L.reliefStats = { peaks: 0, rivers: 0, lakes: 0, ponds: 0 };
      const W = WATERS[L.ter];
      // khối núi nhiều mặt riêng của từng đảo (Đá Mây đã có dãy núi riêng ở terrain nên không thêm)
      for (const M of MT.MASSIF[L.ter] || []) MT.massif(L, k, M, rng, free, prop);
      // sông: uốn khúc quanh phía ngoài làng, đổ vào một hồ hoặc ra mép đảo; hồ có bờ và cây cỏ
      for (let rv = 0, tries = 0; rv < W.rivers && tries < 16; tries++) {
        // sông chảy từ gần mép đảo vào trong, đổ vào một hồ ở phía ngoài làng
        const side = rv % 2 ? 1 : -1,
          a0 = oa + side * (0.9 + rng() * 1.5),
          a1 = a0 + side * (0.6 + rng() * 0.6),
          pts = [];
        const r1 = 31 + rng() * 6;
        for (let sI = 0; sI <= 30; sI++) {
          const u = sI / 30,
            a = a0 + (a1 - a0) * u,
            r0 = L.rOf(a) - 4,
            r = Math.min(L.rOf(a) - 3, r0 + (r1 - r0) * u + Math.sin(u * Math.PI * 3 + rv) * 2.5);
          pts.push([Math.cos(a) * r, Math.sin(a) * r]);
        }
        if (pts.some(([x, z], q) => q % 2 === 0 && (L.blockedWild(x, z, 1.2) || nearRiver(x, z, 1) || Math.hypot(x, z) < 27))) continue;
        const [ex, ez] = pts[pts.length - 1],
          R = 3.6 + rng() * 2.4,
          rf = (t) => 1 + 0.18 * Math.sin(2 * t + rv) + 0.08 * Math.sin(5 * t);
        const lakeOk =
          L.inside(ex, ez, R + 1) &&
          !L.blockedWild(ex, ez, R * 0.7) &&
          Math.hypot(ex, ez) > 26 + R &&
          !(L.onRoad && L.onRoad(ex, ez, R + 1));
        rv++;
        L.reliefStats.rivers++;
        ribbon(pts, W.riverW + 2.2, 0.05, W.bank);
        ribbon(pts, W.riverW, 0.12, waterMat(W.water));
        (L.rivers || (L.rivers = [])).push(pts);
        if (lakeOk) {
          flatMesh(lakeG(R + 1, rf), ex, ez, 0.05, W.shore);
          waterMesh(lakeG(R, rf), ex, ez, 0.12, W.water);
          for (let t = 0; t < 10; t++) {
            const q = rng() * TAU,
              rr = R * rf(q) * (0.95 + rng() * 0.15);
            kD.add(
              UCYL(4),
              pick(['#6f8f3a', '#8a9a48', '#5d7a32'], rng()),
              ex + Math.cos(q) * rr,
              0,
              ez + Math.sin(q) * rr,
              0.05,
              0.6 + rng() * 0.5,
              0.05,
            );
          }
          prop(ex, ez, R + 1);
          L.reliefStats.lakes++;
        }
        // sông được phép chảy qua đường (mặt đường cao hơn mặt nước)
        for (let sI = 0; sI < pts.length; sI += 2) L.props.push({ x: pts[sI][0], z: pts[sI][1], r: W.riverW / 2 + 1.2, river: true });
      }
      // ao nhỏ rải rác
      for (let i = 0; i < W.ponds; i++) {
        const R = 1.8 + rng() * 1.6,
          p = spot(R + 1);
        if (!p) continue;
        const rf = (t) => 1 + 0.12 * Math.sin(3 * t + i);
        flatMesh(lakeG(R + 0.7, rf), p[0], p[1], 0.05, W.shore);
        waterMesh(lakeG(R, rf), p[0], p[1], 0.12, W.water);
        for (let j = 0; j < 5; j++) {
          const q = (j / 5) * TAU;
          kD.blob(DOD(), pick(rockC, rng()), p[0] + Math.cos(q) * (R + 0.5), 0.15, p[1] + Math.sin(q) * (R + 0.5), 0.3, 0.6);
        }
        prop(p[0], p[1], R + 1);
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
