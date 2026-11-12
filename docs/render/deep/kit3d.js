/* Bể Kính · render/deep/kit3d.js · Bộ ghép khối của đáy bể: hình gốc (hộp, trụ, nón, …), ba nhóm gộp (đá, đá sáng, rong), put (đặt một khối
 * vào nhóm, màu ngả lam theo độ sâu), frame (toạ độ riêng của một phế tích: u dọc trục, v ngang), rnd (dãy ngẫu nhiên cố định:
 * thứ tự gọi quyết định hình, nên phế tích và hầm phải dựng đúng thứ tự trong render/deep3d.js).
 * Cần: render/deep/terrain3d.js. */
(function (root) {
  'use strict';
  const BK = root.BK || (root.BK = {});
  // D: ngữ cảnh chung của đáy bể (render/deep3d.js); phần này đọc từ D và ghi thêm vào D những gì phần sau dùng
  function build(D) {
    const { THREE, clamp, hash, depthTint, hAt } = D;
    /* =============== Bộ ghép khối (gộp mọi khối của phế tích vào vài lưới) =============== */
    const unit = {};
    const U = (key, make) =>
      unit[key] ||
      (unit[key] = (() => {
        const g = make();
        return g.index ? g.toNonIndexed() : g;
      })());
    const BOX = () => U('box', () => new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0));
    const CYL = (n) => U('cyl' + n, () => new THREE.CylinderGeometry(1, 1, 1, n || 8).translate(0, 0.5, 0));
    const FRU = (n, t) => U('fru' + n + t, () => new THREE.CylinderGeometry(t, 1, 1, n, 1).translate(0, 0.5, 0)); // thân côn: đỉnh t, chân 1
    const CONE = (n) => U('cone' + n, () => new THREE.ConeGeometry(1, 1, n || 8).translate(0, 0.5, 0));
    const BALL = () => U('ball', () => new THREE.IcosahedronGeometry(1, 1));
    const GEM = () => U('gem', () => new THREE.OctahedronGeometry(1, 0).translate(0, 1, 0));
    const DOME = () => U('dome', () => new THREE.SphereGeometry(1, 10, 5, 0, Math.PI * 2, 0, Math.PI / 2));
    const RINGG = () => U('ring', () => new THREE.TorusGeometry(1, 0.06, 4, 32));
    const ARCH = () => U('arch', () => new THREE.TorusGeometry(1, 0.22, 4, 10, Math.PI));
    const HALFDISC = () => U('halfdisc', () => new THREE.CylinderGeometry(1, 1, 1, 12, 1, false, -Math.PI / 2, Math.PI)); // (quay rx = −π/2: nửa đĩa đứng, mặt phẳng nằm dưới)
    const groups = { stone: { pos: [], col: [] }, glow: { pos: [], col: [] }, weed: { pos: [], col: [], sway: [] } };
    const M4 = new THREE.Matrix4(),
      Q = new THREE.Quaternion(),
      E3 = new THREE.Euler(0, 0, 0, 'YXZ'),
      P3 = new THREE.Vector3(),
      S3 = new THREE.Vector3(),
      V3 = new THREE.Vector3(),
      cc = new THREE.Color();
    let seed = 1;
    const rnd = () => hash(seed++);
    // mỗi phần (phế tích, hầm) bắt đầu dãy ngẫu nhiên riêng: sửa một phần không làm đổi hình phần khác
    const reseed = (n) => {
      seed = n;
    };
    // việc chạy mỗi khung hình của các phần động (đảo lơ lửng, vòng quay): fn(ts) với ts là giây; render/deep3d.js gọi
    const anims = [];
    // một khối vào nhóm G: hình gốc geo, màu, toạ độ thế giới (x, y, z), cỡ (sx, sy, sz), góc quay (rx, ry, rz)
    function put(G, geo, color, x, y, z, sx, sy, sz, ry, rx, rz) {
      E3.set(rx || 0, ry || 0, rz || 0);
      Q.setFromEuler(E3);
      M4.compose(P3.set(x, y, z), Q, S3.set(sx, sy, sz));
      const p = geo.attributes.position,
        shade = G === groups.glow ? 1 : 0.9 + rnd() * 0.18;
      for (let i = 0; i < p.count; i++) {
        V3.fromBufferAttribute(p, i).applyMatrix4(M4);
        G.pos.push(V3.x, V3.y, V3.z);
        cc.set(color).multiplyScalar(shade);
        if (G !== groups.glow && !G.noTint) depthTint(cc, V3.y);
        G.col.push(cc.r, cc.g, cc.b);
        if (G.sway) G.sway.push(clamp(p.getY(i), 0, 1));
      }
    }
    // khung riêng của một phế tích: u dọc trục (từ giữa bể ra vách kính), v ngang; at(u, v) cho toạ độ thế giới, cao độ đáy
    function frame(S) {
      const ry0 = Math.atan2(-S.uz, S.ux);
      const at = (u, v) => ({ x: S.x + S.ux * u - S.uz * v, z: S.z + S.uz * u + S.ux * v });
      // đặt khối theo toạ độ riêng (u, v), y tính từ đáy rãnh tại đó (hoặc cao độ tuyệt đối khi abs)
      const add = (G, geo, color, u, y, v, su, sy, sv, ry, rx, rz, abs) => {
        const p = at(u, v);
        put(G, geo, color, p.x, abs ? y : hAt(p.x, p.z) - 0.3 + y, p.z, su, sy, sv, ry0 + (ry || 0), rx, rz);
      };
      return { at, add, ry0 };
    }
    Object.assign(D, { reseed, anims, BOX, CYL, FRU, CONE, BALL, GEM, DOME, RINGG, ARCH, HALFDISC, groups, rnd, put, frame });
  }
  BK.DeepKit = { build };
})(typeof self !== 'undefined' ? self : globalThis);
