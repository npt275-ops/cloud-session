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

---

## 7. Bổ sung đã chốt

### 7.1 Không có hành động vô nghĩa, suốt vòng đời

**"Có nghĩa" được định nghĩa để máy kiểm được.** Ở mọi khung hình, mỗi người trả lời được ba câu:
- đang ở **bước nào** của hoạt động hay cảnh nào;
- ở **chỗ nào**;
- **cầm gì**.

Cử chỉ phải nằm trong danh sách cho phép của bộ ba đó. Ví dụ: cuốc chỉ ở ruộng, khi đang ở bước làm; bao gánh chỉ khi đang đi giữa chỗ làm và kho.

**Vòng đời, mỗi tuổi có việc riêng:**

| Tuổi | Việc |
|---|---|
| Trẻ nhỏ | Được bế, hoặc chơi ngay trước cửa nhà. |
| Trẻ con | Đi học, chơi ở sân, theo cha mẹ ra đồng phụ việc. |
| Người lớn | Đi làm theo hoạt động có đầu vào, đầu ra (mục 3). |
| Người già | Đi chậm, ngồi trước cửa, kể chuyện cho trẻ con, tới chỗ thờ. |
| Chết | Có cảnh. Chỗ trống trong nhà và trong việc làm được người khác thay. |

**Đứng chờ cũng phải có lý do:** chờ bạn, xếp hàng ở kho, đứng gác, nghe diễn thuyết. Không ai đứng không ở chỗ bất kỳ.

**Kiểm thử trên trình duyệt** ghi lại mọi trường hợp cử chỉ không nằm trong danh sách cho phép. Phải bằng 0 mới xong bước.

### 7.2 Cầu do người đứng đầu quyết, cầu là lối đi và là chiến tuyến

**Bỏ luật tự bắc cầu của bước 4** (buôn đủ 3 chuyến là bắc). Thay bằng quyết định ngoại giao trong `logic/strategy.js`:
1. Người đứng đầu muốn gần một đảo bên cạnh thì **đề nghị bắc cầu**. Người muốn gần là người có tin cậy cao, buôn bán nhiều, mưu mô hay trí tuệ, hoặc cần đồng minh vì đang sợ đảo khác.
2. Người đứng đầu bên kia đồng ý hay từ chối theo tính cách và quan hệ.
3. Đồng ý thì hai bên góp gỗ, đá, kim loại theo thời. Thợ xây của hai đảo **dựng cầu thật** từ hai đầu, mất nhiều ngày; có giàn giáo; người đứng xem.
4. **Lên thời thì người đứng đầu quyết có xây lại cầu theo kiểu thời mới hay không** (tốn tài nguyên). Vì vậy mỗi thời một kiểu cầu. Cầu cũ vẫn dùng được cho tới khi xây lại.

**Cầu là lối đi của người thật.** Qua lại trên cầu có:
- thương nhân, người khuân hàng;
- sứ giả;
- người thăm họ hàng (từ bước 7 có lấy vợ lấy chồng khác đảo);
- người chạy nạn (mục 7.6).

**Đầu cầu có cổng phụ, có lính gác** (đã có chốt cổng phụ).

**Cầu cũng là chiến tuyến:**
- Xô xát ở đầu cầu: người hai đảo cãi nhau, ẩu đả; lính gác can, hay bắt người.
- Quân lính tràn sang bằng đường cầu: nhanh hơn đi thuyền, nhưng hẹp, nên đánh ở đầu cầu là chiến trường tự nhiên.
- Người đứng đầu đa nghi, khi chiến tranh nổ ra, có thể **đóng cổng cầu** hay **phá cầu** để chặn đường. Người hiếu chiến có thể bắc **cầu quân sự** một mình để đánh (mục 12.1 bước 6 chuyển sang đây).

Cầu thành một quyết định có cái giá: gần nhau để buôn bán, nhưng cũng mở đường cho giặc.

### 7.3 Đánh thành: cổng → các công trình xung quanh → nhà chính

**Quân tới bằng đường nào thì đánh cổng đó:**
- qua cầu thì đánh cổng phụ ở đầu cầu;
- đi thuyền thì đổ bộ ở bãi và đánh cổng chính.

**Giữ cổng:**
- lính và tướng ở nhà;
- lính gác cổng đó (lính gác các cổng khác giữ chốt);
- dân tự nguyện: người nóng nảy, trai tráng, cầm đồ nghề làm vũ khí.

Người nhút nhát, trẻ con, người già vào nhà hay chạy về phía nhà chính.

**Mất cổng thì địch đánh các công trình xung quanh trước,** rồi mới vào nhà chính:
- **Mỗi công trình có độ bền** (logic: `S.build` mỗi công trình thêm hp; tệp `logic/siege.js` mới hay trong `logic/war.js`). Đánh trúng thì cháy, sụp một phần; hư hẳn thì thành đống đổ.
- **Công trình hư thì kinh tế mất phần đó:** xưởng cháy thì không làm ra hàng, kho cháy thì mất hàng, nhà dân cháy thì dân phải ở nhờ.
- **Sau chiến tranh thợ xây sửa lại thật,** có giàn giáo và mất thời gian.

