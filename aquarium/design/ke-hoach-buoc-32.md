# Bước 32 · Kế hoạch cú nhập hồn

Phương án đã chốt ở design/ke-hoach-buoc-31.md. Bước này là việc đầu tiên và quan trọng nhất: cú lao từ góc nhìn thượng đế
xuống thân một NPC, đồ hoạ đổi theo, và mọi chi tiết quanh khoảnh khắc đó.

Mục tiêu: một cú hích thị giác khiến người chơi thấy ngợp vì độ chân thực. Tài liệu này là kế hoạch, chưa có code.

## 1. "Ngợp vì chân thực" đến từ đâu

Bể Kính không có mô hình hay ảnh vẽ sẵn, nên không thể thắng bằng số đa giác. Cảm giác chân thực khi vừa nhập hồn đến từ
sáu tín hiệu, xếp theo hiệu quả trên công sức:

1. **Tỉ lệ.**
   - Một giây trước, cả hòn đảo nằm gọn trong lòng bàn tay.
   - Một giây sau, máy quay cao 1,5 ngang vai người, nhà chính cao 20–40 sừng sững che trời.
   - Cú đổi tỉ lệ này là phần "ngợp" lớn nhất và gần như không tốn gì.
2. **Không khí.** Sương gần làm vật xa nhạt và ngả lam (phối cảnh khí quyển), bụi lơ lửng trong nắng, hậu cảnh mờ.
3. **Ánh sáng gần.**
   - Bóng nắng sắc nét quanh người: vùng bóng thu từ 70 về 25 thì cùng một tấm bóng nét gấp gần ba lần.
   - Đèn ấm hắt lên mặt.
   - Lửa và đèn có quầng.
4. **Chuyển động nhỏ.** Cỏ lay, khói bếp, vải áo, bụi dưới chân, máy quay nhấp theo nhịp thở.
5. **Âm thanh gần.**
   - Lúc lao: tiếng gió hút, rồi bịt tai.
   - Lúc mở mắt: tiếng làng ập vào (người nói, lửa tí tách, bước chân, nhịp tim).
   - Âm thanh cho một nửa cảm giác "thật".
6. **Thế giới phản ứng.** Người đứng gần giật mình quay lại nhìn; người đang nói ngừng một nhịp.

Chi tiết bề mặt đã có sẵn một phần: render/look3d.js vẽ mạch đá, lớp mái, tường loang, cửa sổ ngay trong shader, và tự mờ
khi nhìn xa. Nhìn gần, các chi tiết này hiện rõ mà không phải làm gì thêm.

## 2. Dòng thời gian cú lao (khoảng 3,6 giây)

| Pha | Thời lượng | Hình | Tiếng | Thế giới |
|---|---|---|---|---|
| 0. Chọn | – | Bấm vào NPC, thẻ người hiện nút "Nhập hồn" | – | – |
| 1. Khựng | 0,4 giây | Máy quay lùi lên 6% lấy đà; viền màn hình tối lại; NPC đích có vòng sáng dưới chân | Mọi tiếng nhỏ dần; tiếng hút gió | Thời gian chậm còn 15% |
| 2. Lao | 1,4 giây | Tăng tốc theo hàm mũ; góc nhìn 34 → 95 độ; mờ toả tâm và tách màu viền tăng theo tốc độ; vệt gió; mây lướt qua ba lớp | Gió rít cao dần | Vẫn chậm |
| 3. Xuyên vòm | trong pha 2 | Lúc qua vòm kính: một vòng nứt sáng chớp 0,15 giây | Tiếng "tinh" như gõ kính | – |
| 4. Chạm | 0,2 giây | Chớp trắng 2 khung hình; rung mạnh; vòng bụi toả trên đất | Một tiếng trầm 40 Hz; ù tai | Người trong bán kính 8 giật mình |
| 5. Mở mắt | 1,2 giây | Tối đen kiểu mí mắt mở dần; ảnh nhoè rồi nét; góc nhìn về 52 độ; máy quay lùi ra sau vai | Tiếng ù tan; tiếng làng ập vào; nhịp tim chậm dần | Thời gian về bình thường |
| 6. Trong thân | – | Đồ hoạ gần bật đủ (mục 4) | Âm thanh gần | Người chơi điều khiển NPC |

