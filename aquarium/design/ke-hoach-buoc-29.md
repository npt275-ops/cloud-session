# Bước 29 · Rà soát công trình 6 đảo × 12 thời, hồ đầy nước

## 1. Hồ đầy nước gần sát miệng

- Trước: hồ là lỗ trống, nhìn xuống thấy mặt biển ở xa phía dưới.
- Nay: mỗi hồ có mặt nước riêng, thấp hơn chỗ bờ thấp nhất 0,18 (render/map/height3d.js holes, WATER_DROP).
- Mặt nước phủ kín lòng lỗ, vẽ hai mặt. Bên dưới vẫn thông xuống biển: lặn qua mặt nước là xuống lòng lỗ rồi ra biển.
- Màu nước theo miền (WATER_C); Tuyết Trắng nước nhạt màu băng.
- render/map/water3d.js chỉ còn gộp dải phẳng (bãi cát, hẻm núi). Phần gộp mặt nước cũ đã xoá vì không còn khối nào dùng.

## 2. Rà soát công trình

Công cụ mới tools/check-buildings.js dựng hết công trình của 6 đảo ở từng thời rồi đo từng món:

| Mục | Trước khi sửa | Sau khi sửa |
|---|---|---|
| Lỗi trang | 0 | 0 |
| Toạ độ hỏng, món không có hình | 0 | 0 |
| Thò ra ngoài đảo | 0 | 0 |
| Thân công trình chồng lên nhau | 80 | 3 |

Lỗi chồng nhau là lỗi thật, thấy được trên ảnh: tháp canh xuyên qua nhà, nhà dính vào trường học, nhà đứng trên bệ nhà chính,
công trình công cộng lấn vào kỳ quan.

Nguyên nhân: chỗ đặt ban đầu tính theo vòng tròn khai báo (clear), nhỏ hơn hình thật của nhiều công trình.

Sửa (render/build/place3d.js, render/buildings3d.js):
- Mỗi công trình dựng hình xong ghi lại khung phần sát đất của nó (P.low).
- Công trình dựng sau đo móng thật của mình với khung của các công trình đã dựng (hitsOthers). Chạm thì xử lý như lấn đường:
  clearRoad dời đi, không có chỗ thì thu nhỏ dần.
- keepOn (dời vào trong đảo) cũng tránh các khung này.
- Nhà chính luôn dựng hình trước mọi công trình khác của đảo (bakeOf), đứng yên; các công trình khác tránh nó.
- Không xét: lớp đường, cổng, tường, công trình ngoài khơi.

3 ca còn lại là chạm nhẹ ở mép (20–34% món nhỏ hơn), do hình không phải chữ nhật.

## 3. Kiểm chứng

- tools/check-buildings.js: đạt (chồng nhau 3, ngưỡng 5).
- tools/check-footing.js: đạt, không món nào thò ra ngoài đảo hay đè lên hồ.
- tools/check-scene.js chỗ: đạt, 0 chỗ chồng.
- Kiểm thử: 92/92 đạt.

## 4. Còn lại, chưa sửa

- tools/check-walk.js (đo trước khi sửa mục 2): 50 lượt người đi xuyên công trình trên 12 thời, nhiều nhất là lớp đường
  (town) và nhà chính. Đây là lỗi đường đi của người, chưa xử lý trong bước này.
- 3 món có cánh hay tay vươn sát mép đường (cối xay gió thời 3–4 ở Cát Hồng, đài quan sát thời 7 ở Lúa Vàng).
- Mỗi lần chạy có 1 công trình bị bỏ vì không có chỗ trên đảo.
