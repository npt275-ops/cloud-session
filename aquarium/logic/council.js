/* Bể Kính · logic/council.js
 * Hội đồng 8 ghế của một đảo: vua, hai tướng, quân sư, tư tế, thương chủ, học giả, thợ cả.
 * Xếp người vào ghế theo độ hợp gen; ghế trống (mất, già quá) thì người cùng gia tộc giỏi nhất vào thay,
 * ưu tiên giữ 4 nam 4 nữ. Cần: logic/rules.js, logic/people.js. */
(function (root, factory) {
  const BK = root.BK || (root.BK = {});
  BK.Council = factory(BK);
  if (typeof module === 'object' && module.exports) module.exports = BK.Council;
})(typeof self !== 'undefined' ? self : globalThis, function (BK) {
  'use strict';
  const R = BK.Rules, P = BK.People;

  // mỗi ghế: tên, và gen nào làm người ngồi ghế này giỏi
  const SEATS = [
    { key: 'king', name: 'Vua', nameF: 'Nữ vương', fit: (t) => t.ambition * 0.5 + t.intellect * 0.3 + (1 - t.meekness) * 0.2 },
    { key: 'general1', name: 'Tướng', fit: (t) => t.aggression * 0.6 + (1 - t.fear) * 0.4 },
    { key: 'general2', name: 'Tướng', fit: (t) => t.aggression * 0.5 + (1 - t.fear) * 0.3 + t.intellect * 0.2 },
    { key: 'advisor', name: 'Quân sư', fit: (t) => t.cunning * 0.5 + t.intellect * 0.4 + t.paranoia * 0.1 },
    { key: 'priest', name: 'Tư tế', fit: (t) => t.piety * 0.8 + (1 - t.aggression) * 0.2 },
    { key: 'merchant', name: 'Thương chủ', fit: (t) => t.cunning * 0.4 + t.ambition * 0.4 + t.intellect * 0.2 },
    { key: 'scholar', name: 'Học giả', fit: (t) => t.intellect * 0.8 + (1 - t.aggression) * 0.2 },
    { key: 'builder', name: 'Thợ cả', fit: (t) => (1 - t.fear) * 0.3 + t.intellect * 0.3 + (1 - t.paranoia) * 0.4 },
  ];
  const seatName = (key, sex) => { const s = SEATS.find((x) => x.key === key); return s ? (sex === 'f' && s.nameF ? s.nameF : s.name) : ''; };

  // chia ghế lần đầu: lần lượt từng ghế chọn người hợp nhất còn trống (vua chọn trước)
  function assignAll(S, members) {
    const free = new Set(members.map((p) => p.id));
    for (const seat of SEATS) {
      let best = null, bs = -1;
      for (const id of free) { const p = S.people.get(id), f = seat.fit(p.genome.traits); if (f > bs) { bs = f; best = p; } }
      if (!best) break;
      free.delete(best.id); best.role = seat.key; S.seats[seat.key] = best.id;
    }
  }

  // mỗi ngày: người trong ghế mất hay quá già thì rời ghế, rồi lấp ghế trống
  function update(S) {
    for (const seat of SEATS) {
      const id = S.seats[seat.key], p = id != null ? S.people.get(id) : null;
      if (p && (!p.alive || P.ageOf(p, S.day) >= R.RETIRE_AGE)) {
        p.role = null; S.seats[seat.key] = null;
        if (p.alive) S.log.push({ day: S.day, kind: 'retire', ids: [p.id], text: P.fullName(p) + ' rời ghế ' + seatName(seat.key, p.sex) + ' vì tuổi già.' });
        fill(S, seat, p);
      } else if (!p) fill(S, seat, null);
    }
  }
  function fill(S, seat, prev) {
    const counts = { m: 0, f: 0 };
    for (const k in S.seats) { const q = S.seats[k] != null && S.people.get(S.seats[k]); if (q) counts[q.sex]++; }
    const want = counts.m > counts.f ? 'f' : counts.f > counts.m ? 'm' : null; // giữ 4 nam 4 nữ khi có thể
    let best = null, bs = -1;
    for (const p of S.people.values()) {
      if (!p.alive || p.role || p.commoner) continue;
      const age = P.ageOf(p, S.day); if (age < R.ADULT_AGE || age >= R.RETIRE_AGE) continue;
      let f = seat.fit(p.genome.traits);
      if (prev && p.clan === prev.clan) f += 0.3;          // cùng gia tộc với người vừa rời ghế
      if (prev && prev.children.includes(p.id)) f += 0.15;   // con của người vừa rời ghế
      if (want && p.sex === want) f += 0.1;
      if (f > bs) { bs = f; best = p; }
    }
    // không còn ai có tên đủ tuổi: lấy người dân thường đã cưới vào làng, còn hơn để ghế trống
    if (!best) for (const p of S.people.values()) { if (!p.alive || p.role || !p.commoner) continue; const age = P.ageOf(p, S.day); if (age < R.ADULT_AGE || age >= R.RETIRE_AGE) continue; const f = seat.fit(p.genome.traits); if (f > bs) { bs = f; best = p; } }
    if (!best) return;
    best.role = seat.key; S.seats[seat.key] = best.id;
    S.log.push({ day: S.day, kind: 'seat', ids: [best.id], text: P.fullName(best) + ' lên làm ' + seatName(seat.key, best.sex) + (prev ? ', thay ' + P.fullName(prev) : '') + '.' });
  }
  const members = (S) => SEATS.map((s) => S.seats[s.key]).filter((id) => id != null).map((id) => S.people.get(id));

  return { SEATS, seatName, assignAll, update, members };
});
