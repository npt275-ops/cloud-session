// Bể Kính · tools/check-scene.js · Kiểm tra cảnh bằng trình duyệt không giao diện (design/ke-hoach-khac-phuc.md mục 6.2, 6.3, 7.2)
// Chạy trang thật (three.js trong vendor/), đặt thẳng từng thời bằng nút dev (game/cities.js goEra: dựng lại công trình ngay):
//   chỗ    6 đảo × 12 thời: sân chơi, bãi trao đổi, gốc cây kể chuyện, đài kỳ quan không chồng lên công trình nào
//          (render/build/place3d.js freeSpot, overlaps)
//   dân    6 đảo × 4 buổi × 3 thời (1, 6, 12): phần người đứng không, người đi không đích, số người quanh nhà chính, bước tại
//          chỗ, số lần kẹt mỗi phút (render/village3d.js auditStats)
// So với mục tiêu, in ĐẠT / KHÔNG ĐẠT, trả mã thoát 1 nếu có mục không đạt. Cần Playwright và Chromium (có sẵn trong máy dev).
//   node tools/check-scene.js            cả hai phần
//   node tools/check-scene.js chỗ        chỉ phần chỗ
//   ERAS=1 VERBOSE=1 node tools/check-scene.js dân   chỉ đo dân ở thời 1, in từng lần đo
'use strict';
const path = require('path'), fs = require('fs');
const ROOT = path.join(__dirname, '..'), ONLY = process.argv[2] || '';
const GOAL = { idle: 0.1, nearHall: 8, inplace: 0, stuckPerMin: 1 };
(async () => {
  const { chromium } = require('playwright');
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 960, height: 540 } });
  await p.route('**/three.min.js', (r) => r.fulfill({ body: fs.readFileSync(path.join(ROOT, 'vendor', 'three.min.js')), contentType: 'application/javascript' }));
  await p.route('**/OrbitControls.js', (r) => r.fulfill({ body: fs.readFileSync(path.join(ROOT, 'vendor', 'OrbitControls.js')), contentType: 'application/javascript' }));
  await p.route('https://fonts.googleapis.com/**', (r) => r.fulfill({ body: '', contentType: 'text/css' }));
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  p.setDefaultTimeout(1800000);
  await p.goto('file://' + path.join(ROOT, 'index.html'));
  await p.waitForTimeout(3000);
  let bad = 0;
  const say = (ok, text) => { if (!ok) bad++; console.log((ok ? 'ĐẠT       ' : 'KHÔNG ĐẠT ') + text); };
  if (!ONLY || ONLY === 'chỗ') {
    const rows = await p.evaluate(() => {
      const G = __glass.G, B = __glass.buildings, PL3 = BK.Place3D.create(__glass.THREE), out = [];
      G.time.tps = 0;
      for (let lv = 1; lv <= 12; lv++) {
        G.goEra(lv);
        for (let i = 0; i < 6; i++) { const S = G.world.islands[i]; S.wonder = { era: lv, progress: 0.5, from: G.world.day }; }
        G.citiesRun.animate && G.citiesRun.animate(16, performance.now());
        for (let i = 0; i < 6; i++) {
          const pl = B.places(i); if (!pl) continue;
          for (const [tag, v, r] of [['playground', pl.playground, 3], ['trade', pl.trade, 2.5], ['story', pl.story, 2.5]]) {
            if (!v) { if (tag === 'playground' || lv <= 2) out.push({ lv, i, tag, miss: true }); continue; }
            const o = PL3.overlaps(v.x, v.z, r, pl.fixed, 'spot:' + tag); if (o.length) out.push({ lv, i, tag, n: o.length });
          }
          for (const k of B.offIsland(i)) out.push({ lv, i, tag: 'móng ngoài đảo: ' + k });
          const w = G.prosper && G.prosper.spotOf(i, lv);
          if (w) { const o = PL3.overlaps(w.x, w.z, 2.5, pl.fixed, null).filter((F) => !String(F.P).startsWith('spot:')); if (o.length) out.push({ lv, i, tag: 'wonder', n: o.length }); }
        }
        for (const S of G.world.islands) S.wonder = null;
      }
      return out;
    });
    const miss = rows.filter((r) => r.miss), over = rows.filter((r) => !r.miss);
    say(!over.length, 'chỗ không chồng (6 đảo × 12 thời): ' + over.length + ' chỗ chồng' + (over.length ? ' · ' + over.slice(0, 6).map((r) => r.tag + ' đảo ' + r.i + ' thời ' + r.lv).join(', ') : ''));
    say(!miss.length, 'đủ chỗ (sân chơi mọi thời; bãi trao đổi, gốc cây kể chuyện thời 1–2): thiếu ' + miss.length + (miss.length ? ' · ' + miss.slice(0, 6).map((r) => r.tag + ' đảo ' + r.i + ' thời ' + r.lv).join(', ') : ''));
  }
  if (!ONLY || ONLY === 'dân') {
    const agg = { idle: 0, nearHall: 0, inplace: 0, stuck: 0, mins: 0, n: 0 };
    for (const lv of (process.env.ERAS || '1,6,12').split(',').map(Number)) {
      await p.evaluate((lv) => __glass.G.goEra(lv), lv);
      for (let i = 0; i < 6; i++) for (const tod of [0.32, 0.5, 0.65, 0.82]) {
        await p.evaluate(([i, tod]) => { const G = __glass.G, W = G.world, C = BK.World.CYCLE_DAYS; G.time.tps = 0.02;
          BK.World.jump(W, W.day + ((((tod - BK.World.todOf(W.day)) % 1) + 1) % 1) * C); G.citiesRun.step(0.0001); G.citiesRun.slow();
          const L = G.lands[i], PL = __glass.buildings.places(i), h = (PL.hallC || PL.hall).clone().add(L.center); G.controls.target.copy(h).setY(L.center.y);
          G.camera.position.copy(h).add(new __glass.THREE.Vector3(0, 34, 30)); G.controls.update(); G.villageOf(i).auditStats(); }, [i, tod]);
        await p.waitForTimeout(4000);
        const r = await p.evaluate(([i]) => { const S = __glass.G.world.islands[i], st = __glass.G.villageOf(i).auditStats(); st.event = !!(S.situ.siege || S.situ.riot || S.situ.festival || BK.Dramas.active(S).length); return st; }, [i]);
        agg.n++; agg.idle = Math.max(agg.idle, r.idle); if (!r.event) agg.nearHall = Math.max(agg.nearHall, r.nearHall); agg.inplace += r.inplace; agg.stuck += r.stuck; agg.mins += 4 / 60;
        if (process.env.VERBOSE) console.log('thời ' + lv + ' đảo ' + i + ' buổi ' + tod, JSON.stringify(r));
      }
    }
    say(agg.idle <= GOAL.idle, 'đứng không (lớn nhất trong ' + agg.n + ' lần đo): ' + (100 * agg.idle).toFixed(0) + '% · mục tiêu ≤ ' + 100 * GOAL.idle + '%');
    say(agg.nearHall <= GOAL.nearHall, 'quanh nhà chính ngày thường (lớn nhất): ' + agg.nearHall + ' người · mục tiêu ≤ ' + GOAL.nearHall);
    say(agg.inplace <= GOAL.inplace, 'bước tại chỗ (cộng dồn): ' + agg.inplace + ' · mục tiêu ' + GOAL.inplace);
    say(agg.stuck / agg.mins <= GOAL.stuckPerMin, 'kẹt: ' + (agg.stuck / agg.mins).toFixed(2) + ' lần mỗi phút · mục tiêu ≤ ' + GOAL.stuckPerMin);
  }
  if (errs.length) say(false, 'lỗi trang: ' + errs.slice(0, 3).join(' | '));
  await b.close(); process.exit(bad ? 1 : 0);
})();
