# Bước 39 · Khối công trình quan trọng (bản dev)

Người chơi chốt: game là một vị thần/phù thủy xây từng công trình quan trọng rồi bảo vệ chúng tới nền văn minh cuối,
chừng 20 phút. Mỗi công trình quan trọng là **một khối riêng**:

- bấm vào thì máy quay bay tới và hiện bảng nâng cấp (giá tiền để sau);
- có máu (thang 10) và công dụng; cùng loại thì cùng máu, cùng công dụng, chỉ khác hình (theo bậc, theo đảo) để nhân bản.

## Bảy loại (render/blocks/blocks.js `KINDS`)

| Loại | Máu | Chân đế | Công dụng |
| --- | --- | --- | --- |
| Nhà chính | 10 | 8×8 | Mất là thua; cấp nhà chính mở khoá cấp công trình khác |
| Nhà dân | 5 | 4×4 | Dân ở; mất nhà mất dân |
| Nhà lính | 7 | 15×12 | Sinh lính đánh gần, đánh xa |
| Xưởng xe | 7 | 10×9 | Xe phá cổng, máy bắn đá, về sau xe tăng |
| Cổng thành | 8 | 14×5 | Lối vào duy nhất; hai chòi gác chỉ báo tin |
| Tường bao | 10 | 4×1,4 | Bao kín; mỗi đoạn một khối, nối khít |
| Kho lương | 6 | 6×6 | Nuôi dân và lính; nguồn tiền nâng cấp |

## Bốn bậc (`TIERS`)

Gỗ tre (thời 1–3) · Đá (4–6) · Gạch thép (7–9) · Tương lai (10–12). Tường và cổng cùng độ cao theo bậc (`WALL_H`).

## Hình theo bậc (người chơi chốt lần 2: rõ từng thời, chi tiết hơn)

| Loại | Gỗ tre | Đá | Gạch thép | Tương lai (neon) |
| --- | --- | --- | --- | --- |
| Nhà chính | Đình làng nhà sàn, mái rơm cong hai đầu, hiên cột, trống, cột tô-tem | Cung đá hai tầng nền, mái ngói hai tầng cong góc, hàng cột đỏ, đèn đá | Dinh thự hai tầng, hiên cột trắng có trán tường, hai cánh, tháp đồng hồ vòm đồng | Tháp neon thon, ba đĩa sàn có vành sáng, ăng-ten |
| Nhà dân | Nhà sàn một tầng, thang, rơm, chum | Hai tầng: đá dưới, khung gỗ trên, hộp hoa, ghế | Ba tầng gạch, ban công sắt, bồn nước trên mái | Ba tầng lệch nhau, dải kính sáng, vườn mái |
| Nhà lính (11×9) | Nhà dài, lán vũ khí, chòi canh góc, rào cọc, lửa trại, trống | Doanh trại đá, kho vũ khí, tháp canh, tường sân có vòm cổng, giếng, cờ treo | Hai tầng mái tôn, nhà ăn, đội hình 2×4, bãi chướng ngại, xe tải, bao cát | Nhà chứa mái vòm, tháp điều khiển, bãi đáp có xe bay, rào năng lượng |
| Cổng thành (14×5) | Chòi gỗ hai tầng sàn, lầu cổng mái rơm, cổng cọc đôi, chông chắn | Trụ đá gờ đỡ, cờ treo, lầu cổng, lối đi có lính, song chắn, chậu lửa | Trụ gạch chòi canh, lầu cổng có mái, chốt gác, thanh chắn, bao cát, cột đèn | Trụ neon có súng tháp, vòng biểu tượng sáng, màn năng lượng, cọc sáng |

Chung nhà lính: sân chia ba khu (đánh gần, tập hợp, bắn xa), giá vũ khí, hòm, thùng, lính tập. Chung cổng: tường đầu khối nối tường bao,
lối đi trên tường có lính, lính gác đứng đất trước cổng.

Bậc tương lai: bảng màu sẫm, mọi cạnh có viền neon (blocks.js `neonEdges`). Mảnh chung (lính gác, cửa sổ, lan can, vành tròn):
`render/blocks/parts.js`.

## Sáu đảo (người chơi chốt: 6 đảo × 4 bậc, không đảo nào giống đảo nào; chưa đưa vào bể kính)

