> **Lịch sử, không cập nhật nữa.** Đây là README cũ (tới bước 11), giữ nguyên văn để tra lại quyết định và cách đã làm.
> Nhiều đoạn đã cũ (ví dụ "năm đảo còn lại chưa có công trình", "nút bay trên màn hình"). README hiện hành:
> `aquarium/README.md`; bản đồ mã nguồn: `aquarium/MA-NGUON.md`.

# Bể Kính — Chaos Sandbox

Bể Kính đang được **làm lại từ đầu** theo hướng mới: từ mô phỏng kinh tế của hàng nghìn NPC vô danh sang câu chuyện
của **48 nhân vật cốt lõi** (8 người mỗi đảo, 4 nam, 4 nữ) có tên, có 8 gen tính cách và có dòng dõi. Một trận dài 9 năm,
qua 12 cấp văn minh và 6 thế hệ (1,5 năm một thế hệ); thống nhất cả sáu đảo trước cấp 10 là thắng nhanh. Bản thiết kế
đầy đủ nằm trong tài liệu "Bể Kính — Chaos Sandbox" (10 mục).

## Hiện có: sáu đảo thô

Bước 1 của kế hoạch là dọn sạch. Mở game là thấy bể kính yên tĩnh với sáu hòn đảo chỉ có thiên nhiên:

| Giữ | Bỏ khỏi game |
|---|---|
| Bể kính, vòng đồng, biển phủ kín đáy bể, chậu kính trong suốt đựng nước | Nền kinh tế mô phỏng từng hộ gia đình (`sim.js`) |
| Sáu dáng đất: Lúa Vàng (đồng bằng), Thông Xanh (rừng), Đá Mây (núi), Tuyết Trắng (băng nguyên), Cửa Sóng (biển), Cát Hồng (sa mạc) | NPC, đám đông, lính, thú săn |
| Hồ riêng của từng miền, sông, suối, cây, núi, đồi cát, mỏm đá, băng trôi, đồng cỏ hoa dại | Chiến tranh, kịch bản hỗn loạn, đời sống trong thành, phố xá |
| Sáu cây cầu thô nối vòng sáu đảo | Quyền năng của thần (sẽ nối lại vào logic mới) |
| Ngày đêm, trăng sao, bốn mùa đổi màu đất và cây, tuyết mùa đông trên băng nguyên và núi | Biên niên sử, phụ đề, chương năm, bảng chính sách |
| Mây trong bể theo đợt, dính thành cụm, mưa theo mùa (hạ mưa to, cuối thu mưa nhỏ), sấm sét | Ruộng bậc, thuyền, bậc đá, cầu gỗ, lều câu: những dấu vết của người trên đảo |
| Camera kéo xoay, bay bằng phím, tốc độ 1×, 2×, 4× | |

Ván chín năm ở tốc độ 1× hết khoảng 72 phút; đồng hồ góc phải ghi năm, mùa và ngày.

## Bản chính: chín năm, mười hai thời kỳ trên Lúa Vàng

NPC mẫu đã ra khỏi bể (code vẫn giữ trong `render/`, `ui/`, `logic/` để dùng lại). Công trình cũ đã bỏ hẳn; code cũ còn
trong lịch sử git. Một trận dài **9 năm**, đi qua **12 thời kỳ** (`logic/eras.js`). Bây giờ mỗi thời dài 270 ngày
(9 tháng trong game), sau này logic của đảo sẽ quyết định khi nào lên cấp. Như bể kính cũ: tốc độ 1×, 2×, 4× (4× là
nhanh nhất), không có tạm dừng, không có nút tua; mỗi thời trôi qua trước mắt: 6 phút ở 1×, 3 phút ở 2×, 1,5 phút ở 4×
(cả trận 72, 36, 18 phút). Đồng hồ ghi cấp x/12 · mùa · ngày; thanh dưới ghi tên thời và phần đã đi tới thời sau.
Mở với `?cap=5` để vào thẳng cấp 5 khi phát triển.

Lên cấp thì công trình đổi ngay sang kiểu của thời mới, lần lượt từng chỗ khi thợ làm xong. Công trình vẽ theo cách của đảo (mặt phẳng, góc
vát, chân sẫm dần lên mái), cỡ theo người cao 1,4, mỗi công trình gộp thành một khối.

| Cấp | Thời kỳ | Nhà chính | Công trình khác trên Lúa Vàng |
|---|---|---|---|
| 1 | Thời đồ đá | Lều lớn của tù trưởng | Lều nón cành lá, lều da thú, bếp lửa chung, bãi ghè đá, giàn phơi da, bãi lúa dại, cột vật tổ có sọ thú, đá dựng, vách đá vẽ |
| 2 | Cổ đại | Cung Đất Nung | Lều tròn vách đất, kho lương trên cột, ruộng có rào, lò gốm và chum vại, giàn phơi lúa, cột vật tổ, đống rơm, bãi đá thờ |
| 3 | Trung đại | Đình làng | Nhà ba gian mái rơm, kho thóc nhà sàn, giếng, cổng làng, cây đa, lò rèn, cối xay gió (cánh quay), ruộng |
| 4 | Cận đại | Tháp Đồng Hồ | Nhà gạch hai tầng, chợ có mái, nhà in, bãi khí cầu (nhấp nhô), đèn dầu, đường lát đá |
| 5 | Công nghiệp | Toà Thị Chính | Dãy nhà gạch đỏ có ống khói, xưởng xay lúa mái răng cưa, ga tàu với đầu máy hơi nước (chạy qua lại), đèn khí, máy cày hơi nước |
| 6 | Hiện đại | Trung Tâm Hành Chính | Chung cư, trường học, siêu thị và xe hơi, tuabin gió (quay), cột điện, đường nhựa, nhà kính trồng lúa |
| 7 | Tên lửa | Tháp Điều Hành | Bệ phóng và tên lửa, chảo vệ tinh (quay chậm), nhà máy điện hạt nhân, tháp chung cư |
| 8 | Robot AI | Lõi Trí Tuệ (vòng sáng quay) | Nhà mô-đun, trung tâm dữ liệu, bãi drone (bay nhấp nhô), robot làm ruộng, đường sáng |
| 9 | Vật Chất Sống | Lõi San Hô | Nhà búp tự mọc, đèn nấm, ruộng trên lá sen khổng lồ |
| 10 | Mặt Trời Nhân Tạo | Tháp Lơ Lửng (các tầng trôi) | Mặt trời nhỏ trên làng, nhà lơ lửng, cột dẫn nắng |
| 11 | Bẻ Cong Không Gian | Cổng Trung Tâm (lòng cổng xoáy) | Nhà gấp khúc, cổng nhỏ, mảnh không gian trôi |
| 12 | Siêu Việt | Cột Sáng | Nhà pha lê, đốm sáng trôi |

Năm đảo còn lại chưa có công trình, sẽ làm sau khi chốt Lúa Vàng.

### Người và logic ngầm chạy theo thời gian thực
- Logic của đảo (`logic/island.js`) chạy cùng đồng hồ của bể. 8 người lập làng (4 nam, 4 nữ), hội đồng 8 ghế; mỗi ngày
  người già đi; cứ 1,5 năm một mốc thế hệ thì ai đủ tuổi kết đôi; con sinh rải đều (trẻ em tối đa khoảng 28% để các lứa
  tuổi đều nhau). **Tối đa 100 người một đảo.** Hạn hán mùa hạ, tang, cãi nhau, biểu tình tự xảy ra.
- **Tuổi thọ như đời thật** (`logic/people.js`, luật Gompertz): khả năng mất mỗi năm tăng gấp đôi sau khoảng 8 năm tuổi,
  người trẻ cũng có thể mất vì bệnh. Thời càng tiến bộ, y học càng tốt, người sống lâu hơn. Người già chiếm khoảng 10–16% dân.
- **Dàn vai cố định, ai cũng có việc chính** (`logic/council.js`, `logic/jobs.js`, chọn theo tính cách; bảng đầy đủ trong
  `design/kich-ban-npc.md` mục 8): 1 người đứng đầu (đứng chỉ đạo trước nhà chính), 1 quân sư, 2 tướng (luyện quân, kiểm
  tra chốt gác), 1 tư tế (cầu nguyện ở chỗ thờ), 1 thầy thuốc (đi thăm bệnh từng nhà), 4 thợ xây, 2 thương nhân (bán ở
  chợ), lính (gác, tuần, luyện), người đi đường (đi qua lại, ra chợ, trò chuyện), nông dân, người già, trẻ em.
