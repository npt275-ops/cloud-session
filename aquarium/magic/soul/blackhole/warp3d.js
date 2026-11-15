/* Bể Kính · magic/soul/blackhole/warp3d.js · Hố đen hút từng vật thể (design/ke-hoach-buoc-37.md mục "Hố đen")
 * Người chơi chốt: đất giữ nguyên; từng vật thể (cây, cỏ, đất đá, nhà, mảng gạch đường) tách ra, bị nhấc lên, hút vào hố.
 * Vật thể nào bị hút là do pieces.js chọn: nó ghi cho mỗi đỉnh của vật một thuộc tính bkPivot = (tâm của vật, -bán kính).
 * Ở đây, trước khi chiếu đỉnh lên màn hình (vật liệu sẵn của three.js, cả bóng đổ), đỉnh nào có bkPivot.w < 0 thì cả vật của
 * nó cùng đi một đường, giữ nguyên hình:
 *   - tới lượt khi mặt hút (front, plan.js) đã qua tâm vật VÀ hố lớn hơn vật (cỡ cả hố ≥ bán kính vật × SIZE): vật nhỏ (cỏ, đá)
 *     bị hút trước, nhà sau; mỗi vật lệch giờ một chút (theo chỗ của nó)
 *   - nhấc khỏi đất, lộn nhào quanh tâm của chính nó, bay xoắn ốc về tâm hố
 *   - gần tới lõi thì bị kéo dài về phía tâm, mỏng đi, rồi thu nhỏ hẳn (bị lõi đen che)
 * Đỉnh không có bkPivot (đất, mặt nước, người: người do pull.js hút cả thân) thì đứng yên.
 * Cài một lần lúc nạp (index.html nạp ngay sau three.js, trước khi dựng vật liệu nào):
 *   - THREE.ShaderChunk.common: uniform bkHoleA/B/C và hàm bkWarp (uniform không gán thì bằng 0: tắt)
 *   - các mảnh chỉ có ở shader đỉnh (uv_pars_vertex, color_pars_vertex, shadowmap_pars_vertex): thuộc tính bkPivot
 *   - THREE.ShaderChunk.project_vertex: chiếu đỉnh đã dời (khi bkHoleB.x > 0)
 *   - onBeforeCompile của mọi vật liệu (cả vật liệu tự gắn onBeforeCompile riêng): gắn uniform dùng chung; khoá bộ nhớ đệm chương
 *     trình vẫn theo hàm riêng của từng vật liệu. Vật liệu có userData.noVoid (lõi đen của hố) gắn uniform riêng bằng 0.
 * BK.VoidWarp.set({ center, front, band, outer, size, isle: {x, z, r}, fade }), off(), move(chỗ, tâm vật, bán kính, out)
 * (cùng phép tính trên CPU, cho kiểm thử). Cần: three.js. */
