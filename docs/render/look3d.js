/* Bể Kính · render/look3d.js · Hình ảnh "mô hình thu nhỏ" (design/ke-hoach-buoc-13.md mục III, lớp 1–3)
 * Ba lớp, đều là quy tắc dùng chung cho cả 6 đảo × 12 thời, không tô tay từng nhà:
 *   lớp 1  màu và sáng tối: nắng mạnh hơn, đèn trời và đèn hắt yếu đi, bóng ngả lam (render/sky3d.js hỏi light()); nền đậm hơn
 *          tường, màu đậm lên một chút (trong shader); tuyết ngả lam nhạt (render/map/map3d.js seasons)
 *   lớp 2  vật ngồi xuống đất: vệt tối mềm quanh chân công trình và dưới chân người (hai khối lặp, hai lượt vẽ cho cả bể)
 *   lớp 3  chi tiết nhỏ trên mặt, vẽ trong shader theo toạ độ thế giới (không ảnh dán, không thêm tam giác):
 *          mái dốc có từng lớp (rơm, ngói thời đầu; tấm lợp phẳng từ thời 7); tường loang nhẹ, tối dần xuống chân; mặt lát sát
 *          đất (đường, nền) có mạch đá; nền đảo loang hai tông, lốm đốm theo miền (cỏ, đá, cát, tuyết); sân đất có sạn.
 *          Hoạ tiết nhỏ mờ dần khi ô nhỏ hơn vài điểm ảnh (nhìn từ xa không lấm tấm); tuyết phủ thì mờ mạch, chỉ còn gò tuyết.
 * hook(vật liệu, loại) gắn đoạn shader vào vật liệu dùng chung (loại: 'build' công trình, 'ground' nền đảo, 'dirt' sân đất).
 * Đảo nào ứng với điểm ảnh nào: shader so với tâm, bán kính của 6 đảo (uLookI); mỗi đảo có thông số riêng (uLookK: bật, tuyết,
 * cỏ, thời muộn). ON = false thì tắt cả (so ảnh trước, sau). setup(G) tạo vệt tối, cập nhật mỗi khung hình.
 * Cần: three.js; game/cities.js (G.levelOf, G.villages, G.buildings); render/map/map3d.js (L.snow). */
