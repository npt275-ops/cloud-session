// Bể Kính · tools/bug-hunt.js · Quét lỗi trận chiến và NPC bằng trình duyệt không giao diện (design/ke-hoach-buoc-12.md mục 9)
// Mở trang thật, tự chạy từng khung hình (không vẽ, nhanh hơn thời gian thực, đúng nhịp xem chậm của trận), đo các bất biến:
//   trận (mỗi thời trong ERAS, một trận qua cầu từ lúc hành quân tới khi hết trận, máy quay đặt ở đảo bị đánh):
//     quân đánh vào trong tường trước khi cổng đổ · xe công thành vào thành trước khi cổng đổ hay rơi xuống nước
//     đạn của NPC bay xa hơn tầm vũ khí · phát trúng không có người bắn trong tầm · trận kẹt một chặng quá lâu
//     quân giặc còn đứng lại sau khi hết trận
//   dân (mỗi thời, sáu đảo, ban ngày và chiều tối, ngày thường):
//     toạ độ hỏng (NaN) · đứng ngoài đảo mà không ở trên cầu · lơ lửng · nhảy chỗ · người chết còn đi
//     chồng lên nhau, bước tại chỗ, kẹt (render/village3d.js auditStats) · làm sai việc (audit)
//   cả hai: lỗi trang (pageerror)
// In từng mục ĐẠT / KHÔNG ĐẠT kèm vài ví dụ; mã thoát 1 nếu có mục không đạt.
//   node tools/bug-hunt.js              cả hai phần, ERAS=3,6,9,11
//   ERAS=6 node tools/bug-hunt.js trận   chỉ phần trận, thời 6
'use strict';
const path = require('path'),
  fs = require('fs');
const ROOT = path.join(__dirname, '..'),
  ONLY = process.argv[2] || '',
  ERAS = (process.env.ERAS || '3,6,9,11').split(',').map(Number);
