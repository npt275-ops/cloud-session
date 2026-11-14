/* Bể Kính · render/style/painterly3d.js · Bản thử hướng B: cảnh nhập hồn kiểu tranh vẽ tay (chỉ đảo Lúa Vàng)
 * Chỉ bật khi đang ở trong thân NPC trên đảo có miền trong ON (bản thử: plains = Lúa Vàng). game/possess.js gọi
 * G.painterly.update(bật, đảo, đầu người, giây) mỗi khung hình; tắt thì trả mọi thứ về như cũ. Muốn bỏ hướng này: bỏ tệp,
 * bỏ dòng gọi trong game/possess.js, game/loop.js, index.html; muốn mở cho đảo khác: thêm miền vào ON.
 *   biển cỏ    khóm lá cao, cong, gốc lục sẫm ngọn vàng sáng, pháp tuyến hướng trời (sáng đều như mảng màu vẽ), sóng gió
 *              chạy qua đồng (trong shader); mọc chỗ đất xanh như cỏ gần (render/near3d.js: G.near.freeAt, L.groundAt)
 *   hoa li ti  chấm trắng, vàng lấm tấm trên đồng
 *   mây vẽ     khối mây tích vẽ bằng canvas (đỉnh trắng sáng, đáy tím xám), đặt quanh chân trời
 *   mặt đất    nhẵn (bỏ mặt gãy khúc), trả lại khi tắt
 *   người      thân mềm (render/body/softbody3d.js) đổi sang tô theo mảng sáng tối mềm như tranh, giữ viền nét
 *   hậu kỳ     G.post.fx.paint (render/fx/post3d.js): lọc vẽ tay (gom điểm ảnh thành mảng như nét cọ), xa nhạt dần ngả lam,
 *              chỉnh màu (bóng ngả lam tím, sáng ngả vàng ấm), thớ giấy
 * Cần: three.js, render/near3d.js, render/body/softbody3d.js, render/fx/post3d.js, render/map/ (L.groundAt, L.surfAt). */
