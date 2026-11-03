/* Bể Kính · logic/genes.js
 * Bộ gen của một người: 8 gen tính cách, 4 gen dáng, 1 thói quen khi đứng chờ, và có thể một gen hiếm.
 * Lai tạo khi sinh con: trung bình cha mẹ, lệch nhẹ, đôi khi đột biến; thói quen bốc thăm từ cha hoặc mẹ.
 * Chỉ là dữ liệu và phép tính, không vẽ gì. Cần: logic/rng.js (chỉ để nhận một bộ số ngẫu nhiên truyền vào). */
(function (root, factory) {
  const BK = root.BK || (root.BK = {});
  BK.Genes = factory();
  if (typeof module === 'object' && module.exports) module.exports = BK.Genes;
})(typeof self !== 'undefined' ? self : globalThis, function () {
  'use strict';

  /* ---------- Định nghĩa ---------- */
  // 8 gen tính cách, giá trị 0..1
  const TRAITS = [
    { key: 'ambition', name: 'Tham vọng' },
    { key: 'aggression', name: 'Hiếu chiến' },
    { key: 'paranoia', name: 'Đa nghi' },
    { key: 'fear', name: 'Sợ hãi' },
    { key: 'intellect', name: 'Trí tuệ' },
    { key: 'meekness', name: 'Nhu nhược' },
    { key: 'piety', name: 'Sùng đạo' },
    { key: 'cunning', name: 'Mưu mô' },
  ];
  // 4 gen dáng, giá trị 0..1: lai được như tính cách, nên con có thể đi đứng "nửa giống cha nửa giống mẹ"
  const GAIT = [
    { key: 'stride', name: 'Bước chân', low: 'ngắn, lết', high: 'dài, nảy' },
    { key: 'posture', name: 'Dáng lưng', low: 'khom', high: 'thẳng' },
    { key: 'stance', name: 'Thế đứng', low: 'khép', high: 'dạng rộng' },
    { key: 'tempo', name: 'Nhịp riêng', low: 'chậm rãi', high: 'nhanh nhảu' },
  ];
  // thói quen khi đứng chờ: bốc thăm từ cha hoặc mẹ, hiếm khi ra thói quen mới
  const HABITS = [
    { key: 'crossArms', name: 'Khoanh tay' },
    { key: 'handsOnHips', name: 'Chống nạnh' },
    { key: 'handsBehind', name: 'Chắp tay sau lưng' },
    { key: 'scratchHead', name: 'Gãi đầu' },
    { key: 'rubHands', name: 'Xoa tay' },
    { key: 'sway', name: 'Đung đưa người' },
  ];
  // gen hiếm: đẩy một vài gen tính cách lên rất cao
  const RARE = [
    { key: 'tyrant', name: 'Bạo chúa', push: { ambition: 0.3, aggression: 0.3 } },
    { key: 'saint', name: 'Thánh nhân', push: { piety: 0.35, aggression: -0.2 } },
    { key: 'genius', name: 'Thiên tài', push: { intellect: 0.35 } },
    { key: 'traitor', name: 'Kẻ phản bội', push: { cunning: 0.35, meekness: -0.1 } },
    { key: 'godmark', name: 'Người mang dấu thần', push: {} },
  ];

  /* ---------- Hệ số lai tạo (sửa ở đây để đổi nhịp di truyền) ---------- */
  const TUNE = {
    drift: 0.06,          // độ lệch thường của con so với trung bình cha mẹ
    mutateChance: 0.05,   // xác suất một gen bị đột biến
    mutateMin: 0.15, mutateMax: 0.35,
    habitNew: 0.05,       // xác suất ra một thói quen mới
    rareNew: 0.03,        // xác suất con mang một gen hiếm mới
    rareKeep: 0.2,        // xác suất con giữ gen hiếm của cha hay mẹ
  };

  const clamp01 = (v) => Math.max(0, Math.min(1, v));
  const KEYS = TRAITS.map((t) => t.key), GKEYS = GAIT.map((g) => g.key);

  /* ---------- Bộ gen ngẫu nhiên cho người đầu tiên hay người dân thường ---------- */
  // bias: nét chung của đảo, ví dụ { aggression: -0.1 } cho một đảo hiền
  function random(rng, bias) {
    const traits = {}, gait = {};
    for (const k of KEYS) traits[k] = clamp01(0.5 + rng.gauss() * 0.2 + ((bias && bias[k]) || 0));
    for (const k of GKEYS) gait[k] = clamp01(0.5 + rng.gauss() * 0.22);
    const g = { traits, gait, habit: rng.pick(HABITS).key, rare: null, mutations: [] };
    if (rng.chance(TUNE.rareNew)) giveRare(g, rng.pick(RARE).key);
    return g;
  }
  function giveRare(g, key) {
    const R = RARE.find((r) => r.key === key); if (!R) return;
    g.rare = key;
    for (const k in R.push) g.traits[k] = clamp01(g.traits[k] + R.push[k]);
  }

  /* ---------- Lai tạo: cha + mẹ → con ---------- */
  function cross(a, b, rng) {
    const traits = {}, gait = {}, mutations = [];
    // Bước 1, lai chéo: trung bình cha mẹ cộng một chút lệch
    // Bước 2, đột biến: hiếm khi một gen lệch hẳn đi (cha mẹ hiền vẫn có thể sinh con rất hiếu chiến)
    for (const k of KEYS) {
      let v = (a.traits[k] + b.traits[k]) / 2 + rng.gauss() * TUNE.drift;
      if (rng.chance(TUNE.mutateChance)) { const d = rng.range(TUNE.mutateMin, TUNE.mutateMax) * (rng.chance(0.5) ? 1 : -1); v += d; mutations.push({ key: k, delta: +d.toFixed(2) }); }
      traits[k] = clamp01(v);
    }
    for (const k of GKEYS) gait[k] = clamp01((a.gait[k] + b.gait[k]) / 2 + rng.gauss() * TUNE.drift);
    // Bước 3, thừa hưởng cử chỉ: thói quen của cha hoặc mẹ, hiếm khi một thói quen mới
    let habit = rng.chance(0.5) ? a.habit : b.habit, habitFrom = habit === a.habit ? 'a' : 'b';
    if (rng.chance(TUNE.habitNew)) { habit = rng.pick(HABITS).key; habitFrom = 'new'; }
    const child = { traits, gait, habit, habitFrom, rare: null, mutations };
    // gen hiếm: giữ của cha mẹ hoặc mới nảy ra
    const parentRare = [a.rare, b.rare].filter(Boolean);
    if (parentRare.length && rng.chance(TUNE.rareKeep)) giveRare(child, rng.pick(parentRare));
    else if (rng.chance(TUNE.rareNew)) giveRare(child, rng.pick(RARE).key);
    return child;
  }

  /* ---------- Tiện ích ---------- */
  // khác biệt trung bình giữa hai bộ gen tính cách (0 giống hệt, 1 trái ngược)
  function distance(a, b) { let s = 0; for (const k of KEYS) s += Math.abs(a.traits[k] - b.traits[k]); return s / KEYS.length; }
  const traitName = (k) => (TRAITS.find((t) => t.key === k) || {}).name || k;
  const habitName = (k) => (HABITS.find((h) => h.key === k) || {}).name || k;
  const rareName = (k) => (RARE.find((r) => r.key === k) || {}).name || '';
  // nét nổi nhất của một người: hai gen cao nhất, để viết nhật ký và thẻ người
  function standout(g) { return KEYS.map((k) => [k, g.traits[k]]).sort((x, y) => y[1] - x[1]).slice(0, 2).map(([k]) => traitName(k)); }

  return { TRAITS, GAIT, HABITS, RARE, TUNE, KEYS, GKEYS, random, cross, distance, traitName, habitName, rareName, standout, clamp01 };
});
