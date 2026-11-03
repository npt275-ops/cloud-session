#!/usr/bin/env python3
"""Đóng gói Bể Kính để chơi trên máy tính và điện thoại.

Chạy từ thư mục gốc của repo:  python3 aquarium/tools/build-package.py

Đầu ra:
  docs/                          bản web cài được (PWA): mở trực tiếp, hoặc đưa lên máy chủ HTTPS (ví dụ GitHub Pages,
                                 thư mục /docs) để cài lên điện thoại và chơi không cần mạng sau lần mở đầu tiên
  docs/BeKinh-ban-may-tinh.zip   gói cho máy tính: giải nén, mở "Choi Be Kinh" hoặc index.html, không cần mạng

Không cần thư viện ngoài. three.js r128, OrbitControls và phông chữ đã nằm sẵn trong aquarium/vendor/.
"""
import datetime
import hashlib
import json
import os
import re
import shutil
import subprocess
import zipfile

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
SRC = os.path.join(ROOT, 'aquarium')
OUT = os.path.join(ROOT, 'docs')
ZIP_NAME = 'BeKinh-ban-may-tinh.zip'
APP = 'Bể Kính'

CDN_THREE = '<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>'
CDN_ORBIT = '<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js"></script>'
FONT_LINKS = re.compile(r'<link rel="preconnect" href="https://fonts\.googleapis\.com">\s*<link rel="preconnect" href="https://fonts\.gstatic\.com" crossorigin>\s*<link rel="stylesheet" href="https://fonts\.googleapis\.com/css2[^"]*">')


def version():
    try:
        rev = subprocess.check_output(['git', '-C', ROOT, 'rev-parse', '--short', 'HEAD'], text=True).strip()
    except Exception:
        rev = 'local'
    return datetime.date.today().strftime('%Y.%m.%d') + '-' + rev


def head(ver):
    return '\n'.join([
        '<!doctype html>',
        '<html lang="vi">',
        '<head>',
        '<meta charset="utf-8">',
        '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">',
        '<meta name="description" content="Bể Kính: vị thần ngoài bể kính, sáu đảo, mười hai thời đại, chín năm.">',
        '<meta name="theme-color" content="#0e1626">',
        '<meta name="mobile-web-app-capable" content="yes">',
        '<meta name="apple-mobile-web-app-capable" content="yes">',
        '<meta name="apple-mobile-web-app-title" content="Bể Kính">',
        '<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">',
        '<meta name="bekinh-version" content="%s">' % ver,
        '<link rel="manifest" href="manifest.webmanifest">',
        '<link rel="icon" type="image/png" sizes="64x64" href="icons/favicon-64.png">',
        '<link rel="icon" type="image/png" sizes="32x32" href="icons/favicon-32.png">',
        '<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">',
        '<link rel="stylesheet" href="vendor/fonts.css">',
    ]) + '\n'


def build_index(ver):
    html = open(os.path.join(SRC, 'index.html'), encoding='utf-8').read()
    for a, b in [(CDN_THREE, '<script src="vendor/three.min.js"></script>'), (CDN_ORBIT, '<script src="vendor/OrbitControls.js"></script>')]:
        assert html.count(a) == 1, 'không thấy ' + a
        html = html.replace(a, b)
    html, n = FONT_LINKS.subn('', html)
    assert n == 1, 'không thấy liên kết phông chữ'
    remote = re.findall(r'<(?:script[^>]*\ssrc|link[^>]*\shref|img[^>]*\ssrc)="(https?://[^"]+)"', html)
    assert not remote, 'còn tài nguyên tải từ mạng: %s' % remote
    scripts = re.findall(r'<script src="([^":]+\.js)"></script>', html)
    return head(ver) + html + '\n</html>\n', scripts


MANIFEST = {
    'name': APP,
    'short_name': APP,
    'description': 'Vị thần ngoài bể kính: sáu đảo, mười hai thời đại, chín năm.',
    'lang': 'vi',
    'start_url': './index.html',
    'scope': './',
    'display': 'fullscreen',
    'display_override': ['fullscreen', 'standalone'],
    'orientation': 'any',
    'background_color': '#0b1424',
    'theme_color': '#0e1626',
    'icons': [
        {'src': 'icons/icon-192.png', 'sizes': '192x192', 'type': 'image/png', 'purpose': 'any'},
        {'src': 'icons/icon-512.png', 'sizes': '512x512', 'type': 'image/png', 'purpose': 'any'},
        {'src': 'icons/icon-512.png', 'sizes': '512x512', 'type': 'image/png', 'purpose': 'maskable'},
    ],
}

SW = """// Bể Kính: lưu cả game vào máy ở lần mở đầu tiên, những lần sau chơi được khi không có mạng.
const CACHE = 'bekinh-%(hash)s';
const FILES = %(files)s;
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith('bekinh-') && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then((hit) => hit || fetch(e.request)));
});
"""

