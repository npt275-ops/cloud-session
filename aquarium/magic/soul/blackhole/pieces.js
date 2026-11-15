/* Bể Kính · magic/soul/blackhole/pieces.js · Tách đảo thành từng vật thể cho Hố đen hút (design/ke-hoach-buoc-37.md "Hố đen")
 * Phần lớn đảo được gộp thành vài khối lưới lớn (nhiều cây, nhà, đường trong một khối). Lúc phát phép, mỗi khối lưới trên đảo
 * được tách ra thành từng vật thể, ghi vào thuộc tính bkPivot của từng đỉnh (tâm vật, -bán kính) cho warp3d.js:
 *   1. hàn các đỉnh trùng chỗ, gom tam giác dính nhau thành từng mảnh (một thân cây, một tán lá, một bức tường, một viên đá)
 *   2. mảnh nào chồng lên nhau thì gộp thành một vật (thân với tán thành một cây; tường, mái thành một nhà) nếu vật gộp không quá
 *      to (PART.MAX)
 *   3. vật còn quá to (cả dải đường, cả bờ tường dài) thì cắt theo ô PART.CELL: mỗi ô một mảng (mảng gạch đường)
 * Khối lặp (cỏ, hoa, sỏi vẽ bằng InstancedMesh): mỗi bản là một vật, tâm ở gốc của bản đó.
 * Không đụng: mặt đất, vách đảo, mặt dưới đảo, bờ, hồ (đất giữ nguyên); người (pull.js hút cả thân); thứ dưới mặt đảo (đáy bể);
 * shader tự viết (mặt biển, hạt, trời); vật ngoài đảo.
 * Khối lưới có chỉ mục được thay bằng bản không chỉ mục (mỗi tam giác đỉnh riêng) để cắt ô được; restore() trả lại như cũ.
 * create(G) trả { prepare(đảo) trả số vật, scan(đảo) tách thêm khối mới dựng, restore() }. Cần: three.js, warp3d.js. */
