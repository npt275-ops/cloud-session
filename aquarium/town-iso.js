/* Phương án A — Thị trấn nhìn chéo (isometric 2.5D).
 * Mỗi ngôi nhà chứa 4 hộ gia đình. Lò thực phẩm = trang trại, xưởng hàng = nhà máy,
 * ngân hàng, toà thị chính, trường học nằm quanh quảng trường. */
(function (root) {
  'use strict';
  const hash = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, k) => a + (b - a) * k;
  const mix = (c0, c1, k) => 'rgb(' + c0.map((v, i) => Math.round(lerp(v, c1[i], k))).join(',') + ')';
  const shade = (c, k) => 'rgb(' + c.map((v) => Math.round(clamp(v * k, 0, 255))).join(',') + ')';

  const N = 17, ROADS = [3, 8, 13];
  const isRoad = (x, y) => ROADS.includes(x) || ROADS.includes(y);
  const HALL = { x: 5, y: 5, w: 2, d: 2 }, BANK = { x: 9, y: 4, w: 2, d: 2 }, SCHOOL = { x: 9, y: 6, w: 2, d: 2 };
  const FARM_SLOTS = [[0, 9], [0, 11], [4, 9], [6, 9], [4, 11], [6, 11], [0, 14], [4, 14], [6, 14]];
  const FACT_SLOTS = [[9, 9], [11, 9], [9, 11], [11, 11], [14, 4], [14, 6], [14, 9], [14, 11], [9, 14], [11, 14], [14, 14]];
  const RES_ZONES = [[0, 2, 0, 2], [4, 7, 0, 2], [9, 12, 0, 2], [0, 2, 4, 7], [14, 16, 0, 2]];

  function create(canvas, opts) {
    opts = opts || {};
    const ctx = canvas.getContext('2d');
    const reduce = !!opts.reduceMotion;
    const font = opts.font || 'ui-monospace, monospace';
    let W = 0, H = 0, dpr = 1, scale = 1, ox = 0, oy = 0;
    let world = null, selected = null;
    let coins = [], smoke = [], fireworks = [];
    const fx = opts.fx || (() => ({}));
    let lens = 'normal', hover = null;
    const showLabel = (id) => lens === 'price' || (selected && selected.type === 'firm' && selected.id === id) || (hover && hover.type === 'firm' && hover.id === id) || opts.labels === 'all';

    // nhà ở
    const houses = [];
    for (const [x0, x1, y0, y1] of RES_ZONES) for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) houses.push({ x, y });
    houses.sort((a, b) => a.x + a.y - (b.x + b.y) || a.x - b.x);
    houses.length = 35;
    const houseAt = new Map(houses.map((h, i) => [h.x + ',' + h.y, i]));
    const plaza = [];
    for (let y = 4; y <= 7; y++) for (let x = 4; x <= 7; x++) if (!(x >= HALL.x && x < HALL.x + 2 && y >= HALL.y && y < HALL.y + 2)) plaza.push({ x, y });
    const used = new Set();
    const mark = (x, y, w, d) => { for (let j = 0; j < d; j++) for (let i = 0; i < w; i++) used.add(x + i + ',' + (y + j)); };
    houses.forEach((h) => mark(h.x, h.y, 1, 1));
    plaza.forEach((p) => mark(p.x, p.y, 1, 1));
    [HALL, BANK, SCHOOL].forEach((b) => mark(b.x, b.y, b.w, b.d));
    FARM_SLOTS.forEach(([x, y]) => mark(x, y, 2, 2));
    FACT_SLOTS.forEach(([x, y]) => mark(x, y, 2, 2));
    const trees = [];
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (!isRoad(x, y) && !used.has(x + ',' + y) && hash(x * 31 + y) > 0.35) trees.push({ x: x + 0.3 + hash(x + y * 7) * 0.4, y: y + 0.3 + hash(x * 3 + y) * 0.4, s: 0.8 + hash(x + y) * 0.5 });

    const iso = (x, y) => ({ x: (x - y) * 32, y: (x + y) * 16 });

    function resize() {
      const r = canvas.getBoundingClientRect();
      dpr = Math.min(2, window.devicePixelRatio || 1);
      W = r.width; H = r.height;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      scale = Math.min(W / (N * 64 + 40), H / (N * 32 + 150));
      ox = W / 2; oy = (H - N * 32 * scale) / 2 + 55 * scale;
    }

    /* ---------- vị trí kinh tế ---------- */
    function firmSlots() {
      const out = new Map();
      const vis = world.firms.filter((f) => f.alive || (f.deadSince !== null && world.day - f.deadSince < 12));
      for (const [sector, slots] of [['food', FARM_SLOTS], ['goods', FACT_SLOTS]]) {
        vis.filter((f) => f.sector === sector).sort((a, b) => a.id - b.id).forEach((f, i) => { const s = slots[i % slots.length]; out.set(f.id, { x: s[0], y: s[1], f }); });
      }
      return out;
    }
    let slots = new Map();
    const houseOf = (hid) => houses[Math.floor(hid / 4)];
    function nearestRoad(v) { let b = ROADS[0]; for (const r of ROADS) if (Math.abs(r + 0.5 - v) < Math.abs(b + 0.5 - v)) b = r; return b + 0.5; }

    function keyTile(key) {
      if (key === 'bank') return { x: BANK.x + 1, y: BANK.y + 1, h: 40 };
      if (key === 'gov') return { x: HALL.x + 1, y: HALL.y + 1, h: 50 };
      if (key[0] === 'h') { const h = houseOf(+key.slice(1)); return { x: h.x + 0.5, y: h.y + 0.5, h: 26 }; }
      const s = slots.get(+key.slice(1));
      return s ? { x: s.x + 1, y: s.y + 1, h: 34 } : null;
    }

    function onTick(w) {
      world = w;
      const fl = w.flows;
      const pick = [];
      const imp = fl.filter((f) => f.kind !== 'buy' && f.kind !== 'wage');
      for (let i = 0; i < Math.min(8, imp.length); i++) pick.push(imp[i]);
      for (let i = 0; i < 16 && fl.length; i++) pick.push(fl[Math.floor(Math.random() * fl.length)]);
      const now = performance.now();
      for (const f of pick) {
        const at = f.kind === 'buy' || f.kind === 'tax' || f.kind === 'repay' || f.kind === 'interest' ? keyTile(f.to) : keyTile(f.kind === 'loan' ? f.to : f.to);
        if (!at) continue;
        const col = f.kind === 'buy' ? '#f4c542' : f.kind === 'wage' || f.kind === 'dividend' ? '#8fe3a0' : f.kind === 'loan' || f.kind === 'interest' || f.kind === 'repay' ? '#ff7d9c' : '#c3b5ff';
        coins.push({ x: at.x + (Math.random() - 0.5) * 0.6, y: at.y + (Math.random() - 0.5) * 0.6, h: at.h, t0: now + Math.random() * 400, col });
      }
      if (coins.length > 160) coins.splice(0, coins.length - 160);
    }

    /* ---------- vẽ cơ bản ---------- */
    function poly(pts, fill, stroke) {
      ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
      ctx.closePath();
      if (fill) { ctx.fillStyle = fill; ctx.fill(); }
      if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 0.6; ctx.stroke(); }
    }
    const up = (p, h) => ({ x: p.x, y: p.y - h });
    function tile(x, y, fill, stroke) { poly([iso(x, y), iso(x + 1, y), iso(x + 1, y + 1), iso(x, y + 1)], fill, stroke); }
    function box(x, y, w, d, h, c) {
      const A = iso(x, y), B = iso(x + w, y), Cc = iso(x + w, y + d), D = iso(x, y + d);
      poly([D, Cc, up(Cc, h), up(D, h)], shade(c, 0.72));
      poly([Cc, B, up(B, h), up(Cc, h)], shade(c, 0.88));
      poly([up(A, h), up(B, h), up(Cc, h), up(D, h)], shade(c, 1.05));
      return { A, B, C: Cc, D, h };
    }
    function roof(b, rh, c) {
      const apex = { x: (b.A.x + b.C.x) / 2, y: (b.A.y + b.C.y) / 2 - b.h - rh };
      poly([up(b.D, b.h), up(b.C, b.h), apex], shade(c, 0.8));
      poly([up(b.C, b.h), up(b.B, b.h), apex], shade(c, 1));
      return apex;
    }
    // ô cửa sổ trên mặt trước-trái (u dọc cạnh D→C, v theo chiều cao)
    function winL(b, u0, u1, v0, v1, fill) {
      const p = (u, v) => ({ x: lerp(b.D.x, b.C.x, u), y: lerp(b.D.y, b.C.y, u) - v });
      poly([p(u0, v0), p(u1, v0), p(u1, v1), p(u0, v1)], fill);
    }
    function winR(b, u0, u1, v0, v1, fill) {
      const p = (u, v) => ({ x: lerp(b.C.x, b.B.x, u), y: lerp(b.C.y, b.B.y, u) - v });
      poly([p(u0, v0), p(u1, v0), p(u1, v1), p(u0, v1)], fill);
    }
    function person(x, y, shirt, t, walking) {
      const p = iso(x, y), bob = walking && !reduce ? Math.abs(Math.sin(t * 0.012 + x * 9)) * 1.2 : 0;
      ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.beginPath(); ctx.ellipse(p.x, p.y, 3, 1.4, 0, 0, 7); ctx.fill();
      ctx.fillStyle = shirt; ctx.fillRect(p.x - 1.8, p.y - 8 - bob, 3.6, 5.5);
      ctx.fillStyle = '#f1d3b3'; ctx.beginPath(); ctx.arc(p.x, p.y - 10 - bob, 1.9, 0, 7); ctx.fill();
    }
    function label(x, y, text, bg, fg) {
      ctx.font = '600 8.5px ' + font;
      const w = ctx.measureText(text).width + 8;
      ctx.fillStyle = bg; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x - w / 2, y - 7, w, 12, 3) : ctx.rect(x - w / 2, y - 7, w, 12); ctx.fill();
      ctx.fillStyle = fg; ctx.textAlign = 'center'; ctx.fillText(text, x, y + 2);
    }
    function compact(v) {
      const a = Math.abs(v);
      if (a >= 1e6) return (v / 1e6).toFixed(1).replace('.', ',') + 'tr';
      if (a >= 1e4) return (v / 1e3).toFixed(1).replace('.', ',') + 'k';
      if (a >= 100) return Math.round(v).toLocaleString('vi-VN');
      return v.toFixed(1).replace('.', ',');
    }

    /* ---------- các công trình ---------- */
    function rank(hs) {
      const sorted = world.households.map((h) => h.cash).sort((a, b) => a - b);
      return (cash) => { let lo = 0, hi = sorted.length; while (lo < hi) { const m = (lo + hi) >> 1; if (sorted[m] < cash) lo = m + 1; else hi = m; } return lo / Math.max(1, sorted.length - 1); };
    }

    function drawHouse(i, t, rk) {
      const h = houses[i], members = [0, 1, 2, 3].map((k) => world.households[i * 4 + k]).filter(Boolean);
      const wealth = members.reduce((s, m) => s + rk(m.cash), 0) / members.length;
      const hungry = members.some((m) => !m.ateToday);
      const home = members.filter((m) => m.employer === null).length;
      const wall = mix([214, 205, 190], [246, 238, 222], wealth);
      const b = box(h.x + 0.15, h.y + 0.15, 0.7, 0.7, 16 + wealth * 8, [...wall.match(/\d+/g).map(Number)]);
      const lit = 'rgba(255,214,120,0.95)', dark = 'rgba(60,70,85,0.85)';
      winL(b, 0.15, 0.4, 6, 11, home > 0 ? lit : dark); winL(b, 0.6, 0.85, 6, 11, home > 1 ? lit : dark);
      winR(b, 0.3, 0.7, 6, 11, home > 2 ? lit : dark);
      let roofCol = wealth > 0.66 ? [196, 84, 58] : wealth > 0.33 ? [168, 112, 78] : [128, 120, 112];
      if (lens === 'mood') {
        const mood = members.reduce((s, m) => s + (m.ateToday ? 0.5 : 0) + (m.employer !== null ? 0.3 : 0) + rk(m.cash) * 0.2, 0) / members.length;
        roofCol = mood > 0.75 ? [72, 170, 98] : mood > 0.5 ? [226, 190, 70] : [214, 72, 66];
      } else if (lens === 'wealth') {
        roofCol = [Math.round(lerp(110, 240, wealth)), Math.round(lerp(110, 190, wealth)), Math.round(lerp(120, 60, wealth))];
      }
      const apex = roof(b, 10, roofCol);
      if (hungry) {
        ctx.fillStyle = '#e5484d'; ctx.beginPath(); ctx.arc(apex.x, apex.y - 9, 5, 0, 7); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.font = '700 8px ' + font; ctx.textAlign = 'center'; ctx.fillText('!', apex.x, apex.y - 6);
      }
      if (selected && selected.type === 'house' && selected.i === i) outline(h.x, h.y, 1, 1, t);
    }

    function drawFarm(s, t) {
      const f = s.f, alive = f.alive;
      const ripe = clamp(f.inv / Math.max(6, f.avgSales * 2), 0, 1);
      const dry = fx().drought;
      const crop = !alive ? 'rgb(150,128,98)' : dry ? mix([176, 150, 96], [206, 178, 104], ripe) : mix([104, 168, 78], [226, 190, 84], ripe);
      for (const [dx, dy] of [[1, 0], [0, 1], [1, 1]]) {
        tile(s.x + dx, s.y + dy, crop);
        ctx.strokeStyle = 'rgba(60,80,40,0.35)'; ctx.lineWidth = 0.7;
        for (let k = 1; k < 5; k++) { const a = iso(s.x + dx + k / 5, s.y + dy), b = iso(s.x + dx + k / 5, s.y + dy + 1); ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
      }
      const b = box(s.x + 0.12, s.y + 0.12, 0.76, 0.76, 18, alive ? [181, 82, 59] : [130, 120, 112]);
      winL(b, 0.35, 0.65, 0, 10, 'rgba(70,40,30,0.8)');
      const apex = roof(b, 9, alive ? [92, 62, 52] : [90, 88, 86]);
      const n = Math.min(f.workers.length, 6);
      for (let k = 0; k < n; k++) {
        const fx = s.x + 0.3 + (k % 3) * 0.6 + (k >= 3 ? 0 : 0.4), fy = s.y + 1.2 + Math.floor(k / 3) * 0.45;
        person(fx, fy, '#3f8f5a', t, false);
      }
      if (!alive || showLabel(f.id)) label(apex.x, apex.y - 8, alive ? compact(f.price) + ' xu' : 'ĐÓNG CỬA', alive ? 'rgba(20,40,30,0.8)' : 'rgba(120,30,30,0.85)', '#fff');
      if (selected && selected.type === 'firm' && selected.id === f.id) outline(s.x, s.y, 2, 2, t);
    }

    function drawFactory(s, t) {
      const f = s.f, alive = f.alive;
      const crates = Math.min(10, Math.round(f.inv / 3));
      for (let k = 0; k < crates; k++) {
        const cx = s.x + 0.15 + (k % 5) * 0.35, cy = s.y + 1.55 + Math.floor(k / 5) * 0.0;
        box(cx, cy, 0.25, 0.25, 6 + Math.floor(k / 5) * 6, [196, 142, 88]);
      }
      const b = box(s.x + 0.1, s.y + 0.1, 1.8, 1.3, 26, alive ? [152, 166, 182] : [110, 112, 118]);
      for (let k = 0; k < 4; k++) winL(b, 0.08 + k * 0.23, 0.22 + k * 0.23, 8, 17, alive && k < f.workers.length ? 'rgba(255,214,120,0.9)' : 'rgba(50,60,72,0.85)');
      winR(b, 0.2, 0.8, 0, 13, alive ? 'rgba(70,80,96,0.9)' : 'rgba(80,60,40,0.9)');
      // sọc thương hiệu
      poly([up(b.D, 24), up(b.C, 24), up(b.C, 26), up(b.D, 26)], alive ? '#e07a4f' : '#7a6f69');
      const ch = box(s.x + 0.25, s.y + 0.2, 0.25, 0.25, 52, alive ? [120, 100, 96] : [96, 94, 92]);
      const top = up(iso(s.x + 0.375, s.y + 0.325), 52);
      const striking = fx().strike && alive;
      if (striking) {
        for (let k = 0; k < 4; k++) {
          const px = s.x + 0.3 + k * 0.4, py = s.y + 2.05;
          person(px, py, '#d9733f', t, false);
          const p = iso(px, py), bob = reduce ? 0 : Math.sin(t * 0.01 + k) * 1.5;
          ctx.strokeStyle = '#6b4b32'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(p.x + 2, p.y - 8); ctx.lineTo(p.x + 2, p.y - 20 - bob); ctx.stroke();
          ctx.fillStyle = '#fff'; ctx.fillRect(p.x - 4, p.y - 27 - bob, 12, 7); ctx.fillStyle = '#c0392b'; ctx.fillRect(p.x - 3, p.y - 25 - bob, 10, 1.5); ctx.fillRect(p.x - 3, p.y - 22.5 - bob, 7, 1.5);
        }
      }
      if (alive && !striking && f.workers.length && !reduce && Math.random() < 0.08) smoke.push({ x: top.x, y: top.y, t0: performance.now(), r: 3 });
      const mid = up(iso(s.x + 1, s.y + 0.75), 40);
      if (striking) label(mid.x, mid.y, 'ĐÌNH CÔNG', 'rgba(192,57,43,0.92)', '#fff');
      else if (!alive || showLabel(f.id)) label(mid.x, mid.y, alive ? compact(f.price) + ' xu' : 'ĐÓNG CỬA', alive ? 'rgba(60,30,20,0.8)' : 'rgba(120,30,30,0.85)', '#fff');
      if (selected && selected.type === 'firm' && selected.id === f.id) outline(s.x, s.y, 2, 2, t);
    }

    function drawHall(t) {
      const b = box(HALL.x + 0.1, HALL.y + 0.1, 1.8, 1.8, 34, [226, 220, 206]);
      for (let k = 0; k < 6; k++) winL(b, 0.1 + k * 0.14, 0.15 + k * 0.14, 0, 30, 'rgba(180,170,150,0.9)');
      for (let k = 0; k < 3; k++) winR(b, 0.15 + k * 0.27, 0.3 + k * 0.27, 12, 24, 'rgba(90,110,130,0.9)');
      const apex = roof(b, 18, [62, 110, 120]);
      ctx.strokeStyle = '#444'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(apex.x, apex.y); ctx.lineTo(apex.x, apex.y - 16); ctx.stroke();
      const wave = reduce ? 0 : Math.sin(t * 0.005) * 1.5;
      poly([{ x: apex.x, y: apex.y - 16 }, { x: apex.x + 10, y: apex.y - 13 + wave }, { x: apex.x, y: apex.y - 10 }], '#d64545');
      if (fx().festival) {
        // dây đèn lồng quanh quảng trường
        const ring = [iso(4.1, 4.1), iso(7.9, 4.1), iso(7.9, 7.9), iso(4.1, 7.9), iso(4.1, 4.1)];
        for (let k = 0; k < 4; k++) {
          const a = up(ring[k], 18), b = up(ring[k + 1], 18);
          ctx.strokeStyle = 'rgba(90,40,30,0.6)'; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.quadraticCurveTo((a.x + b.x) / 2, (a.y + b.y) / 2 + 8, b.x, b.y); ctx.stroke();
          for (let j = 1; j < 8; j++) {
            const u = j / 8, x = lerp(a.x, b.x, u), y = lerp(a.y, b.y, u) + Math.sin(u * Math.PI) * 4;
            ctx.fillStyle = j % 2 ? '#e0352b' : '#f2b233'; ctx.beginPath(); ctx.ellipse(x, y + 3, 2.2, 2.8, 0, 0, 7); ctx.fill();
          }
        }
      }
      label(apex.x, apex.y - 24, 'TOÀ THỊ CHÍNH', 'rgba(235,240,240,0.92)', '#183038');
      if (selected && selected.type === 'gov') outline(HALL.x, HALL.y, 2, 2, t);
    }
    function drawBank(t) {
      const b = box(BANK.x + 0.1, BANK.y + 0.1, 1.8, 1.8, 30, [236, 236, 240]);
      for (let k = 0; k < 5; k++) winL(b, 0.1 + k * 0.18, 0.16 + k * 0.18, 0, 24, 'rgba(200,200,210,1)');
      poly([up(b.D, 26), up(b.C, 26), up(b.C, 30), up(b.D, 30)], '#d9a92b');
      const top = up(iso(BANK.x + 1, BANK.y + 1), 30);
      ctx.fillStyle = '#e8b931'; ctx.beginPath(); ctx.ellipse(top.x, top.y - 2, 9, 4.5, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#c9971c'; ctx.fillRect(top.x - 9, top.y - 6, 18, 4); ctx.beginPath(); ctx.ellipse(top.x, top.y - 6, 9, 4.5, 0, 0, 7); ctx.fillStyle = '#f2cd52'; ctx.fill();
      label(top.x, top.y - 18, 'NGÂN HÀNG', 'rgba(235,240,240,0.92)', '#183038');
      if (selected && selected.type === 'bank') outline(BANK.x, BANK.y, 2, 2, t);
    }
    function drawSchool(t) {
      const b = box(SCHOOL.x + 0.1, SCHOOL.y + 0.1, 1.8, 1.4, 22, [232, 194, 90]);
      for (let k = 0; k < 5; k++) winL(b, 0.08 + k * 0.18, 0.18 + k * 0.18, 8, 16, 'rgba(110,150,190,0.9)');
      roof(b, 12, [176, 70, 52]);
      for (let k = 0; k < 6; k++) person(SCHOOL.x + 0.3 + k * 0.28, SCHOOL.y + 1.75, ['#4d7cc9', '#e06c75', '#56b6c2'][k % 3], t, false);
      const p = up(iso(SCHOOL.x + 1, SCHOOL.y + 0.8), 46);
      label(p.x, p.y, 'TRƯỜNG HỌC', 'rgba(235,240,240,0.92)', '#183038');
    }
    function drawTree(tr) {
      const p = iso(tr.x, tr.y);
      ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(p.x, p.y, 7 * tr.s, 3 * tr.s, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#6b4b32'; ctx.fillRect(p.x - 1, p.y - 8 * tr.s, 2, 8 * tr.s);
      ctx.fillStyle = '#3f8a4a'; ctx.beginPath(); ctx.arc(p.x, p.y - 12 * tr.s, 6.5 * tr.s, 0, 7); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.beginPath(); ctx.arc(p.x - 2 * tr.s, p.y - 14 * tr.s, 3 * tr.s, 0, 7); ctx.fill();
    }
    function outline(x, y, w, d, t) {
      const a = 0.5 + 0.5 * Math.sin(t * 0.006);
      poly([iso(x, y), iso(x + w, y), iso(x + w, y + d), iso(x, y + d)], null, 'rgba(255,240,150,' + (0.5 + a * 0.5) + ')');
      ctx.lineWidth = 2; ctx.stroke(); ctx.lineWidth = 1;
    }

    /* ---------- người đi lại ---------- */
    function walkers(t) {
      const out = [];
      for (const h of world.households) {
        const home = houseOf(h.id);
        if (h.employer === null) {
          const p = plaza[Math.floor(hash(h.id) * plaza.length)];
          const jx = reduce ? 0 : Math.sin(t * 0.0008 + h.id) * 0.2;
          out.push({ x: p.x + 0.3 + hash(h.id + 1) * 0.4 + jx, y: p.y + 0.3 + hash(h.id + 2) * 0.4, shirt: '#9aa3ad', walking: false });
          continue;
        }
        const s = slots.get(h.employer);
        if (!s) continue;
        const ph = ((t / 7000) + hash(h.id + 11)) % 1;
        let u;
        if (ph < 0.3) u = ph / 0.3; else if (ph < 0.5) continue; else if (ph < 0.8) u = 1 - (ph - 0.5) / 0.3; else continue;
        const A = { x: home.x + 0.5, y: home.y + 0.5 };
        const ry = nearestRoad(A.y);
        const Dp = { x: s.x + 1, y: s.y + 1 };
        const pts = [A, { x: A.x, y: ry }, { x: Dp.x, y: ry }, Dp];
        const lens = [0]; for (let i = 1; i < pts.length; i++) lens.push(lens[i - 1] + Math.abs(pts[i].x - pts[i - 1].x) + Math.abs(pts[i].y - pts[i - 1].y));
        const L = lens[lens.length - 1] * u;
        let k = 1; while (k < lens.length - 1 && lens[k] < L) k++;
        const seg = (L - lens[k - 1]) / Math.max(1e-6, lens[k] - lens[k - 1]);
        out.push({ x: lerp(pts[k - 1].x, pts[k].x, seg) + 0.12, y: lerp(pts[k - 1].y, pts[k].y, seg) + 0.12, shirt: s.f.sector === 'food' ? '#3f8f5a' : '#d9733f', walking: true });
      }
      return out;
    }

    function draw(t) {
      if (!world) return;
      slots = firmSlots();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const sky = ctx.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, '#bfe3ea'); sky.addColorStop(1, '#e8f1e6');
      ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
      ctx.setTransform(dpr * scale, 0, 0, dpr * scale, dpr * ox, dpr * oy);
      // nền đất (khối đế)
      const base = [iso(0, 0), iso(N, 0), iso(N, N), iso(0, N)];
      poly([base[3], base[2], up(base[2], -14), up(base[3], -14)], '#7a5c43');
      poly([base[2], base[1], up(base[1], -14), up(base[2], -14)], '#93714f');
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
        if (isRoad(x, y)) tile(x, y, '#727a84', 'rgba(255,255,255,0.05)');
        else if (plaza.some((p) => p.x === x && p.y === y)) tile(x, y, (x + y) % 2 ? '#ddd3c2' : '#d3c8b5');
        else tile(x, y, (x * 7 + y * 3) % 5 ? '#8cc06b' : '#86b866', 'rgba(0,0,0,0.04)');
      }
      // vạch kẻ đường
      ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.setLineDash([4, 5]); ctx.lineWidth = 0.8;
      for (const r of ROADS) {
        let a = iso(0, r + 0.5), b = iso(N, r + 0.5); ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        a = iso(r + 0.5, 0); b = iso(r + 0.5, N); ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }
      ctx.setLineDash([]);

      const rk = rank();
      const items = [];
      houses.forEach((h, i) => items.push({ d: h.x + h.y + 1, f: () => drawHouse(i, t, rk) }));
      for (const [, s] of slots) items.push({ d: s.x + s.y + 3, f: () => (s.f.sector === 'food' ? drawFarm(s, t) : drawFactory(s, t)) });
      items.push({ d: HALL.x + HALL.y + 3, f: () => drawHall(t) });
      items.push({ d: BANK.x + BANK.y + 3, f: () => drawBank(t) });
      items.push({ d: SCHOOL.x + SCHOOL.y + 3, f: () => drawSchool(t) });
      for (const tr of trees) items.push({ d: tr.x + tr.y, f: () => drawTree(tr) });
      for (const p of walkers(t)) items.push({ d: p.x + p.y, f: () => person(p.x, p.y, p.shirt, t, p.walking) });
      items.sort((a, b) => a.d - b.d);
      for (const it of items) it.f();

      // khói
      const now = performance.now();
      smoke = smoke.filter((s) => now - s.t0 < 2500);
      for (const s of smoke) {
        const k = (now - s.t0) / 2500;
        ctx.fillStyle = 'rgba(235,235,235,' + (0.5 * (1 - k)) + ')';
        ctx.beginPath(); ctx.arc(s.x + k * 10, s.y - k * 30, s.r + k * 7, 0, 7); ctx.fill();
      }
      // đồng xu
      coins = coins.filter((c) => now - c.t0 < 1300);
      for (const c of coins) {
        const k = (now - c.t0) / 1300;
        if (k < 0) continue;
        const p = up(iso(c.x, c.y), c.h + k * 22);
        ctx.globalAlpha = k < 0.15 ? k / 0.15 : 1 - Math.max(0, (k - 0.6) / 0.4);
        ctx.fillStyle = c.col; ctx.beginPath(); ctx.ellipse(p.x, p.y, 3.4 * Math.abs(Math.cos(k * 8)) + 0.8, 3.4, 0, 0, 7); ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 0.6; ctx.stroke();
      }
      ctx.globalAlpha = 1;
      if (fx().festival && !reduce) {
        if (Math.random() < 0.04) {
          const c = iso(4 + Math.random() * 4, 4 + Math.random() * 4);
          const hue = ['#ff5a5a', '#ffd166', '#7bdff2', '#c3a6ff', '#9be564'][Math.floor(Math.random() * 5)];
          fireworks.push({ x: c.x, y: c.y - 120 - Math.random() * 60, t0: now, col: hue });
        }
        fireworks = fireworks.filter((f) => now - f.t0 < 1400);
        for (const f of fireworks) {
          const k = (now - f.t0) / 1400;
          ctx.globalAlpha = 1 - k; ctx.fillStyle = f.col;
          for (let j = 0; j < 14; j++) { const a = (j / 14) * Math.PI * 2, r = 4 + k * 26; ctx.beginPath(); ctx.arc(f.x + Math.cos(a) * r, f.y + Math.sin(a) * r + k * k * 10, 1.4, 0, 7); ctx.fill(); }
        }
        ctx.globalAlpha = 1;
      }
      if (fx().drought) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        const g = ctx.createRadialGradient(W * 0.85, 0, 10, W * 0.85, 0, W * 0.9);
        g.addColorStop(0, 'rgba(255,190,90,0.32)'); g.addColorStop(1, 'rgba(255,190,90,0.06)');
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      }
    }

    function screenOf(sel) {
      let tx, ty, h;
      if (sel.type === 'house') { const hs = houses[sel.i]; tx = hs.x + 0.5; ty = hs.y + 0.5; h = 34; }
      else if (sel.type === 'firm') { const s = slots.get(sel.id); if (!s) return null; tx = s.x + 1; ty = s.y + 1; h = 46; }
      else if (sel.type === 'bank') { tx = BANK.x + 1; ty = BANK.y + 1; h = 50; }
      else if (sel.type === 'gov') { tx = HALL.x + 1; ty = HALL.y + 1; h = 64; }
      else return null;
      const p = iso(tx, ty);
      return { x: ox + p.x * scale, y: oy + (p.y - h) * scale };
    }

    /* ---------- bấm chọn ---------- */
    function pick(px, py) {
      if (!world) return null;
      const lx = (px - ox) / scale, ly = (py - oy) / scale;
      // thử từ mặt đất lên cao để bắt được cả mái nhà
      for (let lift = 0; lift <= 40; lift += 8) {
        const yy = ly + lift;
        const gx = Math.floor((lx / 32 + yy / 16) / 2), gy = Math.floor((yy / 16 - lx / 32) / 2);
        const hi = houseAt.get(gx + ',' + gy);
        if (hi !== undefined) return { type: 'house', i: hi };
        for (const [, s] of slots) if (gx >= s.x && gx < s.x + 2 && gy >= s.y && gy < s.y + 2) return { type: 'firm', id: s.f.id };
        if (gx >= HALL.x && gx < HALL.x + 2 && gy >= HALL.y && gy < HALL.y + 2) return { type: 'gov' };
        if (gx >= BANK.x && gx < BANK.x + 2 && gy >= BANK.y && gy < BANK.y + 2) return { type: 'bank' };
      }
      return null;
    }
    function select(sel) { selected = sel; }
    function setWorld(w) { world = w; coins = []; smoke = []; slots = firmSlots(); }

    return { resize, draw, onTick, pick, select, setWorld, screenOf, setLens: (l) => { lens = l; }, setHover: (h) => { hover = h; }, get selected() { return selected; } };
  }
  root.TownIso = { create };
})(typeof self !== 'undefined' ? self : this);
