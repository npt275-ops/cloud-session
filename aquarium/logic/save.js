/* Bể Kính · logic/save.js · Lưu và nạp lại cả trận (design/ke-hoach-khac-phuc.md mục 1.4)
 * save(W) → chuỗi JSON; load(chuỗi, o) → thế giới y như lúc lưu, chạy tiếp ra đúng lịch sử như không lưu.
 * Giữ nguyên tham chiếu dùng chung (một người vừa ở trong S.people vừa ở trong đoàn quân w.troops là cùng một đối tượng):
 * đối tượng gặp lần đầu ghi { $id, ... }, gặp lại ghi { $ref }. Map ghi { $m: [[khoá, giá trị]] }, Set ghi { $s: [...] },
 * bộ số ngẫu nhiên (logic/rng.js) ghi { $rng: trạng thái }. Hàm không lưu (o.restore nạp lại: kế hoạch dựng công trình của
 * phần vẽ). Không vẽ gì, chạy được bằng Node. Cần: logic/rng.js. */
(function (root, factory) {
  const BK = root.BK || (root.BK = {});
  BK.Save = factory(BK);
  if (typeof module === 'object' && module.exports) module.exports = BK.Save;
})(typeof self !== 'undefined' ? self : globalThis, function (BK) {
  'use strict';
  const VERSION = 1;
  const isRng = (v) => v && typeof v.next === 'function' && typeof v.chance === 'function' && 'state' in v;
  function encode(root) {
    const ids = new Map(); let next = 1;
    function enc(v) {
      if (v === null || typeof v !== 'object') return typeof v === 'function' || typeof v === 'undefined' ? undefined : typeof v === 'number' && !Number.isFinite(v) ? { $num: String(v) } : v;
      if (ids.has(v)) return { $ref: ids.get(v) };
      const id = next++; ids.set(v, id);
      if (isRng(v)) return { $id: id, $rng: v.state };
      if (v instanceof Map) return { $id: id, $m: [...v].map(([k, x]) => [enc(k), enc(x)]) };
      if (v instanceof Set) return { $id: id, $s: [...v].map(enc) };
      if (Array.isArray(v)) return { $id: id, $a: v.map((x) => { const e = enc(x); return e === undefined ? null : e; }) };
      const o = { $id: id };
      for (const k of Object.keys(v)) { const e = enc(v[k]); if (e !== undefined) o[k === '$id' || k.startsWith('$') ? '$$' + k : k] = e; }
      return o;
    }
    return enc(root);
  }
  function decode(data) {
    const byId = new Map(), fix = [];
    function dec(v) {
      if (v === null || typeof v !== 'object') return v;
      if (Array.isArray(v)) return v.map(dec);
      if (v.$num != null) return Number(v.$num);
      if (v.$ref != null) { if (byId.has(v.$ref)) return byId.get(v.$ref); const hole = { $hole: v.$ref }; fix.push(hole); return hole; }
      if (v.$rng != null) { const r = BK.Rng.create(1); r.state = v.$rng; byId.set(v.$id, r); return r; }
      if (v.$m) { const m = new Map(); byId.set(v.$id, m); for (const [k, x] of v.$m) m.set(dec(k), dec(x)); return m; }
      if (v.$s) { const s = new Set(); byId.set(v.$id, s); for (const x of v.$s) s.add(dec(x)); return s; }
      if (v.$a) { const a = []; byId.set(v.$id, a); for (const x of v.$a) a.push(dec(x)); return a; }
      const o = {}; if (v.$id != null) byId.set(v.$id, o);
      for (const k of Object.keys(v)) { if (k === '$id') continue; o[k.startsWith('$$') ? k.slice(2) : k] = dec(v[k]); }
      return o;
    }
    const out = dec(data);
    // tham chiếu tới đối tượng chưa dựng xong (vòng): thay lỗ bằng đối tượng thật
    if (fix.length) {
      const seen = new Set();
      const walk = (x) => {
        if (!x || typeof x !== 'object' || seen.has(x)) return; seen.add(x);
        const sub = (v) => (v && v.$hole != null ? byId.get(v.$hole) : v);
        if (x instanceof Map) { for (const [k, v] of [...x]) { x.set(k, sub(v)); walk(x.get(k)); } return; }
        if (x instanceof Set) { for (const v of x) walk(v); return; }
        for (const k of Object.keys(x)) { x[k] = sub(x[k]); walk(x[k]); }
      };
      walk(out);
    }
    return out;
  }
  function save(W) { return JSON.stringify({ v: VERSION, w: encode(W) }); }
  // o.restore(W): gắn lại những gì không lưu được (hàm), sau khi nạp
  function load(text, o) {
    const d = typeof text === 'string' ? JSON.parse(text) : text;
    if (!d || d.v !== VERSION) return null;
    const W = decode(d.w);
    if (o && o.restore) o.restore(W);
    return W;
  }
  return { save, load, VERSION };
});
