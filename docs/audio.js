/* Bể Kính · audio.js · Âm thanh tự sinh bằng Web Audio (không dùng file âm thanh nào).
 * Nền: gió, mưa, tiếng xì xào đám đông. Điểm xuyết: chim hót ban ngày, dế kêu ban đêm, hộp nhạc ngũ cung.
 * Hiệu ứng: đồng xu rơi, khởi công, sóng chính sách, pháo hoa.
 * Chỉ khởi động sau khi người dùng bấm (chính sách tự phát âm thanh của trình duyệt). */
(function (root) {
  'use strict';
  const PENTA = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5];

  function create() {
    let ctx = null,
      master = null,
      on = false;
    let windG, windF, rainG, murmurG, muff;
    const timers = new Set();
    const st = { day: 1, night: 0, rain: 0, snow: 0, festival: 0, panic: 0, drought: 0, winter: 0 };

    function noiseBuffer(type) {
      const len = ctx.sampleRate * 2,
        buf = ctx.createBuffer(1, len, ctx.sampleRate),
        d = buf.getChannelData(0);
      let b0 = 0,
        b1 = 0,
        b2 = 0,
        last = 0;
      for (let i = 0; i < len; i++) {
        const w = Math.random() * 2 - 1;
        if (type === 'pink') {
          b0 = 0.99765 * b0 + w * 0.099046;
          b1 = 0.963 * b1 + w * 0.2965164;
          b2 = 0.57 * b2 + w * 1.0526913;
          d[i] = (b0 + b1 + b2 + w * 0.1848) * 0.11;
        } else if (type === 'brown') {
          last = (last + 0.02 * w) / 1.02;
          d[i] = last * 3.5;
        } else d[i] = w;
      }
      return buf;
    }
    function loop(buf) {
      const s = ctx.createBufferSource();
      s.buffer = buf;
      s.loop = true;
      s.start();
      return s;
    }
    function out(vol, pan) {
      const g = ctx.createGain();
      g.gain.value = vol;
      if (ctx.createStereoPanner && pan) {
        const p = ctx.createStereoPanner();
        p.pan.value = pan;
        g.connect(p);
        p.connect(master);
      } else g.connect(master);
      return g;
    }

    function setup() {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      ctx = new AC();
      const comp = ctx.createDynamicsCompressor();
      comp.connect(ctx.destination);
      master = ctx.createGain();
      master.gain.value = 0;
      // bịt tai (cú nhập hồn, render/fx/soul-audio.js muffle): lọc trầm trên đường ra chung, bình thường mở hết
      muff = ctx.createBiquadFilter();
      muff.type = 'lowpass';
      muff.frequency.value = 20000;
      master.connect(muff);
      muff.connect(comp);
      windF = ctx.createBiquadFilter();
      windF.type = 'lowpass';
      windF.frequency.value = 480;
      windG = ctx.createGain();
      windG.gain.value = 0.04;
      loop(noiseBuffer('pink')).connect(windF);
      windF.connect(windG);
      windG.connect(master);
      const hp = ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 900;
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 6500;
      rainG = ctx.createGain();
      rainG.gain.value = 0;
      loop(noiseBuffer('white')).connect(hp);
      hp.connect(lp);
      lp.connect(rainG);
      rainG.connect(master);
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = 380;
      bp.Q.value = 0.8;
      murmurG = ctx.createGain();
      murmurG.gain.value = 0;
      loop(noiseBuffer('brown')).connect(bp);
      bp.connect(murmurG);
      murmurG.connect(master);
      return true;
    }

    /* ----- âm thanh điểm xuyết ----- */
    function chirp() {
      const t = ctx.currentTime,
        n = 2 + Math.floor(Math.random() * 3),
        base = 2600 + Math.random() * 1500;
      const o = out(0.045 * st.day, Math.random() * 1.6 - 0.8);
      for (let k = 0; k < n; k++) {
        const osc = ctx.createOscillator(),
          g = ctx.createGain(),
          t0 = t + k * (0.09 + Math.random() * 0.05);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(base, t0);
        osc.frequency.exponentialRampToValueAtTime(base * (1.3 + Math.random() * 0.4), t0 + 0.06);
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.exponentialRampToValueAtTime(1, t0 + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.085);
        osc.connect(g);
        g.connect(o);
        osc.start(t0);
        osc.stop(t0 + 0.1);
      }
    }
    function cricket() {
      const t = ctx.currentTime,
        o = out(0.01 * st.night, Math.random() * 1.4 - 0.7),
        f = 4200 + Math.random() * 500;
      for (let k = 0; k < 3 + Math.floor(Math.random() * 3); k++) {
        const osc = ctx.createOscillator(),
          g = ctx.createGain(),
          t0 = t + k * 0.055;
        osc.type = 'square';
        osc.frequency.value = f;
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.exponentialRampToValueAtTime(1, t0 + 0.008);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.04);
        osc.connect(g);
        g.connect(o);
        osc.start(t0);
        osc.stop(t0 + 0.05);
      }
    }
    function note(freq, vol, len, bell, when) {
      const t = (when || ctx.currentTime) + 0.01,
        o = out(vol, Math.random() * 0.8 - 0.4);
      const parts = bell
        ? [
            [1, 1],
            [2.76, 0.35],
            [5.4, 0.12],
          ]
        : [
            [1, 1],
            [2, 0.18],
          ];
      for (const [mul, amp] of parts) {
        const osc = ctx.createOscillator(),
          g = ctx.createGain();
        osc.type = bell ? 'sine' : 'triangle';
        osc.frequency.value = freq * mul;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(amp, t + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, t + len);
        osc.connect(g);
        g.connect(o);
        osc.start(t);
        osc.stop(t + len + 0.05);
      }
    }
    function musicBox() {
      const oct = st.night > 0.5 ? 0.5 : 1,
        f = PENTA[Math.floor(Math.random() * PENTA.length)] * oct;
      note(f, (0.05 + 0.03 * st.festival) * (1 - 0.5 * st.panic), 1.8, st.festival > 0.5);
      if (Math.random() < 0.35)
        note(PENTA[Math.floor(Math.random() * PENTA.length)] * oct, 0.03, 1.6, st.festival > 0.5, ctx.currentTime + 0.32);
    }
    function burst(len, type, freq, vol) {
      const t = ctx.currentTime,
        src = ctx.createBufferSource(),
        f = ctx.createBiquadFilter(),
        g = ctx.createGain();
      src.buffer = noiseBuffer('white');
      f.type = type;
      f.frequency.value = freq;
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + len);
      src.connect(f);
      f.connect(g);
      g.connect(master);
      src.start(t);
      src.stop(t + len + 0.05);
    }

    /* ----- lịch phát ngẫu nhiên ----- */
    function every(min, max, fn) {
      const tick = () => {
        if (!on) return;
        try {
          fn();
        } catch (e) {
          /* bỏ qua một nốt lỗi, không dừng cả bản nhạc */
        }
        const id = setTimeout(
          () => {
            timers.delete(id);
            tick();
          },
          min + Math.random() * (max - min),
        );
        timers.add(id);
      };
      const id = setTimeout(() => {
        timers.delete(id);
        tick();
      }, Math.random() * max);
      timers.add(id);
    }
    function startLoops() {
      every(1300, 4500, () => {
        if (st.day > 0.5 && st.rain < 0.3 && st.snow < 0.3 && st.winter < 0.5) chirp();
      });
      every(600, 1600, () => {
        if (st.night > 0.5 && st.rain < 0.3 && st.winter < 0.5) cricket();
      });
      every(2400, 5600, () => {
        if (st.festival > 0.5 || Math.random() < 0.8) musicBox();
      });
    }

    /* ----- giao diện công khai ----- */
    function ramp(param, v, sec) {
      if (!ctx) return;
      param.cancelScheduledValues(ctx.currentTime);
      param.setTargetAtTime(v, ctx.currentTime, sec || 0.6);
    }
    return {
      get on() {
        return on;
      },
      enable() {
        if (!ctx && !setup()) return false;
        if (ctx.state === 'suspended') ctx.resume();
        on = true;
        ramp(master.gain, 0.8, 0.6);
        startLoops();
        return true;
      },
      disable() {
        on = false;
        for (const id of timers) clearTimeout(id);
        timers.clear();
        if (master) ramp(master.gain, 0, 0.25);
      },
      suspend() {
        if (ctx && ctx.state === 'running') ctx.suspend();
      },
      resume() {
        if (ctx && on && ctx.state === 'suspended') ctx.resume();
      },
      // cho phần âm thanh riêng của cú nhập hồn (render/fx/soul-audio.js): nguồn âm, đường ra chung, tiếng ồn; null khi đang tắt tiếng
      bus() {
        return ctx && on ? { ctx, out: master, noise: noiseBuffer } : null;
      },
      // bịt tai: lọc bỏ âm cao trên chừng hz, chuyển dần trong sec giây (20000: mở hết)
      muffle(hz, sec) {
        if (muff) ramp(muff.frequency, hz, sec || 0.2);
      },
      setState(s) {
        Object.assign(st, s);
        if (!ctx || !on) return;
        ramp(windG.gain, 0.03 + 0.03 * st.snow + 0.03 * st.drought + 0.01 * st.night, 1.5);
        ramp(windF.frequency, 420 + 380 * st.snow + 200 * st.drought, 1.5);
        ramp(rainG.gain, 0.1 * st.rain, 1.2);
        ramp(murmurG.gain, 0.08 * st.panic, 1.0);
      },
      coin() {
        if (!ctx || !on) return;
        for (let k = 0; k < 26; k++)
          note(PENTA[Math.floor(Math.random() * PENTA.length)] * 2, 0.025, 0.25, true, ctx.currentTime + Math.random() * 2);
      },
      build() {
        if (!ctx || !on) return;
        const t = ctx.currentTime,
          osc = ctx.createOscillator(),
          g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(130, t);
        osc.frequency.exponentialRampToValueAtTime(42, t + 0.35);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.35, t + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
        osc.connect(g);
        g.connect(master);
        osc.start(t);
        osc.stop(t + 0.45);
        burst(0.3, 'lowpass', 700, 0.15);
        [0, 2, 4].forEach((i, k) => note(PENTA[i], 0.05, 0.9, false, t + 0.25 + k * 0.12));
      },
      whoosh() {
        if (!ctx || !on) return;
        const t = ctx.currentTime,
          src = ctx.createBufferSource(),
          f = ctx.createBiquadFilter(),
          g = ctx.createGain();
        src.buffer = noiseBuffer('pink');
        f.type = 'bandpass';
        f.Q.value = 1.2;
        f.frequency.setValueAtTime(300, t);
        f.frequency.exponentialRampToValueAtTime(1800, t + 0.45);
        f.frequency.exponentialRampToValueAtTime(400, t + 0.9);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.3, t + 0.2);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.95);
        src.connect(f);
        f.connect(g);
        g.connect(master);
        src.start(t);
        src.stop(t + 1);
      },
      chime() {
        if (!ctx || !on) return;
        [0, 2, 4, 5, 3].forEach((i, k) => note(PENTA[i] * 2, 0.06, 1.4, true, ctx.currentTime + k * 0.09));
      },
      horn() {
        if (!ctx || !on) return;
        const t = ctx.currentTime;
        for (const [f, d] of [
          [146.8, 0],
          [196, 0.55],
        ]) {
          const o = ctx.createOscillator(),
            g = ctx.createGain(),
            lp = ctx.createBiquadFilter();
          o.type = 'sawtooth';
          o.frequency.value = f;
          lp.type = 'lowpass';
          lp.frequency.value = 700;
          g.gain.setValueAtTime(0.0001, t + d);
          g.gain.exponentialRampToValueAtTime(0.12, t + d + 0.12);
          g.gain.exponentialRampToValueAtTime(0.0001, t + d + 0.9);
          o.connect(lp);
          lp.connect(g);
          g.connect(master);
          o.start(t + d);
          o.stop(t + d + 1);
        }
      },
      crackle() {
        if (!ctx || !on) return;
        for (let k = 0; k < 14; k++)
          setTimeout(
            () => on && burst(0.05 + Math.random() * 0.06, 'highpass', 1200 + Math.random() * 2400, 0.08),
            k * 90 + Math.random() * 60,
          );
        burst(1.2, 'lowpass', 400, 0.08);
      },
      // gõ lên vòm kính: tiếng "cạch" trong và ngân, gõ càng mạnh càng trầm, mức 3 trở lên có tiếng rền
      knock(level) {
        if (!ctx || !on) return;
        const t = ctx.currentTime,
          lv = level || 1;
        for (let k = 0; k < Math.min(3, lv); k++) {
          const t0 = t + k * 0.12,
            o = ctx.createOscillator(),
            g = ctx.createGain();
          o.type = 'sine';
          o.frequency.setValueAtTime(1300 - lv * 140, t0);
          o.frequency.exponentialRampToValueAtTime(640, t0 + 0.2);
          g.gain.setValueAtTime(0.0001, t0);
          g.gain.exponentialRampToValueAtTime(0.3, t0 + 0.004);
          g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.5 + lv * 0.25);
          o.connect(g);
          g.connect(master);
          o.start(t0);
          o.stop(t0 + 1.6);
        }
        burst(0.05, 'highpass', 2600, 0.2);
        if (lv >= 3) {
          const o = ctx.createOscillator(),
            g = ctx.createGain();
          o.type = 'sine';
          o.frequency.value = 55;
          g.gain.setValueAtTime(0.0001, t);
          g.gain.exponentialRampToValueAtTime(0.45, t + 0.04);
          g.gain.exponentialRampToValueAtTime(0.0001, t + 1.4);
          o.connect(g);
          g.connect(master);
          o.start(t);
          o.stop(t + 1.5);
        }
      },
      whisper() {
        if (!ctx || !on) return;
        const t = ctx.currentTime,
          src = ctx.createBufferSource(),
          f = ctx.createBiquadFilter(),
          g = ctx.createGain();
        src.buffer = noiseBuffer('white');
        f.type = 'bandpass';
        f.Q.value = 2.5;
        f.frequency.setValueAtTime(2800, t);
        f.frequency.linearRampToValueAtTime(1700, t + 1.2);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.1, t + 0.3);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 1.3);
        src.connect(f);
        f.connect(g);
        g.connect(master);
        src.start(t);
        src.stop(t + 1.35);
      },
      firework() {
        if (ctx && on) {
          burst(0.12, 'highpass', 1800, 0.12);
          setTimeout(() => on && burst(0.5, 'bandpass', 2400, 0.05), 140);
        }
      },
      // thiên tai: đất rền, gió xoáy, sấm, sóng dữ; chiến trận: gươm khua, súng nổ, pháo, tia laser
      rumble(sec) {
        if (!ctx || !on) return;
        const t = ctx.currentTime,
          L = sec || 3,
          src = ctx.createBufferSource(),
          f = ctx.createBiquadFilter(),
          g = ctx.createGain();
        src.buffer = noiseBuffer('brown');
        f.type = 'lowpass';
        f.frequency.value = 140;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.9, t + 0.3);
        g.gain.exponentialRampToValueAtTime(0.0001, t + L);
        src.connect(f);
        f.connect(g);
        g.connect(master);
        src.start(t);
        src.stop(t + L + 0.1);
        const o = ctx.createOscillator(),
          og = ctx.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(42, t);
        o.frequency.linearRampToValueAtTime(30, t + L);
        og.gain.setValueAtTime(0.0001, t);
        og.gain.exponentialRampToValueAtTime(0.4, t + 0.2);
        og.gain.exponentialRampToValueAtTime(0.0001, t + L);
        o.connect(og);
        og.connect(master);
        o.start(t);
        o.stop(t + L + 0.1);
      },
      gust(sec) {
        if (!ctx || !on) return;
        const t = ctx.currentTime,
          L = sec || 5,
          src = ctx.createBufferSource(),
          f = ctx.createBiquadFilter(),
          g = ctx.createGain();
        src.buffer = noiseBuffer('pink');
        f.type = 'bandpass';
        f.Q.value = 3;
        for (let k = 0; k <= 10; k++) f.frequency.setValueAtTime(260 + 500 * Math.abs(Math.sin(k * 1.3)), t + (k / 10) * L);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.55, t + 0.8);
        g.gain.setValueAtTime(0.55, t + L - 1);
        g.gain.exponentialRampToValueAtTime(0.0001, t + L);
        src.connect(f);
        f.connect(g);
        g.connect(master);
        src.start(t);
        src.stop(t + L + 0.1);
      },
      thunder() {
        if (ctx && on) {
          burst(0.18, 'highpass', 900, 0.5);
          setTimeout(() => {
            if (on) this.rumble(2.2);
          }, 120);
        }
      },
      surge(sec) {
        if (!ctx || !on) return;
        const t = ctx.currentTime,
          L = sec || 3,
          src = ctx.createBufferSource(),
          f = ctx.createBiquadFilter(),
          g = ctx.createGain();
        src.buffer = noiseBuffer('pink');
        f.type = 'lowpass';
        f.frequency.setValueAtTime(300, t);
        f.frequency.exponentialRampToValueAtTime(2200, t + L * 0.6);
        f.frequency.exponentialRampToValueAtTime(400, t + L);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.7, t + L * 0.6);
        g.gain.exponentialRampToValueAtTime(0.0001, t + L);
        src.connect(f);
        f.connect(g);
        g.connect(master);
        src.start(t);
        src.stop(t + L + 0.1);
      },
      bless() {
        if (ctx && on) [0, 2, 4, 2, 5].forEach((i, k) => note(PENTA[i] * 2, 0.05, 2.2, true, ctx.currentTime + k * 0.16));
      },
      clash() {
        if (ctx && on) {
          burst(0.07, 'bandpass', 3400 + Math.random() * 1600, 0.12);
          setTimeout(() => on && burst(0.05, 'bandpass', 4200, 0.07), 60);
        }
      },
      shot(era) {
        if (ctx && on) burst(era >= 5 ? 0.06 : 0.14, era >= 5 ? 'highpass' : 'lowpass', era >= 5 ? 1400 : 900, era >= 5 ? 0.16 : 0.22);
      },
      boom(big) {
        if (!ctx || !on) return;
        const t = ctx.currentTime,
          L = big ? 2.2 : 0.9;
        burst(L, 'lowpass', big ? 220 : 480, big ? 0.9 : 0.4);
        const o = ctx.createOscillator(),
          g = ctx.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(big ? 70 : 120, t);
        o.frequency.exponentialRampToValueAtTime(30, t + L);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(big ? 0.7 : 0.3, t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t + L);
        o.connect(g);
        g.connect(master);
        o.start(t);
        o.stop(t + L + 0.05);
      },
      laser() {
        if (!ctx || !on) return;
        const t = ctx.currentTime,
          o = ctx.createOscillator(),
          g = ctx.createGain();
        o.type = 'sawtooth';
        o.frequency.setValueAtTime(2400, t);
        o.frequency.exponentialRampToValueAtTime(300, t + 0.18);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.06, t + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
        o.connect(g);
        g.connect(master);
        o.start(t);
        o.stop(t + 0.22);
      },
    };
  }
  root.CityAudio = { create };
})(typeof self !== 'undefined' ? self : this);
