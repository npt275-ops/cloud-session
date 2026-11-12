/* Bể Kính · render/build/marvels.js · Kiến trúc lạ của sáu đảo qua 12 thời (design/ke-hoach-buoc-14.md mục 4)
 * Thêm vào mỗi đảo, mỗi thời ba tới bốn công trình dáng lạ ở vòng ngoài làng (không bỏ công trình nào đã có). Mỗi đảo tám kiểu
 * theo chủ đề riêng của đảo; mỗi thời chọn ba, bốn kiểu xoay vòng, vật liệu và chi tiết đổi theo bốn giai đoạn (xưa: gỗ, đất, đá;
 * cận đại: gạch, ngói; hiện đại: bê tông, kính, cửa sổ sáng đèn; tương lai: kim loại, vòng sáng, mảnh lơ lửng) và lớn dần theo thời.
 *   plains   Lúa Vàng: tháp kho thóc xoắn · chùa diều · người rơm khổng lồ · guồng nước · đài bậc thang · cổng chuông · vòng đồng hồ mặt trời · cây đèn lồng
 *   forest   Thông Xanh: nhà cây xoắn · tháp cầu treo · nhà nấm · tháp cú · chóp gỗ vặn · cổng rễ cây · đài ngắm tán rừng · vườn đom đóm
 *   mountain Đá Mây: tu viện vách đá · cầu vòm đá · tháp hứng mây · trạm cáp treo · mặt đá khổng lồ · giàn mỏ pha lê · trụ đại bàng · đài bậc đá
 *   tundra   Tuyết Trắng: cung chóp băng · đàn hạc cực quang · cụm nhà băng · sảnh xương voi · hải đăng băng · tháp buồm gió · vòng cầu băng · suối nước nóng
 *   coast    Cửa Sóng: nhà hát vỏ sò · hải đăng vặn · đình nhà sàn · vòm xương cá voi · tháp san hô · nhà thuyền buồm · đồng hồ thuỷ triều · vòm bong bóng
 *   desert   Cát Hồng: tháp đón gió · giếng bậc · cung vòm sa thạch · tháp gương mặt trời · quán trọ vòm · đôi trụ mặt trời · tháp đất gai · vòm kính ốc đảo
 * Chỗ đặt: vòng ngoài làng (outer 'forest', render/build/place3d.js outerSpot), mỗi đảo bốn chỗ cố định (slot mv0..mv3) nên sang
 * thời mới công trình mới thay đúng chỗ công trình cũ; móng nằm trọn trong đảo (place3d keepOn; tools/check-footing.js).
 * Mỗi hàm (k, o): o.c bảng màu { w tường, r mái, t viền, g sáng }, o.st giai đoạn 0..3, o.s cỡ; trả phần chuyển động.
 * Cần: three.js, render/build/kit3d.js, render/build/plains/common.js. Tải trước isles/compose.js (compose gọi addTo cho năm đảo);
 * Lúa Vàng: tệp này tự thêm vào BK.Plains3D.ERA (tải sau plains/wonders.js). */
