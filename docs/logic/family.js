/* Bể Kính · logic/family.js
 * Mỗi mốc thế hệ (1,5 năm): ghép đôi người còn sống chưa có vợ chồng, rồi mỗi cặp sinh 1 tới 3 con mang gen lai.
 * Luật: cấm cha mẹ với con và anh chị em ruột; anh em họ được nhưng kém hợp; hết người hợp lệ thì cưới
 * một người dân thường (bộ gen ngẫu nhiên theo nét chung của đảo, mang dòng máu mới vào).
 * Cần: logic/rules.js, logic/genes.js, logic/people.js. Thao tác trên trạng thái đảo do logic/island.js tạo. */
(function (root, factory) {
  const BK = root.BK || (root.BK = {});
  BK.Family = factory(BK);
  if (typeof module === 'object' && module.exports) module.exports = BK.Family;
})(typeof self !== 'undefined' ? self : globalThis, function (BK) {
  'use strict';
  const R = BK.Rules, G = BK.Genes, P = BK.People;

  const living = (S) => [...S.people.values()].filter((p) => p.alive);
  const single = (S, p) => !p.spouse || !S.people.get(p.spouse).alive;

  /* ---------- Điểm hợp nhau của hai người ---------- */
  function fit(S, a, b, rng) {
    let f = (1 - G.distance(a.genome, b.genome)) * R.MATCH_FIT_WEIGHT + rng.next() * (1 - R.MATCH_FIT_WEIGHT);
    if (P.cousins(a, b, S.people)) f -= R.COUSIN_PENALTY;
    f -= Math.abs(P.ageOf(a, S.day) - P.ageOf(b, S.day)) / 100; // chênh tuổi nhiều thì kém hợp
    return f;
  }

  /* ---------- Ghép đôi ---------- */
  // người cần vợ chồng: đủ tuổi, còn độc thân, là người trong hội đồng hoặc nhánh phụ (không tính người dân thường cưới vào)
  function matchPairs(S, rng) {
    const pool = living(S).filter((p) => !p.commoner && single(S, p) && P.ageOf(p, S.day) >= R.ADULT_AGE && P.ageOf(p, S.day) <= R.FERTILE_MAX + 5);
    const men = pool.filter((p) => p.sex === 'm'), women = pool.filter((p) => p.sex === 'f');
    const pairs = [];
    for (const a of men) for (const b of women) if (!P.forbidden(a, b)) pairs.push([fit(S, a, b, rng), a, b]);
    pairs.sort((x, y) => y[0] - x[0]);
    const taken = new Set(), made = [];
    // ưu tiên người trong hội đồng được ghép trước
    pairs.sort((x, y) => (+!!y[1].role + +!!y[2].role) - (+!!x[1].role + +!!x[2].role) || y[0] - x[0]);
    for (const [, a, b] of pairs) { if (taken.has(a.id) || taken.has(b.id)) continue; taken.add(a.id); taken.add(b.id); made.push([a, b]); }
    // người trong hội đồng còn lẻ bóng: cưới người dân thường
    for (const p of pool) if (!taken.has(p.id) && p.role) made.push(p.sex === 'm' ? [p, commonerFor(S, p, rng)] : [commonerFor(S, p, rng), p]);
    return made;
  }
  function commonerFor(S, p, rng) {
    const sex = p.sex === 'm' ? 'f' : 'm', age = Math.max(R.ADULT_AGE, P.ageOf(p, S.day) + rng.range(-4, 4));
    const q = P.create({ id: S.nextId++, name: P.pickName(rng, sex, S.usedNames), clan: rng.pick(S.clans), sex, born: S.day - age / R.AGE_PER_DAY, commoner: true, genome: G.random(rng, S.bias), gen: p.gen });
    S.people.set(q.id, q); S.usedNames.add(q.name);
    return q;
  }
  function marry(S, a, b) {
    a.spouse = b.id; b.spouse = a.id; a.spouses.push(b.id); b.spouses.push(a.id);
    S.log.push({ day: S.day, kind: 'marry', ids: [a.id, b.id], text: P.fullName(a) + ' và ' + P.fullName(b) + (b.commoner || a.commoner ? ' (người dân thường)' : '') + ' nên duyên.' });
  }

  /* ---------- Sinh con ---------- */
  // con mang gia tộc của người cha trong hội đồng (nếu cha là người dân thường thì theo mẹ)
  function haveChildren(S, a, b, rng, food) {
    const mom = a.sex === 'f' ? a : b, dad = a.sex === 'm' ? a : b;
    if (P.ageOf(mom, S.day) > R.FERTILE_MAX) return [];
    const room = R.NAMED_CAP - living(S).length; if (room <= 0) return [];
    const n = Math.min(room, Math.max(0, Math.min(R.CHILDREN[1], rng.int(R.CHILDREN[0], R.CHILDREN[1]) - (food < 0.5 ? 1 : 0)))); // đói thì ít con hơn
    const clan = dad.commoner ? mom.clan : dad.clan, out = [];
    for (let i = 0; i < n; i++) {
      const sex = rng.chance(0.5) ? 'm' : 'f', genome = G.cross(dad.genome, mom.genome, rng);
      const c = P.create({ id: S.nextId++, name: P.pickName(rng, sex, S.usedNames), clan, sex, born: S.day - i * 15, parents: [dad.id, mom.id], genome, gen: Math.max(dad.gen, mom.gen) + 1 });
      S.people.set(c.id, c); S.usedNames.add(c.name); dad.children.push(c.id); mom.children.push(c.id); out.push(c);
      const notes = [];
      if (genome.mutations.length) notes.push('đột biến ' + genome.mutations.map((m) => G.traitName(m.key) + (m.delta > 0 ? ' tăng' : ' giảm')).join(', '));
      if (genome.rare) notes.push('mang gen hiếm ' + G.rareName(genome.rare));
      notes.push('thói quen ' + G.habitName(genome.habit).toLowerCase() + (genome.habitFrom === 'new' ? ' (mới)' : genome.habitFrom === 'a' ? ' giống cha' : ' giống mẹ'));
      S.log.push({ day: S.day, kind: 'birth', ids: [c.id, dad.id, mom.id], text: P.fullName(c) + ' chào đời, con của ' + P.fullName(dad) + ' và ' + P.fullName(mom) + ': ' + notes.join('; ') + '.' });
    }
    return out;
  }

  /* ---------- Một mốc thế hệ ---------- */
  function generation(S, rng) {
    for (const [a, b] of matchPairs(S, rng)) marry(S, a, b);
    const couples = new Set();
    for (const p of living(S)) {
      if (!p.spouse) continue; const q = S.people.get(p.spouse);
      if (!q.alive) continue; const key = Math.min(p.id, q.id) + ':' + Math.max(p.id, q.id);
      if (couples.has(key)) continue; couples.add(key);
      haveChildren(S, p, q, rng, S.food);
    }
  }

  return { generation, matchPairs, marry, haveChildren, fit };
});
