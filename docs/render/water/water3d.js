/* Bể Kính · render/water/water3d.js · Lớp nước quang học của bể kính: ghép các phần (design/ke-hoach-buoc-38.md)
 * Mỗi phần một tệp trong render/water/:
 *   passes3d.js    ba lượt vẽ: ảnh dưới nước (kèm độ sâu), ảnh phản chiếu (quy tắc 3)
 *   ripples3d.js   gợn mô phỏng: vật nổi, cú chạm nước (quy tắc 6)
 *   surface3d.js   chất liệu mặt nước: trường dốc chung, Fresnel, khúc xạ, Beer-Lambert, độ nhám, bọt (quy tắc 1, 2, 4, 5, 6)
 *   under3d.js     vật dưới nước: hấp thụ, caustics (quy tắc 6)
 * frame(giây) mỗi khung hình, ngay trước lượt vẽ chính (game/loop.js). Mức chất lượng theo độ nét của bộ điều tốc
 * (render/perf3d.js G.perf.pr): nét cao vẽ đủ hai ảnh; vừa: bỏ ảnh phản chiếu (soi màu trời); thấp: bỏ cả hai.
 * G.water: { frame, splash(x, z, r, mạnh), level }. Cần: các tệp trên, sea3d.js, render/sky3d.js, render/perf3d.js. */
(function (root) {
  const BK = root.BK || (root.BK = {});
  const REHOOK = 8; // (giây) quét lại vật dưới nước (công trình dựng sau, đáy bể mở ra)
  function setup(G) {
    BK.WaterPasses.setup(G);
    BK.WaterRipples.setup(G);
    BK.WaterSurface.setup(G);
    BK.WaterUnder.setup(G);
    G.waterUnder.hookAll();
    const st = { hook: REHOOK, forced: null };
    // mức chất lượng theo độ nét hiện tại (hay đặt tay: G.water.level = 0, 1, 2; null: tự động)
    function autoLevel() {
      if (st.forced != null) return st.forced;
      const pr = G.perf && G.perf.pr != null ? G.perf.pr : 1;
      return pr >= 0.99 ? 2 : pr >= 0.8 ? 1 : 0;
    }
    function frame(sec) {
      const y = G.sea3d.SEA_Y + G.sea3d.seaDy;
      G.waterRipples.update(sec, y);
      G.waterUnder.update(sec);
      if ((st.hook -= sec) <= 0) {
        st.hook = REHOOK;
        G.waterUnder.hookAll();
      }
      G.waterPasses.level = autoLevel();
      G.waterPasses.prepass();
      G.waterSurface.update();
    }
    G.water = {
      frame,
      splash: G.waterRipples.splash,
      get level() {
        return G.waterPasses.level;
      },
      set level(n) {
        st.forced = n;
      },
    };
  }
  BK.Water3D = { setup };
})(typeof self !== 'undefined' ? self : globalThis);
