/* Bể Kính · render/fx/magic-audio.js · Âm thanh phép (design/ke-hoach-buoc-37.md)
 * Tự sinh bằng Web Audio qua đường ra chung của audio.js (bus); âm thanh đang tắt thì không kêu gì. Mỗi tiếng một hàm, hệ sau
 * thêm tiếng của mình vào đây:
 *   cast(hue)     tiếng vút lúc niệm phép (hue 0..1: thấp ấm tới cao trong)
 *   impact(k)     tiếng bung khi phép chạm đích: k 0..1 độ mạnh
 *   deny()        tiếng "tịt" khi không dùng được (thiếu linh lực, đang hồi phép)
 *   page()        tiếng lật trang sách
 *   bell(on)      chuông trầm khi thời gian dừng (on), chuông cao, ngắn khi thời gian chạy tiếp
 *   tick(k)       tiếng tích tắc (tua nhanh, tua lùi): k > 0 cao, k < 0 trầm
 * Cần: audio.js (G.audio). */
(function (root) {
  const BK = root.BK || (root.BK = {});
  function create(G) {
    let noise = null;
    const bus = () => (G.audio && G.audio.bus ? G.audio.bus() : null);
    // tiếng ồn lọc dải, dải lọc trượt từ f0 tới f1, đường bao env [[giây, độ to]]
    function band(b, f0, f1, q, env, dur) {
      const { ctx, out } = b,
        t = ctx.currentTime,
        src = ctx.createBufferSource(),
        f = ctx.createBiquadFilter(),
        g = ctx.createGain();
      src.buffer = noise || (noise = b.noise('pink'));
      f.type = 'bandpass';
      f.Q.value = q;
      f.frequency.setValueAtTime(f0, t);
      f.frequency.exponentialRampToValueAtTime(f1, t + dur);
      g.gain.setValueAtTime(0.0001, t);
      for (const [s, v] of env) g.gain.exponentialRampToValueAtTime(Math.max(0.0001, v), t + s);
      src.connect(f);
      f.connect(g);
      g.connect(out);
      src.start(t);
      src.stop(t + dur + 0.05);
    }
    // một nốt: sóng sin trượt cao độ f0 → f1
    function tone(b, f0, f1, vol, dur, type) {
      const { ctx, out } = b,
        t = ctx.currentTime,
        o = ctx.createOscillator(),
        g = ctx.createGain();
      o.type = type || 'sine';
      o.frequency.setValueAtTime(f0, t);
      o.frequency.exponentialRampToValueAtTime(f1, t + dur);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g);
      g.connect(out);
      o.start(t);
      o.stop(t + dur + 0.05);
    }
    function cast(hue) {
      const b = bus();
      if (!b) return;
      const h = hue == null ? 0.7 : hue;
      band(b, 400 + 600 * h, 2400 + 3000 * h, 3, [[0.06, 0.22], [0.3, 0.0001]], 0.32);
      tone(b, 520 + 400 * h, 980 + 900 * h, 0.06, 0.25);
    }
    function impact(k) {
      const b = bus();
      if (!b) return;
      const v = 0.15 + 0.35 * (k == null ? 0.5 : k);
      band(b, 1800, 300, 1.2, [[0.01, v], [0.45, 0.0001]], 0.5);
      tone(b, 880, 1760, 0.05, 0.4, 'triangle');
      tone(b, 1320, 2640, 0.035, 0.5, 'sine');
    }
    function deny() {
      const b = bus();
      if (!b) return;
      tone(b, 220, 160, 0.08, 0.16, 'triangle');
    }
    function page() {
      const b = bus();
      if (!b) return;
      band(b, 2500, 5000, 0.8, [[0.03, 0.12], [0.2, 0.0001]], 0.22);
    }
    function bell(on) {
      const b = bus();
      if (!b) return;
      const f = on ? 196 : 392;
      tone(b, f, f * 0.998, 0.12, on ? 2.4 : 1.1, 'sine');
      tone(b, f * 2.01, f * 2, 0.05, on ? 1.8 : 0.8, 'sine');
      tone(b, f * 3.02, f * 3, 0.025, on ? 1.2 : 0.5, 'triangle');
      band(b, on ? 3000 : 600, on ? 400 : 4000, 1.5, [[0.05, 0.12], [0.6, 0.0001]], 0.65);
    }
    function tick(k) {
      const b = bus();
      if (!b) return;
      const f = k < 0 ? 900 : 1700;
      tone(b, f, f * 0.9, 0.05, 0.05, 'square');
    }
    return { cast, impact, deny, page, bell, tick };
  }
  BK.MagicAudio = { create };
})(typeof self !== 'undefined' ? self : globalThis);
