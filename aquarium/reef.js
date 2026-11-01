/* Bể Kính — lớp hình ảnh "Rạn san hô".
 * Doanh nghiệp thực phẩm = rừng tảo, xưởng hàng = san hô, hộ gia đình = cá,
 * ngân hàng = con trai khổng lồ, nhà nước = phao nổi trên mặt nước. */
(function (root) {
  'use strict';

  function hash(n) { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
  function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const lerp = (a, b, k) => a + (b - a) * k;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  function mix(c0, c1, k) { return 'rgb(' + c0.map((v, i) => Math.round(lerp(v, c1[i], k))).join(',') + ')'; }
  function compact(v) {
    const a = Math.abs(v);
    if (a >= 1e9) return (v / 1e9).toFixed(1).replace('.', ',') + ' tỷ';
    if (a >= 1e6) return (v / 1e6).toFixed(1).replace('.', ',') + ' tr';
    if (a >= 1e4) return (v / 1e3).toFixed(1).replace('.', ',') + 'k';
    if (a >= 100) return Math.round(v).toLocaleString('vi-VN');
    return v.toFixed(1).replace('.', ',');
  }

  const C = {
    kelp: [74, 168, 112], coral: [240, 128, 104], bleach: [214, 210, 198],
    poor: [150, 172, 184], rich: [247, 185, 66],
  };

  function create(canvas, opts) {
    opts = opts || {};
    const ctx = canvas.getContext('2d');
    const reduce = !!opts.reduceMotion;
    let W = 0, H = 0, dpr = 1, floorY = 0;
    let world = null;
    const fish = new Map();
    const firmPos = new Map();
    const corals = new Map();
    let particles = [];
    let scene = null;
    const font = opts.font || 'ui-monospace, monospace';

    function resize() {
      const r = canvas.getBoundingClientRect();
      dpr = Math.min(2, window.devicePixelRatio || 1);
      W = r.width; H = r.height; floorY = H * 0.83;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildScene();
    }

    function buildScene() {
      const R = rng(7);
      const pebbles = [];
      for (let i = 0; i < Math.round(W / 6); i++) pebbles.push({ x: R() * W, y: floorY + 8 + R() * (H - floorY - 8), r: 0.6 + R() * 2.2, l: 0.5 + R() * 0.5 });
      const far = [];
      for (let i = 0; i < 9; i++) far.push({ x: R() * W, w: 60 + R() * 140, h: 30 + R() * 90 });
      const rays = [];
      for (let i = 0; i < 6; i++) rays.push({ x: (0.08 + R() * 0.84) * W, w: 20 + R() * 50, spread: 60 + R() * 120, ph: R() * 6 });
      const motes = [];
      for (let i = 0; i < 70; i++) motes.push({ x: R() * W, y: R() * floorY, r: 0.4 + R() * 1.1, v: 0.05 + R() * 0.15, ph: R() * 6 });
      scene = { pebbles, far, rays, motes };
    }

    function sandY(x) { return floorY + Math.sin(x * 0.012) * 4 + Math.sin(x * 0.031 + 1) * 2; }

    function coralShape(id) {
      if (corals.has(id)) return corals.get(id);
      const R = rng(1000 + id * 17);
      const segs = [], tips = [];
      (function branch(x, y, ang, len, depth) {
        const x2 = x + Math.cos(ang) * len, y2 = y + Math.sin(ang) * len;
        segs.push({ x1: x, y1: y, x2, y2, w: 1 + depth * 1.3 });
        if (depth <= 0) { tips.push({ x: x2, y: y2 }); return; }
        const n = R() < 0.35 ? 3 : 2;
        for (let i = 0; i < n; i++) {
          const spread = (i - (n - 1) / 2) * (0.45 + R() * 0.3);
          branch(x2, y2, ang + spread + (R() - 0.5) * 0.25, len * (0.68 + R() * 0.12), depth - 1);
        }
      })(0, 0, -Math.PI / 2 + (R() - 0.5) * 0.2, 0.32, 4);
      let minX = 0, maxX = 0, minY = 0;
      for (const g of segs) { minX = Math.min(minX, g.x2); maxX = Math.max(maxX, g.x2); minY = Math.min(minY, g.y2); }
      const s = { segs, tips, width: Math.max(0.2, maxX - minX), height: -minY, cx: (minX + maxX) / 2 };
      corals.set(id, s);
      return s;
    }

    /* ---------- bố trí ---------- */
    function layout() {
      const visible = world.firms.filter((f) => f.alive || (f.deadSince !== null && world.day - f.deadSince < 12));
      const narrow = W < 520;
      for (const sector of ['food', 'goods']) {
        const list = visible.filter((f) => f.sector === sector).sort((a, b) => a.id - b.id);
        const x0 = sector === 'food' ? 0.04 : 0.6, x1 = sector === 'food' ? 0.4 : 0.96;
        list.forEach((f, i) => {
          const tx = W * (x0 + ((i + 0.5) / list.length) * (x1 - x0));
          const size = clamp(Math.sqrt(f.workers.length) / 3.6, 0.25, 1.15);
          const th = H * (narrow ? 0.2 : 0.17) + H * 0.26 * size;
          let p = firmPos.get(f.key);
          if (!p) { p = { x: tx, h: th, alive: 1 }; firmPos.set(f.key, p); }
          p.slot = (W * (x1 - x0)) / list.length;
          p.x = lerp(p.x, tx, 0.06); p.h = lerp(p.h, f.alive ? th : th * 0.55, 0.04);
          p.alive = lerp(p.alive, f.alive ? 1 : 0, 0.05);
          p.f = f;
        });
      }
    }
    function crown(key) {
      const p = firmPos.get(key);
      if (!p) return null;
      return { x: p.x, y: sandY(p.x) - (p.drawH || p.h) * 0.7 };
    }
    const bankPos = () => ({ x: W * 0.5, y: sandY(W * 0.5) - 10 });
    const govPos = () => ({ x: W * 0.5, y: H * 0.045 });
    function keyPos(key) {
      if (key === 'bank') return bankPos();
      if (key === 'gov') return govPos();
      if (key[0] === 'h') return fish.get(+key.slice(1));
      return crown(key);
    }

    /* ---------- dòng tiền ---------- */
    function onTick(w, tps) {
      world = w;
      const fl = w.flows;
      if (!fl.length) return;
      const budget = reduce ? 10 : clamp(400 / (tps || 6), 25, 80);
      const important = fl.filter((f) => f.kind !== 'buy' && f.kind !== 'wage');
      const common = fl.filter((f) => f.kind === 'buy' || f.kind === 'wage');
      const pick = important.slice(0, Math.floor(budget / 2.5));
      while (pick.length < budget && common.length) pick.push(common.splice(Math.floor(Math.random() * common.length), 1)[0]);
      const dur = clamp(2400 / (tps || 6), 500, 1400);
      const now = performance.now();
      for (const f of pick) {
        const a = keyPos(f.from), b = keyPos(f.to);
        if (!a || !b) continue;
        particles.push({ a: { x: a.x, y: a.y }, b: { x: b.x, y: b.y }, kind: f.kind, t0: now + Math.random() * dur * 0.5, dur: f.kind === 'print' || f.kind === 'benefit' ? dur * 1.8 : dur, bend: (Math.random() - 0.5) * 70, r: clamp(1 + Math.log10(1 + f.amt) * 0.7, 1, 3.5), spin: Math.random() * 6 });
      }
      if (particles.length > 800) particles.splice(0, particles.length - 800);
    }

    /* ---------- vẽ ---------- */
    function drawWater(t) {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#1d6b80'); g.addColorStop(0.18, '#12495c'); g.addColorStop(0.6, '#0a2c3b'); g.addColorStop(1, '#061923');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      // tia nắng
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (const r of scene.rays) {
        const sway = reduce ? 0 : Math.sin(t * 0.00025 + r.ph) * 30;
        const lg = ctx.createLinearGradient(0, 0, 0, floorY);
        lg.addColorStop(0, 'rgba(190,240,255,0.10)'); lg.addColorStop(1, 'rgba(190,240,255,0)');
        ctx.fillStyle = lg; ctx.beginPath();
        ctx.moveTo(r.x - r.w / 2, 0); ctx.lineTo(r.x + r.w / 2, 0);
        ctx.lineTo(r.x + r.w / 2 + r.spread + sway, floorY); ctx.lineTo(r.x - r.w / 2 + sway, floorY); ctx.closePath(); ctx.fill();
      }
      ctx.restore();
      // mặt nước
      ctx.beginPath(); ctx.moveTo(0, 0);
      for (let x = 0; x <= W; x += 12) ctx.lineTo(x, 10 + Math.sin(x * 0.03 + t * 0.0015) * 2.5);
      ctx.lineTo(W, 0); ctx.closePath();
      ctx.fillStyle = 'rgba(210,245,255,0.16)'; ctx.fill();
      // rạn xa (chiều sâu)
      ctx.fillStyle = 'rgba(6,30,40,0.55)';
      for (const f of scene.far) {
        ctx.beginPath(); ctx.ellipse(f.x, floorY + 6, f.w, f.h, 0, Math.PI, 0); ctx.fill();
      }
      // phù du
      ctx.fillStyle = 'rgba(200,235,245,0.35)';
      for (const m of scene.motes) {
        if (!reduce) { m.y -= m.v; m.x += Math.sin(t * 0.0006 + m.ph) * 0.15; if (m.y < 0) m.y = floorY; }
        ctx.globalAlpha = 0.3 + 0.3 * Math.sin(t * 0.002 + m.ph);
        ctx.beginPath(); ctx.arc(m.x, m.y, m.r, 0, 7); ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    function drawSand(t) {
      ctx.beginPath(); ctx.moveTo(0, H);
      for (let x = 0; x <= W; x += 8) ctx.lineTo(x, sandY(x));
      ctx.lineTo(W, H); ctx.closePath();
      const g = ctx.createLinearGradient(0, floorY - 6, 0, H);
      g.addColorStop(0, '#7f8f86'); g.addColorStop(0.25, '#5e6c66'); g.addColorStop(1, '#2c3735');
      ctx.fillStyle = g; ctx.fill();
      for (const p of scene.pebbles) {
        ctx.fillStyle = 'rgba(30,40,38,' + (0.25 + p.l * 0.3) + ')';
        ctx.beginPath(); ctx.ellipse(p.x, p.y, p.r * 1.4, p.r, 0, 0, 7); ctx.fill();
      }
      // ánh sáng nhấp nháy trên cát
      if (!reduce) {
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 14; i++) {
          const x = (hash(i) * W + t * 0.01 * (hash(i + 3) - 0.5) * 20) % W;
          const y = floorY + 6 + hash(i + 9) * (H - floorY - 12);
          ctx.fillStyle = 'rgba(210,250,255,' + (0.04 + 0.04 * Math.sin(t * 0.002 + i)) + ')';
          ctx.beginPath(); ctx.ellipse(x, y, 22, 5, 0, 0, 7); ctx.fill();
        }
        ctx.restore();
      }
      // nhãn vùng, viết trên cát
      ctx.font = '600 10.5px ' + font; ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(230,242,238,0.6)';
      const yl = H - 10;
      ctx.fillText('RỪNG TẢO · THỰC PHẨM', W * 0.22, yl);
      ctx.fillText('RẠN SAN HÔ · HÀNG HOÁ', W * 0.78, yl);
    }

    function health(f) {
      if (!f.alive) return 0;
      const lim = Math.max(150, f.wage * Math.max(1, f.workers.length) * 25);
      return clamp(1 - f.debt / lim, 0, 1);
    }

    function drawKelp(p, f, t) {
      const base = sandY(p.x);
      const h = p.h, hl = health(f);
      const col = mix(C.kelp, C.bleach, (1 - hl) * 0.85);
      const n = clamp(3 + Math.round(f.workers.length / 2), 3, 10);
      ctx.globalAlpha = 0.25 + 0.75 * p.alive;
      const podsTotal = clamp(Math.round(f.inv / 2), 0, 24);
      let pods = 0;
      for (let k = 0; k < n; k++) {
        const bx = p.x + (k - (n - 1) / 2) * 5;
        const fh = h * (0.65 + hash(f.id * 31 + k) * 0.35);
        const amp = 10 + hash(k + f.id) * 8;
        ctx.beginPath(); ctx.moveTo(bx, base);
        const pts = [];
        for (let s = 1; s <= 12; s++) {
          const y = base - (fh * s) / 12;
          const x = bx + (reduce ? 0 : Math.sin(t * 0.0012 + k * 0.9 + s * 0.35)) * amp * (s / 12);
          ctx.lineTo(x, y); pts.push({ x, y });
        }
        ctx.strokeStyle = col; ctx.lineWidth = 2.6; ctx.lineCap = 'round'; ctx.stroke();
        // lá
        ctx.fillStyle = col;
        for (let s = 2; s < pts.length; s += 2) {
          const q = pts[s], side = s % 4 === 0 ? 1 : -1;
          ctx.beginPath(); ctx.ellipse(q.x + side * 4, q.y, 5.5, 2, side * 0.6, 0, 7); ctx.fill();
          if (pods < podsTotal && (s + k) % 3 === 0) { pods++; glowDot(q.x - side * 3, q.y - 2, 2.1, 'rgba(232,240,140,'); }
        }
      }
      ctx.globalAlpha = 1;
    }

    function drawCoral(p, f) {
      const base = sandY(p.x);
      const shape = coralShape(f.id), hl = health(f);
      const s = Math.min(p.h / shape.height, (p.slot * 1.45) / shape.width);
      p.drawH = shape.height * s;
      const ox = -shape.cx * s;
      const col = mix(C.coral, C.bleach, (1 - hl) * 0.9);
      ctx.globalAlpha = 0.25 + 0.75 * p.alive;
      ctx.strokeStyle = col; ctx.lineCap = 'round';
      for (const g of shape.segs) {
        ctx.lineWidth = g.w * (0.55 + s / 420);
        ctx.beginPath(); ctx.moveTo(p.x + ox + g.x1 * s, base + g.y1 * s); ctx.lineTo(p.x + ox + g.x2 * s, base + g.y2 * s); ctx.stroke();
      }
      const podsTotal = clamp(Math.round(f.inv / 2), 0, shape.tips.length);
      shape.tips.forEach((tp, i) => {
        if (i < podsTotal) glowDot(p.x + ox + tp.x * s, base + tp.y * s, 2.2, 'rgba(255,214,170,');
        else { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(p.x + ox + tp.x * s, base + tp.y * s, 1.8, 0, 7); ctx.fill(); }
      });
      ctx.globalAlpha = 1;
    }

    function glowDot(x, y, r, rgbaPrefix) {
      const g = ctx.createRadialGradient(x, y, 0, x, y, r * 3);
      g.addColorStop(0, rgbaPrefix + '0.95)'); g.addColorStop(1, rgbaPrefix + '0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r * 3, 0, 7); ctx.fill();
    }

    function tag(x, y, text, sub, light) {
      ctx.font = '500 10.5px ' + font;
      const w = Math.max(ctx.measureText(text).width, sub ? ctx.measureText(sub).width : 0) + 12;
      const h = sub ? 28 : 16;
      ctx.fillStyle = light ? 'rgba(235,245,248,0.9)' : 'rgba(6,22,30,0.62)';
      roundRect(x - w / 2, y, w, h, 5); ctx.fill();
      ctx.fillStyle = light ? '#0b1f28' : 'rgba(225,240,245,0.92)'; ctx.textAlign = 'center';
      ctx.fillText(text, x, y + 11.5);
      if (sub) { ctx.fillStyle = light ? '#3b5560' : 'rgba(225,240,245,0.65)'; ctx.fillText(sub, x, y + 24); }
    }
    function roundRect(x, y, w, h, r) {
      ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
    }

    function drawClam(t) {
      const p = bankPos(), b = world.bank;
      const open = clamp(0.25 + Math.log10(1 + b.loansOut) / 12, 0.25, 0.75) + (reduce ? 0 : Math.sin(t * 0.0015) * 0.03);
      const w = Math.min(46, W * 0.05);
      // vỏ dưới
      ctx.fillStyle = '#b9a9c9';
      ctx.beginPath(); ctx.ellipse(p.x, p.y, w, w * 0.45, 0, 0, Math.PI); ctx.fill();
      // ngọc trai: sáng theo dư nợ
      glowDot(p.x, p.y - 3, clamp(3 + Math.log10(1 + b.loansOut), 3, 9), 'rgba(255,245,235,');
      // vỏ trên (mở)
      ctx.save(); ctx.translate(p.x - w, p.y); ctx.rotate(-open);
      ctx.fillStyle = '#d4c6e2';
      ctx.beginPath(); ctx.ellipse(w, 0, w, w * 0.5, 0, Math.PI, 0); ctx.fill();
      ctx.strokeStyle = 'rgba(110,90,130,0.5)'; ctx.lineWidth = 1;
      for (let i = 1; i < 6; i++) { ctx.beginPath(); ctx.moveTo(w, 0); ctx.lineTo(w + Math.cos(Math.PI + (i * Math.PI) / 6) * w, Math.sin(Math.PI + (i * Math.PI) / 6) * w * 0.5); ctx.stroke(); }
      ctx.restore();
      tag(p.x, p.y + 16, 'NGÂN HÀNG', 'dư nợ ' + compact(b.loansOut) + ' xu', true);
    }

    function drawBuoy(t) {
      const p = govPos(), bob = reduce ? 0 : Math.sin(t * 0.002) * 2;
      ctx.strokeStyle = 'rgba(220,240,245,0.25)'; ctx.setLineDash([2, 4]);
      ctx.beginPath(); ctx.moveTo(p.x, p.y + 12 + bob); ctx.lineTo(p.x, p.y + 40); ctx.stroke(); ctx.setLineDash([]);
      glowDot(p.x, p.y + bob - 8, 6, 'rgba(255,240,200,');
      ctx.fillStyle = '#e8584f'; roundRect(p.x - 10, p.y - 4 + bob, 20, 16, 6); ctx.fill();
      ctx.fillStyle = '#f4efe6'; ctx.fillRect(p.x - 10, p.y + 2 + bob, 20, 4);
      tag(p.x, p.y + 44, 'NHÀ NƯỚC', 'quỹ ' + compact(world.gov.cash) + ' xu', true);
    }

    function drawFish(t) {
      const sorted = world.households.map((h) => h.cash).sort((a, b) => a - b);
      const n = sorted.length;
      const sp = Math.max(0.7, W / 900);
      for (const h of world.households) {
        let f = fish.get(h.id);
        let tx, ty;
        if (h.employer !== null) {
          const firm = world.firms.find((x) => x.id === h.employer);
          const c = firm && crown(firm.key);
          if (c) {
            const a = hash(h.id) * 6.283 + t * 0.0004 * (hash(h.id + 2) > 0.5 ? 1 : -1);
            const R = 26 + hash(h.id + 4) * 34;
            tx = c.x + Math.cos(a) * R; ty = c.y + Math.sin(a) * R * 0.55;
          }
        }
        if (tx === undefined) {
          const a = t * 0.00015 + hash(h.id) * 6.283;
          tx = W * (0.5 + Math.sin(a) * 0.08 + (hash(h.id + 5) - 0.5) * 0.06);
          ty = H * (0.6 + Math.cos(a * 1.3) * 0.05 + hash(h.id + 7) * 0.06);
        }
        if (!f) { f = { x: tx, y: ty, vx: 0, vy: 0, ph: hash(h.id) * 6 }; fish.set(h.id, f); }
        const slow = h.ateToday ? 1 : 0.55;
        f.vx += ((tx - f.x) * 0.0018 + (Math.random() - 0.5) * 0.08) * slow;
        f.vy += ((ty - f.y) * 0.0018 + (Math.random() - 0.5) * 0.05) * slow;
        f.vx *= 0.95; f.vy *= 0.95;
        const v = Math.hypot(f.vx, f.vy), vmax = 1.8 * sp * slow;
        if (v > vmax) { f.vx *= vmax / v; f.vy *= vmax / v; }
        f.x += f.vx; f.y += f.vy; f.y = Math.min(f.y, floorY - 6);
        f.ph += 0.15 + v * 0.25;
        let lo = 0, hi = n; while (lo < hi) { const m = (lo + hi) >> 1; if (sorted[m] < h.cash) lo = m + 1; else hi = m; }
        const rank = lo / Math.max(1, n - 1);
        const L = (5 + rank * 2.5) * sp;
        ctx.save(); ctx.translate(f.x, f.y); ctx.rotate(Math.atan2(f.vy, f.vx || 0.001));
        const body = h.ateToday ? mix(C.poor, C.rich, rank) : 'rgb(196,170,170)';
        // đuôi
        const wag = Math.sin(f.ph) * L * 0.35;
        ctx.fillStyle = body; ctx.globalAlpha = 0.9;
        ctx.beginPath(); ctx.moveTo(-L * 0.8, 0); ctx.lineTo(-L * 1.55, -L * 0.45 + wag); ctx.lineTo(-L * 1.55, L * 0.45 + wag); ctx.closePath(); ctx.fill();
        // thân
        ctx.globalAlpha = 1;
        ctx.beginPath(); ctx.ellipse(0, 0, L, L * 0.42, 0, 0, 7); ctx.fill();
        // bụng sáng
        ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.ellipse(L * 0.1, L * 0.12, L * 0.6, L * 0.16, 0, 0, 7); ctx.fill();
        if (!h.ateToday) { ctx.fillStyle = '#ff5a5a'; ctx.beginPath(); ctx.arc(0, L * 0.18, L * 0.18, 0, 7); ctx.fill(); }
        ctx.fillStyle = '#0a1a20'; ctx.beginPath(); ctx.arc(L * 0.55, -L * 0.08, Math.max(0.8, L * 0.09), 0, 7); ctx.fill();
        ctx.restore();
      }
    }

    function drawParticles() {
      const now = performance.now();
      particles = particles.filter((p) => now - p.t0 < p.dur);
      for (const p of particles) {
        const k = (now - p.t0) / p.dur;
        if (k < 0) continue;
        let x, y;
        if (p.kind === 'tax') { // bọt khí nổi lên mặt nước
          const e = k * k;
          x = lerp(p.a.x, p.b.x, e) + Math.sin(k * 12 + p.spin) * 4; y = lerp(p.a.y, p.b.y, e);
          ctx.globalAlpha = Math.sin(k * Math.PI) * 0.8; ctx.strokeStyle = 'rgba(200,240,255,0.9)'; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.arc(x, y, p.r + 0.8, 0, 7); ctx.stroke(); continue;
        }
        if (p.kind === 'print' || p.kind === 'benefit') { // vụn thức ăn rơi từ phao xuống
          const e = 1 - Math.pow(1 - k, 2);
          x = lerp(p.a.x, p.b.x, e) + Math.sin(k * 8 + p.spin) * 10; y = lerp(p.a.y, p.b.y, e);
          ctx.globalAlpha = Math.sin(k * Math.PI) * 0.95;
          ctx.save(); ctx.translate(x, y); ctx.rotate(k * 6 + p.spin);
          ctx.fillStyle = p.kind === 'print' ? '#ffe7a3' : '#d9ccff'; ctx.fillRect(-p.r, -p.r * 0.6, p.r * 2, p.r * 1.2);
          ctx.restore(); continue;
        }
        const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
        const mx = (p.a.x + p.b.x) / 2 + p.bend, my = (p.a.y + p.b.y) / 2 - Math.abs(p.bend) * 0.4;
        x = (1 - e) * (1 - e) * p.a.x + 2 * (1 - e) * e * mx + e * e * p.b.x;
        y = (1 - e) * (1 - e) * p.a.y + 2 * (1 - e) * e * my + e * e * p.b.y;
        ctx.globalAlpha = Math.sin(k * Math.PI);
        const pre = p.kind === 'buy' ? 'rgba(255,205,90,' : p.kind === 'wage' || p.kind === 'dividend' ? 'rgba(160,235,255,' : 'rgba(255,110,150,';
        glowDot(x, y, p.r * 0.8, pre);
      }
      ctx.globalAlpha = 1;
    }

    function drawVignette() {
      const g = ctx.createRadialGradient(W / 2, H * 0.45, Math.min(W, H) * 0.35, W / 2, H * 0.5, Math.max(W, H) * 0.75);
      g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,8,12,0.55)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    }

    function drawTags() {
      for (const [, p] of firmPos) {
        const f = p.f;
        if (!f || (!f.alive && (f.deadSince === null || world.day - f.deadSince >= 12))) continue;
        const y = sandY(p.x) + 6;
        if (f.alive) tag(p.x, y, compact(f.price) + ' xu', null, false);
        else tag(p.x, y, 'phá sản', null, false);
      }
    }

    function draw(t) {
      if (!world || !scene) return;
      layout();
      drawWater(t);
      drawSand(t);
      for (const [, p] of firmPos) {
        const f = p.f;
        if (!f || (!f.alive && (f.deadSince === null || world.day - f.deadSince >= 12))) continue;
        if (f.sector === 'food') drawKelp(p, f, t); else drawCoral(p, f);
      }
      drawClam(t);
      drawFish(t);
      drawParticles();
      drawBuoy(t);
      drawTags();
      drawVignette();
      // tên vùng thất nghiệp
      ctx.font = '600 10.5px ' + font; ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(220,240,245,0.4)';
      ctx.fillText('VÙNG NƯỚC LẶNG · THẤT NGHIỆP', W * 0.5, H * 0.53);
    }

    function setWorld(w) { world = w; fish.clear(); firmPos.clear(); particles = []; }

    return { resize, draw, onTick, setWorld, compact };
  }

  root.Reef = { create, compact };
})(typeof self !== 'undefined' ? self : this);
