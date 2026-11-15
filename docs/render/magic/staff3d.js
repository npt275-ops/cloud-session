/* Bể Kính · render/magic/staff3d.js · Gậy phép trong tay phải nhân vật đang nhập hồn (design/ke-hoach-buoc-37.md mục 9)
 * Gậy gỗ bo tròn kiểu đồ chơi, tay cầm gần cổ gậy: thân thuôn, hai vòng đai, đầu gậy là một nhánh cong ôm viên ngọc sáng
 * màu hệ phép đang chọn (render/style/palette.js). Gậy không gắn cứng vào xương tay (giơ tay thì đầu gậy sẽ chĩa ra sau vai): bám theo chỗ bàn tay
 * phải (xương wrR), hướng tính riêng (HOLD):
 *   chạy, đi, nhảy: cầm ngang gần giữa thân gậy, gần song song mặt đất, đầu gậy chĩa tới hơi ngóc lên (dáng cầm gậy chạy thật)
 *   đứng: chống gậy thẳng đứng, chân gậy chạm đất (trượt chỗ cầm dọc thân gậy cho vừa tầm tay)
 *   niệm phép (k 0..1): nghiêng về chỗ ngắm.
 * Hai dáng trộn liền theo f.staffK (0 chống .. 1 cầm chạy), ghi vào người để render/body/motion3d.js đặt tay phải cho khớp.
 * Linh lực riêng của gậy (quầng, đốm bay, vệt, ấn dưới chân gậy): render/magic/staff-aura3d.js.
 * G.staff3d.update(người, hệ, hướng ngắm (hay null), k niệm phép), hide(), tip(out) (đầu gậy: đạn phép bay ra từ đây).
 * Cần: three.js, render/style/palette.js, render/magic/staff-aura3d.js. */
(function (root) {
  const BK = root.BK || (root.BK = {});
  const LEN = 1.08, // (đơn vị khung người) dài gậy
    BELOW = 0.76; // phần gậy dưới bàn tay: tay cầm gần cổ gậy, đầu gậy chỉ nhô trên tay một đoạn ngắn
  const HOLD = {
    MOVE: 1.1, // (đơn vị mỗi giây) đi nhanh hơn chừng này là cầm gậy chạy hẳn
    TILT: 0.12, // (rad) lúc cầm chạy: đầu gậy ngóc lên khỏi phương ngang
    OUT: 0.08, // lúc cầm chạy: đầu gậy hơi chếch ra ngoài (phải), không chĩa vào người
    CARRY_SLIDE: 0.24, // (đơn vị khung người) lúc cầm chạy: dời chỗ cầm về gần giữa thân gậy
    SLIDE_MIN: -0.15, // lúc chống: chỗ cầm chỉ trượt trong khoảng này (tay thấp quá, cao quá thì gậy nhấc khỏi đất)
    SLIDE_MAX: 0.5,
    BLEND: 6, // (1/giây) tốc độ đổi dáng
  };
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
      qAim = new THREE.Quaternion(),
      tipLocal = new THREE.Vector3(0, top + 0.08, 0),
      hand = new THREE.Vector3(),
      tipW = new THREE.Vector3(),
      baseW = new THREE.Vector3(),
      ID = new THREE.Quaternion();
    const aura = BK.StaffAura3D.setup(G, body, tipLocal);
    let school = 'soul',
      last = 0;
    function update(f, sch, aim, k) {
      if (!f || !f.rig || !f.rig.nodes.wrR) return hide();
      grp.visible = true;
      const now = performance.now(),
        sec = last ? Math.min(0.1, (now - last) / 1000) : 0;
      last = now;
      const s = f.rig.root.scale.y || 1;
      hand.setFromMatrixPosition(f.rig.nodes.wrR.matrixWorld);
      grp.position.copy(hand);
      grp.scale.setScalar(s);
      // cầm chạy hay chống: theo tốc độ thật (render/body/motion3d.js), đang bay, đang bơi
      const spd = f.motion ? f.motion.spd : 0,
        moving = spd > 0.3,
        want = (f.lift || 0) > 0.05 || (f.swimK || 0) > 0.3 ? 1 : Math.min(1, spd / HOLD.MOVE);
      const ck = (f.staffK = f.staffK == null ? want : f.staffK + (want - f.staffK) * Math.min(1, sec * HOLD.BLEND));
      // hướng cầm chạy: tới trước theo hướng người, ngóc nhẹ, chếch ra ngoài
      const sy = Math.sin(f.yaw),
        cy = Math.cos(f.yaw);
      dir.set(sy - cy * HOLD.OUT, 0, cy + sy * HOLD.OUT).normalize().multiplyScalar(Math.cos(HOLD.TILT)).setY(Math.sin(HOLD.TILT));
      q.copy(ID).slerp(qAim.setFromUnitVectors(up, dir), ck);
      if (aim && k > 0) q.slerp(qAim.setFromUnitVectors(up, dir.copy(aim).normalize()), Math.min(1, k) * 0.75);
      body.quaternion.copy(q);
      // chỗ cầm: chống thì trượt cho chân gậy chạm đất, cầm chạy thì cầm gần giữa
      const gy = G.vfx ? G.vfx.groundAt(hand.x, hand.z) : f.rig.root.position.y;
      const plant = Math.min(HOLD.SLIDE_MAX, Math.max(HOLD.SLIDE_MIN, BELOW + (gy - hand.y) / s));
      dir.copy(up).applyQuaternion(q);
      body.position.copy(dir).multiplyScalar(plant + (HOLD.CARRY_SLIDE - plant) * ck);
      if (sch && sch !== school) {
        school = sch;
        gem.emissive.set(BK.Palette.c(school + '.mid'));
      }
      gem.emissiveIntensity = 1.1 + 0.4 * Math.sin(now * 0.004) + (k > 0 ? 1.2 * k : 0);
      grp.updateMatrixWorld(true);
      tipW.copy(tipLocal).applyMatrix4(body.matrixWorld);
      baseW.set(0, -BELOW, 0).applyMatrix4(body.matrixWorld);
      aura.update(sec, { school, carry: ck, cast: Math.max(0, Math.min(1, k)), moving, tip: tipW, base: baseW, groundY: G.vfx ? G.vfx.groundAt(baseW.x, baseW.z) : gy, s });
    }
    const hide = () => {
      grp.visible = false;
      aura.hide();
    };
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