**Nhà chính có đội giữ thành riêng:** lính còn lại, người trong hội đồng, dân tự nguyện vào trong. Địch vây quanh rồi đánh vào.
- **Mất thành khi đội giữ thành chết hết hay đầu hàng.** Đầu hàng do người đứng đầu quyết theo tính cách: sợ hãi, nhu nhược thì đầu hàng sớm để cứu dân; hiếu chiến, kiêu thì đánh tới người cuối cùng.
- **Sáp nhập** theo đúng luật đã chốt.
- **Dân thấy được từng bước:** cổng đổ, nhà quanh sân bốc cháy, nhà chính bị vây, cờ hạ xuống.

### 7.4 Thời tên lửa trở đi: bộ binh và vũ khí bắn từ xa

**Tên lửa, từ thời 7 (Tên lửa):**
- Đảo làm tên lửa ở một công trình riêng (bãi phóng, đã có trong kiến trúc thời 7). Mỗi quả tốn kim loại và năng lượng.
- **Số tên lửa trong kho theo kinh tế:** đảo giàu có nhiều, đảo nghèo có ít hay không có. Người đứng đầu quyết dồn bao nhiêu vào tên lửa, vì đó là phần không dùng để lên thời.
- **Khi đánh:** tên lửa bắn trước hoặc cùng lúc bộ binh. Đường bay vòng qua biển, trúng thì nổ.
  - Nhắm vào cổng, tường, công trình, kho. Trúng thì công trình mất độ bền như mục 7.3, có người chết nếu đang ở đó.
  - Dân chạy vào hầm hay vào nhà khi nghe báo động.
- **Bộ binh vẫn phải vào chiếm nhà chính.** Tên lửa chỉ phá, không chiếm được thành.

**Hạt nhân, từ thời 8 (Robot AI):**
- **Rất đắt:** mỗi quả cần nhiều năng lượng, kim loại và thời gian chế tạo.
- **Chỉ người đứng đầu hiếu chiến, tham vọng, ít sùng đạo, ít nhu nhược mới dùng,** và thường khi đang thua hay thù rất sâu.
- **Mỗi quả làm đảo bị bắn mất 1/4:**
  - công trình trong vùng nổ thành đống đổ;
  - người trong vùng chết;
  - đất nhiễm xạ lâu ngày, sản xuất kém.
- **Đủ 4 quả thì cả đảo bị san phẳng:** nhà chính sụp, đảo bắt buộc đầu hàng và bị sáp nhập, dù còn quân hay không.
- **Hậu quả cho cả bể:**
  - Mọi đảo sợ và thù đảo dùng hạt nhân.
  - Đảo bị bắn mà cũng có hạt nhân có thể bắn trả, nếu còn bệ phóng.
  - Trời của cả bể xám đi vài tháng (bụi), mọi đảo mất mùa một thời gian.

**Có thể thêm (gợi ý, chưa chốt):** từ thời 9 có lá chắn đánh chặn một phần tên lửa, nhiều ít theo kinh tế. Đánh nhau giữa hai đảo giàu khi đó thành cuộc đua tên lửa và lá chắn.

### 7.5 Mọi sự kiện đều có người hành động theo

**Mỗi loại sự kiện trong logic phải có một cảnh.** Mỗi người có mặt trên đảo lúc đó phải có một vai trong cảnh, hay có lý do rõ ràng để tiếp tục việc thường. Ví dụ: trong lúc có lễ hội, lính gác vẫn gác.

**Kiểm thử Node:**
- Liệt kê mọi loại sự kiện mà logic phát ra; loại nào chưa có cảnh thì báo lỗi.
- Trong cảnh, đếm người không có vai mà vẫn làm việc thường trái với cảnh. Ví dụ: đang có giặc vào thành mà vẫn ra đồng. Số này phải bằng 0.

### 7.6 Bể kính là một hệ sinh thái hỗn loạn như ngoài đời

**Hỗn loạn thật không phải ngẫu nhiên.** Nó đến từ nhiều thứ ảnh hưởng lẫn nhau theo vòng, nên một chuyện nhỏ có thể lan thành chuyện lớn. Thêm những vòng này, mỗi vòng có nguyên nhân rõ ràng:

