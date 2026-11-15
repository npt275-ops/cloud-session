/* Bể Kính · render/magic/staff-aura3d.js · Linh lực riêng của gậy phép (design/ke-hoach-buoc-37.md mục 9b)
 * Gậy không chỉ là đồ cầm tay, nó có sức sống riêng, màu theo hệ phép đang chọn (render/style/palette.js):
 *   quầng   ngọc đầu gậy có quầng sáng thở theo nhịp chậm (niệm phép thì bừng lên)
 *   đom     ba đốm sáng bay vòng quanh ngọc trên ba quỹ đạo nghiêng khác nhau
 *   vệt     cầm gậy chạy: đầu gậy để lại vệt sáng mảnh phía sau
 *   bốc     chống gậy đứng: thỉnh thoảng một đốm sáng bốc lên từ ngọc
 *   ấn      chống gậy đứng: dưới chân gậy hiện vòng phù chú của hệ (render/magic/sigils.js) nằm sát đất, xoay chậm
 *   chống   lúc vừa chống gậy xuống: vòng sóng sáng và tia sáng toả trên đất
 * Mọi con số ở AURA. render/magic/staff3d.js gọi: BK.StaffAura3D.setup(G, thân gậy, chỗ ngọc) trả
 * { update(giây, { school, carry 0 chống..1 cầm chạy, cast 0..1, tip, base, groundY, s }), hide() }.
 * Cần: three.js, render/magic/vfx.js, render/magic/sigils.js, render/style/palette.js. */
