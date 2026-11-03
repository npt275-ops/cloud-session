// Tắt từng cơ chế câu chuyện để tìm thủ phạm làm lệch kinh tế vĩ mô: node tools/diagnose.js
const Sim = require('../sim.js');
const variants = { 'tất cả bật': {}, 'tắt phát minh': { invent: 1 }, 'tắt nỗi sợ': { fear: 1 }, 'tắt cơn sốt': { fad: 1 }, 'tắt khí cầu': { airship: 1 }, 'tắt hoả hoạn': { fire: 1 }, 'tắt hết': { invent: 1, fear: 1, fad: 1, airship: 1, fire: 1 } };
for (const [name, off] of Object.entries(variants)) {
  const r = [];
  for (const seed of [1, 2, 3]) {
    const w = Sim.create({ seed, off });
    for (let i = 0; i < 1500; i++) Sim.step(w);
    const st = w.stats.slice(200), m = (k) => st.reduce((s, x) => s + x[k], 0) / st.length;
    r.push({ ue: m('unemployment'), cpi: st.at(-1).cpi, fear: m('fear'), prod: w.firms.filter((f) => f.alive).reduce((s, f) => s + f.prod / f.baseProd, 0) });
  }
  const a = (k) => (r.reduce((s, x) => s + x[k], 0) / r.length).toFixed(1);
  console.log(name.padEnd(14), 'thất nghiệp TB', a('ue').padStart(5) + '%', '| CPI cuối', a('cpi').padStart(5), '| sợ TB', a('fear').padStart(5) + '%');
}
