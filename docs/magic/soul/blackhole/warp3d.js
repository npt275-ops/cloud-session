/* Bể Kính · magic/soul/blackhole/warp3d.js · Hố đen hút từng vật thể (design/ke-hoach-buoc-37.md mục "Hố đen")
 * Người chơi chốt: đất giữ nguyên; từng vật thể (cây, cỏ, đất đá, nhà, mảng gạch đường) tách ra, bị nhấc lên, hút vào hố.
 * Vật thể nào bị hút là do pieces.js chọn: nó ghi cho mỗi đỉnh hai thuộc tính: bkPivot = (tâm của vật, -bán kính) và
 * bkShard = (tâm của mảnh nhỏ chứa đỉnh đó, cỡ chừng 0,9). Ở đây, trước khi chiếu đỉnh lên màn hình (vật liệu sẵn của three.js,
 * cả bóng đổ), đỉnh nào có bkPivot.w < 0 thì đi theo vật, rồi theo mảnh của nó:
 *   - tới lượt (u 0..1) khi tầm hút (reach, plan.js: khoảng cách ngang tới trục hố) đã qua tâm vật VÀ hố lớn hơn vật (cỡ cả
 *     hố ≥ bán kính vật × SIZE): vật nhỏ (cỏ, đá) trước, nhà sau; mỗi vật lệch giờ một chút (theo chỗ của nó)
 *   - lực thuỷ triều (u 0..0,4): cả vật bị kéo dài về phía hố, ép mỏng ngang; phần càng cao càng bị kéo nghiêng về phía hố
 *     (thân cây uốn cong), lắc oằn oại theo thời gian; các mảnh tách hở dần (nứt); cả vật nhích lên (bật gốc)
 *   - xé mảnh (từ u 0,4, mỗi mảnh lệch giờ): từng mảnh nhỏ rời vật, lộn nhào quanh tâm của mảnh, bay xoắn ốc về tâm hố; gần
 *     lõi thì mảnh bị kéo dài về phía tâm, mỏng đi, rồi thu nhỏ hẳn (bị lõi đen che)
 * Đỉnh không có bkPivot (đất, mặt nước, người: người do pull.js hút cả thân) thì đứng yên.
 * Cài một lần lúc nạp (index.html nạp ngay sau three.js, trước khi dựng vật liệu nào):
 *   - THREE.ShaderChunk.common: uniform bkHoleA/B/C và hàm bkWarp (uniform không gán thì bằng 0: tắt)
 *   - các mảnh chỉ có ở shader đỉnh (uv_pars_vertex, color_pars_vertex, shadowmap_pars_vertex): thuộc tính bkPivot
 *   - THREE.ShaderChunk.project_vertex: chiếu đỉnh đã dời (khi bkHoleB.x > 0)
 *   - onBeforeCompile của mọi vật liệu (cả vật liệu tự gắn onBeforeCompile riêng): gắn uniform dùng chung; khoá bộ nhớ đệm chương
 *     trình vẫn theo hàm riêng của từng vật liệu. Vật liệu có userData.noVoid (lõi đen của hố) gắn uniform riêng bằng 0.
 * Ánh sáng bị bẻ cong quanh hố (thấu kính hấp dẫn) là việc của lượt hậu kỳ (render/fx/post3d.js lens), không ở đây.
 * BK.VoidWarp.set({ center, reach, band, outer, size, time, isle: {x, z, r}, fade }), off(). Cần: three.js. */
