# Sách phép: mỗi hệ một thư mục

Muốn sửa phép nào thì mở thư mục của hệ đó. Không cần mở tệp của hệ khác hay tệp lõi.

| Thư mục | Hệ | Phép |
|---|---|---|
| `magic/soul/` | Linh hồn | Tia linh lực, Hố đen (sắp có) |
| `magic/time/` | Thời gian | Dừng, Tua nhanh, Tua lùi |
| `magic/fire/` | Lửa | Cầu lửa, Vòng lửa |
| `magic/earth/` | Đất | Trụ đá, Rung đất (sắp có) |
| `magic/water/` | Nước | Gọi mưa, Cột nước, Đại hồng thuỷ (sắp có) |

## Trong một thư mục hệ

Tệp nào không cần thì không có.

| Tệp | Việc | Chạy ở |
|---|---|---|
| `spells.js` | Danh sách phép của hệ: tên, giá, hồi phép, cách dùng (bấm, giữ, bật tắt), đã mở chưa | Node và trình duyệt |
| `cast.js` | Phát phép: mỗi phép một hàm nhỏ. Đăng ký với sách bằng `BK.Spellbook.school('<hệ>', setup)` | Trình duyệt |
| `recipes.js` | Công thức hạt (chỉ số và màu) | Trình duyệt |
| `sounds.js` | Tiếng riêng của hệ (`BK.MagicAudio.add`) | Trình duyệt |
| `look3d.js` | Hình riêng không làm được bằng hạt (khối 3D, vòng lửa, trụ đá...) | Trình duyệt |
| Tệp luật riêng | Tác động lên thế giới, ví dụ `time/timeline.js` (ảnh trận), `fire/blaze.js` (nhà cháy) | Node, có kiểm thử |

`setup(G, kit)` trả về:
- `acts`: mỗi phép một mục `{ tap(chỗ ngắm) }` (bấm), `{ toggle(), on() }` (bật tắt) hoặc `{ hold(bật) }` (giữ);
- `update(giây)`: tuỳ chọn, chạy mỗi khung hình.

`kit` là đồ dùng chung mà sách đưa cho mỗi hệ (xem `game/spellbook.js`, mục KIT):

| Mục | Việc |
|---|---|
| `hand(out)` | Đầu gậy |
| `feet()` | Chân nhân vật |
| `folk()` | Người đang bị nhập hồn |
| `ground(x, z)` | Độ cao mặt đất |
| `bolt({...})` | Đạn phép bay theo đường cong |
| `castLook(phép, hue)` | Dáng niệm phép |
| `audio` | Tiếng phép |
| `say(chữ)` | Hiện dòng báo |
| `island()` | Đảo đang ở |

## Lõi dùng chung

Thêm hệ hay thêm phép thì không sửa các tệp này.

| Tệp | Việc |
|---|---|
| `logic/spells.js` | Luật chung: trang sách, linh lực, hồi phép, chế độ thử (`DEV`: mọi phép giá 5, linh lực vô hạn) |
| `game/spellbook.js` | Điều phối: chọn phép, ngắm, bấm, giữ, thả, đạn phép, gậy |
| `render/magic/vfx.js` | Bộ hạt chung |
| `render/magic/recipes.js` | Công thức hạt dùng chung |
| `render/magic/sigils.js` | Phù chú |
| `render/magic/staff3d.js` | Gậy phép |
| `render/magic/aim3d.js` | Vòng ngắm |
| `render/fx/magic-audio.js` | Tiếng chung |
| `render/style/palette.js` | Bảng màu các hệ |
| `ui/spellbook-ui.js` | Cuốn sách, thanh phép, thanh linh lực |

## Thêm một phép vào hệ có sẵn

1. Thêm một dòng vào `magic/<hệ>/spells.js`.
2. Thêm một hàm vào `acts` trong `magic/<hệ>/cast.js`.
3. Nếu cần hạt hay tiếng mới, thêm vào `recipes.js` hay `sounds.js` của hệ đó.

## Thêm một hệ mới

1. Thêm trang vào `SCHOOLS` (`logic/spells.js`) và màu vào `render/style/palette.js`.
2. Tạo thư mục `magic/<hệ>/` như trên.
3. Nạp các tệp trong `index.html`, sau `game/spellbook.js`.
