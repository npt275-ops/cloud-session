# cloud-session

| Dự án | Mô tả |
|---|---|
| [`aquarium/`](aquarium/README.md) | **Bể Kính — Chaos Sandbox**: sáu hòn đảo trong bể kính 3D, đang làm lại từ đầu (hiện có làng Lúa Vàng với tám người cốt lõi, gen và di truyền qua các thế hệ, cùng các công trình có sẵn; năm đảo còn lại là đảo thô với thiên nhiên, mùa, mây và mưa). |
| [`docs/`](docs/) | Bể Kính đã đóng gói: ứng dụng web cài lên điện thoại (bật GitHub Pages cho thư mục này) và [`BeKinh-ban-may-tinh.zip`](docs/BeKinh-ban-may-tinh.zip) để tải về máy tính chơi không cần mạng. |

## Bể Kính: cài trên máy tính bằng một lệnh

Lệnh dưới đây tải toàn bộ mã nguồn về máy, tạo phần mềm **Bể Kính** có biểu tượng (lối tắt trên Windows, `Bể Kính.app`
trên macOS, mục ứng dụng trên Linux), rồi mở game trong một cửa sổ riêng. Chơi không cần mạng; chạy lại đúng lệnh là cập nhật.

**Windows** — mở **PowerShell**, dán:

```powershell
irm https://raw.githubusercontent.com/npt275-ops/cloud-session/claude/eloquent-faraday-raquyc/install.ps1 | iex
```

**macOS, Linux** — mở **Terminal**, dán:

```bash
curl -fsSL https://raw.githubusercontent.com/npt275-ops/cloud-session/claude/eloquent-faraday-raquyc/install.sh | bash
```

Mã nguồn đầy đủ nằm ở `%LOCALAPPDATA%\BeKinh` (Windows) hoặc `~/BeKinh` (macOS, Linux); game ở `docs/`, mã nguồn game ở `aquarium/`.

## Bể Kính: chơi trên điện thoại

1. Bật **GitHub Pages** một lần: vào **Settings → Pages**, chọn nhánh `claude/eloquent-faraday-raquyc`, thư mục **`/docs`**, bấm **Save**.
2. Mở https://npt275-ops.github.io/cloud-session/ bằng Safari (iPhone) hay Chrome (Android).
3. Thêm vào màn hình chính: iPhone bấm **Chia sẻ → Thêm vào MH chính**; Android bấm **⋮ → Cài đặt ứng dụng**. Lần đầu mở, game tự lưu vào máy để những lần sau chơi được cả khi không có mạng.
