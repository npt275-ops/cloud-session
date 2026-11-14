/* Bể Kính · game/possess-cam.js · Máy quay chính: sau vai nhân vật đang nhập hồn (design/ke-hoach-buoc-36.md)
 * Vì sao viết lại: máy quay cũ đuổi theo chỗ đặt mong muốn bằng hệ số trễ mỗi khung hình, còn hướng nhìn thì quay ngay; xoay
 * chuột thì nhân vật văng ra giữa màn hình rồi trượt về (đo được 20 điểm ảnh mỗi khung, có lúc 68), đi lại thì độ trễ đổi theo
 * độ dài từng khung hình nên nhân vật rung tới lui trên màn hình.
 * Cách mới (mọi thứ theo giờ thật, không phụ thuộc độ dài khung hình):
 *   ngang     máy quay gắn cứng theo nhân vật (nhân vật đứng yên trên màn hình khi đi, chạy, xoay)
 *   đứng      độ cao điểm bám đi qua làm mượt (nhảy, lên dốc, bậc đất không làm máy quay nảy theo)
 *   xoay      chuột đặt hướng đích; hướng thật theo sau rất nhanh (TURN mỗi giây): mượt dù sự kiện chuột đến không đều
 *   che       tường che: khoảng cách là một con số làm mượt (vào IN, ra chậm OUT), không nhảy nấc; bị che thì máy quay trượt
 *             vào dọc đường thẳng từ nhân vật ra chỗ đặt đầy đủ (cả độ lệch vai, độ cao co theo cùng tỉ lệ) và giữ nguyên hướng
 *             nhìn: nhân vật đứng đúng một chỗ trên màn hình, chỉ to lên khi máy quay vào gần (không nhảy chỗ); không gần hơn
 *             NEAR_MIN
 *   đất       không chui xuống đất (mặt đất dưới máy quay làm mượt)
 * create(CAM) trả C; game/possess.js gọi C.reset(đầu, hướng, độ ngẩng) lúc mở mắt, C.look(dx, dy) khi rê chuột,
 * C.step(giây, đầu, clearFrac, groundAt) mỗi khung hình rồi đọc C.pos, C.look3, C.yaw, C.pitch.
 * Cần: three.js. */
(function (root) {
  const BK = root.BK || (root.BK = {});
  const RATE = {
    TURN: 32, // (mỗi giây) hướng nhìn theo chuột
    Y: 9, // độ cao điểm bám
    IN: 9, // tường che: máy quay vào gần
    OUT: 2.2, // hết che: lùi ra
    GROUND: 10, // mặt đất dưới máy quay
    SNAP: 3, // (đơn vị) nhân vật dời xa hơn chừng này trong một khung hình (đổi người, dịch chuyển): đặt lại ngay
  };
  const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
  function create(CAM) {
    const THREE = root.THREE;
    const C = {
      yaw: 0,
      pitch: 0.12,
      yawT: 0,
      pitchT: 0.12,
      tgt: new THREE.Vector3(), // điểm bám (đầu nhân vật; độ cao làm mượt)
      dist: CAM.BACK, // khoảng cách máy quay (tường che thì nhỏ lại)
      gy: null, // mặt đất dưới máy quay (làm mượt)
      pos: new THREE.Vector3(),
      look3: new THREE.Vector3(),
      ready: false,
    };
    const up = new THREE.Vector3(0, 1, 0),
      dir = new THREE.Vector3(),
      right = new THREE.Vector3(),
      ideal = new THREE.Vector3();
    const ex = (sec, r) => 1 - Math.exp(-sec * r);
    // chỗ máy quay ở khoảng cách d sau điểm bám t (hướng hiện tại): t + k × (lùi BACK, lệch vai SIDE, cao UP), k = d / BACK
    const arm = new THREE.Vector3();
    function place(t, d, out) {
      const cp = Math.cos(C.pitch);
      dir.set(Math.sin(C.yaw) * cp, Math.sin(C.pitch), Math.cos(C.yaw) * cp);
      right.set(-Math.cos(C.yaw), 0, Math.sin(C.yaw));
      arm.copy(dir).multiplyScalar(-CAM.BACK).addScaledVector(right, CAM.SIDE).addScaledVector(up, CAM.UP);
      return out.copy(t).addScaledVector(arm, d / CAM.BACK);
    }
    C.reset = (head, yaw, pitch) => {
      C.yaw = C.yawT = yaw;
      C.pitch = C.pitchT = pitch;
      C.tgt.copy(head);
      C.dist = CAM.BACK;
      C.gy = null;
      C.ready = true;
    };
    C.look = (dx, dy) => {
      C.yawT -= dx;
      C.pitchT = Math.max(CAM.PITCH_MIN, Math.min(CAM.PITCH_MAX, C.pitchT - dy));
    };
    // clearFrac(a, b): phần trống trên đoạn a→b (0..1); groundAt(x, z): độ cao mặt đất (thế giới)
    C.step = (sec, head, clearFrac, groundAt) => {
      if (!C.ready) C.reset(head, C.yawT, C.pitchT);
      C.yaw += wrap(C.yawT - C.yaw) * ex(sec, RATE.TURN);
      C.pitch += (C.pitchT - C.pitch) * ex(sec, RATE.TURN);
      // điểm bám: ngang gắn cứng, đứng làm mượt; dời quá xa thì đặt lại
      if (Math.hypot(head.x - C.tgt.x, head.z - C.tgt.z) > RATE.SNAP) C.tgt.copy(head);
      C.tgt.x = head.x;
      C.tgt.z = head.z;
      C.tgt.y += (head.y - C.tgt.y) * ex(sec, RATE.Y);
      // tường che: khoảng cách đích theo phần trống trên đường từ điểm bám ra chỗ đặt đầy đủ
      const free = clearFrac ? clearFrac(C.tgt, place(C.tgt, CAM.BACK, ideal)) : 1,
        want = Math.max(CAM.NEAR_MIN, free * CAM.BACK);
      C.dist += (want - C.dist) * ex(sec, want < C.dist ? RATE.IN : RATE.OUT);
      place(C.tgt, C.dist, C.pos);
      // không chui xuống đất
      if (groundAt) {
        const g = groundAt(C.pos.x, C.pos.z) + 0.35;
        C.gy = C.gy == null ? g : C.gy + (g - C.gy) * ex(sec, RATE.GROUND);
        if (C.pos.y < C.gy) C.pos.y = C.gy;
      }
      // hướng nhìn không đổi theo khoảng cách: như máy quay ở chỗ đầy đủ nhìn vào điểm trước mặt nhân vật 6 đơn vị
      C.look3.copy(C.pos).addScaledVector(dir, 6).sub(arm);
      return C;
    };
    return C;
  }
  BK.PossessCam = { create, RATE };
})(typeof self !== 'undefined' ? self : globalThis);