Cùng loại thì cùng máu, cùng công dụng, cùng bố cục; khác nhau ở kiểu mái, kiểu tường, bệ, màu, áo lính, đồ trang trí, công
trình biểu tượng cạnh nhà chính và dáng tháp bậc 4. Mỗi đảo một tệp `render/blocks/isles/<đảo>.js`; kiểu dáng chung ở
`render/blocks/style.js` (mái, tường, bệ), `render/blocks/spire.js` (tháp bậc 4), đồ trang trí `render/blocks/isles/props.js`.

| Đảo | Mái (bậc 1→4) | Tường (bậc 1→3) | Bệ | Tháp bậc 4 | Biểu tượng | Lính |
| --- | --- | --- | --- | --- | --- | --- |
| Lúa Vàng | hình gốc | hình gốc | đá | thân thon ba đĩa | (không) | nón lá, mũ sắt |
| Thông Xanh | lá dốc, hai dốc, nhọn, vòm lá | gỗ cây, ván dọc, khung gỗ | sàn gỗ viền rêu | cây ba tán | cây cổ thụ | mũ cắm lông |
| Đá Mây | đá bằng, ngói cong, hai tầng cong, bậc thang | đá xếp lớp | đá tảng | khối đá chồng xoay | tháp đá | mũ lông, mũ sắt |
| Tuyết Trắng | vòm băng, dốc đứng phủ tuyết ×2, vòm kính | khối tuyết, gỗ cây, ván sơn đỏ | tuyết | pha lê | cột tô-tem, cột cực quang | mũ lông trùm |
| Cửa Sóng | lá dừa, ngói bốn dốc, bằng, buồm | ván, trát trắng viền xanh | cát, lối ván | cánh buồm | giàn lưới, hải đăng | khăn buộc trán |
| Cát Hồng | lều vải, vòm đất, bằng, củ hành | đất bo tròn, đầu xà | gạch nung | kim tự tháp bậc | giếng, cột đá, tháp gọi, kim tự tháp sáng | khăn quấn |

Trang mẫu: hàng nút chọn đảo (`?dao=forest` chọn sẵn).

## Lần 3 (người chơi chốt): nhà lính rộng hơn, cửa thật hơn, thêm bậc 5

- Nhà lính 15 × 12: hai dãy nhà rộng thêm, sân tập dãn ra (đồ trong sân đặt theo lưới gốc rồi dãn bằng X, Z), thêm hình nộm,
  bia, giá vũ khí, lính tập; đội hình bậc 3 thành 3 × 5.
- Cửa chính, cửa sổ, lan can, hiên (render/blocks/parts.js): cửa có ô lõm, khung, lanh tô, cánh theo bậc (ván, ô nổi, ô kính
  trên), tay nắm, bậc thềm; cửa sổ có ô lõm, kính, khung, song chữ thập, bậu, lanh tô, cánh chớp; lan can có trụ đầu, tay vịn
  tròn, song tiện; hiên có sàn, cột, xà chéo, mái hiên, bậc lên (nhà dân bậc 2).
- Bậc 5 Huyền ảo (render/blocks/mythic.js): công trình trên tảng đá bay, vòng chữ cổ, trụ sáng, bậc đá bay, pha lê bay quanh,
  biểu tượng đỉnh theo đảo (sen vàng, cây linh hồn, núi bay có thác sáng, cụm pha lê, cầu nước, mặt trời vàng). Phần lơ lửng
  nhấp nhô, phần bay quay (BK.Blocks.animate). Bảng màu bậc 5 riêng từng đảo.

## Lần 4: xưởng xe lớn hơn (10 × 9)

Xưởng chính cửa rất rộng (gỗ: hai cánh mở xoè; gạch thép: cửa cuốn kéo nửa; tương lai: lòng cửa sáng), nhà phụ bên trái
(lán đồ nghề, lò rèn có lửa, kho, phòng máy), sân trước có cỗ máy của thời đó: xe phá cổng có mái che, máy bắn đá có đối
trọng, xe tăng, xe tăng bay; cần trục chữ A, giàn cẩu, tay máy; đống gỗ, đạn đá, thùng dầu, bàn thợ, thợ đứng.

## Lần 5: cờ của đảo (người chơi chốt: màu cờ không đổi theo thời, có ký hiệu riêng)

| Đảo | Màu cờ | Ký hiệu |
| --- | --- | --- |
| Lúa Vàng | vàng | một bông lúa trĩu hạt (thân, bông rủ, hạt xương cá, lá) |
| Thông Xanh | xanh lá | cây thông kem |
| Đá Mây | xám | một ngọn núi đá đỉnh tuyết quấn đai mây |
| Tuyết Trắng | trắng | bông tuyết xanh |
| Cửa Sóng | xanh nước biển | một con sóng cuộn móc vào trong, bọt bắn |
| Cát Hồng | hồng | đồng hồ cát (cát hồng nhạt chảy) |

