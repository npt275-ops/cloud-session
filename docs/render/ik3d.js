/* Bể Kính · render/ik3d.js
 * Tay tự tìm đúng chỗ chạm trên cơ thể (IK hai khúc: bắp tay, cẳng tay): chống hông, chống cằm, chắp tay, khoanh tay,
 * ôm bụng, che mặt, gãi đầu... Cử chỉ chỉ cần ghi điểm bàn tay phải tới (theo một mốc của cơ thể) và hướng khuỷu tay;
 * tệp này tính góc vai và khuỷu sao cho tâm bàn tay đặt đúng vào điểm đó.
 * Mốc: 'pelvis' (hông, bụng), 'chest' (ngực), 'head' (cằm, mặt, đỉnh đầu). Toạ độ theo khung ở render/rig3d.js.
 * Cần: three.js. Được gọi từ render/anim3d.js sau khi đã đặt góc thân và đầu. */
(function (root, factory) {
  const BK = root.BK || (root.BK = {});
  BK.IK3D = factory();
})(typeof self !== 'undefined' ? self : globalThis, function () {
  'use strict';
  const L1 = 0.3,
    L2 = 0.3; // bắp tay (vai tới khuỷu), cẳng tay tới tâm bàn tay
  let V = null;
  function tmp() {
    if (V) return V;
    const T = window.THREE;
    V = {
      T,
      m: new T.Matrix4(),
      m2: new T.Matrix4(),
      p: new T.Vector3(),
      s: new T.Vector3(),
      d: new T.Vector3(),
      pole: new T.Vector3(),
      perp: new T.Vector3(),
      u: new T.Vector3(),
      e: new T.Vector3(),
      f: new T.Vector3(),
      x: new T.Vector3(),
      y: new T.Vector3(),
      z: new T.Vector3(),
      q: new T.Quaternion(),
      qFk: new T.Quaternion(),
      basis: new T.Matrix4(),
    };
    return V;
  }

  // đổi một điểm từ mốc cơ thể sang hệ toạ độ của ngực (vai là con của ngực)
  function toChest(rig, space, xyz, out) {
    const t = tmp(),
      n = rig.nodes;
    out.set(xyz[0], xyz[1], xyz[2]);
    if (space === 'chest') return out;
    if (space === 'head') {
      n.neck.updateMatrix();
      n.head.updateMatrix();
      return out.applyMatrix4(n.head.matrix).applyMatrix4(n.neck.matrix);
    }
    // pelvis: ngực là con của hông, nên nhân ngược ma trận của ngực
    n.chest.updateMatrix();
    t.m2.copy(n.chest.matrix).invert();
    return out.applyMatrix4(t.m2);
  }

  // đặt một cánh tay ('L' hoặc 'R') với độ nặng w (0: giữ góc cũ, 1: theo đúng điểm chạm)
  function solveArm(rig, side, ik, w) {
    if (!ik || w <= 0.001) return;
    const t = tmp(),
      n = rig.nodes,
      sh = n['sh' + side],
      el = n['el' + side];
    t.s.copy(sh.position);
    toChest(rig, ik.s || 'chest', ik.p, t.p);
    t.d.copy(t.p).sub(t.s);
    const D = Math.max(0.05, Math.min(L1 + L2 - 0.005, t.d.length()));
    t.d.normalize();
    // hướng khuỷu: mặc định chĩa xuống, ra ngoài, hơi ra sau
    const sx = side === 'L' ? 1 : -1,
      pl = ik.pole || [0.6, -1, -0.35];
    t.pole.set(pl[0] * sx, pl[1], pl[2]).normalize();
    t.perp.copy(t.pole).addScaledVector(t.d, -t.pole.dot(t.d));
    if (t.perp.lengthSq() < 1e-6) t.perp.set(0, -1, 0).addScaledVector(t.d, t.d.y);
    t.perp.normalize();
    // định lý cos: góc ở vai giữa đường vai–tay và bắp tay
    const ca = (L1 * L1 + D * D - L2 * L2) / (2 * L1 * D),
      a = Math.acos(Math.max(-1, Math.min(1, ca)));
    t.u.copy(t.d).multiplyScalar(Math.cos(a)).addScaledVector(t.perp, Math.sin(a)).normalize(); // hướng bắp tay
    t.e.copy(t.s).addScaledVector(t.u, L1);
    t.f.copy(t.p).sub(t.e).normalize(); // hướng cẳng tay
    // khung của vai: trục -y theo bắp tay, cẳng tay gập về phía trục +z
    t.y.copy(t.u).negate();
    t.z.copy(t.f).addScaledVector(t.u, -t.f.dot(t.u));
    if (t.z.lengthSq() < 1e-6) t.z.set(0, 0, 1);
    t.z.normalize();
    t.x.crossVectors(t.y, t.z).normalize();
    t.z.crossVectors(t.x, t.y).normalize();
    t.basis.makeBasis(t.x, t.y, t.z);
    t.q.setFromRotationMatrix(t.basis);
    const bend = Math.acos(Math.max(-1, Math.min(1, t.u.dot(t.f))));
    // trộn với góc cũ cho chuyển động mềm
    t.qFk.copy(sh.quaternion);
    sh.quaternion.copy(t.qFk).slerp(t.q, w);
    el.rotation.set(el.rotation.x + (-bend - el.rotation.x) * w, 0, 0);
  }

  return { solveArm, L1, L2 };
});
