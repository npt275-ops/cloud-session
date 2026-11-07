/* Bể Kính · render/build/workyards3d.js · Bãi làm việc của một đảo
 * (design/npc-song-that.md mục 2, 3) Việc nào cũng phải có chỗ làm thật, nhìn thấy được, trong tường thành:
 *   store     kho của đảo: sáu đống hàng (lương thực, gỗ, đá, kim loại, năng lượng, hàng quý), mỗi đống cao thấp theo lượng
 *             trong kho thật (logic/economy.js stock, setStock); người làm mang sản phẩm về đây
 *   wood      bãi gỗ: gốc cây, khúc gỗ, giá cưa (thời sau: máy cưa, thùng ép gỗ)
 *   stone     mỏ đá, quặng: hố đá, đống đá vụn (thời sau: máy khoan, băng chuyền)
 *   power     chỗ làm năng lượng (từ thời 4): lò hơi, cối gió, rồi tấm pin, lõi phát sáng
 *   craft     xưởng thủ công: bàn thợ, đe (thời sau: bàn máy, lò in)
 *   drill     bãi tập: hình nộm, giá giáo
 *   grave     bãi mộ: hàng rào; số mộ theo số người đã chôn trên đảo (logic/scenes.js S.graves, setGraves), lớn dần theo lịch sử
 *   farm      mảnh ruộng trồng: luôn có (lương thực là việc sống còn; ruộng lớn trong bố cục dựng xong thì dùng thêm)
 * Kiểu dáng theo ba giai đoạn: thời 1–3 (gỗ, đá), 4–7 (sắt, máy), 8–12 (vật liệu tương lai, phát sáng).
 * Chỗ đặt: một vòng giữa làng và tường thành, tránh cổng chính và hai cổng phụ, tránh đường, núi (cả khung khối núi lớn
 * L.massifs, render/map/mountains3d.js: vùng chiếm chỗ của khối núi chỉ là vài vòng tròn dọc sống núi, hở ở hai bên), hồ và công trình đã có
 * (render/build/place3d.js homeSpot, danh sách fixed của render/buildings3d.js). Chỗ làm (spots) ở phía trước mỗi bãi,
 * hướng về giữa làng, vài chỗ cho vài người. Toạ độ của đảo (L.g).
 * Cần: three.js, render/map/shared3d.js (Kit, meshOf), render/build/place3d.js. */
