/* Bể Kính — sáu miền đất (chỉ thiên nhiên).
 * Địa hình, hồ, sông, cây của sáu miền và sáu cây cầu thô nối thành vòng. Không có công trình hay người ở đây:
 * công trình nằm ở render/buildings3d.js và render/build/, người nằm ở render/ và logic/.
 * index.html gọi animate() mỗi khung hình và seasons() khi đổi mùa. Mỗi miền gộp thành ít khối hình tô màu theo đỉnh. */
(function (root) {
  'use strict';
  // đảo rộng hơn để có chỗ cho bãi săn và bãi tập kết quân; SC đổi các khoảng cách cũ (đảo bán kính 30) sang đảo mới
  const LAND_R = 62, RING = 154, SC = LAND_R / 30; // đảo to hơn nữa (bán kính 50 → 62); vòng đảo nới ra để giữ khe biển giữa các đảo

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
        // thời thứ mười hai: thành phố cyberpunk. Khối nhà sẫm màu xanh đen, tím than; viền neon xanh lơ, hồng, vàng chạy quanh
        // các tầng và dọc bốn cạnh; biển hiệu phát sáng trên mặt tiền; ăng-ten đèn đỏ trên mái; cửa sổ ánh neon
        const NEONS = ['#2ef2ff', '#ff3ec8', '#ffe14a', '#8a5bff'], i1 = Math.floor(rnd() * 4), c1 = NEONS[i1], c2 = NEONS[(i1 + 1 + Math.floor(rnd() * 3)) % 4];
        const dark = ['#1b1f33', '#241a3a', '#14202e', '#2a2438'][Math.floor(rnd() * 4)];
        for (const g of k.b) recolorG(g, dark, 0.74);
        for (const g of k.l) recolorG(g, c1, 0.7);
        const r = rx * 0.96, glow = (c, x, y, z, sx, sy, sz) => k.add(UBOX(), c, x, y, z, sx, sy, sz, 0, 0, 0, 'glow');
        const levels = Math.max(1, Math.min(4, Math.floor(H / 1.5)));
        for (let i = 0; i < levels; i++) {
          const y = H * (0.18 + (0.78 * i) / levels), c = i % 2 ? c2 : c1;
          glow(c, 0, y, r, r * 2, 0.07, 0.07); glow(c, 0, y, -r, r * 2, 0.07, 0.07); glow(c, r, y, 0, 0.07, 0.07, r * 2); glow(c, -r, y, 0, 0.07, 0.07, r * 2);
        }
        for (const [sx, sz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) glow(c2, sx * r, 0, sz * r, 0.08, H, 0.08);
        if (H > 1.2) { const side = rnd() < 0.5 ? 1 : -1; glow(rnd() < 0.5 ? c1 : '#ff5a7a', side * (r + 0.04), H * 0.45, 0, 0.05, Math.min(1.8, H * 0.32), r * 1.1); } // biển hiệu
        k.add(UCYL(5), '#3a3f4a', rx * 0.3, H, -rx * 0.2, 0.05, 1.3, 0.05);
        k.add(ICO(), '#ff3a3a', rx * 0.3, H + 1.35, -rx * 0.2, 0.13, 0.13, 0.13, 0, 0, 0, 'glow');
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
    const ROAD = ['#b0916a', '#c4a87c', '#b8ad99', '#d3c6ad', '#9a948a', '#55585e', '#3a3d42', '#23262b', '#dfe7ee', '#e8d8c0', '#b9a8e8', '#1c1a2a'];
    const PLAZA_C = ['#b08f66', '#d9c9a3', '#bcb3a3', '#cbbd9f', '#b9b2a6', '#e4e6e8', '#eef1f4', '#f4f6f8', '#eef3f7', '#f6ead8', '#d9cff2', '#2a2440'];
    // màu đèn đường mỗi thời vượt người: lam ngọc, hổ phách, tím, trắng ấm
    const BEY_LAMP = ['#7ff0ff', '#7ff0ff', '#ffb347', '#b48cff', '#ff3ec8'];

    /* =============== Địa hình sáu miền =============== */
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
      // hồ: mặt nước theo một đường viền riêng r(góc), mỗi miền một dáng
      const lakeGeo = (R, rf, n) => { const sh = new THREE.Shape(); for (let i = 0; i <= (n || 48); i++) { const t = (i / (n || 48)) * TAU, r = R * rf(t); if (i === 0) sh.moveTo(Math.cos(t) * r, Math.sin(t) * r); else sh.lineTo(Math.cos(t) * r, Math.sin(t) * r); } return new THREE.ShapeGeometry(sh); };
      const setLake = (x, z, R) => { L.lake = [x, z]; L.lakeR = R; prop(x, z, R + 0.4); };
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
        // đồng bằng: đồng cỏ hoa dại ở hai cánh, đồng cỏ ở giữa, sông uốn khúc đổ vào hồ sen
        // đồng cỏ hoa dại ở hai cánh (trước đây là ruộng bậc; đảo thô chưa có người cày cấy)
        for (let i = 0; i < 26; i++) { const deg = (i % 2 ? 1 : -1) * (48 + rng() * 64), r = 34 + rng() * 9; if (r > edge(deg, 2.4)) continue; const [x, z] = at(deg, r); k.add(SPHG(), pick(['#9fcf62', '#b5d86a', '#86bf5c'], rng()), x, -0.02, z, 1.6 + rng() * 1.8, 0.12, 1.4 + rng() * 1.6, rng() * 3); for (let f = 0; f < 4; f++) k.blob(ICO(), pick(['#f4e07a', '#f2a0b8', '#ffffff', '#c9a0f0'], rng()), x + (rng() - 0.5) * 2.4, 0.12, z + (rng() - 0.5) * 2.4, 0.12, 0.4); }
        const pts = [];
        for (let s = 0; s <= 40; s++) { const u = s / 40, d = -36 + u * 72, r = 24 + 5 * Math.sin(u * Math.PI * 2.5) + u * 10; pts.push(at(d, Math.min(edge(d, 0.6), r))); }
        ribbon(pts, 6.2, 0.03, new THREE.MeshStandardMaterial({ color: '#c9b48a', roughness: 0.9, flatShading: true, side: THREE.DoubleSide }));
        ribbon(pts, 4.0, 0.08, waterMat());
        L.river = pts;
        // hồ sen cuối sông: dáng quả thận, lá sen xanh và hoa hồng
        { const [ex, ez] = pts[pts.length - 1], [bx, bz] = at(30, 27), x = (ex + bx) / 2, z = (ez + bz) / 2, R = 6.2;
          flat(lakeGeo(R + 1.2, (t) => 1 + 0.24 * Math.sin(2 * t) + 0.1 * Math.sin(3 * t + 1)), x, z, 0.03, '#c9b48a');
          water(lakeGeo(R, (t) => 1 + 0.24 * Math.sin(2 * t) + 0.1 * Math.sin(3 * t + 1)), x, z, 0, 0.08, '#4aa3c7');
          for (let i = 0; i < 22; i++) { const a = rng() * TAU, r = Math.sqrt(rng()) * R * 0.78; k.cyl('#5d9e4a', x + Math.cos(a) * r, 0.1, z + Math.sin(a) * r, 0.55 + rng() * 0.35, 0.03, 8); if (rng() < 0.4) k.add(ICO(), pick(['#f28ab2', '#f7b6cf', '#ffffff'], rng()), x + Math.cos(a) * r, 0.22, z + Math.sin(a) * r, 0.22, 0.22, 0.22); }
          setLake(x, z, R * 1.15); }
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
        L.river = pts;
        // hồ rừng cuối suối: bờ lượn nhiều khúc, lau sậy, lá súng
        { const [ex, ez] = pts[pts.length - 1], [bx, bz] = at(70, 26), x = (ex + bx) / 2, z = (ez + bz) / 2, R = 6.6, rf = (t) => 1 + 0.16 * Math.sin(3 * t) + 0.1 * Math.cos(5 * t + 0.6);
          flat(lakeGeo(R + 1, rf), x, z, 0.03, '#6b5a3a');
          water(lakeGeo(R, rf), x, z, 0, 0.08, '#2f7f9a');
          for (let i = 0; i < 30; i++) { const t = rng() * TAU, r = R * rf(t) * (0.9 + rng() * 0.2); k.add(UCYL(4), pick(['#6f8f3a', '#8a9a48', '#5d7a32'], rng()), x + Math.cos(t) * r, 0, z + Math.sin(t) * r, 0.07, 1.1 + rng() * 0.9, 0.07, (rng() - 0.5) * 0.3, 0, (rng() - 0.5) * 0.3); }
          for (let i = 0; i < 9; i++) { const a = rng() * TAU, r = Math.sqrt(rng()) * R * 0.7; k.cyl('#4f8a3f', x + Math.cos(a) * r, 0.1, z + Math.sin(a) * r, 0.4 + rng() * 0.3, 0.03, 7); }
          setLake(x, z, R * 1.2); }
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
        { const [x, z] = at(-28, 24); k.tcyl('#8f8a7c', x, 0, z, 6.2, 5.8, 4.2, 9); k.cyl('#8fa274', x, 4.2, z, 5.8, 0.12, 9); prop(x, z, 6.4); L.plateau = [x, z, 4.3]; }
        // hồ núi hình giọt nước, xanh thẫm, viền đá cuội và một hòn đảo đá nhỏ giữa hồ
        { const [x, z] = at(30, 22), R = 5.6, rf = (t) => 0.72 + 0.36 * Math.cos(t) * Math.abs(Math.cos(t * 0.5)) + 0.06 * Math.sin(4 * t);
          const ry = -(oa + 0.6); // mũi giọt nước chĩa về phía trong đảo
          flat(lakeGeo(R + 0.9, rf), x, z, 0.03, '#9d9589').rotation.z = ry;
          water(lakeGeo(R, rf), x, z, ry, 0.08, '#2c6f9a');
          for (let i = 0; i < 18; i++) { const t = (i / 18) * TAU, r = R * rf(t) + 0.5; k.blob(DOD(), pick(['#8b8577', '#7c776b', '#a39b8e'], rng()), x + Math.cos(t + ry) * r, 0.15, z - Math.sin(t + ry) * r, 0.35 + rng() * 0.35, 0.6); }
          k.blob(DOD(), '#7f7a6e', x, 0.1, z, 0.9, 0.8); k.cone('#3f7a4c', x + 0.2, 0.6, z, 0.4, 1.2, 6);
          setLake(x, z, R * 1.1); }
        for (let b = 0; b < 26; b++) { const [x, z] = at((rng() - 0.5) * 190, 20 + rng() * 14); if (L.inside(x, z, 1) && !L.blockedWild(x, z, 0.5)) k.blob(DOD(), pick(['#8b8577', '#7c776b', '#9d9589'], rng()), x, 0.2, z, 0.4 + rng() * 0.9, 0.7); }
      }
      if (L.ter === 'tundra') {
        // băng nguyên: hồ đóng băng, sống băng, vách sông băng, khe nứt, mảng băng trôi tách khỏi đảo
        // hồ băng sáu cạnh, mặt băng nứt
        { const [x, z] = at(-22, 23), R = 7.4, rf = (t) => { const s6 = Math.PI / 3, u = ((t % s6) + s6) % s6 - s6 / 2; return (Math.cos(s6 / 2) / Math.cos(u)) * (1 + 0.05 * Math.sin(7 * t)); };
          flat(lakeGeo(R + 0.8, rf, 72), x, z, 0.03, '#eef6fa').rotation.z = 0.3;
          water(lakeGeo(R, rf, 72), x, z, 0.3, 0.06, '#cfeaf5');
          for (let i = 0; i < 6; i++) { const a = rng() * TAU, l = 2 + rng() * 3.5; k.box('#9cc7dc', x + Math.cos(a) * l * 0.5, 0.075, z + Math.sin(a) * l * 0.5, l, 0.01, 0.08, -a); }
          setLake(x, z, R * 1.05); }
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
        // đầm phá hình bông hoa năm cánh, bãi cát bao quanh
        const lagoonF = (t) => 1 + 0.2 * Math.cos(5 * t) + 0.05 * Math.sin(9 * t);
        flat(lakeGeo(LR + 2.6, lagoonF, 80), lagoon[0], lagoon[1], 0.03, '#ecd9a8');
        const lw = water(lakeGeo(LR, lagoonF, 80), lagoon[0], lagoon[1], 0, 0.1, '#3fc0c8', 0.78);
        lw.renderOrder = 2;
        for (let i = 0; i < 26; i++) { const a = rng() * TAU, r = rng() * (LR - 1.2); k.blob(ICO(), pick(['#ff8f7a', '#ffb36b', '#e97ab0', '#7fd1c6', '#f4e3a1', '#c46a9a'], rng()), lagoon[0] + Math.cos(a) * r, 0.02, lagoon[1] + Math.sin(a) * r, 0.25 + rng() * 0.35, 0.6); }
        for (const [dx, dz, R] of [[-3.2, 2.2, 1.6], [3.6, -1.2, 1.3], [0.6, -4.4, 1.1]]) { k.add(SPHG(), '#ecd9a8', lagoon[0] + dx, 0, lagoon[1] + dz, R, 0.35, R); k.add(UCYL(5), '#8a6a46', lagoon[0] + dx, 0.2, lagoon[1] + dz, 0.12, 2.4, 0.12, 0, 0.18, 0.1); k.blob(ICO(), '#5f9f4a', lagoon[0] + dx + 0.4, 2.6, lagoon[1] + dz + 0.2, 1.1, 0.3); }
        prop(lagoon[0], lagoon[1], LR + 1.6); L.lagoon = [lagoon[0], lagoon[1], LR];
        const sandPts = []; for (let s = 0; s <= 50; s++) { const d = -120 + s * 4.8; sandPts.push(at(d, edge(d, 2.4))); }
        ribbon(sandPts, 4.6, 0.025, new THREE.MeshStandardMaterial({ color: '#ecd9a8', roughness: 0.95, flatShading: true, side: THREE.DoubleSide }));
        for (let r2 = 0; r2 < 12; r2++) { const d = -110 + rng() * 220, [x, z] = at(d, edge(d, 0.8)); k.blob(DOD(), '#7d7a74', x, 0.2, z, 0.6 + rng() * 0.8, 0.7); }
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
        // ốc đảo hình trăng khuyết, bờ cát sẫm và hàng cỏ lác
        { const [x, z] = at(62, 20), R = 5.2, rot = -(oa + (62 * Math.PI) / 180);
          const cres = (rr) => { const sh = new THREE.Shape(); for (let i = 0; i <= 40; i++) { const t = -2.4 + (i / 40) * 4.8; const px = Math.cos(t) * rr, py = Math.sin(t) * rr; if (i === 0) sh.moveTo(px, py); else sh.lineTo(px, py); } for (let i = 40; i >= 0; i--) { const t = -2.0 + (i / 40) * 4.0; sh.lineTo(Math.cos(t) * rr * 0.62 + rr * 0.42, Math.sin(t) * rr * 0.62); } return new THREE.ShapeGeometry(sh); };
          flat(cres(R + 1.1), x, z, 0.03, '#b98a55').rotation.z = rot;
          water(cres(R), x, z, rot, 0.07, '#3fb0b8');
          L.oasis = [x, z]; L.lakeR = R; prop(x, z, R + 0.6); }
      }
      if (k.b.length || k.l.length) meshOf(k, L.litMat || bodyMat, L.g, 0, 0, 0);
      // bãi săn: vùng hoang phía ngoài; bãi tập kết quân: một khoảng đất nện cạnh đường ra cổng
      L.hunt = { oa, spread: 0.86, r0: 24, margin: 3 };
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
      const dens = { plains: 210, forest: 520, mountain: 240, tundra: 160, coast: 160, desert: 70 }[L.ter]; // bớt cây để nhẹ máy
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

    /* =============== Mạng đường của mỗi đảo =============== */
    // Mỗi đảo một mạng đường riêng: đường lớn từ quảng trường ra hai cổng cầu và ra bến, hai vành đai, những nhánh toả ra,
    // những lối nhỏ ra tới mép đảo, cộng một kiểu đường riêng của miền: bờ ruộng ô bàn cờ ở đồng bằng, đường mòn săn bắn
    // ngoằn ngoèo trong rừng, đường dốc chữ chi lên mỏ trên núi, vệt xe trượt tuyết ra bờ băng, lối gỗ ven biển,
    // đường đoàn lạc đà qua ốc đảo. Đường không đi xuyên công trình: gặp công trình thì dừng trước cửa.
    // Mạng đường cũng là đồ thị để người đi lại: mọi chỗ giao nhau là một nút, người tìm đường ngắn nhất theo đồ thị.
    function planRoads(L, wildAt) {
      const V = (x, z) => new THREE.Vector2(x, z), at = (a, r) => V(Math.cos(a) * r, Math.sin(a) * r);
      const oa = Math.atan2(L.out.z, L.out.x), ia = oa + Math.PI, rng = landRng(L.i + 77);
      const res = [[L.bankPos, 3.4], [L.schoolPos, 3.4], [L.dockPos, 3.2], [L.portPos, 4.2], [L.musterPos, 5.6], [L.wonderPos, 4.2], [L.siloPos, 3.2]];
      for (const k2 of ['eco', 'hea', 'rel', 'tra', 'mil']) res.push([L.slots[k2], 4.2]);
      if (L.lake) res.push([{ x: L.lake[0], z: L.lake[1] }, (L.lakeR || 4.6) + 0.6]);
      if (L.oasis) res.push([{ x: L.oasis[0], z: L.oasis[1] }, (L.lakeR || 3.4) + 0.6]);
      const hit = (x, z) => !L.inside(x, z, 2.4) || res.some(([p, r]) => (p.x - x) ** 2 + (p.z - z) ** 2 < r * r) || L.blockedWild(x, z, 0.6);
      const segs = [];
      // một đường gấp khúc: cắt bỏ đoạn đi vào công trình, vào vùng hoang (trừ đường mòn), vào quảng trường
      function poly(pts, w, kind, wild, inner) {
        for (let i = 0; i + 1 < pts.length; i++) {
          const a = pts[i], b = pts[i + 1], n = Math.max(1, Math.ceil(a.distanceTo(b) / 2.2));
          let run = null;
          for (let k = 0; k < n; k++) {
            const p = a.clone().lerp(b, k / n), q = a.clone().lerp(b, (k + 1) / n), mx = (p.x + q.x) / 2, mz = (p.y + q.y) / 2;
            const bad = hit(mx, mz) || (!wild && wildAt(mx, mz)) || Math.hypot(mx, mz) < (inner == null ? 6.6 : inner);
            if (bad) { if (run) { segs.push(run); run = null; } continue; }
            if (run) run.b = q; else run = { a: p, b: q, w, kind };
          }
          if (run) segs.push(run);
        }
      }
      const arc = (r, a0, a1, n) => { const out = []; for (let k = 0; k <= n; k++) out.push(at(a0 + ((a1 - a0) * k) / n, r)); return out; };
      // đường lớn: quảng trường ra hai cổng cầu, ngân hàng ra bến
      for (const p of L.landing) poly([at(Math.atan2(p.z, p.x), 6.2), V(p.x, p.z)], 0, 'main', true, 6);
      poly([V(L.bankPos.x * 1.3, L.bankPos.z * 1.3), V(L.harbor.x, L.harbor.z)], 0, 'main', true, 6);
      // vành đai, những phố toả ra từ quảng trường, lối nhỏ ra mép đảo
      poly(arc(34, 0, TAU, 80), 1, 'street');
      const nSp = 6;
      for (let k = 0; k < nSp; k++) { const a = oa + Math.PI / nSp + (k / nSp) * TAU; poly([at(a, 6.4), at(a + 0.06, 19), at(a, 34.7)], 1, 'street'); }
      for (let k = 0; k < 3; k++) { const a = ia + (k - 1) * 0.8 + (rng() - 0.5) * 0.12; poly([at(a, 33.5), at(a + (rng() - 0.5) * 0.1, 40), at(a, 46.5)], 2, 'lane'); }
      // kiểu đường riêng của từng miền
      if (L.ter === 'plains') {
        // bờ ruộng: những đường thẳng song song, cắt nhau thành ô bàn cờ
        const ux = Math.cos(oa), uz = Math.sin(oa), vx = -uz, vz = ux;
        for (const d of [-25]) poly([V(ux * -46 + vx * d, uz * -46 + vz * d), V(ux * 46 + vx * d, uz * 46 + vz * d)], 2, 'field');
        for (const d of [19]) poly([V(vx * -46 + ux * d, vz * -46 + uz * d), V(vx * 46 + ux * d, vz * 46 + uz * d)], 2, 'field');
      } else if (L.ter === 'forest') {
        // đường mòn săn bắn uốn lượn vào rừng sâu
        for (const [a0, a1] of [[oa - 1.25, oa - 0.35], [oa + 1.25, oa + 0.4], [oa - 0.1, oa + 0.15]]) {
          const pts = []; for (let k = 0; k <= 10; k++) { const u = k / 10, r = 34 + u * 12, a = a0 + (a1 - a0) * u + Math.sin(u * 9 + a0) * 0.12; pts.push(at(a, r)); }
          poly(pts, 2, 'trail', true);
        }
      } else if (L.ter === 'mountain') {
        // đường dốc chữ chi lên mỏ và lên đèo
        for (const [to, a0] of [[L.minePos, null], [null, oa]]) {
          const ta = to ? Math.atan2(to.z, to.x) : a0, tr = to ? Math.hypot(to.x, to.z) - 2 : 44, pts = [];
          for (let k = 0; k <= 8; k++) { const u = k / 8, r = 12 + (tr - 12) * u, side = k % 2 ? 1 : -1; pts.push(at(ta + (k && k < 8 ? side * (4.5 / r) : 0), r)); }
          poly(pts, 2, 'switch', true);
        }
      } else if (L.ter === 'tundra') {
        // vệt xe trượt tuyết kéo thẳng ra bờ băng
        for (let k = 0; k < 6; k++) { const a = oa + (k - 2.5) * 0.36; poly([at(a, 20), at(a + 0.04, 34), at(a, 47)], 2, 'track', true); }
      } else if (L.ter === 'coast') {
        // lối gỗ chạy dọc bờ trong, những cầu tàu nhỏ ra mép nước
        poly(arc(42.5, ia - 1.15, ia + 1.15, 30), 1, 'boardwalk', true);
        for (const da of [-0.95, -0.55, 0.62, 1.0]) poly([at(ia + da, 42.5), at(ia + da, 48.5)], 2, 'boardwalk', true);
      } else if (L.ter === 'desert') {
        // đường đoàn lạc đà: cổng cầu này qua ốc đảo sang cổng cầu kia
        const g0 = L.gates[0], g1 = L.gates[1], mid = L.oasis ? V(L.oasis[0], L.oasis[1]) : at(oa, 25), pts = [];
        for (let k = 0; k <= 24; k++) { const u = k / 24, a = (1 - u) * (1 - u), b = 2 * (1 - u) * u, c = u * u; pts.push(V(g0.x * a + mid.x * 1.25 * b + g1.x * c, g0.z * a + mid.y * 1.25 * b + g1.z * c)); }
        poly(pts, 0, 'caravan', true);
      }
      // tách đoạn ở chỗ giao nhau để mọi ngã tư, ngã ba đều là nút của đồ thị
      const cross = (p, q, r, s2) => { const d = (q.x - p.x) * (s2.y - r.y) - (q.y - p.y) * (s2.x - r.x); if (Math.abs(d) < 1e-6) return null; const t = ((r.x - p.x) * (s2.y - r.y) - (r.y - p.y) * (s2.x - r.x)) / d, u = ((r.x - p.x) * (q.y - p.y) - (r.y - p.y) * (q.x - p.x)) / d; return t > -0.02 && t < 1.02 && u > -0.02 && u < 1.02 ? [t, u] : null; };
      const cuts = segs.map(() => []);
      for (let i = 0; i < segs.length; i++) for (let j = i + 1; j < segs.length; j++) {
        const c = cross(segs[i].a, segs[i].b, segs[j].a, segs[j].b); if (!c) continue;
        if (c[0] > 0.02 && c[0] < 0.98) cuts[i].push(c[0]);
        if (c[1] > 0.02 && c[1] < 0.98) cuts[j].push(c[1]);
      }
      const out = [];
      segs.forEach((S, i) => { const ts = [0, ...cuts[i].sort((a, b) => a - b), 1]; for (let k = 0; k + 1 < ts.length; k++) { if (ts[k + 1] - ts[k] < 1e-3) continue; out.push({ a: S.a.clone().lerp(S.b, ts[k]), b: S.a.clone().lerp(S.b, ts[k + 1]), w: S.w, kind: S.kind }); } });
      // đồ thị: đầu mút gần nhau gộp thành một nút
      const nodes = [], adj = [];
      const nodeAt = (p) => { for (let i = 0; i < nodes.length; i++) if (nodes[i].distanceToSquared(p) < 0.5) return i; nodes.push(p.clone()); adj.push([]); return nodes.length - 1; };
      nodeAt(V(0, 0)); // quảng trường là nút đầu tiên
      for (const S of out) { const i = nodeAt(S.a), j = nodeAt(S.b); if (i === j) continue; const w = S.a.distanceTo(S.b) * (S.w === 2 ? 1.25 : 1); adj[i].push([j, w]); adj[j].push([i, w]); }
      // đường lớn chạm quảng trường: nối vào nút giữa
      nodes.forEach((p, i) => { if (i && p.length() < 7) { const w = p.length(); adj[0].push([i, w]); adj[i].push([0, w]); } });
      // những đoạn đường bị công trình cắt rời: nối vào mạng chính bằng lối mòn ngắn
      const clearLine = (a, b) => { const n = Math.ceil(a.distanceTo(b) / 1.5); for (let k = 1; k < n; k++) { const x = a.x + ((b.x - a.x) * k) / n, z = a.y + ((b.y - a.y) * k) / n; if (hit(x, z) || Math.hypot(x, z) < 6.2) return false; } return true; };
      for (let pass = 0; pass < 12; pass++) {
        const comp = new Int32Array(nodes.length).fill(-1); let nc = 0;
        for (let i = 0; i < nodes.length; i++) { if (comp[i] >= 0 || (!adj[i].length && i)) continue; const st = [i]; comp[i] = nc; while (st.length) { const u = st.pop(); for (const [v] of adj[u]) if (comp[v] < 0) { comp[v] = nc; st.push(v); } } nc++; }
        if (nc <= 1) break;
        let best = null;
        for (let i = 0; i < nodes.length; i++) { if (comp[i] <= 0) continue; for (let j = 0; j < nodes.length; j++) { if (comp[j] !== 0) continue; const d = nodes[i].distanceTo(nodes[j]); if (d < 16 && (!best || d < best[2]) && clearLine(nodes[i], nodes[j])) best = [i, j, d]; } }
        if (!best) break;
        const [i, j, d] = best; adj[i].push([j, d * 1.25]); adj[j].push([i, d * 1.25]);
        out.push({ a: nodes[i].clone(), b: nodes[j].clone(), w: 2, kind: 'lane' });
      }
      return { segs: out, nodes, adj };
    }
    // tìm đường theo mạng đường: từ chỗ gần nhất của điểm đi tới chỗ gần nhất của điểm đến (Dijkstra, có nhớ)
    function routeOn(L, ax, az, bx, bz) {
      const N = L.net, near = (x, z) => { let best = 0, bd = 1e9; N.nodes.forEach((p, i) => { const d = (p.x - x) ** 2 + (p.y - z) ** 2; if (d < bd && N.adj[i].length) { bd = d; best = i; } }); return best; };
      const s0 = near(ax, az), t0 = near(bx, bz);
      // cây đường ngắn nhất từ một nút tới mọi nút: tính một lần cho mỗi nút xuất phát rồi nhớ
      let T = N.cache.get(s0);
      if (!T) {
        const n = N.nodes.length, dist = new Float32Array(n).fill(1e9), prev = new Int32Array(n).fill(-1), done = new Uint8Array(n);
        dist[s0] = 0;
        for (let it = 0; it < n; it++) {
          let u = -1, bd = 1e9; for (let i = 0; i < n; i++) if (!done[i] && dist[i] < bd) { bd = dist[i]; u = i; }
          if (u < 0) break; done[u] = 1;
          for (const [v, w] of N.adj[u]) if (dist[u] + w < dist[v]) { dist[v] = dist[u] + w; prev[v] = u; }
        }
        T = { dist, prev }; N.cache.set(s0, T);
      }
      const path = [];
      if (T.dist[t0] < 1e9) for (let v = t0; v >= 0; v = T.prev[v]) { path.push(v); if (v === s0) break; }
      path.reverse();
      // đường vòng quá xa so với đi thẳng (hai mảnh đường không nối): đi thẳng
      if (path.length && T.dist[t0] > 3.2 * Math.hypot(ax - bx, az - bz) + 30) path.length = 0;
      const pts = [new THREE.Vector3(ax, 0, az)];
      for (const i of path) pts.push(new THREE.Vector3(N.nodes[i].x, 0, N.nodes[i].y));
      pts.push(new THREE.Vector3(bx, 0, bz));
      return pts;
    }

    /* =============== Bố trí lô đất của mỗi miền =============== */
    function layout(L) {
      const taken = [];
      const oa = Math.atan2(L.out.z, L.out.x);
      // bãi săn hoang dã phía ngoài đảo (thu hẹp lại một chút để lõi thành đủ chỗ cho nhà)
      const wildAt = (x, z) => { const r = Math.hypot(x, z), a = Math.atan2(z, x), rel = Math.abs(Math.atan2(Math.sin(a - oa), Math.cos(a - oa))); return r > 23 && rel < 0.9; };
      L.net = planRoads(L, wildAt); L.net.cache = new Map();
      L.roadNet = L.net.segs;
      L.route = (ax, az, bx, bz) => routeOn(L, ax, az, bx, bz);
      const HW = [1.4, 0.8, 0.25]; // nửa bề rộng (lối nhỏ tính hẹp hơn: nhà được sát lối mòn)
      const roadsSeg = L.roadNet.map((S) => [S.a, S.b, HW[S.w]]);
      const segDist = (x, z, a, b) => { const abx = b.x - a.x, abz = b.y - a.y, t = clamp(((x - a.x) * abx + (z - a.y) * abz) / (abx * abx + abz * abz), 0, 1); return Math.hypot(x - (a.x + abx * t), z - (a.y + abz * t)); };
      L.roadDist = (x, z) => { let m = 1e9; for (const [a, b, hw] of roadsSeg) { const d = segDist(x, z, a, b) - hw; if (d < m) m = d; } return m; }; // khoảng cách tới mép đường gần nhất
      L.wildAt = wildAt;
      // chỗ dành sẵn: quảng trường, ngân hàng, trường, mỏ
      taken.push({ x: 0, z: 0, r: 7.4 }, { x: L.bankPos.x, z: L.bankPos.z, r: 4.2 }, { x: L.schoolPos.x, z: L.schoolPos.z, r: 4.2 }, { x: L.minePos.x, z: L.minePos.z, r: 4.4 });
      taken.push({ x: L.dockPos.x, z: L.dockPos.z, r: 3.6 }, { x: L.portPos.x, z: L.portPos.z, r: 4.4 });
      for (const k2 of ['eco', 'hea', 'rel', 'tra', 'mil']) taken.push({ x: L.slots[k2].x, z: L.slots[k2].z, r: 4.6 });
      taken.push({ x: L.musterPos.x, z: L.musterPos.z, r: 6.2 }, { x: L.wonderPos.x, z: L.wonderPos.z, r: 4.2 }, { x: L.siloPos.x, z: L.siloPos.z, r: 3.2 });
      for (const t of L.towerPos) taken.push({ x: t.x, z: t.z, r: 1.7 });
      L.blocked = (x, z, r) => {
        if (Math.hypot(x, z) < 6.6 + r) return true;
        if (L.roadDist(x, z) < 0.3 + r * 0.85) return true; // nhà, cây không lấn ra đường
        if (Math.hypot(x - L.bankPos.x, z - L.bankPos.z) < 3.4 + r || Math.hypot(x - L.schoolPos.x, z - L.schoolPos.z) < 3.4 + r) return true;
        if (L.river) for (const [px, pz] of L.river) if ((px - x) ** 2 + (pz - z) ** 2 < (3.4 + r) ** 2) return true;
        if (L.lake && Math.hypot(x - L.lake[0], z - L.lake[1]) < (L.lakeR || 4.6) + r) return true;
        if (L.oasis && Math.hypot(x - L.oasis[0], z - L.oasis[1]) < (L.lakeR || 3.4) + 0.2 + r) return true;
        if (Math.hypot(x - L.dockPos.x, z - L.dockPos.z) < 3.4 + r || Math.hypot(x - L.portPos.x, z - L.portPos.z) < 4.2 + r) return true;
        if (L.blockedWild(x, z, r) || Math.hypot(x - L.musterPos.x, z - L.musterPos.z) < 6 + r) return true;
        for (const k2 in L.slots) if (Math.hypot(x - L.slots[k2].x, z - L.slots[k2].z) < 4.2 + r) return true;
        return false;
      };
      const free = (x, z, r, wildOk) => L.inside(x, z, 1.6 + r * 0.4) && (wildOk || !wildAt(x, z)) && !L.blocked(x, z, r) && taken.every((t) => (t.x - x) ** 2 + (t.z - z) ** 2 > (t.r + r) ** 2);
      function hexLots(r, gap, cap, accept, wildOk) {
        const sp = 2 * r + gap, out = [], jN = Math.ceil((LAND_R + 12) / (sp * 0.866)), iN = Math.ceil((LAND_R + 12) / sp); // phủ hết đảo dù lưới dày hay thưa
        for (let j = -jN; j <= jN; j++) {
          const z = j * sp * 0.866;
          for (let i2 = -iN; i2 <= iN; i2++) {
            const x = i2 * sp + (j % 2 ? sp / 2 : 0);
            const jx = x + (hash(L.i * 91 + j * 31 + i2) - 0.5) * gap, jz = z + (hash(L.i * 77 + j * 17 + i2 * 3) - 0.5) * gap;
            if (accept(jx, jz) && free(jx, jz, r, wildOk)) out.push(new THREE.Vector3(jx, 0, jz));
          }
        }
        return out;
      }
      const near = (pts, cap, key) => { pts.sort((a, b) => key(a) - key(b)); const res = []; for (const p of pts) { if (res.length >= cap) break; if (taken.every((t) => (t.x - p.x) ** 2 + (t.z - p.z) ** 2 > (t.r + p.r) ** 2)) { taken.push({ x: p.x, z: p.z, r: p.r }); res.push(p); } } return res; };
      const sh = hexLots(2.8, 0.4, 0, (x, z) => L.roadDist(x, z) < 7 && Math.hypot(x, z) > 8).map((p) => Object.assign(p, { r: 2.8 }));
      L.shopLots = near(sh, 16, (p) => Math.hypot(p.x, p.z));
      // tám lô cho công trình quân sự và kinh tế, rải đều trên vành ngoài khu dân cư
      const ml = hexLots(3.0, 0.6, 0, (x, z) => { const r = Math.hypot(x, z); return r > 15 && r < (wildAt(x, z) ? 34 : 41); }, true).map((p) => Object.assign(p, { r: 3.0 }));
      ml.sort((a, b) => Math.abs(a.length() - 25.5) - Math.abs(b.length() - 25.5));
      L.milLots = [];
      for (const gap of [7.4, 6.4, 5.6]) for (const p of ml) { if (L.milLots.length >= 8) break; if (!L.milLots.includes(p) && L.milLots.every((q) => q.distanceTo(p) > gap)) L.milLots.push(p); }
      // đảo chật (núi, mesa): tìm thêm chỗ nhỏ hơn, rộng hơn cho đủ tám công trình
      if (L.milLots.length < 8) {
        const m2 = hexLots(2.6, 0.3, 0, (x, z) => { const r = Math.hypot(x, z); return r > 11 && r < (wildAt(x, z) ? 40 : 45); }, true).filter((p) => L.milLots.every((q) => q.distanceTo(p) > 5.4)).map((p) => Object.assign(p, { r: 2.6 }));
        m2.sort((a2, b2) => Math.abs(a2.length() - 25.5) - Math.abs(b2.length() - 25.5));
        for (const p of m2) { if (L.milLots.length >= 8) break; if (L.milLots.every((q) => q.distanceTo(p) > 5.4)) L.milLots.push(p); }
      }
      for (const p of L.milLots) taken.push({ x: p.x, z: p.z, r: 3.2 });
      L.milLot = {};
      ['barracks', 'range', 'stable', 'siege', 'forge', 'granary', 'academy', 'market'].forEach((key, i) => { L.milLot[key] = L.milLots[i % Math.max(1, L.milLots.length)]; });
      // ruộng trước: ưu tiên dải giáp bãi săn hoang dã (ruộng giáp rừng, giáp đồng cỏ), rồi vùng ven
      const fm = hexLots(3.1, 0.3, 0, (x, z) => { const r = Math.hypot(x, z); return r > 15 && (!wildAt(x, z) || r < 39); }, true).map((p) => Object.assign(p, { r: 3.1 }));
      L.farmLots = near(fm, 12, (p) => Math.abs(Math.hypot(p.x, p.z) - 31) + (wildAt(p.x, p.z) ? 0 : 7));
      // nhà ở: lõi thành, gần quảng trường trước
      const hs = hexLots(1.8, 0.15, 0, (x, z) => Math.hypot(x, z) > 7.4).map((p) => Object.assign(p, { r: 1.8 }));
      L.houseLots = near(hs, 96, (p) => Math.hypot(p.x, p.z)).map((p) => ({ p, used: false }));
      // nhà phố dọc hai bên đường lớn, phố, lối gỗ, đường lạc đà: những chỗ còn trống sát mép đường
      const FR = 1.55;
      L.frontLots = [];
      for (const S of L.roadNet) {
        if (S.kind === 'track' || S.kind === 'field' || S.kind === 'trail' || S.kind === 'switch' || (S.w === 2 && S.kind !== 'boardwalk')) continue;
        const dx = S.b.x - S.a.x, dz = S.b.y - S.a.y, len = Math.hypot(dx, dz);
        if (len < 2.6) continue;
        const ux = dx / len, uz = dz / len, nx = -uz, nz = ux, off = HW[S.w] + 0.35 + FR;
        for (let d = 1.5; d < len - 1.0; d += 3.2) for (const side of [-1, 1]) {
          const x = S.a.x + ux * d + nx * off * side, z = S.a.y + uz * d + nz * off * side;
          if (Math.hypot(x, z) < 8.4 || !L.inside(x, z, 1.4) || (wildAt(x, z) && S.kind !== 'caravan')) continue;
          if (L.blocked(x, z, FR) || taken.some((t) => (t.x - x) ** 2 + (t.z - z) ** 2 < (t.r + FR - 0.15) ** 2)) continue;
          if (L.frontLots.some((f) => (f.p.x - x) ** 2 + (f.p.z - z) ** 2 < (2 * FR - 0.05) ** 2)) continue;
          L.frontLots.push({ p: new THREE.Vector3(x, 0, z), ry: Math.atan2(-nx * side, -nz * side), r: FR, d: Math.hypot(x, z), kind: S.kind });
        }
      }
      // cây, công trình kỳ lạ không mọc đè lên nhà phố
      const blocked0 = L.blocked;
      L.blocked = (x, z, r) => blocked0(x, z, r) || L.frontLots.some((f) => (f.p.x - x) ** 2 + (f.p.z - z) ** 2 < (f.r + r) ** 2);
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
      L.world = (p) => p.clone().add(center);
      lands.push(L);
      return L;
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
    /* =============== Khởi tạo =============== */
    for (let i = 0; i < 6; i++) makeLand(i);
    for (const b of W.bridges) { const B = { sim: b, a: b.a, b: b.b, era: -1, g: null, litMat: new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.4, emissive: '#ffcf7a', emissiveIntensity: 0 }) }; bridges.push(B); buildBridge(B, b.era); }

    /* =============== Mỗi khung hình: mặt nước lấp lánh, cầu sáng đèn ban đêm =============== */
    function animate(dt, t, night) {
      for (const L of lands) for (const m of L.waterMats) m.emissiveIntensity = 0.25 + Math.sin(t * 0.002 + L.i) * 0.05 + night * 0.15;
      for (const B of bridges) B.litMat.emissiveIntensity = night * 1.2;
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

    return { lands, bridges, animate, seasons, LAND_R, RING, SC, bridgePoint, deckY, clearTrees, landOf: (i) => lands[i] };
  }

  root.Lands3D = { create, LAND_R, RING, SC };
})(typeof self !== 'undefined' ? self : this);
