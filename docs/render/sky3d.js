/* Bể Kính · render/sky3d.js
 * Bầu trời, sao, trăng, ánh sáng (trời, nắng, trăng) và ngày đêm: mỗi khung hình tính màu trời theo giờ (G.time.tod),
 * hướng nắng, bóng nắng theo chỗ camera nhìn (nhích từng bước bằng một điểm ảnh của bản đồ bóng để mép bóng không rung),
 * trời sầm lại khi giông, chớp loé sáng; ghi giờ lên đồng hồ. Màu trời và ánh sáng theo giờ lấy từ render/mood3d.js (bảng màu
 * ấm theo giờ), có thêm một đèn hắt nhẹ phía ngược nắng cho bóng dịu. Khi bất kỳ đảo nào tới thời 10 trời chỉ còn tím, có rèm cực
 * quang, không còn ngày đêm (mood3d NEON); applyTime trả night = 1 để mọi đèn, cửa sổ sáng suốt. Cần: game/world.js, render/scene3d.js, render/perf3d.js (PERF.half). */
(function (root) {
  const BK = root.BK || (root.BK = {});
  function setup(G) {
    const { THREE, scene, camera, controls, C, clamp, hash, glowTex, $ } = G;
    const skyMat = new THREE.ShaderMaterial({
      uniforms: { top: { value: C('#5aa9e6') }, bottom: { value: C('#cfe8f5') }, sunDir: { value: new THREE.Vector3(0, 1, 0) }, sunCol: { value: C('#fff3d0') }, neon: { value: 0 }, time: { value: 0 } },
      vertexShader: 'varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
      // trời tím (bất kỳ đảo nào đã tới thời 10): rèm cực quang xanh ngọc hồng trôi chậm và ánh thành phố hắt lên chân trời
      fragmentShader: 'uniform vec3 top; uniform vec3 bottom; uniform vec3 sunDir; uniform vec3 sunCol; uniform float neon; uniform float time; varying vec3 vW; void main(){ vec3 d = normalize(vW); float h = clamp(d.y * 1.4 + 0.25, 0.0, 1.0); vec3 c = mix(bottom, top, pow(h, 0.8)); float s = max(dot(d, normalize(sunDir)), 0.0); c += sunCol * (pow(s, 600.0) * 1.2 + pow(s, 12.0) * 0.18);'
        + ' if (neon > 0.0) { float az = atan(d.z, d.x); float band = sin(az * 3.0 + time * 0.05 + sin(az * 7.0 - time * 0.08) * 0.7); float hgt = smoothstep(0.06, 0.28, d.y) * (1.0 - smoothstep(0.34, 0.8, d.y)); float cur = pow(max(band, 0.0), 3.0) * hgt * (0.75 + 0.25 * sin(az * 23.0 + time * 0.4));'
        + ' vec3 ac = mix(vec3(0.2, 1.0, 0.85), vec3(1.0, 0.3, 0.85), 0.5 + 0.5 * sin(az * 2.0 + time * 0.03)); c += ac * cur * 0.38 * neon; c += vec3(0.7, 0.22, 0.55) * pow(1.0 - abs(d.y), 10.0) * 0.3 * neon; }'
        + ' gl_FragColor = vec4(c, 1.0); }',
      side: THREE.BackSide, depthWrite: false, depthTest: false,
    });
    { const sky = new THREE.Mesh(new THREE.SphereGeometry(1900, 32, 16), skyMat); sky.renderOrder = -10; scene.add(sky); } // vẽ trước tiên, không so độ sâu (đi cùng độ sâu lôgarit)
    scene.fog = new THREE.Fog(0xcfe8f5, 600, 2400);
    const starPos = [];
    for (let i = 0; i < 700; i++) { const u = hash(i), t = hash(i + 7) * Math.PI * 2, r = 1750, y = u; starPos.push(Math.cos(t) * Math.sqrt(1 - y * y) * r, y * r, Math.sin(t) * Math.sqrt(1 - y * y) * r); }
    const starGeo = new THREE.BufferGeometry(); starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 1.6, sizeAttenuation: false, transparent: true, opacity: 0, fog: false, depthWrite: false });
    scene.add(new THREE.Points(starGeo, starMat));
    const hemi = new THREE.HemisphereLight(0xdff1ff, 0x5d6b4a, 0.55);
    scene.add(hemi);
    const sun = new THREE.DirectionalLight(0xfff1d6, 1.1);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -70, right: 70, top: 70, bottom: -70, near: 10, far: 420 });
    sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.03;
    scene.add(sun); scene.add(sun.target);
    const moon = new THREE.DirectionalLight(0xb4c3ff, 0.0);
    scene.add(moon);
    // đèn hắt nhẹ phía ngược nắng, không đổ bóng: mặt khuất nắng không tối đen, bóng dịu hơn
    const fill = new THREE.DirectionalLight((BK.Mood3D && BK.Mood3D.SOFT.fillColor) || '#cfe0ff', 0);
    scene.add(fill);
    const mood = BK.Mood3D ? BK.Mood3D.create(THREE) : null;
    const moonDisc = new THREE.Mesh(new THREE.CircleGeometry(34, 40), new THREE.MeshBasicMaterial({ color: '#f2f5ff', transparent: true, opacity: 0, fog: false, depthWrite: false }));
    const moonHalo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: '#c9d6ff', transparent: true, opacity: 0, fog: false, depthWrite: false, blending: THREE.AdditiveBlending }));
    moonHalo.scale.setScalar(260); moonDisc.renderOrder = -1; moonHalo.renderOrder = -1; moonDisc.userData.noFade = moonHalo.userData.noFade = true;
    scene.add(moonDisc, moonHalo);

    /* ---------- Ngày đêm ---------- */
    const SKY = { nightTop: C('#0b1430'), nightBot: C('#1c2550'), dawnTop: C('#4a6aa8'), dawnBot: C('#f4a96c'), dayTop: C('#4c9fe0'), dayBot: C('#d4ecf7') };
    const _shade = C('#3f4d74'); // màu bóng ngả lam (render/look3d.js)
    const sunDir = new THREE.Vector3(), _moonP = new THREE.Vector3(), _sx = new THREE.Vector3(), _su = new THREE.Vector3(), _sv = new THREE.Vector3();
    function applyTime() {
      // mất mặt trời (render/neon3d.js): không còn ngày đêm, đèn sáng suốt; ánh sáng rọi từ trên
      // cao (các mặt trời nhân tạo trên mỗi đảo) nên bóng đổ gần như thẳng xuống
      const neon = (G.skyLevel != null ? G.skyLevel : G.level || 0) >= ((BK.Neon3D && BK.Neon3D.LV) || 10); // bất kỳ đảo nào đã tới thời 10 (G.skyLevel: cấp cao nhất; đảo đầu tiên tới là trời tím)
      const tod = G.time.tod, ang = (tod - 0.25) * Math.PI * 2, e = Math.sin(ang);
      const day = neon ? 0 : clamp(e * 2.2 + 0.25, 0, 1), night = neon ? 1 : 1 - clamp(e * 3 + 0.6, 0, 1), gold = neon ? 0 : clamp(1 - Math.abs(e) * 3.2, 0, 1) * (e > -0.25 ? 1 : 0);
      if (neon) sunDir.set(0.22, 1, 0.3).normalize(); else sunDir.set(Math.cos(ang) * 0.85, Math.max(0.05, e), 0.55).normalize();
      skyMat.uniforms.neon.value = neon ? 1 : 0; skyMat.uniforms.time.value = performance.now() * 0.001;
      // khung bóng theo camera nhưng chỉ nhích từng bước bằng một điểm ảnh của bản đồ bóng (tính trong hệ toạ độ của nắng),
      // nên khi kéo camera, mép bóng trên núi tuyết và mặt đất không bị rung, lấp lánh
      { const tex = (2 * G.perf.half) / Math.max(256, sun.shadow.mapSize.x), up = Math.abs(sunDir.y) > 0.99 ? _sx.set(1, 0, 0) : _sx.set(0, 1, 0);
        const ax = _su.crossVectors(up, sunDir).normalize(), ay = _sv.crossVectors(sunDir, ax).normalize(), tg = controls.target;
        const u = Math.round(tg.dot(ax) / tex) * tex, v = Math.round(tg.dot(ay) / tex) * tex, w = tg.dot(sunDir);
        sun.target.position.copy(ax).multiplyScalar(u).addScaledVector(ay, v).addScaledVector(sunDir, w); }
      sun.position.copy(sun.target.position).addScaledVector(sunDir, 200);
      const M = mood && (neon ? mood.neonAt(tod) : mood.at(tod));
      document.body.classList.toggle('day', day > 0.55);
      if (M) { sun.intensity = M.sunI; sun.color.copy(M.sun); hemi.intensity = M.hemiI; hemi.color.copy(M.hemiSky); hemi.groundColor.copy(M.hemiGround); fill.intensity = M.fillI; fill.position.set(-sunDir.x * 100, 60, -sunDir.z * 100); }
      else { sun.intensity = 1.0 * day; sun.color.copy(C('#fff1d6')).lerp(C('#ffb36b'), gold * 0.8); hemi.intensity = 0.22 + 0.3 * day + 0.24 * night; hemi.color.copy(C('#dff1ff')).lerp(C('#8196d6'), night); }
      // mô hình thu nhỏ (render/look3d.js lớp 1): nắng mạnh hơn, đèn trời và đèn hắt yếu đi, bóng ngả lam: sáng tối rõ
      if (BK.Look3D && BK.Look3D.light() && !neon) { sun.intensity *= 1.22; hemi.intensity *= 0.7; fill.intensity *= 0.45; hemi.groundColor.lerp(_shade, 0.55); }
      moon.position.set(-sunDir.x * 100, 80, -sunDir.z * 100); moon.intensity = neon ? 0 : 0.46 * night; // trăng: đêm không tối mịt
      { const mp = _moonP.set(-sunDir.x, 0.62, -sunDir.z).normalize().multiplyScalar(1500); moonDisc.position.copy(mp); moonDisc.lookAt(camera.position);
          moonHalo.position.copy(mp); moonDisc.material.opacity = 0.95 * night; moonHalo.material.opacity = 0.55 * night;
          moonDisc.visible = moonHalo.visible = !neon && night > 0.02; } // thời neon: thay trăng bằng mặt trời đã tắt (render/neon3d.js)
      const top = M ? M.top.clone() : SKY.nightTop.clone().lerp(SKY.dayTop, day).lerp(SKY.dawnTop, gold * 0.6);
      const bot = M ? M.bot.clone() : SKY.nightBot.clone().lerp(SKY.dayBot, day).lerp(SKY.dawnBot, gold * 0.75);
      const overcast = G.weather.stormK * 0.55 * 0.6; // giông trong bể làm trời sầm lại
      if (overcast > 0.001) { top.lerp(C('#7f8c99').lerp(C('#1d2531'), night), overcast * 0.7); bot.lerp(C('#bac4cb').lerp(C('#252e3b'), night), overcast * 0.7); sun.intensity *= 1 - 0.6 * overcast; }
      // bụi sau vụ nổ hạt nhân (logic/missiles.js, game/cities.js G.dust): trời xám nâu, nắng yếu
      if (G.dust > 0.001) { top.lerp(C('#857c70').lerp(C('#2a2622'), night), G.dust * 0.75); bot.lerp(C('#b0a493').lerp(C('#35302b'), night), G.dust * 0.75); sun.intensity *= 1 - 0.45 * G.dust; }
      if (G.weather.lightFlash > 0.001) { hemi.intensity += G.weather.lightFlash * 1.3; } // chớp loé sáng cả bể
      skyMat.uniforms.top.value.copy(top); skyMat.uniforms.bottom.value.copy(bot);
      skyMat.uniforms.sunDir.value.copy(sunDir); skyMat.uniforms.sunCol.value.copy(sun.color).multiplyScalar(day);
      scene.fog.color.copy(M ? M.fog : bot);
      starMat.opacity = night * 0.9;
      const hours = tod * 24, hh = Math.floor(hours), mm = Math.floor((hours - hh) * 60 / 10) * 10;
      $('time').textContent = String(hh).padStart(2, '0') + ':' + String(mm).padStart(2, '0');
      return { day, night, neon };
    }
    Object.assign(G, { sun, sky: { applyTime } });
  }
  BK.Sky3D = { setup };
})(typeof self !== 'undefined' ? self : globalThis);
