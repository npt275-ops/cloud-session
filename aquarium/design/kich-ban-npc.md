# Bể Kính · Kịch bản tổng của NPC (9 năm, 12 thời kỳ)

Đã chốt hướng; làm dần theo quy trình 7 bước ở cuối. Bước nào đã làm thì ghi "(đã có)".

## 1. Nguyên tắc: không ai làm việc vô nghĩa
Mỗi NPC luôn chạy vòng: **Đầu vào → Quyết định → Hành động → Đầu ra**, bước nào cũng nhìn thấy được.

| Bước | Nghĩa | Người chơi thấy |
|---|---|---|
| Đầu vào | nhu cầu, vai trò, giờ trong ngày, mùa, thời kỳ, tình huống của làng, quan hệ, gen | thẻ người: "đói", "mệt", "lo vì hạn hán" |
| Quyết định | chọn một việc, kèm lý do | thẻ người: "đi gặt, vì làng sắp hết lương thực" |
| Hành động | đi tới đúng chỗ, đúng cử chỉ, đúng nét mặt, có thời lượng | người ra ruộng, cầm liềm, gặt |
| Đầu ra | việc xong thì thế giới đổi | kho lương tăng, công trình dựng thêm, quan hệ tốt lên, nhật ký có một dòng |

Luật chống "đơ": không đứng yên quá khoảng 8 giây mà không có cử chỉ; tới nơi là làm ngay; nói chuyện thì quay mặt vào nhau;
nghỉ cũng là việc có lý do (ngồi bếp lửa, ngủ trong nhà); việc nào cũng phải có đầu ra.

## 2. Năm tầng kịch bản (tầng trên đặt khung, sự kiện ngắt theo ưu tiên)
1. **9 năm, 12 thời**: mỗi thời một chủ đề, một thử thách, một phát minh để lên thời.
2. **Mùa**: xuân gieo hoặc hái; hạ chăm ruộng, có thể hạn; thu gặt và lễ hội; đông ở nhà, việc trong nhà, người già dễ ốm.
3. **Ngày** (một vòng ngày đêm khoảng 3 phút ở 1×): sáng đi làm, trưa ăn nghỉ, chiều làm, tối tụ bếp lửa hoặc sân làng, đêm vào nhà ngủ, lính đổi ca.
4. **Đời người**: trẻ chơi và theo cha mẹ → học nghề → kết đôi, có con → già kể chuyện → mất, đám tang, để tang.
5. **Sự kiện (Chaos)**: hạn hán, lũ, chiến tranh, cãi nhau, đảo chính, lễ hội, phát minh, dịch.
   Ưu tiên: nguy hiểm > tang lễ > lệnh hội đồng > nhu cầu bức thiết > lịch ngày.

## 3. Đầu vào: 5 nhu cầu (0..1)
No (ăn ở nhà, bếp chung, lấy từ kho lương) · Sức (ngủ, nghỉ) · Vui (trò chuyện, lễ hội, gia đình) · An toàn (gần lính, cầu nguyện,
vào nhà) · Chí hướng theo gen (tham vọng: lên ghế; sùng đạo: ra đền; mưu mô: kết bè). 8 người cốt lõi có chí hướng sinh chuyện
(tranh ghế, tướng bất mãn, quân sư âm mưu); dân thường chủ yếu theo 4 nhu cầu đầu và lịch ngày.

## 4. Đầu ra: 6 tài nguyên của làng
Lương thực (nông dân) · Vật liệu (thợ) · Tri thức (học giả, quân sư, người già: mở phát minh, lên thời) · Đức tin (tư tế) ·
Quân lực (lính, tướng) · Của cải (thương chủ, chợ). Lên thời dựa vào đầu ra (tri thức, dân số, công trình), lịch 9 năm là giới hạn.

## 5. Một động từ, mỗi thời một cách làm
| Vai | Động từ | Đồ đá | Trung đại | Công nghiệp | Robot AI |
|---|---|---|---|---|---|
| Nông dân | làm ra lương thực | hái lúa dại | cuốc, gặt liềm | lái máy cày, vác bao | điều khiển robot |
| Lính | canh giữ | đi săn, giáo đá | tuần tra, giáo khiên | gác cổng, súng trường | đứng cạnh drone |
| Thợ | dựng nhà | ghè đá | đóng búa | làm trong xưởng | lắp mô-đun |
| Tư tế | giữ đức tin | nhảy cầu mưa | cầu nguyện ở đình | giảng ở toà | thiền dưới cột sáng |
| Người đứng đầu | điều hành | ra lệnh bên lửa | thiết triều | diễn thuyết | họp hội đồng |
| Trẻ em | lớn lên | chạy chơi quanh lửa | chăn trâu, học chữ | đến trường | học với robot |

