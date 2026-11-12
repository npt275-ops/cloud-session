/* Bể Kính · game/nature.js
 * Dựng phần thiên nhiên của bể: bản đồ sáu đảo (render/map/), cầu (render/build/bridges3d.js, logic bắc cầu nào thì
 * game/cities.js đưa vào), biển (sea3d.js), mây và mưa (clouds3d.js). Mây báo chớp vào G.weather.lightFlash; tốc độ mây theo tốc độ trận.
 * Cần: game/world.js, render/scene3d.js, render/tank3d.js (bán kính vòm), các tệp bản đồ, sea3d.js, clouds3d.js. */
(function (root) {
  const BK = root.BK || (root.BK = {});
  function setup(G) {
    const { THREE, scene, Sim, W, hash, C, clamp, lerp, reduce, glowTex, puff, audio } = G;
    const noop = () => {};
    const lands3d = Lands3D.create({ THREE, scene, Sim, W, hash, C, clamp, lerp, reduce, glowTex, puff, clickable: noop, unclickable: noop });
    const bridges3d = BK.Bridges3D.create({ scene, lands3d });
    const sea3d = Sea3D.create({ THREE, scene, lands3d, C, clamp, reduce });
    const clouds3d = Clouds3D.create({ THREE, scene, lands3d, dome: G.DOME, reduce, glowTex, audio,
      flash: (k) => { G.weather.lightFlash = Math.max(G.weather.lightFlash, k); },
      dayOfYear: () => ((W.day % 360) + 360) % 360, speed: () => G.time.tps / 0.75 });
    // mỗi khung hình: mặt nước, cầu, biển, mây; trời sầm lại theo giông, chớp tắt dần
    function animate(dt, t, night) {
      lands3d.animate(dt, t, night, G.camera.position);
      bridges3d.animate(night);
      sea3d.animate(dt, t, night, G.weather.stormK); // (giông bão: sóng lớn hơn)
      clouds3d.update(dt, t, night);
      G.weather.lightFlash = Math.max(0, G.weather.lightFlash - dt / 200);
      G.weather.stormK += (Math.min(1, clouds3d.storms) - G.weather.stormK) * Math.min(1, dt / 4000);
    }
    Object.assign(G, { lands3d, lands: lands3d.lands, bridges3d, sea3d, clouds3d, nature: { animate } });
  }
  BK.GameNature = { setup };
})(typeof self !== 'undefined' ? self : globalThis);
