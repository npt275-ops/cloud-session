# Bể Kính · Quy trình tổng quát: 6 đảo tự vận hành

> Mục tiêu: 6 đảo tự sống, tự quyết, tự đua nhau trong 9 năm game. Kết quả sinh ra từ tính cách (gen), môi trường và hoàn
> cảnh thật, nên không đoán trước được. Người chơi **chưa có vai trò** và chưa có nút. Màn hình là giao diện dev, xem được
> toàn bộ cả 6 thành phố. Các nút thử cũ giữ lại cho dev.

## 0. Đã chốt

| # | Chốt |
|---|---|
| 1 | **Lên cấp bằng tài nguyên.** Có đảo có thể không chạm tới thời 12 trong 9 năm. |
| 2 | **Thua là bị sáp nhập.** Một đảo thua khi quân đảo khác chiếm được nhà chính của nó. Đảo thắng lấy toàn bộ tài nguyên, dân và quân của đảo thua. |
| 3 | **Một thế hệ ≈ 1,5 năm game** (`GEN_DAYS` = 540 ngày, đúng như hiện tại). |
| 4 | **Người xem nhìn cả 6 đảo** như bây giờ. |
| 5 | **Nút thử giữ cho dev.** Chưa thêm gì cho người chơi. |
| 6 | **Mọi thứ tự chạy theo đúng vai trò của nó:** NPC, đảo, môi trường. |

---

## 1. Thời gian và nhịp chạy

| Nhịp | Độ dài | Việc chạy ở nhịp này |
|---|---|---|
| Khung hình | 1/60 giây | Vẽ: người đi, xe chạy, đoàn buôn và quân hành quân trên cầu |
| Nhịp nghĩ | ~6 lần mỗi ngày game | Bộ não từng người chọn việc (`brain.js`, đã có) |
| Ngày | 1 ngày game | Sinh, già, mất; sản xuất và tiêu dùng; khí hậu; drama; xây công trình |
| Tuần chiến lược | 10 ngày | Người đứng đầu mỗi đảo xét tình hình, chọn nước đi chiến lược |
| Mùa | 90 ngày | Khí hậu theo mùa của từng đảo |
| Thế hệ | 540 ngày (1,5 năm) | Lứa con mới, dòng gen mới, thay người trong hội đồng |
| Trận | 3240 ngày (9 năm) | Kết thúc: xếp hạng 6 đảo (hay ít hơn, nếu có đảo bị sáp nhập) |

- **Một bộ đếm ngày chung cho cả bể.** Cả 6 đảo chạy cùng nhịp, theo thứ tự cố định mỗi ngày, nên không đảo nào được đi trước.
- **Mỗi trận có một hạt giống (seed).** Cùng seed thì ra cùng kết quả, dễ tìm lỗi và dễ kiểm thử; khác seed thì ra một lịch sử khác.

### 1.1 Hai đồng hồ, một tốc độ (1×, 2×, 4×)
Cả hai đồng hồ đều nhân theo tốc độ:
- **Lịch:** ngày, mùa, năm, tuổi, thế hệ, tài nguyên, thời đại. Ở 1×, lịch chạy 0,75 ngày mỗi giây thật, nên một trận 9 năm dài khoảng 72 phút.
- **Giờ trong ngày:** sáng, trưa, chiều, tối, đêm, quyết định lịch làm việc và đèn đường. Ở 1×, một vòng ngày đêm dài 3 phút thật.

Một vòng ngày đêm là "một ngày điển hình" của cả quãng lịch đó, nên lịch trôi nhanh hơn nhiều (chọn có chủ ý: 9 năm không thể có 3240 lần ngày đêm thật).

**Quy tắc để cử động và hành động đúng ở mọi tốc độ:**
1. **Logic quyết, hình chỉ hiển thị.** Kết quả (ai đi đâu, trận đánh, giao thương) tính trong `logic/`, không phụ thuộc khung hình hay tốc độ. Cùng seed thì 1×, 2×, 4× ra cùng một lịch sử.
2. **Mọi chuyển động có hệ quả chạy theo giờ game:** người đi bộ, xe, đoàn buôn, quân hành quân. Quãng đường = tốc độ × thời gian game. Ở 4× họ đi nhanh gấp 4, kịp tới nơi trước khi đổi việc.
3. **Bước con cố định.** Mỗi khung hình chia thời gian game thành các bước nhỏ, mỗi bước tối đa khoảng 50 ms game. Nhờ vậy ở 4× không ai đi vượt quá đích, không xuyên tường, và xe vẫn kịp dừng nhường người.
4. **Hoạt ảnh:**
   - Bước chân theo quãng đường đã đi (đã đúng), nên chân luôn khớp với chuyển động.
   - Cử chỉ tại chỗ (cuốc, đóng búa, nói chuyện) chạy theo giờ game nhưng nhanh nhất 2×. Quá mức đó thì bỏ bớt lượt cử chỉ chứ không tua nhanh, để không bị giật.
   - Hiệu ứng thuần trang trí (chớp mắt, khói, đèn nhấp nháy) chạy theo giờ thực.
5. **Đồng hồ nằm trong logic** (`logic/world.js`): giờ trong ngày cũng do logic tính từ lịch, không đọc từ phần chạy game, để chạy giả lập hàng loạt bằng Node vẫn đúng.
6. **Kiểm thử:** chạy cùng một seed ở 1×, 2×, 4× rồi so nhật ký, phải trùng nhau. Đo được người đi bộ tới nơi trước khi đổi buổi ở cả 3 tốc độ.

---

## 2. Bốn lớp của một đảo

```
 Lớp 4  CHIẾN LƯỢC   người đứng đầu + hội đồng → giao thương, hiệp ước, cứu trợ, tích quân, chiến tranh
 Lớp 3  KINH TẾ      tài nguyên: sản xuất, tiêu dùng, kho → lên cấp thời đại
 Lớp 2  XÃ HỘI       việc làm, vị trí cứng, drama, bất bình, bạo loạn
 Lớp 1  CON NGƯỜI    gen, tính cách, ngoại gen, tuổi, gia đình, thế hệ
        ────────────────────────────────────────────────────────────
 Nền    MÔI TRƯỜNG   mùa, khí hậu, thiên tai của từng đảo (hệ thống tự sinh, chưa do người chơi)
```

Mỗi lớp chỉ đọc lớp dưới và ghi kết quả của chính nó. Lớp trên không sửa trực tiếp dữ liệu của lớp dưới.

