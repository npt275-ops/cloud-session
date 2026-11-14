/* Bể Kính · render/body/face3d.js · Mặt, tóc, râu và biểu cảm của thân mềm (design/ke-hoach-buoc-34.md điểm 1, 2, 3, 6)
 * build(ctx) thêm vào lưới thân mềm (render/body/softbody3d.js) các khối của mặt và tóc theo nét riêng của người đó
 * (render/body/traits3d.js): mắt có đốm sáng, lông mày, mũi, tai, má hồng, tàn nhang, bốn kiểu miệng, tóc theo kiểu, râu.
 * Biểu cảm không dựng lại lưới: mỗi đỉnh mang mã bộ phận (aPart) và tâm của khối nó thuộc về (aCtr); shader (VERT) co giãn
 * quanh tâm theo vài số của người đó (uniforms(), update(U, f) mỗi khung hình từ f.expr, f.closed của render/village3d.js):
 *   mắt   co theo độ mở (chớp mắt, nheo khi cười, trợn khi sợ); đốm sáng tắt khi nhắm
 *   mày   nâng, hạ, nghiêng (giận: chụm xuống giữa; buồn: xếch lên giữa)
 *   miệng một trong bốn: thẳng, cười, mếu, há; khối không dùng thì co về tâm (không thấy)
 *   má    hồng khi vui (trẻ nhỏ luôn hồng)
 * Viền nét (INK) bỏ qua các khối của mặt (mặt không có viền đen quanh mắt, miệng).
 * Mã bộ phận dùng chung với thân: 0 vải, 1 da, 2 tóc, 3 giày; từ 10 trở lên là khối biểu cảm (PART).
 * Cần: three.js (qua ctx), render/body/traits3d.js. */
