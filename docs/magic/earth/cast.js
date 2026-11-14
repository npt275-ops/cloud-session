/* Bể Kính · magic/earth/cast.js · Phát phép hệ đất (đăng ký với sách: game/spellbook.js school; design/ke-hoach-buoc-37.md)
 *   pillar  Trụ đá: núi đá trồi lên ngay dưới chân, đỉnh là trụ đá nâng mình lên cao (PEAK); máy quay bật ra xa gấp CAM_BOOST
 *           lần để thấy cả ngọn núi rồi về dần, rung theo đất; đất nứt bung, đá vụn bắn lên, bụi trào quanh chân núi
 *   mount   Núi đá: ở chỗ ngắm, vòng trụ đá trồi lên trước rồi đất giữa chúng dâng lên thành núi (MOUNT)
 *   quake   Rung đất: WAVES đợt sóng đất toả ra từ chỗ ngắm, bụi bốc theo vòng sóng, vết nứt ở tâm, máy quay rung
 * Hậu quả thật: núi đứng nhiều ngày game (magic/earth/rise.js), người đi lên được sườn núi; nhà, bãi làm việc dưới núi bị đẩy sập
 * (gần tâm) hay nứt (ở sườn) (logic/siege.js hit: sửa lại tốn gỗ, đá); rung đất làm nứt nhà trong QUAKE_R; người gần đó hoảng
 * sợ bỏ chạy (render/village3d.js spook).
 * Mỗi khung hình (update): núi hết giờ thì hạ (mọi đảo), khối vẽ theo danh sách (magic/earth/look3d.js), sóng rung đất kế tiếp.
 * Cùng thư mục: danh sách phép (spells.js), dáng núi (shape.js), luật núi (rise.js), hình (look3d.js), hạt, tiếng. */
(function (root) {
  const BK = root.BK || (root.BK = {});
  const PEAK = { kind: 'peak', r: 7.5, h: 7 }, // (đơn vị đảo; người cao 1,4)
    MOUNT = { kind: 'mount', r: 6.5, h: 4.5 },
    CRUSH = 0.55, // nhà trong phần này của bán kính núi thì sập, ngoài đó (vẫn dưới núi) thì nứt
    HIT_CRUSH = 0.75, // độ bền mất: sập
    HIT_CRACK = 0.3, // nứt
    CAM_BOOST = 6, // máy quay bật ra xa gấp chừng này lần (người chơi chốt: khoảng 6 lần)
    CAM_HOLD = 2.2, // (giây) giữ xa
    CAM_BACK = 1.8, // (giây) về
    QUAKE_R = 9, // bán kính rung đất
    QUAKE_HIT = 0.12, // độ bền mất mỗi nhà trong vùng rung
    QUAKE_HOUSES = 5,
    WAVES = 3, // số đợt sóng rung đất
    WAVE_GAP = 0.3; // (giây) giữa hai đợt
  BK.Spellbook.school('earth', (G, kit) => {
    const { THREE } = G;
    BK.Earth3D.setup(G); // (hình: magic/earth/look3d.js)
    const W = () => G.world;
    const sound = (name, ...a) => kit.audio && kit.audio[name] && kit.audio[name](...a);
    const st = { waves: [] };
    const tmp = new THREE.Vector3();
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
    const scare = (i, at, r) => {
      const V = G.villageOf(i);
      return V && V.spook ? V.spook(at, r, 5, 12) : 0;
    };
    const shake = (at, amp, sec) => {
      const C = kit.cam(),
        d = at.distanceTo(kit.feet());
      if (C) C.shake(amp * Math.max(0.15, 1 - d / 40), sec);
    };
    const tell = (n, what) => n && kit.say(n + ' ' + what);
    // dựng một khối núi ở chỗ at (thế giới) của đảo i
    function raise(i, at, o) {
      const L = G.lands[i],
        S = W().islands[i];
      BK.EarthRise.raise(S, Object.assign({}, o, { x: at.x - L.center.x, z: at.z - L.center.z }), S.day);
      G.earth3d.sync(i, S.rises, S.day);
      G.vfx.play('riseBurst', at, { scale: o.r / 7.5 });
      G.vfx.sigil('earth', at, null, { size: o.r * 0.9, life: 1.6, spin: 0.5 });
      sound('crack');
      sound('rumble', (BK.Earth3D.RISE[o.kind] || 2) + 0.4);
      tell(crush(i, at, o.r), 'chỗ bị núi đẩy hư');
      scare(i, at, o.r + 4);
    }

    /* ----- Trụ đá: núi dưới chân, máy quay bật ra xa ----- */
    function pillar() {
      const i = kit.island();
      if (i < 0) return;
      kit.tipSigil('earth');
      const at = kit.feet().clone();
      raise(i, at, PEAK);
      const C = kit.cam();
      if (C) {
        C.boost(CAM_BOOST, CAM_HOLD, CAM_BACK);
        C.shake(0.25, BK.Earth3D.RISE.peak + 0.3);
      }
    }
    /* ----- Núi đá ở chỗ ngắm ----- */
    function mount(aim) {
      const i = kit.island();
      if (i < 0) return;
      kit.tipSigil('earth');
      raise(i, aim, MOUNT);
      shake(aim, 0.3, BK.Earth3D.RISE.mount);
    }
    /* ----- Rung đất ----- */
    function quake(aim) {
      const i = kit.island();
      if (i < 0) return;
      kit.tipSigil('earth');
      for (let k = 0; k < WAVES; k++) st.waves.push({ at: aim.clone(), t: k * WAVE_GAP, scale: 1 - k * 0.2 });
      G.vfx.play('quakeScar', aim);
      G.vfx.sigil('earth', aim, null, { size: 5, life: 1.4, spin: -0.8 });
      sound('quake');
      shake(aim, 0.35, 1.6);
      const S = W().islands[i],
        list = G.buildings && G.buildings.sitesNear ? G.buildings.sitesNear(i, aim, QUAKE_R).slice(0, QUAKE_HOUSES) : [];
      for (const s of list) {
        BK.Siege.hit(S, s.key, QUAKE_HIT);
        G.vfx.play('dustPuff', s.pos, { scale: 1.3 });
      }
      tell(list.length, 'chỗ bị nứt');
      scare(i, aim, QUAKE_R + 2);
    }

    /* ----- mỗi khung hình ----- */
    function update(sec) {
      const still = !!(G.timeCtl && G.timeCtl.frozen);
      if (W())
        W().islands.forEach((S, i) => {
          if (!S.rises) return;
          BK.EarthRise.step(S, S.day);
          G.earth3d.sync(i, S.rises, S.day);
        });
      G.earth3d.update(sec, still);
      if (still) return;
      for (let k = st.waves.length - 1; k >= 0; k--) {
        const w = st.waves[k];
        if ((w.t -= sec) > 0) continue;
        G.vfx.play('quakeWave', tmp.copy(w.at), { scale: w.scale });
        st.waves.splice(k, 1);
      }
    }
    return { acts: { pillar: { tap: pillar }, mount: { tap: mount }, quake: { tap: quake } }, update };
  });
})(typeof self !== 'undefined' ? self : globalThis);
