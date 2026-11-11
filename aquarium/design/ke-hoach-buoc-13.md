# Bể Kính · Kế hoạch bước 13

Bản này giữ hai phần cho bước tới: (I) ba việc nền đã chốt sau bước 12; (II) phương pháp đạt trải nghiệm hình ảnh tốt nhất,
rút từ việc so Bể Kính với ba ảnh tham chiếu người chơi gửi (game Nha Trang 3D, ảnh quảng trường Đà Lạt, thành phố isometric)
và bản trả lời của một AI khác về chênh lệch đồ hoạ.

---

## I. Ba việc nền giữ lại (đã chốt)

1. **Logic biết vị trí thô.** Mỗi người ở một vùng ("ở nhà / trên đường / tại cổng / trên cầu / trong thành") và mất thời gian
   thật để đi giữa các vùng. Logic chỉ cho bắn, trúng, chết khi hai bên ở vùng bắn tới nhau. Xoá cả lớp lỗi "logic nói một đằng,
   hình vẽ một nẻo" (hiện còn chừng 60 phát trúng lệch mỗi trận, đang vá bằng khoảng trễ ước lượng JOIN_DAYS, CIV_CHASE).
2. **Bộ quét lỗi là bước bắt buộc.** `tools/bug-hunt.js` có ngưỡng đạt / không đạt như bộ cân chỉnh, chạy trước mỗi lần phát
   hành; số đo dao động (check-scene) thì đo nhiều lần lấy trung vị. Lỗi cũ không lặng lẽ quay lại.
3. **Chốt hướng đi: bể để ngắm hay trò chơi.** Hai hướng cần hai kiểu đầu tư khác nhau. Phần hình ảnh dưới đây viết cho hướng
   "bể để ngắm" (mô hình thu nhỏ sống động); nếu chọn trò chơi thì thêm giao diện quyền năng và mục tiêu, phần hình vẫn dùng được.

---

## II. Hình ảnh: phân tích

### 1. Ba ảnh tham chiếu thật ra là ba thứ khác nhau

| Ảnh | Thực chất | Vì sao trông đẹp | Bể Kính học được gì |
|---|---|---|---|
| Nha Trang 3D | 3D thời gian thực, mô hình và ảnh dán có sẵn (hay do AI sinh), máy quay ngang tầm người | Địa danh quen, mặt tường có ảnh dán cửa sổ, tỉ lệ người–nhà đúng | Tỉ lệ người–nhà, chi tiết nhỏ trên mặt tường. Không học: ảnh dán thật, mô hình nhập ngoài |
| Quảng trường Đà Lạt | Gần như chắc là **ảnh vẽ / ảnh AI** có chồng giao diện, không phải khung hình game chạy thật | Ánh sáng, mật độ, màu của một bức tranh | Chỉ dùng làm bảng màu và mật độ mơ ước. Không thể và không nên đuổi theo |
| Thành phố isometric | **Tranh 2D vẽ sẵn**, máy quay cố định, rất nhẹ lúc chạy | Bảng màu thống nhất, viền nét, mỗi nhà đầy chi tiết nhỏ (mái ngói, cửa, mái hiên), mật độ cao | Đây là đích hợp nhất: **mô hình thu nhỏ**. Học bảng màu, mật độ, chi tiết; không học cách làm (tranh vẽ tay) |

### 2. Bản trả lời của AI kia: đúng và sai

- Đúng: không cần chuyển sang tả thực; giữ khối ít đa giác, nâng bằng bảng màu, ánh sáng, hiệu ứng.
- Sai hay không hợp Bể Kính:
  - Coi hình của Bể Kính là "hình tạm để thử cơ chế". Không phải: Bể Kính dựng toàn bộ hình bằng code (6 đảo × 12 thời), không
    có kho mô hình; mọi cải thiện phải làm được bằng quy tắc dựng, không phải bằng cách "nhập asset".
  - Bloom, SSAO, làm mờ hậu cảnh, ảnh dán PBR 2K: nặng trên điện thoại, và không chữa đúng bệnh. Bệnh của Bể Kính không nằm ở
    thiếu hậu kỳ.
  - Con số "tăng 200–300%" không có cơ sở.