- Kịch bản một ngày (`logic/schedule.js`, `logic/tasks.js`): mỗi người có một việc rõ ràng (đến đâu, làm gì, vì sao), đổi
  buổi thì chọn lại. Trưa về nhà ăn, tối tụ ở sân làng, đêm về nhà ngủ (không vẽ), một nửa số lính thay nhau gác.
  **Nhà chính chỉ đông khi biểu tình**: hạn hán kéo dài thì người đa nghi, hiếu chiến kéo tới đối mặt người đứng đầu, lính
  ra giữ trật tự. Mỗi việc có cử chỉ và đồ cầm tay theo thời (`render/work3d.js`).
  Thẻ người ghi việc đang làm và lý do.
- **Công trình lên đời ngay lập tức** (`logic/construction.js`, `render/buildings3d.js` `setProgress`): công trình các
  thời trước không biến mất. Sang thời mới, thợ làm lần lượt từ nhà chính; chỗ nào làm xong thì công trình ở đó đổi ngay
  sang kiểu của thời mới (không mọc dần, không giàn giáo); chỗ trống thì công trình mới hiện ra ngay. Cái cũ không có gì
  thay thì giữ nguyên.
  Hết việc dựng thì thợ đi tu bổ. Nhật ký ghi “Dựng xong …”.
- **20 nhà riêng, mỗi hộ một nhà** (`render/build/plains/common.js` `homes`, `logic/homes.js`): vòng trong 8 nhà, vòng
  ngoài 12 nhà, cùng chỗ ở mọi thời (nhà số i thời mới thay ngay nhà số i thời cũ). Vợ chồng và con nhỏ ở chung; lớn
  mà chưa cưới thì ra ở riêng nếu còn nhà; cả hộ không còn ai thì nhà trống cho hộ mới. Đêm, trưa ai về đúng nhà mình;
  thẻ người ghi “Nhà số …”. Nhà cao tầng của thời sau được thu cho vừa chỗ một hộ.
- **Mười hai kỳ quan** (`render/build/plains/wonders.js`): mỗi thời một công trình cao gấp hai ba lần nhà thường (Vòng Đá
  Mặt Trời, Tháp Lúa, Thành Lũy, Đại Tháp Chuông, Nhà Máy Ống Khói, Tháp Truyền Hình, Bệ Phóng, Tháp Dữ Liệu, Cây Sống Khổng
  Lồ, Mặt Trời Nhân Tạo, Cổng Không Gian, Thành Phố Lơ Lửng), đứng ở một chỗ cố định bên làng; sang thời mới kỳ quan mới
  thay kỳ quan cũ ngay tại chỗ đó.
- **Hết thời nào thì mọi công trình của thời đó đều được thay** (`render/buildings3d.js`): không giữ lại công trình cũ nào;
  cái cũ chưa có gì thay thì mất khi công trình mới gần nó xong. Trang phục đổi ngay khi sang thời.
- **Tường bao kín sát mép đảo** (`render/build/plains/town.js` `edgeWall`): thời đồ đá chưa có tường; từ thời 2 tường chạy
  liền quanh cả đảo theo dáng mép thật (qua cả chỗ núi, hồ, sông), chỉ hở đúng ba chỗ: cổng thành chính giữa mép trước, và
  hai chỗ sau này bắc cầu sang hai đảo bên cạnh (hai đầu chỗ hở có trụ). Mỗi thời một kiểu tường: lũy tre, tường thành có tháp,
  tường gạch có pháo đài, rào sắt, kè bê tông có đèn, tường trắng, rào năng lượng, tường cây sống, tấm chắn nắng, cột trường
  lực, rèm ánh sáng.
- **Mỗi đảo một mạng đường riêng** (`render/build/roads.js`), giữ qua mọi thời, chỉ đổi mặt đường, đèn, cây theo thời:
  Lúa Vàng vòng tròn và bốn đường toả; Thông Xanh vòng lượn sóng, lối rừng uốn khúc; Đá Mây vòng ngoài rộng, đường trước đi
  chữ chi; Tuyết Trắng vòng vuông bo góc, đại lộ trước sau; Cửa Sóng vòng bầu dục dọc bờ; Cát Hồng vòng vuông, bốn đại lộ chữ
  thập. Công trình không đặt chắn đường (`render/build/place3d.js` tránh mặt đường); đèn, cây đứng bên lề.
- **Xe chạy theo đường** (`render/build/vehicles.js`): mỗi xe chạy dọc vòng đường của đảo, đầu xe luôn quay theo hướng đi,
  toa tàu nối đuôi nhau: xe trâu, người cưỡi ngựa, xe ngựa kéo, tàu hơi nước ba toa, ô tô, tàu một ray trên cao, rô-bốt giao
  hàng, hạt giống bay, xe bay, quả cầu sáng, thoi ánh sáng.
- **Cổng thành** (`render/build/gates.js`): ở chính giữa mép trước mỗi đảo, nơi đường lớn ra biển; 12 dáng theo thời (đá
  dựng, cổng gỗ có chòi, cổng thành đá hai tháp, cổng gạch đồng hồ, cổng vòm sắt, cổng bê tông, cột ra-đa, khung quét an ninh,
  vòm cây sống, vòm mặt trời, cổng không gian, cổng ánh sáng) × 6 biến thể theo đảo (dáng tháp, mái, màu, vật trên đỉnh):
  72 cổng khác nhau. Bốn lính gác cổng của Lúa Vàng (`logic/jobs.js` gatekeeper, `GATEKEEPERS: 4`) ngày đêm đứng ở bốn
  chốt, người cũ già đi thì người mới vào thay, thế hệ nào cũng đủ 4.
- Lúa Vàng sau thời Trung đại không còn ruộng lúa (thời 4 trở đi bỏ ruộng, đống rơm, máy cày, rô-bốt làm ruộng).
- **Cao ốc cho các thời sau**: Lúa Vàng thời 8 tòa nhà thông minh, thời 9 tòa sinh học, thời 10 tòa mặt trời, thời 11 tòa
  xoắn, thời 12 tháp pha lê (cao 15 đến 30).
- **Nhà chính của năm đảo lên cấp đều** (`render/build/isles/halls.js`): mỗi đảo một dòng nhà chính riêng, không dùng chung
  với đảo khác; thời sau luôn cao hơn, nhiều tầng hơn, nhiều tháp hơn (thời 6 có dải kính, thời 9 vạch sáng và tháp sáng, thời
  11 vòng quay quanh đỉnh, thời 12 vương miện lơ lửng). Hoa văn riêng: Thông Xanh mái chùa và tán lá, Đá Mây lục giác và đá
  bay, Tuyết Trắng mái vòm và mũi băng, Cửa Sóng vây buồm và vòng sóng, Cát Hồng bậc thang và mái củ hành. Từ thời Tên lửa
  (7) mỗi đảo một công trình biểu tượng riêng cho từng thời (`render/build/isles/halls-future.js`, 30 công trình): bệ phóng,
  bộ não, công trình sống, công trình mặt trời, vật lơ lửng, thành phố bay, mỗi đảo một dáng (ví dụ Thông Xanh: tháp phóng
  quả thông, bộ não rừng, cây mẹ, hoa mặt trời, thân cây xoắn, Cây Thế Giới).
- **Năm đảo còn lại có kiến trúc riêng qua 12 thời** (`render/build/isles/`): bộ kiểu chung `arch.js` (27
  kiểu nhà, 21 kiểu nhà chính, công trình nhỏ, 11 kỳ quan riêng), `compose.js` ghép bố cục (nhà chính, 20 nhà riêng, công
  trình nhỏ, đường và tường sát mép, công trình ngoài làng, kỳ quan), mỗi đảo một tệp chọn kiểu, tên và bảng màu cho từng thời
  (`forest.js`, `mountain.js`, `tundra.js`, `coast.js`, `desert.js`). Trong cùng một thời không có hai đảo chung kiểu nhà hay
  kiểu nhà chính. Bảng đầy đủ: `design/kien-truc-12-thoi.md`. Năm đảo này chưa có dân, công trình lên đời đều theo thời gian.