- Thoát ra bằng phím Esc hay nút: cú bay ngược lên trong 1,2 giây, không có va chạm, đồ hoạ gần tắt dần.
- Máy bật "giảm chuyển động": bỏ rung, bỏ mờ toả tâm, thay cú lao bằng mờ tối rồi sáng lại.

## 3. Nền móng kỹ thuật

### 3.1. Lượt vẽ hậu kỳ (render/fx/post3d.js, tệp mới)

- Hiện game/loop.js vẽ thẳng ra màn hình (`renderer.render(scene, camera)`). Chỗ này đổi thành `G.post.render()`.
- Mọi hiệu ứng bằng 0 (góc nhìn thượng đế) thì vẽ thẳng như cũ: hình không đổi, không tốn thêm.
- Có hiệu ứng thì:
  1. vẽ cảnh vào một ảnh tạm có kèm ảnh độ sâu;
  2. vẽ một lượt phủ màn hình gộp mọi hiệu ứng.
- Lượt gộp gồm:
  - mờ toả tâm (8 mẫu);
  - tách màu viền;
  - làm mờ hậu cảnh theo độ sâu (10 mẫu);
  - tối viền;
  - chỉnh màu (đậm, tương phản, tối ngả lam, sáng ngả vàng);
  - hạt nhiễu;
  - mí mắt (hai dải tối trên dưới).
- Quầng sáng (bloom): hai lượt phụ ở một phần tư độ nét.
- Khử răng cưa: vẽ vào ảnh tạm thì mất khử răng cưa có sẵn.
  - WebGL2: dùng ảnh tạm nhiều mẫu (three r128 có WebGLMultisampleRenderTarget).
  - Máy không có WebGL2: chấp nhận, vì lúc đó ảnh đang mờ sẵn.
- Máy không có ảnh độ sâu: bỏ làm mờ hậu cảnh, giữ các hiệu ứng còn lại.
- Điều tốc: render/perf3d.js thêm một nấc. Tụt khung thì tắt theo thứ tự: quầng sáng → làm mờ hậu cảnh → hạt nhiễu.

### 3.2. Trạng thái nhập hồn (game/possess.js, tệp mới)

- Một máy trạng thái: nghỉ → khựng → lao → chạm → mở mắt → trong thân → thoát.
- Tệp này giữ dòng thời gian ở mục 2 và ra lệnh cho máy quay, lượt hậu kỳ, hạt, âm thanh.
- Các phần đó không biết về nhau.

### 3.3. NPC do người chơi điều khiển

- **Logic** (logic/brain.js, logic/tasks.js):
  - người đang bị nhập có cờ riêng;
  - không bị giao việc;
  - không bị tính là đứng không hay bỏ việc;
  - vẫn ăn, ngủ, già đi.
  - Có kiểm thử riêng trong test/.
- **Vẽ** (render/village3d.js):
  - thêm `possess(id)` và `release()`;
  - người bị nhập không đi theo đích của bộ não mà theo phím bấm.
- **Đi lại:**
  - vẫn qua render/nav3d.js (clearPt, pushOut, keepInside), nên không đi xuyên nhà, không ra ngoài tường;
  - dùng lại dáng đi, dáng chạy của render/anim3d.js.
- **Điều khiển:**
  - phím mũi tên, W A S D để đi; Shift để chạy;
  - kéo chuột để xoay nhìn;
  - điện thoại: một cần ảo bên trái, kéo bên phải để xoay nhìn.
- **Máy quay** (ui/camera-fly.js):
  - thêm chế độ bám sau vai có lò xo;
  - cách vai 2,2, cao 1,6, lệch phải 0,5;
  - tự né khi tường che;
  - tắt OrbitControls trong lúc nhập hồn.

### 3.4. Hạt (render/fx/particles3d.js, tệp mới, bản tối thiểu)

Bộ hạt dùng chung của bước 31, làm trước phần cú lao cần:
- vệt gió;
- vòng bụi khi chạm;
- bụi lơ lửng trong nắng;
- bụi dưới chân.

Lửa, khói cũ chuyển sang sau.

### 3.5. Âm thanh (audio.js)

