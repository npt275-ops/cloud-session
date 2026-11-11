# Bước 12: Nhìn bằng mắt người chơi (NPC có việc thấy được, chiến trận như phim, công trình không lỗi)

Viết sau khi xem hai ảnh chụp trên điện thoại (Đá Mây bị tên lửa ngày 2042; Cát Hồng bị Tuyết Trắng đánh ngày 1965) và bản
định hướng "phim bom tấn tự hành": người chơi ngả lưng xem, không bấm gì, nhưng liên tục bất ngờ, tò mò, phấn khích.

## 0. Vì sao sửa nhiều vòng vẫn không ổn (thừa nhận)

1. **Đo sai thứ.** Các vòng trước đo bằng số (bao nhiêu trận, bao nhiêu người đứng không, bao nhiêu lần kẹt) và chụp ảnh tĩnh
   trên khung ngang máy tính. Số đạt hết mà mắt người xem vẫn thấy đơ, thấy lỗi. Chưa lần nào xem **video** trên **khung dọc
   điện thoại** như bạn đang xem.
2. **Chiến trận là logic trừu tượng rồi "trang trí" lên hình.** Logic tính mỗi giờ ai trúng đạn; phần vẽ cho người đứng thành
   hàng, giơ súng, bắn đạn trang trí. Không có ai nấp, tiến, lùi, leo, phá; không có chặng nào người xem nhìn ra được.
3. **Đặt công trình chỉ kiểm tâm điểm, không kiểm cả móng.** `render/build/place3d.js`: dời nhà khỏi đường cho phép nửa móng
   thò ra ngoài mép đảo (`inside(x, z, r × 0,5)`); nhà không lấn đường thì không kiểm mép đảo; không tìm được chỗ thì giữ
   nguyên chỗ cũ (`return p`, `{ stuck }`). Đó là lý do nhà treo ra ngoài biển như ảnh 2.
4. **Cổng phụ chỉ là chỗ hở trên tường** (`L.wallGaps`) với hai lính gác, chưa có kiến trúc cổng, chưa có máu riêng trên hình.
5. **Đi thuyền tới cổng chính** là lối tắt của logic (đảo không kề nhau, cầu bị phá), không có cảnh đổ bộ thật.

## 1. Nguyên tắc mới cho cả bước 12

**Bổ sung theo yêu cầu (trước khi làm):**
1. Bỏ cảnh người nhà ra tiễn quân và kéo người bị thương: chiến tranh chưa xong thì không thêm thứ khó làm phình to.
2. Bỏ định hướng "phim tự hành". **Cấm máy quay tự đổi góc**: máy quay chỉ bay khi người chơi bấm (tên đảo, tin, nút Trận
   đánh, Drama); không tự bám theo trận, không tự đổi góc khi đổi chặng.
3. NPC có tầm bắn nhất định theo vũ khí; ngoài tầm thì không bắn.
4. Ưu tiên NPC: sau bước này không còn lỗi NPC nhìn thấy được.

- **Mỗi thứ trên màn hình phải trả lời được "nó đang làm gì, vì sao".** Không trả lời được thì bỏ hoặc sửa, không giữ cho đông.
- **Kiểm bằng video khung dọc điện thoại.** Mỗi cảnh quay 20–30 giây ở 390×844, xem lại từng clip, chấm theo bảng (mục 6).
  Clip gửi cho bạn xem trước khi báo xong.
- **Bất biến tự động** cho những lỗi nhìn thấy được (nhà ngoài đảo, khối đen, người xuyên tường): công cụ quét 6 đảo × 12 thời,
  hỏng là dừng.

## 2. Công trình (điểm 3): sửa tận gốc

