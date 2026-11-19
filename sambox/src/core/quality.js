// SamBox · src/core/quality.js · Hai mức đồ hoạ (người chơi chốt: chơi được cả điện thoại và máy tính, phải nhẹ)
// Cùng một cảnh, chỉ đổi mật độ và hậu kỳ. Tự chọn theo máy; ?q=low hay ?q=high để ép.
//   low   điện thoại: độ nét màn hình thấp hơn, lưới đất thưa, cây cỏ còn 30%, bóng 1024, toả sáng nửa độ phân giải
//   high  máy tính: đầy đủ
export const TIERS = {
  low: { key: 'low', name: 'Thấp', dpr: 1.25, seg: 224, flora: 0.3, shadow: 1024, bloomScale: 0.5, antialias: false },
  high: { key: 'high', name: 'Cao', dpr: 2, seg: 448, flora: 1, shadow: 2048, bloomScale: 1, antialias: true },
};
export function detectTier() {
  const q = new URLSearchParams(location.search).get('q');
  if (TIERS[q]) return TIERS[q];
  const mobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) || Math.min(screen.width, screen.height) < 700;
  return mobile ? TIERS.low : TIERS.high;
}
