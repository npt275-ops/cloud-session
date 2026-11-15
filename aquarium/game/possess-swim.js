/* Bể Kính · game/possess-swim.js · Bơi của nhân vật đang nhập hồn (khi nước ngập quá DEPTH_IN: Đại hồng thuỷ, dưới biển)
 * Dưới nước không có trọng lực, không nhảy: nhân vật lơ lửng (thả phím thì nổi nhẹ lên tới cách đáy FLOAT), nhấp nhô nhẹ; giữ Space bơi lên, giữ Shift lặn xuống (lên, xuống
 * có quán tính của nước: DRAG); không lên quá mặt nước (đầu nhô lên vừa mặt nước), không xuống quá đáy. Đi ngang theo phím,
 * tốc độ SPEED (chậm hơn đi bộ). Nước rút xuống dưới DEPTH_IN thì thôi bơi, rơi xuống đất như sau cú nhảy.
 * create() trả S; game/possess.js gọi S.step(giây, độ sâu nước ở chân, lên, xuống) mỗi khung hình, đọc S.on, S.lift (độ cao
 * chân trên đất), S.k (0..1: tư thế bơi, render/body/swim3d.js). Không biết three.js: chỉ là số (test/possess-swim.test.js). */
(function (root) {
  const BK = root.BK || (root.BK = {});
  const SWIM = {
    DEPTH_IN: 1.1, // nước ngập chân quá chừng này thì bơi
    EYE: 1.22, // tầm mắt so với chân
    HEAD_OUT: 0.2, // bơi lên sát mặt nước: mắt nhô lên chừng này
    FLOAT: 1, // thả phím thì nổi nhẹ (BUOY) tới cách đáy chừng này rồi lơ lửng
    BUOY: 0.8, // (đơn vị mỗi giây) nổi nhẹ
    UP: 2.4, // (đơn vị mỗi giây) bơi lên
    DOWN: 2.2, // lặn xuống
    DRAG: 3, // nước hãm: vận tốc đuổi theo vận tốc muốn (mỗi giây)
    BOB: 0.09, // nhấp nhô khi lơ lửng
    SPEED: 3.2, // (đơn vị mỗi giây) bơi ngang
    BLEND: 4, // (mỗi giây) chuyển sang, ra khỏi tư thế bơi
  };
  function create() {
    const S = { on: false, y: 0, v: 0, k: 0, t: 0, lift: 0 };
    // một bước: depth = mực nước trừ mặt đất ở chân; up, down: đang giữ phím bơi lên, lặn xuống
    S.step = (sec, depth, up, down) => {
      S.t += sec;
      const was = S.on;
      S.on = depth > SWIM.DEPTH_IN;
      S.k += ((S.on ? 1 : 0) - S.k) * Math.min(1, sec * SWIM.BLEND);
      if (!S.on) {
        S.v = 0;
        if (was) S.y = S.lift; // (ra khỏi nước: game/possess.js cho rơi từ độ cao này)
        return was ? 'out' : null;
      }
      if (!was) S.y = Math.max(0, S.lift);
      const want = up ? SWIM.UP : down ? -SWIM.DOWN : S.y < SWIM.FLOAT ? SWIM.BUOY : 0;
      S.v += (want - S.v) * Math.min(1, sec * SWIM.DRAG);
      const top = Math.max(0, depth - SWIM.EYE + SWIM.HEAD_OUT);
      S.y = Math.min(top, Math.max(0, S.y + S.v * sec));
      if ((S.y >= top && S.v > 0) || (S.y <= 0 && S.v < 0)) S.v = 0;
      // lơ lửng: nhấp nhô nhẹ khi không bơi lên xuống, không chạm đáy
      const bob = !up && !down && S.y > 0.05 ? SWIM.BOB * Math.sin(S.t * 1.7) : 0;
      S.lift = Math.min(top, Math.max(0, S.y + bob));
      return was ? null : 'in';
    };
    return S;
  }
  BK.PossessSwim = { create, SWIM };
})(typeof self !== 'undefined' ? self : globalThis);
