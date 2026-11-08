/* Bể Kính · logic/siege.js · Đánh thành: cổng → các công trình xung quanh → nhà chính (design/npc-song-that.md mục 7.3)
 * Ở cấp một đảo (S). logic/war.js chạy diễn biến trận, gọi vào đây cho những gì thuộc về thành:
 *   cổng       quân tới bằng đường nào thì đánh cổng đó: qua cầu thì cổng phụ đầu cầu (gateL, gateR), đi thuyền thì đổ bộ
 *              đánh cổng chính (gate). Giữ cổng: lính, tướng ở nhà, lính gác cổng đó (lính gác các cổng khác giữ chốt), và dân
 *              tự nguyện (người nóng nảy, trai tráng; cầm đồ nghề làm vũ khí, đánh như dân binh). Cổng vỡ thì hư hẳn (S.ruin).
 *   độ bền     S.ruin[khoá] = độ bền còn lại (0..1; không có khoá là còn nguyên). Khoá: bãi làm việc (store, craft, power, farm,
 *              wood, stone), nhà dân ('home:<số nhà>', logic/homes.js), cổng (gate, gateL, gateR).
 *              Công trình hư thì kinh tế mất phần đó (output): bãi gỗ cháy thì ít gỗ, xưởng cháy thì ít hàng quý; kho cháy thì
 *              mất hàng trong kho ngay lúc cháy; nhà cháy (độ bền dưới HOMELESS) thì người nhà ở nhờ nhà hàng xóm (lodging).
 *   công trình mất cổng thì địch đánh các công trình quanh thành trước (plan: kho, xưởng, chỗ làm năng lượng, vài nhà dân,
 *              ruộng), mỗi lúc một chỗ; người nóng nảy và lính còn lại ra đánh trên phố.
 *   nhà chính  đội giữ thành (hallTeam): lính còn lại, người trong hội đồng, dân tự nguyện vào trong; người đứng đầu chỉ huy.
 *              Mất thành khi đội này chết hết, hay người đứng đầu đầu hàng (surrender): sợ hãi, nhu nhược thì hàng sớm để cứu
 *              dân; hiếu chiến, tham vọng thì đánh tới người cuối cùng. Vây lâu quá HALL_DAYS ngày thì hết lương, phải hàng.
 *   sửa lại    hết chiến tranh thì thợ xây sửa từng chỗ hư (repairDay, S.repairJob; logic/tasks.js đưa thợ tới, mang vật liệu từ
 *              kho), tốn gỗ, đá, mất thời gian; thiếu vật liệu thì sửa chậm.
 * Không vẽ gì, chạy được bằng Node. Cần: logic/people.js, logic/economy.js, logic/island.js. */
