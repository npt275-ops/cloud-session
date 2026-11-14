/* Bể Kính · render/near3d.js · Cảnh vật gần sau cú nhập hồn (design/ke-hoach-buoc-32.md mục 4)
 * Chỉ bật khi đang ở trong thân NPC (game/possess.js gọi G.near.set(bật, đảo, đầu người) mỗi khung hình); tắt thì trả mọi thứ
 * về như cũ. Góc nhìn thượng đế không đổi gì.
 *   sương    kéo gần lại (bắt đầu FOG.near, dày ở FOG.far): vật xa nhạt và ngả màu trời, giấu chỗ thô ở xa
 *   đèn      một đèn ấm đi theo người, hắt lên mặt và vai (luôn có sẵn trong cảnh, độ sáng 0 khi tắt: bật lên không phải dựng lại
 *            vật liệu)
 *   cỏ, sỏi, hoa  mọc quanh chân trong bán kính R, theo từng ô CELL × CELL (chỗ mọc tính từ toạ độ ô: đi xa rồi quay lại vẫn
 *            đúng chỗ cũ); cỏ mọc ở chỗ đất xanh (càng xanh càng dày, cùng màu đất: L.groundAt), không mọc trên đường, trong hồ,
 *            trong chân công trình, trên sân làng và bãi làm việc (places().grounds), ngoài mép đảo; hoa, sỏi mỗi miền một bộ;
 *            cỏ, hoa lay theo gió (trong shader); nhỏ dần ở mép vòng (không thấy viền vòng cỏ)
 * Bóng nắng sắc nét quanh người do game/possess.js đặt controls.target vào đầu người (render/perf3d.js thu vùng bóng theo đó).
 * Cần: three.js, render/map/ (L.surfAt, L.onRoad, L.inHole, L.inside), render/buildings3d.js (places().solids). */