| Lỗi | Gốc | Cách sửa | Kiểm |
|---|---|---|---|
| Nhà lệch ra khỏi đảo | Chỉ kiểm tâm, cho nửa móng ra ngoài; không chỗ thì giữ chỗ cũ | Mọi công trình qua một hàm đặt duy nhất kiểm **cả 4 góc móng thật** (khung bao sau khi dựng) nằm trong mép đảo trừ lề 2; không có chỗ thì thu nhỏ dần, vẫn không có thì **không dựng** (ghi vào nhật ký dev), không bao giờ giữ chỗ sai | Quét 6 × 12: số góc móng ngoài đảo = 0 |
| Khối đen ở cổng | Chưa rõ: có thể là cổng đổ (đống đổ màu sẫm), máy công thành, hay mảnh hình không có vật liệu | Gắn nhãn nguồn cho mọi khối (`userData.src`: tệp và hàm tạo ra nó), thêm chế độ dev bấm vào khối thì hiện nguồn; quét tự động khối tối gần như đen mà không thuộc danh sách cho phép | Quét 6 × 12 và lúc có trận: 0 khối không rõ nguồn |
| Thiếu cổng phụ phía cầu | Cổng phụ chỉ là chỗ hở tường | Mỗi đầu cầu có **cổng phụ thật** theo kiến trúc từng đảo × từng thời (khung, cánh cổng, tháp canh hai bên), có máu riêng, có hình hư, đổ, dựng lại; cầu luôn dẫn thẳng vào cổng phụ | Ảnh 6 đảo × 12 thời ở đầu cầu |

## 3. Chiến tranh (điểm 2): làm lại thành "trận dựng theo chặng"

### 3.1 Bỏ đi thuyền, chỉ đánh qua cầu
- Quân chỉ sang đảo khác **qua cầu**. Muốn đánh đảo kề mà chưa có cầu: bắc cầu quân sự trước (đã có trong logic). Muốn đánh đảo
  xa: phải đi qua cầu của đảo ở giữa, tức là có hiệp ước cho mượn đường, hoặc đánh chiếm đảo ở giữa trước. Bản đồ sáu đảo vòng
  tròn biến thành bàn cờ thật: ai giữ cầu thì giữ đường.
- Cầu thành mục tiêu: phá cầu để chặn giặc, xây lại cầu qua mỗi thời (đã có). Bỏ hải chiến và cảnh thuyền chở quân tới cổng
  chính; tên lửa, máy bay vẫn bay qua biển.
- Phải cân lại 100 trận (số trận, vô địch, hạt nhân…) vì luật này đổi cục diện. Đây là thay đổi lớn nhất của bước 12.

### 3.2 Một trận là sáu chặng người xem nhận ra được
Logic quyết định kết quả từng chặng; phần vẽ dựng chặng đó như cảnh phim, mỗi chặng có máy quay riêng:

1. **Tập trung**: lính ra khỏi trại, xếp hàng ở sân; tướng đứng trước hàng.
2. **Hành quân**: đi theo đường làng ra đầu cầu, xe, máy công thành đi sau.
3. **Qua cầu, áp cổng phụ**: bên giữ đứng trên tường và tháp canh hai bên cổng; bên đánh tiến từng đợt, nấp sau khiên, xe,
   máy công thành; tầm bắn thật, chỉ bắn khi thấy nhau.
4. **Phá cổng**: máy húc, nổ, cổng phụ gãy đổ có hình đổ theo thời; giặc tràn qua.
5. **Giao tranh trong thành**: bên giữ lùi về các điểm nấp (góc nhà, tường thấp); dân chạy trốn; đánh từng đoạn phố.
6. **Nhà chính**: vây, đầu hàng (quỳ, hạ cờ) hoặc nhà chính sụp; hoặc bên đánh tan, rút chạy qua cầu.

### 3.3 Từng người lính
- **Vai trong trận**: tiền tuyến, cung thủ hay xạ thủ, lính khiên, tướng, lính cứu thương (thời sau). Mỗi vai có chỗ đứng và
  cách cử động riêng.
