/* Bể Kính · render/body/motion3d.js · Cử động có sức nặng cho nhân vật người chơi (design/ke-hoach-buoc-33.md mục 2)
 * Dùng cho người có f.motion (game/possess.js gắn vào người đang bị nhập hồn; sau này cả người ở gần). render/village3d.js
 * gọi hai chỗ:
 *   pose(f, tgt, giây)  trước Anim.apply: ghi đè tư thế đích bằng dáng đi, chạy, nhảy, đứng mới
 *   root(f)             sau khi đặt gốc khung: nghiêng người khi rẽ, ngả tới khi tăng tốc, ngả sau khi phanh
 * Khác với dáng đi chung (render/anim3d.js):
 *   tốc độ đo từ quãng đường thật mỗi khung hình (không theo trạng thái), đi và chạy trộn liền theo tốc độ, bước dài và nhịp
 *   theo tốc độ (chân không trượt); hông nhún hai lần mỗi chu kỳ, xoay hông, vai xoay ngược hông, tay đánh theo chân;
 *   đầu giữ thăng bằng và nhìn trước vào hướng rẽ; đầu, ngực, hai tay đi qua lò xo (theo sau một nhịp rồi nảy lại);
 *   nhảy: co gối, tay dang lúc bay, chạm đất khuỵu gối và nén người rồi bật lại; đứng: thở, dồn trọng tâm sang một chân.
 * Không đổi khung, không đổi cách vẽ người (render/rig3d.js), không biết logic. Cần: three.js, render/anim3d.js. */
