/* Bể Kính · render/deep/tunnels3d.js · Ba đường hầm xuyên ba núi trụ nối ba phế tích (design/ke-hoach-buoc-19.md, 20)
 * Lòng hầm (sàn, tường, trần vòm cong theo cung tròn), đá phát sáng (ánh tính sẵn vào màu lòng hầm), ô chạm khắc hình thù lạ,
 * hai cửa hầm mỗi hầm (cánh cửa hé hay đóng, rong che nửa lối), đường lát đá có đèn từ cửa vào phế tích.
 * Cần: render/deep/terrain3d.js, render/deep/kit3d.js. */
(function (root) {
  'use strict';
  const BK = root.BK || (root.BK = {});
  // D: ngữ cảnh chung của đáy bể (render/deep3d.js); phần này đọc từ D và ghi thêm vào D những gì phần sau dùng
  function build(D) {
    const {
      THREE,
      TUN_W,
      TUN_WALL,
      TUNNELS,
      TUN_RC,
      TUN_FLOOR,
      hash,
      put,
      BOX,
      groups,
      GEM,
      RINGG,
      BALL,
      CONE,
      FRU,
      SITES,
      ARCH,
      HALFDISC,
      rnd,
      CYL,
      frame,
      ROAD_U,
      hAt,
    } = D;
    /* ---------- Ba đường hầm xuyên ba núi trụ (dưới Lúa Vàng, Đá Mây, Cửa Sóng), nối ba phế tích (bước 19, 20) ----------
     * Lòng hầm là lối đi thật: sàn lát đá, tường đứng, trần vòm, cong theo cung tròn xuyên chân núi. Đá phát sáng thành cụm dọc
     * chân hai tường (lam, lục, tím, vàng cam xen nhau) và treo trên trần; ánh của đá được tính sẵn vào màu tường, sàn và hình
     * khắc (càng gần đá càng sáng, ngả màu đá), không thêm đèn thật vào cảnh. Hai bên tường là các ô chạm khắc hình thù lạ (xoắn
     * ốc, mắt, sinh vật nhiều chân, mặt trời vòng, người nhiều tay, mê cung sao), một số ô có nét khắc tự sáng.
     * Mặt đất đáy chỗ cắt qua lòng hầm được khoét khi vẽ (shader của lưới đáy), nên đứng trong hầm thấy lối đi thông suốt. */
    const STYLE = [
      { wall: '#d8d0bd', frame: '#e8e2d2', trim: '#b8733d', glow: '#ff9b52', door: '#9a6a36', road: '#cfc6b0' },
      { wall: '#93653f', frame: '#2f5fa8', trim: '#d8b04a', glow: '#ffd36a', door: '#7a5530', road: '#c9a77c' },
      { wall: '#6f776c', frame: '#8a9186', trim: '#46494b', glow: '#5ff0ff', door: '#4d5250', road: '#8f968a' },
    ];
    const TG = { pos: [], col: [], noTint: true }; // lòng hầm: tường, sàn, hình khắc (màu đã gồm ánh đá sáng)
    const PROF = (() => {
      // mặt cắt lòng hầm (ngang, cao): sàn → tường phải → vòm → tường trái
      const p = [];
      for (let i = 0; i <= 4; i++) p.push([-TUN_W + (2 * TUN_W * i) / 4, 0, 0, 0]);
      for (let i = 1; i <= 3; i++) p.push([TUN_W, (TUN_WALL * i) / 3, 1, 0]);
      for (let i = 1; i < 14; i++) {
        const a = (i / 14) * Math.PI;
        p.push([Math.cos(a) * TUN_W, TUN_WALL + Math.sin(a) * TUN_W, Math.cos(a), Math.sin(a)]);
      }
      for (let i = 3; i >= 1; i--) p.push([-TUN_W, (TUN_WALL * i) / 3, -1, 0]);
      return p;
    })();
    const GLOWS = ['#6ff6ff', '#8dffb0']; // (bước 21: hai màu lam, lục)
    const portals = [];
    const tri = (G, a, b, c, ca, cb, cc2) => {
      G.pos.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
      for (const k of [ca, cb, cc2]) G.col.push(k.r, k.g, k.b);
    };
    for (const TN of TUNNELS) {
      const v0 = TG.pos.length / 3,
        lights = [],
        span = TN.b - TN.a,
        NR = Math.round((span * TUN_RC) / 2.5);
      const at = (th, lat, y) => new THREE.Vector3(Math.cos(th) * (TUN_RC + lat), TUN_FLOOR + y, Math.sin(th) * (TUN_RC + lat));
      // ống hầm: các vòng mặt cắt dọc cung; tường, trần gồ ghề nhẹ (đá đẽo), sàn phẳng
      const rings = [];
      for (let i = 0; i <= NR; i++) {
        const th = TN.a + (span * i) / NR,
          ring = [];
        for (let j = 0; j < PROF.length; j++) {
          const [x, y, nx, ny] = PROF[j],
            end = i === 0 || i === NR,
            jit = end || (!nx && !ny) ? 0 : (hash(i * 31 + j * 7 + TN.k * 997) - 0.5) * (ny > 0.3 ? 1.2 : 0.5);
          ring.push(at(th, x + nx * jit, y + ny * jit));
        }
        rings.push(ring);
      }
      const ROCK = new THREE.Color('#766d61'),
        FLOORC = new THREE.Color('#6d655a'),
        c1 = new THREE.Color(),
        c2 = new THREE.Color(),
        c3 = new THREE.Color(),
        c4 = new THREE.Color();
      for (let i = 0; i < NR; i++)
        for (let j = 0; j < PROF.length; j++) {
          const j2 = (j + 1) % PROF.length,
            a = rings[i][j],
            b = rings[i + 1][j],
            c = rings[i + 1][j2],
            d = rings[i][j2],
            fl = PROF[j][1] === 0 && PROF[j2][1] === 0;
          const base = fl ? FLOORC : ROCK,
            s = 0.85 + hash(i * 13 + j) * 0.25;
          c1.copy(base).multiplyScalar(s);
          c2.copy(c1);
          c3.copy(c1);
          c4.copy(c1);
          tri(TG, a, b, c, c1, c2, c3);
          tri(TG, a, c, d, c1, c3, c4);
        }
      // sàn lát đá dọc lối đi, rãnh hai bên
      for (let s = 1.5; s < span * TUN_RC - 1; s += 3.2) {
        const th = TN.a + s / TUN_RC,
          p = at(th, 0, 0);
        put(
          TG,
          BOX(),
          hash(s * 7 + TN.k) < 0.5 ? '#a49a88' : '#958b7a',
          p.x,
          p.y,
          p.z,
          12.5,
          0.3,
          2.9,
          Math.atan2(-Math.sin(th), Math.cos(th)),
        );
      }
      // đá phát sáng: cụm ở chân hai tường mỗi 9 bước, đá treo trên trần mỗi 18 bước
      let n = 0;
      // (bước 21: cụm đá mỗi 16 bước, ánh toả hẹp: vùng sáng quanh cụm đá xen vùng tối rõ rệt)
      for (let s = 7; s < span * TUN_RC - 4; s += 16, n++)
        for (const q of [-1, 1]) {
          const th = TN.a + s / TUN_RC,
            col = GLOWS[(n + (q > 0 ? 1 : 0) + TN.k) % 2],
            p = at(th, q * (TUN_W - 1.3), 0),
            ry = Math.atan2(-Math.sin(th), Math.cos(th));
          put(groups.glow, GEM(), col, p.x, p.y, p.z, 0.9, 2.4, 0.9, ry, 0, q * 0.25);
          put(
            groups.glow,
            GEM(),
            col,
            p.x + Math.cos(th + 0.02) * 0.6,
            p.y,
            p.z + Math.sin(th + 0.02) * 0.6,
            0.6,
            1.5,
            0.6,
            ry + 1,
            0,
            -q * 0.4,
          );
          put(groups.glow, GEM(), col, p.x - Math.sin(th) * 1.2, p.y, p.z + Math.cos(th) * 1.2, 0.5, 1.1, 0.5, ry + 2, 0.3, q * 0.5);
          lights.push({ p: at(th, q * (TUN_W - 1.5), 2), c: new THREE.Color(col), I: 1.15 });
          if (q > 0 && n % 2 === 0) {
            const t2 = th + 0.5 / TUN_RC,
              p2 = at(t2, 0, TUN_WALL + TUN_W - 0.4),
              c2c = GLOWS[(n + 1 + TN.k) % 2];
            put(groups.glow, GEM(), c2c, p2.x, p2.y, p2.z, 1.1, -3.2, 1.1, ry);
            lights.push({ p: at(t2, 0, TUN_WALL + TUN_W - 3.5), c: new THREE.Color(c2c), I: 0.6 });
          }
        }
      // ô chạm khắc hai bên tường: khung nổi, hình thù lạ bên trong; ô thứ ba có nét khắc tự sáng
      let pn = 0;
      for (let s = 10.5; s < span * TUN_RC - 8; s += 12)
        for (const q of [-1, 1]) {
          const th = TN.a + s / TUN_RC,
            tx = -Math.sin(th),
            tz = Math.cos(th),
            ry = Math.atan2(-tz, tx),
            wall = at(th, q * (TUN_W - 0.55), 0),
            yc = 7.6,
            kind = (pn + TN.k * 2 + (q > 0 ? 3 : 0)) % 6,
            lit = pn % 4 === 0;
          pn++;
          const el = (G, geo, color, a, b, sx, sy, sz, rz, depth) => {
            const dd = (depth || 0) * q;
            put(
              G,
              geo,
              color,
              wall.x + tx * a - Math.cos(th) * dd,
              wall.y + yc + b,
              wall.z + tz * a - Math.sin(th) * dd,
              sx,
              sy,
              sz,
              ry,
              0,
              rz || 0,
            );
          };
          const C = '#cfc3a8',
            K = (a, b, sx, sy, sz, rz, geo) => {
              el(TG, geo || BOX(), C, a, b, sx, sy, sz || 0.5, rz);
              if (lit) el(groups.glow, geo || BOX(), GLOWS[(pn + TN.k) % 2], a, b, sx * 0.55, sy * 0.55, 0.2, rz, 0.32);
            };
          // nền ô tối, khung nổi
          el(TG, BOX(), '#3e3630', 0, -4.4, 9.6, 8.8, 0.25, 0, -0.1);
          el(TG, BOX(), '#b5a98f', 0, 4.4, 10, 0.5, 0.6);
          el(TG, BOX(), '#b5a98f', 0, -4.6, 10, 0.5, 0.6);
          el(TG, BOX(), '#b5a98f', -5, -4.6, 0.5, 9.5, 0.6);
          el(TG, BOX(), '#b5a98f', 5, -4.6, 0.5, 9.5, 0.6);
          if (kind === 0) {
            for (let i = 0; i < 24; i++) {
              const t = i / 23,
                r = 0.3 + t * 3.3,
                an = t * Math.PI * 4;
              K(Math.cos(an) * r, Math.sin(an) * r, 0.55, 0.55, 0.5, an);
            }
          } // xoắn ốc
          else if (kind === 1) {
            for (let i = 0; i <= 8; i++) {
              const t = -1 + i / 4,
                b = 1.8 * (1 - t * t);
              K(t * 3.4, b, 0.9, 0.35, 0.5, -t * 0.9);
              K(t * 3.4, -b, 0.9, 0.35, 0.5, t * 0.9);
            }
            K(0, 0, 1.1, 1.1, 1.1, 0, RINGG());
            K(0, 0, 0.55, 0.55, 0.3, 0, BALL());
            for (let i = 0; i < 8; i++) {
              const an = (i / 8) * Math.PI * 2;
              K(Math.cos(an) * 3.6, Math.sin(an) * 3.6 * 0.9, 0.9, 0.25, 0.5, an);
            }
          } // mắt toả tia
          else if (kind === 2) {
            K(0, 0, 2.6, 1.2, 0.5, 0, BALL());
            K(3.1, 0.5, 0.8, 0.8, 0.5, 0, BALL());
            for (let l = 0; l < 3; l++) for (const sg of [-1, 1]) K(-1.6 + l * 1.6, sg * 1.7, 0.25, 1.5, 0.5, sg * (0.5 - l * 0.4));
            for (const sg of [-1, 1]) K(3.9, 0.5 + sg * 0.9, 1.4, 0.18, 0.5, sg * 0.7);
            for (let i = 0; i < 5; i++) K(-3 - i * 0.7, Math.sin(i) * 0.6, 0.6 - i * 0.08, 0.6 - i * 0.08, 0.5, 0, BALL());
          } // sinh vật nhiều chân
          else if (kind === 3) {
            for (const r of [3.2, 2.2, 1.2]) K(0, 0, r, r, r, 0, RINGG());
            for (let i = 0; i < 12; i++) {
              const an = (i / 12) * Math.PI * 2;
              K(Math.cos(an) * 3.9, Math.sin(an) * 3.6, 0.35, 0.8, 0.5, an - Math.PI / 2, CONE(3));
            }
          } // mặt trời vòng
          else if (kind === 4) {
            K(0, -1.2, 0.9, 3.6, 0.5, 0, FRU(6, 0.6));
            K(0, 2.8, 0.9, 0.9, 0.5, 0, BALL());
            for (let i = 0; i < 6; i++) {
              const an = -0.9 + (i / 5) * 1.8;
              for (const sg of [-1, 1]) K(sg * (0.8 + Math.cos(an) * 1.5), 1 + Math.sin(an) * 1.6, 2.2, 0.25, 0.5, sg * an);
            }
            K(0, 4, 0.3, 0.9, 0.5, 0);
          } // người nhiều tay
          else {
            let a = -3.6,
              b = -3;
            for (let i = 0; i < 7; i++) {
              const h = i % 2 ? 1.6 : 0;
              K(a + 0.5, b + h, 1.2, 0.3, 0.5);
              K(a + 1.1, b + 0.8, 0.3, 1.6, 0.5);
              a += 1.1;
              b += 0.6;
            }
            for (const [a2, b2] of [
              [-2.6, 2.6],
              [2.6, 2.6],
              [2.8, -2.4],
            ])
              for (let i = 0; i < 4; i++) K(a2, b2, 0.3, 1.4, 0.5, (i * Math.PI) / 4);
          } // mê cung, sao
        }
      // ánh đá sáng tính sẵn vào màu lòng hầm (từ v0): giảm theo khoảng cách, mặt quay về phía đá sáng hơn (mặt khắc nổi khối)
      const P = TG.pos,
        Cc = TG.col,
        AMB = [0.035, 0.04, 0.05],
        nv = new THREE.Vector3(),
        e1 = new THREE.Vector3(),
        e2 = new THREE.Vector3();
      for (let t = v0; t < P.length / 3; t += 3) {
        e1.set(P[t * 3 + 3] - P[t * 3], P[t * 3 + 4] - P[t * 3 + 1], P[t * 3 + 5] - P[t * 3 + 2]);
        e2.set(P[t * 3 + 6] - P[t * 3], P[t * 3 + 7] - P[t * 3 + 1], P[t * 3 + 8] - P[t * 3 + 2]);
        nv.crossVectors(e1, e2).normalize();
        for (let v = t; v < t + 3; v++) {
          const x = P[v * 3],
            y = P[v * 3 + 1],
            z = P[v * 3 + 2];
          let r = AMB[0],
            g = AMB[1],
            b = AMB[2];
          for (const L of lights) {
            const dx = L.p.x - x,
              dy = L.p.y - y,
              dz = L.p.z - z,
              d2 = dx * dx + dy * dy + dz * dz;
            if (d2 > 1600) continue;
            const f = (L.I / (1 + d2 / 6.5)) * (0.3 + (0.7 * Math.abs(nv.x * dx + nv.y * dy + nv.z * dz)) / Math.sqrt(d2 + 1e-6));
            r += L.c.r * f;
            g += L.c.g * f;
            b += L.c.b * f;
          }
          Cc[v * 3] *= Math.min(r, 1.2);
          Cc[v * 3 + 1] *= Math.min(g, 1.2);
          Cc[v * 3 + 2] *= Math.min(b, 1.2);
        }
      }
      // hai cửa hầm ở hai đầu
      portalAt(TN, 0, rings[0]);
      portalAt(TN, 1, rings[NR]);
    }
    /* Cửa hầm ở một đầu (end 0: phía phế tích TN.from, bên +v; end 1: phía TN.to, bên −v): mặt đá dày có lỗ đúng hình lòng hầm,
     * khung cột có đèn, vòm viền sáng, đà ngang, bảng khắc; hai cánh cửa đồng chỉ hé (bước 22: khe hé mỗi cửa một khác, vừa một
     * người lách vào; hai cửa đóng kín), tấm bán nguyệt bịt vòm phía trên cánh cửa; ba bậc đá, hai lò đèn; đường
     * lát đá có đèn từ cửa vào phế tích. Kiểu cửa theo phế tích bên đó. */
    function portalAt(TN, end, ring) {
      const S = SITES[end ? TN.to : TN.from],
        T = STYLE[S.k],
        st = groups.stone,
        gl = groups.glow,
        side = end ? -1 : 1;
      const th = end ? TN.b : TN.a,
        D = new THREE.Vector3(-Math.sin(th) * side, 0, Math.cos(th) * side),
        Lt = new THREE.Vector3(Math.cos(th), 0, Math.sin(th));
      const P0 = new THREE.Vector3(Math.cos(th) * TUN_RC, TUN_FLOOR, Math.sin(th) * TUN_RC),
        ry0 = Math.atan2(-Lt.z, Lt.x);
      // điểm theo khung cửa: lat ngang (theo bán kính), y cao từ sàn hầm, d > 0 ra phía lòng rãnh, d < 0 vào trong núi
      const W = (lat, y, d) =>
        P0.clone()
          .addScaledVector(Lt, lat)
          .addScaledVector(D, -d)
          .setY(TUN_FLOOR + y);
      const add = (G, geo, color, lat, y, d, sx, sy, sz, ry, rx, rz) => {
        const p = W(lat, y, d);
        put(G, geo, color, p.x, p.y, p.z, sx, sy, sz, ry0 + (ry || 0), rx, rz);
      };
      // mặt đá dày có lỗ hình lòng hầm: mỗi điểm mặt cắt nối ra mép chữ nhật 32 × 30 (chiếu từ tâm (0, 12))
      const wc = new THREE.Color(T.wall),
        wc2 = wc.clone().multiplyScalar(0.8);
      const outer = PROF.map(([x, y]) => {
        const dx = x,
          dy = y - 12;
        let t = 1e9;
        if (Math.abs(dx) > 1e-6) t = Math.min(t, 16 / Math.abs(dx));
        t = Math.min(t, dy > 0 ? 18 / dy : dy < 0 ? 12 / -dy : 1e9);
        return [dx * t, 12 + dy * t];
      });
      for (let j = 0; j < PROF.length; j++) {
        const j2 = (j + 1) % PROF.length,
          i0 = W(PROF[j][0], PROF[j][1], 0),
          i1 = W(PROF[j2][0], PROF[j2][1], 0),
          o0 = W(outer[j][0], outer[j][1], 0),
          o1 = W(outer[j2][0], outer[j2][1], 0);
        const b0 = W(outer[j][0], outer[j][1], -5),
          b1 = W(outer[j2][0], outer[j2][1], -5),
          bi0 = W(PROF[j][0], PROF[j][1], -5),
          bi1 = W(PROF[j2][0], PROF[j2][1], -5);
        tri(st, i0, o0, o1, wc, wc, wc);
        tri(st, i0, o1, i1, wc, wc, wc);
        tri(st, bi0, b1, b0, wc2, wc2, wc2);
        tri(st, bi0, bi1, b1, wc2, wc2, wc2);
        tri(st, o0, b0, b1, wc2, wc2, wc2);
        tri(st, o0, b1, o1, wc2, wc2, wc2);
      }
      for (const q of [-1, 1]) {
        add(st, BOX(), T.frame, q * 10.6, -0.5, 1.4, 3, 24.5, 3);
        add(st, BOX(), T.trim, q * 10.6, 24, 1.4, 3.8, 1.4, 3.8);
        add(gl, GEM(), T.glow, q * 10.6, 25.4, 1.4, 0.9, 1.8, 0.9);
      }
      add(st, BOX(), T.frame, 0, 25.4, 1.6, 27, 3, 4);
      add(st, BOX(), T.trim, 0, 28.4, 1.2, 14, 2.2, 1.6);
      add(gl, BOX(), T.glow, 0, 29, 0.35, 10, 0.5, 0.2);
      add(st, ARCH(), T.trim, 0, TUN_WALL, 0.9, 9.4, 9.4, 3);
      add(gl, ARCH(), T.glow, 0, TUN_WALL, 0.5, 8.7, 8.7, 0.5);
      add(gl, RINGG(), T.glow, 0, 33, 0.2, 2.6, 2.6, 2.6);
      // tấm bán nguyệt bịt vòm trên hai cánh cửa (chỉ còn khe giữa hai cánh thông vào hầm), viền sáng
      add(st, HALFDISC(), T.door, 0, TUN_WALL, -0.4, TUN_W + 0.3, 0.7, TUN_W + 0.3, 0, -Math.PI / 2);
      add(gl, ARCH(), T.glow, 0, TUN_WALL, 0.05, 6, 6, 0.4);
      add(st, BOX(), T.trim, 0, TUN_WALL - 0.4, -0.2, 2 * TUN_W + 0.6, 0.8, 1.1);
      // hai cánh cửa (bản lề ở hai mép lỗ) chỉ hé vào trong hầm: khe hở giữa hai mép cánh (bước) theo từng cửa, chia cho hai cánh;
      // người trong làng cao khoảng 2: khe 1,2–2,4 vừa một người lách vào; 0 là đóng kín
      const GAP = [
        [1.6, 1, 0],
        [0, 0, 0],
        [2.4, 0.5, 0.5],
        [1.2, 0, 1],
        [0, 0, 0],
        [2, 1, 0],
      ][TN.k * 2 + end];
      const angOf = (g) => Math.acos(Math.max(-1, 1 - g / TUN_W)); // (cánh rộng 8: mép cánh lùi vào 8 (1 − cos a) = g)
      for (const [q, ang] of [
        [-1, angOf(GAP[0] * GAP[1])],
        [1, angOf(GAP[0] * GAP[2])],
      ]) {
        const hinge = W(q * TUN_W, 0, -0.4),
          dir = Lt.clone()
            .multiplyScalar(-q * Math.cos(ang))
            .addScaledVector(D, Math.sin(ang)),
          c = hinge.clone().addScaledVector(dir, TUN_W / 2),
          ry = Math.atan2(-dir.z, dir.x);
        put(st, BOX(), T.door, c.x, TUN_FLOOR, c.z, 7.98, TUN_WALL - 0.4, 0.7, ry);
        put(gl, BOX(), T.glow, c.x, TUN_FLOOR + 6.5, c.z, 0.4, 7, 0.8, ry);
        put(st, BOX(), T.trim, c.x, TUN_FLOOR + 13.6, c.z, 7.9, 0.6, 0.85, ry);
      }
      for (let i = 0; i < 3; i++) add(st, BOX(), T.frame, 0, -0.6, 2.5 + i * 2, 21 - i * 2, 1.6 - i * 0.5, 2);
      // rong trước cửa hầm che nửa lối vào (bước 21): đám rong cao hai bên và lấn vào giữa, sợi rong rủ từ đà cửa xuống
      const wd = groups.weed,
        WC = ['#3f8a52', '#5aa35a', '#2f6e44'];
      for (let i = 0; i < 16; i++) {
        const q = i % 2 ? 1 : -1,
          lat = q * (3 + rnd() * 10) - (i % 5 === 0 ? q * 6 : 0),
          d = 1.8 + rnd() * 6,
          h = 9 + rnd() * 10;
        add(wd, CONE(4), WC[i % 3], lat, -0.4, d, 0.9 + rnd() * 0.7, h, 0.9 + rnd() * 0.7, rnd() * 3);
      }
      for (let i = 0; i < 9; i++) {
        const lat = -9 + rnd() * 11,
          len = 4 + rnd() * 7;
        add(wd, BOX(), WC[i % 3], lat, 24.6, 0.9 + rnd() * 0.6, 0.5 + rnd() * 0.5, -len, 0.25, rnd() * 3);
      }
      for (const q of [-1, 1]) {
        add(st, CYL(8), T.trim, q * 14, -0.5, 6, 1.2, 4.5, 1.2);
        add(st, CYL(8), T.frame, q * 14, 4, 6, 1.8, 0.8, 1.8);
        add(gl, GEM(), T.glow, q * 14, 4.8, 6, 1, 1.6, 1);
      }
      // đường lát đá có đèn từ cửa vào phế tích (tới gần phế tích: u = ROAD_U, |v| = 22, Vườn Treo 42)
      const F = frame(S),
        e = F.at(ROAD_U, side * (S.k === 1 ? 42 : 22)),
        st0 = W(0, 0, 9),
        dx = e.x - st0.x,
        dz = e.z - st0.z,
        Lr = Math.hypot(dx, dz),
        ryR = Math.atan2(dz, dx) * -1;
      for (let s = 0, i = 0; s < Lr; s += 3.2, i++) {
        const x = st0.x + (dx * s) / Lr,
          z = st0.z + (dz * s) / Lr,
          g = hAt(x, z) - 0.3;
        put(st, BOX(), T.road, x, g, z, 3, 0.5, 7, ryR);
        if (i % 4 === 0)
          for (const q of [-1, 1]) {
            const lx = x - (dz / Lr) * 5 * q,
              lz = z + (dx / Lr) * 5 * q,
              lg = hAt(lx, lz) - 0.3;
            put(st, CYL(6), T.trim, lx, lg, lz, 0.35, 3, 0.35);
            put(gl, GEM(), T.glow, lx, lg + 3, lz, 0.45, 0.8, 0.45);
          }
      }
      // máy quay: trước cửa trên đường, cách 32, cao 24
      const cam = W(3, 24, 32);
      portals.push({ k: S.k, side, x: P0.x, z: P0.z, y: TUN_FLOOR + 12, cam });
    }
    Object.assign(D, { TG, portals });
  }
  BK.DeepTunnels = { build };
})(typeof self !== 'undefined' ? self : globalThis);
