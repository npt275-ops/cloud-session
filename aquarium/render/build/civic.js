/* Bể Kính · render/build/civic.js · Công trình công cộng của sáu đảo
 * Trường học, thư viện, bảo tàng, bệnh viện, nhà hát, sân vận động, nhà tắm, đài thiên văn. Mỗi loại bốn dáng theo giai đoạn
 * (xưa 1-3, cận đại 4-5, hiện đại 6-8, tương lai 9-12), tô bằng bảng màu o.pal của đảo. Mỗi thời một bộ khác thời trước
 * (BY_LV), đặt ở vòng ngoài hai vòng nhà riêng, mỗi đảo xoay chỗ một chút (render/buildings3d.js dịch tránh núi, hồ và công
 * trình khác). BK.Civic3D.addTo(E, cấp, pal, đảo) thêm vào bố cục của một thời. Cần: render/build/kit3d.js, plains/common.js. */
(function (root) {
  const BK = root.BK,
    K = BK.BuildKit,
    { B, Bc } = BK.Plains3D;
  const THREE = () => window.THREE;
  const st = (lv) => (lv <= 3 ? 0 : lv <= 5 ? 1 : lv <= 8 ? 2 : 3);
  const P0 = { a: '#d8c8a8', b: '#9a6a44', c: '#c94f3a', d: '#3e2c20', g: '#ffd27a', w: '#ffe0a0' };
  const torus = (r, t) => new (THREE().TorusGeometry)(r, t, 6, 24);
  const cols = (k, n, w, z, h, r, c) => {
    for (let i = 0; i < n; i++) k.add(K.post(r, h, 8), c, -w / 2 + (w * i) / (n - 1), 0.6, z);
  };
  const winRow = (k, p, w, z, y, n, lit) => {
    for (let i = 0; i < n; i++) {
      const x = -w / 2 + (w * (i + 0.5)) / n;
      k.add(Bc((w / n) * 0.55, 0.7, 0.05, 0.02), p.d, x, y, z, { ao: false });
      if (lit !== false && i % 3 !== 1) k.add(Bc((w / n) * 0.45, 0.6, 0.03, 0.01), p.w, x, y, z + 0.04, { lit: true });
    }
  };

  const CIVIC = {
    school(k, o) {
      const p = o.pal || P0,
        s = st(o.lv);
      if (s === 0) {
        k.add(B(6, 0.4, 4, 0.06), p.b, 0, 0, 0);
        for (const [x, z] of [
          [-2.6, -1.6],
          [2.6, -1.6],
          [-2.6, 1.6],
          [2.6, 1.6],
        ])
          k.add(K.post(0.14, 2.6, 5), p.d, x, 0.4, z);
        k.add(K.roof(6.8, 1.4, 4.8, 0.1, 6.6, 0.3), p.b, 0, 3, 0);
        for (let i = 0; i < 3; i++) k.add(B(4, 0.4, 0.4, 0.05), p.a, 0, 0.4, -1 + i * 1);
        k.add(B(2.4, 1.4, 0.1, 0.03), '#3a4a3a', 0, 1, -1.9);
        return;
      }
      if (s === 1) {
        k.add(B(8, 4, 4, 0.08), p.a, 0, 0, 0);
        winRow(k, p, 7, 2.02, 2, 5);
        k.add(K.roof(8.6, 1.4, 4.6, 0.1, 8.4, 0.3), p.b, 0, 4, 0);
        k.add(B(1.6, 2.2, 1.6, 0.06), p.a, 0, 5, 0);
        k.add(K.cone(1.2, 1.6, 4), p.c, 0, 7.2, 0, { rot: [0, Math.PI / 4, 0] });
        const b = k.sub('bell', [0, 6.6, 0]);
        b.add(
          K.lathe(
            [
              [0.001, 0],
              [0.3, -0.1],
              [0.45, -0.7],
              [0.001, -0.7],
            ],
            8,
          ),
          '#d4a63a',
          0,
          0,
          0,
        );
        return { sway: [['bell', 'x', 0.3, 1.5]] };
      }
      if (s === 2) {
        k.add(B(9, 3.4, 3.4, 0.1), p.a, 0, 0, -1);
        k.add(B(3.4, 6, 3.4, 0.1), p.c, 3.4, 0, -1);
        for (let f = 0; f < 2; f++) winRow(k, p, 8, 0.72, 1 + f * 1.6, 6);
        k.add(B(8, 0.06, 4, 0.02), '#5a9646', -0.5, 0, 3, { ao: false });
        for (const x of [-4, 3]) {
          k.add(K.post(0.06, 2, 4), '#f2f2ee', x, 0, 3);
          k.add(Bc(0.06, 0.06, 1.4, 0.02), '#f2f2ee', x, 2, 3);
        }
        return;
      }
      k.add(K.post(4, 0.5, 14), p.b, 0, 0, 0);
      k.add(K.ball(3.6, 2), p.a, 0, 2, 0, { sc: [1, 0.7, 1] });
      k.add(K.post(3.65, 0.4, 14), p.w, 0, 2, 0, { lit: true });
      const r = k.sub('ring', [0, 5.2, 0]);
      r.add(torus(2.6, 0.15), p.g, 0, 0, 0, { glow: true, rot: [Math.PI / 2, 0, 0] });
      return { spin: [['ring', 'y', 0.6]], pulse: true };
    },
    library(k, o) {
      const p = o.pal || P0,
        s = st(o.lv);
      if (s === 0) {
        k.add(B(4.4, 2.6, 3, 0.08), p.a, 0, 0, 0);
        k.add(K.roof(5, 1.4, 3.6, 0.1, 4.8, 0.3, 0.4), p.b, 0, 2.6, 0);
        for (let i = 0; i < 4; i++)
          for (let j = 0; j < 3; j++)
            k.add(K.post(0.12, 0.6, 6).rotateZ(Math.PI / 2), ['#e8d8b0', '#c8a870'][(i + j) % 2], -1.2 + i * 0.8, 0.5 + j * 0.5, 1.6);
        return;
      }
      if (s === 1) {
        k.add(B(9, 0.8, 6, 0.08), p.b, 0, 0, 0);
        cols(k, 6, 7, 2.6, 4.2, 0.3, p.a);
        k.add(B(8, 4.2, 4, 0.08), p.a, 0, 0.8, -0.6);
        k.add(
          K.lathe(
            [
              [2.8, 0],
              [2.6, 1.2],
              [1.6, 2.4],
              [0.001, 2.8],
            ],
            14,
          ),
          p.c,
          0,
          5,
          -0.6,
        );
        k.add(B(8.6, 0.6, 5.8, 0.06), p.a, 0, 5, 0);
        winRow(k, p, 6, 1.42, 2.6, 4);
        return;
      }
      if (s === 2) {
        k.add(B(7, 7, 7, 0.12), p.c, 0, 0, 0);
        for (let i = 0; i < 9; i++)
          k.add(Bc(0.5, 6.4, 0.08, 0.02), ['#c94f3a', '#3f7fb8', '#e0b23a', '#3f8a5a', '#8a5aa8'][i % 5], -3 + i * 0.75, 3.4, 3.52);
        winRow(k, p, 6, -3.52 + 7.04, 5.5, 4);
        k.add(B(7.4, 0.4, 7.4, 0.06), p.b, 0, 7, 0);
        return;
      }
      for (let i = 0; i < 14; i++) {
        const a = i * 0.5,
          y = i * 0.9;
        k.add(
          B(2.4, 0.6, 1.4, 0.1),
          ['#c94f3a', '#3f7fb8', '#e0b23a', '#3f8a5a', '#8a5aa8'][i % 5],
          Math.sin(a) * 2.2,
          y,
          Math.cos(a) * 2.2,
          { rot: [0, a, 0.2] },
        );
      }
      k.add(K.post(0.6, 13, 8), p.a, 0, 0, 0);
      k.add(K.ball(1, 1), p.g, 0, 13.6, 0, { glow: true });
      return { pulse: true };
    },
    museum(k, o) {
      const p = o.pal || P0,
        s = st(o.lv);
      if (s === 0) {
        k.add(B(6, 0.4, 5, 0.08), p.b, 0, 0, 0);
        k.add(K.roof(6.6, 2.2, 5.6, 0.1, 0.4, 5.4), p.b, 0, 3.2, 0);
        for (const [x, z] of [
          [-2.8, -2.2],
          [2.8, -2.2],
          [-2.8, 2.2],
          [2.8, 2.2],
        ])
          k.add(K.post(0.2, 2.8, 6), p.d, x, 0.4, z);
        k.add(B(1, 1.8, 0.8, 0.2), p.a, 0, 0.4, 0);
        k.add(K.ball(0.5, 0), p.a, 0, 2.6, 0);
        return;
      }
      if (s === 1) {
        k.add(B(10, 1, 6, 0.08), p.b, 0, 0, 0);
        cols(k, 8, 8.4, 2.7, 4, 0.28, p.a);
        k.add(B(9, 4, 4, 0.08), p.a, 0, 1, -0.8);
        k.add(K.roof(10, 2, 6, 0.1, 0.3, 6), p.a, 0, 5, 0);
        k.add(B(2, 2.6, 0.1, 0.04), p.d, 0, 1, 1.22);
        return;
      }
      if (s === 2) {
        k.add(B(5, 4, 5, 0.1), p.a, -1.4, 0, 0, { rot: [0, 0.3, 0] });
        k.add(B(4, 5, 3.4, 0.1), p.c, 1.8, 0, 0.6, { rot: [0, -0.5, 0.12] });
        k.add(B(3, 3, 6, 0.1), p.b, 0.4, 4.4, -0.4, { rot: [0.2, 0.8, -0.15] });
        k.add(Bc(3, 1.4, 0.05, 0.02), p.w, -1.4, 2, 2.55, { rot: [0, 0.3, 0], lit: true });
        return;
      }
      k.add(K.post(4.4, 0.6, 6), p.b, 0, 0, 0);
      k.add(new (THREE().OctahedronGeometry)(1, 0).scale(4, 4.6, 4).translate(0, 4.6, 0), p.a, 0, 0.6, 0);
      const a = k.sub('relic', [0, 5.4, 0]);
      a.add(new (THREE().IcosahedronGeometry)(1.2, 0), p.g, 0, 0, 0, { glow: true });
      return { spin: [['relic', 'y', 0.7]], bob: [['relic', 0.4, 0.5]], pulse: true };
    },
    hospital(k, o) {
      const p = o.pal || P0,
        s = st(o.lv);
      const cross = (x, y, z, c, lit) => {
        k.add(Bc(1.4, 0.4, 0.06, 0.02), c, x, y, z, lit ? { glow: true } : { ao: false });
        k.add(Bc(0.4, 1.4, 0.06, 0.02), c, x, y, z, lit ? { glow: true } : { ao: false });
      };
      if (s === 0) {
        k.add(
          K.lathe(
            [
              [2.2, 0],
              [2.2, 1.6],
              [1.6, 2.4],
              [0.001, 3],
            ],
            10,
          ),
          p.a,
          0,
          0,
          0,
        );
        for (let i = 0; i < 8; i++)
          k.add(K.ball(0.4, 0), ['#5a9646', '#7fbf5a', '#c8a84a'][i % 3], Math.cos(i * 0.8) * 3.2, 0.3, Math.sin(i * 0.8) * 3.2);
        k.add(B(0.8, 1.4, 0.08, 0.04), p.d, 0, 0, 2.18);
        return { smoke: [[0, 3.2, 0, 0.5]] };
      }
      if (s === 1) {
        k.add(B(9, 5, 4.4, 0.08), '#f2efe6', 0, 0, 0);
        for (let f = 0; f < 2; f++) winRow(k, p, 8, 2.22, 1.4 + f * 2, 6);
        k.add(K.roof(9.6, 1.2, 5, 0.1, 9.4, 0.3), p.b, 0, 5, 0);
        cross(0, 4.2, 2.26, '#c94f3a');
        return;
      }
      if (s === 2) {
        k.add(B(8, 9, 5, 0.1), '#f4f4f0', 0, 0, 0);
        for (let f = 0; f < 5; f++) winRow(k, p, 7.4, 2.52, 1 + f * 1.7, 6);
        cross(0, 7.8, 2.56, '#e04040', true);
        k.add(K.post(2.4, 0.3, 14), '#3a3a3e', 0, 9, 0);
        k.add(Bc(1.6, 0.04, 0.3, 0.01), '#f2f2ee', 0, 9.32, 0, { ao: false });
        k.add(Bc(0.3, 0.04, 1.6, 0.01), '#f2f2ee', 0, 9.32, 0, { ao: false });
        return;
      }
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        k.add(K.ball(1.8, 1), p.a, Math.cos(a) * 3, 1.6, Math.sin(a) * 3, { sc: [1, 0.8, 1] });
      }
      k.add(K.ball(2.6, 1), '#f4f4f0', 0, 3.2, 0);
      cross(0, 4.4, 2.5, '#ff6a6a', true);
      return { pulse: true };
    },
    theater(k, o) {
      const p = o.pal || P0,
        s = st(o.lv);
      if (s === 0) {
        for (let i = 0; i < 4; i++)
          k.add(
            K.lathe(
              [
                [5 - i * 0.9, 0],
                [5 - i * 0.9, 0.5 + i * 0.5],
                [4.4 - i * 0.9, 0.5 + i * 0.5],
              ],
              14,
              0,
              Math.PI,
            ),
            p.a,
            0,
            0,
            -1,
            { sc: [1, 1, 1] },
          );
        k.add(B(4, 0.4, 2.2, 0.06), p.b, 0, 0, 2.4);
        return;
      }
      if (s === 1) {
        k.add(B(9, 5, 6, 0.1), p.a, 0, 0, 0);
        k.add(
          K.lathe(
            [
              [3.6, 0],
              [3.4, 1.6],
              [2.2, 3],
              [0.001, 3.4],
            ],
            14,
          ),
          p.c,
          0,
          5,
          -0.5,
        );
        cols(k, 6, 7, 3.2, 4.4, 0.25, p.a);
        k.add(K.roof(9, 1.2, 1.4, 0.1, 8.6, 0.2), p.b, 0, 5, 3.1);
        return;
      }
      if (s === 2) {
        k.add(B(10, 1.2, 7, 0.1), p.b, 0, 0, 0);
        for (let i = 0; i < 4; i++)
          k.add(K.ball(3 - i * 0.4, 1), '#f4f4f0', -3 + i * 2.2, 1.2, -0.5 + i * 0.4, {
            sc: [0.9, 1.4 - i * 0.15, 1.6],
            rot: [0.4, 0.3 - i * 0.2, 0],
          });
        k.add(Bc(8, 1, 0.05, 0.02), p.w, 0, 1.8, 3.52, { lit: true });
        return;
      }
      k.add(K.post(5, 0.6, 16), p.b, 0, 0, 0);
      k.add(
        K.lathe(
          [
            [5, 0],
            [4.6, 2],
            [3, 4],
            [0.001, 4.6],
          ],
          16,
        ),
        p.a,
        0,
        0.6,
        0,
      );
      const h = k.sub('holo', [0, 6.4, 0]);
      for (let i = 0; i < 3; i++) h.add(torus(1 + i * 0.6, 0.06), p.g, 0, i * 0.3, 0, { glow: true, rot: [Math.PI / 2, 0, i * 0.4] });
      return { spin: [['holo', 'y', 0.9]], pulse: true };
    },
    stadium(k, o) {
      const p = o.pal || P0,
        s = st(o.lv);
      if (s === 0) {
        k.add(
          K.lathe(
            [
              [5, 0],
              [5.4, 0],
              [5.4, 1.6],
              [4.8, 1.6],
            ],
            16,
          ),
          p.a,
          0,
          0,
          0,
        );
        k.add(K.disc(4.8, 16), '#c8b48a', 0, 0.05, 0, { ao: false });
        return;
      }
      if (s === 1) {
        k.add(
          K.lathe(
            [
              [5.6, 0],
              [6, 0],
              [6, 4.2],
              [5.6, 4.2],
            ],
            18,
          ),
          p.a,
          0,
          0,
          0,
        );
        for (let i = 0; i < 18; i++) {
          const a = (i / 18) * Math.PI * 2;
          k.add(B(0.8, 2.4, 0.2, 0.05), p.d, Math.sin(a) * 6.02, 0.6, Math.cos(a) * 6.02, { rot: [0, a, 0] });
        }
        k.add(K.disc(5.6, 18), '#c8b48a', 0, 0.05, 0, { ao: false });
        return;
      }
      if (s === 2) {
        k.add(
          K.lathe(
            [
              [5, 0],
              [7, 0],
              [7.4, 3.6],
              [6.4, 3.6],
              [5, 1],
            ],
            20,
          ),
          p.a,
          0,
          0,
          0,
        );
        k.add(K.disc(5, 20), '#5a9646', 0, 0.06, 0, { ao: false });
        for (let i = 0; i < 4; i++) {
          const a = (i / 4) * Math.PI * 2 + 0.78;
          k.add(K.post(0.12, 7, 4), p.d, Math.sin(a) * 7.2, 0, Math.cos(a) * 7.2);
          k.add(B(1.2, 0.6, 0.3, 0.05), '#fff6c8', Math.sin(a) * 7.2, 7, Math.cos(a) * 7.2, { glow: true, rot: [0, a, 0] });
        }
        return;
      }
      k.add(K.post(1.2, 3, 8), p.b, 0, 0, 0);
      const r = k.sub('bowl', [0, 5, 0]);
      r.add(
        K.lathe(
          [
            [2, -1.6],
            [6, -0.6],
            [6.6, 1],
            [5.6, 1],
            [2, 0],
          ],
          18,
        ),
        p.a,
        0,
        0,
        0,
      );
      r.add(K.disc(5.4, 18), '#5ad8a0', 0, 0.1, 0, { glow: true });
      return { bob: [['bowl', 0.5, 0.3]], pulse: true };
    },
    bath(k, o) {
      const p = o.pal || P0,
        s = st(o.lv);
      if (s === 0) {
        for (let i = 0; i < 10; i++) {
          const a = (i / 10) * Math.PI * 2;
          k.add(K.ball(0.6, 0), p.a, Math.cos(a) * 2.6, 0.2, Math.sin(a) * 2.6, { sc: [1.2, 0.6, 1] });
        }
        k.add(K.disc(2.3, 14), '#6ac0d8', 0, 0.12, 0, { ao: false });
        return { smoke: [[0, 0.4, 0, 1]] };
      }
      if (s === 1) {
        k.add(B(7, 3, 5, 0.1), p.a, 0, 0, 0);
        k.add(
          K.lathe(
            [
              [2.6, 0],
              [2.4, 1],
              [1.4, 2],
              [0.001, 2.3],
            ],
            12,
          ),
          p.c,
          0,
          3,
          0,
        );
        k.add(K.post(0.35, 4, 6), p.b, 2.6, 3, -1.6);
        winRow(k, p, 6, 2.52, 1.4, 4);
        return { smoke: [[2.6, 7.2, -1.6, 0.8]] };
      }
      if (s === 2) {
        k.add(B(10, 0.6, 7, 0.1), p.b, 0, 0, 0);
        k.add(B(8, 0.1, 5, 0.02), '#4ab8e0', 0, 0.62, 0, { ao: false });
        for (let i = 0; i < 2; i++) {
          k.add(K.post(0.15, 5 + i * 1.5, 4), p.d, -3 + i * 6, 0, -3);
          k.add(torus(1.4, 0.3), ['#e05a3a', '#e0b23a'][i], -2 + i * 6, 3 + i, -2, { rot: [0.6, i, 0] });
        }
        return;
      }
      for (let i = 0; i < 3; i++) {
        const s2 = k.sub('pool' + i, [-3 + i * 3, 2 + i * 1.5, 0]);
        s2.add(K.post(1.8, 0.6, 12), p.a, 0, 0, 0);
        s2.add(K.disc(1.6, 12), '#7ff0ff', 0, 0.62, 0, { glow: true });
      }
      return {
        bob: [
          ['pool0', 0.3, 0.4],
          ['pool1', 0.4, 0.35],
          ['pool2', 0.3, 0.45],
        ],
      };
    },
    observatory(k, o) {
      const p = o.pal || P0,
        s = st(o.lv);
      if (s === 0) {
        k.add(K.disc(4, 16), p.b, 0, 0.04, 0, { ao: false });
        for (let i = 0; i < 12; i++) {
          const a = (i / 12) * Math.PI * 2;
          k.add(B(0.4, 1 + (i % 3) * 0.5, 0.3, 0.06), p.a, Math.cos(a) * 3.6, 0, Math.sin(a) * 3.6, { rot: [0, -a, 0] });
        }
        k.add(B(0.4, 3.4, 0.4, 0.06), p.c, 0, 0, 0);
        return;
      }
      if (s === 1) {
        k.add(K.post(3, 4, 14), p.a, 0, 0, 0);
        k.add(K.ball(3, 1), '#e0e4ea', 0, 4, 0, { sc: [1, 0.85, 1] });
        k.add(Bc(0.8, 3, 0.2, 0.05), p.d, 0, 5, 2.4, { rot: [0.6, 0, 0] });
        k.add(K.post(0.3, 2, 6), p.d, 0.6, 5, 2.2, { rot: [0.7, 0, 0] });
        return;
      }
      if (s === 2) {
        k.add(B(3, 3, 3, 0.1), p.a, 0, 0, 0);
        k.add(K.post(0.5, 3, 8), p.d, 0, 3, 0);
        const d = k.sub('dish', [0, 6.6, 0]);
        d.add(
          K.lathe(
            [
              [0.001, 0],
              [3.2, 0.8],
              [3.6, 1.6],
            ],
            14,
          ),
          '#f2f2ee',
          0,
          0,
          0,
          { rot: [1.0, 0, 0] },
        );
        d.add(K.post(0.06, 2.4, 4), p.d, 0, 0, 0.4, { rot: [1.0, 0, 0] });
        return { spin: [['dish', 'y', 0.2]] };
      }
      const r = k.sub('scope', [0, 9, 0]);
      r.add(torus(3, 0.25), p.c, 0, 0, 0, { glow: true });
      r.add(K.post(0.6, 5, 10).rotateX(Math.PI / 2), p.a, 0, 0, 0);
      k.add(K.post(0.3, 7, 6), p.a, 0, 0, 0);
      k.add(K.post(2.6, 0.4, 12), p.b, 0, 0, 0);
      return { spin: [['scope', 'y', 0.25]], pulse: true };
    },
  };
  const NAME = {
    school: ['Lán học', 'Trường làng có chuông', 'Trường học', 'Học viện vòm sáng'],
    library: ['Nhà chép sách', 'Thư viện mái vòm', 'Thư viện kính', 'Tháp sách xoắn'],
    museum: ['Nhà giữ vật cổ', 'Bảo tàng cột đá', 'Bảo tàng khối lệch', 'Bảo tàng pha lê'],
    hospital: ['Nhà thuốc nam', 'Nhà thương', 'Bệnh viện', 'Viện chữa lành'],
    theater: ['Sân khấu bậc đá', 'Nhà hát lớn', 'Nhà hát vỏ sò', 'Nhà hát ảnh nổi'],
    stadium: ['Đấu trường đất', 'Đấu trường vòm cung', 'Sân vận động', 'Sân vận động bay'],
    bath: ['Suối nước nóng', 'Nhà tắm hơi', 'Công viên nước', 'Hồ bơi nổi'],
    observatory: ['Lịch đá mặt trời', 'Đài thiên văn mái vòm', 'Chảo ra-đa vũ trụ', 'Kính viễn vọng nổi'],
  };
  // mỗi thời một bộ, không trùng thời trước
  const BY_LV = [
    null,
    ['bath', 'observatory'],
    ['school', 'stadium'],
    ['library', 'theater', 'bath'],
    ['museum', 'school', 'observatory'],
    ['hospital', 'library', 'theater'],
    ['school', 'hospital', 'museum', 'stadium'],
    ['library', 'theater', 'observatory', 'bath'],
    ['museum', 'stadium', 'hospital', 'school'],
    ['library', 'theater', 'observatory', 'bath'],
    ['museum', 'school', 'hospital', 'stadium'],
    ['library', 'observatory', 'theater', 'bath'],
    ['museum', 'school', 'stadium', 'hospital'],
  ];
  const ANG = [0.6, -0.6, 1.35, -1.35, 2.1, -2.1, 2.75, -2.75];
  // bảng màu công trình công cộng của Lúa Vàng theo giai đoạn
  const PLAINS_PAL = [
    { a: '#d8c09a', b: '#9a6a44', c: '#b8462e', d: '#3e2c20', g: '#ffb04a', w: '#ffd89a' },
    { a: '#e6d6b8', b: '#a8523a', c: '#c94f3a', d: '#3a2a20', g: '#ffd27a', w: '#ffe0a0' },
    { a: '#e8eaee', b: '#4a5058', c: '#3f7fb8', d: '#2a3038', g: '#bfe3ff', w: '#fff0c8' },
    { a: '#f2eef8', b: '#8a80b0', c: '#c8a8ff', d: '#2e3450', g: '#b8f0ff', w: '#fff0ff' },
  ];
  function addTo(E, lv, pal, isle) {
    const list = BY_LV[lv] || [],
      off = (isle || 0) * 2;
    list.forEach((c, i) => {
      const a = ANG[(i * 2 + off) % ANG.length] + ((isle || 0) % 2 ? 0.15 : 0),
        r = 33,
        kind = 'c_' + c;
      E.pieces.push({
        kind,
        x: Math.sin(a) * r,
        z: Math.cos(a) * r,
        face: [0, 0],
        clear: 5,
        nudge: true,
        pal: pal || PLAINS_PAL[st(lv)],
        civic: c,
      });
      E.BUILD[kind] = CIVIC[c];
      E.NAME[kind] = NAME[c][st(lv)];
    });
  }
  BK.Civic3D = { CIVIC, NAME, BY_LV, addTo, PLAINS_PAL };
  // Lúa Vàng: thêm ngay khi tệp chạy (sau e01..e12)
  for (let lv = 1; lv <= 12; lv++) if (BK.Plains3D.ERA[lv]) addTo(BK.Plains3D.ERA[lv], lv, null, 0);
})(typeof self !== 'undefined' ? self : globalThis);
