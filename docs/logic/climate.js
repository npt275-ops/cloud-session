/* Bể Kính · logic/climate.js · Khí hậu và thiên tai của từng đảo (hệ thống tự sinh)
 * (design/quy-trinh-tong-quat.md mục 8) Mỗi đảo một bộ thiên tai theo mùa (HAZARDS), cộng dịch bệnh hiếm gặp ở mọi đảo.
 * Mỗi ngày, mỗi thiên tai có một khả năng nổ ra đúng mùa của nó; khi đang có thì:
 *   prod    hệ số sản xuất của từng loại tài nguyên (logic/economy.js đọc qua factor)
 *   stress  độ căng thẳng nó đè lên dân (0..1): ngoại gen (logic/epigen.js) đọc qua stress
 *   shelter dân trú trong nhà ban ngày (bão, bão tuyết, bão cát; lính gác vẫn giữ chốt) (logic/brain.js đọc qua taskFor)
 *   kill    khả năng mỗi ngày có một người yếu (già, trẻ nhỏ) mất vì nó
 * Hạn hán vẫn ghi vào S.situ.drought (bộ não, drama đã đọc chỗ đó). Mức nặng nhẹ mỗi lần một khác.
 * Không vẽ gì, chạy được bằng Node. Cần: logic/rules.js, logic/people.js. */
