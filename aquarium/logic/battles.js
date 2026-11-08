/* Bể Kính · logic/battles.js · Kịch bản chiến tranh (design/chien-tranh-thinh-vuong.md mục 2)
 * Mỗi kịch bản có nguyên nhân thật (tính người đứng đầu, đường quân đi, thời, quan hệ) và một cảnh cho phần vẽ. logic/war.js
 * gọi vào ở từng chặng của trận:
 *   hải chiến        (sắp tới, đi thuyền, từ thời 3) đảo bị đánh có lính và người đứng đầu hiếu chiến, đa nghi thì ra chặn ngoài
 *                    biển: hai đội thuyền đánh nhau (w.naval); quân đi đánh mất nhiều quá thì quay về, không đổ bộ được
 *   phục kích        (tới nơi, qua cầu, không bị đánh úp) người đứng đầu bên giữ mưu mô: quân giặc bị bắn trên cầu
 *   đánh đêm         (tới nơi, đánh úp, trời tối) người giữ ra cổng còn ít hơn; lính gác ngủ gật thì cổng hư sẵn một phần
 *   nội gián         (tới nơi) bên đánh mưu mô, bên giữ có người đa nghi, nóng nảy, oán người đứng đầu: người đó mở cổng
 *   đấu tướng        (tới nơi) hai tướng đều hiếu chiến: đấu tay đôi trước trận (w.duel), quân hai bên đứng xem; bên thua mất
 *                    sĩ khí, người thua ngã xuống
 *   vây thành        (tới nơi, tổng tấn công) người đứng đầu bên đánh kiên nhẫn, mưu mô mà cổng quá chắc: dựng trại vây nhiều
 *                    ngày (w.blockade, S.situ.blockade): đảo bị vây gần như không làm ra lương thực, không buôn bán; bên giữ
 *                    hiếu chiến thì có khi mở cổng đánh ra; hết lương thì có thể đầu hàng; hết hạn vây thì công thành
 *   đào ngũ          (ở cổng) sĩ khí thấp: người nhút nhát bỏ chạy về thuyền
 *   cứu viện         (ở cổng) quân đồng minh tới khi cổng sắp vỡ: quân giặc mất sĩ khí
 *   tù binh          (kết thúc, bên đánh thua ở cổng) vài người bị bắt; đảo nhà chuộc bằng hàng, hay ở lại làm dân sau một năm
 *   khải hoàn        (quân về) thắng: diễu hành qua sân, dân reo; thua: người nhà ra cổng đón trong im lặng, bia tưởng niệm
 *   chạy đua vũ trang (mỗi ngày) hai đảo thù nhau cùng giàu: cùng làm vũ khí nhanh hơn; rồi hoặc ký hiệp ước, hoặc nổ chiến tranh
 * Ghi lại số lần mỗi kịch bản (W.battleStats) cho cân chỉnh. Không vẽ gì, chạy được bằng Node.
 * Cần: logic/war.js, logic/siege.js, logic/arms.js, logic/people.js, logic/diplomacy.js, logic/strategy.js. */
