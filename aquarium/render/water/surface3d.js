/* Bể Kính · render/water/surface3d.js · Chất liệu quang học của mặt nước (sáu quy tắc, design/ke-hoach-buoc-38.md)
 *   1 lớp quang học   màu nước không gán sẵn: sinh ra từ ảnh phản chiếu (render/water/passes3d.js refl, hay màu trời khi máy
 *                     yếu), ảnh đáy nhìn xuyên qua nước có hấp thụ (refr), và ánh sáng tán xạ trong nước (SCATTER × ánh sáng)
 *   2 một trường dốc  sóng lớn (cùng công thức sóng của sea3d.js), sóng nhỏ chi tiết (DETAIL) và gợn mô phỏng
 *                     (render/water/ripples3d.js) cộng vào một vector độ dốc s; pháp tuyến, phản chiếu, khúc xạ, Fresnel, ánh
 *                     lấp lánh đều đọc từ s nên luôn khớp nhau
 *   3 ba lượt vẽ      mặt nước chỉ ghép hai ảnh vẽ trước (dưới nước, phản chiếu) của render/water/passes3d.js
 *   4 độ sâu thật     quãng đường tia nhìn đi trong nước = độ sâu cảnh dưới nước (ảnh độ sâu) trừ độ sâu mặt nước; Beer-Lambert
 *                     theo từng màu (SIGMA: đỏ tắt nhanh nhất): nông thì trong thấy đáy, sâu thì xanh ngọc
 *   5 độ nhám         sóng nhỏ hơn một điểm ảnh (so với cỡ điểm ảnh trên mặt nước, fwidth) không vẽ thành gợn nữa mà cộng vào
 *                     độ nhám: ánh nắng loang rộng ra, mờ đi, không lấp lánh nhiễu ở xa
 *   6 vật chạm nước   gợn mô phỏng, bọt theo gợn, bóng tiếp xúc quanh vật nổi; (vật dưới nước: render/water/under3d.js)
 * Xoáy nước (setWhirl(x, z, bán kính, độ sâu, độ mạnh 0..1)): mặt nước trũng xuống thành phễu (độ dốc của phễu cộng vào cùng
 * trường dốc nên phản chiếu, ánh nắng uốn theo phễu), nước quanh đó bị cuốn quay, vệt bọt xoắn ốc chạy vào tâm (lốc xoáy của
 * Đại hồng thuỷ: magic/water/deluge/vortex3d.js). Độ mạnh 0: không có.
 * Bọt sẵn có (ngọn sóng, quanh chân đảo, sát vách kính) giữ nguyên, phủ lên trên cùng. Màu ra đã ở hệ màu màn hình (hai ảnh vẽ
 * trước đã qua nén sáng) nên chất liệu không nén sáng lần nữa. Nhìn từ dưới nước lên: mặt nước sáng mờ, màu nước sâu.
 * setup(G) thay vật liệu mặt nước của sea3d.js; update() mỗi khung hình (render/water/water3d.js gọi).
 * Cần: three.js, sea3d.js, render/sky3d.js (G.sun, G.sky.mat), render/water/passes3d.js, render/water/ripples3d.js. */
