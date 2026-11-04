# Kịch bản NPC: thành phố sống qua từng thời

Dựng ở Lúa Vàng trước, nhân bản cho 5 đảo còn lại. Mọi thứ ở đây là **bảng dữ liệu + một bộ máy chung**.
Bộ máy không biết đảo nào. Đảo chỉ khác ở dân (gen, tính cách), công trình và mạng đường.

## Ba lớp kịch bản

Ưu tiên khi bộ não chọn việc, từ cao xuống thấp:
1. vị trí cứng;
2. drama;
3. tình huống của đảo (chiến tranh, hạn hán, tang, lễ hội);
4. lịch thường theo buổi.

### 1. Vị trí cứng (`logic/posts.js`)
Những chỗ luôn có người, đời này qua đời khác. Người cũ còn làm được thì giữ đúng chốt của mình. Ai mất hay già thì người
hợp tính nhất thay vào. Vị trí cứng được chọn người trước mọi việc khác, nên chốt không bao giờ trống.

| Chốt | Số người | Chỗ đứng | Giờ |
|---|---|---|---|
| Cổng thành chính | 4 | cổng thành giữa mép trước | ngày đêm |
| Cổng phụ trái | 2 | chỗ hở tường phía đảo bên trái (nơi bắc cầu) | ngày đêm |
| Cổng phụ phải | 2 | chỗ hở tường phía đảo bên phải | ngày đêm |
| Người diễn thuyết | 1 | bục giữa sân trước nhà chính | sáng và tối diễn thuyết, trưa ăn, chiều đi gặp dân |

Lính gác không bao giờ bị kéo vào drama.

### 2. Tính cách (`logic/temper.js`)
Mỗi người có một tính cách nổi trội, rút từ 8 gen tính cách. Điểm của mỗi tính cách được chuẩn hoá, để sáu loại công bằng như nhau:
- nóng nảy;
- sùng đạo;
- hoạt ngôn;
- ham học;
- nhút nhát;
- tham vọng.

Drama gom người theo tính cách. Chỉ nhận người thật hợp tính: đúng tính cách đó, hoặc điểm hợp tính đủ cao. Thiếu người thì
đám nhỏ đi, dưới mức tối thiểu thì drama không thành. Drama không kéo người khác tính vào cho đủ số.

### 3. Drama (`logic/dramas.js`)
Một drama gom người cùng tính cách đang làm việc khác lại một chỗ, diễn qua vài màn, rồi tan. Khi tan, lịch thường đưa từng
người về đúng việc của họ. Ví dụ: thầy thuốc đang đi thăm bệnh thì bỏ việc ra nghe diễn thuyết, xong lại về thăm bệnh.

| Drama | Ai | Ở đâu | Ai đến xử lý | Khoảng (9 năm, Lúa Vàng) |
|---|---|---|---|---|
| Bạo loạn | 1 người cầm đầu (tham vọng, nóng nảy) và 3–8 người nóng nảy hay tham vọng. Màn 1: tụ ở sân, hô hào. Màn 2: kéo tới nhà chính | sân, rồi nhà chính | 4 lính giữ trật tự, 2 tướng chỉ huy, người diễn thuyết ra can | ~10 (hạn hán ×6) |
| Ẩu đả ở chợ | 2 người nóng tính đánh nhau, 2–5 người hoạt ngôn đứng xem | chợ | 2 lính tới can | ~100 |
| Diễn thuyết lớn | người diễn thuyết và 5–10 người hoạt ngôn hay tham vọng đứng thành vòng nghe | bục | không | ~95 |
| Cầu nguyện tập thể | tư tế và 4–8 người sùng đạo | chỗ thờ | không | ~60 (hạn hán, tang tăng lên) |
| Tranh luận ở trường | 3–5 người ham học | trường, thư viện | không | ~60 |
| Tụ tập buôn chuyện | 3–6 người hoạt ngôn | sân | không | ~230 |
| Mừng thời mới | cả làng, người diễn thuyết đứng nói | sân | không | mỗi lần sang thời |

Mỗi drama là một dòng trong bảng `DRAMAS`. Một dòng ghi:
- các buổi có thể nổ ra;
- khả năng mỗi ngày và hệ số tăng;
- thời gian chờ giữa hai lần;
- các nhóm vai (tính cách, số người, hoặc lấy đúng người giữ chốt hay ghế);
- các màn (chỗ đến, việc, người nhìn vào);
- người đến xử lý;
- câu ghi nhật ký.

Thêm drama mới chỉ cần thêm dòng. Tới đêm drama tự tan. Cùng lúc có tối đa 2 drama. Một người không ở hai drama một lúc.

### Ở đúng chỗ của mình (`logic/tasks.js`, `render/buildings3d.js places`)
- Ai làm ở đâu thì đứng ngay trước chỗ làm đó (cửa nhà, ruộng, chợ, trường), lệch tối đa khoảng 2 đơn vị, không đi loạn.
- Buổi tối người lớn trò chuyện với hàng xóm (nhà kề bên) hay vợ chồng ngay trước cửa nhà mình. Người già kể chuyện, trẻ con
  chơi cũng ở trước cửa nhà. Buôn chuyện tụ trước cửa nhà người kể.
- Giữa sân chỉ còn người đứng đầu, quân sư, người diễn thuyết và người đi bộ qua lại. Chỉ khi có drama (bạo loạn, diễn thuyết
  lớn, mừng thời mới) giữa sân mới đông.
- Lính tuần và luyện quân ở 6 chốt rải dọc phía trong tường thành, không vòng quanh nhà chính.

