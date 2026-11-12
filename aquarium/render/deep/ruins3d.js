/* Bể Kính · render/deep/ruins3d.js · Hai phế tích dưới đáy bể (design/ke-hoach-buoc-18.md, 19)
 * (Phế tích thứ ba, rãnh dưới Thông Xanh: render/deep/citadel3d.js.)
 *   - Vườn Treo Bậc Thang (rãnh dưới Tuyết Trắng): sáu tầng gạch xếp lùi, dãy vòm cuốn, tháp góc, rong rủ, cây cọ, cổng men lam,
 *     hai cung điện, cầu dẫn nước, sư tử đá, đình nghỉ.
 *   - Đô Thị Đá Khổng Lồ (rãnh dưới Cát Hồng): đại lộ tượng người khổng lồ quỳ, cột khắc chữ sáng, vòng cột quanh kim tự tháp,
 *     đĩa đá lịch, cổng trời, tượng nằm, nhà tổ ong, bia khắc, tháp đá chồng.
 * Thiết kế của Bể Kính, chỉ gợi theo các truyền thuyết vườn treo và đô thị cự thạch. Phần đầu là bản bước 18, phần "Bước 19"
 * thêm kiến trúc; mỗi phần bắt đầu dãy ngẫu nhiên riêng (D.reseed).
 * Cần: render/deep/terrain3d.js, render/deep/kit3d.js. */
