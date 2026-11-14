/* Bể Kính · render/fx/post3d.js · Lượt vẽ hậu kỳ cho cú nhập hồn (design/ke-hoach-buoc-32.md mục 3.1)
 * G.post.render() thay cho renderer.render(scene, camera) trong game/loop.js. Mọi hiệu ứng bằng 0 (góc nhìn thượng đế) thì vẽ
 * thẳng ra màn hình như cũ: hình không đổi, không tốn thêm. Có hiệu ứng thì vẽ cảnh vào một ảnh tạm (kèm ảnh độ sâu), rồi một
 * lượt phủ màn hình gộp mọi hiệu ứng:
 *   radial   mờ toả từ tâm (cú lao), center: tâm toả (toạ độ màn hình 0..1)
 *   chroma   tách màu ở viền
 *   dof      làm mờ hậu cảnh theo độ sâu: nét ở focus (khoảng cách tới máy quay), mờ dần ra xa (focusRange)
 *   blur     mờ cả ảnh (vừa mở mắt, choáng)
 *   vignette tối viền; grade: chỉnh màu điện ảnh (đậm, tương phản, tối ngả lam, sáng ngả vàng); grain: hạt nhiễu phim
 *   paint    kiểu tranh vẽ (render/style/painterly3d.js): lọc vẽ tay (Kuwahara bốn góc: mỗi điểm lấy màu trung bình của góc
 *            phẳng màu nhất quanh nó, thành mảng như nét cọ, cạnh vẫn sắc), xa nhạt ngả lam, bóng ngả lam tím, sáng ngả vàng, thớ giấy
 *   lids     mí mắt (0 mở hẳn, 1 nhắm hẳn); flash: chớp trắng; ring: vòng nứt sáng khi xuyên vòm kính (0..1 theo thời gian)
 * Mỗi hiệu ứng là một số trong G.post.fx; game/possess.js đặt các số đó theo dòng thời gian. Có khử răng cưa nhẹ (theo độ
 * sáng) vì vẽ vào ảnh tạm thì mất khử răng cưa sẵn có của trình duyệt.
 * Cần: three.js, render/scene3d.js (renderer, scene, camera), render/perf3d.js (G.perf: hạ bớt khi máy chậm). */
