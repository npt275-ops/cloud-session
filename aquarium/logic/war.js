/* Bể Kính · logic/war.js · Chiến tranh, sáp nhập, nổi dậy
 * (design/quy-trinh-tong-quat.md mục 7.3) Ở cấp cả bể (W, logic/world.js). Ai đánh ai, lúc nào là do người đứng đầu quyết
 * (logic/strategy.js); tệp này chỉ chạy diễn biến:
 *   gọi quân     lính của đảo (và một nửa lính các đảo mình cai quản), tướng dẫn quân, cộng dân binh: đàn ông khoẻ, máu
 *                chiến đang làm việc khác bị gọi đi (đánh kém lính, LEVY_POWER), đi đánh thì bỏ việc ở nhà.
 *   hành quân    quân là người thật (p.away = mã chiến dịch): rời đảo, đi thuyền hay qua cầu mất travelDays ngày
 *                (logic/diplomacy.js), người ở nhà vẫn làm ăn.
 *   đánh ở cổng  quân đánh vào cổng phụ phía mình tới (lính gác cổng chính và cổng phía kia giữ chốt). Mỗi ngày một đợt:
 *                bên công (lính, tướng dẫn quân) và bên thủ (lính, tướng ở nhà, hai lính gác cổng phụ đó, quân đồng minh tới
 *                giúp, tường thành theo thời). Mỗi người có thể ngã xuống, khả năng tuỳ sức hai bên; có may rủi. Thua đợt thì sĩ
 *                khí bên công rơi; sĩ khí cạn hay mất quá nửa quân thì rút. Bên thủ gần hết người thì cổng vỡ.
 *                Bên thủ đang đói đánh kém (HUNGRY), đang có thiên tai cũng kém đi. Người đứng đầu mưu mô thì đánh bất ngờ:
 *                ngày đầu chỉ một nửa người giữ cổng kịp ra trận.
 *                Đột kích không cần phá cổng: trụ được RAID_DAYS ngày ở cổng là xông vào cướp được một phần kho (theo tương
 *                quan sức) rồi rút.
 *   vào thành    dân phản ứng theo tính cách: người nóng nảy cầm vũ khí giữ nhà, người nhút nhát chạy trốn, người sùng đạo cầu
 *                nguyện (logic/brain.js đọc S.situ.war). Đột kích: cướp kho rồi về. Tổng tấn công: đánh tới nhà chính.
 *   sáp nhập     chiếm được nhà chính thì đảo thua thuộc về đảo thắng (S.annexedBy): kho chuyển sang đảo thắng (lương thực để
 *                lại đủ RESERVE_DAYS ngày cho dân), dân và quân thành dân và quân của đảo thắng nhưng vẫn sống trên đảo cũ; đảo
 *                thắng cử một người trong hội đồng sang làm người cai quản (ghế vua); đảo bị sáp nhập dùng chung thời với đảo
 *                thắng, giữ kiến trúc riêng; mỗi ngày phần dư trong kho nộp về đảo thắng. Một phần quân thắng (GARRISON_SHARE)
 *                ở lại đóng giữ ít nhất GARRISON_DAYS ngày, và tới khi dân yên (bất bình dưới CALM_UNREST) mới về. Đảo thắng mà bị sáp nhập thì các đảo
 *                nó đang cai quản cũng sang tay kẻ thắng mới.
 *   nổi dậy      dân đảo bị sáp nhập mang thù hằn; bất bình (S.unrest) tăng theo thù hằn, tính nóng, đói, nguôi dần khi yên ổn;
 *                sau CALM_DAYS ngày, bất bình đủ cao thì có thể nổi dậy: người nóng nảy (theo mức bất bình, đánh như dân binh)
 *                và một phần lính (theo thù hằn) đánh với quân đóng giữ và phần lính còn trung thành. Thắng thì độc lập lại.
 *                Người cầm đầu cân nhắc trước: yếu hẳn thì chờ thời (lúc đảo cai quản bận đánh nơi khác), trừ khi cùng cực.
 *                Trận nổi dậy kéo dài nhiều ngày như trận thường (W.wars, kind 'revolt').
 *                Người đứng đầu đảo cai quản mà cứng rắn (hiếu chiến, đa nghi) thì thấy dân bất bình là gửi thêm quân đóng giữ.
 *                Đảo bị đánh thì quân đóng giữ cũng ra giữ cổng; đảo sang tay kẻ khác thì quân đóng giữ cũ bỏ về.
 *   cầu hoà      bên thủ đang yếu thế có thể xin hoà, nộp một phần kho; bên công nhận hay không tuỳ tính người đứng đầu.
 *   đồng minh    đảo có liên minh với bên bị đánh có thể gửi quân sang giúp (đi thật, tới nơi mới vào trận).
 *   phản bội     đánh đảo đang có hiệp ước: hiệp ước tan, các đảo khác bớt tin kẻ phản bội, bên bị phản bội thù lâu.
 * Thù hằn (W.rel[b][a].grudge) tăng theo từng người chết trong chiến tranh; người chết có cause 'chiến tranh'.
 * Không vẽ gì, chạy được bằng Node. Cần: logic/diplomacy.js, logic/economy.js, logic/island.js, logic/people.js. */
