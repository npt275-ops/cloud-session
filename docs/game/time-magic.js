/* Bể Kính · game/time-magic.js · Điều khiển phép thời gian: dừng, tua nhanh, tua lùi (design/ke-hoach-buoc-37.md)
 * Đồng hồ thế giới (G.timeCtl, game/loop.js đọc mỗi khung hình):
 *   frozen  đang dừng hay đang tua lùi: logic đứng im; mây, sóng, khói, thuyền, đạn, người trong làng đứng im giữa động tác
 *           (thời gian thế giới không trôi), chỉ linh hồn (người bị nhập hồn), máy quay, hiệu ứng phép vẫn chạy theo giờ thật
 *   mul     hệ số tốc độ logic: 0 khi dừng, tua lùi; FAST (rồi FAST2 sau FAST2_AFTER giây giữ) khi tua nhanh; 1 bình thường
 * Phép (luật, linh lực: logic/spells.js; ảnh trận: logic/timeline.js; hình ảnh: render/magic/time3d.js; âm thanh:
 * render/fx/magic-audio.js):
 *   toggleStop()  bật dừng (tốn linh lực một lần), bấm lại thì chạy tiếp; dừng lâu nhất STOP_MAX giây thật
 *   hold(id, bật) giữ tua nhanh ('timeFast') hay tua lùi ('timeBack'): tốn linh lực theo giây, hết thì tự thả
 * Tua lùi: mỗi BACK_STEP giây thật lùi về ảnh trận trước đó (chụp mỗi 3 ngày game, giữ 30 ngày); hết ảnh thì báo, tự thả.
 * Sau khi lùi: đánh dấu lại người bị nhập hồn (logic không giao việc), vẽ lại theo thế giới vừa đổi (G.citiesRun.resync).
 * Ảnh trận chụp lúc trình duyệt rảnh (chụp tốn vài chục mili giây ở cuối trận, không làm khựng khung hình đang chạy).
 * update(giây thật) mỗi khung hình (game/loop.js, sau game/possess.js). Ra khỏi thân thì mọi phép thời gian tắt.
 * Cần: logic/spells.js, logic/timeline.js, render/magic/time3d.js, render/fx/post3d.js, game/possess.js, game/cities.js. */