---

## 3. Lớp 1 · Con người (đã có phần lớn)

**Đã có:**
- 8 gen tính cách (tham vọng, hiếu chiến, đa nghi, sợ hãi, trí tuệ, nhu nhược, sùng đạo, mưu mô) và 4 gen dáng.
- Thói quen theo cha hoặc mẹ, đột biến khi sinh, gen hiếm.
- Tính cách nổi trội (`temper.js`).
- Tuổi, cái chết, gia đình, hội đồng 8 ghế.
- Thế hệ mới mỗi 540 ngày.

**Thêm:**
- **Dân cho 5 đảo còn lại.** Mỗi đảo có gia tộc riêng và nét gen riêng (độ lệch gen gốc), ví dụ Đá Mây gan và hiếu chiến hơn, Cửa Sóng khéo buôn bán. Bộ máy dùng chung với Lúa Vàng.
- **Ngoại gen.** Mỗi người có thêm dấu ngoại gen trên từng chỉ số. Chỉ số biểu hiện = gen gốc + dấu ngoại gen.
  - Nghịch cảnh kéo dài (đói, rét, chiến tranh, mất người thân) đẩy dấu lên dần. Ví dụ: đói lâu thì tăng đa nghi và hiếu chiến; chiến tranh thì tăng sợ hãi ở người nhút nhát và tăng hiếu chiến ở người gan.
  - Dấu phai dần khi đời sống yên ổn.
  - Con sinh ra trong nghịch cảnh nhận một phần dấu của mẹ và có tỉ lệ đột biến cao hơn.
  - Nhờ vậy, một lãnh đạo vốn ôn hoà vẫn có thể hoá thành kẻ cướp bóc.

---

## 4. Lớp 2 · Xã hội (đã có khung)

**Đã có:**
- Việc làm theo tính cách (`jobs.js`).
- Vị trí cứng (`posts.js`).
- Lịch theo buổi (`tasks.js`).
- Drama gom người cùng tính cách (`dramas.js`).

**Thêm:**
- **Việc làm sinh ra tài nguyên.** Mỗi việc gắn với một nguồn (mục 5): nông dân ra lương thực, thợ rừng ra gỗ, thợ mỏ ra đá và quặng, ngư dân ra cá… Danh sách việc mở dần theo thời.
- **Bất bình** là chỉ số chung của đảo, tăng khi đói, khi thuế hay nghĩa vụ quân sự nặng, khi thua trận, khi người đứng đầu bị ghét. Bất bình làm bạo loạn dễ nổ ra hơn (drama `riot`). Bất bình rất cao có thể dẫn tới đảo chính: hội đồng thay người đứng đầu.
- **Quân đội** là lính (đã có) cộng người được gọi nhập ngũ khi tích quân. Sức mạnh = số lính × trang bị của thời × sĩ khí (gen gan dạ hay sợ hãi, tình trạng no đói) × tài chỉ huy của 2 tướng.

---

## 5. Lớp 3 · Kinh tế và lên cấp

### 5.1 Sáu loại tài nguyên

| Tài nguyên | Dùng cho |
|---|---|
| Lương thực | nuôi dân (thiếu là đói), nuôi quân |
| Gỗ | xây dựng thời đầu, thuyền, cầu |
| Đá | xây dựng, tường thành |
| Kim loại | vũ khí, máy móc |
| Năng lượng | từ thời Công nghiệp trở đi |
| Hàng quý | muối, ngọc, gia vị, đá quý: giao thương, ngoại giao, chính trị |

### 5.2 Đặc sản theo địa hình
Mỗi đảo dồi dào 1–2 thứ và thiếu hẳn vài thứ, nên buộc phải giao thương hay chiếm đoạt.

| Đảo | Dồi dào | Có ít | Gần như không có |
|---|---|---|---|
| Lúa Vàng (đồng bằng) | Lương thực | Gỗ | Kim loại, Đá |
| Thông Xanh (rừng) | Gỗ | Lương thực | Kim loại |
| Đá Mây (núi) | Đá, Kim loại | Lương thực (săn bắt, hái lượm) | – |
| Tuyết Trắng (băng nguyên) | Năng lượng (than, dầu, gió), cá | Đá | Gỗ, lương thực trồng trọt (sống nhờ cá) |
| Cửa Sóng (biển) | Hàng quý (muối, ngọc trai), cá | Gỗ | Kim loại |
| Cát Hồng (sa mạc) | Hàng quý (đá quý), Năng lượng (mặt trời) | Đá, Lương thực (ốc đảo) | Gỗ |

### 5.3 Sản xuất và tiêu dùng (mỗi ngày)

`sản xuất = số người làm × năng suất × độ giàu của đảo × khí hậu × mức công nghệ của thời`

- **Năng suất cá nhân** lấy từ gen: trí tuệ cao làm giỏi hơn; sợ hãi và nhu nhược cao làm kém hơn. Có cộng thêm ngoại gen và độ no đói.
- **Khí hậu** là hệ số của ngày đó: hạn hán, bão tuyết, mùa đông…
- **Tiêu dùng:** mỗi người ăn một phần lương thực mỗi ngày. Quân ăn nhiều hơn. Công trình đang xây trừ dần vật liệu.
- **Kho:** có sức chứa. Đầy thì sản xuất dư bị bỏ phí. Nhà kho và chợ nâng sức chứa.

### 5.3b Ai làm, làm gì (đã làm ở bước 2)
- Người làm (job `worker`) được chia việc mỗi ngày:
  - trước hết đủ người làm lương thực để ăn dư khoảng 15%, thêm người khi kho cạn;
  - số còn lại chia cho những thứ giỏ thời sau còn thiếu, nghiêng về thứ đảo giàu.
- Người cũ giữ việc của mình nếu không phải đổi.
- Người trong hội đồng cũng làm ra lương thực: đủ sức ở thời 1–3, nửa sức về sau.
- Mỗi thứ tài nguyên một chỗ làm và một cử chỉ: ruộng, đốn gỗ, mỏ đá, chỗ làm năng lượng, chợ.
- **Đói** (hết lương thực):
  - không sinh thêm con, năng suất giảm, bạo loạn dễ nổ ra;
  - đói kéo dài thì người yếu (già, trẻ nhỏ) có thể chết.
- Chốt gác cổng chỉ mở khi đảo đã có tường thành (thời 2) và đủ người lớn: làng còn nhỏ thì người lớn lo làm ăn trước.

