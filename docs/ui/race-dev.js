/* Bể Kính · ui/race-dev.js · Tin giữa các đảo và bảng dev "Cuộc đua"
 * (design/quy-trinh-tong-quat.md mục 10) Chỉ cho dev, không phải giao diện người chơi.
 *   ô tin      góc dưới: ba tin mới nhất giữa các đảo (W.log của logic/diplomacy.js, logic/war.js). Bấm vào thì mở bảng.
 *   bảng       mỗi đảo một thẻ:
 *                - thời, dân, lính, kho sáu thứ, bất bình (đảo bị sáp nhập);
 *                - người đứng đầu và tính cách nổi trội (logic/temper.js), thế quân (tích quân, phát triển);
 *                - thuộc đảo nào, đang đánh với ai, hiệp ước, cầu.
 *              Số liệu cả bể: số trận theo kiểu (W.warStats), sáp nhập, nổi dậy, cướp đoàn buôn, chết đói, chết trận (đếm từ
 *              người, không đếm chữ trong nhật ký vì nhật ký chỉ giữ 400 dòng).
 *              Nhật ký chung (40 tin mới nhất): bấm một tin thì máy quay bay tới đảo đó (G.flyTo, G.setFocus).
 * Cần: game/cities.js (G.world), ui/camera-fly.js, ui/landbar.js, logic/ (economy, temper, war). */
