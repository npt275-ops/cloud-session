/* Bể Kính · magic/water/deluge/vortex3d.js · Lốc xoáy nước giữa bể (phần hình của Đại hồng thuỷ)
 * Cho có cảm giác lốc xoáy thật, ghép từ năm phần, cùng quay một chiều:
 *   xoáy mặt nước  mặt biển trũng xuống thành phễu, nước quanh đó bị cuốn quay, vệt bọt xoắn ốc chạy vào tâm
 *                  (render/water/surface3d.js setWhirl: cùng trường dốc nên phản chiếu, ánh nắng uốn theo phễu)
 *   lõi            cột nước đặc, thắt ở giữa (hình đồng hồ cát hẹp), thân uốn lượn theo chiều cao, bề mặt gợn từng vòng
 *                  sóng chạy lên theo đường xoắn, sáng theo nắng ở phía có nắng, viền sáng (Fresnel)
 *   vỏ bụi nước    lớp ngoài rộng hơn, trong mờ, quay nhanh hơn lõi, vệt bụi nước xoắn (nhìn xuyên thấy lõi)
 *   chân           bụi nước tung xoáy tròn bốc lên, giọt nước văng ra theo đường xoắn, gợn nước lớn quanh chân
 *   đỉnh           mây giông xám đen xoáy tròn quanh miệng phễu (cột nước nối vào mây)
 * set(k, mựcNước, giây): k 0..1 cỡ lốc xoáy (magic/water/deluge/plan.js vortex); 0 thì ẩn hết, mặt nước phẳng lại.
 * Đặt ở giữa bể: chỗ biển xa mọi bờ nhất gần tâm bể (heart). Cần: three.js, render/magic/vfx.js, render/water/water3d.js. */
