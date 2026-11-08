/* Bể Kính · logic/prosperity.js · Thịnh vượng và suy tàn thấy được (design/chien-tranh-thinh-vuong.md mục 3)
 *   thời hoàng kim   đảo độc lập đủ ăn lâu (GOLD_FED ngày), kho đầy (trung bình từ GOLD_STOCK phần), yên ổn lâu (không bị đánh
 *                    GOLD_PEACE ngày), dân ít bất bình (hết thời hoàng kim thì GOLD_REST ngày sau mới có lại): lễ hội lớn, làm ra thêm GOLD_BONUS; đảo khác (người đứng đầu tham vọng)
 *                    ghen. Mất các điều kiện ấy một thời gian thì hết thời hoàng kim.
 *   kỳ quan          trong thời hoàng kim, từ thời 4, mỗi thời một kỳ quan: dồn tài nguyên mỗi ngày, dựng dần WONDER_DAYS ngày (chỉ
 *                    trong thời hoàng kim),
 *                    xong thì lễ lớn, cả bể đưa tin. Đảo bị sáp nhập thì kỳ quan thành niềm tự hào của đảo thắng (tin).
 *   phát minh        đảo có nhiều người ham học: thỉnh thoảng một người thành nhà phát minh, đảo gom thêm một phần tài nguyên
 *                    cho thời sau (thứ đang thiếu nhất). Đảo khác có người đứng đầu mưu mô có khi cài gián điệp lấy một nửa.
 *   đầu tiên tới     đảo đầu tiên bước sang một thời: lễ lớn, cả bể đưa tin; người đứng đầu tham vọng ở đảo khác ghen
 *   suy tàn          dân giảm mạnh so với lúc đông nhất (dưới DECLINE phần), đói lâu, hay vừa mất thành: nhà bỏ hoang, chợ vắng
 *                    (phần vẽ: render/buildings3d.js); gượng dậy được (dân hồi, đủ ăn) thì phục hưng, có lễ
 *   tài nguyên chung mỗi cặp đảo kề nhau có một ngư trường hay mỏ chung (W.commons). Cả hai cùng dồn người khai thác thì có khi
 *                    xô xát (thù thêm, có khi thành cớ đánh nhau); hai đảo tin nhau thì chia nhau bằng hiệp ước
 * Không vẽ gì, chạy được bằng Node. Cần: logic/economy.js, logic/diplomacy.js, logic/strategy.js, logic/chronicle.js. */
