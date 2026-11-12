# Bể Kính

Một vị thần đứng ngoài bể kính nhìn sáu hòn đảo đi qua chín năm, mười hai thời đại: dân làng lập làng, sinh con, dựng nhà,
buôn bán, bắc cầu, gây chiến và thôn tính nhau. Dưới đáy bể là núi chìm, ba phế tích cổ và ba đường hầm xuyên núi.

- Sáu đảo, mỗi đảo một địa hình, một kiểu kiến trúc qua 12 thời (`render/build/`); làng và người chạy theo logic ngầm
  (`logic/`), cùng một hạt giống thì cả trận diễn ra y hệt.
- Mỗi người có tên, gen tính cách, gia đình, nhà riêng, việc rõ ràng trong ngày; chiến tranh qua cầu, đánh cổng, vây nhà
  chính, đầu hàng, sáp nhập, nổi dậy; tên lửa và hạt nhân ở các thời sau.
- Biển có sóng, bọt vỗ bờ và vách kính; đáy bể sâu có thể lặn xuống xem (nút "Đáy bể").

Thiết kế, quyết định và số đo từng bước nằm trong `design/` (mới nhất: `design/ke-hoach-buoc-20.md`).

## Chơi

- Mở `index.html` bằng trình duyệt có WebGL (three.js tải từ CDN), hoặc chạy máy chủ tĩnh `python3 -m http.server` ở thư
  mục gốc repo. `?seed=` để thử trận khác, `?cap=5` để vào thẳng thời 5.
- Kéo để xoay, cuộn để phóng, bấm tên đảo để bay tới; phím mũi tên hay W A S D để lướt, E / Q để lên xuống.
- Bản chơi không cần mạng và bản cài lên điện thoại: `python3 aquarium/tools/build-package.py` (chạy ở thư mục gốc repo) dựng
  `docs/` và `docs/BeKinh-ban-may-tinh.zip`; cách cài trong `docs/HUONG-DAN.txt`.

## Làm việc với code

**Tìm.** `MA-NGUON.md` là bản đồ mọi tệp: việc của tệp, nó tạo ra gì (`BK.X`, dịch vụ `G.x`), nó dùng tệp nào, thứ tự nạp.
Bản đồ tự sinh từ code (`node tools/code-map.js`), luôn đúng với code. Muốn sửa một phần thường gặp:

| Muốn sửa | Xem trước |
|---|---|
| Con số luật chơi (nhịp trận, tuổi thọ, giá cả) | `logic/rules.js` |
| Thời đại, lên cấp | `logic/eras.js`, `logic/economy.js` |
| Người: tuổi, gen, gia đình, nhà | `logic/people.js`, `logic/genes.js`, `logic/family.js`, `logic/homes.js` |
| Lịch một ngày, việc của từng người | `logic/schedule.js`, `logic/tasks.js`, `logic/jobs.js` |
| Chiến tranh, trận đánh, vây thành | `logic/war.js`, `logic/battles.js`, `logic/siege.js`, `logic/strategy.js` |
| Quyền năng của thần, mục tiêu | `logic/powers.js`, `logic/goals.js` |
| Ghép logic với hình (sáu đảo chạy cùng nhau) | `game/cities.js` |
| Dáng đảo, cao độ mặt đất, sông hồ | `render/map/terrain3d.js`, `render/map/height3d.js`, `render/map/water3d.js` |
| Công trình Lúa Vàng theo thời | `render/build/plains/e01.js` … `e12.js`, `town.js`, `wonders.js` |
| Công trình năm đảo kia | `render/build/isles/` (mỗi đảo một tệp, `compose.js` ghép) |
| Đặt công trình, nền, khung chân | `render/buildings3d.js`, `render/build/place3d.js` |
| Đường, xe, chuyến đi | `render/build/roads.js`, `render/build/vehicles.js`, `render/build/traffic3d.js` |
| Người đi lại, tránh nhà | `render/village3d.js`, `render/nav3d.js` |
| Dáng người, trang phục, cử chỉ | `render/rig3d.js`, `render/outfits3d.js`, `render/gestures3d.js`, `render/work3d.js` |
| Biển, sóng | `sea3d.js` |
| Đáy bể, phế tích, đường hầm | `render/deep/` (ghép ở `render/deep3d.js`) |
| Trời, ngày đêm, không khí từng thời | `render/sky3d.js`, `render/mood3d.js` |
| Máy quay, thanh đảo | `ui/camera-fly.js`, `ui/landbar.js`, `render/scene3d.js` |

