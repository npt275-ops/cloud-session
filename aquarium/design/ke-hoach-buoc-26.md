# Bước 26 · Sông ở cổng phụ, chi tiết nhỏ cho sáu đảo (cỏ, hoa, sỏi, ban công, chim)

## 1. Sông lơ lửng gần cổng phụ (render/map)

- Lỗi: gần cổng phụ của Thông Xanh, Đá Mây, Cát Hồng, mặt nước và bờ sông nằm lơ lửng trên đất.
- Nguyên nhân:
  - Cả mặt đảo được nâng lên (L.lift), riêng ở cổng chính, hai đầu bến cầu (cổng phụ) và bãi biển thì đất thoải dần
    xuống biển.
  - Mặt nước, bờ sông, bờ hồ là mặt phẳng, được nâng đều một độ cao L.lift cho cả đảo, nên ở chỗ đất thoải chúng nổi lên
    trên không.
  - Lưới gộp mặt nước (water3d.js mergeFlat) còn bị đánh dấu nâng nguyên khối.
- Đo trước khi sửa: 7 trên 11 con sông có đoạn đầu với mặt nước cao hơn mặt đất trên 1.
- Cách sửa:
  - height3d.js finish: mặt nước, bờ nâng theo độ nâng của đất tại từng đỉnh, nên sông chảy dốc xuống theo chỗ đất thoải.
  - water3d.js: lưới gộp vẫn mang dấu mặt nước, bờ.
- Đo sau khi sửa (bắn tia xuống lưới nước dọc 11 con sông): không còn điểm nào lơ lửng.

## 2. Chi tiết nhỏ

- Cỏ, hoa, sỏi (render/map/trees3d.js, cùng chỗ trồng cây):
  - Mỗi miền một kiểu:

    | Miền | Cỏ | Hoa | Sỏi |
    |---|---|---|---|
    | Đồng bằng | 700 khóm xanh tươi | 200 hoa vàng, hồng, trắng | 40 |
    | Rừng | 650 khóm cỏ sẫm | 110 hoa tím, trắng, đỏ | 60 |
    | Núi | 380 khóm cỏ thưa | 40 hoa | 220 |
    | Băng nguyên | 260 khóm cỏ úa bạc | không | 140 sỏi băng |
    | Biển | 560 khóm xanh nhạt | 110 hoa trắng, hồng | 110 vỏ sò |
    | Sa mạc | 200 bụi cỏ khô | 25 hoa đỏ | 240 sỏi đỏ |

  - Cỏ mọc thành đám (7 khóm quanh một tâm), mỗi khóm 5 lá nhọn cao thấp khác nhau.
  - Pháp tuyến của lá hướng lên trời, nên lá sáng như mặt đất.
  - Không mọc trên đường, sông, hồ, núi, đá, sân giữa làng. Chỗ đặt công trình thì dọn như cây (clearTrees). Đất đổi cao
    độ thì đặt lại (L.replant).
  - Ba khối lặp cho mỗi đảo: mỗi đảo chỉ thêm ba lượt vẽ.
- Ban công, lan can nhà tầng (render/build/kit3d.js, khi gộp công trình):
  - Chỉ mảng tường từ 2 tầng trở lên, hai chiều đều từ 3, trên mặt chưa có cửa hay biển dựng sẵn.
  - Cứ cách một ô cửa sổ thì một ban công, so le giữa các tầng, khớp đúng hàng cửa sổ do render/look3d.js vẽ (tầng cao
    khoảng 2,3, ô cửa rộng khoảng 1,7).
  - Mỗi ban công có sàn chìa 0,48, lan can trước và hai bên, màu sẫm hơn màu tường.
  - Ban công được đánh dấu "trang trí", nên mặt tường vẫn có cửa sổ.
- Đàn chim (render/birds3d.js mới, game/nature.js gọi mỗi khung hình):

  | Miền | Loài | Số đàn × số con |
  |---|---|---|
  | Đồng bằng | chim sẻ nâu | 3 × 7 |
  | Rừng | chim sẫm cánh | 3 × 6 |
  | Núi | đại bàng lớn, bay chậm, cao | 2 × 2 |
  | Băng nguyên | chim trắng | 3 × 6 |
  | Biển | hải âu trắng cánh xám | 3 × 6 |
  | Sa mạc | kền kền sẫm, lượn vòng rộng | 2 × 3 |

  - Tổng 85 con.
  - Mỗi con lệch vòng, lệch nhịp, nghiêng mình vào trong vòng lượn. Chúng vỗ cánh từng đợt rồi liệng.
  - Đêm xuống thì về tổ (ẩn dần). Ba khối lặp cho cả bể.

## 3. Số đo

- 93 bài kiểm thử đạt, không lỗi trang.
- Cỏ, hoa, sỏi đặt được 400–940 món mỗi đảo. Ở thời 3 còn hiện 230–510 món mỗi đảo (phần còn lại đã dọn chỗ cho công
  trình).
