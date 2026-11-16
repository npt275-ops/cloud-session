/* Bể Kính · render/units/isles/plains.js · Trang phục nhân vật Lúa Vàng (đảo thử: duyệt rồi mới làm 5 đảo còn lại)
 * Mỗi loại năm bậc (theo năm bậc công trình), mỗi bậc một dáng người của render/units/body.js. Màu cờ đảo (vàng) đi theo dải
 * chéo, áo choàng, khiên, tua giáo.
 *   dân nam    nón lá áo nâu vác cuốc; khăn đóng áo dài; mũ lưỡi trai sơ mi xách hộp đồ nghề; áo liền có vạch sáng cầm bảng
 *              sáng; áo dài trắng vàng có vầng sáng, cầm đèn
 *   dân nữ     nón lá áo tứ thân gánh thóc; nón quai thao áo dài xách giỏ; tóc dài váy xách túi; áo liền tóc búi cầm bảng sáng;
 *              áo dài trắng có vầng sáng
 *   lính gần   khăn buộc trán, giáo tre, khiên mây; mũ sắt giáp lá, kiếm, khiên tròn ký hiệu đảo, áo choàng; mũ lính, dùi cui,
 *              khiên chống bạo động; giáp sẫm mũ kính sáng, kiếm sáng; giáp trắng vàng, đại kiếm sáng, đôi cánh sáng
 *   lính xa    nón lá, nỏ, ống tên; mũ sắt, cung dài, ống tên; mũ lính, súng trường; mũ kính sáng, súng sáng; áo choàng phép,
 *              gậy phép có cầu sáng
 * Cần: render/units/units.js. */
(function (root) {
  const GOLD = '#e8c234'; // màu cờ Lúa Vàng
  root.BK.Units.look('plains', {
    farmer: [
      { hat: 'non', top: '#8a6a3a', legs: '#2e2620', shoes: '#c49a72', right: 'hoe' },
      { hat: 'khan', hatColor: '#1e1a16', top: '#3a4a6a', topStyle: 'robe', skirt: '#3a4a6a', legs: '#f0ece0', right: 'none' },
      { hat: 'cap', hatColor: '#3a4a6a', top: '#f0ece0', legs: '#2a3040', right: 'none', back: 'toolbox' },
      { hat: 'none', top: '#3a4458', legs: '#2a3040', glow: true, left: 'tablet', hair: '#2a2420' },
      { hat: 'halo', top: '#f8f2e0', topStyle: 'robe', skirt: '#f0e2b0', legs: '#f0e2b0', sash: GOLD, right: 'lantern', hair: '#3a2a20' },
    ],
    woman: [
      { female: true, hat: 'non', hairStyle: 'bun', top: '#7a5232', topStyle: 'dress', skirt: '#2e2620', back: 'pole' },
      { female: true, hat: 'quaithao', hatColor: '#3a2a1a', hairStyle: 'long', top: '#a8452c', topStyle: 'dress', skirt: '#f0ece0', left: 'basket' },
      { female: true, hairStyle: 'long', hair: '#3a2418', top: '#e8b4b8', topStyle: 'dress', skirt: '#3a4a6a', back: 'handbag' },
      { female: true, hairStyle: 'bun', top: '#4a3a5a', legs: '#2a2a3a', glow: true, left: 'tablet' },
      { female: true, hat: 'halo', hairStyle: 'long', hair: '#2a1a14', top: '#fff8e8', topStyle: 'robe', skirt: '#f8e8c0', sash: GOLD, right: 'lantern' },
    ],
    melee: [
      { hat: 'band', top: '#7a5a3a', legs: '#2e2620', shoes: '#c49a72', sash: GOLD, right: 'spear', left: 'shieldRound' },
      { hat: 'helm', hatColor: '#8e9196', top: '#8c2a22', topStyle: 'armor', plate: '#8e9196', legs: '#3b3530', cape: GOLD, right: 'sword', left: 'shieldRound' },
      { hat: 'helmet', hatColor: '#4a6040', top: '#4a6040', legs: '#3a4a34', shoes: '#1e1e1e', right: 'baton', left: 'riotShield' },
      { hat: 'visor', hatColor: '#2e3646', top: '#232a36', topStyle: 'armor', plate: '#3a4458', legs: '#161b24', glow: true, cape: GOLD, right: 'energySword', left: 'shieldRound' },
      { hat: 'halo', top: '#f8f2e0', topStyle: 'armor', plate: '#e8d08a', legs: '#e0d0a0', cape: GOLD, right: 'greatsword', back: 'wings' },
    ],
    ranged: [
      { hat: 'non', top: '#6a5a3a', legs: '#2e2620', shoes: '#c49a72', sash: GOLD, right: 'crossbow', left: 'crossbow', back: 'quiver' },
      { hat: 'helm', hatColor: '#8e9196', top: '#6a4a2a', legs: '#3b3530', sash: GOLD, left: 'bow', back: 'quiver' },
      { hat: 'helmet', hatColor: '#4a6040', top: '#4a6040', legs: '#3a4a34', shoes: '#1e1e1e', sash: GOLD, right: 'rifle', left: 'rifle' },
      { hat: 'visor', hatColor: '#2e3646', top: '#232a36', legs: '#161b24', glow: true, sash: GOLD, right: 'laserRifle', left: 'laserRifle' },
      { hat: 'halo', top: '#6a5ab8', topStyle: 'robe', skirt: '#4a3a98', legs: '#4a3a98', cape: GOLD, right: 'staff', hair: '#e8e0d0' },
    ],
  });
})(typeof self !== 'undefined' ? self : globalThis);
