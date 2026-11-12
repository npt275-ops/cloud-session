# Bước 27 · Bỏ xe dưới đất, bỏ chim và cỏ, xây nhà đủ 4 người là xong

## 1. Chỉ còn xe bay

- render/build/vehicles.js chỉ còn xe bay:
  - thời 9: hạt giống bay;
  - thời 10: xe bay;
  - thời 11: quả cầu sáng;
  - thời 12: thoi ánh sáng.
- Thời 1–8 không có xe. Đã xoá hẳn xe trâu, ngựa, xe ngựa, ô tô hơi nước, xe đạp, ô tô, xe buýt, rô-bốt giao hàng, người
  lái và chân con vật.
- render/build/traffic3d.js chỉ còn cho xe bay lượn dọc vòng đường ở độ cao riêng. Đã xoá:
  - rẽ theo mạng đường, chạy chuyến;
  - chỗ đỗ xe (render/buildings3d.js places().stops);
  - nhường người đi bộ (setPeds ở game/cities.js);
  - kiểm xe kẹt (stalled, tools/bug-hunt.js).
- render/village3d.js peds() giữ lại, vì render/look3d.js dùng nó để vẽ bóng dưới chân người.
- Đo: thời 6 không còn xe nào; thời 10 có 24 xe bay.

## 2. Bỏ chim và cỏ (bước 26)

- Xoá render/birds3d.js và chỗ gọi trong game/nature.js, index.html.
- Xoá cỏ, hoa, sỏi trong render/map/trees3d.js, map3d.js. Các tệp này trở lại như trước bước 26.
- Ban công nhà tầng (render/build/kit3d.js) và phần sửa sông giữ nguyên.

## 3. Xây nhà: đủ 4 người là thành nhà mới ngay

- logic/construction.js:
  - Tới lượt thì khởi công (tiến độ 0,02).
  - Mỗi lần cả làng nghĩ lại việc trong giờ làm, đếm thợ đang dựng ở công trường. Đủ 4 thợ (đảo ít hơn 4 thợ thì đủ mọi thợ)
    thì công trình xong ngay và chuyển sang cái kế tiếp.
  - Thiếu đúng một người suốt 3 lần nghĩ liền (thợ kia bận trông con, ăn) thì cũng tính là xong.
  - Không còn tính tiến độ theo ngày (đã xoá dayTick, DUTY, unit).
- render/buildings3d.js:
  - Khởi công: nhà cũ ở chỗ đó vẫn đứng nguyên hình. Nhà mới đã dựng sẵn hình nhưng chưa hiện. Bốn góc nhà
    (places().site) là chỗ bốn thợ tới đứng gõ.
  - Logic báo xong và đã có 4 thợ đứng ở góc (siteCrew) thì nhà cũ biến mất, nhà mới hiện đủ hình ngay. Không mọc dần từ móng,
    không có giàn giáo.
  - Đảo không vẽ người thì không chờ thợ. Đảo ít thợ hơn 4: chờ thợ đứng vào góc tối đa 6 giây.
  - Đã xoá phần nhà mọc dần (sortUp, drawRange theo tiến độ, RISE).
- test/island.test.js vẫn đạt: thời nào cũng dựng xong ít nhất 60% công trình trong 200 ngày, cả trận hơn 15 lần dựng xong.

## 4. Còn thiếu

- Chưa chụp được cảnh nhà cũ đứng chờ 4 thợ rồi đổi sang nhà mới trong trình duyệt. Nút nhảy thời dựng sẵn mọi công trình,
  nên phải để trận tự chạy tới thời sau mới thấy.
