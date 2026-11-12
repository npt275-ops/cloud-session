# Bước 21 · Code dễ tìm, dễ sửa, dễ bảo trì (rà soát toàn bộ)

Yêu cầu: rà soát toàn bộ code để code dễ tìm, dễ sửa, dễ bảo trì. Không đổi gì trong game.

## 1. Đo trước khi sửa

| Chỉ số | Trước | Sau |
|---|---|---|
| Tệp .js (trừ vendor, docs, archive) | 148 | 152 (thêm 4 tệp đáy bể, 2 công cụ, 1 kiểm thử; 3 tệp chết ra archive) |
| Số dòng | 17 758 | 42 217 (cùng lượng code, xuống dòng theo một kiểu) |
| Dòng dài hơn 200 ký tự | 1 047 | 9 (đều là chuỗi shader, CSS) |
| Dòng dài hơn 400 ký tự | 89 (dài nhất 1 525) | 0 (dài nhất 240) |
| Tệp không nạp, không dùng | 3 | 0 |
| Tệp thiếu dòng tiêu đề đúng quy ước | 5 | 0 |
| Hằng số mặt biển ghi số ở | 4 tệp | 1 tệp |
| Bản đồ mã nguồn | không có (README cũ, sai nhiều chỗ) | `MA-NGUON.md` tự sinh |

## 2. Đã làm

- **Định dạng một kiểu** (Prettier 3.3.3, `.prettierrc.json`: rộng 140, nháy đơn): mọi tệp .js của game, kiểm thử, công cụ.
  Kiểm chứng: so cây cú pháp (AST, bỏ vị trí và chú thích) trước và sau của cả 149 tệp: giống hệt, nghĩa code không đổi.
- **Chú thích**: 18 dòng chú thích quá 180 ký tự tự xuống dòng; chú thích treo cuối dòng code dài đưa lên dòng riêng ngay
  trên (kiểm lại AST: giống hệt). Năm chuỗi shader, CSS quá 240 ký tự tách tay (cùng nội dung).
- **Tách tệp lớn**: `render/deep3d.js` (1 700 dòng) thành `render/deep/terrain3d.js` (địa hình), `kit3d.js` (bộ ghép khối),
  `ruins3d.js` (ba phế tích), `tunnels3d.js` (đường hầm); `render/deep3d.js` còn ghép phần, rong, bọt khí, máy quay dưới
  nước. Tên mỗi phần đọc và ghi qua ngữ cảnh chung D được dò tự động (không sót, không phần nào gán lại tên của phần trước).
  Giữ đúng thứ tự dựng (dãy ngẫu nhiên quyết định hình).
- **Một chỗ cho một số**: mặt biển `SEA_Y` chỉ ghi ở `sea3d.js`, ba tệp kia đọc `BK.SEA_Y`.
- **Tệp chết**: `render/model3d.js`, `render/face3d.js`, `ui/model-ui.js` (NPC mẫu đã bỏ, index.html không nạp) chuyển vào
  `archive/npc-mau/` kèm README; xoá hàm thừa `S0` trong đáy bể.
- **Tiêu đề**: 5 tệp sửa cho đúng "Bể Kính · <đường dẫn> · <việc>".
- **README** viết lại theo hiện trạng: game là gì, cách chạy, "Muốn sửa … xem trước tệp nào", quy ước, lệnh kiểm tra, bảng
  công cụ. README cũ (lịch sử tới bước 11) giữ nguyên văn ở `design/lich-su-README.md`. Hướng dẫn trong gói zip
  (`tools/build-package.py`) bỏ các dòng đã sai (đảo thô, nút bay), thêm nút "Đáy bể".

## 3. Công cụ, kiểm thử mới

- `tools/code-map.js` → `MA-NGUON.md`: mỗi tệp một dòng (việc, số dòng, tạo ra `BK.X` hay dịch vụ `G.x`, dùng tệp nào), bảng
  dịch vụ G, thứ tự nạp của index.html. Quan hệ giữa tệp dò từ code, nên luôn đúng.
- `tools/scene-print.js`: dấu vân tay hình học của cả cảnh ở thời 1, 6, 12 (số đỉnh, tổng toạ độ, tổng màu theo nhóm). Ghi mẫu
  hai lượt để loại nhóm động (người, khói); dùng để chứng minh một lần dọn code không đổi hình.
- `test/code.test.js` (chạy cùng `node --test test/*.js`): tiêu đề tệp đúng quy ước; không tệp mồ côi, index.html không nạp
  tệp không có; code tối đa 240, chú thích tối đa 180 ký tự một dòng; `MA-NGUON.md` đúng với code; số dùng chung ghi một chỗ.

## 4. Kiểm chứng (số đo thật)

- AST trước và sau định dạng, xuống dòng chú thích: giống hệt ở mọi tệp không cố ý sửa.
- `tools/scene-print.js --so`: 47 nhóm hình tĩnh giống hệt mẫu (một nhóm động: đảo Tuyết Trắng thời 1, không so) sau định
  dạng, sau tách đáy bể, sau gom SEA_Y.
- `node --test test/*.js`: 93 bài đạt (88 cũ + 5 mới).
- `tools/bug-hunt.js trận` thời 6: không lỗi trang; còn đúng các mục đã biết (phát trúng không người bắn 122, vài cặp đứng chồng).
- Chụp lại chín điểm "Đáy bể": giống trước.

## 5. Chưa làm (để bước sau, mỗi lần một tệp, khi sửa tới)

- Bốn tệp lớn: `render/village3d.js` (1 626 dòng), `logic/war.js` (1 512), `render/buildings3d.js` (1 484), `game/cities.js`
  (1 098). Mỗi tệp gánh nhiều việc; tách như đáy bể được, nhưng cần dấu vân tay cho cả hành vi (người, trận), không chỉ hình.
- Đối tượng G là một túi chung rất lớn (xem `MA-NGUON.md` mục "Dịch vụ G"); khó biết ai đổi gì. Nên dần đổi sang truyền
  thẳng thứ cần dùng.
- Kiểm thử chưa phủ phần vẽ (chỉ có công cụ đo bằng trình duyệt chạy tay).
- Kiểu viết cũ còn nhiều tên một chữ cái (`L`, `P`, `S`, `W`) và số ma thuật trong phần vẽ; đổi dần khi sửa tới.
