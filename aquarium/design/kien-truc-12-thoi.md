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
- **Nhà chính lên cấp đều**: mỗi đảo một dòng nhà chính riêng (render/build/isles/halls.js), thời sau luôn to và hiện đại
  hơn thời trước, không dùng chung với đảo khác.
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
| 3 | Trung đại | Nhà dài mái cong | Đình Gỗ Ba Tầng | Tháp Hạt Thông |
| 4 | Cận đại | Nhà khung gỗ | Đình Gỗ Có Tháp | Chùa Trên Cây |
| 5 | Công nghiệp | Nhà phố gỗ | Toà Gỗ Năm Tầng | Xưởng Cưa Khổng Lồ |
| 6 | Hiện đại | Cao ốc vườn mái xanh | Toà Gỗ Kính | Tháp Kiểm Lâm |
| 7 | Tên lửa | Cao ốc kính xanh | Tháp Phóng Quả Thông | Vòm Rừng Kính |
| 8 | Robot AI | Tháp gỗ công nghệ | Bộ Não Rừng | Tháp Dữ Liệu Rừng |
| 9 | Vật Chất Sống | Tòa cây sống | Cây Mẹ Sống | Cây Mẹ |
| 10 | Mặt Trời Nhân Tạo | Tháp lá hứng nắng | Hoa Mặt Trời | Mặt Trời Lá |
| 11 | Bẻ Cong Không Gian | Tòa xoắn dây leo | Thân Cây Xoắn Kép | Vành Lá Xanh |
| 12 | Siêu Việt | Tháp đĩa nổi xanh | Cây Thế Giới | Rừng Lơ Lửng |

## Đá Mây

| Cấp | Thời | Nhà riêng | Nhà chính | Kỳ quan |
|---|---|---|---|---|
| 1 | Thời đồ đá | Lều da | Hang Tổ Tiên | Vòng Đá Đỉnh Núi |
| 2 | Cổ đại | Nhà vòm đá | Nhà Đá Tròn | Cột Đá Khắc |
| 3 | Trung đại | Nhà đá bám vách | Đền Đá Lục Giác | Tu Viện Vách Đá |
| 4 | Cận đại | Nhà mái chùa | Pháo Đài Núi | Pháo Đài Núi |
| 5 | Công nghiệp | Nhà gỗ đá | Toà Đá Năm Tầng | Cổng Đá Mây |
| 6 | Hiện đại | Tháp bám đá núi | Toà Đá Kính | Mỏ Lớn Ống Khói |
| 7 | Tên lửa | Tháp kim núi | Đài Thiên Văn Đỉnh Núi | Đài Phát Sóng Đỉnh Núi |
| 8 | Robot AI | Tháp bậc thang núi | Lõi Đá Tư Duy | Bệ Phóng Núi |
| 9 | Vật Chất Sống | Tháp vòm chồng núi | Núi Sống | Lõi Dữ Liệu Trong Núi |
| 10 | Mặt Trời Nhân Tạo | Tháp đĩa nổi núi | Lò Mặt Trời | Người Đá Thức Tỉnh |
| 11 | Bẻ Cong Không Gian | Tháp mặt trời núi | Núi Ngược Lơ Lửng | Thang Lên Trời |
| 12 | Siêu Việt | Tháp thạch anh | Ngọn Thạch Anh Vĩnh Cửu | Vành Mây Đá |

## Tuyết Trắng

| Cấp | Thời | Nhà riêng | Nhà chính | Kỳ quan |
|---|---|---|---|---|
| 1 | Thời đồ đá | Nhà băng tròn | Nhà Băng Lớn | Mũi Băng Thiêng |
| 2 | Cổ đại | Lều da tuần lộc | Lều Da Lớn | Vòng Đá Băng |
| 3 | Trung đại | Nhà vòm tuyết | Đền Vòm Băng | Tượng Băng |
| 4 | Cận đại | Nhà dài mái cong tuyết | Thành Vòm Băng | Pháo Đài Tuyết |
| 5 | Công nghiệp | Chung cư tuyết | Toà Vòm Năm Tầng | Tháp Chuông Tuyết |
| 6 | Hiện đại | Cao ốc kính tuyết | Toà Vòm Kính | Lò Hơi Lớn |
| 7 | Tên lửa | Tháp vòm chồng tuyết | Trạm Vệ Tinh Cực | Tháp Cực Quang |
| 8 | Robot AI | Tháp băng | Bộ Óc Băng | Vòm Băng Ấm |
| 9 | Vật Chất Sống | Tòa xoắn tuyết | Hoa Băng Sống | Tháp Dữ Liệu Lạnh |
| 10 | Mặt Trời Nhân Tạo | Tháp kim tuyết | Lăng Kính Mặt Trời | Mặt Trời Băng |
| 11 | Bẻ Cong Không Gian | Tháp đĩa cực quang | Lăng Kính Không Gian | Vành Cực Quang |
| 12 | Siêu Việt | Tòa sinh học tuyết | Cung Điện Băng Bay | Thành Băng Lơ Lửng |

