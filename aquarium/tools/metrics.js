// Bảng chỉ số vĩ mô trên 8 thành phố trong một lần chạy: node tools/metrics.js [ngày]
const Sim = require('../sim.js');
const days = +process.argv[2] || 2000, rows = [];
for (let seed = 1; seed <= 8; seed++) {
  const w = Sim.create({ seed });
  let minFood = 99;
  for (let i = 0; i < days; i++) { Sim.step(w); if (i > 100) minFood = Math.min(minFood, w.firms.filter((f) => f.alive && f.sector === 'food').length); }
  const st = w.stats.slice(200), m = (k) => st.reduce((s, x) => s + x[k], 0) / st.length;
  const sd = (k) => { const a = m(k); return Math.sqrt(st.reduce((s, x) => s + (x[k] - a) ** 2, 0) / st.length); };
  const yrs = (st.length - 1) / 360, infl = (Math.pow(st.at(-1).cpi / st[0].cpi, 1 / yrs) - 1) * 100;
  const tiers = {}; for (const s of w.stories) tiers[s.tier] = (tiers[s.tier] || 0) + 1;
  rows.push({ seed, 'TN%': m('unemployment').toFixed(1), 'TN đỉnh': Math.max(...st.map((x) => x.unemployment)).toFixed(0), 'lệch TN': sd('unemployment').toFixed(1), 'lạm phát%': infl.toFixed(1), 'đói TB': m('hungry').toFixed(1), 'phá sản': w.firms.filter((f) => !f.alive).length + (w.storySeq ? w.stories.filter((s) => s.type === 'bankrupt').length * 0 : 0), 'phá sản (chuyện)': w.stories.filter((s) => s.type === 'bankrupt').length, gini: m('gini').toFixed(2), 'lò TP min': minFood, 'đại sự': tiers.epic || 0, 'biến cố': tiers.major || 0 });
}
console.table(rows);