LAUNCH_WIN = r"""@echo off
rem Be Kinh: mo game trong mot cua so rieng nhu ung dung (Microsoft Edge hoac Google Chrome).
rem Khong co hai trinh duyet do thi mo bang trinh duyet mac dinh.
set "PAGE=%~dp0index.html"
set "URL=%PAGE:\=/%"
set "URL=file:///%URL: =%%20%"
if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" (start "" "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" --app="%URL%" & exit /b)
if exist "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" (start "" "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" --app="%URL%" & exit /b)
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" (start "" "%ProgramFiles%\Google\Chrome\Application\chrome.exe" --app="%URL%" & exit /b)
if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" (start "" "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" --app="%URL%" & exit /b)
if exist "%LocalAppData%\Google\Chrome\Application\chrome.exe" (start "" "%LocalAppData%\Google\Chrome\Application\chrome.exe" --app="%URL%" & exit /b)
start "" "%PAGE%"
"""

LAUNCH_MAC = """#!/bin/bash
# Bể Kính: mở game trong một cửa sổ riêng như ứng dụng (Chrome, Edge, Brave), không có thì mở bằng Safari.
DIR="$(cd "$(dirname "$0")" && pwd)"
PAGE="$DIR/index.html"
URL="file://${PAGE// /%20}"
for APP in "Google Chrome" "Microsoft Edge" "Brave Browser" "Chromium"; do
  if open -Ra "$APP" 2>/dev/null; then open -na "$APP" --args --app="$URL"; exit 0; fi
done
open "$PAGE"
"""

LAUNCH_LINUX = """#!/bin/sh
# Bể Kính: mở game trong một cửa sổ riêng (Chrome, Chromium, Edge, Brave), không có thì mở bằng trình duyệt mặc định.
DIR=$(cd "$(dirname "$0")" && pwd)
PAGE="$DIR/index.html"
URL="file://$(printf '%s' "$PAGE" | sed 's/ /%20/g')"
for B in google-chrome google-chrome-stable chromium chromium-browser microsoft-edge brave-browser; do
  if command -v "$B" >/dev/null 2>&1; then exec "$B" --app="$URL"; fi
done
exec xdg-open "$PAGE"
"""

LAUNCHERS = [('windows', LAUNCH_WIN, True), ('mac', LAUNCH_MAC, False), ('linux', LAUNCH_LINUX, False)]
LAUNCH_NAMES = [('windows', 'Choi Be Kinh (Windows).bat', 0o644), ('mac', 'Choi Be Kinh (Mac).command', 0o755), ('linux', 'choi-be-kinh-linux.sh', 0o755)]

GUIDE = """BỂ KÍNH
Chaos Sandbox: sáu đảo, mười hai thời đại, chín năm. Bản làm lại từ đầu: sáu đảo thô.
Phiên bản %(ver)s

CÀI BẰNG MỘT LỆNH (tải toàn bộ mã nguồn, tạo phần mềm Bể Kính có biểu tượng, mở game)
 - Windows: mở PowerShell, dán lệnh:
     irm https://raw.githubusercontent.com/npt275-ops/cloud-session/claude/eloquent-faraday-raquyc/install.ps1 | iex
 - macOS, Linux: mở Terminal, dán lệnh:
     curl -fsSL https://raw.githubusercontent.com/npt275-ops/cloud-session/claude/eloquent-faraday-raquyc/install.sh | bash
 Chạy lại đúng lệnh đó là cập nhật lên bản mới nhất.

CHƠI TRÊN MÁY TÍNH TỪ GÓI ZIP (không cần mạng)
 1. Giải nén BeKinh-ban-may-tinh.zip (chuột phải, chọn Extract All / Giải nén tất cả).
 2. Mở thư mục BeKinh vừa giải nén:
    - Windows: bấm đúp "Choi Be Kinh (Windows).bat". Game mở trong một cửa sổ riêng như ứng dụng
      (Microsoft Edge hoặc Google Chrome). Cũng có thể bấm đúp index.html.
    - macOS: bấm đúp "Choi Be Kinh (Mac).command". Lần đầu macOS có thể chặn: chuột phải, chọn Open.
      Cũng có thể mở index.html bằng Chrome hoặc Safari.
    - Linux: chạy ./choi-be-kinh-linux.sh, hoặc mở index.html bằng trình duyệt.
 3. Cần trình duyệt có WebGL (Chrome, Edge, Firefox, Safari từ năm 2022 trở đi).
 Cả bể kính nằm trong thư mục này: three.js, phông chữ, mọi tệp của game. Không tải gì từ mạng.

CHƠI TRÊN ĐIỆN THOẠI
 - Mở trang Bể Kính trên điện thoại rồi thêm vào màn hình chính:
    - Android (Chrome): bấm ⋮, chọn "Cài đặt ứng dụng" hoặc "Thêm vào màn hình chính".
    - iPhone, iPad (Safari): bấm nút Chia sẻ, chọn "Thêm vào MH chính".
 - Biểu tượng Bể Kính nằm trên màn hình chính, mở ra là chơi toàn màn hình.
 - Muốn chơi không cần mạng trên điện thoại: đặt thư mục BeKinh này lên một máy chủ web HTTPS (ví dụ GitHub
   Pages) rồi mở địa chỉ đó trên điện thoại một lần. Game tự lưu vào máy; những lần sau chơi được khi không có mạng.

ĐIỀU KHIỂN
 - Kéo chuột (hay một ngón tay) để xoay, cuộn (hay hai ngón) để phóng to, bấm tên đảo để bay tới.
 - Phím mũi tên hay W A S D: lướt tới, lùi, sang trái, sang phải. Page Up / Page Down (E / Q, Space / Shift): lên cao,
   sà xuống. Trên điện thoại có sáu nút bay ở góc phải.
 - Nút tốc độ: 1×, 2×, 4×. Một trận chín năm ở 1× hết khoảng 72 phút.
 - Mẫu công trình: hiện công trình tiêu biểu và vài công trình nhỏ của mỗi đảo; nút ‹ › để đổi thời đại (1 tới 12).
 - Âm thanh, Bay (nút bay trên màn hình). Phím F: số khung hình.
 - Bản này là sáu đảo thô: chỉ có thiên nhiên, mùa, mây và mưa. Người và logic mới (Chaos Sandbox) đang làm.

GIẤY PHÉP
 - three.js r128: giấy phép MIT (vendor/LICENSE-three.txt).
 - Phông chữ Fraunces và Outfit: SIL Open Font License 1.1 (vendor/LICENSE-fonts.txt).
"""


