// Bể Kính · tools/check-buildings.js · Rà soát công trình: 6 đảo × 12 thời (design/ke-hoach-buoc-29.md)
// Mở trang thật, đặt cả sáu đảo vào từng thời, dựng hết công trình rồi đo từng món đang hiện:
//   chồng nhau          thân sát đất (cao 0,7–3 trên mặt đất) của hai công trình đè lên nhau quá 20% món nhỏ hơn (đo theo
//                       từng tam giác, ô 0,5); không tính lớp đường, cổng, tường, bãi làm việc, công trình ngoài khơi
//   lấn đường/hồ        móng thật lấn mặt đường hay lỗ hồ (render/buildings3d.js debug.roadCheck)
//   thò ngoài đảo       móng công trình trong làng thò ra ngoài mép đảo (offIsland); còn trong đảo nhưng cách mép dưới 1,5
//                       thì là 'sát mép đảo' (chỉ in để biết)
//   kẹt đường, bỏ       không tìm được chỗ tránh đường; không có chỗ trên đảo nên không dựng (chỉ in để biết)
//   không có hình, toạ độ hỏng, lỗi trang
// Mã thoát 1 nếu: có lỗi trang, toạ độ hỏng, món không có hình, thò ngoài đảo, hay chồng nhau quá MAX_OVER (mặc định 5).
//   node tools/check-buildings.js        SHOW=40 in nhiều ví dụ hơn
'use strict';
const path = require('path'),
  fs = require('fs');
