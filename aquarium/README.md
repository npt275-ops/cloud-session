# Bể Kính

Một thành phố nhỏ trên hòn đảo bay, đặt trong một chiếc bể kính. 140 gia đình đi làm, mua bán, vay nợ,
ăn Tết, cưới nhau, đổ bệnh, đình công, chạy theo cơn sốt. Mọi thứ nhìn thấy trên đảo đều sinh ra từ một nền
kinh tế mô phỏng thật bên dưới, và nền kinh tế ấy chạy bằng **câu chuyện**: tin đồn, cơn sốt, phát minh, mạch vàng,
kẻ hứa lãi lan từ người này sang người kia, và chính sự lan truyền đó làm giá cả, việc làm, tín dụng thay đổi.

## Chạy

Trang cần được phục vụ qua HTTP (vì tải `sim.js`, `audio.js`, `story3d.js` cùng thư mục):

```bash
cd aquarium && python3 -m http.server 8000
```

Rồi mở `http://localhost:8000`. Thư viện 3D (three.js r128) tải từ CDN.

## Cấu trúc

| File | Vai trò |
|---|---|
| `index.html` | Thế giới 3D, giao diện, chính sách, xây dựng, hiện tượng, màn chào, chú giải |
| `story3d.js` | Lớp hình ảnh của câu chuyện: sợi lan truyền, đạo diễn camera, phụ đề, biên niên sử, công cụ của người giữ bể, ký ức, các biến cố lớn |
| `sim.js` | Lõi kinh tế và bộ máy câu chuyện: tất định theo seed, không phụ thuộc trình duyệt, chạy được bằng Node |
| `audio.js` | Âm thanh tự sinh bằng Web Audio, không dùng file âm thanh |
| `test/sim.test.js` | 28 bài kiểm thử cho lõi kinh tế và bộ máy câu chuyện |
| `tools/metrics.js` | Bảng chỉ số vĩ mô trên 8 thành phố (`OFF=gold,ponzi node tools/metrics.js` để tắt cơ chế mà so sánh) |
| `tools/calibrate.js`, `tools/diagnose.js` | Đo "độ sống" và chẩn đoán từng cơ chế |
| `archive/` | Các bản đề xuất giao diện trước khi chốt 3D |

## Ba mốc của "kinh tế chạy bằng câu chuyện"

### Mốc 1: Câu chuyện sống
- **Nỗi sợ lan có điểm bùng phát**: ít người sợ thì tự tắt, quá ba phần mười dân sợ thì thành đám đông kéo đến
  Kho Bạc, ngân hàng siết tín dụng. Sợi đỏ nối những mái nhà đang truyền tin cho nhau.
- **Cơn sốt và bong bóng**: một món hàng mới lan như dịch, người mê đội mũ cùng màu chen trước cửa xưởng, người giàu
  đầu cơ, giá vọt lên rồi bong bóng vỡ.
- **Phát minh**: tự nhiên hoặc do người chơi **gieo hạt phát minh** vào một xưởng (40 ngày ủ lại). Năng suất tăng,
  đối thủ học theo, nhu cầu lớn dần theo năng suất. Gieo nhiều vào một nơi có thể sinh ra độc quyền.
- **Khí cầu thương nhân** mua hàng bằng tiền bên ngoài; **hoả hoạn** thiêu kho và dựng lại bằng giàn giáo.
- **Đạo diễn camera** bay đến nơi có chuyện, **phụ đề** kể lại, **biên niên sử** ghi tất cả.

### Mốc 2: Người giữ bể và ký ức
- **Bốn công cụ**: gieo phát minh; **gõ vào kính** (vòng sóng và vết rạn trên vòm, đảo rung, gõ liên tiếp nhiều ngày
  thì nỗi sợ lan rộng hơn); **thì thầm tin đồn** ("Kho Bạc sắp vỡ", "Năm nay sắp mất mùa", "Xưởng kia có món mới");
  **gọi khí cầu** (đèn hiệu trên bến, 90 ngày mới gọi lại được).
- **Tin đồn mất mùa tự thành sự thật**: người tin đổ xô tích trữ, kệ lương thực vơi, giá lên; tin qua đi thì người ta
  ăn dần đồ tích trữ, hàng ế và giá rơi xuống dưới mức cũ.
- **Ký ức vĩnh viễn**: tượng đồng nhà phát minh quanh tháp đồng hồ, tàn tích xưởng phá sản trên lô đất, Đảo Đồ Cũ chứa
  đồ của những cơn sốt đã vỡ, đường mòn hằn dần trên cỏ theo lối người ta đi làm.