(function (root, factory) {
  const BK = root.BK || (root.BK = {});
  BK.War = factory(BK);
  if (typeof module === 'object' && module.exports) module.exports = BK.War;
})(typeof self !== 'undefined' ? self : globalThis, function (BK) {
  'use strict';
  // nhịp trận: đánh theo từng giờ (mỗi bước cố định 1/12 ngày của logic/world.js), nên trận kéo dài nhiều ngày, nhìn thấy được
  const KILL = 0.09;            // mỗi ngày đánh: khả năng ngã xuống của một người khi hai bên ngang sức (chia theo độ dài đợt)
  const MORALE_RETREAT = 0.25, LOSS_RETREAT = 0.3;   // sĩ khí dưới mức này, hay còn dưới phần quân này thì rút
  const MORALE_K = 2.5;         // sĩ khí đổi theo chênh lệch phần thiệt hại hai bên mỗi đợt
  const GATE_BREAK = 0.4;       // sức người giữ cổng còn dưới phần này so với quân công thì cổng vỡ
  const INSIDE_DAYS = 5;        // số ngày đánh từ cổng tới nhà chính
  const REBEL_BREAK = 0.3;      // nổi dậy: phe nào còn dưới phần này so với lúc đầu, hay sĩ khí dưới MORALE_RETREAT, thì thua
  const RESERVE_DAYS = 30;      // đảo bị sáp nhập giữ lại chừng này ngày lương thực
  const LOOT_PER = 30;          // mỗi người lính đột kích mang về được chừng này đơn vị
  const GRUDGE_DEATH = 0.06, GRUDGE_ANNEX = 0.9;
  const LEVY_POWER = 0.6, LEVY_AGE = 45; // dân binh: sức so với lính, quá tuổi này không bị gọi
  const HUNGRY = 0.7;           // sức đánh của đảo đang đói
  const RAID_DAYS = 2;
  const GARRISON_SHARE = 0.4, GARRISON_DAYS = 360, CALM_DAYS = 180, CALM_UNREST = 0.4;
  const REVOLT_REST = 180;      // nổi dậy thất bại: chừng này ngày sau dân mới gượng dậy được
  const REVOLT_ODDS = 1.0;      // phe nổi dậy ước sức mình dưới phần này so với phe giữ thì chờ thời
  const GARRISON_MAX = 0.15;    // quân đóng giữ tối đa chừng này phần người lớn của đảo bị sáp nhập (ít nhất 4): nhà cũng cần lính

  const P = () => BK.People, D = () => BK.Diplomacy, E = () => BK.Economy;
  const tech = (lv) => 1 + 0.15 * (lv - 1);
  const wall = (lv) => 1 + 0.025 * lv;                         // tường thành giữ cổng, chắc dần theo thời
  const living = (S) => BK.Island.living(S);
  const say = (W, day, text, isles) => D().say(W, day, text, isles);
  const note = (S, day, kind, text, ids) => S.log.push({ day: Math.floor(day), kind, ids: ids || [], text });

  // W.warStats: số trận theo kiểu (raid, conquer), số lần thắng, thua, cầu hoà (cho kiểm thử và bảng dev)
  function init(W) { W.wars = W.wars || []; W.warCount = 0; W.annexations = 0; W.revolts = 0; W.warStats = { raid: 0, conquer: 0, won: 0, lost: 0, peace: 0, revolt: 0, freed: 0, target: [0, 0, 0, 0, 0, 0] }; }
  // đảo cai quản i (chính nó nếu độc lập)
  const rulerOf = (W, i) => (W.islands[i].annexedBy != null ? W.islands[i].annexedBy : i);
  const vassalsOf = (W, a) => W.islands.map((S, i) => i).filter((i) => W.islands[i].annexedBy === a);
  const atWar = (W, i) => W.wars.find((w) => w.a === i || w.b === i || rulerOf(W, w.b) === i) || null;
  const lvOf = (W) => (i) => W.islands[i].level;

  /* ---------- Sức đánh ---------- */
  // sức một người khi cầm vũ khí: tướng mạnh hơn, hiếu chiến thì hăng, nhút nhát thì kém
  function fighter(p) { const t = P().traits(p); return (p.role === 'general1' || p.role === 'general2' ? 1.5 : 1) * (0.7 + 0.6 * t.aggression - 0.3 * t.fear); }
  const isGuard = (p) => p.job === 'soldier' || p.job === 'gatekeeper' || p.job === 'sideguard' || p.role === 'general1' || p.role === 'general2';
  // người giữ đảo lúc này: lính, lính gác cổng, tướng còn ở nhà; ở một cổng phụ (side 0: trái, 1: phải): trừ lính gác cổng
  // chính và cổng phía kia (giữ chốt)
  const guards = (S) => living(S).filter((p) => !p.away && isGuard(p));
  const gateGuards = (S, side) => guards(S).filter((p) => p.job !== 'gatekeeper' && (p.job !== 'sideguard' || p.postKey === (side ? 'gateRight' : 'gateLeft')));
  // dân binh có thể gọi: đàn ông đủ tuổi, chưa quá LEVY_AGE, máu chiến, đang làm việc thường (không lính, không chốt, không hội đồng)
  const levyable = (S, day) => living(S).filter((p) => !p.away && !p.role && p.sex === 'm' && (p.job === 'worker' || p.job === 'walker') && P().ageOf(p, day) < LEVY_AGE && P().traits(p).aggression > 0.5);
  // quân có thể đem đi đánh: lính ở nhà của đảo a và (một nửa) của các đảo a cai quản, cộng dân binh của đảo a (đánh kém hơn)
  function musterable(W, a, day) {
    const out = [];
    for (const i of [a, ...vassalsOf(W, a)]) {
      const S = W.islands[i], L = living(S).filter((p) => !p.away && p.job === 'soldier');
      const n = i === a ? L.length : Math.floor(L.length / 2);
      for (const p of L.slice(0, n)) out.push({ i, p, levy: false });
    }
    for (const p of levyable(W.islands[a], day)) out.push({ i: a, p, levy: true });
    return out;
  }
  const fighterX = (x) => fighter(x.p) * (x.levy ? LEVY_POWER : 1);
  // sức của một nhóm người (mỗi phần tử {i, p}): theo công nghệ của đảo họ
  const powerOf = (W, list, lvOf) => list.reduce((s, x) => s + fighterX(x) * tech(lvOf(x.i)), 0);
  // sức của cả đảo lúc này: đói thì kém, thiên tai đang có thì kém (logic/climate.js)
  const ready = (S) => (E().state(S).hunger ? HUNGRY : 1) * (1 - 0.3 * (BK.Climate ? BK.Climate.stress(S, S.day) : 0));
  // ước lượng sức thủ cổng của đảo b trước quân từ đảo a (cho người đứng đầu đảo a xét trước khi đánh)
  function defense(W, b, a) { const S = W.islands[b]; return gateGuards(S, sideOf(b, a)).reduce((s, p) => s + fighter(p), 0) * tech(S.level) * wall(S.level) * ready(S); }
  function offense(W, a, day) { return powerOf(W, musterable(W, a, day), (i) => W.islands[i].level) * ready(W.islands[a]); }
  // cổng phía nào của đảo b hướng về đảo a (0: phía đảo b−1, 1: phía đảo b+1; render/map/map3d.js L.landing)
  const sideOf = (b, a) => { const d = (a - b + 6) % 6; return d === 0 ? 0 : d <= 3 ? 1 : 0; };

  /* ---------- Mở chiến dịch ---------- */
  // kind: 'raid' (đột kích, cướp kho) | 'conquer' (tổng tấn công, chiếm nhà chính); share: phần quân đem đi
  // surprise: đánh bất ngờ (người đứng đầu mưu mô)
  function launch(W, day, a, b, kind, share, rng, surprise) {
    const A = W.islands[a], B = W.islands[b], pool = musterable(W, a, day);
    if (pool.length < 2) return null;
    // lính: phần share, máu chiến nhất đi trước; dân binh: cũng phần share
    const pick = (L) => L.sort((x, y) => fighterX(y) - fighterX(x)).slice(0, Math.max(1, Math.round(L.length * share)));
    const troops = pick(pool.filter((x) => !x.levy)).concat(pick(pool.filter((x) => x.levy)));
    const gen = ['general1', 'general2'].map((k) => A.seats[k]).filter((id) => id != null).map((id) => A.people.get(id)).find((p) => p && p.alive && !p.away);
    if (gen) troops.unshift({ i: a, p: gen, levy: false });
    const id = W.nextId++, days = D().travelDays(W, a, b);
    for (const x of troops) x.p.away = id;
    const w = { id, a, b, kind, troops, n0: troops.length, start: day, depart: day, arrive: day + days, by: D().bridged(W, a, b) ? 'bridge' : 'boat', stage: 'march', morale: 1, since: day, helpers: [], loot: {}, gen: gen ? gen.id : null, surprise: !!surprise };
    W.wars.push(w); W.warCount++; W.warStats[kind]++; W.warStats.target[b]++;
    // phản bội: đang có hiệp ước mà vẫn đánh
    const T = D().treatyOf(W, a, b, day);
    if (T) {
      W.treaties.splice(W.treaties.indexOf(T), 1);
      for (let j = 0; j < D().N; j++) if (j !== a) W.rel[j][a].trust = Math.max(0, W.rel[j][a].trust - 0.25);
      W.rel[b][a].grudge = Math.min(1, W.rel[b][a].grudge + 0.5);
      say(W, day, A.name + ' xé ' + (T.kind === 'alliance' ? 'liên minh' : 'hiệp ước') + ' với ' + B.name + '.', [a, b]);
    }
    W.rel[b][a].trust = 0; W.rel[b][a].grudge = Math.min(1, W.rel[b][a].grudge + 0.2);
    const lv = troops.filter((x) => x.levy).length, who = troops.length + ' quân' + (lv ? ' (' + lv + ' dân binh)' : '');
    say(W, day, A.name + (kind === 'raid' ? ' đem ' + who + ' sang đột kích ' : surprise ? ' lặng lẽ đem ' + who + ' sang đánh úp ' : ' tuyên chiến, đem ' + who + ' sang đánh ') + B.name + ' (' + (w.by === 'bridge' ? 'qua cầu' : 'đi thuyền') + ', ' + days + ' ngày).', [a, b]);
    note(A, day, 'war', (kind === 'raid' ? 'Quân lên đường đột kích ' : 'Quân lên đường đánh ') + B.name + '.', gen ? [gen.id] : []);
    // đánh úp thì bên kia (và đồng minh) không biết trước; biết trước thì người đứng đầu đa nghi có thể phá cầu chặn đường
    // (logic/strategy.js onAttacked): quân đang đi qua cầu phải vòng đi thuyền, tới chậm hơn
    if (!surprise) {
      note(B, day, 'war', 'Tin báo: quân ' + A.name + ' đang kéo sang.'); callAllies(W, day, w, rng);
      if (BK.Strategy.onAttacked && BK.Strategy.onAttacked(W, day, b, a, rng) && w.by === 'bridge') { w.by = 'boat'; w.arrive = day + D().travelDays(W, a, b); }
    }
    return w;
  }
  // đồng minh của bên bị đánh (và của đảo cai quản nó) xét gửi quân giúp
  function callAllies(W, day, w, rng) {
    const b = rulerOf(W, w.b);
    for (const T of W.treaties) {
      if (T.kind !== 'alliance' || T.until <= day || (T.a !== b && T.b !== b)) continue;
      const c = T.a === b ? T.b : T.a; if (c === w.a || !D().alive(W, c) || atWar(W, c)) continue;
      const M = BK.Strategy.mind(W.islands[c]); if (!M) continue;
      const t = M.t, yes = 0.25 + 0.4 * W.rel[c][b].trust + 0.3 * t.aggression - 0.3 * t.fear;
      if (!rng.chance(Math.max(0.05, Math.min(0.9, yes)))) { note(W.islands[c], day, 'war', 'Không gửi quân giúp ' + W.islands[b].name + '.'); continue; }
      const L = living(W.islands[c]).filter((p) => !p.away && p.job === 'soldier'), k = Math.floor(L.length * 0.35); if (k < 1) continue;
      const sent = L.slice(0, k).map((p) => { p.away = w.id; return { i: c, p }; });
      w.helpers.push({ c, troops: sent, arrive: day + D().travelDays(W, c, w.b) });
      W.rel[w.b][c].trust = Math.min(1, W.rel[w.b][c].trust + 0.2);
      say(W, day, W.islands[c].name + ' gửi ' + k + ' quân sang giúp ' + W.islands[w.b].name + '.', [c, w.b]);
    }
  }

  /* ---------- Người ngã xuống ---------- */
  function fall(W, day, x, enemy, rng) {
    // p.abroad: ngã xuống ở đảo khác (đang đi đánh, đóng giữ): đảo nhà làm lễ tưởng niệm, không có thi thể (logic/scenes.js)
    const p = x.p, S = W.islands[x.i]; p.alive = false; p.died = day; p.cause = 'chiến tranh'; p.abroad = !!p.away; p.away = null; S.deaths++;
    if (p.role) S.situ.mourning = day + 4;
    note(S, day, 'death', P().fullName(p) + ' ngã xuống trong trận với ' + W.islands[enemy].name + '.', [p.id]);
    // người thân của người chết thù bên kia (truyền đời qua quan hệ hai đảo)
    W.rel[rulerOf(W, x.i)][enemy].grudge = Math.min(1, W.rel[rulerOf(W, x.i)][enemy].grudge + GRUDGE_DEATH);
    if (x.i !== rulerOf(W, x.i)) W.rel[x.i][enemy].grudge = Math.min(1, W.rel[x.i][enemy].grudge + GRUDGE_DEATH);
  }
  // một đợt đánh dài dt ngày giữa hai nhóm: mỗi người có thể ngã, khả năng theo tỉ lệ sức; trả về số ngã mỗi bên
  function clash(W, day, att, def, attLv, defLv, defBonus, w, rng, dt) {
    const A = powerOf(W, att, attLv) * w.morale, Dp = powerOf(W, def, defLv) * defBonus;
    if (!att.length || !def.length) return [0, 0];
    const pa = dt * Math.max(0.01, Math.min(0.4, KILL * Dp / Math.max(0.1, A))), pd = dt * Math.max(0.01, Math.min(0.4, KILL * A / Math.max(0.1, Dp)));
    const deadA = att.filter(() => rng.chance(pa * rng.range(0.6, 1.4))), deadD = def.filter(() => rng.chance(pd * rng.range(0.6, 1.4)));
    for (const x of deadA) fall(W, day, x, w.b, rng);
    for (const x of deadD) fall(W, day, x, w.a, rng);
    return [deadA.length, deadD.length];
  }

  /* ---------- Diễn biến từng đợt (dt ngày, logic/world.js gọi mỗi bước cố định) ---------- */
  function warStep(W, day, w, rng, dt) {
    if (w.kind === 'revolt') return uprisingStep(W, day, w, rng, dt);
    const A = W.islands[w.a], B = W.islands[w.b];
    w.troops = w.troops.filter((x) => x.p.alive);
    for (const h of w.helpers) h.troops = h.troops.filter((x) => x.p.alive);
    if (w.stage === 'march') {
      if (day < w.arrive) return;
      // tới nơi: đảo đó đã thuộc về mình (người khác đánh giúp) thì về
      if (rulerOf(W, w.b) === w.a) return goHome(W, day, w, 'Đảo ' + B.name + ' đã thuộc về ' + A.name + ', quân quay về.');
      w.stage = 'gate'; w.since = day; B.situ.warSide = sideOf(w.b, w.a);
      say(W, day, 'Quân ' + A.name + ' đổ bộ, đánh cổng ' + B.name + '.', [w.a, w.b]);
      note(B, day, 'war', 'Quân ' + A.name + ' đánh tới cổng.');
    }
    if (w.stage === 'gate' || w.stage === 'inside') { B.situ.war = day + 1.5; B.situChanged = true; }
    if (w.stage === 'gate') {
      // quân đồng minh tới nơi thì vào trận cùng bên thủ
      const helpers = w.helpers.filter((h) => h.arrive <= day).flatMap((h) => h.troops);
      const garrison = B.garrison ? B.garrison.troops.filter((x) => x.p.alive) : [];
      let def = gateGuards(B, B.situ.warSide).map((p) => ({ i: w.b, p })).concat(helpers, garrison);
      // bị đánh úp: ngày đầu chỉ một nửa người giữ cổng kịp ra trận
      if (w.surprise && day - w.since < 1) { def = def.filter((x, k) => k % 2 === 0); note(B, day, 'war', 'Bị đánh úp, cổng ' + (B.situ.warSide ? 'phải' : 'trái') + ' chỉ có ' + def.length + ' người giữ.'); }
      const [la, ld] = clash(W, day, w.troops, def, lvOf(W), lvOf(W), wall(B.level) * ready(B) / ready(A), w, rng, dt);
      const fa = la / Math.max(1, w.troops.length), fd = ld / Math.max(1, def.length);
      // sĩ khí theo chênh lệch phần thiệt hại hai bên trong đợt này (mất nhiều hơn hẳn thì nản nhiều, ngang nhau thì giữ)
      if (la || ld) w.morale = Math.max(0, Math.min(1.2, w.morale + MORALE_K * (fd - fa)));
      w.morale = Math.max(0, w.morale - 0.01 * dt); // trận kéo dài thì mỏi
      w.troops = w.troops.filter((x) => x.p.alive);
      const left = def.filter((x) => x.p.alive);
      if (!w.troops.length) return lost(W, day, w, 'Cả đoàn quân ' + A.name + ' ngã xuống trước cổng ' + B.name + '.');
      if (w.morale < MORALE_RETREAT || w.troops.length < w.n0 * LOSS_RETREAT) return lost(W, day, w, 'Quân ' + A.name + ' núng thế, rút khỏi cổng ' + B.name + '.');
      // đột kích: trụ được ở cổng thì xông vào cướp kho rồi rút
      if (w.kind === 'raid' && day - w.since >= RAID_DAYS - 1 && w.morale > 0.5) { w.share = Math.min(1, powerOf(W, w.troops, (i) => W.islands[i].level) / Math.max(1, powerOf(W, left, (i) => W.islands[i].level) * wall(B.level))); return loot(W, day, w); }
      if (!left.length || powerOf(W, left, (i) => W.islands[i].level) * wall(B.level) < GATE_BREAK * powerOf(W, w.troops, (i) => W.islands[i].level) * w.morale) {
        w.stage = 'inside'; w.since = day;
        say(W, day, 'Cổng ' + B.name + ' vỡ, quân ' + A.name + ' tràn vào thành.', [w.a, w.b]);
        note(B, day, 'war', 'Cổng thành vỡ. Quân ' + A.name + ' đã vào thành.');
        civilians(W, day, w, rng);
        return;
      }
      // xin hoà: mỗi ngày xét một lần
      if (Math.floor(day) !== w.peaceDay) { w.peaceDay = Math.floor(day); maybePeace(W, day, w, rng); }
      return;
    }
    if (w.stage === 'inside') {
      if (w.kind === 'raid') return loot(W, day, w);
      // người nóng nảy cầm vũ khí giữ nhà: đánh với quân vào thành
      const militia = living(B).filter((p) => !p.away && P().ageOf(p, day) >= BK.Rules.ADULT_AGE && (isGuard(p) || P().traits(p).aggression > 0.62)).map((p) => ({ i: w.b, p }));
      clash(W, day, w.troops, militia, lvOf(W), lvOf(W), 0.8, w, rng, dt);
      w.troops = w.troops.filter((x) => x.p.alive);
      if (!w.troops.length) return lost(W, day, w, 'Dân ' + B.name + ' giữ được nhà chính, quân ' + A.name + ' bị đánh bật.');
      if (day - w.since >= INSIDE_DAYS) return annex(W, day, w.a, w.b, w);
    }
    if (w.stage === 'return' && day >= w.arrive) home(W, day, w);
  }
  // dân phản ứng khi quân vào thành (ghi lại cho bảng làng; cử động do logic/brain.js theo S.situ.war)
  function civilians(W, day, w, rng) {
    const B = W.islands[w.b], L = living(B).filter((p) => !p.away);
    const n = (f) => L.filter(f).length;
    const hot = n((p) => P().traits(p).aggression > 0.62 && !isGuard(p)), timid = n((p) => P().traits(p).fear > 0.6), pious = n((p) => P().traits(p).piety > 0.68);
    note(B, day, 'war', hot + ' người nóng nảy cầm vũ khí giữ nhà, ' + timid + ' người nhút nhát chạy trốn, ' + pious + ' người cầu nguyện.');
  }
  // đột kích: lấy thứ mình quý nhất trong kho bên kia, rồi về
  function loot(W, day, w) {
    const A = W.islands[w.a], B = W.islands[w.b], sb = E().state(B).stock;
    let room = w.troops.length * LOOT_PER * tech(A.level);
    const order = E().RES.filter((r) => sb[r] > 0).sort((x, y) => D().value(A, y) - D().value(A, x));
    const take = 0.6 * (w.share == null ? 1 : Math.max(0.25, w.share));
    for (const r of order) { const k = Math.floor(Math.min(room, sb[r] * take)); if (k <= 0) continue; sb[r] -= k; w.loot[r] = (w.loot[r] || 0) + k; room -= k; }
    const txt = Object.entries(w.loot).map(([r, v]) => v + ' ' + E().NAME[r].toLowerCase()).join(', ') || 'chẳng được gì';
    say(W, day, 'Quân ' + A.name + ' cướp kho ' + B.name + ': ' + txt + '.', [w.a, w.b]);
    note(B, day, 'war', 'Kho bị quân ' + A.name + ' cướp: ' + txt + '.');
    goHome(W, day, w, null, true);
  }
  // bên thủ yếu thế xin hoà, nộp một phần kho; bên công nhận hay không tuỳ tính người đứng đầu
  function maybePeace(W, day, w, rng) {
    if (Math.floor(day - w.since) % 3 !== 0) return;
    const A = W.islands[w.a], b = rulerOf(W, w.b), B = W.islands[b], MB = BK.Strategy.mind(B), MA = BK.Strategy.mind(A); if (!MB || !MA) return;
    const att = powerOf(W, w.troops, (i) => W.islands[i].level) * w.morale, def = defense(W, w.b, w.a);
    if (def > att * 0.9) return;
    const tb = MB.t, ask = 0.15 + 0.45 * tb.fear + 0.3 * tb.meekness - 0.35 * tb.aggression - 0.3 * W.rel[b][w.a].grudge;
    if (!rng.chance(Math.max(0.02, Math.min(0.8, ask)))) return;
    const ta = MA.t, yes = 0.3 + 0.35 * (1 - ta.aggression) + 0.25 * ta.cunning - (w.kind === 'conquer' ? 0.35 * ta.ambition : 0);
    say(W, day, B.name + ' xin hoà với ' + A.name + '.', [w.a, b]);
    if (!rng.chance(Math.max(0.05, Math.min(0.9, yes)))) { say(W, day, A.name + ' không nhận hoà.', [w.a, b]); return; }
    const sb = E().state(B).stock;
    for (const r of E().RES) { const k = Math.floor(sb[r] * (r === 'food' ? 0.15 : 0.3)); if (k > 0) { sb[r] -= k; w.loot[r] = (w.loot[r] || 0) + k; } }
    D().sign(W, day, w.a, b, 'pact', 360); W.warStats.peace++;
    goHome(W, day, w, B.name + ' nộp ' + (Object.entries(w.loot).map(([r, v]) => v + ' ' + E().NAME[r].toLowerCase()).join(', ') || 'chút ít') + ' để được hoà; quân ' + A.name + ' rút về.', true);
  }
  function lost(W, day, w, text) {
    const B = W.islands[w.b], b = rulerOf(W, w.b);
    say(W, day, text, [w.a, w.b]); note(B, day, 'war', 'Giữ được thành trước quân ' + W.islands[w.a].name + '.');
    W.rel[w.a][b].fear = Math.min(1, W.rel[w.a][b].fear + 0.3);
    W.warStats.lost++;
    goHome(W, day, w, null, false);
  }
  // quân quay về: đi đường thật; quân đồng minh về ngay khi hết trận
  function goHome(W, day, w, text, won) {
    if (text) say(W, day, text, [w.a, w.b]);
    for (const h of w.helpers) for (const x of h.troops) x.p.away = null;
    w.helpers = []; W.islands[w.b].situ.war = Math.min(W.islands[w.b].situ.war, day + 0.5);
    w.stage = 'return'; w.won = !!won; w.depart = day; w.arrive = day + D().travelDays(W, w.b, w.a);
  }
  function home(W, day, w) {
    const A = W.islands[w.a], sa = E().state(A).stock;
    for (const x of w.troops) x.p.away = null;
    for (const r in w.loot) sa[r] = Math.min(E().CAP(A.level, r), sa[r] + w.loot[r]);
    if (w.won) W.warStats.won++;
    note(A, day, 'war', 'Quân về tới nhà, còn ' + w.troops.length + '/' + w.n0 + ' người' + (Object.keys(w.loot).length ? ', mang theo chiến lợi phẩm.' : '.'));
    W.wars.splice(W.wars.indexOf(w), 1);
  }

  /* ---------- Sáp nhập ---------- */
  function annex(W, day, a, b, w) {
    const A = W.islands[a], B = W.islands[b], sa = E().state(A).stock, sb = E().state(B).stock, stB = E().state(B);
    // kho: chuyển hết sang đảo thắng, lương thực để lại đủ cho dân RESERVE_DAYS ngày
    for (const r of E().RES) { const keep = r === 'food' ? Math.min(sb.food, stB.eaten * RESERVE_DAYS) : 0, k = sb[r] - keep; if (k > 0) { sa[r] = Math.min(E().CAP(A.level, r), sa[r] + k); sb[r] = keep; } }
    const was = B.annexedBy;
    if (B.garrison) { for (const x of B.garrison.troops) x.p.away = null; B.garrison = null; }
    B.annexedBy = a; B.annexDay = day; B.unrest = 0.3;
    // quân đóng giữ: một phần quân thắng ở lại (người đảo a), về sau GARRISON_DAYS ngày
    if (w) { const k = Math.floor(w.troops.length * GARRISON_SHARE), stay = w.troops.filter((x) => x.i === a).slice(-k); for (const x of stay) x.p.away = 'garrison'; w.troops = w.troops.filter((x) => !stay.includes(x)); B.garrison = { troops: stay, until: day + GARRISON_DAYS }; if (stay.length) note(B, day, 'war', stay.length + ' lính ' + A.name + ' ở lại đóng giữ.'); }
    // các đảo b đang cai quản cũng sang tay a
    for (const j of vassalsOf(W, b)) { W.islands[j].annexedBy = a; say(W, day, W.islands[j].name + ' (đang thuộc ' + B.name + ') nay thuộc về ' + A.name + '.', [j, a]); }
    W.treaties = W.treaties.filter((t) => t.a !== b && t.b !== b);
    W.rel[b][a].grudge = Math.min(1, W.rel[b][a].grudge + GRUDGE_ANNEX); W.rel[b][a].trust = 0;
    W.annexations++;
    // người cai quản: một người trong hội đồng đảo thắng sang ngồi ghế vua; vua cũ bị phế
    const old = B.seats.king != null ? B.people.get(B.seats.king) : null;
    if (old && old.alive) { old.role = null; note(B, day, 'seat', P().fullName(old) + ' bị phế.', [old.id]); }
    B.seats.king = null;
    const pick = ['advisor', 'general2', 'priest', 'merchant'].map((k) => A.seats[k]).filter((id) => id != null).map((id) => A.people.get(id)).find((p) => p && p.alive && !p.away);
    if (pick) {
      const g = P().create({ id: B.nextId++, name: pick.name, clan: pick.clan, sex: pick.sex, born: pick.born, genome: pick.genome, gen: pick.gen });
      g.traits = pick.traits; g.epi = pick.epi; g.governor = a; g.role = 'king'; g.from = A.key; g.job = null;
      B.people.set(g.id, g); B.seats.king = g.id;
      // người đi cai quản rời đảo cũ (không phải chết: không tính vào số người mất)
      A.seats[pick.role] = null; pick.role = null; pick.alive = false; pick.left = b; pick.cause = 'sang cai quản ' + B.name;
      note(A, day, 'seat', P().fullName(pick) + ' sang cai quản ' + B.name + '.', [pick.id]);
      note(B, day, 'seat', P().fullName(g) + ' từ ' + A.name + ' sang cai quản đảo.', [g.id]);
    }
    syncEra(W, b, day);
    say(W, day, A.name + ' chiếm nhà chính ' + B.name + '. ' + B.name + (was != null ? ' (vốn thuộc ' + W.islands[was].name + ')' : '') + ' bị sáp nhập vào ' + A.name + '.', [a, b]);
    note(B, day, 'war', 'Nhà chính thất thủ. Đảo bị sáp nhập vào ' + A.name + '.');
    note(A, day, 'war', 'Chiếm được ' + B.name + '.');
    if (w) goHome(W, day, w, null, true);
  }
  // đảo bị sáp nhập dùng chung thời với đảo cai quản
  function syncEra(W, i, day) {
    const S = W.islands[i], R = W.islands[rulerOf(W, i)];
    if (S.level === R.level) return;
    const up = R.level > S.level; S.level = R.level;
    if (BK.Construction) BK.Construction.setEra(S, S.level);
    if (up && BK.Dramas) BK.Dramas.onEra(S, S.rng);
    note(S, day, 'era', S.name + ' theo ' + R.name + ' sang ' + BK.Eras.of(S.level).name + '.');
    S.situChanged = true;
  }

  /* ---------- Đảo bị sáp nhập: nộp kho, bất bình, nổi dậy ---------- */
  function vassalDay(W, day, i, rng) {
    const S = W.islands[i], r = S.annexedBy, Rr = W.islands[r], st = E().state(S), sr = E().state(Rr).stock;
    // phần dư nộp về đảo cai quản
    for (const res of E().RES) { const keep = res === 'food' ? st.eaten * RESERVE_DAYS : 0, k = st.stock[res] - keep; if (k > 1) { const room = E().CAP(Rr.level, res) - sr[res], m = Math.max(0, Math.min(k, room)); sr[res] += m; st.stock[res] -= m; } }
    syncEra(W, i, day);
    // bất bình: thù hằn, tính nóng của dân, đói làm tăng; yên ổn lâu thì nguôi dần
    // quân đóng giữ: hết hạn thì về nhà
    if (S.garrison) { S.garrison.troops = S.garrison.troops.filter((x) => x.p.alive); if ((day >= S.garrison.until && (S.unrest || 0) < CALM_UNREST) || !S.garrison.troops.length) { for (const x of S.garrison.troops) x.p.away = null; if (S.garrison.troops.length) note(S, day, 'war', 'Quân ' + Rr.name + ' đóng giữ rút về.'); S.garrison = null; } }
    const L = living(S).filter((p) => !p.governor && P().ageOf(p, day) >= BK.Rules.ADULT_AGE);
    if (!L.length) return;
    const hot = L.reduce((s, p) => s + P().traits(p).aggression, 0) / L.length, g = W.rel[i][r].grudge;
    S.unrest = Math.max(0, Math.min(1, (S.unrest || 0) + 0.004 * (g + hot) + (st.hunger ? 0.01 : 0) - 0.004));
    if ((Math.floor(day) + i * 3) % 10 !== 0 || atWar(W, i)) return;
    if (S.unrest > 0.45) reinforce(W, day, i, rng);
    if (day - S.annexDay < CALM_DAYS || (S.revoltFailed != null && day - S.revoltFailed < REVOLT_REST) || S.unrest < 0.55) return;
    if (!rng.chance((S.unrest - 0.5) * 0.4)) return;
    revolt(W, day, i, rng, L, g);
  }
  // đảo cai quản gửi thêm quân đóng giữ khi dân bất bình (người đứng đầu cứng rắn thì hay gửi)
  function reinforce(W, day, i, rng) {
    const S = W.islands[i], r = S.annexedBy, M = BK.Strategy.mind(W.islands[r]); if (!M || atWar(W, r)) return;
    const adults = living(S).filter((p) => P().ageOf(p, day) >= BK.Rules.ADULT_AGE).length, have = S.garrison ? S.garrison.troops.filter((x) => x.p.alive).length : 0;
    if (have >= Math.max(4, Math.round(adults * GARRISON_MAX))) return;
    if (!rng.chance(0.2 + 0.4 * M.t.aggression + 0.3 * M.t.paranoia - 0.3 * M.t.meekness)) return;
    const home = living(W.islands[r]).filter((p) => !p.away && p.job === 'soldier'), k = Math.min(2, Math.floor(home.length / 3)); if (k < 1) return;
    const sent = home.slice(0, k).map((p) => { p.away = 'garrison'; return { i: r, p, levy: false }; });
    if (!S.garrison) S.garrison = { troops: [], until: day + GARRISON_DAYS };
    S.garrison.troops.push(...sent);
    note(S, day, 'war', W.islands[r].name + ' gửi thêm ' + k + ' lính sang đóng giữ.');
  }
  // nổi dậy bùng lên: gom hai phe, mở một trận nhiều ngày (W.wars, kind 'revolt': a đảo nổi dậy, b đảo cai quản)
  function revolt(W, day, i, rng, L, g) {
    const S = W.islands[i], r = S.annexedBy, Rr = W.islands[r];
    // người nóng nảy nổi dậy. Lính người đảo này chia ba: theo dân (theo thù hằn), đứng ngoài không đánh ai (nhút nhát, sùng
    // đạo thì hay đứng ngoài), hay đánh cho đảo cai quản. Quân đóng giữ (người đảo cai quản) luôn giữ phe mình
    const rebels = [], loyal = S.garrison ? S.garrison.troops.filter((x) => x.p.alive).slice() : [];
    for (const p of L) { if (p.away) continue; const t = P().traits(p); if (isGuard(p)) { if (rng.chance(0.15 + 0.4 * g)) rebels.push({ i, p }); else if (!rng.chance(0.25 + 0.3 * t.fear + 0.2 * t.piety)) loyal.push({ i, p }); } else if ((t.aggression > 0.6 || (t.ambition > 0.7 && t.fear < 0.5)) && rng.chance(0.7 * S.unrest)) rebels.push({ i, p, levy: true }); }
    if (rebels.length < 2) return;
    // người cầm đầu cân nhắc: phe mình yếu hẳn thì chờ thời (đảo cai quản bận đánh nơi khác thì quân đóng giữ không được tiếp
    // viện, dễ thắng hơn); chỉ khi cùng cực (bất bình gần tột đỉnh) mới liều
    const odds = powerOf(W, rebels, () => S.level) / Math.max(0.5, powerOf(W, loyal, lvOf(W)) * 1.1) * (atWar(W, r) ? 1.5 : 1);
    if (odds < REVOLT_ODDS && S.unrest < 0.98) return;
    W.revolts++; W.warStats.revolt++;
    const w = { id: W.nextId++, kind: 'revolt', a: i, b: r, troops: rebels, loyal, n0: rebels.length, l0: Math.max(1, loyal.length), stage: 'uprising', morale: 1, lmorale: 1, since: day, start: day, helpers: [], loot: {} };
    W.wars.push(w);
    say(W, day, 'Dân ' + S.name + ' nổi dậy chống ' + Rr.name + ' (' + rebels.length + ' người).', [i, r]);
    note(S, day, 'war', rebels.length + ' người nổi dậy, ' + loyal.length + ' lính giữ phe ' + Rr.name + '.');
  }
  // trận nổi dậy, từng đợt: hai phe đánh nhau trên đảo; phe nào sĩ khí cạn hay còn quá ít người thì thua
  function uprisingStep(W, day, w, rng, dt) {
    const S = W.islands[w.a], Rr = W.islands[w.b];
    S.situ.war = day + 1; S.situChanged = true;
    const R = w.troops.filter((x) => x.p.alive), L = w.loyal.filter((x) => x.p.alive);
    if (L.length && R.length) {
      const lv = () => S.level, sides = { a: w.a, b: w.b, morale: w.morale };
      const [lr, ll] = clash(W, day, R, L, lv, lv, 1.1 * w.lmorale, sides, rng, dt);
      if (lr || ll) { const fr = lr / R.length, fl = ll / L.length; w.morale = Math.max(0, Math.min(1.2, w.morale + MORALE_K * (fl - fr))); w.lmorale = Math.max(0, Math.min(1.2, w.lmorale + MORALE_K * (fr - fl))); }
    }
    const R2 = w.troops.filter((x) => x.p.alive), L2 = w.loyal.filter((x) => x.p.alive);
    const rebelsLose = !R2.length || w.morale < MORALE_RETREAT || R2.length < w.n0 * REBEL_BREAK;
    const loyalLose = !L2.length || w.lmorale < MORALE_RETREAT + 0.05 || L2.length < w.l0 * REBEL_BREAK;
    if (!rebelsLose && !loyalLose) return;
    W.wars.splice(W.wars.indexOf(w), 1);
    if (loyalLose && !rebelsLose) {
      // độc lập lại: người cai quản bị đuổi, quân đóng giữ còn sống bỏ về, hội đồng tự chọn vua mới (logic/council.js)
      const gov = S.seats.king != null ? S.people.get(S.seats.king) : null;
      if (gov && gov.governor != null) { gov.alive = false; gov.role = null; gov.cause = 'bị đuổi về'; gov.died = day; S.seats.king = null; }
      if (S.garrison) { for (const x of S.garrison.troops) x.p.away = null; S.garrison = null; }
      S.annexedBy = null; S.unrest = 0; S.policy = null; W.warStats.freed++;
      W.rel[w.a][w.b].grudge = 1; W.rel[w.b][w.a].fear = Math.min(1, W.rel[w.b][w.a].fear + 0.2);
      say(W, day, S.name + ' giành lại độc lập từ ' + Rr.name + '.', [w.a, w.b]);
      note(S, day, 'war', 'Giành lại độc lập.');
      BK.Council.update(S);
    } else {
      S.unrest = Math.max(0, S.unrest - 0.4); S.revoltFailed = day;
      say(W, day, 'Cuộc nổi dậy ở ' + S.name + ' bị dập tắt.', [w.a, w.b]);
      note(S, day, 'war', 'Cuộc nổi dậy bị dập tắt.');
    }
  }

  // mỗi bước cố định (logic/world.js gọi, dt ngày): diễn biến các trận
  function step(W, day, rng, dt) { for (const w of [...W.wars]) warStep(W, day, w, rng, dt); }
  // mỗi ngày: các đảo bị sáp nhập (nộp kho, bất bình, nổi dậy)
  function dayTick(W, day, rng) { for (let i = 0; i < W.islands.length; i++) if (W.islands[i].annexedBy != null) vassalDay(W, day, i, rng); }
  return { init, rulerOf, vassalsOf, atWar, defense, offense, musterable, launch, annex, step, dayTick, sideOf, wall, tech };
});
