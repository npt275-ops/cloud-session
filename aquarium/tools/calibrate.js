// Bể Kính · tools/calibrate.js · Cân chỉnh bằng nhiều trận (design/ke-hoach-khac-phuc.md mục 1.2)
// Chạy N trận chín năm (hạt giống 1..N) song song trên nhiều tiến trình, tính các chỉ số, so với mục tiêu trong
// tools/targets.json và in ĐẠT / KHÔNG ĐẠT. Ví dụ (trong thư mục aquarium):
//   node tools/calibrate.js 100          100 trận, 4 tiến trình
//   node tools/calibrate.js 40 8         40 trận, 8 tiến trình
//   OUT=/tmp/r.jsonl node tools/calibrate.js 100   ghi thêm từng trận ra tệp
// Trả mã thoát 1 nếu có chỉ số không đạt. Chỉ đọc logic (logic/*.js), không vẽ gì.
'use strict';
const path = require('path'),
  fs = require('fs'),
  { spawn } = require('child_process');
const ROOT = path.join(__dirname, '..');
const FILES = [
  'rng',
  'rules',
  'genes',
  'people',
  'family',
  'council',
  'temper',
  'posts',
  'jobs',
  'eras',
  'schedule',
  'scenes',
  'leader',
  'guards',
  'tasks',
  'dramas',
  'economy',
  'climate',
  'epigen',
  'construction',
  'homes',
  'siege',
  'arms',
  'missiles',
  'ecology',
  'brain',
  'island',
  'diplomacy',
  'war',
  'battles',
  'chronicle',
  'prosperity',
  'strategy',
  'powers',
  'goals',
  'world',
];
const DAYS = 3240,
  Y7 = 2520,
  Y8 = 2880;

// ---------- Tiến trình con: chạy các trận từ hạt giống a tới b - 1, mỗi trận in một dòng JSON ----------
function worker(a, b) {
  for (const f of FILES) require(path.join(ROOT, 'logic', f + '.js'));
  const BK = globalThis.BK;
  for (let seed = a; seed < b; seed++) {
    const W = BK.World.create({ seed }),
      snap = {};
    for (const d of [Y7, Y8, DAYS]) {
      BK.World.jump(W, d);
      snap[d] = W.islands.map((S) => ({ lv: S.level, free: S.annexedBy == null })); // S.level: thời thật của từng đảo (đảo bị chiếm lên dần, logic/war.js syncEra)
    }
    const dead = (c) => W.islands.reduce((s, S) => s + [...S.people.values()].filter((p) => p.cause === c).length, 0);
    console.log(
      JSON.stringify({
        seed,
        snap,
        wars: W.warCount,
        ws: W.warStats,
        annex: W.annexations,
        starve: dead('đói'),
        war: dead('chiến tranh'),
        missile: dead('tên lửa') + dead('hạt nhân'),
        arms: W.armStats || {},
        bs: W.battleStats || {},
        ps: W.prosStats || {},
        big: (W.chronicle || []).filter((c) => c.w >= 3).map((c) => c.day),
        loss: W.cityLoss || [],
        pop: W.islands.map((S) => BK.Island.living(S).length),
        bridge: W.bridgeStats || {},
      }),
    );
  }
}

// ---------- Chỉ số ----------
function metrics(rows) {
  const N = rows.length,
    avg = (f) => rows.reduce((s, r) => s + f(r), 0) / N,
    pct = (f) => (100 * rows.filter(f).length) / N;
  const end = (r) => r.snap[DAYS],
    free = (r) => end(r).filter((x) => x.free);
  const lull = (r) => {
    const d = [0, ...r.big.slice().sort((x, y) => x - y), DAYS];
    let m = 0;
    for (let k = 1; k < d.length; k++) m = Math.max(m, d[k] - d[k - 1]);
    return m;
  };
  const losses = rows.flatMap((r) => r.loss),
    later = losses.filter((c) => c.pop1 != null && c.popAt > 0);
  return {
    wars: avg((r) => r.wars),
    nukeMatches: pct((r) => (r.arms.nukes || 0) > 0),
    champions: pct((r) => free(r).length >= 1 && free(r).length <= 2),
    year8top: pct((r) => r.snap[Y8].filter((x) => x.lv >= 11).length >= 2),
    lull: avg(lull),
    starve: avg((r) => r.starve),
    stuck: pct((r) => free(r).some((x) => x.lv < 6)),
    ambush: avg((r) => r.bs.ambush || 0),
    rescue: avg((r) => r.bs.rescue || 0),
    traitor: avg((r) => r.bs.traitor || 0),
    surrender: avg((r) => r.ws.surrender || 0),
    civShare: losses.length ? (100 * losses.reduce((s, c) => s + c.civ / Math.max(1, c.pop0), 0)) / losses.length : 0,
    bridgesDone: avg((r) => r.bridge.done || 0),
    bridgeRebuild: avg((r) => r.bridge.rebuild || 0),
    visits: avg((r) => r.bridge.visits || 0),
    vassalPop: later.length ? (100 * later.reduce((s, c) => s + c.pop1 / c.popAt, 0)) / later.length : 100,
    // (tham khảo, không có mục tiêu)
    annex: avg((r) => r.annex),
    warDead: avg((r) => r.war),
    missileDead: avg((r) => r.missile),
    revolt: avg((r) => r.ws.revolt || 0),
    levelAll: avg((r) => end(r).reduce((s, x) => s + x.lv, 0) / 6),
    levelFree: avg((r) => free(r).reduce((s, x) => s + x.lv, 0) / Math.max(1, free(r).length)),
    year7top: pct((r) => r.snap[Y7].filter((x) => x.lv >= 11).length >= 2),
    freeEnd: rows.reduce((o, r) => {
      const k = free(r).length;
      o[k] = (o[k] || 0) + 1;
      return o;
    }, {}),
    scenes: Object.fromEntries(
      ['naval', 'duel', 'blockade', 'night', 'desert', 'prisoners', 'triumph'].map((k) => [k, +avg((r) => r.bs[k] || 0).toFixed(2)]),
    ),
  };
}