(function (root) {
  const BK = root.BK || (root.BK = {});
  const NEWS = 3, LOG = 40;
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const SHORT = { food: 'LT', wood: 'Gỗ', stone: 'Đá', metal: 'KL', energy: 'NL', luxury: 'HQ' };

  function setup(G) {
    const { $ } = G, W = G.world, E = BK.Economy, P = BK.People, news = $('worldNews'), board = $('raceBoard');
    let open = false;
    const toggle = (v) => { open = v == null ? !open : v; board.hidden = !open; news.setAttribute('aria-expanded', String(open)); if (open) render(); };
    news.addEventListener('click', () => toggle());
    news.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } });
    board.addEventListener('click', (e) => {
      if (e.target.closest('[data-close]')) return toggle(false);
      const b = e.target.closest('[data-isle]'); if (!b) return;
      const i = +b.dataset.isle; G.setFocus(i); G.flyTo(G.lands[i].center, 96);
    });

    // một thẻ đảo
    function card(S, i) {
      const L = BK.Island.living(S), st = E.state(S), king = S.seats.king != null ? S.people.get(S.seats.king) : null;
      const sold = L.filter((p) => p.job === 'soldier').length, away = L.filter((p) => p.away).length;
      const war = BK.War && W.wars && W.wars.find((w) => w.a === i || w.b === i);
      const foe = war ? W.islands[war.a === i ? war.b : war.a].name : null;
      const pacts = W.treaties ? W.treaties.filter((t) => (t.a === i || t.b === i) && t.until > W.day).map((t) => (t.kind === 'alliance' ? 'liên minh ' : 'không xâm phạm ') + W.islands[t.a === i ? t.b : t.a].name) : [];
      const bridges = W.bridges ? W.bridges.filter((b) => b.a === i || b.b === i).map((b) => W.islands[b.a === i ? b.b : b.a].name) : [];
      const head = king ? esc((king.governor != null ? 'Người cai quản ' : '') + P.fullName(king)) + ' (' + esc(BK.Temper.nameOf(BK.Temper.of(king))) + ')' : 'chưa có người đứng đầu';
      const stance = S.annexedBy != null ? 'thuộc ' + esc(W.islands[S.annexedBy].name) + ' · bất bình ' + Math.round((S.unrest || 0) * 100) + '%' : S.policy && S.policy.stance === 'arm' ? 'tích quân' : 'phát triển';
      return '<button class="rb-card" data-isle="' + i + '" style="--c:' + G.TERRAINS[i].color + '">' +
        '<b>' + esc(S.name) + '</b> · thời ' + S.level + ' · ' + L.length + ' dân · ' + sold + ' lính' + (away ? ' (' + away + ' đang đi xa)' : '') + (st.hunger ? ' · <em>đang đói</em>' : '') +
        '<span>' + E.RES.map((r) => SHORT[r] + ' ' + Math.round(st.stock[r])).join(' · ') + '</span>' +
        '<span>' + head + ' · ' + stance + (foe ? ' · <em>' + (war.kind === 'revolt' ? 'nổi dậy' : 'đánh nhau') + ' với ' + esc(foe) + '</em>' : '') + '</span>' +
        // kho vũ khí bắn xa (logic/missiles.js): tên lửa, hạt nhân, quả đang chế tạo; đảo từng bị bắn hạt nhân, đang nhiễm xạ
        (S.arms && (S.arms.missiles || S.arms.nukes || S.arms.nukeDone) || S.nukedTotal ? '<span>' + esc([S.arms && S.arms.missiles ? S.arms.missiles + ' tên lửa' : '', S.arms && S.arms.nukes ? S.arms.nukes + ' hạt nhân' : '', S.arms && S.arms.nukeDone ? 'đang chế tạo hạt nhân' : '', S.nukedTotal ? 'bị bắn ' + S.nukedTotal + ' quả hạt nhân' + (S.falloutUntil > W.day ? ', đang nhiễm xạ' : '') : ''].filter(Boolean).join(' · ')) + '</span>' : '') +
        // hệ sinh thái (logic/ecology.js): rừng, mỏ, đất ruộng, khói bụi; đóng cầu, cấm vận, bất bình, giữ đất cho đời sau
        (S.env ? '<span>' + esc(['rừng ' + Math.round(S.env.forest * 100) + '%', 'mỏ ' + Math.round(S.env.ore * 100) + '%', 'đất ' + Math.round(S.env.soil * 100) + '%', S.env.smog > 0.02 ? 'khói bụi ' + Math.round(S.env.smog * 100) + '%' : '', S.conserve ? 'giữ đất cho đời sau' : '', S.closed && S.closed.until > W.day ? 'đóng cầu (' + S.closed.why + ')' : '', W.embargo && W.embargo[i] > W.day ? 'bị cấm vận' : '', S.discontent > 0.3 ? 'bất bình ' + Math.round(S.discontent * 100) + '%' : ''].filter(Boolean).join(' · ')) + '</span>' : '') +
        (pacts.length || bridges.length ? '<span>' + esc([pacts.join(', '), bridges.length ? 'cầu sang ' + bridges.join(', ') : ''].filter(Boolean).join(' · ')) + '</span>' : '') +
        '</button>';
    }
    function render() {
      if (!W.diplomacy) return;
      const dead = (cause) => W.islands.reduce((a, S) => a + [...S.people.values()].filter((p) => p.cause === cause).length, 0);
      const s = W.warStats || {}, free = W.islands.filter((S) => S.annexedBy == null).length;
      board.innerHTML = '<div class="rb-head"><b>Cuộc đua · ngày ' + (Math.floor(W.day) + 1) + '</b><button data-close aria-label="Đóng bảng">✕</button></div>' +
        W.islands.map(card).join('') +
        '<p class="rb-stats">' + free + ' đảo độc lập · đột kích ' + (s.raid || 0) + ' · tổng tấn công ' + (s.conquer || 0) + ' · sáp nhập ' + (W.annexations || 0) + ' · nổi dậy ' + (s.revolt || 0) + ' (độc lập lại ' + (s.freed || 0) + ') · cướp đoàn buôn ' + (W.robberies || 0) + ' · chết trận ' + dead('chiến tranh') + ' · chết đói ' + dead('đói') + '</p>' +
        '<div class="rb-log">' + W.log.slice(-LOG).reverse().map((e) => '<button data-isle="' + (e.isles && e.isles.length ? e.isles[0] : 0) + '"><b>Ngày ' + (e.day + 1) + '</b> ' + esc(e.text) + '</button>').join('') + '</div>';
    }
    // mỗi giây (game/loop.js): ô tin, và bảng nếu đang mở
    function slow() {
      if (!W.diplomacy) return;
      const last = W.log.slice(-NEWS).reverse();
      news.hidden = !last.length;
      news.innerHTML = last.map((e) => '<div><b>Ngày ' + (e.day + 1) + '</b> · ' + esc(e.text) + '</div>').join('');
      if (open) render();
    }
    slow();
    G.raceDev = { slow, toggle };
  }
  BK.RaceDev = { setup };
})(typeof self !== 'undefined' ? self : globalThis);