| Vòng | Diễn ra |
|---|---|
| **Môi trường** | <ul><li>Rừng chặt nhiều thì thưa dần, mọc lại chậm (nhìn thấy cây ít đi).</li><li>Mỏ đào lâu thì cạn.</li><li>Ruộng làm liên tục thì bạc màu.</li><li>Đánh cá nhiều thì cá ít.</li><li>Thời công nghiệp trở đi có ô nhiễm.</li></ul>Đảo phải chọn: khai thác nhanh để lên thời, hay giữ đất cho đời sau. |
| **Người đi lại giữa các đảo** | <ul><li>Đói, chiến tranh thì dân chạy nạn qua cầu, qua thuyền sang đảo bên cạnh.</li><li>Đảo nhận thêm người làm nhưng thêm miệng ăn; người đứng đầu đa nghi có thể đóng cửa.</li><li>Lấy vợ lấy chồng khác đảo, nên có họ hàng hai bên. Đánh nhau thì có gia đình bị chia cắt.</li></ul> |
| **Dịch bệnh** | Lây theo người qua lại (cầu, đoàn buôn, quân lính, người chạy nạn). Đảo đóng cầu thì ít lây nhưng mất buôn bán. |
| **Chính trị trong đảo** | <ul><li>Bất bình kéo dài thì có đảo chính: tướng hay quân sư lật người đứng đầu.</li><li>Tranh ngôi khi người đứng đầu chết.</li><li>Có thể nội chiến chia hai phe.</li></ul>Người đứng đầu mới đổi hết chiến lược. |
| **Kinh tế giữa các đảo** | <ul><li>Giá theo khan hiếm.</li><li>Một đảo bị cấm vận (các đảo khác không buôn) thì túng quẫn, dễ liều đánh.</li></ul> |
| **Chiến tranh lan rộng** | Liên minh kéo đồng minh vào. Đảo thứ ba thừa lúc hai đảo đánh nhau để đánh kẻ yếu. |
| **Thiên tai** | Rơi đúng lúc yếu thì lật thế trận (đã có). |

**Mỗi chuyện xảy ra lưu lại chuỗi nguyên nhân** để dev xem "vì sao". Ví dụ: hạn hán → mất mùa → đói → chạy nạn sang Lúa Vàng → dịch lây → Lúa Vàng đóng cầu → Thông Xanh thù → chiến tranh.

**Mọi vòng đều có người hành động thật** (mục 7.1, 7.5): người chạy nạn mang bọc đi qua cầu; người bệnh nằm ở nhà thuốc; đảo chính có lính vây nhà chính.

**Giữ được kiểm thử và cân chỉnh:** cùng seed vẫn ra cùng lịch sử ở 1×, 2×, 4×. Mỗi vòng có số đo trong bảng dev "Cuộc đua" (bước 6) để cân chỉnh độ hỗn loạn: không quá yên, không sụp hết.

### 7.7 Người đứng đầu đảo: nhiều kịch bản, nhiều hành động

**Hiện có:** đi lại, chắp tay sau lưng, thỉnh thoảng lính gác vào báo tin. Giữ lại những thứ này và thêm một **bộ kịch bản** cho người đứng đầu. Kịch bản được chọn theo hoàn cảnh của đảo và tính cách của chính người đó. Mỗi kịch bản là một chuỗi bước có chỗ thật, người đi cùng thật và cử chỉ thật:

| Kịch bản | Khi nào | Diễn ra |
|---|---|---|
| Họp hội đồng | Sáng, vài ngày một lần; có chuyện lớn thì họp ngay | Quân sư, hai tướng, tư tế, thương chủ tới sân nhà chính, đứng thành vòng. Người đứng đầu nói, người khác gật hoặc cãi (đa nghi, hiếu chiến thì cãi). |
| Nhận tin | Có đoàn buôn tới, quân giặc kéo tới, thiên tai, người chết | Lính gác chạy từ cổng vào báo, cúi chào; người đứng đầu nghe rồi ra lệnh (chỉ tay về phía cổng). |
| Đi thị sát | Đang dựng công trình, ruộng mất mùa, kho vơi | Đi cùng một lính hộ vệ tới công trình, ruộng, kho; dừng lại chỉ tay, hỏi thợ. |
| Duyệt quân | Đang tích quân, sắp đánh | Ra bãi tập, lính đứng hàng; người đứng đầu đi dọc hàng. Hiếu chiến thì hô to, giơ tay. |
| Nói trước dân | Lễ hội, lên thời, sau chiến tranh, khi bất bình cao | Lên bục giữa sân, dân tụ lại nghe. Hoạt ngôn thì nói lâu, cử chỉ nhiều. |
| Tiếp sứ giả, thương chủ đảo khác | Ký hiệp ước, đề nghị bắc cầu, xin hoà | Ra cổng hay đầu cầu đón, cúi chào, đứng nói chuyện; ký xong thì bắt tay. |
| Xử kiện | Có người cãi nhau, ẩu đả | Hai bên bị dẫn tới sân nhà chính; người đứng đầu nghe rồi phán, một bên cúi đầu. |
| Cầu nguyện | Thiên tai, dịch bệnh, tang của người trong hội đồng; người sùng đạo thì thường xuyên | Tới chỗ thờ cùng tư tế, quỳ. |
| Ăn, nghỉ, về nhà | Trưa, tối, đêm | Ăn trong nhà chính hay nhà riêng, tối dạo sân với vợ hoặc chồng, đêm ngủ (có lính gác trước cửa). |
| Chiến tranh | Giặc tới cổng, giặc vào thành | Hiếu chiến, gan dạ thì cầm vũ khí ra cổng chỉ huy; nhút nhát thì lui vào nhà chính với đội giữ thành; mưu mô thì cho sứ giả đi xin hoà. |
| Đầu hàng, bị phế | Mất thành | Bước ra sân, quỳ trước tướng giặc, cờ hạ xuống. |

