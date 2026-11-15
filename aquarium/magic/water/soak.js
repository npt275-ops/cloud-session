/* Bể Kính · magic/water/soak.js · Hậu quả của phép nước lên thế giới (luật, chạy được bằng Node; test/soak.test.js)
 *   douse(S, khoá[])       dập lửa những chỗ đang cháy vì phép lửa (magic/fire/blaze.js); trả số chỗ đã dập
 *   rain(S, ngày)          mưa trên đảo: hết hạn hán, hết cháy rừng ngay (logic/climate.js: thiên tai tan, ghi vào biên niên);
 *                          trả danh sách thiên tai đã tan
 *   flood(S, ngày, chỗ[])  sóng đại hồng thuỷ tràn vào đảo: mọi lửa tắt, hết hạn hán; chỗ ven biển mất COAST_HIT độ bền,
 *                          chỗ trong đảo mất INLAND_HIT (logic/siege.js hit: kho ngập thì mất hàng, thợ sửa lại sau); đảo bị
 *                          lũ lụt FLOOD_DAYS ngày (logic/climate.js: ruộng ngập, ít lương thực, dân căng thẳng)
 *                          chỗ[]: [{ key, coast: ven biển hay không }] (phần vẽ biết chỗ nào ở đâu)
 * Cần: logic/climate.js, logic/siege.js, magic/fire/blaze.js (dập lửa). */
(function (root, factory) {
  const BK = root.BK || (root.BK = {});
  BK.WaterSoak = factory(BK);
  if (typeof module === 'object' && module.exports) module.exports = BK.WaterSoak;
})(typeof self !== 'undefined' ? self : globalThis, function (BK) {
  'use strict';
  const COAST_HIT = 0.3,
    INLAND_HIT = 0.08,
    FLOOD_DAYS = 8;
  const DRY = ['drought', 'wildfire']; // thiên tai mưa làm tan
  function douse(S, keys) {
    if (!S.blaze) return 0;
    let n = 0;
    for (const k of keys || Object.keys(S.blaze))
      if (S.blaze[k]) {
        delete S.blaze[k];
        n++;
      }
    return n;
  }
  // thiên tai khô hạn đang có thì tan ngay (hết hạn vào ngày này; logic/climate.js dayTick ghi "đã qua")
  function rain(S, day) {
    const C = S.climate;
    const gone = [];
    if (C)
      for (const e of C.active)
        if (DRY.includes(e.key) && e.until > day) {
          e.until = day;
          gone.push(e.key);
        }
    if (S.situ && S.situ.drought > day) S.situ.drought = day;
    if (gone.length) S.situChanged = true;
    return gone;
  }
  function flood(S, day, sites) {
    douse(S);
    rain(S, day);
    for (const s of sites || []) BK.Siege.hit(S, s.key, s.coast ? COAST_HIT : INLAND_HIT);
    if (BK.Climate) BK.Climate.start(S, 'flood', FLOOD_DAYS, 1.2);
    S.log.push({ day: Math.floor(day), kind: 'climate', climate: 'deluge', ids: [], text: 'Đại hồng thuỷ: sóng biển tràn vào ' + S.name + '.' });
    S.situChanged = true;
  }
  return { douse, rain, flood, COAST_HIT, INLAND_HIT, FLOOD_DAYS };
});