### 3. Bệnh thật của Bể Kính (nhìn từ ảnh chụp hiện trạng: thời 3, 6, 11)

1. **Mặt phẳng lớn một màu.** Tường nhà là hộp to kẻ sọc, nền đảo một màu; mắt không có gì để bám. Đây là chênh lệch lớn nhất
   với ảnh isometric, nơi không mặt nào rộng mà trống.
2. **Vật không "ngồi" xuống đất.** Bóng đổ mờ hay không thấy, không có vùng tối ở chân tường, dưới mái, dưới chân người: mọi thứ
   như trôi.
3. **Tỉ lệ sai.** Người cao 1,4 đơn vị đứng cạnh những khối nhà khổng lồ không cửa: nhìn như xếp hình, không như phố có người ở.
4. **Bảng màu không có trật tự sáng tối.** Mùa đông đảo trắng bệch (nền, mái, tường cùng một độ sáng); thời 11 cả đảo một màu
   tím; người lẫn vào nền.
5. **Thưa.** Giữa các nhà là khoảng trống; ít vật nhỏ (hàng rào, thùng, ghế, bồn hoa, biển hiệu).
6. **Máy quay và che khuất.** Khung dọc điện thoại hẹp; mái, trụ cầu che người (đã gặp ở bước 12).
7. **Ít chuyển động nền.** Ngoài người và xe, cảnh đứng yên.

Kết luận: chênh lệch không nằm ở số đa giác hay engine, mà ở **chỉ đạo mỹ thuật** (màu, sáng tối, tỉ lệ) và **mật độ chi tiết
nhỏ**. Cả hai đều làm được bằng code, nhẹ, và hợp với cái tên: một *mô hình thu nhỏ trong bể kính*.

---

## III. Hình ảnh: phương pháp

### Nguyên tắc

- **Một hướng mỹ thuật duy nhất: mô hình thu nhỏ thủ công** (như sa bàn, nhà đồ chơi gỗ sơn): khối đơn giản, màu ấm có trật tự,
  chi tiết nhỏ dày, bóng mềm rõ. Không tả thực, không ảnh dán thật, không nhập mô hình ngoài.
- **Làm một lát cắt mẫu trước, duyệt rồi mới nhân rộng.** Một đảo × một thời × ban ngày (đề nghị Lúa Vàng thời 3) làm tới mức
  người chơi chấm ≥ 8/10, rồi mới áp quy tắc cho 71 tổ hợp còn lại. Các bước trước sửa dàn trải nên không cái nào tới nơi.
- **Mọi thứ là quy tắc dựng dùng chung**, không tô tay từng nhà: sửa một chỗ, 6 đảo × 12 thời cùng lên.
- **Có ngân sách hiệu năng và đo trước, sau** (điện thoại tầm trung, khung dọc): đo số lượt vẽ, số tam giác, ms mỗi khung bằng công
  cụ đo 4 cảnh sẵn có; mỗi lớp thêm vào không làm tụt quá ngưỡng đã chốt ở lát cắt mẫu.
- **Duyệt bằng mắt người chơi, trên ảnh cố định.** Một "bộ ảnh chuẩn" 12 khung (toàn đảo, phố, cận người, trận ở cầu; ngày và
  chiều; khung dọc) chụp lại sau mỗi lớp, đặt cạnh ảnh trước đó.

### Thứ tự làm (mỗi lớp xong thì chụp bộ ảnh chuẩn, người chơi duyệt)

