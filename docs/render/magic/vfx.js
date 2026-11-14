/* Bể Kính · render/magic/vfx.js · Bộ hạt dùng chung của phép (design/ke-hoach-buoc-37.md mục 3)
 * Mọi hiệu ứng phép ghép từ các viên gạch ở đây; mỗi viên gạch một khối, một lượt vẽ cho cả bể:
 *   soft    hạt mềm (khói, bụi, hơi nước, bông mây): tròn, có sáng tối nhẹ như cục bông, trộn màu thường
 *   glow    hạt sáng (lửa, tàn lửa, tia phép): phát sáng và che một phần nền (đọc được cả trên nền sáng ban ngày, cộng sáng
 *           thuần thì chìm mất trên cỏ, trời), lõi trắng dần ra màu
 *   debris  mảnh vụn (đá, đất, giọt nước to): khối tròn mịn có vật lý: rơi, nảy, lăn, nằm lại rồi nhỏ dần
 *   decal   vết trên đất: đĩa mờ (cháy xém, đất ướt) hay vòng (sóng xung kích), to dần, nhạt dần
 *   light   đèn chớp (chớp nổ, ánh lửa): vài đèn điểm dùng lại
 *   sigil   vòng phù chú sáng (render/magic/sigils.js): bung ra, xoay, mờ dần; quay mặt theo hướng phép hay nằm sát đất
 * Phát theo công thức (render/magic/recipes.js: chỉ là số, màu): play(tên, chỗ, { dir, scale }); nguồn phát liên tục (đuôi
 * cầu lửa, lửa cháy): emitter(tên, chỗ) trả { pos, stop(), paused }. Màu viết theo bảng màu chung (render/style/palette.js), ví dụ
 * 'fire.core'. Cỡ hạt tính theo đơn vị thế giới (đúng cỡ dù xa gần). Toạ độ thế giới.
 * Giới hạn: tối đa MAX hạt mỗi loại (máy chậm: một nửa); đầy thì hạt cũ nhất nhường chỗ.
 * Cần: three.js, render/style/palette.js, render/magic/recipes.js, render/magic/sigils.js. */