### 5.4 Lên cấp
- Mỗi thời có **giỏ tài nguyên** phải nộp đủ, cộng một **điều kiện xã hội**: đủ dân, bất bình dưới ngưỡng.
- Đủ điều kiện thì đảo bước sang thời mới. Lúc đó toàn bộ kiến trúc và trang phục của thời cũ bắt đầu được thay (đã có), tên người đứng đầu đổi theo thời (đã có).
- Giỏ tài nguyên các thời sau luôn đòi thứ đảo thiếu. Ví dụ thời Trung đại cần kim loại, thời Công nghiệp cần năng lượng.
- **Đảo nghèo và không chịu giao thương sẽ tụt lại.** Đây là chủ ý thiết kế.
- **Thay đổi kỹ thuật:** `eras.levelOfDay` (lên theo đồng hồ) được thay bằng mức cấp riêng của từng đảo. Phần hiển thị đọc cấp của từng đảo, thay cho một `G.level` chung.

---

## 6. Lớp 4 · Chiến lược của người đứng đầu

### 6.1 Ai quyết
- Người đứng đầu (ghế `king`) quyết định nước đi.
- Quân sư và hai tướng góp ý. Ý của họ cộng vào điểm của từng lựa chọn theo gen của chính họ.
- Người đứng đầu đa nghi thì ít nghe; người nhu nhược thì dễ bị kéo theo.

### 6.2 Xét tình hình (mỗi 10 ngày)
- Thiếu gì để lên thời sau, và còn bao lâu nữa.
- Lương thực còn đủ cho bao nhiêu ngày.
- So sánh sức mạnh quân với từng đảo bên cạnh.
- Quan hệ với từng đảo (mục 6.4).
- Bất bình trong đảo; đang có hiệp ước hay chiến tranh nào.

### 6.3 Các nước đi
Điểm của mỗi nước đi = nhu cầu × hợp tính người quyết × hoàn cảnh. Sau đó **bốc thăm có trọng số** (không phải luôn chọn điểm cao nhất), nên cùng một hoàn cảnh có thể ra nước đi khác nhau.

| Nước đi | Hợp với người | Khi |
|---|---|---|
| Tự phát triển (dồn người làm, xây) | trí tuệ, ít tham vọng | Đủ ăn, thiếu ít |
| Giao thương (đổi đặc sản lấy thứ thiếu) | mưu mô, trí tuệ | Có dư một thứ, thiếu thứ khác, quan hệ không xấu |
| Hiệp ước (không xâm phạm, liên minh) | mưu mô, trí tuệ | Bên cạnh mạnh hơn, hoặc có kẻ thù chung |
| Cứu trợ quân sự (gửi quân giúp, đổi lấy tài nguyên) | tham vọng, mưu mô | Đồng minh đang bị đánh |
| Tích quân | hiếu chiến, đa nghi | Thấy bên cạnh yếu đi hoặc đang đe doạ mình |
| Đột kích (cướp kho, không chiếm) | hiếu chiến, ít trí tuệ | Thiếu cấp bách, bên cạnh yếu hơn |
| Tổng tấn công (chiếm nhà chính) | hiếu chiến và tham vọng vượt trội | Quân mạnh hơn hẳn, đường sang thông |
| Cầu hoà | sợ hãi, nhu nhược | Đang thua |
| Phản bội hiệp ước | mưu mô cao, ít sùng đạo | Lợi lớn, bị phát hiện ít |

### 6.4 Quan hệ giữa hai đảo
Mỗi cặp đảo lưu các chỉ số sau. Chúng thay đổi theo từng việc đã xảy ra và phai dần theo thời gian:
- **Tin cậy:** tăng khi giao thương đúng hẹn, giữ hiệp ước, cứu trợ.
- **Sợ:** tăng khi bên kia mạnh lên hoặc vừa thắng trận.
- **Thù hằn:** tăng khi bị đột kích, bị phản bội, có người thân chết trong chiến tranh. Thù hằn truyền sang đời sau qua "chuyện kể" của người già.

### 6.5 Đã làm ở bước 4
- **Ai quyết** (`logic/strategy.js`): tính cách của người đứng đầu pha với quân sư và hai tướng. Mức nghe theo là 0,35 + 0,3·nhu nhược − 0,3·đa nghi, giới hạn trong 0,1–0,6. Mọi chỗ đều đọc tính cách biểu hiện.
- **Xét tình hình mỗi 10 ngày**, các đảo lệch nhau 2 ngày. Có ba nước đi:
  - **Thế quân:** phần dân làm lính trong khoảng 12–50%. Tăng khi hiếu chiến, đa nghi hay sợ đảo khác mạnh hơn; giảm khi hiền lành hay đang đói. `logic/jobs.js` đọc con số này.
  - **Giao thương:** tìm thứ đang thiếu nhất, chọn đảo có dư, đưa ra thứ mình dư mà bên kia quý nhất. Giá theo giá trị của hai bên; người mưu mô hơn mặc cả được giá tốt hơn, tin cậy làm giá mềm hơn. Bên kia có thể từ chối.
  - **Hiệp ước:** không xâm phạm (360 ngày) hay liên minh (540 ngày, khi hai bên đã tin nhau). Bên kia phải đồng ý.
- **Mua lương thực gấp:** kho còn dưới 20 ngày ăn hoặc đang đói thì ngày nào còn thương nhân rảnh cũng cho đoàn đi mua, không đợi kỳ xét. Người đa nghi vẫn có thể chần chừ.
- **Đói thì dồn người làm** (`logic/jobs.js`): chỉ giữ một thợ xây, không ai đi đường; chốt gác và người diễn thuyết vẫn giữ.
- **Đặc sản làm thêm để xuất khẩu** (`logic/economy.js`): kho dự trữ luôn chứa đủ giỏ của thời sau.
- **Quan hệ** (`logic/diplomacy.js`): mỗi chuyến buôn trọn vẹn tăng tin cậy 0,06; ký hiệp ước tăng 0,08, ký liên minh tăng 0,15. Tin cậy phai 0,3% mỗi ngày. Sợ tính theo sức mạnh quân (số lính × công nghệ). Thù hằn có chỗ lưu nhưng chưa có việc nào làm tăng (bước 5 sẽ có).
- **Đoàn buôn đi thật:** hàng rời kho lúc lên đường và tới nơi mới vào kho. Thời gian đi:
  - qua cầu 3 ngày;
  - đi thuyền sang đảo kề 6 ngày;
  - mỗi đảo xa hơn thêm 4 ngày.

  Chở được 60 đơn vị cho mỗi thương nhân, cộng thêm 10% cho mỗi thời. Mỗi đảo đi cùng lúc tối đa bằng số thương nhân của mình.
