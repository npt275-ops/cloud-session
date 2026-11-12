/* Bể Kính · render/birds3d.js · Đàn chim bay lượn trên sáu đảo
 * Mỗi đảo vài đàn, mỗi miền một loài: đồng bằng chim sẻ nâu, rừng chim sẫm cánh, núi đại bàng lớn bay chậm, băng nguyên chim
 * trắng, biển hải âu trắng cánh xám, sa mạc kền kền sẫm lượn vòng rộng. Mỗi đàn lượn vòng quanh một điểm trên đảo, con nào
 * cũng lệch vòng, lệch nhịp, vỗ cánh từng đợt rồi liệng. Đêm xuống thì chim về tổ (ẩn dần); máy bật "giảm chuyển động" thì
 * chim đứng yên trên không. Ba khối lặp (thân, cánh trái, cánh phải) cho mọi con: ba lượt vẽ.
 * Cần: three.js, render/map/map3d.js (lands: tâm đảo). */
(function (root) {
  'use strict';
  const BK = root.BK || (root.BK = {});
  // loài theo miền: màu thân, màu cánh, cỡ, số đàn, số con mỗi đàn, bán kính vòng lượn, độ cao bay, nhịp vỗ cánh
  const KIND = {
    plains: { body: '#8a6a4a', wing: '#6e5236', size: 0.8, flocks: 3, per: 7, R: [10, 22], y: [10, 16], flap: 14 },
    forest: { body: '#3a3a3a', wing: '#262a2c', size: 0.85, flocks: 3, per: 6, R: [10, 20], y: [12, 18], flap: 12 },
    mountain: { body: '#5a4632', wing: '#3e3024', size: 1.7, flocks: 2, per: 2, R: [16, 26], y: [20, 28], flap: 5 },
    tundra: { body: '#f2f4f6', wing: '#d8dee4', size: 0.85, flocks: 3, per: 6, R: [10, 20], y: [9, 15], flap: 13 },
    coast: { body: '#f4f4f0', wing: '#a9b2b8', size: 1.1, flocks: 3, per: 6, R: [14, 26], y: [8, 14], flap: 8 },
    desert: { body: '#3c3028', wing: '#2a221c', size: 1.6, flocks: 2, per: 3, R: [16, 28], y: [18, 26], flap: 4 },
  };
  function create({ THREE, scene, lands3d, reduce }) {
    // thân: hình thoi dài; cánh: tam giác mỏng mọc từ sườn ra ngoài (cánh phải: +x, cánh trái lật gương)
    const bodyG = new THREE.OctahedronGeometry(0.5, 0);
    bodyG.scale(0.32, 0.26, 1);
    const wingG = new THREE.BufferGeometry();
    wingG.setAttribute(
      'position',
      new THREE.Float32BufferAttribute([0, 0, 0.25, 1.3, 0, -0.1, 0, 0, -0.3, 0, 0, 0.25, 0, 0, -0.3, 1.3, 0, -0.1], 3),
    );
    wingG.computeVertexNormals();
    const mat = new THREE.MeshLambertMaterial({ side: THREE.DoubleSide }),
      birds = [];
    lands3d.lands.forEach((L, li) => {
      const K = KIND[L.ter] || KIND.plains;
      let seed = li * 97 + 13;
      const rnd = () => {
        const x = Math.sin(seed++ * 12.9898) * 43758.5453;
        return x - Math.floor(x);
      };
      for (let f = 0; f < K.flocks; f++) {
        const a = rnd() * Math.PI * 2,
          r = 6 + rnd() * 18,
          cx = L.center.x + Math.cos(a) * r,
          cz = L.center.z + Math.sin(a) * r,
          R = K.R[0] + rnd() * (K.R[1] - K.R[0]),
          y = K.y[0] + rnd() * (K.y[1] - K.y[0]),
          dir = rnd() < 0.5 ? 1 : -1,
          w = (dir * (2.4 + rnd())) / R;
        for (let i = 0; i < K.per; i++)
          birds.push({
            K,
            cx,
            cz,
            R: R + (rnd() - 0.5) * 4,
            y: y + (rnd() - 0.5) * 3,
            w,
            ph: rnd() * Math.PI * 2 + i * 0.35,
            fp: rnd() * 10,
            s: K.size * (0.85 + rnd() * 0.3),
          });
      }
    });
    const N = birds.length,
      body = new THREE.InstancedMesh(bodyG, mat, N),
      wingL = new THREE.InstancedMesh(wingG, mat, N),
      wingR = new THREE.InstancedMesh(wingG, mat, N),
      c = new THREE.Color();
    birds.forEach((b, i) => {
      body.setColorAt(i, c.set(b.K.body));
      wingL.setColorAt(i, c.set(b.K.wing));
      wingR.setColorAt(i, c.set(b.K.wing));
    });
    for (const m of [body, wingL, wingR]) {
      m.frustumCulled = false; // (chim bay khắp sáu đảo: khối lặp không có hộp bao đúng)
      m.raycast = () => {};
      scene.add(m);
    }
    const o = new THREE.Object3D(),
      ow = new THREE.Object3D();
    let show = 1;
    function animate(dt, t, night) {
      const ts = reduce ? 0 : t * 0.001;
      // về tổ khi trời tối
      show += ((night > 0.6 ? 0 : 1) - show) * Math.min(1, (dt || 16) / 1500);
      birds.forEach((b, i) => {
        const a = b.ph + b.w * ts,
          x = b.cx + Math.cos(a) * b.R,
          z = b.cz + Math.sin(a) * b.R,
          y = b.y + Math.sin(ts * 0.6 + b.fp) * 0.8,
          s = b.s * show;
        // hướng bay: tiếp tuyến vòng lượn; nghiêng mình vào phía trong vòng
        const vx = -Math.sin(a) * Math.sign(b.w),
          vz = Math.cos(a) * Math.sign(b.w);
        o.position.set(x, y, z);
        o.rotation.set(0, Math.atan2(vx, vz), -0.35 * Math.sign(b.w), 'YXZ');
        o.scale.setScalar(s);
        o.updateMatrix();
        body.setMatrixAt(i, o.matrix);
        // vỗ cánh từng đợt rồi liệng: đợt vỗ 2 giây trong mỗi 5 giây
        const burst = Math.max(0, Math.sin(ts * 1.25 + b.fp)),
          flap = burst > 0.3 ? Math.sin(ts * b.K.flap + b.fp) * 0.75 : 0.12;
        for (const [m, sg] of [
          [wingR, 1],
          [wingL, -1],
        ]) {
          ow.position.copy(o.position);
          ow.rotation.set(0, o.rotation.y, o.rotation.z + sg * flap, 'YXZ');
          ow.scale.set(sg * s, s, s);
          ow.updateMatrix();
          m.setMatrixAt(i, ow.matrix);
        }
      });
      for (const m of [body, wingL, wingR]) m.instanceMatrix.needsUpdate = true;
    }
    return { animate, count: N };
  }
  BK.Birds3D = { create, KIND };
})(typeof self !== 'undefined' ? self : globalThis);