- Thêm tiếng gió hút, gió rít, tiếng gõ kính, tiếng trầm khi chạm, nhịp tim: tổng hợp bằng code như các tiếng đã có.
- Thêm một bộ lọc trầm trên đường ra chung để làm hiệu ứng bịt tai rồi mở ra.
- Âm thanh gần: tiếng người, lửa, bước chân to nhỏ theo khoảng cách tới NPC.

## 4. Đồ hoạ gần sau khi mở mắt (render/near3d.js, tệp mới)

Chỉ bật khi đang nhập hồn, chỉ quanh NPC, tắt hẳn khi thoát.

| Lớp | Nội dung | Tốn |
|---|---|---|
| Bóng | Vùng bóng nắng thu về 25 quanh người (perf3d đã có cơ chế vùng bóng theo máy quay) | Không |
| Sương | Sương bắt đầu ở 30, dày ở 160, màu theo trời | Không |
| Đèn | Một đèn điểm ấm đi theo, cách mặt 1,5; đêm thì lửa và đèn đường là nguồn chính | Thấp |
| Màu | Chỉnh màu trong lượt hậu kỳ | Thấp |
| Mờ hậu cảnh | Nét ở khoảng cách tới NPC, mờ dần sau 25 | Vừa |
| Quầng sáng | Lửa, đèn, neon, mặt trời | Vừa |
| Cỏ, sỏi, hoa | Vẽ hàng loạt trong bán kính 14, lay theo gió, mọc theo miền (cát hồng không có cỏ, tuyết có bụi khô) | Vừa |
| Mặt đất | Nền gần bóng mịn thay vì mặt phẳng gãy khúc | Thấp |
| NPC mình | Thêm mi mắt chớp, nếp áo, bóng dưới cằm; tay vung rõ hơn | Thấp |
| Bụi | Bụi lơ lửng trong nắng, bụi dưới chân khi chạy | Thấp |

Người chơi đã yêu cầu bỏ cỏ ở góc nhìn thượng đế (bước 27). Lớp cỏ này chỉ tồn tại trong lúc nhập hồn, nên góc nhìn thượng
đế không đổi.

## 5. Các bước làm

Mỗi bước xong là chạy được và đo được. Bước sau không bắt đầu khi bước trước chưa đạt.

| Bước | Nội dung | Đạt khi |
|---|---|---|
| A | Lượt hậu kỳ, chưa bật hiệu ứng nào | Hình không đổi; khung hình không chậm quá 0,3 mili giây |
| B | Nhập hồn tối thiểu: nút trên thẻ người, máy quay sau vai, đi lại, Esc thoát | Người bị nhập không đi xuyên nhà; logic không giao việc (có kiểm thử); thoát ra người đó sống tiếp bình thường |
| C | Cú lao: đường bay, góc nhìn, mờ toả tâm, tách màu, vệt gió, xuyên vòm, chạm, mở mắt, âm thanh | Quay lại cú lao, không khung hình nào dưới 30 khung mỗi giây ở cấu hình thấp; ảnh chụp 6 pha đúng dòng thời gian |
| D | Đồ hoạ gần: bóng, sương, đèn, màu, mờ hậu cảnh, quầng sáng | Trong thân giữ 50 khung mỗi giây trở lên trên máy tính, 30 trở lên ở cấu hình thấp; ảnh trước, sau ở 6 đảo, thời 1, 6, 12 |
| E | Chi tiết gần: cỏ, sỏi, hoa, mặt đất mịn, NPC mình, bụi | Như bước D |
| F | Thế giới phản ứng và âm thanh gần | Người quanh quay lại nhìn lúc chạm; tiếng làng theo khoảng cách |
| G | Thoát ra, điện thoại (cần ảo), máy "giảm chuyển động" | Chạy trên màn hình dọc 390 × 800 |

Công cụ đo mới, tools/check-possess.js:
- tự bấm nhập hồn vào một người ở từng đảo;
- ghi thời gian từng khung hình suốt cú lao (cả khi giả lập máy chậm 4 lần);
- chụp ảnh ở 6 mốc của dòng thời gian;
- báo lỗi trang;
- kiểm người bị nhập không nằm trong khung công trình nào.

## 6. Rủi ro