**Tính cách đổi cách làm:**
- *Đa nghi:* hay đi kiểm tra chốt gác, luôn có lính hộ vệ.
- *Hoạt ngôn:* hay ra sân nói với dân.
- *Ham học:* hay ở trường, ở xưởng.
- *Tham vọng:* hay duyệt quân, đi thị sát công trình.
- *Sùng đạo:* hay ở chỗ thờ.
- *Nhút nhát:* ít ra khỏi nhà chính.

### 7.8 Lính gác cổng: nét riêng, kịch bản riêng

**Mỗi lính gác có tính cách riêng, nên đứng gác mỗi người một kiểu:**
- *Đa nghi:* đảo mắt liên tục, hay bước ra hỏi người qua cổng.
- *Hiếu chiến:* cầm giáo thẳng, thỉnh thoảng tập đâm.
- *Nhu nhược:* đêm hay ngủ gật, dựa vào tường.
- *Hoạt ngôn:* hay nói chuyện với người gác bên cạnh.
- *Sùng đạo:* đầu ca chắp tay khấn.

**Kịch bản ở cổng:**

| Kịch bản | Diễn ra |
|---|---|
| Đổi ca | Sáng và tối: người ca mới đi từ nhà tới, hai bên chào, người ca cũ về nhà ngủ. Không ai gác suốt ngày đêm nữa. |
| Kiểm người qua cổng | Đoàn buôn, sứ giả, người lạ, người chạy nạn tới thì một người bước ra chặn, hỏi, xem hàng, rồi cho qua hoặc không. |
| Chào người đứng đầu | Người đứng đầu đi ngang thì đứng thẳng, giơ tay chào. |
| Báo tin | Thấy thuyền hay quân lạ thì một người chạy vào nhà chính báo (nối với kịch bản "Nhận tin" của người đứng đầu). |
| Đêm | Đốt lửa ở cổng, sưởi tay khi trời lạnh, đi qua đi lại cho tỉnh, ngáp. |
| Ăn | Người nhà mang cơm ra cổng (vợ hoặc con đi từ nhà tới), lính ngồi ăn tại chốt. |
| Giặc tới | Hô báo động, đóng cổng (cánh cổng khép lại), đứng chắn; cầm giáo đánh. |
| Mưa bão | Đứng nép vào cổng, không bỏ chốt. |
| Xô xát ở đầu cầu | Can hai bên, bắt người gây chuyện dẫn vào thành (nối với kịch bản "Xử kiện"). |

---

## 8. Thứ tự làm trong bước 7 (đề xuất)

| Bước | Việc | Mục |
|---|---|---|
| 7a | Nền: người ở đâu (`p.loc`), chỗ làm thật cho mọi đảo, mọi thời, hoạt động có đầu vào và đầu ra, bỏ cử chỉ vô nghĩa, kiểm thử "không vô nghĩa"; kịch bản của người đứng đầu (7.7) và lính gác cổng (7.8) | 2, 3, 7.1, 7.7, 7.8 |
| 7b | Cảnh: tang lễ, đói, lễ hội, thiên tai; khách trên đảo | 4, 7.5 |
| 7c | Cầu do người đứng đầu quyết, dựng cầu thật, người qua lại, xô xát ở đầu cầu | 7.2 |
| 7d ✅ | Đánh thành: giữ cổng, công trình có độ bền và hư hại, vây nhà chính, đầu hàng, sửa lại sau chiến tranh (mục 12) | 7.3 |
| 7e | Tên lửa (thời 7), hạt nhân (thời 8), hậu quả cho cả bể | 7.4 |
| 7f | Hệ sinh thái: môi trường cạn dần, người chạy nạn, hôn nhân khác đảo, dịch bệnh, đảo chính, cấm vận, chiến tranh lan rộng, chuỗi nguyên nhân | 7.6 |
| 7g | Cân chỉnh lại độ hỗn loạn bằng 100 trận | – |

Mỗi phần có kiểm thử Node, chuỗi ảnh trên trình duyệt, đo khung hình điện thoại, rồi commit, push, cập nhật artifact.

---

## 9. Đã làm ở 7a

