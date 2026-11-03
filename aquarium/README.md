# Bể Kính — Chaos Sandbox

Bể Kính đang được **làm lại từ đầu** theo hướng mới: từ mô phỏng kinh tế của hàng nghìn NPC vô danh sang câu chuyện
của **48 nhân vật cốt lõi** (8 người mỗi đảo, 4 nam, 4 nữ) có tên, có 8 gen tính cách và có dòng dõi. Một trận dài 9 năm,
qua 12 cấp văn minh và 6 thế hệ (1,5 năm một thế hệ); thống nhất cả sáu đảo trước cấp 10 là thắng nhanh. Bản thiết kế
đầy đủ nằm trong tài liệu "Bể Kính — Chaos Sandbox" (10 mục).

## Hiện có: sáu đảo thô

Bước 1 của kế hoạch là dọn sạch. Mở game là thấy bể kính yên tĩnh với sáu hòn đảo chỉ có thiên nhiên:

| Giữ | Bỏ khỏi game (lưu ở `archive/v1/`) |
|---|---|
| Bể kính, vòng đồng, biển phủ kín đáy bể, chậu kính trong suốt đựng nước | Nền kinh tế mô phỏng từng hộ gia đình (`sim.js`) |
| Sáu dáng đất: Lúa Vàng (đồng bằng), Thông Xanh (rừng), Đá Mây (núi), Tuyết Trắng (băng nguyên), Cửa Sóng (biển), Cát Hồng (sa mạc) | NPC, đám đông, lính, thú săn |
| Hồ riêng của từng miền, sông, suối, cây, núi, đồi cát, mỏm đá, băng trôi, đồng cỏ hoa dại | Chiến tranh, kịch bản hỗn loạn, đời sống trong thành, phố xá |
| Sáu cây cầu thô nối vòng sáu đảo | Quyền năng của thần (sẽ nối lại vào logic mới) |
| Ngày đêm, trăng sao, bốn mùa đổi màu đất và cây, tuyết mùa đông trên băng nguyên và núi | Biên niên sử, phụ đề, chương năm, bảng chính sách |
| Mây trong bể theo đợt, dính thành cụm, mưa theo mùa (hạ mưa to, cuối thu mưa nhỏ), sấm sét | Ruộng bậc, thuyền, bậc đá, cầu gỗ, lều câu: những dấu vết của người trên đảo |
| Camera kéo xoay, bay bằng phím, tốc độ 1×, 2×, 4× | |

Ván chín năm ở tốc độ 1× hết khoảng 72 phút; đồng hồ góc phải ghi năm, mùa và ngày.

## Phòng mẫu công trình

Để không mất những công trình đã làm cho từng thời đại, nút **Mẫu công trình** hiện lên mỗi đảo:

- sáu công trình trụ cột và mười công trình kỳ lạ riêng của đảo (tiêu biểu);
- ở giữa đảo, toà thị chính (chỗ của **nhà chính** sau này), ba kiểu nhà, ruộng, chợ, kho bạc và hai đèn đường (công trình nhỏ).

Nút **‹ ›** đổi thời đại từ thời 1 (Nguyên thuỷ) tới thời 12 (Siêu việt) để đối chiếu và cải tiến từng thời. Công trình
mẫu chỉ để xem, chưa gắn với logic nào.

## Thứ tự làm tiếp

1. ~~Làm sạch: sáu đảo trống, giữ thời tiết và thiên nhiên.~~
2. Logic ngầm: 48 người cốt lõi, 8 gen và di truyền mỗi 1,5 năm, hội đồng ra quyết định, tài nguyên và đặc sản, dân tối
   đa 200 người mỗi đảo, kèm bài kiểm thử chạy 9 năm bằng Node.
3. Hiển thị đảo: nhà chính ở giữa, bãi tài nguyên xung quanh, công trình theo cấp, nhân vật cốt lõi.
4. Chiến tranh qua cầu và thôn tính.
5. Nối quyền năng của thần, viện trợ, cấm vận và thì thầm vào logic mới.
6. Bảng gia phả, bảng hội đồng, nhật ký drama.
7. Thắng nhanh, thắng thường, New Game+; chế độ nhập vai tướng sau cùng.

## Chơi trên máy tính và điện thoại

**Cài lên máy tính bằng một lệnh.** Lệnh tải toàn bộ mã nguồn của repo về máy, tạo phần mềm "Bể Kính" có biểu
tượng, rồi mở game trong một cửa sổ riêng (không có thanh địa chỉ, như phần mềm). Chơi không cần mạng; chạy lại đúng lệnh
là cập nhật.

- Windows 10, 11 (PowerShell): cài vào `%LOCALAPPDATA%\BeKinh`, lối tắt trên Desktop và trong Start menu, mở bằng Edge
  (có sẵn trên Windows) hay Chrome.

  ```powershell
  irm https://raw.githubusercontent.com/npt275-ops/cloud-session/claude/eloquent-faraday-raquyc/install.ps1 | iex
  ```

