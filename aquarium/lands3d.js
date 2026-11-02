/* Bể Kính — sáu miền đất.
 * Địa hình của sáu miền, công trình đổi kiểu theo sáu thời đại, sáu cây cầu nối thành vòng,
 * cư dân đi làm, đoàn hàng qua cầu. index.html gọi syncDay() sau mỗi ngày và animate() mỗi khung hình.
 * Mỗi công trình được gộp thành một khối hình học tô màu theo đỉnh để cả sáu thành phố vẫn nhẹ. */
(function (root) {
  'use strict';
  // đảo rộng hơn để có chỗ cho bãi săn và bãi tập kết quân; SC đổi các khoảng cách cũ (đảo bán kính 30) sang đảo mới
  const LAND_R = 38, RING = 100, SC = LAND_R / 30;

  function create(K) {
    const { THREE, scene, Sim, W, hash, C, clamp, lerp, reduce, glowTex, puff, clickable, unclickable } = K;
    const TAU = Math.PI * 2;

    /* =============== Hình học gộp =============== */
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
    const glowMat = new THREE.MeshBasicMaterial({ vertexColors: true });
    const ghostMat = new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.62, blending: THREE.AdditiveBlending, depthWrite: false });
    // BEY: thời đại thật của công trình đang dựng; từ thời 9 trở đi công trình robot được biến hình theo bốn thời vượt người
    let BEY = 0, BEYSEED = 1;
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
      if (BEY >= 8) beyondKit(kit, BEY, BEYSEED++);
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
    // Bốn thời vượt tầm hiểu biết, làm trên chính hình khối của công trình:
    // 8 vật chất sống (trắng ngọc, tinh thể mọc), 9 mặt trời nhân tạo (các tầng tách ra lơ lửng giữa vòng năng lượng),
    // 10 bẻ cong không gian (xoắn theo chiều cao, cổng tròn), 11 siêu việt (hoá thành ánh sáng)
    function landRngB(i) { let s = 977 + i * 131; return () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; }
    function recolorG(g, col, t) {
      const c = g.attributes.color, tc = new THREE.Color(col), tmp = new THREE.Color();
      for (let i = 0; i < c.count; i++) { tmp.setRGB(c.getX(i), c.getY(i), c.getZ(i)).lerp(tc, t); c.setXYZ(i, tmp.r, tmp.g, tmp.b); }
    }
    function beyondKit(k, e, seed) {
      const rnd = landRngB(seed * 7 + e), all = [...k.b, ...k.l];
      let H = 0.6, rx = 0.8;
      for (const g of all) { g.computeBoundingBox(); const bb = g.boundingBox; H = Math.max(H, bb.max.y); rx = Math.max(rx, Math.abs(bb.min.x), Math.abs(bb.max.x), Math.abs(bb.min.z), Math.abs(bb.max.z)); }
      rx = Math.min(rx, 3.2);
      if (e === 8) {
        for (const g of k.b) recolorG(g, '#eef3f7', 0.78);
        for (const g of k.l) recolorG(g, '#bff6ff', 0.5);
        for (let i = 0, n = 2 + Math.floor(H / 2.5); i < n; i++) k.add(ICO(), i % 2 ? '#dff6ff' : '#9fefff', (rnd() - 0.5) * rx * 1.4, H * (0.25 + rnd() * 0.75), (rnd() - 0.5) * rx * 1.4, 0.18 + rnd() * 0.3, 0.3 + rnd() * 0.5, 0.18 + rnd() * 0.3, rnd() * 3, 0, 0, i % 3 === 0 ? 'glow' : false);
        k.add(TORUS(), '#7ff0ff', 0, Math.min(H * 0.5, 2.5), 0, rx * 0.9, rx * 0.9, rx * 0.9, 0, Math.PI / 2, 0, 'glow');
      } else if (e === 9) {
        for (const g of all) { const y0 = g.boundingBox.min.y, lift = y0 > H * 0.62 ? 2.2 : y0 > H * 0.3 ? 1.1 : 0; if (lift) g.translate(0, lift, 0); }
        for (const g of k.b) recolorG(g, '#fff3e0', 0.4);
        if (H > 1.5) for (const [y, r] of [[H * 0.3 + 0.55, rx * 1.05], [H * 0.62 + 1.65, rx * 0.85]]) k.add(TORUS(), '#ffb347', 0, y, 0, r, r, r * 2.4, 0, Math.PI / 2, 0, 'glow');
        k.add(ICO(), '#ffe9a8', 0, H + 2.9, 0, 0.32, 0.32, 0.32, 0, 0, 0, 'glow');
      } else if (e === 10) {
        for (const g of all) {
          const p = g.attributes.position;
          for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), a = (y / Math.max(1.5, H)) * 1.05, ca = Math.cos(a), sa = Math.sin(a); p.setXYZ(i, x * ca + z * sa, y, -x * sa + z * ca); }
          g.computeVertexNormals();
        }
        for (const g of k.b) recolorG(g, '#c9b6ff', 0.42);
        // bóng vọng: một bản mờ của chính nó lệch sang bên
        const echo = k.b.filter(() => rnd() < 0.35).map((g) => { const c = g.clone(); c.translate(rx * 0.7, 0.35, 0); recolorG(c, '#b48cff', 0.5); return c; });
        for (const c of echo) k.gh.push(c);
        k.add(TORUS(), '#b48cff', 0, Math.max(1.4, H * 0.45), rx + 0.8, 1.1, 1.1, 3.2, 0, 0, 0, 'glow');
      } else {
        for (const g of k.b) { recolorG(g, '#fff6dc', 0.62); k.gh.push(g); }
        k.b = [];
        for (const g of k.l) recolorG(g, '#fff3c4', 0.6);
        for (let i = 0; i < 5; i++) k.add(ICO(), '#fff3c4', (rnd() - 0.5) * rx * 2.2, rnd() * (H + 2.5), (rnd() - 0.5) * rx * 2.2, 0.12, 0.12, 0.12, 0, 0, 0, 'glow');
      }
    }
    function disposeGroup(g) { g.traverse((o) => { if (o.isMesh && o.geometry && !Object.values(BASE).includes(o.geometry)) o.geometry.dispose(); }); }

    /* =============== Bảng màu =============== */
    const PAL = {
      e3walls: ['#f3e6cf', '#efe0d6', '#e6efe4', '#f1e9d2', '#e9e1f0', '#f4ddc9'],
      e3roofs: ['#3d8b8b', '#7a4e7e', '#d9734e', '#d4a537', '#4f5d75', '#a14a4a', '#5b8c5a'],
      bricks: ['#a5543f', '#93473a', '#b0634a', '#8c5a44'],
      concrete: ['#dfe3e7', '#cfd6dd', '#e8e2d8', '#d6d0c4', '#e3dccf'],
      thatch: ['#c9a45c', '#b8934f', '#d1ae66'],
      mud: ['#d9b98a', '#d2ad7c', '#c99f6c'],
      plaster: ['#f1ead8', '#ede3cf', '#f4eee2'],
      tiles: ['#9b4a35', '#8e4a36', '#a8573e', '#7d4a3c', '#6f5a4a'],
      glass: ['#9fc3d8', '#8fb3cc', '#a9cbd6', '#b3c4d4'],
      win: '#41506a',
    };
    const pick = (arr, v) => arr[Math.floor(Math.abs(v) * arr.length) % arr.length];
    const ROAD = ['#b0916a', '#c4a87c', '#b8ad99', '#d3c6ad', '#9a948a', '#55585e', '#3a3d42', '#23262b', '#dfe7ee', '#e8d8c0', '#b9a8e8', '#fff3d6'];
    const PLAZA_C = ['#b08f66', '#d9c9a3', '#bcb3a3', '#cbbd9f', '#b9b2a6', '#e4e6e8', '#eef1f4', '#f4f6f8', '#eef3f7', '#f6ead8', '#d9cff2', '#fff6e0'];
    // màu đèn đường mỗi thời vượt người: lam ngọc, hổ phách, tím, trắng ấm
    const BEY_LAMP = ['#7ff0ff', '#7ff0ff', '#ffb347', '#b48cff', '#fff3c4'];

    /* =============== Công trình theo thời đại =============== */
    // Nhà ở: mỗi lô bốn gia đình. lv 1..3 là mức giàu, thêm tầng.
    function buildHouse(k, e, ter, v, lv) {
      const v2 = (v * 7.31) % 1, v3 = (v * 13.7) % 1;
      if (e === 0) {
        if (ter === 'tundra' && v < 0.6) { k.dome('#eef4f8', 0, 0, 0, 1.3, 0.85, 10); k.add(UCYL(8), '#e3ebf0', 0, 0, 1.0, 0.42, 0.7, 0.5, 0, Math.PI / 2); k.box('#2b3340', 0, 0, 1.68, 0.4, 0.42, 0.04); return; }
        if (ter === 'coast') {
          for (const [x, z] of [[-0.8, -0.8], [0.8, -0.8], [-0.8, 0.8], [0.8, 0.8]]) k.cyl('#7a5a3a', x, 0, z, 0.08, 1.0, 5);
          k.box('#8f6a46', 0, 0.95, 0, 2.0, 0.12, 2.0); k.box(pick(PAL.mud, v), 0, 1.07, 0, 1.7, 0.95, 1.6);
          k.gable(pick(PAL.thatch, v2), 0, 2.0, 0, 2.2, 1.1, 2.1); k.box('#3b2a1d', 0, 1.07, 0.81, 0.45, 0.65, 0.04); return;
        }
        if (ter === 'desert') { k.cyl(pick(PAL.mud, v), 0, 0, 0, 1.1, 0.95, 10); k.dome(pick(PAL.mud, v2), 0, 0.95, 0, 1.1, 0.7, 10); k.box('#3b2a1d', 0, 0, 1.05, 0.42, 0.7, 0.08); return; }
        if (ter === 'forest' || ter === 'tundra' || v < 0.35) { // lều da có cọc chống
          const c = ter === 'tundra' ? '#cdb592' : pick(['#c9b08c', '#b99a74', '#d2bb94'], v2);
          k.cone(c, 0, 0, 0, 1.25, 2.5, 9); k.cone('#6d5139', 0, 2.2, 0, 0.32, 0.65, 5);
          k.add(UCYL(9), '#8a5a3a', 0, 0.55, 0, 1.05, 0.12, 1.05);
          k.box('#3b2a1d', 0, 0, 1.06, 0.4, 0.62, 0.05, 0); return;
        }
        k.cyl(pick(['#9c7a52', '#8f6f4a'], v), 0, 0, 0, 1.0, 0.85, 9); k.cone(pick(PAL.thatch, v2), 0, 0.85, 0, 1.45, 1.6, 9);
        k.box('#3b2a1d', 0, 0, 0.98, 0.42, 0.62, 0.06); return;
      }
      if (e === 1) {
        const wall = ter === 'mountain' || ter === 'tundra' ? pick(['#b8b2a4', '#a9a294', '#c2baa8'], v) : ter === 'forest' ? pick(['#8a6440', '#7d5a3a'], v) : ter === 'coast' ? pick(['#efe9dc', '#e8e0cc'], v) : pick(PAL.mud, v);
        k.box(wall, 0, 0, 0, 2.2, 1.5, 2.2); k.box('#a07d55', 0, 1.5, 0, 2.38, 0.14, 2.38);
        for (const sx of [-1, 1]) k.box(wall, sx * 1.12, 1.64, 0, 0.14, 0.25, 2.3);
        k.box(PAL.win, -0.5, 0.75, 1.11, 0.36, 0.42, 0.04, 0, true); k.box(PAL.win, 0.55, 0.75, 1.11, 0.36, 0.42, 0.04, 0, true);
        k.box('#4a3426', 0, 0, 1.12, 0.48, 0.92, 0.05);
        if (lv >= 2) { k.box(wall, -0.35, 1.64, -0.3, 1.4, 1.05, 1.4); k.box('#a07d55', -0.35, 2.69, -0.3, 1.52, 0.12, 1.52); k.box(PAL.win, -0.35, 2.05, 0.41, 0.34, 0.38, 0.04, 0, true); }
        if (ter === 'tundra') k.box('#f4f8fb', 0, 1.64, 0, 2.3, 0.08, 2.3);
        if (lv >= 3) k.box(pick(['#c85a3a', '#3d7a8b', '#d4a537'], v3), 0.6, 1.64, 0.6, 0.9, 0.06, 0.9); // tấm vải che nắng trên sân thượng
        return;
      }
      if (e === 2) {
        const roof = ter === 'forest' || ter === 'coast' ? pick(PAL.thatch, v) : ter === 'tundra' ? '#5f6b62' : pick(PAL.tiles, v);
        k.box(pick(['#cfc5b3', '#c4baa6', '#d6cdbb'], v2), 0, 0, 0, 2.3, 1.3, 2.3);
        k.box(PAL.win, -0.55, 0.55, 1.16, 0.36, 0.44, 0.04, 0, true); k.box('#4a3426', 0.45, 0, 1.16, 0.46, 0.9, 0.04);
        let y = 1.3;
        for (let f = 1; f < Math.min(3, lv + 1); f++) {
          const plaster = pick(PAL.plaster, v3 + f * 0.3);
          k.box(plaster, 0, y, 0, 2.5, 1.2, 2.5);
          for (const sx of [-1.18, -0.4, 0.4, 1.18]) k.box('#5a4030', sx, y, 1.26, 0.1, 1.2, 0.04);
          k.box('#5a4030', 0, y + 1.1, 1.26, 2.5, 0.1, 0.04); k.box('#5a4030', 0, y, 1.26, 2.5, 0.08, 0.04);
          k.box(PAL.win, -0.8, y + 0.4, 1.27, 0.34, 0.42, 0.04, 0, true); k.box(PAL.win, 0.8, y + 0.4, 1.27, 0.34, 0.42, 0.04, 0, true);
          y += 1.2;
        }
        k.gable(roof, 0, y, 0, 2.8, 1.75, 2.9);
        k.box('#7a6a5a', 0.75, y + 0.4, -0.5, 0.34, 1.4, 0.34);
        if (ter === 'tundra') k.gable('#f4f8fb', 0, y + 1.35, 0, 2.82, 0.42, 0.72);
        return;
      }
      if (e >= 3 && (ter !== 'plains' || e >= 6)) return houseStyled(k, e, ter, v, lv);
      if (e === 3) {
        const wall = pick(PAL.e3walls, v), roof = pick(PAL.e3roofs, v2);
        k.box('#a99c88', 0, 0, 0, 2.9, 0.35, 2.9);
        let y = 0.35;
        for (let f = 0; f < 1 + lv; f++) {
          const w = 2.3 - f * 0.12;
          k.box(wall, 0, y, 0, w, 1.45, w);
          k.box(PAL.win, -0.5, y + 0.5, w / 2 + 0.02, 0.42, 0.55, 0.06, 0, true); k.box(PAL.win, 0.5, y + 0.5, w / 2 + 0.02, 0.42, 0.55, 0.06, 0, true);
          k.box(PAL.win, w / 2 + 0.02, y + 0.5, 0, 0.06, 0.55, 0.42, 0, true);
          if (f) k.box('#c9b99c', 0, y - 0.05, 0, w + 0.2, 0.1, w + 0.2);
          y += 1.45;
        }
        k.box('#6d4c35', 0, 0.35, 1.17, 0.55, 0.95, 0.06);
        if (v3 > 0.6) { k.cone(roof, 0, y, 0, 1.75, 3.0, 8); k.cone(roof, 0, y + 2.9, 0, 0.2, 0.6, 6); }
        else k.add(UCONE(4), roof, 0, y, 0, 2.05, 1.9, 2.05, Math.PI / 4);
        k.box('#8a6f5c', 0.7, y + 0.1, -0.5, 0.38, 1.3, 0.38);
        if (ter === 'tundra') k.add(UCONE(4), '#f4f8fb', 0, y + 1.05, 0, 1.0, 0.85, 1.0, Math.PI / 4);
        return;
      }
      if (e === 4) {
        const brick = pick(PAL.bricks, v), floors = 2 + lv;
        k.box(brick, 0, 0, 0, 2.5, 1.35 * floors, 2.5);
        for (let f = 0; f < floors; f++) {
          const y = 0.35 + f * 1.35;
          for (const sx of [-0.62, 0, 0.62]) { k.box('#e9e2d4', sx, y - 0.06, 1.26, 0.42, 0.68, 0.04); k.box(PAL.win, sx, y, 1.28, 0.32, 0.56, 0.04, 0, true); }
          k.box('#e9e2d4', 0, y + 0.82, 1.27, 2.5, 0.08, 0.04);
        }
        const top = 1.35 * floors;
        k.gable('#4b4f57', 0, top, 0, 2.6, 1.1, 2.6);
        k.box('#7a3a2e', -0.8, top, -0.4, 0.34, 1.6, 0.34); k.box('#7a3a2e', 0.8, top, -0.4, 0.34, 1.6, 0.34);
        k.box('#5a5048', 0, 0, 1.3, 0.9, 0.18, 0.5);
        return;
      }
      // Hiện đại: chung cư và tháp kính
      const floors = 3 + lv * 2 + Math.floor(v * 3), c = pick(PAL.concrete, v), gl = pick(PAL.glass, v2), H = floors * 1.05;
      k.box(c, 0, 0, 0, 2.3, H, 2.3);
      for (let f = 0; f < floors; f++) {
        const y = 0.3 + f * 1.05;
        k.box(gl, 0, y, 1.16, 2.0, 0.6, 0.04, 0, true); k.box(gl, 1.16, y, 0, 0.04, 0.6, 2.0, 0, true); k.box(gl, -1.16, y, 0, 0.04, 0.6, 2.0, 0, true); k.box(gl, 0, y, -1.16, 2.0, 0.6, 0.04, 0, true);
      }
      if (v3 < 0.35) { k.box('#5e8d4e', 0, H, 0, 1.9, 0.25, 1.9); k.blob(ICO(), '#6aa85a', 0.4, H + 0.5, 0.3, 0.45); }
      else if (v3 < 0.7) { for (const sx of [-0.5, 0.5]) k.add(UBOX(), '#2c3e66', sx, H + 0.1, 0, 0.8, 0.05, 1.6, 0, 0, 0.3); }
      else { k.cyl('#9aa3ad', 0.4, H, 0.3, 0.38, 0.9, 8); k.cone('#7d8792', 0.4, H + 0.9, 0.3, 0.42, 0.35, 8); }
    }

    const tint = (hex, a) => { const c = new THREE.Color(hex), h = {}; c.getHSL(h); c.setHSL(h.h, h.s, clamp(h.l + a, 0, 1)); return '#' + c.getHexString(); };
    // Nhà từ thời cận đại theo phong cách từng miền: rừng nhà khung gỗ, núi nhà đá chân gỗ trên, băng nguyên mái củ hành,
    // biển nhà trắng cửa xanh, sa mạc nhà mái bằng có tháp đón gió; rồi gạch, sắt, kính theo cách riêng của mỗi nơi
    function houseStyled(k, e, ter, v, lv) {
      const S = STY[ter][e], v2 = (v * 7.31) % 1, wall = tint(S.wall, (v - 0.5) * 0.14);
      const win = (x, y, z, w2, h2, side) => side ? k.box(PAL.win, x, y, z, 0.06, h2, w2, 0, true) : k.box(PAL.win, x, y, z, w2, h2, 0.06, 0, true);
      if (e === 3) {
        k.box(S.base, 0, 0, 0, 2.9, 0.3, 2.9);
        let y = 0.3;
        const floors = 1 + lv;
        for (let f = 0; f < floors; f++) {
          const w = 2.3 - f * 0.1, fw = ter === 'mountain' && f > 0 ? tint('#7a5a3a', (v - 0.5) * 0.1) : ter === 'forest' ? '#efe6d2' : ter === 'coast' ? '#fbfaf6' : wall;
          k.box(fw, 0, y, 0, w, 1.45, w);
          if (ter === 'forest') { for (const sx of [-w / 2 + 0.06, -0.38, 0.38, w / 2 - 0.06]) k.box(S.wall2, sx, y, w / 2 + 0.01, 0.1, 1.45, 0.04); k.box(S.wall2, 0, y + 0.7, w / 2 + 0.01, w, 0.08, 0.04); k.add(UBOX(), S.wall2, -0.75, y + 0.05, w / 2 + 0.02, 0.07, 1.5, 0.03, 0, 0, 0.55); }
          if (ter === 'coast') for (const sx of [-0.5, 0.5]) for (const d of [-0.27, 0.27]) k.box(S.trim, sx + d, y + 0.5, w / 2 + 0.03, 0.1, 0.56, 0.03);
          if (ter === 'mountain' && f > 0) { k.box('#5f4630', 0, y - 0.04, w / 2 + 0.32, w * 0.8, 0.08, 0.6); for (let r = 0; r < 5; r++) k.box('#5f4630', -w * 0.38 + r * w * 0.19, y, w / 2 + 0.6, 0.05, 0.4, 0.05); }
          if (ter === 'tundra') k.box(S.trim, 0, y + 1.3, w / 2 + 0.02, w, 0.1, 0.04);
          win(-0.5, y + 0.5, w / 2 + 0.03, 0.4, 0.55); win(0.5, y + 0.5, w / 2 + 0.03, 0.4, 0.55); win(w / 2 + 0.03, y + 0.5, 0, 0.4, 0.55, true);
          y += 1.45;
        }
        k.box(ter === 'coast' ? S.trim : '#5a4030', 0, 0.3, 1.16, 0.5, 0.95, 0.06);
        if (ter === 'forest') k.gable(S.roof, 0, y, 0, 2.6, 2.1, 2.7);
        else if (ter === 'mountain') { k.gable(S.roof, 0, y, 0, 3.1, 1.25, 3.2); k.box('#efe6d2', 0, y + 0.3, 1.2, 0.5, 0.4, 0.05); }
        else if (ter === 'tundra') { k.gable(S.roof, 0, y, 0, 2.5, 1.5, 2.6); if (v2 > 0.45) { k.cyl(S.wall2, 0, y + 0.9, 0, 0.42, 0.6, 8); k.add(SPHG(), S.roof, 0, y + 1.5, 0, 0.5, 0.65, 0.5); k.add(DOME(8), S.roof, 0, y + 1.5, 0, 0.5, -0.18, 0.5); k.cone(S.trim, 0, y + 2.1, 0, 0.12, 0.5, 6); } k.gable('#f4f8fb', 0, y + 1.1, 0, 2.52, 0.4, 0.7); }
        else if (ter === 'coast') { k.box('#ffffff', 0, y, 0, 2.3, 0.18, 2.3); if (v2 > 0.55) k.dome(S.roof, 0.4, y + 0.15, -0.3, 0.65, 1, 10); else k.box('#e8e4da', -0.5, y + 0.18, -0.5, 1.0, 0.9, 1.0); }
        else { k.box(S.trim, 0, y, 0, 2.35, 0.16, 2.35); for (const sx of [-1, 1]) k.box(wall, sx * 1.12, y + 0.16, 0, 0.12, 0.3, 2.3); k.box(wall, 0.6, y, -0.6, 0.6, 1.5, 0.6); for (const sx of [-1, 1]) k.box('#3a2a1e', 0.6 + sx * 0.31, y + 1.0, -0.6, 0.04, 0.4, 0.34); k.add(VAULT(), '#3a2a1e', 0, 0.3, 1.16, 0.28, 0.3, 0.06, 0, Math.PI / 2, 0); }
        if (ter === 'forest' || ter === 'mountain') k.box('#7a6a5a', 0.7, y + 0.2, -0.5, 0.34, 1.4, 0.34);
        return;
      }
      if (e === 4) {
        const floors = 2 + lv, top = 0.2 + 1.3 * floors;
        k.box(S.base, 0, 0, 0, 2.7, 0.2, 2.7);
        k.box(wall, 0, 0.2, 0, 2.4, 1.3 * floors, 2.4);
        for (let f = 0; f < floors; f++) { const y = 0.6 + f * 1.3; for (const sx of [-0.6, 0.6]) { k.box(S.trim, sx, y - 0.06, 1.21, 0.5, 0.66, 0.03); win(sx, y, 1.23, 0.36, 0.52); } win(1.23, y, 0, 0.5, 0.52, true); }
        if (ter === 'tundra') { for (let r = 0; r < 9; r++) k.box(S.wall2, -1.1 + r * 0.275, 0.2, 1.21, 0.05, 1.3 * floors, 0.03); k.add(VAULT(), S.roof, 0, top, 0, 1.25, 1.2, 1.25); k.cyl('#c8ced4', 1.0, 0, -1.3, 0.16, top + 0.6, 8); }
        else if (ter === 'forest') { k.gable(S.roof, 0, top, 0, 2.6, 1.3, 2.6); k.cyl('#3f4650', 0.7, top, -0.5, 0.1, 1.6, 6); k.box('#5f4630', 0, 0.2, 1.5, 2.2, 0.12, 0.7); for (const sx of [-1, 1]) k.cyl('#5f4630', sx, 0.2, 1.8, 0.06, 1.1, 5); }
        else if (ter === 'coast') { k.gable(S.roof, 0, top, 0, 2.6, 1.4, 2.6); k.box(wall, 0, top + 0.1, 0.9, 0.8, 0.8, 0.6); k.gable(S.roof, 0, top + 0.9, 0.9, 1.0, 0.45, 0.7); win(0, top + 0.4, 1.21, 0.36, 0.4); }
        else if (ter === 'mountain') { k.box(S.wall2, 0, top, 0, 2.5, 0.16, 2.5); k.cyl('#6d695f', 0.6, top + 0.16, -0.5, 0.45, 0.9, 10); k.box(S.trim, 0, 0.2 + 1.3 * floors - 0.12, 0, 2.44, 0.12, 2.44); }
        else { k.box(S.trim, 0, top, 0, 2.5, 0.14, 2.5); for (let f = 1; f < floors; f++) { k.box('#2f3540', 0, 0.2 + f * 1.3, 1.45, 1.6, 0.06, 0.5); k.box('#2f3540', 0, 0.2 + f * 1.3 + 0.3, 1.68, 1.6, 0.04, 0.04); } k.add(UBOX(), pick(['#c0392b', '#3f7fd6', '#e0b23a'], v2), 0, 1.05, 1.4, 1.4, 0.05, 0.6, 0, -0.3, 0); }
        return;
      }
      const floors = 3 + lv * 2 + Math.floor(v * 3) + (e - 5) * 2, H = floors * 1.05;
      if (ter === 'tundra' || ter === 'coast') {
        const sx = ter === 'coast' ? 1.25 : 1.1, sz = ter === 'coast' ? 0.9 : 1.1;
        k.add(UCYL(14), wall, 0, 0, 0, sx, H, sz);
        for (let f = 0; f < floors; f++) k.add(UCYL(14), pick(PAL.glass, v2), 0, 0.3 + f * 1.05, 0, sx + 0.02, 0.55, sz + 0.02, 0, 0, 0, true);
        if (ter === 'tundra') k.add(ICO(), S.roof, 0, H, 0, 1.15, 0.85, 1.15);
        else k.add(VAULT(), '#ffffff', 0, H, 0, 0.9, 1.6, 0.35, 0, 0.5, 0);
      } else if (ter === 'mountain') {
        let y = 0;
        for (let f = 0; f < floors; f += 2) { const off = ((f / 2) % 2 ? 0.35 : -0.35); k.box(tint(S.wall, ((f / 2) % 2) * 0.05), off, y, 0, 2.4, 2.1, 2.3); for (const sx of [-0.7, 0, 0.7]) win(off + sx, y + 0.8, 1.17, 0.18, 1.0); y += 2.1; }
        k.box(S.roof, 0, y, 0, 2.9, 0.4, 2.8); k.box(S.trim, 0.9, y + 0.4, 0.8, 0.3, 0.5, 0.3);
      } else {
        k.box(wall, 0, 0, 0, 2.3, H, 2.3);
        for (let f = 0; f < floors; f++) { const y = 0.3 + f * 1.05; k.box(pick(PAL.glass, v2), 0, y, 1.16, 2.0, 0.6, 0.04, 0, true); k.box(pick(PAL.glass, v2), 1.16, y, 0, 0.04, 0.6, 2.0, 0, true); k.box(pick(PAL.glass, v2), -1.16, y, 0, 0.04, 0.6, 2.0, 0, true); }
        if (ter === 'forest') { for (let f = 1; f < floors; f += 2) { k.box('#5f9f4a', 0, f * 1.05, 1.35, 2.3, 0.18, 0.5); k.blob(ICO(), '#6aa85a', -0.7 + (f % 3) * 0.6, f * 1.05 + 0.4, 1.4, 0.32); } k.box('#5f9f4a', 0, H, 0, 2.1, 0.22, 2.1); k.cone('#4f8f45', 0.5, H + 0.2, 0.3, 0.45, 1.1, 6); }
        else if (ter === 'plains') { for (let f = 2; f < floors; f += 3) k.box(S.wall2, 0, f * 1.05, 1.28, 2.5, 0.12, 0.3); k.box(S.roof, 0, H, 0, 2.2, 0.2, 2.2); }
        else { for (let r = 0; r < 7; r++) k.box(S.wall2, -1.0 + r * 0.333, 0, 1.2, 0.07, H, 0.07); for (let i = 0; i < 2; i++) k.add(UBOX(), '#24345a', -0.5 + i, H + 0.15, 0, 0.9, 0.05, 1.8, 0, 0.35, 0); }
      }
      // thời tên lửa: cột ăng-ten, chảo vệ tinh, đèn báo máy bay; thời robot: viền sáng, vòng lơ lửng, bãi đỗ máy bay không người lái
      if (e === 6) { k.cyl('#c9d1d9', 0.6, H, -0.6, 0.05, 2.4, 5); k.add(SPHG(), '#f4f4f4', -0.5, H + 0.35, 0.4, 0.45, 0.18, 0.45, 0, -0.6, 0); k.box('#ff5a4f', 0.6, H + 2.4, -0.6, 0.14, 0.14, 0.14, 0, true); }
      if (e === 7) {
        for (const [x, z] of [[-1.17, 1.17], [1.17, 1.17], [-1.17, -1.17], [1.17, -1.17]]) k.box('#7ff0ff', x, 0.3, z, 0.06, H - 0.3, 0.06, 0, true);
        k.add(TORUS(), S.wall2, 0, H + 0.9, 0, 1.5, 1.5, 1.5, 0, Math.PI / 2, 0, true);
        k.cyl('#3a3f48', 0, H, 0, 0.7, 0.12, 12); k.box('#7ff0ff', 0, H + 0.13, 0, 0.5, 0.02, 0.08, 0, true);
      }
    }

    // Ruộng, nơi làm ra lương thực. Lô rộng; phần quay (cối xay, tuabin) trả về riêng để quay theo độ bận rộn.
    function buildFarm(k, e, ter, v) {
      if (e >= 6) {
        if (e === 6) {
          for (const x of [-1.2, 1.2]) { k.box('#e8eef0', x, 0, 1.0, 2.0, 0.14, 2.8); k.add(VAULT(), '#bfeeca', x, 0.14, 1.0, 0.9, 0.9, 1.4, 0, 0, 0, true); }
          k.box('#dfe7ee', -1.4, 0, -1.6, 1.6, 0.2, 1.6); k.box('#cfe8d6', -1.4, 0.2, -1.6, 1.4, 4.2, 1.4, 0, true); for (let f = 0; f < 5; f++) k.box('#5f9f4a', -1.4, 0.5 + f * 0.8, -1.6, 1.46, 0.12, 1.46);
          k.tcyl('#eef1f4', 1.6, 0, -1.6, 0.18, 0.1, 7.4, 8); k.box('#eef1f4', 1.6, 7.3, -1.75, 0.35, 0.35, 0.7);
          return { hub: [1.6, 7.5, -1.35], blades: 'turbine' };
        }
        const plot = ter === 'desert' ? '#9cb25a' : ter === 'tundra' ? '#a7b79a' : '#7fb35b';
        for (let r = 0; r < 5; r++) k.box(r % 2 ? plot : '#6aa85a', -1.8 + r * 0.9, 0, 1.2, 0.8, 0.22, 2.6);
        k.box('#e0b23a', 0.4, 0.22, 1.6, 0.9, 0.6, 1.2); k.add(UBOX(), '#3a3f48', 0.4, 0.82, 1.6, 0.15, 1.2, 0.15, 0, 0.5, 0); k.box('#7ff0ff', 0.4, 0.6, 2.21, 0.5, 0.08, 0.02, 0, true);
        k.box('#2b2f36', -1.0, 0, -1.6, 2.0, 0.3, 2.0); k.box('#cfe8d6', -1.0, 0.3, -1.6, 1.7, 6.0, 1.7, 0, true); for (let f = 0; f < 7; f++) k.box('#4f8f45', -1.0, 0.6 + f * 0.8, -1.6, 1.76, 0.1, 1.76);
        k.box('#7ff0ff', -1.0, 6.3, -1.6, 1.8, 0.1, 1.8, 0, true); k.cyl('#3a3f48', 1.6, 0, -1.4, 0.8, 0.1, 12); k.box('#7ff0ff', 1.6, 0.11, -1.4, 0.6, 0.02, 0.1, 0, true);
        return null;
      }
      const plot = ter === 'desert' ? '#9cb25a' : ter === 'tundra' ? '#a7b79a' : '#7fb35b';
      const grain = ter === 'tundra' ? '#cdd7c8' : '#d9c25e';
      const rows = (x, z, w, d, c) => { k.box(c, x, 0, z, w, 0.2, d); for (let r = 0; r < 3; r++) k.box(c, x - w / 2 + w * (r + 0.5) / 3, 0.2, z, 0.22, 0.2, d * 0.9); };
      if (e === 0) {
        for (let b = 0; b < 5; b++) { const a = b * 1.3 + v * 3, r = 1.6 + (b % 2) * 0.6; k.blob(ICO(), ter === 'tundra' ? '#7c8f80' : '#4f8d48', Math.cos(a) * r, 0.45, Math.sin(a) * r + 0.6, 0.55); k.blob(ICO(), '#c8344a', Math.cos(a) * r + 0.2, 0.75, Math.sin(a) * r + 0.85, 0.12); }
        for (const sx of [-0.9, 0.9]) k.cyl('#6d5139', sx, 0, -1.4, 0.07, 1.5, 5);
        k.box('#6d5139', 0, 1.45, -1.4, 1.95, 0.08, 0.08);
        for (let f = 0; f < 4; f++) k.box(ter === 'coast' || ter === 'tundra' ? '#9fb3bf' : '#a0603e', -0.6 + f * 0.4, 0.95, -1.4, 0.16, 0.5, 0.08);
        k.box(grain, 0, 0, 1.8, 2.6, 0.25, 1.2);
        return null;
      }
      if (e === 1) {
        rows(-1.15, 1.2, 2.0, 2.6, plot); rows(1.15, 1.2, 2.0, 2.6, plot);
        k.box('#5aa3c7', 0, 0.02, 1.2, 0.3, 0.12, 2.8);
        k.cyl('#d2b07c', 0, 0, -1.5, 1.0, 1.2, 10); k.dome('#c9a46e', 0, 1.2, -1.5, 1.0, 0.9, 10);
        k.box('#4a3426', 0, 0, -0.52, 0.42, 0.7, 0.05);
        return null;
      }
      if (e === 2 || e === 3) {
        rows(-1.15, 1.5, 2.0, 3.0, plot); rows(1.15, 1.5, 2.0, 3.0, plot);
        if (e === 2) {
          k.tcyl('#efe3c8', 0, 0, -1.4, 1.1, 0.75, 4.2, 8); k.cone('#b5523b', 0, 4.2, -1.4, 1.05, 1.4, 8);
          k.box('#6d4c35', 0, 0, -0.36, 0.55, 0.85, 0.1);
          return { hub: [0, 3.9, -0.55], blades: 'mill' };
        }
        k.box('#a8453a', 0, 0, -1.6, 2.8, 1.9, 2.0); k.gable('#6b3a30', 0, 1.9, -1.6, 3.0, 1.1, 2.2, Math.PI / 2);
        k.box('#f2efe6', 0, 0, -0.58, 1.0, 1.3, 0.05); k.box('#f2efe6', 0, 1.25, -0.57, 1.1, 0.08, 0.05);
        for (const [x, z] of [[-2.3, -0.4], [2.3, -0.6]]) { k.cyl('#6b4b32', x, 0, z, 0.12, 0.9, 6); k.blob(ICO(), '#5b9a52', x, 1.35, z, 0.65); }
        return null;
      }
      if (e === 4) {
        rows(-1.15, 1.4, 2.0, 3.2, grain); rows(1.15, 1.4, 2.0, 3.2, plot);
        k.cyl('#c9ccd0', -1.6, 0, -1.7, 0.85, 4.6, 12); k.dome('#aeb4ba', -1.6, 4.6, -1.7, 0.85, 0.7, 12);
        k.box('#9c3d33', 0.8, 0, -1.6, 2.2, 1.7, 1.8); k.gable('#4b4f57', 0.8, 1.7, -1.6, 2.4, 0.9, 2.0);
        k.box('#c8432f', 1.9, 0, -0.1, 0.7, 0.45, 0.5); k.cyl('#222222', 1.7, 0.05, 0.12, 0.2, 0.18, 8); k.cyl('#222222', 2.1, 0.05, 0.12, 0.2, 0.18, 8);
        return null;
      }
      // hiện đại: nhà kính, pin mặt trời, tuabin gió
      for (const x of [-1.15, 1.15]) { k.box('#e8eef0', x, 0, 1.0, 1.9, 0.12, 2.6); k.box('#cfe8f0', x, 0.12, 1.0, 1.8, 1.0, 2.5, 0, true); k.gable('#d9eef5', x, 1.12, 1.0, 2.5, 0.5, 1.8, Math.PI / 2, true); }
      for (let r = 0; r < 3; r++) k.add(UBOX(), '#2c3e66', -1.2 + r * 0.05, 0.25, -0.8 - r * 0.0, 2.2, 0.05, 0.7, 0, -0.5, 0);
      k.tcyl('#eef1f4', 1.6, 0, -1.6, 0.18, 0.1, 7.4, 8); k.box('#eef1f4', 1.6, 7.3, -1.75, 0.35, 0.35, 0.7);
      return { hub: [1.6, 7.5, -1.35], blades: 'turbine' };
    }

    // Xưởng, nơi làm ra hàng hoá. Mặt trước hướng +z.
    function buildShop(k, e, ter, v) {
      if (e === 0) {
        for (const sx of [-1.2, 1.2]) k.cyl('#6d5139', sx, 0, 0.6, 0.08, 1.7, 5);
        k.add(UBOX(), ter === 'tundra' ? '#cdb592' : pick(PAL.thatch, v), 0, 1.25, -0.2, 2.8, 0.12, 2.2, 0, 0.45, 0);
        k.box('#8f6a46', 0, 0, -1.0, 2.6, 1.1, 0.12);
        for (let s = 0; s < 6; s++) k.blob(DOD(), '#8d8a84', -1.6 + (s % 3) * 0.3, 0.15 + Math.floor(s / 3) * 0.25, 1.4 + (s % 2) * 0.2, 0.22);
        k.box('#7d7a74', 0.6, 0, 1.2, 0.7, 0.45, 0.5);
        return { fire: [0.0, 0.4, 0.9] };
      }
      if (e === 1) {
        k.dome('#b5764a', -0.9, 0, -0.3, 1.15, 1.0, 10); k.cyl('#8a5a3a', -0.9, 1.0, -0.3, 0.22, 0.9, 6);
        for (const [x, z] of [[0.6, 0.9], [1.6, 0.9], [0.6, -1.0], [1.6, -1.0]]) k.cyl('#7a5a3a', x, 0, z, 0.08, 1.6, 5);
        k.box(pick(PAL.mud, v), 1.1, 1.6, -0.05, 1.5, 0.12, 2.3);
        for (let j = 0; j < 4; j++) k.add(TCYL(0.6, 8), j % 2 ? '#c27a4a' : '#a8603e', 0.4 + j * 0.42, 0, 1.6, 0.2, 0.45, 0.2);
        return { fire: [-0.9, 0.4, 0.85] };
      }
      if (e === 2) {
        k.box(pick(['#9c958a', '#a39a8c', '#8f8a80'], v), 0, 0, -0.2, 3.0, 2.0, 2.4); k.gable(pick(PAL.tiles, v), 0, 2.0, -0.2, 3.2, 1.2, 2.6);
        k.tcyl('#6d6359', 1.0, 0, -0.9, 0.42, 0.3, 4.4, 8);
        k.box('#2a1d17', -0.5, 0.2, 1.02, 1.0, 1.0, 0.05); k.box('#3a3a3d', 0.9, 0, 1.6, 0.6, 0.55, 0.35);
        return { fire: [-0.5, 0.7, 1.15] };
      }
      if (e >= 3 && (ter !== 'plains' || e >= 6)) {
        const S = STY[ter][e];
        k.box(S.base, 0, 0, 0, 3.9, 0.2, 2.9);
        k.box(tint(S.wall, (v - 0.5) * 0.12), 0, 0.2, 0, 3.6, e >= 5 ? 2.6 : 2.3, 2.6);
        k.box(S.glass ? pick(PAL.glass, v) : PAL.win, 0, 0.8, 1.31, 3.2, 0.8, 0.04, 0, true);
        k.box(S.trim, 0, 1.75, 1.33, 3.4, 0.35, 0.06);
        roofOn(k, S, 0, e >= 5 ? 2.8 : 2.5, 0, 3.6, 2.6);
        if (e === 6) { k.box('#9aa0a6', 1.9, 0, 1.9, 1.0, 0.3, 1.0); k.add(UCYL(10), '#f4f6f8', 1.9, 0.3, 1.9, 0.26, 2.8, 0.26); k.cone('#e05a6a', 1.9, 3.1, 1.9, 0.26, 0.6, 10); return null; }
        if (e >= 7) { k.box('#f2a541', 1.8, 0, 1.7, 0.4, 0.5, 0.4); k.add(UBOX(), '#f2a541', 1.8, 0.5, 1.7, 0.16, 1.2, 0.16, 0, 0.6, 0); k.add(UBOX(), '#f2a541', 1.8, 1.4, 2.25, 0.14, 0.8, 0.14, 0, -0.9, 0); k.box('#7ff0ff', 0, 2.0, 1.33, 3.0, 0.08, 0.04, 0, true); return null; }
        if (e === 4) { k.tcyl('#7a3a2e', 1.3, 0, -1.0, 0.36, 0.26, 6.0, 10); return { smoke: [[1.3, 6.2, -1.0]], fire: [0, 0.6, 1.5] }; }
        if (e === 3) { k.cyl(S.wall2, 1.1, 2.0, -0.7, 0.3, 2.4, 8); for (let j = 0; j < 4; j++) k.box('#c49a62', 0.3 + (j % 2) * 0.54, Math.floor(j / 2) * 0.48, 1.85, 0.48, 0.48, 0.48); return { fire: [-0.7, 0.75, 1.7], gear: [1.86, 1.4, 0.2] }; }
        k.cyl('#9aa3ad', 1.4, 2.6, 1.0, 0.06, 1.4, 6); k.box(S.trim, 1.4, 3.9, 1.0, 0.7, 0.45, 0.12, 0, true);
        return null;
      }
      if (e === 3) {
        k.box(pick(['#cdb99a', '#d6c3a5', '#c9b08f'], v), 0, 0, 0, 3.6, 2.3, 2.6);
        k.add(VAULT(), pick(['#4f8a7c', '#5a7fa0', '#8a5a4f'], v), 0, 2.3, 0, 3.8, 1.35, 1.35);
        k.box('#3a2a22', -0.7, 0.1, 1.31, 1.1, 1.1, 0.06); k.cyl('#9a5a44', 1.1, 2.0, -0.7, 0.32, 2.6, 8);
        for (let j = 0; j < 6; j++) k.box('#c49a62', 0.3 + (j % 3) * 0.54, Math.floor(j / 3) * 0.48, 1.85, 0.48, 0.48, 0.48);
        return { fire: [-0.7, 0.75, 1.7], gear: [1.86, 1.4, 0.2] };
      }
      if (e === 4) {
        const brick = pick(PAL.bricks, v);
        k.box(brick, 0, 0, 0, 3.8, 2.4, 2.8);
        for (let s = 0; s < 3; s++) k.add(GABLE(), '#5d6168', -1.25 + s * 1.25, 2.4, 0, 1.25, 0.9, 2.8, Math.PI / 2, 0, 0);
        for (const sx of [-1.2, -0.4, 0.4, 1.2]) k.box(PAL.win, sx, 0.9, 1.41, 0.5, 0.8, 0.04, 0, true);
        for (const sx of [-1.3, 1.3]) { k.tcyl('#7a3a2e', sx, 0, -1.0, 0.36, 0.26, 7.0, 10); k.cyl('#e9e2d4', sx, 5.6, -1.0, 0.32, 0.25, 10); }
        return { smoke: [[-1.3, 7.2, -1.0], [1.3, 7.2, -1.0]], fire: [0, 0.6, 1.5] };
      }
      k.box('#e8ecef', 0, 0, 0, 3.8, 2.3, 2.9);
      k.box(pick(PAL.glass, v), 0, 0.8, 1.46, 3.6, 0.9, 0.04, 0, true); k.box(pick(PAL.glass, v), 1.91, 0.8, 0, 0.04, 0.9, 2.7, 0, true);
      for (let r = 0; r < 3; r++) k.add(UBOX(), '#2c3e66', -1.0 + r * 1.0, 2.35, -0.2, 0.85, 0.05, 2.3, 0, 0, 0.25);
      k.cyl('#9aa3ad', 1.4, 2.3, 1.0, 0.06, 1.4, 6); k.box(pick(['#3fa7d6', '#f2a541', '#59c3a4'], v), 1.4, 3.6, 1.0, 0.7, 0.45, 0.12, 0, true);
      return null;
    }

    // Nơi của chính quyền, đứng giữa quảng trường
    function buildHall(k, e, ter) {
      if (e === 6) {
        k.box('#eef1f4', 0, 0, 0, 7.0, 1.2, 7.0); k.box('#9fd3f0', 0, 0.2, 3.51, 6.6, 0.8, 0.04, 0, true);
        k.add(UCYL(16), '#f4f6f8', 0, 1.2, 0, 1.7, 20, 1.7);
        for (let f = 0; f < 9; f++) k.add(UCYL(16), '#9fd3f0', 0, 2.2 + f * 2.1, 0, 1.72, 0.7, 1.72, 0, 0, 0, true);
        k.add(UCYL(16), '#dfe7ee', 0, 21.2, 0, 3.2, 1.0, 3.2); k.add(UCYL(16), '#9fd3f0', 0, 21.4, 0, 3.22, 0.55, 3.22, 0, 0, 0, true); k.dome('#f4f6f8', 0, 22.2, 0, 2.4, 0.5, 16);
        k.cyl('#c9d1d9', 0, 23.2, 0, 0.1, 5.0, 6); k.add(SPHG(), '#f4f4f4', 1.6, 23.0, 0, 1.2, 0.4, 1.2, 0, -0.7, 0); k.box('#ff5a4f', 0, 28.2, 0, 0.25, 0.25, 0.25, 0, true);
        return { beacon: [0, 28.4, 0] };
      }
      if (e >= 7) {
        k.box('#20252c', 0, 0, 0, 7.4, 0.8, 7.4); k.box('#7ff0ff', 0, 0.8, 0, 7.0, 0.05, 7.0, 0, true);
        k.add(TCYL(0.25, 6), '#2b313a', 0, 0.8, 0, 2.2, 26, 2.2);
        for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU; k.add(UBOX(), '#7ff0ff', Math.cos(a) * 1.25, 1.0, Math.sin(a) * 1.25, 0.08, 22, 0.08, -a, 0, 0, true); }
        for (let r = 0; r < 3; r++) k.add(TORUS(), '#dfe7ee', 0, 8 + r * 7, 0, 3.6 - r * 0.8, 3.6 - r * 0.8, 3.6 - r * 0.8, 0, Math.PI / 2, 0, true);
        return { beacon: [0, 27.4, 0] };
      }
      if (e === 0) {
        k.cyl('#9c7a52', 0, 0, 0, 2.3, 1.4, 12); k.cone(ter === 'tundra' ? '#cdb592' : '#c9a45c', 0, 1.4, 0, 3.0, 2.6, 12);
        k.box('#3b2a1d', 0, 0, 2.25, 0.7, 1.0, 0.06);
        const tc = ['#b5523b', '#e0b23a', '#3d7a8b', '#f2efe6'];
        for (let s = 0; s < 4; s++) k.cyl(tc[s], 2.9, s * 0.8, 2.9, 0.32 - s * 0.03, 0.8, 8);
        k.box('#b5523b', 2.9, 2.6, 2.9, 1.3, 0.16, 0.16);
        return { fire: [0, 0.4, 4.0], clock: false };
      }
      if (e === 1) {
        const c = ter === 'mountain' || ter === 'tundra' ? '#b9b1a1' : '#d3b07a', c2 = ter === 'mountain' || ter === 'tundra' ? '#a99f8d' : '#c49f6a';
        k.box(c, 0, 0, 0, 5.4, 1.3, 5.4); k.box(c2, 0, 1.3, 0, 4.1, 1.3, 4.1); k.box(c, 0, 2.6, 0, 2.8, 1.3, 2.8);
        k.box('#f2e6c8', 0, 3.9, 0, 1.7, 1.2, 1.7); k.box('#a0603e', 0, 5.1, 0, 2.0, 0.18, 2.0);
        k.add(UBOX(), c2, 0, 0, 2.7, 1.2, 0.12, 3.2, 0, -0.7, 0);
        k.box(PAL.win, 0, 4.1, 0.86, 0.5, 0.7, 0.04, 0, true);
        return { fire: [-1.8, 3.1, 1.8] };
      }
      if (e === 2) {
        k.box('#a9a196', 0, 0, 0, 4.2, 7.0, 4.2);
        for (let b = 0; b < 4; b++) for (let s = -2; s <= 2; s++) { const a = (b * Math.PI) / 2, x = Math.cos(a) * 2.0 + Math.sin(a) * s * 0.8, z = Math.sin(a) * 2.0 - Math.cos(a) * s * 0.8; k.box('#9d9589', x, 7.0, z, 0.45, 0.6, 0.45); }
        for (const [x, z] of [[-2.2, -2.2], [2.2, -2.2], [-2.2, 2.2], [2.2, 2.2]]) { k.cyl('#b1a99c', x, 0, z, 0.75, 8.2, 10); k.cone('#4f5d7a', x, 8.2, z, 0.95, 1.8, 10); }
        k.box('#2a2420', 0, 0, 2.11, 1.2, 1.8, 0.05);
        for (const sx of [-1, 1]) k.box(PAL.win, sx * 0.9, 4.2, 2.11, 0.36, 0.7, 0.04, 0, true);
        k.box('#c8432f', 0, 8.2, 0, 0.08, 1.6, 0.08); k.box('#c8432f', 0.45, 9.3, 0, 0.8, 0.5, 0.04);
        return null;
      }
      if (e === 3) {
        k.box('#e2d6bd', 0, 0, 0, 5.4, 2.4, 5.4); k.box('#d8caac', 0, 2.4, 0, 3.0, 9.6, 3.0);
        k.add(UCYL(24), '#f7efd9', 0, 9.6, 1.52, 1.1, 0.12, 1.1, 0, Math.PI / 2, 0, true);
        k.add(UCYL(24), '#f7efd9', 1.52, 9.6, 0, 1.1, 0.12, 1.1, 0, 0, -Math.PI / 2, true);
        k.add(UCONE(4), '#3d5a80', 0, 12.0, 0, 2.4, 4.4, 2.4, Math.PI / 4);
        for (const [x, z] of [[-2.6, -2.6], [2.6, -2.6], [-2.6, 2.6], [2.6, 2.6]]) k.cone('#3d5a80', x, 2.4, z, 0.45, 1.6, 6);
        return { clock: [0, 10.15, 1.66] };
      }
      if (e === 4) {
        k.box('#a5543f', 0, 0, 0, 6.6, 4.6, 4.6); k.gable('#4b4f57', 0, 4.6, 0, 6.8, 1.6, 4.8);
        for (let f = 0; f < 2; f++) for (let s = -2; s <= 2; s++) k.box(PAL.win, s * 1.2, 0.8 + f * 1.9, 2.31, 0.5, 0.95, 0.04, 0, true);
        k.box('#9c4a38', 0, 0, 0, 2.2, 14.0, 2.2); k.box('#e9e2d4', 0, 14.0, 0, 2.5, 0.3, 2.5);
        k.add(UCYL(24), '#f7efd9', 0, 12.0, 1.12, 0.8, 0.1, 0.8, 0, Math.PI / 2, 0, true);
        k.add(UCONE(4), '#3f4650', 0, 14.3, 0, 1.7, 3.2, 1.7, Math.PI / 4);
        k.box('#d9d1c1', 0, 0, 2.6, 3.2, 0.3, 1.0);
        return { clock: [0, 12.5, 1.24] };
      }
      k.box('#5f7f96', 0, 0, 0, 6.4, 4.2, 6.4, 0, true);
      for (let f = 0; f < 3; f++) k.box('#eef1f4', 0, 1.4 * f + 1.3, 0, 6.6, 0.16, 6.6);
      k.box('#5e8d4e', 0, 4.2, 0, 6.2, 0.3, 6.2);
      k.box('#eef1f4', 1.9, 4.2, -1.9, 1.7, 21.0, 1.7);
      k.box('#a9cbd6', 1.9, 4.6, -1.9, 1.75, 20.0, 1.2, 0, true);
      k.cyl('#c9d1d9', 1.9, 25.2, -1.9, 0.08, 4.0, 6);
      return { beacon: [1.9, 29.2, -1.9] };
    }

    // Nơi giữ tiền: kho chung, kho đền, nhà đổi tiền, Kho Bạc, ngân hàng, toà tháp ngân hàng
    function buildBank(k, e, ter) {
      if (e === 6) {
        k.box('#eef1f4', 0, 0, 0, 5.6, 0.6, 5.6); k.box('#9fd3f0', 0, 0.6, 0, 4.8, 4.8, 4.8, 0, true);
        for (let f = 1; f < 4; f++) k.box('#dfe7ee', 0, 0.6 + f * 1.2, 0, 4.9, 0.08, 4.9);
        k.box('#3fa7d6', 0, 5.0, 0, 5.0, 0.35, 5.0, 0, true); k.box('#eef1f4', 0, 5.4, 0, 5.0, 0.2, 5.0);
        return { orb: [0, 6.6, 0] };
      }
      if (e >= 7) {
        k.box('#20252c', 0, 0, 0, 5.0, 0.5, 5.0); k.box('#15181d', 0, 0.5, 0, 2.6, 11.5, 1.4);
        for (let i = 0; i < 5; i++) k.box('#ffd36b', 0, 1.5 + i * 2.1, 0.71, 2.0, 0.06, 0.02, 0, true);
        k.box('#ffd36b', 0, 0.5, 0.71, 0.06, 11.5, 0.02, 0, true);
        return { orb: [0, 13.6, 0] };
      }
      if (e === 0) {
        for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) k.cyl('#6d5139', x, 0, z, 0.09, 1.3, 5);
        k.box('#8f6a46', 0, 1.25, 0, 2.5, 0.12, 2.5);
        k.cyl('#b8934f', 0, 1.37, 0, 1.15, 1.5, 12); k.cyl('#8a6a3a', 0, 2.0, 0, 1.17, 0.18, 12);
        k.cone(ter === 'tundra' ? '#cdb592' : '#c9a45c', 0, 2.87, 0, 1.5, 1.3, 12);
        return null;
      }
      if (e === 1) {
        k.box('#e6dcc6', 0, 0, 0, 4.6, 0.5, 3.6); k.box('#d8ccb2', 0, 0.5, -0.3, 3.0, 2.2, 2.2);
        for (let c = 0; c < 6; c++) k.cyl('#efe6d2', -1.9 + c * 0.76, 0.5, 1.35, 0.17, 2.2, 10);
        k.box('#e6dcc6', 0, 2.7, 0, 4.4, 0.25, 3.4); k.gable('#d6c8aa', 0, 2.95, 0, 4.4, 1.0, 3.4);
        return null;
      }
      if (e === 2) {
        k.box('#b9b0a2', 0, 0, 0, 3.8, 3.0, 3.2); k.gable('#6d4a3a', 0, 3.0, 0, 4.0, 1.6, 3.4);
        k.box('#3a2a22', 0, 0, 1.61, 0.9, 1.5, 0.05); k.dome('#3a2a22', 0, 1.5, 1.61, 0.45, 0.9, 8);
        for (const sx of [-1.2, 1.2]) k.box(PAL.win, sx, 1.7, 1.61, 0.45, 0.65, 0.04, 0, true);
        k.box('#d4a537', 0, 2.5, 1.66, 1.2, 0.35, 0.06);
        return null;
      }
      if (e === 3) {
        k.cyl('#efe6d2', 0, 0, 0, 2.3, 0.4, 16); k.cyl('#e8dcc2', 0, 0.4, 0, 1.9, 2.8, 16);
        for (let c = 0; c < 10; c++) { const a = (c / 10) * TAU; k.cyl('#f6efde', Math.cos(a) * 2.1, 0.4, Math.sin(a) * 2.1, 0.14, 2.8, 8); }
        k.cyl('#efe6d2', 0, 3.2, 0, 2.3, 0.3, 16);
        k.add(DOME(16), '#d7b44a', 0, 3.5, 0, 1.9, 1.7, 1.9);
        return { orb: [0, 6.6, 0] };
      }
      if (e === 4) {
        k.box('#d9d1c1', 0, 0, 0, 5.4, 0.5, 4.4); k.box('#cfc6b4', 0, 0.5, -0.4, 4.8, 4.2, 3.4);
        for (let c = 0; c < 6; c++) k.cyl('#efe9dc', -2.0 + c * 0.8, 0.5, 1.6, 0.24, 3.9, 10);
        k.box('#d9d1c1', 0, 4.4, 0, 5.2, 0.4, 4.2); k.gable('#cfc6b4', 0, 4.8, 0, 5.2, 1.1, 4.2);
        k.box('#2a2420', 0, 0.5, 1.31, 1.0, 1.9, 0.05);
        return null;
      }
      k.box('#3d5568', 0, 0, 0, 3.4, 24.0, 3.4);
      for (let f = 0; f < 22; f++) { k.box('#9fc3d8', 0, 0.6 + f * 1.05, 1.71, 3.0, 0.62, 0.04, 0, true); k.box('#9fc3d8', 1.71, 0.6 + f * 1.05, 0, 0.04, 0.62, 3.0, 0, true); }
      k.box('#d7b44a', 0, 24.0, 0, 3.6, 0.5, 3.6);
      return { orb: [0, 25.3, 0] };
    }

    // Trường, đền, thư viện: nơi tri thức được giữ lại
    function buildSchool(k, e, ter) {
      if (e === 6) {
        k.box('#eef1f4', 0, 0, 0, 6.2, 1.6, 4.4); k.box('#9fd3f0', 0, 0.4, 2.21, 5.6, 0.8, 0.04, 0, true);
        k.dome('#f4f6f8', -1.2, 1.6, 0, 2.2, 1, 18);
        k.box('#9aa0a6', 2.4, 0, -1.2, 1.6, 0.4, 1.6); k.add(UCYL(10), '#f4f6f8', 2.4, 0.4, -1.2, 0.42, 5.2, 0.42); k.cone('#e05a6a', 2.4, 5.6, -1.2, 0.42, 1.1, 10);
        for (let i = 0; i < 3; i++) { const a = (i / 3) * TAU; k.add(UBOX(), '#e05a6a', 2.4 + Math.cos(a) * 0.45, 0.4, -1.2 + Math.sin(a) * 0.45, 0.06, 1.0, 0.4, -a); }
        return null;
      }
      if (e >= 7) {
        for (const [x, z, h] of [[-1.6, 0, 3.2], [1.2, -0.8, 4.6], [0.4, 1.4, 2.4]]) { k.box('#cfe8f5', x, 0, z, 2.2, h, 2.2, 0, true); k.box('#7ff0ff', x, h, z, 2.3, 0.08, 2.3, 0, true); }
        k.add(ICO(), '#7ff0ff', 0, 6.4, 0, 0.9, 0.9, 0.9, 0, 0, 0, true); k.add(TORUS(), '#dfe7ee', 0, 6.4, 0, 1.6, 1.6, 1.6, 0, 0.6, 0);
        return null;
      }
      if (e === 0) {
        for (let s = 0; s < 9; s++) { const a = (s / 9) * TAU; k.add(UBOX(), '#8d8a84', Math.cos(a) * 2.5, 0, Math.sin(a) * 2.5, 0.55, 1.6 + (s % 3) * 0.35, 0.35, -a, 0, (s % 2 ? 0.08 : -0.06)); }
        k.box('#7d7a74', 0, 0, 0, 0.9, 0.5, 0.6);
        return null;
      }
      if (e === 1) {
        k.box('#e6dcc6', 0, 0, 0, 4.0, 0.45, 3.0); k.box('#d8ccb2', 0, 0.45, -0.3, 2.4, 2.0, 1.8);
        for (let c = 0; c < 4; c++) k.cyl('#efe6d2', -1.3 + c * 0.87, 0.45, 1.1, 0.15, 2.0, 10);
        k.gable('#c8432f', 0, 2.45, 0, 3.9, 0.9, 2.9);
        return null;
      }
      if (e === 2) {
        k.box('#b1a99c', 0, 0, 0, 3.4, 2.8, 2.8); k.gable('#6d4a3a', 0, 2.8, 0, 3.6, 1.3, 3.0);
        k.box('#a9a196', 1.4, 0, -1.0, 1.4, 7.0, 1.4); k.add(UCONE(4), '#4f5d7a', 1.4, 7.0, -1.0, 1.15, 2.4, 1.15, Math.PI / 4);
        for (const sx of [-0.9, 0.2]) k.box(PAL.win, sx, 1.1, 1.41, 0.45, 0.9, 0.04, 0, true);
        return null;
      }
      if (e === 3) {
        k.box('#e9d9b8', 0, 0, 0, 6.0, 2.6, 4.2); k.cyl('#e2cfa9', 0, 2.6, 0, 2.2, 2.6, 14);
        k.dome('#5a6f8f', 0, 5.2, 0, 2.2, 1.0, 16);
        k.add(UCYL(10), '#b08d57', 0.6, 6.4, 0.6, 0.35, 3.4, 0.35, 0, 0.7, -0.5);
        for (let w = 0; w < 5; w++) k.box(PAL.win, -2.4 + w * 1.2, 1.0, 2.11, 0.6, 0.8, 0.04, 0, true);
        return null;
      }
      if (e === 4) {
        k.box('#9c4a38', 0, 0, 0, 6.4, 4.0, 3.4); k.gable('#4b4f57', 0, 4.0, 0, 6.6, 1.4, 3.6);
        k.box('#e9e2d4', 0, 0, 1.72, 2.0, 5.6, 0.2); k.gable('#e9e2d4', 0, 5.6, 1.72, 2.0, 1.0, 0.2, Math.PI / 2);
        for (let f = 0; f < 2; f++) for (let s = -2; s <= 2; s++) if (s) k.box(PAL.win, s * 1.15, 0.7 + f * 1.7, 1.71, 0.48, 0.9, 0.04, 0, true);
        k.add(UCYL(20), '#f7efd9', 0, 4.4, 1.84, 0.55, 0.08, 0.55, 0, Math.PI / 2, 0, true);
        return null;
      }
      k.box('#eef1f4', 0, 0, 0, 6.4, 3.0, 4.4);
      k.box('#9fc3d8', 0, 0.6, 2.21, 6.0, 1.9, 0.04, 0, true);
      k.add(DOME(18), '#cfe8f0', 0, 3.0, 0, 2.3, 1.0, 2.3, 0, 0, 0, true);
      for (let r = 0; r < 2; r++) k.add(UBOX(), '#2c3e66', -2.2 + r * 4.4, 3.0, -1.2, 1.4, 0.05, 1.6, 0, 0, 0.3);
      return null;
    }

    // Đèn quanh quảng trường và dọc đường
    function buildLamp(k, e) {
      if (e === 6) { k.cyl('#dfe7ee', 0, 0, 0, 0.07, 4.0, 8); k.add(TORUS(), '#f4fbff', 0, 4.1, 0, 0.35, 0.35, 0.35, 0, Math.PI / 2, 0, true); return [0, 4.1, 0]; }
      if (e >= 7) { k.cyl('#2b313a', 0, 0, 0, 0.18, 0.3, 8); k.add(ICO(), '#7ff0ff', 0, 2.6, 0, 0.26, 0.26, 0.26, 0, 0, 0, true); return [0, 2.6, 0]; }
      if (e === 0) { k.cyl('#6d5139', 0, 0, 0, 0.07, 1.7, 5); k.cone('#3b2a1d', 0, 1.65, 0, 0.14, 0.25, 5); return [0, 2.0, 0]; }
      if (e === 1) { for (let l = 0; l < 3; l++) { const a = (l / 3) * TAU; k.add(UCYL(4), '#6b4b32', Math.cos(a) * 0.25, 0, Math.sin(a) * 0.25, 0.05, 1.3, 0.05, 0, Math.sin(a) * 0.2, -Math.cos(a) * 0.2); } k.dome('#8a6a46', 0, 1.25, 0, 0.36, -0.6, 8); return [0, 1.45, 0]; }
      if (e === 2) { k.cyl('#5a4030', 0, 0, 0, 0.08, 2.2, 6); k.box('#5a4030', 0.25, 2.1, 0, 0.55, 0.06, 0.06); k.box('#ffd98a', 0.45, 1.75, 0, 0.22, 0.32, 0.22, 0, true); return [0.45, 1.9, 0]; }
      if (e === 3) { k.cyl('#2f3540', 0, 0, 0, 0.1, 2.6, 6); k.add(OCT(), '#fff1c9', 0, 2.75, 0, 0.28, 0.28, 0.28, 0, 0, 0, true); return [0, 2.75, 0]; }
      if (e === 4) { k.cyl('#1f2328', 0, 0, 0, 0.12, 0.4, 8); k.cyl('#1f2328', 0, 0.4, 0, 0.07, 2.9, 6); k.box('#f3d58a', 0, 3.2, 0, 0.32, 0.42, 0.32, Math.PI / 4, true); k.cone('#1f2328', 0, 3.62, 0, 0.26, 0.3, 4, Math.PI / 4); return [0, 3.4, 0]; }
      k.cyl('#8f969e', 0, 0, 0, 0.08, 4.2, 8); k.box('#8f969e', 0.45, 4.1, 0, 0.9, 0.08, 0.16); k.box('#f4fbff', 0.8, 4.02, 0, 0.36, 0.05, 0.14, 0, true); return [0.8, 3.95, 0];
    }

    /* =============== Địa hình sáu miền =============== */
    /* =============== Phong cách kiến trúc: sáu miền × sáu thời đại =============== */
    // [tường, tường phụ, mái, kiểu mái, viền, nền, kính]
    const STY_RAW = {
      plains: [['#a07850', '#8a6a46', '#c9a94e', 'thatch', '#6d5139', '#7d6a55'], ['#c9a46e', '#b48a58', '#a8603e', 'flat', '#e6dcc6', '#9b8466'], ['#d8cbb0', '#8a6a46', '#9b4a35', 'gable', '#5a4030', '#a39b8e'], ['#c8734f', '#efe6d2', '#5b4a44', 'hip', '#f4efe2', '#9a8f80'], ['#9b3f2e', '#6b6560', '#4a4d52', 'saw', '#d9c9a8', '#5d5f63'], ['#dfe7ee', '#7fb0d6', '#eef1f4', 'flat', '#3fa7d6', '#c9ced4', 1], ['#e9edf2', '#b8c4cf', '#f4f6f8', 'flat', '#e05a6a', '#cfd5db', 1], ['#f4f7fa', '#5fe0ff', '#e8eef3', 'sail', '#5fe0ff', '#d9dfe4', 1]],
      forest: [['#7a5a3a', '#5f4630', '#6b7f3a', 'tent', '#4a3826', '#5b4a3a'], ['#8a6440', '#6d5139', '#5f6e3b', 'gable', '#3d2f22', '#6d6359'], ['#6d5139', '#4a3826', '#3f3a35', 'steep', '#c9a14e', '#6d6359'], ['#efe6d2', '#5f4630', '#7a3a2e', 'steep', '#5f4630', '#8a8174'], ['#6d5139', '#4f5a46', '#4f6b4a', 'saw', '#2f3540', '#5d5f63'], ['#c9a87c', '#5f9f4a', '#6aa85a', 'garden', '#f4f4f4', '#9fa69a', 1], ['#d9c3a0', '#6aa85a', '#5f9f4a', 'garden', '#f4f4f4', '#9fa69a', 1], ['#c9b48a', '#7fd98a', '#4f8f45', 'garden', '#7fd98a', '#8f9a88', 1]],
      mountain: [['#8b8577', '#7c776b', '#5f6b62', 'slate', '#6d695f', '#6d695f'], ['#b8b2a4', '#a9a294', '#8a5a3a', 'flat', '#d9d2c2', '#948d7e'], ['#9d9589', '#7f7a6e', '#4a4d52', 'cone', '#c9bda4', '#7f7a6e'], ['#c9bda4', '#7a5a3a', '#7a4e3e', 'gable', '#efe6d2', '#9d9589'], ['#8f8a80', '#5d5f63', '#3f4650', 'flat', '#c46a2e', '#6d695f'], ['#b9b5ad', '#8f8a80', '#9aa0a6', 'brutal', '#e05a6a', '#8f8a80', 1], ['#c9ced4', '#8f8a80', '#aab0b6', 'brutal', '#f2a541', '#8f8a80', 1], ['#dfe3e8', '#5fe0ff', '#b8bec4', 'geo', '#5fe0ff', '#9aa0a6', 1]],
      tundra: [['#eef3f6', '#c8b49a', '#eef3f6', 'igloo', '#9aa4ad', '#d6e4ec'], ['#8a6a46', '#6d5139', '#6f8a4a', 'turf', '#c8b49a', '#9aa4ad'], ['#7d5a3a', '#9aa4ad', '#4a4d52', 'steep', '#e8eef2', '#8a949d'], ['#d96b4f', '#f2e2c8', '#3f8f5a', 'onion', '#f4d35e', '#9aa4ad'], ['#9aa4ad', '#6c757e', '#c46a2e', 'vault', '#e8eef2', '#6c757e'], ['#f4f7f9', '#bfe3f2', '#dff2fa', 'geo', '#5fc6e6', '#c8d3da', 1], ['#f4f7f9', '#9fd3f0', '#e8f0f4', 'geo', '#e05a6a', '#c8d3da', 1], ['#ffffff', '#7ff0ff', '#dff2fa', 'geo', '#7ff0ff', '#c8d3da', 1]],
      coast: [['#c8a36a', '#8f6a46', '#d8c27a', 'thatch', '#6d5139', '#8f6a46'], ['#f2ede2', '#d9cbb0', '#e8dcc6', 'flat', '#3f7fd6', '#c9bda4'], ['#e3d6bd', '#b9a07a', '#c4603e', 'hip', '#5a4030', '#b1a99c'], ['#fbfaf6', '#e8e4da', '#3f7fd6', 'dome', '#3f7fd6', '#d9d2c2'], ['#a14a3a', '#5d5f63', '#3f4650', 'gable', '#f2ede2', '#6d695f'], ['#ffffff', '#cfe8f5', '#ffffff', 'sail', '#3f9cc6', '#d9dfe4', 1], ['#ffffff', '#9fd3f0', '#eef6fb', 'sail', '#f2a541', '#d9dfe4', 1], ['#f7fbfd', '#5fe0ff', '#ffffff', 'sail', '#5fe0ff', '#d9dfe4', 1]],
      desert: [['#c98a5a', '#b87b4f', '#d9a46e', 'mud', '#8f5f3e', '#b87b4f'], ['#d9a46e', '#c98a5a', '#d9a46e', 'flat', '#8f5f3e', '#c98a5a'], ['#e2bd85', '#c98a5a', '#3fb0b8', 'dome', '#8f5f3e', '#c9a06e'], ['#e8c08e', '#c98a5a', '#e8c08e', 'wind', '#5f8fb0', '#c9a06e'], ['#c98a5a', '#5d5f63', '#8f5f3e', 'flat', '#2f3540', '#8f5f3e'], ['#e8d2b0', '#c98a5a', '#f2e6d0', 'lattice', '#e05a6a', '#c9a06e', 1], ['#efdcc0', '#c98a5a', '#f6ead6', 'lattice', '#3fa7d6', '#c9a06e', 1], ['#f4e6cf', '#ffd36b', '#f8efe0', 'lattice', '#ffd36b', '#c9a06e', 1]],
    };
    const STY = {};
    for (const ter in STY_RAW) STY[ter] = STY_RAW[ter].map(([wall, wall2, roof, roofT, trim, base, glass], e) => ({ wall, wall2, roof, roofT, trim, base, glass: !!glass, e, ter }));
    // mái theo kiểu của miền và thời đại, đặt trên một khối thân rộng w (trục x), sâu d (trục z), cao tới y
    function roofOn(k, S, x, y, z, w, d) {
      const m = Math.min(w, d), R = S.roof;
      switch (S.roofT) {
        case 'thatch': if (w / d > 1.3) k.gable(R, x, y, z, w + 0.4, d * 0.6, d + 0.4); else k.add(UCONE(4), R, x, y, z, Math.max(w, d) * 0.78, m * 0.75, Math.max(w, d) * 0.78, Math.PI / 4); break;
        case 'tent': k.cone(R, x, y, z, Math.max(w, d) * 0.62, m * 0.9, 8); break;
        case 'slate': case 'steep': k.gable(R, x, y, z, w + 0.3, d * (S.roofT === 'steep' ? 0.95 : 0.7), d + 0.35); break;
        case 'turf': k.gable(R, x, y, z, w + 0.3, d * 0.5, d + 0.35); k.gable('#83a35a', x, y + 0.08, z, w + 0.1, d * 0.42, d + 0.1); break;
        case 'gable': k.gable(R, x, y, z, w + 0.3, d * 0.55, d + 0.3); break;
        case 'hip': k.add(UCONE(4), R, x, y, z, Math.max(w, d) * 0.74, m * 0.5, Math.max(w, d) * 0.74, Math.PI / 4); break;
        case 'cone': k.add(UCONE(4), R, x, y, z, Math.max(w, d) * 0.74, m * 0.95, Math.max(w, d) * 0.74, Math.PI / 4); break;
        case 'dome': k.box(S.trim, x, y, z, w + 0.15, 0.18, d + 0.15); k.dome(R, x, y + 0.15, z, m * 0.36, 1, 10); break;
        case 'onion': k.box(S.trim, x, y, z, w + 0.15, 0.18, d + 0.15); k.add(SPHG(), R, x, y + 0.2, z, m * 0.3, m * 0.42, m * 0.3); k.add(DOME(10), R, x, y + 0.2, z, m * 0.3, -m * 0.12, m * 0.3); k.cone(S.trim, x, y + 0.2 + m * 0.4, z, m * 0.12, m * 0.4, 6); break;
        case 'saw': for (let i = 0; i < 3; i++) { k.add(GABLE(), R, x - w / 2 + (w / 3) * (i + 0.5), y, z, d + 0.2, m * 0.32, w / 3, Math.PI / 2, 0, 0); } break;
        case 'vault': k.add(VAULT(), R, x, y, z, w * 0.52, d * 0.5 + 0.1, d * 0.5 + 0.1); break;
        case 'geo': k.box(S.trim, x, y, z, w + 0.1, 0.12, d + 0.1); k.add(ICO(), R, x, y, z, m * 0.48, m * 0.38, m * 0.48); break;
        case 'garden': k.box(S.trim, x, y, z, w + 0.2, 0.2, d + 0.2); k.box('#5f9f4a', x, y + 0.2, z, w - 0.2, 0.18, d - 0.2); for (let i = 0; i < 3; i++) k.cone('#4f8f45', x - w / 3 + (w / 3) * i, y + 0.38, z + (i % 2 ? 0.3 : -0.3), 0.35, 0.8, 6); break;
        case 'brutal': k.box(R, x, y, z, w + 0.9, 0.5, d + 0.9); for (let i = -1; i <= 1; i++) k.box(S.wall2, x + i * w * 0.32, y - 1.4, z + d / 2 + 0.25, 0.25, 1.4, 0.5); break;
        case 'sail': k.box(S.trim, x, y, z, w + 0.1, 0.12, d + 0.1); k.add(VAULT(), R, x, y, z - d * 0.15, w * 0.5, m * 0.9, d * 0.35, 0, 0.35, 0); break;
        case 'wind': k.box(S.trim, x, y, z, w + 0.15, 0.16, d + 0.15); k.box(S.wall, x + w * 0.28, y, z - d * 0.2, 0.6, 1.5, 0.6); for (const s2 of [-1, 1]) k.box('#3a2a1e', x + w * 0.28 + s2 * 0.31, y + 1.0, z - d * 0.2, 0.04, 0.4, 0.3); break;
        case 'lattice': k.box(S.trim, x, y, z, w + 0.15, 0.16, d + 0.15); for (let i = 0; i < 3; i++) k.add(UBOX(), '#24345a', x - w / 3 + (w / 3) * i, y + 0.2, z, w / 3.6, 0.06, d * 0.6, 0, 0.35, 0); break;
        case 'igloo': case 'mud': break;
        default: k.box(S.trim, x, y, z, w + 0.2, 0.2, d + 0.2); k.box(R, x, y + 0.2, z, w, 0.12, d);
      }
    }
    // thân nhà: nền, tường, cửa, cửa sổ sáng về đêm, mái
    function styHall(k, S, x, z, w, h, d, opt) {
      opt = opt || {};
      if (S.roofT === 'igloo' || S.roofT === 'mud') {
        const r = Math.max(w, d) * 0.55;
        k.dome(S.wall, x, 0, z, r, h / r * 0.9, 12);
        k.add(VAULT(), S.wall2, x, 0, z + r * 0.85, 0.45, 0.55, 0.6, Math.PI / 2, 0, 0);
        k.box('#3a2a1e', x, 0, z + r * 1.12, 0.5, 0.6, 0.06);
        return h * 0.9;
      }
      k.box(S.base, x, 0, z, w + 0.35, 0.22, d + 0.35);
      k.box(opt.wall || S.wall, x, 0.2, z, w, h, d);
      if (S.e >= 3 && !S.glass) k.box(S.trim, x, 0.2 + h - 0.16, z, w + 0.08, 0.16, d + 0.08);
      k.box(S.e >= 4 ? '#3f4650' : '#3a2a1e', x, 0.2, z + d / 2 + 0.01, Math.min(0.9, w * 0.25), Math.min(1.5, h * 0.55), 0.06);
      const rows = Math.max(1, Math.floor(h / 1.6)), cols = Math.max(1, Math.floor(w / 1.3));
      if (S.glass) for (let r = 0; r < rows; r++) k.box('#9fd3f0', x, 0.55 + r * 1.5, z + d / 2 + 0.02, w * 0.86, 0.75, 0.05, 0, true);
      else if (S.e >= 1) for (let r = 0; r < rows; r++) for (let c2 = 0; c2 < cols; c2++) { if (r === 0 && c2 === Math.floor(cols / 2)) continue; k.box('#ffe2a8', x - w / 2 + (w / cols) * (c2 + 0.5), 0.75 + r * 1.5, z + d / 2 + 0.02, 0.36, 0.42, 0.05, 0, true); }
      if (!opt.noRoof) roofOn(k, S, x, 0.2 + h, z, w, d);
      return 0.2 + h;
    }
    const TSTYLE = {
      plains: { ground: '#86bb63', rock: ['#8a6a4c', '#7b5d45', '#6d6359', '#5b5248', '#4b4741'], season: true },
      forest: { ground: '#5f9a4f', rock: ['#6e5a44', '#5f4e3d', '#585048', '#4a443e', '#3f3b37'], season: true },
      mountain: { ground: '#8fa274', rock: ['#8b8577', '#7c776b', '#6d695f', '#5f5b53', '#504d47'], season: true },
      tundra: { ground: '#e6edf1', rock: ['#9aa4ad', '#8a949d', '#7b858e', '#6c757e', '#5d666f'], season: false },
      coast: { ground: '#9ccb72', rock: ['#a08a6a', '#8f7a5e', '#7d6b54', '#6c5d4a', '#5b4f40'], season: true },
      desert: { ground: '#e3c58e', rock: ['#c98a5a', '#b87b4f', '#a56d46', '#8f5f3e', '#7a5236'], season: false },
    };
    function landRng(i) { let s = 977 + i * 131; return () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; }

    // Mép đảo: nửa nhìn ra biển trong luôn tròn (cầu, bến cá, cảng gắn vào đó); nửa ngoài mỗi miền một dáng riêng
    function shapeOf(L) {
      const oa = Math.atan2(L.out.z, L.out.x), rnd = landRng(L.i + 300), noise = Array.from({ length: 24 }, () => rnd() - 0.5);
      const nz = (u) => { const t = ((((u / TAU) % 1) + 1) % 1) * 24, i = Math.floor(t), f = t - i; return noise[i % 24] * (1 - f) + noise[(i + 1) % 24] * f; };
      const tri = (x) => 1 - 2 * Math.abs((((x / Math.PI) % 2) + 2) % 2 - 1);
      const G = {
        plains: (u) => 0.06 * Math.cos(u * 1.6) + 0.025 * Math.sin(u * 5),
        forest: (u) => 0.12 * Math.max(0, Math.cos(u * 3.3)) - 0.02 + 0.05 * nz(u * 3),
        mountain: (u) => 0.07 + 0.07 * tri(u * 5.5) + 0.06 * nz(u * 5),
        tundra: (u) => -0.02 + 0.045 * Math.sin(u * 9 + 1) + 0.06 * nz(u * 7),
        coast: (u) => 0.12 * Math.cos(u * 0.9),
        desert: (u) => 0.05 + 0.06 * tri(u * 3.2),
      }[L.ter];
      L.oa = oa;
      L.rOf = (a) => { const u = Math.atan2(Math.sin(a - oa), Math.cos(a - oa)), w = clamp((1.95 - Math.abs(u)) / 0.7, 0, 1); return LAND_R * (1 + w * w * (3 - 2 * w) * G(u)); };
      L.inside = (x, z, m) => Math.hypot(x, z) < L.rOf(Math.atan2(z, x)) - (m || 0);
      L.outerRel = (x, z) => { const a = Math.atan2(z, x); return Math.abs(Math.atan2(Math.sin(a - oa), Math.cos(a - oa))); };
      L.props = []; // những khối lớn (đồi, núi, hồ, mỏm đá) mà người, thú và cây phải tránh
      L.blockedWild = (x, z, r) => L.props.some((q) => (q.x - x) ** 2 + (q.z - z) ** 2 < (q.r + (r || 0)) ** 2);
    }
    // phần đất đá phía dưới đảo: dựng theo đúng mép đảo, mỗi miền một kiểu vân
    const UNDER = {
      plains: { lv: [[-2.6, 1], [-7, 0.86], [-13, 0.68], [-20, 0.46], [-27, 0.24], [-32, 0.08]], jit: 0.06 },
      forest: { lv: [[-2.6, 1], [-6, 0.9], [-12, 0.7], [-19, 0.48], [-26, 0.26], [-31, 0.08]], jit: 0.1 },
      mountain: { lv: [[-2.6, 1], [-9, 0.92], [-17, 0.7], [-27, 0.46], [-37, 0.24], [-46, 0.06]], jit: 0.16 },
      tundra: { lv: [[-2.6, 1], [-5, 0.94], [-10, 0.74], [-16, 0.5], [-22, 0.26], [-27, 0.06]], jit: 0.12 },
      coast: { lv: [[-2.6, 1], [-6, 0.88], [-11, 0.7], [-17, 0.5], [-23, 0.28], [-28, 0.08]], jit: 0.08 },
      desert: { lv: [[-2.6, 1], [-8, 0.97], [-12, 0.86], [-15, 0.6], [-17, 0.3], [-18, 0.05]], jit: 0.07 },
    };
    function underside(L, st) {
      const U = UNDER[L.ter], N = 72, rnd = landRng(L.i + 77), rings = [];
      U.lv.forEach(([y, sc], j) => {
        const ring = [];
        for (let k = 0; k < N; k++) { const a = (k / N) * TAU, jit = j === 0 ? 0 : (rnd() - 0.5) * U.jit * 2; const r = L.rOf(a) * sc * (1 + jit); ring.push([Math.cos(a) * r, y + (j === 0 ? 0 : (rnd() - 0.5) * 2.2), Math.sin(a) * r]); }
        rings.push(ring);
      });
      const pos = [], col = [], strata = st.rock.map((h) => C(h));
      const push = (p, j) => { pos.push(p[0], p[1], p[2]); const c = strata[clamp(j, 0, strata.length - 1)]; col.push(c.r, c.g, c.b); };
      for (let j = 0; j < rings.length - 1; j++) for (let k = 0; k < N; k++) {
        const a = rings[j][k], b = rings[j][(k + 1) % N], c2 = rings[j + 1][k], d = rings[j + 1][(k + 1) % N];
        push(a, j); push(b, j); push(c2, j + 1); push(b, j); push(d, j + 1); push(c2, j + 1);
      }
      const last = rings[rings.length - 1], tip = [0, U.lv[U.lv.length - 1][0] - (L.ter === 'desert' ? 0.5 : 5), 0];
      for (let k = 0; k < N; k++) { push(last[k], rings.length - 1); push(last[(k + 1) % N], rings.length - 1); push(tip, rings.length); }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
      g.computeVertexNormals();
      const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.95, side: THREE.DoubleSide }));
      L.g.add(m);
      // nét riêng bên dưới: rễ cây rủ, băng nhũ, san hô, vân đá đỏ
      const k = new Kit(), at = (a, r, y) => [Math.cos(a) * r, y, Math.sin(a) * r];
      if (L.ter === 'forest') for (let i = 0; i < 26; i++) { const a = rnd() * TAU, r = L.rOf(a) * (0.7 + rnd() * 0.25), [x, , z] = at(a, r, 0), h = 4 + rnd() * 9; k.add(UCYL(5), pick(['#5b4630', '#6b4b32', '#4a3826'], rnd()), x, -2.8 - h, z, 0.18, h, 0.18, 0, (rnd() - 0.5) * 0.4, (rnd() - 0.5) * 0.4); }
      if (L.ter === 'tundra') for (let i = 0; i < 40; i++) { const a = rnd() * TAU, r = L.rOf(a) * (0.55 + rnd() * 0.42), [x, , z] = at(a, r, 0), h = 2 + rnd() * 6; k.add(UCONE(5), pick(['#cfeaf5', '#b9e0ef', '#e6f6fb'], rnd()), x, -2.6, z, 0.5 + rnd() * 0.5, -h, 0.5 + rnd() * 0.5); }
      if (L.ter === 'coast') for (let i = 0; i < 30; i++) { const a = rnd() * TAU, r = L.rOf(a) * (0.92 + rnd() * 0.07), [x, , z] = at(a, r, 0); k.blob(ICO(), pick(['#ff8f7a', '#ffb36b', '#e97ab0', '#7fd1c6', '#f4e3a1'], rnd()), x, -3 - rnd() * 3, z, 0.6 + rnd() * 0.8, 1.2); }
      if (L.ter === 'desert') for (let j = 0; j < 4; j++) for (let kk = 0; kk < 36; kk++) { const a = (kk / 36) * TAU, r = L.rOf(a) * (0.99 - j * 0.035), [x, , z] = at(a, r, 0); k.add(UBOX(), j % 2 ? '#d99a62' : '#a8603e', x, -3.4 - j * 1.6, z, 3.6, 0.35, 0.6, -a + Math.PI / 2); }
      if (k.b.length) meshOf(k, bodyMat, L.g, 0, 0, 0);
    }
    function terrain(L) {
      const st = TSTYLE[L.ter];
      shapeOf(L);
      L.groundMat = new THREE.MeshStandardMaterial({ color: st.ground, flatShading: true, roughness: 0.95 });
      L.groundBase = new THREE.Color(st.ground);
      // mặt đảo theo đúng mép riêng của miền
      const shp = new THREE.Shape();
      for (let k = 0; k <= 144; k++) { const a = (k / 144) * TAU, r = L.rOf(a); if (k === 0) shp.moveTo(Math.cos(a) * r, Math.sin(a) * r); else shp.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
      const slab = new THREE.ExtrudeGeometry(shp, { depth: 2.6, bevelEnabled: false, curveSegments: 1 });
      slab.rotateX(Math.PI / 2);
      const top = new THREE.Mesh(slab, [L.groundMat, new THREE.MeshStandardMaterial({ color: st.rock[0], flatShading: true, roughness: 0.95 })]);
      top.receiveShadow = true; L.g.add(top);
      underside(L, st);
      L.waterMats = [];
      const water = (geo, x, z, ry, y, col, op) => {
        const m = new THREE.MeshStandardMaterial({ color: col || '#4aa3c7', roughness: 0.15, metalness: 0.2, emissive: '#0c3b52', emissiveIntensity: 0.3, flatShading: true, transparent: op != null, opacity: op == null ? 1 : op });
        const me = new THREE.Mesh(geo, m); me.rotation.x = -Math.PI / 2; me.rotation.z = ry || 0; me.position.set(x, y || 0.06, z); me.receiveShadow = true; L.g.add(me); L.waterMats.push(m); return me;
      };
      const flat = (geo, x, z, y, col, rough) => { const me = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: col, roughness: rough == null ? 0.95 : rough, flatShading: true })); me.rotation.x = -Math.PI / 2; me.position.set(x, y, z); me.receiveShadow = true; L.g.add(me); return me; };
      const fall = (a, wid, col) => { const f = new THREE.Mesh(new THREE.BoxGeometry(0.6, 24, wid), new THREE.MeshStandardMaterial({ color: col || '#8fd3ee', transparent: true, opacity: 0.72, emissive: '#2a6f8f', emissiveIntensity: 0.3 })); const r = L.rOf(a) + 0.2; f.position.set(Math.cos(a) * r, -12, Math.sin(a) * r); f.rotation.y = -a; L.g.add(f); };
      const k = new Kit(), rng = landRng(L.i), oa = L.oa;
      const at = (deg, r) => { const a = oa + (deg * Math.PI) / 180; return [Math.cos(a) * r, Math.sin(a) * r]; };
      const edge = (deg, m) => L.rOf(oa + (deg * Math.PI) / 180) - (m || 0);
      const prop = (x, z, r) => L.props.push({ x, z, r });
      // dải cong (sông, bờ đê): theo một dãy điểm
      const ribbon = (pts, wid, y, mat) => {
        const pos = [], idx = [];
        for (let s = 0; s < pts.length; s++) {
          const [x, z] = pts[s], [x2, z2] = pts[Math.min(pts.length - 1, s + 1)], [x0, z0] = pts[Math.max(0, s - 1)];
          const tx = x2 - x0, tz = z2 - z0, l = Math.hypot(tx, tz) || 1, nx = -tz / l, nz = tx / l;
          pos.push(x + (nx * wid) / 2, y, z + (nz * wid) / 2, x - (nx * wid) / 2, y, z - (nz * wid) / 2);
          if (s) { const b = s * 2; idx.push(b - 2, b - 1, b, b - 1, b + 1, b); }
        }
        const gg = new THREE.BufferGeometry(); gg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); gg.setIndex(idx); gg.computeVertexNormals();
        const me = new THREE.Mesh(gg, mat); me.receiveShadow = true; L.g.add(me); return me;
      };
      const waterMat = (col) => { const m = new THREE.MeshStandardMaterial({ color: col || '#4aa3c7', roughness: 0.15, metalness: 0.2, emissive: '#0c3b52', emissiveIntensity: 0.3, side: THREE.DoubleSide }); L.waterMats.push(m); return m; };
      if (L.ter === 'plains') {
        // đồng bằng: ruộng bậc ô vuông vàng xanh ở hai cánh, đồng cỏ săn ở giữa, sông uốn khúc đổ thành thác
        for (const side of [-1, 1]) for (let ai = 0; ai < 7; ai++) for (let ri = 0; ri < 4; ri++) {
          const deg = side * (48 + ai * 9.5), r = 22 + ri * 3.6;
          if (r > edge(deg, 2.4)) continue;
          const [x, z] = at(deg, r), c = pick(['#d9c35a', '#9fcf62', '#c8d86a', '#7fb6a8', '#e3cf73', '#86bf5c'], hash(L.i * 31 + ai * 7 + ri * 3 + side));
          k.box(c, x, 0.02, z, 3.3, 0.07, 3.3, -(oa + (deg * Math.PI) / 180)); k.box('#7d6a4a', x, 0.03, z, 3.5, 0.05, 0.16, -(oa + (deg * Math.PI) / 180));
          if (c === '#7fb6a8') k.box('#bfe6f2', x, 0.075, z, 2.9, 0.01, 2.9, -(oa + (deg * Math.PI) / 180));
          if (hash(ai * 13 + ri + side) < 0.18) { k.cone('#d9b25a', x + 0.8, 0.07, z - 0.6, 0.6, 1.1, 8); }
          prop(x, z, 1.9);
        }
        const pts = [];
        for (let s = 0; s <= 40; s++) { const u = s / 40, d = -36 + u * 72, r = 24 + 5 * Math.sin(u * Math.PI * 2.5) + u * 10; pts.push(at(d, Math.min(edge(d, 0.6), r))); }
        ribbon(pts, 6.2, 0.03, new THREE.MeshStandardMaterial({ color: '#c9b48a', roughness: 0.9, flatShading: true, side: THREE.DoubleSide }));
        ribbon(pts, 4.0, 0.08, waterMat());
        L.river = pts; fall(oa + (36 * Math.PI) / 180, 4);
        for (let i = 0; i < 26; i++) { const [x, z] = at((rng() - 0.5) * 70, 25 + rng() * 8); if (L.inside(x, z, 1)) k.cone(pick(['#b7c46a', '#a7b85e', '#c9cf74'], rng()), x, 0, z, 0.35, 0.7 + rng() * 0.6, 5); }
      }
      if (L.ter === 'forest') {
        // rừng: đồi thấp phủ cây, cây mẹ ngàn năm, suối và thác
        for (let i = 0; i < 7; i++) {
          const deg = -70 + i * 23 + (rng() - 0.5) * 10, r = 26 + rng() * 6, [x, z] = at(deg, Math.min(edge(deg, 5), r)), R = 3.6 + rng() * 2.2, h = 2 + rng() * 2.2;
          k.add(SPHG(), pick(['#4f7f3f', '#5a8a45', '#46733a'], rng()), x, -0.2, z, R, h, R * 0.9, rng() * 3);
          for (let t = 0; t < 7; t++) { const a = rng() * TAU, rr = rng() * R * 0.8, tx = x + Math.cos(a) * rr, tz = z + Math.sin(a) * rr, yy = h * Math.sqrt(Math.max(0, 1 - (rr / R) ** 2)) - 0.3; k.cone(pick(['#2f6b3f', '#3f7a4c', '#356b43'], rng()), tx, yy, tz, 0.9 + rng() * 0.5, 2.4 + rng() * 1.4, 7); }
          prop(x, z, R);
        }
        { const [x, z] = at(4, Math.min(edge(4, 6), 29)); k.tcyl('#5b4630', x, 0, z, 2.0, 1.2, 15, 9); for (let b = 0; b < 4; b++) { const a = b * 1.57 + 0.4; k.add(UCYL(6), '#5b4630', x + Math.cos(a) * 1.6, 0, z + Math.sin(a) * 1.6, 0.5, 3, 0.5, 0, Math.sin(a) * 0.6, -Math.cos(a) * 0.6); } for (let c2 = 0; c2 < 6; c2++) { const a = c2 * 1.05; k.blob(ICO(), pick(['#3f7a4c', '#4a8a55', '#2f6b3f'], c2 * 0.17), x + Math.cos(a) * 3.2, 15 + (c2 % 2) * 1.6, z + Math.sin(a) * 3.2, 3.6, 0.8); } k.blob(ICO(), '#4a8a55', x, 17.5, z, 3.4, 0.9); prop(x, z, 3.2); L.motherTree = [x, z]; }
        const pts = [];
        for (let s = 0; s <= 30; s++) { const u = s / 30, d = 40 + u * 40, r = 18 + u * 18 + Math.sin(u * 9) * 1.2; pts.push(at(d, Math.min(edge(d, 0.6), r))); }
        ribbon(pts, 3.2, 0.03, new THREE.MeshStandardMaterial({ color: '#6b5a3a', roughness: 0.9, flatShading: true, side: THREE.DoubleSide }));
        ribbon(pts, 2.0, 0.08, waterMat('#3f9cc6'));
        L.river = pts; fall(oa + (80 * Math.PI) / 180, 2.6);
        for (let i = 0; i < 40; i++) { const [x, z] = at((rng() - 0.5) * 200, 12 + rng() * 26); if (L.inside(x, z, 1) && !L.blockedWild(x, z, 0.5)) k.cone(pick(['#4f8f45', '#5f9f4a', '#3f7a4c'], rng()), x, 0, z, 0.45, 0.6, 5); }
      }
      if (L.ter === 'mountain') {
        // núi: dãy đỉnh tuyết phía ngoài, một cao nguyên có bậc đá, hồ núi, đá lở
        for (let m = 0; m < 11; m++) {
          const d = -95 + m * 19 + (rng() - 0.5) * 8, r = Math.min(edge(d, 4), 29 + rng() * 6), [x, z] = at(d, r), hgt = 13 + rng() * 13 - Math.abs(d) * 0.04, rad = 4.6 + rng() * 2.8;
          k.cone(pick(['#8b8577', '#7f7a6e', '#948d7e'], rng()), x, 0, z, rad, hgt, 7, rng() * 3);
          k.cone('#f4f7f9', x, hgt * 0.62, z, rad * 0.38, hgt * 0.38 + 0.05, 7, rng() * 3);
          prop(x, z, rad * 0.9);
        }
        { const [x, z] = at(-28, 24); k.tcyl('#8f8a7c', x, 0, z, 6.2, 5.8, 4.2, 9); k.cyl('#8fa274', x, 4.2, z, 5.8, 0.12, 9); for (let s = 0; s < 6; s++) k.box('#a39b8e', x + 5.6 + s * 0.05, s * 0.7, z - 2 + s * 0.65, 1.6, 0.7, 1.2, -(oa - 0.49)); prop(x, z, 6.4); L.plateau = [x, z, 4.3]; }
        water(new THREE.CircleGeometry(4.6, 20), ...at(30, 22), 0, 0.07, '#7fb9cf'); L.lake = at(30, 22); prop(...L.lake, 4.8);
        for (let b = 0; b < 26; b++) { const [x, z] = at((rng() - 0.5) * 190, 20 + rng() * 14); if (L.inside(x, z, 1) && !L.blockedWild(x, z, 0.5)) k.blob(DOD(), pick(['#8b8577', '#7c776b', '#9d9589'], rng()), x, 0.2, z, 0.4 + rng() * 0.9, 0.7); }
      }
      if (L.ter === 'tundra') {
        // băng nguyên: hồ đóng băng, sống băng, vách sông băng, khe nứt, mảng băng trôi tách khỏi đảo
        water(new THREE.CircleGeometry(6.2, 24), ...at(-22, 23), 0, 0.06, '#cfeaf5'); L.lake = at(-22, 23); prop(...L.lake, 6.4);
        { const [x, z] = at(8, Math.min(edge(8, 4), 32)); for (let i = 0; i < 9; i++) k.add(OCT(), pick(['#cfeaf5', '#e6f6fb', '#b9e0ef'], rng()), x + (i - 4) * 1.8, 0, z + (rng() - 0.5) * 2, 1.6 + rng(), 4 + rng() * 5, 1.4, -(oa + 0.14) + rng() * 0.4); prop(x, z, 8); }
        for (let i = 0; i < 16; i++) { const d = (rng() - 0.5) * 180, [x, z] = at(d, 18 + rng() * 14); if (L.inside(x, z, 1) && !L.blockedWild(x, z, 1)) { k.blob(OCT(), pick(['#bfe3f2', '#d6eef7', '#a9d6ea'], rng()), x, 0.3, z, 0.7 + rng() * 1.1, 1.6); } }
        for (let i = 0; i < 10; i++) { const d = (rng() - 0.5) * 220, r0 = 14 + rng() * 8, [x0, z0] = at(d, r0), [x1, z1] = at(d + (rng() - 0.5) * 20, Math.min(edge(d, 0.5), r0 + 8 + rng() * 8)); const len = Math.hypot(x1 - x0, z1 - z0); k.box('#7fa7c0', (x0 + x1) / 2, 0.015, (z0 + z1) / 2, 0.18, 0.03, len, Math.atan2(x1 - x0, z1 - z0)); }
        for (let i = 0; i < 12; i++) { const [x, z] = at((rng() - 0.5) * 240, 10 + rng() * 26); if (L.inside(x, z, 1)) k.add(SPHG(), '#f4f8fb', x, -0.05, z, 1.6 + rng() * 1.6, 0.5 + rng() * 0.5, 1.2 + rng(), rng() * 3); }
        // mảng băng trôi bên ngoài mép đảo
        L.floes = [];
        for (let i = 0; i < 4; i++) { const d = -60 + i * 40 + (rng() - 0.5) * 10, r = edge(d) + 4 + rng() * 4, [x, z] = at(d, r), R = 2 + rng() * 2.2; k.cyl('#e9f3f8', x, -0.8, z, R, 0.8, 7); k.cone('#cfe6f1', x, -0.8, z, R * 0.95, -3 - rng() * 3, 7); if (rng() < 0.6) k.add(OCT(), '#d6eef7', x, -0.1, z, 0.8, 1.6, 0.8); L.floes.push([x, z, R]); }
        L.aurora = true;
      }
      if (L.ter === 'coast') {
        // biển: đầm phá xanh ngọc khoét vào nửa ngoài, đảo nhỏ có dừa, san hô dưới nước, bãi cát dài
        const lagoon = at(0, 26), LR = 9.5;
        flat(new THREE.CircleGeometry(LR + 2.6, 40), lagoon[0], lagoon[1], 0.03, '#ecd9a8');
        const lw = water(new THREE.CircleGeometry(LR, 40), lagoon[0], lagoon[1], 0, 0.1, '#3fc0c8', 0.78);
        lw.renderOrder = 2;
        for (let i = 0; i < 26; i++) { const a = rng() * TAU, r = rng() * (LR - 1.2); k.blob(ICO(), pick(['#ff8f7a', '#ffb36b', '#e97ab0', '#7fd1c6', '#f4e3a1', '#c46a9a'], rng()), lagoon[0] + Math.cos(a) * r, 0.02, lagoon[1] + Math.sin(a) * r, 0.25 + rng() * 0.35, 0.6); }
        for (const [dx, dz, R] of [[-3.2, 2.2, 1.6], [3.6, -1.2, 1.3], [0.6, -4.4, 1.1]]) { k.add(SPHG(), '#ecd9a8', lagoon[0] + dx, 0, lagoon[1] + dz, R, 0.35, R); k.add(UCYL(5), '#8a6a46', lagoon[0] + dx, 0.2, lagoon[1] + dz, 0.12, 2.4, 0.12, 0, 0.18, 0.1); k.blob(ICO(), '#5f9f4a', lagoon[0] + dx + 0.4, 2.6, lagoon[1] + dz + 0.2, 1.1, 0.3); }
        prop(lagoon[0], lagoon[1], LR + 1.6); L.lagoon = [lagoon[0], lagoon[1], LR];
        const sandPts = []; for (let s = 0; s <= 50; s++) { const d = -120 + s * 4.8; sandPts.push(at(d, edge(d, 2.4))); }
        ribbon(sandPts, 4.6, 0.025, new THREE.MeshStandardMaterial({ color: '#ecd9a8', roughness: 0.95, flatShading: true, side: THREE.DoubleSide }));
        for (let b = 0; b < 4; b++) { const [x, z] = at(-80 + b * 52, edge(-80 + b * 52, 3)); k.box('#8f6a46', x, 0.05, z, 1.6, 0.35, 0.7, rng() * 3); k.cyl('#6d5139', x, 0.3, z, 0.04, 1.6, 4); }
        for (let r2 = 0; r2 < 12; r2++) { const d = -110 + rng() * 220, [x, z] = at(d, edge(d, 0.8)); k.blob(DOD(), '#7d7a74', x, 0.2, z, 0.6 + rng() * 0.8, 0.7); }
        fall(oa, 5, '#7fd8e6');
      }
      if (L.ter === 'desert') {
        // sa mạc: đồi cát gợn sóng, mỏm đá đỏ đầu bằng, hẻm núi, ốc đảo
        for (let d = 0; d < 9; d++) {
          const deg = -80 + d * 20 + rng() * 6, r = 24 + rng() * 7, [x, z] = at(deg, Math.min(edge(deg, 4), r)), len = 5 + rng() * 4, ry = -(oa + (deg * Math.PI) / 180) + Math.PI / 2 + (rng() - 0.5) * 0.5;
          k.add(GABLE(), pick(['#e3bd7f', '#dcb479', '#e8c48a'], rng()), x, 0, z, len, 1.4 + rng() * 1.4, 3.2 + rng() * 1.6, ry);
          k.add(GABLE(), '#d4a86c', x + 0.4, 0, z + 0.4, len * 0.9, 1.0 + rng(), 2.4, ry);
          prop(x, z, len * 0.45);
        }
        for (let m = 0; m < 4; m++) { const deg = -70 + m * 46 + rng() * 10, [x, z] = at(deg, Math.min(edge(deg, 4), 31 + rng() * 3)), R = 3.2 + rng() * 1.8, h = 6 + rng() * 6; for (let j = 0; j < 4; j++) k.tcyl(pick(['#c98a5a', '#a8603e', '#b87b4f', '#d99a62'], j * 0.27 + m * 0.1), x, (h / 4) * j, z, R * (1 - j * 0.04), R * (1 - (j + 1) * 0.04), h / 4, 8); prop(x, z, R); }
        { const pts = []; for (let s = 0; s <= 24; s++) { const u = s / 24, d = -10 + u * 34, r = 20 + u * 18; pts.push(at(d, Math.min(edge(d, 0.4), r))); } ribbon(pts, 3.4, 0.02, new THREE.MeshStandardMaterial({ color: '#7a3f2a', roughness: 1, flatShading: true, side: THREE.DoubleSide })); ribbon(pts, 1.4, 0.035, new THREE.MeshStandardMaterial({ color: '#4a2a1e', roughness: 1, flatShading: true, side: THREE.DoubleSide })); L.canyon = pts; }
        water(new THREE.CircleGeometry(3.4, 16), ...at(62, 20), 0, 0.07, '#3fb0b8'); L.oasis = at(62, 20); prop(...L.oasis, 3.6);
      }
      if (k.b.length || k.l.length) meshOf(k, L.litMat || bodyMat, L.g, 0, 0, 0);
      // bãi săn: vùng hoang phía ngoài; bãi tập kết quân: một khoảng đất nện cạnh đường ra cổng
      L.hunt = { oa, spread: 1.05, r0: 23, margin: 3 };
    }
    const SPHG = () => base('sphg', () => new THREE.SphereGeometry(1, 10, 6, 0, TAU, 0, Math.PI / 2));

    /* =============== Cây: một bộ instanced cho mỗi miền =============== */
    const trunkGeo = (() => { const g = new THREE.CylinderGeometry(0.11, 0.17, 1, 6); g.translate(0, 0.5, 0); return g; })();
    const coneGeo = (() => { const g = new THREE.ConeGeometry(1, 1, 7); g.translate(0, 0.5, 0); return g; })();
    const icoGeo = new THREE.IcosahedronGeometry(1, 0);
    const SEASON_LEAF = [['#a9e07c', 0.4], [null, 0], ['autumn', 1], ['#e8eef2', 0.6]];
    function plantTrees(L) {
      const rng = landRng(L.i + 40), list = [];
      const oa = Math.atan2(L.out.z, L.out.x);
      const ok = (x, z, r) => {
        const d = Math.hypot(x, z);
        if (!L.inside(x, z, 1.2) || d < 7.5) return false;
        if (L.blocked(x, z, r)) return false;
        for (const t of list) if ((t.x - x) ** 2 + (t.z - z) ** 2 < (t.r + r) ** 2) return false;
        return true;
      };
      const dens = { plains: 200, forest: 520, mountain: 230, tundra: 150, coast: 150, desert: 60 }[L.ter];
      for (let n = 0; n < dens * 8 && list.length < dens; n++) {
        const a = rng() * TAU, r = Math.sqrt(rng()) * LAND_R * 1.12, x = Math.cos(a) * r, z = Math.sin(a) * r;
        const s = 0.75 + rng() * 0.75;
        if (!ok(x, z, 0.9 * s)) continue;
        let kind;
        const rel = Math.abs(Math.atan2(Math.sin(a - oa), Math.cos(a - oa))), wild = r > 21 && rel < 1.4;
        if (L.ter === 'forest') kind = rng() < 0.55 ? 'conifer' : 'broad';
        else if (L.ter === 'plains') kind = rng() < 0.2 ? 'conifer' : rng() < 0.85 ? 'broad' : 'blossom';
        else if (L.ter === 'mountain') kind = 'conifer';
        else if (L.ter === 'tundra') kind = 'snowpine';
        else if (L.ter === 'coast') kind = wild ? 'palm' : rng() < 0.5 ? 'palm' : 'broad';
        else { const nearOasis = L.oasis && Math.hypot(x - L.oasis[0], z - L.oasis[1]) < 8; kind = nearOasis ? 'palm' : rng() < 0.7 ? 'cactus' : 'shrub'; if (!nearOasis && rng() < 0.55) continue; }
        list.push({ x, z, r: 0.9 * s, s, kind, rot: rng() * TAU, tilt: kind === 'palm' ? (rng() - 0.5) * 0.4 : 0, shade: rng(), hidden: false });
      }
      const N = list.length;
      const trunks = new THREE.InstancedMesh(trunkGeo, new THREE.MeshStandardMaterial({ flatShading: true, roughness: 0.9 }), N);
      const cones = new THREE.InstancedMesh(coneGeo, new THREE.MeshStandardMaterial({ flatShading: true, roughness: 0.85 }), N);
      const icos = new THREE.InstancedMesh(icoGeo, new THREE.MeshStandardMaterial({ flatShading: true, roughness: 0.85 }), N);
      for (const m of [trunks, cones, icos]) { m.castShadow = true; m.receiveShadow = true; L.g.add(m); }
      L.trees = { list, trunks, cones, icos };
      for (let n = 0; n < N; n++) placeTree(L, n);
      for (const m of [trunks, cones, icos]) m.instanceMatrix.needsUpdate = true;
      treeColors(L, [0, 1, 0, 0]);
    }
    const _o = new THREE.Object3D(), ZERO = new THREE.Matrix4().makeScale(0, 0, 0);
    function placeTree(L, n) {
      const t = L.trees.list[n], T = L.trees, s = t.s;
      if (t.hidden) { T.trunks.setMatrixAt(n, ZERO); T.cones.setMatrixAt(n, ZERO); T.icos.setMatrixAt(n, ZERO); return; }
      _o.position.set(t.x, 0, t.z); _o.rotation.set(t.tilt, t.rot, 0);
      const set = (mesh, sx, sy, sz, y) => { _o.position.y = y; _o.scale.set(sx, sy, sz); _o.updateMatrix(); mesh.setMatrixAt(n, _o.matrix); };
      if (t.kind === 'conifer' || t.kind === 'snowpine') { set(T.trunks, s, 1.1 * s, s, 0); set(T.cones, 0.95 * s, 2.6 * s, 0.95 * s, 0.85 * s); T.icos.setMatrixAt(n, ZERO); }
      else if (t.kind === 'broad' || t.kind === 'blossom') { set(T.trunks, s, 1.3 * s, s, 0); set(T.icos, 1.05 * s, 1.0 * s, 1.05 * s, 1.9 * s); T.cones.setMatrixAt(n, ZERO); }
      else if (t.kind === 'palm') { set(T.trunks, 0.7 * s, 3.0 * s, 0.7 * s, 0); set(T.icos, 1.25 * s, 0.32 * s, 1.25 * s, 3.0 * s); T.cones.setMatrixAt(n, ZERO); }
      else if (t.kind === 'cactus') { set(T.trunks, 2.2 * s, 1.7 * s, 2.2 * s, 0); T.cones.setMatrixAt(n, ZERO); T.icos.setMatrixAt(n, ZERO); }
      else { set(T.icos, 0.55 * s, 0.4 * s, 0.55 * s, 0.25 * s); T.trunks.setMatrixAt(n, ZERO); T.cones.setMatrixAt(n, ZERO); }
    }
    const LEAF = { conifer: ['#3f7a4c', '#4a8a55', '#356b43'], broad: ['#5b9a52', '#6aa85a', '#4f8d48'], blossom: ['#e39ab3', '#f0b86e', '#c9a0e0'], palm: ['#5f9f4a', '#6aa85a'], snowpine: ['#e9f0f3', '#d8e4ea'], shrub: ['#9aa060', '#8a9455'] };
    function treeColors(L, w) {
      const T = L.trees, tmp = new THREE.Color();
      const sw = w || [1, 0, 0, 0];
      T.list.forEach((t, n) => {
        const leaf = C(pick(LEAF[t.kind] || LEAF.broad, t.shade));
        if (TSTYLE[L.ter].season && (t.kind === 'broad' || t.kind === 'blossom' || t.kind === 'conifer')) {
          const sp = leaf.clone().lerp(C('#a9e07c'), 0.35), au = t.kind === 'conifer' ? leaf.clone().lerp(C('#2e5a3a'), 0.3) : C(pick(['#d9822b', '#c4512f', '#e0b23a', '#b8642a'], t.shade)), wi = leaf.clone().lerp(C('#eef3f6'), t.kind === 'conifer' ? 0.5 : 0.75);
          const cs = [sp, leaf, au, wi];
          tmp.setRGB(0, 0, 0); for (let s = 0; s < 4; s++) if (sw[s]) { tmp.r += cs[s].r * sw[s]; tmp.g += cs[s].g * sw[s]; tmp.b += cs[s].b * sw[s]; }
        } else tmp.copy(leaf);
        T.cones.setColorAt(n, tmp); T.icos.setColorAt(n, tmp);
        T.trunks.setColorAt(n, C(t.kind === 'cactus' ? '#5d8f4a' : t.kind === 'palm' ? '#8a6a46' : '#6b4b32'));
      });
      for (const m of [T.trunks, T.cones, T.icos]) if (m.instanceColor) m.instanceColor.needsUpdate = true;
    }
    function clearTrees(L, x, z, r) {
      let any = false;
      L.trees.list.forEach((t, n) => { if (!t.hidden && (t.x - x) ** 2 + (t.z - z) ** 2 < (r + t.r * 0.6) ** 2) { t.hidden = true; placeTree(L, n); any = true; } });
      if (any) for (const m of [L.trees.trunks, L.trees.cones, L.trees.icos]) m.instanceMatrix.needsUpdate = true;
    }

    /* =============== Bố trí lô đất của mỗi miền =============== */
    function layout(L) {
      const taken = [];
      const roadsSeg = L.landing.map((p) => [new THREE.Vector2(0, 0), new THREE.Vector2(p.x, p.z)]);
      roadsSeg.push([new THREE.Vector2(L.bankPos.x * 1.3, L.bankPos.z * 1.3), new THREE.Vector2(L.harbor.x, L.harbor.z)]);
      const segDist = (x, z, a, b) => { const abx = b.x - a.x, abz = b.y - a.y, t = clamp(((x - a.x) * abx + (z - a.y) * abz) / (abx * abx + abz * abz), 0, 1); return Math.hypot(x - (a.x + abx * t), z - (a.y + abz * t)); };
      const oa = Math.atan2(L.out.z, L.out.x);
      const wildAt = (x, z) => { const r = Math.hypot(x, z), a = Math.atan2(z, x), rel = Math.abs(Math.atan2(Math.sin(a - oa), Math.cos(a - oa))); return r > 21.5 && rel < 1.12; };
      L.roadDist = (x, z) => Math.min(...roadsSeg.map(([a, b]) => segDist(x, z, a, b)));
      L.wildAt = wildAt;
      // chỗ dành sẵn: quảng trường, ngân hàng, trường, mỏ
      taken.push({ x: 0, z: 0, r: 7.4 }, { x: L.bankPos.x, z: L.bankPos.z, r: 4.2 }, { x: L.schoolPos.x, z: L.schoolPos.z, r: 4.2 }, { x: L.minePos.x, z: L.minePos.z, r: 4.4 });
      taken.push({ x: L.dockPos.x, z: L.dockPos.z, r: 3.6 }, { x: L.portPos.x, z: L.portPos.z, r: 4.4 });
      for (const k2 of ['eco', 'hea', 'rel', 'tra', 'mil']) taken.push({ x: L.slots[k2].x, z: L.slots[k2].z, r: 4.6 });
      taken.push({ x: L.musterPos.x, z: L.musterPos.z, r: 6.2 }, { x: L.wonderPos.x, z: L.wonderPos.z, r: 4.2 }, { x: L.siloPos.x, z: L.siloPos.z, r: 3.2 });
      for (const t of L.towerPos) taken.push({ x: t.x, z: t.z, r: 1.7 });
      L.blocked = (x, z, r) => {
        if (Math.hypot(x, z) < 6.6 + r) return true;
        if (L.roadDist(x, z) < 1.6 + r) return true;
        if (Math.hypot(x - L.bankPos.x, z - L.bankPos.z) < 3.4 + r || Math.hypot(x - L.schoolPos.x, z - L.schoolPos.z) < 3.4 + r) return true;
        if (L.river) for (const [px, pz] of L.river) if ((px - x) ** 2 + (pz - z) ** 2 < (3.4 + r) ** 2) return true;
        if (L.lake && Math.hypot(x - L.lake[0], z - L.lake[1]) < 4.6 + r) return true;
        if (L.oasis && Math.hypot(x - L.oasis[0], z - L.oasis[1]) < 3.6 + r) return true;
        if (Math.hypot(x - L.dockPos.x, z - L.dockPos.z) < 3.4 + r || Math.hypot(x - L.portPos.x, z - L.portPos.z) < 4.2 + r) return true;
        if (L.blockedWild(x, z, r) || Math.hypot(x - L.musterPos.x, z - L.musterPos.z) < 6 + r) return true;
        for (const k2 in L.slots) if (Math.hypot(x - L.slots[k2].x, z - L.slots[k2].z) < 4.2 + r) return true;
        return false;
      };
      const free = (x, z, r) => L.inside(x, z, 1.6 + r * 0.4) && !wildAt(x, z) && !L.blocked(x, z, r) && taken.every((t) => (t.x - x) ** 2 + (t.z - z) ** 2 > (t.r + r) ** 2);
      function hexLots(r, gap, cap, accept) {
        const sp = 2 * r + gap, out = [];
        for (let j = -12; j <= 12; j++) {
          const z = j * sp * 0.866;
          for (let i2 = -14; i2 <= 14; i2++) {
            const x = i2 * sp + (j % 2 ? sp / 2 : 0);
            const jx = x + (hash(L.i * 91 + j * 31 + i2) - 0.5) * gap, jz = z + (hash(L.i * 77 + j * 17 + i2 * 3) - 0.5) * gap;
            if (accept(jx, jz) && free(jx, jz, r)) out.push(new THREE.Vector3(jx, 0, jz));
          }
        }
        return out;
      }
      const near = (pts, cap, key) => { pts.sort((a, b) => key(a) - key(b)); const res = []; for (const p of pts) { if (res.length >= cap) break; if (taken.every((t) => (t.x - p.x) ** 2 + (t.z - p.z) ** 2 > (t.r + p.r) ** 2)) { taken.push({ x: p.x, z: p.z, r: p.r }); res.push(p); } } return res; };
      // tám lô cho công trình quân sự và kinh tế, rải đều trên vành ngoài khu dân cư
      const ml = hexLots(3.0, 0.6, 0, (x, z) => { const r = Math.hypot(x, z); return r > 19 && r < 32; }).map((p) => Object.assign(p, { r: 3.0 }));
      ml.sort((a, b) => Math.abs(a.length() - 25.5) - Math.abs(b.length() - 25.5));
      L.milLots = [];
      for (const gap of [7.4, 6.4, 5.6]) for (const p of ml) { if (L.milLots.length >= 8) break; if (!L.milLots.includes(p) && L.milLots.every((q) => q.distanceTo(p) > gap)) L.milLots.push(p); }
      for (const p of L.milLots) taken.push({ x: p.x, z: p.z, r: 3.2 });
      L.milLot = {};
      ['barracks', 'range', 'stable', 'siege', 'forge', 'granary', 'academy', 'market'].forEach((key, i) => { L.milLot[key] = L.milLots[i % Math.max(1, L.milLots.length)]; });
      const sh = hexLots(2.8, 0.4, 0, (x, z) => L.roadDist(x, z) < 6.5 && Math.hypot(x, z) > 8).map((p) => Object.assign(p, { r: 2.8 }));
      L.shopLots = near(sh, 16, (p) => Math.hypot(p.x, p.z));
      const fm = hexLots(3.4, 0.3, 0, (x, z) => Math.hypot(x, z) > 15).map((p) => Object.assign(p, { r: 3.4 }));
      L.farmLots = near(fm, 12, (p) => Math.abs(Math.hypot(p.x, p.z) - 21));
      const hs = hexLots(2.05, 0.3, 0, (x, z) => Math.hypot(x, z) > 7.4).map((p) => Object.assign(p, { r: 2.05 }));
      L.houseLots = near(hs, 110, (p) => Math.hypot(p.x, p.z)).map((p) => ({ p, used: false }));
      L.farmOwner = L.farmLots.map(() => null); L.shopOwner = L.shopLots.map(() => null);
    }

    /* =============== Một miền đất =============== */
    const lands = [];
    function makeLand(i) {
      const T = Sim.TERRAINS[i], ang = Math.PI / 2 + i * (Math.PI / 3);
      const out = new THREE.Vector3(Math.cos(ang), 0, Math.sin(ang)), inw = out.clone().negate();
      const center = out.clone().multiplyScalar(RING);
      const g = new THREE.Group(); g.position.copy(center); scene.add(g);
      const L = { i, T, ter: T.key, ang, out, inw, center, g, era: -1, shown: false, houses: [], firmObj: new Map(), slotOf: new Map(), queue: [], civic: {}, decor: [], lamps: [], glows: [], spins: [], smokes: [], fires: [] };
      L.litMat = new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.4, emissive: '#ffcf7a', emissiveIntensity: 0 });
      L.landing = [(i + 5) % 6, (i + 1) % 6].map((j) => { const a = Math.PI / 2 + j * (Math.PI / 3); return new THREE.Vector3(Math.cos(a) * RING - center.x, 0, Math.sin(a) * RING - center.z).normalize().multiplyScalar(LAND_R - 0.4); });
      L.neighbors = [(i + 5) % 6, (i + 1) % 6];
      L.bankPos = inw.clone().multiplyScalar(10.5); L.schoolPos = out.clone().multiplyScalar(10.5);
      const ma = ang + (T.key === 'coast' ? 2.65 : 1.3), mr = (T.key === 'coast' ? 14 : 19.5) * SC;
      L.minePos = new THREE.Vector3(Math.cos(ma) * mr, 0, Math.sin(ma) * mr); // nơi mạch vàng có thể lộ ra
      // bờ trong nhìn ra biển: bến cá, cảng buôn và tháp canh bến; phía ngoài hoang dã: kỳ quan và hầm phóng
      const ia = Math.atan2(inw.z, inw.x), oa2 = Math.atan2(out.z, out.x), at2 = (a, r) => new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r);
      L.dockPos = at2(ia - 0.19, LAND_R - 3.6); L.portPos = at2(ia + 0.21, LAND_R - 4.6); L.harbor = at2(ia, LAND_R - 7.2);
      L.wonderPos = at2(oa2 - 0.62, 22); L.siloPos = at2(oa2 + 0.66, 23);
      L.gates = L.landing.map((p) => p.clone().multiplyScalar(0.86));
      L.towerPos = [...L.gates.map((g2) => g2.clone().add(new THREE.Vector3(-g2.z, 0, g2.x).normalize().multiplyScalar(2.8))), at2(ia + 0.02, LAND_R - 2.6)];
      // bãi tập kết quân và sáu công trình trụ cột của miền (giáo dục đứng ở chỗ của trường)
      L.musterPos = at2(ia + 1.62, 27); L.musterRy = -(ia + 1.62) + Math.PI / 2;
      L.slots = { eco: at2(ia - 0.5, 14.5), hea: at2(ia + 0.5, 14.5), rel: at2(ia + 2.3, 14), tra: at2(ia - 2.3, 14), mil: at2(ia + 1.62, 16), edu: L.schoolPos.clone() };
      terrain(L);
      layout(L);
      plantTrees(L);
      clearTrees(L, L.minePos.x, L.minePos.z, 3.6);
      people(L);
      L.world = (p) => p.clone().add(center);
      lands.push(L);
      return L;
    }

    /* =============== Nhân vật có khớp: chân tay cử động bằng shader, quần áo theo thời đại =============== */
    // Mỗi đỉnh mang mã chi (0 thân, 1 chân trái, 2 chân phải, 3 tay trái, 4 tay phải) và mã màu (0 màu sẵn, 1 áo, 2 quần,
    // 3 tóc hay mũ, 4 da). Mỗi bản sao có pha bước, độ bước, độ vung tay đánh, tốc độ, và bốn màu riêng.
    const FIG_UNI = { uTime: { value: 0 } };
    function figMaterial() {
      // nhân vật tròn: tô mịn (không tô phẳng), pháp tuyến quay theo chân tay để ánh sáng tròn trịa khi bước
      const m = new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: false, roughness: 0.62, metalness: 0.03 });
      m.onBeforeCompile = (sh) => {
        sh.uniforms.uTime = FIG_UNI.uTime;
        sh.vertexShader = 'attribute float limb;\nattribute float slot;\nattribute vec4 anim;\nattribute vec3 cA;\nattribute vec3 cB;\nattribute vec3 cC;\nattribute vec3 cD;\nuniform float uTime;\n' + sh.vertexShader
          .replace('#include <color_vertex>', '#include <color_vertex>\n#ifdef USE_COLOR\nif (slot > 0.5 && slot < 1.5) vColor = cA; else if (slot > 1.5 && slot < 2.5) vColor = cB; else if (slot > 2.5 && slot < 3.5) vColor = cC; else if (slot > 3.5) vColor = cD;\n#endif')
          .replace('#include <beginnormal_vertex>', [
            'vec3 objectNormal = vec3(normal);',
            'float fAng = 0.0; float fPv = 0.0;',
            'if (limb > 0.5) {',
            '  float ph = uTime * (5.5 + anim.w * 5.0) + anim.x;',
            '  float sd = (limb < 1.5 || (limb > 2.5 && limb < 3.5)) ? 1.0 : -1.0;',
            '  if (limb < 2.5) { fAng = sin(ph) * 0.6 * anim.y * sd; fPv = 0.46; }',
            '  else { fAng = -sin(ph) * 0.5 * anim.y * sd; fPv = 0.84; if (limb > 3.5) fAng -= (0.7 + 0.7 * sin(uTime * 9.0 + anim.x)) * anim.z; else fAng -= 0.35 * anim.z; }',
            '  float c0 = cos(fAng); float s0 = sin(fAng);',
            '  objectNormal = vec3(objectNormal.x, objectNormal.y * c0 - objectNormal.z * s0, objectNormal.y * s0 + objectNormal.z * c0);',
            '}',
          ].join('\n'))
          .replace('#include <begin_vertex>', [
            'vec3 transformed = vec3(position);',
            'if (limb > 0.5) {',
            '  float c = cos(fAng); float s = sin(fAng);',
            '  vec3 p = transformed - vec3(0.0, fPv, 0.0);',
            '  transformed = vec3(p.x, p.y * c - p.z * s, p.y * s + p.z * c) + vec3(0.0, fPv, 0.0);',
            '} else {',
            '  transformed.y += abs(sin(uTime * (5.5 + anim.w * 5.0) + anim.x)) * 0.035 * anim.y;', // nhún người khi bước
            '}',
          ].join('\n'));
      };
      return m;
    }
    function FigKit() { this.parts = []; }
    FigKit.prototype.add = function (g0, color, slot, limb, x, y, z, sx, sy, sz, ry, rx, rz) {
      const g = g0.index ? g0.toNonIndexed() : g0.clone();
      if (g.attributes.uv) g.deleteAttribute('uv');
      _e.set(rx || 0, ry || 0, rz || 0, 'YXZ'); _q.setFromEuler(_e); _s.set(sx, sy, sz);
      g.applyMatrix4(_m.compose(_p.set(x, y, z), _q, _s));
      _c.set(color);
      const n = g.attributes.position.count, col = new Float32Array(n * 3), lb = new Float32Array(n).fill(limb), sl = new Float32Array(n).fill(slot);
      for (let i = 0; i < n; i++) { col[i * 3] = _c.r; col[i * 3 + 1] = _c.g; col[i * 3 + 2] = _c.b; }
      g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.setAttribute('limb', new THREE.BufferAttribute(lb, 1)); g.setAttribute('slot', new THREE.BufferAttribute(sl, 1));
      this.parts.push(g);
      return this;
    };
    FigKit.prototype.box = function (c, slot, limb, x, y, z, w, h, d, ry, rx, rz) { return this.add(UBOX(), c, slot, limb, x, y, z, w, h, d, ry, rx, rz); };
    // khối tròn: tâm (x, y, z), bán kính theo ba trục
    FigKit.prototype.ball = function (c, slot, limb, x, y, z, rx, ry, rz) { return this.add(BALL(), c, slot, limb, x, y, z, rx, ry, rz); };
    FigKit.prototype.bake = function () {
      let n = 0;
      for (const g of this.parts) n += g.attributes.position.count;
      const out = new THREE.BufferGeometry(), keys = [['position', 3], ['normal', 3], ['color', 3], ['limb', 1], ['slot', 1]];
      for (const [k, sz] of keys) {
        const arr = new Float32Array(n * sz);
        let o = 0;
        for (const g of this.parts) { if (g.attributes[k]) arr.set(g.attributes[k].array, o * sz); o += g.attributes.position.count; }
        out.setAttribute(k, new THREE.BufferAttribute(arr, sz));
      }
      for (const g of this.parts) g.dispose();
      out.computeBoundingSphere();
      return out;
    };
    const BALL = () => base('ball', () => new THREE.SphereGeometry(1, 10, 7));
    const BALLS = () => base('balls', () => new THREE.SphereGeometry(1, 7, 5));
    const CAPS = () => base('caps', () => { const g = new THREE.CylinderGeometry(1, 1, 1, 8, 1); g.translate(0, 0.5, 0); return g; });
    const SKIN_T = ['#f1d3b3', '#e8c4a0', '#d9a77e', '#c68d64', '#a8714e', '#8a5a3c'];
    /* ----- Nhân vật tròn kiểu hoạt hình: đầu to, mắt tròn, thân tròn, tay chân ngắn ----- */
    // mã chi: 0 thân, 1 chân trái, 2 chân phải, 3 tay trái, 4 tay phải; mã màu: 0 màu sẵn, 1 áo, 2 quần, 3 mũ hay tóc, 4 da
    function roundBase(k, o) {
      const shoe = o.shoe || '#5b4630';
      for (const [lb, sx] of [[1, -0.085], [2, 0.085]]) {
        k.add(BALLS(), shoe, o.bareFeet ? 4 : 0, lb, sx, 0.055, 0.035, 0.085, 0.062, 0.12);
        k.add(CAPS(), '#fff', o.bareLegs ? 4 : 2, lb, sx, 0.08, 0, 0.066, 0.4, 0.066);
      }
      k.ball('#fff', 1, 0, 0, 0.63, 0, 0.205, 0.235, 0.165);
      if (o.belt) k.add(TORUS(), o.belt, 0, 0, 0, 0.55, 0, 0.198, 0.198, 0.24, 0, Math.PI / 2, 0);
      for (const [lb, sx] of [[3, -1], [4, 1]]) {
        k.add(CAPS(), '#fff', o.bareArms ? 4 : 1, lb, sx * 0.215, 0.55, 0, 0.055, 0.27, 0.055, 0, 0, sx * 0.12);
        k.ball(o.glove || '#fff', o.glove ? 0 : 4, lb, sx * 0.245, 0.53, 0.01, 0.066, 0.066, 0.066);
      }
      // đầu, tai, mắt to, mũi tròn
      k.ball('#fff', 4, 0, 0, 1.06, 0, 0.215, 0.205, 0.2);
      for (const sx of [-1, 1]) {
        k.add(BALLS(), '#fff', 4, 0, sx * 0.205, 1.06, 0, 0.045, 0.05, 0.035);
        k.add(BALLS(), o.eyeW || '#ffffff', 0, 0, sx * 0.075, 1.09, 0.165, 0.05, 0.065, 0.04);
        k.add(BALLS(), o.eye || '#1d1d24', 0, 0, sx * 0.07, 1.085, 0.198, 0.026, 0.036, 0.018);
      }
      k.add(BALLS(), '#fff', 4, 0, 0, 1.03, 0.205, 0.045, 0.04, 0.04);
      if (o.mouth !== false) k.add(BALLS(), '#a5524a', 0, 0, 0, 0.965, 0.19, 0.045, 0.015, 0.012);
    }
    // mũ, tóc theo miền và thời đại
    function roundHat(k, kind, robe) {
      const hair = () => k.add(SPHG(), '#fff', 3, 0, 0, 1.085, -0.012, 0.226, 0.19, 0.218);
      switch (kind) {
        case 'wild': hair(); for (let i = 0; i < 5; i++) k.add(UCONE(4), '#fff', 3, 0, Math.cos(i * 1.3) * 0.12, 1.22, Math.sin(i * 1.3) * 0.1 - 0.04, 0.06, 0.12, 0.06, i, (i - 2) * 0.3, 0); break;
        case 'straw': hair(); k.add(UCONE(10), '#d9c27a', 0, 0, 0, 1.18, 0, 0.36, 0.2, 0.36); break; // nón lá
        case 'leaf': hair(); k.add(TORUS(), '#fff', 3, 0, 0, 1.14, 0, 0.215, 0.215, 0.6, 0, Math.PI / 2, 0); k.add(UCONE(4), '#5f9f4a', 0, 0, 0.1, 1.28, -0.05, 0.035, 0.18, 0.02, 0, -0.3, -0.4); break;
        case 'beanie': k.add(SPHG(), '#fff', 3, 0, 0, 1.1, -0.01, 0.228, 0.2, 0.222); k.add(TORUS(), '#fff', 3, 0, 0, 1.11, -0.01, 0.222, 0.222, 0.4, 0, Math.PI / 2, 0); k.add(BALLS(), '#f4f0e8', 0, 0, 0, 1.31, -0.02, 0.06, 0.06, 0.06); break;
        case 'fur': k.add(SPHG(), '#fff', 3, 0, 0, 0.98, -0.03, 0.262, 0.31, 0.258); k.add(TORUS(), '#f4f0e8', 0, 0, 0, 1.06, 0.14, 0.18, 0.2, 0.5, 0, 0.2, 0); break;
        case 'sailor': hair(); k.add(UCYL(12), '#fff', 3, 0, 0, 1.2, 0, 0.2, 0.08, 0.2); k.add(UCYL(12), '#2f4a6b', 0, 0, 0, 1.2, 0, 0.205, 0.025, 0.205); break;
        case 'turban': k.add(SPHG(), '#fff', 3, 0, 0, 1.1, -0.01, 0.232, 0.24, 0.226); k.add(TORUS(), '#fff', 3, 0, 0, 1.13, 0, 0.21, 0.21, 0.9, 0, Math.PI / 2, 0); k.add(BALLS(), '#e0b23a', 0, 0, 0, 1.2, 0.2, 0.03, 0.03, 0.02); break;
        case 'tricorn': hair(); k.add(UCONE(3), '#fff', 3, 0, 0, 1.2, 0, 0.27, 0.13, 0.27); break;
        case 'cap': hair(); k.add(SPHG(), '#fff', 3, 0, 0, 1.13, 0, 0.21, 0.13, 0.21); k.add(UCYL(10), '#fff', 3, 0, 0, 1.15, 0.12, 0.15, 0.02, 0.15); break;
        case 'hard': k.add(SPHG(), '#f2c641', 0, 0, 0, 1.12, 0, 0.232, 0.17, 0.232); k.add(UCYL(12), '#f2c641', 0, 0, 0, 1.12, 0.02, 0.27, 0.02, 0.27); break;
        case 'visor': hair(); k.add(UBOX(), '#5fe0ff', 0, 0, 0, 1.06, 0.2, 0.3, 0.07, 0.04); break;
        case 'halo8': hair(); for (let i = 0; i < 5; i++) k.add(OCT(), '#bff6ff', 0, 0, Math.cos(i * 1.26) * 0.2, 1.3, Math.sin(i * 1.26) * 0.18, 0.035, 0.07, 0.035); break;
        case 'halo9': hair(); k.add(TORUS(), '#ffb347', 0, 0, 0, 1.36, -0.05, 0.2, 0.2, 0.9, 0, Math.PI / 2 - 0.3, 0); break;
        case 'halo10': hair(); k.add(TORUS(), '#b48cff', 0, 0, 0, 1.06, 0, 0.32, 0.32, 0.5, 0, 0.3, 0.6); break;
        case 'halo11': k.add(TORUS(), '#fff6dc', 0, 0, 0, 1.38, 0, 0.22, 0.22, 1.2, 0, Math.PI / 2, 0); break;
        default: hair(); if (robe) k.add(BALLS(), '#fff', 3, 0, 0, 0.98, -0.18, 0.14, 0.22, 0.08);
      }
    }
    // mũ truyền thống của mỗi miền ở bốn thời đầu, rồi mũ của thời máy móc và vầng sáng của bốn thời vượt người
    const HAT_R = { plains: ['wild', 'straw', 'straw', 'tricorn'], forest: ['wild', 'leaf', 'leaf', 'tricorn'], mountain: ['wild', 'beanie', 'beanie', 'tricorn'], tundra: ['fur', 'fur', 'fur', 'beanie'], coast: ['wild', 'sailor', 'sailor', 'sailor'], desert: ['turban', 'turban', 'turban', 'turban'] };
    const hatOf = (e, ter, robe, v) => (e <= 3 ? HAT_R[ter || 'plains'][e] : e === 4 ? (v % 2 ? 'cap' : 'hard') : e <= 6 ? (v % 3 ? 'hair' : 'cap') : e === 7 ? 'visor' : 'halo' + e);
    function personShape(k, e, robe, ter) {
      if (e >= 7 && robe === 2) { // người máy tròn
        for (const [lb, sx] of [[1, -0.09], [2, 0.09]]) { k.add(CAPS(), '#9aa3ad', 0, lb, sx, 0.06, 0, 0.06, 0.42, 0.06); k.add(BALLS(), '#5d6670', 0, lb, sx, 0.05, 0.03, 0.08, 0.05, 0.11); }
        k.ball(e >= 8 ? '#eef3f7' : '#c8d0d8', 0, 0, 0, 0.66, 0, 0.21, 0.25, 0.18);
        k.add(UBOX(), e === 9 ? '#ffb347' : e === 10 ? '#b48cff' : '#5fe0ff', 0, 0, 0, 0.62, 0.17, 0.16, 0.05, 0.02);
        for (const [lb, sx] of [[3, -1], [4, 1]]) { k.add(CAPS(), '#9aa3ad', 0, lb, sx * 0.23, 0.55, 0, 0.05, 0.28, 0.05); k.ball('#5d6670', 0, lb, sx * 0.25, 0.53, 0, 0.06, 0.06, 0.06); }
        k.ball('#d9dfe4', 0, 0, 0, 1.06, 0, 0.2, 0.18, 0.19);
        k.add(UBOX(), e === 9 ? '#ffb347' : e === 10 ? '#b48cff' : '#5fe0ff', 0, 0, 0, 1.06, 0.17, 0.26, 0.07, 0.04);
        k.add(UCYL(5), '#9aa3ad', 0, 0, 0.1, 1.24, 0, 0.012, 0.14, 0.012); k.add(BALLS(), '#ff5a4f', 0, 0, 0.1, 1.39, 0, 0.03, 0.03, 0.03);
        return;
      }
      const bare = e === 0;
      roundBase(k, { bareLegs: bare && robe !== 1, bareFeet: bare, belt: e >= 1 && e <= 4 ? '#3a2a1e' : e >= 8 ? (e === 9 ? '#ffb347' : e === 10 ? '#b48cff' : '#7ff0ff') : null, shoe: e >= 8 ? '#f4f7f9' : e >= 4 ? '#2b2b2b' : '#5b4630', glove: e >= 8 ? '#ffffff' : null });
      if (robe === 1) k.add(TCYL(0.55, 10), '#fff', 2, 0, 0, 0.12, 0, 0.27, 0.5, 0.24); // váy, áo dài
      if (e === 0) k.add(TCYL(0.8, 7), '#fff', 1, 0, 0, 0.42, -0.02, 0.24, 0.16, 0.2); // váy da thú
      if (e === 6) k.ball('#9aa3ad', 0, 0, 0, 0.66, -0.15, 0.13, 0.15, 0.07); // ba lô
      if (e >= 8) k.add(UBOX(), e === 9 ? '#ffb347' : e === 10 ? '#b48cff' : '#7ff0ff', 0, 0, 0, 0.5, 0.16, 0.02, 0.32, 0.02);
      roundHat(k, hatOf(e, ter, robe, 0), robe === 1);
    }
    // bảng màu mặc: bốn thời đầu theo miền (vải, lông thú, áo choàng), sau đó theo thời đại
    const DRESS_R = {
      plains: [['#c9a46e', '#8a6a4a', '#d9c27a', '#7a8a4a', '#b5764a'], ['#5b4630', '#3a2a1e', '#6b5a45'], ['#2b1d14', '#3a2a1e', '#4a3426']],
      forest: [['#4f7f3f', '#6b8f3a', '#5b4630', '#3f6b4a', '#8a6a46'], ['#4a3826', '#3f4a2f'], ['#2b1d14', '#4a3426', '#6b3a1e']],
      mountain: [['#9b3f2e', '#c46a2e', '#7a3a2e', '#8a8174', '#d9a441'], ['#4a3426', '#3a3f48'], ['#7a3a2e', '#c46a2e', '#8a8174']],
      tundra: [['#e8e0d0', '#a8846a', '#7a5a3a', '#d9d2c2', '#5d666f'], ['#5b4630', '#6c757e'], ['#f4f0e8', '#c8b49a', '#8a6a46']],
      coast: [['#3f7fd6', '#ffffff', '#5fc6e6', '#e05a6a', '#f2e2c8'], ['#2f4a6b', '#efe6d2'], ['#2b1d14', '#5a3a22', '#ffffff']],
      desert: [['#f4ead8', '#e2bd85', '#3d4f8b', '#c98a5a', '#ffffff'], ['#efe6d2', '#c9a06e'], ['#ffffff', '#3d4f8b', '#e2bd85']],
    };
    const DRESS = [
      null, null, null, null,
      [['#3f4650', '#6b5a4a', '#2f3e58', '#7a3a2e', '#556b4f'], ['#2f3540', '#4a4a52', '#3a2a1e'], ['#2b2b2b', '#4a4a52', '#2b1d14']],
      [['#3fa7d6', '#f2a541', '#59c3a4', '#e05a6a', '#8e7cc3', '#f4f4f4'], ['#2f4a6b', '#3a3a42', '#c9b08f', '#5a5a62'], ['#2b1d14', '#5a3a22', '#d9b36b', '#1a1a1a']],
      [['#e8ecef', '#f2a541', '#3fa7d6', '#e05a6a', '#c8d0d8'], ['#e8ecef', '#9aa3ad', '#f2a541'], ['#f4f4f4', '#2b1d14', '#d9b36b']],
      [['#f4f7f9', '#2b2f36', '#dfe7ee', '#3a3f48'], ['#2b2f36', '#dfe7ee', '#5d6670'], ['#dfe7ee', '#2b1d14', '#9aa3ad']],
      [['#eef3f7', '#dfe7ee', '#f4f7f9', '#d5f3fb'], ['#dfe7ee', '#cfd8de'], ['#eef3f7', '#2b1d14', '#d9b36b']],
      [['#fff1dc', '#ffe0b0', '#f6ead8', '#ffd9a0'], ['#e8d8c0', '#f6ead8'], ['#f6ead8', '#2b1d14', '#d9b36b']],
      [['#c9b6ff', '#b9a8e8', '#e0d4ff', '#a898d8'], ['#8f7cc0', '#a898d8'], ['#2b1d14', '#5a3a22', '#e0d4ff']],
      [['#fff6dc', '#ffffff', '#fff3c4'], ['#fff3d6', '#ffffff'], ['#fff6dc', '#f4ead8']],
    ];
    const ACCENT = { plains: '#e0b23a', forest: '#3f9a5a', mountain: '#8e7cc3', tundra: '#5fc6e6', coast: '#3f7fd6', desert: '#e05a6a' };
    function dressOf(e, ter) { if (e <= 3) return DRESS_R[ter || 'plains']; const D = DRESS[e]; return e <= 7 ? [[...D[0], ACCENT[ter] || '#e0b23a'], D[1], D[2]] : D; }
    // Một nhóm người: quần, áo dài; từ thời robot có thêm người máy
    function crowdSet(parent, cap, e, ter) {
      const vars = e >= 7 ? [0, 1, 2] : [0, 1], mat = figMaterial(), set = { meshes: [], cap, e, ter, n: [], dress: dressOf(e, ter) };
      for (const v of vars) {
        const k = new FigKit(); personShape(k, e, v, ter);
        const geo = k.bake(), m = new THREE.InstancedMesh(geo, mat, cap);
        geo.setAttribute('anim', new THREE.InstancedBufferAttribute(new Float32Array(cap * 4), 4));
        for (const a of ['cA', 'cB', 'cC', 'cD']) geo.setAttribute(a, new THREE.InstancedBufferAttribute(new Float32Array(cap * 3).fill(1), 3));
        m.count = 0; m.castShadow = true; m.frustumCulled = false; m.raycast = () => {};
        parent.add(m); set.meshes.push(m); set.n.push(0);
      }
      return set;
    }
    function crowdBegin(set) { set.n.fill(0); }
    // đặt một người: v biến thể, p vị trí, ry hướng, walk 0..1, atk 0..1, seed để chọn màu cố định
    function crowdPut(set, v, p, ry, walk, atk, seed, scale, colors, tilt) {
      v = Math.min(v, set.meshes.length - 1);
      const m = set.meshes[v], i = set.n[v];
      if (i >= set.cap) return;
      set.n[v]++;
      _o.position.copy(p); _o.rotation.set(tilt || 0, ry, 0); _o.scale.setScalar(scale || 1); _o.updateMatrix(); m.setMatrixAt(i, _o.matrix);
      const g = m.geometry, an = g.attributes.anim.array;
      an[i * 4] = (seed * 2.399) % 6.283; an[i * 4 + 1] = walk; an[i * 4 + 2] = atk; an[i * 4 + 3] = 0.6 + (seed % 7) * 0.08;
      if (!colors) { const D = set.dress || dressOf(set.e, set.ter); colors = [D[0][seed % D[0].length], D[1][(seed * 3 + 1) % D[1].length], D[2][(seed * 5 + 2) % D[2].length], SKIN_T[(seed * 7 + 3) % SKIN_T.length]]; }
      for (let j = 0; j < 4; j++) { _c.set(colors[j]); const a = g.attributes[['cA', 'cB', 'cC', 'cD'][j]].array; a[i * 3] = _c.r; a[i * 3 + 1] = _c.g; a[i * 3 + 2] = _c.b; }
    }
    function crowdEnd(set) {
      set.meshes.forEach((m, v) => { m.count = set.n[v]; m.visible = m.count > 0; m.instanceMatrix.needsUpdate = true; const g = m.geometry; for (const a of ['anim', 'cA', 'cB', 'cC', 'cD']) g.attributes[a].needsUpdate = true; });
    }
    /* ----- Lính tròn: giáp, mũ, vũ khí và khiên riêng của mỗi miền; bốn thời vượt người cầm vũ khí ánh sáng ----- */
    const WEAPON_R = { plains: 'spear', forest: 'axe', mountain: 'hammer', tundra: 'harpoon', coast: 'trident', desert: 'scimitar' };
    const SHIELD_R = { plains: ['#b5764a', 'round'], forest: ['#6b4b32', 'round'], mountain: ['#8a8174', 'tower'], tundra: ['#e8e0d0', 'round'], coast: ['#f2e2c8', 'shell'], desert: ['#c98a5a', 'crescent'] };
    const HELM_R = { plains: 'straw', forest: 'leaf', mountain: 'beanie', tundra: 'fur', coast: 'sailor', desert: 'turban' };
    function soldierShape(k, cls, e, ter) {
      ter = ter || 'plains';
      const R = (c, x, y, z, w, h, d, rx, rz) => k.add(UBOX(), c, 0, 4, 0.245 + x, y, z, w, h, d, 0, rx || 0, rz || 0); // món cầm ở tay phải
      if (e === 7) { // robot chiến đấu tròn
        personShape(k, 7, 2, ter);
        if (cls === 'melee') R('#7ff0ff', 0, 0.35, 0.12, 0.04, 0.05, 0.62, -0.4); else k.add(UCYL(8), '#2b313a', 0, 4, 0.25, 0.5, 0.12, 0.07, 0.4, 0.07, 0, Math.PI / 2, 0);
        k.add(UBOX(), '#fff', 1, 0, 0, 0.8, -0.2, 0.3, 0.2, 0.04);
        return;
      }
      const bare = e === 0;
      roundBase(k, { bareLegs: bare, bareFeet: bare, belt: e >= 1 && e <= 5 ? '#3a2a1e' : e >= 8 ? ['#7ff0ff', '#ffb347', '#b48cff', '#fff3c4'][e - 8] : null, shoe: e >= 8 ? '#f4f7f9' : e >= 4 ? '#2b2b2b' : '#4a3426', glove: e >= 8 ? '#ffffff' : e >= 4 ? '#3a3a3a' : null });
      // giáp ngực và vai từ thời trung đại; giáp sáng ở thời vượt người
      if (e >= 2 && e <= 3) k.ball(ter === 'tundra' ? '#d9d2c2' : '#9aa0a6', 0, 0, 0, 0.66, 0.02, 0.212, 0.2, 0.17);
      if (e >= 5 && e <= 6) k.ball(e === 6 ? '#dfe3e8' : '#4f5a3f', 0, 0, 0, 0.64, 0.02, 0.215, 0.19, 0.172);
      if (e >= 8) { k.ball(['#eef3f7', '#fff1dc', '#c9b6ff', '#fff6dc'][e - 8], 0, 0, 0, 0.66, 0.02, 0.215, 0.2, 0.172); k.add(UBOX(), ['#7ff0ff', '#ffb347', '#b48cff', '#fff3c4'][e - 8], 0, 0, 0, 0.62, 0.175, 0.04, 0.3, 0.02); }
      // mũ trận
      if (e <= 3) { const h = e === 0 ? (ter === 'tundra' ? 'fur' : 'wild') : HELM_R[ter]; if (e >= 2 && (ter === 'plains' || ter === 'mountain' || ter === 'forest')) { k.add(SPHG(), '#fff', 3, 0, 0, 1.1, 0, 0.235, 0.2, 0.228); k.add(UCONE(6), '#fff', 3, 0, 0, 1.28, 0, 0.06, 0.12, 0.06); } else roundHat(k, h, false); }
      else if (e <= 6) { k.add(SPHG(), '#fff', 3, 0, 0, 1.11, 0, 0.24, 0.17, 0.235); k.add(UCYL(12), '#fff', 3, 0, 0, 1.11, 0, 0.26, 0.02, 0.26); if (e === 6) k.add(UBOX(), '#5fe0ff', 0, 0, 0, 1.08, 0.2, 0.28, 0.06, 0.04); }
      else roundHat(k, 'halo' + e, false);
      // cờ phe sau lưng
      k.add(UCYL(4), '#5b4630', 0, 0, 0, 0.5, -0.17, 0.012, 1.0, 0.012); k.box('#fff', 1, 0, 0.11, 1.38, -0.17, 0.22, 0.14, 0.015);
      if (cls === 'melee') {
        const wp = e <= 3 ? WEAPON_R[ter] : e <= 6 ? 'rifle' : 'beam';
        if (e === 0) { R('#6d5139', 0, 0.42, 0.06, 0.05, 0.05, 0.5); k.add(DOD(), '#7d7a74', 0, 4, 0.245, 0.42, 0.32, 0.09, 0.09, 0.09); }
        else if (wp === 'spear') { k.add(UCYL(5), '#6d5139', 0, 4, 0.245, 0.06, 0.08, 0.02, 1.5, 0.02); k.add(UCONE(4), '#b08d57', 0, 4, 0.245, 1.56, 0.08, 0.05, 0.18, 0.05); }
        else if (wp === 'axe') { R('#6d5139', 0, 0.45, 0.14, 0.04, 0.04, 0.6, -0.3); k.add(UBOX(), '#9aa0a6', 0, 4, 0.245, 0.62, 0.4, 0.03, 0.22, 0.14, 0, -0.3, 0); }
        else if (wp === 'hammer') { R('#6d5139', 0, 0.42, 0.12, 0.04, 0.04, 0.55, -0.3); k.add(UBOX(), '#7d7a74', 0, 4, 0.245, 0.56, 0.38, 0.14, 0.14, 0.22, 0, -0.3, 0); }
        else if (wp === 'harpoon') { k.add(UCYL(5), '#d9d2c2', 0, 4, 0.245, 0.1, 0.1, 0.018, 1.3, 0.018); k.add(UCONE(3), '#efe6d2', 0, 4, 0.245, 1.38, 0.1, 0.045, 0.2, 0.045); }
        else if (wp === 'trident') { k.add(UCYL(5), '#b08d57', 0, 4, 0.245, 0.06, 0.08, 0.018, 1.4, 0.018); for (const dx of [-0.07, 0, 0.07]) k.add(UCONE(4), '#d9b36b', 0, 4, 0.245 + dx, 1.44, 0.08, 0.02, 0.16, 0.02); }
        else if (wp === 'scimitar') { R('#dfe6ea', 0, 0.42, 0.24, 0.025, 0.07, 0.6, -0.2, 0.15); }
        else if (wp === 'rifle') { R(e === 3 ? '#5b4630' : '#2b2b2b', 0, 0.46, 0.2, 0.05, 0.07, 0.85, -0.35); if (e <= 4) R('#dfe6ea', 0, 0.62, 0.62, 0.02, 0.02, 0.24, -0.35); }
        else R(['#7ff0ff', '#ffb347', '#b48cff', '#fff6dc'][e - 8], 0, 0.4, 0.2, 0.05, 0.05, 0.8, -0.3);
        if (e >= 1 && e <= 3) { const [sc, shp] = SHIELD_R[ter]; if (shp === 'tower') k.add(UBOX(), sc, 0, 3, -0.3, 0.42, 0.06, 0.05, 0.5, 0.32); else if (shp === 'crescent') k.add(TORUS(), sc, 0, 3, -0.3, 0.62, 0.06, 0.16, 0.16, 0.5, Math.PI / 2, 0, 0); else k.add(UCYL(10), shp === 'shell' ? '#f4d9b8' : sc, 0, 3, -0.3, 0.62, 0.06, 0.19, 0.04, 0.19, 0, 0, Math.PI / 2); }
      } else {
        if (e === 0) k.add(DOD(), '#8b8577', 0, 4, 0.245, 0.46, 0.06, 0.07, 0.07, 0.07);
        else if (e <= 2) { const tall = ter === 'forest' ? 1.4 : 1; for (let i = -1; i <= 1; i++) k.add(UBOX(), ter === 'desert' ? '#8a5a3a' : '#6d5139', 0, 3, -0.27, 0.62 + i * 0.22 * tall, 0.12 - Math.abs(i) * 0.06, 0.025, 0.26 * tall, 0.025, 0, i * 0.5, 0); k.add(UCYL(5), '#8f6a46', 0, 0, 0.12, 0.52, -0.16, 0.05, 0.36, 0.05); }
        else if (e === 3) R('#5b4630', 0, 0.46, 0.22, 0.05, 0.05, 1.0, -0.2);
        else if (e === 4) { R('#2b2b2b', 0, 0.46, 0.18, 0.09, 0.11, 0.66); R('#2b2b2b', 0, 0.4, 0.4, 0.02, 0.16, 0.02); }
        else if (e <= 6) k.add(UCYL(8), e === 6 ? '#dfe3e8' : '#4f5a3f', 0, 0, 0.18, 0.86, -0.32, e === 6 ? 0.1 : 0.08, 1.1, e === 6 ? 0.1 : 0.08, 0, Math.PI / 2, 0);
        else { k.add(UCYL(8), ['#eef3f7', '#fff1dc', '#c9b6ff', '#fff6dc'][e - 8], 0, 0, 0.18, 0.86, -0.3, 0.09, 1.0, 0.09, 0, Math.PI / 2, 0); k.add(BALLS(), ['#7ff0ff', '#ffb347', '#b48cff', '#fff3c4'][e - 8], 0, 0, 0.18, 0.86, 0.72, 0.1, 0.1, 0.1); }
      }
    }
    function crowdDispose(set) { for (const m of set.meshes) { if (m.parent) m.parent.remove(m); m.geometry.dispose(); } }

    /* =============== Cư dân =============== */
    const bodyGeo = (() => { const k = new Kit(); for (const sx of [-0.07, 0.07]) k.box('#5a5560', sx, 0, 0, 0.11, 0.3, 0.12); k.box('#ffffff', 0, 0.28, 0, 0.3, 0.32, 0.19); for (const sx of [-0.19, 0.19]) k.box('#ffffff', sx, 0.28, 0, 0.08, 0.3, 0.09); k.box('#f1d3b3', 0, 0.58, 0, 0.08, 0.05, 0.08); const g = k.bake().body; g.translate(0, -0.31, 0); return g; })();
    const headGeo = (() => { const k = new Kit(); k.add(ICO(), '#ffffff', 0, -0.02, 0, 0.13, 0.14, 0.13); k.add(SPHG(), '#4a3426', 0, 0.0, -0.01, 0.142, 0.13, 0.142); return k.bake().body; })();
    const SHIRTS_X = [['#e8ecef', '#f2a541', '#3fa7d6', '#e05a6a', '#c8d0d8'], ['#f4f7f9', '#2b2f36', '#dfe7ee', '#3a3f48']];
    const SHIRTS = [['#8a6a4a', '#a0785a', '#6b5a45', '#9c8466'], ['#c9a46e', '#a8603e', '#e6dcc6', '#7a5a3a'], ['#7a4e3a', '#3d6b8b', '#9b4a35', '#5f6b4a'], ['#d9733f', '#4d7cc9', '#3f8f5a', '#a14a7e', '#e0b23a', '#5b6f8a'], ['#3f4650', '#6b5a4a', '#2f3e58', '#7a3a2e', '#556b4f'], ['#3fa7d6', '#f2a541', '#59c3a4', '#e05a6a', '#8e7cc3', '#f4f4f4'], ...SHIRTS_X];
    function people(L) {
      const N = L.houseLots.length * 4;
      L.hats = new THREE.InstancedMesh(new THREE.ConeGeometry(0.42, 0.22, 8), new THREE.MeshStandardMaterial({ color: '#ff6b9d', flatShading: true, roughness: 0.7 }), N);
      L.hats.castShadow = true; L.hats.count = 0; L.g.add(L.hats);
      L.peopleN = N; L.shirtEra = -1; L.crowd = null;
    }
    function shirtColors(L, e) {
      if (L.shirtEra === e) return;
      L.shirtEra = e;
      if (L.crowd) crowdDispose(L.crowd);
      L.crowd = crowdSet(L.g, Math.ceil(L.peopleN * 0.75), Math.max(0, e), L.ter);
    }

    /* =============== Quảng trường, đường, đèn và công trình chung theo thời đại =============== */
    function rebuildCivic(L, e) {
      const eb = e;
      e = Math.min(7, e); BEY = 0;
      for (const key of Object.keys(L.civic)) { const o = L.civic[key]; if (o) { L.g.remove(o); unclickable(o); disposeGroup(o); } }
      for (const s of L.glows) L.g.remove(s);
      L.glows = []; L.lamps = []; L.fires = L.fires.filter((f) => f.owner !== 'civic');
      // quảng trường và đường đến hai cây cầu
      const k = new Kit(), pc = PLAZA_C[eb];
      k.cyl(pc, 0, 0.03, 0, 6.9, 0.1, 28); k.cyl(e >= 3 ? '#c0b292' : pc, 0, 0.05, 0, 5.4, 0.1, 28);
      for (const p of L.landing) { const len = p.length() - 6.2, a = Math.atan2(p.x, p.z), m = p.clone().normalize().multiplyScalar(6.2 + len / 2); k.box(ROAD[eb], m.x, 0.02, m.z, e >= 4 ? 2.8 : 1.8, 0.08, len, a); if (e >= 5) k.box(e === 7 ? BEY_LAMP[Math.max(0, eb - 7)] : '#f4f4f4', m.x, 0.1, m.z, 0.12, 0.02, len - 1, a, e === 7 ? 'glow' : false); }
      // lối nhỏ tới ngân hàng và trường
      for (const p of [L.bankPos, L.schoolPos]) { const len = p.length() - 6.0, a = Math.atan2(p.x, p.z), m = p.clone().normalize().multiplyScalar(6.0 + len / 2 - 1.3); k.box(ROAD[eb], m.x, 0.025, m.z, 1.5, 0.08, len - 2.6, a); }
      { const a = L.bankPos.clone().multiplyScalar(1.3), b = L.harbor, len = a.distanceTo(b), m = a.clone().lerp(b, 0.5); k.box(ROAD[eb], m.x, 0.025, m.z, 1.6, 0.08, len, Math.atan2(b.x - a.x, b.z - a.z)); }
      if (e === 4) for (let s = 0; s < 8; s++) { const a = (s / 8) * TAU; k.box('#8f8f8f', Math.cos(a) * 3.2, 0.06, Math.sin(a) * 3.2, 0.4, 0.4, 0.4); }
      L.civic.plaza = meshOf(k, L.litMat, L.g, 0, 0, 0);
      // nơi của chính quyền ở giữa, ngân hàng phía trong, trường phía ngoài
      BEY = eb;
      const kh = new Kit(), hx = buildHall(kh, e, L.ter);
      L.civic.hall = meshOf(kh, L.litMat, L.g, 0, 0, Math.atan2(L.inw.x, L.inw.z));
      clickable(L.civic.hall, { type: 'gov', land: L.i });
      if (hx && hx.fire) addFire(L, L.civic.hall, hx.fire, 'civic', 3.2);
      if (hx && hx.beacon) addGlow(L, L.civic.hall, '#ff5a5a', 2.2, hx.beacon, false);
      L.clockPos = hx && hx.clock ? hx.clock : null;
      const kb = new Kit(), bx = buildBank(kb, e, L.ter);
      L.civic.bank = meshOf(kb, L.litMat, L.g, L.bankPos.x, L.bankPos.z, Math.atan2(-L.bankPos.x, -L.bankPos.z));
      clickable(L.civic.bank, { type: 'bank', land: L.i });
      L.orb = bx && bx.orb ? addGlow(L, L.civic.bank, e === 7 ? '#ffe9a8' : '#ffd36b', e >= 5 ? 5 : 4, bx.orb, false) : null;
      if (!L.noSchool) { const ks = new Kit(); buildSchool(ks, e, L.ter); L.civic.school = meshOf(ks, L.litMat, L.g, L.schoolPos.x, L.schoolPos.z, Math.atan2(-L.schoolPos.x, -L.schoolPos.z)); clickable(L.civic.school, { type: 'school', land: L.i }); }
      BEY = 0;
      // đèn quanh quảng trường và dọc đường
      const kl = new Kit(), lampSpots = [];
      for (let s = 0; s < 10; s++) { const a = (s / 10) * TAU + 0.31; lampSpots.push([Math.cos(a) * 7.3, Math.sin(a) * 7.3]); }
      for (const p of L.landing) for (const u of [0.45, 0.8]) { const q = p.clone().multiplyScalar(u), s2 = new THREE.Vector3(-p.z, 0, p.x).normalize().multiplyScalar(e >= 4 ? 1.9 : 1.4); lampSpots.push([q.x + s2.x, q.z + s2.z]); }
      for (const [x, z] of lampSpots) {
        const kk = new Kit(), top = buildLamp(kk, e);
        for (const part of kk.b) { part.translate(x, 0, z); kl.b.push(part); }
        for (const part of kk.l) { part.translate(x, 0, z); kl.l.push(part); }
        L.lamps.push([x + top[0], top[1], z + top[2]]);
      }
      L.civic.lamps = meshOf(kl, L.litMat, L.g, 0, 0, 0);
      const lc = e <= 2 ? '#ff9a45' : e === 7 ? BEY_LAMP[Math.max(0, eb - 7)] : e >= 5 ? '#e8f6ff' : '#ffc970';
      for (const [x, y, z] of L.lamps) addGlow(L, L.g, lc, e >= 5 ? 3.6 : 3.0, [x, y, z], true);
      BEY = 0;
      clearTrees(L, 0, 0, 7.6); clearTrees(L, L.bankPos.x, L.bankPos.z, 4.2); clearTrees(L, L.schoolPos.x, L.schoolPos.z, 4.2);
      for (const p of L.landing) for (let u = 0.2; u <= 1.0; u += 0.1) clearTrees(L, p.x * u, p.z * u, 2.4);
    }
    function addGlow(L, parent, color, size, pos, nightOnly) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0 }));
      s.scale.set(size, size, 1); s.position.set(pos[0], pos[1], pos[2]); parent.add(s);
      s.userData = { nightOnly, level: 1 };
      L.glows.push(s);
      return s;
    }
    function addFire(L, parent, pos, owner, size) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: '#ff8a3d', blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0.6 }));
      s.scale.set(size || 2.2, size || 2.2, 1); s.position.set(pos[0], pos[1], pos[2]); parent.add(s);
      L.fires.push({ s, owner, base: size || 2.2, ph: Math.random() * 6 });
      return s;
    }

    /* =============== Nhà, ruộng, xưởng =============== */
    // thời Vật Chất Sống: nhà tự mọc thành những búp san hô ngọc chồng lên nhau, đường ráp phát sáng
    function podHouse(k, v, lv) {
      const n = 2 + Math.floor(v * 2) + (lv >= 2 ? 1 : 0);
      let y = 0;
      for (let i = 0; i < n; i++) { const r = 1.3 - i * 0.2; k.add(SPHG(), i % 2 ? '#f3f6f8' : '#e2ebf0', 0, y, 0, r, r * 1.2, r); k.add(TORUS(), '#7ff0ff', 0, y + 0.06, 0, r * 0.97, r * 0.97, r * 0.97, 0, Math.PI / 2, 0, 'glow'); y += r * 1.05; }
      for (let j = 0; j < 3; j++) { const a = j * 2.1 + v * 4; k.add(UCONE(5), '#d5f3fb', Math.cos(a) * 1.15, 0, Math.sin(a) * 1.15, 0.2, y * 0.5, 0.2, 0, Math.sin(a) * 0.4, -Math.cos(a) * 0.4); }
      k.add(ICO(), '#bff6ff', 0, y + 0.3, 0, 0.28, 0.28, 0.28, 0, 0, 0, 'glow');
      k.box('#9fd3f0', 0, 0.05, 1.15, 0.5, 0.75, 0.06, 0, true);
    }
    function houseLevel(L, i) {
      const w = W.cities[L.i].w; if (!w) return 1;
      const ms = [0, 1, 2, 3].map((k) => w.households[i * 4 + k]).filter(Boolean);
      const wealth = ms.reduce((a, m) => a + m.cash, 0) / Math.max(1, ms.length);
      return wealth > 260 ? 3 : wealth > 110 ? 2 : 1;
    }
    function makeHouse(L, idx, e, lv) {
      const lot = L.houseLots[idx], v = hash(L.i * 300 + idx * 7 + 3);
      const k = new Kit();
      BEY = e;
      if (e === 8) podHouse(k, v, lv); else buildHouse(k, Math.min(7, e), L.ter, v, lv);
      const ry = Math.atan2(-lot.p.x, -lot.p.z) + (v - 0.5) * 0.5;
      const g = meshOf(k, L.litMat, L.g, lot.p.x, lot.p.z, ry);
      BEY = 0;
      clickable(g, { type: 'house', i: idx, land: L.i });
      clearTrees(L, lot.p.x, lot.p.z, 2.3);
      return g;
    }
    function syncHouses(L, w, animate) {
      const need = Math.ceil(w.households.length / 4);
      while (L.houses.length < need) {
        const idx = L.houses.length, lot = L.houseLots[idx];
        if (!lot) break;
        lot.used = true;
        const lv = houseLevel(L, idx), g = makeHouse(L, idx, L.era, lv);
        const H = { g, idx, era: L.era, lv, grow: animate ? 0.001 : 1, smokeT: hash(idx) * 3 };
        if (animate) { g.scale.y = 0.001; dust(L, lot.p); }
        if (L.era === 0) H.fire = addFire(L, g, [0.9, 0.35, 1.6], 'house' + idx, 1.6);
        L.houses.push(H);
      }
    }
    function rebuildHouse(L, H, e, lv) {
      L.g.remove(H.g); unclickable(H.g); disposeGroup(H.g);
      L.fires = L.fires.filter((f) => f.owner !== 'house' + H.idx);
      H.g = makeHouse(L, H.idx, e, lv); H.era = e; H.lv = lv; H.grow = 0.25; H.g.scale.y = 0.25;
      if (e === 0) addFire(L, H.g, [0.9, 0.35, 1.6], 'house' + H.idx, 1.6);
    }
    const lotOf = (L, o) => (o.kind === 'dock' ? L.dockPos : o.kind === 'farm' ? L.farmLots[o.lot] : L.shopLots[o.lot]);
    // bến cá: cầu tàu vươn ra biển trong, lều phơi cá, rồi kho lạnh và cảng cá
    function buildDock(k, e, S) {
      const pier = ['#8f6a46', '#8a6a46', '#a39b8e', '#9a8f80', '#9a948a', '#c9ced4', '#d9dfe4', '#e8eef3'][e], wid = [1.2, 1.8, 2.4, 2.4, 2.8, 3.2, 3.4, 3.6][e];
      for (let z = 0.6; z < 8.4; z += 0.9) k.box(pier, 0, -0.1, z, wid, 0.16, 0.86);
      for (let z = 1.2; z < 8.4; z += 2.2) for (const sx of [-1, 1]) k.cyl(e >= 4 ? '#7d7a74' : '#5b4630', sx * wid * 0.45, -2.2, z, 0.12, 2.2, 6);
      if (e <= 1) { for (let i = 0; i < 2; i++) { const x = -2.6 + i * 1.4; k.cyl('#6d5139', x, 0, -1.6, 0.06, 1.6, 5); k.cyl('#6d5139', x + 1.0, 0, -1.6, 0.06, 1.6, 5); k.add(UBOX(), '#6d5139', x + 0.5, 1.5, -1.6, 1.1, 0.06, 0.06); for (let f2 = 0; f2 < 3; f2++) k.box('#b9c4c9', x + 0.2 + f2 * 0.3, 1.0, -1.6, 0.1, 0.45, 0.05); } }
      const h = styHall(k, S, 1.6, -2.6, e >= 3 ? 3.6 : 2.6, e >= 4 ? 2.6 : 1.7, 2.6);
      if (e === 2 || e === 3) { k.cyl('#6d5139', -1.2, 0, 4.0, 0.12, 3.2, 6); k.add(UBOX(), '#6d5139', -0.4, 3.0, 4.0, 1.9, 0.12, 0.12); k.box('#c8b07a', 0.4, 2.2, 4.0, 0.06, 0.8, 0.06); }
      if (e === 3) { k.cyl('#efe6d2', -1.0, 0, 8.0, 0.34, 3.2, 8); k.cyl('#ffe08a', -1.0, 3.2, 8.0, 0.36, 0.5, 8, true); k.cone('#9b4a35', -1.0, 3.7, 8.0, 0.42, 0.5, 8); }
      if (e === 4) { k.cyl('#7a3a2e', 3.0, h - 0.4, -3.4, 0.28, 2.6, 8); for (let i = 0; i < 4; i++) k.box(pick(['#3f7fd6', '#c46a2e', '#7a8a5a'], i * 0.27), -1.6 + (i % 2) * 0.9, 0, -0.6 - Math.floor(i / 2) * 0.9, 0.8, 0.6, 0.8); }
      if (e >= 5) { k.box('#eef1f4', -1.4, 0, 7.4, 0.3, 4.2, 0.3); k.box(e === 7 ? '#7ff0ff' : '#e05a6a', -0.6, 4.0, 7.4, 2.0, 0.25, 0.3, 0, e === 7); k.box('#9fd3f0', 1.6, 0.4, -2.6 + 1.31, 3.2, 0.9, 0.05, 0, true); }
      if (e >= 6) for (let i = 0; i < 3; i++) { k.add(TORUS(), '#c8d0d8', 3.2 + (i % 2) * 2.4, -0.45, 3.0 + i * 2.2, 1.1, 1.1, 1.1, 0, Math.PI / 2, 0); k.cyl('#5d6670', 3.2 + (i % 2) * 2.4, -0.5, 3.0 + i * 2.2, 1.0, 0.04, 12); }
      return e === 4 ? { smoke: [3.0, h + 2.4, -3.4] } : null;
    }
    function makeFirm(L, f, slot, e) {
      if (f.sea) {
        BEY = e; const k = new Kit(), extra = buildDock(k, Math.min(7, e), STY[L.ter][Math.min(7, e)]), p = L.dockPos;
        const g = meshOf(k, L.litMat, L.g, p.x, p.z, Math.atan2(p.x, p.z)); BEY = 0;
        clickable(g, { type: 'firm', id: f.id, land: L.i });
        clearTrees(L, p.x, p.z, 3.6);
        return { g, kind: 'dock', lot: -1, era: e, grow: 1, dying: 0, busy: 0, spin: null, smoke: extra && extra.smoke ? extra.smoke : null, fire: null };
      }
      const food = f.sector === 'food', lot = food ? L.farmLots[slot] : L.shopLots[slot], v = hash(L.i * 500 + slot * 11 + (food ? 1 : 7));
      BEY = e; const k = new Kit(), extra = (food ? buildFarm : buildShop)(k, Math.min(7, e), L.ter, v);
      const ry = food ? Math.atan2(-lot.x, -lot.z) + Math.PI : Math.atan2(-lot.x, -lot.z);
      const g = meshOf(k, L.litMat, L.g, lot.x, lot.z, ry); BEY = 0;
      clickable(g, { type: 'firm', id: f.id, land: L.i });
      clearTrees(L, lot.x, lot.z, lot.r + 0.4);
      const o = { g, kind: food ? 'farm' : 'shop', lot: slot, era: e, grow: 1, dying: 0, busy: 0, spin: null, smoke: null, fire: null };
      if (extra && extra.hub) {
        const hub = new THREE.Group(); hub.position.set(...extra.hub); g.add(hub);
        const km = new Kit();
        if (extra.blades === 'mill') for (let b = 0; b < 4; b++) { const a = (b * Math.PI) / 2; km.add(UBOX(), '#6d4c35', Math.sin(a) * 1.5, Math.cos(a) * 1.5 - 1.5, 0.05, 0.11, 3.0, 0.08, 0, 0, -a); km.add(UBOX(), '#f7f2e6', Math.sin(a) * 1.7 + Math.cos(a) * 0.37, Math.cos(a) * 1.7 - Math.sin(a) * 0.37 - 1.1, 0.07, 0.66, 2.2, 0.04, 0, 0, -a); }
        else for (let b = 0; b < 3; b++) { const a = (b * TAU) / 3; km.add(UBOX(), '#f4f6f8', Math.sin(a) * 1.6, Math.cos(a) * 1.6 - 1.6, 0.1, 0.22, 3.2, 0.06, 0, 0, -a); }
        km.add(SPHG(), '#5a4636', 0, 0, 0, 0.25, 0.25, 0.25);
        const { body } = km.bake(); const bm = new THREE.Mesh(body, bodyMat); bm.castShadow = true; hub.add(bm);
        o.spin = { obj: hub, axis: 'z', speed: extra.blades === 'mill' ? 1 : 2.2 };
      }
      if (extra && extra.gear) {
        const gear = new THREE.Group(); gear.position.set(...extra.gear); gear.rotation.z = Math.PI / 2; g.add(gear);
        const km = new Kit(); km.cyl('#b08d57', 0, -0.1, 0, 0.62, 0.2, 12);
        for (let t = 0; t < 9; t++) { const a = (t / 9) * TAU; km.box('#b08d57', Math.cos(a) * 0.72, -0.1, Math.sin(a) * 0.72, 0.24, 0.2, 0.26); }
        const { body } = km.bake(); gear.add(new THREE.Mesh(body, metalMat));
        o.spin = { obj: gear, axis: 'y', speed: 1.8 };
      }
      if (extra && extra.fire) o.fire = addFire(L, g, extra.fire, 'firm' + f.id, 2.6);
      if (extra && extra.smoke) o.smoke = extra.smoke;
      return o;
    }
    function syncFirms(L, w, animate) {
      const vis = w.firms.filter((f) => (f.alive || (f.deadSince !== null && w.day - f.deadSince < 12)) && f.sector !== 'gold');
      const ids = new Set(vis.map((f) => f.id));
      for (const f of vis) {
        if (L.firmObj.has(f.id)) continue;
        if (f.sea) { const o = makeFirm(L, f, -1, L.era); o.grow = animate ? 0.001 : 1; o.g.scale.y = o.grow; L.firmObj.set(f.id, o); continue; }
        const food = f.sector === 'food', owners = food ? L.farmOwner : L.shopOwner;
        let s = L.slotOf.has(f.id) ? L.slotOf.get(f.id) : -1;
        if (s < 0 || (owners[s] !== null && owners[s] !== f.id)) s = owners.indexOf(null);
        if (s < 0) continue;
        L.slotOf.set(f.id, s); owners[s] = f.id;
        const o = makeFirm(L, f, s, L.era);
        o.grow = animate ? 0.001 : 1; o.g.scale.y = o.grow;
        if (animate) dust(L, food ? L.farmLots[s] : L.shopLots[s]);
        L.firmObj.set(f.id, o);
      }
      for (const [id, o] of L.firmObj) if (!ids.has(id) && !o.dying) o.dying = 1;
    }
    function rebuildFirm(L, id, o, e) {
      const w = W.cities[L.i].w, f = w && w.firms.find((x) => x.id === id);
      if (!f) return;
      L.g.remove(o.g); unclickable(o.g); disposeGroup(o.g);
      L.fires = L.fires.filter((x) => x.owner !== 'firm' + id);
      const n = makeFirm(L, f, o.lot, e);
      n.grow = 0.25; n.g.scale.y = 0.25;
      L.firmObj.set(id, n);
    }
    function dust(L, p) { for (let k = 0; k < 6; k++) puff(L.world(new THREE.Vector3(p.x + (Math.random() - 0.5) * 3, 0.8 + Math.random(), p.z + (Math.random() - 0.5) * 3)), true, '#b9ab98'); }

    /* =============== Đổi thời đại: xây lại dần từ quảng trường ra =============== */
    function setEra(L, e, animate) {
      if (L.era === e) return;
      const first = L.era < 0;
      L.era = e;
      shirtColors(L, e);
      rebuildCivic(L, e);
      if (first || !animate) {
        for (const H of L.houses) rebuildHouse(L, H, e, H.lv);
        for (const [id, o] of L.firmObj) if (!o.dying) rebuildFirm(L, id, o, e);
        for (const H of L.houses) { H.grow = 1; H.g.scale.y = 1; }
        for (const [, o] of L.firmObj) { o.grow = 1; o.g.scale.y = 1; }
        return;
      }
      // làn sóng xây dựng: nhà gần quảng trường xây lại trước
      L.queue = [...L.houses.map((H) => ({ kind: 'house', H, d: L.houseLots[H.idx].p.length() })), ...[...L.firmObj.entries()].map(([id, o]) => ({ kind: 'firm', id, d: lotOf(L, o).length() }))].sort((a, b) => a.d - b.d);
      L.queueT = 0;
    }
    function runQueue(L, dt) {
      if (!L.queue.length) return;
      L.queueT += dt;
      while (L.queueT > 70 && L.queue.length) {
        L.queueT -= 70;
        const q = L.queue.shift();
        if (q.kind === 'house') { if (q.H.era !== L.era) { rebuildHouse(L, q.H, L.era, q.H.lv); dust(L, L.houseLots[q.H.idx].p); } }
        else { const o = L.firmObj.get(q.id); if (o && !o.dying && o.era !== L.era) { rebuildFirm(L, q.id, o, L.era); dust(L, lotOf(L, o)); } }
      }
    }

    /* =============== Cầu nối hai miền =============== */
    const bridges = [];
    function bridgeEnds(b) {
      const A = lands[b.a], B = lands[b.b];
      const pa = A.world(A.landing[1]), pb = B.world(B.landing[0]);
      return [pa, pb];
    }
    // độ cao mặt cầu dọc theo chiều dài (0..1)
    const deckY = (e, u) => e === 0 ? -1.6 * Math.sin(Math.PI * u) : e === 2 || e === 3 || e === 8 ? 1.0 * Math.sin(Math.PI * u) : e === 9 ? 0.7 : 0;
    function buildBridge(B, e) {
      if (B.g) { scene.remove(B.g); disposeGroup(B.g); B.g = null; }
      { const [pa0, pb0] = bridgeEnds(B.sim); B.pa = pa0; B.pb = pb0; B.len = pa0.distanceTo(pb0) + 1.2; }
      if (e < 0) { B.era = -1; return; }
      const [pa, pb] = bridgeEnds(B.sim), len = pa.distanceTo(pb) + 1.2, k = new Kit(), N = Math.round(len / 0.9);
      const y = (u) => deckY(e, u);
      if (e === 0) {
        for (let s = 0; s <= N; s++) { const u = s / N; k.box(pick(['#8f6a46', '#7d5a3a', '#9b7653'], hash(s)), u * len, y(u) - 0.05, 0, 0.6, 0.08, 1.7); }
        for (const sz of [-0.95, 0.95]) for (let s = 0; s < N; s++) { const u0 = s / N, u1 = (s + 1) / N, a = Math.atan2(y(u1) - y(u0), len / N); k.add(UBOX(), '#c8b07a', (u0 + u1) / 2 * len, (y(u0) + y(u1)) / 2 + 0.9, sz, len / N + 0.05, 0.05, 0.05, 0, 0, a); }
        for (const u of [0, 1]) for (const sz of [-0.95, 0.95]) k.cyl('#6d5139', u * len, -0.2, sz, 0.1, 1.4, 5);
      } else if (e === 1) {
        k.box('#8a6a46', len / 2, -0.12, 0, len, 0.25, 2.2);
        for (const sz of [-1.05, 1.05]) k.add(UCYL(6), '#6d5139', len / 2, 0.75, sz, 0.09, len, 0.09, 0, 0, Math.PI / 2);
        for (const u of [0.33, 0.67]) { k.tcyl('#9a9182', u * len, -9, 0, 1.0, 1.25, 9, 8); k.blob(DOD(), '#8a8174', u * len, -9.4, 0, 1.4, 0.8); }
      } else if (e === 2 || e === 3) {
        for (let s = 0; s < N; s++) { const u0 = s / N, u1 = (s + 1) / N, a = Math.atan2(y(u1) - y(u0), len / N); k.add(UBOX(), e === 2 ? '#b1a99c' : '#c9bda4', (u0 + u1) / 2 * len, (y(u0) + y(u1)) / 2 - 0.45, 0, len / N + 0.06, 0.5, 2.4, 0, 0, a); for (const sz of [-1.15, 1.15]) k.add(UBOX(), e === 2 ? '#9d9589' : '#b8ab92', (u0 + u1) / 2 * len, (y(u0) + y(u1)) / 2, sz, len / N + 0.06, 0.6, 0.22, 0, 0, a); }
        for (const u of [0.25, 0.5, 0.75]) k.tcyl(e === 2 ? '#a39b8e' : '#bcb09a', u * len, -7, 0, 0.9, 1.1, 7 + y(u) - 0.5, 8);
        if (e === 3) { for (let s = 0; s <= 4; s++) { const u = s / 4; k.cyl('#2f3540', u * len, y(u), 1.15, 0.07, 1.8, 6); } k.add(GABLE(), '#7a4e3e', len / 2, 2.4, 0, len * 0.5, 0.9, 2.6); for (const sx of [-1, 1]) k.cyl('#6d5139', len / 2 + sx * len * 0.24, y(0.5 + sx * 0.24), -1.15, 0.08, 2.4 - 0.4, 5); }
      } else if (e === 4) {
        k.box('#5d5f63', len / 2, -0.25, 0, len, 0.35, 2.8);
        // giàn thép: hai thanh dọc, cột đứng và thanh chéo đan xen hình chữ V
        for (const sz of [-1.4, 1.4]) { k.box('#8f2f26', len / 2, 2.2, sz, len, 0.18, 0.18); k.box('#8f2f26', len / 2, 0.0, sz, len, 0.2, 0.2); for (let s = 0; s <= 8; s++) { const x = (s / 8) * len; k.box('#8f2f26', x, 0, sz, 0.15, 2.3, 0.15); if (s < 8) { const pw = len / 8, ang = Math.atan2(pw, 2.2); if (s % 2 === 0) k.add(UBOX(), '#8f2f26', x, 0, sz, 0.12, Math.hypot(pw, 2.2), 0.12, 0, 0, -ang); else k.add(UBOX(), '#8f2f26', x + pw, 0, sz, 0.12, Math.hypot(pw, 2.2), 0.12, 0, 0, ang); } } }
      } else if (e === 6) {
        k.box('#3a3d42', len / 2, -0.3, 0, len, 0.4, 3.6); k.box('#7fd7ff', len / 2, 0.11, 0, len - 0.6, 0.06, 0.3, 0, true);
        for (const u of [0.22, 0.78]) { k.box('#eef1f4', u * len, -0.3, -1.6, 0.6, 15, 0.6); k.box('#eef1f4', u * len, -0.3, 1.6, 0.6, 15, 0.6); k.box('#eef1f4', u * len, 13.8, 0, 0.6, 0.6, 3.8); k.box('#ff5a4f', u * len, 14.5, 0, 0.3, 0.3, 0.3, 0, true); }
        for (const sz of [-1.6, 1.6]) for (let s = 0; s < 24; s++) {
          const u0 = s / 24, u1 = (s + 1) / 24, cy = (u) => (u < 0.22 ? 14.4 * (u / 0.22) : u > 0.78 ? 14.4 * ((1 - u) / 0.22) : 2 + 12.4 * Math.pow((u - 0.5) / 0.28, 2));
          const x0 = u0 * len, x1 = u1 * len, y0 = cy(u0), y1 = cy(u1);
          k.add(UBOX(), '#c9d1d9', (x0 + x1) / 2, (y0 + y1) / 2, sz, Math.hypot(x1 - x0, y1 - y0) + 0.05, 0.08, 0.08, 0, 0, Math.atan2(y1 - y0, x1 - x0));
          if (s % 2 === 0 && u0 > 0.22 && u0 < 0.78) k.add(UBOX(), '#c9d1d9', x0, 0, sz, 0.03, y0, 0.03);
        }
      } else if (e === 8) { // cầu vòm nano tự mọc: chuỗi hạt ngọc, mặt cầu trắng, đường ráp lam
        for (let s2 = 0; s2 < N; s2++) { const u0 = s2 / N, u1 = (s2 + 1) / N, a = Math.atan2(y(u1) - y(u0), len / N); k.add(UBOX(), '#eef3f7', ((u0 + u1) / 2) * len, (y(u0) + y(u1)) / 2 - 0.2, 0, len / N + 0.05, 0.3, 2.6, 0, 0, a); }
        for (let s2 = 0; s2 <= N; s2 += 2) { const u = s2 / N; for (const sz of [-1.35, 1.35]) k.add(ICO(), s2 % 4 ? '#dff6ff' : '#eef3f7', u * len, y(u) + 0.3, sz, 0.45, 0.55, 0.45); k.add(ICO(), '#7ff0ff', u * len, y(u) + 0.05, 0, 0.12, 0.12, 0.12, 0, 0, 0, 'glow'); }
        for (const u of [0.3, 0.7]) k.add(SPHG(), '#e2ebf0', u * len, -8, 0, 1.2, 8 + y(u), 1.2);
      } else if (e === 9) { // lối đi lơ lửng: những phiến sáng trôi giữa vòng năng lượng
        for (let s2 = 0; s2 < 9; s2++) { const x = ((s2 + 0.5) / 9) * len; k.box('#fff3e0', x, 0.55 + Math.sin(s2 * 1.7) * 0.08, 0, len / 9.6, 0.18, 2.4); k.add(TORUS(), '#ffb347', x, 0.1, 0, 0.9, 0.9, 0.9, 0, Math.PI / 2, 0, 'glow'); }
        for (const sz of [-1.3, 1.3]) k.box('#ffd27a', len / 2, 0.75, sz, len, 0.05, 0.05, 0, 'glow');
      } else if (e === 10) { // cặp cổng không gian: bước vào cổng này, bước ra ở cổng kia
        for (const u of [0.05, 0.95]) { k.add(TORUS(), '#b48cff', u * len, 2.6, 0, 2.5, 2.5, 3.2, Math.PI / 2, 0, 0, 'glow'); k.add(TORUS(), '#e0ccff', u * len, 2.6, 0, 1.9, 1.9, 2.2, Math.PI / 2, 0, 0, 'glow'); k.add(UCYL(24), '#6a3fc0', u * len, 2.6, 0, 2.3, 0.05, 2.3, 0, 0, Math.PI / 2, 'ghost'); k.box('#3a2a5a', u * len, -0.2, 0, 3.2, 0.3, 3.2); }
        for (let s2 = 1; s2 < 12; s2++) k.add(ICO(), '#c9a6ff', (s2 / 12) * len, 1.2 + Math.sin(s2) * 0.4, 0, 0.12, 0.12, 0.12, 0, 0, 0, 'ghost');
      } else if (e === 11) { // cầu ánh sáng
        k.add(UCYL(10), '#fff6dc', len / 2, 0.2, 0, 0.9, len, 0.9, 0, 0, Math.PI / 2, 'ghost');
        k.box('#fff3c4', len / 2, 0.02, 0, len, 0.06, 2.2, 0, 'glow');
      } else if (e === 7) {
        k.box('#7ff0ff', len / 2, -0.1, 0, len, 0.12, 2.8, 0, true); k.box('#20252c', len / 2, -0.3, 0, len, 0.2, 3.2);
        for (let i = 1; i < 6; i++) k.add(TORUS(), '#dfe7ee', (i / 6) * len, 1.6, 0, 2.2, 2.2, 2.2, Math.PI / 2, 0, 0, true);
        for (const sz of [-1.5, 1.5]) k.box('#7ff0ff', len / 2, 0.5, sz, len, 0.05, 0.05, 0, true);
      } else {
        k.box('#4a4d52', len / 2, -0.3, 0, len, 0.4, 3.4); k.box('#f4f4f4', len / 2, 0.11, 0, len - 1, 0.02, 0.12);
        k.box('#eef1f4', len / 2, -0.3, 0, 1.0, 13, 1.0); k.box('#eef1f4', len / 2, 12.6, 0, 1.4, 0.4, 1.4);
        // dây văng: từ mặt cầu lên đỉnh trụ, hai mặt phẳng dây
        for (const sz of [-0.8, 0.8]) for (let s = 1; s <= 5; s++) for (const dir of [-1, 1]) { const x = len / 2 + dir * s * len / 12, dx = x - len / 2, hgt = 12.4 - (s - 1) * 1.4; k.add(UBOX(), '#cfd6dd', x, 0.1, sz, 0.05, Math.hypot(dx, hgt), 0.05, 0, 0, Math.atan2(dx, hgt)); }
      }
      const g = meshOf(k, B.litMat, scene, 0, 0, 0, e === 4);
      const d = pb.clone().sub(pa);
      g.position.copy(pa).addScaledVector(d.clone().normalize(), -0.6); g.rotation.y = -Math.atan2(d.z, d.x);
      B.g = g; B.era = e; B.len = len; B.pa = pa; B.pb = pb;
    }
    function bridgePoint(B, u, out) { return out.copy(B.pa).lerp(B.pb, u).setY(deckY(Math.max(0, B.era), u) + 0.12); }
    // giàn giáo: cột và ván mọc dần từ phía người bắc cầu
    function syncScaffold(B) {
      const b = B.sim.build, step = b ? Math.floor((1 - b.left / b.total) * 10) : -1;
      if (step === B.scStep) return;
      B.scStep = step;
      if (B.sg) { scene.remove(B.sg); disposeGroup(B.sg); B.sg = null; }
      if (!b) return;
      const fromA = b.by === B.a, p = (step + 1) / 10, k = new Kit(), len = B.len, N = Math.max(1, Math.round(len * p / 1.1));
      for (let s = 0; s < N; s++) {
        const u = (s + 0.5) / Math.round(len / 1.1), x = (fromA ? u : 1 - u) * len;
        k.box('#9b7653', x, -0.1, 0, 1.0, 0.1, 1.9);
        if (s % 2 === 0) for (const sz of [-0.9, 0.9]) { k.cyl('#c8b07a', x, -6, sz, 0.07, 8.2, 5); k.add(UBOX(), '#c8b07a', x, 1.6, sz, 0.06, 0.06, 1.0); }
      }
      k.cyl('#c8b07a', (fromA ? 0.02 : 0.98) * len, 0, 0, 0.12, 3.4, 5);
      const g = meshOf(k, B.litMat, scene, 0, 0, 0), d = B.pb.clone().sub(B.pa);
      g.position.copy(B.pa).addScaledVector(d.clone().normalize(), -0.6); g.rotation.y = -Math.atan2(d.z, d.x);
      B.sg = g;
    }

    // Đoàn hàng qua cầu
    const CART_N = 90, carts = [];
    const cartMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(0.75, 0.5, 0.5), new THREE.MeshStandardMaterial({ flatShading: true, roughness: 0.8 }), CART_N);
    cartMesh.castShadow = true; cartMesh.frustumCulled = false; scene.add(cartMesh);
    for (let n = 0; n < CART_N; n++) { carts.push({ on: false }); cartMesh.setMatrixAt(n, ZERO); }
    let cartIdx = 0;
    function sendCart(B, fromA, sector) {
      const n = cartIdx++ % CART_N, c = carts[n];
      Object.assign(c, { on: true, B, dir: fromA ? 1 : -1, t0: performance.now() + Math.random() * 900, dur: 5200 - B.era * 450, lane: (Math.random() - 0.5) * 0.6 });
      cartMesh.setColorAt(n, C(sector === 'food' ? '#d9b65a' : '#8a6a4a'));
      if (cartMesh.instanceColor) cartMesh.instanceColor.needsUpdate = true;
    }
    const _v = new THREE.Vector3();
    function updateCarts() {
      const now = performance.now();
      carts.forEach((c, n) => {
        if (!c.on) return;
        const k = (now - c.t0) / c.dur;
        if (k < 0) { cartMesh.setMatrixAt(n, ZERO); return; }
        if (k > 1) { c.on = false; cartMesh.setMatrixAt(n, ZERO); return; }
        const u = c.dir > 0 ? k : 1 - k;
        bridgePoint(c.B, u, _v);
        const d = c.B.pb.clone().sub(c.B.pa).normalize(), side = new THREE.Vector3(-d.z, 0, d.x);
        _o.position.copy(_v).addScaledVector(side, c.lane).setY(_v.y + 0.3 + (c.B.era < 2 ? Math.abs(Math.sin(k * 60)) * 0.05 : 0));
        _o.rotation.set(0, -Math.atan2(d.z, d.x), 0); _o.scale.setScalar(c.B.era >= 4 ? 1.4 : c.B.era >= 2 ? 1.1 : 0.8); _o.updateMatrix();
        cartMesh.setMatrixAt(n, _o.matrix);
      });
      cartMesh.instanceMatrix.needsUpdate = true;
    }

    /* =============== Đoàn người di cư: từ thành phố láng giềng qua cầu vào quảng trường =============== */
    const WALK_N = 160, walkers = [];
    const wP = new THREE.InstancedMesh(new THREE.BoxGeometry(0.34, 0.3, 0.26), new THREE.MeshStandardMaterial({ color: '#c8a36a', flatShading: true, roughness: 0.9 }), WALK_N);
    for (const m of [wP]) { m.frustumCulled = false; m.castShadow = true; scene.add(m); for (let n = 0; n < WALK_N; n++) m.setMatrixAt(n, ZERO); }
    const walkSets = [];
    for (let n = 0; n < WALK_N; n++) walkers.push({ on: false });
    let walkIdx = 0;
    function procession(to, n, from) {
      const L = lands[to], now = performance.now();
      const B = from >= 0 ? bridges.find((b) => (b.a === from && b.b === to) || (b.b === from && b.a === to)) : null;
      let base;
      if (B) { const fwd = B.a === from; base = []; for (let k = 0; k <= 8; k++) base.push(bridgePoint(B, fwd ? k / 8 : 1 - k / 8, new THREE.Vector3())); }
      else base = [L.world(L.out.clone().multiplyScalar(LAND_R + 6)).setY(-2), L.world(L.out.clone().multiplyScalar(LAND_R - 1))]; // bộ lạc đầu tiên đến từ phía ngoài bể
      const pal = SHIRTS[Math.max(0, L.era)];
      for (let k = 0; k < n; k++) {
        const idx = walkIdx++ % WALK_N, w = walkers[idx], a = Math.random() * TAU, r = 2.5 + Math.random() * 4;
        const pts = base.map((v) => v.clone());
        pts.push(L.world(new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r)));
        const lens = [0]; for (let j = 1; j < pts.length; j++) lens.push(lens[j - 1] + pts[j].distanceTo(pts[j - 1]));
        Object.assign(w, { on: true, pts, lens, t0: now + k * 420, dur: lens[lens.length - 1] * 260 + Math.random() * 800, side: (Math.random() - 0.5) * 0.9, e: Math.max(0, L.era), seed: idx * 17 + to });
      }
      void pal;
    }
    function updateWalkers(t) {
      const now = performance.now();
      let any = false;
      for (const S of walkSets) if (S) crowdBegin(S);
      walkers.forEach((w, n) => {
        if (!w.on) return;
        any = true;
        const k = (now - w.t0) / w.dur;
        if (k < 0) { wP.setMatrixAt(n, ZERO); return; }
        if (k >= 1) { w.on = false; wP.setMatrixAt(n, ZERO); return; }
        const d = k * w.lens[w.lens.length - 1];
        let j = 1; while (j < w.lens.length - 1 && w.lens[j] < d) j++;
        const s = (d - w.lens[j - 1]) / Math.max(1e-6, w.lens[j] - w.lens[j - 1]);
        _v.lerpVectors(w.pts[j - 1], w.pts[j], s);
        const dir = w.pts[j].clone().sub(w.pts[j - 1]).setY(0).normalize(), side = new THREE.Vector3(-dir.z, 0, dir.x);
        const bob = reduce ? 0 : Math.abs(Math.sin(t * 0.012 + n)) * 0.08;
        const S = walkSets[w.e] || (walkSets[w.e] = crowdSet(scene, 60, w.e)), pos = _v.clone().addScaledVector(side, w.side);
        crowdPut(S, n % 3 === 0 ? 1 : 0, pos, Math.atan2(dir.x, dir.z), reduce ? 0 : 1, 0, w.seed, 1.05);
        void bob;
        _o.position.copy(pos).setY(pos.y + 0.66); _o.rotation.set(0, Math.atan2(dir.x, dir.z), 0); _o.scale.setScalar(1); _o.translateZ(-0.22); _o.updateMatrix(); wP.setMatrixAt(n, _o.matrix);
      });
      for (const S of walkSets) if (S) crowdEnd(S);
      if (any) wP.instanceMatrix.needsUpdate = true;
    }

    /* =============== Khởi tạo =============== */
    for (let i = 0; i < 6; i++) makeLand(i);
    for (const b of W.bridges) { const B = { sim: b, a: b.a, b: b.b, era: -1, g: null, litMat: new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.4, emissive: '#ffcf7a', emissiveIntensity: 0 }) }; bridges.push(B); buildBridge(B, b.era); }

    /* =============== Mỗi ngày: đồng bộ với nền kinh tế =============== */
    function syncDay(animate) {
      for (const L of lands) {
        const c = W.cities[L.i];
        if (!c.settled) continue;
        if (!L.shown) { L.shown = true; setEra(L, c.era, false); }
        else if (c.era !== L.era) setEra(L, c.era, animate);
        syncHouses(L, c.w, animate);
        syncFirms(L, c.w, animate);
      }
      for (const B of bridges) { if (B.sim.era !== B.era) buildBridge(B, B.sim.era); syncScaffold(B); }
      // đoàn hàng: mỗi chuyến buôn qua cầu trong ngày là một xe (tàu buôn trên biển do lớp biển vẽ)
      if (animate) for (const t of W.trade) { if (t.bridge == null) continue; const B = bridges[t.bridge]; sendCart(B, t.from === B.a, t.sector); if (t.q > 6) sendCart(B, t.from === B.a, t.sector); }
    }

    /* =============== Mỗi khung hình =============== */
    let lastSlow = 0;
    const hashI = (n) => hash(n);
    function walkPath(L, h) {
      const H = L.houses[Math.floor(h.id / 4)];
      if (!H) return null;
      const o = h.employer !== null ? L.firmObj.get(h.employer) : null;
      const home = L.houseLots[H.idx].p;
      if (o) return [home, lotOf(L, o)];
      if (h.employer === -1 && L.milLot.barracks) return [home, L.milLot.barracks]; // người đi lính ra trại
      const w = W.cities[L.i].w, G = w && w.gold;
      if (G && !G.closed && h.employer === G.firmId) return [home, L.minePos]; // thợ mỏ lên Đồi Mây
      return null;
    }
    const _dir2 = new THREE.Vector3();
    function updatePeople(L, tod, t, fadNow) {
      const w = W.cities[L.i].w, S = L.crowd;
      if (!w || !S) { L.hats.count = 0; return; }
      if (L.hush && L.hush > performance.now()) { crowdBegin(S); crowdEnd(S); L.hats.count = 0; return; } // giới nghiêm, xuống hầm: phố vắng
      const N = Math.min(L.peopleN, w.households.length);
      crowdBegin(S);
      let nh = 0;
      for (let n = 0; n < N; n++) {
        const h = w.households[n], off = (hashI(n + L.i * 1000) - 0.5) * 0.06;
        let p = null, walking = false, ry = hashI(n + 21) * TAU;
        if (h.sick > 0) { /* nằm nhà */ }
        else if (h.employer !== null) {
          const pts = walkPath(L, h);
          if (pts) {
            if (tod > 0.24 + off && tod < 0.33 + off) { p = _v.copy(pts[0]).lerp(pts[1], (tod - 0.24 - off) / 0.09); walking = true; _dir2.copy(pts[1]).sub(pts[0]); ry = Math.atan2(_dir2.x, _dir2.z); }
            else if (tod > 0.7 + off && tod < 0.79 + off) { p = _v.copy(pts[1]).lerp(pts[0], (tod - 0.7 - off) / 0.09); walking = true; _dir2.copy(pts[0]).sub(pts[1]); ry = Math.atan2(_dir2.x, _dir2.z); }
          }
        } else if (tod > 0.3 && tod < 0.74) {
          const sgn = hashI(n) > 0.5 ? 1 : -1, a = hashI(n + 3) * TAU + t * 0.00006 * sgn, r = 4.6 + hashI(n + 4) * 2.0;
          p = _v.set(Math.cos(a) * r, 0, Math.sin(a) * r); walking = true; ry = -a + (sgn > 0 ? 0 : Math.PI);
        }
        if (!p) continue;
        p.x += (hashI(n + 8) - 0.5) * 0.8; p.z += (hashI(n + 9) - 0.5) * 0.8;
        const v = S.e >= 7 && n % 5 === 0 ? 2 : n % 3 === 0 ? 1 : 0;
        crowdPut(S, v, p, ry, walking && !reduce ? 1 : 0, 0, n * 13 + L.i * 7, 1.05);
        if (fadNow && h.hype === fadNow.id && nh < L.peopleN) { _o.position.set(p.x, 1.24, p.z); _o.rotation.set(0, 0, 0); _o.scale.setScalar(0.7); _o.updateMatrix(); L.hats.setMatrixAt(nh++, _o.matrix); }
      }
      crowdEnd(S);
      L.hats.count = nh; L.hats.instanceMatrix.needsUpdate = true;
      if (fadNow) L.hats.material.color.set(fadNow.color);
    }
    function economyVisuals(L, night) {
      const c = W.cities[L.i], w = c.w;
      if (!w) return;
      for (const H of L.houses) {
        const lv = houseLevel(L, H.idx);
        if (lv !== H.lv && !L.queue.length && Math.random() < 0.08) { rebuildHouse(L, H, L.era, lv); }
      }
      for (const [id, o] of L.firmObj) {
        const f = w.firms.find((x) => x.id === id); if (!f) continue;
        o.busy = f.alive && !(f.strike > 0) ? clamp(f.workers.length / 8, 0, 1) : 0;
        if (o.fire) o.fire.userData.level = f.alive ? 0.3 + o.busy : 0;
      }
      const hungry = w.households.filter((h) => !h.ateToday).length / w.households.length;
      const dark = L.dark && L.dark > performance.now(); // cúp điện: cửa sổ tắt hết
      L.litMat.emissiveIntensity = (dark ? 0.03 : 1) * night * (1.25 - hungry * 0.8);
    }
    function animate(dt, t, night, tod, fadOf, inView) {
      FIG_UNI.uTime.value = reduce ? 0 : t * 0.001;
      const now = performance.now(), spin = reduce ? 0 : dt * 0.001;
      for (const L of lands) {
        runQueue(L, dt);
        for (const H of L.houses) if (H.grow < 1) { H.grow = Math.min(1, H.grow + dt / 1600); H.g.scale.y = 1 - Math.pow(1 - H.grow, 3); }
        for (const [id, o] of L.firmObj) {
          if (o.grow < 1 && !o.dying) { o.grow = Math.min(1, o.grow + dt / 1800); o.g.scale.y = 1 - Math.pow(1 - o.grow, 3); }
          if (o.dying) {
            o.dying += dt / 1800; o.g.scale.setScalar(Math.max(0.001, 1.3 - o.dying * 0.3)); o.g.position.y = -(o.dying - 1) * 0.6;
            if (o.dying > 4.3) { L.g.remove(o.g); unclickable(o.g); disposeGroup(o.g); if (o.kind !== 'dock') (o.kind === 'farm' ? L.farmOwner : L.shopOwner)[o.lot] = null; L.firmObj.delete(id); L.slotOf.delete(id); L.fires = L.fires.filter((x) => x.owner !== 'firm' + id); }
            continue;
          }
          if (o.spin) o.spin.obj.rotation[o.spin.axis] -= spin * o.spin.speed * (0.4 + o.busy * 2.2);
          if (o.smoke && o.busy > 0 && !reduce && Math.random() < 0.05 * o.busy) for (const s of o.smoke) puff(L.world(new THREE.Vector3(s[0], s[1], s[2]).applyAxisAngle(new THREE.Vector3(0, 1, 0), o.g.rotation.y).add(o.g.position)), true);
        }
        for (const F of L.fires) { const fl = 0.7 + 0.3 * Math.sin(t * 0.017 + F.ph) * Math.sin(t * 0.011 + F.ph * 2); F.s.scale.setScalar(F.base * fl); F.s.material.opacity = (0.25 + night * 0.7) * fl * (F.s.userData.level == null ? 1 : F.s.userData.level); }
        const dk = L.dark && L.dark > performance.now() ? 0.06 : 1;
        for (const s of L.glows) s.material.opacity = dk * (s.userData.nightOnly ? night * 0.85 * s.userData.level : (0.35 + night * 0.5) * s.userData.level);
        // khói bếp lúc sáng và chiều tối
        if (!reduce && L.era >= 1 && L.era <= 4 && ((tod > 0.7 && tod < 0.85) || (tod > 0.22 && tod < 0.28))) for (const H of L.houses) { H.smokeT -= dt / 1000; if (H.smokeT <= 0) { H.smokeT = 1.4 + Math.random() * 1.5; puff(L.world(new THREE.Vector3(L.houseLots[H.idx].p.x + 0.6, 4.6 + (H.lv - 1) * 1.3, L.houseLots[H.idx].p.z - 0.4)), false); } }
        for (const m of L.waterMats) m.emissiveIntensity = 0.25 + Math.sin(t * 0.002 + L.i) * 0.05 + night * 0.15;
      }
      for (const B of bridges) B.litMat.emissiveIntensity = night * 1.2;
      updateCarts(); updateWalkers(t);
      // người đi lại chỉ tính lại ở những đảo đang nằm trong khung nhìn
      const slow = t - lastSlow > 250;
      if (slow) lastSlow = t;
      for (const L of lands) { if (slow) economyVisuals(L, night); if (!inView || inView(L.i)) updatePeople(L, tod, t, fadOf ? fadOf(L.i) : null); }
    }
    // màu theo mùa cho mặt đất và cây
    function seasons(sw, drought) {
      const tmp = new THREE.Color();
      for (const L of lands) {
        const st = TSTYLE[L.ter];
        if (st.season) {
          const g0 = L.groundBase, cs = [g0.clone().lerp(C('#a2d873'), 0.3), g0.clone(), g0.clone().lerp(C('#c2ad58'), 0.5), g0.clone().lerp(C('#eef3f6'), L.ter === 'coast' ? 0.4 : 0.8)];
          tmp.setRGB(0, 0, 0); for (let s = 0; s < 4; s++) if (sw[s]) { tmp.r += cs[s].r * sw[s]; tmp.g += cs[s].g * sw[s]; tmp.b += cs[s].b * sw[s]; }
          if (drought) tmp.lerp(C('#cdb168'), drought * 0.6);
          L.groundMat.color.copy(tmp);
        }
        treeColors(L, sw);
      }
    }

    const peopleKit = { bodyGeo, headGeo, headMat: new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.8 }), shirts: SHIRTS[3] };
    return {
      lands, bridges, syncDay, animate, seasons, setEra, walkPath, procession, people: peopleKit, LAND_R, RING, SC, bridgePoint, deckY,
      fig: { FigKit, figMaterial, crowdSet, crowdBegin, crowdPut, crowdEnd, crowdDispose, DRESS, dressOf, SKIN_T, FIG_UNI, personShape, soldierShape },
      kit: { Kit, meshOf, UBOX, UCYL, UCONE, TCYL, DOME, GABLE, VAULT, ICO, DOD, OCT, SPHG, TORUS, disposeGroup, bodyMat, metalMat, pick, STY, roofOn, styHall, addFire, addGlow, clearTrees, dust, landRng, setBeyond: (e) => { BEY = e; }, glowMat, ghostMat, recolorG },
      landOf: (i) => lands[i],
      firmPos: (i, id) => { const L = lands[i], o = L.firmObj.get(id); return o ? o.g.position : null; },
      housePos: (i, idx) => { const L = lands[i], H = L.houses[idx]; return H ? L.houseLots[H.idx].p : null; },
    };
  }

  root.Lands3D = { create, LAND_R, RING, SC };
})(typeof self !== 'undefined' ? self : this);
