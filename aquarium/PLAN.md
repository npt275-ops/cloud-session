# Bể Kính — Kế hoạch xây dựng

Giao diện đã chốt: **thành phố tưởng tượng 3D low-poly trên hòn đảo bay trong bể kính** (`glass.html`).
Thành phố là nhân vật chính; kinh tế chạy ngầm và hiện ra bằng hình ảnh, không bằng bảng số liệu.

Ngân sách là ước tính trên credit còn lại. Số thật xem ở đồng hồ "Cloud session credits";
đối chiếu sau mỗi bước rồi điều chỉnh các bước sau.

| # | Bước | Kết quả | Trạng thái |
|---|---|---|---|
| 1 | **Kinh tế sống** | Thất nghiệp tự nhiên, chu kỳ bùng nổ và suy thoái, phá sản và khởi nghiệp, giàu nghèo, lạm phát vừa phải. Có test khoá các đặc tính này. | Xong |
| 2 | **Bàn tay chính sách trong 3D** | In tiền (vàng rơi từ trời), lãi suất, thuế, với phản hồi bằng hình ảnh. | |
| 3 | **Xây dựng** | Bấm lô đất trống để xây nhà, xưởng, cối xay. Thành phố lớn dần. | |
| 4 | **Hiện tượng tự nhiên** | Mưa, hạn hán, lễ hội đèn lồng, đám đông trước kho bạc. Hình ảnh, không thẻ bắt chọn. | |
| 5 | **Hoàn thiện** | Hiệu năng điện thoại, âm thanh, trang chính, dọn bản đề xuất cũ. | |

## Kết quả cân chỉnh kinh tế (Bước 1, 6 seed × 2.000 ngày)

| Chỉ số | Trước | Sau |
|---|---|---|
| Thất nghiệp trung bình | 0,5–1,3% | 2,2–3,1%, suy thoái lên 25–30% rồi hồi phục |
| Lạm phát | ~10%/năm | ~4–8%/năm |
| Doanh nghiệp phá sản | 1–6 | 6–13 |
| Gini | 0,08 | 0,33–0,42 |

Cơ chế thêm vào lõi: tay nghề khác nhau, chủ sở hữu nhận cổ tức, tiết kiệm phòng thân,
tiêu dùng bão hoà và tiêu xa xỉ theo tài sản, tuyển và sa thải theo cầu thực, lương chỉ tăng khi lao động khan hiếm,
khởi nghiệp theo lợi nhuận. Chạy `node tools/calibrate.js` để đo lại.

## Nguyên tắc
- Mỗi bước kết thúc bằng một phiên bản chạy được, publish lên cùng link.
- Lõi mô phỏng luôn có test; bất biến quan trọng nhất là bảo toàn tiền trong sổ cái.
- Ý tưởng mới đi vào hàng chờ, không mở rộng phạm vi giữa chừng.
