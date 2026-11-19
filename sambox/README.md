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

Mỗi đảo có (đơn vị bản vẽ; × 1,2 ra độ cao thật). Khung đường dùng chung cho cả ba đảo (`src/world/islands/lanes.js`), địa
hình xung quanh mỗi đảo một kiểu:

- **Khu nhà chính** sau lưng đảo, núi chắn sau: lòng chảo phẳng cao 40, nhà chính ở giữa trên nền 46 (cao nhất). Đây là **chỗ
  duy nhất xây công trình** (lưới xây chỉ hiện ở đây). Hai cổng ở hai bên; sau cổng là đất xây, không còn đường.
- **Hai đường chính** (lính đi theo đợt): từ hai đầu cầu men theo hai sườn đảo lên cổng, lên dần theo bậc: bến 4 → nền tháp
  ngoài 18 → nền tháp trong 30 → cổng 40.
- **Rừng núi ở giữa** hai đường để phục kích; **hẻm suối** từ biển (giữa hai đầu cầu) lên cửa sau khu nhà chính, đủ rộng dẫn
  quân; **lối mòn trước** nối hai đường qua bến lội của hẻm suối; **lối mòn sau** nối hai đường vào thẳng cửa sau.
- **Đèo sau núi** từ lưng khu nhà chính ra đai ven biển phía sau; **đai ven biển** (phẳng, cao 4, rộng 18) chạy quanh đảo là
  lối sườn, cũng là chỗ xây tường thành (`shape.js RIM, coast, keepRim`).
- Ba đảo dùng chung khung nên **ba nhà chính thành tam giác đều** quanh tâm bể (cạnh 1.353), **sáu lối lính từ đầu cầu lên nhà
  chính dài bằng nhau** (662), **ba cầu dài bằng nhau** (400). Có kiểm thử: lối nào cũng đi được (không vách), đường chính dừng ở
  cổng, đai ven biển phẳng hơn 95% vòng đảo.
- **Ba cầu** (`src/world/bridges.js`); **nhà chính tạm** (`src/build/hall.js`, cờ màu đảo) để căn chỉnh.

| Đảo | Chất liệu | Địa hình |
| --- | --- | --- |
| Đồng Bằng (plains) | núi đồi bậc thềm, vách đá vôi ấm | rừng giữa: đồi tán bông, gò rừng, hẻm suối; sườn: cao nguyên tây, đồi đông, hồ; sau lưng: núi lớn có đèo |
| Sa Mạc (desert) | đá vân hồng, cồn cát | rừng giữa: mê cung núi bàn, khe vực, hồ ốc đảo bên bến lội; sườn: núi bàn, rừng cột đá, chảo muối, hố cổ; sau lưng: cao nguyên và núi bàn |
| Tuyết (tundra) | khối núi lớn, đá xám lộ dưới tuyết | rừng giữa: đồi băng phủ thông, khe băng, ao băng; sườn: núi phụ tây, sống băng đông, vịnh hẹp; sau lưng: khối núi chính có đèo băng |

## Xây công trình (chuẩn bị)

Mặt đất chia lưới ô 6 × 6 (`src/build/cells.js`): ô xây được khi nằm trong khu nhà chính, chênh cao trong ô không quá 1,2. Cỡ công
trình theo ô: nhà dân 2×2, nhà lính 6×4 (có sân tập), nhà xe 4×4, cổng thành 4×2, tường 1 ô một đoạn, tháp canh 2×2. Nút
**Lưới xây** hiện các ô này trên mặt đất (`src/build/grid.js`).

## Góc nhìn

Toàn cảnh; từng đảo nhìn từ tâm bể; nút **Tầm mắt**: đứng ở ban công tháp nhà chính nhìn xuống rừng giữa. Nút **Căn chỉnh**: tam
giác nối tâm ba nhà chính, các lối trên mỗi đảo (đường chính trắng, lối mòn cam, hẻm suối xanh, đèo tím), kèm số đo.
Sương xa mờ dần khi đứng sát đất (chiều sâu như ảnh đích), lùi theo khi máy quay lùi xa.

## Chạy

Mở `index.html` qua một máy chủ tĩnh bất kỳ (three.js đã đặt sẵn trong `vendor/`, không cần mạng).

Tham số URL: `?dao=all|plains|desert|tundra`, `?buoi=dawn|noon|sunset|night`, `?q=low|high`, `?mat=1` (tầm mắt), `?luoi=1`
(lưới xây), `?cc=1` (căn chỉnh).

Kiểm thử: `npm test` (nhiễu tất định, độ cao ba đảo, đáy biển giữa các đảo, đảo nằm trọn trong bể, mặt đảo hướng về tâm,
đai ven biển phẳng, khu nhà chính đủ rộng, đỉnh núi giữ cao độ, tam giác đều ba nhà chính, lối lính và cầu bằng nhau,
nhà chính cao nhất có núi chắn sau lưng, mọi lối đi được, đường chính dừng ở cổng).

## Cấu trúc

- `src/core/`: nhiễu có hạt giống, mức đồ hoạ, ghép hình học.
- `src/world/`: hình dạng ba đảo (`islands/`), bố cục, địa hình, biển, trời, các buổi trong ngày.
- `src/nature/`: cây, cỏ, gió, rải cây, đom đóm.
- `src/fx/`: vật liệu kiểu tranh (viền sáng, xuyên sáng lá, gió) và hậu kỳ (bloom, chỉnh màu).
- `src/build/`: lưới ô xây (`cells.js` thuần JS, `grid.js` vẽ lưới), nhà chính tạm (`hall.js`), đường căn chỉnh (`guides.js`).
- `src/world/bridges.js`: ba cây cầu.
- `src/ui/hud.js`: thanh chọn đảo, buổi, mức đồ hoạ, tầm mắt, lưới xây, FPS.
