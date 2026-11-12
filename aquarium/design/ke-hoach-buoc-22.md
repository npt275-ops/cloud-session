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

## 3. Thêm kiến trúc (người chơi yêu cầu: nhiều công trình hơn nữa)

- Kiểu mới: tháp ốc gai (thân thoi xoắn, hai hàng gai ở vai, khe miệng sáng), tháp cầu thang xoắn (bậc đá xoắn ba vòng quanh
  cột, đèn vòm), cầu dẫn nước (trụ, vòm, máng có dòng nước sáng), nhà hát vỏ sò (năm bậc ghế quay về một sò quạt), nhà sò ngọc
  trai (hai mảnh vỏ mở, ngọc sáng), nhà nhím biển (khối tím có gai), cột ốc vặn quanh quảng trường.
- Đặt chỗ: công trình lớn chọn chỗ trống xa mọi công trình đã có nhất (thử 500 điểm), đặt trước nhà nhỏ; nhà hát chọn ngay
  sau vỏ chính và quảng trường. Nhà nhỏ cỡ 1,8–4,4, được sát mép rãnh và sát đường hơn, tối đa 120.
- Đếm thật (render/deep3d.js `citadel`): ốc xoắn phẳng 20 (vỏ chính, sảnh, nhà), ốc vặn tháp 11, sò quạt 4, nhà hát 1, tháp
  cầu thang 4, ốc gai 8, đoạn cầu dẫn nước 2, sò ngọc trai 9, ốc tiền 7, nhím biển 14, vòm bong bóng 11, tháp nấm 10, vòm vỡ
  14; cùng tháp pha lê, quảng trường, cổng xương sườn, vòng quay, đảo lơ lửng. Tổng khoảng 130 công trình.
- Đáy bể khoảng 340 nghìn tam giác. Máy thử, nhìn từ trên: 53,1 ms một khung so với 47,8 ms khi ẩn đáy bể.
- Cầu dẫn nước chỉ còn 2 đoạn (đoạn nào vướng công trình hay đường thì bỏ).
