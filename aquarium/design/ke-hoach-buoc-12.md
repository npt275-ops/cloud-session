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
