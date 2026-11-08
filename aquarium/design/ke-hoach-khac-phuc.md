# Kế hoạch khắc phục toàn bộ nhược điểm (trước phần giao diện người chơi)

Bản này liệt kê mọi nhược điểm đang có của Bể Kính (sau bước 10, artifact Version 93) và cách khắc phục từng cái, theo thứ tự
làm. Mỗi việc có tiêu chí "xong" đo được. Giao diện người chơi (vòng chơi, quyền năng, mục tiêu theo trận) làm sau khi xong bản
này; ở đây chỉ chuẩn bị phần logic nền cho nó (mục 8).

Ký hiệu: **[L]** logic (chạy được bằng Node), **[V]** phần vẽ, **[K]** kỹ thuật, **[Đ]** đo đạc.

---

## 0. Danh sách nhược điểm

| # | Nhược điểm | Bằng chứng hiện có | Mục xử lý |
|---|---|---|---|
| N1 | Luật móc vào nhau chặt: đổi một chỗ là lệch chỗ khác, bước nào cũng phải vá bài kiểm thử | bước 9, 10: sửa 9 bài kiểm thử vì thế giới đổi | 1.1 |
| N2 | Bài kiểm thử phụ thuộc may rủi của hạt giống | hải chiến 0 ca với 5 hạt giống cũ; island.test hỏng một lần rồi lại đạt | 1.1 |
| N3 | Cân chỉnh chạy tay, kết quả đọc bằng mắt, không có ngưỡng đạt / không đạt | các lần chạy 40, 100 trận | 1.2 |
| N4 | Chưa đo lại hiệu năng trên điện thoại sau khi thêm đạn, thanh máu, cầu rộng, đội hình | chưa có số | 1.3 |
| N5 | Không lưu được trận: tải lại phải chạy lại từ đầu (`?seed=&day=`), năm cuối mất nhiều giây | không có lưu, không dùng bộ nhớ trình duyệt | 1.4 |
| N6 | Code khó đọc: 103 dòng dài hơn 300 ký tự | đếm trên logic, render, game, ui | 1.5 |
| N7 | Đạn trên màn hình chỉ để nhìn, không quyết định ai trúng; người trúng đạn và người ngã không khớp viên đạn | `logic/war.js` tính theo xác suất cả đoàn | 2.1 |
| N8 | "Gặp là bắn" chỉ có ở phần vẽ; logic không biết ai đang đối mặt ai | `render/village3d.js` | 2.2 |
| N9 | Chỗ người ngã (thi thể) không trùng chỗ người đó đứng lúc trúng đạn | `S.fallen` chỉ ghi khoá chỗ | 2.3 |
| N10 | Xe, máy công thành nhảy chỗ khi đổi chặng (cầu → trong thành), không thấy lăn qua cổng | `game/cities.js` siegeGear | 2.4 |
| N11 | Quân đổi chặng (phá công trình → vây nhà chính) đi bộ lâu, khoảng đó trên màn hình như trận ngừng | ảnh bước 9: quân kẹt gần cổng khi vừa đổi chặng | 2.4 |
| N12 | Máy quay chưa tự chọn góc: muốn thấy trận phải tự đặt; nút "Trận đánh ⏭" bay tới nhưng khung hình thường lệch | ảnh chụp bước 8–10 | 3.1 |
| N13 | Không biết chuyện gì đang lớn nhất lúc này; tin chạy liên tục, chuyện lớn lẫn trong chuyện nhỏ | bảng tin, biên niên | 3.2 |
| N14 | Thanh máu dày đặc khi trận đông, che người | ảnh bước 9 | 3.3 |
| N15 | Năm đầu yên quá lâu (khoảng lặng dài nhất trung bình ~340 ngày) | 100 trận bước 10 | 4.1 |
| N16 | Cuối trận dồn dập quá (14,7 trận đánh, hạt nhân 23% số trận) | 100 trận bước 10 | 4.2 |
| N17 | Mới 29% số trận kết thúc với 1–2 đảo vô địch | 100 trận bước 10 | 4.3 |
| N18 | Đảo bị chiếm dùng chung thời với đảo cai quản: "cả bể lên 12" không do tự tiến bộ, số đo thời bị thổi phồng | `logic/war.js` annex | 4.4 |
| N19 | Kịch bản hiếm gần như không bao giờ thấy: phục kích 0,26, cứu viện 0,09, nội gián 0,06 mỗi trận | 100 trận bước 10 | 5.1 |
| N20 | Đầu hàng hiếm (0,44) vì nhà chính sụp trước | 100 trận bước 10 | 5.2 |
| N21 | Càn quét dân thường chưa cân: chưa đo số dân chết vì càn quét, ảnh hưởng tới kinh tế đảo bị chiếm | bước 10 | 5.3 |
| N22 | Hải chiến chỉ thấy rõ khi máy quay đúng chỗ; thuyền chặn khó thấy | ảnh bước 8 | 6.1 |
| N23 | Đặt chỗ chưa tránh hết: đài kỳ quan sát cây, mép hồ; sân chơi trẻ có lúc sát đống lửa nhà chính ở thời 1 | ảnh bước 8, 9 | 6.2 |
| N24 | NPC có lúc kẹt trên lối đi, không có cơ chế gỡ | ảnh bước 9 (quân kẹt gần cổng) | 6.3 |
| N25 | Cỏ dại lúc suy tàn khó nhận ra | ảnh bước 8 | 6.4 |
| N26 | Nút dev đặt thẳng thời không dựng lại công trình (thời 5 mà vẫn lều đồ đá) | ảnh bước 9 (dev) | 6.5 |
| N27 | Thời đầu thiếu chỗ (chưa có chợ, trường): việc rơi về chỗ thay thế, nhiều người dồn quanh nhà chính và đống lửa | ảnh ngày đầu bước 9 | 7.1 |
| N28 | Kiểm "không vô nghĩa" chỉ đếm lỗi cứng, chưa đo đông đúc, đứng không, đi vô định | `audit()` | 7.2 |
| N29 | Người chơi chỉ đứng xem, chưa có vòng chơi (phần giao diện, làm sau) | đánh giá tổng | 8 |

