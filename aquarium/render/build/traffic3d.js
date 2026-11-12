/* Bể Kính · render/build/traffic3d.js · Xe chạy trên vòng đường và nhường người đi bộ
 * drive(đảo, thời, A, công trình, giây game, ít xe): xe trên mặt đường (A.path road) đi khắp mạng đường (vòng và đường toả, A.spokes),
 * tới ngã thì rẽ, đường cụt thì quay đầu, đi làn phải, dừng sau xe cùng chiều; chân con vật vung theo quãng đường; mỗi xe của lớp đường (render/build/vehicles.js fleet: A.loop, A.path) có quãng đường
 * đã đi của riêng nó; render/buildings3d.js gọi mỗi khung hình. setPeds(đảo, danh sách): vị trí người đang ở ngoài (toạ độ
 * đảo, game/village.js lấy từ render/village3d.js peds) để xe dừng nhường người đang ở trên lòng đường phía trước.
 * Cần: render/build/plains/town.js (ROAD_W). */
(function (root) {
  const BK = root.BK || (root.BK = {});
  const STEP = 0.05; // bước con (giây game)
  function create() {
    // xe chạy dọc vòng đường khép kín A.loop ([[x, z], ...] theo toạ độ của lớp đường): mỗi xe có quãng đường đã đi của riêng nó,
    // đầu xe quay theo hướng đoạn đường đang đi. Xe chạy dưới đất nhường người đi bộ: có người đang ở trên mặt đường ngay phía
    // trước (peds: toạ độ đảo, setPeds từ game/village.js) thì dừng chờ; toa bám theo đầu xe của nó; xe bay không phải dừng.
    let lastBlock = null; // người vừa chặn xe (cho stalled: biết vì sao xe đứng)
    const pedsOf = [], seen = new Map(); // seen: trạng thái chạy của từng lớp đường đang vẽ (cho stalled)
    function setPeds(i, list) { pedsOf[i] = list; }
    // xe trên mạng đường đứng yên quá sec giây game liền (kẹt ở ngã, kẹt sau người đứng trên lòng đường): cho tools/bug-hunt.js
    function stalled(sec) { const out = [], now = Date.now(); for (const [st, o] of seen) { if (now - o.at > 3000) { seen.delete(st); continue; } // (lớp đường không còn vẽ)
      for (const n in st.r || {}) if ((st.r[n].still || 0) > sec) out.push({ isle: o.isle, n, still: st.r[n].still, pos: st.r[n].pos, why: st.r[n].why }); } return out; }
    function blockedAhead(isle, lv, p, x, z, hx, hz) {
      const list = pedsOf[isle]; if (!list || !list.length) return false;
      const c = Math.cos(p.g.rotation.y), s = Math.sin(p.g.rotation.y), X = p.g.position.x + x * c + z * s, Z = p.g.position.z - x * s + z * c, HX = hx * c + hz * s, HZ = -hx * s + hz * c;
      // chỉ người đứng trong bề ngang của chính chiếc xe (nửa thân xe và một khoảng hở) trên làn nó đi: người trên vỉa hè, bên làn kia
      // không chặn xe (trước đây lấy nửa bề ngang cả con đường tính từ làn xe đã lệch sang phải, nên người trên vỉa hè cũng chặn)
      const lane = Math.min(0.95, ((BK.Plains3D.TOWN && BK.Plains3D.TOWN.ROAD_W[lv]) || 2.6) / 2 - 0.1);
      for (const q of list) { const dx = q.x - X, dz = q.z - Z, fwd = dx * HX + dz * HZ, lat = Math.abs(dx * HZ - dz * HX); if (fwd > 0.3 && fwd < 4.2 && lat < lane) { lastBlock = q; return true; } }
      return false;
    }
    // few: đảo đang suy tàn (logic/prosperity.js decline): đường vắng, chỉ một phần ba số xe còn chạy, số còn lại ẩn
    // stops: chỗ đỗ của đảo (render/buildings3d.js places().stops, toạ độ đảo): xe chạy chuyến có điểm đi, điểm đến (tripStep)
    function drive(isle, lv, A, p, ts, few, stops) {
      A.path.forEach(([n, , , , head], j) => { const sub = p.subs[n]; if (!sub) return; const k = head ? A.path.findIndex((x) => x[0] === head) : j; sub.visible = !few || k % 3 === 0; });
      if (!A.cum) { A.cum = [0]; for (let i = 0; i < A.loop.length; i++) { const a = A.loop[i], b = A.loop[(i + 1) % A.loop.length]; A.cum.push(A.cum[i] + Math.hypot(b[0] - a[0], b[1] - a[1])); } A.len = A.cum[A.cum.length - 1]; }
      const st = p.drive || (p.drive = { at: ts, d: {} }); seen.set(st, { isle, at: Date.now() }); const total = Math.min(0.5, Math.max(0, ts - st.at)); st.at = ts; // ts: giờ game (giây)
      const steps = Math.max(1, Math.ceil(total / STEP)), dt = total / steps; // bước con: ở 4× xe vẫn kịp thấy người và dừng
      const place = (sub, d, y) => {
        d %= A.len; if (d < 0) d += A.len;
        let i = 0; while (i < A.loop.length - 1 && A.cum[i + 1] < d) i++;
        const a = A.loop[i], b = A.loop[(i + 1) % A.loop.length], u = (d - A.cum[i]) / Math.max(1e-6, A.cum[i + 1] - A.cum[i]);
        const x = a[0] + (b[0] - a[0]) * u, z = a[1] + (b[1] - a[1]) * u, hx = b[0] - a[0], hz = b[1] - a[1];
        sub.position.set(x, y + (p.liftAt ? p.liftAt(x, z) : 0), z); sub.rotation.y = Math.atan2(hx, hz); return [x, z, hx / (Math.hypot(hx, hz) || 1), hz / (Math.hypot(hx, hz) || 1)];
      };
      // xe chạy khắp mạng đường (road): đi theo đồ thị đường, tới ngã thì chọn đường khác đường vừa đi, cụt thì quay đầu
      const G = A.spokes && A.spokes.length ? graphOf(A) : null;
      for (let k = 0; k < steps; k++) for (const [n, speed, off, y, head, flying, , road] of A.path) {
        const sub = p.subs[n]; if (!sub) continue;
        if (road && G) { const drv = A.path.find((x) => x[0] === n)[8]; if (stops && stops.length && drv) tripStep(isle, lv, A, G, p, st, n, speed, off, y, dt, stops, drv, ts); else roadStep(isle, lv, A, G, p, st, n, speed, off, y, dt); continue; }
        if (head) { const H = A.path.find((x) => x[0] === head); st.d[n] = (st.d[head] != null ? st.d[head] : 0) + (off - H[2]); place(sub, st.d[n], y); continue; } // toa: bám đầu xe
        if (st.d[n] == null) st.d[n] = ts * speed + off;
        const [x, z, hx, hz] = place(sub, st.d[n], y);
        // giữ khoảng cách với xe (hay toa cuối của đoàn) phía trước: xe trước dừng nhường người thì xe sau cũng dừng, không đâm vào nhau
        const tooClose = !flying && A.path.some(([m, , , , , fl]) => m !== n && !fl && st.d[m] != null && (((st.d[m] - st.d[n]) % A.len) + A.len) % A.len > 0.1 && (((st.d[m] - st.d[n]) % A.len) + A.len) % A.len < 3.6);
        if (flying || (!tooClose && !blockedAhead(isle, lv, p, x, z, hx, hz))) st.d[n] += speed * dt; // có người trên đường phía trước: dừng chờ
      }
      legs(A, p, st); // chân con vật bước theo quãng đường
    }
    // ---------- Mạng đường: đồ thị các điểm của vòng đường và đường toả, nối chỗ đường toả chạm vòng ----------
    function graphOf(A) {
      if (A.graph) return A.graph;
      const pts = [], adj = [], key = new Map();
      const node = (x, z) => { const kk = Math.round(x * 2) + ',' + Math.round(z * 2); if (key.has(kk)) return key.get(kk); pts.push([x, z]); adj.push([]); key.set(kk, pts.length - 1); return pts.length - 1; };
      const link = (a, b) => { if (a === b || adj[a].includes(b)) return; adj[a].push(b); adj[b].push(a); };
      const loopIdx = A.loop.map(([x, z]) => node(x, z)); loopIdx.forEach((a, i) => link(a, loopIdx[(i + 1) % loopIdx.length]));
      for (const sp of A.spokes) { const ids = sp.map(([x, z]) => node(x, z)); for (let i = 1; i < ids.length; i++) link(ids[i - 1], ids[i]);
        // đầu đường toả chạm vòng đường (hay chạm đường khác) mà không trùng điểm: nối tới điểm gần nhất
        for (const e of [ids[0], ids[ids.length - 1]]) { let best = -1, bd = 3.5 * 3.5; pts.forEach((q, j) => { if (ids.includes(j)) return; const d = (q[0] - pts[e][0]) ** 2 + (q[1] - pts[e][1]) ** 2; if (d < bd) { bd = d; best = j; } }); if (best >= 0) link(e, best); } }
      // chỗ hai đường toả (hay cung đường vòng ngoài) cắt nhau giữa chừng: nối hai điểm gần nhau của hai đường
      const lines = A.spokes.map((sp) => sp.map(([x, z]) => key.get(Math.round(x * 2) + ',' + Math.round(z * 2))));
      lines.forEach((ids, a) => lines.forEach((jds, b) => { if (b <= a) return; for (const i of ids) { let best = -1, bd = 2.2 * 2.2; for (const j of jds) { const d = (pts[i][0] - pts[j][0]) ** 2 + (pts[i][1] - pts[j][1]) ** 2; if (d < bd) { bd = d; best = j; } } if (best >= 0) link(i, best); } }));
      A.graph = { pts, adj, loopIdx }; return A.graph;
    }
    const LANE = 0.55; // đi bên phải đường
    function roadStep(isle, lv, A, G, p, st, n, speed, off, y, dt) {
      const R = st.r || (st.r = {}), sub = p.subs[n];
      let v = R[n];
      // (xe vừa thôi chạy chuyến, chỗ đỗ chưa có: bắt đầu lại trên vòng đường)
      if (!v || v.a == null) { const L0 = G.loopIdx.length, i0 = Math.floor((((off / Math.max(1e-6, A.len)) % 1) + 1) % 1 * L0); v = R[n] = { a: G.loopIdx[i0], b: G.loopIdx[(i0 + 1) % L0], t: 0, seed: n.length * 7 + n.charCodeAt(n.length - 1), d: 0 }; }
      const [ax, az] = G.pts[v.a], [bx, bz] = G.pts[v.b], len = Math.hypot(bx - ax, bz - az) || 1e-3, hx = (bx - ax) / len, hz = (bz - az) / len;
      const x = ax + hx * v.t + hz * LANE, z = az + hz * v.t - hx * LANE;
      // dừng: người trên lòng đường phía trước, hay xe khác ngay phía trước cùng chiều
      const ahead = Object.keys(R).some((m) => { if (m === n) return false; const o = R[m], q = o.pos;
          if (!q || !o.h || o.h[0] * hx + o.h[1] * hz < 0.3) return false; const dx = q[0] - x, dz = q[1] - z, f = dx * hx + dz * hz;
          return f > 0.3 && f < 3.2 && Math.abs(dx * hz - dz * hx) < 1.2; }); // (chỉ xe cùng chiều: xe ngược chiều đi làn bên kia)
      if (!ahead && !blockedAhead(isle, lv, p, x, z, hx, hz)) { v.t += speed * dt; v.d += speed * dt; v.still = 0; } else { v.still = (v.still || 0) + dt; v.why = ahead ? 'xe phía trước' : 'người ' + (lastBlock ? lastBlock.x.toFixed(1) + ',' + lastBlock.z.toFixed(1) + (lastBlock.who && lastBlock.who.doing ? ' ' + (lastBlock.who.doing.verb || lastBlock.who.doing.state) + '@' + (lastBlock.who.doing.place || '-') + (lastBlock.who.moving ? ' đang đi' : ' đứng') : '') : ''); }
      if (v.t >= len) { // tới điểm: chọn đường tiếp theo (không quay lại đường vừa đi, trừ đường cụt)
        const nx = G.adj[v.b].filter((c) => c !== v.a); v.seed = (v.seed * 1103515245 + 12345) & 0x7fffffff;
        const c = nx.length ? nx[v.seed % nx.length] : v.a; v.t -= len; v.a = v.b; v.b = c; }
      sub.position.set(x, y + (p.liftAt ? p.liftAt(x, z) : 0), z); sub.rotation.y = Math.atan2(hx, hz); v.pos = [x, z]; v.h = [hx, hz]; st.d[n] = v.d;
    }
    /* ---------- Chuyến xe: điểm đi, điểm đến, đỗ xe, người xuống xe vào nhà (design/ke-hoach-buoc-15.md) ----------
     * Mỗi xe chạy dưới đất có một nhà (chỗ đỗ ở nhà) và đi lại giữa nhà với các chỗ khác (chợ, nhà chính, kho, trường, nhà người
     * quen...). Một chuyến: theo đường ngắn nhất trên mạng đường (vòng trong, đường toả, cung đường vòng ngoài) tới điểm đường gần
     * chỗ đỗ nhất → rẽ khỏi đường, chạy chậm vào chỗ đỗ cạnh cửa → đỗ: người lái xuống xe, đi bộ vào cửa (khuất vào trong) → ở trong
     * một lúc → đi ra, lên xe → lùi ra đường, đi chuyến tiếp. Ngựa buộc cạnh nhà, xe để ngoài cửa. */
    const DWELL = [8, 22]; // ở trong nhà bao lâu (giây game)
    const toL = (p, x, z) => { const c = Math.cos(p.g.rotation.y), s = Math.sin(p.g.rotation.y), dx = x - p.g.position.x, dz = z - p.g.position.z; return [dx * c - dz * s, dx * s + dz * c]; };
    const toW = (p, x, z) => { const c = Math.cos(p.g.rotation.y), s = Math.sin(p.g.rotation.y); return [p.g.position.x + x * c + z * s, p.g.position.z - x * s + z * c]; };
    function nearNode(G, x, z) { let b = 0, bd = 1e18; G.pts.forEach(([px, pz], i) => { const d = (px - x) ** 2 + (pz - z) ** 2; if (d < bd) { bd = d; b = i; } }); return b; }
    function pathOn(G, a, b) {
      const n = G.pts.length, dist = new Float64Array(n).fill(1e18), prev = new Int32Array(n).fill(-1), done = new Uint8Array(n); dist[a] = 0;
      for (let it = 0; it < n; it++) { let u = -1, ud = 1e18; for (let i = 0; i < n; i++) if (!done[i] && dist[i] < ud) { ud = dist[i]; u = i; } if (u < 0 || u === b) break; done[u] = 1;
        for (const v of G.adj[u]) { const w = Math.hypot(G.pts[u][0] - G.pts[v][0], G.pts[u][1] - G.pts[v][1]); if (dist[u] + w < dist[v]) { dist[v] = dist[u] + w; prev[v] = u; } } }
      if (prev[b] < 0 && a !== b) return null; const out = []; for (let v = b; v >= 0; v = prev[v]) out.push(v); return out.reverse();
    }
    const rnd = (v) => { v.seed = (v.seed * 1103515245 + 12345) & 0x7fffffff; return v.seed / 0x7fffffff; };
    function tripStep(isle, lv, A, G, p, st, n, speed, off, y, dt, stops, drv, ts) {
      const R = st.r || (st.r = {}), sub = p.subs[n], dsub = p.subs[drv.name]; let v = R[n];
      if (!v || v.stopsN !== stops.length) { // (chỗ đỗ đổi: sang thời, công trình mới) xe bắt đầu lại từ chỗ đang đứng hay từ nhà
        const idx = A.path.findIndex((x) => x[0] === n), home = (idx * 5 + isle * 3) % stops.length, at = v && v.pos ? v.pos : null;
        v = R[n] = { mode: 'park', home, stopI: home, wait: 1 + idx * 3, seed: n.length * 7 + idx * 131 + isle, d: v ? v.d : 0, stopsN: stops.length };
        const S = stops[home], [lx, lz] = toL(p, S.park[0], S.park[1]); v.pos = at || [lx, lz]; v.h = [0, 1]; v.parkedAt = [lx, lz]; v.out = 0; }
      const S = stops[v.stopI], [px, pz] = toL(p, S.park[0], S.park[1]), [dx, dz] = toL(p, S.door[0], S.door[1]);
      let x = v.pos[0], z = v.pos[1], hx = v.h[0], hz = v.h[1], moved = 0;
      const go = (tx, tz, sp) => { const ex = tx - x, ez = tz - z, d = Math.hypot(ex, ez); if (d < 1e-3) return true; const k = Math.min(d, sp * dt); x += (ex / d) * k; z += (ez / d) * k; hx = ex / d; hz = ez / d; moved = k; return k >= d - 1e-4; };
      if (v.mode === 'park') { // đỗ: người lái xuống, đi vào cửa, ở trong, đi ra, lên xe
        v.wait -= dt; v.still = 0;
        if (v.out === 0 && v.wait < 0) { v.out = 1; v.wk = 0; } // xuống xe
        if (v.out === 1) { v.wk += dt / 2.2; if (v.wk >= 1) { v.out = 2; v.wait = DWELL[0] + rnd(v) * (DWELL[1] - DWELL[0]); } } // đi vào cửa
        else if (v.out === 2 && v.wait < 0) { v.out = 3; v.wk = 1; } // ra khỏi nhà
        else if (v.out === 3) { v.wk -= dt / 2.2; if (v.wk <= 0) { v.out = 0; v.mode = 'leave'; // lên xe: chuyến kế tiếp (về nhà, hay đi chỗ khác)
          let nx = v.stopI === v.home ? Math.floor(rnd(v) * stops.length) : v.home; if (nx === v.stopI) nx = (nx + 1) % stops.length; v.next = nx; v.road = nearNode(G, ...toL(p, ...stops[v.stopI].park)); } }
      } else if (v.mode === 'leave') { const [rx, rz] = G.pts[v.road]; if (go(rx, rz, speed * 0.45)) { const S2 = stops[v.next], dst = nearNode(G, ...toL(p, ...S2.park)); v.route = pathOn(G, v.road, dst) || [v.road, dst]; v.ri = 0; v.stopI = v.next; v.mode = 'route'; } }
      else if (v.mode === 'route') { // theo đường, đi làn phải; dừng khi có người hay xe phía trước
        const a = v.route[v.ri], b = v.route[Math.min(v.route.length - 1, v.ri + 1)];
        if (a === b || v.ri >= v.route.length - 1) v.mode = 'enter';
        else { const [ax, az] = G.pts[a], [bx, bz] = G.pts[b], len = Math.hypot(bx - ax, bz - az) || 1e-3, ux = (bx - ax) / len, uz = (bz - az) / len;
          if (v.t == null || v.seg !== v.ri) { v.t = Math.max(0, Math.min(len, (x - ax) * ux + (z - az) * uz)); v.seg = v.ri; }
          const cx = ax + ux * v.t + uz * LANE, cz = az + uz * v.t - ux * LANE;
          const ahead = Object.keys(R).some((m) => { if (m === n) return false; const o = R[m], q = o.pos; if (!q || o.mode === 'park' || !o.h || o.h[0] * ux + o.h[1] * uz < 0.3) return false; const ex = q[0] - cx, ez = q[1] - cz, f = ex * ux + ez * uz; return f > 0.3 && f < 3.2 && Math.abs(ex * uz - ez * ux) < 1.2; });
          if (!ahead && !blockedAhead(isle, lv, p, cx, cz, ux, uz)) { v.t += speed * dt; moved = speed * dt; v.still = 0; } else { v.still = (v.still || 0) + dt; v.why = ahead ? 'xe phía trước' : 'người phía trước'; }
          x = cx; z = cz; hx = ux; hz = uz; if (v.t >= len) { v.ri++; v.t = 0; } }
      } else if (v.mode === 'enter') { if (go(px, pz, speed * 0.4)) { v.mode = 'park'; v.wait = 0.6; v.out = 0; } } // rẽ vào chỗ đỗ cạnh cửa, chạy chậm
      v.pos = [x, z]; v.h = [hx, hz]; v.d += moved; st.d[n] = v.d;
      // xe đỗ: đầu xe quay song song mặt nhà (theo hướng từ cửa ra chỗ đỗ, xoay một góc vuông)
      let yaw = Math.atan2(hx, hz); if (v.mode === 'park') { const ax2 = px - dx, az2 = pz - dz; if (Math.hypot(ax2, az2) > 0.1) yaw = Math.atan2(-az2, ax2); }
      sub.position.set(x, y + (p.liftAt ? p.liftAt(x, z) : 0), z); sub.rotation.y = yaw;
      // người lái: ngồi trên xe (ô tô, xe buýt, rô-bốt: ở trong, không thấy) hay đi bộ giữa xe và cửa
      if (dsub) { const c = Math.cos(yaw), s2 = Math.sin(yaw), [sx, sy, sz] = drv.seat;
        if (v.mode === 'park' && v.out) { const u = Math.max(0, Math.min(1, v.wk)), bx0 = x + c * 0.9, bz0 = z - s2 * 0.9, wx = bx0 + (dx - bx0) * u, wz = bz0 + (dz - bz0) * u;
          dsub.visible = sub.visible && v.out !== 2; dsub.position.set(wx, (p.liftAt ? p.liftAt(wx, wz) : 0) + Math.abs(Math.sin(u * 14)) * 0.05, wz); dsub.rotation.y = Math.atan2((dx - bx0) * (v.out === 3 ? -1 : 1), (dz - bz0) * (v.out === 3 ? -1 : 1)); }
        else { dsub.visible = sub.visible && drv.show; dsub.position.set(x + sx * c + sz * s2, y + sy + (p.liftAt ? p.liftAt(x, z) : 0), z - sx * s2 + sz * c); dsub.rotation.y = yaw; } }
    }
    // chân con vật (vehicles.js leg): đặt theo xe, vung theo quãng đường đã đi; thân nhún nhẹ
    function legs(A, p, st) {
      for (const [n, , , y, , , L] of A.path) {
        if (!L || !L.length) continue; const sub = p.subs[n]; if (!sub) continue;
        const d = st.d[n] || 0, c = Math.cos(sub.rotation.y), s = Math.sin(sub.rotation.y), stride = d * 2.6;
        const gy = p.liftAt ? p.liftAt(sub.position.x, sub.position.z) : 0; // đảo nhấp nhô
        sub.position.y = y + gy + Math.abs(Math.sin(stride)) * 0.04;
        for (const [ln, lx, ly, lz, ph] of L) { const q = p.subs[ln]; if (!q) continue; q.visible = sub.visible; q.rotation.order = 'YXZ';
          q.position.set(sub.position.x + lx * c + lz * s, ly + gy, sub.position.z - lx * s + lz * c); q.rotation.set(Math.sin(stride + ph) * 0.3, sub.rotation.y, 0); }
      }
    }
    return { drive, setPeds, stalled };
  }
  BK.Traffic3D = { create };
})(typeof self !== 'undefined' ? self : globalThis);