- **Cao thấp xen kẽ, dáng lạ, công trình công cộng**: 20 nhà riêng mỗi thời không còn một kiểu. Từ thời 3 có nhà nhỏ đứng
  xen; từ thời 6 có thêm toà dáng lạ, mỗi thời một dáng khác, không hai đảo trùng trong một thời: cao ốc cánh hẫng, tháp đôi
  cầu nối, tháp nghiêng, tháp nấm, kim tự tháp ngược, tháp vòng, tháp xoắn ốc. Nhà nhỏ của Lúa Vàng thời 8 đến 12 là các kiểu
  nhà cũ giữ lại (nhà mô-đun, nhà búp, nhà lơ lửng, nhà gấp, nhà pha lê); các đảo dùng biệt thự, nhà con nhộng, nhà khối
  chồng, nhà cầu tròn. Công trình công cộng (`render/build/civic.js`): trường học, thư viện, bảo tàng, bệnh viện, nhà hát,
  sân vận động, nhà tắm, đài thiên văn, mỗi loại bốn dáng theo giai đoạn, mỗi thời một bộ khác thời trước, ở cả sáu đảo.
- **Ánh sáng dịu (“chill”)** (`render/mood3d.js`): giữ màu đậm như gốc (nén màu tuyến tính; có thể đổi sang ACES ở TONE);
  bảng màu ấm theo giờ (bình minh hồng cam, sáng trong, trưa vàng nhạt, chiều vàng mật ong, hoàng hôn cam tím, chạng vạng
  tím, đêm tím xanh), sương ngả theo chân trời; bóng dịu nhờ đèn trời sáng hơn và một đèn hắt nhẹ phía ngược nắng. Mọi màu
  trời và ánh sáng theo giờ nằm ở một chỗ (KEYS), độ phơi sáng ở TONE.
- **Sáu đảo tự vận hành, một đồng hồ** (`logic/world.js`, `game/cities.js`, `design/quy-trinh-tong-quat.md`): cả sáu đảo đều có
  dân (gia tộc và nét gen riêng của từng đảo), chạy cùng nhịp theo bước cố định 1/12 ngày lịch, thứ tự cố định; lịch và giờ
  trong ngày do logic giữ. Cùng seed thì chạy 1×, 2×, 4× ra cùng một lịch sử (đã kiểm thử). Người đi, xe chạy theo giờ game
  từng bước con 0,05 giây; cử chỉ tại chỗ nhanh nhất 2×; chỉ đảo gần máy quay mới vẽ người. Mặt trời nhân tạo theo cấp riêng
  từng đảo; trời tím khi cả sáu đảo tới thời 10.
- **Tài nguyên và lên cấp** (`logic/economy.js`, giỏ tài nguyên ở `logic/eras.js`): sáu loại tài nguyên (lương thực, gỗ, đá,
  kim loại, năng lượng, hàng quý); mỗi đảo dồi dào vài thứ, gần như không có vài thứ. Người làm được chia việc theo nhu cầu
  (đủ ăn trước, rồi thứ giỏ thời sau còn thiếu), năng suất theo gen. Mỗi đảo lên cấp riêng khi nộp đủ giỏ tài nguyên, nên có
  đảo không chạm tới thời 12. Đói thì không sinh con, bạo loạn dễ nổ. Nút ◀ ▶ (dev) đặt thẳng cả sáu đảo vào một thời.
- **Khí hậu và ngoại gen** (`logic/climate.js`, `logic/epigen.js`): mỗi đảo một bộ thiên tai theo mùa (hạn hán, lũ, cháy rừng,
  sạt lở, rét đậm, bão tuyết, bão biển, bão cát, nắng nóng) cộng dịch bệnh hiếm gặp, làm sản xuất kém đi, bắt dân trú bão, có
  thể có người mất. Nghịch cảnh (đói, thiên tai, chiến tranh, mất người thân) để lại dấu ngoại gen lên tính cách biểu hiện,
  phai dần khi yên ổn, truyền một phần cho con; sinh ra lúc khổ dễ đột biến hơn. Thẻ người hiện dấu ngoại gen từng chỉ số.
- **Người đứng đầu, giao thương, hiệp ước, cầu** (`logic/strategy.js`, `logic/diplomacy.js`, `render/travel3d.js`): mỗi 10
  ngày người đứng đầu từng đảo (pha ý quân sư và hai tướng) xét tình hình theo tính cách của mình. Họ quyết:
  - tích quân hay giảm quân;
  - đi buôn để đổi đặc sản lấy thứ thiếu; giá theo độ khan hiếm, người mưu mô mặc cả giỏi hơn, bên kia có thể từ chối;
  - ký hiệp ước không xâm phạm hay liên minh.

  Sắp hết lương thực thì đi mua ngay, không đợi kỳ xét; đói thì dồn người ra làm. Quan hệ giữa các đảo có trí nhớ: tin cậy
  tăng theo mỗi chuyến buôn và hiệp ước, rồi phai dần. Đoàn buôn đi thật: thuyền băng biển, hay xe hàng qua cầu, nhanh hơn.
  Hai đảo kề nhau buôn đủ nhiều thì cùng góp gỗ đá bắc cầu, dáng cầu theo thời. Góc dưới hiện ba tin mới nhất giữa các đảo; bấm vào thì mở bảng dev
  "Cuộc đua" (`ui/race-dev.js`: mỗi đảo một thẻ, số liệu cả bể, nhật ký chung, bấm tin thì bay tới đảo đó). Giao thương giúp các đảo lên thời nhanh hơn và mua được lương thực khi đói.
- **Chiến tranh, sáp nhập, nổi dậy** (`logic/war.js`, quyết định ở `logic/strategy.js`, vẽ ở `render/war3d.js`):
  - Người đứng đầu hiếu chiến, tham vọng, đang thù hay đang thiếu thì muốn đánh. Quân chưa đủ thì tích quân trước, nhìn sức hai
    bên theo tính mình (tham vọng thì tự tin quá, đa nghi thì e dè). Người mưu mô thì đánh úp, có khi xé cả hiệp ước.
  - Quân là người thật: lính, tướng, dân binh rời đảo, đi thuyền hay qua cầu, đánh ở cổng phụ, mỗi ngày một đợt.
  - Đột kích thì cướp kho rồi về. Tổng tấn công phá cổng, vào thành (dân phản ứng theo tính cách), chiếm nhà chính thì sáp nhập.
  - Sau sáp nhập: kho, dân, quân về tay đảo thắng; người cai quản từ đảo thắng sang; dùng chung thời; có quân đóng giữ; cắm cờ
    đảo cai quản ở sân nhà chính.
  - Bên yếu có thể xin hoà, đồng minh có thể gửi quân giúp. Dân bị sáp nhập bất bình thì có thể nổi dậy, thắng thì độc lập lại.
  - Chạy 30 trận đấu: khoảng 4 trận đánh mỗi trận đấu, 7 lần sáp nhập, 7 cuộc nổi dậy (3 thành công).
- **NPC sống thật, phần 7a** (`design/npc-song-that.md` mục 9):
  - mỗi đảo, mỗi thời có bãi làm việc thật trong tường thành (kho có đống hàng theo lượng hàng thật, ruộng, bãi gỗ, mỏ đá,
    xưởng, bãi tập, chỗ làm năng lượng; `render/build/workyards3d.js`);
  - người làm việc có đầu vào, đầu ra: làm ở chỗ làm, mang sản phẩm về kho rồi quay lại; thợ xây lấy vật liệu ở kho mang tới
    công trình; vác hay ôm hàng đúng thứ đang mang; không còn ai đứng làm việc ở chỗ không phải chỗ làm (có kiểm thử);
  - người đứng đầu có bộ kịch bản (`logic/leader.js`: họp hội đồng, nhận tin, thị sát có hộ vệ, duyệt quân, nói trước dân,
    phân xử, cầu nguyện…); lính gác cổng mỗi người một kiểu, có ca ngày ca đêm, báo tin, xem hàng, ăn tại chốt
    (`logic/guards.js`).
