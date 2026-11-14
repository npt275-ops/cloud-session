/* Bể Kính · render/magic/staff3d.js · Gậy phép trong tay phải nhân vật đang nhập hồn (design/ke-hoach-buoc-37.md mục 9)
 * Gậy gỗ bo tròn kiểu đồ chơi, tay cầm gần cổ gậy: thân thuôn, hai vòng đai, đầu gậy là một nhánh cong ôm viên ngọc sáng
 * màu hệ phép đang chọn (render/style/palette.js). Gậy không gắn cứng vào xương tay (giơ tay thì đầu gậy sẽ chĩa ra sau vai): bám theo chỗ bàn tay
 * phải (xương wrR), hướng tính riêng: đứng thẳng khi đi, đứng; lúc niệm phép (k 0..1) nghiêng về chỗ ngắm.
 * G.staff3d.update(người, hệ, hướng ngắm (hay null), k niệm phép), hide(), tip(out) (đầu gậy: đạn phép bay ra từ đây).
 * Cần: three.js, render/style/palette.js. */
(function (root) {
  const BK = root.BK || (root.BK = {});
  const LEN = 1.08, // (đơn vị khung người) dài gậy
    BELOW = 0.76; // phần gậy dưới bàn tay: tay cầm gần cổ gậy, đầu gậy chỉ nhô trên tay một đoạn ngắn
  function setup(G) {
    const { THREE, scene } = G;
    const wood = new THREE.MeshStandardMaterial({ color: '#8a5a36', roughness: 0.7 }),
      band = new THREE.MeshStandardMaterial({ color: '#c9a25a', roughness: 0.45, metalness: 0.3 }),
      gem = new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: '#9fe0ff', emissiveIntensity: 1.2, roughness: 0.2 });
    const grp = new THREE.Group(),
      body = new THREE.Group(); // (trục y của body là dọc thân gậy, gốc ở chỗ bàn tay)
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, LEN, 12), wood);
    shaft.position.y = LEN / 2 - BELOW;
    const capB = new THREE.Mesh(new THREE.SphereGeometry(0.042, 12, 10), wood);
    capB.position.y = -BELOW;
    const bands = [-0.07, LEN - BELOW - 0.12].map((y) => {
      const b = new THREE.Mesh(new THREE.TorusGeometry(0.038, 0.012, 8, 16).rotateX(Math.PI / 2), band);
      b.position.y = y;
      return b;
    });
    // đầu gậy: nhánh cong ôm ngọc
    const top = LEN - BELOW;
    const hook = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.026, 10, 20, Math.PI * 1.5), wood);
    hook.position.set(0, top + 0.08, 0);
    hook.rotation.set(0, Math.PI / 2, Math.PI * 0.75);
    const orb = new THREE.Mesh(new THREE.SphereGeometry(0.065, 16, 12), gem);
    orb.position.set(0, top + 0.08, 0);
    body.add(shaft, capB, hook, orb, ...bands);
    grp.add(body);
    grp.visible = false;
    for (const m of [shaft, capB, hook, ...bands]) m.castShadow = true;
    scene.add(grp);
    const up = new THREE.Vector3(0, 1, 0),
      dir = new THREE.Vector3(),
      q = new THREE.Quaternion(),
      tipLocal = new THREE.Vector3(0, top + 0.08, 0);
    let school = 'soul';
    function update(f, sch, aim, k) {
      if (!f || !f.rig || !f.rig.nodes.wrR) return hide();
      grp.visible = true;
      const s = f.rig.root.scale.y || 1;
      grp.position.setFromMatrixPosition(f.rig.nodes.wrR.matrixWorld);
      grp.scale.setScalar(s);
      // hướng thân gậy: thẳng đứng hơi ngả ra trước theo hướng người; niệm phép thì nghiêng về chỗ ngắm
      dir.set(Math.sin(f.yaw) * 0.18, 1, Math.cos(f.yaw) * 0.18).normalize();
      if (aim && k > 0) dir.lerp(aim.clone().normalize(), Math.min(1, k) * 0.75).normalize();
      body.quaternion.copy(q.setFromUnitVectors(up, dir));
      if (sch && sch !== school) {
        school = sch;
        gem.emissive.set(BK.Palette.c(school + '.mid'));
      }
      gem.emissiveIntensity = 1.1 + 0.4 * Math.sin(performance.now() * 0.004) + (k > 0 ? 1.2 * k : 0);
    }
    const hide = () => (grp.visible = false);
    const tip = (out) => {
      grp.updateMatrixWorld(true);
      return out.copy(tipLocal).applyMatrix4(body.matrixWorld);
    };
    G.staff3d = { update, hide, tip, get visible() {
      return grp.visible;
    } };
  }
  BK.Staff3D = { setup };
})(typeof self !== 'undefined' ? self : globalThis);
