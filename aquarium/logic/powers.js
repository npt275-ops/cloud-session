/* Bể Kính · logic/powers.js · Quyền năng có giá của người ngoài bể (design/ke-hoach-khac-phuc.md mục 8)
 * Phần logic cho vòng chơi (giao diện làm sau). Mỗi lần can thiệp tốn "niềm tin" (W.faith): dân các đảo dâng lên mỗi ngày,
 * người sùng đạo dâng nhiều hơn; đảo vừa được ban ơn thì tin hơn, đảo vừa bị trừng phạt thì sợ mà dâng ít đi một thời gian.
 *   rain       mưa: dứt hạn hán đang có, ruộng có nước (thêm lương thực)
 *   bless      ban phúc mùa màng: BLESS_DAYS ngày làm ra nhiều hơn (BLESS_BONUS)
 *   miracle    phép lạ: người bị thương lành hẳn, dân bớt bất bình, bớt bất mãn
 *   lightning  sấm sét: đảo đang bị đánh thì đánh vào quân giặc trong đảo; không thì đánh vào nhà chính (dân sợ, bất bình)
 *   plague     dịch bệnh: một trận dịch trên đảo (logic/climate.js PLAGUE)
 * cast(W, loại, đảo, ngày) → { ok, why, cost }. Không vẽ gì, chạy được bằng Node.
 * Cần: logic/climate.js, logic/economy.js, logic/war.js, logic/siege.js, logic/people.js. */
