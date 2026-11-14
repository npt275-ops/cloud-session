// Bể Kính · tools/check-possess.js · Kiểm tra cú nhập hồn (design/ke-hoach-buoc-32.md mục 5)
// Mở trang thật, bấm nhập hồn, đợi đủ các pha (khựng, lao, chạm, mở mắt, trong thân), rồi kiểm:
//   vào được     có người được chọn, đủ các pha theo đúng thứ tự
//   logic        người bị nhập có p.possessed, bộ não không giao việc (việc của người đó là việc riêng: self)
//   đi lại       giữ phím W thì người đi tới; không đứng trong chân công trình nào (places().solids)
//   cảnh gần     có cỏ, sỏi quanh chân (render/near3d.js), sương kéo gần
//   thoát        Esc: về góc nhìn thượng đế, người được trả lại cho bộ não, hiệu ứng tắt hết, máy quay điều khiển được lại
//   lỗi trang
// In khung hình chậm nhất trong lúc lao (trình duyệt không giao diện vẽ bằng phần mềm nên chậm hơn máy thật nhiều: chỉ để so
// giữa các lần chạy). SHOTS=thư-mục: chụp ảnh từng pha vào đó; ISLE=0..5: nhập vào một người trên đảo đó (mặc định 0).
// Mã thoát 1 nếu có mục không đạt.
//   node tools/check-possess.js
'use strict';
const path = require('path'),
  fs = require('fs');
const ROOT = path.join(__dirname, '..'),
  SHOTS = process.env.SHOTS || null,
  ISLE = +(process.env.ISLE || 0); // đảo của người được nhập (0 Lúa Vàng: đất xanh, có cỏ; 3 Tuyết Trắng, 5 Cát Hồng: gần như không có cỏ)
