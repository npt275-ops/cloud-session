/* Bể Kính · render/body/feet3d.js · Vệt bóng tiếp đất dưới bàn chân người có thân mềm (design/ke-hoach-buoc-34.md điểm 4)
 * Bóng nắng thật (render/sky3d.js) cho bóng cả người; vệt này là chỗ bàn chân chạm đất: tròn mờ, sẫm, ngay dưới mắt cá.
 * Chân nhấc lên (bước, nhảy) thì vệt nhỏ lại và nhạt đi (vẽ hai lớp lồng nhau: lớp trong chỉ hiện khi chân sát đất), nên
 * người "đứng" trên đất chứ không lơ lửng. Một khối lặp cho mọi người: một lượt vẽ.
 * create(G) trả { update(danh sách người), hide() }; render/body/softbody3d.js gọi mỗi khung hình.
 * Cần: three.js, render/rig3d.js (xương anL, anR). */
(function (root) {
  const BK = root.BK || (root.BK = {});
  const MAX = 64, // tối đa số vệt (hai vệt mỗi người, hai lớp)
    SIZE = 0.34, // (đơn vị khung) bề ngang vệt dưới một bàn chân
    LIFT = 0.35, // (đơn vị khung) nhấc chân cao chừng này thì vệt nhỏ nhất
    COLOR = '#2a2018',
    OPACITY = 0.42;
  function tex(THREE) {
    const cv = document.createElement('canvas');
    cv.width = cv.height = 64;
    const c = cv.getContext('2d'),
      g = c.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.45, 'rgba(255,255,255,0.65)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g;
    c.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(cv);
  }
  function create(G) {
    const { THREE } = G;
    const mat = new THREE.MeshBasicMaterial({
      color: COLOR,
      alphaMap: tex(THREE),
      transparent: true,
      opacity: OPACITY,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    });
    const geo = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
    const mesh = new THREE.InstancedMesh(geo, mat, MAX);
    mesh.count = 0;
    mesh.frustumCulled = false;
    mesh.renderOrder = 1;
    G.scene.add(mesh);
    const M = new THREE.Matrix4(),
      Q = new THREE.Quaternion(),
      S = new THREE.Vector3(),
      P = new THREE.Vector3(),
      E = new THREE.Euler();
    let a0 = null; // độ cao mắt cá lúc đứng thẳng (đơn vị khung)
    // list: các người có thân mềm đang hiện (f.rig, f.lift)
    function update(list) {
      let n = 0;
      for (const f of list) {
        if (!f.soft || !f.soft.mesh.visible) continue;
        const R = f.rig,
          s = R.root.scale.x || 1,
          ground = R.root.position.y - (f.lift || 0);
        if (a0 == null) a0 = BK.SoftBody3D && BK.SoftBody3D.ankle ? BK.SoftBody3D.ankle() : 0.1;
        for (const k of ['anL', 'anR']) {
          const node = R.nodes[k];
          if (!node || n + 2 > MAX) continue;
          P.setFromMatrixPosition(node.matrixWorld);
          const h = Math.max(0, (P.y - ground) / s - a0),
            t = Math.max(0, 1 - h / LIFT); // 1 sát đất, 0 nhấc cao
          E.set(0, f.yaw || 0, 0);
          Q.setFromEuler(E);
          // lớp ngoài: luôn có, nhỏ lại khi nhấc chân; lớp trong: sẫm thêm khi chân chạm đất
          const w = SIZE * s * (0.55 + 0.45 * t);
          M.compose(P.set(P.x, ground + 0.02 * s, P.z), Q, S.set(w, 1, w * 1.5));
          mesh.setMatrixAt(n++, M);
          if (t > 0.6) {
            const w2 = w * 0.6;
            M.compose(P, Q, S.set(w2, 1, w2 * 1.4));
            mesh.setMatrixAt(n++, M);
          }
        }
      }
      mesh.count = n;
      mesh.instanceMatrix.needsUpdate = true;
      mesh.visible = n > 0;
    }
    function hide() {
      mesh.count = 0;
      mesh.visible = false;
    }
    return { update, hide, mesh };
  }
  BK.Feet3D = { create };
})(typeof self !== 'undefined' ? self : globalThis);