- **NPC sống thật, phần 7b, 7c** (`design/npc-song-that.md` mục 10, 11):
  - đám tang ba chặng (khóc ở nhà, đưa tang có người khiêng quan tài, chôn cất), bãi mộ lớn dần theo lịch sử của đảo; nạn
    đói: dân xếp hàng ở kho nhận khẩu phần; lễ hội nhảy múa; lính gác cúi chào người đứng đầu (`logic/scenes.js`);
  - cầu do người đứng đầu quyết, thợ hai đảo xây thật (giàn giáo mọc dần), mỗi thời một kiểu cầu (quyết định xây lại), phá
    cầu khi bị đánh, cầu quân sự; người thật sang thăm đảo bên qua cầu (mặc áo màu đảo nhà), xô xát ở đầu cầu.
- **NPC sống thật, phần 7d: đánh thành** (`design/npc-song-that.md` mục 12, `logic/siege.js`, `render/build/ruins3d.js`):
  - người nhà ra cổng tiễn quân; quân tới qua cầu thì đánh cổng phụ, đi thuyền thì đánh cổng chính; lính gác đúng cổng và
    dân nóng nảy ra giữ, dân khác vào nhà; quân giặc là người thật mặc màu đảo mình, người ngã nằm lại trên đất;
  - cổng vỡ thì địch đốt phá kho, xưởng, nhà dân, ruộng (mất hàng, mất sản lượng, dân ở nhờ), dân dạt sang phía bên kia đảo;
    rồi vây nhà chính, đội giữ thành đánh tới cùng hay người đứng đầu đầu hàng theo tính cách; mất thành thì vua cũ quỳ,
    cờ hạ xuống kéo lên; hết giặc thì thợ xây sửa lại (giàn giáo).
- **NPC sống thật, phần 7e: tên lửa, hạt nhân** (`design/npc-song-that.md` mục 13, `logic/missiles.js`, `render/missiles3d.js`):
  - từ thời 7 đảo giàu làm tên lửa theo tính người đứng đầu; quân sắp tới thì bắn trước (cổng, kho, xưởng, nhà), báo động,
    dân trốn vào nhà, đảo bị đánh bắn trả; tên lửa chỉ phá, bộ binh vẫn phải chiếm nhà chính;
  - từ thời 8 người đứng đầu hiếu chiến, tham vọng có thể làm hạt nhân: mỗi quả san phẳng một phần tư đảo, nhiễm xạ, cả bể
    sợ và mất mùa, trời xám bụi; bốn quả thì đảo bị san phẳng, buộc sáp nhập.
- **NPC sống thật, phần 7f: hệ sinh thái hỗn loạn** (`design/npc-song-that.md` mục 14, `logic/ecology.js`):
  - rừng thưa dần (cây trên đảo thưa đi thật), mỏ cạn, đất bạc màu, khói bụi; người đứng đầu chọn khai thác nhanh hay giữ đất;
  - chạy nạn sang đảo khác (có đảo đóng cửa), lấy vợ chồng khác đảo, dịch lây theo người qua lại và đảo đóng cầu, người ốm
    nằm nhà, đảo chính, tranh ngôi, cấm vận, thừa nước đục thả câu; chuyền nước chữa cháy rừng, bàn giao ca gác;
  - mỗi chuyện ghi nguyên nhân trong tin ("vì …", "do …").
- **NPC sống thật, phần 7g: cân chỉnh bằng 100 trận** (`design/npc-song-that.md` mục 15): đủ 6 đảo độc lập ở 34% số trận,
  còn ≤2 đảo 2%; thời trung bình 8,97; 6,6 trận đánh và 1,6 sáp nhập mỗi trận; chết đói 2,8; hạt nhân được dùng ở 6% số trận.
  Đảo cai quản gửi quân giữ đảo nó cai quản; luân canh; môi trường ảnh hưởng sản lượng nhẹ hơn.
- **Thấy được chiến tranh và drama** (`design/npc-song-that.md` mục 16): đảo đang xem có chuyện thì thời gian chậm lại 16
  lần; thanh dev có ◀ Năm x/9 ▶, "Trận đánh ⏭", "Drama ⏭" (tua tới chuyện kế tiếp và bay tới đó), bỏ nút Bay; biểu tình xếp
  hàng ngang hàng dọc trước nhà chính, cầm biển hô khẩu hiệu; quân đột kích đổ bộ ở cổng yếu nhất nên chiến tranh tới sớm hơn.
- **Bước 8: chiến tranh theo thời, kịch bản chiến tranh, thịnh vượng và suy tàn** (`design/chien-tranh-thinh-vuong.md`):
  vũ khí 12 thời (ná, cung, nỏ, hoả mai, súng trường, súng máy, súng tia…; máy bắn đá, đại bác, pháo, xe bọc thép, drone,
  pháo plasma; cổng dịch chuyển, lá chắn) có đạn bay thật; hải chiến, phục kích, đánh đêm, nội gián, đấu tướng, vây thành,
  tù binh, khải hoàn; thời hoàng kim (cờ, đèn lồng), kỳ quan mọc dần, phát minh, suy tàn (cỏ dại), ngư trường chung; biên
  niên trong bảng Cuộc đua, nhân vật nổi bật có danh hiệu; cả bể yên quá lâu thì có người đứng đầu thấy bị sỉ nhục.
  100 trận: 9,1 trận đánh, 1,9 sáp nhập, thời trung bình 9,1, chết đói 4,0, hạt nhân ở 8% số trận, 4,5 chuyện lớn mỗi năm.
- **Bước 9: chỉ bắn xa, máu, NPC có trật tự** (`design/chien-tranh-thinh-vuong.md` mục 8): bỏ cận chiến; hai bên xếp hàng
  ngang hàng dọc mà bắn (quân đánh ngoài tường, quân giữ trong cổng, trước nhà chính); người có máu, trúng đạn mất máu, hết máu
  thì ngã, rút về thì hồi; cổng và nhà chính có thanh máu, cổng hết máu thì vỡ, nhà chính hết máu thì mất thành; xe tăng bắn
  đạn thẳng từ nòng. Không còn bước chân tại chỗ; làng lập ra có trẻ đủ lứa tuổi; trẻ nhỏ ở trong nhà, sáng ra sân chơi có
  người già trông; người làm việc vặt đi chợ, ra kho mang đồ về nhà chứ không đi dạo vô định. 100 trận: 8,9 trận đánh, 1,75
  sáp nhập, thời trung bình 9,5, chết đói 1,9, hạt nhân ở 6% số trận.
- **Kịch bản NPC: thành phố sống** (`design/kich-ban-npc.md`), ba lớp dùng chung cho mọi đảo:
  - vị trí cứng (`logic/posts.js`): 4 lính gác cổng chính, 2 cổng phụ trái, 2 cổng phụ phải, 1 người diễn thuyết, đời này qua đời khác;
  - tính cách nổi trội của từng người (`logic/temper.js`): nóng nảy, sùng đạo, hoạt ngôn, ham học, nhút nhát, tham vọng;
  - drama (`logic/dramas.js`): bạo loạn, ẩu đả ở chợ, diễn thuyết lớn, cầu nguyện tập thể, tranh luận ở trường, buôn chuyện,
    mừng thời mới. Drama gom người cùng tính cách bỏ việc ra tham gia, tan thì về việc cũ; mỗi drama là một dòng dữ liệu.
  - Người đi đường đi dạo dọc phố trên vỉa hè, gặp nhau thì dừng lại trò chuyện rồi đi tiếp (`render/village3d.js`).
  - Ai làm ở đâu thì ở trước chỗ đó; tối trò chuyện với hàng xóm trước cửa nhà; giữa sân chỉ có vài người đi bộ qua. Đi xa thì theo
    lối đi trên mạng đường (đường ngắn nhất), không ai ra quá vòng tường; 4 lính gác cổng chính đứng phía trong cổng.
  - Vỉa hè hai bên đường (từ thời 3), vạch qua đường ở ngã giao và dọc vòng đường; người đi bộ đi trên vỉa hè, chỉ sang đường ở vạch
    (lối đi: `render/nav3d.js`); xe dừng nhường người (`render/build/traffic3d.js`) đang ở trên lòng đường phía trước và giữ khoảng cách với xe trước. Vài người đi dạo vòng quanh nhà chính.
