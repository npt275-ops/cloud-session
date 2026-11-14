# Bước 34 · Sáu điểm nhân vật và giảm cháy sáng

Người chơi chốt hướng "thế giới đồ chơi thu nhỏ" (bước 33, render/style/diorama3d.js) và yêu cầu làm bản thật với 6 điểm
nhân vật đã giữ, đồng thời giảm sáng: màu dịu ("chill"), không cháy sáng, nhất là lúc 12 giờ trưa.

## 1. Giảm cháy sáng

| Việc | Tệp | Nội dung |
|---|---|---|
| Nén mềm vùng sáng | render/mood3d.js (TONE), render/scene3d.js | Cách nén màu mới `soft`: dưới ngưỡng 0,7 giữ nguyên (màu đậm như cũ), trên ngưỡng cong mềm về trắng theo kênh sáng nhất (giữ sắc màu, không bị cắt trắng như cách cũ `linear`, không nhạt màu như ACES) |
| Hạ nắng trưa | render/mood3d.js (KEYS) | Độ nắng các mốc 9 giờ 36, 12 giờ, 15 giờ 22: 1,0 → 0,9; 1,05 → 0,92; 0,95 → 0,88 |

Đo bằng ảnh chụp lúc 12 giờ (tỉ lệ điểm ảnh có kênh sáng nhất từ 250 trở lên):

| Cảnh | Trước | Sau |
|---|---|---|
| Nhìn gần đảo từ trên cao | 1,33% | 0% |
| Nhập hồn, nhìn ngang | 0% (2,35% sáng từ 235) | 0% (0% từ 235) |

## 2. Sáu điểm nhân vật (thân mềm: nhân vật mình và người gần)

| Điểm | Tệp | Nội dung |
|---|---|---|
| 1. Biểu cảm | render/body/face3d.js | Mắt mở, nheo, trợn, chớp mắt; lông mày nâng, hạ, nghiêng; bốn kiểu miệng (thẳng, cười, mếu, há); má hồng khi vui. Theo f.expr, f.closed của làng (render/village3d.js). Không dựng lại lưới: mỗi đỉnh mang mã bộ phận và tâm khối, shader co giãn quanh tâm theo vài số riêng của từng người. Viền nét bỏ qua mắt, miệng |
| 2. Tỉ lệ tuổi | render/body/traits3d.js, render/village3d.js | Em bé đầu to 1,42 lần, mắt to, không lông mày, một lọn tóc; trẻ con đầu 1,24 lần; thiếu niên 1,08 lần; người già mắt nhỏ hơn, mũi to hơn, phần lớn nam có râu, 40% nam hói; từ 62 tuổi hơi còng lưng (cả thân cũ). Sang lứa tuổi mới thì dựng lại thân |
| 3. Nét riêng | render/body/traits3d.js, face3d.js | Tính từ mã người (cùng người luôn cùng nét): dáng gầy, đầy đặn, bụng tròn; cỡ mắt, khoảng cách mắt, cỡ mũi, tai, miệng, độ dày lông mày; tàn nhang; kiểu tóc (ngắn trùm, mái, dựng, búi, đuôi ngựa, dài, hói), hợp với tóc của thân cũ ở xa |
| 4. Bóng chân và da | render/body/feet3d.js, face3d.js | Vệt bóng tiếp đất dưới từng bàn chân, nhỏ và nhạt khi nhấc chân (một lượt vẽ cho mọi người); da ấm như ánh sáng xuyên qua da |
| 5. Nén giãn | render/body/motion3d.js, render/village3d.js | Bay lên kéo dài theo tốc độ dọc, chạm đất nén bẹt (có cú đẩy lò xo: máy chậm vẫn thấy), mỗi bước nhún nhẹ, nảy lại như đồ chơi cao su; giữ gần đúng thể tích. Lò xo chia bước nhỏ nên ổn định ở máy chậm |
| 6. Chi tiết | face3d.js, softbody3d.js | Mũi, tai, lông mày, đốm sáng mắt, râu, ria; tóc có sợi; cổ áo, thắt lưng, ngón cái, đế giày sáng màu |

Mỗi người một vật liệu (biểu cảm riêng) nhưng chung một chương trình shader; số lượt vẽ không đổi (hai lượt mỗi người, thêm
một lượt cho mọi vệt bóng chân).

Kiểm thử: test/traits3d.test.js (nét cố định theo người, tỉ lệ theo tuổi, đủ kiểu tóc, râu, hói), test/motion3d.test.js
(nén giãn khi nhảy ở 60 và 10 khung hình mỗi giây).

## 3. Còn để sau

- Nén giãn mới có ở nhân vật mình (người có f.motion); người gần chưa có.
- Cảnh vật theo ảnh tham khảo người chơi gửi: hoa, chim, suối có cá, thớ gỗ và vải, bóng mềm ở khe (bước 3 của hướng đồ chơi
  thu nhỏ).
