/* Bể Kính · ui/model-ui.js
 * Giao diện của NPC mẫu: một dòng chữ nhỏ cho biết đang diễn cử chỉ nào (thứ mấy trên tổng số), và một thẻ nhỏ khi bấm
 * vào NPC: thông số (tuổi, gen tính cách, dáng, thói quen) cùng danh sách cử chỉ theo nhóm để chọn diễn, hay để tự diễn.
 * Không có tên nổi trên đầu. Chỉ gọi model.play / model.setAuto; không biết gì về 3D (vị trí thẻ do index.html tính).
 * Cần: logic/genes.js, logic/people.js, render/gestures3d.js. */
(function (root, factory) {
  const BK = root.BK || (root.BK = {});
  BK.ModelUI = factory(BK);
})(typeof self !== 'undefined' ? self : globalThis, function (BK) {
  'use strict';
  const CSS = `
.mcap { position: fixed; left: 50%; bottom: calc(env(safe-area-inset-bottom, 0px) + 72px); transform: translateX(-50%); padding: 5px 12px; border-radius: 999px; font-size: 12.5px; white-space: nowrap; pointer-events: none; }
.mcap b { color: var(--amber); font-weight: 600; }
.mtag { position: fixed; width: min(290px, calc(100% - 24px)); max-height: min(70vh, 520px); overflow: auto; border-radius: 14px; padding: 10px 12px; font-size: 12.5px; z-index: 5; }
.mtag h4 { margin: 0; font: 700 16px var(--font-display); display: flex; justify-content: space-between; gap: 8px; }
.mtag .sub { color: var(--ink-dim); font-size: 11.5px; margin-bottom: 6px; }
.mtag .tr { display: grid; grid-template-columns: 1fr 1fr; gap: 1px 12px; }
.mtag .tr span { display: flex; justify-content: space-between; } .mtag .tr i { font-style: normal; color: var(--amber); }
.mtag .sec { margin: 8px 0 4px; font-size: 10.5px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--amber); }
.mtag .g { margin: 3px 0 2px; color: var(--ink-dim); font-size: 11px; }
.mtag .chips { display: flex; flex-wrap: wrap; gap: 3px; }
.mtag button { border: 1px solid var(--glass-line); background: rgba(255,255,255,0.07); color: var(--ink); border-radius: 999px; padding: 3px 8px; font: 500 11.5px var(--font-body); cursor: pointer; }
.mtag button[aria-pressed="true"] { background: rgba(255,210,122,0.3); border-color: var(--amber); }
.mtag .x { padding: 1px 7px; }
`;
  function create(o) {
    const { model } = o,
      G = BK.Genes,
      P = BK.People,
      Gs = BK.Gestures3D,
      p = model.person;
    const st = document.createElement('style');
    st.textContent = CSS;
    document.head.appendChild(st);
    const cap = document.createElement('div');
    cap.className = 'mcap glass';
    document.body.appendChild(cap);
    const tag = document.createElement('section');
    tag.className = 'mtag glass';
    tag.hidden = true;
    tag.setAttribute('aria-label', 'Thông số NPC mẫu');
    document.body.appendChild(tag);
    let lastCap = '',
      lastTag = '';

    const ver = (document.querySelector('meta[name="bekinh-version"]') || {}).content || 'phát triển';
    const faceName = (k) => (BK.Face3D.BY_KEY[k] || {}).name || k;
    function capText() {
      const g = model.current;
      return (
        'Bản ' +
        ver +
        ' · Cử chỉ ' +
        (model.index + 1) +
        '/' +
        Gs.LIST.length +
        ' · <b>' +
        g.n +
        '</b> · ' +
        g.g +
        ' · mặt ' +
        faceName(model.face).toLowerCase() +
        (model.pinnedFace ? ' (ghim)' : '') +
        (model.auto ? '' : ' · đang giữ')
      );
    }
    function tagHtml() {
      const t = p.genome.traits,
        g = p.genome.gait,
        cur = model.current;
      const traits = G.TRAITS.map((x) => '<span>' + x.name + ' <i>' + Math.round(t[x.key] * 100) + '</i></span>').join('');
      const gait = G.GAIT.map(
        (x) => x.name.toLowerCase() + ' ' + (g[x.key] < 0.4 ? x.low.split(',')[0] : g[x.key] > 0.6 ? x.high.split(',')[0] : 'vừa'),
      ).join(', ');
      const list = Gs.GROUPS.map(
        (grp) =>
          '<div class="g">' +
          grp +
          '</div><div class="chips">' +
          Gs.LIST.filter((x) => x.g === grp)
            .map(
              (x) =>
                '<button data-g="' +
                x.key +
                '" aria-pressed="' +
                (x.key === cur.key) +
                '" title="' +
                (x.gene ? 'thường gặp ở: ' + x.gene : '') +
                '">' +
                x.n +
                '</button>',
            )
            .join('') +
          '</div>',
      ).join('');
      return (
        '<h4>' +
        P.fullName(p) +
        '<button class="x" data-x="1" aria-label="Đóng">✕</button></h4>' +
        '<div class="sub">NPC mẫu · ' +
        (p.sex === 'm' ? 'nam' : 'nữ') +
        ' · ' +
        Math.floor(P.ageOf(p, 0)) +
        ' tuổi · thói quen ' +
        G.habitName(p.genome.habit).toLowerCase() +
        '</div>' +
        '<div class="tr">' +
        traits +
        '</div>' +
        '<div class="sec">Dáng</div><div>' +
        gait +
        '</div>' +
        '<div class="sec">Biểu cảm khuôn mặt (' +
        BK.Face3D.EXPR.length +
        ')</div><div class="chips"><button data-f="" aria-pressed="' +
        !model.pinnedFace +
        '">Theo cử chỉ</button>' +
        BK.Face3D.EXPR.map(
          (e) => '<button data-f="' + e.key + '" aria-pressed="' + (model.pinnedFace === e.key) + '">' + e.name + '</button>',
        ).join('') +
        '</div>' +
        '<div class="sec">Cử chỉ đã huấn luyện (' +
        Gs.LIST.length +
        ')</div><button data-auto="1" aria-pressed="' +
        model.auto +
        '">Tự diễn lần lượt</button>' +
        list
      );
    }
    function render() {
      const c = capText();
      if (c !== lastCap) {
        lastCap = c;
        cap.innerHTML = c;
      }
      if (!tag.hidden) {
        const h = tagHtml();
        if (h !== lastTag) {
          lastTag = h;
          tag.innerHTML = h;
        }
      }
    }
    // mở thẻ gần chỗ bấm (x, y là toạ độ màn hình của NPC)
    function open(x, y) {
      tag.hidden = false;
      lastTag = '';
      render();
      const w = tag.offsetWidth,
        h = tag.offsetHeight;
      tag.style.left = Math.max(12, Math.min(window.innerWidth - w - 12, x + 24)) + 'px';
      tag.style.top = Math.max(70, Math.min(window.innerHeight - h - 90, y - h / 2)) + 'px';
    }
    const close = () => {
      tag.hidden = true;
    };
    tag.addEventListener('click', (e) => {
      const fb = e.target.closest('[data-f]');
      if (fb) {
        model.setFace(fb.dataset.f);
        lastTag = '';
        render();
        return;
      }
      const b = e.target.closest('[data-g]');
      if (b) {
        model.play(b.dataset.g);
        lastTag = '';
        render();
        return;
      }
      if (e.target.closest('[data-auto]')) {
        model.setAuto(!model.auto);
        lastTag = '';
        render();
        return;
      }
      if (e.target.closest('[data-x]')) close();
    });
    render();
    return {
      render,
      open,
      close,
      get open_() {
        return !tag.hidden;
      },
    };
  }
  return { create };
});