(function (root) {
  const BK = root.BK || (root.BK = {});
  const FX0 = {
    radial: 0,
    chroma: 0,
    dof: 0,
    focus: 3,
    focusRange: 18,
    blur: 0,
    vignette: 0,
    grade: 0,
    grain: 0,
    paint: 0,
    lids: 0,
    flash: 0,
    ring: 0,
  };
  const VERT = 'varying vec2 vUv;\nvoid main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';
  const FRAG = [
    'uniform sampler2D tColor; uniform sampler2D tDepth; uniform vec2 uRes; uniform float uNear, uFar, uTime;',
    'uniform float uRadial, uChroma, uDof, uFocus, uRange, uBlur, uVig, uGrade, uGrain, uLids, uFlash, uRing, uHasDepth, uPaint;',
    'uniform vec2 uCenter;',
    'varying vec2 vUv;',
    'float viewZ(vec2 uv){ float d = texture2D(tDepth, uv).x; return (uNear * uFar) / ((uFar - uNear) * d - uFar); }',
    'float lum(vec3 c){ return dot(c, vec3(0.299, 0.587, 0.114)); }',
    'float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }',
    // khử răng cưa theo độ sáng (gọn kiểu FXAA): làm mềm cạnh có độ sáng chênh lớn theo hướng vuông góc với cạnh
    'vec3 aa(vec2 uv){ vec2 px = 1.0 / uRes; vec3 c = texture2D(tColor, uv).rgb;',
    ' float n = lum(texture2D(tColor, uv + vec2(0.0, px.y)).rgb), s = lum(texture2D(tColor, uv - vec2(0.0, px.y)).rgb);',
    ' float e = lum(texture2D(tColor, uv + vec2(px.x, 0.0)).rgb), w = lum(texture2D(tColor, uv - vec2(px.x, 0.0)).rgb), m = lum(c);',
    ' float range = max(max(n, s), max(max(e, w), m)) - min(min(n, s), min(min(e, w), m));',
    ' if (range < max(0.04, 0.12 * max(max(n, s), max(e, w)))) return c;',
    // (cạnh nằm ngang: độ sáng chênh theo chiều dọc lớn hơn, thì làm mềm theo chiều ngang, và ngược lại)
    ' vec2 dir = (abs(n - s) > abs(e - w) ? vec2(1.0, 0.0) : vec2(0.0, 1.0)) * px;',
    ' vec3 a = texture2D(tColor, uv + dir * 0.75).rgb, b = texture2D(tColor, uv - dir * 0.75).rgb;',
    ' return mix(c, (a + b) * 0.5, 0.55); }',
    // lọc vẽ tay: bốn góc 4 × 4 điểm quanh điểm đang vẽ (bước theo độ cao ảnh: màn nét cao vẫn cùng cỡ nét cọ); góc nào màu
    // phẳng nhất (phương sai nhỏ) thì nặng nhất
    'vec3 kuwa(vec2 uv){ vec2 px = max(1.0, uRes.y / 720.0) / uRes; vec3 m0 = vec3(0.0), m1 = m0, m2 = m0, m3 = m0, s0 = m0, s1 = m0, s2 = m0, s3 = m0;',
    ' for (int j = 0; j < 4; j++) for (int i = 0; i < 4; i++) { vec2 o = vec2(float(i), float(j)) * px; vec3 c;',
    '  c = texture2D(tColor, uv + vec2(-o.x, -o.y)).rgb; m0 += c; s0 += c * c;',
    '  c = texture2D(tColor, uv + vec2(o.x, -o.y)).rgb; m1 += c; s1 += c * c;',
    '  c = texture2D(tColor, uv + vec2(-o.x, o.y)).rgb; m2 += c; s2 += c * c;',
    '  c = texture2D(tColor, uv + o).rgb; m3 += c; s3 += c * c; }',
    ' m0 /= 16.0; m1 /= 16.0; m2 /= 16.0; m3 /= 16.0;',
    ' vec3 v0 = s0 / 16.0 - m0 * m0, v1 = s1 / 16.0 - m1 * m1, v2 = s2 / 16.0 - m2 * m2, v3 = s3 / 16.0 - m3 * m3;',
    ' float w0 = 1.0 / (1e-5 + pow(v0.r + v0.g + v0.b, 2.0)), w1 = 1.0 / (1e-5 + pow(v1.r + v1.g + v1.b, 2.0));',
    ' float w2 = 1.0 / (1e-5 + pow(v2.r + v2.g + v2.b, 2.0)), w3 = 1.0 / (1e-5 + pow(v3.r + v3.g + v3.b, 2.0));',
    ' return (m0 * w0 + m1 * w1 + m2 * w2 + m3 * w3) / (w0 + w1 + w2 + w3); }',
    'float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);',
    ' return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + 1.0), f.x), f.y); }',
    'void main(){',
    ' vec2 uv = vUv; vec3 col;',
    // mờ toả tâm: 8 mẫu dọc tia từ tâm toả, kèm tách màu theo tia
    ' vec2 toC = uv - uCenter; float r = length(toC);',
    ' if (uRadial > 0.001) { vec3 acc = vec3(0.0); float k = uRadial * 0.11 * r;',
    '  for (int i = 0; i < 8; i++) { float t = float(i) / 7.0; vec2 q = uv - toC * k * t;',
    '   acc.r += texture2D(tColor, q + toC * uChroma * 0.012).r; acc.g += texture2D(tColor, q).g; acc.b += texture2D(tColor, q - toC * uChroma * 0.012).b; }',
    '  col = acc / 8.0; }',
    ' else if (uChroma > 0.001) { vec2 o = toC * uChroma * 0.012 * r; col = vec3(texture2D(tColor, uv + o).r, texture2D(tColor, uv).g, texture2D(tColor, uv - o).b); }',
    ' else if (uPaint > 0.001) col = mix(aa(uv), kuwa(uv), uPaint);',
    ' else col = aa(uv);',
    // làm mờ hậu cảnh và mờ cả ảnh: 12 mẫu xoắn theo góc vàng, bán kính theo độ xa tiêu điểm
    ' float cr = uBlur * 14.0;',
    ' if (uDof > 0.001 && uHasDepth > 0.5) { float z = -viewZ(uv); cr = max(cr, uDof * 9.0 * clamp((z - uFocus) / uRange, 0.0, 1.0)); }',
    ' if (cr > 0.6) { vec3 acc = col; float wsum = 1.0; vec2 px = 1.0 / uRes;',
    '  for (int i = 1; i < 13; i++) { float fi = float(i), a = fi * 2.39996, rr = sqrt(fi / 12.0) * cr; vec2 q = uv + vec2(cos(a), sin(a)) * rr * px;',
    '   float w = 1.0; if (uHasDepth > 0.5 && uDof > 0.001 && uBlur < 0.01) { float zq = -viewZ(q); w = step(uFocus * 0.85, zq); }',
    '   acc += texture2D(tColor, q).rgb * w; wsum += w; }',
    '  col = acc / wsum; }',
    // chỉnh màu điện ảnh: đậm hơn, tương phản hơn, vùng tối ngả lam, vùng sáng ngả vàng ấm
    ' if (uGrade > 0.001) { float l = lum(col); vec3 g = mix(vec3(l), col, 1.22); g = (g - 0.5) * 1.12 + 0.5;',
    '  g += mix(vec3(-0.015, 0.0, 0.035), vec3(0.035, 0.018, -0.02), smoothstep(0.15, 0.85, l));',
    '  col = mix(col, clamp(g, 0.0, 1.0), uGrade); }',
    // kiểu tranh vẽ: xa nhạt ngả lam (không đụng trời), bóng ngả lam tím, sáng ngả vàng ấm, đậm màu nhẹ, thớ giấy
    ' if (uPaint > 0.001) { float l = lum(col);',
    '  if (uHasDepth > 0.5 && texture2D(tDepth, uv).x < 0.99999) { float z = -viewZ(uv); col = mix(col, vec3(0.72, 0.8, 0.9), smoothstep(22.0, 200.0, z) * 0.5 * uPaint); }',
    '  vec3 p = mix(vec3(l), col, 1.1);',
    '  p = mix(p, p * vec3(0.86, 0.9, 1.12) + vec3(0.02, 0.02, 0.05), (1.0 - smoothstep(0.08, 0.55, l)) * 0.6);',
    '  p += vec3(0.05, 0.03, -0.012) * smoothstep(0.45, 0.95, l);',
    '  p *= 1.0 + (vnoise(uv * uRes / 2.5) - 0.5) * 0.05 + (vnoise(uv * uRes / 40.0) - 0.5) * 0.04;',
    '  col = mix(col, clamp(p, 0.0, 1.0), uPaint); }',
    ' if (uVig > 0.001) { float v = smoothstep(0.35, 1.05, length((uv - 0.5) * vec2(uRes.x / uRes.y, 1.0)) * 1.15); col *= 1.0 - uVig * v * 0.85; }',
    ' if (uGrain > 0.001) col += (hash(uv * uRes + fract(uTime * 7.13) * 91.7) - 0.5) * uGrain * 0.09;',
    // vòng nứt sáng khi xuyên vòm kính: một vòng mảnh toả ra từ tâm, có răng cưa như vết nứt
    ' if (uRing > 0.001 && uRing < 0.999) { float a = atan(toC.y, toC.x), rr = uRing * 1.25 + 0.05 * sin(a * 23.0) * (1.0 - uRing);',
    '  float band = 1.0 - smoothstep(0.0, 0.02 + 0.03 * uRing, abs(r - rr)); col = mix(col, vec3(0.92, 0.97, 1.0), band * (1.0 - uRing) * 0.9);',
    '  col += vec3(0.6, 0.75, 0.9) * (1.0 - smoothstep(0.0, rr, r)) * (1.0 - uRing) * 0.18; }',
    ' col = mix(col, vec3(1.0, 0.99, 0.96), uFlash);',
    // mí mắt: hai dải tối cong từ trên, dưới khép lại; mép mềm
    ' if (uLids > 0.001) { float y = abs(uv.y - 0.5) * 2.0, x = (uv.x - 0.5) * 2.0, edge = 1.0 - uLids * (1.0 - 0.18 * x * x);',
    '  col *= 1.0 - smoothstep(edge - 0.12, edge + 0.02, y); col *= 1.0 - uLids * uLids * 0.6; }',
    // (vẽ vào ảnh tạm thì three.js chưa nén sáng, chưa đổi sang hệ màu màn hình: làm ở đây, như khi vẽ thẳng ra màn hình)
    ' gl_FragColor = vec4(col, 1.0);',
    '#include <tonemapping_fragment>',
    '#include <encodings_fragment>',
    '}',
  ].join('\n');
  function setup(G) {
    const { THREE, renderer, scene, camera } = G;
    const fx = Object.assign({}, FX0),
      center = new THREE.Vector2(0.5, 0.5);
    const canDepth = renderer.capabilities.isWebGL2 || !!renderer.extensions.get('WEBGL_depth_texture');
    let rt = null;
    const size = new THREE.Vector2();
    function target() {
      renderer.getDrawingBufferSize(size);
      if (rt && rt.width === size.x && rt.height === size.y) return rt;
      if (rt) {
        rt.dispose();
        if (rt.depthTexture) rt.depthTexture.dispose();
      }
      rt = new THREE.WebGLRenderTarget(size.x, size.y, { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter });
      if (canDepth) {
        rt.depthTexture = new THREE.DepthTexture(size.x, size.y);
        rt.depthTexture.type = THREE.UnsignedIntType;
      }
      return rt;
    }
    const U = {
      tColor: { value: null },
      tDepth: { value: null },
      uRes: { value: new THREE.Vector2(1, 1) },
      uNear: { value: camera.near },
      uFar: { value: camera.far },
      uTime: { value: 0 },
      uRadial: { value: 0 },
      uChroma: { value: 0 },
      uDof: { value: 0 },
      uFocus: { value: 3 },
      uRange: { value: 18 },
      uBlur: { value: 0 },
      uVig: { value: 0 },
      uGrade: { value: 0 },
      uGrain: { value: 0 },
      uLids: { value: 0 },
      uFlash: { value: 0 },
      uRing: { value: 0 },
      uPaint: { value: 0 },
      uHasDepth: { value: canDepth ? 1 : 0 },
      uCenter: { value: center },
    };
    const quad = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      new THREE.ShaderMaterial({ uniforms: U, vertexShader: VERT, fragmentShader: FRAG, depthTest: false, depthWrite: false }),
    );
    quad.frustumCulled = false;
    const qScene = new THREE.Scene(),
      qCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    qScene.add(quad);
    // máy chậm (render/perf3d.js hạ độ nét xuống mức thấp): bỏ làm mờ hậu cảnh, hạt nhiễu trước (tốn nhất so với giá trị)
    const lowQ = () => G.perf && G.perf.pr != null && G.perf.pr <= 1 && (window.devicePixelRatio || 1) > 1;
    const active = () =>
      fx.radial > 0.001 ||
      fx.chroma > 0.001 ||
      fx.dof > 0.001 ||
      fx.blur > 0.001 ||
      fx.vignette > 0.001 ||
      fx.grade > 0.001 ||
      fx.grain > 0.001 ||
      fx.lids > 0.001 ||
      fx.flash > 0.001 ||
      fx.paint > 0.001 ||
      (fx.ring > 0.001 && fx.ring < 0.999);
    function render() {
      if (!active()) {
        renderer.setRenderTarget(null);
        renderer.render(scene, camera);
        return;
      }
      const t = target();
      renderer.setRenderTarget(t);
      renderer.render(scene, camera);
      renderer.setRenderTarget(null);
      const low = lowQ();
      U.tColor.value = t.texture;
      U.tDepth.value = t.depthTexture || null;
      U.uRes.value.set(t.width, t.height);
      U.uNear.value = camera.near;
      U.uFar.value = camera.far;
      U.uTime.value = performance.now() * 0.001;
      U.uRadial.value = fx.radial;
      U.uChroma.value = fx.chroma;
      U.uDof.value = low ? 0 : fx.dof;
      U.uFocus.value = fx.focus;
      U.uRange.value = fx.focusRange;
      U.uBlur.value = fx.blur;
      U.uVig.value = fx.vignette;
      U.uGrade.value = fx.grade;
      U.uGrain.value = low ? 0 : fx.grain;
      U.uLids.value = fx.lids;
      U.uFlash.value = fx.flash;
      U.uRing.value = fx.ring;
      U.uPaint.value = fx.paint;
      renderer.render(qScene, qCam);
    }
    // về lại góc nhìn thượng đế: mọi hiệu ứng về 0
    const reset = () => Object.assign(fx, FX0);
    G.post = { fx, center, render, reset, active, depth: canDepth };
  }
  BK.Post3D = { setup, FX0 };
})(typeof self !== 'undefined' ? self : globalThis);
