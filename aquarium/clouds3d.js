/* Bể Kính — mây trong bể kính.
 * Mây chỉ sống bên trong vòm kính (bên ngoài không có mây). Mây kéo vào từng đợt theo gió, trôi ngang bể rồi tan.
 * Khi nhiều đám mây dồn lại một chỗ, chúng hút nhau, nặng dần và sẫm lại thành mây đen; đủ nặng thì sấm sét nổ
 * và mưa trút xuống đảo, biển bên dưới. Mưa xong mây nhẹ đi, bạc màu rồi tan. Trời mưa của một đảo (theo mô phỏng)
 * kéo các đợt mây về phía đảo đó. Toàn bộ mây là một lượt vẽ; mưa và chớp dùng chung vài khối dựng sẵn. */
(function (root) {
  'use strict';

  function create(K) {
    const { THREE, scene, lands3d, dome, reduce, glowTex, audio, flash, rainOf } = K;
    const v3 = (x, y, z) => new THREE.Vector3(x, y, z);
    const rnd = Math.random;
    const MAXC = 44, PUFFS = 6, Y0 = 54, Y1 = 82;
    // bán kính ngang tối đa ở độ cao y để cả đám mây (rộng khoảng 18) vẫn nằm trong vòm
    const inR = (y) => Math.sqrt(Math.max(0, dome * dome - y * y)) - 26;

    /* ----- các cục mây: một khối dựng sẵn cho tất cả ----- */
    const geo = new THREE.IcosahedronGeometry(1, 1);
    const mat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 1, flatShading: true, emissive: '#ffffff', emissiveIntensity: 0.16 });
    const puffs = new THREE.InstancedMesh(geo, mat, MAXC * PUFFS);
    puffs.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    puffs.setColorAt(0, new THREE.Color()); puffs.instanceColor.setUsage(THREE.DynamicDrawUsage);
    puffs.count = 0; puffs.frustumCulled = false; puffs.castShadow = true; scene.add(puffs);
    puffs.raycast = () => {};
    const WHITE = new THREE.Color('#ffffff'), DARK = new THREE.Color('#3b4250'), NIGHT = new THREE.Color('#8f9bb4'), _c = new THREE.Color();
    const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), _p = new THREE.Vector3();

    const clouds = [];
    let wind = rnd() * Math.PI * 2, nextWave = 3000, waveLeft = 0, waveGap = 0, waveAim = null;

    function spawn(aim) {
      if (clouds.length >= MAXC) return;
      // vào từ mép vòm phía đầu gió, hướng về giữa bể (hoặc về đảo đang mưa)
      const y = Y0 + rnd() * (Y1 - Y0), R = inR(y), side = wind + Math.PI + (rnd() - 0.5) * 1.1;
      const pos = v3(Math.cos(side) * R * 0.96, y, Math.sin(side) * R * 0.96);
      const to = aim ? aim.clone().setY(y) : v3(Math.cos(wind) * R * 0.5, y, Math.sin(wind) * R * 0.5);
      const vel = to.sub(pos).setY(0).normalize().multiplyScalar(2.2 + rnd() * 1.6);
      const parts = [];
      for (let i = 0; i < PUFFS; i++) {
        const a = (i / PUFFS) * Math.PI * 2 + rnd(), d = i === 0 ? 0 : 3 + rnd() * 4.5;
        parts.push({ x: Math.cos(a) * d, y: (rnd() - 0.3) * 2.2, z: Math.sin(a) * d * 0.7, s: (i === 0 ? 6.5 : 3.6 + rnd() * 2.6) });
      }
      clouds.push({ pos, vel, parts, size: 0, grow: 1, dark: 0, water: 0.25 + rnd() * 0.25, age: 0, life: 45 + rnd() * 40, ph: rnd() * 6 });
    }

    /* ----- mưa: tối đa ba cơn cùng lúc, mỗi cơn một khối hạt ----- */
    const DROPS = 520, storms = [];
    for (let s = 0; s < 3; s++) {
      const pos = new Float32Array(DROPS * 6), seed = [];
      for (let i = 0; i < DROPS; i++) { const a = rnd() * Math.PI * 2, r = Math.sqrt(rnd()) * 20; seed.push([Math.cos(a) * r, rnd(), Math.sin(a) * r]); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const m = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: '#cfe0ee', transparent: true, opacity: 0, depthWrite: false }));
      m.frustumCulled = false; m.visible = false; m.renderOrder = 5; scene.add(m);
      // tia chớp: đường gấp khúc từ chân mây xuống mặt đất, kèm quầng sáng
      const bp = new Float32Array(14 * 3), bg = new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.BufferAttribute(bp, 3));
      const bolt = new THREE.Line(bg, new THREE.LineBasicMaterial({ color: '#f4f7ff', transparent: true, opacity: 0, depthWrite: false, fog: false }));
      bolt.frustumCulled = false; bolt.visible = false; bolt.renderOrder = 6; scene.add(bolt);
      const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: '#cfd9ff', blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0 }));
      glow.scale.set(60, 60, 1); glow.visible = false; scene.add(glow);
      storms.push({ on: false, m, pos, seed, bolt, bp, glow, c: v3(0, 0, 0), base: 50, k: 0, nextBolt: 0, boltT: 0, members: [] });
    }
    const groundAt = (x, z) => { // mặt đảo hay mặt biển dưới cơn mưa
      for (const L of lands3d.lands) if (Math.hypot(x - L.center.x, z - L.center.z) < lands3d.LAND_R) return 1.2;
      return -0.4;
    };
    function fireBolt(st) {
      const a = rnd() * Math.PI * 2, r = rnd() * 12, x = st.c.x + Math.cos(a) * r, z = st.c.z + Math.sin(a) * r, gy = groundAt(x, z);
      let px = x, pz = z;
      for (let i = 0; i < 14; i++) {
        const u = i / 13, y = st.base - 2 - (st.base - 2 - gy) * u;
        if (i > 0 && i < 13) { px += (rnd() - 0.5) * 3.2; pz += (rnd() - 0.5) * 3.2; }
        st.bp[i * 3] = i === 13 ? px : px; st.bp[i * 3 + 1] = y; st.bp[i * 3 + 2] = pz;
      }
      st.bolt.geometry.attributes.position.needsUpdate = true;
      st.bolt.visible = true; st.boltT = 1; st.glow.visible = true; st.glow.position.set(x, st.base - 4, z);
      if (flash) flash(0.9);
      if (audio && audio.on) setTimeout(() => audio.thunder(), 120 + rnd() * 500);
    }

    /* ----- cập nhật ----- */
    const SPEED = () => Math.max(0.5, (K.speed ? K.speed() : 1));
    function update(dt, t, night) {
      if (dt > 250) dt = 250;
      const sdt = (dt / 1000) * (reduce ? 0.4 : 1), sp = SPEED();
      // gió đổi hướng chậm; các đợt mây kéo đến, nhanh hơn khi đang có đảo mưa
      wind += sdt * 0.01;
      const rainy = rainOf ? rainOf() : null;
      nextWave -= dt * sp;
      if (nextWave <= 0 && waveLeft <= 0) {
        waveLeft = 3 + Math.floor(rnd() * 4) + (rainy ? 3 : 0); waveGap = 0;
        waveAim = rainy ? rainy.clone() : rnd() < 0.55 ? lands3d.lands[Math.floor(rnd() * lands3d.lands.length)].center.clone() : null;
        nextWave = (rainy ? 22000 : 38000) + rnd() * 30000;
      }
      if (waveLeft > 0) { waveGap -= dt * sp; if (waveGap <= 0) { spawn(waveAim && waveAim.clone().add(v3((rnd() - 0.5) * 40, 0, (rnd() - 0.5) * 40))); waveLeft--; waveGap = 900 + rnd() * 1600; } }

      // mây gần nhau hút nhau lại; càng đông càng nặng và sẫm
      for (const c of clouds) c.n = 0;
      for (let i = 0; i < clouds.length; i++) for (let j = i + 1; j < clouds.length; j++) {
        const a = clouds[i], b = clouds[j], dx = b.pos.x - a.pos.x, dz = b.pos.z - a.pos.z, d = Math.hypot(dx, dz);
        if (d < 36) {
          a.n++; b.n++;
          const f = (d > 12 ? 0.35 : -0.6) * sdt / Math.max(4, d); // kéo lại gần, nhưng không chồng khít
          a.vel.x += dx * f; a.vel.z += dz * f; b.vel.x -= dx * f; b.vel.z -= dz * f;
        }
      }
      for (const st of storms) st.members.length = 0;
      for (let i = clouds.length - 1; i >= 0; i--) {
        const c = clouds[i];
        c.age += sdt * sp;
        // tích nước khi đứng cạnh nhiều mây khác; mưa xả bớt nước
        if (!c.storm) c.water = Math.max(0, Math.min(1.2, c.water + (c.n >= 4 ? 0.045 * (c.n - 3) : -0.012) * sdt * sp)); // chỉ khi dồn từ năm đám trở lên
        const want = Math.max(0, Math.min(1, (c.water - 0.45) / 0.45));
        c.dark += (want - c.dark) * Math.min(1, sdt * 0.6);
        // trôi theo gió; mây nặng trôi chậm
        const sl = Math.hypot(c.vel.x, c.vel.z), cap = 3.4 * (1 - 0.6 * c.dark);
        if (sl > cap) { c.vel.x *= cap / sl; c.vel.z *= cap / sl; }
        c.pos.x += c.vel.x * sdt * Math.min(sp, 4); c.pos.z += c.vel.z * sdt * Math.min(sp, 4);
        // không ra khỏi vòm kính: chạm vách thì dội vào trong
        const r = Math.hypot(c.pos.x, c.pos.z), R = inR(c.pos.y);
        if (r > R) { c.pos.x *= R / r; c.pos.z *= R / r; const nx = c.pos.x / r, nz = c.pos.z / r, dot = c.vel.x * nx + c.vel.z * nz; if (dot > 0) { c.vel.x -= 1.6 * dot * nx; c.vel.z -= 1.6 * dot * nz; } if (c.age > 20 && !c.storm) c.grow = -1; } // trôi tới vách kính thì tan dần
        // lớn dần khi mới đến, tan dần khi già hay khi mưa đã cạn
        if (c.age > c.life && !c.storm) c.grow = -1;
        if (c.spent && c.water < 0.2) c.grow = -1;
        c.size = Math.max(0, Math.min(1, c.size + c.grow * sdt * 0.12));
        if (c.grow < 0 && c.size <= 0) { clouds.splice(i, 1); continue; }
      }

      // mây đen dồn cụm thành cơn giông
      for (const st of storms) if (st.on) st.c.set(0, 0, 0);
      const darkOnes = clouds.filter((c) => c.dark > 0.75 && c.size > 0.6);
      for (const c of darkOnes) {
        let best = null;
        for (const st of storms) if (st.on && Math.hypot(st.cx - c.pos.x, st.cz - c.pos.z) < 40) { best = st; break; }
        if (!best && darkOnes.filter((o) => Math.hypot(o.pos.x - c.pos.x, o.pos.z - c.pos.z) < 36).length >= 4) {
          best = storms.find((s) => !s.on);
          if (best) { best.on = true; best.cx = c.pos.x; best.cz = c.pos.z; best.nextBolt = 1500 + rnd() * 2500; best.k = 0; }
        }
        if (best) { best.members.push(c); c.storm = best; }
      }
      for (const st of storms) {
        if (st.on) {
          if (st.members.length) {
            let x = 0, z = 0, y = 1e9; for (const c of st.members) { x += c.pos.x; z += c.pos.z; y = Math.min(y, c.pos.y); }
            st.cx = x / st.members.length; st.cz = z / st.members.length; st.base = y - 2;
            // mưa xả nước khỏi các đám mây của cơn giông
            for (const c of st.members) { c.water -= 0.03 * sdt * Math.min(sp, 4); if (c.water < 0.5) { c.spent = true; c.storm = null; } }
          }
          st.c.set(st.cx, 0, st.cz);
          const live = st.members.length > 0;
          st.k += ((live ? 1 : 0) - st.k) * Math.min(1, sdt * 0.8);
          if (!live && st.k < 0.03) { st.on = false; st.k = 0; }
          // tia chớp thỉnh thoảng
          st.nextBolt -= dt;
          if (live && st.nextBolt <= 0 && !reduce) { fireBolt(st); st.nextBolt = 2500 + rnd() * 5500; }
        }
        for (const c of clouds) if (c.storm === st && !st.on) c.storm = null;
        // hạt mưa
        st.m.visible = st.k > 0.02;
        if (st.m.visible) {
          st.m.material.opacity = 0.6 * st.k;
          const top = st.base, pos = st.pos, fall = (reduce ? 12 : 46) * sdt;
          for (let i = 0; i < DROPS; i++) {
            const d = st.seed[i]; d[1] -= fall / Math.max(10, top);
            if (d[1] < 0) d[1] += 1;
            const x = st.cx + d[0], z = st.cz + d[2], gy = -0.4, y = gy + d[1] * (top - gy), o = i * 6;
            pos[o] = x; pos[o + 1] = y; pos[o + 2] = z; pos[o + 3] = x + 0.15; pos[o + 4] = y - 1.6; pos[o + 5] = z;
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

      // vẽ các cục mây
      let n = 0;
      const nightK = night || 0;
      for (const c of clouds) {
        const s = c.size * c.size * (3 - 2 * c.size), bob = Math.sin(t * 0.0004 + c.ph) * 0.8;
        _c.copy(WHITE).lerp(NIGHT, nightK * 0.6).lerp(DARK, c.dark);
        for (const p of c.parts) {
          _p.set(c.pos.x + p.x * s, c.pos.y + bob + p.y * s - c.dark * 3, c.pos.z + p.z * s);
          const k = p.s * s * (1 + c.dark * 0.25);
          _s.set(k * 1.25, k * 0.8, k);
          _m.compose(_p, _q, _s);
          puffs.setMatrixAt(n, _m); puffs.setColorAt(n, _c); n++;
        }
      }
      puffs.count = n; puffs.instanceMatrix.needsUpdate = true; if (puffs.instanceColor) puffs.instanceColor.needsUpdate = true;
    }

    // thần muốn có ngay một đợt mây (dùng cho thử nghiệm và các quyền năng gọi mưa)
    function gather(at, n) { for (let i = 0; i < (n || 6); i++) spawn(at ? at.clone().add(v3((rnd() - 0.5) * 30, 0, (rnd() - 0.5) * 30)) : null); }
    return { update, gather, get count() { return clouds.length; }, get storms() { return storms.filter((s) => s.on).length; }, clouds };
  }

  root.Clouds3D = { create };
})(typeof window !== 'undefined' ? window : globalThis);