(function (root, factory) {
  const BK = root.BK || (root.BK = {});
  BK.Climate = factory(BK);
  if (typeof module === 'object' && module.exports) module.exports = BK.Climate;
})(typeof self !== 'undefined' ? self : globalThis, function (BK) {
  'use strict';
  const SPRING = 0, SUMMER = 1, AUTUMN = 2, WINTER = 3;
  // key, tên, mùa, khả năng mỗi ngày đúng mùa, số ngày [ít, nhiều], hệ số sản xuất, căng thẳng, trú trong nhà, chết người
  const H = (key, name, seasons, chance, days, prod, stress, o) => Object.assign({ key, name, seasons, chance, days, prod, stress, shelter: false, kill: 0 }, o || {});
  const ALL = [SPRING, SUMMER, AUTUMN, WINTER];
  const PLAGUE = H('plague', 'Dịch bệnh', ALL, 0.0004, [15, 30], { food: 0.8, wood: 0.7, stone: 0.7, metal: 0.7, energy: 0.8, luxury: 0.7 }, 0.8, { kill: 0.05 });
  const HAZARDS = {
    plains: [H('drought', 'Hạn hán', [SUMMER], 0.0048, [18, 40], { food: 0.35 }, 0.5), H('flood', 'Lũ lụt', [SPRING], 0.003, [6, 12], { food: 0.5, wood: 0.8 }, 0.5, { kill: 0.01 })],
    forest: [H('wildfire', 'Cháy rừng', [SUMMER, AUTUMN], 0.004, [5, 10], { wood: 0.4, food: 0.8 }, 0.6, { kill: 0.01 })],
    mountain: [H('landslide', 'Sạt lở', [SPRING, AUTUMN], 0.003, [4, 8], { stone: 0.5, metal: 0.5 }, 0.6, { kill: 0.02 }), H('frost', 'Rét đậm', [WINTER], 0.004, [8, 16], { food: 0.6 }, 0.4)],
    tundra: [H('blizzard', 'Bão tuyết', [WINTER], 0.012, [3, 8], { food: 0.4, wood: 0.4, stone: 0.4, metal: 0.4, energy: 0.6, luxury: 0.4 }, 0.6, { shelter: true, kill: 0.015 })],
    coast: [H('seastorm', 'Bão biển', [AUTUMN], 0.008, [2, 5], { food: 0.4, luxury: 0.6, wood: 0.8 }, 0.6, { shelter: true, kill: 0.01 })],
    desert: [H('sandstorm', 'Bão cát', [SPRING, SUMMER], 0.007, [2, 5], { food: 0.5, stone: 0.5, metal: 0.5, energy: 0.5, luxury: 0.5 }, 0.5, { shelter: true }), H('heatwave', 'Nắng nóng', [SUMMER], 0.004, [6, 12], { food: 0.6, energy: 1.2 }, 0.4, { kill: 0.01 })],
  };
  const list = (S) => (HAZARDS[S.key] || []).concat([PLAGUE]);
  const seasonOf = (day) => Math.floor((((day % BK.Rules.YEAR_DAYS) + BK.Rules.YEAR_DAYS) % BK.Rules.YEAR_DAYS) / 90);
  const state = (S) => S.climate || (S.climate = { active: [], count: {} }); // count: số lần mỗi thiên tai đã nổ ra (bảng dev, kiểm thử)
  const live = (S, day) => state(S).active.filter((e) => e.until > day);

  function start(S, key, days, sev) {
    const Z = list(S).find((x) => x.key === key) || Object.values(HAZARDS).flat().find((x) => x.key === key); if (!Z) return null;
    const st = state(S); if (st.active.some((e) => e.key === key && e.until > S.day)) return null;
    const e = { key, name: Z.name, from: S.day, until: S.day + days, sev: sev || 1 };
    st.active.push(e); st.count[key] = (st.count[key] || 0) + 1;
    if (key === 'drought') S.situ.drought = e.until;
    S.log.push({ day: Math.floor(S.day), kind: 'climate', climate: key, ids: [], text: Z.name + ' ở ' + S.name + (key === 'drought' ? ', ruộng nứt nẻ.' : '.') });
    S.situChanged = true;
    return e;
  }
  // mỗi ngày: thiên tai hết hạn thì tan, thiên tai mới có thể nổ ra đúng mùa; người yếu có thể mất vì thiên tai đang có
  function dayTick(S, day, rng) {
    const st = state(S), season = seasonOf(day);
    for (const e of st.active) if (e.until <= day && !e.ended) { e.ended = true; S.log.push({ day: Math.floor(day), kind: 'climate', climate: e.key, ids: [], text: e.name + ' ở ' + S.name + ' đã qua.' }); S.situChanged = true; }
    st.active = st.active.filter((e) => e.until > day - 30); // giữ lại ít lâu cho bảng dev
    for (const Z of list(S)) if (Z.seasons.includes(season) && rng.chance(Z.chance)) start(S, Z.key, rng.int(Z.days[0], Z.days[1]), 0.7 + rng.next() * 0.6);
    for (const e of live(S, day)) {
      const Z = list(S).find((x) => x.key === e.key); if (!Z || !Z.kill || !rng.chance(Z.kill * e.sev)) continue;
      const P = BK.People, R = BK.Rules, weak = BK.Island.living(S).filter((p) => P.ageOf(p, day) >= R.OLD_AGE || P.ageOf(p, day) < 4 || (e.key === 'plague' && rng.chance(0.2)));
      if (!weak.length) continue;
      const v = rng.pick(weak); v.alive = false; v.died = day; v.cause = e.name.toLowerCase(); S.deaths++;
      S.log.push({ day: Math.floor(day), kind: 'death', ids: [v.id], text: P.fullName(v) + ' mất vì ' + e.name.toLowerCase() + '.' }); S.situChanged = true;
    }
  }
  // hệ số sản xuất của một loại tài nguyên hôm nay (nhân mọi thiên tai đang có, theo mức nặng)
  function factor(S, r, day) { let k = 1; for (const e of live(S, day)) { const Z = list(S).find((x) => x.key === e.key), m = Z && Z.prod[r]; if (m != null) k *= 1 - (1 - m) * Math.min(1.3, e.sev); } return Math.max(0.05, k); }
  // độ căng thẳng do thiên tai hôm nay (0..1)
  function stress(S, day) { let s = 0; for (const e of live(S, day)) { const Z = list(S).find((x) => x.key === e.key); if (Z) s = Math.max(s, Z.stress * Math.min(1.3, e.sev)); } return Math.min(1, s); }
  // bão, bão tuyết, bão cát: dân trú trong nhà ban ngày (lính gác vẫn giữ chốt); d(state, o) tạo việc của logic/brain.js
  function taskFor(S, p, d) {
    const e = live(S, S.day).find((x) => { const Z = list(S).find((z) => z.key === x.key); return Z && Z.shelter; }); if (!e) return null;
    if (p.job === 'gatekeeper' || p.job === 'sideguard') return null;
    return d('work', { verb: 'sleep', place: 'home', reason: 'trú ' + e.name.toLowerCase() + ' trong nhà', until: e.until, phase: null });
  }
  return { HAZARDS, PLAGUE, start, dayTick, factor, stress, taskFor, active: live, seasonOf };
});