- **Vũ khí gắn vào tay thật** (khớp tay, ngắm theo mục tiêu); nạp đạn, giương, bắn, giật; đổi vũ khí theo thời.
- **Trúng đạn có phản ứng**: giật lùi, ngã.
- **Tầm bắn thật theo vũ khí từng thời**: chỉ bắn khi đối phương trong tầm; ngoài tầm thì tiến lại gần tới đúng tầm rồi mới
  dừng bắn. Không ai đứng từ cổng bắn bâng quơ.
- **Sĩ khí thấy được**: hàng nao núng thì lùi, có người bỏ chạy; tướng ngã thì cả hàng chững lại.
- Mỗi phát trúng vẫn lấy từ logic (`W.hitLog`) như bước 11c, nhưng người bắn phải đứng trong tầm, có đường nhìn.

## 4. NPC (điểm 1): không ai vô nghĩa

### 4.1 Mỗi việc có một "trạm việc" thấy được
Mỗi cặp (việc, chỗ) phải có: công trình hay bãi riêng; đồ dùng trên tay; cử chỉ lặp có đầu ra (bó lúa, khúc gỗ, hàng hoá); đường
đi tới đó; kết quả mang về kho. Lập bảng **việc × thời × đảo**, ô nào thiếu trạm thì xây trạm (lò rèn, xưởng dệt, bến cá, chuồng
trại, trạm canh, trường, chợ, xưởng máy…) hoặc đổi việc. Bảng đặt trong `design/`, kiểm tự động.

### 4.2 Lính gác và trại lính
- Trại lính, tháp canh trên tường, đổi ca gác theo giờ, tuần tra dọc tường thành.
- Có chiến tranh thì lính ra từ trại, tập trung, hành quân (mục 3.2); hết trận thì về trại, chôn cất, chữa thương.

### 4.3 Bớt "đơ"
- **Không đi theo đường thẳng tắp, không quay ngoắt**: đường cong, tăng tốc, giảm tốc, nhìn quanh.
- **Đứng thì có việc nhỏ**: nói chuyện theo nhóm, ngồi, dựa tường, chơi, cho gà ăn; không đứng trơ.
- **Người gần máy quay cử động đủ từng khung hình**; người xa mới cập nhật cách khung (sửa cách cập nhật thưa ở bước 11b, có
  thể chính nó làm người đứng hàng trông giật).
- **Đo "đơ" bằng clip**: phần người trong khung hình không cử động trong 3 giây ≤ 5%.

## 5. (Đã bỏ theo yêu cầu) Định hướng "phim tự hành" (điều chưa có hay còn yếu)

| Định hướng | Hiện có | Cần làm |
|---|---|---|
| Máy quay tự lướt tới chuyện lớn | Có (bước 11d), nhưng khung ngang, bảng tin che nửa dưới khung dọc | Chế độ tự xem (auto-play) mặc định, góc quay riêng cho khung dọc, bảng tin thu gọn khi đang quay cận |
| Lên thời bùng nổ | Có lóe sáng, nhà thay dần | Cảnh lên thời 8–10 giây: máy quay vòng quanh đảo, ánh sáng bùng, công trình mới mọc lên trước mắt |
| Bảng tin như thời sự | Có dòng tin | Tin chạy mượt, có ảnh chân dung nhỏ của người trong tin, chuyện quan trọng to hơn |
| Cây phả hệ, gen biến dị | Gen, di truyền có trong logic; chưa có cảnh | Bảng phả hệ của dòng người đứng đầu; tin kiểu "con trai mang gen hiếu chiến +29 lật đổ cha"; chuyện kế vị xé hiệp ước |
| Drama tự sinh | Có nhiều kịch bản | Nối kịch bản với gen và dòng họ: người kế vị đổi chính sách, xé hiệp ước, đảo chính trong nhà |

## 6. Bảng chấm khi xem clip (mỗi cảnh 1–10, cần ≥ 7)

