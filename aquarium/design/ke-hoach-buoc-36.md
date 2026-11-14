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
