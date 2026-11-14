/* Bể Kính · game/spellbook.js · Điều khiển sách phép thuật (design/ke-hoach-buoc-37.md)
 * Chỉ khi đang nhập hồn (game/possess.js, pha 'in'). Luật (linh lực, hồi phép, điều kiện) ở logic/spells.js; hiệu ứng ở
 * render/magic/ (G.vfx, G.aim3d); âm thanh render/fx/magic-audio.js; giao diện ui/spellbook-ui.js gọi select(), cast().
 *   ngắm   tia từ tâm màn hình đi theo hướng máy quay, chạm mặt đất ở đâu thì ngắm ở đó; xa quá RANGE thì kéo về trong tầm
 *   phát   kiểm tra luật (BK.Spells.cast), giơ tay (f.castT: render/body/motion3d.js), rồi chạy phần tác động của phép đó
 *          (bảng CAST: mỗi phép một hàm nhỏ; hệ sau thêm vào bảng, không sửa phần chung)
 *   gậy    gậy phép trong tay phải (render/magic/staff3d.js): ngọc màu hệ phép đang chọn, niệm phép thì nghiêng về chỗ ngắm;
 *          vòng phù chú (G.vfx.sigil) hiện trước đầu gậy lúc niệm
 *   đạn    đạn phép bay theo đường cong từ đầu gậy tới chỗ ngắm, kéo đuôi hạt; tới nơi thì gọi onHit của nó
 * update(giây thật) mỗi khung hình (game/loop.js): hồi linh lực (cả lúc dừng thời gian), bay đạn, vòng ngắm.
 * Cần: logic/spells.js, render/magic/vfx.js, render/magic/aim3d.js, render/magic/staff3d.js, render/fx/magic-audio.js,
 * game/possess.js. */
(function (root) {
  const BK = root.BK || (root.BK = {});
  const RANGE = 22, // (đơn vị đảo) tầm ngắm xa nhất tính từ nhân vật
    BOLT_SPEED = 16; // (đơn vị mỗi giây) tốc độ đạn phép
  function setup(G) {
    const { THREE, camera } = G;
    const SP = BK.Spells,
      audio = BK.MagicAudio ? BK.MagicAudio.create(G) : null;
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
    const ctx = () => ({ inside: inside(), nearSea: false }); // (gần biển: tính ở bước hệ nước)
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

    /* ----- tác động của từng phép (hệ sau thêm vào đây: mỗi phép một hàm nhỏ, hay gọi sang tệp riêng của hệ đó) ----- */
    const CAST = {
      // phép thử: đốm sáng bay tới chỗ ngắm rồi bung ra (chưa tác động lên thế giới)
      soulBolt(aim) {
        hand(v1);
        G.vfx.sigil('soul', v1, v2.copy(aim).sub(v1).normalize(), { size: 0.75, life: 0.55 });
        G.vfx.play('soulCast', v1);
        if (audio) audio.cast(0.8);
        bolt({
          to: aim,
          trail: 'soulTrail',
          onHit: (p) => {
            G.vfx.play('soulBurst', p);
            G.vfx.sigil('soul', p, null, { size: 2.6, life: 0.9, spin: 1.2 });
            if (audio) audio.impact(0.5);
          },
        });
      },
    };

    // chọn phép (sách, thanh phép nhanh); phép chưa mở cũng chọn được để xem, bấm phát thì báo "sắp có"
    function select(id) {
      if (SP.BY.has(id)) st.sel = id;
    }
    // phát phép đang chọn; trả { ok, why, text }
    function cast() {
      const s = spell();
      if (!s) return { ok: false };
      if (s.aim && !st.aimOk) return deny({ ok: false, why: 'aim', text: 'Chưa ngắm được chỗ' });
      const r = SP.cast(W(), s.id, ctx());
      if (!r.ok) return deny(r);
      const f = folk();
      if (f) f.castT = 0.4; // (giơ tay niệm phép: render/body/motion3d.js)
      if (CAST[s.id]) CAST[s.id](st.aim.clone());
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
      if (G.world && G.world.soul) SP.regen(G.world, sec); // (giờ thật: cả lúc dừng thời gian)
      stepBolts(sec);
      const s = spell(),
        f = folk();
      // gậy phép: chỉ khi ở trong thân
      if (G.staff3d) {
        if (inside() && f) G.staff3d.update(f, s ? s.school : 'soul', st.aimOk ? v2.copy(st.aim).sub(f.rig.root.position) : null, (f.castT || 0) / 0.4);
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
    G.spellbook = {
      select,
      cast,
      update,
      st,
      audio,
      inside,
      mana: () => (G.world && G.world.soul ? SP.state(G.world).mana : 0),
      can: (id) => SP.can(W(), id, ctx()),
      cooldown: (id) => (G.world && G.world.soul ? SP.state(G.world).cd[id] || 0 : 0),
    };
  }
  BK.Spellbook = { setup, RANGE };
})(typeof self !== 'undefined' ? self : globalThis);
