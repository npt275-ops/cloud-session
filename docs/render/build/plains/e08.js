/* Bể Kính · render/build/plains/e08.js · Cấp 8, Robot AI (Lúa Vàng)
 * Robot, trí tuệ nhân tạo, máy tính lượng tử: Lõi Trí Tuệ (nhà chính, quả cầu tối trên bệ, vòng sáng quay), nhà mô-đun
 * xếp chồng có vạch sáng, trung tâm dữ liệu, bãi đỗ drone (drone bay nhấp nhô), robot làm ruộng, đường sáng. */
(function (root) {
  const BK = root.BK, P = BK.Plains3D, K = BK.BuildKit, { C, pick, B, Bc, ring, homes, COMMON } = P;
  const T = () => window.THREE, CY = '#5fe8ff';
  const torus = (R, t) => new (T().TorusGeometry)(R, t, 4, 24);

  function hall(k) {
    k.add(K.lathe([[7, 0], [7, 0.5], [5.4, 1.2], [4, 3.2], [3.4, 3.4]], 10), '#3a4250', 0, 0, 0);
    for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; k.add(Bc(0.2, 0.12, 2.4, 0.02), CY, Math.sin(a) * 6, 0.55, Math.cos(a) * 6, { rot: [0, a, 0], glow: true }); }
    k.add(K.ball(4.2, 1), '#26303c', 0, 7.4, 0);
    const r = k.sub('rings', [0, 7.4, 0]);
    r.add(torus(5.4, 0.12), CY, 0, 0, 0, { rot: [Math.PI / 2, 0, 0], glow: true }); r.add(torus(5.0, 0.1), '#b48cff', 0, 0, 0, { rot: [Math.PI / 2 + 0.5, 0.3, 0], glow: true });
    k.add(K.ball(1.2, 1), CY, 0, 7.4, 3.6, { glow: true, sc: [1, 1, 0.4] });
    return { spin: [['rings', 'y', 0.6]] };
  }
  // nhà mô-đun: các khối xếp lệch, vạch sáng ở mép, ô cửa tối
  function pods(k, o) {
    const n = 3 + (o.v % 3), base = pick(['#e8ecf0', '#d0d8e2', '#f2f4f6'], o.v * 0.3);
    for (let i = 0; i < n; i++) { const w = 3.6 - (i % 2) * 0.8, x = (i % 2 ? 0.6 : -0.3), y = i * 2.2; k.add(B(w, 2.0, 3.0, 0.2), base, x, y, 0); k.add(Bc(w * 0.7, 0.9, 0.08, 0.04), '#2a3a4a', x, y + 1.1, 1.52, { ao: false }); k.add(Bc(w + 0.04, 0.08, 0.08, 0.02), CY, x, y + 2.0, 1.5, { glow: true }); }
    k.add(Bc(0.9, 1.8, 0.08, 0.04), '#2a3a4a', -0.3, 0.9, 1.53, { ao: false });
    for (let i = 0; i < n; i++) { const w = 3.6 - (i % 2) * 0.8, x = (i % 2 ? 0.6 : -0.3), y = i * 2.2; k.add(Bc(w * 0.62, 0.78, 0.04, 0.01), '#bff0ff', x, y + 1.1, 1.6, { lit: true }); } // ô cửa sáng về đêm
  }
  function datacenter(k) {
    k.add(B(10, 3, 5, 0.1), '#2e343e', 0, 0, 0);
    for (let i = 0; i < 8; i++) k.add(Bc(0.1, 2.2, 0.06, 0.02), i % 2 ? CY : '#b48cff', -4.2 + i * 1.2, 1.5, 2.52, { glow: true });
    for (let i = 0; i < 4; i++) k.add(B(1.4, 0.6, 1.4, 0.1), '#4a5260', -3.6 + i * 2.4, 3, 0);
  }
  // bãi drone: sân tròn có vòng sáng, hai drone bay nhấp nhô
  function dronePad(k) {
    k.add(K.post(2.2, 0.2, 12, 2.2), '#3a4250', 0, 0, 0); k.add(new (T().TorusGeometry)(1.8, 0.06, 4, 20).rotateX(Math.PI / 2), CY, 0, 0.22, 0, { glow: true });
    const d = k.sub('drone', [0, 3.2, 0]);
    d.add(Bc(0.8, 0.25, 0.8, 0.08), '#e8ecf0', 0, 0, 0);
    for (const [x, z] of [[-0.55, -0.55], [0.55, -0.55], [-0.55, 0.55], [0.55, 0.55]]) { d.add(Bc(0.5, 0.05, 0.08, 0.02), '#3a4250', x / 2, 0.05, z / 2, { rot: [0, Math.atan2(z, x), 0] }); d.add(K.post(0.2, 0.03, 8, 0.2), '#2a2a2e', x, 0.12, z); }
    d.add(K.ball(0.08), CY, 0, -0.15, 0.4, { glow: true });
    return { bob: [['drone', 0.5, 1.3]] };
  }
  // robot làm ruộng: thân tròn, đầu có mắt sáng, bánh xích
  function robot(k) {
    k.add(B(0.9, 0.35, 1.2, 0.1), '#3a4250', 0, 0, 0); k.add(Bc(0.8, 0.9, 0.7, 0.2), '#e8ecf0', 0, 0.85, 0); k.add(K.ball(0.32, 1), '#d0d8e2', 0, 1.55, 0);
    for (const sx of [-1, 1]) k.add(K.ball(0.06), CY, sx * 0.12, 1.6, 0.28, { glow: true });
    for (const sx of [-1, 1]) k.add(Bc(0.12, 0.6, 0.12, 0.05), '#9aa4ae', sx * 0.5, 0.85, 0.15, { rot: [-0.6, 0, 0] });
  }
  function glowRoad(k, o) { const d = o.d || 30; k.add(B(4.6, 0.05, d, 0.02), '#2e323a', 0, 0, 0, { ao: false }); for (const x of [-2.1, 2.1]) k.add(B(0.1, 0.06, d, 0.01), CY, x, 0.01, 0, { glow: true }); }

  const F = [0, 6];
  P.ERA[8] = {
    yard: { x: 0, z: 2, r: 22, color: '#8a8e96' },
    pieces: [
      { kind: 'hall', x: 0, z: -8, clear: 8 },
      { kind: 'glowRoad', x: 0, z: 10, d: 22, clear: 0 }, { kind: 'glowRoad', x: 0, z: 4, d: 36, face: [30, 4], clear: 0 },
      ...homes('pods'),
      { kind: 'datacenter', x: -16, z: -14, face: [0, 6], clear: 6 },
      { kind: 'dronePad', x: 10, z: 12, clear: 2.6 }, { kind: 'dronePad', x: 14, z: 16, clear: 2.6 },
      { kind: 'field', x: -15, z: 15, w: 9, d: 6, fence: false, clear: 6 }, { kind: 'robot', x: -13, z: 15, face: [-30, 15], clear: 0.6 }, { kind: 'robot', x: -17, z: 13.5, face: [0, 13.5], clear: 0.6 },
    ],
    BUILD: { hall, pods, datacenter, dronePad, robot, glowRoad, field: COMMON.field },
    NAME: { hall: 'Lõi Trí Tuệ', pods: 'Nhà mô-đun', datacenter: 'Trung tâm dữ liệu', dronePad: 'Bãi drone', robot: 'Robot làm ruộng', glowRoad: 'Đường sáng', field: 'Ruộng lúa' },
  };
})(typeof self !== 'undefined' ? self : globalThis);
