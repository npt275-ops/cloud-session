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
| Đá Mây (núi) | Đá, Kim loại | – | Lương thực |
| Tuyết Trắng (băng nguyên) | Năng lượng (than, dầu, gió), cá | Đá | Gỗ, Lương thực trồng trọt |
| Cửa Sóng (biển) | Hàng quý (muối, ngọc trai), cá | Gỗ | Kim loại |
| Cát Hồng (sa mạc) | Hàng quý (đá quý), Năng lượng (mặt trời) | Đá | Lương thực, Gỗ |

### 5.3 Sản xuất và tiêu dùng (mỗi ngày)

`sản xuất = số người làm × năng suất × độ giàu của đảo × khí hậu × mức công nghệ của thời`

- **Năng suất cá nhân** lấy từ gen: trí tuệ cao làm giỏi hơn; sợ hãi và nhu nhược cao làm kém hơn. Có cộng thêm ngoại gen và độ no đói.
- **Khí hậu** là hệ số của ngày đó: hạn hán, bão tuyết, mùa đông…
- **Tiêu dùng:** mỗi người ăn một phần lương thực mỗi ngày. Quân ăn nhiều hơn. Công trình đang xây trừ dần vật liệu.
- **Kho:** có sức chứa. Đầy thì sản xuất dư bị bỏ phí. Nhà kho và chợ nâng sức chứa.

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
- **Ngày đêm:** đã có. Thời 10 trở đi trời tím, không còn ngày đêm. Đề xuất: bầu trời theo đảo có cấp cao nhất ("mặt trời mất" là chuyện của cả bể), còn mặt trời nhân tạo chỉ có ở đảo nào đã tới thời 10.
- **Sau này**, vai trò của người chơi (khi chốt) sẽ là một nguồn tác động thêm vào lớp này. Các lớp trên không phải sửa gì.

---

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
| 1 | Dân cho 6 đảo: `logic/world.js`, gia tộc và nét gen riêng, hiển thị dân ở đảo gần camera | Cả 6 đảo có dân sống đủ 9 năm, đủ vị trí cứng và drama |
| 2 | Kinh tế và lên cấp theo tài nguyên; mỗi đảo một cấp riêng (bỏ `G.level` chung) | Chạy 100 seed: các đảo lên cấp khác nhau; đảo cô lập tụt lại |
| 3 | Khí hậu và ngoại gen | Nghịch cảnh làm đổi hành vi và đổi tỉ lệ đột biến đo được |
| 4 | Chiến lược, quan hệ, giao thương (đoàn buôn đi thật, xây cầu) | Có giao thương và hiệp ước; quan hệ có trí nhớ |
| 5 | Chiến tranh và sáp nhập (quân đi thật, đánh ở cổng, chiếm nhà chính) | Có trận sáp nhập; đảo bị sáp nhập có thể nổi dậy |
| 6 | Bảng dev "Cuộc đua", nhật ký chung; cân chỉnh bằng chạy hàng loạt | Phân bố kết quả 100 trận đạt mục tiêu ở mục 9 |
| (sau) | Vai trò người chơi: thêm vào lớp Môi trường hay lớp khác khi chốt | – |
