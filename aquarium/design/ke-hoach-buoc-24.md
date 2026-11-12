# Bước 24 · Người Cá Đá trong kim tự tháp, Người Đuối Cát, bỏ Người Rêu Đá và Người San Hô

Người chơi chốt ba loài sau khi xem đề xuất (design/ke-hoach-buoc-23.md mục 7):
- giữ Người Canh Hầm đã sửa;
- nhận Người Cá Đá và Người Đuối Cát;
- bỏ Người Chình Rạn.

Người Rêu Đá, Người San Hô không còn trong game và trang xem thử. Hàm dựng của ba loài bị bỏ đã xoá khỏi
render/deep/beings3d.js, cùng hai hàm phụ chỉ chúng dùng: dáng nằm co (`curlPose`) và nhánh san hô (`branch`).

## 1. Cửa kim tự tháp Đô Thị Đá (render/deep/ruins3d.js)

- 12 cửa ở giữa bốn mặt của ba bậc dưới. Mỗi cửa có ô cửa tối sâu, hai trụ đá, mi cửa, vạch sáng trên mi.
- Cỡ cửa (rộng × cao) theo bậc: 3,4 × 4,6; 2,8 × 3,8; 2,6 × 3,4.
- Vạch chữ sáng trên mặt trước của ba bậc dưới chia đôi, chừa chỗ cửa.
- Lối đi quanh tháp có ba vòng:
  - vòng chân tháp;
  - gờ trên bậc 1 (cao 7);
  - gờ trên bậc 2 (cao 14).
- Tệp ghi `S.pyramid` = { tâm, cao độ chân tháp, các vòng lối đi, các cửa }. Mỗi cửa có ba điểm: trước cửa, trên lối đi, trong tháp.

## 2. Người Cá Đá (render/deep/denizens3d.js)

- 20 người, nhà là 12 cửa. Ở trong tháp thì không vẽ.
- Lúc bình thường: sau 25–75 giây trong tháp thì ra cửa, đi dọc lối đi cùng tầng qua 1–3 góc, vào cửa ở mặt tới.
  Đây là cửa nhà mới của người đó.
- Đội quân tập hợp khi kẻ địch (máy quay dưới nước, tàu ngầm sau này) vào trong vòng 70 quanh đỉnh tháp. Đỉnh tính ở độ
  cao 14 trên chân tháp, như các góc nhìn người chơi gửi. Kẻ địch phải ở trong phế tích, dưới trần (đáy rãnh + 60) + 25.
  Đội quân đi qua ba pha:
  1. Tập hợp:
     - cả 20 người ra từ cửa nhà, lần lượt mỗi đợt 5 người cách 0,25 giây (ai đang ở ngoài thì tới thẳng);
     - họ xếp một hàng ngang trước mặt tháp quay về phía kẻ địch, cách chân tháp 8, mỗi người cách nhau 2,4;
     - chỗ trong hàng xếp theo vị trí cửa để ít cắt chéo nhau.
  2. Lao lên: khi 16 người đã vào hàng (hay quá 6 giây), cả hàng bơi tới kẻ địch, giữa hàng đi trước. Tới gần thì hàng khép
     lại, cả đội cắn xé.
  3. Về tháp: kẻ địch ra ngoài 1,4 lần vòng tập hợp quá 2,5 giây thì từng người bơi về cửa nhà, vào trong.
- Tốc độ: đi 1,2, bơi 3, lao lên 7,5 (giữa hàng tiến 0,9 lần tốc độ đó).
- Số chỉnh: `RULES.army` ở đầu tệp.

## 3. Người Đuối Cát

- Có 5 bầy, mỗi bầy 6 con:
  - Thành Vỏ Ốc 2 bầy;
  - Vườn Treo 1 bầy;
  - Đô Thị Đá 2 bầy.
- Mỗi bầy nằm sát nhau trên đất trống, cách nhau ít nhất 3,4, cùng hướng (lệch nhau một chút).
- Chỉ nằm yên (kiểu 'rest'): mép cánh gợn nhẹ, mắt đảo. Không cảnh báo, không tấn công.

## 4. Số đo

- Đếm: 10 Người Ốc, 10 Người Vây, 20 Người Cá Đá, 12 Người Canh Hầm, 30 Người Đuối Cát, quái vật như cũ.
- 150 giây sống bình thường: khoảng một nửa thời gian Người Cá Đá ở ngoài; trong lúc ở ngoài, 63% thời gian đi trên gờ bậc,
  còn lại đi vòng chân tháp.
- Kẻ địch ở chéo phía trên tháp, cách đỉnh 38,5:
  - sau khoảng 1 giây cả 20 người đã ra khỏi tháp;
  - 7 giây sau bắt đầu lao lên;
  - 13 giây sau cả 20 người ở trong vòng 5 quanh kẻ địch;
  - không ai lên cao quá 30 trên đáy rãnh.
- Kẻ địch đi xa: sau khoảng 25 giây cả 20 người đã về tháp.
- Máy quay ở điểm lặn Đô Thị Đá (cách đỉnh tháp 84): không tập hợp.
- 93 bài kiểm thử đạt, không lỗi trang.

## 5. Còn thiếu

- Người Cá Đá lao lên theo đường thẳng, có thể xuyên qua cột đá vòng quanh tháp.
- Khi người chơi đứng sát tháp, hàng tập hợp vẫn đặt cách chân tháp 8. Nếu người chơi đứng trên đỉnh tháp thì hàng lao thẳng
  lên.
