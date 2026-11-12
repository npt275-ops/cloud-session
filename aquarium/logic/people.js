/* Bể Kính · logic/people.js
 * Một người có tên: gia tộc, giới tính, ngày sinh, cha mẹ, vợ chồng, con cái, bộ gen, vai trong hội đồng.
 * Tuổi, cái chết vì già, và các quan hệ họ hàng (anh chị em ruột, anh em họ).
 * Cần: logic/rules.js, logic/genes.js. */
(function (root, factory) {
  const BK = root.BK || (root.BK = {});
  BK.People = factory(BK);
  if (typeof module === 'object' && module.exports) module.exports = BK.People;
})(typeof self !== 'undefined' ? self : globalThis, function (BK) {
  'use strict';
  const R = BK.Rules;

  /* ---------- Tên ---------- */
  // tên gia tộc theo từng đảo: những thứ của đất mình (đồng lúa, rừng, núi, băng, biển, cát)
  const CLANS = {
    plains: ['Thóc', 'Mạ', 'Rơm', 'Đòng', 'Cốm', 'Liềm', 'Cò', 'Bông'],
    forest: ['Thông', 'Lim', 'Sồi', 'Nấm', 'Rêu', 'Dương', 'Tùng', 'Bách'],
    mountain: ['Đá', 'Mây', 'Ưng', 'Sắt', 'Vách', 'Gió', 'Đèo', 'Mỏ'],
    tundra: ['Tuyết', 'Băng', 'Sương', 'Giá', 'Bạc', 'Gấu', 'Hàn', 'Cực'],
    coast: ['Sóng', 'Hàu', 'Ngọc', 'Muối', 'Buồm', 'Cói', 'San', 'Rạn'],
    desert: ['Cát', 'Hồng', 'Nắng', 'Gò', 'Sỏi', 'Ngải', 'Kê', 'Đụn'],
  };
  const GIVEN = {
    m: [
      'Hùng',
      'Sơn',
      'Khoa',
      'Tùng',
      'Bảo',
      'Đạt',
      'Lâm',
      'Phong',
      'Vĩnh',
      'Tâm',
      'Quang',
      'Nam',
      'Hải',
      'Dũng',
      'Kiên',
      'Thịnh',
      'Lộc',
      'Trí',
      'An',
      'Tín',
      'Mạnh',
      'Hưng',
      'Khải',
      'Toàn',
    ],
    f: [
      'Lan',
      'Mai',
      'Hoa',
      'Thảo',
      'Ngọc',
      'Hà',
      'Linh',
      'Yến',
      'Trang',
      'Vy',
      'Nhi',
      'Hương',
      'Thu',
      'Châu',
      'Diệp',
      'My',
      'Quyên',
      'Xuân',
      'Ánh',
      'Nga',
      'Hạnh',
      'Uyên',
      'Liên',
      'Tuyết',
    ],
  };
  function pickName(rng, sex, used) {
    const list = GIVEN[sex];
    for (let i = 0; i < 40; i++) {
      const n = rng.pick(list);
      if (!used || !used.has(n)) return n;
    }
    return rng.pick(list);
  }

  /* ---------- Một người ---------- */
  // born: ngày sinh trong game (có thể âm với người đầu tiên, để họ đã trưởng thành khi trận bắt đầu)
  function create(o) {
    return {
      id: o.id,
      name: o.name,
      clan: o.clan,
      sex: o.sex,
      born: o.born,
      parents: o.parents || [],
      spouse: null,
      spouses: [],
      children: [],
      alive: true,
      died: null,
      cause: null,
      commoner: !!o.commoner, // người dân thường cưới vào hội đồng (mang dòng máu mới)
      gen: o.gen || 0, // đời thứ mấy (0: tám người đầu tiên)
      role: null, // vai trong hội đồng, null nếu không có ghế
      genome: o.genome,
    };
  }
  const ageOf = (p, day) => (day - p.born) * R.AGE_PER_DAY;
  // tính cách biểu hiện (gen gốc + dấu ngoại gen, logic/epigen.js): mọi chỗ ra quyết định đọc ở đây; lai gen dùng gen gốc
  const traits = (p) => p.traits || p.genome.traits;
  const fullName = (p) => p.clan + ' ' + p.name;

  /* ---------- Họ hàng ---------- */
  const shareParent = (a, b) => a.parents.length && b.parents.some((x) => a.parents.includes(x));
  function grandparents(p, byId) {
    const out = [];
    for (const id of p.parents) {
      const q = byId.get(id);
      if (q) out.push(...q.parents);
    }
    return out;
  }
  // quan hệ cấm kết hôn: chính mình, cha mẹ con, anh chị em ruột (chung ít nhất một cha hoặc mẹ)
  function forbidden(a, b) {
    return a === b || a.parents.includes(b.id) || b.parents.includes(a.id) || shareParent(a, b);
  }
  // anh em họ: chung ông bà
  function cousins(a, b, byId) {
    const ga = grandparents(a, byId);
    return ga.length > 0 && grandparents(b, byId).some((x) => ga.includes(x));
  }

  /* ---------- Già đi và mất ---------- */
  // rủi ro mất mỗi năm đời người (Gompertz, logic/rules.js MORTALITY_*), y học theo thời (level); một ngày trong game là
  // AGE_PER_DAY năm đời người. Trả về true nếu người này vừa mất (dưới tuổi già: 'bệnh', từ tuổi già: 'già')
  const yearlyRisk = (age, level) =>
    Math.min(
      0.95,
      R.MORTALITY_A * Math.max(R.MEDICINE_FLOOR, 1 - R.MEDICINE * ((level || 1) - 1)) * Math.exp(R.MORTALITY_B * (Math.max(age, 20) - 20)),
    );
  function ageStep(p, day, rng, level) {
    if (!p.alive) return false;
    const age = ageOf(p, day);
    if (age < R.ADULT_AGE) return false;
    if (rng.chance(yearlyRisk(age, level) * R.AGE_PER_DAY)) {
      p.alive = false;
      p.died = day;
      p.cause = age < R.OLD_AGE ? 'bệnh' : 'già';
      return true;
    }
    return false;
  }

  return { CLANS, GIVEN, pickName, create, ageOf, traits, fullName, forbidden, cousins, ageStep, yearlyRisk };
});
