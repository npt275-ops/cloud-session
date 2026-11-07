/* Bể Kính · logic/brain.js
 * Bộ não tình huống: đọc tình huống của đảo (hạn hán, lệnh chiến tranh, lễ hội, cãi nhau, tang) và gen của từng người
 * để chọn một trong năm trạng thái cử động, kèm mục tiêu và độ mạnh:
 *   idle (đứng yên, có thể kèm tư thế cầu nguyện), walk (đi), talk (nói chuyện hay tranh cãi), attack (đánh), panic (hoảng sợ chạy).
 * Cũng tính "núm vặn cử động" từ gen: nhịp, biên độ, tư thế, độ run, liếc nhìn. Phần vẽ (render/) chỉ đọc kết quả ở đây.
 * Cần: logic/rules.js, logic/people.js. */
(function (root, factory) {
  const BK = root.BK || (root.BK = {});
  BK.Brain = factory(BK);
  if (typeof module === 'object' && module.exports) module.exports = BK.Brain;
})(typeof self !== 'undefined' ? self : globalThis, function (BK) {
  'use strict';
  const R = BK.Rules, P = BK.People;
  const STATES = ['idle', 'walk', 'talk', 'attack', 'panic', 'work']; // work: làm một việc (verb) ở chỗ của nó (logic/tasks.js)
  const STATE_NAME = { idle: 'Đứng yên', walk: 'Đi lại', talk: 'Nói chuyện', argue: 'Tranh cãi', attack: 'Chiến đấu', panic: 'Hoảng sợ', pray: 'Cầu nguyện', work: 'Làm việc' };
  // những chỗ trong làng (vị trí cụ thể do phần vẽ đặt, logic chỉ biết tên chỗ)
  const PLACES = ['home', 'field', 'hall', 'square', 'bridge', 'guard', 'site', 'repair', 'market', 'shrine', 'school', 'visit', 'stroll', 'patrol', 'gate', 'gateL', 'gateR', 'podium', 'hallLoop', 'woods', 'quarry', 'plant']; // gateL, gateR: cổng phụ trái, phải; podium: bục diễn thuyết giữa sân; hallLoop: vòng đi dạo quanh nhà chính; woods, quarry, plant: chỗ đốn gỗ, mỏ đá, chỗ làm năng lượng // guard: chỗ lính đi tuần (cổng, mép làng); site: công trình đang dựng

  /* ---------- Núm vặn cử động: tính cách và gen dáng ảnh hưởng tới cách cử động ---------- */
  // traits: tính cách biểu hiện (gen gốc + ngoại gen); thiếu thì dùng gen gốc
  function knobs(genome, stress, traits) {
    const t = traits || genome.traits, g = genome.gait, s = stress || 0;
    const c = (v) => Math.max(0, Math.min(1, v));
    return {
      tempo: 0.7 + 0.5 * g.tempo + 0.4 * t.aggression - 0.25 * t.meekness + 0.3 * s,   // nhịp: hiếu chiến, căng thẳng thì nhanh
      amplitude: c(0.45 + 0.5 * t.aggression - 0.35 * t.fear + 0.2 * t.ambition + 0.15 * s), // biên độ: hiếu chiến vung rộng, sợ hãi co rụt
      lean: Math.max(-1, Math.min(1, 0.8 * t.aggression - 0.9 * t.fear - 0.4 * t.meekness + 0.1)), // ngả tới (xông) hay ngả lùi (lùi về sau)
      jitter: c(0.6 * t.fear + 0.4 * t.meekness - 0.2) * (0.5 + s),                    // lóng ngóng, run
      glance: c(0.75 * t.paranoia + 0.35 * t.cunning - 0.15),                         // hay liếc nhìn quanh
      stride: g.stride, posture: g.posture, stance: g.stance,                           // gen dáng thừa hưởng từ cha mẹ
    };
  }

  /* ---------- Chọn việc cho một người ---------- */
  // trả về { state, mood, target, place, intensity, until } (mood: 'argue' | 'pray' | null)
  function decide(S, p, rng) {
    const t = P.traits(p), X = S.situ, day = S.day, age = P.ageOf(p, day);
    const d = (state, o) => Object.assign({ state, mood: null, target: null, place: null, intensity: 0.5, until: day + rng.range(0.15, 0.6) }, o);
    const king = S.seats.king != null ? S.seats.king : null;
    const ph = BK.Schedule ? BK.Schedule.phase(S.tod) : null, night = ph === 'night';
    // đêm (trừ lúc có cãi nhau hay chiến tranh): mọi người về nhà ngủ, lính thay nhau gác (logic/tasks.js)
    const calm = !(X.quarrel && X.quarrel.until > day && (X.quarrel.a === p.id || X.quarrel.b === p.id)) && !(X.war > day);
    if (night && calm && BK.Tasks) return BK.Tasks.pick(S, p, rng, d, friendOf);
    if (age < 6) return d(rng.chance(0.5) ? 'walk' : 'idle', { place: 'home', intensity: 0.3, phase: ph }); // trẻ nhỏ quanh quẩn gần nhà
    // bão, bão tuyết, bão cát (logic/climate.js): ai cũng trú trong nhà, trừ lính gác cổng
    if (BK.Climate) { const c = BK.Climate.taskFor(S, p, d); if (c) return c; }
    // drama (logic/dramas.js): người trong drama bỏ việc thường ra tham gia (tan thì lịch thường đưa về đúng việc của mình);
    // người ngoài drama mà sợ nó (avoid: người nhút nhát khi có bạo loạn) thì ở trong nhà
    if (BK.Dramas && !(X.war > day)) { const dt = BK.Dramas.taskFor(S, p, d); if (dt) return dt; }

    // cãi nhau giữa hai người
    if (X.quarrel && X.quarrel.until > day && (X.quarrel.a === p.id || X.quarrel.b === p.id)) {
      const other = X.quarrel.a === p.id ? X.quarrel.b : X.quarrel.a;
      if (t.aggression > 0.62 && rng.chance(0.35 + t.aggression * 0.3)) return d('attack', { target: other, intensity: t.aggression });
      if (t.fear > 0.65 && rng.chance(0.4)) return d('panic', { place: 'home', intensity: t.fear });
      return d('talk', { mood: 'argue', target: other, intensity: 0.5 + t.aggression * 0.5 });
    }
    // lệnh chiến tranh: máu chiến thì ra cầu đánh, nhút nhát thì chạy, sùng đạo thì cầu nguyện, đa nghi thì cãi với vua
    if (X.war > day) {
      if (t.piety > 0.68 && t.aggression < 0.6) return d('idle', { mood: 'pray', place: 'shrine', intensity: t.piety });
      if (t.fear > 0.6 && t.fear > t.aggression) return d('panic', { place: 'home', intensity: t.fear });
      if (t.aggression > 0.55 || p.job === 'soldier' || p.role === 'general1' || p.role === 'general2') return d('attack', { place: 'bridge', intensity: 0.4 + t.aggression * 0.6 });
      if (t.paranoia > 0.6 && king != null && king !== p.id) return d('talk', { mood: 'argue', target: king, intensity: t.paranoia });
      return d('walk', { place: 'home', intensity: 0.6 });
    }
    // cảnh theo sự kiện (logic/scenes.js): người có vai trong cảnh (đám tang…) làm việc của cảnh
    if (BK.Scenes) { const sc = BK.Scenes.roleOf(S, p, d, ph); if (sc) return sc; }
    // hạn hán: cầu mưa, đổ lỗi cho người cầm quyền, lo lắng, hoặc ra đồng
    if (X.drought > day) {
      if (t.piety > 0.6 && rng.chance(0.7)) return d('idle', { mood: 'pray', place: 'shrine', intensity: t.piety });
      // người đa nghi, hiếu chiến cằn nhằn với hàng xóm (chưa kéo tới nhà chính; tới khi bất bình thành biểu tình, logic/island.js)
      if ((t.paranoia > 0.6 || t.aggression > 0.65) && rng.chance(0.5)) { const f = friendOf(S, p, rng); if (f != null) return d('talk', { mood: 'argue', target: f, intensity: 0.5 + t.aggression * 0.3 }); }
      if (t.fear > 0.65 && rng.chance(0.4)) return d('panic', { place: 'home', intensity: t.fear * 0.7, until: day + 0.15 });
      return d('walk', { place: 'field', intensity: 0.4 });
    }
    // tang: người sùng đạo cầu nguyện ở chỗ thờ, người khác lặng lẽ ở nhà
    if (X.mourning > day && rng.chance(0.6)) return d('idle', { mood: t.piety > 0.55 ? 'pray' : null, place: t.piety > 0.55 ? 'shrine' : 'home', intensity: 0.3, phase: ph });
    // lễ hội: tụ ở quảng trường, nói cười, đung đưa
    if (X.festival > day) { const r0 = rng.next(); return r0 < 0.4 ? d('work', { verb: 'dance', place: 'square', reason: 'nhảy múa ngày hội', intensity: 0.8, phase: ph }) : r0 < 0.75 ? d('talk', { target: friendOf(S, p, rng), place: 'square', intensity: 0.7, phase: ph }) : d('walk', { place: 'square', intensity: 0.7, phase: ph }); }
    // ngày thường: việc theo vai và theo buổi (logic/tasks.js); người đa nghi, hiếu chiến đôi khi gây sự
    const r = rng.next();
    if (r > 0.993 && t.paranoia + t.aggression > 1.25) { const other = friendOf(S, p, rng, true); if (other != null) startQuarrel(S, p.id, other, rng); }
    if (BK.Tasks) return BK.Tasks.pick(S, p, rng, d, friendOf);
    if (r < 0.38) return d('walk', { place: rng.pick(['home', 'field', 'hall', 'square', 'field']), intensity: 0.4 });
    if (r < 0.66) { const f = friendOf(S, p, rng); if (f != null) return d('talk', { target: f, intensity: 0.4 }); }
    return d('idle', { place: rng.chance(0.5) ? 'home' : 'square', intensity: 0.3 });
  }
  // bạn để nói chuyện: người hợp tính nhất trong vài người ngẫu nhiên (enemy: người khác tính nhất)
  function friendOf(S, p, rng, enemy) {
    const pool = [...S.people.values()].filter((q) => q.alive && q.id !== p.id && P.ageOf(q, S.day) >= 6);
    if (!pool.length) return null;
    let best = null, bs = -1e9;
    for (let i = 0; i < 4; i++) { const q = rng.pick(pool), dist = BK.Genes.distance(p.genome, q.genome), sc = enemy ? dist : -dist + (q.id === p.spouse ? 0.3 : 0); if (sc > bs) { bs = sc; best = q; } }
    return best ? best.id : null;
  }
  function startQuarrel(S, a, b, rng) {
    if (S.situ.quarrel && S.situ.quarrel.until > S.day) return false;
    const A = S.people.get(a), B = S.people.get(b);
    S.situ.quarrel = { a, b, until: S.day + rng.range(1, 2.5) };
    S.log.push({ day: S.day, kind: 'quarrel', ids: [a, b], text: P.fullName(A) + ' và ' + P.fullName(B) + ' to tiếng với nhau.' });
    return true;
  }

  /* ---------- Mỗi nhịp nghĩ: ai hết việc thì chọn việc mới ---------- */
  function think(S, rng) {
    for (const p of S.people.values()) {
      if (!p.alive) { S.minds.delete(p.id); continue; }
      const m = S.minds.get(p.id);
      const ph = BK.Schedule ? BK.Schedule.phase(S.tod) : null;
      if (m && m.until > S.day && !S.situChanged && (!m.phase || m.phase === ph)) continue;
      const n = decide(S, p, rng);
      n.stress = stressOf(S, p);
      S.minds.set(p.id, n);
    }
    // kịch bản vừa mở trong lúc nghĩ (họp hội đồng, báo tin, hộ vệ…, logic/leader.js đặt S.rethink): lần nghĩ sau mọi người xét lại
    S.situChanged = !!S.rethink; S.rethink = false;
  }
  // độ căng thẳng 0..1 của một người lúc này
  function stressOf(S, p) {
    const X = S.situ, t = P.traits(p), day = S.day;
    let s = 0;
    if (X.war > day) s = Math.max(s, 0.5 + 0.5 * Math.max(t.fear, t.aggression));
    if (X.drought > day) s = Math.max(s, 0.3 + 0.4 * t.paranoia + 0.3 * t.fear);
    if (X.quarrel && X.quarrel.until > day && (X.quarrel.a === p.id || X.quarrel.b === p.id)) s = Math.max(s, 0.6 + 0.4 * t.aggression);
    return Math.min(1, s);
  }

  return { STATES, STATE_NAME, PLACES, knobs, decide, think, startQuarrel, stressOf };
});
