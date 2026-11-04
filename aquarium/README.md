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

Lên cấp thì làng cũ lún xuống, làng mới mọc lên từ nhà chính ra ngoài. Công trình vẽ theo cách của đảo (mặt phẳng, góc
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
  người già đi và có thể mất; cứ 1,5 năm một mốc thế hệ: ai đủ tuổi thì kết đôi (lẻ bóng thì cưới người dân thường), mỗi
  cặp sinh 2 tới 4 con (làng gần đầy thì 2 tới 3). Tối đa 200 người một đảo. Hạn hán mùa hạ, tang, cãi nhau tự xảy ra.
- Việc của dân (`logic/jobs.js`): 30% người lớn ngoài hội đồng làm lính (người máu chiến nhất), còn lại là nông dân;
  người già, trẻ em. Lính đi tuần, nông dân ra ruộng, người già ngồi ở nhà hoặc sân làng.
- Người vẽ theo nét đã chốt (`render/rig3d.js`), trang phục theo thời và theo nhóm (`render/outfits3d.js`: người đứng
  đầu, tướng, lính, dân thường nam, dân thường nữ; nữ luôn có tóc dài và ngực). Nét mặt đổi theo việc, mắt tự chớp.
  Người đi giữa các công trình thật của thời đang có (nhà chính, sân, ruộng, nhà ở, chỗ tuần tra). Không có tên trên đầu:
  bấm vào một người để mở thẻ (tính cách, dáng, cha mẹ, vợ chồng, con, việc đang làm).
- Nút **Làng** trên thanh dưới mở bảng theo dõi: cấp và năm, số người, đã sinh, đã mất, số lính, nông dân, người già,
  hội đồng, nhật ký, và các nút thử tình huống (hạn hán, lệnh chiến tranh, cãi nhau, lễ hội, yên ổn, sang thế hệ mới).
- Mở với `?seed=7` để thử một làng khác.
- Kết quả chạy thử 9 năm (4 hạt giống): dân lên khoảng 200 người vào năm 5 đến 6 rồi giữ quanh 180 đến 200; khoảng
  250 đến 300 lượt sinh, 60 đến 125 lượt mất; hội đồng gần như luôn đủ ghế. Cả làng 200 người: khoảng 26 lượt vẽ.

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
   còn lại: tài nguyên và đặc sản, dân tối đa 200 người, hội đồng bỏ phiếu chính sách, rồi nhân lên 6 đảo (48 người).
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

## Chạy khi phát triển

Mở `aquarium/index.html` bằng trình duyệt (three.js tải từ CDN), hoặc chạy một máy chủ tĩnh ở thư mục gốc của repo
(`python3 -m http.server`). Sau khi sửa, dựng lại `docs/` và gói zip bằng `python3 aquarium/tools/build-package.py`.

## Cấu trúc

| File | Vai trò |
|---|---|
| `index.html` | Ghép các phần: bể kính, bầu trời, ngày đêm, mùa, tuyết, camera và bay, tốc độ, thanh sáu đảo, công trình |
| `logic/` | **Logic ngầm**, không vẽ gì, chạy được bằng Node. `rules.js` mọi con số luật chơi (sửa nhịp trận ở đây); `rng.js` số ngẫu nhiên có hạt giống; `genes.js` định nghĩa gen và phép lai; `people.js` một người, tuổi, họ hàng; `family.js` ghép đôi, kết hôn, sinh con; `council.js` hội đồng 8 ghế và kế vị; `brain.js` bộ não tình huống và núm vặn cử động; `island.js` trạng thái và nhịp chạy của một đảo; `eras.js` mười hai thời kỳ và lịch lên cấp; `jobs.js` lính, nông dân, người già |
| `render/` | **Vẽ người**: `outfits3d.js` trang phục 5 nhóm × 12 thời; `rig3d.js` khung khớp và bộ phận theo nét đã chốt; `anim3d.js` 5 trạng thái cử động, cầu nguyện, 6 thói quen; `village3d.js` người trong làng đi lại theo bộ não, nét mặt, bấm chọn; `gestures3d.js` thư viện 65 cử chỉ; `face3d.js` 7 biểu cảm khuôn mặt; `ik3d.js` tay chạm đúng chỗ trên cơ thể; `model3d.js` NPC mẫu diễn thư viện. **Công trình**: `buildings3d.js` đặt công trình của một đảo theo cấp (`show(đảo, cấp)`) |
| `render/build/` | `kit3d.js` bộ dựng hình chung theo cách vẽ của đảo (hộp vát, mái, gộp một khối, chân sẫm, phần chuyển động); `plains/` công trình Lúa Vàng: `common.js` bảng màu, chỗ đặt nhà, món dùng chung; `e01.js` … `e12.js` mỗi thời một tệp (kiểu công trình, bố cục, tên). Đảo khác thêm thư mục riêng cùng kiểu |
| `design/` | Bản mẫu xem trước đã chốt: nét vẽ NPC, NPC các thời đại, công trình Làng lúa (game không nạp) |
| `ui/` | **Bảng trên màn hình**: `village-ui.js` thẻ người và bảng làng (nút Làng); `model-ui.js` thẻ của NPC mẫu (chưa nạp) |
| `test/` | `island.test.js` 7 bài kiểm thử logic ngầm, `eras.test.js` 2 bài về mười hai thời kỳ (`node --test test/island.test.js test/eras.test.js` trong thư mục `aquarium`): tám người đầu tiên, chín năm đủ 6 thế hệ, không cưới người cấm, lai tạo và đột biến, cùng hạt giống ra cùng trận, bộ não theo gen, hạn hán |
| `lands3d.js` | Chỉ thiên nhiên: dáng đất sáu miền, hồ, sông; khối núi nhiều mặt riêng từng đảo (`MASSIF`: Lúa Vàng dãy núi hồng tím đỉnh tuyết, Thông Xanh núi đôi phủ rừng, Tuyết Trắng núi băng lởm chởm, Cửa Sóng mũi đá đầu bằng, Cát Hồng núi bậc thang đá đỏ; Đá Mây giữ dãy 7 ngọn năm dáng); sông vào hồ, ao (`WATERS`); cụm đá và nét riêng từng miền; không còn đồi tròn. Cây (`FLORA`): tán tròn ít mặt mọc thành lùm, giữ lại thông, thông tuyết, dừa, xương rồng; cây không đổ bóng thật mà có vệt bóng dưới gốc. Nhẹ máy: mặt nước và bờ của mỗi đảo gộp thành một khối; ở xa một đảo thì ẩn bụi cây, vệt bóng và chi tiết nhỏ. Sáu cây cầu thô |
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