(function (root) {
  const BK = root.BK,
    K = BK.BuildKit,
    { B, Bc } = BK.Plains3D;
  const THREE = () => window.THREE,
    TAU = Math.PI * 2;
  const torus = (r, t) => new (THREE().TorusGeometry)(r, t, 6, 24).rotateX(Math.PI / 2);
  const arch = (r, t) => new (THREE().TorusGeometry)(r, t, 6, 16, Math.PI); // nửa vòng đứng (cổng vòm), chân ở y = 0
  const oct = (sx, sy, sz) => new (THREE().OctahedronGeometry)(1, 0).scale(sx, sy, sz);
  const stage = (lv) => (lv <= 3 ? 0 : lv <= 5 ? 1 : lv <= 8 ? 2 : 3);
  // bảng màu từng đảo theo bốn giai đoạn: [tường, mái, viền, sáng]
  const PAL = {
    plains: [
      ['#d2ad80', '#d8b45a', '#7a5134', '#ffd27a'],
      ['#ecdcbc', '#a8523a', '#7a5134', '#ffd98a'],
      ['#e2e0da', '#b8462e', '#5a6470', '#ffe9a8'],
      ['#f2f2ee', '#e6c04a', '#7fb2cc', '#9cf0ff'],
    ],
    forest: [
      ['#8a6444', '#4f8a3f', '#5b4630', '#c8f07a'],
      ['#a8784a', '#3f7a4c', '#5b4630', '#ffe08a'],
      ['#cfd8c4', '#3f7a4c', '#55705a', '#d8ff9a'],
      ['#dff4e4', '#5fd08a', '#3f8a6a', '#8affc8'],
    ],
    mountain: [
      ['#9d9589', '#6d695f', '#5f5b53', '#ffd27a'],
      ['#b8b0a2', '#5a6470', '#6d695f', '#ffe08a'],
      ['#d0d4d8', '#4a5a6e', '#7c8894', '#cfe8ff'],
    ],
    tundra: [
      ['#d6e4ec', '#9cc7dc', '#8a949d', '#bfe9ff'],
      ['#e6edf1', '#6f9ab8', '#7b858e', '#ffe9b8'],
      ['#eef4f7', '#4f8fb8', '#8aa0b0', '#bff0ff'],
      ['#f6fbff', '#7fd8f0', '#9cc7dc', '#9cf0ff'],
    ],
    coast: [
      ['#ecd9a8', '#3fb8c8', '#8a6a46', '#ffe08a'],
      ['#f4ead0', '#2f8fb0', '#8a6a46', '#ffe9a8'],
      ['#f6f6f2', '#3f9fc8', '#7fa8b8', '#bff0ff'],
      ['#ffffff', '#58d8e0', '#8fc8d8', '#8affee'],
    ],
    desert: [
      ['#d9a56a', '#b87b4f', '#8f5f3e', '#ffcf7a'],
      ['#e3bd7f', '#a8523a', '#8f5f3e', '#ffd98a'],
      ['#ecdcc0', '#c86a3a', '#9a7a5a', '#ffe9b8'],
      ['#f6ead8', '#ff9a5a', '#c8a070', '#ffd0a0'],
    ],
  };
  PAL.mountain.push(['#e4e8ee', '#8fb0e0', '#9aa8b8', '#b8d8ff']);
  const colOf = (key, st) => {
    const p = PAL[key][st];
    return { w: p[0], r: p[1], t: p[2], g: p[3] };
  };
  /* ---------- Mảnh dùng lại ---------- */
  // nét của giai đoạn: hiện đại có hàng cửa sổ sáng đèn quanh thân tròn; tương lai có vòng sáng lơ lửng trên đỉnh
  const lights = (k, o, r, y0, y1, n) => {
    if (o.st < 2) return;
    for (let y = y0; y <= y1; y += 1.6)
      for (let i = 0; i < (n || 6); i++) {
        const a = (i / (n || 6)) * TAU;
        k.add(Bc(0.5, 0.6, 0.08, 0.02), o.c.g, Math.cos(a) * r, y, Math.sin(a) * r, { rot: [0, -a + Math.PI / 2, 0], lit: true });
      }
  };
  const halo = (k, o, r, y, name) => {
    if (o.st < 3) return null;
    const h = k.sub(name || 'halo', [0, y, 0]);
    h.add(torus(r, 0.12), o.c.g, 0, 0, 0, { glow: true });
    h.add(torus(r * 0.6, 0.07), o.c.g, 0, 0.5, 0, { glow: true });
    return [name || 'halo', 'y', 0.5];
  };
  const flag = (k, c, x, y, z, h) => {
    k.add(K.post(0.05, h || 2, 4), '#5a4030', x, y, z);
    k.add(Bc(0.9, 0.5, 0.04, 0.01), c, x + 0.45, y + (h || 2) - 0.3, z);
  };
  const drum = (k, c, r, h, y, seg, top) => k.add(K.post(r, h, seg || 10, top == null ? r : top), c, 0, y, 0);
  const steps = (k, c, r, n, h, seg) => {
    for (let i = 0; i < n; i++) k.add(K.post(r - i * ((r * 0.5) / n), h, seg || 10, r - i * ((r * 0.5) / n)), c, 0, i * h, 0);
    return n * h;
  };

  const M = {
    /* ===== Lúa Vàng ===== */
    plains: {
      granary: [
        'Tháp kho thóc xoắn',
        (k, o) => {
          const c = o.c,
            s = o.s,
            h = 7 * s;
          drum(k, c.t, 3.2, 0.5, 0, 10);
          drum(k, c.w, 2.6, h, 0.5, 10, 2.2);
          for (let i = 0; i < 14; i++) {
            const a = i * 0.9,
              y = 0.8 + (i / 14) * (h - 1);
            k.add(Bc(1.5, 0.14, 0.7, 0.03), c.t, Math.cos(a) * 2.9, y, Math.sin(a) * 2.9, { rot: [0, -a + Math.PI / 2, 0] });
          }
          k.add(K.cone(3.3, 2.6 * s, 10), c.r, 0, h + 0.5, 0);
          lights(k, o, 2.5, 2, h - 1);
          const sp = halo(k, o, 3, h + 4);
          return sp ? { spin: [sp] } : null;
        },
      ],
      kite: [
        'Chùa diều',
        (k, o) => {
          const c = o.c,
            s = o.s;
          let y = 0;
          for (let i = 0; i < 4; i++) {
            const w = (4.4 - i * 0.8) * s;
            k.add(B(w * 0.7, 1.6, w * 0.7, 0.1), c.w, 0, y, 0);
            k.add(K.roof(w * 1.25, 0.8, w * 1.25, 0.08, w * 0.5, w * 0.5, 0.5), c.r, 0, y + 1.6, 0);
            y += 2.4;
          }
          k.add(K.post(0.08, 3, 5), c.t, 0, y, 0);
          const anim = { sway: [] };
          for (let i = 0; i < 3; i++) {
            const a = i * 2.1,
              n = 'kite' + i,
              q = k.sub(n, [Math.cos(a) * 3, y + 2 + i, Math.sin(a) * 3]);
            q.add(oct(0.7, 0.9, 0.06), [c.g, c.r, '#e86a6a'][i], 0, 0, 0, { glow: o.st === 3 });
            q.add(Bc(0.04, 1.6, 0.04, 0.01), c.t, 0, -1.2, 0);
            anim.sway.push([n, 'z', 0.25, 0.9 + i * 0.3]);
          }
          return anim;
        },
      ],
      strawman: [
        'Người rơm khổng lồ',
        (k, o) => {
          const c = o.c,
            s = o.s;
          k.add(K.post(0.35, 5 * s, 6), c.t, 0, 0, 0);
          k.add(
            K.lathe(
              [
                [1.9 * s, 0],
                [1.5 * s, 2],
                [0.6 * s, 3.4 * s],
              ],
              9,
            ),
            c.r,
            0,
            2.2 * s,
            0,
          );
          k.add(Bc(6 * s, 0.35, 0.35, 0.08), c.t, 0, 4.9 * s, 0);
          for (const sx of [-1, 1]) k.add(K.cone(0.7, 1.6, 7), c.r, sx * 2.8 * s, 4.1 * s, 0, { rot: [Math.PI, 0, 0] });
          k.add(K.ball(1.05 * s, 1), c.w, 0, 6.3 * s, 0);
          k.add(K.cone(1.5 * s, 1.1, 9), c.r, 0, 7 * s, 0);
          for (const sx of [-0.4, 0.4]) k.add(K.ball(0.14), o.st === 3 ? c.g : '#3a2a20', sx * s, 6.4 * s, 0.95 * s, { glow: o.st === 3 });
          return null;
        },
      ],
      wheel: [
        'Guồng nước',
        (k, o) => {
          const c = o.c,
            s = o.s,
            r = 3.4 * s;
          k.add(B(2.6, 3.2, 3.4, 0.1), c.w, -2.6, 0, 0);
          k.add(K.roof(3.2, 1.4, 4, 0.08, 0.4, 3.4), c.r, -2.6, 3.2, 0);
          k.add(B(1, 0.3, 6, 0.05), c.t, 1.2, 0, 0);
          for (const z of [-0.5, 0.5]) k.add(B(0.3, r + 0.6, 0.3, 0.05), c.t, 1.2, 0, z * 2.2);
          const w = k.sub('wheel', [1.2, r + 0.4, 0]);
          w.add(new (THREE().TorusGeometry)(r, 0.14, 6, 20).rotateY(Math.PI / 2), c.t, 0, 0, 0);
          for (let i = 0; i < 8; i++) {
            const a = (i / 8) * TAU;
            w.add(Bc(0.1, r * 2, 0.1, 0.02), c.t, 0, 0, 0, { rot: [a, 0, 0] });
            w.add(Bc(0.9, 0.1, 0.7, 0.02), o.st === 3 ? c.g : c.r, 0, Math.cos(a) * r, Math.sin(a) * r, {
              rot: [a, 0, 0],
              glow: o.st === 3,
            });
          }
          return { spin: [['wheel', 'x', 0.5]] };
        },
      ],
      terrace: [
        'Đài bậc thang',
        (k, o) => {
          const c = o.c,
            s = o.s,
            n = 4 + o.st;
          for (let i = 0; i < n; i++) {
            const r = (4.6 - i * 0.62) * s;
            k.add(K.post(r, 0.9, 12, r), i % 2 ? c.w : c.t, 0, i * 0.9, 0);
            k.add(K.post(r - 0.05, 0.06, 12, r - 0.05), i % 2 ? '#8cc05a' : c.r, 0, i * 0.9 + 0.9, 0);
          }
          const y = n * 0.9;
          k.add(B(1.6, 1.8, 1.6, 0.1), c.w, 0, y, 0);
          k.add(K.roof(2.6, 1, 2.6, 0.08, 0.2, 0.2, 0.4), c.r, 0, y + 1.8, 0);
          lights(k, o, 0.85, y + 0.9, y + 1, 4);
          return null;
        },
      ],
      bell: [
        'Cổng chuông',
        (k, o) => {
          const c = o.c,
            s = o.s,
            h = 5.5 * s;
          for (const sx of [-1, 1]) {
            k.add(B(1.2, h, 1.2, 0.12), c.w, sx * 2.6, 0, 0);
            k.add(K.roof(1.8, 0.7, 1.8, 0.06, 0.3, 0.3, 0.3), c.r, sx * 2.6, h, 0);
          }
          k.add(Bc(7.4, 0.5, 1, 0.1), c.t, 0, h - 0.4, 0);
          k.add(K.roof(8.4, 1, 2, 0.08, 6, 0.4, 0.5), c.r, 0, h, 0);
          const b = k.sub('bell', [0, h - 0.7, 0]);
          b.add(Bc(0.08, 1, 0.08, 0.02), c.t, 0, -0.5, 0);
          b.add(
            K.lathe(
              [
                [0.95, 0],
                [0.8, 0.5],
                [0.45, 1.3],
                [0.1, 1.5],
              ],
              9,
            ),
            o.st === 3 ? c.g : '#b8923a',
            0,
            -2.4,
            0,
            { glow: o.st === 3 },
          );
          return { sway: [['bell', 'z', 0.22, 1.1]] };
        },
      ],
      sundial: [
        'Vòng đồng hồ mặt trời',
        (k, o) => {
          const c = o.c,
            s = o.s;
          drum(k, c.t, 4.2 * s, 0.4, 0, 16);
          drum(k, c.w, 3.9 * s, 0.12, 0.4, 16);
          k.add(Bc(0.3, 5 * s, 2.6 * s, 0.05), c.r, 0, 2.2 * s, 0, { rot: [0.7, 0, 0] });
          for (let i = 0; i < 12; i++) {
            const a = (i / 12) * TAU,
              h = (i % 3 ? 1.4 : 2.6) * s;
            k.add(B(0.6, h, 0.6, 0.08), i % 3 ? c.w : c.t, Math.cos(a) * 3.5 * s, 0.5, Math.sin(a) * 3.5 * s);
            if (o.st >= 2) k.add(K.ball(0.22), c.g, Math.cos(a) * 3.5 * s, h + 0.7, Math.sin(a) * 3.5 * s, { lit: true });
          }
          const sp = halo(k, o, 2.4, 6 * s);
          return sp ? { spin: [sp] } : null;
        },
      ],
      lantern: [
        'Cây đèn lồng',
        (k, o) => {
          const c = o.c,
            s = o.s,
            h = 8 * s;
          k.add(K.post(0.55, h, 7, 0.25), c.t, 0, 0, 0);
          const anim = { bob: [] };
          for (let i = 0; i < 7; i++) {
            const a = i * 2.4,
              y = 2.4 + (i * (h - 2.4)) / 7,
              r = (2.8 - i * 0.22) * s;
            k.add(Bc(r, 0.12, 0.12, 0.03), c.t, Math.cos(a) * r * 0.5, y, Math.sin(a) * r * 0.5, { rot: [0, -a, 0] });
            const n = 'lan' + i,
              q = k.sub(n, [Math.cos(a) * r, y - 0.7, Math.sin(a) * r]);
            q.add(
              K.lathe(
                [
                  [0.2, 0],
                  [0.42, 0.3],
                  [0.42, 0.7],
                  [0.2, 1],
                ],
                7,
              ),
              i % 2 ? c.g : c.r,
              0,
              -0.5,
              0,
              { glow: true },
            );
            anim.bob.push([n, 0.12, 0.8 + i * 0.13]);
          }
          k.add(K.ball(0.5, 1), c.g, 0, h + 0.3, 0, { glow: true });
          return anim;
        },
      ],
    },
    /* ===== Thông Xanh ===== */
    forest: {
      treehouse: [
        'Nhà cây xoắn',
        (k, o) => {
          const c = o.c,
            s = o.s,
            h = 10 * s;
          k.add(K.post(1.3, h, 8, 0.7), '#5b4630', 0, 0, 0);
          for (let i = 0; i < 4; i++) {
            const a = i * 1.7,
              y = 2.6 + i * 2 * s,
              r = 2.4;
            k.add(K.post(1.7, 0.2, 8, 1.7), c.t, Math.cos(a) * r, y, Math.sin(a) * r);
            k.add(B(1.8, 1.4, 1.8, 0.1), c.w, Math.cos(a) * r, y + 0.2, Math.sin(a) * r, { rot: [0, a, 0] });
            k.add(K.cone(1.7, 1.2, 7), c.r, Math.cos(a) * r, y + 1.6, Math.sin(a) * r);
            if (o.st >= 2)
              k.add(Bc(0.5, 0.5, 0.06, 0.02), c.g, Math.cos(a) * (r + 0.93), y + 0.9, Math.sin(a) * (r + 0.93), {
                rot: [0, -a + Math.PI / 2, 0],
                lit: true,
              });
          }
          for (let i = 0; i < 5; i++) {
            const a = i * 1.26;
            k.add(K.ball(2.3 * s, 0), i % 2 ? '#3f7a4c' : '#4a8a55', Math.cos(a) * 2.2, h + 0.6 + (i % 2), Math.sin(a) * 2.2);
          }
          const sp = halo(k, o, 3.6, h + 3.4);
          return sp ? { spin: [sp] } : null;
        },
      ],
      rope: [
        'Tháp cầu treo',
        (k, o) => {
          const c = o.c,
            s = o.s,
            h = 7 * s;
          for (const sx of [-1, 1]) {
            k.add(K.post(0.9, h, 7, 0.7), '#6b4b32', sx * 3.3, 0, 0);
            k.add(K.post(1.5, 0.2, 7, 1.5), c.t, sx * 3.3, h * 0.72, 0);
            k.add(B(1.6, 1.5, 1.6, 0.1), c.w, sx * 3.3, h, 0);
            k.add(K.cone(1.6, 1.6, 6), c.r, sx * 3.3, h + 1.5, 0);
          }
          for (let i = -4; i <= 4; i++) {
            const y = h * 0.72 - 0.9 * (1 - (i * i) / 16);
            k.add(Bc(0.6, 0.08, 1, 0.02), c.t, i * 0.66, y, 0);
          }
          for (const z of [-0.5, 0.5]) k.add(Bc(6.2, 0.05, 0.05, 0.01), o.st === 3 ? c.g : c.t, 0, h * 0.72 + 0.6, z, { glow: o.st === 3 });
          lights(k, o, 0.85, h + 0.6, h + 0.7, 4);
          return null;
        },
      ],
      mushroom: [
        'Nhà nấm',
        (k, o) => {
          const c = o.c,
            s = o.s;
          k.add(
            K.lathe(
              [
                [1.9 * s, 0],
                [1.4 * s, 1.5],
                [1.2 * s, 4 * s],
              ],
              9,
            ),
            '#efe6d2',
            0,
            0,
            0,
          );
          k.add(
            K.lathe(
              [
                [0.2, 3 * s],
                [4.4 * s, 2 * s],
                [4.2 * s, 1.2 * s],
                [1.2 * s, 0],
              ],
              10,
            ),
            c.r,
            0,
            3.6 * s,
            0,
          );
          for (let i = 0; i < 7; i++) {
            const a = i * 0.9;
            k.add(K.ball(0.45, 1), '#fff6e0', Math.cos(a) * 2.6 * s, 5.2 * s + (i % 2) * 0.5, Math.sin(a) * 2.6 * s, { glow: o.st === 3 });
          }
          k.add(Bc(0.9, 1.5, 0.1, 0.03), c.t, 0, 0.75, 1.75 * s);
          if (o.st >= 1) for (const sx of [-1, 1]) k.add(Bc(0.55, 0.55, 0.08, 0.02), c.g, sx * 1.0, 2.4, 1.45 * s, { lit: true });
          for (const [x, z, q] of [
            [3.2, 1.4, 0.5],
            [-3, 2, 0.4],
          ]) {
            k.add(K.post(0.3 * q * 2, 1.6 * q * 2, 6), '#efe6d2', x, 0, z);
            k.add(
              K.lathe(
                [
                  [0.1, 0.9],
                  [1.4 * q * 2, 0.5],
                  [0.3, 0],
                ],
                8,
              ),
              c.r,
              x,
              1.5 * q * 2,
              z,
            );
          }
          return { smoke: [[0.8, 7 * s, -0.6, 0.6]] };
        },
      ],
      owl: [
        'Tháp cú',
        (k, o) => {
          const c = o.c,
            s = o.s,
            h = 8 * s;
          k.add(
            K.lathe(
              [
                [2.4 * s, 0],
                [2.7 * s, h * 0.5],
                [2.2 * s, h * 0.85],
                [1.2 * s, h],
              ],
              8,
            ),
            c.w,
            0,
            0,
            0,
          );
          for (const sx of [-1, 1]) {
            k.add(K.post(0.75 * s, 0.2, 9, 0.75 * s), '#f2ead6', sx * 0.95 * s, h * 0.72, 2 * s, { rot: [Math.PI / 2, 0, 0] });
            k.add(K.ball(0.36 * s, 1), o.st >= 2 ? c.g : '#2e241c', sx * 0.95 * s, h * 0.72, 2.3 * s, { glow: o.st >= 2 });
            k.add(K.cone(0.6 * s, 1.6 * s, 4), c.t, sx * 1.4 * s, h, 0);
            k.add(Bc(0.3, 3.2 * s, 2.2 * s, 0.1), c.r, sx * 2.8 * s, h * 0.42, 0, { rot: [0, 0, sx * 0.18] });
          }
          k.add(K.cone(0.4 * s, 0.9 * s, 4), '#e0a030', 0, h * 0.58, 2.35 * s, { rot: [Math.PI / 2 + 0.6, 0, 0] });
          k.add(Bc(0.9, 1.5, 0.1, 0.03), c.t, 0, 0.75, 2.5 * s);
          return null;
        },
      ],
      spire: [
        'Chóp gỗ vặn',
        (k, o) => {
          const c = o.c,
            s = o.s,
            n = 9 + o.st * 2;
          for (let i = 0; i < n; i++) {
            const w = (3.8 - i * (3.2 / n)) * s;
            k.add(B(w, 1.05, w, 0.08), i % 2 ? c.w : c.t, 0, i * 1.0, 0, { rot: [0, i * 0.3, 0] });
            if (o.st >= 2 && i % 2)
              k.add(Bc(w * 0.5, 0.4, 0.06, 0.02), c.g, 0, i + 0.5, 0, { rot: [0, i * 0.3, 0], sc: [1, 1, w * 16.8], lit: true });
          }
          k.add(K.cone(0.5, 2.4, 5), c.r, 0, n, 0);
          const sp = halo(k, o, 2, n + 3);
          return sp ? { spin: [sp] } : null;
        },
      ],
      root: [
        'Cổng rễ cây',
        (k, o) => {
          const c = o.c,
            s = o.s;
          for (let i = 0; i < 3; i++)
            k.add(arch((3.2 - i * 0.5) * s, 0.5 - i * 0.1), i % 2 ? '#6b4b32' : '#5b4630', (i - 1) * 0.5, 0, (i - 1) * 0.9, {
              rot: [0, (i - 1) * 0.5, 0],
            });
          for (let i = 0; i < 6; i++) {
            const a = (i / 6) * Math.PI;
            k.add(
              K.ball(1.1 * s, 0),
              i % 2 ? '#3f7a4c' : '#4f8f45',
              Math.cos(a) * 3.2 * s,
              Math.sin(a) * 3.2 * s + 0.6,
              ((i % 3) - 1) * 0.7,
            );
          }
          const anim = { bob: [] };
          for (let i = 0; i < 4; i++) {
            const n = 'vine' + i,
              q = k.sub(n, [(i - 1.5) * 1.2, 2.2 * s, 0]);
            q.add(Bc(0.05, 1.4, 0.05, 0.01), '#4a8a55', 0, 0, 0);
            q.add(K.ball(0.2), c.g, 0, -0.8, 0, { glow: true });
            anim.bob.push([n, 0.1, 0.7 + i * 0.2]);
          }
          return anim;
        },
      ],
      canopy: [
        'Đài ngắm tán rừng',
        (k, o) => {
          const c = o.c,
            s = o.s,
            h = 8.5 * s;
          for (let i = 0; i < 5; i++) {
            const a = (i / 5) * TAU;
            k.add(K.post(0.22, h, 5), c.t, Math.cos(a) * 2.8, 0, Math.sin(a) * 2.8, { rot: [Math.sin(a) * -0.1, 0, Math.cos(a) * 0.1] });
          }
          for (let y = 2; y < h; y += 2.2) k.add(torus(2.3, 0.08), c.t, 0, y, 0);
          drum(k, c.t, 3.6 * s, 0.3, h, 10);
          drum(k, c.w, 2.6 * s, 1.5, h + 0.3, 10);
          k.add(new (THREE().SphereGeometry)(2.7 * s, 10, 5, 0, TAU, 0, Math.PI / 2), o.st >= 2 ? '#9fd8c8' : c.r, 0, h + 1.8, 0);
          lights(k, o, 2.6 * s, h + 1, h + 1.1, 8);
          const t = k.sub('scope', [0, h + 3.4 * s, 0]);
          t.add(K.post(0.3, 2.6, 6, 0.42), c.t, 0, 0, 0, { rot: [0.9, 0, 0] });
          return { spin: [['scope', 'y', 0.2]] };
        },
      ],
      firefly: [
        'Vườn đom đóm',
        (k, o) => {
          const c = o.c,
            s = o.s,
            anim = { bob: [] };
          drum(k, '#5b4630', 3.8 * s, 0.35, 0, 9);
          for (let i = 0; i < 7; i++) {
            const a = (i / 7) * TAU,
              r = (i % 2 ? 2.9 : 1.6) * s,
              h = (3 + ((i * 37) % 5)) * s * 0.8;
            k.add(K.post(0.14, h, 5), c.t, Math.cos(a) * r, 0.3, Math.sin(a) * r, { rot: [Math.sin(a) * 0.12, 0, -Math.cos(a) * 0.12] });
            const n = 'ff' + i,
              q = k.sub(n, [Math.cos(a) * r * 1.1, h + 0.5, Math.sin(a) * r * 1.1]);
            q.add(K.ball(0.5 + (i % 3) * 0.12, 1), i % 2 ? c.g : '#fff2a8', 0, 0, 0, { glow: true });
            anim.bob.push([n, 0.25, 0.6 + i * 0.17]);
          }
          k.add(
            K.lathe(
              [
                [1.2, 0],
                [1.5, 0.5],
                [0.9, 0.9],
              ],
              8,
            ),
            c.w,
            0,
            0.35,
            0,
          );
          k.add(K.ball(0.7, 1), c.g, 0, 1.6, 0, { glow: true });
          anim.pulse = true;
          return anim;
        },
      ],
    },
    /* ===== Đá Mây ===== */
    mountain: {
      monastery: [
        'Tu viện vách đá',
        (k, o) => {
          const c = o.c,
            s = o.s;
          k.add(
            K.lathe(
              [
                [4.4, 0],
                [3.8, 3 * s],
                [3, 5.5 * s],
                [2.6, 6 * s],
              ],
              7,
            ),
            c.t,
            0,
            0,
            -0.6,
          );
          for (let i = 0; i < 4; i++) {
            const w = 4.6 - i * 0.7,
              y = 1.2 + i * 2.1 * s,
              z = 1.4 - i * 0.55;
            k.add(B(w, 1.7, 2.2, 0.08), c.w, 0, y, z);
            k.add(K.roof(w + 0.8, 0.7, 3, 0.06, w, 0.5, 0.4), c.r, 0, y + 1.7, z);
            if (o.st >= 1)
              for (let j = -1; j <= 1; j++) k.add(Bc(0.45, 0.6, 0.06, 0.02), c.g, j * w * 0.28, y + 0.9, z + 1.13, { lit: true });
          }
          flag(k, '#e86a4a', 0, 1.2 + 4 * 2.1 * s, -0.3, 2.2);
          const sp = halo(k, o, 3.2, 12 * s);
          return sp ? { spin: [sp] } : null;
        },
      ],
      stonearch: [
        'Cầu vòm đá',
        (k, o) => {
          const c = o.c,
            s = o.s;
          for (const sx of [-1, 1])
            k.add(
              K.lathe(
                [
                  [2, 0],
                  [1.6, 2.5 * s],
                  [1.3, 5 * s],
                ],
                6,
              ),
              c.t,
              sx * 3.6 * s,
              0,
              0,
            );
          k.add(arch(3.6 * s, 0.75), c.w, 0, 3.4 * s, 0);
          k.add(Bc(9.4 * s, 0.4, 1.8, 0.08), c.w, 0, 7.2 * s, 0);
          for (let i = -4; i <= 4; i++) k.add(B(0.3, 0.6, 0.3, 0.04), c.t, i * 1.05 * s, 7.4 * s, 0.75);
          k.add(B(1.5, 1.6, 1.5, 0.08), c.w, 0, 7.4 * s, 0);
          k.add(K.roof(2.2, 0.9, 2.2, 0.06, 0.2, 0.2, 0.4), c.r, 0, 9 * s + 0.1, 0);
          if (o.st >= 2) k.add(Bc(8.6 * s, 0.08, 0.08, 0.02), c.g, 0, 7.05 * s, 0.9, { glow: true });
          return null;
        },
      ],
      cloud: [
        'Tháp hứng mây',
        (k, o) => {
          const c = o.c,
            s = o.s,
            h = 11 * s;
          k.add(
            K.lathe(
              [
                [2.2, 0],
                [1.2, h * 0.5],
                [1.6, h],
              ],
              8,
            ),
            c.w,
            0,
            0,
            0,
          );
          lights(k, o, 1.5, 2, h - 2, 5);
          const r = k.sub('ring', [0, h + 0.6, 0]);
          r.add(torus(3.8 * s, 0.22), c.t, 0, 0, 0);
          for (let i = 0; i < 6; i++) {
            const a = (i / 6) * TAU;
            r.add(Bc(3.6 * s, 0.08, 0.08, 0.02), c.t, Math.cos(a) * 1.8 * s, 0, Math.sin(a) * 1.8 * s, { rot: [0, -a, 0] });
            r.add(K.ball(0.9, 0), '#f6f9fb', Math.cos(a) * 3.8 * s, 0.5, Math.sin(a) * 3.8 * s, { glow: o.st === 3 });
          }
          return { spin: [['ring', 'y', 0.25]] };
        },
      ],
      cable: [
        'Trạm cáp treo',
        (k, o) => {
          const c = o.c,
            s = o.s,
            h = 7 * s;
          k.add(B(3.4, 2.6, 3, 0.1), c.w, -2.6, 0, 0);
          k.add(K.roof(4, 1.2, 3.6, 0.08, 3.4, 0.4), c.r, -2.6, 2.6, 0);
          for (const x of [-2.6, 3.4]) {
            k.add(B(0.5, h, 0.5, 0.06), c.t, x, 0, -1.9);
            k.add(Bc(0.3, 0.3, 2.4, 0.05), c.t, x, h, -0.9);
          }
          k.add(Bc(6.4, 0.06, 0.06, 0.01), '#3a3a40', 0.4, h, 0);
          const g = k.sub('gondola', [-1.6, h - 1.5, 0]);
          g.add(Bc(0.06, 1, 0.06, 0.01), '#3a3a40', 0, 1, 0);
          g.add(Bc(1.4, 1.1, 1, 0.12), o.st >= 2 ? c.g : c.r, 0, 0, 0, { lit: o.st >= 2 });
          g.add(Bc(1.5, 0.15, 1.1, 0.04), c.t, 0, 0.6, 0);
          return { slide: [['gondola', 'x', 0.35, 4]] };
        },
      ],
      face: [
        'Mặt đá khổng lồ',
        (k, o) => {
          const c = o.c,
            s = o.s;
          k.add(
            K.lathe(
              [
                [3, 0],
                [3.4, 3 * s],
                [3, 7 * s],
                [1.6, 9 * s],
              ],
              7,
            ),
            c.w,
            0,
            0,
            0,
          );
          k.add(B(1.1, 2.8 * s, 1.2, 0.2), c.t, 0, 3.4 * s, 2.7);
          for (const sx of [-1, 1]) {
            k.add(Bc(1.3, 0.6, 0.5, 0.1), '#2e2a26', sx * 1.4, 6 * s, 2.7);
            k.add(K.ball(0.22), o.st >= 2 ? c.g : '#d8d0c0', sx * 1.4, 6 * s, 2.95, { glow: o.st >= 2 });
            k.add(Bc(1.8, 0.4, 0.7, 0.1), c.t, sx * 1.4, 6.7 * s, 2.7, { rot: [0, 0, sx * -0.15] });
          }
          k.add(Bc(2.2, 0.35, 0.5, 0.08), '#2e2a26', 0, 2.4 * s, 2.9);
          k.add(Bc(0.9, 1.5, 0.3, 0.05), '#2e2a26', 0, 0.75, 3.05);
          for (let i = 0; i < 5; i++) k.add(K.cone(0.7, 1.8, 5), c.r, (i - 2) * 1.1, 8.6 * s, -0.4, { rot: [0, 0, (i - 2) * -0.2] });
          return null;
        },
      ],
      mine: [
        'Giàn mỏ pha lê',
        (k, o) => {
          const c = o.c,
            s = o.s,
            h = 8 * s;
          for (const [x, z] of [
            [-1.6, -1.6],
            [1.6, -1.6],
            [-1.6, 1.6],
            [1.6, 1.6],
          ])
            k.add(K.post(0.2, h, 4), c.t, x, 0, z, { rot: [z * 0.05, 0, -x * 0.05] });
          for (let y = 2; y < h; y += 2) k.add(Bc(3 - y * 0.12, 0.14, 3 - y * 0.12, 0.02), c.t, 0, y, 0);
          k.add(B(2, 1.4, 2, 0.08), c.w, 0, h, 0);
          k.add(K.roof(2.8, 0.8, 2.8, 0.06, 0.3, 0.3), c.r, 0, h + 1.4, 0);
          const w = k.sub('pulley', [0, h - 0.6, 0]);
          w.add(new (THREE().TorusGeometry)(0.9, 0.12, 5, 12).rotateY(Math.PI / 2), '#3a3a40', 0, 0, 0);
          w.add(Bc(0.08, 1.8, 0.08, 0.02), '#3a3a40', 0, 0, 0);
          for (let i = 0; i < 6; i++) {
            const a = i * 1.05;
            k.add(oct(0.5, 1.2 + (i % 3) * 0.5, 0.5), i % 2 ? c.g : '#b8a8f0', Math.cos(a) * 3.2, 0.9, Math.sin(a) * 3.2, {
              rot: [0.2, a, 0.25],
              glow: true,
            });
          }
          return { spin: [['pulley', 'x', 1.2]], pulse: true };
        },
      ],
      eagle: [
        'Trụ đại bàng',
        (k, o) => {
          const c = o.c,
            s = o.s,
            h = 10 * s;
          steps(k, c.t, 3, 3, 0.5, 8);
          k.add(
            K.lathe(
              [
                [1.5, 0],
                [1, h * 0.6],
                [1.3, h],
              ],
              8,
            ),
            c.w,
            0,
            1.5,
            0,
          );
          k.add(K.post(1.9, 0.4, 8, 1.9), c.t, 0, h + 1.5, 0);
          const y = h + 1.9;
          k.add(
            K.lathe(
              [
                [0.9, 0],
                [1.1, 1],
                [0.6, 2.2],
              ],
              7,
            ),
            c.r,
            0,
            y,
            0,
          );
          k.add(K.ball(0.6, 1), c.r, 0, y + 2.5, 0.2);
          k.add(K.cone(0.25, 0.8, 4), '#e0a030', 0, y + 2.4, 0.9, { rot: [Math.PI / 2, 0, 0] });
          const anim = { sway: [] };
          for (const sx of [-1, 1]) {
            const n = sx > 0 ? 'wingR' : 'wingL',
              q = k.sub(n, [sx * 0.8, y + 1.5, 0]);
            q.add(Bc(3.6 * s, 0.15, 1.6, 0.05), o.st === 3 ? c.g : c.r, sx * 1.8 * s, 0, 0, { glow: o.st === 3 });
            anim.sway.push([n, 'z', 0.3, 0.8]);
          }
          return anim;
        },
      ],
      zigg: [
        'Đài bậc đá',
        (k, o) => {
          const c = o.c,
            s = o.s,
            n = 5 + o.st;
          for (let i = 0; i < n; i++) {
            const w = (8.4 - i * (6.4 / n)) * s;
            k.add(B(w, 1.1, w, 0.08), i % 2 ? c.w : c.t, 0, i * 1.1, 0);
            if (o.st >= 2) k.add(Bc(w * 0.96, 0.1, w * 0.96, 0.02), c.g, 0, i * 1.1 + 1.08, 0, { lit: true });
          }
          for (let i = 0; i < n * 3; i++) k.add(B(1.4, 0.37, 0.5, 0.03), c.r, 0, i * 0.3667, 4.2 * s - i * ((3.2 * s) / (n * 3)) + 0.25);
          const y = n * 1.1;
          k.add(B(1.8, 1.6, 1.8, 0.1), c.w, 0, y, 0);
          k.add(K.cone(1.5, 1.4, 4), c.r, 0, y + 1.6, 0, { rot: [0, Math.PI / 4, 0] });
          k.add(K.cone(0.4, 0.9, 5), '#ff9a2e', 0, y + 3, 0, { glow: true });
          return { smoke: [[0, y + 3.6, 0, 0.5]] };
        },
      ],
    },
    /* ===== Tuyết Trắng ===== */
    tundra: {
      icespire: [
        'Cung chóp băng',
        (k, o) => {
          const c = o.c,
            s = o.s;
          drum(k, c.t, 4, 0.5, 0, 8);
          for (let i = 0; i < 7; i++) {
            const a = (i / 7) * TAU,
              r = i ? 2.4 : 0,
              h = (i ? 5 + ((i * 3) % 4) : 11) * s;
            k.add(oct(i ? 0.9 : 1.5, h / 2, i ? 0.9 : 1.5), i % 2 ? c.w : c.r, Math.cos(a) * r, h / 2 + 0.3, Math.sin(a) * r, {
              rot: [0, a, 0],
            });
          }
          k.add(Bc(1, 1.6, 0.2, 0.05), c.t, 0, 1.1, 1.5);
          lights(k, o, 1.3, 2.4, 6, 4);
          const sp = halo(k, o, 3, 12 * s);
          return sp ? { spin: [sp], pulse: true } : null;
        },
      ],
      harp: [
        'Đàn hạc cực quang',
        (k, o) => {
          const c = o.c,
            s = o.s,
            anim = { pulse: true };
          for (let i = 0; i < 4; i++) k.add(arch((4.6 - i * 0.9) * s, 0.26), i % 2 ? c.w : c.r, 0, 0, (i - 1.5) * 1.1);
          for (let i = -4; i <= 4; i++)
            k.add(
              Bc(0.06, 2 + (4 - Math.abs(i)) * 0.9 * s, 0.06, 0.01),
              ['#7ff0c8', '#a0c8ff', '#c8a8ff'][(i + 4) % 3],
              i * 0.8 * s,
              1 + (4 - Math.abs(i)) * 0.45 * s,
              0,
              { glow: true },
            );
          k.add(Bc(8.6 * s, 0.4, 4.4, 0.1), c.t, 0, 0.2, 0);
          return anim;
        },
      ],
      igloos: [
        'Cụm nhà băng',
        (k, o) => {
          const c = o.c,
            s = o.s,
            dome = (r) => new (THREE().SphereGeometry)(r, 9, 5, 0, TAU, 0, Math.PI / 2);
          for (const [x, z, r] of [
            [0, 0, 2.8],
            [3, 1.6, 1.7],
            [-2.9, 1.9, 1.8],
            [0.6, -3, 1.6],
          ]) {
            k.add(dome(r * s), c.w, x * s, 0, z * s);
            k.add(B(0.9, 1, 1.2, 0.2), c.r, x * s, 0, (z + r * 0.85) * s);
            k.add(Bc(0.45, 0.6, 0.1, 0.03), o.st >= 1 ? c.g : '#3a4450', x * s, 0.5, (z + r * 0.85) * s + 0.62, { lit: o.st >= 1 });
          }
          k.add(K.post(0.25, 1.2, 6), c.t, 0, 2.7 * s, 0);
          for (let i = 0; i < 4; i++)
            k.add(torus((2.8 - i * 0.5) * s * Math.cos(i * 0.33), 0.05), c.r, 0, 2.8 * s * Math.sin(i * 0.33) + 0.05, 0);
          return { smoke: [[0, 4 * s, 0, 0.5]] };
        },
      ],
      mammoth: [
        'Sảnh xương voi',
        (k, o) => {
          const c = o.c,
            s = o.s;
          for (let i = 0; i < 7; i++) {
            const z = (i - 3) * 1.25;
            k.add(arch((3.4 - Math.abs(i - 3) * 0.25) * s, 0.2), '#f2ead6', 0, 0, z);
          }
          k.add(Bc(0.3, 0.3, 8.4, 0.08), '#f2ead6', 0, 3.5 * s, 0);
          for (const sx of [-1, 1]) {
            k.add(new (THREE().TorusGeometry)(2.6 * s, 0.24, 5, 10, 1.9).rotateY(sx * 1.1), '#fff8e8', sx * 1.5, 0.4, 4.6, {
              rot: [0, 0, sx > 0 ? 0 : 0],
            });
          }
          k.add(B(4.2 * s, 2.2, 6.6, 0.15), o.st >= 2 ? '#bfe3f2' : c.w, 0, 0, 0);
          k.add(Bc(1, 1.5, 0.2, 0.05), c.t, 0, 0.75, 3.35);
          if (o.st >= 1) for (const sx of [-1, 1]) k.add(Bc(0.08, 0.6, 0.6, 0.02), c.g, sx * 2.12 * s, 1.3, 0, { lit: true });
          return { smoke: [[0, 4.2 * s, -2, 0.6]] };
        },
      ],
      lighthouse: [
        'Hải đăng băng',
        (k, o) => {
          const c = o.c,
            s = o.s,
            h = 10 * s;
          steps(k, c.t, 3, 2, 0.5, 8);
          for (let i = 0; i < 5; i++) k.add(K.post(1.9 - i * 0.22, h / 5, 8, 1.7 - i * 0.22), i % 2 ? c.r : c.w, 0, 1 + i * (h / 5), 0);
          k.add(K.post(1.6, 0.25, 8, 1.6), c.t, 0, h + 1, 0);
          k.add(K.post(0.9, 1.4, 8, 0.9), c.g, 0, h + 1.25, 0, { glow: true });
          k.add(K.cone(1.3, 1.3, 8), c.r, 0, h + 2.65, 0);
          const b = k.sub('beam', [0, h + 1.9, 0]);
          b.add(Bc(0.5, 0.3, 9, 0.02), c.g, 0, 0, 4.5, { glow: true });
          for (let i = 0; i < 5; i++)
            k.add(K.cone(0.25, 1.2 + (i % 2) * 0.6, 5), '#e6f6fb', Math.cos(i * 1.26) * 1.75, h + 0.9, Math.sin(i * 1.26) * 1.75, {
              rot: [Math.PI, 0, 0],
            });
          return { spin: [['beam', 'y', 0.6]] };
        },
      ],
      sail: [
        'Tháp buồm gió',
        (k, o) => {
          const c = o.c,
            s = o.s,
            h = 9 * s;
          steps(k, c.t, 2.6, 2, 0.5, 8);
          k.add(K.post(0.5, h, 7, 0.3), c.t, 0, 1, 0);
          const t = k.sub('sails', [0, h * 0.62 + 1, 0]);
          for (let i = 0; i < 3; i++) {
            const a = (i / 3) * TAU;
            t.add(Bc(0.1, h * 0.6, 3 * s, 0.03), i % 2 ? c.w : c.r, Math.cos(a) * 1.6 * s, 0, Math.sin(a) * 1.6 * s, {
              rot: [0, -a, 0.12],
              glow: o.st === 3,
            });
            t.add(Bc(3.2 * s, 0.1, 0.1, 0.02), c.t, Math.cos(a) * 1.6 * s, h * 0.28, Math.sin(a) * 1.6 * s, { rot: [0, -a, 0] });
          }
          k.add(B(2.2, 1.6, 2.2, 0.1), c.w, 0, 1, 0);
          lights(k, o, 1.12, 1.8, 1.9, 4);
          return { spin: [['sails', 'y', 0.45]] };
        },
      ],
      icering: [
        'Vòng cầu băng',
        (k, o) => {
          const c = o.c,
            s = o.s,
            r = 4.2 * s;
          k.add(new (THREE().TorusGeometry)(r, 0.5, 6, 22), c.w, 0, r + 0.3, 0);
          k.add(new (THREE().TorusGeometry)(r * 0.72, 0.16, 5, 18), c.r, 0, r + 0.3, 0, { glow: o.st >= 2 });
          for (const sx of [-1, 1])
            k.add(
              K.lathe(
                [
                  [1.6, 0],
                  [1, 1.4],
                  [0.7, 2.4],
                ],
                6,
              ),
              c.t,
              sx * r * 0.62,
              0,
              0,
            );
          const g = k.sub('gem', [0, r + 0.3, 0]);
          g.add(oct(0.9, 1.5, 0.9), c.g, 0, 0, 0, { glow: true });
          return { spin: [['gem', 'y', 0.5]], bob: [['gem', 0.3, 0.7]], pulse: true };
        },
      ],
      spring: [
        'Suối nước nóng',
        (k, o) => {
          const c = o.c,
            s = o.s;
          drum(k, c.t, 4.4 * s, 0.6, 0, 10);
          drum(k, '#7fd0e0', 3.7 * s, 0.1, 0.56, 10);
          for (let i = 0; i < 9; i++) {
            const a = (i / 9) * TAU;
            k.add(K.ball(0.7 + (i % 3) * 0.2, 0), i % 2 ? c.w : '#c8d4da', Math.cos(a) * 4.3 * s, 0.5, Math.sin(a) * 4.3 * s);
          }
          k.add(B(2.4, 2, 2, 0.1), c.w, 0, 0, -4.4 * s);
          k.add(K.roof(3.2, 1.1, 2.8, 0.08, 2.6, 0.3, 0.4), c.r, 0, 2, -4.4 * s);
          if (o.st >= 1) k.add(Bc(0.6, 0.6, 0.06, 0.02), c.g, 0, 1.1, -4.4 * s + 1.03, { lit: true });
          const sp = halo(k, o, 2.6, 3.4);
          return {
            smoke: [
              [0, 0.9, 0, 1.2],
              [1.6, 0.9, 1.2, 0.8],
              [-1.5, 0.9, -1, 0.8],
            ],
            spin: sp ? [sp] : [],
          };
        },
      ],
    },
    /* ===== Cửa Sóng ===== */
    coast: {
      shell: [
        'Nhà hát vỏ sò',
        (k, o) => {
          const c = o.c,
            s = o.s;
          drum(k, c.t, 4.6 * s, 0.5, 0, 12);
          for (let i = 0; i < 5; i++) {
            const r = (4.4 - i * 0.7) * s;
            k.add(new (THREE().SphereGeometry)(r, 8, 5, 0, Math.PI, 0, Math.PI / 2), i % 2 ? c.r : c.w, 0, 0.5, -1.6 + i * 1.0, {
              rot: [-0.25 - i * 0.12, 0, 0],
            });
          }
          k.add(K.post(1.8, 0.3, 10, 1.8), c.t, 0, 0.5, 2.4);
          lights(k, o, 1.8, 1.2, 1.3, 6);
          const sp = halo(k, o, 3, 6.4 * s);
          return sp ? { spin: [sp] } : null;
        },
      ],
      twist: [
        'Hải đăng vặn',
        (k, o) => {
          const c = o.c,
            s = o.s,
            n = 10 + o.st * 2;
          steps(k, c.t, 3, 2, 0.5, 8);
          for (let i = 0; i < n; i++) {
            const w = (2.9 - i * (1.5 / n)) * s;
            k.add(B(w, 1.02, w, 0.1), i % 2 ? c.w : c.r, 0, 1 + i, 0, { rot: [0, i * 0.26, 0] });
          }
          const y = n + 1;
          k.add(K.post(1.5, 0.25, 8, 1.5), c.t, 0, y, 0);
          k.add(K.post(0.9, 1.3, 8, 0.9), c.g, 0, y + 0.25, 0, { glow: true });
          k.add(K.cone(1.3, 1.2, 8), c.r, 0, y + 1.55, 0);
          const b = k.sub('beam', [0, y + 0.9, 0]);
          b.add(Bc(0.5, 0.3, 9, 0.02), c.g, 0, 0, 4.5, { glow: true });
          return { spin: [['beam', 'y', 0.6]] };
        },
      ],
      stilt: [
        'Đình nhà sàn',
        (k, o) => {
          const c = o.c,
            s = o.s;
          for (const [x, z] of [
            [-2.6, -2],
            [2.6, -2],
            [-2.6, 2],
            [2.6, 2],
            [0, -2],
            [0, 2],
          ])
            k.add(K.post(0.2, 3 * s, 5), c.t, x, 0, z);
          k.add(B(6.6, 0.3, 5.4, 0.05), c.t, 0, 3 * s, 0);
          k.add(B(4.6, 2, 3.6, 0.1), c.w, 0, 3 * s + 0.3, 0);
          k.add(K.roof(7, 1.2, 5.8, 0.08, 4.8, 0.6, 0.7), c.r, 0, 3 * s + 2.3, 0);
          k.add(K.roof(4, 1.2, 3, 0.08, 0.6, 0.3, 0.6), c.r, 0, 3 * s + 3.5, 0);
          for (let i = 0; i < 6; i++) k.add(B(0.9, 0.12, 0.5, 0.02), c.t, 3.6 + i * 0.35, 3 * s - i * ((3 * s) / 6), 0);
          if (o.st >= 1) for (const sx of [-1, 1]) k.add(Bc(0.6, 0.7, 0.06, 0.02), c.g, sx * 1.2, 3 * s + 1.4, 1.83, { lit: true });
          return null;
        },
      ],
      whale: [
        'Vòm xương cá voi',
        (k, o) => {
          const c = o.c,
            s = o.s;
          for (let i = 0; i < 8; i++) {
            const z = (i - 3.5) * 1.2,
              r = (3.6 - Math.abs(i - 3) * 0.3) * s;
            k.add(arch(r, 0.2), '#f6efe0', 0, 0, z);
          }
          k.add(Bc(0.4, 0.4, 10.4, 0.1), '#f6efe0', 0, 3.6 * s, 0);
          k.add(
            K.lathe(
              [
                [0.2, 0],
                [1.3, 1.5],
                [1.5, 3.2],
                [0.6, 4.6],
              ],
              7,
            ),
            '#fffaf0',
            0,
            0.9,
            5.4,
            { rot: [Math.PI / 2 - 0.25, 0, 0] },
          );
          const anim = { bob: [] };
          for (let i = 0; i < 4; i++) {
            const n = 'lamp' + i,
              q = k.sub(n, [0, 3.1 * s, (i - 1.5) * 2.2]);
            q.add(Bc(0.04, 0.8, 0.04, 0.01), c.t, 0, -0.4, 0);
            q.add(K.ball(0.3, 1), c.g, 0, -0.95, 0, { glow: true });
            anim.bob.push([n, 0.08, 0.9 + i * 0.2]);
          }
          return anim;
        },
      ],
      coral: [
        'Tháp san hô',
        (k, o) => {
          const c = o.c,
            s = o.s,
            cols = ['#ff8f7a', '#ffb36b', '#e97ab0', c.r, c.g];
          drum(k, c.t, 3, 0.5, 0, 9);
          const br = (x, y, z, h, a, t, d) => {
            k.add(K.post((0.5 * h) / 5, h, 6, (0.3 * h) / 5), cols[d % 5], x, y, z, {
              rot: [Math.sin(a) * t, 0, -Math.cos(a) * t],
              glow: o.st === 3 && d > 1,
            });
            if (d < 2 + (o.st > 1 ? 1 : 0)) {
              const nx = x + Math.cos(a) * Math.sin(t) * h,
                ny = y + Math.cos(t) * h,
                nz = z + Math.sin(a) * Math.sin(t) * h;
              for (const da of [-0.9, 0.9, 2.6]) br(nx, ny, nz, h * 0.62, a + da, 0.55, d + 1);
            } else
              k.add(
                K.ball((0.35 * h) / 3, 0),
                cols[(d + 2) % 5],
                x + Math.cos(a) * Math.sin(t) * h,
                y + Math.cos(t) * h,
                z + Math.sin(a) * Math.sin(t) * h,
                { glow: o.st >= 2 },
              );
          };
          br(0, 0.5, 0, 5 * s, 0, 0, 0);
          return { pulse: o.st >= 2 };
        },
      ],
      ship: [
        'Nhà thuyền buồm',
        (k, o) => {
          const c = o.c,
            s = o.s;
          for (const x of [-2.4, 0, 2.4]) k.add(B(0.6, 1.2, 2.4, 0.08), c.t, x, 0, 0);
          k.add(
            K.lathe(
              [
                [0.3, 0],
                [2.2, 0.6],
                [2.5, 2],
              ],
              8,
            ),
            c.w,
            0,
            1.2,
            0,
            { sc: [1.9 * s, 1, 1] },
          );
          k.add(B(3 * s, 1.5, 2.6, 0.1), c.w, -0.6, 3.2, 0);
          k.add(K.roof(3.6 * s, 0.8, 3.2, 0.06, 3 * s, 0.4), c.r, -0.6, 4.7, 0);
          k.add(K.post(0.16, 8 * s, 5), c.t, 0.6, 3.2, 0);
          const anim = { sway: [] };
          for (let i = 0; i < 2; i++) {
            const n = 'sail' + i,
              q = k.sub(n, [0.6, 5.6 + i * 2.8 * s, 0]);
            q.add(Bc(0.08, 2.4 * s, (3.8 - i * 1.2) * s, 0.02), i ? c.r : '#fff8e8', 0.2, 0, 0, { glow: o.st === 3 });
            anim.sway.push([n, 'y', 0.18, 0.5 + i * 0.2]);
          }
          if (o.st >= 1)
            for (const z of [-1.31, 1.31])
              for (let i = -1; i <= 1; i++) k.add(Bc(0.5, 0.5, 0.06, 0.02), c.g, -0.6 + i * 0.9 * s, 4, z, { lit: true });
          return anim;
        },
      ],
      tide: [
        'Đồng hồ thuỷ triều',
        (k, o) => {
          const c = o.c,
            s = o.s,
            r = 3.4 * s;
          steps(k, c.t, 3.4, 2, 0.5, 10);
          for (const sx of [-1, 1]) k.add(B(0.8, r + 2, 0.8, 0.1), c.w, sx * (r + 0.6), 1, 0);
          k.add(K.post(r, 0.5, 20, r), c.w, 0, r + 2.2, 0, { rot: [Math.PI / 2, 0, 0] });
          k.add(new (THREE().TorusGeometry)(r, 0.22, 6, 24), c.r, 0, r + 2.2, 0);
          for (let i = 0; i < 12; i++) {
            const a = (i / 12) * TAU;
            k.add(K.ball(0.16), c.g, Math.cos(a) * r * 0.85, r + 2.2 + Math.sin(a) * r * 0.85, 0.32, { lit: o.st >= 1, glow: o.st === 3 });
          }
          const h = k.sub('hand', [0, r + 2.2, 0.4]);
          h.add(Bc(0.2, r * 0.8, 0.1, 0.03), c.t, 0, r * 0.35, 0);
          const m = k.sub('moon', [0, r + 2.2, 0.5]);
          m.add(K.ball(0.4, 1), '#fff6d8', r * 0.55, 0, 0, { glow: true });
          return {
            spin: [
              ['hand', 'z', 0.4],
              ['moon', 'z', -0.15],
            ],
          };
        },
      ],
      bubble: [
        'Vòm bong bóng',
        (k, o) => {
          const c = o.c,
            s = o.s,
            anim = { bob: [] };
          drum(k, c.t, 4.2 * s, 0.4, 0, 12);
          for (const [x, z, r] of [
            [0, 0, 2.6],
            [2.8, 1, 1.6],
            [-2.6, 1.6, 1.7],
            [0.4, -2.9, 1.5],
          ]) {
            k.add(new (THREE().SphereGeometry)(r * s, 10, 6, 0, TAU, 0, Math.PI / 2), o.st >= 2 ? '#bfeef2' : c.w, x * s, 0.4, z * s);
            k.add(torus(r * s, 0.1), c.r, x * s, 0.45, z * s);
            if (o.st >= 1) k.add(K.ball(0.4, 1), c.g, x * s, 0.9, z * s, { lit: true });
          }
          for (let i = 0; i < 5; i++) {
            const a = i * 1.26,
              n = 'bub' + i,
              q = k.sub(n, [Math.cos(a) * 2.4 * s, 4 + i * 0.9, Math.sin(a) * 2.4 * s]);
            q.add(K.ball(0.45 + (i % 2) * 0.2, 1), i % 2 ? c.g : '#dffaff', 0, 0, 0, { glow: true });
            anim.bob.push([n, 0.4, 0.5 + i * 0.12]);
          }
          return anim;
        },
      ],
    },
    /* ===== Cát Hồng ===== */
    desert: {
      badgir: [
        'Tháp đón gió',
        (k, o) => {
          const c = o.c,
            s = o.s,
            h = 9 * s;
          k.add(B(4.6, 2.6, 4.6, 0.12), c.w, 0, 0, 0);
          k.add(
            K.lathe(
              [
                [2.6, 0],
                [2.4, 0.6],
                [0.3, 1.5],
              ],
              8,
            ),
            c.r,
            0,
            2.6,
            0,
          );
          k.add(B(2, h, 2, 0.08), c.w, 1.2, 0, -1.2);
          for (let i = 0; i < 4; i++) {
            const a = (i * Math.PI) / 2;
            for (let j = -1; j <= 1; j++)
              k.add(
                Bc(0.3, 2, 0.1, 0.02),
                '#3a2a20',
                1.2 + Math.cos(a) * 1.02 + Math.sin(a) * j * 0.5,
                h - 1.4,
                -1.2 + Math.sin(a) * 1.02 + Math.cos(a) * j * 0.5,
                { rot: [0, -a + Math.PI / 2, 0] },
              );
          }
          k.add(B(2.4, 0.3, 2.4, 0.05), c.t, 1.2, h, -1.2);
          k.add(Bc(0.9, 1.5, 0.1, 0.03), c.t, -0.6, 0.75, 2.33);
          if (o.st >= 1) for (const x of [-1.6, 0.6]) k.add(Bc(0.5, 0.6, 0.06, 0.02), c.g, x, 1.7, 2.33, { lit: true });
          const sp = halo(k, o, 1.8, h + 1.6);
          return sp ? { spin: [sp] } : null;
        },
      ],
      stepwell: [
        'Giếng bậc',
        (k, o) => {
          const c = o.c,
            s = o.s,
            n = 4;
          for (let i = 0; i < n; i++) {
            const w = (9 - i * 1.7) * s,
              t = 0.85 * s;
            for (const [x, z, a, b] of [
              [0, 1, 1, 0],
              [0, -1, 1, 0],
              [1, 0, 0, 1],
              [-1, 0, 0, 1],
            ])
              k.add(B(a ? w : t, (n - i) * 0.7, b ? w : t, 0.05), i % 2 ? c.w : c.t, (x * (w - t)) / 2, 0, (z * (w - t)) / 2);
          }
          k.add(B(2.2 * s, 0.25, 2.2 * s, 0.03), '#3fb0b8', 0, 0, 0, { ao: false, glow: o.st === 3 });
          for (const [x, z] of [
            [-1, -1],
            [1, -1],
            [-1, 1],
            [1, 1],
          ]) {
            k.add(K.post(0.35, 3, 6), c.w, x * 4.1 * s, n * 0.7, z * 4.1 * s);
            k.add(
              K.lathe(
                [
                  [0.6, 0],
                  [0.5, 0.4],
                  [0.1, 0.9],
                ],
                7,
              ),
              c.r,
              x * 4.1 * s,
              n * 0.7 + 3,
              z * 4.1 * s,
            );
            if (o.st >= 1) k.add(K.ball(0.18), c.g, x * 4.1 * s, n * 0.7 + 2.4, z * 4.1 * s, { lit: true });
          }
          return null;
        },
      ],
      archpalace: [
        'Cung vòm sa thạch',
        (k, o) => {
          const c = o.c,
            s = o.s;
          k.add(B(8.4 * s, 4.2, 3.4, 0.12), c.w, 0, 0, 0);
          for (let i = -1; i <= 1; i++) {
            k.add(arch(1.05, 0.22), c.t, i * 2.6 * s, 1.5, 1.72);
            k.add(Bc(1.9, 1.5, 0.1, 0.02), '#3a2a20', i * 2.6 * s, 0.75, 1.69);
            k.add(Bc(1.5, 0.9, 0.08, 0.02), o.st >= 1 ? c.g : '#3a2a20', i * 2.6 * s, 1.75, 1.7, { lit: o.st >= 1 });
          }
          for (const x of [-3, 0, 3]) k.add(new (THREE().SphereGeometry)(x ? 1.2 : 1.8, 9, 5, 0, TAU, 0, Math.PI / 2), c.r, x * s, 4.2, 0);
          for (const sx of [-1, 1]) {
            k.add(K.post(0.5, 7.5 * s, 7, 0.4), c.w, sx * 4.6 * s, 0, 0);
            k.add(
              K.lathe(
                [
                  [0.7, 0],
                  [0.6, 0.5],
                  [0.1, 1.3],
                ],
                7,
              ),
              c.r,
              sx * 4.6 * s,
              7.5 * s,
              0,
            );
          }
          k.add(K.post(0.05, 1.4, 4), c.g, 0, 6, 0, { glow: o.st === 3 });
          return null;
        },
      ],
      mirror: [
        'Tháp gương mặt trời',
        (k, o) => {
          const c = o.c,
            s = o.s,
            h = 10 * s;
          k.add(
            K.lathe(
              [
                [1.8, 0],
                [0.9, h * 0.6],
                [1.1, h],
              ],
              8,
            ),
            c.w,
            0,
            0,
            0,
          );
          k.add(K.ball(1.4, 1), '#fff2c0', 0, h + 1, 0, { glow: true });
          const r = k.sub('mirrors', [0, 0, 0]);
          for (let i = 0; i < 9; i++) {
            const a = (i / 9) * TAU;
            r.add(K.post(0.08, 1.4, 4), c.t, Math.cos(a) * 4 * s, 0, Math.sin(a) * 4 * s);
            r.add(Bc(1.3, 1, 0.08, 0.02), o.st >= 2 ? '#cfeeff' : '#e8d8a8', Math.cos(a) * 4 * s, 1.8, Math.sin(a) * 4 * s, {
              rot: [-0.5, -a + Math.PI / 2, 0, 'YXZ'],
              glow: o.st === 3,
            });
          }
          lights(k, o, 1.2, 2, h - 3, 4);
          return { spin: [['mirrors', 'y', 0.06]], pulse: true };
        },
      ],
      caravan: [
        'Quán trọ vòm',
        (k, o) => {
          const c = o.c,
            s = o.s,
            w = 7.6 * s;
          for (const [x, z, a] of [
            [0, 1, 0],
            [0, -1, 0],
            [1, 0, 1],
            [-1, 0, 1],
          ])
            k.add(B(a ? 1.6 : w, 2.6, a ? w : 1.6, 0.1), c.w, (x * (w - 1.6)) / 2, 0, (z * (w - 1.6)) / 2);
          for (const [x, z] of [
            [-1, -1],
            [1, -1],
            [-1, 1],
            [1, 1],
          ]) {
            k.add(K.post(1.2, 3.4, 8, 1.1), c.w, (x * (w - 1.6)) / 2, 0, (z * (w - 1.6)) / 2);
            k.add(new (THREE().SphereGeometry)(1.25, 8, 5, 0, TAU, 0, Math.PI / 2), c.r, (x * (w - 1.6)) / 2, 3.4, (z * (w - 1.6)) / 2);
          }
          k.add(arch(1.1, 0.25), c.t, 0, 1.2, w / 2 + 0.02);
          k.add(Bc(2, 1.2, 0.3, 0.02), '#3a2a20', 0, 0.6, w / 2 - 0.1);
          k.add(
            K.lathe(
              [
                [0.9, 0],
                [1.1, 0.4],
                [0.5, 0.7],
              ],
              8,
            ),
            c.t,
            0,
            0,
            0,
          );
          k.add(K.ball(0.3), '#3fb0b8', 0, 0.9, 0, { glow: o.st === 3 });
          if (o.st >= 1)
            for (let i = -2; i <= 2; i++) if (i) k.add(Bc(0.45, 0.6, 0.06, 0.02), c.g, i * 1.2 * s, 1.6, w / 2 + 0.01, { lit: true });
          return null;
        },
      ],
      obelisk: [
        'Đôi trụ mặt trời',
        (k, o) => {
          const c = o.c,
            s = o.s,
            h = 9 * s;
          steps(k, c.t, 4.4, 2, 0.45, 4);
          for (const sx of [-1, 1]) {
            k.add(K.post(0.95, h, 4, 0.5), c.w, sx * 2.6, 0.9, 0, { rot: [0, Math.PI / 4, 0] });
            k.add(K.cone(0.6, 1.1, 4), o.st >= 2 ? c.g : c.r, sx * 2.6, h + 0.9, 0, { rot: [0, Math.PI / 4, 0], glow: o.st >= 2 });
          }
          const d = k.sub('sun', [0, h * 0.72, 0]);
          d.add(K.post(1.5, 0.25, 16, 1.5), '#ffd27a', 0, 0, 0, { rot: [Math.PI / 2, 0, 0], glow: true });
          for (let i = 0; i < 8; i++) {
            const a = (i / 8) * TAU;
            d.add(Bc(0.2, 0.9, 0.1, 0.02), '#ffb347', Math.cos(a) * 2.1, Math.sin(a) * 2.1, 0, {
              rot: [0, 0, a - Math.PI / 2],
              glow: true,
            });
          }
          return { spin: [['sun', 'z', 0.15]], bob: [['sun', 0.25, 0.5]] };
        },
      ],
      mud: [
        'Tháp đất gai',
        (k, o) => {
          const c = o.c,
            s = o.s;
          k.add(B(6.4 * s, 3.6, 4, 0.2), c.w, 0, 0, 0);
          for (const x of [-2.4, 0, 2.4]) {
            const h = (x ? 6.5 : 9) * s;
            k.add(
              K.lathe(
                [
                  [1.3, 0],
                  [1.1, h * 0.7],
                  [0.4, h],
                ],
                7,
              ),
              c.w,
              x * s,
              0,
              0.6,
            );
            for (let y = 1.5; y < h - 0.5; y += 1.3)
              for (let i = 0; i < 6; i++) {
                const a = (i / 6) * TAU + y;
                k.add(Bc(0.9, 0.1, 0.1, 0.02), c.t, x * s + Math.cos(a) * 1.3, y, 0.6 + Math.sin(a) * 1.3, { rot: [0, -a, 0] });
              }
            k.add(K.ball(0.3, 0), o.st >= 2 ? c.g : '#f2ead6', x * s, h + 0.2, 0.6, { glow: o.st >= 2 });
          }
          k.add(Bc(1, 1.6, 0.1, 0.03), '#3a2a20', 0, 0.8, 2.03);
          return null;
        },
      ],
      oasis: [
        'Vòm kính ốc đảo',
        (k, o) => {
          const c = o.c,
            s = o.s,
            r = 4 * s;
          drum(k, c.t, r + 0.3, 0.5, 0, 12);
          drum(k, '#3fb0b8', r * 0.55, 0.08, 0.5, 12);
          for (let i = 0; i < 6; i++) {
            const a = (i / 6) * Math.PI;
            k.add(arch(r, 0.1), o.st >= 2 ? c.g : c.t, 0, 0.5, 0, { rot: [0, a, 0], glow: o.st === 3 });
          }
          for (const y of [0.35, 0.7]) k.add(torus(r * Math.cos(y), 0.07), c.t, 0, 0.5 + r * Math.sin(y), 0);
          for (let i = 0; i < 5; i++) {
            const a = i * 1.26,
              x = Math.cos(a) * r * 0.6,
              z = Math.sin(a) * r * 0.6;
            k.add(K.post(0.14, 2.6, 5), '#8a6a46', x, 0.5, z, { rot: [Math.sin(a) * 0.15, 0, -Math.cos(a) * 0.15] });
            k.add(K.ball(1, 0), '#5f9f4a', x + Math.cos(a) * 0.3, 3.3, z + Math.sin(a) * 0.3, { sc: [1, 0.35, 1] });
          }
          const sp = halo(k, o, r * 0.7, r + 1.6);
          return sp ? { spin: [sp], pulse: true } : null;
        },
      ],
    },
  };
  /* ---------- Mỗi thời chọn kiểu nào, đặt ở đâu ---------- */
  // bốn chỗ vòng ngoài (góc tính từ phía trước), lệch khỏi các món ngoài làng đã có (render/build/plains/outer.js SPOTS)
  const SLOTS = [1.78, -1.82, 2.95, 0.88];
  // kiểu của chỗ j ở thời lv: xoay vòng tám kiểu của đảo, hai thời liền nhau ở cùng một chỗ luôn khác kiểu
  const pickAt = (names, lv, j) => names[(lv * 3 + j * 2 + (j === 3 ? 1 : 0)) % names.length];
  function addTo(E, lv, key) {
    const set = M[key];
    if (!set) return;
    const names = Object.keys(set),
      st = stage(lv),
      n = lv <= 3 ? 3 : 4,
      used = new Set();
    let at = Math.max(1, E.pieces.findIndex((x) => x.kind === 'hall') + 3);
    for (let j = 0; j < n; j++) {
      let name = pickAt(names, lv, j);
      for (let q = 0; used.has(name) && q < names.length; q++) name = names[(names.indexOf(name) + 1) % names.length];
      used.add(name);
      const kind = 'mv_' + name,
        [title, fn] = set[name];
      E.BUILD[kind] = (k, o) => fn(k, Object.assign(Object.create(o), { c: colOf(key, st), st, s: 0.82 + lv * 0.03 }));
      E.NAME[kind] = title;
      E.pieces.splice(Math.min(at, E.pieces.length), 0, {
        kind,
        x: 0,
        z: 0,
        lv,
        outer: 'forest',
        a: SLOTS[j],
        slot: 'mv' + j,
        clear: 5,
        marvel: true,
      });
      at += 5;
    }
  }
  BK.Marvels3D = { addTo, M, stage, SLOTS };
  // Lúa Vàng: bố cục 12 thời đã dựng xong ở render/build/plains/ (tệp này tải sau wonders.js)
  if (BK.Plains3D && BK.Plains3D.ERA) for (let lv = 1; lv <= 12; lv++) if (BK.Plains3D.ERA[lv]) addTo(BK.Plains3D.ERA[lv], lv, 'plains');
})(typeof self !== 'undefined' ? self : globalThis);
