/* Bể Kính · render/fx/soul-audio.js · Âm thanh của cú nhập hồn (design/ke-hoach-buoc-32.md mục 3.5)
 * Tự sinh bằng Web Audio qua đường ra chung của audio.js (bus, muffle); âm thanh đang tắt thì không kêu gì.
 *   suck()      gió hút vào lúc khựng lấy đà
 *   roar(k)     gió rít lúc lao: k 0..1 theo tốc độ (to dần, cao dần); roar(0) tắt
 *   ting()      tiếng gõ kính lúc xuyên vòm
 *   thump()     tiếng trầm 40 Hz khi chạm, kèm tiếng va
 *   heart(n)    n nhịp tim (thình thịch), chậm dần
 * Cần: audio.js (G.audio). */
(function (root) {
  const BK = root.BK || (root.BK = {});
  function create(G) {
    let noise = null,
      roarN = null;
    const bus = () => (G.audio && G.audio.bus ? G.audio.bus() : null);
    const noiseOf = (b) => noise || (noise = b.noise('pink'));
    // một tiếng ồn lọc dải, to nhỏ theo đường bao (env: [[giây, độ to], ...]), dải lọc trượt từ f0 tới f1
    function band(b, f0, f1, q, env, dur) {
      const { ctx, out } = b,
        t = ctx.currentTime,
        src = ctx.createBufferSource(),
        f = ctx.createBiquadFilter(),
        g = ctx.createGain();
      src.buffer = noiseOf(b);
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
    function tone(b, type, f0, f1, vol, dur, when) {
      const { ctx, out } = b,
        t = ctx.currentTime + (when || 0),
        o = ctx.createOscillator(),
        g = ctx.createGain();
      o.type = type;
      o.frequency.setValueAtTime(f0, t);
      o.frequency.exponentialRampToValueAtTime(f1, t + dur);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g);
      g.connect(out);
      o.start(t);
      o.stop(t + dur + 0.05);
    }
    return {
      suck() {
        const b = bus();
        if (b)
          band(
            b,
            1800,
            260,
            1.4,
            [
              [0.05, 0.05],
              [0.38, 0.22],
              [0.5, 0.0001],
            ],
            0.5,
          );
      },
      roar(k) {
        const b = bus();
        if (!b) return;
        const { ctx, out } = b;
        if (!roarN && k > 0.01) {
          const src = ctx.createBufferSource(),
            f = ctx.createBiquadFilter(),
            g = ctx.createGain();
          src.buffer = noiseOf(b);
          src.loop = true;
          f.type = 'bandpass';
          f.Q.value = 0.9;
          g.gain.value = 0.0001;
          src.connect(f);
          f.connect(g);
          g.connect(out);
          src.start();
          roarN = { src, f, g };
        }
        if (!roarN) return;
        const t = ctx.currentTime;
        roarN.g.gain.setTargetAtTime(Math.max(0.0001, 0.32 * k), t, 0.05);
        roarN.f.frequency.setTargetAtTime(300 + 2600 * k, t, 0.05);
        if (k <= 0.01) {
          roarN.src.stop(t + 0.3);
          roarN = null;
        }
      },
      ting() {
        const b = bus();
        if (!b) return;
        tone(b, 'sine', 2637, 2600, 0.12, 1.1);
        tone(b, 'sine', 3951, 3900, 0.05, 0.7);
      },
      thump() {
        const b = bus();
        if (!b) return;
        tone(b, 'sine', 90, 38, 0.7, 0.9);
        band(
          b,
          900,
          120,
          0.7,
          [
            [0.01, 0.35],
            [0.4, 0.0001],
          ],
          0.4,
        );
      },
      heart(n) {
        const b = bus();
        if (!b) return;
        for (let i = 0; i < (n || 2); i++) {
          const w = i * (0.62 + i * 0.12);
          tone(b, 'sine', 62, 48, 0.42, 0.16, w);
          tone(b, 'sine', 58, 44, 0.3, 0.14, w + 0.2);
        }
      },
    };
  }
  BK.SoulAudio = { create };
})(typeof self !== 'undefined' ? self : globalThis);