(function (root) {
  const BK = root.BK || (root.BK = {});
  const MAX = { soft: 2000, glow: 2000, debris: 240, decal: 96, light: 4, sigil: 6 };
  const rnd = (a, b) => (Array.isArray(a) ? a[0] + Math.random() * (a[1] - a[0]) : a == null ? b : a);
  // (độ sâu: renderer dùng logarithmicDepthBuffer, shader tự viết phải tính độ sâu cùng kiểu, không thì mặt đất che mất hạt)
  const LD_V = '#include <common>\n#include <logdepthbuf_pars_vertex>\n',
    LD_F = '#include <logdepthbuf_pars_fragment>\n';
  const POINT_V =
    LD_V +
    'attribute float aSize; attribute float aAlpha; attribute vec3 aColor; uniform float uScale; varying float vA; varying vec3 vC;\n' +
    'void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv;\n' +
    ' gl_PointSize = max(1.5, aSize * uScale / max(0.05, -mv.z)); vA = aAlpha; vC = aColor;\n#include <logdepthbuf_vertex>\n}';
  // hạt mềm: tròn, sáng phía trên trái, tối phía dưới phải (như cục bông có nắng), rìa mềm
  const SOFT_F =
    LD_F +
    'varying float vA; varying vec3 vC;\n' +
    'void main(){\n#include <logdepthbuf_fragment>\n vec2 c = gl_PointCoord - 0.5; float d = length(c); if (d > 0.5) discard;\n' +
    ' float lit = 0.82 + 0.3 * clamp(0.5 - (c.x + c.y) * 0.9, 0.0, 1.0);\n' +
    ' gl_FragColor = vec4(vC * lit, vA * (1.0 - smoothstep(0.32, 0.5, d))); }';
  // hạt sáng: màu nhân sẵn độ mờ (trộn: nguồn × 1 + nền × (1 − độ mờ)): vừa cộng sáng vừa che một phần nền; lõi trắng dần ra màu
  const GLOW_F =
    LD_F +
    'varying float vA; varying vec3 vC;\n' +
    'void main(){\n#include <logdepthbuf_fragment>\n vec2 c = gl_PointCoord - 0.5; float d = length(c); if (d > 0.5) discard;\n' +
    ' float k = pow(1.0 - d * 2.0, 1.4); vec3 col = mix(vC, vec3(1.0), k * k * 0.65);\n' +
    ' gl_FragColor = vec4(col * k * vA * 1.15, k * vA * 0.7); }';
  // vết trên đất: đĩa mờ hay vòng
  const DECAL_V =
    LD_V +
    'attribute float aAlpha; attribute float aRing; attribute vec3 aColor; varying float vA; varying float vR; varying vec3 vC; varying vec2 vUv;\n' +
    'void main(){ vUv = uv; vA = aAlpha; vR = aRing; vC = aColor; gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);\n#include <logdepthbuf_vertex>\n}';
  const DECAL_F =
    LD_F +
    'varying float vA; varying float vR; varying vec3 vC; varying vec2 vUv;\n' +
    'void main(){\n#include <logdepthbuf_fragment>\n float r = length(vUv - 0.5) * 2.0; if (r > 1.0) discard;\n' +
    ' float a = vR > 0.5 ? smoothstep(0.62, 0.84, r) * (1.0 - smoothstep(0.88, 1.0, r)) : 1.0 - smoothstep(0.35, 1.0, r);\n' +
    ' gl_FragColor = vec4(vC, a * vA); }';

  function setup(G) {
    const { THREE, scene, renderer, camera } = G;
    const PAL = BK.Palette,
      col = new THREE.Color();
    const color = (c) => col.set(typeof c === 'string' && c[0] !== '#' ? PAL.c(c) : c || '#ffffff');
    const low = () => G.perf && G.perf.pr != null && G.perf.pr < 1;
    const U = { uScale: { value: 400 } };

    /* ----- hạt (soft, glow): vòng đệm cố định ----- */
    function pointLayer(n, frag, blending, order) {
      const L = {
        n,
        head: 0,
        live: 0,
        P: new Float32Array(n * 3),
        V: new Float32Array(n * 3),
        C: new Float32Array(n * 3),
        C0: new Float32Array(n * 3),
        C1: new Float32Array(n * 3),
        S: new Float32Array(n),
        A: new Float32Array(n),
        age: new Float32Array(n),
        life: new Float32Array(n),
        s0: new Float32Array(n),
        s1: new Float32Array(n),
        a0: new Float32Array(n),
        grav: new Float32Array(n),
        drag: new Float32Array(n),
      };
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(L.P, 3).setUsage(THREE.DynamicDrawUsage));
      g.setAttribute('aColor', new THREE.BufferAttribute(L.C, 3).setUsage(THREE.DynamicDrawUsage));
      g.setAttribute('aSize', new THREE.BufferAttribute(L.S, 1).setUsage(THREE.DynamicDrawUsage));
      g.setAttribute('aAlpha', new THREE.BufferAttribute(L.A, 1).setUsage(THREE.DynamicDrawUsage));
      L.g = g;
      L.mesh = new THREE.Points(
        g,
        new THREE.ShaderMaterial({ uniforms: U, vertexShader: POINT_V, fragmentShader: frag, transparent: true, depthWrite: false, blending }),
      );
      L.mesh.frustumCulled = false;
      L.mesh.renderOrder = order;
      L.mesh.visible = false;
      scene.add(L.mesh);
      return L;
    }
    const soft = pointLayer(MAX.soft, SOFT_F, THREE.NormalBlending, 8),
      glow = pointLayer(MAX.glow, GLOW_F, THREE.CustomBlending, 9);
    glow.mesh.material.blendSrc = THREE.OneFactor;
    glow.mesh.material.blendDst = THREE.OneMinusSrcAlphaFactor;
    // một hạt: p chỗ, v vận tốc, o thông số (life, size [đầu, cuối], color [đầu, cuối], alpha, grav, drag)
    function spawn(L, p, v, o) {
      const i = L.head;
      L.head = (L.head + 1) % (low() ? L.n >> 1 : L.n);
      if (L.life[i] <= 0) L.live++;
      L.P.set([p.x, p.y, p.z], i * 3);
      L.V.set([v.x, v.y, v.z], i * 3);
      const c = Array.isArray(o.color) ? o.color : [o.color, o.color];
      color(c[0]);
      L.C0.set([col.r, col.g, col.b], i * 3);
      color(c[1] || c[0]);
      L.C1.set([col.r, col.g, col.b], i * 3);
      L.life[i] = rnd(o.life, 1);
      L.age[i] = 0;
      const sz = Array.isArray(o.size) ? o.size : [o.size || 0.2, o.size || 0.2];
      L.s0[i] = sz[0];
      L.s1[i] = sz[1];
      L.a0[i] = o.alpha == null ? 1 : o.alpha;
      L.grav[i] = o.grav || 0;
      L.drag[i] = o.drag || 0;
    }
    function stepLayer(L, sec) {
      if (!L.live) {
        L.mesh.visible = false;
        return;
      }
      let n = 0;
      const { P, V, C, C0, C1, S, A, age, life } = L;
      for (let i = 0; i < L.n; i++) {
        if (life[i] <= 0) {
          A[i] = 0;
          continue;
        }
        age[i] += sec;
        if (age[i] >= life[i]) {
          life[i] = 0;
          A[i] = 0;
          continue;
        }
        n++;
        const k = Math.exp(-L.drag[i] * sec),
          j = i * 3;
        V[j] *= k;
        V[j + 1] = V[j + 1] * k - L.grav[i] * sec;
        V[j + 2] *= k;
        P[j] += V[j] * sec;
        P[j + 1] += V[j + 1] * sec;
        P[j + 2] += V[j + 2] * sec;
        const u = age[i] / life[i];
        S[i] = L.s0[i] + (L.s1[i] - L.s0[i]) * u;
        A[i] = L.a0[i] * Math.min(1, u * 8) * (1 - u * u); // (hiện nhanh, tắt dần)
        C[j] = C0[j] + (C1[j] - C0[j]) * u;
        C[j + 1] = C0[j + 1] + (C1[j + 1] - C0[j + 1]) * u;
        C[j + 2] = C0[j + 2] + (C1[j + 2] - C0[j + 2]) * u;
      }
      L.live = n;
      const g = L.g.attributes;
      g.position.needsUpdate = g.aColor.needsUpdate = g.aSize.needsUpdate = g.aAlpha.needsUpdate = true;
      L.mesh.visible = n > 0;
    }

    /* ----- mảnh vụn: khối tròn mịn, rơi, nảy, nằm lại ----- */
    const deb = {
      head: 0,
      live: 0,
      P: new Float32Array(MAX.debris * 3),
      V: new Float32Array(MAX.debris * 3),
      R: new Float32Array(MAX.debris * 3), // xoay (trục x, y, z) và tốc độ xoay chung
      spin: new Float32Array(MAX.debris),
      size: new Float32Array(MAX.debris),
      age: new Float32Array(MAX.debris),
      life: new Float32Array(MAX.debris),
    };
    const debMesh = new THREE.InstancedMesh(
      new THREE.IcosahedronGeometry(1, 1),
      new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.75 }),
      MAX.debris,
    );
    debMesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(MAX.debris * 3), 3);
    debMesh.count = MAX.debris;
    debMesh.frustumCulled = false;
    debMesh.castShadow = true;
    debMesh.visible = false;
    scene.add(debMesh);
    const M = new THREE.Matrix4(),
      Q = new THREE.Quaternion(),
      E = new THREE.Euler(),
      Sv = new THREE.Vector3(),
      Pv = new THREE.Vector3(),
      ZERO = new THREE.Matrix4().makeScale(0, 0, 0);
    for (let i = 0; i < MAX.debris; i++) debMesh.setMatrixAt(i, ZERO);
    // mặt đất dưới (x, z): đảo gần nhất (mép đảo trở ra: mặt biển)
    function groundAt(x, z) {
      if (G.vfxGround) return G.vfxGround(x, z);
      let best = null,
        bd = 1e9;
      for (const L of G.lands || []) {
        const d = Math.hypot(x - L.center.x, z - L.center.z);
        if (d < bd) {
          bd = d;
          best = L;
        }
      }
      if (!best || !best.inside || !best.inside(x - best.center.x, z - best.center.z, 0)) return G.sea3d ? G.sea3d.SEA_Y || 0 : 0;
      return best.center.y + best.surfAt(x - best.center.x, z - best.center.z);
    }
    function spawnDebris(p, v, o) {
      const i = deb.head;
      deb.head = (deb.head + 1) % MAX.debris;
      if (deb.life[i] <= 0) deb.live++;
      deb.P.set([p.x, p.y, p.z], i * 3);
      deb.V.set([v.x, v.y, v.z], i * 3);
      deb.R.set([Math.random() * 6, Math.random() * 6, Math.random() * 6], i * 3);
      deb.spin[i] = (Math.random() - 0.5) * 12;
      deb.size[i] = rnd(o.size, 0.1);
      deb.age[i] = 0;
      deb.life[i] = rnd(o.life, 2.5);
      color(o.color || 'earth.mid').multiplyScalar(0.85 + Math.random() * 0.3);
      debMesh.setColorAt(i, col);
    }
    function stepDebris(sec) {
      if (!deb.live) {
        debMesh.visible = false;
        return;
      }
      let n = 0;
      for (let i = 0; i < MAX.debris; i++) {
        if (deb.life[i] <= 0) continue;
        deb.age[i] += sec;
        const j = i * 3;
        if (deb.age[i] >= deb.life[i]) {
          deb.life[i] = 0;
          debMesh.setMatrixAt(i, ZERO);
          continue;
        }
        n++;
        const P = deb.P,
          V = deb.V;
        V[j + 1] -= 14 * sec;
        P[j] += V[j] * sec;
        P[j + 1] += V[j + 1] * sec;
        P[j + 2] += V[j + 2] * sec;
        const s = deb.size[i],
          gy = groundAt(P[j], P[j + 2]) + s * 0.7;
        if (P[j + 1] < gy) {
          // chạm đất: nảy lên một phần, trượt chậm lại, xoay chậm lại
          P[j + 1] = gy;
          V[j + 1] = Math.abs(V[j + 1]) > 1 ? -V[j + 1] * 0.35 : 0;
          V[j] *= 0.6;
          V[j + 2] *= 0.6;
          deb.spin[i] *= 0.6;
        }
        deb.R[j] += deb.spin[i] * sec;
        deb.R[j + 2] += deb.spin[i] * 0.7 * sec;
        const u = deb.age[i] / deb.life[i],
          k = u < 0.8 ? 1 : 1 - (u - 0.8) / 0.2; // (nhỏ dần lúc cuối rồi biến mất)
        M.compose(Pv.set(P[j], P[j + 1], P[j + 2]), Q.setFromEuler(E.set(deb.R[j], deb.R[j + 1], deb.R[j + 2])), Sv.set(s, s * 0.8, s).multiplyScalar(k));
        debMesh.setMatrixAt(i, M);
      }
      deb.live = n;
      debMesh.instanceMatrix.needsUpdate = true;
      if (debMesh.instanceColor) debMesh.instanceColor.needsUpdate = true;
      debMesh.visible = n > 0;
    }

    /* ----- vết trên đất ----- */
    const dec = {
      head: 0,
      live: 0,
      P: new Float32Array(MAX.decal * 3),
      r0: new Float32Array(MAX.decal),
      r1: new Float32Array(MAX.decal),
      age: new Float32Array(MAX.decal),
      life: new Float32Array(MAX.decal),
      a0: new Float32Array(MAX.decal),
      A: new Float32Array(MAX.decal),
      ring: new Float32Array(MAX.decal),
      C: new Float32Array(MAX.decal * 3),
    };
    const dg = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
    const decMesh = new THREE.InstancedMesh(
      dg,
      new THREE.ShaderMaterial({
        vertexShader: DECAL_V,
        fragmentShader: DECAL_F,
        transparent: true,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -3,
        polygonOffsetUnits: -3,
      }),
      MAX.decal,
    );
    dg.setAttribute('aAlpha', new THREE.InstancedBufferAttribute(dec.A, 1).setUsage(THREE.DynamicDrawUsage));
    dg.setAttribute('aRing', new THREE.InstancedBufferAttribute(dec.ring, 1));
    dg.setAttribute('aColor', new THREE.InstancedBufferAttribute(dec.C, 3));
    decMesh.frustumCulled = false;
    decMesh.renderOrder = 2;
    decMesh.visible = false;
    for (let i = 0; i < MAX.decal; i++) decMesh.setMatrixAt(i, ZERO);
    scene.add(decMesh);
    function spawnDecal(p, o) {
      const i = dec.head;
      dec.head = (dec.head + 1) % MAX.decal;
      if (dec.life[i] <= 0) dec.live++;
      dec.P.set([p.x, groundAt(p.x, p.z) + 0.03, p.z], i * 3);
      const r = Array.isArray(o.r) ? o.r : [o.r || 1, o.r || 1];
      dec.r0[i] = r[0];
      dec.r1[i] = r[1];
      dec.age[i] = 0;
      dec.life[i] = o.life || 2;
      dec.a0[i] = o.alpha == null ? 0.6 : o.alpha;
      dec.ring[i] = o.kind === 'ring' ? 1 : 0;
      color(o.color || 'earth.edge');
      dec.C.set([col.r, col.g, col.b], i * 3);
      dg.attributes.aRing.needsUpdate = dg.attributes.aColor.needsUpdate = true;
    }
    function stepDecals(sec) {
      if (!dec.live) {
        decMesh.visible = false;
        return;
      }
      let n = 0;
      for (let i = 0; i < MAX.decal; i++) {
        if (dec.life[i] <= 0) continue;
        dec.age[i] += sec;
        if (dec.age[i] >= dec.life[i]) {
          dec.life[i] = 0;
          dec.A[i] = 0;
          decMesh.setMatrixAt(i, ZERO);
          continue;
        }
        n++;
        const u = dec.age[i] / dec.life[i],
          e = 1 - (1 - u) * (1 - u), // (to nhanh rồi chậm lại)
          r = dec.r0[i] + (dec.r1[i] - dec.r0[i]) * e,
          j = i * 3;
        dec.A[i] = dec.a0[i] * (1 - u) * Math.min(1, u * 10);
        M.compose(Pv.set(dec.P[j], dec.P[j + 1], dec.P[j + 2]), Q.identity(), Sv.set(r * 2, 1, r * 2));
        decMesh.setMatrixAt(i, M);
      }
      dec.live = n;
      decMesh.instanceMatrix.needsUpdate = true;
      dg.attributes.aAlpha.needsUpdate = true;
      decMesh.visible = n > 0;
    }

    /* ----- đèn chớp: dùng lại vài đèn điểm ----- */
    const lights = [];
    for (let k = 0; k < MAX.light; k++) {
      const l = new THREE.PointLight('#ffffff', 0, 6, 2);
      l.userData = { age: 0, life: 0, i0: 0 };
      scene.add(l);
      lights.push(l);
    }
    function flash(p, o) {
      const l = lights.reduce((a, b) => (a.userData.life - a.userData.age < b.userData.life - b.userData.age ? a : b));
      l.position.copy(p);
      l.color.copy(color(o.color || '#ffffff'));
      l.distance = o.range || 6;
      l.userData = { age: 0, life: o.life || 0.4, i0: o.intensity || 2 };
      l.intensity = l.userData.i0;
    }
    function stepLights(sec) {
      for (const l of lights) {
        const d = l.userData;
        if (d.age >= d.life) {
          l.intensity = 0;
          continue;
        }
        d.age += sec;
        const u = Math.min(1, d.age / d.life);
        l.intensity = d.i0 * (1 - u) * (1 - u);
      }
    }

    /* ----- vòng phù chú: vài tấm phẳng dùng lại ----- */
    const sigils = [];
    for (let k = 0; k < MAX.sigil; k++) {
      const m = new THREE.Mesh(
        new THREE.PlaneGeometry(1, 1),
        new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide, toneMapped: false, fog: false }),
      );
      m.visible = false;
      m.renderOrder = 9;
      m.userData = { age: 0, life: 0, size: 1, spin: 1 };
      scene.add(m);
      sigils.push(m);
    }
    // sigil(hệ, chỗ, hướng mặt (null: nằm sát đất), { size, life, spin })
    function sigil(school, p, face, o) {
      const m = sigils.reduce((a, b) => (a.userData.life - a.userData.age < b.userData.life - b.userData.age ? a : b));
      m.material.map = BK.Sigils.texture(THREE, school);
      m.material.needsUpdate = true;
      m.position.copy(p);
      if (face) m.lookAt(tmp.copy(p).add(face));
      else {
        m.position.y = groundAt(p.x, p.z) + 0.04;
        m.rotation.set(-Math.PI / 2, 0, 0);
      }
      m.userData = { age: 0, life: (o && o.life) || 0.7, size: (o && o.size) || 1, spin: (o && o.spin) || 2.4, roll: 0 };
      m.visible = true;
    }
    function stepSigils(sec) {
      for (const m of sigils) {
        const d = m.userData;
        if (!m.visible) continue;
        d.age += sec;
        if (d.age >= d.life) {
          m.visible = false;
          continue;
        }
        const u = d.age / d.life,
          grow = 1 - Math.pow(1 - Math.min(1, u / 0.25), 3); // (bung ra nhanh)
        m.scale.setScalar(d.size * (0.35 + 0.65 * grow));
        m.rotateZ(d.spin * sec);
        m.material.opacity = Math.min(1, u * 8) * (u < 0.6 ? 1 : 1 - (u - 0.6) / 0.4);
      }
    }

    /* ----- phát theo công thức ----- */
    const tmp = new THREE.Vector3(),
      vel = new THREE.Vector3(),
      fwd = new THREE.Vector3(),
      UP = new THREE.Vector3(0, 1, 0),
      buf = new THREE.Vector2();
    const recipe = (r) => (typeof r === 'string' ? BK.MagicRecipes && BK.MagicRecipes[r] : r);
    // hướng bay của một hạt theo kiểu: sphere (mọi hướng), up (lên, toả nhẹ), flat (toả ngang), cone (theo dir, toả spread)
    function direction(kind, dir, spread, out) {
      if (kind === 'up') return out.set((Math.random() - 0.5) * (spread || 0.6), 1, (Math.random() - 0.5) * (spread || 0.6)).normalize();
      if (kind === 'flat') {
        const a = Math.random() * Math.PI * 2;
        return out.set(Math.cos(a), (Math.random() - 0.2) * (spread || 0.3), Math.sin(a)).normalize();
      }
      if (kind === 'cone' && dir) {
        out.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).multiplyScalar(spread || 0.5);
        return out.add(dir).normalize();
      }
      return out.set(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1).normalize();
    }
    function layerOf(name) {
      return name === 'glow' ? glow : soft;
    }
    // một nhóm hạt của công thức: n hạt quanh p (bán kính jitter), bay theo kiểu dir với tốc độ speed
    function particles(L, spec, p, sc, dir) {
      const n = Math.round((spec.n || 10) * (low() ? 0.5 : 1));
      for (let k = 0; k < n; k++) {
        tmp.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).multiplyScalar((spec.jitter || 0) * 2 * sc).add(p);
        direction(spec.dir, dir, spec.spread, vel).multiplyScalar(rnd(spec.speed, 1) * sc);
        if (spec.up) vel.y += spec.up * sc;
        spawn(L, tmp, vel, {
          life: spec.life,
          size: spec.size ? [rnd(spec.size[0], 0.2) * sc, rnd(spec.size[1], 0.2) * sc] : [0.2 * sc, 0.2 * sc],
          color: spec.color,
          alpha: spec.alpha,
          grav: (spec.grav || 0) * sc,
          drag: spec.drag,
        });
      }
    }
    // play(công thức, chỗ, { dir: hướng chính, scale: cỡ }) : phát một lần
    function play(r, p, o) {
      const R = recipe(r);
      if (!R) return;
      const sc = (o && o.scale) || 1,
        dir = o && o.dir ? fwd.copy(o.dir).normalize() : null;
      for (const spec of R.soft || []) particles(soft, spec, p, sc, dir);
      for (const spec of R.glow || []) particles(glow, spec, p, sc, dir);
      if (R.debris)
        for (let k = 0, n = Math.round(R.debris.n * (low() ? 0.5 : 1)); k < n; k++) {
          direction(R.debris.dir || 'up', dir, R.debris.spread || 1.2, vel).multiplyScalar(rnd(R.debris.speed, 4) * sc);
          spawnDebris(tmp.copy(p).addScaledVector(vel, 0.03), vel, { size: [R.debris.size[0] * sc, R.debris.size[1] * sc], life: R.debris.life, color: R.debris.color });
        }
      for (const d of R.decal || []) spawnDecal(p, { kind: d.kind, r: [d.r[0] * sc, d.r[1] * sc], life: d.life, color: d.color, alpha: d.alpha });
      if (R.light) flash(tmp.copy(p).addScaledVector(UP, 0.4 * sc), R.light);
    }
    // nguồn phát liên tục: rate hạt mỗi giây theo công thức (soft, glow) tại em.pos; stop() tắt
    const emitters = new Set();
    function emitter(r, p, o) {
      const R = recipe(r);
      const em = { R, pos: p.clone(), dir: o && o.dir ? o.dir.clone() : null, scale: (o && o.scale) || 1, acc: 0, on: true, stop: () => (em.on = false) };
      if (R) emitters.add(em);
      return em;
    }
    function stepEmitters(sec) {
      for (const em of emitters) {
        if (!em.on) {
          emitters.delete(em);
          continue;
        }
        if (em.paused) continue; // (tạm ngừng phát: ví dụ lửa lúc dừng thời gian)
        em.acc += sec * (em.R.rate || 30) * (low() ? 0.5 : 1);
        const n = Math.floor(em.acc);
        if (!n) continue;
        em.acc -= n;
        for (const spec of em.R.soft || []) particles(soft, Object.assign({}, spec, { n }), em.pos, em.scale, em.dir);
        for (const spec of em.R.glow || []) particles(glow, Object.assign({}, spec, { n }), em.pos, em.scale, em.dir);
      }
    }

    function update(sec) {
      if (!(sec > 0)) return;
      renderer.getDrawingBufferSize(buf);
      U.uScale.value = buf.y / (2 * Math.tan((camera.fov * Math.PI) / 360)); // (cỡ hạt theo đơn vị thế giới)
      stepEmitters(sec);
      stepLayer(soft, sec);
      stepLayer(glow, sec);
      stepDebris(sec);
      stepDecals(sec);
      stepLights(sec);
      stepSigils(sec);
    }
    const counts = () => ({ soft: soft.live, glow: glow.live, debris: deb.live, decal: dec.live, emitters: emitters.size });
    function clear() {
      for (const L of [soft, glow]) {
        L.life.fill(0);
        L.live = 0;
      }
      deb.life.fill(0);
      deb.live = 0;
      dec.life.fill(0);
      dec.live = 0;
      emitters.clear();
      for (const l of lights) l.intensity = 0;
      for (const m of sigils) m.visible = false;
    }
    // phát một hạt trực tiếp (hiệu ứng tự tính chỗ, vận tốc: hạt bay vào tâm, xoáy quanh người...): layer 'soft' | 'glow'
    const spawnOne = (layer, p, v, o) => spawn(layerOf(layer), p, v, o);
    G.vfx = { play, emitter, sigil, spawn: spawnOne, update, counts, clear, groundAt, MAX };
  }
  BK.VFX = { setup, MAX };
})(typeof self !== 'undefined' ? self : globalThis);
