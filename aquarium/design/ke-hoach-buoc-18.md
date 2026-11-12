# Bước 18 · Đáy bể sâu: núi chìm, rãnh sâu, ba phế tích cổ

Yêu cầu: đáy bể kính sâu hơn; dưới đáy là một vùng đất liền cao thấp rõ ràng, những ngọn núi cao hơn nhiều so với đảo bên
trên nhưng chìm dưới nước; giữa các núi là rãnh sâu như rãnh đại dương, trong đó ít nhất ba công trình cổ (nền văn minh trước
thời đồ đá, kiểu thành chìm, vườn treo) lớn hơn bề rộng một đảo khá nhiều, nằm sát đáy bể.

## 1. Bể sâu hơn (sea3d.js)

- Thân nước sâu 130 (trước 34): vách kính, vách nước, vòng đồng chân bể hạ theo. Bỏ tấm đáy phẳng cũ (đáy giờ là đất).
- Mặt nước vẽ hai mặt (lặn xuống nhìn lên vẫn thấy mặt nước). Khi máy quay ở dưới nước, vách nước gần như đục (setUnder).

## 2. Địa hình đáy (render/deep3d.js)

- Lưới cực 100 vòng × 256 múi phủ kín đáy tới vách kính, màu theo độ dốc (cát, rêu, đá, đá sẫm, san hô gần mặt nước) và ngả
  lam theo độ sâu.
- Nền đáy gò đồi thấp (cao hơn đáy kính khoảng 24). Ba khối núi trụ cao khoảng 125 đỡ ba đảo Lúa Vàng, Đá Mây, Cửa Sóng (đỉnh
  bằng ngay dưới đáy đảo, cách mặt nước 4); núi giữa bể cao nhất (đỉnh cách mặt nước khoảng 7,5); mỏm núi sát vách kính, núi
  phụ trên sườn. Đảo trên mặt nước cao khoảng 17: núi chìm cao gấp nhiều lần.
- Ba rãnh: đáy phẳng sát đáy kính (cao hơn đáy 1,4), vách dựng; dài 190 theo bán kính, rộng 120; một khe hẹp chạy tiếp dọc trục
  ra tới vách kính. Ba rãnh nằm dưới ba đảo Thông Xanh, Tuyết Trắng, Cát Hồng (đảo nổi trên rãnh).
- Không gì ở đáy cao quá mực nước −3,8 (đáy sóng sâu nhất khoảng −3).

## 3. Ba phế tích (thiết kế riêng, gợi theo truyền thuyết)

Đảo rộng 124; mỗi phế tích dài khoảng 175–185.

| Phế tích | Chỗ | Gồm |
|---|---|---|
| Thành Vòng Nước | rãnh dưới Thông Xanh | ba vòng tường đồng tâm đá trắng, đá đỏ, đá đen có tháp và đoạn sập, viền đồng đỏ còn ánh; đường đắp cao trên vòm cầu vào gò giữa ba bậc; đền cột một nửa cột đã đổ, mái vỡ; trụ pha lê cam; bốn xác thuyền ở bến; đầu tượng lớn đổ |
| Vườn Treo Bậc Thang | rãnh dưới Tuyết Trắng | sáu tầng gạch xếp lùi (đáy 122 × 76), mặt tầng là dãy vòm cuốn có cột; rong rủ xuống từ mép tầng như vườn treo; bồn tảo trên mặt tầng; cầu thang lớn lên tầng bốn; đình đỉnh vỡ, đá sáng; cổng men lam viền vàng hai tháp; đại lộ tường thấp; tường vườn đổ nhiều đoạn, rừng tảo |
| Đô Thị Đá Khổng Lồ | rãnh dưới Cát Hồng | đại lộ lát đá dài 95, hai bên tượng người khổng lồ quỳ (vài tượng đổ) xen cột đá vuông khắc chữ sáng; vòng 18 cột đá có đà ngang quanh kim tự tháp bốn bậc, vạch chữ sáng mỗi bậc, đá đỉnh sáng; đĩa đá lịch khổng lồ dựa chân tháp |

- Khối đá gộp vào một lưới, đá sáng một lưới (nhịp sáng chậm), rong tảo một lưới (đung đưa trong shader, gốc đứng yên).
- 420 cụm tảo trên sườn núi; bọt khí bay lên từ 18 khe đáy và phế tích.

## 4. Lặn xem

- Thanh đảo thêm nút "Đáy bể": mỗi lần bấm, máy quay lặn tới phế tích kế tiếp (trong lòng rãnh phía vách kính, sâu 22, nhìn
  chếch vào phế tích). Bấm một đảo để lên lại. Kéo, xoay, bay bằng phím như thường.
- Máy quay dưới mặt nước: sương màu nước sâu (càng xuống càng tối, ban đêm tối hơn), góc nhìn mở rộng tới 62° để thấy trọn phế
  tích, lên khỏi mặt nước thì trả lại như cũ.
- Từ ngoài bể nhìn ngang qua vách kính thấy núi trụ đỡ đảo, rãnh và phế tích (vách nước trong 50%).

## 5. Số đo

- Thêm khoảng 82 nghìn tam giác, 4 lần vẽ. Máy thử (vẽ phần mềm): thời gian vẽ một khung 45,6 ms so với 43 ms khi ẩn đáy bể.
- 88 bài kiểm thử đạt; mở trang, lặn tới ba phế tích: không lỗi trang.
- Chưa đo trên điện thoại thật.

## 6. Hạn chế

- Nhìn từ trên xuống không thấy đáy (mặt nước đục, giữ như cũ để màu biển không đổi khi xoay).
- Đảo Thông Xanh, Tuyết Trắng, Cát Hồng vẫn nổi trên rãnh (không có núi đỡ) để rãnh đủ chỗ cho phế tích.
