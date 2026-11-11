// Nét giả lập cho Tập viết (SPEC-write 12.2), theo đơn vị chữ — dùng chung cho unit test và Playwright.
import { sampleStroke } from '../app/js/write/stroke.js';

/**
 * @param {Array} stroke nét mẫu
 * @param {{ reverse?: boolean, offset?: [number, number], normal?: number, startShift?: number, jitter?: number, pauseAt?: number, cut?: number, step?: number }} o
 *   normal: lệch đều N đơn vị vuông góc với nét ·
 *   startShift: thêm một đoạn dài N đơn vị trước điểm đầu (bắt đầu lệch, phần còn lại đúng) ·
 *   jitter: rê qua lại ±N đơn vị ở giữa nét · pauseAt: dừng tay (lặp một điểm 50 lần) ở tỉ lệ này · cut: chỉ giữ phần đầu.
 */
export function fakeStroke(stroke, { reverse = false, offset = null, normal = 0, startShift = 0, jitter = 0, pauseAt = null, cut = null, step = 1.5 } = {}) {
  let pts = sampleStroke(stroke, step).points.map(({ x, y }) => ({ x, y }));
  if (reverse) pts.reverse();
  if (cut != null) pts = pts.slice(0, Math.max(2, Math.round(pts.length * cut)));
  if (pauseAt != null) {
    const i = Math.round((pts.length - 1) * pauseAt);
    pts.splice(i, 0, ...Array.from({ length: 50 }, () => ({ ...pts[i] })));
  }
  if (jitter) {
    const i = Math.round((pts.length - 1) / 2);
    const p = pts[i];
    const q = pts[Math.min(pts.length - 1, i + 1)];
    const len = Math.hypot(q.x - p.x, q.y - p.y) || 1;
    const ux = (q.x - p.x) / len;
    const uy = (q.y - p.y) / len;
    const wiggle = [];
    for (let k = 0; k < 4; k++) wiggle.push({ x: p.x + ux * jitter, y: p.y + uy * jitter }, { x: p.x - ux * jitter, y: p.y - uy * jitter });
    pts.splice(i + 1, 0, ...wiggle, { ...p });
  }
  if (startShift) {
    const p = pts[0];
    const q = pts[Math.min(pts.length - 1, 3)];
    // Lệch vuông góc với hướng đi.
    const len = Math.hypot(q.x - p.x, q.y - p.y) || 1;
    const from = { x: p.x - ((q.y - p.y) / len) * startShift, y: p.y + ((q.x - p.x) / len) * startShift };
    const lead = Array.from({ length: 15 }, (_, k) => ({ x: from.x + (p.x - from.x) * (k / 15), y: from.y + (p.y - from.y) * (k / 15) }));
    pts = [...lead, ...pts];
  }
  if (normal) {
    const base = pts;
    pts = base.map((p, i) => {
      const a = base[Math.max(0, i - 1)];
      const b = base[Math.min(base.length - 1, i + 1)];
      const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
      return { x: p.x - ((b.y - a.y) / len) * normal, y: p.y + ((b.x - a.x) / len) * normal };
    });
  }
  if (offset) pts = pts.map((p) => ({ x: p.x + offset[0], y: p.y + offset[1] }));
  return pts;
}
