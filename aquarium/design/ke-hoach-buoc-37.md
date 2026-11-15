# Bước 37 · Sách phép thuật

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

## 7. Người chơi đã quyết

1. Sách chỉ dùng được khi nhập hồn.
2. Phép tốn linh lực tự hồi.
3. Phép có hậu quả thật lên thế giới.
4. Tua lùi xa nhất 30 ngày game.
5. Đổi, thêm phép:
   - **Đất, trụ đá**: dựng ngay dưới chân nhân vật đang đứng, nâng nhân vật lên; máy quay bật lên cao gấp 6 lần kèm hiệu ứng
     (bụi, đá văng, đất nứt) cho thật.
   - **Nước, phép mới "Đại hồng thuỷ"**: chỉ dùng được khi ở gần biển. Sóng mạnh hơn, giữa là lốc xoáy nước; toàn bộ nước trong
     bể dâng lên cao chừng 13 đến 15 lần tầm mắt nhân vật rồi đổ ập xuống thật mạnh; sóng lớn tràn vào cả sáu đảo. Phần code
     của phép này phải đặc biệt sạch: tách thành các tệp nhỏ theo từng việc (luật, mực nước, lốc xoáy, sóng tràn, máy quay),
     không chồng code, dễ tìm dễ sửa.

## 8. Bước 1 (đang làm): khung sách, bộ hạt chung, linh lực

| Tệp | Nội dung |
|---|---|
| render/style/palette.js | Bảng màu chung của phép và giao diện sách |
| render/magic/vfx.js | Bộ hạt dùng chung: hạt mềm, hạt sáng, mảnh vụn, vết trên đất, đèn chớp; phát theo công thức, nguồn phát liên tục |
| render/magic/recipes.js | Công thức hiệu ứng (chỉ là số, màu) |
| render/magic/aim3d.js | Vòng ngắm trên mặt đất |
| logic/spells.js | Danh sách phép, linh lực, hồi phép, điều kiện dùng (kiểm thử: test/spells.test.js) |
| game/spellbook.js | Chọn phép, ngắm (tia từ tâm màn hình xuống đất), bấm phép, đạn phép bay tới đích |
| ui/spellbook-ui.js | Cuốn sách (phím B), thanh phép 1 đến 9, thanh linh lực |
| render/fx/magic-audio.js | Âm thanh phép |

Phép thử để chạy thông cả đường đi: "Tia linh lực" (trang Linh hồn): một đốm sáng bay từ tay tới chỗ ngắm, nổ tung hạt sáng.
Chưa có tác động lên thế giới; các phép của bốn hệ hiện trong sách nhưng còn khoá ("sắp có") tới bước của hệ đó.

### Bước 1 đã làm

- Đủ các tệp ở bảng trên; sách có 5 trang (Linh hồn, Thời gian, Lửa, Đất, Nước), phép chưa làm ghi "Sắp có"; thanh phép 1 đến 9,
  thanh linh lực (100, hồi 7 mỗi giây thật), báo khi không phát được; phím B mở sách, E hay chuột trái (đã khoá chuột) phát
  phép, Esc đóng sách trước rồi mới thoát nhập hồn; điện thoại có nút Sách, Phép.
- Phép thử "Tia linh lực": tay đưa ra, quả cầu sáng bay theo đường cong kéo đuôi hạt, chạm đất bung hạt sáng, vòng sóng, bụi
  sáng, đèn chớp, tiếng vút và tiếng bung.
- Sửa hai lỗi tìm thấy khi thử: (1) shader tự viết của bộ hạt (cả bộ hạt cũ render/fx/particles3d.js) tính độ sâu khác kiểu
  logarithmicDepthBuffer của renderer nên mặt đất che mất hạt; (2) mờ hậu cảnh lúc nhập hồn quá mạnh xoá nhoè hạt ở tầm ngắm:
  giảm từ 0,75 xuống 0,3 (game/possess.js IN_FX).
- Hạt sáng trộn kiểu "vừa phát sáng vừa che một phần nền" (cộng sáng thuần chìm mất trên cỏ, trời ban ngày).
- Kiểm thử: test/spells.test.js.

