/* Bể Kính — biển trong bể kính: mặt nước phủ kín đáy bể tới mép trong vách kính, sóng, chậu kính trong suốt chứa nước.
 * Tách ra từ lớp biển và chiến tranh cũ (archive/v1/war3d.js), chỉ giữ phần nước. */
(function (root) {
  'use strict';
  const SEA_Y = -0.55;

  function create(K) {
    const { THREE, scene, lands3d, C, clamp, reduce } = K;
    /* =============== Biển: phủ kín đáy bể, chạm tới mép trong của vách kính =============== */
    // Nước đục (không trong suốt) nên màu biển đứng yên khi xoay camera: không lẫn màu đáy cát, không đổi thứ tự vẽ với vòm kính.
    const sea = new THREE.Group(); scene.add(sea);
    const EDGE_R = lands3d.RING + lands3d.LAND_R + 16 - 0.35; // mép trong vách kính
    const waterGeo = new THREE.RingGeometry(0.6, EDGE_R, 120, 26);
    waterGeo.rotateX(-Math.PI / 2);
    const wpos = waterGeo.attributes.position, wbase = new Float32Array(wpos.count * 3), wcol = [];
    const deepC = C('#1c5a86'), shallowC = C('#3aa6c4'), outC = C('#2a86ad'), tmpC = new THREE.Color();
    for (let i = 0; i < wpos.count; i++) {
      const x = wpos.getX(i), z = wpos.getZ(i), r = Math.hypot(x, z);
      wbase[i * 3] = x; wbase[i * 3 + 1] = z; wbase[i * 3 + 2] = clamp((EDGE_R - r) / 6, 0, 1); // sóng lặng dần sát vách kính
      tmpC.copy(deepC).lerp(shallowC, clamp((r - 26) / 26, 0, 1)).lerp(outC, clamp((r - 150) / 40, 0, 1)); wcol.push(tmpC.r, tmpC.g, tmpC.b);
    }
    waterGeo.setAttribute('color', new THREE.Float32BufferAttribute(wcol, 3));
    // không bóng loáng, không nhận bóng đổ: hết những mảng lóe trắng khi xoay
    const waterMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.62, metalness: 0, flatShading: true, emissive: '#0b3550', emissiveIntensity: 0.28 });
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

    function animate(dt, t, night) {
      const ts = t * 0.001;
      if (!reduce) { for (let i = 0; i < wpos.count; i++) { const x = wbase[i * 3], z = wbase[i * 3 + 1], k = wbase[i * 3 + 2]; wpos.setY(i, k && (Math.sin(x * 0.18 + ts * 1.1) * 0.16 + Math.cos(z * 0.21 + ts * 0.9) * 0.14 + Math.sin((x + z) * 0.07 + ts * 0.5) * 0.12) * k); } wpos.needsUpdate = true; }
      waterMat.emissiveIntensity = 0.22 + night * 0.25; seaBodyMat.emissiveIntensity = 0.26 + night * 0.25;
    }
    function setSea(dy, tiltX, tiltZ) {
      seaDy = dy; water.position.y = SEA_Y + dy; fitBody();
      water.rotation.x = tiltX || 0; water.rotation.z = tiltZ || 0;
    }
    return { animate, setSea, SEA_Y, EDGE_R, get seaDy() { return seaDy; } };
  }

  root.Sea3D = { create, SEA_Y };
})(typeof window !== 'undefined' ? window : globalThis);
