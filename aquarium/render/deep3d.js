/* Bể Kính · render/deep3d.js · Đáy bể: ghép các phần, rong, bọt khí, máy quay dưới nước (design/ke-hoach-buoc-18.md … 22)
 * Thứ tự dựng (giữ nguyên: dãy ngẫu nhiên rnd chạy theo thứ tự này):
 *   render/deep/terrain3d.js  địa hình, rãnh, khối đất đỡ đảo, số học đường hầm
 *   render/deep/kit3d.js      bộ ghép khối (put, frame, nhóm gộp)
 *   render/deep/citadel3d.js  phế tích dưới Thông Xanh: Thành Vỏ Ốc Xà Cừ (phần động: D.anims)
 *   render/deep/ruins3d.js    hai phế tích dưới Tuyết Trắng, Cát Hồng
 *   render/deep/tunnels3d.js  ba đường hầm, sáu cửa hầm
 * Ở đây: rong trên sườn núi, gộp lưới (đá, đá sáng, lòng hầm, rong đung đưa), bọt khí, mỗi khung hình (máy quay dưới mặt nước:
 * sương nước sâu, góc nhìn rộng, vách nước gần như đục, lòng hầm chỉ vẽ khi ở dưới nước), các điểm lặn cho nút "Đáy bể"
 * (ui/landbar.js). Cần: three.js, render/map/map3d.js (đảo), sea3d.js, bốn tệp render/deep/ ở trên. */
