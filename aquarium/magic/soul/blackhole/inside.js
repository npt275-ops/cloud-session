/* Bể Kính · magic/soul/blackhole/inside.js · Bên trong Hố đen (design/ke-hoach-buoc-37.md mục "Hố đen")
 * Người chơi chốt: người nhập hồn bị hút vào hố thì để đó, chờ phát triển tiếp. Bây giờ: màn hình tối dần thành đen tuyền, một
 * dòng chữ, rồi linh hồn rời thân (game/possess.js exit) về lại tầm nhìn thần. Phần "vào trong hố rồi thế nào" làm ở tệp này.
 * G.voidInside.enter(), update(giây) trả true khi xong; LOOK: thời gian tối dần, giữ, sáng lại. */
(function (root) {
  const BK = root.BK || (root.BK = {});
  const LOOK = { DARK: 1.2, HOLD: 2.6, LIGHT: 1.2 }; // (giây)
  function setup(G) {
    let el = null,
      t = -1;
    function make() {
      el = document.createElement('div');
      el.style.cssText =
        'position:fixed;inset:0;z-index:60;background:#000;opacity:0;pointer-events:none;display:flex;flex-direction:column;' +
        'align-items:center;justify-content:center;gap:10px;color:#cfe6ff;font:500 18px/1.4 system-ui,sans-serif;text-align:center';
      el.innerHTML = '<div>Đã bị hút vào hố đen</div><div style="font-size:13px;opacity:.6">Bên trong hố đen: chờ phát triển tiếp</div>';
      document.body.appendChild(el);
    }
    function enter() {
      if (t >= 0) return;
      if (!el) make();
      t = 0;
    }
    // trả 'exit' đúng một lần lúc màn hình đen hẳn (bên gọi cho linh hồn rời thân), true khi xong
    function update(sec) {
      if (t < 0) return false;
      const t0 = t;
      t += sec;
      const D = LOOK.DARK,
        H = D + LOOK.HOLD,
        E = H + LOOK.LIGHT;
      el.style.opacity = String(t < D ? t / D : t < H ? 1 : Math.max(0, 1 - (t - H) / LOOK.LIGHT));
      if (t0 < D && t >= D) return 'exit';
      if (t >= E) {
        t = -1;
        el.style.opacity = '0';
        return true;
      }
      return false;
    }
    G.voidInside = { enter, update, get on() {
      return t >= 0;
    } };
  }
  BK.VoidInside = { setup, LOOK };
})(typeof self !== 'undefined' ? self : globalThis);