## 9. Ảnh tham khảo người chơi gửi (sau bước 1) và cách đưa vào

Lấy ý tưởng chung, không chép hình của trò chơi khác (ký hiệu, cuốn sách, gậy đều tự thiết kế theo phong cách đồ chơi thu nhỏ).

| Ý trong ảnh | Đưa vào Bể Kính |
|---|---|
| Sách mở sẵn ở góc dưới màn hình, trang bên phải là vòng phù chú của phép đang chọn | Sách nhỏ luôn hiện ở góc dưới trái khi nhập hồn, lật trang khi đổi phép; mỗi hệ một vòng phù chú tự vẽ (vòng tròn, hình của hệ ở giữa, ba vòng nhỏ quanh) |
| Gậy phép trong tay (nhìn ngôi thứ nhất) | Gậy phép bo tròn trong tay phải nhân vật; phép bay ra từ đầu gậy |
| Vòng phép sáng xoay trước tay khi niệm | Viên gạch mới "vòng phù chú" trong bộ hạt chung: vòng sáng có ký hiệu xoay trước đầu gậy hay dưới đất, màu theo hệ |
| Cầu nước lơ lửng | Cột nước, gọi mưa: tụ thành quả cầu nước trước rồi mới phun |
| Đá trồi lên, bụi cát | Trụ đá, rung đất |
| Hạt bụi lơ lửng giữa không trung | Dừng thời gian: bụi, lá, tàn lửa đứng im giữa không trung |
| Lốc lửa xoáy lên trời | Vòng lửa nâng cấp thành lốc lửa (vệt lửa xoắn ốc) |
| Hố đen có vành sáng | Phép mới gợi ý cho trang Linh hồn: hố đen hút hạt, hút người nhẹ (ý người chơi nêu từ đầu) |
| Sóng nước đổ ập, bọt trắng | Cột nước, sóng; Đại hồng thuỷ |

Người chơi đã chọn (sau ảnh tham khảo): sách chỉ hiện khi bấm B (không luôn hiện ở góc); có gậy phép trong tay phải; thêm phép
"Hố đen" vào trang Linh hồn (làm sau bốn hệ chính).
- Đã làm (sau ảnh tham khảo): gậy phép (render/magic/staff3d.js: bám theo tay phải, đứng thẳng khi đi, nghiêng về chỗ ngắm
  khi niệm; ngọc màu hệ phép đang chọn; đạn phép bay ra từ đầu gậy); vòng phù chú (render/magic/sigils.js: năm hình tự thiết kế;
  viên gạch "sigil" trong render/magic/vfx.js: hiện trước đầu gậy lúc niệm, nằm sát đất lúc bung); phép "Hố đen" thêm vào sách
  (sắp có).

## Phép thời gian (đã làm)
- Dừng (bật/tắt, lâu nhất 8 giây thật), tua nhanh (giữ: 8 lần, giữ quá 1,5 giây thì 16 lần), tua lùi (giữ: mỗi 0,45 giây lùi
  một ảnh trận; ảnh chụp mỗi 3 ngày game, giữ 30 ngày). Điều khiển: game/time-magic.js; đồng hồ thế giới G.timeCtl (frozen, mul)
  do game/loop.js đọc; ảnh trận logic/timeline.js (nạp vào thế giới đang chạy, giữ nguyên đối tượng); hình: render/magic/time3d.js;
  màn hình: render/fx/post3d.js (desat, tint, ripple); tiếng: render/fx/magic-audio.js (bell, tick).
- Lúc dừng: logic, nhà, mây, người trong làng đứng im; chỉ người bị nhập hồn, máy quay, hiệu ứng phép chạy theo giờ thật.
- Sau tua lùi: người bị nhập vẫn được đánh dấu possessed; người đó chưa có ở lúc lùi về thì thoát nhập hồn.

## Linh lực lúc làm game (người chơi chốt)
- Tạm thời mọi phép cùng giá 5 (phép giữ: 5 mỗi giây), linh lực vô hạn: logic/spells.js `DEV = { infinite: true, cost: 5 }`.
  Giá riêng từng phép vẫn ghi trong SPELLS; chơi thật thì đặt `infinite: false, cost: null`.

