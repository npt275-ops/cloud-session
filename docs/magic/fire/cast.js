/* Bể Kính · magic/fire/cast.js · Phát phép hệ lửa (đăng ký với sách: game/spellbook.js school; design/ke-hoach-buoc-37.md)
 *   fireball  Cầu lửa: quả cầu lửa bay theo đường cong từ đầu gậy tới chỗ ngắm, nổ tung. Hậu quả: nhà, bãi làm việc trong
 *             BLAST_R bén lửa (tối đa MAX_IGNITE chỗ; luật cháy: magic/fire/blaze.js); người trong SCARE_R hoảng sợ bỏ chạy
 *             (render/village3d.js spook)
 *   fireRing  Vòng lửa: vòng lửa bán kính RING_R bùng lên quanh chân, cháy RING_SEC giây thật. Hậu quả: không ai vào được vòng
 *             (render/village3d.js setZones), người trong vòng bị đẩy ra và bỏ chạy, nhà chạm vòng bén lửa
 * Mỗi khung hình (update): lửa cháy nhà theo ngày game ở mọi đảo (BK.Blaze.step), lửa trên nhà gần máy quay (magic/fire/look3d.js),
 * vòng lửa hết giờ thì tắt. Dừng thời gian: lửa đứng im, vòng lửa không hết giờ.
 * Cùng thư mục: danh sách phép (spells.js), luật cháy (blaze.js), hình (look3d.js), hạt (recipes.js), tiếng (sounds.js). */
(function (root) {
  const BK = root.BK || (root.BK = {});
  const BLAST_R = 3.2, // (đơn vị đảo) bán kính nổ làm bén lửa
    MAX_IGNITE = 2, // số chỗ bén lửa nhiều nhất mỗi quả cầu
    SCARE_R = 8, // người trong bán kính này hoảng sợ
    SCARE_SEC = 5, // (giây) chạy trong chừng này
    SCARE_RUN = 12, // chạy ra xa chừng này
    RING_R = 4, // bán kính vòng lửa
    RING_SEC = 6, // (giây thật) vòng lửa cháy
    HOUSE_VIEW = 90, // nhà cháy trong chừng này quanh máy quay thì có lửa, khói riêng
    HOUSE_EVERY = 0.5; // (giây) cập nhật danh sách nhà cháy
  BK.Spellbook.school('fire', (G, kit) => {
    const { THREE } = G;
    BK.Fire3D.setup(G); // (hình: magic/fire/look3d.js)
    const v1 = new THREE.Vector3();
    const st = { ring: null, houseT: 0 };
    const W = () => G.world;
    const sound = (name, ...a) => kit.audio && kit.audio[name] && kit.audio[name](...a);
    // nhà, bãi làm việc quanh chỗ p bén lửa; trả số chỗ
    function burnNear(i, p, r, max) {
      if (i < 0 || !G.buildings || !G.buildings.sitesNear) return 0;
      const S = W().islands[i],
        list = G.buildings.sitesNear(i, p, r).slice(0, max);
      for (const s of list) BK.Blaze.ignite(S, s.key, S.day);
      return list.length;
    }
    const scare = (i, p, r, sec, run) => {
      const V = i >= 0 ? G.villageOf(i) : null;
      return V && V.spook ? V.spook(p, r, sec, run) : 0;
    };
    const tell = (n) => n && kit.say(n === 1 ? 'Một chỗ bén lửa' : n + ' chỗ bén lửa');

    /* ----- Cầu lửa ----- */
    function fireball(aim) {
      kit.tipSigil('fire');
      kit.hand(v1);
      G.vfx.play('fireCast', v1);
      sound('whoosh');
      const i = kit.island();
      kit.bolt({ to: aim, trail: 'fireTrail', speed: 18, onHit: (p) => explode(i, p) });
    }
    function explode(i, p) {
      G.vfx.play('fireBurst', p);
      G.vfx.sigil('fire', p, null, { size: 3, life: 0.8, spin: 2 });
      const near = Math.max(0.2, 1 - p.distanceTo(kit.feet()) / 40);
      sound('boom', near);
      if (kit.cam()) kit.cam().shake(0.18 * near, 0.5); // (máy quay rung theo vụ nổ, xa thì nhẹ)
      tell(burnNear(i, p, BLAST_R, MAX_IGNITE));
      scare(i, p, SCARE_R, SCARE_SEC, SCARE_RUN);
    }

    /* ----- Vòng lửa ----- */
    function fireRing() {
      const i = kit.island(),
        at = kit.feet().clone();
      if (i < 0) return;
      endRing();
      G.fire3d.ring(at, RING_R, kit.ground);
      sound('roar');
      const V = G.villageOf(i);
      if (V && V.setZones) V.setZones([{ x: at.x, z: at.z, r: RING_R }]);
      scare(i, at, RING_R + 1.5, SCARE_SEC, SCARE_RUN * 0.6);
      tell(burnNear(i, at, RING_R, 3));
      st.ring = { i, t: RING_SEC };
    }
    function endRing() {
      if (!st.ring) return;
      const V = G.villageOf(st.ring.i);
      if (V && V.setZones) V.setZones([]);
      G.fire3d.ringOff();
      st.ring = null;
    }

    /* ----- mỗi khung hình ----- */
    function houses() {
      const i = kit.island(),
        S = i >= 0 ? W().islands[i] : null,
        out = [];
      if (S && S.blaze && G.buildings && G.buildings.sitePos)
        for (const key in S.blaze) {
          const s = G.buildings.sitePos(i, key);
          if (s && s.pos.distanceTo(G.camera.position) < HOUSE_VIEW) out.push({ key: i + ':' + key, pos: s.pos, r: s.r, top: s.top });
        }
      out.sort((a, b) => a.pos.distanceToSquared(G.camera.position) - b.pos.distanceToSquared(G.camera.position));
      G.fire3d.houses(out);
    }
    function update(sec) {
      const still = !!(G.timeCtl && G.timeCtl.frozen);
      if (W()) for (const S of W().islands) if (S.blaze) BK.Blaze.step(S, S.day);
      if (st.ring && !still && (st.ring.t -= sec) <= 0) endRing();
      if ((st.houseT -= sec) <= 0) {
        st.houseT = HOUSE_EVERY;
        houses();
      }
      G.fire3d.update(sec, still);
    }
    return { acts: { fireball: { tap: fireball }, fireRing: { tap: fireRing } }, update };
  });
})(typeof self !== 'undefined' ? self : globalThis);
