#!/usr/bin/env bash
# Bể Kính: một lệnh tải toàn bộ mã nguồn về máy, cài game như một phần mềm và mở game (macOS, Linux).
#
#   curl -fsSL https://raw.githubusercontent.com/npt275-ops/cloud-session/claude/eloquent-faraday-raquyc/install.sh | bash
#
# Lệnh làm gì:
#   1. Tải toàn bộ mã nguồn của repo về ~/BeKinh (game nằm ở ~/BeKinh/docs, mã nguồn ở ~/BeKinh/aquarium).
#   2. Tạo phần mềm "Bể Kính" có biểu tượng: macOS trong ~/Applications (mở bằng Launchpad, Spotlight),
#      Linux trong danh sách ứng dụng (và trên Desktop nếu có thư mục đó).
#   3. Mở game trong một cửa sổ riêng (Chrome, Edge, Brave, Chromium; không có thì trình duyệt mặc định). Chơi không cần mạng.
# Chạy lại lệnh là cập nhật lên bản mới nhất. Gỡ: xoá ~/BeKinh và phần mềm "Bể Kính" vừa tạo.
# Tuỳ chọn: BEKINH_DIR (thư mục cài), BEKINH_REF (nhánh), BEKINH_ZIP_URL (gói mã nguồn), BEKINH_NO_OPEN=1 (không mở game).
set -euo pipefail

REPO="npt275-ops/cloud-session"
REF="${BEKINH_REF:-claude/eloquent-faraday-raquyc}"
DEST="${BEKINH_DIR:-$HOME/BeKinh}"
ZIP_URL="${BEKINH_ZIP_URL:-https://codeload.github.com/$REPO/zip/refs/heads/$REF}"

say() { printf '%s\n' "$*"; }
die() { printf 'Bể Kính: %s\n' "$*" >&2; exit 1; }
command -v curl >/dev/null 2>&1 || die "cần curl để tải mã nguồn."
command -v unzip >/dev/null 2>&1 || die "cần unzip để giải nén (Linux: sudo apt install unzip)."

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

say "Bể Kính: đang tải toàn bộ mã nguồn..."
case "$ZIP_URL" in
  file://*) cp "${ZIP_URL#file://}" "$TMP/src.zip" ;;
  *) curl -fL --progress-bar "$ZIP_URL" -o "$TMP/src.zip" || die "không tải được $ZIP_URL" ;;
esac
unzip -q "$TMP/src.zip" -d "$TMP/x" || die "gói tải về bị hỏng."
SRC="$(find "$TMP/x" -mindepth 1 -maxdepth 1 -type d | head -n 1)"
[ -n "$SRC" ] && [ -f "$SRC/docs/index.html" ] || die "gói tải về thiếu game (docs/index.html)."

# chỉ ghi đè thư mục do chính lệnh này cài trước đó
if [ -e "$DEST" ]; then
  [ -f "$DEST/.bekinh-install" ] || die "$DEST đã có và không phải bản cài Bể Kính. Đặt BEKINH_DIR sang thư mục khác."
  rm -rf "$DEST"
fi
mkdir -p "$(dirname "$DEST")"
mv "$SRC" "$DEST"
printf '%s\n' "$REF" > "$DEST/.bekinh-install"
GAME="$DEST/docs/index.html"
URL="file://$(printf '%s' "$GAME" | sed 's/ /%20/g')"

# lệnh mở game trong cửa sổ riêng
LAUNCH="$DEST/choi-be-kinh.sh"
cat > "$LAUNCH" <<EOF
#!/usr/bin/env bash
# Mở Bể Kính trong một cửa sổ riêng như phần mềm.
GAME="$GAME"
URL="$URL"
if [ "\$(uname)" = "Darwin" ]; then
  for APP in "Google Chrome" "Microsoft Edge" "Brave Browser" "Chromium"; do
    if open -Ra "\$APP" 2>/dev/null; then exec open -na "\$APP" --args --app="\$URL"; fi
  done
  exec open "\$GAME"
