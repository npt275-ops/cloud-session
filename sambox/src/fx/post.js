// SamBox · src/fx/post.js · Hậu kỳ (ảnh đích 5–15): toả sáng ở mặt trời, mặt nước, cửa sổ đêm; chỉnh màu tách tông (chỗ tối ngả
// tím, chỗ sáng ngả vàng ấm), độ đậm màu, tối góc nhẹ; nén sáng kiểu điện ảnh (ACES) ở bước xuất ra màn hình.
//   buildPost(renderer, scene, camera, tier)  { render(), resize(w, h), apply(preset) }; mức Thấp: toả sáng nửa độ phân giải
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const GRADE = {
  uniforms: {
    tDiffuse: { value: null },
    uShadow: { value: new THREE.Color() },
    uHigh: { value: new THREE.Color() },
    uSat: { value: 1.1 },
    uVig: { value: 0.3 },
  },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform vec3 uShadow, uHigh; uniform float uSat, uVig; varying vec2 vUv;
    const vec3 W = vec3(0.2126, 0.7152, 0.0722);
    void main() {
      vec4 c = texture2D(tDiffuse, vUv);
      float l = dot(c.rgb, W);
      vec3 tint = mix(uShadow, uHigh, smoothstep(0.02, 0.7, l));
      tint /= max(dot(tint, W), 1e-3);
      c.rgb = mix(c.rgb, c.rgb * tint, 0.4);
      c.rgb = mix(vec3(dot(c.rgb, W)), c.rgb, uSat);
      c.rgb *= 1.0 - smoothstep(0.42, 0.9, distance(vUv, vec2(0.5))) * uVig;
      gl_FragColor = c;
    }`,
};
export function buildPost(renderer, scene, camera, tier) {
  const composer = new EffectComposer(renderer),
    size = renderer.getSize(new THREE.Vector2());
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(size.clone().multiplyScalar(tier.bloomScale), 0.5, 0.6, 0.86);
  composer.addPass(bloom);
  const grade = new ShaderPass(GRADE);
  composer.addPass(grade);
  composer.addPass(new OutputPass());
  return {
    render: () => composer.render(),
    resize(w, h) {
      composer.setSize(w, h);
      bloom.resolution.set(w * tier.bloomScale, h * tier.bloomScale);
    },
    apply(P) {
      bloom.strength = P.bloom;
      grade.uniforms.uShadow.value.set(P.grade.shadow);
      grade.uniforms.uHigh.value.set(P.grade.high);
      grade.uniforms.uSat.value = P.grade.sat;
    },
  };
}
