/* Bể Kính · render/water/ripples3d.js · Gợn nước mô phỏng (quy tắc 6: vật chạm nước phải để lại dấu)
 * Một mặt sóng nhỏ mô phỏng thật trên GPU (phương trình sóng trên lưới RES × RES, hai ảnh thay nhau), phủ một ô SIZE × SIZE
 * quanh chỗ máy quay đang nhìn trên mặt nước (ô dời theo, nội dung dời cùng, khớp từng điểm lưới nên gợn không trôi). Gợn lan
 * ra, dội, tắt dần (DAMP); bước mô phỏng đều STEP_HZ lần mỗi giây (gợn lan chừng 2,5 đơn vị mỗi giây dù máy nhanh chậm).
 * Nguồn gợn:
 *   vật nổi    mọi vật gọi BK.seaAt(x, z) (thuyền, tàu: render/travel3d.js, prosper3d.js, buildings3d.js) được tính là chạm
 *              nước ở đó trong khung hình đó: gợn quanh thân thuyền, vệt sau thuyền khi chạy; kèm bóng tiếp xúc (contacts)
 *   splash(x, z, r, mạnh)  một cú chạm (phép nước, vật rơi xuống nước: magic/water/ sau này)
 * Mặt nước (render/water/surface3d.js) đọc tex (r: độ cao gợn), origin/size để đổi chỗ, contacts (bóng tiếp xúc, bọt).
 * Cần: three.js, sea3d.js (BK.seaAt). */
