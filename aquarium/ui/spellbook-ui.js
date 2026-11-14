/* Bể Kính · ui/spellbook-ui.js · Giao diện sách phép thuật (design/ke-hoach-buoc-37.md)
 * Chỉ hiện khi đang ở trong thân (body.possessed.soul-in, ui/possess-ctl.js):
 *   sách       phím B (hay nút Sách trên điện thoại) mở, đóng; trang trái: các hệ (Linh hồn, Thời gian, Lửa, Đất, Nước); trang
 *              phải: các phép của hệ đang chọn (giá linh lực, hồi phép, mô tả, "sắp có" nếu chưa mở); bấm phép đã mở để chọn
 *   thanh phép các phép đã mở, phím 1 đến 9 để chọn; lớp phủ hồi phép; thanh linh lực ở dưới
 *   phát phép  chuột trái khi đã khoá chuột (lần bấm đầu chỉ khoá chuột), hay phím E; điện thoại: nút Phép
 *   báo        dòng chữ ngắn khi không phát được (thiếu linh lực, đang hồi phép, sắp có)
 * Màu lấy từ bảng màu chung (render/style/palette.js). sync() mỗi khung hình (game/loop.js qua G.spellbookUi).
 * Cần: logic/spells.js, game/spellbook.js, game/possess.js. */
