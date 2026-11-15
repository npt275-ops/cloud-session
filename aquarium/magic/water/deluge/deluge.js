/* Bể Kính · magic/water/deluge/deluge.js · Điều khiển Đại hồng thuỷ: nối các pha theo nhịp (magic/water/deluge/plan.js)
 * start(): bắt đầu (đang có thì thôi). update(giây, đứng) mỗi khung hình: đọc nhịp ở giây hiện tại rồi đặt
 *   mực nước cả bể  G.sea3d.setSea (mặt nước, vách nước, ảnh dưới nước, vật dưới nước, thuyền đều theo mực này)
 *   độ lớn sóng      G.sea3d.setSwell
 *   lốc xoáy         magic/water/deluge/vortex3d.js
 *   lúc đập xuống    magic/water/deluge/surge3d.js (sóng tung quanh sáu đảo), máy quay rung mạnh, tiếng đổ ập; hậu quả thật lên
 *                    cả sáu đảo (magic/water/soak.js flood: nhà ven biển hư, lũ lụt, lửa tắt); dân cả sáu đảo hoảng sợ
 * Thời gian dừng (đứng): mọi thứ đứng im giữa chừng. Xong thì mặt nước về đúng mực cũ.
 * Mỗi pha một tệp riêng trong thư mục này; tệp này chỉ nối. Cần: plan.js, vortex3d.js, surge3d.js, magic/water/soak.js. */
(function (root) {
  const BK = root.BK || (root.BK = {});
  const COAST = 0.65, // chỗ cách tâm đảo hơn phần này của bán kính đảo là ven biển
    PANIC_SEC = 7;
  function setup(G, kit) {
    BK.Vortex3D.setup(G);
    BK.Surge3D.setup(G);
    const Plan = BK.DelugePlan;
    const st = { on: false, t: 0, hit: false, rumble: 0 };
    const sound = (name, ...a) => kit.audio && kit.audio[name] && kit.audio[name](...a);
    function start() {
      if (st.on) return false;
      Object.assign(st, { on: true, t: 0, hit: false, rumble: 0 });
      sound('seaRoar', Plan.HIT_AT);
      return true;
    }
    // hậu quả thật lên cả sáu đảo
    function floodAll() {
      const W = G.world;
      G.lands.forEach((L, i) => {
        const S = W.islands[i],
          sites = G.buildings && G.buildings.sitesNear ? G.buildings.sitesNear(i, L.center, 999) : [];
        const list = sites.map((s) => {
          const dx = s.pos.x - L.center.x,
            dz = s.pos.z - L.center.z;
          return { key: s.key, coast: Math.hypot(dx, dz) > L.rOf(Math.atan2(dz, dx)) * COAST };
        });
        BK.WaterSoak.flood(S, S.day, list);
        const V = G.villageOf(i);
        if (V && V.spook) V.spook(L.center, 999, PANIC_SEC, 6);
      });
    }
    function update(sec, still) {
      if (!st.on || still) return;
      st.t += sec;
      const a = Plan.at(st.t);
      G.sea3d.setSea(a.level);
      G.sea3d.setSwell(a.swell);
      G.vortex3d.set(a.vortex, G.sea3d.SEA_Y + a.level, sec);
      G.surge3d.update(sec);
      const C = kit.cam();
      if (C && (a.phase === 'rise' || a.phase === 'hold') && (st.rumble -= sec) <= 0) {
        st.rumble = 0.5;
        C.shake(0.05, 0.6);
      }
      if (!st.hit && st.t >= Plan.HIT_AT) {
        st.hit = true;
        G.surge3d.crash();
        sound('crash');
        if (C) C.shake(0.5, 2);
        floodAll();
        kit.say('Đại hồng thuỷ: sóng tràn vào cả sáu đảo');
      }
      if (a.done) {
        st.on = false;
        G.sea3d.setSea(0);
        G.sea3d.setSwell(1);
        G.vortex3d.set(0, 0, 0);
      }
    }
    G.deluge = {
      start,
      update,
      get active() {
        return st.on;
      },
      get t() {
        return st.t;
      },
    };
  }
  BK.Deluge = { setup };
})(typeof self !== 'undefined' ? self : globalThis);
