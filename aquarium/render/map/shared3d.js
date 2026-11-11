(function (root) {
  'use strict';
  const BK = root.BK || (root.BK = {});
  /* Bể Kính · render/map/shared3d.js
   * Phần dùng chung của bản đồ: hình học gốc dùng lại (hộp, trụ, nón, khối nhiều mặt...), bộ gom mảnh Kit (mỗi mảnh một màu,
   * gộp thành một khối tô màu theo đỉnh), vật liệu, màu mặt đất và đá của sáu miền (TSTYLE), số ngẫu nhiên theo đảo.
   * Các tệp khác trong render/map/ nhận đối tượng này (X) và chỉ lấy những gì mình cần.
   * Cần: three.js. */
  const LAND_R = 62, RING = 154, SC = LAND_R / 30; // bán kính đảo, bán kính vòng sáu đảo
  function create(K) {
    const { THREE, hash, C, clamp } = K;
    const TAU = Math.PI * 2;

    /* ---------- Hình học gốc và bộ gom mảnh ---------- */
    const BASE = {};
    const base = (key, make) => BASE[key] || (BASE[key] = make());
    const UBOX = () => base('box', () => { const g = new THREE.BoxGeometry(1, 1, 1); g.translate(0, 0.5, 0); return g; });
    const UCYL = (s) => base('cyl' + s, () => { const g = new THREE.CylinderGeometry(1, 1, 1, s); g.translate(0, 0.5, 0); return g; });
    const UCONE = (s) => base('cone' + s, () => { const g = new THREE.ConeGeometry(1, 1, s); g.translate(0, 0.5, 0); return g; });
    const TCYL = (t, s) => base('tcyl' + t + '_' + s, () => { const g = new THREE.CylinderGeometry(t, 1, 1, s); g.translate(0, 0.5, 0); return g; });
    const DOME = (s) => base('dome' + s, () => new THREE.SphereGeometry(1, s, Math.max(3, s >> 1), 0, TAU, 0, Math.PI / 2));
    const ICO = () => base('ico', () => new THREE.IcosahedronGeometry(1, 0));
    const DOD = () => base('dod', () => new THREE.DodecahedronGeometry(1, 0));
    const OCT = () => base('oct', () => new THREE.OctahedronGeometry(1, 0));
    const GABLE = () => base('gable', () => { const s = new THREE.Shape(); s.moveTo(-0.5, 0); s.lineTo(0.5, 0); s.lineTo(0, 1); s.lineTo(-0.5, 0); const g = new THREE.ExtrudeGeometry(s, { depth: 1, bevelEnabled: false }); g.translate(0, 0, -0.5); g.rotateY(Math.PI / 2); return g; });
    const TORUS = () => base('torus', () => new THREE.TorusGeometry(1, 0.07, 6, 28));
    const VAULT = () => base('vault', () => { const g = new THREE.CylinderGeometry(1, 1, 1, 12, 1, false, 0, Math.PI); g.rotateZ(Math.PI / 2); return g; });
    const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _s = new THREE.Vector3(), _p = new THREE.Vector3(), _c = new THREE.Color();
    function Kit() { this.b = []; this.l = []; this.gl = []; this.gh = []; }
    // một khối: hình gốc, màu, vị trí, tỉ lệ, góc xoay (y, x, z); lit = phần sáng lên về đêm (cửa sổ)
    Kit.prototype.add = function (g0, color, x, y, z, sx, sy, sz, ry, rx, rz, lit) {
      if (this.avoid && y > -0.5 && Math.max(sx || 0, sz || 0) < 2.6 && this.avoid(x, z, Math.max(sx || 0, sz || 0))) return this; // mảnh nhỏ nằm trên đường: bỏ (terrain3d, relief3d)
      const g = g0.index ? g0.toNonIndexed() : g0.clone();
      if (g.attributes.uv) g.deleteAttribute('uv');
      if (g.attributes.uv2) g.deleteAttribute('uv2');
      _e.set(rx || 0, ry || 0, rz || 0, 'YXZ'); _q.setFromEuler(_e); _s.set(sx, sy, sz);
      g.applyMatrix4(_m.compose(_p.set(x, y, z), _q, _s));
      _c.set(color);
      const n = g.attributes.position.count, col = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) { col[i * 3] = _c.r; col[i * 3 + 1] = _c.g; col[i * 3 + 2] = _c.b; }
      g.setAttribute('color', new THREE.BufferAttribute(col, 3));
      (lit === 'glow' ? this.gl : lit === 'ghost' ? this.gh : lit ? this.l : this.b).push(g);
      return this;
    };
    Kit.prototype.box = function (c, x, y, z, w, h, d, ry, lit) { return this.add(UBOX(), c, x, y, z, w, h, d, ry, 0, 0, lit); };
    Kit.prototype.cyl = function (c, x, y, z, r, h, s) { return this.add(UCYL(s || 8), c, x, y, z, r, h, r); };
    Kit.prototype.tcyl = function (c, x, y, z, rb, rt, h, s) { return this.add(TCYL(+(rt / rb).toFixed(2), s || 8), c, x, y, z, rb, h, rb); };
    Kit.prototype.cone = function (c, x, y, z, r, h, s, ry) { return this.add(UCONE(s || 8), c, x, y, z, r, h, r, ry); };
    Kit.prototype.gable = function (c, x, y, z, len, h, dep, ry) { return this.add(GABLE(), c, x, y, z, len, h, dep, ry); };
    Kit.prototype.dome = function (c, x, y, z, r, sy, s) { return this.add(DOME(s || 12), c, x, y, z, r, r * (sy || 1), r); };
    Kit.prototype.blob = function (g, c, x, y, z, r, sy) { return this.add(g, c, x, y, z, r, r * (sy || 1), r, x * 3.1 + z, z * 1.7); };
    Kit.prototype.bake = function () { return { body: this.b.length ? mergeG(this.b) : null, lit: this.l.length ? mergeG(this.l) : null, glow: this.gl.length ? mergeG(this.gl) : null, ghost: this.gh.length ? mergeG(this.gh) : null }; };
    function mergeG(list) {
      let n = 0;
      for (const g of list) n += g.attributes.position.count;
      const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), col = new Float32Array(n * 3);
      let o = 0;
      for (const g of list) { pos.set(g.attributes.position.array, o * 3); if (g.attributes.normal) nor.set(g.attributes.normal.array, o * 3); col.set(g.attributes.color.array, o * 3); o += g.attributes.position.count; g.dispose(); }
      const m = new THREE.BufferGeometry();
      m.setAttribute('position', new THREE.BufferAttribute(pos, 3)); m.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); m.setAttribute('color', new THREE.BufferAttribute(col, 3));
      m.computeBoundingSphere();
      return m;
    }
    const bodyMat = new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.86, metalness: 0.03 });
    const metalMat = new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.35, metalness: 0.55 });
    if (BK.Look3D) { BK.Look3D.hook(bodyMat, 'build'); BK.Look3D.hook(metalMat, 'build'); } // lát cắt mẫu hình ảnh (render/look3d.js)
    const glowMat = new THREE.MeshBasicMaterial({ vertexColors: true });
    const ghostMat = new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.62, blending: THREE.AdditiveBlending, depthWrite: false });
    // thân nhà và cửa sổ chung một khối: cửa sổ đánh dấu bằng thuộc tính aLit, sáng lên theo đèn của đảo (hay của cầu),
    // nên mỗi công trình chỉ tốn một lượt vẽ thay vì hai
    const litMerged = new Map();
    function mergedMat(litMat, metal) {
      const key = litMat.uuid + (metal ? 'm' : 'b');
      let m = litMerged.get(key);
      if (m) return m;
      m = new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: metal ? 0.35 : 0.8, metalness: metal ? 0.55 : 0.03 });
      const uLitC = { get value() { return litMat.emissive; } }, uLitI = { get value() { return litMat.emissiveIntensity; } };
      m.onBeforeCompile = (sh) => {
        sh.uniforms.uLitC = uLitC; sh.uniforms.uLitI = uLitI;
        sh.vertexShader = 'attribute float aLit;\nvarying float vLit;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvLit = aLit;');
        sh.fragmentShader = 'uniform vec3 uLitC;\nuniform float uLitI;\nvarying float vLit;\n' + sh.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += uLitC * uLitI * vLit;');
      };
      m.customProgramCacheKey = () => 'bodyLit' + (metal ? 'm' : 'b');
      if (BK.Look3D) BK.Look3D.hook(m, 'build');
      litMerged.set(key, m);
      return m;
    }
    function joinLit(body, lit) {
      const nb = body ? body.attributes.position.count : 0, flag = new Float32Array(nb + lit.attributes.position.count);
      flag.fill(1, nb);
      const g = body ? mergeG([body, lit]) : lit;
      g.setAttribute('aLit', new THREE.BufferAttribute(flag, 1));
      return g;
    }
    function meshOf(kit, litMat, parent, x, z, ry, metal) {
      let { body, lit, glow, ghost } = kit.bake();
      const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry || 0;
      let top = 0.5;
      if (body) { body.computeBoundingBox(); top = body.boundingBox.max.y; }
      if (lit && litMat) { body = joinLit(body, lit); lit = null; }
      if (body) { const m = new THREE.Mesh(body, body.attributes.aLit ? mergedMat(litMat, metal) : metal ? metalMat : bodyMat); m.castShadow = true; m.receiveShadow = true; g.add(m); }
      if (lit) { const l = new THREE.Mesh(lit, bodyMat); l.castShadow = false; g.add(l); }
      if (glow) { const l = new THREE.Mesh(glow, glowMat); g.add(l); glow.computeBoundingBox(); top = Math.max(top, glow.boundingBox.max.y); }
      if (ghost) { const l = new THREE.Mesh(ghost, ghostMat); l.renderOrder = 3; g.add(l); ghost.computeBoundingBox(); top = Math.max(top, ghost.boundingBox.max.y); }
      g.userData.top = top;
      parent.add(g);
      return g;
    }
    function disposeGroup(g) { g.traverse((o) => { if (o.isMesh && o.geometry && !Object.values(BASE).includes(o.geometry)) o.geometry.dispose(); }); }

    const SPHG = () => base('sphg', () => new THREE.SphereGeometry(1, 10, 6, 0, TAU, 0, Math.PI / 2));

    /* ---------- Màu mặt đất, đá của sáu miền; số ngẫu nhiên theo đảo ---------- */
    const pick = (arr, v) => arr[Math.floor(Math.abs(v) * arr.length) % arr.length];
    const TSTYLE = {
      plains: { ground: '#86bb63', rock: ['#8a6a4c', '#7b5d45', '#6d6359', '#5b5248', '#4b4741'], season: true },
      forest: { ground: '#5f9a4f', rock: ['#6e5a44', '#5f4e3d', '#585048', '#4a443e', '#3f3b37'], season: true },
      mountain: { ground: '#8fa274', rock: ['#8b8577', '#7c776b', '#6d695f', '#5f5b53', '#504d47'], season: true },
      tundra: { ground: '#e6edf1', rock: ['#9aa4ad', '#8a949d', '#7b858e', '#6c757e', '#5d666f'], season: false },
      coast: { ground: '#9ccb72', rock: ['#a08a6a', '#8f7a5e', '#7d6b54', '#6c5d4a', '#5b4f40'], season: true },
      desert: { ground: '#e3c58e', rock: ['#c98a5a', '#b87b4f', '#a56d46', '#8f5f3e', '#7a5236'], season: false },
    };
    function landRng(i) { let s = 977 + i * 131; return () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; }


    return { THREE, TAU, C, clamp, hash, LAND_R, RING, SC, BASE, UBOX, UCYL, UCONE, TCYL, DOME, ICO, DOD, OCT, GABLE, TORUS, VAULT, SPHG, Kit, mergeG, bodyMat, metalMat, glowMat, ghostMat, meshOf, disposeGroup, pick, TSTYLE, landRng };
  }
  BK.MapShared = { create, LAND_R, RING, SC };
})(typeof self !== 'undefined' ? self : globalThis);