---

## 1. Nền móng kỹ thuật (làm trước, để các bước sau đổi luật không vỡ)

### 1.1 Tách hai loại kiểm thử [K] (N1, N2)
- **Kiểm thử hành vi**: dựng thẳng tình huống, không chạy cả thế giới (đặt quân, đặt cổng, đặt máu rồi gọi đúng hàm). Kết
  quả không phụ thuộc hạt giống. Chuyển các bài đang chạy cả thế giới nhiều trăm ngày (hải chiến, sáp nhập, nổi dậy, tên lửa)
  sang dạng này.
- **Kiểm thử thống kê**: chuyển sang bộ cân chỉnh (1.2), không nằm trong `node --test`.
- Mỗi tệp kiểm thử chạy dưới 60 giây.
- **Xong khi**: chạy 3 lần liên tiếp cả 13 tệp đều đạt; đổi một hằng số cân chỉnh (ví dụ `HITS`) không làm hỏng bài nào.

### 1.2 Bộ cân chỉnh có ngưỡng [Đ] (N3)
- Đưa `calib.js`, `summ.js`, `prog.js` vào `aquarium/tools/` (đang nằm ngoài kho).
- Một lệnh `node tools/calibrate.js 100` chạy song song, in bảng chỉ số kèm cột mục tiêu và ĐẠT / KHÔNG ĐẠT.
- Mục tiêu ghi trong một tệp (`tools/targets.json`) để thấy rõ, đổi có chủ ý.
- **Xong khi**: một lệnh in đủ các chỉ số ở mục 4, 5, kèm đạt / không đạt.

