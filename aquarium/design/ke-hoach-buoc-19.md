# Bước 19 · Đáy bể sâu thêm, phế tích nhiều kiến trúc hơn, ba đường hầm xuyên núi

Yêu cầu: (1) đáy bể sâu thêm một chút; (2) ba công trình dưới đáy hấp dẫn hơn, rộng hơn, nhiều kiến trúc đẹp và chi tiết hơn;
(3) ba đường hầm xuyên qua ba ngọn núi nối ba công trình, cửa hầm ở chân núi, trước cửa hầm có cánh cửa.

## 1. Độ sâu

- sea3d.js: thân nước sâu 160 (trước 130). Núi, rãnh, phế tích dựng theo đáy kính nên cao thêm theo.

## 2. Rãnh rộng hơn, phế tích thêm kiến trúc (render/deep3d.js)

- Rãnh: dài 192 theo bán kính, rộng 136 (trước 190 × 120). Vườn Treo: tầng đáy 128 × 80 (trước 122 × 76).
- Thành Vòng Nước: khoảng 70 nhà dân và đền nhỏ giữa các vòng tường (mái bằng có lan can, mái vòm đồng, mái chóp; vài nhà sập,
  vài cửa sổ còn ánh); cổng tháp ở chỗ đường từ cửa hầm cắt qua ba vòng tường; nhà hát lộ thiên năm bậc ghế có sân khấu; tượng
  thần biển cầm đinh ba đứng ở bến ngoài (cao khoảng 32); hai hải đăng đỉnh còn sáng; cột vuông đầu đồng dọc đường đắp; bậc lên
  gò giữa; rong chân tường.
- Vườn Treo Bậc Thang: tháp tròn bốn góc mỗi tầng (24 tháp, mái vòm men lam hay vàng); cây cọ trên mặt tầng, tàu lá đung đưa;
  hai cung điện dài hai bên vườn (dãy vòm, lan can răng cưa, ba mái vòm men lam đỉnh vàng); cầu dẫn nước có máng ánh lam lên tầng
  ba; hai sư tử đá canh đại lộ; đình nghỉ tròn trong vườn.
- Đô Thị Đá Khổng Lồ: cổng trời hai cột một đà ở đầu đại lộ, vòng khắc sáng; hai kim tự tháp nhỏ ba bậc hai bên; người khổng lồ
  nằm ngửa nửa vùi trong cát, vòng cổ khắc sáng; khoảng 40 nhà đá tổ ong; bãi bia khắc chữ sáng hai bên vòng cột; tháp đá chồng
  thăng bằng đỉnh sáng.

## 3. Ba đường hầm xuyên núi

- Mỗi phế tích có hai cửa hầm ở chân vách rãnh hai bên (đúng chân núi trụ). Cửa bên phải phế tích này thông qua núi trụ sang cửa
  bên trái phế tích kế tiếp:
  | Hầm | Xuyên núi dưới | Nối |
  |---|---|---|
  | 1 | Đá Mây | Thành Vòng Nước ↔ Vườn Treo Bậc Thang |
  | 2 | Cửa Sóng | Vườn Treo Bậc Thang ↔ Đô Thị Đá Khổng Lồ |
  | 3 | Lúa Vàng | Đô Thị Đá Khổng Lồ ↔ Thành Vòng Nước |
- Cửa hầm: mặt đá lớn (32 × 32) lấn vào chân núi, lòng hầm tối hình vòm, khung hai cột có đèn, đà ngang, bảng khắc sáng, vòm
  viền sáng; hai cánh cửa (một cánh hé mở vào trong hầm, một cánh gần khép) có nẹp sáng; ba bậc đá; hai lò đèn. Kiểu cửa theo phế
  tích bên đó (đá trắng viền đồng; gạch, khung men lam viền vàng; đá xám khắc chữ lam). Nền trước cửa phẳng, rong không mọc chắn
  cửa.
- Đường lát đá có cột đèn chạy từ mỗi cửa hầm vào phế tích; tường, cột đá chừa lối cho đường đi qua.
- Lòng hầm trong núi không nhìn thấy (núi đặc); hầm thể hiện bằng hai cửa hai đầu và đường dẫn.

## 4. Lặn xem

- Nút "Đáy bể" đi lần lượt sáu điểm: Thành Vòng Nước, hầm dưới Đá Mây, Vườn Treo Bậc Thang, hầm dưới Cửa Sóng, Đô Thị Đá Khổng
  Lồ, hầm dưới Lúa Vàng. Ở cửa hầm máy quay đứng trên đường lát đá, cách cửa 32.

## 5. Số đo

- Đáy bể khoảng 150 nghìn tam giác (trước 120 nghìn), vẫn 4 lần vẽ. Máy thử (vẽ phần mềm, dao động giữa các lần chạy): 59 ms một
  khung so với 53,5 ms khi ẩn đáy bể.
- 88 bài kiểm thử đạt; lặn đủ sáu điểm, không lỗi trang. Chưa đo trên điện thoại thật.
