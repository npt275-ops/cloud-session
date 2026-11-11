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

## 5. Số đo

Ghi ở cuối bước, sau khi chạy đủ các bộ kiểm chứng (mục "Kết quả" bên dưới).
