# Bước 35 · Dáng đi thẳng, khớp gối, nhảy hai lần (lộn, lượn), bỏ viền đen

Người chơi nhận xét sau bước 34:
1. Hai chân bè sang hai bên khi đi; thiếu khớp gối nên còn đơ.
2. Nhảy cao hơn; bấm Space hai lần là hai lần nhảy (chỉ hai): lần 1 như cũ, lần 2 lộn trên không rồi rơi xuống; giữ Space để
   bay, rơi từ từ.
3. Nhảy và đáp đất thật hơn: gối nhún xuống, nhún lên.
4. Bỏ nét viền đen quanh nhân vật.

## Đã làm

| Việc | Tệp | Nội dung |
|---|---|---|
| Chân không bè | render/anim3d.js, render/body/motion3d.js | Gen dạng chân của làng nhẹ đi (0,03 + 0,09 → 0,012 + 0,04 rad, cả người ở xa); nhân vật mình hai chân song song |
| Khớp gối, khuỷu | render/body/softbody3d.js, motion3d.js | Thêm khối tròn ở gối, khuỷu (gập không thấy khấc); gối gập rõ hơn khi đưa chân lên (0,62 → 0,9), chân trụ hơi chùng |
| Nhảy hai lần | game/possess-jump.js (mới), game/possess.js, ui/possess-ctl.js | Lần 1: khuỵu lấy đà 0,1 giây rồi bật lên cao chừng 1 đơn vị (trước chừng 0,7). Lần 2 (Space khi đang bay): bật thêm và lộn một vòng 0,6 giây. Sau cú lộn giữ Space: lượn, rơi không nhanh quá 0,9 đơn vị mỗi giây. Chạm đất thì trả lại hai lần nhảy. Nút Nhảy trên điện thoại giữ được để lượn |
| Lộn quanh giữa thân | render/village3d.js | Xoay khung quanh giữa thân, không quanh bàn chân; máy quay bỏ độ dời đó (không giật theo vòng lộn) |
| Dáng khi nhảy | render/body/motion3d.js | Lấy đà: khuỵu, ngả tới, vung tay ra sau. Bay lên: duỗi chân, tay vung lên; gần đỉnh co gối; rơi: duỗi chân với đất. Lộn: ôm gối tròn người. Lượn: dang tay. Chạm đất: khuỵu sâu theo độ mạnh cú rơi, nén người rồi nhún lên lại |
| Bỏ viền đen | render/body/softbody3d.js, face3d.js | Bỏ hẳn lớp viền (mỗi người còn một lượt vẽ) |

Kiểm thử: test/possess-jump.test.js (lấy đà rồi mới bật, cao chừng 1 đơn vị; chỉ hai lần nhảy, lần 2 lộn đủ một vòng; lượn lâu
hơn rơi thường; chỉ nhảy khi đang ở trong thân), test/motion3d.test.js.
