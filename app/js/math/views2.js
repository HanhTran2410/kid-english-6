// Hình của 🔢 Toán phần 2 (SPEC-math2 2.1, 2.2, 3.1 → 3.4, 6): khay thẻ số, khung 10 ô, phép tính, hai hàng đồ của T8 (thẳng cột /
// lệch, dây nối từng cặp), bọ rùa T9. Chỉ dựng DOM; luồng bài nằm ở screens/math2.js.

import { h } from '../ui.js';
import { sleep } from '../timing.js';
import { reducedMotion } from './views.js';

/** Chờ trình duyệt vẽ lại: khi giảm chuyển động, app cho mọi thuộc tính chuyển 0,01 ms — đo ngay sau khi đổi lớp vẫn ra vị trí cũ. */
const nextFrame = () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

// ---------- Khay đáp án (2.2) ----------

/** Khay thẻ số; thứ tự cố định — thẻ không đổi chỗ khi bé sai. */
export function answerTray(options) {
  const cards = options.map((n) => h('button.mt-ans', { type: 'button', 'aria-label': String(n), dataset: { n: String(n) } }, h('span.mt-num', { text: String(n) })));
  return { el: h('div.mt-tray.mt-anstray', {}, ...cards), cards, cardOf: (n) => cards.find((c) => Number(c.dataset.n) === n) };
}

// ---------- Khung 10 ô (2.1) ----------

/**
 * Khung 2 × 5, lấp hàng trên trước, trái → phải. `cells`: kiểu từng ô theo thứ tự lấp ('blue' | 'orange' | 'dashed');
 * ô sau đó để trống. Ô có chấm chạm được để đếm (chạm lại không đếm lại); `onCount(k)` sau mỗi lần đếm.
 * `emoji`: ô chứa đồ của câu chuyện thay cho chấm (nền ô xanh / cam theo nhóm).
 */
export function tenFrame(cells, { onCount, emoji = null } = {}) {
  let count = 0;
  const els = Array.from({ length: 10 }, (_, i) => {
    const kind = cells[i];
    if (!kind) return h('span.mt-cell.empty', { dataset: { i: String(i) } });
    const el = h(`button.mt-cell.${kind}`, { type: 'button', 'aria-label': `Ô ${i + 1}`, dataset: { i: String(i), kind } },
      emoji ? h('span.mt-cpic', { text: emoji }) : h('span.mt-dot'));
    el.addEventListener('click', () => {
      if (el.classList.contains('counted')) return;
      el.classList.add('counted');
      count++;
      onCount?.(count, el);
    });
    return el;
  });
  const el = h(`div.mt-frame${emoji ? '.pics' : ''}`, { dataset: { filled: String(cells.length) } }, ...els);
  return {
    el,
    cells: els,
    /** Đổi kiểu một ô (cánh úp mở: 'dashed' → 'orange'). */
    setKind(i, kind) {
      els[i].classList.remove('blue', 'orange', 'dashed');
      els[i].classList.add(kind);
      els[i].dataset.kind = kind;
    },
    /** Đồ bị bớt (trừ, 2.1): ở nguyên ô, mờ + gạch chéo; `nudge`: nhích đi rồi về (giảm chuyển động: CSS bỏ). */
    cross(i, nudge = false) {
      els[i].classList.add('crossed');
      if (nudge) els[i].classList.add('nudge');
    },
    clearCount() {
      count = 0;
      els.forEach((c) => c.classList.remove('counted'));
    },
  };
}

// ---------- Phép tính dưới khung (T10, T11) ----------

/** `3 + 2 = ?` — từng số là một ô để làm sáng (số bắt đầu đếm tiếp); `solve()` thay ? bằng kết quả. */
export function equation(a, op, b, answer) {
  const A = h('span.mt-eqn', { text: String(a) });
  const B = h('span.mt-eqn', { text: String(b) });
  const R = h('span.mt-eqn.mt-eqq', { text: '?' });
  return {
    el: h('div.mt-eq', { 'aria-label': `${a} ${op} ${b}` }, A, h('span.mt-eqop', { text: op }), B, h('span.mt-eqop', { text: '=' }), R),
    a: A,
    b: B,
    solve() {
      R.textContent = String(answer);
      R.classList.add('solved');
    },
  };
}

// ---------- T8: hai hàng đồ (3.1) ----------

/**
 * Hai hàng, mỗi hàng một người (hình + tên + số đếm) và `n` đồ cùng loại. `layout` 'columns': đồ thẳng cột;
 * 'scattered' (mức 3): hàng dưới giãn đều, không thẳng cột — `align()` cho hàng dưới trượt về cột.
 * @param {{ name: string, face: string, n: number }} top
 * @param {{ name: string, face: string, n: number }} bottom
 */