## Mỗi hệ phép một thư mục (người chơi chốt: code sạch, dễ tìm, dễ sửa)
- `magic/<hệ>/`: spells.js (danh sách phép), cast.js (phát phép, đăng ký với sách), recipes.js (hạt), sounds.js (tiếng),
  look3d.js (hình riêng), tệp luật riêng (time/timeline.js, fire/blaze.js). Hướng dẫn: magic/README.md.
- Lõi (logic/spells.js, game/spellbook.js, render/magic/, render/fx/magic-audio.js) không biết gì về từng hệ: thêm phép, thêm
  hệ không sửa lõi. Sửa phép thời gian chỉ mở magic/time/.

## Hệ lửa (đã làm)
- Cầu lửa (bấm, ngắm): quả cầu bay theo đường cong, nổ: chớp, lửa đặc bung tròn, tàn lửa, khói bông, mảnh than, vết cháy xém.
  Hậu quả: tối đa 2 nhà, bãi làm việc trong 3,2 đơn vị bén lửa (magic/fire/blaze.js: cháy 10 ngày game, mỗi ngày mất 0,045
  độ bền: một lần làm nhà mất gần nửa độ bền, người nhà phải ở nhờ; ba lần thì sụp; đang cháy thì thợ chưa sửa); người trong
  8 đơn vị hoảng sợ, mặt sợ hãi, bỏ chạy chừng 5 giây (render/village3d.js spook).
- Vòng lửa (bấm, quanh mình): 36 lưỡi lửa thành vòng bán kính 4, cháy 6 giây thật, ánh lửa chập chờn, vết cháy xém thành vòng.
  Hậu quả: không ai đi vào được (render/village3d.js setZones), người trong vòng bị đẩy ra, bỏ chạy; nhà chạm vòng bén lửa.
- Nhà đang cháy: lửa đặc dày trên đỉnh mái, khói đen xám bốc cao, tàn lửa (magic/fire/look3d.js; tối đa 6 nhà gần máy quay).
- Dừng thời gian: lửa ngừng phát, vòng lửa không hết giờ, nhà không cháy thêm (luật theo ngày game).
- Lửa kiểu "đồ chơi": cục lửa tròn đặc màu cam (lớp hạt mềm, đọc rõ ban ngày) cộng lõi hạt sáng.

## Phù chú ở đầu gậy (người chơi chốt)
- Mỗi lần niệm phép, phù chú của hệ (5 hình: render/magic/sigils.js) hiện ở đầu gậy, bám theo đầu gậy, quay mặt về máy quay,
  xoay chậm; rõ chừng một giây rồi mờ dần (tổng 1,8 giây) để người chơi nhìn rõ hình của hệ (game/spellbook.js TIP_SIGIL, kit.tipSigil).

## Hệ đất (đã làm)
- Đất nhô dùng chung: L.bumps cộng vào cao độ đảo (render/map/height3d.js L.surfAt); người, máy quay, hạt đi trên mặt núi.
  Cỏ, cây đặt theo đất gốc (L.baseAt): núi hạ xuống thì không lơ lửng.
- Trụ đá (bấm, dưới chân): núi đá bán kính 7,5 trồi lên, đỉnh là trụ đá phẳng cao 7 (gấp 5 người); nhân vật được nâng lên theo
  (đo: 4,8 → 11,8). Máy quay bật ra xa gấp 6 lần (đo: 4,2 → 25,5 đơn vị) trong 2,2 giây rồi về dần, rung theo đất.
- Núi đá (bấm, ngắm): sáu trụ đá trồi lên quanh chỗ ngắm, rồi đất giữa chúng dâng thành núi cao 4,5; trụ nằm lại thành mỏm đá.
- Rung đất (bấm, ngắm): ba đợt sóng đất toả ra, bụi theo vòng sóng, vết nứt ở tâm, máy quay rung.
- Hậu quả: núi đứng 40 (trụ đá), 60 (núi đá) ngày game rồi hạ (magic/earth/rise.js, lưu cùng trận, tua lùi theo); nhà dưới
  núi gần tâm thì sập, ở sườn thì nứt; rung đất làm nứt tối đa 5 nhà trong bán kính 9; người gần đó hoảng sợ bỏ chạy.
