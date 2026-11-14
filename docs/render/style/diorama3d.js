/* Bể Kính · render/style/diorama3d.js · Bản thử "thế giới đồ chơi thu nhỏ" sau khi nhập hồn (chỉ đảo trong ON)
 * Cảnh cùng chất liệu với người (thân đồ chơi mềm, render/body/softbody3d.js): hình tròn mịn, sáng tối chuyển mềm, ánh sáng
 * ấm lạnh rõ ràng. Không lọc ảnh: nét vẽ nằm ở chính vật thể. game/possess.js gọi G.diorama.update(bật, đảo) mỗi khung hình
 * (sau khi render/sky3d.js đã đặt đèn cho giờ hiện tại); tắt thì trả mọi thứ về như cũ. Góc nhìn thượng đế không đổi gì.
 *   ánh sáng   nắng ấm hơn; đèn trời ngả lam từ trên, hắt ấm từ đất lên (mặt khuất nắng không xám mà ấm như ánh đất dội lên);
 *              đèn hắt ngược nắng mạnh hơn: bóng dịu, có màu
 *   mặt đất    nhẵn (bỏ mặt gãy khúc); cỏ gần thành thảm mềm (render/near3d.js G.near.soft: thấp hơn, sáng đều)
 *   mọi khối quanh đảo  công trình, cây quanh làng, đá, gò (vật liệu dùng chung của render/build/kit3d.js, render/map/shared3d.js):
 *              quét mỗi SCAN giây các khối trong bán kính NEAR quanh tâm đảo, vật liệu nào gãy mặt mà khối có pháp tuyến thì
 *              chuyển mềm: cầu, nón, trụ tròn mịn; khối hộp vẫn sắc cạnh (pháp tuyến theo mặt). Vật liệu dùng chung nên đảo khác
 *              cũng đổi theo, nhưng lúc nhập hồn chỉ thấy chúng ở xa trong sương
 *   cây        tán tròn mịn như kẹo bông: bỏ mặt gãy, pháp tuyến toả từ tâm tán (cả tán sáng tối loang một khối); tán cầu
 *              ít mặt đổi sang cầu nhiều mặt (viền tròn); thân, thông chuyển mềm
 *   mây        cục mây mịn tròn (clouds3d.js)
 *   hậu kỳ     bỏ hạt phim, chỉnh màu nhẹ hơn (render/fx/post3d.js)
 * Muốn bỏ: xoá tệp và dòng gọi trong game/possess.js, game/loop.js, index.html. Muốn mở cho đảo khác: thêm miền vào ON.
 * Cần: three.js, render/sky3d.js (G.sky.lights), render/map/ (L.groundMat, L.trees), render/near3d.js, clouds3d.js. */