(function (root) {
  const BK = root.BK || (root.BK = {});
  const CFG = { on: true };
  // độ phủ cỏ của nền theo miền (1: cỏ xanh lốm đốm; 0: đá, cát, băng không ngả xanh)
  const GRASS = { plains: 1, forest: 1, mountain: 0.45, tundra: 0.15, coast: 0.7, desert: 0 };
  const U = { uLook: { value: 0 }, uLookI: { value: [] }, uLookK: { value: [] } }; // uLookI[i]: (tâm x, tâm z, bán kính, cao độ mặt đảo); uLookK[i]: (bật, tuyết, cỏ, thời muộn)
  const NOISE = 'float lkH(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }\n'
    + 'float lkN(vec3 x){ vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);\n'
    + ' return mix(mix(mix(lkH(i), lkH(i + vec3(1,0,0)), f.x), mix(lkH(i + vec3(0,1,0)), lkH(i + vec3(1,1,0)), f.x), f.y),\n'
    + '  mix(mix(lkH(i + vec3(0,0,1)), lkH(i + vec3(1,0,1)), f.x), mix(lkH(i + vec3(0,1,1)), lkH(i + vec3(1,1,1)), f.x), f.y), f.z); }\n'
    // hai lớp nhiễu lệch góc nhau (không thấy lưới ô vuông của nhiễu)
    + 'float lkF(vec2 p, float s){ vec2 q = mat2(0.8, -0.6, 0.6, 0.8) * p; return 0.5 * (lkN(vec3(p * s, 1.7)) + lkN(vec3(q * s * 1.37, 4.3))); }\n';
  const BODY = {
    // công trình: mái dốc có lớp, tường loang và tối chân, mặt lát sát đất có mạch đá
    build: 'vec3 n = normalize(cross(dFdx(lp), dFdy(lp))); float ny = abs(n.y), h = lp.y - lI.w, g = lkN(lp * 2.3), k = 1.0, snow = lK.y, win = 0.0, dr = 0.0;\n'
      + 'if (ny > 0.22 && ny < 0.94) {\n'
      + '  if (lK.w < 0.5) { float c = h * 2.6 + (g - 0.5) * 0.18, w = fwidth(c), e = 1.0 - smoothstep(0.0, 0.16 + w, fract(c)); k *= 1.0 - 0.2 * e * (1.0 - smoothstep(0.25, 0.6, w)); k *= 0.94 + 0.12 * lkN(lp * vec3(9.0, 2.0, 9.0)); }\n'
      + '  else { float c = (lp.x + lp.z) * 0.9, w = fwidth(c), e = 1.0 - smoothstep(0.0, 0.06 + w, abs(fract(c) - 0.5) * 2.0 - 0.9); k *= 1.0 - 0.08 * e * (1.0 - smoothstep(0.25, 0.6, w)); }\n'
      + '  k = mix(k, 1.0, snow * 0.6); }\n'
      + 'else if (ny <= 0.22) { k *= mix(0.82, 1.0, smoothstep(0.0, 1.4, h)) * mix(0.92 + 0.16 * g, 0.98 + 0.04 * g, lK.w);\n' // (thời muộn: tường kính, bê tông gần như phẳng)
      // mảng tường lớn (render/build/kit3d.js wallMark; vLk: ngang từ giữa mặt, cao từ chân, bề rộng mặt, chiều cao): chân tường sẫm,
      // gờ mái sáng có đường chỉ, trụ góc; từng tầng một hàng cửa sổ kính sẫm có khung sáng và bậu; mặt trước sát đất có cửa ra vào.
      // Thời đầu (đất, gỗ, gạch) chân tường và gờ đậm hơn, thân tường có mạch ngang. Bề rộng âm: mặt có cửa ra vào; chiều cao âm:
      // mặt đã có cửa dựng sẵn bằng khối, không vẽ thêm
      + '  if (abs(vLk.z) > 0.5) { float u = vLk.x, v = vLk.y, W = abs(vLk.z), H = abs(vLk.w), open = step(0.0, vLk.w), px = fwidth(v), vis = 1.0 - smoothstep(0.12, 0.4, px), old = 1.0 - lK.w;\n'
      + '    k *= mix(1.0, mix(0.8, 0.68, old), vis * (1.0 - smoothstep(0.26, 0.3 + px, v)));\n'
      + '    { float c = v / 0.32, e = 1.0 - smoothstep(0.0, 0.12 + fwidth(c), fract(c)); k *= 1.0 - 0.09 * old * vis * e * step(0.3, v) * (1.0 - smoothstep(0.2, 0.5, fwidth(c))); }\n'
      + '    k *= mix(1.0, mix(1.1, 1.17, old), vis * smoothstep(H - 0.2 - px, H - 0.2, v)); k *= mix(1.0, mix(0.82, 0.72, old), vis * smoothstep(H - 0.27 - px, H - 0.25, v) * (1.0 - smoothstep(H - 0.2, H - 0.2 + px, v)));\n'
      + '    k *= mix(1.0, 0.9, vis * smoothstep(W * 0.5 - 0.17 - px, W * 0.5 - 0.15, abs(u)));\n'
      + '    if (H >= 2.0) { float nf = max(1.0, floor(H / 2.3 + 0.5)), fh = (H - 0.5) / nf, nc = max(1.0, floor((W - 0.5) / 1.7)), cw = (W - 0.5) / nc;\n'
      + '      vec2 q = vec2(fract((u + W * 0.5 - 0.25) / cw) - 0.5, fract((v - 0.3) / fh) - 0.5) * vec2(cw, fh); float inX = step(0.0, u + W * 0.5 - 0.25) * step(u, W * 0.5 - 0.25), inY = step(0.3, v) * step(v, H - 0.2);\n'
      + '      vec2 hw = vec2(min(0.42, cw * 0.3), min(0.55, fh * (H < 3.6 ? 0.2 : 0.28))); float fr = (1.0 - smoothstep(hw.x + 0.07, hw.x + 0.07 + px, abs(q.x))) * (1.0 - smoothstep(hw.y + 0.07, hw.y + 0.07 + px, abs(q.y)));\n'
      + '      float dh = min(1.6, H * 0.7), dz = step(vLk.z, 0.0) * open * (1.0 - smoothstep(0.42 - px, 0.42, abs(u))) * (1.0 - smoothstep(dh - px, dh, v));\n'
      + '      float df = step(vLk.z, 0.0) * open * (1.0 - smoothstep(0.52, 0.52 + px, abs(u))) * (1.0 - smoothstep(dh + 0.1, dh + 0.1 + px, v)), dn = step(vLk.z, 0.0) * open * (1.0 - step(0.95, abs(u))) * (1.0 - step(dh + 0.45, v));\n'
      + '      float gl = (1.0 - smoothstep(hw.x - px, hw.x, abs(q.x))) * (1.0 - smoothstep(hw.y - px, hw.y, abs(q.y))), a = vis * inX * inY * open * (1.0 - dn);\n'
      + '      float sill = (1.0 - smoothstep(hw.x + 0.14, hw.x + 0.14 + px, abs(q.x))) * smoothstep(-hw.y - 0.15 - px, -hw.y - 0.15, q.y) * (1.0 - smoothstep(-hw.y - 0.07, -hw.y - 0.07 + px, q.y));\n'
      + '      k *= mix(1.0, 1.14, a * max(fr, sill) * (1.0 - gl)); win = a * gl * (0.86 + 0.14 * step(0.0, q.x * q.y + 0.004 * sin(q.y * 40.0)));\n'
      + '      k *= mix(1.0, 1.16, vis * df * (1.0 - dz)); dr = vis * dz * (0.82 + 0.18 * step(0.06, abs(fract(u / 0.21) - 0.5))); } } }\n'
      + 'else if (h < 0.7) { vec2 c = lp.xz * 1.5; c.x += 0.5 * mod(floor(c.y), 2.0); vec2 f = abs(fract(c) - 0.5); float w = fwidth(c.y), a = (1.0 - smoothstep(0.2, 0.55, w)) * (1.0 - snow * 0.85);\n'
      + '  k *= mix(1.0, (0.92 + 0.16 * lkH(vec3(floor(c), 2.0))) * (1.0 - 0.18 * smoothstep(0.42 - w, 0.5, max(f.x, f.y))), a); }\n'
      + 'else { k *= mix(0.94 + 0.12 * g, 0.98 + 0.04 * g, lK.w); }\n'
      + 'diffuseColor.rgb *= k; float lum = dot(diffuseColor.rgb, vec3(0.3, 0.59, 0.11)); diffuseColor.rgb = mix(vec3(lum), diffuseColor.rgb, 1.1);\n'
      + 'diffuseColor.rgb = mix(diffuseColor.rgb, mix(vec3(0.16, 0.22, 0.3), vec3(0.3, 0.42, 0.52), lK.w) * (0.8 + 0.4 * lkH(vec3(floor(lp.xz * 0.6), floor(lp.y * 0.45)))), win * 0.88);\n'
      + 'diffuseColor.rgb = mix(diffuseColor.rgb, mix(vec3(0.3, 0.19, 0.11), vec3(0.2, 0.25, 0.31), lK.w), dr * 0.9);\n',
    // nền đảo: loang hai tông lớn, đốm vừa, lốm đốm nhỏ theo miền (cỏ, sỏi); tuyết thì thành gò mềm
    ground: 'float a = lkF(lp.xz, 0.11), b = lkF(lp.xz, 0.7), s = lkF(lp.xz, 3.1), snow = lK.y, grass = lK.z;\n'
      + 'float w = fwidth(lp.x * 3.1), fine = (1.0 - smoothstep(0.35, 0.8, w)) * (1.0 - snow);\n'
      + 'float k = 0.76 + 0.18 * a + 0.1 * b; k *= 1.0 - 0.12 * fine * smoothstep(0.52, 0.66, s); k = mix(k, 0.9 + 0.1 * a + 0.04 * b, snow);\n'
      + 'diffuseColor.rgb *= k; diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(0.84, 1.04, 0.8), grass * (1.0 - snow) * smoothstep(0.42, 0.72, a));\n'
      + 'diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(0.9, 0.95, 1.06), snow * (1.0 - smoothstep(0.35, 0.7, b)));\n',
    // sân đất, bãi cát: loang nhẹ, sạn nhỏ (không ngả xanh)
    dirt: 'float a = lkF(lp.xz, 0.35), s = lkF(lp.xz, 6.0), w = fwidth(lp.x * 6.0), snow = lK.y;\n'
      + 'diffuseColor.rgb *= mix((0.86 + 0.14 * a) * (1.0 - 0.09 * (1.0 - smoothstep(0.4, 0.8, w)) * smoothstep(0.58, 0.7, s)), 1.0, snow * 0.7);\n',
  };
  // gắn đoạn shader vào một vật liệu chuẩn (giữ nguyên đoạn shader đã có của nó, nếu có)
  function hook(m, kind) {
    if (!m || m.userData.look || !BODY[kind]) return m;
    const prev = m.onBeforeCompile, hadKey = Object.prototype.hasOwnProperty.call(m, 'customProgramCacheKey') ? m.customProgramCacheKey.bind(m) : null;
    m.userData.look = kind;
    m.onBeforeCompile = (sh, r) => {
      if (prev) prev(sh, r);
      sh.uniforms.uLook = U.uLook; sh.uniforms.uLookI = U.uLookI; sh.uniforms.uLookK = U.uLookK;
      const wall = kind === 'build'; // mảng tường lớn: thuộc tính aLk của khối công trình (khối không có thì bằng 0: không phải tường)
      sh.vertexShader = 'varying vec3 vLookW;\n' + (wall ? 'attribute vec4 aLk;\nvarying vec4 vLk;\n' : '') + sh.vertexShader.replace('#include <project_vertex>',
        '#include <project_vertex>\n{ vec4 lw = vec4(transformed, 1.0);\n#ifdef USE_INSTANCING\n lw = instanceMatrix * lw;\n#endif\n vLookW = (modelMatrix * lw).xyz; }' + (wall ? '\nvLk = aLk;' : ''));
      sh.fragmentShader = 'uniform float uLook;\nuniform vec4 uLookI[6];\nuniform vec4 uLookK[6];\nvarying vec3 vLookW;\n' + (wall ? 'varying vec4 vLk;\n' : '') + NOISE + sh.fragmentShader.replace('#include <color_fragment>',
        '#include <color_fragment>\nif (uLook > 0.5) { vec4 lI = vec4(0.0), lK = vec4(0.0);\n'
        + ' for (int li = 0; li < 6; li++) { if (distance(vLookW.xz, uLookI[li].xy) < uLookI[li].z) { lI = uLookI[li]; lK = uLookK[li]; } }\n'
        + ' if (lK.x > 0.5) { vec3 lp = vLookW;\n' + BODY[kind] + '} }');
    };
    m.customProgramCacheKey = () => (hadKey ? hadKey() : '') + '|look:' + kind;
    m.needsUpdate = true;
    return m;
  }
  let G0 = null;
  // ánh sáng mô hình thu nhỏ (render/sky3d.js): bật khi trời còn ngày đêm (không phải trời tím thời neon)
  const light = () => CFG.on && !!G0;

  function setup(G) {
    G0 = G;
    const { THREE, scene } = G, lands = G.lands, N = lands.length;
    for (let i = 0; i < 6; i++) { U.uLookI.value.push(new THREE.Vector4(1e9, 1e9, 0, 0)); U.uLookK.value.push(new THREE.Vector4()); }
    for (const L of lands) hook(L.groundMat, 'ground');
    // vệt tối mềm: một ảnh tròn mờ dần (vẽ lúc tải), dùng cho chân công trình và chân người
    const cv = document.createElement('canvas'); cv.width = cv.height = 64;
    { const x = cv.getContext('2d'), gr = x.createRadialGradient(32, 32, 4, 32, 32, 32); gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(0.55, 'rgba(0,0,0,0.55)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = gr; x.fillRect(0, 0, 64, 64); }
    const tex = new THREE.CanvasTexture(cv), quad = new THREE.PlaneGeometry(2, 2).rotateX(-Math.PI / 2);
    const blob = (max, op) => { const m = new THREE.InstancedMesh(quad, new THREE.MeshBasicMaterial({ map: tex, color: '#ffffff', transparent: true, opacity: op, depthWrite: false,
        polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, fog: false }), max); m.count = 0; m.frustumCulled = false; m.renderOrder = 1; scene.add(m); return m; };
    const BASE_MAX = 600, PED_MAX = 700, baseB = blob(BASE_MAX, 0.4), pedB = blob(PED_MAX, 0.34);
    // màu vệt tối theo nền: đất cỏ tối lam; trên tuyết, trên nền tím thời neon thì nhạt hơn (không thành vết bẩn)
    const SHADE = { base: new THREE.Color('#141c30'), snow: new THREE.Color('#7d8cab'), neon: new THREE.Color('#4a3a6e') }, col = new THREE.Color();
    const shadeOf = (i) => { const L = lands[i], lv = G.levelOf(i); col.copy(SHADE.base); if (lv >= 10) col.lerp(SHADE.neon, 0.8); col.lerp(SHADE.snow, Math.min(1, (L.snow || 0) * 0.9)); return col; };
    const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), V = new THREE.Vector3(), Sc = new THREE.Vector3();
    const seen = []; // [đảo] = { ref, n } danh sách chỗ công trình đã đặt vệt tối
    let baseKey = '';
    // chân công trình: theo danh sách chỗ đã có công trình của các đảo đang vẽ gần (render/buildings3d.js places().fixed)
    function bases(shown) {
      const key = shown.map((i) => (lands[i].snow > 0.5 ? 's' : '') + (G.levelOf(i) >= 10 ? 'n' : '')).join('') + '|' + shown.map((i) => { const pl = G.buildings.places(i), fx = (pl && pl.fixed) || []; if (!seen[i] || seen[i].ref !== fx || seen[i].n !== fx.length) seen[i] = { ref: fx, n: fx.length, v: (seen[i] ? seen[i].v : 0) + 1 }; return i + ':' + seen[i].v; }).join(',');
      if (key === baseKey) return; baseKey = key;
      let n = 0;
      for (const i of shown) { const L = lands[i], fx = seen[i].ref;
        for (const f of fx) { if (n >= BASE_MAX || !f || f.r == null || String(f.P || '').startsWith('spot:')) continue; const r = Math.min(7.5, f.r * 1.08 + 0.5);
          V.set(L.center.x + f.x, L.center.y + 0.07, L.center.z + f.y); Sc.set(r, 1, r); M.compose(V, Q, Sc); baseB.setColorAt(n, shadeOf(i)); baseB.setMatrixAt(n++, M); } }
      baseB.count = n; baseB.instanceMatrix.needsUpdate = true; if (baseB.instanceColor) baseB.instanceColor.needsUpdate = true;
    }
    function update() {
      U.uLook.value = CFG.on ? 1 : 0;
      const shown = [];
      for (let i = 0; i < N; i++) {
        const L = lands[i], v = G.villages && G.villages[i], lv = G.levelOf(i);
        U.uLookI.value[i].set(L.center.x, L.center.z, G.lands3d.LAND_R * 1.12, L.center.y);
        U.uLookK.value[i].set(CFG.on ? 1 : 0, L.snow || 0, GRASS[L.ter] != null ? GRASS[L.ter] : 0.5, lv >= 7 ? 1 : 0);
        if (CFG.on && v && v.visible) shown.push(i);
      }
      baseB.visible = pedB.visible = shown.length > 0; if (!shown.length) return;
      bases(shown);
      let n = 0;
      for (const i of shown) { const L = lands[i], c = shadeOf(i); for (const p of G.villages[i].peds()) { if (n >= PED_MAX) break; if (Math.abs(p.y) > 0.3) continue;
        V.set(L.center.x + p.x, L.center.y + 0.09, L.center.z + p.z); Sc.set(0.42, 1, 0.42); M.compose(V, Q, Sc); pedB.setColorAt(n, c); pedB.setMatrixAt(n++, M); } }
      pedB.count = n; pedB.instanceMatrix.needsUpdate = true; if (pedB.instanceColor) pedB.instanceColor.needsUpdate = true;
    }
    G.look = { update };
  }
  BK.Look3D = { CFG, hook, light, setup };
})(typeof self !== 'undefined' ? self : globalThis);