- **Đường luôn thông** (mọi thời, mọi năm, cả sáu đảo): mạng đường của đảo tính ngay khi dựng đất (`render/build/roads.js`
  isleSegs), nên núi, cao nguyên, hồ, đầm, ốc đảo dời ra khỏi đường, đá, cỏ, cây nhỏ không mọc trên đường (`render/map/`).
  Sông được chảy qua đường (mặt đường cao hơn mặt nước, như cầu phẳng). Công trình dựng xong thì đo phần sát đất theo cỡ thật
  (`render/build/place3d.js` clearRoad): lấn đường thì đẩy ra khỏi đường, hoặc tìm chỗ trống gần nhất; nhà chính chỉ tiến lên phía
  sân, không có chỗ thì thu nhỏ vừa đủ (ít nhất 70%). Đường toả ra phía sau bắt đầu sau lưng nhà chính.
- **Đèn đường qua các thời** (`render/build/lamps.js`, thời 1 tới 9, cả sáu đảo): đứng bên lề vòng đường và các đường toả,
  so le hai bên; mỗi thời một kiểu (đuốc cắm, đuốc tre, đèn đá, đèn dầu, đèn khí, đèn điện, đèn cao áp, cột LED, đèn sinh
  học), mỗi đảo một màu ánh đèn. Tối bật, sáng tắt: phần sáng (lửa, bóng đèn, vũng sáng dưới chân) là mảnh `lit`, sáng dần
  khi trời tối, ban ngày chỉ còn cột và kính đèn. Công trình không đặt trên đường (kiểm tra 12 thời × 6 đảo).
- **Thành phố neon từ thời 10** (`render/build/neon.js`, `render/neon3d.js`): mặt trời đã mất (đĩa đen viền hồng thay trăng),
  trời chỉ còn tím (tím chiều tối ↔ tím tối, `mood3d.js` NEON), có rèm cực quang, không còn ngày đêm; không còn đèn đường,
  mép đường và vòm sáng trên đường phát neon, đường viền neon chạy dọc các cạnh của từng công trình, cửa sổ sáng suốt. Mỗi đảo treo một
  mặt trời nhân tạo rọi xuống thành phố (lõi, quầng, cột sáng, đèn điểm màu riêng): Hồn Lúa (vòng con quay), Hạt Giống (cánh lá
  khép mở), Lò Rèn (mảnh đá bay quanh), Băng Lăng Trụ (vầng hào quang, mặt trời giả), Sứa (xúc tu đung đưa), Hai Vành.
- **Nhẹ máy với sáu đảo** (hình không đổi):
  - hộp chỉ vát cạnh khi đủ to để thấy vát (`render/build/kit3d.js` box: vát r ≥ 0,15 và cạnh ≥ 0,8), còn lại là hộp thường
    12 tam giác thay cho 108; hộp cùng cỡ dùng chung một hình. Công trình mỗi đảo nhẹ đi khoảng 4–5 lần (thời 7: 158k → 35k tam giác);
  - công trình giống nhau (cùng hàm dựng, thông số, thời, đảo, màu) dựng một lần, các cái sau dùng chung hình (`render/buildings3d.js` BAKED);
  - dựng rải theo khung hình (mỗi khung 6 ms, 14 ms khi vừa sang thời), đảo gần máy quay trước: sang thời không còn khựng lâu;
  - mảnh dẹt sát đất (mặt đường, vạch, tà vẹt, vũng đèn) không đổ bóng, lượt vẽ bóng nhẹ đi;
  - gộp khối cả đảo xa (không đổ bóng) lẫn đảo gần (có bóng; phần sáng nhấp nháy vẫn vẽ riêng), gồm cả viền neon; công trình
    mới xong tạm vẽ riêng, đảo yên vài giây mới gộp lại. Khói và đèn chập chờn chỉ tính cho đảo ở gần. Xe của thời chạy vòng quanh làng: xe trâu, xe ngựa, tàu hơi nước, ô tô, tàu một
  ray, rô-bốt giao hàng và drone, hạt giống bay, xe bay, quả cầu sáng.
- **Công trình sống động**: khói bốc từ bếp lửa, lò gốm, lò rèn, ống khói nhà, nhà máy (`render/build/life3d.js`, một lượt
  vẽ cho cả đảo); cửa sổ sáng đèn về đêm (mảnh `lit` trong `kit3d.js`); cờ bay, chuông đung đưa (`sway`).
- Các thời 10 đến 12 làm đậm hơn: nhà lơ lửng có cánh hứng nắng và vườn hoa, nhà gấp có cửa cổng sáng và khối pha lê quay,
  nhà pha lê thành cụm ba khối màu rực có lõi sáng và mảnh bay trên mái.
- **Công trình ngoài làng** (`render/build/plains/outer.js`): bến và thuyền ở bờ biển, nhà trong rừng, tháp canh, đền
  giữa rừng, trại ngoài, hải đăng (từ cấp 3), công trình ngoài khơi (từ cấp 6). Mỗi loại đổi dáng theo thời: bãi đá và bè →
  bến gỗ → cảng đá có cần cẩu → cảng công-te-nơ → bến nổi phát sáng; xuồng độc mộc → thuyền buồm → tàu hơi nước → tàu máy →
  tàu lướt sóng → thuyền bay; lều thợ săn → nhà tiều phu → xưởng cưa → trạm kiểm lâm → nhà trên cây… Chỗ đặt tìm trên địa
  hình thật (tránh núi, hồ, sông). Người đi đường, thợ đi tu bổ có khi ra tới đó.
- Người vẽ theo nét đã chốt (`render/rig3d.js`), trang phục theo thời và theo nhóm (`render/outfits3d.js`: người đứng
  đầu, tướng, lính, dân thường nam, dân thường nữ; nữ luôn có tóc dài và ngực). Nét mặt đổi theo việc, mắt tự chớp.
  Người đi giữa các công trình thật của thời đang có (nhà chính, sân, ruộng, nhà ở, chỗ tuần tra). Không có tên trên đầu:
  bấm vào một người để mở thẻ (tính cách, dáng, cha mẹ, vợ chồng, con, việc đang làm).
- Thanh dưới có **◀ Thời trước / Thời sau ▶** để rà soát: tới thẳng một thời lúc công trình của thời đó đã dựng xong (90%
  thời). Đi tới thì logic chạy tới đó; lùi lại thì dựng lại logic Lúa Vàng từ đầu (cùng hạt giống) rồi chạy tới thời đó, nên
  dân, nhà, công trình và trang phục khớp đúng thời. Bảng làng cũ (nút Làng) đã bỏ khỏi thanh dưới; bấm vào một người vẫn mở thẻ.
- Trận mặc định là seed 7. Mở với `?seed=` và một số khác để thử trận khác (ví dụ `?seed=25`).
- Kết quả chạy thử 9 năm: dân lên khoảng 100 người vào năm 4 rồi giữ gần 100 tới hết trận (trừ khi chiến tranh, đói);
  hội đồng gần như luôn đủ ghế, luôn đủ 4 thợ xây và 2 thương nhân.

## Làng Lúa Vàng: 8 người cốt lõi đầu tiên

Bước 2 bắt đầu từ một đảo. Mở game là nhìn vào làng Lúa Vàng: tám người lập làng (4 nam, 4 nữ), mỗi người đứng đầu một
gia tộc (Thóc, Mạ, Rơm, Đòng, Cốm, Liềm, Cò, Bông, áo mỗi nhà một màu), ngồi một ghế trong hội đồng (vua hoặc nữ vương,
hai tướng, quân sư, tư tế, thương chủ, học giả, thợ cả; mỗi ghế cầm một món đồ riêng).

- **Gen:** 8 gen tính cách (tham vọng, hiếu chiến, đa nghi, sợ hãi, trí tuệ, nhu nhược, sùng đạo, mưu mô), 4 gen dáng
  (bước chân, dáng lưng, thế đứng, nhịp riêng), 1 thói quen khi đứng chờ (khoanh tay, chống nạnh, chắp tay sau lưng, gãi
  đầu, xoa tay, đung đưa người), đôi khi một gen hiếm (bạo chúa, thánh nhân, thiên tài, kẻ phản bội, người mang dấu thần).
