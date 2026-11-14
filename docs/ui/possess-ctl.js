/* Bể Kính · ui/possess-ctl.js · Nút và điều khiển của cú nhập hồn (design/ke-hoach-buoc-32.md mục 3.3)
 * Nút "Nhập hồn" trên thanh điều khiển; trong lúc nhập hồn ẩn mọi bảng của góc nhìn thượng đế (body.possessed), chỉ còn
 * một dòng nhắc phím và nút "Thoát".
 * Máy tính: phím mũi tên hay W A S D để đi, Shift chạy, kéo chuột để xoay nhìn, Esc thoát.
 * Điện thoại: cần ảo nửa trái màn hình (đẩy xa thì chạy), kéo nửa phải để xoay nhìn.
 * Chỉ ghi vào G.possess (st.move, st.run, look, enter, exit); không đụng máy quay, không đụng người. Cần: game/possess.js. */
(function (root) {
  const BK = root.BK || (root.BK = {});
  const CSS = `
body.possessed .bar, body.possessed .lands, body.possessed .clock, body.possessed .news, body.possessed .race,
body.possessed .vpanel, body.possessed .vcard { opacity: 0; pointer-events: none; transition: opacity .6s; }
.soul-hint { position: fixed; left: 50%; bottom: calc(env(safe-area-inset-bottom, 0px) + 18px); transform: translateX(-50%);
  display: flex; gap: 10px; align-items: center; padding: 6px 8px 6px 14px; border-radius: 999px; font: 500 12.5px var(--font-body);
  color: rgba(255, 255, 255, 0.86); background: rgba(10, 14, 20, 0.38); backdrop-filter: blur(8px); opacity: 0; pointer-events: none;
  transition: opacity .8s .6s; white-space: nowrap; }
body.possessed.soul-in .soul-hint { opacity: 1; pointer-events: auto; }
.soul-hint button { border: 0; border-radius: 999px; padding: 6px 12px; font: 600 12.5px var(--font-body); color: #fff;
  background: rgba(255, 255, 255, 0.14); cursor: pointer; }
.soul-stick { position: fixed; left: 0; bottom: 0; width: 50%; height: 55%; display: none; touch-action: none; }
.soul-look { position: fixed; right: 0; top: 0; width: 50%; height: 100%; display: none; touch-action: none; }
body.possessed.soul-in.touch .soul-stick, body.possessed.soul-in.touch .soul-look { display: block; }
.soul-knob { position: absolute; width: 96px; height: 96px; margin: -48px 0 0 -48px; border-radius: 50%; display: none;
  border: 1.5px solid rgba(255, 255, 255, 0.35); background: rgba(255, 255, 255, 0.06); }
.soul-knob i { position: absolute; left: 50%; top: 50%; width: 40px; height: 40px; margin: -20px 0 0 -20px; border-radius: 50%;
  background: rgba(255, 255, 255, 0.42); }
@media (max-width: 720px) { .soul-hint .keys { display: none; } }
`;
  const KEYS = {
    ArrowUp: [0, 1],
    KeyW: [0, 1],
    ArrowDown: [0, -1],
    KeyS: [0, -1],
    ArrowLeft: [-1, 0],
    KeyA: [-1, 0],
    ArrowRight: [1, 0],
    KeyD: [1, 0],
  };
  const LOOK_K = 0.0042; // radian mỗi điểm ảnh kéo
  function setup(G) {
    const P = G.possess,
      canvas = G.renderer.domElement;
    const style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);
    // nút trên thanh điều khiển (trước nút Âm thanh)
    const btn = document.createElement('button');
    btn.id = 'soulBtn';
    btn.textContent = 'Nhập hồn';
    btn.title = 'Linh hồn lao xuống nhập vào một người ngẫu nhiên trong bể, dính với người đó tới khi người đó chết';
    const sound = document.getElementById('sound');
    if (sound && sound.parentNode) {
      const sep = document.createElement('span');
      sep.className = 'sep';
      sound.parentNode.insertBefore(btn, sound);
      sound.parentNode.insertBefore(sep, sound);
    }
    btn.onclick = () => P.enter();
    const hint = document.createElement('div');
    hint.className = 'soul-hint';
    hint.innerHTML =
      '<span class="keys">W A S D đi · Shift chạy · kéo chuột để nhìn · Esc thoát</span><button type="button">Thoát</button>';
    hint.querySelector('button').onclick = () => P.exit();
    document.body.appendChild(hint);
    const stick = document.createElement('div'),
      lookPad = document.createElement('div'),
      knob = document.createElement('div');
    stick.className = 'soul-stick';
    lookPad.className = 'soul-look';
    knob.className = 'soul-knob';
    knob.innerHTML = '<i></i>';
    stick.appendChild(knob);
    document.body.append(stick, lookPad);
    if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) document.body.classList.add('touch');

    /* ----- phím ----- */
    const held = new Set();
    let stickV = null; // cần ảo: [x, y] -1..1
    function applyMove() {
      let x = 0,
        y = 0;
      for (const c of held) {
        const k = KEYS[c];
        if (k) {
          x += k[0];
          y += k[1];
        }
      }
      if (stickV) {
        x += stickV[0];
        y += stickV[1];
      }
      const n = Math.hypot(x, y);
      P.st.move.set(n > 1 ? x / n : x, n > 1 ? y / n : y);
      P.st.run = held.has('ShiftLeft') || held.has('ShiftRight') || (!!stickV && Math.hypot(stickV[0], stickV[1]) > 0.85);
    }
    document.addEventListener(
      'keydown',
      (e) => {
        if (!P.active) return;
        if (e.code === 'Escape') {
          P.exit();
          return;
        }
        if (KEYS[e.code] || e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
          e.preventDefault();
          e.stopImmediatePropagation(); // (ui/camera-fly.js không bay máy quay lúc đang ở trong thân)
          held.add(e.code);
          applyMove();
        }
      },
      true,
    );
    document.addEventListener(
      'keyup',
      (e) => {
        if (!held.has(e.code)) return;
        held.delete(e.code);
        applyMove();
      },
      true,
    );
    window.addEventListener('blur', () => {
      held.clear();
      stickV = null;
      applyMove();
    });

    /* ----- chuột: kéo để xoay nhìn ----- */
    let drag = null;
    canvas.addEventListener('pointerdown', (e) => {
      if (P.active && e.pointerType === 'mouse') drag = [e.clientX, e.clientY];
    });
    window.addEventListener('pointermove', (e) => {
      if (!drag || !P.active) return;
      P.look((e.clientX - drag[0]) * LOOK_K, (e.clientY - drag[1]) * LOOK_K);
      drag = [e.clientX, e.clientY];
    });
    window.addEventListener('pointerup', () => (drag = null));

    /* ----- điện thoại: cần ảo bên trái, kéo bên phải để nhìn ----- */
    let sid = null,
      s0 = null;
    stick.addEventListener('pointerdown', (e) => {
      sid = e.pointerId;
      s0 = [e.clientX, e.clientY];
      knob.style.display = 'block';
      knob.style.left = e.clientX + 'px';
      knob.style.top = e.clientY - (window.innerHeight - stick.offsetHeight) + 'px';
      stick.setPointerCapture(sid);
    });
    stick.addEventListener('pointermove', (e) => {
      if (e.pointerId !== sid) return;
      const R = 48,
        dx = e.clientX - s0[0],
        dy = e.clientY - s0[1],
        n = Math.hypot(dx, dy),
        k = n > R ? R / n : 1;
      knob.firstChild.style.transform = 'translate(' + dx * k + 'px,' + dy * k + 'px)';
      stickV = [(dx * k) / R, (-dy * k) / R];
      applyMove();
    });
    const stickEnd = (e) => {
      if (e.pointerId !== sid) return;
      sid = null;
      stickV = null;
      knob.style.display = 'none';
      knob.firstChild.style.transform = '';
      applyMove();
    };
    stick.addEventListener('pointerup', stickEnd);
    stick.addEventListener('pointercancel', stickEnd);
    let lid = null,
      l0 = null;
    lookPad.addEventListener('pointerdown', (e) => {
      lid = e.pointerId;
      l0 = [e.clientX, e.clientY];
      lookPad.setPointerCapture(lid);
    });
    lookPad.addEventListener('pointermove', (e) => {
      if (e.pointerId !== lid) return;
      P.look((e.clientX - l0[0]) * LOOK_K * 1.4, (e.clientY - l0[1]) * LOOK_K * 1.4);
      l0 = [e.clientX, e.clientY];
    });
    const lookEnd = (e) => {
      if (e.pointerId === lid) lid = null;
    };
    lookPad.addEventListener('pointerup', lookEnd);
    lookPad.addEventListener('pointercancel', lookEnd);

    // trạng thái giao diện theo pha (gọi mỗi khung hình từ game/loop.js qua G.possessUi)
    let last = '';
    function sync() {
      const ph = P.st.phase;
      if (ph === last) return;
      last = ph;
      document.body.classList.toggle('possessed', ph !== 'off');
      document.body.classList.toggle('soul-in', ph === 'in');
      if (ph === 'off') {
        held.clear();
        stickV = null;
        applyMove();
      }
    }
    G.possessUi = { sync };
  }
  BK.PossessCtl = { setup };
})(typeof self !== 'undefined' ? self : globalThis);