- **Cầu:** hai đảo kề nhau đã buôn trọn vẹn 3 chuyến, cùng từ thời 3, hai kho gộp lại đủ 80 gỗ và 80 đá. Mỗi bên góp một nửa, bên thiếu thì bên kia bù. Xét mỗi ngày.
- **Vẽ:**
  - Cầu do logic bắc thì hiện ra, dáng theo thời thấp hơn của hai đảo, lên thời thì đổi dáng (`render/build/bridges3d.js sync`).
  - Đoàn buôn: thuyền buồm, từ thời 7 là thuyền máy; qua cầu là xe hàng, hai chiều đi hai làn. Hàng tô màu theo thứ chở nhiều nhất (`render/travel3d.js`).
  - Tin giữa các đảo, ba dòng mới nhất, hiện ở góc dưới (dev).
- **Kết quả chạy 9 năm** (seed 1, 2, 3; có giao thương so với sáu đảo sống riêng):
  - Chết đói: **13 / 16 / 5** khi có giao thương, so với **57 / 69 / 46** khi sống riêng.
  - Mỗi trận có 4–5 cầu và 5–14 hiệp ước.
  - Phần lính 17–28%.
  - Đoàn buôn có mặt trên biển khoảng 35% số ngày.
  - Cấp cuối: 9,4,8,11,9,4 / 9,4,4,12,9,4 / 9,4,8,12,9,4.
  - Tuyết Trắng có thể chạm thời 12 nhờ mua được thứ mình thiếu.
  - Thông Xanh và Cát Hồng vẫn thường kẹt ở thời 4: thiếu người, đất nuôi ít. Đây là chỗ để bước 5 (chiến tranh) và bước 6 (cân chỉnh) xem lại.
- **Chưa làm** (để bước 5): cướp đoàn buôn, cầu quân sự, cứu trợ quân sự, phản bội hiệp ước. Đoàn buôn chưa đi qua đường trong đảo; thuyền cập bờ, xe chạy trên cầu.

---

## 7. Đường sang đảo khác, giao thương và chiến tranh

### 7.1 Đường đi
- Mỗi đảo kề hai đảo bên cạnh, qua chỗ hở tường đã chừa sẵn.
- **Thời đầu** chưa có cầu: sang bằng bè hay thuyền, chậm và chở được ít.
- **Cầu** do hai đảo cùng xây khi ký giao thương. Đảo đang chuẩn bị đánh cũng có thể tự xây một mình (cầu quân sự).
- Cầu làm đường đi nhanh hơn, chở được nhiều hơn, nhưng cũng là đường cho quân địch.

### 7.2 Giao thương
- Đoàn buôn (thương nhân và hàng hoá) đi thật trên bản đồ qua cầu hay thuyền.
- Đoàn buôn có thể bị cướp nếu có đảo thù địch nằm trên đường.
- Tỉ giá phụ thuộc độ khan hiếm hai bên và tài mưu mô của người đi buôn.

### 7.3 Chiến tranh và sáp nhập
1. **Tuyên chiến** (hay tấn công bất ngờ, nếu người quyết mưu mô): gọi quân, tướng dẫn quân sang.
2. **Đánh ở cổng.** Lính gác cổng phụ và tường thành giữ cửa. Kết quả mỗi đợt có ngẫu nhiên, nghiêng theo sức mạnh và sĩ khí. Thua liên tiếp thì sĩ khí rơi, quân tháo chạy.
3. **Vào trong thành, đánh tới nhà chính.** Dân trong thành phản ứng theo tính cách: người nóng nảy cầm vũ khí giữ nhà, người nhút nhát chạy trốn, người sùng đạo cầu nguyện.
4. **Chiếm được nhà chính thì đảo thua bị sáp nhập:**
   - toàn bộ tài nguyên trong kho chuyển sang đảo thắng;
   - toàn bộ dân và quân thành dân và quân của đảo thắng, nhưng vẫn sống trên đảo cũ;
   - đảo thắng cử một người trong hội đồng của mình sang làm người cai quản;
   - đảo bị sáp nhập dùng chung thời đại với đảo thắng, nhưng giữ kiến trúc riêng của đảo;
   - dân đảo bị sáp nhập mang **thù hằn** và **bất bình cao**, nên có thể nổi dậy giành lại độc lập. Đây là một drama mới; độc lập lại hay không là chuyện không đoán trước được.
5. **Chiến tranh không phải bao giờ cũng đi tới cùng.** Cầu hoà, đình chiến, bồi thường đều có thể xảy ra, tuỳ người quyết hai bên.

### 7.4 Đã làm ở bước 5
- **Ai đánh ai** (`logic/strategy.js` tryWar, mỗi kỳ xét 10 ngày, từ ngày 300; đánh xong nghỉ ít nhất 180 ngày):
  - **Hai kiểu đánh:**
    - *Đột kích:* hợp với người hiếu chiến, ít trí tuệ, đang thiếu thứ bên kia có, hay đang thù.
    - *Tổng tấn công:* hợp với người hiếu chiến, tham vọng, thù hằn. Chiếm cả đảo nên được tính nặng hơn ×1,5.
  - **Ai ngại đánh:** người sợ hãi, sùng đạo, nhu nhược.
  - **Hiệp ước:** có liên minh thì không đánh. Có hiệp ước thường thì chỉ người mưu mô (> 0,6) và ít sùng đạo (< 0,45) mới dám phản bội.
  - **Muốn đánh mà quân chưa đủ** thì tích quân trước (`pol.warlust` cộng vào thế quân). Đảo bên cạnh thấy vậy thì sợ, cũng tích quân theo.
  - **Lương thực:** đói hay còn dưới 30 ngày ăn thì giảm quân.
  - **Tương quan sức nhìn qua mắt người quyết:** tham vọng thì tự tin quá, đa nghi thì e dè, cộng may rủi. Vì vậy có trận đánh nhầm và thua.
  - **Đánh úp:** người mưu mô thì không tuyên chiến. Bên kia không được báo trước, đồng minh cũng không kịp gửi quân.
