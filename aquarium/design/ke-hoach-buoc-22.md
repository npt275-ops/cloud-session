# Bước 22 · Thành Vỏ Ốc Xà Cừ thay Thành Vòng Nước

Yêu cầu: thay phế tích trong rãnh dưới Thông Xanh (Thành Vòng Nước: tường vòng, nhà hộp, mái chóp) bằng một phế tích đẹp mắt,
hiện đại, thú vị, kỳ lạ hơn; thêm nhiều công trình hình vỏ ốc, từ nhỏ tới lớn.

## 1. Thiết kế (render/deep/citadel3d.js, thiết kế riêng của Bể Kính)

Một nền văn minh biết uốn đá như vỏ ốc, màu xà cừ (trắng tím, trắng ngà, lam nhạt), đường sáng lam và tím.

| Công trình | Cỡ | Số |
|---|---|---|
| Vỏ ốc xoắn chính: hai vòng xoắn lôgarit, khoang ngăn bằng đường sáng, gờ sáng dọc lưng, miệng ôm lõi sáng, hạt sáng trôi | cao 58 | 1 |
| Sảnh vỏ ốc (cùng kiểu, quay mặt xoắn về giữa rãnh) | cao 12–18 | 5 |
| Tháp ốc vặn: vòng xoắn nhọn dần lên đỉnh, đường khớp sáng chạy theo vòng xoắn, miệng sáng ở chân, ngọc sáng ở đỉnh | cao 22–46 | 6 |
| Đền sò quạt: 13 gân toả từ bản lề, rãnh sáng giữa gân, hai tai, ngọc sáng | cao 24 (giữa), 10 (hai bên lối vào quảng trường) | 3 |
| Nhà vỏ ốc nhỏ, nhà ốc tiền (thuôn, đốm, khe sáng), vòm bong bóng, tháp nấm, vòm vỡ | cao 3–16 | khoảng 54 |
| Tháp pha lê xoắn (lam, tím), đầu sáng | cao 44–62 | 4 |
| Quảng trường hoa hải quỳ: cánh đá cong ngả ra quanh hồ sáng, ngọc quay lơ lửng; hai đường từ cửa hầm gặp nhau ở đây | rộng 42 | 1 |
| Cổng xương sườn dọc hai đường từ cửa hầm | cao 8–10 | khoảng 14 |
| Ba vòng đá có hạt sáng quay chậm quanh vỏ chính (động) | bán kính 38–50 | 3 |
| Đảo đá lơ lửng, mỗi đảo một đình vòm, vòng sáng dưới đáy, nhấp nhô lệch pha (động) | 3,5–6 | 5 |

- Bốn kiểu vỏ ốc là bốn hàm dùng lại được (nautilus, turret, scallop, cowrie) với hình học ống cong tự dựng (tube: ống có bán
  kính đổi dần theo một đường 3D).
- Phần động đăng ký vào `D.anims` (render/deep/kit3d.js), `render/deep3d.js` gọi mỗi khung hình.
- Mỗi phế tích, mỗi phần hầm bắt đầu dãy ngẫu nhiên riêng (`D.reseed`): sửa phế tích này không làm đổi hình phế tích khác.
  Lần đổi này làm các chi tiết ngẫu nhiên nhỏ của hai phế tích kia và đường hầm xê dịch một lần (đá vụn, độ nghiêng, chỗ rong).

## 2. Số đo

- Đáy bể khoảng 304 nghìn tam giác (trước 235 nghìn). Máy thử, nhìn từ trên: 45,7 ms một khung so với 41,5 ms khi ẩn đáy bể.
- 93 bài kiểm thử đạt; lặn đủ chín điểm, không lỗi trang.
- Chưa đo trên điện thoại thật.