(function (root, factory) {
  const BK = root.BK || (root.BK = {});
  BK.Siege = factory(BK);
  if (typeof module === 'object' && module.exports) module.exports = BK.Siege;
})(typeof self !== 'undefined' ? self : globalThis, function (BK) {
  'use strict';
  const YARD_OF = { food: 'farm', wood: 'wood', stone: 'stone', metal: 'stone', energy: 'power', luxury: 'craft' }; // tài nguyên → bãi làm ra nó
  const FLOOR = 0.3;            // bãi hư hẳn vẫn làm được chừng này phần (làm ngoài trời, đồ nghề còn sót)
  const STORE_BURN = 0.5;       // kho mất chừng này phần hàng theo phần độ bền bị mất
  const HOMELESS = 0.5;         // nhà còn dưới độ bền này thì không ở được
  const HIT = 0.2;              // độ bền một người lính phá được mỗi ngày (cháy, đập)
  const HOMES_HIT = 3;          // số nhà dân bị đánh
  const VOLUNTEER_AGE = [18, 50];
  const SURRENDER_DAY = 0.2, SURRENDER_QUARTER = 0.9; // hệ số xét đầu hàng mỗi ngày / mỗi khi nhà chính mất thêm một phần tư
  const HALL_DAYS = 8;          // bị vây quá chừng này ngày thì hết lương, phải hàng
  const REPAIR = 0.06;          // một thợ sửa được chừng này độ bền mỗi ngày (đủ vật liệu)
  const REPAIR_COST = 6;        // mỗi phần mười độ bền tốn chừng này gỗ và đá
  const P = () => BK.People, E = () => BK.Economy;
  const living = (S) => BK.Island.living(S);
  const note = (S, day, kind, text, ids) => S.log.push({ day: Math.floor(day), kind, ids: ids || [], text });

  /* ---------- Độ bền ---------- */
  const hp = (S, key) => (S.ruin && S.ruin[key] != null ? S.ruin[key] : 1);
  const damaged = (S) => Object.keys(S.ruin || {});
  // đánh vào một chỗ: mất dmg độ bền; kho cháy thì mất hàng theo phần độ bền vừa mất. Trả về độ bền còn lại
  function hit(S, key, dmg) {
    const was = hp(S, key), now = Math.max(0, was - dmg); if (now >= was) return now;
    (S.ruin || (S.ruin = {}))[key] = now;
    if (key === 'store' && E()) { const sb = E().state(S).stock, k = STORE_BURN * (was - now); for (const r in sb) sb[r] = Math.max(0, sb[r] * (1 - k)); }
    return now;
  }
  // phần sản lượng của tài nguyên r còn làm được (bãi làm ra nó hư thì làm ít đi)
  const output = (S, r) => { const k = YARD_OF[r]; return k ? FLOOR + (1 - FLOOR) * hp(S, k) : 1; };
  // nhà của p cháy thì ở nhờ nhà gần nhất còn ở được (số nhà); nhà mình ở được thì null
  function lodging(S, p) {
    if (p.home == null || hp(S, 'home:' + p.home) >= HOMELESS) return null;
    const N = (BK.Rules && BK.Rules.HOME_SLOTS) || 20;
    for (let d = 1; d < N; d++) for (const s of [p.home - d, p.home + d]) if (s >= 0 && s < N && hp(S, 'home:' + s) >= HOMELESS) return s;
    return null;
  }

  /* ---------- Cổng và người giữ cổng ---------- */
  // cổng của đảo b mà quân từ đảo a đánh vào: qua cầu thì cổng phụ phía đó, đi thuyền thì cổng chính
  const gateOf = (side, byBridge) => (byBridge ? (side ? 'gateR' : 'gateL') : 'gate');
  const isGuard = (p) => p.job === 'soldier' || p.job === 'gatekeeper' || p.job === 'sideguard' || p.role === 'general1' || p.role === 'general2';
  // người cầm vũ khí ra giữ cổng gate: lính, tướng, lính gác của đúng cổng đó (lính gác cổng khác giữ chốt)
  const gateGuards = (S, gate) => living(S).filter((p) => !p.away && isGuard(p) && (gate === 'gate' ? p.job !== 'sideguard' : p.job !== 'gatekeeper' && (p.job !== 'sideguard' || p.postKey === (gate === 'gateR' ? 'gateRight' : 'gateLeft'))));
  // dân tự nguyện: người nóng nảy (không nhát), đủ tuổi, không trong hội đồng, không phải lính
  function volunteers(S, day) {
    return living(S).filter((p) => {
      if (p.away || p.role || isGuard(p)) return false;
      const a = P().ageOf(p, day), t = P().traits(p); if (a < VOLUNTEER_AGE[0] || a > VOLUNTEER_AGE[1]) return false;
      return t.aggression > 0.62 && t.fear < 0.6;
    });
  }

  /* ---------- Các công trình quanh thành ---------- */
  // thứ tự địch đánh sau khi vào thành: kho (cướp, đốt), xưởng, chỗ làm năng lượng, vài nhà dân đang có người ở, ruộng
  function plan(S, rng) {
    const out = ['store'];
    if (E().can(S, 'luxury')) out.push('craft');
    if (E().can(S, 'energy')) out.push('power');
    const homes = [...new Set(living(S).map((p) => p.home).filter((h) => h != null))];
    for (let k = 0; k < HOMES_HIT && homes.length; k++) out.push('home:' + homes.splice(Math.floor(rng.next() * homes.length), 1)[0]);
    out.push('farm');
    return out;
  }
  // một đợt dt ngày quân trong thành phá chỗ đang nhắm (sức phá giảm theo số người đang chống trên phố); xong thì sang chỗ kế
  function ravage(S, siege, attackers, fighters, dt) {
    const key = siege.targets[siege.at]; if (!key) return null;
    const dmg = dt * HIT * attackers * attackers / Math.max(1, attackers + 2 * fighters);
    if (hit(S, key, dmg) <= 0.05) { siege.at++; (siege.hit || (siege.hit = [])).push(key); }
    return siege.targets[siege.at] || null;
  }

  /* ---------- Nhà chính ---------- */
  // đội giữ thành: lính còn lại, người trong hội đồng (trừ người đứng đầu: chỉ huy), dân tự nguyện
  function hallTeam(S, day) {
    const ids = new Set();
    for (const p of living(S)) if (!p.away && (isGuard(p) || (p.role && p.role !== 'king' && P().ageOf(p, day) >= 16))) ids.add(p.id);
    for (const p of volunteers(S, day)) ids.add(p.id);
    return [...ids].map((id) => S.people.get(id));
  }
  // người đứng đầu có đầu hàng không (mỗi ngày xét một lần). lost: phần đội giữ thành đã mất; days: số ngày bị vây
  // người đứng đầu xét đầu hàng (design/ke-hoach-khac-phuc.md mục 5.2): mỗi ngày xét nhẹ, mỗi khi nhà chính mất thêm một phần
  // tư độ bền (quarter) thì xét nặng. lostShare: phần đội giữ nhà chính đã ngã; hallLost: phần độ bền nhà chính đã mất
  function surrender(S, lostShare, days, rng, hallLost, quarter) {
    if (days >= HALL_DAYS) return 'hết lương';
    const K = S.seats.king != null ? S.people.get(S.seats.king) : null;
    if (!K || !K.alive) return lostShare > 0.7 && rng.chance(0.5) ? 'không còn người chỉ huy' : null;
    const t = P().traits(K), base = 0.08 + 0.55 * t.fear + 0.4 * t.meekness - 0.45 * t.aggression - 0.3 * t.ambition;
    const press = 0.2 + lostShare + (hallLost || 0);
    return rng.chance(Math.max(0, Math.min(0.9, (quarter ? SURRENDER_QUARTER : SURRENDER_DAY) * base * press))) ? 'cứu dân' : null;
  }

  /* ---------- Vai của từng người trong trận (logic/brain.js hỏi trước mọi việc khác) ---------- */
  // d(state, o): tạo việc của logic/brain.js. Trả về null nếu p không có vai.
  //   tiễn quân (S.situ.muster)   người nhà ra cổng tiễn quân, mặt buồn
  //   quỳ (S.situ.kneel)          người đứng đầu cũ quỳ ở sân nhà chính sau khi mất thành
  //   trận (S.situ.siege)         người giữ (sg.def) mỗi người nhắm một quân giặc, đánh ở cổng, trên phố, quanh nhà chính;
  //                               người đứng đầu chỉ huy ở nhà chính; người sùng đạo cầu ở chỗ thờ; người khác: lúc giặc ở cổng
  //                               thì vào nhà (nhút nhát thì chạy), giặc vào thành thì dạt sang phía bên kia đảo (refuge)
  function roleOf(S, p, d) {
    const X = S.situ, day = S.day, t = P().traits(p), age = P().ageOf(p, day), short = { until: day + 0.25 };
    const K = X.kneel; if (K && K.until > day && K.id === p.id) return d('work', { verb: 'kneel', place: 'hall', reason: 'bị dẫn ra quỳ ở sân nhà chính', until: K.until });
    const M = X.muster; if (M && M.until > day && M.family.includes(p.id)) return d('work', { verb: 'farewell', place: M.gate, reason: 'ra cổng tiễn người nhà đi đánh ' + M.to, until: M.until, intensity: 0.6 });
    // báo động tên lửa (logic/missiles.js): ai không cầm vũ khí giữ chốt thì vào nhà trốn
    if (X.alarm > day && !X.siege && !isGuard(p) && S.seats.king !== p.id) { const lodge = lodging(S, p); return d(t.fear > 0.6 ? 'panic' : 'work',
        Object.assign({ verb: 'hide', reason: 'báo động tên lửa, vào nhà trốn' }, lodge != null ? { place: 'homeSlot', slot: lodge } : { place: 'home' },
        short)); }
    const sg = X.siege; if (!sg) return null;
    const di = sg.def.indexOf(p.id), n = sg.foes.length;
    // vây thành (logic/battles.js): lính canh ở cổng, dân vẫn sống như thường (đói thì xếp hàng nhận khẩu phần)
    if (sg.stage === 'blockade') return di >= 0 ? d('work', Object.assign({ verb: 'watch', place: sg.gate, reason: 'canh cổng, giặc dựng trại vây ngoài thành' }, short)) : null;
    // đấu tướng: tướng bên mình đánh tướng giặc, người giữ cổng đứng xem hò reo
    if (sg.stage === 'duel' && sg.duel) { if (p.id === sg.duel.b) return d('attack', Object.assign({ target: 'w' + sg.duel.ai + ':' + sg.duel.a,
        place: sg.gate, reason: 'đấu tay đôi với tướng giặc' }, short)); if (di >= 0) return d('work', Object.assign({ verb: 'watchDuel', place: sg.gate,
        reason: 'xem hai tướng đấu tay đôi' }, short)); return null; }
    const foe = (k) => (n ? 'w' + sg.foes[k % n].i + ':' + sg.foes[k % n].id : null);
    // arm: người bắn xa hay cận chiến (logic/arms.js), cho phần vẽ: người bắn đứng lùi lại mà bắn
    // đứng vào hàng của bên giữ (side, rank, of: phần vẽ xếp đội hình, render/village3d.js formation), bắn xa
    const fight = (place, why) => d('attack', Object.assign({ target: foe(di), place, reason: why, intensity: 0.5 + 0.5 * t.aggression, arm: 'ranged', side: 'def', rank: di, of: sg.def.length }, short));
    if (S.seats.king === p.id) return d('work', Object.assign({ verb: 'command', place: 'hall', reason: sg.stage === 'hall' ? 'chỉ huy giữ nhà chính' : 'chỉ huy giữ thành từ nhà chính' }, short));
    if (di >= 0) {
      if (sg.stage === 'gate' || sg.stage === 'loot') return fight(sg.gate, 'ra giữ ' + nameOf(sg.gate));
      if (sg.stage === 'outer') return fight('ruin:' + (sg.target || 'store'), 'đánh giặc trên phố, giữ ' + nameOf(sg.target || 'store'));
      return fight('hall', 'vào giữ nhà chính');
    }
    if (t.piety > 0.68 && age >= 12 && sg.stage !== 'hall') return d('idle', Object.assign({ mood: 'pray', place: 'shrine', reason: 'cầu cho thành không mất' }, short));
    if (sg.stage === 'gate' || sg.stage === 'loot') {
      const lodge = lodging(S, p), at = lodge != null ? { place: 'homeSlot', slot: lodge } : { place: 'home' };
      return d(t.fear > 0.6 ? 'panic' : 'work', Object.assign({ verb: 'hide', reason: t.fear > 0.6 ? 'chạy về nhà trốn, đóng cửa' : 'đưa con vào nhà, đóng cửa' }, at, short));
    }
    // giặc vào thành: người sợ hãi, trẻ nhỏ và một phần ba số người trốn trong nhà, đóng cửa (ít bị bắn hơn); số còn lại chạy
    // dạt sang phía bên kia đảo (ngoài đường, quân càn quét bắn vào, logic/war.js)
    if (t.fear > 0.55 || age < 12 || p.id % 3 === 0) { const lodge = lodging(S, p), at = lodge != null ? { place: 'homeSlot', slot: lodge } : { place: 'home' }; return d('panic', Object.assign({ verb: 'hide', reason: 'giặc vào thành, trốn trong nhà, đóng cửa' }, at, short)); }
    return d('panic', Object.assign({ verb: 'shelter', place: 'refuge', reason: 'giặc vào thành, chạy dạt sang phía bên kia đảo' }, short));
  }

  /* ---------- Sửa lại sau chiến tranh ---------- */
  // mỗi ngày (logic/island.js): không còn giặc trên đảo thì thợ xây sửa chỗ hư nặng nhất trước
  function repairDay(S, day) {
    const keys = damaged(S); if (!keys.length) { S.repairJob = null; return; }
    if (S.situ.war > day || S.situ.siege) { S.repairJob = null; return; }
    const crew = living(S).filter((p) => !p.away && (p.job === 'builder' || p.role === 'builder')).length;
    if (!crew) { S.repairJob = null; return; }
    const key = keys.sort((a, b) => hp(S, a) - hp(S, b))[0], sb = E().state(S).stock;
    let gain = REPAIR * crew; const cost = REPAIR_COST * gain * 10;
    if (sb.wood >= cost / 2 && sb.stone >= cost / 2) { sb.wood -= cost / 2; sb.stone -= cost / 2; } else gain *= 0.3; // thiếu vật liệu thì chắp vá, chậm
    const now = Math.min(1, hp(S, key) + gain);
    if (now >= 1) { delete S.ruin[key]; note(S, day, 'build', 'Sửa xong ' + nameOf(key) + ' sau chiến tranh.'); } else S.ruin[key] = now;
    S.repairJob = damaged(S).length ? { key: now >= 1 ? damaged(S).sort((a, b) => hp(S, a) - hp(S, b))[0] : key, until: day + 1.2 } : null;
  }
  const NAME = { hall: 'nhà chính', drill: 'bãi tập', store: 'kho', craft: 'xưởng', power: 'chỗ làm năng lượng', farm: 'ruộng', wood: 'bãi gỗ', stone: 'mỏ đá', gate: 'cổng chính', gateL: 'cổng phụ trái', gateR: 'cổng phụ phải' };
  const nameOf = (key) => (key.startsWith('home:') ? 'nhà số ' + (+key.slice(5) + 1) : NAME[key] || key);

  return { hp, hit, output, lodging, damaged, gateOf, gateGuards, volunteers, plan, ravage, hallTeam, surrender, roleOf, repairDay, nameOf, isGuard, HALL_DAYS, HOMELESS };
});