- **Gọi quân** (`logic/war.js`):
  - Lính của đảo và một nửa lính các đảo mình cai quản, cùng tướng dẫn quân.
  - Dân binh: đàn ông dưới 45 tuổi, máu chiến, đang làm việc thường. Sức đánh bằng 0,6 lính. Đi đánh thì bỏ việc ở nhà.
  - Quân là người thật (`p.away`): rời đảo, không làm ra tài nguyên, đi đường thật (thuyền hay qua cầu).
- **Đánh ở cổng phụ** phía quân tới. Bên thủ là lính, tướng ở nhà, hai lính gác cổng đó, quân đồng minh và quân đóng giữ. Lính gác cổng chính và cổng phía kia giữ chốt.
  - Tường thành chắc dần theo thời (×1,025 mỗi thời).
  - Đảo đang đói đánh chỉ bằng 70%; thiên tai đang có cũng làm yếu đi.
  - Mỗi ngày một đợt. Mỗi người có thể ngã xuống, khả năng theo tỉ lệ sức hai bên, có may rủi.
  - Sĩ khí dưới 0,25, hoặc còn dưới 30% quân, thì rút.
  - Người giữ cổng còn dưới 40% sức bên công thì cổng vỡ.
- **Đột kích:** trụ được 2 ngày ở cổng thì cướp một phần kho (theo tương quan sức) rồi về. Chiến lợi phẩm vào kho khi quân về tới nhà.
- **Vào thành:**
  - Người nóng nảy cầm vũ khí giữ nhà, người nhút nhát chạy trốn, người sùng đạo cầu nguyện. Bộ não người dân đọc `S.situ.war`; lính ra cổng phía bị đánh.
  - Đánh tới nhà chính mất 3 ngày.
- **Cầu hoà:** cứ 3 ngày bên thủ yếu thế có thể xin hoà và nộp một phần kho. Bên công nhận hay không tuỳ tính người đứng đầu; nhận thì ký không xâm phạm 360 ngày.
- **Đồng minh** (liên minh) có thể gửi khoảng 35% lính sang giúp. Quân đi thật, tới nơi mới vào trận.
- **Sáp nhập** khi chiếm được nhà chính:
  - Kho sang đảo thắng; lương thực để lại đủ 30 ngày cho dân.
  - Người cai quản là một người trong hội đồng đảo thắng, sang ngồi ghế vua; vua cũ bị phế.
  - Đảo bị sáp nhập dùng chung thời với đảo thắng và giữ kiến trúc riêng. Mỗi ngày phần dư trong kho nộp về đảo thắng.
  - 40% quân thắng ở lại đóng giữ ít nhất 360 ngày, tới khi dân yên mới về.
  - Đảo thắng mà bị sáp nhập thì các đảo nó cai quản cũng sang tay kẻ thắng mới.
- **Nổi dậy:**
  - Bất bình tăng theo thù hằn, tính nóng của dân, đói; nguôi dần khi yên ổn.
  - Đảo cai quản có người đứng đầu cứng rắn thì gửi thêm quân đóng giữ.
  - Sau 180 ngày, bất bình trên 0,55 thì có thể nổi dậy. Người nóng nảy theo mức bất bình, đánh như dân binh. Lính theo phe nổi dậy với khả năng 15% + 40% × thù hằn.
  - Thắng thì độc lập lại; người cai quản bị đuổi về.
- **Thù hằn** tăng theo từng người chết trận. Phản bội làm mọi đảo bớt tin kẻ phản bội.
- **Vẽ** (`render/war3d.js`):
  - Lính mặc màu đảo mình, cầm giáo.
  - Hành quân: thuyền chiến cắm cờ màu đảo, hay hàng quân qua cầu.
  - Đánh ở cổng: hai hàng quân trước cổng phụ.
  - Vào thành: quân tiến dần tới nhà chính.
  - Sau sáp nhập: cờ đảo cai quản ở sân trước nhà chính đảo bị sáp nhập, quân đóng giữ đứng quanh cờ.
  - Người đi đánh không còn vẽ ở đảo nhà.
- **Kết quả chạy 9 năm, 30 seed:**
  - 125 trận, khoảng 4 trận mỗi trận đấu: 96 đột kích, 28 lần tổng tấn công.
  - 7 lần sáp nhập, ở 7 trận đấu khác nhau.
  - 7 cuộc nổi dậy: 3 giành lại độc lập, 4 bị dập tắt.
  - Cuối trận: 26 trận đấu cả 6 đảo độc lập, 4 trận đấu còn 5. Đảo thắng nhiều nhất khác nhau giữa các trận đấu (Cửa Sóng 2, Tuyết Trắng 1, Cát Hồng 1).
  - So với tắt chiến tranh (10 seed): chết đói gần như bằng nhau (183 so với 181); phần lính trung bình 27% so với 21%.
- **Chưa đạt, chưa làm:** gom hết vào bước 6 (mục 12.1).

---

## 8. Nền · Môi trường (hệ thống tự sinh)

- **Khí hậu theo mùa của từng đảo:**
  - Lúa Vàng: hạn hán mùa hè, lũ.
  - Tuyết Trắng: bão tuyết mùa đông.
  - Cửa Sóng: bão biển.
  - Cát Hồng: bão cát, nắng nóng.
  - Đá Mây: sạt lở.
  - Thông Xanh: cháy rừng.
- **Thiên tai lớn hiếm gặp:** dịch bệnh, mất mùa liên tiếp.
- **Tác động:** hệ số sản xuất của ngày; áp lực lên ngoại gen (mục 3); có thể làm hỏng công trình, cầu.
- **Ngày đêm và trời tím (đã chốt):**
  - Trời chỉ chuyển sang tím, không còn ngày đêm, khi **cả 6 đảo đều đã tới thời 10**, tức khi đảo cuối cùng tới thời 10.
  - Đảo bị sáp nhập dùng cấp của đảo đã chiếm nó.
  - Trước đó trời vẫn có ngày đêm. Đảo nào đã tới thời 10 thì vẫn có mặt trời nhân tạo và thành phố neon của riêng nó.
- **Sau này**, vai trò của người chơi (khi chốt) sẽ là một nguồn tác động thêm vào lớp này. Các lớp trên không phải sửa gì.

---