### 1.3 Đo hiệu năng [K] (N4)
- Kịch bản đo trên trình duyệt với CPU giả lập chậm 4 lần (gần điện thoại tầm trung), màn hình điện thoại.
- Đo ở 4 cảnh: làng ngày thường thời 1, thời 12 neon, trận ở cầu đông quân, vây nhà chính.
- Ngân sách: ≥ 30 khung hình mỗi giây trên giả lập điện thoại, ≥ 55 trên máy tính; số lần vẽ (draw call) ghi lại.
- Vượt ngân sách thì giảm theo thứ tự: thanh máu ở xa (3.3), đạn (gộp, giới hạn mỗi khung hình), bóng đổ của xe.
- **Xong khi**: cả 4 cảnh đạt ngân sách, số ghi vào README.

### 1.4 Lưu và tiếp tục trận [K][L] (N5)
- Lưu trạng thái thế giới (đảo, người, kho, trận, cầu, biên niên) vào bộ nhớ trình duyệt mỗi năm trong game và khi đóng trang.
- Mở lại thì hỏi "Tiếp tục trận ở năm X?".
- Logic thêm `World.save(W)` / `World.load(json)`, có kiểm thử: lưu rồi nạp lại, chạy tiếp 100 ngày phải ra đúng như không lưu.
- **Xong khi**: tải lại trang ở năm 8 mất dưới 2 giây; kiểm thử lưu/nạp đạt.

### 1.5 Dọn code khó đọc [K] (N6)
- Chỉ dọn tệp nào đang sửa trong bước đó (không viết lại hàng loạt): tách dòng quá 300 ký tự, giữ nguyên hành vi.
- **Xong khi**: các tệp đã chạm không còn dòng quá 300 ký tự; kiểm thử và cân chỉnh không đổi.

---

## 2. Hình khớp với logic

### 2.1 Mỗi phát trúng là một viên đạn thật [L][V] (N7)
- Logic vẫn là nơi quyết định (chạy được bằng Node, cùng hạt giống thì cùng kết quả). Mỗi phát trúng (`hurt`) ghi một sự kiện
  `{ người bắn, người trúng, lúc, sát thương }` vào hàng đợi của đảo.
- Logic chọn người bắn từ những người đang ra trận của bên kia, gần người trúng nhất theo đội hình (2.2).
- Phần vẽ: đảo đang xem gần thì mỗi sự kiện thành một viên đạn từ đúng người bắn tới đúng người trúng, tới nơi thì thanh máu
  tụt, hết máu thì ngã tại chỗ. Đạn trượt (để có nhịp bắn đều) chỉ là trang trí và không bao giờ bay trúng ai.
- **Xong khi**: trong trận đang xem, 100% người ngã đều có viên đạn trúng ngay trước; không có người ngã mà không thấy ai bắn.

### 2.2 Đội hình và "gặp là bắn" trong logic [L] (N8)
- Logic giữ đội hình trừu tượng: mỗi bên một tuyến (cổng, cầu, phố, nhà chính) và thứ tự người trong tuyến. Hai tuyến cùng chỗ
  thì đối mặt, mỗi người nhắm người đối diện gần nhất.
- Quân đang di chuyển gặp tuyến địch trên đường (theo thứ tự chặng) thì dừng lại đánh ở đó trước.
- Phần vẽ đọc tuyến và thứ tự này thay cho việc tự đoán.
- **Xong khi**: kiểm thử hành vi: quân đổi chặng đi qua chỗ có dân binh thì dừng đánh, không đi qua.

### 2.3 Người ngã nằm đúng chỗ [V][L] (N9)
- Khi phần vẽ cho viên đạn trúng (2.1), ghi vị trí thật của người đó; thi thể nằm đúng chỗ, quay đúng hướng ngã.
- Đảo không xem gần: giữ cách cũ (theo khoá chỗ).

