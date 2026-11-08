/* Bể Kính · render/hpbars3d.js · Thanh máu (design/chien-tranh-thinh-vuong.md mục 8)
 * Thanh máu luôn quay về phía máy quay, nằm trên đầu người đang ra trận hay đang bị thương (render/village3d.js), trên cổng
 * đang bị đánh và trên nhà chính đang bị vây (game/cities.js). Màu từ xanh lá (đầy) qua vàng sang đỏ (sắp hết).
 * Mỗi khung hình: begin(), add(vị trí thế giới, phần máu 0..1, bề ngang), end(). Hai lớp khối lặp: nền tối và phần máu.
 * Cần: three.js. */
(function (root) {
  'use strict';
  const BK = root.BK || (root.BK = {});
  const MAX = 400;
  function create(o) {
    const { THREE, scene, camera } = o;
    const geo = new THREE.PlaneGeometry(1, 1);
    // nền vẽ trước, phần máu vẽ sau đè lên (cả hai trong suốt, thứ tự vẽ cố định), không bị nhà cửa che
    const mk = (mat, order) => { const I = new THREE.InstancedMesh(geo, mat, MAX); I.count = 0; I.frustumCulled = false; I.renderOrder = order; scene.add(I); return I; };
    const back = mk(new THREE.MeshBasicMaterial({ color: '#1b1d22', transparent: true, opacity: 0.8, depthWrite: false, depthTest: false }), 20);
    // phần máu: ba lớp theo mức máu (xanh lá, vàng, đỏ), mỗi lớp một màu cố định
    const fills = ['#4cd964', '#ffcc33', '#ff4d3d'].map((c) => mk(new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 1, depthWrite: false, depthTest: false }), 21));
    const M = new THREE.Matrix4(), S = new THREE.Vector3(), P = new THREE.Vector3(), R = new THREE.Vector3();
    let n = 0; const nf = [0, 0, 0];
    function begin() { n = 0; nf[0] = nf[1] = nf[2] = 0; }
    // pos: Vector3 thế giới (giữa thanh); frac: 0..1; w: bề ngang (đơn vị thế giới)
    function add(pos, frac, w) {
      if (n >= MAX) return;
      const f = Math.max(0, Math.min(1, frac)), h = Math.max(0.12, w * 0.13), q = camera.quaternion;
      R.set(1, 0, 0).applyQuaternion(q);
      S.set(w + h * 0.5, h * 1.6, 1); M.compose(pos, q, S); back.setMatrixAt(n, M);
      // phần máu dồn sang trái
      const b = f > 0.6 ? 0 : f > 0.3 ? 1 : 2;
      P.copy(pos).addScaledVector(R, -(w * (1 - f)) / 2); S.set(Math.max(0.001, w * f), h, 1); M.compose(P, q, S); fills[b].setMatrixAt(nf[b]++, M);
      n++;
    }
    function end() {
      back.count = n; back.visible = n > 0; back.instanceMatrix.needsUpdate = true;
      fills.forEach((I, k) => { I.count = nf[k]; I.visible = nf[k] > 0; I.instanceMatrix.needsUpdate = true; });
    }
    return { begin, add, end };
  }
  BK.HpBars3D = { create };
})(typeof self !== 'undefined' ? self : globalThis);