### 8.1 Đã làm ở bước 3
- **Thiên tai theo đảo và theo mùa** (`logic/climate.js`):
  - Lúa Vàng: hạn hán mùa hạ, lũ mùa xuân.
  - Thông Xanh: cháy rừng.
  - Đá Mây: sạt lở, rét đậm.
  - Tuyết Trắng: bão tuyết mùa đông.
  - Cửa Sóng: bão biển mùa thu.
  - Cát Hồng: bão cát, nắng nóng.
  - Mọi đảo: dịch bệnh hiếm gặp.
- **Mỗi thiên tai có:**
  - hệ số sản xuất từng loại tài nguyên;
  - độ căng thẳng;
  - có bắt dân trú trong nhà không (bão; lính gác vẫn giữ chốt);
  - khả năng người yếu mất.
  Mức nặng nhẹ mỗi lần một khác.
- **Ngoại gen** (`logic/epigen.js`):
  - Tính cách biểu hiện = gen gốc + dấu ngoại gen. Mọi chỗ ra quyết định đọc tính cách biểu hiện (`People.traits`); lai gen dùng gen gốc.
  - Dấu tăng theo nghịch cảnh:
    - đói: đa nghi và hiếu chiến tăng;
    - thiên tai: người vốn sợ thì càng sợ, ai cũng sùng đạo hơn;
    - chiến tranh: người gan càng hiếu chiến, người nhát càng sợ;
    - mất người thân: sùng đạo và sợ hãi tăng.
  - Dấu phai dần khi yên ổn. Con nhận 40% dấu của mẹ. Sinh ra lúc đảo khổ thì đột biến nhiều tới 2,5 lần.
- **Kết quả chạy thử:** khi chưa có giao thương, các đảo thiếu lương thực (Thông Xanh, Đá Mây, Cát Hồng) đói triền miên. Dân dần hoá nóng nảy, có trận tới 29/36 người lớn, trong khi đảo no đủ gần như không đổi tính. Đây là mầm cho đột kích và chiến tranh ở bước 5.

## 9. Vì sao kết quả không đoán trước được, mà vẫn hợp lý

| Nguồn | Cách |
|---|---|
| Gen | Mỗi người một bộ gen lai cộng đột biến; người đứng đầu đổi qua các đời |
| Ngoại gen | Cùng một người, nghịch cảnh khác thì hành xử khác |
| Bốc thăm có trọng số | Nước đi chiến lược, drama, trận đánh đều có phần may rủi, nhưng nghiêng theo tính cách và sức mạnh |
| Chuỗi phản ứng | Đói dẫn tới bất bình, bạo loạn, đảo chính, người đứng đầu mới, đổi chiến lược |
| Quan hệ có trí nhớ | Thù hằn, tin cậy truyền đời; phản bội để lại hậu quả lâu dài |
| Khí hậu | Thiên tai rơi đúng lúc yếu có thể lật thế trận |

**Kiểm chứng bằng chạy giả lập hàng loạt** (Node, không cần vẽ): chạy 100 trận với 100 seed khác nhau, rồi đo phân bố kết quả. Ví dụ:
- không đảo nào luôn thắng;
- có trận cả 6 đảo còn sống, có trận chỉ còn 2–3;
- số cuộc chiến, số lần đảo chính, cấp cuối của mỗi đảo đều trải rộng nhưng hợp lý.

---

## 10. Giao diện dev (không phải giao diện người chơi)

- **Giữ nguyên:** xem cả 6 đảo, bảng làng, thẻ người, các nút thử.
- **Thêm bảng dev "Cuộc đua":** mỗi đảo một dòng, gồm cấp, dân, quân, kho 6 tài nguyên, bất bình, người đứng đầu (kèm tính cách nổi trội), nước đi chiến lược đang theo, quan hệ với hai đảo bên cạnh, chiến tranh và hiệp ước đang có.
- **Nhật ký chung của bể:** các sự kiện lớn (ký hiệp ước, tuyên chiến, sáp nhập, đảo chính, lên thời).
- **Bảng làng và thẻ người dùng được cho mọi đảo**, không riêng Lúa Vàng.

---

## 11. Tệp nào lo việc gì (dự kiến)

| Việc | Tệp |
|---|---|
| Cả bể: 6 đảo, lịch chung, thứ tự chạy, seed | `logic/world.js` (mới; khác `game/world.js` vốn lo phần chạy game) |
| Một đảo (đã có, mở rộng cho 6 đảo, nét gen và gia tộc từng đảo) | `logic/island.js` |
| Ngoại gen | `logic/epigen.js` (mới) |
| Tài nguyên, sản xuất, kho, lên cấp | `logic/economy.js` (mới); `logic/eras.js` giữ danh sách thời và giỏ tài nguyên |
| Khí hậu, thiên tai | `logic/climate.js` (mới) |
| Não chiến lược của người đứng đầu | `logic/strategy.js` (mới) |
| Quan hệ, hiệp ước, giao thương | `logic/diplomacy.js` (mới) |
| Quân đội, trận đánh, sáp nhập | `logic/war.js` (mới) |
| Bất bình, đảo chính, nổi dậy | `logic/dramas.js` (thêm dòng drama) và một chỉ số trong `logic/island.js` |
| Đoàn buôn, sứ giả, quân hành quân trên bản đồ | `render/travel3d.js` (mới, dùng lối đi `render/nav3d.js` và cầu) |
| Bảng dev "Cuộc đua", nhật ký chung | `ui/race-dev.js` (mới) |

Toàn bộ `logic/` chạy được bằng Node, không vẽ gì, để chạy giả lập hàng loạt và kiểm thử.

---

## 12. Lộ trình

Mỗi bước đều có bài kiểm thử chạy bằng Node.

