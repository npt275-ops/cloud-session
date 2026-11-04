# Bể Kính · Kiến trúc sáu đảo qua 12 thời

Nguyên tắc (chốt):

- **Hết thời nào thì mọi công trình và trang phục của thời đó đều được thay.** Sang thời mới, thợ (Lúa Vàng) hoặc thời gian
  (năm đảo kia) thay lần lượt từng công trình; công trình nào của thời trước chưa có cái thay thì mất khi công trình mới gần nó
  xong. Kỳ quan cũng thay bằng kỳ quan của thời mới ngay tại chỗ đó. Trang phục đổi ngay khi sang thời.
- **Tường chạy sát mép đảo**, theo đúng dáng mép, ngắt ở chỗ núi, hồ, sông, có cổng ở đầu các đường toả ra.
- **Càng về sau càng cao**: từ thời Hiện đại là chung cư, cao ốc; từ thời Robot AI trở đi là tháp cao 20 đến 30, mỗi đảo một kiểu.
- **Cao thấp xen kẽ, dáng lạ**: từ thời 3 có nhà nhỏ đứng xen giữa nhà chính của thời; từ thời 6 có thêm toà dáng lạ (cao ốc
  cánh hẫng, tháp đôi cầu nối, tháp nghiêng, tháp nấm, kim tự tháp ngược, tháp vòng, tháp xoắn ốc), mỗi thời một dáng khác,
  không hai đảo trùng trong một thời (render/build/isles/compose.js SMALL, ODD).
- **Công trình công cộng** (render/build/civic.js): trường học, thư viện, bảo tàng, bệnh viện, nhà hát, sân vận động, nhà tắm,
  đài thiên văn; mỗi loại bốn dáng theo giai đoạn, mỗi thời một bộ khác thời trước, ở cả sáu đảo.
- **Sáu đảo khác nhau ở mọi thời**: trong cùng một thời, không có hai đảo dùng chung kiểu nhà hay kiểu nhà chính; mỗi đảo một bảng
  màu theo bốn giai đoạn (xưa, cận đại, hiện đại, tương lai).

Bốn giai đoạn: xưa (1 đến 3: lều, nhà sàn, nhà đá, đền), cận đại (4, 5: nhà gỗ, nhà phố, xưởng), hiện đại (6 đến 8: chung cư, cao ốc,
tháp), tương lai (9 đến 12: tháp sống, tháp mặt trời, tháp xoắn, tháp nổi, tháp pha lê).

Lúa Vàng giữ bộ công trình riêng (render/build/plains/eNN.js). Năm đảo còn lại dùng bộ kiểu chung (render/build/isles/arch.js),
mỗi đảo một tệp chọn kiểu theo thời:

## Thông Xanh

| Cấp | Thời | Nhà riêng | Nhà chính | Kỳ quan |
|---|---|---|---|---|
| 1 | Thời đồ đá | Lều lá | Lều Tù Trưởng | Cây Thiêng |
| 2 | Cổ đại | Nhà sàn gỗ | Nhà Rông | Tượng Thần Rừng |
| 3 | Trung đại | Nhà dài mái cong | Đình Gỗ Bốn Tầng | Tháp Hạt Thông |
| 4 | Cận đại | Nhà khung gỗ | Lũy Gỗ Lớn | Chùa Trên Cây |
| 5 | Công nghiệp | Nhà phố gỗ | Toà Đồng Hồ Gỗ | Xưởng Cưa Khổng Lồ |
| 6 | Hiện đại | Cao ốc vườn mái xanh | Xưởng Giấy | Tháp Kiểm Lâm |
| 7 | Tên lửa | Cao ốc kính xanh | Trụ Sở Rừng | Vòm Rừng Kính |
| 8 | Robot AI | Tháp gỗ công nghệ | Kim Tự Tháp Kính Rừng | Tháp Dữ Liệu Rừng |
| 9 | Vật Chất Sống | Tòa cây sống | Nhà Cây Sống Rừng | Cây Mẹ |
| 10 | Mặt Trời Nhân Tạo | Tháp lá hứng nắng | Siêu Tháp Lá | Mặt Trời Lá |
| 11 | Bẻ Cong Không Gian | Tòa xoắn dây leo | Ngọn Rừng Pha Lê | Vành Lá Xanh |
| 12 | Siêu Việt | Tháp đĩa nổi xanh | Nhà Vòng Nổi Rừng | Rừng Lơ Lửng |

## Đá Mây

| Cấp | Thời | Nhà riêng | Nhà chính | Kỳ quan |
|---|---|---|---|---|
| 1 | Thời đồ đá | Lều da | Hang Tổ Tiên | Vòng Đá Đỉnh Núi |
| 2 | Cổ đại | Nhà vòm đá | Nhà Đá Tròn Núi | Cột Đá Khắc |
| 3 | Trung đại | Nhà đá bám vách | Thành Đá | Tu Viện Vách Đá |
| 4 | Cận đại | Nhà mái chùa | Chùa Mây Bốn Tầng | Pháo Đài Núi |
| 5 | Công nghiệp | Nhà gỗ đá | Nhà Vòm Núi | Cổng Đá Mây |
| 6 | Hiện đại | Tháp bám đá núi | Toà Đồng Hồ Núi | Mỏ Lớn Ống Khói |
| 7 | Tên lửa | Tháp kim núi | Siêu Tháp Núi | Đài Phát Sóng Đỉnh Núi |
| 8 | Robot AI | Tháp bậc thang núi | Trụ Sở Kính Núi | Bệ Phóng Núi |
| 9 | Vật Chất Sống | Tháp vòm chồng núi | Nhà Vòng Nổi Núi | Lõi Dữ Liệu Trong Núi |
| 10 | Mặt Trời Nhân Tạo | Tháp đĩa nổi núi | Kim Tự Tháp Kính Núi | Người Đá Thức Tỉnh |
| 11 | Bẻ Cong Không Gian | Tháp mặt trời núi | Quả Cầu Mây | Thang Lên Trời |
| 12 | Siêu Việt | Tháp thạch anh | Ngọn Thạch Anh | Vành Mây Đá |

