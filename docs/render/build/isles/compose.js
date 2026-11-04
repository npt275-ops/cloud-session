/* Bể Kính · render/build/isles/compose.js · Ghép bố cục 12 thời cho năm đảo
 * Mỗi đảo một tệp (forest.js, mountain.js, tundra.js, coast.js, desert.js) gọi BK.IslesCompose.define(theme). theme ghi cho
 * từng thời: kiểu nhà riêng, kiểu nhà chính, kỳ quan (kiểu và tên), tên gọi; và bảng màu của đảo theo bốn giai đoạn (xưa,
 * cận đại, hiện đại, tương lai). Tệp này dựng ERA[cấp] = { yard, pieces, BUILD, NAME, tint } giống Lúa Vàng:
 *   nhà chính ở giữa, 20 nhà riêng (render/build/plains/common.js homes), vài công trình nhỏ quanh sân theo giai đoạn,
 *   lớp đường, tường sát mép đảo và xe (plains/town.js), công trình ngoài làng (plains/outer.js), kỳ quan (plains/wonders.js),
 *   công trình công cộng (render/build/civic.js), nhà nhỏ và toà dáng lạ xen giữa nhà riêng; tất cả tô theo bảng màu của đảo. Đăng ký vào BK.Isles3D[khoá địa hình] để render/buildings3d.js đọc.
 * Cần: render/build/isles/arch.js, render/build/plains/common.js, outer.js, wonders.js, town.js. */