(function (root) {
  const BK = root.BK || (root.BK = {});
  const R = 18, // bán kính vòng cỏ quanh người
    CELL = 3, // cạnh một ô mọc
    FOG = { near: 28, far: 170 };
  // mỗi miền: số cây hoa, viên sỏi mỗi ô (thử chừng đó chỗ; hoa cũng chỉ mọc chỗ đất xanh); màu hoa; màu sỏi.
  // Cỏ không theo miền mà theo màu đất: chỗ nào đất xanh là có cỏ (GREEN), cỏ cùng màu đất chỗ đó
  const KIND = {
    plains: { flower: 6, pebble: 2, flowers: ['#f2d34a', '#ffffff', '#e86a8a', '#b48ae0'], stone: '#9d9589' },
    forest: { flower: 4, pebble: 2, flowers: ['#ffffff', '#c8a8ff', '#f2d34a'], stone: '#857c6c' },
    mountain: { flower: 3, pebble: 7, flowers: ['#d8c8ff', '#ffffff'], stone: '#8b8577' },
    tundra: { flower: 0, pebble: 5, flowers: [], stone: '#9aa4ad' },
    coast: { flower: 4, pebble: 4, flowers: ['#ffffff', '#ffd27a'], stone: '#d8cfb8' },
    desert: { flower: 2, pebble: 8, flowers: ['#ff9ad0'], stone: '#c99a74' },
  };
  // cỏ: mỗi ô CELL × CELL thử TRY chỗ, mọc với xác suất bằng độ xanh của đất (L.groundAt): xanh lá là màu lục trội hơn đỏ,
  // lam chừng 0,02 trở lên, xanh hẳn khi trội 0,14 (cát, đá, tuyết, sân đất: không có cỏ); máy chậm thử nửa số chỗ
  const GREEN = { from: 0.02, full: 0.14, TRY: 70 };
  const MAX_G = 9000,
    MAX_F = 500,
    MAX_P = 900;
  // ngẫu nhiên theo ô (cùng ô thì cùng chỗ mọc)
  function rng(seed) {
    let s = seed >>> 0 || 1;
    return () => {
      s ^= s << 13;
      s ^= s >>> 17;
      s ^= s << 5;
      return (s >>> 0) / 4294967296;
    };
  }
  // khóm cỏ: năm lá thon, nghiêng toả ra; màu theo độ cao (gốc sẫm, ngọn sáng: thuộc tính aTip)
  function tuftGeo(THREE) {
    const pos = [],
      tip = [];
    for (let b = 0; b < 5; b++) {
      const a = (b / 5) * Math.PI * 2 + b * 0.7,
        lean = 0.07 + (b % 3) * 0.04,
        h = 0.17 + (b % 2) * 0.08,
        w = 0.018,
        cx = Math.cos(a) * 0.05,
        cz = Math.sin(a) * 0.05,
        px = -Math.sin(a) * w,
        pz = Math.cos(a) * w,
        tx = cx + Math.cos(a) * lean,
        tz = cz + Math.sin(a) * lean;
      pos.push(cx - px, 0, cz - pz, cx + px, 0, cz + pz, tx, h, tz);
      tip.push(0, 0, 1);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('aTip', new THREE.Float32BufferAttribute(tip, 1));
    g.computeVertexNormals();
    return g;
  }
  // hoa: cuống mảnh và một bông năm cánh dẹt
  function flowerGeo(THREE) {
    const stem = new THREE.CylinderGeometry(0.008, 0.01, 0.34, 4).translate(0, 0.17, 0),
      head = new THREE.CircleGeometry(0.055, 5).rotateX(-Math.PI / 2).translate(0, 0.35, 0),
      g = mergeTip(THREE, [
        [stem, 0],
        [head, 1],
      ]);
    return g;
  }
  // gộp các hình, ghi aTip (0 cuống, 1 bông: bông lấy màu riêng của từng cây)
  function mergeTip(THREE, parts) {
    const pos = [],
      nor = [],
      tip = [];
    for (const [geo, t] of parts) {
      const gg = geo.index ? geo.toNonIndexed() : geo;
      const P = gg.attributes.position,
        N = gg.attributes.normal;
      for (let i = 0; i < P.count; i++) {
        pos.push(P.getX(i), P.getY(i), P.getZ(i));
        nor.push(N.getX(i), N.getY(i), N.getZ(i));
        tip.push(t);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    g.setAttribute('aTip', new THREE.Float32BufferAttribute(tip, 1));
    return g;
  }
  function setup(G) {
    const { THREE, scene } = G;
    const U = { uWind: { value: 0 } };
    // vật liệu lay theo gió: phần trên (aTip) đưa qua lại theo thời gian và chỗ đứng. Màu riêng từng cây (instanceColor): cỏ là
    // màu đất chỗ đó, gốc sẫm ngọn sáng; hoa: cuống màu base, bông màu riêng
    function swayMat(base, tipCol, perInstance) {
      const m = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.9, side: THREE.DoubleSide });
      m.onBeforeCompile = (sh) => {
        sh.uniforms.uWind = U.uWind;
        sh.uniforms.uBase = { value: new THREE.Color(base) };
        sh.uniforms.uTipC = { value: new THREE.Color(tipCol) };
        sh.vertexShader =
          'uniform float uWind; attribute float aTip; varying float vTip;\n' +
          sh.vertexShader.replace(
            '#include <begin_vertex>',
            '#include <begin_vertex>\nvTip = aTip; vec4 wp0 = instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);\n' +
              'float sw = sin(uWind * 1.7 + wp0.x * 0.45 + wp0.z * 0.3) * 0.6 + sin(uWind * 2.9 + wp0.z * 0.9) * 0.4;\n' +
              'transformed.x += sw * 0.07 * aTip * position.y * 3.0; transformed.z += sw * 0.04 * aTip * position.y * 3.0;',
          );
        sh.fragmentShader =
          'uniform vec3 uBase; uniform vec3 uTipC; varying float vTip;\n' +
          sh.fragmentShader.replace(
            '#include <color_fragment>',
            perInstance === 'flower'
              ? '#include <color_fragment>\ndiffuseColor.rgb = mix(uBase, vColor, step(0.5, vTip));'
              : '#include <color_fragment>\ndiffuseColor.rgb = vColor * mix(0.55, 1.22, vTip);',
          );
      };
      m.customProgramCacheKey = () => 'near-sway-' + perInstance;
      return m;
    }
    const gMat = swayMat('#4f8a3a', '#a8c85a', 'grass'),
      fMat = swayMat('#3f6a2a', '#ffffff', 'flower'),
      pMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.95, flatShading: true });
    const grass = new THREE.InstancedMesh(tuftGeo(THREE), gMat, MAX_G),
      flowers = new THREE.InstancedMesh(flowerGeo(THREE), fMat, MAX_F),
      pebbles = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(0.09, 0), pMat, MAX_P);
    for (const m of [grass, flowers, pebbles]) {
      m.count = 0;
      m.frustumCulled = false;
      m.visible = false;
      m.receiveShadow = true;
      scene.add(m);
    }
    pebbles.castShadow = true;
    // cỏ, hoa, sỏi: màu riêng từng khóm, từng cây, từng viên
    grass.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(MAX_G * 3), 3);
    flowers.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(MAX_F * 3), 3);
    pebbles.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(MAX_P * 3), 3);
    // đèn ấm đi theo người (luôn trong cảnh, tắt bằng độ sáng)
    const lamp = new THREE.PointLight('#ffd9a8', 0, 7, 1.6);
    scene.add(lamp);

    const st = { on: false, i: -1, cx: 1e9, cz: 1e9, fog0: null, k: 0, onAt: 0 };
    const FADE = 1200; // (mili giây) sương, đèn bật dần lúc mở mắt, theo giờ thật: máy nhanh hay chậm cũng như nhau
    const M = new THREE.Matrix4(),
      Q = new THREE.Quaternion(),
      Sv = new THREE.Vector3(),
      Pv = new THREE.Vector3(),
      E = new THREE.Euler(),
      col = new THREE.Color();
    // chỗ này có được mọc không: trong đảo, không trên đường, không trong hồ, không trong chân công trình
    function freeAt(L, solids, grounds, x, z) {
      if (!L.inside(x, z, 1)) return false;
      for (const Q of grounds) if ((x - Q.x) ** 2 + (z - Q.z) ** 2 < Q.r * Q.r) return false;
      if (L.onRoad && L.onRoad(x, z, 0.1)) return false;
      if (L.inHole && L.inHole(x, z, 0.4)) return false;
      for (const B of solids) {
        const dx = x - B.x,
          dz = z - B.z;
        if (dx * dx + dz * dz > 400) continue;
        const lx = dx * B.c - dz * B.s,
          lz = dx * B.s + dz * B.c;
        if (lx > B.x0 - 0.15 && lx < B.x1 + 0.15 && lz > B.z0 - 0.15 && lz < B.z1 + 0.15) return false;
      }
      return true;
    }
    // dựng lại cỏ, hoa, sỏi quanh (cx, cz) (toạ độ đảo)
    function rebuild(L, cx, cz) {
      const K = KIND[L.ter] || KIND.plains,
        PL = G.buildings && G.buildings.places ? G.buildings.places(L.i) : null,
        solids = ((PL && PL.solids) || []).filter((B) => B.kind !== 'town'),
        grounds = (PL && PL.grounds) || [];
      const tries = G.perf && G.perf.pr != null && G.perf.pr < 1 ? GREEN.TRY / 2 : GREEN.TRY;
      // độ xanh của đất ở (x, z), 0..1 (màu đất ghi vào gc)
      const gc = new THREE.Color(),
        green = (x, z) => {
          L.groundAt(x, z, gc);
          return Math.max(0, Math.min(1, (gc.g - Math.max(gc.r, gc.b) - GREEN.from) / (GREEN.full - GREEN.from)));
        };
      let ng = 0,
        nf = 0,
        np = 0;
      const c0x = Math.floor((cx - R) / CELL),
        c1x = Math.floor((cx + R) / CELL),
        c0z = Math.floor((cz - R) / CELL),
        c1z = Math.floor((cz + R) / CELL);
      for (let ix = c0x; ix <= c1x; ix++)
        for (let iz = c0z; iz <= c1z; iz++) {
          const r = rng((ix * 73856093) ^ (iz * 19349663) ^ ((L.i + 1) * 83492791));
          const place = (n, fn) => {
            for (let k = 0; k < n; k++) {
              const x = (ix + r()) * CELL,
                z = (iz + r()) * CELL,
                d = Math.hypot(x - cx, z - cz),
                a = r(),
                b = r(),
                c = r();
              if (d > R) continue;
              if (!freeAt(L, solids, grounds, x, z)) continue;
              const edge = Math.min(1, (R - d) / 3); // (nhỏ dần ở mép vòng)
              fn(x, L.surfAt(x, z), z, edge, a, b, c);
            }
          };
          place(tries, (x, y, z, e, a, b, c) => {
            if (ng >= MAX_G || c > green(x, z)) return;
            const s = (0.7 + a * 0.6) * e;
            E.set((b - 0.5) * 0.2, a * 6.28, 0);
            M.compose(Pv.set(x, y, z), Q.setFromEuler(E), Sv.set(s, s * (0.8 + b * 0.6), s));
            grass.setMatrixAt(ng, M);
            grass.setColorAt(ng++, col.copy(gc).multiplyScalar(0.92 + b * 0.16));
          });
          if (K.flowers.length)
            place(K.flower, (x, y, z, e, a, b, c) => {
              if (nf >= MAX_F || a > green(x, z)) return;
              const s = (0.8 + a * 0.5) * e;
              M.compose(Pv.set(x, y, z), Q.setFromEuler(E.set(0, b * 6.28, 0)), Sv.set(s, s, s));
              flowers.setMatrixAt(nf, M);
              flowers.setColorAt(nf++, col.set(K.flowers[Math.floor(c * K.flowers.length)]));
            });
          place(K.pebble, (x, y, z, e, a, b, c) => {
            if (np >= MAX_P) return;
            const s = (0.6 + a * 1.4) * e;
            E.set(a * 3, b * 6.28, c * 3);
            M.compose(Pv.set(x, y + 0.02, z), Q.setFromEuler(E), Sv.set(s, s * 0.6, s * 0.9));
            pebbles.setMatrixAt(np, M);
            pebbles.setColorAt(np++, col.set(K.stone).multiplyScalar(0.85 + b * 0.3));
          });
        }
      grass.count = ng;
      flowers.count = nf;
      pebbles.count = np;
      for (const m of [grass, flowers, pebbles]) {
        m.instanceMatrix.needsUpdate = true;
        if (m.instanceColor) m.instanceColor.needsUpdate = true;
        m.position.copy(L.g.position);
        m.updateMatrix();
      }
      st.cx = cx;
      st.cz = cz;
    }
    function set(on, i, head) {
      const fog = scene.fog;
      if (on && !st.on) {
        st.on = true;
        st.fog0 = fog ? { near: fog.near, far: fog.far } : null;
        st.cx = st.cz = 1e9;
        st.onAt = performance.now();
      }
      if (!on) {
        if (!st.on) return;
        st.on = false;
        st.k = 0;
        for (const m of [grass, flowers, pebbles]) m.visible = false;
        lamp.intensity = 0;
        if (fog && st.fog0) {
          fog.near = st.fog0.near;
          fog.far = st.fog0.far;
        }
        return;
      }
      const L = G.lands[i];
      if (!L) return;
      st.k = Math.min(1, (performance.now() - st.onAt) / FADE); // (bật dần lúc mở mắt)
      // sương kéo gần dần (máy quay dưới nước thì render/deep3d.js lo sương)
      const underSea = G.sea3d && G.camera.position.y < G.sea3d.SEA_Y + G.sea3d.seaDy;
      if (fog && st.fog0 && !underSea) {
        fog.near = st.fog0.near + (FOG.near - st.fog0.near) * st.k;
        fog.far = st.fog0.far + (FOG.far - st.fog0.far) * st.k;
      }
      // đèn ấm trước mặt, cao hơn đầu một chút; ban đêm sáng hơn (lửa, đèn đường là nguồn chính, đèn này chỉ đỡ mặt)
      const night = G.weather && G.weather.night ? G.weather.night : 0;
      lamp.position.copy(head).add(Pv.set(0, 0.6, 0));
      lamp.intensity = (0.45 + 0.5 * night) * st.k;
      // cỏ: dựng lại khi người đi xa chỗ dựng lần trước
      const x = head.x - L.center.x,
        z = head.z - L.center.z;
      if (st.i !== i || Math.hypot(x - st.cx, z - st.cz) > CELL) {
        st.i = i;
        rebuild(L, x, z);
      }
      for (const m of [grass, flowers, pebbles]) m.visible = true;
      U.uWind.value = performance.now() * 0.001;
    }
    // số khóm cỏ, cây hoa, viên sỏi đang mọc (tools/check-possess.js)
    const counts = () => ({
      grass: grass.visible ? grass.count : 0,
      flowers: flowers.visible ? flowers.count : 0,
      pebbles: pebbles.visible ? pebbles.count : 0,
    });
    G.near = { set, counts, freeAt, KIND, R }; // (freeAt: render/style/painterly3d.js dùng chung chỗ được mọc)
  }
  BK.Near3D = { setup, KIND };
})(typeof self !== 'undefined' ? self : globalThis);
