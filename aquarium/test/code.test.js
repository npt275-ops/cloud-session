// Bể Kính · test/code.test.js · Giữ quy ước code dễ tìm, dễ sửa (README.md mục "Làm việc với code")
// Không chạy game: chỉ đọc tệp. Mỗi luật hỏng thì in đúng tệp, đúng dòng cần sửa.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const map = require('../tools/code-map.js');

const ROOT = path.join(__dirname, '..');
const files = map.listFiles();
const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');

test('mỗi tệp .js mở đầu bằng "Bể Kính · <đúng đường dẫn> · <việc của tệp>"', () => {
  const bad = files.filter((f) => !map.titleOf(read(f), f));
  assert.deepStrictEqual(bad, [], 'thiếu hay sai dòng tiêu đề');
});

test('mọi tệp của game được index.html nạp; mọi tệp index.html nạp đều có thật', () => {
  const { order, orphan } = map.build();
  assert.deepStrictEqual(orphan, [], 'tệp không ai nạp: thêm vào index.html, hoặc chuyển vào archive/ nếu bỏ');
  const missing = order.filter((f) => !fs.existsSync(path.join(ROOT, f)));
  assert.deepStrictEqual(missing, [], 'index.html nạp tệp không có');
});

test('dòng không quá dài: code tối đa 240 ký tự, dòng chú thích tối đa 180', () => {
  const bad = [];
  for (const f of files)
    read(f)
      .split('\n')
      .forEach((l, i) => {
        const t = l.trim(),
          cmt = t.startsWith('//') || (t.startsWith('*') && !t.startsWith('*/'));
        if (l.length > (cmt ? 180 : 240)) bad.push(`${f}:${i + 1} (${l.length} ký tự)`);
      });
  assert.deepStrictEqual(bad, [], 'tách dòng (chú thích dài: xuống dòng; chú thích treo cuối dòng code: đưa lên dòng riêng)');
});

test('MA-NGUON.md đúng với code (thêm, đổi, xoá tệp thì chạy: node tools/code-map.js)', () => {
  assert.strictEqual(fs.existsSync(map.OUT) ? fs.readFileSync(map.OUT, 'utf8') : '', map.build().text);
});

test('hằng số dùng chung chỉ ghi số ở một chỗ', () => {
  // [tên, tệp duy nhất được ghi số]: nơi khác đọc qua BK
  for (const [name, home] of [['SEA_Y', 'sea3d.js']]) {
    const re = new RegExp('\\b' + name + '\\s*=\\s*-?\\d');
    const where = files.filter((f) => re.test(read(f)));
    assert.deepStrictEqual(where, [home], name + ' ghi số ở ngoài ' + home + ': đọc BK.' + name);
  }
});
