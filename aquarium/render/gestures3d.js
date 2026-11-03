/* Bể Kính · render/gestures3d.js
 * Thư viện cử chỉ của NPC trong toàn bộ Chaos Sandbox: di chuyển, đứng chờ, giao tiếp, cảm xúc, lao động, tôn giáo,
 * chính trị, chiến đấu, đời sống, sinh tử. Mỗi cử chỉ là một công thức tư thế theo thời gian (không có tệp hoạt ảnh):
 *   pose(p, ph, u, t, K): p tư thế (khoá theo render/anim3d.js, cộng rx: ngả cả người, ty: hạ cả người),
 *   ph pha nhịp (radian), u tiến độ 0..1 của cử chỉ một lần, t thời gian (giây), K núm vặn từ gen (logic/brain.js).
 * Mỗi cử chỉ ghi: nhóm, tên, lặp hay một lần, thời lượng, tốc độ đi (nếu có), đồ cầm tay, và gen nào thường gọi tới nó.
 * Huấn luyện trên một NPC mẫu (render/model3d.js) trước, rồi áp cho mọi NPC. */
(function (root, factory) {
  const BK = root.BK || (root.BK = {});
  BK.Gestures3D = factory();
})(typeof self !== 'undefined' ? self : globalThis, function () {
  'use strict';
  const S = Math.sin, C = Math.cos, PI = Math.PI;
  const ease = (u) => u * u * (3 - 2 * u);
  const bump = (u, a, b) => (u < a || u > b ? 0 : S(((u - a) / (b - a)) * PI)); // nhô lên rồi hạ xuống trong khoảng a..b
  const ramp = (u, a, b) => ease(Math.max(0, Math.min(1, (u - a) / (b - a))));

  /* ---------- Các mảnh tư thế dùng chung ---------- */
  function legsWalk(p, ph, amp, K) {
    const s = S(ph);
    p.hxL = s * amp; p.hxR = -s * amp;
    p.kxL = Math.max(0, -S(ph - 0.6)) * amp * 1.4; p.kxR = Math.max(0, S(ph - 0.6)) * amp * 1.4;
    p.py = Math.abs(C(ph)) * 0.035 * (0.6 + K.stride); p.pry = s * 0.06;
  }
  function armsSwing(p, ph, amp) { p.sxL = -S(ph) * amp; p.sxR = S(ph) * amp; p.exL = p.exR = 0.25 + amp * 0.3; }
  const armL = (p, sx, sz, ex, sy) => { p.sxL = sx; p.szL = sz; p.exL = ex; p.syL = sy || 0; };
  const armR = (p, sx, sz, ex, sy) => { p.sxR = sx; p.szR = sz; p.exR = ex; p.syR = sy || 0; };
  const kneel = (p) => { p.ty = -0.36; p.hxL = p.hxR = 0.05; p.kxL = p.kxR = 1.55; p.cx += 0.05; };
  const sit = (p) => { p.ty = -0.42; p.hxL = p.hxR = 1.5; p.kxL = p.kxR = 1.5; };
  const crouch = (p, k) => { p.py = -0.12 * k; p.hxL = p.hxR = 0.5 * k; p.kxL = p.kxR = 0.9 * k; p.cx += 0.25 * k; };

  /* ---------- Danh sách cử chỉ ---------- */
  // g: nhóm, n: tên, loop: lặp lại, dur: giây (một lần), move: tốc độ đi (đơn vị mỗi giây, âm là lùi), prop: đồ cầm, gene: gen gọi tới
  const L = [];
  const add = (key, g, n, o, pose) => L.push(Object.assign({ key, g, n, loop: true, dur: 4, move: 0, prop: null, gene: '' }, o, { pose }));

  // ===== Di chuyển =====
  add('stand', 'Di chuyển', 'Đứng thở', { gene: 'mọi người' }, (p, ph, u, t) => { const b = S(t * 1.6) * 0.02; p.cx += b; p.hx = -b; });
  add('walk', 'Di chuyển', 'Đi bộ', { move: 1.1, gene: 'mọi người' }, (p, ph, u, t, K) => { legsWalk(p, ph, (0.28 + 0.3 * K.stride) * (0.7 + 0.5 * K.amplitude), K); armsSwing(p, ph, 0.25 + 0.45 * K.amplitude); });
  add('hurry', 'Di chuyển', 'Đi vội', { move: 2.0, gene: 'tham vọng, sợ hãi' }, (p, ph, u, t, K) => { legsWalk(p, ph, 0.5, K); armsSwing(p, ph, 0.6); p.cx += 0.15; });
  add('run', 'Di chuyển', 'Chạy', { move: 3.6, gene: 'hiếu chiến' }, (p, ph, u, t, K) => { legsWalk(p, ph, 0.75, K); p.kxL *= 1.5; p.kxR *= 1.5; armsSwing(p, ph, 0.9); p.exL = p.exR = 1.4; p.cx += 0.28; p.py *= 2; });
  add('panicRun', 'Di chuyển', 'Chạy hoảng loạn', { move: 3.2, gene: 'sợ hãi' }, (p, ph, u, t, K) => { legsWalk(p, ph, 0.7, K); p.cx += 0.2; armL(p, 2.3 + S(ph * 2.5) * 0.4, 0.5, 0.6); armR(p, 2.2 + S(ph * 2.5 + 1.5) * 0.4, 0.5, 0.6); p.hy = S(t * 1.6) * 0.9; });
  add('sneak', 'Di chuyển', 'Đi rón rén', { move: 0.6, gene: 'mưu mô, đa nghi' }, (p, ph, u, t, K) => { legsWalk(p, ph * 0.8, 0.3, K); crouch(p, 0.5); p.hxL += S(ph * 0.8) * 0.2; p.hxR -= S(ph * 0.8) * 0.2; armL(p, 0.5, 0.3, 1.3); armR(p, 0.5, 0.3, 1.3); p.hy = S(t * 0.9) * 0.6; });
  add('strut', 'Di chuyển', 'Đi khệnh khạng', { move: 0.9, gene: 'tham vọng (vua)' }, (p, ph, u, t, K) => { legsWalk(p, ph, 0.32, K); p.cx -= 0.14; p.hx = -0.12; armL(p, -0.2, 0.35, 0.3); armR(p, -0.2, 0.35, 0.3); p.pry = S(ph) * 0.15; });
  add('limp', 'Di chuyển', 'Đi khập khiễng', { move: 0.5, gene: 'bị thương, già' }, (p, ph, u, t, K) => { legsWalk(p, ph, 0.25, K); p.kxR = 0.1; p.hxR *= 0.4; p.prz = S(ph) * 0.12; p.cx += 0.2; p.py -= Math.max(0, S(ph)) * 0.05; armL(p, 0.1, 0.4, 0.5); });
  add('backAway', 'Di chuyển', 'Lùi lại', { move: -0.7, gene: 'sợ hãi, nhu nhược' }, (p, ph, u, t, K) => { legsWalk(p, -ph, 0.25, K); p.cx -= 0.2; armL(p, 0.9, 0.2, 0.4); armR(p, 0.9, 0.2, 0.4); p.hx = -0.1; });

  // ===== Đứng chờ (thói quen thừa hưởng từ cha mẹ) =====
  add('crossArms', 'Đứng chờ', 'Khoanh tay', { gene: 'thói quen' }, (p) => { armL(p, 0.75, -0.45, 1.95, 0.4); armR(p, 0.85, -0.45, 1.85, -0.4); });
  add('handsOnHips', 'Đứng chờ', 'Chống nạnh', { gene: 'thói quen, tham vọng' }, (p) => { armL(p, -0.1, 0.65, 1.7, -0.6); armR(p, -0.1, 0.65, 1.7, 0.6); p.cx -= 0.05; });
  add('handsBehind', 'Đứng chờ', 'Chắp tay sau lưng', { gene: 'thói quen, trí tuệ' }, (p) => { armL(p, -0.45, 0.05, 1.0, 0.5); armR(p, -0.45, 0.05, 1.0, -0.5); p.cx -= 0.04; });
  add('scratchHead', 'Đứng chờ', 'Gãi đầu', { gene: 'thói quen, nhu nhược' }, (p, ph, u, t) => { armR(p, 2.5, 0.55, 2.0 + S(t * 9) * 0.25); p.hz = 0.12; });
  add('rubHands', 'Đứng chờ', 'Xoa tay', { gene: 'thói quen, mưu mô' }, (p, ph, u, t) => { const r = S(t * 6) * 0.14; armL(p, 0.65, -0.28, 1.35, 0.3 + r); armR(p, 0.65, -0.28, 1.35, -0.3 + r); });
  add('sway', 'Đứng chờ', 'Đung đưa người', { gene: 'thói quen' }, (p, ph, u, t) => { p.prz = S(t * 1.2) * 0.07; p.pry = S(t * 0.6) * 0.1; p.hzL += 0.03; p.hzR += 0.03; });
  add('lookAround', 'Đứng chờ', 'Nhìn quanh', { gene: 'đa nghi' }, (p, ph, u, t) => { p.hy = S(t * 0.9) * 1.0; p.cy = S(t * 0.9) * 0.25; armL(p, 0.1, 0.1, 0.4); });
  add('tapFoot', 'Đứng chờ', 'Gõ chân sốt ruột', { gene: 'hiếu chiến, tham vọng' }, (p, ph, u, t) => { p.hxR = 0.15 + Math.max(0, S(t * 7)) * 0.2; p.kxR = 0.1; armL(p, 0.75, -0.45, 1.95, 0.4); armR(p, 0.85, -0.45, 1.85, -0.4); });

  // ===== Giao tiếp =====
  add('talk', 'Giao tiếp', 'Nói chuyện', { gene: 'mọi người' }, (p, ph, u, t, K) => { p.hx = S(t * 2.2) * 0.08; armR(p, 0.45 + S(t * 1.8) * 0.3 * (0.4 + K.amplitude), 0.15, 1.0 + S(t * 2.6) * 0.35); });
  add('nod', 'Giao tiếp', 'Gật đầu', { gene: 'nhu nhược' }, (p, ph, u, t) => { p.hx = Math.max(0, S(t * 5)) * 0.35; });
  add('shakeHead', 'Giao tiếp', 'Lắc đầu', { gene: 'đa nghi' }, (p, ph, u, t) => { p.hy = S(t * 7) * 0.45; armL(p, 0.75, -0.45, 1.95, 0.4); armR(p, 0.85, -0.45, 1.85, -0.4); });
  add('wave', 'Giao tiếp', 'Vẫy tay chào', { gene: 'mọi người' }, (p, ph, u, t) => { armR(p, 1.3, 1.1, 0.6 + S(t * 7) * 0.5); p.hz = -0.08; });
  add('point', 'Giao tiếp', 'Chỉ tay', { gene: 'tham vọng' }, (p, ph, u, t) => { armR(p, 1.5, 0.05, 0.05); p.cx += 0.05; p.hx = -0.05; });
  add('argue', 'Giao tiếp', 'Tranh cãi', { gene: 'hiếu chiến, đa nghi' }, (p, ph, u, t, K) => { p.cx += 0.14 + K.lean * 0.12; armR(p, 0.7 + S(t * 6) * 0.6 * (0.5 + K.amplitude), 0.25, 0.5 + 0.5 * S(t * 6 + 1)); armL(p, 0.4 + S(t * 4.5 + 2) * 0.5, 0.4, 0.9 + 0.4 * S(t * 5)); p.hx = -0.08 + S(t * 6) * 0.1; });
  add('laugh', 'Giao tiếp', 'Cười lớn', { gene: 'lễ hội' }, (p, ph, u, t) => { const b = Math.abs(S(t * 9)) * 0.12; p.cx = 0.15 + b; p.hx = -0.3; armL(p, 0.6, -0.2, 1.4); armR(p, 0.6, -0.2, 1.4); p.py = -b * 0.2; });
  add('whisper', 'Giao tiếp', 'Thì thầm', { gene: 'mưu mô' }, (p, ph, u, t) => { p.cx += 0.2; p.cy = 0.3; p.hz = 0.25; p.hy = 0.3; armR(p, 1.1, 0.4, 2.1, -0.4); });
  add('bow', 'Giao tiếp', 'Cúi chào', { loop: false, dur: 2.4, gene: 'nhu nhược, sùng đạo' }, (p, ph, u) => { const k = bump(u, 0, 1); p.cx = 0.9 * k; p.hx = 0.3 * k; armL(p, 0.2 * k, 0, 0.2); armR(p, 0.2 * k, 0, 0.2); });

  // ===== Cảm xúc =====
  add('cheer', 'Cảm xúc', 'Vui nhảy cẫng', { gene: 'lễ hội' }, (p, ph, u, t) => { const j = Math.max(0, S(t * 7)); p.ty = j * 0.22; armL(p, 2.6, 0.6, 0.3 + j * 0.3); armR(p, 2.6, 0.6, 0.3 + j * 0.3); p.kxL = p.kxR = (1 - j) * 0.6; p.hxL = p.hxR = (1 - j) * 0.3; });
  add('stomp', 'Cảm xúc', 'Giận dậm chân', { gene: 'hiếu chiến' }, (p, ph, u, t) => { const s = Math.max(0, S(t * 5)); p.hxR = s * 0.5; p.kxR = s * 0.8; armL(p, 0.4, 0.3, 1.6); armR(p, 0.4, 0.3, 1.6); p.cx += 0.12; p.hx = -0.1; });
  add('cower', 'Cảm xúc', 'Sợ co rúm', { gene: 'sợ hãi' }, (p, ph, u, t, K) => { crouch(p, 0.9); armL(p, 1.6, -0.1, 2.1); armR(p, 1.6, -0.1, 2.1); p.hx = 0.4; p.cx += S(t * 25) * 0.02 * (0.5 + K.jitter); });
  add('sad', 'Cảm xúc', 'Buồn cúi đầu', { gene: 'tang' }, (p) => { p.cx = 0.25; p.hx = 0.55; armL(p, 0.05, 0.02, 0.1); armR(p, 0.05, 0.02, 0.1); p.py = -0.02; });
  add('cry', 'Cảm xúc', 'Khóc, che mặt', { gene: 'tang, sợ hãi' }, (p, ph, u, t) => { p.cx = 0.3 + S(t * 6) * 0.04; p.hx = 0.45; armL(p, 1.6, -0.25, 2.2, 0.2); armR(p, 1.6, -0.25, 2.2, -0.2); });
  add('startle', 'Cảm xúc', 'Giật mình', { loop: false, dur: 1.6, gene: 'sợ hãi' }, (p, ph, u) => { const k = bump(u, 0, 0.6) + ramp(u, 0.3, 0.6) * 0.3; p.cx = -0.25 * k; p.hx = -0.3 * k; armL(p, 1.2 * k, 0.6 * k, 1.2 * k); armR(p, 1.2 * k, 0.6 * k, 1.2 * k); p.ty = bump(u, 0, 0.25) * 0.1; });
  add('think', 'Cảm xúc', 'Suy nghĩ, chống cằm', { gene: 'trí tuệ' }, (p, ph, u, t) => { armR(p, 1.15, -0.1, 2.35, -0.3); armL(p, 0.65, -0.45, 1.7, 0.5); p.hx = 0.1; p.hz = 0.15; p.hy = S(t * 0.4) * 0.2; });

  // ===== Lao động =====
  add('hoe', 'Lao động', 'Cuốc đất', { prop: 'hoe', gene: 'nông dân' }, (p, ph, u, t) => { const c = (t * 1.3) % 1, up = c < 0.6 ? ease(c / 0.6) : 1 - ease((c - 0.6) / 0.4); p.cx = 0.35 - up * 0.3; armR(p, 0.4 + up * 2.0, 0.1, 0.3); armL(p, 0.5 + up * 1.8, 0.05, 0.4); p.hxL = 0.3; p.kxL = 0.3; p.kxR = 0.2; });
  add('harvest', 'Lao động', 'Gặt lúa', { prop: 'sickle', gene: 'nông dân' }, (p, ph, u, t) => { crouch(p, 0.7); p.cx += 0.2; armR(p, 0.9, 0.3 + S(t * 4) * 0.5, 0.6, S(t * 4) * 0.6); armL(p, 1.0, -0.2, 0.8); });
  add('chop', 'Lao động', 'Chặt cây', { prop: 'axe', gene: 'thợ' }, (p, ph, u, t) => { const c = (t * 1.1) % 1, sw = c < 0.55 ? ease(c / 0.55) : 1 - ease((c - 0.55) / 0.45); p.cy = 0.6 - sw * 0.9; armR(p, 0.8 + sw * 0.6, 1.3 - sw * 0.8, 0.4); armL(p, 0.9 + sw * 0.5, 0.2, 0.6); p.hxL = 0.25; });
  add('mine', 'Lao động', 'Đập đá', { prop: 'hammer', gene: 'thợ cả' }, (p, ph, u, t) => { const c = (t * 1.4) % 1, up = c < 0.6 ? ease(c / 0.6) : 1 - ease((c - 0.6) / 0.4) * 1.1; p.cx = 0.4 - up * 0.35; armR(p, 0.6 + up * 2.2, 0.15, 0.4); armL(p, 0.7 + up * 2.0, 0.1, 0.4); crouch(p, 0.4); });
  add('carry', 'Lao động', 'Vác hàng trên vai', { prop: 'sack', move: 0.8, gene: 'thương nhân, dân' }, (p, ph, u, t, K) => { legsWalk(p, ph, 0.25, K); p.cx += 0.15; armR(p, 2.6, 0.5, 2.0); armL(p, -S(ph) * 0.3, 0.1, 0.4); });
  add('trade', 'Lao động', 'Trao đổi hàng', { prop: 'coin', loop: false, dur: 2.6, gene: 'thương chủ' }, (p, ph, u) => { const k = bump(u, 0.05, 0.85); armR(p, 0.4 + k * 1.0, 0.1, 0.7 - k * 0.5); p.cx = 0.1 + k * 0.1; p.hx = 0.1; });
  add('build', 'Lao động', 'Đóng búa xây nhà', { prop: 'hammer', gene: 'thợ cả' }, (p, ph, u, t) => { const h = Math.max(0, S(t * 8)); armR(p, 1.1 + h * 0.7, 0.2, 1.1 - h * 0.5); armL(p, 1.0, -0.15, 0.6); p.cx = 0.25; p.hx = 0.25; });

  // ===== Tôn giáo =====
  add('pray', 'Tôn giáo', 'Cầu nguyện', { gene: 'sùng đạo' }, (p, ph, u, t) => { p.cx = 0.28; p.hx = 0.45 + S(t * 1.2) * 0.04; armL(p, 0.85, -0.32, 1.75, 0.3); armR(p, 0.85, -0.32, 1.75, -0.3); p.kxL = p.kxR = 0.2; p.py = -0.03; });
  add('kneelPray', 'Tôn giáo', 'Quỳ lạy', { gene: 'sùng đạo' }, (p, ph, u, t) => { kneel(p); const b = Math.max(0, S(t * 1.4)); p.cx = 0.3 + b * 0.6; p.hx = 0.3; armL(p, 0.6 + b * 1.0, -0.3, 1.2); armR(p, 0.6 + b * 1.0, -0.3, 1.2); });
  add('rainDance', 'Tôn giáo', 'Giơ tay cầu mưa', { gene: 'sùng đạo (hạn hán)' }, (p, ph, u, t) => { armL(p, 2.8, 0.6 + S(t * 2) * 0.2, 0.2); armR(p, 2.8, 0.6 + S(t * 2 + 1) * 0.2, 0.2); p.hx = -0.45; p.cx = -0.1; p.prz = S(t * 1.5) * 0.06; });

  // ===== Chính trị =====
  add('speech', 'Chính trị', 'Diễn thuyết', { gene: 'tham vọng (vua, quân sư)' }, (p, ph, u, t) => { p.cx = -0.08; p.hx = -0.1; const k = Math.max(0, S(t * 2.2)); armR(p, 1.4 + k * 1.2, 0.5, 0.5 - k * 0.3); armL(p, 0.6 + S(t * 1.3) * 0.4, 0.5, 0.8); });
  add('command', 'Chính trị', 'Ra lệnh', { loop: false, dur: 2.2, gene: 'vua, tướng' }, (p, ph, u) => { const k = ramp(u, 0, 0.25) * (1 - ramp(u, 0.8, 1)); armR(p, 1.6 * k, 0.05, 0.05); p.cx = 0.08 * k; p.hx = -0.05; armL(p, -0.1, 0.65 * k, 1.7 * k, -0.6 * k); });
  add('declareWar', 'Chính trị', 'Tuyên chiến', { prop: 'spear', gene: 'hiếu chiến (vua, tướng)' }, (p, ph, u, t) => { const k = Math.max(0, S(t * 2.5)); armR(p, 2.9, 0.3, 0.1 + k * 0.4); armL(p, 0.4, 0.5, 1.6); p.hx = -0.35; p.cx = -0.1; p.ty = k * 0.05; });
  add('surrender', 'Chính trị', 'Đầu hàng', { gene: 'sợ hãi, nhu nhược' }, (p, ph, u, t) => { kneel(p); armL(p, 2.8, 0.55, 0.3); armR(p, 2.8, 0.55, 0.3); p.hx = 0.25; p.cx += S(t * 20) * 0.015; });
  add('submit', 'Chính trị', 'Quỳ thần phục', { gene: 'nhu nhược' }, (p) => { kneel(p); p.cx = 0.85; p.hx = 0.5; armL(p, 0.8, 0.3, 0.3); armR(p, 0.8, 0.3, 0.3); });
  add('crown', 'Chính trị', 'Đăng quang', { loop: false, dur: 3.2, prop: 'crown', gene: 'vua mới' }, (p, ph, u) => { const k = ramp(u, 0, 0.45), d = ramp(u, 0.55, 0.9); armL(p, 2.7 * k * (1 - d) + 0.1 * d, 0.3, 1.4 * k * (1 - d)); armR(p, 2.7 * k * (1 - d) + 0.1 * d, 0.3, 1.4 * k * (1 - d)); p.hx = -0.15 * k; p.cx = -0.05 * d; });

  // ===== Chiến đấu =====
  add('guard', 'Chiến đấu', 'Thủ thế', { prop: 'spearShield', gene: 'tướng, lính' }, (p, ph, u, t, K) => { p.hxL = 0.35; p.hxR = -0.3; p.kxL = 0.35; p.kxR = 0.4; p.py = -0.07; p.cx = 0.12 + K.lean * 0.1; armR(p, 0.9, 0.3, 0.9 + S(t * 3) * 0.08); armL(p, 1.2, 0.2, 1.5); p.pry = S(t * 2) * 0.05; });
  add('thrust', 'Chiến đấu', 'Đâm giáo', { prop: 'spear', gene: 'hiếu chiến' }, (p, ph, u, t, K) => { const c = (t * (1 + K.tempo * 0.6)) % 1, k = c < 0.35 ? ease(c / 0.35) : 1 - ease((c - 0.35) / 0.65); p.hxL = 0.4 + k * 0.2; p.hxR = -0.35; p.kxL = 0.4; p.kxR = 0.3; p.py = -0.07; p.cx = 0.1 + k * 0.35; armR(p, 1.2 + k * 0.4, 0.1, 1.6 - k * 1.5); armL(p, 1.1, 0.1, 1.2 - k * 0.8); });
  add('slash', 'Chiến đấu', 'Chém, bổ xuống', { prop: 'axe', gene: 'hiếu chiến, bạo chúa' }, (p, ph, u, t, K) => { const c = (t * (0.9 + K.tempo * 0.5)) % 1, up = c < 0.55 ? ease(c / 0.55) : 1 - ease((c - 0.55) / 0.45); p.cx = 0.05 + (1 - up) * 0.35; armR(p, 0.6 + up * 2.4, 0.3, 0.3 + up * 0.6); armL(p, 0.6, 0.4, 1.3); p.hxL = 0.35; p.hxR = -0.25; p.kxL = 0.35; p.kxR = 0.3; p.py = -0.06; });
  add('block', 'Chiến đấu', 'Đỡ đòn', { prop: 'shield', loop: false, dur: 1.6, gene: 'thận trọng' }, (p, ph, u) => { const k = bump(u, 0, 1); armL(p, 1.6 * k + 0.4, 0.2, 1.8 * k); p.cx = -0.15 * k; p.hx = 0.2 * k; p.hxL = 0.2; p.hxR = -0.2; p.kxL = p.kxR = 0.3; p.py = -0.06 * k; });
  add('hit', 'Chiến đấu', 'Bị đánh trúng', { loop: false, dur: 1.4, gene: 'thua trận' }, (p, ph, u) => { const k = bump(u, 0, 0.7); p.cx = -0.45 * k; p.hx = -0.45 * k; armL(p, 0.8 * k, 0.9 * k, 0.6); armR(p, 0.8 * k, 0.9 * k, 0.6); p.hxR = -0.3 * k; p.kxL = 0.3 * k; });
  add('fall', 'Chiến đấu', 'Ngã gục', { loop: false, dur: 3.2, gene: 'tử trận' }, (p, ph, u) => { const k = ramp(u, 0.15, 0.6); p.kxL = p.kxR = bump(u, 0, 0.4) * 1.2; p.rx = -1.52 * k; p.ty = 0.12 * k; armL(p, 2.2 * k, 0.8 * k, 0.2); armR(p, 2.0 * k, 0.9 * k, 0.3); p.hx = -0.3 * k; });
  add('victory', 'Chiến đấu', 'Mừng chiến thắng', { prop: 'spear', gene: 'thắng trận' }, (p, ph, u, t) => { const j = Math.max(0, S(t * 5)); armR(p, 2.8, 0.3, 0.2); armL(p, 1.4 + j * 1.2, 1.0, 1.4 - j); p.ty = j * 0.1; p.hx = -0.35; });

  // ===== Đời sống =====
  add('sit', 'Đời sống', 'Ngồi', { gene: 'nghỉ ngơi' }, (p, ph, u, t) => { sit(p); p.cx = 0.1; armL(p, 0.6, 0.15, 0.9); armR(p, 0.6, 0.15, 0.9); p.hx = S(t * 0.5) * 0.05; });
  add('eat', 'Đời sống', 'Ăn', { prop: 'bowl', gene: 'mọi người' }, (p, ph, u, t) => { sit(p); armL(p, 0.9, -0.2, 1.4); const s = Math.max(0, S(t * 3)); armR(p, 0.8 + s * 0.5, -0.25, 1.4 + s * 0.8); p.hx = 0.2 - s * 0.1; p.cx = 0.15; });
  add('drink', 'Đời sống', 'Uống', { prop: 'cup', loop: false, dur: 3, gene: 'lễ hội' }, (p, ph, u) => { const k = bump(u, 0.1, 0.9); armR(p, 0.7 + k * 0.8, -0.1, 1.5 + k * 0.6); p.hx = -0.45 * k; p.cx = -0.12 * k; });
  add('sleep', 'Đời sống', 'Ngủ', { gene: 'ban đêm' }, (p, ph, u, t) => { p.rx = -1.52; p.ty = 0.12; armL(p, 0.15, 0.25, 0.2); armR(p, 0.15, 0.25, 0.2); p.cx = S(t * 1.1) * 0.03; p.hz = 0.3; });
  add('holdBaby', 'Đời sống', 'Bế con', { prop: 'baby', gene: 'cha mẹ' }, (p, ph, u, t) => { armL(p, 0.7, -0.3, 1.7, 0.3); armR(p, 0.75, -0.3, 1.55, -0.3); p.pry = S(t * 1.2) * 0.12; p.hx = 0.35; p.hy = -0.15; });
  add('dance', 'Đời sống', 'Nhảy múa lễ hội', { gene: 'lễ hội' }, (p, ph, u, t) => { const s = S(t * 4); p.pry = s * 0.35; p.prz = S(t * 8) * 0.06; armL(p, 1.5 + s * 0.8, 1.0, 0.8 + C(t * 4) * 0.5); armR(p, 1.5 - s * 0.8, 1.0, 0.8 - C(t * 4) * 0.5); p.hxL = Math.max(0, s) * 0.4; p.hxR = Math.max(0, -s) * 0.4; p.kxL = Math.max(0, s) * 0.5; p.kxR = Math.max(0, -s) * 0.5; p.ty = Math.abs(S(t * 4)) * 0.05; });

  // ===== Sinh tử =====
  add('elder', 'Sinh tử', 'Già yếu chống gậy', { prop: 'cane', move: 0.35, gene: 'tuổi già' }, (p, ph, u, t, K) => { legsWalk(p, ph * 0.7, 0.15, K); p.cx = 0.45; p.hx = -0.3; armR(p, 0.6 + S(ph * 0.7) * 0.15, 0.25, 0.3); armL(p, -0.3, 0.1, 0.8); p.kxL += 0.15; p.kxR += 0.15; });
  add('sick', 'Sinh tử', 'Ốm, ôm bụng', { gene: 'dịch bệnh, đói' }, (p, ph, u, t) => { crouch(p, 0.4); p.cx += 0.35; armL(p, 0.7, -0.4, 1.6); armR(p, 0.7, -0.4, 1.6); p.prz = S(t * 1.3) * 0.05; p.hx = 0.3; });
  add('die', 'Sinh tử', 'Qua đời', { loop: false, dur: 4.5, gene: 'tuổi già, chiến tranh' }, (p, ph, u) => { const a = ramp(u, 0, 0.35), b = ramp(u, 0.35, 0.75); p.kxL = p.kxR = 1.55 * a * (1 - b); p.ty = -0.36 * a * (1 - b) + 0.12 * b; p.rx = 1.5 * b; p.cx = 0.3 * a; p.hx = 0.4 * a; armL(p, 0.3 * (1 - b), 0.2 + 0.4 * b, 0.4); armR(p, 0.3 * (1 - b), 0.2 + 0.4 * b, 0.4); });

  /* ---------- Biểu cảm khuôn mặt đi kèm mỗi cử chỉ (render/face3d.js); 'closed': nhắm mắt ---------- */
  const FACE = {
    happy: ['cheer', 'laugh', 'dance', 'victory', 'wave', 'holdBaby', 'eat', 'drink', 'crown', 'speech', 'strut', 'trade'],
    sad: ['sad', 'cry', 'limp', 'elder', 'sick', 'submit', 'die'],
    angry: ['argue', 'stomp', 'thrust', 'slash', 'declareWar', 'command', 'guard', 'tapFoot', 'point', 'chop', 'mine'],
    fear: ['panicRun', 'cower', 'backAway', 'surrender', 'block', 'fall'],
    surprise: ['startle', 'hit'],
    suspicious: ['sneak', 'lookAround', 'whisper', 'shakeHead', 'rubHands', 'crossArms'],
  };
  const CLOSED = ['sleep', 'pray', 'kneelPray', 'die'];
  for (const G of L) { G.face = 'neutral'; G.closed = CLOSED.includes(G.key); }
  for (const f in FACE) for (const k of FACE[f]) { const G = L.find((x) => x.key === k); if (G) G.face = f; }

  const BY_KEY = {}; for (const G of L) BY_KEY[G.key] = G;
  const GROUPS = [...new Set(L.map((G) => G.g))];
  return { LIST: L, BY_KEY, GROUPS, ease, bump, ramp };
});