- **Chương năm**: cuối mỗi năm, thành phố đặt tên cho năm theo câu chuyện lớn nhất ("Năm 2: Năm của Cơn sốt đèn lồng
  không tắt") kèm tóm tắt, và chương ấy đứng đầu phần năm đó trong biên niên sử.

### Mốc 3: Thế giới rộng hơn
- **Mạch vàng trên Đồi Mây** (căn bệnh Hà Lan): tiền từ bên ngoài đổ vào, mỏ trả lương gấp rưỡi nên thợ bỏ ruộng
  bỏ xưởng lên đồi, lương khắp nơi bị kéo lên, người giàu lên mua hàng ngoại; mạch cạn thì thợ mỏ mất việc cùng lúc.
- **Dịch sốt**: lây qua người gặp người, người ốm nằm nhà nên sản lượng giảm và đường phố vắng; khỏi bệnh thì miễn dịch.
  Có thể bùng lên vào mùa đông hoặc theo khách trên khí cầu.
- **Kẻ hứa lãi** (mô hình Ponzi): một người lạ xuống từ khí cầu, hứa lãi 3% mỗi tuần, trả lãi người góp trước bằng tiền
  người góp sau, rồi bay đi bằng khinh khí cầu mang tiền ra khỏi đảo. Người mất tiền hoảng sợ.
- **Đình công**: khi giá cả tăng mà lương đứng yên, hay xưởng lãi to mà trả lương thấp. Lò nguội, không ai nhận lương,
  kết thúc bằng tăng lương hoặc thợ cầm đầu bị cho nghỉ. Đình công có thể lan sang xưởng khác.
- **Thâu tóm và độc quyền**: nơi lớn nhất trả nợ thay và nhận thợ của xưởng nhỏ đang chìm trong nợ; giữ hơn nửa thị
  trường một tháng thì thành độc quyền (cờ vàng trên mái), giá nhích dần cho đến khi đối thủ mới giành lại khách.
- **Dân số**: đám cưới (hoa bay giữa hai nhà), em bé, một thế hệ mới dọn ra ở riêng khi đủ bốn đứa trẻ lớn lên,
  người nhập cư theo khí cầu đến khi ai cũng có việc. Mỗi bốn gia đình mới, một ngôi nhà mọc lên.

## Lõi kinh tế

- **Hộ gia đình** có tay nghề khác nhau, đi làm, mua lương thực trước rồi mới đến hàng hoá, tiết kiệm phòng thân
  (nhiều hơn khi sợ), tiêu dùng có điểm bão hoà, người giàu tiêu xa xỉ hơn.
- **Doanh nghiệp** (lương thực, hàng hoá, mỏ vàng) có chủ sở hữu nhận cổ tức; đặt giá theo tồn kho; tuyển và sa thải
  theo lượng bán được thật; lương bám theo năng suất; khởi nghiệp khi ngành đang lãi; phá sản thì trả nợ ngân hàng trước.
  Xưởng mới cũng phải theo lương tối thiểu.
- **Ngân hàng** tạo tiền khi cho vay và huỷ tiền khi thu nợ gốc; thu lãi chính sách cộng biên rủi ro; dùng lợi nhuận
  bù nợ xấu; khi khủng hoảng niềm tin chỉ cho doanh nghiệp lành mạnh vay.
- **Nhà nước** thu thuế thu nhập, trợ cấp người thất nghiệp, có thể in tiền.
- **Sổ cái**: tổng tiền luôn bằng `ban đầu + tiền in + tiền từ bên ngoài (khí cầu, vàng, người nhập cư) + tiền tạo bởi
  cho vay − trả gốc − tiền hấp thụ bù nợ xấu − tiền rời đảo (hàng ngoại, kẻ hứa lãi)`. Bất biến này được kiểm tra
  trong test ở mọi bước.
- **Rổ giá** dùng giá trung bình của lương thực và giá trung vị của hàng hoá, để một món đang sốt giá gấp năm lần không
  bị tính là lạm phát của cả thành phố.

### Kết quả cân chỉnh (8 thành phố × 2.000 ngày, có đủ cơ chế của ba mốc)

| Chỉ số | Kết quả |
|---|---|
| Thất nghiệp trung bình | 3,9–4,8%, suy thoái có lúc lên 33–49% rồi tự hồi phục |
| Lạm phát | −1,1 đến 9,4%/năm (từ ngày 200) |
| Hộ thiếu ăn mỗi ngày | 0,0–0,1 |
| Gini | 0,44–0,54 |
| Đại sự / biến cố trong 5,5 năm | 27–34 / khoảng 100 |
| Mạch vàng, dịch, kẻ hứa lãi | 1 / 0–2 / 0–3 lần mỗi thành phố |

```bash
node --test            # 28 bài kiểm thử (chạy trong thư mục aquarium)
node tools/metrics.js  # bảng chỉ số trên 8 thành phố
```

## Giao diện

- **Thanh công cụ của người giữ bể** (bên trái; trên điện thoại là cột biểu tượng bên phải): vòng sáng quanh biểu tượng
  cho biết công cụ đã sẵn sàng hay còn phải chờ.
- **Chính sách**: rắc 10.000 xu (mưa đồng xu vàng), lãi suất, thuế, lương tối thiểu. Sau vài tuần, thành phố báo lại hệ quả thật.
- **Xây dựng**: nhà ở, cối xay gió, xưởng thủ công.
- **Biên niên sử**, **Phim tài liệu** (đạo diễn camera), **Chú giải**, âm thanh tự sinh (mặc định tắt), tự giảm chất lượng
  khi máy chậm, phím `Esc` đóng bảng hoặc thoát công cụ đang chọn.