(function (root) {
  'use strict';
  const BK = root.BK || (root.BK = {});
  function create(K) {
    const D = Object.assign({}, K);
    BK.DeepTerrain.build(D);
    BK.DeepKit.build(D);
    BK.DeepCitadel.build(D);
    BK.DeepRuins.build(D);
    BK.DeepTunnels.build(D);
    const {
      anims,
      THREE,
      scene,
      sea3d,
      clamp,
      reduce,
      glowTex,
      hash,
      EDGE,
      hAt,
      TOP_MAX,
      portals,
      put,
      groups,
      CONE,
      deep,
      noPick,
      matOf,
      TG,
      SITES,
      polar,
      ceilAt,
      SEA_Y,
      FLOOR,
      lands,
      TUNNELS,
      TUN_RC,
      TUN_FLOOR,
    } = D;
    /* ---------- Rong mọc trên sườn núi, quanh chân núi ---------- */
    for (let i = 0; i < 420; i++) {
      const a = hash(i * 3.1) * Math.PI * 2,
        r = 20 + hash(i * 5.7) * (EDGE - 26),
        x = Math.cos(a) * r,
        z = Math.sin(a) * r,
        y = hAt(x, z);
      if (y > TOP_MAX - 4 || portals.some((q) => Math.hypot(x - q.x, z - q.z) < 20)) continue; // (không mọc chắn cửa hầm)
      put(
        groups.weed,
        CONE(4),
        hash(i) < 0.5 ? '#3f7f4a' : '#7a9a4a',
        x,
        y - 0.4,
        z,
        0.7 + hash(i * 2) * 0.9,
        4 + hash(i * 9) * 10,
        0.7 + hash(i * 2) * 0.9,
        hash(i * 4) * 3,
      );
    }

    /* ---------- Lưới gộp ---------- */
    const meshOf = (G, mat) => {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(G.pos, 3));
      g.setAttribute('color', new THREE.Float32BufferAttribute(G.col, 3));
      if (G.sway) g.setAttribute('aSway', new THREE.Float32BufferAttribute(G.sway, 1));
      g.computeVertexNormals();
      const m = new THREE.Mesh(g, mat);
      deep.add(noPick(m));
      return m;
    };
    meshOf(groups.stone, matOf());
    const glowMat = new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false });
    meshOf(groups.glow, glowMat);
    // lòng hầm: màu đã gồm ánh đá sáng, không cần đèn của cảnh (vẫn chịu sương nước sâu)
    // (chỉ vẽ khi máy quay ở dưới nước: từ trên mặt nước lòng hầm bị núi che kín)
    const tunMesh = meshOf(TG, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide }));
    tunMesh.visible = false;
    // rong, tảo: đung đưa theo dòng nước (ngọn đưa nhiều, gốc đứng yên)
    const weedMat = matOf({ side: THREE.DoubleSide, roughness: 0.8 }),
      WU = { uT: { value: 0 } };
    weedMat.onBeforeCompile = (sh) => {
      sh.uniforms.uT = WU.uT;
      sh.vertexShader =
        'uniform float uT;\nattribute float aSway;\n' +
        sh.vertexShader.replace(
          '#include <begin_vertex>',
          '#include <begin_vertex>\n{ vec4 wp = modelMatrix * vec4(transformed, 1.0); float s = aSway * aSway; transformed.x += sin(uT * 0.9 + wp.x * 0.11 + wp.z * 0.07) * 1.6 * s; transformed.z += cos(uT * 0.7 + wp.z * 0.09) * 1.2 * s; }',
        );
    };
    weedMat.customProgramCacheKey = () => 'deepWeed';
    meshOf(groups.weed, weedMat);

    /* ---------- Bọt khí bay lên từ khe đáy và phế tích ---------- */
    const NB = 360,
      bpos = new Float32Array(NB * 3),
      bsp = [],
      vents = [];
    for (const S of SITES)
      for (let k = 0; k < 4; k++) {
        const a = hash(S.k * 9 + k) * Math.PI * 2,
          r = 10 + hash(S.k * 5 + k) * 50;
        vents.push({ x: S.x + Math.cos(a) * r, z: S.z + Math.sin(a) * r * 0.6 });
      }
    for (let k = 0; k < 6; k++) {
      const p = polar(k * 1.05 + 0.3, 60 + hash(k) * 150);
      vents.push(p);
    }
    for (const v of vents) {
      v.y = hAt(v.x, v.z);
      const c = ceilAt(v.x, v.z);
      v.top = c == null ? TOP_MAX + 2.4 : c - 0.5;
    } // (dưới khối đất đỡ đảo: bọt tan ở mặt dưới khối đất)
    for (let i = 0; i < NB; i++) {
      const v = vents[i % vents.length];
      bpos[i * 3] = v.x + (hash(i) - 0.5) * 3;
      bpos[i * 3 + 1] = v.y + hash(i * 7) * (v.top - v.y);
      bpos[i * 3 + 2] = v.z + (hash(i * 3) - 0.5) * 3;
      bsp.push(3 + hash(i * 11) * 5);
    }
    const bgeo = new THREE.BufferGeometry();
    bgeo.setAttribute('position', new THREE.BufferAttribute(bpos, 3));
    const bubbles = new THREE.Points(
      bgeo,
      new THREE.PointsMaterial({ color: '#cfefff', size: 1.1, map: glowTex, transparent: true, opacity: 0.7, depthWrite: false }),
    );
    bubbles.raycast = () => {};
    bubbles.frustumCulled = false;
    deep.add(bubbles);

    /* ---------- Mỗi khung hình ---------- */
    let FOG0 = null;
    const deepFog = new THREE.Color('#0e4d6e'),
      darkFog = new THREE.Color('#06202f');
    let wasUnder = false;
    function animate(dt, t, night, cam) {
      const ts = reduce ? 0 : t * 0.001;
      WU.uT.value = ts;
      for (const f of anims) f(ts); // (phần động: đảo lơ lửng, vòng quay của Thành Vỏ Ốc Xà Cừ)
      glowMat.color.setScalar(0.8 + 0.2 * Math.sin(ts * 1.3));
      if (!reduce) {
        const s = Math.min(dt || 16, 100) / 1000;
        for (let i = 0; i < NB; i++) {
          const v = vents[i % vents.length];
          let y = bpos[i * 3 + 1] + bsp[i] * s;
          if (y > v.top) {
            y = v.y;
            bpos[i * 3] = v.x + (hash(i + ts) - 0.5) * 3;
            bpos[i * 3 + 2] = v.z + (hash(i * 3 + ts) - 0.5) * 3;
          }
          bpos[i * 3 + 1] = y;
          bpos[i * 3] += Math.sin(ts * 2 + i) * 0.02;
        }
        bgeo.attributes.position.needsUpdate = true;
      }
      // máy quay dưới mặt nước: sương nước sâu, càng xuống càng tối
      const fog = scene.fog;
      if (fog && !FOG0) FOG0 = { near: fog.near, far: fog.far }; // (sương của trời: render/sky3d.js)
      const top = SEA_Y + sea3d.seaDy,
        p = cam.position,
        under = p.y < top - 0.15 && Math.hypot(p.x, p.z) < EDGE;
      if (under && fog) {
        const d = clamp((top - p.y) / (top - FLOOR), 0, 1);
        fog.near = 10;
        fog.far = 330 - d * 90;
        fog.color
          .copy(deepFog)
          .lerp(darkFog, d * 0.7)
          .multiplyScalar(1 - night * 0.55);
      } else if (wasUnder && fog && FOG0) {
        fog.near = FOG0.near;
        fog.far = FOG0.far;
      }
      if (under !== wasUnder) {
        sea3d.setUnder(under);
        tunMesh.visible = under;
      }
      wasUnder = under;
      // dưới nước góc nhìn rộng ra (62°) để thấy trọn một phế tích dài 185 trong lòng rãnh; lên mặt nước trả lại góc thường
      // (góc thường theo render/scene3d.js resize: 34°, màn hẹp 50°)
      const base = window.innerWidth < 720 ? 50 : 34,
        want = under ? Math.max(base, 62) : base;
      if (Math.abs(cam.fov - want) > 0.05) {
        cam.fov += (want - cam.fov) * Math.min(1, (dt || 16) / 400);
        if (Math.abs(cam.fov - want) < 0.05) cam.fov = want;
        cam.updateProjectionMatrix();
      }
    }
    // các điểm lặn cho nút "Đáy bể" (ui/landbar.js): phế tích, rồi cửa hầm bên +v của nó (thông sang phế tích kế tiếp), lần lượt
    // máy quay phế tích: trong lòng rãnh phía vách kính (cách tâm 92 theo trục, cao hơn đáy rãnh 80: dưới vòm đất đỡ đảo)
    const stops = [];
    for (const S of SITES) {
      const y = hAt(S.x, S.z) + 12;
      stops.push({ name: S.name, x: S.x, z: S.z, y, cam: new THREE.Vector3(S.x + S.ux * 92, y + 68, S.z + S.uz * 92) });
      const P = portals.find((q) => q.k === S.k && q.side > 0),
        j = (2 * S.k + 2) % 6;
      stops.push({ name: 'Hầm xuyên núi dưới ' + lands[j].T.city, x: P.x, z: P.z, y: P.y, cam: P.cam });
      // trong lòng hầm: máy quay giữa lối đi ở 30% chiều dài, nhìn dọc lối đi tới 50% (cao ngang tầm hình khắc)
      const TN = TUNNELS[S.k],
        t1 = TN.a + (TN.b - TN.a) * 0.3,
        t2 = TN.a + (TN.b - TN.a) * 0.5;
      stops.push({
        name: 'Trong hầm dưới ' + lands[j].T.city,
        x: Math.cos(t2) * TUN_RC,
        z: Math.sin(t2) * TUN_RC,
        y: TUN_FLOOR + 6.5,
        cam: new THREE.Vector3(Math.cos(t1) * TUN_RC, TUN_FLOOR + 9.5, Math.sin(t1) * TUN_RC),
      });
    }
    // (citadel: số công trình mỗi loại của Thành Vỏ Ốc Xà Cừ, để kiểm)
    const out = { animate, stops, heightAt: hAt, group: deep, FLOOR, tunnels: TUNNELS, TUN_RC, TUN_FLOOR, citadel: SITES[0].stats, citadelFree: SITES[0].free };
    return out;
  }
  BK.Deep3D = { create };
})(typeof self !== 'undefined' ? self : globalThis);
