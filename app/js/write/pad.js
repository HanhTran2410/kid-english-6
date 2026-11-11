// ✍️ Tập viết — khung viết (SPEC-write.md mục 3, 10): một <svg> theo đơn vị chữ chứa dòng kẻ, chữ mẫu, nét bé, chấm
// xanh + mũi tên. Nét bé lưu bằng đơn vị chữ trong cùng SVG nên đổi cỡ không lệch (T01). Một con trỏ mỗi lúc (WR-07),
// ưu tiên bút (10.2), pointercancel / đổi cỡ giữa nét → hủy nét dở (T02, T03, WR-18).

import { LETTERS } from './letters.js';
import { sampleStroke, strokeEnds, pathD, isDotStroke } from './stroke.js';
import { scaled } from '../timing.js';

const NS = 'http://www.w3.org/2000/svg';
const s = (tag, attrs = {}) => {
  const el = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) if (v != null) el.setAttribute(k, String(v));
  return el;
};

export const reducedMotion = () => globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

/** Khung nhìn của một chữ: rộng ≥ 0,9 × chiều cao chữ (3.1), chữ căn giữa; dòng trên -14 → dưới dòng dưới. */
export function letterBox(letter) {
  const { width } = LETTERS[letter];
  const w = Math.max(width + 70, 130);
  return { x: (width - w) / 2, y: -14, w, h: 178 };
}

/** Đường SVG của nét mẫu thứ i (chấm → vòng tròn). */
function modelEl(stroke, className) {
  if (isDotStroke(stroke)) {
    const [, x, y] = stroke[0];
    return s('circle', { cx: x, cy: y, r: 5, class: className });
  }
  return s('path', { d: pathD(sampleStroke(stroke, 1).points), class: className, pathLength: 1 });
}

function guideLines(box) {
  const g = s('g', { class: 'wr-lines' });
  for (const [y, cls] of [[0, 'top'], [50, 'mid'], [100, 'base'], [150, 'low']]) {
    g.append(s('line', { x1: box.x, x2: box.x + box.w, y1: y, y2: y, class: `wr-line ${cls}` }));
  }
  return g;
}

/** Chữ mẫu tĩnh (thẻ chữ ở lưới, ô mẫu nhỏ ở bước C). */
export function letterSvg(letter, { lines = true, className = '' } = {}) {
  const box = letterBox(letter);
  const svg = s('svg', { viewBox: `${box.x} ${box.y} ${box.w} ${box.h}`, class: `wr-static ${className}`, 'aria-hidden': 'true' });
  if (lines) svg.append(guideLines(box));
  for (const st of LETTERS[letter].strokes) svg.append(modelEl(st, 'wr-solid'));
  return svg;
}

/**
 * Khung viết.
 * @param {{ letter: string, input: { sawPen: boolean }, penFirst: boolean, signal: AbortSignal }} o
 *   `input` dùng chung trong cả màn (đã thấy bút → bỏ qua ngón tay tới khi rời màn).
 */
