/* Bể Kính · render/magic/staff3d.js · Gậy phép trong tay phải nhân vật đang nhập hồn (design/ke-hoach-buoc-37.md mục 9)
 * Gậy gỗ bo tròn kiểu đồ chơi, tay cầm gần cổ gậy: thân thuôn, hai vòng đai, đầu gậy là một nhánh cong ôm viên ngọc sáng
 * màu hệ phép đang chọn (render/style/palette.js). Gậy không gắn cứng vào xương tay (giơ tay thì đầu gậy sẽ chĩa ra sau vai): bám theo chỗ bàn tay
 * phải (xương wrR), hướng tính riêng (HOLD):
 *   chạy, đi, nhảy: cầm ngang gần giữa thân gậy, gần song song mặt đất, đầu gậy chĩa tới hơi ngóc lên (dáng cầm gậy chạy thật)
 *   đứng: chống gậy thẳng đứng, chân gậy chạm đất (trượt chỗ cầm dọc thân gậy cho vừa tầm tay)
 *   niệm phép (k 0..1): chĩa về phía chỗ ngắm, chếch lên CAST_UP (~53°) so với mặt đất.
 * Hai dáng trộn liền theo f.staffK (0 chống .. 1 cầm chạy), ghi vào người để render/body/motion3d.js đặt tay phải cho khớp.
 * Sức nặng: hướng trên chỉ là hướng đích; hướng thật đi qua render/magic/staff-weight.js (đầu gậy trễ khi tăng tốc, văng tới
 * khi phanh, quét theo sau khi rẽ, bập bênh theo bước, hơi trĩu). Chống gậy xuống đất: bụi nhỏ ở chân gậy (công thức
 * staffThud, cùng vòng sóng sáng của render/magic/staff-aura3d.js) và tiếng gỗ (G.staff3d.onPlant, game/spellbook.js gắn tiếng thud của render/fx/magic-audio.js).
 * Hào quang của gậy (quầng ngọc, đốm bay, vệt khi chạy, phù chú dưới chân gậy): render/magic/staff-aura3d.js.
 * G.staff3d.update(người, hệ, hướng ngắm (hay null), k niệm phép), hide(), tip(out) (đầu gậy: đạn phép bay ra từ đây).
 * Cần: three.js, render/style/palette.js, render/magic/staff-weight.js, render/magic/staff-aura3d.js, render/magic/vfx.js. */
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
    CAST_UP: 0.92, // (rad) niệm phép: gậy chếch lên chừng này so với mặt đất (~53°, cùng tay: render/body/motion3d.js CAST_ARM)
    PLANT_AT: 0.12, // f.staffK xuống dưới mức này (sau khi đã cầm chạy trên PLANT_FROM) là vừa chống gậy xuống đất
    PLANT_FROM: 0.6,
  };
  function setup(G) {
    const { THREE, scene } = G;
    const wood = new THREE.MeshStandardMaterial({ color: '#8a5a36', roughness: 0.7 }),
      band = new THREE.MeshStandardMaterial({ color: '#c9a25a', roughness: 0.45, metalness: 0.3 }),
      gem = new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: '#9fe0ff', emissiveIntensity: 1.2, roughness: 0.2 });
    // (gậy luôn ở trong tay: Hố đen không tách gậy ra hút riêng, magic/soul/blackhole/pieces.js)
    for (const m of [wood, band, gem]) m.userData.noVoid = true;
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
      baseW = new THREE.Vector3(),
      ID = new THREE.Quaternion();
    const SW = BK.StaffWeight,
      heavy = SW.state(),
      aura = BK.StaffAura3D.setup(G, body, tipLocal),
      tipW = new THREE.Vector3();
    let school = 'soul',
      last = 0,
      carried = 0; // (mức cầm chạy cao nhất gần đây: để biết lúc vừa chống gậy xuống)
    function update(f, sch, aim, k) {
      if (!f || !f.rig || !f.rig.nodes.wrR) return hide();
      if (!grp.visible) SW.reset(heavy); // (vừa hiện lại: gậy đặt thẳng vào tay, không văng từ chỗ cũ)
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
        want = (f.lift || 0) > 0.05 || (f.swimK || 0) > 0.3 ? 1 : Math.min(1, spd / HOLD.MOVE);
      const ck = (f.staffK = f.staffK == null ? want : f.staffK + (want - f.staffK) * Math.min(1, sec * HOLD.BLEND));
      // hướng đích khi cầm chạy: tới trước theo hướng người, ngóc nhẹ, chếch ra ngoài
      const sy = Math.sin(f.yaw),
        cy = Math.cos(f.yaw);
      dir.set(sy - cy * HOLD.OUT, 0, cy + sy * HOLD.OUT).normalize().multiplyScalar(Math.cos(HOLD.TILT)).setY(Math.sin(HOLD.TILT));
      q.copy(ID).slerp(qAim.setFromUnitVectors(up, dir), ck);
      // niệm phép: gậy chĩa về phía chỗ ngắm (hay phía trước) và chếch lên CAST_UP so với mặt đất, theo tay giơ gậy
      if (k > 0) {
        if (aim && aim.x * aim.x + aim.z * aim.z > 1e-4) dir.set(aim.x, 0, aim.z).normalize();
        else dir.set(sy, 0, cy);
        dir.multiplyScalar(Math.cos(HOLD.CAST_UP)).setY(Math.sin(HOLD.CAST_UP));
        q.slerp(qAim.setFromUnitVectors(up, dir), Math.min(1, k));
      }
      dir.copy(up).applyQuaternion(q);
      // chỗ cầm: chống thì trượt cho chân gậy chạm đất, cầm chạy thì cầm gần giữa
      const gy = G.vfx ? G.vfx.groundAt(hand.x, hand.z) : f.rig.root.position.y;
      const plant = Math.min(HOLD.SLIDE_MAX, Math.max(HOLD.SLIDE_MIN, BELOW + (gy - hand.y) / s)),
        slide = plant + (HOLD.CARRY_SLIDE - plant) * ck;
      // sức nặng: hướng thật theo sau hướng đích qua lò xo (render/magic/staff-weight.js)
      const real = SW.step(heavy, hand, dir, Math.max(0.3, tipLocal.y + slide) * s, sec);
      dir.set(real.x, real.y, real.z);
      body.quaternion.setFromUnitVectors(up, dir);
      body.position.copy(dir).multiplyScalar(slide);
      if (sch && sch !== school) {
        school = sch;
        gem.emissive.set(BK.Palette.c(school + '.mid'));
      }
      gem.emissiveIntensity = 1.1 + 0.4 * Math.sin(now * 0.004) + (k > 0 ? 1.2 * k : 0);
      // vừa chống gậy xuống đất: bụi nhỏ ở chân gậy, tiếng gỗ
      grp.updateMatrixWorld(true);
      tipW.copy(tipLocal).applyMatrix4(body.matrixWorld);
      baseW.set(0, -BELOW, 0).applyMatrix4(body.matrixWorld);
      const groundY = G.vfx ? G.vfx.groundAt(baseW.x, baseW.z) : gy;
      carried = Math.max(carried * Math.exp(-sec * 0.8), ck);
      const planted = ck < HOLD.PLANT_AT && carried > HOLD.PLANT_FROM;
      if (planted) {
        carried = 0;
        if (G.vfx) G.vfx.play('staffThud', v3.set(baseW.x, groundY + 0.02, baseW.z), { scale: s });
        if (G.staff3d.onPlant) G.staff3d.onPlant(0.6);
      }
      // hào quang (render/magic/staff-aura3d.js)
      aura.update(sec, { school, carry: ck, cast: Math.max(0, Math.min(1, k)), moving: spd > 0.3, planted, tip: tipW, base: baseW, groundY, s });
    }
    const v3 = new THREE.Vector3();
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