| Bước | Làm | Xong khi |
|---|---|---|
| 1 ✅ | Dân cho 6 đảo: `logic/world.js` (đồng hồ chung, bước cố định), gia tộc và nét gen riêng, hiển thị dân ở đảo gần camera (`game/cities.js`); người đi, xe chạy theo giờ game | Cả 6 đảo có dân, đủ vị trí cứng; cùng seed chạy 1×, 2×, 4× ra cùng lịch sử (`test/world.test.js`) |
| 2 ✅ | Kinh tế và lên cấp theo tài nguyên (`logic/economy.js`, giỏ ở `logic/eras.js`); mỗi đảo một cấp riêng | Các đảo lên cấp khác nhau; khi chưa có giao thương, đảo nào cũng dừng ở thời bắt đầu cần thứ mình gần như không có (`test/economy.test.js`) |
| 3 ✅ | Khí hậu và ngoại gen (`logic/climate.js`, `logic/epigen.js`); mọi chỗ ra quyết định đọc tính cách biểu hiện | Mỗi đảo đúng thiên tai của mình; đói lâu làm dân đa nghi, hiếu chiến; con sinh lúc khổ đột biến nhiều hơn (`test/climate.test.js`) |
| 4 ✅ | Chiến lược, quan hệ, giao thương (đoàn buôn đi thật, xây cầu): `logic/strategy.js`, `logic/diplomacy.js`, `render/travel3d.js` | Có giao thương và hiệp ước; quan hệ có trí nhớ; giao thương làm số người chết đói giảm hơn một nửa (`test/strategy.test.js`) |
| 5 ✅ | Chiến tranh và sáp nhập (quân đi thật, đánh ở cổng, chiếm nhà chính): `logic/war.js`, `logic/strategy.js` tryWar, `render/war3d.js` | Có trận sáp nhập; đảo bị sáp nhập có thể nổi dậy, thắng hay thua không đoán trước (`test/war.test.js`) |
| 6 ✅ | Giải quyết nốt mọi việc chưa ổn của bước 2–5 (mục 12.1); bảng dev "Cuộc đua", nhật ký chung; cân chỉnh bằng chạy hàng loạt | Hết danh sách 12.1; phân bố kết quả 100 trận đạt mục tiêu ở mục 9 |
| 7 | NPC sống thật và hệ sinh thái hỗn loạn (`design/npc-song-that.md`, làm theo 7a–7g): <ul><li>không hành động vô nghĩa suốt vòng đời;</li><li>sự kiện thành cảnh có hành động thật;</li><li>cầu do người đứng đầu quyết, là lối đi và chiến tuyến;</li><li>đánh thành theo thứ tự cổng → công trình xung quanh → nhà chính;</li><li>tên lửa từ thời 7, hạt nhân từ thời 8 (4 quả là san phẳng);</li><li>môi trường cạn dần, chạy nạn, dịch bệnh, đảo chính, chiến tranh lan rộng.</li></ul> | <ul><li>Kiểm thử ghi 0 cử chỉ vô nghĩa và 0 sự kiện không có cảnh.</li><li>Có chuỗi ảnh mỗi sự kiện.</li><li>Khung hình trên điện thoại không tụt.</li><li>Cùng seed ra cùng lịch sử.</li></ul> |
| (sau) | Vai trò người chơi: thêm vào lớp Môi trường hay lớp khác khi chốt | – |

### 12.1 Bước 6: việc chưa ổn gom lại

**Dân số và lên cấp**
0. **Dân số tối đa một đảo là 100 người** (đã chốt; trước đây là 50). Phải xem lại theo:
   - số nhà;
   - lương thực;
   - phần người làm, lính;
   - độ nặng khi vẽ trên điện thoại.
1. **Cơ cấu dân lệch.** Có lúc 13–17 người già trên 50 dân.
   - Chín chốt cứng (gác cổng, diễn thuyết) chiếm gần nửa số người lớn làm việc.
   - Hệ quả: mỗi đảo chỉ còn 2–7 lính và ít người làm.
   - Cần xem lại tuổi già, nhịp sinh, trần dân, hay mở chốt theo số dân (chốt vẫn đúng kịch bản 4 + 2 + 2 + 1 khi đảo đủ người).
2. **Thông Xanh và Cát Hồng hay kẹt ở thời 4**, và vẫn có người chết đói (khoảng 18 người mỗi trận đấu). Lý do: thiếu người, đất nuôi ít.
3. **Thông Xanh thường là đảo bị đánh**, vì yếu nhất.

**Chiến tranh**

4. **Chiến tranh còn nhẹ hơn mục tiêu ở mục 9.** Chạy 30 trận đấu, nhiều nhất mới mất 1 đảo; chưa có trận đấu nào chỉ còn 2–3 đảo.
5. **Nhịp trận quá nhanh để nhìn:** một ngày logic dài 1,33 giây ở 1×.
   - Đánh theo từng giờ (1/12 ngày), thay vì từng ngày.
   - Vây cổng, đánh vào thành, nổi dậy kéo dài nhiều ngày; nổi dậy không giải quyết gọn trong một ngày nữa.
   - Đây là phần logic cần cho bước 7, nên làm trước khi cân chỉnh.
6. **Kiểm lại hướng cổng:** cổng phụ trái, phải (`logic/posts.js` gateLeft, gateRight) có đúng phía đảo bên cạnh `L.landing[0]`, `L.landing[1]` không.
7. **Chưa làm:**
   - cướp đoàn buôn trên đường khi có đảo thù địch;
   - cầu quân sự (một đảo tự bắc cầu để đánh);
   - người đứng đầu xét giúp đỡ đảo mình đang cai quản khi nó đói.

**Giao thương**

8. **Đoàn buôn chưa đi trên đường trong đảo:** thuyền cập bờ, xe chỉ chạy trên cầu. Việc khuân hàng từ kho ra bến làm ở bước 7.

**Trận mở mặc định và dev**

9. **Trận mặc định (seed 42) chỉ có 2 lần đột kích.** Chọn seed mặc định sau khi cân chỉnh, hoặc để dev chọn seed.
10. **Bảng dev "Cuộc đua" và nhật ký chung đầy đủ** (mục 10). Mỗi tin trong nhật ký bấm vào thì bay máy quay tới chỗ đó.
11. **Nhật ký chỉ giữ 600 dòng mỗi đảo, 400 dòng cả bể.** Bảng dev cần đếm theo số liệu (`W.warStats`…), không đếm chữ.

**Dọn dẹp và cân chỉnh**

12. **Dọn chỗ thừa:** `Rules.NAMED_CAP` không còn dùng.
13. **Cân chỉnh bằng 100 trận** sau khi xong các mục trên:
    - phân bố cấp cuối;
    - số trận đánh, sáp nhập, nổi dậy, chết đói;
    - đảo nào thắng.

### 12.2 Đã làm ở bước 6

