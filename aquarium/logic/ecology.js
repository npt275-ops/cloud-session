/* Bể Kính · logic/ecology.js · Bể kính là một hệ sinh thái hỗn loạn (design/npc-song-that.md mục 7.6)
 * Hỗn loạn đến từ những vòng ảnh hưởng lẫn nhau, mỗi vòng có nguyên nhân rõ ràng (ghi trong tin: "vì …", "do …"):
 *   môi trường   S.env: rừng (đốn gỗ thì thưa, mọc lại chậm), mỏ (đào thì cạn, vỉa mới lộ rất chậm), đất ruộng (làm nhiều thì
 *                bạc màu, nghỉ thì hồi), khói bụi (từ thời 5, công nghệ sạch từ thời 9 thì bớt). Sản lượng theo đó (output).
 *                Người đứng đầu ham học, ít tham vọng thì giữ đất cho đời sau (S.conserve): khai thác chậm, hao ít hơn.
 *   chạy nạn     đói kéo dài, bị vây đánh, vừa bị hạt nhân thì cả hộ chạy sang đảo khác (qua cầu, đi thuyền: W.visits kind
 *                'refugee'). Đảo nhận thêm người làm, thêm miệng ăn; người đứng đầu đa nghi có thể đóng cửa không nhận.
 *   lấy vợ chồng khách sang thăm đảo bên có thể cưới người đảo đó rồi ở lại: hai đảo thành họ hàng (W.kin), tin nhau hơn;
 *                hai đảo có họ hàng đánh nhau thì có gia đình bị chia cắt (tin).
 *   dịch lây     dịch (logic/climate.js PLAGUE) lây theo khách, đoàn buôn, quân lính, người chạy nạn. Đảo kề bên mà người
 *                đứng đầu đa nghi, sợ hãi thì đóng cầu (S.closed): không ai qua lại, không buôn bán qua cầu, các đảo kia
 *                bớt tin. Đang có dịch thì một phần dân ốm nằm nhà (S.sick).
 *   chính trị    đảo độc lập bất bình (S.discontent: đói, dịch, hạt nhân, cấm vận, người chết nhiều) thì tướng tham vọng có
 *                thể đảo chính: dẫn lính vây nhà chính, người đứng đầu bị lật, quỳ ở sân; người mới đổi hết chiến lược.
 *                Người đứng đầu mất mà trong hội đồng có người tham vọng thì tranh ngôi (cãi nhau to, tin).
 *   cấm vận      ba đảo trở lên mất tin và thù một đảo thì cùng không buôn với đảo đó (W.embargo); đảo bị cấm vận túng
 *                quẫn, bất bình tăng, dễ liều đánh (logic/strategy.js).
 *   cảnh         cháy rừng thì dân xếp hàng chuyền nước từ giếng ra chỗ cháy (roleOf); dịch thì người ốm nằm nhà; đảo chính
 *                thì lính vây nhà chính.
 * Số đo cho bảng dev và cân chỉnh: W.ecoStats. Không vẽ gì, chạy được bằng Node.
 * Cần: logic/people.js, logic/economy.js, logic/climate.js, logic/diplomacy.js, logic/war.js, logic/strategy.js. */
