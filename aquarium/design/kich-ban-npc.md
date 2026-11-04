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

## 7. Công trình đi cùng NPC (đã có)
Mỗi thời có danh sách công trình (render/build/plains/eNN.js). Đầu thời, thợ bắt đầu dựng nhà chính của thời mới, rồi lần lượt
các công trình khác (`logic/construction.js`): chỗ đang dựng có giàn giáo, thợ đứng đóng búa, công trình mọc dần lên; dựng xong
thì công trình cũ của thời trước ở chỗ đó được dỡ đi, nhật ký ghi "dựng xong". Hết thời thì mọi công trình của thời đã xong.
