# Bước 23 · Sinh vật đáy bể sống trong ba phế tích, ba đường hầm

Yêu cầu: đưa NPC biến dị và quái vật biển (đề xuất: design/de-xuat-sinh-vat-day-be.md, trang xem thử
design/sinh-vat-day-be.html) vào đáy bể, mỗi loài một nếp sống, cùng một cảnh báo kẻ địch.

## 1. Sửa hình (render/deep/beings3d.js, dùng chung cho game và trang xem thử)

- Người Vây: hai tay buông xuống hai bên sườn, không còn bắt chéo. Đuôi là đuôi cá thật: 8 đoạn thuôn liền nhau, sọc vảy tối,
  vây lưng, vây bụng, vây đuôi hình lưỡi liềm.
- Người Ốc: thêm kiểu bơi. Người ngả ra trước, vỏ ốc nằm ngang trên lưng.
- Người Rêu Đá, Người San Hô: thêm kiểu nằm co ngụy trang (đầu gục, gối co, tay ôm). Ở xa trông như một tảng đá, một cụm san
  hô.
- Người Rêu Đá: tay dài hơn, bàn tay đá to có 4 ngón móc. Khi chiến, hai tay vươn ra trước rồi chộp, các ngón nắm lại.
- Trang xem thử dùng chung tệp này (không còn bản riêng), thêm hai nút kiểu chuyển động: "Bơi", "Nằm co".

## 2. Chỗ ở và nếp sống (render/deep/denizens3d.js)

| Nơi | NPC biến dị | Quái vật |
|---|---|---|
| Thành Vỏ Ốc Xà Cừ | 10 Người Ốc, 2 Người Rêu Đá | bầy 4 Rồng Lươn Đen, 1 Bạch Tuộc Mắt Vực |
| Vườn Treo Bậc Thang | 10 Người Vây, 1 Người Rêu Đá | bầy 4 Rồng Lươn Đen, đàn 3 Cá Mập Xương |
| Đô Thị Đá Khổng Lồ | 6 Người Rêu Đá, 9 Người San Hô | đàn 3 Cá Mập Xương, 1 Bạch Tuộc Mắt Vực |
| Ba đường hầm | mỗi hầm 1 Người Canh Hầm | không |

- Người Ốc ở trong nhà vỏ ốc nhỏ của Thành Vỏ Ốc (citadel3d.js ghi chỗ các nhà vào `S.homes`). Thỉnh thoảng ra cửa nhà rồi:
  - đi bộ 2–4 chặng quanh nhà (6 trên 10 lần);
  - hoặc bơi một vòng khắp phế tích, cao hơn đáy 6–24 (4 trên 10 lần).
  Sau đó về nhà, ở trong 10–45 giây.
- Người Vây ở trong các vòm cuốn mặt trước bốn tầng vườn. Thỉnh thoảng ra khỏi vòm:
  - bơi thẳng ra trước tầng vườn;
  - bơi 3–5 chặng trong phế tích (qua khối tầng vườn thì bơi cao trên 48);
  - quay về đúng vòm của mình.
- Người Canh Hầm đi qua lại trong lòng hầm, mỗi lần một quãng (tối đa một phần năm lòng hầm). Thỉnh thoảng ra sát cửa gần
  hơn, quay mặt ra ngoài, đứng nhìn 3–7 giây. Không bơi.
- Người Rêu Đá, Người San Hô phần lớn thời gian nằm co (15–55 giây). Rồi đứng dậy (1,2 giây), đi 1–3 chặng, nằm co lại ở
  chỗ mới. Không bơi.
- Quái vật theo bầy:
  - con đầu đàn bơi tới các điểm ngẫu nhiên trong phế tích;
  - các con khác giữ chỗ phía sau, hai bên con đầu đàn, lượn lệch pha.
- Quái vật to gấp 3–4 lần NPC (dài khoảng 8–9) và bơi sát đáy: lươn, cá mập cao hơn mặt đất 1,5–9 (và cao hơn mái nhà bên
  dưới 3); Bạch Tuộc Mắt Vực đi một mình, bò sát mặt đất (cao hơn đất tối đa 6).

## 3. Cảnh báo kẻ địch

- Kẻ địch là:
  - máy quay khi ở dưới mặt nước (người chơi);
  - mọi vật trong `deep3d.threats` (mỗi vật có `position`), để dành cho tàu ngầm sau này.
- Sinh vật thấy kẻ địch trong tầm thì chuyển sang chiến. Tầm thấy:
  - NPC biết bơi và Người Canh Hầm 26;
  - Người Rêu Đá 34;
  - quái vật 40.
