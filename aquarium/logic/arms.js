/* Bể Kính · logic/arms.js · Vũ khí qua từng thời (design/chien-tranh-thinh-vuong.md mục 1)
 * Mỗi đạo quân có ba loại người: cận chiến (giáo, kiếm…), bắn xa (ná, cung, nỏ, súng…) và máy công thành do lính điều khiển
 * (máy bắn đá, đại bác, pháo, xe bọc thép, drone, pháo plasma). Loại nào, mạnh bao nhiêu theo thời của đảo (KIT). Máy công thành
 * tốn tài nguyên thật lúc ra quân (gỗ, kim loại, năng lượng): đảo nghèo thì không có máy, chỉ có người.
 * Trận ở cổng (logic/war.js gọi gateTick mỗi đợt, trước khi áp sát):
 *   bắn xa        người bắn hai bên bắn nhau từ xa; bên giữ đứng sau tường nên được che (WALL_COVER)
 *   công thành    máy nã vào cổng (cổng mất độ bền, logic/siege.js), xe bọc thép, drone còn bắn người giữ
 *   tên lửa đốt   từ thời 3, người bắn của bên đánh có khi bắn lửa vào nhà dân trong thành
 *   đặc biệt      thời 9: cổng sống tự vá (bên giữ); thời 11: cổng dịch chuyển, một toán quân vào thẳng trong thành mở cổng;
 *                 thời 12: lá chắn năng lượng của bên giữ đỡ phần lớn đòn tới khi bị phá
 * Không vẽ gì, chạy được bằng Node. Cần: logic/siege.js, logic/people.js. */
