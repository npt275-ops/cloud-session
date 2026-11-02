/* Bể Kính — sáu công trình trụ cột của mỗi miền.
 * Mỗi miền có sáu công trình riêng (kinh tế, quân sự, giáo dục, y tế, tôn giáo, giao thương). Mỗi công trình đổi dáng
 * qua bốn dải thời đại của loài người (thêm nét riêng ở thời thứ hai của mỗi dải), rồi biến hình ở bốn thời vượt người.
 * Công trình bị lửa chiến tranh thì bốc cháy, sập thành đống đổ nát, rồi dựng lại có giàn giáo. Nhà và xưởng cũng vậy. */
(function (root) {
  'use strict';
  function create(K) {
    const { THREE, Sim, W, lands3d, hash, puff, clickable, unclickable, reduce } = K;
    const TAU = Math.PI * 2, C = (h) => new THREE.Color(h), clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const kitL = lands3d.kit;
    /* =============== Bộ dựng hình gộp: một miền một lượt vẽ, nhà mọc lên theo làn sóng trong shader =============== */
    const GEO = {};
    const G = (key, make) => GEO[key] || (GEO[key] = make().toNonIndexed());
    const gBox = () => G('box', () => { const g = new THREE.BoxGeometry(1, 1, 1); g.translate(0, 0.5, 0); return g; });
    const gCyl = (s) => G('cyl' + s, () => { const g = new THREE.CylinderGeometry(1, 1, 1, s); g.translate(0, 0.5, 0); return g; });
    const gTcyl = (t, s) => G('tc' + t + '_' + s, () => { const g = new THREE.CylinderGeometry(t, 1, 1, s); g.translate(0, 0.5, 0); return g; });
    const gCone = (s) => G('cone' + s, () => { const g = new THREE.ConeGeometry(1, 1, s); g.translate(0, 0.5, 0); return g; });
    const gSph = () => G('sph', () => new THREE.SphereGeometry(1, 10, 7));
    const gDome = () => G('dome', () => new THREE.SphereGeometry(1, 12, 6, 0, TAU, 0, Math.PI / 2));
    const gIco = () => G('ico', () => new THREE.IcosahedronGeometry(1, 0));
    const gTor = () => G('tor', () => new THREE.TorusGeometry(1, 0.07, 6, 28));
    const gGab = () => G('gab', () => { const s = new THREE.Shape(); s.moveTo(-0.5, 0); s.lineTo(0.5, 0); s.lineTo(0, 1); s.lineTo(-0.5, 0); const g = new THREE.ExtrudeGeometry(s, { depth: 1, bevelEnabled: false }); g.translate(0, 0, -0.5); g.rotateY(Math.PI / 2); return g; });
    // một công trình là danh sách khối: hình, màu, vị trí, tỉ lệ, góc, loại (0 thân, 1 phát sáng, 2 ánh sáng trong suốt)
    function Kit() { this.p = []; }
    const KP = Kit.prototype;
    KP.add = function (g, c, x, y, z, sx, sy, sz, ry, rx, rz, k) { this.p.push({ g, c, x, y, z, sx, sy, sz, ry: ry || 0, rx: rx || 0, rz: rz || 0, k: k || 0 }); return this; };
    KP.box = function (c, x, y, z, w, h, d, ry, k) { return this.add('box', c, x, y, z, w, h, d, ry, 0, 0, k); };
    KP.cyl = function (c, x, y, z, r, h, s, k) { return this.add('cyl' + (s || 8), c, x, y, z, r, h, r, 0, 0, 0, k); };
    KP.tcyl = function (c, x, y, z, rb, rt, h, s, k) { return this.add('tc' + (+(rt / rb).toFixed(2)) + '_' + (s || 8), c, x, y, z, rb, h, rb, 0, 0, 0, k); };
    KP.cone = function (c, x, y, z, r, h, s, ry, k) { return this.add('cone' + (s || 8), c, x, y, z, r, h, r, ry, 0, 0, k); };
    KP.sph = function (c, x, y, z, r, sy, k) { return this.add('sph', c, x, y, z, r, r * (sy || 1), r, 0, 0, 0, k); };
    KP.dome = function (c, x, y, z, r, sy, k) { return this.add('dome', c, x, y, z, r, r * (sy || 1), r, 0, 0, 0, k); };
    KP.ico = function (c, x, y, z, r, k) { return this.add('ico', c, x, y, z, r, r, r, x + z, 0.3, 0, k); };
    KP.tor = function (c, x, y, z, r, flat, k, ry) { return this.add('tor', c, x, y, z, r, r, r, ry || 0, flat ? Math.PI / 2 : 0, 0, k); };
    KP.gab = function (c, x, y, z, len, h, dep, ry, k) { return this.add('gab', c, x, y, z, len, h, dep, ry, 0, 0, k); };
    KP.height = function () { let h = 1; for (const q of this.p) h = Math.max(h, q.y + (q.g === 'sph' || q.g === 'ico' ? q.sy : q.sy)); return h; };
    const geoOf = (key) => { if (key === 'box') return gBox(); if (key === 'sph') return gSph(); if (key === 'dome') return gDome(); if (key === 'ico') return gIco(); if (key === 'tor') return gTor(); if (key === 'gab') return gGab(); if (key.startsWith('cyl')) return gCyl(+key.slice(3)); if (key.startsWith('cone')) return gCone(+key.slice(4)); const [t, s] = key.slice(2).split('_'); return gTcyl(+t, +s); };
    const mixC = (a, b, k) => '#' + C(a).lerp(C(b), k).getHexString();
    function rng(seed) { let s = (seed * 9301 + 49297) % 233280 || 1; return () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; }

    // Bốn thời vượt người biến đổi mọi công trình theo cùng một ngôn ngữ: vật chất sống, tầng lơ lửng, không gian xoắn, ánh sáng
    function beyond(kit, e, seed) {
      if (e < 8) return kit.p;
      const H = kit.height(), r = rng(seed), out = [];
      if (e === 8) {
        for (const q of kit.p) { out.push(Object.assign({}, q, { c: mixC(q.c, '#eef3f7', q.k ? 0.2 : 0.72) })); if (q.k === 0 && r() < 0.18) out.push(Object.assign({}, q, { y: q.y + q.sy * 0.95, sy: 0.06, c: '#7ff0ff', k: 1 })); }
        for (let i = 0; i < 3 + Math.floor(H / 3); i++) out.push({ g: 'ico', c: i % 2 ? '#dff6ff' : '#bfefff', x: (r() - 0.5) * 3, y: H * (0.3 + r() * 0.7), z: (r() - 0.5) * 3, sx: 0.3 + r() * 0.6, sy: 0.5 + r() * 0.9, sz: 0.3 + r() * 0.6, ry: r() * 3, rx: 0, rz: 0, k: i % 3 === 0 ? 1 : 0 });
      } else if (e === 9) {
        for (const q of kit.p) { const lift = q.y > H * 0.62 ? 2.6 : q.y > H * 0.3 ? 1.3 : 0; out.push(Object.assign({}, q, { y: q.y + lift, c: mixC(q.c, '#fff3e0', q.k ? 0.1 : 0.45) })); }
        if (H > 2) for (const [y, rr] of [[H * 0.3 + 0.5, 1.9], [H * 0.62 + 1.8, 1.6]]) out.push({ g: 'tor', c: '#ffb347', x: 0, y, z: 0, sx: rr, sy: rr, sz: rr * 3, ry: 0, rx: Math.PI / 2, rz: 0, k: 1 });
        out.push({ g: 'sph', c: '#ffe9a8', x: 0, y: H + 3.4, z: 0, sx: 0.45, sy: 0.45, sz: 0.45, ry: 0, rx: 0, rz: 0, k: 1 });
      } else if (e === 10) {
        for (const q of kit.p) {
          const a = (q.y / Math.max(1.5, H)) * 1.15, ca = Math.cos(a), sa = Math.sin(a);
          out.push(Object.assign({}, q, { x: q.x * ca + q.z * sa, z: -q.x * sa + q.z * ca, ry: q.ry + a, c: mixC(q.c, '#c9b6ff', q.k ? 0.2 : 0.45) }));
          if (q.k === 0 && r() < 0.22) out.push(Object.assign({}, q, { x: q.x + 0.9, y: q.y + 0.4, c: '#b48cff', k: 2 }));
        }
        out.push({ g: 'tor', c: '#b48cff', x: 0, y: Math.max(1.6, H * 0.45), z: 2.4, sx: 1.2, sy: 1.2, sz: 3, ry: 0, rx: 0, rz: 0, k: 1 });
      } else {
        for (const q of kit.p) out.push(Object.assign({}, q, { c: mixC(q.c, '#fff6dc', 0.62), k: 2 }));
        for (let i = 0; i < 6; i++) out.push({ g: 'sph', c: '#fff3c4', x: (r() - 0.5) * 5, y: r() * (H + 3), z: (r() - 0.5) * 5, sx: 0.14, sy: 0.14, sz: 0.14, ry: 0, rx: 0, rz: 0, k: 1 });
      }
      return out;
    }

    const PAL = {
      plains: [['#a07850', '#8a6a46', '#c9a94e', '#6d5139'], ['#d8cbb0', '#8a6a46', '#9b4a35', '#5a4030'], ['#9b3f2e', '#6b6560', '#4a4d52', '#d9c9a8'], ['#e9edf2', '#b8c4cf', '#f4f6f8', '#e05a6a']],
      forest: [['#7a5a3a', '#5f4630', '#6b7f3a', '#4a3826'], ['#6d5139', '#4a3826', '#3f3a35', '#c9a14e'], ['#6d5139', '#4f5a46', '#4f6b4a', '#2f3540'], ['#c9a87c', '#5f9f4a', '#6aa85a', '#f4f4f4']],
      mountain: [['#8b8577', '#7c776b', '#5f6b62', '#6d695f'], ['#9d9589', '#7f7a6e', '#4a4d52', '#c9bda4'], ['#8f8a80', '#5d5f63', '#3f4650', '#c46a2e'], ['#c9ced4', '#8f8a80', '#aab0b6', '#f2a541']],
      tundra: [['#eef3f6', '#c8b49a', '#eef3f6', '#9aa4ad'], ['#7d5a3a', '#9aa4ad', '#4a4d52', '#e8eef2'], ['#9aa4ad', '#6c757e', '#c46a2e', '#e8eef2'], ['#f4f7f9', '#9fd3f0', '#e8f0f4', '#e05a6a']],
      coast: [['#c8a36a', '#8f6a46', '#d8c27a', '#6d5139'], ['#e3d6bd', '#b9a07a', '#c4603e', '#5a4030'], ['#fbfaf6', '#a14a3a', '#3f7fd6', '#3f7fd6'], ['#ffffff', '#9fd3f0', '#eef6fb', '#f2a541']],
      desert: [['#c98a5a', '#b87b4f', '#d9a46e', '#8f5f3e'], ['#e2bd85', '#c98a5a', '#3fb0b8', '#8f5f3e'], ['#c98a5a', '#5d5f63', '#8f5f3e', '#2f3540'], ['#efdcc0', '#c98a5a', '#f6ead6', '#3fa7d6']],
    };
    const sty = (key, b) => { const [wall, wall2, roof, trim] = PAL[key][b]; return { wall, wall2, roof, trim }; };
    const WIN = '#ffe2a8', GLASS = '#9fd3f0', DARK = '#3a2a1e', METAL = '#9aa0a6', GREEN = '#5f9f4a';
    // khối nhà có cửa sổ (sáng về đêm ở dải sau), mái theo dải
    function hall(k, S, b, x, z, w, h, d, roof) {
      k.box(S.wall, x, 0, z, w, h, d);
      if (b >= 1) for (let r = 0; r < Math.max(1, Math.floor(h / 1.6)); r++) k.box(b >= 2 ? (b === 3 ? GLASS : WIN) : WIN, x, 0.6 + r * 1.5, z + d / 2 + 0.02, w * 0.8, b === 3 ? 0.8 : 0.4, 0.05, 0, b === 3 ? 1 : 0);
      k.box(DARK, x, 0, z + d / 2 + 0.03, Math.min(0.9, w * 0.25), Math.min(1.4, h * 0.55), 0.05);
      if (roof === 'gab') k.gab(S.roof, x, h, z, w + 0.3, Math.min(w, d) * 0.6, d + 0.3);
      else if (roof === 'cone') k.cone(S.roof, x, h, z, Math.max(w, d) * 0.72, Math.min(w, d) * 0.85, 4, Math.PI / 4);
      else if (roof === 'dome') k.dome(S.roof, x, h, z, Math.min(w, d) * 0.45, 0.9);
      else k.box(S.trim, x, h, z, w + 0.2, 0.2, d + 0.2);
      return h;
    }
    // nét riêng của thời thứ hai trong mỗi dải: đuốc và cờ, cờ hiệu và đèn lồng, đèn neon và ăng-ten, vòng sáng và máy bay nhỏ
    function flourish(k, b, H, accent) {
      if (b === 0) { for (const sx of [-1.8, 1.8]) { k.cyl('#6d5139', sx, 0, 1.8, 0.06, 1.4, 5); k.sph('#ff9a3d', sx, 1.5, 1.8, 0.16, 1, 1); } }
      else if (b === 1) { k.cyl('#5b4630', 1.9, 0, 1.6, 0.05, H + 1.2, 5); k.box(accent, 2.2, H + 0.6, 1.6, 0.6, 0.4, 0.03); k.sph('#ffd27a', -1.9, 1.2, 1.9, 0.18, 1, 1); }
      else if (b === 2) { k.box('#ff5fa2', 0, H * 0.6, 1.62, 1.6, 0.25, 0.04, 0, 1); k.cyl(METAL, 1.2, H, -0.8, 0.05, 2.2, 5); k.sph('#ff5a4f', 1.2, H + 2.2, -0.8, 0.12, 1, 1); }
      else { k.tor('#7ff0ff', 0, H + 0.8, 0, 1.3, true, 1); k.box('#2b313a', 1.6, H + 1.6, 0.4, 0.3, 0.08, 0.3); k.sph('#7ff0ff', 1.6, H + 1.5, 0.4, 0.08, 1, 1); }
    }

    /* =============== Ba mươi sáu công trình đặc trưng =============== */
    // mỗi hàm nhận dải b (0 sơ khai, 1 xây đá, 2 máy móc, 3 kỷ nguyên số) và vẽ công trình quay mặt về +z
    const FORMS = {
      plains: [
        (k, b, S) => { if (b === 0) { for (const [x, z] of [[-0.8, -0.8], [0.8, -0.8], [-0.8, 0.8], [0.8, 0.8]]) k.cyl('#6d5139', x, 0, z, 0.1, 1.1, 5); k.box('#8f6a46', 0, 1.1, 0, 1.9, 0.14, 1.9); k.cyl(S.wall, 0, 1.24, 0, 0.8, 0.8, 8); k.cone(S.roof, 0, 2.04, 0, 1.1, 1.0, 8); return 3; } if (b === 1) { hall(k, S, b, -0.6, 0, 3, 2.4, 2.4, 'gab'); k.cyl(S.wall2, 1.8, 0, -0.4, 0.75, 3, 10); k.cone(S.roof, 1.8, 3, -0.4, 0.85, 1, 10); return 4; } if (b === 2) { for (let i = 0; i < 3; i++) { k.cyl('#b8bec4', -1.6 + i * 1.6, 0, 0, 0.72, 5, 12); k.cone(METAL, -1.6 + i * 1.6, 5, 0, 0.76, 0.7, 12); } k.add('box', '#6b6e73', 0, 3.6, 1.2, 0.3, 0.3, 3.6, 0, 0.5, 0); return 5.7; } k.box(S.wall, 0, 0, 0, 3, 9, 3); for (let f = 0; f < 7; f++) { k.box(GREEN, 0, 0.6 + f * 1.2, 0, 3.05, 0.18, 3.05); k.box(GLASS, 0, 0.9 + f * 1.2, 1.52, 2.6, 0.7, 0.04, 0, 1); } k.cyl('#3a3f48', 0, 9, 0, 1.2, 0.12, 12); return 9.2; },
        (k, b, S) => { if (b === 0) { hall(k, S, b, -0.8, 0, 2.2, 1.4, 1.8, 'gab'); k.box('#4aa3c7', 1.2, 0.02, 0, 0.9, 0.1, 3.4, 0, 1); k.tor('#6d5139', 1.2, 1.3, 0, 1.1, false, 0, Math.PI / 2); for (let s = 0; s < 4; s++) k.add('box', '#6d5139', 1.2, 1.3, 0, 0.08, 2.2, 0.08, Math.PI / 2, s * Math.PI / 4, 0); return 2.6; } if (b === 1) { k.tcyl(S.wall, 0, 0, 0, 1.3, 0.85, 5, 8); k.cone(S.roof, 0, 5, 0, 1.0, 1.2, 8); for (let s = 0; s < 4; s++) k.add('box', '#f7f2e6', 0, 4.6, 1.0, 0.5, 3.4, 0.05, 0, 0, s * Math.PI / 2 + 0.4); return 6.2; } if (b === 2) { hall(k, S, b, 0, 0, 5, 2.6, 3, 'flat'); for (let i = 0; i < 3; i++) k.gab(S.roof, -1.7 + i * 1.7, 2.6, 0, 1.6, 0.9, 3, Math.PI / 2); for (const sx of [-1.4, 1.4]) k.tcyl('#7a3a2e', sx, 0, -1.1, 0.36, 0.26, 6.5, 10); return 6.5; } k.dome('#f4f6f8', 0, 0, 0, 2.4, 1); k.tor('#7ff0ff', 0, 1.2, 0, 2.5, true, 1); k.tcyl('#dfe3e8', 2.4, 0, -1.6, 1.0, 0.7, 4, 12); k.cyl(METAL, -2.3, 0, 1.4, 0.06, 5, 5); for (let s = 0; s < 3; s++) k.add('box', '#ffffff', -2.3, 5, 1.5, 0.12, 1.8, 0.04, 0, 0, s * 2.09); return 5; },
        (k, b, S) => { if (b === 0) { for (let s = 0; s < 10; s++) { const a = (s / 10) * TAU; k.box('#8b8577', Math.cos(a) * 2.2, 0, Math.sin(a) * 2.2, 0.45, 1.4 + (s % 2) * 0.5, 0.3, -a); } k.sph('#ff9a3d', 0, 0.3, 0, 0.35, 1, 1); return 2; } if (b === 1) { for (let s = 0; s < 22; s++) { const a = (s / 22) * TAU; k.box(S.wall, Math.cos(a) * 2.6, 0, Math.sin(a) * 2.6, 0.7, 2.6, 0.5, -a + Math.PI / 2); if (s % 2) k.box(DARK, Math.cos(a) * 2.86, 0.2, Math.sin(a) * 2.86, 0.3, 1.2, 0.05, -a + Math.PI / 2); } k.cyl('#d9c27a', 0, 0, 0, 2.1, 0.1, 18); return 2.6; } if (b === 2) { for (let t = 0; t < 2; t++) for (let s = 0; s < 18; s++) { const a = (s / 18) * TAU, rr = 2.4 + t * 0.7; k.add('box', t ? S.wall : S.wall2, Math.cos(a) * rr, t * 0.9, Math.sin(a) * rr * 0.8, 1.0, 0.9, 0.7, -a + Math.PI / 2, -0.35, 0); } k.box(GREEN, 0, 0, 0, 3.4, 0.08, 2.4); for (const [x, z] of [[-3, -2.4], [3, 2.4]]) { k.cyl(METAL, x, 0, z, 0.08, 5, 5); k.box('#fff6c4', x, 5, z, 0.8, 0.4, 0.3, 0, 1); } return 5.4; } k.add('dome', '#cfe8f5', 0, 0, 0, 3.2, 1.4, 2.6, 0, Math.PI, 0); k.cyl('#7ff0ff', 0, 0.05, 0, 2.6, 0.06, 20, 1); k.tor('#dfe7ee', 0, 3, 0, 2.4, true, 0); return 3.2; },
        (k, b, S) => { if (b === 0) { k.dome('#7a5a3a', 0, 0, 0, 2, 0.6); k.cyl('#a0603e', 0, 1.1, 0, 0.22, 3, 6); for (let i = 0; i < 3; i++) k.box(['#c0392b', '#e0b23a', '#3f7fd6'][i], 0, 1.6 + i * 0.7, 0.23, 0.5, 0.35, 0.06); return 4.1; } if (b === 1) { for (let i = 0; i < 3; i++) k.box(i % 2 ? S.wall2 : S.wall, 0, i * 1.4, 0, 4.4 - i * 1.3, 1.4, 4.4 - i * 1.3); k.box('#ffd36b', 0, 4.2, 0, 0.8, 0.8, 0.8); return 5; } if (b === 2) { hall(k, S, b, 0, 0.6, 3, 3, 4, 'gab'); k.box(S.wall2, 0, 0, -2.2, 1.6, 6, 1.6); k.cone(S.roof, 0, 6, -2.2, 1.1, 3.4, 4, Math.PI / 4); k.cyl('#ff9fd0', 0, 2, 2.62, 0.5, 0.05, 12, 1); return 9.4; } k.cyl('#e8ecef', 0, 0, 0, 2.4, 0.4, 16); k.tcyl('#f4f6f8', 0, 0.4, 0, 0.9, 0.3, 11, 10); k.sph('#fff3c4', 0, 11.6, 0, 0.4, 1, 1); return 12; },
        (k, b, S) => { if (b === 0) { k.box('#8b8577', 0, 0, 0, 0.5, 2, 0.5); k.box('#8f6a46', 1.6, 0.35, 0.8, 1.4, 0.5, 0.9); for (const sx of [-0.5, 0.5]) k.tor('#5b4630', 1.6 + sx, 0.4, 0.8, 0.35, false, 0, Math.PI / 2); return 2; } if (b === 1) { hall(k, S, b, -0.6, -0.6, 3, 2, 2.4, 'gab'); for (let i = 0; i < 7; i++) k.cyl('#6d5139', -2 + i * 0.7, 0, 1.8, 0.06, 0.9, 5); k.box('#8f6a46', 1.8, 0.35, 1, 1.2, 0.5, 0.8); return 3.3; } if (b === 2) { k.box('#9a948a', 0, 0, 0, 6, 0.4, 2.4); k.add('dome', S.roof, 0, 0.4, 0, 3, 0.6, 1.4, Math.PI / 2, 0, 0); for (const sz of [1.6, 2.2]) k.box('#3a3a3a', 0, 0, sz, 7, 0.08, 0.12); k.cyl('#2b2b2b', -1, 0.5, 1.9, 0.4, 1.6, 10); k.box('#7a1f1f', 0.4, 0.4, 1.9, 1.2, 1.2, 0.9); k.cyl('#2b2b2b', -1.2, 1.4, 1.9, 0.14, 0.7, 6); return 3.6; } for (const x of [-2.4, 0, 2.4]) k.cyl('#dfe3e8', x, 0, 0, 0.18, 2, 6); k.box('#e8ecef', 0, 2, 0, 7, 0.3, 1.2); k.box('#7ff0ff', 0, 2.31, 0, 7, 0.04, 0.2, 0, 1); k.sph('#f4f6f8', 1, 2.7, 0, 0.5, 0.6); k.box(GLASS, -1.6, 0, 1.6, 2.2, 1.6, 1.2, 0, 1); return 3.3; },
        (k, b, S) => { if (b === 0) { k.box(S.wall, 0, 0, 0, 5, 1.6, 2.2); k.gab(S.roof, 0, 1.6, 0, 5.4, 1.8, 2.6); for (const sx of [-2.8, 2.8]) k.cyl('#a0603e', sx, 0, 1.4, 0.18, 2.6, 6); return 3.4; } if (b === 1) { hall(k, S, b, 0, 0, 3.6, 3, 3, 'cone'); for (const [x, z] of [[-2.4, -2], [2.4, -2], [-2.4, 2], [2.4, 2]]) { k.cyl(S.wall2, x, 0, z, 0.7, 4, 10); k.cone(S.roof, x, 4, z, 0.8, 1.4, 10); } return 5.4; } if (b === 2) { hall(k, S, b, 0, -0.4, 5, 3, 3, 'flat'); for (let i = 0; i < 6; i++) k.cyl('#efe6d2', -2.1 + i * 0.84, 0, 1.3, 0.16, 2.9, 8); k.cyl(S.wall2, 0, 3.1, -0.4, 1.3, 1, 12); k.dome(S.roof, 0, 4.1, -0.4, 1.3, 1); return 5.4; } for (let s = 0; s < 14; s++) { const a = (s / 14) * TAU; k.box(GLASS, Math.cos(a) * 2.6, 0, Math.sin(a) * 2.6, 1.2, 2.4, 0.4, -a + Math.PI / 2, 1); } k.tcyl('#f4f6f8', 0, 0, 0, 0.8, 0.3, 7, 8); k.sph('#7ff0ff', 0, 7.2, 0, 0.4, 1, 1); return 7.5; },
      ],
      forest: [
        (k, b, S) => { const tree = (x, z, h) => { k.tcyl('#6b4b32', x, 0, z, 0.55, 0.35, h, 7); k.ico('#3f7a4c', x, h + 0.8, z, 2.1); }; if (b === 0) { tree(0, 0, 3.6); k.cyl('#8f6a46', 0, 2.2, 0, 1.6, 0.14, 10); k.cone(S.roof, 0, 2.34, 0.4, 0.8, 1.2, 7); return 6; } if (b === 1) { for (const [x, z] of [[-2, 0], [2, -0.6], [0.2, 2]]) { tree(x, z, 3.4); k.cyl('#8f6a46', x, 2.2, z, 1.1, 0.12, 8); k.cone(S.roof, x, 2.32, z, 0.6, 0.9, 6); } k.add('box', '#c8b07a', 0, 2.3, -0.3, 4, 0.06, 0.4, 0.15); k.sph('#ffd27a', 0.2, 2.6, 2, 0.15, 1, 1); return 6; } if (b === 2) { k.tcyl('#6b4b32', 0, 0, 0, 0.7, 0.45, 8, 8); for (let f = 0; f < 4; f++) { k.box(S.wall, 0, 1 + f * 1.6, 0, 3 - f * 0.3, 1.2, 3 - f * 0.3); k.box(WIN, 0, 1.4 + f * 1.6, 1.52 - f * 0.15, 1.8, 0.4, 0.05); } k.ico('#3f7a4c', 0, 9, 0, 2.4); return 11; } for (let f = 0; f < 6; f++) { k.box(S.wall, 0, f * 1.6, 0, 2.6 - f * 0.15, 1.4, 2.6 - f * 0.15); k.box(GREEN, 0, f * 1.6 + 1.4, 0, 3 - f * 0.15, 0.2, 3 - f * 0.15); k.ico('#6aa85a', 1.1, f * 1.6 + 1.8, 1.1, 0.5); } k.ico('#4f8f45', 0, 10, 0, 1.6); return 11; },
        (k, b, S) => { if (b === 0) { for (let i = 0; i < 4; i++) k.add('cyl7', '#7a5a3a', 0, 0.3 + (i % 2) * 0.5, -0.6 + Math.floor(i / 2) * 0.6, 0.28, 2.6, 0.28, 0, 0, Math.PI / 2); k.cyl('#6d5139', 1.8, 0, 1.2, 0.5, 0.6, 8); return 1.4; } if (b === 1) { hall(k, S, b, -0.5, 0, 3.2, 2, 2.4, 'gab'); k.tor('#6d5139', 1.9, 1.1, 0.4, 1.0, false, 0, Math.PI / 2); for (let i = 0; i < 3; i++) k.add('cyl7', '#7a5a3a', -0.5, 0.3, 2 + i * 0.5, 0.25, 2.6, 0.25, 0, 0, Math.PI / 2); return 3.5; } if (b === 2) { hall(k, S, b, 0, -0.5, 4.6, 2.6, 3, 'gab'); k.tcyl('#7a3a2e', 1.8, 0, -1.4, 0.36, 0.26, 6, 10); for (let i = 0; i < 6; i++) k.add('cyl7', '#7a5a3a', -1.6 + (i % 3) * 0.6, 0.3 + Math.floor(i / 3) * 0.5, 2, 0.25, 2.2, 0.25, Math.PI / 2, 0, Math.PI / 2); return 6; } for (const [x, z, r] of [[-1.4, 0, 1.5], [1.4, -0.4, 1.2], [0, 1.6, 1]]) { k.dome('#9be0a4', x, 0, z, r, 1); k.tor('#7ff0ff', x, 0.2, z, r * 1.02, true, 1); } k.add('cyl8', '#dfe3e8', 0, 0.6, 0, 0.2, 3, 0.2, 0, 0, Math.PI / 2); return 1.6; },
        (k, b, S) => { if (b === 0) { for (let s = 0; s < 8; s++) { const a = (s / 8) * TAU; k.tcyl('#7a5a3a', Math.cos(a) * 2, 0, Math.sin(a) * 2, 0.3, 0.2, 1.8 + (s % 2) * 0.6, 6); } k.sph('#ff9a3d', 0, 0.3, 0, 0.35, 1, 1); return 2.4; } if (b === 1) { for (let t = 0; t < 3; t++) { k.box(S.wall, 0, t * 1.5, 0, 2.8 - t * 0.6, 1.2, 2.8 - t * 0.6); k.cone(S.roof, 0, t * 1.5 + 1.2, 0, 2.6 - t * 0.5, 0.5, 4, Math.PI / 4); } k.cone('#c9a14e', 0, 4.7, 0, 0.2, 1, 6); return 5.7; } if (b === 2) { k.add('dome', GLASS, 0, 0, 0, 3, 2.4, 2, Math.PI / 2, 0, 0, 1); for (let i = -2; i <= 2; i++) k.add('box', '#ffffff', i * 1.2, 0, 0, 0.06, 2.4, 4.2, 0, 0, 0); k.ico('#5b9a52', 0, 0.8, 0, 1); return 2.4; } k.dome('#e8ecef', 0, 0, 0, 2, 1); for (let i = 0; i < 14; i++) { const a = i * 0.7; k.sph(i % 2 ? '#7ff0ff' : '#ffb3d9', Math.cos(a) * 0.6, 2 + i * 0.35, Math.sin(a) * 0.6, 0.16, 1, 1); } return 7; },
        (k, b, S) => { if (b === 0) { k.cone('#6d5139', 0, 0, 0, 1.4, 2.2, 7); for (let i = 0; i < 2; i++) { k.cyl('#5b4630', 1.6 + i, 0, 1, 0.05, 1.5, 4); } k.box('#a0785a', 2.1, 1, 1, 0.9, 0.6, 0.04); return 2.4; } if (b === 1) { for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) k.cyl('#6d5139', x, 0, z, 0.12, 3.2, 5); k.box(S.wall, 0, 3.2, 0, 2.4, 1.4, 2.4); k.gab(S.roof, 0, 4.6, 0, 2.7, 1, 2.7); return 5.6; } if (b === 2) { for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) k.add('box', '#9aa0a6', x * 0.6, 0, z * 0.6, 0.1, 9, 0.1, 0, z * 0.08, -x * 0.08); k.box('#c46a2e', 0, 9, 0, 1.6, 1.2, 1.6); k.box(GLASS, 0, 9.3, 0.81, 1.2, 0.5, 0.04, 0, 1); return 10.2; } k.cyl('#dfe3e8', 0, 0, 0, 0.18, 8, 6); k.add('cyl6', '#2b313a', 0, 8, 0, 1.2, 1.6, 1.2); for (let i = 0; i < 3; i++) k.cyl('#7ff0ff', 0, 8.2 + i * 0.5, 0, 1.25, 0.05, 6, 1); return 9.6; },
        (k, b, S) => { const tree = (x, z) => { k.tcyl('#6b4b32', x, 0, z, 0.45, 0.3, 3.2, 7); k.ico('#3f7a4c', x, 4, z, 1.6); }; if (b === 0) { tree(-2.4, 0); tree(2.4, 0); for (let s = 0; s < 8; s++) { const u = s / 7; k.box('#9b7653', -2.2 + u * 4.4, 2.4 - Math.sin(u * Math.PI) * 0.5, 0, 0.5, 0.06, 0.8); } return 5; } if (b === 1) { tree(-2.6, -1); tree(2.6, -1); tree(0, 2); k.box('#8f6a46', 0, 2.6, -1, 5.2, 0.12, 0.8); k.add('box', '#8f6a46', -1.3, 2.6, 0.5, 3.2, 0.12, 0.8, 0.9); for (const x of [-1, 1]) k.sph('#ffd27a', x, 3, -1, 0.15, 1, 1); return 5.6; } if (b === 2) { for (const x of [-2.4, 2.4]) k.box('#9aa0a6', x, 0, 0, 0.3, 4, 0.3); k.box('#5d6168', 0, 4, 0, 5.6, 0.2, 1.2); for (const sz of [-0.55, 0.55]) k.box('#9aa0a6', 0, 4.2, sz, 5.6, 0.5, 0.05); tree(0, -2.4); return 5.6; } for (const x of [-2.4, 2.4]) k.cyl('#dfe3e8', x, 0, 0, 0.18, 4.4, 6); k.tor(GLASS, 0, 4.6, 0, 2.6, true, 1); k.tor('#7ff0ff', 0, 4.5, 0, 2.7, true, 1); return 5; },
        (k, b, S) => { if (b === 0) { k.box('#6b8f3a', 0, 0, 0, 3.6, 0.2, 2.6); for (let r = 0; r < 4; r++) k.box('#4f8f45', -1.2 + r * 0.8, 0.2, 0, 0.4, 0.3, 2.2); for (let i = 0; i < 12; i++) k.cyl('#6d5139', -1.8 + (i % 6) * 0.72, 0, i < 6 ? 1.4 : -1.4, 0.05, 0.8, 4); return 1; } if (b === 1) { k.box('#8f6a46', 0, 0, 0, 3.6, 0.3, 2.6); k.box('#cfe8d6', 0, 0.3, 0, 3.4, 1.4, 2.4, 0, 1); k.gab('#d9eef5', 0, 1.7, 0, 3.6, 1, 2.6); return 2.7; } if (b === 2) { k.ico('#cfe8f5', 0, 1.2, 0, 2.8, 1); k.ico('#5b9a52', 0, 0.8, 0, 1.6); k.box('#9aa0a6', 0, 0, 2.6, 1.2, 1.4, 0.8); return 4; } k.tcyl('#3f8f5a', 0, 0, 0, 1.6, 0.4, 10, 8); for (let i = 0; i < 3; i++) k.tor('#9bf0a8', 0, 3 + i * 2.6, 0, 1.6 - i * 0.35, true, 1); k.sph('#9bf0a8', 0, 10.2, 0, 0.4, 1, 1); return 10.6; },
      ],
      mountain: [
        (k, b, S) => { if (b === 0) { k.dome('#5f5b53', 0, 0, 0, 2.4, 0.9); k.box('#1a1a1a', 0, 0, 2.1, 1.2, 1.2, 0.3); for (const sx of [-0.9, 0.9]) { k.cyl('#5b4630', sx, 0, 2.4, 0.05, 1.2, 4); k.sph('#ff9a3d', sx, 1.3, 2.4, 0.14, 1, 1); } return 2.2; } if (b === 1) { k.dome('#5f5b53', 0, 0, -1, 2.2, 0.8); for (const sx of [-0.7, 0.7]) k.add('box', '#6d5139', sx, 0, 1, 0.14, 3.2, 0.14, 0, 0, sx * 0.3); k.box('#6d5139', 0, 3, 1, 1.6, 0.14, 0.2); k.box('#3a3a3a', 0, 0.02, 2.6, 0.6, 0.06, 3); k.box('#6b4b32', 0, 0.1, 2.8, 0.7, 0.45, 0.6); return 3.2; } if (b === 2) { for (const sx of [-0.8, 0.8]) k.box('#8f2f26', sx, 0, 0, 0.18, 7, 0.18); k.box('#8f2f26', 0, 7, 0, 1.9, 0.2, 0.3); k.tor('#2f3540', 0, 7.5, 0, 0.6, false, 0); k.add('box', '#5d5f63', 1.8, 1, 1.4, 0.4, 0.3, 4, 0, 0.35, 0); k.cone('#4a4440', -2, 0, 1.6, 1.2, 1, 6); return 8.1; } k.box('#3a3f48', 0, 0, 0, 2.4, 1, 2.4); k.tcyl('#9aa0a6', 0, 1, 0, 0.9, 0.5, 8, 8); k.sph('#ff7a2a', 0, 0.5, 0, 0.9, 0.5, 1); k.tor('#7ff0ff', 0, 5, 0, 1.2, true, 1); return 9; },
        (k, b, S) => { if (b === 0) { k.cyl('#7c776b', 0, 0, 0, 1, 0.8, 8); k.sph('#ff7a2a', 0, 0.9, 0, 0.45, 1, 1); k.box('#3a3a3a', 1.6, 0, 0.6, 0.6, 0.5, 0.4); return 1.4; } if (b === 1) { k.tcyl(S.wall, 0, 0, 0, 1.2, 0.8, 3.6, 8); k.sph('#ff7a2a', 0, 0.6, 1.1, 0.35, 1, 1); k.box('#6d5139', 1.6, 0, 0, 1, 0.8, 1); return 3.6; } if (b === 2) { k.tcyl('#5d5f63', 0, 0, 0, 1.4, 0.9, 7, 10); for (const [x, z] of [[1.8, -1], [-1.8, -1]]) k.tcyl('#7a3a2e', x, 0, z, 0.35, 0.25, 7.4, 8); k.box('#ff7a2a', 0, 0.2, 1.42, 0.6, 0.6, 0.04, 0, 1); return 7.4; } k.box('#5d6670', 0, 0, 0, 4, 2.4, 3); k.sph('#ff9a4a', 0, 3.6, 0, 1.1, 1, 1); k.tor('#ffb347', 0, 3.6, 0, 1.5, false, 1); return 4.8; },
        (k, b, S) => { if (b === 0) { for (let s = 0; s < 12; s++) { const a = (s / 12) * TAU; k.box('#8b8577', Math.cos(a) * 2.4, 0, Math.sin(a) * 2.4, 1.3, 1, 0.6, -a + Math.PI / 2); } k.cyl('#6d5139', 0, 0, 0, 0.1, 2.4, 5); return 2.4; } if (b === 1) { k.box(S.wall, 0, 0, 0, 2.8, 4.2, 2.8); for (const [x, z] of [[-1.2, -1.2], [1.2, -1.2], [-1.2, 1.2], [1.2, 1.2]]) k.box(S.wall2, x, 4.2, z, 0.5, 0.5, 0.5); for (const sx of [-2.4, 2.4]) { k.cyl(S.wall, sx, 0, 0, 0.9, 5.2, 10); k.cone(S.roof, sx, 5.2, 0, 1, 1.6, 10); } return 6.8; } if (b === 2) { k.add('cyl6', '#8f8a80', 0, 0, 0, 2.6, 1.6, 2.6); k.box('#1a1a1a', 0, 0.9, 2.2, 2.2, 0.25, 0.1); for (const sx of [-0.8, 0.8]) k.add('cyl6', '#2f3540', sx, 1.1, 2.6, 0.12, 1.4, 0.12, 0, Math.PI / 2, 0); return 1.8; } k.box('#8f99a3', 0, 0, 0, 2, 5, 2); k.dome('#7ff0ff', 0, 0, 0, 3.6, 1.6, 2); return 6; },
        (k, b, S) => { if (b === 0) { k.cone('#8b8577', 0, 0, 0, 1.3, 1.8, 6); for (let i = 0; i < 5; i++) { const a = (i / 5) * TAU; k.add('box', ['#c0392b', '#e0b23a', '#3f7fd6', '#3f9a5a', '#ffffff'][i], Math.cos(a) * 1.2, 1.4, Math.sin(a) * 1.2, 1.5, 0.04, 0.3, -a, 0, 0.3); } return 2; } if (b === 1) { for (let t = 0; t < 3; t++) { k.box(t % 2 ? S.wall2 : S.wall, 0, t * 1.5, 0, 4 - t * 1, 1.3, 3 - t * 0.6); k.box(S.roof, 0, t * 1.5 + 1.3, 0, 4.6 - t * 1, 0.2, 3.6 - t * 0.6); } k.cone('#e0b23a', 0, 4.7, 0, 0.3, 1, 6); return 5.7; } if (b === 2) { k.cyl('#efe6d2', 0, 0, 0, 1.8, 2.4, 14); k.dome('#ffffff', 0, 2.4, 0, 1.8, 1); k.box('#2f3540', 0, 3.2, 1.2, 0.4, 1.2, 0.6); return 4.2; } for (const [x, z] of [[-2, 0], [2, 0], [0, -2]]) { k.cyl('#9aa0a6', x, 0, z, 0.1, 2, 5); k.add('sph', '#f4f4f4', x, 2.6, z, 1.3, 0.35, 1.3, 0, -0.6, 0); } return 4; },
        (k, b, S) => { if (b === 0) { for (const x of [-2.6, 2.6]) k.cyl('#6d5139', x, 0, 0, 0.12, 3, 5); k.box('#c8b07a', 0, 2.9, 0, 5.2, 0.05, 0.05); k.cyl('#8f6a46', 0.6, 1.8, 0, 0.4, 0.6, 8); return 3; } if (b === 1) { k.add('box', '#8f6a46', 0, 0, 0, 0.9, 0.2, 7, 0, 0.5, 0); k.box(S.wall, 0, 1.4, 0.4, 1.2, 0.9, 1.4); return 3.6; } if (b === 2) { for (const z of [-2.4, 2.4]) { k.box('#9aa0a6', 0, 0, z, 0.3, 6, 0.3); k.box('#9aa0a6', 0, 6, z, 1.6, 0.2, 0.2); } for (const sx of [-0.6, 0.6]) k.box('#2f3540', sx, 6.1, 0, 0.04, 0.04, 5); k.box('#e05a6a', 0.6, 5, 0.6, 0.9, 0.8, 1.1); return 6.4; } k.cyl('#2b313a', 0, 0, 0, 1.6, 0.4, 12); k.cyl('#7ff0ff', 0, 0.4, 0, 0.9, 6, 12, 2); k.cyl('#dfe3e8', 0, 4, 0, 1.4, 0.3, 12); return 6.4; },
        (k, b, S) => { if (b === 0) { k.box('#4aa3c7', 0, 0.02, 0, 1.4, 0.1, 6, 0, 1); k.box('#8b8577', 0, 0, 0, 3, 0.8, 0.9); return 0.8; } if (b === 1) { k.box('#4aa3c7', 0, 0.02, 0, 1.4, 0.1, 6, 0, 1); k.box(S.wall, 0, 0, 0, 3.4, 2, 1.2); k.tor('#6d5139', 2, 1.2, 0.8, 1, false, 0, Math.PI / 2); return 2.2; } if (b === 2) { for (let s = 0; s < 8; s++) { const a = -0.6 + s * 0.17; k.box('#b9b5ad', Math.sin(a) * 4, 0, Math.cos(a) * 4 - 4, 1.1, 4.6, 1.2, a); } k.box('#6fc3e3', 0, 0.02, 1.5, 1.4, 0.1, 4, 0, 1); return 4.6; } k.add('cyl6', '#3a3f48', 0, 0, 0, 1.8, 3, 1.8); for (let i = 0; i < 4; i++) k.tor('#ff9a4a', 0, 1 + i * 1.6, 0, 2.2 - i * 0.3, true, 1); k.sph('#ffd27a', 0, 7, 0, 0.6, 1, 1); return 7.6; },
      ],
      tundra: [
        (k, b, S) => { if (b === 0) { k.dome('#eef4f8', 0, 0, 0, 2.6, 0.8); k.add('cyl8', '#e3ebf0', 0, 0.6, 2.4, 0.7, 1.4, 0.8, 0, Math.PI / 2, 0); return 2.1; } if (b === 1) { k.box('#e8f1f6', 0, 0, 0, 4.6, 1.8, 2.4); k.gab('#ffffff', 0, 1.8, 0, 5, 2.2, 2.8); return 4; } if (b === 2) { k.box('#d6eef7', 0, 0, 0, 4, 2.4, 3); for (const [x, z, h] of [[-2, -1.4, 6], [2, -1.4, 6], [0, 1.6, 7.4]]) { k.cyl('#bfe3f2', x, 0, z, 0.6, h, 8); k.cone('#ffffff', x, h, z, 0.7, 2, 8); } return 9.4; } k.ico('#f4f7f9', 0, 1.6, 0, 2.6); k.tor('#bff0ff', 0, 0.3, 0, 2.6, true, 1); return 4.2; },
        (k, b, S) => { const deer = (x, z, ry) => { k.box('#8a6a4a', x, 0.6, z, 0.4, 0.4, 0.9, ry); k.box('#8a6a4a', x, 1.0, z + 0.45, 0.2, 0.35, 0.25, ry); for (const s of [-1, 1]) k.add('box', '#d9c9a8', x + s * 0.12, 1.4, z + 0.45, 0.04, 0.4, 0.04, ry, 0, s * 0.5); for (const [dx, dz] of [[-0.15, 0.3], [0.15, 0.3], [-0.15, -0.3], [0.15, -0.3]]) k.box('#5b4630', x + dx, 0, z + dz, 0.08, 0.6, 0.08); }; if (b === 0) { for (let i = 0; i < 10; i++) { const a = (i / 10) * TAU; k.cyl('#7a5a3a', Math.cos(a) * 2.4, 0, Math.sin(a) * 2.4, 0.06, 0.9, 4); } deer(-0.6, 0, 0.3); deer(0.8, -0.6, 2); return 1.6; } if (b === 1) { hall(k, S, b, 0, -1, 4, 1.8, 2, 'gab'); for (const x of [-1, 1]) { k.box('#8f6a46', x, 0.2, 1.6, 0.7, 0.3, 1.6); k.add('box', '#5b4630', x, 0.1, 2.5, 0.7, 0.05, 0.3, 0, 0.6, 0); } deer(2.4, 1, 0); return 3.4; } if (b === 2) { hall(k, S, b, 0, -0.8, 4.6, 2.6, 2.6, 'gab'); k.box('#c46a2e', 0, 0.4, 1.8, 1.4, 0.8, 1.6); for (const sx of [-0.8, 0.8]) k.box('#2b2b2b', sx, 0, 1.8, 0.3, 0.5, 1.8); return 4; } k.add('dome', '#e8f0f4', 0, 0, 0, 3, 1.6, 2, Math.PI / 2, 0, 0); k.box('#dfe3e8', 0, 0.6, 2.4, 1.6, 0.4, 1.2); k.box('#7ff0ff', 0, 0.5, 2.4, 1.4, 0.05, 1, 0, 1); return 1.8; },
        (k, b, S) => { if (b === 0) { for (const sx of [-1, 1]) k.add('cyl6', '#efe6d2', sx * 1.2, 0, 0, 0.2, 3.4, 0.2, 0, 0, -sx * 0.35); k.ico('#dfe7ee', 0, 3.2, 0, 0.4); return 3.6; } if (b === 1) { for (let i = 0; i < 5; i++) { const x = -2 + i; k.cyl('#7a5a3a', x, 0, 0, 0.08, 4 + (i % 2), 5); k.box(['#7fd98a', '#5fc6e6', '#c3a6ff', '#7fd98a', '#5fc6e6'][i], x + 0.2, 3.4 + (i % 2), 0, 0.4, 0.8, 0.03); } return 5; } if (b === 2) { k.cyl('#e8f0f4', 0, 0, 0, 1.8, 2, 14); k.dome('#ffffff', 0, 2, 0, 1.8, 1); k.cyl(METAL, 2.2, 0, 0.6, 0.06, 2, 5); k.add('sph', '#f4f4f4', 2.2, 2.4, 0.6, 0.8, 0.25, 0.8, 0, -0.6, 0); return 3.8; } for (let i = 0; i < 3; i++) k.tor('#7fffb0', 0, 3 + i * 2.4, 0, 2.4 - i * 0.3, false, 1); for (const sx of [-2.3, 2.3]) k.cyl('#dfe3e8', sx, 0, 0, 0.14, 9, 6); return 10; },
        (k, b, S) => { if (b === 0) { k.cyl('#6fc3e3', 0, 0.02, 0, 1.8, 0.12, 14, 1); for (let i = 0; i < 9; i++) { const a = (i / 9) * TAU; k.ico('#8b8577', Math.cos(a) * 2, 0.2, Math.sin(a) * 2, 0.4); } return 0.6; } if (b === 1) { hall(k, S, b, 0, -1.2, 3.4, 2, 2, 'gab'); k.cyl('#6fc3e3', 0, 0.02, 1.4, 1.4, 0.12, 12, 1); return 3.4; } if (b === 2) { for (const x of [-1.6, 1.6]) k.tcyl('#c8ced4', x, 0, -0.8, 1.1, 0.75, 4.4, 12); for (let i = 0; i < 3; i++) k.add('cyl8', '#9aa0a6', 0, 0.6 + i * 0.5, 1.2, 0.2, 4.6, 0.2, Math.PI / 2, 0, Math.PI / 2); return 4.4; } k.add('cyl6', '#3a3f48', 0, 0, 0, 1.2, 8, 1.2); k.box('#ff9a4a', 0, 0.4, 1.05, 0.5, 7, 0.04, 0, 1); k.sph('#ffd27a', 0, 8.4, 0, 0.5, 1, 1); return 9; },
        (k, b, S) => { if (b === 0) { k.cone('#8b8577', 0, 0, 0, 1.6, 1.8, 6); k.add('box', '#a0785a', 0, 0.8, 0, 2.6, 0.06, 2.2, 0, 0.2, 0); return 1.8; } if (b === 1) { k.dome('#9aa4ad', 0, 0, -0.6, 2.6, 0.7); k.box('#6d5139', 0, 0, 1.8, 1.2, 1.6, 0.3); return 1.9; } if (b === 2) { k.dome('#d9e4ea', 0, 0, -1, 3, 0.5); k.add('box', '#8f8a80', 0, 0, 1.4, 1.6, 2.6, 1.6, 0, -0.5, 0); k.box('#7ff0ff', 0, 1.6, 2.1, 0.8, 0.12, 0.05, 0, 1); return 2.6; } k.box('#15181d', 0, 0, 0, 1.4, 6, 0.8); for (let i = 0; i < 4; i++) k.box('#7ff0ff', 0, 1 + i * 1.3, 0.41, 1.1, 0.05, 0.02, 0, 1); return 6; },
        (k, b, S) => { if (b === 0) { for (const [x, z] of [[-1.2, 0], [1.2, 0.4]]) k.cone('#cdb592', x, 0, z, 1, 2, 8); for (let i = 0; i < 2; i++) { k.cyl('#6d5139', -0.2 + i * 1.2, 0, -1.6, 0.05, 1.4, 4); } k.box('#b9c4c9', 0.4, 1, -1.6, 1.4, 0.4, 0.04); return 2; } if (b === 1) { hall(k, S, b, 0, 0, 3, 2, 2.4, 'gab'); k.cyl('#5b4630', 2, 0, 1, 0.05, 3.4, 4); k.box('#c0392b', 2.3, 3, 1, 0.6, 0.4, 0.03); return 3.4; } if (b === 2) { for (const [x, z] of [[-1.6, 0], [1.6, 0], [0, -1.8]]) { for (const sx of [-0.6, 0.6]) k.cyl('#5d5f63', x + sx, 0, z, 0.08, 1.2, 4); k.box(x === 0 ? '#c0392b' : '#f4f4f4', x, 1.2, z, 1.8, 1.2, 1.4); } return 2.4; } k.cyl('#2b313a', 0, 0, 0, 1.6, 0.6, 12); k.sph('#7ff0ff', 0, 2.2, 0, 1.2, 1, 1); k.tor('#dfe7ee', 0, 2.2, 0, 1.8, false, 0, 0.6); return 3.6; },
      ],
      coast: [
        (k, b, S) => { if (b === 0) { for (let i = 0; i < 6; i++) k.ico('#7d7a74', (i % 3) - 1, 0.3, Math.floor(i / 3) - 0.5, 0.7); k.sph('#ff7a2a', 0, 1.3, 0, 0.5, 1.4, 1); return 2; } if (b === 1) { k.tcyl('#d8cbb0', 0, 0, 0, 1.1, 0.7, 6, 10); k.cyl('#ffe08a', 0, 6, 0, 0.6, 0.8, 10, 1); k.cone(S.roof, 0, 6.8, 0, 0.8, 0.9, 10); return 7.7; } if (b === 2) { for (let i = 0; i < 6; i++) k.tcyl(i % 2 ? '#c0392b' : '#fbfaf6', 0, i * 1.3, 0, 1.2 - i * 0.08, 1.2 - (i + 1) * 0.08, 1.3, 12); k.cyl('#ffe08a', 0, 7.8, 0, 0.6, 0.8, 12, 1); k.cone('#3f4650', 0, 8.6, 0, 0.75, 0.8, 12); k.cyl(METAL, 1.4, 0, 1, 0.05, 2, 4); k.add('sph', '#f4f4f4', 1.4, 2.2, 1, 0.5, 0.18, 0.5, 0, -0.6, 0); return 9.4; } k.tcyl('#ffffff', 0, 0, 0, 1, 0.5, 11, 10); k.sph('#fff6c4', 0, 11.4, 0, 0.6, 1, 1); k.add('cyl8', '#fff6c4', 0, 11.4, 4, 0.3, 8, 0.3, 0, Math.PI / 2, 0, 2); return 12; },
        (k, b, S) => { if (b === 0) { for (let i = 0; i < 3; i++) k.add('box', '#7a5a3a', -1.6 + i * 1.6, 0.1, 0, 0.6, 0.3, 2.6, 0, 0, 0); k.add('cyl7', '#8f6a46', 0, 0.3, 2.2, 0.3, 3, 0.3, 0, 0, Math.PI / 2); return 0.8; } if (b === 1) { k.add('box', '#7a5a3a', 0, -0.4, 0, 2, 0.15, 7, 0, -0.12, 0); for (let i = 0; i < 6; i++) k.add('tor', '#8f6a46', 0, 0.8, -2 + i * 0.8, 1, 1, 1, Math.PI / 2, 0, 0); return 2; } if (b === 2) { k.box('#9a948a', 0, 0, 0, 3.4, 0.6, 7); k.add('dome', '#4a4d52', 0, 0.6, 0, 1.3, 1.2, 3.2, 0, 0, 0); for (const z of [-2.6, 2.6]) { k.box('#c46a2e', 1.8, 0, z, 0.25, 5, 0.25); k.box('#c46a2e', 0.9, 5, z, 2.2, 0.25, 0.25); } return 5.3; } k.add('dome', '#dfe3e8', 0, 0, 0, 2.6, 1.8, 3.6, Math.PI / 2, 0, 0); k.box('#7ff0ff', 0, 0.1, 3.6, 2.6, 1, 0.05, 0, 1); k.add('sph', '#2b313a', 0, 0.2, 5.4, 0.6, 0.6, 1.8); return 2.6; },
        (k, b, S) => { if (b === 0) { for (let i = 0; i < 4; i++) { const x = -2.1 + i * 1.4; for (const [dx, dz] of [[-0.5, -0.4], [0.5, -0.4], [-0.5, 0.4], [0.5, 0.4]]) k.cyl('#6d5139', x + dx, 0, dz, 0.04, 1.2, 4); k.add('box', ['#c0392b', '#e0b23a', '#3f7fd6', '#3f9a5a'][i], x, 1.2, 0, 1.2, 0.05, 1.1, 0, 0.18, 0); k.box('#efe6d2', x, 0.6, 0, 0.9, 0.1, 0.5); } return 1.4; } if (b === 1) { hall(k, S, b, 0, -0.6, 4, 2.8, 2.4, 'cone'); for (let i = 0; i < 3; i++) k.add('box', ['#c0392b', '#e0b23a', '#3f7fd6'][i], -1.3 + i * 1.3, 1.6, 1, 1.1, 0.05, 0.9, 0, 0.3, 0); return 4.8; } if (b === 2) { hall(k, S, b, 0, -0.6, 5, 3, 2.6, 'flat'); for (let i = 0; i < 6; i++) k.cyl('#efe6d2', -2.1 + i * 0.84, 0, 1, 0.16, 2.9, 8); k.gab('#efe6d2', 0, 3, 1, 5.2, 0.8, 0.5); return 3.8; } for (const [x, z] of [[-1.8, 0], [1.8, 0.6], [0, -1.6]]) { k.cyl('#e8ecef', x, -0.2, z, 1.3, 0.3, 12); k.cyl('#7ff0ff', x, 0.1, z, 1.32, 0.04, 12, 1); k.box(['#e05a6a', '#f2a541', '#3fa7d6'][(x > 0) + (z < 0)], x, 0.1, z, 0.9, 0.6, 0.9); } return 1; },
        (k, b, S) => { if (b === 0) { for (let i = 0; i < 10; i++) k.cyl('#7a5a3a', -2.2 + i * 0.5, 0, 0, 0.12, 1.8, 5); k.box('#8f6a46', 0, 1.8, -0.6, 3, 0.12, 1.4); return 2; } if (b === 1) { k.cyl(S.wall, 0, 0, 0, 2.6, 2.8, 14); for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU; k.box(S.wall2, Math.cos(a) * 2.5, 2.8, Math.sin(a) * 2.5, 0.6, 0.5, 0.5, -a); } return 3.3; } if (b === 2) { k.box('#8f8a80', 0, 0, 0, 4.4, 1, 3); for (const sx of [-1.2, 1.2]) { k.cyl('#5d5f63', sx, 1, 0.4, 0.5, 0.4, 10); k.add('cyl6', '#2b2b2b', sx, 1.3, 1.6, 0.12, 2.2, 0.12, 0, Math.PI / 2 - 0.2, 0); } return 1.8; } k.cyl('#2b313a', 0, 0, 0, 1.2, 1, 8); k.tcyl('#dfe3e8', 0, 1, 0, 0.6, 0.3, 5, 8); k.sph('#ff4d4d', 0, 6.2, 0, 0.4, 1, 1); k.tor('#7ff0ff', 0, 6.2, 0, 0.7, true, 1); return 6.6; },
        (k, b, S) => { if (b === 0) { for (let i = 0; i < 7; i++) { const a = (i / 7) * TAU; k.box('#7d7a74', Math.cos(a) * 2, 0, Math.sin(a) * 2, 0.5, 1.4 + (i % 2) * 0.4, 0.4, -a); } k.cyl('#4aa3c7', 0, 0.02, 0, 1.6, 0.1, 12, 1); return 1.8; } if (b === 1) { for (const [x, z] of [[-1.2, -1], [1.2, -1], [-1.2, 1], [1.2, 1]]) k.cyl('#6d5139', x, -0.6, z, 0.12, 1.8, 5); k.box(S.wall, 0, 1.2, 0, 3, 1.8, 2.6); k.cone(S.roof, 0, 3, 0, 2.4, 1.4, 4, Math.PI / 4); return 4.4; } if (b === 2) { hall(k, S, b, 0, 0, 3, 2.4, 3, 'flat'); k.dome('#3f7fd6', 0, 2.6, 0, 1.2, 1); k.cyl('#fbfaf6', 0, 3.8, 0, 0.1, 0.8, 6); return 4.8; } k.box('#e8ecef', 0, 0, 0, 3, 2, 3); for (const sx of [-2.2, 2.2]) { k.tor('#7ff0ff', sx, 1.6, 0, 1.2, false, 1, Math.PI / 2); k.cyl('#dfe3e8', sx, 0, 0, 0.12, 1.6, 6); } return 3; },
        (k, b, S) => { if (b === 0) { for (let i = 0; i < 14; i++) { const a = (i / 14) * Math.PI; k.cyl('#6d5139', Math.cos(a) * 2.4, -0.5, Math.sin(a) * 2.4, 0.06, 1.5, 4); } return 1; } if (b === 1) { for (let r = 0; r < 3; r++) { k.box('#8f6a46', 0, 0.2, -1.2 + r * 1.2, 4.4, 0.12, 0.3); for (const x of [-2, 0, 2]) k.cyl('#6d5139', x, -0.6, -1.2 + r * 1.2, 0.08, 0.9, 4); } return 0.5; } if (b === 2) { for (const [x, z] of [[-1.8, -1], [1.8, -1], [0, 1.4]]) { k.tor('#9aa0a6', x, 0.05, z, 1.2, true, 0); k.cyl('#5d6670', x, -0.4, z, 1.15, 0.45, 12); } return 0.4; } k.cyl('#e8ecef', 0, -0.3, 0, 3.2, 0.5, 16); k.dome('#cfe8f5', 0, 0.2, 0, 3, 0.8, 1); k.tcyl('#ffffff', 0, 0.2, 0, 0.6, 0.3, 4, 8); return 4.2; },
      ],
      desert: [
        (k, b, S) => { const palm = (x, z) => { k.add('cyl5', '#8f6a46', x, 0, z, 0.14, 3, 0.14, 0, 0.1, 0); for (let i = 0; i < 5; i++) { const a = (i / 5) * TAU; k.add('box', '#5f9f4a', x + Math.cos(a) * 0.7, 3, z + Math.sin(a) * 0.7, 1.6, 0.06, 0.4, -a, 0, 0.4); } }; if (b === 0) { k.cyl('#a39b8e', 0, 0, 0, 0.8, 0.8, 10); k.cyl('#3fb0b8', 0, 0.6, 0, 0.62, 0.22, 10, 1); palm(-2, 0.6); palm(2, -0.6); return 3.4; } if (b === 1) { k.tcyl(S.wall, 0, 0, -1, 1, 0.7, 4, 8); k.dome(S.wall2, 1.8, 0, 1, 1.4, 0.8); palm(-2.2, 1.4); return 4; } if (b === 2) { k.box('#9aa0a6', -1.4, 0, 0, 2, 1.8, 2); for (const [x, z] of [[1.4, -0.8], [2.6, -0.8], [1.4, 0.8], [2.6, 0.8]]) k.cyl('#5d5f63', x, 0, z, 0.08, 4, 4); k.cyl('#c8ced4', 2, 4, 0, 1, 1.4, 12); return 5.4; } k.tcyl('#e8d2b0', 0, 0, 0, 1.6, 0.6, 9, 8); for (let i = 0; i < 4; i++) k.tor('#7ff0ff', 0, 2 + i * 1.8, 0, 1.5 - i * 0.2, true, 1); return 9; },
        (k, b, S) => { const camel = (x, z, ry) => { k.box('#c9a06e', x, 0.9, z, 0.5, 0.5, 1.3, ry); k.sph('#c9a06e', x, 1.4, z, 0.35, 0.8); k.add('box', '#c9a06e', x, 1.1, z + 0.75, 0.18, 0.8, 0.18, ry, -0.5, 0); for (const [dx, dz] of [[-0.18, 0.45], [0.18, 0.45], [-0.18, -0.45], [0.18, -0.45]]) k.box('#8f6a46', x + dx, 0, z + dz, 0.1, 0.9, 0.1); }; if (b === 0) { for (const [x, z] of [[-1.6, 0], [1.2, -1]]) k.cone('#e8d4b0', x, 0, z, 1.2, 1.6, 4, 0.4); camel(1.4, 1.4, 0.4); camel(-1.2, 1.8, -0.8); return 2.2; } if (b === 1) { for (let s = 0; s < 4; s++) { const a = (s / 4) * TAU; k.box(S.wall, Math.cos(a) * 2.2, 0, Math.sin(a) * 2.2, 4.4, 2.2, 0.6, -a + Math.PI / 2); } k.box(DARK, 0, 0, 2.52, 1.1, 1.6, 0.05); camel(0, 0, 0); return 2.4; } if (b === 2) { for (let i = 0; i < 3; i++) k.add('cyl10', '#c8ced4', -1.6 + i * 1.6, 0.6, 0, 0.7, 3, 0.7, 0, Math.PI / 2, 0); k.box('#5d5f63', 2.6, 0, 1, 0.3, 4, 0.3); return 4; } k.box('#9aa0a6', 0, 0, 0, 3.4, 0.4, 3.4); k.add('cyl12', '#f4f6f8', 0, 0.4, 0, 0.5, 7, 0.5); k.cone('#e05a6a', 0, 7.4, 0, 0.5, 1.4, 12); k.box('#c46a2e', 1.4, 0.4, 0, 0.3, 8, 0.3); return 8.8; },
        (k, b, S) => { if (b === 0) { for (let s = 0; s < 8; s++) { const a = (s / 8) * TAU; k.box('#c98a5a', Math.cos(a) * 2, 0, Math.sin(a) * 2, 0.5, 1.6, 0.4, -a); } k.tor('#ffd36b', 0, 2.2, 0, 0.8, false, 1); return 3; } if (b === 1) { k.cone('#e8a0a8', 0, 0, 0, 3.6, 4.2, 4, Math.PI / 4); k.cone('#ffd36b', 0, 3.6, 0, 0.7, 0.8, 4, Math.PI / 4); return 4.4; } if (b === 2) { k.cyl('#9aa0a6', 0, 0, 0, 0.2, 2.4, 6); k.add('sph', '#f4f4f4', 0, 3.2, 0, 2.4, 0.5, 2.4, 0, -0.9, 0); return 4.5; } k.tcyl('#efdcc0', 0, 0, 0, 1, 0.6, 10, 8); k.sph('#fff3c4', 0, 10.4, 0, 0.8, 1, 1); for (let i = 0; i < 10; i++) { const a = (i / 10) * TAU; k.add('box', '#9fd3f0', Math.cos(a) * 3, 0.4, Math.sin(a) * 3, 0.9, 0.05, 0.7, -a, 0.6, 0, 1); } return 11.2; },
        (k, b, S) => { if (b === 0) { for (let i = 0; i < 3; i++) k.box('#b87b4f', -1.6 + i * 1.6, 0, 0, 1.4, 1.2, 0.4, i * 0.3); return 1.2; } if (b === 1) { hall(k, S, b, 0, 0, 3, 2, 2.6, 'flat'); k.box(S.wall, 0.8, 2.2, -0.6, 0.7, 2, 0.7); for (const sx of [-1, 1]) k.box(DARK, 0.8 + sx * 0.36, 3.6, -0.6, 0.04, 0.5, 0.36); return 4.2; } if (b === 2) { k.add('tc0.7_12', '#c8ced4', 0, 0, 0, 2.2, 5.6, 2.2); return 5.6; } k.tcyl('#e8d2b0', 0, 0, 0, 1.4, 0.8, 10, 8); for (let i = 0; i < 5; i++) k.box('#ffd36b', 0, 1.6 + i * 1.6, 1.05, 0.8, 0.12, 0.05, 0, 1); return 10; },
        (k, b, S) => { if (b === 0) { k.dome('#b87b4f', 0, 0, 0, 1.4, 1); k.sph('#ff7a2a', 0, 0.4, 1.3, 0.3, 1, 1); return 1.4; } if (b === 1) { hall(k, S, b, -0.8, 0, 3, 2, 2.4, 'dome'); k.dome(S.wall2, 1.8, 0, 0.6, 1.1, 1); k.tcyl('#7a3a2e', 1.8, 1.1, 0.6, 0.3, 0.2, 2, 6); return 3.2; } if (b === 2) { hall(k, S, b, 0, 0, 4.6, 2.6, 3, 'flat'); for (const [x, z] of [[-1.4, -1], [0, -1], [1.4, -1]]) k.tcyl('#7a3a2e', x, 2.6, z, 0.3, 0.22, 3.4, 8); return 6; } k.box('#f4f6f8', 0, 0, 0, 5, 2.2, 3.4); for (let i = 0; i < 4; i++) k.box('#7ff0ff', 0, 0.4 + i * 0.45, 1.71, 4.6, 0.06, 0.03, 0, 1); k.box('#dfe3e8', 1.6, 2.2, -0.6, 1.2, 0.8, 1.2); return 3; },
        (k, b, S) => { if (b === 0) { for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) k.ico('#d9c9a8', -1.8 + c * 1.2, 0.2, -1 + r, 0.3); return 0.6; } if (b === 1) { for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) k.add('box', '#e8f4ff', -1.8 + c * 1.2, 0.6, -1.2 + r * 1.2, 0.9, 0.05, 0.9, 0, 0.6, 0, 1); return 1.2; } if (b === 2) { for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) { k.cyl('#5d5f63', -1.8 + c * 1.2, 0, -1.2 + r * 1.2, 0.04, 0.6, 4); k.add('box', '#24345a', -1.8 + c * 1.2, 0.6, -1.2 + r * 1.2, 1, 0.05, 0.8, 0, 0.45, 0); } return 1.2; } for (const [x, z] of [[-1.8, -1], [1.8, -1], [0, 1.4]]) { k.cyl('#9aa0a6', x, 0, z, 0.08, 1.4, 5); k.add('sph', '#f4f4f4', x, 2, z, 1, 0.3, 1, 0, -0.8, 0); } k.add('cyl8', '#fff6c4', 0, 6, 0, 0.15, 8, 0.15, 0, 0, 0, 2); return 6; },
      ],
    };

    /* ----- Những công trình chỉ có trong bản thật ----- */
    // Nhà Thuốc của Lúa Vàng
    const plainsHea = (k, b, S) => {
      if (b === 0) { k.cone('#b99a74', 0, 0, 0, 1.4, 2.2, 8); k.cone('#6d5139', 0, 2.0, 0, 0.3, 0.5, 5); for (const x of [1.6, 2.6]) k.cyl('#6d5139', x, 0, 0.6, 0.05, 1.4, 4); k.box('#6d5139', 2.1, 1.35, 0.6, 1.2, 0.05, 0.05); for (let i = 0; i < 4; i++) k.box(['#5f9f4a', '#8cc063', '#b5c46a', '#5f9f4a'][i], 1.75 + i * 0.25, 1.05, 0.6, 0.12, 0.35, 0.05); k.sph('#ff9a3d', -1.6, 0.25, 1.2, 0.25, 1, 1); return 2.5; }
      if (b === 1) { hall(k, S, b, 0, -0.8, 3.6, 2.2, 2.4, 'gab'); for (let r = 0; r < 3; r++) k.box(['#5f9f4a', '#8cc063', '#6aa85a'][r], -1.2 + r * 1.2, 0, 1.6, 0.9, 0.25, 1.4); k.box(S.trim, 0, 0, 2.7, 3.8, 0.4, 0.15); return 3.3; }
      if (b === 2) { hall(k, S, b, 0, 0, 5, 4, 3, 'flat'); k.cyl('#5f9f4a', 0, 2.6, 1.52, 0.55, 0.05, 12, 1); k.box('#ffffff', 0, 2.36, 1.56, 0.7, 0.18, 0.04, 0, 1); k.box('#ffffff', 0, 2.36, 1.56, 0.18, 0.7, 0.04, 0, 1); return 4.2; }
      k.tcyl('#f4f6f8', 0, 0, 0, 1.6, 1.1, 8, 10); k.tor('#7ff0ff', 0, 4, 0, 1.6, true, 1); k.cyl('#dfe3e8', 0, 8, 0, 1.9, 0.15, 14); k.cyl('#9bf0a8', 0, 8.16, 0, 0.6, 0.02, 12, 1); k.sph('#9bf0a8', 0, 6, 1.35, 0.3, 1, 1); return 8.3;
    };
    // Chùa Núi của Đá Mây (hai dáng đầu mượn từ tu viện, hai dáng sau là bảo tháp)
    const mountainRel = (k, b, S) => {
      if (b <= 1) return FORMS.mountain[3](k, b, S);
      if (b === 2) { k.box('#efe6d2', 0, 0, 0, 3.6, 0.8, 3.6); k.dome('#f4f0e8', 0, 0.8, 0, 1.7, 1); k.box('#d9b36b', 0, 2.5, 0, 0.7, 0.4, 0.7); k.tcyl('#d9b36b', 0, 2.9, 0, 0.35, 0.1, 2.4, 8); k.sph('#ffd27a', 0, 5.4, 0, 0.18, 1, 1); for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU; k.box(['#c0392b', '#e0b23a', '#3f7fd6', '#3f9a5a', '#ffffff', '#e05a6a'][i], Math.cos(a) * 1.9, 0.8, Math.sin(a) * 1.9, 0.18, 0.5, 0.18); } return 5.6; }
      k.dome('#f4f0e8', 0, 2.4, 0, 1.5, 1); k.add('dome', '#f4f0e8', 0, 2.4, 0, 1.5, 0.5, 1.5, 0, Math.PI, 0, 0); k.tcyl('#ffd27a', 0, 3.9, 0, 0.3, 0.08, 2, 8, 1); for (let i = 0; i < 3; i++) k.tor('#ffd27a', 0, 1.2 + i * 0.5, 0, 1.2 + i * 0.3, true, 1); k.cyl('#8f8a80', 0, 0, 0, 1.6, 0.4, 10); return 6;
    };
    // Đài Ngắm Sao của Đá Mây (hai dáng đầu mới, hai dáng sau mượn đài thiên văn)
    const mountainEdu = (k, b, S) => {
      if (b === 0) { for (let s = 0; s < 9; s++) { const a = (s / 9) * TAU; k.box('#8b8577', Math.cos(a) * 2, 0, Math.sin(a) * 2, 0.45, 1.0 + (s % 3) * 0.3, 0.35, -a); } k.add('box', '#7c776b', 0, 0, 0, 0.3, 3.2, 0.3, 0, 0.25, 0, 0); return 3.2; }
      if (b === 1) { k.cyl(S.wall, 0, 0, 0, 1.3, 4.2, 10); k.dome('#efe6d2', 0, 4.2, 0, 1.35, 1); k.box(DARK, 0, 4.6, 1.1, 0.5, 0.3, 0.4); k.box(S.wall2, -2, 0, 0.6, 2.2, 1.8, 1.8); k.gab(S.roof, -2, 1.8, 0.6, 2.4, 0.9, 2); return 5.6; }
      return FORMS.mountain[3](k, b, S);
    };
    // Trạm Cứu Hộ của Cửa Sóng
    const coastHea = (k, b, S) => {
      if (b === 0) { for (let i = 0; i < 9; i++) { const a = (i / 9) * TAU; k.ico('#7d7a74', Math.cos(a) * 1.8, 0.2, Math.sin(a) * 1.8, 0.45); } k.cyl('#7fd8e6', 0, 0.02, 0, 1.5, 0.08, 14, 1); for (const x of [2.6, 3.4]) k.cyl('#6d5139', x, 0, -0.4, 0.05, 1.3, 4); k.box('#6d5139', 3, 1.25, -0.4, 1, 0.05, 0.05); return 1.4; }
      if (b === 1) { for (const [x, z] of [[-1.2, -1], [1.2, -1], [-1.2, 1], [1.2, 1]]) k.cyl('#6d5139', x, -0.4, z, 0.1, 1.6, 5); k.box('#f2ede2', 0, 1.2, 0, 3, 1.6, 2.4); k.gab('#3f7fd6', 0, 2.8, 0, 3.3, 1, 2.7); k.tor('#e05a6a', 1.7, 1.9, 1.22, 0.35, false, 0); return 3.8; }
      if (b === 2) { hall(k, S, b, 0, 0, 4.6, 3.2, 2.8, 'flat'); for (const x of [-1.4, 1.4]) k.tor(x < 0 ? '#e05a6a' : '#ffffff', x, 2.4, 1.43, 0.35, false, 0); k.cyl('#5b4630', 2.6, 0, 1.6, 0.05, 4, 4); k.box('#e05a6a', 2.95, 3.7, 1.6, 0.7, 0.4, 0.03); return 4; }
      k.add('box', '#ffffff', 0, 0, 0, 2.6, 1.2, 5.8, 0, 0, 0, 0); k.cone('#ffffff', 0, 0, 2.9, 1.3, 1.2, 4, Math.PI / 4); k.box('#7ff0ff', 0, 0.7, 0, 2.62, 0.12, 5.6, 0, 1); k.box('#e8ecef', 0, 1.2, -1, 1.8, 1.6, 2.2); k.cyl('#9bf0a8', 0, 2.82, -1, 0.5, 0.05, 12, 1); return 3;
    };
    // sáu công trình trụ cột của mỗi miền: chỉ số trỏ vào FORMS của bản demo, hoặc hàm mới
    const PF = {
      plains: { eco: FORMS.plains[1], mil: FORMS.plains[2], edu: FORMS.plains[5], hea: plainsHea, rel: FORMS.plains[3], tra: FORMS.plains[4] },
      forest: { eco: FORMS.forest[1], mil: FORMS.forest[3], edu: FORMS.forest[0], hea: FORMS.forest[5], rel: FORMS.forest[2], tra: FORMS.forest[4] },
      mountain: { eco: FORMS.mountain[0], mil: FORMS.mountain[2], edu: mountainEdu, hea: FORMS.mountain[5], rel: mountainRel, tra: FORMS.mountain[4] },
      tundra: { eco: FORMS.tundra[4], mil: FORMS.tundra[0], edu: FORMS.tundra[5], hea: FORMS.tundra[3], rel: FORMS.tundra[2], tra: FORMS.tundra[1] },
      coast: { eco: FORMS.coast[1], mil: FORMS.coast[3], edu: FORMS.coast[0], hea: coastHea, rel: FORMS.coast[4], tra: FORMS.coast[2] },
      desert: { eco: FORMS.desert[4], mil: FORMS.desert[5], edu: FORMS.desert[3], hea: FORMS.desert[0], rel: FORMS.desert[2], tra: FORMS.desert[1] },
    };

    /* =============== Dựng hình: phần thân, cửa sổ sáng đêm, phần luôn sáng, phần ánh sáng =============== */
    const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _p = new THREE.Vector3(), _s = new THREE.Vector3(), _c = new THREE.Color();
    const bodyMat = new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.82, metalness: 0.04 });
    const glowMat = kitL.glowMat, ghostMat = kitL.ghostMat;
    function bake(parts) {
      const lists = [[], [], [], []];
      for (const q of parts) {
        const g = geoOf(q.g).clone();
        _e.set(q.rx, q.ry, q.rz, 'YXZ'); _q.setFromEuler(_e); _s.set(q.sx, q.sy, q.sz);
        g.applyMatrix4(_m.compose(_p.set(q.x, q.y, q.z), _q, _s));
        _c.set(q.c);
        const n = g.attributes.position.count, col = new Float32Array(n * 3);
        for (let i = 0; i < n; i++) { col[i * 3] = _c.r; col[i * 3 + 1] = _c.g; col[i * 3 + 2] = _c.b; }
        g.setAttribute('color', new THREE.BufferAttribute(col, 3));
        if (g.attributes.uv) g.deleteAttribute('uv');
        lists[q.k === 0 && (q.c === WIN || q.c === GLASS) ? 3 : q.k].push(g);
      }
      return lists.map((list) => {
        if (!list.length) return null;
        let n = 0; for (const g of list) n += g.attributes.position.count;
        const out = new THREE.BufferGeometry();
        for (const [key, sz] of [['position', 3], ['normal', 3], ['color', 3]]) { const arr = new Float32Array(n * sz); let o = 0; for (const g of list) { arr.set(g.attributes[key].array, o * sz); o += g.attributes.position.count; } out.setAttribute(key, new THREE.BufferAttribute(arr, sz)); }
        for (const g of list) g.dispose();
        out.computeBoundingSphere();
        return out;
      });
    }
    function groupOf(L, parts) {
      const geos = bake(parts), g = new THREE.Group();
      geos.forEach((geo, kind) => { if (!geo) return; const m = new THREE.Mesh(geo, kind === 0 ? bodyMat : kind === 1 ? glowMat : kind === 2 ? ghostMat : L.litMat); if (kind === 0) { m.castShadow = true; m.receiveShadow = true; } if (kind === 2) m.renderOrder = 3; g.add(m); });
      return g;
    }
    function disposeG(g) { g.traverse((o) => { if (o.isMesh) o.geometry.dispose(); }); }
    // đống đổ nát: tường gãy, xà cháy đen, gạch vụn; giàn giáo khi dựng lại
    function rubble(k, size, seed, scaffold) {
      const r = rng(seed + 11);
      for (let i = 0; i < 7; i++) k.add('box', pick3(['#3a3430', '#5a524a', '#2b2622', '#6b625a'], r()), (r() - 0.5) * size, 0, (r() - 0.5) * size, 0.5 + r() * 0.9, 0.2 + r() * 0.9, 0.4 + r() * 0.8, r() * 3, (r() - 0.5) * 0.5, (r() - 0.5) * 0.5, 0);
      for (let i = 0; i < 3; i++) k.add('box', '#1e1a18', (r() - 0.5) * size, 0.3, (r() - 0.5) * size, 0.15, 0.15, 1.8 + r(), r() * 3, 0.6, 0.2, 0);
      for (let i = 0; i < 5; i++) k.add('ico', '#4a4440', (r() - 0.5) * size, 0.1, (r() - 0.5) * size, 0.3 + r() * 0.3, 0.2, 0.3 + r() * 0.3, r() * 3, 0, 0, 0);
      if (scaffold) { const h = 3.2; for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) k.cyl('#c8b07a', x * size * 0.42, 0, z * size * 0.42, 0.07, h, 5); for (let y = 1; y < h; y += 1.1) for (const z of [-1, 1]) k.box('#c8b07a', 0, y, z * size * 0.42, size * 0.84, 0.07, 0.07); }
    }
    const pick3 = (arr, v) => arr[Math.floor(v * arr.length) % arr.length];
    const FLAMES = [], flameGeo = new THREE.ConeGeometry(1, 1, 7); flameGeo.translate(0, 0.5, 0);
    const flameMats = ['#ff5a1f', '#ff9a2e', '#ffd25a'].map((c) => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.92 }));
    // một đám cháy: ba lưỡi lửa lớn nhỏ chập chờn, gắn vào nhóm cha ở toạ độ p
    function flame(parent, p, size, owner) {
      const g = new THREE.Group(); g.position.set(p[0], p[1], p[2]);
      for (let i = 0; i < 3; i++) { const m = new THREE.Mesh(flameGeo, flameMats[i]); m.position.set((i - 1) * 0.35 * size, 0, (i % 2 ? 0.25 : -0.2) * size); m.scale.set(0.45 * size * (1 - i * 0.2), 1.6 * size * (1 - i * 0.25), 0.45 * size * (1 - i * 0.2)); g.add(m); }
      parent.add(g);
      FLAMES.push({ g, owner, ph: Math.random() * 6, size });
      return g;
    }
    function dropFlames(owner) { for (let i = FLAMES.length - 1; i >= 0; i--) if (FLAMES[i].owner === owner) { const f = FLAMES[i]; if (f.g.parent) f.g.parent.remove(f.g); FLAMES.splice(i, 1); } }
    const PILLAR_KEYS = ['eco', 'mil', 'edu', 'hea', 'rel', 'tra'];
    const lands = lands3d.lands;
    for (const L of lands) {
      L.noSchool = true;
      if (L.civic && L.civic.school) { L.g.remove(L.civic.school); unclickable(L.civic.school); disposeG(L.civic.school); L.civic.school = null; }
      L.marks = {};
    }
    // dựng một công trình trụ cột ở thời đại e và tình trạng st (bình thường, cháy, đổ nát, dựng lại)
    function buildMark(L, key, e, st) {
      const P = L.slots[key], kit = new Kit(), ter = L.ter, b = e >= 8 ? 3 : Math.floor(e / 2), S = sty(ter, b);
      let H = 3;
      if (st === 'ruin' || st === 'rebuild') rubble(kit, 4, L.i * 13 + PILLAR_KEYS.indexOf(key), st === 'rebuild');
      else { H = PF[ter][key](kit, b, S) || kit.height(); if (e < 8 && e % 2 === 1) flourish(kit, b, H, ACC[ter]); }
      const parts = st === 'ruin' || st === 'rebuild' ? kit.p : beyond(kit, e, L.i * 31 + PILLAR_KEYS.indexOf(key));
      const g = groupOf(L, parts), ry = Math.atan2(-P.x, -P.z);
      g.position.set(P.x, 0, P.z); g.rotation.y = ry;
      L.g.add(g);
      clickable(g, { type: 'landmark', land: L.i, pillar: key });
      lands3d.kit.clearTrees(L, P.x, P.z, 4.2);
      return { g, e, st, top: (e === 9 ? H + 3 : H) + 1, fireT: 0 };
    }
    const ACC = { plains: '#e0b23a', forest: '#3f9a5a', mountain: '#8e7cc3', tundra: '#5fc6e6', coast: '#3f7fd6', desert: '#e05a6a' };
    function markState(c, key) { const d = (c.dmg || []).find((x) => x.kind === 'land' && x.ref === key); return d ? d.state : 'ok'; }
    /* ----- Nhà và xưởng bị lửa chiến tranh: cháy, sập, dựng lại ----- */
    const RUINS = [];
    function syncDamage(L, c) {
      const live = new Map();
      for (const d of c.dmg || []) if (d.kind !== 'land') live.set(d.kind + ':' + d.ref, d);
      // dọn những dấu vết đã xong
      for (let i = RUINS.length - 1; i >= 0; i--) {
        const R = RUINS[i];
        if (R.L !== L) continue;
        const d = live.get(R.key);
        if (d && d.state === R.st) continue;
        if (R.mesh) { L.g.remove(R.mesh); disposeG(R.mesh); }
        if (R.obj) R.obj.visible = true;
        for (const f of L.fires) if (f.owner === 'dmg' + R.key && f.s.parent) f.s.parent.remove(f.s);
        L.fires = L.fires.filter((f) => f.owner !== 'dmg' + R.key);
        dropFlames('dmg' + R.key);
        RUINS.splice(i, 1);
      }
      for (const [key, d] of live) {
        if (RUINS.some((R) => R.L === L && R.key === key)) continue;
        let obj = null, pos = null;
        if (d.kind === 'firm') { const o = L.firmObj.get(d.ref); if (o) { obj = o.g; pos = o.g.position.clone(); } }
        else { const H = L.houses[d.ref]; if (H) { obj = H.g; pos = H.g.position.clone(); } }
        if (!obj) continue;
        const R = { L, key, st: d.state, obj, mesh: null };
        if (d.state === 'fire' || d.state === 'scorch') {
          const top = (obj.userData.top || 2.5) * obj.scale.y;
          if (d.state === 'fire') { for (let f = 0; f < 3; f++) lands3d.kit.addFire(L, L.g, [pos.x + (f - 1) * 0.7, top * (0.5 + f * 0.2), pos.z + (f % 2 ? 0.5 : -0.4)], 'dmg' + key, 3.4 + f * 0.6); flame(L.g, [pos.x, top * 0.6, pos.z], 1.1, 'dmg' + key); flame(L.g, [pos.x + 0.8, top * 0.35, pos.z - 0.5], 0.8, 'dmg' + key); }
          if (d.state === 'scorch') { const k = new Kit(); k.add('cyl10', '#2b2622', 0, 0.03, 0, 2.2, 0.02, 2.2, 0, 0, 0, 0); R.mesh = groupOf(L, k.p); R.mesh.position.copy(pos); L.g.add(R.mesh); }
        } else {
          obj.visible = false;
          const k = new Kit(); rubble(k, d.kind === 'firm' ? 4.2 : 2.6, d.ref * 7 + (d.kind === 'firm' ? 3 : 1), d.state === 'rebuild');
          R.mesh = groupOf(L, k.p); R.mesh.position.copy(pos); L.g.add(R.mesh);
        }
        RUINS.push(R);
      }
      for (const R of RUINS) if (R.L === L && R.obj && (R.st === 'ruin' || R.st === 'rebuild')) R.obj.visible = false; // xây lại theo thời mới vẫn còn sập
    }
    /* =============== Đồng bộ mỗi ngày và mỗi khung hình =============== */
    function syncDay(animate) {
      for (const L of lands) {
        const c = W.cities[L.i];
        if (!c.settled) { for (const key of PILLAR_KEYS) if (L.marks[key]) { L.g.remove(L.marks[key].g); unclickable(L.marks[key].g); disposeG(L.marks[key].g); L.marks[key] = null; } continue; }
        PILLAR_KEYS.forEach((key, idx) => {
          const st = markState(c, key), m = L.marks[key], sst = st === 'scorch' ? 'ok' : st;
          if (m && m.e === c.era && m.st === sst) return;
          const wave = m && m.e !== c.era && animate;
          if (m) { L.g.remove(m.g); unclickable(m.g); disposeG(m.g); L.fires = L.fires.filter((f) => f.owner !== 'mark' + key); dropFlames('mark' + L.i + key); }
          const n = buildMark(L, key, c.era, sst);
          if (wave || (!m && animate)) { n.grow = 0.02; n.delay = idx * 0.25; n.g.scale.y = 0.02; for (let i = 0; i < 6; i++) puff(L.world(new THREE.Vector3(L.slots[key].x + (Math.random() - 0.5) * 3, 0.8, L.slots[key].z + (Math.random() - 0.5) * 3)), true, '#b9ab98'); }
          if (sst === 'fire') { for (let f = 0; f < 4; f++) lands3d.kit.addFire(L, n.g, [(f - 1.5) * 0.8, n.top * (0.45 + (f % 2) * 0.25), (f % 2 ? 0.6 : -0.6)], 'mark' + key, 3.6 + f * 0.5); flame(n.g, [0, n.top * 0.55, 0.6], 1.6, 'mark' + L.i + key); flame(n.g, [-1.2, n.top * 0.3, -0.4], 1.1, 'mark' + L.i + key); flame(n.g, [1.3, n.top * 0.2, 0.2], 0.9, 'mark' + L.i + key); }
          L.marks[key] = n;
        });
        syncDamage(L, c);
      }
    }
    function animate(dt) {
      const k = Math.min(1, dt / 1000), tt = performance.now() * 0.001;
      for (const f of FLAMES) f.g.children.forEach((m, i) => { const s = 1 + 0.22 * Math.sin(tt * (9 + i * 3) + f.ph + i); m.scale.y = 1.6 * f.size * (1 - i * 0.25) * s; m.rotation.y = tt * (1 + i); });
      for (const L of lands) {
        for (const key of PILLAR_KEYS) { const m = L.marks[key]; if (!m || m.grow == null) continue; if (m.delay > 0) { m.delay -= k; continue; } m.grow = Math.min(1, m.grow + k * 0.8); m.g.scale.y = m.grow < 1 ? 1 - Math.pow(1 - m.grow, 3) : 1; if (m.grow >= 1) m.grow = null; }
        if (reduce) continue;
        const c = W.cities[L.i];
        // khói theo thời gian: đám cháy nhả khói đen chừng hai lần mỗi giây, đống đổ nát thỉnh thoảng bốc bụi
        for (const d of c.dmg || []) {
          if (d.state !== 'fire' && d.state !== 'ruin') continue;
          d._pt = (d._pt || 0) + k;
          const every = d.state === 'fire' ? 0.5 : 1.8;
          if (d._pt < every) continue;
          d._pt = 0;
          let p = null;
          if (d.kind === 'land' && L.slots[d.ref]) p = L.slots[d.ref];
          else if (d.kind === 'firm') { const o = L.firmObj.get(d.ref); if (o) p = o.g.position; }
          else { const H = L.houses[d.ref]; if (H) p = H.g.position; }
          if (p) puff(L.world(new THREE.Vector3(p.x + (Math.random() - 0.5) * 2, (d.state === 'fire' ? 3 : 1) + Math.random() * 2, p.z + (Math.random() - 0.5) * 2)), true, d.state === 'fire' ? '#3a3a3a' : '#7a7068');
        }
      }
    }
    function nameOf(i, key) { const c = W.cities[i]; return Sim.landmarkName(c.terrain.key, key, c.era); }
    return { syncDay, animate, nameOf, PILLAR_KEYS };
  }
  root.Landmarks3D = { create };
})(typeof window !== 'undefined' ? window : globalThis);