### 2.4 Đổi chặng thấy được [V][L] (N10, N11)
- Xe, máy công thành: cổng vỡ thì lăn từ cầu qua cổng vào thành theo đường thật, cách nhau 6 đơn vị; không nhảy chỗ.
- Quân đổi chặng chạy (không đi bộ), đi theo đội hình hàng dọc trên đường.
- Logic thêm thời gian chuyển chặng tương ứng (quân chưa tới thì chưa đánh chặng sau), để logic và hình khớp nhau.
- **Xong khi**: ảnh chụp liên tiếp lúc đổi chặng thấy xe và quân đang di chuyển, không có khung hình trống trận.

---

## 3. Dễ theo dõi

### 3.1 Máy quay đạo diễn [V] (N12)
- Mỗi loại cảnh có một góc đặt sẵn: trận ở cổng (ngang tường, thấy hai tuyến), trận ở cầu (dọc cầu), vây nhà chính (chéo
  trên cao), càn quét (trên cao), hải chiến (ngang mặt biển), biểu tình, đám tang, lễ hội, thời hoàng kim, kỳ quan xong.
- "Trận đánh ⏭", "Drama ⏭" và bấm vào tin đều bay tới đúng góc đó, rồi đi theo diễn biến (cổng vỡ thì theo quân vào thành).
- **Xong khi**: chụp tự động 10 cảnh bằng chính các nút này, cả 10 ảnh đều thấy rõ chuyện chính mà không chỉnh tay.

### 3.2 Chuyện lớn nhất lúc này [L][V] (N13)
- Logic xếp hạng chuyện đang diễn ra theo độ lớn (biên niên đã có độ lớn 1–6).
- Bảng tin tách hai tầng: chuyện lớn (độ lớn từ 3, giữ lâu, có nút bay tới) và tin thường (mờ, trôi nhanh).
- **Xong khi**: lúc có trận vây nhà chính, dòng đầu bảng tin luôn là trận đó.

### 3.3 Thanh máu gọn [V] (N14)
- Chỉ hiện thanh máu của người đã mất máu, hay người trong khung máy quay gần; ở xa thì gộp thành một thanh tổng cho mỗi tuyến
  ("quân Cát Hồng 28/40").
- **Xong khi**: trận 40 người mỗi bên, thanh máu không che quá 15% diện tích người trên ảnh.

---

## 4. Nhịp trận

### 4.1 Năm đầu có chuyện [L] (N15)
- Thêm chuyện nhỏ đúng thời đồ đá, có nguyên nhân: đi săn thú lớn, tranh bãi săn, lần đầu gặp thuyền đảo khác, lễ đặt tên
  làng, người lạc trong rừng, thú dữ vào làng.
- Nhịp kịch tính (`logic/chronicle.js`) bắt đầu từ ngày 120 thay vì 300, nhưng chỉ đẩy chuyện nhỏ (độ lớn 2) trong năm đầu.
- **Mục tiêu**: khoảng lặng dài nhất trung bình dưới 220 ngày.

### 4.2 Cuối trận dứt khoát hơn, ít ồn hơn [L] (N16)
- Hạt nhân thành vũ khí răn đe: có thì đảo khác ngại đánh; chỉ dùng khi đang mất nhà chính hay đảo mình đã bị bắn hạt nhân.
- Bá chủ đánh ít trận hơn nhưng mỗi trận lớn hơn (gom quân đồng minh, đảo bị chiếm góp quân).
- **Mục tiêu**: 9–12 trận đánh mỗi trận; hạt nhân dùng ở 8–15% số trận.

### 4.3 Có đảo vô địch [L] (N17)
- Đảo bị chiếm góp quân cho đảo cai quản; bá chủ mạnh nhất nhận đầu hàng không cần đánh (đảo nhỏ tự xin làm chư hầu khi chênh
  lệch quá lớn).
