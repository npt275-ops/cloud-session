# Bước 20 · Lối đi thật trong ba đường hầm: đá phát sáng, tường chạm khắc

Yêu cầu: bên trong đường hầm có lối đi thật để đi xuyên qua; đá phát sáng đủ sáng để thấy lối đi và các hình chạm khắc kỳ lạ
trên hai bên tường; lối đi hình vòng cung, to và sâu; đưa máy quay vào trong hầm chụp cảnh.

## 1. Lòng hầm (render/deep3d.js)

- Mỗi hầm là một cung tròn quanh giữa bể (bán kính 172, dài khoảng 230), xuyên chân núi trụ dưới Đá Mây, Cửa Sóng, Lúa Vàng,
  nối cửa bên này với cửa bên kia (hai phế tích). Mặt cắt: sàn phẳng rộng 16, tường đứng cao 14, trần vòm bán kính 8 (cao 22).
  Tường, trần gồ ghề nhẹ như đá đẽo; sàn lát đá.
- Cửa hầm làm lại: mặt đá dày 5 có lỗ đúng hình lòng hầm (thay tấm tối cũ), hai cánh cửa mở rộng vào trong hầm; khung cột, vòm
  viền sáng, đà ngang, bảng khắc, bậc đá, lò đèn như trước. Cửa đặt vuông góc với cung hầm; đường lát đá có đèn nối cửa với phế
  tích.
- Mặt đất đáy là một lưới cao độ (không có hang): đất phía trên hầm đắp cao hơn trần vòm 9 (lan ra hai bên), chỗ mặt đất cắt
  qua lòng hầm (và 4 bước trước miệng hầm, trên mặt sàn) được khoét khi vẽ (shader của lưới đáy). Chỗ đất đắp dốc lên nằm từ 5
  bước trong miệng hầm trở vào, sau mặt đá cửa: không có mũi đất chìa ra trước ngưỡng cửa. Từ ngoài bể không thấy ống hầm.

## 2. Đá phát sáng, chạm khắc

- Đá phát sáng (lam, lục, tím, vàng cam xen nhau): cụm ba viên ở chân hai tường mỗi 9 bước, đá treo trên trần mỗi 18 bước.
- Ánh sáng của đá tính sẵn vào màu tường, sàn, hình khắc khi dựng (giảm theo khoảng cách, mặt quay về phía đá sáng hơn nên hình
  khắc nổi khối, ngả màu viên đá gần nhất); không thêm đèn thật vào cảnh (đèn thật làm nặng mọi vật liệu). Lòng hầm vẽ bằng vật
  liệu không chịu đèn cảnh, vẫn chịu sương nước sâu (đoạn xa tối dần).
- Ô chạm khắc mỗi 12 bước hai bên tường: nền tối, khung nổi, sáu kiểu hình thù lạ xen nhau (xoắn ốc, con mắt toả tia, sinh vật
  nhiều chân có đuôi đốt, mặt trời ba vòng, người nhiều tay, mê cung bậc thang và sao); cứ ba ô có một ô nét khắc tự sáng.

## 3. Máy quay

- Nút "Đáy bể" nay đi chín điểm: mỗi phế tích, rồi cửa hầm bên phải nó, rồi trong lòng hầm đó (máy quay ở 30% chiều dài, cao
  9,5, nhìn dọc lối đi cong tới 50%).
- Lòng hầm chỉ vẽ khi máy quay ở dưới nước (từ trên mặt nước bị núi che kín).

## 4. Số đo

- Lòng ba hầm: khoảng 66 nghìn tam giác (1 lần vẽ). Máy thử (vẽ phần mềm, dao động giữa các lần chạy): đứng trong hầm 88,8 ms
  một khung so với 78,2 ms khi ẩn cả đáy bể; nhìn từ trên (hầm ẩn) 37,8 so với 36,7 ms.
- 88 bài kiểm thử đạt; lặn đủ chín điểm, không lỗi trang. Chưa đo trên điện thoại thật.

## 5. Hạn chế

- Chưa có cách đi bộ dọc hầm bằng phím riêng; xoay, kéo, bay bằng phím như thường (dễ ra khỏi lòng hầm).

## 6. Bớt đá sáng, hầm tối hơn, rong che cửa (người chơi yêu cầu)

- Đá phát sáng: cụm ba viên mỗi 16 bước ở hai bên tường (trước 9), đá treo trần mỗi 32 bước (trước 18); còn hai màu lam, lục
  (trước bốn). Ô khắc tự sáng: một ô trong bốn (trước một trong ba).
- Ánh trong hầm: nền rất tối (0,035–0,05 thay 0,10–0,14), ánh mỗi cụm đá toả hẹp (giảm một nửa ở khoảng 2,5 bước thay 5,5):
  quanh cụm đá sáng rõ, khoảng giữa hai cụm chìm trong tối; đi vào thấy vùng sáng vùng tối xen nhau rõ rệt.
- Trước mỗi cửa hầm: 16 cây rong cao 9–19 hai bên và lấn vào giữa lối, 9 sợi rong rủ từ đà cửa xuống; che nửa kín nửa hở,
  đung đưa theo nước.

## 7. Cửa hầm chỉ hé, mỗi cửa một khác, có cửa đóng (người chơi yêu cầu)

- Hai cánh cửa cao bằng tường hầm (13,6), bản lề ở hai mép lòng hầm; tấm bán nguyệt màu cánh cửa bịt vòm phía trên, viền sáng,
  đà ngang ở chân vòm: chỉ còn khe giữa hai mép cánh thông vào hầm.
- Khe hở theo từng cửa (người trong làng cao khoảng 2, khe 1,2–2,4 vừa một người lách vào):
  | Hầm | Cửa phía phế tích đi | Cửa phía phế tích đến |
  |---|---|---|
  | dưới Đá Mây | hé 1,6 (một cánh) | đóng |
  | dưới Cửa Sóng | hé 2,4 (hai cánh) | hé 1,2 (một cánh) |
  | dưới Lúa Vàng | đóng | hé 2,0 (một cánh) |
- Máy quay "Trong hầm" vẫn đặt trong lòng hầm (không đi qua cửa).