**Lớp 1 · Màu và sáng tối (rẻ nhất, đổi cả cảnh)**
- Một tệp bảng màu duy nhất cho đảo × thời: nền, hai màu tường, màu mái nhấn, cây, màu bóng, màu sáng. Luật: nền luôn tối hơn
  và đậm hơn tường; mái là màu nhấn; không có trắng tinh, đen tinh; người luôn tách khỏi nền.
- Sửa các ca hỏng đã thấy: mùa đông (tuyết ngả lam nhạt, mái và tường vẫn giữ màu), thời 10–12 (hai màu đối nhau thay vì một
  màu tím).
- Nắng ấm, bóng ngả lam; sương xa theo màu trời cho có chiều sâu.

**Lớp 2 · Cho vật ngồi xuống đất (bóng)**
- Khung bóng đổ ôm vừa đảo đang xem (bản đồ bóng hiện trải rộng nên mờ).
- Tối giả nướng sẵn vào màu đỉnh: chân tường, dưới mái hiên, góc trong tối dần (không tốn gì lúc chạy).
- Bóng tròn mềm dưới chân người, xe, cây (một khối lặp).

**Lớp 3 · Chi tiết nhỏ trên mặt (lớp tạo khác biệt lớn nhất)**
- Bộ chi tiết nhà dùng chung: cửa đi, cửa sổ có khung và bậu, mái hiên, gờ chân tường, gờ mái, ngói có gân, ống khói, biển hiệu,
  ban công. Luật: không mặt tường nào rộng quá một ngưỡng mà không có chi tiết.
- Hoạ tiết tự vẽ lúc tải (Canvas 2D, ô 128 điểm ảnh: ngói, gạch, ván gỗ, đá lát): vài chục KB, nguyên bản, phá mặt phẳng một màu.
- Nền: vỉa hè khác màu lòng đường, sân lát có hoa văn, cỏ lốm đốm.

**Lớp 4 · Tỉ lệ và mật độ**
- Một tầng nhà cao chừng 1,6 lần người; cửa đi cao hơn người một chút; nhà thấp và nhiều hơn thay cho ít khối khổng lồ.
- Rải vật nhỏ theo loại khu (khối lặp): hàng rào, thùng, xe đẩy, ghế, bồn hoa, đèn, dây phơi, sạp hàng. Vẫn theo luật đặt chỗ đã
  có (không chồng, không ra ngoài đảo, không chặn đường).

**Lớp 5 · Chuyển động nền và hiệu ứng**
- Cây và cờ đung đưa, khói bếp, bóng mây trôi trên đảo, sóng bạc đầu ven bờ, chim.
- Trận: chớp đầu nòng, khói bụi, tia lửa trúng đích, mảnh vỡ cổng (hạt nhỏ dùng lại, có trần số lượng).

**Lớp 6 · Máy quay và che khuất**
- Góc mặc định gần và thấp hơn cho khung dọc; vài góc đặt sẵn để người chơi bấm (không tự đổi góc).
- Vật che giữa máy quay và chỗ đang xem thì mờ đi (mái, trụ cầu, tầng trên), làm thành luật chung.
- Viền mờ tối quanh khung (CSS) cho cảm giác nhìn qua kính.

**Tuỳ chọn, chỉ khi máy còn dư sức:** toả sáng cho thời neon, bật theo bộ điều tiết hiệu năng. Không làm SSAO, không làm mờ hậu cảnh.

### Không làm

- Tả thực, ảnh dán thật, mô hình nhập ngoài (lệch phong cách, nặng, không còn nguyên bản).
- Đuổi theo ảnh quảng trường Đà Lạt (đó là tranh).
- Thêm tính năng mới trong lúc làm hình.

### Mức đạt được (nói trước cho đúng kỳ vọng)

Làm hết sáu lớp, Bể Kính có thể tới mức mô hình thu nhỏ có phong cách, rõ ràng, sống động (kiểu Townscaper, Islanders, Bad North),
chạy mượt trên điện thoại. Không tới mức tranh vẽ như ảnh Đà Lạt, và không cần.