(function (root, factory) {
  const BK = root.BK || (root.BK = {});
  BK.Battles = factory(BK);
  if (typeof module === 'object' && module.exports) module.exports = BK.Battles;
})(typeof self !== 'undefined' ? self : globalThis, function (BK) {
  'use strict';
  const NAVAL_LV = 3, NAVAL_DAYS = 0.5, NAVAL_KILL = 0.25;
  const AMBUSH = [0.12, 0.28];
  const DUEL_DAYS = 0.5;
  const BLOCKADE_DAYS = 24, BLOCKADE_FOOD = 0.3;
  const PRISONERS = 3, PRISON_DAYS = 360, RANSOM = 40;
  const TRIUMPH_DAYS = 1;
  const RACE_DAYS = 180;
  const P = () => BK.People, D = () => BK.Diplomacy, G = () => BK.Siege, Wr = () => BK.War;
  const living = (S) => BK.Island.living(S);
  const say = (W, day, text, isles) => D().say(W, day, text, isles);
  const note = (S, day, kind, text, ids) => S.log.push({ day: Math.floor(day), kind, ids: ids || [], text });
  const traitsOf = (S) => { const M = BK.Strategy.mind(S); return M ? M.t : null; };
  const stat = (W, k) => { W.battleStats = W.battleStats || {}; W.battleStats[k] = (W.battleStats[k] || 0) + 1; };
  const night = (day) => BK.Schedule.phase(BK.World.todOf(day)) === 'night';
  // ghi người nổi bật (logic/chronicle.js)
  const legend = (W, day, i, p, kind, text) => { if (BK.Chronicle) BK.Chronicle.legend(W, day, i, p, kind, text); };
  const big = (W, day, i, text, weight, at) => { if (BK.Chronicle) BK.Chronicle.add(W, day, i, text, weight, at); };

  /* ---------- Sắp tới: hải chiến ---------- */
  function beforeArrive(W, day, w, rng, fall) {
    if (w.navalChecked || w.by !== 'boat' || w.surprise || day < w.arrive - NAVAL_DAYS - 0.2) return;
    w.navalChecked = true;
    const A = W.islands[w.a], r = Wr().rulerOf(W, w.b), R = W.islands[r], t = traitsOf(R);
    if (A.level < NAVAL_LV || R.level < NAVAL_LV || !t || (t.aggression < 0.5 && t.paranoia < 0.6) || !rng.chance(0.6)) return;
    const sailors = living(R).filter((p) => !p.away && p.job === 'soldier').slice(0, Math.ceil(w.troops.length * 0.7)); if (sailors.length < 3) return;
    for (const p of sailors) p.away = 'navy';
    w.naval = { from: day, until: day + NAVAL_DAYS, r, crew: sailors.map((p) => ({ i: r, p })) };
    stat(W, 'naval');
    say(W, day, 'Thuyền chiến ' + R.name + ' ra chặn quân ' + A.name + ' giữa biển.', [w.a, r]);
  }
  // mỗi đợt của hải chiến; trả về true nếu bên đánh thua trên biển (logic/war.js cho quân quay về)
  function navalStep(W, day, w, rng, dt, fall) {
    const N = w.naval; if (!N || N.done) return false;
    const A = W.islands[w.a], R = W.islands[N.r];
    const pa = w.troops.length * BK.Arms.kit(A.level).pow * (1 + 0.15 * A.level), pd = N.crew.filter((x) => x.p.alive).length * BK.Arms.kit(R.level).pow * (1 + 0.15 * R.level) * 1.2;
    const ka = Math.min(0.4, dt * NAVAL_KILL * pd / Math.max(1, pa)), kd = Math.min(0.4, dt * NAVAL_KILL * pa / Math.max(1, pd));
    const ch = fall.chance || ((k) => k); // một phát trúng mất máu (logic/war.js hurt)
    for (const x of w.troops) if (x.p.alive && rng.chance(ch(ka))) fall(x, N.r, 'sea');
    for (const x of N.crew) if (x.p.alive && rng.chance(ch(kd))) fall(x, w.a, 'sea');
    w.troops = w.troops.filter((x) => x.p.alive);
    if (day < N.until) return false;
    N.done = true; for (const x of N.crew) if (x.p.alive) x.p.away = null;
    if (w.troops.length < w.n0 * 0.55) { say(W, day, 'Quân ' + A.name + ' bị đánh tan trên biển, không đổ bộ được vào ' + W.islands[w.b].name + '.', [w.a, N.r]); big(W, day, N.r, 'Thắng trận hải chiến trước ' + A.name, 3, 'gate'); return true; }
    say(W, day, 'Quân ' + A.name + ' vượt được vòng vây trên biển, còn ' + w.troops.length + ' người.', [w.a, N.r]);
    return false;
  }

  /* ---------- Tới nơi: phục kích, đánh đêm, nội gián, đấu tướng, vây thành ---------- */
  function onArrive(W, day, w, rng, fall) {
    const A = W.islands[w.a], B = W.islands[w.b], r = Wr().rulerOf(W, w.b), tb = traitsOf(W.islands[r]), ta = traitsOf(A);
    // phục kích trên cầu
    if (w.by === 'bridge' && !w.surprise && tb && tb.cunning > 0.6 && rng.chance(0.6)) {
      const k = rng.range(AMBUSH[0], AMBUSH[1]); let n = 0;
      for (const x of w.troops) if (x.p.alive && rng.chance(fall.chance ? fall.chance(k) : k) && fall(x, w.b, w.gate)) n++;
      w.troops = w.troops.filter((x) => x.p.alive); w.morale = Math.max(0, w.morale - 0.2); w.ambush = n; stat(W, 'ambush');
      say(W, day, B.name + ' phục kích quân ' + A.name + ' trên cầu: ' + n + ' người ngã.', [w.a, w.b]);
    }
    // đánh đêm
    if (w.surprise && night(day)) {
      w.night = true; stat(W, 'night');
      const dozing = living(B).filter((p) => p.job === 'soldier' && P().traits(p).meekness > 0.62).length;
      if (dozing) G().hit(B, w.gate, 0.15 * Math.min(3, dozing));
      say(W, day, 'Quân ' + A.name + ' cầm đuốc đánh đêm vào ' + B.name + (dozing ? ', lính gác đêm ngủ gật' : '') + '.', [w.a, w.b]);
    }
    // nội gián mở cổng
    if (ta && ta.cunning > 0.55 && (B.discontent || 0) + (B.unrest || 0) > 0.15 && rng.chance(0.5 * ta.cunning)) {
      const tr = living(B).find((p) => !p.away && !p.role && P().ageOf(p, day) >= 18 && P().traits(p).paranoia > 0.65 && P().traits(p).aggression > 0.5);
      if (tr) {
        w.traitor = tr.id; w.forceGate = true; G().hit(B, w.gate, 1); stat(W, 'traitor');
        say(W, day, P().fullName(tr) + ' lén mở cổng ' + B.name + ' cho quân ' + A.name + '.', [w.a, w.b]);
        legend(W, day, w.b, tr, 'traitor', 'mở cổng cho quân ' + A.name);
      }
    }
    // đấu tướng
    const gA = w.gen != null ? A.people.get(w.gen) : null;
    const gB = ['general1', 'general2'].map((k) => B.seats[k]).filter((id) => id != null).map((id) => B.people.get(id)).find((p) => p && p.alive && !p.away);
    if (gA && gA.alive && gB && P().traits(gA).aggression > 0.6 && P().traits(gB).aggression > 0.6 && rng.chance(0.7)) {
      w.duel = { a: gA.id, b: gB.id, until: day + DUEL_DAYS }; stat(W, 'duel');
      say(W, day, 'Tướng ' + P().fullName(gA) + ' (' + A.name + ') và tướng ' + P().fullName(gB) + ' (' + B.name + ') ra đấu tay đôi trước cổng.', [w.a, w.b]);
    }
    // vây thành cắt lương
    if (w.kind === 'conquer' && ta && ta.cunning > 0.55 && ta.aggression < 0.6 && !w.forceGate) {
      const ratio = Wr().offense(W, w.a, day) / Math.max(0.5, Wr().defense(W, w.b, w.a));
      if (ratio < 1.3 && rng.chance(0.7)) {
        w.blockade = { since: day, until: day + BLOCKADE_DAYS }; B.situ.blockade = w.blockade.until; stat(W, 'blockade');
        say(W, day, 'Quân ' + A.name + ' dựng trại vây ' + B.name + ', cắt đường lương thực.', [w.a, w.b]);
      }
    }
  }

  /* ---------- Ở cổng: đấu tướng, vây thành, đào ngũ, cứu viện ---------- */
  // trả về 'hold' nếu đợt này chưa áp sát (đang đấu tướng, đang vây), 'surrender' nếu bên bị vây đầu hàng, null thì đánh như thường
  function gateStep(W, day, w, rng, dt, fall, def) {
    const A = W.islands[w.a], B = W.islands[w.b];
    // đấu tướng: hai quân đứng xem tới khi xong
    if (w.duel && !w.duel.done) {
      if (day < w.duel.until) return 'hold';
      w.duel.done = true;
      const a = A.people.get(w.duel.a), b = B.people.get(w.duel.b); if (!a || !b || !a.alive || !b.alive) return null;
      const sa = (0.7 + 0.6 * P().traits(a).aggression) * (1 + 0.15 * A.level) * rng.range(0.6, 1.4), sb = (0.7 + 0.6 * P().traits(b).aggression) * (1 + 0.15 * B.level) * rng.range(0.6, 1.4);
      const [win, lose, wi, li] = sa >= sb ? [a, b, w.a, w.b] : [b, a, w.b, w.a];
      const lx = w.troops.find((x) => x.p === lose) || { i: li, p: lose }; (fall.kill || fall)(lx, wi, w.gate);
      w.morale = Math.max(0, Math.min(1.2, w.morale + (wi === w.a ? 0.3 : -0.3)));
      say(W, day, 'Tướng ' + P().fullName(win) + ' thắng trận đấu tay đôi, tướng ' + P().fullName(lose) + ' ngã xuống.', [w.a, w.b]);
      legend(W, day, wi, win, 'hero', 'thắng trận đấu tướng trước cổng ' + B.name);
      return null;
    }
    // vây thành: chưa áp sát; bên giữ hiếu chiến có khi đánh ra; hết lương thì có khi đầu hàng
    if (w.blockade && !w.blockade.done) {
      B.situ.blockade = w.blockade.until;
      if (day >= w.blockade.until) { w.blockade.done = true; B.situ.blockade = 0; say(W, day, 'Hết kiên nhẫn, quân ' + A.name + ' công thành ' + B.name + '.', [w.a, w.b]); return null; }
      if (Math.floor(day) !== w.blockade.checked) {
        w.blockade.checked = Math.floor(day);
        const tb = traitsOf(B);
        if (tb && tb.aggression > 0.6 && rng.chance(0.15)) { w.blockade.sortie = day + 0.3; say(W, day, B.name + ' mở cổng đánh ra phá vòng vây.', [w.a, w.b]); }
        if (BK.Economy.state(B).hunger && tb && rng.chance(0.08 + 0.2 * tb.fear + 0.1 * tb.meekness)) { stat(W, 'starved'); w.blockade.done = true; B.situ.blockade = 0; return 'surrender'; }
      }
      return w.blockade.sortie > day ? null : 'hold';
    }
    // đào ngũ: sĩ khí thấp, người nhút nhát bỏ chạy
    if (w.morale < 0.5) {
      const run = w.troops.filter((x) => x.p.alive && x.p.id !== w.gen && P().traits(x.p).fear > 0.6 && rng.chance(dt * 0.5));
      if (run.length) {
        for (const x of run) x.p.away = null; // chạy về thuyền, về nhà
        w.troops = w.troops.filter((x) => !run.includes(x)); w.deserted = (w.deserted || 0) + run.length;
        if (!w.desertSaid) { w.desertSaid = true; stat(W, 'desert'); say(W, day, 'Quân ' + A.name + ' nản, ' + run.length + ' người bỏ chạy về thuyền.', [w.a, w.b]); }
      }
    }
    // cứu viện phút chót: quân đồng minh vừa tới mà cổng sắp vỡ
    for (const h of w.helpers) if (!h.told && h.arrive <= day) {
      h.told = true;
      const dp = def.filter((x) => x.p.alive).length, ap = w.troops.length;
      if (dp < ap * 0.8) { w.morale = Math.max(0, w.morale - 0.25); stat(W, 'rescue'); say(W, day, 'Quân ' + W.islands[h.c].name + ' tới cứu viện ' + B.name + ' đúng lúc cổng sắp vỡ.', [h.c, w.b, w.a]); big(W, day, w.b, 'Được ' + W.islands[h.c].name + ' cứu viện phút chót', 3, w.gate); }
    }
    return null;
  }

  /* ---------- Kết thúc trận: tù binh ---------- */
  function onRepelled(W, day, w, rng) {
    const B = W.islands[w.b], A = W.islands[w.a];
    if (!w.troops.length || (w.blockade && !w.blockade.done)) return;
    const n = Math.min(PRISONERS, Math.floor(w.troops.length * 0.25)); if (n < 1) return;
    const caught = w.troops.filter((x) => x.p.id !== w.gen).slice(-n);
    for (const x of caught) x.p.away = 'prisoner';
    w.troops = w.troops.filter((x) => !caught.includes(x));
    (B.prisoners || (B.prisoners = [])).push(...caught.map((x) => ({ i: x.i, pid: x.p.id, since: day })));
    stat(W, 'prisoners');
    say(W, day, B.name + ' bắt ' + caught.length + ' tù binh ' + A.name + '.', [w.a, w.b]);
    // anh hùng giữ cổng: người giữ còn sống đánh hăng nhất
    const hero = living(B).filter((p) => !p.away && (p.job === 'soldier' || p.job === 'gatekeeper' || p.job === 'sideguard')).sort((x, y) => P().traits(y).aggression - P().traits(x).aggression)[0];
    if (hero && w.n0 >= 6) legend(W, day, w.b, hero, 'hero', 'giữ được cổng trước quân ' + A.name);
  }
  // quân về tới nhà: khải hoàn hay đón trong im lặng
  function onHome(W, day, w) {
    const A = W.islands[w.a], ids = w.troops.filter((x) => x.i === w.a && x.p.alive).map((x) => x.p.id); if (!ids.length) return;
    A.situ.homecoming = { war: w.id, won: !!w.won, until: day + TRIUMPH_DAYS, troops: ids };
    // kẻ mở cổng theo quân về đảo này
    if (w.traitor != null && BK.Ecology) { const tp = W.islands[w.b].people.get(w.traitor); if (tp && tp.alive && !tp.away) BK.Ecology.settle(W, day, w.b, w.a, [tp.id], 'mở cổng cho giặc rồi theo quân ' + A.name + ' về'); }
    A.situChanged = true; stat(W, w.won ? 'triumph' : 'mourning');
    if (!w.won && w.n0 - w.troops.length >= 3) { (A.graves || (A.graves = [])).push({ id: -w.id, day: Math.floor(day), memorial: true }); note(A, day, 'war', 'Dựng bia tưởng niệm những người ngã xuống trong trận với ' + W.islands[w.b].name + '.'); }
  }

  /* ---------- Mỗi ngày: tù binh, chạy đua vũ trang ---------- */
  function dayTick(W, day, rng) {
    W.islands.forEach((B, b) => {
      if (!B.prisoners || !B.prisoners.length) return;
      B.prisoners = B.prisoners.filter((q) => {
        const H = W.islands[q.i], p = H.people.get(q.pid); if (!p || !p.alive) return false;
        // chuộc: đảo nhà còn đủ ăn thì có khi trả hàng chuộc về
        const st = BK.Economy.state(H).stock;
        if (!Wr().atWar(W, q.i) && st.food > RANSOM * 4 && rng.chance(0.03)) { st.food -= RANSOM; BK.Economy.state(B).stock.food += RANSOM; p.away = null; stat(W, 'ransom'); say(W, day, H.name + ' chuộc ' + P().fullName(p) + ' về từ ' + B.name + '.', [q.i, b]); return false; }
        // ở lâu thì ở lại làm dân
        if (day - q.since > PRISON_DAYS && BK.Ecology) { BK.Ecology.settle(W, day, q.i, b, [q.pid], 'tù binh ở lại làm dân ' + B.name); stat(W, 'stayed'); return false; }
        return true;
      });
    });
    // chạy đua vũ trang: hai đảo độc lập thù nhau, cùng từ thời 4, cùng giàu
    W.race = W.race || {};
    for (let a = 0; a < W.islands.length; a++) for (let b = a + 1; b < W.islands.length; b++) {
      const A = W.islands[a], B = W.islands[b], key = a + '-' + b;
      if (A.annexedBy != null || B.annexedBy != null || A.level < 4 || B.level < 4) continue;
      const R = W.race[key];
      if (R && R.until > day) continue;
      if (R && !R.ended) {
        R.ended = true; const ta = traitsOf(A), tb = traitsOf(B);
        if (ta && tb && ta.intellect + tb.intellect > 1.2 && rng.chance(0.5)) { D().sign(W, day, a, b, 'pact', 360); say(W, day, A.name + ' và ' + B.name + ' dừng chạy đua vũ trang, ký hiệp ước.', [a, b]); }
        else { for (const S of [A, B]) if (S.policy) S.policy.provoked = day + 120; say(W, day, 'Cuộc chạy đua vũ trang giữa ' + A.name + ' và ' + B.name + ' làm hai bên càng muốn đánh nhau.', [a, b]); }
        continue;
      }
      if (W.rel[a][b].grudge > 0.4 && W.rel[b][a].grudge > 0.4 && rng.chance(0.01)) {
        W.race[key] = { since: day, until: day + RACE_DAYS }; stat(W, 'race');
        say(W, day, A.name + ' và ' + B.name + ' chạy đua vũ trang.', [a, b]); big(W, day, a, 'Chạy đua vũ trang với ' + B.name, 2, null);
      }
    }
  }
  // vai trong cảnh quân về (logic/brain.js hỏi sau logic/ecology.js): thắng thì quân diễu hành qua sân, dân ra mừng; thua thì quân
  // lặng lẽ ở cổng, người nhà ra đón trong im lặng
  function roleOf(S, p, d, ph) {
    const H = S.situ.homecoming; if (!H || H.until <= S.day || ph === 'night') return null;
    const short = { until: Math.min(H.until, S.day + 0.25), phase: ph };
    if (H.troops.includes(p.id)) return d('work', Object.assign(H.won ? { verb: 'parade', place: 'square', reason: 'khải hoàn, diễu hành qua sân' } : { verb: 'mourn', place: 'gate', reason: 'thua trận trở về' }, short));
    const kin = H.troops.some((id) => { const q = S.people.get(id); return q && (q.spouse === p.id || q.parents.includes(p.id) || q.children.includes(p.id)); });
    if (H.won && !p.role && !p.away && (kin || p.id % 3 === 0) && BK.People.ageOf(p, S.day) >= 6) return d('work', Object.assign({ verb: 'celebrate', place: 'square', reason: 'ra sân mừng quân thắng trận về' }, short));
    if (!H.won && kin) return d('work', Object.assign({ verb: 'mourn', place: 'gate', reason: 'ra cổng đón người nhà thua trận về, lặng im' }, short));
    return null;
  }
  // đảo i đang chạy đua vũ trang (logic/missiles.js làm tên lửa nhanh hơn)
  const racing = (W, i, day) => Object.entries(W.race || {}).some(([k, R]) => R.until > day && k.split('-').map(Number).includes(i));
  return { beforeArrive, navalStep, onArrive, gateStep, onRepelled, onHome, dayTick, roleOf, racing, BLOCKADE_FOOD };
});
