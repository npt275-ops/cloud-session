/* Bể Kính · logic/war.js · Chiến tranh, sáp nhập, nổi dậy
 * (design/quy-trinh-tong-quat.md mục 7.3) Ở cấp cả bể (W, logic/world.js). Ai đánh ai, lúc nào là do người đứng đầu quyết
 * (logic/strategy.js); tệp này chỉ chạy diễn biến:
 *   gọi quân     lính của đảo (và một nửa lính các đảo mình cai quản), tướng dẫn quân, cộng dân binh: đàn ông khoẻ, máu
 *                chiến đang làm việc khác bị gọi đi (đánh kém lính, LEVY_POWER), đi đánh thì bỏ việc ở nhà.
 *   hành quân    quân là người thật (p.away = mã chiến dịch): rời đảo, đi qua các cây cầu trên đường (w.path) mất BRIDGE_DAYS ngày mỗi cầu
 *                (logic/diplomacy.js), người ở nhà vẫn làm ăn.
 *   tập hợp      quân tập hợp ở cổng MUSTER ngày (A.situ.muster), rồi mới lên đường.
 *   đánh ở cổng  qua cầu thì đánh cổng phụ đầu cầu, đi thuyền thì đổ bộ đánh cổng chính (logic/siege.js; lính gác các cổng khác
 *                giữ chốt). Mỗi ngày một đợt: bên công (lính, tướng dẫn quân) và bên thủ (lính, tướng ở nhà, lính gác cổng đó,
 *                dân tự nguyện đánh như dân binh, quân đồng minh tới giúp, tường thành theo thời). Mỗi người có thể ngã xuống, khả năng tuỳ sức hai bên; có may rủi. Thua đợt thì sĩ
 *                khí bên công rơi; sĩ khí cạn hay mất quá nửa quân thì rút. Bên thủ gần hết người thì cổng vỡ.
 *                Bên thủ đang đói đánh kém (HUNGRY), đang có thiên tai cũng kém đi. Người đứng đầu mưu mô thì đánh bất ngờ:
 *                ngày đầu chỉ một nửa người giữ cổng kịp ra trận.
 *                Đột kích không cần phá cổng: trụ được RAID_DAYS ngày ở cổng là xông vào cướp được một phần kho (theo tương
 *                quan sức) rồi rút.
 *   vào thành    (logic/siege.js) cổng vỡ hẳn. Đột kích: khuân hàng trong kho ra cổng LOOT_DAYS ngày rồi về. Tổng tấn công: đốt
 *                phá các công trình quanh thành trước (kho, xưởng, nhà dân, ruộng; mất hàng, mất sản lượng, dân ở nhờ) tối đa
 *                OUTER_DAYS ngày, người nóng nảy và lính còn lại đánh trên phố; rồi vây nhà chính: đội giữ thành (lính còn lại,
 *                hội đồng, dân tự nguyện) đánh từ trong ra. Đội này ngã hết, hay người đứng đầu đầu hàng (theo tính cách), thì
 *                mất thành. Dân làm theo vai của mình trong trận (logic/siege.js roleOf, S.situ.siege). Người ngã nằm lại trên
 *                chiến trường (S.fallen).
 *   sáp nhập     chiếm được nhà chính thì người đứng đầu cũ bị dẫn ra quỳ ở sân (S.situ.kneel), rồi đảo thua thuộc về đảo thắng (S.annexedBy): kho chuyển sang đảo thắng (lương thực để
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
  const REBEL_BREAK = 0.3;      // nổi dậy: phe nào còn dưới phần này so với lúc đầu, hay sĩ khí dưới MORALE_RETREAT, thì thua
  const RESERVE_DAYS = 30;      // đảo bị sáp nhập giữ lại chừng này ngày lương thực
  const LOOT_PER = 30;          // mỗi người lính đột kích mang về được chừng này đơn vị
  const GRUDGE_DEATH = 0.06, GRUDGE_ANNEX = 0.9;
  const LEVY_POWER = 0.6, LEVY_AGE = 45; // dân binh: sức so với lính, quá tuổi này không bị gọi
  const VOL_POWER = 0.4;        // dân tự nguyện giữ thành (cầm đồ nghề làm vũ khí): sức so với lính
  const HUNGRY = 0.7;           // sức đánh của đảo đang đói
  const RAID_DAYS = 2;
  const GARRISON_SHARE = 0.4, GARRISON_DAYS = 360, CALM_DAYS = 180, CALM_UNREST = 0.4;
  const REVOLT_REST = 180;      // nổi dậy thất bại: chừng này ngày sau dân mới gượng dậy được
  const REVOLT_ODDS = 1.0;      // phe nổi dậy ước sức mình dưới phần này so với phe giữ thì chờ thời
  const GARRISON_MAX = 0.15;    // quân đóng giữ tối đa chừng này phần người lớn của đảo bị sáp nhập (ít nhất 4): nhà cũng cần lính
  const RESCUE = 0.5;           // nhà chính bị vây: hệ số một đảo thân (hay thù kẻ đánh) gửi quân cứu viện gấp
  const PASS_TRUST = 0.3, PASS_FEAR = 0.5; // đảo ở giữa cho quân đi qua cầu của mình khi tin hay sợ bên đánh chừng này
  const KEEP_YIELD = 0.4;       // đầu hàng để cứu dân: đảo thua giữ lại chừng này phần kho
  const TECH_DAYS = 90;         // đảo bị chiếm: cứ chừng này ngày đảo cai quản chuyển công nghệ lên một thời (tới bằng mình trừ một)
  const RULER_AID = 0.4;        // đảo cai quản gửi chừng này phần lính ở nhà sang giữ đảo nó cai quản khi bị đánh
  const MUSTER = 0.3;           // gọi quân: tập hợp ở cổng chừng này ngày, người nhà ra tiễn, rồi mới lên đường
  const OUTER_DAYS = 2;         // vào thành: đánh các công trình quanh thành tối đa chừng này ngày rồi vây nhà chính
  const LOOT_DAYS = 0.4;        // đột kích: chừng này ngày khuân hàng từ kho ra cổng rồi rút
  const HALL_WALL = 1.0;        // nhà chính che chắn cho đội giữ thành (thêm vào tường thành theo thời)
  const REPAIR_KEEP = 60;       // đảo bị sáp nhập còn chỗ hư thì giữ lại chừng này gỗ, đá để sửa
  const FALLEN_MAX = 80;        // số người ngã xuống còn nằm trên chiến trường mỗi đảo (phần vẽ)
  // máu (design/chien-tranh-thinh-vuong.md mục 8): chỉ đánh bằng vũ khí bắn xa; mỗi phát trúng mất HIT_MIN..HIT_MAX máu (đầy là
  // 100), hết máu thì ngã. Khả năng trúng mỗi đợt bằng HITS lần khả năng ngã cũ (trung bình khoảng ba phát thì ngã), nên số
  // người ngã gần như cũ nhưng có người bị thương, rút về thì hồi máu HEAL mỗi ngày
  const HIT_MIN = 28, HIT_MAX = 45, HITS = 6, HEAL = 20;
  // máu cổng, máu nhà chính (S.ruin, logic/siege.js): quân đánh bắn phá cổng mỗi ngày GATE_HIT × (tỉ lệ sức trên ngưỡng), hết
  // máu thì cổng vỡ; vào thành thì bắn phá nhà chính HALL_HIT × tỉ lệ sức mỗi ngày, nhà chính hết máu thì mất thành
  const GATE_HIT = 1.2, GATE_EMPTY = 2, HALL_HIT = 0.04;
  // cổng đứng ít nhất chừng này ngày dưới làn đạn (máu cổng mất không nhanh hơn 1/GATE_MIN_DAYS mỗi ngày dù bên giữ ít người): người
  // xem kịp thấy quân và xe nã vào cổng từ giữa cầu rồi cổng mới đổ (design/ke-hoach-buoc-12.md). Nội gián mở cổng, cổng dịch
  // chuyển, tên lửa bắn trước khi quân tới thì không giới hạn
  const GATE_MIN_DAYS = 1.2;
  const JOIN_DAYS = 1;          // người giữ cổng (không phải lính gác ở đó sẵn) chạy từ chỗ đang ở ra cổng mất chừng này ngày (xa nhất chừng 80 đơn vị đường)
  // càn quét (mục 9): vào thành rồi, nửa quân đi bắn dân thường đang chạy nạn ngoài đường trước khi tới nhà chính; mỗi ngày
  // khả năng trúng của một người đang chạy nạn ngoài đường theo CIV_HIT (người trốn trong nhà, người cầu ở chỗ thờ thì không bị
  // bắn: phần vẽ chỉ cho quân đuổi bắn người chạy ngoài đường, render/village3d.js)
  const CIV_HIT = 0.6;
  const CIV_CHASE = 0.7;        // quân vào thành đuổi theo dân chạy nạn sang phía bên kia đảo mất chừng này ngày mới bắn tới
  // đổi chặng (design/ke-hoach-khac-phuc.md mục 2.4): từ phá công trình sang vây nhà chính, quân chạy qua phố mất TRANSIT ngày;
  // gặp dân binh, lính còn lại trên đường thì đánh hết (còn tối đa TRANSIT_LEFT người) mới tới nhà chính, không đi lướt qua
  const TRANSIT = 0.3, TRANSIT_LEFT = 1, TRANSIT_MAX = 1.5;
  // phát trúng ghi lại cho phần vẽ (W.hitLog, mục 2.1): giữ tối đa HIT_LOG phát gần nhất
  const HIT_LOG = 300;

  const P = () => BK.People, D = () => BK.Diplomacy, E = () => BK.Economy, G = () => BK.Siege;
  const tech = (lv) => 1 + 0.15 * (lv - 1);
  const wall = (lv) => 1 + 0.025 * lv;                         // tường thành giữ cổng, chắc dần theo thời
  const living = (S) => BK.Island.living(S);
  const say = (W, day, text, isles) => D().say(W, day, text, isles);
  const note = (S, day, kind, text, ids) => S.log.push({ day: Math.floor(day), kind, ids: ids || [], text });

  // W.warStats: số trận theo kiểu (raid, conquer), số lần thắng, thua, cầu hoà (cho kiểm thử và bảng dev)
  function init(W) { if (BK.Missiles) BK.Missiles.init(W); W.wars = W.wars || []; W.warCount = 0; W.annexations = 0; W.revolts = 0; W.warStats = { raid: 0, conquer: 0, won: 0, lost: 0, peace: 0, revolt: 0, freed: 0, target: [0, 0, 0, 0, 0, 0] }; }
  // đảo cai quản i (chính nó nếu độc lập)
  const rulerOf = (W, i) => (W.islands[i].annexedBy != null ? W.islands[i].annexedBy : i);
  const vassalsOf = (W, a) => W.islands.map((S, i) => i).filter((i) => W.islands[i].annexedBy === a);
  const atWar = (W, i) => W.wars.find((w) => w.a === i || w.b === i || rulerOf(W, w.b) === i) || null;
  const lvOf = (W) => (i) => W.islands[i].level;

  /* ---------- Sức đánh ---------- */
  // sức một người khi cầm vũ khí: tướng mạnh hơn, hiếu chiến thì hăng, nhút nhát thì kém
  function fighter(p) { const t = P().traits(p); return (p.role === 'general1' || p.role === 'general2' ? 1.5 : 1) * (0.7 + 0.6 * t.aggression - 0.3 * t.fear); }
  const isGuard = (p) => p.job === 'soldier' || p.job === 'gatekeeper' || p.job === 'sideguard' || p.role === 'general1' || p.role === 'general2';
  // người giữ cổng gate ('gate' cổng chính, 'gateL', 'gateR' cổng phụ; logic/siege.js): lính, tướng ở nhà, lính gác đúng cổng
  // đó (lính gác các cổng khác giữ chốt), cộng dân tự nguyện (đánh như dân binh)
  const gateDefenders = (S, gate, day, i) => G().gateGuards(S, gate).map((p) => ({ i, p, levy: false })).concat(G().volunteers(S, day).map((p) => ({ i, p, levy: true, vol: true })));
  // cổng của đảo b mà quân đảo a sẽ đánh: có cầu thì cổng phụ đầu cầu, không thì đổ bộ đánh cổng chính
  // chỉ đánh qua cầu (design/ke-hoach-buoc-12.md mục 3.1): đường từ a tới b qua các cầu; đảo ở giữa phải cho mượn đường: đất
  // của a (đảo a cai quản), có hiệp ước với a, tin a (PASS_TRUST), hay sợ a (PASS_FEAR) mà không dám chặn. Không có đường thì
  // không đánh được (logic/strategy.js bắc cầu trước)
  const warPath = (W, a, b, day) => D().bridgeRoute(W, a, b, (c) => { const r = rulerOf(W, c); if (r === a) return true;
    return !!D().treatyOf(W, a, r, day != null ? day : W.day) || W.rel[r][a].trust >= PASS_TRUST || W.rel[r][a].fear >= PASS_FEAR; });
  const pathDays = (path) => D().BRIDGE_DAYS * (path.length - 1);
  // cổng phụ của b phía cây cầu cuối cùng trên đường quân tới
  const gateFor = (W, b, a) => { const p = warPath(W, a, b); return G().gateOf(sideOf(b, p ? p[p.length - 2] : a), true); };
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
  const fighterX = (x) => fighter(x.p) * (x.vol ? VOL_POWER : x.levy ? LEVY_POWER : 1);
  // sức của một nhóm người (mỗi phần tử {i, p}): theo công nghệ của đảo họ
  const powerOf = (W, list, lvOf) => list.reduce((s, x) => s + fighterX(x) * tech(lvOf(x.i)), 0);
  // sức của cả đảo lúc này: đói thì kém, thiên tai đang có thì kém (logic/climate.js)
  const ready = (S) => (E().state(S).hunger ? HUNGRY : 1) * (1 - 0.3 * (BK.Climate ? BK.Climate.stress(S, S.day) : 0));
  // ước lượng sức thủ cổng của đảo b trước quân từ đảo a (cho người đứng đầu đảo a xét trước khi đánh)
  // (bên ngoài chỉ thấy lính giữ cổng, không biết trước bao nhiêu dân sẽ cầm vũ khí ra giữ)
  // cổng ít người giữ nhất của đảo S (quân đột kích đi thuyền chọn chỗ đổ bộ; 7g sau: cổng chính lúc nào cũng có 4 lính gác giữ
  // chốt, đâm vào đó thì những năm đầu không đảo nào đủ sức đột kích)
  // kind 'raid' đi thuyền: ước theo cổng yếu nhất
  // đảo b đang bị cai quản: bên ngoài thấy quân đóng giữ ở đó, và biết đảo cai quản sẽ gửi quân sang giữ (RULER_AID; 7g)
  function defense(W, b, a, kind) {
    const S = W.islands[b], r = rulerOf(W, b), g = gateFor(W, b, a);
    let n = G().gateGuards(S, g).reduce((s, p) => s + fighter(p), 0) * tech(S.level);
    if (r !== b) {
      n += (S.garrison ? S.garrison.troops.filter((x) => x.p.alive) : []).reduce((s, x) => s + fighter(x.p), 0) * tech(W.islands[r].level);
      n += RULER_AID * living(W.islands[r]).filter((p) => !p.away && p.job === 'soldier').reduce((s, p) => s + fighter(p), 0) * tech(W.islands[r].level);
    }
    return n * wall(S.level) * ready(S);
  }
  function offense(W, a, day) { return powerOf(W, musterable(W, a, day), (i) => W.islands[i].level) * ready(W.islands[a]); }
  // cổng phía nào của đảo b hướng về đảo a (0: phía đảo b−1, 1: phía đảo b+1; render/map/map3d.js L.landing)
  const sideOf = (b, a) => { const d = (a - b + 6) % 6; return d === 0 ? 0 : d <= 3 ? 1 : 0; };

  /* ---------- Mở chiến dịch ---------- */
  // kind: 'raid' (đột kích, cướp kho) | 'conquer' (tổng tấn công, chiếm nhà chính); share: phần quân đem đi
  // surprise: đánh bất ngờ (người đứng đầu mưu mô)
  function launch(W, day, a, b, kind, share, rng, surprise) {
    const A = W.islands[a], B = W.islands[b], pool = musterable(W, a, day), route = warPath(W, a, b, day);
    if (pool.length < 2 || !route) return null;
    // lính: phần share, máu chiến nhất đi trước; dân binh: cũng phần share
    const pick = (L) => L.sort((x, y) => fighterX(y) - fighterX(x)).slice(0, Math.max(1, Math.round(L.length * share)));
    const troops = pick(pool.filter((x) => !x.levy)).concat(pick(pool.filter((x) => x.levy)));
    const gen = ['general1', 'general2'].map((k) => A.seats[k]).filter((id) => id != null).map((id) => A.people.get(id)).find((p) => p && p.alive && !p.away);
    if (gen) troops.unshift({ i: a, p: gen, levy: false });
    const id = W.nextId++, days = pathDays(route);
    for (const x of troops) x.p.away = id;
    // gọi quân: tập hợp ở cổng MUSTER ngày (người nhà ra tiễn) rồi mới lên đường
    const w = { id, a, b, kind, troops, n0: troops.length, start: day, depart: day + MUSTER, arrive: day + MUSTER + days, by: 'bridge', path: route, from: route[route.length - 2], stage: 'muster', morale: 1, since: day, helpers: [], loot: {}, gen: gen ? gen.id : null, surprise: !!surprise };
    // vũ khí theo thời (logic/arms.js): người bắn xa, người cận chiến, máy công thành (tốn tài nguyên)
    if (BK.Arms) BK.Arms.equip(W, w);
    w.popB = living(W.islands[b]).length; // (đo đạc: dân đảo bị đánh lúc khởi binh, tools/calibrate.js)
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
    const lv = troops.filter((x) => x.levy).length, eng = (w.engines || []).length, who = troops.length + ' quân' + (lv ? ' (' + lv + ' dân binh)' : '') + (BK.Arms ? ', ' + BK.Arms.NAME[BK.Arms.kit(A.level).ranged] + (eng ? ', ' + eng + ' ' + BK.Arms.ENGINE[w.engines[0].kind].name : '') : '');
    say(W, day, A.name + (kind === 'raid' ? ' đem ' + who + ' sang đột kích ' : surprise ? ' lặng lẽ đem ' + who + ' sang đánh úp ' : ' tuyên chiến, đem ' + who + ' sang đánh ') + B.name + ' (qua ' + (route.length - 1) + ' cây cầu, ' + days + ' ngày).', [a, b]);
    note(A, day, 'war', (kind === 'raid' ? 'Quân lên đường đột kích ' : 'Quân lên đường đánh ') + B.name + '.', gen ? [gen.id] : []);
    // tổng tấn công là chuyện lớn của cả bể (biên niên độ lớn 3, máy quay theo chặng tiễn quân); đột kích nhỏ hơn
    if (BK.Chronicle) BK.Chronicle.add(W, day, a, A.name + (kind === 'raid' ? ' đột kích ' : ' khởi binh đánh ') + B.name, kind === 'raid' ? 2 : 3, 'gate');
    // đánh úp thì bên kia (và đồng minh) không biết trước; biết trước thì người đứng đầu đa nghi có thể phá cầu chặn đường
    // (logic/strategy.js onAttacked): cầu gãy thì không còn đường sang, quân quay về
    if (!surprise) {
      note(B, day, 'war', 'Tin báo: quân ' + A.name + ' đang kéo sang.'); callAllies(W, day, w, rng);
      if (BK.Strategy.onAttacked) BK.Strategy.onAttacked(W, day, b, w.from, rng); // phá cầu cuối: quân phải quay về (warStep)
    }
    sendOff(W, day, w);
    return w;
  }
  // tập hợp quân: quân đứng ở cổng ra phía đảo kia (cổng phụ đầu cầu) tới ngày lên đường (game/cities.js vẽ). (Bước 12: bỏ cảnh
  // người nhà ra tiễn)
  function sendOff(W, day, w) {
    const A = W.islands[w.a], ids = w.troops.filter((x) => x.i === w.a).map((x) => x.p.id);
    A.situ.muster = { war: w.id, gate: G().gateOf(sideOf(w.a, w.path[1]), true), until: w.depart, troops: ids, to: W.islands[w.b].name };
    A.situChanged = true;
  }
  // đồng minh của bên bị đánh (và của đảo cai quản nó) xét gửi quân giúp
  function callAllies(W, day, w, rng) {
    const b = rulerOf(W, w.b);
    // đảo cai quản giữ đất của mình: đảo bị đánh là đảo nó đang cai quản thì nó gửi quân sang giữ (7g: không có luật này thì
    // một đảo bị sáp nhập thành miếng mồi bị chuyền tay hàng chục lần)
    if (b !== w.b && b !== w.a && D().alive(W, b) && warPath(W, b, w.b, day) && !W.wars.some((x) => x !== w && (x.a === b || x.b === b))) { // (không tính chính trận này)
      const L = living(W.islands[b]).filter((p) => !p.away && p.job === 'soldier'), k = Math.floor(L.length * RULER_AID);
      if (k >= 1) {
        const sent = L.slice(0, k).map((p) => { p.away = w.id; return { i: b, p }; });
        w.helpers.push({ c: b, troops: sent, arrive: day + pathDays(warPath(W, b, w.b, day)) });
        say(W, day, W.islands[b].name + ' gửi ' + k + ' quân sang giữ ' + W.islands[w.b].name + '.', [b, w.b]);
      }
    }
    for (const T of W.treaties) {
      if (T.kind !== 'alliance' || T.until <= day || (T.a !== b && T.b !== b)) continue;
      const c = T.a === b ? T.b : T.a; if (c === w.a || !D().alive(W, c) || atWar(W, c) || !warPath(W, c, w.b, day)) continue; // (qua cầu mới sang giúp được)
      const M = BK.Strategy.mind(W.islands[c]); if (!M) continue;
      const t = M.t, yes = 0.25 + 0.4 * W.rel[c][b].trust + 0.3 * t.aggression - 0.3 * t.fear;
      if (!rng.chance(Math.max(0.05, Math.min(0.9, yes)))) { note(W.islands[c], day, 'war', 'Không gửi quân giúp ' + W.islands[b].name + '.'); continue; }
      const L = living(W.islands[c]).filter((p) => !p.away && p.job === 'soldier'), k = Math.floor(L.length * 0.35); if (k < 1) continue;
      const sent = L.slice(0, k).map((p) => { p.away = w.id; return { i: c, p }; });
      w.helpers.push({ c, troops: sent, arrive: day + pathDays(warPath(W, c, w.b, day)) });
      W.rel[w.b][c].trust = Math.min(1, W.rel[w.b][c].trust + 0.2);
      say(W, day, W.islands[c].name + ' gửi ' + k + ' quân sang giúp ' + W.islands[w.b].name + '.', [c, w.b]);
    }
  }

  // nhà chính bị vây (design/ke-hoach-khac-phuc.md mục 5.1): tin khẩn tới các đảo thân, quân đang trên đường thì đi gấp; đảo
  // tin cậy đảo bị đánh hay thù kẻ đánh thì có thể gửi quân, đi nhanh gấp đôi (cứu viện phút chót)
  function lastCall(W, day, w, rng) {
    const b = rulerOf(W, w.b);
    for (const h of w.helpers) if (h.arrive > day) h.arrive = day + (h.arrive - day) * 0.5;
    for (let c = 0; c < W.islands.length; c++) {
      if (c === w.a || c === w.b || c === b || !D().alive(W, c) || atWar(W, c) || w.helpers.some((h) => h.c === c) || !warPath(W, c, w.b, day)) continue;
      const M = BK.Strategy.mind(W.islands[c]); if (!M) continue;
      const tr = W.rel[c][b].trust, foe = W.rel[c][w.a].grudge, t = M.t;
      if (tr < 0.3 && foe < 0.5) continue;
      if (!rng.chance(Math.max(0, Math.min(0.8, RESCUE * (0.2 + tr + foe + 0.4 * t.aggression - 0.4 * t.fear))))) continue;
      const L = living(W.islands[c]).filter((p) => !p.away && p.job === 'soldier'), k = Math.floor(L.length * 0.3); if (k < 1) continue;
      const sent = L.slice(0, k).map((p) => { p.away = w.id; return { i: c, p }; });
      w.helpers.push({ c, troops: sent, arrive: day + pathDays(warPath(W, c, w.b, day)) * 0.5, why: tr >= foe ? 'tin cậy ' + W.islands[w.b].name : 'thù ' + W.islands[w.a].name });
      say(W, day, W.islands[c].name + ' nhận tin ' + W.islands[w.b].name + ' bị vây nhà chính, gửi gấp ' + k + ' quân sang.', [c, w.b]);
    }
  }

  /* ---------- Trúng đạn, ngã xuống ---------- */
  // một phát trúng: mất máu, hết máu thì ngã (fall). Trả về true nếu ngã
  // by: người bắn { i, p } nếu biết (đứng đối diện trong tuyến); phát trúng trên đảo (field) ghi vào W.hitLog cho phần vẽ
  function hurt(W, day, x, enemy, rng, field, by) {
    const p = x.p; if (!p.alive) return false;
    const was = p.hp == null ? 100 : p.hp, dmg = rng.range(HIT_MIN, HIT_MAX);
    p.hp = was - dmg; p.hurtAt = day;
    const kill = p.hp <= 0;
    if (field && field.isle != null) {
      const L = W.hitLog || (W.hitLog = []); W.hitSeq = (W.hitSeq || 0) + 1;
      L.push({ seq: W.hitSeq, isle: field.isle, i: x.i, id: p.id, by: by && by.p ? by.p.id : null, byI: by ? by.i : null, eng: !!(by && by.eng), ambush: !!(by && by.ambush), dmg: Math.min(was, dmg), kill });
      if (L.length > HIT_LOG) L.splice(0, L.length - HIT_LOG);
    }
    if (!kill) return false;
    p.hp = 0; fall(W, day, x, enemy, rng, field); return true;
  }
  const hitChance = (k) => Math.min(0.9, k * HITS);
  function fall(W, day, x, enemy, rng, field) {
    // p.abroad: ngã xuống ở đảo khác (đang đi đánh, đóng giữ): đảo nhà làm lễ tưởng niệm, không có thi thể (logic/scenes.js)
    const p = x.p, S = W.islands[x.i]; p.alive = false; p.died = day; p.cause = 'chiến tranh'; p.abroad = !!p.away; p.away = null; S.deaths++;
    // người ngã nằm lại trên chiến trường (đảo bị đánh, chỗ đang đánh) tới hết trận (phần vẽ: render/war3d.js)
    if (field) { const F = W.islands[field.isle], list = F.fallen || (F.fallen = []); list.push({ id: p.id, i: x.i, at: field.at, day, sex: p.sex }); if (list.length > FALLEN_MAX) list.splice(0, list.length - FALLEN_MAX); }
    if (p.role) S.situ.mourning = day + 4;
    note(S, day, 'death', P().fullName(p) + ' ngã xuống trong trận với ' + W.islands[enemy].name + '.', [p.id]);
    // người thân của người chết thù bên kia (truyền đời qua quan hệ hai đảo)
    W.rel[rulerOf(W, x.i)][enemy].grudge = Math.min(1, W.rel[rulerOf(W, x.i)][enemy].grudge + GRUDGE_DEATH);
    if (x.i !== rulerOf(W, x.i)) W.rel[x.i][enemy].grudge = Math.min(1, W.rel[x.i][enemy].grudge + GRUDGE_DEATH);
  }
  // hàng đầu của một bên (FRONT người còn sống đứng trước nhất theo thứ tự trong đội: render/village3d.js xếp hàng theo thứ tự đó):
  // đạn chỉ tới được người đứng trong tầm, nên người trúng đạn và người bắn đều là người hàng đầu; hàng đầu ngã thì hàng sau lên
  // thay (số phát trúng vẫn như cũ, chỉ đổi người trúng)
  const FRONT = 8;
  const frontOf = (list) => { const out = []; for (const x of list) { if (x.p.alive) out.push(x); if (out.length >= FRONT) break; } return out; };
  BK.WarFront = frontOf; // (logic/arms.js dùng chung)
  // một đợt đánh dài dt ngày giữa hai nhóm: mỗi người có thể ngã, khả năng theo tỉ lệ sức; trả về số ngã mỗi bên
  function clash(W, day, att, def, attLv, defLv, defBonus, w, rng, dt) {
    const A = powerOf(W, att, attLv) * w.morale, Dp = powerOf(W, def, defLv) * defBonus;
    if (!att.length || !def.length) return [0, 0];
    const pa = dt * Math.max(0.01, Math.min(0.4, KILL * Dp / Math.max(0.1, A))), pd = dt * Math.max(0.01, Math.min(0.4, KILL * A / Math.max(0.1, Dp)));
    const field = w.id != null && w.field ? { isle: w.b, at: w.field } : null;
    let na = 0, nd = 0;
    // số phát trúng mỗi bên như cũ (mỗi người một lần gieo); người trúng là người hàng đầu, người bắn là người hàng đầu bên kia
    const ha = att.filter((x) => x.p.alive && rng.chance(hitChance(pa * rng.range(0.6, 1.4)))).length, hd = def.filter((x) => x.p.alive && rng.chance(hitChance(pd * rng.range(0.6, 1.4)))).length;
    for (let k = 0; k < ha; k++) { const fa = frontOf(att), fd = frontOf(def); if (!fa.length) break; if (hurt(W, day, fa[k % fa.length], w.b, rng, field, fd.length ? fd[k % fd.length] : null)) na++; }
    for (let k = 0; k < hd; k++) { const fa = frontOf(att), fd = frontOf(def); if (!fd.length) break; if (hurt(W, day, fd[k % fd.length], w.a, rng, field, fa.length ? fa[k % fa.length] : null)) nd++; }
    return [na, nd];
  }

  /* ---------- Diễn biến từng đợt (dt ngày, logic/world.js gọi mỗi bước cố định) ---------- */
  function warStep(W, day, w, rng, dt) {
    // người ngã trong các kịch bản (logic/battles.js): at là chỗ ngã trên đảo bị đánh, 'sea' thì ngã ngoài biển (không thi thể)
    // (một phát trúng: F; chết hẳn, như thua đấu tướng: F.kill)
    const F = (x, enemy, at, by) => hurt(W, day, x, enemy, rng, at === 'sea' ? null : { isle: w.b, at: at || w.gate }, by);
    F.kill = (x, enemy, at) => fall(W, day, x, enemy, rng, at === 'sea' ? null : { isle: w.b, at: at || w.gate });
    F.chance = hitChance;
    if (w.kind === 'revolt') return uprisingStep(W, day, w, rng, dt);
    const A = W.islands[w.a], B = W.islands[w.b];
    w.troops = w.troops.filter((x) => x.p.alive);
    for (const h of w.helpers) h.troops = h.troops.filter((x) => x.p.alive);
    if (w.stage === 'muster') {
      if (day < w.depart) return;
      w.stage = 'march'; if (A.situ.muster && A.situ.muster.war === w.id) { A.situ.muster = null; A.situChanged = true; }
    }
    if (w.stage === 'march') {
      // tên lửa (logic/missiles.js): quân sắp tới thì bắn trước, trúng lúc quân vừa tới cổng
      if (!w.salvo && BK.Missiles && day >= w.arrive - BK.Missiles.FLIGHT) { w.salvo = true; BK.Missiles.salvo(W, day, w); }
      // cầu trên đường bị phá (logic/strategy.js onAttacked, diplomacy.js destroyBridge): không còn đường, quân quay về
      if (w.path && w.path.some((c, k) => k && !D().bridged(W, w.path[k - 1], c))) { if (BK.Arms) BK.Arms.strand(w); return goHome(W, day, w, 'Cầu sang ' + B.name + ' bị phá, quân ' + A.name + ' phải quay về.'); }
      if (day < w.arrive) return;
      // tới nơi: đảo đó đã thuộc về mình (người khác đánh giúp) thì về
      if (rulerOf(W, w.b) === w.a) return goHome(W, day, w, 'Đảo ' + B.name + ' đã thuộc về ' + A.name + ', quân quay về.');
      // qua cầu thì đánh cổng phụ đầu cầu (logic/siege.js)
      // (w.peaceDay, w.since: xin hoà chỉ xét khi cổng đã bị nã đủ một ngày)
      w.stage = 'gate'; w.since = day; w.peaceDay = Math.floor(day); B.situ.warSide = sideOf(w.b, w.from); w.gate = G().gateOf(B.situ.warSide, true); w.field = w.gate;
      // mỗi trận giữ trạng thái trận của mình (w.sg); trên đảo hiện trận đang diễn ra (hai đảo cùng đánh một đảo thì trận vừa
      // chạy đợt sau cùng)
      w.sg = B.situ.siege = { war: w.id, from: w.a, bridge: w.from != null ? w.from : w.a, stage: 'gate', gate: w.gate, def: [], foes: [] };
      say(W, day, 'Quân ' + A.name + ' qua cầu, đánh cổng phụ ' + B.name + '.', [w.a, w.b]);
      note(B, day, 'war', 'Quân ' + A.name + ' đánh tới ' + G().nameOf(w.gate) + '.');
      // phục kích, đánh đêm, nội gián, đấu tướng, vây thành (logic/battles.js)
      if (BK.Battles) { BK.Battles.onArrive(W, day, w, rng, F); if (!w.troops.length) return lost(W, day, w, 'Cả đoàn quân ' + A.name + ' ngã xuống trên cầu.'); }
    }
    if (w.stage === 'gate' || w.stage === 'inside') { B.situ.war = day + 1.5; B.situChanged = true; }
    if (w.stage === 'gate') {
      const gate0 = G().hp(B, w.gate);
      // quân đồng minh tới nơi thì vào trận cùng bên thủ
      const helpers = w.helpers.filter((h) => h.arrive <= day).flatMap((h) => h.troops);
      const garrison = B.garrison ? B.garrison.troops.filter((x) => x.p.alive) : [];
      let def = gateDefenders(B, w.gate, day, w.b).concat(helpers, garrison);
      // bị đánh úp: ngày đầu chỉ một nửa người giữ cổng kịp ra trận
      // (đánh đêm: chỉ một phần ba)
      if (w.surprise && day - w.since < 1) { def = def.filter((x, k) => k % (w.night ? 3 : 2) === 0); note(B, day, 'war', 'Bị đánh úp, cổng ' + (B.situ.warSide ? 'phải' : 'trái') + ' chỉ có ' + def.length + ' người giữ.'); }
      // đấu tướng, vây thành, đào ngũ, cứu viện (logic/battles.js)
      if (BK.Battles) { const r = BK.Battles.gateStep(W, day, w, rng, dt, F, def); if (r === 'hold') { siegeView(B, w,
          w.blockade && !w.blockade.done ? 'blockade' : 'duel', def); return; } if (r === 'surrender') return annex(W, day, w.a, w.b, w,
          'hết lương vì bị vây'); if (!w.troops.length) return lost(W, day, w, 'Quân ' + A.name + ' tan rã trước cổng ' + B.name + '.'); }
      // người giữ cổng phải chạy tới cổng mới vào trận (lính gác cổng đứng sẵn ở đó): ai mới có tên trong đội giữ thì JOIN_DAYS ngày
      // sau mới bắn và mới bị bắn (phần vẽ: người đang chạy từ nhà ra cổng còn ở ngoài tầm)
      const joined = w.joined || (w.joined = {});
      for (const x of def) { const k = x.i + ':' + x.p.id; if (joined[k] == null) joined[k] = x.p.job === 'gatekeeper' || x.p.job === 'sideguard' || x.i !== w.b ? day - JOIN_DAYS : day; }
      const atGate = def.filter((x) => day - joined[x.i + ':' + x.p.id] >= JOIN_DAYS);
      // pha bắn xa, công thành, tên lửa đốt (logic/arms.js) trước khi áp sát
      if (BK.Arms) { BK.Arms.gateTick(W, day, w, atGate, dt, rng, (x, enemy, by) => hurt(W, day, x, enemy, rng, { isle: w.b, at: w.gate }, by), hitChance); def = def.filter((x) => x.p.alive); w.troops = w.troops.filter((x) => x.p.alive); }
      // cổng bị tên lửa, máy công thành phá thì người giữ mất chỗ dựa
      const [la, ld] = clash(W, day, w.troops, atGate.filter((x) => x.p.alive), lvOf(W), lvOf(W), wall(B.level) * ready(B) / ready(A) * (0.6 + 0.4 * G().hp(B, w.gate)), w, rng, dt);
      const fa = la / Math.max(1, w.troops.length), fd = ld / Math.max(1, def.length);
      // sĩ khí theo chênh lệch phần thiệt hại hai bên trong đợt này (mất nhiều hơn hẳn thì nản nhiều, ngang nhau thì giữ)
      if (la || ld) w.morale = Math.max(0, Math.min(1.2, w.morale + MORALE_K * (fd - fa)));
      w.morale = Math.max(0, w.morale - 0.01 * dt); // trận kéo dài thì mỏi
      w.troops = w.troops.filter((x) => x.p.alive);
      const left = def.filter((x) => x.p.alive);
      siegeView(B, w, 'gate', left);
      if (!w.troops.length) return lost(W, day, w, 'Cả đoàn quân ' + A.name + ' ngã xuống trước cổng ' + B.name + '.');
      if (w.morale < MORALE_RETREAT || w.troops.length < w.n0 * LOSS_RETREAT) return lost(W, day, w, 'Quân ' + A.name + ' núng thế, rút khỏi cổng ' + B.name + '.');
      // đột kích: trụ được ở cổng thì xông vào cướp kho rồi rút
      // (khuân hàng từ kho ra cổng LOOT_DAYS ngày, rồi rút)
      if (w.kind === 'raid' && day - w.since >= RAID_DAYS - 1 && w.morale > 0.5) { w.share = Math.min(1, powerOf(W, w.troops,
          (i) => W.islands[i].level) / Math.max(1, powerOf(W, left, (i) => W.islands[i].level) * wall(B.level))); w.stage = 'loot'; w.since = day; siegeView(B,
          w, 'loot', left); note(B, day, 'war', 'Quân ' + A.name + ' xông vào kho.'); return; }
      // quân đánh bắn phá cổng: mạnh hơn hẳn người giữ thì cổng mất máu nhanh; không còn ai giữ thì phá rất nhanh
      { const ratio = powerOf(W, w.troops, (i) => W.islands[i].level) * w.morale / Math.max(0.1, powerOf(W, left, (i) => W.islands[i].level) * wall(B.level));
        G().hit(B, w.gate, dt * (left.length ? GATE_HIT * Math.max(0, ratio * GATE_BREAK - 0.7) : GATE_EMPTY)); }
      if (!w.forceGate && !w.portal && G().hold) G().hold(B, w.gate, gate0 - dt / GATE_MIN_DAYS);
      if (w.forceGate || G().hp(B, w.gate) <= 0) {
        w.stage = 'inside'; w.since = day; w.siege = 'outer'; G().hit(B, w.gate, 1);
        const sg = w.sg; sg.targets = G().plan(B, rng); sg.at = 0; sg.hit = [];
        say(W, day, 'Cổng ' + B.name + ' vỡ, quân ' + A.name + ' tràn vào thành.', [w.a, w.b]);
        if (BK.Chronicle) BK.Chronicle.add(W, day, w.b, 'Cổng ' + B.name + ' vỡ trước quân ' + A.name, 3, w.gate);
        note(B, day, 'war', 'Cổng thành vỡ. Quân ' + A.name + ' đã vào thành.');
        civilians(W, day, w, rng);
        return;
      }
      // xin hoà: mỗi ngày xét một lần
      if (Math.floor(day) !== w.peaceDay && day - w.since >= 1) { w.peaceDay = Math.floor(day); maybePeace(W, day, w, rng); } // (bị nã đủ một ngày rồi mới xét)
      return;
    }
    if (w.stage === 'loot') { if (day - w.since >= LOOT_DAYS) return loot(W, day, w); return; }
    if (w.stage === 'inside') {
      if (w.kind === 'raid') return loot(W, day, w);
      const sg = w.sg;
      if (w.siege === 'outer') {
        // các công trình quanh thành trước: quân giặc phá từng chỗ; người nóng nảy và lính còn lại ra đánh trên phố
        const militia = gateDefenders(B, 'gate', day, w.b).concat(G().gateGuards(B, 'gateL').concat(G().gateGuards(B, 'gateR')).filter((p) => p.job === 'sideguard').map((p) => ({ i: w.b, p, levy: false })));
        w.field = 'ruin:' + (sg.targets[sg.at] || 'store');
        // dân binh chạy tới chỗ đang bị phá mới vào trận (như người giữ cổng: JOIN_DAYS)
        const joined = w.joined || (w.joined = {});
        for (const x of militia) { const k = x.i + ':' + x.p.id; if (joined[k] == null) joined[k] = day; }
        clash(W, day, w.troops, militia.filter((x) => day - joined[x.i + ':' + x.p.id] >= JOIN_DAYS), lvOf(W), lvOf(W), 0.8, w, rng, dt);
        // càn quét: dân thường ngoài đường bị bắn; ai trốn trong nhà thì ít bị hơn (giặc lục từng nhà)
        if (day - w.since >= CIV_CHASE) { const mil = new Set(militia.map((x) => x.p.id)), k = dt * CIV_HIT * Math.min(1, w.troops.length / 20);
          for (const p of living(B)) { if (p.away || mil.has(p.id) || B.seats.king === p.id) continue; const m = B.minds.get(p.id);
              if (!m || m.verb !== 'shelter') continue; if (rng.chance(hitChance(k)) && hurt(W, day, { i: w.b, p }, w.a, rng, { isle: w.b,
              at: 'refuge' }, w.troops[(p.id * 2) % Math.max(1, w.troops.length)])) w.civDead = (w.civDead || 0) + 1; } }
        w.troops = w.troops.filter((x) => x.p.alive);
        if (!w.troops.length) return lost(W, day, w, 'Dân ' + B.name + ' đánh bật quân ' + A.name + ' ra khỏi thành.');
        const left = militia.filter((x) => x.p.alive), next = G().ravage(B, sg, w.troops.length, left.length, dt);
        siegeView(B, w, 'outer', left);
        if (!next || day - w.since >= OUTER_DAYS) {
          // vây nhà chính: đội giữ thành vào trong
          w.siege = 'move'; w.since = day; w.moveUntil = day + TRANSIT; return;
        }
        return;
      }
      // đổi chặng: quân chạy qua phố tới nhà chính; dân binh, lính còn trên đường thì đánh hết mới tới
      if (w.siege === 'move') {
        const militia = gateDefenders(B, 'gate', day, w.b);
        clash(W, day, w.troops, militia, lvOf(W), lvOf(W), 0.8, w, rng, dt);
        w.troops = w.troops.filter((x) => x.p.alive);
        if (!w.troops.length) return lost(W, day, w, 'Dân ' + B.name + ' đánh bật quân ' + A.name + ' ra khỏi thành.');
        const left = militia.filter((x) => x.p.alive);
        siegeView(B, w, 'outer', left);
        if (day >= w.moveUntil && (left.length <= TRANSIT_LEFT || day - w.since >= TRANSIT_MAX)) {
          // vây nhà chính: đội giữ thành vào trong
          const team = G().hallTeam(B, day); w.siege = 'hall'; w.since = day; w.team = team.map((p) => p.id); w.team0 = Math.max(1, team.length); w.field = 'hall';
          const burnt = (sg.hit || []).map((k) => G().nameOf(k));
          say(W, day, 'Quân ' + A.name + ' vây nhà chính ' + B.name + (burnt.length ? ' (đã đốt phá ' + burnt.join(', ') + ')' : '') + '.', [w.a, w.b]);
          note(B, day, 'war', team.length + ' người vào giữ nhà chính.');
          lastCall(W, day, w, rng);
        }
        return;
      }
      // vây nhà chính: đội giữ thành đánh từ trong ra; chết hết hay người đứng đầu đầu hàng thì mất thành
      const team = w.team.map((id) => B.people.get(id)).filter((p) => p && p.alive && !p.away).map((p) => ({ i: w.b, p, levy: !G().isGuard(p), vol: !G().isGuard(p) && !p.role }));
      // quân cứu viện tới khi nhà chính đang bị vây: vào đánh cùng đội giữ nhà chính (cứu viện phút chót)
      for (const h of w.helpers) if (h.arrive <= day) {
        if (!h.hallTold && h.troops.length) { h.hallTold = true; h.told = true; w.morale = Math.max(0, w.morale - 0.25); const bs = W.battleStats || (W.battleStats = {}); bs.rescue = (bs.rescue || 0) + 1;
          say(W, day, 'Quân ' + W.islands[h.c].name + ' tới cứu viện ' + B.name + ' đúng lúc nhà chính sắp mất' + (h.why ? ' (' + h.why + ')' : '') + '.', [h.c, w.b, w.a]);
          if (BK.Chronicle) BK.Chronicle.add(W, day, w.b, 'Được ' + W.islands[h.c].name + ' cứu viện phút chót', 4, 'hall'); }
        team.push(...h.troops.filter((x) => x.p.alive)); }
      clash(W, day, w.troops, team, lvOf(W), lvOf(W), HALL_WALL * wall(B.level) * ready(B), w, rng, dt);
      w.troops = w.troops.filter((x) => x.p.alive);
      const left = team.filter((x) => x.p.alive);
      siegeView(B, w, 'hall', left);
      if (!w.troops.length || (w.troops.length < w.n0 * LOSS_RETREAT * 0.5 && left.length > w.troops.length)) return lost(W, day, w, 'Đội giữ nhà chính ' + B.name + ' đánh bật quân ' + A.name + '.');
      if (!left.length) return annex(W, day, w.a, w.b, w);
      // bắn phá nhà chính (máy công thành góp sức): nhà chính hết máu thì sụp, mất thành
      { const ratio = powerOf(W, w.troops, (i) => W.islands[i].level) * w.morale / Math.max(0.1, powerOf(W, left, (i) => W.islands[i].level) * HALL_WALL * wall(B.level));
        const eng = (w.engines || []).reduce((s, e) => s + ((BK.Arms && BK.Arms.ENGINE[e.kind] && BK.Arms.ENGINE[e.kind].gate) || 0), 0) * 0.3;
        G().hit(B, 'hall', dt * (HALL_HIT * Math.min(3, ratio) + eng));
        if (G().hp(B, 'hall') <= 0) { say(W, day, 'Nhà chính ' + B.name + ' sụp dưới làn đạn của quân ' + A.name + '.', [w.a, w.b]); return annex(W, day, w.a, w.b, w, 'nhà chính sụp'); } }
      const hallLost = 1 - G().hp(B, 'hall'), q = Math.floor(hallLost * 4), quarter = q > (w.yieldQ || 0);
      if (Math.floor(day) !== w.yieldDay || quarter) {
        w.yieldDay = Math.floor(day); w.yieldQ = Math.max(w.yieldQ || 0, q);
        const why = G().surrender(B, 1 - left.length / w.team0, day - w.since, rng, hallLost, quarter);
        if (why) { W.warStats.surrender = (W.warStats.surrender || 0) + 1; return annex(W, day, w.a, w.b, w, why); }
      }
    }
    if (w.stage === 'return' && day >= w.arrive) home(W, day, w);
  }
  // trận trên đảo b lúc này cho bộ não (logic/siege.js roleOf) và phần vẽ: ai đang giữ (def), quân giặc (foes), chỗ đang đánh
  function siegeView(B, w, stage, def) {
    const sg = w.sg || (w.sg = { war: w.id, from: w.a, gate: w.gate }); B.situ.siege = sg;
    sg.stage = stage; sg.def = def.filter((x) => x.i === w.b).map((x) => x.p.id); sg.foes = w.troops.map((x) => ({ i: x.i, id: x.p.id }));
    sg.target = stage === 'outer' && sg.targets ? sg.targets[sg.at] || null : null;
    sg.duel = w.duel && !w.duel.done ? { a: w.duel.a, ai: w.a, b: w.duel.b } : null; // đấu tướng (logic/battles.js)
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
    if (BK.Chronicle) BK.Chronicle.add(W, day, w.b, 'Bị ' + A.name + ' cướp kho', 2, 'store');
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
    if (BK.Battles && w.stage === 'gate') BK.Battles.onRepelled(W, day, w, W.rng); // tù binh, anh hùng giữ cổng
    if (BK.Chronicle) BK.Chronicle.add(W, day, w.b, 'Giữ được thành trước ' + w.n0 + ' quân ' + W.islands[w.a].name, w.n0 >= 10 ? 3 : 2, w.gate);
    goHome(W, day, w, null, false);
  }
  // quân quay về: đi đường thật; quân đồng minh về ngay khi hết trận
  function goHome(W, day, w, text, won) {
    if (text) say(W, day, text, [w.a, w.b]);
    for (const h of w.helpers) for (const x of h.troops) x.p.away = null;
    w.helpers = []; W.islands[w.b].situ.war = Math.min(W.islands[w.b].situ.war, day + 0.5);
    const sg = W.islands[w.b].situ.siege; if (sg && sg === w.sg) { W.islands[w.b].situ.siege = null; W.islands[w.b].situChanged = true; }
    w.stage = 'return'; w.won = !!won; w.depart = day; w.arrive = day + (w.path ? pathDays(w.path) : D().travelDays(W, w.b, w.a));
  }
  function home(W, day, w) {
    const A = W.islands[w.a], sa = E().state(A).stock;
    for (const x of w.troops) x.p.away = null;
    for (const r in w.loot) sa[r] = Math.min(E().CAP(A.level, r), sa[r] + w.loot[r]);
    if (w.won) W.warStats.won++;
    if (BK.Battles) BK.Battles.onHome(W, day, w); // khải hoàn hay đón quân trong im lặng
    note(A, day, 'war', 'Quân về tới nhà, còn ' + w.troops.length + '/' + w.n0 + ' người' + (Object.keys(w.loot).length ? ', mang theo chiến lợi phẩm.' : '.'));
    W.wars.splice(W.wars.indexOf(w), 1);
  }

  /* ---------- Sáp nhập ---------- */
  // why: người đứng đầu đầu hàng (lý do), không có thì đội giữ thành đã ngã hết
  function annex(W, day, a, b, w, why) {
    const A = W.islands[a], B = W.islands[b], sa = E().state(A).stock, sb = E().state(B).stock, stB = E().state(B);
    // đo đạc (tools/calibrate.js): dân lúc khởi binh, dân thường chết vì càn quét, dân lúc mất thành; một năm sau ghi dân còn lại
    if (w) (W.cityLoss || (W.cityLoss = [])).push({ b, day: Math.floor(day), pop0: (w && w.popB) || living(B).length, civ: (w && w.civDead) || 0, popAt: living(B).length, pop1: null });
    // kho: chuyển hết sang đảo thắng, lương thực để lại đủ cho dân RESERVE_DAYS ngày
    // đầu hàng để cứu dân (design/ke-hoach-khac-phuc.md mục 5.2) thì có điều kiện: giữ lại KEEP_YIELD phần kho, người đứng đầu cũ
    // giữ ghế, cai quản thay cho đảo thắng
    const yielded = why === 'cứu dân', share = yielded ? 1 - KEEP_YIELD : 1;
    for (const r of E().RES) { const keep = r === 'food' ? Math.min(sb.food, stB.eaten * RESERVE_DAYS) : 0, k = (sb[r] - keep) * share; if (k > 0) { sa[r] = Math.min(E().CAP(A.level, r), sa[r] + k); sb[r] -= k; } }
    const was = B.annexedBy;
    if (B.garrison) { for (const x of B.garrison.troops) x.p.away = null; B.garrison = null; }
    B.annexedBy = a; B.annexDay = day; B.unrest = 0.3;
    // quân đóng giữ: một phần quân thắng ở lại (người đảo a), về sau GARRISON_DAYS ngày
    if (w) { const k = Math.floor(w.troops.length * GARRISON_SHARE), stay = w.troops.filter((x) => x.i === a).slice(-k);
        for (const x of stay) x.p.away = 'garrison'; w.troops = w.troops.filter((x) => !stay.includes(x)); B.garrison = { troops: stay,
        until: day + GARRISON_DAYS }; if (stay.length) note(B, day, 'war', stay.length + ' lính ' + A.name + ' ở lại đóng giữ.'); }
    // các đảo b đang cai quản cũng sang tay a
    for (const j of vassalsOf(W, b)) { W.islands[j].annexedBy = a; say(W, day, W.islands[j].name + ' (đang thuộc ' + B.name + ') nay thuộc về ' + A.name + '.', [j, a]); }
    W.treaties = W.treaties.filter((t) => t.a !== b && t.b !== b);
    if (B.situ.siege) { B.situ.siege = null; B.situChanged = true; }
    W.rel[b][a].grudge = Math.min(1, W.rel[b][a].grudge + GRUDGE_ANNEX); W.rel[b][a].trust = 0;
    W.annexations++;
    // người cai quản: một người trong hội đồng đảo thắng sang ngồi ghế vua; vua cũ bị phế
    const old = B.seats.king != null ? B.people.get(B.seats.king) : null;
    if (yielded && old && old.alive) {
      old.governor = a; B.situ.kneel = { id: old.id, until: day + 1.2, ruler: a };
      note(B, day, 'seat', P().fullName(old) + ' đầu hàng, được giữ ghế, cai quản đảo thay ' + A.name + '.', [old.id]);
    } else if (old && old.alive) {
      old.role = null; note(B, day, 'seat', P().fullName(old) + ' bị phế.', [old.id]);
      // người đứng đầu cũ bị dẫn ra quỳ ở sân nhà chính; cờ đảo cũ hạ xuống, cờ đảo thắng kéo lên (phần vẽ: B.annexDay)
      B.situ.kneel = { id: old.id, until: day + 1.2, ruler: a };
    }
    const asked = why === 'xin làm chư hầu';
    if (asked) { W.rel[b][a].grudge = Math.max(0, W.rel[b][a].grudge - GRUDGE_ANNEX * 0.7); B.unrest = 0.1; } // tự xin: ít oán hơn bị đánh chiếm
    if (asked) say(W, day, (old ? P().fullName(old) : 'Người đứng đầu') + ' ' + B.name + ' thấy không thể chống nổi, tự xin làm chư hầu ' + A.name + '.', [a, b]);
    else if (why) say(W, day, (old ? P().fullName(old) : 'Nhà chính') + ' ' + B.name + ' đầu hàng ' + A.name + (why === 'cứu dân' ? ' để cứu dân.' : ' (' + why + ').'), [a, b]);
    if (!(yielded && old && old.alive)) B.seats.king = null;
    const pick = B.seats.king != null ? null : ['advisor', 'general2', 'priest', 'merchant'].map((k) => A.seats[k]).filter((id) => id != null).map((id) => A.people.get(id)).find((p) => p && p.alive && !p.away);
    if (pick) {
      const g = P().create({ id: B.nextId++, name: pick.name, clan: pick.clan, sex: pick.sex, born: pick.born, genome: pick.genome, gen: pick.gen });
      g.traits = pick.traits; g.epi = pick.epi; g.governor = a; g.role = 'king'; g.from = A.key; g.job = null;
      B.people.set(g.id, g); B.seats.king = g.id;
      // người đi cai quản rời đảo cũ (không phải chết: không tính vào số người mất)
      A.seats[pick.role] = null; pick.role = null; pick.alive = false; pick.left = b; pick.cause = 'sang cai quản ' + B.name;
      note(A, day, 'seat', P().fullName(pick) + ' sang cai quản ' + B.name + '.', [pick.id]);
      note(B, day, 'seat', P().fullName(g) + ' từ ' + A.name + ' sang cai quản đảo.', [g.id]);
    }
    B.techDay = day;
    if (!asked) say(W, day, A.name + ' chiếm nhà chính ' + B.name + '. ' + B.name + (was != null ? ' (vốn thuộc ' + W.islands[was].name + ')' : '') + ' bị sáp nhập vào ' + A.name + '.', [a, b]);
    note(B, day, 'war', asked ? 'Đảo xin làm chư hầu ' + A.name + '.' : 'Nhà chính thất thủ. Đảo bị sáp nhập vào ' + A.name + '.');
    if (BK.Chronicle) BK.Chronicle.add(W, day, b, B.name + ' bị sáp nhập vào ' + A.name + (why ? ' (' + why + ')' : ''), 5, 'hall');
    if (B.wonders && B.wonders.length) say(W, day, (B.wonders.length > 1 ? B.wonders.length + ' kỳ quan' : 'Kỳ quan') + ' của ' + B.name + ' nay thuộc về ' + A.name + '.', [a, b]);
    note(A, day, 'war', 'Chiếm được ' + B.name + '.');
    if (w) goHome(W, day, w, null, true);
  }
  // đảo nhỏ tự xin làm chư hầu bá chủ (design/ke-hoach-khac-phuc.md mục 4.3, logic/strategy.js trySubmit): không đánh, không
  // càn quét, không quân đóng giữ; người đứng đầu cũ vẫn ra quỳ, bá chủ cử người sang cai quản như khi chiếm
  function submit(W, day, a, b) {
    if (W.islands[b].annexedBy != null || atWar(W, a) || atWar(W, b)) return false;
    W.warStats.vassal = (W.warStats.vassal || 0) + 1;
    annex(W, day, a, b, null, 'xin làm chư hầu');
    return true;
  }
  // thời thật của đảo bị chiếm (design/ke-hoach-khac-phuc.md mục 4.4): đảo giữ thời của chính mình, đảo cai quản chuyển công
  // nghệ dần, mỗi TECH_DAYS ngày lên một thời, tới bằng đảo cai quản trừ một (không bao giờ tụt thời)
  function syncEra(W, i, day) {
    const S = W.islands[i], R = W.islands[rulerOf(W, i)];
    if (S.level >= R.level - 1 || day - (S.techDay != null ? S.techDay : S.annexDay || 0) < TECH_DAYS) return;
    S.techDay = day; S.level++;
    if (BK.Construction) BK.Construction.setEra(S, S.level);
    if (BK.Dramas) BK.Dramas.onEra(S, S.rng);
    note(S, day, 'era', R.name + ' chuyển công nghệ: ' + S.name + ' sang ' + BK.Eras.of(S.level).name + '.');
    S.situChanged = true;
  }
  /* ---------- Đảo bị sáp nhập: nộp kho, bất bình, nổi dậy ---------- */
  function vassalDay(W, day, i, rng) {
    const S = W.islands[i], r = S.annexedBy, Rr = W.islands[r], st = E().state(S), sr = E().state(Rr).stock;
    // phần dư nộp về đảo cai quản
    const fixing = G().damaged(S).length > 0; // còn chỗ hư sau chiến tranh: giữ lại gỗ, đá để sửa (logic/siege.js)
    for (const res of E().RES) { const keep = res === 'food' ? st.eaten * RESERVE_DAYS : fixing && (res === 'wood' || res === 'stone') ? REPAIR_KEEP : 0,
        k = st.stock[res] - keep; if (k > 1) { const room = E().CAP(Rr.level, res) - sr[res], m = Math.max(0, Math.min(k, room)); sr[res] += m;
        st.stock[res] -= m; } }
    syncEra(W, i, day);
    // bất bình: thù hằn, tính nóng của dân, đói làm tăng; yên ổn lâu thì nguôi dần
    // quân đóng giữ: hết hạn thì về nhà
    if (S.garrison) { S.garrison.troops = S.garrison.troops.filter((x) => x.p.alive);
        if ((day >= S.garrison.until && (S.unrest || 0) < CALM_UNREST) || !S.garrison.troops.length) { for (const x of S.garrison.troops) x.p.away = null;
        if (S.garrison.troops.length) note(S, day, 'war', 'Quân ' + Rr.name + ' đóng giữ rút về.'); S.garrison = null; } }
    const L = living(S).filter((p) => !p.governor && P().ageOf(p, day) >= BK.Rules.ADULT_AGE);
    if (!L.length) return;
    const hot = L.reduce((s, p) => s + P().traits(p).aggression, 0) / L.length, g = W.rel[i][r].grudge;
    // đảo cai quản là bá chủ (từ năm 6, tới thời 10: logic/strategy.js) giàu mạnh, quân đông: dân đảo bị chiếm ít dám nổi dậy
    const boss = day >= 5 * 360 && Rr.level >= 10 ? 0.006 : 0;
    S.unrest = Math.max(0, Math.min(1, (S.unrest || 0) + 0.004 * (g + hot) + (st.hunger ? 0.01 : 0) - 0.004 - boss));
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
    for (const p of L) { if (p.away) continue; const t = P().traits(p); if (isGuard(p)) { if (rng.chance(0.15 + 0.4 * g)) rebels.push({ i, p });
        else if (!rng.chance(0.25 + 0.3 * t.fear + 0.2 * t.piety)) loyal.push({ i, p });
        } else if ((t.aggression > 0.6 || (t.ambition > 0.7 && t.fear < 0.5)) && rng.chance(0.7 * S.unrest)) rebels.push({ i, p, levy: true }); }
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
      if (BK.Chronicle) BK.Chronicle.add(W, day, w.a, S.name + ' giành lại độc lập từ ' + Rr.name, 4, 'hall');
      note(S, day, 'war', 'Giành lại độc lập.');
      BK.Council.update(S);
    } else {
      S.unrest = Math.max(0, S.unrest - 0.4); S.revoltFailed = day;
      say(W, day, 'Cuộc nổi dậy ở ' + S.name + ' bị dập tắt.', [w.a, w.b]);
      note(S, day, 'war', 'Cuộc nổi dậy bị dập tắt.');
    }
  }

  // mỗi bước cố định (logic/world.js gọi, dt ngày): diễn biến các trận
  function step(W, day, rng, dt) { for (const w of [...W.wars]) warStep(W, day, w, rng, dt); if (BK.Missiles) BK.Missiles.step(W, day); }
  // mỗi ngày: các đảo bị sáp nhập (nộp kho, bất bình, nổi dậy)
  // người bị thương không còn trong trận thì hồi máu mỗi ngày
  function healDay(W, day) { for (const S of W.islands) for (const p of S.people.values()) if (p.alive && p.hp != null && p.hp < 100 && day - (p.hurtAt || 0) >= 1) { p.hp = Math.min(100, p.hp + HEAL); if (p.hp >= 100) p.hp = null; } }
  function dayTick(W, day, rng) { healDay(W, day);
      for (const c of W.cityLoss || []) if (c.pop1 == null && day - c.day >= 360) c.pop1 = living(W.islands[c.b]).length; for (let i = 0; i < W.islands.length;
      i++) if (W.islands[i].annexedBy != null) vassalDay(W, day, i, rng); if (BK.Missiles) BK.Missiles.dayTick(W, day, rng);
      if (BK.Battles) BK.Battles.dayTick(W, day, rng); }
  // kết thúc một trận từ bên ngoài (đảo bị san phẳng bằng hạt nhân, logic/missiles.js): quân quay về
  const endWar = (W, day, w) => goHome(W, day, w, null, false);
  // quân giặc đang ở trên đảo i (cho phần vẽ, game/cities.js): người thật mặc màu đảo mình, mỗi người một việc theo chặng trận
  //   gate: đánh ở cổng, mỗi người nhắm một người giữ cổng; loot: khuân hàng từ kho ra cổng; outer: phá công trình đang nhắm;
  //   hall: vây đánh nhà chính. Quân đồng minh tới giúp, quân đóng giữ: cũng là người đảo khác trên đảo này.
  function onIsland(W, i) {
    const out = [], S = W.islands[i], key = (x) => 'w' + x.i + ':' + x.p.id;
    let sg = S.situ.siege;
    for (const w of W.wars) {
      if (w.kind === 'revolt' || w.b !== i || !['gate', 'loot', 'inside'].includes(w.stage)) continue;
      sg = w.sg || sg; const def = sg ? sg.def : [];
      // dân thường đang chạy nạn ngoài đường (không trốn trong nhà): quân càn quét nhắm vào họ
      const civ = w.stage === 'inside' && w.siege === 'outer' ? living(S).filter((p) => !p.away && def.indexOf(p.id) < 0 && (S.minds.get(p.id) || {}).verb === 'shelter').map((p) => p.id) : [];
      w.troops.forEach((x, k) => {
        const tgt = def.length ? def[k % def.length] : null;
        let mind;
        if (w.stage === 'gate' && w.blockade && !w.blockade.done && !(w.blockade.sortie > W.day)) mind = { state: 'work', verb: 'guard', place: w.gate, camp: true, reason: 'dựng trại vây thành' };
        else if (w.stage === 'gate' && w.duel && !w.duel.done) mind = x.p.id === w.duel.a ? { state: 'attack', target: w.duel.b, place: w.gate, duel: 'foe', reason: 'đấu tay đôi với tướng ' + S.name } : { state: 'work', verb: 'watchDuel', place: w.gate, camp: true, reason: 'xem tướng mình đấu tay đôi' };
        else if (w.stage === 'loot') mind = k % 2 ? { state: 'work', verb: 'guard', place: w.gate, cycle: { item: 'food', src: 'store', dst: w.gate,
            workAt: 'dst' }, reason: 'khuân hàng cướp được ra cổng' } : { state: 'attack', target: tgt, place: w.gate,
            reason: 'giữ cổng cho đồng đội khuân hàng' };
        else if (w.stage === 'gate') mind = { state: 'attack', target: tgt, place: w.gate, reason: 'đánh ' + G().nameOf(w.gate) };
        // vào thành: nửa quân càn quét dân thường đang chạy nạn (bắn người ngoài đường), nửa đốt phá công trình
        else if (w.siege === 'outer' && k % 2 === 0 && civ.length) mind = { state: 'attack', target: civ[(k >> 1) % civ.length], place: 'refuge', reason: 'càn quét, bắn dân thường chạy nạn' };
        else if (w.siege === 'outer') mind = { state: 'attack', target: tgt != null && k % 3 === 0 ? tgt : null, place: 'ruin:' + (sg && sg.target || 'store'), reason: 'đốt phá ' + G().nameOf(sg && sg.target || 'store') };
        else mind = { state: 'attack', target: tgt, place: 'hall', reason: 'vây đánh nhà chính' };
        // chỉ bắn xa; đứng vào hàng của quân đánh (render/village3d.js formation); qua cầu thì đứng trên mặt cầu
        // (bridge: đảo bên kia đầu cầu): cả đạo quân đứng trên mặt cầu bắn vào cổng phụ; cổng đổ mới vào thành
        mind.arm = 'ranged'; const ng = (w.engines || []).filter((e) => e.kind !== 'drone').length; // số xe đứng sau hàng quân trên cầu (render/village3d.js deckPlan)
        if (mind.camp) { mind.side = 'foe'; mind.rank = k; mind.of = w.troops.length; mind.ng = ng; mind.bridge = w.from != null ? w.from : w.a; } // trại vây, đứng xem đấu tướng: mỗi người một chỗ trong hàng
        if (mind.state === 'attack' && !(w.duel && !w.duel.done)) { mind.side = 'foe'; mind.rank = k; mind.of = w.troops.length; if (w.by === 'bridge' && (w.stage === 'gate' || w.stage === 'loot')) { mind.bridge = w.from != null ? w.from : w.a; mind.ng = ng; } }
        out.push({ key: key(x), i: x.i, p: x.p, mind, enter: w.gate, side: 'foe' });
      });
      let j = def.length; // quân đồng minh đứng tiếp vào hàng bên giữ
      for (const h of w.helpers) if (h.arrive <= W.day) for (const x of h.troops) if (x.p.alive) out.push({ key: key(x), i: x.i, p: x.p, mind: { state: 'attack', target: null, place: w.gate, reason: 'sang giúp giữ cổng', arm: 'ranged', side: 'def', rank: j++, of: j }, enter: w.gate, side: 'ally' });
    }
    let gk = 40; // quân đóng giữ đứng hàng sau của bên giữ
    if (S.garrison) for (const x of S.garrison.troops) if (x.p.alive && x.i !== i) out.push({ key: key(x), i: x.i, p: x.p,
        mind: S.situ.siege ? { state: 'attack', target: null, place: S.situ.siege.gate, reason: 'quân đóng giữ ra giữ cổng', arm: 'ranged', side: 'def',
        rank: gk++, of: gk } : { state: 'work', verb: 'patrol', place: 'patrol', reason: 'quân đóng giữ đi tuần' }, enter: 'gate', side: 'garrison' });
    return out;
  }
  return { init, rulerOf, vassalsOf, warPath, atWar, defense, offense, musterable, launch, annex, submit, endWar, step, dayTick, sideOf, wall, tech, onIsland, gateFor };
});