(function (root) {
  const BK = root.BK || (root.BK = {});
  const RES = 256,
    SIZE = 48, // (đơn vị) cạnh ô mô phỏng
    STEP_HZ = 20,
    DAMP = 0.982,
    DROPS = 16, // số nguồn gợn mỗi bước
    CONTACTS = 8, // số vật nổi có bóng tiếp xúc
    FLOAT_R = 0.9, // bán kính chạm nước của một vật nổi
    FLOAT_K = 0.035; // độ mạnh gợn của vật nổi mỗi bước
  function setup(G) {
    const { THREE, renderer, camera } = G;
    const half = renderer.capabilities.isWebGL2 || renderer.extensions.get('OES_texture_half_float');
    const mk = () =>
      new THREE.WebGLRenderTarget(RES, RES, {
        type: half ? THREE.HalfFloatType : THREE.FloatType,
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        depthBuffer: false,
        stencilBuffer: false,
      });
    let A = mk(),
      B = mk();
    // (ảnh mới tạo chưa có nội dung: xoá về 0, mặt gợn phẳng)
    {
      const keepC = renderer.getClearColor(new THREE.Color()),
        keepA = renderer.getClearAlpha(),
        keepT = renderer.getRenderTarget();
      renderer.setClearColor(0x000000, 0);
      for (const t of [A, B]) {
        renderer.setRenderTarget(t);
        renderer.clear(true, false, false);
      }
      renderer.setRenderTarget(keepT);
      renderer.setClearColor(keepC, keepA);
    }
    const drops = Array.from({ length: DROPS }, () => new THREE.Vector4());
    const U = {
      uPrev: { value: null },
      uTexel: { value: new THREE.Vector2(1 / RES, 1 / RES) },
      uShift: { value: new THREE.Vector2() },
      uOrigin: { value: new THREE.Vector2() },
      uSize: { value: SIZE },
      uDrops: { value: drops },
      uN: { value: 0 },
      uDamp: { value: DAMP },
    };
    const sim = new THREE.ShaderMaterial({
      uniforms: U,
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
      fragmentShader: `uniform sampler2D uPrev; uniform vec2 uTexel, uShift, uOrigin; uniform float uSize, uDamp;
uniform vec4 uDrops[${DROPS}]; uniform int uN; varying vec2 vUv;
float H(vec2 p){ return (p.x < 0.0 || p.y < 0.0 || p.x > 1.0 || p.y > 1.0) ? 0.0 : texture2D(uPrev, p).r; }
void main(){
  vec2 uv = vUv + uShift;
  vec2 c = (uv.x < 0.0 || uv.y < 0.0 || uv.x > 1.0 || uv.y > 1.0) ? vec2(0.0) : texture2D(uPrev, uv).rg;
  float n = H(uv + vec2(uTexel.x, 0.0)) + H(uv - vec2(uTexel.x, 0.0)) + H(uv + vec2(0.0, uTexel.y)) + H(uv - vec2(0.0, uTexel.y));
  float h = (n * 0.5 - c.g) * uDamp;
  vec2 w = uOrigin + (vUv - 0.5) * uSize;
  for (int i = 0; i < ${DROPS}; i++) { if (i >= uN) break; vec4 d = uDrops[i]; vec2 q = (w - d.xy) / d.z; h += d.w * exp(-2.0 * dot(q, q)); }
  vec2 e = min(vUv, 1.0 - vUv); h *= smoothstep(0.0, 0.06, min(e.x, e.y)); // (mép ô: tắt dần, không dội ngược)
  gl_FragColor = vec4(h, c.r, 0.0, 1.0);
}`,
      depthTest: false,
      depthWrite: false,
    });
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), sim),
      qScene = new THREE.Scene(),
      qCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    quad.frustumCulled = false;
    qScene.add(quad);
    const st = { acc: 0, origin: new THREE.Vector2(), splashes: [], floats: [], floatsNext: [] };
    // vật nổi: ai hỏi mặt biển ở đâu thì đang chạm nước ở đó
    if (BK.seaAt && !BK.seaAt.wrapped) {
      const raw = BK.seaAt;
      BK.seaAt = (x, z) => {
        if (st.floatsNext.length < 64) st.floatsNext.push([x, z]);
        return raw(x, z);
      };
      BK.seaAt.wrapped = true;
    }
    const splash = (x, z, r, k) => st.splashes.push([x, z, r || 1, k == null ? 0.4 : k]);
    // chỗ máy quay nhìn trên mặt nước (tia nhìn cắt mặt nước; xa quá thì ngay dưới máy quay)
    const dir = new THREE.Vector3();
    function focus(y) {
      camera.getWorldDirection(dir);
      const p = camera.position;
      let x = p.x,
        z = p.z;
      if (dir.y < -0.05) {
        const s = (p.y - y) / -dir.y;
        if (s < 80) {
          x += dir.x * s;
          z += dir.z * s;
        }
      }
      const cell = SIZE / RES;
      return [Math.round(x / cell) * cell, Math.round(z / cell) * cell];
    }
    function step(y) {
      const [ox, oz] = focus(y);
      U.uShift.value.set((ox - st.origin.x) / SIZE, (oz - st.origin.y) / SIZE);
      st.origin.set(ox, oz);
      U.uOrigin.value.copy(st.origin);
      let n = 0;
      const add = (x, z, r, k) => {
        if (n >= DROPS || Math.abs(x - ox) > SIZE / 2 + r || Math.abs(z - oz) > SIZE / 2 + r) return;
        drops[n++].set(x, z, r, k);
      };
      for (const s of st.splashes.splice(0)) add(...s);
      for (const [x, z] of st.floats) add(x, z, FLOAT_R, FLOAT_K * Math.sin(st.t * 9 + x * 3 + z));
      U.uN.value = n;
      U.uPrev.value = A.texture;
      const keep = renderer.getRenderTarget();
      renderer.setRenderTarget(B);
      renderer.render(qScene, qCam);
      renderer.setRenderTarget(keep);
      [A, B] = [B, A];
    }
    // vật nổi gần ô mô phỏng nhất: bóng tiếp xúc trên mặt nước
    const contacts = Array.from({ length: CONTACTS }, () => new THREE.Vector3(0, 0, 0));
    function update(sec, y) {
      st.t = (st.t || 0) + sec;
      st.floats = st.floatsNext;
      st.floatsNext = [];
      st.acc = Math.min(st.acc + sec * STEP_HZ, 3);
      for (; st.acc >= 1; st.acc--) step(y);
      const near = st.floats
        .map(([x, z]) => [x, z, (x - st.origin.x) ** 2 + (z - st.origin.y) ** 2])
        .sort((a, b) => a[2] - b[2])
        .slice(0, CONTACTS);
      contacts.forEach((c, i) => (near[i] ? c.set(near[i][0], near[i][1], FLOAT_R * 1.6) : c.set(0, 0, 0)));
    }
    G.waterRipples = {
      update,
      splash,
      contacts,
      get tex() {
        return A.texture;
      },
      origin: st.origin,
      SIZE,
      RES,
    };
  }
  BK.WaterRipples = { setup, SIZE, RES };
})(typeof self !== 'undefined' ? self : globalThis);
