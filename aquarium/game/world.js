/* Bể Kính · game/world.js
 * Bộ nhớ chung của game (G) mà mọi tệp trong game/, render/ và ui/ cùng đọc: hàm tiện dụng, sáu vùng đất, trạng thái thế
 * giới (ngày trong trận), nhịp thời gian (tốc độ 1×, 2×, 4×, giờ trong ngày), thời tiết đang có, âm thanh.
 * Tạo đầu tiên; các tệp khác thêm phần của mình vào G (xem thứ tự ở game/loop.js). */
(function (root) {
  const BK = root.BK || (root.BK = {});
  function setup(G) {
    const THREE = root.THREE;
    G.THREE = THREE;
    G.$ = (id) => document.getElementById(id);
    G.reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    G.hash = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
    G.clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    G.lerp = (a, b, k) => a + (b - a) * k;
    G.C = (h) => new THREE.Color(h);
    G.audio = window.CityAudio ? CityAudio.create() : null;
    G.typing = (t) => !!t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable);
    G.touchUi = () => window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 760;

    /* ---------- Sáu vùng đất và trạng thái thế giới ---------- */
    // color: màu của đảo (chấm ở thanh vùng đất, cờ và áo lính khi đi đánh)
    G.TERRAINS = [
      { key: 'plains', land: 'Đồng bằng', city: 'Lúa Vàng', color: '#86bb63' }, { key: 'forest', land: 'Rừng', city: 'Thông Xanh', color: '#3f7a4c' }, { key: 'mountain', land: 'Núi', city: 'Đá Mây', color: '#a39d90' },
      { key: 'tundra', land: 'Băng nguyên', city: 'Tuyết Trắng', color: '#e4edf2' }, { key: 'coast', land: 'Biển', city: 'Cửa Sóng', color: '#4aa3c7' }, { key: 'desert', land: 'Sa mạc', city: 'Cát Hồng', color: '#e3c58e' },
    ];
    G.W = {
      day: 0, // ngày trong trận (9 năm = 3240 ngày)
      cities: G.TERRAINS.map((terrain, i) => ({ id: i, terrain, settled: true, era: 0, w: null, dmg: [] })),
    };
    G.Sim = { TERRAINS: G.TERRAINS };
    G.focus = 0; // đảo đang xem

    /* ---------- Nhịp thời gian và thời tiết ---------- */
    // tps: ngày trong game mỗi giây thật (1× = 0,75: trận 9 năm khoảng 72 phút); tod: giờ trong ngày 0..1, logic giữ (logic/world.js:
    // một vòng ngày đêm ứng với 135 ngày lịch, tức 3 phút ở 1×), ở đây chỉ là bản sao cho bầu trời đọc
    G.time = { tps: 0.75, tod: 0.3, SPEEDS: [[0.75, '1×'], [1.5, '2×'], [3, '4×']] };
    G.weather = { lightFlash: 0, stormK: 0, winter: 0, night: 0 };
  }
  BK.GameWorld = { setup };
})(typeof self !== 'undefined' ? self : globalThis);
