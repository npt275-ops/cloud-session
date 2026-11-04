/* Bể Kính · game/isles.js
 * Công trình của năm đảo còn lại (Thông Xanh, Đá Mây, Tuyết Trắng, Cửa Sóng, Cát Hồng) đi cùng thời kỳ của trận. Các đảo
 * này chưa có logic dân như Lúa Vàng, nên công trình lên đời đều theo thời gian: đầu thời mới, từng công trình của thời cũ
 * lần lượt đổi sang công trình của thời mới, xong cả lúc khoảng 80% thời (render/buildings3d.js setProgressByTime).
 * Kiểu công trình của từng đảo: render/build/isles/. Cần: game/village.js (G.buildings, G.level), logic/eras.js. */
(function (root) {
  const BK = root.BK || (root.BK = {});
  function setup(G) {
    const { W } = G, E = BK.Eras, B = G.buildings, ISLES = [1, 2, 3, 4, 5], shownLv = {};
    for (const i of ISLES) { B.show(i, G.level, false); shownLv[i] = G.level; }
    // mỗi khung hình: sang thời thì dựng bố cục thời mới cho từng đảo, rồi cập nhật tiến độ theo phần đã đi của thời
    function update() {
      const lv = G.level, frac = Math.max(0, Math.min(1, (W.day - E.startOf(lv)) / E.ERA_DAYS));
      for (const i of ISLES) {
        if (shownLv[i] !== lv) { B.show(i, lv, true); shownLv[i] = lv; }
        B.setProgressByTime(i, frac, lv);
      }
    }
    update();
    G.islesRun = { update };
  }
  BK.GameIsles = { setup };
})(typeof self !== 'undefined' ? self : globalThis);
