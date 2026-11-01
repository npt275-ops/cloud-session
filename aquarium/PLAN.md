# Bể Kính — Kế hoạch xây dựng

Giao diện đã chốt: **thành phố tưởng tượng 3D low-poly trên hòn đảo bay trong bể kính** (`index.html`).
Thành phố là nhân vật chính; kinh tế chạy ngầm và hiện ra bằng hình ảnh, không bằng bảng số liệu.

Ngân sách là ước tính trên credit còn lại. Số thật xem ở đồng hồ "Cloud session credits";
đối chiếu sau mỗi bước rồi điều chỉnh các bước sau.

| # | Bước | Kết quả | Trạng thái |
|---|---|---|---|
| 1 | **Kinh tế sống** | Thất nghiệp tự nhiên, chu kỳ bùng nổ và suy thoái, phá sản và khởi nghiệp, giàu nghèo, lạm phát vừa phải. Có test khoá các đặc tính này. | Xong |
| 2 | **Bàn tay chính sách trong 3D** | Rắc tiền (mưa đồng xu), lãi suất, thuế, lương tối thiểu; phản hồi 3D và thông báo hệ quả. | Xong |
| 3 | **Xây dựng** | Đảo quy hoạch lại (82 lô nhà, 11 lô trang trại, 15 lô xưởng); xây nhà, cối xay, xưởng. | Xong |
| 4 | **Hiện tượng tự nhiên** | Bốn mùa, mưa, tuyết, hạn hán, lễ hội đèn lồng, khủng hoảng niềm tin. Có test cho từng tác động. | Xong |
| 5 | **Hoàn thiện** | Âm thanh tự sinh, tự điều chỉnh chất lượng, màn chào, chú giải, phím Esc, dọn dẹp, README. | Xong |

## Kết quả cân chỉnh kinh tế (6 thành phố × 2.000 ngày, sau Bước 4)

| Chỉ số | Ban đầu | Cuối cùng |
|---|---|---|
| Thất nghiệp trung bình | 0,5–1,3% (gần như luôn 0) | 3,4–4,6%, suy thoái lên 33–41% rồi hồi phục |
| Lạm phát | ~10%/năm, có thành phố 20% | 4,4–7,8%/năm trên 8 thành phố |
| Doanh nghiệp phá sản | 1–6 | 17–24, có khởi nghiệp thay thế |
| Gini | 0,08 | 0,28–0,37 |
| Hộ thiếu ăn mỗi ngày | ~5, mùa đông và hạn hán có nạn đói | 1,9–5,2; mùa thu 0,5, mùa hạ 4,8 |

Những lỗi mô hình tìm ra và sửa trong quá trình: tiền từ khoản vay vỡ nợ ở lại lưu thông mãi mãi (gây lạm phát),
ngành lương thực có thể chết hẳn khi lượt thay thế bị mất, tuyển dụng không tính thời tiết, người dân chịu đói
khi 3 sạp ngẫu nhiên hết hàng dù sạp khác còn, đảo chỉ chứa được 4 xưởng nên có xưởng "vô hình".
Chạy `node tools/calibrate.js` để đo lại.

## Nguyên tắc
- Mỗi bước kết thúc bằng một phiên bản chạy được, publish lên cùng link.
- Lõi mô phỏng luôn có test; bất biến quan trọng nhất là bảo toàn tiền trong sổ cái.
- Ý tưởng mới đi vào hàng chờ, không mở rộng phạm vi giữa chừng.

## Hướng mới: sáu miền đất, sáu thời đại

| Phần | Kết quả | Trạng thái |
|---|---|---|
| Lõi thế giới | Sáu thành phố trên sáu địa hình, định cư lần lượt, buôn bán và học hỏi qua cầu, sáu thời đại, chương năm chung. Có test. | Xong |
| Sáu miền 3D | Địa hình riêng, công trình và cầu theo thời đại, xây lại dần khi sang thời mới, cư dân, đoàn hàng qua cầu | Xong |
| Câu chuyện nhiều miền | Mỗi miền một lớp hình ảnh, một người dẫn chuyện chung; công cụ dùng được ở mọi miền | Xong |
| Hoàn thiện | Đoàn người di cư qua cầu, cân chỉnh kinh tế thời nguyên thủy, hiệu năng | Đang làm |
