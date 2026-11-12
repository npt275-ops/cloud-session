/* Bể Kính · render/tank3d.js
 * Bể kính bao quanh sáu đảo: vòm kính trong, vòng đồng ở chân, các núm đồng; đá trôi lơ lửng bên ngoài bể (nhấp nhô).
 * Cần: game/world.js, render/scene3d.js, render/map/map3d.js (Lands3D: bán kính đảo và vòng đảo). */
(function (root) {
  const BK = root.BK || (root.BK = {});
  function setup(G) {
    const { THREE, scene, mat, mesh, hash, reduce } = G;
    const DOME = Lands3D.RING + Lands3D.LAND_R + 16;
    const dome = new THREE.Mesh(
      new THREE.SphereGeometry(DOME, 64, 32, 0, Math.PI * 2, 0, Math.PI / 2),
      new THREE.MeshPhongMaterial({
        color: 0xe8f6ff,
        transparent: true,
        opacity: 0.06,
        shininess: 160,
        specular: 0xffffff,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    dome.raycast = () => {};
    dome.renderOrder = 4;
    scene.add(dome);
    const ring = mesh(new THREE.TorusGeometry(DOME, 0.9, 8, 180), mat('#b08d57', { metalness: 0.6, roughness: 0.35 }), 0, 0, 0, scene);
    ring.rotation.x = Math.PI / 2;
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * Math.PI * 2;
      mesh(
        new THREE.SphereGeometry(1.4, 8, 6),
        mat('#c9a66b', { metalness: 0.6, roughness: 0.3 }),
        Math.cos(a) * DOME,
        0,
        Math.sin(a) * DOME,
        scene,
      );
    }
    const floaters = [];
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2 + hash(i),
        r = DOME + 16 + hash(i + 2) * 70,
        s = 3 + hash(i + 4) * 7;
      const rock = mesh(
        new THREE.DodecahedronGeometry(s, 0),
        mat('#7b6a58'),
        Math.cos(a) * r,
        -18 - hash(i + 6) * 50,
        Math.sin(a) * r,
        scene,
      );
      mesh(new THREE.CylinderGeometry(s * 0.9, s * 0.7, 0.8, 7), mat('#86b86a'), 0, s * 0.75, 0, rock);
      floaters.push({ m: rock, y: rock.position.y, ph: hash(i) * 6 });
    }
    function animate(t) {
      for (const f of floaters) f.m.position.y = f.y + (reduce ? 0 : Math.sin(t * 0.0005 + f.ph) * 1.6);
    }
    G.DOME = DOME;
    G.tank = { animate };
  }
  BK.Tank3D = { setup };
})(typeof self !== 'undefined' ? self : globalThis);
