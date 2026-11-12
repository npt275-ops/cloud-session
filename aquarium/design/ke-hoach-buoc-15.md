# Bước 15 · Xe có chuyến đi rõ ràng, thêm đường nhánh, bỏ tàu hoả

Yêu cầu: (1) phương tiện dưới đất qua từng thời (xe trâu, người cưỡi ngựa, xe ngựa, ô tô...) có thêm hướng đường đi khác trên bản
đồ, có điểm đi, điểm đến, điểm dừng rõ ràng; dừng xe thì người lái xuống xe đi vào nhà, xe để ngoài cửa hay cạnh chỗ ở. (2) Bỏ tàu
hoả chạy vòng quanh đảo trên cả sáu đảo, thay bằng phương tiện khác.

## 1. Đường nhánh mới (render/build/roads.js ARCS)

Mỗi đảo thêm cung đường vòng ngoài nối các đường toả, mỗi đảo một dáng: Lúa Vàng đường đê vòng ngoài phía trước; Thông Xanh lối vòng
sau núi và lối trước bìa rừng; Đá Mây đường đèo lượn theo sườn; Tuyết Trắng hai lối vòng hai bên sau; Cửa Sóng đường ven biển; Cát
Hồng hai góc vuông của ô phố ngoài. Cung cắt bớt chỗ gần mép đảo. Cung là một phần của mạng đường như đường toả (vẽ mặt đường, đèn,
công trình tránh), nối vào đường khác ở chỗ gặp nhau (cho xe: traffic3d.js graphOf; cho người đi bộ: nav3d.js).

## 2. Chuyến xe (render/build/traffic3d.js tripStep)

- Chỗ đỗ (render/buildings3d.js places().stops): trước mặt tiền nhà ở, chợ, nhà chính, kho, trường, xưởng, đền; sát góc mặt tiền,
  song song mặt nhà; không nằm trong công trình khác, hồ, đầm; từ đường gần nhất chạy thẳng vào được không cắt qua nhà nào.
- Mỗi xe dưới đất có một nhà. Một chuyến: đường ngắn nhất trên mạng đường (vòng trong, đường toả, cung ngoài) tới điểm đường gần chỗ
  đỗ → rẽ vào chạy chậm tới chỗ đỗ → người lái xuống xe, đi bộ vào cửa, khuất vào trong → ở trong 8–22 giây game → ra, lên xe →
  lùi ra đường → chuyến tiếp (từ nhà đi một chỗ khác, rồi về nhà). Trên đường vẫn đi làn phải, dừng khi có người hay xe phía trước.
- Người lái là phần riêng của mỗi xe (render/build/vehicles.js DRIVER): ngồi trên xe trâu, ngựa, xe ngựa, xe đạp, ô tô hơi nước;
  ở trong ô tô, xe buýt, rô-bốt (không thấy) và hiện ra khi xuống xe. Ngựa đứng buộc cạnh nhà khi người cưỡi vào trong.

## 3. Bỏ tàu hoả

- Thời 5: bỏ đường ray, tàu hơi nước kéo toa chạy vòng đảo; thay bằng ô tô hơi nước (ba chiếc) và xe đạp (hai chiếc).
- Thời 7: bỏ tàu một ray trên cao (cột đỡ, dầm vòng, toa); thay bằng hai xe buýt điện.
- Còn giữ: ga tàu của Lúa Vàng thời 5 (render/build/plains/e05.js) là công trình đứng yên có đầu máy trưng bày, không chạy.

## 4. Kiểm chứng

15 tệp kiểm thử đạt; tools/check-footing.js: 0 công trình thò ra ngoài đảo; tools/check-scene.js chỗ: 0 chỗ chồng; tools/bug-hunt.js
dân thời 6: không xe nào đứng yên quá 25 giây, kẹt thật 7. Ảnh chạy thật: xe ngựa đỗ cạnh nhà, người cưỡi vào trong; ô tô hơi nước
đỗ cạnh nhà, người lái đi bộ vào cửa.

Hạn chế: chưa có lối rẽ (mặt đường) từ đường vào chỗ đỗ, xe chạy qua cỏ vài bước; người lái là người trang trí, không phải người dân
trong logic; xe chưa tránh người khi đang rẽ vào hay lùi ra chỗ đỗ.