(function (root) {
  const BK = root.BK || (root.BK = {});
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v),
    lerp = (a, b, t) => a + (b - a) * t;
  // các khoá của tư thế đi qua lò xo (theo sau một nhịp, nảy nhẹ): độ cứng, độ hãm
  const SPRING = { hx: [70, 9], hy: [60, 8], cx: [90, 12], sxL: [80, 7], sxR: [80, 7], exL: [90, 9], exR: [90, 9] };
  const RUN_FROM = 2.6, // (đơn vị mỗi giây) từ chừng này bắt đầu chạy hẳn, tới RUN_FROM + RUN_SPAN thì chạy hết sức
    RUN_SPAN = 1.8,
    LAND_T = 0.28; // (giây) khuỵu gối khi chạm đất
  function state() {
    return { spd: 0, ph: 0, lx: null, lz: 0, yaw: null, yawRate: 0, acc: 0, lean: 0, tilt: 0, air: false, land: 0, t: 0, sp: {} };
  }
  function pose(f, tgt, dt) {
    const m = f.motion;
    if (!m || dt <= 0) return;
    m.t += dt;
    // tốc độ thật (đo từ quãng đường), gia tốc, tốc độ quay
    const meas = m.lx == null ? 0 : Math.hypot(f.pos.x - m.lx, f.pos.z - m.lz) / dt;
    m.lx = f.pos.x;
    m.lz = f.pos.z;
    const prev = m.spd;
    m.spd += (Math.min(meas, 9) - m.spd) * Math.min(1, dt * 12);
    m.acc += ((m.spd - prev) / dt - m.acc) * Math.min(1, dt * 6);
    if (m.yaw != null) {
      let d = f.yaw - m.yaw;
      d = Math.atan2(Math.sin(d), Math.cos(d));
      m.yawRate += (d / dt - m.yawRate) * Math.min(1, dt * 8);
    }
    m.yaw = f.yaw;
    const spd = m.spd,
      w = clamp(spd / 0.45, 0, 1), // có đang đi
      r = clamp((spd - RUN_FROM) / RUN_SPAN, 0, 1), // mức chạy
      stride = lerp(1.1, 2.1, r); // (đơn vị) một bước
    m.ph += (spd / stride) * Math.PI * dt;
    const s = Math.sin(m.ph),
      c = Math.cos(m.ph);
    // nhảy, chạm đất
    const air = (f.lift || 0) > 0.02;
    if (m.air && !air) m.land = LAND_T;
    m.air = air;
    m.land = Math.max(0, m.land - dt);
    if (w > 0.02) {
      // chân: biên độ hông, gối theo tốc độ; gối gập lúc đưa chân lên trước; dồn trọng tâm theo chân trụ
      const ah = lerp(0.4, 0.78, r) * w,
        ak = lerp(0.62, 1.35, r) * w;
      tgt.hxL = s * ah;
      tgt.hxR = -s * ah;
      tgt.kxL = Math.max(0, -Math.sin(m.ph - 0.55)) * ak + 0.05 * w;
      tgt.kxR = Math.max(0, Math.sin(m.ph - 0.55)) * ak + 0.05 * w;
      // thân: nhún hai lần mỗi chu kỳ (thấp nhất lúc hai chân dạng), xoay hông, vai ngược hông, ngả tới theo tốc độ
      tgt.py = (-0.025 - 0.04 * r + Math.abs(c) * lerp(0.03, 0.075, r)) * w;
      tgt.pry = s * lerp(0.09, 0.15, r) * w;
      tgt.prz = c * 0.035 * w;
      tgt.cy = -s * lerp(0.1, 0.18, r) * w;
      tgt.cx = (tgt.cx || 0) + 0.05 * w + 0.2 * r;
      // tay: đánh ngược chân, khuỷu gập dần khi chạy
      tgt.sxL = -s * lerp(0.38, 0.95, r) * w;
      tgt.sxR = s * lerp(0.38, 0.95, r) * w;
      tgt.szL = tgt.szR = lerp(0.1, 0.2, r);
      tgt.exL = tgt.exR = lerp(0.28, 1.35, r) * w + 0.12;
    } else {
      // đứng: thở, dồn trọng tâm sang một chân theo nhịp chậm, tay buông thả lỏng
      const sh = Math.sin(m.t * 0.35);
      tgt.prz = (tgt.prz || 0) + sh * 0.035;
      tgt.py = (tgt.py || 0) - 0.008 + Math.sin(m.t * 1.7) * 0.006;
      tgt.kxL = Math.max(tgt.kxL || 0, sh > 0 ? 0.12 * sh : 0);
      tgt.kxR = Math.max(tgt.kxR || 0, sh < 0 ? -0.12 * sh : 0);
      tgt.cx = (tgt.cx || 0) + Math.sin(m.t * 1.7) * 0.015;
    }
    // đầu: giữ thăng bằng (bù độ ngả của ngực), nhìn trước vào hướng đang rẽ
    tgt.hx = (tgt.hx || 0) - (tgt.cx || 0) * 0.6;
    tgt.hy = (tgt.hy || 0) + clamp(m.yawRate * 0.12, -0.5, 0.5);
    // phanh gấp, lao đi: ngực ngả theo gia tốc
    tgt.cx += clamp(m.acc * 0.03, -0.18, 0.2);
    // nhảy: lúc bay co gối, hông gập, tay dang lên; chạm đất khuỵu gối, nén người rồi bật lại
    if (air) {
      tgt.kxL = tgt.kxR = 0.95;
      tgt.hxL = 0.55;
      tgt.hxR = 0.35;
      tgt.sxL = tgt.sxR = 0.75;
      tgt.szL = tgt.szR = 0.55;
      tgt.exL = tgt.exR = 0.5;
      tgt.cx = 0.12;
    } else if (m.land > 0) {
      const k = Math.sin((m.land / LAND_T) * Math.PI);
      tgt.kxL = Math.max(tgt.kxL, 0.75 * k);
      tgt.kxR = Math.max(tgt.kxR, 0.75 * k);
      tgt.hxL = Math.max(tgt.hxL, 0.4 * k);
      tgt.hxR = Math.max(tgt.hxR, 0.4 * k);
      tgt.py = Math.min(tgt.py, -0.11 * k);
      tgt.cx += 0.22 * k;
      tgt.szL = tgt.szR = Math.max(tgt.szL || 0, 0.35 * k);
    }
    // lò xo: đầu, ngực, hai tay theo sau một nhịp rồi nảy lại
    for (const key in SPRING) {
      const [kk, dd] = SPRING[key],
        sp = m.sp[key] || (m.sp[key] = { x: tgt[key] || 0, v: 0 });
      const a = kk * ((tgt[key] || 0) - sp.x) - dd * sp.v;
      sp.v += a * dt;
      sp.x += sp.v * dt;
      tgt[key] = sp.x;
    }
  }
  // gốc khung: nghiêng vào trong khi rẽ (theo tốc độ quay và tốc độ đi), ngả tới khi tăng tốc, ngả sau khi phanh
  function tilt(f) {
    const m = f.motion;
    if (!m) return;
    const lean = clamp(-m.yawRate * m.spd * 0.05, -0.28, 0.28),
      tilt = clamp(m.acc * 0.025, -0.12, 0.14);
    m.lean += (lean - m.lean) * 0.18;
    m.tilt += (tilt - m.tilt) * 0.18;
    const R = f.rig.root.rotation;
    R.set(R.x + m.tilt, R.y, m.lean, 'YXZ');
  }
  BK.Motion3D = { state, pose, root: tilt };
})(typeof self !== 'undefined' ? self : globalThis);