- **Thế hệ mỗi 1,5 năm:** ghép đôi theo độ hợp tính cách cộng một phần ngẫu nhiên; cấm cha mẹ với con và anh chị em ruột,
  anh em họ được nhưng kém hợp; ai trong hội đồng hết người hợp lệ thì cưới một người dân thường (dòng máu mới). Mỗi cặp
  1 tới 3 con (đói thì ít hơn); làng tối đa 40 người có tên. Lập làng là tám người kết đôi và sinh lứa con đầu tiên ngay.
- **Lai tạo:** gen của con là trung bình cha mẹ cộng một chút lệch; 5% mỗi gen bị đột biến (lệch 0,15 tới 0,35, nhật ký
  và thẻ người đánh dấu ✦); gen dáng lai như tính cách nên con đi đứng "nửa giống cha nửa giống mẹ"; thói quen bốc thăm
  từ cha hoặc mẹ, 5% ra thói quen mới.
- **Tuổi:** một thế hệ ứng với khoảng 25 năm đời người; từ 62 tuổi có thể mất vì già, 72 tuổi rời hội đồng. Ghế trống thì
  người cùng gia tộc (ưu tiên con của người vừa rời ghế) giỏi nhất vào thay, giữ 4 nam 4 nữ khi được.
- **Bộ não và cử động:** mỗi người tự chọn một trong 5 trạng thái (đứng yên, đi, nói chuyện hay tranh cãi, đánh, hoảng sợ
  chạy) theo tình huống và gen. Lệnh chiến tranh: người máu chiến ra cầu đánh, người nhút nhát chạy về nhà, người sùng
  đạo cầu nguyện, người đa nghi đi cãi với vua. Hạn hán (mùa hạ, ngẫu nhiên): cầu mưa, đổ lỗi cho vua hay thương chủ, ra
  đồng. Cùng một trạng thái nhưng gen đổi nhịp, biên độ, ngả tới hay lùi, độ run và việc liếc nhìn quanh.
- **Bấm vào một người** để xem thẻ: gen, dáng, thói quen, cha mẹ, vợ chồng, con cái, việc đang làm (bấm ✕ để đóng).
  Bảng làng (hội đồng, nhật ký, nút thử tình huống) đã ẩn cho dễ nhìn; bật lại bằng `panel: true` khi tạo
  `BK.VillageUI` trong `index.html`. Các tình huống vẫn chạy thật theo mùa (hạn hán mùa hạ) và theo tính cách (cãi nhau).

## NPC mẫu và thư viện cử chỉ (65 cử chỉ)

(Đã ra khỏi bể kính khi bắt đầu bản chính; mô tả dưới đây là bản mẫu để áp cho mọi NPC sau này.) Trước đây trên đảo có **một NPC mẫu** (người lập làng ngồi ghế vua), đứng ở sân trống phía biển trong, trước dãy công
trình. NPC tự diễn lần lượt cả thư viện, mỗi cử chỉ lặp 5 giây (cử chỉ một lần thì diễn hết rồi nghỉ). Dòng chữ nhỏ phía
dưới cho biết đang diễn cử chỉ nào. Không có tên trên đầu; **bấm vào NPC** để mở thẻ nhỏ: tuổi, 8 gen tính cách, dáng,
thói quen, và danh sách cử chỉ theo nhóm để chọn diễn một cử chỉ (bấm "Tự diễn lần lượt" để chạy lại cả danh sách).

**Cỡ người:** người trưởng thành cao 1,4: đủ to để nhìn rõ, vẫn thấp hơn mái nhà thời đầu (khoảng 2,35). Cả NPC mẫu lẫn người trong
làng dùng chung một hằng số ở `render/rig3d.js` (`PERSON_HEIGHT`, `PERSON_SCALE`). Đổi cỡ là phóng to hay thu nhỏ đều cả
người, nên cử chỉ, tay chạm và khuôn mặt không phải sửa. Sân diễn nằm trước kho bạc; camera cho phép tới gần 2,5 để nhìn
rõ một người.

| Nhóm | Cử chỉ |
|---|---|
| Di chuyển | đứng thở, đi bộ, đi vội, chạy, chạy hoảng loạn, đi rón rén, đi khệnh khạng, đi khập khiễng, lùi lại |
| Đứng chờ | khoanh tay, chống nạnh, chắp tay sau lưng, gãi đầu, xoa tay, đung đưa người, nhìn quanh, gõ chân sốt ruột |
| Giao tiếp | nói chuyện, gật đầu, lắc đầu, vẫy tay chào, chỉ tay, tranh cãi, cười lớn, thì thầm, cúi chào |
| Cảm xúc | vui nhảy cẫng, giận dậm chân, sợ co rúm, buồn cúi đầu, khóc che mặt, giật mình, suy nghĩ chống cằm |
| Lao động | cuốc đất, gặt lúa, chặt cây, đập đá, vác hàng trên vai, trao đổi hàng, đóng búa xây nhà |
| Tôn giáo | cầu nguyện, quỳ lạy, giơ tay cầu mưa |
| Chính trị | diễn thuyết, ra lệnh, tuyên chiến, đầu hàng, quỳ thần phục, đăng quang |
| Chiến đấu | thủ thế, đâm giáo, chém bổ xuống, đỡ đòn, bị đánh trúng, ngã gục, mừng chiến thắng |
| Đời sống | ngồi, ăn, uống, ngủ, bế con, nhảy múa lễ hội |
| Sinh tử | già yếu chống gậy, ốm ôm bụng, qua đời |

**Tay chạm đúng chỗ trên cơ thể** (`render/ik3d.js`, IK hai khúc tay): các cử chỉ có tay chạm vào người chỉ ghi điểm bàn tay
phải tới theo một mốc (hông, ngực, đầu) và hướng khuỷu tay; vai và khuỷu tự tính để tâm bàn tay đặt đúng điểm đó. Dùng cho
chống nạnh, chống cằm, chắp tay cầu nguyện, quỳ lạy, khoanh tay, chắp tay sau lưng, gãi đầu, xoa tay, khóc che mặt, bế con,
ôm bụng (ốm, cười lớn), thì thầm, gõ chân, lắc đầu. Chuyển giữa cử chỉ có điểm chạm và cử chỉ thường vẫn trượt mềm.

**7 biểu cảm khuôn mặt cố định** (`render/face3d.js`): Bình thường, Vui (mắt cười, miệng cười, má hồng), Buồn (lông mày
nhướn đầu trong, miệng mếu), Giận (mắt nheo, chau mày, nghiến răng), Sợ hãi (mắt mở to, con ngươi nhỏ, miệng há nhỏ),
Ngạc nhiên (mắt tròn, lông mày nhướn cao, há to), Nghi ngờ (một mắt nheo, một bên lông mày nhướn, miệng lệch). Mắt tự
chớp, nhắm khi ngủ, cầu nguyện, quỳ lạy và qua đời. Mỗi cử chỉ tự gắn một biểu cảm (ví dụ cười lớn thì Vui, tranh cãi
thì Giận, đi rón rén thì Nghi ngờ); trong thẻ nhỏ có thể ghim một biểu cảm để xem riêng.

Mỗi cử chỉ là một công thức tư thế trong `render/gestures3d.js` (kèm nhóm, có lặp hay không, tốc độ đi, đồ cầm tay,
và gen thường gọi tới nó); đồ cầm tay (cuốc, liềm, rìu, búa, giáo, khiên, bao hàng, xu, bát, cốc, em bé, gậy) dựng ở
`render/rig3d.js`. Nhịp, biên độ, ngả tới lùi, độ run và liếc nhìn vẫn theo gen của người diễn, nên cùng một cử chỉ
người khác sẽ làm khác. Logic làng vẫn tạo đủ tám người nhưng tạm dừng (NPC mẫu không già đi); làng nhiều người
(`render/village3d.js`, `ui/village-ui.js`) để đó, bật lại khi áp thư viện cho mọi NPC.

## Nét vẽ NPC đã chốt (chưa đưa vào game)

