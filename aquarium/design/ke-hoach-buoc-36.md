# Bước 36 · Máy quay chính mượt (sau vai, lúc nhập hồn)

Người chơi: máy quay khi nhân vật di chuyển ("máy quay chính") bị giật, nhức mắt; rê chuột cũng không mượt.

## Nguyên nhân (đo bằng tools: ghi chỗ nhân vật trên màn hình mỗi khung hình khi giữ W, khi rê chuột đều)

1. **Rê chuột**: hướng nhìn quay ngay theo chuột, còn chỗ đặt máy quay đuổi theo bằng hệ số trễ: nhân vật văng ra rồi trượt
   về giữa màn hình. Đo được nhân vật dời trung bình 20,6 điểm ảnh mỗi khung, có lúc 68 (khung 480 × 320).
2. **Đi lại**: độ trễ của phép đuổi theo phụ thuộc độ dài từng khung hình (16 ms, 33 ms xen kẽ): nhân vật rung tới lui vài
   điểm ảnh trên màn hình, rõ nhất khi chạy.
3. **Tường che**: khoảng cách máy quay nhảy theo nấc 10%, kéo vào thì nâng góc nhìn lên: nhân vật nhảy chỗ trên màn hình
   (đo được 45 điểm ảnh trong một khung).

## Sửa (game/possess-cam.js, tệp mới; game/possess.js dùng nó cho pha mở mắt và lúc ở trong thân)

| Phần | Cách làm |
|---|---|
| Ngang | Máy quay gắn cứng theo nhân vật: không trễ, không phụ thuộc độ dài khung hình |
| Đứng | Chỉ độ cao điểm bám đi qua làm mượt (nhảy, dốc, bậc đất) |
| Xoay | Chuột đặt hướng đích, hướng thật theo sau rất nhanh (32 mỗi giây, hàm mũ theo giờ thật): mượt dù sự kiện chuột đến không đều, cùng kết quả ở mọi tốc độ khung hình |
| Tường che | Khoảng cách là một số làm mượt (vào 9, ra 2,2 mỗi giây), kiểm tra 20 điểm thay vì 10; máy quay trượt dọc đường thẳng từ nhân vật ra chỗ đặt đầy đủ và giữ nguyên hướng nhìn, nên nhân vật đứng đúng một chỗ trên màn hình, chỉ to lên. Bỏ nâng máy quay (LIFT) |
| Đất | Mặt đất dưới máy quay làm mượt |

## Kết quả đo (cùng cách đo)

| Cảnh | Trước | Sau |
|---|---|---|
| Rê chuột, lệch chuẩn chỗ nhân vật (ngang, dọc) | 29,9 và 14,7 điểm ảnh | 0,00 và 0,87 |
| Rê chuột, dời trung bình mỗi khung | 20,6 điểm ảnh (lớn nhất 68) | 0,83 (lớn nhất 1,5) |
| Đi thẳng, lệch chuẩn ngang | 0,11 | 0,00 |

(Phần dọc còn lại chừng 1 điểm ảnh là nhân vật tự nhún theo bước, không phải máy quay.)

Kiểm thử: test/possess-cam.test.js (nhân vật đứng yên trên màn hình khi đi với độ dài khung hình lẫn lộn; tường che không làm
nhân vật nhảy chỗ, hướng nhìn giữ nguyên; xoay cùng kết quả ở 120, 30, 10 khung hình mỗi giây; nhảy: máy quay theo sau mượt).

## Lần 2: khung hình khựng định kỳ (người chơi vẫn thấy giật sau khi máy quay đã mượt)

Đo thời gian từng phần mỗi khung hình khi đang nhập hồn và chạy (máy vẽ bằng phần mềm, chậm hơn máy thật vài lần nhưng tỉ lệ
giữ nguyên): khung khựng tới 120 ms, do:

| Phần | Khựng lớn nhất trước | Sửa | Sau |
|---|---|---|---|
| Thân mềm (render/body/softbody3d.js) | 103 ms: người mới vào gần thì dựng thân ngay, có khi nhiều người cùng lúc | Mỗi khung hình dựng tối đa 1 người (hàng chờ); người ra xa giữ lại thân (ẩn), quay lại dùng ngay; hình khối gốc dùng lại | 22 ms (một người, máy chậm) |
| Cỏ, sỏi, hoa (render/near3d.js) | 102 ms: dời 3 đơn vị là tính lại cả vòng cỏ | Mỗi ô tính một lần rồi nhớ; mỗi lần ghép chỉ tính tối đa 6 ô mới, ô gần trước; lần đầu (lúc mở mắt) dựng hết | 12 ms |
| Đồ chơi thu nhỏ (render/style/diorama3d.js) | 28 ms: quét cả cảnh mỗi 2 giây | Quét theo ngăn xếp, mỗi khung hình tối đa 400 khối | 1,4 ms |
| Chất lượng tự chỉnh (render/perf3d.js) | Bóng đổi 2048 ↔ 1024 qua lại (chỉ độ nét có thời gian chờ) | Vừa hạ chất lượng thì 45 giây không nâng gì | |
| Bóng người quanh mình | Đứng yên thì bóng cập nhật cách 2, 3 khung hình (bóng người đi quanh giật) | Lúc nhập hồn cập nhật mỗi khung hình (vùng bóng nhỏ) | |

Khung khựng nặng nhất phần JS: 120 ms → 34 ms.

## Lần 3: màn hình thỉnh thoảng zoom nhỏ rồi trở lại trong gần 1 giây (người chơi báo, máy tính)
- Đo: ghi góc nhìn mỗi khung hình lúc nhập hồn: cứ khoảng 1,3 giây góc nhìn tụt từ 66° xuống 57° rồi bò về 66°. Bắt kẻ đặt góc
  nhìn (gài bẫy đọc ngăn xếp): render/perf3d.js (bộ điều tốc đổi độ nét theo tốc độ khung hình) gọi render/scene3d.js
  resize(), hàm này đặt lại góc nhìn về 34°/50° (góc nhìn thượng đế). Kẻ thứ hai: render/deep3d.js mỗi khung hình kéo góc
  nhìn về 34° (khung hình chậm thì kéo mạnh).
- Sửa: lúc nhập hồn (BK.possessActive, game/possess.js) hai chỗ đó không đụng góc nhìn. Đo lại: góc nhìn đứng yên 66° suốt.
- Độ nét chập chờn người chơi thấy cũng từ bộ điều tốc đó (đổi độ nét mỗi lần máy chậm, nhanh); góc nhìn không còn giật theo.
- Máy quay chính rộng hơn nữa (người chơi chốt): lùi 4,9 → 6,2, cao 0,85 → 1,05, góc nhìn 58 → 66.
- Tường che: phải bị che liền 0,25 giây máy quay mới vào gần (game/possess-cam.js BLOCK): cột, mái, cây lướt qua không còn làm
  máy quay giật vào rồi lùi ra.
- Máy tính: bấm W A S D là chạy (7,5), giữ Shift thì đi chậm (2,2); dưới nước Shift vẫn là lặn (ui/possess-ctl.js st.dive).
