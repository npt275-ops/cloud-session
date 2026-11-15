/* Bể Kính · render/body/swim3d.js · Người ở dưới nước: lơ lửng và bơi (dùng cho mọi người trong làng và nhân vật nhập hồn)
 * Khi nước ngập chân quá IN (Đại hồng thuỷ dâng nước, sau này: lặn biển):
 *   folk(f, độSâu, giây, t, lái)  chuyển dần sang tư thế bơi (f.swimK 0..1); người trong làng (không bị lái) nổi lên lơ lửng
 *                                 giữa nước (cách đáy FLOAT, không quá sát mặt nước), nhấp nhô; nước rút thì rơi dần xuống
 *                                 đất. Nhân vật nhập hồn: độ cao do game/possess-swim.js đặt (f.lift), ở đây chỉ chuyển tư thế
 *   pose(f, tgt, t)               tư thế: đang đi thì bơi sải (người ngả gần nằm ngang, hai tay quạt luân phiên qua đầu, chân
 *                                 đập nước), đứng yên thì đạp nước (người ngả tới, ngẩng đầu, tay quạt rộng, chân co đạp ếch);
 *                                 hoà với tư thế thường theo f.swimK (render/village3d.js gọi sau render/body/motion3d.js)
 *   bubbles(G, chỗ, giây)         bọt khí nhỏ thở ra, nổi lên (nhân vật nhập hồn: game/possess.js)
 * Không biết logic, chỉ đọc độ sâu nước (BK.seaLevel: sea3d.js). Cần: render/anim3d.js (tên khớp trong tgt). */
(function (root) {
  const BK = root.BK || (root.BK = {});
  const IN = 1.1, // (đơn vị) nước ngập chân quá chừng này thì bơi (cùng ngưỡng game/possess-swim.js DEPTH_IN)
    FLOAT = 1.4, // người trong làng lơ lửng cách đáy chừng này
    BELOW = 1.5, // ... nhưng thấp hơn mặt nước ít nhất chừng này
    BOB = 0.14,
    BLEND = 4, // (mỗi giây) vào, ra tư thế bơi
    STROKE = 4.6, // (radian mỗi giây) nhịp quạt tay khi bơi sải
    TREAD = 2.4; // nhịp đạp nước
  const clamp = (x, a, b) => (x < a ? a : x > b ? b : x);
  function folk(f, depth, sec, t, driven) {
    const on = depth > IN;
    f.swimK = (f.swimK || 0) + ((on ? 1 : 0) - (f.swimK || 0)) * Math.min(1, sec * BLEND);
    f.swimMove = (f.swimMove || 0) + ((f.moving ? 1 : 0) - (f.swimMove || 0)) * Math.min(1, sec * 3);
    if (driven) return;
    if (on) {
      const want = clamp(Math.min(FLOAT, depth - BELOW), 0.4, 99) + BOB * Math.sin(t * 1.6 + (f.seedSwim || (f.seedSwim = Math.random() * 6)));
      f.lift = (f.lift || 0) + (want - (f.lift || 0)) * Math.min(1, sec * 1.2);
      f.swimLift = true;
    } else if (f.swimLift) {
      f.lift = Math.max(0, (f.lift || 0) - sec * 3); // (nước rút: rơi dần xuống đất)
      if (!f.lift) f.swimLift = false;
    }
  }
  // một khớp về giá trị bơi theo độ hoà k
  const mix = (tgt, key, v, k) => (tgt[key] = (tgt[key] || 0) + (v - (tgt[key] || 0)) * k);
  function pose(f, tgt, t) {
    const k = f.swimK || 0;
    if (k < 0.01) return;
    const m = f.swimMove || 0,
      s = f.seedSwim || 0,
      a = t * STROKE + s, // bơi sải
      b = t * TREAD + s; // đạp nước
    const set = (key, crawl, tread) => mix(tgt, key, crawl * m + tread * (1 - m), k);
    set('rx', 1.25, 0.42); // ngả người: gần nằm ngang khi bơi, ngả tới khi đạp nước
    set('hx', -0.95, -0.4); // ngẩng đầu nhìn tới
    set('cx', -0.12, 0.05);
    set('sxL', 2.4 + 1.4 * Math.sin(a), 0.6 + 0.45 * Math.sin(b)); // tay quạt luân phiên qua đầu / quạt rộng hai bên
    set('sxR', 2.4 + 1.4 * Math.sin(a + Math.PI), 0.6 + 0.45 * Math.sin(b));
    set('szL', 0.2, 1.3 + 0.35 * Math.sin(b));
    set('szR', 0.2, 1.3 + 0.35 * Math.sin(b));
    set('exL', 0.25 + 0.45 * Math.max(0, Math.cos(a)), 0.55);
    set('exR', 0.25 + 0.45 * Math.max(0, Math.cos(a + Math.PI)), 0.55);
    set('hxL', 0.28 * Math.sin(a * 2), 0.9 + 0.45 * Math.sin(b)); // chân đập nước / co đạp kiểu ếch
    set('hxR', -0.28 * Math.sin(a * 2), 0.9 + 0.45 * Math.sin(b));
    set('kxL', 0.25 + 0.25 * Math.max(0, Math.sin(a * 2)), 1.3 + 0.6 * Math.sin(b + 0.9));
    set('kxR', 0.25 + 0.25 * Math.max(0, -Math.sin(a * 2)), 1.3 + 0.6 * Math.sin(b + 0.9));
    mix(tgt, 'ty', 0, k); // (không ngồi, không quỳ dưới nước)
  }
  const _v = { x: 0, y: 0, z: 0 };
  function bubbles(G, at, sec) {
    if (!G.vfx || Math.random() > sec * 5) return;
    const n = 1 + Math.floor(Math.random() * 3);
    for (let i = 0; i < n; i++) {
      _v.x = (Math.random() - 0.5) * 0.3;
      _v.y = 1.2 + Math.random() * 0.8;
      _v.z = (Math.random() - 0.5) * 0.3;
      G.vfx.spawn('glow', at, _v, { life: 1.6, size: [0.07 + Math.random() * 0.05, 0.1], color: ['#e8f8ff', '#bfe9f5'], alpha: 0.7, drag: 0.5 });
    }
  }
  BK.Swim3D = { folk, pose, bubbles, IN };
})(typeof self !== 'undefined' ? self : globalThis);
