/* Bể Kính · render/blocks/isles/props.js · Đồ trang trí dùng chung cho các đảo (cây, đá, tuyết, chum, thuyền…)
 * Các tệp đảo (render/blocks/isles/<đảo>.js) đặt những thứ này vào chỗ trống của từng khối (blocks.js KINDS[i].spots).
 * Mỗi hàm vẽ vào bộ gom k ở (x, y, z), s là tỉ lệ (nhà dân dùng nhỏ hơn). Cần: three.js, render/build/kit3d.js, blocks.js. */
(function (root) {
  const BK = root.BK;
  const K = () => BK.BuildKit;
  const SNOW = '#f2f6fa';
  const props = {
    // thông: thân, ba tầng tán nón; có tuyết thì chỏm trắng
    pine(k, x, y, z, s, snow, leaf) {
      const B = K();
      k.add(B.post(0.12 * s, 0.7 * s, 5), '#5a3c22', x, y, z);
      for (let i = 0; i < 3; i++) {
        const r = (1.0 - i * 0.25) * s,
          yy = y + (0.5 + i * 0.75) * s;
        k.add(B.cone(r, 1.1 * s, 7), leaf || '#3e6a3a', x, yy, z);
        if (snow) k.add(B.cone(r * 0.55, 0.5 * s, 7), SNOW, x, yy + 0.6 * s, z);
      }
    },
    // dừa: thân cong ba đoạn, sáu tàu lá, chùm quả
    palm(k, x, y, z, s) {
      const B = K();
      let px = x,
        py = y;
      for (let i = 0; i < 3; i++) {
        k.add(B.post(0.12 * s, 1.0 * s, 6), '#8a6a44', px, py, z, { rot: [0, 0, -0.12 * (i + 1)] });
        px += Math.sin(0.12 * (i + 1)) * s;
        py += Math.cos(0.12 * (i + 1)) * s;
      }
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        k.add(B.box(1.4 * s, 0.05, 0.32 * s, 0.01), '#4f8a3a', px + Math.cos(a) * 0.6 * s, py - 0.15 * s, z + Math.sin(a) * 0.6 * s, { rot: [0, -a, -0.35] });
      }
      k.add(B.ball(0.12 * s, 0), '#6a4a2a', px, py - 0.12 * s, z);
    },
    rock(k, x, y, z, s, c) {
      k.add(K().ball(0.5 * s, 0), c || '#8a857c', x, y + 0.2 * s, z, { sc: [1.2, 0.8, 1] });
      k.add(K().ball(0.3 * s, 0), c || '#8a857c', x + 0.5 * s, y + 0.1 * s, z + 0.2 * s);
    },
    snowpile(k, x, y, z, s) {
      k.add(K().ball(0.5 * s, 1), SNOW, x, y, z, { sc: [1.4, 0.6, 1.1] });
      k.add(K().ball(0.3 * s, 1), SNOW, x + 0.45 * s, y, z + 0.3 * s, { sc: [1.2, 0.6, 1] });
    },
    // đống củi: khúc gỗ nằm chồng
    logs(k, x, y, z, s) {
      const g = new root.THREE.CylinderGeometry(0.1 * s, 0.1 * s, 0.9 * s, 6);
      for (let r = 0; r < 3; r++) for (let i = 0; i < 3 - r; i++) k.add(g, '#7a5432', x + (i - (2 - r) / 2) * 0.2 * s, y + 0.1 * s + r * 0.18 * s, z, { rot: [Math.PI / 2, 0, 0] });
    },
    pot(k, x, y, z, s, c) {
      k.add(K().lathe([[0.15 * s, 0], [0.3 * s, 0.25 * s], [0.18 * s, 0.5 * s], [0.14 * s, 0.56 * s]], 8), c || '#b8603a', x, y, z);
    },
    cactus(k, x, y, z, s) {
      const B = K();
      k.add(B.post(0.16 * s, 1.4 * s, 7), '#4a8a4a', x, y, z);
      for (const e of [-1, 1]) {
        k.add(B.box(0.4 * s, 0.14 * s, 0.14 * s, 0.02), '#4a8a4a', x + e * 0.25 * s, y + (0.6 + e * 0.15) * s, z);
        k.add(B.post(0.1 * s, 0.45 * s, 6), '#4a8a4a', x + e * 0.42 * s, y + (0.6 + e * 0.15) * s, z);
      }
    },
    // thuyền nhỏ úp trên cát
    boat(k, x, y, z, s, c) {
      k.add(K().ball(0.6 * s, 1), c || '#a8452c', x, y + 0.12 * s, z, { sc: [0.55, 0.35, 1.6] });
      k.add(K().box(0.05, 0.05, 1.6 * s, 0.01), '#e8e2d6', x, y + 0.32 * s, z);
    },
    mushroom(k, x, y, z, s) {
      k.add(K().post(0.06 * s, 0.3 * s, 5), '#f0e6d4', x, y, z);
      k.add(K().lathe([[0.25 * s, 0], [0.2 * s, 0.12 * s], [0.01, 0.18 * s]], 8), '#c8402f', x, y + 0.28 * s, z);
    },
    // dây cờ phướn giữa hai cột (dọc trục x)
    prayer(k, x, y, z, len, s) {
      const B = K(),
        C = ['#3a6ac8', '#f0f0ea', '#c8402f', '#3a8a4a', '#e8c040'];
      for (const e of [-1, 1]) k.add(B.post(0.04, 1.8 * s, 4), '#5a3c22', x + (e * len) / 2, y, z);
      for (let i = 0; i < 7; i++) {
        const u = (i + 0.5) / 7,
          sag = Math.sin(u * Math.PI) * 0.25 * s;
        k.add(B.box(0.2 * s, 0.26 * s, 0.02, 0.01), C[i % 5], x - len / 2 + u * len, y + 1.6 * s - sag - 0.15 * s, z);
      }
    },
  };
  BK.Blocks.props = props;
})(typeof self !== 'undefined' ? self : globalThis);
