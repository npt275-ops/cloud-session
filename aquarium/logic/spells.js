/* Bể Kính · logic/spells.js · Luật của sách phép thuật (design/ke-hoach-buoc-37.md)
 * Sách thuộc về linh hồn (người chơi), chỉ dùng được khi đang nhập hồn. Mỗi phép tốn linh lực (tự hồi theo giờ thật) và có thời
 * gian hồi phép. Trạng thái nằm trong thế giới (W.soul.magic: được lưu cùng trận): { mana, cd: { phép: giây còn lại } }.
 *   SCHOOLS  các trang của sách theo thứ tự; SPELLS danh sách phép (id, trang, tên, giá, hồi phép, cách dùng, điều kiện, đã mở chưa)
 *   state(W)          trạng thái phép (tạo nếu chưa có)
 *   regen(W, giây)    hồi linh lực, giảm thời gian hồi phép (giờ thật: cả lúc dừng thời gian)
 *   can(W, id, ctx)   dùng được không: { ok, why }; ctx: { inside: đang ở trong thân, nearSea: đang ở gần biển }
 *   cast(W, id, ctx)  trừ linh lực, đặt hồi phép: { ok, why, cost }
 * Tác động lên thế giới của từng phép nằm ở tệp riêng của hệ đó (bước sau). Không vẽ gì, chạy được bằng Node. */
(function (root, factory) {
  const BK = root.BK || (root.BK = {});
  BK.Spells = factory(BK);
  if (typeof module === 'object' && module.exports) module.exports = BK.Spells;
})(typeof self !== 'undefined' ? self : globalThis, function () {
  'use strict';
  const MANA_MAX = 100,
    REGEN = 7; // linh lực hồi mỗi giây thật
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
    { id: 'timeStop', school: 'time', name: 'Dừng thời gian', cost: 30, cd: 8, use: 'toggle', self: true, desc: 'Cả thế giới đứng im, chỉ linh hồn vẫn đi lại được.' },
    { id: 'timeFast', school: 'time', name: 'Tua nhanh', cost: 6, cd: 0, use: 'hold', self: true, desc: 'Giữ để thời gian trôi nhanh 8 lần, 16 lần.' },
    { id: 'timeBack', school: 'time', name: 'Tua lùi', cost: 10, cd: 0, use: 'hold', self: true, desc: 'Giữ để lùi từng ngày, xa nhất 30 ngày.' },
    { id: 'fireball', school: 'fire', name: 'Cầu lửa', cost: 20, cd: 1.5, use: 'tap', aim: true, desc: 'Ném quả cầu lửa; trúng nhà thì bén lửa.' },
    { id: 'fireRing', school: 'fire', name: 'Vòng lửa', cost: 35, cd: 8, use: 'tap', self: true, desc: 'Vòng lửa quanh mình, không ai đi qua được.' },
    { id: 'pillar', school: 'earth', name: 'Trụ đá', cost: 25, cd: 4, use: 'tap', self: true, desc: 'Trụ đá trồi lên ngay dưới chân, nâng mình lên cao.' },
    { id: 'quake', school: 'earth', name: 'Rung đất', cost: 40, cd: 10, use: 'tap', aim: true, desc: 'Sóng đất toả ra, người gần đó ngã ngồi.' },
    { id: 'rain', school: 'water', name: 'Gọi mưa', cost: 30, cd: 10, use: 'tap', aim: true, desc: 'Mây nhỏ kéo đến, mưa dập lửa, tưới ruộng.' },
    { id: 'geyser', school: 'water', name: 'Cột nước', cost: 25, cd: 3, use: 'tap', aim: true, desc: 'Cột nước phun lên, đẩy người ra xa, dập lửa.' },
    { id: 'deluge', school: 'water', name: 'Đại hồng thuỷ', cost: 100, cd: 120, use: 'tap', self: true, need: 'sea', desc: 'Chỉ khi ở gần biển: lốc xoáy nước, cả bể dâng cao rồi đổ ập, sóng tràn vào sáu đảo.' },
  ];
  const BY = new Map(SPELLS.map((s) => [s.id, s]));
  function state(W) {
    const soul = W.soul || (W.soul = {});
    return soul.magic || (soul.magic = { mana: MANA_MAX, cd: {} });
  }
  function regen(W, sec) {
    if (!(sec > 0)) return;
    const m = state(W);
    m.mana = Math.min(MANA_MAX, m.mana + REGEN * sec);
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
    if (m.mana < s.cost) return no('mana');
    return { ok: true };
  }
  function cast(W, id, ctx) {
    const r = can(W, id, ctx);
    if (!r.ok) return r;
    const s = BY.get(id),
      m = state(W);
    m.mana -= s.cost;
    if (s.cd > 0) m.cd[id] = s.cd;
    return { ok: true, cost: s.cost };
  }
  return { SCHOOLS, SPELLS, BY, MANA_MAX, REGEN, WHY, state, regen, can, cast };
});
