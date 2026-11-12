/* Bể Kính · game/seasons.js
 * Bốn mùa: tên mùa, độ trộn giữa hai mùa (15 ngày đầu mùa trộn với mùa trước; năm đầu không trộn với mùa đông trước đó),
 * độ đông cho tuyết rơi, và đổi màu đất, cây theo mùa (gọi lands3d.seasons khi độ trộn đổi).
 * Cần: game/world.js, game/nature.js. */
(function (root) {
  const BK = root.BK || (root.BK = {});
  function setup(G) {
    const { W, clamp } = G;
    const NAMES = ['Mùa xuân', 'Mùa hạ', 'Mùa thu', 'Mùa đông'];
    let key = '';
    function weights() {
      const d = ((W.day % 360) + 360) % 360,
        s = Math.floor(d / 90),
        into = d - s * 90,
        w = [0, 0, 0, 0],
        blend = 15;
      if (into < blend && W.day >= 90) {
        const k = into / blend;
        w[s] = k;
        w[(s + 3) % 4] = 1 - k;
      } else w[s] = 1;
      return { w, s };
    }
    function update(force) {
      const { w } = weights(),
        k = w.map((x) => x.toFixed(2)).join();
      if (force || k !== key) {
        key = k;
        G.lands3d.seasons(w, 0);
      }
    }
    // độ đông 0..1: tuyết rơi trong mùa đông, vào và ra mùa từ từ trong 10 ngày
    function winter() {
      const doy = ((W.day % 360) + 360) % 360;
      return doy >= 270 ? clamp((doy - 270) / 10, 0, 1) * clamp((360 - doy) / 10, 0, 1) : 0;
    }
    G.seasons = { NAMES, weights, update, winter };
  }
  BK.GameSeasons = { setup };
})(typeof self !== 'undefined' ? self : globalThis);
