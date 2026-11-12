# Bước 16 · Sáu đảo cao trên mặt biển

Yêu cầu: nâng cao độ cả sáu đảo lên cao hơn mặt biển; ở cổng phụ và vài chỗ cho thoải xuống gần mặt biển, còn lại đảo cao hẳn
lên, cho cảm giác sáu hòn đảo thật chứ không phải mặt phẳng.

- render/map/height3d.js: cả mặt đảo nâng lên LIFT so với mép đảo (mép ngang mặt biển): Lúa Vàng 3,4 · Thông Xanh 3,8 · Đá Mây 4,6 ·
  Tuyết Trắng 3,6 · Cửa Sóng 2,6 · Cát Hồng 3,2 (cộng thêm đồi, núi, gò của từng đảo như trước). Quanh mép là vách dốc rộng 1,8
  (tô màu đá theo độ dốc).
- Chỗ thoải xuống biển (dốc dài 16): cổng chính phía trước, hai đầu bến cầu (cổng phụ hai bên), và bãi biển riêng của từng đảo
  (BEACH: Cửa Sóng có hai bãi). Cầu tàu khoét một lối thoải xuống mặt nước.
- Sông, hồ, ao, đầm nâng lên cùng mặt đảo; đất dưới nước khoét xuống dưới mặt nước như trước.
- Mọi thứ đứng trên đất vẫn theo cao độ thật (người, xe, quân, đạn, bóng, công trình). Thêm: tên lửa nổ trên mặt đất, thanh máu
  của cổng, nhà chính, hai đội đặt theo cao độ đất.

Kiểm chứng: 15 tệp kiểm thử đạt; 0 công trình thò ra ngoài đảo; tools/bug-hunt.js thời 6 (trận qua cầu và dân): không ai lơ lửng,
không ai đi trên mặt nước, quân không vào thành trước khi cổng đổ, không lỗi trang; tools/check-walk.js thời 3 và 11: 4 lượt đi
xuyên (đều là xe trên đường làng lướt qua người), người đứng đầu 0.
