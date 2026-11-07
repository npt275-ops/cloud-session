/* Bể Kính · logic/world.js · Cả bể: sáu đảo, một đồng hồ
 * Giữ đồng hồ chung của trận và chạy sáu đảo (logic/island.js) cùng nhịp, theo thứ tự cố định. Không vẽ gì, chạy được
 * bằng Node (test/world.test.js), để chạy giả lập hàng loạt.
 *
 * Hai đồng hồ, một tốc độ (design/quy-trinh-tong-quat.md mục 1.1):
 *   lịch          W.day: ngày của trận (tuổi, mùa, thế hệ, thời đại)
 *   giờ trong ngày W.tod (0..1): sáng, trưa, chiều, tối, đêm; một vòng ngày đêm ứng với CYCLE_DAYS ngày lịch. Tính từ lịch,
 *                 không đọc từ phần chạy game, nên Node và trình duyệt cho cùng một kết quả.
 * Bước cố định: thời gian đưa vào (advance, tuỳ khung hình và tốc độ 1×, 2×, 4×) chỉ được chạy theo từng bước TICK nguyên;
 * phần lẻ để dành cho lần sau. Vì vậy cùng một seed thì ở tốc độ nào, máy nhanh hay chậm, cũng ra cùng một lịch sử.
 * jump(W, ngày): tua nhanh theo bước 1 ngày (chỉ cho dev rà soát các thời, không bảo đảm trùng với chạy thường).
 * Giữa các đảo: logic/diplomacy.js (quan hệ, đoàn buôn, hiệp ước, cầu), logic/strategy.js (người đứng đầu chọn nước đi).
 * Cần: logic/island.js và các tệp nó cần, logic/diplomacy.js, logic/strategy.js. */
(function (root, factory) {
  const BK = root.BK || (root.BK = {});
  BK.World = factory(BK);
  if (typeof module === 'object' && module.exports) module.exports = BK.World;
})(typeof self !== 'undefined' ? self : globalThis, function (BK) {
  'use strict';
  const KEYS = ['plains', 'forest', 'mountain', 'tundra', 'coast', 'desert']; // thứ tự sáu đảo (trùng thứ tự vùng đất của bản đồ)
  const TICKS_PER_DAY = 12;            // bước cố định: 1/12 ngày lịch
  const CYCLE_DAYS = 135;              // một vòng ngày đêm ứng với chừng này ngày lịch (1×: 3 phút thật)
  const START_TOD = 0.3;               // trận bắt đầu lúc sáng sớm
  const todOf = (day) => (((START_TOD + day / CYCLE_DAYS) % 1) + 1) % 1;
  // hạt giống của từng đảo: đảo đầu (Lúa Vàng) giữ đúng seed của trận, đảo khác lệch đi để mỗi đảo một lịch sử
  const seedOf = (seed, i) => (i === 0 ? seed : seed + 1000 * i);

  // o: { seed, buildPlan(key, cấp) → danh sách công trình phải dựng mỗi thời (lấy từ bố cục ở phần vẽ) }
  function create(o) {
    const seed = o.seed || 42;
    const W = { seed, ticks: 0, day: 0, tod: START_TOD, acc: 0, keys: KEYS.slice(), islands: [] };
    W.islands = KEYS.map((key, i) => BK.Island.create({ key, seed: seedOf(seed, i), buildPlan: o.buildPlan ? (lv) => o.buildPlan(key, lv) : null }));
    for (const S of W.islands) S.tod = W.tod;
    // giữa các đảo (logic/diplomacy.js, logic/strategy.js): quan hệ, đoàn buôn, hiệp ước, cầu; o.diplomacy === false thì sáu đảo
    // sống riêng (để so sánh trong kiểm thử)
    W.diplomacy = o.diplomacy !== false && !!BK.Diplomacy; W.rng = BK.Rng.create(seed * 31 + 7);
    if (W.diplomacy) BK.Diplomacy.init(W);
    return W;
  }
  // sang ngày mới: việc giữa các đảo (đoàn buôn tới nơi, quan hệ phai dần, người đứng đầu xét tình hình)
  function worldDay(W, day) {
    if (!W.diplomacy) return;
    BK.Diplomacy.dayTick(W, day);
    BK.Strategy.dayTick(W, day, W.rng);
  }
  // một bước cố định: lịch và giờ trong ngày đi trước, rồi sáu đảo lần lượt theo thứ tự
  function tick(W) {
    W.ticks++; W.day = W.ticks / TICKS_PER_DAY; W.tod = todOf(W.day);
    for (const S of W.islands) { S.tod = W.tod; BK.Island.step(S, 1 / TICKS_PER_DAY); }
    if (W.ticks % TICKS_PER_DAY === 0) worldDay(W, W.day);
  }
  // đưa thêm days ngày lịch vào (phần chạy game gọi mỗi khung hình); chạy hết các bước nguyên, trả về số bước đã chạy
  function advance(W, days) {
    W.acc += Math.max(0, days) * TICKS_PER_DAY; let n = 0; // đếm theo số bước (không cộng dồn phần ngày lẻ, khỏi sai số)
    while (W.acc >= 1 - 1e-9) { W.acc -= 1; tick(W); n++; }
    return n;
  }
  // tua nhanh tới ngày toDay (dev rà soát): bước 1 ngày, giờ trong ngày đặt giữa buổi sáng cho mỗi ngày
  function jump(W, toDay) {
    while (W.day + 1 <= toDay) { W.day += 1; W.ticks = Math.round(W.day * TICKS_PER_DAY); W.tod = todOf(W.day); for (const S of W.islands) { S.tod = W.tod; BK.Island.step(S, 1); } worldDay(W, W.day); }
    const rest = toDay - W.day; if (rest > 0) { W.day = toDay; W.ticks = Math.round(W.day * TICKS_PER_DAY); W.tod = todOf(W.day); for (const S of W.islands) { S.tod = W.tod; BK.Island.step(S, rest); } }
    W.acc = 0;
  }
  const island = (W, key) => W.islands[KEYS.indexOf(key)];
  return { KEYS, TICKS_PER_DAY, CYCLE_DAYS, todOf, create, tick, advance, jump, island };
});
