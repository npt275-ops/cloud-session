/* Bể Kính · render/water/under3d.js · Vật dưới nước: ánh sáng bị nước hấp thụ và vân sáng caustics (quy tắc 6)
 * Mặt đất, chân đảo, đáy bể sâu (mọi khối có phần thấp hơn mặt nước) nhận thêm, ở phần dưới mặt nước:
 *   hấp thụ   nắng xuống tới đó đã đi qua (mặt nước − y) đơn vị nước: tắt dần theo từng màu (cùng SIGMA với mặt nước)
 *   caustics  vân sáng lượn do mặt nước gợn hội tụ nắng: hai lớp vân dời ngược nhau theo thời gian, mờ dần theo độ sâu
 * (quãng đường từ vật lên mắt đã do mặt nước tính: render/water/surface3d.js Beer-Lambert trên ảnh dưới nước). Gắn vào vật
 * liệu bằng onBeforeCompile (nối sau cái sẵn có), dùng chung một bộ số (thời gian, mặt nước, nắng) cho mọi vật liệu.
 * hookAll(): quét đảo (L.g), đáy bể (G.deep3d), gắn vào vật liệu của khối nào có phần dưới mặt nước. Cần: three.js, sea3d.js. */
(function (root) {
  const BK = root.BK || (root.BK = {});
  const CAUSTIC = 0.55, // độ sáng vân caustics (nhân với nắng)
    FADE = 0.12; // vân mờ dần theo độ sâu (mỗi đơn vị)
  function setup(G) {
    const { THREE, scene } = G;
    const sig = BK.WaterSurface.SIGMA;
    const U = {
      uWT: { value: 0 },
      uWSeaY: { value: 0 },
      uWSunC: { value: new THREE.Color() },
      uWSigma: { value: new THREE.Vector3(...sig) },
    };
    const VERT = 'varying vec3 vUW;\n';
    const FRAG =
      'uniform float uWT; uniform float uWSeaY; uniform vec3 uWSunC; uniform vec3 uWSigma; varying vec3 vUW;\n' +
      // vân caustics: lấy độ sáng của mạng lưới sóng giao thoa (hai lớp ngược chiều), nhọn ở chỗ sáng
      'float wCau(vec2 p, float t) { vec2 q = p + vec2(sin(p.y * 0.7 + t), cos(p.x * 0.6 - t * 0.8)) * 0.6;\n' +
      '  float a = abs(sin(q.x * 1.3 + t) + sin(q.y * 1.1 - t * 0.9) + sin((q.x + q.y) * 0.9 + t * 0.7));\n' +
      '  return pow(clamp(1.0 - a / 1.6, 0.0, 1.0), 3.0); }\n';
    const BODY =
      '{ float dpt = uWSeaY - vUW.y; if (dpt > 0.0) {\n' +
      '  vec3 Tw = exp(-uWSigma * dpt);\n' +
      '  float c = (wCau(vUW.xz * 0.55, uWT * 0.9) + wCau(vUW.xz * 0.37 + 7.3, -uWT * 0.7)) * 0.5;\n' +
      `  gl_FragColor.rgb = gl_FragColor.rgb * mix(Tw, vec3(1.0), 0.35) + uWSunC * c * ${CAUSTIC.toFixed(3)} * exp(-${FADE.toFixed(3)} * dpt) * Tw; } }\n`;
    const done = new WeakSet();
    function hook(m) {
      if (!m || done.has(m) || !(m.isMeshStandardMaterial || m.isMeshLambertMaterial || m.isMeshPhongMaterial)) return;
      done.add(m);
      const prev = m.onBeforeCompile,
        prevKey = Object.prototype.hasOwnProperty.call(m, 'customProgramCacheKey') ? m.customProgramCacheKey.bind(m) : null;
      m.onBeforeCompile = (sh, r) => {
        if (prev) prev(sh, r);
        Object.assign(sh.uniforms, U);
        sh.vertexShader = VERT + sh.vertexShader.replace(
          '#include <project_vertex>',
          '#include <project_vertex>\n{ vec4 uw = vec4(transformed, 1.0);\n#ifdef USE_INSTANCING\n uw = instanceMatrix * uw;\n#endif\n vUW = (modelMatrix * uw).xyz; }',
        );
        sh.fragmentShader = FRAG + sh.fragmentShader.replace('#include <fog_fragment>', BODY + '#include <fog_fragment>');
      };
      m.customProgramCacheKey = () => (prevKey ? prevKey() : '') + '|underwater';
      m.needsUpdate = true;
    }
    const box = new THREE.Box3();
    // gắn vào vật liệu của mọi khối có phần thấp hơn mặt nước (trong một nhóm)
    function hookTree(root0) {
      const y = G.sea3d.SEA_Y + 0.5;
      root0.updateMatrixWorld(true);
      root0.traverse((o) => {
        if (!o.isMesh || !o.geometry) return;
        if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
        box.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld);
        if (box.min.y > y) return;
        (Array.isArray(o.material) ? o.material : [o.material]).forEach(hook);
      });
    }
    function hookAll() {
      for (const L of G.lands || []) hookTree(L.g);
      if (G.deep3d && G.deep3d.group) hookTree(G.deep3d.group);
    }
    const d = new THREE.Vector3();
    function update(sec) {
      U.uWT.value += sec;
      U.uWSeaY.value = G.sea3d.SEA_Y + G.sea3d.seaDy;
      const sun = G.sun;
      d.copy(sun.position).sub(sun.target.position).normalize();
      U.uWSunC.value.copy(sun.color).multiplyScalar(sun.intensity * Math.max(0, Math.min(1, d.y * 2)));
    }
    G.waterUnder = { hookAll, hook, update, U };
  }
  BK.WaterUnder = { setup, CAUSTIC };
})(typeof self !== 'undefined' ? self : globalThis);