(function (root, factory) {
  const BK = root.BK || (root.BK = {});
  BK.Prosperity = factory(BK);
  if (typeof module === 'object' && module.exports) module.exports = BK.Prosperity;
})(typeof self !== 'undefined' ? self : globalThis, function (BK) {
  'use strict';
  const GOLD_FED = 90, GOLD_STOCK = 0.65, GOLD_PEACE = 120, GOLD_BONUS = 0.1, GOLD_LOSE = 30, GOLD_REST = 180;
  const WONDER_LV = 4, WONDER_DAYS = 240, WONDER_SPEND = 0.008;
  const INVENT = 0.0004, SPY = 0.3;
  const DECLINE = 0.7, RECOVER = 0.9;
  const COMMON_SHARE = 0.2, COMMON_CLASH = 0.015;
  const E = () => BK.Economy, D = () => BK.Diplomacy, P = () => BK.People;
  const living = (S) => BK.Island.living(S);
  const say = (W, day, text, isles) => D().say(W, day, text, isles);
  const big = (W, day, i, text, w, at) => { if (BK.Chronicle) BK.Chronicle.add(W, day, i, text, w, at); };
  const traitsOf = (S) => { const M = BK.Strategy.mind(S); return M ? M.t : null; };
  const stat = (W, k) => { W.prosStats = W.prosStats || {}; W.prosStats[k] = (W.prosStats[k] || 0) + 1; };
  const fill = (S) => { const st = E().state(S); return ['food', 'wood', 'stone'].reduce((s, r) => s + Math.min(1, st.stock[r] / E().CAP(S.level, r)), 0) / 3; };
  // ganh tị: người đứng đầu tham vọng ở đảo khác thù thêm đảo vừa nổi lên
  const envy = (W, i, k) => W.islands.forEach((V, j) => { const t = j !== i && traitsOf(V); if (t && t.ambition > 0.6) W.rel[j][i].grudge = Math.min(1, W.rel[j][i].grudge + k); });

  function init(W) {
    W.firsts = W.firsts || [];
    // tài nguyên chung giữa hai đảo kề nhau: ngư trường nếu một bên là biển, đồng bằng hay rừng; mỏ nếu một bên là núi, sa mạc
    if (!W.commons) { W.commons = []; for (let a = 0; a < W.islands.length; a++) { const b = (a + 1) % W.islands.length, keys = [W.islands[a].key, W.islands[b].key]; W.commons.push({ a, b, kind: keys.some((k) => k === 'mountain' || k === 'desert') ? 'mine' : 'fish', since: null }); } }
  }
  // phần sản lượng thêm (logic/economy.js)
  const output = (S) => (S.golden ? 1 + GOLD_BONUS : 1);

  function islandDay(W, day, i, rng) {
    const S = W.islands[i], st = E().state(S), pop = living(S).length;
    S.fedDays = st.hunger ? 0 : (S.fedDays || 0) + 1;
    if (S.situ.war > day || S.situ.siege) S.lastWar = day;
    S.peakPop = Math.max(S.peakPop || 0, pop);
    // thời hoàng kim
    const ok = S.annexedBy == null && !(day - (S.goldenEnd || -1e9) < GOLD_REST) && S.fedDays >= GOLD_FED && fill(S) >= GOLD_STOCK && day - (S.lastWar || -1e9) >= GOLD_PEACE && (S.discontent || 0) < 0.25;
    if (ok && !S.golden) {
      S.golden = { since: day }; S.situ.festival = day + 2; S.situChanged = true; stat(W, 'golden'); envy(W, i, 0.05);
      say(W, day, S.name + ' bước vào thời hoàng kim: kho đầy, dân no, yên ổn lâu. Mở hội lớn.', [i]); big(W, day, i, 'Thời hoàng kim', 3, 'square');
    } else if (S.golden) {
      if (ok) S.golden.bad = 0; else S.golden.bad = (S.golden.bad || 0) + 1;
      if (S.golden.bad > GOLD_LOSE) { say(W, day, 'Thời hoàng kim của ' + S.name + ' đã qua.', [i]); big(W, day, i, 'Hết thời hoàng kim', 2, null); S.golden = null; S.goldenEnd = day; }
    }
    // kỳ quan: trong thời hoàng kim, mỗi thời một cái
    S.wonders = S.wonders || [];
    if (S.golden && !S.wonder && S.level >= WONDER_LV && !S.wonders.some((x) => x.era === S.level)) {
      S.wonder = { era: S.level, progress: 0, from: day }; stat(W, 'wonderStart');
      say(W, day, S.name + ' khởi công kỳ quan của thời ' + BK.Eras.of(S.level).name + '.', [i]);
    }
    if (S.wonder) {
      const k = S.golden ? 1 : 0; // hết thời hoàng kim thì dừng, chờ thời hoàng kim sau
      for (const r of ['wood', 'stone', 'luxury']) st.stock[r] = Math.max(0, st.stock[r] * (1 - WONDER_SPEND * k));
      S.wonder.progress = Math.min(1, S.wonder.progress + k / WONDER_DAYS);
      if (S.wonder.progress >= 1) {
        S.wonders.push({ era: S.wonder.era, day: Math.floor(day) }); S.wonder = null; S.situ.festival = day + 2; S.situChanged = true; stat(W, 'wonder'); envy(W, i, 0.06);
        say(W, day, S.name + ' dựng xong kỳ quan, cả bể đưa tin.', [i]); big(W, day, i, 'Dựng xong kỳ quan', 4, 'square');
      }
    }
    // phát minh: theo số người ham học
    const minds = living(S).filter((p) => P().ageOf(p, day) >= 18 && P().traits(p).intellect > 0.72);
    if (S.level < 12 && minds.length && rng.chance(INVENT * Math.min(4, minds.length / 4))) {
      const who = minds[Math.floor(rng.next() * minds.length)], cost = E().nextCost(S);
      if (cost) {
        const r = Object.keys(cost).sort((x, y) => st.stock[x] / cost[x] - st.stock[y] / cost[y])[0], gain = Math.round(cost[r] * 0.25);
        st.stock[r] = Math.min(E().CAP(S.level, r), st.stock[r] + gain); stat(W, 'invent');
        say(W, day, P().fullName(who) + ' (' + S.name + ') phát minh ra cách làm mới, ' + S.name + ' gom thêm ' + gain + ' ' + E().NAME[r].toLowerCase() + '.', [i]);
        if (BK.Chronicle) BK.Chronicle.legend(W, day, i, who, 'inventor', 'phát minh mới cho ' + S.name);
        // gián điệp: đảo khác mưu mô lấy một nửa
        const spy = W.islands.map((V, j) => ({ V, j, t: traitsOf(V) })).filter((x) => x.j !== i && x.t && x.t.cunning > 0.65 && x.V.annexedBy == null && x.V.level <= S.level)[0];
        if (spy && rng.chance(SPY)) { const sv = E().state(spy.V).stock; sv[r] = Math.min(E().CAP(spy.V.level, r), sv[r] + Math.round(gain / 2)); W.rel[i][spy.j].grudge = Math.min(1, W.rel[i][spy.j].grudge + 0.15); stat(W, 'spy'); say(W, day, 'Gián điệp ' + spy.V.name + ' lấy được bí mật phát minh của ' + S.name + '.', [spy.j, i]); }
      }
    }
    // đầu tiên tới thời này
    if (!W.firsts[S.level] && S.level > 1) {
      W.firsts[S.level] = { isle: i, day: Math.floor(day) }; stat(W, 'first');
      if (S.level >= 2) { S.situ.festival = day + 2; S.situChanged = true; envy(W, i, 0.08); say(W, day, S.name + ' là đảo đầu tiên bước sang thời ' + BK.Eras.of(S.level).name + '.', [i]); big(W, day, i, 'Đầu tiên tới thời ' + BK.Eras.of(S.level).name, 3, 'square'); }
    }
    // thiên tai, dịch bệnh vừa nổ ra (logic/climate.js): ghi vào biên niên (dịch là chuyện lớn)
    const cc = (S.climate && S.climate.count) || {}, seen = S.climSeen || (S.climSeen = {});
    for (const k in cc) if (cc[k] > (seen[k] || 0)) { seen[k] = cc[k]; const e = BK.Climate.active(S, day).find((x) => x.key === k); if (e) big(W, day, i, e.name + ' ở ' + S.name, k === 'plague' ? 3 : 2, k === 'plague' ? 'home' : null); }
    // biểu tình vừa nổ ra (logic/dramas.js)
    const riot = BK.Dramas && BK.Dramas.active(S).find((A) => A.key === 'riot');
    if (riot && S.riotSeen !== riot) { S.riotSeen = riot; big(W, day, i, 'Biểu tình trước nhà chính ' + S.name, 2, 'hall'); }
    // suy tàn, phục hưng
    const falling = S.peakPop >= 30 && (pop < S.peakPop * DECLINE || (!st.hunger ? false : (S.hungryLong = (S.hungryLong || 0) + 1) > 30));
    if (!st.hunger) S.hungryLong = 0;
    if (falling && !S.decline) { S.decline = { since: day }; stat(W, 'decline'); say(W, day, S.name + ' suy tàn: dân bỏ đi, nhà bỏ hoang, chợ vắng.', [i]); big(W, day, i, 'Suy tàn', 3, 'market'); }
    else if (S.decline && pop >= S.peakPop * RECOVER && S.fedDays > 60) { S.decline = null; S.situ.festival = day + 2; S.situChanged = true; stat(W, 'revival'); say(W, day, S.name + ' hồi sinh sau những năm suy tàn.', [i]); big(W, day, i, 'Phục hưng', 3, 'square'); }
    if (S.decline && pop >= S.peakPop * RECOVER) S.peakPop = pop; // đỉnh cũ không còn ý nghĩa sau khi đã hồi
  }

  // tài nguyên chung: hai đảo kề nhau cùng dồn người khai thác
  function commonsDay(W, day, rng) {
    for (const c of W.commons) {
      const A = W.islands[c.a], B = W.islands[c.b], res = c.kind === 'fish' ? ['food'] : ['stone', 'metal'];
      const share = (S) => living(S).filter((p) => p.job === 'worker' && res.includes(p.res)).length / Math.max(1, living(S).length);
      c.active = share(A) >= COMMON_SHARE && share(B) >= COMMON_SHARE;
      if (!c.active || (c.until && c.until > day)) continue;
      const tr = Math.min(W.rel[c.a][c.b].trust, W.rel[c.b][c.a].trust);
      if (tr > 0.5 && rng.chance(0.02)) { D().sign(W, day, c.a, c.b, 'pact', 360); c.until = day + 360; stat(W, 'shared'); say(W, day, A.name + ' và ' + B.name + ' ký chia ' + (c.kind === 'fish' ? 'ngư trường' : 'mỏ') + ' chung.', [c.a, c.b]); continue; }
      if (rng.chance(COMMON_CLASH)) {
        for (const [x, y] of [[c.a, c.b], [c.b, c.a]]) W.rel[x][y].grudge = Math.min(1, W.rel[x][y].grudge + 0.12);
        c.clashAt = day; stat(W, 'commonClash');
        say(W, day, 'Người ' + A.name + ' và ' + B.name + ' xô xát ở ' + (c.kind === 'fish' ? 'ngư trường' : 'mỏ') + ' chung.', [c.a, c.b]); big(W, day, c.a, 'Xô xát ở ' + (c.kind === 'fish' ? 'ngư trường' : 'mỏ') + ' chung với ' + B.name, 2, null);
      }
    }
  }
  function dayTick(W, day, rng) { init(W); for (let i = 0; i < W.islands.length; i++) islandDay(W, day, i, rng); commonsDay(W, day, rng); }
  return { init, dayTick, output, fill, GOLD_BONUS };
});