export function createPad({ letter, input, penFirst, signal }) {
  const info = LETTERS[letter];
  const box = letterBox(letter);
  const svg = s('svg', { viewBox: `${box.x} ${box.y} ${box.w} ${box.h}`, class: 'wr-pad', role: 'img', 'aria-label': `Khung viết chữ ${letter}` });
  const model = s('g', { class: 'wr-model' });
  const done = s('g', { class: 'wr-done' });
  const ink = s('g', { class: 'wr-ink' });
  const hint = s('g', { class: 'wr-hint' });
  const models = info.strokes.map((st, i) => {
    const el = modelEl(st, 'wr-model-stroke');
    el.dataset.stroke = String(i);
    model.append(el);
    return el;
  });
  svg.append(guideLines(box), model, done, ink, hint);

  const pad = {
    el: svg,
    onStroke: null,
    locked: false,
    doneEls: new Map(),
    timers: new Set(),
  };
  let active = null; // { id, pts, path }
  let guideTimer = null;

  const later = (fn, ms) => {
    const id = setTimeout(() => {
      pad.timers.delete(id);
      fn();
    }, ms);
    pad.timers.add(id);
  };
  signal.addEventListener('abort', () => {
    for (const id of pad.timers) clearTimeout(id);
    clearInterval(guideTimer);
  }, { once: true });

  const toUnits = (e) => {
    const m = svg.getScreenCTM();
    if (!m) return null;
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
    return {
      x: Math.min(box.x + box.w, Math.max(box.x, p.x)),
      y: Math.min(box.y + box.h, Math.max(box.y, p.y)),
    };
  };
  const cancel = () => {
    if (!active) return;
    active.path.remove();
    active = null;
  };

  svg.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'pen') input.sawPen = true;
    if (pad.locked || active) return; // một con trỏ mỗi lúc
    if (penFirst && input.sawPen && e.pointerType === 'touch') return;
    const p = toUnits(e);
    if (!p) return;
    e.preventDefault();
    const path = s('path', { class: 'wr-ink-stroke' });
    ink.append(path);
    active = { id: e.pointerId, pts: [p], path };
    path.setAttribute('d', pathD(active.pts));
    try {
      svg.setPointerCapture(e.pointerId);
    } catch {
      // sự kiện giả lập / trình duyệt cũ
    }
  });
  svg.addEventListener('pointermove', (e) => {
    if (!active || e.pointerId !== active.id) return;
    const list = typeof e.getCoalescedEvents === 'function' && e.getCoalescedEvents().length ? e.getCoalescedEvents() : [e];
    for (const ev of list) {
      const p = toUnits(ev);
      if (p) active.pts.push(p);
    }
    active.path.setAttribute('d', pathD(active.pts));
  });
  svg.addEventListener('pointerup', (e) => {
    if (!active || e.pointerId !== active.id) return;
    const { pts, path } = active;
    active = null;
    try {
      svg.releasePointerCapture(e.pointerId);
    } catch {
      // không bắt
    }
    pad.onStroke?.(pts, path);
  });
  for (const type of ['pointercancel', 'lostpointercapture']) {
    svg.addEventListener(type, (e) => {
      if (active && e.pointerId === active.id) cancel();
    });
  }
  const onResize = () => cancel();
  window.addEventListener('resize', onResize);
  signal.addEventListener('abort', () => window.removeEventListener('resize', onResize), { once: true });

  /** Độ đậm chữ mẫu (B1 35%, B2 15%, C ẩn). */
  pad.setModel = (opacity) => {
    model.style.opacity = String(opacity);
  };

  /** Chấm xanh có số ở đầu nét i + mũi tên hướng đi (bước C không có mũi tên). */
  pad.showStart = (i, { arrow = true } = {}) => {
    hint.replaceChildren();
    if (i == null || i >= info.strokes.length) return;
    const { start, angle } = strokeEnds(info.strokes[i]);
    const dot = s('g', { class: 'wr-start', transform: `translate(${start.x} ${start.y})` });
    dot.append(s('circle', { r: 7.5 }), Object.assign(s('text', { y: 3.2 }), { textContent: String(i + 1) }));
    dot.dataset.stroke = String(i);
    if (arrow && !isDotStroke(info.strokes[i])) {
      const rad = (angle * Math.PI) / 180;
      const ax = start.x + Math.cos(rad) * 16;
      const ay = start.y + Math.sin(rad) * 16;
      hint.append(s('path', { class: 'wr-arrow', d: 'M-5 -4.5 L5 0 L-5 4.5 Z', transform: `translate(${ax.toFixed(1)} ${ay.toFixed(1)}) rotate(${angle.toFixed(0)})` }));
    }
    hint.append(dot);
  };

  pad.bounceStart = () => {
    const dot = hint.querySelector('.wr-start');
    if (!dot || reducedMotion()) return;
    dot.classList.remove('bounce');
    void dot.getBoundingClientRect();
    dot.classList.add('bounce');
  };

  /** Nét bé đúng → xanh lá (ink = nét bé; null = nét mẫu, khi Olly tự hoàn thành). */
  pad.markDone = (i, inkPath) => {
    const el = inkPath ?? modelEl(info.strokes[i], 'wr-auto');
    el.classList.add('wr-ok');
    el.dataset.stroke = String(i);
    done.append(el);
    pad.doneEls.set(i, el);
  };
  pad.removeDone = (i) => {
    pad.doneEls.get(i)?.remove();
    pad.doneEls.delete(i);
  };

  /** Nét sai mờ dần 0,4 giây rồi biến mất (giảm chuyển động: biến mất ngay). */
  pad.fadeInk = (inkPath) => {
    if (reducedMotion()) {
      inkPath.remove();
      return;
    }
    inkPath.classList.add('wr-fade');
    later(() => inkPath.remove(), scaled(400) + 20);
  };

  /** Nét mẫu i sáng lên một lần. */
  pad.flashStroke = (i) => {
    const el = models[i];
    el.classList.remove('wr-flash');
    void el.getBoundingClientRect();
    el.classList.add('wr-flash');
    later(() => el.classList.remove('wr-flash'), scaled(1200));
  };

  /** Chấm tròn chạy dọc nét mẫu i (mũi tên chạy / bút của Olly / tô có dẫn). */
  pad.runDot = (i, ms = 900) => new Promise((resolve) => {
    const pts = sampleStroke(info.strokes[i], 1).points;
    const dot = s('circle', { r: 5.5, class: 'wr-runner', cx: pts[0].x, cy: pts[0].y });
    hint.append(dot);
    const total = scaled(ms);
    const t0 = performance.now();
    const step = () => {
      const k = Math.min(1, (performance.now() - t0) / Math.max(1, total));
      const p = pts[Math.min(pts.length - 1, Math.round(k * (pts.length - 1)))];
      dot.setAttribute('cx', p.x.toFixed(1));
      dot.setAttribute('cy', p.y.toFixed(1));
      if (k < 1 && !signal.aborted) requestAnimationFrame(step);
      else {
        dot.remove();
        resolve();
      }
    };
    requestAnimationFrame(step);
  });

  /** Olly viết mẫu nét i (~0,8 giây, dashoffset) — bản sao đậm trên lớp mẫu; giảm chuyển động: hiện ngay. */
  pad.drawStroke = async (i, className = 'wr-pen') => {
    const el = modelEl(info.strokes[i], className);
    el.dataset.stroke = String(i);
    done.append(el);
    if (reducedMotion() || isDotStroke(info.strokes[i])) return el;
    el.style.strokeDasharray = '1';
    el.style.strokeDashoffset = '1';
    el.style.transition = `stroke-dashoffset ${scaled(800)}ms linear`;
    void el.getBoundingClientRect();
    el.style.strokeDashoffset = '0';
    await Promise.all([pad.runDot(i, 800), new Promise((r) => later(r, scaled(800) + 20))]);
    return el;
  };

  /** Tô có dẫn (5.5): nét mẫu i đậm lên, một chấm chạy chậm dọc nét lặp lại (giảm chuyển động: chỉ đậm + mũi tên). */
  pad.guide = (i) => {
    pad.unguide();
    models[i]?.classList.add('wr-guided');
    if (reducedMotion()) return;
    const loop = () => pad.runDot(i, 2400);
    loop();
    guideTimer = setInterval(loop, scaled(3000));
  };
  pad.unguide = () => {
    clearInterval(guideTimer);
    guideTimer = null;
    for (const m of models) m.classList.remove('wr-guided');
  };

  pad.lock = (on) => {
    pad.locked = on;
    if (on) cancel();
    svg.classList.toggle('locked', on);
  };
  pad.glow = () => svg.classList.add('wr-glow');
  pad.clearAll = () => {
    done.replaceChildren();
    ink.replaceChildren();
    pad.doneEls.clear();
  };
  return pad;
}
