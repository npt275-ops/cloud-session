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
| Nhà lính | 7 | 11×9 | Sinh lính đánh gần, đánh xa |
| Xưởng xe | 7 | 6×6 | Xe phá cổng, máy bắn đá, về sau xe tăng |
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

## Cách thêm

- Loại mới: một mục trong `KINDS` + một tệp `render/blocks/shapes/<id>.js` gọi `BK.Blocks.shape(id, (k, P, t, H) => …)`.
- Đảo mới: một tệp `render/blocks/isles/<đảo>.js` gọi `BK.Blocks.isle(key, { name, tiers, S, deco })`.

## Trang mẫu

`khoi-cong-trinh.html`: 7 loại × 4 bậc của Lúa Vàng trên bãi cỏ. Bấm khối → máy quay bay tới, bảng hiện tên, bậc,
máu, công dụng, nút **Nâng cấp** (thay khối tại chỗ bằng bậc kế). Chưa đặt vào trận thật.

## Còn chờ người chơi chốt

Giá nâng cấp; máu thật trong trận; kịch bản trận (cổng → nhà dân → nhà chính); nhịp 20 phút; Thợ Săn Phù Thủy.
