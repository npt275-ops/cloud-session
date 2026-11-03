/* Bể Kính · render/rig3d.js
 * Bộ khung khớp của một người (hông, ngực, cổ, đầu, vai, khuỷu, cổ tay, hông, gối, cổ chân) và hình người theo nét đã
 * chốt (design/npc-tinh-chinh.html): thân áo liền, tay chân bo tròn, khớp vai, bàn tay có ngón cái, đầu hơi bè có tai,
 * mũi, mắt to đặt thấp; nữ luôn có tóc dài và ngực. Trang phục theo thời và theo nhóm lấy từ render/outfits3d.js.
 * Khung là các nút ẩn; mỗi bộ phận là { type, node, local, color }: phần vẽ (render/village3d.js) gom bộ phận cùng loại
 * của mọi người vào một khối lặp, nên số lượt vẽ không tăng theo số người. Bộ phận mặt có cờ face để đổi biểu cảm.
 * Tỉ lệ khung giữ nguyên như cũ: cử chỉ (render/anim3d.js, render/gestures3d.js) và tay chạm (render/ik3d.js) không đổi.
 * Cần: three.js, render/outfits3d.js. */
(function (root, factory) {
  const BK = root.BK || (root.BK = {});
  BK.Rig3D = factory(BK);
})(typeof self !== 'undefined' ? self : globalThis, function (BK) {
  'use strict';
  const T = () => window.THREE;

  /* ---------- Hình của từng loại bộ phận (dựng một lần, dùng chung) ---------- */
  let SHAPES = null;
  const GLOW = new Set(['gTor', 'gBox', 'gSph', 'shine']); // vẽ bằng vật liệu tự sáng
  function shapes() {
    if (SHAPES) return SHAPES;
    const THREE = T(), S = {}, V2 = (x, y) => new THREE.Vector2(x, y);
    const lathe = (prof, seg, zs) => { const g = new THREE.LatheGeometry(prof.map(([r, y]) => V2(Math.max(0.0001, r), y)), seg || 12); if (zs) g.scale(1, 1, zs); g.computeVertexNormals(); return g; };
    // ống bo tròn hai đầu, kéo từ khớp xuống dưới
    const limb = (r1, r2, len, seg) => { const p = []; for (let i = 2; i >= 0; i--) { const a = (i / 2) * Math.PI / 2; p.push(V2(Math.cos(a) * r2 + 0.0001, -len - Math.sin(a) * r2 * 0.9)); } for (let i = 0; i <= 2; i++) { const a = (i / 2) * Math.PI / 2; p.push(V2(Math.cos(a) * r1 + 0.0001, Math.sin(a) * r1 * 0.9)); } return new THREE.LatheGeometry(p, seg || 7); };
    const sph = (w, h) => new THREE.SphereGeometry(1, w || 10, h || 7);
    S.shirt = lathe([[0.001, -0.25], [0.21, -0.24], [0.185, -0.17], [0.175, -0.08], [0.19, 0.06], [0.2, 0.2], [0.18, 0.3], [0.12, 0.37], [0.06, 0.4], [0.001, 0.405]], 12, 0.74);
    S.shorts = lathe([[0.001, -0.1], [0.14, -0.09], [0.16, 0.0], [0.15, 0.08], [0.001, 0.09]], 10, 0.76);
    S.skirt = (() => { const g = new THREE.CylinderGeometry(1, 1.5, 1, 12, 1, true); g.translate(0, -0.5, 0); return g; })();
    const front = (w, r0) => { const g = new THREE.LatheGeometry([[r0 || 0.192, 0.0], [0.203, 0.08], [0.207, 0.2], [0.188, 0.3], [0.135, 0.365]].map(([r, y]) => V2(r, y)), 6, -w / 2, w); g.scale(1, 1, 0.75); g.computeVertexNormals(); return g; };
    S.front = front(0.72); S.armor = front(1.7, 0.196); S.tie = front(0.14, 0.2);
    S.sash = new THREE.TorusGeometry(0.17, 0.028, 4, 14).scale(1, 0.74, 1).rotateX(Math.PI / 2);
    S.neck = limb(0.05, 0.055, 0.05).rotateX(Math.PI);
    S.head = sph(14, 10); S.ball = sph(8, 6); S.small = sph(6, 4);
    S.hairCap = new THREE.SphereGeometry(1, 14, 6, 0, Math.PI * 2, 0, Math.PI * 0.37);
    S.hairBack = new THREE.SphereGeometry(1, 9, 5, Math.PI + 0.55, Math.PI - 1.1, Math.PI * 0.3, Math.PI * 0.38);
    S.hairBackLong = new THREE.SphereGeometry(1, 9, 5, Math.PI + 0.55, Math.PI - 1.1, Math.PI * 0.3, Math.PI * 0.5);
    S.upper = limb(0.07, 0.058, 0.3); S.fore = limb(0.056, 0.047, 0.24);
    S.thigh = limb(0.085, 0.066, 0.36); S.shin = limb(0.066, 0.05, 0.34); S.cuff = limb(0.07, 0.068, 0.07);
    // khuôn mặt (toạ độ theo nút đầu; mắt to và thấp như bản đã chốt)
    S.eye = sph(10, 8); S.shine = sph(6, 4); S.brow = new THREE.BoxGeometry(1, 1, 1);
    S.mouthSmile = new THREE.TorusGeometry(0.044, 0.009, 4, 10, Math.PI).rotateZ(Math.PI); S.mouthFrown = new THREE.TorusGeometry(0.04, 0.009, 4, 10, Math.PI);
    S.cheek = new THREE.CircleGeometry(0.036, 10);
    // hình đơn vị cho mũ, đồ cầm tay, vạch sáng: phóng to thu nhỏ bằng ma trận của bộ phận
    S.cyl = new THREE.CylinderGeometry(1, 1, 1, 14); S.cylOpen = new THREE.CylinderGeometry(1, 1, 1, 16, 1, true); S.cone = new THREE.ConeGeometry(1, 1, 8); S.coneOpen = new THREE.ConeGeometry(1, 1, 16, 1, true);
    S.half = new THREE.SphereGeometry(1, 14, 6, 0, Math.PI * 2, 0, Math.PI / 2); S.box = new THREE.BoxGeometry(1, 1, 1); S.tor = new THREE.TorusGeometry(1, 0.15, 5, 18); S.ring = new THREE.TorusGeometry(1, 0.04, 4, 22);
    S.gTor = new THREE.TorusGeometry(1, 0.1, 4, 16); S.gBox = new THREE.BoxGeometry(1, 1, 1); S.gSph = sph(8, 6);
    SHAPES = S; return S;
  }

  /* ---------- Màu ---------- */
  const SKIN = ['#e8b48c', '#d29a70', '#c08660', '#f0c6a2', '#b87a52', '#e0a87e'];
  const HAIR = ['#2a201c', '#1e1816', '#3a2418', '#4a2e1a', '#6b4426', '#2e2420'];
  const CLAN_COLOR = { Thóc: '#c0392b', Mạ: '#3f8a5a', Rơm: '#e0a23a', Đòng: '#3f6fb0', Cốm: '#7fbf5a', Liềm: '#8a5ab0', Cò: '#e8e2d0', Bông: '#e07aa0' };
  const hashStr = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return h >>> 0; };
  const PROP_OF = {};

  /* ---------- Dựng khung cho một người ---------- */
  // o: { level (thời 1..12), age }; trả về { root, nodes, parts, look }
  function build(person, levelOrO) {
    const THREE = T(), o = typeof levelOrO === 'object' && levelOrO ? levelOrO : { level: levelOrO || 3 };
    const h = hashStr(person.name + person.id), lv = Math.max(1, Math.min(12, o.level || 3));
    const look = BK.Outfits3D ? BK.Outfits3D.look(person, lv) : { group: 'm', shirt: '#8a5a3a', pants: '#d9c7a2', shoe: '#5a3a24' };
    const skin = SKIN[h % SKIN.length], old = (o.age || 30) >= 55;
    const hair = look.hair && person.sex === 'f' ? look.hair : old ? ['#e8e6e2', '#cfcac2', '#b8b2aa'][h % 3] : HAIR[(h >>> 4) % HAIR.length];
    const col = (c, fb) => (c === 'skin' ? skin : c || fb);
    const shirt = look.shirt, sleeve = col(look.sleeve, shirt), fore = look.fore ? col(look.fore) : look.sleeve === 'skin' ? skin : sleeve;
    const pants = col(look.pants, '#5a4a3a'), shoe = col(look.shoe, '#3a2a1e');
    const N = (name, parent, x, y, z) => { const n = new THREE.Object3D(); n.name = name; n.position.set(x, y, z); parent.add(n); return n; };
    const root = new THREE.Object3D(), nodes = {};
    nodes.pelvis = N('pelvis', root, 0, 0.78, 0);
    nodes.chest = N('chest', nodes.pelvis, 0, 0.16, 0);
    nodes.neck = N('neck', nodes.chest, 0, 0.36, 0);
    nodes.head = N('head', nodes.neck, 0, 0.05, 0);
    for (const [s, x] of [['L', 0.21], ['R', -0.21]]) {
      nodes['sh' + s] = N('sh' + s, nodes.chest, x, 0.3, 0); nodes['el' + s] = N('el' + s, nodes['sh' + s], 0, -0.3, 0); nodes['wr' + s] = N('wr' + s, nodes['el' + s], 0, -0.27, 0);
      nodes['hip' + s] = N('hip' + s, nodes.pelvis, x * 0.48, -0.02, 0); nodes['kn' + s] = N('kn' + s, nodes['hip' + s], 0, -0.36, 0); nodes['an' + s] = N('an' + s, nodes['kn' + s], 0, -0.36, 0);
    }
    const parts = [];
    const M = (x, y, z, sx, sy, sz, rx, ry, rz) => new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx || 0, ry || 0, rz || 0)), new THREE.Vector3(sx == null ? 1 : sx, sy == null ? (sx == null ? 1 : sx) : sy, sz == null ? (sx == null ? 1 : sx) : sz));
    const put = (type, node, local, color, face) => parts.push({ type, node, local, color: new THREE.Color(color), face: face || null });
    // thân
    put('shirt', nodes.chest, M(0, 0, 0), shirt);
    put('shorts', nodes.pelvis, M(0, 0, 0), pants === skin ? shirt : pants);
    if (look.front) put(look.group === 'general' && lv >= 2 && lv <= 4 ? 'armor' : 'front', nodes.chest, M(0, 0, 0.004), look.front);
    if (look.tie) put('tie', nodes.chest, M(0, 0, 0.008), look.tie);
    if (look.sash) put('sash', nodes.pelvis, M(0, 0.06, 0), look.sash);
    if (look.skirt) put('skirt', nodes.pelvis, M(0, 0.02, 0, 0.165, look.skirt[0], 0.132), look.skirt[1]);
    if (person.sex === 'f') for (const sx of [1, -1]) put('ball', nodes.chest, M(sx * 0.074, 0.19, 0.112, 0.072, 0.068, 0.062), shirt);
    // cổ, đầu, tai, mũi
    put('neck', nodes.neck, M(0, -0.01, 0), skin);
    put('head', nodes.head, M(0, 0.17, 0, 0.205, 0.192, 0.18), skin);
    for (const sx of [1, -1]) put('ball', nodes.head, M(sx * 0.2, 0.16, -0.01, 0.03, 0.045, 0.03), skin);
    put('ball', nodes.head, M(0, 0.135, 0.178, 0.026, 0.022, 0.02), skin);
    // tóc: chỏm, phía sau; nữ thêm tóc dài buông sau lưng
    const bald = look.light && lv === 12;
    if (!bald) {
      put('hairCap', nodes.head, M(0, 0.18, -0.004, 0.218, 0.215, 0.205, 0, 0, 0.06), hair);
      put(person.sex === 'f' ? 'hairBackLong' : 'hairBack', nodes.head, M(0, 0.17, 0, 0.214, 0.205, 0.205), hair);
      if (person.sex === 'f') put('ball', nodes.head, M(0, 0.07, -0.115, 0.185, 0.27, 0.095), hair);
    }
    if (person.sex === 'm' && old) put('cone', nodes.head, M(0, 0.005, 0.13, 0.06, 0.15, 0.06, Math.PI - 0.35, 0, 0), '#ece8e2'); // râu bạc
    // khuôn mặt: mắt (có đốm sáng), lông mày, các hình miệng, má hồng; village3d chọn hình theo biểu cảm
    for (const sx of [1, -1]) {
      put('eye', nodes.head, M(sx * 0.083, 0.182, 0.186, 0.039, 0.046, 0.016), '#1d1a24', 'eye');
      put('shine', nodes.head, M(sx * 0.083 + 0.01, 0.196, 0.2, 0.013, 0.013, 0.008), '#ffffff', 'shine');
      put('brow', nodes.head, M(sx * 0.085, 0.246, 0.184, 0.073, 0.016, 0.012), '#1d1a24', sx > 0 ? 'browL' : 'browR');
      put('cheek', nodes.head, M(sx * 0.125, 0.12, 0.168, 1, 1, 1, 0, sx * 0.55, 0), '#f29a9a', 'cheek');
    }
    put('box', nodes.head, M(0, 0.084, 0.19, 0.073, 0.012, 0.012), '#1d1a24', 'mouth:line');
    put('mouthSmile', nodes.head, M(0, 0.1, 0.19), '#1d1a24', 'mouth:smile');
    put('mouthFrown', nodes.head, M(0, 0.064, 0.19), '#1d1a24', 'mouth:frown');
    put('ball', nodes.head, M(0, 0.078, 0.188, 0.033, 0.04, 0.012), '#1d1a24', 'mouth:open');
    if (look.paint) for (const sx of [1, -1]) for (const dy of [0, 0.025]) put('box', nodes.head, M(sx * 0.12, 0.13 + dy, 0.17, 0.05, 0.01, 0.01, 0, sx * 0.5, 0), '#b8462e');
    hat(put, M, nodes, look);
    // tay: khớp vai, bắp tay, cẳng tay, bàn tay có ngón cái; chân: đùi, cẳng chân, giày
    for (const s of ['L', 'R']) {
      const sx = s === 'L' ? 1 : -1;
      put('ball', nodes['sh' + s], M(0, 0, 0, 0.075, 0.075, 0.075), sleeve);
      put('upper', nodes['sh' + s], M(0, 0, 0), sleeve);
      put('fore', nodes['el' + s], M(0, 0, 0), fore);
      put('ball', nodes['wr' + s], M(0, -0.045, 0.005, 0.055, 0.068, 0.04), skin);
      put('small', nodes['wr' + s], M(sx * 0.042, -0.025, 0.018, 0.022, 0.03, 0.022), skin);
      put('thigh', nodes['hip' + s], M(0, 0, 0), pants);
      put('shin', nodes['kn' + s], M(0, 0, 0), pants);
      put('ball', nodes['an' + s], M(0, -0.035, 0.045, 0.068, 0.045, 0.12), shoe);
      if (look.glow) { put('gTor', nodes['el' + s], M(0, -0.12, 0, 0.05, 0.05, 0.05, Math.PI / 2, 0, 0), look.glow); put('gTor', nodes['kn' + s], M(0, -0.12, 0, 0.06, 0.06, 0.06, Math.PI / 2, 0, 0), look.glow); }
    }
    if (look.glow) { put('gTor', nodes.pelvis, M(0, 0.06, 0, 0.17, 0.17, 0.126, Math.PI / 2, 0, 0), look.glow); put('gBox', nodes.chest, M(0, 0.18, 0.15, 0.03, 0.3, 0.02), look.glow); }
    if (look.halo) put('gTor', nodes.head, M(0, 0.5, -0.02, 0.24, 0.24, 0.24, Math.PI / 2, 0, 0), look.halo);
    prop(put, M, nodes, look.prop);
    return { root, nodes, parts, look };
  }

  /* ---------- Mũ ---------- */
  function hat(put, M, n, look) {
    if (!look.hat) return;
    const [kind, c, c2] = look.hat, H = n.head;
    if (kind === 'band') put('tor', H, M(0, 0.29, -0.01, 0.2, 0.186, 0.2, Math.PI / 2 - 0.25, 0, 0), c);
    else if (kind === 'feathers') { put('tor', H, M(0, 0.29, -0.01, 0.2, 0.186, 0.2, Math.PI / 2 - 0.25, 0, 0), c); for (let i = 0; i < 7; i++) { const a = -0.9 + i * 0.3; put('cone', H, M(Math.sin(a) * 0.17, 0.42, -0.06 + Math.cos(a) * 0.05, 0.03, 0.22, 0.03, -0.25, 0, -a * 0.6), i % 2 ? c2 : c); } }
    else if (kind === 'nonLa') { put('coneOpen', H, M(0, 0.42, -0.01, 0.4, 0.21, 0.4, -0.08, 0, 0), c); put('ring', H, M(0, 0.315, 0, 0.4, 0.4, 0.4, Math.PI / 2 - 0.08, 0, 0), '#b89a5a'); }
    else if (kind === 'crown') { put('cylOpen', H, M(0, 0.32, 0, 0.21, 0.09, 0.21), c); for (let i = 0; i < 7; i++) { const a = (i / 7) * Math.PI * 2; put('cone', H, M(Math.sin(a) * 0.19, 0.4, Math.cos(a) * 0.19, 0.03, 0.09, 0.03), c); } put('ball', H, M(0, 0.33, 0.212, 0.03, 0.03, 0.015), c2 || '#c8302a'); }
    else if (kind === 'helmet') { put('half', H, M(0, 0.2, 0, 0.228, 0.21, 0.235), c); put('cyl', H, M(0, 0.2, 0.02, 0.25, 0.02, 0.27), c); if (c2) put('cone', H, M(0, 0.47, -0.02, 0.035, 0.18, 0.035, -0.3, 0, 0), c2); }
    else if (kind === 'khanDong') { put('cyl', H, M(0, 0.31, -0.005, 0.214, 0.085, 0.214), c); put('ring', H, M(0, 0.29, -0.005, 0.214, 0.214, 0.214, Math.PI / 2, 0, 0), '#4a5a80'); }
    else if (kind === 'quaiThao') { put('cyl', H, M(0, 0.38, 0, 0.42, 0.05, 0.42), c); put('cylOpen', H, M(0, 0.34, 0, 0.2, 0.06, 0.2), c); put('ring', H, M(0, 0.38, 0, 0.42, 0.42, 0.42, Math.PI / 2, 0, 0), c2 || '#e8c24a'); }
    else if (kind === 'kepi') { put('cyl', H, M(0, 0.33, -0.005, 0.2, 0.13, 0.21), c); put('box', H, M(0, 0.275, 0.19, 0.22, 0.02, 0.12, 0.2, 0, 0), '#1e1e22'); if (c2) put('cyl', H, M(0, 0.29, -0.005, 0.205, 0.03, 0.215), c2); }
    else if (kind === 'topHat') { put('cyl', H, M(0, 0.47, 0, 0.16, 0.32, 0.16), c); put('cyl', H, M(0, 0.31, 0, 0.27, 0.02, 0.27), c); }
    else if (kind === 'beret') put('ball', H, M(0.02, 0.33, -0.01, 0.23, 0.08, 0.23, 0, 0, 0.18), c);
    else if (kind === 'visor') put('gBox', H, M(0, 0.27, 0.175, 0.3, 0.045, 0.03), c);
  }
  /* ---------- Món cầm tay theo vai trò ---------- */
  function prop(put, M, n, kind) {
    if (!kind) return;
    const wood = '#7a5134', metal = '#9aa4ae', dark = '#2e3238';
    if (kind === 'spear' || kind === 'spearShield') { put('cyl', n.wrR, M(0, 0.2, 0.02, 0.018, 1.7, 0.018), wood); put('cone', n.wrR, M(0, 1.12, 0.02, 0.045, 0.18, 0.045), metal); }
    if (kind === 'shield' || kind === 'spearShield') put('cyl', n.elL, M(0.09, -0.12, 0, 0.26, 0.04, 0.26, 0, 0, Math.PI / 2), '#8a6a46');
    if (kind === 'staff') { put('cyl', n.wrR, M(0, 0.25, 0.02, 0.022, 1.5, 0.022), '#c9a46e'); put('ball', n.wrR, M(0, 1.02, 0.02, 0.05, 0.05, 0.05), '#e8c24a'); }
    if (kind === 'sword') { put('box', n.pelvis, M(0.2, -0.18, 0.06, 0.03, 0.62, 0.012, 0.3, 0, 0.12), metal); put('box', n.pelvis, M(0.19, 0.12, -0.02, 0.1, 0.025, 0.03, 0.3, 0, 0.12), '#d8b04a'); }
    if (kind === 'musket' || kind === 'rifle') put('box', n.chest, M(0.05, 0.2, -0.2, 0.035, 1.0, 0.05, 0, 0, 0.6), kind === 'musket' ? wood : dark);
    if (kind === 'basket') put('ball', n.pelvis, M(-0.22, -0.02, -0.05, 0.1, 0.12, 0.09), '#c9a46e');
    if (kind === 'briefcase') put('box', n.wrR, M(0, -0.15, 0.02, 0.2, 0.15, 0.06, 0, Math.PI / 2, 0), '#5a3a24');
  }

  /* ---------- Đồ cầm tay của các cử chỉ (cuốc, liềm, rìu, búa, giáo, khiên, bao hàng, xu, bát, cốc, em bé, gậy) ---------- */
  // mỗi món gắn vào một nút của khung, ẩn sẵn; cử chỉ nào cần thì hiện (render/gestures3d.js ghi món của từng cử chỉ)
  // tay cầm dọc theo cẳng tay: trục -y của nút cổ tay là hướng từ khuỷu ra bàn tay
  function buildProps(nodes) {
    const THREE = T(), out = {};
    const M = (c, o) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.7 }, o || {}));
    const wood = M('#8a5a32'), metal = M('#a8adb3', { metalness: 0.5, roughness: 0.35 }), gold = M('#e8c24a', { metalness: 0.6, roughness: 0.3 });
    const mesh = (g, m, x, y, z, rx, ry, rz) => { const me = new THREE.Mesh(g, m); me.position.set(x || 0, y || 0, z || 0); me.rotation.set(rx || 0, ry || 0, rz || 0); me.castShadow = true; return me; };
    const group = (node, ...ms) => { const g = new THREE.Group(); for (const m of ms) g.add(m); g.visible = false; node.add(g); return g; };
    const stick = (len, r) => new THREE.CylinderGeometry(r || 0.02, r || 0.02, len, 6);
    out.hoe = group(nodes.wrR, mesh(stick(1.1), wood, 0, -0.4, 0), mesh(new THREE.BoxGeometry(0.06, 0.04, 0.22), metal, 0, -0.95, 0.1));
    out.sickle = group(nodes.wrR, mesh(stick(0.22), wood, 0, -0.1, 0), mesh(new THREE.TorusGeometry(0.13, 0.015, 5, 12, Math.PI * 1.2), metal, 0, -0.3, 0.1, 0, Math.PI / 2, 0));
    out.axe = group(nodes.wrR, mesh(stick(0.75), wood, 0, -0.25, 0), mesh(new THREE.BoxGeometry(0.05, 0.16, 0.2), metal, 0, -0.58, 0.1));
    out.hammer = group(nodes.wrR, mesh(stick(0.38), wood, 0, -0.12, 0), mesh(new THREE.BoxGeometry(0.16, 0.08, 0.08), metal, 0, -0.3, 0));
    const spearParts = () => [mesh(stick(1.7, 0.018), wood, 0, -0.3, 0), mesh(new THREE.ConeGeometry(0.045, 0.18, 5), metal, 0, -1.24, 0, Math.PI, 0, 0)];
    out.spear = group(nodes.wrR, ...spearParts());
    const shieldMesh = () => mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.04, 14), M('#8a6a46'), 0.09, -0.12, 0, 0, 0, Math.PI / 2);
    out.shield = group(nodes.elL, shieldMesh());
    out.spearShield = group(nodes.wrR, ...spearParts()); out.spearShield.userData.with = 'shield';
    out.sack = group(nodes.chest, mesh(new THREE.SphereGeometry(0.22, 10, 8), M('#c9a46e'), -0.24, 0.52, -0.06));
    out.coin = group(nodes.wrR, mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.015, 10), gold, 0, -0.07, 0.04, Math.PI / 2, 0, 0));
    out.crown = group(nodes.head, mesh(new THREE.CylinderGeometry(0.13, 0.12, 0.08, 8, 1, true), gold, 0, 0.37, 0));
    out.bowl = group(nodes.wrL, mesh(new THREE.SphereGeometry(0.1, 10, 6, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), M('#a8603e', { side: THREE.DoubleSide }), 0, -0.06, 0.06));
    out.cup = group(nodes.wrR, mesh(new THREE.CylinderGeometry(0.045, 0.035, 0.11, 8), M('#c27a4a'), 0, -0.07, 0.05));
    out.baby = group(nodes.chest, mesh(new THREE.SphereGeometry(0.12, 10, 8), M('#f1e6c8'), 0, 0.17, 0.24), mesh(new THREE.SphereGeometry(0.07, 10, 8), M('#f2c6a0'), 0.1, 0.22, 0.26));
    out.cane = group(nodes.wrR, mesh(stick(0.95, 0.022), wood, 0, -0.42, 0.02));
    return out;
  }

  /* ---------- Cỡ người trong thế giới ---------- */
  // khung cao 1,74 (từ gót tới đỉnh tóc). Người trưởng thành cao 1,4: đủ to để nhìn rõ khi xem cả đảo.
  // Chỉ phóng to thu nhỏ đều cả người, nên cử chỉ, tay chạm (render/ik3d.js) và khuôn mặt không phải sửa.
  const RIG_HEIGHT = 1.74, PERSON_HEIGHT = 1.4, PERSON_SCALE = PERSON_HEIGHT / RIG_HEIGHT;

  return { shapes, build, buildProps, GLOW, CLAN_COLOR, PROP_OF, RIG_HEIGHT, PERSON_HEIGHT, PERSON_SCALE };
});