| Việc | Làm thế nào | Kiểm chứng |
|---|---|---|
| **Chỗ làm thật cho mọi việc, mọi đảo, mọi thời** | `render/build/workyards3d.js`: bãi làm việc dựng cùng mỗi thời, trong tường thành, tránh cổng, tránh đường, dọn cây; kiểu dáng theo ba giai đoạn (thời 1–3, 4–7, 8–12). Có 7 loại bãi: <ul><li>kho (đống hàng theo lượng hàng thật);</li><li>mảnh ruộng (luôn có);</li><li>bãi gỗ;</li><li>mỏ đá;</li><li>xưởng;</li><li>bãi tập;</li><li>chỗ làm năng lượng (từ thời 4).</li></ul> `render/buildings3d.js`: <ul><li>tách lò gốm, lò rèn, nhà máy ra khỏi "ruộng" thành "xưởng";</li><li>bỏ chỗ thay thế vô nghĩa (mỏ đá = chốt lính gác, chợ = trước cửa một nhà bất kỳ); thời đầu chưa có chợ, chỗ thờ, trường thì đổi chác, cúng tế, dạy trẻ ở sân làng.</li></ul> | Kiểm kê trên trình duyệt: 6 đảo × 12 thời đều đủ chỗ cho mọi việc. |
| **Hoạt động có đầu vào, đầu ra** | `logic/tasks.js` cycle: <ul><li>người làm ra tài nguyên: làm ở chỗ làm → mang sản phẩm về kho → cúi đặt xuống → quay lại;</li><li>thợ xây: ra kho → nhặt gỗ, đá → mang tới công trình → dựng;</li><li>năng lượng đi theo dây, không mang.</li></ul> `render/village3d.js` chạy chu trình theo giờ game. | Ảnh ở kho: người làm đặt hàng xuống; đống hàng đúng lượng trong kho. |
| **Bỏ cử chỉ vô nghĩa** | `render/work3d.js` tách hai phần: <ul><li>cử chỉ làm việc tại chỗ: bỏ "vác bao" ra khỏi danh sách cử chỉ đứng; vác là cử chỉ đi;</li><li>cách mang khi đi: bao lương thực, khúc gỗ vác vai; thúng đá, quặng, thùng hàng quý ôm trước ngực (đồ mang mới trong `render/rig3d.js`, cử chỉ `carryFront` mới).</li></ul> | `village3d.audit()`: 0 vi phạm trong 360 lần kiểm (khoảng 100 người mỗi lần, chạy theo giờ thật qua đủ các buổi). Đối chứng: làm hỏng danh sách cho phép thì báo 14 vi phạm. |
| **Kịch bản người đứng đầu (7.7)** | `logic/leader.js`: <ul><li>nhận tin (lính gác chạy vào báo);</li><li>họp hội đồng (định kỳ hay sau tin lớn);</li><li>thị sát công trình, kho, ruộng (có hộ vệ đi theo);</li><li>duyệt quân, nói trước dân (người đi đường ghé nghe), phân xử người cãi nhau;</li><li>cầu nguyện, ghé trường, ăn trưa ở nhà chính, tối dạo với người nhà, đêm về nhà.</li></ul> Chọn theo hoàn cảnh và tính cách, bốc thăm có trọng số. Mở kịch bản thì `S.rethink`: người được gọi tới ngay. | 120 ngày thử: 5 cuộc họp, cả 5 thành viên hội đồng đều tới trong 1/4 ngày; 8 lần báo tin. Ảnh họp và báo tin chụp theo luồng tự nhiên. |
| **Kịch bản lính gác cổng (7.8)** | `logic/guards.js`: <ul><li>gác ca ngày theo tính cách (đa nghi đảo mắt, hiếu chiến tập đâm, nhu nhược đứng dựa, hoạt ngôn nói chuyện với người bên cạnh, sùng đạo khấn đầu ca);</li><li>ca đêm do lính thường thay, người giữ chốt về nhà ngủ (người nhu nhược gác đêm hay ngủ gật);</li><li>chạy vào báo tin, xem hàng đoàn buôn ở cổng phụ, ăn trưa tại chốt (người nhà mang cơm ra), chiều đông xoa tay.</li></ul> | `test/island.test.js`: ca ngày đứng đúng chốt; đêm có lính thường gác ở cổng. Kiểm thử bắt được lỗi hai vợ chồng cùng gác, người vợ bỏ chốt đi mang cơm; đã sửa. |

**Chưa làm ở 7a, dời sang phần sau (ghi rõ):**
- `p.loc` (người ở đâu, cho khách trên đảo khác): làm ở 7b, cùng lúc vẽ khách trên đảo.
- Đổi ca có chào nhau, chào người đứng đầu khi đi ngang (phản xạ trên phần vẽ): làm ở 7b.
- Đống hàng trong kho đôi khi có bụi cây thấp mọc lên giữa sàn (bụi cây không nằm trong phần dọn cây). Sửa ở 7b.

## 10. Đã làm ở 7b

