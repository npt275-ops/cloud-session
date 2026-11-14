// Bể Kính · test/possess-jump.test.js · Nhảy hai lần, lộn, lượn (game/possess-jump.js; design/ke-hoach-buoc-35.md)
const test = require('node:test');
const assert = require('node:assert');
require('../game/possess-jump.js');
const { create, JUMP } = globalThis.BK.PossessJump;
const CAM = { JUMP_V: JUMP.V1, GRAV: 15 };
const DT = 1 / 60;
// chạy tới khi chạm đất (hay hết giờ); trả thời gian bay, độ cao lớn nhất, góc lộn lớn nhất, có lượn không
function fly(J, st, f, onStep) {
  let t = 0,
    top = 0,
    flip = 0,
    glide = false,
    landed = 0;
  for (; t < 8 && !landed; t += DT) {
    if (onStep) onStep(t);
    const ev = J.step(st, DT);
    J.pose(f);
    top = Math.max(top, st.jumpY);
    flip = Math.max(flip, f.flip);
    glide = glide || f.glide;
    if (typeof ev === 'number' && ev > 0) landed = ev;
  }
  return { t, top, flip, glide, landed };
}

test('nhảy lần 1: khuỵu lấy đà rồi mới bật lên, cao hơn trước (chừng 1 đơn vị)', () => {
  const J = create(CAM),
    st = { phase: 'in', jumpY: 0, jumpV: 0 },
    f = {};
  assert.ok(J.press(st));
  J.step(st, 0.05);
  J.pose(f);
  assert.strictEqual(st.jumpY, 0, 'đang lấy đà: chưa rời đất');
  assert.ok(f.prep > 0.3, 'đang khuỵu gối');
  const r = fly(J, st, f);
  assert.ok(r.top > 0.9 && r.top < 1.1, 'cao chừng 1 đơn vị: ' + r.top.toFixed(2));
  assert.strictEqual(r.flip, 0, 'lần 1 không lộn');
  assert.ok(r.landed > 0, 'chạm đất');
});

test('chỉ hai lần nhảy: lần 2 lộn đủ một vòng; lần 3 không có tác dụng', () => {
  const J = create(CAM),
    st = { phase: 'in', jumpY: 0, jumpV: 0 },
    f = {};
  J.press(st);
  let pressed2 = null,
    pressed3 = null;
  const r = fly(J, st, f, (t) => {
    if (t > 0.35 && pressed2 === null) pressed2 = J.press(st);
    if (t > 0.5 && pressed3 === null) pressed3 = J.press(st);
  });
  assert.strictEqual(pressed2, true);
  assert.strictEqual(pressed3, false);
  assert.ok(r.flip > Math.PI * 1.9, 'lộn đủ một vòng: ' + r.flip.toFixed(2));
  assert.strictEqual(f.flip, 0, 'chạm đất thì hết lộn');
  // chạm đất rồi thì nhảy lại được
  assert.ok(J.press(st));
});

test('giữ Space sau cú lộn: lượn, rơi chậm hơn nhiều; không giữ thì rơi như thường', () => {
  const run = (hold) => {
    const J = create(CAM),
      st = { phase: 'in', jumpY: 0, jumpV: 0 },
      f = {};
    J.press(st);
    let done = false;
    return fly(J, st, f, (t) => {
      if (t > 0.35 && !done) {
        done = true;
        J.press(st);
        J.hold(hold);
      }
    });
  };
  const glide = run(true),
    fall = run(false);
  assert.ok(glide.glide && !fall.glide);
  assert.ok(glide.t > fall.t * 1.6, 'lượn lâu hơn: ' + glide.t.toFixed(2) + ' so với ' + fall.t.toFixed(2));
  assert.ok(glide.landed <= JUMP.GLIDE_MAX + 0.01, 'lượn thì đáp nhẹ');
});

test('chỉ nhảy được khi đang ở trong thân', () => {
  const J = create(CAM);
  assert.strictEqual(J.press({ phase: 'wake', jumpY: 0, jumpV: 0 }), false);
});