- Máy quay chính có thêm boost (lùi xa) và shake (rung) dùng chung (game/possess-cam.js); cầu lửa nổ gần cũng rung nhẹ.

## Hệ đất: sửa theo ý người chơi (thay bản trụ đá, núi đá, rung đất)
- Đất trồi (dưới chân): mảng đất quanh chân phồng lên thành gò bán kính 3,6, mặt trên bằng, cao 1,8; nhân vật lên theo (đo:
  4,8 → 6,6). Gò là chính mặt đất: dùng chung vật liệu đất của đảo (L.groundMat), màu từng đỉnh lấy đúng màu đất chỗ đó
  (L.tintAt); chỗ có lớp phủ (sân cát, đường) thì giữa gò mang màu lớp phủ, ra viền hoà vào đất.
- Máy quay: bỏ lùi xa ×6; máy quay vẫn bám tầm mắt nhân vật, chỉ nảy lên 0,45 đơn vị trong 0,9 giây rồi về (C.hop), rung nhẹ.
- Núi đất (ngắm): gò đất nhỏ hình ngọn núi (bán kính 4,5, cao 3,2, đỉnh hơi tròn), cùng chất đất như trên.
- Bỏ Rung đất.
- Người chơi chốt thêm: gò cao gần gấp 6 lần: Đất trồi cao 10,8 (chân rộng 8, mặt trên bằng bán kính 1,4, trồi trong 2,2 giây),
  Núi đất cao 19 (chân rộng 11, trồi trong 3 giây).

## Sửa sau hệ đất: đường tách khỏi đất nhô, chân không lút vào đường
- Lỗi 1: lớp đường, tường được phủ theo L.surfAt (có tính gò đất của phép); làng dựng lại lúc gò còn đứng thì đường bị nâng
  theo gò rồi kẹt trên không. Sửa: mọi thứ đặt cố định (lớp đường, tường, nhà, sân, bãi, đồ trang trí) theo đất gốc L.baseAt
  (render/map/height3d.js drapeOne, render/buildings3d.js, render/prosper3d.js). Đo: 86.485 đỉnh đường, tường lệch 0 khỏi đất gốc
  sau khi làng dựng lại lúc gò đang đứng.
- Lỗi 2: mặt đường cao hơn đất 0,155 (render/build/roads.js Y), người đứng trên đất nên bàn chân lút vào đường. Sửa: L.surfAt
  cộng mặt đường, vỉa hè (L.coverAt, render/build/roads.js surface theo bề rộng đường, vỉa hè của thời; mép dốc thoải 0,2).
  Đo: đứng giữa đường chân cao hơn đất 0,155 (đúng mặt đường); ra cỏ thì 0.

## Hệ nước (đã làm)
- Gọi mưa (ngắm): mây xám tụ trên chỗ ngắm, mưa rơi 7 giây, đất sẫm ướt, mưa xuống biển thì gợn nước. Hậu quả: nhà đang cháy
  trong bán kính 5,5 tắt lửa, đảo hết hạn hán, hết cháy rừng (magic/water/soak.js rain). Đo: nhà cháy tắt, hạn hán tan.
- Cột nước (ngắm): cột nước trong mờ có vệt chảy phun cao 8, đỉnh tung bọt, giọt văng, đổ sụp; trên biển thì gợn lớn. Hậu quả:
  lửa trong bán kính 4 tắt ngay, người gần đó bị hất ra, bỏ chạy.
- Đại hồng thuỷ (chỉ khi đứng cách mép đảo không quá 8: game/spellbook.js nearSea): magic/water/deluge/, mỗi pha một tệp:
  plan.js (nhịp: sóng lớn dần 3 giây, dâng 5 giây, đứng 1,5 giây, rơi 1,5 giây, sóng tràn 7 giây), vortex3d.js (lốc xoáy
  giữa bể), surge3d.js (sóng tung quanh mép sáu đảo), deluge.js (nối các pha). Đo: cả bể dâng 17,5 = 14 lần tầm mắt, rơi
  nhanh dần, dội thấp hơn mặt biển rồi về đúng mực cũ. Hậu quả thật lên cả sáu đảo (soak.js flood): nhà ven biển mất 0,3
  độ bền, trong đảo 0,08, lũ lụt 8 ngày (ít lương thực), lửa tắt, hết hạn hán, dân hoảng sợ, ghi biên niên.