(function (root) {
  const BK = root.BK || (root.BK = {});
  const PART = {
    MAX: 7, // (đơn vị) vật gộp to hơn chừng này (đường chéo hộp bao) thì không gộp thêm
    CELL: 2.4, // (đơn vị) cỡ ô cắt vật quá to (mảng gạch đường)
    EPS: 0.03, // hai mảnh phải chồng vào nhau quá chừng này mới gộp (chỉ chạm cạnh như hai viên gạch thì không)
    WELD: 1e-3, // đỉnh cách nhau dưới chừng này coi là một
  };
  function create(G) {
    const { THREE } = G;
    const done = new Map(); // khối lưới → { geo (lưới gốc), culled }
    const box = new THREE.Box3(),
      v = new THREE.Vector3(),
      sc = new THREE.Vector3();
    // không phải đất, không phải người, không phải thứ dưới đảo
    function eligible(o, L) {
      if (!(o.isMesh || o.isInstancedMesh) || o.isSkinnedMesh || !o.geometry || !o.geometry.attributes.position) return false;
      const m = Array.isArray(o.material) ? o.material[0] : o.material;
      if (!m || m.isShaderMaterial || m.isRawShaderMaterial || (m.userData && m.userData.noVoid)) return false;
      if (o.userData.noDrape || o.userData.flatPart || o.userData.owner) return false; // (mặt đất, vách, hồ, bờ; người của làng)
      if (m === L.groundMat || m === L.underMat || (L.waterMats || []).includes(m)) return false;
      if (!o.geometry.boundingSphere) o.geometry.computeBoundingSphere();
      if (o.isInstancedMesh) return true; // (lọc từng bản ở dưới)
      v.copy(o.geometry.boundingSphere.center).applyMatrix4(o.matrixWorld);
      if (v.y < L.center.y - 4) return false; // (dưới mặt đảo: mặt dưới, đáy bể)
      const rad = o.geometry.boundingSphere.radius * o.matrixWorld.getMaxScaleOnAxis();
      return Math.hypot(v.x - L.center.x, v.z - L.center.z) < L.rOf(Math.atan2(v.z - L.center.z, v.x - L.center.x)) + 6 + rad;
    }
    // tách một lưới (không chỉ mục) thành vật: trả Float32Array bkPivot (tâm, -bán kính) theo từng đỉnh, toạ độ của lưới
    function split(g, scale) {
      const P = g.attributes.position.array,
        nV = P.length / 3,
        nT = Math.floor(nV / 3);
      // 1. hàn đỉnh, gom tam giác dính nhau (hợp nhất theo đỉnh đã hàn)
      const key = new Map(),
        par = new Int32Array(nT);
      for (let t = 0; t < nT; t++) par[t] = t;
      const find = (a) => {
        while (par[a] !== a) a = par[a] = par[par[a]];
        return a;
      };
      const q = 1 / PART.WELD;
      for (let i = 0; i < nV; i++) {
        const k = Math.round(P[i * 3] * q) + ',' + Math.round(P[i * 3 + 1] * q) + ',' + Math.round(P[i * 3 + 2] * q),
          t = (i / 3) | 0,
          o = key.get(k);
        if (o == null) key.set(k, t);
        else {
          const a = find(o),
            b = find(t);
          if (a !== b) par[a] = b;
        }
      }
      // hộp bao từng mảnh
      const bid = new Map(),
        bx = [];
      for (let t = 0; t < nT; t++) {
        const r = find(t);
        let j = bid.get(r);
        if (j == null) {
          j = bx.length;
          bid.set(r, j);
          bx.push([Infinity, Infinity, Infinity, -Infinity, -Infinity, -Infinity]);
        }
        const B = bx[j];
        for (let c = 0; c < 3; c++) {
          const i = (t * 3 + c) * 3;
          for (let a = 0; a < 3; a++) {
            if (P[i + a] < B[a]) B[a] = P[i + a];
            if (P[i + a] > B[a + 3]) B[a + 3] = P[i + a];
          }
        }
      }
      // 2. gộp mảnh chồng lên nhau (lưới ô để chỉ so mảnh gần nhau), vật gộp không quá PART.MAX
      const nB = bx.length,
        gp = new Int32Array(nB),
        gb = bx.map((b) => b.slice());
      for (let j = 0; j < nB; j++) gp[j] = j;
      const gfind = (a) => {
        while (gp[a] !== a) a = gp[a] = gp[gp[a]];
        return a;
      };
      const diag = (b) => Math.hypot(b[3] - b[0], b[4] - b[1], b[5] - b[2]);
      const grid = new Map(),
        GC = PART.MAX;
      for (let j = 0; j < nB; j++) {
        const b = bx[j];
        if (diag(b) > PART.MAX) continue;
        for (let x = Math.floor(b[0] / GC); x <= Math.floor(b[3] / GC); x++)
          for (let z = Math.floor(b[2] / GC); z <= Math.floor(b[5] / GC); z++) {
            const k = x + ',' + z,
              l = grid.get(k);
            if (l) l.push(j);
            else grid.set(k, [j]);
          }
      }
      const E = PART.EPS;
      for (const l of grid.values())
        for (let a = 0; a < l.length; a++)
          for (let c = a + 1; c < l.length; c++) {
            const A = bx[l[a]],
              B = bx[l[c]];
            if (A[0] + E >= B[3] - E || B[0] + E >= A[3] - E || A[1] + E >= B[4] - E || B[1] + E >= A[4] - E) continue;
            if (A[2] + E >= B[5] - E || B[2] + E >= A[5] - E) continue;
            const ra = gfind(l[a]),
              rb = gfind(l[c]);
            if (ra === rb) continue;
            const m = gb[ra].map((x, i) => (i < 3 ? Math.min(x, gb[rb][i]) : Math.max(x, gb[rb][i])));
            if (diag(m) > PART.MAX) continue;
            gp[ra] = rb;
            gb[rb] = m;
          }
      // 3. ghi tâm, bán kính cho từng đỉnh; vật quá to thì cắt theo ô (theo trọng tâm từng tam giác)
      const out = new Float32Array(nV * 4),
        cells = new Map();
      for (let t = 0; t < nT; t++) {
        const r = gfind(bid.get(find(t))),
          B = gb[r];
        let cx, cy, cz, rad;
        if (diag(B) <= PART.MAX) {
          cx = (B[0] + B[3]) / 2;
          cy = (B[1] + B[4]) / 2;
          cz = (B[2] + B[5]) / 2;
          rad = diag(B) / 2;
        } else {
          const i = t * 9,
            mx = (P[i] + P[i + 3] + P[i + 6]) / 3,
            mz = (P[i + 2] + P[i + 5] + P[i + 8]) / 3,
            k = r + ':' + Math.floor(mx / PART.CELL) + ',' + Math.floor(mz / PART.CELL);
          let c = cells.get(k);
          if (!c) cells.set(k, (c = { b: [Infinity, Infinity, Infinity, -Infinity, -Infinity, -Infinity], t: [] }));
          for (let a = 0; a < 9; a++) {
            const ax = a % 3;
            if (P[i + a] < c.b[ax]) c.b[ax] = P[i + a];
            if (P[i + a] > c.b[ax + 3]) c.b[ax + 3] = P[i + a];
          }
          c.t.push(t);
          continue;
        }
        for (let c = 0; c < 3; c++) out.set([cx, cy, cz, -Math.max(0.05, rad * scale)], (t * 3 + c) * 4);
      }
      for (const c of cells.values()) {
        const b = c.b,
          w = -Math.max(0.05, (diag(b) / 2) * scale);
        for (const t of c.t) for (let k = 0; k < 3; k++) out.set([(b[0] + b[3]) / 2, (b[1] + b[4]) / 2, (b[2] + b[5]) / 2, w], (t * 3 + k) * 4);
      }
      return out;
    }
    // tách mọi khối lưới hợp lệ chưa tách của đảo i; gọi lại được (scan): chỉ làm khối mới dựng, hay khối đã bị thay lưới
    // (công trình đổi bản vẽ xa, gần theo máy quay, dựng lại khi đổi thời) trong lúc hố còn
    function scan(i) {
      const L = G.lands[i];
      if (!L) return 0;
      const list = [];
      G.scene.updateMatrixWorld(true);
      // (cả khối đang ẩn: bản vẽ xa, gần của cùng một công trình đổi qua lại theo máy quay)
      G.scene.traverse((o) => {
        if (eligible(o, L) && !o.geometry.attributes.bkPivot) list.push(o);
      });
      let n = 0;
      for (const o of list) {
        const old = o.geometry;
        o.matrixWorld.decompose(v, new THREE.Quaternion(), sc);
        const s = Math.max(sc.x, sc.y, sc.z);
        let g;
        if (o.isInstancedMesh) {
          // khối lặp: mỗi bản một vật, tâm ở tâm hình mẫu (thuộc tính dùng chung cho mọi bản)
          g = old.clone();
          const bs = old.boundingSphere,
            nV = old.attributes.position.count,
            a = new Float32Array(nV * 4);
          for (let k = 0; k < nV; k++) a.set([bs.center.x, bs.center.y, bs.center.z, -Math.max(0.05, bs.radius * s)], k * 4);
          g.setAttribute('bkPivot', new THREE.BufferAttribute(a, 4));
          n += o.count;
        } else {
          g = old.index ? old.toNonIndexed() : old.clone();
          const a = split(g, s);
          g.setAttribute('bkPivot', new THREE.BufferAttribute(a, 4));
          const seen = new Set();
          for (let k = 0; k < a.length; k += 4) seen.add(a[k] + ',' + a[k + 1] + ',' + a[k + 2]);
          n += seen.size;
        }
        // (khối đã tách trước mà bị thay lưới: nhớ lưới mới làm lưới gốc)
        const d = done.get(o);
        if (d) d.geo = old;
        else done.set(o, { geo: old, culled: o.frustumCulled });
        o.geometry = g;
        o.frustumCulled = false; // (vật bay lên hố, ra khỏi chỗ cũ: đừng bị bỏ vì chỗ cũ ngoài khung hình)
      }
      return n;
    }
    function prepare(i) {
      restore();
      return scan(i);
    }
    function restore() {
      for (const [mesh, d] of done) {
        if (mesh.geometry !== d.geo && mesh.geometry.attributes.bkPivot) {
          mesh.geometry.dispose();
          mesh.geometry = d.geo;
        }
        mesh.frustumCulled = d.culled;
      }
      done.clear();
    }
    return { prepare, scan, restore, get meshes() {
      return done.size;
    } };
  }
  BK.BlackHolePieces = { create, PART };
})(typeof self !== 'undefined' ? self : globalThis);