## Cửa Sóng

| Cấp | Thời | Nhà riêng | Nhà chính | Kỳ quan |
|---|---|---|---|---|
| 1 | Thời đồ đá | Nhà sàn biển | Nhà Thuyền Úp | Vòng Đá Ven Biển |
| 2 | Cổ đại | Nhà dài mái cong biển | Nhà Vỏ Cây | Tượng Thần Biển |
| 3 | Trung đại | Nhà mái chùa biển | Đền Sóng Ba Tầng | Hải Đăng Lớn |
| 4 | Cận đại | Nhà phố biển | Toà Cảng Có Tháp | Cổng Biển |
| 5 | Công nghiệp | Nhà dài mái cong biển | Toà Cảng Năm Tầng | Tháp Chuông Cảng |
| 6 | Hiện đại | Tháp ban công sóng biển | Toà Buồm Kính | Xưởng Tàu Khổng Lồ |
| 7 | Tên lửa | Tháp buồm biển | Cảng Phi Thuyền | Tháp Ngắm Biển |
| 8 | Robot AI | Cao ốc kính biển | Ngọc Trai Trí Tuệ | Cảng Phi Thuyền |
| 9 | Vật Chất Sống | Tháp bậc thang biển | Sứa Khổng Lồ | Vòm Đại Dương |
| 10 | Mặt Trời Nhân Tạo | Tòa xoắn biển | Hải Đăng Mặt Trời | Mặt Trời Biển |
| 11 | Bẻ Cong Không Gian | Tháp pha lê biển | Cổng Xoáy Nước | Cổng Sóng |
| 12 | Siêu Việt | Tháp mặt trời biển | Tháp Ốc Ngọc | Vành Sóng |

## Cát Hồng

| Cấp | Thời | Nhà riêng | Nhà chính | Kỳ quan |
|---|---|---|---|---|
| 1 | Thời đồ đá | Nhà vòm cát hồng | Nhà Đá Tròn | Cột Đá Mặt Trời |
| 2 | Cổ đại | Nhà gạch đất cát hồng | Đền Bậc Thang | Kim Tự Tháp Hồng |
| 3 | Trung đại | Lều vải lớn cát hồng | Đền Bậc Ba Tầng | Tượng Người Gác Cát |
| 4 | Cận đại | Nhà đá mái bằng | Thành Cát Có Tháp | Cổng Sa Mạc |
| 5 | Công nghiệp | Nhà gạch đất cát hồng | Cung Điện Năm Tầng | Tháp Chuông Cát |
| 6 | Hiện đại | Toà sân trong tháp gió cát hồng | Cung Điện Kính | Tháp Nước Lớn |
| 7 | Tên lửa | Tháp bậc vườn treo | Bệ Phóng Sa Mạc | Tháp Gió |
| 8 | Robot AI | Tháp vòm chồng cát hồng | Kim Tự Tháp Dữ Liệu | Bệ Phóng Sa Mạc |
| 9 | Vật Chất Sống | Tháp mặt trời cát hồng | Xương Rồng Khổng Lồ | Vòm Ốc Đảo |
| 10 | Mặt Trời Nhân Tạo | Cao ốc kính cát hồng | Tháp Gương Mặt Trời | Mặt Trời Sa Mạc |
| 11 | Bẻ Cong Không Gian | Tháp kim cát hồng | Kim Tự Tháp Ngược | Thang Lên Sao |
| 12 | Siêu Việt | Tòa xoắn cát hồng | Kim Cương Mặt Trời Hồng | Thành Phố Cát Bay |

## Đèn đường và thành phố neon

- Thời 1 tới 9: đèn đường bên lề mọi con đường của cả sáu đảo, mỗi thời một kiểu (`render/build/lamps.js`), tối bật sáng tắt.
- Thời 10 tới 12: mặt trời thật đã tắt; trời tím cố định, cực quang; thành phố tự sáng (mép đường, vòm sáng, viền chân
  công trình, `render/build/neon.js`); mỗi đảo một mặt trời nhân tạo riêng treo trên thành phố (`render/neon3d.js`).