(function (root) {
  const BK = root.BK || (root.BK = {});
  // biểu tượng mỗi hệ (SVG 24 × 24, vẽ bằng màu chữ hiện tại)
  const ICON = {
    soul:
      '<circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v4M12 17.5v4M2.5 12h4M17.5 12h4M5.3 5.3l2.6 2.6M16.1 16.1l2.6 2.6' +
      'M18.7 5.3l-2.6 2.6M7.9 16.1l-2.6 2.6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" fill="none"/>',
    time: '<circle cx="12" cy="12" r="8.5" stroke="currentColor" stroke-width="1.8" fill="none"/><path d="M12 7v5.2l3.4 2.2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" fill="none"/>',
    fire: '<path d="M12 2.8c1.2 3.4 5.6 5.4 5.6 10.4A5.6 5.6 0 0 1 6.4 13.2c0-2.4 1.3-3.8 2.5-5 .1 1.6.8 2.8 2 3.3-.3-3.2.4-5.9 1.1-8.7z"/>',
    earth: '<path d="M3 19.5l5.2-9.4 3.4 5 2.6-3.6 6.8 8z"/>',
    water: '<path d="M12 3c2.8 4.2 6 7.4 6 11.2a6 6 0 0 1-12 0C6 10.4 9.2 7.2 12 3z"/>',
  };
  const svg = (school) => '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' + (ICON[school] || '') + '</svg>';
  function css(PAL) {
    const u = PAL.ui;
    return `
.sb-bar { position: fixed; left: 50%; bottom: calc(env(safe-area-inset-bottom, 0px) + 64px); transform: translateX(-50%);
  display: none; flex-direction: column; align-items: center; gap: 6px; pointer-events: none; }
body.possessed.soul-in .sb-bar { display: flex; }
.sb-slots { display: flex; gap: 6px; pointer-events: auto; }
.sb-slot { position: relative; width: 46px; height: 46px; border-radius: 12px; border: 1.5px solid rgba(255,255,255,.28);
  background: rgba(10,14,20,.42); backdrop-filter: blur(6px); color: #fff; cursor: pointer; padding: 0; overflow: hidden; }
.sb-slot svg { width: 26px; height: 26px; margin-top: 2px; }
.sb-slot .k { position: absolute; left: 4px; top: 2px; font: 600 10px var(--font-body); opacity: .75; }
.sb-slot .c { position: absolute; right: 4px; bottom: 2px; font: 600 9.5px var(--font-body); opacity: .8; }
.sb-slot.sel { border-color: #fff; box-shadow: 0 0 0 2px rgba(255,255,255,.25), 0 0 14px rgba(160,220,255,.45); }
.sb-slot.no { opacity: .55; }
.sb-slot .cd { position: absolute; inset: 0; background: conic-gradient(rgba(10,14,20,.7) var(--p), transparent 0); }
.sb-mana { width: 220px; height: 7px; border-radius: 99px; background: rgba(10,14,20,.45); overflow: hidden; }
.sb-mana i { display: block; height: 100%; width: 100%; border-radius: 99px; background: linear-gradient(90deg, ${u.manaDark}, ${u.mana});
  transform-origin: left; transition: transform .12s linear; }
.sb-toast { position: fixed; left: 50%; top: 62%; transform: translateX(-50%); padding: 6px 14px; border-radius: 999px;
  font: 600 13px var(--font-body); color: #fff; background: rgba(10,14,20,.55); opacity: 0; transition: opacity .25s; pointer-events: none; }
.sb-toast.on { opacity: 1; }
.sb-wrap { position: fixed; inset: 0; display: none; align-items: center; justify-content: center; background: rgba(8,10,16,.35);
  backdrop-filter: blur(2px); z-index: 30; }
.sb-wrap.on { display: flex; }
.sb-book { position: relative; display: grid; grid-template-columns: 240px 1fr; width: min(820px, 94vw); max-height: 86vh;
  border-radius: 14px; background: ${u.paper}; color: ${u.ink}; box-shadow: 0 24px 60px rgba(0,0,0,.35), inset 0 0 0 6px ${u.paperDark};
  overflow: hidden; animation: sb-open .28s ease-out; }
@keyframes sb-open { from { transform: scale(.94) translateY(8px); opacity: 0; } to { transform: none; opacity: 1; } }
@media (prefers-reduced-motion: reduce) { .sb-book { animation: none; } }
.sb-left { padding: 26px 18px; border-right: 2px solid ${u.paperDark}; background: linear-gradient(90deg, ${u.paper}, ${u.paperDark}); }
.sb-left h2 { margin: 0 0 14px; font: 700 20px var(--font-display, var(--font-body)); letter-spacing: .02em; }
.sb-tab { display: flex; align-items: center; gap: 10px; width: 100%; padding: 9px 10px; margin-bottom: 4px; border: 0; border-radius: 10px;
  background: transparent; color: ${u.ink}; font: 600 14.5px var(--font-body); cursor: pointer; text-align: left; }
.sb-tab svg { width: 22px; height: 22px; }
.sb-tab.on { background: rgba(255,255,255,.55); }
.sb-left .mana { margin-top: 18px; font: 500 12.5px var(--font-body); color: ${u.inkSoft}; }
.sb-left .mana b { display: block; height: 6px; margin-top: 5px; border-radius: 99px; background: rgba(0,0,0,.08); overflow: hidden; }
.sb-left .mana b i { display: block; height: 100%; background: ${u.mana}; }
.sb-right { padding: 26px 26px 22px; overflow: auto; }
.sb-right h3 { display: flex; align-items: center; gap: 8px; margin: 0 0 14px; font: 700 18px var(--font-body); }
.sb-right h3 svg { width: 24px; height: 24px; }
.sb-card { display: grid; grid-template-columns: 1fr auto; gap: 2px 12px; padding: 12px 14px; margin-bottom: 10px; border-radius: 12px;
  background: rgba(255,255,255,.5); border: 1.5px solid transparent; cursor: pointer; }
.sb-card.sel { border-color: currentColor; }
.sb-card.lock { cursor: default; color: ${u.lock}; }
.sb-card .n { font: 700 15px var(--font-body); }
.sb-card .m { font: 600 12px var(--font-body); text-align: right; color: ${u.inkSoft}; }
.sb-card .d { grid-column: 1 / -1; font: 400 13px/1.45 var(--font-body); color: ${u.inkSoft}; }
.sb-card .s { grid-column: 1 / -1; font: 600 11.5px var(--font-body); letter-spacing: .02em; }
.sb-close { position: absolute; right: 12px; top: 10px; width: 32px; height: 32px; border: 0; border-radius: 50%; font: 600 18px var(--font-body);
  background: rgba(0,0,0,.06); color: ${u.ink}; cursor: pointer; }
.sb-touch { position: fixed; display: none; width: 58px; height: 58px; border-radius: 50%; border: 1.5px solid rgba(255,255,255,.4);
  background: rgba(255,255,255,.12); color: #fff; font: 600 11.5px var(--font-body); touch-action: none; }
.sb-touch.book { right: calc(env(safe-area-inset-right, 0px) + 22px); bottom: calc(env(safe-area-inset-bottom, 0px) + 220px); }
.sb-touch.cast { right: calc(env(safe-area-inset-right, 0px) + 98px); bottom: calc(env(safe-area-inset-bottom, 0px) + 140px); }
body.possessed.soul-in.touch .sb-touch { display: block; }
@media (max-width: 720px) { .sb-book { grid-template-columns: 1fr; } .sb-left { border-right: 0; border-bottom: 2px solid ${u.paperDark}; } }
`;
  }
  function setup(G) {
    const SP = BK.Spells,
      PAL = BK.Palette,
      SB = G.spellbook,
      P = G.possess,
      canvas = G.renderer.domElement;
    const style = document.createElement('style');
    style.textContent = css(PAL);
    document.head.appendChild(style);
    const el = (tag, cls, html) => {
      const e = document.createElement(tag);
      if (cls) e.className = cls;
      if (html != null) e.innerHTML = html;
      return e;
    };
    const fmt = (s) => SP.price(s) + (s.use === 'hold' ? '/giây' : '') + ' linh lực' + (s.cd ? ' · hồi ' + s.cd + ' giây' : '');
    /* ----- thanh phép, linh lực, dòng báo ----- */
    const bar = el('div', 'sb-bar'),
      slots = el('div', 'sb-slots'),
      mana = el('div', 'sb-mana', '<i></i>'),
      toast = el('div', 'sb-toast');
    bar.append(slots, mana);
    const open = () => SP.SPELLS.filter((s) => s.open);
    let slotEls = [];
    function buildSlots() {
      slots.innerHTML = '';
      slotEls = open()
        .slice(0, 9)
        .map((s, i) => {
          const b = el('button', 'sb-slot', '<span class="k">' + (i + 1) + '</span>' + svg(s.school) + '<span class="c">' + SP.price(s) + '</span><span class="cd"></span>');
          b.type = 'button';
          b.title = s.name + ' · ' + fmt(s);
          b.style.color = PAL.c(s.school + '.mid');
          b.addEventListener('click', () => SB.select(s.id));
          slots.append(b);
          return { b, s, cd: b.querySelector('.cd') };
        });
    }
    buildSlots();
    let toastT = 0;
    function say(text) {
      toast.textContent = text;
      toast.classList.add('on');
      toastT = performance.now() + 1300;
    }
    /* ----- cuốn sách ----- */
    const wrap = el('div', 'sb-wrap'),
      book = el('div', 'sb-book'),
      left = el('div', 'sb-left', '<h2>Sách phép</h2>'),
      right = el('div', 'sb-right'),
      close = el('button', 'sb-close', '×');
    close.type = 'button';
    close.setAttribute('aria-label', 'Đóng sách');
    const manaBox = el('div', 'mana', 'Linh lực <b><i></i></b>');
    let page = 'soul';
    const tabs = SP.SCHOOLS.map((c) => {
      const t = el('button', 'sb-tab', svg(c.id) + c.name);
      t.type = 'button';
      t.style.setProperty('--c', PAL.c(c.id + '.ui'));
      t.querySelector('svg').style.color = PAL.c(c.id + '.ui');
      t.addEventListener('click', () => {
        page = c.id;
        if (SB.audio) SB.audio.page();
        render();
      });
      left.append(t);
      return [c.id, t];
    });
    left.append(manaBox);
    book.append(left, right, close);
    wrap.append(book);
    document.body.append(bar, toast, wrap);
    function render() {
      for (const [id, t] of tabs) t.classList.toggle('on', id === page);
      const sc = SP.SCHOOLS.find((c) => c.id === page);
      right.innerHTML = '';
      const h = el('h3', null, svg(page) + sc.name);
      h.style.color = PAL.c(page + '.ui');
      right.append(h);
      for (const s of SP.SPELLS.filter((x) => x.school === page)) {
        const card = el(
          'div',
          'sb-card' + (s.open ? '' : ' lock') + (SB.st.sel === s.id ? ' sel' : ''),
          '<span class="n">' + s.name + '</span><span class="m">' + fmt(s) + '</span><span class="d">' + s.desc + '</span>' +
            '<span class="s">' + (s.open ? (SB.st.sel === s.id ? 'Đang chọn' : 'Bấm để chọn') : 'Sắp có') + (s.need === 'sea' ? ' · chỉ khi ở gần biển' : '') + '</span>',
        );
        if (s.open) {
          card.style.color = PAL.c(s.school + '.ui');
          card.addEventListener('click', () => {
            SB.select(s.id);
            render();
          });
        }
        right.append(card);
      }
    }
    const isOpen = () => wrap.classList.contains('on');
    function toggle(on) {
      const want = on == null ? !isOpen() : on;
      if (want && !P.inside) return;
      wrap.classList.toggle('on', want);
      if (want) {
        page = (SP.BY.get(SB.st.sel) || {}).school || 'soul';
        render();
        if (SB.audio) SB.audio.page();
        if (document.pointerLockElement && document.exitPointerLock) document.exitPointerLock();
      }
    }
    close.addEventListener('click', () => toggle(false));
    wrap.addEventListener('click', (e) => {
      if (e.target === wrap) toggle(false);
    });
    function tryCast() {
      const r = SB.press();
      if (r && !r.ok && r.text) say(r.text);
    }
    const stopCast = () => SB.release(); // (thả phím, chuột: dừng phép đang giữ)
    /* ----- phím, chuột, nút điện thoại ----- */
    // (nghe ở window, pha bắt: chạy trước phím của ui/possess-ctl.js, để Esc đóng sách chứ không thoát nhập hồn)
    window.addEventListener(
      'keydown',
      (e) => {
        if (!P.inside || G.typing(e.target)) return;
        if (e.code === 'KeyB') {
          e.preventDefault();
          e.stopImmediatePropagation();
          toggle();
          return;
        }
        if (e.code === 'Escape' && isOpen()) {
          e.preventDefault();
          e.stopImmediatePropagation(); // (Esc đóng sách trước, không thoát nhập hồn)
          toggle(false);
          return;
        }
        if (isOpen()) return;
        const m = /^Digit([1-9])$/.exec(e.code);
        if (m && slotEls[+m[1] - 1]) {
          e.preventDefault();
          SB.select(slotEls[+m[1] - 1].s.id);
          return;
        }
        if (e.code === 'KeyE' && !e.repeat) {
          e.preventDefault();
          tryCast();
        }
      },
      true,
    );
    window.addEventListener('keyup', (e) => {
      if (e.code === 'KeyE') stopCast();
    });
    window.addEventListener('pointerup', stopCast);
    window.addEventListener('blur', stopCast);
    canvas.addEventListener('pointerdown', (e) => {
      // (lần bấm đầu chỉ khoá chuột: ui/possess-ctl.js; đã khoá chuột thì chuột trái phát phép)
      if (P.inside && e.button === 0 && e.pointerType === 'mouse' && document.pointerLockElement === canvas && !isOpen()) tryCast();
    });
    const tBook = el('button', 'sb-touch book', 'Sách'),
      tCast = el('button', 'sb-touch cast', 'Phép');
    tBook.type = tCast.type = 'button';
    tBook.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      toggle();
    });
    tCast.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      tryCast();
    });
    for (const ev of ['pointerup', 'pointercancel', 'pointerleave']) tCast.addEventListener(ev, stopCast);
    document.body.append(tBook, tCast);
    /* ----- mỗi khung hình ----- */
    let lastMana = -1;
    function sync() {
      if (!P.inside && isOpen()) toggle(false);
      const m = SB.mana();
      if (Math.abs(m - lastMana) > 0.2) {
        lastMana = m;
        const k = m / SP.MANA_MAX;
        mana.firstChild.style.transform = 'scaleX(' + k.toFixed(3) + ')';
        manaBox.querySelector('i').style.width = (k * 100).toFixed(1) + '%';
      }
      for (const x of slotEls) {
        x.b.classList.toggle('sel', SB.st.sel === x.s.id);
        const cd = SB.cooldown(x.s.id);
        x.cd.style.setProperty('--p', cd > 0 ? ((cd / x.s.cd) * 100).toFixed(1) + '%' : '0%');
        x.b.classList.toggle('no', !SP.DEV.infinite && m < SP.price(x.s));
      }
      if (toastT && performance.now() > toastT) {
        toast.classList.remove('on');
        toastT = 0;
      }
    }
    G.spellbookUi = { sync, toggle, isOpen, say };
  }
  BK.SpellbookUi = { setup };
})(typeof self !== 'undefined' ? self : globalThis);