(async () => {
  const { chromium } = require('playwright');
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 760, height: 480 } });
  await p.route('**/three.min.js', (r) =>
    r.fulfill({ body: fs.readFileSync(path.join(ROOT, 'vendor', 'three.min.js')), contentType: 'application/javascript' }),
  );
  await p.route('**/OrbitControls.js', (r) =>
    r.fulfill({ body: fs.readFileSync(path.join(ROOT, 'vendor', 'OrbitControls.js')), contentType: 'application/javascript' }),
  );
  await p.route('https://fonts.googleapis.com/**', (r) => r.fulfill({ body: '', contentType: 'text/css' }));
  const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  p.setDefaultTimeout(600000);
  await p.goto('file://' + path.join(ROOT, 'index.html'));
  await p.waitForTimeout(4000);
  const shot = async (n) => SHOTS && p.screenshot({ path: path.join(SHOTS, n + '.png') });
  if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });
  const res = [];
  const ok = (name, pass, note) => res.push([name, pass, note || '']);
  await shot('0-thuong-de');
  // (người chơi thật nhập vào người ngẫu nhiên trên cả sáu đảo; bài kiểm tra chọn sẵn một người lớn trên đảo ISLE để đo được cỏ)
  await p.evaluate((isle) => {
    const G = __glass.G,
      S = G.world.islands[isle],
      ps = [...S.people.values()].filter((q) => q.alive && !q.away && BK.People.ageOf(q, S.day) >= 16 && BK.People.ageOf(q, S.day) < 60);
    G.world.soul = { i: isle, id: ps[0].id };
  }, ISLE);
  const entered = await p.evaluate(() => __glass.G.possess.enter());
  ok('vào được', entered);
  // các pha và khung hình chậm nhất trong lúc lao (đo trong trang)
  await p.evaluate(() => {
    const G = __glass.G,
      log = (window.__soulLog = { phases: [], worst: 0 });
    let last = performance.now();
    (function tick() {
      const now = performance.now(),
        ph = G.possess.st.phase;
      if (ph === 'dive') log.worst = Math.max(log.worst, now - last);
      if (log.phases[log.phases.length - 1] !== ph) log.phases.push(ph);
      last = now;
      if (ph !== 'in' && ph !== 'off') requestAnimationFrame(tick);
    })();
  });
  const seen = new Set();
  for (let k = 0; k < 4000; k++) {
    const ph = await p.evaluate(() => __glass.G.possess.st.phase);
    if (!seen.has(ph)) {
      seen.add(ph);
      await shot('1-' + ph);
    }
    if (ph === 'in' || ph === 'off') break;
    await p.waitForTimeout(40);
  }
  const L = await p.evaluate(() => window.__soulLog);
  ok('đủ các pha', L.phases.join(' ') === 'wind dive hit wake in', L.phases.join(' → '));
  await p.waitForTimeout(1500);
  await shot('2-trong-than');
  const s0 = await p.evaluate(() => {
    const G = __glass.G,
      P = G.possess,
      S = G.world.islands[P.st.i],
      pp = S.people.get(P.st.id),
      m = S.minds.get(P.st.id) || {},
      f = G.villageOf(P.st.i).folk(P.st.id);
    return {
      possessed: !!pp.possessed,
      self: !!m.self,
      verb: m.verb || null,
      pos: [f.pos.x, f.pos.z],
      near: G.near.counts(),
      fogNear: G.scene.fog ? G.scene.fog.near : null,
    };
  });
  ok('logic: người bị nhập không bị giao việc', s0.possessed && s0.self && !s0.verb);
  ok(
    'cảnh gần: có cỏ, sỏi, hoa',
    ISLE === 3 || ISLE === 5 ? s0.near.pebbles > 50 : s0.near.grass > 200,
    s0.near.grass + ' khóm cỏ, ' + s0.near.flowers + ' cây hoa, ' + s0.near.pebbles + ' viên sỏi',
  );
  ok('cảnh gần: sương kéo gần', s0.fogNear != null && s0.fogNear < 100, 'sương bắt đầu ở ' + (s0.fogNear || 0).toFixed(0));
  // giữ W tới khi đi được 1 đơn vị, tối đa 8 giây (trình duyệt vẽ bằng phần mềm có khi gần một giây mới có một khung hình)
  await p.keyboard.down('KeyW');
  for (let t0 = Date.now(); Date.now() - t0 < 8000; ) {
    await p.waitForTimeout(400);
    const d = await p.evaluate(([x, z]) => {
      const G = __glass.G,
        P = G.possess,
        f = G.villageOf(P.st.i).folk(P.st.id);
      return Math.hypot(f.pos.x - x, f.pos.z - z);
    }, s0.pos);
    if (d > 1) break;
  }
  await p.keyboard.up('KeyW');
  await shot('3-di');
  const s1 = await p.evaluate(() => {
    const G = __glass.G,
      P = G.possess,
      f = G.villageOf(P.st.i).folk(P.st.id),
      PL = G.buildings.places(P.st.i),
      inside = (PL.solids || []).filter((B) => {
        if (B.kind === 'town') return false;
        const dx = f.pos.x - B.x,
          dz = f.pos.z - B.z,
          lx = dx * B.c - dz * B.s,
          lz = dx * B.s + dz * B.c;
        return lx > B.x0 && lx < B.x1 && lz > B.z0 && lz < B.z1;
      });
    return { pos: [f.pos.x, f.pos.z], inside: inside.map((B) => B.kind) };
  });
  const moved = Math.hypot(s1.pos[0] - s0.pos[0], s1.pos[1] - s0.pos[1]);
  ok('đi lại: giữ W thì đi tới', moved > 0.5, 'đi được ' + moved.toFixed(2));
  ok('đi lại: không đứng trong chân công trình', !s1.inside.length, s1.inside.join(', '));
  await p.keyboard.press('Escape');
  for (let k = 0; k < 600; k++) {
    if ((await p.evaluate(() => __glass.G.possess.st.phase)) === 'off') break;
    await p.waitForTimeout(40);
  }
  await p.waitForTimeout(600);
  await shot('4-thoat');
  const s2 = await p.evaluate(() => {
    const G = __glass.G,
      s = G.world.soul,
      pp = G.world.islands[s.i].people.get(s.id);
    return {
      possessed: !!pp.possessed,
      controls: G.controls.enabled,
      fx: G.post.active(),
      body: document.body.classList.contains('possessed'),
    };
  });
  ok('thoát: trả người lại, hiệu ứng tắt, máy quay điều khiển được', !s2.possessed && s2.controls && !s2.fx && !s2.body);
  ok('không lỗi trang', !errs.length, errs.slice(0, 2).join(' | '));
  await b.close();
  let bad = 0;
  for (const [n, pass, note] of res) {
    if (!pass) bad++;
    console.log((pass ? 'ĐẠT       ' : 'KHÔNG ĐẠT ') + n + (note ? ' (' + note + ')' : ''));
  }
  console.log('khung hình chậm nhất lúc lao: ' + L.worst.toFixed(0) + ' ms (trình duyệt vẽ bằng phần mềm)');
  console.log(bad ? 'KHÔNG ĐẠT: ' + bad : 'ĐẠT: cú nhập hồn chạy đúng');
  process.exit(bad ? 1 : 0);
})();
