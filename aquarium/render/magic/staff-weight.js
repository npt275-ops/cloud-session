/* Bể Kính · render/magic/staff-weight.js · Sức nặng của gậy phép (design/ke-hoach-buoc-37.md mục "Sức nặng của gậy")
 * Gậy không xoay cứng theo tay: đầu gậy là một khối nặng nối với bàn tay bằng lò xo xoay (toán thuần, không cần three.js):
 *   - tay tăng tốc thì đầu gậy trễ lại phía sau, phanh gấp thì đầu gậy văng tới trước rồi lắc về
 *   - rẽ thì đầu gậy quét theo sau một nhịp; mỗi bước chạy tay nhún lên xuống, đầu gậy bập bênh theo
 *   - trọng lực kéo đầu gậy trĩu xuống một chút khi cầm ngang
 *   - chạy đều thì không trễ (lò xo hãm theo vận tốc tương đối với tay, không theo vận tốc tuyệt đối)
 * Mọi con số ở W. render/magic/staff3d.js gọi: st = BK.StaffWeight.state(); BK.StaffWeight.step(st, tay, hướng đích, dài, giây)
 * trả hướng thân gậy (vector đơn vị {x, y, z}). Chạy được bằng Node (kiểm thử: test/staff-weight.test.js). */
(function (root) {
  const BK = root.BK || (root.BK = {});
  const W = {
    K: 95, // (1/giây²) độ cứng: đầu gậy về hướng đích nhanh hay chậm
    D: 10, // (1/giây) độ hãm: nhỏ thì lắc qua lắc lại lâu hơn
    GRAV: 3, // (đơn vị/giây²) trọng lực lên đầu gậy (trĩu xuống khi cầm ngang)
    MAX_STEP: 1 / 120, // (giây) bước tính nhỏ nhất: khung hình chậm thì chia nhỏ cho khỏi nổ
  };
  function state() {
    return { tip: null, vel: { x: 0, y: 0, z: 0 }, hand: null, hv: { x: 0, y: 0, z: 0 } };
  }
  const len3 = (x, y, z) => Math.sqrt(x * x + y * y + z * z) || 1;
  // hand: chỗ bàn tay (thế giới); dir: hướng đích (đơn vị); L: dài từ tay tới đầu gậy (thế giới); trả hướng thật
  function step(st, hand, dir, L, sec) {
    if (!st.tip || !(sec > 0)) {
      st.tip = { x: hand.x + dir.x * L, y: hand.y + dir.y * L, z: hand.z + dir.z * L };
      st.hand = { x: hand.x, y: hand.y, z: hand.z };
      return { x: dir.x, y: dir.y, z: dir.z };
    }
    // vận tốc tay (để hãm theo vận tốc tương đối: chạy đều không làm gậy trễ)
    const hv = st.hv;
    hv.x = (hand.x - st.hand.x) / sec;
    hv.y = (hand.y - st.hand.y) / sec;
    hv.z = (hand.z - st.hand.z) / sec;
    const n = Math.max(1, Math.ceil(sec / W.MAX_STEP)),
      h = sec / n,
      t = st.tip,
      v = st.vel;
    for (let i = 0; i < n; i++) {
      // tay đi dần từ chỗ cũ tới chỗ mới trong khung hình: lực tính theo chỗ tay đầu bước, ràng buộc theo chỗ tay cuối bước
      // (lực theo chỗ cuối bước thì chạy đều đầu gậy bị kéo lệch tới trước một đoạn bằng quãng tay đi trong một bước)
      const k0 = i / n,
        k = (i + 1) / n;
      v.x += (W.K * (st.hand.x + (hand.x - st.hand.x) * k0 + dir.x * L - t.x) - W.D * (v.x - hv.x)) * h;
      v.y += (W.K * (st.hand.y + (hand.y - st.hand.y) * k0 + dir.y * L - t.y) - W.D * (v.y - hv.y) - W.GRAV) * h;
      v.z += (W.K * (st.hand.z + (hand.z - st.hand.z) * k0 + dir.z * L - t.z) - W.D * (v.z - hv.z)) * h;
      const hx = st.hand.x + (hand.x - st.hand.x) * k,
        hy = st.hand.y + (hand.y - st.hand.y) * k,
        hz = st.hand.z + (hand.z - st.hand.z) * k;
      t.x += v.x * h;
      t.y += v.y * h;
      t.z += v.z * h;
      // gậy cứng: đầu gậy luôn cách tay đúng L (bỏ phần vận tốc dọc thân gậy)
      let dx = t.x - hx,
        dy = t.y - hy,
        dz = t.z - hz;
      const d = len3(dx, dy, dz);
      dx /= d;
      dy /= d;
      dz /= d;
      t.x = hx + dx * L;
      t.y = hy + dy * L;
      t.z = hz + dz * L;
      const rv = (v.x - hv.x) * dx + (v.y - hv.y) * dy + (v.z - hv.z) * dz;
      v.x -= rv * dx;
      v.y -= rv * dy;
      v.z -= rv * dz;
    }
    st.hand.x = hand.x;
    st.hand.y = hand.y;
    st.hand.z = hand.z;
    const d = len3(t.x - hand.x, t.y - hand.y, t.z - hand.z);
    return { x: (t.x - hand.x) / d, y: (t.y - hand.y) / d, z: (t.z - hand.z) / d };
  }
  const reset = (st) => (st.tip = null);
  BK.StaffWeight = { state, step, reset, W };
  if (typeof module !== 'undefined') module.exports = BK.StaffWeight;
})(typeof self !== 'undefined' ? self : globalThis);
