(function (root) {
  'use strict';
  const BK = root.BK || (root.BK = {});
  /* Bể Kính · render/map/mountains3d.js
   * Núi của bản đồ. mountainOn: một ngọn núi gộp vào Kit, năm dáng (spire nhọn, ridge sống ba đỉnh, twin đôi, mesa đầu bằng,
   * crag đá lởm chởm), dùng cho dãy núi Đá Mây. MASSIF và massif(): khối núi lưới nhiều mặt riêng từng đảo, tô màu theo
   * độ cao (chân xanh, sườn đá, đỉnh tuyết...), như núi low-poly. Cần: render/map/shared3d.js. */
  function create(X) {
    const { THREE, TAU, C, clamp, hash, LAND_R, RING, SC, UBOX, UCYL, UCONE, TCYL, DOME, ICO, DOD, OCT, GABLE, TORUS, VAULT, SPHG, Kit, mergeG, bodyMat, metalMat, meshOf, disposeGroup, pick, TSTYLE, landRng } = X;
    // một ngọn núi với dáng ngẫu nhiên trong năm kiểu, để các dãy núi không giống nhau:
    // spire đỉnh nhọn, ridge sống núi dài ba đỉnh, twin núi đôi, mesa núi đầu bằng hai bậc, crag núi đá lởm chởm
    const MOUNTAIN_STYLES = ['spire', 'ridge', 'twin', 'mesa', 'crag']; // núi tròn thoải (dome) đã bỏ: trông như ụ đất
    function mountainOn(k, x, z, rad, h, cols, cap, rng, style) {
      const st = style || MOUNTAIN_STYLES[Math.floor(rng() * MOUNTAIN_STYLES.length)], c = () => pick(cols, rng()), ry = rng() * TAU;
      const peak = (px, pz, r, hh, seg) => { k.cone(c(), px, 0, pz, r, hh, seg || 7, rng() * 3); if (cap) k.cone(cap, px, hh * 0.62, pz, r * 0.38, hh * 0.38 + 0.05, seg || 7, rng() * 3); };
      if (st === 'spire') peak(x, z, rad * 0.85, h * 1.1);
      else if (st === 'ridge') { for (let i = -1; i <= 1; i++) { const d = i * rad * 0.9; peak(x + Math.cos(ry) * d, z + Math.sin(ry) * d, rad * (i ? 0.7 : 0.9), h * (i ? 0.6 + rng() * 0.15 : 0.95), 6); } }
      else if (st === 'twin') { const d = rad * 0.55; peak(x + Math.cos(ry) * d, z + Math.sin(ry) * d, rad * 0.75, h); peak(x - Math.cos(ry) * d, z - Math.sin(ry) * d, rad * 0.65, h * 0.7); }
      else if (st === 'mesa') { k.tcyl(c(), x, 0, z, rad * 1.1, rad * 0.85, h * 0.32, 8); k.tcyl(c(), x, h * 0.32, z, rad * 0.75, rad * 0.55, h * 0.26, 8); k.cyl(cap || '#8fa274', x, h * 0.58, z, rad * 0.56, 0.12, 8); }
      else { // núi đá lởm chởm: chân rộng nhiều tảng, lên cao nhỏ dần, nghiêng lệch
        for (let i = 0; i < 4; i++) { const a = (i / 4) * TAU + ry; k.blob(DOD(), c(), x + Math.cos(a) * rad * 0.7, rad * 0.35, z + Math.sin(a) * rad * 0.7, rad * 0.55, 0.8); }
        let y = rad * 0.5; for (let i = 0; i < 3; i++) { const r2 = rad * (0.75 - i * 0.2); k.blob(DOD(), c(), x + Math.cos(ry) * i * rad * 0.18, y + r2 * 0.5, z + Math.sin(ry) * i * rad * 0.18, r2, 0.85); y += r2 * 0.8; }
        if (cap) k.blob(ICO(), cap, x + Math.cos(ry) * rad * 0.4, y, z + Math.sin(ry) * rad * 0.4, rad * 0.22, 0.5); }
      return st;
    }
    /* =============== Khối núi nhiều mặt: mỗi đảo một dáng riêng =============== */
    // Một tấm lưới nâng lên theo vài đỉnh, mỗi mặt tô một màu theo độ cao (chân xanh, sườn đá, đỉnh tuyết...), như núi
    // low-poly. kind: range dãy nhiều đỉnh nhọn, rounded núi tròn phủ rừng, jagged núi băng lởm chởm, cliff mũi đá đầu bằng
    // sát biển, terrace núi bậc thang nhiều lớp đá. bands: [độ cao tương đối, màu] từ chân lên đỉnh.
    const MASSIF = {
      // Lúa Vàng: dãy núi hồng tím, chân cỏ xanh, đỉnh tuyết (theo ảnh mẫu)
      plains: [{ kind: 'range', W: 36, D: 19, H: 21, peaks: [[-0.32, 0.05, 0.72, 0.18], [0.06, -0.05, 1, 0.17], [0.38, 0.1, 0.8, 0.16], [-0.05, 0.3, 0.42, 0.2]], pines: 14,
        bands: [[0.1, '#8cc05a'], [0.2, '#b4d070'], [0.32, '#e2d488'], [0.46, '#ec8ab8'], [0.6, '#d478b4'], [0.72, '#bc68ac'], [1.01, '#fbf4f8']] }],
      // Thông Xanh: núi đôi phủ rừng, đỉnh đá xám, không tuyết
      forest: [{ kind: 'range', W: 30, D: 18, H: 17, peaks: [[-0.2, 0, 1, 0.2], [0.24, 0.06, 0.82, 0.19]], pines: 22, bands: [[0.3, '#4f9a48'], [0.55, '#5aa850'], [0.78, '#6f9a58'], [1.01, '#a09a88']] }],
      // Tuyết Trắng: núi băng lởm chởm, sườn xanh băng, đỉnh trắng
      tundra: [{ kind: 'jagged', W: 32, D: 18, H: 24, peaks: [[-0.34, 0, 0.7, 0.12], [-0.08, 0.06, 1, 0.11], [0.18, -0.04, 0.85, 0.1], [0.4, 0.08, 0.62, 0.11]], pines: 0,
        bands: [[0.2, '#f2f8fb'], [0.38, '#d4e8f2'], [0.54, '#a8c8dc'], [0.68, '#8eaec6'], [1.01, '#ffffff']] }],
      // Cửa Sóng: mũi đá đầu bằng, vách cát kết, đỉnh cỏ
      coast: [{ kind: 'cliff', W: 22, D: 13, H: 11, peaks: [[0, 0, 1, 0.3]], pines: 8, bands: [[0.18, '#f0dca8'], [0.5, '#dca46a'], [0.85, '#c48a56'], [1.01, '#8cc068']] }],
      // Cát Hồng: núi bậc thang nhiều lớp đá đỏ và kem
      desert: [{ kind: 'terrace', W: 32, D: 15, H: 15, peaks: [[-0.2, 0, 1, 0.22], [0.25, 0.05, 0.8, 0.2]], pines: 0,
        bands: [[0.2, '#f0d09a'], [0.36, '#e8aa72'], [0.52, '#d4844c'], [0.68, '#f0c08a'], [0.84, '#c4703e'], [1.01, '#e89a62']] }],
    };
    const massifMat = new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.9, emissive: '#202020', emissiveIntensity: 0.25 }); // hơi tự sáng: mặt khuất nắng không tối đen
    function massif(L, k, M, rng, free, prop) {
      // chỗ đặt: phía ngoài đảo, lùi vào trong mép; mũi đá ven biển thì sát mép
      let cx = 0, cz = 0, ang = 0, ok = false;
      for (let t = 0; t < 30 && !ok; t++) {
        ang = L.oa + (rng() - 0.5) * 2.8; const rr = L.rOf(ang) - M.D * (M.edge ? 0.32 : 0.62) - 2;
        cx = Math.cos(ang) * rr; cz = Math.sin(ang) * rr;
        const tx = -Math.sin(ang), tz = Math.cos(ang);
        ok = [-0.45, -0.2, 0, 0.2, 0.45].every((u) => free(cx + tx * u * M.W, cz + tz * u * M.W, M.D * 0.4));
      }
      if (!ok) return false;
      const NU = 26, NV = 14, tx = -Math.sin(ang), tz = Math.cos(ang), rx = Math.cos(ang), rz = Math.sin(ang);
      const jit = Array.from({ length: (NU + 1) * (NV + 1) }, () => rng() - 0.5);
      const H = (i, j) => {
        const u = i / NU - 0.5, v = j / NV - 0.5, edgeF = Math.min(1, Math.min(0.5 - Math.abs(u), 0.5 - Math.abs(v)) * 5.5);
        let h = 0;
        for (const [pu, pv, ph, sg] of M.peaks) { const d2 = ((u - pu) ** 2 + ((v - pv) * 1.6) ** 2) / (2 * sg * sg); let e = Math.exp(-d2); if (M.kind === 'jagged' || M.kind === 'range') e = Math.pow(e, 0.8) * (1 - 0.15 * Math.sqrt(d2)); h = Math.max(h, ph * Math.max(0, e)); }
        if (M.kind === 'cliff') h = Math.min(1, h * 2.2);
        if (M.kind === 'terrace') h = Math.round(h * 6) / 6;
        h = h * Math.max(0, edgeF) + jit[j * (NU + 1) + i] * (M.kind === 'rounded' ? 0.03 : 0.07);
        return Math.max(-0.03, h) * M.H;
      };
      const P = (i, j) => { const u = (i / NU - 0.5) * M.W, v = (j / NV - 0.5) * M.D; return [cx + tx * u + rx * v, H(i, j), cz + tz * u + rz * v]; };
      const pos = [], col = [], c = new THREE.Color();
      const band = (t) => { for (const [lim, hex] of M.bands) if (t < lim) return hex; return M.bands[M.bands.length - 1][1]; };
      const tri = (a, b, d) => { const t = (a[1] + b[1] + d[1]) / 3 / M.H; c.set(band(t + (rng() - 0.5) * 0.06)); const f = 0.9 + rng() * 0.12; for (const q of [a, b, d]) { pos.push(q[0], q[1] - 0.25, q[2]); col.push(c.r * f, c.g * f, c.b * f); } };
      for (let j = 0; j < NV; j++) for (let i = 0; i < NU; i++) { const a = P(i, j), b = P(i + 1, j), d = P(i, j + 1), e = P(i + 1, j + 1); if ((i + j) % 2) { tri(a, d, b); tri(b, d, e); } else { tri(a, d, e); tri(a, e, b); } }
      // chiều quấn của tam giác phụ thuộc hướng đặt núi: lật lại nếu mặt đang quay xuống (để thấy mặt ngoài, không thấy lòng núi)
      { const ax = pos[3] - pos[0], ay = pos[4] - pos[1], az = pos[5] - pos[2], bx = pos[6] - pos[0], by = pos[7] - pos[1], bz = pos[8] - pos[2];
        if (az * bx - ax * bz < 0) for (let q = 0; q < pos.length; q += 9) for (let w = 0; w < 3; w++) { const t1 = pos[q + 3 + w]; pos[q + 3 + w] = pos[q + 6 + w]; pos[q + 6 + w] = t1; const t2 = col[q + 3 + w]; col[q + 3 + w] = col[q + 6 + w]; col[q + 6 + w] = t2; } }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.computeVertexNormals();
      const m = new THREE.Mesh(g, massifMat); m.castShadow = true; m.receiveShadow = false; L.g.add(m); // không nhận bóng của chính nó: sườn núi không tối đen
      // thông mọc ở chân núi
      for (let q = 0, placed = 0; q < (M.pines || 0) * 6 && placed < (M.pines || 0); q++) { const i = 1 + Math.floor(rng() * (NU - 1)), j = 1 + Math.floor(rng() * (NV - 1)), p0 = P(i, j), t = p0[1] / M.H; if (t < 0.06 || t > 0.32) continue; const s2 = 0.7 + rng() * 0.5; k.cone(pick(['#3f7a4c', '#4a8a55', '#356b43'], rng()), p0[0], p0[1] + 0.4 * s2, p0[2], 0.9 * s2, 2.4 * s2, 7); k.cyl('#6b4b32', p0[0], p0[1] - 0.2, p0[2], 0.12 * s2, 0.7 * s2, 5); placed++; }
      for (const u of [-0.42, -0.21, 0, 0.21, 0.42]) prop(cx + tx * u * M.W, cz + tz * u * M.W, M.D * 0.5);
      (L.massifs || (L.massifs = [])).push({ x: cx, z: cz, ang, W: M.W, D: M.D, H: M.H });
      return true;
    }
    return { MOUNTAIN_STYLES, mountainOn, MASSIF, massif };
  }
  BK.MapMountains = { create };
})(typeof self !== 'undefined' ? self : globalThis);