(function (root, factory) {
  const BK = root.BK || (root.BK = {});
  BK.Powers = factory(BK);
  if (typeof module === 'object' && module.exports) module.exports = BK.Powers;
})(typeof self !== 'undefined' ? self : globalThis, function (BK) {
  'use strict';
  const COST = { rain: 30, bless: 45, miracle: 60, lightning: 40, plague: 50 };
  const NAME = { rain: 'Mưa', bless: 'Ban phúc mùa màng', miracle: 'Phép lạ', lightning: 'Sấm sét', plague: 'Dịch bệnh' };
  const KIND = { rain: 'grace', bless: 'grace', miracle: 'grace', lightning: 'wrath', plague: 'wrath' };
  const FAITH_MAX = 150;        // niềm tin tích tối đa
  const FAITH_RATE = 0.02;      // mỗi người lớn dâng chừng này mỗi ngày; người sùng đạo (piety) dâng gấp đôi
  const AWE_DAYS = 90;          // ban ơn: đảo đó dâng nhiều hơn (AWE_UP) chừng này ngày; trừng phạt: dâng ít đi (AWE_DOWN)
  const AWE_UP = 1.5, AWE_DOWN = 0.5;
  const BLESS_DAYS = 60, BLESS_BONUS = 1.25;
  const RAIN_FOOD = 10;         // mưa: thêm lương thực bằng chừng này ngày ăn của đảo
  const STRIKE = 3;             // sấm sét: số quân giặc bị đánh ngã
  const PLAGUE_DAYS = 20;
  const P = () => BK.People, living = (S) => BK.Island.living(S);
  const say = (W, day, text, isles) => (BK.Diplomacy ? BK.Diplomacy.say(W, day, text, isles) : W.log && W.log.push({ day: Math.floor(day), text, isles }));
  const note = (S, day, text) => S.log.push({ day: Math.floor(day), kind: 'power', ids: [], text });

  function init(W) { if (W.faith == null) W.faith = 0; W.powerLog = W.powerLog || []; }
  // mỗi ngày: dân các đảo dâng niềm tin
  function dayTick(W, day) {
    init(W);
    let gain = 0;
    for (const S of W.islands) {
      const k = S.awe && S.awe.until > day ? S.awe.k : 1;
      for (const p of living(S)) if (P().ageOf(p, day) >= BK.Rules.ADULT_AGE) gain += FAITH_RATE * (1 + P().traits(p).piety) * k;
    }
    W.faith = Math.min(FAITH_MAX, W.faith + gain);
  }
  // làm ra nhiều hơn khi đang được ban phúc (logic/economy.js nhân vào sản lượng)
  const output = (S, day) => (S.blessUntil > (day != null ? day : S.day) ? BLESS_BONUS : 1);
  const can = (W, kind) => COST[kind] != null && (W.faith || 0) >= COST[kind];

  function cast(W, kind, i, day) {
    init(W);
    const S = W.islands[i];
    if (!S || COST[kind] == null) return { ok: false, why: 'không có quyền năng này' };
    if (!living(S).length) return { ok: false, why: 'đảo không còn ai' };
    if (W.faith < COST[kind]) return { ok: false, why: 'chưa đủ niềm tin (' + Math.floor(W.faith) + '/' + COST[kind] + ')', cost: COST[kind] };
    const E = BK.Economy, st = E.state(S);
    let text;
    if (kind === 'rain') {
      const dr = BK.Climate.active(S, day).filter((e) => e.key === 'drought');
      for (const e of dr) e.until = day; if (S.situ.drought > day) S.situ.drought = day;
      st.stock.food = Math.min(E.CAP(S.level, 'food'), st.stock.food + RAIN_FOOD * Math.max(1, st.eaten || 1));
      text = 'Mưa xuống ' + S.name + (dr.length ? ', hạn hán dứt' : '') + ', ruộng có nước.';
    } else if (kind === 'bless') {
      S.blessUntil = day + BLESS_DAYS; text = S.name + ' được ban phúc: mùa màng bội thu.';
    } else if (kind === 'miracle') {
      let healed = 0; for (const p of living(S)) if (p.hp != null && p.hp < 100) { p.hp = 100; healed++; }
      S.unrest = Math.max(0, (S.unrest || 0) - 0.3); S.discontent = Math.max(0, (S.discontent || 0) - 0.3);
      text = 'Phép lạ ở ' + S.name + (healed ? ': ' + healed + ' người bị thương lành hẳn' : '') + ', dân yên lòng.';
    } else if (kind === 'lightning') {
      const w = BK.War && W.wars.find((x) => x.kind !== 'revolt' && x.b === i && (x.stage === 'gate' || x.stage === 'inside' || x.stage === 'loot'));
      if (w && w.troops.length) {
        const hit = w.troops.filter((x) => x.p.alive).slice(0, STRIKE);
        for (const x of hit) { x.p.alive = false; x.p.died = day; x.p.cause = 'sấm sét'; W.islands[x.i].deaths = (W.islands[x.i].deaths || 0) + 1; }
        w.troops = w.troops.filter((x) => x.p.alive); w.morale = Math.max(0, w.morale - 0.3);
        text = 'Sấm sét đánh xuống quân ' + W.islands[w.a].name + ' trước ' + S.name + ': ' + hit.length + ' người ngã.';
      } else {
        if (BK.Siege) BK.Siege.hit(S, 'hall', 0.2);
        S.unrest = Math.min(1, (S.unrest || 0) + 0.15);
        text = 'Sấm sét đánh vào nhà chính ' + S.name + ', dân hoảng sợ.';
      }
    } else if (kind === 'plague') {
      if (!BK.Climate.start(S, 'plague', PLAGUE_DAYS, 1)) return { ok: false, why: 'đảo đang có dịch' };
      text = 'Dịch bệnh giáng xuống ' + S.name + '.';
    }
    W.faith -= COST[kind];
    S.awe = { until: day + AWE_DAYS, k: KIND[kind] === 'grace' ? AWE_UP : AWE_DOWN };
    W.powerLog.push({ day: Math.floor(day), kind, isle: i });
    say(W, day, text, [i]); note(S, day, text); S.situChanged = true;
    if (BK.Chronicle) BK.Chronicle.add(W, day, i, NAME[kind] + ' ở ' + S.name, KIND[kind] === 'grace' ? 2 : 3, kind === 'lightning' ? 'hall' : null);
    return { ok: true, cost: COST[kind], text };
  }
  return { COST, NAME, KIND, FAITH_MAX, init, dayTick, output, can, cast };
});