Người chơi duyệt cây thông và bông tuyết; bốn đảo còn lại làm lại theo kiểu một biểu tượng duy nhất như hai mẫu đó.
Mỗi đảo khai báo `flag: { color, mark, emblem(m) }` trong tệp đảo; mọi lá cờ (H.flag) và cờ treo tường (H.banner) ở cả 5 bậc
dùng màu và ký hiệu đó (render/blocks/parts.js emblem: nét tam giác, tròn, nửa tròn, thẳng, cung).

## Lần 6: nhà cảng, nhân vật thử trên Lúa Vàng

**Nhà cảng** (render/blocks/shapes/port.js, máu 7/10, 10 × 9, `coast: true`: chỉ xây ở mép biển, mặt trước +z quay ra biển).
Nửa sau trên bờ: nhà kho mái theo đảo, cần cẩu ở mép bờ, hàng hoá; nửa trước: cầu tàu trên cọc, cọc buộc, tàu đậu cạnh cầu.
Tàu theo bậc: thuyền nan mui cong, thuyền buồm (buồm màu cờ đảo), tàu hơi nước (ống khói sọc màu cờ), tàu lướt đáy sáng,
thuyền mây bay lơ lửng; bậc 5 có hải đăng pha lê mang biểu tượng đảo.

**Nhân vật** (render/units/: units.js sổ nhân vật, body.js thân người và đồ cầm tay, siege.js cỗ máy chiến tranh dùng chung với
xưởng xe, isles/plains.js trang phục Lúa Vàng). Mỗi nhân vật là một khối trên đế tròn viền màu cờ đảo, bấm và nâng cấp như
công trình. Máu đề xuất (thang 10): dân nam 5, dân nữ 5, lính đánh gần 7, lính đánh xa 5, xe tấn công 8.

| Bậc | Dân nam | Dân nữ | Lính đánh gần | Lính đánh xa | Xe tấn công |
| --- | --- | --- | --- | --- | --- |
| Gỗ tre | nón lá, vác cuốc | nón lá, gánh thóc | khăn buộc trán, giáo, khiên mây | nón lá, nỏ, ống tên | xe phá cổng |
| Đá | khăn đóng, áo dài | nón quai thao, xách giỏ | mũ sắt, giáp lá, kiếm, khiên, áo choàng | mũ sắt, cung dài | máy bắn đá |
| Gạch thép | mũ lưỡi trai, hộp đồ nghề | váy, túi xách | mũ lính, dùi cui, khiên chống bạo động | súng trường | xe tăng |
| Tương lai | áo liền vạch sáng, bảng sáng | tóc búi, bảng sáng | giáp sẫm, mũ kính sáng, kiếm sáng | súng sáng | xe tăng bay |
| Huyền ảo | áo dài trắng, vầng sáng, đèn | áo dài trắng, vầng sáng | giáp vàng, đại kiếm sáng, cánh sáng | gậy phép cầu sáng | cỗ máy đá bay |

Màu cờ đảo đi theo dải chéo, áo choàng, khiên (có ký hiệu đảo), tua giáo, cờ và nắp xe. Trang mẫu: nút "Nhân vật"
(`?xem=nhanvat`), tạm chỉ Lúa Vàng; duyệt rồi mới làm trang phục 5 đảo còn lại (render/units/isles/<đảo>.js).

## Cách thêm

- Loại mới: một mục trong `KINDS` + một tệp `render/blocks/shapes/<id>.js` gọi `BK.Blocks.shape(id, (k, P, t, H) => …)`.
- Đảo mới: một tệp `render/blocks/isles/<đảo>.js` gọi `BK.Blocks.isle(key, { name, tiers, S, deco })`.

## Trang mẫu

`khoi-cong-trinh.html`: 7 loại × 4 bậc của Lúa Vàng trên bãi cỏ. Bấm khối → máy quay bay tới, bảng hiện tên, bậc,
máu, công dụng, nút **Nâng cấp** (thay khối tại chỗ bằng bậc kế). Chưa đặt vào trận thật.

## Còn chờ người chơi chốt

Giá nâng cấp; máu thật trong trận; kịch bản trận (cổng → nhà dân → nhà chính); nhịp 20 phút; Thợ Săn Phù Thủy.
