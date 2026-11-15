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
| Nhà lính | 7 | 8×7 | Sinh lính đánh gần, đánh xa |
| Xưởng xe | 7 | 6×6 | Xe phá cổng, máy bắn đá, về sau xe tăng |
| Cổng thành | 8 | 10×4 | Lối vào duy nhất; hai chòi gác chỉ báo tin |
| Tường bao | 10 | 4×1,4 | Bao kín; mỗi đoạn một khối, nối khít |
| Kho lương | 6 | 6×6 | Nuôi dân và lính; nguồn tiền nâng cấp |

## Bốn bậc (`TIERS`)

Gỗ tre (thời 1–3) · Đá (4–6) · Gạch thép (7–9) · Tương lai (10–12). Tường và cổng cùng độ cao theo bậc (`WALL_H`).

## Hình theo bậc (người chơi chốt lần 2: rõ từng thời, chi tiết hơn)

| Loại | Gỗ tre | Đá | Gạch thép | Tương lai (neon) |
| --- | --- | --- | --- | --- |
| Nhà chính | Đình làng nhà sàn, mái rơm cong hai đầu, hiên cột, trống, cột tô-tem | Cung đá hai tầng nền, mái ngói hai tầng cong góc, hàng cột đỏ, đèn đá | Dinh thự hai tầng, hiên cột trắng có trán tường, hai cánh, tháp đồng hồ vòm đồng | Tháp neon thon, ba đĩa sàn có vành sáng, ăng-ten |
| Nhà dân | Nhà sàn một tầng, thang, rơm, chum | Hai tầng: đá dưới, khung gỗ trên, hộp hoa, ghế | Ba tầng gạch, ban công sắt, bồn nước trên mái | Ba tầng lệch nhau, dải kính sáng, vườn mái |
| Nhà lính | Nhà dài, sân rào cọc, hình nộm rơm, lửa trại | Doanh trại đá, tường thấp quanh sân, chòi canh có lính | Hai tầng mái tôn, sân duyệt binh kẻ vạch, vượt rào, lính xếp hàng | Nhà chứa mái vòm, bãi đáp, bia ảnh nổi |
| Cổng thành | Hai chòi gỗ có sàn, mỗi chòi hai lính cầm giáo | Trụ đá răng tường, lính trên đỉnh, cổng đinh sắt, đuốc | Trụ gạch có chòi canh mái nhọn, lính súng, đèn pha, cổng song sắt | Trụ neon, sàn tròn có lính sáng, màn chắn năng lượng |

Bậc tương lai: bảng màu sẫm, mọi cạnh có viền neon (blocks.js `neonEdges`). Mảnh chung (lính gác, cửa sổ, lan can, vành tròn):
`render/blocks/parts.js`.

## Cách thêm

- Loại mới: một mục trong `KINDS` + một tệp `render/blocks/shapes/<id>.js` gọi `BK.Blocks.shape(id, (k, P, t, H) => …)`.
- Đảo mới: một mục trong `SKINS` (bốn bảng màu), hình dáng không đổi.

## Trang mẫu

`khoi-cong-trinh.html`: 7 loại × 4 bậc của Lúa Vàng trên bãi cỏ. Bấm khối → máy quay bay tới, bảng hiện tên, bậc,
máu, công dụng, nút **Nâng cấp** (thay khối tại chỗ bằng bậc kế). Chưa đặt vào trận thật.

## Còn chờ người chơi chốt

Giá nâng cấp; máu thật trong trận; kịch bản trận (cổng → nhà dân → nhà chính); nhịp 20 phút; Thợ Săn Phù Thủy.
