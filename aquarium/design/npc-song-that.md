# Bể Kính · NPC sống thật

Mục tiêu: nhìn vào là thấy 6 đảo đang sống. Mỗi việc trong logic phải hiện ra thành **hành động thật của đúng người đó, ở đúng chỗ**, không phải dòng chữ. Chữ (tin ở góc dưới, thẻ người) chỉ để giải thích thêm.

---

## 1. Vì sao NPC hiện giờ trông ngớ ngẩn (đã đọc code, có chỗ cụ thể)

| Biểu hiện | Nguyên nhân trong code |
|---|---|
| Đứng giữa đường mà cuốc đất, gõ búa | **Chỗ làm không có thật.** `render/village3d.js` (hàm `spot`) trả chỗ làm thay thế khi đảo hoặc thời đó thiếu chỗ đúng: <ul><li>mỏ đá (`quarry`) dùng tạm **chốt lính gác**;</li><li>rừng (`woods`) không có thì cũng là chốt lính;</li><li>ruộng (`field`) rỗng thì không có đích, người đứng nguyên chỗ và vẫn diễn cử chỉ làm việc.</li></ul> |
| Đang đứng mà vác bao hàng | **Cử chỉ "vác hàng" nằm lẫn trong danh sách cử chỉ làm việc** (`render/work3d.js`: farm, build, mine, chop… đều có `['carry','sack']`). Người đứng làm việc được đổi lượt sang "vác bao" dù không mang gì đi đâu. |
| Cầm đồ không hợp việc | **Đồ cầm tay đi theo cử chỉ chứ không theo việc.** Từ thời 7, "làm ruộng" là chỉ tay, khoanh tay hay vác bao, nên nhìn không ra người đó đang làm gì. |
| Không thấy chiến tranh, nổi dậy, chết đói | **Logic chỉ ghi chữ.** Phần vẽ chỉ đọc một cờ `S.situ.war` (lính chạy ra cầu, người nhát về nhà). Các việc sau không có hành động nào: <ul><li>Quân đi đánh vẽ bằng hình nhỏ riêng (`render/war3d.js`), không phải chính những người đó.</li><li>Người chết thì biến mất.</li><li>Đói, sáp nhập, nổi dậy không có gì để nhìn.</li></ul> |
| Sự kiện qua quá nhanh | **Một ngày trong logic chỉ dài 1,33 giây ở 1×.** Trận đánh ở cổng 2–5 ngày là 3–7 giây; nổi dậy được giải quyết gọn trong một ngày. Có vẽ thật thì cũng không kịp nhìn. |

---

## 2. Nguyên tắc

1. **Một người trong logic là một hình người trên màn hình, suốt đời.**
   - Lính đi đánh là chính người đó: rời nhà, ra bến, xuống thuyền, đánh, có thể chết ở đảo khác.
   - Người cai quản là chính người từ đảo thắng sang.
   - Bỏ hình lính nhỏ riêng của `render/war3d.js` khi đứng gần; ở xa thì giữ làm bản nhẹ (LOD) cho máy yếu.
2. **Mỗi người lúc nào cũng có một hoạt động rõ ràng, có đầu vào và đầu ra:**
   - *Đầu vào:* đi từ đâu, tới chỗ nào, cầm đồ gì.
   - *Đầu ra:* làm ra cái gì, mang về đâu.
   - Hoạt động là một chuỗi bước, mỗi bước một kiểu cử động:
     `rời nhà → đi đường (đi bộ, có khi chạy bộ) → tới chỗ làm, cầm đồ nghề → làm (cử chỉ đúng việc, đúng đồ) → mang sản phẩm về kho → về nhà`.
3. **Đồ cầm tay gắn với bước của hoạt động, không gắn với cử chỉ:**
   - Cuốc, rìu, búa chỉ có ở chỗ làm.
   - Bao hàng chỉ có khi thật sự mang sản phẩm từ chỗ làm về kho. Bao gánh trên vai thì người đó đang đi, không đứng vác.
   - Đi dạo là tay không.