(function (root, factory) {
  const BK = root.BK || (root.BK = {});
  BK.Ecology = factory(BK);
  if (typeof module === 'object' && module.exports) module.exports = BK.Ecology;
})(typeof self !== 'undefined' ? self : globalThis, function (BK) {
  'use strict';
  // môi trường: hao theo số người khai thác mỗi ngày, hồi theo phần còn thiếu
  // (theo phần dân làm việc đó: share = số người khai thác / số dân; hồi theo phần đã mất, nên có điểm cân bằng)
  const FOREST_USE = 0.06, FOREST_GROW = 0.004, ORE_USE = 0.008, ORE_GROW = 0.003, SOIL_USE = 0.008, SOIL_REST = 0.004;
  const SOIL_SAFE = 0.3;
  const SMOG_LV = 5, SMOG_CLEAN_LV = 9, SMOG_ADD = 0.0001, SMOG_DECAY = 0.004;
  const CONSERVE_USE = 0.6, CONSERVE_OUT = 0.9;
  const FLEE = 0.03, HUNGER_FLEE = 8, MAX_HOUSE = 6;
  const MARRY = 0.02;
  const SPREAD = 0.1, IMMUNE = 60, CLOSE_DAYS = 30;
  const COUP_AT = 0.45, COUP = 0.03, COUP_SCENE = 0.6;
  const EMBARGO_DAYS = 120, EMBARGO_VOTES = 3;
  const P = () => BK.People, E = () => BK.Economy, D = () => BK.Diplomacy, Wr = () => BK.War;
  const living = (S) => BK.Island.living(S);
  // tin chung của cả bể; sáu đảo sống riêng (không có tin chung) thì ghi vào nhật ký từng đảo
  const say = (W, day, text, isles) => (W.log ? D().say(W, day, text, isles) : isles.forEach((i) => W.islands[i].log.push({ day: Math.floor(day), kind: 'news', ids: [], text })));
  const note = (S, day, kind, text, ids) => S.log.push({ day: Math.floor(day), kind, ids: ids || [], text });
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const env = (S) => S.env || (S.env = { forest: 1, ore: 1, soil: 1, smog: 0 });
  const plague = (S, day) => BK.Climate.active(S, day).find((e) => e.key === 'plague') || null;
  const traitsOf = (S) => { const M = BK.Strategy.mind(S); return M ? M.t : null; };

  function init(W) { W.embargo = W.embargo || W.islands.map(() => 0); W.wars = W.wars || []; W.kin = W.kin || {}; W.ecoStats = { refugees: 0, refused: 0, marriages: 0, spread: 0, closures: 0, coups: 0, disputes: 0, embargoes: 0 }; }

  /* ---------- Môi trường ---------- */
  function envDay(S, day) {
    const V = env(S), t = traitsOf(S), n = { wood: 0, mine: 0, farm: 0 };
    S.conserve = !!(t && t.intellect > 0.6 && t.ambition < 0.55); // giữ đất cho đời sau
    for (const p of living(S)) if (p.job === 'worker' && !p.away) { if (p.res === 'wood') n.wood++; else if (p.res === 'stone' || p.res === 'metal') n.mine++; else if (p.res === 'food') n.farm++; }
    const k = S.conserve ? CONSERVE_USE : 1, pop = Math.max(1, living(S).length);
    V.forest = clamp(V.forest - FOREST_USE * k * n.wood / pop + FOREST_GROW * (1 - V.forest) * (0.3 + V.forest), 0.05, 1); // rừng thưa thì mọc lại chậm
    V.ore = clamp(V.ore - ORE_USE * k * n.mine / pop + ORE_GROW * (1 - V.ore), 0.25, 1); // vỉa nghèo vẫn đào được ít
    // luân canh: ruộng làm tới SOIL_SAFE phần dân không bạc màu; làm quá sức mới kiệt đất (7g: đảo ít lương thực như sa mạc,
    // núi cần nhiều người làm ruộng, không thì bạc màu → thiếu ăn → thêm người ra ruộng, kẹt mãi ở thời thấp)
    V.soil = clamp(V.soil - SOIL_USE * k * Math.max(0, n.farm / pop - SOIL_SAFE) + SOIL_REST * (1 - V.soil), 0.2, 1);
    if (S.level >= SMOG_LV) V.smog += SMOG_ADD * (S.level - SMOG_LV + 1) * (S.level >= SMOG_CLEAN_LV ? 0.4 : 1);
    V.smog = clamp(V.smog * (1 - SMOG_DECAY), 0, 1);
  }
  // phần sản lượng còn lại theo môi trường (logic/economy.js)
  function output(S, r) {
    const V = S.env; if (!V) return 1;
    const c = S.conserve && (r === 'wood' || r === 'stone' || r === 'metal') ? CONSERVE_OUT : 1; // giữ rừng, giữ mỏ; không cắt lương thực
    // (7g, đo 100 trận: hụt mạnh hơn thế này thì vòng đói → cướp → đánh nhau → nghèo thêm lấn át cả bể)
    if (r === 'wood') return c * (0.7 + 0.3 * V.forest);
    if (r === 'stone' || r === 'metal') return c * (0.8 + 0.2 * V.ore);
    if (r === 'food') return c * (0.8 + 0.2 * V.soil) * (1 - 0.15 * V.smog);
    return c;
  }

  /* ---------- Chuyển người sang đảo khác (chạy nạn, lấy vợ chồng) ---------- */
  // ids: người của đảo from; wed: người đảo to cưới người đầu tiên. Người đi rời đảo cũ (không phải chết: p.left)
  function settle(W, day, from, to, ids, why, wed) {
    const S = W.islands[from], T = W.islands[to], map = new Map();
    for (const id of ids) {
      const p = S.people.get(id); if (!p || !p.alive) continue;
      const g = P().create({ id: T.nextId++, name: p.name, clan: p.clan, sex: p.sex, born: p.born, genome: p.genome, gen: p.gen });
      g.traits = p.traits; g.epi = p.epi; g.kin = from; g.commoner = true; T.people.set(g.id, g); map.set(id, g);
      p.alive = false; p.left = to; p.away = null; p.loc = null; p.cause = why; p.role = null;
    }
    for (const [id, g] of map) {
      const p = S.people.get(id), m = (x) => (map.has(x) ? map.get(x).id : null);
      g.parents = p.parents.map(m).filter((x) => x != null); g.children = p.children.map(m).filter((x) => x != null);
      if (p.spouse != null && map.has(p.spouse)) { g.spouse = map.get(p.spouse).id; g.spouses = [g.spouse]; }
    }
    if (wed) { const g = map.get(ids[0]); if (g) { g.spouse = wed.id; g.spouses = [wed.id]; wed.spouse = g.id; (wed.spouses || (wed.spouses = [])).push(g.id); } }
    S.situChanged = T.situChanged = true;
    return [...map.values()];
  }

  /* ---------- Chạy nạn ---------- */
  function fleeDay(W, day, i, rng) {
    const S = W.islands[i], st = E().state(S);
    S.hungerDays = st.hunger ? (S.hungerDays || 0) + 1 : 0;
    const why = S.hungerDays >= HUNGER_FLEE ? 'đói kéo dài' : S.situ.siege ? 'giặc vào thành' : S.falloutUntil - day > 340 ? 'hạt nhân' : null;
    if (!why || !rng.chance(FLEE)) return;
    // một hộ: người không trong hội đồng, không giữ chốt, ở nhà
    const homes = new Map(); for (const p of living(S)) if (!p.away && !p.role && p.home != null && !(BK.Posts && BK.Posts.of(p))) (homes.get(p.home) || homes.set(p.home, []).get(p.home)).push(p);
    const list = [...homes.values()].filter((h) => h.length <= MAX_HOUSE); if (!list.length) return;
    const house = list[Math.floor(rng.next() * list.length)];
    // đảo nhận: không đánh nhau với đảo mình, còn ăn, còn chỗ, không đóng cầu; tin cậy nhất, gần nhất
    let best = null, bs = -1e9;
    for (let j = 0; j < W.islands.length; j++) {
      const T = W.islands[j]; if (j === i || !D().alive(W, j) || E().state(T).hunger || living(T).length + house.length > BK.Rules.POP_CAP) continue;
      if (W.wars.some((w) => (w.a === i && w.b === j) || (w.a === j && w.b === i))) continue;
      if (blocked(W, i, j, day)) continue;
      const sc = W.rel[i][j].trust - 0.3 * (D().hops(i, j) - 1) - W.rel[j][i].grudge;
      if (sc > bs) { bs = sc; best = j; }
    }
    if (best == null) return;
    const T = W.islands[best], t = traitsOf(T);
    // người đứng đầu đa nghi, không tin đảo kia: đóng cửa
    if (t && t.paranoia > 0.65 && W.rel[best][i].trust < 0.5) {
      W.ecoStats.refused++; W.rel[i][best].grudge = Math.min(1, W.rel[i][best].grudge + 0.1);
      say(W, day, T.name + ' đóng cửa, không nhận người chạy nạn từ ' + S.name + ' (vì ' + why + ').', [i, best]); return;
    }
    const head = house.find((p) => P().ageOf(p, day) >= 18) || house[0];
    const v = D().startVisit(W, day, head, i, best, 'refugee', 'home', rng); if (!v) return;
    v.members = house.map((p) => p.id); v.why = why; for (const p of house) p.away = 'refugee';
    W.ecoStats.refugees += house.length;
    say(W, day, house.length + ' người ' + S.name + ' mang bọc chạy nạn sang ' + T.name + ' (vì ' + why + ').', [i, best]);
  }
  // người chạy nạn tới nơi (logic/diplomacy.js visitDay gọi)
  function arrive(W, day, v) {
    const S = W.islands[v.from], T = W.islands[v.to];
    const moved = settle(W, day, v.from, v.to, v.members || [v.pid], 'chạy nạn sang ' + T.name);
    W.rel[v.from][v.to].trust = Math.min(1, W.rel[v.from][v.to].trust + 0.1);
    note(T, day, 'refugee', moved.length + ' người chạy nạn từ ' + S.name + ' tới ở (vì ' + v.why + ').', moved.map((g) => g.id));
    // người chạy nạn từ đảo đang có dịch mang dịch theo
    if (plague(S, day)) infect(W, day, v.to, v.from, 'người chạy nạn');
  }

  /* ---------- Lấy vợ lấy chồng khác đảo ---------- */
  function marryDay(W, day, rng) {
    for (const v of [...W.visits]) {
      if (v.stage !== 'stay' || v.kind === 'refugee' || v.kind === 'envoy' || v.brawl || !rng.chance(MARRY)) continue;
      const S = W.islands[v.from], T = W.islands[v.to], p = S.people.get(v.pid); if (!p || !p.alive || p.spouse != null || p.role) continue;
      const a = P().ageOf(p, day); if (a < 18 || a > 40 || living(T).length >= BK.Rules.POP_CAP) continue;
      const mate = living(T).find((q) => q.sex !== p.sex && q.spouse == null && !q.role && !q.away && P().ageOf(q, day) >= 18 && P().ageOf(q, day) <= 40); if (!mate) continue;
      W.visits.splice(W.visits.indexOf(v), 1);
      const g = settle(W, day, v.from, v.to, [p.id], 'cưới người ' + T.name + ', về ở ' + T.name, mate)[0];
      const key = D().pairKey(v.from, v.to); W.kin[key] = (W.kin[key] || 0) + 1; W.ecoStats.marriages++;
      W.rel[v.from][v.to].trust = Math.min(1, W.rel[v.from][v.to].trust + 0.05); W.rel[v.to][v.from].trust = Math.min(1, W.rel[v.to][v.from].trust + 0.05);
      say(W, day, P().fullName(g) + ' của ' + S.name + ' cưới ' + P().fullName(mate) + ' của ' + T.name + ' và ở lại ' + T.name + '.', [v.from, v.to]);
    }
    // hai đảo có họ hàng đánh nhau: gia đình bị chia cắt (một lần mỗi trận)
    for (const w of W.wars) if (!w.kinNoted && w.kind !== 'revolt' && W.kin[D().pairKey(w.a, w.b)]) { w.kinNoted = true; say(W, day, W.kin[D().pairKey(w.a, w.b)] + ' gia đình có họ hàng ở cả ' + W.islands[w.a].name + ' và ' + W.islands[w.b].name + ' bị chia cắt vì chiến tranh.', [w.a, w.b]); }
  }

  /* ---------- Dịch lây, đóng cầu ---------- */
  function infect(W, day, j, from, via) {
    const T = W.islands[j]; if (plague(T, day) || day - (T.plagueEnd || -1e9) < IMMUNE) return false;
    const src = plague(W.islands[from], day), sev = src ? src.sev : 1;
    if (!BK.Climate.start(T, 'plague', 15 + Math.floor(W.rng.next() * 15), sev)) return false;
    W.ecoStats.spread++;
    say(W, day, 'Dịch lây sang ' + T.name + ' (do ' + via + ' từ ' + W.islands[from].name + ').', [from, j]);
    return true;
  }
  function plagueDay(W, day, rng) {
    const N = W.islands.length, sick = W.islands.map((S) => !!plague(S, day));
    W.islands.forEach((S, i) => { if (!sick[i] && S.hadPlague) { S.hadPlague = false; S.plagueEnd = day; } if (sick[i]) S.hadPlague = true; });
    // các đường lây từ đảo đang có dịch
    for (let i = 0; i < N; i++) {
      if (!sick[i]) continue;
      const links = [];
      for (const v of W.visits) if (v.stage === 'stay' && (v.from === i || v.to === i)) links.push([v.from === i ? v.to : v.from, 'khách qua lại']);
      for (const c of W.caravans) if (c.a === i || c.b === i) links.push([c.a === i ? c.b : c.a, 'đoàn buôn']);
      for (const w of W.wars) if (w.kind !== 'revolt' && (w.a === i || w.b === i) && (w.stage === 'gate' || w.stage === 'inside' || w.stage === 'return')) links.push([w.a === i ? w.b : w.a, 'quân lính']);
      for (const [j, via] of links) if (j !== i && rng.chance(SPREAD)) infect(W, day, j, i, via);
    }
    // đóng cầu: đảo có cầu sang đảo đang có dịch, người đứng đầu đa nghi hay sợ hãi
    for (let j = 0; j < N; j++) {
      const S = W.islands[j]; if (sick[j] || (S.closed && S.closed.until > day)) continue;
      const k = [...Array(N).keys()].find((i) => sick[i] && D().bridged(W, i, j)); if (k == null) continue;
      const t = traitsOf(S); if (!t || !(t.paranoia > 0.55 || t.fear > 0.6) || !rng.chance(0.3)) continue;
      S.closed = { until: day + CLOSE_DAYS, why: 'dịch ở ' + W.islands[k].name }; W.ecoStats.closures++;
      say(W, day, S.name + ' đóng cầu, không cho người và hàng qua lại (vì dịch ở ' + W.islands[k].name + ').', [j, k]);
    }
    // đang đóng cầu: các đảo có cầu sang bớt tin
    for (let j = 0; j < N; j++) { const S = W.islands[j]; if (!S.closed || S.closed.until <= day) continue; for (let i = 0; i < N; i++) if (i !== j && D().bridged(W, i, j)) W.rel[i][j].trust = Math.max(0, W.rel[i][j].trust - 0.003); }
    // người ốm (đang có dịch): chừng 15% dân nằm nhà, đổi người mỗi ngày
    W.islands.forEach((S, i) => {
      if (!sick[i]) { S.sick = null; return; }
      const e = plague(S, day), L = living(S).filter((p) => !p.away && !p.role && !(BK.Posts && BK.Posts.of(p)));
      S.sick = L.filter(() => rng.chance(0.15 * (e.sev || 1))).map((p) => p.id); S.situChanged = true;
    });
  }
  // không qua lại, không buôn bán giữa a và b: một bên đóng cầu (qua cầu) hay bị cấm vận
  function blocked(W, a, b, day) {
    const shut = (i) => (W.islands[i].closed && W.islands[i].closed.until > day) || W.islands[i].situ.blockade > day; // đóng cầu vì dịch, hay bị vây (logic/battles.js)
    if ((shut(a) || shut(b)) && D().hops(a, b) === 1) return true;
    return !!(W.embargo && (W.embargo[a] > day || W.embargo[b] > day));
  }

  /* ---------- Chính trị trong đảo ---------- */
  function politicsDay(W, day, i, rng) {
    const S = W.islands[i];
    // tranh ngôi: người đứng đầu vừa mất mà trong hội đồng có người tham vọng
    const king = S.seats.king;
    if (S.lastKing != null && king !== S.lastKing && !(S.situ.coup && S.situ.coup.done)) {
      const old = S.people.get(S.lastKing), now = king != null ? S.people.get(king) : null;
      if (old && !old.alive && now && S.annexedBy == null) {
        const rival = BK.Council.members(S).filter((q) => q && q.alive && q.id !== now.id && P().traits(q).ambition > 0.75).sort((x, y) => P().traits(y).ambition - P().traits(x).ambition)[0];
        if (rival && rng.chance(0.5) && BK.Brain.startQuarrel(S, now.id, rival.id, rng)) { W.ecoStats.disputes++; note(S, day, 'seat',
            P().fullName(rival) + ' không phục, tranh ngôi với ' + P().fullName(now) + '.', [rival.id, now.id]); say(W, day,
            'Tranh ngôi ở ' + S.name + ' sau khi người đứng đầu mất.', [i]); }
      }
    }
    S.lastKing = S.seats.king;
    if (S.annexedBy != null) { S.discontent = 0; return; }
    // bất bình: đói, dịch, hạt nhân, cấm vận, người chết nhiều; nguôi dần
    const st = E().state(S), dead = S.deaths - (S.deaths0 == null ? S.deaths : S.deaths0); S.deaths0 = S.deaths;
    S.discontent = clamp((S.discontent || 0) * 0.99 + (st.hunger ? 0.012 : 0) + (plague(S, day) ? 0.004 : 0) + (S.falloutUntil > day ? 0.006 : 0) + (W.embargo[i] > day ? 0.003 : 0) + 0.004 * Math.max(0, dead - 1) - 0.002, 0, 1);
    // đảo chính đang diễn ra: xong cảnh thì người mới lên
    const C = S.situ.coup;
    if (C && !C.done && day >= C.until) {
      C.done = true; const gen = S.people.get(C.by), old = S.people.get(C.old);
      if (gen && gen.alive) {
        const seat = gen.role; if (seat) S.seats[seat] = null;
        if (old && old.alive) { old.role = null; S.situ.kneel = { id: old.id, until: day + 1, ruler: i }; }
        gen.role = 'king'; S.seats.king = gen.id; S.lastKing = gen.id; S.policy = null; S.discontent = 0.15; BK.Council.update(S);
        W.ecoStats.coups++; if (BK.Chronicle) BK.Chronicle.add(W, day, i, P().fullName(gen) + ' đảo chính ở ' + S.name, 4, 'hall');
        say(W, day, P().fullName(gen) + ' đảo chính ở ' + S.name + ', lật ' + (old ? P().fullName(old) : 'người đứng đầu') + ' (vì ' + C.why + ').', [i]);
        note(S, day, 'seat', P().fullName(gen) + ' lên làm người đứng đầu sau cuộc đảo chính.', [gen.id]);
      }
      S.situChanged = true;
    }
    if (C && !C.done) return;
    if (S.discontent < COUP_AT || (W.war && Wr().atWar(W, i))) return;
    const gen = ['general1', 'general2'].map((k) => S.seats[k]).filter((id) => id != null).map((id) => S.people.get(id)).find((q) => q && q.alive && !q.away && P().traits(q).ambition > 0.6 && P().traits(q).aggression > 0.5);
    if (!gen || S.seats.king == null || !rng.chance(COUP)) return;
    const why = st.hunger ? 'dân đói' : plague(S, day) ? 'dịch bệnh' : S.falloutUntil > day ? 'hạt nhân' : W.embargo[i] > day ? 'bị cấm vận' : 'dân bất bình';
    S.situ.coup = { by: gen.id, old: S.seats.king, until: day + COUP_SCENE, why, done: false }; S.situChanged = true;
    say(W, day, 'Tướng ' + P().fullName(gen) + ' dẫn lính vây nhà chính ' + S.name + '.', [i]);
  }

  /* ---------- Cấm vận ---------- */
  function embargoDay(W, day) {
    for (let a = 0; a < W.islands.length; a++) {
      if (W.embargo[a] > day || W.islands[a].annexedBy != null || !D().alive(W, a)) continue;
      const votes = W.islands.map((S, j) => j).filter((j) => j !== a && W.islands[j].annexedBy == null && D().alive(W, j) && W.rel[j][a].trust < 0.15 && W.rel[j][a].grudge > 0.4);
      if (votes.length < EMBARGO_VOTES) continue;
      W.embargo[a] = day + EMBARGO_DAYS; W.ecoStats.embargoes++;
      say(W, day, votes.map((j) => W.islands[j].name).join(', ') + ' cùng cấm vận ' + W.islands[a].name + ': không ai buôn bán với đảo này (vì mất tin và thù hằn).', [a, ...votes]);
    }
  }

  /* ---------- Vai của từng người (logic/brain.js hỏi sau logic/siege.js) ---------- */
  //   đảo chính   lính vây nhà chính, tướng chỉ huy, người đứng đầu bị vây co rúm, dân trốn trong nhà
  //   ốm          người ốm nằm nhà (dịch)
  //   cháy rừng   người lớn khoẻ xếp hàng chuyền nước từ giếng ra chỗ cháy (thứ tự trong hàng: bucketRank)
  function roleOf(S, p, d, ph) {
    const day = S.day, short = { until: day + 0.25, phase: ph };
    const C = S.situ.coup;
    if (C && !C.done && C.until > day) {
      if (p.id === C.by) return d('work', Object.assign({ verb: 'command', place: 'hall', reason: 'dẫn lính đảo chính' }, short));
      if (p.id === C.old) return d('panic', Object.assign({ place: 'hall', reason: 'bị lính vây trong nhà chính' }, short));
      if (p.job === 'soldier' && !p.away) return d('attack', Object.assign({ target: null, place: 'hall', reason: 'theo tướng vây nhà chính' }, short));
      if (!p.role) return d('work', Object.assign({ verb: 'hide', place: 'home', reason: 'đảo chính, đóng cửa ở trong nhà' }, short));
    }
    if (ph === 'night') return null;
    if (S.sick && S.sick.includes(p.id)) return d('work', Object.assign({ verb: 'sick', place: 'home', reason: 'ốm vì dịch, nằm nhà' }, short));
    const fire = BK.Climate.active(S, day).find((e) => e.key === 'wildfire');
    if (fire && !p.role && !p.away && (p.job === 'worker' || p.job === 'walker' || p.job === 'builder') && P().ageOf(p, day) >= 16 && P().ageOf(p, day) < 60 && !(BK.Posts && BK.Posts.of(p))) {
      const line = S.bucketLine && S.bucketLine.day === Math.floor(day) ? S.bucketLine : (S.bucketLine = { day: Math.floor(day),
          ids: living(S).filter((q) => !q.role && !q.away && (q.job === 'worker' || q.job === 'walker' || q.job === 'builder') && P().ageOf(q,
          day) >= 16 && P().ageOf(q, day) < 60).slice(0, 14).map((q) => q.id) });
      const k = line.ids.indexOf(p.id);
      if (k >= 0) return d('work', Object.assign({ verb: 'bucket', place: 'bucket', rank: k, of: line.ids.length, reason: 'chuyền nước chữa cháy rừng' }, short));
    }
    return null;
  }

  /* ---------- Mỗi ngày (logic/world.js) ---------- */
  function dayTick(W, day, rng) {
    if (!W.ecoStats) init(W);
    W.islands.forEach((S) => envDay(S, day));
    if (W.diplomacy) {
      if (W.war) for (let i = 0; i < W.islands.length; i++) fleeDay(W, day, i, rng);
      marryDay(W, day, rng);
      plagueDay(W, day, rng);
    }
    for (let i = 0; i < W.islands.length; i++) politicsDay(W, day, i, rng);
    if (W.diplomacy) embargoDay(W, day);
  }
  return { init, dayTick, output, settle, arrive, blocked, roleOf, infect, env };
});