function report(rows) {
  const T = JSON.parse(fs.readFileSync(path.join(__dirname, 'targets.json'), 'utf8')),
    M = metrics(rows);
  let bad = 0;
  console.log(rows.length + ' trận (hạt giống ' + Math.min(...rows.map((r) => r.seed)) + '–' + Math.max(...rows.map((r) => r.seed)) + ')');
  for (const [k, t] of Object.entries(T)) {
    if (k.startsWith('_')) continue;
    const v = M[k],
      ok = (t.min == null || v >= t.min) && (t.max == null || v <= t.max);
    if (!ok) bad++;
    const range = (t.min != null ? t.min : '') + '–' + (t.max != null ? t.max : '');
    console.log((ok ? 'ĐẠT       ' : 'KHÔNG ĐẠT ') + t.name.padEnd(44) + String(+v.toFixed(2)).padStart(8) + '   mục tiêu ' + range);
  }
  console.log(
    'tham khảo: sáp nhập ' +
      M.annex.toFixed(2) +
      ' · chết trận ' +
      M.warDead.toFixed(0) +
      ' · chết vì tên lửa, hạt nhân ' +
      M.missileDead.toFixed(1) +
      ' · nổi dậy ' +
      M.revolt.toFixed(2) +
      ' · thời tb (cả bể) ' +
      M.levelAll.toFixed(2) +
      ' · thời tb (đảo độc lập) ' +
      M.levelFree.toFixed(2) +
      ' · năm 7 có ≥ 2 đảo từ thời 11 ' +
      M.year7top.toFixed(0) +
      '% · số đảo độc lập cuối trận ' +
      JSON.stringify(M.freeEnd) +
      ' · cảnh ' +
      JSON.stringify(M.scenes),
  );
  return bad;
}

if (process.argv[2] === '--worker') worker(+process.argv[3], +process.argv[4]);
else if (process.argv[2] === '--report')
  process.exit(
    report(
      fs
        .readFileSync(process.argv[3], 'utf8')
        .trim()
        .split('\n')
        .map((l) => JSON.parse(l)),
    )
      ? 1
      : 0,
  );
else {
  const N = +(process.argv[2] || 100),
    P = +(process.argv[3] || 4),
    rows = [];
  let left = P;
  const per = Math.ceil(N / P);
  for (let k = 0; k < P; k++) {
    const a = 1 + k * per,
      b = Math.min(N + 1, a + per);
    if (a >= b) {
      left--;
      continue;
    }
    const ch = spawn(process.execPath, [__filename, '--worker', String(a), String(b)]);
    let buf = '';
    ch.stdout.on('data', (d) => {
      buf += d;
      let i;
      while ((i = buf.indexOf('\n')) >= 0) {
        const l = buf.slice(0, i);
        buf = buf.slice(i + 1);
        if (l.startsWith('{')) rows.push(JSON.parse(l));
      }
    });
    ch.stderr.on('data', (d) => process.stderr.write(d));
    ch.on('close', () => {
      if (--left) return;
      if (process.env.OUT) fs.writeFileSync(process.env.OUT, rows.map((r) => JSON.stringify(r)).join('\n') + '\n');
      process.exit(report(rows) ? 1 : 0);
    });
  }
}
