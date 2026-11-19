// SamBox · src/build/cells.js · Ô xây (thuần JS): mặt đất chia lưới ô vuông; chỗ nào phẳng là xây được (ở đâu trên đảo cũng vậy),
// trừ lối lính đi (đường chính, khe, lối mòn, lòng hẻm suối, cửa trước, đèo: không xây chắn lối)
//   CELL               cạnh một ô (đơn vị thế giới), rộng chừng hai người đứng cạnh nhau. Cỡ công trình tính theo ô: nhà dân 2×2,
//                      nhà lính 6×4, nhà xe 4×4, cổng thành 4×2, tường 1 ô một đoạn, tháp canh 2×2
//   FLAT, DRY          chênh cao lớn nhất trong một ô còn xây được; độ cao thấp nhất (trên mặt nước, có bờ)
//   buildCells(I)      các ô xây được của đảo I: [[x, z, h00, h10, h01, h11], ...] (x, z: góc ô tính từ tâm đảo; h: độ cao 4 góc):
//                      đủ phẳng, trên mặt nước, cả bốn góc và tâm ô đều không thuộc lối đi (spec.buildZone > 0,5)
//   patches(cells)     số ô của từng mảnh liền nhau (chung cạnh), lớn trước
export const CELL = 6,
  FLAT = 1.2,
  DRY = 1.5;
export function buildCells(I) {
  const h = (x, z) => I.spec.height(x, z),
    n = Math.ceil((I.spec.radius * 1.05) / CELL),
    out = [];
  for (let j = -n; j < n; j++)
    for (let i = -n; i < n; i++) {
      const x = i * CELL,
        z = j * CELL,
        P = [[x, z], [x + CELL, z], [x, z + CELL], [x + CELL, z + CELL], [x + CELL / 2, z + CELL / 2]],
        c = P.map(([px, pz]) => h(px, pz)),
        lo = Math.min(...c),
        hi = Math.max(...c);
      if (lo > DRY && hi - lo <= FLAT && (!I.spec.buildZone || P.every(([px, pz]) => I.spec.buildZone(px, pz) > 0.5))) out.push([x, z, ...c.slice(0, 4)]);
    }
  return out;
}
export function patches(cells) {
  const key = (x, z) => Math.round(x / CELL) + ',' + Math.round(z / CELL),
    left = new Set(cells.map(([x, z]) => key(x, z))),
    sizes = [];
  for (const start of [...left]) {
    if (!left.delete(start)) continue;
    let n = 0;
    const stack = [start];
    while (stack.length) {
      const [a, b] = stack.pop().split(',').map(Number);
      n++;
      for (const k of [`${a + 1},${b}`, `${a - 1},${b}`, `${a},${b + 1}`, `${a},${b - 1}`]) if (left.delete(k)) stack.push(k);
    }
    sizes.push(n);
  }
  return sizes.sort((p, q) => q - p);
}
