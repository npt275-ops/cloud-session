/* Bể Kính — biển trong bể kính: mặt nước phủ kín đáy bể tới mép trong vách kính, sóng, chậu kính trong suốt chứa nước.
 * Tách ra từ lớp biển và chiến tranh cũ (archive/v1/war3d.js), chỉ giữ phần nước. Sóng Gerstner trong shader, cùng công thức ở
 * phía máy cho thuyền nổi (BK.seaAt; design/ke-hoach-buoc-17.md). */
(function (root) {
  'use strict';
  const SEA_Y = -0.55;

  function create(K) {
    const { THREE, scene, lands3d, C, clamp, reduce } = K;
    /* =============== Biển: phủ kín đáy bể, chạm tới mép trong của vách kính =============== */
    // Nước đục (không trong suốt) nên màu biển đứng yên khi xoay camera: không lẫn màu đáy cát, không đổi thứ tự vẽ với vòm kính.
    const sea = new THREE.Group(); scene.add(sea);
    const EDGE_R = lands3d.RING + lands3d.LAND_R + 16 - 0.35; // mép trong vách kính
    /* ---------- Sóng (design/ke-hoach-buoc-17.md) ----------
     * Tổng sáu con sóng Gerstner khác hướng, khác bước sóng (WAVES: hướng, bước sóng, biên độ): mặt nước vừa nhấp nhô lên xuống
     * vừa dồn ngọn sóng lại theo chiều ngang (ngọn nhọn, đáy thoải). Tính trong shader (vertex), lưới nước dày; cùng công thức ở
     * phía máy (heightAt) cho thuyền nhấp nhô, chòng chành đúng con sóng. Sát bờ đảo sóng dịu dần (aShore: khoảng cách tới mép đảo
     * gần nhất), sát vách kính sóng lặng. Giông bão (stormK) sóng lớn hơn. Bọt trắng: dải quanh chân đảo vỗ theo nhịp, vệt trắng
     * trên ngọn sóng cao. Nước giữ kiểu mặt phẳng low-poly (flatShading). */
    const WAVES = [[0.8, 0.6, 38, 0.44], [-0.45, 0.9, 27, 0.32], [0.95, -0.3, 19, 0.22], [-0.7, -0.7, 14, 0.15], [0.2, 1, 23, 0.19], [1, 0.15, 31, 0.27], [-0.2, -1, 11, 0.08], [0.6, -0.8, 9, 0.06]]
      .map(([dx, dz, L, A]) => { const l = Math.hypot(dx, dz), k = (2 * Math.PI) / L; return { dx: dx / l, dz: dz / l, k, A, w: Math.sqrt(9.8 * k) * 0.42 }; });
    const AMAX = WAVES.reduce((a, W) => a + W.A, 0);
    const QS = 0.75 / WAVES.length; // độ dồn ngọn (tổng nhỏ hơn 1: không cuộn ngược)
    const lands = lands3d.lands;
    // khoảng cách từ (x, z) tới mép đảo gần nhất (âm: trong đảo)
    const shoreD = (x, z) => { let m = 1e9; for (const L of lands) { const dx = x - L.center.x, dz = z - L.center.z, d = Math.hypot(dx, dz) - L.rOf(Math.atan2(dz, dx)); if (d < m) m = d; } return m; };
    // độ lớn sóng theo chỗ: sát bờ còn 0,3, ra xa 14 thì đủ; sát vách kính lặng dần
    const ampAt = (x, z, sd) => { const r = Math.hypot(x, z), e = clamp((EDGE_R - r) / 8, 0, 1), s = clamp((sd - 1.5) / 12.5, 0, 1); return e * (0.3 + 0.7 * s * s * (3 - 2 * s)); };
    const waterGeo = new THREE.RingGeometry(0.6, EDGE_R, 420, 120);
    waterGeo.rotateX(-Math.PI / 2);
    const wpos = waterGeo.attributes.position, wcol = [], wsh = new Float32Array(wpos.count * 2);
    const deepC = C('#1c5a86'), shallowC = C('#3aa6c4'), outC = C('#2a86ad'), tmpC = new THREE.Color();
    for (let i = 0; i < wpos.count; i++) {
      const x = wpos.getX(i), z = wpos.getZ(i), r = Math.hypot(x, z), sd = shoreD(x, z);
      wsh[i * 2] = ampAt(x, z, sd); wsh[i * 2 + 1] = Math.max(-2, Math.min(30, sd));
      tmpC.copy(deepC).lerp(shallowC, clamp((r - 26) / 26, 0, 1)).lerp(outC, clamp((r - 150) / 40, 0, 1)).lerp(shallowC, 0.35 * clamp((6 - sd) / 6, 0, 1)); wcol.push(tmpC.r, tmpC.g, tmpC.b);
    }
    waterGeo.setAttribute('color', new THREE.Float32BufferAttribute(wcol, 3));
    waterGeo.setAttribute('aShore', new THREE.BufferAttribute(wsh, 2)); // (độ lớn sóng chỗ đó, khoảng cách tới bờ)
    // không bóng loáng, không nhận bóng đổ: hết những mảng lóe trắng khi xoay
    const waterMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.62, metalness: 0, flatShading: true, emissive: '#0b3550', emissiveIntensity: 0.28 });
    const U = { uT: { value: 0 }, uAmp: { value: 1 } };
    const glsl = (v) => v.toFixed(5);
    waterMat.onBeforeCompile = (sh) => {
      sh.uniforms.uT = U.uT; sh.uniforms.uAmp = U.uAmp;
      let waves = ''; for (const W of WAVES) waves += `{ float ph = ${glsl(W.k)} * dot(vec2(${glsl(W.dx)}, ${glsl(W.dz)}), p0) - ${glsl(W.w)} * uT, a = ${glsl(W.A)} * amp; h += a * sin(ph); off += vec2(${glsl(W.dx)}, ${glsl(W.dz)}) * (${glsl(QS / W.k)} / ${glsl(W.A)}) * a * cos(ph); }\n`;
      sh.vertexShader = 'uniform float uT;\nuniform float uAmp;\nattribute vec2 aShore;\nvarying float vWave;\nvarying float vShore;\nvarying vec2 vXZ;\n' + sh.vertexShader.replace('#include <begin_vertex>',
        '#include <begin_vertex>\n{ vec2 p0 = transformed.xz; float amp = aShore.x * uAmp, h = 0.0; vec2 off = vec2(0.0);\n' + waves + ' transformed.xz += off; transformed.y += h; vWave = h / (' + glsl(AMAX) + ' * max(uAmp, 0.01)); vShore = aShore.y; vXZ = p0; }');
      sh.fragmentShader = 'uniform float uT;\nvarying float vWave;\nvarying float vShore;\nvarying vec2 vXZ;\n' + sh.fragmentShader.replace('#include <color_fragment>',
        '#include <color_fragment>\n{ float crest = smoothstep(0.35, 0.75, vWave), brk = 0.5 + 0.5 * sin(vXZ.x * 0.9 + sin(vXZ.y * 0.6) * 2.0 + uT * 0.7) * sin(vXZ.y * 0.8 - uT * 0.5),\n'
        + '  band = smoothstep(2.4, 0.2, vShore) * (0.35 + 0.65 * brk) + smoothstep(1.2, 0.0, abs(vShore - 2.5 - 1.6 * fract(uT * 0.18 + brk * 0.3))) * 0.6 * brk;\n' +
        '  diffuseColor.rgb *= 0.72 + 0.5 * clamp(vWave * 0.5 + 0.5, 0.0, 1.0);\n  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.93, 0.97, 1.0), clamp(crest * 0.55 + band * 0.75, 0.0, 0.9)); }');
    };
    waterMat.customProgramCacheKey = () => 'seaWaves';
    // độ cao mặt biển (so với mặt biển lặng) tại (x, z) ở lúc này: cùng công thức với shader (bỏ phần dồn ngang)
    let tNow = 0, ampNow = 1.15;
    function heightAt(x, z) { const amp = ampAt(x, z, shoreD(x, z)) * ampNow; let h = 0; for (const W of WAVES) h += W.A * amp * Math.sin(W.k * (W.dx * x + W.dz * z) - W.w * tNow); return h; }
    // mặt biển tại (x, z): { y (toạ độ thế giới), nx, nz (độ nghiêng theo hai trục: thuyền chòng chành) }
    function surface(x, z) { const h = heightAt(x, z), e = 0.6, hx = heightAt(x + e, z) - heightAt(x - e, z), hz = heightAt(x, z + e) - heightAt(x, z - e); return { y: SEA_Y + seaDy + h, tx: hx / (2 * e), tz: hz / (2 * e) }; }
    let seaDy = 0; // thần đổ thêm nước hay rút bớt nước: mặt biển dâng, hạ
    const water = new THREE.Mesh(waterGeo, waterMat); water.position.y = SEA_Y; water.renderOrder = 2; sea.add(water);
    water.raycast = () => {};
    // Đáy bể là thuỷ tinh trong suốt: một chậu kính dưới vòm, nước xanh trong đựng bên trong,
    // nhìn từ ngoài thấy cả chân đá của sáu đảo chìm trong nước.
    const BODY_H = 34, FLOOR_Y = SEA_Y - BODY_H, GLASS_R = EDGE_R + 0.35;
    const seaBodyMat = new THREE.MeshStandardMaterial({ color: '#2a8fbf', roughness: 0.5, emissive: '#0b3550', emissiveIntensity: 0.3, transparent: true, opacity: 0.5, side: THREE.DoubleSide, depthWrite: false });
    const wall = new THREE.Mesh(new THREE.CylinderGeometry(EDGE_R, EDGE_R, 1, 120, 1, true), seaBodyMat); wall.renderOrder = 3; sea.add(wall);
    const bottom = new THREE.Mesh(new THREE.CircleGeometry(EDGE_R, 120), seaBodyMat); bottom.rotation.x = -Math.PI / 2; bottom.position.y = FLOOR_Y + 0.05; bottom.renderOrder = 3; sea.add(bottom);
    const glassMat = new THREE.MeshPhongMaterial({ color: 0xe8f6ff, transparent: true, opacity: 0.1, shininess: 160, specular: 0xffffff, side: THREE.DoubleSide, depthWrite: false });
    const glassWall = new THREE.Mesh(new THREE.CylinderGeometry(GLASS_R, GLASS_R, -FLOOR_Y + 0.6, 120, 1, true), glassMat); glassWall.position.y = (FLOOR_Y - 0.6) / 2; glassWall.renderOrder = 4; sea.add(glassWall);
    const glassFloor = new THREE.Mesh(new THREE.CircleGeometry(GLASS_R, 120), glassMat); glassFloor.rotation.x = -Math.PI / 2; glassFloor.position.y = FLOOR_Y - 0.6; glassFloor.renderOrder = 4; sea.add(glassFloor);
    const brass = new THREE.MeshStandardMaterial({ color: '#b08d57', metalness: 0.6, roughness: 0.35 });
    const footRing = new THREE.Mesh(new THREE.TorusGeometry(GLASS_R, 0.9, 8, 180), brass); footRing.rotation.x = Math.PI / 2; footRing.position.y = FLOOR_Y - 0.6; sea.add(footRing);
    for (const m of [wall, bottom, glassWall, glassFloor, footRing]) m.raycast = () => {};
    function fitBody() { const top = SEA_Y + seaDy; wall.scale.y = top - FLOOR_Y; wall.position.y = (top + FLOOR_Y) / 2; }
    fitBody();

    function animate(dt, t, night, storm) {
      const ts = t * 0.001;
      if (!reduce) { tNow = ts; } // (giảm chuyển động: sóng đứng yên)
      ampNow += ((1.15 + 0.75 * (storm || 0)) - ampNow) * Math.min(1, (dt || 16) / 3000); // giông bão: sóng lớn dần
      U.uT.value = tNow; U.uAmp.value = ampNow;
      waterMat.emissiveIntensity = 0.22 + night * 0.25; seaBodyMat.emissiveIntensity = 0.26 + night * 0.25;
    }
    function setSea(dy, tiltX, tiltZ) {
      seaDy = dy; water.position.y = SEA_Y + dy; fitBody();
      water.rotation.x = tiltX || 0; water.rotation.z = tiltZ || 0;
    }
    const out = { animate, setSea, heightAt, surface, SEA_Y, EDGE_R, get seaDy() { return seaDy; } };
    (root.BK || (root.BK = {})).seaAt = surface; // (thuyền, tàu nổi trên biển: render/travel3d.js, prosper3d.js, buildings3d.js)
    return out;
  }

  root.Sea3D = { create, SEA_Y };
})(typeof window !== 'undefined' ? window : globalThis);
