/* Bể Kính · magic/fire/look3d.js · Hình ảnh của phép lửa ngoài bộ hạt (design/ke-hoach-buoc-37.md)
 * Chỉ vẽ; điều khiển ở magic/fire/cast.js (gọi setup), công thức hạt ở magic/fire/recipes.js. Toạ độ thế giới.
 *   ring(chỗ, r, yAt)  vòng lửa (yAt(x, z): độ cao mặt đất): TONGUES lưỡi lửa đều quanh vòng (mỗi lưỡi một nguồn phát), khói nhẹ, ánh lửa chập chờn
 *   ringOff()       tắt vòng lửa (lưỡi lửa tàn dần theo đời hạt)
 *   houses(list)    nhà đang cháy gần máy quay: list [{ key, pos, r, top: độ cao đỉnh mái }]; mỗi nhà một đám lửa, khói (thêm, bớt theo list)
 *   update(giây, đứng)  mỗi khung hình; đứng = thời gian đang dừng: lửa ngừng phát (hạt đã có đứng im theo bộ hạt)
 * Cần: render/magic/vfx.js. */
(function (root) {
  const BK = root.BK || (root.BK = {});
  const TONGUES = 36, // số lưỡi lửa trên vòng
    HOUSES = 6, // tối đa số nhà cháy có lửa riêng cùng lúc (gần máy quay nhất)
    FLICKER = 0.3; // (giây) nhịp ánh lửa chập chờn
  function setup(G) {
    const { THREE } = G;
    const st = { ring: null, houses: new Map(), flick: 0 };
    const p = new THREE.Vector3();
    function ring(at, r, yAt) {
      ringOff();
      const em = [];
      for (let k = 0; k < TONGUES; k++) {
        const a = (k / TONGUES) * Math.PI * 2;
        const x = at.x + Math.cos(a) * r,
          z = at.z + Math.sin(a) * r;
        p.set(x, yAt ? yAt(x, z) : at.y, z);
        em.push(G.vfx.emitter('flameTongue', p));
        if (k % 4 === 0) em.push(G.vfx.emitter('ringSmoke', p));
      }
      st.ring = { at: at.clone(), r, em };
      G.vfx.play('ringBurst', at, { scale: r / 4 });
    }
    function ringOff() {
      if (!st.ring) return;
      for (const e of st.ring.em) e.stop();
      st.ring = null;
    }
    function houses(list) {
      const want = new Map(list.slice(0, HOUSES).map((h) => [h.key, h]));
      for (const [key, h] of st.houses)
        if (!want.has(key)) {
          for (const e of h.em) e.stop();
          st.houses.delete(key);
        }
      for (const [key, h] of want) {
        if (st.houses.has(key)) continue;
        const top = h.pos.clone();
        top.y = h.top != null ? h.top - 0.4 : top.y + 1.6; // (ngay dưới đỉnh mái)
        const sc = { scale: Math.max(0.8, h.r / 2.5) };
        st.houses.set(key, { pos: h.pos, em: ['houseFire', 'houseSmoke', 'embers'].map((r) => G.vfx.emitter(r, top, sc)) });
      }
    }
    function update(sec, still) {
      for (const e of st.ring ? st.ring.em : []) e.paused = still;
      for (const [, h] of st.houses) for (const e of h.em) e.paused = still;
      if (still) return;
      st.flick -= sec;
      if (st.flick > 0) return;
      st.flick = FLICKER * (0.6 + Math.random() * 0.8);
      if (st.ring) G.vfx.play('fireFlicker', p.copy(st.ring.at).setY(st.ring.at.y + 1));
      const [first] = st.houses.values();
      if (first) G.vfx.play('fireFlicker', p.copy(first.pos).setY(first.pos.y + 2));
    }
    G.fire3d = { ring, ringOff, houses, update };
  }
  BK.Fire3D = { setup, TONGUES };
})(typeof self !== 'undefined' ? self : globalThis);
