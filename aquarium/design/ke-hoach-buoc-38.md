# Bước 38: Nước quang học trong bể kính (sáu quy tắc)

Người chơi đưa ra sáu quy tắc cho độ chân thực của nước. Đây là cách làm từng quy tắc, đặt ở đâu.

## Sáu quy tắc và chỗ làm

| Quy tắc | Làm thế nào | Tệp |
|---|---|---|
| 1. Nước là lớp quang học, màu không gán | Màu = ảnh phản chiếu × Fresnel + (ảnh đáy × độ truyền + ánh sáng tán xạ × (1 − độ truyền)) × (1 − Fresnel). Không còn màu theo đỉnh | render/water/surface3d.js |
| 2. Một trường độ dốc | Sóng lớn (đạo hàm đúng công thức sóng của sea3d.js), 7 sóng nhỏ chi tiết, gợn mô phỏng cộng vào một vector s; pháp tuyến, phản chiếu lệch, khúc xạ lệch, Fresnel, ánh nắng đều đọc s | render/water/surface3d.js |
| 3. Ba lượt vẽ cắt bởi mặt nước | Trước lượt chính: vẽ phần dưới mặt nước (kèm ảnh độ sâu), vẽ phần trên mặt nước từ máy quay soi gương; mặt nước chỉ ghép hai ảnh | render/water/passes3d.js |
| 4. Độ sâu thật quyết định màu | Quãng đường tia nhìn trong nước = độ sâu cảnh dưới nước (giải mã độ sâu logarit) − độ sâu mặt nước; Beer-Lambert theo từng màu (đỏ 0,34, lục 0,075, lam 0,052 mỗi đơn vị) | render/water/surface3d.js |
| 5. Chi tiết nhỏ hơn điểm ảnh thành độ nhám | So bước sóng với cỡ một điểm ảnh trên mặt nước (fwidth): sóng quá nhỏ thì tắt, phần mất cộng vào độ nhám; ánh nắng loang rộng ra, phản chiếu mờ dần về màu trời | render/water/surface3d.js |
| 6. Vật chạm nước để lại dấu | Gợn lan mô phỏng thật (phương trình sóng trên GPU, ô 48 × 48 quanh chỗ nhìn), bọt theo gợn, bóng tiếp xúc quanh vật nổi (mọi vật gọi BK.seaAt); vật dưới nước nhận hấp thụ và vân caustics | render/water/ripples3d.js, render/water/under3d.js |

## Chất lượng theo máy

- Mức 2 (độ nét cao): đủ ảnh dưới nước và ảnh phản chiếu, mỗi ảnh nửa độ phân giải màn hình.
- Mức 1: bỏ ảnh phản chiếu, mặt nước soi màu trời.
- Mức 0: bỏ cả hai, độ sâu ước theo khoảng cách tới bờ.
- Mức tự đổi theo độ nét của bộ điều tốc (render/perf3d.js). Đặt tay: `G.water.level = 0 | 1 | 2`, `null` để tự động.
- Máy quay dưới nước: bỏ hai lượt vẽ, mặt nước nhìn từ dưới lên sáng mờ màu nước sâu.

## Để phép nước dùng

- `G.water.splash(x, z, bán kính, độ mạnh)`: một cú chạm nước (gợn lan, bọt).
- Mực nước dâng, hạ: `G.sea3d.setSea(dy)` (mặt nước, hai lượt vẽ, hấp thụ, caustics đều đọc mực nước này).

## Đã kiểm

- Ảnh: góc cao giữa hai đảo, sát bờ lúc nhập hồn (bóng tháp, đảo phản chiếu; nước nông trong thấy đáy, ra xa xanh ngọc), gợn
  sau ba cú chạm nước, ban đêm, mức 0, đáy bể nhìn từ dưới nước. Không lỗi shader, không lỗi trang.
- Chưa đo được tốc độ thật: máy kiểm thử vẽ bằng phần mềm. Hai lượt vẽ thêm là hai lần vẽ cảnh ở nửa độ phân giải; máy chậm
  thì bộ điều tốc hạ độ nét, lớp nước tự xuống mức 1 rồi 0.
