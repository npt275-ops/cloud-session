/* Bể Kính · ui/village-ui.js
 * Bảng của một làng: thế hệ, số người, tình huống đang có, hội đồng 8 ghế, nhật ký, và các nút thử tình huống
 * (hạn hán, lệnh chiến tranh, cãi nhau, lễ hội, yên ổn, sang thế hệ mới). Thẻ người: gen tính cách, gen dáng, thói quen,
 * gen hiếm, cha mẹ, vợ chồng, con cái, việc đang làm.
 * Chỉ đọc trạng thái logic và gọi Island.trigger; không biết gì về 3D (việc bay tới người do index.html truyền vào). */
(function (root, factory) {
  const BK = root.BK || (root.BK = {});
  BK.VillageUI = factory(BK);
})(typeof self !== 'undefined' ? self : globalThis, function (BK) {
  'use strict';
  const CSS = `
.vpanel { position: fixed; left: max(16px, env(safe-area-inset-left, 0px)); bottom: calc(env(safe-area-inset-bottom, 0px) + 84px); width: min(340px, calc(100% - 32px)); max-height: calc(100% - 200px); overflow: auto; border-radius: 16px; padding: 12px 14px; font-size: 13px; }
.vpanel h3 { margin: 0; font: 700 18px var(--font-display); display: flex; justify-content: space-between; align-items: baseline; gap: 8px; }
.vpanel h3 small { font: 500 12px var(--font-body); color: var(--ink-dim); }
.vpanel .chips { display: flex; flex-wrap: wrap; gap: 4px; margin: 6px 0; }
.vpanel .chip { padding: 2px 8px; border-radius: 999px; background: rgba(255,255,255,0.1); font-size: 11.5px; }
.vpanel .chip.hot { background: rgba(255,120,100,0.35); }
.vpanel .tests { display: flex; flex-wrap: wrap; gap: 4px; margin: 6px 0 8px; }
.vpanel button, .vcard button { border: 1px solid var(--glass-line); background: rgba(255,255,255,0.08); color: var(--ink); border-radius: 999px; padding: 5px 10px; font: 500 12px var(--font-body); cursor: pointer; }
.vpanel button:hover, .vcard button:hover { background: rgba(255,255,255,0.16); }
.vpanel .seats { display: grid; grid-template-columns: auto 1fr; gap: 2px 10px; margin: 6px 0; }
.vpanel .seats span { color: var(--ink-dim); }
.vpanel a, .vcard a { color: var(--ink); text-decoration: underline dotted; cursor: pointer; }
.vpanel .log { list-style: none; margin: 6px 0 0; padding: 0; display: grid; gap: 3px; color: var(--ink-dim); font-size: 12px; }
.vpanel .log b { color: var(--amber); font-weight: 500; }
.vpanel .stat { color: var(--ink-dim); font-size: 12px; margin: 4px 0 2px; font-variant-numeric: tabular-nums; }
.vpanel .sec { margin-top: 8px; font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--amber); }
.vcard { position: fixed; right: max(16px, env(safe-area-inset-right, 0px)); top: calc(env(safe-area-inset-top, 0px) + 84px); width: min(320px, calc(100% - 32px)); max-height: calc(100% - 190px); overflow: auto; border-radius: 16px; padding: 12px 14px; font-size: 13px; }
.vcard h2 { margin: 0 0 2px; font: 700 20px var(--font-display); }
.vcard .sub { color: var(--amber); font-size: 12px; letter-spacing: 0.04em; }
.vcard .row { display: grid; grid-template-columns: 92px 1fr 34px; align-items: center; gap: 6px; margin: 2px 0; }
.vcard .bar { height: 6px; border-radius: 3px; background: rgba(255,255,255,0.12); overflow: hidden; }
.vcard .bar i { display: block; height: 100%; background: linear-gradient(90deg, #8fe0b2, #ffd27a, #ff9b94); }
.vcard .k { color: var(--ink-dim); }
.vcard .x { float: right; }
@media (max-width: 720px) { .vpanel { max-height: 38vh; bottom: calc(env(safe-area-inset-bottom, 0px) + 76px); } .vcard { top: auto; bottom: calc(38vh + 96px); max-height: 34vh; } }
`;

  function create(o) {
    const { S, Island, onPick, onFly } = o, P = BK.People, G = BK.Genes, CO = BK.Council, B = BK.Brain, R = BK.Rules;
    const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    // panel: false thì không hiện bảng làng, chỉ hiện thẻ người khi bấm vào một người
    const panel = document.createElement('section'); panel.className = 'vpanel glass'; panel.setAttribute('aria-label', 'Làng ' + S.name); panel.hidden = o.panel === false; document.body.appendChild(panel);
    const card = document.createElement('section'); card.className = 'vcard glass'; card.hidden = true; document.body.appendChild(card);
    let sel = null, lastKey = '';
    const name = (id) => { const p = S.people.get(id); return p ? '<a data-id="' + id + '">' + P.fullName(p) + '</a>' : '?'; };
    const when = (day) => 'Năm ' + (Math.floor(day / R.YEAR_DAYS) + 1) + ' · ngày ' + ((Math.floor(day) % R.YEAR_DAYS) + 1);
    const PLACE_NAME = { home: 'ở nhà', field: 'ngoài ruộng', hall: 'ở nhà chính', square: 'ở sân làng', bridge: 'ra cầu', guard: 'đi tuần', gate: 'ở cổng thành', gateL: 'ở cổng phụ trái', gateR: 'ở cổng phụ phải', podium: 'ở bục diễn thuyết', site: 'ở chỗ đang dựng' };
    const TEST = [['drought', 'Hạn hán'], ['war', 'Lệnh chiến tranh'], ['protest', 'Biểu tình'], ['brawl', 'Ẩu đả'], ['speech', 'Diễn thuyết'], ['vigil', 'Cầu nguyện'], ['debate', 'Tranh luận'], ['gossip', 'Buôn chuyện'], ['quarrel', 'Cãi nhau'], ['festival', 'Lễ hội'], ['calm', 'Yên ổn'], ['nextGen', 'Sang thế hệ mới']]; // drama: logic/dramas.js

    function renderPanel() {
      const X = Island.situNow(S), live = Island.living(S);
      const chips = [['war', 'Chiến tranh'], ['drought', 'Hạn hán'], ['protest', 'Biểu tình'], ['quarrel', 'Đang cãi nhau'], ['festival', 'Lễ hội'], ['mourning', 'Để tang']].filter(([k]) => X[k]).map(([, t]) => '<span class="chip hot">' + t + '</span>').join('') || '<span class="chip">Ngày thường</span>';
      const seats = CO.SEATS.map((s) => { const id = S.seats[s.key], p = id != null && S.people.get(id); return '<span>' + (p ? CO.seatName(s.key, p.sex) : s.name) + '</span><div>' + (p ? name(id) + ' · ' + Math.floor(P.ageOf(p, S.day)) + ' tuổi' : '<i>trống</i>') + '</div>'; }).join('');
      const log = S.log.slice(-7).reverse().map((e) => '<li><b>' + when(e.day) + '</b> ' + e.text + '</li>').join('');
      const J = BK.Jobs, E = BK.Eras, lv = S.level || 1;
      const jobs = J ? ' · thợ ' + (J.count(S, 'builder') + (S.seats.builder != null ? 1 : 0)) + ' · lính ' + J.count(S, 'soldier') + ' · người làm ' + J.count(S, 'worker') + ' · đi đường ' + J.count(S, 'walker') + ' · già ' + J.count(S, 'elder') : '';
      panel.innerHTML = '<h3>Làng ' + S.name + ' <small>thế hệ ' + (S.gen + 1) + ' · ' + live.length + ' người · ' + live.filter((p) => P.ageOf(p, S.day) < R.ADULT_AGE).length + ' trẻ</small></h3>' +
        '<div class="stat">' + (E ? 'Cấp ' + lv + ' · ' + E.of(lv).name + ' · ' : '') + when(S.day) + '<br>Đã sinh ' + (S.births || 0) + ' · đã mất ' + (S.deaths || 0) + jobs + '</div>' +
        '<div class="chips">' + chips + (BK.Dramas ? BK.Dramas.active(S).map((A) => '<span class="chip hot">' + A.name + ' · ' + A.who.size + ' người</span>').join('') : '') + '</div>' +
        '<div class="sec">Thử tình huống</div><div class="tests">' + TEST.map(([k, t]) => '<button data-t="' + k + '">' + t + '</button>').join('') + '<button data-fly="1">Xem làng</button></div>' +
        '<div class="sec">Hội đồng</div><div class="seats">' + seats + '</div>' +
        '<div class="sec">Nhật ký</div><ul class="log">' + log + '</ul>';
    }
    function renderCard() {
      const p = sel != null && S.people.get(sel);
      if (!p) { card.hidden = true; return; }
      const g = p.genome, mind = S.minds.get(p.id), age = P.ageOf(p, S.day);
      const doing = !p.alive ? 'Đã mất (' + when(p.died) + ')' : mind ? (mind.verb && !mind.mood && BK.Tasks && BK.Tasks.VERB_NAME[mind.verb] ? BK.Tasks.VERB_NAME[mind.verb].replace(/^./, (c) => c.toUpperCase()) : B.STATE_NAME[mind.mood || mind.state] || mind.state) + (mind.place ? ' · ' + (PLACE_NAME[mind.place] || mind.place) : '') + (mind.target != null && S.people.get(mind.target) ? ' với ' + P.fullName(S.people.get(mind.target)) : '') + (mind.reason ? ' — ' + mind.reason : '') : '';
      // thanh tính cách: gen gốc; con số: tính cách biểu hiện, kèm dấu ngoại gen (logic/epigen.js) nếu có
      const bars = G.TRAITS.map((t) => { const v = g.traits[t.key], e = (p.epi && p.epi[t.key]) || 0, mut = g.mutations && g.mutations.some((m) => m.key === t.key); return '<div class="row"><span class="k">' + t.name + (mut ? ' ✦' : '') + '</span><div class="bar"><i style="width:' + Math.round(v * 100) + '%"></i></div><span>' + Math.round(P.traits(p)[t.key] * 100) + (Math.abs(e) >= 0.01 ? ' <small>(' + (e > 0 ? '+' : '') + Math.round(e * 100) + ')</small>' : '') + '</span></div>'; }).join('');
      const gait = G.GAIT.map((x) => { const v = g.gait[x.key]; return '<div class="row"><span class="k">' + x.name + '</span><div class="bar"><i style="width:' + Math.round(v * 100) + '%"></i></div><span>' + (v < 0.4 ? x.low.split(',')[0] : v > 0.6 ? x.high.split(',')[0] : 'vừa') + '</span></div>'; }).join('');
      const kids = p.children.map(name).join(', ') || 'chưa có';
      const spouse = p.spouses.map(name).join(', ') || 'chưa có';
      card.hidden = false;
      card.innerHTML = '<button class="x" data-close="1" aria-label="Đóng">✕</button><h2>' + P.fullName(p) + '</h2>' +
        // danh hiệu (logic/chronicle.js legend): anh hùng, kẻ phản bội, nhà phát minh, người đứng đầu huyền thoại
        (p.title ? '<div class="sub legend"><b>' + p.title + '</b>' + (p.legend ? ' · ' + p.legend : '') + '</div>' : '') +
        '<div class="sub">' + (p.role ? CO.seatName(p.role, p.sex) + ' · ' : p.job && BK.Jobs ? BK.Jobs.NAME[p.job] + ' · ' : '') + (p.temper && BK.Temper ? 'tính ' + BK.Temper.nameOf(p.temper).toLowerCase() + ' · ' : '') + (p.sex === 'm' ? 'nam' : 'nữ') + ' · ' + Math.floor(age) + ' tuổi · đời thứ ' + (p.gen + 1) + (p.commoner ? ' · người dân thường' : '') + '</div>' +
        '<p><span class="k">Đang:</span> ' + doing + '</p>' +
        '<p><span class="k">Cha mẹ:</span> ' + (p.parents.map(name).join(' và ') || 'người lập làng') + '<br><span class="k">Vợ chồng:</span> ' + spouse + '<br><span class="k">Con:</span> ' + kids + (p.alive && p.home != null ? '<br><span class="k">Nhà:</span> số ' + (p.home + 1) + (BK.Homes ? ' (' + BK.Homes.occupancy(S)[p.home] + ' người)' : '') : '') + '</p>' +
        '<div class="sec">Tính cách</div>' + bars +
        '<div class="sec">Dáng đi đứng</div>' + gait +
        '<p><span class="k">Thói quen:</span> ' + G.habitName(g.habit) + (g.habitFrom ? ' (' + (g.habitFrom === 'new' ? 'mới' : g.habitFrom === 'a' ? 'giống cha' : 'giống mẹ') + ')' : '') +
        (g.rare ? '<br><span class="k">Gen hiếm:</span> ' + G.rareName(g.rare) : '') + (g.mutations && g.mutations.length ? '<br><span class="k">✦ đột biến:</span> ' + g.mutations.map((m) => G.traitName(m.key) + ' ' + (m.delta > 0 ? '+' : '') + Math.round(m.delta * 100)).join(', ') : '') + '</p>';
    }
    function render(force) {
      const key = S.log.length + '|' + S.gen + '|' + Math.floor(S.day * 4) + '|' + sel;
      if (!force && key === lastKey) return; lastKey = key;
      if (!panel.hidden) renderPanel(); renderCard();
    }
    function select(id) { sel = id; render(true); if (onPick) onPick(id); }
    const click = (e) => {
      const a = e.target.closest('[data-id]'); if (a) { select(+a.dataset.id); return; }
      const b = e.target.closest('[data-t]'); if (b) { Island.trigger(S, b.dataset.t); render(true); return; }
      if (e.target.closest('[data-fly]') && onFly) onFly();
      if (e.target.closest('[data-close]')) select(null);
    };
    panel.addEventListener('click', click); card.addEventListener('click', click);
    render(true);
    const togglePanel = (on) => { panel.hidden = on == null ? !panel.hidden : !on; render(true); return !panel.hidden; };
    return { render, select, togglePanel, get selected() { return sel; } };
  }

  return { create };
});