### Không đi xuyên tường (`render/nav3d.js`)
- **Lối đi:** đi xa thì đi theo mạng đường của đảo, tìm đường ngắn nhất. Đường gồm vòng đường, đường toả, chỗ giao nhau và một
  nút giữa sân. Người đi trên vỉa hè bên phải, rồi từ điểm đường gần đích mới vào tận nơi.
- **Vòng tường:** không ai ra quá mép đảo trừ 5,2 đơn vị (tường ở mép trừ 3,5), dù đi đâu. Chỗ ngoài tường (bến, trại ven biển)
  không còn nằm trong danh sách chỗ đến.
- **Cổng chính:** 4 lính gác đều đứng phía trong cổng, hai hàng hai bên lối đi.

### Vỉa hè, vạch qua đường, xe nhường người (`render/build/roads.js`, `plains/town.js`, `render/build/traffic3d.js`)
- **Vỉa hè:** từ thời 3 (khi đường đã lát), mọi con đường có vỉa hè rộng 0,6 ở hai bên. Nhà, núi, cây không lấn vỉa hè
  (`HALF` = nửa mặt đường rộng nhất 1,8 + vỉa hè 0,6).
- **Vạch qua đường:** đặt hai bên mỗi ngã giao giữa vòng đường và đường toả, và rải đều dọc vòng đường (cứ 9 điểm một vạch,
  `crossIdx`). Kiểu vạch theo thời: lát đá, sơn trắng, rồi vạch phát sáng ở thành phố neon.
- **Người đi bộ:** đi giữa vỉa hè và giữ nguyên bên đang đi. Chỉ sang đường ở chỗ có vạch: tại vạch cuối cùng trên đường đi,
  sang cho đúng bên nơi cần tới. Đi gần thì đi thẳng, trừ khi phải băng qua vòng đường. Chỗ đứng trước cửa hay trước chỗ làm mà
  rơi vào lòng đường thì lùi ra vỉa hè.
- **Xe:** có người đứng trên lòng đường ngay phía trước (0,3 tới 4,2 đơn vị) thì dừng chờ; người trên vỉa hè thì không làm xe
  dừng. Xe giữ khoảng cách với xe phía trước nên không đâm vào nhau. Toa bám theo đầu tàu. Xe bay không phải dừng.

### Đi dạo quanh nhà chính
- Khoảng một phần ba người đi đường đi vòng quanh nhà chính, cách tường nhà chính khoảng 2,5. Vòng này tính theo khung bao thật
  của nhà chính đang đứng. Mỗi người đi một chiều; gặp nhau thì dừng lại trò chuyện.

### Đời thường trên phố (`render/village3d.js`, lối đi ở `render/nav3d.js`)
- Người đi đường đi dạo dọc mạng đường của đảo (`roads.js isleNet`). Họ đi dọc vòng đường một quãng, có khi rẽ ra đường toả
  tới gần cổng rồi quay lại. Họ đi lệch về bên phải mặt đường, tức vỉa hè, nhường giữa đường cho xe.
- Hai người đi dạo gặp nhau thì dừng lại trò chuyện 3–8 giây (mặt vui, cử chỉ nói chuyện), rồi đi tiếp. Mỗi người nghỉ ít nhất
  18 giây mới dừng nói chuyện lần nữa.

## Nhân bản sang đảo khác
1. Đảo có logic dân: `BK.Island.create({ key })` với gia tộc, nét gen riêng (`ISLANDS`, `People.CLANS`).
2. Hiển thị dân: `BK.Village3D.create({ L, S, places })`, với `places` lấy từ `buildings3d.places(i)`. Hàm này đã có sẵn
   cổng chính, cổng phụ trái, cổng phụ phải, bục diễn thuyết, chợ, trường, chỗ thờ cho mọi đảo.
3. Không phải sửa vị trí cứng, tính cách hay drama. Gen riêng của đảo tự cho ra tần suất drama khác: đảo hiếu chiến bạo loạn
   nhiều hơn, đảo sùng đạo cầu nguyện nhiều hơn.

## Thử
- Bảng làng có nút: Bạo loạn, Ẩu đả, Diễn thuyết, Cầu nguyện, Tranh luận, Buôn chuyện, Yên ổn (dừng mọi drama).
- `test/island.test.js` kiểm tra:
  - đủ 4 / 2 / 2 / 1 người ở các chốt suốt 9 năm;
  - drama chỉ gom đúng tính cách;
  - lính gác không bỏ chốt;
  - drama tan thì mọi người về việc cũ.

## Mỗi việc một chỗ (tệp nào lo việc gì)

| Việc | Tệp |
|---|---|
| Tính cách nổi trội | `logic/temper.js` |
| Vị trí cứng (gác cổng, diễn thuyết) | `logic/posts.js` |
| Drama: bảng dữ liệu và bộ máy, kể cả người tránh drama | `logic/dramas.js` |
| Lịch thường theo vai, theo buổi | `logic/tasks.js` |
| Chọn việc (thứ tự ưu tiên) | `logic/brain.js` |
| Chỗ đến trên đảo (cửa nhà, cổng, bục, vòng quanh nhà chính) | `render/buildings3d.js places` |
| Lối đi, vỉa hè, sang đường, tường thành, đi dạo | `render/nav3d.js` |
| Vẽ và cử động người | `render/village3d.js` |
| Xe chạy, nhường người đi bộ | `render/build/traffic3d.js` |
| Công trình không chắn đường (đo cỡ thật, dời, thu nhỏ) | `render/build/place3d.js clearRoad` |
