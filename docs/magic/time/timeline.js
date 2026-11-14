/* Bể Kính · magic/time/timeline.js · Ảnh chụp trận để tua lùi thời gian (design/ke-hoach-buoc-37.md, phép thời gian)
 * Mỗi EVERY ngày game chụp một ảnh trận (logic/save.js: chuỗi JSON), giữ các ảnh trong KEEP ngày gần nhất (người chơi chốt
 * 30 ngày). Tua lùi: lấy ảnh trước ngày hiện tại, nạp ra một thế giới mới rồi chép nội dung vào thế giới đang chạy (merge):
 * giữ nguyên đối tượng thế giới và từng đảo (phần vẽ đang trỏ vào chúng), chỉ thay nội dung bên trong. Những khoá trong KEEP_KEYS
 * (linh hồn: người chơi đứng ngoài thời gian, linh lực không quay lại) giữ như hiện tại.
 *   create({ every, keep })  trả T: { capture(W, force), due(W), back(W, revive), oldest(), count(), clear() }
 *     capture  chụp nếu đã tới lúc (hay force); trả true nếu có chụp
 *     due      đã tới lúc chụp chưa (để phần game chọn lúc rảnh mới chụp: chụp tốn vài chục mili giây ở cuối trận)
 *     back     lùi về ảnh ngay trước ngày hiện tại (ảnh đó bị lấy ra khỏi danh sách); revive(chuỗi) nạp ảnh ra thế giới mới;
 *              trả ngày đã lùi về, hay null nếu hết ảnh
 *   merge(W, W2)  chép W2 vào W tại chỗ (dùng chung)
 * Không vẽ gì, chạy được bằng Node. Cần: logic/save.js. */
(function (root, factory) {
  const BK = root.BK || (root.BK = {});
  BK.Timeline = factory(BK);
  if (typeof module === 'object' && module.exports) module.exports = BK.Timeline;
})(typeof self !== 'undefined' ? self : globalThis, function (BK) {
  'use strict';
  const EVERY = 3, // ngày game giữa hai ảnh
    KEEP = 30, // giữ ảnh trong chừng này ngày gần nhất
    KEEP_KEYS = ['soul']; // khoá của thế giới giữ nguyên khi tua lùi
  // chép b vào a tại chỗ: bỏ khoá a có mà b không có, gán khoá của b (trừ khoá giữ nguyên)
  function assign(a, b, keep) {
    for (const k of Object.keys(a)) if (!(k in b) && !(keep && keep.includes(k))) delete a[k];
    for (const k of Object.keys(b)) if (!(keep && keep.includes(k))) a[k] = b[k];
  }
  function merge(W, W2) {
    const isles = W.islands;
    assign(W, W2, KEEP_KEYS);
    // từng đảo: giữ đối tượng cũ, chép nội dung mới vào
    if (Array.isArray(isles) && Array.isArray(W2.islands)) {
      for (let i = 0; i < W2.islands.length; i++) {
        if (isles[i]) {
          assign(isles[i], W2.islands[i]);
          W2.islands[i] = isles[i];
        }
      }
      W.islands = W2.islands;
    }
    return W;
  }
  function create(o) {
    const every = (o && o.every) || EVERY,
      keep = (o && o.keep) || KEEP,
      Save = (o && o.Save) || BK.Save;
    const snaps = []; // [{ day, text }], cũ trước
    const last = () => snaps[snaps.length - 1];
    const due = (W) => !last() || W.day - last().day >= every || W.day < last().day;
    function capture(W, force) {
      if (!force && !due(W)) return false;
      // (lịch sử mới sau khi tua lùi: bỏ các ảnh "tương lai" không còn đúng)
      while (last() && last().day > W.day) snaps.pop();
      snaps.push({ day: W.day, text: Save.save(W) });
      while (snaps.length && W.day - snaps[0].day > keep) snaps.shift();
      return true;
    }
    function back(W, revive) {
      // ảnh gần nhất trước ngày hiện tại (cách ít nhất nửa ngày, để mỗi lần lùi thấy rõ)
      while (last() && last().day > W.day - 0.5) snaps.pop();
      const s = snaps.pop();
      if (!s) return null;
      merge(W, revive ? revive(s.text) : Save.load(s.text));
      return s.day;
    }
    return {
      capture,
      due,
      back,
      oldest: () => (snaps[0] ? snaps[0].day : null),
      count: () => snaps.length,
      clear: () => (snaps.length = 0),
    };
  }
  return { create, merge, EVERY, KEEP, KEEP_KEYS };
});