(function (root) {
  const BK = root.BK || (root.BK = {});
  const STOP_MAX = 8, // (giây thật) dừng thời gian lâu nhất mỗi lần
    FAST = 8, // tua nhanh: tốc độ logic gấp chừng này lần
    FAST2 = 16, // giữ quá FAST2_AFTER giây: nhanh hơn nữa
    FAST2_AFTER = 1.5,
    BACK_STEP = 0.45; // (giây thật) mỗi nấc tua lùi
  // hiệu ứng màn hình của từng trạng thái (render/fx/post3d.js): nhạt màu, phủ màu, gợn sóng
  const LOOK = {
    stop: { desat: 0.75, tint: 0.45, tintColor: [0.82, 0.88, 1.08], ripple: 0 },
    fast: { desat: 0.1, tint: 0.3, tintColor: [1.08, 1.0, 0.86], ripple: 0 },
    back: { desat: 0.45, tint: 0.55, tintColor: [1.1, 0.95, 0.78], ripple: 1 },
    none: { desat: 0, tint: 0, tintColor: null, ripple: 0 },
  };
  function setup(G) {
    const SP = BK.Spells,
      TL = BK.Timeline.create();
    const st = { stop: false, stopT: 0, fast: false, fastT: 0, back: false, backT: 0, look: { desat: 0, tint: 0, ripple: 0 }, color: [1, 1, 1], tick: 0 };
    const P = () => G.possess,
      inside = () => !!(P() && P().st.phase === 'in'),
      ctx = () => ({ inside: inside() });
    const say = (t) => G.spellbookUi && G.spellbookUi.say(t);
    const audio = () => G.spellbook && G.spellbook.audio;
    // chỗ chân nhân vật (hiệu ứng toả ra từ đây)
    function feet() {
      const p = P();
      const V = p && p.st.i >= 0 ? G.villageOf(p.st.i) : null,
        f = V ? V.folk(p.st.id) : null;
      return f ? f.rig.root.position : G.camera.position;
    }
    G.timeCtl = {
      get frozen() {
        return st.stop || st.back;
      },
      get mul() {
        return st.stop || st.back ? 0 : st.fast ? (st.fastT > FAST2_AFTER ? FAST2 : FAST) : 1;
      },
    };

    /* ----- dừng thời gian ----- */
    function toggleStop() {
      if (st.stop) return endStop();
      if (!inside()) return false;
      const r = SP.cast(G.world, 'timeStop', ctx());
      if (!r.ok) return r;
      endHold();
      st.stop = true;
      st.stopT = 0;
      G.time3d.stopOn(feet());
      if (audio()) audio().bell(true);
      return r;
    }
    function endStop() {
      if (!st.stop) return false;
      st.stop = false;
      G.time3d.stopOff(feet());
      if (audio()) audio().bell(false);
      return { ok: true };
    }

    /* ----- giữ: tua nhanh, tua lùi ----- */
    function hold(id, on) {
      if (!on) return endHold(id);
      if (!inside()) return false;
      const r = SP.channel(G.world, id, 0, ctx());
      if (!r.ok || SP.state(G.world).mana < 1) return say(SP.WHY.mana), false;
      endStop();
      if (id === 'timeFast') {
        st.back = false;
        st.fast = true;
        st.fastT = 0;
      } else if (id === 'timeBack') {
        if (!TL.count()) return say('Chưa có gì để lùi'), false;
        st.fast = false;
        st.back = true;
        st.backT = BACK_STEP; // (lùi nấc đầu ngay)
      }
      return true;
    }
    function endHold(id) {
      if (!id || id === 'timeFast') st.fast = false;
      if (!id || id === 'timeBack') st.back = false;
      return true;
    }
    // một nấc tua lùi: nạp ảnh trận trước đó vào thế giới đang chạy
    function stepBack() {
      const W = G.world,
        p = P().st,
        day = TL.back(W, G.citiesRun.revive);
      if (day == null) {
        endHold('timeBack');
        say('Không lùi được nữa');
        return;
      }
      // linh hồn vẫn ở trong thân: logic không giao việc cho người bị nhập (logic/brain.js)
      const S = W.islands[p.i],
        person = S && S.people.get(p.id);
      if (person) person.possessed = true;
      else {
        // (người bị nhập chưa có ở lúc đó: thoát nhập hồn)
        endHold();
        P().exit();
      }
      G.citiesRun.resync();
      G.time3d.step(feet());
      if (audio()) audio().tick(-1);
    }

    /* ----- mỗi khung hình ----- */
    function update(sec) {
      if (!(sec > 0)) return;
      const W = G.world;
      if (!inside() && (st.stop || st.fast || st.back)) {
        st.stop = st.fast = st.back = false;
      }
      // ảnh trận: tới lúc thì chụp khi trình duyệt rảnh (không chụp lúc đang dừng, đang lùi)
      if (W && !G.timeCtl.frozen && TL.due(W) && !st.pending) {
        st.pending = true;
        const job = () => {
          st.pending = false;
          if (!G.timeCtl.frozen) TL.capture(G.world);
        };
        if (root.requestIdleCallback) root.requestIdleCallback(job, { timeout: 1500 });
        else setTimeout(job, 0);
      }
      if (st.stop) {
        st.stopT += sec;
        if (st.stopT >= STOP_MAX) endStop();
      }
      if (st.fast) {
        st.fastT += sec;
        if (!SP.channel(W, 'timeFast', sec, ctx()).ok) {
          endHold('timeFast');
          say(SP.WHY.mana);
        } else G.time3d.fast(feet(), sec);
        st.tick -= sec * (st.fastT > FAST2_AFTER ? 2 : 1);
        if (st.tick <= 0) {
          st.tick = 0.25;
          if (audio()) audio().tick(1);
        }
      }
      if (st.back) {
        if (!SP.channel(W, 'timeBack', sec, ctx()).ok) {
          endHold('timeBack');
          say(SP.WHY.mana);
        } else {
          G.time3d.back(feet(), sec);
          st.backT += sec;
          if (st.backT >= BACK_STEP) {
            st.backT = 0;
            stepBack();
          }
        }
      }
      // hiệu ứng màn hình: chuyển dần về trạng thái hiện tại
      const want = st.back ? LOOK.back : st.stop ? LOOK.stop : st.fast ? LOOK.fast : LOOK.none,
        k = 1 - Math.exp(-sec * 5);
      if (want.tintColor) st.color = want.tintColor;
      for (const key of ['desat', 'tint', 'ripple']) st.look[key] += (want[key] - st.look[key]) * k;
      const fx = G.post.fx;
      fx.desat = st.look.desat;
      fx.tint = st.look.tint;
      fx.ripple = st.look.ripple;
      fx.tintColor = st.color;
    }
    G.timeMagic = {
      toggleStop,
      hold,
      update,
      timeline: TL,
      get stopped() {
        return st.stop;
      },
      get state() {
        return { stop: st.stop, fast: st.fast, back: st.back, snaps: TL.count(), oldest: TL.oldest() };
      },
    };
  }
  BK.TimeMagic = { setup, STOP_MAX, FAST, FAST2, BACK_STEP };
})(typeof self !== 'undefined' ? self : globalThis);
