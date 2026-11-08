// Bể Kính · test/helpers.js · Dùng chung cho các tệp kiểm thử (không phải tệp kiểm thử)
// Từ bước 12 quân chỉ sang đảo khác qua cầu (logic/war.js warPath). Kiểm thử về trận đánh cần sẵn đường: road(W, a, b) bắc
// cầu dọc đường ngắn nhất từ a tới b và cho a mượn đường qua các đảo ở giữa (hiệp ước); launch(...) như BK.War.launch, có
// đường trước.
'use strict';
function road(W, a, b) {
  const BK = globalThis.BK, D = BK.Diplomacy, path = [a, ...D.path(a, b), b];
  for (let k = 1; k < path.length; k++) { const x = path[k - 1], y = path[k]; if (!D.bridged(W, x, y)) { const [p, q] = y === (x + 1) % D.N ? [x, y] : [y, x]; // (đầu a: đảo đứng trước theo vòng)
      W.bridges.push({ a: p, b: q, era: Math.max(3, W.islands[x].level), day: W.day || 0 }); } }
  for (const c of path.slice(1, -1)) if (!D.treatyOf(W, a, c, W.day)) D.sign(W, W.day, a, c, 'pact', 1e6);
  return path;
}
// (bên giữ không phá cầu lúc nghe tin: kiểm thử về trận đánh cần trận diễn ra; phá cầu có kiểm thử riêng, test/bridges.test.js)
function launch(W, day, a, b, kind, share, rng, surprise) {
  const S = globalThis.BK.Strategy, on = S.onAttacked; road(W, a, b); S.onAttacked = () => false;
  try { return globalThis.BK.War.launch(W, day, a, b, kind, share, rng, surprise); } finally { S.onAttacked = on; }
}
module.exports = { road, launch };
