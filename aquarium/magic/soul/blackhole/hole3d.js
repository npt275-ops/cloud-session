/* Bể Kính · magic/soul/blackhole/hole3d.js · Hình Hố đen (design/ke-hoach-buoc-37.md mục "Hố đen"; ảnh tham khảo người chơi gửi)
 *   lõi      cầu đen tuyệt đối (chân trời sự kiện), không bị lớp bẻ cong (warp3d.js) kéo vào
 *   vòng     vòng photon: viền sáng trắng mảnh ôm sát lõi, cộng quầng cam mờ (phần đĩa phía sau bị bẻ cong vòng qua đầu lõi);
 *            luôn quay mặt về máy quay
 *   đĩa      đĩa bồi tụ dẹt xoáy quanh lõi: trắng vàng ở mép trong, cam, đỏ thẫm ở ngoài, mờ dần ra mép; các vệt xoắn ốc chạy
 *            nhanh ở trong, chậm ở ngoài; một bên sáng hơn (vật chất lao về phía mắt); hơi nghiêng
 *   tia      hai tia sáng xanh trắng phóng thẳng lên, xuống theo trục hố, chập chờn, nhạt dần theo chiều dài
 * Mọi con số ở LOOK. G.hole3d.show(tâm, cỡ cả hố, cỡ lõi, giây, mức còn), hide(). Cần: three.js. */