- Khi chiến, sinh vật dồn tốc lực lao tới, dừng cách con mồi một tầm cắn và cắn xé (cử động chiến của từng loài). Nó báo cho
  đồng loại trong vòng 26: những con ấy cũng lao vào.
- Tốc độ (đơn vị trên giây), xếp theo thứ tự đi / bơi / chiến (dấu "–" là loài không có kiểu đó):

  | Loài | Đi | Bơi | Chiến |
  |---|---|---|---|
  | Người Ốc | 1,3 | 2,6 | 9 |
  | Người Vây | – | 4,5 | 15 |
  | Người Canh Hầm | 2,2 | – | 9 |
  | Người Rêu Đá | 1,7 | – | 14 |
  | Người San Hô | 1,2 | – | 11 |
  | Rồng Lươn Đen | – | 4,5 | 20 |
  | Cá Mập Xương | – | 5 | 22 |
  | Bạch Tuộc Mắt Vực | – | 2,2 | 10 |

  Người Rêu Đá, Người San Hô không bơi nhưng chạy nhanh. Người Ốc đang chiến mà con mồi ở cao thì bơi lên.
- Giới hạn chỗ (sinh vật không ra khỏi phế tích, không lên mặt nước):
  - mỗi sinh vật chỉ ở trong elip của phế tích mình (0,9 với NPC, 0,92 với quái vật);
  - NPC biết bơi không lên cao quá đáy rãnh + 55, quái vật quá đáy rãnh + 30;
  - Người Canh Hầm chỉ ở trong lòng hầm của mình.
- Kẻ địch ra khỏi phế tích (hay lên cao hơn trần + 25) thì sinh vật dừng ở mép. Kẻ địch xa hơn 1,8 lần tầm thấy quá 3 giây
  thì sinh vật thôi chiến và về chỗ: Người Ốc, Người Vây về nhà; người đá nằm co lại.
- Số chỉnh nằm ở đầu tệp (`RULES`).

- Chỗ trống: mỗi khối đá đặt bằng `frame(S).add` (render/deep/kit3d.js) được ghi hộp bao theo (u, v) vào `S.solid`,
  nếu khối đó chạm đất và cao hơn 1,2. Có 570 khối ở Thành Vỏ Ốc, 188 ở Vườn Treo, 214 ở Đô Thị Đá.
  - Sinh vật trên đất chỉ chọn chỗ cách mọi khối ít nhất 1 (người đá 3,5) và đường đi thẳng không cắt khối nào. Thành Vỏ Ốc
    hỏi thêm `S.free` của citadel3d.js.
  - Điểm bơi luôn cao hơn mái khối đá bên dưới ít nhất 5.

## 4. Hiệu năng

- Các bộ phận đứng yên của mỗi sinh vật được gộp lưới theo khớp và vật liệu (`bake`). Sinh vật trong game không có đèn riêng.
- Chỉ chạy và vẽ khi máy quay ở dưới nước. Phế tích xa máy quay hơn 260 thì không chạy.
- Sinh vật luôn cử động, kể cả khi máy bật "giảm chuyển động" (Windows: tắt hiệu ứng hoạt hình). Trước đây game coi sinh vật
  là đồ trang trí nên dừng hết trong chế độ đó: người chơi thấy quái vật, NPC đứng đơ.
- Người Ốc, Người Vây đang ở trong nhà thì không vẽ.

## 5. Số đo

- 57 sinh vật. Chạy nhanh 120 giây ở mỗi phế tích (máy quay ở xa): không có toạ độ hỏng, không con nào ra ngoài elip 0,93,
  không con nào lên cao quá trần. Người Ốc, Người Vây có ra vào nhà và có bơi, người đá có đứng dậy đi, Người Canh Hầm có ra
  cửa nhìn.
- Máy quay đặt giữa mỗi phế tích:
  - sinh vật chuyển sang chiến ngay;
  - Người Ốc, Người Vây tới sát máy quay (0,4–0,7) trong 8 giây;
  - đàn cá mập ở Đô Thị Đá tới cách 4,4.
- Máy quay lên cao trên mặt nước: mọi sinh vật thôi chiến. Không con nào lên cao quá trần.
- 93 bài kiểm thử đạt.

## 6. Còn thiếu

- Lúc bình thường sinh vật trên đất chỉ chọn chỗ đứng, chỗ nằm, đường đi thẳng không cắt khối đá nào. Khi chiến chúng lao
  thẳng vào con mồi, nên có thể xuyên qua công trình (chưa tìm đường vòng).
- Chưa có tàu ngầm, chưa có máu người chơi: "cắn xé, phá tàu" mới là cử động. Tàu ngầm sau này chỉ cần thêm `{ position }`
  vào `deep3d.threats` và đọc `denizens.info.attacks`.
- Chưa đo trên điện thoại thật.