- macOS, Linux (Terminal): cài vào `~/BeKinh`, phần mềm `Bể Kính.app` trong `~/Applications` (Launchpad, Spotlight) hay
  mục "Bể Kính" trong danh sách ứng dụng Linux, mở bằng Chrome, Edge, Brave (không có thì Safari hay trình duyệt mặc định).

  ```bash
  curl -fsSL https://raw.githubusercontent.com/npt275-ops/cloud-session/claude/eloquent-faraday-raquyc/install.sh | bash
  ```

Ngoài lệnh cài, còn hai bản dựng từ cùng mã nguồn bằng `python3 aquarium/tools/build-package.py` (chạy từ thư mục gốc của
repo, không cần thư viện ngoài):

- **Máy tính, không cần mạng:** `docs/BeKinh-ban-may-tinh.zip` (khoảng 0,8 MB). Giải nén, mở thư mục `BeKinh`, bấm đúp
  `Choi Be Kinh (Windows).bat` hay `Choi Be Kinh (Mac).command` (mở trong cửa sổ riêng như ứng dụng, bằng Edge hay
  Chrome), `choi-be-kinh-linux.sh`, hoặc mở thẳng `index.html`. Trong gói có sẵn three.js r128, OrbitControls và phông chữ,
  nên không tải gì từ mạng.
- **Điện thoại, cài như ứng dụng:** thư mục `docs/` là một ứng dụng web cài được (PWA): tệp cài ứng dụng, biểu tượng, và
  bộ nhớ đệm lưu cả game ở lần mở đầu tiên để những lần sau chơi được khi không có mạng. Bật GitHub Pages cho repo
  (Settings → Pages → Deploy from a branch → nhánh chứa `docs/`, thư mục `/docs`) là có địa chỉ
  `https://npt275-ops.github.io/cloud-session/`. Mở địa chỉ đó trên điện thoại rồi **Cài đặt ứng dụng / Thêm vào màn hình
  chính** (Android, Chrome) hay **Chia sẻ → Thêm vào MH chính** (iPhone, Safari).

Đã thử: mở gói đã giải nén từ ổ đĩa với mọi truy cập mạng bị chặn (không một yêu cầu nào ra ngoài, phông chữ và three.js
nạp từ gói); chạy bản web qua máy chủ cục bộ trên cấu hình điện thoại Android, đợi bộ nhớ đệm lưu toàn bộ tệp, ngắt mạng rồi
tải lại: game vẫn chạy.

## Chạy khi phát triển

Mở `aquarium/index.html` bằng trình duyệt (three.js tải từ CDN), hoặc chạy một máy chủ tĩnh ở thư mục gốc của repo
(`python3 -m http.server`). Sau khi sửa, dựng lại `docs/` và gói zip bằng `python3 aquarium/tools/build-package.py`.

## Cấu trúc

| File | Vai trò |
|---|---|
| `index.html` | Bể kính, bầu trời, ngày đêm, mùa, tuyết, camera và bay, tốc độ, thanh sáu đảo, phòng mẫu công trình |
| `lands3d.js` | Dáng đất sáu miền, hồ, sông, cây, cầu; chứa luôn các hàm dựng nhà, ruộng, chợ, toà thị chính, kho bạc, trường, đèn theo tám thời (bốn thời vượt người biến hình từ thời thứ tám) |
| `sea3d.js` | Biển: mặt nước phủ kín đáy bể, sóng, chậu kính trong suốt chứa nước |
| `clouds3d.js` | Mây trong bể kính: đợt mây theo gió, mây dính thành cụm, mây đen, sấm sét, mưa theo mùa |
| `landmarks3d.js` | Sáu công trình trụ cột của mỗi miền qua mười hai thời |
| `sights3d.js` | Mười công trình kỳ lạ của mỗi đảo, đổi theo thời đại |
| `audio.js` | Âm thanh tự sinh bằng Web Audio |
| `tools/build-package.py` | Đóng gói: bản web cài được cho điện thoại (`docs/`) và gói chơi không cần mạng cho máy tính |
| `vendor/`, `icons/` | three.js r128, OrbitControls, phông chữ Fraunces và Outfit; biểu tượng ứng dụng |
| `archive/v1/` | Bản cũ để tham khảo: trang game cũ, nền kinh tế, NPC, chiến tranh, kịch bản hỗn loạn, quyền năng, 53 bài kiểm thử, README cũ |
| `archive/` | Các bản đề xuất giao diện trước khi chốt 3D |

Các tệp trong `lands3d.js` vẫn còn phần dựng người, đường sá và nhà theo nền kinh tế cũ; phần đó không còn được gọi và
sẽ được thay khi làm logic mới.
