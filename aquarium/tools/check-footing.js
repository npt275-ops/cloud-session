// Bể Kính · tools/check-footing.js · Quét công trình thò ra ngoài đảo: 6 đảo × 12 thời (design/ke-hoach-buoc-14.md)
// Mở trang thật, đặt cả sáu đảo vào từng thời, dựng hết công trình, đo phần sát đất của từng món (render/buildings3d.js footing)
// so với mép đảo. Công trình ngoài khơi (khơi) và cầu tàu ở bờ (bờ: dock) đứng trên nước có chủ ý, chỉ in để biết. Mã thoát 1 nếu có
// món khác thò quá MAX.
//   node tools/check-footing.js          in bảng theo loại
//   MAX=0.3 node tools/check-footing.js  ngưỡng thò cho phép (mặc định 0.3)
'use strict';
const path = require('path'), fs = require('fs');
const ROOT = path.join(__dirname, '..'), MAX = +(process.env.MAX || 0.3);
(async () => {
  const { chromium } = require('playwright');
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 480, height: 360 } });
  await p.route('**/three.min.js', (r) => r.fulfill({ body: fs.readFileSync(path.join(ROOT, 'vendor', 'three.min.js')), contentType: 'application/javascript' }));
  await p.route('**/OrbitControls.js', (r) => r.fulfill({ body: fs.readFileSync(path.join(ROOT, 'vendor', 'OrbitControls.js')), contentType: 'application/javascript' }));
  await p.route('https://fonts.googleapis.com/**', (r) => r.fulfill({ body: '', contentType: 'text/css' }));
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  p.setDefaultTimeout(1800000);
  await p.goto('file://' + path.join(ROOT, 'index.html')); await p.waitForTimeout(3000);
  const rows = await p.evaluate(() => {
    const G = __glass.G, B = __glass.buildings, out = []; G.time.tps = 0;
    for (let lv = 1; lv <= 12; lv++) {
      G.goEra(lv); for (const S of G.world.islands) S.wonder = { era: lv, progress: 0.5, from: G.world.day };
      G.citiesRun.animate && G.citiesRun.animate(16, performance.now()); B.flush();
      for (let i = 0; i < 6; i++) for (const r of B.footing(i)) out.push(Object.assign({ lv, i }, r));
      for (const S of G.world.islands) S.wonder = null;
    }
    return out;
  });
  await b.close();
  const by = {}; for (const r of rows) { if (r.cls === 'bờ' && r.kind === 'dock') r.cls = 'khơi'; (by[r.cls] || (by[r.cls] = [])).push(r); }
  let bad = 0;
  for (const cls of Object.keys(by).sort()) {
    const list = by[cls].sort((a, b) => b.over - a.over), over = list.filter((r) => r.over > MAX);
    if (cls !== 'khơi') bad += over.length;
    console.log((cls === 'khơi' ? 'BIẾT ' : over.length ? 'KHÔNG ĐẠT ' : 'ĐẠT ') + cls + ': ' + over.length + ' món thò quá ' + MAX + (list.length ? ' (nhiều nhất ' + list[0].over + ')' : ''));
    for (const r of over.slice(0, +(process.env.SHOW || 6))) console.log('   thời ' + r.lv + ' đảo ' + r.i + ' ' + r.kind + ' thò ' + r.over + ' tại ' + r.at);
  }
  if (errs.length) { console.log('LỖI TRANG: ' + errs.slice(0, 3).join(' | ')); bad++; }
  console.log(bad ? 'KHÔNG ĐẠT: ' + bad : 'ĐẠT: không công trình nào thò ra ngoài đảo');
  process.exit(bad ? 1 : 0);
})();