**Quy ước.**

- Mỗi tệp `.js` mở đầu bằng `Bể Kính · <đường dẫn> · <việc của tệp>`, rồi vài dòng nói tệp làm gì và cần tệp nào.
- Mỗi tệp là một khối `(function (root) { … })` gắn kết quả vào `BK.<Tên>`; tệp sau chỉ dùng được tệp nạp trước nó trong
  `index.html`. Logic (`logic/`) không biết gì về 3D, chạy được trong Node; phần vẽ chỉ đọc trạng thái logic.
- Số dùng chung ghi ở một chỗ (ví dụ mặt biển: `sea3d.js`, nơi khác đọc `BK.SEA_Y`); luật chơi ghi trong `logic/rules.js`.
- Định dạng bằng Prettier theo `.prettierrc.json` (rộng 140): `npx prettier@3.3.3 --write <tệp>`. Chú thích tự xuống dòng
  tay (tối đa 180 ký tự); chú thích không treo cuối một dòng code dài: đặt lên dòng riêng ngay trên.
- Tệp không còn dùng chuyển vào `archive/` (không xoá), kèm một dòng lý do.

**Kiểm tra trước khi đẩy code** (trong thư mục `aquarium/`):

```bash
node --test test/*.js
```

Gồm kiểm thử logic và `test/code.test.js` (giữ quy ước trên: tiêu đề tệp, không tệp mồ côi, dòng không quá dài,
`MA-NGUON.md` đúng với code, số dùng chung chỉ ghi một chỗ).

**Công cụ đo** (`tools/`, cần Playwright và Chromium cho các công cụ mở trang thật):

| Lệnh | Đo gì |
|---|---|
| `node tools/scene-print.js` | Dấu vân tay hình học của cảnh: ghi mẫu trước khi dọn hay tách code, `--so <mẫu>` sau khi sửa để chắc hình không đổi |
| `node tools/calibrate.js 100` | 100 trận chín năm bằng Node, so với mục tiêu trong `tools/targets.json` |
| `node tools/bug-hunt.js` | Quét lỗi khi chạy thật: người lơ lửng, kẹt, bước tại chỗ, phát trúng không người bắn |
| `node tools/check-walk.js` | Người đi xuyên công trình (6 đảo × 12 thời) |
| `node tools/check-footing.js` | Công trình thò ra ngoài mép đảo |
| `node tools/check-scene.js` | Chỗ dùng chung không chồng, dân đứng không, tụ tập, kẹt |
| `node tools/clip.js` | Quay đoạn phim khung dọc một cảnh |
| `node tools/code-map.js` | Ghi lại `MA-NGUON.md` |
| `python3 tools/build-package.py` | Đóng gói `docs/` và gói zip (chạy ở thư mục gốc repo: `python3 aquarium/tools/build-package.py`) |

## Thư mục

`game/` ghép game · `logic/` logic ngầm · `render/` vẽ 3D (`map/` bản đồ, `build/` công trình, `deep/` đáy bể) · `ui/` giao
diện · `test/` kiểm thử · `tools/` công cụ · `design/` thiết kế và kế hoạch từng bước · `vendor/`, `icons/` three.js, phông
chữ, biểu tượng · `archive/` code cũ không còn nạp.

README cũ (lịch sử tới bước 11): `design/lich-su-README.md`.
