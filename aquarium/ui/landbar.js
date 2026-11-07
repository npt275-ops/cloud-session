/* Bể Kính · ui/landbar.js
 * Thanh sáu vùng đất ở trên cùng: bấm một đảo để bay tới đảo đó; đảo đang xem được tô sáng (setFocus).
 * Cần: game/world.js, game/nature.js, ui/camera-fly.js (flyTo). */
(function (root) {
  const BK = root.BK || (root.BK = {});
  function setup(G) {
    const { $, TERRAINS } = G;
    function setFocus(i) { G.focus = i; for (const b of $('landBar').children) b.setAttribute('aria-pressed', String(+b.dataset.i === i)); }
    $('landBar').innerHTML = TERRAINS.map((T, i) => '<button data-i="' + i + '" aria-pressed="' + (i === 0) + '"><i style="background:' + T.color + '"></i><span>' + T.city + '<small>' + T.land + '</small></span></button>').join('');
    $('landBar').addEventListener('click', (e) => { const b = e.target.closest('button[data-i]'); if (!b) return; setFocus(+b.dataset.i); G.flyTo(G.lands[G.focus].center, 96); });
    G.setFocus = setFocus;
  }
  BK.LandBar = { setup };
})(typeof self !== 'undefined' ? self : globalThis);