(async () => {
  const { chromium } = require('playwright');
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 480, height: 360 } });
  await p.route('**/three.min.js', (r) =>
    r.fulfill({ body: fs.readFileSync(path.join(ROOT, 'vendor', 'three.min.js')), contentType: 'application/javascript' }),
  );
  await p.route('**/OrbitControls.js', (r) =>
    r.fulfill({ body: fs.readFileSync(path.join(ROOT, 'vendor', 'OrbitControls.js')), contentType: 'application/javascript' }),
  );
  await p.route('https://fonts.googleapis.com/**', (r) => r.fulfill({ body: '', contentType: 'text/css' }));
  const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  p.setDefaultTimeout(3600000);
  await p.goto('file://' + path.join(ROOT, 'index.html'));
  if (process.env.NO_SOLIDS)
    await p.evaluate(() => {
      BK.NAV_SOLIDS = false;
    }); // (so sánh: tắt việc đi vòng công trình, render/nav3d.js)
  await p.waitForTimeout(3000);
  const setup = async () => {
    // bộ đo trong trang: chạy n khung (dt 50 ms) cho đảo i, đếm lỗi vào H (window.__hunt)
    await p.evaluate(() => {
      const G = __glass.G,
        T = __glass.THREE;
      window.__hunt = { n: {}, ex: {}, frames: 0, seen: {} };
      const H = window.__hunt,
        bad = (k, ex) => {
          if (H.off) return;
          H.n[k] = (H.n[k] || 0) + 1;
          const e = H.ex[k] || (H.ex[k] = []);
          if (e.length < 4) e.push(ex);
        };
      const prev = new Map();
      let t = performance.now();
      // máy quay nhìn đảo i (để làng đó chạy như lúc người chơi xem)
      window.__look = (i, at) => {
        const L = G.lands[i],
          c = L.center.clone().add(at || new T.Vector3());
        G.controls.target.copy(c).setY(L.center.y);
        G.camera.position.copy(c).add(new T.Vector3(0, 34, 30));
        G.controls.update();
        prev.clear();
      };
      // gần đoạn thẳng a–b (mặt phẳng ngang) trong khoảng r
      const nearSeg = (q, a, b, r) => {
        const ax = b.x - a.x,
          az = b.z - a.z,
          L2 = ax * ax + az * az || 1,
          u = Math.max(0, Math.min(1, ((q.x - a.x) * ax + (q.z - a.z) * az) / L2));
        return Math.hypot(a.x + ax * u - q.x, a.z + az * u - q.z) <= r;
      };
      window.__run = (i, frames, tag, war) => {
        const L = G.lands[i],
          v = G.villageOf(i),
          W = G.world;
        for (let k = 0; k < frames; k++) {
          const dt = 50;
          t += dt;
          H.frames++;
          G.citiesRun.step((dt * G.time.tps * (G.slowmo ? G.slowmo : 1)) / 1000);
          if (k % 20 === 0) G.citiesRun.slow();
          G.citiesRun.animate(dt, t, 0);
          const w = war != null ? W.wars.find((x) => x.id === war) : null,
            before = w && (w.stage === 'march' || w.stage === 'gate');
          if (war != null && war >= 0) {
            const s = w
              ? w.stage +
                (w.siege ? '/' + w.siege : '') +
                (w.blockade && !w.blockade.done ? '(vây)' : '') +
                (w.duel && !w.duel.done ? '(đấu tướng)' : '')
              : 'hết';
            if (H.stages && H.stages[H.stages.length - 1] !== s) H.stages.push(s);
          }
          let front = 1e9;
          // làng vừa hiện lại (người được đặt lại vào chỗ), người vừa rời khỏi danh sách: không so với vị trí cũ
          for (const [j2, vj2] of G.villages.entries()) {
            if (vj2 && !vj2.visible) for (const kk of [...prev.keys()]) if (kk.startsWith(j2 + ':')) prev.delete(kk);
          }
          const present = new Set();
          // mọi làng đang hiện (đảo đang xem và các đảo gần máy quay)
          for (const [j, vj] of G.villages.entries()) {
            if (!vj || !vj.visible) continue;
            const Lj = G.lands[j],
              rows = vj.inspect();
            // mặt cầu nối đảo j (toạ độ đảo j): người đứng trên đó không tính là ngoài đảo
            const decks = (G.bridges3d.bridges || [])
              .filter((B) => B.pa && B.era >= 0 && (B.a === j || B.b === j))
              .map((B) => [B.pa.clone().sub(Lj.center), B.pb.clone().sub(Lj.center)]);
            for (const f of rows) {
              if (!f.inside) {
                H.seen.người = (H.seen.người || 0) + 1;
                if (f.deck && f.side === 'foe') H.seen['lượt quân trên cầu'] = (H.seen['lượt quân trên cầu'] || 0) + 1;
                if (f.side === 'def') H.seen['lượt bên giữ'] = (H.seen['lượt bên giữ'] || 0) + 1;
              }
              const r = Math.hypot(f.x, f.z),
                R = Lj.rOf(Math.atan2(f.z, f.x)),
                id = tag + ' đảo ' + j + ' ' + f.key + ' (' + (f.verb || f.state) + '@' + (f.place || '-') + ')';
              if (!isFinite(f.x) || !isFinite(f.z) || !isFinite(f.y)) {
                bad('toạ độ NaN', id);
                continue;
              }
              if (f.inside) {
                prev.delete(j + ':' + f.key);
                continue;
              }
              if (!f.deck && r > R + 0.4 && !decks.some(([a, b]) => nearSeg(f, a, b, 2.2)))
                bad('đứng ngoài đảo (không trên cầu)', id + ' r=' + r.toFixed(1) + '/' + R.toFixed(1));
              if (!f.deck && Math.abs(f.y) > 0.05) bad('lơ lửng', id + ' y=' + f.y.toFixed(2));
              if (!f.alive && f.moving && !f.dying) bad('người chết còn đi', id);
              present.add(j + ':' + f.key);
              const q = prev.get(j + ':' + f.key);
              if (q && !q.inside && Math.hypot(q.x - f.x, q.z - f.z) > 2)
                bad(
                  'nhảy chỗ',
                  id +
                    ' ' +
                    Math.hypot(q.x - f.x, q.z - f.z).toFixed(1) +
                    ' từ r=' +
                    Math.hypot(q.x, q.z).toFixed(1) +
                    ' tới r=' +
                    r.toFixed(1) +
                    (f.gx != null ? ' đích r=' + Math.hypot(f.gx, f.gz).toFixed(1) + '/' + Lj.rOf(Math.atan2(f.gz, f.gx)).toFixed(1) : ''),
                );
              prev.set(j + ':' + f.key, f);
              if (j === i && w && w.stage === 'gate' && f.side === 'foe' && f.deck && !f.moving) {
                const PL = __glass.buildings.places(i),
                  g = PL && PL[w.gate] && PL[w.gate][0];
                if (g) front = Math.min(front, Math.hypot(g.x - f.x, g.z - f.z));
              }
              if (j === i && w && before && f.side === 'foe' && !f.deck && r < R - 4.5 && f.key.startsWith('w' + window.__warA + ':'))
                bad('quân đánh vào trong tường trước khi cổng đổ', id + ' chặng ' + w.stage + ' r=' + r.toFixed(1) + '/' + R.toFixed(1));
              if (j === i && war != null && !w && f.side === 'foe' && f.guest && f.key.startsWith('w' + window.__warA + ':'))
                bad('quân giặc còn lại sau khi hết trận', id);
            }
          }
          for (const kk of [...prev.keys()]) if (!present.has(kk)) prev.delete(kk);
          // hàng đầu quân trên cầu phải trong tầm bắn tới cổng (các hàng sau thì không cần)
          if (w && w.stage === 'gate' && front < 1e9 && front > BK.Arms.rangeOf(W.islands[w.a].level) + 1)
            bad(
              'hàng đầu quân trên cầu đứng ngoài tầm bắn tới cổng',
              tag + ' cách cổng ' + front.toFixed(1) + ' tầm ' + BK.Arms.rangeOf(W.islands[w.a].level),
            );
          // hình người nhỏ hành quân (render/war3d.js), người đi bộ qua cầu (render/travel3d.js): phải đứng trên đất hay mặt cầu
          if (k % 10 === 0)
            for (const [src, fig] of [
              ['lính hành quân', G.war3d],
              ['người qua cầu', G.travel3d],
            ])
              for (const q of fig && fig.figures ? fig.figures() : []) {
                const onLand = G.lands.some((Lk) => {
                  const x = q.x - Lk.center.x,
                    z = q.z - Lk.center.z;
                  return Math.hypot(x, z) <= Lk.rOf(Math.atan2(z, x)) + 0.5;
                });
                const onBridge = (G.bridges3d.bridges || []).some((B) => B.pa && B.era >= 0 && nearSeg(q, B.pa, B.pb, 3));
                if (!onLand && !onBridge) bad(src + ' đi trên mặt nước', tag + ' (' + q.x.toFixed(1) + ', ' + q.z.toFixed(1) + ')');
              }
          if (w && G.gearNow)
            for (const e of G.gearNow) {
              if (!e.at || ['drone', 'tent', 'portal', 'shield'].includes(e.kind)) continue;
              const x = e.at.x - L.center.x,
                z = e.at.z - L.center.z,
                r = Math.hypot(x, z),
                R = L.rOf(Math.atan2(z, x));
              if (e.isle !== i) continue; // (xe của trận khác)
              const a = G.deckAt && G.deckAt(i, e.from, 0),
                b2 = G.deckAt && G.deckAt(i, e.from, 1),
                onDeck = a && b2 && nearSeg({ x, z }, a, b2, 2.6);
              if (before && r < R - 4.5)
                bad('xe công thành vào thành trước khi cổng đổ', e.kind + ' chặng ' + w.stage + ' r=' + r.toFixed(1));
              if (r > R + 0.4 && !onDeck)
                bad(
                  'xe công thành dưới nước (ngoài đảo, không trên cầu)',
                  e.kind + ' chặng ' + w.stage + ' r=' + r.toFixed(1) + '/' + R.toFixed(1),
                );
            }
          if (G.shots && G.shots.drain)
            for (const s of G.shots.drain()) {
              H.seen['đạn ' + s.src] = (H.seen['đạn ' + s.src] || 0) + 1;
              if (s.src === 'phantom') bad('phát trúng không có người bắn trong tầm', tag + ' · ' + s.why);
              else if ((s.src === 'npc' || s.src === 'hit') && s.d > s.rg + 0.5)
                bad('đạn NPC bay quá tầm', tag + ' ' + s.d.toFixed(1) + '/' + s.rg.toFixed(1));
            }
          if (k % 100 === 99) {
            const st = v.auditStats();
            if (st.overlap) bad('người đứng chồng lên nhau', tag + ' ' + st.overlap + ' cặp ' + st.overWhy.join(', '));
            if (st.inplace) bad('bước tại chỗ', tag + ' ' + st.inplace);
            if (st.stuckHard) bad('kẹt thật (tìm đường lại vẫn không đi được, phải đi thẳng hay đứng lại)', tag + ' ' + st.stuckHard);
            for (const x of v.audit()) bad('làm sai việc', tag + ' ' + x);
          }
        }
      };
    });
  };
  await setup();
  let bad = 0;
  const say = (ok, text) => {
    if (!ok) bad++;
    console.log((ok ? 'ĐẠT       ' : 'KHÔNG ĐẠT ') + text);
  };
  const report = async (title) => {
    const H = await p.evaluate(() => {
      const H = window.__hunt,
        out = { n: H.n, ex: H.ex, frames: H.frames, seen: H.seen };
      H.n = {};
      H.ex = {};
      H.frames = 0;
      H.seen = {};
      return out;
    });
    console.log(
      '— ' +
        title +
        ' (' +
        H.frames +
        ' khung · ' +
        Object.entries(H.seen)
          .map(([k, v]) => k + ' ' + v)
          .join(', ') +
        ')',
    );
    const keys = Object.keys(H.n);
    say(!keys.length, 'không có lỗi nào' + (keys.length ? ': ' + keys.length + ' loại' : ''));
    for (const k of keys) console.log('    ' + k + ': ' + H.n[k] + ' · ' + H.ex[k].join(' | '));
  };
  if (!ONLY || ONLY === 'trận') {
    for (const LV of ERAS)
      for (let pair = 0; pair < (+process.env.PAIRS || 1); pair++) {
        // mỗi trận bắt đầu từ trang mới (trận trước chiếm đảo, giết lính, phá cổng: không mang sang trận sau)
        await p.reload();
        await p.waitForTimeout(2500);
        await setup();
        const info = await p.evaluate(
          ([LV, pair]) => {
            const G = __glass.G,
              W = G.world,
              L = BK.Island.living,
              E = BK.Economy;
            G.time.tps = G.time.SPEEDS[0][0];
            BK.World.jump(W, Math.max(400, 250 * (LV - 1) + 60));
            G.goEra(LV);
            W.wars.length = 0;
            for (const S of W.islands) {
              S.situ.siege = null;
              S.annexedBy = null;
              S.situ.blockade = null;
            }
            // trận thứ pair: cầu thứ pair giữa hai đảo kề nhau (chưa có thì bắc cầu quân sự), đánh theo chiều a → b hay ngược lại
            const near = [
              [0, 1],
              [1, 2],
              [2, 3],
              [3, 4],
              [4, 5],
              [5, 0],
            ][Math.floor(pair / 2) % 6];
            let br = W.bridges.find((x) => x.done && ((x.a === near[0] && x.b === near[1]) || (x.a === near[1] && x.b === near[0])));
            if (!br) {
              br = { a: near[0], b: near[1], era: LV, day: W.day, military: true, done: true };
              W.bridges.push(br);
            }
            const a = pair % 2 ? br.b : br.a,
              t = pair % 2 ? br.a : br.b,
              A = W.islands[a];
            L(A)
              .filter((q) => q.job === 'worker')
              .slice(0, 20)
              .forEach((q) => {
                q.job = 'soldier';
              });
            const st = E.state(A);
            for (const r of E.RES) st.stock[r] = E.CAP(A.level, r);
            const on = BK.Strategy.onAttacked;
            BK.Strategy.onAttacked = () => false; // (bên giữ không phá cầu lúc nghe tin: để thấy trọn trận)
            const w = BK.War.launch(W, W.day, a, t, 'conquer', 1, W.rng);
            BK.Strategy.onAttacked = on;
            if (!w) return null;
            window.__war = w.id;
            window.__t = t;
            window.__warA = a;
            G.setFocus && G.setFocus(t);
            G.citiesRun.slow();
            window.__hunt.stages = [];
            // máy quay ở đầu cầu (như người chơi xem trận): cả làng bị đánh lẫn làng bên kia cầu đều chạy
            const dk = G.deckAt(t, w.from != null ? w.from : a, 0.3);
            __look(t, dk ? dk.clone().setY(0) : null);
            return { a, t, n: w.troops.length, id: w.id };
          },
          [LV, pair],
        );
        if (!info) {
          say(false, 'thời ' + LV + ': không mở được trận');
          continue;
        }
        for (let k = 0; k < 600; k++) {
          const s = await p.evaluate(
            ([t, id, LV]) => {
              __run(t, 200, 'thời ' + LV, id);
              return !!__glass.G.world.wars.find((x) => x.id === id);
            },
            [info.t, info.id, LV],
          );
          if (!s) {
            await p.evaluate(([t, LV]) => __run(t, 200, 'thời ' + LV + ' sau trận', -1), [info.t, LV]);
            break;
          }
        }
        const stages = await p.evaluate(() => window.__hunt.stages);
        const end = await p.evaluate((id) => {
          const G = __glass.G,
            W = G.world,
            w = W.wars.find((x) => x.id === id);
          return w
            ? 'chưa hết: ' + w.stage
            : 'hết ngày ' +
                W.day.toFixed(0) +
                ' · ' +
                W.log
                  .slice(-4)
                  .map((x) => x.text)
                  .join(' / ');
        }, info.id);
        console.log(
          'thời ' + LV + ': đảo ' + info.a + ' đánh ' + info.t + ', ' + info.n + ' quân · chặng ' + stages.join(' → ') + ' · ' + end,
        );
        if (end.startsWith('chưa')) say(false, 'thời ' + LV + ': trận kẹt ở một chặng (' + end + ')');
        await report('trận thời ' + LV);
      }
  }
  if (!ONLY || ONLY === 'dân') {
    for (const LV of ERAS) {
      await p.reload();
      await p.waitForTimeout(2500);
      await setup();
      await p.evaluate((lv) => {
        const G = __glass.G,
          W = G.world;
        G.time.tps = G.time.SPEEDS[0][0];
        W.wars.length = 0;
        for (const S of W.islands) {
          S.situ.siege = null;
          S.situ.blockade = null;
        }
        BK.World.jump(W, 250 * (lv - 1) + 60);
        G.goEra(lv);
      }, LV);
      for (let i = 0; i < 6; i++)
        for (const tod of [0.4, 0.78]) {
          await p.evaluate(
            ([i, tod, LV]) => {
              const G = __glass.G,
                W = G.world,
                C = BK.World.CYCLE_DAYS;
              BK.World.jump(W, W.day + ((((tod - BK.World.todOf(W.day)) % 1) + 1) % 1) * C);
              G.citiesRun.slow();
              __look(i);
              window.__hunt.off = true;
              __run(i, 30, 'khởi', null);
              window.__hunt.off = false;
              __run(i, 600, 'thời ' + LV + ' đảo ' + i + ' buổi ' + tod, null);
            },
            [i, tod, LV],
          );
        }
      await report('dân thời ' + LV);
    }
  }
  say(!errs.length, 'lỗi trang: ' + errs.length + (errs.length ? ' · ' + [...new Set(errs)].slice(0, 3).join(' | ') : ''));
  await b.close();
  process.exit(bad ? 1 : 0);
})();
