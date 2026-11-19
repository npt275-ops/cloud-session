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

- **Khu nhà chính** sau lưng đảo, núi chắn sau: lòng chảo **trũng**, phẳng, cao 22 (thấp hơn cổng); nhà chính đặt trên đất bằng
  như mọi chỗ khác trong khu (không ụ nền). **Vành đồi kín** quanh khu (cao hơn khu ~38; Đồng Bằng: đồi bậc thềm, Sa Mạc: vách đá vân có cát dồn ngoài, Tuyết: sống
  băng): đứng trong khu không thấy cổng, đầu cầu, cầu (cả cầu ở xa).
- **Ba lối vào khu, lối nào cũng gãy khúc** khi xuyên vành đồi (không có khe thẳng để nhìn ra): hai khe sau hai cổng, cửa trước
  (khe cua tay áo men sườn trong vành đồi, lên yên rồi xuống ngã ba chân vành đồi); đèo sau núi ở lưng khu.
- **Hai đường chính** (lính đi theo đợt): từ hai đầu cầu men theo hai sườn đảo tới cổng ở chân vành đồi, lên dần theo bậc: bến
  4 → nền tháp ngoài 12 → nền tháp trong 20 → cổng 24; sau cổng là khe đất (không lát) qua yên 27 xuống khu. Ở hai bậc tháp, hai
  bên đường có **vai phẳng** để đặt tháp.
- **Hai nền phẳng hai sườn** (theo ảnh mốc: cao nguyên sườn tây, đồi sườn đông), cao 30, nhìn xuống đường chính, mỗi nền có dốc
  thoải lên từ bậc tháp trong. Chung khung cho ba đảo (`lanes.js PADS, RAMPS`), mỗi đảo nặn một kiểu: Đồng Bằng cao nguyên vách đá
  và đồi cỏ đỉnh bằng, Sa Mạc thềm cát và núi bàn thấp, Tuyết hai thềm băng dưới chân núi phụ và sống băng.
- **Rừng núi ở giữa** hai đường để phục kích, **có núi cao** (chung khung `lanes.js MOUNTS`, ba đảo cao bằng nhau ở cùng chỗ): hai
  cặp núi giữa hai lối mòn, hai cặp núi giữa lối mòn trước và biển, núi trung tâm suối xẻ qua thành vách hẻm cao; đỉnh 46–70, che
  bớt tầm nhìn ra cầu (từ phía trong rừng giữa còn thấy khoảng 25% điểm cầu, lúc chưa có núi 28–45%). Chân núi gọn nên giữa các
  núi là thung phẳng; hai bên lối mòn xẻ, đắp thoai thoải: lính từ lối mòn đi lên rừng, xuyên thung được (kiểm thử: mọi chỗ đi được
  trong rừng giữa đều liền với lối mòn). **Hẻm suối**: suối uốn lượn từ mạch nước dưới ngã ba chân vành đồi ra biển (giữa
  hai đầu cầu), lòng hẻm rộng, suối giữa, **hai bờ đi được** (lối nhỏ, không lát), có một vũng; **lối mòn trước** nối hai đường
  qua bến lội (suối nông); **lối mòn sau** men chân vành đồi nối hai đường vào ngã ba.
- **Ba suối mỗi đảo một dáng** (`createPaths`): Đồng Bằng chữ S, Sa Mạc khúc trên gần thẳng rồi vòng cổ ngỗng lớn (khe vực vách
  đá vân), Tuyết hai vòng cùng lượn một phía (suối đóng băng). Uốn mềm (bán kính cong ≥ 18), hai khúc (ngã ba → bến lội, bến lội →
  biển) **dài đúng bằng nhau** trên ba đảo. Mặt nước suối: `src/world/rivers.js` (nước chảy, bọt ở mép và ghềnh; Tuyết là mặt
  băng nứt).
- **Đèo sau núi** từ lưng khu nhà chính ra đai ven biển phía sau; **đai ven biển** (phẳng, cao 4, rộng 18) chạy quanh đảo là
  lối sườn, cũng là chỗ xây tường thành (`shape.js RIM, coast, keepRim`).
- Ba đảo dùng chung khung nên **ba nhà chính thành tam giác đều** quanh tâm bể (cạnh 1.353), **sáu lối lính từ đầu cầu lên nhà
  chính dài bằng nhau** (726), **ba hẻm suối dài bằng nhau** (348), **ba cầu dài bằng nhau** (400). Có kiểm thử: lối nào cũng đi
  được (không vách), chỉ lát đường tới cổng, khu nhà chính không nhìn thấy cổng và cầu, đai ven biển phẳng hơn 95% vòng đảo.
- **Ba cầu** (`src/world/bridges.js`); **nhà chính tạm** (`src/build/hall.js`, cờ màu đảo) để căn chỉnh.