- Sóng dâng dùng chung: sea3d.js setSwell(k). Tiếng nước trùng tên tiếng lửa (roar) bị bộ đăng ký tiếng chặn: đổi seaRoar.
- Thanh phép nhanh theo trang (ui/spellbook-ui.js): 11 phép đã mở không vừa 9 phím; thanh hiện phép của trang đang xem,
  biểu tượng các trang bên trái (bấm hay phím Q sang trang kế), phím 1–9 chọn trong trang.

## Dưới nước, lốc xoáy, chạy nhảy (người chơi chốt)
- Dưới nước là phần riêng: game/possess-swim.js (bơi của nhân vật nhập hồn: chỉ là số, test/possess-swim.test.js) và
  render/body/swim3d.js (tư thế bơi cho mọi người, người trong làng lơ lửng, bọt khí). Nước ngập chân quá 1,1 thì bơi:
  không trọng lực, không nhảy; thả phím thì nổi nhẹ tới cách đáy 1 rồi lơ lửng nhấp nhô; giữ Space bơi lên (tới khi mắt nhô
  khỏi mặt nước), giữ Shift lặn xuống; đi ngang 3,2 đơn vị mỗi giây. Tư thế: đi thì bơi sải (người gần nằm ngang, tay quạt
  luân phiên qua đầu, chân đập nước), đứng yên thì đạp nước (ngả tới, ngẩng đầu, tay quạt rộng, chân co đạp ếch). Người trong
  làng lơ lửng giữa nước (cách đáy 1,4), nhấp nhô; nước rút thì rơi dần xuống đất. Đo lúc Đại hồng thuỷ: nhân vật lơ lửng cách
  đáy 1,1 tới 1,3; 22/22 người trong làng lơ lửng; nước rút thì tất cả về đất. Mực nước: BK.seaLevel (sea3d.js).
- Lốc xoáy (magic/water/deluge/vortex3d.js): mặt biển trũng thành phễu xoáy có vệt bọt xoắn ốc (render/water/surface3d.js
  setWhirl, cùng trường dốc của nước), cột nước hai lớp (lõi đặc thắt giữa, vỏ bụi nước quay nhanh hơn), thân uốn lượn, gợn
  vòng xoắn chạy lên, sáng theo nắng; chân tung bụi nước xoáy, giọt văng xoắn ra; đỉnh nối vào mây giông xoáy.
- Chạy 5 → 7,5 đơn vị mỗi giây (game/possess.js RUN); nhảy lần 1 cao chừng 1 → 1,6 (game/possess-jump.js V1 7, V2 6,2).
  Dọn: vận tốc nhảy, trọng lực chỉ còn ghi ở game/possess-jump.js (bỏ JUMP_V, GRAV trùng ở game/possess.js).

## Máy quay rộng hơn, dáng bay đẹp hơn (người chơi chốt)
- Máy quay chính: lùi sau đầu 4,2 → 4,9, góc nhìn 52 → 58 (game/possess.js CAM).
- Dáng bay (render/body/motion3d.js, chỉ phần trên không): bật lên là dáng nhảy vọt (gối trái co cao, chân phải duỗi sau, tay
  cầm gậy vươn lên trước, tay kia vung sau, ưỡn ngực ngẩng đầu); ở đỉnh dang tay giữ thăng bằng, lắc nhẹ; rơi thì chân đạp
  như chạy trên không, tay giơ chao, duỗi chân đón đất; lộn ôm gối gọn hơn, cúi đầu; lượn kiểu siêu nhân (ngả người tới, tay
  dang như cánh vẫy nhẹ, chân duỗi sau, thân chao nghiêng theo nhịp). Ba pha trên chuyển mượt theo vận tốc đứng.

