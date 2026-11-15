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
| Nhà lính | 7 | 6×6 | Sinh lính đánh gần, đánh xa |
| Xưởng xe | 7 | 6×6 | Xe phá cổng, máy bắn đá, về sau xe tăng |
| Cổng thành | 8 | 10×4 | Lối vào duy nhất; hai chòi gác chỉ báo tin |
| Tường bao | 10 | 4×1,4 | Bao kín; mỗi đoạn một khối, nối khít |
| Kho lương | 6 | 6×6 | Nuôi dân và lính; nguồn tiền nâng cấp |

## Bốn bậc (`TIERS`)

Gỗ tre (thời 1–3) · Đá (4–6) · Gạch thép (7–9) · Tương lai (10–12). Tường và cổng cùng độ cao theo bậc (`WALL_H`).

## Cách thêm

- Loại mới: một mục trong `KINDS` + một tệp `render/blocks/shapes/<id>.js` gọi `BK.Blocks.shape(id, (k, P, t, H) => …)`.
- Đảo mới: một mục trong `SKINS` (bốn bảng màu), hình dáng không đổi.

## Trang mẫu

`khoi-cong-trinh.html`: 7 loại × 4 bậc của Lúa Vàng trên bãi cỏ. Bấm khối → máy quay bay tới, bảng hiện tên, bậc,
máu, công dụng, nút **Nâng cấp** (thay khối tại chỗ bằng bậc kế). Chưa đặt vào trận thật.

## Còn chờ người chơi chốt

Giá nâng cấp; máu thật trong trận; kịch bản trận (cổng → nhà dân → nhà chính); nhịp 20 phút; Thợ Săn Phù Thủy.
