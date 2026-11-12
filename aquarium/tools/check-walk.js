// Bể Kính · tools/check-walk.js · Người đi xuyên công trình: 6 đảo × 12 thời (design/ke-hoach-buoc-14.md mục 7)
// Mở trang thật, đặt cả sáu đảo vào từng thời, máy quay nhìn từng đảo (cho làng đó chạy), chạy từng khung hình như lúc xem và đo
// mọi người đang hiện (không tính người trong nhà, trên mặt cầu, người làm ruộng giữa luống): từ ngang ngực (1,4) chiếu thẳng
// xuống tới gần chân, có mặt nào của công trình, sân, bãi làm việc cắt qua người (cao hơn chân 0,45 trở lên) thì là đi xuyên:
// đứng trong nhà, trong bệ nhà chính, chân chìm dưới mặt sân. In theo đảo, thời, loại công trình; mã thoát 1 nếu có.
//   node tools/check-walk.js                    cả 12 thời
//   ERAS=10,11,12 ISLES=2,4 node tools/check-walk.js
//   FRAMES=160 (mỗi buổi, mỗi đảo) · KING=1 chỉ đo người đứng đầu đảo
'use strict';
const path = require('path'), fs = require('fs');
const ROOT = path.join(__dirname, '..'), ERAS = (process.env.ERAS || '1,2,3,4,5,6,7,8,9,10,11,12').split(',').map(Number);
const ISLES = (process.env.ISLES || '0,1,2,3,4,5').split(',').map(Number), FRAMES = +(process.env.FRAMES || 160);
(async () => {
  const { chromium } = require('playwright');
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 320, height: 240 } });
  await p.route('**/three.min.js', (r) => r.fulfill({ body: fs.readFileSync(path.join(ROOT, 'vendor', 'three.min.js')), contentType: 'application/javascript' }));
  await p.route('**/OrbitControls.js', (r) => r.fulfill({ body: fs.readFileSync(path.join(ROOT, 'vendor', 'OrbitControls.js')), contentType: 'application/javascript' }));
  await p.route('https://fonts.googleapis.com/**', (r) => r.fulfill({ body: '', contentType: 'text/css' }));
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  p.setDefaultTimeout(3600000);
  await p.goto('file://' + path.join(ROOT, 'index.html')); await p.waitForTimeout(3000);
  const rows = [];
  for (const lv of ERAS) {
    const r = await p.evaluate(([lv, isles, FR, king]) => {
      const G = __glass.G, T = __glass.THREE, B = __glass.buildings, W = G.world, C = BK.World.CYCLE_DAYS, out = [];
      G.time.tps = 0; G.goEra(lv);
      const ray = new T.Raycaster(), down = new T.Vector3(0, -1, 0), o = new T.Vector3(), main = BK.BuildKit.mats().main, sides = new Map();
      const kindOf = (m) => { for (let q = m; q; q = q.parent) if (q.userData && q.userData.kind) return q.userData.kind; return 'khối gộp'; };
      let t = performance.now() + lv * 1e7;
      for (const i of isles) {
        const L = G.lands[i], V = G.villageOf(i), PL = B.places(i), h = (PL.hallC || PL.hall).clone().add(L.center);
        for (const tod of [0.38, 0.62]) {
          BK.World.jump(W, W.day + ((((tod - BK.World.todOf(W.day)) % 1) + 1) % 1) * C); G.citiesRun.step(0.0001); G.citiesRun.slow();
          G.controls.target.copy(h).setY(L.center.y); G.camera.position.copy(h).add(new T.Vector3(0, 34, 30)); G.controls.update();
          for (let f = 0; f < FR; f++) {
            t += 50; G.citiesRun.step((50 * 0.75) / 1000); if (f % 20 === 0) G.citiesRun.slow(); G.citiesRun.animate(50, t, 0);
            if (f < 40 || f % 8) continue; // (đầu mỗi lượt: người còn đang ra khỏi nhà, chưa tính)
            // mặt của công trình (khối chính, mảnh dẹt, khối gộp), sân làng, bãi làm việc của đảo này: chiếu được cả hai mặt
            const meshes = []; L.g.traverse((m) => { if (!m.isMesh || m.isInstancedMesh) return; let vis = true; for (let q = m; q && q !== L.g; q = q.parent) if (!q.visible) { vis = false; break; } if (!vis) return;
              const isYard = m.material && m.material.userData && m.material.userData.lookKind === 'dirt'; if (m.material === main || isYard || (m.userData && m.userData.yardPart)) meshes.push(m); });
            for (const m of meshes) { if (!sides.has(m.material)) sides.set(m.material, m.material.side); m.material.side = T.DoubleSide; }
            L.g.updateMatrixWorld(true);
            for (const x of V.inspect()) {
              if (x.inside || x.deck || x.dying || !x.alive || x.guest) continue;
              if (king && x.key !== W.islands[i].seats.king) continue;
              if (x.place === 'field' || x.place === 'farmOut' || x.verb === 'farm' || x.place === 'site') continue; // (thợ dựng đứng sát góc nhà đang lên)
              const gy = L.surfAt(x.x, x.z), feet = L.center.y + gy;
              o.set(L.center.x + x.x, feet + 1.4, L.center.z + x.z); ray.set(o, down); ray.far = 0.95; // (mặt đường, đường ray, vỉa hè dưới 0,45: không tính)
              const hit = ray.intersectObjects(meshes, false)[0];
              if (hit) out.push({ lv, i, tod, who: x.key, king: x.key === W.islands[i].seats.king, doing: (x.verb || x.state) + '@' + (x.place || '-'), kind: (() => { const k = kindOf(hit.object); if (k !== 'khối gộp') return k; // khối gộp: chiếu lại vào hình riêng (đang ẩn) của từng công trình để biết là cái nào
                const all = []; L.g.traverse((m) => { if (m.isMesh && !m.isInstancedMesh && m.material === main) all.push(m); }); for (const m of all) m.material.side = T.DoubleSide; const h2 = ray.intersectObjects(all, false).find((q) => kindOf(q.object) !== 'khối gộp'); return h2 ? kindOf(h2.object) : B.debug.pieceAt(i, x.x, x.z) || 'khối gộp'; })(), up: +(hit.point.y - feet).toFixed(2), at: [+x.x.toFixed(1), +x.z.toFixed(1)] });
            }
            for (const [mat, s] of sides) mat.side = s;
          }
        }
      }
      return out;
    }, [lv, ISLES, FRAMES, !!process.env.KING]);
    rows.push(...r);
    const by = {}; for (const x of r) { const k = 'đảo ' + x.i + ' ' + x.kind; by[k] = (by[k] || 0) + 1; }
    console.log('thời ' + lv + ': ' + r.length + ' lượt đi xuyên' + (r.length ? ' · ' + Object.entries(by).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, n]) => k + ' ×' + n).join(', ') : ''));
    for (const x of r.filter((y) => y.king).slice(0, 3)) console.log('   người đứng đầu đảo ' + x.i + ': ' + x.doing + ' trong ' + x.kind + ' (cao ' + x.up + ') tại ' + x.at);
    if (process.env.VERBOSE) for (const x of r.slice(0, 12)) console.log('   ', JSON.stringify(x));
  }
  await b.close();
  const kings = rows.filter((x) => x.king).length;
  if (errs.length) console.log('LỖI TRANG: ' + errs.slice(0, 3).join(' | '));
  console.log((rows.length || errs.length ? 'KHÔNG ĐẠT' : 'ĐẠT') + ': ' + rows.length + ' lượt người đi xuyên công trình (người đứng đầu: ' + kings + ')');
  process.exit(rows.length || errs.length ? 1 : 0);
})();
