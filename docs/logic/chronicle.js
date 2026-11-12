/* Bể Kính · logic/chronicle.js · Biên niên, nhân vật nổi bật, nhịp kịch tính (design/chien-tranh-thinh-vuong.md mục 4)
 *   biên niên      W.chronicle: chuyện lớn của cả bể, mỗi chuyện có đảo, ngày, độ lớn (1..6), chỗ xảy ra (để bay tới). Bảng dev
 *                  "Cuộc đua" (ui/race-dev.js) hiện mỗi năm vài chuyện lớn nhất.
 *   nhân vật       W.legends: anh hùng (thắng đấu tướng, giữ cổng), kẻ phản bội (mở cổng), nhà phát minh, người đứng đầu huyền
 *                  thoại (trị vì lâu mà có thời hoàng kim hay chiếm được đảo khác). Người đó mang danh hiệu (p.title, p.legend)
 *                  trong thẻ người.
 *   nhịp kịch tính cả bể không có chuyện lớn (độ lớn từ 3) quá LULL ngày thì đẩy một nguyên nhân thật: người đứng đầu tham
 *                  vọng nhất thấy mình bị coi thường bởi đảo giàu hơn hay đảo mình đang thù (nỗi nhục), nên muốn đánh hơn một
 *                  thời gian (policy.provoked, logic/strategy.js), chặn bắt thuyền buôn đảo kia để rửa nhục; từ năm 6 thì bá
 *                  chủ gửi tối hậu thư (logic/strategy.js ultimatum). Không bốc thăm một sự kiện vô cớ.
 *   năm đầu       chuyện thời đồ đá có nguyên nhân (early): thú dữ, săn thú lớn, tranh bãi săn, lần đầu gặp nhau, lạc rừng.
 * Không vẽ gì, chạy được bằng Node. Cần: logic/strategy.js, logic/economy.js, logic/people.js. */