const ROOT = path.join(__dirname, '..'),
  MAX_OVER = +(process.env.MAX_OVER || 5);
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
  p.on('console', (m) => {
    if (m.type() === 'error') errs.push('console: ' + m.text().slice(0, 200));
  });
  p.setDefaultTimeout(1800000);
  await p.goto('file://' + path.join(ROOT, 'index.html'));
  await p.waitForTimeout(3000);
  const rows = await p.evaluate(() => {
    const G = __glass.G,
      B = __glass.buildings,
      out = [];
    G.time.tps = 0;
    const v = new THREE.Vector3(),
      inv = new THREE.Matrix4();
    for (let lv = 1; lv <= 12; lv++) {
      G.goEra(lv);
      for (const S of G.world.islands) S.wonder = { era: lv, progress: 0.5, from: G.world.day };
      G.citiesRun.animate && G.citiesRun.animate(16, performance.now());
      B.flush();
      for (let i = 0; i < 6; i++) {
        const L = G.lands[i],
          st = B.stats(i);
        if (st.stuck) out.push({ lv, i, t: 'kẹt đường', n: st.stuck });
        if (st.dropped) out.push({ lv, i, t: 'bỏ vì không có chỗ', n: st.dropped });
        for (const r of B.debug.roadCheck(i) || []) out.push({ lv, i, t: 'lấn đường/hồ', k: r.kind, at: [r.x, r.z] });
        for (const r of B.offIsland(i))
          out.push({ lv, i, t: +(/thò ([\d.]+)/.exec(r) || [0, 9])[1] > 1.5 ? 'thò ngoài đảo' : 'sát mép đảo', k: r });
        L.g.updateMatrixWorld(true);
        inv.copy(L.g.matrixWorld).invert();
        const items = [],
          va = new THREE.Vector3(),
          vb = new THREE.Vector3(),
          vc = new THREE.Vector3(),
          CELL = 0.5;
        L.g.traverse((g) => {
          if (!g.userData.kind || !g.isGroup) return;
          let o = g,
            vis = true;
          while (o && o !== L.g) {
            if (!o.visible) vis = false;
            o = o.parent;
          }
          if (!vis) return;
          const kind = g.userData.kind;
          if (/^bãi|town|gate|wall|yard/.test(kind)) return;
          if (Math.hypot(g.position.x, g.position.z) > L.rOf(Math.atan2(g.position.z, g.position.x))) return;
          const cells = new Set();
          g.traverse((m) => {
            if (!m.isMesh || !m.visible || !m.geometry.attributes.position) return;
            const A = m.geometry.attributes.position,
              I = m.geometry.index,
              n = I ? I.count : A.count;
            const M = new THREE.Matrix4().multiplyMatrices(inv, m.matrixWorld);
            for (let j = 0; j < n; j += 3) {
              const P = [va, vb, vc].map((q, k) => q.fromBufferAttribute(A, I ? I.getX(j + k) : j + k).applyMatrix4(M));
              const ups = P.map((q) => q.y - L.surfAt(q.x, q.z));
              if (Math.max(...ups) < 0.7 || Math.min(...ups) > 3) continue; // thân sát đất: không tính mặt nền phẳng, phần trên cao
              const x0 = Math.floor(Math.min(va.x, vb.x, vc.x) / CELL),
                x1 = Math.floor(Math.max(va.x, vb.x, vc.x) / CELL),
                z0 = Math.floor(Math.min(va.z, vb.z, vc.z) / CELL),
                z1 = Math.floor(Math.max(va.z, vb.z, vc.z) / CELL);
              if ((x1 - x0) * (z1 - z0) > 6000) continue;
              const d = (vb.z - vc.z) * (va.x - vc.x) + (vc.x - vb.x) * (va.z - vc.z);
              for (let cx = x0; cx <= x1; cx++)
                for (let cz = z0; cz <= z1; cz++) {
                  if (Math.abs(d) > 1e-9) {
                    const px = (cx + 0.5) * CELL,
                      pz = (cz + 0.5) * CELL,
                      l1 = ((vb.z - vc.z) * (px - vc.x) + (vc.x - vb.x) * (pz - vc.z)) / d,
                      l2 = ((vc.z - va.z) * (px - vc.x) + (va.x - vc.x) * (pz - vc.z)) / d;
                    if (l1 < -0.05 || l2 < -0.05 || 1 - l1 - l2 < -0.05) continue;
                  } else if (cx !== x0 && cz !== z0) continue;
                  cells.add(cx * 4096 + cz);
                }
            }
          });
          if (cells.size > 3) items.push({ kind, cells, pos: [g.position.x, g.position.z].map((q) => +q.toFixed(0)) });
        });
        for (let a = 0; a < items.length; a++)
          for (let c = a + 1; c < items.length; c++) {
            const A = items[a].cells.size <= items[c].cells.size ? items[a] : items[c],
              C = A === items[a] ? items[c] : items[a];
            let sh = 0;
            for (const q of A.cells) if (C.cells.has(q)) sh++;
            if (sh >= 6 && sh / A.cells.size > 0.2)
              out.push({ lv, i, t: 'chồng nhau', k: A.kind + ' trong ' + C.kind, n: +(sh / A.cells.size).toFixed(2), at: A.pos });
          }
      }
      for (const S of G.world.islands) S.wonder = null;
    }
    return out;
  });
  await b.close();
  const by = {};
  for (const r of rows) (by[r.t] || (by[r.t] = [])).push(r);
  const n = (t) => (by[t] || []).length,
    INFO = new Set(['sát mép đảo', 'kẹt đường', 'bỏ vì không có chỗ', 'lấn đường/hồ']);
  for (const t of Object.keys(by)) {
    console.log((INFO.has(t) ? 'BIẾT ' : '') + t + ': ' + by[t].length);
    const kinds = {};
    for (const r of by[t])
      (kinds[r.k || ''] || (kinds[r.k || ''] = [])).push(
        't' + r.lv + 'đ' + r.i + (r.n != null ? '=' + r.n : '') + (r.at ? '@' + r.at : ''),
      );
    for (const k of Object.keys(kinds)
      .sort((x, y) => kinds[y].length - kinds[x].length)
      .slice(0, +(process.env.SHOW || 12)))
      console.log('   ' + k + ' ×' + kinds[k].length + ': ' + kinds[k].slice(0, 6).join(' '));
  }
  const bad = errs.length + n('toạ độ hỏng') + n('không có hình') + n('thò ngoài đảo') + (n('chồng nhau') > MAX_OVER ? n('chồng nhau') : 0);
  if (errs.length) console.log('LỖI TRANG: ' + errs.slice(0, 3).join(' | '));
  console.log(
    bad ? 'KHÔNG ĐẠT: ' + bad : 'ĐẠT: công trình 6 đảo × 12 thời không lỗi (chồng nhau ' + n('chồng nhau') + ' ≤ ' + MAX_OVER + ')',
  );
  process.exit(bad ? 1 : 0);
})();
