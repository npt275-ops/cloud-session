// SamBox · src/fx/stylize.js · Ánh sáng kiểu tranh vẽ (ảnh đích 5–15): viền sáng ngược nắng, ánh xuyên lá, gió
//   LIGHT        uniforms chung: hướng mặt trời trong không gian máy quay (cập nhật mỗi khung hình), màu nắng, sức viền
//   stylize(mat, o)  vá vật liệu Lambert: o.rim (viền sáng ở rìa khi nhìn ngược nắng), o.trans (ánh sáng xuyên qua lá cỏ khi
//                nhìn ngược nắng), o.wind = [biên độ, chiều cao] (gió: src/nature/wind.js). Bóng không đen: màu đất của đèn bán cầu
//                ngả tím lo phần tối (src/world/daytime.js hemi.ground). o.extra(shader): vá thêm của riêng vật liệu đó.
import { addWind } from '../nature/wind.js';
export const LIGHT = { uSunView: { value: null }, uSunColor: { value: null }, uRimK: { value: 1 } };
export function stylize(mat, o = {}) {
  const rim = (o.rim ?? 0.5).toFixed(3),
    trans = (o.trans ?? 0).toFixed(3);
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, LIGHT);
    if (o.wind) addWind(sh, o.wind[0], o.wind[1]);
    if (o.extra) o.extra(sh);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform vec3 uSunView;\nuniform vec3 uSunColor;\nuniform float uRimK;')
      .replace(
        '#include <opaque_fragment>',
        `{
          vec3 Vw = normalize(vViewPosition);
          float back = clamp(dot(uSunView, -Vw), 0.0, 1.0);
          float fres = pow(1.0 - clamp(abs(dot(normal, Vw)), 0.0, 1.0), 3.0);
          outgoingLight += uSunColor * diffuseColor.rgb * uRimK * (fres * (0.25 + back) * ${rim} + pow(back, 4.0) * ${trans});
        }
        #include <opaque_fragment>`,
      );
  };
  mat.customProgramCacheKey = () => 'sb-style-' + rim + '-' + trans + '-' + (o.wind ? o.wind.join(',') : '') + (o.key || '');
  return mat;
}