4. **Không có chỗ thay thế.** Việc nào cũng phải có chỗ làm thật trên đảo, ở thời đó (ruộng, rừng, mỏ, xưởng, chợ, kho, bãi tập, bến).
   - Đảo hoặc thời nào thiếu chỗ thì người đó không được giao việc ấy (logic biết đảo làm ra được gì).
   - Kiểm thử tự động bắt mọi trường hợp "làm việc ở chỗ không phải chỗ làm".
5. **Trên đường chỉ có đi bộ, chạy bộ, gặp người quen thì dừng nói chuyện một chút rồi đi tiếp** (giữ phần đã có). Không làm việc trên đường.
6. **Sự kiện lấn lịch thường theo thứ tự ưu tiên:**
   giặc đánh tới cổng > giặc trong thành > nổi dậy > bạo loạn > thiên tai > tang lễ > đói > lễ hội > ngày thường.
   Mỗi sự kiện là một **cảnh** có vai cụ thể cho từng người (ai đứng đâu, làm gì, cầm gì), chọn theo tính cách và quan hệ:
   - vợ con tiễn lính;
   - người nóng nảy cầm vũ khí;
   - người nhút nhát chạy về nhà, đóng cửa.
7. **Sự kiện phải kéo dài đủ để nhìn thấy.**
   - Trận đánh tính theo từng giờ (1/12 ngày) thay vì từng ngày.
   - Vây cổng, đánh vào thành, nổi dậy kéo dài nhiều ngày theo logic.
   - Kết quả và nhịp vẫn do logic quyết, nên 1×, 2×, 4× vẫn ra cùng lịch sử.
   - Phần nhịp trận thuộc bước 6, vì nó đổi phần cân chỉnh.

---

## 3. Ngày thường: hoạt động có đầu vào, đầu ra

| Người | Nhà → | Chỗ làm (phải có thật) | Làm gì, cầm gì | Đầu ra mang đi đâu |
|---|---|---|---|---|
| Nông dân | nhà riêng | ruộng của đảo | cuốc, gặt (thời sau: lái máy, kiểm tra cây) | gánh lúa về kho, rồi quay lại ruộng |
| Tiều phu | nhà riêng | bìa rừng | chặt cây bằng rìu | vác gỗ về kho |
| Thợ đá, thợ mỏ | nhà riêng | mỏ đá | đục, đập | đẩy xe, vác đá về kho |
| Thợ năng lượng | nhà riêng | nhà máy, cối xay | coi máy | không mang gì (điện đi theo dây) |
| Thợ xây | nhà riêng | công trình đang dựng | gõ búa, kê gạch | lấy gỗ, đá ở kho mang tới công trình |
| Thương nhân | nhà riêng | chợ | bán hàng | đoàn buôn: khuân hàng từ kho ra bến, xuống thuyền |
| Lính | nhà riêng | bãi tập, chốt gác | tập giáo, tuần tra theo lối | – |
| Lính gác cổng | – | cổng | đứng gác (đã có) | – |
| Hội đồng | nhà riêng | nhà chính, chỗ thờ, chợ, nhà thuốc | chỉ đạo, cầu nguyện, khám bệnh | – |
| Trẻ em, người già | nhà | trường, sân, trước cửa | học, chơi, ngồi kể chuyện | – |

- **Kho của đảo là một chỗ có thật**, trong kho có đống bao, đống gỗ, đống đá. Đống hàng to nhỏ theo lượng trong kho (`logic/economy.js` stock).
  - Hết lương thực thì kho lương thực trống trơn: nhìn là biết đảo đang đói.
- **Đi làm có giờ:** sáng ra đi, trưa nghỉ ăn, chiều làm tiếp, tối về nhà, đêm ngủ trong nhà. Đã có buổi trong ngày; nay gắn chặt với chuỗi bước.
- **Cách đi:** người trẻ khoẻ đôi khi chạy bộ, người già đi chậm. Tốc độ theo tuổi và gen; dưới mưa bão thì đi nhanh.

---

## 4. Cảnh theo sự kiện (hành động thật, tác động thật)

