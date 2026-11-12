// Bể Kính · tools/code-map.js · Lập bản đồ mã nguồn MA-NGUON.md (tự sinh từ code: đừng sửa tay tệp đó)
// Với mỗi tệp .js: việc của tệp (lấy từ dòng tiêu đề "Bể Kính · đường dẫn · việc"), số dòng, những gì tệp tạo ra (BK.X,
// biến toàn cục, dịch vụ G.x của game) và tệp nào dùng chúng. Thêm thứ tự index.html nạp tệp.
//   node tools/code-map.js            ghi lại MA-NGUON.md
//   node tools/code-map.js --check    chỉ kiểm: mã thoát 1 nếu MA-NGUON.md cũ (test/code.test.js cũng kiểm)
'use strict';
const fs = require('fs'),
  path = require('path');

const ROOT = path.join(__dirname, '..');
const SKIP = ['docs', 'vendor', 'archive', 'node_modules'];
const OUT = path.join(ROOT, 'MA-NGUON.md');
// thư mục theo thứ tự trình bày, kèm một câu nói thư mục đó làm gì
const FOLDERS = [
  ['.', 'Gốc: biển, mây, âm thanh (dựng trước các phần khác)'],
  ['game', 'Ghép game: vòng lặp, thế giới, mùa, thiên nhiên, các đảo chạy cùng logic'],
  ['logic', 'Logic ngầm (chạy được trong Node, không vẽ): người, đảo, kinh tế, chiến tranh, quyền năng'],
  ['render', 'Vẽ 3D: người, làng, trận đánh, trời, đáy bể'],
  ['render/map', 'Bản đồ sáu đảo: dáng đất, cao độ, nước, núi, cây'],
  ['render/deep', 'Đáy bể: địa hình, phế tích, đường hầm (ghép ở render/deep3d.js)'],
  ['render/build', 'Công trình dùng chung mọi đảo: bộ ghép khối, đường, cổng, cầu, xe, kỳ quan'],
  ['render/build/plains', 'Công trình Lúa Vàng theo 12 thời'],
  ['render/build/isles', 'Công trình năm đảo còn lại'],
  ['ui', 'Giao diện: thanh đảo, bảng làng, máy quay bay, bảng dev'],
  ['test', 'Kiểm thử: node --test test/*.js'],
  ['tools', 'Công cụ đo, quét lỗi, đóng gói (chạy tay)'],
];

// mọi tệp .js (đường dẫn tương đối, dấu /)
function listFiles(dir = ROOT, rel = '') {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.includes(e.name) || e.name.startsWith('.')) continue;
    const r = rel ? rel + '/' + e.name : e.name;
    if (e.isDirectory()) out.push(...listFiles(path.join(dir, e.name), r));
    else if (e.name.endsWith('.js')) out.push(r);
  }
  return out.sort();
}

// việc của tệp: phần sau "Bể Kính · đường dẫn · " tới hết câu đầu (hay hết dòng)
function titleOf(src, file) {
  const head = src.slice(0, 1500);
  const i = head.indexOf('Bể Kính · ' + file);
  if (i < 0) return null;
  // việc ghi cùng dòng tiêu đề, hoặc (tiêu đề chỉ có đường dẫn) ở dòng kế tiếp
  const after = head.slice(i + ('Bể Kính · ' + file).length).split('\n');
  let rest = after[0].replace(/^\s*·\s*/, '');
  if (!rest.replace(/\*\//, '').trim()) rest = (after[1] || '').replace(/^\s*(\*|\/\/)\s*/, '');
  rest = rest
    .replace(/\s*\*\/\s*$/, '')
    .replace(/\s+\(design\/[^)]*\)\s*$/, '')
    .trim();
  // câu đầu (tới dấu chấm hết câu); không có thì cả dòng
  const m = rest.match(/^(.*?[^.\d])\.(\s|$)/);
  if (m) return m[1].trim();
  return rest ? rest.replace(/[,:;]$/, '') + (/[.)]$/.test(rest) ? '' : ' …') : null; // (câu còn tiếp ở dòng sau)
}

// những gì tệp tạo ra: BK.X = …, root.X = … (biến toàn cục), Object.assign(G, { a, b }) và G.x = … (dịch vụ của game)
function providesOf(src) {
  const bk = new Set(),
    glob = new Set(),
    g = new Set();
  for (const m of src.matchAll(/(?:^|[^.\w])BK\.([A-Za-z_]\w*)\s*=(?!=)/gm)) bk.add(m[1]);
  for (const m of src.matchAll(/\(root\.BK \|\| \(root\.BK = \{\}\)\)\.(\w+)\s*=(?!=)/g)) bk.add(m[1]);
  for (const m of src.matchAll(/\broot\.([A-Z]\w*)\s*=(?!=)/g)) if (m[1] !== 'BK') glob.add(m[1]);
  for (const m of src.matchAll(/Object\.assign\(G,\s*\{([^}]*)\}/g))
    for (const part of m[1].split(',')) {
      const k = part.split(':')[0].trim();
      if (/^[A-Za-z_]\w*$/.test(k)) g.add(k);
    }
  for (const m of src.matchAll(/(?:^|[^.\w])G\.([A-Za-z_]\w*)\s*=(?!=)/gm)) g.add(m[1]);
  return { bk, glob, g };
}