(function (root, factory) {
  const BK = root.BK || (root.BK = {});
  BK.Arms = factory(BK);
  if (typeof module === 'object' && module.exports) module.exports = BK.Arms;
})(typeof self !== 'undefined' ? self : globalThis, function (BK) {
  'use strict';
  // theo thời (1..12): vũ khí cận chiến, bắn xa (tên, phần người bắn, sức), máy công thành, đặc biệt
  const K = (melee, ranged, share, pow, engine, o) => Object.assign({ melee, ranged, share, pow, engine }, o || {});
  const KIT = [null,
    K('spear', 'sling', 0.25, 0.5, null),
    K('spear', 'bow', 0.35, 0.7, null),
    K('sword', 'crossbow', 0.4, 0.85, 'catapult', { fire: true }),
    K('sword', 'musket', 0.45, 1.0, 'cannon', { fire: true }),
    K('bayonet', 'rifle', 0.5, 1.2, 'artillery', { fire: true }),
    K('bayonet', 'mg', 0.55, 1.5, 'armor'),
    K('bayonet', 'autorifle', 0.6, 1.6, 'armor'),
    K('baton', 'shock', 0.6, 1.8, 'drone', { robots: true }),
    K('baton', 'spore', 0.6, 1.8, 'drone', { livingWall: true }),
    K('baton', 'ray', 0.65, 2.0, 'plasma'),
    K('baton', 'ray', 0.65, 2.1, 'plasma', { portal: true }),
    K('baton', 'ray', 0.7, 2.2, 'plasma', { portal: true, shield: true }),
  ];
  // máy công thành: phá cổng mỗi ngày (độ bền), bắn người (sức), giá mỗi máy
  const ENGINE = {
    catapult: { name: 'máy bắn đá', gate: 0.25, kill: 0, cost: { wood: 40 } },
    cannon: { name: 'đại bác', gate: 0.4, kill: 0.2, cost: { wood: 20, metal: 30 } },
    artillery: { name: 'pháo dã chiến', gate: 0.55, kill: 0.4, cost: { metal: 50 } },
    armor: { name: 'xe bọc thép', gate: 0.6, kill: 0.8, cost: { metal: 80, energy: 40 } },
    drone: { name: 'drone', gate: 0.5, kill: 1.0, cost: { metal: 40, energy: 60 } },
    plasma: { name: 'pháo plasma', gate: 1.0, kill: 0.8, cost: { energy: 120 } },
  };
  const NAME = { sling: 'ná', bow: 'cung', crossbow: 'nỏ', musket: 'súng hoả mai', rifle: 'súng trường', mg: 'súng máy', autorifle: 'súng tự động', shock: 'súng điện', spore: 'súng bào tử', ray: 'súng tia' };
  const RANGED_KILL = 0.05;   // mỗi ngày: khả năng một người giữ ngã vì tên đạn khi hai bên ngang sức bắn
  const WALL_COVER = 1.6;     // người bắn sau tường được che
  const MAX_ENGINES = 4, PER_ENGINE = 5; // mỗi máy cần chừng này lính trong đạo quân
  const FIRE = 0.35;          // mỗi ngày: khả năng tên lửa đốt trúng một nhà
  const LIVING_WALL = 0.3;    // cổng sống tự vá mỗi ngày
  const P = () => BK.People, G = () => BK.Siege, E = () => BK.Economy;
  const kit = (lv) => KIT[Math.max(1, Math.min(12, lv || 1))];
  // người này bắn xa không (theo mã người, cố định suốt trận; dân binh, dân tự nguyện đánh gần)
  const isRanged = (p, lv, levy) => !levy && ((p.id * 0.6180339887) % 1) < kit(lv).share;

  /* ---------- Ra quân: chia loại người, dựng máy công thành (tốn tài nguyên) ---------- */
  function equip(W, w) {
    const A = W.islands[w.a], k = kit(A.level);
    for (const x of w.troops) x.arm = isRanged(x.p, W.islands[x.i].level, x.levy) ? 'ranged' : 'melee';
    w.kit = A.level; w.engines = [];
    const E0 = k.engine && ENGINE[k.engine]; if (!E0) return;
    const st = E().state(A).stock, want = Math.min(MAX_ENGINES, Math.floor(w.troops.length / PER_ENGINE) * (w.kind === 'raid' ? 0.5 : 1));
    for (let n = 0; n < want; n++) {
      if (!Object.keys(E0.cost).every((r) => st[r] >= E0.cost[r] * 2)) break; // không vét sạch kho
      for (const r in E0.cost) st[r] -= E0.cost[r];
      w.engines.push({ kind: k.engine, hp: 1 });
    }
    if (W.armStats) W.armStats.engines = (W.armStats.engines || 0) + w.engines.length;
  }
  // người giữ có bắn xa không (cho phần vẽ, logic/siege.js)
  const armOf = (S, p) => (isRanged(p, S.level, false) && (p.job === 'soldier' || p.job === 'gatekeeper' || p.job === 'sideguard') ? 'ranged' : 'melee');

  /* ---------- Mỗi đợt ở cổng: bắn xa, công thành, tên lửa đốt, đặc biệt ---------- */
  // def: người giữ [{i, p}]; fall(x, enemy): người ngã (logic/war.js); trả về số người giữ ngã
  function gateTick(W, day, w, def, dt, rng, fall) {
    const A = W.islands[w.a], B = W.islands[w.b], ka = kit(w.kit || A.level), kb = kit(B.level);
    const st = (w.armLog || (w.armLog = { volleys: 0, gateDmg: 0, fires: 0 }));
    // lá chắn năng lượng (bên giữ thời 12): đỡ phần lớn đòn tới khi bị phá
    if (kb.shield && B.shieldHp == null) B.shieldHp = 1;
    const shield = kb.shield && B.shieldHp > 0 ? 0.3 : 1;
    // bắn xa: sức bắn hai bên (bên giữ được tường che)
    const shooters = w.troops.filter((x) => x.p.alive && x.arm === 'ranged');
    const defShoot = def.filter((x) => x.p.alive && armOf(W.islands[x.i], x.p) === 'ranged');
    const pa = shooters.length * ka.pow, pd = defShoot.length * kb.pow * WALL_COVER;
    let dead = 0;
    if (pa > 0 && def.length) {
      const pk = Math.min(0.3, dt * RANGED_KILL * pa / Math.max(1, def.length) * shield);
      for (const x of def) if (x.p.alive && rng.chance(pk)) { fall(x, w.a); dead++; }
      st.volleys++;
    }
    if (pd > 0 && w.troops.length) {
      const pk = Math.min(0.3, dt * RANGED_KILL * pd / Math.max(1, w.troops.length));
      for (const x of w.troops) if (x.p.alive && rng.chance(pk)) fall(x, w.b);
    }
    // máy công thành: phá cổng (lá chắn đỡ trước), bắn người giữ
    for (const e of w.engines || []) {
      const E0 = ENGINE[e.kind];
      if (kb.shield && B.shieldHp > 0) { B.shieldHp = Math.max(0, B.shieldHp - dt * E0.gate * 0.5); continue; }
      G().hit(B, w.gate, dt * E0.gate); st.gateDmg += dt * E0.gate;
      if (E0.kill > 0) for (const x of def) if (x.p.alive && rng.chance(Math.min(0.2, dt * 0.04 * E0.kill))) { fall(x, w.a); dead++; }
    }
    // bên giữ: người bắn xa cũng nhắm máy công thành
    if (pd > 0) for (const e of w.engines || []) e.hp -= dt * 0.02 * pd / Math.max(1, (w.engines || []).length);
    if (w.engines) w.engines = w.engines.filter((e) => e.hp > 0);
    // tên lửa đốt: cháy nhà dân trong thành
    if (ka.fire && shooters.length && rng.chance(Math.min(0.9, dt * FIRE))) {
      const homes = [...new Set(BK.Island.living(B).map((p) => p.home).filter((h) => h != null))];
      if (homes.length) { const h = homes[Math.floor(rng.next() * homes.length)]; G().hit(B, 'home:' + h, 0.3); st.fires++; }
    }
    // cổng sống tự vá (bên giữ thời 9)
    if (kb.livingWall && B.ruin && B.ruin[w.gate] != null) { const v = Math.min(1, B.ruin[w.gate] + dt * LIVING_WALL); if (v >= 1) delete B.ruin[w.gate]; else B.ruin[w.gate] = v; }
    // cổng dịch chuyển (bên đánh thời 11, tổng tấn công): sau một ngày ở cổng, một toán quân vào thẳng trong thành mở cổng
    if (ka.portal && w.kind === 'conquer' && !w.portal && day - w.since >= 1) {
      w.portal = true; G().hit(B, w.gate, 1);
      BK.Diplomacy.say(W, day, 'Một toán quân ' + A.name + ' đi qua cổng dịch chuyển vào thẳng trong thành ' + B.name + ', mở cổng từ bên trong.', [w.a, w.b]);
    }
    return dead;
  }
  // phần sức giữ cổng còn lại theo độ bền cổng (logic/war.js): cổng hư thì người giữ mất chỗ dựa
  const describe = (lv) => { const k = kit(lv); return (NAME[k.ranged] || k.ranged) + (k.engine ? ', ' + ENGINE[k.engine].name : ''); };
  return { KIT, ENGINE, NAME, kit, equip, gateTick, armOf, isRanged, describe };
});
