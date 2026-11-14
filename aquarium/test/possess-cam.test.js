// Bể Kính · test/possess-cam.test.js · Máy quay chính sau vai (game/possess-cam.js; design/ke-hoach-buoc-36.md)
const test = require('node:test');
const assert = require('node:assert');
globalThis.THREE = require('../vendor/three.min.js');
require('../game/possess-cam.js');
const THREE = globalThis.THREE;
const { create } = globalThis.BK.PossessCam;
const CAM = { BACK: 4.2, UP: 0.85, SIDE: 0.7, NEAR_MIN: 1.7, PITCH_MIN: -0.55, PITCH_MAX: 0.75 };
// chỗ của điểm p trên màn hình (toạ độ chuẩn hoá -1..1) khi máy quay ở C.pos nhìn về C.look3
function screen(C, p) {
  const cam = new THREE.PerspectiveCamera(52, 1.5, 0.1, 1000);
  cam.position.copy(C.pos);
  cam.lookAt(C.look3);
  cam.updateMatrixWorld(true);
  return p.clone().project(cam);
}

test('đi thẳng: máy quay gắn cứng, nhân vật đứng yên trên màn hình dù khung hình dài ngắn khác nhau', () => {
  const C = create(CAM),
    head = new THREE.Vector3(0, 1.2, 0);
  C.reset(head, 0.4, 0.12);
  const dts = [1 / 60, 1 / 30, 1 / 144, 0.1, 1 / 60, 0.05, 1 / 90];
  let first = null;
  for (let i = 0; i < 300; i++) {
    const dt = dts[i % dts.length];
    head.x += Math.sin(0.4) * 2.2 * dt;
    head.z += Math.cos(0.4) * 2.2 * dt;
    C.step(dt, head);
    const s = screen(C, head);
    if (!first) first = s;
    assert.ok(Math.abs(s.x - first.x) < 1e-6 && Math.abs(s.y - first.y) < 1e-6, 'nhân vật dời trên màn hình ở khung ' + i);
  }
});

test('tường che: máy quay vào gần, nhân vật vẫn đúng chỗ trên màn hình, hướng nhìn không đổi', () => {
  const C = create(CAM),
    head = new THREE.Vector3(5, 1.2, -3);
  C.reset(head, 1.1, 0.2);
  C.step(1 / 60, head);
  const s0 = screen(C, head),
    d0 = C.look3.clone().sub(C.pos).normalize();
  for (let i = 0; i < 120; i++) C.step(1 / 60, head, () => 0.3); // (bị che: chỉ còn 30% đường trống)
  assert.ok(C.dist < 2 && C.dist >= CAM.NEAR_MIN - 1e-9, 'máy quay vào gần: ' + C.dist.toFixed(2));
  const s1 = screen(C, head),
    d1 = C.look3.clone().sub(C.pos).normalize();
  assert.ok(Math.abs(s1.x - s0.x) < 1e-6 && Math.abs(s1.y - s0.y) < 1e-6, 'nhân vật không nhảy chỗ trên màn hình');
  assert.ok(d1.distanceTo(d0) < 1e-6, 'hướng nhìn giữ nguyên');
});

test('xoay chuột: hướng theo sau mượt, cùng kết quả dù khung hình dài ngắn khác nhau', () => {
  const run = (dt) => {
    const C = create(CAM),
      head = new THREE.Vector3(0, 1.2, 0);
    C.reset(head, 0, 0.12);
    C.look(0.8, 0); // (rê chuột: quay 0,8 rad)
    for (let t = 0; t < 0.5 - 1e-9; t += dt) C.step(dt, head);
    return C.yaw;
  };
  const a = run(1 / 120),
    b = run(1 / 30),
    c = run(0.1);
  assert.ok(Math.abs(a + 0.8) < 0.01, 'tới hướng đích sau nửa giây: ' + a.toFixed(3));
  assert.ok(Math.abs(a - b) < 1e-6 && Math.abs(a - c) < 1e-6, 'không phụ thuộc độ dài khung hình');
});

test('nhảy: độ cao máy quay theo sau mượt, không nảy cứng theo nhân vật', () => {
  const C = create(CAM),
    head = new THREE.Vector3(0, 1.2, 0);
  C.reset(head, 0, 0.12);
  head.y += 1; // (nhân vật bật lên 1 đơn vị trong một khung)
  C.step(1 / 60, head);
  assert.ok(C.tgt.y - 1.2 < 0.2, 'máy quay không bật theo ngay: ' + (C.tgt.y - 1.2).toFixed(2));
  for (let i = 0; i < 60; i++) C.step(1 / 60, head);
  assert.ok(Math.abs(C.tgt.y - 2.2) < 0.01, 'sau một giây đã theo kịp');
});
