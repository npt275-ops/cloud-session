/* Bể Kính · ui/hud.js
 * Những gì ghi và bấm trên màn hình ngoài bảng làng: nút tốc độ (1×, 2×, 4×; không có tạm dừng), nút âm thanh, dòng ngày
 * dưới đồng hồ (cấp x/12 · mùa · ngày trong mùa, như bể kính cũ). Giờ trên đồng hồ do render/sky3d.js ghi.
 * Cần: game/world.js, game/seasons.js, logic/eras.js. */
(function (root) {
  const BK = root.BK || (root.BK = {});
  function setup(G) {
    const { $, W, audio } = G, T = G.time, Eras = BK.Eras;
    $('speed').onclick = () => { const i = (T.SPEEDS.findIndex((x) => x[0] === T.tps) + 1) % T.SPEEDS.length; T.tps = T.SPEEDS[i][0]; $('speed').textContent = T.SPEEDS[i][1] + ' ▸'; };
    $('sound').onclick = () => { if (!audio) return; const on = !audio.on; if (on) audio.enable(); else audio.disable(); $('sound').setAttribute('aria-pressed', String(audio.on)); };
    let last = '';
    function dateText() { const d = Math.floor(W.day), doy = d % 360; return 'Cấp ' + Eras.levelOfDay(W.day) + '/' + Eras.COUNT + ' · ' + G.seasons.NAMES[Math.floor(doy / 90)] + ' · Ngày ' + ((doy % 90) + 1); }
    // mỗi giây: dòng ngày, và trạng thái cho âm thanh tự sinh
    function slow() {
      const t = dateText(); if (t !== last) { last = t; $('date').textContent = t; }
      const X = G.weather; if (audio && audio.on) audio.setState({ day: 1 - X.night, night: X.night, rain: X.stormK, snow: X.winter, festival: 0, panic: 0, drought: 0, winter: X.winter });
    }
    G.hud = { slow };
  }
  BK.Hud = { setup };
})(typeof self !== 'undefined' ? self : globalThis);
