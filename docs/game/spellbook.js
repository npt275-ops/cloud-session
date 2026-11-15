/* Bể Kính · game/spellbook.js · Điều khiển sách phép thuật (design/ke-hoach-buoc-37.md)
 * Chỉ khi đang nhập hồn (game/possess.js, pha 'in'). Luật (linh lực, hồi phép, điều kiện) ở logic/spells.js; hiệu ứng ở
 * render/magic/ (G.vfx, G.aim3d); âm thanh render/fx/magic-audio.js; giao diện ui/spellbook-ui.js gọi select(), cast().
 *   ngắm   tia từ tâm màn hình đi theo hướng máy quay, chạm mặt đất ở đâu thì ngắm ở đó; xa quá RANGE thì kéo về trong tầm
 *   hệ     mỗi hệ phép một thư mục riêng (magic/<hệ>/: magic/README.md). Phần phát phép của hệ (magic/<hệ>/cast.js) tự đăng
 *          ký: BK.Spellbook.school(hệ, setup). setup(G, kit) chạy một lần khi dựng sách, trả { acts, update }:
 *            acts    { idPhép: { tap(chỗ ngắm) | toggle() + on() | hold(bật), hue } } theo cách dùng của phép (logic/spells.js
 *                    use); hue: cao độ tiếng vút lúc niệm (phép bật tắt, phép giữ: sách tự làm dáng niệm)
 *            update  (tuỳ chọn) update(giây thật) mỗi khung hình
 *          kit: đồ dùng chung cho các hệ (xem KIT bên dưới): đầu gậy, người đang nhập, chân, mặt đất, đạn phép, dáng niệm, tiếng
 *          Thêm hệ mới không sửa tệp này.
 *   phát   press() khi bấm (phím E, chuột trái), release() khi thả. 'tap': kiểm tra luật (BK.Spells.cast), giơ tay (f.castT:
 *          render/body/motion3d.js), gọi acts[id].tap; 'toggle' bấm bật, bấm lại tắt; 'hold' chạy suốt lúc giữ
 *   gậy    gậy phép trong tay phải (render/magic/staff3d.js): ngọc màu hệ phép đang chọn, niệm phép thì nghiêng về chỗ ngắm;
 *          vòng phù chú (G.vfx.sigil) hiện trước đầu gậy lúc niệm
 *   đạn    đạn phép bay theo đường cong từ đầu gậy tới chỗ ngắm, kéo đuôi hạt; tới nơi thì gọi onHit của nó
 * update(giây thật) mỗi khung hình (game/loop.js): hồi linh lực (cả lúc dừng thời gian), các hệ, bay đạn, vòng ngắm.
 * Cần: logic/spells.js, render/magic/vfx.js, render/magic/aim3d.js, render/magic/staff3d.js, render/fx/magic-audio.js,
 * game/possess.js; các hệ ở magic/<hệ>/ nạp sau tệp này (index.html). */
