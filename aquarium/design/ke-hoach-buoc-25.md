# Bước 25 · Sông trên đảo chảy liền, cầu qua sông; Người Đuối Cát vùi trong cát

## 1. Lỗi sông bị khối đất chắn ngang (render/map)

Người chơi thấy trên hầu hết các đảo có sông: nước biến mất dưới một khối đất cỏ (hay cát) rồi hiện lại. Đo cao độ đất dọc
từng con sông (11 con trên 6 đảo) thì thấy ba nguyên nhân:

1. Chỗ sông cắt đường của đảo, đất dưới đường được giữ nguyên độ cao ("đường qua sông như đập đất", height3d.js carve). Lối
   đường đã dành sẵn từ thời 1, kể cả khi chưa vẽ đường, nên thành khối đất chắn ngang sông.
2. Sông chính của Lúa Vàng, Thông Xanh (terrain3d.js) không được ghi vào chỗ cấm (L.props). Sông phụ (relief3d.js) chỉ
   cấm đúng lòng nước, không cấm dải bờ. Công trình được đặt đè lên sông, nền công trình (height3d.js rebuild) nâng đất
   lấp lòng sông. Có cái nền bán kính 10,5 ở Tuyết Trắng.
3. Sông hẹp chảy qua sườn đồi: lưới đất thưa hơn bề rộng sông, bờ dốc lên ngay sát mép nước nên lấp từng quãng.

Cách sửa (mỗi chỗ ở đúng tệp của nó):
- height3d.js carve:
  - lòng sông khoét ở mọi chỗ, cả dưới đường;
  - trong 0,8 sát mép nước, đất vẫn thấp hơn mặt nước.
- height3d.js rebuild: nền công trình không nâng đất ở chỗ đã khoét nước (sông, hồ). Mép công trình sát sông thì chìa ra.
- terrain3d.js, relief3d.js: mọi sông ghi cả dải bờ vào L.props, nên cây và công trình tránh. terrain3d ghi thêm
  `L.riverBank` (bề rộng dải bờ sông chính).
- relief3d.js riverBridges: bắc cầu ở mỗi chỗ sông cắt đường của đảo.
  - Cầu dài qua cả lòng sông và bờ khoét (tối đa 13), rộng 3,4.
  - Mặt cầu dốc đều giữa hai đầu gác lên đất, không thấp hơn mặt nước 0,45.
  - Có dầm dọc, cột chân xuống lòng sông và lan can hai bên.
  - Lúa Vàng, Thông Xanh, Cửa Sóng làm bằng ván gỗ; Đá Mây, Tuyết Trắng, Cát Hồng làm bằng phiến đá.
- height3d.js L.surfAt: trên cầu thì chỗ đứng là mặt cầu, nên mặt đường, người, xe đi trên cầu, không lội lòng sông.

Số đo: lấy mẫu dọc tâm 11 con sông, ở thời 1 và thời 9. Không còn điểm nào đất cao hơn mặt nước, trừ đúng chỗ có cầu.

## 2. Người Đuối Cát vùi trong cát (render/deep)

- Chỉ chọn chỗ cát:
  - đất phẳng, độ dốc dưới 0,25;
  - không khối đá (S.solid), không đường của Thành Vỏ Ốc (S.free);
  - không đá lát, bậc, gạch vụn (S.paved: khối thấp dưới 1,2, kit3d.js ghi mới).
- Nằm vùi (kiểu 'curl'): thân rạp sát cát, 16 gò cát phủ quanh mép cánh và trên lưng, chỉ lộ mắt, chóp đầu, một khúc đuôi.
- Màu thân và gò cát lấy đúng màu cát của đáy ở chỗ nằm (terrain3d.js SAND_HEX, ngả xanh theo độ sâu: depthTint).
- Cánh vòng cung như cá đuối:
  - mép trước cong ra từ đầu tới chóp cánh tròn, mép sau cong về gốc đuôi;
  - mỗi cánh 5 dải mỏng dần ra chóp (cánh vỗ thành sóng);
  - gân xương ngón dọc sải.

## 3. Còn thiếu

- Cầu đặt ở mọi chỗ sông cắt lối đường dành sẵn, kể cả thời chưa vẽ đường: lúc đó là cầu đứng riêng.
- Chỗ đường chạy gần song song với sông, cầu dài và phủ một đoạn sông theo chiều dọc.
