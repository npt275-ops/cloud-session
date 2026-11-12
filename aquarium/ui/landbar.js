/* Bể Kính · ui/landbar.js
 * Thanh sáu vùng đất ở trên cùng: bấm một đảo để bay tới đảo đó; đảo đang xem được tô sáng (setFocus).
 * Nút cuối "Đáy bể": lặn xuống lần lượt ba phế tích và ba cửa hầm xuyên núi dưới đáy bể (render/deep3d.js stops).
 * Cần: game/world.js, game/nature.js, ui/camera-fly.js (flyTo). */
(function (root) {
  const BK = root.BK || (root.BK = {});
  function setup(G) {
    const { $, TERRAINS } = G;
    function setFocus(i) {
      G.focus = i;
      for (const b of $('landBar').children) b.setAttribute('aria-pressed', String(+b.dataset.i === i));
    }
    $('landBar').innerHTML = TERRAINS.map(
      (T, i) =>
        '<button data-i="' +
        i +
        '" aria-pressed="' +
        (i === 0) +
        '"><i style="background:' +
        T.color +
        '"></i><span>' +
        T.city +
        '<small>' +
        T.land +
        '</small></span></button>',
    ).join('');
    $('landBar').addEventListener('click', (e) => {
      const b = e.target.closest('button[data-i]');
      if (!b) return;
      setFocus(+b.dataset.i);
      G.flyTo(G.lands[G.focus].center, 96);
    });
    // lặn xuống đáy bể: mỗi lần bấm tới điểm kế tiếp (phế tích, cửa hầm, …; máy quay trong lòng rãnh, dưới mặt nước)
    let deepI = -1;
    const STOPS = G.deep3d.stops,
      NST = STOPS.length;
    const deepBtn = document.createElement('button');
    deepBtn.className = 'deep';
    deepBtn.setAttribute('aria-pressed', 'false');
    const deepLabel = () => {
      deepBtn.innerHTML = '<i style="background:#1d5f86"></i><span>Đáy bể<small>Ba phế tích, ba hầm</small></span>';
    };
    deepLabel();
    $('landBar').appendChild(deepBtn);
    deepBtn.addEventListener('click', () => {
      deepI = (deepI + 1) % NST;
      const S = STOPS[deepI],
        tg = new G.THREE.Vector3(S.x, S.y, S.z),
        dir = S.cam.clone().sub(tg);
      for (const b of $('landBar').children) b.setAttribute('aria-pressed', String(b === deepBtn));
      G.flyTo(tg, dir.length(), dir, S.y, true); // (đúng khoảng cách: không giãn xa trên màn hình dọc, máy quay luôn dưới mặt nước)
      deepBtn.querySelector('small').textContent = S.name;
      deepBtn.title = 'Tiếp: ' + STOPS[(deepI + 1) % NST].name;
    });
    G.setFocus = setFocus;
  }
  BK.LandBar = { setup };
})(typeof self !== 'undefined' ? self : globalThis);