Bản mẫu: `design/npc-tinh-chinh.html`; mẫu các thời đại khác (cổ đại, trung đại, hiện đại, vượt thời không) ở `design/npc-cac-thoi-dai.html`; công trình Làng lúa theo cùng nét vẽ ở `design/cong-trinh-lang-lua.html` (đang xem trước). Trang này mở riêng, game không tải nó; mẫu gồm nông dân nam, nông dân nữ, cụ già và vua.
- Giữ nguyên bộ khung và tỉ lệ ở `render/rig3d.js`, nên 65 cử chỉ, tay chạm và 7 biểu cảm không phải sửa.
- Thân là một khối áo liền, gấu áo che hông. Tay chân bo tròn, có khớp vai; bàn tay kiểu găng có ngón cái; chân đi dép.
- Đầu hơi bè ngang, có tai, mũi, má hồng. Mắt to hơn và hạ thấp: khuôn mặt cũ được đặt lên một nút phóng to (x 1,22, y 1,16,
  hạ 0,038), không sửa `render/face3d.js`.
- Tóc có khối; trang phục theo vai: nón lá, áo tứ thân với yếm, khăn đóng với râu bạc, mũ miện với áo bào.
- Tô hoạt hình ba tầng sáng tối, có viền sẫm mảnh. Người ở xa nên bỏ viền cho nhẹ.
- **Nữ ở mọi thời đại phải có tóc dài và ngực** (phần nhô ra ở ngực).
- **Công trình (đã chốt cách vẽ "Như đảo"):** giữ kiểu dáng ở `design/cong-trinh-lang-lua.html`. Tô mặt phẳng, góc vát một lớp,
  chân nhà sẫm dần lên mái, mỗi công trình gộp thành một khối. Cùng một cách vẽ cho cả 12 thời.

## Thứ tự làm tiếp

1. ~~Làm sạch: sáu đảo trống, giữ thời tiết và thiên nhiên.~~
2. Logic ngầm: ~~8 người cốt lõi của Lúa Vàng, gen, di truyền mỗi 1,5 năm, hội đồng, bộ não, cử động, kiểm thử 9 năm~~;
   còn lại: tài nguyên và đặc sản, dân tối đa 100 người, hội đồng bỏ phiếu chính sách, rồi nhân lên 6 đảo.
3. Hiển thị đảo: nhà chính ở giữa, bãi tài nguyên xung quanh, công trình theo cấp, nhân vật cốt lõi.
4. Chiến tranh qua cầu và thôn tính.
5. Nối quyền năng của thần, viện trợ, cấm vận và thì thầm vào logic mới.
6. Bảng gia phả, bảng hội đồng, nhật ký drama.
7. Thắng nhanh, thắng thường, New Game+; chế độ nhập vai tướng sau cùng.

## Chơi trên máy tính và điện thoại

**Cài lên máy tính bằng một lệnh.** Lệnh tải toàn bộ mã nguồn của repo về máy, tạo phần mềm "Bể Kính" có biểu
tượng, rồi mở game trong một cửa sổ riêng (không có thanh địa chỉ, như phần mềm). Chơi không cần mạng; chạy lại đúng lệnh
là cập nhật.

- Windows 10, 11 (PowerShell): cài vào `%LOCALAPPDATA%\BeKinh`, lối tắt trên Desktop và trong Start menu, mở bằng Edge
  (có sẵn trên Windows) hay Chrome.

  ```powershell
  irm https://raw.githubusercontent.com/npt275-ops/cloud-session/claude/eloquent-faraday-raquyc/install.ps1 | iex
  ```

- macOS, Linux (Terminal): cài vào `~/BeKinh`, phần mềm `Bể Kính.app` trong `~/Applications` (Launchpad, Spotlight) hay
  mục "Bể Kính" trong danh sách ứng dụng Linux, mở bằng Chrome, Edge, Brave (không có thì Safari hay trình duyệt mặc định).

  ```bash
  curl -fsSL https://raw.githubusercontent.com/npt275-ops/cloud-session/claude/eloquent-faraday-raquyc/install.sh | bash
  ```

Ngoài lệnh cài, còn hai bản dựng từ cùng mã nguồn bằng `python3 aquarium/tools/build-package.py` (chạy từ thư mục gốc của
repo, không cần thư viện ngoài):

- **Máy tính, không cần mạng:** `docs/BeKinh-ban-may-tinh.zip` (khoảng 0,8 MB). Giải nén, mở thư mục `BeKinh`, bấm đúp
  `Choi Be Kinh (Windows).bat` hay `Choi Be Kinh (Mac).command` (mở trong cửa sổ riêng như ứng dụng, bằng Edge hay
  Chrome), `choi-be-kinh-linux.sh`, hoặc mở thẳng `index.html`. Trong gói có sẵn three.js r128, OrbitControls và phông chữ,
  nên không tải gì từ mạng.
- **Điện thoại, cài như ứng dụng:** thư mục `docs/` là một ứng dụng web cài được (PWA): tệp cài ứng dụng, biểu tượng, và
  bộ nhớ đệm lưu cả game ở lần mở đầu tiên để những lần sau chơi được khi không có mạng. Bật GitHub Pages cho repo
  (Settings → Pages → Deploy from a branch → nhánh chứa `docs/`, thư mục `/docs`) là có địa chỉ
  `https://npt275-ops.github.io/cloud-session/`. Mở địa chỉ đó trên điện thoại rồi **Cài đặt ứng dụng / Thêm vào màn hình
  chính** (Android, Chrome) hay **Chia sẻ → Thêm vào MH chính** (iPhone, Safari).

Đã thử: mở gói đã giải nén từ ổ đĩa với mọi truy cập mạng bị chặn (không một yêu cầu nào ra ngoài, phông chữ và three.js
nạp từ gói); chạy bản web qua máy chủ cục bộ trên cấu hình điện thoại Android, đợi bộ nhớ đệm lưu toàn bộ tệp, ngắt mạng rồi
tải lại: game vẫn chạy.

## Khắc phục nhược điểm (bước 11a–11g)

Kế hoạch và số đo cuối: `design/ke-hoach-khac-phuc.md` (mục 10). Hai công cụ đo, chạy trong thư mục `aquarium/`:

- `node tools/calibrate.js 100`: chạy 100 trận chín năm bằng Node, so với mục tiêu trong `tools/targets.json`, in ĐẠT / KHÔNG
  ĐẠT (lần cuối: cả 16 chỉ số đạt).
- `node tools/check-scene.js`: mở trang thật bằng trình duyệt không giao diện (cần Playwright, Chromium), kiểm tra chỗ dùng chung
  không chồng ở 6 đảo × 12 thời và đo dân (đứng không, tụ tập quanh nhà chính, bước tại chỗ, kẹt).

Phần logic cho vòng chơi đã có, chưa có giao diện: `logic/powers.js` (quyền năng tốn niềm tin), `logic/goals.js` (mục tiêu
theo trận); lưu và tiếp tục trận: `logic/save.js`.

## Chạy khi phát triển

Mở `aquarium/index.html` bằng trình duyệt (three.js tải từ CDN), hoặc chạy một máy chủ tĩnh ở thư mục gốc của repo
(`python3 -m http.server`). Sau khi sửa, dựng lại `docs/` và gói zip bằng `python3 aquarium/tools/build-package.py`.

## Cấu trúc

