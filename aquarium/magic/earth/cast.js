/* Bể Kính · magic/earth/cast.js · Phát phép hệ đất (đăng ký với sách: game/spellbook.js school; design/ke-hoach-buoc-37.md)
 *   uplift  Đất trồi: mảng đất quanh chân phồng lên thành gò (UPLIFT), nâng nhân vật lên; máy quay vẫn bám tầm mắt nhân vật,
 *           chỉ nảy lên một đoạn nhẹ (CAM_HOP) như người bị hất lên một chút, rung nhẹ theo đất
 *   mount   Núi đất: gò đất nhỏ hình ngọn núi (MOUNT) trồi lên ở chỗ ngắm
 * Gò đất là chính mặt đất phồng lên (cùng vật liệu, màu đất chỗ đó: magic/earth/look3d.js); lúc trồi đất nứt bung, bụi trào
 * quanh chân gò, đá vụn nảy lên.
 * Hậu quả thật: gò đứng nhiều ngày game (magic/earth/rise.js), người đi lên được; nhà, bãi làm việc dưới gò bị đẩy sập (gần tâm)
 * hay nứt (ở sườn) (logic/siege.js hit: sửa lại tốn gỗ, đá); người gần đó hoảng sợ bỏ chạy (render/village3d.js spook).
 * Mỗi khung hình (update): gò hết giờ thì hạ (mọi đảo), khối vẽ theo danh sách (magic/earth/look3d.js).
 * Cùng thư mục: danh sách phép (spells.js), dáng gò (shape.js), luật gò (rise.js), hình (look3d.js), hạt, tiếng. */
(function (root) {
  const BK = root.BK || (root.BK = {});
  const UPLIFT = { kind: 'uplift', r: 3.6, h: 1.8 }, // (đơn vị đảo; người cao 1,4)
    MOUNT = { kind: 'mount', r: 4.5, h: 3.2 },
    CRUSH = 0.55, // nhà trong phần này của bán kính gò thì sập, ngoài đó (vẫn dưới gò) thì nứt
    HIT_CRUSH = 0.75, // độ bền mất: sập
    HIT_CRACK = 0.3, // nứt
    CAM_HOP = 0.45, // (đơn vị) máy quay nảy lên chừng này (người chơi chốt: nảy nhẹ, không bay cao hơn nhân vật)
    CAM_HOP_SEC = 0.9;
  BK.Spellbook.school('earth', (G, kit) => {
    BK.Earth3D.setup(G); // (hình: magic/earth/look3d.js)
    const W = () => G.world;
    const sound = (name, ...a) => kit.audio && kit.audio[name] && kit.audio[name](...a);
    // nhà, bãi làm việc quanh chỗ at (thế giới) hư theo khoảng cách: trong r × CRUSH sập, trong r nứt; trả số chỗ
    function crush(i, at, r) {
      if (!G.buildings || !G.buildings.sitesNear) return 0;
      const S = W().islands[i],
        list = G.buildings.sitesNear(i, at, r);
      for (const s of list) {
        BK.Siege.hit(S, s.key, s.d < r * CRUSH ? HIT_CRUSH : HIT_CRACK);
        G.vfx.play('dustPuff', s.pos, { scale: 1.6 });
      }
      return list.length;
    }
    // dựng một gò đất ở chỗ at (thế giới) của đảo i
    function raise(i, at, o) {
      const L = G.lands[i],
        S = W().islands[i];
      BK.EarthRise.raise(S, Object.assign({}, o, { x: at.x - L.center.x, z: at.z - L.center.z }), S.day);
      G.earth3d.sync(i, S.rises, S.day);
      G.vfx.play('riseBurst', at, { scale: o.r / 4 });
      G.vfx.sigil('earth', at, null, { size: o.r * 1.2, life: 1.4, spin: 0.5 });
      sound('crack');
      sound('rumble', (BK.Earth3D.RISE[o.kind] || 1.5) + 0.3);
      const n = crush(i, at, o.r);
      if (n) kit.say(n + ' chỗ bị đất đẩy hư');
      const V = G.villageOf(i);
      if (V && V.spook) V.spook(at, o.r + 3, 4, 10);
    }
    function uplift() {
      const i = kit.island();
      if (i < 0) return;
      kit.tipSigil('earth');
      raise(i, kit.feet().clone(), UPLIFT);
      const C = kit.cam();
      if (C) {
        C.hop(CAM_HOP, CAM_HOP_SEC);
        C.shake(0.06, BK.Earth3D.RISE.uplift);
      }
    }
    function mount(aim) {
      const i = kit.island();
      if (i < 0) return;
      kit.tipSigil('earth');
      raise(i, aim, MOUNT);
      const C = kit.cam();
      if (C) C.shake(0.08 * Math.max(0.2, 1 - aim.distanceTo(kit.feet()) / 30), BK.Earth3D.RISE.mount);
    }
    function update(sec) {
      if (W())
        W().islands.forEach((S, i) => {
          if (!S.rises) return;
          BK.EarthRise.step(S, S.day);
          G.earth3d.sync(i, S.rises, S.day);
        });
      G.earth3d.update(sec, !!(G.timeCtl && G.timeCtl.frozen));
    }
    return { acts: { uplift: { tap: uplift }, mount: { tap: mount } }, update };
  });
})(typeof self !== 'undefined' ? self : globalThis);
