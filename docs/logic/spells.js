/* Bể Kính · logic/spells.js · Luật của sách phép thuật (design/ke-hoach-buoc-37.md)
 * Sách thuộc về linh hồn (người chơi), chỉ dùng được khi đang nhập hồn. Mỗi phép tốn linh lực (tự hồi theo giờ thật) và có thời
 * gian hồi phép. Trạng thái nằm trong thế giới (W.soul.magic: được lưu cùng trận): { mana, cd: { phép: giây còn lại } }.
 *   SCHOOLS  các trang của sách theo thứ tự; SPELLS danh sách phép (id, trang, tên, giá, hồi phép, cách dùng, điều kiện, đã mở chưa)
 *   state(W)          trạng thái phép (tạo nếu chưa có)
 *   regen(W, giây, giữ)  hồi linh lực, giảm thời gian hồi phép (giờ thật: cả lúc dừng thời gian); đang giữ phép (giữ = true) thì
 *                     linh lực không hồi (giữ phép phải cạn dần)
 *   can(W, id, ctx)   dùng được không: { ok, why }; ctx: { inside: đang ở trong thân, nearSea: đang ở gần biển }
 *   cast(W, id, ctx)  trừ linh lực, đặt hồi phép: { ok, why, cost }
 *   channel(W, id, giây, ctx)  phép giữ phím: trừ linh lực theo giây đang giữ (cost là mỗi giây); hết linh lực thì { ok: false }
 *   price(s)          giá thật của phép s (lúc thử: DEV.cost cho mọi phép)
 *   DEV               chế độ thử: { infinite: linh lực vô hạn (không bị trừ), cost: giá chung cho mọi phép (null: giá riêng) }
 * Tác động lên thế giới của từng phép nằm ở tệp riêng của hệ đó (bước sau). Không vẽ gì, chạy được bằng Node. */
