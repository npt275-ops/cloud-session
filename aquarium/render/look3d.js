/* Bể Kính · render/look3d.js · Lát cắt mẫu hình ảnh "mô hình thu nhỏ" (design/ke-hoach-buoc-13.md mục III, lớp 1–3)
 * Chỉ bật cho một đảo ở một thời (SLICE: Lúa Vàng, thời 3) để người chơi duyệt trước khi nhân rộng. Ba lớp, đều là quy tắc
 * dùng chung, không tô tay từng nhà:
 *   lớp 1  màu và sáng tối: nắng mạnh hơn, đèn trời và đèn hắt yếu đi, bóng ngả lam (render/sky3d.js hỏi light()); nền đậm hơn
 *          tường, màu đậm lên một chút (trong shader)
 *   lớp 2  vật ngồi xuống đất: vệt tối mềm quanh chân công trình và dưới chân người (hai khối lặp, hai lượt vẽ)
 *   lớp 3  chi tiết nhỏ trên mặt, vẽ trong shader theo toạ độ thế giới (không cần ảnh dán, không thêm tam giác):
 *          mặt dốc (mái) có từng lớp rơm, ngói; tường loang nhẹ và tối dần xuống chân; mặt lát (đường, nền) có mạch đá;
 *          nền đất lốm đốm cỏ, loang hai tông
 * hook(vật liệu, loại) gắn đoạn shader vào vật liệu dùng chung (loại: 'build' công trình, 'ground' nền đảo); đoạn shader chỉ
 * có tác dụng trong vòng tròn của đảo đang bật (uLookC) khi uLook = 1, nên các đảo khác giữ nguyên hình cũ.
 * setup(G) tạo vệt tối, cập nhật mỗi khung hình. Cần: three.js; game/cities.js (G.levelOf, G.villageOf, G.buildings). */