| Sự kiện | Diễn ra trên màn hình |
|---|---|
| **Gọi quân** | <ul><li>Lính và dân binh bỏ việc về nhà cầm vũ khí (giáo, khiên theo thời), tập hợp ở sân.</li><li>Quân đi thành hàng ra cổng phụ, xuống thuyền hay qua cầu.</li><li>Vợ con ra cổng tiễn, mặt buồn.</li><li>Ruộng, mỏ vắng hẳn người.</li></ul> |
| **Quân giặc tới** | <ul><li>Trên đảo bị đánh có người hô báo. Lính và hai lính gác cổng phụ chạy ra cổng phía giặc tới.</li><li>Người nhút nhát kéo con về nhà, đóng cửa (vào trong nhà, không vẽ).</li><li>Người sùng đạo quỳ ở chỗ thờ.</li><li>Người nóng nảy vớ cuốc, gậy chạy ra cổng.</li></ul> |
| **Đánh ở cổng** | <ul><li>Quân giặc là những người thật của đảo kia, mặc đồ đảo kia. Họ lên bờ, dàn hàng.</li><li>Từng cặp đánh nhau bằng cử chỉ thật đã có trong thư viện (đâm, đỡ).</li><li>Người ngã xuống là ngã thật: nằm lại trên đất tới hết trận. Người bị thương ngồi gục.</li><li>Sĩ khí rơi thì bên công lùi dần về thuyền.</li></ul> |
| **Cổng vỡ, vào thành** | <ul><li>Cánh cổng đổ, có khói.</li><li>Quân giặc chạy theo đường về nhà chính.</li><li>Dân chạy dạt sang phía bên kia đảo. Vài mái nhà bốc khói.</li><li>Người nóng nảy đánh trên phố.</li></ul> |
| **Chiếm nhà chính, sáp nhập** | <ul><li>Quân vây nhà chính. Vua cũ bị dẫn ra quỳ ở sân.</li><li>Cờ đảo cũ hạ xuống, cờ đảo thắng kéo lên (cột cờ có chuyển động).</li><li>Người cai quản đi thuyền tới, có vài lính hộ tống.</li><li>Quân đóng giữ đi tuần trên phố, mặc màu đảo thắng.</li><li>Đoàn khuân hàng nộp về đảo thắng đi ra bến.</li></ul> |
| **Đột kích** | Giặc chạy thẳng tới kho, vác bao chạy ra thuyền: đây là lúc vác hàng đúng nghĩa. Kho vơi đi trông thấy. |
| **Xin hoà** | Sứ giả cầm cờ trắng đi ra gặp tướng giặc, cúi chào. Người khuân đồ nộp ra thuyền giặc. Quân giặc lên thuyền về. |
| **Nổi dậy** | <ul><li>Trước đó vài ngày: tối tối có nhóm người tụ tập thì thầm, cãi với lính đóng giữ.</li><li>Ngày nổi dậy: đám đông cầm gậy, cuốc kéo tới cột cờ, đánh với lính đóng giữ.</li><li>Thắng: cờ đảo thắng bị giật xuống, cờ đảo mình kéo lên, người cai quản bị áp giải ra bến.</li><li>Thua: người cầm đầu bị dẫn ra sân quỳ, đám đông tan về nhà.</li></ul> |
| **Đói** | <ul><li>Kho lương thực trống. Dân xếp hàng ở kho nhận khẩu phần.</li><li>Người đi chậm, ngồi nhiều, mặt buồn. Trẻ con khóc. Người già nằm trong nhà.</li><li>Người chết đói có đám tang.</li></ul> |
| **Chết (mọi lý do)** | Người nhà khóc. Đoàn đưa tang đi tới bãi mộ của đảo. Mộ mới mọc lên, nên bãi mộ lớn dần theo lịch sử của đảo (nhìn là biết đảo nào đã khổ). |
| **Thiên tai** | <ul><li>Bão, bão tuyết, bão cát: chạy vào nhà (đã có).</li><li>Hạn: ruộng úa vàng, người cầu mưa ở chỗ thờ.</li><li>Cháy rừng: người xách nước thành hàng.</li></ul> |
| **Đoàn buôn** | Thương nhân và người khuân vác mang hàng từ kho ra bến, xếp lên thuyền. Đoàn tới thì dỡ hàng vào kho. |
| **Lên thời, lễ hội** | Dân tụ ở sân, nhảy múa, reo hò (đã có cử chỉ). |

