# Bước 37 · Sách phép thuật (đề xuất, chưa làm)

Người chơi muốn một cuốn sách phép thuật, code tách riêng để dễ sửa, gồm: phép thời gian (tiến, lùi, tạm dừng), lửa, đất,
nước; cùng một bộ hạt dùng chung và các kỹ năng hiệu ứng hợp với game, vẫn đẹp mắt.

## 1. Ý tưởng chung

- **Sách thuộc về linh hồn** (người chơi), không thuộc về NPC đang bị nhập. Phép phát ra từ tay nhân vật đang nhập hồn, ngắm
  bằng tâm màn hình (điểm trên mặt đất trước mặt). Phép thời gian dùng được cả ở góc nhìn thượng đế.
- **Phép có hậu quả thật nhưng có giới hạn**: lửa làm cháy nhà, đất chặn đường, nước dập lửa và tưới ruộng; dân, lính phản
  ứng (chạy, sợ, bàn tán). Luật nằm ở logic, chạy được bằng Node, có kiểm thử; phần vẽ chỉ đọc logic.
- **Phong cách hiệu ứng hợp "thế giới đồ chơi thu nhỏ"**: hạt to, tròn, mềm như đất nặn và bông; lửa là các lưỡi lửa bo tròn
  nhiều lớp (vàng ở lõi, cam, đỏ ở rìa), khói là cục bông xám; nước là giọt tròn và màng nước bóng; đá là khối bo cạnh. Không
  dùng ảnh chụp thật, không dùng khói mờ kiểu điện ảnh. Màu lấy từ một bảng màu chung (dễ chỉnh lại sau).
- **Linh lực**: một thanh năng lượng của linh hồn, hồi dần theo thời gian thật. Mỗi phép tốn linh lực và có thời gian hồi phép,
  để không spam phép mà vẫn chơi thoải mái. (Niềm tin của dân, logic/powers.js, giữ cho quyền năng ở góc thượng đế.)

## 2. Các phép (mỗi hệ 2 phép, đủ khác nhau)

| Hệ | Phép | Cách dùng | Hiệu ứng nhìn thấy | Tác động lên thế giới |
|---|---|---|---|---|
| Thời gian | Dừng thời gian | Bấm: dừng, bấm lại: chạy | Màu cảnh nhạt dần ngả lam bạc; hạt bụi, lá, khói đứng im giữa không trung; một vòng đồng hồ mờ toả ra từ tay | Logic dừng hẳn; mọi người đứng im giữa động tác, **chỉ linh hồn (nhân vật mình) vẫn đi lại được**; tối đa vài giây thật mỗi lần |
| Thời gian | Tua nhanh | Giữ phím | Mặt trời, bóng nắng quay nhanh, mây kéo vệt, người đi thành vệt mờ | Tốc độ trận 8×, 16× (đang có 1, 2, 4×) |
| Thời gian | Tua lùi | Giữ phím | Cảnh chạy ngược: các khung ảnh lùi về, viền màn hình gợn sóng nhẹ, tiếng đồng hồ chạy ngược | Mỗi ngày game lưu một ảnh trận (logic/save.js) trong vòng 30 ngày gần nhất; giữ phím thì lùi từng ngày; thả ra thì trận chạy tiếp từ đó (lịch sử mới) |
| Lửa | Cầu lửa | Bấm: ném | Quả cầu bay theo đường cong, kéo đuôi lửa, đốm than; chạm thì nổ: chớp sáng, vòng lửa, tàn lửa bắn ra, khói bông bốc lên, vết cháy xém trên đất | Nhà trúng thì bén lửa (hệ cháy sẵn có); lính trong vòng nổ ngã; dân gần đó chạy |
| Lửa | Vòng lửa | Giữ: vẽ vòng quanh mình | Lưỡi lửa nhỏ mọc thành vòng, cháy vài giây | Không ai đi qua được (chặn đường), cỏ cháy xém |
| Đất | Trụ đá | Bấm | Đất nứt, trụ đá bo tròn trồi lên kèm bụi, sỏi văng | Thành vật cản thật (người đi vòng); tự vỡ sau một lúc |
| Đất | Rung đất | Giữ rồi thả | Sóng gợn chạy trên mặt đất, vết nứt toả ra, đá nhỏ nảy lên | Người trong vòng ngã ngồi, công trình đang dựng bị chậm lại |
| Nước | Gọi mưa | Bấm | Đám mây nhỏ tụ trên điểm ngắm, mưa rơi, vũng nước, cầu vồng sau mưa | Dập lửa, tưới ruộng (dùng logic mưa sẵn có, chỉ một vùng nhỏ) |
| Nước | Cột nước | Bấm | Cột nước phun lên, giọt tròn bắn tung, màng nước bóng đổ xuống, mặt đất ướt sẫm màu một lúc | Đẩy người ra xa, dập lửa tức thì |

