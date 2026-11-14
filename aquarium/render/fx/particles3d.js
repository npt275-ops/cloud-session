/* Bể Kính · render/fx/particles3d.js · Bộ hạt dùng chung (design/ke-hoach-buoc-31.md mục 5, bản đầu cho cú nhập hồn)
 * Hai loại, mỗi loại một khối, một lượt vẽ:
 *   dots   hạt tròn mềm (bụi, khói nhẹ, bụi lơ lửng trong nắng): emit({ p, v, life, size, color, grav, drag, fade })
 *   lines  vệt thẳng (vệt gió khi lao): streak({ p, dir, len, life, color }), mỗi khung hình tự trôi theo vận tốc
 * Vòng đệm có giới hạn (MAX): đầy thì hạt cũ nhất nhường chỗ. Máy chậm (render/perf3d.js hạ độ nét) thì phát ít đi một nửa.
 * Toạ độ thế giới. update(sec) mỗi khung hình (render/fx/soul-fx.js gọi). Cần: three.js. */
(function (root) {
  const BK = root.BK || (root.BK = {});
  const MAX = 1400,
    MAX_L = 160;
  const DOT_V =
    'attribute float aSize; attribute float aAlpha; attribute vec3 aColor; varying float vA; varying vec3 vC;\n' +
    'void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv;\n' +
    ' gl_PointSize = aSize * (300.0 / max(0.1, -mv.z)); vA = aAlpha; vC = aColor; }';
  const DOT_F =
    'varying float vA; varying vec3 vC;\n' +
    'void main(){ vec2 c = gl_PointCoord - 0.5; float d = dot(c, c); if (d > 0.25) discard;\n' +
    ' gl_FragColor = vec4(vC, vA * (1.0 - smoothstep(0.05, 0.25, d))); }';
  function setup(G) {
    const { THREE, scene } = G;
    /* ----- hạt tròn ----- */
    const P = new Float32Array(MAX * 3),
      V = new Float32Array(MAX * 3),
      C = new Float32Array(MAX * 3),
      S = new Float32Array(MAX),
      A = new Float32Array(MAX),
      life = new Float32Array(MAX),
      age = new Float32Array(MAX),
      size0 = new Float32Array(MAX),
      grav = new Float32Array(MAX),
      drag = new Float32Array(MAX),
      alpha0 = new Float32Array(MAX),
      grow = new Float32Array(MAX);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(P, 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('aColor', new THREE.BufferAttribute(C, 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('aSize', new THREE.BufferAttribute(S, 1).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('aAlpha', new THREE.BufferAttribute(A, 1).setUsage(THREE.DynamicDrawUsage));
    const dots = new THREE.Points(
      g,
      new THREE.ShaderMaterial({ vertexShader: DOT_V, fragmentShader: DOT_F, transparent: true, depthWrite: false }),
    );
    dots.frustumCulled = false;
    dots.renderOrder = 6;
    scene.add(dots);
    let head = 0,
      live = 0;
    const col = new THREE.Color();
    function emit(o) {
      if (G.perf && G.perf.pr != null && G.perf.pr < 1 && Math.random() < 0.5) return; // (máy chậm: phát ít đi)
      const i = head;
      head = (head + 1) % MAX;
      if (life[i] <= 0) live++;
      P[i * 3] = o.p.x;
      P[i * 3 + 1] = o.p.y;
      P[i * 3 + 2] = o.p.z;
      V[i * 3] = o.v ? o.v.x : 0;
      V[i * 3 + 1] = o.v ? o.v.y : 0;
      V[i * 3 + 2] = o.v ? o.v.z : 0;
      col.set(o.color || '#ffffff');
      C[i * 3] = col.r;
      C[i * 3 + 1] = col.g;
      C[i * 3 + 2] = col.b;
      life[i] = o.life || 1;
      age[i] = 0;
      size0[i] = o.size || 0.2;
      grav[i] = o.grav || 0;
      drag[i] = o.drag || 0;
      alpha0[i] = o.alpha == null ? 0.8 : o.alpha;
      grow[i] = o.grow || 0;
    }
    /* ----- vệt thẳng ----- */
    const LP = new Float32Array(MAX_L * 6),
      LC = new Float32Array(MAX_L * 6),
      lpos = new Float32Array(MAX_L * 3),
      lvel = new Float32Array(MAX_L * 3),
      ldir = new Float32Array(MAX_L * 3),
      llen = new Float32Array(MAX_L),
      llife = new Float32Array(MAX_L),
      lage = new Float32Array(MAX_L),
      lcol = new Float32Array(MAX_L * 3);
    const lg = new THREE.BufferGeometry();
    lg.setAttribute('position', new THREE.BufferAttribute(LP, 3).setUsage(THREE.DynamicDrawUsage));
    lg.setAttribute('color', new THREE.BufferAttribute(LC, 3).setUsage(THREE.DynamicDrawUsage));
    const lines = new THREE.LineSegments(
      lg,
      new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }),
    );
    lines.frustumCulled = false;
    lines.renderOrder = 7;
    scene.add(lines);
    let lhead = 0;
    function streak(o) {
      const i = lhead;
      lhead = (lhead + 1) % MAX_L;
      lpos.set([o.p.x, o.p.y, o.p.z], i * 3);
      lvel.set(o.v ? [o.v.x, o.v.y, o.v.z] : [0, 0, 0], i * 3);
      ldir.set([o.dir.x, o.dir.y, o.dir.z], i * 3);
      llen[i] = o.len || 1;
      llife[i] = o.life || 0.4;
      lage[i] = 0;
      col.set(o.color || '#ffffff');
      lcol.set([col.r, col.g, col.b], i * 3);
    }
    function update(sec) {
      // hạt tròn: trôi, rơi, hãm, lớn dần, mờ dần theo tuổi
      if (live > 0) {
        let n = 0;
        for (let i = 0; i < MAX; i++) {
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
          const k = Math.max(0, 1 - drag[i] * sec);
          V[i * 3] *= k;
          V[i * 3 + 1] = V[i * 3 + 1] * k - grav[i] * sec;
          V[i * 3 + 2] *= k;
          P[i * 3] += V[i * 3] * sec;
          P[i * 3 + 1] += V[i * 3 + 1] * sec;
          P[i * 3 + 2] += V[i * 3 + 2] * sec;
          const u = age[i] / life[i];
          S[i] = size0[i] * (1 + grow[i] * u);
          A[i] = alpha0[i] * Math.min(1, u * 6) * (1 - u) * (1 - u); // (hiện nhanh, tắt dần)
        }
        live = n;
        g.attributes.position.needsUpdate = g.attributes.aSize.needsUpdate = g.attributes.aAlpha.needsUpdate = true;
        g.attributes.aColor.needsUpdate = true;
      }
      dots.visible = live > 0;
      // vệt thẳng: trôi theo vận tốc, sáng lên rồi tắt
      let any = false;
      for (let i = 0; i < MAX_L; i++) {
        let a = 0;
        if (llife[i] > 0) {
          lage[i] += sec;
          if (lage[i] >= llife[i]) llife[i] = 0;
          else {
            any = true;
            const u = lage[i] / llife[i];
            a = Math.sin(Math.PI * u);
            for (let c = 0; c < 3; c++) lpos[i * 3 + c] += lvel[i * 3 + c] * sec;
          }
        }
        for (let c = 0; c < 3; c++) {
          LP[i * 6 + c] = lpos[i * 3 + c];
          LP[i * 6 + 3 + c] = lpos[i * 3 + c] + ldir[i * 3 + c] * llen[i];
          LC[i * 6 + c] = lcol[i * 3 + c] * a;
          LC[i * 6 + 3 + c] = lcol[i * 3 + c] * a * 0.15; // (đuôi vệt mờ)
        }
      }
      lines.visible = any;
      lg.attributes.position.needsUpdate = lg.attributes.color.needsUpdate = true;
    }
    G.particles = {
      emit,
      streak,
      update,
      get live() {
        return live;
      },
    };
  }
  BK.Particles3D = { setup, MAX };
})(typeof self !== 'undefined' ? self : globalThis);
