// ✍️ Tập viết — hàm thuần (SPEC-write.md mục 5, 6.2): rải điểm nét mẫu, chuẩn bị nét bé viết, so khớp theo thứ tự
// (DTW) với nét mẫu xuôi / ngược để biết hướng, chấm một nét → { ok, reason }, kết quả lượt, sao của chữ.
// Đơn vị: "đơn vị chữ" (chiều cao dòng trên → dòng chân = 100).

/** Ngưỡng chấm (mục 5.4) — điểm xuất phát, chỉnh lại từ nét bé viết thật (Ghi nét thử, mục 12.3). */
export const WRITE_LEVELS = {
  easy: { startR: 20, nearR: 15, farR: 22, cover: 0.6, stay: 0.6, dotR: 18 },
  medium: { startR: 15, nearR: 12, farR: 16, cover: 0.7, stay: 0.7, dotR: 14 },
  hard: { startR: 12, nearR: 10, farR: 12, cover: 0.8, stay: 0.8, dotR: 11 },
};
export const LEVEL_VI = { easy: 'Dễ', medium: 'Vừa', hard: 'Khó' };

export const STEP = 2; // khoảng cách điểm sau khi rải lại
export const TAP_MAX = 6; // tổng quãng đường < 6 → chạm
const TAIL_T = 0.85; // đoạn cuối nét mẫu phải được phủ

export const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

/** Điểm của một đoạn tại u ∈ [0, 1]. */
function segAt(seg, u) {
  const [kind, ...v] = seg;
  if (kind === 'line') return { x: v[0] + (v[2] - v[0]) * u, y: v[1] + (v[3] - v[1]) * u };
  if (kind === 'arc') {
    const [cx, cy, rx, ry, from, to] = v;
    const a = ((from + (to - from) * u) * Math.PI) / 180;
    return { x: cx + rx * Math.cos(a), y: cy + ry * Math.sin(a) };
  }
  if (kind === 'bez') {
    const [x1, y1, c1x, c1y, c2x, c2y, x2, y2] = v;
    const s = 1 - u;
    return {
      x: s * s * s * x1 + 3 * s * s * u * c1x + 3 * s * u * u * c2x + u * u * u * x2,
      y: s * s * s * y1 + 3 * s * s * u * c1y + 3 * s * u * u * c2y + u * u * u * y2,
    };
  }
  if (kind === 'dot') return { x: v[0], y: v[1] };
  throw new Error(`Đoạn lạ: ${kind}`);
}

/** Điểm đầu / cuối của một đoạn (test liền mạch). */
export const segEnds = (seg) => [segAt(seg, 0), segAt(seg, 1)];

export const isDotStroke = (stroke) => stroke.length === 1 && stroke[0][0] === 'dot';

/** Đường gấp khúc dày của một nét (mỗi đoạn 120 bước). */
function denseStroke(stroke) {
  const out = [];
  for (const seg of stroke) {
    for (let i = out.length ? 1 : 0; i <= 120; i++) out.push(segAt(seg, i / 120));
  }
  return out;
}

export function pathLength(points) {
  let s = 0;
  for (let i = 1; i < points.length; i++) s += dist(points[i - 1], points[i]);
  return s;
}

/** Rải lại điểm cách đều `step` dọc đường gấp khúc (giữ điểm đầu và điểm cuối), kèm t = quãng đường / tổng. */
export function resample(points, step = STEP) {
  const total = pathLength(points);
  if (!points.length) return [];
  if (total === 0) return [{ x: points[0].x, y: points[0].y, t: 0 }];
  const out = [{ x: points[0].x, y: points[0].y, t: 0 }];
  let need = step; // quãng đường tới điểm kế tiếp
  let walked = 0;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    const d = dist(a, b);
    let used = 0;
    while (d - used >= need) {
      used += need;
      walked += need;
      const u = used / d;
      out.push({ x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u, t: walked / total });
      need = step;
    }
    need -= d - used;
    walked += d - used;
  }
  const last = points.at(-1);
  if (dist(out.at(-1), last) > 0.25) out.push({ x: last.x, y: last.y, t: 1 });
  else out.at(-1).t = 1;
  return out;
}