(function (root) {
  const BK = root.BK || (root.BK = {});
  // hệ số tắt dần mỗi đơn vị quãng đường trong nước (đỏ, lục, lam): 2 đơn vị nước (chừng ngang người) đỏ còn một nửa
  const SIGMA = [0.34, 0.075, 0.052];
  const SCATTER = '#2a9fa8', // màu ánh sáng tán xạ trong nước (xanh ngọc), nhân với ánh sáng lúc đó
    F0 = 0.02, // phản xạ khi nhìn thẳng xuống (nước)
    REFR_BEND = 0.035, // độ lệch ảnh đáy theo độ dốc
    REFL_BEND = 0.06, // độ lệch ảnh phản chiếu theo độ dốc
    RIP_K = 0.9; // độ dốc của gợn mô phỏng
  // sóng nhỏ chi tiết: [hướng x, hướng z, bước sóng, độ dốc đỉnh]
  const DETAIL = [
    [0.9, 0.4, 3.4, 0.07],
    [-0.5, 0.85, 2.3, 0.07],
    [0.2, -1, 1.5, 0.06],
    [-0.95, -0.2, 0.95, 0.055],
    [0.6, 0.75, 0.6, 0.05],
    [-0.3, -0.9, 0.38, 0.045],
    [0.8, -0.55, 0.24, 0.04],
  ].map(([dx, dz, L, s]) => {
    const l = Math.hypot(dx, dz),
      k = (2 * Math.PI) / L;
    return { dx: dx / l, dz: dz / l, k, s, w: Math.sqrt(9.8 * k) * 0.42 };
  });
  const f = (v) => v.toFixed(5);
  function setup(G) {
    const { THREE, camera } = G;
    const S = G.sea3d,
      Wv = S.waves;
    const U = THREE.UniformsUtils.merge([
      THREE.UniformsLib.fog,
      {
        uRefl: { value: null },
        uRefr: { value: null },
        uDepth: { value: null },
        uHas: { value: new THREE.Vector2() },
        uReflM: { value: new THREE.Matrix4() },
        uLogFC: { value: 2 / Math.log2(camera.far + 1) },
        uSunDir: { value: new THREE.Vector3(0, 1, 0) },
        uSunC: { value: new THREE.Color(1, 1, 1) },
        uSkyTop: { value: new THREE.Color('#6fb3e6') },
        uSkyBot: { value: new THREE.Color('#cfe8f5') },
        uScat: { value: new THREE.Color(SCATTER) },
        uSigma: { value: new THREE.Vector3(...SIGMA) },
        uRip: { value: null },
        uRipO: { value: new THREE.Vector3(0, 0, 48) },
        uContact: { value: G.waterRipples.contacts },
        uSeaY: { value: 0 },
        uWhirl: { value: new THREE.Vector4(0, 0, 1, 0) }, // (x, z, bán kính, độ sâu)
        uWhirlK: { value: 0 },
      },
    ]);
    // (sóng, độ lớn sóng: dùng chung đối tượng với sea3d.js để cùng nhịp với thuyền, vách nước)
    U.uT = S.U.uT;
    U.uAmp = S.U.uAmp;
    // độ dốc của sóng lớn: đạo hàm đúng công thức độ cao trong sea3d.js
    let big = '';
    for (const W of Wv.list)
      big += `{ float ph = ${f(W.k)} * dot(vec2(${f(W.dx)}, ${f(W.dz)}), p0) - ${f(W.w)} * uT; s += vec2(${f(W.dx)}, ${f(W.dz)}) * (${f(W.A * W.k)} * vAmp * cos(ph)); }\n`;
    let fine = '';
    for (const D of DETAIL)
      fine +=
        `{ float vis = clamp(1.0 - fp * ${f(D.k)} / 2.2, 0.0, 1.0), ph = ${f(D.k)} * dot(vec2(${f(D.dx)}, ${f(D.dz)}), vW.xz) - ${f(D.w)} * uT; ` +
        `s += vis * vec2(${f(D.dx)}, ${f(D.dz)}) * (${f(D.s)} * cos(ph)); lost += (1.0 - vis) * ${f(D.s * D.s)}; }\n`;
    const vertexShader = `uniform float uT; uniform float uAmp; uniform mat4 uReflM; uniform float uSeaY; uniform vec4 uWhirl; uniform float uWhirlK;
attribute vec2 aShore;
varying vec3 vW; varying float vWave; varying float vShore; varying vec2 vXZ; varying float vAmp; varying vec4 vRefl; varying vec4 vScr; varying float vViewW;
#include <common>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
void main() {
  vec3 transformed = position;
  { vec2 p0 = transformed.xz; float amp = aShore.x * uAmp, h = 0.0; vec2 off = vec2(0.0);
${Wv.glsl}${Wv.rim}    if (uWhirlK > 0.0) { vec2 q = p0 - uWhirl.xy; float d2 = dot(q, q) / (uWhirl.z * uWhirl.z);
      h -= uWhirlK * uWhirl.w * exp(-2.5 * d2); // (phễu trũng xuống)
      float sw = uWhirlK * 1.4 * exp(-0.8 * d2), cs = cos(sw), sn = sin(sw); off += vec2(cs * q.x - sn * q.y, sn * q.x + cs * q.y) - q; } // (cuốn quay)
    transformed.xz += off; transformed.y += h; vWave = h / (${f(Wv.AMAX)} * max(uAmp, 0.01)); vShore = aShore.y; vXZ = p0; vAmp = amp; }
  vec4 wp = modelMatrix * vec4(transformed, 1.0);
  vW = wp.xyz;
  vRefl = uReflM * vec4(wp.x, uSeaY, wp.z, 1.0);
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  vScr = gl_Position;
  vViewW = -mvPosition.z;
  #include <logdepthbuf_vertex>
  #include <fog_vertex>
}`;
    const fragmentShader = `uniform float uT; uniform sampler2D uRefl; uniform sampler2D uRefr; uniform sampler2D uDepth; uniform vec2 uHas;
uniform float uLogFC; uniform vec3 uSunDir; uniform vec3 uSunC; uniform vec3 uSkyTop; uniform vec3 uSkyBot; uniform vec3 uScat;
uniform vec3 uSigma; uniform sampler2D uRip; uniform vec3 uRipO; uniform vec4 uWhirl; uniform float uWhirlK; uniform vec3 uContact[${G.waterRipples.contacts.length}];
varying vec3 vW; varying float vWave; varying float vShore; varying vec2 vXZ; varying float vAmp; varying vec4 vRefl; varying vec4 vScr; varying float vViewW;
#include <common>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
vec3 sky(vec3 r) { return mix(uSkyBot, uSkyTop, sqrt(clamp(r.y, 0.0, 1.0))); }
float sceneW(vec2 uv) { return exp2(texture2D(uDepth, uv).r * 2.0 / uLogFC) - 1.0; }
void main() {
  #include <logdepthbuf_fragment>
  // ---- 2: một trường độ dốc ----
  vec2 s = vec2(0.0), p0 = vXZ;
  float lost = 0.0, fp = length(fwidth(vW.xz)); // (cỡ một điểm ảnh trên mặt nước, đơn vị đảo)
${big}${fine}  float whirlFoam = 0.0;
  if (uWhirlK > 0.0) { vec2 q = vW.xz - uWhirl.xy; float r2 = uWhirl.z * uWhirl.z, e = exp(-2.5 * dot(q, q) / r2);
    s += q * (5.0 * uWhirlK * uWhirl.w * e / r2); // (độ dốc thành phễu)
    float d = length(q) / uWhirl.z, an = atan(q.y, q.x);
    whirlFoam = uWhirlK * smoothstep(3.0, 0.4, d) * smoothstep(0.55, 0.95, sin(an * 4.0 + log(d + 0.05) * 7.0 + uT * 5.0)); }
  float rip = 0.0;
  { vec2 ru = (vW.xz - uRipO.xy) / uRipO.z + 0.5, e = min(ru, 1.0 - ru);
    if (e.x > 0.0 && e.y > 0.0) { float t = 1.0 / ${G.waterRipples.RES}.0, k = smoothstep(0.0, 0.08, min(e.x, e.y));
      rip = texture2D(uRip, ru).r * k;
      vec2 g = vec2(texture2D(uRip, ru + vec2(t, 0.0)).r - texture2D(uRip, ru - vec2(t, 0.0)).r, texture2D(uRip, ru + vec2(0.0, t)).r - texture2D(uRip, ru - vec2(0.0, t)).r);
      float vis = clamp(1.0 - fp * 4.0, 0.0, 1.0); s += g * ${f(RIP_K)} * k * vis / (2.0 * t * uRipO.z) * 0.2; lost += (1.0 - vis) * dot(g, g) * 4.0; } }
  vec3 N = normalize(vec3(-s.x, 1.0, -s.y));
  float rough = clamp(0.035 + sqrt(lost) * 1.4 + fp * 0.003, 0.035, 0.55);
  vec3 V = normalize(cameraPosition - vW);
  if (!gl_FrontFacing) { // (nhìn từ dưới nước lên)
    float t = pow(1.0 - abs(dot(N, V)), 3.0);
    gl_FragColor = vec4(mix(uSkyBot * 0.9, uScat * 0.6, t), 1.0);
    #include <fog_fragment>
    return;
  }
  float nv = max(dot(N, V), 0.0), F = ${f(F0)} + ${f(1 - F0)} * pow(1.0 - nv, 5.0);
  vec2 scr = vScr.xy / vScr.w * 0.5 + 0.5;
  // ---- 1, 4: ảnh đáy nhìn xuyên nước, hấp thụ theo quãng đường thật ----
  vec3 under; vec3 T;
  if (uHas.y > 0.5) {
    vec2 uv = scr + N.xz * ${f(REFR_BEND)};
    float thick = sceneW(uv) - vViewW;
    if (thick < 0.0) { uv = scr; thick = sceneW(uv) - vViewW; } // (vật ở trước mặt nước lọt vào chỗ lệch: đọc đúng chỗ)
    thick = max(thick, 0.0);
    T = exp(-uSigma * thick);
    under = texture2D(uRefr, uv).rgb;
  } else { // (máy yếu: không có ảnh dưới nước, độ sâu ước theo khoảng cách tới bờ)
    T = exp(-uSigma * clamp(vShore * 1.4, 0.0, 80.0) / max(nv, 0.25));
    under = vec3(0.78, 0.72, 0.58) * (uSkyTop * 0.5 + uSunC * 0.4);
  }
  vec3 body = under * T + uScat * (1.0 - T);
  // ---- 1: ảnh phản chiếu (độ nhám làm mờ về màu trời trung bình) ----
  vec3 R = reflect(-V, N);
  vec3 refl = uHas.x > 0.5 ? texture2D(uRefl, vRefl.xy / vRefl.w + N.xz * ${f(REFL_BEND)}).rgb : sky(R);
  refl = mix(refl, sky(vec3(0.0, 0.5, 0.0)), clamp(rough * 1.2 - 0.05, 0.0, 0.6));
  vec3 col = mix(body, refl, F);
  // ---- 5: ánh nắng: chùm hẹp khi mặt nước mịn, loang rộng, mờ khi nhám ----
  { vec3 L = normalize(uSunDir), Hh = normalize(L + V);
    float n = 2.0 / (rough * rough) - 2.0, D = (n + 2.0) / 6.2832 * pow(max(dot(N, Hh), 0.0), n);
    float Fs = ${f(F0)} + ${f(1 - F0)} * pow(1.0 - max(dot(Hh, V), 0.0), 5.0);
    col += uSunC * min(D * Fs * max(dot(N, L), 0.0) * 0.25, 6.0); }
  // ---- 6: bóng tiếp xúc quanh vật nổi ----
  for (int i = 0; i < ${G.waterRipples.contacts.length}; i++) { vec3 c = uContact[i]; if (c.z > 0.0) col *= 1.0 - 0.3 * smoothstep(c.z, c.z * 0.35, length(vW.xz - c.xy)); }
  // ---- bọt: ngọn sóng, quanh chân đảo, sát vách kính (như cũ), và theo gợn mô phỏng ----
  { float crest = smoothstep(0.35, 0.75, vWave), brk = 0.5 + 0.5 * sin(vXZ.x * 0.9 + sin(vXZ.y * 0.6) * 2.0 + uT * 0.7) * sin(vXZ.y * 0.8 - uT * 0.5);
    float band = smoothstep(2.4, 0.2, vShore) * (0.35 + 0.65 * brk) + smoothstep(1.2, 0.0, abs(vShore - 2.5 - 1.6 * fract(uT * 0.18 + brk * 0.3))) * 0.6 * brk;
    float gd = ${Wv.EG} - length(vXZ);
    ${Wv.glassBrk}
    float glass = smoothstep(2.2, 0.15, gd) * (0.45 + 0.55 * gb) + smoothstep(1.0, 0.0, abs(gd - 1.2 - 2.4 * fract(uT * 0.22 + gb * 0.25))) * 0.55 * gb
      + smoothstep(4.0, 0.5, gd) * smoothstep(0.1, 0.6, vWave) * 0.8;
    float foam = clamp(crest * 0.45 + band * 0.75 + glass * 0.85 + smoothstep(0.25, 0.7, abs(rip)) * 0.35 + whirlFoam * 0.8, 0.0, 0.92);
    vec3 lit = uSkyTop * 0.55 + uSunC * 0.5 * max(uSunDir.y, 0.0);
    col = mix(col, vec3(0.93, 0.97, 1.0) * lit, foam); }
  gl_FragColor = vec4(col, 1.0);
  #include <fog_fragment>
}`;
    const mat = new THREE.ShaderMaterial({ uniforms: U, vertexShader, fragmentShader, fog: true, side: THREE.DoubleSide });
    mat.extensions = { derivatives: true };
    S.water.material = mat;
    const P = G.waterPasses,
      Rp = G.waterRipples,
      d = new THREE.Vector3();
    function update() {
      const has = P.st.has;
      U.uHas.value.set(has.refl ? 1 : 0, has.refr ? 1 : 0);
      U.uRefl.value = P.refl.texture;
      U.uRefr.value = P.refr.texture;
      U.uDepth.value = P.refr.depthTexture;
      U.uReflM.value.copy(P.reflMat);
      U.uSeaY.value = S.SEA_Y + S.seaDy;
      U.uLogFC.value = 2 / Math.log2(camera.far + 1);
      // nắng, trời theo giờ (render/sky3d.js); ánh sáng tán xạ trong nước theo nắng và trời lúc đó
      const sun = G.sun;
      d.copy(sun.position).sub(sun.target.position).normalize();
      U.uSunDir.value.copy(d);
      U.uSunC.value.copy(sun.color).multiplyScalar(sun.intensity * Math.max(0, Math.min(1, d.y * 3)));
      const sk = G.sky && G.sky.mat;
      if (sk) {
        U.uSkyTop.value.copy(sk.uniforms.top.value);
        U.uSkyBot.value.copy(sk.uniforms.bottom.value);
      }
      const light = Math.min(1.2, 0.08 + 0.55 * sun.intensity * Math.max(0, d.y) + 0.35 * U.uSkyTop.value.r);
      U.uScat.value.set(SCATTER).multiplyScalar(light);
      U.uRip.value = Rp.tex;
      U.uRipO.value.set(Rp.origin.x, Rp.origin.y, Rp.SIZE);
    }
    const setWhirl = (x, z, r, depth, k) => {
      U.uWhirl.value.set(x, z, r, depth);
      U.uWhirlK.value = k;
    };
    G.waterSurface = { update, mat, U, setWhirl };
  }
  BK.WaterSurface = { setup, SIGMA, SCATTER, DETAIL };
})(typeof self !== 'undefined' ? self : globalThis);
