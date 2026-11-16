/* Bể Kính · render/blocks/parts.js · Mảnh dùng chung cho các khối công trình (H trong render/blocks/shapes/*.js)
 * Mảnh nào hai loại khối trở lên cùng dùng thì để ở đây, mảnh riêng của một loại thì để trong tệp hình dáng của loại đó.
 *   PLINTH              độ cao bệ dưới mọi khối (hình bệ theo đảo: render/blocks/style.js plinth)
 *   flag, emblem        cột cờ và lá cờ màu cờ của đảo; ký hiệu đảo trên lá cờ (P.flag: render/blocks/isles/<đảo>.js)
 *   door, win           cửa chính (khung, lanh tô, cánh theo bậc, tay nắm, bậc thềm); cửa sổ (ô lõm, kính, khung, song, bậu,
 *                       lanh tô, cánh chớp); bậc tương lai trở lên: kính, khe sáng
 *   porch               hiên trước cửa: sàn, cột, xà chéo, mái hiên, lan can, bậc lên
 *   crenels             hàng răng tường (lỗ châu mai)
 *   lightBox            ô sáng, dải đèn: bậc tương lai thì phát sáng thật
 *   rail                lan can dọc trục x: trụ đầu có mũ, tay vịn tròn, thanh dưới, song tiện
 *   guard               lính gác đứng (cao ~1,25, quay mặt về +z): quần áo, mũ, vũ khí theo bậc; đảo đổi áo và kiểu mũ qua
 *                       P.S.guard[t] = { coat, legs, hat, form } (form: cone, helm, cap, visor, hood, turban, feather, band)
 *   torus               vòng tròn nằm ngang (vành sáng, bánh xe) dựng bằng three.js
 *   barrel, crate       thùng gỗ, hòm (đồ đạc sân lính, kho, cổng)
 *   banner, torch       cờ treo dọc áp tường (màu và ký hiệu đảo), đuốc
 * Cần: three.js, render/build/kit3d.js, render/blocks/blocks.js. */