(function (root, factory) {
  const BK = root.BK || (root.BK = {});
  BK.Chronicle = factory(BK);
  if (typeof module === 'object' && module.exports) module.exports = BK.Chronicle;
})(typeof self !== 'undefined' ? self : globalThis, function (BK) {
  'use strict';
  const LULL = 150,
    BIG = 3,
    MAX = 400;
  const SEIZE = 0.15; // rửa nhục: chặn thuyền buôn, lấy chừng này phần thứ đảo kia có nhiều nhất
  const TITLE = { hero: 'Anh hùng', traitor: 'Kẻ phản bội', inventor: 'Nhà phát minh', ruler: 'Người đứng đầu huyền thoại' };
  function init(W) {
    W.chronicle = W.chronicle || [];
    W.legends = W.legends || [];
    W.pushes = 0;
  }
  function add(W, day, i, text, weight, at) {
    if (!W.chronicle) init(W);
    W.chronicle.push({ day: Math.floor(day), isle: i, text, w: weight || 1, at: at || null });
    if (W.chronicle.length > MAX) W.chronicle.splice(0, W.chronicle.length - MAX);
  }
  function legend(W, day, i, p, kind, text) {
    if (!W.legends) init(W);
    if (!p) return;
    p.title = TITLE[kind] || kind;
    p.legend = (p.legend ? p.legend + '; ' : '') + text;
    W.legends.push({ day: Math.floor(day), isle: i, id: p.id, name: BK.People.fullName(p), kind, text });
    add(W, day, i, TITLE[kind] + ' ' + BK.People.fullName(p) + ': ' + text, kind === 'traitor' ? 3 : 2, null);
  }
  // mỗi ngày: người đứng đầu huyền thoại; nhịp kịch tính
  function dayTick(W, day, rng) {
    if (!W.chronicle) init(W);
    // người đứng đầu trị vì lâu (từ 3 năm) mà đảo có thời hoàng kim hay đang cai quản đảo khác
    W.islands.forEach((S, i) => {
      const k = S.seats.king != null ? S.people.get(S.seats.king) : null;
      if (!k || k.title || k.governor != null) return;
      k.reignFrom = k.reignFrom || day;
      if (day - k.reignFrom > 3 * 360 && (S.golden || W.islands.some((V) => V.annexedBy === i)))
        legend(
          W,
          day,
          i,
          k,
          'ruler',
          'trị vì ' +
            Math.floor((day - k.reignFrom) / 360) +
            ' năm, ' +
            (S.golden ? 'đưa ' + S.name + ' vào thời hoàng kim' : 'mở rộng ' + S.name),
        );
    });
    // năm đầu (design/ke-hoach-khac-phuc.md mục 4.1): chưa ai đánh ai (logic/strategy.js FIRST_WAR) nên đẩy chuyện thời đồ đá
    if (day < 300) {
      if (day >= EARLY_FROM) early(W, day, rng);
      return;
    }
    // nhịp kịch tính: cả bể yên quá lâu thì đẩy một nguyên nhân thật
    const last = W.chronicle.filter((c) => c.w >= BIG).reduce((m, c) => Math.max(m, c.day), 0);
    if (day - Math.max(last, W.lastPush || 0) < LULL) return;
    W.lastPush = day;
    // từ năm 6 đã có bá chủ: bá chủ gửi tối hậu thư cho đảo yếu hơn (logic/strategy.js ultimatum), thay cho nỗi nhục
    if (BK.Strategy.ultimatum && BK.Strategy.ultimatum(W, day, rng)) {
      W.pushes++;
      return;
    }
    const cand = W.islands
      .map((S, i) => ({ S, i, M: BK.Strategy.mind(S) }))
      .filter((x) => x.M && x.S.annexedBy == null && x.S.policy)
      .sort((x, y) => y.M.t.ambition - x.M.t.ambition)[0];
    if (!cand) return;
    // đối thủ: đảo độc lập giàu hơn nhiều nhất, hay đảo đang thù nhất
    const wealth = (S) => BK.Economy.RES.reduce((s, r) => s + BK.Economy.state(S).stock[r], 0) * (1 + S.level);
    let rival = null,
      rs = -1;
    W.islands.forEach((V, j) => {
      if (j === cand.i || V.annexedBy != null) return;
      const sc = W.rel[cand.i][j].grudge * 2 + Math.max(0, wealth(V) / Math.max(1, wealth(cand.S)) - 1);
      if (sc > rs) {
        rs = sc;
        rival = j;
      }
    });
    if (rival == null) return;
    const R = W.islands[rival],
      why = W.rel[cand.i][rival].grudge > 0.3 ? 'mối thù cũ với ' + R.name : R.name + ' giàu hơn, coi thường ' + cand.S.name;
    cand.S.policy.provoked = day + 150;
    W.rel[cand.i][rival].grudge = Math.min(1, W.rel[cand.i][rival].grudge + 0.25);
    W.pushes++;
    BK.Diplomacy.say(W, day, 'Người đứng đầu ' + cand.S.name + ' thấy bị sỉ nhục (' + why + '), quyết rửa nhục.', [cand.i, rival]);
    // rửa nhục bằng việc thật: chặn bắt thuyền buôn của đảo kia, lấy hàng (thứ đảo kia có nhiều nhất), hai bên thù nhau thêm
    const sr = BK.Economy.state(R).stock,
      sc = BK.Economy.state(cand.S).stock,
      res = BK.Economy.RES.slice().sort((x, y) => sr[y] - sr[x])[0];
    const take = Math.floor(Math.min(sr[res] * SEIZE, BK.Economy.CAP(cand.S.level, res) - sc[res]));
    if (take > 0) {
      sr[res] -= take;
      sc[res] += take;
    }
    W.rel[rival][cand.i].grudge = Math.min(1, W.rel[rival][cand.i].grudge + 0.2);
    BK.Diplomacy.say(
      W,
      day,
      'Thuyền ' +
        cand.S.name +
        ' chặn bắt thuyền buôn ' +
        R.name +
        (take > 0 ? ', cướp ' + take + ' ' + BK.Economy.NAME[res].toLowerCase() : '') +
        '.',
      [cand.i, rival],
    );
    add(W, day, cand.i, cand.S.name + ' chặn bắt thuyền buôn ' + R.name + ' để rửa nhục', 3, 'gate');
    // nỗi nhục làm người đứng đầu xét lại chuyện đánh ngay (quân đủ thì khởi binh, logic/strategy.js)
    BK.Strategy.islandTick(W, cand.i, day, rng);
  }
  // chuyện năm đầu, đúng thời đồ đá, có nguyên nhân thật trên đảo: cả bể yên quá EARLY_LULL ngày thì một đảo gặp một chuyện.
  //   thú dữ vào làng   đảo có ít lính (lính lo canh): thú vồ người ngoài đồng, người bị thương nặng, có khi chết
  //   săn thú lớn       đảo đang thiếu ăn: người gan dạ nhất dẫn đi săn, về được thịt (thêm lương thực), có khi bị thương
  //   tranh bãi săn     hai đảo cạnh nhau cùng thiếu ăn: thù nhau thêm (mầm cho trận đánh đầu tiên)
  //   lần đầu gặp nhau  hai đảo chưa từng qua lại: người hướng ngoại chèo thuyền sang, tin cậy (hay ngờ vực) nhau hơn
  //   người lạc rừng    người nhút nhát đi hái lượm lạc trong rừng, cả làng đi tìm (độ lớn 2)
  const EARLY_FROM = 40,
    EARLY_LULL = 110;
  function early(W, day, rng) {
    const last = W.chronicle.filter((c) => c.w >= BIG).reduce((m, c) => Math.max(m, c.day), 0);
    if (day - Math.max(last, W.lastEarly || 0) < EARLY_LULL) return;
    W.lastEarly = day;
    const P = BK.People,
      E = BK.Economy,
      D = BK.Diplomacy,
      N = W.islands.length,
      i = rng.int(0, N - 1),
      S = W.islands[i];
    const adults = BK.Island.living(S).filter((p) => !p.away && S.seats.king !== p.id && P.ageOf(p, day) >= BK.Rules.ADULT_AGE); // năm đầu: người lớn đều ngồi hội đồng
    if (!adults.length) return;
    const st = E.state(S),
      short = st.hunger || st.stock.food < st.eaten * 40,
      j = (i + (rng.chance(0.5) ? 1 : N - 1)) % N,
      V = W.islands[j];
    const soldiers = adults.filter((p) => p.job === 'soldier').length,
      pick = (f) => adults.slice().sort((a, b) => f(P.traits(b)) - f(P.traits(a)))[0];
    const met = W.met || (W.met = {}),
      pair = Math.min(i, j) + '-' + Math.max(i, j);
    const note = (V2, text) => V2.log.push({ day: Math.floor(day), kind: 'early', ids: [], text });
    if (soldiers < 3 && rng.chance(0.6)) {
      const p = pick((t) => -t.fear + rng.next()),
        hurt = rng.range(30, 85);
      p.hp = (p.hp == null ? 100 : p.hp) - hurt;
      p.hurtAt = day;
      const dead = p.hp <= 0;
      if (dead) {
        p.alive = false;
        p.died = day;
        p.cause = 'thú dữ';
        S.deaths = (S.deaths || 0) + 1;
      }
      D.say(
        W,
        day,
        'Thú dữ vào làng ' + S.name + ' (ít lính canh), vồ ' + P.fullName(p) + (dead ? ': không qua khỏi.' : ': bị thương nặng.'),
        [i],
      );
      note(S, 'Thú dữ vào làng vì ít người canh. ' + P.fullName(p) + (dead ? ' chết.' : ' bị thương.'));
      return add(W, day, i, 'Thú dữ vào làng, ' + P.fullName(p) + (dead ? ' chết' : ' bị thương'), 3, 'gate');
    }
    if (short) {
      const V2 = W.islands[j],
        st2 = E.state(V2),
        short2 = st2.hunger || st2.stock.food < st2.eaten * 40;
      if (short2 && D.alive(W, j)) {
        W.rel[i][j].grudge = Math.min(1, W.rel[i][j].grudge + 0.2);
        W.rel[j][i].grudge = Math.min(1, W.rel[j][i].grudge + 0.2);
        D.say(W, day, 'Thợ săn ' + S.name + ' và ' + V2.name + ' cùng thiếu ăn, tranh nhau một bãi săn, hai bên đánh nhau bằng gậy đá.', [
          i,
          j,
        ]);
        note(S, 'Tranh bãi săn với ' + V2.name + '.');
        note(V2, 'Tranh bãi săn với ' + S.name + '.');
        return add(W, day, i, 'Tranh bãi săn với ' + V2.name, 3, null);
      }
      const p = pick((t) => t.aggression - t.fear),
        meat = Math.round(st.eaten * rng.range(8, 20)),
        hurt = rng.chance(0.4);
      st.stock.food += meat;
      if (hurt) {
        p.hp = (p.hp == null ? 100 : p.hp) - 40;
        p.hurtAt = day;
      }
      D.say(
        W,
        day,
        S.name +
          ' thiếu ăn: ' +
          P.fullName(p) +
          ' dẫn người đi săn thú lớn, mang về ' +
          meat +
          ' phần thịt' +
          (hurt ? ', bị thương' : '') +
          '.',
        [i],
      );
      note(S, 'Đi săn thú lớn vì thiếu ăn, mang về ' + meat + ' phần thịt.');
      return add(W, day, i, P.fullName(p) + ' săn được thú lớn', 3, null);
    }
    if (!met[pair] && D.alive(W, j)) {
      met[pair] = day;
      const p = pick((t) => t.ambition + (1 - t.fear) * 0.5),
        t = P.traits(p),
        K = BK.Strategy.mind(V),
        warm = !K || K.t.paranoia < 0.6;
      if (warm) {
        W.rel[i][j].trust = Math.min(1, W.rel[i][j].trust + 0.15);
        W.rel[j][i].trust = Math.min(1, W.rel[j][i].trust + 0.15);
      } else {
        W.rel[j][i].grudge = Math.min(1, W.rel[j][i].grudge + 0.1);
      }
      D.say(
        W,
        day,
        P.fullName(p) +
          ' của ' +
          S.name +
          ' chèo thuyền độc mộc sang ' +
          V.name +
          ', lần đầu hai đảo gặp nhau' +
          (warm ? ', được tiếp đãi.' : '; người đứng đầu đa nghi đuổi về.'),
        [i, j],
      );
      note(S, 'Lần đầu gặp người ' + V.name + '.');
      note(V, 'Lần đầu gặp người ' + S.name + '.');
      return add(W, day, i, 'Lần đầu gặp ' + V.name + (t.ambition > 0.6 ? ' (người chèo thuyền nhiều tham vọng)' : ''), 3, 'gate');
    }
    const p = pick((t) => t.fear + rng.next() * 0.5);
    D.say(W, day, P.fullName(p) + ' đi hái lượm, lạc trong rừng; cả làng ' + S.name + ' đốt đuốc đi tìm.', [i]);
    note(S, P.fullName(p) + ' lạc trong rừng, cả làng đi tìm.');
    add(W, day, i, P.fullName(p) + ' lạc trong rừng', 2, null);
  }
  // các năm và chuyện lớn nhất mỗi năm (cho bảng dev)
  function byYear(W, top) {
    const out = [];
    for (const c of W.chronicle || []) {
      const y = Math.floor(c.day / 360);
      (out[y] || (out[y] = [])).push(c);
    }
    return out
      .map((list, y) => ({
        year: y + 1,
        items: (list || [])
          .slice()
          .sort((a, b) => b.w - a.w || a.day - b.day)
          .slice(0, top || 5),
      }))
      .filter((x) => x.items.length);
  }
  return { init, add, legend, dayTick, byYear, TITLE, LULL };
});
