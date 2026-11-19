// SamBox · src/nature/wind.js · Gió chung cho cây cỏ: đồng hồ chung và đoạn shader đẩy đỉnh theo gió
//   WIND           uniforms dùng chung (uTime giây, uWind sức gió 0..)
//   addWind(shader, amp, height)  chèn vào shader đỉnh (onBeforeCompile): đỉnh càng cao (y cục bộ / height) càng lắc, theo vị trí
//                  thế giới nên cả cánh đồng lượn sóng chứ không lắc đều; amp: biên độ ở ngọn (đơn vị)
export const WIND = { uTime: { value: 0 }, uWind: { value: 1 } };
export function addWind(shader, amp, height) {
  Object.assign(shader.uniforms, WIND);
  shader.vertexShader = shader.vertexShader
    .replace('#include <common>', '#include <common>\nuniform float uTime;\nuniform float uWind;')
    .replace(
      '#include <begin_vertex>',
      `#include <begin_vertex>
      {
        #ifdef USE_INSTANCING
          vec4 wpW = modelMatrix * instanceMatrix * vec4(position, 1.0);
        #else
          vec4 wpW = modelMatrix * vec4(position, 1.0);
        #endif
        float k = clamp(position.y / ${height.toFixed(3)}, 0.0, 1.0);
        float g = sin(uTime * 1.6 + wpW.x * 0.08 + wpW.z * 0.06) * 0.7 + sin(uTime * 2.9 + wpW.x * 0.31 - wpW.z * 0.2) * 0.3;
        transformed.x += g * ${amp.toFixed(3)} * uWind * k * k;
        transformed.z += g * ${(amp * 0.5).toFixed(3)} * uWind * k * k;
      }`,
    );
}