(function (root) {
  const BK = root.BK || (root.BK = {});
  const THREE = root.THREE;
  if (!THREE || BK.VoidWarp) return;
  const U = {
    bkHoleA: { value: new THREE.Vector4() }, // tâm hố (x, y, z), tầm hút (khoảng cách ngang tới trục hố)
    bkHoleB: { value: new THREE.Vector4() }, // cỡ cả hố (0: tắt), dải nhấc lên, hệ số cỡ vật, giây
    bkHoleC: { value: new THREE.Vector4() }, // tâm đảo (x, z), bán kính đảo, mức còn (1 → 0 khi hố tan)
  };
  const DECL = `
uniform vec4 bkHoleA; uniform vec4 bkHoleB; uniform vec4 bkHoleC;
float bkHash(vec3 p) { return fract(sin(dot(floor(p * 3.0), vec3(12.9898, 78.233, 37.719))) * 43758.5453); }
vec3 bkTurn(vec3 q, vec3 ax, float a) { return q * cos(a) + cross(ax, q) * sin(a) + ax * dot(ax, q) * (1.0 - cos(a)); }
// lực thuỷ triều lên một điểm x của vật (tâm A, bán kính rad): kéo dài về phía hố n, uốn phần cao, lắc, nứt (crk), bật gốc
vec3 bkTidal(vec3 x, vec3 A, float rad, vec3 n, float a, float sd, vec3 crk) {
  vec3 q = x - A;
  float al = dot(q, n);
  q = (q - n * al) * (1.0 - 0.35 * a) + n * al * (1.0 + 1.3 * a);
  float h = clamp((x.y - A.y + rad) / (2.0 * rad), 0.0, 1.0);
  vec3 side = normalize(cross(n, vec3(0.0, 1.0, 0.0)) + vec3(1e-4, 0.0, 0.0));
  q += n * h * h * a * rad * 0.9;
  q += side * sin(bkHoleB.w * 3.5 + h * 4.0 + sd * 6.28) * a * rad * 0.18 * h;
  q += crk;
  q.y += a * a * rad * 0.25;
  return A + q;
}
vec3 bkWarp(vec3 p, vec3 A, float rad, vec3 S) {
  vec3 C = bkHoleA.xyz;
  float sd = bkHash(A);
  float isle = 1.0 - step(bkHoleC.z + 4.0, length(A.xz - bkHoleC.xy));
  float uf = (bkHoleA.w - length(A.xz - C.xz) - sd * 4.0) / bkHoleB.y;
  float us = (bkHoleB.x - rad * bkHoleB.z) / (rad * bkHoleB.z * 0.6 + 0.8);
  float u = clamp(min(uf, us), 0.0, 1.0) * isle * bkHoleC.w;
  if (u <= 0.0) return p;
  vec3 n = normalize(C - A);
  float a = smoothstep(0.0, 0.4, u), hs = bkHash(S + 0.37);
  vec3 crk = normalize(S - A + vec3(1e-3, 2e-3, 1e-3)) * a * a * rad * (0.06 + 0.1 * hs);
  vec3 pT = bkTidal(p, A, rad, n, a, sd, crk);
  float uS = clamp((u - 0.4 - hs * 0.2) / 0.4, 0.0, 1.0);
  if (uS <= 0.0) return pT;
  vec3 sT = bkTidal(S, A, rad, n, a, sd, crk), q = pT - sT, d0 = sT - C;
  float e = uS * uS, ang = e * (2.0 + hs * 4.0), ca = cos(ang), sa = sin(ang);
  vec2 h = vec2(ca * d0.x - sa * d0.z, sa * d0.x + ca * d0.z) * (1.0 - e);
  float lift = sin(min(1.0, uS * 3.0) * 1.5708) * (0.6 + rad * 0.4);
  vec3 np = C + vec3(h.x, (d0.y + lift) * (1.0 - e), h.y);
  q = bkTurn(q, normalize(vec3(hs - 0.5, 0.7, fract(hs * 7.31) - 0.5)), uS * (2.0 + hs * 6.0));
  vec3 n2 = normalize(C - np + vec3(0.0, 1e-3, 0.0));
  float st = 1.0 + 3.0 * smoothstep(0.6, 1.0, uS), al = dot(q, n2);
  q = (q - n2 * al) / sqrt(st) + n2 * al * st;
  q *= 1.0 - smoothstep(0.85, 1.0, uS);
  return np + q;
}
`;
  const SC = THREE.ShaderChunk;
  SC.common = SC.common + DECL;
  const ATTR = '\n#ifndef BK_PIVOT\n#define BK_PIVOT\nattribute vec4 bkPivot;\nattribute vec4 bkShard;\n#endif\n';
  for (const k of ['uv_pars_vertex', 'color_pars_vertex', 'shadowmap_pars_vertex']) SC[k] = SC[k] + ATTR;
  const PV = 'mvPosition = modelViewMatrix * mvPosition;';
  if (SC.project_vertex.indexOf(PV) < 0) throw new Error('VoidWarp: project_vertex của three.js đã đổi');
  SC.project_vertex = SC.project_vertex.replace(
    PV,
    `if (bkHoleB.x > 0.0 && bkPivot.w < 0.0) {
  vec4 bkP = vec4(bkPivot.xyz, 1.0), bkS = vec4(bkShard.xyz, 1.0);
#ifdef USE_INSTANCING
  bkP = instanceMatrix * bkP;
  bkS = instanceMatrix * bkS;
#endif
  bkP = modelMatrix * bkP;
  bkS = modelMatrix * bkS;
  vec4 bkW = modelMatrix * mvPosition;
  bkW.xyz = bkWarp(bkW.xyz, bkP.xyz, -bkPivot.w, bkS.xyz);
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
    U.bkHoleA.value.set(c.x, c.y, c.z, o.reach);
    U.bkHoleB.value.set(Math.max(1e-3, o.outer), o.band, o.size, o.time || 0);
    U.bkHoleC.value.set(o.isle.x, o.isle.z, o.isle.r, o.fade == null ? 1 : o.fade);
  }
  const off = () => U.bkHoleB.value.set(0, 0, 0, 0);
  BK.VoidWarp = { set, off, U, get on() {
    return U.bkHoleB.value.x > 0;
  } };
})(typeof self !== 'undefined' ? self : globalThis);