/** Nét mẫu → điểm cách đều `step` kèm t (mục 6.2); nét chấm → một điểm. */
export function sampleStroke(stroke, step = STEP) {
  if (isDotStroke(stroke)) {
    const p = segAt(stroke[0], 0);
    return { dot: true, points: [{ ...p, t: 0 }], length: 0 };
  }
  const dense = denseStroke(stroke);
  return { dot: false, points: resample(dense, step), length: pathLength(dense) };
}

/** Điểm đầu, điểm cuối và góc hướng đi ở đầu nét (độ, cho mũi tên). */
export function strokeEnds(stroke) {
  const { points, dot } = sampleStroke(stroke, 1);
  const start = points[0];
  const end = points.at(-1);
  const ahead = points[Math.min(points.length - 1, 6)];
  const angle = dot ? 90 : (Math.atan2(ahead.y - start.y, ahead.x - start.x) * 180) / Math.PI;
  return { start: { x: start.x, y: start.y }, end: { x: end.x, y: end.y }, angle };
}

/**
 * Nét bé viết (mục 5.1): bỏ điểm trùng, phân loại chạm / nét kéo, rải lại 2 đơn vị, làm mượt 3 điểm.
 * @param {{x:number,y:number}[]} raw điểm theo đơn vị chữ
 */
export function prepareInput(raw) {
  const pts = raw.filter((p, i) => i === 0 || p.x !== raw[i - 1].x || p.y !== raw[i - 1].y);
  const length = pathLength(pts);
  if (!pts.length) return { tap: true, raw: [], points: [], length: 0 };
  if (length < TAP_MAX) return { tap: true, raw: pts, points: [pts[0]], length };
  const even = resample(pts, STEP);
  const points = even.map((p, i) => {
    if (i === 0 || i === even.length - 1) return p;
    const a = even[i - 1];
    const b = even[i + 1];
    return { x: (a.x + p.x + b.x) / 3, y: (a.y + p.y + b.y) / 3, t: p.t };
  });
  return { tap: false, raw: pts, points, length };
}

/** DTW (mục 5.3): ghép điểm hai dãy, cả hai chỉ đi tiến, tổng khoảng cách nhỏ nhất → độ lệch trung bình mỗi cặp. */
export function dtw(a, b) {
  const n = a.length;
  const m = b.length;
  let prevCost = new Float64Array(m).fill(Infinity);
  let prevCount = new Uint32Array(m);
  for (let i = 0; i < n; i++) {
    const cost = new Float64Array(m);
    const count = new Uint32Array(m);
    for (let j = 0; j < m; j++) {
      const d = dist(a[i], b[j]);
      if (i === 0 && j === 0) {
        cost[j] = d;
        count[j] = 1;
        continue;
      }
      // Ba đường tới (i, j): (i-1, j), (i, j-1), (i-1, j-1).
      let best = Infinity;
      let bestCount = 0;
      if (i > 0 && prevCost[j] < best) { best = prevCost[j]; bestCount = prevCount[j]; }
      if (j > 0 && cost[j - 1] < best) { best = cost[j - 1]; bestCount = count[j - 1]; }
      if (i > 0 && j > 0 && prevCost[j - 1] <= best) { best = prevCost[j - 1]; bestCount = prevCount[j - 1]; }
      cost[j] = best + d;
      count[j] = bestCount + 1;
    }
    prevCost = cost;
    prevCount = count;
  }
  return prevCost[m - 1] / prevCount[m - 1];
}

const nearest = (p, list) => list.reduce((best, q) => Math.min(best, dist(p, q)), Infinity);

/**
 * Điểm `p` rơi vào đâu trên nét mẫu: d = khoảng cách gần nhất, t = tiến độ lớn nhất trong các điểm mẫu gần như gần
 * nhất (nét khép kín / đi lại đường cũ có nhiều điểm trùng chỗ — lấy t lớn nhất).
 */
function endOnTemplate(p, T) {
  const d = nearest(p, T);
  const t = T.filter((q) => dist(p, q) <= d + 3).reduce((best, q) => Math.max(best, q.t), 0);
  return { d, t };
}

/**
 * Chấm một nét (mục 5.2–5.3).
 * @param {ReturnType<typeof prepareInput>} input nét bé
 * @param {ReturnType<typeof sampleStroke>} tpl nét mẫu cần viết
 * @param {typeof WRITE_LEVELS.easy} cfg ngưỡng
 * @param {{ guided?: boolean }} opts "tô có dẫn" (5.5): chỉ xét bắt đầu + hướng, startR × 1,5
 * @returns {{ ok: boolean, reason?: 'start'|'reverse'|'stray'|'dot', lifted?: boolean, ignored?: boolean }}
 */
