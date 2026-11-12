/* Bể Kính · logic/homes.js
 * Nhà riêng của từng hộ. Mỗi hộ (vợ chồng và các con chưa lập gia đình) có một nhà trong 20 nhà của làng (HOME_SLOTS);
 * mỗi nhà thường 2 tới 3 người. Cưới nhau thì ra ở nhà riêng; trẻ ở với bố mẹ, lớn mà chưa cưới thì ra ở riêng nếu còn nhà; vợ hay chồng mất thì người còn
 * lại vẫn giữ nhà; cả hộ không còn ai thì nhà trống cho hộ mới. Hết nhà trống thì hộ mới ở chung nhà bố mẹ.
 * p.home = số nhà (0..19), phần vẽ đặt người về đúng cửa nhà đó ở mọi thời (render/build/plains/common.js homes).
 * Không vẽ gì, chạy được bằng Node. Cần: logic/rules.js, logic/people.js. */
(function (root, factory) {
  const BK = root.BK || (root.BK = {});
  BK.Homes = factory(BK);
  if (typeof module === 'object' && module.exports) module.exports = BK.Homes;
})(typeof self !== 'undefined' ? self : globalThis, function (BK) {
  'use strict';
  // khoá hộ: vợ chồng chung một khoá (giữ cả khi một người đã mất); con chưa cưới theo khoá của bố hay mẹ còn sống
  function keyOf(S, p, depth) {
    if (p.spouse != null) return 'c' + Math.min(p.id, p.spouse);
    // người lớn chưa cưới ra ở riêng (khi làng còn nhà trống, xem assign); trẻ ở với bố mẹ
    if (!depth && BK.People.ageOf(p, S.day) >= BK.Rules.ADULT_AGE) return 's' + p.id;
    // (theo bố hay mẹ còn sống trước: một người mất, người kia tái hôn sang nhà mới thì con theo sang, không ở lại nhà cũ một mình)
    if ((depth || 0) < 4) {
      const ps = (p.parents || []).map((id) => S.people.get(id)).filter(Boolean),
        q = ps.find((x) => x.alive) || ps.find((x) => x.spouse != null);
      if (q) return keyOf(S, q, (depth || 0) + 1);
    }
    return 's' + p.id;
  }
  function assign(S) {
    const R = BK.Rules,
      N = R.HOME_SLOTS || 20;
    const owner = S.homeOwner || (S.homeOwner = new Array(N).fill(null)); // owner[nhà] = khoá hộ
    const live = [...S.people.values()].filter((p) => p.alive),
      keys = new Map();
    for (const p of live) {
      const k = keyOf(S, p);
      if (!keys.has(k)) keys.set(k, []);
      keys.get(k).push(p);
    }
    // nhà của hộ không còn ai sống thì trống
    for (let i = 0; i < N; i++) if (owner[i] && !keys.has(owner[i])) owner[i] = null;
    const slotOf = new Map();
    owner.forEach((k, i) => {
      if (k) slotOf.set(k, i);
    });
    // hộ chưa có nhà: lấy nhà trống đầu tiên; hết nhà thì ở chung nhà bố mẹ (hay nhà ít người nhất)
    for (const [k, members] of keys) {
      if (slotOf.has(k)) continue;
      const free = owner.indexOf(null);
      if (free >= 0) {
        owner[free] = k;
        slotOf.set(k, free);
        continue;
      }
      const head = members[0],
        par = (head.parents || []).map((id) => S.people.get(id)).find((q) => q),
        pk = par && keyOf(S, par);
      if (pk && slotOf.has(pk)) {
        slotOf.set(k, slotOf.get(pk));
        continue;
      }
      const count = new Array(N).fill(0);
      for (const [kk, mm] of keys) if (slotOf.has(kk)) count[slotOf.get(kk)] += mm.length;
      slotOf.set(k, count.indexOf(Math.min(...count)));
    }
    for (const [k, members] of keys) for (const p of members) p.home = slotOf.get(k);
  }
  // số người mỗi nhà (cho bảng làng và bài kiểm tra)
  function occupancy(S) {
    const N = BK.Rules.HOME_SLOTS || 20,
      c = new Array(N).fill(0);
    for (const p of S.people.values()) if (p.alive && p.home != null) c[p.home]++;
    return c;
  }
  return { assign, occupancy, keyOf };
});
