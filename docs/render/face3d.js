/* Bể Kính · render/face3d.js
 * Khuôn mặt NPC với 7 biểu cảm cố định: Bình thường, Vui, Buồn, Giận, Sợ hãi, Ngạc nhiên, Nghi ngờ.
 * Mỗi biểu cảm ghép từ: hai mắt (độ mở, mỗi bên có thể khác), lông mày (cao thấp, nghiêng xếch hay chau), miệng (một trong
 * sáu hình: mím, cười, mếu, há nhỏ, há to, nghiến răng) và má hồng. Mắt tự chớp; nhắm mắt khi ngủ, cầu nguyện, qua đời.
 * Đổi biểu cảm thì mắt và lông mày trượt mềm, miệng đổi hình. Các mảnh gắn vào nút đầu của khung (render/rig3d.js).
 * Cần: three.js. */
(function (root, factory) {
  const BK = root.BK || (root.BK = {});
  BK.Face3D = factory();
})(typeof self !== 'undefined' ? self : globalThis, function () {
  'use strict';

  /* ---------- Bảy biểu cảm ---------- */
  // eye: độ mở mắt [trái, phải] (1 bình thường), pupil: cỡ con ngươi, brow: độ cao lông mày [trái, phải],
  // tilt: độ nghiêng lông mày [trái, phải] (dương: chau, đầu trong cụp xuống như giận; âm: đầu trong nhướn lên như buồn, sợ),
  // mouth: hình miệng, mw: độ rộng miệng, mx: lệch miệng sang bên, cheek: má hồng
  const EXPR = [
    { key: 'neutral', name: 'Bình thường', eye: [1, 1], pupil: 1, brow: [0, 0], tilt: [0, 0], mouth: 'line', mw: 0.8, mx: 0, cheek: 0 },
    { key: 'happy', name: 'Vui', eye: [0.62, 0.62], pupil: 1, brow: [0.012, 0.012], tilt: [-0.1, -0.1], mouth: 'smile', mw: 1.2, mx: 0, cheek: 1 },
    { key: 'sad', name: 'Buồn', eye: [0.75, 0.75], pupil: 1, brow: [0.006, 0.006], tilt: [-0.5, -0.5], mouth: 'frown', mw: 0.9, mx: 0, cheek: 0 },
    { key: 'angry', name: 'Giận', eye: [0.55, 0.55], pupil: 0.9, brow: [-0.012, -0.012], tilt: [0.55, 0.55], mouth: 'grit', mw: 1.1, mx: 0, cheek: 0 },
    { key: 'fear', name: 'Sợ hãi', eye: [1.3, 1.3], pupil: 0.6, brow: [0.02, 0.02], tilt: [-0.45, -0.45], mouth: 'small', mw: 0.9, mx: 0, cheek: 0 },
    { key: 'surprise', name: 'Ngạc nhiên', eye: [1.4, 1.4], pupil: 0.75, brow: [0.035, 0.035], tilt: [0, 0], mouth: 'open', mw: 1, mx: 0, cheek: 0 },
    { key: 'suspicious', name: 'Nghi ngờ', eye: [0.45, 1.05], pupil: 1, brow: [-0.01, 0.025], tilt: [0.35, -0.15], mouth: 'line', mw: 0.7, mx: 0.022, cheek: 0 },
  ];
  const BY_KEY = {}; for (const E of EXPR) BY_KEY[E.key] = E;

  /* ---------- Dựng mặt trên nút đầu ---------- */
  // toạ độ theo nút đầu của khung: tâm đầu ở (0, 0.17, 0), mặt trước ở z khoảng 0.18
  function create(o) {
    const { THREE, head } = o;
    const ink = new THREE.MeshBasicMaterial({ color: '#1d1a24' }), white = new THREE.MeshBasicMaterial({ color: '#ffffff' });
    const pink = new THREE.MeshBasicMaterial({ color: '#ff8f9a', transparent: true, opacity: 0, depthWrite: false });
    const mk = (geo, mat, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); head.add(m); return m; };
    const sph = (a, b) => new THREE.SphereGeometry(1, a, b);
    const F = { eyes: [], shines: [], brows: [], cheeks: [], mouths: {} };
    for (const sx of [1, -1]) { // [0]: mắt trái của NPC (phía +x), [1]: mắt phải
      const e = mk(sph(10, 8), ink, sx * 0.068, 0.19, 0.172); F.eyes.push(e);
      F.shines.push(mk(sph(6, 4), white, sx * 0.068 + 0.008, 0.2, 0.186));
      const b = mk(new THREE.BoxGeometry(0.06, 0.014, 0.01), ink, sx * 0.07, 0.245, 0.172); F.brows.push(b);
      const c = mk(new THREE.CircleGeometry(0.03, 12), pink, sx * 0.105, 0.135, 0.163); c.rotation.y = sx * 0.55; F.cheeks.push(c);
    }
    const MY = 0.105, MZ = 0.176;
    F.mouths.line = mk(new THREE.BoxGeometry(0.06, 0.01, 0.01), ink, 0, MY, MZ);
    F.mouths.smile = mk(new THREE.TorusGeometry(0.036, 0.008, 5, 12, Math.PI), ink, 0, MY + 0.014, MZ); F.mouths.smile.rotation.z = Math.PI;
    F.mouths.frown = mk(new THREE.TorusGeometry(0.032, 0.008, 5, 12, Math.PI), ink, 0, MY - 0.018, MZ);
    F.mouths.small = mk(sph(8, 6), ink, 0, MY, MZ); F.mouths.small.scale.set(0.017, 0.021, 0.008);
    F.mouths.open = mk(sph(10, 8), ink, 0, MY - 0.006, MZ); F.mouths.open.scale.set(0.027, 0.034, 0.01);
    F.mouths.grit = new THREE.Group(); F.mouths.grit.position.set(0, MY, MZ); head.add(F.mouths.grit);
    { const g = F.mouths.grit, m1 = new THREE.Mesh(new THREE.BoxGeometry(0.056, 0.018, 0.008), white); g.add(m1);
      for (const y of [-0.0095, 0.0095]) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.004, 0.01), ink); l.position.y = y; g.add(l); }
      for (const x of [-0.014, 0, 0.014]) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.003, 0.018, 0.01), ink); l.position.x = x; g.add(l); } }

    /* ---------- Trạng thái và chuyển mềm ---------- */
    let target = BY_KEY.neutral, closed = false, blinkAt = 2, blinkT = 0;
    const cur = { eye: [1, 1], pupil: 1, brow: [0, 0], tilt: [0, 0], mw: 0.8, mx: 0, cheek: 0 };
    function set(key) { if (BY_KEY[key]) target = BY_KEY[key]; for (const k in F.mouths) F.mouths[k].visible = k === target.mouth; }
    function setClosed(on) { closed = !!on; }
    set('neutral');
    function update(dt, t) {
      const k = 1 - Math.exp(-dt / 0.12);
      for (const i of [0, 1]) { cur.eye[i] += (target.eye[i] - cur.eye[i]) * k; cur.brow[i] += (target.brow[i] - cur.brow[i]) * k; cur.tilt[i] += (target.tilt[i] - cur.tilt[i]) * k; }
      cur.pupil += (target.pupil - cur.pupil) * k; cur.mw += (target.mw - cur.mw) * k; cur.mx += (target.mx - cur.mx) * k; cur.cheek += (target.cheek - cur.cheek) * k;
      // chớp mắt vài giây một lần
      if (t > blinkAt) { blinkT = 0.14; blinkAt = t + 2.2 + Math.random() * 3; }
      blinkT = Math.max(0, blinkT - dt / 1000);
      const shut = closed ? 0.08 : blinkT > 0 ? 0.12 : 1;
      for (const i of [0, 1]) {
        const sx = i === 0 ? 1 : -1, open = cur.eye[i] * shut;
        F.eyes[i].scale.set(0.032 * cur.pupil * (closed ? 1.3 : 1), 0.04 * open, 0.016);
        F.shines[i].visible = open > 0.3; F.shines[i].scale.setScalar(0.011 * cur.pupil);
        F.brows[i].position.y = 0.245 + cur.brow[i] + (closed ? -0.01 : 0);
        F.brows[i].rotation.z = sx * cur.tilt[i] * 0.5; // dương: đầu trong cụp xuống (chau mày)
      }
      pink.opacity = 0.6 * cur.cheek;
      for (const key in F.mouths) { const m = F.mouths[key]; m.position.x = cur.mx; if (key !== 'small' && key !== 'open') m.scale.x = cur.mw; }
    }
    return { set, setClosed, update, get key() { return target.key; } };
  }

  return { EXPR, BY_KEY, create };
});