(function (root) {
  const BK = root.BK || (root.BK = {});
  const LOOK = {
    TILT: 0.22, // (rad) đĩa nghiêng
    FACE: 0.45, // pháp tuyến đĩa ngả về phía máy quay chừng này (nhìn từ đâu cũng thấy mặt đĩa như ảnh tham khảo, không thấy cạnh)
    TURN: 0.6, // (1/giây) đĩa xoay theo máy quay thật chậm, có quán tính (máy quay nhún theo bước chạy thì đĩa không rung theo)
    DISK_IN: 1.25, // mép trong đĩa: lần bán kính lõi
    RING: 1.08, // vòng photon: lần bán kính lõi
    HALO: 1.9, // quầng cam quanh lõi: lần bán kính lõi
    JET_LEN: 3.2, // tia dài: lần cỡ cả hố
    JET_W: 0.05, // tia rộng ở gốc: lần cỡ cả hố
    SPIN: 1.6, // tốc độ xoáy của đĩa ở mép trong
  };
  const LD_V = '#include <common>\n#include <logdepthbuf_pars_vertex>\n',
    LD_F = '#include <logdepthbuf_pars_fragment>\n';
  const DISK_V =
    LD_V +
    'varying vec2 vP; void main(){ vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);\n' +
    '#include <logdepthbuf_vertex>\n}';
  // đĩa: toạ độ cực, vệt xoắn ốc theo log(r) trôi theo thời gian (trong nhanh, ngoài chậm), màu theo bán kính
  const DISK_F =
    LD_F +
    `uniform float uT, uIn, uFade; varying vec2 vP;
float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h(i), h(i + vec2(1, 0)), f.x), mix(h(i + vec2(0, 1)), h(i + vec2(1, 1)), f.x), f.y); }
void main(){
  float r = length(vP), a = atan(vP.y, vP.x);
  float u = (r - uIn) / (1.0 - uIn);
  if (u < 0.0 || u > 1.0) discard;
  float sp = a * 3.0 + log(r) * 9.0 - uT * ${LOOK.SPIN.toFixed(2)} / (0.25 + r);
  float s = n(vec2(sp * 2.2, u * 18.0)) * 0.6 + n(vec2(sp * 5.0, u * 40.0)) * 0.4;
  vec3 hot = vec3(1.0, 0.96, 0.82), mid = vec3(1.0, 0.55, 0.16), cool = vec3(0.95, 0.28, 0.08);
  vec3 col = u < 0.35 ? mix(hot, mid, u / 0.35) : mix(mid, cool, (u - 0.35) / 0.65);
  float side = 0.75 + 0.45 * sin(a + 0.6);
  col *= (0.55 + 0.8 * s) * side * (1.0 + 1.6 * exp(-u * 9.0));
  // (mép ngoài mờ hẳn trước khi kịp tối: không thành vành tối đục quanh hố)
  float al = smoothstep(0.0, 0.04, u) * (1.0 - smoothstep(0.3, 0.85, u)) * (0.55 + 0.45 * s);
  gl_FragColor = vec4(col, al * uFade);
#include <logdepthbuf_fragment>
}`;
  // vòng photon và quầng: mặt phẳng quay về máy quay, toạ độ theo bán kính lõi
  const RING_F =
    LD_F +
    `uniform float uT, uFade; varying vec2 vP;
void main(){
  float r = length(vP), a = atan(vP.y, vP.x);
  float ring = exp(-pow((r - ${LOOK.RING.toFixed(2)}) * 22.0, 2.0)) * 1.4;
  float arc = exp(-pow((r - 1.25 - 0.08 * sin(a * 2.0 + uT)) * 5.0, 2.0)) * (0.5 + 0.5 * max(0.0, sin(a)));
  float halo = exp(-max(0.0, r - 1.0) * 3.2) * 0.35;
  if (r < 1.0) discard;
  vec3 col = vec3(1.0, 0.97, 0.9) * ring + vec3(1.0, 0.62, 0.22) * (arc + halo);
  float al = clamp(ring + arc * 0.8 + halo, 0.0, 1.0);
  gl_FragColor = vec4(col, al * uFade);
#include <logdepthbuf_fragment>
}`;
  const JET_F =
    LD_F +
    `uniform float uT, uFade; varying vec2 vP;
void main(){
  float v = 1.0 - vP.y; // (uv.y = 1 ở gốc tia)
  float fl = 0.7 + 0.3 * sin(v * 40.0 - uT * 30.0) * sin(v * 13.0 - uT * 11.0);
  float al = (1.0 - v) * (1.0 - v) * fl;
  gl_FragColor = vec4(vec3(0.75, 0.88, 1.0) * (1.4 - v), al * uFade);
#include <logdepthbuf_fragment>
}`;
  const JET_V =
    LD_V +
    'varying vec2 vP; void main(){ vP = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);\n' +
    '#include <logdepthbuf_vertex>\n}';
  function setup(G) {
    const { THREE, scene, camera } = G;
    const grp = new THREE.Group();
    grp.visible = false;
    // lõi đen: không bị bẻ cong (warp3d.js userData.noVoid), không sương mù, không nhận ánh sáng
    const core = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 24), new THREE.MeshBasicMaterial({ color: 0x000000, fog: false }));
    core.material.userData.noVoid = true;
    const uni = () => ({ uT: { value: 0 }, uFade: { value: 1 } });
    const mat = (frag, vert, u, blend) =>
      new THREE.ShaderMaterial({ uniforms: u, vertexShader: vert, fragmentShader: frag, transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: blend });
    const dU = Object.assign(uni(), { uIn: { value: 0.3 } });
    const disk = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat(DISK_F, DISK_V, dU, THREE.NormalBlending));
    disk.rotation.x = -Math.PI / 2;
    // (đĩa và tia nằm trong nhóm xoay: trục nhóm là pháp tuyến đĩa; spin xoay quanh trục đó)
    const tilt = new THREE.Group(),
      spinG = new THREE.Group();
    tilt.add(spinG);
    spinG.add(disk);
    const rU = uni();
    const ring = new THREE.Mesh(new THREE.PlaneGeometry(2 * LOOK.HALO * 1.6, 2 * LOOK.HALO * 1.6), mat(RING_F, DISK_V, rU, THREE.AdditiveBlending));
    const jU = uni();
    const jets = [1, -1].map((sgn) => {
      const g = new THREE.CylinderGeometry(0.15, 1, 1, 16, 1, true).translate(0, -0.5, 0);
      if (sgn > 0) g.rotateX(Math.PI);
      const m = new THREE.Mesh(g, mat(JET_F, JET_V, jU, THREE.AdditiveBlending));
      spinG.add(m);
      return m;
    });
    for (const m of [disk, ring, ...jets]) m.renderOrder = 6;
    grp.add(core, tilt, ring);
    scene.add(grp);
    const v = new THREE.Vector3(),
      up = new THREE.Vector3(0, 1, 0),
      nrm = new THREE.Vector3(),
      want = new THREE.Vector3();
    let last = 0;
    // tâm, cỡ cả hố (mép ngoài đĩa), cỡ lõi, giây, mức còn (0..1)
    function show(c, outer, hz, t, fade) {
      grp.visible = fade > 0.001;
      grp.position.copy(c);
      core.scale.setScalar(hz * Math.max(0.05, fade));
      disk.scale.setScalar(outer * fade);
      dU.uIn.value = Math.min(0.9, (hz * LOOK.DISK_IN) / outer);
      ring.scale.setScalar(hz * fade);
      ring.quaternion.copy(camera.quaternion); // (quay mặt về máy quay)
      for (const j of jets) j.scale.set(outer * LOOK.JET_W, outer * LOOK.JET_LEN * fade, outer * LOOK.JET_W);
      // pháp tuyến đĩa: trục đứng nghiêng TILT, ngả về phía máy quay FACE
      v.copy(camera.position).sub(c).normalize();
      want.set(Math.sin(LOOK.TILT), Math.cos(LOOK.TILT), 0).lerp(v, LOOK.FACE).normalize();
      const now = performance.now(),
        sec = last ? Math.min(0.1, (now - last) / 1000) : 1;
      last = now;
      if (!grp.visible || nrm.lengthSq() < 0.5) nrm.copy(want);
      else nrm.lerp(want, Math.min(1, sec * LOOK.TURN)).normalize();
      tilt.quaternion.setFromUnitVectors(up, nrm);
      spinG.rotation.y = t * 0.05;
      for (const u of [dU, rU, jU]) {
        u.uT.value = t;
        u.uFade.value = Math.min(1, fade * 1.2);
      }
    }
    const hide = () => (grp.visible = false);
    G.hole3d = { show, hide, LOOK };
  }
  BK.Hole3D = { setup, LOOK };
})(typeof self !== 'undefined' ? self : globalThis);