- **Mục tiêu**: 1–2 đảo độc lập cuối trận ở ≥ 55% số trận; tới cuối năm 8, ≥ 2 đảo từ thời 11 ở ≥ 70% số trận.

### 4.4 Thời thật của từng đảo [L][Đ] (N18)
- Đảo bị chiếm giữ thời của chính mình; bị chiếm thì được đảo cai quản chuyển công nghệ dần (mỗi 90 ngày lên một thời, tới
  bằng đảo cai quản trừ một).
- Số đo tách hai cột: "thời của đảo độc lập" và "thời cả bể".
- **Xong khi**: bảng cân chỉnh có cả hai cột; trời neon vẫn tính theo đảo cao nhất (bước 10).

---

## 5. Logic còn thiếu

### 5.1 Kịch bản hiếm xảy ra thường hơn [L] (N19)
- Phục kích: đảo có đồi, rừng gần cổng, người đứng đầu mưu mô.
- Cứu viện phút chót: đồng minh nhận tin sớm hơn, đi nhanh hơn khi đảo đồng minh sắp mất nhà chính.
- Nội gián: người bất bình, bị phạt hay nợ ân của đảo kia.
- **Mục tiêu**: mỗi kịch bản ≥ 0,4 lần mỗi trận, có nguyên nhân ghi trong tin.

### 5.2 Đầu hàng có ý nghĩa [L] (N20)
- Người đứng đầu xét đầu hàng mỗi khi nhà chính mất một phần tư máu, không chỉ mỗi ngày; đầu hàng thì ít dân chết hơn, có điều
  kiện (giữ ghế cai quản, giữ một phần kho).
- **Mục tiêu**: đầu hàng 0,8–1,5 lần mỗi trận.

### 5.3 Cân càn quét [L][Đ] (N21)
- Đo dân thường chết vì càn quét mỗi trận và dân đảo bị chiếm một năm sau.
- **Mục tiêu**: mỗi lần mất thành, dân thường chết 5–15%; một năm sau dân đảo bị chiếm hồi ≥ 85%.

---

## 6. Chi tiết hình ảnh

### 6.1 Hải chiến [V] (N22)
Thuyền hai bên đối đầu thành hai hàng, có thanh máu tổng; máy quay đạo diễn (3.1) có góc riêng; thuyền chìm khi hết người.

### 6.2 Đặt chỗ không chồng [V] (N23)
Đài kỳ quan, sân chơi, trại vây, máy công thành dùng chung hàm tìm chỗ của `render/build/place3d.js` (tránh nhà, cây, hồ,
sông, đường, mép đảo). Kiểm thử: không chỗ nào chồng lên vật khác ở cả 6 đảo × 12 thời.

### 6.3 Gỡ người kẹt [V] (N24)
Người đi mà 3 giây không tiến được 0,5 đơn vị thì tìm lại đường; vẫn kẹt thì nhảy sang điểm kế tiếp trên lối đi. Ghi số lần
kẹt vào `audit()`.

### 6.4 Suy tàn dễ thấy [V] (N25)
Nhà bỏ hoang: cửa sổ tối, mái sẫm màu, cỏ dại cao hơn, đường vắng (ít xe); chợ đóng cửa.

### 6.5 Nút dev dựng lại công trình [V] (N26)
Nút đặt thẳng thời gọi dựng lại công trình của đảo đó ngay.

---

## 7. NPC

### 7.1 Thời đầu có đủ chỗ [V][L] (N27)
Thời 1–2 thêm chỗ thật cho việc đang thiếu chỗ: bãi trao đổi (thay chợ), gốc cây kể chuyện (thay trường), bãi tập; việc không
có chỗ thì đổi việc khác, không dồn về nhà chính.

### 7.2 Đo "không vô nghĩa" bằng số [Đ][V] (N28)
`audit()` thêm:
- phần người đứng không;
- người đi không có đích;
- số người trong vòng 10 đơn vị quanh nhà chính;
- số người bước tại chỗ;
- số lần kẹt.

