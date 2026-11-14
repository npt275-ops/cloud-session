/* Bể Kính · game/possess-jump.js · Nhảy của nhân vật đang nhập hồn (design/ke-hoach-buoc-35.md)
 * Hai lần nhảy, không hơn:
 *   lần 1  (Space khi đang đứng): khuỵu gối lấy đà PREP giây rồi bật lên với vận tốc V1
 *   lần 2  (Space khi đang bay sau lần 1): bật thêm V2 và lộn một vòng trên không (FLIP_T giây)
 *   lượn   sau cú lộn, giữ Space lúc đang rơi: trọng lực nhẹ GLIDE_G, rơi không nhanh quá GLIDE_MAX (bay, rơi từ từ xuống)
 * Chạm đất: trả lại cả hai lần nhảy; độ mạnh cú chạm (theo vận tốc rơi) cho render/body/motion3d.js khuỵu gối sâu hay nông.
 * create(CAM) trả đối tượng nhảy J; game/possess.js gọi J.press(st), J.hold(bật), J.step(st, giây) mỗi khung hình (st.jumpY,
 * st.jumpV là độ cao, vận tốc đứng như trước), J.pose() cho người bị nhập (f.prep, f.flip, f.glide, f.landK).
 * Không biết three.js, không vẽ gì: chỉ là số (kiểm thử: test/possess-jump.test.js). */
(function (root) {
  const BK = root.BK || (root.BK = {});
  const JUMP = {
    PREP: 0.1, // (giây) khuỵu gối lấy đà
    V1: 5.4, // (đơn vị mỗi giây) bật lên lần 1: cao chừng 1 đơn vị (trước đây 4,6: chừng 0,7)
    V2: 5.0, // bật lên lần 2 (lộn)
    FLIP_T: 0.6, // (giây) thời gian lộn một vòng
    GLIDE_G: 2.2, // trọng lực khi lượn
    GLIDE_MAX: 0.9, // (đơn vị mỗi giây) tốc độ rơi lớn nhất khi lượn
    HARD: 9, // (đơn vị mỗi giây) rơi nhanh chừng này thì chạm đất khuỵu sâu nhất
  };
  const ease = (u) => (u < 0.5 ? 2 * u * u : 1 - 2 * (1 - u) * (1 - u)); // (vào chậm, giữa nhanh, ra chậm)
  function create(CAM) {
    const J = { n: 0, prep: 0, flipT: -1, held: false, glide: false, landK: 0 };
    // bấm Space: đứng thì lấy đà nhảy lần 1; đang bay sau lần 1 thì nhảy lần 2 (lộn); đã nhảy 2 lần thì thôi
    J.press = (st) => {
      if (st.phase !== 'in') return false;
      if (st.jumpY <= 0 && J.prep <= 0 && J.n === 0) {
        J.prep = JUMP.PREP;
        J.n = 1;
        return true;
      }
      if (st.jumpY > 0 && J.n === 1) {
        J.n = 2;
        st.jumpV = JUMP.V2;
        J.flipT = 0;
        return true;
      }
      return false;
    };
    J.hold = (on) => (J.held = !!on);
    // mỗi khung hình: trả vận tốc rơi lúc chạm đất (> 0) nếu vừa chạm đất, 'up' nếu vừa bật lên, không thì 0
    J.step = (st, sec) => {
      let ev = 0;
      if (J.prep > 0) {
        J.prep -= sec;
        if (J.prep <= 0) {
          J.prep = 0;
          st.jumpV = CAM.JUMP_V || JUMP.V1;
          st.jumpY = 0.0001;
          ev = 'up';
        }
        return ev;
      }
      if (st.jumpY <= 0) return 0;
      if (J.flipT >= 0) {
        J.flipT += sec;
        if (J.flipT >= JUMP.FLIP_T) J.flipT = -1;
      }
      // lượn: sau cú lộn, giữ Space, đang rơi
      J.glide = J.n === 2 && J.flipT < 0 && J.held && st.jumpV < 0;
      st.jumpV -= (J.glide ? JUMP.GLIDE_G : CAM.GRAV) * sec;
      if (J.glide) st.jumpV = Math.max(st.jumpV, -JUMP.GLIDE_MAX);
      st.jumpY += st.jumpV * sec;
      if (st.jumpY <= 0) {
        ev = Math.max(0.01, -st.jumpV);
        J.landK = Math.min(1, ev / JUMP.HARD);
        st.jumpY = 0;
        st.jumpV = 0;
        J.n = 0;
        J.flipT = -1;
        J.glide = false;
      }
      return ev;
    };
    // tư thế cho người bị nhập: prep 0..1 (khuỵu lấy đà), flip góc lộn (radian), glide lượn, landK độ mạnh lần chạm đất gần nhất
    J.pose = (f) => {
      f.prep = J.prep > 0 ? 1 - J.prep / JUMP.PREP : 0;
      f.flip = J.flipT >= 0 ? Math.PI * 2 * ease(J.flipT / JUMP.FLIP_T) : 0;
      f.glide = J.glide;
      f.landK = J.landK;
    };
    J.reset = () => {
      J.n = 0;
      J.prep = 0;
      J.flipT = -1;
      J.glide = false;
      J.held = false;
    };
    return J;
  }
  BK.PossessJump = { create, JUMP };
})(typeof self !== 'undefined' ? self : globalThis);