## 6. Quy trình dựng, 7 bước
1. Logic nhu cầu và tài nguyên (`logic/needs.js`, `logic/economy.js`), kiểm thử chạy 9 năm.
2. Lịch ngày theo vai (`logic/schedule.js`) **(đã có: sáng, trưa, chiều, tối, đêm)**.
3. Thư viện việc làm (`logic/tasks.js`): đầu vào, chỗ, thời lượng, động từ, đầu ra **(đã có, bản đầu)**.
4. Bộ não chọn việc theo sự kiện → lệnh → nhu cầu → lịch, kèm lý do **(đã có phần sự kiện và lịch)**.
5. Phần vẽ dùng thư viện 65 cử chỉ, đồ cầm theo thời, nét mặt theo việc **(đã có)**.
6. Lên thời bằng tài nguyên; nhật ký kể chuyện.
7. Đo "không đơ" tự động khi chạy 9 năm không giao diện (người đứng yên quá lâu dưới 2%, việc có đầu ra 100%).

## 7. Công trình đi cùng NPC: giữ lại, tự mọc tự đổi tại chỗ
Công trình của các thời trước không biến mất. Mỗi thời có danh sách công trình (render/build/plains/eNN.js); thợ làm lần lượt,
bắt đầu từ nhà chính (`logic/construction.js`):
- Công trình mới trùng chỗ một công trình cũ: **lên đời tại chỗ**. Thợ đứng làm ở đó; cái cũ lún dần xuống, cái mới mọc lên
  đúng chỗ đó (không giàn giáo, như bản cũ).
- Công trình mới ở chỗ trống: **dựng mới**, mọc dần từ mặt đất.
- Mỗi thời có 20 nhà riêng cho dân (mỗi hộ một nhà, bố mẹ và con) và các công trình ngoài làng: bến, thuyền, nhà trong rừng,
  tháp canh, đền rừng, trại ngoài, hải đăng, công trình ngoài khơi.
- Cái cũ không có gì thay thì giữ nguyên qua các thời. Khi không còn gì phải dựng, thợ đi vòng tu bổ nhà cửa.

## 8. Dàn vai cố định: tối đa 50 người, ai cũng có việc chính
Chỉ những NPC có mục đích. Vai chọn theo tính cách (gen), việc chính giữ nguyên qua mọi thời, chỉ cách làm đổi theo thời.

| Vai | Số người | Chọn theo tính cách | Việc chính (sáng, chiều) | Ở đâu |
|---|---|---|---|---|
| Người đứng đầu | 1 | tham vọng, trí tuệ, không nhu mì | đứng chỉ đạo cả làng (ra lệnh, chỉ tay, khoanh tay) | trước nhà chính |
| Quân sư | 1 | khôn khéo, trí tuệ | bàn việc với người đứng đầu | trước nhà chính |
| Tướng | 2 | hiếu chiến, gan dạ | luyện quân, đi kiểm tra chốt gác | bãi tập, chốt gác |
| Tư tế (tôn giáo) | 1 | sùng đạo, hiền | cầu nguyện, làm lễ | chỗ thờ (cột tô tem, cây đa, đá vẽ…) |
| Thầy thuốc (y tế) | 1 | trí tuệ, nhu mì, không hiếu chiến | đi thăm bệnh từng nhà | lần lượt các nhà |
| Thợ xây | 4 (kể cả thợ cả) | khéo, gan, không đa nghi | dựng mới, sửa, nâng cấp; hết việc thì tu bổ | chỗ đang dựng |
| Thương nhân | 2 (kể cả thương chủ) | khôn khéo, có chí | bán hàng | chợ, kho, quầy |
| Lính | khoảng 30% người lớn còn lại | máu chiến nhất | gác, đi tuần, luyện võ (hiếu chiến luyện trước, đa nghi gác trước) | chốt gác, mép làng |
| Người đi đường | khoảng 40% dân còn lại | hướng ngoại, ít đa nghi | đi qua lại, ra chợ mua đồ, gặp người quen trò chuyện | đường, chợ, cửa nhà |
| Nông dân | số dân còn lại | chăm, hiền | làm ruộng | ruộng |
| Người già, trẻ em | theo tuổi | | người già ngồi trước nhà, kể chuyện; trẻ đi học, phụ ruộng | nhà, trường, sân |

Trưa về nhà ăn (người đứng đầu, người bán hàng, một phần lính vẫn ở chỗ mình). Tối tụ ở sân làng, không ở nhà chính. Đêm về ngủ.

**Nhà chính chỉ đông khi biểu tình, bạo loạn.** Hạn hán kéo dài thì dân bất bình: người đa nghi, hiếu chiến, khôn lỏi kéo tới
nhà chính đối mặt người đứng đầu, lính và tướng ra giữ trật tự, người nhát ở trong nhà. Tang thì ở nhà hay ra chỗ thờ, chiến
tranh thì người không đánh về nhà, không ai tụ ở nhà chính.

Dân số: các lứa tuổi giữ đều nhau (trẻ em tối đa khoảng 28% của 50), sinh rải đều giữa hai mốc thế hệ, làng đủ 50 người thì
không đón người ngoài vào. Làng giữ khoảng 45 tới 50 người suốt 9 năm.
