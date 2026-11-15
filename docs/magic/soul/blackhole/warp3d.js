/* Bể Kính · magic/soul/blackhole/warp3d.js · Bẻ cong không gian quanh Hố đen (design/ke-hoach-buoc-37.md mục "Hố đen")
 * Một lớp chung cho mọi vật thể vẽ bằng vật liệu sẵn của three.js (đất, đường, nhà, cây, người, đồ vật, cả bóng đổ): trước khi
 * chiếu lên màn hình, mỗi đỉnh (toạ độ thế giới) bị kéo về tâm hố:
 *   - quanh hố không gian hơi cong (thấu kính hấp dẫn, giảm theo khoảng cách bình phương)
 *   - trong mặt hút (front, magic/soul/blackhole/plan.js) vật bị nhấc lên, xoắn quanh trục hố, ép dẹt về mặt đĩa, kéo về tâm;
 *     chỗ gần tâm bị kéo mạnh hơn chỗ xa nên vật dài ra theo hướng tâm, mỏng đi theo chiều ngang (như bị kéo thành sợi mì)
 *   - qua hết dải BAND thì vào hẳn trong lõi đen (bị lõi che)
 *   - chỉ trên đảo bị hút (ngoài bán kính đảo + một chút thì không hút, chỉ còn thấu kính)
 * Cài một lần lúc nạp (trước khi dựng vật liệu, index.html nạp ngay sau three.js):
 *   - THREE.ShaderChunk.common: khai báo uniform bkHoleA/B/C và hàm bkWarp (uniform không gán thì bằng 0: không bẻ cong gì)
 *   - THREE.ShaderChunk.project_vertex: chiếu đỉnh đã bẻ cong (khi bkHoleB.x > 0)
 *   - onBeforeCompile của mọi vật liệu (cả vật liệu tự gắn onBeforeCompile riêng): gắn uniform dùng chung; khoá bộ nhớ đệm chương
 *     trình vẫn theo hàm riêng của từng vật liệu. Vật liệu có userData.noVoid (lõi đen của hố) thì không bị bẻ cong.
 * Shader tự viết (mặt biển, hạt phép, trời) không dùng project_vertex nên không bị bẻ cong.
 * BK.VoidWarp.set({ center, front, band, horizon, lens, spin, isle: {x, z, r}, fade }), off(). Cần: three.js. */
(function (root) {
  const BK = root.BK || (root.BK = {});
  const THREE = root.THREE;
  if (!THREE || BK.VoidWarp) return;
  const U = {
    bkHoleA: { value: new THREE.Vector4() }, // tâm hố (x, y, z), mặt hút (khoảng cách tới tâm)
    bkHoleB: { value: new THREE.Vector4() }, // bán kính lõi đen (0: tắt), dải biến dạng, độ bẻ cong, góc xoay thêm
    bkHoleC: { value: new THREE.Vector4() }, // tâm đảo (x, z), bán kính đảo, mức còn (1 → 0 khi hố tan)
  };
  const DECL = `
uniform vec4 bkHoleA; uniform vec4 bkHoleB; uniform vec4 bkHoleC;
vec3 bkWarp(vec3 p) {
  vec3 d = p - bkHoleA.xyz;
  float r = length(d) + 1e-4, rh = bkHoleB.x;
  float isle = 1.0 - smoothstep(bkHoleC.z, bkHoleC.z + 6.0, length(p.xz - bkHoleC.xy));
  float f = (1.0 - smoothstep(bkHoleA.w - bkHoleB.y, bkHoleA.w, r)) * isle;
  f = f * f * (3.0 - 2.0 * f);
  float g = bkHoleB.z * rh * rh / (r * r + rh * rh);
  float k = clamp(max(f, g), 0.0, 1.0) * bkHoleC.w;
  float a = k * k * 4.0 + f * bkHoleB.w * bkHoleC.w;
  float c = cos(a), s = sin(a);
  d.xz = vec2(c * d.x - s * d.z, s * d.x + c * d.z);
  d.y *= 1.0 - 0.7 * k;
  d *= mix(r, rh * 0.25, k) / r;
  return bkHoleA.xyz + d;
}
`;
  const SC = THREE.ShaderChunk;
  SC.common = SC.common + DECL;
  const PV = 'mvPosition = modelViewMatrix * mvPosition;';
  if (SC.project_vertex.indexOf(PV) < 0) throw new Error('VoidWarp: project_vertex của three.js đã đổi');
  SC.project_vertex = SC.project_vertex.replace(
    PV,
    'if (bkHoleB.x > 0.0) { vec4 bkW = modelMatrix * mvPosition; bkW.xyz = bkWarp(bkW.xyz); mvPosition = viewMatrix * bkW; }\n' +
      'else mvPosition = modelViewMatrix * mvPosition;'
  );
  // gắn uniform dùng chung (cùng một đối tượng: đổi giá trị ở đây là mọi vật liệu thấy ngay). Vật liệu không bị bẻ cong vẫn phải
  // gắn uniform riêng bằng 0: chương trình shader dùng chung giữa các vật liệu giống nhau, giá trị uniform nằm trong chương trình,
  // không gắn thì nó giữ giá trị của vật liệu vẽ trước (lõi đen bị bẻ cong theo)
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
    U.bkHoleB.value.set(Math.max(1e-3, o.horizon), o.band, o.lens, o.spin || 0);
    U.bkHoleC.value.set(o.isle.x, o.isle.z, o.isle.r, o.fade == null ? 1 : o.fade);
  }
  const off = () => U.bkHoleB.value.set(0, 0, 0, 0);
  // (cùng phép tính trên CPU, cho kiểm tra và cho vật cần biết chỗ đã bị bẻ: bóng dưới chân, máy quay)
  function warpPoint(p, out) {
    const A = U.bkHoleA.value,
      B = U.bkHoleB.value,
      C = U.bkHoleC.value;
    out.copy(p);
    if (B.x <= 0) return out;
    const sm = (a, b, x) => {
      const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
      return t * t * (3 - 2 * t);
    };
    let dx = p.x - A.x,
      dy = p.y - A.y,
      dz = p.z - A.z;
    const r = Math.hypot(dx, dy, dz) + 1e-4,
      rh = B.x,
      isle = 1 - sm(C.z, C.z + 6, Math.hypot(p.x - C.x, p.z - C.y));
    let f = (1 - sm(A.w - B.y, A.w, r)) * isle;
    f = f * f * (3 - 2 * f);
    const g = (B.z * rh * rh) / (r * r + rh * rh),
      k = Math.min(1, Math.max(0, Math.max(f, g))) * C.w,
      a = k * k * 4 + f * B.w * C.w,
      c = Math.cos(a),
      s = Math.sin(a);
    [dx, dz] = [c * dx - s * dz, s * dx + c * dz];
    dy *= 1 - 0.7 * k;
    const sc = (r + (rh * 0.25 - r) * k) / r;
    return out.set(A.x + dx * sc, A.y + dy * sc, A.z + dz * sc);
  }
  BK.VoidWarp = { set, off, warpPoint, U, get on() {
    return U.bkHoleB.value.x > 0;
  } };
})(typeof self !== 'undefined' ? self : globalThis);