## Tuyết Trắng

| Cấp | Thời | Nhà riêng | Nhà chính | Kỳ quan |
|---|---|---|---|---|
| 1 | Thời đồ đá | Nhà băng tròn | Nhà Băng Lớn | Mũi Băng Thiêng |
| 2 | Cổ đại | Lều da tuần lộc | Lều Da Lớn | Vòng Đá Băng |
| 3 | Trung đại | Nhà vòm tuyết | Nhà Rông Băng | Tượng Băng |
| 4 | Cận đại | Nhà dài mái cong tuyết | Vòm Sưởi | Pháo Đài Tuyết |
| 5 | Công nghiệp | Chung cư tuyết | Xưởng Lớn Băng | Tháp Chuông Tuyết |
| 6 | Hiện đại | Cao ốc kính tuyết | Nhà Vòm Băng | Lò Hơi Lớn |
| 7 | Tên lửa | Tháp vòm chồng tuyết | Kim Tự Tháp Kính Băng | Tháp Cực Quang |
| 8 | Robot AI | Tháp băng | Siêu Tháp Băng | Vòm Băng Ấm |
| 9 | Vật Chất Sống | Tòa xoắn tuyết | Quả Cầu Cực Quang | Tháp Dữ Liệu Lạnh |
| 10 | Mặt Trời Nhân Tạo | Tháp kim tuyết | Nhà Vòng Nổi Băng | Mặt Trời Băng |
| 11 | Bẻ Cong Không Gian | Tháp đĩa cực quang | Nhà Cây Sống Băng | Vành Cực Quang |
| 12 | Siêu Việt | Tòa sinh học tuyết | Lõi Tuyết Sáng | Thành Băng Lơ Lửng |

## Cửa Sóng

| Cấp | Thời | Nhà riêng | Nhà chính | Kỳ quan |
|---|---|---|---|---|
| 1 | Thời đồ đá | Nhà sàn biển | Nhà Thuyền Úp | Vòng Đá Ven Biển |
| 2 | Cổ đại | Nhà dài mái cong biển | Nhà Vỏ Cây Ven Biển | Tượng Thần Biển |
| 3 | Trung đại | Nhà mái chùa biển | Đền Sóng | Hải Đăng Lớn |
| 4 | Cận đại | Nhà phố biển | Nhà Kho Cảng | Cổng Biển |
| 5 | Công nghiệp | Nhà dài mái cong biển | Trụ Sở Kính Biển | Tháp Chuông Cảng |
| 6 | Hiện đại | Tháp ban công sóng biển | Siêu Tháp Biển | Xưởng Tàu Khổng Lồ |
| 7 | Tên lửa | Tháp buồm biển | Quả Cầu Biển | Tháp Ngắm Biển |
| 8 | Robot AI | Cao ốc kính biển | Ngọn Pha Lê Biển | Bệ Phóng Trên Biển |
| 9 | Vật Chất Sống | Tháp bậc thang biển | Siêu Tháp Sóng | Vòm Đại Dương |
| 10 | Mặt Trời Nhân Tạo | Tòa xoắn biển | Quả Cầu Sóng | Mặt Trời Biển |
| 11 | Bẻ Cong Không Gian | Tháp pha lê biển | Nhà Vòng Nổi Biển | Cổng Sóng |
| 12 | Siêu Việt | Tháp mặt trời biển | Kim Tự Tháp Kính Biển | Vành Sóng |

## Cát Hồng

| Cấp | Thời | Nhà riêng | Nhà chính | Kỳ quan |
|---|---|---|---|---|
| 1 | Thời đồ đá | Nhà vòm cát hồng | Nhà Đá Tròn | Cột Đá Mặt Trời |
| 2 | Cổ đại | Nhà gạch đất cát hồng | Đền Bậc Thang Cát | Kim Tự Tháp Hồng |
| 3 | Trung đại | Lều vải lớn cát hồng | Lều Lớn Cát | Tượng Người Gác Cát |
| 4 | Cận đại | Nhà đá mái bằng | Toà Đồng Hồ Cát | Cổng Sa Mạc |
| 5 | Công nghiệp | Nhà gạch đất cát hồng | Thành Cát | Tháp Chuông Cát |
| 6 | Hiện đại | Toà sân trong tháp gió cát hồng | Trụ Sở Kính Cát | Tháp Nước Lớn |
| 7 | Tên lửa | Tháp bậc vườn treo | Toà Thị Chính | Tháp Gió |
| 8 | Robot AI | Tháp vòm chồng cát hồng | Quả Cầu Cát | Bệ Phóng Sa Mạc |
| 9 | Vật Chất Sống | Tháp mặt trời cát hồng | Ngọn Pha Lê Cát | Vòm Ốc Đảo |
| 10 | Mặt Trời Nhân Tạo | Cao ốc kính cát hồng | Nhà Cây Sống Cát | Mặt Trời Sa Mạc |
| 11 | Bẻ Cong Không Gian | Tháp kim cát hồng | Kim Tự Tháp Kính Hồng | Thang Lên Sao |
| 12 | Siêu Việt | Tòa xoắn cát hồng | Nhà Cây Sống Cát | Thành Phố Cát Bay |
