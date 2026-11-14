/* Bể Kính · render/body/softbody3d.js · Thân "đồ chơi mềm" cho nhân vật người chơi và người ở gần (design/ke-hoach-buoc-33.md mục 3)
 * Mỗi người một lưới liền có xương (SkinnedMesh), xương chính là khung khớp sẵn có của người đó (render/rig3d.js: f.rig.nodes),
 * nên mọi cử chỉ, dáng đi (render/anim3d.js, render/body/motion3d.js) dùng nguyên. Lưới ghép từ các khối tròn nhẵn chồng mí
 * lên nhau (đầu to, thân, hông, tay chân dạng viên nang, bàn tay tròn, bàn chân to); mỗi khối gắn cứng vào một xương. Màu
 * lấy đúng từ trang phục của người đó (bộ phận shirt, shorts, skirt, head, hairCap, hairBack của khung cũ): nhân vật nhất
 * quán qua mọi thời. Một lượt vẽ cho thân, một cho viền.
 *   chất liệu  nhựa mờ: sáng tối chuyển mềm liên tục, phản sáng mờ rộng, viền sáng quanh người (rim), da ấm ở rìa
 *   viền nét   lớp vỏ lật mặt hơi phồng ra, màu nâu sẫm: viền mảnh quanh người như tranh vẽ
 * Đám đông gần (crowd): mỗi chừng 0,3 giây chọn người bị nhập hồn và tối đa NEAR người gần máy quay nhất (máy chậm: ít hơn) trên
 * đảo đang ở để đổi sang thân mềm; người khác giữ thân cũ (render/village3d.js không vẽ thân cũ của người có f.soft, trừ đồ
 * cầm tay). Cần: three.js, render/rig3d.js. */
