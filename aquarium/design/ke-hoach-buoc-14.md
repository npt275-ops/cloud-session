# Bước 14 · Đảo nhấp nhô, thợ dựng nhà, thêm kiến trúc lạ

Yêu cầu: giải quyết triệt để phần công trình. (1) Dựng lại sáu đảo lồi lõm như đảo thật, không đảo nào giống đảo nào, có một
đảo nằm giữa khe của một quả đồi. (2) Công trình phải do NPC xây, không tự mọc: bốn thợ đứng bốn góc nhà gõ, nhà tự lên, không
giàn giáo. (3) Thêm nhiều kiến trúc lạ cho sáu đảo qua 12 thời, giữ nguyên công trình cũ, không công trình nào lệch ra khỏi đảo.

## 1. Quét công trình thò ra ngoài đảo

- `render/buildings3d.js footing(i)`: đo phần sát đất của mọi thứ đang hiện trên một đảo (công trình trong làng, ngoài làng, cổng,
  lớp đường và tường, bãi làm việc) so với mép đảo.
- `tools/check-footing.js`: mở trang thật, đi qua 12 thời × 6 đảo, in theo loại, mã thoát 1 nếu có món trên đất thò quá 0,3.
  Công trình ngoài khơi và cầu tàu (`dock`) đứng trên nước có chủ ý, chỉ in để biết.
- Đã sửa: kỳ quan và công trình vòng ngoài nay cũng qua `place3d.keepOn` (dời vào, thu nhỏ hay bỏ); đầu đường toả và đoạn tường
  sát mép lấy chỗ hẹp nhất của mép quanh hướng đó. Kết quả: 0 món trên đất thò ra ngoài.

## 2. Đảo nhấp nhô (`render/map/height3d.js`)

- Mặt đảo là một lưới cực (46 vòng × 144 múi), vòng ngoài nằm đúng mép đảo ở cao độ 0, thay cho tấm phẳng cũ.
- Cao độ một điểm = mép (thoải hay dựng) × (nền + dáng lớn + gồ ghề chỉ ở ngoài đường) → khoét nước → nền công trình.
  - Đường của đảo đi trên dáng lớn (thoải); gồ ghề tránh mặt đường. Chỗ có cầu, cổng chính, đầu đường thì mép thoải.
  - Sông, hồ, ao, đầm khoét đất xuống dưới mặt nước (lấy đúng hình các mặt nước đã có), bờ nối thoải lên.
  - Mỗi công trình có một nền phẳng ở cao độ đất chỗ nó đứng; công trình ven bờ có nền thấp sát nước; sân làng là một nền rộng.
- Sáu dáng đất:
  | Đảo | Dáng |
  |---|---|
  | Lúa Vàng | gò thoải, hai cánh ruộng bậc thang, gò lớn phía sau |
  | Thông Xanh | làng nằm trong khe của một quả đồi lớn chẻ đôi (hai nửa đồi cao 13–17 hai bên, khe hẹp phía sau) |
  | Đá Mây | cả đảo dốc dần lên phía ngoài, sườn đá gồ ghề, vách dựng sát mép |
  | Tuyết Trắng | gò băng dài song song, khe nứt trũng |
  | Cửa Sóng | thấp, cồn cát dọc bờ, bãi thoải rộng, một mũi đá cao |
  | Cát Hồng | cồn cát lưỡi liềm, một bậc cao nguyên đá |
- Ai đứng trên đất đều hỏi `L.surfAt(x, z)` (hay `BK.groundAt` theo toạ độ thế giới): công trình, bãi làm việc, cây, người, thi
  thể, xe trên đường, quân, xe công thành, đạn, bóng, đống đổ nát. Đá, núi, lớp đường, tường, đèn được nâng từng đỉnh theo đất
  (`L.drape`). Logic vẫn tính trên mặt phẳng; cao độ chỉ thêm ở khâu vẽ.
- Shader bề mặt (`render/look3d.js`) dùng độ cao so với chân công trình (thuộc tính `aGy`) thay cho độ cao tuyệt đối.

## 3. Thợ dựng công trình

- Logic (`logic/construction.js`): tiến độ mỗi ngày = tốc độ theo số thợ × phần thợ có việc ở công trường trong giờ làm của ngày
  đó (`note`, gọi sau mỗi nhịp nghĩ). Thợ đi bắc cầu, sửa chỗ hư, ra trận, chạy nạn thì không tính; không ai ở công trường thì
  công trình đứng yên. Mốc "xong ở 80% thời" tính với mức có mặt thường ngày đo được (0,8).
- Việc của thợ (`logic/tasks.js`): tới công trình đang dựng và gõ (bỏ vòng đi kho lấy vật liệu).
- Hình (`render/buildings3d.js`): tới lượt thì công trình cũ ở chỗ đó được dỡ, bốn thợ ra đứng bốn góc nhà quay mặt vào gõ
  (`places().site`, `render/village3d.js`), khối nhà hiện dần từ móng lên (tam giác xếp từ thấp lên cao, vẽ một phần). Nhà chỉ
  lên khi đã có thợ tới góc nhà (chờ tối đa 25 giây thực nếu thợ kẹt). Không có giàn giáo.
- Cả sáu đảo dùng chung cách này (bỏ kiểu dựng theo thời gian trôi).

## 4. Kiến trúc lạ (`render/build/marvels.js`)

