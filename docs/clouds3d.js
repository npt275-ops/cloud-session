/* Bể Kính — mây trong bể kính.
 * Mây chỉ sống bên trong vòm kính (bên ngoài không có mây) và bay trên CÙNG MỘT TẦNG, như một mặt phẳng mây.
 * Mây kéo vào từng đợt theo gió, mỗi đợt hướng về một chỗ ngẫu nhiên (trên đảo hay ngoài biển).
 * Mây chạm nhau thì dính lại theo bề ngang: cụm mây rộng ra chứ không to lên. Cụm đủ đông thì tích nước, sẫm lại
 * thành mây đen rồi đổ mưa. Mỗi đám mây chỉ chứa một lượng nước nhất định: mưa trút từng đợt nặng hạt, ngớt, rồi
 * lại nặng hạt; cụm càng nhiều mây thì vệt mưa càng rộng. Mây nào hết nước thì tan biến. Mây trắng trôi tới chạm
 * vào cơn mưa đang rơi cũng dính vào, làm vệt mưa rộng thêm. Sau đó đợt mây mới lại kéo đến và tích tụ lại.
 * Toàn bộ mây là một lượt vẽ; mưa và chớp dùng chung vài khối dựng sẵn. */
(function (root) {
  'use strict';

  function create(K) {
    const { THREE, scene, lands3d, dome, reduce, glowTex, audio, flash, rainOf } = K;
    const v3 = (x, y, z) => new THREE.Vector3(x, y, z);
    const rnd = Math.random;
    const MAXC = 72, PUFFS = 5;
    const LAYER = 64;           // độ cao của tầng mây
    const CONTACT = 15;         // hai đám mây cách nhau dưới khoảng này là dính vào nhau
    const REST = 12.5;          // khoảng cách hai đám mây dính nhau tự xếp tới (sát cạnh, không chồng lên nhau)
    const RAIN_RATE = 0.075;    // lượng nước một đám mây mất mỗi giây khi mưa nặng hạt
    const inR = Math.sqrt(dome * dome - LAYER * LAYER) - 18; // bán kính tầng mây còn nằm trong vòm

    /* ----- các cục mây: một khối dựng sẵn cho tất cả ----- */
    const geo = new THREE.IcosahedronGeometry(1, 1);
    const mat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 1, flatShading: true, emissive: '#ffffff', emissiveIntensity: 0.16 });
    const puffs = new THREE.InstancedMesh(geo, mat, MAXC * PUFFS);
    puffs.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    puffs.setColorAt(0, new THREE.Color()); puffs.instanceColor.setUsage(THREE.DynamicDrawUsage);
    puffs.count = 0; puffs.frustumCulled = false; puffs.castShadow = true; scene.add(puffs);
    puffs.raycast = () => {};
    const WHITE = new THREE.Color('#ffffff'), DARK = new THREE.Color('#3b4250'), NIGHT = new THREE.Color('#8f9bb4'), SPENT = new THREE.Color('#9aa3ad'), _c = new THREE.Color();
    const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), _p = new THREE.Vector3();

    const clouds = [];
    let wind = rnd() * Math.PI * 2, nextWave = 2500, waveLeft = 0, waveGap = 0, waveAim = null;

    // một chỗ ngẫu nhiên trong bể: trên một đảo hay ngoài biển
    function randomSpot() {
      const rainy = rainOf ? rainOf() : null;
      if (rainy && rnd() < 0.45) return rainy.clone();
      if (rnd() < 0.45) return lands3d.lands[Math.floor(rnd() * lands3d.lands.length)].center.clone();
      const a = rnd() * Math.PI * 2, r = Math.sqrt(rnd()) * (inR - 20);
      return v3(Math.cos(a) * r, 0, Math.sin(a) * r);
    }

    function spawn(aim) {
      if (clouds.length >= MAXC) return;
      // vào từ mép tầng mây phía đầu gió, hướng về chỗ hẹn của đợt mây
      const side = wind + Math.PI + (rnd() - 0.5) * 1.3;
      const pos = v3(Math.cos(side) * inR * 0.95, 0, Math.sin(side) * inR * 0.95);
      const to = aim ? aim.clone() : v3(0, 0, 0);
      to.x += (rnd() - 0.5) * 36; to.z += (rnd() - 0.5) * 36;
      const vel = to.sub(pos).setY(0).normalize().multiplyScalar(3 + rnd() * 1.8);
      const parts = [];
      // các cục bông xoè ngang, đáy gần như phẳng
      for (let i = 0; i < PUFFS; i++) {
        const a = (i / PUFFS) * Math.PI * 2 + rnd() * 0.8, d = i === 0 ? 0 : 3.2 + rnd() * 2.4;
        parts.push({ x: Math.cos(a) * d, y: i === 0 ? 0.6 : (rnd() - 0.4) * 0.8, z: Math.sin(a) * d, s: i === 0 ? 5.2 : 3.2 + rnd() * 1.6 });
      }
      clouds.push({ pos, vel, parts, size: 0, water: 0.25 + rnd() * 0.25, dark: 0, age: 0, life: 70 + rnd() * 50, ph: rnd() * 6,
        rain: false, fade: false, slot: null, comp: 0, y: (rnd() - 0.5) * 1.2 });
    }

    /* ----- cơn mưa: tối đa năm cơn cùng lúc, mỗi cơn một khối hạt ----- */
    const DROPS = 900, slots = [];
    for (let s = 0; s < 5; s++) {
      const pos = new Float32Array(DROPS * 6), seed = [];
      for (let i = 0; i < DROPS; i++) { const a = rnd() * Math.PI * 2, r = Math.sqrt(rnd()) * 7; seed.push({ ox: Math.cos(a) * r, oz: Math.sin(a) * r, u: rnd(), cut: rnd() }); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const m = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: '#cfe0ee', transparent: true, opacity: 0.65, depthWrite: false }));
      m.frustumCulled = false; m.visible = false; m.renderOrder = 5; scene.add(m);
      // tia chớp: đường gấp khúc từ chân mây xuống mặt đất, kèm quầng sáng
      const bp = new Float32Array(14 * 3), bg = new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.BufferAttribute(bp, 3));
      const bolt = new THREE.Line(bg, new THREE.LineBasicMaterial({ color: '#f4f7ff', transparent: true, opacity: 0, depthWrite: false, fog: false }));
      bolt.frustumCulled = false; bolt.visible = false; bolt.renderOrder = 6; scene.add(bolt);
      const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: '#cfd9ff', blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0 }));
      glow.scale.set(60, 60, 1); glow.visible = false; scene.add(glow);
      slots.push({ on: false, m, pos, seed, bolt, bp, glow, members: [], k: 0, I: 0, heavy: true, burstT: 0, nextBolt: 0, boltT: 0 });
    }
    const groundAt = (x, z) => { // mặt đảo hay mặt biển dưới cơn mưa
      for (const L of lands3d.lands) if (Math.hypot(x - L.center.x, z - L.center.z) < lands3d.LAND_R) return 1.2;
      return -0.4;
    };
    function fireBolt(st) {
      const c = st.members[Math.floor(rnd() * st.members.length)]; if (!c) return;
      const x = c.pos.x + (rnd() - 0.5) * 8, z = c.pos.z + (rnd() - 0.5) * 8, gy = groundAt(x, z), top = LAYER - 3;
      let px = x, pz = z;
      for (let i = 0; i < 14; i++) {
        const u = i / 13, y = top - (top - gy) * u;
        if (i > 0 && i < 13) { px += (rnd() - 0.5) * 3.2; pz += (rnd() - 0.5) * 3.2; }
        st.bp[i * 3] = px; st.bp[i * 3 + 1] = y; st.bp[i * 3 + 2] = pz;
      }
      st.bolt.geometry.attributes.position.needsUpdate = true;
      st.bolt.visible = true; st.boltT = 1; st.glow.visible = true; st.glow.position.set(x, top - 2, z);
      if (flash) flash(0.9);
      if (audio && audio.on) setTimeout(() => audio.thunder(), 120 + rnd() * 500);
    }

    /* ----- cập nhật ----- */
    const SPEED = () => Math.max(0.5, (K.speed ? K.speed() : 1));
    const comps = [];
    function update(dt, t, night) {
      if (dt > 250) dt = 250;
      const sdt = (dt / 1000) * (reduce ? 0.4 : 1), sp = Math.min(4, SPEED()), st_ = sdt * sp;

      // các đợt mây: mỗi đợt bảy tới mười hai đám, hẹn nhau về một chỗ ngẫu nhiên
      wind += sdt * 0.01;
      nextWave -= dt * sp;
      if (nextWave <= 0 && waveLeft <= 0) {
        waveLeft = 7 + Math.floor(rnd() * 6); waveGap = 0; waveAim = randomSpot();
        nextWave = 10000 + rnd() * 12000;
      }
      if (waveLeft > 0) { waveGap -= dt * sp; if (waveGap <= 0) { spawn(waveAim); waveLeft--; waveGap = 700 + rnd() * 1300; } }

      // mây chạm nhau thì dính lại thành cụm, xếp sát cạnh nhau trên cùng một tầng
      const live = clouds.filter((c) => !c.fade);
      for (let i = 0; i < live.length; i++) live[i].comp = i;
      const find = (i) => { while (live[i].comp !== i) { live[i].comp = live[live[i].comp].comp; i = live[i].comp; } return i; };
      for (let i = 0; i < live.length; i++) for (let j = i + 1; j < live.length; j++) {
        const a = live[i], b = live[j], dx = b.pos.x - a.pos.x, dz = b.pos.z - a.pos.z, d = Math.hypot(dx, dz) || 0.01;
        if (d < CONTACT + 8) {
          // lò xo: kéo lại tới khoảng nghỉ, đẩy ra nếu chồng lên nhau
          const f = (d - REST) * (d < CONTACT ? 1.4 : 0.5) * st_ / d;
          a.vel.x += dx * f; a.vel.z += dz * f; b.vel.x -= dx * f; b.vel.z -= dz * f;
        }
        if (d < CONTACT) {
          // dính rồi thì trôi cùng nhau
          const mx = (a.vel.x + b.vel.x) / 2, mz = (a.vel.z + b.vel.z) / 2, k = Math.min(1, st_ * 2);
          a.vel.x += (mx - a.vel.x) * k; a.vel.z += (mz - a.vel.z) * k; b.vel.x += (mx - b.vel.x) * k; b.vel.z += (mz - b.vel.z) * k;
          const ri = find(i), rj = find(j); if (ri !== rj) live[ri].comp = rj;
        }
      }
      comps.length = 0;
      const byRoot = new Map();
      for (let i = 0; i < live.length; i++) { const r = find(i); let g = byRoot.get(r); if (!g) { g = []; byRoot.set(r, g); comps.push(g); } g.push(live[i]); }

      // mỗi cụm: tích nước, sẫm lại, đủ nặng thì mưa
      for (const s of slots) s.members.length = 0;
      for (const g of comps) {
        const n = g.length;
        let raining = g.some((c) => c.rain), w = 0;
        for (const c of g) w += c.water;
        const avg = w / n;
        if (!raining && ((n >= 3 && avg >= 1.0) || (n === 2 && avg >= 1.05 && rnd() < st_ * 0.15))) raining = true; // đôi khi hai đám cũng đổ một cơn mưa nhỏ
        let slot = null;
        if (raining) {
          for (const c of g) if (c.slot && c.slot.on) { slot = c.slot; break; }
          if (!slot) { slot = slots.find((s) => !s.on); if (slot) { slot.on = true; slot.k = 0; slot.I = 0; slot.heavy = true; slot.burstT = 2500 + rnd() * 2500; slot.nextBolt = 1500 + rnd() * 2500; } }
        }
        for (const c of g) {
          if (raining) { c.rain = true; c.slot = slot; if (slot) slot.members.push(c); } // mây trắng mới dính vào cũng mưa với lượng nước nó mang theo
          else c.water = Math.max(0, Math.min(1.3, c.water + (n >= 2 ? 0.05 * (n - 1) : -0.01) * st_)); // tích nước khi đứng chung cụm; mây lẻ khô dần
        }
      }

      for (let i = clouds.length - 1; i >= 0; i--) {
        const c = clouds[i];
        c.age += st_;
        if (c.rain) {
          // mưa xả nước theo đợt nặng hạt hay ngớt của cơn mưa; hết nước thì tan
          const I = c.slot ? c.slot.I : 0.7;
          c.water -= RAIN_RATE * (0.25 + I) * st_;
          if (c.water <= 0) { c.rain = false; c.fade = true; c.slot = null; }
        }
        const want = c.fade ? 0.35 : c.rain ? 1 : Math.max(0, Math.min(1, (c.water - 0.45) / 0.5));
        c.dark += (want - c.dark) * Math.min(1, sdt * 0.8);
        // trôi theo gió; mây nặng trôi chậm
        const sl = Math.hypot(c.vel.x, c.vel.z), cap = 4 * (1 - 0.7 * c.dark);
        if (sl > cap) { c.vel.x *= cap / sl; c.vel.z *= cap / sl; }
        c.pos.x += c.vel.x * st_; c.pos.z += c.vel.z * st_;
        // không ra khỏi vòm kính: chạm vách thì dội vào trong; mây trắng già thì tan ở vách
        const r = Math.hypot(c.pos.x, c.pos.z);
        if (r > inR) {
          c.pos.x *= inR / r; c.pos.z *= inR / r;
          const nx = c.pos.x / r, nz = c.pos.z / r, dot = c.vel.x * nx + c.vel.z * nz;
          if (dot > 0) { c.vel.x -= 1.6 * dot * nx; c.vel.z -= 1.6 * dot * nz; }
          if (c.age > 25 && !c.rain) c.fade = true;
        }
        if (c.age > c.life && !c.rain && c.water < 0.9) c.fade = true;
        c.size = c.fade ? c.size - sdt * 0.3 : Math.min(1, c.size + sdt * 0.15);
        if (c.fade && c.size <= 0) { clouds.splice(i, 1); continue; }
      }
      for (const s of slots) if (s.on) s.members = s.members.filter((c) => c.rain);

      // các cơn mưa
      for (const st of slots) {
        if (st.on) {
          const has = st.members.length > 0;
          // mưa theo đợt: nặng hạt vài giây rồi ngớt, rồi lại nặng hạt
          st.burstT -= dt * sp;
          if (st.burstT <= 0) { st.heavy = !st.heavy; st.burstT = st.heavy ? 2500 + rnd() * 3500 : 1200 + rnd() * 2200; }
          st.I += ((st.heavy ? 1 : 0.18) - st.I) * Math.min(1, sdt * 2.5);
          st.k += ((has ? 1 : 0) - st.k) * Math.min(1, sdt * 1.2);
          if (!has && st.k < 0.03) { st.on = false; st.k = 0; }
          st.nextBolt -= dt;
          if (has && st.members.length >= 3 && st.heavy && st.nextBolt <= 0 && !reduce) { fireBolt(st); st.nextBolt = 3000 + rnd() * 6000; }
          if (has) st.last = st.members.slice(); // giữ chỗ để hạt mưa cuối cùng rơi nốt
        }
        st.m.visible = st.on && st.k > 0.02;
        if (st.m.visible) {
          const mem = st.members.length ? st.members : st.last || [], nm = mem.length, pos = st.pos, top = LAYER - 3, fall = (reduce ? 12 : 48) * sdt / (top + 1);
          const show = st.k * (0.15 + 0.85 * st.I);
          for (let i = 0; i < DROPS; i++) {
            const d = st.seed[i], o = i * 6;
            d.u -= fall; if (d.u < 0) d.u += 1;
            const c = nm ? mem[i % nm] : null;
            if (!c || d.cut > show) { pos[o + 1] = pos[o + 4] = -999; continue; } // đợt ngớt: ít hạt hơn
            const x = c.pos.x + d.ox, z = c.pos.z + d.oz, gy = -0.4, y = gy + d.u * (top - gy);
            pos[o] = x; pos[o + 1] = y; pos[o + 2] = z; pos[o + 3] = x + 0.15; pos[o + 4] = y - 1.7; pos[o + 5] = z;
          }
          st.m.geometry.attributes.position.needsUpdate = true;
        }
        if (st.boltT > 0) {
          st.boltT -= dt / 260;
          const k = Math.max(0, st.boltT), flick = k > 0.6 || (k > 0.25 && k < 0.4) ? 1 : 0.3;
          st.bolt.material.opacity = k * flick; st.glow.material.opacity = 0.85 * k * flick;
          if (st.boltT <= 0) { st.bolt.visible = false; st.glow.visible = false; }
        }
      }

      // vẽ các cục mây: cùng một tầng, đáy phẳng; mây không to lên khi dính hay khi mưa
      let n = 0;
      const nightK = night || 0;
      for (const c of clouds) {
        const s = c.size * c.size * (3 - 2 * c.size), bob = Math.sin(t * 0.0004 + c.ph) * 0.4;
        _c.copy(WHITE).lerp(NIGHT, nightK * 0.6).lerp(c.fade ? SPENT : DARK, c.dark);
        for (const p of c.parts) {
          _p.set(c.pos.x + p.x * s, LAYER + c.y + bob + p.y * s, c.pos.z + p.z * s);
          const k = p.s * s;
          _s.set(k * 1.15, k * 0.62, k);
          _m.compose(_p, _q, _s);
          puffs.setMatrixAt(n, _m); puffs.setColorAt(n, _c); n++;
        }
      }
      puffs.count = n; puffs.instanceMatrix.needsUpdate = true; if (puffs.instanceColor) puffs.instanceColor.needsUpdate = true;
    }

    // gọi ngay một đợt mây về một chỗ (dùng cho thử nghiệm)
    function gather(at, n) { for (let i = 0; i < (n || 6); i++) spawn(at || null); }
    return { update, gather, get count() { return clouds.length; }, get storms() { return slots.filter((s) => s.on && s.members.length).length; }, clouds, LAYER };
  }

  root.Clouds3D = { create };
})(typeof window !== 'undefined' ? window : globalThis);
