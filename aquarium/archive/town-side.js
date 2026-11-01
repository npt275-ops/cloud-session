/* Phương án B — Lát cắt đường phố (2D nhìn ngang).
 * Thấy được bên trong từng căn hộ, sạp chợ, xưởng, và kho tiền dưới lòng đất.
 * 140 hộ = 3 chung cư × 6 tầng × 8 căn. Kéo ngang để di chuyển. */
(function (root) {
  'use strict';
  const hash = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, k) => a + (b - a) * k;
  const mix = (c0, c1, k) => 'rgb(' + c0.map((v, i) => Math.round(lerp(v, c1[i], k))).join(',') + ')';

  const WW = 1760, WH = 760, G = 540;
  const APTS = [{ x: 20 }, { x: 225 }, { x: 430 }], AW = 190, ROOM_W = 22, ROOM_H = 30, FLOORS = 6, COLS = 8;
  const SCHOOL = { x: 640, w: 170, h: 110 };
  const MARKET = { x: 830, w: 290, h: 96 };
  const BANK = { x: 1140, w: 150, h: 170 };
  const HALL = { x: 1310, w: 170, h: 190 };
  const FACT = { x: 1500, w: 250, h: 120 };

  function create(canvas, opts) {
    opts = opts || {};
    const ctx = canvas.getContext('2d');
    const reduce = !!opts.reduceMotion;
    const font = opts.font || 'ui-monospace, monospace';
    let W = 0, H = 0, dpr = 1, scale = 1, camX = 0, maxCam = 0;
    let world = null, selected = null, coins = [], smoke = [];
    const cars = [{ x: 100, v: 0.9, c: '#d8573f', lane: 0 }, { x: 900, v: 1.3, c: '#3f7fd8', lane: 1 }, { x: 1500, v: 0.7, c: '#e2b33c', lane: 0 }];
    const clouds = Array.from({ length: 7 }, (_, i) => ({ x: hash(i) * WW, y: 40 + hash(i + 5) * 140, s: 0.6 + hash(i + 9) * 0.8 }));

    function resize() {
      const r = canvas.getBoundingClientRect();
      dpr = Math.min(2, window.devicePixelRatio || 1);
      W = r.width; H = r.height;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      scale = Math.max(W / 1350, H / WH);
      maxCam = Math.max(0, WW - W / scale);
      if (camX === 0 && maxCam > 0) camX = Math.min(maxCam, 380);
      camX = clamp(camX, 0, maxCam);
    }
    function pan(dx) { camX = clamp(camX - dx / scale, 0, maxCam); }

    /* ---------- toạ độ ---------- */
    function roomOf(hid) {
      const b = Math.floor(hid / 48), r = hid % 48, f = Math.floor(r / COLS), c = r % COLS;
      const ap = APTS[b];
      return { x: ap.x + 7 + c * ROOM_W, y: G - 10 - (f + 1) * ROOM_H, w: ROOM_W, h: ROOM_H };
    }
    function visibleFirms(sector) {
      return world.firms.filter((f) => f.sector === sector && (f.alive || (f.deadSince !== null && world.day - f.deadSince < 12))).sort((a, b) => a.id - b.id);
    }
    function firmRect(f) {
      if (f.sector === 'food') {
        const list = visibleFirms('food'), i = list.indexOf(f), n = Math.max(6, list.length), w = (MARKET.w - 20) / n;
        return { x: MARKET.x + 10 + i * w, y: G - 70, w, h: 70 };
      }
      const list = visibleFirms('goods'), i = list.indexOf(f), n = Math.max(7, list.length), w = FACT.w / n;
      return { x: FACT.x + i * w, y: G - FACT.h, w, h: FACT.h };
    }
    function keyPoint(key) {
      if (key === 'bank') return { x: BANK.x + BANK.w / 2, y: G - BANK.h + 20 };
      if (key === 'gov') return { x: HALL.x + HALL.w / 2, y: G - HALL.h + 10 };
      if (key[0] === 'h') { const r = roomOf(+key.slice(1)); return { x: r.x + r.w / 2, y: r.y + r.h / 2 }; }
      const f = world.firms.find((x) => 'f' + x.id === key);
      if (!f) return null;
      const r = firmRect(f);
      return { x: r.x + r.w / 2, y: r.y + 10 };
    }

    function onTick(w) {
      world = w;
      const fl = w.flows, pick = [];
      const imp = fl.filter((f) => f.kind !== 'buy' && f.kind !== 'wage');
      for (let i = 0; i < Math.min(8, imp.length); i++) pick.push(imp[i]);
      for (let i = 0; i < 18 && fl.length; i++) pick.push(fl[Math.floor(Math.random() * fl.length)]);
      const now = performance.now();
      for (const f of pick) {
        const a = keyPoint(f.from), b = keyPoint(f.to);
        if (!a || !b) continue;
        const col = f.kind === 'buy' ? '#f4c542' : f.kind === 'wage' || f.kind === 'dividend' ? '#7fd99a' : f.kind === 'loan' || f.kind === 'interest' || f.kind === 'repay' ? '#ff7d9c' : '#b9a8ff';
        coins.push({ a, b, t0: now + Math.random() * 500, dur: 1200 + Math.random() * 400, col, arc: 60 + Math.random() * 80 });
      }
      if (coins.length > 140) coins.splice(0, coins.length - 140);
    }

    /* ---------- vẽ ---------- */
    function rr(x, y, w, h, r, fill) { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h); ctx.fillStyle = fill; ctx.fill(); }
    function sign(x, y, text, bg, fg) {
      ctx.font = '600 10px ' + font; const w = ctx.measureText(text).width + 10;
      rr(x - w / 2, y - 8, w, 14, 3, bg); ctx.fillStyle = fg; ctx.textAlign = 'center'; ctx.fillText(text, x, y + 2.5);
    }
    function person(x, y, shirt, t, walking, s) {
      s = s || 1;
      const step = walking && !reduce ? Math.sin(t * 0.014 + x) * 2 : 0;
      ctx.strokeStyle = '#2f3a44'; ctx.lineWidth = 1.6 * s;
      ctx.beginPath(); ctx.moveTo(x, y - 6 * s); ctx.lineTo(x - step * s, y); ctx.moveTo(x, y - 6 * s); ctx.lineTo(x + step * s, y); ctx.stroke();
      rr(x - 3 * s, y - 15 * s, 6 * s, 9 * s, 2 * s, shirt);
      ctx.fillStyle = '#f1d3b3'; ctx.beginPath(); ctx.arc(x, y - 18 * s, 3 * s, 0, 7); ctx.fill();
    }
    function compact(v) {
      const a = Math.abs(v);
      if (a >= 1e6) return (v / 1e6).toFixed(1).replace('.', ',') + 'tr';
      if (a >= 1e4) return (v / 1e3).toFixed(1).replace('.', ',') + 'k';
      if (a >= 100) return Math.round(v).toLocaleString('vi-VN');
      return v.toFixed(1).replace('.', ',');
    }

    function drawSky(t) {
      const g = ctx.createLinearGradient(0, 0, 0, G);
      g.addColorStop(0, '#8ccbe6'); g.addColorStop(1, '#e9f4f2');
      ctx.fillStyle = g; ctx.fillRect(0, 0, WW, G);
      ctx.fillStyle = 'rgba(255,236,170,0.9)'; ctx.beginPath(); ctx.arc(1600, 90, 34, 0, 7); ctx.fill();
      for (const c of clouds) {
        if (!reduce) { c.x += 0.08 * c.s; if (c.x > WW + 100) c.x = -100; }
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.arc(c.x + k * 18 * c.s, c.y + (k % 2) * -8 * c.s, 16 * c.s, 0, 7); ctx.fill(); }
      }
      // thành phố xa
      ctx.fillStyle = 'rgba(120,150,165,0.35)';
      for (let i = 0; i < 40; i++) { const w = 30 + hash(i) * 40, h = 60 + hash(i + 3) * 160; ctx.fillRect(i * 46, G - h, w, h); }
    }

    function drawGround(t) {
      ctx.fillStyle = '#c9c4ba'; ctx.fillRect(0, G, WW, 12);
      ctx.fillStyle = '#4d535c'; ctx.fillRect(0, G + 12, WW, 48);
      ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.setLineDash([16, 14]); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, G + 36); ctx.lineTo(WW, G + 36); ctx.stroke(); ctx.setLineDash([]);
      const soil = ctx.createLinearGradient(0, G + 60, 0, WH);
      soil.addColorStop(0, '#7b5d45'); soil.addColorStop(1, '#3e2d22');
      ctx.fillStyle = soil; ctx.fillRect(0, G + 60, WW, WH - G - 60);
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      for (let i = 0; i < 90; i++) { ctx.beginPath(); ctx.ellipse(hash(i) * WW, G + 70 + hash(i + 1) * 140, 3 + hash(i + 2) * 6, 2 + hash(i + 3) * 3, 0, 0, 7); ctx.fill(); }
      // đường ống ngầm
      ctx.strokeStyle = 'rgba(160,170,180,0.5)'; ctx.lineWidth = 6;
      ctx.beginPath(); ctx.moveTo(0, G + 90); ctx.lineTo(WW, G + 90); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.65)'; ctx.font = '600 10px ' + font; ctx.textAlign = 'left';
      ctx.fillText('LÒNG ĐẤT', 12, G + 80);
      // xe cộ
      for (const c of cars) {
        if (!reduce) { c.x += c.v * (c.lane ? -1 : 1); if (c.x > WW + 60) c.x = -60; if (c.x < -60) c.x = WW + 60; }
        const y = G + (c.lane ? 40 : 18);
        rr(c.x - 22, y, 44, 14, 4, c.c); rr(c.x - 12, y - 8, 24, 10, 3, c.c);
        ctx.fillStyle = 'rgba(200,230,255,0.85)'; ctx.fillRect(c.x - 9, y - 6, 8, 6); ctx.fillRect(c.x + 1, y - 6, 8, 6);
        ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(c.x - 13, y + 14, 4, 0, 7); ctx.arc(c.x + 13, y + 14, 4, 0, 7); ctx.fill();
      }
    }

    function drawApartments(t) {
      const sorted = world.households.map((h) => h.cash).sort((a, b) => a - b);
      const rank = (cash) => { let lo = 0, hi = sorted.length; while (lo < hi) { const m = (lo + hi) >> 1; if (sorted[m] < cash) lo = m + 1; else hi = m; } return lo / Math.max(1, sorted.length - 1); };
      APTS.forEach((ap, b) => {
        const top = G - 10 - FLOORS * ROOM_H - 14;
        rr(ap.x, top, AW, G - top, 4, ['#b9a28b', '#a9b5a0', '#b7a6b8'][b]);
        ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(ap.x + 60, top - 16, 22, 16); // bồn nước
        ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.font = '600 10px ' + font; ctx.textAlign = 'center';
        ctx.fillText('CHUNG CƯ ' + 'ABC'[b], ap.x + AW / 2, top + 10);
      });
      for (const h of world.households) {
        const r = roomOf(h.id), wk = rank(h.cash);
        const home = h.employer === null;
        const wall = !h.ateToday ? '#d79a95' : home ? mix([196, 188, 176], [250, 232, 190], wk) : mix([150, 160, 170], [214, 206, 186], wk);
        ctx.fillStyle = wall; ctx.fillRect(r.x + 1, r.y + 1, r.w - 2, r.h - 2);
        ctx.fillStyle = 'rgba(70,50,40,0.6)'; ctx.fillRect(r.x + 3, r.y + r.h - 9, r.w - 6, 2); // bàn
        // đĩa ăn
        ctx.fillStyle = h.ateToday ? '#f4f1ea' : '#ffffff'; ctx.beginPath(); ctx.ellipse(r.x + r.w / 2, r.y + r.h - 10, 3.5, 1.4, 0, 0, 7); ctx.fill();
        if (h.ateToday) { ctx.fillStyle = '#d6863a'; ctx.beginPath(); ctx.arc(r.x + r.w / 2, r.y + r.h - 11, 1.6, 0, 7); ctx.fill(); }
        if (wk > 0.8) { ctx.fillStyle = '#d9a92b'; ctx.fillRect(r.x + 3, r.y + 4, 5, 6); } // tranh treo tường
        if (home) person(r.x + r.w / 2 + 5, r.y + r.h - 2, '#8a96a3', t, false, 0.7);
        if (selected && selected.type === 'house' && selected.i === Math.floor(h.id / 4) && false) {}
        if (selected && selected.type === 'hh' && selected.id === h.id) { ctx.strokeStyle = '#ffe066'; ctx.lineWidth = 2; ctx.strokeRect(r.x, r.y, r.w, r.h); }
      }
    }

    function drawSchool(t) {
      const s = SCHOOL;
      rr(s.x, G - s.h, s.w, s.h, 3, '#e8c25a');
      ctx.fillStyle = '#b5482f'; ctx.beginPath(); ctx.moveTo(s.x - 8, G - s.h); ctx.lineTo(s.x + s.w / 2, G - s.h - 34); ctx.lineTo(s.x + s.w + 8, G - s.h); ctx.fill();
      for (let fl = 0; fl < 2; fl++) {
        const y = G - s.h + 12 + fl * 48;
        ctx.fillStyle = '#f7f3e6'; ctx.fillRect(s.x + 10, y, s.w - 20, 38);
        ctx.fillStyle = '#2f5d45'; ctx.fillRect(s.x + 16, y + 4, 40, 18);
        for (let k = 0; k < 6; k++) person(s.x + 72 + k * 14, y + 36, ['#4d7cc9', '#e06c75', '#56b6c2'][k % 3], t, false, 0.6);
      }
      sign(s.x + s.w / 2, G - s.h - 14, 'TRƯỜNG HỌC', 'rgba(255,255,255,0.92)', '#4a2b12');
    }

    function drawMarket(t) {
      const m = MARKET;
      rr(m.x, G - m.h, m.w, m.h, 4, '#d9cbb0');
      ctx.fillStyle = '#6b8f5a'; ctx.beginPath(); ctx.ellipse(m.x + m.w / 2, G - m.h, m.w / 2 + 6, 26, 0, Math.PI, 0); ctx.fill();
      sign(m.x + m.w / 2, G - m.h - 12, 'CHỢ THỰC PHẨM', 'rgba(255,255,255,0.92)', '#23401c');
      for (const f of visibleFirms('food')) {
        const r = firmRect(f);
        ctx.fillStyle = f.alive ? '#f3ead7' : '#8c857a'; ctx.fillRect(r.x + 2, r.y, r.w - 4, r.h);
        // mái hiên sọc
        for (let k = 0; k < 5; k++) { ctx.fillStyle = k % 2 ? '#fff' : f.alive ? '#e0604a' : '#776'; ctx.fillRect(r.x + 2 + k * (r.w - 4) / 5, r.y, (r.w - 4) / 5, 8); }
        if (!f.alive) { ctx.fillStyle = 'rgba(80,80,80,0.9)'; for (let k = 0; k < 6; k++) ctx.fillRect(r.x + 3, r.y + 10 + k * 10, r.w - 6, 7); sign(r.x + r.w / 2, r.y + 40, 'ĐÓNG', 'rgba(120,30,30,0.9)', '#fff'); continue; }
        // hàng trên kệ = tồn kho
        const items = Math.min(18, Math.round(f.inv / 2));
        for (let k = 0; k < items; k++) {
          const cx = r.x + 7 + (k % 6) * ((r.w - 14) / 6), cy = r.y + 46 - Math.floor(k / 6) * 7;
          ctx.fillStyle = ['#e2b33c', '#7cbf55', '#d9573f'][k % 3]; ctx.beginPath(); ctx.arc(cx + 2, cy, 2.6, 0, 7); ctx.fill();
        }
        ctx.fillStyle = '#8b6a4a'; ctx.fillRect(r.x + 4, r.y + 50, r.w - 8, 4);
        for (let k = 0; k < Math.min(3, f.workers.length); k++) person(r.x + 10 + k * 12, r.y + r.h, '#3f8f5a', t, false, 0.65);
        sign(r.x + r.w / 2, r.y + 18, compact(f.price) + ' xu', 'rgba(30,50,30,0.85)', '#fff');
        if (selected && selected.type === 'firm' && selected.id === f.id) { ctx.strokeStyle = '#ffe066'; ctx.lineWidth = 2.5; ctx.strokeRect(r.x + 1, r.y - 1, r.w - 2, r.h + 1); }
      }
    }

    function drawBank(t) {
      const b = BANK;
      rr(b.x, G - b.h, b.w, b.h, 2, '#eeeef2');
      ctx.fillStyle = '#d8d8e0'; ctx.beginPath(); ctx.moveTo(b.x - 8, G - b.h); ctx.lineTo(b.x + b.w / 2, G - b.h - 30); ctx.lineTo(b.x + b.w + 8, G - b.h); ctx.fill();
      ctx.fillStyle = '#c8c8d2'; for (let k = 0; k < 5; k++) ctx.fillRect(b.x + 12 + k * 28, G - b.h + 26, 10, b.h - 30);
      sign(b.x + b.w / 2, G - b.h + 12, 'NGÂN HÀNG', '#d9a92b', '#2a1d00');
      // kho tiền dưới lòng đất
      const vx = b.x + 10, vy = G + 66, vw = b.w - 20, vh = 62;
      rr(vx, vy, vw, vh, 6, '#3b3f48'); rr(vx + 4, vy + 4, vw - 8, vh - 8, 4, '#2a2d34');
      ctx.strokeStyle = '#6c717c'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(b.x + b.w / 2, G + 60); ctx.lineTo(b.x + b.w / 2, vy); ctx.stroke();
      const stacks = 6, lvl = clamp(Math.log10(1 + world.bank.loansOut) / 6, 0, 1);
      for (let s = 0; s < stacks; s++) {
        const hgt = Math.round((0.3 + 0.7 * hash(s + 2)) * lvl * 9);
        for (let k = 0; k < hgt; k++) { ctx.fillStyle = k % 2 ? '#e8b931' : '#f2cd52'; ctx.fillRect(vx + 12 + s * 20, vy + vh - 12 - k * 5, 14, 4); }
      }
      ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.font = '600 10px ' + font; ctx.textAlign = 'center';
      ctx.fillText('KHO · dư nợ ' + compact(world.bank.loansOut) + ' xu', b.x + b.w / 2, vy - 6);
      if (selected && selected.type === 'bank') { ctx.strokeStyle = '#ffe066'; ctx.lineWidth = 2.5; ctx.strokeRect(b.x, G - b.h, b.w, b.h); }
    }

    function drawHall(t) {
      const h = HALL;
      rr(h.x, G - h.h, h.w, h.h, 2, '#e4ddcb');
      ctx.fillStyle = '#4f8e95'; ctx.beginPath(); ctx.arc(h.x + h.w / 2, G - h.h, 36, Math.PI, 0); ctx.fill();
      ctx.strokeStyle = '#444'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(h.x + h.w / 2, G - h.h - 36); ctx.lineTo(h.x + h.w / 2, G - h.h - 64); ctx.stroke();
      const wave = reduce ? 0 : Math.sin(t * 0.005) * 3;
      ctx.fillStyle = '#d64545'; ctx.beginPath(); ctx.moveTo(h.x + h.w / 2, G - h.h - 64); ctx.lineTo(h.x + h.w / 2 + 22, G - h.h - 58 + wave); ctx.lineTo(h.x + h.w / 2, G - h.h - 52); ctx.fill();
      for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) { ctx.fillStyle = 'rgba(90,110,130,0.85)'; ctx.fillRect(h.x + 18 + c * 38, G - h.h + 20 + r * 44, 18, 26); }
      ctx.fillStyle = '#7a5a3a'; ctx.fillRect(h.x + h.w / 2 - 14, G - 40, 28, 40);
      sign(h.x + h.w / 2, G - h.h + 10, 'TOÀ THỊ CHÍNH · quỹ ' + compact(world.gov.cash), 'rgba(255,255,255,0.92)', '#183038');
      // hàng người thất nghiệp xếp hàng trước cửa
      const q = world.households.filter((x) => x.employer === null).length;
      for (let k = 0; k < Math.min(q, 22); k++) person(h.x - 6 - k * 9, G + 8, '#8a96a3', t, false, 0.8);
      if (q > 0) sign(h.x - 40, G - 30, q + ' người tìm việc', 'rgba(40,50,60,0.85)', '#fff');
      if (selected && selected.type === 'gov') { ctx.strokeStyle = '#ffe066'; ctx.lineWidth = 2.5; ctx.strokeRect(h.x, G - h.h, h.w, h.h); }
    }

    function drawFactories(t) {
      sign(FACT.x + FACT.w / 2, G - FACT.h - 46, 'KHU XƯỞNG HÀNG HOÁ', 'rgba(255,255,255,0.92)', '#4a2412');
      for (const f of visibleFirms('goods')) {
        const r = firmRect(f);
        ctx.fillStyle = f.alive ? '#9aa7b6' : '#6f7178'; ctx.fillRect(r.x + 1, r.y, r.w - 2, r.h);
        // mái răng cưa
        ctx.fillStyle = f.alive ? '#7d8a99' : '#5d5f64';
        ctx.beginPath(); ctx.moveTo(r.x + 1, r.y); ctx.lineTo(r.x + r.w - 1, r.y - 16); ctx.lineTo(r.x + r.w - 1, r.y); ctx.fill();
        // ống khói
        ctx.fillStyle = '#7a6460'; ctx.fillRect(r.x + 6, r.y - 40, 7, 40);
        if (f.alive && f.workers.length && !reduce && Math.random() < 0.06) smoke.push({ x: r.x + 9.5, y: r.y - 42, t0: performance.now() });
        if (!f.alive) { sign(r.x + r.w / 2, r.y + 50, 'ĐÓNG', 'rgba(120,30,30,0.9)', '#fff'); continue; }
        // bánh răng
        const gx = r.x + r.w / 2, gy = r.y + 46, rot = reduce ? 0 : t * 0.002 * Math.min(4, f.workers.length);
        ctx.save(); ctx.translate(gx, gy); ctx.rotate(rot); ctx.fillStyle = '#4b5562';
        for (let k = 0; k < 8; k++) { ctx.rotate(Math.PI / 4); ctx.fillRect(-2, -10, 4, 5); }
        ctx.beginPath(); ctx.arc(0, 0, 7, 0, 7); ctx.fill(); ctx.fillStyle = '#9aa7b6'; ctx.beginPath(); ctx.arc(0, 0, 2.5, 0, 7); ctx.fill();
        ctx.restore();
        const crates = Math.min(9, Math.round(f.inv / 3));
        for (let k = 0; k < crates; k++) { ctx.fillStyle = '#c48e58'; ctx.fillRect(r.x + 4 + (k % 3) * 9, G - 9 - Math.floor(k / 3) * 9, 8, 8); }
        for (let k = 0; k < Math.min(3, f.workers.length); k++) person(r.x + r.w - 8 - k * 7, G, '#d9733f', t, false, 0.6);
        sign(r.x + r.w / 2, r.y + 16, compact(f.price), 'rgba(60,30,20,0.85)', '#fff');
        if (selected && selected.type === 'firm' && selected.id === f.id) { ctx.strokeStyle = '#ffe066'; ctx.lineWidth = 2.5; ctx.strokeRect(r.x + 1, r.y - 16, r.w - 2, r.h + 16); }
      }
    }

    function drawCommuters(t) {
      for (const h of world.households) {
        if (h.employer === null) continue;
        const f = world.firms.find((x) => x.id === h.employer);
        if (!f) continue;
        const ph = ((t / 9000) + hash(h.id + 11)) % 1;
        let u;
        if (ph < 0.25) u = ph / 0.25; else if (ph < 0.5) continue; else if (ph < 0.75) u = 1 - (ph - 0.5) / 0.25; else continue;
        const r = roomOf(h.id), fr = firmRect(f);
        const x = lerp(r.x + r.w / 2, fr.x + fr.w / 2, u);
        person(x, G + 9, f.sector === 'food' ? '#3f8f5a' : '#d9733f', t, true, 0.75);
      }
    }

    function draw(t) {
      if (!world) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = '#8ccbe6'; ctx.fillRect(0, 0, W, H);
      const oy = H / scale - WH; // chừa chỗ cho thanh công cụ ở đáy
      ctx.setTransform(dpr * scale, 0, 0, dpr * scale, -camX * dpr * scale, oy * dpr * scale);
      if (oy > 0) { ctx.fillStyle = '#8ccbe6'; ctx.fillRect(0, -oy, WW, oy); }
      drawSky(t); drawGround(t);
      drawApartments(t); drawSchool(t); drawMarket(t); drawBank(t); drawHall(t); drawFactories(t);
      drawCommuters(t);
      const now = performance.now();
      smoke = smoke.filter((s) => now - s.t0 < 2600);
      for (const s of smoke) { const k = (now - s.t0) / 2600; ctx.fillStyle = 'rgba(240,240,240,' + 0.55 * (1 - k) + ')'; ctx.beginPath(); ctx.arc(s.x + k * 16, s.y - k * 40, 4 + k * 10, 0, 7); ctx.fill(); }
      coins = coins.filter((c) => now - c.t0 < c.dur);
      for (const c of coins) {
        const k = (now - c.t0) / c.dur; if (k < 0) continue;
        const x = lerp(c.a.x, c.b.x, k), y = lerp(c.a.y, c.b.y, k) - Math.sin(k * Math.PI) * c.arc;
        ctx.globalAlpha = Math.min(1, Math.sin(k * Math.PI) * 2);
        ctx.fillStyle = c.col; ctx.beginPath(); ctx.ellipse(x, y, 4 * Math.abs(Math.cos(k * 10)) + 1, 4, 0, 0, 7); ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 0.8; ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }

    function pick(px, py) {
      if (!world) return null;
      const oy = H / scale - WH;
      const x = px / scale + camX, y = py / scale - oy;
      for (const h of world.households) { const r = roomOf(h.id); if (x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h) return { type: 'hh', id: h.id }; }
      for (const f of world.firms) {
        if (!(f.alive || (f.deadSince !== null && world.day - f.deadSince < 12))) continue;
        const r = firmRect(f); if (x >= r.x && x < r.x + r.w && y >= r.y - 20 && y < r.y + r.h) return { type: 'firm', id: f.id };
      }
      if (x >= BANK.x && x < BANK.x + BANK.w && y >= G - BANK.h && y < G + 210) return { type: 'bank' };
      if (x >= HALL.x && x < HALL.x + HALL.w && y >= G - HALL.h && y < G) return { type: 'gov' };
      return null;
    }
    function select(sel) { selected = sel; }
    function setWorld(w) { world = w; coins = []; smoke = []; }

    return { resize, draw, onTick, pick, select, setWorld, pan };
  }
  root.TownSide = { create };
})(typeof self !== 'undefined' ? self : this);