(function (root) {
  const BK = root.BK || (root.BK = {});
  const ON = {}; // các miền bật kiểu tranh vẽ (bản thử đang tắt, chờ người chơi duyệt; bật thử: { plains: true })
  const R = 16, // bán kính biển cỏ quanh người
    CELL = 2,
    TRY = 40, // số chỗ thử mỗi ô (chỗ nào đất xanh hẳn thì mọc gần hết)
    MAX_G = 9000,
    MAX_D = 2400,
    FADE = 1200, // (mili giây) bật dần
    CLOUDS = 9;
  const GREEN = { from: 0.02, full: 0.14 };
  const COL = { base: '#2e5a2c', tip: '#d6dc6e', dots: ['#ffffff', '#fff6d8', '#f4dc5a', '#ffffff'] };
  function rng(seed) {
    let s = seed >>> 0 || 1;
    return () => {
      s ^= s << 13;
      s ^= s >>> 17;
      s ^= s << 5;
      return (s >>> 0) / 4294967296;
    };
  }
  // khóm cỏ cao: sáu lá cong, mỗi lá hai đốt (gốc rộng, ngọn nhọn), aTip là độ cao tương đối (0 gốc, 1 ngọn)
  function bladeGeo(THREE) {
    const pos = [],
      tip = [];
    for (let b = 0; b < 6; b++) {
      const a = (b / 6) * Math.PI * 2 + b * 1.1,
        h = 0.5 + (b % 3) * 0.13,
        bend = 0.12 + (b % 2) * 0.1,
        w = 0.028,
        ox = Math.cos(a) * 0.06,
        oz = Math.sin(a) * 0.06,
        dx = Math.cos(a),
        dz = Math.sin(a),
        px = -dz * w,
        pz = dx * w;
      const at = (t) => [ox + dx * bend * t * t, h * t, oz + dz * bend * t * t];
      const p0 = at(0),
        p1 = at(0.55),
        p2 = at(1),
        k = 0.6;
      const L0 = [p0[0] - px, p0[1], p0[2] - pz],
        R0 = [p0[0] + px, p0[1], p0[2] + pz],
        L1 = [p1[0] - px * k, p1[1], p1[2] - pz * k],
        R1 = [p1[0] + px * k, p1[1], p1[2] + pz * k];
      pos.push(...L0, ...R0, ...R1, ...L0, ...R1, ...L1, ...L1, ...R1, ...p2);
      tip.push(0, 0, 0.55, 0, 0.55, 0.55, 0.55, 0.55, 1);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('aTip', new THREE.Float32BufferAttribute(tip, 1));
    // pháp tuyến hướng trời: cả đồng cỏ sáng đều như một mảng màu vẽ, không lấm tấm sáng tối từng lá
    const n = new Float32Array(pos.length);
    for (let i = 1; i < n.length; i += 3) n[i] = 1;
    g.setAttribute('normal', new THREE.BufferAttribute(n, 3));
    return g;
  }
  // khối mây tích vẽ tay: nhiều vệt tròn mờ chồng lên nhau, đỉnh sáng ấm, đáy phẳng tím xám
  function cloudTex(THREE, seed) {
    const W = 512,
      H = 256,
      cv = document.createElement('canvas');
    cv.width = W;
    cv.height = H;
    const c = cv.getContext('2d'),
      r = rng(seed * 7919 + 13),
      base = H * 0.78;
    const blobs = [];
    const n = 9 + Math.floor(r() * 5);
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1),
        x = W * (0.14 + 0.72 * t) + (r() - 0.5) * 40,
        hump = Math.sin(t * Math.PI) * (0.65 + r() * 0.35),
        rad = 34 + hump * 62 + r() * 18;
      blobs.push([x, base - rad * 0.55 - hump * 30, rad]);
    }
    // bóng dưới đáy trước, rồi thân sáng, rồi viền sáng phía trên
    for (const [x, y, rad] of blobs) {
      const g = c.createRadialGradient(x, y + rad * 0.35, rad * 0.2, x, y + rad * 0.35, rad * 1.05);
      g.addColorStop(0, 'rgba(176,170,200,0.9)');
      g.addColorStop(1, 'rgba(176,170,200,0)');
      c.fillStyle = g;
      c.beginPath();
      c.arc(x, y + rad * 0.35, rad * 1.05, 0, Math.PI * 2);
      c.fill();
    }
    for (const [x, y, rad] of blobs) {
      const g = c.createRadialGradient(x - rad * 0.2, y - rad * 0.35, rad * 0.1, x, y, rad);
      g.addColorStop(0, 'rgba(255,253,246,1)');
      g.addColorStop(0.55, 'rgba(244,240,238,0.95)');
      g.addColorStop(1, 'rgba(226,224,236,0)');
      c.fillStyle = g;
      c.beginPath();
      c.arc(x, y, rad, 0, Math.PI * 2);
      c.fill();
    }
    // nét cọ: vài vệt sáng ngắn trên đỉnh các khối
    c.globalCompositeOperation = 'source-atop';
    for (let i = 0; i < 60; i++) {
      const [x, y, rad] = blobs[Math.floor(r() * blobs.length)],
        a = -Math.PI / 2 + (r() - 0.5) * 2.2,
        d = rad * (0.55 + r() * 0.4);
      c.strokeStyle = 'rgba(255,255,250,' + (0.25 + r() * 0.35).toFixed(2) + ')';
      c.lineWidth = 3 + r() * 6;
      c.lineCap = 'round';
      c.beginPath();
      const sx = x + Math.cos(a) * d,
        sy = y + Math.sin(a) * d;
      c.moveTo(sx, sy);
      c.lineTo(sx + Math.cos(a + 1.57) * 14, sy + Math.sin(a + 1.57) * 14);
      c.stroke();
    }
    // đáy phẳng: xoá mềm phần dưới đường đáy
    c.globalCompositeOperation = 'destination-out';
    const fade = c.createLinearGradient(0, base - 6, 0, base + 18);
    fade.addColorStop(0, 'rgba(0,0,0,0)');
    fade.addColorStop(1, 'rgba(0,0,0,1)');
    c.fillStyle = fade;
    c.fillRect(0, base - 6, W, H - base + 6);
    const tex = new THREE.CanvasTexture(cv);
    tex.encoding = THREE.sRGBEncoding;
    return tex;
  }
  function setup(G) {
    const { THREE, scene } = G;
    const U = { uWind: { value: 0 }, uBase: { value: new THREE.Color(COL.base) }, uTipC: { value: new THREE.Color(COL.tip) } };
    // cỏ: màu gốc sẫm lên ngọn vàng sáng, pha màu đất chỗ đó (instanceColor); gió: sóng chạy qua đồng theo một hướng, cộng
    // rung nhỏ từng khóm; ngọn đang ngả theo gió sáng lên (như ánh nắng lướt trên đồng cỏ)
    const gMat = new THREE.MeshLambertMaterial({ color: '#ffffff', side: THREE.DoubleSide });
    gMat.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, U);
      sh.vertexShader =
        'uniform float uWind; attribute float aTip; varying float vTip; varying float vGust;\n' +
        sh.vertexShader.replace(
          '#include <begin_vertex>',
          '#include <begin_vertex>\nvTip = aTip; vec4 wp0 = instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);\n' +
            'float wave = sin(uWind * 1.25 - dot(wp0.xz, vec2(0.32, 0.19))) * 0.5 + 0.5;\n' +
            'float jit = sin(uWind * 3.1 + wp0.x * 1.7 + wp0.z * 1.3) * 0.25;\n' +
            'vGust = wave; float bend = (0.1 + wave * 0.32 + jit * 0.1) * aTip * aTip;\n' +
            'transformed.x += bend * 0.85; transformed.z += bend * 0.5; transformed.y -= bend * bend * 0.6;',
        );
      sh.fragmentShader =
        'uniform vec3 uBase; uniform vec3 uTipC; varying float vTip; varying float vGust;\n' +
        sh.fragmentShader.replace(
          '#include <color_fragment>',
          '#include <color_fragment>\nvec3 gc = mix(uBase, uTipC, smoothstep(0.0, 1.0, vTip));\n' +
            'diffuseColor.rgb = mix(gc, vColor * mix(0.6, 1.25, vTip), 0.35) * (1.0 + vGust * vTip * 0.22);',
        );
    };
    gMat.customProgramCacheKey = () => 'paint-grass';
    const dMat = new THREE.MeshLambertMaterial({ color: '#ffffff' });
    const grass = new THREE.InstancedMesh(bladeGeo(THREE), gMat, MAX_G),
      dots = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.035, 0), dMat, MAX_D);
    grass.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(MAX_G * 3), 3);
    dots.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(MAX_D * 3), 3);
    for (const m of [grass, dots]) {
      m.count = 0;
      m.frustumCulled = false;
      m.visible = false;
      m.receiveShadow = true;
      scene.add(m);
    }
    // mây vẽ quanh chân trời (không theo sương: luôn rõ như nền tranh)
    const clouds = [];
    for (let k = 0; k < CLOUDS; k++) {
      const s = new THREE.Sprite(
        new THREE.SpriteMaterial({ map: cloudTex(THREE, k + 1), transparent: true, depthWrite: false, fog: false, opacity: 0 }),
      );
      s.visible = false;
      s.renderOrder = -2;
      s.userData = { a: (k / CLOUDS) * Math.PI * 2 + (k % 3) * 0.4, d: 150 + (k % 4) * 28, y: 16 + (k % 3) * 11, w: 70 + (k % 4) * 18 };
      scene.add(s);
      clouds.push(s);
    }
    // thân mềm tô theo mảng sáng tối mềm (ba nấc, lọc tuyến tính: ranh giới nấc mềm như nét màu nước), viền sáng ấm
    const ramp = new THREE.DataTexture(new Uint8Array([120, 120, 120, 255, 200, 200, 200, 255, 255, 255, 255, 255]), 3, 1, THREE.RGBAFormat);
    ramp.minFilter = ramp.magFilter = THREE.LinearFilter;
    ramp.needsUpdate = true;
    const body = new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: ramp, skinning: true });
    body.onBeforeCompile = (sh) => {
      sh.fragmentShader = sh.fragmentShader.replace(
        '#include <emissivemap_fragment>',
        '#include <emissivemap_fragment>\n' +
          '{ float fr = pow(1.0 - clamp(dot(normal, normalize(vViewPosition)), 0.0, 1.0), 3.0);\n' +
          '  totalEmissiveRadiance += vec3(1.0, 0.86, 0.66) * smoothstep(0.35, 0.75, fr) * 0.28 * diffuseColor.rgb + diffuseColor.rgb * 0.06; }',
      );
    };
    body.customProgramCacheKey = () => 'paint-body';

    const st = { on: false, i: -1, cx: 1e9, cz: 1e9, onAt: 0, k: 0, L: null, flat: true };
    const M = new THREE.Matrix4(),
      Q = new THREE.Quaternion(),
      Sv = new THREE.Vector3(),
      Pv = new THREE.Vector3(),
      E = new THREE.Euler(),
      col = new THREE.Color(),
      gc = new THREE.Color();
    function rebuild(L, cx, cz) {
      const PL = G.buildings && G.buildings.places ? G.buildings.places(L.i) : null,
        solids = ((PL && PL.solids) || []).filter((B) => B.kind !== 'town'),
        grounds = (PL && PL.grounds) || [];
      const low = G.perf && G.perf.pr != null && G.perf.pr < 1,
        tries = low ? TRY / 2 : TRY;
      const green = (x, z) => {
        L.groundAt(x, z, gc);
        return Math.max(0, Math.min(1, (gc.g - Math.max(gc.r, gc.b) - GREEN.from) / (GREEN.full - GREEN.from)));
      };
      let ng = 0,
        nd = 0;
      const c0x = Math.floor((cx - R) / CELL),
        c1x = Math.floor((cx + R) / CELL),
        c0z = Math.floor((cz - R) / CELL),
        c1z = Math.floor((cz + R) / CELL);
      for (let ix = c0x; ix <= c1x; ix++)
        for (let iz = c0z; iz <= c1z; iz++) {
          const r = rng((ix * 2654435761) ^ (iz * 40503) ^ ((L.i + 7) * 97531));
          for (let k = 0; k < tries; k++) {
            const x = (ix + r()) * CELL,
              z = (iz + r()) * CELL,
              a = r(),
              b = r(),
              c = r(),
              d = Math.hypot(x - cx, z - cz);
            if (d > R || ng >= MAX_G) continue;
            if (!G.near.freeAt(L, solids, grounds, x, z)) continue;
            if (c > green(x, z)) continue;
            const edge = Math.min(1, (R - d) / 4),
              y = L.surfAt(x, z),
              s = (0.75 + a * 0.6) * edge;
            M.compose(Pv.set(x, y, z), Q.setFromEuler(E.set(0, a * 6.28, 0)), Sv.set(s, s * (0.8 + b * 0.7), s));
            grass.setMatrixAt(ng, M);
            grass.setColorAt(ng++, col.copy(gc).multiplyScalar(0.9 + b * 0.2));
            // hoa li ti: một phần nhỏ khóm cỏ có chấm hoa trên ngọn
            if (b > 0.93 && nd < MAX_D) {
              const ds = 0.8 + a * 0.6;
              M.compose(Pv.set(x + (a - 0.5) * 0.2, y + s * (0.32 + c * 0.25), z + (b - 0.5) * 0.2), Q.identity(), Sv.set(ds, ds * 0.7, ds));
              dots.setMatrixAt(nd, M);
              dots.setColorAt(nd++, col.set(COL.dots[Math.floor(a * COL.dots.length) % COL.dots.length]));
            }
          }
        }
      grass.count = ng;
      dots.count = nd;
      for (const m of [grass, dots]) {
        m.instanceMatrix.needsUpdate = true;
        m.instanceColor.needsUpdate = true;
        m.position.copy(L.g.position);
        m.updateMatrix();
      }
      st.cx = cx;
      st.cz = cz;
    }
    // mặt đất nhẵn: bỏ mặt gãy khúc (cần pháp tuyến theo đỉnh: tính một lần)
    function smoothGround(L, on) {
      const m = L && L.groundMat;
      if (!m) return;
      if (on) {
        L.g.traverse((o) => {
          if (o.name === 'ground' && o.geometry && !o.geometry.attributes.normal) o.geometry.computeVertexNormals();
        });
        st.flat = m.flatShading;
      }
      m.flatShading = on ? false : st.flat;
      m.needsUpdate = true;
    }
    function off() {
      if (!st.on) return;
      st.on = false;
      st.k = 0;
      grass.visible = dots.visible = false;
      for (const s of clouds) s.visible = false;
      smoothGround(st.L, false);
      st.L = null;
      if (G.softCrowd && G.softCrowd.setBody) G.softCrowd.setBody(null);
      if (G.post) G.post.fx.paint = 0;
    }
    function update(on, i, head) {
      const L = on && i >= 0 ? G.lands[i] : null;
      if (!L || !ON[L.ter] || !G.near) return off();
      if (!st.on || st.L !== L) {
        off();
        st.on = true;
        st.L = L;
        st.onAt = performance.now();
        st.cx = st.cz = 1e9;
        smoothGround(L, true);
      }
      st.k = Math.min(1, (performance.now() - st.onAt) / FADE);
      const x = head.x - L.center.x,
        z = head.z - L.center.z;
      if (st.i !== i || Math.hypot(x - st.cx, z - st.cz) > CELL) {
        st.i = i;
        rebuild(L, x, z);
      }
      grass.visible = dots.visible = true;
      U.uWind.value = performance.now() * 0.001;
      // mây: vòng quanh người, trôi chậm, hiện dần
      const t = performance.now() * 0.001;
      for (const s of clouds) {
        const u = s.userData,
          a = u.a + t * 0.004;
        s.position.set(head.x + Math.cos(a) * u.d, head.y + u.y, head.z + Math.sin(a) * u.d);
        s.scale.set(u.w, u.w * 0.5, 1);
        s.material.opacity = 0.95 * st.k;
        s.visible = true;
      }
      if (G.softCrowd && G.softCrowd.setBody) G.softCrowd.setBody(body);
      // hậu kỳ: lọc vẽ tay; bớt hạt phim, bớt mờ hậu cảnh (tranh không có hạt, hậu cảnh vẫn rõ nét màu)
      const fx = G.post.fx;
      fx.paint = st.k;
      fx.grain *= 1 - 0.85 * st.k;
      fx.dof *= 1 - 0.6 * st.k;
    }
    G.painterly = {
      update,
      get on() {
        return st.on;
      },
      counts: () => ({ grass: grass.visible ? grass.count : 0, dots: dots.visible ? dots.count : 0 }),
      ON,
    };
  }
  BK.Painterly3D = { setup, ON };
})(typeof self !== 'undefined' ? self : globalThis);
