# Bước 33 · Phương án nâng cấp cử động và nét vẽ nhân vật sau khi nhập hồn (đề xuất, chưa làm)

Người chơi nhận xét: sau khi nhập hồn, cử động của nhân vật xấu, không mượt; muốn nét vẽ khác hẳn low-poly hiện tại. Hướng đã
chốt ở bước 32: "đồ chơi mềm, bo tròn", vẽ kỹ cho nhân vật mình và người ở gần.

## 1. Vì sao cử động hiện tại xấu

Đã đọc render/anim3d.js, render/village3d.js:

1. **Bật tắt cứng.**
   - Bấm phím là đi ngay đủ tốc độ, nhả phím là đứng ngay: không có tăng tốc, không có hãm.
   - Quay người với tốc độ đều (turnTo), không nghiêng người khi rẽ.
2. **Chân trượt.**
   - Bước chân là một hàm sin cố định: chân đung đưa, không có lúc bàn chân đứng yên bám đất.
   - Đi nhanh, chạy, dốc thì thấy chân lướt trên mặt đất.
   - Thân chỉ nhún theo sin.
3. **Mọi thứ khoá cứng vào thân.**
   - Đầu, tay, tóc, vạt áo, đồ cầm tay không trễ, không nảy.
   - Nhìn như rối gỗ.
4. **Nhảy chỉ là nâng cả người lên** (bước 32): không có lấy đà, không co chân, không khuỵu gối lúc tiếp đất.
5. **Thân người ghép từ các khối rời** (render/rig3d.js): khớp hở, tay chân mảnh. Thân này được dựng để vẽ hàng trăm người
   cùng lúc thật rẻ, không phải để nhìn gần.

## 2. Phương án cử động: render/body/motion3d.js (tệp mới, riêng cho nhân vật mình và người gần)

| Lớp | Nội dung |
|---|---|
| Di chuyển | Vận tốc tăng dần và hãm dần (lò xo); quay người theo lò xo; nghiêng vào trong khi rẽ; ngả tới khi tăng tốc, ngả sau khi phanh |
| Bước chân bám đất | Mỗi bàn chân có pha đứng (đặt đúng mặt đất, kể cả dốc, bằng bộ tay chân với tới sẵn có render/ik3d.js) và pha bước (nhấc theo vòng cung). Độ dài, nhịp bước theo tốc độ: đi và chạy trộn mềm theo tốc độ, không đổi bậc. Hông nhún hai lần mỗi chu kỳ, lắc hông, vai xoay ngược hông |
| Chuyển động phụ | Lò xo cho đầu, hai tay, tóc, vạt áo, đồ cầm tay: theo sau thân một nhịp rồi nảy lại |
| Nhảy | Ba pha: nhún lấy đà (0,08 giây), bay (co gối, tay dang), tiếp đất (khuỵu gối, thân nén rồi bật lại) |
| Đứng | Thở, dồn trọng tâm sang một chân, liếc nhìn người đi ngang, đầu quay trước khi thân rẽ |

## 3. Phương án nét vẽ: "đồ chơi mềm" khác hẳn low-poly

1. **Thân liền một khối, có xương** (render/body/softbody3d.js).
   - Dựng bằng code lúc tải trang: ghép các khối tròn (đầu, thân, tay, chân, bàn tay, bàn chân) thành một hình liền nhẵn.
   - Hình được biến thành lưới mịn khoảng 2.500 tam giác, rồi gắn xương theo khoảng cách (SkinnedMesh của three.js).
   - Không cần mô hình hay ảnh từ ngoài.
   - Tỉ lệ đồ chơi: đầu to bằng chừng một phần ba người, tay chân dày, bàn tay tròn, bàn chân to.
   - Khớp không còn hở.
2. **Quần áo** là lớp vỏ phồng ra quanh thân, màu và kiểu lấy từ render/outfits3d.js: 12 thời, các nhóm vẫn giữ nguyên.
3. **Mặt.**
   - Mắt to có đốm sáng, chớp mắt.
   - Má hồng.
   - Miệng theo biểu cảm sẵn có (EXPR của village3d).
   - Vẽ trên một ảnh nhỏ tạo bằng canvas lúc tải.
4. **Chất liệu.**
   - Sáng tối chia nấc mềm như tranh vẽ.
   - Viền sáng quanh người (rim light).
   - Da ấm ở rìa như có tán xạ.
   - Vải có thớ vẽ trong shader.
   - Không bóng nhựa.
5. **Viền nét mảnh quanh nhân vật gần.**
   - Điểm làm cảm giác "vẽ tay", khác hẳn low-poly nhất.
   - Cũng là thay đổi phong cách mạnh nhất, nên cần người chơi quyết.

Hai mức chi tiết:
- Người ở xa giữ thân hiện tại (rẻ, cả làng một vài lượt vẽ).
- Tối đa 15 người gần nhất trong bán kính chừng 20 đổi sang thân mềm, chuyển dần khi lại gần.
- Nhân vật mình luôn là thân mềm.
- Điện thoại hạ xuống 6 người gần.

## 4. Thứ tự làm, mỗi bước một lần duyệt

1. Cử động mới cho nhân vật mình, vẫn trên thân cũ: thấy ngay khác biệt về độ mượt.
2. Thân mềm cho riêng nhân vật mình. Duyệt ảnh từ nhiều góc, nhiều tư thế trước khi làm tiếp: chỗ gập khớp là rủi ro lớn nhất
   của cách dựng tự động.
3. Mặt, chất liệu, viền nét.
4. Mở rộng sang người gần, hai mức chi tiết; đo khung hình trên máy thật.

## 5. Cần người chơi quyết

1. Có viền nét mảnh quanh nhân vật (kiểu tranh vẽ) không?
2. Sáng tối: chia nấc như hoạt hình, hay chuyển mềm liên tục như đồ chơi nhựa mờ ở ảnh 1?
3. Bắt đầu từ bước 1 (cử động) như đề xuất?