def main():
    ver = version()
    if os.path.isdir(OUT):
        shutil.rmtree(OUT)
    os.makedirs(OUT)
    index, scripts = build_index(ver)
    open(os.path.join(OUT, 'index.html'), 'w', encoding='utf-8').write(index)
    for f in scripts:
        if f.startswith('vendor/'):
            continue
        os.makedirs(os.path.dirname(os.path.join(OUT, f)), exist_ok=True)  # mã chia theo thư mục: logic/, render/, ui/
        shutil.copy2(os.path.join(SRC, f), os.path.join(OUT, f))
    shutil.copytree(os.path.join(SRC, 'vendor'), os.path.join(OUT, 'vendor'))
    shutil.copytree(os.path.join(SRC, 'icons'), os.path.join(OUT, 'icons'))
    json.dump(MANIFEST, open(os.path.join(OUT, 'manifest.webmanifest'), 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
    open(os.path.join(OUT, 'HUONG-DAN.txt'), 'w', encoding='utf-8-sig').write(GUIDE % {'ver': ver})
    open(os.path.join(OUT, '.nojekyll'), 'w').write('')
    # tệp mở nhanh, để cả gói zip dựng sẵn lẫn gói trang tự nén (trên claude.ai) dùng chung một nguồn
    os.makedirs(os.path.join(OUT, 'launch'))
    for key, text, crlf in LAUNCHERS:
        open(os.path.join(OUT, 'launch', key + '.txt'), 'w', encoding='utf-8', newline='').write(text.replace('\n', '\r\n') if crlf else text)
    # bộ nhớ đệm chơi không cần mạng: mọi tệp của bản web (trừ gói zip)
    files = ['./']
    for dp, _, fs in os.walk(OUT):
        for f in sorted(fs):
            rel = os.path.relpath(os.path.join(dp, f), OUT).replace(os.sep, '/')
            if rel in ('.nojekyll', 'sw.js', ZIP_NAME, 'goi-files.json') or rel.startswith('launch/') or rel.endswith(('.icns', '.ico')):
                continue  # biểu tượng .ico, .icns chỉ dành cho lệnh cài trên Windows, macOS
            files.append(rel)
    files.sort()
    digest = hashlib.sha1()
    for rel in files[1:]:
        digest.update(rel.encode()); digest.update(open(os.path.join(OUT, rel), 'rb').read())
    open(os.path.join(OUT, 'sw.js'), 'w', encoding='utf-8').write(SW % {'hash': digest.hexdigest()[:10], 'files': json.dumps(files, ensure_ascii=False)})
    # danh sách tệp của gói máy tính: tên trong zip, tệp nguồn trong docs/, quyền (tệp mở nhanh trên macOS, Linux được chạy)
    entries = [{'path': 'BeKinh/' + rel, 'src': rel, 'mode': 0o644} for rel in files[1:] + ['sw.js']]
    entries += [{'path': 'BeKinh/' + name, 'src': 'launch/' + key + '.txt', 'mode': mode} for key, name, mode in LAUNCH_NAMES]
    json.dump(entries, open(os.path.join(OUT, 'goi-files.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    # gói cho máy tính: thư mục BeKinh với tệp mở nhanh cho Windows, macOS, Linux
    zpath = os.path.join(OUT, ZIP_NAME)
    with zipfile.ZipFile(zpath, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as z:
        for e in entries:
            info = zipfile.ZipInfo(e['path'], date_time=datetime.datetime.now().timetuple()[:6])
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = (0o100000 | e['mode']) << 16
            z.writestr(info, open(os.path.join(OUT, e['src']), 'rb').read())
    size = os.path.getsize(zpath)
    print('Bể Kính %s: %d tệp trong docs/, gói %s %.1f MB' % (ver, len(files), ZIP_NAME, size / 1e6))


if __name__ == '__main__':
    main()
