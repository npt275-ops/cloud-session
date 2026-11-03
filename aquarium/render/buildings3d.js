/* Bể Kính · render/buildings3d.js
 * Công trình có sẵn đặt lên một đảo, làm bản chính để bắt đầu build:
 *   ở giữa đảo là toà thị chính (chỗ của nhà chính sau này); quanh đó ba kiểu nhà, ruộng, chợ, kho bạc, hai đèn đường;
 *   thêm sáu công trình trụ cột (landmarks3d.js) và mười công trình kỳ lạ (sights3d.js) của đảo.
 * Hình của từng công trình vẫn nằm ở lands3d.js, landmarks3d.js, sights3d.js; tệp này chỉ chọn và đặt chúng.
 * Cần: three.js, lands3d (bộ dựng hình), Landmarks3D, Sights3D, và bảng trạng thái W mà hai mô-đun đó đọc. */
(function (root, factory) {
  const BK = root.BK || (root.BK = {});
  BK.Buildings3D = factory();
})(typeof self !== 'undefined' ? self : globalThis, function () {
  'use strict';

  function create(o) {
    const { THREE, W, Sim, lands3d, hash, puff, reduce } = o, K3 = lands3d.kit, lands = lands3d.lands;
    const noop = () => {};
    let marks = null, sights = null;
    const smallSets = lands.map(() => null);

    // vị trí công trình nhỏ quanh giữa đảo (góc tính từ hướng nhìn vào biển trong, bán kính tính từ giữa đảo)
    const SMALL = [
      { kind: 'hall', a: 0, r: 0 },
      { kind: 'house', v: 0, lv: 1, a: 1.0, r: 8.5 }, { kind: 'house', v: 1, lv: 2, a: 1.35, r: 9.5 }, { kind: 'house', v: 2, lv: 3, a: -1.0, r: 8.5 },
      { kind: 'farm', a: Math.PI - 0.6, r: 9.5 }, { kind: 'shop', a: -1.35, r: 9.5 }, { kind: 'bank', a: 0, r: 10.5 },
      { kind: 'lamp', a: 0.55, r: 6.4 }, { kind: 'lamp', a: -0.55, r: 6.4 },
    ];
    function buildSmall(L, e) {
      if (smallSets[L.i]) { L.g.remove(smallSets[L.i]); K3.disposeGroup(smallSets[L.i]); }
      const g = new THREE.Group(); L.g.add(g); smallSets[L.i] = g;
      const ia = Math.atan2(L.inw.z, L.inw.x), e7 = Math.min(7, e); // nhà nhỏ có tám thời; bốn thời vượt người biến hình từ thời thứ tám
      for (const s of SMALL) {
        const a = s.r ? ia + s.a : 0, x = Math.cos(a) * s.r, z = Math.sin(a) * s.r, k = new K3.Kit();
        if (s.kind === 'hall') K3.buildHall(k, e7, L.ter);
        else if (s.kind === 'house') K3.buildHouse(k, e7, L.ter, s.v, s.lv);
        else if (s.kind === 'farm') K3.buildFarm(k, e7, L.ter, 0);
        else if (s.kind === 'shop') K3.buildShop(k, e7, L.ter, 0);
        else if (s.kind === 'bank') K3.buildBank(k, e7, L.ter);
        else if (s.kind === 'lamp') K3.buildLamp(k, e7);
        K3.setBeyond(e >= 8 ? e : 0);
        K3.meshOf(k, L.litMat, g, x, z, s.r ? Math.atan2(-x, -z) : 0);
        K3.setBeyond(0);
        K3.clearTrees(L, x, z, s.kind === 'hall' ? 5.5 : 4.2);
      }
    }

    // đặt công trình của một đảo ở một thời (0..11); các đảo khác giữ nguyên là đảo thô
    function show(islandIndex, era) {
      W.cities.forEach((c, i) => { c.era = era; c.settled = i === islandIndex; });
      if (!marks) { marks = Landmarks3D.create({ THREE, Sim, W, lands3d, hash, puff, clickable: noop, unclickable: noop, reduce }); sights = Sights3D.create({ THREE, W, lands3d, clickable: noop, unclickable: noop }); }
      marks.syncDay(false); sights.syncDay();
      for (const L of lands) {
        if (L.i === islandIndex) buildSmall(L, era);
        else if (smallSets[L.i]) { L.g.remove(smallSets[L.i]); K3.disposeGroup(smallSets[L.i]); smallSets[L.i] = null; }
        L.g.traverse((ob) => { if (ob.userData && ob.userData.sight) ob.visible = L.i === islandIndex; }); // công trình kỳ lạ chỉ hiện ở đảo đang dựng
      }
    }
    const animate = (dt) => { if (marks) marks.animate(dt); };
    return { show, animate };
  }

  return { create };
});
