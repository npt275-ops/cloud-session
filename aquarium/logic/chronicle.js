/* Bể Kính · logic/chronicle.js · Biên niên, nhân vật nổi bật, nhịp kịch tính (design/chien-tranh-thinh-vuong.md mục 4)
 *   biên niên      W.chronicle: chuyện lớn của cả bể, mỗi chuyện có đảo, ngày, độ lớn (1..6), chỗ xảy ra (để bay tới). Bảng dev
 *                  "Cuộc đua" (ui/race-dev.js) hiện mỗi năm vài chuyện lớn nhất.
 *   nhân vật       W.legends: anh hùng (thắng đấu tướng, giữ cổng), kẻ phản bội (mở cổng), nhà phát minh, người đứng đầu huyền
 *                  thoại (trị vì lâu mà có thời hoàng kim hay chiếm được đảo khác). Người đó mang danh hiệu (p.title, p.legend)
 *                  trong thẻ người.
 *   nhịp kịch tính cả bể không có chuyện lớn (độ lớn từ 3) quá LULL ngày thì đẩy một nguyên nhân thật: người đứng đầu tham
 *                  vọng nhất thấy mình bị coi thường bởi đảo giàu hơn hay đảo mình đang thù (nỗi nhục), nên muốn đánh hơn một
 *                  thời gian (policy.provoked, logic/strategy.js). Không bốc thăm một sự kiện vô cớ.
 * Không vẽ gì, chạy được bằng Node. Cần: logic/strategy.js, logic/economy.js, logic/people.js. */
(function (root, factory) {
  const BK = root.BK || (root.BK = {});
  BK.Chronicle = factory(BK);
  if (typeof module === 'object' && module.exports) module.exports = BK.Chronicle;
})(typeof self !== 'undefined' ? self : globalThis, function (BK) {
  'use strict';
  const LULL = 200, BIG = 3, MAX = 400;
  const TITLE = { hero: 'Anh hùng', traitor: 'Kẻ phản bội', inventor: 'Nhà phát minh', ruler: 'Người đứng đầu huyền thoại' };
  function init(W) { W.chronicle = W.chronicle || []; W.legends = W.legends || []; W.pushes = 0; }
  function add(W, day, i, text, weight, at) {
    if (!W.chronicle) init(W);
    W.chronicle.push({ day: Math.floor(day), isle: i, text, w: weight || 1, at: at || null });
    if (W.chronicle.length > MAX) W.chronicle.splice(0, W.chronicle.length - MAX);
  }
  function legend(W, day, i, p, kind, text) {
    if (!W.legends) init(W); if (!p) return;
    p.title = TITLE[kind] || kind; p.legend = (p.legend ? p.legend + '; ' : '') + text;
    W.legends.push({ day: Math.floor(day), isle: i, id: p.id, name: BK.People.fullName(p), kind, text });
    add(W, day, i, TITLE[kind] + ' ' + BK.People.fullName(p) + ': ' + text, kind === 'traitor' ? 3 : 2, null);
  }
  // mỗi ngày: người đứng đầu huyền thoại; nhịp kịch tính
  function dayTick(W, day, rng) {
    if (!W.chronicle) init(W);
    // người đứng đầu trị vì lâu (từ 3 năm) mà đảo có thời hoàng kim hay đang cai quản đảo khác
    W.islands.forEach((S, i) => {
      const k = S.seats.king != null ? S.people.get(S.seats.king) : null; if (!k || k.title || k.governor != null) return;
      k.reignFrom = k.reignFrom || day;
      if (day - k.reignFrom > 3 * 360 && (S.golden || W.islands.some((V) => V.annexedBy === i))) legend(W, day, i, k, 'ruler', 'trị vì ' + Math.floor((day - k.reignFrom) / 360) + ' năm, ' + (S.golden ? 'đưa ' + S.name + ' vào thời hoàng kim' : 'mở rộng ' + S.name));
    });
    // nhịp kịch tính: cả bể yên quá lâu thì đẩy một nguyên nhân thật
    if (day < 300) return;
    const last = W.chronicle.filter((c) => c.w >= BIG).reduce((m, c) => Math.max(m, c.day), 0);
    if (day - Math.max(last, W.lastPush || 0) < LULL) return;
    W.lastPush = day;
    const cand = W.islands.map((S, i) => ({ S, i, M: BK.Strategy.mind(S) })).filter((x) => x.M && x.S.annexedBy == null && x.S.policy).sort((x, y) => y.M.t.ambition - x.M.t.ambition)[0];
    if (!cand) return;
    // đối thủ: đảo độc lập giàu hơn nhiều nhất, hay đảo đang thù nhất
    const wealth = (S) => BK.Economy.RES.reduce((s, r) => s + BK.Economy.state(S).stock[r], 0) * (1 + S.level);
    let rival = null, rs = -1;
    W.islands.forEach((V, j) => { if (j === cand.i || V.annexedBy != null) return; const sc = W.rel[cand.i][j].grudge * 2 + Math.max(0, wealth(V) / Math.max(1, wealth(cand.S)) - 1); if (sc > rs) { rs = sc; rival = j; } });
    if (rival == null) return;
    const R = W.islands[rival], why = W.rel[cand.i][rival].grudge > 0.3 ? 'mối thù cũ với ' + R.name : R.name + ' giàu hơn, coi thường ' + cand.S.name;
    cand.S.policy.provoked = day + 150; W.rel[cand.i][rival].grudge = Math.min(1, W.rel[cand.i][rival].grudge + 0.25); W.pushes++;
    BK.Diplomacy.say(W, day, 'Người đứng đầu ' + cand.S.name + ' thấy bị sỉ nhục (' + why + '), quyết rửa nhục.', [cand.i, rival]);
    add(W, day, cand.i, 'Thấy bị sỉ nhục bởi ' + R.name, 2, null);
  }
  // các năm và chuyện lớn nhất mỗi năm (cho bảng dev)
  function byYear(W, top) {
    const out = []; for (const c of W.chronicle || []) { const y = Math.floor(c.day / 360); (out[y] || (out[y] = [])).push(c); }
    return out.map((list, y) => ({ year: y + 1, items: (list || []).slice().sort((a, b) => b.w - a.w || a.day - b.day).slice(0, top || 5) })).filter((x) => x.items.length);
  }
  return { init, add, legend, dayTick, byYear, TITLE, LULL };
});
