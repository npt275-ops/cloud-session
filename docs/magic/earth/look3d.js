/* Bể Kính · magic/earth/look3d.js · Khối đất nhô của phép đất (design/ke-hoach-buoc-37.md)
 * Vẽ theo danh sách đất nhô trong thế giới (S.rises: magic/earth/rise.js): khối mới thì trồi lên, khối mất (hết giờ, tua lùi)
 * thì hạ xuống rồi bỏ. Mỗi khối:
 *   mặt đất   một khối đất nhô trong L.bumps (render/map/height3d.js): người, máy quay đứng đúng trên mặt núi
 *   khối vẽ   lưới cực theo đúng hàm dáng (magic/earth/shape.js), dùng chung vật liệu đất của đảo (L.groundMat: cùng màu
 *             theo mùa, cùng cách tô) và màu từng đỉnh lấy đúng màu đất gốc chỗ đó (L.tintAt): trông như chính mặt đất phồng
 *             lên, không phải một cục đá đặt lên; viền chìm nhẹ dưới đất gốc nên không thấy đường nối. Chỗ trồi đang có lớp
 *             phủ (sân đất, đường lát: khối riêng nằm trên đất) thì giữa gò mang màu lớp phủ đó, ra viền hoà dần vào màu đất
 *   lúc trồi  bụi đất trào ra quanh chân gò, đá vụn nảy lên
 * sync(đảo, danh sách, ngày) mỗi khung hình (magic/earth/cast.js gọi); update(giây, đứng): đứng = thời gian đang dừng: núi
 * ngừng trồi, ngừng hạ. Cần: three.js, render/magic/vfx.js, magic/earth/shape.js, render/map/height3d.js (L.bumps, L.baseAt). */
(function (root) {
  const BK = root.BK || (root.BK = {});
  const RISE = { uplift: 2.2, mount: 3 }, // (giây thật) trồi lên
    SINK = 2.5, // (giây thật) hạ xuống
    SEGS = 40, // số múi quanh tâm
    RINGS = 18, // số vòng từ tâm ra viền
    DUST_EVERY = 0.12, // (giây) bụi ở chân núi lúc trồi, hạ
    FRESH = 0.6; // (ngày game) khối sinh trong chừng này thì trồi lên từ đầu; cũ hơn (nạp trận, tua lùi) thì hiện ngay
  function setup(G) {
    const { THREE } = G;
    const Sh = BK.EarthShape;
    const all = new Map(); // khoá → khối đang vẽ
    const c = new THREE.Color(),
      cTop = new THREE.Color(),
      p = new THREE.Vector3(),
      ray = new THREE.Raycaster(),
      DOWN = new THREE.Vector3(0, -1, 0);
    // màu lớp phủ trên mặt đất ở tâm gò (sân, đường: khối không tô màu theo đỉnh), đổi ra hệ số nhân với màu đất theo mùa;
    // không có lớp phủ thì null (dùng màu đất)
    function cover(e) {
      const b = e.b,
        L = e.L;
      ray.set(L.g.localToWorld(p.set(b.x, L.baseAt(b.x, b.z) + 3, b.z)), DOWN);
      ray.far = 3.6;
      const hit = ray.intersectObjects(L.g.children, true).find((h) => h.object !== e.mesh && h.object.isMesh && h.object.visible);
      if (!hit) return null;
      const m = Array.isArray(hit.object.material) ? hit.object.material[0] : hit.object.material;
      if (!m || !m.color || m === L.groundMat || m.vertexColors) return null;
      const col = new THREE.Color().copy(m.color);
      if (hit.object.isInstancedMesh && hit.object.instanceColor) {
        hit.object.getColorAt(hit.instanceId, c);
        col.multiply(c);
      }
      const g = L.groundMat.color;
      return col.setRGB(col.r / Math.max(0.05, g.r), col.g / Math.max(0.05, g.g), col.b / Math.max(0.05, g.b));
    }
    // bán kính các vòng của lưới: đều từ tâm ra viền
    function rings(b) {
      const out = [],
        R = Sh.reach(b);
      for (let k = 0; k <= RINGS; k++) out.push((R * k) / RINGS);
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
      e.mesh = new THREE.Mesh(geo, e.L.groundMat);
      e.mesh.castShadow = e.mesh.receiveShadow = true;
      e.mesh.frustumCulled = false;
      e.top = cover(e);
      e.L.g.add(e.mesh);
      shape(e);
      // pháp tuyến phải hướng lên (vật liệu đất tô mượt ở chế độ đồ chơi: render/style/diorama3d.js; quay xuống thì đen)
      const N = geo.attributes.normal.array;
      let up = 0;
      for (let i = 1; i < N.length; i += 3) up += N[i];
      if (up < 0) {
        const I = geo.index.array;
        for (let i = 0; i < I.length; i += 3) [I[i + 1], I[i + 2]] = [I[i + 2], I[i + 1]];
        geo.index.needsUpdate = true;
        geo.computeVertexNormals();
      }
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
          P.setXYZ(i, b.x + dx, e.L.baseAt(b.x + dx, b.z + dz) + (r === last ? -0.05 : add + 0.015), b.z + dz);
          if (!e.tinted) {
            e.L.tintAt(b.x + dx, b.z + dz, c);
            if (e.top) c.lerp(cTop.copy(e.top), 1 - Math.min(1, Math.max(0, (e.rs[r] / e.b.r - 0.45) / 0.45)));
            C.setXYZ(i, c.r, c.g, c.b);
          }
        }
      P.needsUpdate = C.needsUpdate = true;
      e.mesh.geometry.computeVertexNormals();
      e.tinted = true; // (màu đất gốc không đổi theo độ cao: tô một lần)
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
        const e = { key, i, L, b, k: day - b.born < FRESH ? 0 : 1, target: 1, dust: 0 };
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
        r = e.b.r * (0.8 + Math.random() * 0.3),
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
      }
    }
    G.earth3d = { sync, update, count: () => all.size };
  }
  BK.Earth3D = { setup, RISE, SINK };
})(typeof self !== 'undefined' ? self : globalThis);
