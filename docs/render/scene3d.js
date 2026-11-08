/* Bể Kính · render/scene3d.js
 * Bộ vẽ, cảnh, camera và tay kéo xoay camera, đổi cỡ màn hình; vài thứ dùng chung khi vẽ: ảnh đốm sáng mờ (glowTex), vật
 * liệu và khối có sẵn (mat, mesh), khói bay (puff). Độ sâu lôgarit: nhìn từ rất cao mặt nước, bờ hồ, mặt đất không nhấp nháy.
 * Cần: three.js, OrbitControls, game/world.js. */
(function (root) {
  const BK = root.BK || (root.BK = {});
  function setup(G) {
    const { THREE, $ } = G;
    const canvas = $('scene');
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance', logarithmicDepthBuffer: true });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.shadowMap.autoUpdate = false;
    // cách nén màu và độ phơi sáng (render/mood3d.js TONE)
    const T = (BK.Mood3D && BK.Mood3D.TONE) || {};
    renderer.toneMapping = T.map === 'aces' ? THREE.ACESFilmicToneMapping : THREE.LinearToneMapping;
    renderer.toneMappingExposure = T.exposure || 1;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, 0.12, 4200);
    camera.position.set(0, 318, 414);
    const controls = new THREE.OrbitControls(camera, canvas);
    controls.target.set(0, 0, 0);
    controls.enableDamping = true; controls.dampingFactor = 0.07;
    controls.minDistance = 2.5; controls.maxDistance = 820; controls.maxPolarAngle = Math.PI * 0.49;
    controls.autoRotate = false; // camera chỉ đi theo tay người chơi
    controls.enablePan = true; controls.screenSpacePanning = true;
    function resize() {
      const w = window.innerWidth, h = window.innerHeight;
      renderer.setSize(w, h, false); camera.aspect = w / h; camera.fov = w < 720 ? 50 : 34; camera.updateProjectionMatrix();
    }
    window.addEventListener('resize', resize);
    resize();
    if (window.innerWidth < 720) camera.position.multiplyScalar(1.5);

    /* ---------- Vật liệu, khối, đốm sáng, khói ---------- */
    const mats = new Map();
    function mat(hex, o) {
      const k = hex + JSON.stringify(o || {});
      if (!mats.has(k)) mats.set(k, new THREE.MeshStandardMaterial(Object.assign({ color: hex, flatShading: true, roughness: 0.88, metalness: 0.02 }, o || {})));
      return mats.get(k);
    }
    function mesh(geo, m, x, y, z, parent) { const me = new THREE.Mesh(geo, m); me.position.set(x || 0, y || 0, z || 0); me.castShadow = true; me.receiveShadow = true; if (parent) parent.add(me); return me; }
    const glowTex = (() => {
      const c = document.createElement('canvas'); c.width = c.height = 64;
      const x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
      g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.25, 'rgba(255,255,255,0.55)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      x.fillStyle = g; x.fillRect(0, 0, 64, 64);
      return new THREE.CanvasTexture(c);
    })();
    const puffGeo = new THREE.IcosahedronGeometry(0.35, 0), puffs = [];
    for (let i = 0; i < 60; i++) { const m = new THREE.Mesh(puffGeo, new THREE.MeshStandardMaterial({ color: '#f2f2f2', transparent: true, opacity: 0, flatShading: true, roughness: 1, depthWrite: false })); m.visible = false; scene.add(m); puffs.push({ m, t0: 0 }); }
    let puffIdx = 0;
    function puff(worldPos, dark, color) { const p = puffs[puffIdx++ % puffs.length]; p.m.position.copy(worldPos); p.m.material.color.set(color || (dark ? '#8d8d8d' : '#f4f4f4')); p.t0 = performance.now(); p.m.visible = true; }
    function updatePuffs(now, dt) { for (const p of puffs) { if (!p.m.visible) continue; const k = (now - p.t0) / 3200; if (k > 1) { p.m.visible = false;
        continue; } p.m.position.y += dt * 0.0012; p.m.position.x += dt * 0.0004; p.m.scale.setScalar(0.6 + k * 1.8); p.m.material.opacity = 0.55 * (1 - k); } }

    Object.assign(G, { canvas, renderer, scene, camera, controls, resize, mat, mesh, glowTex, puff, updatePuffs });
  }
  BK.Scene3D = { setup };
})(typeof self !== 'undefined' ? self : globalThis);
