/* Bể Kính · render/travel3d.js · Đoàn buôn đi giữa các đảo
 * Vẽ các đoàn buôn của logic (logic/diplomacy.js, W.caravans): mỗi giao kèo có hai đoàn cùng lên đường, đoàn của đảo a chở
 * hàng sang b, đoàn của b chở hàng sang a. Đi thuyền thì thuyền rời bờ đảo này, băng biển sang bờ đảo kia; đi qua cầu thì
 * xe hàng lăn trên mặt cầu (render/build/bridges3d.js bridgePoint), hai chiều đi hai làn. Vị trí theo ngày lịch của trận
 * (tiến độ = (ngày − ngày đi) / (ngày tới − ngày đi)), nên ở 1×, 2×, 4× đoàn đi đúng nhịp của logic. Hàng trên thuyền,
 * trên xe tô màu theo thứ chở nhiều nhất. Thuyền buồm từ thời đầu, thuyền máy từ thời 7.
 * Cần: three.js, render/map/map3d.js (lands3d), render/build/bridges3d.js. */
(function (root) {
  'use strict';
  const BK = root.BK || (root.BK = {});
  const SEA_Y = -0.55;                 // mặt biển (sea3d.js)
  const SHORE = 3;                     // thuyền cập cách mép đảo chừng này
  const MOTOR_LEVEL = 7;               // từ thời này thuyền chạy máy, không còn buồm
  const CART_SCALE = 1.5;              // xe hàng to hơn người một chút cho nhìn thấy từ xa
  const CARGO = { food: '#e8c547', wood: '#8a5a33', stone: '#a7a39b', metal: '#7d8fa3', energy: '#5fe3ff', luxury: '#d9558f' };

  function create(o) {
    const { THREE, scene, lands3d, bridges3d } = o, lands = lands3d.lands, R = lands3d.LAND_R;
    const mat = (c, extra) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.7, flatShading: true }, extra || {}));
    // hình dùng chung: thân thuyền, cột buồm, buồm, ca bin; thân xe, bánh xe; thùng hàng
    const G = {
      hull: new THREE.BoxGeometry(3.2, 0.7, 1.3), mast: new THREE.CylinderGeometry(0.06, 0.06, 2.6, 5), sail: new THREE.PlaneGeometry(1.4, 1.9),
      cabin: new THREE.BoxGeometry(1.0, 0.6, 0.9), cart: new THREE.BoxGeometry(1.2, 0.3, 0.8), wheel: new THREE.CylinderGeometry(0.22, 0.22, 0.1, 8),
      crate: new THREE.BoxGeometry(0.7, 0.45, 0.6),
    };
    const M = { hull: mat('#6b4a2f'), sail: mat('#f3ead8', { side: THREE.DoubleSide }), mast: mat('#4a3422'), cabin: mat('#dfe5ea'), cart: mat('#7a5534'), wheel: mat('#2e2a26') };
    const cargoMat = {}; for (const r in CARGO) cargoMat[r] = mat(CARGO[r]);
    const add = (g, geo, m, x, y, z) => { const me = new THREE.Mesh(geo, m); me.position.set(x, y, z); g.add(me); return me; };
    function makeBoat() {
      const g = new THREE.Group();
      add(g, G.hull, M.hull, 0, 0.15, 0);
      const sail = new THREE.Group(); add(sail, G.mast, M.mast, 0.2, 1.6, 0); const s = add(sail, G.sail, M.sail, 0.2, 1.85, 0); s.rotation.y = Math.PI / 2; g.add(sail);
      const cabin = add(g, G.cabin, M.cabin, -0.8, 0.75, 0);
      const crate = add(g, G.crate, cargoMat.food, 0.9, 0.7, 0);
      g.userData = { sail, cabin, crate }; return g;
    }
    function makeCart() {
      const g = new THREE.Group();
      add(g, G.cart, M.cart, 0, 0.35, 0);
      for (const [x, z] of [[-0.4, -0.45], [0.4, -0.45], [-0.4, 0.45], [0.4, 0.45]]) { const w = add(g, G.wheel, M.wheel, x, 0.22, z); w.rotation.x = Math.PI / 2; }
      const crate = add(g, G.crate, cargoMat.food, 0, 0.72, 0);
      g.scale.setScalar(CART_SCALE); g.userData = { crate }; return g;
    }
    // kho thuyền, xe: dùng lại, không tạo mới mỗi khung hình
    const pool = { boat: [], cart: [] }, used = { boat: 0, cart: 0 };
    function take(kind) { const P = pool[kind]; if (used[kind] >= P.length) { const g = kind === 'boat' ? makeBoat() : makeCart(); scene.add(g); P.push(g); } const g = P[used[kind]++]; g.visible = true; return g; }

    const tmp = new THREE.Vector3(), from = new THREE.Vector3(), to = new THREE.Vector3(), side = new THREE.Vector3();
    const mainCargo = (load) => Object.entries(load).sort((x, y) => y[1] - x[1])[0][0];
    // một đoàn đi từ đảo s sang đảo d, chở load, tiến độ u (0..1)
    function place(s, d, load, u, t, level) {
      const B = bridges3d.bridgeOf(s, d);
      if (B && B.era >= 0) {
        const g = take('cart'), fwd = B.a === s, k = fwd ? u : 1 - u;
        bridges3d.bridgePoint(B, k, tmp);
        side.copy(B.pb).sub(B.pa).normalize(); const dir = fwd ? 1 : -1;
        g.position.copy(tmp).add(new THREE.Vector3(-side.z, 0, side.x).multiplyScalar(0.55 * dir));
        g.rotation.y = -Math.atan2(side.z * dir, side.x * dir);
        g.userData.crate.material = cargoMat[mainCargo(load)] || cargoMat.food;
        return;
      }
      // thuyền: từ bờ đảo s phía đảo d sang bờ đảo d phía đảo s, lượn ra ngoài một chút cho khỏi trùng đường chiều về
      const A = lands[s].center, Bc = lands[d].center;
      side.copy(Bc).sub(A).setY(0).normalize();
      from.copy(A).addScaledVector(side, R + SHORE); to.copy(Bc).addScaledVector(side, -(R + SHORE));
      const g = take('boat'), bend = Math.sin(Math.PI * u) * 6;
      g.position.copy(from).lerp(to, u).add(new THREE.Vector3(-side.z, 0, side.x).multiplyScalar(bend)).setY(SEA_Y + 0.05 + Math.sin(t * 0.003 + s) * 0.08);
      g.rotation.y = -Math.atan2(side.z, side.x); g.rotation.x = Math.sin(t * 0.002 + d) * 0.05;
      g.userData.sail.visible = level < MOTOR_LEVEL; g.userData.cabin.visible = level >= MOTOR_LEVEL;
      g.userData.crate.material = cargoMat[mainCargo(load)] || cargoMat.food;
    }
    // mỗi khung hình: caravans (W.caravans), day (ngày lịch, có phần lẻ), levelOf(i) (thời của đảo i)
    function update(caravans, day, t, levelOf) {
      used.boat = 0; used.cart = 0;
      for (const c of caravans) {
        const u = Math.max(0, Math.min(1, (day - c.depart) / Math.max(1e-6, c.arrive - c.depart)));
        place(c.a, c.b, c.give, u, t, levelOf(c.a));
        place(c.b, c.a, c.get, u, t, levelOf(c.b));
      }
      for (const k in pool) for (let i = used[k]; i < pool[k].length; i++) pool[k][i].visible = false;
    }
    return { update };
  }
  BK.Travel3D = { create };
})(typeof self !== 'undefined' ? self : globalThis);