| Việc | Làm thế nào | Kiểm chứng |
|---|---|---|
| **Đám tang** | `logic/scenes.js`: người mới mất được phát hiện mỗi ngày (mất vì già, bệnh, đói, thiên tai, chiến tranh đều có), nên không phải móc vào từng chỗ gây ra cái chết. Ba chặng: <ul><li>người nhà và tư tế khóc trước cửa nhà người mất;</li><li>đưa tang: hai người khiêng quan tài ôm trước ngực đi trước, tư tế dẫn, người nhà theo sau;</li><li>chôn cất ở bãi mộ.</li></ul> Người chết trận ở đảo khác (`p.abroad`): lễ tưởng niệm ở chỗ thờ, không có quan tài. | `test/scenes.test.js`; một năm ở Lúa Vàng có 27 đám tang. |
| **Bãi mộ** | Thêm vào các bãi làm việc (`render/build/workyards3d.js`): hàng rào; số mộ đúng số người đã chôn (`S.graves`), lớn dần theo lịch sử của đảo; cọc gỗ, rồi bia đá, rồi trụ sáng theo thời. | Ảnh: bãi mộ thời Công nghiệp hơn 40 bia. |
| **Nạn đói** | <ul><li>Kho lương thực dưới 3 ngày ăn thì cả đảo xét lại việc (`logic/economy.js` scarce).</li><li>Trưa ra kho xếp hàng nhận khẩu phần (`logic/tasks.js`), hàng một trước cửa kho theo thứ tự tới (`render/village3d.js`). Lính giữ chốt cổng ăn tại chốt.</li><li>Trẻ con đói khóc ở nhà.</li><li>Ai cũng đi chậm lại, mặt buồn.</li></ul> | `test/scenes.test.js`; trình duyệt: 59–81 người xếp hàng; đống lương thực trong kho trống. |
| **Lễ hội** | Một phần dân nhảy múa, reo hò ở sân (`logic/brain.js`), người khác trò chuyện, đi dạo. | Trình duyệt: 32–39 người nhảy múa. |
| **Lính gác cúi chào người đứng đầu** | Phản xạ ở phần vẽ: người đứng đầu đi ngang qua chốt (dưới 5 m) thì lính gác quay lại cúi chào, mỗi lần đi ngang chào một lần. | – |
| **Bãi làm việc lẫn vào chân núi** | Vùng chiếm chỗ của khối núi lớn chỉ là vài vòng tròn dọc sống núi, hở ở hai bên. Nay bãi tránh cả khung khối núi (`L.massifs`). | Ảnh kho không còn lẫn vào núi; kiểm kê vẫn đủ chỗ mọi đảo, mọi thời. |
| **Không vô nghĩa** | Thêm luật cho người khiêng quan tài. | `audit()`: 0 vi phạm, chạy theo giờ thật tới ngày 1613, có đủ cảnh mới. |

**Thay đổi phát sinh, cần ghi lại:**
- Kiểm thử bước 2 "sống riêng thì không đảo nào chạm thời 12" không còn đúng. Đảo 100 dân và công nghệ các thời sau làm ra được cả thứ gần như không có, nên Đá Mây hay Tuyết Trắng có khi tự chạm thời 12.
- Thử hạ mức "gần như không có" từ 0,08 xuống 0,03 thì Đá Mây áp đảo cả bể (đứng đầu 15 trên 20 trận), nên giữ 0,08.
- Bài kiểm thử nay kiểm điều vẫn đúng: các đảo lên cấp khác nhau, ít đảo chạm thời 12, Cát Hồng (không có gỗ) luôn kẹt.

**Dời sang phần sau:**
- Khách trên đảo (quân giặc, người cai quản bằng người thật, `p.loc`): làm ở 7d, cùng cảnh chiến tranh.
- Chào nhau lúc đổi ca gác; cháy rừng có người xách nước thành hàng: làm ở 7f, cùng các vòng môi trường.

## 11. Đã làm ở 7c