(function (root) {
  const BK = root.BK || (root.BK = {});
  const HEIGHT = 70,
    SPIN = 1.4, // (vòng mỗi giây) lõi quay; vỏ quay nhanh hơn SHELL_SPIN lần
    SHELL_SPIN = 1.6,
    WHIRL_R = 9, // (đơn vị) bán kính phễu trũng trên mặt biển
    WHIRL_DEPTH = 4.5,
    SPRAY = 110, // hạt bụi nước mỗi giây ở chân
    CLOUD = 26; // cục mây giông mỗi giây ở đỉnh
  // dáng phễu: bán kính theo phần chiều cao u (0 chân, 1 đỉnh): chân loe, giữa thắt, lên cao loe rộng thành miệng
  const radiusAt = (u, shell) => (shell ? 1.6 : 1) * (1.3 + 3.2 * Math.exp(-u * 14) + 20 * Math.pow(u, 2.2));
  const VERT = `#include <common>
#include <logdepthbuf_pars_vertex>
uniform float uT; uniform float uBend; uniform float uH;
varying vec2 vUv; varying vec3 vN; varying vec3 vW;
void main() {
  vUv = uv;
  vec3 p = position;
  float u = clamp(p.y / uH, 0.0, 1.0), an = atan(p.z, p.x);
  // gợn từng vòng chạy lên theo đường xoắn, phình xẹp
  float w = 1.0 + 0.09 * sin(an * 5.0 - p.y * 0.35 + uT * 7.0) + 0.05 * sin(an * 11.0 + p.y * 0.6 - uT * 11.0);
  p.xz *= w;
  // thân uốn lượn: trục cột lệch dần theo chiều cao
  p.x += uBend * u * u * 7.0 * sin(uT * 0.6 + u * 3.0);
  p.z += uBend * u * u * 5.0 * cos(uT * 0.45 + u * 2.4);
  vec4 wp = modelMatrix * vec4(p, 1.0);
  vW = wp.xyz;
  vN = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * wp;
  #include <logdepthbuf_vertex>
}`;
  const FRAG = `uniform float uT; uniform float uA; uniform vec3 uC; uniform vec3 uSun; uniform vec3 uSunC; uniform float uSpeed; uniform float uShell;
varying vec2 vUv; varying vec3 vN; varying vec3 vW;
#include <logdepthbuf_pars_fragment>
void main() {
  #include <logdepthbuf_fragment>
  vec3 N = normalize(vN), V = normalize(cameraPosition - vW);
  if (!gl_FrontFacing) N = -N;
  float u = vUv.x * 6.2832, v = vUv.y;
  // vệt xoắn: nước cuộn lên theo đường xoắn ốc, hai lớp khác nhịp
  float s1 = 0.5 + 0.5 * sin(u * 6.0 + v * 26.0 - uT * uSpeed);
  float s2 = 0.5 + 0.5 * sin(u * 15.0 - v * 9.0 - uT * uSpeed * 1.6 + 2.0);
  float streak = pow(s1, 3.0) * 0.65 + pow(s2, 5.0) * 0.45;
  float rim = pow(1.0 - abs(dot(N, V)), 2.2);
  float lit = 0.55 + 0.45 * max(dot(N, normalize(uSun)), 0.0);
  vec3 col = uC * lit + uSunC * 0.15 * lit;
  col = mix(col, vec3(0.92, 0.97, 1.0) * (0.6 + 0.4 * lit), clamp(streak * (0.5 + uShell * 0.3) + rim * 0.55, 0.0, 1.0));
  float a = uShell > 0.5 ? 0.18 + streak * 0.45 + rim * 0.25 : 0.55 + rim * 0.35 + streak * 0.2;
  a *= smoothstep(0.0, 0.04, v) * (1.0 - smoothstep(0.82, 1.0, v)); // (chân hoà vào mặt nước, đỉnh tan vào mây)
  gl_FragColor = vec4(col, uA * clamp(a, 0.0, 1.0));
}`;
  function setup(G) {
    const { THREE, scene } = G;
    function lathe(shell) {
      const pts = [];
      for (let i = 0; i <= 40; i++) {
        const u = i / 40;
        pts.push(new THREE.Vector2(radiusAt(u, shell), u * HEIGHT));
      }
      const mat = new THREE.ShaderMaterial({
        uniforms: {
          uT: { value: 0 },
          uA: { value: 0 },
          uH: { value: HEIGHT },
          uBend: { value: 0 },
          uC: { value: new THREE.Color(shell ? '#9fd6e4' : '#3f8fa6') },
          uSun: { value: new THREE.Vector3(0, 1, 0) },
          uSunC: { value: new THREE.Color(1, 1, 1) },
          uSpeed: { value: shell ? 13 : 8 },
          uShell: { value: shell ? 1 : 0 },
        },
        vertexShader: VERT,
        fragmentShader: FRAG,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
      const m = new THREE.Mesh(new THREE.LatheGeometry(pts, 64), mat);
      m.visible = false;
      m.frustumCulled = false;
      m.renderOrder = shell ? 6 : 5;
      scene.add(m);
      return m;
    }
    const core = lathe(false),
      shell = lathe(true);
    // chỗ biển xa mọi bờ nhất gần tâm bể
    function heart() {
      let best = [0, 0],
        bd = -1;
      for (let r = 0; r <= 30; r += 3)
        for (let a = 0; a < 6.283; a += 0.26) {
          const x = Math.cos(a) * r,
            z = Math.sin(a) * r;
          let m = 1e9;
          for (const L of G.lands) {
            const dx = x - L.center.x,
              dz = z - L.center.z;
            m = Math.min(m, Math.hypot(dx, dz) - L.rOf(Math.atan2(dz, dx)));
          }
          if (m > bd + 4) {
            bd = m;
            best = [x, z];
          }
          if (r === 0) break;
        }
      return best;
    }
    const st = { at: null, acc: 0, cloud: 0, t: 0 },
      p = new THREE.Vector3(),
      v = new THREE.Vector3(),
      d = new THREE.Vector3();
    function set(k, y, sec) {
      if (!st.at) st.at = heart();
      const on = k > 0.01;
      core.visible = shell.visible = on;
      if (G.waterSurface) G.waterSurface.setWhirl(st.at[0], st.at[1], WHIRL_R * (0.5 + 0.5 * k), WHIRL_DEPTH, on ? k : 0);
      if (!on) return;
      st.t += sec;
      const sun = G.sun;
      d.copy(sun.position).sub(sun.target.position).normalize();
      for (const [m, spin] of [
        [core, SPIN],
        [shell, SPIN * SHELL_SPIN],
      ]) {
        m.position.set(st.at[0], y - WHIRL_DEPTH * k * 0.8, st.at[1]);
        m.scale.set(0.35 + 0.65 * k, k, 0.35 + 0.65 * k);
        m.rotation.y += sec * spin * Math.PI * 2 * (0.4 + 0.6 * k);
        const U = m.material.uniforms;
        U.uT.value = st.t;
        U.uA.value = k;
        U.uBend.value = k;
        U.uSun.value.copy(d);
        U.uSunC.value.copy(sun.color).multiplyScalar(sun.intensity);
      }
      // chân: bụi nước xoáy bốc lên, giọt văng xoắn ra ngoài
      st.acc += sec * SPRAY * k;
      for (; st.acc >= 1; st.acc--) {
        const a = Math.random() * Math.PI * 2,
          r = 2 + Math.random() * 7;
        p.set(st.at[0] + Math.cos(a) * r, y + Math.random() * 2, st.at[1] + Math.sin(a) * r);
        const out = Math.random() < 0.25;
        v.set(-Math.sin(a) * 11 + Math.cos(a) * (out ? 6 : -1), 3 + Math.random() * (out ? 6 : 12), Math.cos(a) * 11 + Math.sin(a) * (out ? 6 : -1));
        if (out) G.vfx.spawn('glow', p, v, { life: 1.2, size: [0.18, 0.06], color: ['water.core', 'water.mid'], grav: 9, drag: 0.3 });
        else G.vfx.spawn('soft', p, v, { life: 1.6, size: [0.7, 2.8], color: ['water.core', 'water.soft'], alpha: 0.5, drag: 0.7, grav: -0.8 });
      }
      // đỉnh: mây giông xoáy quanh miệng phễu
      st.cloud += sec * CLOUD * k;
      for (; st.cloud >= 1; st.cloud--) {
        const a = Math.random() * Math.PI * 2,
          r = 8 + Math.random() * 22;
        p.set(st.at[0] + Math.cos(a) * r, y + HEIGHT * k * (0.85 + Math.random() * 0.2), st.at[1] + Math.sin(a) * r);
        v.set(-Math.sin(a) * 7, 0.3, Math.cos(a) * 7);
        G.vfx.spawn('soft', p, v, { life: 5, size: [9, 17], color: ['#5d666f', '#7f888f'], alpha: 0.42, drag: 0.15 });
      }
      if (G.water && Math.random() < sec * 8) G.water.splash(st.at[0] + (Math.random() - 0.5) * 8, st.at[1] + (Math.random() - 0.5) * 8, 2.5 * k, 0.9 * k);
    }
    G.vortex3d = { set, heart: () => st.at || (st.at = heart()) };
  }
  BK.Vortex3D = { setup, HEIGHT };
})(typeof self !== 'undefined' ? self : globalThis);
