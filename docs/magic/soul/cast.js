/* Bể Kính · magic/soul/cast.js · Phát phép hệ linh hồn (đăng ký với sách: game/spellbook.js school)
 *   soulBolt  phép thử: đốm sáng bay tới chỗ ngắm rồi bung ra (chưa tác động lên thế giới)
 *   blackHole (sắp có)
 * Công thức hạt: magic/soul/recipes.js; danh sách phép: magic/soul/spells.js. */
(function (root) {
  const BK = root.BK || (root.BK = {});
  BK.Spellbook.school('soul', (G, kit) => {
    const { THREE } = G;
    const v1 = new THREE.Vector3(),
      v2 = new THREE.Vector3();
    function soulBolt(aim) {
      kit.hand(v1);
      G.vfx.sigil('soul', v1, v2.copy(aim).sub(v1).normalize(), { size: 0.75, life: 0.55 });
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
    return { acts: { soulBolt: { tap: soulBolt } } };
  });
})(typeof self !== 'undefined' ? self : globalThis);