Sau này có thể kết hợp hai hệ, ví dụ nước gặp lửa ra hơi nước, lửa gặp đất ra dung nham, nhưng chưa làm ở bước này.

## 3. Bộ hạt dùng chung (nâng cấp render/fx/particles3d.js)

Mọi phép chỉ là "công thức" ghép từ vài viên gạch chung. Thêm phép mới chủ yếu là viết công thức, không viết code vẽ mới.

| Viên gạch | Dùng cho | Cách vẽ |
|---|---|---|
| Hạt mềm | Khói, bụi, hơi nước, bông mây | Khối điểm, mỗi hạt có cỡ, màu, độ mờ thay đổi theo tuổi (đường cong) |
| Hạt sáng | Lửa, tàn lửa, tia phép | Như trên nhưng cộng sáng, lõi sáng hơn rìa |
| Vệt | Đuôi cầu lửa, giọt mưa, vệt tua nhanh | Đoạn thẳng hay dải mỏng nối các điểm |
| Mảnh vụn | Đá, đất, giọt nước to | Khối lặp có vật lý đơn giản: rơi, nảy, lăn, nằm lại |
| Vết trên đất | Cháy xém, đất ướt, vết nứt | Hình tròn mờ dán sát mặt đất, nhạt dần theo thời gian |
| Đèn | Chớp nổ, ánh lửa | Vài đèn điểm dùng lại (tối đa 4 cùng lúc) |
| Hậu kỳ | Dừng thời gian, tua lùi, chớp sáng, gợn nhiệt | Thêm vài số vào render/fx/post3d.js |
| Âm thanh | Mỗi phép một tiếng | Tổng hợp bằng code như soul-audio, không cần tệp âm thanh |

Giới hạn để vẫn mượt: tối đa 4.000 hạt ở máy tính, 1.500 ở điện thoại; hạt xa máy quay phát ít đi; mỗi viên gạch một lượt vẽ.

## 4. Tách code (mỗi phần một tệp, dễ tìm, dễ sửa)

| Tệp | Nội dung |
|---|---|
| logic/spells.js | Luật: danh sách phép, linh lực, hồi phép, tác động lên thế giới (cháy, chặn đường, dập lửa, đẩy người). Có kiểm thử |
| logic/timeline.js | Ảnh trận mỗi ngày (vòng 30 ngày), tua lùi, dừng. Có kiểm thử |
| game/spellbook.js | Chọn phép, ngắm, bấm, giữ, thả; gọi logic và hiệu ứng |
| render/magic/vfx.js | Bộ hạt dùng chung (viên gạch ở mục 3) |
| render/magic/recipes.js | Công thức hiệu ứng của từng phép (chỉ là số, màu, thời gian: chỉnh đẹp ở đây) |
| render/magic/time3d.js, fire3d.js, earth3d.js, water3d.js | Phần vẽ riêng của từng hệ (trụ đá, cột nước, đồng hồ...) |
| render/style/palette.js | Bảng màu chung cho mọi hiệu ứng |
| render/fx/magic-audio.js | Âm thanh phép |
| ui/spellbook-ui.js | Cuốn sách (mở bằng phím B: bốn trang Thời gian, Lửa, Đất, Nước), thanh phép nhanh 1 đến 8, thanh linh lực, tâm ngắm; trên điện thoại có nút sách và nút phép |

## 5. Thứ tự làm, mỗi bước chụp ảnh để duyệt

1. Bộ hạt dùng chung, bảng màu, khung sách (mở sách, chọn phép, ngắm, linh lực) và một phép thử đơn giản để thấy cả đường đi.
2. Phép thời gian. Đo trước dung lượng một ảnh trận để chọn số ngày giữ được.
3. Lửa. 4. Đất. 5. Nước. Mỗi hệ: luật và kiểm thử, rồi hiệu ứng, ảnh, rồi cân chỉnh.

## 6. Cần người chơi quyết

1. Sách dùng khi nhập hồn (đề xuất), hay cả ở góc nhìn thượng đế cho mọi phép?
2. Giá phép: linh lực hồi theo thời gian (đề xuất), hay dùng niềm tin của dân như quyền năng sẵn có?
3. Phép có hậu quả thật lên thế giới (đề xuất, có giới hạn), hay chỉ là hiệu ứng cho đẹp?
4. Tua lùi xa nhất bao lâu: 30 ngày game (đề xuất), hay dài hơn (tốn bộ nhớ hơn)?
5. Danh sách 8 phép ở mục 2: giữ, đổi, hay thêm phép nào?
