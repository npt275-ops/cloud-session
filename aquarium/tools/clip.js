// Bể Kính · tools/clip.js · Quay clip khung dọc điện thoại để xem bằng mắt (design/ke-hoach-buoc-12.md mục 1)
// Mở trang thật (three.js trong vendor/) ở khung 390×844, dựng cảnh, quay từng đoạn thời gian thực lúc đồng hồ chạy (đúng tốc độ
// người chơi thấy; khung hình lấy qua CDP screencast), ghép thành từng .mp4 (ffmpeg), kèm một dải 8 ảnh để xem nhanh. Máy quay đặt cố định cho mỗi đoạn (không tự đổi góc).
//   node tools/clip.js village <thời> <đảo> <thư mục ra>     làng ban ngày và chiều tối
//   node tools/clip.js war <thời> <thư mục ra>                một trận qua cầu: cầu và cổng phụ, trong thành, nhà chính
//   node tools/clip.js gates <thời> <thư mục ra>              ảnh cổng phụ đầu cầu của sáu đảo (một tấm ghép)
// Cần: Playwright, Chromium, ffmpeg.
'use strict';
const path = require('path'), fs = require('fs'), { execFileSync } = require('child_process');
const ROOT = path.join(__dirname, '..');
const [KIND, LV0, A3, A4] = process.argv.slice(2);
const LV = +(LV0 || 6), OUT = path.resolve(KIND === 'village' ? A4 || 'clips' : A3 || 'clips'), ISLE = KIND === 'village' ? +(A3 || 0) : 0;
fs.mkdirSync(OUT, { recursive: true });

const RAW = path.join(OUT, '_raw'); let CDP = null;
async function page(b) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  await p.route('**/three.min.js', (r) => r.fulfill({ body: fs.readFileSync(path.join(ROOT, 'vendor', 'three.min.js')), contentType: 'application/javascript' }));
  await p.route('**/OrbitControls.js', (r) => r.fulfill({ body: fs.readFileSync(path.join(ROOT, 'vendor', 'OrbitControls.js')), contentType: 'application/javascript' }));
  await p.route('https://fonts.googleapis.com/**', (r) => r.fulfill({ body: '', contentType: 'text/css' }));
  p.errs = []; p.on('pageerror', (e) => p.errs.push(e.message));
  p.setDefaultTimeout(1800000);
  await p.goto('file://' + path.join(ROOT, 'index.html'));
  await p.waitForTimeout(3000);
  await p.evaluate(() => { const G = __glass.G; G.perf && G.perf.lock && G.perf.lock(0); });
  CDP = await ctx.newCDPSession(p);
  return p;
}
// quay một đoạn thời gian thực tối đa ms mili giây: khung hình lấy thẳng từ trình duyệt (CDP screencast, kèm giờ của từng khung)
// trong lúc đồng hồ game chạy, ghép thành .mp4 đúng nhịp; while_: chỉ quay khi điều kiện còn đúng (chuỗi biểu thức với W, w: trận
// đang quay), hết thì dừng sớm. Kèm một dải 8 ảnh rải đều để xem nhanh
async function shoot(p, tag, ms, slow, while_) {
  const dir = path.join(RAW, tag); fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
  const frames = [], onFrame = async ({ data, metadata, sessionId }) => { const f = path.join(dir, String(frames.length).padStart(5, '0') + '.jpg');
    fs.writeFileSync(f, Buffer.from(data, 'base64')); frames.push({ f, t: metadata.timestamp }); CDP.send('Page.screencastFrameAck', { sessionId }).catch(() => {}); };
  CDP.on('Page.screencastFrame', onFrame);
  await p.evaluate((slow) => { const G = __glass.G; G.time.tps = G.time.SPEEDS[0][0]; G.slowmo = slow || 0; }, slow);
  await CDP.send('Page.startScreencast', { format: 'jpeg', quality: 85, maxWidth: 390, maxHeight: 844, everyNthFrame: 1 });
  const t0 = Date.now(); let t = 0;
  while (t < ms) {
    if (while_ && t > 2000 && !(await p.evaluate((c) => { const W = __glass.G.world, w = W.wars.find((x) => x.id === window.__war); return new Function('W', 'w', 'return ' + c)(W, w); }, while_))) break;
    await p.waitForTimeout(500); t = Date.now() - t0;
  }
  await CDP.send('Page.stopScreencast'); CDP.off('Page.screencastFrame', onFrame);
  await p.evaluate(() => { __glass.G.time.tps = 0; });
  if (frames.length < 2) { console.log('đoạn', tag, 'không có khung hình'); return; }
  // ghép: mỗi khung giữ tới khung sau (giờ thật của trình duyệt)
  const list = frames.map((x, k) => "file '" + x.f + "'\nduration " + Math.max(0.01, ((frames[k + 1] || x).t - x.t) || 0.1).toFixed(3)).join('\n') + "\nfile '" + frames[frames.length - 1].f + "'\n";
  fs.writeFileSync(path.join(dir, 'list.txt'), list);
  const out = path.join(OUT, tag + '.mp4');
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', path.join(dir, 'list.txt'), '-vsync', 'vfr', '-pix_fmt', 'yuv420p', '-vf', 'pad=ceil(iw/2)*2:ceil(ih/2)*2', out]);
  const pick = Array.from({ length: Math.min(8, frames.length) }, (_, k) => frames[Math.floor((k * (frames.length - 1)) / Math.max(1, Math.min(8, frames.length) - 1))].f);
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...pick.flatMap((f) => ['-i', f]), '-filter_complex', (pick.length > 1 ? 'hstack=inputs=' + pick.length + ',' : '') + 'scale=' + 150 * pick.length + ':-1', path.join(OUT, tag + '-sheet.png')]);
  console.log('clip', out, ((frames[frames.length - 1].t - frames[0].t)).toFixed(0) + ' giây, ' + frames.length + ' khung');
  fs.rmSync(dir, { recursive: true, force: true });
}
const cam = (p, isle, at, off) => p.evaluate(([isle, at, off]) => { const G = __glass.G, T = __glass.THREE, L = G.lands[isle];
  const t = new T.Vector3(at[0], 0, at[2]).add(L.center); t.y = L.center.y + (at[1] || 0); G.controls.target.copy(t); G.camera.position.copy(t).add(new T.Vector3(...off)); G.controls.update(); }, [isle, at, off]);