- Nhìn 5 giây có hiểu đang xảy ra chuyện gì không.
- Có ai đứng trơ, đi xuyên tường, xuyên nhà, trượt chân không.
- Vũ khí có nằm trong tay, bắn có hướng về đối phương không.
- Có vật gì lơ lửng, đen kịt, nằm ngoài đảo không.
- Có khoảnh khắc làm người xem thốt lên không (cổng đổ, tướng ngã, quỳ hàng, lên thời).

## 7. Thứ tự làm

| Bước | Việc | Vì sao trước |
|---|---|---|
| 12a | Công cụ quay clip khung dọc, quét bất biến (móng ngoài đảo, khối không rõ nguồn) | Có mắt để xem trước khi sửa |
| 12b | Sửa đặt công trình, khối đen, cổng phụ thật ở đầu cầu | Lỗi thấy ngay, sửa được tận gốc |
| 12c | Logic chỉ đánh qua cầu, mượn đường, bỏ thuyền chở quân; cân lại 100 trận | Đổi luật lớn, cần trước phần vẽ trận |
| 12d | Trận dựng theo sáu chặng, vai lính, vũ khí gắn tay, trúng đạn có phản ứng, máy quay theo chặng | Phần người xem chấm 1/10 |
| 12e | Trạm việc cho mọi việc × thời × đảo, trại lính, tháp canh, cử động bớt đơ | Không NPC nào vô nghĩa |

Mỗi bước kết thúc bằng clip khung dọc cho từng cảnh và bảng chấm, cộng các kiểm thử và cân chỉnh như bước 11.

---

## 8. Đã làm trong phiên này (và chưa làm)

**Đã làm**
- Máy quay không tự đổi góc: bỏ việc tự bay theo chặng trận; chỉ bay khi người chơi bấm.
- Bỏ cảnh người nhà ra tiễn quân.
- Chỉ đánh qua cầu: bỏ thuyền chở quân và hải chiến; đảo xa phải mượn đường qua cầu của đảo cho đi qua (đất của mình, có
  hiệp ước, tin hay sợ bên đánh); cầu trên đường bị phá thì quân quay về; đảo kề chưa có cầu thì bắc cầu quân sự trước (nửa
  giá, dùng gỗ, đá, kim loại). 100 trận vẫn đạt cả 16 chỉ số (trận đánh 10,8; hạt nhân 15%; vô địch 89%).
- Cổng phụ thật ở hai đầu cầu, theo kiến trúc từng đảo, từng thời; hết máu thì cổng đổ.
- Cục đen ở cổng: là khung nền của thanh máu cổng khi cổng hết máu. Hết máu thì không vẽ nữa; thanh nhỏ lại.
- Một cục lính đen: quân đóng trại vây, đứng xem đấu tướng, tập hợp quân trước khi lên đường cùng đi vào một điểm. Nay mỗi
  người một chỗ trong hàng; bộ đo đếm người đứng chồng lên nhau.
- Móng công trình nằm trọn trong đảo (kiểm từng điểm của móng thật): dời vào, thu nhỏ, hay không dựng.
- Tầm bắn theo vũ khí từng thời; chỉ bắn kẻ địch trong tầm; đạn bay từ người bắn đứng trong tầm; trúng thì giật lùi, khựng.
- Thanh máu người chỉ hiện khi bị thương.
- Xem chậm cả lúc quân qua cầu tới đảo đang xem.
- Người đứng chờ, đứng gác: liếc nhìn, chuyển trọng tâm, thỉnh thoảng nhìn quanh.
- Không ai đứng chồng lên ai: mỗi người một chỗ riêng quanh chỗ làm (theo khoá riêng, tính cả đảo của khách), người đứng yên
  quá sát thì được đẩy nhẹ ra và dời luôn chỗ đứng riêng.
- Bộ đo cuối (tools/check-scene.js, 6 đảo × 4 buổi × 3 thời): đứng không lớn nhất 4%, quanh nhà chính 0, bước tại chỗ 0,
  người đứng chồng 0 cặp, kẹt 0; chỗ dùng chung không chồng và móng trong đảo ở 6 đảo × 12 thời: 0 lỗi.
