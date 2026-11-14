# Bước 31 · Hướng đi mới: Phù thủy nhập hồn (phân tích và chọn phương pháp)

Đầu vào là cuộc hội thoại người chơi gửi (tệp .docx). Tóm tắt hướng đi:
- người chơi nhập hồn vào một NPC ngẫu nhiên, mang phép thời gian;
- tìm sách phép để mở thêm kỹ năng: hố đen, điều khiển đất (nâng cao gấp 6), điều khiển nước (sóng thần, bơi nhanh);
- có "cú lao nhập hồn" từ góc nhìn thượng đế xuống thân NPC, đồ hoạ "lột xác" khi nhìn gần;
- NPC già chết thì nhập sang một đứa trẻ mới.

Bản hội thoại đề xuất kỹ thuật cho Unity hay Unreal (ray tracing, global illumination, PBR kèm normal map, mô hình high-poly
thay thế). Bể Kính chạy bằng three.js r128 trong trình duyệt, cả trên điện thoại (render/perf3d.js điều tốc nhắm 60 khung
hình mỗi giây), không có ảnh vẽ tay hay mô hình dựng sẵn: mọi hình đều dựng bằng code. Vì vậy mỗi đề xuất dưới đây được xét
lại theo ba câu hỏi: làm được trên WebGL không, điện thoại chạy nổi không, có dùng lại được phần đã có không.

## 1. Chọn và bỏ: tóm tắt

| Đề xuất | Chọn | Cách làm trong Bể Kính |
|---|---|---|
| Cú lao nhập hồn: tăng tốc, rung, sóng chấn động | Có | Máy quay bay (ui/camera-fly.js) thêm đường cong tăng tốc, nới góc nhìn, rung |
| Mờ chuyển động (motion blur) thật | Không | Thay bằng mờ toả tâm (radial blur) một lượt vẽ, rẻ hơn nhiều |
| Tách màu viền (chromatic aberration) | Có | Cùng lượt vẽ hậu kỳ với mờ toả tâm |
| Làm mờ hậu cảnh (depth of field) | Có, chỉ khi nhập hồn | Một lượt vẽ đọc ảnh độ sâu; tắt ở góc nhìn thượng đế |
| Đổi đồ hoạ: PBR, normal map | Một phần | Bóng mịn (smooth shading) và chất liệu riêng cho vùng gần; không dùng ảnh normal map |
| Ray tracing, global illumination | Không | WebGL không có; thay bằng đèn điểm ấm gần mặt, sương gần, bóng mềm |
| Đổi sang mô hình high-poly | Không theo nghĩa đen | Không có mô hình dựng sẵn; thay bằng chi tiết gần dựng bằng code (mục 3) |
| Tua thời gian | Có | Nhảy về mốc đã lưu (logic/save.js), không tua liên tục |
| Dừng thời gian | Có, đã gần như có sẵn | G.time.tps = 0 cộng hiệu ứng đóng băng |
| Điều khiển đất (nâng cao gấp 6) | Có | Thêm một lớp nâng vào lưới độ cao đảo (render/map/height3d.js) |
| Điều khiển nước (sóng thần, bơi nhanh) | Có | Thêm một con sóng vòng vào shader biển (sea3d.js) và phía máy |
| Hố đen | Có, chia hai giai đoạn | Giai đoạn đầu hút vật và người; hút cả đảo để làm sau |
| Điều khiển lửa | Có | Nối vào hệ thống cháy, đổ nát sẵn có |
| Particle system | Có, làm thành một bộ dùng chung | Một bộ hạt GPU cho lửa, bụi, bọt nước, mảnh vụn, vệt gió |
| Parallax scrolling | Hạn chế | Kỹ thuật 2D; trong 3D chỉ dùng cho các lớp mây khi lao xuống và trang sách phép |
| Hồi chiêu, năng lượng | Có, dùng lại | Niềm tin W.faith (logic/powers.js) làm năng lượng phép |
| Nhập sang đứa trẻ khi NPC chết | Có | logic/family.js đã có con cái |

## 2. Cú lao nhập hồn

Thứ tự trong khoảng 2,5 giây:

1. **Khựng (0,4 giây).** Máy quay lùi lên một chút lấy đà. Tiếng gió hút vào, mọi âm khác tắt.
2. **Lao (1,4 giây).** Đường cong tăng tốc theo hàm mũ.
   - Góc nhìn nới từ 45 lên 95 độ ở giữa đường rồi thu về: cảm giác tốc độ mạnh nhất mà không tốn gì.
   - Vệt gió là các hạt dài bay ngược chiều lao.
   - Qua lớp mây: mây (clouds3d.js) lướt qua theo ba lớp với tốc độ khác nhau. Đây là chỗ duy nhất "parallax" có giá trị.
   - Mờ toả tâm và tách màu tăng dần theo tốc độ.