(function (root) {
  const BK = root.BK || (root.BK = {});
  const RANGE = 22, // (đơn vị đảo) tầm ngắm xa nhất tính từ nhân vật
    BOLT_SPEED = 16, // (đơn vị mỗi giây) tốc độ đạn phép
    NEAR_SEA = 8; // (đơn vị) cách mép đảo không quá chừng này thì là gần biển
  // phù chú của hệ hiện ở đầu gậy lúc giơ gậy niệm phép: bám theo đầu gậy, quay mặt về máy quay, xoay chậm; hiện rõ chừng một
  // giây rồi mờ dần (người chơi kịp nhìn rõ hình của hệ: render/magic/sigils.js)
  const TIP_SIGIL = { size: 0.85, life: 1.8, spin: 0.35 },
    TIP_UP = 0.12; // (đơn vị) phù chú cao hơn đầu gậy chừng này
  const SCHOOLS = []; // [hệ, setup] theo thứ tự nạp (school)
  function school(id, fn) {
    if (SCHOOLS.some((x) => x[0] === id)) throw new Error('hệ phép đăng ký hai lần: ' + id);
    SCHOOLS.push([id, fn]);
  }
  const CAST_DOWN = 0.3; // (giây) cuối thời gian giữ gậy: hạ gậy xuống trong chừng này (render/body/motion3d.js cùng số)
  function setup(G) {
    const { THREE, camera } = G;
    const SP = BK.Spells,
      audio = BK.MagicAudio ? BK.MagicAudio.create(G) : null;
    if (G.staff3d && audio) G.staff3d.onPlant = (k) => audio.thud(k); // (tiếng gỗ khi chống gậy xuống)
    const st = { sel: 'soulBolt', aim: new THREE.Vector3(), aimOk: false, last: null, bolts: [] };
    const v1 = new THREE.Vector3(),
      v2 = new THREE.Vector3(),
      dir = new THREE.Vector3();
    const W = () => G.world;
    const P = () => G.possess;
    const inside = () => !!(P() && P().st.phase === 'in');
    const folk = () => {
      const p = P();
      if (!p || p.st.i < 0) return null;
      const V = G.villageOf(p.st.i);
      return V ? V.folk(p.st.id) : null;
    };
    // gần biển: nhân vật đứng cách mép đảo (L.rOf) không quá NEAR_SEA (phép chỉ dùng được ở gần biển: logic/spells.js need)
    const nearSea = () => {
      const f = folk(),
        p = P();
      if (!f || !p || p.st.i < 0) return false;
      const L = G.lands[p.st.i];
      return Math.hypot(f.pos.x, f.pos.z) > L.rOf(Math.atan2(f.pos.z, f.pos.x)) - NEAR_SEA;
    };
    const ctx = () => ({ inside: inside(), nearSea: nearSea() });
    const spell = () => SP.BY.get(st.sel);
    // mặt đất dưới (x, z) (toạ độ thế giới) của đảo đang ở
    function ground(x, z) {
      const L = G.lands[P().st.i];
      return L.center.y + L.surfAt(x - L.center.x, z - L.center.z);
    }
    // chỗ ngắm: tia từ máy quay theo hướng nhìn, bước nhỏ tới khi xuống dưới mặt đất; xa quá tầm thì kéo về trong tầm
    function aimPoint(out) {
      const f = folk();
      if (!f) return false;
      camera.getWorldDirection(dir);
      const o = camera.position,
        me = f.rig.root.position;
      let hit = false;
      for (let s = 0.5; s < RANGE + 12; s += 0.25) {
        v1.copy(o).addScaledVector(dir, s);
        if (v1.y <= ground(v1.x, v1.z)) {
          hit = true;
          break;
        }
      }
      if (!hit) v1.copy(o).addScaledVector(dir, RANGE);
      // (trong tầm tính từ nhân vật, theo mặt phẳng ngang)
      v2.set(v1.x - me.x, 0, v1.z - me.z);
      const d = v2.length();
      if (d > RANGE) v1.set(me.x + (v2.x / d) * RANGE, 0, me.z + (v2.z / d) * RANGE);
      out.set(v1.x, ground(v1.x, v1.z), v1.z);
      return true;
    }
    // chỗ phép phát ra: đầu gậy (không có gậy: bàn tay phải)
    function hand(out) {
      if (G.staff3d && G.staff3d.visible) return G.staff3d.tip(out);
      const f = folk();
      if (f && f.rig.nodes.wrR) return out.setFromMatrixPosition(f.rig.nodes.wrR.matrixWorld);
      return out.copy(f ? f.rig.root.position : camera.position).add(v2.set(0, 1, 0));
    }

    /* ----- đạn phép: bay theo đường cong (cao lên giữa đường) ----- */
    function bolt(o) {
      const from = hand(new THREE.Vector3()),
        to = o.to.clone(),
        d = from.distanceTo(to);
      const b = { from, to, t: 0, dur: Math.max(0.15, d / (o.speed || BOLT_SPEED)), arc: o.arc == null ? 0.12 * d : o.arc, onHit: o.onHit, pos: from.clone() };
      b.em = o.trail ? G.vfx.emitter(o.trail, from) : null;
      st.bolts.push(b);
    }
    function stepBolts(sec) {
      for (let i = st.bolts.length - 1; i >= 0; i--) {
        const b = st.bolts[i];
        b.t += sec;
        const u = Math.min(1, b.t / b.dur);
        b.pos.lerpVectors(b.from, b.to, u);
        b.pos.y += Math.sin(Math.PI * u) * b.arc;
        if (b.em) b.em.pos.copy(b.pos);
        if (u >= 1) {
          if (b.em) b.em.stop();
          st.bolts.splice(i, 1);
          if (b.onHit) b.onHit(b.to);
        }
      }
    }

    // phù chú của hệ ở đầu gậy (TIP_SIGIL); update() giữ nó bám đầu gậy, quay về máy quay
    function tipSigil(school) {
      hand(v1);
      st.tip = G.vfx.sigil(school, v1, v2.copy(camera.position).sub(v1), TIP_SIGIL);
    }
    function stepTip() {
      const m = st.tip;
      if (!m || !m.visible) return (st.tip = null);
      hand(m.position);
      m.position.y += TIP_UP;
      m.lookAt(camera.position);
      m.rotateZ(m.userData.age * m.userData.spin);
    }
    // dáng niệm phép chung: giơ gậy, phù chú của hệ ở đầu gậy, bụi phép (công thức '<hệ>Cast' nếu hệ có), tiếng vút (hue: cao độ)
    function castLook(s, hue) {
      const f = folk();
      if (f) f.castT = SP.holdOf(s); // (giơ gậy rồi giữ yên chừng ấy giây: render/body/motion3d.js)
      tipSigil(s.school);
      hand(v1);
      if (BK.MagicRecipes[s.school + 'Cast']) G.vfx.play(s.school + 'Cast', v1);
      if (audio) audio.cast(hue == null ? 0.8 : hue);
    }
    // chân nhân vật (phép toả ra từ đây); chưa nhập hồn thì chỗ máy quay
    const feet = () => {
      const f = folk();
      return f ? f.rig.root.position : camera.position;
    };
    // đồ dùng chung cho các hệ (magic/<hệ>/cast.js)
    const KIT = {
      folk, // dữ liệu vẽ của người đang bị nhập (render/village3d.js folk), hay null
      feet,
      inside,
      hand, // hand(out): đầu gậy (chỗ phép phát ra)
      ground, // ground(x, z): độ cao mặt đất đảo đang ở
      bolt, // bolt({ to, trail, speed, arc, onHit }): đạn phép bay từ đầu gậy tới chỗ ngắm
      castLook, // castLook(phép, hue): dáng niệm chung: giơ gậy, phù chú, bụi phép, tiếng vút
      tipSigil, // tipSigil(hệ): phù chú của hệ hiện ở đầu gậy rồi mờ dần
      audio,
      say: (t) => G.spellbookUi && G.spellbookUi.say(t),
      island: () => (P() && P().st.i >= 0 ? P().st.i : -1),
      cam: () => (P() ? P().cam : null), // máy quay chính (game/possess-cam.js: hop nảy nhẹ, shake rung)
      ctx,
    };
    const ACT = {},
      TICK = [];
    // (dựng các hệ sau khi các hàm bên dưới đã có: xem cuối setup)
    function mountSchools() {
      for (const [id, fn] of SCHOOLS) {
        const r = fn(G, KIT) || {};
        for (const k in r.acts || {}) {
          if (!SP.BY.has(k) || SP.BY.get(k).school !== id) throw new Error('hệ ' + id + ' phát phép lạ: ' + k);
          ACT[k] = r.acts[k];
        }
        if (r.update) TICK.push(r.update);
      }
    }
    // bấm: phát phép theo cách dùng của nó; trả { ok, why, text }
    function press() {
      const s = spell();
      if (!s) return { ok: false };
      const a = ACT[s.id];
      if (s.open && a && (s.use === 'hold' || s.use === 'toggle')) {
        const wasOn = s.use === 'toggle' && a.on && a.on();
        const r = s.use === 'hold' ? a.hold(true) : a.toggle();
        if (!r || r.ok === false) return deny(typeof r === 'object' && r ? r : { ok: false, why: 'mana', text: SP.WHY.mana });
        if (s.use === 'hold') st.holding = s.id;
        if (!wasOn) castLook(s, a.hue);
        st.last = { ok: true, id: s.id, t: performance.now() };
        return { ok: true };
      }
      return cast();
    }
    // thả: dừng phép đang giữ
    function release() {
      if (st.holding && ACT[st.holding]) ACT[st.holding].hold(false);
      st.holding = null;
    }
    // chọn phép (sách, thanh phép nhanh); phép chưa mở cũng chọn được để xem, bấm phát thì báo "sắp có"
    function select(id) {
      if (!SP.BY.has(id)) return;
      release();
      st.sel = id;
    }
    // phát phép đang chọn; trả { ok, why, text }
    function cast() {
      const s = spell();
      if (!s) return { ok: false };
      if (s.aim && !st.aimOk) return deny({ ok: false, why: 'aim', text: 'Chưa ngắm được chỗ' });
      const r = SP.cast(W(), s.id, ctx());
      if (!r.ok) return deny(r);
      const f = folk();
      if (f) f.castT = SP.holdOf(s); // (giơ gậy niệm phép, giữ yên chừng ấy giây rồi hạ: render/body/motion3d.js)
      if (ACT[s.id] && ACT[s.id].tap) ACT[s.id].tap(st.aim.clone(), s);
      st.last = { ok: true, id: s.id, t: performance.now() };
      return r;
    }
    function deny(r) {
      if (audio) audio.deny();
      st.last = Object.assign({ t: performance.now() }, r);
      return r;
    }

    function update(sec) {
      if (!(sec > 0)) return;
      if (G.world && G.world.soul) SP.regen(G.world, sec, !!st.holding); // (giờ thật: cả lúc dừng thời gian; đang giữ phép thì không hồi)
      for (const fn of TICK) fn(sec);
      stepBolts(sec);
      stepTip();
      const s = spell(),
        f = folk();
      // gậy phép: chỉ khi ở trong thân
      if (G.staff3d) {
        if (inside() && f) G.staff3d.update(f, s ? s.school : 'soul', st.aimOk ? v2.copy(st.aim).sub(f.rig.root.position) : null, Math.min(1, (f.castT || 0) / CAST_DOWN));
        else G.staff3d.hide();
      }
      if (inside() && s && s.aim && G.aim3d) {
        st.aimOk = aimPoint(st.aim);
        G.aim3d.show(st.aim, s.school + '.mid', st.aimOk && SP.can(W(), s.id, ctx()).ok);
      } else if (G.aim3d) {
        st.aimOk = false;
        G.aim3d.hide();
      }
    }
    mountSchools();
    G.spellbook = {
      select,
      cast,
      press,
      release,
      update,
      st,
      audio,
      kit: KIT,
      inside,
      mana: () => (G.world && G.world.soul ? SP.state(G.world).mana : 0),
      can: (id) => SP.can(W(), id, ctx()),
      cooldown: (id) => (G.world && G.world.soul ? SP.state(G.world).cd[id] || 0 : 0),
    };
  }
  BK.Spellbook = { setup, school, RANGE };
})(typeof self !== 'undefined' ? self : globalThis);