function build() {
  const files = listFiles();
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const order = [...html.matchAll(/<script src="([^"]+\.js)"><\/script>/g)].map((m) => m[1]).filter((f) => !/^https?:/.test(f));
  const info = {};
  for (const f of files) {
    const src = fs.readFileSync(path.join(ROOT, f), 'utf8');
    info[f] = { src, lines: src.split('\n').length, title: titleOf(src, f), ...providesOf(src) };
  }
  // ai tạo ra tên nào (tên trùng: lấy tệp đầu tiên index.html nạp)
  const owner = { bk: {}, glob: {}, g: {} };
  // (chỉ tệp game nạp mới được coi là nơi tạo ra một tên: test/, tools/ có gán lại thì không tính)
  const rank = (f) => (order.includes(f) ? order.indexOf(f) : 1e6);
  for (const f of order.filter((q) => info[q]).sort((a, b) => rank(a) - rank(b)))
    for (const kind of ['bk', 'glob', 'g']) for (const n of info[f][kind]) if (!owner[kind][n]) owner[kind][n] = f;
  // tệp f dùng những tệp nào
  for (const f of files) {
    const src = info[f].src,
      deps = new Set();
    for (const m of src.matchAll(/\bBK\.([A-Za-z_]\w*)/g)) if (owner.bk[m[1]] && owner.bk[m[1]] !== f) deps.add(owner.bk[m[1]]);
    for (const n in owner.glob) if (owner.glob[n] !== f && new RegExp('\\b' + n + '\\b').test(src)) deps.add(owner.glob[n]);
    for (const m of src.matchAll(/\bG\.([A-Za-z_]\w*)/g)) if (owner.g[m[1]] && owner.g[m[1]] !== f) deps.add(owner.g[m[1]]);
    info[f].deps = [...deps].sort();
  }
  const usedBy = {};
  for (const f of files) for (const d of info[f].deps) (usedBy[d] = usedBy[d] || []).push(f);

  const L = [];
  L.push('# Bản đồ mã nguồn Bể Kính');
  L.push('');
  L.push('Tự sinh bởi `node tools/code-map.js` từ dòng tiêu đề và code của từng tệp: **đừng sửa tay**. Thêm, đổi, xoá tệp');
  L.push('thì chạy lại lệnh đó (`node --test test/*.js` báo lỗi nếu tệp này cũ). Cách làm việc với code: `README.md` mục');
  L.push('"Làm việc với code".');
  L.push('');
  L.push('Cột "Tạo ra": `BK.X` là mô-đun dùng chung, tên in hoa không có `BK.` là biến toàn cục, "G: n dịch vụ" là số dịch');
  L.push('vụ tệp thêm vào đối tượng G của game (tên từng dịch vụ: mục "Dịch vụ G" cuối trang). Cột "Dùng": các tệp mà tệp');
  L.push('này cần (dò theo tên trong code).');
  L.push('');
  const total = files.reduce((a, f) => a + info[f].lines, 0);
  L.push(`Tổng: ${files.length} tệp, ${total} dòng.`);
  for (const [dir, about] of FOLDERS) {
    const inDir = files.filter((f) => (dir === '.' ? !f.includes('/') : path.posix.dirname(f) === dir));
    if (!inDir.length) continue;
    L.push('');
    L.push(`## ${dir === '.' ? '(gốc)' : dir + '/'}`);
    L.push('');
    L.push(about + '.');
    L.push('');
    L.push('| Tệp | Dòng | Việc | Tạo ra | Dùng |');
    L.push('|---|---|---|---|---|');
    for (const f of inDir) {
      const I = info[f];
      const gs = [...I.g].filter((n) => owner.g[n] === f);
      const made = [...[...I.bk].map((n) => 'BK.' + n), ...I.glob]
        .map((x) => '`' + x + '`')
        .concat(gs.length ? ['G: ' + gs.length + ' dịch vụ'] : [])
        .join(' ');
      const deps = I.deps.map((d) => '`' + d + '`').join(' ');
      const title = (I.title || '(thiếu tiêu đề)').replace(/\|/g, '\\|');
      L.push(`| \`${f}\` | ${I.lines} | ${title} | ${made} | ${deps} |`);
    }
  }
  L.push('');
  L.push('## Dịch vụ G (tên → tệp tạo ra)');
  L.push('');
  L.push('Đối tượng G là bộ nhớ chung của game trên trang (game/loop.js lập, mỗi tệp `setup(G)` thêm dịch vụ của mình).');
  L.push('');
  const gByFile = {};
  for (const n in owner.g) (gByFile[owner.g[n]] = gByFile[owner.g[n]] || []).push(n);
  for (const f of order) if (gByFile[f]) L.push(`- \`${f}\`: ${gByFile[f].map((n) => '`G.' + n + '`').join(', ')}`);
  L.push('');
  L.push('## Thứ tự nạp trong index.html');
  L.push('');
  L.push('Tệp sau dùng được những gì tệp trước tạo ra. Thêm tệp mới: đặt sau mọi tệp nó dùng.');
  L.push('');
  L.push(order.map((f, i) => `${i + 1}. \`${f}\``).join('\n'));
  L.push('');
  const orphan = files.filter((f) => !f.startsWith('test/') && !f.startsWith('tools/') && !order.includes(f));
  return { text: L.join('\n'), files, order, info, orphan };
}

module.exports = { build, listFiles, titleOf, OUT };

if (require.main === module) {
  const { text } = build();
  if (process.argv.includes('--check')) {
    const now = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8') : '';
    if (now !== text) {
      console.log('MA-NGUON.md cũ: chạy node tools/code-map.js');
      process.exit(1);
    }
    console.log('MA-NGUON.md đúng với code');
  } else {
    fs.writeFileSync(OUT, text);
    console.log('Đã ghi MA-NGUON.md');
  }
}