| Mục | Kết quả |
|---|---|
| 0. Dân 100 | ✅ `Rules.POP_CAP` = 100. Vẫn 20 nhà mỗi đảo, trung bình 5 người một nhà (hộ nhiều thế hệ ở chung). Thêm nhà thì phải sửa bố cục 6 đảo × 12 thời, để sau nếu cần. Người được vẽ gộp theo bộ phận: gần một đảo đủ dân, số lần vẽ chỉ từ 75 lên 81 (máy thử). Điện thoại thật chưa đo. |
| 1. Cơ cấu dân | ✅ Luật chết Gompertz (`logic/people.js`): rủi ro tăng gấp đôi sau khoảng 8 năm tuổi, người trẻ có thể mất vì bệnh, y học tốt dần theo thời. Người già còn 10–16% (trước có lúc 40%). Chín chốt cứng giờ chỉ chiếm phần nhỏ trong 100 dân. |
| 2. Kẹt thời 4, chết đói | ✅ Tìm ra hai lỗi kinh tế có từ bước 2. <ul><li>Phần chia việc đòi lương thực vượt trần kho, nên không bao giờ đủ và cả làng làm ruộng mãi.</li><li>Năng suất ước thấp hơn thật; nay đo năng suất thật.</li></ul> Thêm: giỏ tài nguyên nhân `BASKET_SCALE` 2,2 cho 100 dân; Thông Xanh đủ lương thực (rừng săn bắt, hái lượm); cá của Tuyết Trắng bằng Cửa Sóng (trước đây Tuyết Trắng luôn chạm thời 12). |
| 3. Thông Xanh luôn bị đánh | ✅ Có **kẻ thù chung**: hai đảo cùng sợ hay cùng thù một đảo thứ ba thì dễ ký hiệp ước, liên minh, gửi quân giúp nhau. Thông Xanh bị đánh giảm từ 381 xuống 66 lần (100 trận cũ so với 50 trận mới). Nay đảo yếu nhất là Cát Hồng (sa mạc), bị đánh nhiều nhất. Kẻ mạnh đánh kẻ yếu là thật, nhưng không còn lệch hẳn về một đảo. |
| 4. Chiến tranh còn nhẹ | ✅ Xem kết quả cân chỉnh ở dưới. |
| 5. Nhịp trận | ✅ Đánh theo từng giờ: `World.tick` gọi `War.step` mỗi bước cố định 1/12 ngày; tua nhanh cũng chạy 12 đợt mỗi ngày. <ul><li>Sĩ khí đổi theo chênh lệch thiệt hại hai bên.</li><li>Vào thành 5 ngày.</li><li>Nổi dậy thành trận nhiều ngày (`W.wars`, kind `revolt`): lính bản đảo chia ba phe (theo dân, đứng ngoài, giữ phe kẻ chiếm); người cầm đầu chờ thời; thất bại thì 180 ngày sau mới gượng dậy được.</li><li>Quân đóng giữ có trần 15% người lớn.</li><li>Đột kích chỉ khi mạnh hơn hẳn.</li></ul> |
| 6. Hướng cổng | ✅ Đã kiểm: cổng phụ trái (`gateL`) là `wallGaps[1]`, hướng `landing[0]`; cổng phải hướng `landing[1]`. Khớp với `War.sideOf`. |
| 7. Cướp đoàn buôn, cứu đói | ✅ Đoàn đi thuyền ngang qua đảo khác có thể bị đảo đó cướp (`Diplomacy.path`, `rob`), do người đứng đầu quyết theo tính cách và thù hằn. Đảo cai quản gửi lương thực cứu đói cho đảo mình chiếm (`Diplomacy.gift`), dân bớt bất bình. Cầu quân sự chuyển sang bước 7 (mục 7.2 của `design/npc-song-that.md`). |
| 8. Đoàn buôn trên đường trong đảo | Chuyển sang bước 7 (khuân hàng từ kho ra bến). |
| 9. Trận mặc định | ✅ Seed 7. Chạy theo nhịp chơi thật thì có: Cửa Sóng xé hiệp ước, đánh úp, chiếm Cát Hồng (ngày 642), rồi chiếm Đá Mây (ngày 1717); Lúa Vàng hai lần đánh trả không thành; Tuyết Trắng chặn cướp đoàn buôn. |
| 10, 11. Bảng dev, nhật ký | ✅ `ui/race-dev.js`: bấm ô tin ở góc dưới thì mở bảng "Cuộc đua". Mỗi đảo một thẻ: thời, dân, lính, kho, người đứng đầu và tính cách, thế quân, thuộc ai, đang đánh ai, hiệp ước, cầu. Số liệu cả bể đếm từ người và `W.warStats`, không đếm chữ. Nhật ký 40 tin, bấm thì bay tới đảo. Ô tin chuyển từ `game/cities.js` sang tệp này. |
| 12. Dọn chỗ thừa | ✅ Bỏ `NAMED_CAP`. |
| 13. Cân chỉnh | ✅ Kết quả ở dưới. |

**Kết quả cân chỉnh cuối** (50 trận 9 năm, seed 1–50, tua theo ngày):
- **Số đảo còn độc lập cuối trận:** 26 trận còn 6, 18 trận còn 5, 3 trận còn 4, 2 trận còn 2, 1 trận chỉ còn 1 (một đảo thống nhất cả bể).
- **Không đảo nào luôn thắng:** đảo có cấp cao nhất là Đá Mây và Tuyết Trắng mỗi đảo 22 trận, Cửa Sóng 19, Lúa Vàng 5, Thông Xanh 2, Cát Hồng 2.
- **Cấp cuối trung bình:** Lúa Vàng 9,8; Thông Xanh 8,9; Đá Mây 9,7; Tuyết Trắng 9,9; Cửa Sóng 10,1; Cát Hồng 9,1. Mỗi đảo đều có trận chạm thời 12; thấp nhất là thời 5.
- **Mỗi trận đấu:** 8,6 trận đánh (1–33), 2,9 đột kích, 5,7 tổng tấn công, 1,5 lần sáp nhập (0–22), 0,3 cuộc nổi dậy (11 lần độc lập lại trong 50 trận), 0,5 vụ cướp đoàn buôn, 61 người chết trận, 1,8 người chết đói.

**Còn lệch, ghi lại để theo dõi:**
- Chết đói rất thấp (1,8 mỗi trận đấu). Đói là một nguồn hỗn loạn; bước 7f (môi trường cạn dần, dịch bệnh, chạy nạn) sẽ thêm vào.
- Cát Hồng bị đánh nhiều nhất (173 trên 50 trận), vì là đảo nghèo nhất.
- Nổi dậy hiếm (0,3 mỗi trận đấu) nhưng thường thành công khi đã nổ ra.
- Cùng một seed, tua theo ngày (dev) và chạy theo giờ (chơi thật) ra lịch sử khác nhau. Phân bố thống kê thì giống nhau.