3. **Xuyên vòm kính.** Lúc qua vòm (render/tank3d.js), một vệt nứt sáng chớp lên rồi tan, như chạm mặt nước.
4. **Chạm (0,2 giây).**
   - Rung màn hình.
   - Tiếng ù như lặn sâu (audio.js).
   - Vòng sóng chấn động: một vòng hạt bụi toả ra trên mặt đất quanh NPC.
5. **Mở mắt (1 giây).**
   - Màn hình mờ và tối viền, rồi nét dần.
   - Đồ hoạ đổi sang chế độ gần (mục 3).
   - Máy quay đặt sau vai NPC, ngang tầm mắt.

Góc nhìn sau vai, không dùng góc nhìn thứ nhất: thân NPC tròn kiểu hoạt hình đã đẹp (render/rig3d.js), nhìn từ sau vai thì
thấy được nhân vật mình, lại che bớt chỗ thô ở xa.

Đo chất lượng:
- quay lại cú lao trên trình duyệt không giao diện, khung hình nào cũng không dưới 30 khung mỗi giây trên cấu hình thấp
  (perf3d lowEnd);
- chụp ảnh từng pha.

## 3. Đổi đồ hoạ sau khi nhập hồn

Không dựng lại đồ hoạ từ đầu. Góc nhìn thượng đế giữ nguyên low-poly diorama. Khi nhập hồn, chỉ vùng quanh NPC (bán kính
khoảng 15) đổi theo bốn lớp:

1. **Ánh sáng và màu (rẻ nhất, hiệu quả nhất).**
   - Một đèn điểm ấm gần mặt NPC.
   - Sương kéo gần lại để giấu chỗ thô ở xa.
   - Đổi bảng màu: đậm hơn, tương phản hơn, vùng tối hơi xanh, vùng sáng hơi vàng.
   - Quầng sáng (bloom) cho lửa, đèn, neon.
   - Hệ thống cũ (render/look3d.js, render/mood3d.js) đã có chỗ cài vào shader.
2. **Hậu kỳ.**
   - Làm mờ hậu cảnh.
   - Tối viền.
   - Hạt nhiễu phim rất nhẹ.
   - Ba hiệu ứng gộp thành một lượt vẽ, tự viết. Lớp EffectComposer của three.js không có sẵn trong vendor/, và tự viết thì
     điều tốc được theo perf3d.
3. **Chi tiết gần dựng bằng code** (LOD ngược, chỉ quanh NPC đang nhập hồn):
   - cỏ, sỏi, hoa vẽ hàng loạt (instanced);
   - mặt đất bóng mịn thay vì mặt phẳng gãy khúc;
   - NPC đang nhập hồn có mắt, lông mày, nếp áo.
   Lưu ý: người chơi đã yêu cầu bỏ cỏ ở bước 27. Lớp này chỉ hiện khi đang nhập hồn và chỉ trong bán kính gần, cần người
   chơi xác nhận.
4. **Không làm:**
   - ray tracing;
   - global illumination thật;
   - ảnh normal map;
   - mô hình high-poly thay thế.
   Lý do: WebGL không có, hay không có tài sản vẽ sẵn. Điện thoại không gánh nổi.

Lý giải trong truyện, giữ như bản hội thoại: mắt phù thủy thấy "chất thực tại" của thế giới.

## 4. Phép thuật

Năng lượng phép dùng lại niềm tin W.faith (logic/powers.js đã có cách dâng, giá, đảo được ban ơn hay bị trừng phạt). Mỗi
phép có giá và thời gian hồi.

| Phép | Mở bằng | Cách làm | Ảnh hưởng tới logic |
|---|---|---|---|
| Dừng thời gian | Có từ đầu | tps = 0. Hiệu ứng: màu nhạt, bụi lơ lửng đứng yên, tiếng tích tắc | Không |
| Tua nhanh | Có từ đầu | tps cao, đã có | Không |
| Tua lại | Có từ đầu | Vòng mốc lưu (logic/save.js) mỗi mùa; tua lại là nạp mốc. Hiệu ứng: hình chạy ngược, sọc quét | Lịch sử chạy lại y hệt nếu không can thiệp, nên người chơi có thể sửa sai |
| Lửa | Sách thứ nhất | Quả cầu lửa, hạt lửa, cháy lan | Nối vào hệ thống cháy, đổ nát (logic/siege.js, render/build/ruins3d.js) |
| Đất | Sách Địa chất | Lớp nâng trong lưới độ cao, mọc dần trong 2–3 giây, tối đa gấp 6 mặt đất. Công trình, người, cây trên đó nâng theo; máy quay hất từ dưới lên | Chặn đường quân (logic/war.js đi qua cầu, cổng) |
| Nước | Sách Đại dương | Thêm một con sóng vòng chạy từ một điểm vào shader biển và hàm heightAt phía máy (thuyền nổi theo); dưới nước bơi nhanh | Công trình ven bờ hư hại |
| Hố đen | Sách Không gian | Quả cầu đen lớn dần, làm méo ảnh quanh nó (một lượt vẽ). Vật nhỏ hơn hố bị hút theo thứ tự cỡ: cây, người, nhà | Người chết, công trình mất |