(function (root) {
  const BK = root.BK, P = BK.Plains3D, A = BK.IslesArch;
  const THREE = () => window.THREE;
  BK.Isles3D = BK.Isles3D || {};
  // giai đoạn của một cấp: 0 xưa (1-3), 1 cận đại (4-5), 2 hiện đại (6-8), 3 tương lai (9-12)
  const stage = (lv) => (lv <= 3 ? 0 : lv <= 5 ? 1 : lv <= 8 ? 2 : 3);
  // công trình nhỏ quanh sân theo giai đoạn (mỗi thời một bộ, đổi qua từng thời)
  const EXTRAS = [null,
    ['fire', 'totem', 'stones'], ['fire', 'stalls', 'field', 'totem'], ['well', 'stalls', 'windmill', 'field'],
    ['well', 'stalls', 'lamp', 'windmill'], ['works', 'stalls', 'lamp', 'fountain'],
    ['fountain', 'antenna', 'stalls', 'lamp'], ['antenna', 'solar', 'dronePad', 'fountain'], ['dronePad', 'solar', 'antenna', 'beacon'],
    ['pod', 'beacon', 'fountain', 'solar'], ['solar', 'beacon', 'pod', 'dronePad'], ['shard', 'beacon', 'pod', 'shard'], ['shard', 'shard', 'beacon', 'fountain']];
  const EXTRA_NAME = { fire: 'Bếp lửa', totem: 'Cột vật tổ', stones: 'Đá dựng', stalls: 'Chợ phiên', field: 'Ruộng', well: 'Giếng', windmill: 'Cối xay gió', lamp: 'Đèn đường', works: 'Xưởng', fountain: 'Đài phun nước', antenna: 'Cột ăng-ten', solar: 'Pin mặt trời', dronePad: 'Bãi drone', pod: 'Vườn khoang', beacon: 'Cột tín hiệu', shard: 'Mảnh pha lê' };
  const SPOTS = [[9, 7], [-9, 7], [12.5, -3], [-12.5, -3], [0, 13], [6, -15], [-6, -15]];
  // nhà nhỏ đứng xen (theo giai đoạn) và toà dáng lạ (thời 6 tới 12) của từng đảo: cao thấp không đều, mỗi thời một dáng lạ khác,
  // trong cùng một thời không có hai đảo chung dáng lạ
  const SMALL = { forest: ['lean', 'stilt', 'villa', 'sphereHouse'], mountain: ['tent', 'cliff', 'cubeStack', 'capsule'], tundra: ['tent', 'igloo', 'capsule', 'sphereHouse'], coast: ['lean', 'stilt', 'villa', 'capsule'], desert: ['tent', 'adobe', 'cubeStack', 'sphereHouse'] };
  const ODD = { forest: ['cantilever', 'twin', 'mushroom', 'helix', 'ringTower', 'tilt', 'inverted'], mountain: ['tilt', 'cantilever', 'helix', 'inverted', 'twin', 'mushroom', 'ringTower'],
    tundra: ['twin', 'ringTower', 'cantilever', 'mushroom', 'helix', 'inverted', 'tilt'], coast: ['inverted', 'tilt', 'ringTower', 'cantilever', 'mushroom', 'helix', 'twin'], desert: ['ringTower', 'helix', 'inverted', 'twin', 'tilt', 'cantilever', 'mushroom'] };
  const HNAME = { lean: 'Lều lá nhỏ', tent: 'Lều nhỏ', stilt: 'Nhà sàn nhỏ', cliff: 'Nhà đá nhỏ', igloo: 'Nhà băng nhỏ', adobe: 'Nhà đất nhỏ', villa: 'Biệt thự mái bằng', cubeStack: 'Nhà khối chồng', capsule: 'Nhà con nhộng', sphereHouse: 'Nhà cầu tròn',
    cantilever: 'Cao ốc cánh hẫng', twin: 'Tháp đôi cầu nối', mushroom: 'Tháp nấm', helix: 'Tháp xoắn ốc', ringTower: 'Tháp vòng', tilt: 'Tháp nghiêng', inverted: 'Kim tự tháp ngược' };
  const ORDER = ['forest', 'mountain', 'tundra', 'coast', 'desert'];
  // pha màu về phía một màu nhấn (dùng cho công trình mượn của Lúa Vàng: đường, công trình ngoài làng, kỳ quan)
  function tintTo(hex, amt) { let to = null; return (c) => { if (!to) to = new (THREE().Color)(hex); c.lerp(to, amt); }; }
  const mix = (a, b, t) => { const C = THREE().Color, x = new C(a).lerp(new C(b), t); return '#' + x.getHexString(); };

  function define(theme) {
    const S = { ERA: {}, key: theme.key, name: theme.name };
    for (let lv = 1; lv <= 12; lv++) {
      const E = theme.eras[lv], st = stage(lv), base = theme.pal[st], next = theme.pal[Math.min(3, st + 1)];
      // bảng màu của thời: bảng của giai đoạn, ngả dần về giai đoạn sau theo cấp
      const t = { 1: 0, 2: 0.2, 3: 0.4, 4: 0, 5: 0.35, 6: 0, 7: 0.25, 8: 0.5, 9: 0, 10: 0.2, 11: 0.4, 12: 0.6 }[lv];
      const pal = {}; for (const k in base) pal[k] = mix(base[k], next[k], t);
      const hallPal = Object.assign({}, pal, theme.hallPal ? theme.hallPal[st] : {});
      const yard = { x: 0, z: 2, r: Math.min(22, 11 + lv), color: mix(theme.yard[0], theme.yard[1], (lv - 1) / 11) };
      const pieces = [{ kind: 'hall', x: 0, z: -8, clear: 8, pal: hallPal, pre: lv === 1 }];
      // nhà riêng: từ thời 3 có nhà nhỏ xen giữa, từ thời 6 có thêm toà dáng lạ
      let small = lv >= 3 ? SMALL[theme.key][st] : null; if (small === E.home) small = SMALL[theme.key][Math.min(3, st + 1)];
      const odd = lv >= 6 ? ODD[theme.key][lv - 6] : null;
      const homes = P.homes('home', { pal }, small || odd ? { small: small ? 'homeS' : null, odd: odd ? 'homeO' : null } : null);
      homes.forEach((h, i) => { if (lv === 1 && i < 4) h.pre = true; });
      pieces.push(...homes);
      // nhà chính: dòng nhà chính riêng của đảo, lên cấp đều qua 12 thời (render/build/isles/halls.js)
      const BUILD = { hall: BK.IslesHalls.build(theme.key), home: A.HOME[E.home] }, NAME = { hall: BK.IslesHalls.nameOf(theme.key, lv), home: E.homeName };
      if (small) { BUILD.homeS = A.HOME[small]; NAME.homeS = HNAME[small] || E.homeName; }
      if (odd) { BUILD.homeO = A.HOME[odd]; NAME.homeO = HNAME[odd]; }
      EXTRAS[lv].forEach((x, i) => { const kind = 'x_' + x + i; pieces.push({ kind, x: SPOTS[i][0], z: SPOTS[i][1], clear: 3, v: i, pal, face: [0, 2] }); BUILD[kind] = A.EXTRA[x]; NAME[kind] = EXTRA_NAME[x]; });
      const L = { yard, pieces, BUILD, NAME };
      P.TOWN.addTo(L, lv, tintTo(theme.accent, 0.22), theme.key); // đường riêng của đảo
      P.OUTER.addTo(L, lv, tintTo(theme.accent, 0.25));
      if (BK.Gates3D) BK.Gates3D.addTo(L, lv, theme.key); // cổng thành riêng của đảo, giữa mép trước
      if (BK.Civic3D) BK.Civic3D.addTo(L, lv, pal, ORDER.indexOf(theme.key) + 1); // trường, thư viện, bảo tàng, bệnh viện…
      const w = E.wonder, wb = typeof w[0] === 'number' ? P.WONDERS.BUILD[w[0]] : A.WONDER[w[0]];
      const wpal = Object.assign({}, pal, theme.wonderPal || {});
      if (typeof w[0] === 'number') P.WONDERS.addTo(L, lv, wb, w[1], tintTo(theme.accent, 0.35));
      else { P.WONDERS.addTo(L, lv, (k, o) => wb(k, Object.assign(Object.create(o), { pal: wpal })), w[1]); }
      S.ERA[lv] = L;
    }
    BK.Isles3D[theme.key] = S;
    return S;
  }
  BK.IslesCompose = { define, stage, EXTRAS };
})(typeof self !== 'undefined' ? self : globalThis);
