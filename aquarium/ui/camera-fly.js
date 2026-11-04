/* Bể Kính · ui/camera-fly.js
 * Camera đi theo tay người chơi: bay tới một chỗ (flyTo, trượt êm), bay tự do bằng phím mũi tên, W A S D, Q E (lên xuống)
 * và nút bay trên màn hình điện thoại; bay ngang qua đảo nào thì đảo đó thành đảo đang xem. Không tự xoay camera.
 * Cần: game/world.js, render/scene3d.js, render/tank3d.js (bán kính vòm), ui/landbar.js (setFocus). */
(function (root) {
  const BK = root.BK || (root.BK = {});
  function setup(G) {
    const { THREE, camera, controls, clamp, lerp, $ } = G;
    let tween = null;
    function flyTo(p, dist, dir, y) { const k = camera.aspect < 0.8 ? 1.4 : 1; tween = { target: p.clone().setY(y == null ? 2 : y), t0: performance.now(), from: controls.target.clone(), dist: camera.position.distanceTo(controls.target), toDist: (dist || 30) * k, dirFrom: dir ? camera.position.clone().sub(controls.target).normalize() : null, dirTo: dir ? dir.clone().normalize() : null, dur: dir ? 1700 : 1200 }; }

    /* ---------- Bay tự do ---------- */
    const FLY = { keys: new Set(), pad: new Set(), v: new THREE.Vector3(), on: false, padOn: false, near: 0 };
    const FLY_KEYS = { ArrowUp: 'fwd', KeyW: 'fwd', ArrowDown: 'back', KeyS: 'back', ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', PageUp: 'up', KeyE: 'up', Space: 'up', PageDown: 'down', KeyQ: 'down', ShiftLeft: 'down', ShiftRight: 'down' };
    document.addEventListener('keydown', (e) => {
      const k = FLY_KEYS[e.code];
      if (!k || e.ctrlKey || e.metaKey || e.altKey || G.typing(e.target)) return;
      if (e.code === 'Space' && e.target && e.target.closest && e.target.closest('button, a, [role="tab"]')) return; // Space trên nút là bấm nút
      if (e.target && e.target.closest && e.target.closest('[role="tablist"]') && /^Arrow/.test(e.code)) return;
      e.preventDefault(); FLY.keys.add(k);
    });
    document.addEventListener('keyup', (e) => { const k = FLY_KEYS[e.code]; if (k) FLY.keys.delete(k); });
    window.addEventListener('blur', () => { FLY.keys.clear(); FLY.pad.clear(); });
    for (const b of document.querySelectorAll('#flyPad button')) {
      const k = b.dataset.k, on = (v) => (e) => { e.preventDefault(); if (v) FLY.pad.add(k); else FLY.pad.delete(k); b.classList.toggle('on', v); };
      b.addEventListener('pointerdown', on(true)); for (const ev of ['pointerup', 'pointercancel', 'pointerleave']) b.addEventListener(ev, on(false));
      b.addEventListener('contextmenu', (e) => e.preventDefault());
    }
    function padUi(on) { FLY.padOn = on; $('flyPad').hidden = !on; $('flyBtn').setAttribute('aria-pressed', String(on)); }
    $('flyBtn').onclick = () => padUi(!FLY.padOn);
    padUi(G.touchUi());
    const _ff = new THREE.Vector3(), _frt = new THREE.Vector3(), _fm = new THREE.Vector3(), _fo = new THREE.Vector3();
    function flyStep(dt) {
      const has = (k) => FLY.keys.has(k) || FLY.pad.has(k);
      _fm.set((has('right') ? 1 : 0) - (has('left') ? 1 : 0), (has('up') ? 1 : 0) - (has('down') ? 1 : 0), (has('fwd') ? 1 : 0) - (has('back') ? 1 : 0));
      FLY.v.lerp(_fm, Math.min(1, dt / (_fm.lengthSq() ? 180 : 260))); // tăng tốc êm, hãm dần
      if (FLY.v.lengthSq() < 4e-6) { FLY.v.set(0, 0, 0); FLY.on = false; return false; }
      if (!FLY.on) { FLY.on = true; tween = null; }
      const off = _fo.copy(camera.position).sub(controls.target), dist = off.length();
      const sp = clamp(dist * 0.85, 1.5, 230) * dt / 1000; // gần người thì bay chậm
      _ff.copy(off).setY(0); if (_ff.lengthSq() < 1e-6) _ff.set(0, 0, -1); else _ff.normalize().negate();
      _frt.set(-_ff.z, 0, _ff.x);
      const mx = _ff.x * FLY.v.z * sp + _frt.x * FLY.v.x * sp, mz = _ff.z * FLY.v.z * sp + _frt.z * FLY.v.x * sp;
      controls.target.x += mx; controls.target.z += mz; camera.position.x += mx; camera.position.z += mz;
      if (Math.abs(FLY.v.y) > 1e-3) { const nd = clamp(dist * (1 + FLY.v.y * 1.1 * dt / 1000), controls.minDistance, controls.maxDistance); off.setLength(nd); camera.position.copy(controls.target).add(off); }
      const r = Math.hypot(controls.target.x, controls.target.z), lim = G.DOME - 14;
      if (r > lim) { const k = lim / r - 1, dx = controls.target.x * k, dz = controls.target.z * k; controls.target.x += dx; controls.target.z += dz; camera.position.x += dx; camera.position.z += dz; }
      // bay tới trên đảo nào thì đảo đó thành đảo đang xem
      const t = performance.now();
      if (t > FLY.near) {
        FLY.near = t + 400; let best = -1, bd = 1e9;
        for (const L of G.lands) { const d = Math.hypot(controls.target.x - L.center.x, controls.target.z - L.center.z); if (d < bd) { bd = d; best = L.i; } }
        if (best >= 0 && bd < Lands3D.LAND_R && best !== G.focus) G.setFocus(best);
      }
      return true;
    }
    // mỗi khung hình: bay tự do, hoặc trượt tiếp tới chỗ đã chọn
    function update(dt, now) {
      if (flyStep(dt)) { tween = null; return; }
      if (!tween) return;
      const k = clamp((now - tween.t0) / (tween.dur || 1200), 0, 1), e = 1 - Math.pow(1 - k, 3);
      const off = camera.position.clone().sub(controls.target);
      controls.target.lerpVectors(tween.from, tween.target, e);
      if (tween.dirTo) off.copy(tween.dirFrom).lerp(tween.dirTo, e).normalize();
      off.setLength(lerp(tween.dist, tween.toDist || tween.dist, e));
      camera.position.copy(controls.target).add(off);
      if (k >= 1) tween = null;
    }
    Object.assign(G, { flyTo, cameraFly: { update } });
  }
  BK.CameraFly = { setup };
})(typeof self !== 'undefined' ? self : globalThis);