(function (root) {
  const BK = root.BK || (root.BK = {});
  const THREE = root.THREE;
  if (!THREE || BK.VoidWarp) return;
  const U = {
    bkHoleA: { value: new THREE.Vector4() }, // tâm hố (x, y, z), mặt hút (khoảng cách tới tâm)
    bkHoleB: { value: new THREE.Vector4() }, // cỡ cả hố (0: tắt), dải nhấc lên, hệ số cỡ vật, giây
    bkHoleC: { value: new THREE.Vector4() }, // tâm đảo (x, z), bán kính đảo, mức còn (1 → 0 khi hố tan)
  };
  // (giữ đúng một cách tính: GLSL ở đây và move() trên CPU bên dưới)
  const DECL = `
uniform vec4 bkHoleA; uniform vec4 bkHoleB; uniform vec4 bkHoleC;
float bkHash(vec3 p) { return fract(sin(dot(floor(p * 3.0), vec3(12.9898, 78.233, 37.719))) * 43758.5453); }
vec3 bkWarp(vec3 p, vec3 c0, float rad) {
  vec3 C = bkHoleA.xyz, d0 = c0 - C;
  float r = length(d0), sd = bkHash(c0);
  float isle = 1.0 - step(bkHoleC.z + 4.0, length(c0.xz - bkHoleC.xy));
  float uf = (bkHoleA.w - r - sd * 4.0) / bkHoleB.y;
  float us = (bkHoleB.x - rad * bkHoleB.z) / (rad * bkHoleB.z * 0.6 + 0.8);
  float u = clamp(min(uf, us), 0.0, 1.0) * isle * bkHoleC.w;
  if (u <= 0.0) return p;
  float e = u * u;
  float ang = e * (2.0 + sd * 3.0), ca = cos(ang), sa = sin(ang);
  vec2 h = vec2(ca * d0.x - sa * d0.z, sa * d0.x + ca * d0.z) * (1.0 - e);
  float lift = sin(min(1.0, u * 3.0) * 1.5708) * (0.8 + rad * 0.5);
  vec3 np = C + vec3(h.x, mix(d0.y + lift, 0.0, e), h.y);
  vec3 q = p - c0;
  vec3 ax = normalize(vec3(sd - 0.5, 0.7, fract(sd * 7.31) - 0.5));
  float ta = u * (1.5 + sd * 5.0) + sin(bkHoleB.w * (1.0 + sd)) * 0.15 * u;
  q = q * cos(ta) + cross(ax, q) * sin(ta) + ax * dot(ax, q) * (1.0 - cos(ta));
  vec3 n = normalize(C - np + vec3(0.0, 1e-3, 0.0));
  float st = 1.0 + 3.0 * smoothstep(0.55, 1.0, u), al = dot(q, n);
  q = (q - n * al) / sqrt(st) + n * al * st;
  q *= 1.0 - smoothstep(0.82, 1.0, u);
  return np + q;
}
`;
  const SC = THREE.ShaderChunk;
  SC.common = SC.common + DECL;
  const ATTR = '\n#ifndef BK_PIVOT\n#define BK_PIVOT\nattribute vec4 bkPivot;\n#endif\n';
  for (const k of ['uv_pars_vertex', 'color_pars_vertex', 'shadowmap_pars_vertex']) SC[k] = SC[k] + ATTR;
  const PV = 'mvPosition = modelViewMatrix * mvPosition;';
  if (SC.project_vertex.indexOf(PV) < 0) throw new Error('VoidWarp: project_vertex của three.js đã đổi');
  SC.project_vertex = SC.project_vertex.replace(
    PV,
    `if (bkHoleB.x > 0.0 && bkPivot.w < 0.0) {
  vec4 bkP = vec4(bkPivot.xyz, 1.0);
#ifdef USE_INSTANCING
  bkP = instanceMatrix * bkP;
#endif
  bkP = modelMatrix * bkP;
  vec4 bkW = modelMatrix * mvPosition;
  bkW.xyz = bkWarp(bkW.xyz, bkP.xyz, -bkPivot.w);
  mvPosition = viewMatrix * bkW;
} else mvPosition = modelViewMatrix * mvPosition;`
  );
  // gắn uniform dùng chung (cùng một đối tượng: đổi giá trị ở đây là mọi vật liệu thấy ngay). Vật liệu không bị hút vẫn phải gắn
  // uniform riêng bằng 0: chương trình shader dùng chung giữa các vật liệu giống nhau, giá trị uniform nằm trong chương trình,
  // không gắn thì nó giữ giá trị của vật liệu vẽ trước
  const ZERO = () => ({ bkHoleA: { value: new THREE.Vector4() }, bkHoleB: { value: new THREE.Vector4() }, bkHoleC: { value: new THREE.Vector4() } });
  function hook(m, sh) {
    Object.assign(sh.uniforms, m && m.userData && m.userData.noVoid ? ZERO() : U);
  }
  const base = function (sh) {
    hook(this, sh);
  };
  base.toString = () => 'bkVoid';
  Object.defineProperty(THREE.Material.prototype, 'onBeforeCompile', {
    configurable: true,
    get() {
      return this.__bkObc || base;
    },
    set(fn) {
      if (!fn || fn.__bkVoid) return void (this.__bkObc = fn);
      const w = function (sh, r) {
        hook(this, sh);
        return fn.call(this, sh, r);
      };
      w.__bkVoid = true;
      w.toString = () => 'bkVoid|' + fn.toString(); // (khoá bộ nhớ đệm chương trình: theo hàm riêng của vật liệu)
      this.__bkObc = w;
    },
  });
  function set(o) {
    const c = o.center;
    U.bkHoleA.value.set(c.x, c.y, c.z, o.front);
    U.bkHoleB.value.set(Math.max(1e-3, o.outer), o.band, o.size, o.time || 0);
    U.bkHoleC.value.set(o.isle.x, o.isle.z, o.isle.r, o.fade == null ? 1 : o.fade);
  }
  const off = () => U.bkHoleB.value.set(0, 0, 0, 0);
  // cùng phép tính trên CPU (đỉnh p của vật có tâm c0, bán kính rad; toạ độ thế giới): trả { p: chỗ mới, u: mức đã bị hút 0..1 }
  function move(p, c0, rad) {
    const A = U.bkHoleA.value,
      B = U.bkHoleB.value,
      Cc = U.bkHoleC.value;
    const fr = (x) => x - Math.floor(x),
      cl = (x) => Math.min(1, Math.max(0, x)),
      ss = (a, b, x) => {
        const t = cl((x - a) / (b - a));
        return t * t * (3 - 2 * t);
      };
    if (B.x <= 0) return { p: { x: p.x, y: p.y, z: p.z }, u: 0 };
    const d0 = { x: c0.x - A.x, y: c0.y - A.y, z: c0.z - A.z },
      r = Math.hypot(d0.x, d0.y, d0.z),
      sd = fr(Math.sin(Math.floor(c0.x * 3) * 12.9898 + Math.floor(c0.y * 3) * 78.233 + Math.floor(c0.z * 3) * 37.719) * 43758.5453);
    const isle = Math.hypot(c0.x - Cc.x, c0.z - Cc.y) > Cc.z + 4 ? 0 : 1;
    const uf = (A.w - r - sd * 4) / B.y,
      us = (B.x - rad * B.z) / (rad * B.z * 0.6 + 0.8),
      u = cl(Math.min(uf, us)) * isle * Cc.w;
    if (u <= 0) return { p: { x: p.x, y: p.y, z: p.z }, u: 0 };
    const e = u * u,
      ang = e * (2 + sd * 3),
      ca = Math.cos(ang),
      sa = Math.sin(ang);
    const hx = (ca * d0.x - sa * d0.z) * (1 - e),
      hz = (sa * d0.x + ca * d0.z) * (1 - e),
      lift = Math.sin(Math.min(1, u * 3) * 1.5708) * (0.8 + rad * 0.5);
    const np = new THREE.Vector3(A.x + hx, A.y + (d0.y + lift) * (1 - e), A.z + hz);
    const q = new THREE.Vector3(p.x - c0.x, p.y - c0.y, p.z - c0.z),
      ax = new THREE.Vector3(sd - 0.5, 0.7, fr(sd * 7.31) - 0.5).normalize(),
      ta = u * (1.5 + sd * 5) + Math.sin(B.w * (1 + sd)) * 0.15 * u;
    q.applyAxisAngle(ax, ta);
    const n = new THREE.Vector3(A.x, A.y, A.z).sub(np).add(new THREE.Vector3(0, 1e-3, 0)).normalize(),
      st = 1 + 3 * ss(0.55, 1, u),
      al = q.dot(n);
    q.sub(n.clone().multiplyScalar(al)).divideScalar(Math.sqrt(st)).add(n.multiplyScalar(al * st));
    q.multiplyScalar(1 - ss(0.82, 1, u));
    return { p: np.add(q), u };
  }
  BK.VoidWarp = { set, off, move, U, get on() {
    return U.bkHoleB.value.x > 0;
  } };
})(typeof self !== 'undefined' ? self : globalThis);
