/* Bể Kính · render/magic/sigils.js · Hình vòng phù chú của từng hệ phép (design/ke-hoach-buoc-37.md mục 9)
 * Vẽ bằng canvas lúc cần (mỗi hệ một ảnh, dùng lại): vòng ngoài đôi có vạch chia, vòng trong, ba vòng nhỏ quanh vòng (mỗi vòng
 * một dấu nhỏ), hình của hệ ở giữa:
 *   soul  sao tám cánh    time  đồng hồ cát      fire  tam giác lên có ngọn lửa
 *   earth hình thoi lồng hình vuông              water tam giác xuống có hai gợn sóng
 * Nét trắng sáng ở lõi, quầng màu của hệ (render/style/palette.js) ở ngoài. Hình tự thiết kế cho Bể Kính.
 * BK.Sigils.texture(THREE, hệ) trả CanvasTexture. Cần: three.js, render/style/palette.js. */
(function (root) {
  const BK = root.BK || (root.BK = {});
  const SIZE = 256;
  const cache = {};
  // hình giữa của từng hệ (c: context, r: bán kính vùng giữa)
  const CENTER = {
    soul(c, r) {
      c.beginPath();
      for (let k = 0; k < 16; k++) {
        const a = (k / 16) * Math.PI * 2 - Math.PI / 2,
          rr = k % 2 ? r * 0.38 : r;
        c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
      }
      c.closePath();
      c.stroke();
      c.beginPath();
      c.arc(0, 0, r * 0.18, 0, Math.PI * 2);
      c.stroke();
    },
    time(c, r) {
      c.beginPath();
      c.moveTo(-r * 0.6, -r);
      c.lineTo(r * 0.6, -r);
      c.lineTo(-r * 0.6, r);
      c.lineTo(r * 0.6, r);
      c.closePath();
      c.stroke();
      c.beginPath();
      c.moveTo(-r * 0.25, r * 0.7);
      c.lineTo(r * 0.25, r * 0.7);
      c.stroke();
    },
    fire(c, r) {
      c.beginPath();
      c.moveTo(0, -r);
      c.lineTo(r * 0.9, r * 0.6);
      c.lineTo(-r * 0.9, r * 0.6);
      c.closePath();
      c.stroke();
      c.beginPath();
      c.moveTo(0, -r * 0.25);
      c.bezierCurveTo(r * 0.35, r * 0.05, r * 0.25, r * 0.4, 0, r * 0.42);
      c.bezierCurveTo(-r * 0.25, r * 0.4, -r * 0.3, r * 0.1, 0, -r * 0.25);
      c.stroke();
    },
    earth(c, r) {
      c.beginPath();
      c.moveTo(0, -r);
      c.lineTo(r, 0);
      c.lineTo(0, r);
      c.lineTo(-r, 0);
      c.closePath();
      c.stroke();
      c.strokeRect(-r * 0.4, -r * 0.4, r * 0.8, r * 0.8);
    },
    water(c, r) {
      c.beginPath();
      c.moveTo(-r * 0.9, -r * 0.6);
      c.lineTo(r * 0.9, -r * 0.6);
      c.lineTo(0, r);
      c.closePath();
      c.stroke();
      for (const y of [-0.18, 0.12]) {
        c.beginPath();
        for (let k = 0; k <= 12; k++) {
          const x = -0.42 + (k / 12) * 0.84;
          c.lineTo(x * r, (y + Math.sin(k * 1.05) * 0.06) * r);
        }
        c.stroke();
      }
    },
  };
  // dấu nhỏ trong ba vòng phụ
  const MARKS = [
    (c, r) => {
      c.beginPath();
      c.arc(0, 0, r * 0.3, 0, Math.PI * 2);
      c.fill();
    },
    (c, r) => {
      c.beginPath();
      c.arc(0, r * 0.15, r * 0.45, Math.PI * 1.1, Math.PI * 1.9);
      c.stroke();
    },
    (c, r) => {
      c.beginPath();
      c.moveTo(-r * 0.4, 0);
      c.lineTo(r * 0.4, 0);
      c.moveTo(0, -r * 0.4);
      c.lineTo(0, r * 0.4);
      c.stroke();
    },
  ];
  function draw(school) {
    const PAL = BK.Palette,
      cv = document.createElement('canvas');
    cv.width = cv.height = SIZE;
    const c = cv.getContext('2d'),
      R = SIZE * 0.44;
    c.translate(SIZE / 2, SIZE / 2);
    c.lineCap = c.lineJoin = 'round';
    // hai lượt: quầng màu (nét dày, mờ), rồi lõi trắng sáng (nét mảnh)
    for (const pass of [0, 1]) {
      c.strokeStyle = c.fillStyle = pass ? '#ffffff' : PAL.c(school + '.mid');
      c.shadowColor = PAL.c(school + '.mid');
      c.shadowBlur = pass ? 6 : 14;
      c.globalAlpha = pass ? 0.95 : 0.55;
      c.lineWidth = pass ? 2.2 : 6;
      // vòng ngoài đôi, vạch chia
      c.beginPath();
      c.arc(0, 0, R, 0, Math.PI * 2);
      c.stroke();
      c.beginPath();
      c.arc(0, 0, R * 0.88, 0, Math.PI * 2);
      c.stroke();
      for (let k = 0; k < 36; k++) {
        if (k % 12 === 0) continue; // (chỗ của vòng nhỏ)
        const a = (k / 36) * Math.PI * 2,
          r0 = R * 0.9,
          r1 = R * (k % 3 ? 0.95 : 0.98);
        c.beginPath();
        c.moveTo(Math.cos(a) * r0, Math.sin(a) * r0);
        c.lineTo(Math.cos(a) * r1, Math.sin(a) * r1);
        c.stroke();
      }
      // vòng trong
      c.beginPath();
      c.arc(0, 0, R * 0.62, 0, Math.PI * 2);
      c.stroke();
      // ba vòng nhỏ trên vòng ngoài, mỗi vòng một dấu
      for (let k = 0; k < 3; k++) {
        const a = -Math.PI / 2 + (k / 3) * Math.PI * 2,
          x = Math.cos(a) * R * 0.94,
          y = Math.sin(a) * R * 0.94,
          rs = R * 0.16;
        c.save();
        c.translate(x, y);
        c.beginPath();
        c.arc(0, 0, rs, 0, Math.PI * 2);
        c.stroke();
        MARKS[k](c, rs);
        c.restore();
      }
      // hình của hệ
      (CENTER[school] || CENTER.soul)(c, R * 0.42);
    }
    return cv;
  }
  function texture(THREE, school) {
    if (cache[school]) return cache[school];
    const t = new THREE.CanvasTexture(draw(school));
    t.encoding = THREE.sRGBEncoding;
    return (cache[school] = t);
  }
  BK.Sigils = { texture, draw, SIZE };
})(typeof self !== 'undefined' ? self : globalThis);
