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
  // hộp vát cạnh: mỗi cạnh có một mặt vát rộng r (S = 3 lát mỗi chiều, 108 tam giác), gốc ở giữa đáy hộp nếu base = true
  function bevelBox(w, h, d, r, base) {
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
  // hộp dùng cho mọi công trình. Nhẹ máy mà hình như cũ:
  //  - vát nhỏ (r < BEVEL_MIN) hay hộp mảnh (cạnh ngắn nhất < BEVEL_SIDE): mặt vát nhỏ hơn một điểm ảnh ở khoảng nhìn của
  //    game, nên dùng hộp thường 12 tam giác thay cho 108 (đường, tà vẹt, đoạn tường, đèn, ô cửa sổ...)
  //  - hộp cùng cỡ dùng chung một hình (BOXES): Kit chỉ đọc, khi gộp thì sao ra bản riêng (merge), không ai sửa hình gốc
  const BEVEL_MIN = 0.15, BEVEL_SIDE = 0.8, BOXES = new Map();
  function box(w, h, d, r, base) {
    const key = w + ',' + h + ',' + d + ',' + (r || 0.06) + (base ? 'b' : 'c'); let g = BOXES.get(key); if (g) return g;
    if ((r || 0.06) >= BEVEL_MIN && Math.min(w, h, d) >= BEVEL_SIDE) g = bevelBox(w, h, d, r, base);
    else { g = new (T().BoxGeometry)(w, h, d); if (base) g.translate(0, h / 2, 0); }
    if (BOXES.size < 8000) BOXES.set(key, g);
    return g;
  }
  // mái: hộp vát vuốt nhỏ dần lên đỉnh (tw, td: bề ngang, bề sâu ở đỉnh); lift: bốn góc mái cong lên
  function roof(w, h, d, r, tw, td, lift) {
    const g = bevelBox(w, h, d, r, true), p = g.attributes.position; // mái cần lưới chia lát để vuốt và cong góc
    for (let i = 0; i < p.count; i++) {
      const y = p.getY(i), t = Math.max(0, Math.min(1, y / h)); const x = p.getX(i) * (1 + (tw / w - 1) * t), z = p.getZ(i) * (1 + (td / d - 1) * t);
      let yy = y; if (lift) { const ax = Math.abs(x) / (w / 2), az = Math.abs(z) / (d / 2); yy += lift * Math.pow(ax, 6) * Math.pow(az, 6) * (1 - t); }
      p.setXYZ(i, x, yy, z);
    }
    g.computeVertexNormals(); g.userData.noWall = true; return g; // (mái: không phải mảng tường, render/look3d.js)
  }
  // khối tròn xoay từ một dãy [bán kính, độ cao]; seg: số cạnh (ít cạnh cho đúng nét mặt phẳng của đảo)
  function lathe(prof, seg) { const THREE = T(); return new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(Math.max(0.001, r), y)), seg || 8); }
  // cột, cọc: gốc ở chân
  function post(r, h, seg, top) { const THREE = T(); return new THREE.CylinderGeometry(top != null ? top : r * 0.9, r, h, seg || 6).translate(0, h / 2, 0); }
  function cone(r, h, seg) { const THREE = T(); return new THREE.ConeGeometry(r, h, seg || 7).translate(0, h / 2, 0); }
  function ball(r, seg) { const THREE = T(); return new THREE.IcosahedronGeometry(r, seg || 0); }
  function disc(r, seg) { const THREE = T(); return new THREE.CircleGeometry(r, seg || 12).rotateX(-Math.PI / 2); }

  /* ---------- Gom mảnh và gộp ---------- */
  function Kit() { this.parts = []; this.flat = []; this.glow = []; this.lit = []; this.subs = []; }
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
    (o.lit ? this.lit : o.glow ? this.glow : isFlat(this, geo, y, o) ? this.flat : this.parts).push({ geo, color: c, m, ao: o.ao !== false });
    return this;
  };
  // mảnh dẹt sát đất (mặt đường, vạch, tà vẹt, tấm lát): bóng của nó nằm lẫn dưới chính nó, nên vẽ riêng một khối không đổ
  // bóng (vẫn nhận bóng), để lượt vẽ bóng không phải vẽ lại cả mạng đường. Chỉ xét Kit chính, mảnh không nghiêng.
  function isFlat(k, geo, y, o) {
    if (k.name || (o.rot && (o.rot[0] || o.rot[2]))) return false;
    if (!geo.boundingBox) geo.computeBoundingBox();
    const b = geo.boundingBox, sy = o.sc ? o.sc[1] : 1;
    return (b.max.y - b.min.y) * sy < 0.12 && (y || 0) + b.max.y * sy < 0.3;
  }
  // gộp thành một BufferGeometry có màu theo đỉnh; chân sẫm hơn đỉnh (aoH: độ cao hết sẫm)
  function merge(parts, aoH, more) {
    const THREE = T(); let n = 0; const gs = [];
    for (const P of parts) { const g = (P.geo.index ? P.geo.toNonIndexed() : P.geo.clone()); g.applyMatrix4(P.m); gs.push([g, P]); n += g.attributes.position.count; }
    const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), col = new Float32Array(n * 3), lk = new Float32Array(n * 4), all = parts.concat(more || []); let o = 0;
    for (const [g, P] of gs) {
      const p = g.attributes.position, k = p.count; pos.set(p.array, o * 3); nor.set(g.attributes.normal.array, o * 3);
      wallMark(P, lk, o, all);
      for (let i = 0; i < k; i++) { const f = P.ao ? 0.72 + 0.28 * Math.min(1, Math.max(0, p.getY(i)) / aoH) : 1; col[(o + i) * 3] = P.color.r * f; col[(o + i) * 3 + 1] = P.color.g * f; col[(o + i) * 3 + 2] = P.color.b * f; }
      o += k; g.dispose();
    }
    const out = new THREE.BufferGeometry(); out.setAttribute('position', new THREE.BufferAttribute(pos, 3)); out.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); out.setAttribute('color', new THREE.BufferAttribute(col, 3)); out.setAttribute('aLk', new THREE.BufferAttribute(lk, 4)); out.computeBoundingSphere();
    return out;
  }
  // mảng tường lớn (render/look3d.js lớp 3 vẽ chân tường, gờ mái, trụ góc, cửa sổ, cửa ra vào lên đó): mảnh là hộp đứng thẳng,
  // cao từ WALL_H, mặt bên rộng từ WALL_W, dày từ WALL_D (tường rào, thành mỏng không tính). Ghi cho từng đỉnh của mặt bên:
  // (toạ độ ngang tính từ giữa mặt, độ cao tính từ chân mảnh, bề rộng mặt, chiều cao mảnh); đỉnh khác để 0 (không phải tường).
  // Bề rộng ghi âm: mặt trước (+z của công trình) sát đất, có cửa ra vào. Chiều cao ghi âm: mặt đã có mảnh nhỏ dựng sẵn áp lên
  // (cửa, ô cửa sổ, biển, ban công của chính công trình đó): không vẽ thêm cửa lên nữa.
  const WALL_H = 1.5, WALL_W = 1.8, WALL_D = 1.4, DOOR_W = 2.2, NEAR = 0.35;
  function wallDim(P) {
    const geo = P.geo; if (!P.ao || geo.type !== 'BoxGeometry' || geo.userData.noWall) return null;
    const e = P.m.elements, sx = Math.hypot(e[0], e[1], e[2]), sy = Math.hypot(e[4], e[5], e[6]), sz = Math.hypot(e[8], e[9], e[10]);
    if (e[5] / sy < 0.995) return null; // nghiêng: không phải tường
    if (!geo.boundingBox) geo.computeBoundingBox();
    const b = geo.boundingBox, w = (b.max.x - b.min.x) * sx, h = (b.max.y - b.min.y) * sy, d = (b.max.z - b.min.z) * sz;
    if (h < WALL_H || Math.max(w, d) < WALL_W || Math.min(w, d) < WALL_D) return null;
    return { b, w, h, d, sx, sy, sz, e };
  }
  // tâm các mảnh không phải tường của cả công trình (tính một lần cho mỗi lần gộp, chỉ khi công trình có mảng tường)
  function details(all) {
    if (all.cen) return all.cen;
    const THREE = T(), out = [];
    for (const Q of all) { if (wallDim(Q)) continue; if (!Q.geo.boundingBox) Q.geo.computeBoundingBox(); out.push(Q.geo.boundingBox.getCenter(new THREE.Vector3()).applyMatrix4(Q.m)); }
    return (all.cen = out);
  }
  function wallMark(P, lk, o, all) {
    const D = wallDim(P); if (!D) return;
    const THREE = T(), geo = P.geo, { b, w, h, d, sx, sy, sz, e } = D, inv = new THREE.Matrix4().copy(P.m).invert(), c = new THREE.Vector3();
    // bốn mặt bên: 0 +x, 1 -x, 2 +z, 3 -z
    const busy = [false, false, false, false], y0 = b.min.y + (0.12 * h) / sy, y1 = b.min.y + (0.92 * h) / sy;
    for (const q of details(all)) {
      c.copy(q).applyMatrix4(inv); if (c.y < y0 || c.y > y1) continue;
      const inX = c.x > b.min.x && c.x < b.max.x, inZ = c.z > b.min.z && c.z < b.max.z;
      if (inZ && Math.abs(c.x - b.max.x) * sx < NEAR) busy[0] = true; if (inZ && Math.abs(c.x - b.min.x) * sx < NEAR) busy[1] = true;
      if (inX && Math.abs(c.z - b.max.z) * sz < NEAR) busy[2] = true; if (inX && Math.abs(c.z - b.min.z) * sz < NEAR) busy[3] = true;
    }
    const low = e[13] + b.min.y * sy < 0.8, front = [e[2] / sx, -e[2] / sx, e[10] / sz, -e[10] / sz]; // thành phần +z của pháp tuyến từng mặt
    const src = geo.index ? geo.toNonIndexed() : geo, p = src.attributes.position, nr = src.attributes.normal, cx = (b.max.x + b.min.x) / 2, cz = (b.max.z + b.min.z) / 2;
    for (let i = 0; i < p.count; i++) {
      const nx = Math.abs(nr.getX(i)), nz = Math.abs(nr.getZ(i)), ny = Math.abs(nr.getY(i)); if (ny > 0.5) continue;
      const alongZ = nx >= nz, fw = alongZ ? d : w; if (fw < WALL_W) continue;
      const side = alongZ ? (nr.getX(i) > 0 ? 0 : 1) : (nr.getZ(i) > 0 ? 2 : 3), door = low && front[side] > 0.7 && fw >= DOOR_W;
      const j = (o + i) * 4; lk[j] = alongZ ? (p.getZ(i) - cz) * sz : (p.getX(i) - cx) * sx; lk[j + 1] = (p.getY(i) - b.min.y) * sy; lk[j + 2] = door ? -fw : fw; lk[j + 3] = busy[side] ? -h : h;
    }
    if (src !== geo) src.dispose();
  }
  let MAT = null, GLOW = null, LIT = null, NEON = null;
  const lookOf = (m) => { const L = (typeof self !== 'undefined' ? self : globalThis).BK.Look3D; return L ? L.hook(m, 'build') : m; }; // chi tiết bề mặt mô hình thu nhỏ (render/look3d.js)
  const mat = () => MAT || (MAT = lookOf(new (T().MeshStandardMaterial)({ vertexColors: true, flatShading: true, roughness: 0.88, metalness: 0.02 })));
  const glowMat = () => GLOW || (GLOW = new (T().MeshBasicMaterial)({ vertexColors: true, transparent: true, opacity: 0.92, depthWrite: false }));
  // đường viền neon của thành phố neon (render/build/neon.js edges): màu theo đỉnh, dịu, không ghi độ sâu
  const neonMat = () => NEON || (NEON = new (T().LineBasicMaterial)({ vertexColors: true, transparent: true, opacity: 0.8, depthWrite: false, fog: false }));
  const litMat = () => LIT || (LIT = new (T().MeshBasicMaterial)({ vertexColors: true, transparent: true, opacity: 0, depthWrite: false }));
  // dựng một công trình thành nhóm: khối chính (đổ bóng) và khối sáng (nếu có)
  Kit.prototype.bake = function (aoH) {
    const THREE = T(), g = new THREE.Group();
    if (this.parts.length) { const m = new THREE.Mesh(merge(this.parts, aoH || 3, this.lit.concat(this.glow)), mat()); m.castShadow = m.receiveShadow = true; g.add(m); g.userData.main = m; g.userData.tris = m.geometry.attributes.position.count / 3; }
    if (this.flat.length) { const m = new THREE.Mesh(merge(this.flat, aoH || 3), mat()); m.receiveShadow = true; g.add(m); g.userData.flat = m; g.userData.tris = (g.userData.tris || 0) + m.geometry.attributes.position.count / 3; }
    if (this.glow.length) { const m = new THREE.Mesh(merge(this.glow, 1), glowMat().clone()); m.renderOrder = 2; g.add(m); g.userData.glow = m; }
    if (this.lit.length) { const m = new THREE.Mesh(merge(this.lit, 1), litMat()); m.renderOrder = 2; g.add(m); g.userData.lit = m; }
    g.userData.subs = {};
    for (const k of this.subs) { const c = k.bake(aoH); c.position.set(...k.pivot); c.name = k.name; g.add(c); g.userData.subs[k.name] = c;
        g.userData.tris = (g.userData.tris || 0) + (c.userData.tris || 0);
        if (c.userData.glow) (g.userData.subGlows || (g.userData.subGlows = [])).push(c.userData.glow); }
    return g;
  };
  function dispose(g) { g.traverse((o) => { if (o.isMesh || o.isLine) o.geometry.dispose(); }); }

  // vật liệu chung (render/build/batch3d.js gộp nhiều công trình dùng lại đúng các vật liệu này)
  const mats = () => ({ main: mat(), glow: glowMat(), lit: litMat(), neon: neonMat() });
  return { box, roof, lathe, post, cone, ball, disc, Kit, dispose, litMat, neonMat, mats };
});