(function (root) {
  const BK = root.BK || (root.BK = {});
  const AURA = {
    HALO: 0.42, // (đơn vị khung người) cỡ quầng quanh ngọc
    HALO_A: 0.55, // độ đậm quầng; thở thêm ± HALO_BREATH, niệm phép thêm HALO_CAST
    HALO_BREATH: 0.18,
    HALO_CAST: 0.45,
    MOTES: 3, // số đốm bay quanh ngọc
    MOTE_R: 0.15, // bán kính quỹ đạo
    MOTE_SIZE: 0.06,
    MOTE_SPIN: 2.6, // (vòng/giây × 2π) tốc độ bay vòng
    TRAIL_RATE: 34, // (hạt/giây) vệt đầu gậy lúc chạy
    TRAIL: { life: [0.3, 0.55], size: [0.08, 0.01], drag: 2.5, alpha: 0.9 },
    RISE_RATE: 3, // (hạt/giây) đốm bốc lên lúc đứng chống gậy
    RISE: { life: [1, 1.6], size: [0.06, 0.01], grav: -0.35, drag: 1.2, alpha: 0.85 },
    RUNE_R: 0.95, // (đơn vị khung người) cỡ vòng phù chú dưới chân gậy
    RUNE_A: 0.75, // độ đậm khi chống hẳn
    RUNE_SPIN: 0.3, // (rad/giây)
    PLANT_AT: 0.25, // carry dưới mức này (sau khi đã cầm chạy trên PLANT_FROM) là vừa chống gậy xuống
    PLANT_FROM: 0.7,
  };
  // vòng sóng và tia sáng lúc chống gậy (công thức của render/magic/vfx.js; '@' thay bằng hệ đang chọn)
  const PLANT = {
    glow: [{ n: 12, life: [0.35, 0.7], size: [0.07, 0.01], speed: [1.2, 2.4], dir: 'flat', up: 0.3, drag: 3, color: ['@.core', '@.mid'], alpha: 0.9 }],
    decal: [{ kind: 'ring', r: [0.08, 0.9], life: 0.7, color: '@.mid', alpha: 0.6 }],
  };
  function glowTexture(THREE) {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const g = c.getContext('2d'),
      grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grd.addColorStop(0, 'rgba(255,255,255,1)');
    grd.addColorStop(0.25, 'rgba(255,255,255,0.55)');
    grd.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grd;
    g.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  }
  // công thức chống gậy theo hệ (thay '@'), giữ lại dùng tiếp
  const plantOf = {};
  function plantRecipe(school) {
    if (plantOf[school]) return plantOf[school];
    const sub = (v) => (Array.isArray(v) ? v.map(sub) : typeof v === 'string' ? v.replace('@', school) : v);
    const r = {};
    for (const k in PLANT) r[k] = PLANT[k].map((s) => Object.fromEntries(Object.entries(s).map(([a, b]) => [a, sub(b)])));
    return (plantOf[school] = r);
  }

  function setup(G, body, orbPos) {
    const { THREE, scene } = G;
    const tex = glowTexture(THREE);
    const add = (o) => Object.assign(o, { transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
    const halo = new THREE.Sprite(new THREE.SpriteMaterial(add({ map: tex, color: '#9fe0ff', opacity: AURA.HALO_A })));
    halo.position.copy(orbPos);
    halo.scale.setScalar(AURA.HALO);
    const motes = [];
    for (let i = 0; i < AURA.MOTES; i++) {
      const m = new THREE.Sprite(new THREE.SpriteMaterial(add({ map: tex, color: '#ffffff', opacity: 0.95 })));
      m.scale.setScalar(AURA.MOTE_SIZE);
      motes.push(m);
    }
    body.add(halo, ...motes);
    // ấn dưới chân gậy: nằm trong cảnh (không theo thân gậy), sát đất
    // (trộn màu thường, không cộng sáng: cộng sáng thì chìm mất trên cát, cỏ sáng ban ngày)
    const runeMat = new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, opacity: 0, polygonOffset: true, polygonOffsetFactor: -2 });
    const rune = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), runeMat);
    rune.renderOrder = 3;
    rune.visible = false;
    scene.add(rune);
    const v0 = new THREE.Vector3(),
      p = new THREE.Vector3();
    let school = null,
      t = 0,
      trailAcc = 0,
      riseAcc = 0,
      carried = 0; // (mức cầm chạy cao nhất gần đây: để biết lúc vừa chống gậy xuống)
    function recolor(sch) {
      school = sch;
      const mid = BK.Palette.c(sch + '.mid'),
        core = BK.Palette.c(sch + '.core');
      halo.material.color.set(mid);
      for (const m of motes) m.material.color.set(core);
      runeMat.map = BK.Sigils.texture(THREE, sch);
      runeMat.needsUpdate = true;
    }
    function update(sec, o) {
      if (o.school !== school) recolor(o.school);
      t += sec;
      const carry = o.carry,
        plant = 1 - carry;
      // quầng thở, niệm phép thì bừng lên
      const breath = Math.sin(t * 2.2);
      halo.material.opacity = AURA.HALO_A + AURA.HALO_BREATH * breath + AURA.HALO_CAST * o.cast;
      halo.scale.setScalar(AURA.HALO * (1 + 0.12 * breath + 0.5 * o.cast));
      // đốm bay quanh ngọc, mỗi đốm một quỹ đạo nghiêng
      for (let i = 0; i < motes.length; i++) {
        const a = t * AURA.MOTE_SPIN * (1 + 0.25 * i) + (i * Math.PI * 2) / motes.length,
          tilt = 0.5 + i * 0.7,
          r = AURA.MOTE_R * (1 + 0.3 * o.cast);
        motes[i].position.set(Math.cos(a) * r, Math.sin(a) * r * Math.sin(tilt), Math.sin(a) * r * Math.cos(tilt)).add(orbPos);
      }
      const V = G.vfx;
      if (V) {
        const core = school + '.core',
          mid = school + '.mid';
        // vệt đầu gậy khi cầm chạy
        trailAcc += sec * AURA.TRAIL_RATE * carry * (o.moving ? 1 : 0);
        for (; trailAcc >= 1; trailAcc--) {
          p.copy(o.tip).addScalar((Math.random() - 0.5) * 0.04 * o.s);
          V.spawn('glow', p, v0.set(0, 0, 0), Object.assign({ color: [core, mid] }, AURA.TRAIL, { size: AURA.TRAIL.size.map((z) => z * o.s) }));
        }
        // đốm bốc lên khi đứng chống gậy
        riseAcc += sec * AURA.RISE_RATE * plant;
        for (; riseAcc >= 1; riseAcc--) {
          p.copy(o.tip).add(v0.set(Math.random() - 0.5, 0, Math.random() - 0.5).multiplyScalar(0.12 * o.s));
          V.spawn('glow', p, v0.set(0, 0.25 * o.s, 0), Object.assign({ color: [core, mid] }, AURA.RISE, { size: AURA.RISE.size.map((z) => z * o.s) }));
        }
        // vừa chống gậy xuống: sóng sáng trên đất
        carried = Math.max(carried * Math.exp(-sec * 0.8), carry);
        if (carry < AURA.PLANT_AT && carried > AURA.PLANT_FROM) {
          carried = 0;
          V.play(plantRecipe(school), p.set(o.base.x, o.groundY, o.base.z), { scale: o.s });
        }
      }
      // ấn dưới chân gậy
      const ra = AURA.RUNE_A * plant * plant * (0.8 + 0.2 * Math.sin(t * 1.6));
      rune.visible = ra > 0.01;
      runeMat.opacity = ra;
      rune.position.set(o.base.x, o.groundY + 0.035, o.base.z);
      rune.rotation.y = t * AURA.RUNE_SPIN;
      rune.scale.setScalar(AURA.RUNE_R * o.s * (0.85 + 0.15 * plant));
    }
    const hide = () => (rune.visible = false);
    return { update, hide };
  }
  BK.StaffAura3D = { setup, AURA };
})(typeof self !== 'undefined' ? self : globalThis);
