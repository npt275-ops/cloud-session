/* Bể Kính · magic/water/cast.js · Phát phép hệ nước (đăng ký với sách: game/spellbook.js school; design/ke-hoach-buoc-37.md)
 *   rain    Gọi mưa: mây, mưa trong RAIN_SEC giây ở chỗ ngắm (magic/water/rain3d.js). Hậu quả: nhà đang cháy trong vùng mưa tắt
 *           lửa, đảo hết hạn hán, hết cháy rừng (magic/water/soak.js rain)
 *   geyser  Cột nước: cột nước phun ở chỗ ngắm (magic/water/geyser3d.js). Hậu quả: lửa trong GEYSER_R tắt ngay, người trong
 *           GEYSER_R bị hất ra, bỏ chạy (render/village3d.js spook)
 *   deluge  Đại hồng thuỷ: chỉ khi đứng gần biển (logic/spells.js need: 'sea'; game/spellbook.js nearSea). Toàn bộ ở
 *           magic/water/deluge/ (nhịp, lốc xoáy, sóng đập, hậu quả); ở đây chỉ bắt đầu
 * Cùng thư mục: danh sách phép (spells.js), luật (soak.js), vật liệu dòng nước (stream-mat.js), hạt (recipes.js), tiếng. */
(function (root) {
  const BK = root.BK || (root.BK = {});
  const RAIN_SEC = 7,
    RAIN_R = 5.5, // nhà trong bán kính này tắt lửa khi mưa
    GEYSER_R = 4;
  BK.Spellbook.school('water', (G, kit) => {
    BK.Rain3D.setup(G);
    BK.Geyser3D.setup(G);
    BK.Deluge.setup(G, kit);
    const W = () => G.world;
    const sound = (name, ...a) => kit.audio && kit.audio[name] && kit.audio[name](...a);
    // mặt đất hay mặt biển ở (x, z) thế giới của đảo i: { y, sea }
    function surfaceAt(i, x, z) {
      const L = G.lands[i],
        lx = x - L.center.x,
        lz = z - L.center.z,
        land = Math.hypot(lx, lz) < L.rOf(Math.atan2(lz, lx));
      const sea = G.sea3d.SEA_Y + G.sea3d.seaDy;
      return land ? { y: Math.max(sea, L.center.y + L.surfAt(lx, lz)), sea: false } : { y: sea, sea: true };
    }
    // dập lửa những chỗ đang cháy quanh at (thế giới) trong bán kính r; trả số chỗ
    function douseNear(i, at, r) {
      const S = W().islands[i];
      if (!S.blaze || !G.buildings || !G.buildings.sitesNear) return 0;
      return BK.WaterSoak.douse(S, G.buildings.sitesNear(i, at, r).map((s) => s.key));
    }
    function rain(aim) {
      const i = kit.island();
      if (i < 0) return;
      kit.tipSigil('water');
      G.rain3d.start(aim, RAIN_SEC, (x, z) => surfaceAt(i, x, z));
      sound('rain', RAIN_SEC);
      const n = douseNear(i, aim, RAIN_R),
        gone = BK.WaterSoak.rain(W().islands[i], W().islands[i].day);
      const said = [];
      if (n) said.push(n + ' chỗ tắt lửa');
      if (gone.includes('drought')) said.push('hết hạn hán');
      if (gone.includes('wildfire')) said.push('hết cháy rừng');
      if (said.length) kit.say('Mưa: ' + said.join(', '));
    }
    function geyser(aim) {
      const i = kit.island();
      if (i < 0) return;
      kit.tipSigil('water');
      const g = surfaceAt(i, aim.x, aim.z);
      G.geyser3d.start(aim.clone().setY(g.y), g.sea);
      sound('gush');
      const n = douseNear(i, aim, GEYSER_R);
      if (n) kit.say(n + ' chỗ tắt lửa');
      const V = G.villageOf(i);
      if (V && V.spook) V.spook(aim, GEYSER_R + 1, 4, 9);
      const C = kit.cam();
      if (C) C.shake(0.06, 0.5);
    }
    function deluge() {
      kit.tipSigil('water');
      if (!G.deluge.start()) kit.say('Đại hồng thuỷ đang diễn ra');
    }
    function update(sec) {
      const still = !!(G.timeCtl && G.timeCtl.frozen);
      G.rain3d.update(sec, still);
      G.geyser3d.update(sec, still);
      G.deluge.update(sec, still);
    }
    return { acts: { rain: { tap: rain }, geyser: { tap: geyser }, deluge: { tap: deluge } }, update };
  });
})(typeof self !== 'undefined' ? self : globalThis);