- **Điện thoại yếu.** Lượt hậu kỳ tốn nhất. Đã có đường lui: tắt dần theo perf3d. Cú lao bản tối thiểu (chỉ đổi góc nhìn,
  rung, mí mắt) vẫn chạy được khi mọi hiệu ứng tắt.
- **Say chuyển động.** Góc nhìn 95 độ kèm mờ toả tâm có thể gây khó chịu. Cú lao ngắn (1,4 giây) và có bản dịu cho máy
  bật "giảm chuyển động".
- **Nhìn gần lộ chỗ thô.** Một số công trình thời đầu rất đơn giản. Sau bước D chụp ảnh cả 6 đảo × 3 thời để tìm chỗ xấu
  nhất rồi mới quyết định sửa gì ở bước E.
- **Nhập hồn giữa trận đánh.** Người bị nhập có thể đang là lính. Giai đoạn này: người bị nhập không bị gọi ra trận; trúng
  đạn thì vẫn bị thương như thường.

## 7. Ngoài phạm vi bước này

Phép thời gian, lửa, đất, nước, hố đen, sách phép, luân hồi: theo thứ tự ở bước 31, sau khi cú nhập hồn đạt.

## 8. Cần người chơi quyết trước khi làm

1. **Góc nhìn trong thân:**
   - sau vai (đề xuất): thấy nhân vật mình, giấu bớt chỗ thô;
   - mắt nhân vật (góc nhìn thứ nhất).
2. **Cách chọn NPC lần đầu:**
   - đầu trận tự lao vào một NPC ngẫu nhiên làm cảnh mở màn, sau đó bấm người nào nhập người đó (đề xuất);
   - chỉ bấm chọn.
3. **Cỏ, sỏi, hoa gần** chỉ hiện khi nhập hồn: đồng ý hay không.

## 9. Đã làm (bản để người chơi kiểm duyệt)

Phạm vi: cú lao và cảnh vật gần. Người mềm bo tròn và cử động có sức nặng (bước 31) làm sau khi duyệt.

| Phần | Tệp | Nội dung |
|---|---|---|
| Lượt hậu kỳ | render/fx/post3d.js | Mờ toả tâm, tách màu, làm mờ hậu cảnh, mờ cả ảnh, tối viền, chỉnh màu, hạt nhiễu, mí mắt, chớp trắng, vòng nứt kính, khử răng cưa. Không hiệu ứng thì vẽ thẳng (đo: màu lệch dưới 1/255) |
| Cú nhập hồn | game/possess.js | Máy trạng thái khựng → lao → chạm → mở mắt → trong thân → bay ngược lên; chọn ngẫu nhiên một người lớn, dính với người đó tới khi chết (W.soul); máy quay sau vai, né tường (không gần hơn 1,1, nâng cao lên); đi 2,2, chạy 5 đơn vị mỗi giây thật (tốc độ trận không đổi bước đi) |
| Điều khiển | ui/possess-ctl.js | Nút "Nhập hồn"; W A S D, Shift, kéo chuột, Esc; điện thoại: cần ảo trái, kéo phải; ẩn mọi bảng khi nhập hồn |
| Logic | logic/brain.js | p.possessed: bộ não không giao việc |
| Người | render/village3d.js | setDriver, folk; người bị nhập đi theo phím, không tự bắn, không dừng trò chuyện |
| Hạt | render/fx/particles3d.js | Bộ hạt dùng chung: hạt tròn mềm, vệt thẳng |
| Hạt, tiếng theo pha | render/fx/soul-fx.js, render/fx/soul-audio.js | Vệt gió, vòng bụi khi chạm, bụi lơ lửng, bụi chân khi chạy; gió hút, gió rít, gõ kính, tiếng trầm, nhịp tim, bịt tai (audio.js: bus, muffle) |
| Cảnh vật gần | render/near3d.js | Sương kéo gần, đèn ấm theo người, bóng nắng sắc quanh người, cỏ mọc ở mọi chỗ đất xanh (càng xanh càng dày, cùng màu đất; L.groundAt ở render/map/height3d.js), hoa, sỏi, lay theo gió; không mọc trên đường, hồ, chân công trình, sân đất (places().grounds) |

Kiểm tra: tools/check-possess.js. Đủ các pha, logic không giao việc, cỏ, sương, đi lại, không đứng trong nhà, thoát ra trả lại
đúng, không lỗi trang.
