// SamBox · src/world/terrain.js · Mặt đất của một đảo: lưới độ cao, màu đất theo độ cao và độ dốc (src/world/islands/*.js)
//   buildTerrain(I, tier)   một Mesh đặt ở tâm đảo; lưới vuông cạnh 2,3 × bán kính, số ô theo mức đồ hoạ (tier.seg), bốn góc
//                           kéo về vòng tròn bán kính 1,15 × bán kính (không lòi ra ngoài bể kính tròn); mép lưới chìm dưới
//                           đáy biển. Màu tô theo đỉnh (rẻ, hợp kiểu tranh vẽ), ánh sáng Lambert vá kiểu (stylize)
//                           Vách đá (chỗ dốc) tô trong shader theo độ cao thật của từng điểm ảnh (spec.cliff): vân đá xếp tầng,
//                           sọc lượn theo hướng ngang, vệt dọc, chân mỗi tầng tối hơn; không phụ thuộc độ mịn của lưới (vách dựng chỉ
//                           có vài đỉnh lưới theo chiều đứng nên tô theo đỉnh không vẽ được vân)
//   slopeAt(spec, x, z)     độ dốc 0 (phẳng) .. 1 (dựng đứng) từ chênh lệch độ cao (dùng chung cho tô màu và cây cỏ)
import * as THREE from 'three';
import { stylize } from '../fx/stylize.js';

export function slopeAt(spec, x, z, e = 1) {
  const hx = spec.height(x + e, z) - spec.height(x - e, z),
    hz = spec.height(x, z + e) - spec.height(x, z - e);
  const ny = 2 * e / Math.hypot(hx, hz, 2 * e);
  return 1 - ny;
}
// vách đá: bốn màu tầng (cl.colors), tầng cao 1/cl.freq đơn vị, vách bắt đầu từ độ dốc cl.range[0] tới cl.range[1]
function cliffShader(cl) {
  const C = cl.colors.map((h) => new THREE.Color(h)),
    v = (c) => `vec3(${c.r.toFixed(4)}, ${c.g.toFixed(4)}, ${c.b.toFixed(4)})`;
  return (sh) => {
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWP;\nvarying vec3 vWN;')
      .replace('#include <project_vertex>', 'vWP = (modelMatrix * vec4(transformed, 1.0)).xyz;\nvWN = normalize(mat3(modelMatrix) * objectNormal);\n#include <project_vertex>');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWP;\nvarying vec3 vWN;')
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
        {
          float steep = 1.0 - clamp(normalize(vWN).y, 0.0, 1.0);
          float k = smoothstep(${cl.range[0].toFixed(3)}, ${cl.range[1].toFixed(3)}, steep);
          float b = vWP.y * ${cl.freq.toFixed(4)} + sin(vWP.x * 0.045) * 0.7 + sin(vWP.z * 0.038 + 1.7) * 0.7;
          float i = mod(floor(b), 4.0);
          vec3 rock = i < 0.5 ? ${v(C[0])} : i < 1.5 ? ${v(C[1])} : i < 2.5 ? ${v(C[2])} : ${v(C[3])};
          rock *= 0.82 + 0.18 * fract(b);
          rock *= 0.9 + 0.1 * sin(vWP.x * 0.8 + vWP.z * 0.65 + sin(vWP.y * 0.3) * 2.0);
          diffuseColor.rgb = mix(diffuseColor.rgb, rock, k);
        }`,
      );
  };
}
export function buildTerrain(I, tier) {
  const spec = I.spec,
    size = spec.radius * 2.3,
    seg = tier.seg,
    g = new THREE.PlaneGeometry(size, size, seg, seg);
  g.rotateX(-Math.PI / 2);
  const p = g.attributes.position,
    col = new Float32Array(p.count * 3);
  const rMax = spec.radius * 1.15;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i),
      z = p.getZ(i),
      k = Math.min(1, rMax / Math.hypot(x, z)); // (góc lưới vuông: dồn về vòng tròn, nằm dưới đáy biển nên không thấy)
    p.setXYZ(i, x * k, spec.height(x * k, z * k), z * k);
  }
  g.computeVertexNormals();
  const n = g.attributes.normal;
  for (let i = 0; i < p.count; i++) {
    const c = spec.ground(p.getX(i), p.getZ(i), p.getY(i), 1 - n.getY(i));
    const lin = new THREE.Color().setRGB(c[0], c[1], c[2], THREE.SRGBColorSpace);
    col.set([lin.r, lin.g, lin.b], i * 3);
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const mat = stylize(new THREE.MeshLambertMaterial({ vertexColors: true }), { rim: 0.35, key: spec.key, extra: cliffShader(spec.cliff) });
  const m = new THREE.Mesh(g, mat);
  m.position.set(I.x, 0, I.z);
  m.receiveShadow = m.castShadow = true;
  m.name = 'đất ' + spec.name;
  return m;
}