| Đảo | Chất liệu | Địa hình |
| --- | --- | --- |
| Đồng Bằng (plains) | núi đồi bậc thềm, đá vôi ấm | vành đồi rừng; giữa: núi đá bậc thềm phủ rừng, suối chữ S bờ cỏ; sườn: cao nguyên tây, đồi đông, hồ; sau: núi lớn |
| Sa Mạc (desert) | biển cồn cát hồng, ít đá | vành đá vân; giữa: núi cát hình sao (ba sống cát), suối ốc đảo (hồ ở vòng cổ ngỗng); sườn: thềm cát, núi bàn thấp, cột đá, chảo muối, hố cổ |
| Tuyết (tundra) | khối núi lớn, đá xám dưới tuyết | vành sống băng; giữa: núi băng đỉnh nhọn, chân rừng thông, khe suối đóng băng; sườn: thềm băng, núi phụ, sống băng, vịnh hẹp; sau: núi chính |

## Xây công trình (chuẩn bị)

**Chốt: chỗ nào phẳng là xây được** (trên cả đảo). Mặt đất chia lưới ô 6 × 6 (`src/build/cells.js`): ô xây được khi chênh cao trong
ô không quá 1,2, trên mặt nước, và không nằm trên lối lính đi (đường chính, khe, lối mòn, lòng hẻm suối, cửa trước, đèo, dốc lên
nền: không xây chắn lối). Chỗ xây lớn: khu nhà chính, đai ven biển, hai nền phẳng hai sườn, vai tháp, các bãi phẳng trong rừng. Cỡ
công trình theo ô: nhà dân 2×2, nhà lính 6×4 (có sân tập), nhà xe 4×4, cổng thành 4×2, tường 1 ô một đoạn, tháp canh 2×2. Nút
**Lưới xây** hiện các ô này trên mặt đất (`src/build/grid.js`). Chưa có logic game (chờ chốt phương án).

## Góc nhìn

Toàn cảnh; từng đảo nhìn từ tâm bể; nút **Tầm mắt**: đứng ở góc sau khu nhà chính nhìn chéo qua khu (nhà chính, đất xây, vành
đồi che kín). Nút **Căn chỉnh**: tam giác nối tâm ba nhà chính, các lối trên mỗi đảo (đường chính trắng, đứt nét qua khe sau cổng;
lối mòn cam; hẻm suối riêng của đảo xanh; đèo tím), kèm số đo.
Sương xa mờ dần khi đứng sát đất (chiều sâu như ảnh đích), lùi theo khi máy quay lùi xa.

## Chạy

Mở `index.html` qua một máy chủ tĩnh bất kỳ (three.js đã đặt sẵn trong `vendor/`, không cần mạng).

Tham số URL: `?dao=all|plains|desert|tundra`, `?buoi=dawn|noon|sunset|night`, `?q=low|high`, `?mat=1` (tầm mắt), `?luoi=1`
(lưới xây), `?cc=1` (căn chỉnh).

Kiểm thử: `npm test` (nhiễu tất định, độ cao ba đảo, đáy biển giữa các đảo, đảo nằm trọn trong bể, mặt đảo hướng về tâm,
đai ven biển phẳng, khu nhà chính đủ rộng, đỉnh núi giữ cao độ, tam giác đều ba nhà chính, lối lính và cầu bằng nhau,
nhà chính cao nhất có núi chắn sau lưng, mọi lối đi được, chỉ lát đường tới cổng, khu nhà chính trũng không nhìn thấy cổng, đầu
cầu, cầu; ba suối uốn mềm, dáng khác nhau, dài bằng nhau, hai bờ đi được, nước xuống dần ra biển; chỗ phẳng xây được ở khu nhà
chính, hai nền sườn, vai tháp, đai ven biển, không ô nào chắn lối đi; nhà chính trên đất bằng; rừng giữa có núi cao che bớt tầm nhìn
ra cầu, chỗ đi được đều liền lối mòn).

## Cấu trúc

- `src/core/`: nhiễu có hạt giống, mức đồ hoạ, ghép hình học.
- `src/world/`: hình dạng ba đảo (`islands/`), bố cục, địa hình, biển, trời, các buổi trong ngày.
- `src/nature/`: cây, cỏ, gió, rải cây, đom đóm.
- `src/fx/`: vật liệu kiểu tranh (viền sáng, xuyên sáng lá, gió) và hậu kỳ (bloom, chỉnh màu).
- `src/build/`: lưới ô xây (`cells.js` thuần JS, `grid.js` vẽ lưới), nhà chính tạm (`hall.js`), đường căn chỉnh (`guides.js`).
- `src/world/bridges.js`: ba cây cầu; `src/world/rivers.js`: mặt nước suối ba đảo.
- `src/ui/hud.js`: thanh chọn đảo, buổi, mức đồ hoạ, tầm mắt, lưới xây, FPS.
