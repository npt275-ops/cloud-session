# Bước 17 · Biển động: sóng nhấp nhô, sóng vỗ bờ

Yêu cầu: mặt biển có sóng nhấp nhô rõ hẳn (biển động), giữ kiểu nước low-poly.

- sea3d.js: sóng tính trong shader (vertex) thay cho tính lại từng đỉnh trên máy mỗi khung hình. Tám con sóng Gerstner khác
  hướng, bước sóng 9–38, biên độ 0,06–0,44: mặt nước lên xuống và dồn ngọn sóng theo chiều ngang (ngọn nhọn, đáy thoải). Lưới nước
  dày hơn (420 × 120), giữ mặt phẳng low-poly (flatShading). Màu theo độ cao sóng: đáy sóng sẫm, ngọn sáng, ngọn cao có vệt trắng.
- Sát bờ đảo sóng dịu dần (còn 0,3 khi cách mép dưới 1,5; đủ khi cách 14). Dải bọt trắng quanh chân đảo vỡ thành mảng, có lớp
  sóng xô vào bờ theo nhịp.
- Sóng đập vào vách kính (người chơi yêu cầu thêm): trong khoảng 6 sát kính sóng dồn cao thêm (tới 1,35 lần), sát kính chỉ lên
  xuống (không dồn ngang xuyên qua kính), có lớp sóng vụn dội ngược ra từ vách. Bọt trắng: dải bọt bám theo vách vỡ thành mảng,
  các vệt bọt dội ra xa dần, ngọn sóng đập vào kính tung bọt. Vách nước nhìn từ ngoài: mép trên lên xuống đúng con sóng ở mép mặt
  nước (cùng 420 múi), dưới mép nước có dải bọt trắng sâu 1–2,2 và một vệt bọt chìm.
- Mức sóng ngày thường: 1,15 (rõ hẳn); giông bão (G.weather.stormK) lớn dần tới khoảng 1,9.
- Cùng công thức ở phía máy: BK.seaAt(x, z) trả độ cao và độ nghiêng mặt biển. Thuyền buôn (render/travel3d.js), thuyền đánh
  cá (render/prosper3d.js), thuyền neo ngoài khơi (render/buildings3d.js) nổi và chòng chành theo đúng con sóng; thuyền neo không
  bị gộp khối nữa (để còn động). Tuabin, vườn nổi đứng trên cọc thì không nhấp nhô.
- Dâng, hạ, nghiêng mặt biển bằng quyền năng (setSea) giữ nguyên.

Số đo: thêm khoảng 95 nghìn tam giác (lưới nước), thời gian vẽ một khung trên máy thử không tăng (bỏ được vòng tính sóng trên máy).
15 tệp kiểm thử đạt; tools/bug-hunt.js trận thời 6: không lỗi trang, không ai đi trên mặt nước. Chưa đo trên điện thoại thật.
