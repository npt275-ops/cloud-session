/* Bể Kính · render/build/plains/e02.js · Cấp 2, Cổ đại (Lúa Vàng)
 * Biết nung gạch, làm gốm và trồng lúa: Cung Đất Nung (nhà chính, nhà sàn dài vách đất nung), lều tròn vách đất mái rơm,
 * kho lương trên cột có đĩa chặn chuột, thửa ruộng có bờ và rào, lò gốm và chum vại, giàn phơi lúa, cột vật tổ sơn,
 * đống rơm, đá thờ. */
(function (root) {
  const BK = root.BK, P = BK.Plains3D, K = BK.BuildKit, { C, pick, B, Bc, ring, homes, COMMON } = P;

  // Cung Đất Nung: nhà sàn dài vách đất nung, mái rơm trùm gần chạm sàn, hai cột chạm ở lối vào, cầu thang gỗ
  function hall(k) {
    for (const x of [-3.2, -1.6, 0, 1.6, 3.2]) for (const z of [-1.8, 0, 1.8]) k.add(K.post(0.14, 0.72, 6), C.wood, x, 0, z);
    k.add(K.box(7.6, 0.2, 4.4, 0.06, true), C.woodL, 0, 0.7, 0);
    k.add(K.box(6.8, 1.95, 3.6, 0.1, true), '#b8683e', 0, 0.9, 0);
    for (let i = 0; i < 4; i++) k.add(K.box(6.86, 0.08, 3.66, 0.02, true), '#9a5232', 0, 1.2 + i * 0.42, 0, { ao: false }); // các lớp gạch đất nung
    k.add(K.box(1.05, 1.65, 0.14, 0.04, true), C.dark, 0, 0.9, 1.78, { ao: false });
    for (const sx of [-1, 1]) { k.add(K.box(0.6, 0.5, 0.1, 0.03, true), C.dark, sx * 2.2, 1.7, 1.79, { ao: false }); k.add(K.box(0.08, 0.5, 0.14, 0.02, true), C.woodL, sx * 2.2, 1.7, 1.8); }
    // cầu thang: hai thanh dọc và bốn bậc, từ sàn xuống đất
    for (const sx of [-0.42, 0.42]) k.add(K.box(0.1, 1.4, 0.1, 0.03), C.woodL, sx, 0.45, 2.55, { rot: [-0.62, 0, 0] });
    for (let i = 0; i < 4; i++) k.add(K.box(0.9, 0.08, 0.18, 0.03), C.woodL, 0, 0.12 + i * 0.17, 2.95 - i * 0.24);
    // hai cột chạm trước cửa: đầu sơn đỏ, sừng trâu
    for (const sx of [-1, 1]) {
      k.add(K.post(0.13, 3.1, 6), C.wood, sx * 1.0, 0, 2.3);
      for (let i = 0; i < 3; i++) k.add(K.box(0.32, 0.18, 0.32, 0.05, true), i % 2 ? C.ochre : C.paint, sx * 1.0, 1.2 + i * 0.55, 2.3);
      k.add(K.cone(0.09, 0.55, 5), C.bone, sx * 1.0 + sx * 0.18, 3.05, 2.3, { rot: [0, 0, -sx * 0.8] });
      k.add(K.cone(0.09, 0.55, 5), C.bone, sx * 1.0 - sx * 0.18, 3.05, 2.3, { rot: [0, 0, sx * 0.8] });
    }
    k.add(K.roof(9.8, 3.4, 6.4, 0.45, 5.4, 0.55), C.thatch[0], 0, 2.55, 0);
    k.add(K.box(5.8, 0.32, 0.62, 0.12, true), C.thatchD, 0, 5.9, 0);
    for (const sx of [-1, 1]) for (const r of [-0.55, 0.55]) k.add(K.cone(0.1, 0.9, 5), C.wood, sx * 2.85, 6.1, 0, { rot: [0, 0, r - sx * 0.25] });
  }
  // lều tròn mái rơm: tường đất, cửa thấp, mái nón dày; v đổi màu và đồ trước cửa
  function hut(k, o) {
    const v = o.v || 0;
    k.add(K.lathe([[1.5, 0], [1.55, 0.3], [1.47, 1.7], [1.38, 1.85]], 9), pick(C.mud, v), 0, 0, 0);
    k.add(K.box(0.95, 1.58, 0.5, 0.05, true), C.dark, 0, 0, 1.3, { ao: false });
    k.add(K.box(1.15, 0.14, 0.55, 0.04, true), C.woodL, 0, 1.58, 1.33);
    k.add(K.lathe([[2.3, 1.55], [2.15, 1.78], [1.35, 2.75], [0.55, 3.45], [0.16, 3.75], [0.001, 3.8]], 9), pick(C.thatch, v + 0.3), 0, 0, 0);
    k.add(K.cone(0.2, 0.5, 6), C.thatchD, 0, 3.7, 0);
    if (v % 3 === 0) k.add(K.lathe([[0.001, 0], [0.28, 0.05], [0.34, 0.3], [0.22, 0.52], [0.24, 0.6]], 8), '#a8603e', 1.05, 0, 1.55); // chum nước
    if (v % 3 === 1) k.add(K.box(1.4, 0.32, 0.36, 0.1, true), C.woodL, -1.3, 0, 1.25, { rot: [0, 0.5, 0] }); // khúc gỗ ngồi
  }
  // kho lương nhỏ trên cột, có đĩa chặn chuột
  function granary(k) {
    for (const [x, z] of [[-0.7, -0.7], [0.7, -0.7], [-0.7, 0.7], [0.7, 0.7]]) { k.add(K.post(0.1, 1.05, 6), C.wood, x, 0, z); k.add(K.post(0.26, 0.06, 8, 0.26), C.stone[1], x, 0.75, z); }
    k.add(K.box(2.0, 0.14, 2.0, 0.05, true), C.woodL, 0, 1.05, 0);
    k.add(K.box(1.7, 1.25, 1.7, 0.08, true), '#b88a58', 0, 1.19, 0);
    k.add(K.box(0.5, 0.6, 0.08, 0.03, true), C.dark, 0, 1.4, 0.86, { ao: false });
    k.add(K.roof(2.7, 1.35, 2.7, 0.3, 0.4, 0.4), C.thatch[1], 0, 2.35, 0);
    for (const sx of [-0.24, 0.24]) k.add(K.box(0.07, 1.5, 0.07, 0.02), C.woodL, sx, 0.62, 1.45, { rot: [-0.5, 0, 0] });
  }
  // cột vật tổ: khúc gỗ cao sơn từng tầng, trên đỉnh một con chim
  function totem(k) {
    k.add(K.post(0.24, 4.2, 7, 0.2), C.wood, 0, 0, 0);
    const band = [C.paint, C.ochre, C.bone, C.paint, '#3f6b5a'];
    for (let i = 0; i < 5; i++) k.add(K.box(0.6, 0.36, 0.6, 0.1, true), band[i], 0, 0.6 + i * 0.66, 0, { rot: [0, i * 0.4, 0] });
    for (const sx of [-1, 1]) k.add(K.box(0.9, 0.12, 0.3, 0.04, true), C.bone, sx * 0.5, 3.05, 0, { rot: [0, 0, sx * 0.25] });
    k.add(K.ball(0.3), C.bone, 0, 4.45, 0, { sc: [1, 0.8, 1.3] }); k.add(K.cone(0.09, 0.3, 4), C.ochre, 0, 4.4, 0.42, { rot: [Math.PI / 2, 0, 0] });
    for (const sx of [-1, 1]) k.add(K.box(0.7, 0.06, 0.32, 0.02, true), C.bone, sx * 0.4, 4.4, -0.05, { rot: [0, 0, sx * 0.35] });
  }
  // giàn phơi lúa: hai chân chữ A, xà ngang, bó lúa treo
  function rack(k) {
    for (const sx of [-1.4, 1.4]) for (const r of [-0.28, 0.28]) k.add(K.box(0.09, 2.0, 0.09, 0.03, true), C.woodL, sx, 0, 0, { rot: [r, 0, 0] });
    k.add(K.box(3.2, 0.1, 0.1, 0.03, true), C.woodL, 0, 1.88, 0);
    for (let i = 0; i < 6; i++) k.add(K.cone(0.16, 0.7, 5), i % 2 ? '#e0bf4a' : '#d4ae3c', -1.1 + i * 0.44, 1.12, 0, { rot: [Math.PI, 0, 0], sc: [1, 1, 1] });
  }
  // lò gốm: lò vòm bằng gạch, ống khói, cửa lò đỏ lửa, chum vại xếp quanh
  function kiln(k) {
    k.add(K.lathe([[1.6, 0], [1.62, 0.6], [1.35, 1.4], [0.8, 1.95], [0.001, 2.1]], 9), '#a5552f', 0, 0, 0);
    k.add(K.post(0.32, 1.6, 7, 0.26), '#8f4a2a', 0.6, 1.4, -0.4);
    k.add(B(0.7, 0.7, 0.4, 0.06), C.dark, 0, 0, 1.45, { ao: false }); k.add(B(0.5, 0.45, 0.1, 0.03), '#ff8a2e', 0, 0.05, 1.62, { glow: true });
    for (let i = 0; i < 7; i++) { const a = -0.6 + i * 0.5, r = 2.4 + (i % 2) * 0.45, s = 0.8 + (i % 3) * 0.2; k.add(K.lathe([[0.001, 0], [0.26 * s, 0.05], [0.34 * s, 0.32 * s], [0.2 * s, 0.6 * s], [0.24 * s, 0.68 * s]], 8), ['#a8603e', '#8a4a2e', '#c27a4a'][i % 3], Math.sin(a) * r, 0, Math.cos(a) * r); }
    for (const sx of [-1, 1]) k.add(B(0.9, 0.5, 0.5, 0.1), C.stone[1], sx * 1.9, 0, -1.3);
  }

  P.ERA[2] = {
    yard: { x: 0, z: 2.5, r: 13, color: '#c2a77a' },
    pieces: [
      { kind: 'hall', x: 0, z: -2.5, clear: 6.5 },
      { kind: 'fire', x: 0, z: 6.5, clear: 3 },
      { kind: 'totem', x: -3.4, z: 7.6, clear: 1 },
      ...homes('hut'),
      { kind: 'hut', x: 0, z: -11.5, face: [0, 6.5], v: 7, clear: 2.6 },
      { kind: 'granary', x: -5.5, z: -9.5, face: [0, 6.5], clear: 2 }, { kind: 'granary', x: 6, z: -9.5, face: [0, 6.5], clear: 2 },
      { kind: 'kiln', x: 13.5, z: 4, face: [0, 6.5], clear: 3.5 },
      { kind: 'rack', x: 4.6, z: 10, clear: 2 },
      { kind: 'field', x: -13, z: 13, w: 8, d: 5.5, clear: 5 }, { kind: 'field', x: -4, z: 17, w: 7, d: 4, clear: 4.5 },
      { kind: 'hay', x: -7.6, z: 9.8, s: 1, clear: 1.2 }, { kind: 'hay', x: 3.5, z: 15.5, s: 0.8, clear: 1 },
      { kind: 'stones', x: 13.5, z: 12, face: [0, 6.5], clear: 2.6 },
    ],
    BUILD: { hall, hut, granary, kiln, totem, rack, fire: COMMON.fire, field: COMMON.field, hay: COMMON.hay, stones: COMMON.stones },
    NAME: { hall: 'Cung Đất Nung', hut: 'Lều tròn vách đất', granary: 'Kho lương', kiln: 'Lò gốm', totem: 'Cột vật tổ', rack: 'Giàn phơi lúa', fire: 'Bếp lửa chung', field: 'Ruộng lúa', hay: 'Đống rơm', stones: 'Bãi đá thờ' },
  };
})(typeof self !== 'undefined' ? self : globalThis);
