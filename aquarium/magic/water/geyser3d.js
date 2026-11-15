/* Bể Kính · magic/water/geyser3d.js · Hình ảnh phép Cột nước (chỉ vẽ; điều khiển ở magic/water/cast.js)
 * start(chỗ, mặtBiển): cột nước phun vọt lên cao HIGH trong RISE giây, đứng phun HOLD giây rồi đổ sụp xuống trong FALL giây;
 * thân cột là khối trụ trong mờ có vệt chảy (magic/water/stream-mat.js), đỉnh cột tung bọt, giọt nước tròn bắn tung rồi rơi
 * xuống, chân cột bắn tóe thành vòng; đặt trên mặt biển thì gợn nước lớn (G.water.splash).
 * update(giây, đứng): đứng = thời gian đang dừng: cột nước đứng im. Cần: render/magic/vfx.js, magic/water/stream-mat.js. */
(function (root) {
  const BK = root.BK || (root.BK = {});
  const HIGH = 8,
    RADIUS = 0.75,
    RISE = 0.35,
    HOLD = 1.6,
    FALL = 0.6,
    SPRAY_EVERY = 0.05;
  function setup(G) {
    const { THREE, scene } = G;
    const geo = new THREE.CylinderGeometry(RADIUS * 0.55, RADIUS, 1, 24, 6, true);
    geo.translate(0, 0.5, 0); // (gốc ở chân cột)
    const list = [],
      p = new THREE.Vector3();
    function start(at, sea) {
      const mat = BK.WaterStream.make(THREE, { color: '#6fcbe0', spin: 0.4, speed: 9 });
      const m = new THREE.Mesh(geo, mat);
      m.position.copy(at);
      m.scale.set(1, 0.01, 1);
      m.frustumCulled = false;
      scene.add(m);
      const g = { m, at: at.clone(), t: 0, sea, sp: 0 };
      list.push(g);
      G.vfx.play('geyserBurst', at);
      if (sea && G.water) G.water.splash(at.x, at.z, 1.6, 1.4);
      return g;
    }
    // độ cao cột lúc t (0..HIGH)
    const heightAt = (t) =>
      t < RISE ? HIGH * (1 - Math.pow(1 - t / RISE, 2)) : t < RISE + HOLD ? HIGH * (0.94 + 0.06 * Math.sin(t * 17)) : HIGH * Math.max(0, 1 - (t - RISE - HOLD) / FALL);
    function update(sec, still) {
      for (let k = list.length - 1; k >= 0; k--) {
        const g = list[k];
        if (still) continue;
        g.t += sec;
        const h = heightAt(g.t),
          life = RISE + HOLD + FALL;
        g.m.scale.set(1 + 0.15 * Math.sin(g.t * 23), Math.max(0.01, h), 1 + 0.15 * Math.cos(g.t * 19));
        g.m.material.uniforms.uT.value = g.t;
        g.m.material.uniforms.uA.value = g.t < life - 0.2 ? 0.85 : 0.85 * Math.max(0, (life - g.t) / 0.2);
        if ((g.sp -= sec) <= 0 && h > 0.5) {
          g.sp = SPRAY_EVERY;
          G.vfx.play('geyserSpray', p.copy(g.at).setY(g.at.y + h));
        }
        if (g.t > RISE + HOLD && !g.fell) {
          g.fell = true;
          G.vfx.play('geyserFall', g.at);
          if (g.sea && G.water) G.water.splash(g.at.x, g.at.z, 2.4, 0.9);
        }
        if (g.t >= life) {
          scene.remove(g.m);
          g.m.material.dispose();
          list.splice(k, 1);
        }
      }
    }
    G.geyser3d = { start, update, HIGH };
  }
  BK.Geyser3D = { setup, HIGH, RISE, HOLD, FALL };
})(typeof self !== 'undefined' ? self : globalThis);