Chạy ở 6 đảo × 4 buổi × 3 thời (1, 6, 12).

**Mục tiêu**:
- bước tại chỗ: 0;
- đứng không: ≤ 10%;
- quanh nhà chính ngày thường: ≤ 8 người (trừ họp, biểu tình, lễ);
- kẹt: ≤ 1 mỗi phút.

---

## 8. Chuẩn bị logic cho vòng chơi (giao diện làm sau) [L] (N29)
- Hàm can thiệp có giá của logic: `Powers.cast(W, loại, đảo, ngày)` (mưa, dịch, phép lạ, sấm sét, ban phúc mùa màng), mỗi lần
  dùng tốn "niềm tin" do dân các đảo dâng lên theo thời gian.
- Mục tiêu theo trận: `Goals` (đưa một đảo thành bá chủ, giữ cả sáu đảo sống tới năm 9, không để ai dùng hạt nhân).
- Kiểm thử hành vi cho từng quyền năng.

---

## 9. Thứ tự làm và cách kiểm

| Bước | Mục | Vì sao đứng đây |
|---|---|---|
| 11a | 1.1, 1.2, 1.5 | Có nền để đổi luật mà không vỡ |
| 11b | 1.3, 1.4 | Đo hiệu năng trước khi thêm hình; lưu trận để thử nhanh năm cuối |
| 11c | 2.1, 2.2, 2.3, 2.4 | Hình khớp logic là phần lớn nhất, đổi nhiều tệp |
| 11d | 3.1, 3.2, 3.3, 6.1 | Dễ theo dõi; máy quay đạo diễn cần cho mọi ảnh kiểm chứng sau |
| 11e | 4.1–4.4, 5.1–5.3 | Nhịp trận và logic; cân chỉnh 100 trận theo bảng mục tiêu |
| 11f | 6.2–6.5, 7.1, 7.2 | Chi tiết và NPC |
| 11g | 8 | Logic cho vòng chơi |

Mỗi bước kết thúc bằng:
- 13 tệp kiểm thử đều đạt (chạy từng tệp);
- bảng cân chỉnh 100 trận đạt mục tiêu;
- ảnh chụp lúc đồng hồ chạy bằng máy quay đạo diễn;
- đo hiệu năng 4 cảnh;
- tài liệu, đóng gói, commit, cập nhật artifact.

---

## 10. Đã làm (bước 11a–11g) và số đo cuối

**Cân chỉnh 100 trận** (`node tools/calibrate.js 100`, hạt giống 1–100): cả 16 chỉ số đạt mục tiêu trong `tools/targets.json`.

| Chỉ số | Kết quả | Mục tiêu |
|---|---|---|
| Trận đánh mỗi trận | 10,13 | 9–12 |
| Trận có dùng hạt nhân | 13% | 8–15% |
| Cuối trận còn 1–2 đảo độc lập | 60% | ≥ 55% |
| Cuối năm 8 có ≥ 2 đảo từ thời 11 | 88% | ≥ 70% |
| Khoảng lặng dài nhất (trung bình) | 161 ngày | ≤ 220 |
| Chết đói mỗi trận | 2,83 | ≤ 5 |
| Có đảo độc lập kẹt dưới thời 6 | 0% | ≤ 10% |
| Phục kích / cứu viện phút chót / nội gián mỗi trận | 1,09 / 1,41 / 1,30 | ≥ 0,4 mỗi loại |
| Đầu hàng mỗi trận | 1,08 | 0,8–1,5 |
| Dân thường chết mỗi lần mất thành | 11,7% | 5–15% |
| Dân đảo bị chiếm một năm sau | 151% | ≥ 85% |
| Cầu xây xong / xây lại / lượt qua lại mỗi trận | 9,3 / 5,6 / 123 | ≥ 1 / ≥ 0,3 / ≥ 10 |

