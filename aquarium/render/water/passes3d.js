/* Bể Kính · render/water/passes3d.js · Ba lượt vẽ của nước (quy tắc 3: cảnh vẽ ba lần, mỗi lần cắt bởi mặt nước)
 * Trước lượt vẽ chính (game/loop.js gọi prepass() ngay trước G.post.render), vẽ cảnh thêm hai lần vào hai ảnh nhỏ:
 *   dưới nước   (refr) máy quay chính, chỉ giữ phần dưới mặt nước (mặt cắt y < mặt nước), kèm ảnh độ sâu (depth): mặt nước
 *               đọc màu đáy nhìn xuyên qua và đo quãng đường tia sáng đi trong nước (quy tắc 4)
 *   phản chiếu  (refl) máy quay soi gương qua mặt nước, chỉ giữ phần trên mặt nước; mat: ma trận đổi điểm thế giới ra chỗ đọc ảnh
 * Lúc vẽ hai ảnh này ẩn lớp nước (mặt nước, vách nước, chậu kính, vòm kính) và không vẽ lại bóng nắng (dùng bóng của khung
 * trước). Mặt nước (render/water/surface3d.js) chỉ ghép hai ảnh lại. Ảnh nhỏ hơn màn hình (SCALE theo mức nét); máy yếu:
 * level 1 bỏ ảnh phản chiếu (mặt nước soi màu trời), level 0 bỏ cả hai (mặt nước tự tính màu đáy). Máy quay dưới nước: bỏ qua.
 * Cần: three.js, sea3d.js (G.sea3d), render/tank3d.js (G.tank.dome). */
(function (root) {
  const BK = root.BK || (root.BK = {});
  const SCALE = { refl: 0.5, refr: 0.5 }, // phần độ phân giải màn hình của hai ảnh
    CUT = 0.05; // (đơn vị) mép cắt lệch khỏi mặt nước một chút để không hở đường nối
  function setup(G) {
    const { THREE, renderer, scene, camera } = G;
    const mk = (depth) => {
      const t = new THREE.WebGLRenderTarget(4, 4, { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat });
      if (depth) {
        t.depthTexture = new THREE.DepthTexture(4, 4);
        t.depthTexture.type = THREE.UnsignedIntType;
      }
      return t;
    };
    const refl = mk(false),
      refr = mk(true);
    const mirror = new THREE.PerspectiveCamera(),
      reflMat = new THREE.Matrix4(),
      bias = new THREE.Matrix4().set(0.5, 0, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0, 0.5, 0.5, 0, 0, 0, 1),
      size = new THREE.Vector2(),
      up = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0),
      down = new THREE.Plane(new THREE.Vector3(0, -1, 0), 0),
      v = new THREE.Vector3(),
      t = new THREE.Vector3(),
      q = new THREE.Quaternion();
    const st = { level: 2, has: { refl: false, refr: false } };
    const seaY = () => G.sea3d.SEA_Y + G.sea3d.seaDy;
    function fit(target, k) {
      renderer.getDrawingBufferSize(size);
      const w = Math.max(4, Math.round(size.x * k)),
        h = Math.max(4, Math.round(size.y * k));
      if (target.width !== w || target.height !== h) target.setSize(w, h);
    }
    // ẩn lớp nước lúc vẽ hai ảnh
    function waterLayer(on) {
      const S = G.sea3d;
      for (const m of [S.water, S.wall, S.glassWall, S.glassFloor, G.tank && G.tank.dome]) if (m) m.visible = on;
    }
    // máy quay soi gương: chỗ và hướng nhìn lật qua mặt nước (như THREE.Reflector), cùng phép chiếu với máy quay chính
    function placeMirror(y) {
      camera.updateMatrixWorld();
      v.setFromMatrixPosition(camera.matrixWorld);
      mirror.position.set(v.x, 2 * y - v.y, v.z);
      camera.getWorldDirection(t);
      t.add(v);
      camera.getWorldQuaternion(q);
      mirror.up.set(0, 1, 0).applyQuaternion(q);
      mirror.up.y = -mirror.up.y; // (hướng lên của máy quay cũng lật qua mặt nước)
      mirror.lookAt(t.x, 2 * y - t.y, t.z);
      mirror.projectionMatrix.copy(camera.projectionMatrix);
      mirror.updateMatrixWorld();
      mirror.matrixWorldInverse.copy(mirror.matrixWorld).invert();
      reflMat.copy(bias).multiply(mirror.projectionMatrix).multiply(mirror.matrixWorldInverse);
    }
    function prepass() {
      const y = seaY(),
        under = camera.position.y < y;
      st.has.refl = st.has.refr = false;
      if (st.level <= 0 || under) return;
      const sm = renderer.shadowMap,
        keep = { auto: sm.autoUpdate, need: sm.needsUpdate, clip: renderer.clippingPlanes, target: renderer.getRenderTarget() };
      sm.autoUpdate = false;
      sm.needsUpdate = false;
      waterLayer(false);
      // dưới nước: giữ phần thấp hơn mặt nước
      fit(refr, SCALE.refr);
      down.constant = y + CUT;
      renderer.clippingPlanes = [down];
      renderer.setRenderTarget(refr);
      renderer.clear();
      renderer.render(scene, camera);
      st.has.refr = true;
      // phản chiếu: giữ phần cao hơn mặt nước, nhìn từ máy quay soi gương
      if (st.level >= 2) {
        placeMirror(y);
        fit(refl, SCALE.refl);
        up.constant = -(y - CUT);
        renderer.clippingPlanes = [up];
        renderer.setRenderTarget(refl);
        renderer.clear();
        renderer.render(scene, mirror);
        st.has.refl = true;
      }
      renderer.clippingPlanes = keep.clip;
      renderer.setRenderTarget(keep.target);
      waterLayer(true);
      sm.autoUpdate = keep.auto;
      sm.needsUpdate = keep.need;
    }
    G.waterPasses = {
      prepass,
      refl,
      refr,
      reflMat,
      st,
      get level() {
        return st.level;
      },
      set level(n) {
        st.level = n;
      },
    };
  }
  BK.WaterPasses = { setup, SCALE };
})(typeof self !== 'undefined' ? self : globalThis);
