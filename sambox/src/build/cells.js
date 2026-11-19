// SamBox · src/build/cells.js · Ô xây (thuần JS): mặt đất chia lưới ô vuông; ô xây được khi đủ phẳng và nằm trên mặt nước
//   CELL               cạnh một ô (đơn vị thế giới), rộng chừng hai người đứng cạnh nhau. Cỡ công trình tính theo ô: nhà dân 2×2,
//                      nhà lính 6×4, nhà xe 4×4, cổng thành 4×2, tường 1 ô một đoạn, tháp canh 2×2
//   FLAT, DRY          chênh cao lớn nhất trong một ô còn xây được; độ cao thấp nhất (trên mặt nước, có bờ)
//   buildCells(I)      các ô xây được của đảo I: [[x, z, h00, h10, h01, h11], ...] (x, z: góc ô tính từ tâm đảo; h: độ cao 4 góc);
//                      chỉ trong vùng xây của đảo (spec.buildZone: khu nhà chính) nếu đảo có khai báo
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
        c = [h(x, z), h(x + CELL, z), h(x, z + CELL), h(x + CELL, z + CELL)],
        lo = Math.min(...c, h(x + CELL / 2, z + CELL / 2)),
        hi = Math.max(...c, h(x + CELL / 2, z + CELL / 2));
      if (lo > DRY && hi - lo <= FLAT && (!I.spec.buildZone || I.spec.buildZone(x + CELL / 2, z + CELL / 2) > 0.5)) out.push([x, z, ...c]);
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