export function judgeStroke(input, tpl, cfg, { guided = false } = {}) {
  if (tpl.dot) {
    const d = tpl.points[0];
    const inside = input.raw.length > 0 && input.raw.every((p) => dist(p, d) <= cfg.dotR);
    if (!input.tap && !inside) return { ok: false, reason: 'dot' };
    return dist(input.raw[0], d) <= cfg.dotR ? { ok: true } : { ok: false, reason: 'start' };
  }
  if (input.tap) return { ok: false, ignored: true };
  const a = input.points;
  const T = tpl.points;
  const s0 = a[0];
  const dStart = dist(s0, T[0]);
  const dEnd = dist(s0, T.at(-1));
  const dFwd = dtw(a, T);
  const dRev = dtw(a, [...T].reverse());
  const startOk = dStart <= cfg.startR * (guided ? 1.5 : 1);
  const dirOk = dFwd <= dRev || dFwd <= cfg.nearR;
  // Đi ngược cả nét: khớp mẫu ngược tốt hơn, bắt đầu gần cuối mẫu và kết thúc gần đầu mẫu.
  if (dRev < dFwd && dEnd < dStart && dist(a.at(-1), T[0]) <= cfg.farR) return { ok: false, reason: 'reverse' };
  if (!startOk) return { ok: false, reason: 'start' };
  if (!dirOk) return { ok: false, reason: 'reverse' };
  if (guided) return { ok: true };
  const covered = T.map((p) => nearest(p, a) <= cfg.nearR);
  const coverOk = covered.filter(Boolean).length >= cfg.cover * T.length && T.some((p, i) => p.t >= TAIL_T && covered[i]);
  const stayOk = a.filter((p) => nearest(p, T) <= cfg.farR).length >= cfg.stay * a.length;
  // Đi hết đường còn gồm: điểm cuối nét bé rơi vào đoạn cuối nét mẫu (nét ngắn như gạch ngang t: nửa nét vẫn phủ
  // đủ trong bán kính nearR) và gần điểm cuối mẫu (nét gộp hai nét của t dừng ở xa → stray).
  const end = endOnTemplate(a.at(-1), T);
  const endOk = end.t >= TAIL_T && dist(a.at(-1), T.at(-1)) <= cfg.farR;
  if (!coverOk || !stayOk || !endOk) {
    // Lỡ nhấc tay (5.3): nét đi đúng đường nhưng dừng giữa chừng — điểm cuối nằm ngay trên nét mẫu.
    return { ok: false, reason: 'stray', lifted: stayOk && end.t < TAIL_T && end.d <= cfg.nearR * 0.8 };
  }
  return { ok: true };
}

/** Kết quả một lượt (mục 5.6) từ trạng thái từng nét { wrong }: sai ≥ 2 lần một nét = đã cần tô có dẫn. */
export function turnResult(strokes) {
  if (strokes.every((s) => !s.wrong)) return 'independent';
  if (strokes.some((s) => s.wrong >= 2)) return 'missed';
  return 'helped';
}

/** Sao của chữ khi xong đủ 3 lượt (mục 5.7); lượt cuối = lượt C. */
export function letterStars(results) {
  if (results.length < 3) return null;
  if (results.every((r) => r === 'independent')) return 3;
  const passed = results.filter((r) => r === 'independent' || r === 'helped').length;
  if (passed >= 2 && results.at(-1) !== 'missed') return 2;
  return 1;
}

/** Cộng một lượt vào bản ghi chữ "write/letter/<chữ>" (mục 9.1): streak = số lượt independent liên tiếp. */
export function applyLetterTurn(p, result, reasons = {}, now = Date.now()) {
  const merged = { start: 0, reverse: 0, stray: 0, dot: 0, ...(p.reasons ?? {}) };
  for (const [k, v] of Object.entries(reasons)) merged[k] = (merged[k] ?? 0) + v;
  return {
    ...p,
    seen: p.seen + 1,
    [result]: (p[result] ?? 0) + 1,
    streak: result === 'independent' ? p.streak + 1 : 0,
    reasons: merged,
    lastAt: now,
  };
}

/** Đường SVG của một dãy điểm. */
export const pathD = (points) => points.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
