/* Bể Kính · render/build/plains/e01.js · Cấp 1, Thời đồ đá (Lúa Vàng)
 * Người mới biết lửa, rìu đá và hái lượm: lều lớn của tù trưởng (khung cành phủ da thú), lều nón bằng cành phủ lá,
 * lều da thú, bếp lửa chung, bãi ghè đá, giàn phơi da, bãi lúa dại ven sông (chưa có bờ, chưa có rào), cột vật tổ có
 * sọ thú, đá dựng, vách đá vẽ thổ hoàng. Chưa có gạch, gốm, ruộng rào, kho lương, nhà sàn. */
(function (root) {
  const BK = root.BK, P = BK.Plains3D, K = BK.BuildKit, { C, pick, B, Bc, ring, homes, COMMON } = P;
  const skull = (k, x, y, z, s) => { s = s || 1; k.add(K.ball(0.22 * s), C.bone, x, y, z, { sc: [1, 0.8, 1.2] }); for (const sx of [-1, 1]) k.add(K.cone(0.07 * s, 0.5 * s, 5), C.bone, x + sx * 0.22 * s, y + 0.08 * s, z, { rot: [0, 0, -sx * 1.1] }); };

  // lều lớn của tù trưởng: vòm thấp phủ da thú nhiều mảnh, cành chĩa lên đỉnh, đá dựng và sọ trâu ở lối vào
  function hall(k) {
    k.add(K.lathe([[3.6, 0], [3.55, 0.7], [3.1, 1.8], [2.2, 2.7], [1.0, 3.2], [0.001, 3.35]], 10), C.hide[0], 0, 0, 0);
    for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2 + 0.3; k.add(B(1.6, 0.05, 1.3, 0.02), pick(C.hide, i * 0.4 + 0.2), Math.cos(a) * 2.9, 1.95, Math.sin(a) * 2.9, { rot: [0, -a, 0.75], ao: false }); }
    for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2; k.add(K.post(0.06, 1.3, 4), '#6b4a30', Math.cos(a) * 0.3, 2.95, Math.sin(a) * 0.3, { rot: [Math.sin(a) * 0.35, 0, -Math.cos(a) * 0.35] }); }
    k.add(B(1.25, 1.75, 1.6, 0.08), C.hide[1], 0, 0, 3.0); k.add(B(0.9, 1.5, 0.12, 0.03), C.dark, 0, 0, 3.82, { ao: false });
    for (const sx of [-1, 1]) { k.add(B(0.6, 2.1, 0.42, 0.12), C.stone[1], sx * 1.7, 0, 4.2, { rot: [0, 0, sx * 0.05] }); }
    k.add(K.post(0.09, 2.3, 5), C.wood, 0.9, 0, 4.6); skull(k, 0.9, 2.45, 4.6, 1.2);
  }
  // lều nón bằng cành phủ lá: cành chĩa ra trên đỉnh, cửa thấp
  function hut(k, o) {
    const leaf = ['#a89a5a', '#9c9050', '#b3a463'][o.v % 3];
    k.add(K.lathe([[1.7, 0], [1.35, 1.2], [0.6, 2.5], [0.001, 2.95]], 8), leaf, 0, 0, 0);
    for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2 + o.v; k.add(K.post(0.05, 1.0, 4), '#6b4a30', Math.cos(a) * 0.12, 2.55, Math.sin(a) * 0.12, { rot: [Math.sin(a) * 0.45, 0, -Math.cos(a) * 0.45] }); }
    k.add(B(0.85, 1.35, 0.6, 0.05), C.dark, 0, 0, 1.25, { ao: false });
    for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2 + 0.6 + o.v; k.add(B(0.9, 0.05, 0.6, 0.02), ['#8a7c44', '#bdb070'][i % 2], Math.cos(a) * 1.1, 1.25, Math.sin(a) * 1.1, { rot: [0, -a, 0.62], ao: false }); }
  }
  // lều da thú hình mái nhà, căng trên hai cọc chữ A
  function tent(k, o) {
    for (const sx of [-1, 1]) k.add(Bc(0.06, 2.6, 2.8, 0.02), pick(C.hide, o.v * 0.3 + (sx > 0 ? 0.5 : 0)), sx * 0.75, 0.95, 0, { rot: [0, 0, sx * 0.55] });
    for (const z of [-1.35, 1.35]) for (const sx of [-1, 1]) k.add(K.post(0.05, 2.3, 4), '#6b4a30', sx * 0.55, 0, z, { rot: [0, 0, sx * 0.5] });
    k.add(Bc(0.08, 0.08, 3.1, 0.02), '#6b4a30', 0, 2.05, 0);
    k.add(B(0.9, 1.1, 0.06, 0.02), C.dark, 0, 0, 1.36, { ao: false });
  }
  // bãi ghè đá: tảng đá làm bàn, mảnh đá vụn, rìu đá đang làm, đống đá thô
  function knap(k) {
    k.add(K.ball(0.75), C.stone[0], 0, 0.35, 0, { sc: [1.3, 0.6, 1] });
    for (let i = 0; i < 14; i++) { const a = i * 2.4, r = 0.9 + (i % 4) * 0.25; k.add(K.ball(0.09), pick(C.stone, i * 0.2), Math.cos(a) * r, 0.04, Math.sin(a) * r, { sc: [1.4, 0.5, 1] }); }
    k.add(B(0.07, 0.55, 0.07, 0.02), C.woodL, 0.2, 0.62, 0.1, { rot: [0, 0, 1.3] }); k.add(K.ball(0.12), '#6d6b66', -0.08, 0.68, 0.1, { sc: [1, 0.7, 0.5] });
    for (let i = 0; i < 6; i++) k.add(K.ball(0.3), pick(C.stone, i * 0.5), 1.6 + (i % 3) * 0.35, 0.18 + Math.floor(i / 3) * 0.3, -0.9 + (i % 2) * 0.3);
    for (const a of [0.6, 2.2, 3.8]) k.add(B(0.6, 0.32, 0.5, 0.12), C.stone[2], Math.cos(a) * 1.6, 0, Math.sin(a) * 1.6);
  }
  // giàn phơi da: ba cọc, xà ngang, hai tấm da căng
  function hideRack(k) {
    for (const x of [-1.6, 0, 1.6]) k.add(K.post(0.06, 2.1, 4), '#6b4a30', x, 0, 0);
    k.add(Bc(3.5, 0.07, 0.07, 0.02), '#6b4a30', 0, 2.0, 0);
    for (const x of [-0.8, 0.8]) k.add(Bc(1.3, 1.3, 0.04, 0.02), pick(C.hide, x + 1), x, 1.3, 0, { rot: [0, 0, x * 0.05], ao: false });
  }
  // bãi lúa dại: những khóm lúa mọc tự nhiên, không bờ không rào
  function wildRice(k, o) {
    const R = o.r || 3.5;
    for (let i = 0; i < 34; i++) { const a = i * 2.399, r = Math.sqrt((i + 0.5) / 34) * R, s = 0.7 + ((i * 7) % 5) * 0.1; k.add(K.lathe([[0.22 * s, 0], [0.3 * s, 0.4 * s], [0.12 * s, 0.85 * s], [0.001, 0.95 * s]], 5), pick(['#c9b85a', '#b8b04e', '#d6c262', '#9fae4e'], i * 0.13), Math.cos(a) * r, 0, Math.sin(a) * r); }
  }
  // cột vật tổ thô: khúc gỗ, sọ thú, lông chim
  function totem(k) {
    k.add(K.post(0.24, 3.4, 6, 0.18), C.wood, 0, 0, 0);
    for (let i = 0; i < 3; i++) k.add(Bc(0.52, 0.12, 0.52, 0.04), [C.ochre, C.paint, C.bone][i], 0, 1.0 + i * 0.75, 0, { rot: [0, i * 0.7, 0] });
    skull(k, 0, 3.55, 0.05, 1.3);
    for (let i = 0; i < 4; i++) k.add(K.cone(0.05, 0.6, 4), ['#d24a2e', '#f0f0e8', '#2e6ab8', '#e0b030'][i], -0.2 + i * 0.13, 3.0, -0.15, { rot: [-0.4, 0, -0.4 + i * 0.27] });
  }
  // vách đá vẽ: tảng đá lớn, mặt trước vẽ người và thú bằng thổ hoàng
  function paintedRock(k) {
    k.add(K.ball(1, 1), C.stone[1], 0, 1.3, 0, { sc: [2.4, 1.6, 1.2] });
    const ink = '#b8582e';
    for (let f = 0; f < 3; f++) { const x = -1.2 + f * 0.8; k.add(Bc(0.07, 0.45, 0.04, 0.01), ink, x, 1.45, 1.17, { ao: false }); k.add(Bc(0.4, 0.06, 0.04, 0.01), ink, x, 1.55, 1.17, { ao: false }); k.add(K.ball(0.07), ink, x, 1.76, 1.16, { ao: false }); }
    k.add(Bc(0.7, 0.28, 0.04, 0.01), ink, 1.1, 1.3, 1.12, { ao: false }); for (const lx of [0.85, 1.35]) k.add(Bc(0.06, 0.3, 0.04, 0.01), ink, lx, 1.05, 1.12, { ao: false });
  }

  P.ERA[1] = {
    yard: { x: 0, z: 2.5, r: 11, color: '#b9a27a' },
    pieces: [
      { kind: 'hall', x: 0, z: -2.5, clear: 6 },
      { kind: 'fire', x: 0, z: 5.5, clear: 3 },
      ...homes('hut'),
      { kind: 'tent', x: -5.5, z: -8.5, face: [0, 5.5], v: 1, clear: 2.4 }, { kind: 'tent', x: 6, z: -8.5, face: [0, 5.5], v: 2, clear: 2.4 },
      { kind: 'knap', x: 5.2, z: 9.0, clear: 2.4 }, { kind: 'hideRack', x: -5.0, z: 9.6, clear: 2.2 },
      { kind: 'totem', x: -2.8, z: 7.4, clear: 1 },
      { kind: 'wildRice', x: -13, z: 11, r: 3.6, clear: 4 }, { kind: 'wildRice', x: -9.5, z: 15.5, r: 2.4, clear: 3 },
      { kind: 'stones', x: 13, z: 10.5, face: [0, 5.5], clear: 2.6 },
      { kind: 'paintedRock', x: 12.5, z: -5.5, face: [0, 5.5], clear: 3.4 },
    ],
    BUILD: { hall, hut, tent, knap, hideRack, wildRice, totem, paintedRock, fire: COMMON.fire, stones: COMMON.stones },
    NAME: { hall: 'Lều lớn của tù trưởng', hut: 'Lều nón cành lá', tent: 'Lều da thú', fire: 'Bếp lửa chung', knap: 'Bãi ghè đá', hideRack: 'Giàn phơi da', wildRice: 'Bãi lúa dại', totem: 'Cột vật tổ', stones: 'Đá dựng', paintedRock: 'Vách đá vẽ' },
  };
})(typeof self !== 'undefined' ? self : globalThis);