export function twoRows(top, bottom, emoji, layout, onCount) {
  let count = 0;
  const thingsOf = (p) => Array.from({ length: p.n }, () => {
    const el = h('button.mt-tthing', { type: 'button', 'aria-label': emoji, text: emoji });
    el.addEventListener('click', () => {
      if (el.classList.contains('counted')) return;
      el.classList.add('counted');
      count++;
      onCount?.(count, el);
    });
    return el;
  });
  const row = (p, which, things) => h('div.mt-trow', { dataset: { row: which, name: p.name } },
    h('div.mt-twho', {}, h('span.mt-tface', { text: p.face }), h('span.mt-tname', { text: p.name })),
    h('div.mt-tthings', {}, ...things),
    h('span.mt-tcount', { text: String(p.n) }));
  const topThings = thingsOf(top);
  const bottomThings = thingsOf(bottom);
  const el = h(`div.mt-rows.${layout}`, {}, row(top, 'top', topThings), row(bottom, 'bottom', bottomThings));
  const n = Math.min(top.n, bottom.n);
  const extras = () => [...topThings.slice(n), ...bottomThings.slice(n)];
  return {
    el,
    topThings,
    bottomThings,
    get aligned() { return !el.classList.contains('scattered'); },
    /** Hàng dưới trượt về thẳng cột (~400 ms; giảm chuyển động: đổi ngay). */
    async align(signal) {
      if (!el.classList.contains('scattered')) return;
      const before = bottomThings.map((t) => t.getBoundingClientRect().left);
      el.classList.replace('scattered', 'columns');
      if (reducedMotion()) {
        await nextFrame();
        return;
      }
      bottomThings.forEach((t, i) => {
        t.style.transition = 'none';
        t.style.transform = `translateX(${before[i] - t.getBoundingClientRect().left}px)`;
      });
      void el.offsetWidth;
      bottomThings.forEach((t) => {
        t.style.transition = 'transform 400ms ease';
        t.style.transform = '';
      });
      await sleep(420, signal);
      bottomThings.forEach((t) => { t.style.transition = ''; });
    },
    /** Dây nối thẳng từng cặp (đồ thứ k hàng trên – đồ thứ k hàng dưới); giảm chuyển động: hiện cả loạt. */
    async drawLines(signal) {
      el.querySelector('.mt-lines')?.remove();
      const box = el.getBoundingClientRect();
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.classList.add('mt-lines');
      svg.setAttribute('aria-hidden', 'true');
      el.append(svg);
      const r = (v) => Math.round(v);
      for (let i = 0; i < n; i++) {
        const a = topThings[i].getBoundingClientRect();
        const b = bottomThings[i].getBoundingClientRect();
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', r(a.left + a.width / 2 - box.left));
        line.setAttribute('y1', r(a.bottom - box.top));
        line.setAttribute('x2', r(b.left + b.width / 2 - box.left));
        line.setAttribute('y2', r(b.top - box.top));
        svg.append(line);
        topThings[i].classList.add('paired');
        bottomThings[i].classList.add('paired');
        if (!reducedMotion()) await sleep(120, signal);
      }
      return svg.childElementCount;
    },
    get hasLines() { return !!el.querySelector('.mt-lines'); },
    /** Viền nhạt quanh phần hơn (mức 1 có sẵn). */
    outlineExtras() { extras().forEach((t) => t.classList.add('edge')); },
    /** Phần hơn sáng (sau khi đúng). */
    lightExtras() { extras().forEach((t) => t.classList.add('extra')); },
    extras,
  };
}

// ---------- T9: bọ rùa (3.2) ----------

/**
 * Bọ rùa: tổng trên đầu, hai cánh. Cánh úp có dấu ?; mở ra hiện chấm (cánh đã biết: xanh, cánh úp: cam).
 * Cánh có 0 chấm hiện số `0` to dưới cánh.
 */
export function ladybug(total, [left, right], hidden) {
  const wing = (side, n) => {
    const kind = side === hidden ? 'orange' : 'blue';
    return h(`div.mt-wing.w-${side}${side === hidden ? '.closed' : ''}`, { dataset: { side, n: String(n) } },
      h('div.mt-wdots', {}, ...Array.from({ length: n }, () => h(`span.mt-wdot.${kind}`))),
      n === 0 ? h('span.mt-wzero', { text: '0' }) : null,
      h('span.mt-wq', { text: '?' }));
  };
  const wings = { left: wing('left', left), right: wing('right', right) };
  const el = h('div.mt-bug', { 'aria-label': `Bọ rùa ${total} chấm` },
    h('div.mt-bughead', {}, h('span.mt-bugtotal', { text: String(total) })),
    h('div.mt-bugbody', {}, wings.left, wings.right));
  return {
    el,
    wings,
    open() { wings[hidden].classList.remove('closed'); },
  };
}