Hút cả đảo là thay đổi lớn nhất: cả game giả định có sáu đảo (chiến tranh, ngoại giao, cầu, thời đại). Đề xuất:
- giai đoạn đầu chỉ hút vật và người;
- hút cả đảo làm sau, như phép cuối game: đảo bị hút thì trống rồi mọc lại từ đầu, dùng lại cơ chế làm lại đảo đã có (bước 25).

Sách phép đặt ở:
- ba phế tích đáy bể (render/deep3d.js);
- di tích trên đảo.
Người canh hầm và người đuôi cát đã có nên việc lấy sách có thử thách sẵn.

## 5. Bộ hạt dùng chung (particle system)

Hiện mỗi phần tự làm hạt riêng: tuyết, khói, bọt sóng trong shader, mảnh nổ.

Làm một bộ render/fx/particles3d.js:
- một khối Points lớn, vị trí và tuổi tính trong shader, vòng đệm có giới hạn;
- mỗi nguồn phát chỉ ghi vài số: chỗ, hướng, màu, cỡ, tuổi, trọng lực, gió;
- dùng cho lửa, khói, bụi đất, bọt nước, mảnh vụn bị hút, vệt gió khi lao, vòng chấn động;
- giới hạn số hạt theo perf3d (điện thoại ít hạt hơn).

Các hạt cũ chuyển dần sang bộ mới, chuyển cái nào xoá code cũ cái đó (không để hai đường cùng làm một việc).

## 6. Parallax scrolling

Trong cảnh 3D, máy quay di chuyển thì vật gần trôi nhanh hơn vật xa: parallax đã có sẵn, không cần làm thêm. Kỹ thuật này
chỉ đáng dùng ở hai chỗ:
- ba lớp mây khi lao xuống (mục 2);
- trang sách phép (giao diện 2D): lớp hình vẽ, lớp chữ, lớp bụi sáng trôi lệch nhau khi lật trang.
Không dùng cho cảnh chính.

## 7. Thứ tự làm đề xuất

Mỗi bước chơi được ngay và có phép đo riêng:

1. **Nhập hồn tối thiểu.**
   - Chọn NPC, máy quay sau vai, điều khiển đi lại bằng phím.
   - NPC đó thôi tự đi theo logic.
   - Thoát ra thì về góc nhìn thượng đế.
2. **Cú lao.** Đường bay, góc nhìn, rung, vệt gió, xuyên vòm, lượt vẽ hậu kỳ gộp.
3. **Đồ hoạ gần.** Ánh sáng, màu, làm mờ hậu cảnh, quầng sáng; rồi chi tiết gần.
4. **Phép thời gian.** Dừng, tua nhanh, tua lại theo mốc; năng lượng niềm tin.
5. **Bộ hạt dùng chung.** Chuyển lửa và khói cũ sang.
6. **Lửa, đất, nước.** Lần lượt, mỗi phép một bước.
7. **Sách phép.** Đặt sách, nhặt sách, mở phép.
8. **Hố đen.** Hút vật và người; hút cả đảo để sau cùng.
9. **Luân hồi.** NPC chết thì chọn đứa trẻ để nhập tiếp.

## 8. Rủi ro

- **Hiệu năng điện thoại.** Mọi lượt vẽ hậu kỳ đều qua perf3d; tụt khung thì tắt dần theo thứ tự: làm mờ hậu cảnh, quầng
  sáng, hạt.
- **Nhập hồn phá vỡ logic.** NPC do người chơi điều khiển phải có trạng thái riêng trong logic: không bị giao việc, không bị
  tính đứng không.
- **Tua lại tốn bộ nhớ.** Mỗi mốc là một bản lưu JSON. Cần đo cỡ bản lưu trước khi chọn số mốc.
- **Hố đen hút cả đảo.** Chạm vào hầu hết hệ thống logic; để cuối.
