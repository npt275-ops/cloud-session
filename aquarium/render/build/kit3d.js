/* Bể Kính · render/build/kit3d.js
 * Bộ dựng hình chung cho mọi công trình, vẽ theo cách của đảo: mặt phẳng (flat shading), góc vát một lớp, màu theo đỉnh,
 * chân công trình sẫm dần lên mái. Mỗi công trình gom mọi mảnh vào một Kit rồi gộp thành MỘT khối (một lượt vẽ).
 * Kiểu nhà của từng đảo và từng cấp nằm ở render/build/<đảo>3d.js; tệp này không biết gì về kiểu nhà.
 * Cần: three.js. */
(function (root, factory) {
  const BK = root.BK || (root.BK = {});
  BK.BuildKit = factory();
})(typeof self !== 'undefined' ? self : globalThis, function () {
  'use strict';
  const T = () => window.THREE;

  /* ---------- Hình cơ bản ---------- */
  // hộp vát cạnh: mỗi cạnh có một mặt vát rộng r (S = 3 lát mỗi chiều), gốc ở giữa đáy hộp nếu base = true
  function box(w, h, d, r, base) {
    const THREE = T(); r = Math.max(0.001, Math.min(r || 0.06, w / 2 - 0.001, h / 2 - 0.001, d / 2 - 0.001));
    const g = new THREE.BoxGeometry(2, 2, 2, 3, 3, 3), p = g.attributes.position, half = [w / 2, h / 2, d / 2];
    const map = (f, hf) => { const a = Math.abs(f), s = Math.sign(f); return s * (a <= 1 / 3 ? a * 3 * (hf - r) : hf - r + (a - 1 / 3) * 1.5 * r); };
    const v = new THREE.Vector3(), c = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) {
      v.set(map(p.getX(i), half[0]), map(p.getY(i), half[1]), map(p.getZ(i), half[2]));
      c.set(Math.max(-half[0] + r, Math.min(half[0] - r, v.x)), Math.max(-half[1] + r, Math.min(half[1] - r, v.y)), Math.max(-half[2] + r, Math.min(half[2] - r, v.z)));
      const n = v.clone().sub(c), L = n.length(); if (L > 1e-6) v.copy(c).addScaledVector(n.divideScalar(L), r);
      p.setXYZ(i, v.x, v.y + (base ? h / 2 : 0), v.z);
    }
    g.computeVertexNormals(); return g;
  }
  // mái: hộp vát vuốt nhỏ dần lên đỉnh (tw, td: bề ngang, bề sâu ở đỉnh); lift: bốn góc mái cong lên
  function roof(w, h, d, r, tw, td, lift) {
    const g = box(w, h, d, r, true), p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const y = p.getY(i), t = Math.max(0, Math.min(1, y / h)); const x = p.getX(i) * (1 + (tw / w - 1) * t), z = p.getZ(i) * (1 + (td / d - 1) * t);
      let yy = y; if (lift) { const ax = Math.abs(x) / (w / 2), az = Math.abs(z) / (d / 2); yy += lift * Math.pow(ax, 6) * Math.pow(az, 6) * (1 - t); }
      p.setXYZ(i, x, yy, z);
    }
    g.computeVertexNormals(); return g;
  }
  // khối tròn xoay từ một dãy [bán kính, độ cao]; seg: số cạnh (ít cạnh cho đúng nét mặt phẳng của đảo)
  function lathe(prof, seg) { const THREE = T(); return new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(Math.max(0.001, r), y)), seg || 8); }
  // cột, cọc: gốc ở chân
  function post(r, h, seg, top) { const THREE = T(); return new THREE.CylinderGeometry(top != null ? top : r * 0.9, r, h, seg || 6).translate(0, h / 2, 0); }
  function cone(r, h, seg) { const THREE = T(); return new THREE.ConeGeometry(r, h, seg || 7).translate(0, h / 2, 0); }
  function ball(r, seg) { const THREE = T(); return new THREE.IcosahedronGeometry(r, seg || 0); }
  function disc(r, seg) { const THREE = T(); return new THREE.CircleGeometry(r, seg || 12).rotateX(-Math.PI / 2); }

  /* ---------- Gom mảnh và gộp ---------- */
  function Kit() { this.parts = []; this.glow = []; this.lit = []; this.subs = []; }
  // phần chuyển động (cánh quạt, khí cầu, nhà lơ lửng...): một Kit con, dựng thành khối riêng đặt ở điểm xoay pivot;
  // các mảnh vẽ vào Kit con theo toạ độ tính từ pivot. render/buildings3d.js làm nó quay hoặc nhấp nhô theo BUILD trả về.
  Kit.prototype.sub = function (name, pivot) { const k = new Kit(); k.name = name; k.pivot = pivot || [0, 0, 0]; k.tint = this.tint; this.subs.push(k); return k; };
  // tint: hàm đổi màu cho mọi mảnh của Kit (và Kit con), để dùng lại một kiểu công trình với bảng màu của đảo khác
  // thêm một mảnh: geo, màu, vị trí; o.rot [x,y,z], o.sc [x,y,z]; o.glow: mảnh phát sáng (lửa, đèn) vẽ riêng, không đổ bóng;
  // o.lit: ô cửa sổ sáng đèn về đêm (ban ngày trong suốt, tối dần thì sáng lên; độ sáng chung cho mọi công trình, litMat)
  Kit.prototype.add = function (geo, color, x, y, z, o) {
    const THREE = T(); o = o || {};
    const m = new THREE.Matrix4().compose(new THREE.Vector3(x || 0, y || 0, z || 0), new THREE.Quaternion().setFromEuler(new THREE.Euler(...(o.rot || [0, 0, 0]))), new THREE.Vector3(...(o.sc || [1, 1, 1])));
    const c = new THREE.Color(color); if (this.tint) this.tint(c, o);
    (o.lit ? this.lit : o.glow ? this.glow : this.parts).push({ geo, color: c, m, ao: o.ao !== false });
    return this;
  };
  // gộp thành một BufferGeometry có màu theo đỉnh; chân sẫm hơn đỉnh (aoH: độ cao hết sẫm)
  function merge(parts, aoH) {
    const THREE = T(); let n = 0; const gs = [];
    for (const P of parts) { const g = (P.geo.index ? P.geo.toNonIndexed() : P.geo.clone()); g.applyMatrix4(P.m); gs.push([g, P]); n += g.attributes.position.count; }
    const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), col = new Float32Array(n * 3); let o = 0;
    for (const [g, P] of gs) {
      const p = g.attributes.position, k = p.count; pos.set(p.array, o * 3); nor.set(g.attributes.normal.array, o * 3);
      for (let i = 0; i < k; i++) { const f = P.ao ? 0.72 + 0.28 * Math.min(1, Math.max(0, p.getY(i)) / aoH) : 1; col[(o + i) * 3] = P.color.r * f; col[(o + i) * 3 + 1] = P.color.g * f; col[(o + i) * 3 + 2] = P.color.b * f; }
      o += k; g.dispose();
    }
    const out = new THREE.BufferGeometry(); out.setAttribute('position', new THREE.BufferAttribute(pos, 3)); out.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); out.setAttribute('color', new THREE.BufferAttribute(col, 3)); out.computeBoundingSphere();
    return out;
  }
  let MAT = null, GLOW = null, LIT = null, NEON = null;
  const mat = () => MAT || (MAT = new (T().MeshStandardMaterial)({ vertexColors: true, flatShading: true, roughness: 0.88, metalness: 0.02 }));
  const glowMat = () => GLOW || (GLOW = new (T().MeshBasicMaterial)({ vertexColors: true, transparent: true, opacity: 0.92, depthWrite: false }));
  // đường viền neon của thành phố neon (render/build/neon.js edges): màu theo đỉnh, dịu, không ghi độ sâu
  const neonMat = () => NEON || (NEON = new (T().LineBasicMaterial)({ vertexColors: true, transparent: true, opacity: 0.8, depthWrite: false, fog: false }));
  const litMat = () => LIT || (LIT = new (T().MeshBasicMaterial)({ vertexColors: true, transparent: true, opacity: 0, depthWrite: false }));
  // dựng một công trình thành nhóm: khối chính (đổ bóng) và khối sáng (nếu có)
  Kit.prototype.bake = function (aoH) {
    const THREE = T(), g = new THREE.Group();
    if (this.parts.length) { const m = new THREE.Mesh(merge(this.parts, aoH || 3), mat()); m.castShadow = m.receiveShadow = true; g.add(m); g.userData.main = m; g.userData.tris = m.geometry.attributes.position.count / 3; }
    if (this.glow.length) { const m = new THREE.Mesh(merge(this.glow, 1), glowMat().clone()); m.renderOrder = 2; g.add(m); g.userData.glow = m; }
    if (this.lit.length) { const m = new THREE.Mesh(merge(this.lit, 1), litMat()); m.renderOrder = 2; g.add(m); g.userData.lit = m; }
    g.userData.subs = {};
    for (const k of this.subs) { const c = k.bake(aoH); c.position.set(...k.pivot); c.name = k.name; g.add(c); g.userData.subs[k.name] = c; g.userData.tris = (g.userData.tris || 0) + (c.userData.tris || 0); if (c.userData.glow) (g.userData.subGlows || (g.userData.subGlows = [])).push(c.userData.glow); }
    return g;
  };
  function dispose(g) { g.traverse((o) => { if (o.isMesh || o.isLine) o.geometry.dispose(); }); }

  // vật liệu chung (render/build/batch3d.js gộp nhiều công trình dùng lại đúng các vật liệu này)
  const mats = () => ({ main: mat(), glow: glowMat(), lit: litMat(), neon: neonMat() });
  return { box, roof, lathe, post, cone, ball, disc, Kit, dispose, litMat, neonMat, mats };
});
