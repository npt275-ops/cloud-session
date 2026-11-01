# Bể Kính

Một thành phố nhỏ trên hòn đảo bay, đặt trong một chiếc bể kính. 140 gia đình đi làm, mua bán, vay nợ,
ăn Tết. Mọi thứ nhìn thấy trên đảo đều sinh ra từ một nền kinh tế mô phỏng thật bên dưới.

## Chạy

Trang cần được phục vụ qua HTTP (vì tải `sim.js`, `audio.js` cùng thư mục):

```bash
cd aquarium && python3 -m http.server 8000
```

Rồi mở `http://localhost:8000`. Thư viện 3D (three.js r128) tải từ CDN.

## Cấu trúc

| File | Vai trò |
|---|---|
| `index.html` | Thế giới 3D, giao diện, chính sách, xây dựng, hiện tượng, màn chào, chú giải |
| `sim.js` | Lõi kinh tế: tất định theo seed, không phụ thuộc trình duyệt, chạy được bằng Node |
| `audio.js` | Âm thanh tự sinh bằng Web Audio, không dùng file âm thanh |
| `test/sim.test.js` | 12 bài kiểm thử cho lõi kinh tế |
| `tools/calibrate.js` | Đo "độ sống" của nền kinh tế trên nhiều thành phố |
| `archive/` | Các bản đề xuất giao diện trước khi chốt 3D |

## Lõi kinh tế

- **Hộ gia đình** có tay nghề khác nhau, đi làm, mua lương thực trước rồi mới đến hàng hoá, tiết kiệm phòng thân,
  tiêu dùng có điểm bão hoà, người giàu tiêu xa xỉ hơn, đi khắp chợ trước khi chịu đói.
- **Doanh nghiệp** (lương thực, hàng hoá) có chủ sở hữu nhận cổ tức; đặt giá theo tồn kho; tuyển và sa thải theo
  lượng bán được thật (đã tính mùa vụ và thời tiết); tối đa 2 người bị sa thải mỗi ngày; thiếu tiền thì trả lương
  chậm theo tỷ lệ; khởi nghiệp khi ngành đang lãi; phá sản thì trả nợ ngân hàng trước.
- **Ngân hàng** tạo tiền khi cho vay và huỷ tiền khi thu nợ gốc; thu lãi chính sách cộng biên rủi ro; dùng lợi nhuận
  bù nợ xấu (tiền rời khỏi lưu thông); không cho doanh nghiệp đang lỗ vay nhiều.
- **Nhà nước** thu thuế thu nhập, trợ cấp người thất nghiệp, có thể in tiền.
- **Sổ cái**: tổng tiền luôn bằng `ban đầu + tiền in + tiền nhập cư + tiền tạo bởi cho vay − trả gốc − tiền hấp thụ bù nợ xấu`.
  Bất biến này được kiểm tra trong test ở mọi bước.

### Hiện tượng

| Hiện tượng | Tác động kinh tế | Hình ảnh |
|---|---|---|
| Bốn mùa (năm 360 ngày) | Lương thực: thu +12%, đông −10% | Cỏ, cây, mái nhà, sông đổi màu |
| Mưa, tuyết | Không | Hạt mưa, bông tuyết, trời xám |
| Hạn hán (có thể mỗi mùa hạ) | Lương thực −35% trong 30–55 ngày | Cỏ cháy vàng, thác gầy, trời oi |
| Lễ hội đèn lồng (15 ngày cuối năm) | Người dân mua sắm nhiều hơn | Đèn trời, cờ đuôi nheo, pháo hoa |
| Khủng hoảng niềm tin (khi nợ xấu tăng vọt) | Ngân hàng chỉ cho doanh nghiệp lành mạnh vay | Đám đông trước Kho Bạc |

### Kết quả cân chỉnh (6 thành phố × 2.000 ngày)

Thất nghiệp trung bình 3,4–4,6%, suy thoái có lúc lên 33–41% rồi tự hồi phục; lạm phát 4,4–7,8%/năm (đo trên
8 thành phố, từ ngày 200); Gini 0,28–0,37; trung bình 1,9–5,2 hộ thiếu ăn mỗi ngày (mùa thu 0,5, mùa hạ có hạn hán 4,8);
17–24 doanh nghiệp phá sản và có khởi nghiệp thay thế.

```bash
node --test                  # 12 bài kiểm thử (chạy trong thư mục aquarium)
node tools/calibrate.js 2000 # đo lại các chỉ số vĩ mô
```

## Giao diện

- **Chính sách**: rắc 10.000 xu (mưa đồng xu vàng), lãi suất (quả cầu Kho Bạc đổi màu), thuế, lương tối thiểu.
  Sau vài tuần, thành phố báo lại hệ quả thật.
- **Xây dựng**: nhà ở (4 gia đình mới chuyển đến), cối xay gió, xưởng thủ công, trên 82 lô nhà, 11 lô trang trại,
  15 lô xưởng.
- **Chú giải** (nút `?`): ý nghĩa của khói bếp, cửa sổ sáng, màu ruộng, quả cầu, đốm sáng dòng tiền.
- **Âm thanh**: gió, mưa, chim, dế, hộp nhạc ngũ cung, đồng xu, khởi công, pháo hoa. Mặc định tắt.
- **Hiệu năng**: tự giảm độ phân giải rồi tắt bóng đổ khi máy chạy chậm; điện thoại khởi đầu ở mức nhẹ hơn.
- **Phím tắt**: `Esc` đóng bảng đang mở.
