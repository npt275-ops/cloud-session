// SamBox · src/core/noise.js · Nhiễu và số ngẫu nhiên có hạt giống (thuần JS, chạy được cả trong trình duyệt và Node)
//   rng(seed)                 hàm trả số ngẫu nhiên 0..1, cùng hạt giống thì cùng dãy (đảo dựng lại y hệt)
//   simplex2(x, y)            nhiễu simplex 2D, khoảng −1..1
//   fbm(x, y, oct, lac, gain) cộng nhiều tầng nhiễu (đồi, bờ biển gồ ghề)
//   ridged(x, y, oct)         nhiễu sống núi: đỉnh nhọn, sườn sắc (dãy núi tuyết)
//   smooth(a, b, x), clamp01, lerp: tiện ích nội suy
export function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// bảng hoán vị cố định (hạt giống 1337) để nhiễu giống nhau mọi lần chạy
const PERM = new Uint8Array(512);
{
  const r = rng(1337),
    p = Array.from({ length: 256 }, (_, i) => i);
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [p[i], p[j]] = [p[j], p[i]];
  }
  for (let i = 0; i < 512; i++) PERM[i] = p[i & 255];
}
const GRAD = [[1, 1], [-1, 1], [1, -1], [-1, -1], [1, 0], [-1, 0], [0, 1], [0, -1]];
const F2 = 0.5 * (Math.sqrt(3) - 1),
  G2 = (3 - Math.sqrt(3)) / 6;

export function simplex2(x, y) {
  const s = (x + y) * F2,
    i = Math.floor(x + s),
    j = Math.floor(y + s),
    t = (i + j) * G2,
    x0 = x - (i - t),
    y0 = y - (j - t),
    i1 = x0 > y0 ? 1 : 0,
    j1 = 1 - i1,
    x1 = x0 - i1 + G2,
    y1 = y0 - j1 + G2,
    x2 = x0 - 1 + 2 * G2,
    y2 = y0 - 1 + 2 * G2,
    ii = i & 255,
    jj = j & 255;
  let n = 0;
  const corner = (gx, gy, cx, cy) => {
    let tt = 0.5 - cx * cx - cy * cy;
    if (tt < 0) return 0;
    const g = GRAD[PERM[gx + PERM[gy]] & 7];
    tt *= tt;
    return tt * tt * (g[0] * cx + g[1] * cy);
  };
  n += corner(ii, jj, x0, y0);
  n += corner(ii + i1, jj + j1, x1, y1);
  n += corner(ii + 1, jj + 1, x2, y2);
  return 70 * n;
}

export function fbm(x, y, oct = 4, lac = 2, gain = 0.5) {
  let a = 1,
    f = 1,
    sum = 0,
    norm = 0;
  for (let i = 0; i < oct; i++) {
    sum += a * simplex2(x * f, y * f);
    norm += a;
    a *= gain;
    f *= lac;
  }
  return sum / norm;
}

export function ridged(x, y, oct = 5) {
  let a = 1,
    f = 1,
    sum = 0,
    norm = 0,
    w = 1;
  for (let i = 0; i < oct; i++) {
    let n = 1 - Math.abs(simplex2(x * f, y * f));
    n *= n * w;
    w = Math.min(1, n * 2);
    sum += a * n;
    norm += a;
    a *= 0.5;
    f *= 2.1;
  }
  return sum / norm;
}

export const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
export const lerp = (a, b, t) => a + (b - a) * t;
export function smooth(a, b, x) {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
}
