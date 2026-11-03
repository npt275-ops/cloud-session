/* Bể Kính · render/rig3d.js
 * Bộ khung khớp của một người: hông, ngực, cổ, đầu, hai vai và khuỷu tay, hai hông và đầu gối.
 * Khung là các nút ẩn (không vẽ); mỗi bộ phận (thân, đầu, tóc, tay, chân, đồ cầm tay) gắn vào một nút.
 * Phần vẽ (render/village3d.js) gom bộ phận cùng loại của mọi người vào một khối lặp: số lượt vẽ không tăng theo số người.
 * Hình dáng: tròn có khớp, theo kiểu nhân vật hiện tại. Cần: three.js. */
(function (root, factory) {
  const BK = root.BK || (root.BK = {});
  BK.Rig3D = factory(BK);
})(typeof self !== 'undefined' ? self : globalThis, function (BK) {
  'use strict';
  const T = () => window.THREE;

  /* ---------- Hình của từng loại bộ phận (dựng một lần, dùng chung) ---------- */
  // mỗi hình đặt sao cho gốc toạ độ nằm ở khớp, phần thân kéo xuống dưới (tay, chân) hay lên trên (đầu)
  let SHAPES = null;
  function shapes() {
    if (SHAPES) return SHAPES;
    const THREE = T(), S = {};
    const down = (g, len) => { g.translate(0, -len / 2, 0); return g; };
    S.pelvis = new THREE.SphereGeometry(1, 12, 9);
    S.torso = new THREE.SphereGeometry(1, 14, 10);
    S.head = new THREE.SphereGeometry(1, 16, 12);
    S.eye = new THREE.SphereGeometry(1, 6, 4);
    S.hairShort = new THREE.SphereGeometry(1, 14, 8, 0, Math.PI * 2, 0, Math.PI * 0.4); // chỏm tóc trên đỉnh, chừa trán và lông mày
    // tóc dài: chỉ phần sau và hai bên (chừa khoảng mặt phía trước, +z), đội cùng chỏm tóc ngắn
    S.hairLong = (() => { const g = new THREE.SphereGeometry(1, 14, 10, Math.PI / 2 + 0.95, Math.PI * 2 - 1.9, Math.PI * 0.25, Math.PI * 0.55); g.scale(1, 1.15, 1); return g; })();
    S.upper = down(new THREE.CylinderGeometry(0.055, 0.05, 0.3, 8), 0.3);
    S.fore = down(new THREE.CylinderGeometry(0.048, 0.042, 0.27, 8), 0.27);
    S.hand = new THREE.SphereGeometry(0.062, 8, 6);
    S.thigh = down(new THREE.CylinderGeometry(0.075, 0.062, 0.36, 8), 0.36);
    S.shin = down(new THREE.CylinderGeometry(0.06, 0.05, 0.36, 8), 0.36);
    S.foot = (() => { const g = new THREE.SphereGeometry(1, 8, 6); g.scale(0.07, 0.045, 0.12); g.translate(0, 0, 0.04); return g; })();
    S.skirt = (() => { const g = new THREE.CylinderGeometry(0.16, 0.27, 0.34, 10, 1, true); g.translate(0, -0.12, 0); return g; })();
    S.fur = (() => { const g = new THREE.ConeGeometry(0.27, 0.36, 7, 1, true); g.rotateX(Math.PI); g.translate(0, -0.1, 0); return g; })();
    // đồ cầm tay theo vai trong hội đồng
    S.crown = (() => { const g = new THREE.CylinderGeometry(0.13, 0.12, 0.08, 8, 1, true); return g; })();
    S.spear = (() => { const g = new THREE.CylinderGeometry(0.016, 0.016, 1.5, 5); g.translate(0, 0.2, 0); return g; })();
    S.spearTip = (() => { const g = new THREE.ConeGeometry(0.045, 0.16, 5); g.translate(0, 1.03, 0); return g; })();
    S.staff = (() => { const g = new THREE.CylinderGeometry(0.02, 0.024, 1.4, 6); g.translate(0, 0.15, 0); return g; })();
    S.bag = new THREE.SphereGeometry(0.1, 8, 6);
    S.scroll = (() => { const g = new THREE.CylinderGeometry(0.04, 0.04, 0.22, 8); g.rotateZ(Math.PI / 2); return g; })();
    S.hammer = (() => { const h = new THREE.CylinderGeometry(0.015, 0.015, 0.36, 5); h.translate(0, -0.1, 0); return h; })();
    S.hammerHead = (() => { const g = new THREE.BoxGeometry(0.16, 0.07, 0.07); g.translate(0, -0.27, 0); return g; })();
    SHAPES = S; return S;
  }

  /* ---------- Màu ---------- */
  const SKIN = ['#f2c6a0', '#e0ac84', '#c99068', '#f5d2b4', '#b87a52', '#e8b48a'];
  const HAIR = ['#2e2420', '#4a2e1a', '#1e1a1a', '#6b4426', '#8a5a32', '#3a2a20'];
  // màu áo theo gia tộc: nhìn là biết người nhà nào
  const CLAN_COLOR = { Thóc: '#c0392b', Mạ: '#3f8a5a', Rơm: '#e0a23a', Đòng: '#3f6fb0', Cốm: '#7fbf5a', Liềm: '#8a5ab0', Cò: '#e8e2d0', Bông: '#e07aa0' };
  const hashStr = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return h >>> 0; };
  const PROP_OF = { king: ['crown'], general1: ['spear', 'spearTip'], general2: ['spear', 'spearTip'], priest: ['staff'], merchant: ['bag'], scholar: ['scroll'], builder: ['hammer', 'hammerHead'] };
  const PROP_COLOR = { crown: '#e8c24a', spear: '#8a5a32', spearTip: '#9a9a9a', staff: '#c9a46e', bag: '#8a6a46', scroll: '#f1e6c8', hammer: '#7a5134', hammerHead: '#6d6359' };

  /* ---------- Dựng khung cho một người ---------- */
  // trả về { root, nodes, parts }: parts là danh sách { type, node, local (Matrix4), color }
  function build(person, era) {
    const THREE = T(), S = shapes(), h = hashStr(person.name + person.id);
    const skin = SKIN[h % SKIN.length], hair = HAIR[(h >>> 4) % HAIR.length]; // >>> để không ra số âm
    const cloth = era === 0 ? '#9c6436' : (CLAN_COLOR[person.clan] || '#9aa3ad'), pants = era === 0 ? skin : '#5a4a3a';
    const N = (name, parent, x, y, z) => { const o = new THREE.Object3D(); o.name = name; o.position.set(x, y, z); parent.add(o); return o; };
    const root = new THREE.Object3D();
    const nodes = {};
    nodes.pelvis = N('pelvis', root, 0, 0.78, 0);
    nodes.chest = N('chest', nodes.pelvis, 0, 0.16, 0);
    nodes.neck = N('neck', nodes.chest, 0, 0.36, 0);
    nodes.head = N('head', nodes.neck, 0, 0.05, 0);
    for (const [s, x] of [['L', 0.21], ['R', -0.21]]) {
      nodes['sh' + s] = N('sh' + s, nodes.chest, x, 0.3, 0);
      nodes['el' + s] = N('el' + s, nodes['sh' + s], 0, -0.3, 0);
      nodes['wr' + s] = N('wr' + s, nodes['el' + s], 0, -0.27, 0);
      nodes['hip' + s] = N('hip' + s, nodes.pelvis, x * 0.48, -0.02, 0);
      nodes['kn' + s] = N('kn' + s, nodes['hip' + s], 0, -0.36, 0);
      nodes['an' + s] = N('an' + s, nodes['kn' + s], 0, -0.36, 0);
    }
    const parts = [];
    const M = (x, y, z, sx, sy, sz, rx, ry, rz) => new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx || 0, ry || 0, rz || 0)), new THREE.Vector3(sx || 1, sy || 1, sz || 1));
    const put = (type, node, local, color) => parts.push({ type, node, local, color: new THREE.Color(color) });
    put('pelvis', nodes.pelvis, M(0, 0, 0, 0.19, 0.15, 0.14), era === 0 ? cloth : pants);
    put('torso', nodes.chest, M(0, 0.18, 0, 0.22, 0.25, 0.16), cloth);
    put('head', nodes.head, M(0, 0.17, 0, 0.19, 0.2, 0.19), skin);
    for (const sx of [-1, 1]) put('eye', nodes.head, M(sx * 0.068, 0.19, 0.17, 0.026, 0.032, 0.014), '#1d1a24');
    put('hairShort', nodes.head, M(0, 0.19, -0.01, 0.205, 0.21, 0.205), hair);
    if (person.sex === 'f') put('hairLong', nodes.head, M(0, 0.17, -0.01, 0.208, 0.22, 0.208), hair);
    for (const s of ['L', 'R']) {
      put('upper', nodes['sh' + s], M(0, 0, 0), era === 0 ? skin : cloth);
      put('fore', nodes['el' + s], M(0, 0, 0), skin);
      put('hand', nodes['wr' + s], M(0, -0.03, 0), skin);
      put('thigh', nodes['hip' + s], M(0, 0, 0), pants);
      put('shin', nodes['kn' + s], M(0, 0, 0), era === 0 ? skin : pants);
      put('foot', nodes['an' + s], M(0, -0.02, 0), era === 0 ? '#6b4a2e' : '#3a2a1e');
    }
    if (era === 0) put('fur', nodes.pelvis, M(0, 0, 0), cloth); // áo da thú cho thời nguyên thuỷ
    else if (person.sex === 'f') put('skirt', nodes.pelvis, M(0, 0, 0), cloth);
    // đồ cầm tay theo vai: vương miện đội trên đầu, còn lại cầm ở tay phải
    for (const type of PROP_OF[person.role] || []) {
      if (type === 'crown') put('crown', nodes.head, M(0, 0.37, 0), PROP_COLOR.crown);
      else if (type === 'bag') put('bag', nodes.pelvis, M(-0.2, -0.05, 0.08), PROP_COLOR.bag);
      else put(type, nodes.wrR, M(0, -0.05, 0.02), PROP_COLOR[type]);
    }
    return { root, nodes, parts };
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
  // khung cao 1,74 (từ gót tới đỉnh tóc). Người trưởng thành cao 1,4: đủ to để nhìn rõ khi xem cả đảo, vẫn thấp hơn mái nhà thời đầu
  // (mái cao khoảng 2,35, cửa 0,85, lands3d.js housePlains). Muốn đổi cỡ người thì chỉ sửa PERSON_HEIGHT.
  // Chỉ phóng to thu nhỏ đều cả người, nên cử chỉ, tay chạm (render/ik3d.js) và khuôn mặt không phải sửa.
  const RIG_HEIGHT = 1.74, PERSON_HEIGHT = 1.4, PERSON_SCALE = PERSON_HEIGHT / RIG_HEIGHT;

  return { shapes, build, buildProps, CLAN_COLOR, PROP_OF, RIG_HEIGHT, PERSON_HEIGHT, PERSON_SCALE };
});
