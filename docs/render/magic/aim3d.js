/* Bể Kính · render/magic/aim3d.js · Vòng ngắm trên mặt đất của phép cần ngắm (design/ke-hoach-buoc-37.md)
 * Một vòng mảnh nằm sát mặt đất ở chỗ ngắm, màu theo hệ phép (render/style/palette.js), thở nhẹ; ngắm chỗ không dùng được
 * (quá xa, không đủ linh lực) thì vòng xám, mờ. G.aim3d.show(chỗ, 'fire.mid', được dùng không), hide().
 * Cần: three.js, render/style/palette.js. */
(function (root) {
  const BK = root.BK || (root.BK = {});
  const R = 0.55; // (đơn vị đảo) bán kính vòng
  function setup(G) {
    const { THREE, scene } = G;
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(R * 0.82, R, 40).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.8, depthWrite: false, fog: false }),
    );
    const dot = new THREE.Mesh(
      new THREE.CircleGeometry(R * 0.12, 16).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.8, depthWrite: false, fog: false }),
    );
    const grp = new THREE.Group();
    grp.add(ring, dot);
    grp.visible = false;
    grp.renderOrder = 10;
    scene.add(grp);
    const grey = new THREE.Color('#9a9a9a');
    function show(p, colorPath, ok) {
      grp.visible = true;
      grp.position.set(p.x, p.y + 0.05, p.z);
      const t = performance.now() * 0.001,
        k = 1 + Math.sin(t * 5) * 0.06;
      ring.scale.setScalar(k);
      const c = ok ? new THREE.Color(BK.Palette.c(colorPath)) : grey;
      ring.material.color.copy(c);
      dot.material.color.copy(c);
      ring.material.opacity = ok ? 0.85 : 0.4;
      dot.material.opacity = ok ? 0.8 : 0.3;
    }
    const hide = () => (grp.visible = false);
    G.aim3d = { show, hide };
  }
  BK.Aim3D = { setup };
})(typeof self !== 'undefined' ? self : globalThis);