(function (root) {
  const BK = root.BK;
  const K = () => BK.BuildKit;
  const PLINTH = 0.22; // (đơn vị) bệ cao chừng này; mọi khối dựng từ mặt bệ
  // quần áo lính gác theo bậc: áo, quần, mũ, da
  const GUARD = [
    { coat: '#8a6a3a', legs: '#4d3a22', hat: '#d8bf78', skin: '#e0b48a' },
    { coat: '#8c2a22', legs: '#3b3530', hat: '#8e9196', skin: '#e0b48a' },
    { coat: '#4a6040', legs: '#2f3a2c', hat: '#4a6040', skin: '#e0b48a' },
    { coat: '#232a36', legs: '#161b24', hat: '#2e3646', skin: '#d9b28c' },
    { coat: '#f2ecff', legs: '#b8a8e0', hat: '#ffffff', skin: '#e8c4a0' },
  ];
  // mũ lính theo kiểu: nón lá, mũ sắt, mũ lính, kính sáng, mũ lông, khăn quấn, mũ cắm lông, khăn buộc trán
  function hat(k, B, P, c, form, x, y, z) {
    if (form === 'cone') k.add(B.cone(0.3, 0.16, 8), c.hat, x, y + 1.2, z);
    else if (form === 'helm') k.add(B.lathe([[0.18, 0], [0.19, 0.1], [0.12, 0.22], [0.01, 0.3]], 8), c.hat, x, y + 1.12, z);
    else if (form === 'cap') {
      k.add(B.post(0.17, 0.14, 8), c.hat, x, y + 1.18, z);
      k.add(B.box(0.3, 0.03, 0.16, 0.01), c.hat, x, y + 1.18, z + 0.14);
    } else if (form === 'visor') {
      k.add(B.post(0.18, 0.2, 8), c.hat, x, y + 1.08, z);
      k.add(B.box(0.3, 0.07, 0.04, 0.01), P.glow, x, y + 1.14, z + 0.16, { glow: true });
    } else if (form === 'hood') k.add(B.ball(0.22, 1), c.hat, x, y + 1.16, z - 0.03, { sc: [1, 0.9, 1] });
    else if (form === 'turban') {
      k.add(B.lathe([[0.18, 0], [0.21, 0.08], [0.17, 0.2], [0.01, 0.24]], 8), c.hat, x, y + 1.14, z);
      k.add(B.ball(0.04, 0), P.accent, x, y + 1.26, z + 0.17);
    } else if (form === 'feather') {
      k.add(B.post(0.17, 0.12, 8), c.hat, x, y + 1.18, z);
      k.add(B.cone(0.04, 0.4, 4), P.accent, x + 0.12, y + 1.25, z - 0.05, { rot: [0, 0, -0.4] });
    } else k.add(B.post(0.175, 0.07, 8), c.hat, x, y + 1.17, z); // band: khăn buộc trán
  }
  const flagColor = (P) => (P.flag && P.flag.color) || P.accent;
  const H = {
    PLINTH,
    // cờ: cột và lá cờ (size: bề ngang lá cờ). Màu cờ và ký hiệu của đảo (P.flag, render/blocks/isles/<đảo>.js) không đổi theo
    // thời; đảo không khai báo thì dùng màu nhấn của bậc
    flag(k, P, x, y, z, h, size) {
      const cx = x + size / 2 + 0.04,
        cy = y + h - size * 0.36;
      k.add(K().post(0.05, h, 5), P.dark, x, y, z);
      k.add(K().ball(0.07, 0), P.metal, x, y + h + 0.03, z); // núm đầu cột
      k.add(K().box(size, size * 0.62, 0.05, 0.01), flagColor(P), cx, cy, z);
      H.emblem(k, P, cx, cy, z, size);
    },
    // ký hiệu đảo trên lá cờ (giữa ở cx, cy; w: bề ngang lá cờ): đảo vẽ bằng các nét m (toạ độ u, v tính theo bề ngang lá
    // cờ, gốc giữa lá cờ, v hướng lên). Nét dày hơn lá cờ nên thấy ở cả hai mặt.
    emblem(k, P, cx, cy, z, w) {
      const F = P.flag;
      if (!F || !F.emblem) return;
      const T = root.THREE,
        D = 0.075,
        at = (u, v) => [cx + u * w, cy + v * w, z];
      const m = {
        // tam giác đều bán kính r, mặc định đỉnh hướng lên; rot: xoay trong mặt lá cờ
        tri: (u, v, r, rot, c) => k.add(new T.CylinderGeometry(r * w, r * w, D, 3), c || F.mark, ...at(u, v), { rot: [Math.PI / 2, Math.PI + (rot || 0), 0] }),
        // bầu dục bán trục rx (ngang), ry (dọc), xoay rot trong mặt lá cờ (hạt lúa, lá)
        oval: (u, v, rx, ry, rot, c) =>
          k.add(new T.CylinderGeometry(w, w, D, 12), c || F.mark, ...at(u, v), { rot: [Math.PI / 2, rot || 0, 0], sc: [rx, 1, ry] }),
        circ: (u, v, r, c) => k.add(new T.CylinderGeometry(r * w, r * w, D, 14), c || F.mark, ...at(u, v), { rot: [Math.PI / 2, 0, 0] }),
        // nửa hình tròn đặc, phần cong hướng lên (đụn cát, đồi)
        half: (u, v, r, c) => k.add(new T.CylinderGeometry(r * w, r * w, D, 12, 1, false, 0, Math.PI), c || F.mark, ...at(u, v), { rot: [Math.PI / 2, Math.PI / 2, 0] }),
        // nét thẳng dài len, dày th, xoay rot
        bar: (u, v, len, th, rot, c) => k.add(K().box(len * w, th * w, D, 0.005), c || F.mark, ...at(u, v), { rot: [0, 0, rot || 0] }),
        // nửa vòng cung bán kính r, dày th, cong lên (sóng); kéo dày theo trục z bằng lá cờ để thấy ở hai mặt
        arc: (u, v, r, th, rot, c) =>
          k.add(new T.TorusGeometry(r * w, (th * w) / 2, 4, 14, Math.PI), c || F.mark, ...at(u, v), { rot: [0, 0, rot || 0], sc: [1, 1, D / (th * w)] }),
      };
      F.emblem(m);
    },
    // cửa chính áp mặt trước (y: chân cửa, z: mặt tường): ô cửa lõm sẫm, khung hai bên và lanh tô trên, cánh cửa (gỗ ván dọc
    // bậc 1; bốn ô nổi bậc 2; cánh sơn có ô kính trên bậc 3; khe sáng bậc tương lai), cửa rộng thì hai cánh, tay nắm, bậc thềm
    door(k, P, x, y, z, w, h, t) {
      t = t == null ? 1 : t;
      const B = K(),
        fut = t >= 3,
        frame = fut ? P.dark : t === 2 ? P.light || '#e8e0d0' : t === 1 ? P.stone : P.trim,
        leaf = fut ? P.dark : t === 0 ? '#7a5232' : t === 1 ? '#6a4228' : P.accent,
        two = w > 1.0;
      k.add(B.box(w + 0.04, h + 0.02, 0.06, 0.01, true), '#1c1612', x, y, z + 0.01); // ô cửa lõm
      for (const e of [-1, 1]) k.add(B.box(0.1, h + 0.1, 0.12, 0.01, true), frame, x + e * (w / 2 + 0.05), y, z + 0.04);
      k.add(B.box(w + 0.34, 0.14, 0.15, 0.02, true), frame, x, y + h + 0.02, z + 0.05);
      if (t === 2 && !fut) k.add(B.box(0.16, 0.2, 0.17, 0.01, true), P.light || '#e8e0d0', x, y + h - 0.02, z + 0.06); // đá khoá
      const lh = t >= 2 && h > 1.15 ? h - 0.3 : h - 0.02; // (cửa cao bậc 3: chừa ô kính trên)
      k.add(B.box(w - 0.04, lh, 0.06, 0.01, true), leaf, x, y, z + 0.05);
      if (lh < h - 0.1) k.add(B.box(w - 0.1, 0.22, 0.05, 0.01), '#ffe9a8', x, y + h - 0.15, z + 0.05); // ô kính trên cửa
      if (fut) {
        for (const e of [-1, 1]) k.add(B.box(0.04, h + 0.1, 0.03, 0.01, true), P.glow, x + e * (w / 2 + 0.11), y, z + 0.1, { glow: true });
        k.add(B.box(0.04, lh * 0.8, 0.02, 0.01), P.glow, x, y + lh / 2, z + 0.09, { glow: true });
      } else if (t === 0) {
        for (let i = 1; i < 4; i++) k.add(B.box(0.025, lh, 0.02, 0.01, true), '#4a321e', x - w / 2 + (w * i) / 4, y, z + 0.085); // ván
        for (const yy of [0.25, 0.75]) k.add(B.box(w - 0.1, 0.06, 0.02, 0.01), '#4a321e', x, y + lh * yy, z + 0.09); // nẹp ngang
      } else {
        const cols = two ? 2 : 1;
        for (let c = 0; c < cols; c++)
          for (const yy of [0.27, 0.7]) {
            const cx = x - w / 2 + (w * (c + 0.5)) / cols;
            k.add(B.box((w / cols) * 0.62, lh * 0.32, 0.03, 0.01), t === 1 ? '#7d5236' : P.wall2, cx, y + lh * yy, z + 0.09); // ô nổi
          }
      }
      if (two && !fut) k.add(B.box(0.03, lh, 0.02, 0.01, true), '#1c1612', x, y, z + 0.09);
      for (const e of two ? [-1, 1] : [1]) k.add(B.ball(0.04, 0), fut ? P.glow : '#c9a640', x + e * (two ? 0.1 : w * 0.32), y + lh * 0.48, z + 0.11, fut ? { glow: true } : null);
      k.add(B.box(w + 0.3, 0.06, 0.3, 0.01, true), P.stone, x, y - 0.03, z + 0.15); // bậc thềm
    },
    // ô cửa sổ áp mặt trước (y: giữa ô): ô lõm sẫm, kính, khung bốn cạnh, song chữ thập, bậu dưới, lanh tô trên, cánh chớp
    // mở hai bên (bậc 1, 2, cửa nhỏ); bậc tương lai: kính sáng có khung mảnh và một vạch ngang
    win(k, P, t, x, y, z, w, h) {
      const B = K();
      if (t >= 3) {
        k.add(B.box(w + 0.08, h + 0.08, 0.05, 0.01), P.dark, x, y, z + 0.015);
        H.lightBox(k, P, t, w, h, 0.05, x, y, z + 0.04);
        k.add(B.box(w, 0.03, 0.02, 0.01), P.dark, x, y + h * 0.18, z + 0.075);
        return;
      }
      const fr = t === 2 ? P.light || '#e8e0d0' : P.trim;
      k.add(B.box(w + 0.04, h + 0.04, 0.05, 0.01), '#1c1612', x, y, z + 0.01);
      k.add(B.box(w - 0.04, h - 0.04, 0.03, 0.01), t === 2 ? '#cfe3ee' : '#ffe9a8', x, y, z + 0.035);
      for (const e of [-1, 1]) {
        k.add(B.box(w + 0.12, 0.06, 0.06, 0.01), fr, x, y + e * (h / 2 + 0.01), z + 0.05);
        k.add(B.box(0.06, h + 0.1, 0.06, 0.01), fr, x + e * (w / 2 + 0.01), y, z + 0.05);
      }
      k.add(B.box(0.035, h, 0.035, 0.01), fr, x, y, z + 0.06);
      k.add(B.box(w, 0.035, 0.035, 0.01), fr, x, y + (t === 2 ? h * 0.18 : 0), z + 0.06);
      k.add(B.box(w + 0.22, 0.06, 0.16, 0.01), t === 0 ? P.trim : P.stone, x, y - h / 2 - 0.06, z + 0.08); // bậu
      if (t >= 1) k.add(B.box(w + 0.18, 0.09, 0.08, 0.01), t === 2 ? P.light || '#e8e0d0' : P.stone, x, y + h / 2 + 0.08, z + 0.04); // lanh tô
      if (t <= 1 && w <= 0.8)
        for (const e of [-1, 1]) {
          const sx = x + e * (w * 0.75 + 0.04);
          k.add(B.box(w * 0.5, h, 0.04, 0.01), t === 0 ? '#8a6a44' : '#4f6a52', sx, y, z + 0.03); // cánh chớp
          for (const yy of [-0.25, 0, 0.25]) k.add(B.box(w * 0.42, 0.025, 0.02, 0.01), '#2e2a22', sx, y + h * yy, z + 0.055);
        }
    },
    // răng tường (lỗ châu mai) dọc trục x: n răng từ x0 tới x1 ở độ cao y
    crenels(k, color, x0, x1, y, z, n, w, h, d) {
      for (let i = 0; i < n; i++) k.add(K().box(w, h, d, 0.03, true), color, x0 + ((x1 - x0) * i) / Math.max(1, n - 1), y, z);
    },
    // ô sáng (cửa sổ, dải đèn): màu sáng, bậc tương lai thì phát sáng thật
    lightBox(k, P, t, w, h, d, x, y, z) {
      k.add(K().box(w, h, d, 0.01), t >= 3 ? P.glow : '#ffe9a8', x, y, z, t >= 3 ? { glow: true } : null);
    },
    // lan can dọc trục x từ x0 tới x1 ở độ cao y (h: cao lan can, n: số song tối thiểu): trụ đầu có mũ, tay vịn tròn,
    // thanh dưới, song tiện mảnh cách nhau chừng 0,16
    rail(k, color, x0, x1, y, z, h, n) {
      const B = K(),
        len = Math.abs(x1 - x0),
        cx = (x0 + x1) / 2,
        m = Math.max(n, Math.round(len / 0.16));
      for (const xe of [x0, x1]) {
        k.add(B.box(0.09, h + 0.04, 0.09, 0.01, true), color, xe, y, z);
        k.add(B.box(0.13, 0.04, 0.13, 0.01, true), color, xe, y + h + 0.04, z);
      }
      k.add(new root.THREE.CylinderGeometry(0.035, 0.035, len, 6), color, cx, y + h, z, { rot: [0, 0, Math.PI / 2] });
      k.add(B.box(len, 0.04, 0.05, 0.01, true), color, cx, y + 0.05, z);
      for (let i = 1; i < m; i++) k.add(B.post(0.017, h - 0.07, 5), color, x0 + ((x1 - x0) * i) / m, y + 0.07, z);
    },
    // hiên trước cửa (y: mặt sàn, z: mặt tường trước, w rộng, d sâu, h cao): sàn, hai cột trước (bậc 3 cột tròn trắng), mái
    // hiên dốc ra ngoài có xà đỡ, lan can hai bên lối vào, hai bậc lên
    porch(k, P, t, x, y, z, w, d, h) {
      const B = K(),
        post = t === 2 ? P.light || '#e8e0d0' : P.trim,
        zf = z + d;
      k.add(B.box(w, 0.1, d, 0.02, true), t === 0 ? P.trim : P.stone, x, y - 0.1, z + d / 2);
      for (const e of [-1, 1]) {
        if (t === 2) k.add(B.post(0.07, h, 8), post, x + e * (w / 2 - 0.12), y, zf - 0.12);
        else k.add(B.box(0.12, h, 0.12, 0.01, true), post, x + e * (w / 2 - 0.12), y, zf - 0.12);
        k.add(B.box(0.06, 0.06, d * 0.6, 0.01), post, x + e * (w / 2 - 0.12), y + h - 0.25, zf - 0.12 - d * 0.3, { rot: [0.6, 0, 0] }); // xà chéo
        H.rail(k, post, x + e * (w / 2 - 0.12), x + e * 0.45, y, zf - 0.12, 0.45, 3);
      }
      k.add(B.box(w + 0.1, 0.1, 0.14, 0.01, true), post, x, y + h - 0.05, zf - 0.12); // xà ngang
      k.add(B.box(w + 0.3, 0.08, d + 0.25, 0.02, true), P.roof, x, y + h + 0.05, z + d / 2 + 0.05, { rot: [0.16, 0, 0] });
      for (let i = 0; i < 2; i++) k.add(B.box(0.9, 0.05 * (2 - i), 0.24, 0.01, true), P.stone, x, y - 0.1, zf + 0.12 + i * 0.24);
    },
    // vòng tròn nằm ngang bán kính r, dày tube, ở (x, y, z)
    torus(k, color, r, tube, x, y, z, o) {
      const g = new root.THREE.TorusGeometry(r, tube, 4, 28);
      k.add(g, color, x, y, z, Object.assign({ rot: [Math.PI / 2, 0, 0] }, o || {}));
    },
    // thùng gỗ đai sắt (bậc tương lai: thùng kim loại có vành sáng)
    barrel(k, P, t, x, y, z) {
      k.add(K().lathe([[0.2, 0], [0.25, 0.25], [0.2, 0.5]], 8), t >= 3 ? P.metal : '#8a5a32', x, y, z);
      for (const yy of [0.1, 0.4]) H.torus(k, t >= 3 ? P.glow : P.dark, 0.23, 0.02, x, y + yy, z, t >= 3 ? { glow: true } : null);
    },
    // hòm gỗ cạnh s, hai nẹp chéo mặt trước
    crate(k, P, t, x, y, z, s) {
      k.add(K().box(s, s, s, 0.02, true), t >= 3 ? P.wall2 : '#a77b48', x, y, z);
      k.add(K().box(s + 0.02, 0.06, s + 0.02, 0.01, true), t >= 3 ? P.glow : P.trim, x, y + s * 0.45, z, t >= 3 ? { glow: true } : null);
    },
    // cờ treo dọc áp mặt tường trước (y: thanh treo, z: mặt tường): thanh treo, tấm vải màu cờ đảo, ký hiệu đảo, tua dưới
    banner(k, P, x, y, z, w, h) {
      k.add(K().box(w + 0.2, 0.06, 0.06, 0.01), P.dark, x, y, z + 0.06);
      k.add(K().box(w, h, 0.04, 0.01), flagColor(P), x, y - h / 2, z + 0.05);
      k.add(new root.THREE.CylinderGeometry(w * 0.5, w * 0.5, 0.04, 3), flagColor(P), x, y - h, z + 0.05, { rot: [Math.PI / 2, 0, 0] });
      H.emblem(k, P, x, y - h * 0.38, z + 0.05, w);
    },
    // đuốc (bậc tương lai: đèn cột sáng)
    torch(k, P, t, x, y, z) {
      k.add(K().post(0.05, 0.5, 5), t >= 3 ? P.metal : P.trim, x, y, z);
      if (t >= 3) k.add(K().box(0.12, 0.3, 0.12, 0.01), P.glow, x, y + 0.5, z, { glow: true });
      else k.add(K().cone(0.11, 0.3, 6), '#ff9a3a', x, y + 0.5, z, { glow: true });
    },
    // lính gác đứng ở (x, y, z), mặt về +z. Vũ khí theo bậc: giáo tre, giáo sắt, súng trường, gậy sáng
    guard(k, P, t, x, y, z) {
      const B = K(),
        c = Object.assign({}, GUARD[t], P.S && P.S.guard && P.S.guard[t]),
        form = c.form || ['cone', 'helm', 'cap', 'visor', 'visor'][t];
      for (const s of [-1, 1]) k.add(B.box(0.13, 0.5, 0.16, 0.01, true), c.legs, x + s * 0.09, y, z);
      k.add(B.box(0.42, 0.5, 0.26, 0.04, true), c.coat, x, y + 0.48, z);
      k.add(B.box(0.44, 0.07, 0.28, 0.01, true), t >= 3 ? P.glow : P.dark, x, y + 0.5, z, t >= 3 ? { glow: true } : null); // thắt lưng
      for (const s of [-1, 1]) k.add(B.box(0.1, 0.44, 0.12, 0.01, true), c.coat, x + s * 0.27, y + 0.53, z);
      k.add(B.ball(0.16, 1), c.skin, x, y + 1.12, z);
      hat(k, B, P, c, form, x, y, z);
      // vũ khí cầm tay phải
      const xr = x + 0.32;
      if (t <= 1) {
        k.add(B.post(0.025, 1.75, 4), t === 0 ? '#c7a564' : P.trim, xr, y + 0.1, z + 0.05);
        k.add(B.cone(0.05, 0.22, 4), t === 0 ? '#c7a564' : P.metal, xr, y + 1.85, z + 0.05);
        if (t === 1) k.add(B.box(0.06, 0.14, 0.06, 0.01), P.accent, xr, y + 1.7, z + 0.05); // tua đỏ
      } else if (t === 2) k.add(B.box(0.06, 0.08, 0.8, 0.01), '#2b2b2b', xr - 0.1, y + 0.75, z + 0.2, { rot: [-0.9, 0, 0] }); // súng
      else k.add(B.post(0.03, 1.4, 5), P.glow, xr, y + 0.2, z + 0.05, { glow: true });
    },
  };
  BK.Blocks.H = H;
})(typeof self !== 'undefined' ? self : globalThis);