(function (root) {
  'use strict';
  const BK = root.BK || (root.BK = {});
  // D: ngữ cảnh chung của đáy bể (render/deep3d.js); phần này đọc từ D và ghi thêm vào D những gì phần sau dùng
  function build(D) {
    const { groups, SITES, frame, ROAD_U, rnd, BOX, CYL, CONE, ARCH, GEM, FRU, BALL, hAt, DOME, TAU, RINGG } = D;

    // (phế tích 1, rãnh dưới Thông Xanh: Thành Vỏ Ốc Xà Cừ, render/deep/citadel3d.js)

    D.reseed(2000); // mỗi phế tích một dãy ngẫu nhiên riêng: sửa phế tích này không làm đổi phế tích khác
    /* ---------- 2. Vườn Treo Bậc Thang (rãnh dưới Tuyết Trắng) ---------- */
    {
      // mặt trước (cầu thang, cổng lam) quay ra phía vách kính, chỗ máy quay lặn xuống: lật trục u (góc quay ry thành π − ry)
      const S = SITES[1],
        F0 = frame(S),
        F = {
          add: (G, geo, c, u, y, v, su, sy, sv, ry, rx, rz) => F0.add(G, geo, c, -u, y, v, su, sy, sv, Math.PI - (ry || 0), rx, -(rz || 0)),
        };
      const st = groups.stone,
        gl = groups.glow,
        wd = groups.weed;
      const BRICK = '#ad7f52',
        BRICK2 = '#93653f',
        COL = '#d6c299',
        DARKA = '#2c241f';
      let W = 128,
        D = 80,
        u0 = 6,
        y = 0;
      const H = 7.5;
      for (let t = 0; t < 6; t++) {
        F.add(st, BOX(), t % 2 ? BRICK2 : BRICK, u0, y, 0, W, H, D);
        // tháp tròn bốn góc tầng, mái vòm men lam hay vàng (bước 19)
        for (const [cu, cv] of [
          [-1, -1],
          [-1, 1],
          [1, -1],
          [1, 1],
        ]) {
          const tu = u0 + cu * (W / 2 - 1),
            tv = cv * (D / 2 - 1);
          F.add(st, CYL(10), COL, tu, y, tv, 2.6, H + 3.5, 2.6);
          F.add(st, DOME(), t % 2 ? '#3a6fb8' : '#c99a3c', tu, y + H + 3.5, tv, 2.9, 2.6, 2.9);
          F.add(gl, GEM(), '#ffd36a', tu, y + H + 6, tv, 0.5, 1.2, 0.5);
        }
        // cây cọ trên dải mặt tầng phía trước và hai bên: thân nghiêng, tàu lá đung đưa
        for (let i = 0; i < 9; i++) {
          const fr = rnd() < 0.5,
            pu = fr ? u0 - W / 2 + 3 + rnd() * 9 : u0 - W / 2 + 8 + rnd() * (W - 16),
            pv = fr ? (rnd() - 0.5) * (D - 14) : (rnd() < 0.5 ? -1 : 1) * (D / 2 - 2.5 - rnd() * 3);
          if (fr && Math.abs(pv) < 8) continue; // (cầu thang)
          const th = 5 + rnd() * 3;
          F.add(st, CYL(5), '#7a5a3a', pu, y + H, pv, 0.45, th, 0.45, 0, (rnd() - 0.5) * 0.2, (rnd() - 0.5) * 0.2);
          for (let l = 0; l < 6; l++)
            F.add(wd, CONE(4), l % 2 ? '#4f9a58' : '#6cb55a', pu, y + H + th - 0.3, pv, 0.6, 4.2, 1.1, (l / 6) * TAU, 1.25);
        }
        // mặt tầng: dãy vòm cuốn ở mặt trước và hai bên
        const front = u0 - W / 2 - 0.2,
          n = Math.max(3, Math.round(D / 7.5));
        for (let i = 0; i < n; i++) {
          const v = -D / 2 + (i + 0.5) * (D / n);
          F.add(st, BOX(), DARKA, front, y + 1, v, 0.6, H - 3, D / n - 2.4);
          F.add(st, ARCH(), COL, front - 0.3, y + H - 2.1, v, (D / n - 2.4) / 2, 1.6, 1.4, Math.PI / 2);
          F.add(st, CYL(6), COL, front - 0.6, y, v - D / n / 2, 0.6, H - 0.6, 0.6);
        }
        const ns = Math.max(4, Math.round(W / 9));
        for (const s of [-1, 1])
          for (let i = 0; i < ns; i++) {
            const u = u0 - W / 2 + (i + 0.5) * (W / ns);
            F.add(st, BOX(), DARKA, u, y + 1, s * (D / 2 + 0.2), W / ns - 2.6, H - 3, 0.6);
            F.add(st, CYL(6), COL, u - W / ns / 2, y, s * (D / 2 + 0.6), 0.6, H - 0.6, 0.6);
          }
        // rong biển rủ xuống từ mép tầng (vườn treo xưa): sợi dài ngắn, đung đưa ở ngọn
        for (let i = 0; i < 26 + t * 2; i++) {
          const side = rnd(),
            len = 3 + rnd() * (H + 2),
            w = 0.5 + rnd() * 0.8;
          let u, v;
          if (side < 0.5) {
            u = front - 0.9;
            v = (rnd() - 0.5) * D;
          } else {
            u = u0 - W / 2 + rnd() * W;
            v = (side < 0.75 ? -1 : 1) * (D / 2 + 0.9);
          }
          F.add(wd, BOX(), rnd() < 0.5 ? '#3f8a52' : '#5aa35a', u, y + H + 0.3, v, w, -len, w * 0.4, rnd() * 3);
        }
        // bồn cây trên mặt tầng: tảo mọc thẳng lên
        for (let i = 0; i < 10; i++)
          F.add(
            wd,
            CONE(4),
            rnd() < 0.5 ? '#4f9a58' : '#7cbf62',
            u0 - W / 2 + 3 + rnd() * 10,
            y + H,
            (rnd() - 0.5) * (D - 6),
            0.9 + rnd(),
            4 + rnd() * 5,
            0.9 + rnd(),
          );
        y += H;
        W -= 15;
        D -= 9;
        u0 += 4.5;
      }
      // cầu thang lớn ở mặt trước lên tầng bốn
      for (let i = 0; i < 22; i++) F.add(st, BOX(), '#c9a77c', -61 + i * 1.6, 0, 0, 1.7, (i + 1) * 1.4, 12);
      // đình đỉnh vỡ: bốn cột, vòm nứt nghiêng
      for (const [a, b] of [
        [-1, -1],
        [-1, 1],
        [1, -1],
        [1, 1],
      ])
        F.add(st, CYL(8), COL, u0 - 4.5 + a * 6, y, b * 6, 0.9, a + b === 2 ? 4 : 9, 0.9);
      F.add(st, DOME(), '#c99a5c', u0 - 6, y + 7, 2, 8.5, 6, 8.5, 0, 0.35, 0.25);
      F.add(gl, GEM(), '#9fffd0', u0 - 4.5, y, 0, 1.6, 4, 1.6);
      // cổng men lam viền vàng, hai tháp; đại lộ tường thấp có hình thú vàng
      const gu = -88;
      for (const s of [-1, 1]) {
        F.add(st, BOX(), '#2f5fa8', gu, 0, s * 10, 9, 26, 9);
        for (let k = 0; k < 4; k++) F.add(st, BOX(), '#2f5fa8', gu + (k - 1.5) * 2.3, 26, s * 10 + (k % 2 ? 3 : -3), 1.6, 2.2, 1.6);
        F.add(gl, BOX(), '#ffd36a', gu - 4.6, 8 + 0, s * 10, 0.3, 0.8, 9.2);
        F.add(gl, BOX(), '#ffd36a', gu - 4.6, 18, s * 10, 0.3, 0.8, 9.2);
      }
      F.add(st, BOX(), '#2f5fa8', gu, 14, 0, 9, 8, 11.2);
      F.add(st, BOX(), '#1b2236', gu - 0.2, 0, 0, 9.5, 14, 7);
      F.add(st, ARCH(), '#ffd36a', gu - 4.7, 13.6, 0, 3.5, 3.5, 3, Math.PI / 2);
      for (let u = gu + 7; u < -64; u += 2.4)
        for (const s of [-1, 1]) {
          F.add(st, BOX(), '#355f9c', u, 0, s * 9, 2.4, 4 + rnd() * 1.5, 1.6);
          if (Math.round(u) % 5 === 0) F.add(gl, BOX(), '#e9c460', u, 2, s * 8.1, 1.4, 1.2, 0.2);
        }
      // tường vườn thấp quanh rãnh (đổ nhiều đoạn), rừng tảo trong vườn
      for (let i = 0; i < 70; i++) {
        const a = (i / 70) * Math.PI * 2;
        if (rnd() < 0.3 || Math.cos(a) < -0.96) continue;
        const u = Math.cos(a) * S.A * 0.93,
          v = Math.sin(a) * S.B * 0.9;
        if (Math.abs(-u - ROAD_U) < 8) continue;
        F.add(st, BOX(), BRICK2, u, 0, v, 7.5, 3 + rnd() * 3, 2, -Math.atan2(Math.cos(a) * S.B, -Math.sin(a) * S.A));
      } // (bỏ đoạn ở lối từ cửa hầm; trục u đã lật)
      for (let i = 0; i < 90; i++) {
        const a = rnd() * Math.PI * 2,
          k = 0.82 + rnd() * 0.12,
          u = Math.cos(a) * S.A * k,
          v = Math.sin(a) * S.B * k;
        if ((u < -60 && Math.abs(v) < 14) || (Math.abs(-u - ROAD_U) < 13 && Math.abs(v) > 36)) continue;
        F.add(wd, CONE(4), rnd() < 0.5 ? '#3e8a4c' : '#6caf55', u, 0, v, 0.8 + rnd() * 0.8, 6 + rnd() * 12, 0.8 + rnd() * 0.8);
      }
      S.name = 'Vườn Treo Bậc Thang';
      S.top = hAt(S.x, S.z) + 46;
    }

    D.reseed(3000);
    /* ---------- 3. Đô Thị Đá Khổng Lồ (rãnh dưới Cát Hồng) ---------- */
    {
      const S = SITES[2],
        F = frame(S),
        st = groups.stone,
        gl = groups.glow;
      const STONE = '#7f877b',
        BAS = '#46494b',
        GLY = '#5ff0ff';
      for (let u = -90; u < 6; u += 4) F.add(st, BOX(), Math.round(u / 4) % 2 ? '#8f968a' : '#878e82', u, 0, 0, 3.8, 0.6, 16); // đại lộ lát đá
      for (let i = 0; i < 6; i++)
        for (const s of [-1, 1]) {
          const u = -82 + i * 16,
            v = s * 15,
            fallen = rnd() < 0.25;
          if (i % 2 === 0) {
            // tượng người khổng lồ quỳ, mặt hướng ra đại lộ
            const ry = s > 0 ? Math.PI / 2 : -Math.PI / 2;
            if (!fallen) {
              F.add(st, BOX(), STONE, u, 0, v, 7, 5, 8, ry);
              F.add(st, FRU(6, 0.7), STONE, u, 5, v + s * 1, 6, 9, 4.5, ry);
              F.add(st, BALL(), '#8b9286', u, 15.5, v + s * 0.5, 3, 3.4, 3);
              F.add(st, BOX(), BAS, u, 15.5, v - s * 2.6, 2.6, 0.8, 0.3, ry);
              for (const q of [-1, 1]) F.add(st, BOX(), STONE, u + q * 3.4, 6, v + s * 0.5, 1.6, 7, 2, ry, 0, q * 0.12);
            } else {
              F.add(st, FRU(6, 0.7), STONE, u, 3, v + s * 6, 6, 12, 4.5, ry + 0.3, Math.PI / 2);
              F.add(st, BALL(), '#8b9286', u + 4, 2.5, v + s * 16, 3, 3.4, 3);
              F.add(st, BOX(), STONE, u, 0, v, 7, 5, 8, ry);
            }
          } else {
            // cột đá vuông vót nhọn, khắc chữ sáng
            const h = 22 + rnd() * 6;
            if (!fallen) {
              F.add(st, FRU(4, 0.6), BAS, u, 0, v, 2.6, h, 2.6, Math.PI / 4);
              F.add(st, CONE(4), BAS, u, h, v, 1.6, 3, 1.6, Math.PI / 4);
              for (let k = 0; k < 4; k++) F.add(gl, BOX(), GLY, u - 1.95, 3 + k * 4.5, v, 0.15, 2.4, 0.9);
            } else F.add(st, FRU(4, 0.6), BAS, u, 1.6, v, 2.6, h, 2.6, Math.PI / 4 + 0.4, Math.PI / 2, 0.2);
          }
        }
      // vòng cột đá có đà ngang quanh kim tự tháp bậc
      const cu = 40,
        R = 36,
        N = 18;
      for (let i = 0; i < N; i++) {
        const a = (i / N) * Math.PI * 2,
          u = cu + Math.cos(a) * R,
          v = Math.sin(a) * R * 0.95,
          ry = -a,
          down = rnd() < 0.2;
        if (Math.abs(u - ROAD_U) < 5 && Math.abs(v) > 20) continue; // (lối từ cửa hầm đi qua vòng cột)
        if (down) {
          F.add(st, BOX(), STONE, u, 1.6, v, 4.5, 18, 3.2, ry, (Math.PI / 2) * 0.95, 0.2);
          continue;
        }
        F.add(st, BOX(), STONE, u, 0, v, 4.5, 18, 3.2, ry, 0, (rnd() - 0.5) * 0.08);
        if (i % 2 === 0 && rnd() < 0.8) {
          const a2 = a + Math.PI / N,
            u2 = cu + Math.cos(a2) * R,
            v2 = Math.sin(a2) * R * 0.95;
          F.add(st, BOX(), BAS, u2, 18, v2, 3.2, 2.6, 14, -a2);
        }
      }
      [
        [30, 7],
        [23, 7],
        [16, 7],
        [9, 6],
      ].forEach(([r, h], i) => F.add(st, FRU(4, 0.86), i % 2 ? '#9a9f90' : '#8a8f80', cu, i * 7, 0, r, h, r, Math.PI / 4));
      F.add(gl, GEM(), '#7ef9ff', cu, 27, 0, 4, 6, 4);
      // vạch chữ sáng trên mặt trước từng bậc (bậc vuông xoay 45°: nửa cạnh = 0,707 bán kính, mặt hơi nghiêng vào)
      [30, 23, 16, 9].forEach((r, i) => F.add(gl, BOX(), GLY, cu - r * 0.707 * 0.93 - 0.15, i * 7 + 3, 0, 0.2, 1, r * 0.85));
      // đĩa đá lịch khổng lồ dựa vào chân tháp, vòng khắc sáng
      F.add(st, CYL(20), '#9aa093', cu - 28, 13, 26, 13, 2.4, 13, 0.6, Math.PI / 2 - 0.35);
      F.add(gl, RINGG(), GLY, cu - 28, 13.4, 26, 10, 10, 10, 0.6, -0.35);
      F.add(gl, RINGG(), GLY, cu - 28, 13.4, 26, 6, 6, 6, 0.6, -0.35);
      for (let i = 0; i < 70; i++) {
        const a = rnd() * Math.PI * 2,
          k = 0.2 + rnd() * 0.8;
        F.add(
          st,
          BOX(),
          rnd() < 0.5 ? STONE : BAS,
          Math.cos(a) * S.A * 0.9 * k,
          0,
          Math.sin(a) * S.B * 0.9 * k,
          1.5 + rnd() * 4,
          1 + rnd() * 3,
          1.5 + rnd() * 4,
          rnd() * 3,
          rnd() * 0.6,
          rnd() * 0.6,
        );
      }
      S.name = 'Đô Thị Đá Khổng Lồ';
      S.top = hAt(S.x, S.z) + 36;
    }

    /* =============== Bước 19: thêm kiến trúc cho ba phế tích, ba đường hầm xuyên núi (design/ke-hoach-buoc-19.md) =============== */
    // chỗ trống trong một phế tích: tránh danh sách vòng tròn đã có công trình (u, v, bán kính) và lối từ cửa hầm (u = ROAD_U)
    const freeOf = (occ, S) => (u, v, r) =>
      Math.abs(u - ROAD_U) > r + 5 && Math.hypot(u / S.A, v / S.B) < 0.93 && occ.every(([a, b, q]) => Math.hypot(u - a, v - b) > r + q);

    D.reseed(2500);
    /* ---------- 2. Vườn Treo: hai cung điện bên, cầu dẫn nước, sư tử đá canh cổng, đình nghỉ trong vườn ---------- */
    {
      const S = SITES[1],
        F0 = frame(S),
        F = {
          add: (G, geo, c, u, y, v, su, sy, sv, ry, rx, rz) => F0.add(G, geo, c, -u, y, v, su, sy, sv, Math.PI - (ry || 0), rx, -(rz || 0)),
        };
      const st = groups.stone,
        gl = groups.glow,
        wd = groups.weed,
        COL = '#d6c299';
      // hai cung điện dài hai bên vườn: dãy vòm, lan can răng cưa, ba mái vòm men lam đỉnh vàng
      for (const s of [-1, 1]) {
        const v = s * 52,
          u0 = 30;
        F.add(st, BOX(), '#b58a5c', u0, 0, v, 38, 10, 8);
        F.add(st, BOX(), '#9a6a45', u0, 10, v, 39, 1.2, 9);
        for (let i = 0; i < 8; i++) {
          const u = u0 - 17 + i * 4.85;
          F.add(st, BOX(), '#2c241f', u, 1, v - s * 4.1, 3, 6, 0.4);
          F.add(st, ARCH(), COL, u, 7, v - s * 4.25, 1.5, 1.5, 1.2);
          F.add(st, BOX(), '#9a6a45', u + 2.4, 11.2, v - s * 4.3, 1.2, 1.4, 0.8);
        }
        for (const q of [-1, 0, 1]) {
          F.add(st, CYL(10), COL, u0 + q * 12, 11.2, v, 3.4, 2, 3.4);
          F.add(st, DOME(), '#3a6fb8', u0 + q * 12, 13.2, v, 3.6, 3.8, 3.6);
          F.add(gl, GEM(), '#ffd36a', u0 + q * 12, 17, v, 0.5, 1.6, 0.5);
        }
      }
      // cầu dẫn nước từ vách rãnh phía giữa bể lên tầng ba (vòm đá, máng nước còn ánh lam)
      for (let i = 0; i < 6; i++) {
        const u = 74 + i * 4.4;
        F.add(st, BOX(), '#a07a52', u, 0, 0, 1.8, 23, 2.4);
        if (i < 5) F.add(st, ARCH(), '#a07a52', u + 2.2, 19, 0, 2.2, 2.4, 2.4);
      }
      F.add(st, BOX(), '#9a6a45', 84, 23, 0, 26, 1.4, 3);
      F.add(gl, BOX(), '#7fe3ff', 84, 24.4, 0, 26, 0.25, 1.4);
      // hai sư tử đá canh đại lộ trước cổng lam
      for (const s of [-1, 1]) {
        const u = -70,
          v = s * 13;
        F.add(st, BOX(), '#c9a77c', u, 0, v, 7, 2, 4);
        F.add(st, BOX(), '#d8b98c', u, 2, v, 6, 3.4, 2.8);
        F.add(st, BALL(), '#d8b98c', u - 3.4, 5.6, v, 2, 2, 2);
        F.add(st, DOME(), '#b58a5c', u - 3.1, 5, v, 2.6, 2.6, 2.6, Math.PI / 2, Math.PI / 2);
        F.add(gl, BOX(), '#ffd36a', u - 5.3, 6, v, 0.2, 0.4, 1.4);
      }
      // đình nghỉ tròn trong vườn
      const occ = [
          [0, 0, 70],
          [30, 52, 22],
          [30, -52, 22],
          [-80, 0, 16],
          [84, 0, 12],
        ],
        free = freeOf(
          occ.map(([u, v, r]) => [-u, v, r]),
          S,
        );
      for (let i = 0, n = 0; i < 60 && n < 7; i++) {
        const a = rnd() * TAU,
          k = 0.78 + rnd() * 0.1,
          u = Math.cos(a) * S.A * k,
          v = Math.sin(a) * S.B * k;
        if (Math.abs(v) < 44 || !free(-u, v, 5)) continue;
        n++;
        F.add(st, CYL(10), COL, u, 0, v, 4, 0.8, 4);
        for (let c = 0; c < 6; c++) {
          const ca = (c / 6) * TAU;
          F.add(st, CYL(6), COL, u + Math.cos(ca) * 3.2, 0.8, v + Math.sin(ca) * 3.2, 0.35, 5, 0.35);
        }
        F.add(st, DOME(), rnd() < 0.5 ? '#3a6fb8' : '#c99a3c', u, 5.8, v, 4, 3, 4);
        F.add(gl, GEM(), '#9fffd0', u, 0.8, v, 0.6, 1.4, 0.6);
      }
    }

    D.reseed(3500);
    /* ---------- 3. Đô Thị Đá Khổng Lồ: cổng trời, hai tháp nhỏ, tượng nằm, nhà đá tổ ong, bãi bia khắc, tháp đá chồng ---------- */
    {
      const S = SITES[2],
        F = frame(S),
        st = groups.stone,
        gl = groups.glow,
        wd = groups.weed,
        STONE = '#7f877b',
        BAS = '#46494b',
        GLY = '#5ff0ff';
      // cổng trời ở đầu đại lộ
      for (const s of [-1, 1]) F.add(st, BOX(), BAS, -91, 0, s * 9.5, 3.6, 22, 3.6);
      F.add(st, BOX(), STONE, -91, 22, 0, 4.2, 3.4, 25);
      F.add(gl, BOX(), GLY, -93.2, 23.2, 0, 0.2, 1, 18);
      F.add(gl, RINGG(), GLY, -93.3, 15, 0, 3, 3, 3, Math.PI / 2);
      // hai kim tự tháp nhỏ ba bậc hai bên đại lộ
      for (const s of [-1, 1]) {
        [
          [16, 6],
          [11, 6],
          [6, 5],
        ].forEach(([r, h], i) => F.add(st, FRU(4, 0.86), i % 2 ? '#9a9f90' : '#8a8f80', -50, i * 6, s * 44, r, h, r, Math.PI / 4));
        F.add(gl, GEM(), GLY, -50, 17, s * 44, 1.4, 2.4, 1.4);
      }
      // người khổng lồ nằm ngửa, nửa vùi trong cát, vòng cổ khắc chữ sáng
      {
        const v = 46,
          y = -1;
        F.add(st, BOX(), STONE, -6, y, v, 15, 5.4, 9);
        for (const q of [-1, 1]) F.add(st, BOX(), STONE, -21, y, v + q * 2.3, 15, 3.6, 3.4);
        for (const q of [-1, 1]) F.add(st, BOX(), STONE, -5, y, v + q * 6, 13, 2.6, 2.4);
        F.add(st, BALL(), '#8b9286', 5.5, y + 3.2, v, 4, 3.6, 3.8);
        F.add(st, CONE(6), BAS, 9.5, y + 3, v, 3.4, 5, 3.4, 0, 0, -Math.PI / 2);
        F.add(gl, BOX(), GLY, 1, y + 5.5, v, 0.6, 0.3, 7.5);
        for (const q of [-1, 1]) F.add(gl, BOX(), GLY, 5.6, y + 6.9, v + q * 1.3, 0.8, 0.2, 0.6);
      }
      // nhà đá tổ ong
      const occ = [
          [-45, 0, 22],
          [-20, 0, 14],
          [40, 0, 40],
          [-50, 44, 14],
          [-50, -44, 14],
          [-8, 46, 18],
          [12, 26, 14],
          [70, 40, 13],
          [70, -40, 13],
          [84, 0, 8],
          [-91, 0, 14],
        ],
        free = freeOf(occ, S);
      for (let i = 0, n = 0; i < 400 && n < 40; i++) {
        const a = rnd() * TAU,
          k = 0.5 + rnd() * 0.42,
          u = Math.cos(a) * S.A * k,
          v = Math.sin(a) * S.B * k,
          r = 2.3 + rnd() * 1.8;
        if (!free(u, v, r)) continue;
        n++;
        occ.push([u, v, r]);
        F.add(st, CYL(10), BAS, u, 0, v, r * 1.05, 0.8, r * 1.05);
        F.add(st, DOME(), rnd() < 0.5 ? STONE : '#949b8f', u, 0.8, v, r, r * 1.15, r);
        F.add(st, BOX(), '#1a1c1d', u, 0.8, v, r * 2.1, r * 0.8, 1.3, rnd() * TAU);
        if (rnd() < 0.25) F.add(gl, BOX(), GLY, u, r * 1.6, v, 0.3, 0.3, 0.3);
      }
      // bãi bia khắc chữ sáng hai bên vòng cột
      for (const s of [-1, 1])
        for (let i = 0; i < 9; i++) {
          const u = 62 + (i % 3) * 7 + (rnd() - 0.5) * 2,
            v = s * (34 + Math.floor(i / 3) * 6);
          F.add(st, BOX(), BAS, u, 0, v, 2.6, 6 + rnd() * 3, 0.8, rnd() * 0.3 - 0.15, 0, (rnd() - 0.5) * 0.15);
          F.add(gl, BOX(), GLY, u, 2.5, v, 1.6, 0.25, 0.9);
        }
      // tháp đá chồng thăng bằng, đỉnh sáng
      {
        let y = 0;
        for (let i = 0; i < 7; i++) {
          const w = 7 - i * 0.75,
            h = 3 - i * 0.2;
          F.add(st, BOX(), i % 2 ? STONE : BAS, 84, y, 0, w, h, w * 0.8, rnd() * 0.6);
          y += h;
        }
        F.add(gl, GEM(), GLY, 84, y, 0, 1.2, 2.2, 1.2);
      }
      for (let i = 0; i < 40; i++) {
        const a = rnd() * TAU,
          k = 0.6 + rnd() * 0.33;
        if (Math.abs(Math.cos(a) * S.A * k - ROAD_U) < 13) continue;
        F.add(wd, CONE(4), rnd() < 0.5 ? '#3f7f4a' : '#7a9a4a', Math.cos(a) * S.A * k, 0, Math.sin(a) * S.B * k, 0.7, 3 + rnd() * 6, 0.7);
      }
    }
  }
  BK.DeepRuins = { build };
})(typeof self !== 'undefined' ? self : globalThis);
