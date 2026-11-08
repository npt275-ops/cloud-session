/* Bể Kính · logic/strategy.js · Não chiến lược của người đứng đầu mỗi đảo
 * (design/quy-trinh-tong-quat.md mục 6) Mỗi EVERY ngày, người đứng đầu từng đảo (ghế king, logic/council.js) xét tình hình:
 * thiếu gì cho thời sau, lương thực còn bao lâu, sức mạnh quân so với các đảo khác, quan hệ, rồi chọn nước đi. Quân sư và hai
 * tướng góp ý theo gen của chính họ (người đứng đầu đa nghi thì ít nghe, nhu nhược thì dễ bị kéo theo).
 * Tính cách đọc theo tính cách biểu hiện (gen gốc + ngoại gen, People.traits): người đói lâu hoá đa nghi, hiếu chiến thì
 * chiến lược cũng đổi theo.
 * Nước đi ở bước này:
 *   thế quân      tích quân (tăng phần người làm lính) hay giảm quân: hiếu chiến, đa nghi, sợ đảo khác mạnh hơn thì tích
 *   giao thương   đổi thứ dư lấy thứ thiếu: mưu mô, trí tuệ thì hay đi buôn và mặc cả giỏi; đa nghi mà ít tin cậy thì ngại
 *   hiệp ước      không xâm phạm, liên minh: mưu mô, trí tuệ, sợ hãi; bên kia cũng phải đồng ý. Hai đảo cùng sợ hay cùng thù
 *                 một đảo thứ ba (kẻ thù chung) thì dễ ký với nhau hơn, dễ thành liên minh (liên minh thì gửi quân giúp nhau)
 *   bắc cầu       (design/npc-song-that.md mục 7.2) muốn gần đảo bên cạnh: tin cậy, buôn bán nhiều, cùng sợ một kẻ thứ
 *                 ba, người quyết mưu mô hay trí tuệ; đa nghi, thù hằn thì ngại. Bên kia đồng ý hay không theo tính cách và
 *                 quan hệ. Lên thời thì xét xây lại cầu theo kiểu mới (tốn vật liệu). Kẻ hiếu chiến muốn đánh đảo bên cạnh mà
 *                 chưa có cầu thì tự bắc cầu quân sự. Bị đánh qua cầu thì người đa nghi có thể phá cầu (onAttacked).
 *   cho dân sang  đảo có cầu, tin nhau: vài người hoạt ngôn, ưa giao thiệp sang thăm chợ đảo bên (logic/diplomacy.js startVisit)
 *   cướp đoàn buôn  đoàn đi thuyền ngang qua đảo mình: người đứng đầu hiếu chiến, tham lam, đang thù hay đang đánh nhau với
 *                 một bên thì có thể cho thuyền ra chặn cướp (mỗi đoàn xét một lần); sùng đạo, sợ hãi thì thôi
 *   cứu đói       đảo mình đang cai quản bị đói: người đứng đầu hiền, trí tuệ thì gửi lương thực sang (dân bớt bất bình)
 *   mua lương thực gấp  kho lương thực còn dưới URGENT_DAYS ngày ăn hay đang đói thì không đợi kỳ xét: ngày nào còn thương
 *                 nhân rảnh là cho đoàn đi mua (người đứng đầu đa nghi vẫn có thể chần chừ, bên kia vẫn có thể từ chối)
 *   chiến tranh   đột kích (cướp kho rồi về) hay tổng tấn công (chiếm nhà chính, sáp nhập): hiếu chiến, tham vọng, thù hằn,
 *                 đang thiếu mà bên kia có, quân mình mạnh hơn hẳn; sợ hãi, sùng đạo, nhu nhược thì ngại. Đang có hiệp ước
 *                 thì chỉ người mưu mô cao, ít sùng đạo mới dám phản bội; có liên minh thì không. Diễn biến: logic/war.js
 *                 (cầu hoà, đồng minh gửi quân, nổi dậy cũng ở đó).
 * Mọi lựa chọn đều bốc thăm có trọng số (rng của cả bể), nghiêng theo tính cách và hoàn cảnh: cùng hoàn cảnh vẫn có thể khác.
 * Không vẽ gì, chạy được bằng Node. Cần: logic/diplomacy.js, logic/economy.js, logic/people.js, logic/war.js. */
