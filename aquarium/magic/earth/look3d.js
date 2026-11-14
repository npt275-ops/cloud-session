/* Bể Kính · magic/earth/look3d.js · Khối núi đá của phép đất (design/ke-hoach-buoc-37.md)
 * Vẽ theo danh sách đất nhô trong thế giới (S.rises: magic/earth/rise.js): khối mới thì trồi lên, khối mất (hết giờ, tua lùi)
 * thì hạ xuống rồi bỏ. Mỗi khối:
 *   mặt đất   một khối đất nhô trong L.bumps (render/map/height3d.js): người, máy quay đứng đúng trên mặt núi
 *   khối vẽ   lưới cực theo đúng hàm dáng (magic/earth/shape.js), mặt phẳng từng ô (đá đồ chơi), màu đất ở chân, đá ở sườn,
 *             đá sáng ở đỉnh; có đổ bóng, nhận bóng
 *   lúc trồi  bụi đất trào ra quanh chân núi, đá vụn nảy lên; trụ lên tới đỉnh thì bụi rơi từ mép trụ
 * sync(đảo, danh sách, ngày) mỗi khung hình (magic/earth/cast.js gọi); update(giây, đứng): đứng = thời gian đang dừng: núi
 * ngừng trồi, ngừng hạ. Cần: three.js, render/magic/vfx.js, magic/earth/shape.js, render/map/height3d.js (L.bumps, L.baseAt). */
(function (root) {
  const BK = root.BK || (root.BK = {});
  const RISE = { peak: 1.4, mount: 2.4 }, // (giây thật) trồi lên
    SINK = 2.5, // (giây thật) hạ xuống
    SEGS = 48, // số múi quanh tâm
    DUST_EVERY = 0.12, // (giây) bụi ở chân núi lúc trồi, hạ
    FRESH = 0.6; // (ngày game) khối sinh trong chừng này thì trồi lên từ đầu; cũ hơn (nạp trận, tua lùi) thì hiện ngay
  const COL = { foot: '#a8936c', rock: '#a59d90', top: '#dcd3c0' }; // (chân đất nâu xám, sườn đá xám, đỉnh đá sáng)
  function setup(G) {
    const { THREE } = G;
    const Sh = BK.EarthShape;
    const all = new Map(); // khoá → khối đang vẽ
    const mat = new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.95 });
    const cF = new THREE.Color(COL.foot),
      cR = new THREE.Color(COL.rock),
      cT = new THREE.Color(COL.top),
      c = new THREE.Color(),
      p = new THREE.Vector3();
    // bán kính các vòng của lưới: dày ở giữa (vách trụ đá), thưa ra ngoài
    function rings(b) {
      const out = [0, 0.4, 0.8, 1.0, 1.1, 1.25, 1.45, 1.75],
        R = Sh.reach(b);
      for (let k = 1; k <= 18; k++) out.push(1.75 + ((R - 1.75) * k) / 18);
      return out;
    }
    function build(e) {
      const rs = rings(e.b),
        n = rs.length * SEGS;
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
      geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
      const idx = [];
      for (let r = 0; r < rs.length - 1; r++)
        for (let s = 0; s < SEGS; s++) {
          const a = r * SEGS + s,
            b = r * SEGS + ((s + 1) % SEGS),
            c2 = (r + 1) * SEGS + s,
            d = (r + 1) * SEGS + ((s + 1) % SEGS);
          idx.push(a, c2, b, b, c2, d);
        }
      geo.setIndex(idx);
      e.rs = rs;
      e.mesh = new THREE.Mesh(geo, mat);
      e.mesh.castShadow = e.mesh.receiveShadow = true;
      e.mesh.frustumCulled = false;
      e.L.g.add(e.mesh);
      shape(e);
    }
    // đặt lại cao độ từng đỉnh theo tiến độ k (khối nằm trong nhóm của đảo: toạ độ đảo)
    function shape(e) {
      const P = e.mesh.geometry.attributes.position,
        C = e.mesh.geometry.attributes.color,
        b = e.b,
        last = e.rs.length - 1;
      for (let r = 0; r <= last; r++)
        for (let s = 0; s < SEGS; s++) {
          const a = (s / SEGS) * Math.PI * 2,
            dx = Math.cos(a) * e.rs[r],
            dz = Math.sin(a) * e.rs[r],
            add = Sh.at(b, dx, dz, e.k),
            i = r * SEGS + s;
          P.setXYZ(i, b.x + dx, e.L.baseAt(b.x + dx, b.z + dz) + (r === last ? -0.08 : add + 0.02), b.z + dz);
          const t = Math.min(1, add / b.h);
          c.copy(cF).lerp(cR, Math.min(1, t * 3.5));
          if (t > 0.8) c.lerp(cT, (t - 0.8) * 5);
          c.offsetHSL(0, 0, Math.sin(i * 12.9898) * 0.04); // (từng mặt đá sáng tối khác nhau một chút)
          C.setXYZ(i, c.r, c.g, c.b);
        }
      P.needsUpdate = C.needsUpdate = true;
      e.mesh.geometry.computeBoundingSphere();
    }
    function sync(i, list, day) {
      const L = G.lands[i];
      if (!L || !L.bumps) return;
      const seen = new Set();
      for (const b of list) {
        const key = i + ':' + b.id + ':' + b.born;
        seen.add(key);
        const e0 = all.get(key);
        if (e0) {
          e0.target = 1;
          continue;
        }
        const e = { key, i, L, b, k: day - b.born < FRESH ? 0 : 1, target: 1, dust: 0, topped: false };
        e.bump = { x: b.x, z: b.z, r: Sh.reach(b), at: (dx, dz) => Sh.at(b, dx, dz, e.k) };
        L.bumps.push(e.bump);
        build(e);
        all.set(key, e);
      }
      for (const [key, e] of all) if (e.i === i && !seen.has(key)) e.target = 0;
    }
    function drop(e) {
      e.L.g.remove(e.mesh);
      e.mesh.geometry.dispose();
      const j = e.L.bumps.indexOf(e.bump);
      if (j >= 0) e.L.bumps.splice(j, 1);
      all.delete(e.key);
    }
    // điểm thế giới ở chân núi (để phát bụi)
    function rim(e, out) {
      const a = Math.random() * Math.PI * 2,
        r = e.b.r * (0.75 + Math.random() * 0.3),
        x = e.b.x + Math.cos(a) * r,
        z = e.b.z + Math.sin(a) * r;
      return e.L.g.localToWorld(out.set(x, e.L.surfAt(x, z), z));
    }
    function update(sec, still) {
      if (still) return;
      for (const [, e] of all) {
        if (e.k === e.target) continue;
        const dur = e.target ? RISE[e.b.kind] || 2 : SINK;
        e.k = e.target ? Math.min(1, e.k + sec / dur) : Math.max(0, e.k - sec / dur);
        if (!e.k && !e.target) {
          drop(e);
          continue;
        }
        shape(e);
        if ((e.dust -= sec) <= 0) {
          e.dust = DUST_EVERY;
          G.vfx.play('riseDust', rim(e, p));
        }
        if (e.k === 1 && e.b.kind === 'peak' && !e.topped) {
          e.topped = true;
          G.vfx.play('topDust', e.L.g.localToWorld(p.set(e.b.x, e.L.surfAt(e.b.x, e.b.z), e.b.z)));
        }
      }
    }
    G.earth3d = { sync, update, count: () => all.size };
  }
  BK.Earth3D = { setup, RISE, SINK };
})(typeof self !== 'undefined' ? self : globalThis);