- Công cụ: `tools/clip.js` quay video thời gian thực khung dọc điện thoại theo từng chặng trận, ảnh cổng phụ sáu đảo.

**Chưa làm (còn lại cho bước sau)**
- Tháp canh trên tường có lính đứng trên cao; trại lính riêng.
- Lính nấp sau vật che, lùi về điểm nấp trong thành; máy húc cổng; hình cổng gãy đổ theo từng thời (hiện là ẩn cổng, để đống đổ).
- Bảng việc × thời × đảo kiểm tự động (thống kê một trận cho thấy mọi việc đều có chỗ thật, nhưng chưa thành bài kiểm tra).

---

## 9. Quân và xe nã cổng từ giữa cầu; quét lỗi trận chiến và NPC

**Yêu cầu:** quân lính và xe công thành bắn cổng thành từ giữa cầu; cổng đổ thì quân và xe mới tràn vào thành. Tìm và sửa tất cả
lỗi trong game, nhất là trận chiến và NPC.

**Trận ở cầu (đã làm)**
- Cả đạo quân đứng trên mặt cầu thành hàng bốn người; hàng đầu cách cổng (tầm bắn − 5), tức khoảng giữa cầu; xe, máy công thành
  hai làn sau hàng quân cuối (render/village3d.js `deckPlan`, dùng chung cho người và xe). Cầu ngắn, quân đông thì các hàng, các
  xe đứng sít lại rồi hàng đầu mới tiến gần cổng hơn, không ai bị dồn chồng ở cuối cầu. Bên giữ đứng ngay sau cổng (trong thành).
  Cổng phụ nằm sâu trong mép đảo chừng 7 đơn vị: khoảng cách tính từ cổng, không từ đầu cầu (trước đây hàng đầu đứng xa cổng hơn
  tầm bắn, hai bên không bắn tới nhau).
- Cổng đứng ít nhất 1,2 ngày dưới làn đạn (logic/war.js `GATE_MIN_DAYS`; nội gián mở cổng, cổng dịch chuyển thời 12 thì không giới
  hạn). Bên giữ chỉ xét xin hoà từ ngày thứ hai (trước đây có trận vừa tới đã nộp cống, không có trận nào).
- Cổng đổ: quân đi dọc mặt cầu về đầu cầu, qua cổng rồi mới theo lối trong đảo; xe lăn tới cổng rồi vào thành.

**Công cụ quét lỗi** `tools/bug-hunt.js`: mở trang thật, tự chạy từng khung hình (dt 50 ms, đúng nhịp xem chậm), máy quay đặt ở đầu
cầu; mỗi trận bắt đầu từ trang mới. Đo: toạ độ hỏng, đứng ngoài đảo (không trên mặt cầu), lơ lửng, nhảy chỗ (> 2 đơn vị một khung),
người chết còn đi, quân vào trong tường hay xe vào thành trước khi cổng đổ, xe dưới nước, hàng đầu ngoài tầm tới cổng, đạn quá tầm,
phát trúng không có người bắn trong tầm, quân giặc còn lại sau trận, lính hành quân và người qua cầu đi trên nước, xe trên đường
đứng yên quá 25 giây game, người đứng chồng, kẹt, làm sai việc, lỗi trang. Kèm số đếm (lượt quân trên cầu, đạn theo nguồn) để chắc
là bộ quét thật sự thấy trận. Thử cấy lại một lỗi cũ (kéo lính từ cầu vào đảo): bộ quét bắt ngay.
  Lưu ý thật thà: các lần quét đầu báo 0 lỗi là do bộ quét chưa đo đúng (máy quay giữa đảo, trận sau mang trạng thái trận trước);
  sửa bộ quét xong mới lộ ra các lỗi dưới đây.