| Việc | Làm thế nào | Kiểm chứng |
|---|---|---|
| **Cầu do người đứng đầu quyết** | Bỏ luật tự bắc cầu của bước 4. `logic/strategy.js` tryBridge: muốn gần đảo bên cạnh (tin cậy, buôn bán nhiều, cùng sợ một kẻ thứ ba, mưu mô hay trí tuệ; đa nghi, thù hằn thì ngại); bên kia đồng ý hay từ chối theo tính cách và quan hệ. | 10 trận: khoảng 3,4 cầu mới mỗi trận. |
| **Xây thật** | `logic/diplomacy.js` startBridge: trả vật liệu trước (gỗ, đá; từ thời 5 thêm kim loại; giá theo thời), rồi mỗi ngày cầu tiến 1/25 nếu bên làm còn thợ xây. Thợ xây (một nửa, nếu đang có công trình trong làng) ra cổng phụ phía cầu, lấy gỗ ở kho mang ra (`logic/tasks.js`, `S.bridgeJob`). Phần vẽ: giàn giáo và ván mọc dần từ hai đầu vào giữa (`render/build/bridges3d.js` syncWorks). | `test/bridges.test.js`: thiếu thợ thì cầu đứng, có thợ thì tiến; thợ đầu cầu có chu trình kho → đầu cầu. Ảnh: cầu đang xây ở cổng phụ. |
| **Mỗi thời một cầu** | Kiểu cầu theo thời lúc khởi công (`b.era`), lên thời không tự đổi. Người đứng đầu ham tiến (trí tuệ, tham vọng) quyết xây lại theo kiểu thời mới; cầu phải dùng ít nhất 180 ngày (không phá cầu mới tinh để xây lại). Cầu cũ vẫn đi được tới khi cầu mới xong. | 10 trận: khoảng 6,4 lần xây lại mỗi trận. Kiểm thử bắt được lỗi cầu vừa xong đã xây lại; đã sửa. |
| **Phá cầu, cầu quân sự** | Bị đánh (không bị đánh úp) mà có cầu: người đứng đầu đa nghi, sợ hãi có thể phá cầu; quân đang tới qua cầu phải vòng đi thuyền, tới chậm hơn. Kẻ hiếu chiến muốn đánh đảo bên cạnh chưa có cầu thì tự bắc cầu quân sự (một bên chịu cả phí). | `test/bridges.test.js`: người đa nghi phá cầu, quân đổi sang đi thuyền. 10 trận: 1 lần phá cầu, chưa có cầu quân sự (các đảo kề nhau thường có cầu từ sớm). |
| **Người qua lại** | `logic/diplomacy.js` startVisit: người hoạt ngôn, ít đa nghi sang thăm chợ đảo bên qua cầu (đảo tin nhau, không thù). Ba chặng: đi (vẽ là hình người nhỏ mặc màu đảo nhà đi trên cầu, `render/travel3d.js`), ở lại vài ngày (là người thật trong làng đảo kia, mặc áo màu đảo nhà, đi chợ; `render/village3d.js` setGuests), rồi về. Đi vắng thì không ở đảo nhà, không làm ở nhà. | `test/bridges.test.js`; 10 trận: khoảng 105 lượt mỗi trận. Trình duyệt: 4 khách ở Lúa Vàng, đi tới cách quầy chợ 6–10 m. |
| **Xô xát ở đầu cầu** | Hai đảo đang thù nhau: khách tới đầu cầu có thể bị lính gác chặn. Khách đứng cãi với lính gác cổng phụ, lính gác cãi lại (phản xạ ở phần vẽ). Khách bị đuổi về, hai bên thêm thù, có tin trong nhật ký. | 10 trận: khoảng 2,7 vụ mỗi trận. Trình duyệt: khách xô xát đứng cách lính gác 4,7 m. |
| **Không vô nghĩa** | Khách, thợ đầu cầu nằm trong `audit()`. | 0 vi phạm trong 240 lần kiểm, có khách và cầu đang xây. |

**Ghi lại:**
- Kiểm thử "cặp buôn nhiều nhất tin nhau hơn" đổi thành "cặp đang buôn gần đây tin nhau hơn", vì tin cậy phai dần. Tổng chuyến buôn không giảm (72–102 so với 73–93 trước 7c), chỉ trải đều ra nhiều cặp hơn.
- Kiểm thử chiến tranh 9 năm đổi từ 3 lên 5 trận: khoảng một nửa số trận có sáp nhập, 3 trận dễ trượt.
- Tỉ lệ chiến tranh không đổi (20 trận: 1,3 sáp nhập mỗi trận; có trận chỉ còn 3 đảo).

**Dời sang phần sau:** quân giặc tràn qua cầu bằng người thật, đánh nhau ở đầu cầu: làm ở 7d.

## 12. Đã làm ở 7d