(function (root) {
  const BK = root.BK || (root.BK = {});
  const ON = { plains: true }; // các miền bật bản thử
  const FADE = 1200; // (mili giây) chuyển dần lúc mở mắt
  const SCAN = 2000, // (mili giây) quét lại các khối quanh đảo (công trình mới mọc)
    NEAR = 110; // bán kính quét quanh tâm đảo
  const LIGHT = {
    sun: '#ffe3b8', // nắng ấm
    sunK: 0.35, // mức pha màu nắng
    sky: '#b9d4ff', // đèn trời từ trên: lam
    bounce: '#c9a86e', // ánh đất dội lên: ấm
    hemiI: 1.12, // nhân độ sáng đèn trời
    fillI: 0.22, // cộng thêm đèn hắt ngược nắng
  };
  const CANOPY = ['icos', 'rounds', 'talls', 'bushes']; // các khối tán cây (render/map/trees3d.js L.trees)
  function setup(G) {
    const { THREE } = G;
    const st = { on: false, L: null, onAt: 0, k: 0, saved: null };
    const C = (h) => new THREE.Color(h);
    const col = { sun: C(LIGHT.sun), sky: C(LIGHT.sky), bounce: C(LIGHT.bounce) };
    const roundIco = new THREE.IcosahedronGeometry(1, 2);
    // vật liệu tán tròn: chuyển mềm, pháp tuyến pha với hướng từ tâm tán ra (mid: tâm khối tán)
    function canopyMat(orig, mid) {
      const m = orig.clone();
      m.flatShading = false;
      m.onBeforeCompile = (sh) => {
        sh.vertexShader = sh.vertexShader.replace(
          '#include <beginnormal_vertex>',
          'vec3 objectNormal = normalize(mix(vec3(normal), normalize(position - vec3(0.0, ' + mid.toFixed(3) + ', 0.0)), 0.8));',
        );
      };
      m.customProgramCacheKey = () => 'dio-canopy-' + mid.toFixed(3);
      return m;
    }
    function smoothMat(orig) {
      const m = orig.clone();
      m.flatShading = false;
      return m;
    }
    // bật: đổi vật liệu, khối của đảo L; ghi lại cái cũ để trả
    function apply(L) {
      const sv = { L, mats: [], geos: [], ground: null, clouds: null };
      const ground = L.groundMat;
      if (ground) {
        L.g.traverse((o) => {
          if (o.name !== 'ground' || !o.geometry || o.geometry.attributes.normal) return;
          // (lưới đất xếp đỉnh theo chiều kim đồng hồ: pháp tuyến tính ra hướng xuống thì lật lại, không thì đất quay lưng với
          // nắng: không nhận nắng, không thấy bóng)
          const g = o.geometry;
          g.computeVertexNormals();
          const N = g.attributes.normal.array;
          let up = 0;
          for (let i = 1; i < N.length; i += 3) up += N[i];
          if (up < 0) for (let i = 0; i < N.length; i++) N[i] = -N[i];
        });
        sv.ground = ground.flatShading;
        ground.flatShading = false;
        ground.needsUpdate = true;
      }
      const T = L.trees;
      if (T)
        for (const k of ['trunks', 'fat', 'cones', ...CANOPY]) {
          const m = T[k];
          if (!m) continue;
          sv.mats.push([m, m.material]);
          if (CANOPY.includes(k)) {
            if (k === 'icos') {
              sv.geos.push([m, m.geometry]);
              m.geometry = roundIco;
            }
            if (!m.geometry.boundingBox) m.geometry.computeBoundingBox();
            const bb = m.geometry.boundingBox;
            m.material = canopyMat(m.material, (bb.min.y + bb.max.y) / 2);
          } else m.material = smoothMat(m.material);
        }
      sv.flat = new Set();
      scan(L, sv);
      const P = G.clouds3d && G.clouds3d.puffs;
      if (P) {
        sv.clouds = P.material.flatShading;
        P.material.flatShading = false;
        P.material.needsUpdate = true;
      }
      return sv;
    }
    // chuyển mềm các vật liệu gãy mặt của khối quanh đảo (khối không có pháp tuyến thì để nguyên: vẽ mềm sẽ đen)
    const wp = new THREE.Vector3();
    function scan(L, sv) {
      sv.scanAt = performance.now();
      G.scene.traverse((o) => {
        if (!o.isMesh || !o.geometry || !o.geometry.attributes.normal) return;
        const m = o.material;
        if (!m || Array.isArray(m) || !m.flatShading || !m.isMeshStandardMaterial || sv.flat.has(m)) return;
        o.getWorldPosition(wp);
        if (!o.isInstancedMesh && Math.hypot(wp.x - L.center.x, wp.z - L.center.z) > NEAR) return;
        if (o.isInstancedMesh && !isUnder(o, L.g)) return;
        sv.flat.add(m);
        m.flatShading = false;
        m.needsUpdate = true;
      });
    }
    function isUnder(o, g) {
      for (let p = o.parent; p; p = p.parent) if (p === g) return true;
      return false;
    }
    function restore(sv) {
      if (!sv) return;
      if (sv.L.groundMat && sv.ground != null) {
        sv.L.groundMat.flatShading = sv.ground;
        sv.L.groundMat.needsUpdate = true;
      }
      for (const [m, mat] of sv.mats) {
        if (m.material !== mat) m.material.dispose();
        m.material = mat;
      }
      for (const [m, geo] of sv.geos) m.geometry = geo;
      for (const m of sv.flat) {
        m.flatShading = true;
        m.needsUpdate = true;
      }
      const P = G.clouds3d && G.clouds3d.puffs;
      if (P && sv.clouds != null) {
        P.material.flatShading = sv.clouds;
        P.material.needsUpdate = true;
      }
    }
    function off() {
      if (!st.on) return;
      st.on = false;
      st.k = 0;
      restore(st.saved);
      st.saved = null;
      st.L = null;
      if (G.near && G.near.soft) G.near.soft(0);
    }
    // mỗi khung hình (game/possess.js), sau render/sky3d.js applyTime: đèn được đặt lại mỗi khung hình nên chỉnh ở đây không cộng dồn
    function update(on, i) {
      const L = on && i >= 0 ? G.lands[i] : null;
      if (!L || !ON[L.ter]) return off();
      if (!st.on || st.L !== L) {
        off();
        st.on = true;
        st.L = L;
        st.onAt = performance.now();
        st.saved = apply(L);
      }
      if (performance.now() - st.saved.scanAt > SCAN) scan(L, st.saved);
      const k = (st.k = Math.min(1, (performance.now() - st.onAt) / FADE));
      const Lt = G.sky && G.sky.lights;
      if (Lt) {
        Lt.sun.color.lerp(col.sun, LIGHT.sunK * k);
        Lt.hemi.color.lerp(col.sky, 0.25 * k);
        Lt.hemi.groundColor.lerp(col.bounce, 0.5 * k);
        Lt.hemi.intensity *= 1 + (LIGHT.hemiI - 1) * k;
        Lt.fill.intensity += LIGHT.fillI * k;
      }
      if (G.near && G.near.soft) G.near.soft(k);
      const fx = G.post && G.post.fx;
      if (fx) {
        fx.grain *= 1 - k;
        fx.grade *= 1 - 0.35 * k;
      }
    }
    G.diorama = {
      update,
      get on() {
        return st.on;
      },
      ON,
      LIGHT,
    };
  }
  BK.Diorama3D = { setup, ON };
})(typeof self !== 'undefined' ? self : globalThis);