---

## 5. Cách làm cho đúng chỗ (không viết đè)

| Phần | Tệp | Việc |
|---|---|---|
| Logic: người ở đâu | `logic/people.js`, `logic/war.js` | Mỗi người có một chỗ ở (`p.loc`: ở đảo nào, hay đang trên biển), thay cho cờ `p.away`. Người chết có `p.diedAt` (chỗ ngã) và `p.grave`. |
| Logic: hoạt động | `logic/tasks.js` | Mỗi việc trả về một **kế hoạch hoạt động**: các bước (đi tới, làm, mang về, về nhà), chỗ thật, đồ nghề, sản phẩm. Chỉ giao việc khi chỗ làm có thật. |
| Logic: cảnh | `logic/scenes.js` (mới) | `logic/war.js`, `logic/economy.js` (đói), `logic/climate.js`, `logic/council.js` (tang lễ) không ghi chữ suông nữa. Chúng mở **cảnh** gồm các vai (ai làm gì, ở đâu, từ khi nào tới khi nào). Bộ não người (`logic/brain.js`) đọc vai của mình trong cảnh trước lịch thường. Chữ vẫn ghi để giải thích. |
| Logic: nhịp trận | `logic/war.js` | Đánh theo từng giờ (1/12 ngày); vây cổng, vào thành, nổi dậy kéo dài nhiều ngày (thuộc bước 6). |
| Vẽ: chỗ thật | `render/buildings3d.js` places | Thêm chỗ: kho, rừng, mỏ, bãi tập, bến, bãi mộ, cột cờ. Có cho mọi đảo, mọi thời; thiếu thì kiểm thử báo. |
| Vẽ: chuyển động theo bước | `render/village3d.js`, `render/work3d.js` | `work3d` tách làm hai: cử chỉ làm việc tại chỗ (có đồ nghề) và cách mang khi đi (gánh, vác, đẩy xe). Bỏ "vác bao" khỏi danh sách cử chỉ đứng. |
| Vẽ: khách trên đảo | `render/village3d.js` | Một đảo vẽ cả những người đang có mặt trên đảo dù không phải dân đảo đó: quân giặc, quân đóng giữ, người cai quản, sứ giả, thương nhân. Ai mặc đồ đảo nấy. |
| Vẽ: cảnh | `render/scenes3d.js` (mới) | Dàn cảnh từ vai của logic: hàng quân, cặp đánh nhau, người ngã nằm lại, cổng đổ, khói, cờ kéo lên hạ xuống, đống hàng trong kho, bãi mộ. |
| Vẽ ở xa | `render/war3d.js` | Giữ hình lính nhỏ và thuyền cho đảo ở xa máy quay. Đứng gần thì thay bằng người thật. |

**Máy yếu (điện thoại):** chỉ đảo gần máy quay mới vẽ người thật (đã có). Trận đánh thêm tối đa khoảng 30 người. Ở xa thì dùng hình nhỏ. Nhóm A giảm tải vẫn giữ nguyên.

---

## 6. Kiểm chứng

- **Node:**
  - Mọi việc, mọi đảo, mọi thời đều có chỗ làm thật.
  - Không ai mang hàng mà không đang đi giữa chỗ làm và kho.
  - Người ra trận là đúng người trong logic; người chết có chỗ ngã và có mộ.
  - Cảnh có đủ vai.
- **Trình duyệt không giao diện:**
  - Đếm khung hình có người "đứng làm việc ở chỗ không phải chỗ làm" phải bằng 0.
  - Chụp chuỗi ảnh theo thứ tự: gọi quân → xuống thuyền → đánh ở cổng → cổng vỡ → kéo cờ → nổi dậy → đám tang → xếp hàng lúc đói.
- **Đo khung hình trên máy giả lập điện thoại** trước và sau khi có trận đánh.