(function (root, factory) {
  const BK = root.BK || (root.BK = {});
  BK.Spells = factory(BK);
  if (typeof module === 'object' && module.exports) module.exports = BK.Spells;
})(typeof self !== 'undefined' ? self : globalThis, function () {
  'use strict';
  const MANA_MAX = 100,
    REGEN = 7; // linh lực hồi mỗi giây thật
  // chế độ thử (người chơi chốt lúc làm game): mọi phép giá 5, linh lực vô hạn. Chơi thật thì infinite: false, cost: null
  const DEV = { infinite: true, cost: 5 };
  const SCHOOLS = [
    { id: 'soul', name: 'Linh hồn' },
    { id: 'time', name: 'Thời gian' },
    { id: 'fire', name: 'Lửa' },
    { id: 'earth', name: 'Đất' },
    { id: 'water', name: 'Nước' },
  ];
  // use: 'tap' bấm một lần; 'hold' giữ (tốn linh lực mỗi giây: cost là mỗi giây); 'toggle' bấm bật, bấm tắt
  // aim: phép cần ngắm chỗ trên mặt đất; self: phát ngay chỗ nhân vật; need: 'sea' chỉ dùng được khi ở gần biển
  // open: đã làm xong (chưa mở thì sách ghi "sắp có")
  const SPELLS = [
    { id: 'soulBolt', school: 'soul', name: 'Tia linh lực', cost: 8, cd: 0.5, use: 'tap', aim: true, open: true, desc: 'Một đốm sáng linh hồn bay tới chỗ ngắm rồi bung ra. Phép thử, chưa tác động lên thế giới.' },
    { id: 'blackHole', school: 'soul', name: 'Hố đen', cost: 45, cd: 12, use: 'tap', aim: true, desc: 'Hố đen có vành sáng ở chỗ ngắm, hút hạt, hút người nhẹ về tâm vài giây.' },
    { id: 'timeStop', school: 'time', open: true, name: 'Dừng thời gian', cost: 30, cd: 8, use: 'toggle', self: true, desc: 'Cả thế giới đứng im, chỉ linh hồn vẫn đi lại được.' },
    { id: 'timeFast', school: 'time', open: true, name: 'Tua nhanh', cost: 14, cd: 0, use: 'hold', self: true, desc: 'Giữ để thời gian trôi nhanh 8 lần, 16 lần.' },
    { id: 'timeBack', school: 'time', open: true, name: 'Tua lùi', cost: 20, cd: 0, use: 'hold', self: true, desc: 'Giữ để lùi từng ngày, xa nhất 30 ngày.' },
    { id: 'fireball', school: 'fire', name: 'Cầu lửa', cost: 20, cd: 1.5, use: 'tap', aim: true, desc: 'Ném quả cầu lửa; trúng nhà thì bén lửa.' },
    { id: 'fireRing', school: 'fire', name: 'Vòng lửa', cost: 35, cd: 8, use: 'tap', self: true, desc: 'Vòng lửa quanh mình, không ai đi qua được.' },
    { id: 'pillar', school: 'earth', name: 'Trụ đá', cost: 25, cd: 4, use: 'tap', self: true, desc: 'Trụ đá trồi lên ngay dưới chân, nâng mình lên cao.' },
    { id: 'quake', school: 'earth', name: 'Rung đất', cost: 40, cd: 10, use: 'tap', aim: true, desc: 'Sóng đất toả ra, người gần đó ngã ngồi.' },
    { id: 'rain', school: 'water', name: 'Gọi mưa', cost: 30, cd: 10, use: 'tap', aim: true, desc: 'Mây nhỏ kéo đến, mưa dập lửa, tưới ruộng.' },
    { id: 'geyser', school: 'water', name: 'Cột nước', cost: 25, cd: 3, use: 'tap', aim: true, desc: 'Cột nước phun lên, đẩy người ra xa, dập lửa.' },
    { id: 'deluge', school: 'water', name: 'Đại hồng thuỷ', cost: 100, cd: 120, use: 'tap', self: true, need: 'sea', desc: 'Chỉ khi ở gần biển: lốc xoáy nước, cả bể dâng cao rồi đổ ập, sóng tràn vào sáu đảo.' },
  ];
  const BY = new Map(SPELLS.map((s) => [s.id, s]));
  const price = (s) => (DEV.cost != null ? DEV.cost : s.cost);
  function state(W) {
    const soul = W.soul || (W.soul = {});
    return soul.magic || (soul.magic = { mana: MANA_MAX, cd: {} });
  }
  function regen(W, sec, holding) {
    if (!(sec > 0)) return;
    const m = state(W);
    if (!holding) m.mana = Math.min(MANA_MAX, m.mana + REGEN * sec);
    for (const id in m.cd) {
      m.cd[id] -= sec;
      if (m.cd[id] <= 0) delete m.cd[id];
    }
  }
  const WHY = {
    unknown: 'Không có phép này',
    soon: 'Sắp có',
    outside: 'Chỉ dùng được khi đang nhập hồn',
    sea: 'Phải ở gần biển',
    cooldown: 'Đang hồi phép',
    mana: 'Không đủ linh lực',
  };
  function can(W, id, ctx) {
    const s = BY.get(id),
      m = state(W),
      c = ctx || {};
    const no = (why) => ({ ok: false, why, text: WHY[why] });
    if (!s) return no('unknown');
    if (!s.open) return no('soon');
    if (!c.inside) return no('outside');
    if (s.need === 'sea' && !c.nearSea) return no('sea');
    if (m.cd[id] > 0) return no('cooldown');
    if (!DEV.infinite && m.mana < price(s)) return no('mana');
    return { ok: true };
  }
  function cast(W, id, ctx) {
    const r = can(W, id, ctx);
    if (!r.ok) return r;
    const s = BY.get(id),
      m = state(W);
    if (!DEV.infinite) m.mana -= price(s);
    if (s.cd > 0) m.cd[id] = s.cd;
    return { ok: true, cost: price(s) };
  }
  function channel(W, id, sec, ctx) {
    const s = BY.get(id),
      m = state(W),
      c = ctx || {};
    if (!s || !s.open) return { ok: false, why: 'soon', text: WHY.soon };
    if (!c.inside) return { ok: false, why: 'outside', text: WHY.outside };
    const need = price(s) * Math.max(0, sec);
    if (DEV.infinite) return { ok: true, cost: need };
    if (m.mana < need || m.mana <= 0) return { ok: false, why: 'mana', text: WHY.mana };
    m.mana -= need;
    return { ok: true, cost: need };
  }
  return { SCHOOLS, SPELLS, BY, MANA_MAX, REGEN, DEV, WHY, price, state, regen, can, cast, channel };
});