(async () => {
  const { chromium } = require('playwright');
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await page(b);
  if (KIND === 'village') {
    await p.evaluate(([lv]) => { const G = __glass.G; BK.World.jump(G.world, 250 * (lv - 1) + 60); G.goEra(lv); }, [LV]); // dân đủ đông như lúc tới thời đó
    for (const [tod, tag] of [[0.4, 'sang'], [0.75, 'chieu']]) {
      const at = await p.evaluate(([i, tod]) => { const G = __glass.G, W = G.world, C = BK.World.CYCLE_DAYS; G.time.tps = 0;
        BK.World.jump(W, W.day + ((((tod - BK.World.todOf(W.day)) % 1) + 1) % 1) * C); G.citiesRun.step(0.0001); G.citiesRun.slow();
        const PL = __glass.buildings.places(i), h = PL.hallC || PL.hall; return [h.x, 0, h.z]; }, [ISLE, tod]);
      await cam(p, ISLE, at, [0, 30, 26]); await p.waitForTimeout(2500);
      await shoot(p, 'lang-t' + LV + '-d' + ISLE + '-' + tag, 25000);
    }
  } else if (KIND === 'gates') {
    await p.evaluate((lv) => { const G = __glass.G; G.time.tps = 0; BK.World.jump(G.world, 250 * (lv - 1) + 60); G.goEra(lv); G.world.tod = 0.45; G.citiesRun.step(0.0001); G.citiesRun.slow(); }, LV);
    const files = [];
    for (let i = 0; i < 6; i++) for (const k of ['gateL', 'gateR']) {
      const at = await p.evaluate(([i, k]) => { const PL = __glass.buildings.places(i), g = PL[k] && PL[k][0]; if (!g) return null; const o = g.clone().setY(0).normalize(); return [g.x, g.z, o.x, o.z]; }, [i, k]);
      if (!at) continue;
      await cam(p, i, [at[0] + at[2] * 7, 0, at[1] + at[3] * 7], [at[2] * 16 - at[3] * 8, 13, at[3] * 16 + at[2] * 8]);
      await p.waitForTimeout(1800); const f = path.join(OUT, 'gate-t' + LV + '-' + i + k + '.png'); await p.screenshot({ path: f }); files.push(f);
    }
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...files.flatMap((f) => ['-i', f]), '-filter_complex',
        'xstack=inputs=' + files.length + ':layout=' + files.map((f, j) => (j % 6 ? Array.from({ length: j % 6 },
        () => 'w0').join('+') : '0') + '_' + (j >= 6 ? 'h0' : '0')).join('|') + ',scale=1800:-1', path.join(OUT, 'gates-t' + LV + '.png')]);
    console.log('ảnh', path.join(OUT, 'gates-t' + LV + '.png'));
  } else if (KIND === 'war') {
    const info = await p.evaluate((LV) => { const G = __glass.G, W = G.world, L = BK.Island.living, E = BK.Economy; G.time.tps = 0; BK.World.jump(W, Math.max(400, 250 * (LV - 1) + 60)); G.goEra(LV);
      W.wars.length = 0; for (const S of W.islands) { S.situ.siege = null; S.annexedBy = null; S.situ.blockade = null; }
      let br = W.bridges.find((x) => Math.abs(x.a - x.b) === 1 || Math.abs(x.a - x.b) === 5);
      if (!br) { br = { a: 0, b: 1, era: LV, day: W.day, military: true, done: true }; W.bridges.push(br); }
      const a = br.a, t = br.b, A = W.islands[a];
      L(A).filter((q) => q.job === 'worker').slice(0, 20).forEach((q) => { q.job = 'soldier'; });
      const st = E.state(A); for (const r of E.RES) st.stock[r] = E.CAP(A.level, r);
      L(W.islands[t]).filter((q) => q.job === 'soldier').forEach((q, k) => { if (k % 3) q.away = 'test'; });
      const on = BK.Strategy.onAttacked; BK.Strategy.onAttacked = () => false; // (cảnh quay trận: bên giữ không phá cầu lúc nghe tin)
      const w = BK.War.launch(W, W.day, a, t, 'conquer', 1, W.rng); BK.Strategy.onAttacked = on; window.__war = w.id; window.__t = t;
      W.tod = 0.45; G.citiesRun.step(0.001); G.citiesRun.slow(); G.setFocus && G.setFocus(t);
      return 'đảo ' + a + ' đánh ' + t + ' qua ' + w.by + ', ' + w.troops.length + ' quân'; }, LV);
    console.log(info);
    const until = (cond, max) => p.evaluate(([cond, max]) => { const G = __glass.G, W = G.world, f = new Function('W', 'w', 'return ' + cond);
      for (let k = 0; k < max; k++) { const w = W.wars.find((x) => x.id === window.__war); if (f(W, w)) return w ? w.stage + '/' + (w.siege || '') : 'hết trận';
        BK.World.tick(W); if (k % 12 === 0) G.citiesRun.slow(); } return 'chưa tới'; }, [cond, max]);
    const gateAt = () => p.evaluate(() => { const G = __glass.G, t = window.__t, PL = __glass.buildings.places(t), sg = G.world.islands[t].situ.siege, g = ((sg && PL[sg.gate]) || PL.gate)[0], out = g.clone().setY(0).normalize();
      return { g: [g.x, 0, g.z], out: [out.x, 0, out.z] }; });
    // hành quân qua cầu: máy quay ngang cầu
    console.log('hành quân', await until('!w || w.stage === "march"', 12000));
    { const b = await p.evaluate(() => { const G = __glass.G, w = G.world.wars.find((x) => x.id === window.__war), t = window.__t, L = G.lands[t], PL = __glass.buildings.places(t), sd = BK.War.sideOf(t, w.from) ? 'gateR' : 'gateL', g = PL[sd][0], out = g.clone().setY(0).normalize();
        return { g: [g.x, 0, g.z], out: [out.x, 0, out.z] }; });
      await cam(p, await p.evaluate(() => window.__t), [b.g[0] + b.out[0] * 12, 0, b.g[2] + b.out[2] * 12], [-b.out[2] * 18, 12, b.out[0] * 18]); }
    await p.waitForTimeout(2000); await shoot(p, 'tran-t' + LV + '-0-cau', 30000, 1 / 16, 'w && (w.stage === "march")');
    console.log('cổng', await until('!w || w.stage === "gate"', 12000));
    // máy quay đặt cao, chếch bên hông cầu phía trong cổng (khỏi bị trụ cầu che): cổng, quân giữa cầu và xe phía sau cùng trong khung
    { const v = await p.evaluate(() => { const G = __glass.G, w = G.world.wars.find((x) => x.id === window.__war), t = window.__t, a = G.deckAt(t, w.from, 0.05), b = G.deckAt(t, w.from, 0.95);
        return a && b ? { a: [a.x, a.y, a.z], b: [b.x, b.y, b.z] } : null; });
      if (v) { const d = [v.b[0] - v.a[0], v.b[2] - v.a[2]], n = Math.hypot(d[0], d[1]), u = [d[0] / n, d[1] / n];
        await cam(p, await p.evaluate(() => window.__t), [v.a[0] + u[0] * n * 0.4, 0, v.a[2] + u[1] * n * 0.4], [-u[0] * 16 - u[1] * 24, 36, -u[1] * 16 + u[0] * 24]); }
      else { const { g, out } = await gateAt(); await cam(p, await p.evaluate(() => window.__t), [g[0] + out[0] * 9, 0, g[2] + out[2] * 9], [out[0] * 30, 18, out[2] * 30]); } }
    await p.waitForTimeout(2500); await shoot(p, 'tran-t' + LV + '-1-cong', 45000, 1 / 16, 'w && w.stage === "gate"');
    console.log('trong thành', await until('!w || (w.stage === "inside")', 12000));
    { const t = await p.evaluate(() => window.__t); await cam(p, t, [0, 0, 0], [0, 40, 32]); }
    await p.waitForTimeout(2500); await shoot(p, 'tran-t' + LV + '-2-thanh', 40000, 1 / 16, 'w && w.stage === "inside" && w.siege !== "hall"');
    console.log('nhà chính', await until('!w || w.siege === "hall"', 12000));
    { const t = await p.evaluate(() => window.__t), h = await p.evaluate((t) => { const PL = __glass.buildings.places(t), h = PL.hallC || PL.hall; return [h.x, 0, h.z]; }, t); await cam(p, t, h, [20, 22, 26]); }
    await p.waitForTimeout(2500); await shoot(p, 'tran-t' + LV + '-3-nhachinh', 40000, 1 / 16, 'w && w.siege === "hall"');
  }
  console.log('lỗi trang', JSON.stringify(p.errs.slice(0, 5)));
  fs.rmSync(RAW, { recursive: true, force: true }); await b.close();
})();
