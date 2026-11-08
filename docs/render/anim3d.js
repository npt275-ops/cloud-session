/* Bể Kính · render/anim3d.js
 * Cử động tay chân bằng công thức, không cần tệp hoạt ảnh: 5 trạng thái gốc (đứng yên, đi, nói chuyện hay tranh cãi,
 * đánh, hoảng sợ chạy) cộng tư thế cầu nguyện và 6 thói quen khi đứng chờ.
 * Mỗi trạng thái cho ra một "tư thế đích" theo thời gian; tư thế đang có trượt dần về tư thế đích, nên đổi trạng thái
 * luôn mềm (khoảng 0,3 giây). Núm vặn từ gen (logic/brain.js: knobs) đổi nhịp, biên độ, ngả tới lùi, độ run, liếc nhìn:
 * cùng là đánh nhau nhưng người máu chiến khua nhanh và rộng, người nhút nhát lóng ngóng và lùi về sau.
 * Chỉ xoay các nút của khung (render/rig3d.js), không biết gì về logic hay cách vẽ. */
(function (root, factory) {
  const BK = root.BK || (root.BK = {});
  BK.Anim3D = factory(BK);
})(typeof self !== 'undefined' ? self : globalThis, function (BK) {
  'use strict';
  const S = Math.sin, C = Math.cos, clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  // các góc của một tư thế (radian); tay và chân: L, R
  const KEYS = ['py', 'pry', 'prz', 'cx', 'cy', 'hx', 'hy', 'hz',
    'sxL', 'szL', 'syL', 'exL', 'sxR', 'szR', 'syR', 'exR', 'hxL', 'hzL', 'kxL', 'hxR', 'hzR', 'kxR',
    'rx', 'ty']; // rx: ngả cả người (ngã, ngủ), ty: hạ cả người (quỳ, ngồi); phần vẽ áp hai khoá này lên gốc của khung
  const blank = () => { const p = {}; for (const k of KEYS) p[k] = 0; return p; };

  /* ---------- Tư thế đích của từng trạng thái ---------- */
  // ph: pha nhịp (radian, tăng theo tốc độ), t: thời gian (giây), K: núm vặn, o: { habit, mood, moving }
  // dáng nền theo gen: khom hay thẳng lưng, đứng khép hay dạng chân (dùng chung cho mọi trạng thái và mọi cử chỉ)
  function basePose(K) {
    const p = blank();
    p.cx = (0.5 - K.posture) * 0.3 + K.lean * 0.12;
    p.hzL = 0.03 + K.stance * 0.09; p.hzR = p.hzL;
    p.szL = p.szR = 0.08;
    return p;
  }
  // nét sống động theo gen: liếc nhìn quanh (đa nghi, mưu mô), run tay chân (sợ hãi, nhu nhược)
  function addLife(p, t, K) {
    const g = S(t * 0.7 + K.seed) * S(t * 0.31 + K.seed * 2);
    if (g > 0.55 - 0.3 * K.glance) p.hy += K.glance * 0.9 * Math.sign(S(t * 0.13 + K.seed));
    if (K.jitter > 0.02) { const j = K.jitter * 0.09; p.sxL += S(t * 23) * j; p.sxR += S(t * 21 + 1) * j; p.hy += S(t * 17) * j; p.cx += S(t * 19) * j * 0.5; }
    return p;
  }
  function target(state, ph, t, K, o) {
    const p = basePose(K), A = K.amplitude, lean = K.lean;
    const walkLegs = (amp, freqMul) => {
      const s = S(ph * freqMul);
      p.hxL = s * amp; p.hxR = -s * amp;
      p.kxL = Math.max(0, -S(ph * freqMul - 0.6)) * amp * 1.4; p.kxR = Math.max(0, S(ph * freqMul - 0.6)) * amp * 1.4;
      p.py = Math.abs(C(ph * freqMul)) * 0.035 * (0.6 + K.stride);
      p.pry = s * 0.06;
    };
    // bước chân chỉ khi đang thật sự di chuyển (đứng yên mà trạng thái 'đi' thì đứng thở như người chờ, không bước tại chỗ);
    // ra trận cũng chạy bằng bước chân, tới chỗ trong hàng mới giương vũ khí
    if (o.moving && state !== 'panic') {
      const amp = (0.28 + 0.3 * K.stride) * (0.7 + 0.5 * A);
      walkLegs(amp, 1);
      p.sxL = -S(ph) * (0.25 + 0.45 * A); p.sxR = S(ph) * (0.25 + 0.45 * A);
      p.exL = p.exR = 0.25 + 0.2 * A;
    }
    if ((state === 'idle' || state === 'walk') && !o.moving) {
      const br = S(t * 1.6) * 0.02; p.cx += br; p.hx = -br;
      habit(p, o.habit, t, K);
      if (o.mood === 'pray') { // cầu nguyện: cúi đầu, chắp tay trước ngực, hơi khuỵu gối
        p.cx = 0.28; p.hx = 0.45; p.sxL = p.sxR = 0.85; p.szL = p.szR = -0.32; p.exL = p.exR = 1.75; p.syL = 0.3; p.syR = -0.3;
        p.kxL = p.kxR = 0.25; p.hxL = p.hxR = -0.12; p.py = -0.04;
      }
    }
    if (state === 'talk' && !o.moving) {
      if (o.mood === 'argue') { // tranh cãi: hai tay chỉ trỏ, nhịp gắt, người chồm tới
        p.cx += 0.12 + lean * 0.15; p.hx = -0.1 + S(ph * 2.3) * 0.12;
        p.sxR = 0.7 + S(ph * 2.2) * 0.6 * (0.5 + A); p.szR = 0.25; p.exR = 0.5 + 0.5 * S(ph * 2.2 + 1);
        p.sxL = 0.4 + S(ph * 1.7 + 2) * 0.5 * A; p.szL = 0.35 + 0.25 * S(ph * 1.3); p.exL = 0.9 + 0.4 * S(ph * 1.9);
        p.hxL = 0.12; p.hxR = -0.08;
      } else { // nói chuyện: gật đầu, một tay đưa lên đưa xuống
        p.hx = S(ph * 1.1) * 0.08; p.hy = S(ph * 0.4) * 0.15;
        p.sxR = 0.45 + S(ph * 0.9) * 0.3 * (0.4 + A); p.exR = 1.0 + S(ph * 1.3) * 0.35; p.szR = 0.15;
        habit(p, o.habit, t, K, true);
      }
    }
    if (state === 'attack' && !o.moving) { // thế đứng ra trận khi chưa có cử chỉ ngắm, giương (render/village3d.js đặt đè): hạ thấp người, chân choãi
      const c = ph * 1.4;
      p.py = -0.06 - 0.03 * A;
      p.hxL = 0.35 + lean * 0.15; p.hxR = -0.3 + lean * 0.15; p.kxL = 0.4; p.kxR = 0.45;
      p.cx = 0.18 + lean * 0.3 + S(c) * 0.12 * A;
      p.sxR = 1.1 + S(c) * (0.6 + 1.0 * A); p.szR = 0.2; p.exR = 0.35 + 0.5 * (1 + C(c)) * 0.5;
      p.sxL = 0.6 + S(c + 2) * 0.3 * A; p.szL = 0.35; p.exL = 1.2;
      p.pry = S(c) * 0.25 * A;
    }
    if (state === 'panic') { // hoảng sợ chạy: chân nhanh, tay quơ trên đầu, ngoái lại phía sau
      walkLegs(0.55 + 0.2 * A, 1);
      p.cx = 0.22;
      p.sxL = 2.2 + S(ph * 2.5) * 0.4; p.sxR = 2.1 + S(ph * 2.5 + 1.5) * 0.4; p.szL = p.szR = 0.45; p.exL = p.exR = 0.6;
      p.hy = S(t * 1.3) * 0.9;
      if (!o.moving) { p.hxL = p.hxR = 0; p.kxL = p.kxR = 0.35; p.py = -0.08; p.cx = 0.35; p.sxL = p.sxR = 1.2; p.exL = p.exR = 1.9; p.szL = p.szR = -0.1; } // co rúm tại chỗ
    }
    return addLife(p, t, K);
  }

  // thói quen khi đứng chờ (bốc thăm từ cha hoặc mẹ); half: chỉ tay trái (tay phải đang nói chuyện)
  function habit(p, h, t, K, half) {
    const L = (sx, sz, ex, sy) => { p.sxL = sx; p.szL = sz; p.exL = ex; p.syL = sy || 0; };
    const R = (sx, sz, ex, sy) => { if (half) return; p.sxR = sx; p.szR = sz; p.exR = ex; p.syR = sy || 0; };
    if (h === 'crossArms') { L(0.75, -0.45, 1.95, 0.4); R(0.85, -0.45, 1.85, -0.4); }
    else if (h === 'handsOnHips') { L(-0.1, 0.65, 1.7, -0.6); R(-0.1, 0.65, 1.7, 0.6); }
    else if (h === 'handsBehind') { L(-0.45, 0.05, 1.0, 0.5); R(-0.45, 0.05, 1.0, -0.5); p.cx -= 0.04; }
    else if (h === 'scratchHead') { const on = S(t * 0.45 + K.seed) > 0.4; if (on && !half) R(2.5, 0.55, 2.0 + S(t * 9) * 0.25, 0); }
    else if (h === 'rubHands') { const r = S(t * 6) * 0.12; L(0.65, -0.28, 1.35, 0.3 + r); R(0.65, -0.28, 1.35, -0.3 + r); }
    else if (h === 'sway') { p.prz = S(t * 1.2 + K.seed) * 0.06; p.pry += S(t * 0.6) * 0.08; p.hzL += 0.03; p.hzR += 0.03; }
  }

  /* ---------- Trượt tư thế hiện có về tư thế đích, rồi xoay các nút ---------- */
  function apply(rig, cur, tgt, dt) {
    const k = 1 - Math.exp(-Math.max(0, dt) / 0.11); // thời gian âm hay hỏng thì không trượt
    for (const key of KEYS) { const v = cur[key] + (tgt[key] - cur[key]) * k; cur[key] = Number.isFinite(v) ? v : tgt[key] || 0; }
    const n = rig.nodes, P = cur;
    n.pelvis.position.y = 0.78 + P.py; n.pelvis.rotation.set(0, P.pry, P.prz);
    n.chest.rotation.set(P.cx, P.cy, 0);
    n.head.rotation.set(P.hx, clamp(P.hy, -1.2, 1.2), P.hz);
    n.shL.rotation.set(-P.sxL, P.syL, P.szL); n.shR.rotation.set(-P.sxR, P.syR, -P.szR);
    n.elL.rotation.set(-P.exL, 0, 0); n.elR.rotation.set(-P.exR, 0, 0);
    n.hipL.rotation.set(-P.hxL, 0, P.hzL); n.hipR.rotation.set(-P.hxR, 0, -P.hzR);
    n.knL.rotation.set(P.kxL, 0, 0); n.knR.rotation.set(P.kxR, 0, 0);
    // tay chạm đúng chỗ trên cơ thể (render/ik3d.js): tư thế đích ghi ikL / ikR = { s: mốc, p: điểm, pole: hướng khuỷu }
    for (const side of ['L', 'R']) {
      const want = tgt['ik' + side] ? 1 : 0, wk = 'ikw' + side;
      cur[wk] = (cur[wk] || 0) + (want - (cur[wk] || 0)) * k;
      if (tgt['ik' + side]) cur['ik' + side] = tgt['ik' + side];
      if (cur[wk] > 0.001 && cur['ik' + side] && BK.IK3D) BK.IK3D.solveArm(rig, side, cur['ik' + side], cur[wk]);
    }
  }

  return { KEYS, blank, basePose, addLife, target, apply };
});
