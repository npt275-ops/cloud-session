// Bể Kính · tools/scene-print.js · Dấu vân tay hình học của cảnh: dùng khi dọn hay tách code để chắc hình vẽ không đổi
// Mở trang thật, đưa cả bể tới từng thời (mặc định 1, 6, 12), cộng dồn dữ liệu đỉnh (số đỉnh, tổng toạ độ có trọng số, tổng
// màu) của mọi lưới trong cảnh theo nhóm lớn (sáu đảo, biển, đáy bể, trời, …). Không tính vị trí lúc chạy, bọt khí, sao.
// Lần ghi mẫu chạy hai lượt (mở lại trang): nhóm nào hai lượt khác nhau (người, thợ, khói đổi theo lúc chụp) là nhóm động,
// được ghi tên nhưng không so.
//   node tools/scene-print.js > /tmp/mau.json        ghi mẫu (trước khi sửa)
//   node tools/scene-print.js --so /tmp/mau.json      so với mẫu (sau khi sửa); mã thoát 1 nếu nhóm tĩnh nào khác
//   ERAS=1,12 node tools/scene-print.js
'use strict';
const path = require('path'),
  fs = require('fs');
const ROOT = path.join(__dirname, '..'),
  ERAS = (process.env.ERAS || '1,6,12').split(',').map(Number);
const iSo = process.argv.indexOf('--so'),
  MAU = iSo > 0 ? JSON.parse(fs.readFileSync(process.argv[iSo + 1], 'utf8')) : null;

// một lượt: mở trang, đo từng thời
async function measure(b) {
  const p = await b.newPage({ viewport: { width: 320, height: 240 } });
  const vendor = (f) => (r) => r.fulfill({ body: fs.readFileSync(path.join(ROOT, 'vendor', f)), contentType: 'application/javascript' });
  await p.route('**/three.min.js', vendor('three.min.js'));
  await p.route('**/OrbitControls.js', vendor('OrbitControls.js'));
  await p.route('https://fonts.googleapis.com/**', (r) => r.fulfill({ body: '', contentType: 'text/css' }));
  const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  p.setDefaultTimeout(600000);
  await p.goto('file://' + path.join(ROOT, 'index.html'));
  await p.waitForTimeout(3000);
  const out = {};
  for (const lv of ERAS) {
    out['thời ' + lv] = await p.evaluate((lv) => {
      const G = __glass.G;
      G.time.tps = 0;
      G.goEra(lv);
      G.citiesRun.step(0.0001);
      G.citiesRun.slow();
      const r = {};
      for (const top of G.scene.children) {
        const L = G.lands.find((q) => q.g === top),
          key = top.name || (L ? 'đảo ' + L.i : top.type);
        const acc = r[key] || (r[key] = { n: 0, pos: 0, col: 0 });
        top.traverse((m) => {
          if (m.isPoints || !m.geometry || !m.geometry.attributes || !m.geometry.attributes.position) return;
          const P = m.geometry.attributes.position.array,
            C = m.geometry.attributes.color;
          acc.n += P.length / 3;
          for (let i = 0; i < P.length; i++) acc.pos += P[i] * ((i % 7) + 1);
          if (C) for (let i = 0; i < C.array.length; i++) acc.col += C.array[i];
        });
      }
      for (const k in r) {
        r[k].pos = +r[k].pos.toFixed(1);
        r[k].col = +r[k].col.toFixed(2);
      }
      return r;
    }, lv);
  }
  await p.close();
  if (errs.length) throw new Error('LỖI TRANG: ' + errs.slice(0, 3).join(' | '));
  return out;
}

(async () => {
  const { chromium } = require('playwright');
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  try {
    const now = await measure(b);
    if (!MAU) {
      // ghi mẫu: đo lượt hai, bỏ nhóm động
      const again = await measure(b),
        mau = { dong: [] };
      for (const t in now) {
        mau[t] = {};
        for (const k in now[t]) {
          if (JSON.stringify(now[t][k]) === JSON.stringify((again[t] || {})[k])) mau[t][k] = now[t][k];
          else if (!mau.dong.includes(t + ' · ' + k)) mau.dong.push(t + ' · ' + k);
        }
      }
      console.log(JSON.stringify(mau, null, 1));
      return;
    }
    let bad = 0,
      n = 0;
    for (const t in MAU) {
      if (t === 'dong') continue;
      for (const k in MAU[t]) {
        n++;
        const a = MAU[t][k],
          c = (now[t] || {})[k];
        if (JSON.stringify(a) !== JSON.stringify(c)) {
          bad++;
          console.log('KHÁC  ' + t + ' · ' + k + ': ' + JSON.stringify(a) + ' → ' + JSON.stringify(c));
        }
      }
    }
    if (MAU.dong.length) console.log('Nhóm động (không so): ' + MAU.dong.join(', '));
    console.log(bad ? 'KHÔNG ĐẠT: ' + bad + '/' + n + ' nhóm khác' : 'ĐẠT: ' + n + ' nhóm tĩnh giống hệt mẫu');
    process.exitCode = bad ? 1 : 0;
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