Tham khảo: thời trung bình cuối trận 11,13 (cả bể), 11,65 (đảo độc lập); năm 7 có ≥ 2 đảo từ thời 11 ở 38% số trận.

**Kiểm tra cảnh bằng trình duyệt** (`node tools/check-scene.js`): chỗ dùng chung không chồng ở 6 đảo × 12 thời (0 chỗ chồng,
0 chỗ thiếu); dân ở 6 đảo × 4 buổi × 3 thời (1, 6, 12): đứng không lớn nhất 0%, tụ tập quanh nhà chính ngày thường lớn nhất 2
người, bước tại chỗ 0, kẹt 0 lần mỗi phút. (Đài kỳ quan chỉ được kiểm khi đảo đó đang vẽ gần; chỗ của nó tìm cách xa mọi công
trình nên chưa thấy chồng, nhưng bài kiểm tra chưa phủ hết 6 × 12.)

**Kiểm thử**: 15 tệp trong `test/` đều đạt khi chạy từng tệp (thêm `save.test.js`, `powers.test.js`).

**Những gì đã đổi theo từng bước**
- 11a: kiểm thử hành vi thay cho kiểm thử dựa vào may rủi; bộ cân chỉnh có ngưỡng; tách dòng quá dài.
- 11b: đo hiệu năng 4 cảnh (`G.frameTime`), lưu và tiếp tục trận (`logic/save.js`). Trên máy chạy thử (vẽ bằng phần mềm,
  chậm 4 lần như điện thoại): làng thời 1 khoảng 14–20 ms mỗi khung hình phần JS, thời 12 khoảng 34–60 ms, trận ở cầu 63–130
  ms, vây nhà chính 46–112 ms; máy bàn 6–35 ms. Trận đánh trên điện thoại yếu chưa đạt 33 ms; phần GPU chưa đo được ở đây.
- 11c: mỗi phát trúng là một viên đạn thật từ người bắn tới người trúng (`W.hitLog`), người ngã nằm đúng chỗ, chặng đổi thấy được.
- 11d: máy quay đạo diễn có góc theo từng loại cảnh, chuyện lớn nhất trên bảng tin, thanh máu gọn, hải chiến hai hàng thuyền.
- 11e: năm đầu có chuyện thời đồ đá; nhịp kịch tính bằng việc thật (chặn bắt thuyền buôn, tối hậu thư của bá chủ); hạt nhân
  là vũ khí răn đe; đảo nhỏ tự xin làm chư hầu; thời thật của đảo bị chiếm (chuyển công nghệ dần); đầu hàng có điều kiện; kịch
  bản hiếm có nguyên nhân; cân càn quét. Sửa hai lỗi: đảo bị đảo số 0 chiếm vẫn bị coi là độc lập; đầu hàng xoá mất phần kho
  được giữ. Thời muộn rẻ hơn (`logic/economy.js` LATE_*), nên khi các đảo sống riêng không giao thương (chỉ có trong kiểm thử)
  nhiều đảo chạm thời 12 hơn trước (tối đa 4 thay vì 2).
- 11f: chỗ dùng chung không chồng (`render/build/place3d.js` freeSpot), sân chơi, bãi trao đổi và gốc cây kể chuyện thời 1–2
  có đồ dựng; trại vây tránh bến; gỡ người kẹt; số đo `auditStats`; suy tàn dễ thấy (vắng xe, nhà tắt đèn, cỏ dại cao, chợ đóng
  cửa); nút dev đặt thời dựng lại công trình ngay.
- 11g: `logic/powers.js` (mưa, ban phúc mùa màng, phép lạ, sấm sét, dịch bệnh; mỗi lần tốn niềm tin do dân dâng lên),
  `logic/goals.js` (đưa một đảo thành bá chủ, giữ sáu đảo sống tới năm 9, không để ai dùng hạt nhân). Chưa có giao diện.
