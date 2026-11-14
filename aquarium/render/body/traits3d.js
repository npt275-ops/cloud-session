/* Bể Kính · render/body/traits3d.js · Nét riêng và tỉ lệ theo tuổi của từng người (thân mềm, render/body/softbody3d.js)
 * of(người, tuổi) trả một bảng số cố định cho người đó (tính từ mã người: cùng người thì luôn cùng nét, qua mọi thời):
 *   age    lứa tuổi: baby (dưới 5), kid (dưới 12), teen (dưới 16), adult, old (từ 55)
 *   head   tỉ lệ đầu (trẻ nhỏ đầu to hẳn, như đồ chơi); eye cỡ mắt; gap khoảng cách hai mắt; brow độ dày lông mày (0: không có)
 *   nose   cỡ mũi; ear cỡ tai; mouth bề ngang miệng; wide dáng người (gầy, đầy đặn); belly có bụng tròn
 *   hair   kiểu tóc: cap (ngắn trùm), bangs (mái), spiky (tóc dựng), bun (búi), pony (đuôi ngựa), long (dài sau lưng),
 *          bald (hói, chỉ còn tóc hai bên), tuft (em bé: một lọn trên đỉnh)
 *   beard  râu (người già nam phần lớn có, đàn ông trưởng thành một số); freckle tàn nhang; blush má luôn hồng (trẻ nhỏ)
 * Không biết three.js, không biết logic: chỉ là số. Hàm thuần nên kiểm thử được (test/traits3d.test.js). */
(function (root) {
  const BK = root.BK || (root.BK = {});
  const AGE = [
    // [lứa, tuổi dưới, tỉ lệ đầu, cỡ mắt, cỡ mũi]
    ['baby', 5, 1.42, 1.34, 0.55],
    ['kid', 12, 1.24, 1.2, 0.72],
    ['teen', 16, 1.08, 1.06, 0.9],
    ['adult', 55, 1, 1, 1],
    ['old', 1e9, 0.98, 0.88, 1.15],
  ];
  const HAIR = {
    short: ['cap', 'bangs', 'spiky', 'cap', 'bangs'], // tóc ngắn (khung cũ không có tóc sau lưng)
    long: ['long', 'pony', 'bun', 'long'], // tóc dài (khung cũ có tóc sau lưng)
  };
  // băm chuỗi (FNV-1a) và số ngẫu nhiên theo hạt
  function hash(s) {
    s = String(s);
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }
  function rng(seed) {
    let s = seed || 1;
    return () => {
      s ^= s << 13;
      s ^= s >>> 17;
      s ^= s << 5;
      return (s >>> 0) / 4294967296;
    };
  }
  const bracket = (age) => AGE.find((a) => (age == null ? 30 : age) < a[1])[0];
  // longHair: khung cũ của người này có tóc sau lưng (render/rig3d.js hairBack), để kiểu tóc hợp với khung cũ ở xa
  function of(p, age, longHair) {
    const r = rng(hash(p && p.id != null ? p.id : 'x')),
      A = AGE.find((a) => (age == null ? 30 : age) < a[1]),
      k = A[0],
      male = p && p.sex === 'm',
      small = k === 'baby' || k === 'kid';
    // rút số theo thứ tự cố định (thêm nét mới thì thêm ở cuối, nét cũ không đổi)
    const rEye = r(),
      rGap = r(),
      rBrow = r(),
      rNose = r(),
      rWide = r(),
      rBelly = r(),
      rHair = r(),
      rBald = r(),
      rBeard = r(),
      rFreck = r(),
      rMouth = r(),
      rEar = r();
    let hair = (longHair ? HAIR.long : HAIR.short)[Math.floor(rHair * (longHair ? HAIR.long : HAIR.short).length)];
    if (k === 'baby') hair = 'tuft';
    else if (k === 'old' && male && rBald < 0.4) hair = 'bald';
    return {
      age: k,
      head: A[2],
      eye: A[3] * (0.9 + rEye * 0.2),
      gap: 0.082 + rGap * 0.016,
      brow: k === 'baby' ? 0 : 0.75 + rBrow * 0.6,
      nose: A[4] * (0.8 + rNose * 0.45),
      ear: 0.85 + rEar * 0.35,
      mouth: 0.9 + rMouth * 0.25,
      wide: small ? 1.06 : 0.9 + rWide * 0.25,
      belly: (k === 'adult' || k === 'old') && rBelly < 0.22,
      hair,
      beard: male && (k === 'old' ? rBeard < 0.7 : k === 'adult' && rBeard < 0.2),
      freckle: k !== 'old' && rFreck < 0.15,
      blush: small,
    };
  }
  BK.Traits3D = { of, bracket, hash, AGE };
})(typeof self !== 'undefined' ? self : globalThis);
