/* Bể Kính · magic/soul/cast.js · Phát phép hệ linh hồn (đăng ký với sách: game/spellbook.js school)
 *   soulBolt  phép thử: đốm sáng bay tới chỗ ngắm rồi bung ra (chưa tác động lên thế giới)
 *   blackHole Hố đen: toàn bộ ở magic/soul/blackhole/ (nhịp, bẻ cong không gian, hình hố, hút người, bên trong hố); ở đây chỉ
 *             bắt đầu
 * Công thức hạt: magic/soul/recipes.js; tiếng: magic/soul/sounds.js; danh sách phép: magic/soul/spells.js. */
(function (root) {
  const BK = root.BK || (root.BK = {});
  BK.Spellbook.school('soul', (G, kit) => {
    const { THREE } = G;
    const v1 = new THREE.Vector3();
    function soulBolt(aim) {
      kit.tipSigil('soul');
      kit.hand(v1);
      G.vfx.play('soulCast', v1);
      if (kit.audio) kit.audio.cast(0.8);
      kit.bolt({
        to: aim,
        trail: 'soulTrail',
        onHit: (p) => {
          G.vfx.play('soulBurst', p);
          G.vfx.sigil('soul', p, null, { size: 2.6, life: 0.9, spin: 1.2 });
          if (kit.audio) kit.audio.impact(0.5);
        },
      });
    }
    BK.BlackHole.setup(G, kit);
    function blackHole(aim) {
      kit.tipSigil('soul');
      if (kit.audio) kit.audio.cast(0.2);
      if (!G.blackHole.start(aim)) kit.say('Hố đen đang mở');
    }
    function update(sec) {
      G.blackHole.update(sec, !!(G.timeCtl && G.timeCtl.frozen));
    }
    return { acts: { soulBolt: { tap: soulBolt }, blackHole: { tap: blackHole } }, update };
  });
})(typeof self !== 'undefined' ? self : globalThis);