(function (root) {
  const BK = root.BK || (root.BK = {});
  const PART = { CLOTH: 0, SKIN: 1, HAIR: 2, SHOE: 3, EYE: 10, SHINE: 11, BROW_L: 12, BROW_R: 13, M_LINE: 14, M_SMILE: 15, M_FROWN: 16, M_OPEN: 17, CHEEK: 18 };
  const MOUTH = { line: 0, smile: 1, frown: 2, open: 3 };
  // đoạn shader đỉnh (trước khi gắn xương: toạ độ khung đứng thẳng): co giãn khối biểu cảm quanh tâm của nó
  const VERT_HEAD = 'attribute float aPart; attribute vec3 aCtr; varying float vPart; varying vec3 vRest;\n' +
    'uniform float uEye, uBy, uTilt, uMouth, uCheek, uClosed;\n';
  const VERT_BODY =
    'vPart = aPart; vRest = position;\n' +
    'if (aPart > 9.5) { vec3 d = transformed - aCtr;\n' +
    ' if (aPart < 10.5) d.y *= uEye;\n' + // mắt
    ' else if (aPart < 11.5) d *= 1.0 - uClosed;\n' + // đốm sáng
    ' else if (aPart < 13.5) { float a = (aPart < 12.5 ? 1.0 : -1.0) * uTilt * 0.5; d.xy = mat2(cos(a), sin(a), -sin(a), cos(a)) * d.xy; d.y += uBy * 1.6; }\n' + // mày
    ' else if (aPart < 17.5) d *= step(abs(aPart - 14.0 - uMouth), 0.5);\n' + // miệng: chỉ kiểu đang dùng
    ' else d *= uCheek;\n' + // má
    ' transformed = aCtr + d; }\n';
  // viền nét: khối biểu cảm co về tâm (không có viền)
  const INK_HEAD = 'attribute float aPart; attribute vec3 aCtr;\n';
  const INK_BODY = 'if (aPart > 9.5) transformed = aCtr;\n';
  // đoạn shader điểm ảnh: da ấm như ánh sáng xuyên qua da; tóc có sợi
  const FRAG_HEAD = 'varying float vPart; varying vec3 vRest;\n';
  const FRAG_COLOR =
    'if (vPart > 1.5 && vPart < 2.5) diffuseColor.rgb *= 0.92 + 0.08 * sin((vRest.x * 1.7 + vRest.z) * 140.0 + sin(vRest.y * 40.0) * 2.0);\n';
  const FRAG_EMIT =
    'if (vPart > 0.5 && vPart < 1.5) totalEmissiveRadiance += diffuseColor.rgb * vec3(0.1, 0.035, 0.02);\n' +
    'if (vPart > 2.5 && vPart < 3.5) totalEmissiveRadiance *= 0.5;\n'; // (giày không có viền sáng ấm)
  function uniforms() {
    return { uEye: { value: 1 }, uBy: { value: 0 }, uTilt: { value: 0 }, uMouth: { value: 0 }, uCheek: { value: 0 }, uClosed: { value: 0 } };
  }
  // biểu cảm hiện tại của người f (render/village3d.js: f.expr { eye, tilt, by, mouth, cheek }, f.closed; f.soft.traits)
  function update(U, f) {
    const E = f.expr || { eye: 1, tilt: 0, by: 0, mouth: 'line' },
      T = f.soft && f.soft.traits;
    U.uClosed.value = f.closed ? 1 : 0;
    U.uEye.value = f.closed ? 0.12 : Math.min(1.35, E.eye);
    U.uBy.value = (E.by || 0) + (f.closed ? -0.006 : 0);
    U.uTilt.value = E.tilt || 0;
    U.uMouth.value = MOUTH[E.mouth] != null ? MOUTH[E.mouth] : 0;
    U.uCheek.value = E.cheek || (T && T.blush) ? 1 : 0;
  }
  // ctx: { THREE, add(geo, node, local, màu, mã), L(x, y, z, sx, sy, sz, rx), sph(r, w, h), capsule(r, y0, y1), HY, T (nét), col }
  function build(ctx) {
    const { THREE, add, L, sph, capsule, HY, T, col } = ctx;
    const C = (h) => new THREE.Color(h),
      dark = C('#1d1a24'),
      white = C('#ffffff'),
      pink = C('#f2a0a0'),
      lip = dark.clone().lerp(pink, 0.35),
      skinD = col.skin.clone().multiplyScalar(0.9),
      brow = col.hair.clone().multiplyScalar(T.age === 'old' ? 0.95 : 0.7),
      hair = col.hair;
    const P = PART;
    // mắt (to hơn ở trẻ nhỏ), đốm sáng, lông mày, má hồng
    const eyeY = HY - 0.012 + (T.eye - 1) * 0.01;
    for (const sx of [-1, 1]) {
      add(sph(0.036 * T.eye, 12, 10), 'head', L(sx * T.gap, eyeY, 0.215, 0.85, 1.25, 0.6), dark, P.EYE);
      add(sph(0.012 * T.eye, 8, 6), 'head', L(sx * (T.gap - 0.01), eyeY + 0.022 * T.eye, 0.243), white, P.SHINE);
      if (T.brow > 0)
        add(sph(0.03, 10, 6), 'head', L(sx * (T.gap + 0.006), eyeY + 0.06 + (T.eye - 1) * 0.02, 0.229, 1.45, 0.3 * T.brow, 0.45), brow, sx < 0 ? P.BROW_L : P.BROW_R);
      add(sph(0.034, 10, 8), 'head', L(sx * 0.15, HY - 0.075, 0.195, 1.2, 0.7, 0.45), pink, P.CHEEK);
      // tai
      add(sph(0.05 * T.ear, 10, 8), 'head', L(sx * 0.243, HY - 0.02, -0.005, 0.45, 0.85, 0.65), col.skin, P.SKIN);
      // tàn nhang: ba chấm mỗi bên má
      if (T.freckle)
        for (let k = 0; k < 3; k++) add(sph(0.0065, 6, 4), 'head', L(sx * (0.1 + k * 0.022), HY - 0.045 - (k % 2) * 0.014, 0.222 - k * 0.006), skinD.clone().multiplyScalar(0.82), P.SKIN);
    }
    // mũi
    add(sph(0.026 * T.nose, 10, 8), 'head', L(0, HY - 0.05, 0.243, 1, 0.85, 0.8), skinD, P.SKIN);
    // bốn kiểu miệng (chỉ một kiểu hiện, theo biểu cảm)
    const mz = T.beard ? 0.229 : 0.224,
      mw = 0.03 * T.mouth,
      arc = () => new THREE.TorusGeometry(mw, 0.0075, 6, 14, Math.PI);
    add(sph(0.03 * T.mouth, 10, 6), 'head', L(0, HY - 0.105, mz, 1.1, 0.32, 0.5), lip, P.M_LINE);
    add(arc().rotateZ(Math.PI), 'head', L(0, HY - 0.095, mz, 1, 0.9, 0.6), lip, P.M_SMILE);
    add(arc(), 'head', L(0, HY - 0.125, mz, 1, 0.8, 0.6), lip, P.M_FROWN);
    add(sph(0.026, 10, 8), 'head', L(0, HY - 0.11, mz - 0.004, 1, 1.25, 0.5), C('#5a2a2e'), P.M_OPEN);
    // tóc theo kiểu
    const cap = (a) => add(new THREE.SphereGeometry(0.262, 28, 14, 0, Math.PI * 2, 0, Math.PI * (a || 0.52)), 'head', L(0, HY + 0.005, -0.012, 1, 1, 1, -0.32), hair, P.HAIR);
    switch (T.hair) {
      case 'bald': {
        // hói: còn vành tóc phía sau và hai bên
        const g = new THREE.TorusGeometry(0.228, 0.05, 8, 22, Math.PI * 1.2).rotateX(Math.PI / 2).rotateY(Math.PI * 1.1);
        add(g, 'head', L(0, HY - 0.025, -0.005, 1, 1.2, 1), hair, P.HAIR);
        break;
      }
      case 'tuft':
        cap(0.3);
        add(sph(0.05), 'head', L(0.02, HY + 0.255, 0.06, 1, 0.8, 1), hair, P.HAIR);
        break;
      case 'bangs':
        cap();
        add(sph(0.16), 'head', L(0, HY + 0.13, 0.15, 1.35, 0.42, 0.62), hair, P.HAIR);
        break;
      case 'spiky':
        cap();
        for (let k = 0; k < 6; k++) {
          const a = (k / 6) * Math.PI * 2,
            g = new THREE.ConeGeometry(0.05, 0.14, 6).translate(0, 0.07, 0).rotateX(0.55).rotateY(a);
          add(g, 'head', L(Math.sin(a) * 0.09, HY + 0.2, Math.cos(a) * 0.09 - 0.03), hair, P.HAIR);
        }
        break;
      case 'bun':
        cap();
        add(sph(0.095), 'head', L(0, HY + 0.2, -0.13), hair, P.HAIR);
        break;
      case 'pony':
        cap();
        add(sph(0.075), 'head', L(0, HY + 0.07, -0.25), hair, P.HAIR);
        add(capsule(0.058, -0.3, 0), 'head', L(0, HY + 0.04, -0.28, 1, 1, 1, 0.22), hair, P.HAIR);
        break;
      case 'long':
        cap();
        add(sph(0.2), 'head', L(0, HY - 0.16, -0.11, 1.05, 1.4, 0.62), hair, P.HAIR);
        break;
      default:
        cap();
    }
    // râu: cằm và ria
    if (T.beard) {
      add(sph(0.14), 'head', L(0, HY - 0.165, 0.12, 1.2, 0.85, 0.75), hair, P.HAIR);
      add(sph(0.05), 'head', L(0, HY - 0.08, 0.229, 1.5, 0.4, 0.5), hair, P.HAIR);
    }
  }
  BK.Face3D = { build, update, uniforms, PART, MOUTH, VERT_HEAD, VERT_BODY, INK_HEAD, INK_BODY, FRAG_HEAD, FRAG_COLOR, FRAG_EMIT };
})(typeof self !== 'undefined' ? self : globalThis);
