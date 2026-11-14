// Bể Kính · test/motion3d.test.js · Nén giãn của nhân vật khi nhảy (render/body/motion3d.js; design/ke-hoach-buoc-34.md điểm 5)
const test = require('node:test');
const assert = require('node:assert');
require('../render/body/motion3d.js');
const M = globalThis.BK.Motion3D;

// một cú nhảy: v0 lên, trọng lực g (như game/possess.js), rồi đứng thêm một lúc; trả mức kéo dài nhất lúc bay, mức nén nhất
// sau khi chạm đất, mức còn lại cuối cùng
function jump(dt) {
  const f = { pos: { x: 0, z: 0 }, yaw: 0, lift: 0, motion: M.state() };
  let y = 0,
    v = 4.6,
    air = true,
    minAir = 0,
    maxLand = 0;
  for (let t = 0; t < 2.5; t += dt) {
    if (air) {
      v -= 15 * dt;
      y += v * dt;
      if (y <= 0) {
        y = 0;
        air = false;
      }
    }
    f.lift = y;
    M.pose(f, {}, dt);
    if (air) minAir = Math.min(minAir, f.motion.sq);
    else maxLand = Math.max(maxLand, f.motion.sq);
  }
  return { minAir, maxLand, end: f.motion.sq };
}

test('nhảy: bay lên kéo dài, chạm đất nén bẹt, rồi trở về dáng thường (máy nhanh)', () => {
  const r = jump(1 / 60);
  assert.ok(r.minAir < -0.05, 'lúc bay phải kéo dài: ' + r.minAir);
  assert.ok(r.maxLand > 0.1, 'chạm đất phải nén: ' + r.maxLand);
  assert.ok(Math.abs(r.end) < 0.01, 'đứng yên thì về dáng thường: ' + r.end);
});

test('máy chậm (10 khung hình mỗi giây: game/possess.js giới hạn mỗi bước 0,1 giây): ổn định, vẫn có nén khi chạm đất', () => {
  const r = jump(0.1);
  assert.ok(r.maxLand > 0.03, 'chạm đất vẫn nén: ' + r.maxLand);
  assert.ok(r.maxLand <= 0.25 && r.minAir >= -0.2, 'trong giới hạn');
  assert.ok(Math.abs(r.end) < 0.02, 'về dáng thường: ' + r.end);
});
