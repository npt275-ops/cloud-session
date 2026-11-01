/* Phương án C — lát cắt bên trong một công trình (phong cách B), mở khi bấm vào công trình ở bản đồ (A). */
(function (root) {
  'use strict';
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, k) => a + (b - a) * k;
  const mix = (c0, c1, k) => 'rgb(' + c0.map((v, i) => Math.round(lerp(v, c1[i], k))).join(',') + ')';
  const hash = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

  function create(canvas, opts) {
    opts = opts || {};
    const ctx = canvas.getContext('2d');
    const font = opts.font || 'ui-monospace, monospace';
    const reduce = !!opts.reduceMotion;
    let W = 0, H = 0, dpr = 1;

    function resize() {
      const r = canvas.getBoundingClientRect();
      dpr = Math.min(2, window.devicePixelRatio || 1);
      W = r.width; H = r.height;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    }
    function rr(x, y, w, h, r, fill) { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h); ctx.fillStyle = fill; ctx.fill(); }
    function text(s, x, y, size, col, align, weight) { ctx.font = (weight || 600) + ' ' + size + 'px ' + font; ctx.fillStyle = col; ctx.textAlign = align || 'center'; ctx.fillText(s, x, y); }
    function person(x, y, shirt, s, t, walking) {
      const step = walking && !reduce ? Math.sin(t * 0.012 + x) * 2.5 : 0;
      ctx.strokeStyle = '#2f3a44'; ctx.lineWidth = 2 * s;
      ctx.beginPath(); ctx.moveTo(x, y - 8 * s); ctx.lineTo(x - step * s, y); ctx.moveTo(x, y - 8 * s); ctx.lineTo(x + step * s, y); ctx.stroke();
      rr(x - 4 * s, y - 20 * s, 8 * s, 12 * s, 3 * s, shirt);
      ctx.fillStyle = '#f1d3b3'; ctx.beginPath(); ctx.arc(x, y - 24 * s, 4 * s, 0, 7); ctx.fill();
    }
    function compact(v) {
      const a = Math.abs(v);
      if (a >= 1e6) return (v / 1e6).toFixed(1).replace('.', ',') + 'tr';
      if (a >= 1e4) return (v / 1e3).toFixed(1).replace('.', ',') + 'k';
      if (a >= 100) return Math.round(v).toLocaleString('vi-VN');
      return v.toFixed(1).replace('.', ',');
    }
    function backdrop(top, bottom) {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, top); g.addColorStop(1, bottom);
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    }

    /* ----- nhà ở: 4 phòng, mỗi phòng một hộ ----- */
    function house(world, i, t) {
      backdrop('#bfe3ea', '#e6efe4');
      const members = [0, 1, 2, 3].map((k) => world.households[i * 4 + k]).filter(Boolean);
      const sorted = world.households.map((h) => h.cash).sort((a, b) => a - b);
      const rank = (c) => { let lo = 0, hi = sorted.length; while (lo < hi) { const m = (lo + hi) >> 1; if (sorted[m] < c) lo = m + 1; else hi = m; } return lo / Math.max(1, sorted.length - 1); };
      const gx = 18, gw = W - 36, base = H - 18, fh = (H - 70) / 2;
      ctx.fillStyle = '#8cc06b'; ctx.fillRect(0, base, W, H - base);
      ctx.fillStyle = '#a8704e'; ctx.beginPath(); ctx.moveTo(gx - 10, base - fh * 2); ctx.lineTo(W / 2, base - fh * 2 - 40); ctx.lineTo(gx + gw + 10, base - fh * 2); ctx.fill();
      rr(gx, base - fh * 2, gw, fh * 2, 2, '#e9dfcc');
      members.forEach((h, k) => {
        const col = k % 2, row = Math.floor(k / 2);
        const x = gx + 6 + col * (gw - 12) / 2, y = base - (row + 1) * fh + 4, w = (gw - 12) / 2 - 4, rh = fh - 8;
        const wk = rank(h.cash), home = h.employer === null;
        ctx.fillStyle = !h.ateToday ? '#e3aaa4' : mix([200, 196, 186], [252, 236, 196], wk);
        ctx.fillRect(x, y, w, rh);
        ctx.fillStyle = 'rgba(0,0,0,0.08)'; ctx.fillRect(x, y + rh - 6, w, 6);
        // cửa sổ: sáng nếu có người ở nhà
        rr(x + w - 26, y + 8, 18, 16, 2, home ? '#ffd77a' : '#7f97a8');
        // bàn ăn và đĩa
        ctx.fillStyle = '#8b6a4a'; ctx.fillRect(x + 10, y + rh - 22, 34, 4); ctx.fillRect(x + 13, y + rh - 18, 3, 12); ctx.fillRect(x + 38, y + rh - 18, 3, 12);
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(x + 27, y + rh - 24, 7, 2.5, 0, 0, 7); ctx.fill();
        if (h.ateToday) { ctx.fillStyle = '#d6863a'; ctx.beginPath(); ctx.arc(x + 27, y + rh - 26, 3, 0, 7); ctx.fill(); }
        if (wk > 0.75) { rr(x + 8, y + 8, 12, 14, 1, '#d9a92b'); ctx.fillStyle = '#5e8f6a'; ctx.fillRect(x + 10, y + 10, 8, 10); }
        if (wk > 0.5) { ctx.fillStyle = '#4f9a63'; ctx.beginPath(); ctx.arc(x + w - 10, y + rh - 18, 6, 0, 7); ctx.fill(); ctx.fillStyle = '#9a6a3a'; ctx.fillRect(x + w - 13, y + rh - 13, 6, 7); }
        if (home) person(x + 54, y + rh - 6, h.ateToday ? '#8a96a3' : '#b06060', 0.85, t, false);
        text((opts.nameOf ? opts.nameOf(h.id) : 'Hộ #' + h.id) + ' · ' + compact(h.cash) + ' xu', x + w / 2, y + 12, 9.5, '#2c3a34');
        text(home ? (h.ateToday ? 'ở nhà, thất nghiệp' : 'thất nghiệp, đang đói') : (h.ateToday ? 'đi làm ở #' + h.employer : 'đi làm, nhưng đói'), x + w / 2, y + 24, 9, h.ateToday ? '#55635c' : '#a03a3a', 'center', 500);
      });
    }

    /* ----- trang trại / sạp thực phẩm ----- */
    function farm(world, f, t) {
      backdrop('#cfe8e0', '#f0ead8');
      const base = H - 18;
      ctx.fillStyle = f.alive ? '#7fb35b' : '#9c8466'; ctx.fillRect(0, base, W, H - base);
      rr(16, 46, W - 32, base - 46, 3, f.alive ? '#b5523b' : '#857a72');
      ctx.fillStyle = '#5c3e34'; ctx.beginPath(); ctx.moveTo(8, 46); ctx.lineTo(W / 2, 14); ctx.lineTo(W - 8, 46); ctx.fill();
      rr(26, 56, W - 52, base - 66, 2, '#f2e6cf');
      // bao lúa = tồn kho
      const sacks = Math.min(24, Math.round(f.inv / 2));
      for (let k = 0; k < sacks; k++) {
        const x = 40 + (k % 8) * 18, y = base - 22 - Math.floor(k / 8) * 15;
        rr(x, y, 15, 14, 5, '#d8b56a'); ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(x + 6, y + 1, 3, 3);
      }
      for (let k = 0; k < Math.min(6, f.workers.length); k++) person(W - 50 - k * 20, base - 6, '#3f8f5a', 0.9, t, true);
      rr(W - 98, 64, 70, 30, 4, '#2f4a3a');
      text('Giá', W - 63, 77, 9, '#cfe8d6', 'center', 500);
      text(compact(f.price) + ' xu', W - 63, 89, 11, '#fff');
      if (!f.alive) { rr(W / 2 - 50, H / 2 - 14, 100, 26, 4, 'rgba(140,30,30,0.92)'); text('ĐÓNG CỬA', W / 2, H / 2 + 4, 12, '#fff'); }
    }

    /* ----- nhà máy: dây chuyền, bánh răng ----- */
    function factory(world, f, t) {
      backdrop('#d9e2ea', '#eef0f2');
      const base = H - 18;
      ctx.fillStyle = '#7a828c'; ctx.fillRect(0, base, W, H - base);
      rr(14, 40, W - 28, base - 40, 2, f.alive ? '#9aa7b6' : '#6f7178');
      ctx.fillStyle = f.alive ? '#7d8a99' : '#5d5f64';
      for (let k = 0; k < 4; k++) { const x = 14 + k * (W - 28) / 4; ctx.beginPath(); ctx.moveTo(x, 40); ctx.lineTo(x + (W - 28) / 4, 22); ctx.lineTo(x + (W - 28) / 4, 40); ctx.fill(); }
      rr(22, 48, W - 44, base - 56, 2, '#e9edf1');
      // băng chuyền
      const by = base - 34, speed = f.alive ? Math.min(4, f.workers.length) : 0;
      ctx.fillStyle = '#4b5562'; ctx.fillRect(30, by, W - 60, 6);
      const off = reduce ? 0 : (t * 0.03 * speed) % 24;
      ctx.fillStyle = '#c48e58';
      for (let x = 30 - 24 + off; x < W - 40; x += 24) if (x > 28) ctx.fillRect(x, by - 9, 10, 9);
      // bánh răng
      for (let k = 0; k < 3; k++) {
        const gx = 60 + k * ((W - 120) / 2), gy = 84, rot = reduce ? 0 : t * 0.002 * speed * (k % 2 ? -1 : 1);
        ctx.save(); ctx.translate(gx, gy); ctx.rotate(rot); ctx.fillStyle = '#4b5562';
        for (let i = 0; i < 10; i++) { ctx.rotate(Math.PI / 5); ctx.fillRect(-3, -17, 6, 7); }
        ctx.beginPath(); ctx.arc(0, 0, 12, 0, 7); ctx.fill(); ctx.fillStyle = '#e9edf1'; ctx.beginPath(); ctx.arc(0, 0, 4, 0, 7); ctx.fill();
        ctx.restore();
      }
      for (let k = 0; k < Math.min(7, f.workers.length); k++) person(44 + k * ((W - 88) / 6), by - 2 + 0, '#d9733f', 0.8, t, false);
      const crates = Math.min(12, Math.round(f.inv / 3));
      for (let k = 0; k < crates; k++) { ctx.fillStyle = '#b07b47'; ctx.fillRect(W - 70 + (k % 3) * 14, base - 13 - Math.floor(k / 3) * 13, 12, 12); }
      rr(28, 54, 76, 26, 4, '#3b2a22'); text('Giá ' + compact(f.price) + ' xu', 66, 71, 10, '#fff');
      if (!f.alive) { rr(W / 2 - 50, H / 2 - 14, 100, 26, 4, 'rgba(140,30,30,0.92)'); text('ĐÓNG CỬA', W / 2, H / 2 + 4, 12, '#fff'); }
    }

    /* ----- ngân hàng: sảnh + kho tiền dưới đất ----- */
    function bank(world, t) {
      backdrop('#cfe6ee', '#e9eef0');
      const g = H * 0.5;
      rr(18, 20, W - 36, g - 20, 2, '#eeeef2');
      ctx.fillStyle = '#c8c8d2'; for (let k = 0; k < 6; k++) ctx.fillRect(30 + k * ((W - 70) / 5), 34, 8, g - 38);
      rr(W / 2 - 60, g - 26, 120, 20, 3, '#8b6a4a'); text('QUẦY GIAO DỊCH', W / 2, g - 12, 9, '#fff');
      person(W / 2 - 30, g - 26, '#2f4a6a', 0.7, t, false); person(W / 2 + 30, g - 26, '#2f4a6a', 0.7, t, false);
      const soil = ctx.createLinearGradient(0, g, 0, H); soil.addColorStop(0, '#7b5d45'); soil.addColorStop(1, '#3e2d22');
      ctx.fillStyle = soil; ctx.fillRect(0, g, W, H - g);
      rr(30, g + 16, W - 60, H - g - 26, 8, '#2a2d34');
      const lvl = clamp(Math.log10(1 + world.bank.loansOut) / 6, 0, 1);
      for (let s = 0; s < 8; s++) {
        const hgt = Math.round((0.35 + 0.65 * hash(s + 2)) * lvl * ((H - g - 40) / 6));
        for (let k = 0; k < hgt; k++) { ctx.fillStyle = k % 2 ? '#e8b931' : '#f2cd52'; ctx.fillRect(44 + s * ((W - 100) / 7), H - 18 - k * 6, 18, 5); }
      }
      text('KHO TIỀN · dư nợ ' + compact(world.bank.loansOut) + ' xu', W / 2, g + 12, 10, '#ffe7a3');
    }

    /* ----- toà thị chính: hàng người tìm việc, rương ngân sách ----- */
    function hall(world, t) {
      backdrop('#d9eef0', '#efeadc');
      const base = H - 18;
      ctx.fillStyle = '#d3c8b5'; ctx.fillRect(0, base, W, H - base);
      rr(16, 30, W - 32, base - 30, 2, '#e4ddcb');
      ctx.fillStyle = '#4f8e95'; ctx.beginPath(); ctx.arc(W / 2, 30, 30, Math.PI, 0); ctx.fill();
      rr(24, 40, W - 48, base - 48, 2, '#f6f1e4');
      rr(W - 120, base - 46, 90, 30, 3, '#8b6a4a'); text('BÀN TUYỂN DỤNG', W - 75, base - 28, 8.5, '#fff');
      person(W - 75, base - 46, '#2f4a6a', 0.7, t, false);
      const q = world.households.filter((h) => h.employer === null).length;
      for (let k = 0; k < Math.min(q, 10); k++) person(W - 140 - k * 18, base - 4, '#8a96a3', 0.8, t, false);
      text(q ? q + ' người đang tìm việc' : 'Không ai thất nghiệp', 110, 62, 11, '#2c3a34');
      // rương ngân sách
      const fill = clamp(Math.log10(1 + world.gov.cash) / 5, 0, 1);
      rr(40, base - 50, 60, 40, 4, '#7a5230'); rr(44, base - 46 + (1 - fill) * 30, 52, 6 + fill * 30, 2, '#f2cd52');
      text('Quỹ ' + compact(world.gov.cash) + ' xu', 70, base - 56, 10, '#2c3a34');
    }

    function draw(world, sel, t) {
      if (!world || !sel || !W) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      if (sel.type === 'house') house(world, sel.i, t);
      else if (sel.type === 'hh') house(world, Math.floor(sel.id / 4), t);
      else if (sel.type === 'firm') { const f = world.firms.find((x) => x.id === sel.id); if (f) (f.sector === 'food' ? farm : factory)(world, f, t); }
      else if (sel.type === 'bank') bank(world, t);
      else if (sel.type === 'gov') hall(world, t);
    }
    return { resize, draw };
  }
  root.TownInterior = { create };
})(typeof self !== 'undefined' ? self : this);
