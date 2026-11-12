# Đề xuất · Quái vật biển và NPC biến dị dưới đáy bể (chưa làm, chờ chọn)

Tất cả là thiết kế riêng của Bể Kính. Dáng low-poly cùng kiểu với đảo và phế tích, dựng được bằng khối có sẵn.

## Chuyện nền

Ba nền văn minh dưới đáy bể chìm từ trước thời đồ đá. Người sống sót không lên được mặt nước, đời này qua đời khác biến đổi
theo nơi ở: người ở thành vỏ ốc mọc vỏ, người ở vườn treo mọc san hô, người canh hầm mất màu và mắt to dần. Quái vật là thú
của nền văn minh cũ, lớn lên trong bóng tối.

Có thể nối với trận trên mặt nước: từ thời 7 (tên lửa, hạt nhân), mỗi quả hạt nhân rơi xuống biển làm "nước nhiễm" tăng; nước
càng nhiễm thì quái vật thức dậy càng nhiều, NPC biến dị đổi dáng mạnh hơn. Thời 9 trở đi người trên đảo chế tạo được tàu lặn,
lần đầu gặp người dưới đáy (giao thương, chiến tranh, hay chiếm phế tích).

## Quái vật biển

| # | Tên | Dáng (nhìn xa nhận ra ngay) | Cỡ | Sống ở | Hành vi |
|---|---|---|---|---|---|
| Q1 | Rồng Lươn Đèn | thân dài nhiều đốt thon dần, hai hàng đốm sáng dọc sườn, đầu có diềm vây xoè và một cần câu đèn treo trước miệng | dài 50–60 | lượn qua ba đường hầm, vòng quanh chân núi | bơi uốn lượn theo hình sin; đèn câu sáng, đi tới đâu tường hầm sáng tới đó; tránh ánh sáng mạnh |
| Q2 | Cua Pháo Đài | cua khổng lồ cõng trên lưng một mảnh phế tích (một tháp ốc vặn gãy, hay một vòm) thay cho mai | ngang 20–25 | lòng rãnh Thành Vỏ Ốc | bò chậm, dừng lại ẩn thành "một công trình"; càng gắp đá vụn xếp lại |
| Q3 | Sứa Vòm | chuông trong mờ hình vòm, viền sáng, hàng chục tua sáng dài rủ xuống | chuông 18, tua 40 | trên cao giữa các tháp, quanh đảo đá lơ lửng | trôi lên xuống, chuông co giãn theo nhịp; đàn 3–5 con, ban đêm sáng hơn |
| Q4 | Cá Đuối Bóng Tối | cánh phẳng hình thoi rất rộng, mép cánh sáng mờ, đuôi roi dài | sải cánh 30–35 | lướt sát mặt rãnh giữa ba phế tích | lượn vòng chậm, bóng phủ lên phế tích bên dưới; lặng lẽ, hiếm thấy |
| Q5 | Mắt Vực | một con mắt khổng lồ nằm giữa vòng tua đá như cột, tua cuộn mở theo nhịp | vòng 30 | hố sâu nhất, giữa vòng cột của Đô Thị Đá Khổng Lồ | không di chuyển; mắt quay theo máy quay khi lặn tới gần; tua cuộn lại khi bị nhìn lâu |

## NPC biến dị

| # | Tên | Dáng | Sống ở | Đời sống |
|---|---|---|---|---|
| N1 | Người Vây | nửa trên người, nửa dưới đuôi cá; vây lưng chạy dọc sống lưng, mang sáng ở cổ; cầm giáo ba nhánh bằng xương | Thành Vỏ Ốc Xà Cừ (ở nhà vỏ ốc nhỏ) | đi tuần quanh quảng trường, săn cá, gác cổng xương sườn |
| N2 | Người Ốc | người còng lưng, một vỏ ốc xoắn mọc trên lưng; lúc sợ thì rút vào vỏ, chỉ còn cái vỏ nằm im | Thành Vỏ Ốc Xà Cừ | thợ: mài xà cừ, sửa vỏ nhà; chậm chạp, đi theo đàn |
| N3 | Người San Hô | thân nửa người nửa san hô, nhánh san hô mọc từ vai và đầu, đốm sáng nhỏ trên da | Vườn Treo Bậc Thang | chăm vườn tảo, đứng lâu một chỗ (khó phân biệt với cây); hát (âm thanh) |
| N4 | Người Canh Hầm | gầy, da trắng bệch, mắt to tròn phát sáng, ngón tay dài, cầm đèn đá sáng | ba đường hầm | đứng sau cánh cửa hé, ai tới thì lùi vào; mở hay đóng cửa hầm (cửa đóng là có lý do) |
| N5 | Người Rêu Đá | to lớn, da như đá phủ rêu, cử động chậm như tượng sống dậy | Đô Thị Đá Khổng Lồ | đứng bất động như tượng, thỉnh thoảng đổi tư thế; khắc chữ sáng lên bia |
| N6 | Người Sứa | đầu là một chuông sứa trong mờ, thân mảnh, tay như tua | khắp đáy bể, trôi giữa các phế tích | đưa tin giữa ba phế tích qua đường hầm; không nói, chỉ sáng nhấp nháy |

## Cách làm (kỹ thuật)

- NPC biến dị dùng lại khung người của game (`render/rig3d.js`, cử chỉ `render/gestures3d.js`), thay hay gắn thêm phần: đuôi
  cá thay chân (N1, N6), vỏ ốc trên lưng (N2), nhánh san hô (N3), mắt to, ngón dài (N4), da đá và cỡ lớn (N5). Logic sống riêng,
  đơn giản hơn người trên đảo (chỗ ở, việc, giờ), chạy cùng đồng hồ của bể.
- Quái vật dựng bằng khối, chuyển động bằng shader (uốn thân, co chuông, đập cánh) hay các đốt nối nhau, không cần khung xương.
- Chỉ vẽ khi máy quay ở dưới nước (như lòng hầm) để không nặng thêm lúc xem từ trên.

## Cần chọn

1. Làm trước những con nào (đề nghị: Q1 Rồng Lươn Đèn, Q3 Sứa Vòm, N1 Người Vây, N2 Người Ốc: hợp với Thành Vỏ Ốc vừa làm,
   thấy rõ khi lặn xuống).
2. Có nối với trận trên mặt nước không (nước nhiễm sau hạt nhân, tàu lặn thời 9), hay để đáy bể là một thế giới riêng để ngắm.
3. Quái vật có đánh nhau với NPC biến dị không, hay chỉ sống chung.
4. Mỗi phế tích bao nhiêu người biến dị (đề nghị 12–20).
