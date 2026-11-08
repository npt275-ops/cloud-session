#!/usr/bin/env python3
"""Bể Kính · tools/wrap-long-lines.py · Tách dòng code quá dài (design/ke-hoach-khac-phuc.md mục 1.5)

Chỉ xuống dòng ngay sau ", " hoặc "; " nằm ngoài chuỗi ('...', "...", `...`) và ngoài chú thích, nên ý nghĩa code không đổi
(xuống dòng sau dấu phẩy, chấm phẩy không bao giờ đụng tới quy tắc tự thêm chấm phẩy của JavaScript). Dòng nối thụt vào thêm
4 dấu cách so với dòng gốc. Bỏ qua dòng có biểu thức chính quy (/.../) để không đoán nhầm.

  python3 tools/wrap-long-lines.py [--max 160] tệp.js ...      sửa tại chỗ, in số dòng đã tách
  python3 tools/wrap-long-lines.py --check tệp.js ...          chỉ đếm dòng quá dài (tối đa 300)
"""
import re
import sys

REGEX_HINT = re.compile(r'(^|[=(,:!&|?{};]|return)\s*/(?![/*])')


def breaks(line):
    """Vị trí có thể xuống dòng (ngay sau ', ' hoặc '; ') nằm ngoài chuỗi, ngoài chú thích."""
    out, q, i = [], None, 0
    while i < len(line):
        c = line[i]
        if q:
            if c == '\\':
                i += 2
                continue
            if c == q:
                q = None
        elif c in '\'"`':
            q = c
        elif line.startswith('//', i):
            break
        elif c in ',;' and i + 1 < len(line) and line[i + 1] == ' ':
            out.append(i + 2)
        i += 1
    return out


def wrap(line, width):
    if len(line) <= width or REGEX_HINT.search(line) or line.lstrip().startswith(('//', '*', '/*')):
        return [line]
    indent = len(line) - len(line.lstrip())
    pad = ' ' * (indent + 4)
    parts, rest, first = [], line, True
    while len(rest) > width:
        pts = [p for p in breaks(rest) if p <= width and p > len(pad) + 20]
        if not pts:
            break
        cut = pts[-1]
        parts.append(rest[:cut].rstrip())
        rest = pad + rest[cut:].lstrip()
        first = False
    parts.append(rest)
    return parts


def main(argv):
    width, check, files = 160, False, []
    it = iter(argv)
    for a in it:
        if a == '--max':
            width = int(next(it))
        elif a == '--check':
            check = True
        else:
            files.append(a)
    total = 0
    for f in files:
        src = open(f, encoding='utf8').read().split('\n')
        if check:
            n = sum(1 for l in src if len(l) > 300)
            if n:
                print(f, n)
            total += n
            continue
        out, n = [], 0
        for l in src:
            w = wrap(l, width) if len(l) > 300 else [l]
            n += len(w) > 1
            out.extend(w)
        if n:
            open(f, 'w', encoding='utf8').write('\n'.join(out))
            print(f, n, 'dòng đã tách')
        total += n
    return total


if __name__ == '__main__':
    r = main(sys.argv[1:])
    if '--check' in sys.argv:
        print('dòng quá 300 ký tự:', r)