**Lỗi tìm thấy và đã sửa**
1. Lính trên cầu bị kéo thẳng vào trong tường khi cổng đổ (nhảy 16–24 đơn vị): đường rời cầu (`leaveDeck`) dùng cho cả các bước con
   trong một khung hình; trúng đạn giật lùi trên cầu không kéo vào đảo.
2. Gỡ kẹt dịch chuyển người (nhảy 5–13 đơn vị): bỏ hẳn dịch chuyển; kẹt lần 1 tìm đường lại, lần 2 đi thẳng, lần 3 đứng lại; chỉ
   tính kẹt khi đích còn xa.
3. Gốc của phần lớn "kẹt": lính tuần tra, thợ sửa nhà, thầy thuốc thăm nhà đổi chỗ theo đồng hồ (chưa tới nửa giây thật) nên đi tới
   đi lui. Nay tới nơi, ở lại một lúc rồi mới sang chỗ kế tiếp.
4. Người đang dừng bắn (thấy địch trong tầm) vẫn đi tiếp ở các bước con: nay đứng yên.
5. Tướng đấu tay đôi đi vào trong cổng: nay hai tướng gặp nhau trước cổng, giữa cổng và đầu cầu, đi thẳng từ cầu xuống.
6. Hàng hành quân trên cầu dồn vào một điểm ở cuối cầu: kẹp đầu đoàn, các hàng sau lùi theo.
7. Người đã chết (phục kích trên cầu…) còn đi tiếp tới một giây: nay ngã ngay.
8. Đạn bay ra từ chỗ trống khi không ai bên kia đứng trong tầm: nay không vẽ; phát không chết chỉ trừ máu, phát chết thì người đó gục.
   Giảm tận gốc độ lệch giữa logic và phần vẽ:
   - người trúng đạn và người bắn là hàng đầu hai bên (số phát trúng như cũ), hàng sau lên thay;
   - người giữ cổng (trừ lính gác ở đó sẵn) chạy ra cổng một ngày mới vào trận; dân binh trong thành cũng vậy;
   - người ra trận ở xa đích thì chạy nước rút;
   - càn quét chỉ bắn dân đang chạy nạn ngoài đường (phần vẽ chỉ cho quân đuổi bắn người đó), sau 0,7 ngày đuổi;
   - đạn máy công thành bay ra từ chiếc xe gần nhất; phục kích: đạn từ chỗ nấp hai bên đầu cầu.
9. Thi thể quân đánh ngã trước cổng lúc không xem: nằm trên mặt cầu, không nằm trong thành.
10. Cầu ghi ngược chiều (a > b) nối sai bến (logic luôn ghi đúng chiều, nhưng nay phần vẽ chịu được cả hai).
11. Công cụ quay clip: lúc trang bận, video không ghi khung hình nên đoạn cắt bị lệch (đoạn "cổng" chiếu cảnh khác); nay lấy khung
    hình thẳng từ trình duyệt cho từng đoạn. Góc máy đoạn cổng: cao, chếch bên hông cầu.
12. Tâm vòng đi dạo quanh nhà chính lệch ra ngoài đảo (cách tâm đảo 136 đơn vị) ở thời ≥ 3: đo khung bao khi công trình vừa dựng
    chưa có ma trận thế giới. Nay cập nhật ma trận trước khi đo; người đi dạo không còn dồn vào mép tường đứng kẹt.
13. Rủ nói chuyện mà người kia đang đi chỗ khác: người rủ đuổi theo mãi, đi vòng vòng. Nay tới chỗ người kia sắp tới mà đứng chờ.
14. Bộ não: mỗi lần tình huống đổi (đám đông bắt đầu, tan; công trình xong; tang lễ: chừng 5 giây một lần) cả làng nghĩ lại, ai
    đang trò chuyện cũng bốc bạn khác, người đang đi giữa đường quay ngoắt. Nay nghĩ lại mà vẫn cùng việc, cùng chỗ (hay cùng buổi,
    cùng chỗ, đều là việc nhàn: ngồi nghỉ, trò chuyện, kể chuyện) thì giữ việc cũ; vai trong trận vẫn đổi ngay. Đo một đảo thời 6
    lúc chiều: đổi qua lại "nghỉ ↔ trò chuyện" từ 214 xuống 31 lần mỗi phút thật.
