/* Bể Kính · render/deep/beings3d.js · Dựng hình và cử động của sinh vật đáy bể: 5 loài NPC biến dị, 3 loài quái vật biển
 * (design/de-xuat-sinh-vat-day-be.md, design/ke-hoach-buoc-23.md). Dùng chung cho game (render/deep/denizens3d.js) và trang
 * xem thử design/sinh-vat-day-be.html, nên không biết gì về đáy bể: mỗi hàm dựng trả { root, size, update(t, dt, mode, spd,
 * curve, camPos) }. mode: 'idle' đứng, 'move' đi hay bơi, 'chase' đuổi (dồn tốc lực), 'swim' (Người Ốc bơi), 'curl' (Người
 * Rêu Đá, Người San Hô nằm co ngụy trang). Khung người, mặt, cách đi dựng riêng cho từng loài (không dùng khung người trên đảo).
 * create({ lights }): lights = false thì không có đèn thật (đèn đá, cần câu, tim sáng chỉ tự sáng): game dùng thế cho nhẹ.
 * bake(root): gộp các mảnh tĩnh cùng vật liệu trên mỗi khớp thành một lưới (ít lần vẽ); mảnh đánh dấu keep thì giữ riêng.
 * Cần: three.js. */
(function (root) {
  'use strict';
  const BK = root.BK || (root.BK = {});
  function create(opts) {
    const T = THREE,
      LIGHTS = !opts || opts.lights !== false;
    // số ngẫu nhiên cố định: cùng một sinh vật lần nào dựng cũng giống nhau
    let seed = 7;
    const rnd = () => {
      const x = Math.sin(seed++ * 127.1 + 311.7) * 43758.5453;
      return x - Math.floor(x);
    };
    const plight = (c, i, d, decay) => (LIGHTS ? new T.PointLight(c, i, d, decay) : Object.assign(new T.Object3D(), { intensity: 0 }));
    const keep = (m) => ((m.userData.keep = true), m);
    /* =============== Vật liệu, hình gốc, khớp =============== */
    const mats = {};
    const flat = (c, o) => mats[c + JSON.stringify(o || {})] || (mats[c + JSON.stringify(o || {})] = new T.MeshStandardMaterial(Object.assign({ color: c, flatShading: true, roughness: 0.78, metalness: 0.04, side: T.DoubleSide }, o || {})));
    const glow = (c) => mats['g' + c] || (mats['g' + c] = new T.MeshBasicMaterial({ color: c }));
    const fin = (c) => mats['f' + c] || (mats['f' + c] = new T.MeshStandardMaterial({ color: c, flatShading: true, roughness: 0.4, emissive: c, emissiveIntensity: 0.35, transparent: true, opacity: 0.8, side: T.DoubleSide }));
    const geos = {};
    const GEO = {
      ball: new T.IcosahedronGeometry(1, 1),
      ball2: new T.IcosahedronGeometry(1, 2),
      rock: new T.DodecahedronGeometry(1, 0),
      box: new T.BoxGeometry(1, 1, 1),
      cone: new T.ConeGeometry(1, 1, 6).translate(0, 0.5, 0),
      cone4: new T.ConeGeometry(1, 1, 4).translate(0, 0.5, 0),
      disc: new T.CylinderGeometry(1, 1, 1, 12),
    };
    // đoạn chi: hình côn treo từ khớp xuống (đỉnh ở 0, đáy ở −1), bán kính r0 → r1
    const limbGeo = (r0, r1, sides = 7) => geos['l' + r0 + r1 + sides] || (geos['l' + r0 + r1 + sides] = new T.CylinderGeometry(r0, r1, 1, sides).translate(0, -0.5, 0));
    function add(p, geo, mat, x = 0, y = 0, z = 0, sx = 1, sy = 1, sz = 1, rx = 0, ry = 0, rz = 0) {
      const m = new T.Mesh(geo, mat);
      m.position.set(x, y, z); m.scale.set(sx, sy, sz); m.rotation.set(rx, ry, rz);
      p.add(m);
      return m;
    }
    function J(p, x = 0, y = 0, z = 0) { const g = new T.Group(); g.position.set(x, y, z); p.add(g); return g; }
    const S = Math.sin, C = Math.cos, PI = Math.PI;
    const pulse = (t, period, sharp) => Math.pow(Math.max(0, S((t / period) * PI * 2)), sharp); // nhịp vọt lên rồi tắt
    // ống cong có bán kính đổi dần (vỏ ốc)
    function tube(pts, sides) {
      const V = (x, y, z) => new T.Vector3(x, y, z), rings = [];
      pts.forEach((p, i) => {
        const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
        const t = V(b.x - a.x, b.y - a.y, b.z - a.z).normalize(), ref = Math.abs(t.y) < 0.9 ? V(0, 1, 0) : V(1, 0, 0);
        const n = V().crossVectors(t, ref).normalize(), m = V().crossVectors(t, n), ring = [];
        for (let k = 0; k < sides; k++) { const w = (k / sides) * PI * 2, c = C(w) * p.r, s = S(w) * p.r; ring.push([p.x + n.x * c + m.x * s, p.y + n.y * c + m.y * s, p.z + n.z * c + m.z * s]); }
        rings.push(ring);
      });
      const A = V(...rings[0][0]), B = V(...rings[1][0]), Cc = V(...rings[1][1]);
      const flip = V().crossVectors(B.clone().sub(A), Cc.clone().sub(A)).dot(A.clone().sub(V(pts[0].x, pts[0].y, pts[0].z))) < 0;
      const pos = [];
      for (let i = 0; i < rings.length - 1; i++) for (let k = 0; k < sides; k++) {
        const k2 = (k + 1) % sides, a = rings[i][k], b = rings[i + 1][k], c = rings[i + 1][k2], e = rings[i][k2];
        if (flip) pos.push(...a, ...c, ...b, ...a, ...e, ...c); else pos.push(...a, ...b, ...c, ...a, ...c, ...e);
      }
      const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.computeVertexNormals();
      return g;
    }
    function nautilusPts(H, n) {
      const T1 = 4 * PI + 0.25, off = -1.4 - T1;
      let pts = [];
      for (let i = 0; i <= n; i++) { const th = 0.7 + ((T1 - 0.7) * i) / n, r = 2.2 * Math.exp(0.2 * th), a = th + off; pts.push({ x: 0, y: S(a) * r, z: C(a) * r, r: 0.55 * r }); }
      const minY = Math.min(...pts.map((p) => p.y - p.r)), maxY = Math.max(...pts.map((p) => p.y + p.r)), sc = H / (maxY - minY);
      return pts.map((p) => ({ x: 0, y: (p.y - minY) * sc, z: p.z * sc, r: p.r * sc }));
    }

    /* =============== Khung người dùng chung cho NPC biến dị (dáng, cách đi mỗi loại tự đặt) =============== */
    function humanoid(o) {
      const s = Object.assign({ hipH: 0.9, hipW: 0.1, thigh: 0.45, shin: 0.45, legR: [0.07, 0.045], torso: 0.55, chestW: 0.19, upper: 0.32, fore: 0.3, armR: [0.05, 0.032], neck: 0.12, skin: '#bbb', sides: 7 }, o);
      const skin = flat(s.skin), r = { s, skin, sh: [], el: [], hand: [], hip: [], knee: [], foot: [] };
      r.root = new T.Group();
      r.hips = J(r.root, 0, s.hipH, 0);
      add(r.hips, GEO.ball, skin, 0, 0.02, 0, s.chestW * 0.85, 0.11, s.chestW * 0.6);
      r.spine = J(r.hips, 0, 0.04, 0);
      add(r.spine, GEO.ball, skin, 0, s.torso * 0.48, 0, s.chestW * 0.8, s.torso * 0.56, s.chestW * 0.58);
      r.chest = J(r.spine, 0, s.torso * 0.86, 0);
      r.neck = J(r.chest, 0, 0.02, 0);
      add(r.neck, limbGeo(0.045, 0.055), skin, 0, s.neck, 0, 1, s.neck, 1);
      r.head = J(r.neck, 0, s.neck, 0);
      for (const k of [0, 1]) {
        const sg = k ? 1 : -1;
        const sh = J(r.chest, sg * s.chestW * 0.95, -0.03, 0);
        add(sh, limbGeo(s.armR[0], s.armR[0] * 0.85, s.sides), skin, 0, 0, 0, 1, s.upper, 1);
        const el = J(sh, 0, -s.upper, 0);
        add(el, limbGeo(s.armR[0] * 0.85, s.armR[1], s.sides), skin, 0, 0, 0, 1, s.fore, 1);
        const hand = J(el, 0, -s.fore, 0);
        const hip = J(r.hips, sg * s.hipW, 0, 0);
        add(hip, limbGeo(s.legR[0], s.legR[0] * 0.8, s.sides), skin, 0, 0, 0, 1, s.thigh, 1);
        const knee = J(hip, 0, -s.thigh, 0);
        add(knee, limbGeo(s.legR[0] * 0.8, s.legR[1], s.sides), skin, 0, 0, 0, 1, s.shin, 1);
        const foot = J(knee, 0, -s.shin, 0);
        add(foot, GEO.ball, skin, 0, -0.02, 0.05, s.legR[1] * 1.3, 0.035, s.legR[1] * 2.6);
        r.sh.push(sh); r.el.push(el); r.hand.push(hand); r.hip.push(hip); r.knee.push(knee); r.foot.push(foot);
      }
      return r;
    }
    // bước chân: pha ph, biên a; đầu gối gập khi chân vung lên trước; tay vung ngược chân
    function gait(r, ph, a, o = {}) {
      const kneeK = o.knee ?? 1.3, arm = o.arm ?? 0.8;
      for (const k of [0, 1]) {
        const p = ph + k * PI, h = -a * S(p) + (o.hipBias || 0), kn = kneeK * a * Math.max(0, C(p)) + (o.kneeBias || 0);
        r.hip[k].rotation.x = h; r.knee[k].rotation.x = kn; r.foot[k].rotation.x = -(h + kn) * 0.7 + (o.footBias || 0);
        r.sh[k].rotation.x = arm * a * S(p) + (o.armBias || 0);
        r.el[k].rotation.x = -(0.25 + 0.5 * a * Math.max(0, S(p))) + (o.elbowBias || 0);
      }
    }
    // nằm co ngụy trang (c: 0 đứng … 1 co hẳn): ngồi xổm gập người, đùi ra trước, cẳng gập sát, tay ôm gối, đầu cúi gằm; nhìn
    // xa như một tảng đá hay một bụi san hô. Gọi sau gait (trộn từ dáng đang có sang dáng co).
    const mix = (a, b, c) => a + (b - a) * c;
    function curlPose(r, c, hipH) {
      if (c < 0.001) return;
      r.hips.position.y = mix(r.hips.position.y, hipH * 0.28, c);
      r.spine.rotation.x = mix(r.spine.rotation.x, 1.25, c);
      r.neck.rotation.x = mix(r.neck.rotation.x, 0.9, c);
      for (const k of [0, 1]) {
        r.hip[k].rotation.x = mix(r.hip[k].rotation.x, -2.1, c);
        r.knee[k].rotation.x = mix(r.knee[k].rotation.x, 2.55, c);
        r.foot[k].rotation.x = mix(r.foot[k].rotation.x, -0.4, c);
        r.sh[k].rotation.x = mix(r.sh[k].rotation.x, -0.35, c);
        r.sh[k].rotation.z = mix(r.sh[k].rotation.z, (k ? 1 : -1) * -0.25, c);
        r.el[k].rotation.x = mix(r.el[k].rotation.x, -1.5, c);
      }
    }
    // trộn mượt một giá trị về đích (khung nào cũng gọi): không có cú nhảy khi đổi kiểu chuyển động
    const ease = (cur, key, target, dt, k = 3) => (cur[key] = (cur[key] ?? target) + (target - (cur[key] ?? target)) * (1 - Math.exp(-dt * k)));

    /* =============== 1. Người Ốc =============== */
    function snailman() {
      const r = humanoid({ hipH: 0.62, thigh: 0.34, shin: 0.36, legR: [0.07, 0.04], torso: 0.5, chestW: 0.17, upper: 0.3, fore: 0.3, skin: '#b48c5a' });
      const snailRoot = new T.Group(),
        snailPose = J(snailRoot, 0, 0, 0);
      snailPose.add(r.root);
      const spot = flat('#4d3523');
      // đốm nâu trên da
      for (const [j, y, n] of [[r.sh[0], -0.15, 3], [r.sh[1], -0.12, 3], [r.hip[0], -0.2, 3], [r.hip[1], -0.18, 3], [r.knee[0], -0.2, 2], [r.knee[1], -0.2, 2], [r.el[0], -0.15, 2], [r.el[1], -0.15, 2]])
        for (let i = 0; i < n; i++) add(j, GEO.ball, spot, (rnd() - 0.5) * 0.08, y - i * 0.07, 0.04 + rnd() * 0.02, 0.018, 0.024, 0.012);
      // vỏ ốc lớn trên lưng: khoang màu nâu vàng, vằn sẫm
      // (lưng còng tới trước khoảng 0,7: vỏ xoay ngược lại cho đứng trên lưng, miệng vỏ ôm sát gáy)
      // vỏ to (cao 0,85, phình ngang 1,6 lần), nằm áp trên lưng còng: trục xoắn nằm ngang, vòng ngoài úp sát lưng; thịt nối
      // vỏ với lưng
      const shellJ = J(r.spine, 0, 0.16, -0.12);
      shellJ.rotation.set(-0.35, 0, 0);
      const pts = nautilusPts(0.85, 90), STEP = 6;
      for (let i = 0, seg = 0; i < 90; i += STEP, seg++) add(shellJ, tube(pts.slice(i, i + STEP + 1), 12), flat(seg % 2 ? '#c8a874' : '#8f6a40'), 0, -0.08, -0.12, 1.6, 1, 1);
      add(r.spine, GEO.ball, r.skin, 0, 0.32, -0.08, 0.17, 0.26, 0.13);
      // đầu ốc: dài, nhẵn, miệng rộng, hai cuống mắt sáng, hai râu dưới
      r.neck.rotation.x = 0.9;
      add(r.head, GEO.ball, r.skin, 0, 0.05, 0.08, 0.12, 0.1, 0.2);
      add(r.head, GEO.box, flat('#2a1c14'), 0, -0.01, 0.24, 0.12, 0.012, 0.05);
      // cuống mắt mọc ra từ đỉnh đầu (gốc nằm trong đầu), mắt sáng ở ngọn
      r.stalks = [-1, 1].map((sg) => {
        const st = J(r.head, sg * 0.05, 0.1, 0.12);
        st.rotation.set(-0.4, 0, sg * 0.35);
        add(st, limbGeo(0.03, 0.02, 6), flat('#c9a46c'), 0, 0.25, 0, 1, 0.25, 1); // (cuống: từ trong đầu lên tới mắt)
        add(st, GEO.ball, glow('#e9ff8a'), 0, 0.25, 0, 0.034, 0.034, 0.034);
        add(st, GEO.ball, flat('#1a1408'), 0, 0.255, 0.028, 0.012, 0.012, 0.01);
        return st;
      });
      for (const sg of [-1, 1]) add(r.head, GEO.cone, r.skin, sg * 0.05, -0.04, 0.26, 0.012, 0.09, 0.012, 1.9, 0, sg * 0.4);
      // cuốc đá trong tay phải
      const tool = J(r.hand[1], 0, -0.02, 0);
      add(tool, limbGeo(0.012, 0.012), flat('#5c4630'), 0, 0.2, 0, 1, 0.55, 1);
      add(tool, GEO.cone4, flat('#9aa3a8'), 0, 0.2, 0.0, 0.025, 0.2, 0.025, PI / 2, 0, 0);
      const cur = {};
      return {
        root: snailRoot, size: 1.6, eye: 1.0,
        update(t, dt, m, spd) {
          // bơi ('swim'): thân ngả ngang, chân đạp nhanh, tay quạt; vỏ ốc ở trên lưng
          ease(cur, 'sw', m === 'swim' ? 1 : 0, dt, 2.5);
          snailPose.rotation.x = cur.sw * 1.35;
          snailPose.position.y = cur.sw * 0.9;
          if (m === 'swim') m = 'move';
          const run = m === 'chase';
          ease(cur, 'hunch', run ? 1.05 : m === 'move' ? 0.8 : 0.7, dt);
          ease(cur, 'a', m === 'idle' ? 0 : run ? 0.75 : 0.5, dt);
          cur.ph = (cur.ph || 0) + dt * (m === 'idle' ? 0 : 6 + spd * 2.2);
          r.spine.rotation.x = cur.hunch + 0.04 * S(t * 1.7);
          r.hips.position.y = 0.62 - 0.14 * cur.hunch + Math.abs(S(cur.ph)) * 0.05 * cur.a;
          gait(r, cur.ph, cur.a, { hipBias: -0.6 * cur.hunch, kneeBias: 0.95 * cur.hunch, armBias: run ? -1.0 : -0.4, elbowBias: run ? -0.5 : -0.2 });
          r.neck.rotation.x = 0.9 - cur.hunch * 0.55 + 0.05 * S(t * 2.3);
          r.head.rotation.y = 0.35 * S(t * 0.6) * (run ? 0.2 : 1);
          r.stalks.forEach((st, k) => { st.rotation.x = -0.4 - (run ? 0.9 : 0) * 0.6 + 0.18 * S(t * 3.1 + k) - cur.a * 0.25 * S(cur.ph * 2); st.rotation.z = (k ? 1 : -1) * (0.35 + 0.1 * S(t * 2.3 + k * 2)); });
        },
      };
    }

    /* =============== Nhánh cong (san hô, rong): ống thon dần theo một đường cong ngẫu nhiên, chẻ nhánh =============== */
    // trả về các lưới đặt vào p; gốc ở (0,0,0) của p, mọc theo hướng dir (Vector3). Đầu nhánh có hạt sáng (tipMat).
    // (một khớp động cho cả cụm: nhánh con dựng thẳng vào cùng khớp, bake gộp lại thành một lưới)
    function branch(p, dir, len, r0, depth, mat, tipMat, out, holder0, origin) {
      const pts = [], d = dir.clone().normalize(), pos = origin ? origin.clone() : new T.Vector3(), n = 6;
      for (let i = 0; i <= n; i++) {
        const t = i / n;
        pts.push({ x: pos.x, y: pos.y, z: pos.z, r: r0 * (1 - t * 0.55) });
        d.x += (rnd() - 0.5) * 0.35; d.z += (rnd() - 0.5) * 0.35; d.y += 0.06; d.normalize();
        pos.addScaledVector(d, len / n);
      }
      const holder = holder0 || J(p, 0, 0, 0);
      add(holder, tube(pts, 6), mat);
      if (!holder0) (out || []).push({ j: holder, d: depth });
      if (depth > 0) {
        const k = depth > 1 ? 3 : 2;
        for (let i = 0; i < k; i++) {
          const a = (i / k) * PI * 2 + rnd();
          const nd = d.clone().add(new T.Vector3(C(a) * 0.9, 0.2, S(a) * 0.9)).normalize();
          branch(p, nd, len * 0.72, r0 * 0.5, depth - 1, mat, tipMat, out, holder, pos);
        }
      } else if (tipMat) add(holder, GEO.ball, tipMat, pos.x, pos.y, pos.z, r0 * 0.9, r0 * 0.9, r0 * 0.9);
      return holder;
    }

    /* =============== 2. Người Vây (làm lại) =============== */
    // thân người gầy trơ sườn, đầu trọc dài, tai vây lớn, hốc mắt đen to, miệng rộng răng kim, mang sáng lục trên sườn; vây
    // màng trong suốt ánh tím lục dọc lưng và cẳng tay; không có chân, hông nối đuôi cá dài 11 đốt, vây đuôi ngang. Đứng: lơ lửng
    // thẳng, đuôi cuộn dưới; bơi, đuổi: cả thân ngả ngang, đuôi quẫy lên xuống, tay ép ra sau; đuổi thì vọt từng cơn, đâm giáo.
    function finman() {
      const r = humanoid({ hipH: 0, torso: 0.62, chestW: 0.15, upper: 0.36, fore: 0.36, armR: [0.036, 0.024], neck: 0.13, skin: '#a9bfc4' });
      for (const h of r.hip) r.hips.remove(h);
      const skin = r.skin, dark = flat('#0a0d10', { roughness: 0.15, metalness: 0.4 }), memb = fin('#7a5cff'), memb2 = fin('#4fe0b0'), gill = glow('#6dff9a');
      const root = new T.Group(), pose = J(root, 0, 1.25, 0);
      pose.add(r.root);
      // sườn lộ, mang sáng
      for (let i = 0; i < 5; i++) add(r.spine, GEO.box, flat('#8ea5ab'), 0, 0.5 - i * 0.07, 0.07, 0.24 - i * 0.015, 0.014, 0.03);
      for (const sg of [-1, 1]) for (let i = 0; i < 4; i++) add(r.spine, GEO.box, gill, sg * 0.125, 0.46 - i * 0.05, 0.02, 0.012, 0.016, 0.1, 0, sg * 0.25, 0);
      // vây lưng dọc sống lưng (màng)
      for (let i = 0; i < 6; i++) add(r.spine, GEO.cone4, i % 2 ? memb : memb2, 0, 0.55 - i * 0.09, -0.09, 0.006, 0.22 - i * 0.015, 0.09, -0.9, 0, 0);
      // đầu: sọ dài trọc, hốc mắt đen, tai vây, miệng rộng răng kim
      add(r.head, GEO.ball2, skin, 0, 0.1, 0.0, 0.1, 0.13, 0.12);
      add(r.head, GEO.ball, skin, 0, 0.02, 0.05, 0.075, 0.06, 0.08);
      for (const sg of [-1, 1]) {
        add(r.head, GEO.ball2, dark, sg * 0.045, 0.09, 0.09, 0.035, 0.05, 0.025, 0, 0, sg * 0.35);
        add(r.head, GEO.ball, glow('#9ff8ff'), sg * 0.05, 0.1, 0.112, 0.006, 0.006, 0.004);
        add(r.head, GEO.cone4, memb, sg * 0.1, 0.1, -0.01, 0.008, 0.2, 0.09, -0.5, 0, -sg * 1.25);
      }
      const jaw = J(r.head, 0, 0.0, 0.05);
      add(jaw, GEO.box, flat('#1a0f12'), 0, 0, 0.06, 0.09, 0.02, 0.02);
      for (let k = 0; k < 7; k++) add(jaw, GEO.cone, flat('#f0ead8'), (k - 3) * 0.012, -0.006, 0.066, 0.004, 0.022, 0.004, PI, 0, 0);
      // vây màng cẳng tay, ngón dài có màng
      for (const el of r.el) add(el, GEO.cone4, memb, 0, -0.18, -0.05, 0.006, 0.3, 0.1, PI - 0.2, 0, 0);
      for (const hd of r.hand) { add(hd, GEO.ball, fin('#86b9c4'), 0, -0.06, 0, 0.045, 0.09, 0.012); for (let f = 0; f < 3; f++) add(hd, GEO.cone, skin, (f - 1) * 0.02, -0.02, 0, 0.006, 0.13, 0.006, PI, 0, 0); }
      // giáo xương trong tay phải
      const spear = J(r.hand[1], 0, -0.03, 0);
      add(spear, limbGeo(0.011, 0.011, 5), flat('#d8d0bc'), 0, 0.95, 0, 1, 1.9, 1);
      add(spear, GEO.cone4, flat('#f2ecdc'), 0, 0.95, 0, 0.028, 0.24, 0.028);
      for (const sg of [-1, 1]) add(spear, GEO.cone4, flat('#f2ecdc'), sg * 0.035, 0.95, 0, 0.012, 0.13, 0.012, 0, 0, -sg * 0.4);
      // đuôi cá liền: 8 khúc côn nối tiếp (mỗi khúc bắt đầu đúng chỗ khúc trước dừng, cùng bán kính: không lộ đốt), dẹt ngang
      // như thân cá, vảy sẫm dọc lưng, vây lưng và vây bụng màng, vây đuôi hình lưỡi liềm ngang
      const segs = [],
        NT = 8,
        TL = 0.16,
        rad = (i) => 0.13 * Math.pow(1 - i / NT, 0.8) + 0.022;
      let p = r.hips;
      for (let i = 0; i < NT; i++) {
        const j = J(p, 0, i ? -TL : 0.02, 0);
        add(j, limbGeo(rad(i), rad(i + 1), 9), i < 2 ? skin : flat('#7d97a8'), 0, 0.02, 0, 1, TL + 0.02, 0.78);
        add(j, limbGeo(rad(i) * 0.5, rad(i + 1) * 0.5, 5), flat('#4e6878'), 0, 0.02, -rad(i) * 0.45, 1, TL + 0.02, 0.6);
        if (i > 0 && i < 6) add(j, GEO.cone4, memb, 0, -TL * 0.4, -rad(i) * 0.75, 0.006, 0.07 + rad(i) * 0.5, 0.07, -1.85, 0, 0);
        if (i === 2) add(j, GEO.cone4, memb2, 0, -TL * 0.4, rad(i) * 0.75, 0.006, 0.1, 0.06, -1.3, 0, 0);
        segs.push(j);
        p = j;
      }
      // vây đuôi lưỡi liềm: hai thuỳ ngang, cuống đuôi thắt
      const fluke = J(p, 0, -TL, 0);
      for (const sg of [-1, 1]) {
        add(fluke, GEO.cone4, memb, sg * 0.03, 0, 0, 0.012, 0.36, 0.12, 0, 0, sg * 2.35);
        add(fluke, GEO.cone4, memb2, sg * 0.05, -0.03, 0, 0.008, 0.22, 0.07, 0, 0, sg * 2.0);
      }
      const cur = {};
      return {
        root, size: 2.1, eye: 1.2,
        update(t, dt, m, spd) {
          const run = m === 'chase', swim = m !== 'idle';
          ease(cur, 'tilt', swim ? 1.4 : 0.15, dt, 2.5);
          ease(cur, 'A', m === 'idle' ? 0.12 : run ? 0.5 : 0.3, dt);
          ease(cur, 'w', m === 'idle' ? 1.8 : run ? 9 : 5, dt);
          cur.ph = (cur.ph || 0) + dt * (cur.w + spd);
          const dash = run ? pulse(t, 1.3, 4) : 0;
          pose.rotation.x = cur.tilt;
          pose.position.y = 1.25 - cur.tilt * 0.5 + 0.08 * S(t * 1.1);
          r.spine.rotation.x = -cur.A * 0.25 * S(cur.ph + 0.9);
          // đuôi: sóng chạy từ hông ra vây (đứng yên: cuộn nhẹ sang bên)
          segs.forEach((j, i) => {
            j.rotation.x = cur.A * (0.2 + i * 0.07) * S(cur.ph - i * 0.55) + (swim ? 0 : 0.12);
            j.rotation.z = swim ? 0 : 0.18 * S(t * 0.6 - i * 0.3);
          });
          r.neck.rotation.x = -cur.tilt * 0.75 + 0.05 * S(t * 1.3);
          r.head.rotation.y = swim ? 0.06 * S(t * 3) : 0.45 * S(t * 0.4);
          jaw.rotation.x = 0.12 + (run ? 0.35 * dash : 0.05 * S(t * 2));
          for (const k of [0, 1]) {
            const sw = swim ? 1 : 0;
            r.sh[k].rotation.x = k && run ? -1.55 : sw * (0.2 + 0.1 * S(cur.ph + k)) + (1 - sw) * (-0.25 + 0.1 * S(t + k));
            r.sh[k].rotation.z = (k ? 1 : -1) * (sw ? 0.12 : 0.3); // (tay trái ra trái, tay phải ra phải: không bắt chéo)
            r.el[k].rotation.x = k && run ? -0.2 - 0.9 * (1 - dash) : -0.4 + 0.1 * S(t * 1.4 + k);
          }
          // giáo: đứng thì chĩa tới trước ngực, bơi thì chĩa theo hướng đầu (thân đã ngả ngang)
          spear.rotation.x = (PI / 2) * (1 - cur.tilt / 1.4) - (r.sh[1].rotation.x + r.el[1].rotation.x);
          cur.dash = dash;
        },
      };
    }

    /* =============== 3. Người San Hô (làm lại) =============== */
    // thân gầy còng, da nâu xám như vỏ cây ngâm nước, váy tảo; san hô mọc xuyên từ vai, lưng, cẳng tay và nửa đầu: nhánh cong
    // thon chẻ nhiều tầng, đầu nhánh sáng; nửa mặt bị san hô phủ, một hốc mắt đen trống, một mắt sáng đỏ; hàm trễ xuống. Đứng:
    // đung đưa như rong, cành đưa trễ; đi: sải dài lắc lư; đuổi: đổ người tới, hai tay dài vươn ra quờ quạng.
    function coralman() {
      const r = humanoid({ hipH: 1.0, thigh: 0.5, shin: 0.52, legR: [0.055, 0.032], torso: 0.62, chestW: 0.16, upper: 0.42, fore: 0.42, armR: [0.04, 0.026], skin: '#6e6a58' });
      const bark = flat('#57533f'), skin = r.skin;
      for (const j of [r.spine, r.sh[0], r.hip[0]]) for (let i = 0; i < 2; i++) add(j, GEO.rock, bark, (rnd() - 0.5) * 0.08, (j === r.spine ? 0.4 : -0.12) - i * 0.09, 0.05, 0.035, 0.05, 0.025, rnd(), rnd(), 0);
      for (let i = 0; i < 4; i++) add(r.spine, GEO.box, flat('#4e4a38'), 0, 0.48 - i * 0.07, 0.075, 0.22, 0.014, 0.02);
      const RED = flat('#d2432f'), PINK = flat('#ff6f8a'), PURP = flat('#a64fd0'), ORNG = flat('#f08a3b'), tipM = glow('#ffd2e2');
      const branches = [];
      const V = (x, y, z) => new T.Vector3(x, y, z);
      // (cụm san hô dày, ngắn: nhánh to, ba tầng chẻ, như san hô thật mọc trùm vai)
      for (const [j, x, y, z, d, len, r0, col] of [
        [r.chest, -0.12, 0.02, -0.03, V(-0.7, 1, -0.2), 0.16, 0.036, RED], [r.chest, -0.08, 0.04, -0.08, V(-0.2, 1, -0.8), 0.14, 0.03, ORNG],
        [r.chest, 0.12, 0.03, -0.03, V(0.7, 1, -0.2), 0.16, 0.036, PURP], [r.chest, 0.08, 0.05, -0.08, V(0.3, 1, -0.7), 0.13, 0.03, PINK],
        [r.spine, 0.0, 0.32, -0.09, V(0, 0.4, -1), 0.14, 0.03, RED], [r.spine, -0.04, 0.18, -0.08, V(-0.4, 0.2, -1), 0.11, 0.026, PURP],
        [r.el[0], 0, -0.15, -0.03, V(-0.5, -0.2, -1), 0.11, 0.024, PINK],
      ]) branch(J(j, x, y, z), d, len, r0, 3, col, tipM, branches);
      // đầu: sọ hẹp, nửa trái bị san hô phủ
      add(r.head, GEO.ball2, skin, 0, 0.08, 0.0, 0.08, 0.11, 0.09);
      add(r.head, GEO.ball, skin, 0, 0.0, 0.04, 0.06, 0.05, 0.06);
      add(r.head, GEO.rock, PURP, -0.05, 0.12, 0.02, 0.07, 0.08, 0.07);
      branch(J(r.head, -0.04, 0.17, 0.0), V(-0.3, 1, 0.1), 0.12, 0.026, 3, PURP, tipM, branches);
      branch(J(r.head, 0.03, 0.18, -0.03), V(0.4, 1, -0.3), 0.1, 0.022, 2, PINK, tipM, branches);
      add(r.head, GEO.ball2, flat('#050607', { roughness: 0.2 }), 0.035, 0.085, 0.075, 0.025, 0.03, 0.02);
      add(r.head, GEO.ball, glow('#ff4433'), 0.037, 0.085, 0.092, 0.007, 0.007, 0.004);
      const jaw = J(r.head, 0, -0.01, 0.04);
      add(jaw, GEO.box, flat('#1a120e'), 0, -0.02, 0.04, 0.06, 0.035, 0.02);
      for (let k = 0; k < 5; k++) add(jaw, GEO.cone, flat('#d8ccb0'), (k - 2) * 0.012, 0.0, 0.05, 0.004, 0.018, 0.004, PI, 0, 0);
      // ngón tay dài cong như rễ
      for (const hd of r.hand) for (let f = 0; f < 4; f++) { const fj = J(hd, (f - 1.5) * 0.016, 0, 0); fj.rotation.x = -0.4; add(fj, limbGeo(0.008, 0.003, 4), bark, 0, 0, 0, 1, 0.16, 1); }
      // váy tảo
      const kelp = [];
      for (let i = 0; i < 11; i++) { const a = (i / 11) * PI * 2, kj = J(r.hips, C(a) * 0.13, 0.02, S(a) * 0.09); add(kj, GEO.cone, flat(i % 2 ? '#2f5f38' : '#4a8040'), 0, 0, 0, 0.03, -0.42, 0.012, 0, -a, 0); kelp.push(kj); }
      const cur = {};
      return {
        root: r.root, size: 2.0, eye: 1.4,
        update(t, dt, m, spd) {
          const run = m === 'chase';
          if (m === 'curl') spd = 0;
          ease(cur, 'a', m === 'idle' || m === 'curl' ? 0 : run ? 0.85 : 0.45, dt);
          ease(cur, 'lean', run ? 0.6 : m === 'move' ? 0.22 : 0.18, dt);
          cur.ph = (cur.ph || 0) + dt * (m === 'idle' || m === 'curl' ? 0 : 3.4 + spd * 1.3);
          const sway = S(t * 0.7) * (m === 'idle' ? 0.1 : 0.05);
          r.spine.rotation.set(cur.lean + 0.03 * S(t * 1.1), 0.1 * S(cur.ph) * cur.a, sway);
          r.hips.position.y = 1.0 + Math.abs(S(cur.ph)) * 0.05 * cur.a - cur.lean * 0.1;
          gait(r, cur.ph, cur.a, { hipBias: -cur.lean * 0.6, kneeBias: 0.1 + cur.lean * 0.3, arm: run ? 0.25 : 0.5, armBias: run ? -1.45 : -0.1, elbowBias: run ? 0.2 : -0.1 });
          for (const k of [0, 1]) r.hand[k].rotation.x = (run ? -0.4 : 0) + 0.35 * S(t * (run ? 4 : 1.2) + k * 1.7);
          r.head.rotation.set(-cur.lean * 0.6 + 0.06 * S(t * 0.5), 0.35 * S(t * 0.33) * (run ? 0.2 : 1), 0.3 * S(t * 0.47) - 0.15);
          jaw.rotation.x = 0.15 + (run ? 0.25 * Math.max(0, S(t * 3)) : 0.04 * S(t * 0.9));
          branches.forEach((b, i) => { b.j.rotation.x = 0.07 * S(t * 1.3 - b.d * 0.7 + i * 0.4) + cur.a * 0.08 * S(cur.ph * 2 - b.d); b.j.rotation.z = 0.05 * S(t * 0.9 + i); });
          kelp.forEach((k, i) => (k.rotation.x = 0.15 * S(t * 1.5 + i) + cur.a * 0.3 * S(cur.ph + i * 0.3)));
          ease(cur, 'curl', m === 'curl' ? 1 : 0, dt, m === 'curl' ? 1.6 : 3.5); // (đứng dậy nhanh hơn nằm xuống)
          curlPose(r, cur.curl, 1.0);
        },
      };
    }

    /* =============== Quái vật B (mới): Cá Mập Xương =============== */
    // nửa trước còn thịt: đầu tù to, hàm dưới bản lề mở rộng với ba hàng răng, mắt trắng đục; nửa sau chỉ còn xương: cột sống,
    // sườn cong, trái tim sáng đỏ đập trong lồng sườn, vây rách. Bơi: quẫy thân sang hai bên (sóng ngang), đuôi xương; đuổi: vọt
    // tới từng cơn rất nhanh, há hàm ở mỗi cú vọt, lắc đầu.
    function boneShark() {
      const root = new T.Group(), body = J(root, 0, 0, 0);
      const flesh = flat('#3a4448'), belly = flat('#8a8e86'), bone = flat('#d9d2bf'), gum = flat('#5a1c22');
      const N = 16, L = 2.6, segs = [];
      let p = body;
      for (let i = 0; i < N; i++) {
        const j = J(p, 0, 0, i ? -L : 0), t = i / N, rr = 3.6 * Math.sin(PI * Math.min(1, 0.25 + t * 0.85)) * (1 - t * 0.45) + 0.4;
        if (i < 6) {
          add(j, GEO.ball, flesh, 0, 0, -L * 0.5, rr, rr * 1.05, L * 0.78);
          add(j, GEO.ball, belly, 0, -rr * 0.45, -L * 0.5, rr * 0.8, rr * 0.55, L * 0.72);
          if (i === 5) for (let k = 0; k < 8; k++) add(j, GEO.cone4, flesh, C(k) * rr * 0.7, S(k * 1.7) * rr * 0.6, -L * 0.95, 0.4, 1.2 + rnd(), 0.3, PI / 2 + (rnd() - 0.5), 0, rnd() * 3);
        } else {
          add(j, limbGeo(0.35, 0.3, 6), bone, 0, 0, 0, 1, L, 1, PI / 2, 0, 0);
          if (i < 13) {
            const ribR = rr * 0.95;
            for (const sg of [-1, 1]) add(j, new T.TorusGeometry(ribR, 0.14, 4, 10, PI * 0.85), bone, 0, -ribR * 0.1, -L * 0.5, 1, 1, 1, 0, sg * PI / 2, PI * 0.58);
          }
        }
        segs.push(j); p = j;
      }
      // tim sáng đập trong lồng sườn
      const heart = keep(add(segs[7], GEO.ball2, glow('#ff3b2f'), 0, -0.3, -L * 0.5, 1.1, 1.3, 1.1));
      const hl = plight('#ff3b2f', 2.5, 22, 2); segs[7].add(hl); hl.position.set(0, -0.3, -L * 0.5);
      // đuôi xương: hai thuỳ
      for (const sg of [-1, 1]) add(p, limbGeo(0.25, 0.08, 5), bone, 0, 0, -L, 1, 7, 1, PI / 2 + sg * 0.75, 0, 0);
      // vây lưng, vây ngực rách
      add(segs[2], GEO.cone4, flesh, 0, 3.4, -1, 0.25, 4.5, 2.2, -0.45, 0, 0);
      for (const sg of [-1, 1]) add(segs[2], GEO.cone4, flesh, sg * 3.2, -1.6, 0, 0.2, 5, 1.8, -1.1, 0, -sg * 1.1);
      // đầu, hàm
      const head = J(body, 0, 0, 0);
      add(head, GEO.ball, flesh, 0, 0.6, 2.2, 3.4, 2.9, 4.2);
      for (const sg of [-1, 1]) {
        add(head, GEO.ball2, flat('#e8ecea', { roughness: 0.3 }), sg * 2.55, 1.2, 4.0, 0.55, 0.5, 0.45);
        add(head, GEO.ball, flat('#9aa6a8'), sg * 2.75, 1.2, 4.15, 0.2, 0.22, 0.12);
        for (let k = 0; k < 4; k++) add(head, GEO.box, flat('#1c2226'), sg * 3.1, 0.3, 1.4 - k * 0.7, 0.1, 1.6, 0.18, 0, 0, sg * 0.15);
      }
      const teeth = (pp, y, z0, rows, down) => {
        for (let rw = 0; rw < rows; rw++)
          for (let k = 0; k < 13; k++) {
            const a = -1.2 + (k / 12) * 2.4, R = 2.6 - rw * 0.35;
            add(pp, GEO.cone, bone, S(a) * R, y, z0 + C(a) * R * 0.9 - rw * 0.5, 0.16, 0.8 - rw * 0.15, 0.16, down ? PI : 0, 0, 0);
          }
      };
      add(head, GEO.ball, gum, 0, -0.9, 3.4, 2.8, 0.5, 2.6);
      teeth(head, -0.75, 3.4, 3, true);
      const jaw = J(head, 0, -1.2, 0.2);
      add(jaw, GEO.ball, belly, 0, -0.6, 2.6, 3.0, 0.9, 3.4);
      add(jaw, GEO.ball, gum, 0, -0.15, 3.0, 2.6, 0.35, 2.6);
      teeth(jaw, -0.1, 3.2, 3, false);
      const cur = {};
      return {
        root, size: 44, eye: 0, swimY: 8, monster: true, frame: [[0, 8, -12], [30, 16, 34]],
        update(t, dt, m, spd, curve) {
          const run = m === 'chase';
          const dash = run ? pulse(t, 1.6, 3) : 0;
          ease(cur, 'A', m === 'idle' ? 0.06 : run ? 0.16 + dash * 0.1 : 0.11, dt, 5);
          cur.ph = (cur.ph || 0) + dt * (m === 'idle' ? 1.6 : 4 + spd * 0.4 + dash * 8);
          segs.forEach((j, i) => { j.rotation.y = (curve || 0) * L + cur.A * (0.1 + i * 0.07) * S(cur.ph - i * 0.45); });
          head.rotation.y = -cur.A * 0.6 * S(cur.ph + 0.3) + (run ? 0.12 * S(t * 7) * dash : 0);
          jaw.rotation.x = 0.06 + 0.04 * S(t * 1.3) + dash * 0.85 + (m === 'move' ? 0.1 : 0);
          const beat = 1 + 0.18 * pulse(t, run ? 0.45 : 0.9, 6);
          heart.scale.set(1.1 * beat, 1.3 * beat, 1.1 * beat);
          hl.intensity = 1.8 + 2 * (beat - 1) * 5;
          body.position.y = 0.4 * S(t * 0.7);
        },
      };
    }

    /* =============== Bầy Rồng Lươn Đen: 5 con bơi cùng nhau =============== */
    function eelPack() {
      const root = new T.Group(), eels = [];
      const SLOTS = [[0, 0, 0], [-14, 6, -22], [15, -3, -26], [-6, -8, -48], [10, 9, -52]];
      SLOTS.forEach(([x, y, z], i) => {
        const e = eelDragon(0.62);
        const holder = J(root, x, y, z);
        holder.add(e.root);
        eels.push({ e, holder, x, y, z, ph: i * 1.37, k: 0.8 + (i % 3) * 0.12 });
      });
      return {
        root, size: 70, eye: 0, swimY: 10, monster: true, frame: [[0, 6, -24], [70, 30, 50]],
        update(t, dt, m, spd, curve, cam) {
          eels.forEach(({ e, holder, x, y, z, ph, k }) => {
            // mỗi con lượn lệch nhau quanh chỗ của nó trong bầy, nhịp riêng
            holder.position.set(x + S(t * 0.5 * k + ph) * 4, y + S(t * 0.37 * k + ph * 2) * 3, z + C(t * 0.3 + ph) * 3);
            holder.rotation.y = 0.15 * S(t * 0.5 * k + ph + 1.2);
            e.update(t * k + ph * 3, dt, m, spd, curve, cam);
          });
        },
      };
    }

    /* =============== 4. Người Canh Hầm =============== */
    function keeper() {
      const r = humanoid({ hipH: 0.86, thigh: 0.44, shin: 0.46, legR: [0.05, 0.03], torso: 0.5, chestW: 0.15, upper: 0.42, fore: 0.42, armR: [0.032, 0.022], neck: 0.14, skin: '#d8d4c8' });
      const pale = r.skin, dark = flat('#1c1a1e');
      for (let i = 0; i < 4; i++) add(r.spine, GEO.box, flat('#bdb8aa'), 0, 0.42 - i * 0.07, 0.085, 0.2, 0.012, 0.02);
      // đầu: sọ to trọc, mắt lồi trắng tròng sáng lam, tai nhọn, miệng rộng hé
      // đầu: sọ to dài ra sau, cằm nhọn, má hóp; hai hốc mắt đen lớn hình hạt hạnh xếch (như người ngoài hành tinh), ánh
      // phản chiếu nhỏ; tai nhọn; miệng rộng hé, răng nhỏ nhọn
      add(r.head, GEO.ball2, pale, 0, 0.13, -0.04, 0.12, 0.15, 0.15);
      add(r.head, GEO.ball, pale, 0, 0.02, 0.05, 0.075, 0.08, 0.07);
      add(r.head, GEO.cone, pale, 0, -0.05, 0.06, 0.04, -0.06, 0.04);
      for (const sg of [-1, 1]) add(r.head, GEO.ball, flat('#a9a598'), sg * 0.06, 0.0, 0.07, 0.02, 0.04, 0.02);
      const eyes = [-1, 1].map((sg) => {
        add(r.head, GEO.ball2, flat('#030305', { roughness: 0.08, metalness: 0.6 }), sg * 0.05, 0.08, 0.1, 0.045, 0.07, 0.03, 0, sg * 0.25, sg * 0.55);
        return keep(add(r.head, GEO.ball, glow('#cfe8ff'), sg * 0.056, 0.1, 0.128, 0.006, 0.006, 0.004));
      });
      for (const sg of [-1, 1]) add(r.head, GEO.cone4, pale, sg * 0.12, 0.12, -0.03, 0.02, 0.14, 0.04, 0, 0, -sg * 1.25);
      const jaw = J(r.head, 0, -0.02, 0.06);
      add(jaw, GEO.box, dark, 0, 0, 0.05, 0.1, 0.022, 0.02);
      for (let k = 0; k < 9; k++) add(jaw, GEO.cone, flat('#ece6d4'), (k - 4) * 0.01, 0.006, 0.058, 0.003, 0.016, 0.003, PI, 0, 0);
      // ngón tay dài
      for (const hd of r.hand) for (let f = 0; f < 4; f++) { const fj = J(hd, (f - 1.5) * 0.015, 0, 0); fj.rotation.x = -0.3; add(fj, limbGeo(0.008, 0.004, 4), pale, 0, 0, 0, 1, 0.13, 1); }
      // đèn đá sáng trong tay trái
      const lamp = J(r.hand[0], 0, -0.14, 0.02);
      add(lamp, GEO.disc, flat('#5a5040'), 0, 0.07, 0, 0.06, 0.02, 0.06);
      add(lamp, GEO.disc, flat('#5a5040'), 0, -0.07, 0, 0.06, 0.02, 0.06);
      for (let i = 0; i < 4; i++) add(lamp, limbGeo(0.006, 0.006, 4), flat('#6d6250'), C((i / 4) * PI * 2) * 0.05, 0.07, S((i / 4) * PI * 2) * 0.05, 1, 0.14, 1);
      add(lamp, GEO.ball, glow('#9ffcff'), 0, 0, 0, 0.04, 0.05, 0.04);
      const light = plight('#7ff6ff', 1.2, 2.6, 2); lamp.add(light);
      const cur = {};
      return {
        root: r.root, size: 1.7, eye: 1.0,
        update(t, dt, m, spd) {
          const run = m === 'chase';
          ease(cur, 'q', run ? 1 : 0, dt, 2.5); // 0: khom đứng, 1: chạy bốn chân
          ease(cur, 'a', m === 'idle' ? 0 : run ? 0.9 : 0.35, dt);
          cur.ph = (cur.ph || 0) + dt * (m === 'idle' ? 0 : run ? 9 + spd * 2 : 3 + spd);
          const q = cur.q;
          r.spine.rotation.x = 0.5 + q * 0.85 + 0.03 * S(t * 1.3);
          r.hips.position.y = 0.86 - q * 0.22 - (1 - q) * 0.08 + Math.abs(S(cur.ph)) * 0.05 * cur.a;
          gait(r, cur.ph, cur.a * (1 - q * 0.2), { hipBias: -0.35 - q * 0.5, kneeBias: 0.45 + q * 0.4, arm: 0.5 * (1 - q) });
          // bốn chân: tay chống xuống đất, vung theo chân bên kia
          for (const k of [0, 1]) {
            const p = cur.ph + (k ? 0 : PI) + 0.4;
            r.sh[k].rotation.x = (1 - q) * (k ? -0.2 : -0.7) + q * (-1.35 - 0.7 * cur.a * S(p));
            r.el[k].rotation.x = (1 - q) * -0.6 + q * (0.3 * Math.max(0, C(p)) - 0.1);
          }
          r.neck.rotation.x = -(0.25 + q * 0.95);
          r.head.rotation.set(0.15 * S(t * 0.7) * (1 - q), 0.5 * S(t * 0.43) * (1 - q), 0.35 * S(t * 0.31) * (1 - q));
          eyes.forEach((e) => (e.visible = S(t * 0.37) < 0.97)); // (ánh phản chiếu trong hốc mắt: thỉnh thoảng tắt như chớp)
          jaw.rotation.x = 0.1 + (run ? 0.35 : 0.05) * Math.abs(S(t * (run ? 6 : 0.8)));
          light.intensity = 1.0 + 0.25 * S(t * 5.3) + 0.15 * S(t * 13);
        },
      };
    }

    /* =============== 5. Người Rêu Đá =============== */
    function mossGiant() {
      // tay dài quá gối (sải tay khoảng 7), bàn tay đá to có bốn ngón móc: đủ nắm gọn một tàu ngầm nhỏ
      const r = humanoid({ hipH: 2.6, hipW: 0.36, thigh: 1.3, shin: 1.35, legR: [0.32, 0.24], torso: 1.8, chestW: 0.62, upper: 1.6, fore: 1.55, armR: [0.3, 0.26], neck: 0.25, skin: '#6f7468', sides: 5 });
      const moss = flat('#4f7a3a'), moss2 = flat('#6b9a46'), stone = r.skin;
      add(r.spine, GEO.rock, stone, 0, 1.15, 0, 0.75, 0.75, 0.55);
      for (let i = 0; i < 14; i++) {
        const j = [r.spine, r.sh[0], r.sh[1], r.hip[0], r.hip[1], r.chest][i % 6];
        add(j, GEO.ball, i % 2 ? moss : moss2, (rnd() - 0.5) * 0.5, -0.2 - rnd() * 0.6 + (j === r.spine ? 1.3 : 0), 0.22 + rnd() * 0.12, 0.22, 0.14, 0.12);
      }
      for (const sg of [-1, 1]) add(r.chest, GEO.rock, stone, sg * 0.62, 0.05, 0, 0.36, 0.3, 0.32);
      for (let i = 0; i < 3; i++) add(r.spine, GEO.box, glow('#5fe0b0'), (i - 1) * 0.18, 1.1 - i * 0.2, 0.42, 0.03, 0.3, 0.02, 0, 0, (i - 1) * 0.5);
      // đầu đá: mày nặng, mắt sáng lục, râu rêu dài
      add(r.head, GEO.rock, stone, 0, 0.3, 0, 0.32, 0.36, 0.3);
      add(r.head, GEO.box, flat('#5b6056'), 0, 0.42, 0.22, 0.42, 0.08, 0.12);
      for (const sg of [-1, 1]) add(r.head, GEO.ball, glow('#8dff9a'), sg * 0.11, 0.32, 0.27, 0.04, 0.025, 0.02);
      const beard = [];
      for (let i = 0; i < 10; i++) { const bj = J(r.head, (i - 4.5) * 0.05, 0.12, 0.2 + Math.abs(i - 4.5) * -0.012); add(bj, GEO.cone, i % 2 ? moss : moss2, 0, 0, 0, 0.05, -(0.5 + rnd() * 0.35), 0.03); beard.push(bj); }
      add(r.head, GEO.ball, moss, 0, 0.6, -0.05, 0.3, 0.1, 0.28);
      const fingers = [];
      for (const hd of r.hand) {
        add(hd, GEO.rock, stone, 0, -0.32, 0.05, 0.42, 0.38, 0.3);
        for (let f = 0; f < 4; f++) {
          const fj = J(hd, (f - 1.5) * 0.17 + (f === 0 ? -0.1 : 0), -0.6, 0.12);
          add(fj, limbGeo(0.09, 0.05, 5), stone, 0, 0, 0, 1, 0.55, 1);
          add(fj, GEO.cone4, flat('#3f443c'), 0, -0.55, 0, 0.06, -0.25, 0.06);
          fingers.push(fj);
        }
      }
      const cur = {};
      return {
        root: r.root, size: 6.4, eye: 4.6,
        update(t, dt, m, spd) {
          const run = m === 'chase';
          if (m === 'curl') spd = 0;
          ease(cur, 'a', m === 'idle' || m === 'curl' ? 0 : run ? 0.7 : 0.38, dt, 2);
          ease(cur, 'lean', run ? 0.32 : 0.05, dt, 2);
          cur.ph = (cur.ph || 0) + dt * (m === 'idle' || m === 'curl' ? 0 : run ? 4.2 + spd * 0.5 : 1.6 + spd * 0.3);
          const breathe = S(t * 0.9) * 0.02;
          r.spine.rotation.set(cur.lean + breathe, 0.12 * S(cur.ph) * cur.a, 0.06 * S(cur.ph) * cur.a);
          r.hips.position.y = 2.6 - cur.lean * 0.3 + (1 - Math.abs(C(cur.ph))) * 0.12 * cur.a;
          gait(r, cur.ph, cur.a, { arm: 1.0, hipBias: -cur.lean * 0.5, kneeBias: 0.1 + cur.lean * 0.3, elbowBias: run ? -0.4 : 0 });
          r.head.rotation.set(-cur.lean * 0.6 + 0.04 * S(t * 0.5), 0.25 * S(t * 0.21) * (run ? 0.1 : 1), 0);
          beard.forEach((b, i) => (b.rotation.x = 0.08 * S(t * 1.3 + i * 0.5) - cur.a * 0.15 * S(cur.ph * 2)));
          // đuổi: hai tay vươn ra trước, bàn tay mở ra rồi chộp lại theo nhịp
          const grab = run ? pulse(t, 1.1, 2) : 0;
          if (run) for (const k of [0, 1]) { r.sh[k].rotation.x = -1.25 - 0.25 * grab + 0.1 * S(cur.ph + k * PI); r.el[k].rotation.x = -0.25 - 0.5 * grab; }
          fingers.forEach((f) => (f.rotation.x = run ? -0.2 + 1.3 * grab : 0.5));
          ease(cur, 'curl', m === 'curl' ? 1 : 0, dt, m === 'curl' ? 1.4 : 3);
          curlPose(r, cur.curl, 2.6);
        },
      };
    }

    /* =============== Quái vật A: Rồng Lươn Đen (một con; bầy: eelPack) =============== */
    function eelDragon(scale = 1) {
      const outer = new T.Group(), root = J(outer, 0, 0, 0), N = 46, L = 1.55;
      root.scale.setScalar(scale);
      const skin = flat('#101317'), belly = flat('#2a2f33'), frill = fin('#8f5cff'), spotA = glow('#7ff6ff'), spotB = glow('#c9a6ff');
      const segs = [];
      let p = root;
      for (let i = 0; i < N; i++) {
        const j = J(p, 0, 0, i ? -L : 0), t = i / N, rr = t < 0.16 ? 1.7 + t * 6 : 2.65 * Math.pow(1 - (t - 0.16) / 0.84, 0.85) + 0.18;
        add(j, GEO.ball, skin, 0, 0, -L * 0.5, rr, rr * 0.92, L * 0.75);
        add(j, GEO.ball, belly, 0, -rr * 0.35, -L * 0.5, rr * 0.8, rr * 0.6, L * 0.7);
        if (i % 2 === 0) for (const sg of [-1, 1]) add(j, GEO.ball, i % 4 ? spotA : spotB, sg * rr * 0.92, rr * 0.1, -L * 0.5, 0.18, 0.18, 0.18);
        if (i % 3 === 0 && i > 2) add(j, GEO.cone4, frill, 0, rr * 0.8, -L * 0.5, 0.06, rr * 0.7, 0.5, -0.5, 0, 0);
        segs.push({ j, rr });
        p = j;
      }
      // đầu: sọ dài, hàm dưới mở được, răng nhọn, mắt hổ phách, diềm vây xoè sau đầu, cần câu đèn
      const head = J(root, 0, 0, 0);
      add(head, GEO.ball, skin, 0, 0.4, 2.2, 1.7, 1.15, 2.8);
      for (const sg of [-1, 1]) {
        add(head, GEO.ball, glow('#ffbf4a'), sg * 1.15, 0.85, 3.4, 0.24, 0.16, 0.2);
        for (let k = 0; k < 7; k++) add(head, GEO.cone, frill, sg * 1.3, 0.4, 0.2, 0.08, 2.6 + k * 0.2, 0.3, -0.6 + k * 0.25, 0, -sg * (1.1 + k * 0.08));
      }
      for (let k = 0; k < 9; k++) add(head, GEO.cone, flat('#efe8d8'), (k - 4) * 0.33, -0.3, 4.2 - Math.abs(k - 4) * 0.25, 0.08, 0.5, 0.08, PI, 0, 0);
      const jaw = J(head, 0, -0.35, 0.6);
      add(jaw, GEO.ball, belly, 0, -0.1, 1.6, 1.45, 0.42, 2.4);
      for (let k = 0; k < 9; k++) add(jaw, GEO.cone, flat('#efe8d8'), (k - 4) * 0.3, 0.1, 3.4 - Math.abs(k - 4) * 0.25, 0.07, 0.45, 0.07);
      const lure = [];
      let lp = J(head, 0, 1.4, 2.4);
      for (let k = 0; k < 6; k++) { const lj = J(lp, 0, k ? 0.7 : 0, 0); add(lj, limbGeo(0.07, 0.06, 5), skin, 0, 0.7, 0, 1, -0.7, 1); lure.push(lj); lp = lj; }
      const bulb = J(lp, 0, 0.7, 0);
      add(bulb, GEO.ball2, glow('#d8fbff'), 0, 0, 0, 0.35, 0.42, 0.35);
      const light = plight('#9ffcff', 3, 30, 2); bulb.add(light);
      const cur = {};
      return {
        root: outer, size: 72 * scale, eye: 0, swimY: 10, monster: true,
        update(t, dt, m, spd, curve) {
          const run = m === 'chase';
          ease(cur, 'A', m === 'idle' ? 0.05 : run ? 0.2 : 0.12, dt, 2);
          cur.ph = (cur.ph || 0) + dt * (m === 'idle' ? 1.2 : 2.6 + spd * 0.25);
          // sóng uốn ngang chạy dọc thân; độ cong theo đường bơi để thân đi đúng vệt của đầu
          segs.forEach(({ j }, i) => { const k = i / N; j.rotation.y = (curve || 0) * L + cur.A * (0.15 + k * 1.2) * S(cur.ph - i * 0.38); j.rotation.x = 0.02 * S(t * 0.6 - i * 0.2); });
          head.rotation.y = -cur.A * 0.25 * S(cur.ph + 0.4);
          const bite = run ? pulse(t + 0.3, 2.6, 4) : 0;
          jaw.rotation.x = 0.08 + 0.05 * S(t * 1.7) + bite * 0.75;
          lure.forEach((lj, k) => (lj.rotation.x = 0.45 + 0.1 * S(t * 2.2 - k * 0.6) + (run ? 0.12 : 0)));
          light.intensity = 2.6 + 0.6 * S(t * 3.7);
        },
      };
    }

    /* =============== Quái vật C: Bạch Tuộc Mắt Vực =============== */
    function abyssEye() {
      const root = new T.Group(), big = J(root, 0, 0, 0), body = J(big, 0, 24, 0);
      big.scale.setScalar(1.9); // (to gấp 1,9 bản trước: cao khoảng 95)
      const skin = flat('#4a3b62'), skin2 = flat('#57466e'), suck = glow('#7ff6ff');
      // thân hình chuông
      const prof = [];
      for (let i = 0; i <= 12; i++) { const t = i / 12; prof.push(new T.Vector2(Math.max(0.01, 6.8 * Math.sin(t * PI * 0.92) * (1 - t * 0.25)), -2 + t * 15)); }
      const mantle = J(body, 0, 0, 0);
      add(mantle, new T.LatheGeometry(prof, 14), skin, 0, 0, 0);
      for (let i = 0; i < 30; i++) {
        const a = rnd() * PI * 2, h = 1 + rnd() * 9, rr = 6 * Math.sin(((h + 2) / 15) * PI * 0.92);
        add(mantle, GEO.ball, glow(i % 2 ? '#c9a6ff' : '#7ff6ff'), C(a) * rr, h, S(a) * rr, 0.18, 0.18, 0.18);
      }
      // một mắt khổng lồ phía trước: tròng ngà, mống vàng cam sáng, con ngươi khe ngang, mí trên chớp
      const eyeJ = J(body, 0, 3.2, 4.6);
      add(eyeJ, GEO.ball2, flat('#e9e2c8', { roughness: 0.25 }), 0, 0, 0, 3, 3, 2.2);
      const iris = keep(add(eyeJ, new T.CircleGeometry(1.9, 24), glow('#ffb347'), 0, 0, 2.18));
      add(eyeJ, GEO.box, flat('#0b0608'), 0, 0, 2.22, 2.4, 0.42, 0.05);
      const lid = J(eyeJ, 0, 0, 0);
      add(lid, new T.SphereGeometry(3.15, 16, 8, 0, PI * 2, 0, PI / 2), skin2, 0, 0, 0, 1, 1, 0.78);
      // 8 xúc tu, mỗi xúc tu 18 đốt nhỏ dần, giác hút sáng mặt dưới
      const arms = [];
      for (let k = 0; k < 8; k++) {
        const base = J(body, C((k / 8) * PI * 2) * 4.2, -1.6, S((k / 8) * PI * 2) * 4.2);
        base.rotation.y = -(k / 8) * PI * 2 + PI / 2;
        const segs = [];
        let p = base;
        for (let i = 0; i < 18; i++) {
          const j = J(p, 0, i ? -1.75 : 0, 0), rr = 1.15 * (1 - i / 19) + 0.1;
          add(j, limbGeo(rr, rr * 0.92, 7), i % 2 ? skin : skin2, 0, 0, 0, 1, 1.8, 1);
          if (i % 2 === 0) add(j, GEO.ball, suck, 0, -0.9, rr * 0.9, 0.16 + rr * 0.1, 0.16 + rr * 0.1, 0.08);
          segs.push(j); p = j;
        }
        arms.push({ base, segs, k });
      }
      const cur = {};
      return {
        root, size: 95, eye: 0, swimY: 0, monster: true, frame: [[0, 38, 0], [55, 34, 90]],
        update(t, dt, m, spd, curve, camPos) {
          const run = m === 'chase';
          const jet = run ? pulse(t, 1.8, 2) : m === 'move' ? 0.3 * pulse(t, 3, 2) : 0;
          ease(cur, 'tilt', run ? 1.05 : m === 'move' ? 0.5 : 0, dt, 2);
          body.rotation.x = cur.tilt + 0.05 * S(t * 0.7);
          mantle.scale.set(1 - jet * 0.12, 1 + jet * 0.1, 1 - jet * 0.12);
          body.position.y = 24 + 0.6 * S(t * 0.5);
          // xúc tu: sóng cuộn chạy từ gốc ra ngọn, lệch pha nhau; khi phụt nước thì khép ra sau rồi xoè
          arms.forEach(({ base, segs, k }) => {
            base.rotation.x = -1.0 + jet * 0.7 + cur.tilt * 0.3; // (xoè ra như váy, ngọn cuộn vào; phụt nước thì khép lại)
            segs.forEach((j, i) => { j.rotation.x = (m === 'idle' ? 0.14 : 0.08) * (1 + i * 0.08) * S(t * 1.6 - i * 0.45 + k * 0.8) + 0.06 * (1 - jet * 0.8); j.rotation.z = 0.05 * S(t * 1.1 - i * 0.3 + k); });
          });
          // mắt nhìn theo máy quay, chớp chậm
          if (camPos) { const lp = eyeJ.worldToLocal(camPos.clone()); iris.position.x = Math.max(-0.8, Math.min(0.8, lp.x * 0.02)); iris.position.y = Math.max(-0.8, Math.min(0.8, lp.y * 0.02)); }
          const blink = pulse(t + 1, 5.5, 30);
          lid.rotation.x = -1.5 + blink * 1.35;
        },
      };
    }

    function villager() { const r = humanoid({ hipH: 0.66, thigh: 0.33, shin: 0.33, torso: 0.4, chestW: 0.14, upper: 0.24, fore: 0.22, skin: '#8c8c86' }); add(r.head, GEO.ball, r.skin, 0, 0.08, 0, 0.1, 0.11, 0.1); return r.root; }

    // gộp mảnh tĩnh: trên mỗi khớp, các lưới lá (không có con, không keep) cùng vật liệu thành một lưới
    function bake(rootObj) {
      const parents = [];
      rootObj.traverse((o) => o.children.length && parents.push(o));
      for (const p of parents) {
        const by = new Map();
        for (const m of p.children) if (m.isMesh && !m.children.length && !m.userData.keep) (by.get(m.material) || by.set(m.material, []).get(m.material)).push(m);
        for (const [mat, list] of by) {
          if (list.length < 2) continue;
          const pos = [];
          for (const m of list) {
            m.updateMatrix();
            const g = (m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone()).applyMatrix4(m.matrix);
            const a = g.attributes.position.array;
            for (let i = 0; i < a.length; i++) pos.push(a[i]);
            p.remove(m);
          }
          const g = new T.BufferGeometry();
          g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
          g.computeVertexNormals();
          p.add(new T.Mesh(g, mat));
        }
      }
      rootObj.traverse((o) => {
        if (o.isMesh) o.raycast = () => {};
      });
      return rootObj;
    }
    return { snailman, finman, coralman, keeper, mossGiant, eelDragon, eelPack, boneShark, abyssEye, villager, bake, add, J, GEO, flat, glow, humanoid, PI, S, C, pulse };
  }
  BK.DeepBeings = { create };
})(typeof self !== 'undefined' ? self : globalThis);
