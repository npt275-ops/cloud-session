/* Bể Kính · magic/water/stream-mat.js · Vật liệu dòng nước dùng chung của hệ nước (cột nước, lốc xoáy)
 * Nước trong mờ, có vệt chảy (dọc theo chiều cao, xoắn quanh khối), mép khối sáng hơn (nước dày, phản chiếu trời ở mép).
 * make(THREE, { color, spin, speed, alpha }) trả vật liệu; mat.uniforms.uT cập nhật theo thời gian, uA: độ đậm (0: ẩn).
 * Toạ độ uv của khối tròn xoay: u quanh khối, v theo chiều cao. Cần: three.js (độ sâu logarit: render/scene3d.js). */
(function (root) {
  const BK = root.BK || (root.BK = {});
  const VERT = `#include <common>
#include <logdepthbuf_pars_vertex>
varying vec2 vUv; varying vec3 vN; varying vec3 vV;
void main() {
  vUv = uv;
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vN = normalize(mat3(modelMatrix) * normal);
  vV = normalize(cameraPosition - wp.xyz);
  gl_Position = projectionMatrix * viewMatrix * wp;
  #include <logdepthbuf_vertex>
}`;
  const FRAG = `uniform float uT; uniform float uA; uniform vec3 uC; uniform float uSpin; uniform float uSpeed;
varying vec2 vUv; varying vec3 vN; varying vec3 vV;
#include <logdepthbuf_pars_fragment>
void main() {
  #include <logdepthbuf_fragment>
  float u = vUv.x * 6.2832, v = vUv.y;
  float s1 = 0.5 + 0.5 * sin(u * 7.0 + v * uSpin * 9.0 - uT * uSpeed);
  float s2 = 0.5 + 0.5 * sin(u * 13.0 - v * uSpin * 5.0 - uT * uSpeed * 1.7 + 1.3);
  float streak = pow(s1 * 0.6 + s2 * 0.4, 3.0);
  float rim = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 2.0);
  vec3 col = mix(uC, vec3(0.95, 0.99, 1.0), clamp(streak * 0.7 + rim * 0.6, 0.0, 1.0));
  gl_FragColor = vec4(col, uA * clamp(0.35 + streak * 0.5 + rim * 0.5, 0.0, 1.0));
}`;
  function make(THREE, o) {
    return new THREE.ShaderMaterial({
      uniforms: {
        uT: { value: 0 },
        uA: { value: 0 },
        uC: { value: new THREE.Color((o && o.color) || '#5fc4dc') },
        uSpin: { value: (o && o.spin) || 1 },
        uSpeed: { value: (o && o.speed) || 6 },
      },
      vertexShader: VERT,
      fragmentShader: FRAG,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
  }
  BK.WaterStream = { make };
})(typeof self !== 'undefined' ? self : globalThis);