| Việc | Làm thế nào | Kiểm chứng |
|---|---|---|
| **Tiễn quân** | Gọi quân xong, quân tập hợp ở cổng 0,3 ngày rồi mới lên đường (`logic/war.js` sendOff). Quân đi thuyền thì ra cổng chính xuống bến, qua cầu thì ra cổng phụ. Người nhà (vợ chồng, con, cha mẹ) ra cổng vẫy tay, khóc. | `test/siege.test.js`. Trình duyệt: 24 người nhà tiễn, 0 vi phạm. |
| **Đánh đúng cổng** | Quân tới qua cầu thì đánh cổng phụ đầu cầu, đi thuyền thì đổ bộ đánh cổng chính. Giữ cổng gồm lính, tướng ở nhà, lính gác đúng cổng đó (lính gác cổng khác giữ chốt) và dân tự nguyện: người nóng nảy, không nhát, từ 18 tới 50 tuổi, cầm đồ nghề làm vũ khí (sức bằng 0,3 lính). Mỗi người giữ nhắm một quân giặc. Người đứng đầu chỉ huy ở nhà chính, người sùng đạo cầu ở chỗ thờ, người khác vào nhà đóng cửa (người nhát thì chạy). | `test/siege.test.js` |
| **Quân giặc là người thật** | Quân giặc, quân đồng minh tới giúp, quân đóng giữ đều là người thật trong làng, mặc màu đảo mình, cầm giáo (`logic/war.js` onIsland, `game/cities.js`). Đảo đang vẽ gần thì không vẽ thêm hình lính nhỏ. Người ngã xuống nằm lại đúng chỗ đã ngã tới hết trận (hai ngày, `S.fallen`). | Trình duyệt: 26–37 quân giặc đánh từng cặp ở cổng chính. |
| **Công trình có độ bền** | `logic/siege.js` (tệp mới): `S.ruin[khoá]` là độ bền còn lại. Khoá là bãi làm việc (kho, xưởng, chỗ làm năng lượng, ruộng, bãi gỗ, mỏ đá), nhà dân, hay cổng. Cổng vỡ thì hư hẳn. Địch đốt phá lần lượt: kho, xưởng, chỗ làm năng lượng, ba nhà dân, ruộng, tối đa 2 ngày. Lính còn lại và dân nóng nảy đánh trên phố; dân khác dạt sang phía bên kia đảo. | Thử ép sẵn: cổng vỡ → đốt kho, xưởng, chỗ làm năng lượng, 2 nhà → vây nhà chính. |
| **Hư thì kinh tế mất phần đó** | Kho cháy thì mất hàng ngay (tới một nửa). Bãi hư thì sản lượng thứ đó còn 30–100% theo độ bền. Nhà cháy (độ bền dưới 0,5) thì người nhà ở nhờ nhà gần nhất còn ở được. | `test/siege.test.js` |
| **Vây nhà chính, đầu hàng** | Đội giữ thành gồm lính còn lại, người trong hội đồng, dân tự nguyện. Mất thành khi đội này ngã hết, hoặc người đứng đầu đầu hàng (xét mỗi ngày): người sợ hãi, nhu nhược hàng sớm để cứu dân; người hiếu chiến, tham vọng đánh tới cùng; bị vây quá 6 ngày thì hết lương phải hàng. Đội giữ thành cũng có thể đánh bật quân giặc. | `test/siege.test.js`: người nhát hàng hơn 30% mỗi ngày, người gan 0%. |
| **Mất thành** | Người đứng đầu cũ bị dẫn ra quỳ ở sân nhà chính (`S.situ.kneel`). Cờ đảo cũ hạ xuống, cờ đảo thắng kéo lên trong một ngày (`render/war3d.js`). Quân đóng giữ là người thật, đi tuần trong làng. | Trình duyệt: vua cũ quỳ, cờ, người ngã. |
| **Vẽ hư hại** | `render/build/ruins3d.js` (tệp mới): đống đổ nát cháy đen nhiều hay ít theo độ bền đã mất; lửa và khói đen khi còn giặc. Độ bền dưới 0,35 thì nhà sụp (ẩn đi, còn đống đổ) và bãi làm việc bị đè bẹp. Khi sửa thì có giàn giáo. | Ảnh kho cháy. |
| **Sửa lại sau chiến tranh** | Hết giặc thì thợ xây ra kho lấy gỗ, đá mang tới chỗ hư nặng nhất mà sửa (`S.repairJob`, `logic/tasks.js`). Mỗi thợ sửa 0,06 độ bền mỗi ngày; thiếu vật liệu thì chỉ còn 30% tốc độ. Đảo bị sáp nhập giữ lại 60 gỗ, 60 đá để sửa, không nộp hết. Sửa xong thì công trình dựng lại. | `test/siege.test.js`. Thử ép sẵn: cổng và kho sửa xong sau khoảng 30 ngày. |
| **Không vô nghĩa** | Tiễn quân, đánh ở cổng, đốt phá, vây nhà chính, sau khi mất thành đều nằm trong `audit()`. | 0 vi phạm ở mọi chặng trên trình duyệt. |

**Ghi lại (cân bằng thay đổi):**
- Đặt cùng 40 trận tổng tấn công ép sẵn (bên đánh mạnh hơn):

  | | Bản 7c | Bản 7d |
  |---|---|---|
  | Chiếm được thành | 20 | 15 (12 lần là người đứng đầu đầu hàng) |
  | Thua ở cổng | 18 | 21 |

- Chạy 30 trận 9 năm tự nhiên:

  | Mỗi trận | Trước 7d | Sau 7d |
  |---|---|---|
  | Trận đánh | 6,5 | 4,4 |
  | Sáp nhập | 1,2 | 0,5 |

  Đánh thành giờ khó hơn thật. Phần lớn số lần sáp nhập là do người đứng đầu đầu hàng (0,43 lần mỗi trận).
- Người đứng đầu đảo đi đánh chỉ ước sức theo số lính giữ cổng, vì không biết trước bao nhiêu dân sẽ cầm vũ khí. Trước khi sửa như vậy, số trận đánh tụt xuống còn 1,9.
- Cân chỉnh lại toàn cục để ở 7g (100 trận), như kế hoạch.

