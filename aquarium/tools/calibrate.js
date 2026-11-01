// Đo "độ sống" của nền kinh tế qua nhiều seed: node tools/calibrate.js [ngày]
const Sim = require('../sim.js');
const days = +process.argv[2] || 2000;
const rows = [];
for (const seed of [1, 2, 3, 4, 5, 6]) {
  const w = Sim.create({ seed });
  let bankrupt = 0, born = 0, seen = 0;
  for (let i = 0; i < days; i++) {
    Sim.step(w);
    for (; seen < w.events.length; seen++) {}
  }
  const evAll = w.events;
  const st = w.stats.slice(200);
  const mean = (k) => st.reduce((s, x) => s + x[k], 0) / st.length;
  const sd = (k) => { const m = mean(k); return Math.sqrt(st.reduce((s, x) => s + (x[k] - m) ** 2, 0) / st.length); };
  const ue = st.map((x) => x.unemployment);
  // số "chu kỳ": số lần thất nghiệp cắt lên qua trung bình + 1 độ lệch
  const thr = mean('unemployment') + sd('unemployment');
  let cycles = 0; for (let i = 1; i < ue.length; i++) if (ue[i - 1] < thr && ue[i] >= thr) cycles++;
  bankrupt = w.firms.filter((f) => !f.alive).length;
  rows.push({ seed, ue: mean('unemployment').toFixed(1), ueSd: sd('unemployment').toFixed(1), ueMax: Math.max(...ue).toFixed(0), cycles, hungry: mean('hungry').toFixed(1), cpiEnd: st.at(-1).cpi.toFixed(0), firmsEnd: st.at(-1).firms, deadFirms: bankrupt, gini: mean('gini').toFixed(2) });
}
console.table(rows);