fi
for B in google-chrome google-chrome-stable chromium chromium-browser microsoft-edge brave-browser; do
  if command -v "\$B" >/dev/null 2>&1; then exec "\$B" --app="\$URL" >/dev/null 2>&1; fi
done
exec xdg-open "\$GAME"
EOF
chmod +x "$LAUNCH"

if [ "$(uname)" = "Darwin" ]; then
  # macOS: một phần mềm "Bể Kính.app" trong ~/Applications
  APPDIR="$HOME/Applications/Bể Kính.app"
  rm -rf "$APPDIR"
  mkdir -p "$APPDIR/Contents/MacOS" "$APPDIR/Contents/Resources"
  cp "$DEST/docs/icons/bekinh.icns" "$APPDIR/Contents/Resources/bekinh.icns" 2>/dev/null || true
  printf '#!/bin/bash\nexec "%s"\n' "$LAUNCH" > "$APPDIR/Contents/MacOS/bekinh"
  chmod +x "$APPDIR/Contents/MacOS/bekinh"
  cat > "$APPDIR/Contents/Info.plist" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>CFBundleName</key><string>Bể Kính</string>
  <key>CFBundleDisplayName</key><string>Bể Kính</string>
  <key>CFBundleIdentifier</key><string>io.github.npt275-ops.bekinh</string>
  <key>CFBundleVersion</key><string>1.0</string>
  <key>CFBundlePackageType</key><string>APPL</string>
  <key>CFBundleExecutable</key><string>bekinh</string>
  <key>CFBundleIconFile</key><string>bekinh</string>
  <key>LSApplicationCategoryType</key><string>public.app-category.simulation-games</string>
</dict></plist>
EOF
  touch "$APPDIR"
  WHERE="phần mềm \"Bể Kính\" trong ~/Applications (mở bằng Launchpad hay Spotlight)"
  [ "${BEKINH_NO_OPEN:-}" = "1" ] || open "$APPDIR" || "$LAUNCH" &
else
  # Linux: một mục "Bể Kính" trong danh sách ứng dụng (và trên Desktop nếu có)
  APPS="${XDG_DATA_HOME:-$HOME/.local/share}/applications"
  mkdir -p "$APPS"
  cat > "$APPS/bekinh.desktop" <<EOF
[Desktop Entry]
Type=Application
Name=Bể Kính
Comment=Vị thần ngoài bể kính: sáu đảo, mười hai thời đại, chín năm
Exec="$LAUNCH"
Icon=$DEST/docs/icons/icon-512.png
Terminal=false
Categories=Game;Simulation;
EOF
  chmod +x "$APPS/bekinh.desktop"
  DESK="$(command -v xdg-user-dir >/dev/null 2>&1 && xdg-user-dir DESKTOP 2>/dev/null || echo "$HOME/Desktop")"
  if [ -d "$DESK" ]; then cp "$APPS/bekinh.desktop" "$DESK/bekinh.desktop"; chmod +x "$DESK/bekinh.desktop"; command -v gio >/dev/null 2>&1 && gio set "$DESK/bekinh.desktop" metadata::trusted true 2>/dev/null || true; fi
  WHERE="mục \"Bể Kính\" trong danh sách ứng dụng"
  [ "${BEKINH_NO_OPEN:-}" = "1" ] || (nohup "$LAUNCH" >/dev/null 2>&1 &)
fi

say ""
say "Đã cài Bể Kính."
say "  Mã nguồn đầy đủ: $DEST  (game: $DEST/docs, mã nguồn game: $DEST/aquarium)"
say "  Mở lại game: $WHERE, hoặc chạy $LAUNCH"
say "  Cập nhật: chạy lại đúng lệnh cài. Gỡ: xoá $DEST và phần mềm Bể Kính."