(function (root, factory) {
  const BK = root.BK || (root.BK = {});
  BK.Strategy = factory(BK);
  if (typeof module === 'object' && module.exports) module.exports = BK.Strategy;
})(typeof self !== 'undefined' ? self : globalThis, function (BK) {
  'use strict';
  const EVERY = 10;
  const BASE_SOLDIERS = 0.25, MIN_SOLDIERS = 0.12, MAX_SOLDIERS = 0.5;
  const URGENT_DAYS = 20;
  const FIRST_WAR = 300, WAR_REST = 180, WAR_RATE = 0.8; // chưa ai đánh ai trong năm đầu; đánh xong một trận thì nghỉ chừng này ngày
  const CONQUER_PRIZE = 1.5;
  const REBUILD_AGE = 180;      // cầu dùng ít nhất chừng này ngày mới xét xây lại theo kiểu thời mới    // chiếm cả đảo là phần thưởng lớn hơn một lần cướp kho

  // tính cách của người quyết: người đứng đầu, pha ý quân sư và tướng (trọng số nghe theo tính người đứng đầu)
  function mind(S) {
    const P = BK.People, seat = (k) => (S.seats[k] != null ? S.people.get(S.seats[k]) : null), king = seat('king');
    if (!king || !king.alive) return null;
    const t = Object.assign({}, P.traits(king)), listen = Math.max(0.1, Math.min(0.6, 0.35 + 0.3 * t.meekness - 0.3 * t.paranoia));
    const adv = [seat('advisor'), seat('general1'), seat('general2')].filter((p) => p && p.alive);
    if (adv.length) for (const k in t) { const avg = adv.reduce((s, p) => s + P.traits(p)[k], 0) / adv.length; t[k] = t[k] * (1 - listen) + avg * listen; }
    return { who: king, t };
  }
  // sức mạnh quân: số lính × công nghệ của thời, cộng các đảo mình cai quản
  const strength0 = (S) => { const L = BK.Island.living(S); return L.filter((p) => p.job === 'soldier' || p.role === 'general1' || p.role === 'general2').length * (1 + 0.15 * (S.level - 1)) + 0.2 * L.length; };
  const strength = (S, W) => strength0(S) + (W ? W.islands.filter((V) => V.annexedBy === W.islands.indexOf(S)).reduce((s, V) => s + 0.5 * strength0(V), 0) : 0);

  function islandTick(W, i, day, rng) {
    const D = BK.Diplomacy, S = W.islands[i]; if (!D.alive(W, i)) return;
    const M = mind(S); if (!M) return;
    const t = M.t, E = BK.Economy, pol = S.policy || (S.policy = { soldierShare: BASE_SOLDIERS, stance: 'develop' });
    // sợ: đảo khác mạnh hơn mình (cập nhật quan hệ)
    const mine = strength(S, W);
    for (let j = 0; j < D.N; j++) if (j !== i && D.alive(W, j)) W.rel[i][j].fear = Math.max(0, Math.min(1, strength(W.islands[j], W) / Math.max(1, mine) - 1));
    const maxFear = Math.max(0, ...W.rel[i].map((r, j) => (j === i ? 0 : r.fear)));
    // thế quân: tích quân khi hiếu chiến, đa nghi, hay đang sợ, hoặc đang muốn đánh ai mà quân chưa đủ mạnh (pol.warlust, xét
    // ở tryWar kỳ trước); giảm quân khi hiền, tin người, đói hay lương thực còn dưới 30 ngày ăn (cần người làm)
    const est = E.state(S), short = est.hunger || est.stock.food < est.eaten * 30;
    const arm = 0.6 * t.aggression + 0.4 * t.paranoia + 0.5 * maxFear + 0.7 * (pol.warlust || 0) - 0.4 * t.meekness - (short ? 0.5 : 0);
    const target = Math.max(MIN_SOLDIERS, Math.min(MAX_SOLDIERS, BASE_SOLDIERS + 0.25 * (arm - 0.45) + (rng.next() - 0.5) * 0.04));
    const before = pol.stance; pol.soldierShare += (target - pol.soldierShare) * 0.5; pol.stance = pol.soldierShare > BASE_SOLDIERS + 0.05 ? 'arm' : 'develop';
    if (pol.stance !== before) S.log.push({ day: Math.floor(day), kind: 'policy', ids: [M.who.id], text: BK.People.fullName(M.who) + (pol.stance === 'arm' ? ' cho tích quân.' : ' cho giải bớt quân về làm ăn.') });
    // giao thương: thứ đang thiếu nhất, tìm đảo có dư, đưa thứ mình dư mà bên kia quý nhất
    const willTrade = 0.25 + 0.35 * t.cunning + 0.3 * t.intellect - 0.2 * t.paranoia;
    if (D.canSend(W, i) && rng.chance(Math.max(0.05, Math.min(0.95, willTrade)))) tryTrade(W, i, day, rng, t);
    // hiệp ước: sợ đảo khác, hay tin cậy ai đó, và người quyết mưu mô, trí tuệ
    const willPact = 0.1 + 0.3 * t.intellect + 0.25 * t.cunning + 0.3 * maxFear + 0.2 * t.fear - 0.3 * t.aggression;
    if (rng.chance(Math.max(0, Math.min(0.6, willPact * 0.25)))) tryTreaty(W, i, day, rng, t);
    // cầu, người qua lại
    tryBridge(W, i, day, rng, t);
    tryVisit(W, i, day, rng, t);
    // chiến tranh (logic/war.js)
    if (W.war) tryWar(W, i, day, rng, t);
  }

  // bắc cầu sang một đảo bên cạnh, hay xây lại cầu cũ theo kiểu thời mới
  function tryBridge(W, a, day, rng, t) {
    const D = BK.Diplomacy, A = W.islands[a];
    if (A.level < D.BRIDGE_LEVEL) return;
    for (const b of [(a + 1) % D.N, (a + D.N - 1) % D.N]) {
      if (!D.alive(W, b) || D.workOf(W, a, b) || (BK.War && BK.War.atWar(W, a))) continue;
      const B = W.islands[b], br = D.bridgeOf(W, a, b), R = W.rel[a][b];
      if (br) {
        // xây lại theo kiểu thời mới: cả hai đã lên thời cao hơn kiểu cầu, cầu đã dùng ít nhất REBUILD_AGE ngày (không ai phá cầu
        // mới tinh để xây lại), người quyết ham tiến (trí tuệ, tham vọng)
        const era = Math.min(A.level, B.level);
        if (era > br.era && day - br.day >= REBUILD_AGE && rng.chance(0.08 + 0.15 * t.intellect + 0.1 * t.ambition) && D.canPay(W, a, b, era)) {
          const M = mind(B); if (M && rng.chance(0.4 + 0.3 * M.t.intellect + 0.3 * W.rel[b][a].trust)) D.startBridge(W, day, a, b, 'rebuild');
        }
        continue;
      }
      if (B.level < D.BRIDGE_LEVEL) continue;
      const trips = Math.min(1, (W.tradeCount[D.pairKey(a, b)] || 0) / 6), foe = commonFoe(W, a, b);
      const want = 0.4 * R.trust + 0.35 * trips + 0.4 * foe + 0.2 * t.cunning + 0.2 * t.intellect - 0.35 * t.paranoia - 0.6 * R.grudge - 0.1;
      if (want <= 0 || !rng.chance(Math.min(0.5, want * 0.6))) continue;
      const M = mind(B); if (!M) continue;
      const tb = M.t, yes = 0.2 + 0.5 * W.rel[b][a].trust + 0.3 * trips + 0.3 * foe + 0.15 * tb.intellect - 0.35 * tb.paranoia - 0.6 * W.rel[b][a].grudge;
      if (!rng.chance(Math.max(0.02, Math.min(0.95, yes)))) { A.log.push({ day: Math.floor(day), kind: 'treaty', ids: [], text: B.name + ' từ chối bắc cầu.' }); continue; }
      if (D.startBridge(W, day, a, b, 'build')) return;
    }
  }
  // cho vài người sang thăm chợ đảo bên qua cầu (đảo tin nhau, không thù)
  function tryVisit(W, a, day, rng, t) {
    const D = BK.Diplomacy, A = W.islands[a];
    for (const b of [(a + 1) % D.N, (a + D.N - 1) % D.N]) {
      if (!D.alive(W, b) || !D.bridged(W, a, b) || W.rel[a][b].trust < 0.15 || (BK.War && BK.War.atWar(W, a))) continue;
      if (!rng.chance(0.3 + 0.4 * W.rel[a][b].trust - 0.3 * t.paranoia)) continue;
      // người đi: người đi đường, người làm, ưa giao thiệp (ít đa nghi), người lớn
      const P = BK.People, pool = BK.Island.living(A).filter((p) => !p.away && !p.role && (p.job === 'walker' || p.job === 'worker' || p.job === 'trader') && P.ageOf(p, day) >= 18 && P.traits(p).paranoia < 0.5);
      const n = Math.min(pool.length, 1 + Math.floor(rng.next() * 3));
      for (let k = 0; k < n; k++) { const p = pool.splice(Math.floor(rng.next() * pool.length), 1)[0]; D.startVisit(W, day, p, a, b, p.job === 'trader' ? 'trade' : 'market', 'market', rng); }
    }
  }
  // bị đảo a đánh: đảo b có cầu sang a thì người đứng đầu đa nghi có thể phá cầu để chặn đường (logic/war.js gọi khi biết tin)
  function onAttacked(W, day, b, a, rng) {
    const D = BK.Diplomacy; if (!D.bridged(W, a, b) && !D.workOf(W, a, b)) return false;
    const M = mind(W.islands[b]); if (!M) return false;
    const t = M.t; if (!rng.chance(Math.max(0, Math.min(0.9, -0.1 + 0.9 * t.paranoia + 0.3 * t.fear - 0.2 * t.aggression)))) return false;
    return D.destroyBridge(W, day, a, b, b);
  }

  // xét đánh ai: đột kích hay tổng tấn công, theo tính cách, nhu cầu, thù hằn và tương quan sức
  function tryWar(W, a, day, rng, t) {
    const D = BK.Diplomacy, E = BK.Economy, Wr = BK.War, A = W.islands[a], pol = A.policy;
    if (day < FIRST_WAR || Wr.atWar(W, a) || (pol.lastWar != null && day - pol.lastWar < WAR_REST)) return;
    // tên lửa phá cổng trước, hạt nhân yểm trợ (logic/missiles.js): kẻ có vũ khí bắn xa ước sức mình mạnh hơn
    const ar = W.islands[a].arms, off = Wr.offense(W, a, day) * (1 + (ar ? 0.02 * Math.min(6, ar.missiles) + 0.25 * Math.min(1, ar.nukes) : 0)); if (off < 3) return;
    const clamp = (x) => Math.max(0, Math.min(1, x));
    let best = null, lust = 0;
    for (let b = 0; b < D.N; b++) {
      const B = W.islands[b], rb = Wr.rulerOf(W, b);
      if (b === a || rb === a || !BK.Island.living(B).length) continue;
      // hiệp ước: liên minh thì không đánh; hiệp ước thường thì chỉ kẻ mưu mô, ít sùng đạo mới dám phản bội
      const T = D.treatyOf(W, a, rb, day);
      if (T && (T.kind === 'alliance' || t.cunning < 0.6 || t.piety > 0.45)) continue;
      // tương quan sức theo cách người quyết nhìn: tham vọng thì tự tin quá, đa nghi thì e dè, cộng may rủi của tin do thám
      const ratio = off / Math.max(0.5, Wr.defense(W, b, a)) * (1 + 0.5 * (t.ambition - 0.5) - 0.4 * (t.paranoia - 0.5)) * rng.range(0.8, 1.25);
      const sb = E.state(B).stock;
      const need = E.state(A).hunger ? 1 : clamp(E.RES.reduce((s, r) => s + Math.min(D.need(A, r), sb[r]) * D.value(A, r), 0) / 400);
      const grudge = W.rel[a][b].grudge, far = 1 + 0.3 * (D.hops(a, b) - 1);
      // muốn đánh (chưa tính sức): muốn mà quân chưa đủ thì tích quân trước (pol.warlust)
      const wantRaid = (0.5 * t.aggression + 0.25 * (1 - t.intellect) + 0.6 * need + 0.4 * grudge - 0.4 * t.fear - 0.3 * t.piety - 0.25) / far;
      const wantConquer = (0.55 * t.aggression + 0.55 * t.ambition + 0.35 * grudge + 0.15 * need - 0.4 * t.fear - 0.3 * t.meekness - 0.2) / far;
      const k = T ? 0.4 : 1; lust = Math.max(lust, wantRaid * k, wantConquer * k);
      // chiếm cả đảo là phần thưởng lớn hơn một lần cướp kho (CONQUER_PRIZE)
      const raid = wantRaid * clamp((ratio - 1.0) / 1.2), conquer = CONQUER_PRIZE * wantConquer * clamp((ratio - 1.0) / 1.5);
      for (const [kind, sc] of [['raid', raid * k], ['conquer', conquer * k]]) if (sc > 0 && (!best || sc > best.sc)) best = { b, kind, sc };
    }
    pol.warlust = clamp(lust);
    if (!best || !rng.chance(Math.min(0.5, best.sc * WAR_RATE))) return;
    // kẻ hiếu chiến muốn đánh đảo bên cạnh mà chưa có cầu: tự bắc cầu quân sự trước (quân tràn sang nhanh hơn), đánh sau
    if (D.hops(a, best.b) === 1 && !D.bridged(W, a, best.b) && !D.workOf(W, a, best.b) && t.aggression > 0.6 && rng.chance(0.5) && D.startBridge(W, day, a, best.b, 'military', a)) return;
    // người mưu mô đánh úp, không tuyên chiến
    if (Wr.launch(W, day, a, best.b, best.kind, best.kind === 'raid' ? 0.5 : 0.8, rng, t.cunning > 0.6 && rng.chance(t.cunning))) pol.lastWar = day;
  }

  // only: chỉ tìm đổi thứ này (mua lương thực gấp)
  function tryTrade(W, a, day, rng, t, only) {
    const D = BK.Diplomacy, E = BK.Economy, A = W.islands[a];
    const wants = only ? [only] : E.RES.filter((r) => D.need(A, r) > 5).sort((x, y) => D.need(A, y) * D.value(A, y) - D.need(A, x) * D.value(A, x));
    for (const y of wants.slice(0, 2)) {
      // đảo có dư thứ y, xếp theo lượng dư và tin cậy (ít thù hằn); bỏ qua đảo đang không đi được
      const partners = [];
      for (let b = 0; b < D.N; b++) { if (b === a || !D.alive(W, b) || !D.canSend(W, b)) continue; const av = D.available(W.islands[b], y); if (av >= 10) partners.push([b, av * (1 + W.rel[a][b].trust - W.rel[a][b].grudge) / D.travelDays(W, a, b)]); }
      if (!partners.length) continue;
      partners.sort((p, q) => q[1] - p[1]);
      const b = partners[rng.next() < 0.75 || partners.length === 1 ? 0 : 1][0], B = W.islands[b];
      // thứ a đưa: thứ a dư mà B quý nhất
      const offers = E.RES.filter((x) => x !== y && D.available(A, x) >= 10).sort((x, z) => D.value(B, z) - D.value(B, x));
      if (!offers.length) continue;
      const x = offers[0], cap = Math.min(D.load(A), D.load(B));
      const qy = Math.min(D.available(B, y), Math.ceil(D.need(A, y)), cap); if (qy < 5) continue;
      // giá: theo giá trị hai bên; người mặc cả mưu mô hơn được giá tốt hơn; tin cậy làm giá mềm hơn
      const tb = BK.People.traits(B.seats.king != null ? B.people.get(B.seats.king) : { genome: { traits: { cunning: 0.5, paranoia: 0.5 } } });
      const price = (D.value(B, y) / Math.max(0.15, D.value(B, x))) * (1 + 0.4 * (tb.cunning - t.cunning)) * (1 - 0.15 * W.rel[b][a].trust);
      let qx = Math.ceil(qy * Math.max(0.3, price));
      qx = Math.min(qx, D.available(A, x)); if (qx < 3) continue;
      // a có lời không (theo cách a định giá)
      if (D.value(A, y) * qy < D.value(A, x) * qx * 0.9) continue;
      // b có nhận không: có lời theo cách b định giá, và người đứng đầu b chịu buôn với a (đa nghi mà ít tin cậy thì ngại)
      const gainB = D.value(B, x) * qx - D.value(B, y) * qy;
      const okB = 0.35 + 0.3 * tb.cunning - 0.35 * (tb.paranoia || 0.5) * (1 - W.rel[b][a].trust) - 0.5 * W.rel[b][a].grudge + (gainB > 0 ? 0.35 : -0.3);
      if (!rng.chance(Math.max(0.02, Math.min(0.98, okB)))) { A.log.push({ day: Math.floor(day), kind: 'trade', ids: [], text: B.name + ' từ chối đổi ' + E.NAME[y].toLowerCase() + '.' }); continue; }
      D.trade(W, day, a, b, { [x]: qx }, { [y]: qy });
      return true;
    }
    return false;
  }

  // kẻ thù chung của a và b: đảo thứ ba mà cả hai cùng sợ hay cùng thù (0..1)
  function commonFoe(W, a, b) {
    let m = 0; const threat = (i, x) => Math.max(W.rel[i][x].fear, W.rel[i][x].grudge);
    for (let x = 0; x < BK.Diplomacy.N; x++) if (x !== a && x !== b) m = Math.max(m, Math.min(threat(a, x), threat(b, x)));
    return m;
  }
  function tryTreaty(W, a, day, rng, t) {
    const D = BK.Diplomacy;
    const cands = [];
    for (let b = 0; b < D.N; b++) if (b !== a && D.alive(W, b) && !D.treatyOf(W, a, b, day)) cands.push([b, W.rel[a][b].trust + W.rel[a][b].fear * 0.8 - W.rel[a][b].grudge + (D.hops(a, b) === 1 ? 0.2 : 0) + commonFoe(W, a, b)]);
    if (!cands.length) return;
    cands.sort((p, q) => q[1] - p[1]);
    const b = cands[0][0], B = W.islands[b], M = mind(B); if (!M) return;
    const foe = commonFoe(W, a, b);
    const tb = M.t, kind = ((W.rel[a][b].trust > 0.45 && W.rel[b][a].trust > 0.45) || (foe > 0.3 && W.rel[a][b].trust > 0.2 && W.rel[b][a].trust > 0.2)) && rng.chance(0.5 + 0.4 * foe) ? 'alliance' : 'pact';
    const ok = 0.2 + 0.3 * tb.intellect + 0.2 * tb.cunning + 0.6 * W.rel[b][a].trust + 0.4 * W.rel[b][a].fear + 0.6 * foe - 0.6 * W.rel[b][a].grudge - 0.25 * tb.aggression;
    if (rng.chance(Math.max(0.02, Math.min(0.95, ok)))) D.sign(W, day, a, b, kind, kind === 'alliance' ? 540 : 360);
  }

  // sắp hết lương thực: còn thương nhân rảnh thì cho đoàn đi mua ngay (đa nghi thì chần chừ hơn)
  function urgentFood(W, i, day, rng) {
    const D = BK.Diplomacy, S = W.islands[i], st = BK.Economy.state(S);
    if (!D.alive(W, i) || !D.canSend(W, i) || (st.stock.food > st.eaten * URGENT_DAYS && !st.hunger)) return;
    const M = mind(S); if (!M) return;
    if (rng.chance(Math.max(0.2, 0.9 - 0.5 * M.t.paranoia))) tryTrade(W, i, day, rng, M.t, 'food');
  }
  // đoàn đi thuyền ngang qua đảo c: người đứng đầu c xét có cướp không (mỗi đoàn, mỗi đảo xét một lần, khi đoàn đi được nửa đường)
  function tryRob(W, day, rng) {
    const D = BK.Diplomacy, Wr = BK.War;
    for (const cv of [...W.caravans]) {
      if (cv.by !== 'boat' || cv.gift || cv.robChecked || day < (cv.depart + cv.arrive) / 2) continue;
      cv.robChecked = true;
      for (const c of D.path(cv.a, cv.b)) {
        if (!D.alive(W, c)) continue;
        const M = mind(W.islands[c]); if (!M) continue;
        const t = M.t, foe = (v) => W.rel[c][v].grudge + (Wr && Wr.atWar(W, c) && (Wr.atWar(W, c).a === v || Wr.atWar(W, c).b === v) ? 0.6 : 0);
        const p = 0.4 * t.aggression + 0.25 * t.ambition + 0.5 * Math.max(foe(cv.a), foe(cv.b)) - 0.35 * t.piety - 0.3 * t.fear - 0.2;
        if (rng.chance(Math.max(0, Math.min(0.6, p)))) { D.rob(W, day, cv, c); break; }
      }
    }
  }
  // đảo mình cai quản đang đói: xét gửi lương thực cứu đói (mỗi EVERY ngày)
  function relief(W, i, day, rng) {
    const S = W.islands[i], E = BK.Economy, st = E.state(S);
    for (let v = 0; v < W.islands.length; v++) {
      const V = W.islands[v]; if (V.annexedBy !== i || !E.state(V).hunger || W.caravans.some((c) => c.gift && c.b === v)) continue;
      const M = mind(S); if (!M) return;
      const t = M.t, spare = st.stock.food - st.eaten * 40, k = Math.floor(Math.min(spare, E.state(V).eaten * 20));
      if (k > 20 && rng.chance(Math.max(0.05, Math.min(0.9, 0.3 + 0.4 * t.meekness + 0.3 * t.intellect - 0.35 * t.aggression)))) BK.Diplomacy.gift(W, day, i, v, { food: k });
    }
  }
  // mỗi ngày (logic/world.js gọi): mỗi đảo xét tình hình EVERY ngày một lần, lệch nhau theo thứ tự đảo; đảo sắp đói thì đi mua
  // lương thực bất cứ ngày nào; đoàn buôn qua đảo khác có thể bị cướp
  function dayTick(W, day, rng) {
    for (let i = 0; i < BK.Diplomacy.N; i++) { if ((Math.floor(day) + i * 2) % EVERY === 0) { islandTick(W, i, day, rng); if (BK.Diplomacy.alive(W, i)) relief(W, i, day, rng); } else urgentFood(W, i, day, rng); }
    tryRob(W, day, rng);
  }
  return { EVERY, BASE_SOLDIERS, mind, strength, islandTick, dayTick, onAttacked };
});