## Dáng cầm gậy, linh lực riêng của gậy (người chơi chốt)
- Hai tay hơi dạng ra, khuỷu hơi gập, cả lúc đứng lẫn lúc đi (render/body/motion3d.js ARM).
- Gậy phép đổi dáng theo tốc độ (render/magic/staff3d.js HOLD; f.staffK 0 chống .. 1 cầm chạy, trộn liền):
  - Đi, chạy, nhảy, bơi: cầm gần giữa thân gậy, gậy gần song song mặt đất, đầu gậy chĩa tới, hơi ngóc lên, chếch ra ngoài.
    Tay phải gập khuỷu, bàn tay ngang eo, đánh nhẹ theo bước (motion3d STAFF.CARRY).
  - Đứng: chống gậy thẳng đứng, chân gậy chạm đất (chỗ cầm trượt dọc thân gậy cho vừa tầm tay); tay phải đưa tới, ra ngoài,
    nắm gậy ngang hông (motion3d STAFF.PLANT).
  - Niệm phép: vẫn nghiêng đầu gậy về chỗ ngắm như cũ.
- Sức nặng riêng của gậy (người chơi chốt: "sức nặng riêng", không phải linh lực): gậy không xoay cứng theo tay, đầu gậy là
  khối nặng nối với bàn tay bằng lò xo xoay (render/magic/staff-weight.js W, có kiểm thử test/staff-weight.test.js):
  - tăng tốc thì đầu gậy trễ lại, phanh gấp thì văng tới trước rồi lắc về; rẽ thì quét theo sau một nhịp
  - mỗi bước chạy tay nhún, đầu gậy bập bênh theo; cầm ngang thì hơi trĩu xuống; chạy đều thì không trễ
  - đổi dáng (cầm chạy sang chống) đi qua cùng lò xo nên gậy quay xuống có đà; lúc chân gậy chạm đất: bụi nhỏ toả sát
    đất, vài hạt sỏi nảy (render/magic/recipes.js staffThud) và tiếng gõ gỗ trầm (render/fx/magic-audio.js thud).
- Hào quang của gậy (người chơi chốt: giữ, quán tính chỉ là thêm vào), màu theo hệ phép đang chọn
  (render/magic/staff-aura3d.js AURA): ngọc có quầng sáng thở (niệm phép bừng lên), ba đốm sáng bay vòng quanh ngọc; cầm chạy
  thì đầu gậy để vệt sáng; đứng chống thì đốm sáng bốc lên từ ngọc và dưới chân gậy hiện vòng phù chú của hệ nằm sát đất, xoay
  chậm; lúc vừa chống gậy xuống có vòng sóng sáng toả trên đất (cùng lúc với bụi, tiếng gỗ; staff3d báo một lần).

## Hố đen (đã làm; người chơi chốt qua ba lần sửa, có ảnh tham khảo)
Phép thứ hai của hệ linh hồn (magic/soul/spells.js blackHole). Toàn bộ ở magic/soul/blackhole/, mỗi phần một tệp:
- plan.js (nhịp, luật; kiểm thử test/blackhole.test.js):
  - Hố lớn dần trong 26 giây tới nửa bán kính đảo; hố lớn hơn vật nào (đường kính cả hố ≥ cỡ vật) thì hút được vật đó.
  - Tầm hút (khoảng cách ngang tới trục hố) lan dần tới 0,85 × bán kính đảo lúc 34 giây. Phát ở giữa đảo thì hút gần hết
    đảo; phát ở đầu đảo rồi chạy về cuối đảo thì không bị hút. Hố còn tới 40 giây.
- Màu ánh sáng (render/fx/post3d.js voidTint; blackhole.js đặt theo máy quay): ánh sáng không thoát được khỏi hố nên cả ảnh
  ngả dần sang vàng cam của đĩa bồi tụ. Mạnh dần theo cỡ hố và độ gần (trong tầm hút là hết cỡ, ra ngoài tầm 25 đơn vị thì
  hết), mạnh nhất khi quay lưng chạy khỏi hố; màu đổi từ từ.
  - Người chơi chốt (sau bản thử có thấu kính làm méo màn hình, vệt nhoè chảy về hố): hố, màn hình bị giật theo hố rất nhức
    mắt. Màn hình chính không có hiệu ứng động (không méo, không nhoè), chỉ đổi màu và cảnh vật xung quanh. Đã bỏ thấu kính,
    vệt nhoè.
  - Đĩa bồi tụ xoay theo máy quay thật chậm, có quán tính (hole3d.js TURN): máy quay nhún theo bước chạy thì đĩa không rung.
    Mép ngoài đĩa mờ hẳn trước khi kịp tối (không thành vành tối đục quanh hố).
