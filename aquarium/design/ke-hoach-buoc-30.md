# Bước 30 · Sửa đường 6 đảo, sửa người đi xuyên công trình

## 1. Đường của 6 đảo (render/build/roads.js)

| Mục đo | Trước khi sửa | Sau khi sửa |
|---|---|---|
| Đường chạy chồng lên nhau | 2 chỗ (Đá Mây) | 0 |
| Đầu đường cụt giữa đồng | 12 đầu, trên cả 6 đảo | 0 |
| Đầu đường thò vào trong đường vòng | 2 (Tuyết Trắng) | 0 |
| Đường chạm hay sát hồ | 0 | 0 |

- Đá Mây:
  - đường trước trước đây gãy khúc chữ chi, chạy đè dọc lên đường vòng và cung đường đèo;
  - nay lượn mềm, chỉ cắt ngang các đường khác.
- Cung đường nhánh (ARCS):
  - góc đầu, góc cuối đặt đúng vào một đường toả;
  - đầu nào không chạm đường nào thì net() nối thẳng vào điểm gần nhất của đường vòng (joinEnd).
- Tuyết Trắng: hai lối sau bắt đầu ngay trên đường vòng.
- Không có đường qua hồ: hồ được đặt tránh đường (bước 28). Bỏ chú thích cũ "đường đi qua sông như cầu phẳng".

## 2. Người đi xuyên công trình

Đo bằng hai cách:
- tools/check-walk.js: cho người đi thật qua cả chuỗi 12 thời, đếm lượt có mặt công trình cắt ngang người;
- đo tĩnh: quét quanh từng công trình, đếm ô có hình ở tầm người (0,45–1,4) mà khung tránh (places().solids) không che.

| Phép đo | Trước khi sửa | Sau khi sửa |
|---|---|---|
| Người đi xuyên (check-walk, 12 thời) | 55 lượt | 7 lượt |
| Ô hở (đo tĩnh, 6 đảo × 12 thời) | 648 | 89 |

Nguyên nhân và cách sửa:
- Khung tránh (render/buildings3d.js P.box) chỉ đo theo đỉnh, nên sót chân chống xiên và mái dốc cắt ngang tầm người
  (chân nhà chính, kỳ quan). Nay đo theo từng cạnh tam giác, cắt vào dải cao −0,3..2,2.
- Phần phát sáng (glow) không được tính vào khung:
  - tháp canh thời 9 làm toàn bằng phần này nên khung bằng 0;
  - ray mỏ phát sáng vươn ra ngoài khung.
  Nay tính cả phần này; chỉ bỏ ô cửa sáng (lit).
- Bể bơi, bệ thấp (cao dưới 0,6) bị bỏ khỏi danh sách tránh, nhưng đặt trên dốc thì thành vẫn cao ngang hông người.
  Nay tính từ 0,3.
- Người lấn vào mép khung chỉ lùi dần (render/nav3d.js pushOut), nên đi chéo cắt được qua góc nhà.
  Nay lấn nông (dưới 0,9) thì ra hẳn ngay; ở sâu trong khung (công trình vừa mọc lên chỗ đang đứng) thì bước ra nhanh gấp ba.
- Người đi tới sát chân tường thành (keepInside):
  - giới hạn nay tính theo chỗ mép hẹp nhất quanh hướng đó, như chỗ đặt tường;
  - WALL_IN 5,2 → 5,8, chừa đủ bề dày hàng rào bụi thời 9.
- Đã thử đo khung theo mặt đất dưới từng điểm (công trình trên dốc) nhưng đã hoàn lại. Sau khi dựng hình, nền dưới công
  trình còn được san phẳng (settle), nên đo lúc dựng là sai và số ô hở tăng từ 121 lên 201.

## 3. Còn lại

- 7 lượt đi xuyên:
  - cánh cửa nhà mở (home · d0) khi người vào nhà: 2;
  - lớp đường: 2;
  - ruộng, đài phun nước, khối gộp: mỗi loại 1.
- Nhà nấm thời 6 ở Thông Xanh: mũ nấm phía dốc xuống thấp ngang ngực người (20 ô).
- Lớp đường thời 9: vài vật trang trí ven đường chưa có khung tránh.