(function (root) {
  const BK = root.BK || (root.BK = {});
  const SLICE = { isle: 0, level: 3 };
  const U = { uLook: { value: 0 }, uLookC: { value: null } }; // uLookC: (tâm x, tâm z, bán kính, cao độ mặt đảo)
  const NOISE = 'float lkH(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }\n'
    + 'float lkN(vec3 x){ vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);\n'
    + ' return mix(mix(mix(lkH(i), lkH(i + vec3(1,0,0)), f.x), mix(lkH(i + vec3(0,1,0)), lkH(i + vec3(1,1,0)), f.x), f.y),\n'
    + '  mix(mix(lkH(i + vec3(0,0,1)), lkH(i + vec3(1,0,1)), f.x), mix(lkH(i + vec3(0,1,1)), lkH(i + vec3(1,1,1)), f.x), f.y), f.z); }\n';
  const BODY = {
    // công trình: mái dốc có lớp, tường loang và tối chân, mặt lát sát đất có mạch đá
    build: 'vec3 n = normalize(cross(dFdx(lp), dFdy(lp))); float ny = abs(n.y), h = lp.y - uLookC.w, g = lkN(lp * 2.3), k = 1.0;\n'
      + 'if (ny > 0.22 && ny < 0.94) { float c = fract(h * 2.4 + (g - 0.5) * 0.3); k *= 0.78 + 0.28 * smoothstep(0.0, 0.3, c); k *= 0.92 + 0.16 * lkN(lp * vec3(6.0, 1.0, 6.0)); }\n'
      + 'else if (ny <= 0.22) { k *= mix(0.84, 1.0, smoothstep(0.0, 1.5, h)) * (0.9 + 0.2 * g); k *= 1.0 - 0.06 * step(0.93, fract(h * 1.9)); }\n'
      + 'else if (h < 0.7) { vec2 c = lp.xz * 1.5; c.x += 0.5 * mod(floor(c.y), 2.0); vec2 f = abs(fract(c) - 0.5); k *= (0.9 + 0.2 * lkH(vec3(floor(c), 2.0))) * (1.0 - 0.2 * smoothstep(0.4, 0.5, max(f.x, f.y))); }\n'
      + 'else { k *= 0.93 + 0.14 * g; }\n'
      + 'diffuseColor.rgb *= k; float lum = dot(diffuseColor.rgb, vec3(0.3, 0.59, 0.11)); diffuseColor.rgb = mix(vec3(lum), diffuseColor.rgb, 1.12);\n',
    // nền đảo: loang hai tông lớn, đốm vừa, lốm đốm cỏ nhỏ; đậm hơn tường
    ground: 'float a = lkN(vec3(lp.xz * 0.13, 0.0)), b = lkN(vec3(lp.xz * 0.8, 3.0)), s = lkN(vec3(lp.xz * 4.2, 7.0)) * lkN(vec3(lp.xz * 9.0, 11.0)), k = 0.74 + 0.2 * a + 0.1 * b;\n'
      + 'k *= 1.0 - 0.14 * smoothstep(0.3, 0.42, s); diffuseColor.rgb *= k; diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(0.84, 1.04, 0.8), smoothstep(0.42, 0.7, a));\n',
    // sân đất, bãi cát: loang nhẹ, sạn nhỏ (không ngả xanh)
    dirt: 'float a = lkN(vec3(lp.xz * 0.35, 5.0)), s = lkN(vec3(lp.xz * 7.0, 9.0)); diffuseColor.rgb *= (0.84 + 0.16 * a) * (1.0 - 0.1 * smoothstep(0.62, 0.75, s));\n',
  };
  // gắn đoạn shader vào một vật liệu chuẩn (giữ nguyên đoạn shader đã có của nó, nếu có)
  function hook(m, kind) {
    if (!m || m.userData.look || !BODY[kind]) return m;
    if (!U.uLookC.value) U.uLookC.value = new root.THREE.Vector4(0, 0, 0, 0);
    const prev = m.onBeforeCompile, hadKey = Object.prototype.hasOwnProperty.call(m, 'customProgramCacheKey') ? m.customProgramCacheKey.bind(m) : null;
    m.userData.look = kind;
    m.onBeforeCompile = (sh, r) => {
      if (prev) prev(sh, r);
      sh.uniforms.uLook = U.uLook; sh.uniforms.uLookC = U.uLookC;
      sh.vertexShader = 'varying vec3 vLookW;\n' + sh.vertexShader.replace('#include <project_vertex>',
        '#include <project_vertex>\n{ vec4 lw = vec4(transformed, 1.0);\n#ifdef USE_INSTANCING\n lw = instanceMatrix * lw;\n#endif\n vLookW = (modelMatrix * lw).xyz; }');
      sh.fragmentShader = 'uniform float uLook;\nuniform vec4 uLookC;\nvarying vec3 vLookW;\n' + NOISE + sh.fragmentShader.replace('#include <color_fragment>',
        '#include <color_fragment>\nif (uLook > 0.5 && distance(vLookW.xz, uLookC.xy) < uLookC.z) { vec3 lp = vLookW;\n' + BODY[kind] + '}');
    };
    m.customProgramCacheKey = () => (hadKey ? hadKey() : '') + '|look:' + kind;
    m.needsUpdate = true;
    return m;
  }
  let on = false, G0 = null;
  // ánh sáng của lát cắt (render/sky3d.js): chỉ khi đang xem đảo mẫu ở đúng thời
  const light = () => on && G0 && (G0.focus || 0) === SLICE.isle;

  function setup(G) {
    G0 = G;
    const { THREE, scene } = G, L = G.lands[SLICE.isle];
    hook(L.groundMat, 'ground');
    // vệt tối mềm: một ảnh tròn mờ dần (vẽ lúc tải), dùng cho chân công trình và chân người
    const cv = document.createElement('canvas'); cv.width = cv.height = 64;
    { const x = cv.getContext('2d'), gr = x.createRadialGradient(32, 32, 4, 32, 32, 32); gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(0.55, 'rgba(0,0,0,0.55)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = gr; x.fillRect(0, 0, 64, 64); }
    const tex = new THREE.CanvasTexture(cv), quad = new THREE.PlaneGeometry(2, 2).rotateX(-Math.PI / 2);
    const blob = (max, op, ro) => { const m = new THREE.InstancedMesh(quad, new THREE.MeshBasicMaterial({ map: tex, color: '#141c30', transparent: true, opacity: op, depthWrite: false,
        polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, fog: false }), max); m.count = 0; m.frustumCulled = false; m.renderOrder = ro; m.visible = false; scene.add(m); return m; };
    const baseB = blob(160, 0.42, 1), pedB = blob(200, 0.34, 1);
    const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), V = new THREE.Vector3(), Sc = new THREE.Vector3();
    let fixedRef = null, fixedN = -1;
    // chân công trình: theo danh sách chỗ đã có công trình của đảo (render/buildings3d.js places().fixed)
    function bases() {
      const pl = G.buildings.places(SLICE.isle), fx = (pl && pl.fixed) || [];
      if (fx === fixedRef && fx.length === fixedN) return; fixedRef = fx; fixedN = fx.length;
      let n = 0;
      for (const f of fx) { if (n >= 160 || !f || f.r == null || String(f.P || '').startsWith('spot:')) continue; const r = Math.min(9, f.r * 1.25 + 0.6);
        V.set(L.center.x + f.x, L.center.y + 0.07, L.center.z + f.y); Sc.set(r, 1, r); M.compose(V, Q, Sc); baseB.setMatrixAt(n++, M); }
      baseB.count = n; baseB.instanceMatrix.needsUpdate = true;
    }
    function update() {
      const act = G.levelOf(SLICE.isle) === SLICE.level;
      if (act !== on) { on = act; U.uLook.value = on ? 1 : 0; fixedRef = null; }
      U.uLookC.value.set(L.center.x, L.center.z, G.lands3d.LAND_R * 1.12, L.center.y);
      const v = on && G.villages && G.villages[SLICE.isle], show = !!(v && v.visible);
      baseB.visible = pedB.visible = show; if (!show) return;
      bases();
      let n = 0; for (const p of v.peds()) { if (n >= 200) break; if (Math.abs(p.y) > 0.3) continue; V.set(L.center.x + p.x, L.center.y + 0.09, L.center.z + p.z); Sc.set(0.42, 1, 0.42); M.compose(V, Q, Sc); pedB.setMatrixAt(n++, M); }
      pedB.count = n; pedB.instanceMatrix.needsUpdate = true;
    }
    G.look = { update };
  }
  BK.Look3D = { SLICE, hook, light, setup };
})(typeof self !== 'undefined' ? self : globalThis);