- Đất giữ nguyên, từng vật thể bị hút (người chơi sửa: bản đầu bẻ cong cả đất thành phễu, không đạt):
  - pieces.js: tách các khối lưới gộp của đảo thành từng vật (hàn đỉnh, gom mảnh dính nhau; mảnh chồng lên nhau gộp thành
    một vật, tối đa 7 đơn vị: thân và tán là một cây, tường và mái là một nhà; vật quá to cắt ô 2,4 thành mảng gạch đường).
    Mỗi mảnh lại cắt ô 0,9 thành mảnh vụn. Khối lặp (cỏ, hoa, sỏi): mỗi bản một vật. Lần thử: khoảng 11.900 vật trong
    0,2–0,5 giây; mỗi giây tách thêm khối mới dựng. Không đụng: đất, vách, mặt dưới đảo, bờ, hồ; người; gậy phép; đáy bể.
  - warp3d.js (lực thuỷ triều, kéo thành sợi): vật không bay thẳng vào ngay. Trước hết cả vật bị kéo dài về phía hố, ép mỏng
    ngang; phần càng cao càng bị kéo nghiêng (thân cây uốn cong), lắc oằn oại; các mảnh tách hở dần (nứt); cả vật nhích lên
    (bật gốc). Rồi từng mảnh vụn rời ra (lệch giờ), lộn nhào, bay xoắn ốc về tâm; gần lõi bị kéo dài, mỏng đi, thu nhỏ vào lõi.
    Vật nhỏ (cỏ, đá) trước, cây, nhà sau. Shader tính cho cả bóng đổ; chỉ trên đảo bị hút.
- Bị cuốn vào trong hố (người chơi chốt qua hai lần: bản quay 3,5 vòng thì người kẹt ở ngoài miệng hố, máy quay quay quá
  nhiều vòng). Người, người nhập hồn (plan.js spiral), mảnh vụn (warp3d.js) đi cùng một kiểu đường:
  - Lơ lửng, nhấc lên ngang mặt đĩa bồi tụ.
  - Cuốn 1–2 vòng quanh hố (người 1,5 vòng; mảnh vụn 1–2 vòng), bán kính co dần về sát lõi, càng gần càng nhanh.
  - Thân 3D bị kéo dài theo hướng tâm (người dài ra gấp 5, mỏng ngang), quay đầu vào tâm, rồi chui hẳn vào trong lõi.
  - Người nhập hồn 7 giây. Máy quay bám theo người tới gần hết đường (85–98%) thì bị kéo vào trong lõi (game/possess.js
    setCamPull); lõi vẽ cả mặt trong. Từ 82% đường màn hình tối dần thành một màu đen (inside.js).
- hole3d.js (theo ảnh tham khảo): lõi đen, vòng photon, đĩa bồi tụ trắng vàng → cam → đỏ thẫm xoáy ngả về máy quay, hai tia.
- pull.js: người trong tầm hút bị cuốn lên xoắn ốc vào tâm, lộn nhào, kéo dài người. Dân cả đảo hoảng sợ.
- Người nhập hồn: sau khi phát phép vẫn chạy tự do quan sát. Vào tầm hút thì bị giữ (không đi, không nhảy được, chỉ xoay
  chuột nhìn: game/possess.js setHeld), lơ lửng 2 giây, rồi bị hút 5 giây vào lõi.
- inside.js: vào trong hố thì màn hình tối hẳn, ghi "Đã bị hút vào hố đen", linh hồn rời thân. Phần "bên trong hố đen" chờ
  phát triển tiếp, làm ở tệp này.
- Bản thử: sau 40 giây hố tan dần trong 4 giây, trả lại đảo và người, để thử lại được.