| File | Vai trò |
|---|---|
| `index.html` | Chỉ còn khung trang (thanh trên, thanh dưới, nút bay), kiểu dáng, và danh sách tệp cần nạp theo thứ tự; dòng cuối gọi `BK.GameLoop.start()` |
| `game/` | **Ghép game**: `world.js` bộ nhớ chung G (hàm tiện dụng, sáu vùng đất, ngày trong trận, tốc độ, thời tiết); `nature.js` dựng bản đồ, cầu, biển, mây; `seasons.js` bốn mùa và độ đông; `isles.js` công trình năm đảo còn lại theo thời gian; `village.js` Lúa Vàng chạy theo thời gian thực (logic đảo, công trình, người, bảng làng, bấm chọn người); `loop.js` thứ tự khởi động và nhịp mỗi khung hình |
| `render/scene3d.js`, `sky3d.js`, `perf3d.js`, `tank3d.js`, `snow3d.js` | Bộ vẽ, camera, khói; bầu trời, sao, trăng, nắng, ngày đêm, bóng nắng không rung; bộ điều tốc 60 khung hình và vùng bóng; vòm kính, vòng đồng, đá trôi; tuyết rơi mùa đông |
| `ui/hud.js`, `landbar.js`, `camera-fly.js` | Nút tốc độ, âm thanh, dòng ngày; thanh sáu đảo; camera bay tới và bay tự do |
| `logic/` | **Logic ngầm**, không vẽ gì, chạy được bằng Node. `rules.js` mọi con số luật chơi (sửa nhịp trận ở đây); `rng.js` số ngẫu nhiên có hạt giống; `genes.js` định nghĩa gen và phép lai; `people.js` một người, tuổi, họ hàng; `family.js` ghép đôi, kết hôn, sinh con; `council.js` hội đồng 8 ghế (có thầy thuốc) và kế vị; `brain.js` bộ não tình huống và núm vặn cử động; `island.js` trạng thái và nhịp chạy của một đảo; `eras.js` mười hai thời kỳ và lịch lên cấp; `jobs.js` dàn vai theo tính cách (thợ xây, thương nhân, lính, người đi đường, nông dân); `schedule.js` buổi trong ngày; `tasks.js` việc theo vai và buổi; `construction.js` dựng công trình trong mỗi thời; `homes.js` nhà riêng của từng hộ; `economy.js` tài nguyên và lên cấp; `climate.js` thiên tai theo mùa; `epigen.js` ngoại gen; `strategy.js` người đứng đầu chọn nước đi; `leader.js` kịch bản hằng ngày của người đứng đầu; `guards.js` kịch bản lính gác cổng; `diplomacy.js` quan hệ, đoàn buôn, hiệp ước, cầu; `war.js` chiến tranh, sáp nhập, nổi dậy; `world.js` cả bể: sáu đảo, một đồng hồ |
| `render/` | **Vẽ người**: `outfits3d.js` trang phục 5 nhóm × 12 thời; `rig3d.js` khung khớp và bộ phận theo nét đã chốt; `anim3d.js` 5 trạng thái cử động, cầu nguyện, 6 thói quen; `village3d.js` người trong làng đi lại theo bộ não, nét mặt, bấm chọn; `gestures3d.js` thư viện 65 cử chỉ; `face3d.js` 7 biểu cảm khuôn mặt; `ik3d.js` tay chạm đúng chỗ trên cơ thể; `work3d.js` cử chỉ và đồ cầm tay cho từng việc theo thời; `model3d.js` NPC mẫu diễn thư viện. **Giữa các đảo**: `travel3d.js` đoàn buôn (thuyền, xe hàng qua cầu); `war3d.js` quân đi đánh, vây cổng, cờ đảo cai quản. **Công trình**: `buildings3d.js` đặt công trình của một đảo theo cấp (`show(đảo, cấp)`) và dựng dần theo tiến độ (`setProgress`) |
| `render/build/` | `bridges3d.js` cầu nối hai đảo, hiện ra khi logic bắc cầu (`logic/diplomacy.js`), dáng theo thời; `workyards3d.js` bãi làm việc (kho, ruộng, bãi gỗ, mỏ, xưởng, bãi tập, năng lượng); `kit3d.js` bộ dựng hình chung theo cách vẽ của đảo (hộp vát, mái, gộp một khối, chân sẫm, phần chuyển động); `plains/` công trình Lúa Vàng: `common.js` bảng màu, chỗ đặt nhà, 20 nhà riêng của dân, món dùng chung; `e01.js` … `e12.js` mỗi thời một tệp (kiểu công trình, bố cục, tên); `outer.js` công trình ngoài làng (bờ biển, ngoài khơi, trong rừng) đổi dáng theo thời; `wonders.js` mười hai kỳ quan; `town.js` đường, tường, đường ray và xe của làng theo thời. `life3d.js` (cạnh `kit3d.js`) khói của cả đảo; `roads.js` mạng đường từng đảo; `vehicles.js` xe; `gates.js` cổng thành; `place3d.js` tìm chỗ đặt trên địa hình thật; `batch3d.js` khối gộp cho đảo ở xa. `isles/` kiến trúc năm đảo còn lại; `civic.js` công trình công cộng của sáu đảo. Đảo khác thêm thư mục riêng cùng kiểu |
| `design/` | Bản mẫu xem trước đã chốt: nét vẽ NPC, NPC các thời đại, công trình Làng lúa (game không nạp) |
| `ui/` | **Bảng trên màn hình**: `village-ui.js` thẻ người (bảng làng cũ không còn nút mở); `model-ui.js` thẻ của NPC mẫu (chưa nạp) |
| `test/` | `island.test.js` 7 bài kiểm thử logic ngầm, `eras.test.js` 2 bài về mười hai thời kỳ (`node --test test/island.test.js test/eras.test.js` trong thư mục `aquarium`): tám người đầu tiên, chín năm đủ 6 thế hệ, không cưới người cấm, lai tạo và đột biến, cùng hạt giống ra cùng trận, bộ não theo gen, hạn hán |
| `render/map/` | **Bản đồ** (chỉ thiên nhiên), mỗi phần một tệp: `shared3d.js` hình gốc, bộ gom mảnh, màu đất đá sáu miền; `mountains3d.js` năm dáng núi và khối núi nhiều mặt riêng từng đảo (`MASSIF`); `terrain3d.js` mép đảo, phần đất đá dưới đảo, hồ và sông sẵn có; `water3d.js` gộp mặt nước và bờ; `relief3d.js` sông, hồ, ao thêm (`WATERS`), đá và nét riêng từng miền; `trees3d.js` cây (`FLORA`); `map3d.js` ghép lại cho từng đảo (tên `Lands3D`). Chi tiết: | Chỉ thiên nhiên: dáng đất sáu miền, hồ, sông; khối núi nhiều mặt riêng từng đảo (`MASSIF`: Lúa Vàng dãy núi hồng tím đỉnh tuyết, Thông Xanh núi đôi phủ rừng, Tuyết Trắng núi băng lởm chởm, Cửa Sóng mũi đá đầu bằng, Cát Hồng núi bậc thang đá đỏ; Đá Mây giữ dãy 7 ngọn năm dáng); sông vào hồ, ao (`WATERS`); cụm đá và nét riêng từng miền; không còn đồi tròn. Cây (`FLORA`): tán tròn ít mặt mọc thành lùm, giữ lại thông, thông tuyết, dừa, xương rồng; cây không đổ bóng thật mà có vệt bóng dưới gốc. Nhẹ máy: mặt nước và bờ của mỗi đảo gộp thành một khối; ở xa một đảo thì ẩn bụi cây, vệt bóng và chi tiết nhỏ. Cầu: `render/build/bridges3d.js`, do logic bắc |
| `sea3d.js` | Biển: mặt nước phủ kín đáy bể, sóng, chậu kính trong suốt chứa nước |
| `clouds3d.js` | Mây trong bể kính: đợt mây theo gió, mây dính thành cụm, mây đen, sấm sét, mưa theo mùa |
| `audio.js` | Âm thanh tự sinh bằng Web Audio |
| `tools/build-package.py` | Đóng gói: bản web cài được cho điện thoại (`docs/`) và gói chơi không cần mạng cho máy tính |
| `vendor/`, `icons/` | three.js r128, OrbitControls, phông chữ Fraunces và Outfit; biểu tượng ứng dụng |
| `archive/` | Các bản đề xuất giao diện trước khi chốt 3D |

Mỗi tệp mở đầu bằng một đoạn ghi nó làm gì và cần tệp nào; logic không biết gì về 3D, phần vẽ chỉ đọc trạng thái logic.

Mã của bản cũ (trang game cũ, nền kinh tế, NPC, chiến tranh, kịch bản hỗn loạn, quyền năng, 53 bài kiểm thử) đã xoá khỏi
kho để gói tải về gọn nhẹ; lấy lại được từ lịch sử git ở commit `705162f` (`git show 705162f:aquarium/archive/v1/sim.js`).
`lands3d.js` vẫn còn phần dựng người, đường sá và nhà theo nền kinh tế cũ, không còn được gọi; sẽ thay khi làm logic mới.