(function (root) {
  'use strict';
  const BK = root.BK || (root.BK = {});
  const KINDS = ['store', 'farm', 'wood', 'stone', 'craft', 'drill', 'grave', 'power']; // thứ tự ưu tiên chỗ đặt
  const GRAVES_MAX = 60;
  const RES = ['food', 'wood', 'stone', 'metal', 'energy', 'luxury'];
  const PILE = { food: '#d8b04a', wood: '#8a5a33', stone: '#9b978f', metal: '#7d8fa3', energy: '#4fd1e8', luxury: '#c9558f' };
  const PILE_MAX = 8;            // mỗi đống tối đa chừng này khối (đầy kho)
  const tierOf = (lv) => (lv <= 3 ? 0 : lv <= 7 ? 1 : 2);
  // chỗ (x, z) cộng bán kính pad có lấn vào khung một khối núi lớn không (dài W theo hướng tiếp tuyến, sâu D theo bán kính)
  const inMassif = (L, x, z, pad) => (L.massifs || []).some((M) => { const dx = x - M.x, dz = z - M.z, ut = -dx * Math.sin(M.ang) + dz * Math.cos(M.ang), ur = dx * Math.cos(M.ang) + dz * Math.sin(M.ang); return Math.abs(ut) < M.W / 2 + pad && Math.abs(ur) < M.D / 2 + pad; });

  function create(o) {
    const { THREE, lands3d } = o, X = lands3d.shared, { Kit, meshOf, UBOX, UCYL, ICO, DOD } = X, PL = BK.Place3D.create(THREE);
    const pileGeo = { food: new THREE.CylinderGeometry(0.32, 0.38, 0.5, 7), wood: new THREE.CylinderGeometry(0.16, 0.16, 1.4, 6), stone: new THREE.DodecahedronGeometry(0.34), metal: new THREE.BoxGeometry(0.7, 0.18, 0.3), energy: new THREE.CylinderGeometry(0.22, 0.22, 0.6, 8), luxury: new THREE.BoxGeometry(0.45, 0.4, 0.45) };
    pileGeo.wood.rotateZ(Math.PI / 2);
    const pileMat = Object.fromEntries(RES.map((r) => [r, new THREE.MeshStandardMaterial({ color: PILE[r], roughness: 0.8, flatShading: true, emissive: r === 'energy' ? PILE[r] : '#000000', emissiveIntensity: r === 'energy' ? 0.35 : 0 })]));

    // hình của một bãi theo giai đoạn; mặt trước (+z) quay về giữa làng
    function shape(kind, tier, lv) {
      const k = new Kit();
      const ground = ['#8c7a5c', '#6f6a63', '#5d6670'][tier];
      if (kind === 'store') {
        // nền kho, mái che (thời đầu: lều tre; sau: nhà kho mái tôn; tương lai: vòm sáng)
        k.box(ground, 0, 0.05, 0, 7, 0.1, 5);
        if (tier === 0) { for (const x of [-3.2, 3.2]) for (const z of [-2.2, 2.2]) k.cyl('#6d5139', x, 1.2, z, 0.12, 2.4, 5); k.gable('#a6844f', 0, 2.5, 0, 7.2, 0.9, 5.2); }
        else if (tier === 1) { k.box('#8a8f96', 0, 1.6, -2.4, 7, 3.2, 0.2); for (const x of [-3.4, 3.4]) k.box('#8a8f96', x, 1.6, 0, 0.2, 3.2, 5); k.box('#5b6168', 0, 3.3, 0, 7.4, 0.2, 5.4); }
        else { k.dome('#cfe6f2', 0, 0, -0.6, 3.6, 0.55, 16); k.box('#7fe7ff', 0, 0.12, 2.4, 6.6, 0.06, 0.12, 0, 'glow'); }
      } else if (kind === 'wood') {
        k.box(ground, 0, 0.05, 0, 6, 0.1, 4.5);
        for (const [x, z] of [[-2, -1.4], [1.6, -1.6], [-0.4, -1.9]]) { k.cyl('#7a5838', x, 0.3, z, 0.42, 0.6, 7); k.cyl('#cfa774', x, 0.61, z, 0.38, 0.02, 7); }
        for (let i = 0; i < 4; i++) k.add(UCYL(6), '#8a5a33', 1.4, 0.25 + (i % 2) * 0.42, 0.6 + i * 0.1 - 0.4 * (i >> 1), 0.2, 2.2, 0.2, 0, 0, Math.PI / 2);
        if (tier === 0) { k.box('#6d5139', -1.8, 0.7, 0.8, 1.6, 0.12, 0.5); for (const x of [-2.4, -1.2]) k.box('#6d5139', x, 0.35, 0.8, 0.12, 0.7, 0.4); }
        else if (tier === 1) { k.box('#5b6168', -1.8, 0.6, 0.8, 1.8, 1.2, 1); k.cyl('#c9ced4', -1.8, 1.25, 0.8, 0.45, 0.06, 14); }
        else { k.box('#2b3340', -1.8, 0.8, 0.8, 1.6, 1.6, 1.2); k.box('#7fe7ff', -1.8, 1.2, 1.41, 1.2, 0.1, 0.02, 0, 'glow'); }
      } else if (kind === 'stone') {
        k.box('#7a756c', 0, 0.04, 0, 6, 0.08, 4.5);
        for (const [x, z, r] of [[-1.8, -1.2, 0.9], [0.4, -1.6, 1.2], [2, -0.8, 0.7], [-0.6, 0.6, 0.5], [1.2, 0.8, 0.45]]) k.blob(DOD(), tier === 2 ? '#8d93a0' : '#9b978f', x, r * 0.5, z, r, 0.7);
        if (tier === 1) { k.box('#a24a2a', -2.2, 1.2, 1, 0.2, 2.4, 0.2); k.box('#a24a2a', -2.2, 2.3, 0.4, 0.15, 0.15, 1.4); }
        else if (tier === 2) { k.cyl('#2b3340', -2.2, 1, 1, 0.5, 2, 10); k.cyl('#7fe7ff', -2.2, 2.05, 1, 0.3, 0.08, 10, 'glow'); }
      } else if (kind === 'power') {
        k.box(ground, 0, 0.05, 0, 6, 0.1, 4.5);
        if (lv <= 5) { k.cyl('#5b4a3a', -1.2, 1.4, -0.8, 0.9, 2.8, 10); k.cyl('#3a3330', -1.2, 3.4, -0.8, 0.28, 1.4, 8); k.box('#ff8a3a', -1.2, 0.5, 0.15, 0.6, 0.4, 0.05, 0, 'glow'); k.box('#6d5139', 1.6, 2, -0.8, 0.3, 4, 0.3); for (let i = 0; i < 4; i++) k.add(UBOX(), '#e9e1cf', 1.6, 3.8, -0.6, 0.15, 2.4, 0.4, 0, 0, i * Math.PI / 2); }
        else if (tier === 1) { for (let i = 0; i < 3; i++) k.add(UBOX(), '#2a3b5a', -1.8 + i * 1.8, 0.7, -0.8, 1.5, 0.08, 1.1, 0, -0.5); k.box('#7d8fa3', 1.8, 0.8, 1, 0.8, 1.6, 0.8); }
        else { k.cyl('#e6eef4', 0, 1.2, -0.8, 1, 2.4, 14); k.add(ICO(), '#7fe7ff', 0, 2.8, -0.8, 0.7, 0.7, 0.7, 0, 0, 0, 'glow'); }
      } else if (kind === 'craft') {
        k.box(ground, 0, 0.05, 0, 6, 0.1, 4.5);
        k.box(tier === 2 ? '#3a4250' : '#7a5838', -1.5, 0.45, -0.4, 2, 0.9, 1);
        k.box('#4a4a4f', 1.4, 0.35, -0.4, 0.8, 0.7, 0.5); k.box('#3a3a3e', 1.4, 0.75, -0.4, 1, 0.15, 0.4); // đe
        if (tier === 0) k.gable('#a6844f', 0, 2.3, -0.4, 5.4, 0.8, 2.6);
        else if (tier === 1) { k.box('#8a8f96', 0, 1.3, -1.8, 5.6, 2.6, 0.15); k.cyl('#3a3330', 2.4, 2.6, -1.6, 0.2, 2.2, 8); }
        else k.box('#7fe7ff', -1.5, 0.92, -0.4, 1.8, 0.04, 0.8, 0, 'glow');
      } else if (kind === 'drill') {
        k.box('#a89a78', 0, 0.04, 0, 7, 0.08, 5);
        for (const x of [-2.4, 0, 2.4]) { k.cyl('#6d5139', x, 0.8, -1.6, 0.08, 1.6, 5); k.add(UCYL(8), tier === 2 ? '#c8d0dc' : '#c9a86a', x, 1.4, -1.6, 0.35, 0.8, 0.35); k.add(ICO(), '#c9a86a', x, 2, -1.6, 0.22, 0.22, 0.22); }
        k.box('#6d5139', 3.2, 0.9, 1.4, 0.15, 1.8, 1.4); for (let i = 0; i < 4; i++) k.cyl('#7a6a55', 3.2, 1.2, 0.9 + i * 0.3, 0.03, 2.2, 4); // giá giáo
      } else if (kind === 'grave') {
        k.box(tier === 2 ? '#7f9a8a' : '#6f8a52', 0, 0.03, 0, 7, 0.06, 5.2);
        // hàng rào quanh bãi, chừa lối vào phía trước
        for (let i = 0; i <= 10; i++) { const x = -3.5 + i * 0.7; k.box('#6d5139', x, 0.4, -2.6, 0.08, 0.8, 0.08); if (Math.abs(x) > 0.8) k.box('#6d5139', x, 0.4, 2.6, 0.08, 0.8, 0.08); }
        for (const z of [-2.6, 2.6]) k.box('#6d5139', 0, 0.62, z, 7, 0.06, 0.06);
        for (let i = 0; i <= 7; i++) for (const x of [-3.5, 3.5]) k.box('#6d5139', x, 0.4, -2.6 + i * 0.74, 0.08, 0.8, 0.08);
      } else if (kind === 'farm') {
        k.box('#6b4f33', 0, 0.04, 0, 6, 0.08, 4.4);
        for (let r = 0; r < 5; r++) for (let c = 0; c < 8; c++) k.cone(tier === 2 ? '#8be0a0' : '#6aa84f', -2.6 + c * 0.75, 0.3, -1.6 + r * 0.8, 0.2, 0.5, 5);
      }
      return k;
    }

    // đặt các bãi cho một đảo ở một thời: L (đảo), group (nhóm công trình của thời đó), fixed (chỗ đã có), f (hướng trước của
    // làng), lv (thời). Trả về { yards: [{ kind, x, z, ry, spots }], piles }
    function build(L, group, fixed, f, lv) {
      const tier = tierOf(lv), kinds = KINDS.filter((k) => k !== 'power' || lv >= 4);
      const a0 = Math.atan2(f.y, f.x), gates = [a0, ...(L.landing || []).map((v) => Math.atan2(v.z, v.x))];
      const far = (a) => gates.every((g) => Math.abs(Math.atan2(Math.sin(a - g), Math.cos(a - g))) > 0.5);
      const cands = []; for (let k = 0; k < 36; k++) { const a = a0 + Math.PI / 9 + (k * Math.PI * 2) / 18 + (k >= 18 ? Math.PI / 18 : 0); if (far(a)) cands.push(a); }
      const yards = [], R = 3.6;
      for (const kind of kinds) {
        let best = null;
        // vòng giữa trước; đảo có núi lớn chiếm chỗ thì thử vòng trong rồi vòng sát tường
        for (const back of [17, 25, 13]) for (const a of cands) {
          if (best) break;
          if (yards.some((Y) => Math.abs(Math.atan2(Math.sin(a - Y.a), Math.cos(a - Y.a))) < (back === 17 ? 0.36 : 0.2) && Math.abs(L.rOf(Y.a) - Math.hypot(Y.x, Y.z) - back) < 6)) continue;
          const rad = L.rOf(a) - back, p0 = new THREE.Vector2(Math.cos(a) * rad, Math.sin(a) * rad), p = PL.homeSpot(L, p0, R, fixed, null);
          if (!L.inside(p.x, p.y, 9) || inMassif(L, p.x, p.y, R + 1.5)) continue;
          if (fixed.some((F) => (F.x - p.x) ** 2 + (F.y - p.y) ** 2 < (F.r + R) ** 2)) continue;
          best = { a, p };
        }
        if (!best) continue;
        const { p } = best, toC = new THREE.Vector2(-p.x, -p.y).normalize(), ry = Math.atan2(toC.x, toC.y);
        fixed.push({ x: p.x, y: p.y, r: R });
        lands3d.clearTrees(L, p.x, p.y, R + 2); lands3d.clearTrees(L, p.x + toC.x * 3.2, p.y + toC.y * 3.2, 2.6); // nền bãi và chỗ đứng làm
        const g = meshOf(shape(kind, tier, lv), null, group, p.x, p.y, ry); g.userData.kind = 'yard:' + kind;
        const front = new THREE.Vector3(p.x + toC.x * 3.2, 0, p.y + toC.y * 3.2), side = new THREE.Vector3(toC.y, 0, -toC.x);
        const spots = [-1.6, 0, 1.6].map((s) => front.clone().addScaledVector(side, s));
        yards.push({ kind, a: best.a, x: p.x, z: p.y, ry, spots, g });
      }
      // đống hàng trong kho: mỗi thứ một khối lặp, số khối theo lượng trong kho (setStock)
      const store = yards.find((Y) => Y.kind === 'store'); let piles = null;
      if (store) {
        piles = {}; const M = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(1, 1, 1), v = new THREE.Vector3();
        RES.forEach((r, ri) => {
          const im = new THREE.InstancedMesh(pileGeo[r], pileMat[r], PILE_MAX); im.count = 0;
          for (let n = 0; n < PILE_MAX; n++) { v.set(-2.6 + (ri % 3) * 2.6 + ((n % 3) - 1) * 0.55, (r === 'wood' ? 0.2 : 0.3) + Math.floor(n / 3) * 0.45, -1.2 + Math.floor(ri / 3) * 1.8 + ((n >> 1) % 2) * 0.3); M.compose(v, q, s); im.setMatrixAt(n, M); }
          store.g.add(im); piles[r] = im;
        });
      }
      // mộ trong bãi mộ: khối lặp, hiện đúng số người đã chôn (setGraves); thời đầu cọc gỗ, rồi bia đá, rồi trụ sáng
      const grave = yards.find((Y) => Y.kind === 'grave'); let graves = null;
      if (grave) {
        const geo = tier === 0 ? new THREE.BoxGeometry(0.12, 0.7, 0.12) : tier === 1 ? new THREE.BoxGeometry(0.5, 0.6, 0.14) : new THREE.CylinderGeometry(0.12, 0.12, 0.7, 8);
        geo.translate(0, 0.35, 0);
        const mat = new THREE.MeshStandardMaterial({ color: ['#7a5838', '#a7a39b', '#cfe6f2'][tier], roughness: 0.8, flatShading: true, emissive: tier === 2 ? '#7fe7ff' : '#000000', emissiveIntensity: tier === 2 ? 0.4 : 0 });
        graves = new THREE.InstancedMesh(geo, mat, GRAVES_MAX); graves.count = 0;
        const M = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(1, 1, 1), v = new THREE.Vector3();
        for (let n = 0; n < GRAVES_MAX; n++) { v.set(-3 + (n % 10) * 0.66, 0, -2 + Math.floor(n / 10) * 0.75); M.compose(v, q, s); graves.setMatrixAt(n, M); }
        grave.g.add(graves);
      }
      return { yards, piles, graves };
    }
    // lượng hàng trong kho (0..1 mỗi thứ, so với sức chứa): đống hàng cao thấp theo đó
    function setStock(piles, ratio) { if (!piles) return; for (const r of RES) piles[r].count = Math.round(Math.max(0, Math.min(1, ratio[r] || 0)) * PILE_MAX); }
    // số mộ trong bãi mộ (người đã chôn trên đảo; đầy bãi thì giữ GRAVES_MAX)
    function setGraves(graves, n) { if (graves) graves.count = Math.min(GRAVES_MAX, n); }
    return { KINDS, build, setStock, setGraves };
  }
  BK.WorkYards3D = { create };
})(typeof self !== 'undefined' ? self : globalThis);
