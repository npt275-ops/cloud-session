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

Ba đảo xếp vòng quanh tâm bể, lệch nhau 120°, quay mặt vào nhau: mặt đảo (bãi, hồ, đồng thấp) hướng về tâm bể, núi quay lưng
ra thành kính. Đồng Bằng phía sau, Sa Mạc trước trái, Tuyết trước phải. Mỗi đảo vẽ theo bán kính gốc 300 rồi phóng ngang × 1,45
(bán kính thật ~435), cao × 1,2, xoay về tâm (`src/world/layout.js`, `shape.js placed`).

Mỗi đảo có (đơn vị bản vẽ; × 1,2 ra độ cao thật):

- **Đai ven biển**: dải đất phẳng cao 4, rộng 18, chạy quanh mép đảo để xây tường thành (`shape.js RIM, coast`). Chỉ đứt ở cửa
  sông, suối, vịnh hẹp đổ ra biển (kiểm thử: hơn 95% vòng đảo phẳng).
- **Nền xây ba bậc ở mặt đảo** (phương án 2 đã chốt, `shape.js withTown`): bến cao bằng đai ven biển · thị trấn +12 · nền cao
  +18. Vách giữa hai bậc là tường tự nhiên, dốc nối bậc là lối đi (chỗ đặt cổng thành). Núi cao hơn nền từ ~40 trở lên giữ
  nguyên, nên đỉnh núi không đổi.
- Chỗ xây (nền, đai ven biển) và chỗ đứng ngắm cảnh không có cây, ruộng.

| Đảo | Chất liệu | Địa hình |
| --- | --- | --- |
| Đồng Bằng (plains) | núi đồi bậc thềm, vách đá vôi ấm | núi lớn nhiều bậc, đồi phụ, cao nguyên mặt bàn, đồi cỏ lượn sóng, thung sông ra vịnh, hồ phía đông có suối ra biển, cột đá ngoài biển |
| Sa Mạc (desert) | cao nguyên đá vân hồng, cồn cát | cao nguyên nhiều thềm, hẻm vực sâu ba bậc xẻ dọc đảo, hồ ốc đảo và suối đáy hẻm, năm núi bàn, miệng hố cổ, vùng trũng cồn cát, rừng cột đá, chảo muối |
| Tuyết (tundra) | khối núi lớn, đá xám lộ dưới tuyết | khối núi chính và núi phụ nối bằng dãy sống núi, sông băng trong thung chữ U, vịnh hẹp vách dựng có thềm hai bên, hồ băng cạnh sông băng |

## Xây công trình (chuẩn bị)

Mặt đất chia lưới ô 6 × 6 (`src/build/cells.js`): ô xây được khi chênh cao trong ô không quá 1,2 và cao hơn mặt nước. Cỡ công
trình theo ô: nhà dân 2×2, nhà lính 6×4 (có sân tập), nhà xe 4×4, cổng thành 4×2, tường 1 ô một đoạn, tháp canh 2×2. Nút
**Lưới xây** hiện các ô này trên mặt đất (`src/build/grid.js`).

## Góc nhìn

Toàn cảnh; từng đảo nhìn từ tâm bể; nút **Tầm mắt**: đứng trên đảo nhìn xa (Đồng Bằng: mép bậc nền cao; Sa Mạc: mép hẻm vực;
Tuyết: sườn thung băng). Sương xa mờ dần khi đứng sát đất (chiều sâu như ảnh đích), lùi theo khi máy quay lùi xa.

## Chạy

Mở `index.html` qua một máy chủ tĩnh bất kỳ (three.js đã đặt sẵn trong `vendor/`, không cần mạng).

Tham số URL: `?dao=all|plains|desert|tundra`, `?buoi=dawn|noon|sunset|night`, `?q=low|high`, `?mat=1` (tầm mắt), `?luoi=1`
(lưới xây).

Kiểm thử: `npm test` (nhiễu tất định, độ cao ba đảo, đáy biển giữa các đảo, đảo nằm trọn trong bể, mặt đảo hướng về tâm,
đai ven biển phẳng, nền xây đủ rộng, đỉnh núi giữ nguyên).

## Cấu trúc

- `src/core/`: nhiễu có hạt giống, mức đồ hoạ, ghép hình học.
- `src/world/`: hình dạng ba đảo (`islands/`), bố cục, địa hình, biển, trời, các buổi trong ngày.
- `src/nature/`: cây, cỏ, gió, rải cây, đom đóm.
- `src/fx/`: vật liệu kiểu tranh (viền sáng, xuyên sáng lá, gió) và hậu kỳ (bloom, chỉnh màu).
- `src/build/`: lưới ô xây (`cells.js` thuần JS, `grid.js` vẽ lưới).
- `src/ui/hud.js`: thanh chọn đảo, buổi, mức đồ hoạ, tầm mắt, lưới xây, FPS.
