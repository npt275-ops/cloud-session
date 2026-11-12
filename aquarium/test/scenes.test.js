// Bể Kính · test/scenes.test.js · Cảnh theo sự kiện (logic/scenes.js), cảnh đói (logic/tasks.js)
const test = require('node:test');
const assert = require('node:assert');
for (const f of [
  'rng',
  'rules',
  'genes',
  'people',
  'family',
  'council',
  'temper',
  'posts',
  'jobs',
  'eras',
  'schedule',
  'scenes',
  'leader',
  'guards',
  'tasks',
  'dramas',
  'economy',
  'climate',
  'epigen',
  'construction',
  'homes',
  'siege',
  'arms',
  'missiles',
  'ecology',
  'brain',
  'island',
  'diplomacy',
  'war',
  'battles',
  'chronicle',
  'prosperity',
  'strategy',
  'powers',
  'goals',
  'world',
])
  require('../logic/' + f + '.js');
const BK = globalThis.BK,
  living = BK.Island.living;
const until = (W, cond, max) => {
  for (let k = 0; k < max && !cond(); k++) BK.World.tick(W);
  return cond();
};
const morningOf = (W, S) => until(W, () => BK.Schedule.phase(S.tod) === 'morning', 12 * 140);

test('người mất ở đảo nhà: người nhà khóc ở nhà, rồi hai người khiêng quan tài đưa tang ra bãi mộ, mộ mới thêm vào', () => {
  const W = BK.World.create({ seed: 7, war: false });
  BK.World.jump(W, 800);
  const S = W.islands[0];
  morningOf(W, S);
  // một người có gia đình qua đời
  const dead = living(S).find((p) => p.spouse != null && p.children.length && !p.role && !BK.Posts.of(p));
  dead.alive = false;
  dead.died = S.day;
  dead.cause = 'bệnh';
  const graves0 = (S.graves || []).length;
  assert.ok(
    until(W, () => S.scenes && S.scenes.some((sc) => sc.dead === dead.id), 24),
    'có đám tang',
  );
  const sc = S.scenes.find((x) => x.dead === dead.id);
  assert.strictEqual(sc.kind, 'funeral');
  assert.ok(sc.family.length >= 2 && sc.bearers.length === 2, 'người nhà ' + sc.family.length + ', người khiêng ' + sc.bearers.length);
  assert.ok(
    until(
      W,
      () =>
        sc.family.some((id) => {
          const m = S.minds.get(id);
          return m && m.place === 'homeSlot' && m.verb === 'mourn';
        }),
      12,
    ),
    'người nhà khóc trước cửa nhà người mất',
  );
  assert.ok(
    until(W, () => S.day >= sc.walk + 0.05, 12),
    'tới chặng đưa tang',
  );
  assert.ok(
    sc.bearers.every((id) => {
      const m = S.minds.get(id);
      return m && m.place === 'grave' && m.carryItem === 'coffin';
    }),
    'hai người khiêng quan tài ra bãi mộ',
  );
  assert.ok(
    until(W, () => (S.graves || []).length > graves0, 24),
    'mộ mới',
  );
});

test('người chết trận ở đảo khác: đảo nhà làm lễ tưởng niệm ở chỗ thờ, không có quan tài', () => {
  const W = BK.World.create({ seed: 7, war: false });
  BK.World.jump(W, 800);
  const S = W.islands[0];
  morningOf(W, S);
  const dead = living(S).find((p) => p.spouse != null && !p.role && !BK.Posts.of(p));
  dead.alive = false;
  dead.died = S.day;
  dead.cause = 'chiến tranh';
  dead.abroad = true;
  assert.ok(until(W, () => S.scenes && S.scenes.some((sc) => sc.dead === dead.id), 24));
  const sc = S.scenes.find((x) => x.dead === dead.id);
  assert.strictEqual(sc.kind, 'memorial');
  assert.strictEqual(sc.bearers.length, 0);
  assert.ok(
    until(
      W,
      () => {
        const m = S.minds.get(dead.spouse);
        return m && m.place === 'shrine';
      },
      12,
    ),
    'vợ hay chồng tưởng niệm ở chỗ thờ',
  );
});

test('đói: trưa dân ra kho xếp hàng nhận khẩu phần (lính giữ chốt ăn tại chốt)', () => {
  const W = BK.World.create({ seed: 7, war: false });
  BK.World.jump(W, 1000);
  const S = W.islands[0],
    st = BK.Economy.state(S);
  until(W, () => BK.Schedule.phase(S.tod) === 'noon', 12 * 140);
  for (let k = 0; k < 14; k++) {
    st.stock.food = 0;
    BK.World.tick(W);
  }
  const minds = [...S.minds.entries()],
    q = minds.filter(([, m]) => m.place === 'queue').length;
  assert.ok(q >= living(S).length * 0.25, 'xếp hàng ' + q + '/' + living(S).length);
  // lính giữ chốt cổng ăn tại chốt (người diễn thuyết thì đi nhận như mọi người)
  assert.ok(
    minds.every(([id, m]) => {
      const post = BK.Posts.of(S.people.get(id));
      return m.place !== 'queue' || !post || !post.night;
    }),
    'lính giữ chốt cổng không bỏ chốt đi xếp hàng',
  );
});