(function (root) {
  const BK = root.BK || (root.BK = {});
  const NEAR = 15,
    NEAR_LOW = 6,
    RADIUS = 24, // (đơn vị) xa hơn chừng này thì giữ thân cũ
    OUTLINE = 0.014, // (đơn vị khung) bề dày viền
    INK = '#2b1d16',
    SHOE = '#4a3426';
  let REST = null; // khung đứng thẳng ở gốc toạ độ: ma trận nghịch của từng xương (dùng chung cho mọi người, khung giống nhau)
  let NODES = null;
  function rest(THREE, p) {
    if (REST) return REST;
    const rig = BK.Rig3D.build(p, { level: 1, age: 30 });
    rig.root.position.set(0, 0, 0);
    rig.root.rotation.set(0, 0, 0);
    rig.root.scale.setScalar(1);
    rig.root.updateMatrixWorld(true);
    NODES = Object.keys(rig.nodes);
    REST = { world: {}, inv: [] };
    for (const k of NODES) {
      REST.world[k] = rig.nodes[k].matrixWorld.clone();
      REST.inv.push(rig.nodes[k].matrixWorld.clone().invert());
    }
    return REST;
  }
  // viên nang dọc trục y, từ y0 tới y1 (y0 < y1), bán kính r
  function capsule(THREE, r, y0, y1, seg) {
    const pts = [],
      n = 8;
    for (let i = 0; i <= n; i++) {
      const a = -Math.PI / 2 + (i / n) * (Math.PI / 2);
      pts.push(new THREE.Vector2(Math.cos(a) * r, y0 + Math.sin(a) * r));
    }
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * (Math.PI / 2);
      pts.push(new THREE.Vector2(Math.cos(a) * r, y1 + Math.sin(a) * r));
    }
    pts[0].x = 0.0001;
    pts[pts.length - 1].x = 0.0001;
    return new THREE.LatheGeometry(pts, seg || 14);
  }
  // màu theo bộ phận của khung cũ (khung của người đó: trang phục theo thời, theo nhóm)
  function colorsOf(THREE, rig) {
    const by = {};
    for (const pt of rig.parts) if (pt.color && !by[pt.type]) by[pt.type] = pt.color.clone();
    const skin = by.head || by.neck || new THREE.Color('#c99a74'),
      shirt = by.shirt || skin.clone(),
      pants = by.shorts || by.skirt || shirt.clone().multiplyScalar(0.7),
      hair = by.hairCap || by.hairBack || new THREE.Color('#3a2a20');
    return { skin, shirt, pants, hair, skirt: by.skirt || null, longHair: !!by.hairBack };
  }
  // dựng lưới thân mềm cho người f (khung f.rig); trả { mesh, line, rig }
  function build(G, f) {
    const { THREE } = G,
      R = rest(THREE, f.p),
      col = colorsOf(THREE, f.rig),
      pos = [],
      nor = [],
      clr = [],
      sIdx = [],
      M = new THREE.Matrix4(),
      N3 = new THREE.Matrix3(),
      v = new THREE.Vector3();
    // thêm một khối: geo (toạ độ của xương node, sau khi đặt bằng ma trận local), màu c
    function add(geo, node, local, c) {
      const g = geo.index ? geo.toNonIndexed() : geo;
      if (!g.attributes.normal) g.computeVertexNormals();
      M.multiplyMatrices(R.world[node], local);
      N3.getNormalMatrix(M);
      const P = g.attributes.position,
        Nn = g.attributes.normal,
        bi = NODES.indexOf(node);
      for (let i = 0; i < P.count; i++) {
        v.fromBufferAttribute(P, i).applyMatrix4(M);
        pos.push(v.x, v.y, v.z);
        v.fromBufferAttribute(Nn, i).applyMatrix3(N3).normalize();
        nor.push(v.x, v.y, v.z);
        clr.push(c.r, c.g, c.b);
        sIdx.push(bi, 0, 0, 0);
      }
    }
    const L = (x, y, z, sx, sy, sz, rx) =>
      new THREE.Matrix4().compose(
        new THREE.Vector3(x, y, z),
        new THREE.Quaternion().setFromEuler(new THREE.Euler(rx || 0, 0, 0)),
        new THREE.Vector3(sx || 1, sy || 1, sz || 1),
      );
    const sph = (r, w, h) => new THREE.SphereGeometry(r, w || 20, h || 14);
    const W = (n) => R.world[n].elements; // (vị trí xương lúc đứng thẳng: phần tử 12, 13, 14)
    const at = (n) => new THREE.Vector3(W(n)[12], W(n)[13], W(n)[14]);
    const yRel = (n, y) => y - at(n).y; // độ cao y (toạ độ khung) tính từ xương n
    const pink = new THREE.Color('#f2a0a0'),
      dark = new THREE.Color('#1d1a24'),
      white = new THREE.Color('#ffffff'),
      shoe = new THREE.Color(SHOE);
    // đầu to tròn, tóc trùm đỉnh và gáy, mặt: mắt có đốm sáng, má hồng, miệng
    const HY = 0.17; // tâm đầu cao hơn xương đầu chừng này
    add(sph(0.25, 28, 20), 'head', L(0, HY, 0, 1, 0.98, 0.96), col.skin);
    add(
      new THREE.SphereGeometry(0.262, 28, 14, 0, Math.PI * 2, 0, Math.PI * 0.52),
      'head',
      L(0, HY + 0.005, -0.012, 1, 1, 1, -0.32),
      col.hair,
    );
    if (col.longHair) add(sph(0.2), 'head', L(0, HY - 0.16, -0.11, 1.05, 1.4, 0.62), col.hair);
    for (const sx of [-1, 1]) {
      add(sph(0.036, 12, 10), 'head', L(sx * 0.088, HY - 0.012, 0.215, 0.85, 1.25, 0.6), dark);
      add(sph(0.012, 8, 6), 'head', L(sx * 0.078, HY + 0.012, 0.243), white);
      add(sph(0.034, 10, 8), 'head', L(sx * 0.15, HY - 0.075, 0.195, 1.2, 0.7, 0.45), pink);
    }
    add(sph(0.03, 10, 6), 'head', L(0, HY - 0.105, 0.225, 1.1, 0.32, 0.5), dark.clone().lerp(pink, 0.35));
    // cổ ngắn, thân tròn đầy (áo), hông (quần), váy nếu có
    add(capsule(THREE, 0.07, -0.02, 0.04), 'neck', L(0, 0, 0), col.skin);
    add(sph(0.2, 24, 18), 'chest', L(0, yRel('chest', 1.07), 0.005, 1.13, 1.3, 0.92), col.shirt);
    add(sph(0.19, 22, 16), 'pelvis', L(0, yRel('pelvis', 0.8), 0, 1.1, 0.8, 0.92), col.pants);
    if (col.skirt) add(new THREE.CylinderGeometry(0.18, 0.27, 0.3, 22, 1, true), 'pelvis', L(0, yRel('pelvis', 0.63), 0), col.skirt);
    // tay: vai tròn (áo), cánh tay trên (tay áo), cẳng tay, bàn tay tròn
    for (const s of ['L', 'R']) {
      add(sph(0.088, 16, 12), 'sh' + s, L(0, 0, 0), col.shirt);
      add(capsule(THREE, 0.07, -(at('sh' + s).y - at('el' + s).y) + 0.02, -0.02), 'sh' + s, L(0, 0, 0), col.shirt);
      add(capsule(THREE, 0.062, -(at('el' + s).y - at('wr' + s).y) + 0.02, 0.0), 'el' + s, L(0, 0, 0), col.skin);
      add(sph(0.078, 14, 12), 'wr' + s, L(0, -0.045, 0.01, 0.92, 1.05, 0.85), col.skin);
      // chân: đùi, cẳng chân (quần), bàn chân to
      add(capsule(THREE, 0.09, -(at('hip' + s).y - at('kn' + s).y) + 0.02, 0.0), 'hip' + s, L(0, 0, 0), col.pants);
      add(capsule(THREE, 0.076, -(at('kn' + s).y - at('an' + s).y) + 0.04, 0.0), 'kn' + s, L(0, 0, 0), col.skirt ? col.skin : col.pants);
      add(sph(0.08, 16, 12), 'an' + s, L(0, 0.01, 0.045, 0.95, 0.68, 1.55), shoe);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(clr, 3));
    g.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(sIdx, 4));
    const wts = new Float32Array((sIdx.length / 4) * 4);
    for (let i = 0; i < wts.length; i += 4) wts[i] = 1;
    g.setAttribute('skinWeight', new THREE.BufferAttribute(wts, 4));
    const bones = NODES.map((k) => f.rig.nodes[k]),
      skel = new THREE.Skeleton(bones, R.inv);
    const mesh = new THREE.SkinnedMesh(g, mats(THREE).body),
      line = new THREE.SkinnedMesh(g, mats(THREE).ink);
    for (const m of [mesh, line]) {
      m.bind(skel, new THREE.Matrix4());
      m.frustumCulled = false;
    }
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    line.renderOrder = -1;
    G.scene.add(mesh, line);
    return { mesh, line, rig: f.rig };
  }
  // vật liệu dùng chung: nhựa mờ có viền sáng; viền nét lật mặt
  let MATS = null;
  function mats(THREE) {
    if (MATS) return MATS;
    const body = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.48, metalness: 0, skinning: true });
    body.onBeforeCompile = (sh) => {
      sh.fragmentShader = sh.fragmentShader.replace(
        '#include <emissivemap_fragment>',
        '#include <emissivemap_fragment>\n' +
          // viền sáng quanh người (rim), ấm ở chỗ da (màu đỏ trội), như ánh sáng xuyên qua lớp nhựa mỏng
          '{ float fr = pow(1.0 - clamp(dot(normal, normalize(vViewPosition)), 0.0, 1.0), 2.6);\n' +
          '  float warm = clamp((diffuseColor.r - diffuseColor.b) * 2.0, 0.0, 1.0);\n' +
          '  totalEmissiveRadiance += mix(vec3(0.55, 0.62, 0.72), vec3(0.95, 0.55, 0.42), warm) * fr * 0.32 * diffuseColor.rgb + vec3(0.04) * fr; }',
      );
    };
    body.customProgramCacheKey = () => 'soft-body';
    const ink = new THREE.MeshBasicMaterial({ color: INK, side: THREE.BackSide, skinning: true });
    ink.onBeforeCompile = (sh) => {
      sh.vertexShader = sh.vertexShader.replace(
        '#include <begin_vertex>',
        'vec3 transformed = vec3(position) + normal * ' + OUTLINE.toFixed(4) + ';',
      );
    };
    ink.customProgramCacheKey = () => 'soft-ink';
    MATS = { body, ink };
    return MATS;
  }
  function drop(G, s) {
    G.scene.remove(s.mesh, s.line);
    s.mesh.geometry.dispose();
  }

  /* ---------- Đám đông gần ---------- */
  function setup(G) {
    const st = { on: false, i: -1, t: 0, list: new Set() };
    // bật cho đảo i quanh chỗ p (thế giới), người bị nhập hồn là self (khoá); on = false: trả hết về thân cũ
    function update(on, i, p, self, sec) {
      const V = i >= 0 ? G.villageOf(i) : null;
      if (!on || !V) {
        if (st.list.size) clear();
        st.on = false;
        return;
      }
      st.t -= sec;
      if (st.on && st.i === i && st.t > 0) return visibility(V);
      st.on = true;
      st.i = i;
      st.t = 0.3;
      const low = G.perf && G.perf.pr != null && G.perf.pr < 1,
        n = low ? NEAR_LOW : NEAR,
        cand = [];
      for (const x of V.inspect()) {
        if (x.inside || x.guest) continue;
        const f = V.folk(x.key);
        if (!f || !f.rig) continue;
        const d = f.rig.root.position.distanceTo(p);
        if (x.key === self || d < RADIUS) cand.push([x.key === self ? -1 : d, x.key, f]);
      }
      cand.sort((a, b) => a[0] - b[0]);
      const keep = new Set(cand.slice(0, n).map((c) => c[2]));
      for (const f of st.list)
        if (!keep.has(f)) {
          if (f.soft) drop(G, f.soft);
          f.soft = null;
          st.list.delete(f);
        }
      for (const f of keep) {
        if (f.soft && f.soft.rig !== f.rig) {
          drop(G, f.soft); // (khung đổi: lớn lên, sang thời mới)
          f.soft = null;
        }
        if (!f.soft) f.soft = build(G, f);
        st.list.add(f);
      }
      visibility(V);
    }
    // người vào nhà thì ẩn thân mềm
    function visibility(V) {
      for (const f of st.list) if (f.soft) f.soft.mesh.visible = f.soft.line.visible = !f.inside && V.visible;
    }
    function clear() {
      for (const f of st.list) {
        if (f.soft) drop(G, f.soft);
        f.soft = null;
      }
      st.list.clear();
    }
    G.softCrowd = {
      update,
      clear,
      get count() {
        return st.list.size;
      },
    };
  }
  BK.SoftBody3D = { setup, build, NEAR, RADIUS };
})(typeof self !== 'undefined' ? self : globalThis);