- 48 kiểu, mỗi đảo tám kiểu theo chủ đề riêng (danh sách ở đầu tệp); vật liệu và chi tiết đổi theo bốn giai đoạn (xưa, cận đại,
  hiện đại, tương lai), lớn dần theo thời. Nhiều kiểu có phần chuyển động (quay, đung đưa, nhấp nhô, khói).
- Mỗi đảo mỗi thời thêm 3 công trình (thời 1–3) hoặc 4 công trình (thời 4–12) ở bốn chỗ cố định vòng ngoài làng, thay nhau qua
  các thời; hai thời liền nhau ở cùng một chỗ luôn khác kiểu. Công trình cũ giữ nguyên.
- Vào danh sách xây của logic như mọi công trình khác (thợ dựng lần lượt).

## 5. Kết quả (số đo thật)

- `node --test`: 15 tệp đều đạt.
- `tools/check-footing.js`: 0 món trên đất thò ra ngoài đảo (6 đảo × 12 thời); khoảng 230 lượt công trình ngoài khơi và cầu tàu
  đứng trên nước có chủ ý.
- `tools/calibrate.js 100`: 16/16 chỉ số đạt (10,61 trận đánh mỗi trận; 94% trận có từ hai đảo tới thời 11 cuối năm 8).
- Kiến trúc lạ đặt được: 4/4 chỗ ở năm đảo, 3/4 ở Đá Mây (một chỗ vòng ngoài không còn đất trống) ở các thời 4, 8, 12 đã đo.
- `tools/bug-hunt.js` (thời 6 và 11): không có lỗi trang, không ai lơ lửng hay đứng ngoài đảo, quân không vào thành trước khi cổng
  đổ. Còn lại như trước bước này: phát trúng không có người bắn trong tầm (111 và 50 trong hai trận, không vẽ thành đạn), vài
  cặp đứng chồng trong trận (ở chỗ trú, quanh nhà chính), kẹt thật 1–3 lần mỗi lượt quét.
- `tools/check-scene.js`: chỗ không chồng, đủ chỗ, bước tại chỗ, kẹt đều đạt. Không đạt: "đứng không" 11–28% (dao động giữa hai
  lần chạy, mục tiêu ≤ 10%) và 6–10 cặp người đứng chồng, đều ở thời 12 (ở đền, ở ruộng). Chưa xác định được do lỗi thật hay do
  máy thử vẽ chậm hơn sau khi thêm lưới đất (ít khung hình hơn trong 4 giây đo).

## 6. Chưa làm, còn hạn chế

- Chưa đo trên điện thoại thật. Mặt đất thêm khoảng 13 nghìn tam giác mỗi đảo (6 đảo: khoảng 78 nghìn).
- Trong làng đất chỉ thoải nhẹ (để đường, nhà, trận đánh không đổi); lồi lõm mạnh nằm ở vòng ngoài.
- Bóng tròn dưới chân người là tấm phẳng, trên sườn dốc bị đất che một phần.
- Đá, đồi dựng sẵn của bản đồ không theo nền công trình đổi qua từng thời nếu nằm sát nền (lệch nhỏ).
- Các bug trận đánh người chơi báo (cổng đã vỡ vẫn bị bắn, xe xuyên cầu và xuyên lính, pháo plasma không có đạn, xe phải chậm
  hơn lính) chưa sửa trong bước này.

## 7. Người không đi xuyên nhà, không chìm dưới mặt sân (người chơi báo: Đá Mây thời cuối, Cửa Sóng, người đứng đầu)

- Nguyên nhân 1 (chìm dưới "lớp phủ"): sân làng là tấm phẳng; nền nhà quanh sân lấy độ cao riêng nên làm lõm mặt đất dưới sân,
  chỗ có đường thì nền không phủ tới. Sửa: nền của sân dựng sau cùng, phẳng một độ cao; nền mọi công trình phủ cả chỗ có đường,
  lấy độ cao đất lúc đó; nền theo khung chân thật của công trình (cả bệ nhà chính rộng). Lớp đường chia nhỏ tam giác trước khi
  phủ theo đất, mặt đường không nổi trên dốc.
- Nguyên nhân 2 (đi xuyên nhà chính): chỗ "trước nhà chính" cố định cách tâm 6, nhà chính các thời sau to hơn; người đi thẳng
  từ chỗ này sang chỗ khác không hề tránh nhà. Sửa: chỗ trước nhà chính, cửa nhà, chốt gác cổng tính theo mặt tiền thật
  (render/buildings3d.js P.box); places().solids là khung chân mọi công trình tới tầm người (2,2), cột đèn, gốc cây dọc phố;
  render/nav3d.js: đích trong khung thì ra mép (không đẩy sang nhà bên cạnh), đường thẳng vướng khung thì tìm đường trên lưới ô
  0,5 (A*), ai lỡ ở trong thì bước dần ra. Ruộng, nhà kính là chỗ mềm: người làm ruộng vào được.
- Đo: tools/check-walk.js (6 đảo × 12 thời, chiếu từ ngang ngực xuống chân, mặt công trình hay sân cắt qua người từ 0,45 trở
  lên là đi xuyên). Trước khi sửa: khoảng 600 lượt, người đứng đầu 41 lượt (2 thời 2 đảo). Sau: 18 lượt cả 12 thời, người đứng
  đầu 0. Còn lại: xe trên đường làng lướt qua người (khoảng một nửa), vài lượt người đi sát góc nhà hay công trình vừa khởi công
  ngay chỗ người đứng.
- tools/bug-hunt.js dân thời 6: bước tại chỗ 0, kẹt thật 13 (trước khi có việc đi vòng: 5–8).