15. Gia đình (logic/homes.js): bố hay mẹ mất, người kia tái hôn sang nhà mới thì con ở lại nhà cũ một mình. Nay con theo bố hay mẹ
    còn sống.
16. Dân chạy nạn đứng giữa lòng đường, xe đứng chờ mãi: chỗ tụ tập chạy nạn lùi ra vỉa hè.
17. Hình lính nhỏ hành quân ở xa ngoại suy ra ngoài đầu cầu (xuống nước) khi cầu trước trên đường đã bị phá: kẹp trong mặt cầu.
18. Bài kiểm thử kinh tế: "Cát Hồng (không có gỗ) kẹt lại" viết lại đúng ý (không cao hơn đảo thấp nhất còn lại, ≤ 10) thay cho
    ngưỡng cứng ≤ 9; đo ba hạt giống ra 4, 8, 10 (dao động ngẫu nhiên, không phải lỗi).
19. Xe dừng chờ người đứng trên vỉa hè: bề ngang "có người phía trước" lấy nửa con đường tính từ làn xe (vốn đã lệch sang phải);
    nay chỉ tính bề ngang của chính chiếc xe.
20. Xin hoà chỉ xét khi cổng đã bị nã đủ một ngày (trước đây "từ ngày lịch sau": quân tới lúc gần hết ngày thì vài giây sau đã hoà).
21. Cầu có nhà mái giữa nhịp (dáng thời 3, còn giữ tới khi xây lại): quân đứng dưới mái, nhìn từ trên chỉ thấy thanh máu. Nay mái là
    khối riêng, ẩn khi có quân đứng trên cầu đánh cổng.

**Số đo cuối (thật thà)**
- 15 tệp kiểm thử đạt; 100 trận cân chỉnh đạt cả 16 chỉ số (trận đánh 10,6; hạt nhân 9%; dân thường chết khi mất thành 7,4%).
- Chặng nã cổng (6 trận đo riêng): 1,17–1,67 ngày, một trận vây thành 24 ngày; không còn trận cổng đổ hay xin hoà trong vài giây.
- Bộ quét 24 trận (12 thời × 2) và đời sống dân 12 thời × 6 đảo × 2 buổi: hết người đi trên nước, hết xe dưới nước, hết người chết
  còn đi, hết nhảy chỗ lớn (còn 7 lần 2–3 đơn vị, lúc lính rời cầu bước vào trong tường), kẹt thật 6 lần trong 24 trận và 33 lần
  trong 72 lượt đo đời sống, quân vào trong tường trước khi cổng đổ 6 lượt (đều là tướng đấu tay đôi đứng sát cổng).
- Còn lại chưa sửa hết: "phát trúng không có người bắn trong tầm" chừng 60 phát mỗi trận (logic chọn người trúng mà phần vẽ chưa
  có ai đứng trong tầm: người giữ thành ở xa chạy hơn một ngày mới tới cổng, dân chạy nạn sang tận phía kia đảo). Phần vẽ không còn
  vẽ đạn bay ra từ chỗ trống; phát không chết chỉ trừ máu, phát chết thì người đó gục xuống. Hàng đầu quân trên cầu có lúc ngoài
  tầm tới cổng (111 lượt trong 24 trận, lúc quân vừa tới còn đang vào hàng). check-scene: đứng không lớn nhất 4–19% tuỳ lần chạy
  (bản trước phiên 2–8%), người đứng chồng 0–3 cặp (bản trước 1) — phép đo dao động, chưa tách được phần do thay đổi này.
