// SamBox · src/ui/hud.js · Bảng điều khiển ảnh mô phỏng: chọn đảo (máy quay bay tới), chọn buổi, nút bật/tắt (tầm mắt, lưới xây),
// mức đồ hoạ, khung hình/giây
//   buildHud({ tier, tiers, islands, daytimes, toggles, onIsland, onDaytime, onToggle })  { tick(dt) }
//   toggles: [{ key, name }]; bật sẵn khi địa chỉ có ?key=1; onToggle(key, bật)
export function buildHud(o) {
  const $ = (id) => document.getElementById(id);
  const row = (el, items, onPick, initial) => {
    for (const it of items) {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = it.name;
      b.dataset.k = it.key;
      b.addEventListener('click', () => {
        el.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b));
        onPick(it.key);
      });
      if (it.key === initial) b.classList.add('on');
      el.appendChild(b);
    }
  };
  const p = new URLSearchParams(location.search);
  row($('islands'), o.islands, o.onIsland, p.get('dao') || 'all');
  row($('daytimes'), o.daytimes, o.onDaytime, p.get('buoi') || 'sunset');
  for (const t of o.toggles) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = t.name;
    b.classList.toggle('on', p.get(t.key) === '1');
    b.setAttribute('aria-pressed', String(b.classList.contains('on')));
    b.addEventListener('click', () => {
      const on = b.classList.toggle('on');
      b.setAttribute('aria-pressed', String(on));
      o.onToggle(t.key, on);
    });
    $('toggles').appendChild(b);
  }
  const q = $('quality');
  q.textContent = 'Đồ hoạ: ' + o.tier.name;
  q.addEventListener('click', () => {
    p.set('q', o.tier.key === 'high' ? 'low' : 'high');
    location.search = p.toString();
  });
  let acc = 0,
    n = 0;
  return {
    tick(dt) {
      acc += dt;
      n++;
      if (acc > 0.5) {
        $('fps').textContent = Math.round(n / acc) + ' khung/giây';
        acc = n = 0;
      }
    },
  };
}
