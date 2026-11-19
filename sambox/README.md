# SamBox

Dự án mới, dựng lại từ đầu. Dự án cũ `aquarium/` giữ nguyên làm tư liệu, SamBox không dùng chung code với nó.

## Cách làm: "ảnh mô phỏng đích"

Mỗi phương án được chốt bằng một bản chạy được và ảnh chụp từ chính bản đó. Bước 1 là đồ hoạ và 3 hòn đảo trống
(chưa có công trình, chưa có nhân vật).

## Phong cách đồ hoạ (theo kho 15 ảnh tham chiếu)

- Chính: ảnh 5–14 (đảo ấm áp, cây tán bông, cỏ/oải hương/lúa rung theo gió, viền sáng ngược nắng, trời tím vàng,
  vách đá vẽ tay, bloom và chỉnh màu) và ảnh 15 (phong cảnh).
- Ảnh 1: độ dễ đọc khi xây. Ảnh 2–4 (PBR nặng): chỉ lấy ý tưởng.
- Nhẹ để chạy được trên điện thoại và máy tính: hai mức đồ hoạ Thấp/Cao, tự chọn theo máy, `?q=low|high` để ép.

## Bể kính tròn và ba đảo

Ba đảo nằm chung trong một bể kính tròn, dáng bể theo dự án cũ (`src/world/tank.js`):

- vòm kính bán cầu phủ trên mặt nước, vòng đồng và 18 núm đồng ở chân vòm;
- dưới mặt nước là chậu kính tròn (thành kính, đáy kính, vòng đồng ở chân) nhìn thấy khối nước và lớp cát đáy;
- đá bay có cỏ lơ lửng quanh bể, mây bông vây quanh cả trên và dưới bể.

Ba đảo xếp vòng quanh tâm bể, lệch nhau 120°. Mỗi đảo vẽ theo bán kính gốc 300 rồi phóng ngang × 1,45 (bán kính thật ~435),
cao × 1,2 (`src/world/layout.js`).

| Đảo | Chất liệu | Địa hình |
| --- | --- | --- |
| Đồng Bằng (plains) | núi đồi bậc thềm, vách đá vôi ấm | núi lớn nhiều bậc, đồi phụ, cao nguyên mặt bàn, đồi cỏ lượn sóng, thung sông ra vịnh, hồ có suối ra biển, mũi đất, vịnh, cột đá ngoài biển |
| Sa Mạc (desert) | đồi cát, núi bàn nhiều vân đá | sáu núi bàn, hẻm vực dài xẻ ngang đảo, biển đụn cát cao, rừng cột đá, lòng chảo muối, miệng hố cổ, ốc đảo |
| Tuyết (tundra) | khối núi lớn, đá xám lộ dưới tuyết | khối núi chính và núi phụ nối bằng dãy sống núi, sông băng trong thung chữ U, vịnh hẹp vách dựng, đồng rêu có hồ nhỏ đóng băng, hồ băng lớn |

## Chạy

Mở `index.html` qua một máy chủ tĩnh bất kỳ (three.js đã đặt sẵn trong `vendor/`, không cần mạng).

Tham số URL: `?dao=all|plains|desert|tundra`, `?buoi=dawn|noon|sunset|night`, `?q=low|high`.

Kiểm thử: `npm test` (nhiễu tất định, thứ tự độ cao ba đảo, tỉ lệ đất, có vách dốc, đáy biển giữa các đảo).

## Cấu trúc

- `src/core/`: nhiễu có hạt giống, mức đồ hoạ, ghép hình học.
- `src/world/`: hình dạng ba đảo (`islands/`), bố cục, địa hình, biển, trời, các buổi trong ngày.
- `src/nature/`: cây, cỏ, gió, rải cây, đom đóm.
- `src/fx/`: vật liệu kiểu tranh (viền sáng, xuyên sáng lá, gió) và hậu kỳ (bloom, chỉnh màu).
- `src/ui/hud.js`: thanh chọn đảo, buổi, mức đồ hoạ, FPS.
